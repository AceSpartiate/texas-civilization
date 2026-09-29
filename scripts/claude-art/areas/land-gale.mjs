// The country in a norther, the remaining trees (request 2026-09-20 — the country in a norther: trees and grass bent by the
// wind; plan item F5): a gale pose `<tree>-wind` for every tree and ground mark the map scatters that Astra's
// `weather-norther` delivery did not paint - loblolly pine, cedar, mesquite, live oak, elm, post oak, blackjack, pecan,
// hackberry and sweetgum at each of their three sizes; the biomes' longleaf, sabal palm and bald cypress (three sizes), magnolia
// and beech (two); the cottonwood; and the scrub, reeds, prickly pear, cordgrass, dune grass, thorn thickets, palmetto and yucca.
//
// **A bend of her painting, not a new drawing.** Each frame is Astra's own upright sprite of that tree, bent by
// scripts/claude-art/land/bend.mjs (the trunk curved from the foot, the crown streamed to leeward and pressed in to
// windward, the windward edge torn and turned pale side up), with a few loose leaves drawn over it by Claude. So in a
// norther the whole country keeps her trees, her colours and her hand - only the pose is Claude's - and a stand of them goes
// over together rather than turning into another artist's trees. The bent painting is embedded in the frame's SVG, which
// is therefore its complete source; the bend is repeatable, and a frame whose bend, parameters and her pixels are all
// unchanged is read back from disk as it is (the `data-bend` key), so the source does not churn with zlib's version.
//
// How strongly each kind goes over is a judgement, not a measurement, and is written here so Astra can see it: the stiff
// live oak and the dense cedar least, the pines' high crowns streaming over a stiff bole, the pliant elm, mesquite and
// cottonwood most; saplings (`-pole`) a quarter more, old trees (`-large`) less. A prickly pear does not bend in any wind:
// its pose is upright with dry grass blown past it, which is also the fix for the shear laying a cactus over.
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { astraFrame, ASTRA_ATLAS, encodePng } from '../land/pixels.mjs';
import { bendTree, bentSize } from '../land/bend.mjs';

export const AREA = 'land';
export const DATE = '2026-09-28';
const REQUEST = 'Request 2026-09-20 — the country in a norther: trees and grass bent by the wind';
const REPLACE = 'a gale silhouette in the weather-norther style, bent hard to the viewer\'s right, exactly the scale and anchor of the upright sprite';

