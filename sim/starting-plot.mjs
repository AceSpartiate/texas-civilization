// The family's first ten acres, laid where they can be worked: owner, 2026-10-05 (docs/LAND_GRANTS.md §5.4).
//
// The owner, playing solo: "When starting the game, if I put my house somewhere, the starting plot that we can plant is
// frequently straddling a river, or outside of the borders of my property line. We should add something to dynamically take
// care of this."
//
// Every family begins with ten acres broken (`plot-1`, sim/fields.mjs). Until now they were the corner of a fixed forty-acre
// block south-east of the house, carried along with the house when the family chose its site (sim/homesite.mjs): never
// looked at. Measured 2026-10-05 over 718 sites a family may choose on four classes, 405 put the first ten acres partly or
// wholly off the family's land, 172 over the house, and 21 in a river or creek the map draws.
//
// Now the first ten acres are **laid**, by the very rules a plot a student stakes is held to (sim/survey.mjs `plotRefusal`):
// wholly inside the family's line, clear of the house yard and of every house as the map draws it, over no other plot, and in
// no river or creek the map draws. They are looked for outward from the house, nearest first, open ground before timber
// (`TIMBER_PENALTY`): a settler broke the prairie or the thinnest ground first, and ten acres of timber taken as already broken
// would take a hundred trees off the map for nothing. They are laid when the family chooses its site, and laid again round the
// house when the family places its first house (sim/houses.mjs `planHouse`), while nothing has been done on them.
//
// **The trees on them come down with them** (`clearStartingTrees`): ten acres begun broken have no trees standing in them, so
// the woods lose them - the map stopped drawing them in cleared ground long ago (public/app.js `inCleared`), but people walking
// went round them, round nothing anybody could see. **Their logs go nowhere**: the ground was broken before the class began,
// and the owner refused free logs for the yard (2026-10-03, "the felling paid, never the free logs"), so no log goes onto the
// pile for them. A felled entry says so (`field: 'plot-1'`, `logs: 0`), which is also what lets them stand again if the first
// ten acres are laid somewhere else.
//
// **A class already in play** (`settleStartingPlots`, at the save's door, server/storage.mjs `readSave`) keeps its first ten
// acres where they are, **unless they cannot be** - off the land, over the yard or a house, or in the water - **and nobody has
// done anything on them** (`startingPlotOpen`): not sown, not fenced, nobody at work on them. Then they are laid again round the
// house. Ten acres planted or fenced stay where they are, wherever they are. The trees standing in any cleared plot come down
// (no logs: those cleared before 2026-10-05 had their timber felled onto the pile already; what is left gives none).
// No save version moved: nothing new is stored but felled trees, and every class saved before opens.
//
// Every number here is the game's own (`FIC-GONZ-1164`).
import { holdingOf } from './grants.mjs';
import { landAround, onRealLand } from './ground.mjs';
import { PLOT_SIDE, drawnWater, fieldPlots, groundAt, overlaps, plotWater, squareOf } from './fields.mjs';
import { housesOnLand, widestHouseAtSite } from './house-placement.mjs';
import { countsTrees, treesIn, woodsRule } from './woods.mjs';

/** The plot every family begins with. */
export const FIRST_PLOT = 'plot-1';
/**
 * The ground kept clear round the house's mark, in miles: the yard spot by the door and the little ones' play (sim/chores.mjs
 * `yardPoint`), the woodpile left of the house (sim/land-paths.mjs `woodpileAt`, about 0.075 west), where the stock is brought in
 * at night (`stockGround`, 0.05 out) and room for a yard's rails (`yardBox`).
 */
export const KEEP_CLEAR = Object.freeze({ west: 0.09, east: 0.055, north: 0.04, south: 0.065 });
/** Round each house, past its pictures: the yard's margin at the sides and back and its dooryard before the door (sim/land-paths.mjs). */
const HOUSE_MARGIN = 0.02, HOUSE_FRONT = 0.035;
/** How finely, and how far out from the house, the first ten acres are looked for: a quarter of a plot's side, out to three quarters of a mile. */
const STEP = PLOT_SIDE / 4, FURTHEST = 0.75;
/** Ten acres of timber are laid only where open ground is this much further off (miles). */
export const TIMBER_PENALTY = 0.15;

const round = (value, places = 3) => { const fixed = +value.toFixed(places); return fixed === 0 ? 0 : fixed; };

