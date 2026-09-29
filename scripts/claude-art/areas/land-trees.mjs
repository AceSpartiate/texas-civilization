// The country of 1836, the remaining species (request 2026-09-19 — the country of 1836: trees and ground cover; plan item
// F6): anacua, Texas ebony, tupelo, cedar elm, willow and shortleaf pine at `-pole`, `-log` and `-large`, and the hardwood
// stumps the woods still borrow (hickory, walnut, ash, the oaks, the live oak). Drawn by scripts/claude-art/land/tree.mjs to
// sit beside Astra's `trees-colonies-1` and `-2`: the same foot of grass, outline, light and leaf masses, at the heights her
// pole, log and large trees are cropped to (about 225, 275 and 300 source pixels), so the map's own sizes (`TREE_SIZES`,
// `KINDS.scale`) draw them as it draws hers.
//
// **What each looks like, and how sure that is.** From general botanical descriptions, not from 1836 sources (docs/BIOMES.md
// places each kind; it does not describe its shape), and drawn as a reading at play size, not a field guide:
//   - anacua (Ehretia anacua): a small tree of the lower Rio Grande and the coast, a dense rounded crown of dark, rough,
//     sandpapery leaves, often several stems.
//   - Texas ebony (Ebenopsis ebano): a small tree of the delta and the palm groves, very dark green and dense, a compact
//     rounded crown of fine twice-divided leaves on zigzag limbs, grey bark.
//   - tupelo (water tupelo, Nyssa aquatica, of the cypress-tupelo swamp): a straight trunk swelling at the foot, a narrow
//     oblong crown of glossy leaves.
//   - cedar elm (Ulmus crassifolia): a medium tree of the hills' mottes and the riverbanks, an irregular oval crown of small
//     rough leaves, the twigs drooping a little.
//   - willow (black willow, Salix nigra): along the water, leaning, often two or three stems, an open irregular crown of
//     narrow light yellow-green leaves with hanging twigs.
//   - shortleaf pine (Pinus echinata): straight, the young tree a narrow pyramid, the old one a small oval crown high on a
//     clear bole with scaly red-brown plates; shorter needles and smaller tufts than the loblolly beside it.
//   - stumps: hickory's shaggy grey strips, walnut's dark ridged bark and chocolate heartwood, ash's grey diamond furrows and
//     pale wood, a red or black oak's brown ridges and rayed tan wood, a live oak's wide low dark stump.
import { drawTree, shade } from '../land/tree.mjs';
import { drawStump } from '../land/stump.mjs';

export const AREA = 'land';
export const DATE = '2026-09-28';
const REQUEST = 'Request 2026-09-19 — the country of 1836: trees and ground cover';
const REPLACE = 'at -pole, -log and -large in the style and scale of pine-loblolly-* and live-oak-*, transparent, anchored at the foot of the trunk';
const W = 380, H = 340, GY = 322;
const HEIGHT = { pole: 225, log: 272, large: 300 };
const DRAWN = { pole: 1.95 * 0.55, log: 1.95 * 0.7, large: 1.95 * 0.85 };

