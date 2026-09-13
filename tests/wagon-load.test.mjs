// The wagon load: docs/SETTLING_IN.md §4, step 3.
//
// Students choose what goes in the wagon, within its space, in the lobby after the roll.
// Anything not loaded is not in the game. A student who never loads has a sensible default.
// Every item and number is invented (`FIC-GONZ-024`). See sim/wagon.mjs.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, projectWorld, rollFamily, stepWorld, validateWorld, STARTING_POWDER } from '../sim/world.mjs';
import { WAGON_ITEMS, WAGON_SPACE, defaultLoad, spaceOf, wagonItem } from '../sim/wagon.mjs';
import { COIN, choreAvailability } from '../sim/chores.mjs';
import { settle } from './support/settled.mjs';
import { createClassroom } from '../server/app.mjs';

const lobby = (seed = 'wagon', count = 5) => createGonzalesWorld(seed, count);
const view = (world, householdId = 'hh-1') => projectWorld(world, householdId, 'student', { includeMap: false });
const load = (world, item, amount, householdId = 'hh-1') => applyAction(world, householdId, { action: 'load-wagon', item, amount });
const amountOf = (household, id) => household.load.find(entry => entry.id === id)?.amount ?? 0;

test('a family that never loads has a sensible default, and its stores are exactly what that wagon holds', () => {
  const world = lobby();
  for (const household of Object.values(world.households)) {
    const barrels = amountOf(household, 'provisions');
    assert.ok([3, 4].includes(barrels), 'three or four barrels of meal');
    assert.ok(spaceOf(household.load) <= WAGON_SPACE, 'the default fits the wagon it is packed in');
    assert.deepEqual(household.resources, { food: barrels * 4, seed: 2, powder: STARTING_POWDER, money: 0 });
    assert.deepEqual(household.tools, { hoe: 0, axe: 0 }, 'a felling axe, and a hoe');
    assert.deepEqual(household.belongings, ['bedding', 'pot']);
  }
  assert.ok(new Set(Object.values(world.households).map(h => h.resources.food)).size > 1, 'the families did not all bring the same meal');
});

test('anything not loaded is not in the game', () => {
  const world = lobby();
  const household = world.households['hh-1'];
  for (const entry of [...household.load]) load(world, entry.id, 0);
  assert.deepEqual(household.load, []);
  assert.deepEqual({ food: household.resources.food, seed: household.resources.seed, powder: household.resources.powder }, { food: 0, seed: 0, powder: 0 });
  assert.deepEqual(household.tools, {}, 'nothing brought, nothing in the house');
  assert.deepEqual(household.belongings, []);
  validateWorld(world);
});

test('what the family has follows the load both ways, and is never added up twice', () => {
  const world = lobby();
  const household = world.households['hh-1'];
  load(world, 'provisions', 5);
  load(world, 'provisions', 2);
  assert.equal(household.resources.food, 8, 'two barrels after five-then-two is two barrels');
  load(world, 'broadaxe', 1);
  assert.equal(household.tools.broadaxe, 0, 'a loaded tool is in the house, unworn');
  load(world, 'broadaxe', 0);
  assert.equal(household.tools.broadaxe, undefined, 'a tool taken back out is not');
  load(world, 'chairs', 1);
  assert.deepEqual(household.belongings, ['bedding', 'pot', 'chairs'], 'belongings in the list order');
  validateWorld(world);
});

test('the wagon refuses what it cannot take, in a sentence, and changes nothing', () => {
  const world = lobby();
  const household = world.households['hh-1'];
  const before = structuredClone(household);
  const refused = (item, amount, pattern) => {
    assert.throws(() => load(world, item, amount), pattern);
    assert.deepEqual(household, before, `a refused ${item} × ${amount} left the family as it was`);
  };
  refused('provisions', 8, /no room/i);
  refused('chest', 2, /one chest at most/i);
  refused('provisions', 9, /at most/i);
  refused('a-piano', 1, /not one of the things/i);
  refused('seed', 1.5, /whole things/i);
  refused('seed', -1, /whole things/i);
  refused('seed', undefined, /whole things/i);
  // Filling it to the last space is allowed; one more is not.
  const room = WAGON_SPACE - spaceOf(household.load);
  load(world, 'seed', amountOf(household, 'seed') + room);
  assert.equal(spaceOf(household.load), WAGON_SPACE);
  assert.throws(() => load(world, 'books', 1), /no room/i);
});