/** The family's first ten acres as the field has them, or null. */
export const firstPlot = (world, household) => {
  const plot = fieldPlots(household).find(one => one.id === FIRST_PLOT);
  if (!plot) return null;
  if (household.plots) return plot;
  const field = fieldBlock(world, household);
  if (!field) return null;
  const minX = Math.min(...field.points.map(p => p.x)), minY = Math.min(...field.points.map(p => p.y));
  return { ...plot, x: round(minX + PLOT_SIDE / 2), y: round(minY + PLOT_SIDE / 2) };
};
const fieldBlock = (world, household) => world.map.terrain.find(feature => feature.kind === 'field' && feature.ownerHouseholdId === household.id);

/**
 * Whether the first ten acres are as the family began with them: cleared, nothing sown, no rails, no crop ever in them, a class's
 * old field of one patch, and nobody of the family at work on them or on the way to them. Only such ground is laid again.
 */
export function startingPlotOpen(world, household) {
  const plot = firstPlot(world, household);
  if (!plot || plot.state !== 'cleared' || plot.sown || plot.fence || plot.crop || plot.ripe || Number.isFinite(plot.grownMs)) return false;
  if (!household.plots && (household.field?.cleared ?? 1) > 1) return false;
  const square = squareOf(plot);
  return !household.members.some(id => {
    const chore = world.entities[id]?.chore;
    if (!chore) return false;
    if (chore.plotId === FIRST_PLOT || chore.plots?.includes(FIRST_PLOT)) return true;
    const at = chore.plot;
    return Boolean(at && Number.isFinite(at.x) && at.x >= square.minX && at.x <= square.maxX && at.y >= square.minY && at.y <= square.maxY);
  });
}

/** The ground the first ten acres keep off: the yard round the site, and every house of the land past its pictures. */
function keepOff(world, household, houses) {
  const site = world.map.sites[household.homeSiteId];
  const boxes = [{ minX: site.x - KEEP_CLEAR.west, maxX: site.x + KEEP_CLEAR.east, minY: site.y - KEEP_CLEAR.north, maxY: site.y + KEEP_CLEAR.south }];
  // And the widest house standing at the site, where a house the family has not yet placed stands (`standingAt`): a cabin
  // planned after the site is chosen, or changed for a dog-run, never stands on the field.
  for (const { footprint, claim } of [...houses, widestHouseAtSite(world, household)].filter(Boolean)) {
    if (![footprint?.minX, footprint?.maxX, footprint?.minY, footprint?.maxY].every(Number.isFinite)) continue;
    boxes.push({
      minX: Math.min(claim.minX, footprint.minX - HOUSE_MARGIN), maxX: Math.max(claim.maxX, footprint.maxX + HOUSE_MARGIN),
      minY: Math.min(claim.minY, footprint.minY - HOUSE_MARGIN), maxY: Math.max(claim.maxY, footprint.maxY + HOUSE_FRONT),
    });
  }
  return boxes;
}

/**
 * Why the first ten acres cannot lie here, or null: the rules a staked plot is held to (sim/survey.mjs `plotRefusal`) - inside
 * the line, off the yard and the houses, over no other plot nor ground being surveyed, in no water the map draws.
 * `houses` are the houses as they will stand (`housesOnLand`), `courses` the drawn water near enough to matter.
 */
export function startingPlotWhy(world, household, point, { houses = housesOnLand(world, household), courses = drawnWater(world) } = {}) {
  const square = squareOf(point), bounds = holdingOf(world, household).bounds;
  if (square.minX < bounds.minX || square.maxX > bounds.maxX || square.minY < bounds.minY || square.maxY > bounds.maxY) return 'off the land';
  if (keepOff(world, household, houses).some(box => overlaps(box, square))) return 'the yard';
  if (fieldPlots(household).some(plot => plot.id !== FIRST_PLOT && Number.isFinite(plot.x) && overlaps(squareOf(plot), square))) return 'another plot';
  if (household.members.some(id => { const chore = world.entities[id]?.chore; return chore?.id === 'survey-plot' && chore.plot && overlaps(squareOf(chore.plot), square); })) return 'ground being surveyed';
  if (plotWater(world, point, courses)) return 'the water';
  return null;
}

/**
 * Where the first ten acres go, looked for outward from `around` (the door of the house, or the mark), nearest first, on a grid
 * a quarter of a plot apart: the nearest place `startingPlotWhy` allows, open ground before timber nearer than `TIMBER_PENALTY`.
 * Null when there is none within `FURTHEST` of it on the family's land.
 * ceiling: one size of plot. A family whose land has no dry ten acres outside the yard - none was found in 718 sites on four
 * classes (2026-10-05) - keeps the ten acres where they lay; a smaller first patch is the way out if a class ever shows one.
 */
