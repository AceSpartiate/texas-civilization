// Hunger and starvation (owner, 2026-09-30: "player characters *can* die of starvation. players should have to ensure there's
// enough food"; sim/hunger.mjs, docs/HUNGER.md). Each test is seen failing under the injection scripts/hunger-injections.mjs names
// for it (docs/evidence/hunger-injections.json).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, projectWorld, stepWorld, validateWorld } from '../sim/world.mjs';
import { beginSecondPeriod } from '../sim/periods.mjs';
import { flee, flightProjection } from '../sim/scrape.mjs';
import { canFight, sexOf } from '../sim/family.mjs';
import { settleMeans } from '../sim/means.mjs';
import { diedAChild } from '../sim/disease.mjs';
import { familiesOverview } from '../sim/host.mjs';
import { hostOverview } from '../sim/overview.mjs';
import { noteDeed } from '../sim/deeds.mjs';
import { flashbackScript } from '../sim/flashback.mjs';
import { homeMiles, NEAR_MILES } from '../sim/neighbourly.mjs';
import { QUESTION_BUDGETS } from '../sim/decision-budget.mjs';
import {
  DEATH_AT, STARVING_AT, WEAK_AT, advanceHunger, ate, hungerPace, hungerStride, hungerWeight, larderShown, recoverOverWinter,
} from '../sim/hunger.mjs';
import { larderLevel, larderFill, larderLabel, larderWorse, needsOf } from '../public/family-panel.js';
import { MOMENTS, militaryNotices } from '../public/military-attention.js';
import { settle } from './support/settled.mjs';

const DAY = 1440;
const history = readFileSync(new URL('../HISTORY.md', import.meta.url), 'utf8');
const landed = (seed, count = 8, options = {}) => {
  const world = createGonzalesWorld(seed, count, { map: 'colonies', ...options });
  // Its means first, as the first running tick would give them, so nothing fills the store behind the test's back.
  settleMeans(world);
  settle(world);
  world.status = 'running';
  return world;
};
const members = (world, household) => household.members.map(id => world.entities[id]);
const alive = person => !['dead', 'captured'].includes(person.health?.condition);
/** A played family at its screen, with nothing in the store and nobody bringing anything in. */
function emptyLarder(world, household) {
  household.played = true;
  delete household.absent;
  household.resources.food = 0;
  for (const person of members(world, household)) { person.task = 'rest'; person.chore = null; }
}
/** A day of eating nothing, as the store would count it, then the tick's settling - without the rest of the world. */
function starveADay(world, household, eaters = members(world, household).filter(alive)) {
  ate(world, household, eaters, 1, 0, 1);
  advanceHunger(world);
}
/** A person made for the test, in the family, at an age and state (the dice are not asked). */
function kin(world, household, id, age, { health = { condition: 'well' } } = {}) {
  const home = world.entities[household.members[0]].location;
  const person = { id, kind: 'person', name: `P${id}`, householdId: household.id, age, task: 'rest', chore: null, health, location: { ...home } };
  world.entities[id] = person;
  household.members.push(id);
  return person;
}
const died = (world, person) => world.events.find(event => event.actorId === person.id && event.hunger === 'died');

// ------------------------------------------------------------------------------------------------ the stages

test('the stages: a grown person with nothing to eat is hungry, then weak at five days, starving at ten, and dead at sixteen', () => {
  const world = landed('hunger-stages');
  const household = Object.values(world.households)[0];
  emptyLarder(world, household);
  const grown = members(world, household).find(person => (person.age ?? 30) >= 16 && (person.age ?? 30) < 60);
  const seen = {};
  for (let day = 1; day <= 30 && alive(grown); day++) {
    ate(world, household, [grown], 1, 0, 1);
    advanceHunger(world);
    const stage = grown.hunger?.stage || (alive(grown) ? 'fed' : 'dead');
    seen[stage] ??= day;
    // The minute on the real clock: this test is of the days, so it is spent at once.
    if (stage === 'starving') world.decisionClock = { ...(world.decisionClock || {}), [`starve:${grown.id}`]: { personId: grown.id, spent: 60_000, of: 60_000, limit: 'starve' } };
  }
  assert.equal(seen.hungry, 1, 'not hungry on the first day with nothing');
  // The numbers themselves, not the module's names for them: a threshold moved is what this guards (docs/HUNGER.md §3).
  assert.equal(seen.weak, 5, `weak on day ${seen.weak}, not 5`);
  assert.equal(seen.starving, 10, `starving on day ${seen.starving}, not 10`);
  assert.equal(seen.dead, 16, `dead on day ${seen.dead}, not 16`);
  assert.match(died(world, grown).text, /died of hunger at home, and was buried there\.$/);
  assert.equal(grown.health.starved, true);
  validateWorld(world);
});

