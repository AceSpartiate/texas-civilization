// The guided beginning: sim/lesson.mjs, docs/LESSON.md, `FIC-GONZ-210` to `-215`.
//
// A real class played this on Chromebooks on 2026-09-21 and could not work out how to farm, or build
// a house, or do anything else. The owner: "we need to have the tutorial be an integrated forced
// part of the game... one task at a time, guided by the ui and unavoidable. when it's over, each
// student at their own pace should have built a house, farmed and sold a crop of their choosing,
// hunted, and have a well on their land."
//
// So a student's own family is walked through ten steps in order, and **the server holds the gate**.
// What is held down here: the order of the steps; that each one completes because the world says so;
// that the refusal is the server's and is in words; that nothing the game itself asks a family is
// ever refused; that each family goes at its own pace; that a family nobody plays, a family already
// on its land, and every class saved before today have no lesson at all.
//
// Each test here was proven by injecting the regression it guards (scripts/lesson-injections.mjs).
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, projectWorld, stepWorld, validateWorld } from '../sim/world.mjs';
import { ALWAYS, LESSON_DONE_MINUTES, STEPS, actionId, advanceLessons, lessonInvalid, lessonProjection, lessonRefusal } from '../sim/lesson.mjs';
import { RIPEN_TICKS } from '../sim/chores.mjs';
import { clearedPlots, plotsOf } from '../sim/fields.mjs';
import { houseSettled } from '../sim/houses.mjs';
import { holdingOf } from '../sim/grants.mjs';
import { plotRefusal } from '../sim/survey.mjs';
import { huntRefusal } from '../sim/hunting.mjs';
import { siteFactsFor } from '../sim/homesite.mjs';
import { settle, taught } from './support/settled.mjs';

const view = (world, householdId, role = 'student') => projectWorld(world, householdId, role, { includeMap: false });
const send = (world, householdId, input) => applyAction(world, householdId, input);
/** One class under way, with the first family a student's and the rest nobody's. */
function started(seed, { count = 5, map = 'gonzales', players = ['hh-1'] } = {}) {
  const world = createGonzalesWorld(seed, count, { map });
  for (const id of players) world.households[id].played = true;
  world.status = 'running';
  return world;
}
/** Tick until the test's own condition holds, or give up and say what was still true. */
function until(world, holds, cap = 4000, what = 'the world never got there') {
  for (let tick = 0; tick < cap; tick++) {
    if (holds()) return tick;
    stepWorld(world);
  }
  assert.ok(holds(), what);
  return cap;
}
const lessonOf = (world, householdId) => view(world, householdId).lesson;
/** Every grown person of this family standing at home with nothing in hand. */
const hands = (world, household) => household.members.map(id => world.entities[id])
  .filter(person => (person.age ?? 30) >= 16 && !person.chore && !person.travel && person.location.siteId === household.homeSiteId);
/** A place on this family's own land the server would let it survey. */
const surveyable = (world, household) => {
  const bounds = holdingOf(world, household).bounds;
  for (let i = 1; i < 12; i++) for (let j = 1; j < 12; j++) {
    const point = { x: +(bounds.minX + (bounds.maxX - bounds.minX) * i / 12).toFixed(3), y: +(bounds.minY + (bounds.maxY - bounds.minY) * j / 12).toFixed(3) };
    if (!plotRefusal(world, household, point)) return point;
  }
  return null;
};
/** A place on this family's own land it could hunt. */
const huntable = (world, household) => {
  const bounds = holdingOf(world, household).bounds;
  for (let i = 1; i < 12; i++) for (let j = 1; j < 12; j++) {
    const point = { x: +(bounds.minX + (bounds.maxX - bounds.minX) * i / 12).toFixed(3), y: +(bounds.minY + (bounds.maxY - bounds.minY) * j / 12).toFixed(3) };
    if (!huntRefusal(world, household, point)) return point;
  }
  return null;
};
/** Answer whatever the work has stopped to ask this person. */
const answer = (world, household, person, option) => send(world, household.id, { action: 'answer-chore', entityId: person.id, option });

