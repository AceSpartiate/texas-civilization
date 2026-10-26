"""Astra's rear walls raised to the front walls' height by copying her own courses (plan, batch 2; request 2026-10-13).

    python scripts/local-art/rear_courses.py [--write]      CPU only; without --write it only makes the preview

Her rear walls (`house-round-back-*`, `house-hewn-back-*`, sheet `house-back-views`, 2026-10-11) stand lower than her front
walls of the same pen. No model repaints them: in each frame a line is found that runs along one dark seam between two
courses across both near faces (parallel to the frame's own ground edges, so it follows the logs), and the course just
below it is the period of the wall. Everything above the line - the higher courses, the open top, the far walls inside and
their corner ends - is lifted by that period, and the gap is filled with a copy of the course below the line. So the corner
notches and log ends repeat as hers do, the door on the long side grows by the course it is cut through, and the ground,
the footprint and every pixel below the line stay exactly where she drew them.

How many courses (measured, front-sheet pixels from the ground to the wall top, the rear scaled by its `roofScale`):
round full 125 against 108 -> one course; round low 92 against 77 -> one, not done (see ADD); hewn full 134 against 104 -> two of its thinner
courses (16-17 px); hewn low 85 against 82 -> none, left as she drew it.
"""
import json
import os
import sys

import numpy as np
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
SHEET = os.path.join(ROOT, 'public', 'assets', 'frontier-v1', 'atlases', 'house-back-views.png')
# ceiling: the full walls only. Her round low walls are drawn with courses that fan (19 px at the far corner, 24 at the
# near one), so one lifted band leaves a broken seam across both faces (tried 2026-10-26, rear-courses.png); they stay
# 15 front-sheet px low while a pen goes up. Raising them needs a per-face pitch or Astra's own redraw.
ADD = {'house-round-back-full-walls': 1, 'house-hewn-back-full-walls': 2}


def ground_line(alpha):
    """The frame's foot as a function of x: the two ground edges from the left corner to the front corner to the right."""
    h, w = alpha.shape
    cols = np.where(alpha.max(0) > 128)[0]
    foot = np.array([np.where(alpha[:, x] > 128)[0].max() if alpha[:, x].max() > 128 else -1 for x in range(w)])
    x0, x1 = cols.min() + 3, cols.max() - 3
    xf = int(np.argmax(foot))
    left, front, right = (x0, foot[x0]), (xf, foot[xf]), (x1, foot[x1])
    xs = np.arange(w, dtype=float)
    line = np.where(xs <= xf, front[1] + (left[1] - front[1]) * (xf - xs) / max(1, xf - x0),
                    front[1] + (right[1] - front[1]) * (xs - xf) / max(1, x1 - xf))
    return line, x0, x1, xf


def cut_and_pitch(a):
    """The rows of the seam the courses are cut along, and the course pitch, both measured in the frame."""
    alpha, lum = a[..., 3], a[..., :3].mean(2)
    line, x0, x1, xf = ground_line(alpha)
    xs = np.arange(x0, x1 + 1)
    top = np.array([np.where(alpha[:, x] > 128)[0].min() for x in xs])
    face = float(np.median(line[xs] - top))
    best = None
    for h in np.arange(face * 0.22, face * 0.5, 0.5):        # a dark seam low on the near faces, clear of the wall top
        ys = np.round(line[xs] - h).astype(int)
        score = lum[ys, xs].mean()
        if best is None or score < best[0]:
            best = (score, h)
    h = best[1]
    yc = np.round(line - h).astype(int)
    pbest = None
    for p in range(15, 23):                                   # the period of the courses just below the seam (her logs: 16-21 px)
        d = [np.abs(a[yc[x] + k, x, :3] - a[yc[x] + k + p, x, :3]).mean() for x in xs[::2] for k in range(0, p, 2)
             if yc[x] + k + p < a.shape[0] and alpha[yc[x] + k + p, x] > 128]
        score = np.mean(d)
        if pbest is None or score < pbest[0]:
            pbest = (score, p)
    return yc, x0, x1, pbest[1], h


def raise_once(a):
    """One course more: rows above the seam lifted by the pitch, the gap filled with the course below it."""
    yc, x0, x1, p, h = cut_and_pitch(a)
    H, W = a.shape[:2]
    out = np.zeros((H + p, W, 4), a.dtype)
    out[p:] = a                                               # everything at its place from the foot
    for x in range(W):
        c = yc[x] if x0 - 3 <= x <= x1 + 3 else H             # outside the walls nothing moves (it is clear)
        c = min(max(c, 0), H)
        out[:c, x] = a[:c, x]                                 # above the seam: lifted by p (rows 0..c of the new frame)
        out[c:c + p, x] = a[c:c + p, x] if c + p <= H else out[c:c + p, x]   # the copied course
    return out, p, h


def main(write):
    sheet = Image.open(SHEET).convert('RGBA')
    frames = json.load(open(os.path.join(ROOT, 'public', 'assets', 'frontier-v1', 'atlas.json'), encoding='utf8'))['frames']
    s = np.asarray(sheet).copy()
    previews = []
    for name, n in ADD.items():
        f = frames[name]
        x, y, w, hgt = f['x'], f['y'], f['w'], f['h']
        a = s[y:y + hgt, x:x + w].astype(np.float32)
        before = a.copy()
        added = 0
        for _ in range(n):
            a, p, h = raise_once(a)
            added += p
            print(f'{name}: +1 course, pitch {p} px, cut {h:.1f} px above the foot')
        assert y - added >= 0
        assert s[y - added:y, x:x + w, 3].max() <= 8, f'{name}: the gutter above it is not clear'
        s[y - added:y + hgt, x:x + w] = a.astype(np.uint8)    # the clear gutter above the frame takes the lifted top
        pair = Image.new('RGBA', (2 * w + 30, hgt + added + 20), (255, 255, 255, 255))
        pair.alpha_composite(Image.fromarray(before.astype(np.uint8)), (10, 10 + added))
        pair.alpha_composite(Image.fromarray(a.astype(np.uint8)), (w + 20, 10))
        previews.append(pair)
    W = sum(p.width for p in previews)
    H = max(p.height for p in previews)
    sheet_preview = Image.new('RGB', (W, H), 'white')
    xo = 0
    for p in previews:
        sheet_preview.paste(p.convert('RGB'), (xo, 0))
        xo += p.width
    out = os.path.join(ROOT, 'output', 'local-2026-10-26', 'b2', 'rear-courses.png')
    os.makedirs(os.path.dirname(out), exist_ok=True)
    sheet_preview.save(out)
    print(out)
    if write:
        Image.fromarray(s).save(SHEET, optimize=True)
        print('wrote', SHEET)


if __name__ == '__main__':
    main('--write' in sys.argv)
