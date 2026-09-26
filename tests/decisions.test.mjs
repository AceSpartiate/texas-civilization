// One shape for every decision.
//
// The owner asked whether hunting could work as a hidden tutorial for taking part in a
// battle. It can, but only on one condition: the small decision and the large one have to
// be the *same control*. A student who learns "a question arrives on a person, each answer
// says what it costs, and silence is also an answer" while hunting carries nothing to the
// call from Gonzales if that call is four hard-coded buttons with the price glued onto a
// label. So this file guards the shape rather than either feature.
//
// Nothing in the game says any of this out loud. That was the owner's word - hidden - and
// it is also the safer design: a game that told a class hunting is practice for shooting
// at people would be drawing a line this project has no business drawing.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createSettledWorld } from './support/settled.mjs';
import { applyAction, projectWorld, stepWorld } from '../sim/world.mjs';
import { TIMELINE, callAvailability } from '../sim/directors.mjs';

const running = (seed = 'decisions', count = 5) => {
  const world = createSettledWorld(seed, count);
  world.status = 'running';
  return world;
};
const view = (world, householdId) => projectWorld(world, householdId, 'student', { includeMap: false });

/** Run a class until this household is asked something, or give up. */
function untilCall(world, householdId, { accept = false } = {}) {
  for (let tick = 0; tick < 400; tick++) {
    stepWorld(world);
    const request = view(world, householdId).request;
    if (request?.status === 'open') {
      if (!accept || request.kind === 'march') return request;
      // A rumor is answered by going to see; the call proper is put in town.
      applyAction(world, householdId, { action: request.kind === 'rumor' ? 'go-see' : 'help', entityId: world.households[householdId].principalId });
    }
  }
  return null;
}

/** The same, for a hunt's question. */
function untilHuntAsk(world, householdId = 'hh-1', entityId = 'hh-1-mateo') {
  applyAction(world, householdId, { action: 'chore', entityId, chore: 'hunt-timber' });
  for (let tick = 0; tick < 200; tick++) {
    if (world.entities[entityId].chore?.ask) return world.entities[entityId].chore.ask;
    stepWorld(world);
  }
  return null;
}

test('a call from outside and a question from inside the work are the same kind of thing', () => {
  const call = untilCall(running('shape'), 'hh-1');
  const ask = untilHuntAsk(running('shape-hunt'));
  assert.ok(call, 'no family was ever called on');
  assert.ok(ask, 'no hunt ever asked anything');
  // The whole basis of the transfer: if these two diverge, learning one teaches nothing
  // about the other, and the small decision stops rehearsing the large one.
  for (const [name, decision] of [['the call from Gonzales', call], ['the hunt', ask]]) {
    assert.ok(decision.text && decision.text.length > 20, `${name} does not say what is being asked`);
    assert.ok(Array.isArray(decision.options) && decision.options.length >= 2, `${name} offers no answers`);
    for (const option of decision.options) {
      assert.ok(option.id, `${name}: an answer with no id`);
      assert.ok(option.label, `${name}: an answer with no words on it`);
      assert.ok(option.note && option.note.length > 10, `${name}: "${option.label}" does not say what it would cost`);
    }
  }
});

test('every answer to a call says what it costs, in that family’s own terms', () => {
  const world = running('costs');
  const call = untilCall(world, 'hh-1');
  const help = call.options.find(option => option.id === 'help');
  const stay = call.options.find(option => option.id === 'stay');
  assert.match(help.note, /[Tt]wo food/, `"${help.note}" does not name the price`);
  assert.match(stay.note, /[Oo]ne food/);
  // Named, not generic: this is about a person the student knows.
  const name = world.entities[world.households['hh-1'].principalId].name;
  assert.ok(stay.note.includes(name), `"${stay.note}" could be about anybody`);
});

