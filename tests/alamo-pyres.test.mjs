import test from 'node:test';
import assert from 'node:assert/strict';
import { projectBattle, phaseOffset, ENGAGEMENTS } from '../sim/battle-stage.mjs';

const def = ENGAGEMENTS.alamo;
const site = { x: -61.6, y: 4.6, name: 'Béxar' };
function plumesAt(into) {
  const world = { minute: phaseOffset(def, 'after') + into, map: { sites: { bexar: site } }, battles: { alamo: { id: 'alamo', start: 0, participants: {}, alerted: {}, told: {}, heard: {} } } };
  return projectBattle(world, 'alamo')?.plumes || [];
}

test('the three separated Alamo pyres are built in the afternoon and ignite near five', () => {
  assert.equal(plumesAt(479).length, 0);
  const built = plumesAt(480);
  assert.equal(built.length, 3);
  assert.ok(built.every(one => one.kind === 'alamo-pyre' && one.lit === false));
  assert.ok(built.every((one, i) => built.slice(i + 1).every(other => Math.hypot(one.x - other.x, one.y - other.y) > 0.075)), 'the piles should occupy separate sites');
  assert.ok(plumesAt(599).every(one => !one.lit));
  assert.ok(plumesAt(600).every(one => one.lit));
});
