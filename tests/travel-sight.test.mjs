// Somebody the class's clock is carrying faster than a student can follow is away on the road, and the server sends no
// position for them at all.
//
// Owner, 2026-09-21, after a real class played it on Chromebooks: "students saw characters moving too fast. i thought we
// were going to use fog of war for that? if they're moving too fast then players shouldn't be able to follow them until
// they arrive." The rule, the threshold and the reason are in sim/sight.mjs; what a student is shown instead is
// docs/MAP_ACCURACY.md §12, `FIC-GONZ-230` and `FIC-GONZ-231`.
//
// These tests are about the *projection*, which is where this project decides what a family may see (VISION.md §4). The
// simulation is untouched: everybody still walks the same miles in the same minutes, the dates all still land, and a class
// saved before this opens unchanged - nothing here is stored.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { beginTravel, milesATick, projectWorld, validateWorld } from '../sim/world.mjs';
import { CALENDAR_SCALE, calendarMinutes } from '../sim/clock.mjs';
import { HORSE_SPEED, RIDER_SPEED, WAGON_SPEED, WALK_SPEED } from '../sim/travel.mjs';
import { ROAD_WINDOW_MILES } from '../sim/overview.mjs';
import { WATCHABLE_MILES_A_TICK, awayProjection, backWords, tooFastToFollow } from '../sim/sight.mjs';
import { whereWords } from '../sim/host.mjs';
import { choresFor } from '../sim/chores.mjs';
import { settle } from './support/settled.mjs';

let shared = null;
const colonies = () => structuredClone(shared ??= (() => {
  const world = settle(createGonzalesWorld('travel-sight', 5, { map: 'colonies' }));
  world.status = 'running';
  return world;
})());

/** The family's main person put on a long straight open road, with nothing in the way of the ticks that follow. */
function onTheRoad(world, { mode = 'foot' } = {}) {
  const household = world.households['hh-1'];
  const person = household.members.map(id => world.entities[id]).find(entity => entity.principal);
  beginTravel(world, person, 'gonzales', null, 'visit', mode);
  const start = person.travel.points[0];
  Object.assign(person.travel, { points: [start, { x: start.x + 200, y: start.y }], distance: 200, progress: 12, fords: [] });
  delete person.travel.pace;
  person.location = { x: start.x + 12, y: start.y, siteId: null };
  return { household, person };
}
const shownPerson = (world, household, person) =>
  projectWorld(world, household.id, 'student', { includeMap: false }).entities.find(entity => entity.id === person.id);

test('the line is how far the figure would jump, not what the clock says, and it is where this page stops drawing a walk', () => {
  // The unit is miles of ground one tick carries *this* traveller. Nothing in the rule reads the phase, because the same
  // phase carries a wagon and a courier three times apart.
  assert.equal(typeof WATCHABLE_MILES_A_TICK, 'number');
  assert.ok(!/phase/.test(readFileSync(new URL('../sim/sight.mjs', import.meta.url), 'utf8').split('export function tooFastToFollow')[1]),
    'the rule reads the class\'s phase instead of the ground a tick carries');
  // Three miles is where this project's own drawing stops sliding a figure and starts jumping it: `ROAD_WINDOW_MILES` is
  // the stretch of road sent along beside a traveller so the page can slide them down it between two ticks, and a step
  // longer than that window is a step off the end of the road the page holds.
  assert.equal(WATCHABLE_MILES_A_TICK, ROAD_WINDOW_MILES, 'the line and the road the page is given to draw the walk on have parted');
  // What it lets through, calendar by calendar (sim/clock.mjs `CALENDAR_SCALE`, speeds from sim/travel.mjs).
  const step = (speed, calendar, allHours = false) => speed * (allHours || calendar <= 60 ? calendar / 20 : (calendar / 1440) * 7 * 3);
  // Asked of the rule itself, at the real numbers, so the line's own comparison is under test and not a copy of it.
  const watched = (speed, phase, allHours) => !tooFastToFollow({}, step(speed, CALENDAR_SCALE[phase], allHours), 0);
  // The farming day: everybody, exactly as it always was. The hunt's walk out, the wagon's arrival, a ride into town and a
  // rider coming up to the door are all watched from end to end.
  for (const [what, speed, allHours] of [['a walk', WALK_SPEED, false], ['the family horse', HORSE_SPEED, false], ['the ox wagon', WAGON_SPEED, false], ['a courier', RIDER_SPEED, true]]) {
    assert.equal(watched(speed, 'home', allHours), true, `${what} is not watched in the farming day`);
  }
  // The news, an hour a tick: a walk is three miles and stays; the horse is five and does not.
  assert.equal(watched(WALK_SPEED, 'news'), true, 'a walk in the news hour is not watched');
  assert.equal(watched(WAGON_SPEED, 'news'), true, 'the wagon in the news hour is not watched');
  assert.equal(watched(HORSE_SPEED, 'news'), false, 'the horse at five miles a tick is still drawn');
  assert.equal(watched(RIDER_SPEED, 'news', true), false, 'a courier at 7.8 miles a tick is still drawn');
  // The long ticks: nothing on its own feet.
  for (const phase of ['gathering', 'campaign']) assert.equal(watched(WALK_SPEED, phase), false, `a walk in the ${phase} is still drawn`);
  assert.equal(watched(WAGON_SPEED, 'gathering'), true, 'the ox wagon at 2.3 miles a gathering tick is hidden');
  assert.equal(watched(WAGON_SPEED, 'campaign'), false, 'the ox wagon at 6.8 miles a campaign tick is still drawn');
});

