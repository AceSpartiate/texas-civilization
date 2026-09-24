// The auto switch (owner, 2026-09-16, docs/FAMILY_PANEL.md §11.7, sim/auto.mjs).
//
// "For all combat, and hunting, the player should be able to let it automatically happen (autohunt, or autofight) but the
// player should have the ability to micromanage their character during hunting or battle. If they fail to make the
// character's choices in a timely manner then eventually the auto should take over." One switch per person, the world's;
// on auto the last order is repeated and every question answered at once as families nobody plays answer; by hand the
// game's own windows stand and then auto decides that one question; the Runaway Scrape follows the main person's switch,
// a family by hand given a day, and refusing to go is an answer of its own.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createSettledWorld } from './support/settled.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, projectWorld, rollFamily, stepWorld, validateWorld } from '../sim/world.mjs';
import { beginSecondPeriod, beginThirdPeriod } from '../sim/periods.mjs';
import { momentOf } from '../sim/directors.mjs';
import { calendarMinutes } from '../sim/clock.mjs';
import { ASK_PATIENCE } from '../sim/chores.mjs';
import { closeDetachment, closeQuestion, openDetachment, openQuestion, withTheArmy } from '../sim/army.mjs';
import { COURIER_OFFERED, share as alamoShare } from '../sim/alamo.mjs';
import { packFlight } from '../sim/scrape.mjs';
import { FLIGHT_PATIENCE, REPEATED } from '../sim/auto.mjs';
import { autoLabel, needsOf } from '../public/family-panel.js';

const view = (world, householdId, role = 'student') => projectWorld(world, householdId, role, { includeMap: false });
const running = seed => { const world = createSettledWorld(seed); world.status = 'running'; return world; };
const until = (world, done, limit = 9000) => { for (let t = 0; t < limit && !done() && world.status === 'running'; t++) stepWorld(world); };
const untilMoment = (world, key) => until(world, () => world.director.milestones[key]);
const untilMinute = (world, minute) => until(world, () => world.minute >= minute);
const shown = (world, householdId, id) => view(world, householdId).entities.find(e => e.id === id);
const story = (world, id) => world.events.filter(event => event.actorId === id).map(event => event.text);

test('the switch is the person\'s and the world\'s: set from the family, shown on the projection, refused for the wrong person, and off by default', () => {
  const world = running('auto-switch');
  const elena = world.entities['hh-1-elena'];
  assert.equal(shown(world, 'hh-1', elena.id).auto, undefined, 'a person is on auto before anybody asked');
  applyAction(world, 'hh-1', { action: 'set-auto', entityId: elena.id, auto: true });
  assert.equal(elena.auto, true);
  assert.equal(shown(world, 'hh-1', elena.id).auto, true, 'the family is not shown the switch');
  assert.ok(story(world, elena.id).some(text => /decide for themself/.test(text)), 'the switch was not written down');
  assert.throws(() => applyAction(world, 'hh-2', { action: 'set-auto', entityId: elena.id, auto: true }), /Choose one of your family/);
  assert.throws(() => applyAction(world, 'hh-1', { action: 'set-auto', entityId: 'hh-1-nobody', auto: true }), /Choose one of your family/);
  applyAction(world, 'hh-1', { action: 'set-auto', entityId: elena.id, auto: false });
  assert.equal(elena.auto, undefined, 'off is not absent, so a saved class would carry it');
  assert.equal(shown(world, 'hh-1', elena.id).auto, undefined);
  // The words the switch shows, from the projection's `auto` alone.
  assert.match(autoLabel(elena, false), new RegExp(`Let ${elena.name} decide`));
  assert.match(autoLabel(elena, true), /take the choices back/);
  elena.auto = 'yes';
  assert.throws(() => validateWorld(world), /auto/);
  elena.auto = true; elena.order = { chore: 'plant-field' };
  assert.throws(() => validateWorld(world), /remembered order/);
  delete elena.order;
  validateWorld(world);
});

