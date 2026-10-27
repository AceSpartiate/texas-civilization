// The towns of the colonies, drawn: docs/TOWNS.md §5b, from the layout sketches in docs/town-research/.
//
// Pure data and arithmetic, with no imports, so the browser loads this same file (served as /town-layouts.js) and the
// server reads it to put each shopkeeper in a drawn building (sim/shops.mjs). One source for both, the way the
// Gonzales buildings and their keepers must agree.
//
// Each layout is in the research's own frame: feet, `+y` "down" the sheet, `+x` bearing `bearing` degrees clockwise
// from north (so `+y` bears `bearing + 90`). `anchor` is the point of the frame the map's own site point stands for.
// What is measured and what is invented is the research's, row by row; every building position finer than a block is
// invented there and registered here as `FIC-GONZ-042`. Rivers, bays and creeks are not drawn from the sketches: the
// map already draws the real watercourses, and a second, invented river would disagree with them.
//
// ceiling: `anchor` is the town's central documented feature (its main square or main corner) set on the site point,
// except at Liberty, where a 1968 marker ties the frame to the ground; elsewhere the offset between the official point
// and the old town's centre is not measured and could be a few hundred feet. Measuring each frame against its markers
// is what would justify undoing this.

export const FEET_PER_MILE = 5280;
/**
 * How much taller a building is drawn than the height the research gives it, on ground laid out in true feet: so a cabin
 * of twenty-odd feet is not a speck (found in the first screenshots, 2026-09-16). Béxar and the Alamo, battle ground laid
 * out in true miles, are drawn at this (public/bexar-art.js; public/battle-view.js `WALL_DRAWN_HEIGHT`). The towns of the
 * colonies are drawn spread (`TOWN_SPREAD`), and their buildings at this times their spread (`townDrawnHeight`).
 * ceiling: one factor for every building; a house and a two-storey hall keep their proportion to each other, not to people.
 */
export const DRAWN_HEIGHT = 4;
/**
 * How many times wider than surveyed a town's lots are drawn (owner, 2026-10-27: "draw the town lots wider than
 * surveyed"). People are a symbol `PERSON_MILES` (100 feet) high; at `DRAWN_HEIGHT` alone a town's log house stood 0.85 of
 * a person to its ridge beside its keeper, and raising the height alone piled the street's lots one on another. So the
 * inside of the town is drawn this many times its survey round its heart (`spreadFrom`, else `anchor`): every lot, street
 * and square that much further from it and that much wider, and every building that much taller - a one-storey log house
 * 2.5 people to its ridge, about as the family's own house stands at home (`CABIN_PEOPLE` 3.3). The town keeps its place on
 * the map, its heart on its point, and the drawing its proportions: nothing in it is closer to anything else than
 * surveyed, against the size it is drawn. The keepers stand where it is drawn (sim/shops.mjs), since both read `townPoint`.
 * A layout's own `spread` overrides it (Goliad, battle ground, keeps 1), and a point marked `inPlace` keeps its surveyed
 * place: a ferry on its water, a ruin or a work a mile out of town.
 * ceiling: one factor for every town; a town that ever needs its own (a larger town, a closer zoom) sets `spread`.
 */
export const TOWN_SPREAD = 3;
/** How many times its survey a town is drawn (`TOWN_SPREAD`, or the layout's own). */
export const townSpread = layout => layout.spread ?? TOWN_SPREAD;
/** How many times its researched height a town's building is drawn: `DRAWN_HEIGHT` on the town's spread ground. */
export const townDrawnHeight = layout => DRAWN_HEIGHT * townSpread(layout);
/*
 * A building's `art`, where given, is a drawing of that building itself (a Claude-drawn stand-in or, later, Astra's frame of
 * the same name) drawn in its place at `artHeight` (else `height`) once its sheet has loaded (public/town-art.js); a building
 * or a wall marked `standInFor` that name is then not drawn - the library pieces that stood for it. Until then, `sprite`.
 * A building marked `partOf` another is a piece of one work drawn together - a fort's gun, a ruin's bastion, a row of guns,
 * a house's outbuilding - and may stand over it (tests/town-lots.test.mjs holds every other pair of pictures apart).
 */

/**
 * Where a point of a layout is drawn, in miles east and south of the town's site point: spread round the town's heart
 * (`TOWN_SPREAD`), or round its own `heldAt` - the place a work out of town keeps, its pieces spread round it so they stand
 * apart as the town's do - or not at all if it is marked `inPlace`. The server puts every keeper by this; the page draws by it.
 */
export function townPoint(layout, point) {
  const spread = townSpread(layout), from = point.heldAt || (point.inPlace ? point : layout.spreadFrom || layout.anchor);
  const x = from.x + (point.x - from.x) * spread, y = from.y + (point.y - from.y) * spread;
  const dx = x - layout.anchor.x, dy = y - layout.anchor.y, b = layout.bearing * Math.PI / 180;
  const round = value => { const fixed = +value.toFixed(4); return fixed === 0 ? 0 : fixed; };
  return { x: round((dx * Math.sin(b) + dy * Math.cos(b)) / FEET_PER_MILE), y: round((-dx * Math.cos(b) + dy * Math.sin(b)) / FEET_PER_MILE) };
}

const DWELLINGS = ['house-round-log', 'cabin-weathered', 'house-hewn-log', 'cabin-small', 'house-dog-run'];
/**
 * The town's ordinary houses, which no source places: on lot centres of a regular grid, nearest a centre first, skipping
 * blocks that are public ground and lots already built on. Repeatable arithmetic only, never Math.random(), as
 * public/bexar-layout.js does. Returns buildings marked `filler`, which a keeper without a documented shop can take.
 */
function dwellings(prefix, { origin, module, block, lots = 2, centre, count, skipBlocks = [], taken = [], sprites = DWELLINGS, height = 22, rows = [0, 12], columns = [0, 12] }) {
  const spots = [];
  for (let row = rows[0]; row < rows[1]; row++) for (let column = columns[0]; column < columns[1]; column++) {
    if (skipBlocks.some(([c, r]) => c === column && r === row)) continue;
    const left = origin.x + column * module + (module - block) / 2, top = origin.y + row * module + (module - block) / 2;
    for (let i = 0; i < lots; i++) for (let j = 0; j < lots; j++) {
      const x = Math.round(left + block * (i + .5) / lots), y = Math.round(top + block * (j + .5) / lots);
      if (taken.some(t => Math.hypot(t.x - x, t.y - y) < block / lots * .8)) continue;
      spots.push({ x, y, d: Math.hypot(x - centre.x, (y - centre.y) * 1.15) });
    }
  }
  spots.sort((a, b) => a.d - b.d || a.x - b.x || a.y - b.y);
  return spots.slice(0, count).map((spot, i) => ({ id: `${prefix}-${i + 1}`, sprite: sprites[((i * 3 + spot.x) % sprites.length + sprites.length) % sprites.length], x: spot.x, y: spot.y, height: height - (i % 3) * 2, filler: true }));
}
/**
 * A platted grid drawn only where it was built along (owner, 2026-10-13: "there's a lot of unnecessary streets in towns").
 * `xs` and `ys` are the whole plat, as the research measured it, named; `spans` lists the streets drawn, each
 * `[name, from, to]` running between two streets of the other direction (their names, or a number of feet where a street
 * stops short of the next cross street). A platted street not listed is not drawn: the research has every one of these
 * towns as a cluster on a few blocks and the rest of the plat empty (`FIC-GONZ-042`), and a full grid of empty blocks
 * read as a city. tests/town-streets.test.mjs holds every drawn street to something standing along it.
 */
const builtGrid = (xs, ys, width, spans) => spans.map(([name, from, to, extra]) => {
  const runsY = xs.some(([n]) => n === name), [line, across] = runsY ? [xs, ys] : [ys, xs];
  const fixed = line.find(([n]) => n === name)[1], at = end => typeof end === 'number' ? end : across.find(([n]) => n === end)[1];
  const points = [at(from), at(to)].map(v => runsY ? { x: fixed, y: v } : { x: v, y: fixed });
  return { name, width, points, ...extra };
});
// `fill.taken` is ground that holds no building of its own but must still keep the filler off it - the inside of Mina's
// stockade, which used to be held by the palisade pieces themselves.
const withFill = (named, fill) => [...named, ...dwellings(fill.prefix, { ...fill, taken: [...named, ...(fill.taken || [])] })];

