// The muster (owner, 2026-10-06, verbatim: "Volunteers should be given a chance to legitimately join the army, or stay in gonzales
// as a volunteer, or go home."; sim/muster.mjs, docs/MILITARY_EXPERIENCE.md "The muster").
//
// When the volunteers at Gonzales are made into an army, a played family is asked for each of its men standing there: join it, stay
// in Gonzales as a volunteer, or come home. Nobody answering in time is joining; a family nobody plays joins as before. A man who
// stayed may go after the army later from his bar, until it has broken up.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, projectWorld, stepWorld, validateWorld } from '../sim/world.mjs';
import { momentOf } from '../sim/directors.mjs';
import { CALL_BUDGET_MS } from '../sim/decision-budget.mjs';
import { eatenADay } from '../sim/family.mjs';
import { TICK_MINUTES, calendarMinutes } from '../sim/clock.mjs';

const view = (world, householdId) => projectWorld(world, householdId, 'student', { includeMap: false });
const letRidersGo = world => {
  for (const one of Object.values(world.encounters || {})) {
    if (one.status !== 'open' || one.kind) continue;
    try { applyAction(world, one.householdId, { action: 'leave-rider', entityId: one.listenerId }); } catch { /* gone */ }
  }
};

/**
 * One real-map class: every far family's principal turns out when its call comes; the families of Mina, whose men reach Gonzales
 * first, are played. Run to the tick the army is made (`organised`, October 11).
 */
let made = null;
function atTheMuster() {
  if (made) return structuredClone(made);
  const world = createGonzalesWorld('probe-calls', 15, { map: 'colonies' });
  world.status = 'running';
  for (const household of Object.values(world.households)) if (household.settlementId === 'mina') household.played = true;
  const sent = new Set();
  while (!world.army && world.minute < momentOf(world, 'organised') + 1440) {
    stepWorld(world);
    letRidersGo(world);
    for (const [householdId, call] of Object.entries(world.calls || {})) {
      if (call.status !== 'open' || sent.has(householdId)) continue;
      sent.add(householdId);
      try { applyAction(world, householdId, { action: 'turn-out', entityId: world.households[householdId].principalId }); } catch { /* cannot go */ }
    }
  }
  validateWorld(world);
  made = world;
  return structuredClone(made);
}
const minaMan = world => {
  const household = Object.values(world.households).find(one => one.settlementId === 'mina' && world.muster?.[one.id]);
  return { household, person: world.entities[Object.keys(world.muster[household.id].asks)[0]] };
};
const stepUntil = (world, done, limit = 600) => { for (let i = 0; i < limit && !done(); i++) stepWorld(world); };

test('when the army is made a played family is asked for its man at Gonzales on its card; a family nobody plays joins as before', () => {
  const world = atTheMuster();
  assert.ok(world.army, 'the army was never made');
  const { household, person } = minaMan(world);
  assert.equal(world.muster[household.id].asks[person.id], 'open');
  assert.ok(!world.army.members.includes(person.id), `${person.name} was taken into the army before his family answered`);
  const request = view(world, household.id).request;
  assert.equal(request?.kind, 'muster');
  assert.deepEqual(request.answerers[person.id].map(option => option.id), ['muster-join', 'muster-stay', 'muster-home']);
  assert.ok(request.answerers[person.id].every(option => option.can), JSON.stringify(request.answerers[person.id]));
  assert.match(request.lapses, /joins the army/);
  // A family nobody plays is asked nothing, and its man is in the army as he always was.
  const theirs = Object.values(world.calls).filter(call => call.status === 'accepted' && !world.households[world.entities[call.actorId].householdId].played)
    .map(call => world.entities[call.actorId]).filter(one => one.location?.siteId === 'gonzales' || world.army.members.includes(one.id));
  assert.ok(theirs.length >= 1);
  for (const one of theirs) assert.ok(world.army.members.includes(one.id), `${one.name}, of a family nobody plays, was kept out of the army`);
});

test('Join the army: he is mustered in and marches with it', () => {
  const world = atTheMuster();
  const { household, person } = minaMan(world);
  applyAction(world, household.id, { action: 'muster-join', entityId: person.id });
  stepWorld(world);
  assert.ok(world.army.members.includes(person.id), `${person.name} was not taken into the army`);
  stepUntil(world, () => world.army.phase === 'marching');
  assert.equal(person.travel?.purpose, 'march');
});

