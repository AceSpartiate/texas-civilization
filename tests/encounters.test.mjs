// News carried by people: build-order steps 1 and 2 of docs/LIVING_INFORMATION.md.
//
// The defect this whole system replaces was not a bug - everything worked. A courier
// rode a real road for a real number of minutes and then knowledge appeared in a
// household, whether or not one living person was standing at the cabin to receive it.
// The owner's direction is that news must be **said to somebody**, so these tests are
// mostly about the difference between arriving at a place and meeting a person.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, stepWorld, projectWorld, validateWorld, dispatchReport, beginTravel, RIDER_SPEED } from '../sim/world.mjs';
import { CONVERSATIONS, EARSHOT_MILES, PASSING_MINUTES, PATIENCE_MINUTES, accountOf, blockedByWater } from '../sim/encounters.mjs';
import { findPath, pointAlong } from '../sim/geography.mjs';
import { establishTruth, learn } from '../sim/knowledge.mjs';
import { resolveTimeJump } from '../sim/time.mjs';
import { readSave, writeSave } from '../server/storage.mjs';

const TOPIC = 'cannon-request';
const advance = (world, ticks) => { for (let i = 0; i < ticks; i++) stepWorld(world); };
// The scenario's own first news. Everything here hangs off the one topic that has been
// converted; the point of step 1 is that it is one.
function briefed(seed = 'rider', players = 5) {
  const world = createGonzalesWorld(seed, players);
  world.status = 'running';
  while (!world.truth[TOPIC]) stepWorld(world);
  return world;
}
// The scenario dispatches its own riders on its own schedule. A test that wants exactly
// one rider has to tell the director this household is already seen to, or it gets two.
function soloDispatch(world, householdId) {
  world.director.dispatches[householdId] = true;
  return dispatchReport(world, TOPIC, householdId);
}
const openFor = (world, householdId) => Object.values(world.encounters).find(e => e.householdId === householdId && e.status === 'open');
const knows = (world, householdId) => world.knowledge.households[householdId][TOPIC];
const carrierTo = (world, householdId) => Object.values(world.entities).find(e => e.report?.audience === householdId);

test('a rider starts where the thing happened, is a person with a name, and rides a real road', () => {
  const world = briefed('origin');
  const id = soloDispatch(world, 'hh-3');
  const rider = world.entities[id];
  assert.equal(rider.report.originSiteId, world.truth[TOPIC].siteId, 'the source is the report site, not a convenient map pin');
  assert.equal(rider.travel.from, 'gonzales');
  assert.notEqual(rider.name, 'Rider 1', 'somebody a student is going to talk to has a name');
  assert.equal(rider.report.departedMinute, world.minute);
  // The route is the road graph's answer, so the river is crossed at the ford or not at all.
  // What they ride is their own leg of it: a long road changes hands on the way, and
  // `report.homeSiteId` is the family it is all for however many people carry it.
  assert.equal(rider.report.homeSiteId, 'home-3');
  assert.deepEqual(rider.travel.points, findPath(world.map, 'gonzales', rider.report.destination).points);
  assert.ok(findPath(world.map, 'gonzales', 'home-3').nodes.some(node => node.id === rider.report.destination), 'the leg ends somewhere on the way to the family');
  // The source is wherever the thing happened, and the town is not a default. Something
  // that happens up at the camp puts a rider on the road at the camp.
  establishTruth(world, { id: 'upriver-fixture', text: 'Something happened on the west bank.', siteId: 'williams-camp' });
  const upriver = world.entities[dispatchReport(world, 'upriver-fixture', 'hh-2')];
  assert.equal(upriver.report.originSiteId, 'williams-camp');
  assert.equal(upriver.travel.from, 'williams-camp', 'the rider is not spawned in the town for convenience');
});

test('how far a family lives from Gonzales is how long it waits to hear', () => {
  const world = briefed('distance', 15);
  // Same minute, same source, every household: the only difference left is the road.
  const sent = Object.keys(world.households).map(id => ({ id, distance: findPath(world.map, 'gonzales', world.households[id].homeSiteId)?.distance || 0 }));
  for (const { id } of sent) if (!knows(world, id) && !carrierTo(world, id)) soloDispatch(world, id);
  const departed = world.minute;
  advance(world, 60);
  const heard = sent.filter(s => knows(world, s.id) && knows(world, s.id).receivedMinute > departed)
    .map(s => ({ ...s, waited: knows(world, s.id).receivedMinute - departed }))
    .sort((a, b) => a.distance - b.distance);
  assert.ok(heard.length >= 10, `${heard.length} households heard through a rider`);
  const near = heard[0], far = heard.at(-1);
  assert.ok(far.distance > near.distance * 2, 'the class really does contain a near family and a far one');
  assert.ok(far.waited > near.waited, `the far family (${far.distance.toFixed(1)} miles) waited ${far.waited} minutes and the near one (${near.distance.toFixed(1)}) waited ${near.waited}`);
  // Not merely ordered at the ends: nobody nearer waits longer than somebody further.
  for (let i = 1; i < heard.length; i++) assert.ok(heard[i].waited >= heard[i - 1].waited, 'receipt is monotonic in road distance');
});