// ---------------------------------------------------------------------------------------------- San Felipe de Austin
// docs/town-research/san-felipe.md §7. The frame is invented there, north unresolved; it is turned here so the river side
// of the sheet faces the Brazos on the map (the town stood on the west bank, S3). The built town is a half-mile ribbon
// of log buildings along the road back from McFarland's ferry, in Smithwick's order (§4.2), not a filled grid.
const SF_NAMED = [
  { id: 'sf-austin-house', sprite: 'house-dog-run', x: 300, y: 1535, height: 26, label: 'Austin’s headquarters' },
  { id: 'sf-parker-farm', sprite: 'cabin-weathered', x: 250, y: 1390, height: 22 },
  { id: 'sf-ingram-store', sprite: 'trading-house', x: 470, y: 1700, height: 24, label: 'Ingram brothers’ store' },
  { id: 'sf-league-house', sprite: 'house-hewn-log', x: 560, y: 1560, height: 24 },
  { id: 'sf-league-burnet', sprite: 'cabin-small', x: 640, y: 1700, height: 20, label: 'League & Burnet, law office' },
  { id: 'sf-pettus', sprite: 'house-hewn-log', x: 400, y: 1980, height: 24 },
  { id: 'sf-smithwick-cabin', sprite: 'cabin-small', x: 900, y: 1990, height: 20 },
  { id: 'sf-smithy', sprite: 'shed-open', x: 1010, y: 2000, height: 18, label: 'The smithy', trade: 'blacksmith' },
  { id: 'sf-peyton-tavern', sprite: 'house-dog-run', x: 1180, y: 2010, height: 26, label: 'Peyton’s tavern', trade: 'tavern' },
  // The only frame building in town in 1828 (`town-buildings-researched`, 2026-09-21).
  { id: 'sf-cooper-chieves', sprite: 'building-frame-shop', x: 1330, y: 2000, height: 26, label: 'Cooper & Chieves, saloon' },
  { id: 'sf-dinsmore-store', sprite: 'trading-house', x: 950, y: 1800, height: 24, label: 'Dinsmore’s store' },
  { id: 'sf-white-store', sprite: 'trading-house', x: 1120, y: 1795, height: 24, label: 'White’s store', trade: 'store' },
  { id: 'sf-cotton-plant', sprite: 'cabin-small', x: 1290, y: 1790, height: 20, label: 'The Cotton Plant' },
  { id: 'sf-cotten-house', sprite: 'house-round-log', x: 1380, y: 1785, height: 22 },
  // The Whiteside Hotel: its own broad log building with the open dog-run passage and a chimney at each end, researched
  // and drawn for this spot (`town-buildings-researched`, 2026-09-21). It was `house-dog-run` stretched to 34 feet; the
  // painted building is the right shape, so it goes back to the height the research gives it.
  { id: 'sf-whiteside-hotel', sprite: 'whiteside-hotel', x: 1560, y: 1790, height: 28, label: 'Whiteside Hotel' },
  { id: 'sf-alcalde-office', sprite: 'house-dog-run', x: 1590, y: 1535, height: 26, label: 'The alcalde’s office' },
  { id: 'sf-farmers-hotel', sprite: 'house-dog-run', x: 1800, y: 2050, height: 28, label: 'Farmer’s Hotel' },
  { id: 'sf-huff-store', sprite: 'trading-house', x: 1700, y: 2060, height: 24 },
  { id: 'sf-butler-hotel', sprite: 'house-dog-run', x: 1700, y: 1830, height: 28 },
  { id: 'sf-calvit-house', sprite: 'house-hewn-log', x: 1880, y: 2075, height: 24 },
  { id: 'sf-mcfarland', sprite: 'cabin-weathered', x: 2250, y: 2120, height: 22, label: 'McFarland, the ferryman' },
  { id: 'sf-bake-oven', sprite: 'shed-open', x: 2160, y: 2110, height: 16 },
  { id: 'sf-perry-store', sprite: 'trading-house', x: 1210, y: 1830, height: 26 },
  { id: 'sf-clopper-store', sprite: 'trading-house', x: 1130, y: 1935, height: 24 },
  { id: 'sf-gay-saloon', sprite: 'cabin-weathered', x: 1380, y: 1935, height: 22 },
  { id: 'sf-stewart-drugs', sprite: 'cabin-small', x: 1330, y: 1935, height: 20, label: 'Stewart’s drug store', trade: 'doctor' },
  { id: 'sf-cotten-printshop', sprite: 'cabin-small', x: 1240, y: 1640, height: 20, label: 'Cotten’s print shop' },
  { id: 'sf-wilkins-home', sprite: 'house-round-log', x: 980, y: 1360, height: 22 },
  { id: 'sf-huff-home', sprite: 'house-hewn-log', x: 1120, y: 1360, height: 24 },
  { id: 'sf-spanish-town-1', sprite: 'house-round-log', x: 2620, y: 1840, height: 22 },
  { id: 'sf-spanish-town-2', sprite: 'shed-open', x: 2760, y: 1920, height: 16 },
  { id: 'sf-spanish-town-3', sprite: 'house-round-log', x: 2900, y: 2020, height: 22 },
];
const SAN_FELIPE = {
  name: 'San Felipe de Austin', research: 'docs/town-research/san-felipe.md', bearing: 276, anchor: { x: 1665, y: 1900 },
  // The ribbon (§7.6): Calle Comercio, the Atascosito road, down to McFarland's ferry, and the streets either side of it
  // only as far as the town stood along them (2026-10-13). Calle del Rio from the riverfront tier's first houses to where
  // it meets the ferry road; Calle Primera from the Solar del Hospicio to past the alcalde's office; Calle Segunda, its
  // place invented in the research, only from the Wilkins and Huff homes to Plaza de la Constitución - Joshua Parker's
  // farm, at its west end, was a farm and stands on its own. All three ran on 2,600 ft to Calle del Colegio, which is not
  // drawn: its place on the east edge of the plat is invented (§7.3), and Spanish Town's three houses beyond the ferry
  // road stood on no street the research knows.
  streets: [
    { name: 'Calle del Rio', width: 69, points: [{ x: 600, y: 2180 }, { x: 2356, y: 2180 }] },
    { name: 'Calle Comercio', leadsTo: 'McFarland’s ferry', width: 69, points: [{ x: 0, y: 1890 }, { x: 2050, y: 1900 }, { x: 2300, y: 2050 }, { x: 2420, y: 2330 }] },
    { name: 'Calle Primera', width: 55, faint: true, points: [{ x: 200, y: 1600 }, { x: 1850, y: 1600 }] },
    { name: 'Calle Segunda', width: 55, faint: true, points: [{ x: 900, y: 1310 }, { x: 1850, y: 1310 }] },
  ],
  squares: [
    { label: 'Plaza de Comercio', x: 1500, y: 1930, width: 330, height: 230 },
    { label: 'Plaza de la Constitución', x: 1500, y: 1350, width: 330, height: 230 },
    { label: 'Solar del Hospicio', x: 260, y: 1640, width: 330, height: 230 },
  ],
  buildings: withFill(SF_NAMED, { prefix: 'sf-house', origin: { x: 200, y: 1600 }, module: 290, block: 220, lots: 2, centre: { x: 1250, y: 1950 }, count: 14, rows: [0, 2], columns: [0, 9], skipBlocks: [[4, 1]] }),
};

// ---------------------------------------------------------------------------------------------- Victoria
// docs/town-research/victoria.md §7: the grid, its bearing and its squares measured; a cluster of jacales round Plaza
// de Mercado, thinning north, not a filled grid (I-6, I-8).
const VIC_X = [['Calle Victoria', 4300], ['Calle Bustamante', 4637], ['Calle de los Diez Amigos', 4975], ['Calle Guerrero', 5312], ['Calle Santa Anna', 5649]];
const VIC_Y = [['Calle Libertad', 900], ['Calle Artiaga', 1237], ['Calle Chovel', 1575], ['Calle Ahumada', 1912], ['Calle Terán', 2249], ['Calle Empresario', 2587], ['Calle De León', 2924], ['Calle Manchola', 3261]];
const VIC_NAMED = [
  { id: 'vic-first-church', sprite: 'chapel', x: 5060, y: 2500, height: 28, label: 'The church' },
  { id: 'vic-deleon-house', sprite: 'house-hewn-log', x: 5120, y: 2360, height: 24, label: 'Martín De León’s house' },
  // Victoria's own landmark, painted round with its gun slits and heavy door (`town-buildings-researched`, 2026-09-21).
  { id: 'vic-round-top', sprite: 'round-top-house', x: 4900, y: 2190, height: 26, label: 'Round Top House' },
  { id: 'vic-linn-house', sprite: 'trading-house', x: 4560, y: 2180, height: 24, label: 'Linn’s store', trade: 'store' },
  { id: 'vic-school', sprite: 'cabin-wide', x: 4750, y: 2620, height: 20, label: 'The school' },
  { id: 'vic-ayuntamiento', sprite: 'house-hewn-log', x: 4400, y: 1400, height: 24 },
];
const VICTORIA = {
  name: 'Victoria', research: 'docs/town-research/victoria.md', bearing: 110.7, anchor: { x: 4806, y: 1406 },
  // The blocks round Plaza de Mercado that hold the jacal town (§7.6, "not a filled grid"), and Calle de los Diez Amigos -
  // the plat's central axis, Main Street today - north to Plaza de la Constitución, where the map's roads meet at the
  // town's point. Calle Santa Anna, Libertad, Artiaga, Chovel and Manchola, and the north of the others, ran past empty
  // blocks in 1835 and are not drawn (2026-10-13); the two northern squares stay, as the public ground the plat reserved.
  streets: builtGrid(VIC_X, VIC_Y, 59.5, [
    ['Calle Victoria', 'Calle Ahumada', 'Calle De León'], ['Calle Bustamante', 'Calle Ahumada', 'Calle De León'],
    ['Calle de los Diez Amigos', 'Calle Artiaga', 'Calle De León'], ['Calle Guerrero', 'Calle Ahumada', 'Calle De León'],
    ['Calle Ahumada', 'Calle Victoria', 'Calle Guerrero'], ['Calle Terán', 'Calle Victoria', 'Calle Santa Anna'],
    ['Calle Empresario', 'Calle Victoria', 'Calle Santa Anna'], ['Calle De León', 'Calle Victoria', 'Calle Guerrero'],
  ]),
  squares: [
    { label: 'Plaza de Mercado', x: 4667, y: 2279, width: 278, height: 278 },
    { label: 'Plaza de la Constitución', x: 4667, y: 1267, width: 278, height: 278 },
    { label: 'Square for government buildings', x: 4330, y: 1267, width: 278, height: 278 },
  ],
  // Four jacales in variety and a brush ramada (`town-buildings-researched`, 2026-09-21), for the town whose houses the
  // research found were mostly jacales; one hewn-log house among them, as before.
  buildings: withFill(VIC_NAMED, { prefix: 'vic-jacal', origin: { x: 4300, y: 900 }, module: 337.3, block: 277.8, lots: 2, centre: { x: 4806, y: 2418 }, count: 30, rows: [0, 7], columns: [0, 4], skipBlocks: [[1, 4], [1, 1], [0, 1]], sprites: ['jacal-upright-post', 'jacal-broad', 'house-hewn-log', 'jacal-poor', 'jacal-ramada'], height: 18 }),
};

