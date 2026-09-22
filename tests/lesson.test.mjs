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
import { ALWAYS, LESSON_DONE_MINUTES, LESSON_RESUME_MS, STEPS, actionId, advanceLessons, lessonInvalid, lessonProjection, lessonRefusal } from '../sim/lesson.mjs';
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

/**
 * Owner, 2026-09-21: *"When I have the mom start to cut the road, and then I switch to the Dad, he can't start working
 * on the house? That isn't right."*
 *
 * Reproduced in a browser, and it is not about switching: the father can be given orders perfectly well. What happens
 * is that setting anybody to work finishes the `order` step, which opens `house` - and `house` said "keep the family at
 * the house until it stands" from the moment it opened, whether or not a house had been chosen. Until one is, every
 * icon on every person is either shut by this step or refused by the server with "Choose a house to build first", so
 * the step's own sentence asks for the one thing nobody on the bar can be set to.
 *
 * The reason was on the screen twice over - inside the icon, and in the guide's second line - and neither is the
 * sentence a student is reading. So the step says the prerequisite itself now.
 */
test('the step that asks for the house says to choose one first, until one is chosen', () => {
  const world = started('lesson-house-words');
  const household = world.households['hh-1'];
  until(world, () => !household.arriving);
  household.lesson = { step: 'house' };
  assert.equal(household.house, undefined, 'this test is about a family that has not chosen a house');

  const before = lessonProjection(world, household);
  assert.equal(before.step, 'house');
  assert.match(before.says, /Choose a house first/, 'the step asked the family to keep at a house that does not exist yet');
  assert.match(before.says, /on the left/, 'the step says to choose a house without saying where that is done');
  assert.doesNotMatch(before.says, /Keep the family at the house/);

  // With a house chosen, the step is the one it always was.
  household.house = { layout: 'round-log', work: 0 };
  const after = lessonProjection(world, household);
  assert.match(after.says, /Keep the family at the house until it stands/);
  assert.doesNotMatch(after.says, /Choose a house first/);
  // And either way the step allows the plan to be chosen, or the sentence would be asking for something it forbids.
  assert.ok(before.allow.includes('plan-house'), 'the step tells the family to choose a house and does not allow it');
  validateWorld(world);
});

// ------------------------------------------------------------------------------------------------- the X on the strip
// Owner, 2026-09-22: "i should be able to X off the tutorial to stop it and just do what i want." Asked who gets the X,
// the owner chose "Everyone, always": every student and every solo player, at any step, and once off it stays off for
// that family. This amends the "unavoidable" of 2026-09-21 (docs/LESSON.md §1).
/** Two played families standing on their land at the strict house step, where anything but the house is refused. */
function atTheHouse(seed) {
  const world = started(seed, { players: ['hh-1', 'hh-2'] });
  const household = world.households['hh-1'];
  until(world, () => !household.arriving && !world.households['hh-2'].arriving);
  for (const id of ['hh-1', 'hh-2']) world.households[id].lesson = { step: 'house' };
  return { world, household };
}

test('stopping the guided start opens the gate: an order the step refused a moment ago now goes through', () => {
  const { world, household } = atTheHouse('lesson-stop-gate');
  const person = hands(world, household)[0];
  assert.throws(() => send(world, 'hh-1', { action: 'chore', entityId: person.id, chore: 'hunt-timber' }), /Not yet/, 'the step did not refuse, so this test would prove nothing');
  assert.ok(ALWAYS.includes('stop-lesson'), 'the order to stop the lesson can be refused by the lesson');
  send(world, 'hh-1', { action: 'stop-lesson' });
  assert.equal(household.lesson.step, 'done');
  assert.equal(household.lesson.stopped, true);
  send(world, 'hh-1', { action: 'chore', entityId: person.id, chore: 'hunt-timber' });
  assert.equal(person.chore?.id, 'hunt-timber', 'the order is still refused after the student stopped the lesson');
  // And it stays off: the tick does not start it again, and nothing about the family walks it back to a step.
  for (let tick = 0; tick < 5; tick++) stepWorld(world);
  assert.equal(household.lesson.step, 'done');
  assert.equal(lessonRefusal(world, household, { action: 'survey-plot' }), null);
  validateWorld(world);
});

