// Where each of a family's people stands inside the Alamo, and how they get there on their own legs (docs/BATTLES.md §9;
// docs/battle-research/staging.md §5.1, §5.6 "Posts on the walls"; `FIC-GONZ-430`).
//
// Until 2026-09-25 everybody shut in stood at a hashed spot on the main plaza (the old `postOf`), set down there in one
// update, and nobody was on a wall. Now a fighter has a **post on the walls** - the north wall and its battery, the west
// wall, the south-west battery with the 18-pounder, the low barrack by the gate, the palisade, the gun platform at the back
// of the church, or the long barrack - chosen by a seeded share weighted to where the garrison stood (the north and the west
// heavier), and a woman or a child is in the church, and from the alarm in the sacristy. Nobody is set down anywhere: the
// garrison walks in from the town on the afternoon of February 23 through the south gate, the Gonzales men ride in on
// March 1 through the same gate, and whoever is inside walks from the gate to their post along a route that goes round the
// buildings and never through a wall.
//
// The routes are the compound's own plan (public/alamo-layout.js `findPath` over its walls and doors), found once and kept
// here as numbers, because nothing under sim/ reads the renderer (tests/movement.test.mjs). tests/battle-alamo.test.mjs walks
// every route over the plan's `isWalkable` a foot at a time, so a wall moved in the plan and not here fails.
// ceiling: routes found once, by hand, from the plan as it stands on 2026-09-25; the church and the palisade are reached
// round the palisade's end, which is where the plan leaves an opening. Making the plan's path-finder importable from sim/
// (a shared module with no drawing in it) is the way out, and would let a person be routed from anywhere.
import { share } from './alamo.mjs';
import { calendarMinutes } from './clock.mjs';

/**
 * Where the compound's plan lies on the map: its origin (the north-west corner of the plan, public/alamo-layout.js) in miles
 * east and south of Béxar's site point. The plan is laid north-up at its true feet (public/bexar-layout.js `alamoOnMap`), so a
 * foot of the plan is a foot of the map. Copied as numbers because nothing under sim/ reads the renderer
 * (tests/movement.test.mjs); tests/alamo-runner.test.mjs fails if this and `alamoOnMap` ever part.
 */
export const ALAMO_ORIGIN = Object.freeze({ x: 0.28673085317694386, y: -0.1601460310951376 });
const FEET_PER_MILE = 5280;
/** A point of the compound's plan, in feet, as a point on the map. */
export function onMap(world, feet) {
  const site = world.map?.sites?.bexar;
  return { x: site.x + ALAMO_ORIGIN.x + feet.x / FEET_PER_MILE, y: site.y + ALAMO_ORIGIN.y + feet.y / FEET_PER_MILE, siteId: 'bexar' };
}
/** A point of the map as a point of the plan, in feet. */
export function inFeet(world, point) {
  const site = world.map.sites.bexar;
  return { x: (point.x - site.x - ALAMO_ORIGIN.x) * FEET_PER_MILE, y: (point.y - site.y - ALAMO_ORIGIN.y) * FEET_PER_MILE };
}

/** Inside the south gate, where every route in starts. */
export const GATE_IN = Object.freeze({ x: 101, y: 515 });
/** Through the gate passage in the low barrack to the ground outside the south wall. */
export const GATE_OUT_ROUTE = Object.freeze([[102, 526], [104, 526], [104, 541]]);
/** Outside the gate, a little way south: where the garrison comes to it from the town, and a courier leaves from. */
export const OUTSIDE_GATE = Object.freeze({ x: 104, y: 560 });

/**
 * The posts, each with the spots men stood at and the route to each spot from inside the gate (`GATE_IN`), in the plan's
 * feet: `[x, y, [[x, y], ...]]`, the waypoints between the gate and the spot. Found by the plan's path-finder.
 */
