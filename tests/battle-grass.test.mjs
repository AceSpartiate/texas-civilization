// The Grass Fight on the engine (sim/battles/grass-fight.mjs, sim/concepcion-grass.mjs; docs/battle-research/staging.md §2).
//
// What it holds: Deaf Smith rides in at ten and the fight follows between about eleven and half past twelve (Grass G1 (a));
// a yes to the question is a departure - with Bowie's horsemen for a man whose horse is with him, with Jack's infantry for a
// man on foot - and the question shuts when they ride out, not six hours later; a man out with them is in the line at contact
// and held there until they are back in camp; his fate (hurt, or running) falls at its moment - a rider at Bowie's first
// exchange, a man with Jack at the ditch's first volley - and never before; the camp's families hear the firing; nobody else
// is sent anything; the fighting plays three to six real minutes at Study; and when the fuller word rides home the family
// is told in plain words through its person.
import test from 'node:test';
import assert from 'node:assert/strict';
import { applyAction, stepWorld, validateWorld } from '../sim/world.mjs';
import { TIMELINE, dateOf } from '../sim/directors.mjs';
import { ENGAGEMENTS, battleState, checkEngagement, schedule } from '../sim/battle-stage.mjs';
import { GRASS_FIGHT, GRASS_MILL } from '../sim/battles/grass-fight.mjs';
import { SIEGE_CAMPS, grassFate, withTheArmy } from '../sim/army.mjs';
import { PACES } from '../server/app.mjs';
import { armyClass, momentOf, nobodyThere, until, untilMinute, view } from './support/campaign.mjs';

const phaseOf = world => battleState(world, 'grass-fight')?.phase?.id;
const from = (world, id) => battleState(world, 'grass-fight').phases.find(phase => phase.id === id).from;
const hour = (world, minute) => { const date = dateOf(world, minute); return `${date.getUTCMonth() + 1}/${date.getUTCDate()} ${date.getUTCHours()}:${String(date.getUTCMinutes()).padStart(2, '0')}`; };

/** The class at the alarm: two riders and a man on foot in the camp at the mill, each of them still asked. */
function alarmClass(seed = 'grass-engine') {
  const base = armyClass(seed, { modes: ['horse', 'foot', 'horse'], to: 'grass-alarm' });
  // Played past the pledge (which a volunteer might have been decided out of): only those still in the ranks.
  base.sent = base.sent.filter(one => withTheArmy(base.world, one.personId) && base.world.army.questions?.grass?.asks?.[one.personId] === 'open');
  return base;
}
function withFate(world, person, fate) {
  for (let n = 0; n < 20000; n++) { world.seed = `grass-fate-${fate}-${n}`; if (grassFate(world, person) === fate) return world; }
  throw new Error(`no seed gave ${fate}`);
}

test('the Grass Fight is on the engine: the alarm at ten, Bowie\'s charge at eleven, the ditch, the sortie and the grass by half past twelve', () => {
  assert.equal(ENGAGEMENTS['grass-fight'], GRASS_FIGHT);
  checkEngagement(GRASS_FIGHT);
  const phases = schedule(GRASS_FIGHT, TIMELINE['grass-alarm']);
  const at = id => phases.find(phase => phase.id === id).from;
  assert.equal(TIMELINE['grass-fight'], at('bowie'), 'the director\'s `grass-fight` is not Bowie\'s charge');
  const { world } = alarmClass();
  assert.equal(hour(world, at('alarm')), '11/26 10:00');
  assert.equal(hour(world, at('ride-out')), '11/26 10:30');
  assert.equal(hour(world, at('bowie')), '11/26 11:00');
  assert.equal(hour(world, at('ambush')), '11/26 11:20');
  assert.equal(hour(world, at('grass')), '11/26 12:05');
  assert.deepEqual({ ...GRASS_MILL }, { dx: SIEGE_CAMPS.mill.dx, dy: SIEGE_CAMPS.mill.dy });
  // Neither side "in rows" for most of it: the guard in a creek bed, Jack's infantry in double file until the ditch fires.
  const bowie = GRASS_FIGHT.phases.find(phase => phase.id === 'bowie');
  assert.equal(bowie.mexican.style, 'bank');
  assert.equal(GRASS_FIGHT.phases.find(phase => phase.id === 'ride-out').groups.find(group => group.id === 'jack').style, 'column');
  assert.ok(GRASS_FIGHT.noFalling.length === 0 && GRASS_FIGHT.phases.flatMap(phase => phase.falls || []).filter(fall => fall.side === 'texian').every(fall => fall.wounded), 'a Texian is drawn lying still');
  const ugartechea = GRASS_FIGHT.phases[0].lines.find(line => line.text === 'Ugartechea!');
  assert.equal(ugartechea.kind, 'documented'); assert.equal(ugartechea.name, undefined);
});

