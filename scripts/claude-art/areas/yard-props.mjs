// Props of ambient life (request 2026-09-28 — ambient life, item 2): `washtub` (a wooden tub with a washboard standing in
// it), `woodpile-frontier` (split rails stacked by a cabin) and `hens-pecking` (two hens, 2 frames). Plugs into `propItem`
// (public/ambient.js), in place of the plain `bucket`, the Alamo's `alamo-firewood` and `chicken-idle`.
//
// Each is drawn at a person's scale (logical height 300, as a people frame) on its own ground anchor, so the page draws it
// with the height of the person beside it and it stands at its true size: the tub a little over knee high with the board,
// the rails about knee high, a hen about a quarter of a person. The board leans toward the -x side, where the washer kneels;
// the page mirrors it with the washer. Temporary: Astra's frames of the same names replace them.
import { personFrame } from '../kit/rig.mjs';
import { LINE, PALETTE, tone } from '../kit/style.mjs';
import { add, blob, capsule, ellipse, poly, curve } from '../kit/svg.mjs';
import { drawWallLog } from '../kit/work-props.mjs';

export const AREA = 'work';
export const DATE = '2026-09-28';
const REQUEST = 'Request 2026-09-28 — ambient life';
const rand = seed => { const s = Math.sin(seed * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

function washtub(ink) {
  const w = 34, h = 13;
  // The board behind the far rim first, leaning toward -x; then the tub over its foot.
  const b0 = [-8, 4], b1 = [-15, 32], n = [0.97, 0.24];
  const corner = (p, s) => add(p, [n[0] * s, n[1] * s]);
  ink.shape(poly([corner(b0, -6), corner(b0, 6), corner(b1, 6), corner(b1, -6)]), '#b08a58', { off: 0.8, outline: 3 });
  for (let i = 1; i < 8; i++) { const p = [b0[0] + (b1[0] - b0[0]) * (0.2 + i * 0.09), b0[1] + (b1[1] - b0[1]) * (0.2 + i * 0.09)]; ink.line(`M ${corner(p, -4.6).join(' ')} L ${corner(p, 4.6).join(' ')}`, { width: 1.3, colour: '#7a5a32' }); }
  ink.shape(poly([[-w / 2, h], [w / 2, h], [w * 0.42, 0], [-w * 0.42, 0]]), '#9a6a3c', { off: 1.2, outline: 3.4 });
  for (const x of [-9, 0, 9]) ink.line(`M ${x} ${h - 0.5} L ${x * 0.86} 0.5`, { width: 1.2, colour: tone('#9a6a3c', -0.3), opacity: 0.8 });
  for (const y of [2.5, h - 3]) ink.line(`M ${-w * (0.42 + y / h * 0.08)} ${y} L ${w * (0.42 + y / h * 0.08)} ${y}`, { width: 2, colour: PALETTE.iron });
  ink.shape(ellipse([0, h], w / 2, 3.4), '#7a9aa2', { shade: false, outline: 3 });
  ink.dot(ellipse([4, h + 0.6], 6, 1.2), '#e8f0ee', 0.8);
  ink.shape(blob([[5, h + 0.8], [9, h + 2.4], [13, h + 1], [10, h - 0.6]], 0.8), '#ece0c6', { shade: false, outline: 1.8 });
}

function woodpile(ink) {
  // Split rails, eleven feet long in life and shortened by the view: stacked in four courses, turned a little so their split
  // ends face the camera (pale wedge-shaped heartwood with a strip of dark bark) and their lengths run back to the west.
  const D = [-0.94 * 52, 0.34 * 0.55 * 52], rows = [5, 4, 3, 2];
  rows.forEach((n, row) => {
    for (let i = 0; i < n; i++) {
      const seed = row * 10 + i, x = -8 + (i + row * 0.5) * 10 + (rand(seed) - 0.5) * 1.5, y = 1 + row * 7.2;
      const bl = [x - 5, y], br = [x + 5, y - 0.4], apex = [x + 0.3 + (rand(seed + 3) - 0.5) * 2, y + 8];
      const len = 0.9 + rand(seed + 1) * 0.15, d = [D[0] * len, D[1] * len];
      ink.shape(poly([bl, apex, add(apex, d), add(bl, d)]), tone(PALETTE.wood, (rand(seed + 2) - 0.5) * 0.25), { off: 0.8, outline: 2.8 });
      ink.shape(poly([bl, br, apex]), PALETTE.endGrain, { off: 0.4, outline: 2.4 });
      ink.line(`M ${bl.join(' ')} L ${br.join(' ')}`, { width: 2.6, colour: '#4e3019' });
    }
  });
}

function hen(ink, [x, y], { peck = false, facing = 1, colour = '#a8582a', k = 1.3 } = {}) {
  const f = facing, P = (dx, dy) => [x + dx * f * k, y + dy * k];
  for (const lx of [-1, 2]) ink.line(`M ${P(lx, 4).join(' ')} L ${P(lx + 0.4, 0.4).join(' ')} L ${P(lx + 2, 0).join(' ')}`, { width: 1.6, colour: '#c8902a' });
  ink.shape(blob([P(-5, 11), P(-10.5, 14.5), P(-9, 17), P(-2.5, 13)], 0.8), tone(colour, -0.3), { off: 0.6 });
  ink.shape(blob([P(-8, 9), P(-6, 4), P(0, 2.6), P(6, 4.2), P(8, 8), P(5.5, 11.5), P(-2, 12.5)], 0.9), colour, { off: 1, lift: true });
  ink.line(curve([P(-4.5, 8.5), P(0, 7.2), P(3.5, 8.6)]), { width: 1.2, colour: tone(colour, -0.35), opacity: 0.8 });
  const head = peck ? P(10.5, 3) : P(6.5, 15.5);
  ink.shape(capsule(P(4.5, 9), head, 2.4 * k, 2 * k), colour, { off: 0.5 });
  ink.shape(ellipse(head, 2.5 * k, 2.3 * k), colour, { off: 0.5 });
  const b = peck ? [1.2, -1.6] : [2.2, -0.2];
  ink.shape(poly([add(head, [f * k * (b[0] + 0.4), (b[1] + 1) * k]), add(head, [f * k * (b[0] + 2.2), (b[1] - 0.2) * k]), add(head, [f * k * (b[0] + 0.2), (b[1] - 0.9) * k])]), '#e0b040', { shade: false, outline: 1.4 });
  ink.shape(blob([add(head, [-1.2 * f * k, 2 * k]), add(head, [0.2 * f * k, 3.4 * k]), add(head, [1.4 * f * k, 2 * k])], 0.9), '#c0302a', { shade: false, outline: 1.4 });
  ink.dot(ellipse(add(head, [0.9 * f * k, 0.5 * k]), 0.6, 0.6), LINE.ink);
}

export const SHEETS = {
  'claude-yard-props': { cell: { w: 320, h: 200 }, columns: 4, request: REQUEST,
    replaceWith: 'item 2: transparent, anchored at its base, at the scale of the people beside it',
    frames: [
      { name: 'washtub', compare: [['bucket', 0.24], ['rust-woman-care-1', 1]], draw: () => personFrame('washtub', washtub, { cell: { w: 320, h: 200 }, originX: 160, groundY: 180, note: 'a wooden washtub with a washboard standing in it' }),
        prompt: 'A wooden washtub of staves bound with two iron hoops, grey water in it, a wooden ribbed washboard standing in it leaning to one side, a cloth over the rim; three-quarter north-up view, at the scale of the person kneeling at it; warm hand-drawn storybook style, dark olive-brown outline, flat shade, transparent ground, no shadow.' },
      { name: 'woodpile-frontier', compare: [['alamo-firewood', 0.3], ['wood-pile-1', 1.2], ['rust-idle-e', 1]], draw: () => personFrame('woodpile-frontier', woodpile, { cell: { w: 320, h: 200 }, originX: 190, groundY: 180, note: 'split rails stacked by a cabin' }),
        prompt: 'Split rails stacked by a cabin: four courses of rough split oak rails, their split ends toward the camera showing pale wedge-shaped heartwood and a strip of dark bark, about knee high; three-quarter north-up view; warm hand-drawn storybook style, dark olive-brown outline, flat shade, transparent ground, no shadow.' },
      ...[0, 1].map(i => ({ name: `hens-pecking-${i + 1}`, compare: [['chicken', 0.26], ['rust-sow-1', 1]], draw: () => personFrame(`hens-pecking-${i + 1}`, ink => { hen(ink, [8, 5], { peck: i === 1, facing: -1, colour: '#8e4a24' }); hen(ink, [-6, 0], { peck: i === 0 }); }, { cell: { w: 320, h: 200 }, originX: 160, groundY: 180, note: `two hens pecking, frame ${i + 1} of 2` }),
        prompt: `Two russet hens pecking at scattered corn, frame ${i + 1} of 2: ${i ? 'the near hen\'s head up, the far one pecking' : 'the near hen pecking, the far one\'s head up'}; three-quarter north-up view, a hen about a quarter of a person tall; warm hand-drawn storybook style, dark olive-brown outline, flat shade, transparent ground, no shadow.` })),
    ] },
};
export const CLIPS = {
  'hens-pecking': { frames: [{ sprite: 'hens-pecking-1', duration: 420 }, { sprite: 'hens-pecking-2', duration: 380 }], loop: true, motion: 'none', direction: 'east; west by mirroring',
    prompt: 'Two russet hens pecking at scattered corn in turn, one head down while the other is up, looping at 420 and 380 ms.' },
};
export const FIGURES = [];