const S = {
  anacua: {
    colours: ['#2f3a1c', '#465427', '#6a7838', '#95a058'], leaf: 'broad', bark: ['#6e4a34', '#9a7152', '#3f2a1c'],
    pole: { trunk: { width: 0.078, top: 0.035, fork: 0.34 }, masses: [[0, 0.64, 0.3, 0.3]], clump: 0.085, limbs: 3 },
    log: { trunk: { width: 0.085, top: 0.035, fork: 0.3, stems: 2, spread: 0.1 }, masses: [[0, 0.6, 0.42, 0.3], [-0.24, 0.5, 0.2, 0.17], [0.25, 0.53, 0.2, 0.18]], clump: 0.079 },
    large: { trunk: { width: 0.091, top: 0.04, fork: 0.28, stems: 2, spread: 0.14 }, masses: [[0, 0.6, 0.48, 0.3], [-0.3, 0.5, 0.22, 0.17], [0.3, 0.52, 0.22, 0.18]], clump: 0.073, limbs: 5 },
    what: 'an anacua: a small tree of the lower Rio Grande and the coast, a dense rounded crown of dark rough sandpapery leaves, reddish-brown furrowed bark',
  },
  ebony: {
    colours: ['#222b17', '#343f22', '#4f5a32', '#77814c'], leaf: 'fine', bark: ['#625a50', '#8c8374', '#39332c'],
    pole: { trunk: { width: 0.065, top: 0.03, fork: 0.3, bow: 0.03 }, masses: [[0, 0.62, 0.28, 0.3]], clump: 0.079, limbs: 3 },
    log: { trunk: { width: 0.078, top: 0.035, fork: 0.26, bow: 0.03 }, masses: [[0, 0.58, 0.4, 0.3], [0.18, 0.72, 0.2, 0.16]], clump: 0.073, limbs: 4 },
    large: { trunk: { width: 0.091, top: 0.04, fork: 0.24, bow: 0.04 }, masses: [[0, 0.55, 0.5, 0.28], [-0.26, 0.5, 0.22, 0.17], [0.26, 0.5, 0.22, 0.17]], clump: 0.069, limbs: 5 },
    what: 'a Texas ebony: a small tree of the delta and the palm groves, a compact rounded crown very dark green and dense with fine twice-divided leaves on zigzag limbs, grey bark',
  },
  tupelo: {
    colours: ['#33461f', '#4f672b', '#74903f', '#a6bd66'], leaf: 'broad', bark: ['#6b5e4c', '#948672', '#3f362c'],
    pole: { trunk: { width: 0.091, top: 0.03, fork: 0.42, flare: 1.4 }, masses: [[0, 0.66, 0.19, 0.3]], clump: 0.073, limbs: 3 },
    log: { trunk: { width: 0.111, top: 0.035, fork: 0.42, flare: 1.6 }, masses: [[0, 0.66, 0.24, 0.3], [0.05, 0.86, 0.14, 0.1]], clump: 0.071, limbs: 4 },
    large: { trunk: { width: 0.13, top: 0.04, fork: 0.4, flare: 1.8 }, masses: [[0, 0.65, 0.3, 0.3], [-0.04, 0.86, 0.17, 0.11]], clump: 0.069, limbs: 4 },
    what: 'a water tupelo of the cypress swamp: a straight grey-brown trunk swelling into a buttress at the foot, a narrow oblong crown of glossy leaves',
  },
  'cedar-elm': {
    colours: ['#34421f', '#4f5e2c', '#728240', '#9ba660'], leaf: 'fine', droop: 0.14, bark: ['#6a5a48', '#8f7e68', '#3d3228'],
    pole: { trunk: { width: 0.065, top: 0.03, fork: 0.35, bow: -0.02 }, masses: [[0, 0.64, 0.24, 0.3]], clump: 0.079, limbs: 3 },
    log: { trunk: { width: 0.078, top: 0.035, fork: 0.33, bow: -0.03 }, masses: [[0, 0.6, 0.33, 0.28], [0.13, 0.78, 0.18, 0.15]], clump: 0.073, limbs: 4 },
    large: { trunk: { width: 0.091, top: 0.04, fork: 0.32, bow: -0.03 }, masses: [[0, 0.6, 0.42, 0.3], [-0.22, 0.72, 0.2, 0.18], [0.22, 0.7, 0.2, 0.2]], clump: 0.069, limbs: 5 },
    what: 'a cedar elm: an irregular oval crown of small rough dark leaves, the twigs drooping a little, grey-brown bark',
  },
  willow: {
    colours: ['#4a5a26', '#6d7f35', '#95a852', '#c3cf80'], leaf: 'narrow', droop: 0.5, spacing: 0.5, gaps: 0.3, bark: ['#4f3a28', '#76593c', '#2e2016'],
    pole: { trunk: { width: 0.065, top: 0.03, fork: 0.38, lean: 0.08, bow: 0.04 }, masses: [[0.1, 0.64, 0.25, 0.28]], clump: 0.079, limbs: 3 },
    log: { trunk: { width: 0.072, top: 0.03, fork: 0.36, lean: 0.12, bow: 0.05, stems: 2, spread: 0.16 }, masses: [[0.14, 0.62, 0.36, 0.27], [-0.1, 0.52, 0.16, 0.14]], clump: 0.073 },
    large: { trunk: { width: 0.078, top: 0.035, fork: 0.34, lean: 0.14, bow: 0.06, stems: 3, spread: 0.2 }, masses: [[0.14, 0.6, 0.44, 0.3], [-0.18, 0.52, 0.18, 0.16], [0.42, 0.48, 0.18, 0.16]], clump: 0.071, limbs: 3 },
    what: 'a black willow by the water: leaning, two or three stems at the older sizes, an open irregular crown of narrow light yellow-green leaves with hanging twigs, dark furrowed bark',
  },
  'pine-shortleaf': {
    colours: ['#26341b', '#3c4f27', '#5d7236', '#869a52'], leaf: 'needle', back: 0.3, style: 'pine', plates: true, bark: ['#6c4631', '#936549', '#3f271a'],
    pole: { trunk: { width: 0.055, top: 0.015, fork: 0.95 }, masses: [[0, 0.38, 0.19, 0.08], [0, 0.52, 0.16, 0.08], [0, 0.66, 0.12, 0.07], [0, 0.79, 0.08, 0.06], [0, 0.9, 0.05, 0.05]], clump: 0.07, limbs: 0 },
    log: { trunk: { width: 0.062, top: 0.016, fork: 0.95 }, masses: [[0, 0.52, 0.19, 0.07], [0, 0.65, 0.2, 0.07], [0, 0.78, 0.15, 0.07], [0, 0.9, 0.08, 0.05]], clump: 0.064, limbs: 0 },
    large: { trunk: { width: 0.07, top: 0.02, fork: 0.93 }, masses: [[0, 0.58, 0.25, 0.07], [-0.03, 0.7, 0.24, 0.07], [0.02, 0.82, 0.18, 0.07], [0, 0.92, 0.09, 0.05]], clump: 0.062, limbs: 0 },
    what: 'a shortleaf pine: a straight bole of scaly red-brown plates, the crown of short-needled tufts smaller and more open than the loblolly\'s - a narrow pyramid young, a small oval high on the bole when old',
  },
};
const NOTE = { pole: 'young and straight', log: 'mature', large: 'old and wide' };
const SEED = { anacua: 11, ebony: 23, tupelo: 37, 'cedar-elm': 41, willow: 53, 'pine-shortleaf': 67 };

