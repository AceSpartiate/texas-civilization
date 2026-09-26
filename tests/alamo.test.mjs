// The Alamo, San Patricio and Agua Dulce: docs/COLONIES.md §7f, decided by the owner by multiple choice (2026-09-16).
//
// On February 23 whoever of a family is at Béxar is shut in the Alamo and cannot be sent for; a played person inside is asked
// on the days Travis sent riders out whether they will carry a letter, and about one volunteer in four is chosen and rides out
// to live. Anybody who has heard Travis's letter may send a grown member to Gonzales; whoever is there by two on February 27
// is inside the walls on March 1. On March 6 every man inside is killed and every woman spared (since 2026-09-22 by role and
// place, not sex: tests/alamo-runner.test.mjs has the boy spared and the runner), and no family sees it until the word reaches it: a rumour at Gonzales on the 11th, confirmed on the 13th, elsewhere that evening. The Matamoros men are split
// between San Patricio and Agua Dulce and rolled for killed, captured and escaped. The second period ends the night of March 13.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, projectWorld, rollFamily, stepWorld, validateWorld } from '../sim/world.mjs';
import { beginSecondPeriod } from '../sim/periods.mjs';
import { momentOf } from '../sim/directors.mjs';
import { COURIER_CHOSEN, COURIER_OFFERED, JOHNSON_SHARE, SOUTH_RATES, share } from '../sim/alamo.mjs';
import { frailty } from '../sim/army.mjs';
import { joinService } from '../sim/winter.mjs';

const view = (world, householdId) => projectWorld(world, householdId, 'student', { includeMap: false });
const until = (world, done, limit = 9000) => { for (let t = 0; t < limit && !done() && world.status === 'running'; t++) stepWorld(world); };
const untilMoment = (world, key) => until(world, () => world.director.milestones[key]);

let shared = null;
/** A real-land class with rolled families, through the first period and into the winter to the morning of its news. */
const winter = () => structuredClone(shared ??= (() => {
  const world = createGonzalesWorld('alamo-class', 8, { map: 'colonies' });
  for (const household of Object.values(world.households)) rollFamily(world, household);
  world.status = 'running';
  until(world, () => world.director.complete);
  beginSecondPeriod(world);
  world.status = 'running';
  until(world, () => world.director.milestones['winter-news']);
  return world;
})());
const grown = world => Object.values(world.entities).filter(person => person.householdId && person.kind === 'person' && person.health.condition === 'well' && (person.age ?? 30) >= 16);
// The men of a class, for the tests that send somebody to the Alamo. **Not filtered on being well**: since 2026-09-21 a
// norther counts towards the day's sickness (`COLD_WEIGHT`, `FIC-GONZ-135`), and in this class the one man of the first
// Gonzales family is laid up by the winter. A man who is ill may still be sent - that is the game's own rule - and
// these tests are about what happens to him at Béxar, not about who is well.
const men = world => Object.values(world.entities).filter(person => person.householdId && person.kind === 'person'
  && person.sex === 'male' && (person.age ?? 30) >= 16 && !['dead', 'captured'].includes(person.health.condition));
const women = world => grown(world).filter(person => person.sex === 'female' && person.kin?.role === 'mother');
/** Put somebody where they serve, as if they had walked there. */
const serve = (world, person, kind, siteId) => {
  const site = world.map.sites[siteId];
  person.travel = null; person.chore = null; person.task = 'rest';
  person.location = { x: site.x, y: site.y, siteId };
  person.service = { kind, status: 'serving', since: world.minute, siteId };
};

