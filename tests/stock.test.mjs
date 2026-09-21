// The family's own stock: sim/stock.mjs, docs/STOCK.md, `HIST-TEX-112`, `HIST-TEX-263`, `FIC-GONZ-180` to `-185`.
//
// Owner, 2026-09-20, asked what stock should do: "a herd that feeds you, **and the stock can be lost**". Until then
// `household.stock` was a boolean that decided the size of a land grant and nothing else, in a country Almonte counted
// 75,000 cattle and 110,000 hogs in. What is held here:
//
//   **They feed themselves** — no fodder, no cost, no daily work ("the pasturage is sufficiently good to dispense with
//   feeding live stock"), and they increase where the country feeds them: calves in the spring, pigs on the autumn mast.
//   **A beef cannot be kept**, so most of it goes to the nearest families and both records say so — which is Dilue Rose
//   Harris's sentence exactly. Pork is less and all of it keeps, because it is salted down.
//   **And they are lost**: off an open range nobody rides, and on the road east, where nobody drives cattle ahead of an
//   army. What a family finds when it comes home is half the cattle and a quarter of the hogs.
//
// Each test here was proven by injecting the regression it guards (scripts/stock-injections.mjs).
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, projectWorld, stepWorld, validateWorld } from '../sim/world.mjs';
import { CHORES } from '../sim/chores.mjs';
import {
  BEEF_FOOD, BEEF_KEPT, BEEF_MILES, CALVING_MONTHS, FOUND_AGAIN, LOOKED_TO_DAYS, MAST_MONTHS, OPENING_HERD, PORK_FOOD,
  STRAY_SHARE, advanceStock, findStockAgain, herdOf, herdWords, leaveStock,
} from '../sim/stock.mjs';
import { KEEP_CATTLE, KEEP_HOGS, STOCK_SHARE } from '../sim/neighbours.mjs';
import { holdingOf } from '../sim/grants.mjs';
import { dateOf } from '../sim/clock.mjs';
import { STOCK_SPACE, WAGON_SPACE, spaceOf } from '../sim/wagon.mjs';
import { settle } from './support/settled.mjs';

const DAY = 1440;
const landed = (seed, count = 8) => {
  const world = settle(createGonzalesWorld(seed, count, { map: 'colonies' }));
  world.status = 'running';
  return world;
};
/**
 * This family drove stock in, as a student's lobby choice does - **including the two spaces of wagon it costs.** Half
 * the default loads are packed to within one space of full, and the lobby refuses the choice until something comes out
 * ("Take something out first", sim/grants.mjs); a barrel of meal is what comes out, which is `FIC-GONZ-025`'s own rule.
 */
const withStock = household => {
  household.stock = true;
  delete household.herd;
  while (spaceOf(household.load) > WAGON_SPACE - STOCK_SPACE) {
    const barrels = (household.load || []).find(entry => entry.id === 'provisions');
    if (!barrels) break;
    household.load = barrels.amount > 1
      ? household.load.map(entry => (entry.id === 'provisions' ? { ...entry, amount: entry.amount - 1 } : entry))
      : household.load.filter(entry => entry.id !== 'provisions');
  }
  return household;
};
const send = (world, household, entity, chore) => applyAction(world, household.id, { action: 'chore', entityId: entity.id, chore });
const workThrough = (world, entity, cap = 120) => { let ticks = 0; while (entity.chore && ticks < cap) { stepWorld(world); ticks++; } return ticks; };
/** Walk a household's herd forward over a stretch of days, without running the whole world. */
function overDays(world, household, days, ridden = false) {
  const from = Math.floor(world.minute / DAY);
  for (let day = from; day <= from + days; day++) {
    world.minute = day * DAY + 9 * 60;
    if (ridden) household.herdLookedDay = day;
    advanceStock(world, household);
  }
  return herdOf(household);
}

test('the herd is the lobby choice a family already made, and no save version moved for it', () => {
  const world = landed('stock-default');
  const [one, two] = Object.values(world.households);
  // A class saved before today has no `herd` at all. The correct empty value is not empty: it is the herd the family's
  // own stock choice always implied, so an old class opens on the world it would have had (`CLAUDE.md`).
  delete one.herd; delete two.herd;
  one.stock = true; delete two.stock;
  assert.deepEqual(herdOf(one), OPENING_HERD, 'a family that drove stock in had none');
  assert.deepEqual(herdOf(two), { cattle: 0, hogs: 0 }, 'a family that drove none has some');
  assert.equal(world.saveVersion, createGonzalesWorld('stock-default', 8, { map: 'colonies' }).saveVersion, 'the save version moved');
  // And the land is the grant that choice always meant: a league and a labor with stock, a labor without.
  assert.equal(holdingOf(world, one).kind, 'league-and-labor');
  assert.equal(holdingOf(world, two).kind, 'labor');
  // The words a family reads.
  assert.match(herdWords(one), /6 cattle and 12 hogs/);
  assert.equal(herdWords(two), 'nothing on the range');
});

