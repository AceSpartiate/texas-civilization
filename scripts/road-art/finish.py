"""Turn the chosen road candidates (scripts/road-art/generate.py) into the game's seamless tiles and their sheet (2026-10-13; the klein 4B repaint, 2026-10-26).

    python scripts/road-art/finish.py <work_dir> [<raw_dir>]     CPU only: seam, colour, size to 512, pack, the 3x3 check

Reads <raw_dir>/<texture>-s<seed>_00001_.png (default <work_dir>/raw), the chosen candidate of each
(scripts/road-art/textures.json; the four as painted are kept in docs/art-sources/ground-roads-2026-10-26/raw/), and writes
<work_dir>/final/: each tile at 1024 (`<texture>-1024.png`) and 512, `ground-roads.png` and `tiling-3x3.png`. Deterministic:
the same raw paintings make the same sheet.

How a tile is made seamless, from the painting's own pixels and nothing else:

1. Its broad light and dark is taken out (`flatten`), keeping all its detail: a repeated tile with one light corner reads as
   a chequerboard however clean its seams.
2. It is rolled half its size, so its own edges meet in the middle and its new edges are the middle of the painting, which
   already continues on every side.
3. The seam left across the middle is covered by a band cut from elsewhere in the same painting, chosen where it matches what
   lies either side, and joined to them along the line of least difference (`quilt`; Efros and Freeman's image quilting).
   Nothing is blended across a seam, so nothing is blurred or doubled. The edges are never touched, so the tile still meets
   itself exactly.

A tile laid along a road (`along`: the ruts, the trodden line) only has to repeat down its length, so it is rolled down only,
and the band is cut from the same columns, so the ruts run straight through it. A tile laid flat is done down and then across.

Tried first and rejected, 2026-10-13: repainting the seam with a FLUX.2 klein (9B) reference edit of the rolled tile (4 seeds, two
passes through the GPU lease). Shown the seam, the edit kept the line; shown it blurred, it kept the blur. A reference edit
holds to its reference, which is what it is for.

Then each is moved to the game's road colours (its mean, and its spread kept at the share given) so it sits on the map beside
the flat strokes it replaces, and halved to 512: the sheet `ground-roads` is the four tiles on a 2x2 grid, each in a clear 768
cell, which scripts/build-atlas-manifest.mjs measures like any other sheet.
"""
import json
import os
import sys

import numpy as np
from PIL import Image, ImageFilter

RECORD = json.load(open(os.path.join(os.path.dirname(__file__), 'textures.json'), encoding='utf8'))
TEXTURES = RECORD['textures']
SIZE, TILE, CELL = 1024, 512, 768
BAND, OVERLAP = 288, 72   # the band laid over a seam, and how much of it overlaps the painting either side


def flatten(a, sigma=72, amount=0.85):
    """Take out most of the painting's broad light and dark, keeping its detail."""
    broad = np.asarray(Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(sigma))).astype(np.float32)
    return np.clip(a - amount * (broad - broad.reshape(-1, 3).mean(0)), 0, 255)


def cut(error):
    """The path of least summed error down an overlap: one column chosen a row, moving at most one column a row."""
    rows, cols = error.shape
    cost = error.copy()
    for r in range(1, rows):
        left = np.r_[np.inf, cost[r - 1, :-1]]
        right = np.r_[cost[r - 1, 1:], np.inf]
        cost[r] += np.minimum(np.minimum(left, cost[r - 1]), right)
    path = np.empty(rows, int)
    path[-1] = int(np.argmin(cost[-1]))
    for r in range(rows - 2, -1, -1):
        c = path[r + 1]
        lo, hi = max(0, c - 1), min(cols, c + 2)
        path[r] = lo + int(np.argmin(cost[r, lo:hi]))
    return path


