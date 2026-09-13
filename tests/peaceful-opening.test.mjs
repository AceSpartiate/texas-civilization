// The peaceful opening: step 1 of docs/SETTLING_IN.md.
//
// The owner wants the first ten real minutes of a class to be peaceful, so it feels like a
// farming life before it feels like a war. A class now starts at dawn on September 28, 1835 -
// the families' arrival - and the first news of the cannon still comes on the morning of the
// 29th. Nothing historical may happen before it; the farm and the neighbours may.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, stepWorld, projectWorld, validateWorld } from '../sim/world.mjs';
import { ARRIVAL_MINUTES, TIMELINE, momentOf } from '../sim/directors.mjs';
import { PACES } from '../server/app.mjs';

const view = (world, householdId) => projectWorld(world, householdId, 'student', { includeMap: false });
const HISTORICAL = ['world-event', 'information', 'pressure', 'encounter', 'spoken', 'relay', 'report-delivered', 'battle-phase'];

test('a class starts at dawn on September 28, and nothing historical happens before the news', () => {
  const world = createGonzalesWorld('peace', 15);
  world.status = 'running';
  assert.equal(view(world, 'hh-1').historicalDate, '1835-09-28');
  const notice = momentOf(world, 'notice');
  assert.equal(notice, TIMELINE.notice);
  assert.equal(notice, 28 * 60, 'the news comes 28 hours after dawn on the 28th: ten o\'clock on the 29th');
  // Ten real minutes of peace is a promise made at the Study pace.
  assert.ok((notice / 20) * PACES.study >= 10 * 60 * 1000, `only ${((notice / 20) * PACES.study / 60000).toFixed(1)} real minutes of peace at the Study pace`);

  while (world.minute + 20 < notice) {
    stepWorld(world);
    const early = world.events.filter(event => HISTORICAL.includes(event.type));
    assert.deepEqual(early.map(event => `${event.minute} ${event.type}`), [], `something historical happened at minute ${world.minute}`);
    assert.equal(Object.values(world.entities).some(entity => entity.courier), false, 'a rider was on the road before there was news');
    assert.deepEqual(Object.keys(world.requests), []);
    assert.deepEqual(Object.keys(world.rumors || {}), []);
  }
  assert.equal(world.truth['cannon-request'], undefined);
  while (!world.truth['cannon-request']) stepWorld(world);
  assert.equal(world.minute, notice, 'the news came when history says, not a tick early or late');
  assert.equal(view(world, 'hh-1').historicalDate, '1835-09-29');
  validateWorld(world);
});

test('the peaceful hours are for the farm and the neighbours', () => {
  const world = createGonzalesWorld('peace-farm', 5);
  world.status = 'running';
  const household = world.households['hh-1'];
  // The family comes in off the road first (docs/SETTLING_IN.md step 2), and still has the hours.
  while (household.arriving) stepWorld(world);
  applyAction(world, household.id, { action: 'chore', entityId: household.members[1], chore: 'plant-field' });
  while (world.entities[household.members[1]].chore) stepWorld(world);
  assert.equal(household.field.state, 'planted');
  assert.ok(world.minute < momentOf(world, 'notice'), `planting a field took until minute ${world.minute}, past the news`);

  // And neighbours standing together can trade before anybody has heard anything.
  const a = world.entities[world.households['hh-1'].principalId], b = world.entities[world.households['hh-2'].principalId];
  for (const person of [a, b]) person.location = { ...world.map.sites.gonzales, siteId: 'gonzales' };
  applyAction(world, 'hh-1', { action: 'offer', entityId: a.id, toEntityId: b.id, give: { food: 1 }, ask: { seed: 1 } });
  const [offer] = Object.values(world.offers);
  applyAction(world, 'hh-2', { action: 'accept-offer', entityId: b.id, offerId: offer.id });
  assert.ok(world.minute < momentOf(world, 'notice'));
  assert.equal(Object.keys(world.offers).length, 0, 'the trade did not go through');
});

test('a class saved before arrivals keeps exactly the timeline it was playing', () => {
  // No save version moves: a class started at midnight on the 29th has no arrival marker,
  // and its news, battle and ending stay where they were on its clock.
  const world = createGonzalesWorld('peace-old', 5);
  delete world.director.arrival;
  for (const barrier of world.barriers) if (barrier.id.startsWith('gonzales:')) barrier.minute -= ARRIVAL_MINUTES;
  world.status = 'running';
  assert.equal(view(world, 'hh-1').historicalDate, '1835-09-29');
  assert.equal(momentOf(world, 'notice'), 600);
  while (!world.truth['cannon-request']) stepWorld(world);
  assert.equal(world.minute, 600);
  while (world.status === 'running') stepWorld(world);
  assert.equal(world.minute, momentOf(world, 'finish'));
  assert.equal(world.minute, TIMELINE.finish - ARRIVAL_MINUTES);
  validateWorld(world);
});
