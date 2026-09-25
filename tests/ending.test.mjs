// The end of the game: steps 4 and 5 of docs/MONEY_AND_GLORY.md.
//
// When the class ends each family sees its own coin, its own glory, what earned each, and the two
// multiplied; the Host sees every family's three numbers and names the family that finished first.
// Proved here: nothing of it exists while the class runs, and all of it does once it has ended; a
// family that stayed home and sold for coin finishes with a real number and a story; glory never
// erases coin; a neighbour nobody played is counted and never ranked; ties name everybody; each
// coin that moved is accounted for; and no word on either screen names a virtue.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { createSettledWorld, withoutStartingCoin } from './support/settled.mjs';
import { settleMeans } from '../sim/means.mjs';
import { applyAction, stepWorld, projectWorld, validateWorld } from '../sim/world.mjs';
import { learn } from '../sim/knowledge.mjs';
import { makeOffer, respondToOffer } from '../sim/trade.mjs';
import { COIN } from '../sim/chores.mjs';
import { DISCUSSION, familyEnding, finalNumber, hostEnding } from '../sim/ending.mjs';

const view = (world, householdId) => projectWorld(world, householdId, 'student', { includeMap: false });
const host = world => projectWorld(world, undefined, 'host', { includeMap: false });

/** The glory test's class: 'go-upriver' carries food and goes on, 'stay' stays home. */
function play(seed, policies, { beforeTick, plant } = {}) {
  const world = createGonzalesWorld(seed, 5);
  world.status = 'running';
  plant?.(world);
  while (!world.truth['cannon-request']) { beforeTick?.(world); stepWorld(world); }
  for (const householdId of Object.keys(policies)) learn(world, householdId, 'cannon-request', { status: 'confirmed', source: 'Somebody who saw it' });
  const answered = new Set();
  while (world.status === 'running') {
    beforeTick?.(world);
    stepWorld(world);
    for (const [householdId, policy] of Object.entries(policies)) {
      const call = view(world, householdId).request;
      if (call?.status !== 'open') continue;
      const principal = world.households[householdId].principalId;
      if (call.kind === 'supplies' && !answered.has(householdId)) {
        applyAction(world, householdId, { action: policy === 'stay' ? 'stay' : 'help', entityId: principal });
        answered.add(householdId);
      }
      if (call.kind === 'march' && policy !== 'stay') applyAction(world, householdId, { action: policy, entityId: call.actorId });
    }
  }
  return world;
}

let played = null;
/** One class played to its end: hh-1 went upriver, hh-3 stayed home with coin in the house. */
const endedClass = () => played ??= play('ending', { 'hh-1': 'go-upriver', 'hh-3': 'stay' }, {
  // Given its means first, as the first tick would, and then none of the coin they bring (sim/means.mjs): this class is about
  // glory and the coin kept, from none.
  plant: world => { settleMeans(world); withoutStartingCoin(world); world.households['hh-3'].resources.money = 4; },
  beforeTick: world => {
    // Nothing of the ending is on anybody's wire while the class runs.
    assert.equal('ending' in host(world), false, `the Host had an ending at tick ${world.tick}`);
    for (const householdId of Object.keys(world.households)) {
      assert.equal('ending' in view(world, householdId), false, `${householdId} had an ending at tick ${world.tick}`);
    }
  },
});

test('the ending appears only once the class has ended, for the family and for the Host', () => {
  const world = endedClass();
  assert.equal(world.status, 'ended');
  validateWorld(world);
  const own = view(world, 'hh-1').ending.family;
  assert.equal(own.householdId, 'hh-1');
  assert.ok(own.glory > 0, 'a family that went upriver finished with no glory');
  assert.equal(own.glory, world.glory['hh-1'].total);
  assert.ok(own.awards.length > 0 && own.awards.every(award => award.text && award.date), 'glory revealed without what earned it');
  assert.ok(own.sum.startsWith(`${own.money} ${own.money === 1 ? 'real' : 'reales'}`) && own.sum.endsWith(`× (1 + ${own.glory} glory) = ${own.final}`), `the multiplication is not shown: ${own.sum}`);
  // A family sees its own reckoning and nobody else's.
  assert.equal(view(world, 'hh-2').ending.family.householdId, 'hh-2');
  assert.equal(view(world, 'hh-2').ending.host, undefined);
  const closing = host(world).ending.host;
  assert.deepEqual(closing.families.map(family => family.householdId), Object.keys(world.households), 'the Host view is not in household order');
  assert.equal(host(world).ending.family, undefined);
});