test('after the X the page is sent no lesson at all, not even the closing card', () => {
  const { world } = atTheHouse('lesson-stop-view');
  assert.equal(lessonOf(world, 'hh-1').step, 'house');
  send(world, 'hh-1', { action: 'stop-lesson' });
  const seen = view(world, 'hh-1');
  assert.equal('lesson' in seen, false, `the projection still carries a lesson: ${JSON.stringify(seen.lesson)}`);
  // A second press - a double click, a second tab - is refused in words rather than doing anything.
  assert.throws(() => send(world, 'hh-1', { action: 'stop-lesson' }), /no guided start running/);
});

test('a student can stop only their own family\'s guided start', () => {
  const { world, household } = atTheHouse('lesson-stop-other');
  const other = world.households['hh-2'];
  // What a student sends is applied to the household their own cookie names (server/app.mjs), whatever the order carries.
  send(world, 'hh-2', { action: 'stop-lesson', householdId: 'hh-1', entityId: household.members[0] });
  assert.equal(other.lesson.stopped, true);
  assert.equal(household.lesson.step, 'house', 'another family’s student stopped this family’s lesson');
  assert.equal(household.lesson.stopped, undefined);
  assert.equal(lessonOf(world, 'hh-1').step, 'house');
  assert.throws(() => send(world, 'hh-1', { action: 'chore', entityId: hands(world, household)[0].id, chore: 'hunt-timber' }), /Not yet/);
  // Nor is a family whose student has gone stopped on their behalf: the director runs it and never presses the X.
  household.absent = true;
  assert.throws(() => send(world, 'hh-1', { action: 'stop-lesson' }), /own student/);
  assert.equal(household.lesson.stopped, undefined);
});

test('the Host cannot stop anybody\'s guided start', () => {
  const { world, household } = atTheHouse('lesson-stop-host');
  // The Host has no household: a Host order that reached the world would arrive with none.
  for (const nobody of [null, undefined, 'host']) {
    assert.throws(() => send(world, nobody, { action: 'stop-lesson' }), /own student/, `the Host (${nobody}) stopped a lesson`);
  }
  assert.equal(household.lesson.step, 'house');
  assert.equal(household.lesson.stopped, undefined);
});

test('a stopped lesson survives a save and reload, and stays stopped', () => {
  const { world, household } = atTheHouse('lesson-stop-save');
  send(world, 'hh-1', { action: 'stop-lesson' });
  const reopened = JSON.parse(JSON.stringify(world));
  validateWorld(reopened);
  assert.deepEqual(reopened.households['hh-1'].lesson, household.lesson);
  assert.equal(view(reopened, 'hh-1').lesson, undefined);
  const person = hands(reopened, reopened.households['hh-1'])[0];
  send(reopened, 'hh-1', { action: 'chore', entityId: person.id, chore: 'hunt-timber' });
  assert.equal(person.chore?.id, 'hunt-timber', 'the reopened class put the gate back');
  // And a save cannot carry a stop that is not a way of being finished, or a marker that is not `true`.
  for (const bad of [{ step: 'house', stopped: true }, { step: 'done', stopped: 'yes' }]) {
    reopened.households['hh-1'].lesson = bad;
    assert.throws(() => validateWorld(reopened), /lesson/i, `${JSON.stringify(bad)} was accepted`);
  }
});

// ------------------------------------------------------------------------------------------- "Resume tutorial"
// Owner, 2026-09-22: "After closing the tutorial, show a small 'Resume tutorial' button for five real minutes from the
// original dismissal, including across reloads. Resume existing progress; quietly show dismissal/resumption to the
// teacher." Real time is the server's, handed in (`now`), so every clock here is held still or jumped on purpose.
const T0 = 1_800_000_000_000;
/** An order sent at a moment of the server's real clock. */
const sendAt = (world, householdId, input, now) => applyAction(world, householdId, input, { now });
const resumeOf = (world, householdId, now, role = 'student') => projectWorld(world, householdId, role, { includeMap: false, now }).lessonResume;

