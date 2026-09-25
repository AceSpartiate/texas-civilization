// Where the house stands: chosen by the family when it reaches its land, on the real land only.
//
// docs/LAND_GRANTS.md §8.2 and §8.3 step 4. The owner's words (2026-09-13): the family chooses where its house stands
// **on arrival**, and "if they choose to put their house further back in their property, that might influence
// communication because it'd mean a longer way towards the road from their farm."
//
// So a new class on the real land has every family's wagon come in to the surveyor's mark - the point its grant was laid
// out round - and wait there. The family looks over its own holding (sim/ground.mjs `siteFacts`: the ground, the height
// above the water, how far to water that runs all year, how far to timber, whether the river comes over it) and chooses.
// Then the lane is laid from the road to that spot over the easiest ground, the family draws the wagon over to it, and
// everything that comes to the family after - riders with news, neighbours, a trader - comes up that lane, because the
// lane is the family's route on the map and every journey follows routes. Nothing about news is special-cased: a house
// set far back is further by road, so word takes longer.
//
// Water: a house further than `WATER_CARRY_MILES` from water that runs all year is a house somebody carries water to, and
// the heavy work of the place goes slower until the family digs a well, which is deeper the higher the house stands above
// the water. Every number is `FIC-GONZ-026`; that wells were dug at a moderate depth is `HIST-GONZ-041`.
//
// The invented Gonzales country, and every class saved before, have no choosing: the house stands where it always did.
import { record } from './events.mjs';
import { polylineLength } from './geography.mjs';
import { groundAlong, layLane, paceOf, siteFacts, siteWords, WATER_CARRY_MILES } from './ground.mjs';
import { holdingOf } from './grants.mjs';
import { WAGON_SPEED } from './travel.mjs';
import { drawnVehicles, setOut } from './company.mjs';
import { woodsRule } from './woods.mjs';

/** How much longer the heavy work of a place goes, per mile past carrying distance that water is fetched from (FIC-GONZ-026). */
export const WATER_BURDEN_PER_MILE = 0.6;
/** The most carrying water slows the heavy work, however far it is (FIC-GONZ-026). */
export const WATER_BURDEN_MOST = 1.5;
/** Where there is no water that runs all year within reach, the family carries it this far. */
const FARTHEST_WATER = 3;
/** Digging a well: ticks of work before the first foot, and per metre of depth (FIC-GONZ-026). */
export const WELL_TICKS = Object.freeze({ base: 6, perMetre: 2 });
/** A well goes this far below the level of the nearest water (HIST-GONZ-041: "a moderate depth"; the number FIC-GONZ-026). */
export const WELL_BELOW_WATER_METRES = 3;

const round = (value, places = 2) => { const fixed = +value.toFixed(places); return fixed === 0 ? 0 : fixed; };

/** The track in to this family's home: the lane from the road. */
export const laneOf = (world, household) => Object.values(world.map.routes).find(route => route.to === household.homeSiteId);

/** The family has reached its land and not yet said where the house goes. */
export const choosing = household => household.choosingSite === true;

/** Why this family cannot choose a site now (without looking at where), or null. */
export function chooseRefusal(world, household) {
  if (!household) return 'No family to decide for.';
  if (!choosing(household)) return household.site ? 'The house site is chosen.' : 'Your house stands where it stands.';
  if (world.status === 'lobby') return 'The family chooses where its house stands when it reaches its land.';
  if (household.arriving) return 'The wagon has not reached the land yet.';
  return null;
}

/**
 * What a spot on this family's own holding is like to build on, and the lane it would have, for the family choosing.
 * Refuses anything that is not the family's to look at. The lane is laid for real, so what is shown is what is built.
 */
export function siteFactsFor(world, household, point) {
  return examine(world, household, point).facts;
}

function examine(world, household, point) {
  const why = chooseRefusal(world, household);
  if (why) return { facts: { can: false, why } };
  const rule = woodsRule(world);
  const facts = siteFacts(point, holdingOf(world, household).bounds, rule);
  if (!facts.can) return { facts };
  const road = world.map.sites[laneOf(world, household)?.from];
  const lane = road && layLane(road, point, rule);
  if (!lane) return { facts: { ...facts, can: false, why: 'No wagon can be brought to that spot.' } };
  const laneMiles = round(polylineLength(lane));
  return { facts: { ...facts, laneMiles, words: siteWords(facts, laneMiles) }, lane };
}