// ---------------------------------------------------------------------------------------------- Mina
// docs/town-research/mina.md §7: a cardinal grid with the surveyor's street widths; a small cluster round the stockade on
// its documented block, stopping at Farm Street.
const MINA_X = [['Water', 3787], ['Pecan', 4171], ['Jefferson', 4567], ['Hill', 4958], ['Haysel', 5349]];
const MINA_Y = [['Farm', 2804], ['Spring', 3199], ['Chestnut', 3600], ['Pine', 3984], ['Walnut', 4370], ['Austin', 4770], ['Government', 5146]];
// The whole palisaded compound with its cabin standing inside it, as one painted building (`town-buildings-researched`,
// 2026-09-21). It was 27 `palisade` pieces and a `gate` run round a square with a `house-hewn-log` in the middle, which
// read as a fence somebody had left in a field. The gate is drawn open: Mina in 1835 is a town going about its business,
// and `mina-stockade` - the same compound shut - is registered for a day the game ever has one. Nothing shuts it today.
// ceiling: `height` 30 is chosen so the compound is drawn about as wide as its 168 surveyed feet on the town's ground, its
// height and its ground spread alike (`townDrawnHeight` times the frame's own proportion), not as tall as a 14-foot palisade.
const STOCKADE_LEFT = 3900, STOCKADE_TOP = 4100, STOCKADE_SIDE = 168;
const STOCKADE = [
  { id: 'mina-stockade-house', sprite: 'mina-stockade-open', x: STOCKADE_LEFT + STOCKADE_SIDE / 2, y: STOCKADE_TOP + STOCKADE_SIDE, height: 30, label: 'The stockade' },
];
// The ground inside the palisade, so no house is platted where the pieces used to hold the lots against the filler.
const STOCKADE_GROUND = [[0, 0], [1, 0], [0, 1], [1, 1], [0.5, 0.5]]
  .map(([fx, fy]) => ({ x: STOCKADE_LEFT + fx * STOCKADE_SIDE, y: STOCKADE_TOP + fy * STOCKADE_SIDE }));
const MINA_NAMED = [
  ...STOCKADE,
  { id: 'mina-webber-lot', sprite: 'cabin-small', x: 3440, y: 3650, height: 20 },
  { id: 'mina-gazley-store', sprite: 'trading-house', x: 3900, y: 3900, height: 22, label: 'Dr. Gazley’s store', trade: 'store' },
  { id: 'mina-ayuntamiento', sprite: 'house-hewn-log', x: 4250, y: 4850, height: 24 },
  { id: 'mina-northcross', sprite: 'house-round-log', x: 4300, y: 3800, height: 22 },
];
const MINA = {
  name: 'Mina', research: 'docs/town-research/mina.md', bearing: 90, anchor: { x: 3400, y: 3600 },
  // A town above its river spreads away from it (`TOWN_SPREAD`): round Chestnut's line 250 feet west of the town's point,
  // toward the Colorado, so the Camino Real still comes in on Chestnut and the town grows east. Spread round its point,
  // Dr. Gazley's store and a house were drawn in Gills Branch.
  spreadFrom: { x: 3150, y: 3600 },
  // The blocks round the stockade and the store, stopping at Farm Street as the research has the cluster (§7.7), and Pecan
  // down between the two squares. Hill and Haysel, Farm, Spring and Government Streets ran past empty blocks in 1835 and
  // are not drawn (2026-10-13). Hill carried the Old San Antonio Road on Zively's line and Chestnut on the town's tradition
  // (§7.5): the map's own road brings the Camino Real to the town's point, at the west end of Chestnut.
  streets: builtGrid(MINA_X, MINA_Y, 55.6, [
    ['Water', 'Chestnut', 'Austin'], ['Pecan', 'Spring', 'Government'], ['Jefferson', 'Chestnut', 'Austin'],
    ['Chestnut', 'Water', 'Jefferson'], ['Pine', 'Water', 'Hill'], ['Walnut', 'Water', 'Hill'], ['Austin', 'Water', 'Jefferson'],
  ]),
  squares: [
    { label: 'Plaza de la Constitución', x: 3817, y: 4795, width: 333, height: 333 },
    { label: 'Municipal buildings', x: 4206, y: 4795, width: 333, height: 333 },
  ],
  buildings: withFill(MINA_NAMED, { prefix: 'mina-house', origin: { x: 3787, y: 2804 }, module: 388.9, block: 333.3, lots: 2, centre: { x: 3984, y: 4180 }, count: 22, rows: [0, 6], columns: [0, 4], skipBlocks: [[0, 3], [0, 5], [1, 5]], taken: STOCKADE_GROUND }),
};

// ---------------------------------------------------------------------------------------------- Matagorda
// docs/town-research/matagorda.md §7: a wide square grid on flat ground, turned to N 60.5° E; the built town clustered at
// the water end and empty grid behind it; no church, no plaza de armas.
const MAT_X = [['Orleans Street', -333], ['Thompson Road', 42], ['Saint Mary Street', 496], ['Mulberry Street', 1329], ['Cedar Street', 1730], ['Cypress Street', 2591], ['Caney Street', 2995], ['Catalpa Street', 3409], ['Magnolia Street', 3882], ['Peach Street', 4258], ['Live Oak Road', 4672], ['Bernardo Street', 5074]];
const MAT_Y = [['Burton Street', 1165], ['Austin Street', 1577], ['Center Street', 2057], ['Wightman Street', 2474], ['Lewis Street', 2920], ['Matagorda Avenue', 3718], ['', 4560]];
// Fisher Street (State Highway 60, skewed 6°, §7.2) is not one of the plat's lines here; the cluster's last row stops on it.
const FISHER = 3317;
const MAT_NAMED = [
  { id: 'mat-customhouse', sprite: 'trading-house', x: 1815, y: 4250, height: 26, label: 'The customhouse' },
  { id: 'mat-store-1', sprite: 'trading-house', x: 2050, y: 4270, height: 26, label: 'A store', trade: 'store' },
  { id: 'mat-store-2', sprite: 'storehouse', x: 2350, y: 4290, height: 24 },
  { id: 'mat-warehouse', sprite: 'storehouse', x: 1600, y: 4500, height: 24, label: 'Warehouse' },
  { id: 'mat-committee-room', sprite: 'frame-hall', x: 2670, y: 3900, height: 28, label: 'The Committee Room' },
  { id: 'mat-powder-store', sprite: 'storehouse', x: 2900, y: 4350, height: 22 },
  // The schoolhouse and the salt works stood a mile out of town and keep their surveyed places (`inPlace`, `TOWN_SPREAD`).
  { id: 'mat-schoolhouse', sprite: 'cabin-wide', x: 6250, y: 1850, height: 20, label: 'The schoolhouse', inPlace: true },
  { id: 'mat-cummins-cabin', sprite: 'house-dog-run', x: 600, y: 3600, height: 26 },
  { id: 'mat-burnham-cabin', sprite: 'house-round-log', x: 1100, y: 4100, height: 22 },
  { id: 'mat-saltworks', sprite: 'shed-open', x: 6800, y: 3600, height: 14, label: 'Salt works', inPlace: true },
];
const MATAGORDA = {
  name: 'Matagorda', research: 'docs/town-research/matagorda.md', bearing: 60.5, anchor: { x: 1100, y: 2696 },
  // The streets of the cluster at the water end (§7.5, "empty grid behind it"): Mulberry, Cedar, Cypress and Caney down to
  // the water from the cluster's last row, Matagorda Avenue across them from James Cummins's 1829 cabin, and the street
  // along the water (Matagorda Street, skewed today: `MAT_Y`'s unnamed line). Nineteen modules of plat ran back from the
  // water and nobody had built there: Orleans, Thompson, Saint Mary, Catalpa to Bernardo, Burton, Austin, Center, Wightman
  // and Lewis are not drawn (2026-10-13). The Public Square and the Burying Ground stay, on their own ground.
  streets: builtGrid(MAT_X, MAT_Y, 83, [
    ['Mulberry Street', FISHER, ''], ['Cedar Street', FISHER, ''], ['Cypress Street', FISHER, ''], ['Caney Street', 'Matagorda Avenue', ''],
    ['Matagorda Avenue', 'Saint Mary Street', 'Caney Street'], ['', 'Mulberry Street', 'Caney Street'],
  ]),
  squares: [
    { label: 'Public Square', x: 2180, y: 2280, width: 833, height: 833 },
    { label: 'Burying Ground', x: 7250, y: 1780, width: 600, height: 600, inPlace: true },
  ],
  // The frame town of imported lumber, now in frame (`town-buildings-researched`, 2026-09-21): clapboard residences and
  // shops of one storey and a storey and a half, with hewn log among them for the older houses.
  buildings: withFill(MAT_NAMED, { prefix: 'mat-house', origin: { x: -333, y: 1165 }, module: 416.7, block: 333, lots: 2, centre: { x: 1900, y: 4300 }, count: 36, rows: [0, 8], columns: [0, 9], skipBlocks: [[6, 2], [6, 3], [7, 2], [7, 3]], sprites: ['building-frame-residence', 'building-frame-one-storey', 'house-hewn-log', 'building-frame-storey-half', 'building-frame-shop'] }),
};

