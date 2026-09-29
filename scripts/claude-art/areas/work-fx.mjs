// The work's effects and the tree coming down (request 2026-09-28 — people at work, item 15): `fx-wood-chips` (pale chips
// flying from a cut), `fx-earth-toss` (a spadeful of dark earth), `fx-dust` (a low puff where a hoe strikes dry ground),
// `fx-shavings` (curls off a drawknife or a knife) and `fx-ripple` (rings round a float), three frames each played from the
// strike; and `tree-fall` (four frames: a hardwood of `-log` size leaning, going over, down, a last bounce), played once where
// a tree is felled.
//
// Scale and anchor: every frame is drawn at a person's scale (a logical height of 480, at 1.6 times the people frames' resolution) with its anchor at the
// effect's own origin - the cut, the spade, the ground under the hoe, the knife, the float - so the page draws it with the
// same height as the worker at the point its canvas marks came from (public/work-art.js `EFFECTS`, `drawWorkLayer`). The
// chips, dust and shavings fly toward +x (the way the worker faces; mirrored for west), the earth toward -x (behind). The tree
// is anchored at its stump and falls east; drawn at a person's height it is a `-log` tree (1.95 x 0.7 of a person).
// Temporary: Astra's sheets of the same names replace them.
import { personFrame } from '../kit/rig.mjs';
import { LINE, PALETTE, tone } from '../kit/style.mjs';
import { Ink, add, blob, capsule, ellipse, poly, curve } from '../kit/svg.mjs';
import { drawCurl } from '../kit/work-props.mjs';
import { scallop } from '../kit/head.mjs';

