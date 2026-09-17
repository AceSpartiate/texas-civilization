// Women are not sent to the fighting (owner, 2026-09-16: "Women did not participate in battle. Actual combat shouldn't be a
// presented option for them"). sim/family.mjs `canFight` gates turning out for a force, riding upriver to Gonzales, and the
// winter's enlistments, the garrison, the expedition, the relief and Houston's army; the option is refused in words on the
// control, never a hidden rule. Going to see, helping, the vote's own rule, the road east and every chore stay hers.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, projectWorld, rollFamily, stepWorld, validateWorld } from '../sim/world.mjs';
import { beginSecondPeriod } from '../sim/periods.mjs';
import { momentOf } from '../sim/directors.mjs';
import { canFight, cannotFightWhy } from '../sim/family.mjs';
import { callAvailability } from '../sim/calls.mjs';
import { winterRefusal } from '../sim/winter.mjs';

const view = (world, householdId) => projectWorld(world, householdId, 'student', { includeMap: false });
const until = (world, done, limit = 9000) => { for (let t = 0; t < limit && !done() && world.status === 'running'; t++) stepWorld(world); };
const mother = household => world => household.members.map(id => world.entities[id]).find(p => p.kin?.role === 'mother');
const father = household => world => household.members.map(id => world.entities[id]).find(p => p.kin?.role === 'father');

test('the rule: a father or a grown son may be sent to the fighting; a mother or a grown daughter may not, and is told why', () => {
  const world = createGonzalesWorld('women-rule', 5, { map: 'colonies' });
  const household = Object.values(world.households).find(h => { rollFamily(world, h); return h.members.map(id => world.entities[id]).some(p => p.kin?.role === 'mother') && h.members.map(id => world.entities[id]).some(p => p.kin?.role === 'father'); });
  assert.ok(household, 'no family with both parents');
  const her = mother(household)(world), him = father(household)(world);
  assert.equal(canFight(him), true);
  assert.equal(canFight(her), false);
  assert.match(cannotFightWhy(her), /does not go to the fighting/);
  const daughter = { ...her, name: 'Nieves', age: 17, kin: { role: 'daughter' } };
  assert.equal(canFight(daughter), false, 'a grown daughter may be sent');
  assert.equal(canFight({ ...him, name: 'Mateo', age: 17, kin: { role: 'son' } }), true, 'a grown son may not be sent');
  assert.match(cannotFightWhy({ ...him, age: 8, kin: { role: 'son' } }), /too young/, 'a boy too young is refused for the wrong reason');
});

test('a settlement\'s call: turning out is refused to a mother in words on the control, and staying is hers; a father may go', () => {
  const world = createGonzalesWorld('women-call', 15, { map: 'colonies', neighbours: true });
  for (const h of Object.values(world.households)) rollFamily(world, h);
  const household = Object.values(world.households).find(h => ['san-felipe', 'mina', 'victoria', 'liberty'].includes(h.settlementId) && mother(h)(world) && father(h)(world));
  household.played = true;
  world.status = 'running';
  until(world, () => world.calls?.[household.id]);
  const her = mother(household)(world), him = father(household)(world);
  assert.equal(callAvailability(world, household.id, her, 'turn-out').can, false);
  assert.match(callAvailability(world, household.id, her, 'turn-out').why, /does not go to the fighting/);
  assert.equal(callAvailability(world, household.id, her, 'stay-put').can, true, 'staying was refused her');
  const shown = view(world, household.id).request?.answerers?.[her.id];
  assert.ok(shown, 'the mother is not among the answerers shown');
  assert.equal(shown.find(o => o.id === 'turn-out').can, false, 'the control offers the mother the fight');
  assert.match(shown.find(o => o.id === 'turn-out').why, /does not go to the fighting/);
  assert.throws(() => applyAction(world, household.id, { action: 'turn-out', entityId: her.id, mode: 'horse' }), /does not go to the fighting/);
  if (!him.travel && callAvailability(world, household.id, him, 'turn-out').can) applyAction(world, household.id, { action: 'turn-out', entityId: him.id, mode: 'horse' });
  validateWorld(world);
});

test('Gonzales: riding upriver to the fight is refused a mother; going to see is not', async () => {
  const world = createGonzalesWorld('women-upriver', 5, { map: 'colonies' });
  for (const h of Object.values(world.households)) rollFamily(world, h);
  const household = Object.values(world.households).find(h => (h.settlementId || 'gonzales') === 'gonzales' && mother(h)(world)) || Object.values(world.households).find(h => mother(h)(world));
  household.played = true;
  world.status = 'running';
  until(world, () => world.requests?.[household.id] || world.marches?.[household.id] || world.rumors?.[household.id] || world.minute > momentOf(world, 'crossing'));
  const her = mother(household)(world);
  const { callAvailability: gonzales } = await import('../sim/directors.mjs');
  assert.equal(gonzales(world, household.id, her, 'go-upriver').can, false);
  assert.match(gonzales(world, household.id, her, 'go-upriver').why, /does not go to the fighting/);
  assert.equal(gonzales(world, household.id, her, 'go-see').can, true, 'going to see was refused her');
});

test('the winter: enlisting, the garrison, the expedition, the relief and Houston\'s army are refused a mother and offered a father', () => {
  const world = createGonzalesWorld('women-winter', 6, { map: 'colonies' });
  for (const h of Object.values(world.households)) rollFamily(world, h);
  world.status = 'running';
  until(world, () => world.director.complete);
  beginSecondPeriod(world); world.status = 'running';
  until(world, () => world.director.milestones['winter-news']);
  const household = Object.values(world.households).find(h => mother(h)(world) && father(h)(world) && mother(h)(world).health.condition === 'well');
  assert.ok(household, 'no family with both parents well');
  const her = mother(household)(world), him = father(household)(world);
  for (const chore of ['enlist-regular', 'enlist-auxiliary', 'join-garrison', 'join-matamoros']) {
    assert.match(winterRefusal(world, household, her, chore) || '', /does not go to the fighting/, `${chore} is offered the mother`);
    assert.ok(!/does not go to the fighting/.test(winterRefusal(world, household, him, chore) || ''), `${chore} is refused the father as a woman`);
  }
  const offered = view(world, household.id).work[her.id] || [];
  for (const entry of offered.filter(e => ['enlist-regular', 'enlist-auxiliary', 'join-garrison', 'join-matamoros'].includes(e.id))) {
    assert.equal(entry.can, false, `the panel offers the mother ${entry.id}`);
    assert.match(entry.why, /does not go to the fighting/);
  }
  assert.throws(() => applyAction(world, household.id, { action: 'chore', entityId: her.id, chore: 'enlist-auxiliary', mode: 'horse' }), /does not go to the fighting/);
  validateWorld(world);
});
