// The Runaway Scrape's own work for a family that has to run, children and grown-ups (sim/flight-work.mjs; owner 2026-09-26,
// docs/CHILDREN.md §7): each offered only while the family is told to leave, on the road or camped, and each doing what it says.
//
// The class is the road's own (tests/road.test.mjs): the real land played through two periods into the spring, its first family
// at Gonzales. Every test was seen failing alone against the regression it guards - `node scripts/childhood-injections.mjs`.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, projectWorld, rollFamily, stepWorld, validateWorld } from '../sim/world.mjs';
import { beginSecondPeriod, beginThirdPeriod } from '../sim/periods.mjs';
import { CHORES } from '../sim/chores.mjs';
import { CARRIED_ROOM, FLIGHT_SPACE, flightRoom } from '../sim/scrape.mjs';
import { WARNING_MILES, carriedRoom } from '../sim/road.mjs';
import { BUNDLE_ROOM, COW_PACE, FERRY_HELP_HOURS, FLIGHT_WORKS, FORD_MILES, HIDE_ROOM, LOOKOUT_MILES, MILK_A_DAY, SHARED_FOOD, SICK_FIRST_SHARE, SINGING_SHARE, digUpCache, fireKept, lookoutMiles, milkCow } from '../sim/flight-work.mjs';
import { herdOf } from '../sim/stock.mjs';
import { abandonWagon, moveOn, overtake } from '../sim/road.mjs';
import { turnHome } from '../sim/scrape.mjs';
import { LEAD_PACE } from '../sim/beasts.mjs';
import { WAGON_SPEED } from '../sim/travel.mjs';
import { canAnswerCalls } from '../sim/family.mjs';
import { isEarlyTopic } from '../sim/early-word.mjs';

const SEED = 'road-1638';
const DAY = 1440;
const view = (world, householdId) => projectWorld(world, householdId, 'student', { includeMap: false });
const until = (world, done, limit = 3000) => { for (let t = 0; t < limit && !done() && world.status === 'running'; t++) stepWorld(world); };
const main = (world, household) => world.entities[household.mainId || household.principalId];
const people = (world, household) => household.members.map(id => world.entities[id]).filter(one => one.kind === 'person');
const offered = (world, household, person, id) => view(world, household.id).work[person.id]?.find(entry => entry.id === id);

let shared = null;
const spring = () => structuredClone(shared ??= (() => {
  const world = createGonzalesWorld(SEED, 8, { map: 'colonies' });
  for (const household of Object.values(world.households)) rollFamily(world, household);
  world.status = 'running';
  until(world, () => world.director.complete, 9000);
  beginSecondPeriod(world); world.status = 'running';
  until(world, () => world.director.complete, 9000);
  beginThirdPeriod(world); world.status = 'running';
  return world;
})());
/** The first family, a student's, on the land at Gonzales; told to leave on the first tick of the spring. */
function ordered(world) {
  const household = world.households['hh-1'];
  household.played = true;
  stepWorld(world);
  assert.equal(household.flight?.status, 'ordered', 'the first family was not told to leave');
  return household;
}
/** Its children given the ages a test is about, oldest first; anybody else a grown son. */
function children(world, household, ...ages) {
  const kids = people(world, household).filter(one => ['son', 'daughter'].includes(one.kin?.role));
  kids.forEach((kid, at) => { kid.age = ages[at] ?? 17; kid.task = kid.age >= 16 ? 'work' : 'rest'; kid.health = { condition: 'well' }; });
  return kids;
}
/** No beast of the family fit to go: the family leaves on foot. */
const onFoot = (world, household) => { for (const id of household.property) { const beast = world.entities[id]; if (beast) beast.condition = 'lame'; } };
const flee = (world, household, take = {}) => { household.resources.food = Math.max(household.resources.food ?? 0, (take.food ?? 0) + 5); applyAction(world, household.id, { action: 'flee', entityId: main(world, household).id, take, refuge: 'san-felipe' }); assert.equal(household.flight.status, 'fled'); };
const runChore = (world, person, limit = 40) => until(world, () => !person.chore, limit);

