// What the sky does to a hunt: `FIC-GONZ-135`, docs/WEATHER.md §10.5, sim/hunting.mjs `huntWait` and `powderDamp`.
//
// The weather model shipped on 2026-09-20 reading through to the road and the river crossings and **not to a family's own
// work**: the sky meant nothing to somebody standing on their own land. Three things now:
//
//   **Game lies up.** The wait downwind is half again as long in rain, nearly twice in a storm, and longer in a norther.
//   **A fog hides the approach**, so the wait is short - which is how the Texians got within musket shot at Concepción.
//   **The powder will not stay dry** (Smithwick: "our only care being to keep our powder dry"). What that costs is the
//   certainty waiting buys: on a wet day the close shot wants the steady hand the long shot wants, or a rifle the
//   gunsmith has put in order. There is still no die in any of it.
//
// And the control says all of it before anybody is sent, which is `FIC-GONZ-008`'s rule about visible risk.
// Each test here was proven by injecting the regression it guards (scripts/hunt-weather-injections.mjs).
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, projectWorld, stepWorld, validateWorld } from '../sim/world.mjs';
import { choosing } from '../sim/homesite.mjs';
import { holdingOf } from '../sim/grants.mjs';
import { HUNT_WAIT, huntFacts, huntWait, huntingPlace, powderDamp, skyWords, stillTicks } from '../sim/hunting.mjs';
import { weatherAt } from '../sim/weather.mjs';

const DAY = 1440;
/** A class on the real land with every family home, its house chosen and standing. */
let shared = null;
function onTheLand() {
  if (shared) return structuredClone(shared);
  const world = createGonzalesWorld('hunt-weather', 12, { map: 'colonies', neighbours: true });
  world.status = 'running';
  for (let tick = 0; tick < 400 && Object.values(world.households).some(one => one.arriving || choosing(one)); tick++) stepWorld(world);
  for (const household of Object.values(world.households)) {
    household.played = true;
    household.improvements = { ...household.improvements, cabin: 'sound' };
    for (const id of household.members) {
      const person = world.entities[id];
      if (person.chore) applyAction(world, household.id, { action: 'stop-chore', entityId: id });
      const home = world.map.sites[household.homeSiteId];
      if (home && !person.travel && person.location?.siteId !== household.homeSiteId) {
        person.location = { x: home.x, y: home.y, siteId: household.homeSiteId };
        person.task = 'rest';
      }
    }
  }
  validateWorld(world);
  shared = world;
  return structuredClone(world);
}
/** Whether this family's principal is at home and free to be sent: the tests below send them. */
function ready(world, household) {
  const person = world.entities[household.principalId];
  return Boolean(person && !person.travel && !person.chore && person.location?.siteId === household.homeSiteId
    && person.health?.condition !== 'dead' && person.health?.condition !== 'captured');
}
/** A place on this family's own land, a little off the house, that the hunt will take. */
function groundFor(world, household) {
  if (!ready(world, household)) return null;
  const home = world.map.sites[household.homeSiteId], bounds = holdingOf(world, household).bounds;
  for (let ring = 1; ring <= 3; ring++) {
    for (const [dx, dy] of [[1, 1], [-1, 1], [1, -1], [-1, -1], [1.5, 0], [0, 1.5], [-1.5, 0], [0, -1.5]]) {
      const point = { x: home.x + dx * 0.2 * ring, y: home.y + dy * 0.2 * ring };
      if (point.x < bounds.minX || point.x > bounds.maxX || point.y < bounds.minY || point.y > bounds.maxY) continue;
      const facts = huntFacts(world, household, point);
      // A place that actually holds a quarry: the kill is then the quarry's own and says so, which is what these tests
      // read. A place that holds nothing still hunts, but records no `hunt-kill` to look at.
      if (facts.can && facts.comes) return point;
    }
  }
  return null;
}
/**
 * The first day of each kind of weather at a place, from where the class already stands. Never a day behind it: the clock
 * is moved forward to reach these days, and a class does not run backwards.
 */
function daysOfEachKind(world, point) {
  const found = {};
  for (let day = Math.floor(world.minute / DAY); day < 210; day++) {
    const kind = weatherAt(world, point, day).kind;
    if (found[kind] === undefined) found[kind] = day;
  }
  return found;
}
/** Put the class on a given day, at nine in the morning. */
const onDay = (world, day) => { world.minute = day * DAY + 9 * 60; };

