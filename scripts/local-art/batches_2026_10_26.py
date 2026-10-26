"""The stand-in batches of docs/ART_PLAN_LOCAL_2026-10-25.md painted with FLUX.2 klein 4B fp8 (owner's pick, 2026-10-26).

    python scripts/local-art/batches_2026_10_26.py refs <batch>        CPU: the batch's reference boards from Astra's frames
    python scripts/local-art/batches_2026_10_26.py rows <batch> [--stage <s>]   CPU: rows for paint.py
    python scripts/local-art/paint.py <work>/<batch>/rows[-<s>].json --out <work>/<batch>/raw     GPU, through the lease
    python scripts/local-art/licence_check.py <work>/<batch>/raw/<item>          CPU: each picture's own model
    python scripts/local-art/batches_2026_10_26.py sheet <batch>       CPU: one contact sheet per item for the review
    python scripts/local-art/batches_2026_10_26.py finish <batch>      CPU: the picks (picks.json) cut, matched and packed

<work> is output/local-2026-10-26/ (git-ignored). The chosen raw paintings and the contact sheets are copied into
docs/art-sources/<sheet>-2026-10-26/ by `finish`; the packed sheets go to public/assets/frontier-v1/atlases/.
References are Astra's own frames only (plan §0.1.2): nothing painted by klein 9B is ever a reference.
"""
import json
import os
import shutil
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
WORK = os.path.join(ROOT, 'output', 'local-2026-10-26')
ATL = os.path.join(ROOT, 'public', 'assets', 'frontier-v1', 'atlases')
SOURCES = os.path.join(ROOT, 'docs', 'art-sources')
DATE = '2026-10-26'
CREAM = (236, 228, 208)
_FRAMES = None


def frames():
    global _FRAMES
    if _FRAMES is None:
        _FRAMES = json.load(open(os.path.join(ROOT, 'public', 'assets', 'frontier-v1', 'atlas.json'), encoding='utf8'))['frames']
    return _FRAMES


def frame(name):
    """One of Astra's frames, cut from its sheet (RGBA)."""
    f = frames()[name]
    return Image.open(os.path.join(ATL, f['sheet'] + '.png')).convert('RGBA').crop((f['x'], f['y'], f['x'] + f['w'], f['y'] + f['h']))


def board(names, path, height=300, bg=CREAM, gap=40, width=None):
    """Astra's frames side by side on a plain ground, each scaled to `height`: a reference for kind, line and palette."""
    ims = [frame(n) for n in names]
    ims = [i.resize((max(1, int(i.width * height / i.height)), height), Image.LANCZOS) for i in ims]
    w = width or sum(i.width for i in ims) + gap * (len(ims) + 1)
    b = Image.new('RGB', (w, height + 2 * gap), bg)
    x = gap
    for i in ims:
        b.paste(i, (x, gap), i)
        x += i.width + gap
    b.save(path)
    return path


def font(size, bold=True):
    try:
        return ImageFont.truetype('arialbd.ttf' if bold else 'arial.ttf', size)
    except OSError:
        return ImageFont.load_default()


# --- the house style of every prompt ------------------------------------------------------------------------------------

STYLE_NOTE = ('Hand-painted storybook game art for a warm illustrated 1830s Texas frontier game: warm detailed gouache and '
              'oil brushwork, muted warm earth palette.')
NO_TEXT = 'No lettering anywhere, no text, no signature, no watermark.'


# --- batch 1: the rider scenes' backdrops and the courtship yards -------------------------------------------------------

LANDSCAPE = 'ref-astra-landscape.png'
B1_STYLE = ('Image 1 is the style reference: match its palette, its detailed hand-painted brushwork and the look of its oaks, '
            'grass and rutted road, but paint even midday light instead of its sunset. ')
B1_FRAME = ('Seen from eye level with the camera slightly raised. The horizon sits one third of the way down the picture, under '
            'a wide summer sky with soft white clouds. The middle of the picture and the near foreground are open, empty ground '
            'with nothing tall in them. Even, mild daylight with soft short shadows, no sunset. ' + STYLE_NOTE +
            ' No people, no animals, no wagons, no lettering on any building, no text, no signature, no watermark.')

B1 = [
    {'name': 'scene-street-gonzales', 'board': ['storehouse', 'cabin-wide', 'shop-blacksmith', 'shop-carpenter'],
     'prompt': None},   # the bake-off's prompt, unchanged: its four seeds are reused (ART_BAKEOFF_2026-10-25.md, test 2)
    {'name': 'scene-street-texian', 'board': ['storehouse', 'cabin-wide', 'shop-blacksmith', 'shop-tavern'],
     'subject': 'Image 2 shows the kind of buildings: log stores, a log cabin, an open smithy shed and a log tavern. Paint a new '
                'wide landscape picture: the main street of a small Anglo-American colonial town in Mexican Texas in 1835. A wide '
                'rutted dirt wagon track runs away from the viewer up the middle of the picture. On the left stand a log store with '
                'a plank porch and an open-sided blacksmith shed; on the right a two-storey log tavern with a roofed gallery along '
                'its front. A split-rail fence runs along the street, post oaks between the buildings, all set well back. '},
    {'name': 'scene-street-tejano', 'board': ['jacal-broad', 'jacal-ramada', 'town-mexican-river', 'church-generic'],
     'subject': 'Image 2 shows the kind of buildings: flat-roofed stone and adobe houses, a jacal of upright poles with a thatched '
                'roof and a brush ramada, and a plain stone mission church front. Paint a new wide landscape picture: a dusty '
                'street of a Mexican town in Texas in 1835. Flat-roofed whitewashed stone and adobe houses with small deep '
                'windows and wooden doors line both sides, set well back, with a jacal and its ramada among them. At the far end '
                'of the street stands a plain stone church front with a small bell gable. A few mesquite and pecan trees. '},
    {'name': 'scene-camp-volunteers', 'board': ['tent', 'campfire', 'camp-cookpot-tripod', 'post-oak-large'],
     'subject': 'Image 2 shows the kind of things in it: wagon-sheet tents, a camp fire, an iron kettle on a tripod, post oaks. Paint '
                'a new wide landscape picture: a Texian volunteers\' camp in the post oak woods in the autumn of 1835. A few '
                'wagon-sheet tents and brush lean-to shelters stand scattered among the post oaks at the left and the right, well '
                'back. A small camp fire with an iron kettle hung over it on a tripod burns on bare trodden ground in the middle '
                'distance. Long rifles stand stacked against a log. Saddles and bedrolls lie by the tents. No rows, no flag. '},
    {'name': 'scene-road-prairie', 'board': [],
     'subject': 'Paint a new wide landscape picture: a rutted dirt wagon road running from the near foreground straight across '
                'open rolling Texas prairie to the horizon, tall summer grass on both sides, a few far mottes of live oak. '},
    {'name': 'scene-road-woods', 'board': ['post-oak-large', 'live-oak-large'],
     'subject': 'Image 2 shows the kind of trees: post oak and live oak. Paint a new wide landscape picture: a rutted dirt wagon road '
                'running from the near foreground away into open post oak and live oak timber, the trees standing to the left and '
                'the right of the road and thickening into woods along the horizon, grass and leaf litter under them. '},
    {'name': 'scene-ford', 'board': ['cottonwood', 'cypress-bald-large'],
     'subject': 'Image 2 shows the kind of trees: cottonwood and bald cypress. Paint a new wide landscape picture: a rutted dirt '
                'wagon road running from the near foreground down a low grassy bank to a shallow ford across a slow clear creek '
                'in the middle distance, the road coming up the far bank, tall cottonwoods and bald cypress along the far side of '
                'the water. '},
    {'name': 'scene-yard-night', 'board': [], 'night': True,
     'subject': 'Paint a new wide landscape picture at night: the open trodden ground of a frontier farm yard by night, as if '
                'standing before a cabin door, with no building in the picture. Bare packed earth and short grass, a rail fence '
                'and a chopping block far back, dark oaks along the horizon. A deep blue night sky full of stars, a full moon just '
                'rising low over the trees at the left, and a little warm lamplight falling across the ground from the right edge '
                'of the picture. Seen from eye level with the camera slightly raised; the horizon one third of the way down. The '
                'middle of the picture and the near foreground are open, empty ground. ' + STYLE_NOTE +
                ' No people, no animals, no building, no text, no signature, no watermark.'},
    {'name': 'scene-alamo-plaza', 'board': ['alamo-church-front-1836', 'alamo-wall-intact', 'alamo-wall-doorway', 'alamo-wall-corner'],
     'subject': 'Image 2 shows the kind of buildings: the Alamo mission\'s limestone church front and its rubble-stone walls and '
                'doorways. Paint a new wide landscape picture: inside the walls of the Alamo mission at San Antonio de Béxar in '
                '1836, an empty open plaza of bare trodden earth. Along the right side runs the long two-storey limestone barrack '
                'with plain doorways; along the left a low wall of flat-roofed adobe rooms; and beyond the plaza at the far right '
                'stands the roofless limestone church front with its carved doorway between columns, its top unfinished. Earthen '
                'ramps and the tops of the walls with nobody on them. '},
    {'name': 'courtship-yard-noon', 'board': [],
     'subject': 'Paint a new wide landscape picture: the open grassy yard of a frontier farm in Texas, seen from eye level with the '
                'camera slightly raised. Short trodden grass and bare earth in front, a few post oaks and a big live oak behind, '
                'the timber line along the horizon, and nothing built. '},
]
B1_BOARDS = {b['name']: b['board'] for b in B1}
B1_EDITS = {   # the yard's morning and evening: reference edits of the chosen noon yard, so the three are one yard
    'courtship-yard-morning': 'Keep this painting exactly: the same yard, the same trees, the same ground and composition. Change '
                              'only the light to early morning: low soft sunlight from the left, long cool shadows, a pale gold '
                              'and blue sky with thin mist along the trees. No people, no text.',
    'courtship-yard-evening': 'Keep this painting exactly: the same yard, the same trees, the same ground and composition. Change '
                              'only the light to evening: warm low orange sunlight from the right, long shadows, a warm orange '
                              'and rose sky over the trees. No people, no text.',
}