test('news is told to a person, and an empty cabin is told nothing', () => {
  const world = briefed('empty');
  // The whole family is off in the lower timber, nowhere near the road from town.
  const away = world.map.sites['lower-timber'];
  for (const id of world.households['hh-5'].members) {
    world.entities[id].travel = null;
    world.entities[id].location = { x: away.x, y: away.y, siteId: 'lower-timber' };
  }
  soloDispatch(world, 'hh-5');
  // Whoever is carrying it by the time it gets there - a long road hands it on, and which
  // rider finally reaches the door is the road's business, not this test's.
  for (let i = 0; i < 60 && carrierTo(world, 'hh-5')?.location.siteId !== 'home-5'; i++) stepWorld(world);
  const rider = carrierTo(world, 'hh-5');
  assert.equal(rider.location.siteId, 'home-5', 'the rider reached the door');
  assert.equal(knows(world, 'hh-5'), undefined, 'and nobody was there, so nobody was told');
  assert.equal(openFor(world, 'hh-5'), undefined);
  assert.ok(rider.report, 'the rider is still carrying it');
  // The rider waits. When somebody comes home they are told, by name.
  const rosa = world.entities['hh-5-rosa'];
  rosa.location = { ...world.map.sites['home-5'], siteId: 'home-5' };
  stepWorld(world);
  const encounter = openFor(world, 'hh-5');
  assert.ok(encounter, 'the rider was still there when she got back');
  assert.equal(encounter.listenerId, 'hh-5-rosa');
  assert.ok(knows(world, 'hh-5').source.startsWith(`${rider.name},`), 'the record names whoever actually spoke');
});

test('a rider met on the road is met on the road, by whoever is on it', () => {
  const world = briefed('road');
  const walker = world.entities['hh-4-mateo'];
  beginTravel(world, walker, 'gonzales', null, 'visit');
  advance(world, 3);
  assert.equal(walker.location.siteId, null, 'he is out between places');
  const rider = world.entities[soloDispatch(world, 'hh-4')];
  for (let i = 0; i < 40 && !openFor(world, 'hh-4'); i++) stepWorld(world);
  const encounter = openFor(world, 'hh-4');
  assert.ok(encounter, 'they met');
  assert.equal(encounter.listenerId, 'hh-4-mateo', 'the one who was actually out there, not the principal at home');
  assert.equal(encounter.place.siteId, null, 'and they met between places, not at a site');
  assert.ok(rider.travel.halted, 'the rider stopped rather than riding through the conversation');
  assert.equal(rider.location.siteId, null);
  assert.ok(Math.hypot(rider.location.x - walker.location.x, rider.location.y - walker.location.y) <= EARSHOT_MILES + 1e-9);
});

test('a rider two hundred yards away across the river might as well be in Béxar', () => {
  const world = briefed('river');
  const ford = world.map.sites.ford;
  // Put a man just east of the crossing and the rider just west of it: a short walk
  // apart on the screen, and a ride to the ford apart in fact.
  const man = world.entities['hh-5-thomas'];
  man.travel = null;
  man.location = { x: ford.x + 0.12, y: ford.y, siteId: 'ford' };
  const rider = world.entities[soloDispatch(world, 'hh-5')];
  rider.travel.halted = true;
  rider.location = { x: ford.x - 0.25, y: ford.y, siteId: null };
  assert.ok(Math.hypot(rider.location.x - man.location.x, rider.location.y - man.location.y) < EARSHOT_MILES, 'they really are within earshot as the crow flies');
  assert.ok(blockedByWater(world, rider.location, man.location), 'but the Guadalupe is between them');
  delete rider.travel.halted;
  rider.travel = null;
  stepWorld(world);
  assert.equal(openFor(world, 'hh-5'), undefined, 'so nothing was said');
  assert.equal(knows(world, 'hh-5'), undefined);
});

test('a rider covering two miles a tick cannot jump clean over the family standing in the middle', () => {
  const world = briefed('overtake');
  const rider = world.entities[soloDispatch(world, 'hh-3')];
  // Stand somebody on the route, further ahead than the rider's own position but nearer
  // than a whole tick's ride. Testing where the rider ends up would miss them entirely.
  const ahead = rider.travel.speed * 0.6;
  const spot = pointAlong(rider.travel.points, ahead);
  const person = world.entities['hh-3-rosa'];
  person.travel = null;
  person.location = { x: spot.x, y: spot.y, siteId: null };
  person.location.siteId = null;
  // validateWorld requires a settled person to hold a site, so this fixture keeps him
  // walking on the spot rather than standing in a field with no name.
  person.travel = { from: 'home-3', to: 'home-3', points: [{ x: spot.x, y: spot.y }, { x: spot.x, y: spot.y }], progress: 0, distance: 0, speed: 1, purpose: 'visit', causeId: null, halted: true };
  stepWorld(world);
  const encounter = openFor(world, 'hh-3');
  assert.ok(encounter, 'the rider came alongside somebody and stopped');
  assert.equal(encounter.listenerId, 'hh-3-rosa');
  assert.ok(rider.travel.progress <= ahead + EARSHOT_MILES, `the rider halted at ${rider.travel.progress.toFixed(2)} miles rather than riding on to ${rider.travel.speed}`);
});

test('the opening line is the receipt, and nobody has to click anything to have heard it', () => {
  const world = briefed('receipt');
  soloDispatch(world, 'hh-2');
  for (let i = 0; i < 40 && !openFor(world, 'hh-2'); i++) stepWorld(world);
  const encounter = openFor(world, 'hh-2');
  assert.equal(encounter.said.length, 1);
  assert.equal(encounter.said[0].speaker, 'rider');
  assert.equal(encounter.said[0].text, CONVERSATIONS[TOPIC].opening(accountOf(world, encounter)));
  assert.ok(encounter.said[0].text.includes('Gonzales'), 'and it says where it came from');
  // Nothing was read, nothing was opened, and the family knows.
  const report = knows(world, 'hh-2');
  assert.equal(report.status, 'confirmed');
  assert.equal(report.observedMinute, world.truth[TOPIC].minute, 'the report is as old as the thing it describes');
  // And the journal keeps the old summary as the record, which is the whole of what the
  // presentation change was allowed to leave alone.
  assert.equal(report.text, world.truth[TOPIC].text);
});