test('a yes is a departure: a rider goes with Bowie\'s horsemen and a man on foot with Jack\'s infantry, and the question shuts when they ride out', () => {
  const { world, sent } = alarmClass();
  const rider = sent.find(one => one.mode === 'horse'), walker = sent.find(one => one.mode === 'foot'), silent = sent.find(one => one !== rider && one !== walker);
  assert.ok(rider && walker, `the class has nobody to send: ${JSON.stringify(sent)}`);
  assert.match(view(world, rider.householdId).army.ours.find(one => one.id === rider.personId).questions.find(one => one.key === 'grass').ask, /Bowie is taking the horsemen and Jack the men on foot/);
  applyAction(world, rider.householdId, { action: 'army-answer', entityId: rider.personId, question: 'grass', answer: 'yes' });
  applyAction(world, walker.householdId, { action: 'army-answer', entityId: walker.personId, question: 'grass', answer: 'yes' });
  stepWorld(world);
  const battle = world.battles['grass-fight'];
  assert.equal(battle.participants[rider.personId]?.group, 'texian', 'the rider is not with Bowie');
  assert.equal(battle.participants[walker.personId]?.group, 'jack', 'the man on foot is not with Jack');
  assert.equal(world.entities[walker.personId].travel, null, 'he never left the ranks');
  untilMinute(world, from(world, 'ride-out'));
  assert.equal(world.army.questions.grass.closed, true, 'the question did not shut when they rode out');
  if (silent) {
    const decided = world.army.questions.grass.asks[silent.personId];
    assert.ok(['yes', 'no'].includes(decided));
    assert.equal(Boolean(battle.participants[silent.personId]), decided === 'yes', 'an auto yes did not ride out, or a no did');
  }
  // Out in the line at contact, and held there.
  untilMinute(world, from(world, 'bowie') + 6);
  const bowie = battleState(world, 'grass-fight').phases.find(phase => phase.id === 'bowie');
  const ground = GRASS_FIGHT.ground(world);
  assert.ok(Math.hypot(world.entities[rider.personId].location.x - ground.bowieLine.x, world.entities[rider.personId].location.y - ground.bowieLine.y) < 0.25, 'the rider is not with Bowie at the creek bed');
  assert.ok(bowie && Number.isFinite(battle.participants[rider.personId].fought), 'the rider was not in the line while it fired');
  assert.throws(() => applyAction(world, walker.householdId, { action: 'send-for', entityId: walker.personId }), /after the pack train/);
  until(world, () => battleState(world, 'grass-fight').over);
  assert.ok([rider, walker].every(one => world.entities[one.personId].health.condition === 'dead' || withTheArmy(world, one.personId) || world.entities[one.personId].travel?.purpose === 'home'), 'somebody was left on the field');
  validateWorld(world);
});

test('a fate falls at its moment and never before: a man with Jack hurt at the ditch\'s first volley, a rider who runs at Bowie\'s first exchange, on the road home', () => {
  for (const [who, fate, phase, offset] of [['foot', 'wounded', 'ambush', 2], ['horse', 'ran', 'bowie', 6]]) {
    const { world, sent } = alarmClass();
    const one = sent.find(each => each.mode === who);
    const person = world.entities[one.personId];
    withFate(world, person, fate);
    applyAction(world, one.householdId, { action: 'army-answer', entityId: one.personId, question: 'grass', answer: 'yes' });
    const at = from(world, phase) + offset;
    while (world.minute < at) {
      const host = view(world, undefined, 'host');
      assert.ok(!host.battle?.memberFates?.[one.personId], `${fate}: sent before it fell`);
      assert.notEqual(person.health.condition, 'minor-injury', `${fate}: fell before its moment`);
      assert.ok(!person.travel || person.travel.purpose !== 'home', `${fate}: ran before its moment`);
      stepWorld(world);
    }
    const battle = world.battles['grass-fight'];
    assert.ok(battle.fates[one.personId]?.applied && battle.fates[one.personId].fate === fate, `${fate}: did not fall at ${phase}`);
    assert.equal(battle.fates[one.personId].minute, at);
    assert.equal(view(world, undefined, 'host').battle.memberFates?.[one.personId]?.fate, fate, `${fate}: not shown once it fell`);
    if (fate === 'ran') {
      assert.equal(person.travel?.purpose, 'home', 'he ran and is not on the road home');
      assert.equal(withTheArmy(world, one.personId), false);
      assert.equal(world.participation['grass-fight'][one.personId].role, 'ran');
    } else {
      assert.equal(person.health.condition, 'minor-injury');
      until(world, () => battleState(world, 'grass-fight').over);
      assert.ok(withTheArmy(world, one.personId), 'the hurt man did not come back to the camp');
    }
  }
});