// ---------------------------------------------------------------------------------------------- Columbia
// docs/town-research/columbia.md §7: twenty measured blocks with almost nothing in them, a short row on Brazos Avenue,
// and the broad road out toward Bell's Landing. Marion, two miles off at the landing, is not a place on the map.
const COL_X = [['17th Street', 0], ['16th Street', 407], ['Broad Street', 836], ['15th Street', 1260], ['14th Street', 1657]];
const COL_Y = [['Jefferson Street', 0], ['Hamilton Street', 400], ['Brazos Avenue', 810], ['Clay Street', 1224], ['Bernard Street', 1617], ['Jackson Street', 2011]];
const COL_NAMED = [
  // The Brown house, where the Senate sat: two rooms below and two above (`town-buildings-researched`, 2026-09-21).
  { id: 'col-senate-house', sprite: 'building-frame-two-storey', x: 190, y: 900, height: 26, label: 'Brown house · the Senate' },
  // Kelsey's storey-and-a-half clapboard store, where the House sat.
  { id: 'col-kelsey-store', sprite: 'building-frame-storey-half', x: 190, y: 720, height: 22, label: 'Kelsey’s store · the House', trade: 'store' },
  { id: 'col-bell-hotel', sprite: 'frame-hall', x: 620, y: 760, height: 30, label: 'Bell’s hotel' },
  { id: 'col-courthouse', sprite: 'timber-hall', x: 900, y: 900, height: 24, label: 'The courthouse' },
  { id: 'col-alcalde-office', sprite: 'cabin-small', x: 1030, y: 880, height: 18 },
  { id: 'col-tavern', sprite: 'trading-house', x: 480, y: 900, height: 22, label: 'Fitchett & Gill’s tavern', trade: 'tavern' },
];
const COLUMBIA = {
  name: 'Columbia', research: 'docs/town-research/columbia.md', bearing: 104.8, anchor: { x: 836, y: 810 },
  // The short row on Brazos Avenue and the blocks either side of it (§7.5: "nineteen and a half empty blocks behind it"),
  // and Brazos Avenue running on out of town as the road to Bell's Landing (§7.3) from where the row ends at 15th Street.
  // 15th and 14th, Jefferson, Bernard and Jackson Streets, and the south half of the others, ran past empty blocks and are
  // not drawn (2026-10-13). `leadsTo`: a road out of town, which nothing need stand along past its town end.
  streets: [
    ...builtGrid(COL_X, COL_Y, 55, [
      ['17th Street', 'Hamilton Street', 'Clay Street'], ['16th Street', 'Jefferson Street', 'Clay Street'],
      ['Broad Street', 'Hamilton Street', 'Clay Street', { width: 70 }],
      ['Hamilton Street', '17th Street', 'Broad Street'], ['Brazos Avenue', '17th Street', '15th Street'], ['Clay Street', '17th Street', 'Broad Street'],
    ]),
    { name: 'The road to Bell’s Landing', leadsTo: 'Bell’s Landing', width: 60, points: [{ x: 1260, y: 810 }, { x: 1393, y: 824 }, { x: 1650, y: 782 }, { x: 2000, y: 708 }, { x: 2645, y: 571 }, { x: 3260, y: 445 }, { x: 4028, y: 276 }] },
  ],
  squares: [],
  buildings: withFill(COL_NAMED, { prefix: 'col-house', origin: { x: 0, y: 0 }, module: 406, block: 351, lots: 2, centre: { x: 400, y: 810 }, count: 12, rows: [0, 5], columns: [0, 4], sprites: ['house-dog-run', 'house-hewn-log', 'house-round-log', 'cabin-wide'] }),
};

// ---------------------------------------------------------------------------------------------- Liberty
// docs/town-research/liberty.md §7: forty-nine measured blocks and five public squares, and in 1835 almost nothing built:
// the log court room on the Casa Consistorial square and about ten houses by the public bar. The frame is tied to the
// ground by the 1968 Plaza Constitucional marker (30.05935, −94.79721, at 1539, 1314): the official point lies about 545
// feet east and 495 feet south of it.
const LIB_X = [['Fonda', 0], ['Crockett', 389], ['Austin', 778], ['Milam', 1167], ['Travis', 1556], ['Main', 1944], ['Fannin', 2333], ['San Jacinto', 2722]];
const LIB_Y = [['Grand', 0], ['Webster', 389], ['Cos', 778], ['Trinity', 1167], ['Liberty', 1556], ['Jefferson', 1944], ['Santa Anna', 2333], ['Washington', 2722]];
const LIB_NAMED = [
  // The 22-foot-square hewn-log court room, researched and drawn for this spot (`town-buildings-researched`, 2026-09-21).
  // `liberty-court-room-side` is the same room seen end on and is registered for a layout that ever wants it turned.
  { id: 'lib-casa-consistorial', sprite: 'liberty-court-room', x: 1750, y: 1361, height: 14, label: 'Casa Consistorial · the court room' },
  { id: 'lib-store', sprite: 'trading-house', x: 2010, y: 1420, height: 18, label: 'The store', trade: 'store' },
  ...[[2010, 1000], [2010, 1100], [2010, 1700], [2010, 1880], [1300, 1050], [1650, 1050], [2000, 1050], [1500, 1300], [1500, 1480]]
    .map(([x, y], i) => ({ id: `lib-house-${i + 1}`, sprite: DWELLINGS[i % DWELLINGS.length], x, y, height: 20 - (i % 3) * 2, filler: true })),
];
const LIBERTY = {
  name: 'Liberty', research: 'docs/town-research/liberty.md', bearing: 88.78, anchor: { x: 2084, y: 1809 },
  // Spread round the 1968 marker, which ties the frame to the ground, so Plaza Constitucional stays where it stands.
  spreadFrom: { x: 1539, y: 1314 },
  // The streets round the four eastern squares, where the court room and the houses by the public bar stood (§7.6), Main
  // the Nacogdoches road through them. Almost none of the plat's forty-nine blocks was built on in 1835: Fonda, Crockett,
  // Milam, Austin, Fannin and San Jacinto, Grand, Webster, Santa Anna and Washington, and the ends of the rest, are not
  // drawn (2026-10-13); the houses north of Trinity front Trinity, and Plaza Iglesia Parroquial stands on its own. The
  // road to the landing leaves along Trinity's line from the corner of Plaza Constitucional now, where it used to start at
  // Fonda: the research invents its course (§7.5), and running it from the court room as the sketch does crosses squares.
  streets: [
    ...builtGrid(LIB_X, LIB_Y, 55.5, [
      ['Travis', 'Trinity', 'Liberty'], ['Main', 'Cos', 'Jefferson'],
      ['Trinity', 'Milam', 'Fannin'], ['Liberty', 'Travis', 'Fannin'], ['Jefferson', 'Main', 'Fannin'],
    ]).map(street => ['Main', 'Trinity'].includes(street.name) ? street : { ...street, faint: true }),
    { name: 'The road to Nacogdoches', leadsTo: 'Nacogdoches', width: 36, points: [{ x: 1944, y: 778 }, { x: 1944, y: -1800 }] },
    { name: 'The road to the landing', leadsTo: 'Liberty Landing', width: 40, points: [{ x: 1167, y: 1167 }, { x: 778, y: 1167 }, { x: 0, y: 1400 }, { x: -2500, y: 1600 }] },
  ],
  squares: [
    { label: 'Plaza Iglesia Parroquial', x: 806, y: 1195, width: 333, height: 333 },
    { label: 'Plaza Constitucional', x: 1195, y: 1195, width: 333, height: 333 },
    { label: 'Casa Consistorial', x: 1584, y: 1195, width: 333, height: 333 },
    { label: 'Plaza de Cárcel', x: 1972, y: 1195, width: 333, height: 333 },
    { label: 'Plaza de Mercado', x: 1972, y: 1584, width: 333, height: 333 },
  ],
  buildings: LIB_NAMED,
};


// ============================================================================================== the other eight places
// The places on the map families are not dealt to, drawn from the same research (2026-09-16). Several are fortified or
// ruined, so a layout may also carry `walls`: a line of wall pieces (`sprite`, every `spacing` feet, `height`, and a
// `breach` sprite every `breachEvery` pieces where the research says the wall is broken), drawn by public/town-art.js.
// A building marked `onWater` (a ferry, a skiff, a wharf) stands at the water's edge on purpose, and is not held clear of it.

