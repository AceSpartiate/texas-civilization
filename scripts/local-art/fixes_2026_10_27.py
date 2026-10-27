"""The flagged art of v2026.10.26.1 repainted from drawn guides (owner, 2026-10-27: "fix the flagged icons and the ford backdrop").

Told in words alone, FLUX.2 klein 4B painted a spade for the hoe, paw prints for the deer's, a real horse for the stick horse, a hoop
taller than the girl, hands passing a coin for the ferry, and a ford whose road never crossed the water. Here each is first drawn as
a flat sketch on the CPU (its objects, their shapes, where they stand and how big), and the model paints the sketch over in Astra's
style: image 1 the sketch, image 2 the style board batch 4/5 used. The five marks that did not read at 20 px are sketched with the
pictogram filling the badge and a thin rim.

    python scripts/local-art/fixes_2026_10_27.py sketches        CPU: output/local-2026-10-27/fix/sketches/*.png
    python scripts/local-art/fixes_2026_10_27.py rows            CPU: output/local-2026-10-27/fix/rows-main.json
    python scripts/local-art/paint.py output/local-2026-10-27/fix/rows-main.json --out output/local-2026-10-27/fix/raw   GPU
    python scripts/local-art/licence_check.py output/local-2026-10-27/fix/raw/<item>
    python scripts/local-art/fixes_2026_10_27.py sheet           CPU: the candidates keyed, one contact sheet
    python scripts/local-art/fixes_2026_10_27.py finish          CPU: the picks (picks.json) into the shipped sheets
"""
import json
import math
import glob
import os
import shutil
import sys

from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import batches_2026_10_26 as b  # noqa: E402

DATE = '2026-10-27'
WORK = os.path.join(b.ROOT, 'output', 'local-2026-10-27', 'fix')
OLD = b.WORK   # output/local-2026-10-26: batch 4/5's style boards and batch 1's landscape reference
SK = os.path.join(WORK, 'sketches')
INK = (45, 32, 24)
CREAM = (236, 228, 208)
GREY = (200, 200, 200)


# --- the sketches ---------------------------------------------------------------------------------------------------------

def canvas(bg=CREAM, size=(1024, 1024)):
    im = Image.new('RGB', size, bg)
    return im, ImageDraw.Draw(im)


def poly(d, pts, fill, w=8):
    d.polygon(pts, fill=fill, outline=INK, width=w)


def bar(d, a, z, fill, w):
    """A thick stick from a to z, inked."""
    d.line([a, z], fill=INK, width=w + 12)
    d.line([a, z], fill=fill, width=w)
    for p in (a, z):
        d.ellipse([p[0] - w / 2, p[1] - w / 2, p[0] + w / 2, p[1] + w / 2], fill=fill)


def blob(d, box, fill, w=8):
    d.ellipse(box, fill=fill, outline=INK, width=w)


def figure(d, head, h, skin=(226, 180, 140), cloth=(90, 110, 150), dress=False):
    """A child of height h standing at head (centre of the head): flat shapes only, the pose drawn by the caller's limbs."""
    x, y = head
    r = h * 0.11
    if dress:
        poly(d, [(x - h * 0.06, y + r), (x + h * 0.06, y + r), (x + h * 0.2, y + h * 0.62), (x - h * 0.2, y + h * 0.62)], cloth)
    else:
        poly(d, [(x - h * 0.09, y + r), (x + h * 0.09, y + r), (x + h * 0.1, y + h * 0.5), (x - h * 0.1, y + h * 0.5)], cloth)
    blob(d, [x - r, y - r, x + r, y + r], skin)


def sketch_hoe():
    im, d = canvas()
    poly(d, [(110, 730), (900, 690), (940, 900), (90, 910)], (96, 64, 40))
    for y0 in (760, 840):
        d.line([(130, y0), (910, y0 - 30)], fill=(70, 46, 30), width=10)
        for x in range(170, 900, 95):
            yy = y0 - (x - 130) * 30 / 780 - 6
            blob(d, [x - 34, yy - 30, x, yy - 4], (110, 160, 70), 5)
            blob(d, [x, yy - 30, x + 34, yy - 4], (110, 160, 70), 5)
            d.line([(x, yy), (x, yy - 10)], fill=INK, width=5)
    # The handle slants up to the right; at its foot the iron blade turns down at a right angle to it, its edge in the earth: an L.
    e, top = (360, 600), (880, 110)
    dx, dy = e[0] - top[0], e[1] - top[1]
    n = math.hypot(dx, dy)
    ud, up = (dx / n, dy / n), (-dy / n, dx / n)   # down the handle; at a right angle to it
    if up[1] < 0:
        up = (-up[0], -up[1])
    bar(d, top, e, (160, 108, 60), 34)
    # The blade is wide across the handle's foot (a T), not in line with it as a spade's would be.
    neck = (e[0] + 70 * ud[0], e[1] + 70 * ud[1])
    d.line([e, neck], fill=INK, width=30)
    d.line([e, neck], fill=(110, 110, 115), width=18)
    q = lambda k, j: (neck[0] + k * ud[0] + j * up[0], neck[1] + k * ud[1] + j * up[1])
    poly(d, [q(0, -150), q(0, 150), q(110, 165), q(110, -165)], (120, 122, 128), 9)
    return im