/**
 * The family says where the house stands. The home moves there, the lane is laid to it, the field goes beside it, and the
 * family - and anybody of it on the way home - brings the wagon over.
 */
export function chooseSite(world, household, point) {
  const x = round(Number(point?.x)), y = round(Number(point?.y));
  const { facts, lane } = examine(world, household, { x, y });
  if (!facts.can) throw new Error(facts.why);
  const home = world.map.sites[household.homeSiteId];
  const mark = { x: home.x, y: home.y };
  const route = laneOf(world, household);
  route.points = lane;
  route.ground = groundAlong(lane, null, woodsRule(world));
  // Marked out, not cut: the family cuts it (owner, 2026-09-14), from the house outward.
  route.cut = 0;
  home.x = x; home.y = y;
  // The field is laid out beside the house, as it was beside the mark.
  const field = world.map.terrain.find(feature => feature.kind === 'field' && feature.ownerHouseholdId === household.id);
  if (field) field.points = field.points.map(p => ({ x: round(p.x + x - mark.x), y: round(p.y + y - mark.y) }));
  household.mark = mark;
  const { can, words, ...kept } = facts;
  household.site = kept;
  delete household.choosingSite;
  // Every client refetches the homesteads (server/app.mjs `mapId`).
  world.map.revision = (world.map.revision || 0) + 1;

  // Over to the site with the wagon, at the wagon's pace, by the easiest ground from the mark.
  const overLane = layLane(mark, { x, y }, woodsRule(world));
  const over = overLane?.length >= 2 ? overLane : [mark, { x, y }];
  const overGround = groundAlong(over, null, woodsRule(world));
  const overMiles = polylineLength(over);
  // A house set down on the mark itself moves nobody: there is no way over to walk (found in the browser proof, 2026-09-14,
  // where a journey of no length was refused as invalid).
  const nowhere = overMiles < 0.005;
  const causeId = record(world, 'site-chosen', { householdId: household.id, importance: 2, claimId: 'FIC-GONZ-026', text: `The family has chosen where the house will stand. ${words}` });
  let moving = false;
  for (const id of [...household.members, ...household.property]) {
    const entity = world.entities[id];
    if (!entity) continue;
    if (nowhere) continue;
    if (!entity.travel && entity.location.siteId === household.homeSiteId) {
      // Whatever was in hand at the mark is left: the family is moving its camp.
      // ceiling: the chore goes but the 'work' it set stays, and rides `settle` to the new camp, so whoever was mid-chore -
      // a child under ten at one of their own works included - counts afterwards as a hand in `advanceRoutine` until their
      // next order (`FIC-GONZ-313`). `abandonChore` would put them to rest instead, but that changes the move for grown
      // hands too, which is a balance decision; do it when the owner wants the move to cost the afternoon's work.
      if (entity.chore) { entity.chore = null; }
      const settle = { x: round(x + entity.location.x - mark.x), y: round(y + entity.location.y - mark.y), ...(entity.kind === 'person' && { task: entity.task === 'travel' ? 'rest' : entity.task }) };
      const pace = paceOf(over, overGround, 'wagon');
      entity.travel = { from: household.homeSiteId, to: household.homeSiteId, points: over.map(p => ({ ...p })), progress: 0, distance: overMiles, speed: WAGON_SPEED, mode: 'wagon', purpose: 'arrive', silent: true, settle, ...(pace.length && { pace }), causeId };
      entity.location = { ...over[0], siteId: null };
      if (entity.kind === 'person') entity.task = 'travel';
      moving = true;
    } else if (entity.travel && entity.travel.to === household.homeSiteId && entity.travel.purpose !== 'arrive') {
      // Somebody on the way home goes on past the mark to where home is now.
      const travel = entity.travel, offset = travel.points.length - 1;
      travel.points = [...travel.points, ...over.slice(1).map(p => ({ ...p }))];
      const more = paceOf(over, overGround, travel.mode || 'foot').map(([segment, factor]) => [segment + offset, factor]);
      if (more.length) travel.pace = [...(travel.pace || []), ...more];
      travel.distance += overMiles;
    }
  }
  if (moving) household.arriving = true;
  // The camp moved as the family came in: the youngest in the wagons, the rest beside them, at the pace of the slowest (sim/company.mjs),
  // in a class made since the means were rolled.
  if (moving && world.meansRoll) {
    const movers = [...household.members, ...household.property].map(id => world.entities[id]).filter(entity => entity?.travel?.causeId === causeId && entity.travel.purpose === 'arrive');
    setOut(movers, drawnVehicles(movers), entity => entity.travel);
  }
}

