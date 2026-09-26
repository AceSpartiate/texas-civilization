// Travis's runner and the fates of the Alamo by role and place (owner, 2026-09-22; docs/ALAMO_FATES.md,
// docs/MILITARY_EXPERIENCE.md step 1). Each test here guards one rule and is proved by a mutation that fails it and no
// other (scripts/military-regression-check.mjs).
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, projectWorld, rollFamily, stepWorld, validateWorld } from '../sim/world.mjs';
import { beginSecondPeriod } from '../sim/periods.mjs';
import { momentOf } from '../sim/directors.mjs';
import { COURIER_CHOSEN, askCouriers, share } from '../sim/alamo.mjs';
import { BESIDE_FEET, RUNNER_FEET_PER_TICK, TRAVIS_DOOR, onMap, runnerOf, runnerOpening } from '../sim/alamo-runner.mjs';
import { alamoOnMap } from '../public/bexar-layout.js';

const view = (world, householdId) => projectWorld(world, householdId, 'student', { includeMap: false });
const until = (world, done, limit = 9000) => { for (let t = 0; t < limit && !done() && world.status === 'running'; t++) stepWorld(world); };
const untilMoment = (world, key) => until(world, () => world.director.milestones[key]);
const feet = (a, b) => Math.hypot(a.x - b.x, a.y - b.y) * 5280;

let shared = null;
/** A real-land class with rolled families, through the first period and into the winter to the morning of its news. */
const winter = () => structuredClone(shared ??= (() => {
  const world = createGonzalesWorld('alamo-runner-class', 8, { map: 'colonies' });
  for (const household of Object.values(world.households)) rollFamily(world, household);
  world.status = 'running';
  until(world, () => world.director.complete);
  beginSecondPeriod(world);
  world.status = 'running';
  until(world, () => world.director.milestones['winter-news']);
  return world;
})());
const alive = person => !['dead', 'captured'].includes(person.health.condition);
const men = world => Object.values(world.entities).filter(person => person.householdId && person.kind === 'person' && person.sex === 'male' && (person.age ?? 30) >= 16 && alive(person));
const women = world => Object.values(world.entities).filter(person => person.householdId && person.kind === 'person' && person.sex === 'female' && person.kin?.role === 'mother' && alive(person));
const boys = world => Object.values(world.entities).filter(person => person.householdId && person.kind === 'person' && person.sex === 'male' && person.age >= 4 && person.age < 16 && alive(person));
/** One man from each of `count` different families. */
const menOfFamilies = (world, count, pick = () => true) => {
  const seen = new Set(), chosen = [];
  for (const person of men(world)) if (!seen.has(person.householdId) && pick(person)) { seen.add(person.householdId); chosen.push(person); }
  return chosen.slice(0, count);
};
/** Put somebody in the garrison at Béxar, for a family somebody plays. */
const garrison = (world, person, played = true) => {
  const site = world.map.sites.bexar;
  Object.assign(person, { travel: null, chore: null, task: 'rest', location: { x: site.x, y: site.y, siteId: 'bexar' } });
  person.service = { kind: 'garrison', status: 'serving', since: world.minute, siteId: 'bexar' };
  if (played) world.households[person.householdId].played = true;
};
/** Somebody standing at Béxar, not in the garrison, whom the siege shuts in with it. */
const atBexar = (world, person) => {
  const site = world.map.sites.bexar;
  Object.assign(person, { travel: null, chore: null, task: 'rest', location: { x: site.x, y: site.y, siteId: 'bexar' } });
  world.households[person.householdId].played = true;
};

test('the simulation lays the Alamo where the map draws it', () => {
  const world = { map: { sites: { bexar: { x: 10, y: 20 } } } };
  for (const feet of [{ x: 0, y: 0 }, TRAVIS_DOOR, { x: 180, y: 420 }, { x: 396, y: 405 }]) {
    const drawn = alamoOnMap(feet), laid = onMap(world, feet);
    assert.ok(Math.hypot(laid.x - 10 - drawn.x, laid.y - 20 - drawn.y) * 5280 < 0.01, `the simulation and the map put ${JSON.stringify(feet)} in different places`);
  }
});