test('the ten steps are the owner\'s own list, in the owner\'s own order, and every one of them says what to do', () => {
  assert.deepEqual(STEPS.map(step => step.id), ['arrive', 'order', 'house', 'survey', 'clear', 'plant', 'harvest', 'sell', 'hunt', 'well']);
  for (const step of STEPS) {
    assert.ok(step.title.split(' ').length <= 5 && step.title.length <= 40, `"${step.title}" is not a short title`);
    assert.ok(step.first.endsWith('.'), `${step.id} has no sentence to refuse with`);
    assert.ok(step.allow().length, `${step.id} allows nothing at all`);
  }
});

test('a played family begins on the first step and an unplayed family beside it has no lesson at all; the Host is never sent one', () => {
  const world = started('lesson-begin');
  const lesson = lessonOf(world, 'hh-1');
  assert.equal(lesson.step, 'arrive');
  assert.equal(lesson.index, 1);
  assert.equal(lesson.of, 10);
  assert.equal(lesson.done, false);
  assert.equal(lesson.did, null, 'nothing has happened yet');
  assert.match(lesson.says, /wagon/i);
  assert.ok(lesson.allow.includes('choose-site'));
  assert.equal(lessonOf(world, 'hh-2'), undefined, 'a family nobody plays is taught nothing');
  assert.equal(view(world, null, 'host').lesson, undefined, 'the Host is not a student');
  assert.equal(view(world, 'hh-1', 'host').lesson, undefined, 'and is sent no student’s lesson even asked for one family');
  // And nothing at all before the teacher begins: the lobby has its own rule (`LOBBY_ACTIONS`).
  const lobby = createGonzalesWorld('lesson-lobby', 5);
  lobby.households['hh-1'].played = true;
  assert.equal(lessonOf(lobby, 'hh-1'), undefined);
  validateWorld(world);
});

test('the server refuses what is not this step\'s work, in words a child can read, and allows what is', () => {
  const world = started('lesson-refuse');
  const household = world.households['hh-1'];
  until(world, () => !household.arriving);
  advanceLessons(world);
  const person = hands(world, household)[0];
  assert.equal(lessonOf(world, 'hh-1').step, 'order');
  // **The step about giving an order allows any work at all**, and deliberately. Found when the two halves of the
  // guided start first ran together (2026-09-21): with only the house's own work allowed, the bar at this step was
  // empty - a house cannot be started until its place and plan are chosen, and neither of those is bar work - so a
  // student was told to choose a work and could press nothing.
  const atOrder = new Set(lessonOf(world, 'hh-1').allow);
  assert.ok(atOrder.has('chore:hunt-timber') && atOrder.has('chore:build-house'), 'the order step leaves nothing to press');
  send(world, 'hh-1', { action: 'chore', entityId: person.id, chore: 'hunt-timber' });
  assert.ok(person.chore, 'the order step refused an order, which is the one thing it must not do');

  // From the house on, the lesson is strict again: one thing at a time, and the rest refused in words.
  advanceLessons(world);
  assert.equal(lessonOf(world, 'hh-1').step, 'house', 'giving an order did not finish the order step');
  const other = hands(world, household).find(one => one.id !== person.id && !one.chore);
  assert.throws(() => send(world, 'hh-1', { action: 'chore', entityId: other.id, chore: 'hunt-timber' }), /Not yet - first, get the house up\./);
  assert.equal(other.chore, null, 'a refused order moved nothing');
  // The list on the page and the gate on the server are the same list, and the server is the one that holds.
  const allow = new Set(lessonOf(world, 'hh-1').allow);
  assert.ok(!allow.has('chore:hunt-timber'));
  assert.ok(allow.has('chore:build-house'));
  assert.equal(lessonRefusal(world, household, { action: 'chore', chore: 'build-house' }), null);
  assert.equal(actionId({ action: 'chore', chore: 'plant-field' }), 'chore:plant-field');
  assert.equal(actionId({ action: 'survey-plot' }), 'survey-plot');
  // A family nobody plays is never gated: the director gives it its orders through this same door.
  assert.equal(lessonRefusal(world, world.households['hh-2'], { action: 'chore', chore: 'hunt-timber' }), null);
  validateWorld(world);
});

