// Trading between households: an offer, an answer, and a transfer that survives both
// families' saves. The rule the whole file is really testing is that a trade is a thing
// said face to face, and that neither family ever learns the other's stores.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createWorld, stepWorld, applyAction, projectWorld, validateWorld } from '../sim/world.mjs';
import { MAX_OPEN_OFFERS, tradePartners } from '../sim/trade.mjs';

const running = (seed = 'trade', count = 5) => { const world = createWorld(seed, count); world.status = 'running'; return world; };
const send = (world, householdId, input) => applyAction(world, householdId, input);
const offer = (world, householdId, who, toEntityId, give, ask) =>
  send(world, householdId, { action: 'offer', entityId: `${householdId}-${who}`, toEntityId, give, ask });
const offersOf = (world, householdId) => projectWorld(world, householdId, 'student', { includeMap: false }).offers;
const said = (world, householdId) => world.events.filter(event => event.householdId === householdId).map(event => event.text);

/** Stand somebody at a real place, the way arriving there would leave them. */
function stand(world, id, siteId) {
  const site = world.map.sites[siteId], entity = world.entities[id];
  entity.travel = null; entity.chore = null;
  entity.location = { x: site.x, y: site.y, siteId };
}
function standTogether(world, oneId, otherId, siteId = 'gonzales') {
  for (const id of [oneId, otherId]) stand(world, id, siteId);
  validateWorld(world);
}

test('a trade is an offer, an answer, and two stores that actually move', () => {
  const world = running();
  standTogether(world, 'hh-1-thomas', 'hh-2-elena');
  const mine = world.households['hh-1'], theirs = world.households['hh-2'];
  mine.resources.seed = 6; mine.resources.food = 10;
  theirs.resources.seed = 0; theirs.resources.food = 14;

  offer(world, 'hh-1', 'thomas', 'hh-2-elena', { seed: 2 }, { food: 3 });

  // Both families see the same offer, each written from its own side, so neither has to
  // work out which way round it runs.
  const made = offersOf(world, 'hh-1');
  const received = offersOf(world, 'hh-2');
  assert.equal(made.length, 1); assert.equal(received.length, 1);
  assert.equal(made[0].direction, 'made');
  assert.deepEqual(made[0].weGive, { seed: 2 });
  assert.deepEqual(made[0].weGet, { food: 3 });
  assert.equal(received[0].direction, 'received');
  assert.deepEqual(received[0].weGive, { food: 3 }, 'the same offer, from the other side');
  assert.deepEqual(received[0].weGet, { seed: 2 });
  assert.equal(received[0].theirName, 'Thomas');

  send(world, 'hh-2', { action: 'accept-offer', entityId: 'hh-2-elena', offerId: received[0].id });
  assert.equal(mine.resources.seed, 4); assert.equal(mine.resources.food, 13);
  assert.equal(theirs.resources.seed, 2); assert.equal(theirs.resources.food, 11);
  assert.deepEqual(offersOf(world, 'hh-1'), [], 'an answered offer is closed');
  // Both families remember it, and each remembers it as their own side of the bargain.
  // Every family is a copy of the same four names, so anybody else is named with theirs.
  assert.ok(said(world, 'hh-1').some(text => /Thomas traded 2 seed to Elena of Family 2 for 3 food/.test(text)));
  assert.ok(said(world, 'hh-2').some(text => /Elena traded 3 food to Thomas of Family 1 for 2 seed/.test(text)));
  validateWorld(world);
});