const P = (x, y, route = []) => Object.freeze({ spot: Object.freeze({ x, y }), route: Object.freeze(route.map(([a, b]) => Object.freeze({ x: a, y: b }))) });
const TO_LONG_BARRACK = [[198, 516], [198, 508], [200, 508], [200, 480], [202, 480], [202, 450], [204, 450], [204, 422], [206, 422], [206, 394], [208, 394], [208, 378], [210, 378]];
const ROUND_THE_PALISADE = [[102, 526], [104, 526], [104, 540], [294, 540], [294, 416]];
const INTO_THE_CHURCH = [...ROUND_THE_PALISADE, [290, 416], [290, 388]];
export const POSTS = Object.freeze({
  north: Object.freeze({ label: 'the north wall', wall: 'north', spots: [
    P(40, 13.4, [[40, 516]]), P(60, 15.6, [[108, 516], [108, 30], [60, 30]]), P(80, 17.9, [[108, 516], [108, 30], [80, 30]]),
    P(100, 20.1, [[108, 516], [108, 30], [100, 30]]), P(135, 24, [[114, 516], [114, 38], [136, 38]]), P(155, 26.2, [[114, 516], [114, 38], [156, 38]]),
    P(175, 28.4, [[168, 516], [168, 420], [176, 420]]), P(195, 30.6, [[196, 516]]),
  ] }),
  'north-battery': Object.freeze({ label: 'the north battery', wall: 'north', spots: [P(108, 22, [[108, 516]]), P(124, 24, [[114, 516], [114, 38], [124, 38]])] }),
  west: Object.freeze({ label: 'the west wall', wall: 'west', spots: [80, 130, 180, 230, 280, 330, 380, 430].map(y => P(24, y, [[24, 516]])) }),
  southwest: Object.freeze({ label: 'the south-west battery, with the 18-pounder', wall: 'south', spots: [P(14, 506, [[14, 516]]), P(22, 516), P(32, 524, [[32, 516]])] }),
  south: Object.freeze({ label: 'the low barrack by the gate', wall: 'south', spots: [70, 85, 120, 140, 160].map(x => P(x, 512, [[x === 85 ? 86 : x, 516]])) }),
  palisade: Object.freeze({ label: 'the palisade', wall: 'south', spots: [[222, 500], [236, 482], [250, 463], [266, 442]].map(([x, y]) => P(x, y, [...ROUND_THE_PALISADE, [x, 416]])) }),
  church: Object.freeze({ label: 'the guns at the back of the church', wall: 'church', spots: [P(386, 378, [...INTO_THE_CHURCH, [386, 388]]), P(390, 393, [...INTO_THE_CHURCH, [390, 388]]), P(386, 408, [[102, 526], [104, 526], [104, 540], [386, 540]])] }),
  'long-barrack': Object.freeze({ label: 'the long barrack', wall: 'barrack', spots: [207, 238.4, 269.8, 301.3, 332.7, 364.1].map(y => P(221, y, [...TO_LONG_BARRACK, [210, Math.round(y)], [222, Math.round(y)]])) }),
  // The noncombatants: in the church through the siege, and in the sacristy from the alarm (`HIST-TEX-501`).
  nave: Object.freeze({ label: 'the church', wall: 'church', spots: [P(305, 390, [...INTO_THE_CHURCH, [306, 388]]), P(318, 398, [...INTO_THE_CHURCH, [318, 388]]), P(332, 390, [...INTO_THE_CHURCH, [332, 388]])] }),
});
/** From each spot of the nave to the sacristy, through its door (`sacristy-through`). */
export const TO_SACRISTY = Object.freeze([[[326, 390]], [[326, 398]], [[326, 390]]].map(route => Object.freeze(route.map(([x, y]) => ({ x, y })))));
export const SACRISTY = Object.freeze({ x: 326, y: 372 });
/** Out of the sacristy and the church, down inside the palisade and round its end to the ground south of the gate. */
export const OUT_OF_THE_CHURCH = Object.freeze([[320, 372], [320, 376], [296, 376], [296, 386], [290, 386], [290, 416], [294, 418], [204, 536], [202, 540], [104, 541]].map(([x, y]) => Object.freeze({ x, y })));

/**
 * Where the garrison stood, as the share of its fighters at each post: the north wall and its battery and the west wall
 * heaviest (the record's north battery, and the west wall the town faced), then the long barrack, the gate, the palisade,
 * the church's guns and the 18-pounder. Invented weights (`FIC-GONZ-430`), not a muster roll: the record gives where the
 * guns were and where men died, not how many stood where.
 */
export const POST_WEIGHTS = Object.freeze([['north', 0.24], ['north-battery', 0.06], ['west', 0.22], ['long-barrack', 0.12], ['south', 0.1], ['palisade', 0.1], ['church', 0.08], ['southwest', 0.08]]);

