// How they will go, asked before anybody leaves (owner, 2026-09-24: "when sending someone to travel, the game should ask how
// they'll travel"; docs/FAMILY_PANEL.md §15, sim/going.mjs).
//
// Held here: every order that puts somebody on a road - a journey to a place, work with a road in it, the answers to a call
// that go somewhere - is answered by the server's ways, quickest first, each with its facts and, when it cannot go, why in
// the holder's name; the quickest that can go is the one marked, and the one an order with no way takes; a way chosen is the
// way they go, and a way somebody else has is refused in that person's name however the order is sent; a family nobody plays
// and a person on auto go by the same rule; work that makes no journey is not asked; and a class saved before opens as it was.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createSettledWorld, taught, modestMeans } from './support/settled.mjs';
import { applyAction, beginTravel, goingFor, journeyOf, modeAvailability, orderMode, projectWorld, stepWorld, validateWorld } from '../sim/world.mjs';
import { CHORES, choreCatalogue, makesJourney } from '../sim/chores.mjs';
import { advanceAuto } from '../sim/auto.mjs';
import { thinkFor } from '../sim/neighbours.mjs';
import { QUICKEST } from '../sim/going.mjs';
import { CAMP_SITE } from '../sim/directors.mjs';
import { MODES, propertyId } from '../sim/travel.mjs';
import { readSave, writeSave } from '../server/storage.mjs';

function running(seed) {
  const world = taught(createSettledWorld(seed, 5));
  world.status = 'running';
  world.households['hh-1'].played = true;
  return world;
}
const person = (world, name) => world.entities[`hh-1-${name}`];
const ways = (world, who, order) => goingFor(world, 'hh-1', who.id, order);
const way = (going, id) => going.ways.find(one => one.id === id);

test('every way of going is offered quickest first, with the server\'s facts, and the quickest that can go is marked', () => {
  const world = running('going-facts');
  const alvin = person(world, 'thomas'), hunter = person(world, 'mateo');
  const town = ways(world, alvin, { action: 'travel', destination: 'gonzales' });
  assert.deepEqual(town.ways.map(one => one.id), ['horse', 'foot', 'wagon']);
  assert.deepEqual(QUICKEST, ['horse', 'foot', 'wagon']);
  assert.equal(town.quickest, 'horse');
  assert.equal(town.journey.to, 'gonzales');
  for (const one of town.ways) {
    assert.equal(one.can, true, `${one.id} shut: ${one.why}`);
    assert.equal(one.carry, MODES[one.id].carry);
    assert.match(one.pace, /miles an hour$/);
    assert.match(one.time, /^about /);
    assert.ok(one.miles > 0 && one.hours > 0);
    assert.ok(one.tiring);
  }
  // The same road, faster on the horse and slower with the wagon: the facts are the reckoning's, not a guess.
  assert.ok(way(town, 'horse').hours < way(town, 'foot').hours && way(town, 'foot').hours < way(town, 'wagon').hours);
  // A hunt says what each way brings home of a good day's kill.
  const hunt = ways(world, hunter, { action: 'chore', chore: 'hunt-timber' });
  assert.equal(hunt.quickest, 'horse');
  assert.match(way(hunt, 'foot').brings, /^Brings home 5 food/);
  assert.match(way(hunt, 'horse').brings, /^Brings home 7 food/);
  // Carrying food to Gonzales: what is carried against what each way carries.
  assert.equal(way(ways(world, alvin, { action: 'help' }), 'foot').carrying, '2 loads of the 5 it carries');
});