test('the rule: the flight’s work is offered only while the family is told to leave (or has heard real news, D9), on the road or camped - never on the farm before', () => {
  const world = spring();
  const household = world.households['hh-1'];
  household.played = true;
  const father = main(world, household);
  // A family that has heard of the Alamo's fall may make ready before its order (owner, 2026-09-29, sim/early-word.mjs), so this
  // family is made one that has heard nothing yet; tests/early-leaving.test.mjs has the news.
  for (const id of Object.keys(world.knowledge.households[household.id])) if (isEarlyTopic(id)) delete world.knowledge.households[household.id][id];
  for (const id of FLIGHT_WORKS) assert.equal(offered(world, household, father, id), undefined, `${id} was offered before anybody was told to leave`);
  ordered(world);
  const [kid] = children(world, household, 8);
  assert.equal(offered(world, household, father, 'flee-hide')?.can, true, 'the family told to leave cannot hide its things');
  assert.equal(offered(world, household, kid, 'flee-bundle')?.can, true, 'a child of eight cannot make up a bundle');
  assert.equal(offered(world, household, father, 'flee-bundle'), undefined, 'a grown man was offered a child’s bundle');
  assert.equal(offered(world, household, father, 'road-lookout'), undefined, 'the road’s work was offered on the farm');
  assert.throws(() => applyAction(world, household.id, { action: 'chore', entityId: kid.id, chore: 'road-lookout' }), /not on the road east/);
  // Every one of them has a sentence and an icon on the panel.
  for (const id of FLIGHT_WORKS) assert.ok(CHORES[id]?.flight, `${id} is not on the chore table`);
});

test('the rule: what is hidden before the family leaves is kept from the fire and dug up at home, and nothing else is', () => {
  const world = spring();
  const household = ordered(world);
  const father = main(world, household);
  household.resources = { ...household.resources, food: 20, seed: 30, powder: 20, cotton: 10 };
  applyAction(world, household.id, { action: 'chore', entityId: father.id, chore: 'flee-hide' });
  runChore(world, father);
  assert.equal(household.flight.hid, true, 'the hiding never finished');
  assert.match(offered(world, household, father, 'flee-hide')?.why || '', /hidden what it can already/);
  flee(world, household, { food: 20 });
  const cache = household.flight.cache;
  assert.ok(cache, 'nothing was hidden');
  const room = Object.entries(cache).reduce((sum, [good, amount]) => sum + amount * FLIGHT_SPACE[good], 0);
  assert.ok(room <= HIDE_ROOM + 1e-9 && room > HIDE_ROOM - 1, `the cache is ${room} of the wagon’s room`);
  assert.equal(cache.food, undefined, 'food was hidden to rot');
  assert.equal(cache.powder, 20, 'the powder, which is hidden first, was not all hidden');
  // What is hidden is not left in the house for the fire.
  for (const [good, amount] of Object.entries(cache)) assert.equal((household.flight.left?.[good] ?? 0) + amount, { seed: 30, powder: 20, cotton: 10 }[good], `${good} was hidden and left both`);
  const before = { ...household.resources };
  digUpCache(world, household);
  for (const [good, amount] of Object.entries(cache)) assert.equal(household.resources[good], (before[good] ?? 0) + amount, `the ${good} hidden did not come home`);
  assert.equal(household.flight.cache, undefined);
  validateWorld(world);
});

test('the rule: each child’s bundle carries more of the family’s goods on foot, leaving and on the road', () => {
  const world = spring();
  const household = ordered(world);
  const kids = children(world, household, 9, 6, 3);
  onFoot(world, household);
  const bare = flightRoom(world, household);
  assert.equal(bare.mode, 'foot');
  for (const kid of kids.slice(0, 2)) { applyAction(world, household.id, { action: 'chore', entityId: kid.id, chore: 'flee-bundle' }); runChore(world, kid, 20); }
  assert.deepEqual(household.flight.bundles?.sort(), kids.slice(0, 2).map(kid => kid.id).sort(), 'the bundles were not made up');
  assert.equal(offered(world, household, kids[2], 'flee-bundle'), undefined, 'a child of three was offered a bundle');
  assert.equal(flightRoom(world, household).room, Math.round((bare.room + 2 * BUNDLE_ROOM) * 100) / 100, 'the bundles carry nothing more on foot');
  const grown = people(world, household).filter(canAnswerCalls).length;
  flee(world, household, { food: Math.floor(flightRoom(world, household).room / FLIGHT_SPACE.food) });
  assert.equal(carriedRoom(world, household), Math.round((grown * CARRIED_ROOM + 2 * BUNDLE_ROOM) * 100) / 100, 'the bundles are not carried on the road');
});