export function findStartingPlot(world, household, around, { houses = housesOnLand(world, household) } = {}) {
  const bounds = holdingOf(world, household).bounds;
  const reach = FURTHEST + PLOT_SIDE;
  // Only the water near the land is measured: the class's map has every river and creek of the colonies.
  const near = { minX: Math.max(bounds.minX, around.x - reach), maxX: Math.min(bounds.maxX, around.x + reach), minY: Math.max(bounds.minY, around.y - reach), maxY: Math.min(bounds.maxY, around.y + reach) };
  const courses = drawnWater(world).filter(course => course.points.some(p => p.x > near.minX - 1 && p.x < near.maxX + 1 && p.y > near.minY - 1 && p.y < near.maxY + 1));
  const half = PLOT_SIDE / 2, places = [];
  const steps = Math.ceil(FURTHEST / STEP);
  for (let i = -steps; i <= steps; i++) {
    for (let j = -steps; j <= steps; j++) {
      const point = { x: round(around.x + i * STEP), y: round(around.y + j * STEP) };
      if (point.x - half < bounds.minX || point.x + half > bounds.maxX || point.y - half < bounds.minY || point.y + half > bounds.maxY) continue;
      const miles = Math.hypot(point.x - around.x, point.y - around.y);
      if (miles > FURTHEST) continue;
      // South-east of the house first among places as near, where the field always lay.
      places.push({ point, miles, turn: (Math.atan2(point.y - around.y, point.x - around.x) - Math.PI / 4 + Math.PI * 4) % (Math.PI * 2) });
    }
  }
  places.sort((a, b) => a.miles - b.miles || a.turn - b.turn);
  let best = null;
  for (const place of places) {
    if (best && place.miles >= best.score) break;
    if (startingPlotWhy(world, household, place.point, { houses, courses })) continue;
    const score = place.miles + (groundAt(world, place.point) === 'timber' ? TIMBER_PENALTY : 0);
    if (!best || score < best.score) best = { point: place.point, score };
  }
  return best?.point || null;
}

/** The woods' options for this class: its rule, and the creeks the land's own timber follows. */
const woodsOptions = world => ({ rule: woodsRule(world), nearCreek: landAround().nearCreek });

/**
 * Every tree standing on the first ten acres comes down, no log onto the pile (the ground was broken before the class began):
 * marked felled as the axe marks a tree, with `field` saying for which ten acres, so they stand again if those are laid elsewhere.
 * Returns how many came down.
 */
export function clearStartingTrees(world, household, plot) {
  if (!countsTrees(woodsRule(world))) return 0;
  const square = squareOf(plot);
  const felled = world.woods?.felled || {};
  const trees = (treesIn(square, woodsOptions(world)) || []).filter(tree => !felled[tree.id]);
  if (!trees.length) return 0;
  world.woods ||= { felled: {}, revision: 0 };
  for (const tree of trees) world.woods.felled[tree.id] = { by: household.id, minute: world.minute, kind: tree.kind, use: tree.use, logs: 0, left: 0, field: FIRST_PLOT };
  world.woods.revision += 1;
  return trees.length;
}
/** The trees taken off the first ten acres where they were, standing again: they were never anybody's logs. */
function regrowStartingTrees(world, household) {
  const felled = world.woods?.felled;
  if (!felled) return 0;
  let grown = 0;
  for (const [id, entry] of Object.entries(felled)) if (entry.by === household.id && entry.field === FIRST_PLOT) { delete felled[id]; grown++; }
  if (grown) world.woods.revision += 1;
  return grown;
}

/** Puts the first ten acres at `point`: the field's block moved so its first ten acres are there, the stored plot too, the trees with it. */
function moveStartingPlot(world, household, point, { tell = true } = {}) {
  const field = fieldBlock(world, household);
  if (field) {
    const minX = Math.min(...field.points.map(p => p.x)), minY = Math.min(...field.points.map(p => p.y));
    const dx = point.x - PLOT_SIDE / 2 - minX, dy = point.y - PLOT_SIDE / 2 - minY;
    // To the millionth, so the first ten acres read off the block (sim/fields.mjs `plotsOf`) are exactly where they were laid.
    field.points = field.points.map(p => ({ x: round(p.x + dx, 6), y: round(p.y + dy, 6) }));
  }
  const stored = household.plots?.find(plot => plot.id === FIRST_PLOT);
  if (stored) Object.assign(stored, { x: round(point.x), y: round(point.y), ground: groundAt(world, point) });
  regrowStartingTrees(world, household);
  clearStartingTrees(world, household, point);
  // Every client refetches the homesteads (server/app.mjs `mapId`), which carry the field's block a neighbour's field is drawn from.
  if (tell) world.map.revision = (world.map.revision || 0) + 1;
}