test('the siege shuts whoever is at Béxar into the Alamo, closes the garrison to all but the relief, and nobody can be sent for', () => {
  const world = winter();
  const [inside, lying, late] = men(world);
  serve(world, inside, 'garrison', 'bexar');
  // Somebody lying wounded at Béxar, not in the garrison, is taken in with it.
  const site = world.map.sites.bexar;
  lying.location = { x: site.x, y: site.y, siteId: 'bexar' };
  untilMoment(world, 'alamo-siege');
  for (const person of [inside, lying]) {
    assert.equal(person.service.besieged, true, `${person.name} was not shut in`);
    assert.throws(() => applyAction(world, person.householdId, { action: 'winter-recall', entityId: person.id }), /shut in the Alamo/);
  }
  assert.equal(view(world, inside.householdId).entities.find(e => e.id === inside.id).service.besieged, true, 'the family was not told they are shut in');
  const other = men(world).find(person => !person.service && !person.chore && person.location.siteId === world.households[person.householdId].homeSiteId);
  assert.ok(!(view(world, other.householdId).work[other.id] || []).some(entry => entry.id === 'join-garrison'), 'the garrison was offered after the siege began');
  // Somebody who was on the road reaches Béxar after the siege began: shut out, and their chore turns them home.
  late.chore = { id: 'join-garrison', step: 2, flags: [] };
  joinService(world, world.households[late.householdId], late, 'garrison');
  assert.ok(!late.service, 'somebody reached the garrison after the siege began');
  assert.ok(late.chore.flags.includes('shut-out'), 'the late arrival was not turned home');
  assert.ok(world.events.some(event => event.actorId === late.id && /too late/.test(event.text)));
  validateWorld(world);
});

test('on each day riders went out Travis\'s runner comes to every played man inside; about one volunteer in four is chosen and rides out to live', () => {
  const world = winter();
  const inside = men(world).slice(0, 8);
  for (const person of inside) { serve(world, person, 'garrison', 'bexar'); world.households[person.householdId].played = true; }
  untilMoment(world, 'alamo-siege');
  untilMoment(world, 'courier-1-opens');
  assert.equal(world.director.phase, 'news', 'the asking did not slow the calendar');
  // The runner is on his way (sim/alamo-runner.mjs): the question is not open until he reaches them.
  for (const person of inside) assert.equal(view(world, person.householdId).entities.find(e => e.id === person.id).service.courier, 'coming', `${person.name}'s runner was not sent`);
  until(world, () => inside.every(person => person.service.courier === 'open'), 20);
  for (const person of inside) assert.equal(view(world, person.householdId).entities.find(e => e.id === person.id).service.courier, 'open', `${person.name} was not asked`);
  const [silent, stays, ...volunteers] = inside;
  applyAction(world, stays.householdId, { action: 'alamo-courier', entityId: stays.id, answer: 'stay' });
  for (const person of volunteers) applyAction(world, person.householdId, { action: 'alamo-courier', entityId: person.id, answer: 'volunteer' });
  assert.throws(() => applyAction(world, stays.householdId, { action: 'alamo-courier', entityId: stays.id, answer: 'volunteer' }), /not being asked/, 'somebody answered twice');
  untilMoment(world, 'courier-1');
  // Nobody answering in time is answered as auto answers (sim/auto.mjs, `FIC-GONZ-048`): an offer at auto's share, which may be chosen.
  assert.ok(['stays', 'sent', 'passed'].includes(silent.service.courier), `nobody answering left them ${silent.service.courier}`);
  assert.equal(silent.service.courier === 'stays', share(world, silent.id, 'courier-offer') >= COURIER_OFFERED, 'the decision made for them did not follow the share');
  assert.ok(world.events.some(e => e.actorId === silent.id && /Nobody answered for .* in time/.test(e.text)), 'the family was not told the choice was made for them');
  assert.equal(stays.service.besieged, true);
  for (const person of volunteers) {
    const chosen = share(world, person.id, 'courier-1') < COURIER_CHOSEN;
    assert.equal(person.service.courier, chosen ? 'sent' : 'passed', `${person.name}'s choosing did not follow the share`);
    if (chosen) {
      assert.equal(person.service.status, 'released');
      assert.equal(person.travel?.to, 'gonzales', 'a courier did not ride for Gonzales');
    } else assert.equal(person.service.besieged, true);
  }
  validateWorld(world);
});

