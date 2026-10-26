"""The 2026-10-25 model bake-off: FLUX.2 klein 4B fp8 (A) against HiDream-O1-Image fp8_scaled (B), same prompts, same
references, same seeds (docs/ART_BAKEOFF_2026-10-25.md).

    python scripts/local-art/bakeoff_2026_10_25.py refs              CPU: the shared reference images
    python scripts/local-art/bakeoff_2026_10_25.py rows [--smoke]    CPU: the job rows for paint.py
    python scripts/local-art/paint.py <work>/rows.json --out <work>/raw     GPU, through the lease
    python scripts/local-art/bakeoff_2026_10_25.py finish            CPU: per-model sheets, seam-stitch + 3x3 checks
    python scripts/local-art/bakeoff_2026_10_25.py sheets            CPU: the two side-by-side sheets from <work>/picks.json

<work> is output/bakeoff-2026-10-25/ (git-ignored: the raw paintings are not kept in the repo; the sheets are).
Nothing here is wired into the game.
"""
import json
import os
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
WORK = os.path.join(ROOT, 'output', 'bakeoff-2026-10-25')
REFS = os.path.join(WORK, 'refs')
ATL = os.path.join(ROOT, 'public', 'assets', 'frontier-v1', 'atlases')
ROAD = json.load(open(os.path.join(ROOT, 'scripts', 'road-art', 'textures.json'), encoding='utf8'))
SEEDS = [1, 2, 3, 4]
MODELS = ['klein4b', 'hidream-o1']
LABEL = {'klein4b': 'A  FLUX.2 klein 4B fp8', 'hidream-o1': 'B  HiDream-O1 fp8_scaled'}
# Each model at its own native size: klein at ~1 MP (as the 2026-10-13 tiles and the plan), HiDream at its trained ~4 MP.
SIZE = {('road', 'klein4b'): (1024, 1024), ('road', 'hidream-o1'): (2048, 2048),
        ('scene', 'klein4b'): (1360, 768), ('scene', 'hidream-o1'): (2560, 1440)}

REF_NOTE = ('Use the reference images only for their colour palette and hand-painted brushwork, not for their shapes, '
            'layout or objects. Paint a new picture: ')
# The road tiles laid along a way must run one way (plan, batch 0): said in the prompt, the same for both models.
ALONG = {'road-wagon': ' Two parallel wheel ruts run straight down the frame from the top edge to the bottom edge.',
         'path-trodden': ' The trodden line runs straight down the middle of the frame from the top edge to the bottom edge.'}
ROAD_REFS = {'road-wagon': ['ref-astra-earth.png', 'ref-game-ground.png'],
             'street-earth': ['ref-astra-earth.png', 'ref-game-ground.png'],
             'path-trodden': ['ref-astra-grass.png', 'ref-game-ground.png'],
             'road-verge': ['ref-astra-grass.png', 'ref-game-ground.png']}

SCENE = 'scene-street-gonzales'
SCENE_PROMPT = (
    'Image 1 is the style reference: match its palette, its detailed hand-painted brushwork and the look of its oaks, grass '
    'and rutted road, but paint even midday light instead of its sunset. Image 2 shows the kind of buildings: small log '
    'houses, a log store, an open smithy shed. Paint a new wide landscape picture: the main street of Gonzales, a small '
    'Anglo-American colonial town in Mexican Texas in 1835, on the east bank of the Guadalupe River, seen from eye level '
    'with the camera slightly raised. A wide rutted dirt wagon street runs away from the viewer up the middle of the '
    'picture toward the river. A few single-storey log cabins with shake roofs and stick-and-clay chimneys, a log store '
    'with a plank porch, and an open-sided blacksmith shed stand well apart along both sides of the street, set back '
    'behind split-rail fences, with post oaks and live oaks between them. Beyond the far end of the street the road goes '
    'down to the river, lined with tall pecans and cottonwoods. The horizon sits one third of the way down the picture, '
    'under a wide summer sky with soft white clouds. The middle of the picture and the near foreground are open, empty '
    'street and grass with nothing tall in them. Even, mild daylight with soft short shadows, no sunset. Hand-painted '
    'storybook game art: warm detailed gouache and oil brushwork, muted warm earth palette. No people, no animals, no '
    'wagons, no lettering on any building, no text, no signature, no watermark.')
