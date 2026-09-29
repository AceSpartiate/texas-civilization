// The work's effects and the tree coming down (request 2026-09-28 — people at work, item 15): `fx-wood-chips` (pale chips
// flying from a cut), `fx-earth-toss` (a spadeful of dark earth), `fx-dust` (a low puff where a hoe strikes dry ground),
// `fx-shavings` (curls off a drawknife or a knife) and `fx-ripple` (rings round a float), three frames each played from the
// strike. (`tree-fall`, the tree coming down, was drawn here too; the two sets were reconciled on 2026-09-29 and the one kept is
// area F's, bent from Astra's own post oak: scripts/claude-art/areas/land-scenery.mjs.)
//
// Scale and anchor: every frame is drawn at a person's scale (a logical height of 480, at 1.6 times the people frames' resolution) with its anchor at the
// effect's own origin - the cut, the spade, the ground under the hoe, the knife, the float - so the page draws it with the
// same height as the worker at the point its canvas marks came from (public/work-art.js `EFFECTS`, `drawWorkLayer`). The
// chips, dust and shavings fly toward +x (the way the worker faces; mirrored for west), the earth toward -x (behind).
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

export const SHEETS = {
  'claude-work-fx': { cell: { w: 320, h: 320 }, columns: 3, request: REQUEST,
    replaceWith: 'item 15: three frames on the ground anchor of the work, one played from the strike, at the worker\'s scale',
    frames: Object.entries(FX).flatMap(([name, fx]) => T.map((t, i) => ({
      name: `${name}-${i + 1}`, compare: [['rust-work-3', 1], ['musket-smoke-1', 1]],
      prompt: `${fx.what}, frame ${i + 1} of 3 from the strike; a small transparent effect at a person's scale, anchored where it comes from, flying the way the worker faces; flat colour, the dark olive-brown outline on the solid bits, no text, no shadow.`,
      // Drawn at 1.6 times the people frames' resolution (a logical height of 480 for a person), so the small bits keep their line.
      draw: () => ({ ...personFrame(`${name}-${i + 1}`, ink => fx.draw(ink, t), { cell: { w: 320, h: 320 }, originX: fx.origin[0] * 1.6, groundY: fx.origin[1] * 1.6, scale: 1.6, note: `${fx.what}, frame ${i + 1} of 3` }), logicalHeight: 480 }),
    }))) },
};
/** The clips: each effect played once from the strike. */
export const CLIPS = {
  ...Object.fromEntries(Object.entries(FX).map(([name, fx]) => [name, { frames: T.map((_, i) => ({ sprite: `${name}-${i + 1}`, duration: 150 })), loop: false, motion: 'none',
    direction: 'east; west by mirroring', prompt: `${fx.what}: three frames of 150 ms from the strike, played once.` }])),
};
export const FIGURES = [];
