// The style tokens every Claude-drawn frame is made from: measured from Astra's shipped atlases by measure-style.mjs
// (measured.json beside this file), never guessed. docs/ART_STYLE.md is her brief; this is the brief turned into numbers.
//
// Change a number here only by re-measuring: `node scripts/claude-art/kit/measure-style.mjs` rewrites measured.json, and
// the values below that are read from it follow. Where a token is chosen rather than read, the comment says so and why.
import { readFileSync } from 'node:fs';

export const MEASURED = JSON.parse(readFileSync(new URL('./measured.json', import.meta.url), 'utf8'));
const g = MEASURED.geometry;

/**
 * The people frame, in the numbers `drawSprite` (public/art.js) uses: a frame is scaled so its `logicalHeight` becomes the
 * height asked for, and set down on its ground anchor. Astra's `civilians`, `people-walk` and `people-vertical` rows are
 * normalised to a logical height of about 300 source pixels (civilians median 300, people-walk 301, people-vertical 297), and
 * the ground (the anchor) sits at 0.94 of it (civilians 0.943, people-walk 0.941, people-vertical 0.950): the top of the hat
 * to the ground is 0.94 of the height the game asks for, and the lower foot of a three-quarter stride hangs just below.
 *
 * A Claude people frame reproduces exactly that: `LOGICAL` source pixels of logical height, the figure's top-to-ground
 * `FIGURE_PX`, and the ground at `groundY` in a cell with room round it for a raised tool. So a Claude frame drawn at the
 * same height as hers stands the same size on the same foot line.
 */
export const PEOPLE = Object.freeze({
  logicalHeight: 300,
  ground: +((g.civilians.groundOfLogical.median + g['people-walk'].groundOfLogical.median + g['people-vertical'].groundOfLogical.median) / 3).toFixed(4),
  // Astra's cell is a quarter of a 1254 sheet (313.5 square); her frames are cropped to their alpha. Claude's are drawn in a
  // larger fixed cell, uncropped, so a tool raised over the head or swung out to the side is never cut off; the anchor and
  // the logical height, not the cell, set the drawn size.
  cell: Object.freeze({ w: 400, h: 400 }),
  groundY: 372,
  // Measured width of a standing figure (civilians median w / L 0.444) and of a stride (people-walk 0.615).
  standingWidth: g.civilians.widthOfLogical.median,
  strideWidth: g['people-walk'].widthOfLogical.median,
});
export const FIGURE_PX = Math.round(PEOPLE.logicalHeight * PEOPLE.ground);
/** One rig unit in source pixels: the rig measures a figure 100 units from the ground to the top of the hat. */
export const UNIT = FIGURE_PX / 100;

/**
 * The line. Her outline is near-black where the antialiasing meets the transparency (`edge`) and a dark olive-brown in its
 * body (`ink`: civilians #22150c, people-vertical #23180f, people-walk #321f12); it runs 4-5 source pixels thick at a
 * 300-pixel figure (median 5 civilians, 4 people-walk, 3 people-vertical). Inner lines (a fold, a seam, the brim over the
 * face) are about half that.
 */
export const LINE = Object.freeze({
  ink: MEASURED.line.civilians.ink,
  edge: MEASURED.line.civilians.edge,
  outer: 4.2,
  inner: 2.2,
  fine: 1.4,
});

/** Light from the upper left (the art-prompts.json preambles: "light from upper left"); shade falls to the lower right. */
export const LIGHT = Object.freeze({ from: [-0.6, -0.8], shadeOffset: 0.16, shade: -0.22, lift: 0.12 });

/**
 * The view. North-up, slightly elevated three-quarter: a thing's front and its top both show, with no isometric diamond.
 * `depth` is how much a yard running into the screen is shortened against a yard across it. Chosen, not measured: 0.55 reads
 * the top of her `stump` (an ellipse about 0.5 as tall as wide) and the top of her `bucket` and `barrel` (0.45-0.55).
 * ceiling: one foreshortening for the whole library; a measured one per sheet would be the way out if a Claude prop sits
 * visibly steeper or flatter than hers beside it.
 */
export const VIEW = Object.freeze({ depth: 0.55 });

/** Adjust a #rrggbb colour's lightness by `amount` (-1..1), keeping its hue: the kit's flat shade and lift. */
export function tone(hex, amount) {
  const n = parseInt(hex.slice(1), 16);
  const mix = v => amount < 0 ? v * (1 + amount) : v + (255 - v) * amount;
  return '#' + [16, 8, 0].map(s => Math.max(0, Math.min(255, Math.round(mix((n >> s) & 255)))).toString(16).padStart(2, '0')).join('');
}