test('the rule: on the road a lookout sees the army further off, singing wears the walkers less, and the little ones kept walking let the family go faster', () => {
  const world = spring();
  const household = ordered(world);
  const [older, small] = children(world, household, 9, 4);
  onFoot(world, household);
  flee(world, household, { food: 10 });
  stepWorld(world);
  // The lookout: word at thirty miles, not twenty, while somebody watches.
  assert.equal(lookoutMiles(world, household, WARNING_MILES), WARNING_MILES);
  applyAction(world, household.id, { action: 'chore', entityId: older.id, chore: 'road-lookout' });
  if (older.chore?.dawdle) until(world, () => !older.chore?.dawdle, 4);
  assert.equal(older.chore?.id, 'road-lookout', 'a child of nine could not watch the road');
  assert.equal(lookoutMiles(world, household, WARNING_MILES), LOOKOUT_MILES, 'the lookout sees no further');
  const glowing = view(world, household.id).entities.find(one => one.id === older.id).chore?.id;
  assert.equal(glowing, 'road-lookout', 'the page is not told the child is at it');
  older.chore = null;
  // The little ones kept walking: a child of four walking holds the family to a child's pace; kept by the hand, it goes faster.
  assert.ok(small.travel?.afoot && !small.travel.carried, 'the child of four is not walking');
  const slow = small.travel.speed;
  applyAction(world, household.id, { action: 'chore', entityId: older.id, chore: 'road-little-ones' });
  until(world, () => older.chore && !older.chore.dawdle, 4);
  stepWorld(world);
  assert.ok(small.travel.speed > slow, `the family did not go faster with the little ones kept walking: ${small.travel.speed} against ${slow}`);
  older.chore = null;
  stepWorld(world);
  assert.equal(small.travel.speed, slow, 'the family kept the faster pace when nobody was keeping the little ones walking');
  // Singing: the family's walkers are worn at three quarters for the same road.
  const walker = people(world, household).find(one => one.travel?.afoot && !one.travel.carried && canAnswerCalls(one));
  const worn = sing => {
    const copy = structuredClone(world);
    const them = copy.households[household.id];
    const who = copy.entities[walker.id];
    who.exertion = 0;
    if (sing) { applyAction(copy, them.id, { action: 'chore', entityId: small.id, chore: 'road-sing' }); copy.entities[small.id].chore.dawdle = 0; }
    for (let t = 0; t < 3; t++) stepWorld(copy);
    return copy.entities[walker.id].exertion;
  };
  const plain = worn(false), sung = worn(true);
  assert.ok(plain > 0, 'the walker was not worn by the road at all');
  // Three quarters, the documented share (docs/CHILDREN.md §7), written out: a share quietly set to one would match itself.
  assert.equal(SINGING_SHARE, 0.75);
  assert.ok(Math.abs(sung - plain * 0.75) < 1e-3, `singing did not wear the walkers at three quarters: ${sung} against ${plain}`);
});

