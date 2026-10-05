// A volunteer away at the war (owner, 2026-10-05; docs/MILITARY_EXPERIENCE.md, "Away at the war").
//
// "When my character reached Gonzales I never received a notification that he was participating in battle. I went to check
// on him and he was just standing around in town doing nothing ... They should have food on them, not be pulling from the
// home supply."
//
// Phase 1: a far family's volunteer standing in Gonzales when the men go up the river goes with them, is alerted through
// himself with a Watch, stands in the line and is given the account; one who rides in after it is told it by the men in the
// town; and nobody away at the war is counted in what the family at home eats.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, projectWorld, stepWorld, validateWorld } from '../sim/world.mjs';
import { momentOf } from '../sim/directors.mjs';
import { dailyDraw } from '../sim/hunger.mjs';
import { eatenADay } from '../sim/family.mjs';
import { awayWithTheArmy } from '../sim/acting.mjs';

const view = (world, householdId) => projectWorld(world, householdId, 'student', { includeMap: false });
const letRidersGo = world => {
  for (const one of Object.values(world.encounters || {})) {
    if (one.status !== 'open' || one.kind) continue;
    try { applyAction(world, one.householdId, { action: 'leave-rider', entityId: one.listenerId }); } catch { /* gone */ }
  }
};

/**
 * One real-map class: every far family's principal turns out the moment its call is put. In this class the families of Mina
 * reach Gonzales before the men go up the river on the night of October 1 and those of San Felipe after the fight. Snapshots of
 * what each family is sent are kept as it runs, so every test reads the same class.
 */
let played = null;
function warClass() {
  if (played) return played;
  const world = createGonzalesWorld('probe-calls', 15, { map: 'colonies' });
  world.status = 'running';
  const sent = {}, alerts = {}, accounts = {}, draws = {};
  while (world.minute < momentOf(world, 'resolved') + 600) {
    stepWorld(world);
    letRidersGo(world);
    for (const [householdId, call] of Object.entries(world.calls || {})) {
      if (call.status !== 'open' || sent[householdId]) continue;
      const household = world.households[householdId];
      try { applyAction(world, householdId, { action: 'turn-out', entityId: household.principalId }); sent[householdId] = household.principalId; } catch { sent[householdId] = null; }
    }
    for (const householdId of Object.keys(sent)) {
      const seen = view(world, householdId);
      if (seen.battleAlert && !alerts[householdId]) alerts[householdId] = { ...seen.battleAlert, minute: world.minute };
      if (seen.battleAccount && !accounts[householdId]) accounts[householdId] = { ...seen.battleAccount, minute: world.minute };
      // What the family is said to eat a day while its man is away at the war, against everybody else of it.
      const household = world.households[householdId], person = world.entities[sent[householdId] || ''];
      if (person && awayWithTheArmy(world, person) && draws[householdId] === undefined) {
        const home = household.members.map(id => world.entities[id]).filter(one => one.id !== person.id && one.health.condition !== 'dead');
        draws[householdId] = { eat: dailyDraw(world, household).eat, without: eatenADay(world, home) };
      }
    }
  }
  validateWorld(world);
  return (played = { world, sent, alerts, accounts, draws });
}
const settlementOf = (world, householdId) => world.households[householdId].settlementId;

test('a far volunteer in Gonzales when the men go up the river goes with them, is alerted, fights and is given the account', () => {
  const { world, sent, alerts, accounts } = warClass();
  const early = Object.keys(sent).filter(id => settlementOf(world, id) === 'mina' && sent[id]);
  assert.ok(early.length >= 1, 'no family of Mina turned out');
  for (const householdId of early) {
    const id = sent[householdId], person = world.entities[id];
    const march = world.marches[householdId];
    assert.ok(march?.enrolled && march.status === 'accepted' && march.actorIds.includes(id), `${person.name} was not taken up the river`);
    // The alert came through him before contact, with the field to watch.
    const alert = alerts[householdId];
    assert.ok(alert && alert.entityId === id && alert.field, `${person.name}'s family was never alerted`);
    assert.ok(alert.minute < momentOf(world, 'approach'), 'the alert came after the fighting began');
    // In the line while it fired, and the part written down from it.
    const entry = world.battles.gonzales.participants[id];
    assert.ok(Number.isFinite(entry?.fought), `${person.name} was not in the line`);
    assert.equal(world.participation.gonzales[id]?.role, 'fought');
    // The account afterwards, through him, saying he goes back to the volunteers' camp.
    assert.ok(accounts[householdId]?.entityId === id, `${person.name}'s family was never told what he saw`);
    assert.match(accounts[householdId].text, /volunteers' camp/);
    // Back in Gonzales, still away at the war.
    assert.equal(person.location.siteId, 'gonzales');
    assert.ok(awayWithTheArmy(world, person), `${person.name} came back from the fight as if home`);
  }
});

test('a far volunteer who rides into Gonzales after the fight is told it there, and the family knows how it ended', () => {
  const { world, sent, accounts } = warClass();
  const late = Object.keys(sent).filter(id => settlementOf(world, id) === 'san-felipe' && sent[id] && world.calls[id].arrived?.[sent[id]] >= momentOf(world, 'resolved'));
  assert.ok(late.length >= 1, 'nobody from San Felipe came after the fight');
  for (const householdId of late) {
    const person = world.entities[sent[householdId]];
    assert.equal(world.battles.gonzales.participants[person.id], undefined);
    const account = accounts[householdId];
    assert.ok(account, `${person.name}'s family was never told`);
    assert.equal(account.title, `What ${person.name} heard in Gonzales`);
    assert.match(account.text, /too late to be in it/);
    assert.ok(world.knowledge.households[householdId]['gonzales-outcome'], 'the family never learned how it ended');
  }
});

test('nobody away at the war is counted in what the family at home eats', () => {
  const { draws } = warClass();
  const measured = Object.values(draws);
  assert.ok(measured.length >= 3);
  for (const { eat, without } of measured) assert.ok(eat <= without + 1e-9, `the family's day counted the man at the war: ${eat} against ${without}`);
});