def deer_track(d, c, s, ang, fill=(60, 40, 26)):
    """A deer's print: two pointed halves side by side, the points forward, like a split heart."""
    ca, sa = math.cos(ang), math.sin(ang)
    rot = lambda x, y: (c[0] + x * ca - y * sa, c[1] + x * sa + y * ca)
    for side in (-1, 1):
        half = [(side * 0.05, -1.0), (side * 0.55, -0.1), (side * 0.58, 0.5), (side * 0.35, 0.85), (side * 0.08, 0.7), (side * 0.04, 0.0)]
        poly(d, [rot(x * s, y * s) for x, y in half], fill, 6)


def sketch_hunt():
    im, d = canvas()
    poly(d, [(110, 640), (520, 560), (930, 640), (900, 900), (130, 900)], (132, 100, 66))
    deer_track(d, (370, 750), 115, -0.25)
    deer_track(d, (660, 800), 115, -0.25)
    # A long rifle lying across the top: the stock at the left, the long barrel running up to the right.
    poly(d, [(100, 500), (300, 430), (330, 470), (180, 560), (120, 560)], (150, 90, 45))
    poly(d, [(300, 430), (930, 190), (940, 210), (330, 470)], (140, 84, 44), 7)
    d.line([(310, 425), (945, 182)], fill=INK, width=20)
    d.line([(310, 425), (945, 182)], fill=(80, 80, 88), width=10)
    blob(d, [300, 430, 360, 470], (100, 100, 108), 6)
    return im


def sketch_ferry():
    im, d = canvas()
    poly(d, [(60, 520), (980, 520), (980, 940), (60, 940)], (110, 150, 185))
    for y in (600, 700, 800, 880):
        d.line([(120, y), (300, y)], fill=(170, 200, 220), width=7)
        d.line([(700, y + 20), (900, y + 20)], fill=(170, 200, 220), width=7)
    poly(d, [(60, 420), (300, 420), (360, 540), (60, 560)], (120, 140, 70))   # the near bank, left
    # The ferry rope stretched high across the river from a post on the bank.
    bar(d, (110, 210), (110, 450), (140, 96, 56), 24)
    d.line([(110, 230), (990, 190)], fill=INK, width=14)
    d.line([(110, 230), (990, 190)], fill=(200, 170, 110), width=7)
    # The flat wooden ferry boat at the bank, its deck of planks.
    poly(d, [(330, 600), (900, 600), (870, 700), (360, 700)], (150, 104, 62))
    poly(d, [(330, 560), (900, 560), (900, 600), (330, 600)], (180, 130, 80))
    for x in range(380, 900, 70):
        d.line([(x, 562), (x, 598)], fill=INK, width=5)
    d.line([(620, 560), (620, 205)], fill=INK, width=6)
    # A man stepping onto the deck with a sack of corn on his shoulder.
    x, y = 470, 330
    poly(d, [(x - 40, y + 40), (x + 40, y + 40), (x + 50, y + 170), (x - 50, y + 170)], (120, 130, 150))
    bar(d, (x - 25, y + 170), (x - 70, y + 230), (90, 70, 50), 26)
    bar(d, (x + 25, y + 170), (x + 60, y + 230), (90, 70, 50), 26)
    blob(d, [x - 30, y - 30, x + 30, y + 30], (226, 180, 140))
    blob(d, [x - 10, y - 50, x + 120, y + 40], (215, 195, 150))
    bar(d, (x + 30, y + 60), (x + 60, y + 10), (226, 180, 140), 20)
    return im