test('the rule: camped at a crossing a fire keeps the cold off, a hand at the ferry brings the turn sooner once, food can be shared, and on foot the little ones can be carried over', () => {
  const world = spring();
  const household = ordered(world);
  const [kid] = children(world, household, 6);
  onFoot(world, household);
  flee(world, household, { food: 10 });
  until(world, () => household.flight.crossing, 400);
  assert.ok(household.flight.crossing, 'the family never came to a crossing');
  const father = main(world, household);
  const crossing = household.flight.crossing, until0 = crossing.until;
  // At the same moment: the child of six keeps the fire, the father lends a hand at the ferry, and a family camps beside them.
  const other = Object.values(world.households).find(one => one.id !== household.id && !one.flight);
  other.flight = { status: 'refuged', refuge: crossing.siteId, crossed: [] };
  applyAction(world, household.id, { action: 'chore', entityId: kid.id, chore: 'camp-fire' });
  applyAction(world, household.id, { action: 'chore', entityId: father.id, chore: 'ferry-help' });
  if (kid.chore) delete kid.chore.dawdle;
  runChore(world, father, 4);
  runChore(world, kid, 4);
  assert.equal(father.chore, null, 'the help at the ferry never finished');
  assert.ok(household.flight.crossing, 'the crossing was over before the help could matter, so this proves nothing');
  assert.equal(household.flight.crossing.until, until0 - FERRY_HELP_HOURS * 60, 'the turn came no sooner for the help');
  assert.match(offered(world, household, father, 'ferry-help')?.why || '', /helped at this crossing already/, 'the ferry could be helped twice at one crossing');
  // The fire, kept tonight and still in last night's.
  const day = Math.floor(world.minute / DAY);
  assert.equal(fireKept(household, day), true, 'the fire was not kept');
  assert.equal(fireKept(household, day + 1), true, 'the fire did not last the night');
  assert.equal(fireKept(household, day + 2), false, 'a fire kept once lasts for ever');
  // Sharing: the family camped beside them has the food, and is told.
  const theirs = other.resources.food ?? 0, ours = household.resources.food;
  applyAction(world, household.id, { action: 'chore', entityId: father.id, chore: 'share-food' });
  runChore(world, father, 4);
  // Less what they ate at home in the ticks it took (they are camped here in this test's telling only, and eat at their own house).
  const got = (other.resources.food ?? 0) - theirs;
  assert.ok(got > SHARED_FOOD - 0.6 && got <= SHARED_FOOD + 1e-9, `the other family was given ${got}`);
  assert.ok(household.resources.food < ours, 'the food came from nowhere');
  assert.ok(world.events.some(event => event.householdId === other.id && /sent 1 food over to yours/.test(event.text)), 'the family given it was not told');
  delete other.flight;
});

test('the rule: a family on foot can carry its little ones over a crossing below its banks rather than wait, and is worn by it; a sick child is let over first', () => {
  const world = spring();
  const household = ordered(world);
  children(world, household, 5);
  onFoot(world, household);
  flee(world, household, { food: 10 });
  until(world, () => household.flight.crossing, 400);
  const crossing = household.flight.crossing;
  assert.ok(crossing);
  const father = main(world, household);
  const entry = offered(world, household, father, 'ford-carry');
  assert.equal(entry?.can, true, `this seed's crossing cannot be waded, so this proves nothing: ${entry?.why}`);
  {
    const worn = father.exertion || 0;
    applyAction(world, household.id, { action: 'chore', entityId: father.id, chore: 'ford-carry' });
    runChore(world, father, 6);
    assert.ok(!household.flight.crossing || household.flight.crossing.siteId !== crossing.siteId, 'the family still waited for the boat');
    assert.ok((household.flight.crossed || []).includes(crossing.siteId));
    assert.ok((father.exertion || 0) >= worn + FORD_MILES - 1e-6 || father.health.condition === 'tired', 'wading over wore nobody');
  }
  // A sick child: the ferryman lets the family over first.
  const sick = spring();
  const theirs = ordered(sick);
  const [child] = children(sick, theirs, 4);
  flee(sick, theirs, { food: 10 });
  child.health = { condition: 'sick', recoversAt: sick.minute + 30 * DAY };
  until(sick, () => theirs.flight.crossing, 400);
  const wait = (theirs.flight.crossing.until - sick.minute) / 60;
  assert.ok(wait <= 18 * SICK_FIRST_SHARE + 1, `a family with a sick child waited ${wait} hours`);
  assert.ok(sick.events.some(event => /letting families with sick children over first/.test(event.text)));
});

test('the rule: a child’s flight work is a job, and a child’s obedience governs it as at home', () => {
  const tries = roll => {
    let slow = 0;
    for (let n = 0; n < 10; n++) {
      const world = spring();
      const household = ordered(world);
      const [kid] = children(world, household, 8);
      kid.traits = { ...kid.traits, obedience: roll };
      world.tick += n * 13;
      applyAction(world, household.id, { action: 'chore', entityId: kid.id, chore: 'flee-bundle' });
      if (kid.chore?.dawdle) slow++;
    }
    return slow;
  };
  assert.ok(tries(1) > tries(20), 'a child of roll 1 dawdled over the bundle no more than one of roll 20');
});