test('Travis\'s runner walks from the colonel\'s door, and the question opens only when he stands beside the person', () => {
  const world = winter();
  const [man] = menOfFamilies(world, 1);
  garrison(world, man);
  untilMoment(world, 'alamo-siege');
  // Since 2026-09-25 he walks in from the town to his post on the walls rather than being set down in the fort (sim/alamo-posts.mjs).
  until(world, () => !man.service.walk, 60);
  assert.equal(man.location.siteId, 'bexar');
  assert.ok(feet(man.location, world.map.sites.bexar) > 1000, 'shut in the Alamo but standing in the town\'s plaza');
  // The far end of the compound's plaza, so the walk takes several ticks.
  man.location = onMap(world, { x: 180, y: 420 });
  untilMoment(world, 'courier-1-opens');
  const runner = runnerOf(world, man);
  assert.ok(runner, 'no runner was sent');
  assert.ok(feet(runner.location, onMap(world, TRAVIS_DOOR)) < 1, 'the runner did not start at the colonel\'s door');
  assert.equal(man.service.courier, 'coming');
  assert.throws(() => applyAction(world, man.householdId, { action: 'alamo-courier', entityId: man.id, answer: 'volunteer' }), /not reached/);
  const start = feet(runner.location, man.location);
  stepWorld(world);
  assert.ok(Math.abs(start - feet(runner.location, man.location) - RUNNER_FEET_PER_TICK) < 0.5, 'the runner did not walk one tick of the way');
  assert.equal(man.service.courier, 'coming', 'the question opened before the runner got there');
  until(world, () => man.service.courier === 'open', 20);
  assert.ok(feet(runner.location, man.location) <= BESIDE_FEET + 0.5, 'the question opened with the runner still across the plaza');
  const meeting = view(world, man.householdId).encounter;
  assert.equal(meeting.kind, 'alamo-runner');
  assert.equal(meeting.listenerId, man.id);
  assert.match(meeting.said[0].text, /leaves the fort tonight/, 'the runner did not say that going is a way out of the fort');
  assert.deepEqual(meeting.choices.map(choice => choice.answer), ['volunteer', 'stay']);
  assert.match(meeting.ifUnanswered, /decided for/, 'the fallback was not said before it could happen');
  validateWorld(world);
});

test('only the family the runner speaks to hears him; another family inside the Alamo sees a man cross the plaza and nothing he says', () => {
  const world = winter();
  const [man, other] = menOfFamilies(world, 2);
  garrison(world, man);
  // A family nobody plays: inside with the garrison, and never asked.
  garrison(world, other, false);
  untilMoment(world, 'alamo-siege');
  untilMoment(world, 'courier-1-opens');
  until(world, () => man.service.courier === 'open', 20);
  const theirs = view(world, other.householdId);
  const runner = runnerOf(world, man);
  const seen = theirs.others.find(one => one.id === runner.id);
  assert.ok(seen, 'the other family inside could not see the runner crossing the plaza');
  assert.ok(!('runner' in seen) && !('said' in seen), 'whom the runner was sent to rode the wire');
  assert.ok(!theirs.encounter || theirs.encounter.listenerId !== man.id, 'the other family was given the meeting');
  assert.doesNotMatch(JSON.stringify(theirs), /Colonel Travis is sending|offer to go/, 'the runner\'s words reached a family he did not speak to');
  assert.match(JSON.stringify(view(world, man.householdId)), /offer to go/);
});

test('an answer closes the meeting in words, and the runner walks back to the colonel\'s door', () => {
  const world = winter();
  const [man] = menOfFamilies(world, 1);
  garrison(world, man);
  untilMoment(world, 'alamo-siege');
  untilMoment(world, 'courier-1-opens');
  until(world, () => man.service.courier === 'open', 20);
  applyAction(world, man.householdId, { action: 'alamo-courier', entityId: man.id, answer: 'volunteer' });
  const meeting = Object.values(world.encounters).find(one => one.kind === 'alamo-runner' && one.listenerId === man.id);
  assert.equal(meeting.status, 'closed');
  assert.equal(meeting.reason, 'answered');
  assert.ok(meeting.said.some(line => line.speaker === 'listener' && /I will go/.test(line.text)), 'the answer was not said to the runner');
  const runner = runnerOf(world, man);
  assert.equal(runner.runner.phase, 'returning', 'the runner did not turn back');
  until(world, () => runner.runner.phase === 'waiting', 20);
  assert.ok(feet(runner.location, onMap(world, TRAVIS_DOOR)) < 1, 'the runner did not get back to the colonel\'s door');
  validateWorld(world);
});