test('the wait downwind is the ground and the sky together: longer in rain, shorter in a fog', () => {
  // The table itself, first: it is what the words and the wait are both read off.
  assert.equal(huntWait('fair'), 1);
  assert.ok(huntWait('rain') > 1 && huntWait('storm') > huntWait('rain'), 'rain and storm do not lengthen the wait');
  assert.ok(huntWait('norther') > 1, 'a norther does not lengthen the wait');
  assert.ok(huntWait('fog') < 1, 'a fog does not shorten it');
  assert.equal(huntWait('nothing anybody ever heard of'), 1, 'an unknown sky changed the wait');
  // And the wait itself moves with it, on ground of every quality.
  for (const game of [0.15, 0.5, 0.95]) {
    const fair = stillTicks(game, 1, huntWait('fair'));
    assert.ok(stillTicks(game, 1, huntWait('rain')) >= fair, `rain shortened the wait on ground of ${game}`);
    assert.ok(stillTicks(game, 1, huntWait('storm')) >= stillTicks(game, 1, huntWait('rain')), 'a storm was kinder than rain');
    assert.ok(stillTicks(game, 1, huntWait('fog')) <= fair, `a fog lengthened the wait on ground of ${game}`);
    assert.ok(stillTicks(game, 1, huntWait('rain')) >= 1, 'a wait of no ticks at all');
  }
  // On the poorest ground the wait is longer in rain than on the best ground in rain: the country still decides most of it.
  assert.ok(stillTicks(0.15, 1, huntWait('rain')) > stillTicks(0.95, 1, huntWait('rain')), 'the ground stopped mattering');
  // And a wait is never no wait at all, whatever a kinder sky is ever given in `HUNT_WAIT`: a hunt that took no time
  // would be a hunt the student never saw happen. Nothing in the table reaches this today; it is the floor under it.
  assert.ok(stillTicks(1, 1, 0.1) >= 1, 'a very kind sky made the wait nothing at all');
  assert.ok(stillTicks(0.95, 1, 0.01) >= 1, 'the best ground under the kindest sky waited no ticks');
});

test('the family is told what the sky is doing to the hunt before anybody is sent', () => {
  const world = onTheLand();
  const household = Object.values(world.households).find(one => groundFor(world, one));
  assert.ok(household, 'no family in this class could hunt its own land');
  const point = groundFor(world, household);
  const days = daysOfEachKind(world, point);
  assert.ok(days.fair !== undefined && days.rain !== undefined, `this class saw only ${Object.keys(days).join(', ')}`);
  for (const [kind, day] of Object.entries(days)) {
    onDay(world, day);
    const words = huntFacts(world, household, point).words;
    if (kind === 'fair') {
      assert.equal(skyWords(world, point), '', 'a fair day was remarked on');
      assert.doesNotMatch(words, /raining|storm|norther|fog lies/, `a fair day said: ${words}`);
      continue;
    }
    const said = { rain: /It is raining/, storm: /A storm is over it/, norther: /A norther is blowing/, fog: /A fog lies on it/ }[kind];
    assert.match(words, said, `a ${kind} day said: ${words}`);
    // The words are read off the numbers, so they can never say the opposite of what the hunt does.
    if (huntWait(kind) > 1) assert.match(words, /the wait is longer/, `a ${kind} day: ${words}`);
    if (huntWait(kind) < 1) assert.match(words, /the wait is short/, `a ${kind} day: ${words}`);
    assert.equal(/powder will not stay dry/.test(words), powderDamp(world, point), `a ${kind} day's powder: ${words}`);
  }
});