test('nothing the game itself asks a family is ever refused, on any step', () => {
  const world = started('lesson-always');
  const household = world.households['hh-1'];
  // Every answer the game puts to a family - the neighbour's call, the march, the army, the road east - and the family's
  // own housekeeping. A lesson that could refuse one of these would break the afternoon it exists to teach.
  for (const action of ['help', 'stay', 'go-upriver', 'stay-in-town', 'go-see', 'stay-home', 'turn-out', 'stay-put', 'army-answer', 'houston-answer', 'road-answer', 'flee', 'flight-stay', 'send-for', 'alamo-courier', 'ask-rider', 'leave-rider', 'rename', 'set-main', 'stop-chore', 'answer-chore', 'travel', 'offer', 'accept-offer']) {
    assert.ok(ALWAYS.includes(action), `${action} can be refused by a lesson`);
    for (const step of STEPS) assert.equal(lessonRefusal({ ...world, households: world.households }, household, { action }), null, `${action} refused on ${step.id}`);
  }
  // And a man who has joined the army is not at home to be taught: his orders are the camp's own (sim/camp.mjs).
  const person = world.entities[household.members[0]];
  person.service = { kind: 'houston', status: 'serving', siteId: household.homeSiteId };
  assert.equal(lessonRefusal(world, household, { action: 'chore', entityId: person.id, chore: 'camp-drill' }), null);
});

test('a class saved before today opens, and a family already standing on its own land is never marched through the lesson', () => {
  // Every class saved before arrivals existed, and every family already settled: nothing to be walked through, no stored
  // lesson written, and no save version moved. The gate is open and stays open.
  const old = settle(createGonzalesWorld('lesson-old', 5));
  old.status = 'running';
  for (const household of Object.values(old.households)) household.played = true;
  advanceLessons(old);
  for (const household of Object.values(old.households)) assert.equal(household.lesson, undefined, `${household.id} was given a lesson it does not need`);
  assert.equal(lessonOf(old, 'hh-1'), undefined);
  const person = old.entities[old.households['hh-1'].members[0]];
  send(old, 'hh-1', { action: 'chore', entityId: person.id, chore: 'hunt-timber' });
  assert.equal(person.chore.id, 'hunt-timber', 'an old class can still be played');
  validateWorld(old);
  // And a family on the road east has its farm behind it: no lesson, whatever step it had reached.
  const fleeing = started('lesson-fled');
  fleeing.households['hh-1'].flight = { status: 'fled' };
  assert.equal(lessonOf(fleeing, 'hh-1'), undefined);
  assert.equal(lessonRefusal(fleeing, fleeing.households['hh-1'], { action: 'chore', chore: 'hunt-timber' }), null);
});

test('each student goes at their own pace: two families of one class are on two different steps, and the clock is nobody\'s', () => {
  const world = started('lesson-pace', { players: ['hh-1', 'hh-2'] });
  const [one, two] = ['hh-1', 'hh-2'].map(id => world.households[id]);
  until(world, () => !one.arriving && !two.arriving);
  advanceLessons(world);
  assert.equal(lessonOf(world, 'hh-1').step, 'order');
  assert.equal(lessonOf(world, 'hh-2').step, 'order');
  send(world, 'hh-1', { action: 'plan-house', layout: 'jacal' });
  send(world, 'hh-1', { action: 'chore', entityId: hands(world, one)[0].id, chore: 'build-house' });
  assert.equal(lessonOf(world, 'hh-1').step, 'house', 'the order was given and the step moved on at once');
  assert.equal(lessonOf(world, 'hh-2').step, 'order', 'the neighbour is where they were');
  assert.equal(lessonOf(world, 'hh-1').did, STEPS[1].did(world, one), 'and is told what just happened');
  validateWorld(world);
});