def sketch_stick_horse():
    im, d = canvas()
    poly(d, [(120, 860), (900, 860), (900, 900), (120, 900)], (150, 120, 80))
    head, h = (500, 260), 560
    # The legs in a running stride, the pole between them.
    bar(d, (480, 560), (400, 840), (80, 70, 60), 40)
    bar(d, (530, 560), (640, 830), (80, 70, 60), 40)
    figure(d, head, h, cloth=(160, 80, 60))
    # The toy: a straight plain pole, its back end trailing on the ground behind the boy, a small carved wooden horse's head on
    # its front end at the boy's chest. No horse's body, no legs.
    bar(d, (200, 850), (740, 470), (170, 120, 70), 26)
    hx, hy = 760, 440
    poly(d, [(hx - 30, hy + 50), (hx - 10, hy - 70), (hx + 20, hy - 110), (hx + 40, hy - 80), (hx + 120, hy - 40),
             (hx + 130, hy - 5), (hx + 60, hy + 10), (hx + 40, hy + 60)], (150, 100, 60))
    poly(d, [(hx + 15, hy - 105), (hx + 25, hy - 150), (hx + 40, hy - 95)], (150, 100, 60), 6)
    blob(d, [hx + 40, hy - 70, hx + 60, hy - 50], INK, 2)
    d.line([(hx - 10, hy - 70), (hx - 40, hy - 20), (hx - 30, hy + 30)], fill=(60, 40, 30), width=14)
    bar(d, (550, 380), (700, 480), (226, 180, 140), 24)
    return im


def sketch_hoop():
    im, d = canvas()
    poly(d, [(80, 820), (940, 820), (940, 860), (80, 860)], (150, 120, 80))
    # A girl running at the right, the hoop rolling ahead of her at the left: its top no higher than her waist.
    head, h = (690, 290), 530
    bar(d, (670, 620), (630, 815), (230, 200, 170), 26)
    bar(d, (730, 620), (790, 800), (230, 200, 170), 26)
    figure(d, head, h, cloth=(110, 130, 160), dress=True)
    cx, cy, r = 360, 690, 125
    d.ellipse([cx - r - 8, cy - r - 8, cx + r + 8, cy + r + 8], outline=INK, width=34)
    d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(170, 120, 70), width=20)
    bar(d, (630, 400), (520, 520), (226, 180, 140), 22)
    bar(d, (520, 520), (470, 610), (140, 96, 56), 12)
    return im


def badge(disc):
    im, d = canvas(GREY)
    c = 512
    d.ellipse([c - 450, c - 450, c + 450, c + 450], fill=INK)
    d.ellipse([c - 432, c - 432, c + 432, c + 432], fill=(240, 228, 200))
    d.ellipse([c - 405, c - 405, c + 405, c + 405], fill=INK)
    d.ellipse([c - 393, c - 393, c + 393, c + 393], fill=disc)
    return im, d


def rain(d, boxes):
    for x0, y0 in boxes:
        for i in range(3):
            d.line([(x0 + i * 34, y0 + i * 18), (x0 + i * 34 - 26, y0 + i * 18 + 70)], fill=(225, 235, 245), width=12)


def sketch_shelter_house():
    im, d = badge((79, 111, 143))
    poly(d, [(170, 520), (512, 190), (854, 520)], (120, 84, 60), 12)
    poly(d, [(250, 520), (774, 520), (774, 800), (250, 800)], (165, 115, 70), 12)
    for y in range(570, 800, 50):
        d.line([(258, y), (766, y)], fill=INK, width=6)
    poly(d, [(462, 640), (562, 640), (562, 800), (462, 800)], (90, 60, 40), 10)
    rain(d, [(200, 230), (720, 230)])
    return im


def sketch_shelter_tent():
    im, d = badge((79, 111, 143))
    poly(d, [(170, 790), (512, 210), (854, 790)], (240, 236, 222), 12)
    poly(d, [(452, 790), (512, 560), (572, 790)], (70, 60, 50), 10)
    d.line([(512, 210), (512, 160)], fill=INK, width=14)
    rain(d, [(200, 260), (720, 260)])
    return im


def sketch_cue_house():
    im, d = badge((60, 110, 180))
    poly(d, [(330, 760), (420, 680), (512, 780), (600, 670), (700, 760), (640, 830), (380, 830)], (240, 150, 50), 10)
    blob(d, [250, 360, 774, 720], (70, 70, 76), 12)
    poly(d, [(250, 420), (774, 420), (774, 470), (250, 470)], (55, 55, 60), 10)
    blob(d, [470, 300, 554, 360], (55, 55, 60), 8)
    d.arc([300, 160, 724, 560], 200, 340, fill=INK, width=14)
    return im