// The milk cow (owner, 2026-09-27, by multiple choice: "Yes, one cow"; FIC-GONZ-631). Amends docs/STOCK.md, which leaves the whole
// herd on the range: one cow may go, driven by a child, from a family that had cattle; a little milk a day; lost if overtaken.
test('the rule: one milk cow on the run - only a family with cattle, driven by a child, taken out of the herd left on the range', () => {
  const world = spring();
  const household = ordered(world);
  const [kid, small] = children(world, household, 9, 4);
  const father = main(world, household);
  household.herd = { cattle: 6, hogs: 12 };
  assert.equal(offered(world, household, kid, 'flee-cow')?.can, true, 'a child of nine with cattle at home cannot take the milk cow');
  assert.equal(offered(world, household, father, 'flee-cow'), undefined, 'a grown man was offered the child’s cow');
  assert.equal(offered(world, household, small, 'flee-cow'), undefined, 'a child of four was offered the cow');
  // A family with no cattle is not offered it at all, and refused it in words.
  const none = spring();
  const bare = ordered(none);
  const [theirKid] = children(none, bare, 9);
  bare.herd = { cattle: 0, hogs: 12 };
  assert.equal(offered(none, bare, theirKid, 'flee-cow'), undefined, 'a family with no cattle was offered a milk cow');
  assert.throws(() => applyAction(none, bare.id, { action: 'chore', entityId: theirKid.id, chore: 'flee-cow' }), /no cattle/);
  // The child catches her up; the family leaves; she comes out of the herd and the rest is left on the range.
  applyAction(world, household.id, { action: 'chore', entityId: kid.id, chore: 'flee-cow' });
  runChore(world, kid);
  assert.equal(household.flight.cow?.by, kid.id, 'the child never put a rope on the cow');
  assert.match(offered(world, household, kid, 'flee-cow')?.why || '', /has the milk cow on a rope already/);
  flee(world, household, { food: 10 });
  assert.equal(household.flight.cow?.by, kid.id, 'the cow did not go with the family');
  assert.deepEqual(household.herdLeft, { cattle: 5, hogs: 12 }, 'the cow was left on the range with the herd, or more went');
  assert.ok(world.events.some(event => event.householdId === household.id && event.text.startsWith(`${kid.name} drives the milk cow along`)), 'the family was not told the cow is going');
  assert.equal(view(world, household.id).flight.cow?.by, kid.id, 'the page is not told who drives her');
  assert.equal(view(world, household.id).entities.find(one => one.id === kid.id).life, 'Driving the milk cow along behind the family.');
  validateWorld(world);
});

test('the rule: the milk cow gives a little milk a day, a child of a low roll lets her stray and loses the day’s milk, and she is never lost by herself', () => {
  const days = roll => {
    const world = spring();
    const household = ordered(world);
    const [kid] = children(world, household, 9);
    kid.traits = { ...kid.traits, obedience: roll };
    household.herd = { cattle: 6, hogs: 0 };
    applyAction(world, household.id, { action: 'chore', entityId: kid.id, chore: 'flee-cow' });
    runChore(world, kid);
    flee(world, household, { food: 10 });
    let milked = 0, strayed = 0;
    for (let d = 0; d < 60; d++) {
      world.minute += DAY;
      const food = household.resources.food;
      milkCow(world, household);
      const got = Math.round((household.resources.food - food) * 10000) / 10000;
      if (got === MILK_A_DAY) milked++; else if (household.flight.cow?.strayDay === Math.floor(world.minute / DAY)) strayed++;
      assert.ok(household.flight.cow, `the cow was lost on day ${d} with nobody overtaking the family`);
    }
    validateWorld(world);
    return { milked, strayed, world, kid };
  };
  const good = days(20), bad = days(1);
  assert.equal(good.milked + good.strayed, 60, 'a day went by with neither milk nor a stray');
  assert.equal(bad.milked + bad.strayed, 60);
  assert.ok(good.milked >= 55, `a child of roll 20 kept the cow in milk only ${good.milked} days of 60`);
  assert.ok(bad.strayed > good.strayed + 5, `a child of roll 1 let her stray ${bad.strayed} days and one of roll 20 ${good.strayed}`);
  assert.ok(bad.world.events.some(event => event.text.startsWith(`The milk cow got away from ${bad.kid.name} into the brush`)), 'a stray was not told');
});

