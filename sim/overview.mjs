// The teacher's view of the whole class: every person where they truly are, and every family's land as it truly stands.
//
// Owner, 2026-09-16: "On the Class View, the teacher should be able to see everything and everyone. I as the teacher should be
// able to zoom in and see what's happening at anyone's farm, any town, all of it. Sure, players are limited by fog of war, but
// the teacher shouldn't be."
//
// A student's projection is filtered to what the family could plausibly know (VISION.md §4, `observedBy`, `seenLand`), and
// nothing here changes it: this is read only for `role === 'host'` (sim/world.mjs `projectWorld`). What the Host is still
// never sent, and why:
//   - glory and the participation record (sim/glory.mjs, sim/ending.mjs): hidden from every screen until the class ends;
//   - hidden strength, health and housework (`traits`, docs/FAMILY_CREATION.md): never on any wire;
//   - what a rider carries (`report`), a store's purse, a chore's open question and its prices: the family's business, and
//     nothing the map draws;
//   - any household's private story or knowledge: the Host's reports stay the public ones.
// It is the map's facts only: who stands where doing what, and what each family has made of its land. Everything is picked
// field by field rather than copied and trimmed, so a field added to an entity or a household later reaches the Host only by
// being named here.
import { ageBand, householdName } from './family.mjs';
import { interiorProjection } from './interior.mjs';
import { facingOf } from './encounters.mjs';
import { holdingOf } from './grants.mjs';
import { laneState } from './homesite.mjs';
import { landView, pieced } from './houses.mjs';
import { plotProjection } from './survey.mjs';

/**
 * How much of a journey's road rides along, in miles either side of where the traveller is.
 *
 * A student is sent the whole road of each of its own few people; the Host would be sent the whole road of everybody on one,
 * and a rider's road across the colonies is hundreds of points. The page needs the road only to draw a walker moving along
 * it between two ticks, and nobody goes further than a rider's 7.8 miles an hour times a twenty-minute tick (2.6 miles), so a
 * window that reaches past that either way loses nothing that is drawn.
 * ceiling: a traveller put further along than this in one step (a compressed-time jump) is drawn jumping to where they are
 * rather than sliding there; sending the whole road again is the way out if a teacher ever notices.
 */
export const ROAD_WINDOW_MILES = 3;

/** The stretch of a road within `ROAD_WINDOW_MILES` of `progress`, and how far along the road it begins. */
export function roadWindow(points, progress) {
  if (!Array.isArray(points) || points.length < 2) return { points: points || [], base: 0 };
  const from = Math.max(0, progress - ROAD_WINDOW_MILES), to = progress + ROAD_WINDOW_MILES;
  const kept = [];
  let walked = 0, base = null, lastStart = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i], start = walked;
    walked += Math.hypot(b.x - a.x, b.y - a.y);
    lastStart = start;
    if (walked < from) continue;
    if (start > to) break;
    if (base === null) { base = start; kept.push(a); }
    kept.push(b);
  }
  // Past the end of the road (it can be, by a rounding): the last stretch of it.
  return base === null ? { points: points.slice(-2), base: lastStart } : { points: kept, base };
}

const round = value => Math.round(value * 1e4) / 1e4;

/** One person, animal or wagon as the Host's map draws it. */
function overviewEntity(world, entity) {
  const travel = entity.travel ? (() => {
    const window = roadWindow(entity.travel.points, entity.travel.progress);
    return { from: entity.travel.from, to: entity.travel.to, points: window.points.map(p => ({ x: round(p.x), y: round(p.y) })), base: round(window.base), progress: round(entity.travel.progress), distance: round(entity.travel.distance), ...(entity.travel.mode && { mode: entity.travel.mode }) };
  })() : null;
  return {
    id: entity.id, name: entity.name, kind: entity.kind,
    // The family's name is on its land (`lands[householdId].name`), once, rather than on every one of its people and beasts.
    ...(entity.householdId && { householdId: entity.householdId }),
    ...(entity.principal && { principal: true }),
    ...(entity.sex && { sex: entity.sex }), ...(Number.isFinite(entity.age) && { band: ageBand(entity.age) }),
    ...(entity.species && { species: entity.species }), ...(entity.laden && { laden: true }),
    ...(entity.resident && { resident: entity.resident }), ...(entity.about && { about: entity.about }),
    // A rider is a rider; what they carry stays on the server, exactly as a student is shown one (sim/town.mjs `observedBy`).
    ...(entity.courier || entity.report ? { carrier: true, ...facingOf(world, entity) } : {}),
    location: { x: round(entity.location.x), y: round(entity.location.y), siteId: entity.location.siteId },
    ...(travel && { travel }),
    task: entity.task,
    // What they are doing, in the chore's own words, and where the server put what the page draws beside them. Never the
    // question a chore is asking the family, or its prices.
    ...(entity.chore && { chore: { id: entity.chore.id, doing: entity.chore.doing, ...(entity.chore.quarry && { quarry: entity.chore.quarry }), ...(entity.chore.id === 'survey-plot' && entity.chore.plot && { plot: entity.chore.plot }) } }),
    condition: entity.health?.condition || entity.condition || 'well',
    ...(world.army?.members?.includes(entity.id) && { withArmy: true }),
  };
}

/** One family's land as it truly stands: what the family's own map draws, for every family. */
function overviewLand(world, household) {
  const lane = household.site ? laneState(world, household) : null;
  const logs = household.logs ? household.logs.wall + household.logs.sill + household.logs.poor : 0;
  return {
    name: householdName(world, household),
    homeSiteId: household.homeSiteId,
    // Inside the house, read only (sim/interior.mjs): the teacher sees every family's rooms as the family has set them.
    interior: interiorProjection(household),
    view: landView(household),
    ...(pieced(household) && { pieces: household.house.pieces.map(p => [p.type, p.x, p.y, p.stage, p.progress]) }),
    grant: holdingOf(world, household).bounds,
    ...(lane && { lane: { miles: lane.miles, cut: lane.cut } }),
    plots: plotProjection(world, household).plots.map(plot => ({ id: plot.id, x: plot.x, y: plot.y, state: plot.state, ...(plot.work && { work: plot.work }), ...(plot.spells && { spells: plot.spells }), ...(plot.fence && { fence: plot.fence }), ...(plot.sown && { sown: true }) })),
    ...(household.field && { field: { crop: household.field.crop, state: household.field.state } }),
    ...(logs && { logs }),
    ...(household.stock && { stock: true }),
    ...(household.arriving && { arriving: true }),
  };
}

/**
 * Everything the Host's map draws. Only ever for the Host.
 *
 * ceiling: the whole class goes to the Host on every snapshot, whatever the teacher is looking at - measured at 87 KB a
 * snapshot on average and 118 KB at worst (the arrival, everybody on the road) for thirty families on the real land, about
 * 260 bytes a figure (docs/evidence/host-view.json). That is one client beside thirty students sent about 740 KB between
 * them on the same tick, and at the Study pace about 9 KB a second on the LAN. Sending only what is inside the teacher's
 * camera, or the unchanging names and descriptions once rather than every tick, is the way out if a classroom network ever
 * shows it.
 */
export function hostOverview(world) {
  return {
    everyone: Object.values(world.entities).filter(entity => entity.location).map(entity => overviewEntity(world, entity)),
    lands: Object.fromEntries(Object.values(world.households).map(household => [household.id, overviewLand(world, household)])),
    ...(world.army && { army: { phase: world.army.phase, x: round(world.army.x), y: round(world.army.y), strength: world.army.members.length, ...(world.army.camp && { camp: world.army.camp }) } }),
  };
}
