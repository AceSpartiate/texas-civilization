// The general store, and the crop nobody can eat.
//
// The owner: "there might could be a general store in each town. when players take their
// crops to sell for money, maybe they can buy more powder and shot?"
//
// Two ideas in that, and one of them was already a defect. **A cotton field came in as
// food** - a family grew cotton and ate it, which is not a balance choice, it is the game
// not knowing what the crop was. `HIST-GONZ-013` documents corn and cotton for this
// locality, and `HIST-GONZ-022` is what they were each for: corn was the staple the colony
// lived on, cotton was ginned and shipped.
//
// The other idea is money, and it is the one thing here that was **not** built. Specie was
// scarce enough in Mexican Texas that barter was the ordinary way of doing business, so a
// store that takes a family's cotton and hands back what it needs is nearer the period
// than a counter full of coin - and one fewer number for a twelve-year-old to track.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, projectWorld, stepWorld, validateWorld } from '../sim/world.mjs';
import { COTTON_RATE, CHORES, choreAvailability } from '../sim/chores.mjs';
import { MODES } from '../sim/travel.mjs';
import { GOODS } from '../sim/trade.mjs';
import { traderAt } from '../sim/town.mjs';

const running = (seed = 'store', count = 5) => {
  const built = createGonzalesWorld(seed, count);
  built.status = 'running';
  return built;
};
/** A household in this world growing the crop asked for. */
function growing(world, crop) {
  for (const household of Object.values(world.households)) if (household.field.crop === crop) return household;
  return null;
}
function work(world, householdId, entityId, chore, mode) {
  applyAction(world, householdId, { action: 'chore', entityId, chore, ...(mode && { mode }) });
  for (let tick = 0; tick < 600 && world.entities[entityId].chore; tick++) stepWorld(world);
  assert.equal(world.entities[entityId].chore, null, `${chore} never finished`);
}
const ripen = household => { household.field = { ...household.field, state: 'ripe', changedTick: 0 }; };

test('a cotton field comes in as cotton, and a corn field as food', () => {
  const world = running('crops');
  const cotton = growing(world, 'cotton'), corn = growing(world, 'corn');
  assert.ok(cotton && corn, 'this world grows only one thing');
  for (const household of [cotton, corn]) {
    ripen(household);
    const before = { food: household.resources.food, cotton: household.resources.cotton ?? 0 };
    work(world, household.id, household.principalId, 'harvest-field');
    const grew = {
      food: household.resources.food - before.food,
      cotton: (household.resources.cotton ?? 0) - before.cotton,
    };
    if (household.field.crop === 'cotton') {
      assert.ok(grew.cotton > 0, 'a cotton field brought in no cotton');
      assert.ok(grew.food <= 0, `a cotton field brought in ${grew.food} food, which nobody grew`);
    } else {
      assert.ok(grew.food > 0, 'a corn field brought in no food');
      assert.equal(grew.cotton, 0);
    }
  }
  assert.ok(world.events.some(event => /Nobody can eat it; it has to go to the store/.test(event.text)),
    'a family brought in a crop it cannot eat and was never told');
});

test('nobody eats cotton while it sits in the house', () => {
  const world = running('crops');
  const household = growing(world, 'cotton');
  ripen(household);
  work(world, household.id, household.principalId, 'harvest-field');
  const bales = household.resources.cotton;
  assert.ok(bales > 0);
  const food = household.resources.food;
  for (let tick = 0; tick < 120; tick++) stepWorld(world);
  assert.equal(household.resources.cotton, bales, 'the cotton was eaten');
  assert.ok(household.resources.food < food, 'and the family was living on air');
});

test('the store takes it, at a rate the control states before anybody sets out', () => {
  const world = running('crops');
  const household = growing(world, 'cotton');
  household.resources.cotton = 4;
  const carrier = world.entities[household.members[1]];
  const food = household.resources.food;
  assert.match(CHORES['sell-cotton'].describe, new RegExp(`${COTTON_RATE} food for every bale`));
  work(world, household.id, carrier.id, 'sell-cotton');
  assert.equal(household.resources.cotton, 0, 'they came home with the cotton still on the wagon');
  assert.ok(household.resources.food > food + 4 * COTTON_RATE - 2, `brought home ${household.resources.food - food} food for four bales`);
  assert.ok(world.events.some(event => /sold 4 cotton at the store and brought home 8 food/.test(event.text)));
});