test('on auto a hunt never stops to ask: the shot is decided at once, the hunt repeated when they come home, and stopped by the switch', () => {
  const world = running('auto-hunt');
  const household = world.households['hh-1'];
  const elena = world.entities['hh-1-elena'], mateo = world.entities['hh-1-mateo'];
  assert.ok(elena.skills.hunting >= 2 && mateo.skills.hunting < 2, 'the fixture\'s hands changed');
  household.resources.powder = 6;
  for (const person of [elena, mateo]) applyAction(world, 'hh-1', { action: 'set-auto', entityId: person.id, auto: true });
  applyAction(world, 'hh-1', { action: 'chore', entityId: elena.id, chore: 'hunt-timber' });
  // The family has one rifle, and Elena has it (owner, 2026-09-24; sim/keeping.mjs): Mateo is told so, and waits his turn.
  assert.throws(() => applyAction(world, 'hh-1', { action: 'chore', entityId: mateo.id, chore: 'hunt-timber' }), new RegExp(`${elena.name} has the rifle`));
  assert.deepEqual(elena.order, { chore: 'hunt-timber', mode: 'foot' }, 'the order was not remembered');
  assert.ok(REPEATED.includes(elena.order.chore));
  let asked = 0, marked = 0;
  const finished = id => story(world, id).filter(text => /^.* finished: hunt/.test(text)).length;
  for (let t = 0; t < 400 && finished(elena.id) < 2; t++) {
    stepWorld(world);
    if (elena.chore?.ask || mateo.chore?.ask) asked++;
    if (needsOf(view(world, 'hh-1'), elena.id).some(need => need.kind === 'asking')) marked++;
  }
  assert.equal(asked, 0, `a person on auto stood waiting on the family for ${asked} ticks`);
  assert.equal(marked, 0, 'a "!" was raised for a person on auto');
  assert.ok(finished(elena.id) >= 2, `Elena hunted ${finished(elena.id)} times: the order was not repeated`);
  // Elena home and off auto: the rifle is Mateo's turn, and on auto he too decides at once.
  applyAction(world, 'hh-1', { action: 'set-auto', entityId: elena.id, auto: false });
  for (let t = 0; t < 400 && elena.chore; t++) stepWorld(world);
  applyAction(world, 'hh-1', { action: 'chore', entityId: mateo.id, chore: 'hunt-timber' });
  for (let t = 0; t < 400 && finished(mateo.id) < 1; t++) { stepWorld(world); if (mateo.chore?.ask) asked++; }
  assert.equal(asked, 0, `Mateo on auto stood waiting on the family for ${asked} ticks`);
  applyAction(world, 'hh-1', { action: 'set-auto', entityId: elena.id, auto: true });
  // Decided as a neighbour decides: the steady hand takes the long shot, the unsteady one waits for it to come closer.
  const decided = id => world.events.filter(event => event.actorId === id && event.type === 'choice' && /deciding for themself/.test(event.text)).map(event => event.decision);
  assert.ok(decided(elena.id).length >= 1 && decided(elena.id).every(choice => choice === 'take'), `Elena decided ${decided(elena.id)}`);
  assert.ok(decided(mateo.id).length >= 1 && decided(mateo.id).every(choice => choice === 'wait'), `Mateo decided ${decided(mateo.id)}`);
  assert.ok(household.resources.food > 12, 'nothing came home');
  // Off: the hunt in hand finishes, and nobody goes again.
  applyAction(world, 'hh-1', { action: 'set-auto', entityId: elena.id, auto: false });
  applyAction(world, 'hh-1', { action: 'set-auto', entityId: mateo.id, auto: false });
  for (let t = 0; t < 400 && (elena.chore || mateo.chore); t++) stepWorld(world);
  const were = { elena: finished(elena.id), mateo: finished(mateo.id) };
  for (let t = 0; t < 60; t++) stepWorld(world);
  assert.equal(finished(elena.id), were.elena, 'Elena went hunting again with the switch off');
  assert.equal(finished(mateo.id), were.mateo);
  assert.equal(elena.chore, null);
  // Out of powder, auto says why once and waits, and goes the moment the family has some.
  applyAction(world, 'hh-1', { action: 'set-auto', entityId: elena.id, auto: true });
  household.resources.powder = 0;
  for (let t = 0; t < 30; t++) stepWorld(world);
  assert.equal(elena.chore, null, 'somebody went hunting with nothing to fire');
  assert.equal(story(world, elena.id).filter(text => /has not gone out again \(hunt/.test(text)).length, 1, 'the refusal was not written down exactly once');
  household.resources.powder = 2;
  for (let t = 0; t < 3 && !elena.chore; t++) stepWorld(world);
  assert.equal(elena.chore?.id, 'hunt-timber', 'the hunter did not go out once there was powder');
  validateWorld(world);
});

test('by hand the question stands for the game\'s own window and then auto decides it: a steady hand takes the shot nobody answered', () => {
  const world = running('auto-hand');
  const elena = world.entities['hh-1-elena'];
  world.households['hh-1'].resources.powder = 3;
  applyAction(world, 'hh-1', { action: 'chore', entityId: elena.id, chore: 'hunt-timber' });
  let opened = null, waited = 0;
  for (let t = 0; t < 400 && elena.chore; t++) {
    if (elena.chore?.ask) { opened ??= world.minute; waited++; assert.ok(needsOf(view(world, 'hh-1'), elena.id).some(need => need.kind === 'asking'), 'no "!" while the family was asked'); }
    stepWorld(world);
  }
  assert.ok(opened !== null, 'the hunt never asked');
  assert.ok(waited * 20 >= ASK_PATIENCE - 20 && waited * 20 <= ASK_PATIENCE + 40, `the question stood ${waited} ticks`);
  const decided = world.events.find(event => event.actorId === elena.id && /Nobody answered/.test(event.text));
  assert.equal(decided?.decision, 'take', 'silence did not decide as auto decides');
});

test('in the ranks, a person on auto is answered the moment the army asks, at the record\'s share; nobody answered for in time is decided the same way, and the answer does what it does', () => {
  const base = createGonzalesWorld('auto-camp', 30, { map: 'colonies' });
  base.status = 'running';
  untilMinute(base, momentOf(base, 'organised') + 1);
  const people = Object.values(base.entities).filter(e => e.kind === 'person' && e.householdId && (e.age ?? 30) >= 16);
  base.army.members = people.map(p => p.id);
  for (const p of people) { const promise = p.commitments?.find(c => c.id === 'volunteer'); if (promise) promise.status = 'active'; else (p.commitments ??= []).push({ id: 'volunteer', status: 'active' }); }
  for (const household of Object.values(base.households)) household.played = true;
  const fresh = () => structuredClone(base);

  // The storm order: auto answered at once, by hand open; at the close the open are decided as auto would, and a yes earns
  // the storm's glory when it is countermanded exactly as a spoken yes does (tests/siege.test.mjs).
  const world = fresh();
  const [onAuto, byHand] = people.map(p => world.entities[p.id]);
  onAuto.auto = true;
  openQuestion(world, 'storm', null);
  const storm = world.army.questions.storm.asks;
  assert.ok(['yes', 'no'].includes(storm[onAuto.id]), `a person on auto was left ${storm[onAuto.id]}`);
  assert.equal(storm[byHand.id], 'open');
  assert.ok(!(view(world, onAuto.householdId).army?.ours?.find(one => one.id === onAuto.id)?.questions || []).some(q => q.answer === 'open'), 'the family of a person on auto was shown the question open');
  assert.ok(world.events.some(e => e.actorId === onAuto.id && e.type === 'choice' && e.decision === `storm-${storm[onAuto.id]}`), 'the auto answer was not written down as the family\'s choice');
  closeQuestion(world, 'storm');
  assert.ok(['yes', 'no'].includes(storm[byHand.id]), `nobody answering left ${storm[byHand.id]}`);
  assert.ok(world.events.some(e => e.actorId === byHand.id && /Nobody answered for .* in time, and it was decided for them/.test(e.text)));
  // Deterministic: the same person on auto or unanswered gets the same answer, so the switch never changes the odds.
  const again = fresh();
  openQuestion(again, 'storm', null);
  closeQuestion(again, 'storm');
  assert.equal(again.army.questions.storm.asks[onAuto.id], storm[onAuto.id], 'auto and silence decided differently for the same person');

  // The pledge: somebody decided out of it starts home, whether auto said so at once or nobody answered in time.
  const pledge = fresh();
  const homeward = [];
  const beginTravel = (w, person, destination) => { homeward.push({ id: person.id, destination }); person.travel = { from: person.location.siteId, to: destination, points: [{ x: 0, y: 0 }, { x: 1, y: 1 }], progress: 0, distance: 1, speed: 1, mode: 'foot', purpose: 'home' }; person.location = { x: 0, y: 0, siteId: null }; };
  openQuestion(pledge, 'pledge', null, { beginTravel });
  closeQuestion(pledge, 'pledge', { beginTravel });
  const answers = pledge.army.questions.pledge.asks;
  const declined = people.filter(p => answers[p.id] === 'no'), pledged = people.filter(p => answers[p.id] === 'yes');
  assert.ok(declined.length > 0 && pledged.length > 0, `pledge answers ${JSON.stringify(Object.values(answers))}`);
  for (const p of declined) { assert.equal(withTheArmy(pledge, p.id), false, `${p.name} was decided out of the pledge and is still in the ranks`); assert.ok(homeward.some(h => h.id === p.id), `${p.name} did not start home`); }
  for (const p of pledged) assert.equal(withTheArmy(pledge, p.id), true);
  const share = pledged.length / people.length;
  assert.ok(share > 0.5 && share < 0.85, `${share.toFixed(2)} pledged: not the record's two in three`);

  // The detachment, the same two ways.
  const division = fresh();
  division.entities[onAuto.id].auto = true;
  openDetachment(division, null);
  const asks = division.army.detachment.asks;
  assert.ok(['go', 'stay'].includes(asks[onAuto.id]));
  assert.equal(asks[byHand.id], 'open');
  assert.ok(division.events.some(e => e.actorId === onAuto.id && e.type === 'choice' && /went ahead|stayed with the main army/.test(e.text)));
  closeDetachment(division);
  assert.ok(['go', 'stay'].includes(asks[byHand.id]));
  assert.ok(division.events.some(e => e.actorId === byHand.id && /Nobody answered for .* in time/.test(e.text)));
  validateWorld(division);
});

test('inside the Alamo, a person on auto offers or stays at once at auto\'s share, and nobody answered for in time is decided the same way', () => {
  const world = createGonzalesWorld('auto-alamo', 8, { map: 'colonies' });
  for (const household of Object.values(world.households)) rollFamily(world, household);
  world.status = 'running';
  until(world, () => world.director.complete);
  beginSecondPeriod(world); world.status = 'running';
  until(world, () => world.director.milestones['winter-news']);
  const men = Object.values(world.entities).filter(p => p.householdId && p.kind === 'person' && p.health.condition === 'well' && p.sex === 'male' && (p.age ?? 30) >= 16).slice(0, 6);
  const site = world.map.sites.bexar;
  for (const person of men) {
    person.travel = null; person.chore = null; person.task = 'rest';
    person.location = { x: site.x, y: site.y, siteId: 'bexar' };
    person.service = { kind: 'garrison', status: 'serving', since: world.minute, siteId: 'bexar' };
    world.households[person.householdId].played = true;
  }
  const [a, b] = men;
  a.auto = true; b.auto = true;
  // The one left by hand is somebody auto would send, so that the riders going without them would be caught.
  const c = men.slice(2).find(person => alamoShare(world, person.id, 'courier-offer') < COURIER_OFFERED);
  assert.ok(c, 'nobody by hand whose share offers');
  untilMoment(world, 'alamo-siege');
  untilMoment(world, 'courier-1-opens');
  for (const person of [a, b]) {
    const offers = alamoShare(world, person.id, 'courier-offer') < COURIER_OFFERED;
    assert.equal(person.service.courier, offers ? 'volunteered' : 'stays', `${person.name} on auto was not answered at once at auto's share`);
    assert.ok(!needsOf(view(world, person.householdId), person.id).some(need => need.kind === 'courier'), `a "!" waits on ${person.name}, who is on auto`);
  }
  // By hand, Travis's runner walks to them (sim/alamo-runner.mjs) and the question opens when he is there.
  assert.equal(c.service.courier, 'coming', 'a person by hand was answered for');
  until(world, () => c.service.courier === 'open', 20);
  assert.equal(c.service.courier, 'open', 'the runner never reached the person by hand');
  assert.ok(needsOf(view(world, c.householdId), c.id).some(need => need.kind === 'courier'));
  untilMoment(world, 'courier-1');
  assert.ok(['sent', 'passed'].includes(c.service.courier), `nobody answering left ${c.name} ${c.service.courier}: the offer auto would make was not made`);
  assert.ok(world.events.some(e => e.actorId === c.id && /Nobody answered for .* in time/.test(e.text)));
  validateWorld(world);
});

test('told to leave, a family whose main person is on auto packs as a neighbour packs and goes at once; a family by hand is waited for a day, then goes; and a family that says it stays, stays', () => {
  const world = createGonzalesWorld('auto-scrape', 12, { map: 'colonies' });
  for (const household of Object.values(world.households)) rollFamily(world, household);
  world.status = 'running';
  until(world, () => world.director.complete);
  beginSecondPeriod(world); world.status = 'running';
  until(world, () => world.director.complete);
  beginThirdPeriod(world); world.status = 'running';
  // Three families of one settlement, told to leave on the same morning: one on auto, one by hand, one that says it stays.
  const groups = {};
  for (const household of Object.values(world.households)) (groups[household.settlementId || 'gonzales'] ??= []).push(household);
  const group = Object.values(groups).sort((a, b) => b.length - a.length)[0];
  assert.ok(group.length >= 3, `the fixture's largest settlement has ${group.length} families`);
  const [auto, hand, stays] = group;
  for (const household of [auto, hand, stays]) { household.played = true; household.improvements = { ...household.improvements, cabin: 'sound' }; }
  const main = household => world.entities[household.mainId || household.principalId];
  main(auto).auto = true;
  until(world, () => auto.flight?.status === 'ordered' || auto.flight?.status === 'fled');
  const ordered = world.minute;
  assert.equal(stays.flight?.status, 'ordered', 'the third family was not told on the same morning');
  applyAction(world, stays.id, { action: 'flight-stay', entityId: main(stays).id });
  assert.equal(stays.flight.status, 'stayed');
  assert.equal(view(world, stays.id).flight.decidedToStay, true);
  assert.ok(!needsOf(view(world, stays.id), main(stays).id).some(need => need.kind === 'flight'), 'the "!" stayed on a family that answered');
  assert.throws(() => applyAction(world, stays.id, { action: 'flight-stay', entityId: main(stays).id }), /already decided/);
  const expected = packFlight(view(world, auto.id).flight || { room: 0, have: {}, space: {}, refuges: [] });
  stepWorld(world);
  assert.equal(auto.flight.status, 'fled', 'the family on auto did not go the tick after the order');
  assert.ok(world.events.some(e => e.householdId === auto.id && /set out east for/.test(e.text)));
  if (expected.refuge) assert.equal(auto.flight.refuge, expected.refuge, 'auto did not make for the nearest refuge');
  // By hand: the "!" on the main person, the calendar held, and after a day auto packs and goes, saying so.
  assert.equal(hand.flight.status, 'ordered');
  assert.ok(needsOf(view(world, hand.id), main(hand).id).some(need => need.kind === 'flight'));
  assert.equal(calendarMinutes(world), 20, 'the calendar did not hold for a family deciding');
  untilMinute(world, ordered + FLIGHT_PATIENCE - 40);
  assert.equal(hand.flight.status, 'ordered', 'auto went before the day was up');
  untilMinute(world, ordered + FLIGHT_PATIENCE + 40);
  assert.ok(['fled', 'refuged'].includes(hand.flight.status), `nobody answering for a day left the family ${hand.flight.status}`);
  assert.ok(world.events.some(e => e.householdId === hand.id && /Nobody gave the word for a day/.test(e.text)));
  // Saying so: the family that decided to stay was not packed off by the day, and the road east is still open to it.
  assert.equal(stays.flight.status, 'stayed', 'a family that said it stays was packed off');
  assert.ok(!world.events.some(e => e.householdId === stays.id && /Nobody gave the word/.test(e.text)));
  assert.ok(world.events.some(e => e.householdId === stays.id && /The family will stay, and take what comes/.test(e.text)));
  validateWorld(world);
});