export const AREA = 'work';
export const DATE = '2026-09-28';
const REQUEST = 'Request 2026-09-28 — people at work';
const rand = seed => { const s = Math.sin(seed * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const T = [0.22, 0.55, 0.88];
/** The ripple's rings are centred this far above its anchor, so the anchor is the bottom of the widest ring (the page sets the
 * float that far up: public/work-art.js `STROKES.fish.drawn.at`). */
export const RING = 7.8;
const rot = ([x, y], a) => { const c = Math.cos(a), s = Math.sin(a); return [x * c - y * s, x * s + y * c]; };
const quad = (c, w, h, a) => poly([[-w, -h], [w, -h], [w, h], [-w, h]].map(p => add(c, rot(p, a))));

/** Each effect: where its origin sits in its 200 px cell, and how to draw it at progress `t` (0 at the strike, 1 gone). */
export const FX = {
  'fx-wood-chips': { origin: [60, 150], what: 'pale chips of wood flying out and up from the cut', draw: (ink, t) => {
    for (let i = 0; i < 7; i++) {
      const vx = 10 + rand(i + 1) * 16, vy = 13 + rand(i + 11) * 14, p = [vx * t, vy * t - 14 * t * t + 1.5];
      ink.shape(quad(p, 2.8 + rand(i + 3) * 1.6, 1.4, rand(i + 5) * 6 + t * 9 * (i % 2 ? 1 : -1)), i % 3 ? PALETTE.endGrain : '#c89a5a', { shade: false, outline: LINE.fine + 0.6, opacity: t > 0.8 ? 0.75 : 1 });
    }
  } },
  'fx-earth-toss': { origin: [150, 150], what: 'a spadeful of dark earth thrown back over the shoulder, breaking into clods and crumbs', draw: (ink, t) => {
    for (let i = 0; i < 9; i++) {
      const vx = -(6 + rand(i + 21) * 16), vy = 15 + rand(i + 31) * 12, p = [vx * t * (1 + i * 0.04), vy * t - 16 * t * t + 3];
      const r = i < 4 ? 3.4 + rand(i) * 1.8 - t * 0.6 : 1.5 + rand(i) * 1;
      ink.shape(ellipse(p, r, r * 0.8, rand(i) * 60), i % 2 ? '#5a3c22' : '#6e4a2b', { shade: i < 4, outline: i < 4 ? LINE.fine + 0.8 : 0 });
    }
  } },
  'fx-dust': { origin: [80, 160], what: 'a low puff of pale dust where the hoe strikes dry ground, spreading and thinning', draw: (ink, t) => {
    for (let i = 0; i < 4; i++) {
      const r = 3.5 + t * (6 + i * 2), p = [(i - 1) * 5 + t * (4 + i * 3), r * 0.7 - 1 + rand(i) * 2 + t * 3];
      ink.dot(ellipse(p, r, r * 0.7), '#cdb88e', (0.7 - t * 0.55).toFixed(2));
    }
    // A few clods of the dry ground kicked up with it, solid.
    for (let i = 0; i < 5; i++) ink.shape(ellipse([2 + i * 3 + t * (6 + i * 4), 1.6 + (6 + i * 2) * t - 7 * t * t], 2.1, 1.5, i * 30), '#9a7a4e', { shade: false, outline: LINE.fine });
  } },
  'fx-shavings': { origin: [90, 110], what: 'pale curls of wood peeling off the blade and falling', draw: (ink, t) => {
    for (let i = 0; i < 4; i++) {
      const p = [(rand(i + 7) - 0.1) * 12 * t + i * 1.4, 3 + i * 0.8 - (1 + rand(i) * 2.5) * t * t * 1.3];
      drawCurl(ink, p, 2.1 + rand(i + 2) * 0.6, i % 2 ? '#ecd9a8' : PALETTE.endGrain);
    }
  } },
  'fx-ripple': { origin: [100, 120], what: 'rings of water spreading round a bobbing float', draw: (ink, t) => {
    // A little darker water where it is stirred, then the rings: the first bright and whole, the second fainter behind it.
    ink.dot(ellipse([0, RING], 9 + t * 14, (9 + t * 14) * 0.34), '#5a7a84', 0.3);
    for (const [lag, first] of [[0, true], [0.35, false]]) {
      const u = t - lag;
      if (u <= 0) continue;
      const rx = 8 + u * 15;
      ink.line(ellipse([0, RING - 0.5], rx * 0.98, rx * 0.3), { width: 1.4, colour: '#3e5a62', opacity: first ? 0.7 : 0.4 });
      ink.line(ellipse([0, RING], rx, rx * 0.34), { width: first ? 4.4 - u * 1.8 : 1.8, colour: '#e6f0f0', opacity: first ? 1 : 0.7 });
    }
  } },
};

// The tree coming down: the trunk and crown of a hardwood about 1.36 of a person tall, turned about the stump.
const TREE = 144; // rig units: 1.95 x 0.7 of a person (a person is 100 / 0.945 units from the ground to the logical top)
const FALL = [{ a: 14, what: 'leaning, the cut opening, a few leaves shaken loose' }, { a: 52, what: 'going over, the crown sweeping down' },
  { a: 90, what: 'down along the ground, leaves thrown up at the crown' }, { a: 84, what: 'the last bounce, the crown lifted a little off the ground' }];
function tree(ink) {
  const bark = '#6e4a2c', leaf = ['#3f5a26', '#56722f', '#6f8c3a'], light = '#93aa55';
  ink.shape(capsule([0, 2], [0, TREE * 0.46], 8.5, 6), bark, { off: 1.2, lift: true });
  ink.shape(capsule([0, TREE * 0.36], [-24, TREE * 0.58], 4, 2.4), bark, { off: 0.8 });
  ink.shape(capsule([0, TREE * 0.4], [26, TREE * 0.6], 4, 2.4), bark, { off: 0.8 });
  const clump = (c, r, col, seed) => ink.shape(scallop([0, 1, 2, 3, 4, 5, 6, 7].map(k => add(c, [Math.cos(k * 0.785 + seed) * r * (0.85 + rand(seed + k) * 0.25), Math.sin(k * 0.785 + seed) * r * 0.8 * (0.85 + rand(seed + k + 9) * 0.25)])), 0.18), col, { off: 2 });
  clump([-28, TREE * 0.62], 26, leaf[0], 1); clump([28, TREE * 0.64], 26, leaf[0], 2);
  clump([0, TREE * 0.72], 34, leaf[1], 3); clump([-16, TREE * 0.84], 22, leaf[2], 4); clump([16, TREE * 0.86], 21, leaf[2], 5);
  ink.dot(ellipse([-6, TREE * 0.93], 12, 6), light, 0.6);
}
// Down on the ground the crown is seen from above, as the view sees anything lying: spread out round the trunk's end and
// flattened, never below the ground line (so nothing is painted under the anchor).
function lyingTree(ink, lift) {
  const bark = '#6e4a2c', leaf = ['#3f5a26', '#56722f', '#6f8c3a'], y = 9 + lift;
  const clump = (c, rx, ry, col, seed) => ink.shape(scallop([0, 1, 2, 3, 4, 5, 6, 7].map(k => add(c, [Math.cos(k * 0.785 + seed) * rx * (0.85 + rand(seed + k) * 0.25), Math.sin(k * 0.785 + seed) * ry * (0.85 + rand(seed + k + 9) * 0.25)])), 0.18), col, { off: 2 });
  clump([TREE * 0.76, y + 24], 44, 20, leaf[0], 1);
  ink.shape(capsule([7, y], [TREE * 0.5, y + lift * 0.4 + 1], 7, 5.5), bark, { off: 1.2, lift: true });
  ink.shape(capsule([TREE * 0.38, y + 1], [TREE * 0.58, y + 14], 3.4, 2.2), bark, { off: 0.8 });
  clump([TREE * 0.62, y + 11], 32, 15, leaf[1], 2); clump([TREE * 0.9, y + 13], 36, 16, leaf[1], 3); clump([TREE * 0.8, y + 32], 26, 12, leaf[2], 4);
}
function treeFall(n) {
  const { a, what } = FALL[n];
  return personFrame(`tree-fall-${n + 1}`, ink => {
    // The stump stays; the tree turns about the hinge on its east side, and lies with its crown spread when it is down.
    ink.shape(poly([[-8, 0], [8, 0], [7.5, 9], [-7.5, 9]]), '#6e4a2c', { off: 1 });
    ink.shape(ellipse([0, 9], 7.5, 2.6), PALETTE.endGrain, { shade: false, outline: LINE.inner });
    if (n >= 2) lyingTree(ink, n === 3 ? 5 : 0);
    else {
      const inner = new Ink(`${ink.prefix}t`, ink.k, { yUp: true });
      inner.n = ink.n + 300;
      tree(inner);
      ink.defs.push(...inner.defs);
      ink.raw(`<g transform="translate(7 9) rotate(${-a}) translate(-7 0)">${inner}</g>`);
    }
    if (n === 2) for (let i = 0; i < 7; i++) ink.shape(ellipse([TREE * (0.5 + rand(i) * 0.5), 34 + rand(i + 4) * 22], 2.4, 1.3, rand(i) * 90), '#6f8c3a', { shade: false, outline: LINE.fine });
    if (n === 0) for (let i = 0; i < 3; i++) ink.shape(ellipse([40 + i * 10, TREE * (0.75 - i * 0.12)], 2.2, 1.2, 40), '#6f8c3a', { shade: false, outline: LINE.fine });
  }, { cell: { w: 640, h: 520 }, originX: 90, groundY: 480, note: `a felled hardwood, frame ${n + 1} of 4: ${what}` });
}

export const SHEETS = {
  'claude-work-fx': { cell: { w: 320, h: 320 }, columns: 3, request: REQUEST,
    replaceWith: 'item 15: three frames on the ground anchor of the work, one played from the strike, at the worker\'s scale',
    frames: Object.entries(FX).flatMap(([name, fx]) => T.map((t, i) => ({
      name: `${name}-${i + 1}`, compare: [['rust-work-3', 1], ['musket-smoke-1', 1]],
      prompt: `${fx.what}, frame ${i + 1} of 3 from the strike; a small transparent effect at a person's scale, anchored where it comes from, flying the way the worker faces; flat colour, the dark olive-brown outline on the solid bits, no text, no shadow.`,
      // Drawn at 1.6 times the people frames' resolution (a logical height of 480 for a person), so the small bits keep their line.
      draw: () => ({ ...personFrame(`${name}-${i + 1}`, ink => fx.draw(ink, t), { cell: { w: 320, h: 320 }, originX: fx.origin[0] * 1.6, groundY: fx.origin[1] * 1.6, scale: 1.6, note: `${fx.what}, frame ${i + 1} of 3` }), logicalHeight: 480 }),
    }))) },
  'claude-tree-fall': { cell: { w: 640, h: 520 }, scale: 0.6, columns: 2, request: REQUEST,
    replaceWith: 'item 15: `tree-fall`, four frames, a hardwood of -log size leaning, going over, down, a last bounce, anchored at the stump',
    frames: FALL.map((f, i) => ({ name: `tree-fall-${i + 1}`, compare: [['post-oak-log', 1.365], ['log-fallen-hardwood', 0.8], ['stump-post-oak', 1]],
      prompt: `A felled hardwood of the -log size (about 1.4 people tall), frame ${i + 1} of 4: ${f.what}. Brown bark, a rounded crown of moss and olive greens in clumps, three-quarter north-up view, falling east from its stump; warm hand-drawn storybook style, dark olive-brown outline, flat shade, transparent ground, no shadow, no text.`,
      draw: () => treeFall(i) })) },
};
/** The clips: each effect played once from the strike, and the tree's fall once. */
export const CLIPS = {
  ...Object.fromEntries(Object.entries(FX).map(([name, fx]) => [name, { frames: T.map((_, i) => ({ sprite: `${name}-${i + 1}`, duration: 150 })), loop: false, motion: 'none',
    direction: 'east; west by mirroring', prompt: `${fx.what}: three frames of 150 ms from the strike, played once.` }])),
  'tree-fall': { frames: [520, 240, 160, 320].map((duration, i) => ({ sprite: `tree-fall-${i + 1}`, duration })), loop: false, motion: 'none', direction: 'east; west by mirroring',
    prompt: 'A felled hardwood going over once: leaning (held), going over, down, the last bounce.' },
};
export const FIGURES = [];