test('anybody who has heard Travis\'s letter may ride for Gonzales; whoever is there by two on the 27th is inside on March 1, and those after turn home', () => {
  const world = winter();
  untilMoment(world, 'alamo-siege');
  // A family **with a grown man in it**, not simply the first one dealt to Gonzales. The relief is the men's in
  // 1835 (the game refuses a woman in those words), and since 2026-09-21 a norther counts towards the day's sickness
  // (`COLD_WEIGHT`, `FIC-GONZ-135`) - so in this class the one man of the first Gonzales family is laid up, and what
  // this test picked next was his wife, refused for being a woman. A man who is ill may still be offered the relief, which
  // is the game's own rule and not this test's business.
  const hands = men(world);
  const gonzales = Object.values(world.households).find(household => household.settlementId === 'gonzales' && hands.some(person => person.householdId === household.id));
  const far = Object.values(world.households).find(household => household.settlementId !== 'gonzales' && hands.some(person => person.householdId === household.id));
  assert.ok(gonzales && far, 'the class has no Gonzales family and no family elsewhere with anybody well to send');
  const near = hands.find(person => person.householdId === gonzales.id);
  const away = hands.find(person => person.householdId === far.id);
  untilMoment(world, 'travis-gonzales');
  assert.ok((view(world, gonzales.id).work[near.id] || []).some(entry => entry.id === 'join-relief' && entry.can), 'a Gonzales family that heard the letter could not send anybody');
  assert.ok(!(view(world, far.id).work[away.id] || []).some(entry => entry.id === 'join-relief'), 'a family that had not heard the letter was offered the relief');
  applyAction(world, gonzales.id, { action: 'chore', entityId: near.id, chore: 'join-relief', mode: 'horse' });
  untilMoment(world, 'travis-colonies');
  assert.ok((view(world, far.id).work[away.id] || []).some(entry => entry.id === 'join-relief'), 'the letter never reached the other settlements');
  until(world, () => near.service?.kind === 'relief');
  assert.equal(near.location.siteId, 'gonzales');
  untilMoment(world, 'relief-leaves');
  assert.equal(near.service.riding, true, 'the relief did not ride');
  assert.throws(() => applyAction(world, gonzales.id, { action: 'winter-recall', entityId: near.id }), /ridden for the Alamo/);
  // Somebody set down at Gonzales after the men had ridden goes home again.
  const lateComer = grown(world).find(person => person.householdId === gonzales.id && person.id !== near.id && !person.service);
  assert.ok(!(view(world, gonzales.id).work[lateComer.id] || []).some(entry => entry.id === 'join-relief'), 'the relief was offered after it rode');
  untilMoment(world, 'relief-enters');
  assert.equal(near.location.siteId, 'bexar');
  assert.deepEqual({ kind: near.service.kind, besieged: near.service.besieged, relief: near.service.relief }, { kind: 'garrison', besieged: true, relief: true });
  validateWorld(world);
});