function treeFrame(kind, size) {
  const s = S[kind], z = s[size];
  const spec = { height: HEIGHT[size], limbs: z.limbs, twig: kind === 'pine-shortleaf' ? 0 : 2, offset: -(z.trunk.lean || 0) * 0.5,
    trunk: { flare: 0.6, bark: s.bark[0], barkLight: s.bark[1], barkDark: s.bark[2], plates: s.plates, ...z.trunk },
    crown: { masses: z.masses, clump: z.clump, colours: s.style === 'pine' ? s.colours : s.colours.map((c, i) => shade(c, [0.06, 0.16, 0.2, 0.26][i])), leaf: s.leaf, droop: s.droop, spacing: s.spacing, gaps: s.gaps, back: s.back, style: s.style } };
  const { body } = drawTree(spec, { w: W, h: H, gy: GY, seed: SEED[kind] * 10 + HEIGHT[size] });
  const name = `${kind}-${size}`;
  return {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <!-- ${name}: ${s.what}; ${NOTE[size]}.
       Claude-drawn stand-in (temporary: replace with Astra's ${name}). Generated by scripts/claude-art/areas/land-trees.mjs; do not hand-edit. -->
  <g stroke-linejoin="round" stroke-linecap="round">${body}</g>
</svg>
`,
    anchorX: 0.5, anchorY: +(GY / H).toFixed(4),
    // Her tree frames are cropped to the tree with its grass (about 0.94 of the crop above the anchor): the same share here.
    logicalHeight: Math.round(HEIGHT[size] / 0.94),
  };
}

const STUMPS = {
  'stump-hickory': { width: 124, height: 96, bark: '#6d665c', barkLight: '#9a9284', barkDark: '#3e3830', shaggy: true, ridges: 7, sap: '#ecd6a8', heart: '#c9a36c', heartShare: 0.75, rings: 7,
    what: 'a hickory stump: shaggy grey bark curling off in long strips, pale sapwood round a light brown heart' },
  'stump-walnut': { width: 126, height: 94, bark: '#4e3a2c', barkLight: '#6e5642', barkDark: '#2a1e16', ridges: 9, sap: '#e2c898', heart: '#5a3a24', heartShare: 0.72, rings: 6,
    what: 'a black walnut stump: dark deeply ridged bark, a thin pale ring of sapwood round a dark chocolate heart' },
  'stump-ash': { width: 118, height: 96, bark: '#77716a', barkLight: '#a39c90', barkDark: '#4a453f', diamond: true, ridges: 8, sap: '#efdcb4', heart: '#dcc08e', heartShare: 0.6, rings: 8,
    what: 'an ash stump: grey bark in diamond furrows, pale cream wood with fine rings' },
  'stump-oak': { width: 128, height: 94, bark: '#5e4630', barkLight: '#86684a', barkDark: '#35261a', ridges: 8, sap: '#e6c894', heart: '#c79a62', heartShare: 0.74, rings: 7, rays: true,
    what: 'a red or black oak stump (blackjack, water, white, bur, Texas oak): brown ridged bark, tan wood with rays from the heart' },
  'stump-oak-live': { width: 146, height: 76, bark: '#3e3228', barkLight: '#5e4c3c', barkDark: '#221a14', ridges: 10, roots: 7, sap: '#d9b98a', heart: '#8a5a3a', heartShare: 0.8, rings: 9, rays: true,
    what: 'a live oak stump: wide and low on a spread of roots, near-black blocky bark, dense dark red-brown heartwood' },
};
const SW = 240, SH = 150, SGY = 140;
function stumpFrame(name) {
  const s = STUMPS[name], { body } = drawStump(s, { w: SW, gy: SGY, seed: name.length * 97 + s.width });
  return {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${SW}" height="${SH}" viewBox="0 0 ${SW} ${SH}">
  <!-- ${name}: ${s.what}.
       Claude-drawn stand-in (temporary: replace with Astra's ${name}). Generated by scripts/claude-art/areas/land-trees.mjs; do not hand-edit. -->
  <g stroke-linejoin="round" stroke-linecap="round">${body}</g>
</svg>
`,
    anchorX: 0.5, anchorY: +(SGY / SH).toFixed(4), logicalHeight: 150,
  };
}

const KINDS_DRAWN = Object.keys(S);
export const SHEETS = {
  'claude-trees-1836': { cell: { w: W, h: H }, columns: 6, request: REQUEST, replaceWith: REPLACE,
    frames: KINDS_DRAWN.flatMap(kind => ['pole', 'log', 'large'].map(size => ({
      name: `${kind}-${size}`, height: DRAWN[size],
      compare: [[kind === 'pine-shortleaf' ? `pine-loblolly-${size}` : kind === 'willow' ? 'cottonwood' : kind === 'tupelo' || kind === 'cedar-elm' ? `elm-${size}` : `live-oak-${size}`, DRAWN[size]], [`hackberry-${size}`, DRAWN[size]]],
      prompt: `${S[kind].what}; ${NOTE[size]}, at the ${size} size. In the style of Astra's trees-colonies sheets: a small mound of grass at the foot, a tapered trunk flaring at the foot and lit down its left side with dark bark lines, limbs showing through the crown, the crown built of many overlapping leaf masses each thinly outlined in dark olive, lit upper left with small leaf dabs and dark lower right, the masses at the back darker; three-quarter north-up view, transparent ground, no shadow, no text. A reading of the species at play size from general botanical descriptions, not a field guide.`,
      draw: () => treeFrame(kind, size),
    }))) },
  'claude-stumps-1836': { cell: { w: SW, h: SH }, columns: 5, request: REQUEST, replaceWith: 'hardwood stumps in the style and scale of stump-post-oak',
    frames: Object.keys(STUMPS).map(name => ({ name, height: 1,
      compare: [['stump-post-oak', 1], ['stump-hollow-oak', 1]],
      prompt: `${STUMPS[name].what}, felled level: the cut face an ellipse seen from a little above with its sapwood ring, heart and growth rings and a check across it, the bark sides running down into flaring roots, grass at the foot; in the style and scale of Astra's stump-post-oak; dark olive-brown outline, light from the upper left, transparent ground, no shadow, no text.`,
      draw: () => stumpFrame(name),
    })) },
};