test('a family that stayed home and kept its coin finishes with a real number and a story', () => {
  const world = endedClass();
  const stayed = familyEnding(world, 'hh-3');
  assert.equal(stayed.glory, 0);
  assert.equal(stayed.money, 4);
  assert.equal(stayed.final, 4, 'glory of nothing erased the coin');
  assert.ok(stayed.story.some(line => /stayed/.test(line)), 'the story does not say the family stayed');
  assert.ok(stayed.story.some(line => /road miles from Gonzales/.test(line)));
  assert.equal(finalNumber(3, 2), 9);
  validateWorld(world);
});

test('a family with no coin is counted as holding one real, so its glory still counts', () => {
  // Owner, 2026-09-16: "families with zero coin should be treated as if they have one coin so
  // glory has something to multiply."
  assert.equal(finalNumber(0, 9), 10);
  assert.equal(finalNumber(0, 0), 1);
  assert.equal(finalNumber(1, 9), 10, 'one real held and none held are the same');
  assert.equal(finalNumber(2, 9), 20, 'the floor lifts nothing above one real');
  const world = endedClass();
  const went = familyEnding(world, 'hh-1');
  assert.equal(went.money, 0, 'this class was meant to leave hh-1 without coin');
  assert.equal(went.final, 1 + went.glory);
  assert.equal(went.counted, 1);
  // The page says the real was counted, not that the family had one.
  assert.equal(went.sum, `0 reales, counted as 1 real × (1 + ${went.glory} glory) = ${went.final}`);
  // And the family that went now finishes above a family that did nothing and had nothing.
  const idle = familyEnding(world, 'hh-4');
  assert.equal(idle.final, 1);
  assert.ok(went.final > idle.final);
  // Whoever finished first holds the highest final number in the class.
  const closing = hostEnding(world);
  assert.equal(closing.best, Math.max(...closing.families.map(family => family.final)));
  assert.ok(closing.winners.every(id => closing.families.find(family => family.householdId === id).final === closing.best));
});

test('a planted glory reaches the family and the Host once the class has ended, and no other family', () => {
  const world = createGonzalesWorld('ending-planted', 5);
  world.status = 'running';
  world.households['hh-1'].resources.money = 2;
  world.glory = { 'hh-1': { total: 987654, awards: { 'gonzales:x': { event: 'gonzales', personId: world.households['hh-1'].principalId, role: 'present', miles: 12, points: 987654, minute: 10 } } } };
  const marker = /987654/;
  assert.doesNotMatch(JSON.stringify(view(world, 'hh-1')), marker, 'glory showed while the class ran');
  assert.doesNotMatch(JSON.stringify(host(world)), marker, 'glory showed on the Host while the class ran');
  world.status = 'paused';
  assert.doesNotMatch(JSON.stringify(view(world, 'hh-1')), marker, 'pausing the class revealed glory');
  // The teacher ends the session: that is the end of the game as much as the slice finishing.
  world.status = 'ended';
  assert.match(JSON.stringify(view(world, 'hh-1')), marker, 'the family never saw its glory');
  assert.match(JSON.stringify(host(world)), marker, 'the Host never saw it');
  assert.doesNotMatch(JSON.stringify(view(world, 'hh-2')), marker, 'another family saw it');
  assert.equal(view(world, 'hh-1').ending.family.final, 2 * (1 + 987654));
});