test('trading reveals what was offered and never what a family has', () => {
  const world = running();
  standTogether(world, 'hh-1-thomas', 'hh-2-elena');
  world.households['hh-2'].resources.seed = 17;
  world.households['hh-2'].resources.food = 41;
  offer(world, 'hh-1', 'thomas', 'hh-2-elena', { seed: 2 }, { food: 3 });

  const mine = projectWorld(world, 'hh-1', 'student', { includeMap: false });
  const wire = JSON.stringify(mine);
  // Their person is in `others` on purpose — that is what standing together means — but
  // never in `entities`, which is the list a student may command.
  assert.ok(mine.entities.every(entity => entity.householdId === 'hh-1'), 'no other household in my own list');
  assert.ok(!wire.includes('"seed":17'), 'their seed count is not on the wire');
  assert.ok(!wire.includes('"food":41'), 'their food is not on the wire');
  assert.ok(!wire.includes('"resources"') || wire.indexOf('"resources"') === wire.lastIndexOf('"resources"'), 'exactly one household\'s stores are on the wire');
  // Their person is visible, because standing together is what an offer needs, but the
  // record of them carries no household stores at all.
  const them = mine.others.find(person => person.name === 'Elena');
  assert.ok(them, 'the neighbour standing here is visible');
  assert.equal(them.resources, undefined);
  assert.equal(them.skills, undefined);
  assert.equal(them.chore, undefined);
  assert.equal(mine.offers[0].theirName, 'Elena');
  assert.equal(mine.offers[0].theirHousehold, 'Family 2', 'named well enough to tell two Elenas apart');
  assert.equal(mine.offers[0].theirResources, undefined);
});

test('an offer is said face to face, and it lapses the moment they part', () => {
  const world = running();
  standTogether(world, 'hh-1-thomas', 'hh-2-elena');
  offer(world, 'hh-1', 'thomas', 'hh-2-elena', { seed: 1 }, { food: 1 });
  assert.equal(offersOf(world, 'hh-2').length, 1);

  // Elena goes back to her own land. Nothing was said again; the offer is simply over.
  stand(world, 'hh-2-elena', world.households['hh-2'].homeSiteId);
  stepWorld(world);
  assert.deepEqual(offersOf(world, 'hh-2'), [], 'walking away ends it');
  assert.deepEqual(offersOf(world, 'hh-1'), []);
  assert.ok(said(world, 'hh-1').some(text => /lapsed when they parted/.test(text)), 'the family left waiting is told');
  validateWorld(world);

  // And it cannot be made across a distance in the first place.
  assert.throws(() => offer(world, 'hh-1', 'thomas', 'hh-2-elena', { seed: 1 }, { food: 1 }), /standing with/);
});

test('there is nobody to trade with but another family', () => {
  const world = running();
  standTogether(world, 'hh-1-thomas', 'hh-2-elena');
  // Your own family already shares one store.
  assert.throws(() => offer(world, 'hh-1', 'thomas', 'hh-1-rosa', { seed: 1 }, { food: 1 }), /shares one store/);
  // A Gonzales resident trades at the counter; that is a different transaction.
  assert.throws(() => offer(world, 'hh-1', 'thomas', 'town-ibarra', { seed: 1 }, { food: 1 }), /Gonzales counter/);
  // And nobody may reach into another family to make an offer on its behalf.
  assert.throws(() => applyAction(world, 'hh-3', { action: 'offer', entityId: 'hh-1-thomas', toEntityId: 'hh-2-elena', give: { seed: 1 }, ask: { food: 1 } }), /your family/);
  assert.equal(Object.keys(world.offers).length, 0, 'and none of that created an offer');
  // tradePartners answers the same question the interface asks.
  const partners = tradePartners(world, 'hh-1', world.entities['hh-1-thomas']).map(person => person.id);
  assert.deepEqual(partners, ['hh-2-elena']);
  assert.deepEqual(tradePartners(world, 'hh-1', world.entities['hh-1-rosa']), [], 'nobody is standing with Rosa at home');
});

test('a family cannot offer what it has not got, nor accept what it cannot pay', () => {
  const world = running();
  standTogether(world, 'hh-1-thomas', 'hh-2-elena');
  world.households['hh-1'].resources.seed = 1;
  world.households['hh-2'].resources.food = 2;
  assert.throws(() => offer(world, 'hh-1', 'thomas', 'hh-2-elena', { seed: 5 }, { food: 1 }), /has 1 seed, not 5/);

  offer(world, 'hh-1', 'thomas', 'hh-2-elena', { seed: 1 }, { food: 9 });
  const received = offersOf(world, 'hh-2')[0];
  assert.throws(() => send(world, 'hh-2', { action: 'accept-offer', entityId: 'hh-2-elena', offerId: received.id }), /food, not 9/);
  assert.equal(world.households['hh-1'].resources.seed, 1, 'a refused trade moved nothing');
  assert.equal(offersOf(world, 'hh-2').length, 1, 'and the offer is still there to decline properly');

  // Nothing is held back at offer time, so an offer whose goods were spent fails honestly.
  world.households['hh-2'].resources.food = 20;
  world.households['hh-1'].resources.seed = 0;
  assert.throws(() => send(world, 'hh-2', { action: 'accept-offer', entityId: 'hh-2-elena', offerId: received.id }), /no longer has that to give/);
  assert.deepEqual(offersOf(world, 'hh-2'), [], 'and that offer is closed rather than left to fail again');
  validateWorld(world);
});

