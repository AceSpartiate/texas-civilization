// How fast somebody goes, in the time of 1835 rather than the time of the lesson.
//
// Owner, 2026-09-18, playtesting: "when i sent my main character to gonzales on foot he ran inhumanly fast. that speed
// would be fine for a horse". Measured, two things in the simulation were wrong (the rest is how it is drawn, and the
// calendar the owner chose; docs/evidence/travel-speed.json): the family's horse went at a courier's trot, and in the long
// ticks of the gathering and the campaign everybody travelled all twenty-four hours of every day at their hourly pace -
// seventy-two miles a day on foot, a hundred and eighty-seven on the horse, forty-seven with the ox and wagon. These tests
// hold the paces to the period's (`HIST-TEX-093`) and the day on the road to `FIC-GONZ-059`, on every clock a class runs.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { beginTravel, milesATick, progressTravel, projectWorld } from '../sim/world.mjs';
import { CALENDAR_SCALE, calendarMinutes } from '../sim/clock.mjs';
import { HORSE_SPEED, MODES, RIDER_SPEED, WALK_SPEED, WAGON_SPEED, milesADay, milesAnHour, roadTicks } from '../sim/travel.mjs';
import { settle } from './support/settled.mjs';

let shared = null;
const colonies = () => structuredClone(shared ??= (() => {
  const world = settle(createGonzalesWorld('travel-speed', 5, { map: 'colonies' }));
  world.status = 'running';
  return world;
})());
/** A traveller set on a long straight open road, then a whole day of 1835 stepped in the phase's own ticks. */
function aDay(phase, speed, { courier = false } = {}) {
  const world = colonies();
  world.director.phase = phase;
  const person = Object.values(world.entities).find(entity => entity.principal);
  if (courier) person.courier = true;
  const at = { ...person.location };
  person.travel = { from: at.siteId, to: at.siteId, points: [{ x: at.x, y: at.y }, { x: at.x + 1000, y: at.y }], progress: 0, distance: 1000, speed, mode: 'foot', purpose: 'errand', silent: true };
  person.location = { x: at.x, y: at.y, siteId: null };
  const minutes = calendarMinutes(world), ticks = 1440 / minutes;
  assert.equal(minutes, CALENDAR_SCALE[phase], `the ${phase} tick is not the phase's`);
  // The first tick alone, in hours: the pace while going.
  world.minute += minutes; progressTravel(world, person);
  const first = person.travel.progress;
  for (let tick = 1; tick < ticks; tick++) { world.minute += minutes; progressTravel(world, person); }
  return { perHour: first / (minutes / 60), perDay: person.travel.progress, perTick: first };
}
const near = (actual, expected, label) => assert.ok(Math.abs(actual - expected) < 1e-9, `${label}: ${actual} against ${expected}`);

test('each way of going keeps the period\'s pace while going: three miles an hour walking, five on the horse, two with the ox', () => {
  // `HIST-TEX-093`: a man walks two and a half to three miles an hour; the cavalry walks three and three-quarters and trots
  // seven and a half; an ox walks about two. The family's horse on an errand walks and trots, at five (`FIC-GONZ-059`).
  near(milesAnHour(MODES.foot.speed), 3, 'on foot');
  near(milesAnHour(MODES.horse.speed), 5, 'on the horse');
  near(milesAnHour(MODES.wagon.speed), 1.95, 'with the ox and wagon');
  assert.equal(MODES.horse.speed, HORSE_SPEED, 'the family horse is not the courier\'s');
  assert.ok(milesAnHour(MODES.horse.speed) > 3.75 && milesAnHour(MODES.horse.speed) < 7.5, 'the family horse goes faster than a walk and slower than a steady trot');
  assert.ok(milesAnHour(MODES.wagon.speed) >= 1.5 && milesAnHour(MODES.wagon.speed) <= 2, 'the ox team is not at an ox\'s pace');
  // In the ticks a student watches hour by hour - twenty minutes farming, an hour in the news - that is the pace on the map.
  for (const phase of ['home', 'news']) {
    for (const [mode, mph] of [['foot', 3], ['horse', 5], ['wagon', 1.95]]) near(aDay(phase, MODES[mode].speed).perHour, mph, `${mode} in the ${phase} tick`);
  }
});