test('an answer that has not been given is nowhere on the wire', () => {
  const world = briefed('leak');
  soloDispatch(world, 'hh-2');
  const before = JSON.stringify(projectWorld(world, 'hh-2', 'student', { includeMap: false }));
  // Both accounts a rider can give. The second-hand wording is different text, so leaving
  // it out here would have let a relayed answer leak past a test that looked thorough.
  const accounts = [
    { origin: 'Gonzales', departedAgo: 'an hour', observedAgo: 'an hour', firsthand: true, hands: 0 },
    { origin: 'Gonzales', departedAgo: 'an hour', observedAgo: 'a day', firsthand: false, hands: 2, toldBy: 'Abner Teel', toldAt: 'The road', tellerSaw: false },
  ];
  const answers = CONVERSATIONS[TOPIC].lines.flatMap(line => accounts.map(one => line.answer(one)));
  for (const answer of answers) assert.ok(!before.includes(answer.slice(0, 30)), 'no answer is shipped before the rider is even seen');
  assert.ok(!before.includes(world.truth[TOPIC].text), 'and neither is the news itself');
  for (let i = 0; i < 40 && !openFor(world, 'hh-2'); i++) stepWorld(world);
  const met = projectWorld(world, 'hh-2', 'student', { includeMap: false });
  const wire = JSON.stringify(met);
  assert.ok(met.encounter, 'the conversation is projected');
  assert.equal(met.encounter.questions.length, CONVERSATIONS[TOPIC].lines.length, 'every question is offered');
  for (const answer of answers) assert.ok(!wire.includes(answer.slice(0, 30)), `an unasked answer reached the client: ${answer.slice(0, 30)}`);
  // Somebody else's conversation is not their business either.
  assert.equal(projectWorld(world, 'hh-3', 'student', { includeMap: false }).encounter, null);
  assert.equal(projectWorld(world, undefined, 'host', { includeMap: false }).encounter, null);
});

test('asking changes what the family understands, and it outlives the rider', () => {
  const world = briefed('asking');
  soloDispatch(world, 'hh-2');
  for (let i = 0; i < 40 && !openFor(world, 'hh-2'); i++) stepWorld(world);
  const encounter = openFor(world, 'hh-2');
  const listener = encounter.listenerId;
  applyAction(world, 'hh-2', { action: 'ask-rider', entityId: listener, lineId: 'how-many' });
  assert.deepEqual(encounter.asked, ['how-many']);
  assert.equal(encounter.said.length, 3, 'the question and the answer both count as things said');
  assert.equal(encounter.said[1].speaker, 'listener');
  assert.equal(encounter.said[2].speaker, 'rider');
  // HISTORY.md forbids stating a troop total, so the rider has none to give. That is not
  // a missing feature; it is the exclusion showing up as a person who does not know.
  assert.match(encounter.said[2].text, /did not count/);
  const report = knows(world, 'hh-2');
  assert.equal(report.details.length, 1);
  assert.equal(report.details[0].ask, 'How many of them are there?');
  const projected = projectWorld(world, 'hh-2', 'student', { includeMap: false });
  assert.equal(projected.encounter.questions.length, CONVERSATIONS[TOPIC].lines.length - 1, 'a question already put is not offered again');
  assert.ok(projected.reports.find(r => r.topicId === TOPIC).details.length === 1, 'and the journal carries it');
  // The rider leaves. What was drawn out of them does not.
  applyAction(world, 'hh-2', { action: 'leave-rider', entityId: listener });
  advance(world, 3);
  assert.equal(knows(world, 'hh-2').details.length, 1);
});

test('only the person the rider actually stopped for can speak to them', () => {
  const world = briefed('whose');
  soloDispatch(world, 'hh-2');
  for (let i = 0; i < 40 && !openFor(world, 'hh-2'); i++) stepWorld(world);
  const encounter = openFor(world, 'hh-2');
  const other = world.households['hh-2'].members.find(id => id !== encounter.listenerId);
  assert.throws(() => applyAction(world, 'hh-2', { action: 'ask-rider', entityId: other, lineId: 'saw-it' }), /standing with the rider/);
  assert.throws(() => applyAction(world, 'hh-3', { action: 'ask-rider', entityId: 'hh-3-thomas', lineId: 'saw-it' }), /Nobody is standing/);
  applyAction(world, 'hh-2', { action: 'ask-rider', entityId: encounter.listenerId, lineId: 'saw-it' });
  assert.throws(() => applyAction(world, 'hh-2', { action: 'ask-rider', entityId: encounter.listenerId, lineId: 'saw-it' }), /already been asked/);
  assert.equal(encounter.asked.length, 1);
});

test('a rider who is ignored rides on, and the family still has the news', () => {
  const world = briefed('ignored');
  soloDispatch(world, 'hh-2');
  for (let i = 0; i < 40 && !openFor(world, 'hh-2'); i++) stepWorld(world);
  const encounter = openFor(world, 'hh-2');
  const rider = world.entities[encounter.carrierId];
  advance(world, 2);
  // Still in hand a couple of ticks in. The opening line makes the household know, so a
  // check for "this family already knows" that runs ahead of "this family is already
  // talking to somebody" ends the errand of the rider who is still standing there.
  assert.ok(rider.report, 'the errand is still in hand while they are talking');
  assert.equal(encounter.status, 'open');
  advance(world, PATIENCE_MINUTES / 20 + 1);
  assert.equal(encounter.status, 'closed');
  assert.equal(encounter.reason, 'unanswered');
  assert.equal(rider.report, undefined, 'the errand was discharged by being said, not by being read');
  assert.ok(knows(world, 'hh-2'), 'and the family kept what it heard');
  assert.equal(knows(world, 'hh-2').details, undefined, 'without the detail it never asked for');
  const ended = world.events.filter(e => e.type === 'encounter-ended' && e.householdId === 'hh-2');
  assert.equal(ended.length, 1);
  assert.match(ended[0].text, /rode on/);
});