test('the wagon is packed in the lobby only, and packing it does not stop the roll', () => {
  const world = lobby();
  const household = world.households['hh-1'];
  // Make room for the two goods below: with a hoe on the list, a household drawn with four
  // barrels has only one space free.
  load(world, 'provisions', amountOf(household, 'provisions') - 1);
  load(world, 'books', 1);
  assert.equal(world.events.filter(event => event.householdId === 'hh-1' && event.type !== 'household-founded').length, 0, 'repacking writes nothing into the story');
  rollFamily(world, household);
  assert.ok(household.roll, 'a family that packed first can still roll');
  load(world, 'tinware', 1);
  world.status = 'running';
  assert.throws(() => load(world, 'books', 0), /class has begun/i);
  assert.equal(household.belongings.includes('books'), true, 'what was packed stays packed');
  assert.equal(view(world).wagon, null, 'nothing to repack rides on a running class\'s tick');
});

test('the load screen is told what the server allows, and the list says what each thing does before it is chosen', () => {
  const world = lobby();
  const wagon = view(world).wagon;
  assert.deepEqual(wagon, { used: spaceOf(world.households['hh-1'].load), can: true });
  // FIC-GONZ-008: a trade-off is stated on the control before it is chosen.
  for (const item of WAGON_ITEMS) {
    assert.ok(item.name && item.describe && Number.isInteger(item.space) && item.space > 0 && Number.isInteger(item.most) && item.most >= 1, `${item.id} states its space and what it is`);
  }
  // The catalogue does not ride on the tick: no description is in the per-tick projection.
  const wire = JSON.stringify(view(world));
  for (const item of WAGON_ITEMS) assert.ok(!wire.includes(item.describe), `${item.id}'s words are not sent every tick`);
});

test('the wagon comes in loaded, is unloaded at the land, and the arrival says what came', () => {
  const world = lobby('arrive');
  const household = world.households['hh-1'];
  const emptied = world.households['hh-2'];
  assert.equal(world.entities['hh-3-wagon'].laden, true, 'a family that never packed drives in with the default load, not an empty wagon');
  for (const entry of [...emptied.load]) load(world, entry.id, 0, 'hh-2');
  // A wheel takes three spaces, so a barrel of meal comes out for it: the decision the screen is for.
  load(world, 'provisions', 2);
  load(world, 'spinning-wheel', 1);
  assert.equal(world.entities['hh-1-wagon'].laden, true, 'on the road with something in it');
  assert.equal(world.entities['hh-2-wagon'].laden, false, 'an empty wagon is drawn empty');
  world.status = 'running';
  for (let tick = 0; tick < 40 && (household.arriving || emptied.arriving); tick++) stepWorld(world);
  assert.equal(world.entities['hh-1-wagon'].laden, false, 'unloaded where the journey ended');
  const arrival = id => world.events.find(event => event.type === 'arrival' && event.householdId === id).text;
  assert.match(arrival('hh-1'), /unload what they brought: .*spinning wheel/);
  assert.match(arrival('hh-2'), /came in empty/);
  validateWorld(world);
});

test('a class saved before the wagon was packed plays as it did, and cannot be repacked', () => {
  const world = lobby('old');
  const household = world.households['hh-1'];
  delete household.load; delete household.belongings;
  household.resources = { food: 13, seed: 2, powder: 3, money: 0 };
  household.tools = { hoe: 0 };
  validateWorld(world);
  assert.equal(view(world).wagon, null, 'no load screen for a family that has no load');
  assert.throws(() => load(world, 'provisions', 1), /before there was any choosing/);
  assert.deepEqual(household.resources, { food: 13, seed: 2, powder: 3, money: 0 }, 'its founding stores are untouched');
});

