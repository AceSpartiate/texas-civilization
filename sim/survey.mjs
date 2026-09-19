// Survey: a family marks out ten acres of its own land, wherever it chooses.
//
// docs/LAND_GRANTS.md §4, build step 2. The owner's words (2026-09-13): "players should be able to clear any piece of
// land on their land ... and create more plots through an action called Survey"; and (2026-09-14) the fields "don't all
// have to be next to one another".
//
// A working member of the family, at home, is sent to survey a place the student picked on the family's holding. The
// server decides whether it can be: on the family's own land, not over another plot or one already being surveyed, not
// taking in the house yard or the field the family already works, not in the water, and not before the class has begun
// or before the house site is chosen. The person walks out over the family's own ground - at walking pace, slowed by
// timber and brush on the real land - paces and stakes it, and walks back. The plot then exists, staked and uncleared,
// and the story says what ground it is and where.
//
// A staked plot is cleared into the field a spell at a time, and fenced (§5, sim/fields.mjs, sim/improvements.mjs); the
// student chooses which plot on the map the same way. That the plot is ten acres, how long staking takes, and the words
// for where it lies are FIC-GONZ-025.
import { record } from './events.mjs';
import { distanceToPolyline } from './terrain.mjs';
import { COVER_PACE, landAround, onRealLand } from './ground.mjs';
import { holdingOf } from './grants.mjs';
import { choosing } from './homesite.mjs';
import { CLEARING_SPELLS, GROUNDS, PLOT_SIDE, clearingSpells, clearingTool, fenceWork, fenceWords, groundAt, keepPlots, overlaps, plotAt, plotsOf, squareOf } from './fields.mjs';
export { PLOT_ACRES, PLOT_SIDE, groundAt, plotsOf } from './fields.mjs';

/** A plot comes no nearer the house than this: the yard, the woodpile and the path to the door. */
export const YARD_MILES = 0.04;
/** Walking about one's own land, in miles a tick: the pace of the road on foot (sim/travel.mjs `WALK_SPEED`). */
const STROLL_MILES = 1;

const round = (value, places = 3) => { const fixed = +value.toFixed(places); return fixed === 0 ? 0 : fixed; };

/**
 * The river or creek a ten-acre square here would lie in, by name, or null: the water the class's own map draws, and
 * nothing it does not. A student is refused only for water they can see (found in the browser proof, 2026-09-14: the
 * first version counted every branch in the USGS data, most of which the map leaves off, and refused ground that looked
 * dry). A dry branch through a field was ploughed round or over. On the real land, ground at sea level is water too.
 * ceiling: the real-land map leaves off creeks under five miles (sim/colonies-region.mjs), so ten acres may be staked
 * across one; drawing every creek from the served colonies map is the way out for both.
 */
function waterIn(world, point) {
  const reach = PLOT_SIDE / 2;
  if (onRealLand(world)) {
    const land = landAround({ minX: point.x - 2, minY: point.y - 2, maxX: point.x + 2, maxY: point.y + 2 });
    const height = land.heightAt(point.x, point.y);
    if (!Number.isFinite(height) || height < 0.3) return 'the water';
  }
  // The invented map's rivers are drawn a quarter mile wide and its creeks a tenth; the real map's near their true width.
  const width = feature => onRealLand(world) ? (feature.kind === 'river' ? 0.03 : 0.01) : (feature.kind === 'river' ? 0.28 : 0.12);
  const course = world.map.terrain.find(feature => (feature.kind === 'river' || feature.kind === 'creek')
    && distanceToPolyline(point, feature.points) < reach + width(feature));
  return course ? course.name || (course.kind === 'river' ? 'the river' : 'the creek') : null;
}

const COMPASS = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'];
/** Where a place lies from the house, in words: "beside the house", "half a mile south-west of the house". */
export function whereFromHouse(world, household, point) {
  const home = world.map.sites[household.homeSiteId];
  const dx = point.x - home.x, dy = point.y - home.y, miles = Math.hypot(dx, dy);
  if (miles < 0.2) return 'beside the house';
  // y runs south on the map, so north is up.
  const bearing = (Math.atan2(dx, -dy) * 180 / Math.PI + 360) % 360;
  const way = COMPASS[Math.round(bearing / 45) % 8];
  const distance = miles < 0.375 ? 'a quarter mile' : miles < 0.75 ? 'half a mile' : miles < 1.25 ? 'a mile' : `${Math.round(miles * 2) / 2} miles`;
  return `${distance} ${way} of the house`;
}