test('a woman or a child shut inside is not asked to carry Travis\'s letters', () => {
  const world = winter();
  const woman = women(world)[0], boy = boys(world)[0];
  assert.ok(woman && boy, 'the class has no mother or no boy under sixteen to shut in');
  atBexar(world, woman); atBexar(world, boy);
  untilMoment(world, 'alamo-siege');
  assert.equal(woman.service?.besieged, true);
  untilMoment(world, 'courier-1-opens');
  for (const person of [woman, boy]) {
    assert.equal(person.service.courier, undefined, `${person.name} was asked to ride out`);
    assert.equal(runnerOf(world, person), null, `a runner was sent to ${person.name}`);
  }
});

test('a family on auto or whose student has gone is answered at once, and no runner walks to them', () => {
  const world = winter();
  const [onAuto, gone] = menOfFamilies(world, 2);
  garrison(world, onAuto); garrison(world, gone);
  onAuto.auto = true;
  world.households[gone.householdId].absent = true;
  untilMoment(world, 'alamo-siege');
  untilMoment(world, 'courier-1-opens');
  for (const person of [onAuto, gone]) {
    assert.ok(['volunteered', 'stays'].includes(person.service.courier), `${person.name} was left waiting: ${person.service.courier}`);
    assert.equal(runnerOf(world, person), null, `a runner walked to ${person.name}, whom nobody is watching`);
  }
});

test('the dead and the captured are not asked', () => {
  const world = winter();
  const [dead, taken] = menOfFamilies(world, 2);
  garrison(world, dead); garrison(world, taken);
  untilMoment(world, 'alamo-siege');
  dead.health = { condition: 'dead' };
  taken.health = { condition: 'captured' };
  const asked = askCouriers(world, 'courier-1');
  assert.equal(asked, 0, 'somebody dead or taken was sent a runner');
  for (const person of [dead, taken]) assert.equal(person.service.courier, undefined, `${person.name} was asked`);
});

test('a courier who has gone out is never asked again or sent twice', () => {
  const world = winter();
  const [man] = menOfFamilies(world, 1, person => share(world, person.id, 'courier-1') < COURIER_CHOSEN);
  assert.ok(man, 'nobody in the class whom Travis would choose on the first night');
  garrison(world, man);
  untilMoment(world, 'alamo-siege');
  untilMoment(world, 'courier-1-opens');
  until(world, () => man.service.courier === 'open', 20);
  applyAction(world, man.householdId, { action: 'alamo-courier', entityId: man.id, answer: 'volunteer' });
  untilMoment(world, 'courier-1');
  assert.equal(man.service.courier, 'sent');
  untilMoment(world, 'courier-2-opens');
  assert.equal(man.service.courier, 'sent', 'a courier already gone out was asked again');
  untilMoment(world, 'courier-2');
  assert.equal(world.events.filter(event => event.actorId === man.id && /slipped out through the Mexican lines/.test(event.text)).length, 1, 'the courier left twice');
});

test('nobody is asked twice on the same day', () => {
  const world = winter();
  const [man] = menOfFamilies(world, 1);
  garrison(world, man);
  untilMoment(world, 'alamo-siege');
  untilMoment(world, 'courier-1-opens');
  until(world, () => man.service.courier === 'open', 20);
  applyAction(world, man.householdId, { action: 'alamo-courier', entityId: man.id, answer: 'stay' });
  assert.equal(askCouriers(world, 'courier-1'), 0, 'the runner was sent again the same day');
  assert.equal(man.service.courier, 'stays');
});

test('on a later day Travis sends riders, a volunteer passed over and a man who stayed are both asked again', () => {
  const world = winter();
  const [passed, stayer] = menOfFamilies(world, 2, person => share(world, person.id, 'courier-1') >= COURIER_CHOSEN);
  garrison(world, passed); garrison(world, stayer);
  untilMoment(world, 'alamo-siege');
  untilMoment(world, 'courier-1-opens');
  until(world, () => passed.service.courier === 'open' && stayer.service.courier === 'open', 20);
  applyAction(world, passed.householdId, { action: 'alamo-courier', entityId: passed.id, answer: 'volunteer' });
  applyAction(world, stayer.householdId, { action: 'alamo-courier', entityId: stayer.id, answer: 'stay' });
  untilMoment(world, 'courier-1');
  assert.equal(passed.service.courier, 'passed');
  untilMoment(world, 'courier-2-opens');
  for (const person of [passed, stayer]) assert.equal(person.service.courier, 'coming', `${person.name} was not asked again on the next day`);
  until(world, () => passed.service.courier === 'open', 20);
  const meeting = Object.values(world.encounters).find(one => one.kind === 'alamo-runner' && one.listenerId === passed.id && one.status === 'open');
  assert.match(meeting.said[0].text, /You offered before/, 'the runner did not say the earlier offer was remembered');
});

