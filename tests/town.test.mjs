import test from 'node:test';
import assert from 'node:assert/strict';
import { createWorld, stepWorld, applyAction, projectWorld, validateWorld, dispatchReport } from '../sim/world.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { RESIDENTS, observedBy, traderAt } from '../sim/town.mjs';

const running = (seed = 'town', count = 5) => { const world = createWorld(seed, count); world.status = 'running'; return world; };
const sendTo = (world, householdId, who, place) => applyAction(world, householdId, { action: 'travel', entityId: `${householdId}-${who}`, destination: place });
function arrive(world, entity, limit = 200) {
  for (let tick = 0; tick < limit; tick++) { stepWorld(world); if (!entity.travel) return; }
  throw new Error('never arrived');
}

test('the town has people in it, and they belong to nobody', () => {
  const world = running();
  for (const resident of RESIDENTS) {
    const entity = world.entities[resident.id];
    assert.ok(entity, `${resident.name} exists`);
    assert.equal(entity.householdId, null, 'a resident is not anybody\'s family');
    assert.equal(entity.location.siteId, 'gonzales');
  }
  // They move about, deterministically, so a reloaded world puts them back.
  const before = { ...world.entities['town-crandall'].location };
  for (let tick = 0; tick < 6; tick++) stepWorld(world);
  const after = { ...world.entities['town-crandall'].location };
  assert.notDeepEqual(after, before, 'the town is not a still photograph');
  assert.equal(after.siteId, 'gonzales', 'and nobody wanders out of it');
  const reloaded = JSON.parse(JSON.stringify(world));
  stepWorld(world); stepWorld(reloaded);
  assert.deepEqual(JSON.parse(JSON.stringify(reloaded)), JSON.parse(JSON.stringify(world)));
});

test('a student sees nobody else until one of their own family is standing with them', () => {
  const world = running();
  // At home, alone: the town is not visible from the farm.
  let projected = projectWorld(world, 'hh-1', 'student', { includeMap: false });
  assert.deepEqual(projected.others, [], 'the town is not visible from three miles away');

  const thomas = world.entities['hh-1-thomas'];
  sendTo(world, 'hh-1', 'thomas', 'gonzales');
  arrive(world, thomas);
  projected = projectWorld(world, 'hh-1', 'student', { includeMap: false });
  const names = projected.others.map(person => person.name);
  for (const resident of RESIDENTS) assert.ok(names.includes(resident.name), `${resident.name} is visible once you are there`);
  validateWorld(world);
});

test('meeting somebody reveals who they are and nothing about their household', () => {
  const world = running();
  // Two families in town at once.
  sendTo(world, 'hh-1', 'thomas', 'gonzales');
  sendTo(world, 'hh-2', 'thomas', 'gonzales');
  arrive(world, world.entities['hh-1-thomas']);
  arrive(world, world.entities['hh-2-thomas']);
  // Give the other household something distinctive to leak.
  world.households['hh-2'].resources.seed = 4242;
  world.households['hh-2'].tools.hoe = 3;

  const projected = projectWorld(world, 'hh-1', 'student', { includeMap: false });
  const stranger = projected.others.find(person => person.householdId === 'hh-2');
  assert.ok(stranger, 'the other family\'s man is standing right there and is visible');
  assert.equal(stranger.name, world.entities['hh-2-thomas'].name, 'the neighbour is named, and named correctly');
  // What being in the same place shows you: who, where, and what they appear to be doing.
  assert.ok(stranger.location && stranger.task !== undefined && stranger.condition);
  // What it must never show you.
  for (const secret of ['skills', 'chore', 'travel', 'commitments', 'propertyRefs', 'resources', 'field', 'tools']) {
    assert.equal(stranger[secret], undefined, `a stranger's ${secret} is private`);
  }
  const wire = JSON.stringify(projected);
  assert.doesNotMatch(wire, /4242/, "another household's stores never reach the wire");
  assert.equal(projected.work['hh-2-thomas'], undefined, 'and you are offered no control over them');
  // Your own household is still whole.
  assert.ok(projected.entities.every(entity => entity.householdId === 'hh-1'));
  assert.ok(projected.entities.find(entity => entity.id === 'hh-1-thomas').skills, 'your own family is not redacted');
});

test('an observed person can never be commanded', () => {
  const world = running();
  sendTo(world, 'hh-1', 'thomas', 'gonzales');
  arrive(world, world.entities['hh-1-thomas']);
  for (const id of ['town-ibarra', 'hh-2-thomas']) {
    assert.throws(() => applyAction(world, 'hh-1', { action: 'chore', entityId: id, chore: 'plant-field' }), /your family/, `${id} takes no orders`);
    assert.throws(() => applyAction(world, 'hh-1', { action: 'travel', entityId: id, destination: 'ford' }), /your family/);
  }
  assert.equal(world.entities['town-ibarra'].location.siteId, 'gonzales', 'and none of that moved anyone');
});

