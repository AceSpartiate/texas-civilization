// Houses: docs/SETTLING_IN.md §5, step 4.
//
// A family chooses a layout, sees what it needs and what it is good and bad at before choosing,
// builds it as ordinary work that several people can put in together, and then lives with its
// effects on rest and food. Every number is FIC-GONZ-024. See sim/houses.mjs.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, projectWorld, rollFamily, stepWorld, validateWorld } from '../sim/world.mjs';
import { choreAvailability, choresFor } from '../sim/chores.mjs';
import { tooYoung } from '../sim/family.mjs';
import { CAMP_REST_SHARE, CAMP_SPOILAGE_PER_DAY } from '../sim/settling.mjs';
import { CROWDED_SHARE, HOUSES, HOUSE_IDS, houseBuilt, shelterOf } from '../sim/houses.mjs';
import { REST_MILES_PER_MINUTE } from '../sim/routines.mjs';
import { createClassroom } from '../server/app.mjs';
import { createSettledWorld } from './support/settled.mjs';

const lobby = (seed = 'houses', count = 5) => createGonzalesWorld(seed, count);
const view = (world, householdId = 'hh-1') => projectWorld(world, householdId, 'student', { includeMap: false });
const plan = (world, layout, householdId = 'hh-1') => applyAction(world, householdId, { action: 'plan-house', layout });
const pack = (world, item, amount, householdId = 'hh-1') => applyAction(world, householdId, { action: 'load-wagon', item, amount });
const workersOf = (world, household) => household.members.map(id => world.entities[id]).filter(person => !tooYoung(person));

/** Start the class and step until this family has come in off the road. */
function arrive(world, household) {
  world.status = 'running';
  for (let tick = 0; tick < 60 && household.arriving; tick++) stepWorld(world);
  assert.equal(household.arriving, undefined, 'the family reached its land');
}
/** Send everybody old enough to work on the house, and step until it stands or `limit` ticks pass. */
function build(world, household, limit = 400) {
  const sent = workersOf(world, household);
  for (const person of sent) applyAction(world, household.id, { action: 'chore', entityId: person.id, chore: 'build-house' });
  const began = world.tick;
  for (let tick = 0; tick < limit && !houseBuilt(household); tick++) stepWorld(world);
  return { ticks: world.tick - began, sent };
}

test('every house says what it needs and what it is good and bad at, before it is chosen', () => {
  // FIC-GONZ-008: the trade-off is on the control, not discovered.
  assert.deepEqual(HOUSE_IDS, ['round-log', 'hewn-log', 'dog-run', 'jacal']);
  for (const house of Object.values(HOUSES)) {
    assert.ok(house.name && house.describe && house.good && house.bad, `${house.id} states itself`);
    assert.ok(Number.isInteger(house.work) && house.work > 0 && Number.isInteger(house.room) && house.room > 0);
  }
  // The order the spec asks for: a jacal is quickest, a dog-run the most work by far.
  const work = id => HOUSES[id].work;
  assert.ok(work('jacal') < work('round-log') && work('round-log') < work('hewn-log') && work('hewn-log') < work('dog-run'));
  assert.ok(work('dog-run') >= 1.5 * work('hewn-log'), 'the dog-run is the most work by far');
  assert.ok(HOUSES['hewn-log'].restShare > HOUSES['round-log'].restShare && HOUSES['hewn-log'].spoilagePerDay < HOUSES['round-log'].spoilagePerDay, 'hewn walls are tighter than round ones');
  assert.ok(HOUSES['dog-run'].room > HOUSES['round-log'].room && HOUSES.jacal.room < HOUSES['round-log'].room);
});

test('a house is chosen by the family, and refused in the server\'s words when it cannot be', () => {
  const world = lobby();
  const household = world.households['hh-1'];
  // The default wagon has a felling axe and no broadaxe.
  assert.throws(() => plan(world, 'hewn-log'), /broadaxe/);
  assert.throws(() => plan(world, 'a-castle'), /not a kind of house/);
  plan(world, 'round-log');
  assert.deepEqual(household.house, { layout: 'round-log', work: 0 });
  // A mind can be changed until work begins, and choosing writes nothing into the story.
  plan(world, 'jacal');
  assert.equal(household.house.layout, 'jacal');
  assert.equal(world.events.filter(event => event.householdId === 'hh-1' && event.type !== 'household-founded').length, 0);
  rollFamily(world, household);
  assert.ok(household.roll, 'choosing a house does not stop the family being rolled');
  // Leave the axe behind and only the jacal is left.
  pack(world, 'axe', 0);
  const choices = Object.fromEntries(view(world).land.choices.map(choice => [choice.id, choice]));
  assert.equal(choices.jacal.can, true);
  for (const id of ['round-log', 'hewn-log', 'dog-run']) assert.match(choices[id].why, /felling axe/, `${id} says what it wants`);
  // The words about each house are fetched once, not sent every tick.
  const wire = JSON.stringify(view(world));
  for (const house of Object.values(HOUSES)) assert.ok(!wire.includes(house.good), `${house.id}'s words are not on the tick`);
});