test('a way somebody else has is shut in the chooser in their name, and refused in their name however the order is sent', () => {
  // One ox and one wagon, so the wagon out is the family's only one (sim/means.mjs gives a family of other means more).
  const world = modestMeans(running('going-taken'));
  const rosa = person(world, 'rosa'), alvin = person(world, 'thomas'), hunter = person(world, 'mateo');
  beginTravel(world, rosa, 'gonzales', null, 'visit', 'wagon');
  const going = ways(world, hunter, { action: 'chore', chore: 'hunt-timber' });
  assert.equal(way(going, 'wagon').can, false);
  assert.equal(way(going, 'wagon').why, `${rosa.name} has the ox and wagon, on the road to Gonzales.`);
  assert.equal(going.quickest, 'horse', 'the wagon out does not shut the horse');
  // Somebody rides off with the horse between the chooser and the press: the order carrying it is refused in his name.
  applyAction(world, 'hh-1', { action: 'chore', entityId: hunter.id, chore: 'hunt-timber', mode: 'horse' });
  assert.equal(hunter.travel?.mode, 'horse');
  assert.throws(() => applyAction(world, 'hh-1', { action: 'travel', entityId: alvin.id, destination: 'gonzales', mode: 'horse' }), new RegExp(`^Error: ${hunter.name} has the horse`));
  assert.throws(() => applyAction(world, 'hh-1', { action: 'travel', entityId: alvin.id, destination: 'gonzales', mode: 'wagon' }), new RegExp(`${rosa.name} has the ox and wagon`));
  assert.equal(alvin.travel, null, 'a refused order moved him');
  // And the chooser now marks walking, the one left.
  const left = ways(world, alvin, { action: 'travel', destination: 'gonzales' });
  assert.equal(left.quickest, 'foot');
  assert.match(way(left, 'horse').why, new RegExp(`^${hunter.name} has the horse`));
});

test('the way chosen is the way they go, and an order with no way goes the quickest that can', () => {
  const world = running('going-chosen');
  const alvin = person(world, 'thomas'), hunter = person(world, 'mateo'), rosa = person(world, 'rosa');
  applyAction(world, 'hh-1', { action: 'chore', entityId: hunter.id, chore: 'hunt-timber', mode: 'foot' });
  assert.equal(hunter.travel?.mode, 'foot');
  assert.equal(world.entities[propertyId('hh-1', 'horse')].borrowedBy, null, 'the horse left the yard although they chose to walk');
  // No way given: the quickest that can, the horse.
  assert.equal(orderMode(world, world.households['hh-1'], alvin, { action: 'travel', destination: 'gonzales' }), 'horse');
  applyAction(world, 'hh-1', { action: 'travel', entityId: alvin.id, destination: 'gonzales' });
  assert.equal(alvin.travel.mode, 'horse');
  // With the horse gone, the quickest that can is on foot - for an order with none, not a refusal.
  applyAction(world, 'hh-1', { action: 'chore', entityId: rosa.id, chore: 'buy-furniture' });
  assert.equal(rosa.travel?.mode, 'foot');
  // A way that is no way at all is refused before anything moves.
  assert.throws(() => applyAction(world, 'hh-1', { action: 'chore', entityId: rosa.id, chore: 'hunt-timber', mode: 'canoe' }), /No such way of going/);
  validateWorld(world);
});

test('a journey that can go one way offers that way, and the others say why', () => {
  const world = running('going-one');
  const alvin = person(world, 'thomas');
  // The march upriver crosses the Guadalupe at the ford: the wagon is shut there, in the ford's words.
  const march = ways(world, alvin, { action: 'go-upriver' });
  assert.equal(march.journey.to, CAMP_SITE);
  assert.equal(way(march, 'wagon').can, false);
  assert.equal(way(march, 'wagon').why, 'That road crosses at the ford, and the ford is no place for a wagon.');
  assert.equal(march.quickest, 'horse');
  // Logs come home in the wagon: the one way, the others shut with why.
  const family = world.households['hh-1'];
  const logs = journeyOf(world, family, alvin, { action: 'chore', chore: 'fetch-logs' });
  assert.equal(logs.only, 'wagon');
  const going = ways(world, alvin, { action: 'chore', chore: 'fetch-logs' });
  assert.equal(going.quickest, 'wagon');
  assert.equal(way(going, 'horse').why, 'The logs come home in the wagon, so the ox and wagon go.');
  assert.equal(way(going, 'foot').can, false);
  assert.equal(orderMode(world, family, alvin, { action: 'chore', chore: 'fetch-logs' }), 'wagon', 'an order with no way is sent the one way');
});