/** Houses strung along a road, alternately either side of it and set back, from its start: a town that is a street. */
function alongRoad(prefix, points, { count, setback = 70, spacing = 120, start = 0, sprites = DWELLINGS, height = 18 }) {
  const out = [];
  let walked = 0, placed = 0, target = start;
  for (let i = 1; i < points.length && placed < count; i++) {
    const a = points[i - 1], b = points[i], span = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    const ux = (b.x - a.x) / span, uy = (b.y - a.y) / span;
    while (target <= walked + span && placed < count) {
      const t = target - walked, side = placed % 2 ? 1 : -1;
      out.push({ id: `${prefix}-${placed + 1}`, sprite: sprites[placed % sprites.length], x: Math.round(a.x + ux * t - uy * setback * side), y: Math.round(a.y + uy * t + ux * setback * side), height: height - (placed % 3) * 2, filler: true });
      placed++; target += spacing;
    }
    walked += span;
  }
  return out;
}
/** Houses scattered round a centre on the golden angle, thinning outward, skipping any excluded rectangle. Repeatable. */
function scatter(prefix, { centre, radius, count, sprites = DWELLINGS, height = 16, exclude = [], within = () => true }) {
  const out = [];
  for (let i = 0; out.length < count && i < count * 6; i++) {
    const r = radius * Math.sqrt((i + .5) / (count * 1.6)), a = i * 2.39996;
    const x = Math.round(centre.x + r * Math.cos(a)), y = Math.round(centre.y + r * Math.sin(a));
    if (exclude.some(e => x > e.x - 30 && x < e.x + e.width + 30 && y > e.y - 30 && y < e.y + e.height + 30) || !within(x, y)) continue;
    out.push({ id: `${prefix}-${out.length + 1}`, sprite: sprites[out.length % sprites.length], x, y, height: height - (out.length % 3) * 2, filler: true });
  }
  return out;
}
const ring = (centre, radius, pieces) => Array.from({ length: pieces + 1 }, (_, i) => ({ x: Math.round(centre.x + radius * Math.cos(i / pieces * 2 * Math.PI)), y: Math.round(centre.y + radius * Math.sin(i / pieces * 2 * Math.PI)) }));
const faint = streets => streets.map(street => ({ ...street, faint: true }));

// ---------------------------------------------------------------------------------------------- Washington
// docs/town-research/washington.md §8: one street and a handful of buildings, a staked grid with nothing in it (the lots
// were not sold until January 1836), and the ferry on its bench below the bluff. Ferry Street's bearing and the corner
// are measured; the frame's anchor is the map's own point, measured in the research at u −236, v 161.
const WASH_FERRY = [{ x: -250, y: 0 }, { x: 0, y: 0 }, { x: 700, y: 0 }, { x: 1050, y: 0 }, { x: 1300, y: 0 }, { x: 1500, y: 0 }];
const WASHINGTON = {
  name: 'Washington', research: 'docs/town-research/washington.md', bearing: 26.7, anchor: { x: -236, y: 161 },
  // A town at its crossing spreads up from it (`TOWN_SPREAD`): round the ferry's landing at the foot of Ferry Street, so the
  // ferry keeps its place on the Brazos, the street its line through the map's point, and the town grows up the street away
  // from the river. Spread round its point, its houses were drawn in the Brazos and the Navasota.
  spreadFrom: { x: 1470, y: 0 },
  // "Only one well defined street, which consists of an opening cut out of the woods" (Gray, February 1836, `HIST-TEX-204`):
  // Ferry Street, down to the ferry. Main Street, the other documented name, is drawn faint and only at the corner where it
  // crosses Ferry at the frame building. The six unnamed lines of the staked grid, all invented (§8.3), are not drawn
  // (2026-10-13); the survey stakes stay, and show the grid was staked and nothing built on it.
  streets: [
    { name: 'Ferry Street', leadsTo: 'the ferry', width: 80, points: WASH_FERRY },
    { name: 'Main Street', faint: true, width: 60, points: [{ x: 0, y: -200 }, { x: 0, y: 200 }] },
  ],
  squares: [],
  buildings: [
    // Byars & Mercer's two-storey frame (`town-buildings-researched`, 2026-09-21).
    // ceiling: it is drawn finished. Nothing in the library or the layout says half-built, and a building with its studs
    // still open wants its own frame; the research has it unfinished in March 1836.
    { id: 'wash-frame-unfinished', sprite: 'building-frame-two-storey', x: 40, y: -50, height: 28, label: 'Byars & Mercer’s frame' },
    { id: 'wash-byars-smithy', sprite: 'timber-shop', x: 90, y: 90, height: 16, label: 'Byars’s smithy' },
    { id: 'wash-morris-cabin', sprite: 'house-round-log', x: 300, y: 80, height: 16 },
    { id: 'wash-kenney-house', sprite: 'house-hewn-log', x: -280, y: 120, height: 18 },
    { id: 'wash-robinson-ferry-house', sprite: 'trading-house', x: 1250, y: -120, height: 18, label: 'Robinson’s, at the crossing' },
    { id: 'wash-pecan', sprite: 'pecan', x: 1139, y: 106, height: 40 },
    { id: 'wash-ferry', sprite: 'ferry-raft', x: 1470, y: 0, height: 8, onWater: true, label: 'The ferry' },
    ...[[-340, -340], [340, -340], [-340, 340], [340, 340], [-680, 340], [-340, 680], [340, 680], [-680, -340]].map(([x, y], i) => ({ id: `wash-stake-${i + 1}`, sprite: i % 2 ? 'survey-stake' : 'survey-blazed-post', x, y, height: 5 })),
    ...alongRoad('wash-house', [{ x: 100, y: 0 }, { x: 650, y: 0 }], { count: 8, spacing: 75, setback: 75 }),
  ],
};

// ---------------------------------------------------------------------------------------------- Brazoria
// docs/town-research/brazoria.md §7: a grid lying square along the Brazos, a short dense frontage on Main Street either
// side of Market, and the back of the grid in stumps and garden. The origin, Market × Main, is measured, and the map's
// point is set on it (HIST-TEX-046).
const BRZ_X = [['Walnut Street', -1148], ['Chestnut Street', -882], ['Star Street', -591], ['China Street', -325], ['Market Street', 0], ['Liberty Street', 541], ['Cherry Street', 935]];
const BRZ_Y = [['Main Street', 0], ['Pearl Street', 282], ['Austin Street', 561], ['Camp Street', 840], ['Travis Street', 1119], ['Marion Street', 1391], ['Velasco Street', 1670]];
const BRZ_NAMED = [
  // Built out over the water (research §7.4), so drawn there on purpose (`onWater`).
  { id: 'brz-mills-store', sprite: 'trading-house', x: 30, y: -40, height: 26, label: 'The Mills brothers’ store', onWater: true },
  { id: 'brz-long-boarding-house', sprite: 'house-dog-run', x: -190, y: 80, height: 24, label: 'Jane Long’s boarding house' },
  { id: 'brz-long-outbuilding', sprite: 'storehouse', x: -190, y: 120, height: 12, partOf: 'brz-long-boarding-house' },
  { id: 'brz-hotel', sprite: 'frame-hall', x: 300, y: 90, height: 28, label: 'The Brazoria Hotel' },
  { id: 'brz-printing-office', sprite: 'cabin-small', x: -40, y: 350, height: 18, label: 'The Texas Republican' },
  { id: 'brz-andrews-store', sprite: 'trading-house', x: 160, y: 350, height: 22, label: 'Andrews’s store' },
  { id: 'brz-bennett-sharp-store', sprite: 'trading-house', x: -390, y: 355, height: 22 },
  { id: 'brz-manson-store', sprite: 'timber-shop', x: 480, y: 355, height: 20 },
  { id: 'brz-warehouse-1', sprite: 'storehouse', x: -280, y: -75, height: 22 },
  { id: 'brz-warehouse-2', sprite: 'storehouse', x: 615, y: 85, height: 20 },
  { id: 'brz-doctor-1', sprite: 'cabin-small', x: -520, y: 40, height: 16 },
  { id: 'brz-doctor-2', sprite: 'cabin-small', x: 700, y: 330, height: 16 },
  { id: 'brz-courthouse', sprite: 'timber-hall', x: 270, y: 630, height: 24, label: 'The municipal building' },
  // Half a mile out of town, and it keeps its surveyed place (`inPlace`, `TOWN_SPREAD`).
  { id: 'brz-masonic-oak', sprite: 'live-oak-large', x: -2201, y: 2188, height: 50, label: 'The Masonic Oak', inPlace: true },
];
const BRAZORIA = {
  name: 'Brazoria', research: 'docs/town-research/brazoria.md', bearing: 133.7, anchor: { x: 0, y: 0 },
  // A town on its river spreads away from the water (`TOWN_SPREAD`): round Market Street at the top of the bank, 130 feet
  // above Main, so the riverfront keeps its place and the town grows back from the Brazos. Spread round Market × Main, the
  // hotel and the warehouse of the riverfront were drawn in the river.
  spreadFrom: { x: 0, y: -130 },
  // Main Street runs 130 ft from the top of a 22-ft cut bank, and the Mills store was built out over the water (research §7.4):
  // this town stands nearer its river than any other, so it is held only 100 ft clear of the river's centreline.
  riverClearance: 100,
  // The frontage on Main and Pearl and the blocks behind it either side of Market (§7.5), the back of the grid "in stumps
  // and garden": Walnut, Chestnut and Cherry, Travis, Marion and Velasco Streets, and the ends of the others, are not
  // drawn (2026-10-13).
  streets: builtGrid(BRZ_X, BRZ_Y, 55.6, [
    ['Star Street', 'Main Street', 'Austin Street'], ['China Street', 'Main Street', 'Camp Street'], ['Market Street', 'Main Street', 'Camp Street'],
    ['Liberty Street', 'Main Street', 'Austin Street'], ['Main Street', 'Chestnut Street', 'Liberty Street'], ['Pearl Street', 'Chestnut Street', 'Cherry Street'],
    ['Austin Street', 'Star Street', 'Liberty Street'], ['Camp Street', 'China Street', 'Market Street'],
  ]).map(street => ['Main Street', 'Market Street', 'Pearl Street'].includes(street.name) ? street : { ...street, faint: true }),
  squares: [],
  buildings: withFill(BRZ_NAMED, { prefix: 'brz-house', origin: { x: -1148, y: 0 }, module: 278, block: 222, lots: 2, centre: { x: 0, y: 150 }, count: 34, rows: [0, 4], columns: [0, 8], sprites: ['house-dog-run', 'house-hewn-log', 'house-round-log', 'cabin-wide', 'cabin-weathered'] }),
};