def sketch_cue_wash():
    im, d = badge((60, 110, 180))
    poly(d, [(220, 460), (804, 460), (740, 820), (284, 820)], (170, 120, 70), 12)
    for y in (560, 700):
        d.line([(250, y), (774, y)], fill=(90, 90, 96), width=22)
    blob(d, [220, 420, 804, 500], (190, 215, 235), 10)
    poly(d, [(420, 300), (640, 300), (720, 380), (680, 420), (650, 400), (650, 640), (410, 640), (410, 400),
             (380, 420), (340, 380)], (250, 250, 245), 10)
    return im


def sketch_ford():
    """The ford's layout, 1360 x 768: the road comes from the near foreground straight down the bank into the creek, crosses
    through the shallow water and goes up the far bank into the trees."""
    im, d = canvas((190, 215, 230), (1360, 768))
    poly(d, [(0, 300), (1360, 300), (1360, 470), (0, 470)], (120, 150, 80), 4)       # far bank and its grass
    for x in range(30, 1360, 110):
        if 560 < x < 800:
            continue
        blob(d, [x - 60, 120 + (x * 37) % 60, x + 60, 300], (90, 130, 70), 4)
        bar(d, (x, 260), (x, 330), (100, 70, 45), 16)
    poly(d, [(0, 440), (1360, 430), (1360, 560), (0, 570)], (110, 155, 190), 4)       # the creek across the picture
    poly(d, [(0, 560), (1360, 550), (1360, 768), (0, 768)], (170, 160, 90), 4)        # the near bank
    # The road: wide at the bottom, narrowing up the near bank, crossing the water (a paler shallow band with ripples), and up the far
    # bank to the trees.
    poly(d, [(470, 768), (930, 768), (760, 560), (620, 560)], (190, 150, 105), 4)
    poly(d, [(620, 560), (760, 560), (745, 440), (635, 440)], (165, 185, 190), 4)
    for y in (470, 500, 530):
        d.line([(630, y), (750, y)], fill=(235, 240, 240), width=5)
    poly(d, [(635, 440), (745, 440), (705, 300), (665, 300)], (190, 150, 105), 4)
    for side in (-1, 1):
        d.line([(700 + side * 140, 768), (690 + side * 30, 560)], fill=(130, 95, 60), width=10)
        d.line([(690 + side * 25, 440), (685 + side * 10, 300)], fill=(130, 95, 60), width=6)
    return im


SKETCHES = {
    'icon-work-garden': sketch_hoe, 'icon-camp-hunt': sketch_hunt, 'icon-ferry-help': sketch_ferry,
    'icon-child-stick-horse': sketch_stick_horse, 'icon-child-hoop': sketch_hoop,
    'mark-shelter-house': sketch_shelter_house, 'mark-shelter-tent': sketch_shelter_tent,
    'mark-cue-house': sketch_cue_house, 'mark-cue-wash': sketch_cue_wash, 'scene-ford': sketch_ford,
}


# --- the rows -------------------------------------------------------------------------------------------------------------

GUIDE = ('Image 1 is a rough flat sketch that fixes the subject: keep exactly its objects, their shapes, where each one is and how '
         'big each one is, and add nothing else. ')
ICON_STYLE = ('Image 2 shows this game\'s action icons. Paint image 1 over as one finished icon in exactly their style: a small '
              'storybook illustration with a thick dark ink outline, soft painted shading and a muted warm palette, reading at a '
              'glance at a very small size, no frame, no border, no badge. Use image 2 only for the style, never for its subjects. '
              'The icon shows ')
MARK_STYLE = ('Image 2 shows this game\'s small round marks. Paint image 1 over as one finished mark in exactly their style: a round '
              'badge with a thick dark ink outline and a thin cream rim, its disc filled with one flat colour. The pictogram is big '
              'and bold, filling nearly the whole disc, with few details, so it reads at a tiny size. The mark shows ')