/** What somebody inside is: a fighter, or a woman or child. Read by role (sim/alamo.mjs `alamoRole`), passed in. */
export function choosePost(world, person, role) {
  if (role !== 'fighter') {
    const spots = POSTS.nave.spots;
    return { id: 'nave', spot: Math.floor(share(world, person.id, 'alamo-post-spot') * spots.length) };
  }
  let roll = share(world, person.id, 'alamo-post'), id = POST_WEIGHTS.at(-1)[0];
  for (const [post, weight] of POST_WEIGHTS) { if (roll < weight) { id = post; break; } roll -= weight; }
  return { id, spot: Math.floor(share(world, person.id, 'alamo-post-spot') * POSTS[id].spots.length) };
}
/** The post a person keeps: chosen the first time, then theirs. */
export function postFor(world, person, role) {
  const service = person.service;
  if (!service.post || !POSTS[service.post.id]?.spots[service.post.spot]) service.post = choosePost(world, person, role);
  return service.post;
}
/** The spot of a post, in feet. */
export const spotOf = post => POSTS[post.id].spots[post.spot].spot;
/** The wall a post is on: north, west, south, church or barrack - what decides when the storming reaches it. */
export const wallOf = post => POSTS[post?.id]?.wall || 'north';
export const postLabel = post => POSTS[post?.id]?.label || 'the walls';

/** Whether a point of the plan is inside the compound's walls (the plaza and the ranges round it, the church and its yard). */
export function insideWalls(feet) {
  return feet.x > 0 && feet.x < 400 && feet.y > 0 && feet.y < 537;
}

/**
 * Start somebody walking to their post: from outside, to the gate and in through it; from inside, back to the gate's
 * inside and out along their post's route. Nothing is moved here; `advanceWalks` moves them, a leg at a time.
 */
export function walkToPost(world, person, post) {
  const here = inFeet(world, person.location);
  const { spot, route } = POSTS[post.id].spots[post.spot];
  const inward = insideWalls(here)
    ? [GATE_IN]
    : [...(here.y < 537 ? [] : [OUTSIDE_GATE]), ...[...GATE_OUT_ROUTE].reverse().map(([x, y]) => ({ x, y })), GATE_IN];
  setWalk(world, person, [...inward, ...route, spot]);
}
/** Walk along these points of the plan, in feet. */
export function setWalk(world, person, feet) {
  // `since`: a walk set this tick is begun on the next, so the tick that sent somebody never also carries them there.
  person.service.walk = { points: feet.map(point => onMap(world, point)).map(({ x, y }) => ({ x, y })), at: 0, since: world.minute };
}

/**
 * How far somebody on foot inside the lines goes in a tick: a walker's three miles an hour of the calendar the tick carries,
 * and never less than a steady local pace, so a long tick is a walk and not a jump, and a short one is still seen to move.
 * ceiling: shared with the runner's ninety feet a tick (sim/alamo-runner.mjs); local motion's own clock is the way out.
 */
export const WALK_FLOOR_FEET = 90;
const walkReach = world => Math.max(WALK_FLOOR_FEET / FEET_PER_MILE, calendarMinutes(world) / 20);
/** Four times how far off the straight line a waypoint may lie and still be passed in the same tick: three feet. */
const PASS_FEET = 12;
/** How far a point lies from the segment a-b, in the map's miles. */
function offLine(point, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y, length = dx * dx + dy * dy;
  const t = length ? Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / length)) : 0;
  return Math.hypot(point.x - a.x - dx * t, point.y - a.y - dy * t);
}

/**
 * Each tick: everybody with a walk goes along it, leg by leg, and stops at the end of each leg of any length while the clock
 * is watched, so the page - which draws a straight line from one tick's place to the next - never draws a person through a
 * wall at a corner. Nobody who is being spoken to moves (Travis's runner walks to where the person stands).
 */
export function advanceWalks(world, { moving = () => true } = {}) {
  if (!world.map?.sites?.bexar) return;
  for (const person of Object.values(world.entities)) {
    const walk = person.service?.walk;
    if (!walk || person.travel || !moving(person) || walk.since === world.minute) continue;
    let reach = walkReach(world);
    // A tick's walk is one straight line on the page: the walker goes on past a waypoint only while every waypoint passed
    // this tick stays within a few feet of the straight line from where the tick began to the next one - the plan's stairs
    // along a slanting wall are one line, a corner round a building is a stop.
    const start = { ...person.location }, passed = [];
    while (walk.at < walk.points.length && reach > 0) {
      const target = walk.points[walk.at], here = person.location;
      const apart = Math.hypot(target.x - here.x, target.y - here.y);
      if (apart <= reach) {
        person.location = { x: target.x, y: target.y, siteId: 'bexar' };
        reach -= apart; walk.at++;
        passed.push(target);
        const next = walk.points[walk.at];
        if (next && passed.some(point => offLine(point, start, next) > PASS_FEET / 4 / FEET_PER_MILE)) break;
      } else {
        const part = reach / apart;
        person.location = { x: here.x + (target.x - here.x) * part, y: here.y + (target.y - here.y) * part, siteId: 'bexar' };
        reach = 0;
      }
    }
    if (walk.at >= walk.points.length) delete person.service.walk;
  }
}

