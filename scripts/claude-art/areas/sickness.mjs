// Sickness (docs/CLAUDE_ART_PLAN.md B4, B5, B8; request 2026-09-27 — sickness: the sick badge, the sickness icons, and the
// sick lying down). Nothing gory and nothing of the body: a blanket, a cup, a bed of blankets on the ground.
//
// - `mark-sick` (96 by 96, the family panel's mark style): a round sage-blue token like `mark-need`, a folded cream blanket
//   with a rust stripe and a tin cup on it. Plugs into `.panel-sick-mark` in public/app.js.
// - `icon-rest-road`, `icon-camp-apart`, `icon-nurse-home` (128 by 128, as the other action icons): plug into `PANEL_ICONS`.
// - `<figure>-sick-rest-s` / `-e` for the eight cast figures and the three children, lying under a blanket on a bed of
//   blankets, head on a bundle, eyes closed, a cup by the head (one frame each; `<figure>-sick-rest` is the south one, as
//   her `-injured-rest` is), and `infant-sick` (swaddled, lying on a quilt, a folded cool cloth on the brow). Plug into
//   `grownClip` (`restingSick`) in public/motion.js.
//
// Claude-drawn and temporary: Astra's frames and clips of the same names replace these on registration.
import { personFrame, frameOf, drawPerson } from '../kit/rig.mjs';
import { POSES } from '../kit/poses.mjs';
import { drawSickRest, drawBaby, figureIn, CHILD_SCALE } from '../kit/little.mjs';
import { iconFrame, ground, wagon, tent, tone, LINE, PALETTE, ellipse, blob, curve, capsule, poly, add } from '../kit/icon-bits.mjs';
import { Ink, frameSvg } from '../kit/svg.mjs';

export const AREA = 'children';
export const DATE = '2026-09-28';
const REQUEST = 'Request 2026-09-27 — sickness: the sick badge, the sickness icons, and the sick lying down';
const STYLE = 'warm hand-drawn storybook style, dark olive-brown outline, one flat shade with the light from the upper left, transparent ground, no shadow, no text.';
export const FIGURES = ['rust', 'teal', 'elder', 'blue', 'rust-woman', 'indigo', 'ochre', 'blue-girl', 'girl', 'boy', 'smallchild'];
const VIEW = { e: 'side on, the head to the west on a rolled bundle and the feet to the east', s: 'toward the camera, the feet nearest us, the head at the back on a rolled bundle' };

const restFrames = FIGURES.flatMap(figure => ['s', 'e'].map(view => ({
  name: `${figure}-sick-rest-${view}-1`, compare: [[`${figure}-injured-pose`, 1], [`${figure}-injured-${view}-pose`, 1], [`${figure}-rest-${view}-pose`, 1], [`${figure}-idle-s`, 1]],
  prompt: `${figure}, sick and resting: lying on the back ${VIEW[view]}, under a brown wool blanket with a pale stripe laid on a bed of blankets on the ground, one arm out over the blanket, the eyes closed, the hat or bonnet off; a tin cup of water set down by the head. The same face and hair as Astra's ${figure} sheets. Reads as ill and resting - not wounded, not dead: nothing of the body, no blood, no pallor. ${STYLE}`,
  draw: () => personFrame(`${figure}-sick-rest-${view}-1`, ink => drawSickRest(ink, figure, view), { note: `${figure} lying sick under a blanket, ${view === 's' ? 'toward the camera' : 'side on'}`, scale: CHILD_SCALE[figure] || 1 }),
})));
const infantSick = { name: 'infant-sick-1', height: 0.45, compare: [['infant-asleep', 0.45], ['infant-idle-e', 0.45]],
  prompt: `The family's baby, sick: swaddled in its cream wrap to the chin, lying on its back on a folded tan quilt on the ground, the eyes closed, the cheek a little flushed, a folded white cool cloth across the brow. Nothing more. ${STYLE}`,
  draw: () => personFrame('infant-sick-1', ink => drawBaby(ink, 'sick'), { note: 'the baby sick, swaddled and lying on a quilt, a cool cloth on its brow', scale: 1.25 }) };