test('work that makes no journey is not asked, and the catalogue marks exactly the work that does', () => {
  const world = running('going-none');
  const hunter = person(world, 'mateo');
  for (const chore of ['plant-field', 'build-house', 'dig-well', 'fish-the-water', 'take-small-game', 'cut-bee-tree', 'visit-shop']) {
    assert.equal(ways(world, hunter, { action: 'chore', chore }).journey, null, `${chore} asked how they go`);
  }
  assert.equal(ways(world, hunter, { action: 'travel', destination: world.households['hh-1'].homeSiteId }).journey, null, 'home, standing at home');
  const marked = choreCatalogue().filter(one => one.journey).map(one => one.id).sort();
  assert.deepEqual(marked, Object.keys(CHORES).filter(id => makesJourney(CHORES[id])).sort());
  for (const id of ['hunt-timber', 'make-furniture', 'buy-furniture', 'fetch-logs', 'go-vote', 'enlist-regular', 'join-houston']) assert.ok(marked.includes(id), `${id} is not asked`);
  for (const id of ['hunt-land', 'fish-the-water', 'visit-shop', 'plant-field']) assert.ok(!marked.includes(id), `${id} is asked`);
});

test('a person on auto goes by the same rule: rides when the horse is home, walks when it is out', () => {
  const world = running('going-auto');
  const family = world.households['hh-1'];
  const hunter = person(world, 'mateo'), alvin = person(world, 'thomas');
  family.resources.powder = 6;
  hunter.auto = true;
  hunter.order = { chore: 'hunt-timber', mode: 'foot' }; // as a page before 2026-09-24 remembered it
  // Handed the world's own, as stepWorld hands them.
  const deps = { beginTravel, modeAvailability };
  advanceAuto(world, deps);
  assert.equal(hunter.travel?.mode, 'horse', 'auto walked with the horse in the yard');
  // Home again (auto held off while they come, or it would go straight out again), and the horse out with Alvin: auto walks
  // rather than waiting for it.
  delete hunter.auto;
  for (let t = 0; t < 600 && hunter.chore; t++) stepWorld(world);
  assert.equal(hunter.chore, null);
  applyAction(world, 'hh-1', { action: 'travel', entityId: alvin.id, destination: 'gonzales', mode: 'horse' });
  hunter.auto = true;
  family.resources.powder = 6;
  advanceAuto(world, deps);
  assert.equal(hunter.travel?.mode, 'foot', 'auto waited for the horse, or took it from Alvin');
});

test('a family nobody plays sends its journeys with no way, and they go the quickest that can', () => {
  const world = createSettledWorld('going-director', 5);
  world.status = 'running';
  world.neighbours = true;
  const family = world.households['hh-2'];
  family.resources.food = 0; family.resources.powder = 6; // hungry, with shot: it sends somebody to the timber
  const sent = [];
  const act = input => {
    const who = world.entities[input.entityId];
    const quickest = who && orderMode(world, family, who, input);
    applyAction(world, 'hh-2', input);
    if (who?.travel) sent.push({ input, quickest, went: who.travel.mode });
  };
  thinkFor(world, family, { project: id => projectWorld(world, id, 'student', { includeMap: false }), act });
  assert.ok(sent.length >= 1, 'the director sent nobody on a road');
  for (const { input, quickest, went } of sent) {
    assert.equal(input.mode, undefined, 'the director chose a way itself instead of the one rule');
    assert.equal(went, quickest, `${input.chore || input.action} went ${went}, and the quickest that could was ${quickest}`);
  }
  assert.equal(sent[0].went, 'horse', 'the first sent rode the horse standing free in the yard');
  validateWorld(world);
});

test('a class saved before opens as it was: a remembered way, and journeys under way with none', () => {
  const world = running('going-old');
  const hunter = person(world, 'mateo'), alvin = person(world, 'thomas');
  hunter.order = { chore: 'hunt-timber', mode: 'foot' };
  beginTravel(world, alvin, 'gonzales', null, 'visit', 'foot');
  delete alvin.travel.mode; // saved before there was a choice
  const dir = mkdtempSync(join(tmpdir(), 'going-old-'));
  try {
    writeSave(join(dir, 'save.json'), { saveVersion: 3, world });
    const opened = readSave(join(dir, 'save.json')).world;
    validateWorld(opened);
    assert.deepEqual(opened.entities[hunter.id].order, { chore: 'hunt-timber', mode: 'foot' });
    assert.equal(opened.entities[alvin.id].travel.mode, undefined);
    const view = projectWorld(opened, 'hh-1', 'student', { includeMap: false });
    assert.ok(view.entities.some(one => one.id === alvin.id));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

