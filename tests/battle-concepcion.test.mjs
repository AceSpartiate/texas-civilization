// Concepción on the engine (sim/battles/concepcion.mjs, sim/concepcion-grass.mjs; docs/battle-research/staging.md §1).
//
// What it holds: the division actually leaves Espada at two on October 27 with every family's person who went, and each is
// under the bank at the bend, in the line, before the horsemen come out of the fog; nobody in it can be sent anywhere else
// until it rejoins the army; each person's fate falls at a discharge of the gun, visible to whoever watches and never before;
// the Host, the families with somebody there and - from when the firing can be heard - the main army's families are sent the
// fight, and a family with nobody there nothing; the fighting plays three to six real minutes at the Study pace; afterwards
// the division is back in the ranks at Concepción and each family is told in plain words through its own person; a
// volunteer who turns out after the army has marched follows it and falls in, and the card says when he would catch it.
import test from 'node:test';
import assert from 'node:assert/strict';
import { applyAction, stepWorld, validateWorld } from '../sim/world.mjs';
import { TIMELINE, dateOf } from '../sim/directors.mjs';
import { ENGAGEMENTS, battleState, checkEngagement, projectBattle, schedule } from '../sim/battle-stage.mjs';
import { CONCEPCION, CONCEPCION_PLACES } from '../sim/battles/concepcion.mjs';
import { MISSIONS, concepcionFate, withTheArmy } from '../sim/army.mjs';
import { resolveTimeJump } from '../sim/time.mjs';
import { calendarMinutes } from '../sim/clock.mjs';
import { PACES } from '../server/app.mjs';
import { armyClass, momentOf, nobodyThere, until, untilMinute, view } from './support/campaign.mjs';

const copy = value => JSON.parse(JSON.stringify(value));
const phaseOf = world => battleState(world, 'concepcion')?.phase?.id;
const from = (world, id) => battleState(world, 'concepcion').phases.find(phase => phase.id === id).from;
const hour = (world, minute) => { const date = dateOf(world, minute); return `${date.getUTCMonth() + 1}/${date.getUTCDate()} ${date.getUTCHours()}:${String(date.getUTCMinutes()).padStart(2, '0')}`; };
const miles = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

/** The class at the detachment's question, the first volunteer sent with the division and the second kept with the army. */
function divisionClass(seed = 'concepcion-engine') {
  const { world, sent } = armyClass(seed);
  const [a, b] = sent;
  applyAction(world, a.householdId, { action: 'detachment-go', entityId: a.personId });
  applyAction(world, b.householdId, { action: 'detachment-stay', entityId: b.personId });
  return { world, a, b, c: sent[2] };
}
/** Change the class's seed until `personId`'s roll at Concepción comes out as `fate` (every other roll moves with it). */
function withFate(world, personId, fate) {
  for (let n = 0; n < 5000; n++) { world.seed = `concepcion-fate-${fate}-${n}`; if (concepcionFate(world, personId) === fate) return world; }
  throw new Error(`no seed gave ${fate}`);
}