/**
 * The palette Astra's scenes share (the art-prompts.json preamble: "muted moss/olive greens, honey ochre, weathered wood, rust
 * and cream"), each read from her sheets: `measured.json` `palette.*.common` and `.regions`.
 */
export const PALETTE = Object.freeze({
  cream: '#f4d4ad',       // teal's, rust-woman's and blue-girl's aprons (#e6c49f-#f6d6b3)
  creamShade: '#d9b48a',
  rust: '#8b432b',        // rust's shirt (#873d27-#94452c)
  rustBright: '#aa4324',  // rust-woman's blouse
  ochre: '#b57828',       // teal's skirt
  honey: '#d6852d',       // ochre's shirt
  moss: '#574b27',        // elder's waistcoat
  olive: '#6b6a3a',
  wood: '#855c33',        // rust's trousers and the felled log's bark
  woodDark: '#56361d',
  woodLight: '#c8a36c',
  endGrain: '#e2c08a',    // her stump's cut top
  leather: '#4b2e1a',     // boots
  iron: '#5d5f5b',
  ironLight: '#a6a8a2',
  slate: '#41556b',
});

/**
 * Each grown cast figure, the children and the generic figures, dressed in Astra's colours. `skin`, `hair` and the main
 * clothing are the tokens public/person-palette.js already records for her figures (so the game's appearance recolouring
 * finds in a Claude frame the colours it looks for in hers); the rest are read from `measured.json` regions and common
 * colours of the figure's south idle, and named by looking at civilians.png, people-cast2-idle.png and
 * people-children-idle.png.
 */
const rgb = ([r, gg, b]) => '#' + [r, gg, b].map(v => v.toString(16).padStart(2, '0')).join('');
export const CAST = Object.freeze({
  rust: { sex: 'm', age: 'adult', skin: rgb([218, 157, 96]), hair: rgb([64, 45, 32]), hat: { kind: 'brim', colour: '#ae7e4b', band: '#5b321a' },
    beard: rgb([64, 45, 32]), shirt: rgb([151, 76, 48]), kerchief: '#2a2622', braces: '#bc8d50', lower: { kind: 'trousers', colour: '#855c33' }, feet: '#4b2e1a' },
  teal: { sex: 'f', age: 'adult', skin: rgb([185, 112, 61]), hair: rgb([64, 47, 37]), hairStyle: 'bun', shirt: rgb([78, 126, 123]), shirtShade: '#53675f',
    apron: '#e8c8a5', lower: { kind: 'skirt', colour: '#b57828' }, feet: '#4a301b' },
  elder: { sex: 'm', age: 'elder', skin: rgb([113, 75, 50]), hair: rgb([181, 177, 160]), hat: { kind: 'brim', colour: '#a97b4a', band: '#5a321a' },
    beard: rgb([181, 177, 160]), shirt: '#e4c29d', waistcoat: '#574b27', lower: { kind: 'trousers', colour: '#5f4028' }, feet: '#543722' },
  blue: { sex: 'm', age: 'youth', skin: rgb([224, 155, 98]), hair: rgb([67, 45, 32]), hairStyle: 'tousled', shirt: rgb([73, 106, 135]), braces: '#a36b3d',
    lower: { kind: 'trousers', colour: '#a97f4f', rolled: true }, feet: '#573822' },
  'rust-woman': { sex: 'f', age: 'adult', skin: rgb([211, 133, 77]), hair: rgb([61, 44, 35]), hat: { kind: 'bonnet', colour: '#ebd2a8' },
    shirt: rgb([156, 75, 51]), bow: '#f3e0c0', apron: '#f4d2ac', lower: { kind: 'skirt', colour: '#c77930' }, feet: '#512a12' },
  indigo: { sex: 'f', age: 'adult', skin: rgb([210, 137, 81]), hair: rgb([65, 47, 39]), hairStyle: 'bun', shirt: rgb([71, 102, 132]), dress: true,
    kerchief: '#f0dcbc', lower: { kind: 'skirt', colour: rgb([71, 102, 132]) }, feet: '#5c361c' },
  ochre: { sex: 'm', age: 'adult', skin: rgb([224, 151, 90]), hair: rgb([73, 51, 36]), hairStyle: 'short', shirt: '#d6852d', waistcoat: '#4c2e1a',
    lower: { kind: 'trousers', colour: '#755843' }, feet: '#57321b' },
  'blue-girl': { sex: 'f', age: 'youth', skin: rgb([222, 151, 96]), hair: rgb([67, 46, 35]), hairStyle: 'braid', shirt: rgb([70, 103, 134]), dress: true,
    apron: '#f6d6b3', lower: { kind: 'skirt', colour: rgb([70, 103, 134]) }, feet: '#59341c' },
  girl: { sex: 'f', age: 'child', skin: '#e3a075', hair: '#4a2f1f', hairStyle: 'braids', shirt: '#c2583c', dress: true, apron: '#f8d7ae',
    lower: { kind: 'skirt', colour: '#c2583c', short: true }, feet: '#543118' },
  boy: { sex: 'm', age: 'child', skin: '#faa970', hair: '#d8b070', hairStyle: 'tousled', shirt: '#f2d4aa', braces: '#6a4123', oneBrace: true,
    lower: { kind: 'trousers', colour: '#754a2b', rolled: true }, feet: null },
  smallchild: { sex: 'x', age: 'small', skin: '#e47a36', hair: '#452916', hairStyle: 'tousled', shirt: '#f6d4aa', dress: true,
    lower: { kind: 'gown', colour: '#f6d4aa' }, feet: null },
  // Generic figures for the battles and the towns. Colours from the military atlas's volunteer and regular (the Texian in his
  // own frontier clothes; the Mexican line infantryman of 1836 in a dark blue coatee with red facings and a white crossbelt,
  // tall shako) - an interpretation at play size, not a uniform plate.
  volunteer: { sex: 'm', age: 'adult', skin: '#d59a66', hair: '#4a3222', hat: { kind: 'slouch', colour: '#6a5236', band: '#3a2a1a' }, beard: '#4a3222',
    shirt: '#c9b48a', coat: '#6d5a3c', lower: { kind: 'trousers', colour: '#7a6446' }, feet: '#4b2e1a', belt: '#5a3a22' },
  regular: { sex: 'm', age: 'adult', skin: '#c98a58', hair: '#2e2018', hat: { kind: 'shako', colour: '#2a2a30', band: '#b8342a' }, moustache: '#2e2018',
    shirt: '#2f3f6a', coat: '#2f3f6a', facings: '#b8342a', crossbelt: '#efe6d0', lower: { kind: 'trousers', colour: '#e6dcc4' }, feet: '#2a1c12' },
  cavalryman: { sex: 'm', age: 'adult', skin: '#c98a58', hair: '#2e2018', hat: { kind: 'helmet', colour: '#6a6c6e', band: '#2a2018' }, moustache: '#2e2018',
    shirt: '#a8322a', coat: '#a8322a', facings: '#2f3f6a', crossbelt: '#efe6d0', lower: { kind: 'trousers', colour: '#3a4a6a' }, feet: '#2a1c12' },
  townsman: { sex: 'm', age: 'adult', skin: '#c88a5a', hair: '#3a2818', hat: { kind: 'wide', colour: '#3a2e22', band: '#1e1812' }, moustache: '#3a2818',
    shirt: '#efe2c6', coat: '#5b4a3a', sash: '#9a3a2a', lower: { kind: 'trousers', colour: '#4a3e34' }, feet: '#3a2616' },
});