/** How much longer heavy work at home takes while water is carried from far off. 1 with a well, or water near. */
export function waterBurden(household) {
  const site = household?.site;
  if (!site?.needsWell || household.well) return 1;
  const miles = Number.isFinite(site.waterMiles) ? site.waterMiles : FARTHEST_WATER;
  return round(Math.min(WATER_BURDEN_MOST, 1 + Math.max(0, miles - WATER_CARRY_MILES) * WATER_BURDEN_PER_MILE));
}

/** How many ticks of work the family's well takes, before skill and strength. */
export function wellTicks(household) {
  const metres = (household.site?.aboveFeet ?? 0) / 3.28084 + WELL_BELOW_WATER_METRES;
  return Math.round(WELL_TICKS.base + metres * WELL_TICKS.perMetre);
}

/** Why the family cannot dig a well, or null. */
export function wellRefusal(household) {
  if (choosing(household)) return 'Choose where the house will stand first.';
  if (!household.site) return 'There is water enough here.';
  if (household.well) return 'The well is dug.';
  if (!household.site.needsWell) return 'Running water is close enough to carry.';
  return null;
}

/** The well is dug. */
export function digWell(world, household, entity) {
  // Two people at it strike the same water once.
  if (household.well) return;
  household.well = true;
  record(world, 'improvement', { actorId: entity.id, householdId: household.id, importance: 2, claimId: 'FIC-GONZ-026', text: `${entity.name} struck water. The family has a well, and carries water no further than the yard.` });
}

// ---------------------------------------------------------------- cutting the lane
//
// The owner (2026-09-14): the family cuts its own lane, as work. The route is marked when the site is chosen; until it is
// cut, going over it is as slow as the open country it crosses - its timber and brush count in full (sim/ground.mjs). Cut
// from the house outward, a stretch a spell, and a cut stretch has had its timber and brush taken out of the way, though
// its climbs and its creeks are still there. Every number FIC-GONZ-026.

/** Ticks of one person's work to cut a mile of lane, by what it runs through (FIC-GONZ-026). */
export const LANE_TICKS_PER_MILE = Object.freeze({ open: 6, timber: 60, brush: 30 });
/** However far the cutting has got, the person doing it is drawn no further than this from the house. */
const WORKED_IN_SIGHT_MILES = 0.35;

const segmentsOf = points => points.slice(1).map((b, i) => Math.hypot(b.x - points[i].x, b.y - points[i].y));

/** The family's own lane, how long it is and how much of it is cut; null where there is none to cut. */
export function laneState(world, household) {
  if (!household?.site) return null;
  const route = laneOf(world, household);
  if (!route?.ground || !Number.isFinite(route.cut)) return null;
  const miles = polylineLength(route.points);
  // Nothing left, to the hundredth of a mile, is a lane cut to the road: rounded apart, a lane within 26 ft of the road read
  // as nothing left and yet a hundredth short of cut (found when Brazoria's map point moved, 2026-09-16).
  const left = round(Math.max(0, miles - route.cut));
  return { route, miles: round(miles), cut: left === 0 ? round(miles) : round(Math.min(miles, route.cut)), left };
}

/** What lies at the uncut end of the lane, as shares of timber and brush over the stretch being cut. */
function frontGround(route) {
  const lengths = segmentsOf(route.points), total = lengths.reduce((sum, length) => sum + length, 0);
  let fromHouse = 0;
  for (let i = lengths.length - 1; i >= 0; i--) {
    fromHouse += lengths[i];
    if (fromHouse > route.cut) return route.ground[i];
  }
  return route.ground[0] || [0, 0, 0, 0, 0];
}