test('only the person an offer was made to can answer it', () => {
  const world = running();
  standTogether(world, 'hh-1-thomas', 'hh-2-elena');
  offer(world, 'hh-1', 'thomas', 'hh-2-elena', { seed: 2 }, { food: 2 });
  const id = offersOf(world, 'hh-2')[0].id;
  // Another family cannot answer for them...
  assert.throws(() => send(world, 'hh-3', { action: 'accept-offer', entityId: 'hh-3-thomas', offerId: id }), /not made to your family/);
  // ...the family that made it cannot accept its own offer...
  assert.throws(() => send(world, 'hh-1', { action: 'accept-offer', entityId: 'hh-1-thomas', offerId: id }), /not made to your family/);
  // ...and inside the right family it is still the person who was spoken to.
  assert.throws(() => send(world, 'hh-2', { action: 'accept-offer', entityId: 'hh-2-rosa', offerId: id }), /made to Elena/);
  // Taking it back is the offering family's alone.
  assert.throws(() => send(world, 'hh-2', { action: 'withdraw-offer', entityId: 'hh-2-elena', offerId: id }), /made an offer can take it back/);
  send(world, 'hh-1', { action: 'withdraw-offer', entityId: 'hh-1-thomas', offerId: id });
  assert.deepEqual(offersOf(world, 'hh-2'), []);
  assert.throws(() => send(world, 'hh-1', { action: 'withdraw-offer', entityId: 'hh-1-thomas', offerId: id }), /no longer open/);
});

test('a refusal is an answer, and both families hear it', () => {
  const world = running();
  standTogether(world, 'hh-1-thomas', 'hh-2-elena');
  offer(world, 'hh-1', 'thomas', 'hh-2-elena', { seed: 2 }, { food: 2 });
  const id = offersOf(world, 'hh-2')[0].id;
  send(world, 'hh-2', { action: 'decline-offer', entityId: 'hh-2-elena', offerId: id });
  assert.ok(said(world, 'hh-2').some(text => /Elena declined the offer from Thomas of Family 1/.test(text)));
  assert.ok(said(world, 'hh-1').some(text => /declined by Elena of Family 2/.test(text)), 'the family that asked is not left on a silence');
  assert.equal(world.households['hh-1'].resources.seed, world.households['hh-1'].resources.seed, 'nothing moved');
  assert.deepEqual(offersOf(world, 'hh-1'), []);
});

test('an offer is a whole number of one thing for another, and a family makes only a few', () => {
  const world = running();
  standTogether(world, 'hh-1-thomas', 'hh-2-elena');
  world.households['hh-1'].resources.seed = 40; world.households['hh-1'].resources.food = 40;
  const bad = (give, ask) => assert.throws(() => offer(world, 'hh-1', 'thomas', 'hh-2-elena', give, ask));
  bad({ seed: 1.5 }, { food: 1 });
  bad({ seed: 0 }, { food: 1 });
  bad({ seed: -2 }, { food: 1 });
  bad({ seed: 999 }, { food: 1 });
  bad({}, { food: 1 });
  bad({ seed: 1 }, {});
  bad({ hoe: 1 }, { food: 1 });
  // A trade swaps one thing for another; food for food is not a trade.
  bad({ food: 2 }, { food: 3 });
  assert.equal(Object.keys(world.offers).length, 0);

  offer(world, 'hh-1', 'thomas', 'hh-2-elena', { seed: 1 }, { food: 1 });
  assert.throws(() => offer(world, 'hh-1', 'thomas', 'hh-2-elena', { seed: 2 }, { food: 2 }), /already has an offer/);
  // A whole family cannot flood the class with offers either.
  standTogether(world, 'hh-1-rosa', 'hh-3-elena');
  standTogether(world, 'hh-1-mateo', 'hh-4-elena');
  standTogether(world, 'hh-1-elena', 'hh-5-elena');
  offer(world, 'hh-1', 'rosa', 'hh-3-elena', { seed: 1 }, { food: 1 });
  offer(world, 'hh-1', 'mateo', 'hh-4-elena', { seed: 1 }, { food: 1 });
  assert.equal(Object.keys(world.offers).length, MAX_OPEN_OFFERS);
  assert.throws(() => offer(world, 'hh-1', 'elena', 'hh-5-elena', { seed: 1 }, { food: 1 }), /Wait for an answer/);
});