test('the rule: the milk cow is taken if the Mexican army comes up with the family, and home again she goes back into the herd', () => {
  const setOut = () => {
    const world = spring();
    const household = ordered(world);
    const [kid] = children(world, household, 10);
    household.herd = { cattle: 6, hogs: 12 };
    applyAction(world, household.id, { action: 'chore', entityId: kid.id, chore: 'flee-cow' });
    runChore(world, kid);
    flee(world, household, { food: 10 });
    assert.equal(household.flight.cow?.by, kid.id);
    return { world, household };
  };
  const caught = setOut();
  overtake(caught.world, caught.household, { id: 'test-column', name: 'A Mexican column', toward: 'san-felipe' });
  assert.equal(caught.household.flight.cow, undefined, 'the army left the family its cow');
  assert.ok(caught.world.events.some(event => event.householdId === caught.household.id && /came up with the family.*the milk cow/.test(event.text)), 'the family was not told the cow was taken');
  validateWorld(caught.world);
  // Home: everybody off the road at home, the family returning, and the next tick brings them in.
  const { world, household } = setOut();
  const cattle = herdOf(household).cattle;
  household.flight.status = 'returning';
  for (const id of [...household.members, ...household.property]) {
    const one = world.entities[id];
    if (!one?.travel) continue;
    one.travel = null; one.task = 'rest';
    one.location = { x: world.map.sites[household.homeSiteId].x, y: world.map.sites[household.homeSiteId].y, siteId: household.homeSiteId };
  }
  stepWorld(world);
  assert.equal(household.flight.status, 'home');
  assert.equal(household.flight.cow, undefined);
  assert.ok(herdOf(household).cattle >= cattle + 1, `the cow did not go back into the herd: ${herdOf(household).cattle} cattle, ${cattle} before`);
  assert.ok(world.events.some(event => event.householdId === household.id && /The milk cow came home with the family/.test(event.text)), 'the cow’s coming home was not told');
  validateWorld(world);
});