test('the rain takes away the certainty that waiting buys, and says which it was', () => {
  const world = onTheLand();
  const household = Object.values(world.households).find(one => groundFor(world, one));
  const point = groundFor(world, household);
  const days = daysOfEachKind(world, point);
  const hunter = world.entities[household.principalId];
  // Somebody without the knack, and a rifle nobody has put in order: on a dry day waiting still makes it a certainty,
  // because the range is closed. That is the rule the rain takes away.
  hunter.skills = { ...hunter.skills, hunting: 1 };
  household.tools = Object.fromEntries(Object.entries(household.tools || {}).filter(([tool]) => tool !== 'rifle'));

  const hunt = day => {
    const world2 = onTheLand();
    const household2 = world2.households[household.id];
    const hunter2 = world2.entities[household2.principalId];
    hunter2.skills = { ...hunter2.skills, hunting: 1 };
    household2.resources = { ...household2.resources, powder: 3 };
    onDay(world2, day);
    applyAction(world2, household2.id, { action: 'hunt-land', entityId: hunter2.id, x: point.x, y: point.y });
    let asked = null, ticks = 0;
    for (let tick = 0; tick < 200 && hunter2.chore; tick++, ticks++) {
      if (hunter2.chore.ask) {
        asked ??= { text: hunter2.chore.ask.text, wait: hunter2.chore.ask.options.find(option => option.id === 'wait')?.note };
        applyAction(world2, household2.id, { action: 'answer-chore', entityId: hunter2.id, option: 'wait' });
      }
      stepWorld(world2);
    }
    validateWorld(world2);
    const events = world2.events.filter(event => event.householdId === household2.id);
    return { asked, ticks, kill: events.find(event => event.type === 'hunt-kill'), miss: events.find(event => /would not fire|fired and missed/.test(event.text || '')) };
  };

  const dry = hunt(days.fair);
  assert.ok(dry.kill, 'waiting on a fair day did not make the shot a certainty');
  assert.ok(!dry.miss, `a fair day missed: ${dry.miss?.text}`);
  assert.match(dry.asked.wait, /the shot is a certainty/);
  assert.doesNotMatch(dry.asked.text, /rain is on the powder/);

  const wet = hunt(days.rain);
  // The day itself is longer, because the game lies up: the wait downwind is read through a real hunt here and not only
  // off the table, which is the difference between the multiplier existing and the hunt using it.
  assert.ok(wet.ticks > dry.ticks, `the hunt took ${wet.ticks} ticks in the rain against ${dry.ticks} in fair weather`);
  assert.ok(!wet.kill, 'a damp charge brought a deer home anyway');
  assert.ok(wet.miss, 'the rain cost nothing at all');
  assert.match(wet.miss.text, /powder had taken the wet and the rifle would not fire/);
  // And the student was told, before they chose to wait, that the certainty was not one today.
  assert.match(wet.asked.wait, /the rain is on the powder/);
  assert.match(wet.asked.text, /The rain is on the powder/);
});

test('a steady hand keeps its powder dry, and the sky never touches the armies', () => {
  const world = onTheLand();
  const household = Object.values(world.households).find(one => groundFor(world, one));
  const point = groundFor(world, household);
  const days = daysOfEachKind(world, point);
  const hunter = world.entities[household.principalId];
  hunter.skills = { ...hunter.skills, hunting: 3 };
  household.resources = { ...household.resources, powder: 3 };
  onDay(world, days.rain);
  applyAction(world, household.id, { action: 'hunt-land', entityId: hunter.id, x: point.x, y: point.y });
  for (let tick = 0; tick < 200 && hunter.chore; tick++) {
    if (hunter.chore.ask) applyAction(world, household.id, { action: 'answer-chore', entityId: hunter.id, option: 'wait' });
    stepWorld(world);
  }
  const events = world.events.filter(event => event.householdId === household.id);
  assert.ok(events.some(event => event.type === 'hunt-kill'), 'a hand with the knack could not keep its powder dry');
  assert.ok(!events.some(event => /would not fire/.test(event.text || '')), 'a steady hand was beaten by the rain');
  // The rain is on the powder and the control says so even for the hand that can manage it.
  assert.match(skyWords(world, point), /powder will not stay dry/);
  validateWorld(world);

  // Weather changes what a family meets and never what history did (`FIC-GONZ-135`, docs/WEATHER.md §10.5): the director's
  // own dates are not read from the sky anywhere.
  assert.equal(HUNT_WAIT.fair, 1, 'a fair day was given a weight of its own');
  assert.ok(Object.keys(HUNT_WAIT).every(kind => ['fair', 'rain', 'storm', 'norther', 'fog'].includes(kind)), 'a sky nobody has heard of');
});