test('what the runner says on the last night says the chance may not come again, and every night says going leaves the fort', () => {
  for (const day of ['courier-1', 'courier-2', 'courier-3', 'courier-4']) assert.match(runnerOpening(day, false), /leaves the fort tonight/);
  assert.match(runnerOpening('courier-4', false), /may not be many more chances/);
  assert.doesNotMatch(runnerOpening('courier-4', false), /kill|die|death|killed|fall/i, 'the runner foretold the fall');
});

test('at the assault a fighter inside is killed and a woman and a boy are spared; a courier sent out lives; no family sees it before the word', () => {
  const world = winter();
  const gonzales = new Set(Object.values(world.households).filter(household => household.settlementId === 'gonzales').map(household => household.id));
  const [courier] = menOfFamilies(world, 1, person => share(world, person.id, 'courier-1') < COURIER_CHOSEN);
  const [fighter] = menOfFamilies(world, 1, person => gonzales.has(person.householdId) && person.householdId !== courier?.householdId);
  const woman = women(world).find(person => ![courier?.householdId, fighter?.householdId].includes(person.householdId));
  const boy = boys(world).find(person => person.householdId !== courier?.householdId);
  assert.ok(courier && fighter && woman && boy, 'the class has not the people this needs');
  garrison(world, fighter); garrison(world, courier); atBexar(world, woman); atBexar(world, boy);
  untilMoment(world, 'alamo-siege');
  untilMoment(world, 'courier-1-opens');
  until(world, () => courier.service.courier === 'open', 20);
  applyAction(world, courier.householdId, { action: 'alamo-courier', entityId: courier.id, answer: 'volunteer' });
  // The others are left to the fallback; whatever it decides, they are inside.
  untilMoment(world, 'courier-1');
  assert.equal(courier.service.courier, 'sent');
  untilMoment(world, 'alamo-assault');
  // Each fate falls at its own moment inside the assault since 2026-09-25 (sim/alamo-battle.mjs): the morning is over by seven.
  until(world, () => world.minute >= momentOf(world, 'alamo-assault') + 120);
  // Whoever is still inside at the assault; somebody the fallback sent out with the letters is not.
  for (const person of [fighter, woman, boy]) {
    if (!person.service.besieged) continue;
    assert.equal(person.service.fate, person === fighter ? 'fell' : 'spared', `${person.name}'s fate did not follow what they were there as (${person === boy ? 'a boy under sixteen' : person === woman ? 'a woman' : 'a fighter'})`);
  }
  assert.equal(courier.service.fate, undefined, 'a courier sent out was given a fate inside the walls');
  assert.notEqual(view(world, fighter.householdId).entities.find(e => e.id === fighter.id).health.condition, 'dead', 'the family saw the death before any word came');
  untilMoment(world, 'fall-colonies');
  assert.equal(courier.health.condition === 'dead', false, 'a courier sent out died in the fall');
  if (boy.service.fate === 'spared') assert.ok(world.events.some(event => event.actorId === boy.id && /women and children spared/.test(event.text)), 'the boy\'s family was not told he was spared');
  validateWorld(world);
});

test('when Santa Anna is said to be marching, a family with somebody in the garrison is told they can still send for them', () => {
  const world = winter();
  const [inside, home] = menOfFamilies(world, 2);
  garrison(world, inside);
  untilMoment(world, 'santa-anna-rumour');
  assert.ok(world.events.some(event => event.actorId === inside.id && /can still be sent for/.test(event.text)), 'the family was not told the way out while it was open');
  assert.ok(!world.events.some(event => event.actorId === home.id && /can still be sent for/.test(event.text)), 'somebody not in the garrison was warned');
});