// The milk cow's pace (owner, 2026-09-27, by multiple choice: "Slow a family on foot"; FIC-GONZ-631 amended): on foot the family
// goes at hers, which is the pace the game gives cattle driven on the road (sim/beasts.mjs LEAD_PACE, the ox's); with a wagon it is
// not slowed by her. The driver's row and the flight card say why.
test('the rule: a family on foot goes at the milk cow’s pace, and one with a wagon is not slowed by her', () => {
  assert.equal(COW_PACE, LEAD_PACE.cattle, 'the cow does not go at the pace the game gives cattle on the road');
  assert.equal(COW_PACE, WAGON_SPEED, 'a cow driven on foot does not go at the ox’s pace');
  const onRoad = (world, household) => people(world, household).filter(one => one.travel?.purpose === 'flee' || one.travel?.purpose === 'return');
  const leave = ({ cow = true, foot = true, ages = [10] } = {}) => {
    const world = spring();
    const household = ordered(world);
    const [kid] = children(world, household, ...ages);
    household.herd = { cattle: 6, hogs: 0 };
    if (foot) onFoot(world, household);
    if (cow) { applyAction(world, household.id, { action: 'chore', entityId: kid.id, chore: 'flee-cow' }); runChore(world, kid); }
    flee(world, household, { food: 4 });
    return { world, household, kid };
  };
  const lifeOf = (world, household, person) => view(world, household.id).entities.find(one => one.id === person.id).life;
  // On foot without her the family walks at a walker's pace; with her, at hers - every one of it - and says why.
  const alone = leave({ cow: false });
  assert.equal(alone.household.flight.mode, 'foot');
  assert.ok(onRoad(alone.world, alone.household).every(one => one.travel.speed > COW_PACE), 'a family on foot with no cow went at a cow’s pace');
  const walking = leave();
  assert.equal(walking.household.flight.mode, 'foot');
  const going = onRoad(walking.world, walking.household);
  assert.ok(going.length > 1);
  for (const one of going) {
    assert.equal(one.travel.speed, COW_PACE, `${one.name} on foot with the milk cow went at ${one.travel.speed} a tick, not hers`);
    assert.equal(one.travel.cow, true);
  }
  assert.equal(view(walking.world, walking.household.id).flight.cowPace, true, 'the flight card is not told the cow is why the family is slower');
  assert.equal(lifeOf(walking.world, walking.household, walking.kid), 'Driving the milk cow along behind the family: on foot, they all go at her slower pace.');
  validateWorld(walking.world);
  // The road home on foot: at her pace again.
  const { world, household } = walking;
  household.flight.status = 'refuged';
  const refuge = world.map.sites[household.flight.refuge];
  for (const id of [...household.members, ...household.property]) {
    const one = world.entities[id];
    if (!one?.travel) continue;
    one.travel = null; one.task = 'rest'; one.location = { x: refuge.x, y: refuge.y, siteId: refuge.id };
  }
  assert.equal(view(world, household.id).flight.cowPace, undefined, 'camped, the family is still said to be held to the cow');
  // On to a further refuge, on foot with her: at her pace.
  const camped = () => { household.flight.status = 'refuged'; for (const one of onRoad(world, household)) { const at = world.map.sites[household.flight.refuge]; one.travel = null; one.task = 'rest'; one.location = { x: at.x, y: at.y, siteId: at.id }; } };
  assert.equal(moveOn(world, household, 'lynchburg'), true, 'the family could not go on to Lynchburg');
  assert.ok(onRoad(world, household).every(one => one.travel.speed === COW_PACE && one.travel.cow), `on to a further refuge with the cow the family went at ${onRoad(world, household).map(one => one.travel.speed)}`);
  camped();
  turnHome(world, null);
  assert.equal(household.flight.status, 'returning');
  const home = onRoad(world, household);
  assert.ok(home.length > 1 && home.every(one => one.travel.speed === COW_PACE && one.travel.cow), `home on foot with the cow the family went at ${home.map(one => one.travel.speed)}`);
  validateWorld(world);
  // With the wagon she slows nobody: the family goes at the ox's pace, as with no cow, and nobody is said to be held to her.
  const wagon = leave({ foot: false });
  assert.equal(wagon.household.flight.mode, 'wagon');
  for (const one of onRoad(wagon.world, wagon.household)) {
    assert.equal(one.travel.speed, WAGON_SPEED, `${one.name} with the wagon and the cow went at ${one.travel.speed}`);
    assert.equal(one.travel.cow, undefined, `${one.name} with the wagon is said to be held to the cow`);
  }
  assert.equal(view(wagon.world, wagon.household.id).flight.cowPace, undefined, 'a family with a wagon is told the cow slows it');
  assert.equal(lifeOf(wagon.world, wagon.household, wagon.kid), 'Driving the milk cow along behind the family.');
  // The wagon left in the mud: on foot now, at her pace.
  abandonWagon(wagon.world, wagon.household);
  assert.ok(onRoad(wagon.world, wagon.household).every(one => one.travel.speed === COW_PACE && one.travel.cow), 'on foot after leaving the wagon, the family did not go at the cow’s pace');
  // Overtaken, the cow is taken, and nobody is held to her.
  overtake(wagon.world, wagon.household, { id: 'test-column', name: 'A Mexican column', toward: 'san-felipe' });
  assert.ok(onRoad(wagon.world, wagon.household).every(one => one.travel.cow === undefined && one.travel.speed > COW_PACE), 'the cow taken, the family is still held to her pace');
  assert.equal(view(wagon.world, wagon.household.id).flight.cowPace, undefined);
  validateWorld(wagon.world);
  // A small child walking holds the family slower than the cow, who slows it no further; kept walking by the hand, the family goes
  // at hers and no faster (sim/flight-work.mjs `road-little-ones`).
  const small = leave({ ages: [10, 4] });
  const pace = () => onRoad(small.world, small.household).map(one => one.travel.speed);
  assert.ok(pace().every(speed => speed < COW_PACE), `with a child of four walking the family went at ${pace()}`);
  assert.equal(view(small.world, small.household.id).flight.cowPace, undefined, 'the cow is said to slow a family already slower than she is');
  applyAction(small.world, small.household.id, { action: 'chore', entityId: small.kid.id, chore: 'road-little-ones' });
  stepWorld(small.world);
  assert.ok(pace().every(speed => speed === COW_PACE), `the little ones kept walking, the family went at ${pace()}, not the cow’s pace`);
  validateWorld(small.world);
});