test('a journey slow enough to follow is projected exactly as it always was', () => {
  const world = colonies();
  const { household, person } = onTheRoad(world);
  world.director.phase = 'home';
  const shown = shownPerson(world, household, person);
  assert.equal(calendarMinutes(world), 20);
  assert.ok(milesATick(world, person) <= WATCHABLE_MILES_A_TICK, 'a farming tick carries a walker too far to follow');
  assert.deepEqual(shown.location, person.location, 'the walker is not where the server has them');
  assert.equal(shown.travel.progress, 12);
  assert.ok(shown.travel.points.length >= 2, 'the road under them is not sent');
  assert.equal(shown.travel.away, undefined, 'a watched walker is marked away');
  assert.equal(shown.travel.step, milesATick(world, person), 'the page is told a different step from the one the server takes');
});

test('a journey too fast to follow is sent with no place, no road, no progress and no pace', () => {
  const world = colonies();
  const { household, person } = onTheRoad(world);
  world.director.phase = 'campaign';
  assert.ok(milesATick(world, person) > WATCHABLE_MILES_A_TICK, 'a campaign tick does not carry a walker past the line');
  const shown = shownPerson(world, household, person);
  assert.equal(shown.location, null, 'the page is handed a place it may not draw');
  for (const key of ['points', 'progress', 'speed', 'step', 'base']) assert.ok(!(key in shown.travel), `the page is handed ${key}`);
  // The whole journey, not its middle: the step at twelve hours is ten and a half miles, so an end window would be a
  // single jump longer than the window itself. This is what was wrong with the 2026-09-17 rule.
  for (const progress of [0, 0.5, 2, 39.9, 40]) {
    person.travel.progress = progress;
    assert.equal(shownPerson(world, household, person).location, null, `at ${progress} miles along, a place was sent`);
  }
  // And the world itself is untouched: the server still has them exactly where they are.
  assert.ok(Number.isFinite(person.location.x) && person.travel.points.length >= 2, 'the simulation lost the traveller');
  validateWorld(world);
});

