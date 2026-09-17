// The Host's live page (owner, 2026-09-16, docs/HOST_PAGE.md): the class family by family in words, the Rumor Mill, and
// the spotlight the teacher's camera goes to when something happens most of the class would miss.
//
// sim/host.mjs reads it all from the world and sim/world.mjs sends it to the Host alone: `live.families` (where everyone
// is, what waits on them; no coin, no glory), `live.rumours` (public knowledge as the public heard it, newest first, with
// its earlier tellings and how many families have heard it), `live.spotlight` (the last moment, until it passes). A student
// is sent none of it.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, projectWorld, rollFamily, stepWorld, validateWorld } from '../sim/world.mjs';
import { beginSecondPeriod, beginThirdPeriod } from '../sim/periods.mjs';
import { momentOf } from '../sim/directors.mjs';
import { establishTruth, learn } from '../sim/knowledge.mjs';
import { SPOTLIGHT_MINUTES, rumourMill, spotlight, waitingOn, whereWords } from '../sim/host.mjs';

const host = world => projectWorld(world, undefined, 'host', { includeMap: false });
const student = (world, id) => projectWorld(world, id, 'student', { includeMap: false });
const until = (world, done, limit = 9000) => { for (let t = 0; t < limit && !done() && world.status === 'running'; t++) stepWorld(world); };
const untilMoment = (world, key) => until(world, () => world.director.milestones[key]);

test('the Host is sent every family in words - who plays it, where each person is, how many things wait on it - and no coin or glory; a student is sent none of it', () => {
  const world = createGonzalesWorld('host-live-families', 6, { map: 'colonies', neighbours: true });
  for (const household of Object.values(world.households)) rollFamily(world, household);
  world.households['hh-1'].played = true;
  world.status = 'running';
  until(world, () => world.director.milestones.organised, 2000);
  const live = host(world).live;
  assert.equal(live.families.length, 6);
  const mine = live.families.find(f => f.id === 'hh-1');
  assert.equal(mine.played, true);
  assert.ok(mine.people.length >= 1 && mine.people.every(p => typeof p.where === 'string' && p.where.length > 3), `people without words: ${JSON.stringify(mine.people)}`);
  assert.ok(live.families.some(f => f.people.some(p => /at home|on the road|with the army|at /.test(p.where))), 'nobody is anywhere');
  assert.ok(live.families.every(f => f.waiting >= 0 && Number.isInteger(f.waiting)));
  const wire = JSON.stringify(live);
  assert.doesNotMatch(wire, /"money"|"glory"|"resources"|"purse"/, 'the live page carries coin or glory');
  assert.equal('live' in student(world, 'hh-1'), false, 'a student was sent the Host\'s live page');
  validateWorld(world);
});

test('where somebody is, in words: at home at their work, on a road, with the army, shut in the Alamo, fled, sick, dead, a prisoner', () => {
  const world = createGonzalesWorld('host-live-words', 5, { map: 'colonies', neighbours: true });
  const household = world.households['hh-1'];
  const person = world.entities[household.members[0]];
  const home = world.map.sites[household.homeSiteId];
  person.travel = null; person.location = { x: home.x, y: home.y, siteId: household.homeSiteId }; person.task = 'rest';
  assert.equal(whereWords(world, person, household), 'at home');
  person.chore = { id: 'hunt-timber', step: 0, flags: [] };
  assert.equal(whereWords(world, person, household), 'at home: hunt in the timber');
  person.chore = null;
  person.location = { x: 0, y: 0, siteId: 'gonzales' };
  assert.equal(whereWords(world, person, household), 'at Gonzales');
  person.travel = { from: 'gonzales', to: 'san-felipe', points: [{ x: 0, y: 0 }, { x: 1, y: 1 }], progress: 0, distance: 1, speed: 3, mode: 'foot', purpose: 'visit' };
  person.location = { x: 0, y: 0, siteId: null };
  assert.equal(whereWords(world, person, household), 'on the road to San Felipe de Austin');
  person.travel.to = household.homeSiteId;
  assert.equal(whereWords(world, person, household), 'on the road home');
  person.travel = null; person.location = { x: 0, y: 0, siteId: 'bexar' };
  person.service = { kind: 'garrison', status: 'serving', siteId: 'bexar', besieged: true };
  assert.equal(whereWords(world, person, household), 'shut in the Alamo');
  person.service = { kind: 'regular', status: 'serving', siteId: 'san-felipe', acres: 800 };
  assert.equal(whereWords(world, person, household), 'with the regular army at San Felipe de Austin');
  person.service = { kind: 'fannin', status: 'prisoner', siteId: 'goliad' };
  assert.equal(whereWords(world, person, household), 'a prisoner at Goliad');
  person.service = null;
  person.health = { condition: 'sick', recoversAt: world.minute + 100 };
  household.flight = { status: 'refuged', refuge: 'san-felipe' };
  person.location = { x: 0, y: 0, siteId: 'san-felipe' };
  assert.equal(whereWords(world, person, household), 'sick, at San Felipe de Austin, fled from home');
  person.health = { condition: 'captured' };
  assert.equal(whereWords(world, person, household), 'a prisoner');
  person.health = { condition: 'dead' };
  assert.equal(whereWords(world, person, household), 'dead');
});