test('the stages: eating one\'s fill wins the want back, and somebody weak who has eaten is said to be getting strength back', () => {
  const world = landed('hunger-fed');
  const household = Object.values(world.households)[0];
  emptyLarder(world, household);
  const grown = members(world, household).find(person => (person.age ?? 30) >= 16);
  for (let day = 0; day < WEAK_AT + 1; day++) starveADay(world, household, [grown]);
  assert.equal(grown.hunger.stage, 'weak');
  ate(world, household, [grown], 1, 5, 1); advanceHunger(world);
  assert.equal(grown.hunger.stage, 'fed', 'a day of eating its fill after six without, and still weak');
  assert.ok(grown.hunger.want > 0, 'six days of want all won back in one day');
  for (let day = 0; day < 2; day++) { ate(world, household, [grown], 1, 5, 1); advanceHunger(world); }
  assert.equal(grown.hunger, undefined, 'three days fed and still owing want');
  assert.ok(world.events.some(event => event.actorId === grown.id && /getting his strength back|getting her strength back/.test(event.text)));
});

test('at home: the routine\'s eating counts the want, and a family whose store is empty goes hungry', () => {
  const world = landed('hunger-home');
  const household = Object.values(world.households)[0];
  emptyLarder(world, household);
  const end = world.minute + 2 * DAY;
  for (let tick = 0; tick < 400 && world.minute < end; tick++) stepWorld(world);
  const hungry = members(world, household).filter(person => person.hunger);
  assert.ok(hungry.length, 'two days with an empty store and nobody hungry');
  assert.ok(hungry.every(person => person.hunger.want > 0));
  assert.ok(world.events.some(event => event.householdId === household.id && event.text === 'The family has eaten the last of its food.'));
  // A family with food is not.
  const fed = Object.values(world.households)[1];
  fed.played = true; fed.resources.food = 200;
  for (let tick = 0; tick < 100; tick++) stepWorld(world);
  assert.ok(members(world, fed).every(person => !person.hunger), 'a family with two hundred food went hungry');
});

test('on the road east: what the wagon could not cover is want too', () => {
  const world = landed('hunger-road', 6);
  world.period = 3;
  const household = Object.values(world.households)[0];
  household.played = true;
  household.flight = { status: 'ordered', orderedMinute: world.minute };
  const refuge = [...flightProjection(world, household).refuges].sort((a, b) => a.miles - b.miles)[0].id;
  flee(world, household, { take: {}, refuge });
  household.resources.food = 0;
  for (let tick = 0; tick < 200 && !members(world, household).some(person => person.hunger); tick++) stepWorld(world);
  assert.ok(members(world, household).some(person => person.hunger?.want > 0), 'a family on the road with nothing went on unhungry');
});

// ------------------------------------------------------------------------------------------------ who first

test('who first: a baby, then a small child and the old and the sick, and the grown and the older children last', () => {
  const world = landed('hunger-who');
  const household = Object.values(world.households)[0];
  emptyLarder(world, household);
  // Only the family's grown principal, and the people made for the test, whose ages are what they are said to be.
  const grown = world.entities[household.principalId];
  household.members = [grown.id];
  const baby = kin(world, household, 'p-baby', 1), small = kin(world, household, 'p-small', 4), older = kin(world, household, 'p-older', 12);
  const old = kin(world, household, 'p-old', 64), sick = kin(world, household, 'p-sick', 30, { health: { condition: 'sick', recoversAt: world.minute + 90 * DAY } });
  world.decisionClock = {};
  const order = [];
  for (let day = 0; day < 30; day++) {
    starveADay(world, household);
    for (const person of members(world, household)) {
      if (person.hunger?.stage === 'starving') world.decisionClock[`starve:${person.id}`] = { personId: person.id, spent: 60_000, of: 60_000, limit: 'starve' };
      if (person.health.condition === 'dead' && !order.includes(person.id)) order.push(person.id);
    }
  }
  const at = person => order.indexOf(person.id);
  assert.equal(order[0], baby.id, `the first to die was ${order[0]}, not the baby`);
  for (const one of [small, old, sick]) assert.ok(at(one) > at(baby) && at(one) < at(grown), `${one.id} did not die after the baby and before the grown`);
  assert.ok(at(older) > at(grown) || at(older) === -1, 'a child of twelve eating with a grown person died before the grown');
});