test('"Resume tutorial" puts the family back on the step it stopped on, with everything it had gathered, and the gate shuts again', () => {
  const { world, household } = atTheHouse('lesson-resume-same');
  // Progress the steps gather as they go: a sale watched, the stock of each good it was watched against.
  household.lesson = { step: 'house', sold: true, had: { cotton: 4, food: 9 } };
  const person = hands(world, household)[0];
  sendAt(world, 'hh-1', { action: 'stop-lesson' }, T0);
  assert.equal(household.lesson.from, 'house', 'the X did not keep the step it was pressed on');
  sendAt(world, 'hh-1', { action: 'chore', entityId: person.id, chore: 'hunt-timber' }, T0 + 1000);
  sendAt(world, 'hh-1', { action: 'stop-chore', entityId: person.id }, T0 + 2000);
  sendAt(world, 'hh-1', { action: 'resume-lesson' }, T0 + 60_000);
  assert.equal(household.lesson.step, 'house', `the family came back on ${household.lesson.step}, not the step it stopped on`);
  assert.equal(household.lesson.stopped, undefined);
  assert.equal(household.lesson.sold, true, 'what the family had gathered was thrown away by the X');
  assert.deepEqual(household.lesson.had, { cotton: 4, food: 9 });
  assert.equal(lessonOf(world, 'hh-1').step, 'house');
  assert.throws(() => sendAt(world, 'hh-1', { action: 'chore', entityId: person.id, chore: 'hunt-timber' }, T0 + 61_000), /Not yet/, 'the gate stayed open after the resume');
  validateWorld(world);
});

test('"Resume tutorial" is refused once five real minutes have passed since the X, however few minutes of 1835 went by', () => {
  assert.equal(LESSON_RESUME_MS, 5 * 60 * 1000);
  const { world, household } = atTheHouse('lesson-resume-late');
  sendAt(world, 'hh-1', { action: 'stop-lesson' }, T0);
  assert.throws(() => sendAt(world, 'hh-1', { action: 'resume-lesson' }, T0 + LESSON_RESUME_MS), /too late/);
  assert.equal(household.lesson.stopped, true, 'a refused resume changed the lesson');
  // And a moment inside it is not refused, with no world time having passed at all: the window is the server's clock.
  sendAt(world, 'hh-1', { action: 'resume-lesson' }, T0 + LESSON_RESUME_MS - 1);
  assert.equal(household.lesson.step, 'house');
});

test('a second X after a resume does not start another five minutes: the window is the first press\'s', () => {
  const { world, household } = atTheHouse('lesson-resume-once');
  sendAt(world, 'hh-1', { action: 'stop-lesson' }, T0);
  sendAt(world, 'hh-1', { action: 'resume-lesson' }, T0 + 4 * 60_000);
  sendAt(world, 'hh-1', { action: 'stop-lesson' }, T0 + 4.5 * 60_000);
  assert.equal(household.lesson.stoppedAt, T0, 'the second X moved the time of the first');
  assert.equal(household.lesson.resumeBy, T0 + LESSON_RESUME_MS, 'the second X opened a new window');
  assert.throws(() => sendAt(world, 'hh-1', { action: 'resume-lesson' }, T0 + LESSON_RESUME_MS + 1), /too late/);
  // Inside the first press's window it still can, as often as the student likes.
  sendAt(world, 'hh-1', { action: 'resume-lesson' }, T0 + LESSON_RESUME_MS - 10);
  assert.equal(household.lesson.step, 'house');
});

test('a student can take up only their own family\'s guided start again, and never one whose student has gone', () => {
  const { world, household } = atTheHouse('lesson-resume-other');
  sendAt(world, 'hh-1', { action: 'stop-lesson' }, T0);
  // What a student sends is applied to their own household (server/app.mjs), whatever the order names.
  assert.throws(() => sendAt(world, 'hh-2', { action: 'resume-lesson', householdId: 'hh-1', entityId: household.members[0] }, T0 + 1000), /no stopped guided start/);
  assert.equal(household.lesson.stopped, true, 'another family’s student took this family’s guided start back up');
  household.absent = true;
  assert.throws(() => sendAt(world, 'hh-1', { action: 'resume-lesson' }, T0 + 2000), /own student/);
  assert.equal(household.lesson.stopped, true, 'the director took up the guided start for a family whose student has gone');
});

test('the Host cannot take up anybody\'s guided start again', () => {
  const { world, household } = atTheHouse('lesson-resume-host');
  sendAt(world, 'hh-1', { action: 'stop-lesson' }, T0);
  for (const nobody of [null, undefined, 'host']) {
    assert.throws(() => sendAt(world, nobody, { action: 'resume-lesson' }, T0 + 1000), /own student/, `the Host (${nobody}) resumed a lesson`);
  }
  assert.equal(household.lesson.stopped, true);
});

