// The children's icons and the Runaway Scrape's (docs/CLAUDE_ART_PLAN.md B9, B10, B11): action icons for the family panel,
// 128 by 128, transparent, one silhouette with a thin dark outline, reading at 34-38 CSS px and dimmed to 40% (request
// 2026-09-15, action icons; request 2026-09-21, the children's icons). A child in one of them is the rig's own child, with a
// child's proportions, and nothing in them holds an edge or a gun (the children's rule of 2026-09-21).
//
// They plug in with no code: `PANEL_ICONS` in public/family-panel.js gives each of these keys a stroked glyph, and
// `drawIcon` takes the `icon-<key>` frame the moment one is registered - Claude's now, Astra's when hers land.
// Claude-drawn and temporary.
import { frameOf, drawPerson } from '../kit/rig.mjs';
import { POSES } from '../kit/poses.mjs';
import { CHILD_POSES, drawChildPose, figureIn, doll, at } from '../kit/little.mjs';
import { iconFrame, ground, logSide, cabin, hen, kernelsOn, milkCow, flames, hand, rain, note, chest, tone, LINE, PALETTE, ellipse, blob, curve, capsule, poly, add } from '../kit/icon-bits.mjs';

export const AREA = 'children';
export const DATE = '2026-09-28';
const STYLE = 'One silhouette on a transparent ground, a thin dark olive-brown outline, flat shade with the light from the upper left, the warm moss, rust, cream and ochre palette of the family panel\'s icons; no text. Reads at 34-38 CSS px and dimmed to 40%.';
const PLAY = "Request 2026-09-26 — children at play, babies, and the Runaway Scrape's own work";
const child = (figure, pose, i) => ink => drawChildPose(ink, figure, CHILD_POSES[pose](frameOf(figure))[i]);
const grass = '#7f9a52', earth = '#9a7a4e';