// kind: the loose leaves - 'broad' leaves, 'needle' tufts, 'feather' (mesquite's leaflets), 'grass' blades, or none.
const KINDS = {
  'pine-loblolly': { lean: 0.12, power: 1.9, stream: 0.22, press: 0.12, crownFrom: 0.5, squash: 0.03, ripple: 0.03, erode: 0.45, flip: 0, leaves: 4, kind: 'needle',
    what: 'a loblolly pine: the tall straight bole barely bowed, the high crown of long needles streaming off it to leeward, a few needle tufts torn away' },
  cedar: { lean: 0.08, power: 1.6, stream: 0.16, press: 0.12, crownFrom: 0.22, squash: 0.04, ripple: 0.025, erode: 0.35, flip: 0, leaves: 0, kind: null,
    what: 'an Ashe juniper (cedar): the dense dark cone leaning a little and combed out to leeward, its windward face flattened; scale leaves do not fly' },
  mesquite: { lean: 0.15, power: 1.5, stream: 0.3, press: 0.2, crownFrom: 0.35, squash: 0.06, ripple: 0.05, erode: 0.5, flip: 0.3, leaves: 6, kind: 'feather',
    what: 'a mesquite: the crooked open crown of feathery leaves thrown to leeward, the windward branches bare, leaflets blown off' },
  'live-oak': { lean: 0.06, power: 1.6, stream: 0.16, press: 0.12, crownFrom: 0.35, squash: 0.06, ripple: 0.03, erode: 0.45, flip: 0.28, leaves: 6, kind: 'broad',
    what: 'a live oak: the massive low trunk unmoved, the wide dark evergreen crown pressed down and pulled to leeward, small leathery leaves torn off' },
  elm: { lean: 0.17, power: 1.6, stream: 0.3, press: 0.18, crownFrom: 0.32, squash: 0.04, ripple: 0.05, erode: 0.5, flip: 0.38, leaves: 8, kind: 'broad',
    what: 'an elm: the vase of limbs bowed to leeward, the crown streaming and thinned on the windward side, leaves leaving it' },
  'post-oak': { lean: 0.12, power: 1.7, stream: 0.24, press: 0.15, crownFrom: 0.35, squash: 0.05, ripple: 0.04, erode: 0.45, flip: 0.32, leaves: 7, kind: 'broad',
    what: 'a post oak: the stout crooked limbs holding, the rounded crown of lobed leaves pulled to leeward, the windward edge torn' },
  blackjack: { lean: 0.11, power: 1.7, stream: 0.22, press: 0.15, crownFrom: 0.33, squash: 0.05, ripple: 0.04, erode: 0.42, flip: 0.28, leaves: 6, kind: 'broad',
    what: 'a blackjack oak: smaller and darker than the post oak, its rough crown pulled to leeward, a few broad leaves blown off' },
  pecan: { lean: 0.15, power: 1.7, stream: 0.3, press: 0.18, crownFrom: 0.38, squash: 0.04, ripple: 0.05, erode: 0.5, flip: 0.36, leaves: 8, kind: 'broad',
    what: 'a pecan: the tall crown of long compound leaves streaming to leeward, the windward side thinned, leaflets flying' },
  hackberry: { lean: 0.14, power: 1.7, stream: 0.27, press: 0.17, crownFrom: 0.35, squash: 0.05, ripple: 0.05, erode: 0.48, flip: 0.34, leaves: 7, kind: 'broad',
    what: 'a hackberry: the rounded crown bowed and streaming to leeward, its thin leaves turned pale side up on the windward side' },
  sweetgum: { lean: 0.13, power: 1.8, stream: 0.26, press: 0.16, crownFrom: 0.3, squash: 0.04, ripple: 0.045, erode: 0.46, flip: 0.34, leaves: 7, kind: 'broad',
    what: 'a sweetgum: the upright pyramidal crown of star-shaped leaves bowed and pulled to leeward, leaves torn off' },
  cottonwood: { lean: 0.16, power: 1.6, stream: 0.3, press: 0.18, crownFrom: 0.35, squash: 0.04, ripple: 0.05, erode: 0.5, flip: 0.45, leaves: 9, kind: 'broad',
    what: 'a cottonwood: the tall open crown streaming to leeward, its fluttering leaves flashing pale, many blown off' },
  scrub: { lean: 0.1, power: 1.4, stream: 0.26, press: 0.16, crownFrom: 0.12, squash: 0.08, ripple: 0.05, erode: 0.4, flip: 0.3, leaves: 4, kind: 'broad',
    what: 'a low brush clump: the whole bush combed flat to leeward, a few leaves torn off' },
  reeds: { lean: 0.34, power: 1.25, stream: 0.08, press: 0.04, crownFrom: 0.05, squash: 0.14, ripple: 0.03, erode: 0, flip: 0, leaves: 3, kind: 'grass',
    what: 'a clump of reeds: the stems laid over hard to leeward from their roots, the heads streaming, a torn blade or two blown off' },
  'prickly-pear': { lean: 0.012, power: 1, stream: 0, press: 0, crownFrom: 0.9, squash: 0, ripple: 0, erode: 0, flip: 0, leaves: 4, kind: 'grass',
    what: 'a prickly pear: the pads do not bend in any wind, so it stands as it is, with dry grass blades blown past it to leeward' },
  // The biomes of 1836 (`biome-trees-fields`, `biome-ground-bexar`, 2026-09-22), which had no gale pose either.
  'pine-longleaf': { lean: 0.11, power: 2, stream: 0.24, press: 0.12, crownFrom: 0.6, squash: 0.03, ripple: 0.03, erode: 0.4, flip: 0, leaves: 3, kind: 'needle',
    what: 'a longleaf pine: the very tall straight bole hardly bowed, the sparse high tufts of long needles combed out to leeward' },
  'palm-sabal': { lean: 0.05, power: 2.2, stream: 0.36, press: 0.26, crownFrom: 0.62, squash: 0.05, ripple: 0.04, erode: 0.3, flip: 0, leaves: 0, kind: null,
    what: 'a Texas (sabal) palm: the grey trunk stiff, the round head of fan leaves blown inside out and streaming to leeward' },
  'cypress-bald': { lean: 0.09, power: 1.8, stream: 0.24, press: 0.14, crownFrom: 0.35, squash: 0.04, ripple: 0.04, erode: 0.4, flip: 0.1, leaves: 4, kind: 'needle',
    what: 'a bald cypress: the buttressed foot unmoved, the flat feathery crown pulled to leeward, sprays of needles torn off' },
  magnolia: { lean: 0.09, power: 1.7, stream: 0.2, press: 0.14, crownFrom: 0.3, squash: 0.04, ripple: 0.035, erode: 0.38, flip: 0.12, leaves: 4, kind: 'broad',
    what: 'a southern magnolia: the dense crown of big stiff evergreen leaves pressed to leeward, a few torn off (their undersides rusty, so little turns pale)' },
  beech: { lean: 0.13, power: 1.7, stream: 0.27, press: 0.16, crownFrom: 0.3, squash: 0.04, ripple: 0.045, erode: 0.46, flip: 0.34, leaves: 7, kind: 'broad',
    what: 'an American beech: the smooth grey trunk bowed a little, the broad crown streaming to leeward, thin leaves turned and flying' },
  'marsh-cordgrass': { lean: 0.3, power: 1.25, stream: 0.08, press: 0.04, crownFrom: 0.05, squash: 0.13, ripple: 0.03, erode: 0, flip: 0, leaves: 2, kind: 'grass',
    what: 'a clump of marsh cordgrass: the blades laid over to leeward from the roots' },
  'dune-grass': { lean: 0.3, power: 1.25, stream: 0.08, press: 0.04, crownFrom: 0.05, squash: 0.13, ripple: 0.03, erode: 0, flip: 0, leaves: 2, kind: 'grass',
    what: 'sea oats on the dune: the stems and heads laid over to leeward' },
  'thicket-thorn-1': { lean: 0.07, power: 1.4, stream: 0.2, press: 0.14, crownFrom: 0.15, squash: 0.06, ripple: 0.04, erode: 0.35, flip: 0.15, leaves: 2, kind: 'feather',
    what: 'a thorn thicket (blackbrush, guajillo, granjeno): the stiff grey-green clump combed a little to leeward' },
  'thicket-thorn-2': { lean: 0.07, power: 1.4, stream: 0.2, press: 0.14, crownFrom: 0.15, squash: 0.06, ripple: 0.04, erode: 0.35, flip: 0.15, leaves: 2, kind: 'feather',
    what: 'a second thorn thicket, combed a little to leeward' },
  palmetto: { lean: 0.04, power: 1, stream: 0.3, press: 0.2, crownFrom: 0.2, squash: 0.06, ripple: 0.04, erode: 0.25, flip: 0, leaves: 0, kind: null,
    what: 'a dwarf palmetto: no trunk to bend, the fans themselves blown over and streaming to leeward' },
  yucca: { lean: 0.02, power: 1, stream: 0.05, press: 0.03, crownFrom: 0.5, squash: 0, ripple: 0.01, erode: 0, flip: 0, leaves: 3, kind: 'grass',
    what: 'a Spanish dagger (yucca): its stiff blades hardly move, dry grass blown past it' },
};
const SIZED = ['pine-loblolly', 'cedar', 'mesquite', 'live-oak', 'elm', 'post-oak', 'blackjack', 'pecan', 'hackberry', 'sweetgum'];
const AGE = { pole: { lean: 1.25, stream: 1.1, note: 'a sapling, more pliant' }, log: { lean: 1, stream: 1, note: 'a mature tree' }, large: { lean: 0.85, stream: 0.95, note: 'an old tree, stiffer' } };
// How tall the map draws each (public/app.js: SIZE.timberTree 1.95 × TREE_SIZES), for the play-size comparison.
const DRAWN = { pole: 1.95 * 0.55, log: 1.95 * 0.7, large: 1.95 * 0.85 };