test('the window survives a save and reload, and a stop saved before the window existed has none', () => {
  const { world, household } = atTheHouse('lesson-resume-save');
  sendAt(world, 'hh-1', { action: 'stop-lesson' }, T0);
  const reopened = JSON.parse(JSON.stringify(world));
  validateWorld(reopened);
  assert.deepEqual(reopened.households['hh-1'].lesson, household.lesson);
  assert.equal(resumeOf(reopened, 'hh-1', T0 + 30_000)?.until, T0 + LESSON_RESUME_MS, 'the reopened class forgot the window');
  sendAt(reopened, 'hh-1', { action: 'resume-lesson' }, T0 + 30_000);
  assert.equal(reopened.households['hh-1'].lesson.step, 'house');
  validateWorld(reopened);
  // A class saved yesterday, with the X pressed and no time on it: stopped, the window long gone.
  const old = JSON.parse(JSON.stringify(world));
  old.households['hh-1'].lesson = { step: 'done', at: 10, stopped: true };
  validateWorld(old);
  assert.throws(() => sendAt(old, 'hh-1', { action: 'resume-lesson' }, T0), /too late/, 'an old save’s stop could be taken back up');
  // And a save cannot carry half a window, or one that ends before it began.
  for (const bad of [{ stoppedAt: T0 }, { resumeBy: T0 }, { stoppedAt: T0, resumeBy: T0 - 1 }, { from: 'nowhere', stoppedAt: T0, resumeBy: T0 + 1 }]) {
    old.households['hh-1'].lesson = { step: 'done', at: 10, stopped: true, ...bad };
    assert.throws(() => validateWorld(old), /lesson/i, `${JSON.stringify(bad)} was accepted`);
  }
});

test('the page is offered the resume only while the window is open, and only the family that stopped', () => {
  const { world } = atTheHouse('lesson-resume-offer');
  assert.equal(resumeOf(world, 'hh-1', T0), undefined, 'offered before the X');
  sendAt(world, 'hh-1', { action: 'stop-lesson' }, T0);
  assert.deepEqual(resumeOf(world, 'hh-1', T0 + 1000), { until: T0 + LESSON_RESUME_MS, ms: LESSON_RESUME_MS - 1000 });
  assert.equal(resumeOf(world, 'hh-1', T0 + LESSON_RESUME_MS), undefined, 'still offered when the window has shut');
  assert.equal(resumeOf(world, 'hh-2', T0 + 1000), undefined, 'offered to a family that never stopped');
  assert.equal(resumeOf(world, null, T0 + 1000, 'host'), undefined, 'offered to the Host');
  // Taken up, the strip is back and the offer is gone.
  sendAt(world, 'hh-1', { action: 'resume-lesson' }, T0 + 2000);
  assert.equal(resumeOf(world, 'hh-1', T0 + 3000), undefined, 'offered while the lesson is running again');
});

test('the Host\'s class panel says quietly that a family stopped and resumed the guided start; no student is told', () => {
  const { world } = atTheHouse('lesson-resume-host-words');
  const row = id => projectWorld(world, null, 'host', { includeMap: false }).live.families.find(family => family.id === id);
  assert.equal(row('hh-1').guided, undefined, 'a family working through its steps has a line');
  sendAt(world, 'hh-1', { action: 'stop-lesson' }, T0);
  assert.equal(row('hh-1').guided, 'stopped the guided start at step 3');
  sendAt(world, 'hh-1', { action: 'resume-lesson' }, T0 + 1000);
  assert.equal(row('hh-1').guided, 'resumed the guided start: on step 3 of 10');
  assert.equal(row('hh-2').guided, undefined);
  // Written down for the Host alone: no family's journal carries either line, not even the family's own.
  const written = world.events.filter(event => ['lesson-stopped', 'lesson-resumed'].includes(event.type));
  assert.deepEqual(written.map(event => [event.type, event.visibility, event.about, event.householdId]), [['lesson-stopped', 'host', 'hh-1', undefined], ['lesson-resumed', 'host', 'hh-1', undefined]]);
  for (const id of ['hh-1', 'hh-2']) assert.equal(view(world, id).events.some(event => written.some(one => one.id === event.id)), false, `${id}'s journal carries the Host's record`);
});

test('a family that did the step\'s work while the guided start was off is walked on from it when it comes back', () => {
  const { world, household } = atTheHouse('lesson-resume-moved');
  household.lesson = { step: 'hunt' };
  household.resources.hides = 0;
  sendAt(world, 'hh-1', { action: 'stop-lesson' }, T0);
  household.resources.hides = 1;
  sendAt(world, 'hh-1', { action: 'resume-lesson' }, T0 + 1000);
  assert.notEqual(household.lesson.step, 'hunt', 'the family was put back on a step the world says it has done');
  assert.equal(household.lesson.stopped, undefined);
});