test('what waits on a family is counted: a rider, the army\'s question, a hunt that asks, the order to leave, a call, an offer', () => {
  const world = createGonzalesWorld('host-live-waiting', 5, { map: 'colonies', neighbours: true });
  const household = world.households['hh-1'];
  household.played = true;
  const person = world.entities[household.members[0]];
  assert.equal(waitingOn(world, household), 0);
  world.encounters = { e1: { id: 'e1', status: 'open', householdId: 'hh-1', listenerId: person.id, carrierId: 'x', lastSpokenMinute: 0, said: [] } };
  assert.equal(waitingOn(world, household), 1);
  world.army = { members: [person.id], questions: { storm: { asks: { [person.id]: 'open' }, closed: false } }, detachment: { asks: { [person.id]: 'open' }, closed: false } };
  assert.equal(waitingOn(world, household), 3);
  person.chore = { id: 'hunt-timber', step: 3, flags: [], ask: { id: 'shot', openedMinute: world.minute, options: [] } };
  household.flight = { status: 'ordered', orderedMinute: world.minute };
  world.calls = { 'hh-1': { id: 'c', status: 'open', text: 'x' } };
  world.offers = { o1: { id: 'o1', toHouseholdId: 'hh-1', fromHouseholdId: 'hh-2', status: 'open' } };
  assert.equal(waitingOn(world, household), 7);
  assert.equal(host(world).live.families.find(f => f.id === 'hh-1').waiting, 7);
});

test('the Rumor Mill: what the public has heard, newest first, as it was heard, with the earlier tellings kept and how far it has travelled', () => {
  const world = createGonzalesWorld('host-live-rumours', 5, { map: 'colonies', neighbours: true });
  world.status = 'running';
  establishTruth(world, { id: 'test-topic', text: 'The truth of it.', siteId: 'gonzales' });
  learn(world, 'public', 'test-topic', { status: 'rumor', source: 'A rider', text: 'They say the cannon was taken.' });
  learn(world, 'hh-1', 'test-topic', { status: 'rumor', source: 'A rider', text: 'They say the cannon was taken.' });
  world.minute += 600;
  learn(world, 'public', 'test-topic', { status: 'confirmed', source: 'An express', text: 'The cannon was fired and kept.' });
  const mill = rumourMill(world);
  const piece = mill.find(r => r.topicId === 'test-topic');
  assert.ok(piece, 'the topic is not in the mill');
  assert.equal(piece.status, 'confirmed');
  assert.equal(piece.text, 'The cannon was fired and kept.', 'the mill shows the truth rather than what the public heard');
  assert.equal(piece.earlier.length, 1);
  assert.deepEqual({ status: piece.earlier[0].status, text: piece.earlier[0].text }, { status: 'rumor', text: 'They say the cannon was taken.' });
  assert.equal(piece.heardBy, 1); assert.equal(piece.families, 5);
  assert.match(piece.date, /^(September|October)/);
  assert.ok(mill.every((r, i) => i === 0 || r.minute <= mill[i - 1].minute), 'not newest first');
  const live = host(world).live;
  assert.ok(live.rumours.some(r => r.topicId === 'test-topic'));
  // The truth itself is never on the wire beside a report.
  assert.doesNotMatch(JSON.stringify(live.rumours), /The truth of it/);
});

test('the spotlight: set by the major events at their place, shown to the Host until it passes, never to a student', () => {
  const world = createGonzalesWorld('host-live-spot', 5, { map: 'colonies', neighbours: true });
  world.status = 'running';
  assert.equal(host(world).live.spotlight, undefined);
  untilMoment(world, 'exchange');
  const spot = host(world).live.spotlight;
  assert.ok(spot, 'the fight at Gonzales lit no spotlight');
  assert.equal(spot.key, 'gonzales'); assert.equal(spot.siteId, 'gonzales');
  assert.match(spot.text, /cannon/);
  assert.ok(Number.isFinite(spot.x) && Number.isFinite(spot.y));
  assert.equal('spotlight' in student(world, 'hh-1'), false);
  assert.ok(world.events.some(e => e.type === 'spotlight' && e.visibility === 'public' && e.text === spot.text));
  world.minute += SPOTLIGHT_MINUTES + 1;
  assert.equal(host(world).live.spotlight, undefined, 'a spotlight never passes');
  // A played family's house burned, and someone taken at home, are the family's own spotlight.
  const household = world.households['hh-1'];
  household.played = true;
  const lit = spotlight(world, { key: `burned:${household.id}`, text: 'x', siteId: household.homeSiteId, householdId: household.id });
  assert.ok(lit && host(world).live.spotlight.family, 'the family is not named');
  validateWorld(world);
});

test('across the war the spotlight lights the Alamo, Goliad and San Jacinto, and a played family\'s farm when the army burns it', () => {
  const world = createGonzalesWorld('host-live-war', 5, { map: 'colonies', neighbours: true });
  for (const household of Object.values(world.households)) rollFamily(world, household);
  world.status = 'running';
  const seen = new Set();
  const watch = () => { const s = world.spotlight; if (s) seen.add(s.key); };
  until(world, () => (watch(), world.director.complete));
  beginSecondPeriod(world); world.status = 'running';
  until(world, () => (watch(), world.director.complete));
  beginThirdPeriod(world); world.status = 'running';
  const gonzales = Object.values(world.households).find(h => (h.settlementId || 'gonzales') === 'gonzales') || Object.values(world.households)[0];
  gonzales.played = true; gonzales.improvements = { ...gonzales.improvements, cabin: 'sound' };
  until(world, () => (watch(), world.director.complete));
  for (const key of ['gonzales', 'concepcion', 'alamo-fall', 'goliad-massacre', 'san-jacinto', `burned:${gonzales.id}`]) assert.ok(seen.has(key), `no spotlight for ${key}: ${[...seen].join(', ')}`);
  validateWorld(world);
});