const ICONS = [
  ['icon-child-stick-horse', PLAY, 'A child galloping a stick horse: the boy side on, a plain stick between his knees trailing on the ground, the stuffed tan horse head with a red yarn mane held up before him, one knee lifted, on a scrap of grass.',
    ink => { ground(ink, [64, 120], 44, 6, grass); figureIn(ink, 'boy', [52, 122], 1.2, inner => drawChildPose(inner, 'boy', { ...CHILD_POSES['play-gallop'](frameOf('boy'))[2], horseScale: 2.6 })); }],
  ['icon-child-doll', PLAY, 'A corn-husk doll: a pale husk figure with a round husk head, a red sash at the waist and husk arms, propped up on a small folded cream cloth.',
    ink => { ink.shape(blob([[26, 112], [30, 100], [98, 98], [104, 110], [64, 118]], 0.6), '#efe0bf', { off: 1.2 }); ink.line(curve([[32, 106], [64, 104], [98, 104]]), { width: LINE.fine, colour: '#b8a07a' });
      figureIn(ink, 'doll', [66, 106], 1, inner => doll(inner, [0, 0], 7)); }],
  ['icon-child-tag', PLAY, 'Tag: two children running east, the boy behind reaching out to touch the girl running ahead of him, both mid-stride on a scrap of grass.',
    ink => { ground(ink, [64, 120], 60, 6, grass); figureIn(ink, 'boy', [36, 122], 0.98, child('boy', 'play-run', 0)); figureIn(ink, 'girl', [92, 122], 0.98, child('girl', 'play-run', 2)); }],
  ['icon-child-hide', PLAY, 'Hide-and-seek: a stack of wall logs, their cut ends toward us, and over its top a child crouched behind, peeking out with a finger to the lips.',
    ink => { figureIn(ink, 'girl', [80, 100], 0.86, child('girl', 'play-hide', 0));
      [[106, 12], [90, 12]].forEach(([y, r], i) => logSide(ink, [8 + i * 4, y], [110 - i * 5, y], r)); }],
  ['icon-child-cart', PLAY, 'A toy ox cart a child has made: a little wooden box on a stick axle with two round hard biscuits for wheels (tan, pricked with holes), a stick for a tongue, on the dirt.',
    ink => { ground(ink, [64, 114], 50, 7, earth);
      ink.shape(ellipse([78, 92], 17, 17), tone('#d6a868', -0.2), { off: 1 });
      ink.shape(poly([[26, 86], [90, 86], [94, 60], [22, 60]]), '#9a6a3c', { off: 1.2, lift: true }); ink.shape(poly([[22, 60], [94, 60], [100, 52], [30, 52]]), '#b8844a', { off: 0.6 });
      ink.line(`M 30 70 L 90 70 M 28 78 L 90 78`, { width: LINE.fine, colour: '#5a3a20', opacity: 0.7 });
      ink.shape(capsule([92, 80], [122, 88], 2.2, 2), '#c8a36c', { outline: 3 });
      ink.shape(ellipse([44, 94], 19, 19), '#d6a868', { off: 1.2, lift: true }); ink.shape(ellipse([44, 94], 4, 4), '#8a5a32', { shade: false, outline: LINE.fine });
      for (let a = 0; a < 8; a++) ink.dot(ellipse([44 + Math.cos(a * 0.785) * 11, 94 + Math.sin(a * 0.785) * 11], 1.5, 1.5), '#8a5a32'); }],
  ['icon-child-hoop', PLAY, 'Rolling a hoop: the girl running side on beside an old barrel hoop rolling ahead of her, a stick held out and down against its rim.',
    ink => { ground(ink, [64, 120], 58, 6, grass); figureIn(ink, 'girl', [36, 122], 1.18, child('girl', 'play-hoop', 0)); }],
  ['icon-child-marbles', PLAY, 'Marbles in the dirt: a ring scratched in a patch of bare earth, five glass marbles in it - blue, red, yellow, green - a bigger shooter outside the ring, and one pale knucklebone.',
    ink => { ink.shape(ellipse([64, 82], 58, 30), earth, { off: 1.2 }); ink.line(ellipse([62, 80], 40, 18), { width: 2.6, colour: '#5a3e22' });
      [[48, 78, '#6b8fb0'], [66, 72, '#c05040'], [78, 86, '#e0c060'], [56, 90, '#5a9a60'], [70, 82, '#8a6ab0']].forEach(([x, y, c]) => { ink.shape(ellipse([x, y], 6, 5.6), c, { off: 0.8, lift: true }); ink.dot(ellipse([x - 2, y - 2], 1.6, 1.4), '#ffffff', 0.8); });
      ink.shape(ellipse([108, 96], 8, 7.5), '#d8e0e4', { off: 1, lift: true }); ink.dot(ellipse([105, 93], 2, 1.8), '#ffffff', 0.9);
      ink.shape(blob([[18, 96], [22, 90], [28, 94], [34, 90], [38, 96], [30, 100], [24, 100]], 0.7), '#efe6d0', { off: 0.6 }); }],
  ['icon-child-hens', PLAY, 'Corn for the hens: a red-brown hen pecking at yellow kernels scattered on the ground, a second hen coming up behind.',
    ink => { ground(ink, [64, 114], 52, 7, earth); hen(ink, [36, 104], 1.25, { f: 1, colour: '#b9a27a' }); hen(ink, [74, 114], 1.6, { f: -1, peck: true }); kernelsOn(ink, [96, 113], 9, 16); }],
  ['icon-flee-hide', PLAY, 'Hiding what the wagon cannot take: a small iron-bound wooden chest half let down into a hole dug in a river bottom, the dug earth heaped beside it, the water just behind.',
    ink => { ink.shape(blob([[4, 40], [124, 36], [124, 52], [4, 56]], 0.4), '#6f93a6', { off: 1 }); ink.line(curve([[14, 46], [40, 44], [70, 47]]), { width: LINE.fine, colour: '#c8dde6' });
      ink.shape(blob([[6, 118], [4, 62], [60, 54], [124, 60], [122, 118]], 0.3), earth, { off: 1.2 });
      ink.shape(ellipse([52, 96], 34, 13), '#3a2a18', { shade: false });
      chest(ink, [52, 104], 1.05);
      ink.shape(blob([[48, 106], [52, 104], [86, 104], [90, 110], [52, 112]], 0.6), '#3a2a18', { shade: false, outline: 0 });
      ink.line(curve([[18, 98], [34, 110], [70, 111], [86, 98]]), { width: LINE.outer, colour: LINE.ink });
      ink.shape(blob([[88, 102], [94, 80], [106, 74], [120, 86], [122, 104]], 0.7), tone(earth, -0.12), { off: 1.2, lift: true }); }],
  ['icon-flee-bundle', PLAY, 'A bundle for a child to carry: a rust and cream checked shawl tied up round the family\'s things, the two corners knotted on top.',
    ink => { const c = '#b0503a';
      ink.shape(blob([[22, 108], [16, 80], [30, 54], [64, 46], [98, 54], [112, 80], [106, 108], [64, 116]], 0.8), c, { off: 1.6, lift: true });
      for (const x of [34, 50, 66, 82, 98]) ink.line(curve([[x - 4, 108], [x, 80], [x - 2, 54]]), { width: 3, colour: '#efd9b0', opacity: 0.85 });
      for (const y of [66, 82, 98]) ink.line(curve([[20, y + 2], [64, y - 4], [108, y + 2]]), { width: 3, colour: '#efd9b0', opacity: 0.85 });
      ink.shape(blob([[50, 54], [40, 30], [54, 34], [64, 48], [74, 34], [88, 30], [78, 54], [64, 58]], 0.8), c, { off: 1 });
      ink.shape(ellipse([64, 50], 8, 6), tone(c, -0.1), { off: 0.6 }); }],
  ['icon-road-lookout', PLAY, 'Watching the road behind: a child seen from the back standing on a road that runs away up into the distance, a hand up shading the eyes, looking back down it.',
    ink => { ink.shape(poly([[20, 124], [108, 124], [70, 18], [58, 18]]), '#c8a878', { off: 1 }); ink.line(curve([[40, 124], [58, 70], [62, 20]]), { width: LINE.fine, colour: '#9a7a4e', opacity: 0.8 });
      figureIn(ink, 'boy', [64, 124], 1.12, inner => { const F = frameOf('boy'); drawPerson(inner, 'boy', { view: 'n', hands: { right: [19, F.headC - 2] } }); }); }],
  ['icon-road-sing', PLAY, 'Singing on the road: a child walking side on, the face up, mouth open, two music notes rising over the head.',
    ink => { ground(ink, [50, 120], 40, 6, '#c8a878'); figureIn(ink, 'girl', [46, 122], 1.12, inner => { const F = frameOf('girl'); drawPerson(inner, 'girl', { ...POSES.walk(F)[0], tilt: -10, mouth: 'open' }); }); note(ink, [94, 50], 1.6); note(ink, [112, 24], 1.35); }],
  ['icon-road-little-ones', PLAY, 'Keeping the little ones walking: a bigger girl walking ahead leading a small child by the hand behind her, their hands joined between them.',
    ink => { ground(ink, [64, 120], 60, 6, '#c8a878');
      figureIn(ink, 'small', [34, 122], 0.86, inner => { const F = frameOf('smallchild'); const p = POSES.walk(F)[1]; drawPerson(inner, 'smallchild', { ...p, hands: { ...p.hands, near: at(F, 22, -6) } }); });
      figureIn(ink, 'girl', [84, 122], 1.1, inner => { const F = frameOf('girl'); const p = POSES.walk(F)[0]; drawPerson(inner, 'girl', { ...p, hands: { ...p.hands, near: at(F, -20, -12) } }); }); }],
  ['icon-camp-fire', PLAY, 'A fire kept going in the rain: sticks crossed into a little cone with flames climbing through them, a few split sticks laid by, slanting rain all round.',
    ink => { ground(ink, [64, 112], 44, 9, earth); rain(ink, [8, 6, 124, 80], 16);
      flames(ink, [64, 104], 2.1);
      for (const [a, b] of [[[36, 112], [74, 58]], [[92, 112], [54, 58]], [[50, 114], [68, 60]], [[80, 114], [60, 60]]]) ink.shape(capsule(a, b, 3.2, 2.4), PALETTE.wood, { off: 0.6 });
      logSide(ink, [16, 118], [44, 120], 4); logSide(ink, [86, 120], [114, 118], 4); }],
  ['icon-ferry-help', PLAY, 'Helping at the ferry: two small hands gripping the ferry\'s thick hauling rope over the brown river, the edge of the flatboat\'s plank rail below.',
    ink => { ink.shape(blob([[4, 96], [124, 90], [124, 124], [4, 124]], 0.3), '#6f93a6', { off: 1 }); for (const y of [104, 116]) ink.line(curve([[12, y], [40, y - 3], [70, y + 1], [110, y - 2]]), { width: LINE.fine, colour: '#c8dde6' });
            ink.shape(capsule([4, 58], [124, 34], 6, 6), '#c8a86a', { off: 1 });
      for (let x = 12; x < 124; x += 9) ink.line(`M ${x} ${58 - (x - 4) * 0.2 - 5} l 4 10`, { width: LINE.fine, colour: '#8a6a3a' });
      for (const [x, sleeve, skin] of [[40, '#c2583c', '#e3a075'], [86, '#f2d4aa', '#faa970']]) {
        const y = 58 - (x - 4) * 0.2;
        ink.shape(capsule([x - 10, 130], [x, y + 16], 12, 10), sleeve, { off: 1.2 });
        ink.shape(blob([[x - 13, y + 16], [x - 14, y - 3], [x - 3, y - 12], [x + 12, y - 8], [x + 14, y + 6], [x + 9, y + 18]], 0.8), skin, { off: 1, lift: true });
        for (const dx of [-6, 0, 6]) ink.line(`M ${x + dx} ${y - 8} l -1 13`, { width: LINE.inner, colour: tone(skin, -0.45) });
      } }],
  ['icon-share-food', PLAY, 'Sharing food: a round brown loaf held out in one hand from the left, and another open hand reaching up for it from the right.',
    ink => { hand(ink, [0, 96], [40, 74], { sleeve: '#8b432b', skin: '#e0a070', size: 1.3 });
      ink.shape(blob([[34, 70], [38, 48], [64, 38], [90, 48], [94, 70], [64, 76]], 0.8), '#b0763a', { off: 1.8, lift: true }); for (const x of [52, 64, 76]) ink.line(curve([[x - 5, 52], [x, 48], [x + 5, 52]]), { width: 2.2, colour: '#6a3e1a' });
      hand(ink, [128, 118], [92, 90], { sleeve: '#496a87', skin: '#d59a66', open: true, size: 1.3 }); }],
  ['icon-ford-carry', PLAY, 'Wading the ford: a grown man side on, waist-deep in the brown water, walking, with a small child riding on his back, the child\'s arms round his neck.',
    ink => { const F = frameOf('rust'), f = POSES.walk(F)[0];
      figureIn(ink, 'kid', [40, 80], 0.56, inner => drawPerson(inner, 'smallchild', { view: 'e', pelvis: [0, 30], lean: 14, feet: { near: [12, 10], far: [8, 12] }, knees: { near: 1, far: 1 }, hands: { near: [26, 46], far: [22, 48] } }));
      figureIn(ink, 'man', [60, 120], 1.02, inner => drawPerson(inner, 'rust', { ...f, hands: { near: [14, 30], far: [-8, 36] } }));
      ink.shape(blob([[2, 88], [40, 84], [80, 88], [126, 84], [126, 126], [2, 126]], 0.4), '#7e9aa6', { off: 1, opacity: 0.94 });
      for (const y of [92, 104]) ink.line(curve([[10, y], [44, y - 3], [82, y + 1], [118, y - 2]]), { width: LINE.fine, colour: '#d8e8ee' }); }],
  ['icon-child-help', "Request 2026-09-28 — the oldest child going for help", 'Going for help: a child running hard along a worn track toward a neighbour\'s small log cabin a way off, one arm flung out ahead toward it.',
    ink => { ink.shape(poly([[0, 124], [36, 124], [104, 70], [94, 68]]), '#c8a878', { off: 0.8 }); cabin(ink, [82, 70], 28, 20);
      figureIn(ink, 'boy', [42, 124], 1.08, child('boy', 'play-run', 0)); }],
  ['icon-flee-cow', "Request 2026-09-27 — the milk cow on the run, and Béxar before the bell", 'A child leading the family\'s milk cow on the run: the girl walking ahead side on, a rope in her hand back to the halter of a gentle fawn dairy cow with a white blaze and short horns, plodding after her.',
    ink => { ground(ink, [64, 118], 60, 6, '#c8a878'); const F = frameOf('girl'), p = POSES.walk(F)[0];
      milkCow(ink, [44, 118], 1.2, { rope: [100, 88] });
      figureIn(ink, 'girl', [104, 119], 0.72, inner => drawPerson(inner, 'girl', { ...p, hands: { ...p.hands, far: at(F, -12, -14) } })); }],
];

export const SHEETS = {
  'claude-children-icons': { cell: 128, columns: 6, request: PLAY, replaceWith: 'item 5 (and the requests named in each frame\'s provenance): one frame in the family icon atlas, 128 by 128, a single silhouette with a thin dark outline, reading at 34-38 CSS px and dimmed to 40%',
    frames: ICONS.map(([name, request, prompt, draw]) => ({ name, height: 0.5, compare: [['icon-child-play', 0.5], ['icon-child-water', 0.5]], prompt: `${prompt} ${STYLE} (${request}.)`, draw: () => iconFrame(name, prompt, draw) })) },
};