const SVG_DIR = new URL('../../../public/assets/claude-standins/svg/land-gale/', import.meta.url);
const lf = text => text.replace(/\r\n/g, '\n');
const CODE = createHash('sha256').update(['../land/bend.mjs', '../land/pixels.mjs'].map(p => lf(readFileSync(new URL(p, import.meta.url), 'utf8'))).join('\n')).digest('hex').slice(0, 12);

const f2 = v => Math.round(v * 100) / 100;
const hex = rgb => '#' + rgb.map(v => Math.max(0, Math.min(255, Math.round(v * 255))).toString(16).padStart(2, '0')).join('');
function looseLeaf(l, colour, kind) {
  const s = l.size, t = `translate(${f2(l.x)} ${f2(l.y)}) rotate(${f2(l.turn)})`, ink = '#2a2112';
  if (kind === 'broad') return `<g transform="${t}"><path d="M ${f2(-s)} 0 C ${f2(-s * 0.4)} ${f2(-s * 0.55)} ${f2(s * 0.45)} ${f2(-s * 0.5)} ${f2(s)} 0 C ${f2(s * 0.45)} ${f2(s * 0.5)} ${f2(-s * 0.4)} ${f2(s * 0.55)} ${f2(-s)} 0 Z" fill="${colour}" stroke="${ink}" stroke-width="0.8" stroke-linejoin="round"/><path d="M ${f2(-s * 0.8)} 0 L ${f2(s * 0.7)} 0" stroke="${ink}" stroke-width="0.6" opacity="0.6"/></g>`;
  if (kind === 'needle') return `<g transform="${t}" stroke="${colour}" stroke-width="1.3" stroke-linecap="round" fill="none">${[-24, -8, 8, 24].map(a => `<path d="M 0 0 L ${f2(Math.cos(a * Math.PI / 180) * s * 1.5)} ${f2(Math.sin(a * Math.PI / 180) * s * 1.5)}"/>`).join('')}<path d="M 0 0 L ${f2(-s * 0.35)} 0" stroke="#5a3f24" stroke-width="1.6"/></g>`;
  if (kind === 'feather') return `<g transform="${t}"><path d="M ${f2(-s)} 0 L ${f2(s)} 0" stroke="#4a3a22" stroke-width="0.8"/>${[-0.6, -0.1, 0.4].flatMap(x => [-1, 1].map(side => `<ellipse cx="${f2(x * s + s * 0.15)}" cy="${f2(side * s * 0.22)}" rx="${f2(s * 0.24)}" ry="${f2(s * 0.1)}" transform="rotate(${side * 28} ${f2(x * s + s * 0.15)} ${f2(side * s * 0.22)})" fill="${colour}" stroke="${ink}" stroke-width="0.5"/>`)).join('')}</g>`;
  if (kind === 'grass') return `<path transform="${t}" d="M ${f2(-s * 1.4)} 0 Q 0 ${f2(-s * 0.5)} ${f2(s * 1.4)} ${f2(-s * 0.15)}" stroke="#b69a5a" stroke-width="${f2(Math.max(1.2, s * 0.22))}" fill="none" stroke-linecap="round"/>`;
  return '';
}