test('a load that does not fit or does not exist is refused by validation', () => {
  for (const [label, corrupt] of [
    ['overloaded', household => { household.load = [{ id: 'chairs', amount: 1 }, { id: 'provisions', amount: 8 }, { id: 'chest', amount: 1 }, { id: 'spinning-wheel', amount: 1 }, { id: 'auger', amount: 1 }]; }],
    ['unknown', household => { household.load = [{ id: 'a-piano', amount: 1 }]; }],
    ['two chests', household => { household.load = [{ id: 'chest', amount: 2 }]; }],
    ['belongings that are not goods', household => { household.belongings = ['axe']; }],
  ]) {
    const world = lobby('invalid');
    corrupt(world.households['hh-1']);
    assert.throws(() => validateWorld(world), /wagon|belongings/i, label);
  }
});

test('the default load does not move anything else a seed makes', () => {
  // The default's one draw sits where the founding food draw sat, so the same seed makes the
  // same land, crops, town and people it did before step 3.
  const draws = [];
  defaultLoad(() => { draws.push(1); return 0.99; });
  assert.equal(draws.length, 1, 'exactly one draw');
  assert.equal(amountOf({ load: defaultLoad(() => 0.99) }, 'provisions'), 4);
  assert.equal(amountOf({ load: defaultLoad(() => 0) }, 'provisions'), 3);
  assert.ok(wagonItem('provisions'));
});

test('a student packs the wagon over the wire, and reads the catalogue once', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'texas-wagon-'));
  const app = createClassroom({ seed: 'wagon-http', savePath: join(dir, 'save.json'), tickMs: 10 });
  const port = await app.listen();
  const call = async (path, data, cookie) => {
    const response = await fetch(`http://127.0.0.1:${port}${path}`, { method: data ? 'POST' : 'GET', headers: { ...(data && { 'Content-Type': 'application/json' }), ...(cookie && { Cookie: cookie }) }, ...(data && { body: JSON.stringify(data) }) });
    return { status: response.status, body: await response.json(), cookie: response.headers.get('set-cookie')?.split(';')[0] };
  };
  try {
    const student = await call('/api/join', { name: 'Packer', code: app.state.sessionCode });
    const catalogue = (await call('/api/chores', null, student.cookie)).body.wagon;
    assert.equal(catalogue.space, WAGON_SPACE);
    assert.deepEqual(catalogue.items.map(item => item.id), WAGON_ITEMS.map(item => item.id));
    const ok = await call('/api/command', { id: 'wagon-load-0001', action: 'load-wagon', item: 'books', amount: 1 }, student.cookie);
    assert.equal(ok.status, 200);
    const householdId = student.body.world.householdId;
    assert.ok(app.state.world.households[householdId].belongings.includes('books'));
    const refused = await call('/api/command', { id: 'wagon-load-0002', action: 'load-wagon', item: 'provisions', amount: 8 }, student.cookie);
    assert.equal(refused.status, 400);
    assert.match(refused.body.error, /no room/i);
  } finally { await app.close(); rmSync(dir, { recursive: true, force: true }); }
});

test('a family that leaves the hoe behind cannot work the field, and buys before it can mend', () => {
  const world = lobby('no-hoe');
  const household = world.households['hh-1'];
  load(world, 'hoe', 0);
  settle(world);
  world.status = 'running';
  const person = world.entities[household.principalId];
  const planting = choreAvailability(world, household, person, 'plant-field');
  assert.equal(planting.can, false);
  assert.equal(planting.why, 'There is no hoe in the house.');
  const mending = choreAvailability(world, household, person, 'mend-hoe');
  assert.equal(mending.can, false);
  assert.equal(mending.why, 'There is no hoe in the house to mend.');
  // Buying one is how a family without a hoe gets one, so it is not refused for want of a hoe.
  household.resources.money = COIN.hoe;
  assert.equal(choreAvailability(world, household, person, 'replace-hoe').can, true);
});

test('validateWorld requires a hoe only for a household with no load to say otherwise', () => {
  const world = lobby('validate-hoe');
  const household = world.households['hh-1'];
  load(world, 'hoe', 0);
  validateWorld(world);
  delete household.load; delete household.belongings;
  assert.throws(() => validateWorld(world), /Invalid tool condition/);
});