# The one repair each item may have (method step 8): the ford's eight all ran the road beside the creek, none through it.
B1_REPAIRS = {
    'scene-ford-repair': ('scene-ford', 'Keep this painting exactly: the same creek, trees, sky, light, brushwork and composition. '
                          'Change only the road: the rutted dirt road runs down the near grassy bank into the creek and crosses '
                          'it through the shallow water at a ford, its wheel ruts going into the water and coming up out of it '
                          'on the far bank, the water rippling over a pale gravel bar where it crosses. No people, no animals, '
                          'no wagons, no text.', 4),
}


def made_from(name, picks):
    """The row a sprite was cut from: its repair where one was chosen (picks.json names `<name>-repair`), else itself."""
    return f'{name}-repair' if f'{name}-repair' in picks else name


def b1_prompt(item):
    if item['name'] == 'scene-street-gonzales':
        sys.path.insert(0, HERE)
        import bakeoff_2026_10_25 as bakeoff
        return bakeoff.SCENE_PROMPT
    if item.get('night'):
        return ('Image 1 is the style reference: match its palette and its detailed hand-painted brushwork and the look of its '
                'oaks and grass. ' + item['subject'])
    return B1_STYLE + item['subject'] + B1_FRAME


def refs_b1():
    d = os.path.join(WORK, 'b1', 'refs')
    os.makedirs(d, exist_ok=True)
    Image.open(os.path.join(ROOT, 'public', 'assets', 'creation-title-landscape.png')).convert('RGB').resize((1344, 756), Image.LANCZOS) \
        .save(os.path.join(d, LANDSCAPE))
    for name, names in B1_BOARDS.items():
        if names:
            board(names, os.path.join(d, f'board-{name}.png'))
    print(d)


def rows_b1(stage):
    d = os.path.join(WORK, 'b1')
    refs = os.path.join(d, 'refs')
    rows = []
    if stage == 'edits':   # needs picks.json's courtship-yard-noon, and each repaired item's first pick
        picks = json.load(open(os.path.join(d, 'picks.json'), encoding='utf8'))
        noon = os.path.join(d, 'raw', 'courtship-yard-noon', f"courtship-yard-noon-s{picks['courtship-yard-noon']}_00001_.png")
        for name, prompt in B1_EDITS.items():
            rows.append({'name': name, 'model': 'klein4b', 'prompt': prompt, 'refs': [noon], 'width': 1360, 'height': 768, 'seeds': [1, 2, 3, 4]})
        rows += edit_rows('b1', B1_REPAIRS, picks, size=(1360, 768))
    else:
        for item in B1:
            r = [os.path.join(refs, LANDSCAPE)] + ([os.path.join(refs, f"board-{item['name']}.png")] if item['board'] else [])
            seeds = [5, 6, 7, 8] if item['name'] == 'scene-street-gonzales' else list(range(1, 9))
            rows.append({'name': item['name'], 'model': 'klein4b', 'prompt': b1_prompt(item), 'refs': r, 'width': 1360, 'height': 768, 'seeds': seeds})
    path = os.path.join(d, f'rows-{stage}.json')
    json.dump(rows, open(path, 'w', encoding='utf8'), indent=1)
    print(path)


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


def colour_toward(im, ref, strength):
    """The bake-off's recommendation: move a klein 4B backdrop's colour toward Astra's oil landscape. Per channel mean and
    spread in LAB-free RGB (the toolkit's colormatch method with its hue window opened to the whole picture), at `strength`,
    so her sunset does not turn a noon street orange."""
    a = np.asarray(im, np.float32)
    r = np.asarray(ref, np.float32)
    ma, sa = a.reshape(-1, 3).mean(0), a.reshape(-1, 3).std(0)
    mr, sr = r.reshape(-1, 3).mean(0), r.reshape(-1, 3).std(0)
    # Her spread (richness) fully at strength; her mean only a third of that: the hue of the hour stays the painting's own.
    spread = 1 + strength * (sr / np.maximum(sa, 1) - 1)
    mean = ma + strength / 3 * (mr - ma)
    return Image.fromarray(np.clip((a - ma) * spread + mean, 0, 255).astype(np.uint8))


# --- contact sheets and packing, for every batch ------------------------------------------------------------------------

def raw_files(batch, item):
    d = os.path.join(WORK, batch, 'raw', item)
    return sorted((os.path.join(d, f) for f in os.listdir(d) if f.endswith('.png')), key=lambda p: int(p.rsplit('-s', 1)[1].split('_')[0])) if os.path.isdir(d) else []


def seed_of(path):
    return int(path.rsplit('-s', 1)[1].split('_')[0])


def contact(batch, items, cell=(480, 270), cols=4, show=None, name='contact'):
    """One sheet per batch: every item's candidates, labelled item and seed. `show(path)` makes the cell (default: the file)."""
    f = font(15)
    rows = []
    for item in items:
        files = raw_files(batch, item)
        for i in range(0, max(1, len(files)), cols):
            rows.append((item, files[i:i + cols]))
    W, H = cols * (cell[0] + 8) + 8, len(rows) * (cell[1] + 26) + 8
    s = Image.new('RGB', (W, H), 'white')
    d = ImageDraw.Draw(s)
    for r, (item, files) in enumerate(rows):
        y = 8 + r * (cell[1] + 26)
        for c, p in enumerate(files):
            x = 8 + c * (cell[0] + 8)
            im = (show(p) if show else Image.open(p)).convert('RGB')
            im.thumbnail(cell)
            s.paste(im, (x, y + 22))
            d.text((x, y + 2), f'{item} s{seed_of(p)}', fill='black', font=f)
    out = os.path.join(WORK, batch, f'{name}.jpg')
    s.save(out, quality=86)
    print(out)
    return out


