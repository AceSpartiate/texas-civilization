// Each feller needs a felling axe (owner, 2026-09-28: "Each needs an axe"; docs/TOWNS.md §4b, amended; docs/FAMILY_PANEL.md §21.6).
//
// Felling holds one copy of the felling axe a feller, never shared, from the moment it is given until it ends however it ends
// (§4c: tools counted, each person holding one copy). A feller with no free axe is refused in plain words, and on auto works about
// the place until one is free. The rest of the work at home - the house, a lane or a clearing through timber - shares one copy among
// all of it, as it always did.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, projectWorld, rollFamily, stepWorld, validateWorld } from '../sim/world.mjs';
import { choreAvailability } from '../sim/chores.mjs';
import { sexOf, tooYoung } from '../sim/family.mjs';
import { holdingOf } from '../sim/grants.mjs';
import { siteFactsFor } from '../sim/homesite.mjs';
import { addTool, toolCount } from '../sim/tools.mjs';

const grid = (bounds, side = 7) => {
  const places = [];
  for (let i = 0; i < side; i++) for (let j = 0; j < side; j++) places.push({ x: +(bounds.minX + (bounds.maxX - bounds.minX) * (i + 0.5) / side).toFixed(3), y: +(bounds.minY + (bounds.maxY - bounds.minY) * (j + 0.5) / side).toFixed(3) });
  return places;
};
function onTheLand(seed) {
  const world = createGonzalesWorld(seed, 5, { map: 'colonies' });
  // A rolled family with a father and grown sons: felling is the men's work while a man is at home (owner, 2026-10-03; sim/custom.mjs),
  // and these tests want three fellers.
  rollFamily(world, world.households['hh-1']);
  world.status = 'running';
  for (let tick = 0; tick < 200 && Object.values(world.households).some(household => household.arriving); tick++) stepWorld(world);
  const household = world.households['hh-1'];
  const site = grid(holdingOf(world, household).bounds).find(point => siteFactsFor(world, household, point).can);
  applyAction(world, 'hh-1', { action: 'choose-site', ...site });
  for (let tick = 0; tick < 60 && household.members.some(member => world.entities[member].travel); tick++) stepWorld(world);
  const people = household.members.map(id => world.entities[id]).filter(person => person.kind === 'person' && !tooYoung(person) && sexOf(person) === 'male');
  return { world, household, people };
}
const says = (world, id) => projectWorld(world, 'hh-1', 'student', { includeMap: false }).entities.find(one => one.id === id)?.autoTask?.says;

test('a second feller needs a second felling axe: refused in plain words, and each holds a copy of their own until they stop', () => {
  const { world, household, people } = onTheLand('axe-each-2');
  const [first, second, third] = people;
  assert.equal(toolCount(household, 'axe'), 1, 'the family starts with one felling axe');
  applyAction(world, 'hh-1', { action: 'chore', entityId: first.id, chore: 'fell-trees' });
  assert.deepEqual(first.chore.with, ['axe'], 'the feller holds the axe');
  assert.equal(first.chore.shares, undefined, 'a feller shares their axe with nobody');
  // One axe, and it is out: the second is refused, told who has it and where another is to be had.
  const why = choreAvailability(world, household, second, 'fell-trees').why;
  assert.match(why, new RegExp(`^There is no free felling axe: ${first.name} has the felling axe, .+\\. Buy another in town\\.$`));
  assert.throws(() => applyAction(world, 'hh-1', { action: 'chore', entityId: second.id, chore: 'fell-trees' }), /There is no free felling axe/);
  // A second axe, bought in town: the second fells too, with a copy of their own.
  addTool(household, 'axe');
  applyAction(world, 'hh-1', { action: 'chore', entityId: second.id, chore: 'fell-trees' });
  assert.deepEqual(second.chore.with, ['axe']);
  // Both out: the third is told both have them.
  assert.equal(choreAvailability(world, household, third, 'fell-trees').why, `There is no free felling axe: ${first.name} and ${second.name} have both felling axes. Buy another in town.`);
  // One stops, and the axe is free again for the third.
  applyAction(world, 'hh-1', { action: 'stop-chore', entityId: first.id });
  assert.equal(choreAvailability(world, household, third, 'fell-trees').can, true, 'the axe was not let go when the felling stopped');
  validateWorld(world);
});

test('a feller on auto with no free axe works about the place, says why, and takes the axe up the tick it is free', () => {
  const { world, household, people } = onTheLand('axe-auto');
  const [first, second] = people;
  applyAction(world, 'hh-1', { action: 'chore', entityId: first.id, chore: 'fell-trees' });
  applyAction(world, 'hh-1', { action: 'set-auto', entityId: second.id, auto: true });
  // Given felling while the only axe is out: taken as the task to wait for, as auto takes any work it cannot do yet.
  applyAction(world, 'hh-1', { action: 'chore', entityId: second.id, chore: 'fell-trees' });
  assert.equal(second.chore, null);
  assert.equal(second.order.chore, 'fell-trees');
  stepWorld(world);
  assert.equal(second.chore, null, 'a second feller went out with no axe');
  assert.equal(second.task, 'work', 'waiting for the axe, not working about the place');
  assert.match(says(world, second.id), new RegExp(`^Auto: fell trees\\. There is no free felling axe: ${first.name} has the felling axe, .+ Buy another in town\\. Working about the place meanwhile\\.$`));
  applyAction(world, 'hh-1', { action: 'stop-chore', entityId: first.id });
  stepWorld(world);
  assert.equal(second.chore?.id, 'fell-trees', 'the axe free, the one waiting did not take it up');
  assert.equal(household.members.filter(id => world.entities[id].chore?.id === 'fell-trees').length, 1, 'one axe, one feller');
  validateWorld(world);
});