// The badge: the panel's mark style (mark-need's round stamped token), sage blue so it is not the orange of a need or the
// rust of a hurt; a folded blanket and a tin cup on it.
function markSick() {
  const ink = new Ink('mark-sick', 1, { yUp: false, shadeOffset: 2 });
  ink.shape(ellipse([48, 52], 40, 39), '#3f5a64', { shade: false, outline: 2.6 });
  ink.shape(ellipse([48, 46], 39, 39), '#7c9ea6', { off: 3, lift: true, outline: 2.6 });
  ink.line('M 18 34 A 33 33 0 0 1 40 12', { width: 2.4, colour: '#c4dde0', opacity: 0.85 });
  ink.line(ellipse([48, 46], 32, 32), { width: 1.6, colour: '#46626c', opacity: 0.7 });
  // The folded blanket: two folds of cream wool, a rust stripe across.
  ink.shape(poly([[18, 62], [70, 62], [74, 50], [22, 50]]), '#e9d9b4', { off: 2 });
  ink.shape(poly([[22, 50], [74, 50], [70, 40], [26, 40]]), '#f4e6c4', { off: 2, lift: true });
  ink.shape(poly([[18, 62], [70, 62], [70, 66], [18, 66]]), '#d2bf94', { shade: false, outline: 2 });
  ink.line('M 40 40 L 36 50 L 34 62', { width: 4, colour: '#b0503a' });
  ink.line('M 48 40 L 44 50 L 42 62', { width: 2, colour: '#b0503a' });
  // The tin cup, a wisp of steam.
  ink.shape(poly([[60, 42], [78, 42], [76, 22], [62, 22]]), '#a8aca6', { off: 2 });
  ink.shape(ellipse([69, 22], 7, 2.4), '#6a8a94', { shade: false, outline: 2 });
  ink.line('M 78 36 Q 86 32 78 26', { width: 2.6, colour: '#1a0e08' });
  ink.line('M 66 16 Q 62 12 67 8 Q 71 4 68 1', { width: 2, colour: '#f4f0e4', opacity: 0.9 });
  return { svg: frameSvg({ name: 'mark-sick', w: 96, h: 96, body: ink.toString(), defs: ink.defs, note: 'the sick badge: a folded blanket and a tin cup on a sage-blue token' }), anchorX: 0.5, anchorY: 1 };
}

const ICON_STYLE = 'One silhouette on a transparent ground, a thin dark olive-brown outline, flat shade with the light from the upper left, the family panel icons\' warm palette; no text. Reads at 34-38 CSS px and dimmed to 40%.';
const ICONS = [
  ['icon-rest-road', 'Resting a day on the road: the family\'s covered wagon stopped on the track, and in front of it somebody lying on a bed of blankets under a brown blanket, a cup by the head.',
    ink => { ground(ink, [64, 112], 62, 14, '#c8a878'); wagon(ink, [52, 70], 1.0);
      figureIn(ink, 'sick', [66, 124], 1.02, inner => drawSickRest(inner, 'rust-woman', 'e')); }],
  ['icon-camp-apart', 'Camping apart: a crowd of wedge tents close together down on the flat, and up the bank on its own, a good way off, one small camp - a single tent and a thread of smoke.',
    ink => { ink.shape(blob([[46, 60], [70, 30], [100, 20], [126, 26], [126, 70], [60, 72]], 0.6), '#8aa058', { off: 1.4, lift: true });
      ink.shape(blob([[2, 124], [2, 74], [60, 66], [126, 70], [126, 124]], 0.3), '#a8b070', { off: 1 });
      tent(ink, [104, 38], 1.3); ink.line('M 118 32 Q 114 22 120 14 Q 124 8 120 2', { width: 2.4, colour: '#8a8a88', opacity: 0.8 });
      [[18, 96, 1], [40, 90, 1.05], [28, 114, 1.15], [56, 110, 1.1], [64, 92, 0.95], [8, 118, 1]].forEach(([x, y, s]) => tent(ink, [x, y], s)); }],
  ['icon-nurse-home', 'Nursing at home: inside the cabin by its log wall, somebody lying in a plank bed under a blanket, head on a pillow, and a woman sitting on a stool beside the bed holding out a cup.',
    ink => { for (let i = 0; i < 4; i++) ink.shape(capsule([12, 18 + i * 17], [116, 18 + i * 17], 8.5, 8.5), tone('#b88a58', i % 2 ? -0.06 : 0.04), { off: 1 });
      ink.shape(blob([[6, 86], [122, 86], [122, 118], [64, 121], [6, 118]], 0.3), '#a8865a', { off: 1 });
      // The bed: a plank frame, a pillow, the sick one under a blanket, a face turned up.
      ink.shape(poly([[4, 112], [74, 112], [74, 86], [4, 86]]), '#7a5634', { off: 1 });
      ink.shape(ellipse([18, 78], 13, 7), '#efe4c8', { off: 1, lift: true });
      ink.shape(ellipse([20, 72], 8, 8), '#dca070', { off: 1, lift: true }); ink.shape(blob([[12, 70], [14, 64], [24, 62], [28, 68], [20, 66]], 0.7), '#4a3222', { off: 0.5 });
      ink.line('M 22 73 q 2 -2 4 0', { width: LINE.inner });
      ink.shape(blob([[26, 82], [30, 70], [70, 70], [76, 80], [74, 92], [26, 92]], 0.6), '#8d6a4a', { off: 1.4, lift: true }); ink.line('M 50 70 L 50 92', { width: 3, colour: '#c9a060' });
      figureIn(ink, 'nurse', [102, 124], 0.95, inner => { const F = frameOf('rust-woman'), p = POSES.sit(F)[0];
        drawPerson(inner, 'rust-woman', { ...p, hands: { near: [17, 44], far: [14, 42] }, elbows: { near: 1, far: 1 }, after: (i2, j) => { i2.shape(poly([add(j.handNear, [-3, 1]), add(j.handNear, [3.5, 1]), add(j.handNear, [3, 9]), add(j.handNear, [-2.5, 9])]), '#a8aca6', { off: 0.6 }); } }); }, { flip: true });
      ink.shape(poly([[30, 118], [40, 118], [40, 112], [30, 112]]), '#5a3a20', { shade: false }); }],
];
// The nurse faces the bed: drawn east-facing by the rig, so the icon mirrors her group (her light then comes from the upper
// right; at 38 px nothing shows of it). ceiling: a west-facing rig view would keep the light.