test('who first: children fed first where somebody grown eats with them, and the sick harder hit', () => {
  const world = landed('hunger-weights');
  const household = Object.values(world.households)[0];
  const child = kin(world, household, 'p-c', 4);
  assert.equal(hungerWeight(world, child, { withGrown: true }), hungerWeight(world, child) * 0.75);
  const well = kin(world, household, 'p-w', 30), sick = kin(world, household, 'p-s', 30, { health: { condition: 'sick', recoversAt: 1e9 } });
  const grave = kin(world, household, 'p-g', 30, { health: { condition: 'sick', recoversAt: 1e9, grave: true, graveDay: 0 } });
  assert.ok(hungerWeight(world, sick) > hungerWeight(world, well) && hungerWeight(world, grave) > hungerWeight(world, sick));
  assert.ok(hungerWeight(world, kin(world, household, 'p-b', 0)) > hungerWeight(world, child));
  assert.ok(hungerWeight(world, kin(world, household, 'p-o', 70)) > hungerWeight(world, well));
});

// ------------------------------------------------------------------------------------------------ the minute

test('the minute: a starving person of a family at its screen cannot die of hunger inside sixty real seconds', () => {
  const world = landed('hunger-minute');
  const household = Object.values(world.households)[0];
  emptyLarder(world, household);
  const grown = members(world, household).find(person => (person.age ?? 30) >= 16);
  // Already owed a death, and said to be starving this very tick.
  grown.hunger = { want: DEATH_AT, stage: 'starving' };
  let spent = 0;
  for (let tick = 0; tick < 40 && alive(grown); tick++) { stepWorld(world, { realMs: 5_000 }); spent += 5_000; }
  assert.ok(!alive(grown), 'never died');
  assert.ok(spent >= QUESTION_BUDGETS.starve, `died after ${spent} real ms, inside the minute`);
  assert.ok(spent <= QUESTION_BUDGETS.starve + 15_000, `held ${spent} real ms, well past the minute`);
});

test('the minute: shown on the row and the "!" as a real time left, with the story card for somebody starving', () => {
  const world = landed('hunger-shown');
  const household = Object.values(world.households)[0];
  emptyLarder(world, household);
  const grown = members(world, household).find(person => (person.age ?? 30) >= 16);
  grown.hunger = { want: STARVING_AT + 1, stage: 'starving' };
  stepWorld(world, { realMs: 10_000 });
  const view = projectWorld(world, household.id, 'student', { includeMap: false });
  const shown = view.entities.find(entity => entity.id === grown.id);
  assert.equal(shown.hunger.stage, 'starving');
  assert.ok(shown.hunger.leftMs > 0 && shown.hunger.leftMs <= QUESTION_BUDGETS.starve, `leftMs ${shown.hunger.leftMs}`);
  const need = needsOf(view, grown.id)[0];
  assert.equal(need.kind, 'hunger');
  assert.equal(need.leftMs, shown.hunger.leftMs);
  const card = militaryNotices(view).find(notice => notice.kind === 'hunger');
  assert.ok(card && card.entityId === grown.id && MOMENTS.hunger.title(grown).endsWith('is starving'));
  // Another family's page is never sent it.
  const other = projectWorld(world, Object.values(world.households)[1].id, 'student', { includeMap: false });
  assert.ok(![...(other.entities || []), ...(other.others || [])].some(entity => entity.id === grown.id && entity.hunger), 'another family was sent the hunger');
});

test('the director: a family whose student has gone is held where it stood, and a family nobody plays never starves', () => {
  const world = landed('hunger-absent');
  const [gone, nobody] = Object.values(world.households);
  emptyLarder(world, gone);
  gone.absent = true;
  const grown = members(world, gone).find(person => (person.age ?? 30) >= 16);
  grown.hunger = { want: STARVING_AT + 1, stage: 'starving' };
  nobody.resources.food = 0; delete nobody.played;
  for (let tick = 0; tick < 60; tick++) stepWorld(world, { realMs: 10_000 });
  assert.ok(alive(grown), 'a family whose student had gone lost somebody to hunger');
  assert.equal(grown.hunger.want, STARVING_AT + 1, 'the want of a family whose student had gone grew');
  assert.ok(members(world, nobody).every(person => alive(person) && !person.hunger), 'a family nobody plays was counted hungry');
  // Owed a death when the student comes back: the minute starts then, and not before.
  grown.hunger.want = DEATH_AT;
  for (let tick = 0; tick < 60; tick++) stepWorld(world, { realMs: 10_000 });
  assert.ok(alive(grown), 'a family whose student had gone lost somebody to hunger');
  delete gone.absent;
  stepWorld(world, { realMs: 10_000 });
  assert.ok(alive(grown), 'died the moment the student came back');
});

