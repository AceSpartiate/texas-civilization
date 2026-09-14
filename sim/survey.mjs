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
// What a staked plot is for comes next (§5, clearing and the field). Until then it is a claim marked on the family's own
// map. That the plot is ten acres, how long staking takes, and the words for where it lies are FIC-GONZ-025.
import { record } from './events.mjs';
import { distanceToPolyline } from './terrain.mjs';
import { COVER_PACE, landAround, onRealLand } from './ground.mjs';
import { holdingOf } from './grants.mjs';
import { choosing } from './homesite.mjs';

export const PLOT_ACRES = 10;
/** About an eighth of a mile a side. */
export const PLOT_SIDE = Math.sqrt(PLOT_ACRES / 640);
/** A plot comes no nearer the house than this: the yard, the woodpile and the path to the door. */
export const YARD_MILES = 0.04;
/** Walking about one's own land, in miles a tick: the pace of the road on foot (sim/travel.mjs `WALK_SPEED`). */
const STROLL_MILES = 1;

const round = (value, places = 3) => { const fixed = +value.toFixed(places); return fixed === 0 ? 0 : fixed; };
const squareOf = point => ({ minX: point.x - PLOT_SIDE / 2, minY: point.y - PLOT_SIDE / 2, maxX: point.x + PLOT_SIDE / 2, maxY: point.y + PLOT_SIDE / 2 });
const overlaps = (a, b) => a.minX < b.maxX && b.minX < a.maxX && a.minY < b.maxY && b.minY < a.maxY;

/** The plots a family has staked (and, from §5, cleared). A class saved before Survey has none. */
export const plotsOf = household => household.plots || [];

/** What ground a place is: timber, brush or prairie, from the map the class is played on. */
export function groundAt(world, point) {
  if (onRealLand(world)) {
    const cover = landAround({ minX: point.x - 2, minY: point.y - 2, maxX: point.x + 2, maxY: point.y + 2 }).coverAt(point);
    return cover === 'open' ? 'prairie' : cover;
  }
  // The invented country: timber along the water (HIST-GONZ-012), as its map draws it; open prairie between.
  const water = world.map.terrain.filter(feature => feature.kind === 'river' || feature.kind === 'creek');
  return water.some(course => distanceToPolyline(point, course.points) < 1.15) ? 'timber' : 'prairie';
}

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
  if (plotsOf(household).some(plot => overlaps(squareOf(plot), square))) return 'That runs over ground already staked out.';
  const surveying = household.members.map(id => world.entities[id]).filter(person => person && person !== ignoring && person.chore?.plot);
  if (surveying.some(person => overlaps(squareOf(person.chore.plot), square))) return `${surveying.find(person => overlaps(squareOf(person.chore.plot), square)).name} is already surveying there.`;
  const home = world.map.sites[household.homeSiteId];
  if (home.x > square.minX - YARD_MILES && home.x < square.maxX + YARD_MILES && home.y > square.minY - YARD_MILES && home.y < square.maxY + YARD_MILES) return 'That would take in the house yard.';
  const field = world.map.terrain.find(feature => feature.kind === 'field' && feature.ownerHouseholdId === household.id);
  if (field) {
    const xs = field.points.map(p => p.x), ys = field.points.map(p => p.y);
    if (overlaps(square, { minX: Math.min(...xs), minY: Math.min(...ys), maxX: Math.max(...xs), maxY: Math.max(...ys) })) return 'That is ground the field already has.';
  }
  const water = waterIn(world, point);
  if (water) return `That runs into ${water}.`;
  return null;
}

/** What surveying here would stake out, for the family looking before it sends anybody. */
export function plotFacts(world, household, point) {
  const why = plotRefusal(world, household, point);
  if (why) return { can: false, why };
  const ground = groundAt(world, point);
  return { can: true, ground, words: `Ten acres of ${ground} ${whereFromHouse(world, household, point)}.` };
}

/** Where a person walking out to survey is headed, this step. */
export function strollTarget(world, household, entity, towards) {
  if (towards === 'plot') return entity.chore?.plot || null;
  const home = world.map.sites[household.homeSiteId];
  return { x: round(home.x - .025), y: round(home.y + .035) };
}

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
  const number = plotsOf(household).reduce((most, plot) => Math.max(most, Number(plot.id.slice(5))), 0) + 1;
  household.plots = [...plotsOf(household), { id: `plot-${number}`, x: round(point.x), y: round(point.y), ground, state: 'staked' }];
  record(world, 'improvement', { actorId: entity.id, householdId: household.id, importance: 2, claimId: 'FIC-GONZ-025', text: `${entity.name} staked out ten acres of ${ground} ${whereFromHouse(world, household, point)}.` });
}

/** For the family's own land line. */
export const plotProjection = household => household.plots ? { plots: household.plots.map(plot => ({ ...plot })) } : {};

/** Stored plots are ten-acre squares on the family's own land that do not overlap. */
export function plotsInvalid(world, household) {
  if (household.plots === undefined) return null;
  if (!Array.isArray(household.plots)) return 'Invalid plots';
  const ids = new Set();
  for (const [index, plot] of household.plots.entries()) {
    if (!/^plot-\d+$/.test(plot?.id) || ids.has(plot.id) || !Number.isFinite(plot.x) || !Number.isFinite(plot.y) || !['timber', 'brush', 'prairie'].includes(plot.ground) || !['staked', 'cleared'].includes(plot.state)) return 'Invalid plot';
    ids.add(plot.id);
    if (household.plots.slice(0, index).some(other => overlaps(squareOf(other), squareOf(plot)))) return 'Plots overlap';
  }
  return null;
}