test('a bale is worth about twice what it weighs in corn, and only once it reaches town', () => {
  // The whole shape of a cash crop: more at the end, and nothing at all until then.
  assert.ok(COTTON_RATE > 1, 'cotton that trades one for one is corn with extra steps');
  const world = running('crops');
  const cotton = growing(world, 'cotton'), corn = growing(world, 'corn');
  for (const household of [cotton, corn]) ripen(household);

  const cornFood = (() => {
    const before = corn.resources.food;
    work(world, corn.id, corn.principalId, 'harvest-field');
    return corn.resources.food - before;
  })();
  // The cotton family's field is worth nothing to eat the moment it is cut...
  const beforeHarvest = cotton.resources.food;
  work(world, cotton.id, cotton.principalId, 'harvest-field');
  const bales = cotton.resources.cotton;
  assert.ok(bales > 0);
  assert.ok(cotton.resources.food - beforeHarvest <= 0, 'cutting cotton put food in the house');
  // ...and worth about twice the corn once somebody has walked it into Gonzales.
  const beforeTrip = cotton.resources.food;
  work(world, cotton.id, cotton.members[1], 'sell-cotton', 'wagon');
  const cottonFood = cotton.resources.food - beforeTrip;
  assert.ok(cottonFood > cornFood * 1.5,
    `a cotton field fetched ${cottonFood.toFixed(1)} food against ${cornFood.toFixed(1)} from a corn field`);
});

test('what one person can carry to market is what one person can carry', () => {
  const trip = mode => {
    const world = running('crops');
    const household = growing(world, 'cotton');
    household.resources.cotton = 30;
    const before = household.resources.food;
    work(world, household.id, household.members[1], 'sell-cotton', mode);
    return { sold: 30 - household.resources.cotton, got: household.resources.food - before };
  };
  const afoot = trip('foot'), hauled = trip('wagon');
  assert.equal(afoot.sold, MODES.foot.carry, `a person carried ${afoot.sold} bales in their arms`);
  assert.equal(hauled.sold, MODES.wagon.carry, `the wagon took ${hauled.sold} bales`);
  assert.ok(hauled.got > afoot.got * 3, 'the wagon is the difference between a trip and a load');
});

test('a family with no cotton is not offered the trip', () => {
  const world = running('crops');
  const corn = growing(world, 'corn');
  const refused = choreAvailability(world, corn, world.entities[corn.principalId], 'sell-cotton');
  assert.equal(refused.can, false);
  assert.match(refused.why, /Not enough cotton/);
  assert.throws(() => applyAction(world, corn.id, { action: 'chore', entityId: corn.principalId, chore: 'sell-cotton' }), /Not enough cotton/);
});

test('the store is one person, and she keeps it', () => {
  const world = running('crops');
  const keeper = traderAt(world, 'gonzales', 'cotton');
  assert.ok(keeper, 'nobody in Gonzales buys cotton');
  assert.equal(keeper.id, 'town-ibarra');
  // The same person sells the seed and the powder, which is what a general store is.
  for (const good of ['seed', 'powder', 'cotton']) {
    assert.equal(traderAt(world, 'gonzales', good)?.id, 'town-ibarra', `nobody at Gonzales deals in ${good}`);
  }
  assert.match(keeper.about, /general store/);
  // And the smith is somebody else, because a store is not a forge.
  assert.equal(traderAt(world, 'gonzales', 'iron')?.id, 'town-pike');
});

test('cotton can be traded to a neighbour, because a wagon is not the only way to town', () => {
  assert.ok(GOODS.includes('cotton'));
  const world = running('crops');
  const cotton = growing(world, 'cotton'), corn = growing(world, 'corn');
  cotton.resources.cotton = 6;
  const from = world.entities[cotton.principalId], to = world.entities[corn.principalId];
  world.entities[to.id].location = { ...from.location };
  applyAction(world, cotton.id, {
    action: 'offer', entityId: from.id, toEntityId: to.id, give: { cotton: 3 }, ask: { food: 4 },
  });
  const seen = projectWorld(world, corn.id, 'student', { includeMap: false }).offers;
  assert.ok(seen.length && JSON.stringify(seen).includes('cotton'), 'an offer of cotton never reached the neighbour');
});

test('a class saved before anybody grew cotton still opens, and grows some', () => {
  const world = running('crops');
  for (const household of Object.values(world.households)) delete household.resources.cotton;
  validateWorld(world);
  const household = growing(world, 'cotton');
  ripen(household);
  work(world, household.id, household.principalId, 'harvest-field');
  assert.ok(household.resources.cotton > 0);
  validateWorld(world);
});

test('there is no money in it, and that is the design rather than an omission', () => {
  // Specie was scarce enough in Mexican Texas that barter was the ordinary way of doing
  // business. A store that takes cotton and hands back food is nearer the period than a
  // counter full of coin, and it is one fewer number for a class to carry.
  assert.ok(!GOODS.some(good => /coin|money|peso|dollar|cash/i.test(good)), `GOODS holds ${GOODS.join(', ')}`);
  const world = running('crops');
  for (const household of Object.values(world.households)) {
    for (const held of Object.keys(household.resources)) {
      assert.ok(!/coin|money|peso|dollar|cash/i.test(held), `a household holds ${held}`);
    }
  }
});