test('a family still knows who is away, where they went and roughly when they are back', () => {
  const world = colonies();
  const { household, person } = onTheRoad(world);
  world.director.phase = 'campaign';
  const shown = shownPerson(world, household, person);
  assert.equal(shown.travel.to, 'gonzales', 'the family is not told where they went');
  assert.equal(shown.travel.miles, 188, 'the family is not told how far is left');
  // Counted in whole ticks, as sim/time.mjs counts the Host's timeline of what is coming, so the two cannot drift apart.
  const ticks = Math.ceil((person.travel.distance - person.travel.progress) / milesATick(world, person));
  assert.equal(shown.travel.due, world.minute + ticks * calendarMinutes(world), 'the family is told the wrong day');
  assert.ok(shown.travel.due > world.minute, 'the family is not told when they get there');
  assert.match(shown.travel.back, /^there (about|in about|within)/, `the words a family is given: ${shown.travel.back}`);
  // Their row on the family panel is where a student looks for them, and it says the same three things.
  const why = choresFor(world, household, person).find(entry => !entry.can)?.why || '';
  assert.match(why, /is away on the road to Gonzales, about 188 miles off, and should be there/, `the panel says: ${why}`);
  // Close to home, in hours; far off, a date. Never a clock face and never a minute.
  assert.equal(backWords(world, 0, 40), 'there within the hour');
  assert.equal(backWords(world, 0, 80), 'there in about an hour', 'an hour and a bit was counted as "an hours"');
  assert.equal(backWords(world, 0, 180), 'there in about three hours');
  for (const minutes of [61, 90, 200, 400, 700]) assert.doesNotMatch(backWords(world, 0, minutes), /an hours|one hours/, `${minutes} minutes`);
  assert.match(backWords(world, 0, 60 * 24 * 3), /^there about \w+ \d+$/);
});

test('somebody who is not moving is never away, however fast the calendar is running', () => {
  const world = colonies();
  const { household, person } = onTheRoad(world);
  world.director.phase = 'campaign';
  const fast = milesATick(world, person);
  assert.ok(fast > WATCHABLE_MILES_A_TICK);
  // Held on the bank while the water is up (sim/world.mjs `wadeAt`): sitting still, sometimes for days, and watched.
  person.travel.waitUntil = world.minute + 1440;
  assert.equal(tooFastToFollow(person.travel, fast, world.minute), false, 'somebody waiting out a flood went out of sight');
  assert.ok(shownPerson(world, household, person).location, 'somebody waiting at a ford was not drawn');
  assert.equal(tooFastToFollow(person.travel, fast, world.minute + 1441), true, 'once the water falls they are on the road again');
  delete person.travel.waitUntil;
  // A rider reined in to speak with somebody is standing in front of them (sim/world.mjs `progressTravel`).
  person.travel.halted = true;
  assert.equal(tooFastToFollow(person.travel, fast, world.minute), false, 'a rider stopped to speak vanished mid-sentence');
  assert.ok(shownPerson(world, household, person).location, 'a rider stopped to speak was not drawn');
});

test('the Host is not a family: the teacher still sees the class where it truly is', () => {
  const world = colonies();
  const { person } = onTheRoad(world);
  world.director.phase = 'campaign';
  const host = projectWorld(world, null, 'host', { includeMap: false });
  const seen = host.others.find(entity => entity.id === person.id);
  assert.ok(seen.location && Number.isFinite(seen.location.x), 'the Host lost a traveller a student may not watch');
  assert.ok(seen.travel.points.length >= 2 && Number.isFinite(seen.travel.progress), 'the Host lost the road under a traveller');
  // And the Host's own words for them are unchanged (docs/HOST_PAGE.md).
  assert.equal(whereWords(world, person, world.households['hh-1']), 'on the road to Gonzales');
});

test('nothing about this is stored, so a class saved before it opens unchanged', () => {
  const world = colonies();
  const { household, person } = onTheRoad(world);
  world.director.phase = 'campaign';
  const before = structuredClone(world);
  shownPerson(world, household, person);
  awayProjection(world, person.travel, { milesATick: milesATick(world, person), minutes: calendarMinutes(world) });
  assert.deepEqual(world, before, 'projecting a traveller away changed the world');
  // A class on the invented Gonzales country runs one twenty-minute clock and can never reach the line (sim/clock.mjs).
  const invented = settle(createGonzalesWorld('travel-sight-invented', 5));
  invented.status = 'running';
  const home = onTheRoad(invented);
  assert.equal(calendarMinutes(invented), 20, 'the invented country grew a second clock');
  assert.ok(shownPerson(invented, home.household, home.person).location, 'a class on the invented country lost a traveller');
});