test('the whole of it, played through: the family ends with a house, a field it cleared, the crop it chose, coin for it, and a hunt', () => {
  const world = started('lesson-through');
  const household = world.households['hh-1'];
  const step = () => lessonOf(world, 'hh-1')?.step ?? 'done';

  // 1. Arrive. Nothing else is open while the wagon is on the track in.
  assert.equal(step(), 'arrive');
  until(world, () => !household.arriving);
  assert.equal(step(), 'order');

  // 2. Delegate a task - the thing nobody worked out in the real class.
  assert.throws(() => send(world, 'hh-1', { action: 'survey-plot', entityId: hands(world, household)[0].id, x: 0, y: 0 }), /Not yet/);
  send(world, 'hh-1', { action: 'plan-house', layout: 'jacal' });
  for (const person of hands(world, household)) send(world, 'hh-1', { action: 'chore', entityId: person.id, chore: 'build-house' });
  assert.equal(step(), 'house');

  // 3. The house. The step does not move until the world says the roof is on.
  assert.equal(houseSettled(household), false);
  until(world, () => houseSettled(household));
  assert.equal(step(), 'survey');
  assert.match(lessonOf(world, 'hh-1').did, /house stands/);

  // 4a. Survey ten acres, at a place the student chose.
  const plot = surveyable(world, household);
  assert.ok(plot, 'nowhere on this family\'s land can be surveyed');
  send(world, 'hh-1', { action: 'survey-plot', entityId: hands(world, household)[0].id, x: plot.x, y: plot.y });
  until(world, () => plotsOf(world, household).length > 1);
  assert.equal(step(), 'clear');

  // 4b. Clear it. The patch the family was founded with does not count: this is ground it broke itself.
  assert.equal(clearedPlots(household).length, 1);
  for (const person of hands(world, household)) send(world, 'hh-1', { action: 'clear-plot', entityId: person.id, x: plot.x, y: plot.y });
  until(world, () => clearedPlots(household).length > 1);
  assert.equal(step(), 'plant');

  // 4c. Plant, and the crop is the student's own choice. The wagon brought seed for one plot; the store is on the list
  // for exactly that reason, and the refusal says so before anybody is sent.
  assert.ok(lessonOf(world, 'hh-1').allow.includes('chore:visit-shop'));
  household.resources.seed = 12;
  const planter = hands(world, household)[0];
  send(world, 'hh-1', { action: 'chore', entityId: planter.id, chore: 'plant-field' });
  until(world, () => planter.chore?.ask?.id === 'crop-choice');
  answer(world, household, planter, 'cotton');
  until(world, () => household.field.state === 'planted');
  assert.equal(household.field.crop, 'cotton', 'the student chose the crop');
  assert.equal(step(), 'harvest');

  // 5. Harvest, once the world has ripened it.
  until(world, () => household.field.state === 'ripe', RIPEN_TICKS * 4);
  send(world, 'hh-1', { action: 'chore', entityId: hands(world, household)[0].id, chore: 'harvest-field' });
  until(world, () => (household.resources.cotton ?? 0) > 0);
  assert.equal(step(), 'sell');

  // 6. Sell it in town, at the store's own counter.
  assert.equal(household.resources.money, 0);
  const seller = hands(world, household)[0];
  send(world, 'hh-1', { action: 'chore', entityId: seller.id, chore: 'visit-shop' });
  until(world, () => seller.chore?.ask?.id === 'which-shop');
  answer(world, household, seller, 'store');
  until(world, () => seller.chore?.ask?.id === 'shop-counter');
  answer(world, household, seller, 'store:cotton:coin');
  until(world, () => (household.resources.money ?? 0) > 0);
  assert.equal(step(), 'hunt');

  // 7. Hunt, at a place the student chose, and home again whatever the shot did.
  const ground = huntable(world, household);
  assert.ok(ground, 'nowhere on this family\'s land can be hunted');
  const hunter = hands(world, household)[0];
  send(world, 'hh-1', { action: 'hunt-land', entityId: hunter.id, x: ground.x, y: ground.y });
  until(world, () => hunter.chore?.ask?.id === 'shot');
  answer(world, household, hunter, 'take');
  until(world, () => !hunter.chore);

  // 8. And the well, which this country does not want: the house has running water at hand, and it is said so rather
  // than left as a step nobody can finish.
  assert.equal(step(), 'done', 'the lesson did not end');
  const closing = lessonOf(world, 'hh-1');
  assert.equal(closing.done, true);
  assert.equal(closing.index, 10);
  assert.match(closing.did, /wants no well|water in the yard/);
  assert.ok(world.events.some(event => event.type === 'lesson' && event.householdId === 'hh-1'), 'the family is told');

  // The owner's list, at the end of it: a house, a field it cleared, a crop of its choosing sold, and a hunt.
  assert.equal(houseSettled(household), true);
  assert.ok(clearedPlots(household).length > 1);
  assert.ok((household.resources.money ?? 0) > 0);
  assert.equal(household.lesson.step, 'done');
  validateWorld(world);

  // The closing card stands for a while and then the lesson is gone from the page entirely.
  world.minute = household.lesson.at + LESSON_DONE_MINUTES;
  assert.equal(lessonOf(world, 'hh-1').done, true);
  world.minute = household.lesson.at + LESSON_DONE_MINUTES + 1;
  assert.equal(lessonOf(world, 'hh-1'), undefined, 'the game is the student\'s now');
  // And the gate is open: anything the family could do, it may do.
  const free = hands(world, household)[0];
  send(world, 'hh-1', { action: 'chore', entityId: free.id, chore: 'hunt-timber' });
  assert.equal(free.chore.id, 'hunt-timber');
});