// ---------------------------------------------------------------------------------------------- Velasco
// docs/town-research/velasco.md §8: six buildings in two fenced enclosures, measured off Harkort's drawing, and the 1832
// circular fort derelict with a new gun on its mound. The origin is Monument Square, the map's point.
// stand-in: docs/ART_REQUESTS.md, request 2026-09-16 - a circular log-and-sand fort. Claude's `fort-velasco` (docs/ART_REQUESTS.md,
// "Claude-drawn stand-ins") on the gun's point when its sheet has loaded; until then palisade pieces in a ring, gapped, and the gun.
const VELASCO = {
  name: 'Velasco', research: 'docs/town-research/velasco.md', bearing: 130.8, anchor: { x: 0, y: 0 },
  streets: [],
  squares: [],
  walls: [
    { name: 'The enclosures', points: [{ x: -900, y: -560 }, { x: -500, y: -560 }, { x: -500, y: -230 }, { x: -900, y: -230 }, { x: -900, y: -560 }], sprite: 'fence-rail', spacing: 40, height: 5 },
    { name: '', points: [{ x: -700, y: -560 }, { x: -700, y: -230 }], sprite: 'fence-rail', spacing: 40, height: 5 },
  ],
  buildings: [
    // Fort Velasco's stockade: Astra's researched landmark (2026-10-11), about 90 feet across, its gun inside it.
    { id: 'vel-fort-stockade', sprite: 'town-fort-velasco-1835', x: -420, y: -180, height: 8, drawWidthFeet: 90, anchor: [.5, .52], sortOffsetFeet: -1, label: 'Fort Velasco' },
    { id: 'vel-fort-gun', sprite: 'cannon-iron-e', x: -420, y: -180, height: 7, drawWidthFeet: 12, anchor: [.5, 1], partOf: 'vel-fort-stockade' },
    { id: 'vel-brown-hoskins', sprite: 'frame-hall', x: -760, y: -430, height: 28, label: 'Brown & Hoskins’ tavern' },
    { id: 'vel-custom-house', sprite: 'trading-house', x: -620, y: -300, height: 18, label: 'The custom house' },
    { id: 'vel-pilot-house', sprite: 'cabin-wide', x: -560, y: -520, height: 16, label: 'The pilot’s house' },
    { id: 'vel-clokey', sprite: 'timber-shop', x: -880, y: -360, height: 18 },
    { id: 'vel-house-1', sprite: 'cabin-small', x: -700, y: -540, height: 15, filler: true },
    { id: 'vel-house-2', sprite: 'cabin-weathered', x: -840, y: -260, height: 15, filler: true },
  ],
};

// ---------------------------------------------------------------------------------------------- Harrisburg
// docs/town-research/harrisburg.md §8: a measured grid drawn as survey lines, about twenty houses, and the steam mills on
// the bayou, the largest thing in the place. The origin, Broadway × Cypress, is the map's point.
const HARRISBURG = {
  name: 'Harrisburg', research: 'docs/town-research/harrisburg.md', bearing: 88.8, anchor: { x: 0, y: 0 },
  // A town on its bayou spreads up from its landing (`TOWN_SPREAD`): round the steam mills' landing on Buffalo Bayou, so
  // the mills, the largest thing in the place, keep their place on the water and the town grows back from it between the
  // two bayous. Spread round its point, the store, the warehouse and the houses of the bayou front were drawn in the bayou.
  spreadFrom: { x: 520, y: -500 },
  // The survey lines of the blocks the twenty houses stand on, toward Broadway and the bayou front (§8.4), and Broadway,
  // the cart track, from Market Street down to the town's point at Cypress, where the map's roads come in. Colorado,
  // Cypress and Elm, and the ends of the rest, ran past empty blocks and are not drawn (2026-10-13).
  streets: [
    { name: 'Broadway', width: 124, points: [{ x: 0, y: -1210 }, { x: 0, y: 0 }] },
    ...faint([['Medina', -421], ['Frio', 424]].map(([name, x]) => ({ name, width: 80, points: [{ x, y: -1210 }, { x, y: -400 }] }))),
    ...faint([['Market', -1210, 424], ['Sycamore', -800, 500], ['Walnut', -400, 424]].map(([name, y, east]) => ({ name, width: 80, points: [{ x: -421, y }, { x: east, y }] }))),
  ],
  squares: [],
  buildings: [
    // The steam sawmill: Astra's researched landmark (2026-10-11, docs/ART_DELIVERY_2026-10-11-TOWN-LANDMARKS.md).
    { id: 'hbg-mill', sprite: 'town-harrisburg-steam-mill-1835', x: 620, y: -500, height: 24, label: 'Harrisburg Steam Mills' },
    { id: 'hbg-harris-house', sprite: 'house-dog-run', x: 220, y: -600, height: 20, label: 'The Harris house' },
    { id: 'hbg-dch-store', sprite: 'trading-house', x: 300, y: -1000, height: 18, label: 'D. C. Harris’s store' },
    { id: 'hbg-warehouse', sprite: 'storehouse', x: 560, y: -980, height: 18 },
    { id: 'hbg-moore', sprite: 'frame-hall', x: -380, y: -700, height: 22, label: 'John W. Moore’s house' },
    { id: 'hbg-frame-1', sprite: 'frame-hall', x: 480, y: -700, height: 18 },
    { id: 'hbg-frame-2', sprite: 'timber-shop', x: 490, y: -640, height: 18 },
    { id: 'hbg-cannon-1', sprite: 'cannon-iron-e', x: 520, y: -430, height: 6, label: 'Guns waiting to go west' },
    { id: 'hbg-cannon-2', sprite: 'cannon-iron-e', x: 545, y: -420, height: 6, partOf: 'hbg-cannon-1' },
    { id: 'hbg-cannon-3', sprite: 'cannon-iron-e', x: 570, y: -410, height: 6, partOf: 'hbg-cannon-1' },
    ...dwellings('hbg-log', { origin: { x: -1221, y: -1610 }, module: 400, block: 320, lots: 2, centre: { x: 100, y: -700 }, count: 14, rows: [0, 5], columns: [0, 4], sprites: ['house-round-log', 'cabin-small', 'cabin-weathered', 'house-hewn-log'], height: 16, taken: [{ x: 220, y: -600 }, { x: 300, y: -1000 }, { x: -380, y: -700 }, { x: 480, y: -700 }, { x: 420, y: -640 }] }),
  ],
};