test('trading is with a person: the trip fails honestly when nobody deals in it', () => {
  const world = running();
  const household = world.households['hh-1'];
  household.resources.food = 20;
  applyAction(world, 'hh-1', { action: 'chore', entityId: 'hh-1-thomas', chore: 'fetch-seed' });
  const thomas = world.entities['hh-1-thomas'];
  for (let tick = 0; tick < 300 && thomas.chore; tick++) stepWorld(world);
  assert.ok(household.resources.seed > 2, 'the seed came home');
  const traded = world.events.filter(event => /traded with/.test(event.text));
  assert.equal(traded.length, 1);
  assert.match(traded[0].text, /Marta Ibarra/, 'the trade names the person it was with');

  // Now take the seed trader out of the town and send someone else on the same errand.
  const other = createWorld('town', 5);
  other.status = 'running';
  other.households['hh-2'].resources.food = 20;
  delete other.entities['town-ibarra'];
  applyAction(other, 'hh-2', { action: 'chore', entityId: 'hh-2-thomas', chore: 'fetch-seed' });
  const seedBefore = other.households['hh-2'].resources.seed;
  const walker = other.entities['hh-2-thomas'];
  for (let tick = 0; tick < 300 && walker.chore; tick++) stepWorld(other);
  assert.equal(other.households['hh-2'].resources.seed, seedBefore, 'no seed appeared from nobody');
  assert.ok(other.events.some(event => /found nobody at Gonzales/.test(event.text)), 'and the wasted trip was reported');
});

test('traderAt only answers for somebody actually standing there and well', () => {
  const world = running();
  assert.equal(traderAt(world, 'gonzales', 'seed')?.name, 'Marta Ibarra');
  assert.equal(traderAt(world, 'gonzales', 'iron')?.name, 'Josiah Pike');
  assert.equal(traderAt(world, 'ford', 'seed'), null, 'nobody trades at the ford');
  assert.equal(traderAt(world, 'gonzales', 'gunpowder'), null, 'and not in things nobody deals in');
  world.entities['town-ibarra'].health = { condition: 'major-injury' };
  assert.equal(traderAt(world, 'gonzales', 'seed'), null, 'a person who is not well is not trading');
});

test('observation is symmetric and needs no household to be safe', () => {
  const world = running();
  assert.deepEqual(observedBy(world, null), [], 'the Host projection asks for no observation list');
  assert.deepEqual(observedBy(world, 'hh-9'), [], 'an unknown household observes nothing');
  sendTo(world, 'hh-1', 'thomas', 'gonzales');
  sendTo(world, 'hh-2', 'thomas', 'gonzales');
  arrive(world, world.entities['hh-1-thomas']);
  arrive(world, world.entities['hh-2-thomas']);
  const oneSeesTwo = observedBy(world, 'hh-1').some(person => person.id === 'hh-2-thomas');
  const twoSeesOne = observedBy(world, 'hh-2').some(person => person.id === 'hh-1-thomas');
  assert.ok(oneSeesTwo && twoSeesOne, 'if you can see them they can see you');
});

test('seeing a courier tells you a rider passed, never what they carry', () => {
  // The courier machinery belongs to the Gonzales scenario, which is where the truth
  // record a report refers to is created.
  const world = createGonzalesWorld('courier-sight', 5);
  world.status = 'running';
  for (let tick = 0; tick < 120 && !world.truth['cannon-request']; tick++) stepWorld(world);
  assert.ok(world.truth['cannon-request'], 'the scenario produced something to carry');
  // A rider is dispatched to somebody else, and stands in town while our man is there.
  const courierId = dispatchReport(world, 'cannon-request', 'hh-3');
  const courier = world.entities[courierId];
  assert.ok(courier.report, 'the courier really is carrying a report for another household');
  courier.travel = null;
  courier.location = { x: world.map.sites.gonzales.x, y: world.map.sites.gonzales.y, siteId: 'gonzales' };
  sendTo(world, 'hh-1', 'thomas', 'gonzales');
  arrive(world, world.entities['hh-1-thomas']);

  const projected = projectWorld(world, 'hh-1', 'student', { includeMap: false });
  const seen = projected.others.find(person => person.id === courierId);
  assert.ok(seen, 'the rider is visible, standing in the same town');
  assert.equal(seen.report, undefined, 'but what they carry is not');
  const wire = JSON.stringify(projected.others);
  assert.doesNotMatch(wire, /cannon-request/, 'the topic never reaches the wire');
  assert.doesNotMatch(wire, /hh-3/, 'nor who it is addressed to');
});
