// Two clocks: docs/COLONIES.md §5.7, build step 4 part 3.
//
// On the real land of the colonies a tick still holds twenty minutes of anybody's effort, and the
// date it carries depends on the phase: twenty minutes while the class farms, an hour through the
// news. What belongs to days follows the calendar - what is eaten, what spoils, and how far the
// ground goes past, so the letters keep the dates `HIST-TEX-006` gives them and a volunteer can
// still reach a gathering history dated. What belongs to a student does not: the same ticks of
// road before a rider is at the door, the same ticks to answer one, and the night the force
// crossed keeps every one of its twenty-four ticks because a question is open in it. The invented
// Gonzales country, and so every class saved before this, runs the one clock it always ran.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { projectWorld, stepWorld } from '../sim/world.mjs';
import { CALENDAR_SCALE, TICK_MINUTES, calendarMinutes } from '../sim/clock.mjs';
import { PATIENCE_MINUTES, seenComing } from '../sim/encounters.mjs';
import { RIDER_SPEED } from '../sim/travel.mjs';
import { advanceRoutine } from '../sim/routines.mjs';

const colonies = (seed, players = 15, options = {}) => {
  const world = createGonzalesWorld(seed, players, { map: 'colonies', ...options });
  world.status = 'running';
  return world;
};
const until = (world, done, limit = 2000) => { for (let tick = 0; tick < limit && !done() && !world.director.complete; tick++) stepWorld(world); };
/** The minutes of 1835 one tick actually moved the date. */
const stepped = world => { const was = world.minute; stepWorld(world); return world.minute - was; };

test('a tick carries its phase\'s share of 1835 on the real land, and twenty minutes of it on the invented country', () => {
  const world = colonies('clock-phases');
  assert.equal(stepped(world), TICK_MINUTES, 'a farming tick moved more than twenty minutes');
  until(world, () => world.director.phase === 'news');
  assert.equal(stepped(world), CALENDAR_SCALE.news, 'the news did not speed the calendar up');
  // The invented map is the class every school has already played, and it never had a second clock.
  const invented = createGonzalesWorld('clock-invented', 15);
  invented.status = 'running';
  until(invented, () => invented.director.phase === 'news');
  assert.equal(invented.director.phase, 'news', 'the invented class never reached the news');
  for (let tick = 0; tick < 5; tick++) assert.equal(stepped(invented), TICK_MINUTES, 'the invented country changed pace');
  // A class saved before any of this has no real-land map to read, and opens on the single clock.
  assert.equal(calendarMinutes({ director: { phase: 'news' }, map: {} }), TICK_MINUTES);
});

test('the ground goes past at the same miles an hour of 1835 in every phase, so a journey keeps its real length', () => {
  const measure = phase => {
    const world = colonies(`clock-ground-${phase}`);
    const rider = Object.values(world.entities).find(entity => entity.principal);
    // Held still on the spot, with a journey of its own to make, so nothing else in the class moves it.
    world.director.phase = phase;
    const start = { ...rider.location };
    rider.travel = { from: rider.location.siteId, to: rider.location.siteId, points: [{ x: start.x, y: start.y }, { x: start.x + 50, y: start.y }], progress: 0, distance: 50, speed: RIDER_SPEED, mode: 'horse', purpose: 'errand', silent: true };
    const before = world.minute;
    for (let tick = 0; tick < 4; tick++) stepWorld(world);
    return { miles: rider.travel.progress, minutes: world.minute - before };
  };
  const home = measure('home'), news = measure('news');
  assert.ok(news.miles > home.miles, 'the ground did not go past faster when the calendar did');
  // Miles for every hour of 1835, which is a fact about the horse and not about the lesson.
  const perHour = run => run.miles / (run.minutes / 60);
  assert.ok(Math.abs(perHour(home) - perHour(news)) < 1e-9, `${perHour(home)} miles an hour farming, ${perHour(news)} in the news`);
});

test('a rider comes into view the same distance up the road - counted in ticks - however fast the calendar runs', () => {
  // Five miles was chosen because a rider covers 2.6 of them in a tick, which is about two
  // ticks of somebody coming up the road (`SIGHT_MILES` in sim/encounters.mjs). It is a count
  // of ticks wearing a distance, so the distance has to grow when a tick carries more ground.
  const ticksOff = phase => {
    const world = colonies('clock-sight');
    world.director.phase = phase;
    return seenComing(world) / (RIDER_SPEED * (calendarMinutes(world) / TICK_MINUTES));
  };
  assert.ok(ticksOff('home') > 1.5, `a rider is seen only ${ticksOff('home').toFixed(1)} ticks off while farming`);
  assert.equal(ticksOff('news'), ticksOff('home'), 'the news brought riders into view later in the ride');
});