test('the highest final number finishes first, a tie names every family, and a neighbour nobody played is never ranked', () => {
  const world = createGonzalesWorld('ending-ranks', 5);
  const ids = Object.keys(world.households);
  const coin = { 'hh-1': 3, 'hh-2': 6, 'hh-3': 6, 'hh-4': 1, 'hh-5': 50 };
  for (const id of ids) world.households[id].resources.money = coin[id];
  world.glory = { 'hh-1': { total: 1, awards: {} } }; // 3 × 2 = 6, level with hh-2 and hh-3
  // hh-5 is an automatic neighbour: its coin is counted and shown, and it is not named.
  world.neighbours = {};
  for (const id of ['hh-1', 'hh-2', 'hh-3', 'hh-4']) world.households[id].played = true;
  const closing = hostEnding(world);
  assert.equal(closing.families.find(family => family.householdId === 'hh-5').final, 50);
  assert.equal(closing.families.find(family => family.householdId === 'hh-5').automatic, true);
  assert.deepEqual(closing.winners, ['hh-1', 'hh-2', 'hh-3']);
  assert.equal(closing.best, 6);
});

test('every coin that came into the house or went out of it is in the family\'s account', () => {
  const world = createSettledWorld('ending-coin', 5);
  world.status = 'running';
  const [one, two] = Object.values(world.households);
  const finish = person => { for (let tick = 0; tick < 400 && person.chore; tick++) stepWorld(world); };
  // The coin the family came with (sim/means.mjs), the account's first line.
  const start = one.means.coin;
  assert.ok(start >= 3 && one.resources.money === start, 'the family did not come with its coin');
  // Food sold for coin.
  one.resources.food = 20;
  const seller = world.entities[one.members[1]];
  applyAction(world, one.id, { action: 'chore', entityId: seller.id, chore: 'sell-food' });
  finish(seller);
  const earned = one.resources.money - start;
  assert.ok(earned > 0, 'the sale brought no coin home');
  // A hoe bought with it.
  one.resources.money = COIN.hoe; one.tools.hoe = 999;
  const buyer = world.entities[one.members[0]];
  applyAction(world, one.id, { action: 'chore', entityId: buyer.id, chore: 'replace-hoe' });
  finish(buyer);
  // Coin handed to a neighbour.
  one.resources.money = 2;
  const a = world.entities[one.principalId], b = world.entities[two.principalId];
  for (const person of [a, b]) person.location = { ...world.map.sites.gonzales, siteId: 'gonzales' };
  const offer = makeOffer(world, one.id, a, { toEntityId: b.id, give: { money: 2 }, ask: { seed: 1 } });
  respondToOffer(world, two.id, b, 'accept-offer', offer.id);
  validateWorld(world);
  world.status = 'ended';
  assert.deepEqual(familyEnding(world, one.id).coin.map(line => line.coin), [start, earned, -COIN.hoe, -2]);
  assert.equal(familyEnding(world, one.id).coin[0].text, `The family came with ${start} reales.`);
  assert.deepEqual(familyEnding(world, two.id).coin.map(line => line.coin), [two.means.coin, 2]);
});

test('no word on either screen names a virtue', () => {
  const world = endedClass();
  const virtue = /\b(good|better|best|brave\w*|loyal\w*|patriot\w*|hero\w*|virtu\w*|honou?r\w*|worthy|courag\w*|coward\w*|deserv\w*|right|wrong)\b/i;
  const strings = [];
  const collect = value => {
    if (typeof value === 'string') strings.push(value);
    else if (value && typeof value === 'object') Object.values(value).forEach(collect);
  };
  collect(host(world).ending);
  for (const householdId of Object.keys(world.households)) collect(view(world, householdId).ending);
  collect(DISCUSSION);
  assert.ok(strings.length > 20, 'there was nothing to search');
  for (const text of strings) assert.doesNotMatch(text, virtue, text);
});