test('on the real land the family chooses where the house stands before anything else, and digs the well where one is wanted', () => {
  const world = started('lesson-site', { count: 6, map: 'colonies' });
  const household = world.households['hh-1'];
  until(world, () => !household.arriving);
  assert.equal(lessonOf(world, 'hh-1').step, 'arrive', 'the site is part of arriving');
  assert.ok(lessonOf(world, 'hh-1').allow.includes('choose-site'));
  const person = world.entities[household.members[0]];
  assert.throws(() => send(world, 'hh-1', { action: 'chore', entityId: person.id, chore: 'build-house' }), /Not yet - first, come in to your own land\./);
  // A spot on the family's own holding that wants a well, so the last step is a real one.
  const bounds = holdingOf(world, household).bounds;
  let wanted = null;
  for (let i = 1; i < 14 && !wanted; i++) for (let j = 1; j < 14 && !wanted; j++) {
    const point = { x: +(bounds.minX + (bounds.maxX - bounds.minX) * i / 14).toFixed(3), y: +(bounds.minY + (bounds.maxY - bounds.minY) * j / 14).toFixed(3) };
    const facts = siteFactsFor(world, household, point);
    if (facts.can && facts.needsWell) wanted = point;
  }
  assert.ok(wanted, 'no spot on this holding wants a well');
  send(world, 'hh-1', { action: 'choose-site', x: wanted.x, y: wanted.y });
  until(world, () => !household.arriving);
  assert.equal(lessonOf(world, 'hh-1').step, 'order', 'the arrival is finished by the world, not by the page');
  assert.match(lessonOf(world, 'hh-1').did, /standing on land of its own/);
  // The well itself, from its own step: the family has everything else already.
  household.lesson = { step: 'well' };
  const card = lessonOf(world, 'hh-1');
  assert.equal(card.step, 'well');
  assert.equal(card.index, 10);
  assert.ok(card.allow.includes('chore:dig-well'));
  assert.throws(() => send(world, 'hh-1', { action: 'hunt-land', entityId: person.id, x: wanted.x, y: wanted.y }), /Not yet - first, dig the well\./);
  for (const hand of hands(world, household)) send(world, 'hh-1', { action: 'chore', entityId: hand.id, chore: 'dig-well' });
  until(world, () => household.well === true);
  assert.equal(household.lesson.step, 'done');
  assert.match(lessonOf(world, 'hh-1').did, /water in the yard/);
  validateWorld(world);
});

test('the hunt counts when the hunter comes home, whatever the shot did, and never before they have gone', () => {
  const world = started('lesson-hunt');
  const household = world.households['hh-1'];
  until(world, () => !household.arriving);
  // The family has everything the steps before this one ask for; what is measured here is the hunt alone.
  household.lesson = { step: 'hunt' };
  const ground = huntable(world, household);
  const hunter = hands(world, household)[0];
  send(world, 'hh-1', { action: 'hunt-land', entityId: hunter.id, x: ground.x, y: ground.y });
  assert.equal(household.lesson.step, 'hunt', 'setting out is not coming home');
  until(world, () => hunter.chore?.ask?.id === 'shot');
  assert.equal(household.lesson.step, 'hunt', 'and standing downwind is not coming home either');
  // Left alone and walked home: nothing killed, no hide, no powder spent - and the family has still been hunting.
  answer(world, household, hunter, 'leave');
  assert.equal(household.lesson.step, 'hunt', 'still on the road home');
  until(world, () => !hunter.chore);
  assert.equal(household.resources.hides ?? 0, 0, 'nothing was brought home');
  assert.equal(household.lesson.step, 'done', 'the hunt did not count');
  validateWorld(world);
});