test('the news phase gives a student as many ticks of watching a rider come as the farming phase does', () => {
  // The same class played twice: once with the calendar allowed to speed up at the news, once
  // held at the farming scale throughout. What is asserted is not that every rider is always
  // seen coming - one who crosses a river is genuinely out of sight until he is over it, and
  // that is older than this change - but that speeding up the calendar takes nothing away.
  const approaches = hold => {
    const world = colonies('clock-approach', 30, { neighbours: true });
    const seen = {}, ticksOfApproach = [];
    for (let tick = 0; tick < 2000 && !world.director.complete; tick++) {
      stepWorld(world);
      if (hold && world.director.phase === 'news') world.director.phase = hold;
      for (const household of Object.values(world.households)) {
        for (const other of projectWorld(world, household.id, 'student', { includeMap: false }).others) {
          const key = `${household.id}:${other.id}`;
          if (other.carrier && seen[key] === undefined) seen[key] = world.tick;
        }
      }
      for (const encounter of Object.values(world.encounters || {})) {
        if (encounter.openedMinute !== world.minute) continue;
        const first = seen[`${encounter.householdId}:${encounter.carrierId}`];
        ticksOfApproach.push(first === undefined ? 0 : world.tick - first);
      }
    }
    return ticksOfApproach;
  };
  const farming = approaches('home'), news = approaches(null);
  assert.ok(news.length > 5, `only ${news.length} riders spoke to anybody`);
  // About two in five appear with no approach already, farming or not: a rider whose whole leg
  // is short, or who comes over a river. That is older than the two clocks and is not what this
  // guards. What it guards is that the faster calendar adds none of its own - without sight and
  // the first tick stretching with it, this is most of them rather than a point or two.
  const appearances = list => list.filter(ticks => ticks === 0).length / list.length;
  assert.ok(appearances(news) <= appearances(farming) + 0.05,
    `${(appearances(news) * 100).toFixed(0)} in 100 riders appeared without an approach in the news phase, against ${(appearances(farming) * 100).toFixed(0)} while farming`);
});

test('a student gets the same ticks to answer a rider whatever the date is doing', () => {
  // How many ticks a rider waits, unanswered, for the first family one speaks to. It is a
  // number about noticing a prompt and reading five lines, so it is a number of ticks: at an
  // hour a tick the same twenty fictional hours would be a third of the time to read it.
  const ticksWaited = hold => {
    const world = colonies('clock-patience', 30, { neighbours: false });
    // A family somebody is playing: the patience this measures is a student's reading time, and
    // at a family nobody plays there is none to protect (sim/encounters.mjs).
    for (const household of Object.values(world.households)) household.played = true;
    let opened = null, open = null;
    for (let tick = 0; tick < 2000 && !world.director.complete; tick++) {
      stepWorld(world);
      // Held in the phase under test from the moment the calendar would otherwise change.
      if (hold && world.director.phase === 'news') world.director.phase = hold;
      if (!open) {
        open = Object.values(world.encounters || {}).find(e => e.status === 'open' && !e.said?.some(line => line.speaker === 'family'));
        if (open) opened = world.tick;
      } else if (world.encounters[open.id].status !== 'open') return { ticks: world.tick - opened, why: world.encounters[open.id].outcome };
    }
    return { ticks: null };
  };
  const farming = ticksWaited('home'), news = ticksWaited(null);
  assert.ok(farming.ticks, 'no rider ever spoke to anybody');
  // Sixty ticks either way, give or take the one the phase changes on. Counted in minutes of
  // 1835 instead, the news phase would leave twenty - a third of the time to read the same prompt.
  assert.ok(news.ticks >= 50, `a student had ${news.ticks} ticks to answer in the news phase`);
  assert.ok(Math.abs(news.ticks - farming.ticks) <= 1, `${farming.ticks} ticks to answer while farming, ${news.ticks} in the news`);
});

test('the calendar holds through the night the force crossed, so the upriver question keeps its ticks', () => {
  const world = colonies('clock-crossing');
  until(world, () => world.director.milestones.crossing);
  assert.equal(world.director.phase, 'news', 'the crossing happened outside the news phase');
  const opened = world.tick;
  assert.equal(calendarMinutes(world), TICK_MINUTES, 'the calendar ran fast through the crossing');
  until(world, () => world.director.milestones.approach);
  const ticks = world.tick - opened;
  // Eight hours of 1835 at the farming scale. At an hour a tick it would be eight ticks, which is
  // less than it takes to notice a prompt and read it (`PATIENCE_MINUTES` in sim/encounters.mjs).
  assert.ok(ticks >= 20, `the upriver question was open for ${ticks} ticks`);
  assert.equal(calendarMinutes(world), CALENDAR_SCALE.news, 'the calendar did not pick up again at the approach');
});

test('a family eats and spoils by the calendar, so a day is a day however many ticks it took', () => {
  // Twelve hours of 1835 handed over in six ticks of a farming phase and in one of a campaign
  // phase. Asked of a whole played class the two would honestly differ - the class with fewer
  // ticks in its day has had fewer spells of work in it, so its house is further off and its
  // food spoils faster, which is the effort clock doing exactly what it should. What is asserted
  // here is the rule underneath: what a day costs is read off the calendar and never off the tick.
  const eaten = (each, times) => {
    const world = colonies('clock-food');
    const household = Object.values(world.households)[0];
    household.resources.food = 20;
    // Standing on their own land rather than still coming in along the road, because a family
    // nobody is home to feed eats nothing at all.
    for (const id of household.members) { const person = world.entities[id]; person.travel = null; person.location = { ...person.location, siteId: household.homeSiteId }; }
    for (let i = 0; i < times; i++) advanceRoutine(world, each);
    return Math.round((20 - household.resources.food) * 10000) / 10000;
  };
  const [inSix, inOne] = [eaten(120, 6), eaten(720, 1)];
  assert.ok(inSix > 0.5, 'nobody ate anything in half a day');
  // Within a quarter of a percent: spoilage takes its share of what is left each time it is
  // asked, so six helpings of it compound a hair differently from one. Charged by the tick
  // instead of by the calendar, these would be six times apart rather than a rounding.
  assert.ok(Math.abs(inSix - inOne) < inSix / 100, `half a day cost ${inSix} in six ticks and ${inOne} in one`);
});
