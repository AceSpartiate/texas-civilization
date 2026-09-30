// *Offer a trade* on the Neighbours sheet (triage 2026-09-29, 2.6: trading between students was hard to find - it needed one of
// yours and one of theirs at the same place, then a press on their person). The sheet sends a person to the neighbour's land and
// opens the trade when they stand with somebody of that family; public/neighbours.js decides only when, from the server's own
// snapshot. The browser half - pressed, walked there, opened, offered - is scripts/neighbours-browser-proof.mjs.
import test from 'node:test';
import assert from 'node:assert/strict';
import { tradeArrival, tradePartnerAt } from '../public/neighbours.js';
import { projectWorld } from '../sim/world.mjs';
import { createSettledWorld } from './support/settled.mjs';

/** One of the family, as the page is sent them (`entities`). */
const ours = (id, siteId, extra = {}) => ({ id, kind: 'person', householdId: 'hh-1', location: { siteId }, travel: null, health: { condition: 'well' }, ...extra });
/** Somebody of another family standing with one of ours, as the page is sent them (`others`, sim/town.mjs `observedBy`). */
const theirs = (id, householdId, siteId, extra = {}) => ({ id, kind: 'person', householdId, location: { siteId }, condition: 'well', observed: true, ...extra });
const view = (entities, others = []) => ({ householdId: 'hh-1', entities, others });

test('Offer a trade is offered at once only when somebody of theirs stands with one of the family on their land', () => {
  const walker = theirs('hh-4-a', 'hh-4', 'home-4');
  assert.equal(tradePartnerAt(view([ours('hh-1-a', 'home-1')], [walker]), 'hh-4', 'home-4'), null, 'a trade partner with nobody of the family there');
  assert.equal(tradePartnerAt(view([ours('hh-1-a', 'home-4')], [walker]), 'hh-4', 'home-4')?.id, 'hh-4-a');
  assert.equal(tradePartnerAt(view([ours('hh-1-a', 'home-4', { travel: { to: 'home-1' } })], [walker]), 'hh-4', 'home-4'), null, 'one of ours only passing through');
  assert.equal(tradePartnerAt(view([ours('hh-1-a', 'home-4')], [{ ...walker, condition: 'dead' }]), 'hh-4', 'home-4'), null, 'the dead trade');
  assert.equal(tradePartnerAt(view([ours('hh-1-a', 'home-4')], [theirs('x', 'hh-7', 'home-4')]), 'hh-4', 'home-4'), null, 'somebody of another family taken for theirs');
  assert.equal(tradePartnerAt(view([ours('hh-1-a', 'home-4')], [{ ...walker, resident: true }]), 'hh-4', 'home-4'), null, 'a townsman offered a private trade');
});

test('a trade asked for on the Neighbours sheet opens when the one sent stands with them, and not before', () => {
  const asked = { entityId: 'hh-1-a', siteId: 'home-4', householdId: 'hh-4', seenGoing: false };
  const walker = theirs('hh-4-a', 'hh-4', 'home-4');
  // The snapshot after the order can still show them at home: that is not a trade given up.
  assert.equal(tradeArrival(view([ours('hh-1-a', 'home-1')]), asked).state, 'waiting');
  assert.equal(tradeArrival(view([ours('hh-1-a', null, { travel: { to: 'home-4' } })]), asked).state, 'going');
  // There, with somebody of theirs: the trade opens with that person.
  assert.deepEqual(tradeArrival(view([ours('hh-1-a', 'home-4')], [walker]), { ...asked, seenGoing: true }), { state: 'open', partnerId: 'hh-4-a' });
  // There, and nobody of theirs at home: said, not opened on nobody.
  assert.equal(tradeArrival(view([ours('hh-1-a', 'home-4')]), { ...asked, seenGoing: true }).state, 'nobody');
  // Sent somewhere else on the way, back home after setting out, or gone: forgotten.
  assert.equal(tradeArrival(view([ours('hh-1-a', null, { travel: { to: 'gonzales' } })]), asked).state, 'lost');
  assert.equal(tradeArrival(view([ours('hh-1-a', 'home-1')]), { ...asked, seenGoing: true }).state, 'lost');
  assert.equal(tradeArrival(view([ours('hh-1-a', null, { travel: { to: 'home-4' }, health: { condition: 'captured' } })]), asked).state, 'lost');
  assert.equal(tradeArrival(view([]), asked).state, 'lost');
});

test('the neighbour found for a trade is the one the server sends a page, standing with one of the family on their land', () => {
  // The real projection, not a hand-made one: another family's people are `others`, never the family's own `entities`.
  const world = createSettledWorld('neighbours-page-trade', 5);
  const [mine, next] = ['hh-1', 'hh-2'].map(id => world.households[id]);
  const visitor = world.entities[mine.principalId], host = world.entities[next.principalId];
  assert.ok(host.location.siteId, 'the neighbour is not at home, so this proves nothing');
  const alone = projectWorld(world, 'hh-1', 'student', { includeMap: false });
  assert.equal(tradePartnerAt(alone, 'hh-2', host.location.siteId), null, 'a neighbour offered for a trade with nobody of the family there');
  visitor.location = { ...host.location };
  const page = projectWorld(world, 'hh-1', 'student', { includeMap: false });
  assert.equal(tradePartnerAt(page, 'hh-2', host.location.siteId)?.id, host.id, 'the neighbour standing with one of the family was not found in what the page is sent');
});