/** Proportions by age, in rig units (a grown figure 100 from the ground to the top of the hat; the head big, as hers are). */
export const BUILD = Object.freeze({
  adult: { head: 16, neck: 1.5, torso: 23, hipW: 22, shoulderW: 29, depth: 9.5, thigh: 17.5, shin: 15.5, foot: 9, upperArm: 12.5, forearm: 11.5, limb: 9.4, body: 1 },
  elder: { head: 16, neck: 1, torso: 23, hipW: 23, shoulderW: 29, depth: 10.5, thigh: 17.5, shin: 15.5, foot: 9, upperArm: 12.5, forearm: 11.5, limb: 9.8, body: 1.04 },
  youth: { head: 16.5, neck: 1.5, torso: 22, hipW: 19, shoulderW: 25, depth: 8.5, thigh: 18, shin: 16.5, foot: 8.5, upperArm: 12, forearm: 11.5, limb: 8.4, body: 1 },
  // Children are drawn to fill the cell as a grown figure does (the renderer shrinks them by age: request 2026-09-12, the
  // delivery contract), with a child's proportions: a bigger head and shorter limbs.
  child: { head: 20, neck: 1, torso: 21, hipW: 19, shoulderW: 23, depth: 9, thigh: 15.5, shin: 14.5, foot: 8, upperArm: 11, forearm: 10, limb: 9, body: 1 },
  small: { head: 23, neck: 0.5, torso: 20, hipW: 20, shoulderW: 22, depth: 9.5, thigh: 13.5, shin: 12.5, foot: 8, upperArm: 10, forearm: 9, limb: 9.5, body: 1 },
});