def quilt(base, source, forbid=None):
    """Cover the seam across the middle rows of `base` with a band of rows cut from `source` (the same columns), joined along
    the least-difference line in each overlap. `forbid` is a row of `source` no band may run across into (a seam of its own)."""
    top = SIZE // 2 - BAND // 2
    best = None
    for start in range(0, SIZE, 4):
        rows = (np.arange(BAND) + start) % SIZE
        if forbid is not None and forbid in rows[1:]:
            continue
        band = source[rows]
        e = ((band[:OVERLAP] - base[top:top + OVERLAP]) ** 2).sum() + ((band[-OVERLAP:] - base[top + BAND - OVERLAP:top + BAND]) ** 2).sum()
        if best is None or e < best[0]:
            best = (e, band)
    band = best[1]
    mask = np.ones((BAND, SIZE), np.float32)          # 1: the band, 0: the painting it is laid on
    upper = ((band[:OVERLAP] - base[top:top + OVERLAP]) ** 2).sum(2)
    lower = ((band[-OVERLAP:] - base[top + BAND - OVERLAP:top + BAND]) ** 2).sum(2)
    for x, y in enumerate(cut(upper.T)):              # a line across each overlap: one row a column
        mask[:y, x] = 0
    for x, y in enumerate(cut(lower.T)):
        mask[BAND - OVERLAP + y:, x] = 0
    # A pixel of softening along the cut, which is a line between like pixels: not a blend of two paintings.
    mask = np.asarray(Image.fromarray((mask * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))).astype(np.float32)[..., None] / 255
    out = base.copy()
    out[top:top + BAND] = band * mask + base[top:top + BAND] * (1 - mask)
    return out


def seamless(texture, raw_dir):
    im = Image.open(os.path.join(raw_dir, f"{texture['name']}-s{texture['candidate']}_00001_.png")).convert('RGB')
    if texture['crop']:
        im = im.crop(tuple(texture['crop']))
    a = flatten(np.asarray(im.resize((SIZE, SIZE), Image.LANCZOS)).astype(np.float32))
    flat = texture['laid'] == 'flat'
    source = np.roll(a, SIZE // 2, axis=1) if flat else a             # in the columns the rolled tile has
    # The seam across the middle; no band may run across the source's own top and bottom, which is that seam.
    tile = quilt(np.roll(source, SIZE // 2, axis=0), source, forbid=0)
    if flat:                                                           # the seam down the middle, as rows of the turned tile
        turned = np.ascontiguousarray(np.transpose(tile, (1, 0, 2)))
        tile = np.transpose(quilt(turned, turned, forbid=SIZE // 2), (1, 0, 2))
    return tile


def colour(a, target, keep):
    mean = a.reshape(-1, 3).mean(0)
    return np.clip((a - mean) * keep + np.array(target, np.float32), 0, 255)


def main(work, raw):
    out = os.path.join(work, 'final')
    os.makedirs(out, exist_ok=True)
    # Each tile in the middle of a 768 cell: the atlas build refuses a sheet under a quarter clear (a baked background).
    sheet = Image.new('RGBA', (2 * CELL, 2 * CELL), (0, 0, 0, 0))
    checks = []
    for i, texture in enumerate(TEXTURES):
        tile = Image.fromarray(colour(seamless(texture, raw), texture['target'], texture['keep']).astype(np.uint8))
        tile.save(os.path.join(out, f"{texture['name']}-1024.png"))
        small = tile.resize((TILE, TILE), Image.LANCZOS)
        small.save(os.path.join(out, f"{texture['name']}.png"))
        off = (CELL - TILE) // 2
        sheet.paste(small.convert('RGBA'), ((i % 2) * CELL + off, (i // 2) * CELL + off))
        # The tiling check: 3x3 at half size, each seam of the repeat on it twice.
        half = small.resize((TILE // 2, TILE // 2), Image.LANCZOS)
        grid = Image.new('RGB', (3 * TILE // 2, 3 * TILE // 2))
        for gx in range(3):
            for gy in range(3):
                grid.paste(half, (gx * TILE // 2, gy * TILE // 2))
        checks.append(grid)
    sheet.save(os.path.join(out, 'ground-roads.png'), optimize=True)
    contact = Image.new('RGB', (2 * checks[0].width + 16, 2 * checks[0].height + 16), 'white')
    for i, grid in enumerate(checks):
        contact.paste(grid, ((i % 2) * (grid.width + 16), (i // 2) * (grid.height + 16)))
    contact.save(os.path.join(out, 'tiling-3x3.png'))
    print(os.path.join(out, 'ground-roads.png'))


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else os.path.join(sys.argv[1], 'raw'))