const along = points => { const out = [0]; for (let i = 1; i < points.length; i++) out.push(out[i - 1] + Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y)); return out; };
/** The point `miles` along a road. */
export function pointAlong(points, miles) {
  let left = miles;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i], length = Math.hypot(b.x - a.x, b.y - a.y);
    if (left <= length) { const t = length ? left / length : 0; return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }; }
    left -= length;
  }
  return { x: points.at(-1).x, y: points.at(-1).y };
}
/** The nearest place on a road to a point: which segment, the point on it, and how far along the road that is. */
function nearestOnRoad(points, target) {
  const lengths = along(points);
  let best = Infinity, cut = null;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i], dx = b.x - a.x, dy = b.y - a.y, length = Math.hypot(dx, dy);
    const t = length ? Math.max(0, Math.min(1, ((target.x - a.x) * dx + (target.y - a.y) * dy) / (length * length))) : 0;
    const q = { x: a.x + dx * t, y: a.y + dy * t }, off = Math.hypot(q.x - target.x, q.y - target.y);
    if (off < best - 1e-12) { best = off; cut = { segment: i - 1, q, at: lengths[i - 1] + length * t }; }
  }
  return cut;
}
/**
 * A journey just begun from inside the Alamo, started instead along `waypoints` (map points) - out from the post through the
 * gate - and on to the road where it passes nearest the last of them, rather than straight through the walls to Béxar's plaza
 * and back (docs/battle-research/staging.md §5.6: couriers ride out). The road's hard going and its fords keep their places.
 */
export function leaveBy(travel, here, waypoints) {
  const cut = nearestOnRoad(travel.points, waypoints.at(-1));
  const lead = [{ x: here.x, y: here.y }, ...waypoints.map(({ x, y }) => ({ x, y })), cut.q];
  const points = [...lead, ...travel.points.slice(cut.segment + 1)];
  const lengths = along(points), start = lengths[lead.length - 1];
  const shift = lead.length - 1 - (cut.segment + 1);
  if (travel.pace) { travel.pace = travel.pace.filter(([segment]) => segment >= cut.segment).map(([segment, factor]) => [Math.max(lead.length - 1, segment + shift), factor]); if (!travel.pace.length) delete travel.pace; }
  if (travel.fords) { travel.fords = travel.fords.filter(ford => ford.at >= cut.at).map(ford => ({ ...ford, at: ford.at - cut.at + start })); if (!travel.fords.length) delete travel.fords; }
  travel.points = points; travel.distance = lengths.at(-1); travel.progress = 0;
}
/**
 * A journey ended short of its place, at `target`: the road cut where it passes nearest and a last short step across - where
 * the Gonzales men waited in the dark short of the Mexican lines, not Béxar's plaza inside them (staging.md §5.6).
 */
export function endShortOf(travel, target) {
  const cut = nearestOnRoad(travel.points, target);
  const points = [...travel.points.slice(0, cut.segment + 1), cut.q, { x: target.x, y: target.y }];
  travel.points = points; travel.distance = along(points).at(-1);
  if (travel.pace) { travel.pace = travel.pace.filter(([segment]) => segment <= cut.segment); if (!travel.pace.length) delete travel.pace; }
  if (travel.fords) { travel.fords = travel.fords.filter(ford => ford.at <= cut.at); if (!travel.fords.length) delete travel.fords; }
  travel.settle = { x: target.x, y: target.y, task: 'rest' };
}
/** The way out from a post to the ground south of the gate, in feet: back along the post's route, through the gate passage. */
export function wayOut(post) {
  const { route } = POSTS[post.id].spots[post.spot];
  return [...[...route].reverse(), GATE_IN, ...GATE_OUT_ROUTE.map(([x, y]) => ({ x, y })), OUTSIDE_GATE];
}