/** Why a plot cannot be surveyed here, or null - checked before the person sets out and again when they stake it. */
export function plotRefusal(world, household, point, { ignoring = null } = {}) {
  if (!household) return 'No family to survey for.';
  if (world.status === 'lobby') return 'The family surveys its land once the class has begun.';
  if (choosing(household)) return 'Choose where the house will stand first.';
  if (!Number.isFinite(point?.x) || !Number.isFinite(point?.y)) return 'Choose a place on your land to survey.';
  const square = squareOf(point), bounds = holdingOf(world, household).bounds;
  if (square.minX < bounds.minX || square.maxX > bounds.maxX || square.minY < bounds.minY || square.maxY > bounds.maxY) {
    const centreInside = point.x >= bounds.minX && point.x <= bounds.maxX && point.y >= bounds.minY && point.y <= bounds.maxY;
    return centreInside ? 'Ten acres there would run over the line of your land.' : 'That is not your land.';
  }
  const home = world.map.sites[household.homeSiteId];
  if (home.x > square.minX - YARD_MILES && home.x < square.maxX + YARD_MILES && home.y > square.minY - YARD_MILES && home.y < square.maxY + YARD_MILES) return 'That would take in the house yard.';
  const under = plotsOf(world, household).find(plot => overlaps(squareOf(plot), square));
  if (under) return under.state === 'cleared' ? 'That runs over ground the family has already cleared.' : 'That runs over ground already staked out.';
  const surveying = household.members.map(id => world.entities[id]).filter(person => person && person !== ignoring && person.chore?.id === 'survey-plot' && person.chore.plot);
  if (surveying.some(person => overlaps(squareOf(person.chore.plot), square))) return `${surveying.find(person => overlaps(squareOf(person.chore.plot), square)).name} is already surveying there.`;
  const water = waterIn(world, point);
  if (water) return `That runs into ${water}.`;
  return null;
}

/** The work sent to a plot the family already has, and what each is called in a refusal. */
export const PLOT_JOBS = Object.freeze({ 'clear-plot': 'clears', 'fence-plot': 'fences' });

/**
 * Why this plot cannot be cleared or fenced now, or null: checked when the student looks, when the person is sent, and
 * by the work itself. `entity` is who would do it, when there is somebody (the tools are the household's).
 */
export function plotWorkRefusal(world, household, job, plot, { entity = null } = {}) {
  if (!household) return 'No family to work for.';
  if (world.status === 'lobby') return 'The family works its land once the class has begun.';
  if (choosing(household)) return 'Choose where the house will stand first.';
  if (!plot) return job === 'clear-plot' ? 'Choose one of your staked plots.' : 'Choose one of your cleared plots.';
  if (job === 'clear-plot') {
    if (plot.state === 'cleared') return 'That ground is already cleared.';
    const tool = clearingTool(plot);
    if (tool === 'axe' && household.tools?.axe === undefined) return 'Ten acres of timber want a felling axe, and there is none in the house.';
    if (tool === 'hoe' && household.tools?.hoe === undefined) return 'There is no hoe in the house.';
    if (tool === 'hoe' && household.tools.hoe >= TOOL_LIFE) return 'The hoe is worn out and wants mending.';
    return null;
  }
  if (job === 'fence-plot') {
    if (plot.state !== 'cleared') return 'Clear that ground before it is fenced.';
    if (plot.fence === 'sound') return 'That plot is already fenced.';
    const fencer = household.members.map(id => world.entities[id]).find(person => person && person !== entity && person.chore?.id === 'fence-plot' && person.chore.plotId === plot.id);
    if (fencer) return `${fencer.name} is already fencing that plot.`;
    return null;
  }
  return 'No such work.';
}
/** A hoe gives this many jobs before it wants mending (sim/chores.mjs `TOOL_LIFE`, restated to keep the import one way). */
const TOOL_LIFE = 5;

/** What a plot is, in words, for the family choosing it: its ground, where it lies, and how far the clearing has got. */
export function plotWords(world, household, plot) {
  const what = `Ten acres of ${plot.ground} ${whereFromHouse(world, household, plot)}`;
  // A plot still to fence says how its fence would go up, and how long it would take (sim/fields.mjs `fenceWork`).
  if (plot.state === 'cleared') return `${what}, cleared${plot.fence === 'sound' ? ' and fenced' : plot.fence === 'ruined' ? ', the rails pulled down' : ', with no fence'}.${plot.fence === 'sound' ? '' : ` ${fenceWords(fenceWork(world, household, plot))}`}`;
  const spells = clearingSpells(plot), done = plot.work || 0;
  return `${what}, staked. ${done ? `${done} of ${spells}` : spells} spells of clearing${done ? ' done' : ''}${plot.ground === 'timber' ? ', felling timber with the axe' : ', with the hoe'}.`;
}

/**
 * What the family would be doing here, for the student looking before anybody is sent: surveying new ground (no `job`),
 * or clearing or fencing the plot under the point.
 */
export function plotFacts(world, household, point, job = null) {
  if (job && PLOT_JOBS[job]) {
    const plot = plotAt(world, household, point);
    const why = plotWorkRefusal(world, household, job, plot);
    return why ? { can: false, why, ...(plot && { plotId: plot.id, words: plotWords(world, household, plot) }) } : { can: true, plotId: plot.id, words: plotWords(world, household, plot) };
  }
  const why = plotRefusal(world, household, point);
  if (why) return { can: false, why };
  const ground = groundAt(world, point);
  return { can: true, ground, spells: CLEARING_SPELLS[ground], words: `Ten acres of ${ground} ${whereFromHouse(world, household, point)}.` };
}