test('on March 6 every man inside dies and every woman is spared, and no family sees it until the word comes', () => {
  const world = winter();
  const gonzales = Object.values(world.households).filter(household => household.settlementId === 'gonzales');
  const man = men(world).find(person => gonzales.some(household => household.id === person.householdId));
  const farMan = men(world).find(person => !gonzales.some(household => household.id === person.householdId));
  const woman = women(world).find(person => person.householdId !== man.householdId);
  for (const person of [man, farMan, woman]) serve(world, person, 'garrison', 'bexar');
  // Since 2026-09-25 each fate falls at its own moment inside the assault (sim/alamo-battle.mjs), not all at five: the
  // morning is over by seven.
  untilMoment(world, 'alamo-assault');
  until(world, () => world.minute >= momentOf(world, 'alamo-assault') + 120);
  assert.equal(man.service.fate, 'fell');
  assert.equal(woman.service.fate, 'spared');
  assert.ok(world.glory[man.householdId].awards[`alamo:${man.id}`]?.role === 'fought', 'a man who fell earned no glory for it');
  assert.ok(world.glory[woman.householdId].awards[`alamo:${woman.id}`]?.role === 'present');
  // Not dead, rather than well: the man sent may have been laid up by a norther before he rode (`COLD_WEIGHT`), and
  // what this holds is that **the family cannot see the death** until the word comes, not what else ails him.
  assert.notEqual(view(world, man.householdId).entities.find(e => e.id === man.id).health.condition, 'dead', 'the family saw the death before any word came');
  assert.doesNotMatch(JSON.stringify(view(world, man.householdId)), /"fate"/, 'the fate rode the wire');
  untilMoment(world, 'survivors-leave');
  assert.equal(woman.travel?.to, world.households[woman.householdId].homeSiteId, 'the spared woman did not start home');
  untilMoment(world, 'fall-rumour');
  assert.equal(world.knowledge.households[man.householdId]['alamo-fall']?.status, 'rumor', 'Gonzales did not hear the rumour on the 11th');
  assert.notEqual(man.health.condition, 'dead', 'a rumour made the death true');
  untilMoment(world, 'fall-confirmed');
  assert.equal(man.health.condition, 'dead', 'the confirmed word did not make the death true for Gonzales');
  assert.equal(farMan.health.condition, 'well', 'a family away from Gonzales saw the death before its word came');
  untilMoment(world, 'fall-colonies');
  assert.equal(farMan.health.condition, 'dead');
  assert.ok(world.events.some(event => event.householdId === man.householdId && /killed when the Alamo was stormed/.test(event.text)), 'the family was not told what became of theirs');
  until(world, () => world.director.complete);
  assert.equal(world.status, 'ended');
  assert.ok(world.minute >= momentOf(world, 'alamo-end'));
  assert.equal(projectWorld(world, undefined, 'host', { includeMap: false }).ending.host.interim, true, 'the second period was shown as the end of the story');
  validateWorld(world);
});

test('the Matamoros men are split between San Patricio and Agua Dulce and rolled for killed, captured and escaped, told when the word comes', () => {
  const world = winter();
  const south = grown(world).slice(0, 14);
  for (const person of south) serve(world, person, 'matamoros', 'refugio');
  untilMoment(world, 'agua-dulce');
  for (const person of south) {
    const party = share(world, person.id, 'party') < JOHNSON_SHARE ? 'san-patricio' : 'agua-dulce';
    const rates = SOUTH_RATES[party], roll = share(world, person.id, party), dies = 1 - (1 - rates.killed) ** frailty(person);
    const fate = roll < dies ? 'killed' : roll < dies + rates.captured ? 'captured' : 'escaped';
    if (fate === 'escaped') {
      assert.equal(person.service.kind, 'fannin', `${person.name} escaped and did not go to Fannin`);
      assert.equal(person.service.escapedFrom, party);
    } else {
      assert.equal(person.service.party, party);
      assert.equal(person.service.fate, fate, `${person.name}'s fate did not follow the record's shares`);
      assert.equal(person.health.condition, 'well', 'a fate was true before the word came');
    }
  }
  untilMoment(world, 'agua-dulce-news');
  for (const person of south) {
    if (person.service.kind === 'fannin') continue;
    assert.equal(person.health.condition, person.service.fate === 'killed' ? 'dead' : 'captured', `${person.name} was not ${person.service.fate} once the word came`);
  }
  assert.ok(!(view(world, south[0].householdId).work[south[0].id] || []).some(entry => entry.id === 'join-matamoros'), 'going south was offered after February 27');
  validateWorld(world);
});

test('a saved courier answer or fate that cannot be is refused', () => {
  const world = winter();
  const [person] = men(world);
  serve(world, person, 'garrison', 'bexar');
  person.service.courier = 'maybe';
  assert.throws(() => validateWorld(world), /courier/);
  person.service.courier = undefined; person.service.fate = 'lost';
  assert.throws(() => validateWorld(world), /fate/);
});
