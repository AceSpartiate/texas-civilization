// Inside the house: docs/SETTLING_IN.md step 7, decided by the owner by multiple choice (2026-09-16).
//
// The interior opens once a house stands; a camping family has nowhere to set anything. Each room has marked spots, and a
// thing the family has - its furniture, and the goods and stores that came in the wagon - is set on a free one, moved, or put
// away. One thing is in one place. It changes nothing in the world and nothing is written into the family's story. The
// student is sent their own rooms; the Host every family's; no student another's.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, projectWorld, validateWorld } from '../sim/world.mjs';
import { INTERIORS, INTERIOR_ART, interiorItems, interiorOf, placeRefusal } from '../sim/interior.mjs';

const atlas = JSON.parse(readFileSync(new URL('../public/assets/frontier-v1/atlas.json', import.meta.url), 'utf8'));
/** A class where every family's cabin stands. */
const housed = () => {
  const world = createGonzalesWorld('interior', 5); world.status = 'running';
  for (const household of Object.values(world.households)) household.improvements = { ...(household.improvements || {}), cabin: 'sound' };
  return world;
};
const land = (world, id = 'hh-1') => projectWorld(world, id, 'student', { includeMap: false }).land;

test('every interior\'s spots lie on its picture and every thing that can be set out has art the library has', () => {
  for (const [kind, room] of Object.entries(INTERIORS)) {
    assert.ok(atlas.frames[room.sprite], `${kind} is drawn as ${room.sprite}, which the library does not have`);
    assert.ok(room.spots.length >= 8, `${kind} has too few places`);
    assert.equal(new Set(room.spots.map(([id]) => id)).size, room.spots.length, `${kind} names a place twice`);
    for (const [id, label, x, y] of room.spots) assert.ok(label && x > 0 && x < 1 && y > 0 && y < 1, `${kind}'s ${id} is off the picture`);
  }
  for (const [item, [sprite, height, name]] of Object.entries(INTERIOR_ART)) {
    assert.ok(atlas.frames[sprite], `${item} is drawn as ${sprite}, which the library does not have`);
    assert.ok(height > 0 && height < 0.5 && name, `${item} cannot be drawn`);
  }
});

test('a family still camping has no rooms to set anything in', () => {
  const world = housed();
  const household = world.households['hh-1'];
  household.improvements = { ...(household.improvements || {}), cabin: 'none' };
  assert.equal(interiorOf(household), null);
  assert.equal(land(world).interior.kind, null);
  assert.throws(() => applyAction(world, 'hh-1', { action: 'place-item', item: 'good:pot', spot: 'hearth' }), /still camping/);
});

test('a thing the family has is set on a free spot, moved, refused a taken spot, and put away; one thing is in one place', () => {
  const world = housed();
  const household = world.households['hh-1'];
  assert.equal(interiorOf(household), 'round-log');
  const items = land(world).interior.items;
  assert.ok(items.includes('good:pot') && items.includes('stores:provisions'), `the wagon's goods cannot be set out: ${items}`);
  assert.ok(!items.some(item => item.startsWith('tool:')), 'a tool with no interior art is offered');
  const events = world.events.length;
  applyAction(world, 'hh-1', { action: 'place-item', item: 'good:pot', spot: 'hearth' });
  assert.deepEqual(land(world).interior.placed, { hearth: 'good:pot' });
  applyAction(world, 'hh-1', { action: 'place-item', item: 'good:pot', spot: 'middle' });
  assert.deepEqual(land(world).interior.placed, { middle: 'good:pot' }, 'a moved thing is in two places, or none');
  applyAction(world, 'hh-1', { action: 'place-item', item: 'stores:provisions', spot: 'hearth' });
  assert.throws(() => applyAction(world, 'hh-1', { action: 'place-item', item: 'good:bedding', spot: 'middle' }), /Iron pot already stands there/);
  assert.throws(() => applyAction(world, 'hh-1', { action: 'place-item', item: 'good:pot', spot: 'passage' }), /no such place/);
  assert.throws(() => applyAction(world, 'hh-1', { action: 'place-item', item: 'furniture:cradle', spot: 'window' }), /no such thing/);
  applyAction(world, 'hh-1', { action: 'place-item', item: 'good:pot', spot: null });
  assert.deepEqual(land(world).interior.placed, { hearth: 'stores:provisions' }, 'putting away left it standing');
  assert.equal(world.events.length, events, 'arranging the room was written into the story');
  validateWorld(world);
  // Furniture the family makes or buys can be set out too.
  household.furniture = { table: 'made' };
  assert.ok(interiorItems(household).some(item => item.id === 'furniture:table'));
  applyAction(world, 'hh-1', { action: 'place-item', item: 'furniture:table', spot: 'window' });
  assert.equal(land(world).interior.placed.window, 'furniture:table');
});

test('a two-pen house has both pens and the passage between them', () => {
  const world = housed();
  const household = world.households['hh-1'];
  // A house raised piece by piece with two pens (sim/houseplot.mjs `plotLayout`): a dog-run or a saddlebag.
  household.house = { plan: 'saddlebag', pieces: [{ type: 'pen-round', x: 1, y: 2, stage: 9, progress: 0 }, { type: 'pen-round', x: 4, y: 2, stage: 9, progress: 0 }] };
  const kind = interiorOf(household);
  assert.equal(kind, 'dog-run');
  assert.equal(placeRefusal(world, household, 'good:pot', 'passage'), null);
  assert.match(placeRefusal(world, household, 'good:pot', 'hearth'), /no such place/);
});

test('a family is sent its own rooms, the Host every family\'s, and no student another family\'s', () => {
  const world = housed();
  applyAction(world, 'hh-2', { action: 'place-item', item: 'good:pot', spot: 'hearth' });
  const student = projectWorld(world, 'hh-1', 'student', { includeMap: false });
  assert.doesNotMatch(JSON.stringify({ ...student, land: undefined }), /"placed":\{"hearth"/, 'a student was sent another family\'s rooms');
  const host = projectWorld(world, undefined, 'host', { includeMap: false });
  assert.deepEqual(host.overview.lands['hh-2'].interior.placed, { hearth: 'good:pot' }, 'the Host was not sent a family\'s rooms');
});

test('a saved interior with a place or a thing that cannot be there, or one thing twice, is refused', () => {
  const world = housed();
  world.households['hh-1'].interior = { attic: 'good:pot' };
  assert.throws(() => validateWorld(world), /cannot be there/);
  world.households['hh-1'].interior = { hearth: 'good:pot', middle: 'good:pot' };
  assert.throws(() => validateWorld(world), /one thing in two places/);
  world.households['hh-1'].interior = { hearth: 'tool:hoe' };
  assert.throws(() => validateWorld(world), /cannot be there/);
});