test('in the long ticks a day on the road is twenty-one miles walking, thirty-five riding and under fourteen with the wagon, never every hour of the day', () => {
  // `HIST-TEX-093`: a regiment averages eighteen miles a day and can make twenty-five or thirty; ox trains twelve to fifteen
  // and sixteen to eighteen at most; a rider thirty to forty. Seven hours of going a day (`FIC-GONZ-059`) makes these.
  for (const phase of ['gathering', 'campaign']) {
    const foot = aDay(phase, WALK_SPEED), horse = aDay(phase, HORSE_SPEED), wagon = aDay(phase, WAGON_SPEED);
    near(foot.perDay, 21, `a day on foot in the ${phase}`);
    near(horse.perDay, 35, `a day on the horse in the ${phase}`);
    near(wagon.perDay, 13.65, `a day with the ox and wagon in the ${phase}`);
    assert.ok(foot.perDay >= 15 && foot.perDay <= 25, `${foot.perDay} miles a day on foot`);
    assert.ok(horse.perDay >= 30 && horse.perDay <= 40, `${horse.perDay} miles a day on the horse`);
    assert.ok(wagon.perDay >= 8 && wagon.perDay <= 15, `${wagon.perDay} miles a day with the wagon`);
    // Spread evenly: every tick of the day carries its share, so nobody moves all day and then stands.
    near(foot.perTick * (1440 / CALENDAR_SCALE[phase]), foot.perDay, `the ${phase}'s day on foot was not spread evenly`);
  }
  near(milesADay(WALK_SPEED), 21, 'milesADay');
  near(roadTicks(20), 1, 'a farming tick is one tick of road'); near(roadTicks(60), 3, 'an hour is three');
});

test('a courier carrying word rides night and day at his trot, as he always did, and the expresses keep their dates', () => {
  // Martin rode the seventy miles from the Alamo to Gonzales through the night (`HIST-TEX-093`); the expresses' waits are
  // calibrated on this pace against `HIST-TEX-006`, so it is the one thing that does not keep a day on the road.
  for (const phase of ['home', 'news', 'gathering', 'campaign']) near(aDay(phase, RIDER_SPEED, { courier: true }).perDay, 187.2, `a courier's day in the ${phase}`);
  near(roadTicks(720, true), 36, 'a courier\'s twelve-hour tick');
});

test('somebody sent riding goes at the family horse\'s pace, a rider with word at the courier\'s, and the page is told what a tick carries', () => {
  const world = colonies();
  const household = world.households['hh-1'];
  const person = household.members.map(id => world.entities[id]).find(entity => entity.principal);
  beginTravel(world, person, 'gonzales', null, 'visit', 'horse');
  assert.equal(person.travel.speed, HORSE_SPEED, 'the family horse went at a courier\'s trot');
  for (const role of ['horse']) assert.equal(world.entities[`${household.id}-${role}`].travel.speed, HORSE_SPEED, 'the horse under him went another pace');
  // The projection carries the miles the server's next tick moves this journey, which the page reads rather than works out.
  // A long open road, so the tick's whole step is spent on it.
  const start = person.travel.points[0];
  Object.assign(person.travel, { points: [start, { x: start.x + 200, y: start.y }], distance: 200, progress: 0 });
  delete person.travel.pace;
  for (const [phase, share] of [['home', 1], ['news', 3], ['gathering', 3.5], ['campaign', 10.5]]) {
    world.director.phase = phase;
    const shown = projectWorld(world, household.id, 'student', { includeMap: false }).entities.find(entity => entity.id === person.id).travel;
    near(shown.step, HORSE_SPEED * share, `the projected step in a ${phase} tick`);
    near(milesATick(world, person), shown.step, 'the projection and the server disagree');
    const was = person.travel.progress;
    world.minute += calendarMinutes(world); progressTravel(world, person);
    near(person.travel.progress - was, shown.step, `the ${phase} tick moved him other than the projection said`);
  }
  // A rider carrying word is the courier, not the family horse.
  const other = colonies(), rider = other.entities[person.id];
  rider.report = { topicId: 'x' };
  beginTravel(other, rider, 'gonzales', null, 'relay');
  assert.equal(rider.travel.speed, RIDER_SPEED, 'a rider with word went at the family horse\'s pace');
});