ICONS = {   # name: (style board of batch 4/5, subject, seeds)
    'icon-work-garden': ('b4', 'a garden hoe in a bed of dark tilled earth with rows of small green seedlings. A hoe: a long '
                         'straight wooden handle, and at its foot a broad flat iron blade bent at a right angle to the handle, its '
                         'sharp edge cutting into the earth. Not a shovel, not a spade.', 8),
    'icon-camp-hunt': ('b4', 'a long flintlock rifle lying across muddy ground above the tracks of a deer: two split-hoof prints, '
                       'each two pointed halves side by side like a split heart. Hoofprints only: no claws, no toes, no pads.', 8),
    'icon-ferry-help': ('b5', 'helping the ferryman load at a river crossing: a man carrying a sack of corn on his shoulder steps '
                        'onto a flat wooden ferry boat moored at the bank, and the ferry\'s rope is stretched high across the river.', 6),
    'icon-child-stick-horse': ('b5', 'a small boy at play running astride a toy stick horse: a plain straight wooden pole held '
                               'between his legs, its back end trailing on the ground behind him, and on its front end only a small '
                               'carved wooden horse\'s head at his chest. The toy has no horse body and no legs; there is no real '
                               'horse and no rocking horse.', 8),
    'icon-child-hoop': ('b5', 'a small girl running behind a wooden hoop, rolling it along the ground with a short stick. The hoop '
                        'is small: its top comes no higher than her waist.', 6),
}
MARKS = {
    'mark-shelter-house': 'a log cabin under its roof with rain slanting down on both sides, on a slate blue disc.',
    'mark-shelter-tent': 'a white canvas tent with rain slanting down on both sides, on a slate blue disc.',
    'mark-cue-house': 'an iron cooking pot over a little fire, on a blue disc.',
    'mark-cue-wash': 'a wooden washtub with a white shirt over its rim, on a blue disc.',
}
FORD = ('Image 1 is a rough flat colour sketch of the layout: keep exactly its layout - the dirt road coming from the near '
        'foreground straight down the grassy bank, going INTO the creek, crossing through the shallow rippling water to the other '
        'side and climbing the far bank into the trees. ' + b.B1_STYLE.replace('Image 1', 'Image 2') +
        'Paint a new wide landscape picture: a rutted dirt wagon road at a shallow ford across a slow clear Texas creek, the wheel '
        'ruts running into the water and out on the far bank, tall cottonwoods and bald cypress along the far side. ' + b.B1_FRAME)


def boards():
    return {**{n: os.path.join(OLD, v[0], 'refs', f'board-{n}.png') for n, v in ICONS.items()},
            **{n: os.path.join(OLD, 'b4', 'refs', f'board-{n}.png') for n in MARKS}}