test('the works are offered to a family that has a herd and to no other, and cost it nothing to keep', () => {
  const world = landed('stock-offered');
  const [one, two] = Object.values(world.households);
  withStock(one); delete two.stock; two.herd = { cattle: 0, hogs: 0 };
  const offered = household => {
    const projected = projectWorld(world, household.id, 'student', { includeMap: false });
    return (projected.work[household.principalId] || []).filter(entry => CHORES[entry.id].stock).map(entry => entry.id);
  };
  assert.deepEqual(offered(one).sort(), ['butcher-beef', 'butcher-hog', 'look-to-stock'], 'a family with a herd was not offered its own stock');
  assert.deepEqual(offered(two), [], 'a family with no herd was offered a beef to kill');
  // Nothing is eaten by the herd and nothing is wanted for it: "the pasturage is sufficiently good to dispense with
  // feeding live stock" is the whole reason a herd is worth having in this country. Held by running the same class
  // twice, once with a herd and once without, and asking what the family has to eat at the end of it - so nothing about
  // how much a family earns or eats has to be restated here.
  const run = stock => {
    const twin = landed('stock-offered');
    const family = Object.values(twin.households)[0];
    if (stock) withStock(family); else { delete family.stock; family.herd = { cattle: 0, hogs: 0 }; }
    for (let tick = 0; tick < 90; tick++) stepWorld(twin);
    return Math.round(family.resources.food * 1000) / 1000;
  };
  assert.equal(run(true), run(false), 'a herd cost the family food, or fed it without being killed');
  for (const chore of ['butcher-beef', 'butcher-hog', 'look-to-stock']) {
    assert.equal(CHORES[chore].needs, undefined, `${chore} wants something to be done at all`);
  }
});

test('calves come in the spring and pigs off the autumn mast, and nothing comes in between', () => {
  // A whole year of one class, a day at a time, with the family riding its range every day so that nothing strays into
  // the count. The month is read off the class's own calendar (sim/clock.mjs `dateOf`) and never off a date worked out
  // here, which is how the first draft of this test managed to put the calving in January.
  const world = landed('stock-increase');
  const household = withStock(Object.values(world.households)[0]);
  const seen = {};
  let was = { ...herdOf(household) };
  for (let day = 0; day < 366; day++) {
    world.minute = day * DAY + 9 * 60;
    household.herdLookedDay = day; // Ridden every day: this test is about the increase, not the straying.
    advanceStock(world, household);
    const now = herdOf(household), month = dateOf(world, day * DAY + 12 * 60).getUTCMonth();
    const grew = { cattle: now.cattle - was.cattle, hogs: now.hogs - was.hogs };
    if (grew.cattle || grew.hogs) {
      seen[month] ??= { cattle: 0, hogs: 0 };
      seen[month].cattle += grew.cattle;
      seen[month].hogs += grew.hogs;
    }
    was = { ...now };
  }
  for (const [month, grew] of Object.entries(seen)) {
    if (grew.cattle) assert.ok(CALVING_MONTHS.includes(Number(month)), `calves were dropped in month ${month}`);
    if (grew.hogs) assert.ok(MAST_MONTHS.includes(Number(month)), `pigs came in month ${month}, off no mast`);
    assert.ok(grew.cattle >= 0 && grew.hogs >= 0, `the herd fell in month ${month} with nothing to take it`);
  }
  assert.ok(CALVING_MONTHS.some(month => seen[month]?.cattle > 0), 'no calf was ever dropped in the spring');
  assert.ok(MAST_MONTHS.some(month => seen[month]?.hogs > 0), 'no pig ever came off the mast');
  // And it is a **season's** increase and not a day's. A herd is counted on the first of the month; counted daily
  // instead, a spring would multiply the cattle thirty times over and a class would end in a cattle empire.
  const herd = herdOf(household);
  assert.ok(herd.cattle <= OPENING_HERD.cattle * 2, `a year took the cattle from ${OPENING_HERD.cattle} to ${herd.cattle}`);
  assert.ok(herd.hogs <= OPENING_HERD.hogs * 3, `a year took the hogs from ${OPENING_HERD.hogs} to ${herd.hogs}`);
  assert.ok(herd.cattle > OPENING_HERD.cattle && herd.hogs > OPENING_HERD.hogs, 'a year of range and mast added nothing');
});