def pack(cells, path, cell, cols):
    """Pack transparent cells (each image centred in a cell of `cell` size, in reading order) into one sheet."""
    rows = (len(cells) + cols - 1) // cols
    sheet = Image.new('RGBA', (cols * cell[0], rows * cell[1]), (0, 0, 0, 0))
    for i, im in enumerate(cells):
        x, y = (i % cols) * cell[0], (i // cols) * cell[1]
        sheet.paste(im, (x + (cell[0] - im.width) // 2, y + (cell[1] - im.height) // 2), im if im.mode == 'RGBA' else None)
    sheet.save(path, optimize=True)
    return path


B1_SHEETS = {   # four backdrops a sheet, 2x2, each 960x540 in a clear 1120x700 cell (the atlas build wants a quarter clear)
    'scenes-local-1': ['scene-street-gonzales', 'scene-street-texian', 'scene-street-tejano', 'scene-camp-volunteers'],
    'scenes-local-2': ['scene-road-prairie', 'scene-road-woods', 'scene-ford', 'scene-yard-night'],
    'scenes-local-3': ['scene-alamo-plaza', 'courtship-yard-morning', 'courtship-yard-noon', 'courtship-yard-evening'],
}
B1_MATCH = 0.5   # how far each backdrop is moved toward Astra's landscape (colour_toward)


def finish_b1():
    d = os.path.join(WORK, 'b1')
    picks = json.load(open(os.path.join(d, 'picks.json'), encoding='utf8'))
    ref = Image.open(os.path.join(d, 'refs', LANDSCAPE)).convert('RGB')
    src = os.path.join(SOURCES, f'scenes-local-{DATE}')
    os.makedirs(os.path.join(src, 'raw'), exist_ok=True)
    final = os.path.join(d, 'final')
    os.makedirs(final, exist_ok=True)
    for sheet, names in B1_SHEETS.items():
        cells = []
        for n in names:
            row = made_from(n, picks)
            raw = os.path.join(d, 'raw', row, f'{row}-s{picks[row]}_00001_.png')
            shutil.copy(raw, os.path.join(src, 'raw'))
            im = scene_cut(raw)
            if n != 'scene-yard-night':
                im = colour_toward(im, ref, B1_MATCH)
            im.save(os.path.join(final, f'{n}.png'))
            cells.append(im.convert('RGBA'))
        pack(cells, os.path.join(ATL, f'{sheet}.png'), (1120, 700), 2)
    for f in ('contact.jpg', 'contact-edits.jpg'):
        if os.path.exists(os.path.join(d, f)):
            shutil.copy(os.path.join(d, f), os.path.join(src, f))
    print(final)


BATCHES = {'b1': {'refs': refs_b1, 'rows': rows_b1, 'finish': finish_b1,
                  'sheet': lambda: contact('b1', [b['name'] for b in B1] + list(B1_EDITS) + list(B1_REPAIRS), show=scene_cut)}}


# --- sprites on a plain ground, keyed out on the CPU (batches 2, 4, 5 and the tool parts) -------------------------------

KEY_GROUND = 'plain flat pale grey background'
SPRITE_TAIL = (f' The object stands alone in the middle of a {KEY_GROUND}, with empty background all round it and well clear of '
               'the edges: no ground, no cast shadow, no frame, nothing else in the picture. ' + NO_TEXT)


def sprite_prompt(subject, view='the same three-quarter view from above'):
    return ('Image 1 shows the art style to match exactly: its thin dark ink outline, its soft painted shading, its muted warm '
            f'palette and its {view}. Use it only for style, not for its objects. Paint one new object in that style: ' + subject + SPRITE_TAIL)


def key_out(im, thresh=34, feather=1.0, hole=0):
    """The plain ground a sprite was painted on, taken out (CPU). Flood-filled from the picture's edges over the ground's own
    colour (within `thresh` of its border's median) and over any grey shadow cast on it (neutral, no lighter than the ground,
    not dark enough to be an outline), so a pale shirt or a grey stone inside a dark outline is never cut; then any hole of the
    plain ground itself (within `hole`, the painted ground is flat to 3 levels) enclosed by the object, as between a fence's
    rails. A soft edge of `feather` px."""
    from PIL import ImageFilter
    rgb = im.convert('RGB')
    a = np.asarray(rgb).astype(np.int16)
    border = np.concatenate([a[0], a[-1], a[:, 0], a[:, -1]])
    ground = np.median(border, 0)
    d = np.abs(a - ground).max(2)
    lum, spread = a.mean(2), a.max(2) - a.min(2)
    shadow = (spread < 14) & (lum <= ground.mean() + 25) & (lum > 120)
    walk = Image.fromarray(np.where((d < thresh) | shadow, 255, 0).astype(np.uint8)).copy()   # a copy: PIL fills an array-backed image in vain
    W, H = walk.size
    step = 16
    seeds = ([(x, 0) for x in range(0, W, step)] + [(x, H - 1) for x in range(0, W, step)]
             + [(0, y) for y in range(0, H, step)] + [(W - 1, y) for y in range(0, H, step)])
    for xy in seeds:
        if walk.getpixel(xy) == 255:
            ImageDraw.floodfill(walk, xy, 128)
    bg = (np.asarray(walk) == 128) | (d < hole)
    alpha = Image.fromarray(np.where(bg, 0, 255).astype(np.uint8))
    alpha = alpha.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(feather))   # off the ground's fringe
    out = rgb.convert('RGBA')
    out.putalpha(alpha)
    return out


# Sprites with holes of the plain ground enclosed by them (a kettle's bail, a fence's rails), keyed there too. Not the tent:
# its canvas is painted the ground's own grey in places.
HOLES = {'wash-kettle-1': 8, 'wash-kettle-2': 8, 'tool-pails': 8}   # not the line: its shirts are shaded in the ground's grey


def trim(im, size):
    """Cut to the sprite's own bounds and fit inside `size` (w, h), keeping its proportions."""
    box = im.getchannel('A').point(lambda v: 255 if v > 24 else 0).getbbox()
    im = im.crop(box)
    k = min(size[0] / im.width, size[1] / im.height)
    return im.resize((max(1, round(im.width * k)), max(1, round(im.height * k))), Image.LANCZOS)


def keyed_contact(batch, items, name='contact'):
    """The candidates as they will be cut out, on a mid green-grey, so a bad key shows."""
    def show(p):
        k = key_out(Image.open(p))
        bgd = Image.new('RGBA', k.size, (128, 140, 128, 255))
        bgd.alpha_composite(k)
        return bgd
    return contact(batch, items, cell=(300, 300), cols=4, show=show, name=name)


# --- batch 2: the homestead ---------------------------------------------------------------------------------------------

B2 = [
    {'name': 'homestead-tent', 'board': ['tent', 'house-round-full-walls'], 'seeds': 8,
     'subject': "a frontier family's tent made from a white canvas wagon sheet stretched over a ridge pole between two forked "
                'upright wooden posts, its two sloping sides pegged down to the ground with wooden stakes and ropes, seen '
                'corner-on, the front end open toward the lower left with a rolled striped bedroll inside.'},
    {'name': 'garden-beds', 'board': ['gonzales-ploughed-earth', 'corn-young'], 'seeds': 8,
     'view': 'the same high three-quarter view from above, like a game map',
     'subject': 'a small square kitchen garden of a frontier farm seen from high above: four or five long raised beds of dark '
                'tilled earth in rows, green beans climbing tall poles, rows of leafy greens, a melon vine with two melons, '
                'narrow paths of bare earth between the beds, a low fence of woven brush all round it.'},
    {'name': 'wash-kettle-1', 'board': ['campfire', 'camp-cookpot-tripod', 'bucket'], 'seeds': 4,
     'subject': 'a big round black cast-iron wash kettle with a bail handle, set on three stones over a small wood fire with '
                'low flames, a little white steam rising from the water in it.'},
    {'name': 'wash-line', 'board': ['fence-rail', 'bucket'], 'seeds': 4,
     'subject': 'a short section of split-rail fence, three rails high, with two wet white homespun shirts and a folded '
                'white sheet hung over its top rail to dry, seen from the side and a little above.'},
    {'name': 'wood-pile-4', 'board': ['log-fallen'], 'seeds': 8,
     'subject': 'a neat stacked pile of about forty round logs with their bark on, all the same length, laid lengthwise in a '
                'low long stack on two cross logs, seen from the side and a little above, the cut log ends toward the lower '
                "left. The pile is long and low, about as high as a man's waist."},
]
B2_EDITS = {   # name: (made from, prompt, seeds)
    'garden-beds-winter': ('garden-beds', 'Keep this painting exactly: the same garden, the same beds, fence, paths, outline '
                           'and view. Change only the season to winter: the bean poles bare, the beds mostly bare dark earth, '
                           'one row of turnips and one row of dark green collards left, a little dry straw. Same plain pale '
                           'grey background. No text.', 4),
    'wash-kettle-2': ('wash-kettle-1', 'Keep this painting exactly: the same kettle, stones and fire, the same outline and '
                      'view. Change only the steam and the flames: a different curl of white steam rising to the other '
                      'side, the flames a little lower. Same plain pale grey background. No text.', 2),
    'wood-pile-3': ('wood-pile-4', 'Keep this painting exactly in style, view, lighting and log look. Make the pile smaller: '
                    'about thirty logs, a shorter and lower stack on the same two cross logs. Same plain pale grey background. '
                    'No text.', 4),
    'wood-pile-2': ('wood-pile-4', 'Keep this painting exactly in style, view, lighting and log look. Make the pile much '
                    'smaller: about twenty logs, a short low stack on the same two cross logs. Same plain pale grey '
                    'background. No text.', 4),
    'wood-pile-1': ('wood-pile-4', 'Keep this painting exactly in style, view, lighting and log look. Make the pile very '
                    'small: about ten logs, a small low stack on the same two cross logs. Same plain pale grey background. '
                    'No text.', 4),
}


def edit_rows(batch, edits, picks, size=(1024, 1024)):
    d = os.path.join(WORK, batch)
    rows = []
    for name, (src, prompt, n) in edits.items():
        ref = os.path.join(d, 'raw', src, f'{src}-s{picks[src]}_00001_.png')
        rows.append({'name': name, 'model': 'klein4b', 'prompt': prompt, 'refs': [ref], 'width': size[0], 'height': size[1],
                     'seeds': list(range(1, n + 1))})
    return rows


def sprite_rows(batch, items, size=(1024, 1024)):
    d = os.path.join(WORK, batch)
    return [{'name': item['name'], 'model': 'klein4b',
             'prompt': item.get('prompt') or sprite_prompt(item['subject'], item.get('view', 'the same three-quarter view from above')),
             'refs': [os.path.join(d, 'refs', f"board-{item['name']}.png")] if item.get('board') else [],
             'width': size[0], 'height': size[1], 'seeds': list(range(1, item['seeds'] + 1))} for item in items]


def write_rows(batch, stage, rows):
    path = os.path.join(WORK, batch, f'rows-{stage}.json')
    json.dump(rows, open(path, 'w', encoding='utf8'), indent=1)
    print(path)


def refs_boards(batch, items, bg=(200, 200, 200)):
    d = os.path.join(WORK, batch, 'refs')
    os.makedirs(d, exist_ok=True)
    for item in items:
        if item.get('board'):
            board(item['board'], os.path.join(d, f"board-{item['name']}.png"), bg=bg)
    print(d)


def picks_of(batch):
    return json.load(open(os.path.join(WORK, batch, 'picks.json'), encoding='utf8'))


def rows_b2(stage):
    write_rows('b2', stage, edit_rows('b2', B2_EDITS, picks_of('b2')) if stage == 'edits' else sprite_rows('b2', B2))


B2_SHEETS = {
    'homestead-local-1': ['homestead-tent', 'garden-beds', 'garden-beds-winter', 'wash-line', 'wash-kettle-1', 'wash-kettle-2'],
    'homestead-local-2': ['wood-pile-1', 'wood-pile-2', 'wood-pile-3', 'wood-pile-4'],
}


def finish_sprites(batch, sheets, picks, src_name, cell=(512, 512), fit=(440, 440), sizes=None, groups=()):
    """Each pick keyed out, trimmed and packed one to a clear cell; the chosen raws and the contact sheets to docs/art-sources.
    `groups`: lists of names cut at one scale (the frames of one thing: a kettle's steam, a pile's sizes), each fitting `fit`."""
    d = os.path.join(WORK, batch)
    final = os.path.join(d, 'final')
    os.makedirs(final, exist_ok=True)
    src = os.path.join(SOURCES, f'{src_name}-{DATE}')
    os.makedirs(os.path.join(src, 'raw'), exist_ok=True)
    keyed = {}
    for names in sheets.values():
        for n in names:
            row = made_from(n, picks)
            raw = os.path.join(d, 'raw', row, f'{row}-s{picks[row]}_00001_.png')
            shutil.copy(raw, os.path.join(src, 'raw'))
            im = key_out(Image.open(raw), hole=HOLES.get(n, 0))
            keyed[n] = im.crop(im.getchannel('A').point(lambda v: 255 if v > 24 else 0).getbbox())
    scale = {}
    for group in groups:
        w, h = (sizes or {}).get(group[0], fit)
        k = min(min(w / keyed[n].width, h / keyed[n].height) for n in group)
        scale.update({n: k for n in group})
    for sheet, names in sheets.items():
        cells = []
        for n in names:
            im = keyed[n]
            if n in scale:
                k = scale[n]
                im = im.resize((max(1, round(im.width * k)), max(1, round(im.height * k))), Image.LANCZOS)
            else:
                im = trim(im, (sizes or {}).get(n, fit))
            im.save(os.path.join(final, f'{n}.png'))
            cells.append(im)
        pack(cells, os.path.join(ATL, f'{sheet}.png'), cell, 2 if len(names) in (4, 6) else 1 if len(names) == 1 else 4)
    for f in os.listdir(d):
        if f.startswith('contact') and f.endswith('.jpg'):
            shutil.copy(os.path.join(d, f), os.path.join(src, f))
    print(final)


def finish_b2():
    # The kettle's two frames and the four piles each at one scale, so the steam does not shrink the kettle and a smaller pile is
    # drawn smaller; scripts/build-atlas-manifest.mjs gives each group one logical height (its tallest).
    finish_sprites('b2', B2_SHEETS, picks_of('b2'), 'homestead-local',
                   groups=[['wash-kettle-1', 'wash-kettle-2'], ['wood-pile-1', 'wood-pile-2', 'wood-pile-3', 'wood-pile-4']])


BATCHES['b2'] = {'refs': lambda: refs_boards('b2', B2), 'rows': rows_b2, 'finish': finish_b2,
                 'sheet': lambda: keyed_contact('b2', [b['name'] for b in B2] + list(B2_EDITS))}


# --- batch 3: the hunter's first-person view -----------------------------------------------------------------------------

B3_FRAME = ('Seen from a standing hunter\'s eye height, looking straight ahead and level. The horizon runs straight across the '
            'picture exactly halfway down. The middle third of the picture, left to right, is open ground and sky with no tree '
            'trunk in it, where an animal could cross; any trees stand in the left and right thirds. Even, mild daylight with '
            'soft short shadows, no sunset. ' + STYLE_NOTE + ' No animals, no people, no rifle, no text, no signature, no watermark.')
B3 = [
    {'name': 'hunt-field-timber', 'board': ['post-oak-large', 'live-oak-large'],
     'subject': 'Image 2 shows the kind of trees: post oak and live oak. Paint a new wide landscape picture: the edge of a '
                'clearing in open post oak and live oak timber in Texas in summer, seen from just inside the trees: grass and '
                'leaf litter on the ground, big oak trunks and their crowns standing in the left and right thirds, the far side '
                'of the clearing a line of timber along the horizon. '},
    {'name': 'hunt-field-brush', 'board': ['mesquite-large', 'mesquite-log', 'mesquite-pole'],
     'subject': 'Image 2 shows the kind of brush: mesquite. Paint a new wide landscape picture: low brush country in Texas in '
                'summer: clumps of mesquite and prickly pear scattered over dry grass out to a flat horizon, a few taller '
                'mesquites at the left and the right. '},
    {'name': 'hunt-field-open', 'board': [],
     'subject': 'Paint a new wide landscape picture: open rolling Texas prairie in summer, tall grass out to a long low horizon, '
                'two or three far mottes of live oak small on the horizon, a big sky. '},
    {'name': 'hunt-rifle', 'board': ['icon-hunt-timber', 'volunteer-aim'], 'sprite': True,
     'subject': 'a long Kentucky flintlock rifle seen in first person from behind the shooter\'s right shoulder, as if the '
                'viewer is aiming it: the curly maple stock with its brass butt plate and the iron flintlock large and close '
                'at the lower right, the long dark octagonal iron barrel running straight diagonally up and to the upper left, '
                'narrowing in perspective to the muzzle with a small brass front sight bead free at the upper left end. No '
                'hands, no person.'},
]
B3_EDITS = {
    f'{n}-winter': (n, 'Keep this painting exactly: the same place, the same trees, ground, horizon and composition. Change only '
                    'the season to winter: the oak crowns bare grey branches (live oaks stay dark green), the grass dead buff and '
                    'tan, a pale cold winter sky. No animals, no people, no text.', 4)
    for n in ('hunt-field-timber', 'hunt-field-brush', 'hunt-field-open')}


# The one repair (method step 8): the timber and brush winters came back under snow and frost; a Texas winter is dry and brown.
B3_REPAIRS = {
    f'{n}-winter-repair': (n, 'Keep this painting exactly: the same place, the same trees, ground, horizon and composition. Change '
                           'only the season to a dry Texas winter, with no snow and no frost anywhere: the post oak and mesquite '
                           'crowns bare grey-brown branches with a few dead brown leaves, the live oaks still dark green, the grass '
                           'dead buff and tan, the ground dry, a pale clear winter sky. No animals, no people, no text.', 4)
    for n in ('hunt-field-timber', 'hunt-field-brush')}


def rows_b3(stage):
    d = os.path.join(WORK, 'b3')
    if stage == 'repair':
        write_rows('b3', stage, edit_rows('b3', B3_REPAIRS, picks_of('b3'), size=(1792, 1008)))
        return
    if stage == 'edits':
        write_rows('b3', stage, edit_rows('b3', B3_EDITS, picks_of('b3'), size=(1792, 1008)))
        return
    rows = []
    for item in B3:
        if item.get('sprite'):
            rows += sprite_rows('b3', [dict(item, seeds=8, view='the same painted look')])
            continue
        r = [os.path.join(WORK, 'b1', 'refs', LANDSCAPE)] + ([os.path.join(d, 'refs', f"board-{item['name']}.png")] if item['board'] else [])
        rows.append({'name': item['name'], 'model': 'klein4b', 'prompt': B1_STYLE + item['subject'] + B3_FRAME, 'refs': r,
                     'width': 1792, 'height': 1008, 'seeds': list(range(1, 9))})
    write_rows('b3', stage, rows)


def field_cut(path):
    return Image.open(path).convert('RGB').resize((1600, 900), Image.LANCZOS)


B3_SHEETS = {   # the atlas build reads a sheet of 1, 4 or 6 as 1 or 2 columns: four on the first, then one a sheet
    'hunt-fields-local-1': ['hunt-field-timber', 'hunt-field-timber-winter', 'hunt-field-brush', 'hunt-field-brush-winter'],
    'hunt-fields-local-2': ['hunt-field-open'],
    'hunt-fields-local-3': ['hunt-field-open-winter'],
}


def finish_b3():
    d = os.path.join(WORK, 'b3')
    picks = picks_of('b3')
    ref = Image.open(os.path.join(WORK, 'b1', 'refs', LANDSCAPE)).convert('RGB')
    src = os.path.join(SOURCES, f'hunt-local-{DATE}')
    os.makedirs(os.path.join(src, 'raw'), exist_ok=True)
    final = os.path.join(d, 'final')
    os.makedirs(final, exist_ok=True)
    for sheet, names in B3_SHEETS.items():
        cells = []
        for n in names:
            row = made_from(n, picks)
            raw = os.path.join(d, 'raw', row, f'{row}-s{picks[row]}_00001_.png')
            shutil.copy(raw, os.path.join(src, 'raw'))
            im = colour_toward(field_cut(raw), ref, B1_MATCH)
            im.save(os.path.join(final, f'{n}.png'))
            cells.append(im.convert('RGBA'))
        # 1600x900 in a clear 1840x1100 cell (a quarter of the sheet clear); one column for a sheet of two
        pack(cells, os.path.join(ATL, f'{sheet}.png'), (1840, 1100), 2 if len(names) == 4 else 1)
    finish_sprites('b3', {'hunt-rifle-local': ['hunt-rifle']}, picks, 'hunt-local', cell=(1100, 1100), fit=(900, 900))
    for f in os.listdir(d):
        if f.startswith('contact') and f.endswith('.jpg'):
            shutil.copy(os.path.join(d, f), os.path.join(src, f))


BATCHES['b3'] = {'refs': lambda: refs_boards('b3', B3), 'rows': rows_b3, 'finish': finish_b3,
                 'sheet': lambda: (contact('b3', [b['name'] for b in B3 if not b.get('sprite')] + list(B3_EDITS), show=field_cut),
                                   keyed_contact('b3', ['hunt-rifle'], name='contact-rifle'))}


# --- batches 4 and 5: icons and marks -------------------------------------------------------------------------------------

ICON_STYLE = ('Image 1 shows this game\'s action icons. Match their style exactly: a small storybook illustration with a thick '
              'dark ink outline, soft painted shading, a muted warm palette, one clear subject that reads at a glance at a very '
              'small size, at most a small patch of ground under it, no frame, no border, no badge. Use the icons only for style, '
              'not for their subjects. Paint one new icon in that style: ')
ICON_TAIL = (' The icon stands alone in the middle of a plain flat pale cream background, with empty background all round it '
             'and well clear of the edges. Any child is drawn small, clearly a child. ' + NO_TEXT)
MARK_STYLE = ('Image 1 shows this game\'s small round marks. Match their style exactly: a round badge with a thick dark ink '
              'outline and a cream rim, its disc filled with one flat painted colour, holding one simple bold pictogram that reads '
              'at a very small size. Paint one new mark in that style: ')
MARK_TAIL = (' One badge alone in the middle of a plain flat pale grey background, with empty background all round it and '
             'well clear of the edges. ' + NO_TEXT)
MARK_REFS = ['mark-need', 'mark-main', 'mark-auto-on']


def icon(name, refs, subject, seeds=4):
    return {'name': name, 'board': refs, 'seeds': seeds, 'prompt': ICON_STYLE + subject + ICON_TAIL}


def mark(name, subject, seeds=4):
    return {'name': name, 'board': MARK_REFS, 'seeds': seeds, 'prompt': MARK_STYLE + subject + MARK_TAIL}


B4 = [
    icon('icon-more', ['icon-visit', 'icon-work'], 'three small square picture cards fanned out like a hand of cards, and a hand reaching to pick one. Not a plus sign.'),
    icon('icon-go-inside', ['icon-build-house', 'icon-make-furniture'], 'the open plank door of a log cabin with the warm light of the hearth fire inside and a ladder-back chair by the door.'),
    icon('icon-join-seguin', ['icon-join-houston', 'icon-camp-scout'], 'a Tejano horseman in a wide-brimmed sombrero and a short jacket on a brown horse, riding from left to right, a lance held upright in his right hand.'),
    icon('icon-pitch-tent', ['icon-build-house', 'icon-fence-plot'], 'a white canvas wagon-sheet tent half put up on its ridge pole, and a hand with a wooden mallet driving a tent peg into the ground.'),
    icon('icon-keep-house', ['icon-sell-food', 'icon-make-furniture'], 'an iron cooking pot hung over a small hearth fire of logs, steam rising from it.'),
    icon('icon-work-garden', ['icon-plant-field', 'icon-mend-hoe'], 'an iron hoe leaning in a bed of dark earth with rows of small young green plants.'),
    icon('icon-wash-clothes', ['icon-child-water', 'icon-sell-food'], 'a round wooden washtub of soapy water with a white shirt hung over its rim and a flat wooden battling stick leaning against it.'),
    icon('icon-milk-cow', ['icon-look-to-stock', 'icon-butcher-beef'], 'the side of a brown milk cow\'s belly and udder, a wooden milk pail beneath it, and a hand milking.'),
    icon('icon-fence-yard', ['icon-fence-plot', 'icon-build-house'], 'the corner of a small log cabin with a low split-rail fence running round its dooryard.'),
    icon('icon-camp-cook', ['icon-camp-forage', 'icon-sell-food'], 'an iron pot hung over a camp fire on a tripod of sticks.'),
    icon('icon-camp-wood', ['icon-fell-trees', 'icon-build-house'], 'a woodcutter\'s axe stuck in a short round log, a few split sticks of firewood beside it.'),
    icon('icon-camp-bullets', ['icon-fetch-powder', 'icon-practise-shooting'], 'an iron bullet mould with long handles, a small iron ladle of melted grey lead, and three round lead balls.'),
    icon('icon-camp-shelter', ['icon-camp-guard', 'icon-build-house'], 'a small lean-to shelter of leafy brush and branches laid over a pole between two forked sticks.'),
    icon('icon-camp-buy', ['icon-visit-shop', 'icon-sell-food'], 'a tied cloth sack of goods and one silver coin before it.'),
    icon('icon-camp-hunt', ['icon-hunt-timber', 'icon-hunt-road'], 'a long rifle lying above the split-hoof track of a deer pressed into the mud.'),
    icon('icon-town-wages', ['icon-visit-shop', 'icon-haul-logs'], 'a heavy sack carried on a man\'s shoulder, seen from behind, and a silver coin.'),
    icon('icon-town-board', ['icon-visit', 'icon-sell-food'], 'a bowl of hot stew with a spoon in it set before the front of a small frame house.'),
    mark('mark-hunger', 'an empty wooden bowl with a spoon, on an amber disc.'),
    mark('mark-food', 'a full tied sack of meal with corn ears beside it, on a green disc.'),
    mark('mark-help', 'two hands clasped in a handshake, on a green disc.'),
    mark('mark-cue-house', 'an iron pot over a little hearth fire, on a blue disc.'),
    mark('mark-cue-wash', 'a washtub with a white shirt over its rim, on a blue disc.'),
    mark('mark-shelter-house', 'a cabin\'s shingle roof with slanting rain falling past it, on a slate blue disc.'),
    mark('mark-shelter-tent', 'a white wagon-sheet tent with slanting rain falling past it, on a slate blue disc.'),
]

B5 = [
    icon('icon-child-stick-horse', ['icon-child-play', 'icon-child-birds'], 'a small boy riding a stick horse, a horse\'s head carved on a long stick between his legs.'),
    icon('icon-child-doll', ['icon-child-play', 'icon-child-mind'], 'a homemade corn-husk doll in a little dress and a red kerchief.'),
    icon('icon-child-tag', ['icon-child-play', 'icon-child-birds'], 'a small boy running after a small girl, playing tag.'),
    icon('icon-child-hide', ['icon-child-play', 'icon-child-mind'], 'a small girl peeking out from behind a fallen log, hiding.'),
    icon('icon-child-cart', ['icon-child-play', 'icon-child-kindling'], 'a small wooden toy cart with two solid wooden wheels and a pull handle.'),
    icon('icon-child-hoop', ['icon-child-play', 'icon-child-water'], 'a small girl rolling a wooden hoop with a stick.'),
    icon('icon-child-marbles', ['icon-child-play', 'icon-child-eggs'], 'a ring drawn in the dirt with a few coloured clay marbles in it.'),
    icon('icon-child-hens', ['icon-child-eggs', 'icon-child-birds'], 'two farm hens pecking at scattered corn.'),
    icon('icon-flee-hide', ['icon-child-mind', 'icon-sell-food'], 'a small wooden chest of the family\'s goods half buried in a hole in the earth by a river bank.'),
    icon('icon-flee-bundle', ['icon-sell-food', 'icon-fetch-seed'], 'a bundle of belongings tied up in a red checked cloth with its corners knotted on top.'),
    icon('icon-flee-cow', ['icon-look-to-stock', 'icon-child-water'], 'a small girl leading a brown milk cow by a rope.'),
    icon('icon-road-lookout', ['icon-camp-scout', 'icon-child-birds'], 'a small boy standing on a wagon road shading his eyes with his hand, looking far ahead.'),
    icon('icon-road-sing', ['icon-child-play', 'icon-child-mind'], 'a small girl walking and singing, two musical notes in the air beside her.'),
    icon('icon-road-little-ones', ['icon-child-mind', 'icon-child-play'], 'an older girl holding the hand of a smaller child, walking.'),
    icon('icon-camp-fire', ['icon-camp-forage', 'icon-child-kindling'], 'a small camp fire of crossed sticks burning in slanting rain.'),
    icon('icon-ferry-help', ['icon-trade-crossing', 'icon-haul-logs'], 'two hands pulling hand over hand on a thick ferry rope above river water.'),
    icon('icon-share-food', ['icon-sell-food', 'icon-visit'], 'one hand passing a round loaf of bread to another hand.'),
    icon('icon-ford-carry', ['icon-trade-crossing', 'icon-child-water'], 'a man wading through a river carrying a small child on his shoulders.'),
    icon('icon-child-help', ['icon-child-play', 'icon-visit'], 'a small boy running along a track toward a neighbour\'s log cabin, one arm held out.'),
    icon('icon-ask-neighbours', ['icon-visit', 'icon-travel-home'], 'a father and a small child walking up a track toward a neighbour\'s log cabin with smoke from its chimney.'),
    icon('icon-rest-road', ['icon-tend-sick', 'icon-travel-home'], 'a covered wagon stopped by the road and somebody lying on the ground beside it under a blanket.'),
    icon('icon-camp-apart', ['icon-camp-guard', 'icon-tend-sick'], 'one small tent up on a green rise, well apart from a crowd of tents below.'),
    icon('icon-nurse-home', ['icon-tend-sick', 'icon-make-furniture'], 'a woman sitting beside a bed in a log cabin holding a cup to somebody lying in it.'),
    mark('mark-sick', 'a folded blanket with a tin cup on it, on a pale blue disc.'),
    {'name': 'farm-neighbour-porch', 'board': ['cabin-wide', 'house-porch'], 'seeds': 8,
     'prompt': sprite_prompt('a frontier family\'s one-room log cabin with a shake roof and a stick-and-clay chimney, a roofed porch '
                             'across its front with its plank door standing open, a bench and a wooden bucket on the porch, a short '
                             'split-rail fence and a chopping block with an axe in it beside it, seen corner-on.')},
    {'name': 'farm-neighbour-ramada', 'board': ['jacal-ramada', 'jacal-broad'], 'seeds': 8,
     'prompt': sprite_prompt('a Tejano family\'s jacal of upright poles plastered with mud under a thick thatched roof, a brush ramada '
                             'shading its front with a clay olla hung from its beam, and a small corral of upright pickets beside it, '
                             'seen corner-on.')},
    {'name': 'grave-marker', 'board': ['bucket', 'fence-rail'], 'seeds': 4,
     'prompt': sprite_prompt('a plain wooden grave marker: a flat board with a rounded top standing upright at the head of a low '
                             'mound of earth with a few wildflowers on it. The board is blank, no writing, no cross, no symbol.')},
    {'name': 'coins-and-paper', 'board': ['bucket', 'home-table'], 'seeds': 4,
     'prompt': sprite_prompt('a short stack of old silver coins with two loose coins beside it, a folded paper bill of sale and a '
                             'small brown leather drawstring purse, lying together. The paper is blank.')},
]


# The one repair each (method step 8): every hoe came back a spade, and the hunt's deer track came back a fire's ring of stones.
B4_REPAIRS = [
    icon('icon-work-garden-repair', ['icon-plant-field', 'icon-mend-hoe'], 'a garden hoe standing in a bed of dark earth with rows of '
         'small young green plants: a long straight wooden handle with a flat iron blade fixed at a right angle across its lower end, '
         'like a letter L, the blade cutting the soil. A hoe, not a shovel and not a spade.'),
    icon('icon-camp-hunt-repair', ['icon-hunt-timber', 'icon-hunt-road'], 'a long rifle lying on muddy ground beside the tracks of a '
         'deer: two split-hoof prints pressed into the mud, each print two pointed teardrop halves side by side. No fire, no stones.'),
]


# The one repair each (method step 8): the stick horse came back a real horse; the hoop, copying the board's play icon, with a
# hobby horse; the bill of sale and the coins with writing on them (text).
B5_REPAIRS = [
    icon('icon-child-stick-horse-repair', ['icon-child-water', 'icon-child-birds'], 'a small boy playing at riding: he runs astride '
         'a toy hobby horse, a plain wooden pole with a small carved wooden horse head on its top end, held between his legs, the '
         'other end of the pole trailing on the ground behind him. A toy on a stick, not a real horse.'),
    icon('icon-child-hoop-repair', ['icon-child-water', 'icon-child-birds'], 'a small girl in a dress running beside a big plain '
         'wooden hoop as tall as her waist, rolling it along the ground with a short stick in her hand. Nothing else.'),
    {'name': 'coins-and-paper-repair', 'board': ['bucket', 'home-table'], 'seeds': 4,
     'prompt': sprite_prompt('a short stack of plain smooth silver coins with two loose plain coins beside it, a folded sheet of '
                             'blank cream paper and a small brown leather drawstring purse, lying together. The coins are smooth with '
                             'no faces, no numbers and no letters; the paper is completely blank, with no writing, no lines and no '
                             'marks of any kind.')},
]


def rows_icons(batch, items, repairs=()):
    def go(stage):
        write_rows(batch, stage, sprite_rows(batch, repairs if stage == 'repair' else items))
    return go


ICON_SIZE = (300, 300)   # Astra's icons are about 300 px in her 4x4 sheets (plan, batch 4)
MARK_SIZE = (320, 320)


def finish_icons(batch, sheets, src_name, extra_sizes=None):
    sizes = {n: MARK_SIZE if n.startswith('mark-') else ICON_SIZE for names in sheets.values() for n in names}
    sizes.update(extra_sizes or {})
    finish_sprites(batch, sheets, picks_of(batch), src_name, cell=(384, 384), fit=ICON_SIZE, sizes=sizes)


B4_SHEETS = {   # sixteen icons, then the last icon with three marks, then four marks (the atlas build reads 4 or 16 a sheet)
    'icons-family-local-1': [b['name'] for b in B4[:16]],
    'icons-family-local-2': [b['name'] for b in B4[16:20]],
    'marks-local-1': [b['name'] for b in B4[20:24]],
}
B5_SHEETS = {   # the stick horse not shipped (flagged); the atlas build reads 1, 4, 6 or 16 a sheet
    'icons-family-local-3': [b['name'] for b in B5[1:17]],
    'icons-family-local-4': [b['name'] for b in B5[17:23]],
    'marks-local-2': ['mark-sick'],
    'homecoming-local-1': ['farm-neighbour-porch', 'farm-neighbour-ramada', 'grave-marker', 'coins-and-paper'],
}
BATCHES['b4'] = {'refs': lambda: refs_boards('b4', B4 + B4_REPAIRS, bg=(236, 228, 208)), 'rows': rows_icons('b4', B4, B4_REPAIRS),
                 'finish': lambda: finish_icons('b4', B4_SHEETS, 'icons-local'),
                 'sheet': lambda: keyed_contact('b4', [b['name'] for b in B4])}
BATCHES['b5'] = {'refs': lambda: refs_boards('b5', B5 + B5_REPAIRS, bg=(236, 228, 208)), 'rows': rows_icons('b5', B5, B5_REPAIRS),
                 'finish': lambda: finish_icons('b5', B5_SHEETS, 'icons-local-claude',
                                                {'farm-neighbour-porch': (370, 370), 'farm-neighbour-ramada': (370, 370),
                                                 'grave-marker': (300, 300), 'coins-and-paper': (300, 300)}),
                 'sheet': lambda: keyed_contact('b5', [b['name'] for b in B5])}


# --- the tool parts the work cycles hold (owner, 2026-10-25) --------------------------------------------------------------

TOOL_VIEW = 'the same painted look'
TOOLS = [
    {'name': 'tool-felling-axe', 'board': ['icon-fell-trees', 'icon-build-house'], 'seeds': 4,
     'subject': 'one long-handled American felling axe lying flat, its straight hickory handle running from the lower left to the '
                'upper right and its iron head at the upper right end, the blade edge toward the top.'},
    {'name': 'tool-maul', 'board': ['icon-fence-plot', 'icon-build-house'], 'seeds': 4,
     'subject': 'one wooden maul for splitting rails lying flat: a long straight handle from the lower left to the upper right and '
                'a heavy round wooden head at the upper right end, bound with iron rings.'},
    {'name': 'tool-spade', 'board': ['icon-dig-well', 'icon-mend-hoe'], 'seeds': 4,
     'subject': 'one iron spade lying flat: a long straight wooden handle from the lower left to the upper right with a short '
                'cross grip at the lower left end, and the flat iron blade at the upper right end.'},
    {'name': 'tool-broom', 'board': ['icon-mend-hoe', 'icon-make-furniture'], 'seeds': 4,
     'subject': 'one homemade broom lying flat: a long straight wooden handle from the lower left to the upper right and a bundle '
                'of tied straw at the upper right end.'},
    {'name': 'tool-pails', 'board': ['icon-child-water', 'bucket'], 'seeds': 4,
     'subject': 'two wooden water pails with iron hoops and rope bail handles, standing side by side, full of water.'},
    {'name': 'tool-cane-pole', 'board': ['icon-fish-the-water', 'icon-mend-hoe'], 'seeds': 4,
     'subject': 'one long cane fishing pole lying flat from the lower left to the upper right, a fishing line hanging from its thin '
                'upper right tip.'},
    {'name': 'tool-battling-stick', 'board': ['icon-mend-hoe', 'icon-child-water'], 'seeds': 4,
     'subject': 'one flat wooden battling stick for beating wet laundry, lying flat: a short round handle at the lower left and a '
                'long flat paddle blade toward the upper right.'},
]
TOOLS_SHEETS = {'tools-local-1': [t['name'] for t in TOOLS[:6]], 'tools-local-2': [t['name'] for t in TOOLS[6:]]}
def finish_tools():
    finish_sprites('tools', TOOLS_SHEETS, picks_of('tools'), 'tools-local', cell=(512, 512), fit=(460, 460))
    # Each haft tool's two ends along its long diagonal, as fractions of its atlas frame (two pixels of padding each side):
    # the butt (the first opaque pixel from the lower left) and the head (the last toward the upper right). public/work-art.js
    # `TOOL_PARTS` takes these numbers; tests/tool-parts.test.mjs holds them to the sheet.
    for n in [t['name'] for t in TOOLS if t['name'] != 'tool-pails']:
        a = np.asarray(Image.open(os.path.join(WORK, 'tools', 'final', f'{n}.png')))[..., 3] > 128
        ys, xs = np.nonzero(a)
        h, w = a.shape
        i, j = np.argmin(xs - ys), np.argmax(xs - ys)
        frac = lambda x, y: [round((x + 2) / (w + 4), 3), round((y + 2) / (h + 4), 3)]
        print(n, 'butt', frac(xs[i], ys[i]), 'head', frac(xs[j], ys[j]))


BATCHES['tools'] = {'finish': finish_tools, 'refs': lambda: refs_boards('tools', TOOLS), 'rows': lambda stage: write_rows('tools', stage, sprite_rows('tools', [dict(t, view=TOOL_VIEW) for t in TOOLS])),
                    'sheet': lambda: keyed_contact('tools', [t['name'] for t in TOOLS])}


# --- batch 6: the pilot, editing Astra's own frames (8 jobs, report only) -------------------------------------------------

B6 = {
    'pilot-mule-plain': ('mule-packed-grass-walk-e-1', 'Keep this painting exactly: the same mule, the same pose, legs, hooves, '
                         'head, ears, tail, outline, colours and size, facing the same way. Remove only the load: take away the '
                         'bundle of grass and every strap, rope and pack saddle that holds it, showing the mule\'s plain bare '
                         'back, and give it a plain rope halter on its head. Same plain pale grey background. No people, no text.'),
    'pilot-elder-stand': ('bexar-elder-walk-1', 'Keep this person exactly: the same old man, the same face, hair, hat, clothes, '
                          'colours, outline, painted style and size. Change only his pose: standing still, facing the viewer, his '
                          'arms hanging relaxed at his sides, both feet on the ground. Same plain pale grey background. One '
                          'person, no text.'),
}


def refs_b6():
    d = os.path.join(WORK, 'b6', 'refs')
    os.makedirs(d, exist_ok=True)
    for name, (src, _) in B6.items():
        f = frame(src)
        k = 900 / max(f.size)
        f = f.resize((round(f.width * k), round(f.height * k)), Image.LANCZOS)
        b = Image.new('RGB', (1024, 1024), (200, 200, 200))
        b.paste(f, ((1024 - f.width) // 2, (1024 - f.height) // 2), f)
        b.save(os.path.join(d, f'{src}.png'))
    print(d)


BATCHES['b6'] = {'refs': refs_b6,
                 'rows': lambda stage: write_rows('b6', stage, [{'name': n, 'model': 'klein4b', 'prompt': p, 'refs': [os.path.join(WORK, 'b6', 'refs', f'{src}.png')],
                                                                 'width': 1024, 'height': 1024, 'seeds': [1, 2, 3, 4]} for n, (src, p) in B6.items()]),
                 'sheet': lambda: keyed_contact('b6', list(B6))}


# --- the record each delivery module reads (prompts, references, seeds, picks) --------------------------------------------

def rel(p):
    """A reference's path as the repo knows it: under output/ (git-ignored, remade by `refs`) or the repo itself."""
    p = os.path.abspath(p)
    return os.path.relpath(p, ROOT).replace(os.sep, '/')


def record(batch):
    """scripts/local-art/records/<batch>-2026-10-26.json: every painted row (its prompt, its references, its seeds) and the pick."""
    d = os.path.join(WORK, batch)
    picks = picks_of(batch) if os.path.exists(os.path.join(d, 'picks.json')) else {}
    rows = []
    for f in sorted(os.listdir(d)):
        if f.startswith('rows-') and f.endswith('.json'):
            for r in json.load(open(os.path.join(d, f), encoding='utf8')):
                rows.append({'name': r['name'], 'stage': f[5:-5], 'prompt': r['prompt'], 'references': [rel(x) for x in r.get('refs', [])],
                             'size': [r['width'], r['height']], 'seeds': r['seeds'], 'chosen': picks.get(r['name'])})
    jobs = os.path.join(d, 'raw', '_jobs.json')
    log = json.load(open(jobs, encoding='utf8')) if os.path.exists(jobs) else []
    out = {'batch': batch, 'date': DATE, 'model': 'FLUX.2 klein 4B fp8 (Apache-2.0)', 'rows': rows, 'flags': picks.get('_flags', {}),
           'jobs': len([j for j in log if 'error' not in j]), 'failedJobs': len([j for j in log if 'error' in j]),
           'gpuSeconds': round(sum(j.get('seconds', 0) for j in log), 1),
           'cards': sorted({j.get('gpu') for j in log if j.get('gpu')})}
    os.makedirs(os.path.join(HERE, 'records'), exist_ok=True)
    path = os.path.join(HERE, 'records', f'{batch}-{DATE}.json')
    json.dump(out, open(path, 'w', encoding='utf8'), indent=1, ensure_ascii=False)
    print(path, out['jobs'], 'jobs', out['gpuSeconds'], 's', out['cards'])


# --- batch 0: the road tiles' review sheet (scripts/road-art/generate.py paints, finish.py finishes) ----------------------

def roads_contact():
    """Every road candidate as painted beside its 3x3 repeat after finish.py's own seam pass and colour: one sheet."""
    sys.path.insert(0, os.path.join(ROOT, 'scripts', 'road-art'))
    import finish
    work = os.path.join(WORK, 'roads')
    raw = os.path.join(work, 'raw')
    c, pad, f = 260, 8, font(15)
    seeds = range(1, 9)
    s = Image.new('RGB', (4 * 2 * (c + pad) + pad, 2 * len(finish.TEXTURES) * (c + 26) + pad), 'white')
    d = ImageDraw.Draw(s)
    for i, t in enumerate(finish.TEXTURES):
        for j, seed in enumerate(seeds):
            x, y = pad + (j % 4) * 2 * (c + pad), pad + (2 * i + j // 4) * (c + 26)
            p = os.path.join(raw, f"{t['name']}-s{seed}_00001_.png")
            if not os.path.exists(p):
                continue
            tt = dict(t, candidate=seed, crop=None)
            tile = Image.fromarray(finish.colour(finish.seamless(tt, raw), t['target'], t['keep']).astype(np.uint8))
            s.paste(Image.open(p).convert('RGB').resize((c, c), Image.LANCZOS), (x, y + 22))
            g = Image.new('RGB', (c, c))
            third = tile.resize((c // 3, c // 3), Image.LANCZOS)
            for gx in range(3):
                for gy in range(3):
                    g.paste(third, (gx * (c // 3), gy * (c // 3)))
            s.paste(g, (x + c + pad // 2, y + 22))
            d.text((x, y + 3), f"{t['name']} s{seed} {'edit' if seed <= 4 else 'text'}  raw | 3x3", fill='black', font=f)
    out = os.path.join(work, 'contact-candidates.jpg')
    s.save(out, quality=86)
    print(out)


BATCHES['roads'] = {'sheet': roads_contact}


if __name__ == '__main__':
    cmd, batch = sys.argv[1], sys.argv[2]
    stage = sys.argv[sys.argv.index('--stage') + 1] if '--stage' in sys.argv else 'main'
    if cmd == 'record':
        record(batch)
        sys.exit(0)
    fn = BATCHES[batch][cmd]
    fn(stage) if cmd == 'rows' else fn()