def sketches():
    os.makedirs(SK, exist_ok=True)
    for n, fn in SKETCHES.items():
        fn().save(os.path.join(SK, f'{n}.png'))
    s = Image.new('RGB', (5 * 260, 2 * 260 + 160), 'white')
    for i, n in enumerate(SKETCHES):
        im = Image.open(os.path.join(SK, f'{n}.png'))
        im.thumbnail((250, 250))
        s.paste(im, ((i % 5) * 260, (i // 5) * 260))
    s.save(os.path.join(WORK, 'sketches.jpg'), quality=85)
    print(SK)


def rows():
    out = []
    bd = boards()
    for n, (_, subject, seeds) in ICONS.items():
        out.append({'name': n, 'model': 'klein4b', 'prompt': GUIDE + ICON_STYLE + subject + b.ICON_TAIL,
                    'refs': [os.path.join(SK, f'{n}.png'), bd[n]], 'width': 1024, 'height': 1024, 'seeds': list(range(1, seeds + 1))})
    for n, subject in MARKS.items():
        out.append({'name': n, 'model': 'klein4b', 'prompt': GUIDE + MARK_STYLE + subject + b.MARK_TAIL,
                    'refs': [os.path.join(SK, f'{n}.png'), bd[n]], 'width': 1024, 'height': 1024, 'seeds': list(range(1, 7))})
    out.append({'name': 'scene-ford', 'model': 'klein4b', 'prompt': FORD,
                'refs': [os.path.join(SK, 'scene-ford.png'), os.path.join(OLD, 'b1', 'refs', b.LANDSCAPE)],
                'width': 1360, 'height': 768, 'seeds': list(range(1, 9))})
    for r in out:
        for p in r['refs']:
            assert os.path.exists(p), p
    path = os.path.join(WORK, 'rows-main.json')
    json.dump(out, open(path, 'w', encoding='utf8'), indent=1)
    print(path, sum(len(r['seeds']) for r in out), 'jobs')


# The sketches' cream ground was painted through where the subject encloses it (inside the hoop, between the boy's arm and
# his pole, behind the ferry's rope); keyed there too. The painted ground is flat to 3 levels.
HOLES = {'icon-child-hoop': 8, 'icon-child-stick-horse': 8, 'icon-ferry-help': 8}


def keyed(n, raw):
    return b.key_out(Image.open(raw), hole=HOLES.get(n, 0))


def contact_sheet():
    names = list(ICONS) + list(MARKS)
    b.WORK = os.path.dirname(WORK)   # contact() reads <WORK>/<batch>/raw
    def show(p):
        n = os.path.basename(os.path.dirname(p))
        bgd = Image.new('RGBA', (1024, 1024), (128, 140, 128, 255))
        k = keyed(n, p)
        bgd = bgd.resize(k.size)
        bgd.alpha_composite(k)
        return bgd
    b.contact('fix', names, cell=(300, 300), cols=4, show=show, name='contact')
    b.contact('fix', ['scene-ford'], show=b.scene_cut, name='contact-ford')


# --- into the shipped sheets -----------------------------------------------------------------------------------------------

# Where each sprite sits in the sheet that ships it: (sheet, index in reading order, columns, cell). The stick horse was never
# shipped and gets a sheet of its own.
CELLS = {
    'icon-work-garden': ('icons-family-local-1', 5, 4, (384, 384)),
    'icon-camp-hunt': ('icons-family-local-1', 14, 4, (384, 384)),
    'icon-child-hoop': ('icons-family-local-3', 4, 4, (384, 384)),
    'icon-ferry-help': ('icons-family-local-3', 14, 4, (384, 384)),
    'mark-cue-house': ('marks-local-1', 0, 2, (384, 384)),
    'mark-cue-wash': ('marks-local-1', 1, 2, (384, 384)),
    'mark-shelter-house': ('marks-local-1', 2, 2, (384, 384)),
    'mark-shelter-tent': ('marks-local-1', 3, 2, (384, 384)),
    'scene-ford': ('scenes-local-2', 2, 2, (1120, 700)),
    'icon-child-stick-horse': ('icons-family-local-5', 0, 1, (384, 384)),
}
SOURCES = os.path.join(b.SOURCES, f'fixes-local-{DATE}')


def picks():
    return json.load(open(os.path.join(WORK, 'picks.json'), encoding='utf8'))


def finish():
    chosen = {n: v for n, v in picks().items() if not n.startswith('_')}
    os.makedirs(os.path.join(SOURCES, 'raw'), exist_ok=True)
    final = os.path.join(WORK, 'final')
    os.makedirs(final, exist_ok=True)
    land = Image.open(os.path.join(OLD, 'b1', 'refs', b.LANDSCAPE)).convert('RGB')
    sheets = {}
    for n, seed in chosen.items():
        raw, = glob.glob(os.path.join(WORK, 'raw', n, f'{n}-s{seed}_*.png'))
        shutil.copy(raw, os.path.join(SOURCES, 'raw'))
        if n == 'scene-ford':
            im = b.colour_toward(b.scene_cut(raw), land, b.B1_MATCH).convert('RGBA')
        else:
            im = b.trim(keyed(n, raw), b.MARK_SIZE if n.startswith('mark-') else b.ICON_SIZE)
        im.save(os.path.join(final, f'{n}.png'))
        sheet, i, cols, cell = CELLS[n]
        path = os.path.join(b.ATL, f'{sheet}.png')
        if sheet not in sheets:
            sheets[sheet] = Image.open(path).convert('RGBA') if os.path.exists(path) else Image.new('RGBA', (cols * cell[0], cell[1]), (0, 0, 0, 0))
        x, y = (i % cols) * cell[0], (i // cols) * cell[1]
        sheets[sheet].paste((0, 0, 0, 0), (x, y, x + cell[0], y + cell[1]))
        sheets[sheet].paste(im, (x + (cell[0] - im.width) // 2, y + (cell[1] - im.height) // 2), im)
    for sheet, im in sheets.items():
        im.save(os.path.join(b.ATL, f'{sheet}.png'), optimize=True)
    for f in os.listdir(WORK):
        if f.startswith('contact') and f.endswith('.jpg') or f == 'sketches.jpg':
            shutil.copy(os.path.join(WORK, f), os.path.join(SOURCES, f))
    shutil.copytree(SK, os.path.join(SOURCES, 'sketches'), dirs_exist_ok=True)
    print(final, sorted(sheets))


def record():
    b.WORK, b.DATE = os.path.dirname(WORK), DATE   # records/fix-2026-10-27.json, from output/local-2026-10-27/fix
    b.record('fix')


if __name__ == '__main__':
    {'sketches': sketches, 'rows': rows, 'sheet': contact_sheet, 'finish': finish, 'record': record}[sys.argv[1]]()