test('saying goodbye ends it, and the rider goes on about their business', () => {
  const world = briefed('goodbye');
  soloDispatch(world, 'hh-4');
  for (let i = 0; i < 60 && !openFor(world, 'hh-4'); i++) stepWorld(world);
  const encounter = openFor(world, 'hh-4');
  const rider = world.entities[encounter.carrierId];
  const halted = Boolean(rider.travel?.halted);
  applyAction(world, 'hh-4', { action: 'leave-rider', entityId: encounter.listenerId });
  assert.equal(encounter.status, 'closed');
  assert.equal(encounter.reason, 'farewell');
  if (halted) { stepWorld(world); assert.ok(!rider.travel?.halted, 'the road starts going past again'); }
  assert.equal(projectWorld(world, 'hh-4', 'student', { includeMap: false }).encounter.questions.length, 0, 'a closed conversation offers nothing');
  assert.ok(projectWorld(world, 'hh-4', 'student', { includeMap: false }).encounter.said.length, 'but it can still be read back');
});

test('a conversation survives save, reload and reconnect without happening twice', () => {
  const world = briefed('reconnect');
  soloDispatch(world, 'hh-2');
  for (let i = 0; i < 40 && !openFor(world, 'hh-2'); i++) stepWorld(world);
  const encounter = openFor(world, 'hh-2');
  applyAction(world, 'hh-2', { action: 'ask-rider', entityId: encounter.listenerId, lineId: 'when-left' });
  const dir = mkdtempSync(join(tmpdir(), 'texas-encounter-'));
  try {
    writeSave(join(dir, 'save.json'), { saveVersion: 3, world });
    const reloaded = readSave(join(dir, 'save.json')).world;
    assert.deepEqual(reloaded, world, 'the conversation round-trips through JSON exactly');
    validateWorld(reloaded);
    const before = projectWorld(world, 'hh-2', 'student', { includeMap: false }).encounter;
    const after = projectWorld(reloaded, 'hh-2', 'student', { includeMap: false }).encounter;
    assert.deepEqual(after, before, 'and a reconnecting student is handed the same words');
    // Stepping the reloaded world must not re-deliver anything already delivered.
    const events = reloaded.events.length;
    stepWorld(reloaded);
    assert.equal(reloaded.knowledge.households['hh-2'][TOPIC].eventId, world.knowledge.households['hh-2'][TOPIC].eventId);
    assert.ok(reloaded.events.length - events < 3, 'no second arrival, no second telling');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('compressed time stops when somebody is met, and never runs past a conversation', () => {
  const world = briefed('compression');
  for (const barrier of world.barriers) barrier.resolved = true;
  soloDispatch(world, 'hh-2');
  const jump = resolveTimeJump(world, 2880);
  assert.match(String(jump.blockedBy), /^encounter:/, 'the jump stopped at the meeting rather than skating over it');
  const encounter = openFor(world, 'hh-2');
  assert.ok(encounter, 'and the meeting actually happened');
  assert.equal(encounter.openedMinute, world.minute);
  assert.ok(jump.advancedMinutes > 0 && jump.advancedMinutes < 2880);
  // A second jump while they are still talking goes nowhere at all.
  const blocked = resolveTimeJump(world, 2880);
  assert.equal(blocked.advancedMinutes, 0);
  assert.equal(blocked.blockedBy, `encounter:${encounter.id}`);
  applyAction(world, 'hh-2', { action: 'leave-rider', entityId: encounter.listenerId });
  assert.ok(resolveTimeJump(world, 600).advancedMinutes > 0, 'and time runs again once they have parted');
  validateWorld(world);
});

test('a class saved before riders spoke still runs, and its couriers still deliver', () => {
  const world = briefed('old-save');
  const id = soloDispatch(world, 'hh-5');
  // Exactly what an older save holds: a courier in flight with no conversation attached,
  // and a world with no encounter state at all.
  delete world.entities[id].report.inPerson;
  delete world.entities[id].report.originSiteId;
  delete world.entities[id].report.departedMinute;
  world.entities[id].name = 'Rider 1';
  delete world.encounters;
  delete world.nextEncounterId;
  validateWorld(world);
  for (let i = 0; i < 60 && !knows(world, 'hh-5'); i++) stepWorld(world);
  assert.ok(knows(world, 'hh-5'), 'the old path still delivers at the door');
  assert.match(knows(world, 'hh-5').source, /^Courier /);
  assert.equal(openFor(world, 'hh-5'), undefined, 'no conversation was invented for a courier that never had one');
  assert.equal(Object.values(world.encounters).some(e => e.householdId === 'hh-5'), false);
  assert.ok(world.encounters, 'and the new state defaulted rather than needing a save version');
  validateWorld(world);
});

test('a whole class of riders meets a whole class of families, and every word is causal', () => {
  const world = createGonzalesWorld('whole-class', 15);
  world.status = 'running';
  advance(world, 200);
  const heard = Object.keys(world.households).filter(id => knows(world, id));
  assert.equal(heard.length, 15, 'nobody was left without the news');
  const met = Object.values(world.encounters);
  assert.equal(met.length, 14, 'fourteen riders met fourteen families; hh-1 hears from a neighbour');
  const listeners = new Set(met.map(e => e.listenerId));
  assert.ok([...listeners].some(id => !id.endsWith('-thomas')), 'the rider meets whoever is there, not always the principal');
  for (const encounter of met) {
    const spoken = world.events.find(e => e.id === encounter.said[0].eventId);
    assert.ok(spoken.causes.includes(encounter.metEventId), 'the words are caused by the meeting');
    const information = world.events.find(e => e.type === 'information' && e.householdId === encounter.householdId);
    assert.ok(information.causes.includes(encounter.said[0].eventId), 'and the knowledge is caused by the words');
    assert.ok(world.events.find(e => e.id === encounter.metEventId).causes.includes(world.truth[TOPIC].eventId), 'and the meeting by the thing that happened');
  }
  validateWorld(world);
});

test('what a rider says about their ride does not change while they stand there saying it', () => {
  const world = briefed('provenance');
  soloDispatch(world, 'hh-2');
  for (let i = 0; i < 40 && !openFor(world, 'hh-2'); i++) stepWorld(world);
  const encounter = openFor(world, 'hh-2');
  const listener = encounter.listenerId;
  applyAction(world, 'hh-2', { action: 'ask-rider', entityId: listener, lineId: 'when-left' });
  const early = world.knowledge.households['hh-2'][TOPIC].details[0].answer;
  const projected = projectWorld(world, 'hh-2', 'student', { includeMap: false }).encounter;
  // Both numbers are fixed at the meeting. Read from `world.minute` instead - which is
  // what this did first - and a rider three hours off the road announces twenty-two the
  // longer a student reads, because the conversation itself is compressed time passing.
  assert.equal(projected.rodeForMinutes, encounter.openedMinute - encounter.departedMinute);
  assert.equal(projected.observedAgoMinutes, encounter.departedMinute - encounter.observedMinute);
  advance(world, 20);
  const late = projectWorld(world, 'hh-2', 'student', { includeMap: false }).encounter;
  assert.equal(late.rodeForMinutes, projected.rodeForMinutes, 'the ride does not grow while they talk');
  assert.equal(late.observedAgoMinutes, projected.observedAgoMinutes);
  assert.equal(world.knowledge.households['hh-2'][TOPIC].details[0].answer, early, 'and what was already said stays said');
});

test('delivering a message does not put a rider off their horse', () => {
  const world = briefed('still-a-rider');
  soloDispatch(world, 'hh-2');
  for (let i = 0; i < 40 && !openFor(world, 'hh-2'); i++) stepWorld(world);
  const encounter = openFor(world, 'hh-2');
  const seen = () => projectWorld(world, 'hh-2', 'student', { includeMap: false }).others.find(o => o.id === encounter.carrierId);
  assert.equal(seen()?.carrier, true, 'a rider standing with the family is a rider');
  assert.equal(seen().report, undefined, 'and what they carry is still nobody\u2019s business');
  applyAction(world, 'hh-2', { action: 'leave-rider', entityId: encounter.listenerId });
  advance(world, 2);
  // Found live: `carrier` was read off the report, which is deleted the moment the
  // errand is discharged, so the horse vanished under the rider at the end of every
  // conversation and they were redrawn as a settler standing in the yard.
  const after = seen();
  if (after) assert.equal(after.carrier, true, 'still a rider once the errand is done');
});

test('a rider says a line and then waits, rather than mouthing it for a quarter of an hour', () => {
  const world = briefed('poses');
  soloDispatch(world, 'hh-2');
  for (let i = 0; i < 40 && !openFor(world, 'hh-2'); i++) stepWorld(world);
  const encounter = openFor(world, 'hh-2');
  const rider = () => projectWorld(world, 'hh-2', 'student', { includeMap: false }).others.find(o => o.id === encounter.carrierId);
  assert.equal(rider().speaking, true, 'the opening line is being said');
  assert.ok(['e', 'w'].includes(rider().facing), 'and they are turned toward whoever is hearing it');
  advance(world, 3);
  // Measured live: `speaking` read "the rider spoke last", and a rider always speaks
  // last because they answer - so they held the speaking loop for thirty ticks and the
  // delivered listening frames never occurred once.
  assert.equal(rider().speaking, false, 'then they are waiting to be asked something');
  applyAction(world, 'hh-2', { action: 'ask-rider', entityId: encounter.listenerId, lineId: 'crossing' });
  assert.equal(rider().speaking, true, 'answering is speaking again');
  applyAction(world, 'hh-2', { action: 'leave-rider', entityId: encounter.listenerId });
  assert.equal(rider().speaking, undefined, 'and once they have gone there is no conversation to be in');
  assert.equal(rider().carrier, true);
});

// ---------------------------------------------------------------------------------
// Step 2: onward delivery and relays.
//
// Step 1 left every family meeting an eyewitness; the distant ones simply met one later.
// What the owner described is a family near Liberty hearing an older account from somebody
// who had already repeated it to other people - which is a different fact about the world,
// not a bigger number. These tests are about the difference between late and second-hand.

// A class where every household is told at the same minute, so the road is the only
// variable left between one family's news and another's.
function classBriefed(seed, players = 15) {
  const world = briefed(seed, players);
  for (const id of Object.keys(world.households)) {
    if (!world.knowledge.households[id][TOPIC] && !carrierTo(world, id)) soloDispatch(world, id);
  }
  return world;
}
const roadMiles = (world, householdId) => findPath(world.map, 'gonzales', world.households[householdId].homeSiteId).distance;
// The first conversation of a given kind to open, stepping the world until it does.
function untilOpen(world, secondHand, ticks = 90) {
  for (let i = 0; i < ticks; i++) {
    const found = Object.values(world.encounters).find(e => e.status === 'open' && Boolean(e.provenance.length) === secondHand);
    if (found) return found;
    stepWorld(world);
  }
  return null;
}

test('a family a county away is told by somebody who was told, and a family near the town by the person who saw it', () => {
  const world = classBriefed('relay');
  advance(world, 80);
  const met = Object.values(world.encounters);
  const near = met.filter(e => !e.provenance.length);
  // "Add onward delivery, two distant households" - the build order asks for two, so two
  // is what is asserted, and they are two different chains of two different people.
  const far = met.filter(e => e.provenance.length >= 2);
  assert.ok(near.length, 'somebody met the rider who saw it');
  assert.ok(far.length >= 2, `two distant households heard it through other people (${far.length})`);
  for (const encounter of near) {
    assert.match(encounter.said[0].text, /I.ve come up from Gonzales/, 'the man who saw it says so');
    assert.equal(knows(world, encounter.householdId).hands, 0);
    assert.equal(knows(world, encounter.householdId).status, 'confirmed');
  }
  for (const encounter of far) {
    assert.match(encounter.said[0].text, /I did not see any of this myself/, 'and somebody who did not, does not pretend otherwise');
    assert.ok(encounter.said[0].text.includes('Gonzales'), 'while still saying where it started');
    assert.equal(knows(world, encounter.householdId).hands, encounter.provenance.length);
    // The word loses its footing as it goes: two hand-offs is a rumor, whatever the
    // rider believes. The family's own journal says so without anybody explaining it.
    assert.equal(knows(world, encounter.householdId).status, 'rumor');
  }
  assert.ok(Math.max(...far.map(e => roadMiles(world, e.householdId))) > Math.max(...near.map(e => roadMiles(world, e.householdId))),
    'the families at third hand are the ones out at the edge of the county');
  assert.equal(new Set(far.map(e => e.carrierId)).size, far.length, 'and no one rider served two of them');
});

test('a hand-off keeps where the word started, when it was seen, and every road it came down', () => {
  const world = classBriefed('ancestry');
  advance(world, 80);
  const truth = world.truth[TOPIC];
  const firsthand = Object.values(world.encounters).find(e => !e.provenance.length);
  assert.equal(firsthand.departedMinute - firsthand.observedMinute, 0, 'the man who saw it set out with it');
  const far = Object.values(world.encounters).filter(e => e.provenance.length >= 2);
  assert.ok(far.length, 'somebody heard it at third hand');
  for (const encounter of far) {
    assert.equal(encounter.originSiteId, truth.siteId, 'the source survives every hand it passes through');
    assert.equal(encounter.observedMinute, truth.minute, 'and so does when it was seen');
    assert.ok(encounter.departedMinute > truth.minute, 'the last rider set out long after the thing happened');
    const projected = projectWorld(world, encounter.householdId, 'student', { includeMap: false }).encounter;
    assert.equal(projected.observedAgoMinutes, encounter.departedMinute - truth.minute, 'the age of the account is the age at the source, not at the last hand-off');
    assert.equal(projected.hands, encounter.provenance.length);
    assert.equal(projected.firsthand, false);
    // Every hand-off happened at a place on the road between Gonzales and this family.
    // Nobody was fetched from off the map to carry it.
    const road = findPath(world.map, 'gonzales', world.households[encounter.householdId].homeSiteId).nodes.map(node => node.id);
    for (const hop of encounter.provenance) {
      assert.ok(road.includes(hop.atSiteId), `${hop.atSiteId} is a place on the road it actually travelled`);
      assert.ok(hop.name && hop.minute >= truth.minute, 'and a person, at a time');
    }
    const minutes = encounter.provenance.map(hop => hop.minute);
    assert.deepEqual(minutes, [...minutes].sort((a, b) => a - b), 'oldest hand first');
  }
});

test('a rider who was told will not say they saw', () => {
  const world = classBriefed('honesty');
  const ask = (encounter, lineId) => {
    applyAction(world, encounter.householdId, { action: 'ask-rider', entityId: encounter.listenerId, lineId });
    return encounter.said.at(-1).text;
  };
  const near = untilOpen(world, false);
  assert.ok(near, 'somebody is standing with the rider who saw it');
  assert.match(ask(near, 'saw-it'), /with my own eyes/);
  assert.ok(!/\d/.test(ask(near, 'how-many')), 'and still will not count them');
  const far = untilOpen(world, true);
  assert.ok(far, 'and somebody else with a rider who was told');
  const second = ask(far, 'saw-it');
  assert.match(second, /^No\./, 'the honest answer to a question they cannot answer');
  assert.ok(second.includes(far.provenance.at(-1).name), 'and they name who did tell them');
  // HISTORY.md excludes exact troop totals at Gonzales, and a chain of riders is not a
  // way to launder one into existence.
  assert.ok(!/\d/.test(ask(far, 'how-many')), 'nobody down the chain invents a count');
  assert.ok(ask(far, 'when-left').includes(far.provenance.at(-1).name), 'and when they left is when it was handed to them');
});

test('changing hands costs the word no time, so the road is still the only thing that decides when a family hears', () => {
  const world = classBriefed('timing');
  const departed = world.minute;
  // When the word itself got there, rather than when somebody happened to be home to take
  // it: a family off in the timber all afternoon is a different test, and this one is
  // about whether a hand-off at a fork in the road slows the news down.
  const arrived = {};
  for (let tick = 0; tick < 80; tick++) {
    stepWorld(world);
    for (const household of Object.values(world.households)) {
      if (arrived[household.id]) continue;
      const carrier = carrierTo(world, household.id);
      if (carrier?.location.siteId === household.homeSiteId || openFor(world, household.id)) arrived[household.id] = world.minute - departed;
    }
  }
  const rows = Object.values(world.households).map(household => {
    const met = Object.values(world.encounters).find(e => e.householdId === household.id);
    // Everybody who carried this household's word, in order, from the source to the gate.
    const chain = met ? [...met.provenance.map(hop => hop.id), met.carrierId] : [];
    // Time those riders spent standing in somebody else's conversation on the way here.
    // It is the one thing besides the road that can make a family's news late, and it is
    // a thing a student can watch happen.
    const talking = Object.values(world.encounters)
      .filter(e => chain.includes(e.carrierId) && e.householdId !== household.id && e.openedMinute < departed + (arrived[household.id] ?? 0))
      .reduce((sum, e) => sum + ((e.closedMinute ?? world.minute) - e.openedMinute), 0);
    return {
      id: household.id, miles: roadMiles(world, household.id), took: arrived[household.id], talking,
      alone: Math.ceil(roadMiles(world, household.id) / RIDER_SPEED) * 20, hands: knows(world, household.id)?.hands,
    };
  }).filter(row => row.took !== undefined);
  assert.ok(rows.length >= 10, `${rows.length} households were reached`);
  assert.ok(rows.some(row => row.hands >= 2), 'the class really does contain a household at the end of a chain');
  for (const row of rows) {
    assert.ok(row.took <= row.alone + row.talking,
      `${row.id} waited ${row.took} minutes for news from ${row.miles.toFixed(1)} miles: one unbroken rider would have brought it in ${row.alone}, and its riders stood talking to other families for ${row.talking}`);
  }
});

test('a rider tells whoever they come alongside, and still rides on to the family they were sent to', () => {
  // One rider in the whole class, so the person who tells the bystander and the person
  // who reaches the gate can be compared. Otherwise another family's rider gets there
  // first - which is the same feature working, and would prove nothing here.
  const world = createGonzalesWorld('onward', 5);
  world.status = 'running';
  for (const id of Object.keys(world.households)) world.director.dispatches[id] = true;
  while (!world.truth[TOPIC]) stepWorld(world);
  // The nearest family, so one rider makes the whole ride and the same person is
  // demonstrably the one who does both tellings.
  const [sent, other] = Object.keys(world.households).sort((a, b) => roadMiles(world, a) - roadMiles(world, b));
  dispatchReport(world, TOPIC, sent);
  // Whoever is carrying it on the last leg, so that the rider who passes the bystander is
  // demonstrably the same rider who reaches the gate.
  for (let i = 0; i < 40 && carrierTo(world, sent)?.report.destination !== world.households[sent].homeSiteId; i++) stepWorld(world);
  const rider = carrierTo(world, sent);
  assert.equal(rider.report.destination, rider.report.homeSiteId, 'this is the last leg of the ride');
  // Somebody from another family, standing on the road the rider is about to ride down.
  const spot = pointAlong(rider.travel.points, rider.travel.progress + rider.travel.speed * 0.6);
  const bystander = world.entities[`${other}-rosa`];
  const home = world.households[other].homeSiteId;
  bystander.travel = { from: home, to: home, points: [{ x: spot.x, y: spot.y }, { x: spot.x, y: spot.y }], progress: 0, distance: 0, speed: 1, purpose: 'visit', causeId: null, halted: true };
  bystander.location = { x: spot.x, y: spot.y, siteId: null };
  stepWorld(world);
  const met = openFor(world, other);
  assert.ok(met, 'the rider stopped for somebody who was not the person they were sent to');
  assert.equal(met.carrierId, rider.id);
  assert.equal(met.listenerId, bystander.id);
  assert.ok(knows(world, other), 'and that family heard it');
  assert.ok(rider.report, 'the errand is not discharged by telling somebody else on the way');
  applyAction(world, other, { action: 'leave-rider', entityId: met.listenerId });
  for (let i = 0; i < 40 && !openFor(world, sent); i++) stepWorld(world);
  const errand = openFor(world, sent);
  assert.ok(errand, 'and then went on and told the family it was for');
  assert.equal(errand.carrierId, rider.id, 'the same rider, the same word, further down the same road');
});

test('a family that already knows is ridden past, and a firmer account is not', () => {
  const world = briefed('dedup');
  // Something half-heard from somewhere. A rider carrying the confirmed account still has
  // something worth stopping for, which is the correction the document asks not to lose.
  learn(world, 'hh-2', TOPIC, { status: 'rumor', source: 'Something somebody said' });
  soloDispatch(world, 'hh-2');
  for (let i = 0; i < 40 && !openFor(world, 'hh-2'); i++) stepWorld(world);
  assert.ok(openFor(world, 'hh-2'), 'a firmer account is worth reining in for');
  assert.equal(knows(world, 'hh-2').status, 'confirmed', 'and the family now has the better version');
  applyAction(world, 'hh-2', { action: 'leave-rider', entityId: openFor(world, 'hh-2').listenerId });
  // The same news a second time is not news. The next rider's errand simply ends.
  const second = world.entities[soloDispatch(world, 'hh-2')];
  for (let i = 0; i < 40 && second.report; i++) stepWorld(world);
  assert.equal(second.report, undefined, 'the second rider found them already told and let it go');
  assert.equal(openFor(world, 'hh-2'), undefined, 'without saying any of it over again');
  assert.equal(Object.values(world.encounters).filter(e => e.householdId === 'hh-2').length, 1);
});

test('a conversation broken off keeps what was already said', () => {
  const world = briefed('interrupted');
  soloDispatch(world, 'hh-2');
  for (let i = 0; i < 40 && !openFor(world, 'hh-2'); i++) stepWorld(world);
  const encounter = openFor(world, 'hh-2');
  const rider = world.entities[encounter.carrierId];
  applyAction(world, 'hh-2', { action: 'ask-rider', entityId: encounter.listenerId, lineId: 'crossing' });
  const answered = world.knowledge.households['hh-2'][TOPIC].details.at(-1).answer;
  // Whoever was listening walks off in the middle of it. Nothing is cancelled, because
  // what was said was said.
  const listener = world.entities[encounter.listenerId];
  listener.location = { ...world.map.sites['lower-timber'], siteId: 'lower-timber' };
  stepWorld(world);
  assert.equal(encounter.status, 'closed');
  assert.equal(encounter.reason, 'parted');
  assert.ok(knows(world, 'hh-2'), 'the family still heard it');
  assert.equal(world.knowledge.households['hh-2'][TOPIC].details.at(-1).answer, answered, 'and still has what it asked for');
  assert.ok(!rider.travel?.halted, 'the rider is no longer standing about');
  const projected = projectWorld(world, 'hh-2', 'student', { includeMap: false }).encounter;
  assert.equal(projected.status, 'closed');
  assert.equal(projected.questions.length, 0, 'there is nobody left to ask');
  assert.equal(projected.said.length, encounter.said.length, 'but the whole of it is still readable');
});

test('compressed time carries the word across a hand-off', () => {
  const world = briefed('jump-relay', 15);
  const far = Object.keys(world.households).sort((a, b) => roadMiles(world, b) - roadMiles(world, a))[0];
  assert.ok(roadMiles(world, far) > 20, 'a family right out at the edge of the county');
  soloDispatch(world, far);
  // Jump, and keep jumping. Every meeting stops the jump - that is step 1's barrier - so
  // the way through is to let each conversation end and then jump again.
  for (let i = 0; i < 25 && !knows(world, far); i++) {
    const { blockedBy } = resolveTimeJump(world, 600);
    if (!blockedBy?.startsWith('encounter:')) continue;
    const open = Object.values(world.encounters).find(e => e.status === 'open');
    if (open) applyAction(world, open.householdId, { action: 'leave-rider', entityId: open.listenerId });
  }
  assert.ok(knows(world, far), 'the word crossed the county inside compressed time');
  assert.ok(knows(world, far).hands >= 1, 'and it changed hands on the way, rather than waiting at a fork for the class to tick live again');
});

test('a hand-off is the word\u2019s business and nobody else\u2019s', () => {
  const world = classBriefed('relay-leak');
  advance(world, 30);
  assert.ok(world.events.some(e => e.type === 'relay'), 'the word did change hands');
  for (const id of Object.keys(world.households)) {
    const wire = JSON.stringify(projectWorld(world, id, 'student', { includeMap: false }));
    assert.ok(!wire.includes('gave the word'), `hh ${id} was shown a hand-off it has no business seeing`);
    if (!knows(world, id)) assert.ok(!wire.includes(world.truth[TOPIC].text), `hh ${id} was shown news it has not heard`);
  }
  const host = JSON.stringify(projectWorld(world, null, 'host', { includeMap: false }));
  assert.ok(!host.includes('gave the word'), 'and neither was the Host');
});

test('a rider who has given the word on does not also deliver it', () => {
  const world = classBriefed('handed-on');
  advance(world, 80);
  const handed = world.events.filter(e => e.type === 'relay');
  assert.ok(handed.length, 'somebody handed it on');
  for (const event of handed) {
    const rider = world.entities[event.actorId];
    assert.equal(rider.report, undefined, `${rider.name} is still carrying word they gave to somebody else`);
    const after = Object.values(world.encounters).filter(e => e.carrierId === rider.id && e.openedMinute > event.minute);
    assert.equal(after.length, 0, `${rider.name} went on telling people after handing it over`);
  }
});

test('a rider with somewhere still to be does not stand about all day, and one who has arrived will', () => {
  const world = createGonzalesWorld('waiting', 5);
  world.status = 'running';
  for (const id of Object.keys(world.households)) world.director.dispatches[id] = true;
  while (!world.truth[TOPIC]) stepWorld(world);
  const [sent, other] = Object.keys(world.households).sort((a, b) => roadMiles(world, a) - roadMiles(world, b));
  dispatchReport(world, TOPIC, sent);
  for (let i = 0; i < 40 && carrierTo(world, sent)?.report.destination !== world.households[sent].homeSiteId; i++) stepWorld(world);
  const rider = carrierTo(world, sent);
  const spot = pointAlong(rider.travel.points, rider.travel.progress + rider.travel.speed * 0.6);
  const bystander = world.entities[`${other}-rosa`];
  const home = world.households[other].homeSiteId;
  bystander.travel = { from: home, to: home, points: [{ x: spot.x, y: spot.y }, { x: spot.x, y: spot.y }], progress: 0, distance: 0, speed: 1, purpose: 'visit', causeId: null, halted: true };
  bystander.location = { x: spot.x, y: spot.y, siteId: null };
  stepWorld(world);
  const passing = openFor(world, other);
  assert.ok(passing, 'the rider stopped for somebody met on the way');
  advance(world, PASSING_MINUTES / 20 + 1);
  // Found by measuring: with one patience for both, a family who never opened the panel
  // held the rider on the road for twenty fictional hours, and so did everybody further
  // along it. Nobody could see why their news was late, because the reason was a
  // classroom attention span.
  assert.equal(passing.status, 'closed', 'a rider with an errand in hand does not wait all day to be asked something');
  assert.equal(passing.reason, 'unanswered');
  assert.ok(!rider.travel?.halted, 'and is back on the road');
  assert.ok(knows(world, other), 'while the family still keeps what it was told');
  for (let i = 0; i < 40 && !openFor(world, sent); i++) stepWorld(world);
  const errand = openFor(world, sent);
  assert.ok(errand, 'and reached the family it was for');
  advance(world, PASSING_MINUTES / 20 + 1);
  assert.equal(errand.status, 'open', 'who get as long as they like, because the rider has nowhere else to be');
});

test('a fainter account does not overwrite a firmer one', () => {
  const world = briefed('fainter');
  // What a family already has, from somebody one hand from the source.
  learn(world, 'hh-2', TOPIC, { status: 'unconfirmed', source: 'A rider who had it from somebody', hands: 1 });
  // And a rider at the end of a longer chain, carrying the same news only worse. Once a
  // rider stops for anybody they come alongside, this happens on its own: the chains run
  // at different speeds and the bad one sometimes arrives second.
  world.director.dispatches['hh-2'] = true;
  dispatchReport(world, TOPIC, 'hh-2', 'rumor');
  // Ridden out to the end - the whole chain, not the first rider, because a rider who
  // hands the word on at a fork is not the one who would knock on this door.
  advance(world, 40);
  assert.equal(knows(world, 'hh-2').status, 'unconfirmed', 'the better account stands');
  assert.equal(knows(world, 'hh-2').hands, 1, 'and so does where it came from');
  assert.equal(knows(world, 'hh-2').source, 'A rider who had it from somebody');
  assert.equal(Object.values(world.encounters).filter(e => e.householdId === 'hh-2').length, 0,
    'and nobody stopped: there was nothing in it this family did not already have better');
  assert.equal(carrierTo(world, 'hh-2'), undefined, 'the errand simply ends');
});

test('a chain that cannot be walked back is not provenance', () => {
  const world = classBriefed('validate');
  advance(world, 60);
  const relayed = Object.values(world.encounters).find(e => e.provenance.length);
  assert.ok(relayed, 'something in this class came through other people');
  validateWorld(world);
  // A hand that names nowhere is decoration. The whole value of keeping the chain is that
  // the reckoning at the end can walk it back to the person who saw the thing.
  relayed.provenance = [{ name: 'Somebody', atSiteId: 'nowhere', minute: world.minute }];
  assert.throws(() => validateWorld(world), /hand-off must name/);
  relayed.provenance = 'a man told me';
  assert.throws(() => validateWorld(world), /provenance/);
});