test('the Host and the family with somebody out watch it; the camp\'s families from when the firing starts; a family with nobody there gets nothing', () => {
  const { world, sent } = alarmClass();
  const [out, camp] = sent;
  // The family with a man out is played, as a joined family is: its lead-up and aftermath are held for it (docs/BATTLES.md §2b.11).
  world.households[out.householdId].played = true;
  applyAction(world, out.householdId, { action: 'army-answer', entityId: out.personId, question: 'grass', answer: 'yes' });
  applyAction(world, camp.householdId, { action: 'army-answer', entityId: camp.personId, question: 'grass', answer: 'no' });
  const nobody = nobodyThere(world);
  let sampled = 0, alerted = false;
  while (!battleState(world, 'grass-fight').over) {
    const state = battleState(world, 'grass-fight');
    const host = view(world, undefined, 'host');
    assert.equal(host.battle?.id, 'grass-fight');
    assert.equal(host.host.focus, ['bowie', 'ambush', 'sortie', 'follow'].includes(state.phase.id) ? 'battle' : 'regional');
    const own = view(world, out.householdId);
    if (world.battles['grass-fight'].participants[out.personId] && !world.battles['grass-fight'].participants[out.personId].released) assert.ok(own.battle?.members.includes(out.personId), `the family with a man out was not sent it at ${state.phase.id}`);
    if (own.battleAlert && world.minute < from(world, 'bowie')) { alerted = true; assert.match(own.battleAlert.text, /side/); }
    const inCamp = view(world, camp.householdId);
    if (world.minute < from(world, 'bowie')) assert.equal(inCamp.battle, null, `the camp was sent it before any firing, at ${state.phase.id}`);
    else assert.ok(inCamp.battle, `the camp was not sent the firing it could hear, at ${state.phase.id}`);
    const seen = view(world, nobody);
    assert.equal(seen.battle, null); assert.ok(!seen.battleAlert && !seen.battleAccount);
    assert.ok(!JSON.stringify(seen).includes(out.personId), 'the family with nobody there was sent the name of a man out');
    sampled++;
    stepWorld(world);
  }
  assert.ok(alerted, 'the family was never alerted through its person before the firing');
  assert.ok(sampled >= 25, `only ${sampled} ticks sampled`);
});

test('the fighting plays three to six real minutes at Study, held to each phase\'s step and landing on every phase\'s start', () => {
  const { world } = alarmClass();
  const visited = new Set();
  let fighting = 0;
  while (!battleState(world, 'grass-fight').over) {
    const state = battleState(world, 'grass-fight');
    if (world.minute === state.phase.from) visited.add(state.phase.id);
    if (state.fighting) fighting++;
    stepWorld(world);
  }
  // The class is copied a tick into the alarm, so its own start is behind it.
  assert.deepEqual([...visited].sort(), GRASS_FIGHT.phases.map(phase => phase.id).filter(id => id !== 'alarm').sort());
  const study = fighting * PACES.study / 1000;
  assert.ok(study >= 180 && study <= 360, `the fighting took ${fighting} ticks, ${study} real seconds at Study`);
});

test('back in camp the army keeps the record, and when the fuller word rides home each family is told in plain words through its person', () => {
  const { world, sent } = alarmClass();
  const [out, camp] = sent;
  applyAction(world, out.householdId, { action: 'army-answer', entityId: out.personId, question: 'grass', answer: 'yes' });
  applyAction(world, camp.householdId, { action: 'army-answer', entityId: camp.personId, question: 'grass', answer: 'no' });
  until(world, () => battleState(world, 'grass-fight').over);
  assert.ok(world.army.grass?.outcomes.some(one => one.id === out.personId), 'the army kept no record of him');
  assert.equal(view(world, out.householdId).battleAccount, undefined, 'the family was told before the word rode home');
  untilMinute(world, momentOf(world, 'grass-news') + 1);
  const told = view(world, out.householdId).battleAccount;
  const name = world.entities[out.personId].name;
  for (const part of ['What happened:', `What ${name} did:`, 'Why it ended so:']) assert.ok(told?.text.includes(part), `no "${part}"`);
  assert.match(told.text, /grass/); assert.match(told.text, /No one on our side was killed/); assert.match(told.text, /Bowie|Jack/);
  assert.match(view(world, camp.householdId).battleAccount?.text || '', /stayed in the camp at the mill/);
  assert.ok(world.events.some(event => event.householdId === out.householdId && event.text === told.text), 'the journal does not keep it');
  validateWorld(world);
});