test('Stay in Gonzales: still a volunteer in the town, not in the army or after it, and on his own food once it has marched', () => {
  const world = atTheMuster();
  const { household, person } = minaMan(world);
  applyAction(world, household.id, { action: 'muster-stay', entityId: person.id });
  stepUntil(world, () => world.army.phase === 'marching' && world.minute > momentOf(world, 'march') + 1440);
  assert.ok(!world.army.members.includes(person.id), `${person.name} was taken into the army`);
  assert.equal(person.travel, null, `${person.name} set out after the army`);
  assert.equal(person.location.siteId, 'gonzales');
  assert.ok(view(world, household.id).entities.find(one => one.id === person.id).militia, 'his row lost the militia\'s bar');
  // The town's half is gone with the army: kept at the drill a whole day, he eats a whole day out of his pack.
  const ration = eatenADay(world, [person]);
  person.militia.pack = ration * 5;
  const start = world.minute;
  while (world.minute - start < 1440) { person.chore = { id: 'camp-drill', step: 0, wait: 99, doing: 'drilling with the company' }; person.task = 'work'; stepWorld(world); }
  const days = (world.minute - start) / 1440;
  assert.ok(ration * 5 - person.militia.pack > ration * days * 0.9, `he ate only ${ration * 5 - person.militia.pack} of ${ration * days} from his pack`);
});

test('Come home: he leaves the volunteers and walks home', () => {
  const world = atTheMuster();
  const { household, person } = minaMan(world);
  applyAction(world, household.id, { action: 'muster-home', entityId: person.id });
  assert.equal(person.travel?.to, household.homeSiteId);
  assert.ok(!person.commitments.some(one => one.id === 'volunteer' && one.status === 'active'));
  stepWorld(world);
  assert.ok(!world.army.members.includes(person.id));
});

test('nobody answering in time: he joins the army, and the family is told so', () => {
  const world = atTheMuster();
  const { household, person } = minaMan(world);
  stepWorld(world, { realMs: CALL_BUDGET_MS + 1000 });
  stepWorld(world);
  assert.equal(world.muster[household.id].asks[person.id], 'join');
  assert.ok(world.army.members.includes(person.id), `${person.name} did not join when nobody answered`);
  assert.ok(world.events.some(event => event.actorId === person.id && /Nobody answered for .* in time, and he joined the army/.test(event.text)));
});

test('a man who stayed may go after the army from his bar while it is in the field, and joins it when he comes up with it', () => {
  const world = atTheMuster();
  const { household, person } = minaMan(world);
  applyAction(world, household.id, { action: 'muster-stay', entityId: person.id });
  stepUntil(world, () => world.army.phase === 'marching' && world.minute > momentOf(world, 'march') + 1440);
  const seen = view(world, household.id).entities.find(one => one.id === person.id);
  assert.equal(seen.militia.join?.can, true, `his bar does not offer the army: ${JSON.stringify(seen.militia)}`);
  if (person.chore) applyAction(world, household.id, { action: 'stop-chore', entityId: person.id });
  applyAction(world, household.id, { action: 'join-army', entityId: person.id });
  stepUntil(world, () => world.army.members.includes(person.id), 800);
  assert.ok(world.army.members.includes(person.id), `${person.name} never came up with the army`);
});

test('once the army has broken up, joining it is refused in words', () => {
  const world = atTheMuster();
  const { household, person } = minaMan(world);
  applyAction(world, household.id, { action: 'muster-stay', entityId: person.id });
  world.director.milestones['cos-marches'] = true;
  const seen = view(world, household.id).entities.find(one => one.id === person.id);
  assert.equal(seen.militia.join?.can, false);
  assert.match(seen.militia.join.why, /broken up/);
  assert.throws(() => applyAction(world, household.id, { action: 'join-army', entityId: person.id }), /broken up/);
});

test('while the family decides, the calendar holds at the farming scale, so the army does not march in a few ticks', () => {
  const world = atTheMuster();
  const { household, person } = minaMan(world);
  assert.equal(calendarMinutes(world), TICK_MINUTES, `the calendar ran at ${calendarMinutes(world)} minutes a tick with the muster's question open`);
  applyAction(world, household.id, { action: 'muster-join', entityId: person.id });
  for (const other of Object.values(world.muster)) for (const id of Object.keys(other.asks)) if (other.asks[id] === 'open') other.asks[id] = 'join';
  for (const other of Object.values(world.muster)) other.status = 'answered';
  assert.ok(calendarMinutes(world) > TICK_MINUTES, 'the calendar stayed held once the question was answered');
});