// The first proof (docs/evidence/claude-art/land-gale-77.png, 2026-09-28) drew every kind at the numbers above and, beside
// the shear it replaces (0.27-0.44 at the norther's GALE threshold), the gale read *less* windy than the light air before it:
// a tree would straighten up as the norther arrived. So every kind goes over by this much more, keeping their order.
const GUST = { lean: 1.45, stream: 1.3 };
function paramsOf(base, size) {
  const age = AGE[size] || AGE.log;
  return { ...base, lean: base.lean * age.lean * GUST.lean, stream: base.stream * age.stream * GUST.stream };
}

/** One gale frame: Astra's upright `upright`, bent, in a cell of `cell`, its ground anchor where hers is in the bent picture. */
function galeFrame(name, upright, p, cell) {
  const src = astraFrame(upright);
  const key = createHash('sha256').update(JSON.stringify({ CODE, p, cell, sha: src.sha })).digest('hex').slice(0, 16);
  const disk = new URL(`claude-${name}.svg`, SVG_DIR);
  const ox = 0, oy = cell.h - bentSize(src, p).h;
  const numbers = { anchorX: 0, anchorY: 0, logicalHeight: src.h };
  if (existsSync(disk)) {
    const kept = lf(readFileSync(disk, 'utf8'));
    if (kept.includes(`data-bend="${key}"`)) {
      const size = bentSize(src, p);
      return { svg: kept, anchorX: +((ox + size.ax) / cell.w).toFixed(4), anchorY: +((oy + size.gy) / cell.h).toFixed(4), logicalHeight: src.h };
    }
  }
  const bent = bendTree(src, p);
  const png = encodePng(bent.img).toString('base64');
  const colour = hex(bent.leaf.map(v => Math.min(1, v * 1.12 + 0.03)));
  const leaves = bent.loose.map(l => looseLeaf(l, colour, p.kind)).join('');
  numbers.anchorX = +((ox + bent.ax) / cell.w).toFixed(4);
  numbers.anchorY = +((oy + bent.gy) / cell.h).toFixed(4);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${cell.w}" height="${cell.h}" viewBox="0 0 ${cell.w} ${cell.h}" data-bend="${key}">
  <!-- ${name}: Astra's ${upright} in a hard norther - her painting bent by scripts/claude-art/land/bend.mjs (lean ${f2(p.lean)}, stream ${f2(p.stream)}, press ${f2(p.press)}), loose leaves drawn by Claude.
       Claude-drawn stand-in (temporary: replace with Astra's ${name}). Generated by scripts/claude-art/areas/land-gale.mjs; do not hand-edit. -->
  <g transform="translate(${ox} ${oy})"><image width="${bent.img.w}" height="${bent.img.h}" href="data:image/png;base64,${png}"/>${leaves}</g>
</svg>
`;
  return { svg, ...numbers };
}

const frames = [];
for (const tree of SIZED) for (const size of ['pole', 'log', 'large']) frames.push({ name: `${tree}-${size}-wind`, upright: `${tree}-${size}`, tree, size, p: paramsOf(KINDS[tree], size), height: DRAWN[size] });
for (const tree of ['pine-longleaf', 'palm-sabal', 'cypress-bald']) for (const size of ['pole', 'log', 'large']) frames.push({ name: `${tree}-${size}-wind`, upright: `${tree}-${size}`, tree, size, sheet: 'biome', p: paramsOf(KINDS[tree], size), height: DRAWN[size] });
for (const tree of ['magnolia', 'beech']) for (const size of ['log', 'large']) frames.push({ name: `${tree}-${size}-wind`, upright: `${tree}-${size}`, tree, size, sheet: 'biome', p: paramsOf(KINDS[tree], size), height: DRAWN[size] });
for (const tree of ['cottonwood', 'scrub', 'reeds', 'prickly-pear', 'marsh-cordgrass', 'dune-grass', 'thicket-thorn-1', 'thicket-thorn-2', 'palmetto', 'yucca']) frames.push({ name: `${tree}-wind`, upright: tree, tree, size: null, p: paramsOf(KINDS[tree], 'log'), height: tree === 'cottonwood' ? 1.95 * 1.12 : 1 });

function sheet(list, columns) {
  const cell = { w: 0, h: 0 };
  for (const f of list) {
    const u = ASTRA_ATLAS.frames[f.upright], size = bentSize({ w: u.w, h: u.h, anchorX: u.anchorX, anchorY: u.anchorY }, f.p);
    cell.w = Math.max(cell.w, size.w); cell.h = Math.max(cell.h, size.h);
  }
  cell.w += 4; cell.h += 4;
  return { cell, columns, request: REQUEST, replaceWith: REPLACE, frames: list.map(f => ({
    name: f.name, height: f.height, compare: [[f.upright, f.height], ...(!f.size && f.tree !== 'cottonwood' ? [['grass-tuft-wind', 1]] : [['oak-broad-wind', DRAWN.large]])],
    prompt: `${KINDS[f.tree].what}${f.size ? ` (${AGE[f.size].note})` : ''}, in a hard norther blowing from the viewer's left to right: Astra's own upright ${f.upright}, her painting bent rather than redrawn - the trunk curving over from a foot that stays put, the top about ${Math.round(f.p.lean * 100)} in 100 of the height to leeward, the crown drawn out ${Math.round(f.p.stream * 100)} in 100 to leeward and pressed in to windward, its windward edge torn and some leaves turned pale side up; Claude's loose leaves in her green. Her scale and ground anchor exactly (logical height her frame's height), transparent ground, no shadow, no text.`,
    draw: () => galeFrame(f.name, f.upright, f.p, cell),
  })) };
}
const bySize = size => frames.filter(f => f.size === size && !f.sheet);
export const SHEETS = {
  'claude-gale-pole': sheet(bySize('pole'), 5),
  'claude-gale-log': sheet(bySize('log'), 4),
  'claude-gale-large': sheet(bySize('large'), 4),
  'claude-gale-biome': sheet(frames.filter(f => f.sheet === 'biome'), 4),
  'claude-gale-ground': sheet(frames.filter(f => !f.size), 4),
};
/** Every gale frame and the upright it bends, for GALE_POSES in public/weather-art.js and the proofs. */
export const GALE = Object.fromEntries(frames.map(f => [f.upright, f.name]));