// ---------------------------------------------------------------------------------------------- Anahuac
// docs/town-research/anahuac.md §8: the 1831 brick fort a robbed ruin on the bluff, empty; a scatter of fifteen houses and
// shops a mile north on the terrace, some empty. North-up; the origin is the 1976 fort marker, and the map's point stands
// at x 1642, y −6287 in it (measured).
/** The fort on its bluff, which keeps its place a mile south of the town (`heldAt`, `TOWN_SPREAD`). */
const ANH_FORT = { x: -160, y: 0 };
const ANAHUAC = {
  name: 'Anahuac', research: 'docs/town-research/anahuac.md', bearing: 90, anchor: { x: 1642, y: -6287 },
  // The map's point stands three quarters of a mile north of the town (above): spread round it, the town was pushed two
  // miles south past its own fort. Spread from Labadie's, the town's southern house, it grows north up its terrace.
  spreadFrom: { x: 650, y: -2000 },
  streets: [
    { name: 'The track to Turtle Bayou', leadsTo: 'Turtle Bayou', width: 12, faint: true, points: [{ x: 1100, y: -4000 }, { x: 1400, y: -6800 }] },
    // Interpretive terrace connector, keeping the two documented path fragments unchanged.
    { name: 'The terrace path', width: 10, faint: true, points: [{ x: 1100, y: -4000 }, { x: 1030, y: -3550 }, { x: 940, y: -3050 }, { x: 900, y: -2550 }, { x: 800, y: -2000 }, { x: 700, y: -1500 }] },
    { name: 'The path to the fort', leadsTo: 'the fort', width: 8, faint: true, points: [{ x: 700, y: -1500 }, { x: -100, y: -100, heldAt: ANH_FORT }] },
  ],
  squares: [],
  buildings: [
    // The fort keeps its surveyed place on the bluff, a mile south of the town (`heldAt`); the town spreads north from its
    // southern house, so the ground between them stays open (`spreadFrom`).
    { id: 'anh-fort', sprite: 'brick-fort-ruin', x: -160, y: 0, height: 14, label: 'Fort Anahuac (ruin)', heldAt: ANH_FORT },
    { id: 'anh-fort-davis', sprite: 'brick-bastion', x: -205, y: 40, height: 8, heldAt: ANH_FORT, partOf: 'anh-fort' },
    { id: 'anh-fort-barracks', sprite: 'brick-barracks-ruin', x: -168, y: -12, height: 10, heldAt: ANH_FORT, partOf: 'anh-fort' },
    { id: 'anh-fort-breach', sprite: 'brick-breach', x: -125, y: 20, height: 6, heldAt: ANH_FORT, partOf: 'anh-fort' },
    { id: 'anh-willcox-store', sprite: 'trading-house', x: 900, y: -3600, height: 18, label: 'Willcox’s store' },
    { id: 'anh-briscoe-store', sprite: 'trading-house', x: 620, y: -3000, height: 18, label: 'Briscoe’s store' },
    { id: 'anh-custom-office', sprite: 'storehouse', x: 560, y: -2650, height: 16, label: 'The collector’s office (empty)' },
    { id: 'anh-calaboose', sprite: 'cabin-small', x: 760, y: -2700, height: 12, label: 'The calaboose' },
    { id: 'anh-freeman-house', sprite: 'house-round-log', x: 1300, y: -4200, height: 14 },
    { id: 'anh-labadie', sprite: 'cabin-wide', x: 650, y: -2000, height: 15 },
    { id: 'anh-skiff', sprite: 'skiff', x: 300, y: -3000, height: 4, onWater: true },
    ...scatter('anh-house', { centre: { x: 1100, y: -3400 }, radius: 1700, count: 8, sprites: ['house-round-log', 'cabin-small', 'house-hewn-log'], height: 16, within: (x, y) => x > 600 && x < 1700 && y < -1500 && y > -5200 }),
    ...scatter('anh-empty', { centre: { x: 1200, y: -2600 }, radius: 1200, count: 4, sprites: ['cabin-weathered', 'cabin-ruin'], height: 14, within: (x, y) => x > 600 && x < 1700 && y < -1500 }),
  ],
};

// ---------------------------------------------------------------------------------------------- Nacogdoches
// docs/town-research/nacogdoches.md §9: the Camino Real along the ridge, the irregular Plaza Principal turned thirty
// degrees, the Stone House, and a town that fills Main Street for a third of a mile and thins down the slopes - old houses
// of upright logs and mud, white frame houses among them, log cabins on the outskirts. North-up; the origin is Main × North
// Fredonia, and the map's point stands at x −343, y −224 (measured).
const NAC_CAMINO = [{ x: -1180, y: -730 }, { x: -1090, y: -720 }, { x: -750, y: -530 }, { x: -499, y: -373 }, { x: -259, y: -151 }, { x: -56, y: -13 }, { x: 0, y: 0 }, { x: 324, y: 126 }, { x: 627, y: 239 }, { x: 1224, y: 474 }, { x: 1720, y: 670 }, { x: 2040, y: 800 }];
const NAC_PILAR = [{ x: -634, y: -52 }, { x: -352, y: 54 }, { x: -108, y: 164 }, { x: 249, y: 309 }, { x: 560, y: 440 }, { x: 1148, y: 693 }];
const NACOGDOCHES = {
  name: 'Nacogdoches', research: 'docs/town-research/nacogdoches.md', bearing: 90, anchor: { x: -343, y: -224 },
  // The measured streets (§9.2), each drawn as far as the town stood along it (2026-10-13): La Calle del Norte to Durst's
  // house, the two streets down from the plaza to just past Calle del Pilar. North Fredonia, which ran off north-east past
  // nothing but the outskirts' scattered cabins, is not drawn. The Camino Real runs on to the La Nana crossing and the
  // road south to Liberty out of town, as roads.
  streets: [
    { name: 'El Camino Real', leadsTo: 'the La Nana crossing', width: 40, points: NAC_CAMINO },
    { name: 'La Calle del Norte', width: 30, points: [{ x: -499, y: -373 }, { x: -430, y: -550 }, { x: -363, y: -737 }, { x: -260, y: -1070 }, { x: -230, y: -1170 }] },
    { name: 'Calle del Pilar', width: 30, points: NAC_PILAR },
    { name: '', width: 30, points: [{ x: -56, y: -13 }, { x: -108, y: 164 }, { x: -185, y: 343 }] },
    { name: '', width: 30, points: [{ x: -259, y: -151 }, { x: -352, y: 54 }, { x: -460, y: 280 }] },
    { name: 'To Liberty', leadsTo: 'Liberty', width: 25, faint: true, points: [{ x: -634, y: -52 }, { x: -870, y: 470 }, { x: -1090, y: 920 }] },
  ],
  squares: [
    { label: 'Plaza Principal', points: [{ x: -259, y: -151 }, { x: -56, y: -13 }, { x: -108, y: 164 }, { x: -352, y: 54 }] },
    { label: 'Church plaza', points: [{ x: -640, y: -470 }, { x: -470, y: -420 }, { x: -500, y: -250 }, { x: -660, y: -300 }] },
  ],
  buildings: [
    // The two-storey Stone House: Astra's researched landmark (2026-10-11, docs/ART_DELIVERY_2026-10-11-TOWN-LANDMARKS.md).
    { id: 'nac-stone-house', sprite: 'town-nacogdoches-stone-house-1835', x: -60, y: -60, height: 20, label: 'The Stone House' },
    { id: 'nac-red-house', sprite: 'adobe-flat', x: -470, y: -60, height: 16, label: 'The Red House' },
    { id: 'nac-church-ruin', sprite: 'roofless-church-shell', x: -560, y: -380, height: 18, label: 'The old church' },
    { id: 'nac-sterne', sprite: 'timber-hall', x: 1186, y: 872, height: 22, label: 'Sterne’s house' },
    { id: 'nac-durst', sprite: 'house-dog-run', x: -184, y: -1069, height: 18, label: 'Durst’s house' },
    { id: 'nac-smithy', sprite: 'shed-open', x: 100, y: 200, height: 12, label: 'A smithy' },
    ...alongRoad('nac-store', [{ x: -420, y: -300 }, { x: -56, y: -13 }, { x: 627, y: 239 }], { count: 6, spacing: 190, setback: 55, sprites: ['trading-house', 'timber-shop', 'trading-house'], height: 18 }),
    ...alongRoad('nac-frame', [{ x: 700, y: 270 }, { x: 1224, y: 474 }, { x: 1600, y: 620 }], { count: 8, spacing: 130, setback: 70, sprites: ['timber-hall', 'house-dog-run'], height: 18 }),
    // Houses of upright logs and mud (`town-buildings-researched`, 2026-09-21): the palisado row is the jacal of set
    // upright posts, which is what "palisado" means here, with the poorer and broader kinds among the older street.
    ...alongRoad('nac-palisade', NAC_PILAR, { count: 12, spacing: 150, setback: 60, sprites: ['jacal-upright-post'], height: 14 }),
    ...alongRoad('nac-old', [{ x: -1090, y: -720 }, { x: -750, y: -530 }, { x: -499, y: -373 }], { count: 8, spacing: 90, setback: 60, sprites: ['jacal-broad', 'adobe-flat', 'jacal-poor'], height: 14 }),
    ...scatter('nac-log', { centre: { x: 200, y: 100 }, radius: 1400, count: 10, sprites: ['cabin-small', 'house-hewn-log'], height: 14, within: (x, y) => Math.hypot(x - 200, y - 100) > 800 }),
  ],
};

