import test from 'node:test';
import assert from 'node:assert/strict';
import { projectBattle, phaseOffset, ENGAGEMENTS } from '../sim/battle-stage.mjs';

const def = ENGAGEMENTS.alamo;
const site = { x: -61.6, y: 4.6, name: 'Béxar' };
function plumesAt(into) {
  const world = { minute: phaseOffset(def, 'burial') + into, map: { sites: { bexar: site } }, battles: { alamo: { id: 'alamo', start: 0, participants: {}, alerted: {}, told: {}, heard: {} } } };
  return projectBattle(world, 'alamo')?.plumes || [];
}

// Since the Esparza burial split March 6's afternoon into its own phase from noon, the pyres are staged in it: built at 15:00
// (180 minutes in) and lit at 17:00 (300).
test('the three separated Alamo pyres are built in the afternoon and ignite near five', () => {
  assert.equal(plumesAt(-200).length, 0, 'the pyres stand in the morning of March 6');
  assert.equal(plumesAt(179).length, 0);
  const built = plumesAt(180);
  assert.equal(built.length, 3);
  assert.ok(built.every(one => one.kind === 'alamo-pyre' && one.lit === false));
  assert.ok(built.every((one, i) => built.slice(i + 1).every(other => Math.hypot(one.x - other.x, one.y - other.y) > 0.075)), 'the piles should occupy separate sites');
  assert.ok(plumesAt(299).every(one => !one.lit));
  assert.ok(plumesAt(300).every(one => one.lit));
});