test('nobody can work on a house that has not been chosen, and the family builds it together', () => {
  const world = lobby('together');
  const household = world.households['hh-1'];
  arrive(world, household);
  const person = workersOf(world, household)[0];
  assert.deepEqual(choreAvailability(world, household, person, 'build-house'), { can: false, why: 'Choose a house to build first.' });
  plan(world, 'jacal');
  assert.equal(choreAvailability(world, household, person, 'build-house').can, true);
  const { sent } = build(world, household, 1);
  // A few ticks in, everybody who was sent is at it, and says which part of the house it is.
  for (let tick = 0; tick < 4; tick++) stepWorld(world);
  for (const worker of sent) assert.match(world.entities[worker.id].chore.doing, /posts|walls|thatch/);
  assert.ok(household.house.work > 0);
  assert.throws(() => plan(world, 'round-log'), /too late/);
  for (let tick = 0; tick < 200 && !houseBuilt(household); tick++) stepWorld(world);
  assert.ok(houseBuilt(household), 'the jacal stands');
  assert.equal(household.improvements.cabin, 'sound', 'the family has a roof');
  for (const worker of sent) assert.equal(world.entities[worker.id].chore, null, `${worker.name} stopped when the house was done`);
  assert.equal(household.house.work, HOUSES.jacal.work, 'nobody put in work past the end');
  assert.equal(world.events.filter(event => /jacal is finished/.test(event.text)).length, 1, 'finished once, and said once');
  // A family with a roof is not offered house work at all.
  assert.ok(!choresFor(world, household, person).some(entry => entry.id === 'build-house'));
  validateWorld(world);
});

test('more hands build faster, and a dog-run is hard for a family alone to finish before the news', () => {
  const alone = lobby('alone');
  const soloHousehold = alone.households['hh-1'];
  arrive(alone, soloHousehold);
  plan(alone, 'round-log');
  const one = workersOf(alone, soloHousehold)[0];
  applyAction(alone, 'hh-1', { action: 'chore', entityId: one.id, chore: 'build-house' });
  const soloStart = alone.tick;
  for (let tick = 0; tick < 600 && !houseBuilt(soloHousehold); tick++) stepWorld(alone);
  const soloTicks = alone.tick - soloStart;

  const together = lobby('alone');
  const household = together.households['hh-1'];
  arrive(together, household);
  plan(together, 'round-log');
  const { ticks } = build(together, household);
  assert.ok(houseBuilt(household));
  assert.ok(ticks < soloTicks * 0.6, `the whole family (${ticks} ticks) is much quicker than one of them (${soloTicks})`);

  // The notice is at tick 84. A family of four working on nothing else only just gets a dog-run up.
  const big = lobby('dog-run');
  const bigHousehold = big.households['hh-1'];
  arrive(big, bigHousehold);
  plan(big, 'dog-run');
  const { ticks: dogRunTicks } = build(big, bigHousehold);
  assert.ok(big.tick > 60, `a dog-run finished at tick ${big.tick} is not an easy house (${dogRunTicks} ticks of the whole family's work)`);
});

test('what a house does: rest and food, crowding, and the camp before it', () => {
  const world = lobby('effects');
  const household = world.households['hh-1'];
  assert.deepEqual(shelterOf(world, household), { kind: 'camp', restShare: CAMP_REST_SHARE, spoilagePerDay: CAMP_SPOILAGE_PER_DAY });
  pack(world, 'provisions', 2); pack(world, 'broadaxe', 1);
  plan(world, 'hewn-log');
  household.house.work = HOUSES['hewn-log'].work; household.improvements.cabin = 'sound';
  assert.deepEqual(shelterOf(world, household), { kind: 'house', layout: 'hewn-log', restShare: 1.15, spoilagePerDay: 0 });
  assert.deepEqual(view(world).land.home, { restShare: 1.15, spoilagePerDay: 0 }, 'the numbers are on the family\'s own land line');
  // The same family in a jacal is one too many for it.
  household.house.layout = 'jacal'; household.house.work = HOUSES.jacal.work;
  assert.ok(household.members.length > HOUSES.jacal.room);
  assert.deepEqual(shelterOf(world, household), { kind: 'house', layout: 'jacal', restShare: HOUSES.jacal.restShare * CROWDED_SHARE, spoilagePerDay: 0.01, crowded: true });
  validateWorld(world);

  // And it acts through the routine: a day at home in each shelter, from the same start.
  const restedIn = layout => {
    const copy = lobby('effects');
    const family = copy.households['hh-1'];
    for (const id of [...family.members, ...family.property]) { const e = copy.entities[id]; e.travel = null; e.location = { ...copy.map.sites[family.homeSiteId], siteId: family.homeSiteId }; if (e.kind === 'person') e.task = 'rest'; }
    delete family.arriving;
    if (layout) { family.house = { layout, work: HOUSES[layout].work }; family.improvements.cabin = 'sound'; }
    const person = copy.entities[family.principalId];
    person.exertion = 30; family.resources.food = 20;
    copy.status = 'running';
    stepWorld(copy);
    return { mended: 30 - person.exertion, food: family.resources.food };
  };
  const camp = restedIn(null), round = restedIn('round-log'), hewn = restedIn('hewn-log');
  const tick = REST_MILES_PER_MINUTE * 20;
  assert.ok(Math.abs(camp.mended - tick * CAMP_REST_SHARE) < 1e-3, 'the camp mends at its share');
  assert.ok(Math.abs(round.mended - tick * 0.85) < 1e-3 && Math.abs(hewn.mended - tick * 1.15) < 1e-3, 'each house mends at its own');
  assert.ok(hewn.food > round.food && round.food > camp.food, 'food keeps best in the tight house and worst in the camp');
});