// ---------------------------------------------------------------------------------------------- Refugio
// docs/town-research/refugio.md §9: the 1834 plat's survey lines on open prairie round an empty plaza, the mission church
// a ruin in its walled churchyard, and about two dozen huts near the church. The origin, the plaza's centre, is the map's
// point (HIST-TEX-025).
const REF_LINES = [-1458.33, -1041.67, -625, -208.33, 208.33, 625, 1041.67, 1458.33];
const REFUGIO_PLAZA = { label: 'Plaza de la Constitución', x: -166.67, y: -166.67, width: 333.33, height: 333.33 };
const REFUGIO = {
  name: 'Refugio', research: 'docs/town-research/refugio.md', bearing: 99.6, anchor: { x: 0, y: 0 },
  // Only the four survey lines round the empty plaza, faint, a little past its corners (2026-10-13). The plat's sixteen
  // lines (`REF_LINES`) were "survey lines, not made roads" in 1835 (§9.2), and nobody lived along them: the huts stood
  // by the mission. Sixteen lines three thousand feet long drew a city on open prairie; the plat is in the research.
  // ceiling: the plat's other lines are not drawn at all; a layout that ever shows the 1834 survey as a survey would.
  streets: faint([-208.33, 208.33].flatMap(v => [
    { name: v < 0 ? 'Purísima' : '', width: 83.33, points: [{ x: -400, y: v }, { x: 400, y: v }] },
    { name: '', width: 83.33, points: [{ x: v, y: -400 }, { x: v, y: 400 }] },
  ])),
  squares: [REFUGIO_PLAZA],
  walls: [
    { name: 'The churchyard', points: [{ x: -753, y: 1066 }, { x: -770, y: 1066 }, { x: -770, y: 916 }, { x: -720, y: 916 }, { x: -720, y: 1066 }, { x: -737, y: 1066 }], sprite: 'wall-straight', spacing: 16, height: 6 },
  ],
  buildings: [
    { id: 'ref-plaza-rock', sprite: 'survey-stone-corner', x: 0, y: 0, height: 4 },
    { id: 'ref-mission-church', sprite: 'roofless-church-shell', x: -745, y: 898, height: 24, label: 'Mission church (ruinous)' },
    { id: 'ref-sabina-brown', sprite: 'house-jacal', x: -500, y: -333, height: 14, filler: true },
    { id: 'ref-westover', sprite: 'house-jacal', x: -257, y: -757, height: 14, filler: true },
    { id: 'ref-scott', sprite: 'house-jacal', x: -560, y: 760, height: 14, filler: true },
    { id: 'ref-power-town-house', sprite: 'house-jacal', x: -620, y: 1900, height: 15, label: 'Colonel Power’s town house' },
    { id: 'ref-quirk', sprite: 'cabin-small', x: -300, y: 540, height: 16 },
    // The huts round the mission, in the jacal variety delivered 2026-09-21; the named houses above keep the one jacal
    // they have always been drawn as, so a student who knows Colonel Power's town house still knows it.
    ...scatter('ref-hut', { centre: { x: -700, y: 700 }, radius: 1000, count: 20, sprites: ['adobe-flat', 'jacal-broad', 'adobe-flat', 'jacal-poor', 'adobe-tile', 'jacal-ramada'], height: 14, exclude: [REFUGIO_PLAZA, { x: -800, y: 880, width: 110, height: 190 }] }),
  ],
};

// ---------------------------------------------------------------------------------------------- Goliad
// docs/town-research/goliad.md §9: the presidio La Bahía as it stood the night of 9-10 October 1835 - limestone walls with
// breaches, the chapel sound, the officers' quarters and barracks - and the town a scatter of stone houses and jacales
// against its south and west walls, no grid and no plaza; the mission across the river a ruin being quarried. The frame
// is the fort's; the map's point, at the presidio, stands about x 50, y 205 in it (the interpretive markers).
const GOLIAD = {
  name: 'Goliad', research: 'docs/town-research/goliad.md', bearing: 96, anchor: { x: 50, y: 205 },
  // Battle ground, as Béxar and the Alamo are: the massacre is staged in and round the presidio in true miles
  // (sim/battles/goliad-massacre.mjs), so the presidio and its town are drawn as surveyed, not spread (`TOWN_SPREAD`).
  spread: 1,
  streets: [
    { name: 'The road from Refugio', leadsTo: 'Refugio', width: 30, faint: true, points: [{ x: 200, y: 358 }, { x: 400, y: 520 }, { x: 900, y: 700 }, { x: 1800, y: 1100 }] },
    { name: 'The road from Victoria, by the ford', leadsTo: 'the ford', width: 30, faint: true, points: [{ x: 200, y: 20 }, { x: 60, y: -400 }, { x: -130, y: -680 }] },
  ],
  squares: [{ label: 'Parade ground', x: 20, y: 20, width: 355, height: 338 }],
  walls: [
    // The number and place of the breaches are invented (research §9.4); that the wall was breached is documented.
    { name: 'Presidio La Bahía', points: [{ x: 20, y: 20 }, { x: 375, y: 20 }, { x: 375, y: 358 }, { x: 20, y: 358 }, { x: 20, y: 20 }], sprite: 'alamo-wall-intact', breach: 'alamo-wall-breach', breachEvery: 11, spacing: 14, height: 8 },
  ],
  buildings: [
    ...[[20, 20], [375, 20], [375, 358], [20, 358]].map(([x, y], i) => ({ id: `gol-bastion-${i + 1}`, sprite: 'alamo-wall-corner', x, y, height: 10 })),
    { id: 'gol-chapel', sprite: 'chapel', x: 135, y: 32, height: 23, label: 'Our Lady of Loreto' },
    { id: 'gol-magazine', sprite: 'storehouse', x: 162, y: 75, height: 10 },
    { id: 'gol-officers-quarters', sprite: 'stone-long-barrack', x: 55, y: 180, height: 12, label: 'Officers’ quarters' },
    { id: 'gol-barracks', sprite: 'stone-long-barrack', x: 268, y: 345, height: 12 },
    { id: 'gol-espiritu-santo', sprite: 'roofless-church-shell', x: -1498, y: -3113, height: 20, label: 'Mission Espíritu Santo (ruin)' },
    { id: 'gol-zaragoza', sprite: 'stone-tile-house', x: -38, y: 420, height: 14, label: 'The Zaragoza house' },
    ...[[-60, 480], [-150, 390], [30, 500], [150, 480], [260, 470], [440, 430]].map(([x, y], i) => ({ id: `gol-stone-${i + 1}`, sprite: 'stone-tile-house', x, y, height: 14, filler: true })),
    // Jacales in variety (`town-buildings-researched`, 2026-09-21), with the flat-roofed adobe among them as before.
    ...scatter('gol-jacal', { centre: { x: 0, y: 500 }, radius: 900, count: 36, sprites: ['jacal-broad', 'jacal-upright-post', 'adobe-flat', 'jacal-poor', 'jacal-ramada'], height: 13, exclude: [{ x: 20, y: 20, width: 355, height: 338 }], within: (x, y) => y > 380 || x < -40 }),
  ],
};

// Adjacent-lot corrections to invented scenery only; see docs/TOWN_STREET_REPAIRS_2026-10-03.md.
const scenicAnchors = {
  'wash-house-4': { x: 280, y: 75 },
  'nac-palisade-3': { x: -390, y: -30 },
  'nac-log-4': { x: 1140, y: 540 },
  'gol-jacal-18': { x: 515, y: 645 },
};
for (const layout of [WASHINGTON, NACOGDOCHES, GOLIAD]) {
  layout.buildings = layout.buildings.map(building => scenicAnchors[building.id] ? { ...building, ...scenicAnchors[building.id] } : building);
}
// Lots set a little apart for the spread drawing (`TOWN_SPREAD`, owner 2026-10-27). As drawn, each of these covered more than
// a sixth of a neighbour's picture, hid a keeper standing at a door, or put its name over a keeper (tests/town-lots.test.mjs);
// most did at the old height too. Every position finer than a block is invented (`FIC-GONZ-042`), so each moves the least
// that clears it - ten to sixty feet, Cooper & Chieves's a hundred and ten - and stays on its own side of its street. Found
// by search, not by eye; the numbers are the survey's frame, in feet. Goliad's three are huts of its town, not the presidio.
const lotsApart = {
  'sf-peyton-tavern': { x: 1155, y: 2040 }, 'sf-gay-saloon': { x: 1426, y: 1954 }, 'sf-cooper-chieves': { x: 1432, y: 2042 },
  'sf-white-store': { x: 1100, y: 1795 }, 'sf-perry-store': { x: 1210, y: 1850 }, 'sf-huff-store': { x: 1663, y: 2075 },
  'sf-calvit-house': { x: 1930, y: 2075 }, 'sf-house-7': { x: 1600, y: 1690 }, 'sf-house-3': { x: 980, y: 2100 },
  'lib-house-1': { x: 1981, y: 961 }, 'lib-house-2': { x: 2024, y: 1114 },
  'wash-house-1': { x: 137, y: -90 }, 'wash-house-4': { x: 257, y: 130 },
  'anh-house-2': { x: 691, y: -3007 }, 'anh-empty-2': { x: 772, y: -2188 },
  'nac-store-3': { x: -109, y: -129 }, 'nac-old-8': { x: -561, y: -330 }, 'nac-log-8': { x: -860, y: -492 },
  'gol-jacal-1': { x: 112, y: 528 }, 'gol-jacal-11': { x: 437, y: 378 }, 'gol-stone-1': { x: -51, y: 484 },
};
for (const layout of [SAN_FELIPE, LIBERTY, WASHINGTON, ANAHUAC, NACOGDOCHES, GOLIAD]) {
  layout.buildings = layout.buildings.map(building => lotsApart[building.id] ? { ...building, ...lotsApart[building.id] } : building);
}
// The surveyed Refugio grid stays in place; only filler huts are held off its street strips.
REFUGIO.buildings = REFUGIO.buildings.map(building => {
  if (!building.id.startsWith('ref-hut-')) return building;
  const clearAxis = value => {
    const line = REF_LINES.find(line => Math.abs(value - line) < 65);
    return line === undefined ? value : Math.round(line + (value < line ? -65 : 65));
  };
  return { ...building, x: clearAxis(building.x), y: clearAxis(building.y) };
});

export const TOWN_LAYOUTS = Object.freeze({
  'san-felipe': SAN_FELIPE, victoria: VICTORIA, mina: MINA, matagorda: MATAGORDA, columbia: COLUMBIA, liberty: LIBERTY,
  washington: WASHINGTON, brazoria: BRAZORIA, velasco: VELASCO, harrisburg: HARRISBURG, anahuac: ANAHUAC, nacogdoches: NACOGDOCHES, refugio: REFUGIO, goliad: GOLIAD,
});