// ------------------------------------------------------------------------------------------------ the neighbours

test('the neighbours: food brought by a family that remembers saves a starving family', () => {
  // The families nobody plays are the director's, as in a served class (sim/neighbours.mjs `automatic`).
  const world = landed('hunger-neighbours', 12, { neighbours: true });
  const households = Object.values(world.households);
  let pair = null;
  for (const one of households) for (const other of households) if (!pair && one !== other && homeMiles(world, one, other) <= NEAR_MILES) pair = [one, other];
  assert.ok(pair, 'no two families within reach of each other');
  const [needy, helper] = pair;
  emptyLarder(world, needy);
  delete helper.played;
  helper.resources.food = 60;
  // The needy family once carried food to the helper, which remembers (sim/neighbourly.mjs).
  noteDeed(world, { kind: 'food', fromId: needy.id, toId: helper.id, amount: 5 });
  const people = members(world, needy);
  for (const person of people) person.hunger = { want: STARVING_AT + 1, stage: 'starving' };
  let answered = false;
  for (let tick = 0; tick < 400; tick++) {
    stepWorld(world);
    const ask = Object.values(world.neighbourly?.asks || {}).find(one => one.toId === needy.id && one.kind === 'food' && one.status === 'offered');
    if (ask && !answered) {
      const answerer = people.find(person => alive(person) && (person.age ?? 30) >= 16);
      applyAction(world, needy.id, { action: 'neighbour-answer', entityId: answerer.id, askId: ask.id, answer: 'yes' });
      answered = true;
    }
    if (answered && people.filter(alive).every(person => !person.hunger || person.hunger.stage !== 'starving')) break;
  }
  assert.ok(answered, 'the neighbours never offered food');
  assert.ok(people.every(alive), `${people.filter(person => !alive(person)).map(person => person.name).join(', ')} starved with the neighbours' food in the house`);
  assert.ok(people.every(person => person.hunger?.stage !== 'starving'), 'still starving after the neighbours\' food');
});

// ------------------------------------------------------------------------------------------------ what it does

test('weak: slower at work, slower on the road, and not sent to fight; the family\'s road goes at its weakest walker\'s pace', () => {
  const world = landed('hunger-weak');
  const household = Object.values(world.households)[0];
  const man = members(world, household).find(person => sexOf(person) === 'male' && (person.age ?? 30) >= 16);
  assert.ok(canFight(man));
  man.hunger = { want: WEAK_AT, stage: 'weak' };
  assert.equal(canFight(man), false);
  assert.ok(hungerPace(man) > 1);
  assert.ok(hungerStride(world, man) < 1);
  man.hunger = { want: STARVING_AT, stage: 'starving' };
  assert.ok(hungerPace(man) > 1.5 && hungerStride(world, man) <= 0.5);
  const other = members(world, household).find(person => person.id !== man.id);
  man.travel = { purpose: 'flee' }; other.travel = { purpose: 'flee' };
  assert.equal(hungerStride(world, other), hungerStride(world, man), 'the family on the road east went at two paces');
});

// ------------------------------------------------------------------------------------------------ the death, told as a sickness is

test('a child who died of hunger is never named on the projector, never drawn, and is remembered by who they were', () => {
  const world = landed('hunger-child');
  const household = Object.values(world.households)[0];
  emptyLarder(world, household);
  const child = kin(world, household, 'p-child', 3);
  child.name = 'Tobias Wren';
  child.hunger = { want: DEATH_AT, stage: 'starving' };
  world.decisionClock = { [`starve:${child.id}`]: { personId: child.id, spent: 60_000, of: 60_000, limit: 'starve' } };
  advanceHunger(world);
  assert.equal(child.health.condition, 'dead');
  assert.ok(diedAChild(child));
  const row = familiesOverview(world, () => null).find(one => one.id === household.id);
  assert.ok(!row.people.some(person => /Tobias/.test(person.name)) && row.lost === 1, 'named on the class panel');
  assert.equal(row.lostHunger, 1, 'the class panel counts the child as dead of sickness');
  assert.ok(!hostOverview(world).everyone.some(entity => entity.id === child.id), 'drawn on the Host\'s map');
  const view = projectWorld(world, household.id, 'student', { includeMap: false });
  assert.equal(view.entities.find(entity => entity.id === child.id).location, null, 'drawn on the family\'s own map');
  // The family's video says it by who they were, as it says a death by sickness (sim/flashback.mjs).
  world.status = 'ended';
  const captions = flashbackScript(world, household.id).beats.map(beat => beat.caption || '');
  assert.ok(captions.some(caption => /died of hunger/.test(caption)), 'the flashback does not say the child died of hunger');
  assert.ok(!captions.some(caption => /Tobias/.test(caption)), 'the flashback names the child');
  world.status = 'running';
  validateWorld(world);
});