test('Concepción is on the engine and on the director\'s clock: the division leaves Espada at two on the 27th, the fog lifts at eight, and nothing moves the day', () => {
  assert.equal(ENGAGEMENTS.concepcion, CONCEPCION);
  checkEngagement(CONCEPCION);
  const phases = schedule(CONCEPCION, TIMELINE['detachment-out']);
  const at = id => phases.find(phase => phase.id === id).from;
  assert.equal(TIMELINE.concepcion, at('fog-lifts'), 'the director\'s `concepcion` is not when the fog lifts');
  const { world } = armyClass('concepcion-engine');
  assert.equal(hour(world, at('march')), '10/27 14:00');
  assert.equal(hour(world, at('alarm')), '10/28 6:50');
  assert.equal(hour(world, at('fog-lifts')), '10/28 8:00');
  assert.equal(hour(world, at('charges')), '10/28 8:10');
  assert.equal(hour(world, at('retreat')), '10/28 8:30');
  assert.equal(hour(world, at('main-army')), '10/28 9:30');
  // The same missions as the army's own march, and the bend within the sources' five hundred yards of the mission.
  assert.deepEqual({ ...CONCEPCION_PLACES.espada }, { dx: MISSIONS.espada.dx, dy: MISSIONS.espada.dy });
  assert.deepEqual({ ...CONCEPCION_PLACES.mission }, { dx: MISSIONS.concepcion.dx, dy: MISSIONS.concepcion.dy });
  const ground = CONCEPCION.ground(world);
  assert.ok(miles(ground.bend, ground.mission) < 0.3, 'the bend is not within five hundred yards of the mission');
  // Named people speak only documented words; no Texian flag, and the three bugle calls are documented.
  for (const line of CONCEPCION.phases.flatMap(phase => phase.lines || [])) if (line.name) assert.equal(line.kind, 'documented');
  assert.equal(CONCEPCION.flag, null);
  assert.equal(CONCEPCION.phases.flatMap(phase => phase.lines || []).filter(line => line.role === 'bugler' && line.kind === 'documented').length, 4);
  // A group of a side is held to the rules of a side, and a fall has to be in a group on the field.
  const bad = change => { const def = copy(CONCEPCION); def.ground = CONCEPCION.ground; change(def); return () => checkEngagement(def); };
  const charges = def => def.phases.find(phase => phase.id === 'charges');
  assert.throws(bad(def => { charges(def).groups[0].drawn = 61; }), /at most 60/);
  assert.throws(bad(def => { charges(def).falls.push({ side: 'texian', group: 'nobody', count: 1, at: 3, claimId: 'HIST-TEX-481' }); }), /group that is not on the field/);
});

test('the division leaves Espada with every family\'s person who went, and each is under the bank, in the line, before the horsemen come out of the fog', () => {
  const { world, a, b } = divisionClass();
  // The question stays open past the move to Espada, until the division goes (staging.md §1.6 fix 2).
  const { world: late, a: lateA } = (() => { const { world: w, sent } = armyClass('concepcion-engine'); return { world: w, a: sent[0] }; })();
  untilMinute(late, momentOf(late, 'to-espada') + 1);
  assert.equal(late.army.detachment.asks[lateA.personId], 'open', 'the question shut when the army moved to Espada');
  assert.equal(late.army.detachment.closed, false);
  until(late, () => late.minute >= momentOf(late, 'detachment-out') - 720);
  applyAction(late, lateA.householdId, { action: 'detachment-go', entityId: lateA.personId });
  untilMinute(late, momentOf(late, 'detachment-out'));
  assert.ok(late.battles.concepcion.participants[lateA.personId], 'a man who said yes at the last minute did not go');

  untilMinute(world, momentOf(world, 'detachment-out'));
  const person = world.entities[a.personId], stayer = world.entities[b.personId];
  assert.ok(world.battles.concepcion.participants[a.personId], 'the man who said go is not with the division');
  assert.equal(person.travel, null, 'the man who went is still on the army\'s halted road');
  assert.equal(stayer.travel?.purpose, 'march', 'the man who stayed left the ranks');
  assert.equal(world.army.detachment.closed, true);
  // He walks with it, and is there before first light.
  const ground = CONCEPCION.ground(world);
  const start = miles(person.location, ground.bend);
  untilMinute(world, from(world, 'alarm'));
  assert.ok(start > 4, `he started ${start.toFixed(1)} miles from the bend, not at Espada`);
  assert.ok(miles(person.location, ground.bend) < 0.12, `at the alarm he is ${miles(person.location, ground.bend).toFixed(2)} miles from the bend`);
  // And in the line while it fires.
  untilMinute(world, from(world, 'charges'));
  assert.ok(Number.isFinite(world.battles.concepcion.participants[a.personId].fought), 'he was never in the line while it fired');
  validateWorld(world);
});