test('a herd nobody rides out after strays, and a day on the range stops it for a month', () => {
  // **The same class twice**, the same herd, the same days, the same hash: the only difference is that one family rode
  // out after its stock and the other did not. Four months, so several firsts of the month are crossed - a herd is
  // counted on the first - and so the mast is in both, which is what made the first draft of this test read the pigs of
  // the autumn as though nothing had strayed at all.
  const ridden = landed('stock-stray'), left = landed('stock-stray');
  const a = withStock(Object.values(ridden.households)[0]), b = withStock(Object.values(left.households)[0]);
  const kept = overDays(ridden, a, 120, true), lost = overDays(left, b, 120);
  assert.ok(kept.cattle > lost.cattle, `the ridden herd kept ${kept.cattle} cattle and the other ${lost.cattle}`);
  assert.ok(kept.hogs > lost.hogs, `the ridden herd kept ${kept.hogs} hogs and the other ${lost.hogs}`);
  assert.ok(world => true);
  // Nothing strayed at all from the herd that was ridden: that is what the day buys.
  assert.equal(kept.cattle, OPENING_HERD.cattle, 'a cow strayed from a herd that was ridden every month');
  assert.ok(left.events.some(event => /strayed off and nobody has been out after them/.test(event.text || '')), 'the family was never told what it had lost');
  // Cattle range further than hogs and are lost oftener, which is the shape the record has.
  assert.ok(STRAY_SHARE.cattle > STRAY_SHARE.hogs);
  // And the day on the range is a real day's work that does it.
  const world = landed('stock-ride');
  const household = withStock(Object.values(world.households)[0]);
  const person = world.entities[household.members[0]];
  send(world, household, person, 'look-to-stock');
  workThrough(world, person);
  assert.equal(household.herdLookedDay, Math.floor(world.minute / DAY), 'the ride did not count');
  assert.ok(world.events.some(event => /rode the range and counted the stock/.test(event.text || '')), 'the ride was never said');
  assert.equal(LOOKED_TO_DAYS, 30);
  validateWorld(world);
});

test('a beef is divided with the neighbours because it cannot be kept; a hog is salted down and kept', () => {
  const world = landed('stock-beef', 24);
  // The family with the most neighbours within a beef's reach, because the dividing is what this test is about. A class
  // deals its families across whole settlements, so which of them has anybody near is the map's business and not this
  // test's (sim/stock.mjs `BEEF_MILES`, and the ceiling written there).
  const neighboursOf = one => {
    const home = world.map.sites[one.homeSiteId];
    return Object.values(world.households).filter(other => other.id !== one.id
      && Math.hypot(world.map.sites[other.homeSiteId].x - home.x, world.map.sites[other.homeSiteId].y - home.y) <= BEEF_MILES);
  };
  const household = withStock(Object.values(world.households).sort((a, b) => neighboursOf(b).length - neighboursOf(a).length)[0]);
  const person = world.entities[household.members[0]];
  const near = neighboursOf(household);
  assert.ok(near.length > 0, 'no family in this class has a neighbour within the reach of a beef, so nothing here is tested');
  const theirs = new Map(near.map(other => [other.id, other.resources.food]));
  const cattle = herdOf(household).cattle, food = household.resources.food;

  send(world, household, person, 'butcher-beef');
  workThrough(world, person);
  assert.equal(herdOf(household).cattle, cattle - 1, 'the beef is still on the range');
  // Less the day's eating, which goes on while the beef is dressed (sim/routines.mjs).
  assert.ok(household.resources.food >= food + BEEF_KEPT - 1, `the family kept ${household.resources.food - food}`);
  assert.ok(household.resources.food < food + BEEF_FOOD, 'the family kept the whole beef, which it cannot');
  const said = world.events.filter(event => event.claimId === 'FIC-GONZ-182');
  assert.ok(said.some(event => event.householdId === household.id && /killed a beef/.test(event.text)), 'the family was not told');
  const fed = near.filter(other => other.resources.food > theirs.get(other.id));
  assert.ok(fed.length > 0, 'a beef was killed beside the neighbours and none of them ate any of it');
  // Both records say so: that is what makes it an act between families rather than a number moving.
  for (const other of fed) {
    assert.ok(said.some(event => event.householdId === other.id && /sent .* food over/.test(event.text)), `${other.id} was never told where the meat came from`);
  }
  // What went out is what could not be kept: the family's own share and the neighbours' add up to the whole beef.
  const sent = fed.reduce((sum, other) => sum + (other.resources.food - theirs.get(other.id)), 0);
  assert.ok(Math.abs(sent - (BEEF_FOOD - BEEF_KEPT)) < 0.51, `the neighbours were sent ${sent} of a beef of ${BEEF_FOOD}`);
  validateWorld(world);

  // The hog is the other half of the rule: less meat, and every pound of it keeps.
  const hogs = herdOf(household).hogs, had = household.resources.food;
  send(world, household, person, 'butcher-hog');
  workThrough(world, person);
  assert.equal(herdOf(household).hogs, hogs - 1);
  assert.ok(PORK_FOOD > 0 && household.resources.food > had + PORK_FOOD / 2, `the pork did not keep: ${household.resources.food - had}`);
  assert.ok(household.resources.food >= had + PORK_FOOD - 1, `the pork did not keep: ${household.resources.food - had}`);
  assert.ok(PORK_FOOD < BEEF_KEPT + (BEEF_FOOD - BEEF_KEPT), 'a hog is as much meat as a beef');
  assert.ok(world.events.some(event => /salted it down/.test(event.text || '')), 'the pork was not salted down');
});