test('a family whose student has gone is run by the director and is never gated, and takes up its lesson where it was when they come back', () => {
  const world = started('lesson-absent');
  const household = world.households['hh-1'];
  until(world, () => !household.arriving);
  advanceLessons(world);
  assert.equal(household.lesson.step, 'order');
  household.absent = true;
  const person = hands(world, household)[0];
  send(world, 'hh-1', { action: 'chore', entityId: person.id, chore: 'hunt-timber' });
  assert.equal(person.chore.id, 'hunt-timber', 'the director was refused');
  // And the lesson keeps pace with what the director actually did rather than freezing: somebody was put to work, which
  // is what that step asks for, so the student comes back to the step the family has genuinely reached.
  assert.equal(household.lesson.step, 'house');
  delete household.absent;
  assert.equal(lessonOf(world, 'hh-1').step, 'house');
  assert.throws(() => send(world, 'hh-1', { action: 'survey-plot', entityId: hands(world, household)[0].id, x: 0, y: 0 }), /Not yet/, 'and the gate is shut again behind them');
  validateWorld(world);
});

test('a stored lesson is a step that exists, and a world holding anything else is refused', () => {
  const world = started('lesson-valid');
  const household = world.households['hh-1'];
  assert.equal(lessonInvalid(world, household), null, 'no lesson is a valid lesson');
  for (const bad of [{ step: 'farming' }, { step: 5 }, {}, [], null, 'done', { step: 'done', at: -1 }, { step: 'order', hunted: 'yes' }]) {
    household.lesson = bad;
    assert.ok(lessonInvalid(world, household), `${JSON.stringify(bad)} was accepted as a lesson`);
    assert.throws(() => validateWorld(world), /lesson/i);
  }
  household.lesson = { step: 'done' };
  assert.equal(lessonInvalid(world, household), null);
  assert.equal(lessonProjection(world, household), null, 'a lesson over long ago shows no card');
  validateWorld(world);
  // And a class where every family has been taught is a class that plays exactly as it did.
  const free = taught(settle(createGonzalesWorld('lesson-taught', 5)));
  free.status = 'running';
  for (const each of Object.values(free.households)) each.played = true;
  validateWorld(free);
  assert.equal(lessonOf(free, 'hh-1'), undefined);
});

// A forced lesson that cannot be finished is worse than a loose one, and the sale is where a class could have stuck:
// the storekeeper's purse holds two reales (`docs/MONEY_AND_GLORY.md`, the owner's own choice) and the store pays in
// food as readily as in coin, so a student who carried their crop to town and came home with meal had sold it and the
// step would not have known. Found 2026-09-21 while merging the two halves.
test('the sale is finished by the crop leaving the house, not only by coin coming back', () => {
  const world = started('lesson-sold');
  const household = world.households['hh-1'];
  until(world, () => !household.arriving);
  // Stand the family on the sell step, with a crop in the house and not a real to its name.
  household.lesson = { step: 'sell' };
  household.resources = { ...household.resources, money: 0, cotton: 3, food: 10 };
  advanceLessons(world);
  assert.equal(lessonOf(world, 'hh-1').step, 'sell', 'the step finished before anything was sold');

  // Somebody is at the store, and the cotton goes out of the house for food rather than for coin.
  const person = hands(world, household)[0];
  person.chore = { id: 'visit-shop', step: 0, wait: 0, doing: 'at the store' };
  advanceLessons(world);
  household.resources = { ...household.resources, cotton: 0, food: 16 };
  advanceLessons(world);
  assert.equal(household.resources.money, 0, 'this test is about a sale that brought back no coin');
  assert.notEqual(lessonOf(world, 'hh-1')?.step, 'sell', 'a crop sold for food did not finish the step');
  validateWorld(world);
});

test('what leaves the house down the family is not a sale', () => {
  const world = started('lesson-eaten');
  const household = world.households['hh-1'];
  until(world, () => !household.arriving);
  household.lesson = { step: 'sell' };
  household.resources = { ...household.resources, money: 0, cotton: 3, food: 10 };
  advanceLessons(world);
  // Nobody is at a store; the food simply goes down, as it does every day of a class.
  household.resources = { ...household.resources, food: 4 };
  advanceLessons(world);
  assert.equal(lessonOf(world, 'hh-1').step, 'sell', 'eating the larder was counted as selling the crop');
  validateWorld(world);
});