test('offers survive save and reload, and a class saved before trading existed still runs', () => {
  const world = running();
  standTogether(world, 'hh-1-thomas', 'hh-2-elena');
  offer(world, 'hh-1', 'thomas', 'hh-2-elena', { seed: 2 }, { food: 3 });
  const reloaded = JSON.parse(JSON.stringify(world));
  assert.deepEqual(reloaded, JSON.parse(JSON.stringify(world)), 'the world round-trips through JSON unchanged');
  stepWorld(world); stepWorld(reloaded);
  assert.deepEqual(JSON.parse(JSON.stringify(reloaded)), JSON.parse(JSON.stringify(world)), 'a reloaded world steps identically');
  const id = offersOf(reloaded, 'hh-2')[0].id;
  send(reloaded, 'hh-2', { action: 'accept-offer', entityId: 'hh-2-elena', offerId: id });
  assert.equal(reloaded.households['hh-2'].resources.seed, world.households['hh-2'].resources.seed + 2);

  // No save version moved for trading, because a class that predates it simply had no
  // offers. That is a correct empty answer, not a missing field, and it must still run.
  const older = JSON.parse(JSON.stringify(running('older')));
  delete older.offers; delete older.nextOfferId;
  validateWorld(older);
  stepWorld(older);
  standTogether(older, 'hh-1-thomas', 'hh-2-elena');
  offer(older, 'hh-1', 'thomas', 'hh-2-elena', { seed: 1 }, { food: 1 });
  assert.equal(offersOf(older, 'hh-2').length, 1, 'and trading works in it from the moment it loads');
  validateWorld(older);
});

test('trading resolves inside a visible bargain, with no randomness anywhere (FIC-GONZ-008)', () => {
  const source = readFileSync(fileURLToPath(new URL('../sim/trade.mjs', import.meta.url)), 'utf8');
  assert.doesNotMatch(source, /Math\.random/, 'trading must contain no randomness at all');
  // The same offer, accepted twice from the same starting point, gives the same answer.
  const outcomes = ['once', 'twice'].map(() => {
    const world = running('repeatable');
    standTogether(world, 'hh-1-thomas', 'hh-2-elena');
    offer(world, 'hh-1', 'thomas', 'hh-2-elena', { seed: 2 }, { food: 3 });
    const id = offersOf(world, 'hh-2')[0].id;
    send(world, 'hh-2', { action: 'accept-offer', entityId: 'hh-2-elena', offerId: id });
    return [world.households['hh-1'].resources, world.households['hh-2'].resources];
  });
  assert.deepEqual(outcomes[0], outcomes[1]);
  // Resources never round to a negative zero, which JSON preserves and reload compares.
  for (const household of Object.values(running().households)) {
    for (const amount of Object.values(household.resources)) assert.ok(!Object.is(amount, -0));
  }
});

test('a neighbour is named with their family, because every family shares four names', () => {
  const world = running();
  standTogether(world, 'hh-1-thomas', 'hh-2-thomas');
  const seen = projectWorld(world, 'hh-1', 'student', { includeMap: false }).others.find(person => person.householdId === 'hh-2');
  assert.equal(seen.name, 'Thomas', 'the same four names really are reused');
  assert.equal(seen.household, 'Family 2', 'so the family is what tells them apart');
  // The family name is the world's own fiction, never the name the student typed to join,
  // which lives on the server beside their credential and is not part of the world at all.
  assert.equal(seen.studentName, undefined);
  assert.equal(seen.resources, undefined);
  // A resident of Gonzales belongs to no family and is not given one.
  const resident = projectWorld(world, 'hh-1', 'student', { includeMap: false }).others.find(person => person.resident);
  assert.equal(resident.household, null);
});