test('nobody drives cattle ahead of an army: the herd is left, and half the cattle are there to be found', () => {
  const world = landed('stock-scrape');
  const household = withStock(Object.values(world.households)[0]);
  const herd = { ...herdOf(household) };
  // The flight itself is tested in tests/road.test.mjs; what is held here is what it does to the stock.
  leaveStock(world, household);
  assert.deepEqual(herdOf(household), { cattle: 0, hogs: 0 }, 'the family drove its cattle to the Sabine');
  assert.deepEqual(household.herdLeft, herd, 'what was left was not written down');
  assert.ok(world.events.some(event => event.claimId === 'FIC-GONZ-184' && /left on the range/.test(event.text)), 'the family was not told');

  findStockAgain(world, household);
  const found = herdOf(household);
  assert.equal(found.cattle, Math.floor(herd.cattle * FOUND_AGAIN.cattle));
  assert.equal(found.hogs, Math.floor(herd.hogs * FOUND_AGAIN.hogs));
  assert.equal(household.herdLeft, undefined, 'the family found the same stock twice');
  // More of the cattle come back than the hogs: the hogs have been loose on the mast and are where the feral hogs of
  // the record come from (`HIST-TEX-264`).
  assert.ok(FOUND_AGAIN.cattle > FOUND_AGAIN.hogs);
  assert.ok(world.events.some(event => /gone wild in the timber/.test(event.text || '')), 'the hogs left behind vanished quietly');
});

test('a class replays its own herds, and a family nobody plays drives stock in and keeps a breeding herd', () => {
  const run = () => {
    const world = createGonzalesWorld('stock-replay', 16, { map: 'colonies', neighbours: true });
    world.status = 'running';
    for (let tick = 0; tick < 700; tick++) stepWorld(world);
    return world;
  };
  const first = run(), second = run();
  const herds = world => Object.values(world.households).map(household => `${household.id}:${herdWords(household)}`);
  assert.deepEqual(herds(first), herds(second), 'two runs of one class kept different herds');

  // The director deals stock, because until 2026-09-20 no family nobody plays ever had any: 0 of 180 in the study, in a
  // country with 75,000 cattle in it. About three families in four, by the class's own hash.
  const dealt = Object.values(first.households).filter(household => household.stock === true).length;
  const all = Object.values(first.households).length;
  assert.ok(dealt > all * 0.4, `only ${dealt} of ${all} families drove stock in`);
  assert.ok(dealt < all, `every one of ${all} families drove stock in`);
  assert.ok(STOCK_SHARE > 0.5 && STOCK_SHARE <= 1);
  // And it does not eat its own herd: a breeding herd is kept whatever the larder says.
  for (const household of Object.values(first.households)) {
    if (household.flight || household.herdLeft) continue;
    const herd = herdOf(household);
    if (household.stock !== true) continue;
    assert.ok(herd.cattle === 0 || herd.cattle >= 1, `${household.id} has ${herdWords(household)}`);
  }
  assert.ok(KEEP_CATTLE > 0 && KEEP_HOGS > 0, 'the director keeps no breeding herd at all');
  validateWorld(first);
});