/** Where the first ten acres are looked for from: the door of the house as it will stand, or the mark. */
export function startingAround(world, household, houses = housesOnLand(world, household)) {
  const first = houses[0]?.footprint;
  if (first && [first.minX, first.maxX, first.maxY].every(Number.isFinite)) return { x: (first.minX + first.maxX) / 2, y: first.maxY };
  const site = world.map.sites[household.homeSiteId];
  return { x: site.x, y: site.y };
}

/**
 * The first ten acres laid round the house (`findStartingPlot`), while nothing has been done on them (`startingPlotOpen`).
 * `houses` are the houses as they will stand, when a house is being placed. Returns where they lie now, or null when they
 * were not laid (worked already, or nowhere better).
 */
export function layStartingPlot(world, household, { houses = housesOnLand(world, household), tell = true } = {}) {
  // The real land only: the invented Gonzales country has no site to choose, and its field stands where it always did.
  if (!onRealLand(world) || !startingPlotOpen(world, household)) return null;
  const point = findStartingPlot(world, household, startingAround(world, household, houses), { houses });
  if (!point) return null;
  moveStartingPlot(world, household, point, { tell });
  return point;
}

/**
 * Where the first ten acres would be laid were the house's site at `point`, for the family looking a place over before choosing
 * it (sim/homesite.mjs `siteFactsFor`; the chooser draws them, owner 2026-10-05). The site is moved there only for the looking.
 */
export function startingPlotIfSite(world, household, point) {
  const site = world.map.sites[household.homeSiteId];
  if (!site || !startingPlotOpen(world, household)) return null;
  // The labor stays round the mark (sim/grants.mjs `holdingOf`): kept while the site is moved, as choosing it keeps it.
  const was = { x: site.x, y: site.y }, hadMark = household.mark;
  household.mark ||= { ...was };
  site.x = point.x; site.y = point.y;
  try {
    const houses = housesOnLand(world, household);
    return findStartingPlot(world, household, startingAround(world, household, houses), { houses });
  } finally {
    site.x = was.x; site.y = was.y;
    if (hadMark === undefined) delete household.mark; else household.mark = hadMark;
  }
}

/**
 * Whether a house standing as `houses` say leaves the first ten acres somewhere to go: the house may be set down on ten acres
 * nobody has worked yet, and they are laid again round it (sim/house-placement.mjs). Null when they cannot move or have nowhere.
 */
export function startingPlotMovesFor(world, household, houses) {
  if (!onRealLand(world) || !startingPlotOpen(world, household)) return null;
  return findStartingPlot(world, household, startingAround(world, household, houses), { houses });
}

/**
 * A class saved before 2026-10-05, at the save's door: first ten acres that cannot be (off the land, over the yard or a house,
 * in the water) and that nobody has worked are laid again round the house; then every cleared plot's standing trees come down,
 * no log onto the pile. Returns what changed, for the test.
 */
export function settleStartingPlots(world) {
  const done = { laid: 0, trees: 0 };
  if (!world?.households || !world.map?.terrain || !world.map.sites) return done;
  for (const household of Object.values(world.households)) {
    if (!household?.site || household.choosingSite || !world.map.sites[household.homeSiteId] || !Array.isArray(household.members)) continue;
    const plot = firstPlot(world, household);
    if (plot && startingPlotOpen(world, household) && startingPlotWhy(world, household, plot)) {
      const point = findStartingPlot(world, household, startingAround(world, household));
      if (point) { moveStartingPlot(world, household, point); done.laid++; }
    }
    if (!countsTrees(woodsRule(world))) continue;
    // Cleared ground has no tree standing in it. The first ten acres' trees never stand again once worked (no `field` mark).
    for (const cleared of fieldPlots(household).map(one => one.id === FIRST_PLOT ? firstPlot(world, household) : one).filter(one => one?.state === 'cleared' && Number.isFinite(one.x))) {
      done.trees += cleared.id === FIRST_PLOT ? clearStartingTrees(world, household, cleared) : clearUnmarked(world, household, cleared);
    }
  }
  return done;
}
/** A cleared plot's trees still standing, down with no log and no mark: a plot cleared before had its timber felled onto the pile. */
function clearUnmarked(world, household, plot) {
  const felled = world.woods?.felled || {};
  const trees = (treesIn(squareOf(plot), woodsOptions(world)) || []).filter(tree => !felled[tree.id]);
  if (!trees.length) return 0;
  world.woods ||= { felled: {}, revision: 0 };
  for (const tree of trees) world.woods.felled[tree.id] = { by: household.id, minute: world.minute, kind: tree.kind, use: tree.use, logs: 0, left: 0 };
  world.woods.revision += 1;
  return trees.length;
}