test('nobody in the division can be sent anywhere else until it rejoins the army, and a Host\'s time jump stops at the fight', () => {
  const { world, a } = divisionClass();
  untilMinute(world, momentOf(world, 'detachment-out') + 200);
  assert.throws(() => applyAction(world, a.householdId, { action: 'send-for', entityId: a.personId }), /Bowie and Fannin's division/);
  untilMinute(world, from(world, 'ringed') + 10);
  const jump = resolveTimeJump(world, 600);
  assert.equal(jump.advancedMinutes, 0); assert.equal(jump.blockedBy, 'battle:concepcion');
  untilMinute(world, from(world, 'burial'));
  assert.ok(withTheArmy(world, a.personId) && world.entities[a.personId].travel?.purpose === 'march', 'he did not rejoin the ranks');
  applyAction(world, a.householdId, { action: 'send-for', entityId: a.personId });
  assert.equal(withTheArmy(world, a.personId), false, 'he could not be sent for once back with the army');
});

test('a family\'s person\'s fate falls at a discharge of the gun, visible to those watching and never before: crossing the open, down, carried under the bank', () => {
  for (const fate of ['killed', 'wounded']) {
    const { world, a } = divisionClass();
    withFate(world, a.personId, fate);
    const person = world.entities[a.personId];
    untilMinute(world, from(world, 'charges'));
    const shots = battleState(world, 'concepcion').phase.cannon.map(at => from(world, 'charges') + at);
    let hitAt = null, crossing = false;
    while (phaseOf(world) === 'charges' || phaseOf(world) === 'retreat') {
      const host = view(world, undefined, 'host'), own = view(world, a.householdId);
      const sent = [...(host.battle.memberFates || []), ...(own.battle?.memberFates || [])];
      for (const one of sent) assert.ok(one.minute <= world.minute, `a fate at ${one.minute} was sent at ${world.minute}`);
      if (world.battles.concepcion.participants[a.personId].at === 'coleman') crossing = true;
      if (hitAt === null) {
        if (world.battles.concepcion.fates[a.personId]) {
          hitAt = world.battles.concepcion.fates[a.personId].minute;
          assert.ok(sent.some(one => one.id === a.personId && one.fate === fate), 'the fate was not sent once it fell');
        } else {
          assert.equal(person.health.condition, 'well', `${fate}: the fate fell before its moment`);
          assert.ok(!sent.some(one => one.id === a.personId), 'a fate was sent before it fell');
        }
      }
      stepWorld(world);
    }
    assert.ok(shots.includes(hitAt), `${fate}: fell at ${hitAt}, not at one of the gun's discharges ${shots}`);
    assert.ok(crossing, `${fate}: he was never drawn crossing the open with Coleman's men`);
    assert.equal(person.health.condition, fate === 'killed' ? 'dead' : 'minor-injury');
    assert.equal(world.participation.concepcion[a.personId].role, 'fought');
    // Carried back under the bank once the gun is taken.
    assert.ok(world.battles.concepcion.fates[a.personId].carried, `${fate}: never carried back`);
    assert.ok(miles(person.location, CONCEPCION.ground(world).fannin) < 0.1, `${fate}: not under the bank after the retreat`);
    // A reload never re-rolls it.
    const saved = copy(world);
    assert.deepEqual(saved.battles.concepcion.fates, world.battles.concepcion.fates);
    assert.equal(concepcionFate(saved, a.personId), fate);
    untilMinute(world, from(world, 'burial'));
    const journal = world.events.filter(event => event.householdId === a.householdId).map(event => event.text).join('\n');
    assert.match(journal, fate === 'killed' ? /killed crossing the open ground/ : /hit by a ball, and will be some days mending/);
    assert.equal(withTheArmy(world, a.personId), fate !== 'killed', `${fate}: wrong place in the army afterwards`);
    validateWorld(world);
  }
});

test('the Host, the families with somebody there, and the main army\'s from when the firing is heard are sent the fight; a family with nobody there gets nothing', () => {
  const { world, a, b } = divisionClass();
  const nobody = nobodyThere(world);
  assert.ok(nobody, 'no family with nobody in the army');
  const names = [a.personId, b.personId];
  let sampled = 0, alertedBefore = false;
  untilMinute(world, momentOf(world, 'detachment-out'));
  while (!battleState(world, 'concepcion').over) {
    const state = battleState(world, 'concepcion');
    const host = view(world, undefined, 'host');
    assert.ok(host.battle?.id === 'concepcion', `the Host was not sent the fight at ${world.minute}`);
    const fighting = ['alarm', 'ringed', 'fog-lifts', 'charges', 'retreat'].includes(state.phase.id);
    assert.equal(host.host.focus, fighting ? 'battle' : 'regional', `the Host's camera at ${state.phase.id}`);
    const own = view(world, a.householdId);
    if (!['burial'].includes(state.phase.id)) assert.ok(own.battle?.members.includes(a.personId), `the family with a man in the division was not sent it at ${state.phase.id}`);
    if (own.battleAlert && world.minute < from(world, 'alarm')) { alertedBefore = true; assert.match(own.battleAlert.text, new RegExp(`^At ${world.entities[a.personId].name}'s side`)); }
    const army = view(world, b.householdId);
    if (world.minute < from(world, 'fog-lifts')) assert.equal(army.battle, null, `the main army's family was sent it before the firing could be heard, at ${state.phase.id}`);
    else if (state.phase.id !== 'burial') assert.ok(army.battle && army.battle.members.length === 0, `the main army's family was not sent the firing it could hear, at ${state.phase.id}`);
    for (const pass of ['first', 'reconnect']) {
      const seen = view(world, nobody), text = JSON.stringify(seen);
      assert.equal(seen.battle, null, `the family with nobody there (${pass}) was sent the fight at ${state.phase.id}`);
      assert.ok(!seen.battleAlert && !seen.battleAccount, 'the family with nobody there was alerted or told');
      assert.ok(!/"participants"|"memberFates"|"fallen"/.test(text) && names.every(id => !text.includes(id)), `the family with nobody there was sent part of it (${pass})`);
    }
    for (const line of host.battle.lines) assert.ok(line.minute <= world.minute, 'a line was sent before it was said');
    sampled++;
    stepWorld(world);
  }
  assert.ok(alertedBefore, 'the family was not alerted through its person before the horsemen came');
  assert.ok(sampled >= 40, `only ${sampled} ticks sampled`);
});

test('afterwards the division rejoins the army at Concepción, each family is told through its own person what happened, and the country hears of it', () => {
  const { world, a, b } = divisionClass();
  const nobody = nobodyThere(world);
  untilMinute(world, from(world, 'burial'));
  assert.equal(world.army.camp, 'Mission Concepción');
  assert.ok(world.events.some(event => event.visibility === 'public' && /fight at Mission Concepción/.test(event.text)), 'the country never heard');
  for (const household of Object.values(world.households)) assert.match(world.knowledge.households[household.id]['concepcion-fight']?.text || '', /Richard Andrews/);
  const told = view(world, a.householdId).battleAccount;
  assert.ok(told, 'the division family was given no account');
  assert.equal(told.entityId, a.personId);
  const name = world.entities[a.personId].name;
  for (const part of ['What happened:', `What ${name} did:`, 'Why it ended so:', 'What comes next:']) assert.ok(told.text.includes(part), `no "${part}"`);
  assert.match(told.text, /Richard Andrews/); assert.match(told.text, /do not agree/); assert.match(told.text, /send for/);
  const army = view(world, b.householdId).battleAccount;
  assert.match(army?.text || '', /came up the river an hour after the fight was over/);
  assert.equal(view(world, nobody).battleAccount, undefined, 'a family with nobody there was given an account');
  assert.ok(world.events.some(event => event.householdId === a.householdId && event.text === told.text), 'the journal does not keep it');
  assert.equal(world.participation.concepcion[b.personId].role, 'present');
  until(world, () => !view(world, a.householdId).battleAccount, 400);
  assert.equal(view(world, a.householdId).battleAccount, undefined, 'the card never went');
  validateWorld(world);
});

test('the fighting plays three to six real minutes at the Study pace, held to each phase\'s step, landing on every phase\'s start, and the night in camp is not watched', () => {
  const { world } = divisionClass();
  untilMinute(world, momentOf(world, 'detachment-out'));
  const visited = new Set();
  let fighting = 0, all = 0;
  while (!battleState(world, 'concepcion').over) {
    const state = battleState(world, 'concepcion');
    if (world.minute === state.phase.from) visited.add(state.phase.id);
    const step = calendarMinutes(world);
    if (state.phase.step) assert.ok(step <= state.phase.step, `${state.phase.id} ran at ${step} minutes a tick`);
    if (state.fighting) fighting++;
    all++;
    stepWorld(world);
  }
  assert.deepEqual([...visited].sort(), CONCEPCION.phases.map(phase => phase.id).sort(), 'the clock did not land on every phase\'s start');
  const study = fighting * PACES.study / 1000;
  assert.ok(study >= 180 && study <= 360, `the fighting took ${fighting} ticks, ${study} real seconds at Study`);
  assert.ok(all <= 60, `the whole engagement took ${all} ticks`);
});

test('a class saved in the fight reopens in it with the same fates, and a class that fought Concepción before the engine keeps what it had', () => {
  const { world, a } = divisionClass();
  withFate(world, a.personId, 'killed');
  untilMinute(world, from(world, 'charges') + 12);
  const saved = copy(world);
  validateWorld(saved);
  assert.deepEqual(projectBattle(saved, 'concepcion', {}), projectBattle(world, 'concepcion', {}));
  stepWorld(world); stepWorld(saved);
  assert.deepEqual(saved.battles.concepcion, world.battles.concepcion);
  // Before the engine: the old roll at eight had been made (the milestone set) and there is no record. Nothing is re-fought.
  const old = armyClass('concepcion-engine').world;
  untilMinute(old, momentOf(old, 'concepcion') + 1);
  delete old.battles.concepcion; old.director.milestones.concepcion = true;
  for (let i = 0; i < 5; i++) stepWorld(old);
  assert.equal(old.battles.concepcion, undefined, 'a class that fought it before was given the fight again');
  // And a class saved before the engine at all, before the march: the next tick gives it the record, with nobody in it yet.
  const early = armyClass('concepcion-engine').world;
  delete early.battles;
  stepWorld(early);
  assert.deepEqual(early.battles.concepcion.participants, {});
  assert.equal(copy(early).saveVersion, copy(world).saveVersion);
});

test('a volunteer who turns out after the army has marched follows it and falls in, the coast\'s volunteers march on from Victoria, and the card says when he would catch it', () => {
  const { world, idle } = armyClass('concepcion-follow', { modes: ['horse'], to: 'leave-cibolo' });
  const householdId = idle[0];
  assert.ok(householdId, 'no family left unanswered');
  const request = view(world, householdId).request;
  const [entityId, options] = Object.entries(request.answerers).find(([, one]) => one.find(option => option.id === 'turn-out')?.can);
  const note = options.find(option => option.id === 'turn-out').note;
  assert.match(note, /The army has already marched/); assert.match(note, /would catch it about the \d+(st|nd|rd|th) of October/);
  applyAction(world, householdId, { action: 'turn-out', entityId, mode: 'horse' });
  assert.ok(until(world, () => withTheArmy(world, entityId), 400), 'the late volunteer never caught the army');
  assert.ok(world.minute < momentOf(world, 'detachment-out'), 'he caught it too late for the division');
  assert.ok(world.events.some(event => event.actorId === entityId && /set out after the army/.test(event.text)));
  // The coast gathers at Victoria and marches on to the army.
  const coast = armyClass('concepcion-coast', { modes: ['horse'], to: 'leave-cibolo', settlements: ['matagorda', 'columbia'] });
  const [sent] = coast.sent;
  assert.ok(sent, 'no coast family sent anybody');
  assert.ok(until(coast.world, () => withTheArmy(coast.world, sent.personId), 600), 'the coast volunteer never reached the army');
  validateWorld(coast.world);
  // Too late: a card offered on the eve of the fight says so.
  const eve = armyClass('concepcion-follow', { modes: ['horse'], to: 'to-espada' });
  const late = Object.values(view(eve.world, eve.idle.at(-1)).request?.answerers || {})[0]?.find(option => option.id === 'turn-out')?.note || '';
  assert.match(late, /too late for anything the army does before the end of the month/);
});