/** The cleared plots in the order a person walks them from the house: nearest first, then the nearest to that. */
function fieldRound(world, household) {
  const left = plotsOf(world, household).filter(plot => plot.state === 'cleared');
  const order = [];
  let at = world.map.sites[household.homeSiteId];
  while (left.length) {
    const next = left.reduce((best, plot) => Math.hypot(plot.x - at.x, plot.y - at.y) < Math.hypot(best.x - at.x, best.y - at.y) ? plot : best);
    order.push(next); left.splice(left.indexOf(next), 1); at = next;
  }
  return order;
}

/** Where a person walking about their own land is headed, this step: a plot, the next of the fields, or the yard. */
export function strollTarget(world, household, entity, towards) {
  if (towards === 'plot') return entity.chore?.plot || null;
  if (towards === 'ground') return entity.chore?.ground || null;
  if (towards === 'fields') {
    const next = fieldRound(world, household)[entity.chore?.visited || 0];
    return next ? { x: next.x, y: next.y } : null;
  }
  const home = world.map.sites[household.homeSiteId];
  return { x: round(home.x - .025), y: round(home.y + .035) };
}
/** Whether a round of the fields has another plot to walk to after the one just reached. */
export const moreFields = (world, household, entity) => (entity.chore?.visited || 0) + 1 < fieldRound(world, household).length;

/**
 * One tick's walk about the family's own land: towards the place, at walking pace, slower through timber and brush on the
 * real land. The person never leaves home (`siteId` stays), because they never leave their own land. Returns true on arrival.
 */
export function stroll(world, household, entity, target) {
  const here = entity.location, dx = target.x - here.x, dy = target.y - here.y, left = Math.hypot(dx, dy);
  const ground = onRealLand(world) ? groundAt(world, here) : 'prairie';
  const step = STROLL_MILES / (COVER_PACE.foot[ground === 'prairie' ? 'open' : ground] || 1);
  if (left <= step) {
    entity.location = { x: target.x, y: target.y, siteId: household.homeSiteId };
    entity.exertion = Math.round(((entity.exertion || 0) + left) * 10000) / 10000;
    return true;
  }
  entity.location = { x: round(here.x + dx * step / left, 4), y: round(here.y + dy * step / left, 4), siteId: household.homeSiteId };
  entity.exertion = Math.round(((entity.exertion || 0) + step) * 10000) / 10000;
  return false;
}

/** The stakes go in: the plot exists, staked and uncleared, unless somebody took the ground while this person walked out. */
export function stakePlot(world, household, entity) {
  const point = entity.chore?.plot;
  const why = plotRefusal(world, household, point, { ignoring: entity });
  if (why) {
    record(world, 'consequence', { actorId: entity.id, householdId: household.id, text: `${entity.name} came to stake the ground and could not: ${why.charAt(0).toLowerCase()}${why.slice(1)}` });
    return;
  }
  const ground = groundAt(world, point);
  // Written after the family's old field, when it has one it has never changed: staking must not wipe out the first patch.
  const plots = keepPlots(world, household);
  const number = plots.reduce((most, plot) => Math.max(most, Number(plot.id.slice(5))), 0) + 1;
  plots.push({ id: `plot-${number}`, x: round(point.x), y: round(point.y), ground, state: 'staked' });
  record(world, 'improvement', { actorId: entity.id, householdId: household.id, importance: 2, claimId: 'FIC-GONZ-025', text: `${entity.name} staked out ten acres of ${ground} ${whereFromHouse(world, household, point)}.` });
}

/** For the family's own land line: every plot, its old field read as plots when it has never changed one. */
export const plotProjection = (world, household) => ({ plots: plotsOf(world, household).map(plot => ({ ...plot, ...(plot.state === 'staked' && { spells: clearingSpells(plot) }) })) });

/** Stored plots are ten-acre squares on the family's own land that do not overlap. */
export function plotsInvalid(world, household) {
  if (household.plots === undefined) return null;
  if (!Array.isArray(household.plots)) return 'Invalid plots';
  const ids = new Set();
  for (const [index, plot] of household.plots.entries()) {
    if (!/^plot-\d+$/.test(plot?.id) || ids.has(plot.id) || !Number.isFinite(plot.x) || !Number.isFinite(plot.y) || !GROUNDS.includes(plot.ground) || !['staked', 'cleared'].includes(plot.state)) return 'Invalid plot';
    // Clearing work is counted only on staked ground, and short of finishing it; rails and seed only on cleared ground.
    if (plot.work !== undefined && (plot.state !== 'staked' || !Number.isInteger(plot.work) || plot.work < 1 || plot.work >= clearingSpells(plot))) return 'Invalid clearing';
    if (plot.fence !== undefined && (plot.state !== 'cleared' || !['sound', 'ruined'].includes(plot.fence))) return 'Invalid plot fence';
    if (plot.sown !== undefined && (plot.state !== 'cleared' || plot.sown !== true)) return 'Invalid sowing';
    ids.add(plot.id);
    if (household.plots.slice(0, index).some(other => overlaps(squareOf(other), squareOf(plot)))) return 'Plots overlap';
  }
  return null;
}