SCENE_REFS = ['ref-astra-landscape.png', 'ref-astra-gonzales-buildings.png']


def road_prompt(t):
    return REF_NOTE + t['subject'] + ALONG.get(t['name'], '') + ' ' + ROAD['style']


def make_refs():
    os.makedirs(REFS, exist_ok=True)
    frames = json.load(open(os.path.join(ROOT, 'public', 'assets', 'frontier-v1', 'atlas.json'), encoding='utf8'))['frames']

    def frame(name):
        f = frames[name]
        return Image.open(os.path.join(ATL, f['sheet'] + '.png')).convert('RGBA').crop((f['x'], f['y'], f['x'] + f['w'], f['y'] + f['h']))

    # The game's ground: the map before the road tiles (docs/evidence/roads-before-land.png), a corner with no UI.
    g = Image.open(os.path.join(ROOT, 'docs', 'evidence', 'roads-before-land.png')).convert('RGB').crop((1010, 130, 1366, 480))
    g = g.resize((768, 768), Image.LANCZOS)
    g.save(os.path.join(REFS, 'ref-game-ground.png'))
    bg = tuple(int(v) for v in np.asarray(g).reshape(-1, 3).mean(0))
    # Astra's earth: the four path-and-bank pieces of grass-creek-terrain's top row, 2x2 on the ground colour.
    gct = Image.open(os.path.join(ATL, 'grass-creek-terrain.png')).convert('RGBA')
    top = gct.crop((0, 0, gct.width, gct.height // 2))
    w = top.width // 4
    b = Image.new('RGB', (1024, 1024), bg)
    for k in range(4):
        p = top.crop((k * w, 0, (k + 1) * w, top.height))
        p = p.crop(p.getbbox())
        p.thumbnail((500, 500))
        b.paste(p, ((k % 2) * 512 + (512 - p.width) // 2, (k // 2) * 512 + (512 - p.height) // 2), p)
    b.save(os.path.join(REFS, 'ref-astra-earth.png'))
    # Astra's grass: concepcion-bank-terrain's grassy creek pieces (its lower two thirds) on the ground colour.
    cb = Image.open(os.path.join(ATL, 'concepcion-bank-terrain.png')).convert('RGBA')
    p = cb.crop((0, cb.height // 3, cb.width, cb.height))
    p.thumbnail((1024, 768))
    b = Image.new('RGB', (1024, 768), bg)
    b.paste(p, ((1024 - p.width) // 2, (768 - p.height) // 2), p)
    b.save(os.path.join(REFS, 'ref-astra-grass.png'))
    # Astra's painted Texas landscape, and the Gonzales street's buildings (public/rider-scene.js STREET.gonzales).
    Image.open(os.path.join(ROOT, 'public', 'assets', 'creation-title-landscape.png')).convert('RGB').resize((1344, 756), Image.LANCZOS) \
        .save(os.path.join(REFS, 'ref-astra-landscape.png'))
    ims = [frame(n) for n in ['storehouse', 'cabin-wide', 'shop-blacksmith', 'shop-carpenter']]
    ims = [i.resize((int(i.width * 300 / i.height), 300), Image.LANCZOS) for i in ims]
    b = Image.new('RGB', (sum(i.width for i in ims) + 40 * (len(ims) + 1), 380), (236, 228, 208))
    x = 40
    for i in ims:
        b.paste(i, (x, 40), i)
        x += i.width + 40
    b.save(os.path.join(REFS, 'ref-astra-gonzales-buildings.png'))
    print(REFS)


def make_rows(smoke=False):
    rows = []
    for model in MODELS:
        for t in ROAD['textures']:
            w, h = SIZE[('road', model)]
            rows.append({'name': f"{model}-{t['name']}", 'model': model, 'prompt': road_prompt(t),
                         'refs': [os.path.join(REFS, r) for r in ROAD_REFS[t['name']]], 'width': w, 'height': h, 'seeds': SEEDS})
        w, h = SIZE[('scene', model)]
        rows.append({'name': f'{model}-{SCENE}', 'model': model, 'prompt': SCENE_PROMPT,
                     'refs': [os.path.join(REFS, r) for r in SCENE_REFS], 'width': w, 'height': h, 'seeds': SEEDS})
    if smoke:   # one reference edit per model, the first real job of each
        rows = [dict(r, seeds=[1]) for r in rows if r['name'].endswith('road-wagon')]
    path = os.path.join(WORK, 'rows-smoke.json' if smoke else 'rows.json')
    json.dump(rows, open(path, 'w', encoding='utf8'), indent=1)
    print(path)


# --- CPU after the paintings -------------------------------------------------------------------------------------------

def font(size, bold=False):
    try:
        return ImageFont.truetype('arialbd.ttf' if bold else 'arial.ttf', size)
    except OSError:
        return ImageFont.load_default()


def raw(model, name, seed):
    return os.path.join(WORK, 'raw', f'{model}-{name}', f'{model}-{name}-s{seed}_00001_.png')


def scene_cut(path, out_w=960, out_h=540):
    """The backdrop contract: crop to 16:9 about the middle, Lanczos to 960x540."""
    im = Image.open(path).convert('RGB')
    h = round(im.width * 9 / 16)
    if h > im.height:
        w = round(im.height * 16 / 9)
        im = im.crop(((im.width - w) // 2, 0, (im.width - w) // 2 + w, im.height))
    else:
        im = im.crop((0, (im.height - h) // 2, im.width, (im.height - h) // 2 + h))
    return im.resize((out_w, out_h), Image.LANCZOS)


def seam_tile(model, texture, seed):
    """scripts/road-art/finish.py's seam-stitch and colour, unchanged, on one candidate (scaled to its 1024 first)."""
    sys.path.insert(0, os.path.join(ROOT, 'scripts', 'road-art'))
    import finish
    src = os.path.dirname(raw(model, texture['name'], seed))
    t = dict(texture, candidate=seed, crop=None)
    tmp = os.path.join(WORK, 'tmp-1024')
    os.makedirs(tmp, exist_ok=True)
    Image.open(raw(model, texture['name'], seed)).convert('RGB').resize((1024, 1024), Image.LANCZOS) \
        .save(os.path.join(tmp, f"{texture['name']}-s{seed}_00001_.png"))
    a = finish.seamless(t, tmp)
    return Image.fromarray(finish.colour(a, t['target'], t['keep']).astype(np.uint8))


def grid3(tile, cell):
    t = tile.resize((cell, cell), Image.LANCZOS)
    g = Image.new('RGB', (3 * cell, 3 * cell))
    for gx in range(3):
        for gy in range(3):
            g.paste(t, (gx * cell, gy * cell))
    return g


def finish_all():
    """Per model: every road candidate raw, and its 3x3 after the seam-stitch; every backdrop at contract size."""
    out = os.path.join(WORK, 'review')
    os.makedirs(out, exist_ok=True)
    f = font(16, True)
    for model in MODELS:
        c, pad = 300, 8
        s = Image.new('RGB', (len(SEEDS) * 2 * (c + pad), len(ROAD['textures']) * (c + 30)), 'white')
        d = ImageDraw.Draw(s)
        for i, t in enumerate(ROAD['textures']):
            for j, seed in enumerate(SEEDS):
                p = raw(model, t['name'], seed)
                x, y = j * 2 * (c + pad), i * (c + 30)
                if not os.path.exists(p):
                    d.text((x + 4, y + 30), 'FAILED', fill='red', font=f)
                    continue
                s.paste(Image.open(p).convert('RGB').resize((c, c), Image.LANCZOS), (x, y + 26))
                s.paste(grid3(seam_tile(model, t, seed), c // 3), (x + c + pad // 2, y + 26))
                d.text((x + 4, y + 4), f"{t['name']} s{seed}  raw | 3x3 after seam-stitch", fill='black', font=f)
        s.save(os.path.join(out, f'roads-{model}.jpg'), quality=88)
        cw, ch = 640, 360
        s = Image.new('RGB', (2 * (cw + pad), 2 * (ch + 30)), 'white')
        d = ImageDraw.Draw(s)
        for j, seed in enumerate(SEEDS):
            p = raw(model, SCENE, seed)
            x, y = (j % 2) * (cw + pad), (j // 2) * (ch + 30)
            d.text((x + 4, y + 4), f'{SCENE} s{seed}', fill='black', font=f)
            if os.path.exists(p):
                s.paste(scene_cut(p).resize((cw, ch), Image.LANCZOS), (x, y + 26))
        s.save(os.path.join(out, f'scene-{model}.jpg'), quality=88)
    print(out)


def labelled(img, text, w):
    img = img.copy()
    img.thumbnail((w, w * 2))
    out = Image.new('RGB', (img.width, img.height + 30), 'white')
    out.paste(img, (0, 30))
    ImageDraw.Draw(out).text((4, 6), text, fill='black', font=font(17, True))
    return out


def side_by_side():
    """docs/evidence/bakeoff-roads.png and bakeoff-backdrop.png from the picks in <WORK>/picks.json:
    {"roads": {"klein4b": {"road-wagon": [s, s], ...}, "hidream-o1": {...}}, "scene": {"klein4b": [s, s], "hidream-o1": [s, s]}}"""
    picks = json.load(open(os.path.join(WORK, 'picks.json'), encoding='utf8'))
    ev = os.path.join(ROOT, 'docs', 'evidence')
    # Roads: one row per tile; A's best two then B's best two, each as painted and as its 3x3 after the seam-stitch.
    c, gap = 220, 10
    rows = []
    for t in ROAD['textures']:
        cells = []
        for model in MODELS:
            for seed in picks['roads'][model][t['name']]:
                pr = Image.open(raw(model, t['name'], seed)).convert('RGB').resize((c, c), Image.LANCZOS)
                g = grid3(seam_tile(model, t, seed), c // 3 * 1).resize((c, c))
                pair = Image.new('RGB', (2 * c + 4, c), 'white')
                pair.paste(pr, (0, 0))
                pair.paste(g, (c + 4, 0))
                cells.append(labelled(pair, f"{LABEL[model][:1]}  {t['name']} s{seed}", 2 * c + 4))
        rows.append(cells)
    head = 44
    W = sum(x.width for x in rows[0]) + gap * (len(rows[0]) + 1) + 2 * gap
    H = head + sum(r[0].height for r in rows) + gap * (len(rows) + 1)
    s = Image.new('RGB', (W, H), (245, 241, 232))
    d = ImageDraw.Draw(s)
    half = 2 * (rows[0][0].width + gap)
    d.text((gap, 10), LABEL['klein4b'] + '  (best 2; as painted | 3x3 after seam-stitch)', fill=(20, 60, 140), font=font(19, True))
    d.text((gap + half + 2 * gap, 10), LABEL['hidream-o1'] + '  (best 2; as painted | 3x3 after seam-stitch)', fill=(140, 40, 20), font=font(19, True))
    y = head
    for r in rows:
        x = gap
        for k, cell in enumerate(r):
            if k == 2:
                d.line([(x + gap // 2, y), (x + gap // 2, y + cell.height)], fill=(80, 80, 80), width=3)
                x += 2 * gap
            s.paste(cell, (x, y))
            x += cell.width + gap
        y += r[0].height + gap
    s.save(os.path.join(ev, 'bakeoff-roads.png'), optimize=True)
    # Backdrop: A's best two on top, B's below, each at the contract's 960x540 shown at 640x360.
    cells = [[labelled(scene_cut(raw(m, SCENE, sd)).resize((640, 360), Image.LANCZOS), f'{LABEL[m]}  s{sd}', 640)
              for sd in picks['scene'][m]] for m in MODELS]
    s = Image.new('RGB', (2 * 640 + 3 * gap, 2 * (360 + 30) + 3 * gap), (245, 241, 232))
    for i, row in enumerate(cells):
        for j, cell in enumerate(row):
            s.paste(cell, (gap + j * (640 + gap), gap + i * (cell.height + gap)))
    s.save(os.path.join(ev, 'bakeoff-backdrop.png'), optimize=True)
    print(os.path.join(ev, 'bakeoff-roads.png'), os.path.join(ev, 'bakeoff-backdrop.png'))


if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else ''
    if cmd == 'refs':
        make_refs()
    elif cmd == 'rows':
        make_rows(smoke='--smoke' in sys.argv)
    elif cmd == 'finish':
        finish_all()
    elif cmd == 'sheets':
        side_by_side()
    else:
        print(__doc__)