test('what the control says is open is exactly what the world will allow', () => {
  // The drift this guards is not hypothetical: "Help - 2 food" used to sit there enabled
  // for a household with one food and fail on the press. The button and the refusal now
  // come from one function, and this is the test that keeps them there.
  // Each class is one where hh-1 hears the word firm enough to be called, not third-hand as a rumor (sim/directors.mjs).
  const cases = [
    ['thin', world => { world.households['hh-1'].resources.food = 1; }, 'help', /two food/i],
    ['away-1', world => {
      const principal = world.entities[world.households['hh-1'].principalId];
      applyAction(world, 'hh-1', { action: 'travel', entityId: principal.id, destination: 'gonzales' });
    }, 'help', /until this person arrives/i],
  ];
  for (const [label, arrange, option, why] of cases) {
    const world = running(`allow-${label}`);
    const call = untilCall(world, 'hh-1');
    assert.ok(call, `${label}: nobody was called on`);
    assert.equal(call.kind, 'supplies', `${label}: hh-1 was asked about a rumor, not called on`);
    arrange(world);
    const after = view(world, 'hh-1').request.options.find(entry => entry.id === option);
    assert.equal(after.can, false, `${label}: the control still offers "${option}"`);
    assert.match(after.why, why, `${label}: the reason given was "${after.why}"`);
    // And the world refuses it with the same sentence, which is the half that matters.
    assert.throws(
      () => applyAction(world, 'hh-1', { action: option, entityId: world.households['hh-1'].principalId }),
      new RegExp(after.why.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
      `${label}: the control and the refusal do not agree`);
  }
});

test('a call nobody answered is written down, the way an unanswered hunt is', () => {
  const world = running('lapsed');
  const call = untilCall(world, 'hh-1');
  assert.ok(call, 'nobody was called on');
  // Let it go by. Silence is an answer and used to be the only one this game never wrote
  // down - a family that never came to the door had no story about it at all.
  for (let tick = 0; tick < 400 && world.minute < TIMELINE.approach + 60; tick++) stepWorld(world);
  assert.equal(world.requests['hh-1'].status, 'expired');
  const said = world.events.filter(event => /Nobody answered the neighbour/.test(event.text) && event.householdId === 'hh-1');
  assert.equal(said.length, 1, 'a family let the call lapse and its own record says nothing about it');
  assert.ok(said[0].causes.includes(world.requests['hh-1'].id), 'the record does not point back at what was asked');
  // Once, not once a tick, or the epilogue is built out of one moment repeated.
  //
  // ceiling: `once()` already guarantees this - the whole expiry block runs on a milestone
  // that is set the first time it fires - so no injection into the loop's own guard can
  // make this fail today. Kept because the guarantee lives somewhere else entirely, and
  // the day this moves out of `once` the assertion is the only thing that would notice.
  for (let tick = 0; tick < 20; tick++) stepWorld(world);
  assert.equal(world.events.filter(event => /Nobody answered the neighbour/.test(event.text) && event.householdId === 'hh-1').length, 1);
});

test('a march nobody answered is written down, and it names who was left standing', () => {
  const world = running('lapsed-march');
  const march = untilCall(world, 'hh-1', { accept: true });
  assert.ok(march && march.kind === 'march', 'no family was ever asked to go upriver');
  const waiting = world.entities[march.actorId].name;
  for (let tick = 0; tick < 400 && world.minute < TIMELINE.approach + 60; tick++) stepWorld(world);
  assert.equal(world.marches['hh-1'].status, 'expired');
  // Shut when a walk could no longer reach the men before first light (sim/directors.mjs `marchCloses`, `FIC-GONZ-446`), not at dawn.
  const said = world.events.filter(event => /went up the river without/.test(event.text) && event.householdId === 'hh-1');
  assert.equal(said.length, 1);
  assert.ok(said[0].text.includes(waiting), `"${said[0].text}" does not name who was left`);
  assert.equal(said[0].actorId, march.actorId);
});

test('the price of going upriver is the one that was quoted, not a fresh reading', () => {
  // Kept from the older behaviour on purpose: nine miles up the river tire somebody, so a
  // family shown "will come back tired" must not be handed a hurt man because the cost was
  // read again at the end. A control that states a price has to charge that price.
  const world = running('quoted');
  const march = untilCall(world, 'hh-1', { accept: true });
  assert.ok(march);
  const quoted = march.options.find(option => option.id === 'go-upriver').note;
  assert.ok(quoted && quoted.length > 10);
  assert.ok(quoted.startsWith(world.marches['hh-1'].risk), 'the control is reading the risk fresh instead of the one on the offer');
  // What they carry is stated as the rule rather than as a count, so it cannot move under
  // a student either: the record afterwards says how much actually went.
  assert.match(quoted, /powder/);
  // And it holds when the person's state moves under it, which is the only way a fresh
  // reading is visible at all: comparing the note to the stored risk cannot tell them
  // apart while the two would agree anyway.
  const actor = world.entities[march.actorId];
  actor.health = { condition: actor.health.condition === 'tired' ? 'well' : 'tired' };
  const reread = view(world, 'hh-1').request.options.find(option => option.id === 'go-upriver').note;
  assert.equal(reread, quoted, 'the price on the button changed while a student was looking at it');
});

test('callAvailability is the one place either half asks', () => {
  const world = running('one-place');
  untilCall(world, 'hh-1');
  const principal = world.entities[world.households['hh-1'].principalId];
  assert.equal(callAvailability(world, 'hh-1', principal, 'help').can, true);
  world.households['hh-1'].resources.food = 0;
  assert.equal(callAvailability(world, 'hh-1', principal, 'help').can, false);
  assert.equal(callAvailability(world, 'hh-1', principal, 'stay').can, true, 'staying home costs nothing and is always open at home');
  principal.health = { condition: 'dead' };
  for (const action of ['help', 'stay', 'go-upriver']) {
    assert.equal(callAvailability(world, 'hh-1', principal, action).can, false, `a dead man was offered "${action}"`);
  }
});
