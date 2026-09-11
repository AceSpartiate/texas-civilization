import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createWorld, applyAction, stepWorld, projectWorld, validateWorld } from '../sim/world.mjs';
import { readSave, writeSave } from '../server/storage.mjs';

test('Gate B: same ID travels local → regional → local and save/reload preserves entity, animal, property', () => {
  let world = createWorld('continuity', 5); world.status = 'running';
  const id = 'hh-1-thomas';
  assert.equal(world.entities[id].location.siteId, 'home-1');
  const property = structuredClone(world.entities['hh-1-wagon']);
  const animal = structuredClone(world.entities['hh-1-animal']);
  applyAction(world, 'hh-1', { action: 'travel', entityId: id, destination: 'gonzales' });
  for (let i = 0; i < 3; i++) stepWorld(world);
  assert.equal(world.entities[id].location.siteId, null);
  const home = world.map.sites['home-1'];
  assert.ok(Math.hypot(world.entities[id].location.x - home.x, world.entities[id].location.y - home.y) > 0.5, 'traveller has actually left home');
  const dir = mkdtempSync(join(tmpdir(), 'texas-world-'));
  try {
    writeSave(join(dir, 'save.json'), { saveVersion: 3, world });
    const restored = readSave(join(dir, 'save.json')).world;
    assert.deepEqual(restored, world); world = restored;
    for (let i = 0; i < 50; i++) stepWorld(world);
    assert.equal(world.entities[id].location.siteId, 'gonzales');
    assert.equal(world.entities[id].travel, null);
    assert.equal(Object.keys(world.entities).filter(k => k === id).length, 1);
    const view = projectWorld(world, 'hh-1', 'student');
    assert.equal(view.entities.find(e => e.id === id).location.siteId, 'gonzales');
    view.entities[0].location.x = -100;
    assert.notEqual(world.entities[id].location.x, -100, 'projection must not mutate authority');
    assert.deepEqual(world.entities['hh-1-wagon'], property);
    assert.deepEqual(world.entities['hh-1-animal'], animal);
    assert.deepEqual(world.events.filter(e => e.actorId === id).map(e => e.type), ['departure', 'travel', 'arrival']);
    applyAction(world, 'hh-1', { action: 'travel', entityId: id, destination: 'home-1' });
    for (let i = 0; i < 50; i++) stepWorld(world);
    assert.equal(world.entities[id].location.siteId, 'home-1');
    validateWorld(world);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
test('Gate B: reproducible initialization, one authority and cross-household command rejection', () => {
  assert.deepEqual(createWorld('seed', 30), createWorld('seed', 30));
  assert.notDeepEqual(createWorld('seed', 5), createWorld('other', 5));
  const world = createWorld('seed', 5);
  // Another household's principal is refused because he is not yours - not because of
  // anything about his rank. Both halves of that matter, so both are asserted.
  assert.throws(() => applyAction(world, 'hh-2', { action: 'travel', entityId: 'hh-1-thomas', destination: 'gonzales' }), /your family/);
  assert.equal(world.entities['hh-1-thomas'].location.siteId, 'home-1');
  // Farm work is open to the whole family; the historical choice stays the principal's.
  assert.throws(() => applyAction(world, 'hh-1', { action: 'travel', entityId: 'hh-1-rosa', destination: 'gonzales' }), /principal/);
  applyAction(world, 'hh-1', { action: 'chore', entityId: 'hh-1-rosa', chore: 'plant-field' });
  assert.equal(world.entities['hh-1-rosa'].chore.id, 'plant-field');
  world.entities['hh-1-thomas'].id = 'imposter';
  assert.throws(() => validateWorld(world), /entity ID/);
});
