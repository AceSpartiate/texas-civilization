import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { findPath } from '../sim/geography.mjs';
import { applyAction, stepWorld, projectWorld, validateWorld } from '../sim/world.mjs';
import { TIMELINE, HISTORICAL_OUTCOME } from '../sim/directors.mjs';
import { runScenario } from '../sim/headless.mjs';
import { resolveTimeJump } from '../sim/time.mjs';
import { readSave, writeSave } from '../server/storage.mjs';
const advance = (world, minute) => { while (world.minute < minute && world.status === 'running') stepWorld(world); };
// The word leaves Gonzales at the notice and reaches each family down its own road, so a
// test that needs a family to have been asked waits for it to have heard.
const toldBy = (world, householdId) => { while (!world.knowledge.households[householdId]['cannon-request']) stepWorld(world); };
function ancestry(world, eventId, visited = new Set()) {
  if (visited.has(eventId)) return visited;
  visited.add(eventId);
  for (const id of world.events.find(e => e.id === eventId).causes) ancestry(world, id, visited);
  return visited;
}

test('Gate D: one autonomous causal chain, physical identity, date/outcome and preserved personal consequence', () => {
  const { world, metrics } = runScenario({ seed: 'causal-loop', playerCount: 5, strategy: 'mixed' });
  assert.equal(metrics.complete, true); assert.equal(world.status, 'ended');
  assert.equal(world.truth['gonzales-outcome'].text, HISTORICAL_OUTCOME);
  const person = world.entities['hh-1-thomas'];
  assert.equal(person.location.siteId, 'gonzales', 'never teleported home');
  assert.equal(world.households['hh-1'].relationships.neighbor, 1);
  const memory = world.events.find(e => e.type === 'memory' && e.householdId === 'hh-1');
  const chain = [...ancestry(world, memory.id)].map(id => world.events.find(e => e.id === id).type);
  for (const type of ['world-event', 'information', 'pressure', 'choice', 'departure', 'travel', 'arrival', 'battle-phase', 'consequence', 'memory']) assert.ok(chain.includes(type), `missing causal ancestor ${type}`);
  const approach = world.events.find(e => e.type === 'battle-phase' && e.phase === 'approach');
  assert.equal(approach.minute, TIMELINE.approach);
  assert.equal(new Date(Date.UTC(1835, 8, 29) + approach.minute * 60000).toISOString().slice(0, 10), '1835-10-02');
  assert.match(approach.text, /Texian militia advances/);
  const dir = mkdtempSync(join(tmpdir(), 'texas-consequence-'));
  try {
    writeSave(join(dir, 'save.json'), { saveVersion: 3, world });
    assert.deepEqual(readSave(join(dir, 'save.json')).world, world);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
test('Gate D: refusal and inactivity preserve macro-history without repeated coercion or forced travel', () => {
  for (const strategy of ['stay', 'idle']) {
    const { world, metrics } = runScenario({ playerCount: 30, strategy });
    assert.equal(metrics.historicalOutcome, HISTORICAL_OUTCOME);
    assert.ok(metrics.households.every(h => h.repeatedRequestCount === 0));
    for (const household of Object.values(world.households)) {
      assert.equal(world.entities[household.principalId].location.siteId, household.homeSiteId);
      assert.equal(world.households[household.id].relationships.neighbor, 0, 'no relationship penalty for refusal');
      assert.ok(world.events.filter(e => e.type === 'pressure' && e.householdId === household.id).length <= 1);
      if (strategy === 'stay') { assert.equal(household.prepared, true); assert.equal(household.memories.length, 1); }
    }
  }
});
test('Gate D: requests require household knowledge; historical truth and battle stay out of remote and public projections', () => {
  const world = createGonzalesWorld('fog', 5); world.status = 'running';
  assert.throws(() => applyAction(world, 'hh-1', { action: 'help', entityId: 'hh-1-thomas' }), /known open request/);
  advance(world, TIMELINE.notice);
  assert.equal(projectWorld(world, 'hh-1', 'student').request, null, 'the thing has happened and nobody has told this family yet');
  toldBy(world, 'hh-1');
  assert.ok(projectWorld(world, 'hh-1', 'student').request);
  const unaware = Object.keys(world.households).find(id => !world.knowledge.households[id]['cannon-request']);
  assert.ok(unaware, 'the class still has a family the word has not reached');
  assert.equal(projectWorld(world, unaware, 'student').request, null);
  applyAction(world, 'hh-1', { action: 'help', entityId: 'hh-1-thomas' });
  advance(world, TIMELINE.exchange);
  assert.equal(projectWorld(world, 'hh-1', 'student').battle.phase, 'exchange');
  assert.equal(projectWorld(world, 'hh-2', 'student').battle, null);
  assert.equal(projectWorld(world, undefined, 'host').battle, null);
  assert.equal(projectWorld(world, 'hh-1', 'student').historicalDate, '1835-10-02');
  advance(world, TIMELINE.resolved);
  assert.ok(!JSON.stringify(projectWorld(world, undefined, 'host')).includes('gonzales-outcome'));
  advance(world, TIMELINE.publicOutcome);
  const host = projectWorld(world, undefined, 'host');
  assert.equal(host.battle.reconstruction, true);
  assert.equal(host.host.focus, 'reconstruction');
  assert.equal(host.battle.phase, 'approach', 'public reconstruction uses saved earlier frame, not live omniscience');
});
test('Gate D: deterministic bot inputs, frozen pause, and timeline barriers preserve live important scenes', () => {
  assert.deepEqual(runScenario({ seed: 'repeat', strategy: 'mixed' }), runScenario({ seed: 'repeat', strategy: 'mixed' }));
  const world = createGonzalesWorld('compression', 5); world.status = 'running';
  assert.equal(resolveTimeJump(world, 10000).blockedBy, 'gonzales:notice');
  assert.equal(world.truth['cannon-request'], undefined);
  stepWorld(world);
  assert.ok(world.truth['cannon-request']);
  advance(world, TIMELINE.exchange); world.status = 'paused';
  const frozen = structuredClone(world);
  for (let i = 0; i < 20; i++) stepWorld(world);
  assert.deepEqual(world, frozen);
  world.status = 'running'; stepWorld(world); validateWorld(world);
});
test('Gate D: duplicate response is rejected; coming home requires a real return journey', () => {
  const world = createGonzalesWorld('return', 5); world.status = 'running';
  advance(world, TIMELINE.notice); toldBy(world, 'hh-1');
  applyAction(world, 'hh-1', { action: 'help', entityId: 'hh-1-thomas' });
  assert.throws(() => applyAction(world, 'hh-1', { action: 'help', entityId: 'hh-1-thomas' }), /open request/);
  advance(world, TIMELINE.resolved);
  const id = 'hh-1-thomas', oldId = world.entities[id].id;
  applyAction(world, 'hh-1', { action: 'travel', entityId: id, destination: 'home-1' });
  assert.equal(world.entities[id].location.siteId, null);
  const home = findPath(world.map, 'gonzales', 'home-1');
  advance(world, TIMELINE.resolved + Math.ceil(home.distance) * 20 + 200);
  assert.equal(world.entities[id].id, oldId); assert.equal(world.entities[id].location.siteId, 'home-1');
  assert.equal(world.households['hh-1'].memories.length, 1);
});
test('Gate D: later consequences never revive or erase an injured/captured principal', () => {
  for (const condition of ['dead', 'captured', 'severe-injury', 'minor-injury']) {
    const world = createGonzalesWorld('condition', 5); world.status = 'running';
    advance(world, TIMELINE.notice); toldBy(world, 'hh-1');
    applyAction(world, 'hh-1', { action: 'help', entityId: 'hh-1-thomas' });
    advance(world, 1500);
    world.entities['hh-1-thomas'].health = { condition };
    advance(world, TIMELINE.resolved);
    assert.equal(world.entities['hh-1-thomas'].health.condition, condition);
    assert.ok(world.requests['hh-1'].consequenceId);
  }
});
