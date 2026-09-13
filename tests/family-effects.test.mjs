// What a rolled family's hidden stats do, and who answers for the family.
// docs/FAMILY_CREATION.md steps 3 and 4.
//
// Housework makes food last longer, but only from somebody actually at home - which is
// what "less likely to be sent to battle" comes to in play: nobody is stopped from going,
// and the family feels it when they do. Strength sets the pace of heavy work. And a call is
// the family's to give to any parent or grown child; the march is put to whoever carried
// the food, so a family can send its mother.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { createSettledWorld } from './support/settled.mjs';
import { applyAction, stepWorld, projectWorld, validateWorld } from '../sim/world.mjs';
import { advanceRoutine } from '../sim/routines.mjs';
import { TIMELINE } from '../sim/directors.mjs';
import { learn } from '../sim/knowledge.mjs';

const TOPIC = 'cannon-request';
const view = (world, householdId) => projectWorld(world, householdId, 'student', { includeMap: false });
const person = (world, key) => world.entities[`hh-1-${key}`];
/** The founding family of hh-1, everyone resting at home, with hidden stats set by hand. */
function family(housework = {}, seed = 'effects') {
  const world = createSettledWorld(seed, 5);
  for (const key of ['thomas', 'elena', 'rosa', 'mateo']) {
    const entity = person(world, key);
    entity.task = 'rest';
    entity.traits = { strength: 5, health: 9, housework: housework[key] ?? 1 };
  }
  return world;
}
const eatenInADay = world => {
  const household = world.households['hh-1'];
  household.resources.food = 20;
  advanceRoutine(world, 1440);
  return Math.round((20 - household.resources.food) * 10000) / 10000;
};

test('the best housekeeper at home makes the food last longer, and only while they are at home', () => {
  const plain = eatenInADay(family());
  const kept = eatenInADay(family({ elena: 10 }));
  assert.equal(plain, 1.4, 'four people with nobody keeping house eat what they always ate');
  assert.ok(kept < plain - 0.3, `a good housekeeper at home made no difference: ${kept} against ${plain}`);
  // Only the best one counts; two good housekeepers are not twice as good.
  assert.equal(eatenInADay(family({ elena: 10, rosa: 10 })), kept);

  // Send her to Gonzales and the saving goes with her.
  const away = family({ elena: 10 });
  person(away, 'elena').location = { ...away.map.sites.gonzales, siteId: 'gonzales' };
  const awayPlain = family();
  person(awayPlain, 'elena').location = { ...awayPlain.map.sites.gonzales, siteId: 'gonzales' };
  assert.equal(eatenInADay(away), eatenInADay(awayPlain), 'a housekeeper who is not at home still kept the house');

  // The founding family nobody rolled has no hidden stats and eats exactly as before.
  const unrolled = createSettledWorld('effects', 5);
  for (const key of ['thomas', 'elena', 'rosa', 'mateo']) person(unrolled, key).task = 'rest';
  assert.equal(eatenInADay(unrolled), 1.4);
});

/** How many ticks one person takes over one chore. */
function ticksFor(chore, strength) {
  const world = family();
  person(world, 'elena').traits.strength = strength;
  world.status = 'running';
  applyAction(world, 'hh-1', { action: 'chore', entityId: 'hh-1-elena', chore });
  let ticks = 0;
  while (person(world, 'elena').chore && ticks < 300) { stepWorld(world); ticks++; }
  return ticks;
}
test('strength sets the pace of heavy work, and of nothing else', () => {
  const strong = ticksFor('plant-field', 10), weak = ticksFor('plant-field', 1);
  assert.ok(strong < weak, `planting took the strongest ${strong} ticks and the weakest ${weak}`);
  // Fetching seed from town is a walk and an errand, not heavy work.
  assert.equal(ticksFor('fetch-seed', 10), ticksFor('fetch-seed', 1));
});

test('the family chooses who carries the food, and the march is put to whoever did', () => {
  const world = createGonzalesWorld('who-answers', 5);
  world.status = 'running';
  // A son of seventeen may answer; a daughter of twelve may not. The founding four state no
  // ages, so these are set by hand.
  person(world, 'mateo').age = 17;
  person(world, 'rosa').age = 12;
  while (!world.truth[TOPIC]) stepWorld(world);
  learn(world, 'hh-1', TOPIC, { status: 'confirmed', source: 'Somebody who saw it' });
  stepWorld(world);

  const call = view(world, 'hh-1').request;
  assert.equal(call.kind, 'supplies');
  assert.deepEqual(Object.keys(call.answerers).sort(), ['hh-1-elena', 'hh-1-mateo', 'hh-1-thomas'], 'the parents and the grown son may answer');
  assert.doesNotMatch(call.text, new RegExp(person(world, 'thomas').name), 'the call names nobody, because the family decides');
  assert.throws(() => applyAction(world, 'hh-1', { action: 'help', entityId: 'hh-1-rosa' }), /too young to answer/);

  const elena = person(world, 'elena'), thomas = person(world, 'thomas');
  applyAction(world, 'hh-1', { action: 'help', entityId: elena.id });
  assert.equal(world.requests['hh-1'].actorId, elena.id);
  assert.ok(elena.travel || elena.location.siteId === 'gonzales', 'the mother went');
  assert.equal(thomas.travel, null, 'and the father stayed');

  let march = null;
  for (let tick = 0; tick < 400 && !march && world.minute < TIMELINE.approach; tick++) {
    stepWorld(world);
    march = world.marches['hh-1'];
  }
  assert.ok(march, 'nobody was asked to go upriver');
  assert.equal(march.actorId, elena.id, 'the march is put to whoever carried the food');
  assert.match(march.text, new RegExp(elena.name));
  assert.deepEqual(Object.keys(view(world, 'hh-1').request.answerers), [elena.id]);
  assert.throws(() => applyAction(world, 'hh-1', { action: 'go-upriver', entityId: thomas.id }), /was not the one asked/);
  applyAction(world, 'hh-1', { action: 'go-upriver', entityId: elena.id });

  for (let tick = 0; tick < 400 && world.minute < TIMELINE.resolved + 40; tick++) stepWorld(world);
  const settled = world.events.find(event => event.id === world.requests['hh-1'].consequenceId);
  assert.ok(settled, 'the errand never settled');
  assert.match(settled.text, new RegExp(elena.name), 'the consequence is about the person who went');
  assert.equal(settled.actorId, elena.id);
  // Gonzales kills nobody, whoever is sent (FIC-GONZ-005).
  assert.ok(['well', 'tired', 'minor-injury'].includes(elena.health.condition), `the mother came back ${elena.health.condition}`);
  validateWorld(world);
});

test('a rumor is answered by whoever the family sends to see', () => {
  const world = createGonzalesWorld('rumor', 15);
  world.status = 'running';
  for (let tick = 0; tick < 300 && Object.keys(world.households).some(id => !world.knowledge.households[id][TOPIC]); tick++) stepWorld(world);
  const householdId = Object.keys(world.households).find(id => world.rumors[id]?.status === 'open');
  assert.ok(householdId, 'the class holds a family with only a rumor');
  const mother = world.entities[`${householdId}-elena`];
  applyAction(world, householdId, { action: 'go-see', entityId: mother.id });
  assert.equal(world.rumors[householdId].actorId, mother.id);
  assert.ok(mother.travel, 'the mother went to see');
});