test('a neighbour\'s land is known as it was last seen, not as it is', () => {
  const world = lobby('neighbours');
  const [mine, theirs] = [world.households['hh-1'], world.households['hh-2']];
  arrive(world, theirs); arrive(world, mine);
  plan(world, 'jacal', 'hh-2');
  build(world, theirs);
  assert.ok(houseBuilt(theirs));
  assert.equal(mine.seenLand?.[theirs.homeSiteId], undefined, 'nobody from hh-1 has been to look');
  // Somebody from hh-1 goes and stands on hh-2's land.
  const visitor = world.entities[mine.principalId];
  visitor.chore = null; visitor.travel = null;
  visitor.location = { ...world.map.sites[theirs.homeSiteId], siteId: theirs.homeSiteId };
  stepWorld(world);
  assert.equal(mine.seenLand[theirs.homeSiteId].shelter, 'house');
  assert.equal(mine.seenLand[theirs.homeSiteId].layout, 'jacal');
  // What hh-1 knows of hh-2 rides in hh-1's own household. hh-2's own house record - how far its
  // work has got, to the spell - is hh-2's and never on hh-1's wire.
  const wire = view(world, 'hh-1');
  assert.equal(wire.household.seenLand[theirs.homeSiteId].layout, 'jacal');
  assert.equal(wire.household.house, undefined, 'hh-1 has chosen no house of its own');
  assert.doesNotMatch(JSON.stringify(wire), /"work":24/, 'the neighbour’s count of work is not on this family’s wire');
  validateWorld(world);
});

test('a class saved before houses has the cabin it always had, and plays as it did', () => {
  const world = createSettledWorld('old-houses', 5);
  world.status = 'running';
  const household = world.households['hh-1'];
  assert.equal(household.house, undefined);
  assert.deepEqual(shelterOf(world, household), { kind: 'house', restShare: 1, spoilagePerDay: 0 }, 'the ordinary rate and nothing spoiling, as always');
  assert.throws(() => plan(world, 'round-log'), /already has a roof/);
  assert.equal(view(world).land.choices, undefined, 'no house to choose');
  validateWorld(world);
});

test('a house record that cannot be true is refused by validation', () => {
  for (const [label, corrupt] of [
    ['unknown layout', household => { household.house = { layout: 'castle', work: 0 }; }],
    // Roofed, so only the count of work is wrong and no other rule can catch it first.
    ['work past the end', household => { household.house = { layout: 'jacal', work: HOUSES.jacal.work + 1 }; household.improvements = { ...household.improvements, cabin: 'sound' }; }],
    ['finished with no roof', household => { household.house = { layout: 'jacal', work: HOUSES.jacal.work }; }],
    ['remembered land that is not a place', household => { household.seenLand = { nowhere: { shelter: 'house', minute: 0 } }; }],
  ]) {
    const world = lobby('invalid-house');
    corrupt(world.households['hh-1']);
    assert.throws(() => validateWorld(world), /house|roof|land/i, label);
  }
});

test('a student chooses a house over the wire, and reads the houses once', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'texas-houses-'));
  const app = createClassroom({ seed: 'houses-http', savePath: join(dir, 'save.json'), tickMs: 10, worldFactory: createGonzalesWorld });
  const port = await app.listen();
  const call = async (path, data, cookie) => {
    const response = await fetch(`http://127.0.0.1:${port}${path}`, { method: data ? 'POST' : 'GET', headers: { ...(data && { 'Content-Type': 'application/json' }), ...(cookie && { Cookie: cookie }) }, ...(data && { body: JSON.stringify(data) }) });
    return { status: response.status, body: await response.json(), cookie: response.headers.get('set-cookie')?.split(';')[0] };
  };
  try {
    const student = await call('/api/join', { name: 'Builder', code: app.state.sessionCode });
    const houses = (await call('/api/chores', null, student.cookie)).body.houses;
    assert.deepEqual(houses.map(house => house.id), HOUSE_IDS);
    assert.ok(houses.every(house => house.good && house.bad));
    assert.equal((await call('/api/command', { id: 'plan-house-0001', action: 'plan-house', layout: 'round-log' }, student.cookie)).status, 200);
    assert.equal(app.state.world.households[student.body.world.householdId].house.layout, 'round-log');
    const refused = await call('/api/command', { id: 'plan-house-0002', action: 'plan-house', layout: 'hewn-log' }, student.cookie);
    assert.equal(refused.status, 400);
    assert.match(refused.body.error, /broadaxe/);
  } finally { await app.close(); rmSync(dir, { recursive: true, force: true }); }
});