export const SHEETS = {
  'claude-sick-rest': { cell: { w: 400, h: 400 }, columns: 6, request: REQUEST, replaceWith: 'item 3: -sick-rest, 1 frame, -s and -e, the figure\'s own logical height and foot baseline; infant-sick wrapped and lying', frames: [...restFrames, infantSick] },
  'claude-mark-sick': { cell: 96, columns: 1, request: REQUEST, replaceWith: 'item 1: 96 by 96, transparent, no text, the panel\'s mark style, readable at 22 px on a portrait\'s corner',
    frames: [{ name: 'mark-sick', compare: [['icon-tend-sick', 0.25]], height: 0.25, prompt: 'The sick badge in the family panel\'s mark style (a round stamped token like mark-need, with a darker rim below and a lit rim upper left): sage blue, not the orange of a need or the rust of a hurt, with a folded cream wool blanket with a rust stripe and a tin cup with a wisp of steam on it. Reads as "sick" at 22 CSS px on a portrait\'s corner. No text.', draw: markSick }] },
  'claude-sickness-icons': { cell: 128, columns: 3, request: REQUEST, replaceWith: 'item 2: one frame each, 128 by 128 as the other action icons (the request says 64), a single silhouette with a thin dark outline',
    frames: ICONS.map(([name, prompt, draw]) => ({ name, height: 0.5, compare: [['icon-rest', 0.5], ['icon-tend-sick', 0.5]], prompt: `${prompt} ${ICON_STYLE}`, draw: () => iconFrame(name, prompt, draw) })) },
};

export const CLIPS = {
  ...Object.fromEntries(FIGURES.flatMap(figure => [
    [`${figure}-sick-rest`, { frames: [{ sprite: `${figure}-sick-rest-s-1`, duration: 3200 }], motion: 'breathe', direction: 'south', prompt: `${figure} lying sick under a blanket toward the camera, held still with the renderer's slow breathing (the default sick pose, as -injured-rest is the south one).` }],
    [`${figure}-sick-rest-s`, { frames: [{ sprite: `${figure}-sick-rest-s-1`, duration: 3200 }], motion: 'breathe', direction: 'south', prompt: `${figure} lying sick under a blanket toward the camera, the feet nearest us, breathing slowly.` }],
    [`${figure}-sick-rest-e`, { frames: [{ sprite: `${figure}-sick-rest-e-1`, duration: 3200 }], motion: 'breathe', direction: 'east; west by mirroring', prompt: `${figure} lying sick under a blanket side on, breathing slowly.` }],
  ])),
  'infant-sick': { frames: [{ sprite: 'infant-sick-1', duration: 3400 }], motion: 'breathe', direction: 'east; west by mirroring', prompt: 'The baby sick, swaddled on its quilt with a cool cloth on its brow, breathing slowly.' },
};