// ------------------------------------------------------------------------------------------------ the gauge

test('the gauge: the days the store lasts at the family\'s eating, and its level from calm to starving', () => {
  const world = landed('hunger-gauge');
  const household = Object.values(world.households)[0];
  household.played = true;
  for (const person of members(world, household)) { person.task = 'rest'; person.chore = null; }
  household.resources.food = 30;
  const { larder } = larderShown(world, household);
  assert.ok(larder.days > 5 && larder.days < 40, `days ${larder.days}`);
  assert.equal(larder.stage, 'fed');
  const at = days => larderLevel({ days, stage: 'fed' }, 1);
  assert.deepEqual([at(30), at(10), at(5), at(1), at(null)], ['plenty', 'fair', 'low', 'short', 'plenty']);
  assert.equal(larderLevel({ days: 0, stage: 'hungry' }, 0), 'empty');
  assert.equal(larderLevel({ days: 0, stage: 'weak' }, 0), 'weak');
  assert.equal(larderLevel({ days: 0, stage: 'starving' }, 0), 'starving');
  assert.equal(larderLevel(null, 5), null);
  assert.equal(larderFill({ days: 7 }), 0.5);
  assert.ok(larderWorse('low', 'short') && !larderWorse('short', 'low') && !larderWorse(null, 'short'));
  assert.ok(larderLabel({ days: 0, stage: 'starving' }, 0).length <= 40, 'the gauge\'s label is a sentence');
  // The projection carries it for the family's own page.
  const view = projectWorld(world, household.id, 'student', { includeMap: false });
  assert.deepEqual(view.household.larder, larder);
  assert.equal(view.household.hungerTold, undefined);
});

// ------------------------------------------------------------------------------------------------ the winter, and saves

test('the winter nobody plays: everybody comes out of it fed', () => {
  const world = landed('hunger-winter');
  const household = Object.values(world.households)[0];
  emptyLarder(world, household);
  const grown = members(world, household).find(person => (person.age ?? 30) >= 16);
  grown.hunger = { want: STARVING_AT, stage: 'starving' };
  household.hungerTold = { [grown.id]: 'starving' };
  recoverOverWinter(world);
  assert.equal(grown.hunger, undefined);
  assert.equal(household.hungerTold, undefined);
  grown.hunger = { want: WEAK_AT, stage: 'weak' };
  world.status = 'ended';
  world.director.milestones = { ...(world.director.milestones || {}), 'bexar-end': true };
  beginSecondPeriod(world);
  assert.equal(grown.hunger, undefined, 'the second period opened with somebody weak with hunger');
});

test('saves: a class saved before hunger opens as fed, and a hunger that cannot be is refused', () => {
  const world = landed('hunger-save');
  validateWorld(world);
  const person = world.entities[Object.values(world.households)[0].members[0]];
  person.hunger = { want: 3, stage: 'hungry' };
  validateWorld(world);
  person.hunger = { want: -1, stage: 'hungry' };
  assert.throws(() => validateWorld(world), /Invalid hunger/);
  person.hunger = { want: 3, stage: 'famished' };
  assert.throws(() => validateWorld(world), /Invalid hunger/);
  delete person.hunger;
  person.health = { condition: 'well', starved: true };
  assert.throws(() => validateWorld(world), /Invalid hunger/);
});

test('the claims are registered', () => {
  for (const id of ['FIC-GONZ-995', 'FIC-GONZ-996', 'FIC-GONZ-997', 'FIC-GONZ-998', 'FIC-GONZ-999']) assert.match(history, new RegExp(`\\| \\*\\*${id}\\*\\* \\|`), `${id} is not in HISTORY.md`);
});