/** Why the family cannot cut its lane, or null. */
export function laneRefusal(world, household) {
  if (choosing(household)) return 'Choose where the house will stand first.';
  const lane = laneState(world, household);
  if (!lane) return 'There is no lane of your own to cut.';
  if (lane.left <= 0) return 'The lane is cut.';
  const timberAhead = lane.route.ground.some(([, timber]) => timber > 0);
  if (timberAhead && household.tools?.axe === undefined) return 'The lane runs through timber, and there is no felling axe in the house.';
  return null;
}

/** One spell of cutting. Returns true once the whole lane is cut. */
export function cutLaneSpell(world, household, entity, ticks) {
  const lane = laneState(world, household);
  if (!lane || lane.left <= 0) return true;
  const [, timber, brush] = frontGround(lane.route);
  const perMile = LANE_TICKS_PER_MILE.open + timber * (LANE_TICKS_PER_MILE.timber - LANE_TICKS_PER_MILE.open) + brush * (LANE_TICKS_PER_MILE.brush - LANE_TICKS_PER_MILE.open);
  // Measured against the lane's own length, not its rounding: a lane cut to within a hundredth of a mile of a rounded-up
  // length read as nothing left, stopped, and never said it was done (found when Brazoria's map point moved, 2026-09-16).
  const whole = polylineLength(lane.route.points);
  lane.route.cut = round(Math.min(whole, lane.route.cut + ticks / perMile), 4);
  if (round(Math.max(0, whole - lane.route.cut)) > 0) return false;
  record(world, 'improvement', { actorId: entity.id, householdId: household.id, importance: 2, claimId: 'FIC-GONZ-026', text: `The lane is cut all the way to the road, ${lane.miles} miles of it. A wagon can come and go without fighting the brush.` });
  return true;
}

/** Where along the lane the cutting has got to, for drawing the person at work: never further out than in sight of the house. */
export function lanePoint(world, household) {
  const lane = laneState(world, household);
  if (!lane) return null;
  const points = lane.route.points, lengths = segmentsOf(points);
  let wanted = Math.min(lane.cut, WORKED_IN_SIGHT_MILES);
  for (let i = lengths.length - 1; i >= 0; i--) {
    if (wanted <= lengths[i]) {
      const f = lengths[i] ? wanted / lengths[i] : 0, a = points[i + 1], b = points[i];
      return { x: round(a.x + (b.x - a.x) * f), y: round(a.y + (b.y - a.y) * f) };
    }
    wanted -= lengths[i];
  }
  return { ...points[0] };
}

/** For the family's own land line: whether it is choosing, what its site is, and what water costs it. */
export function siteProjection(world, household) {
  if (choosing(household)) return { choosingSite: { can: !chooseRefusal(world, household), ...(chooseRefusal(world, household) && { why: chooseRefusal(world, household) }), mark: household.mark || { x: world.map.sites[household.homeSiteId].x, y: world.map.sites[household.homeSiteId].y } } };
  if (!household.site) return {};
  const lane = laneState(world, household);
  return { site: { ...household.site, ...(household.well && { well: true }), burden: waterBurden(household) }, ...(lane && { lane: { miles: lane.miles, cut: lane.cut } }) };
}

/** A stored site is a real one where the house is; the markers are `true` or absent. */
export function siteInvalid(world, household) {
  if (household.choosingSite !== undefined && household.choosingSite !== true) return 'Invalid site marker';
  if (household.well !== undefined && household.well !== true) return 'Invalid well';
  if (household.mark !== undefined && (!Number.isFinite(household.mark?.x) || !Number.isFinite(household.mark?.y))) return 'Invalid surveyor\'s mark';
  if (household.site !== undefined) {
    const site = household.site;
    if (typeof site !== 'object' || !['open', 'timber', 'brush'].includes(site.ground) || typeof site.needsWell !== 'boolean' || typeof site.bottom !== 'boolean') return 'Invalid house site';
    if (household.choosingSite) return 'A family cannot have chosen a site and still be choosing';
  }
  if (household.well && !household.site?.needsWell) return 'A well where none was needed';
  return null;
}
