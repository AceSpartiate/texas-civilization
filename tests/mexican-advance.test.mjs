// The Mexican army's advance through the Runaway Scrape (owner, 2026-09-25: "we need to fully model the Mexican army as it
// pushes towards the Texian army during the runaway scrape. we'll need to ensure that 50% of player farms are in the zone that
// will see their farms burned."; 2026-09-26: "Place land at the start"; docs/SCRAPE.md, docs/battle-research/mexican-advance.md).
//
// What is held here: each column is where the record puts it on the record's dates, and nowhere the record says no Mexican
// came; it marches on the roads at an army's pace and never jumps; the towns burn on their dates by the hand the record gives,
// and no other town burns; exactly half of every class's land is dealt inside the burn zone, family by family in the order
// students join, across class sizes and seeds, with the odd one over inside; an old save keeps its land; a family learns its
// farm burned only by its own people seeing it or by the word reaching them, and its page shows the farm as it left it until
// then; the burned farm is burned when the family comes home, and a farm outside the zone is standing with what was left in
// it; a family sees a column only where its own people are; the foragers drive off the stock.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, projectWorld, rollFamily, stepWorld, validateWorld } from '../sim/world.mjs';
import { beginSecondPeriod, beginThirdPeriod } from '../sim/periods.mjs';
import { dealCounts } from '../sim/colonies-map.mjs';
import { LAND_FROM_TOWN, burnSides } from '../sim/colonies-region.mjs';
import { findPath } from '../sim/geography.mjs';
import { armiesSeen } from '../sim/armies.mjs';
import { BURNINGS, COLUMNS, COLUMN_SIGHT_MILES, MAX_MARCH_MPH, MAX_MILES_A_DAY, ORDER_GRACE_MINUTES, SMOKE_SIGHT_MILES, WORD_MILES_A_DAY, burnMinute, clockOf, farmFate, firesNow, firesSeen, headAt, inBurnZone, legsOf, on } from '../sim/advance.mjs';
import { advanceAdvanceWord } from '../sim/advance-word.mjs';
import { FOUND_AFTER_FORAGERS, findStockAgain } from '../sim/stock.mjs';
import { advanceArmiesPassing } from '../sim/scrape.mjs';
import { COLUMN_WATCH_MILES, MILITARY_TRAVEL_MINUTES, columnWatched, militaryMinutes } from '../sim/military-pacing.mjs';

const view = (world, householdId, role = 'student') => projectWorld(world, householdId, role, { includeMap: false });
const until = (world, done, limit = 9000) => { for (let t = 0; t < limit && !done() && world.status === 'running'; t++) stepWorld(world); };
const column = id => COLUMNS.find(one => one.id === id);
const near = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const inside = (world, household) => Boolean(farmFate(world, household));

let shared = null;
/** A real-land class with rolled families, played through two periods and continued into the spring, running. */
const spring = () => structuredClone(shared ??= (() => {
  const world = createGonzalesWorld('advance-class', 8, { map: 'colonies' });
  for (const household of Object.values(world.households)) rollFamily(world, household);
  world.status = 'running';
  until(world, () => world.director.complete);
  beginSecondPeriod(world); world.status = 'running';
  until(world, () => world.director.complete);
  beginThirdPeriod(world); world.status = 'running';
  return world;
})());

// The record's dates, written here from docs/battle-research/mexican-advance.md §3 and not read from the data they check.
const RECORD = [
  ['sesma', 'bexar', on(1836, 3, 11, 8)], ['sesma', 'gonzales', on(1836, 3, 14, 8)], ['sesma', { x: 53, y: -17 }, on(1836, 3, 20, 12)],
  ['sesma', 'lower-colorado-crossing', on(1836, 3, 28, 12)], ['sesma-brazos', 'san-felipe', on(1836, 4, 10, 12)], ['sesma-brazos', 'thompsons', on(1836, 4, 13, 12)], ['sesma-brazos', 'old-fort', on(1836, 4, 16, 12)],
  ['tolsa', { x: 45, y: -15 }, on(1836, 3, 24, 12)],
  ['santa-anna', 'bexar', on(1836, 3, 31, 8)], ['santa-anna', 'gonzales', on(1836, 4, 2, 12)], ['santa-anna', 'san-felipe', on(1836, 4, 7, 12)],
  ['santa-anna', 'thompsons', on(1836, 4, 12, 8)], ['santa-anna', 'staffords', on(1836, 4, 15, 7)], ['santa-anna', 'harrisburg', on(1836, 4, 16, 12)],
  ['santa-anna', 'new-washington', on(1836, 4, 19, 12)], ['santa-anna', { x: 142, y: -17 }, on(1836, 4, 20, 15)],
  ['cos', 'old-fort', on(1836, 4, 18, 12)], ['cos', 'harrisburg', on(1836, 4, 20, 8)],
  ['gaona', 'bexar', on(1836, 3, 24, 8)], ['gaona', 'old-fort', on(1836, 4, 20, 11, 55)],
  ['urrea', 'refugio', on(1836, 3, 14, 12)], ['urrea', 'victoria', on(1836, 3, 21, 7, 30)], ['urrea', { x: 53, y: 38 }, on(1836, 4, 2, 6)],
  ['urrea', 'matagorda', on(1836, 4, 13, 10)], ['urrea', 'powells', on(1836, 4, 20, 18)], ['urrea', 'columbia', on(1836, 4, 21, 16)], ['urrea', 'brazoria', on(1836, 4, 22, 10)],
  ['filisola', 'gonzales', on(1836, 4, 5, 12)], ['filisola', 'lower-colorado-crossing', on(1836, 4, 12, 12)], ['filisola', 'san-felipe', on(1836, 4, 15, 12)],
  ['filisola', 'old-fort', on(1836, 4, 20, 12)], ['filisola', 'powells', on(1836, 4, 25, 18)],
];
/** Where no Mexican force came (§7): Washington, Groce's and Bernardo, Velasco, Liberty, Anahuac, Nacogdoches. */
const NEVER = ['washington', 'groces', 'bernardo', 'velasco', 'liberty', 'anahuac', 'nacogdoches'];

test('each column is where the record puts it on the record\'s dates, and never where the record says no Mexican came', () => {
  const world = createGonzalesWorld('advance-march', 5, { map: 'colonies' });
  for (const [id, place, minute] of RECORD) {
    const head = headAt(world.map, column(id), minute), there = typeof place === 'string' ? world.map.sites[place] : place;
    assert.ok(head, `${id} is not in the country at ${new Date(Date.UTC(1835, 8, 29) + minute * 60000).toISOString()}`);
    assert.ok(near(head, there) < 0.6, `${id} is ${near(head, there).toFixed(1)} miles from ${typeof place === 'string' ? place : JSON.stringify(place)} on its date`);
  }
  for (const one of COLUMNS) {
    for (let t = one.path[0].minute; t <= one.path.at(-1).minute; t += 60) {
      const head = headAt(world.map, one, t);
      if (!head) continue;
      for (const id of NEVER) assert.ok(near(head, world.map.sites[id]) > 2, `${one.id} came within two miles of ${id}, where no Mexican force came`);
    }
  }
  // Santa Anna's column vanishes into the battle at San Jacinto; the others fall back, and none hunts or burns doing it.
  assert.equal(headAt(world.map, column('santa-anna'), on(1836, 4, 21, 17)), null);
  const back = headAt(world.map, column('filisola'), on(1836, 4, 27, 12));
  assert.equal(back.retreat, true, 'the army is not going back after San Jacinto');
});

test('the columns march on the roads at an army\'s pace, and never jump', () => {
  const world = createGonzalesWorld('advance-march', 5, { map: 'colonies' });
  for (const one of COLUMNS) {
    let last = null;
    for (let t = one.path[0].minute; t < Math.min(one.until ?? Infinity, one.path.at(-1).minute); t += 20) {
      const head = headAt(world.map, one, t);
      assert.ok(head, `${one.id} is missing at a minute of its march`);
      // Never faster than a forced march of picked men, and never a jump.
      if (last) assert.ok(near(head, last) <= MAX_MARCH_MPH * 20 / 60 + 0.01, `${one.id} jumped ${near(head, last).toFixed(2)} miles in twenty minutes`);
      last = head;
    }
    // And no stretch of a day or more at more than an army's day.
    one.path.slice(1).forEach((b, i) => {
      const a = one.path[i], days = (b.minute - a.minute) / 1440, leg = legsOf(world.map, one)[i];
      if (days >= 1) assert.ok(leg.length / days <= MAX_MILES_A_DAY, `${one.id} marches ${(leg.length / days).toFixed(1)} miles a day for ${days.toFixed(1)} days`);
    });
  }
  // On the road where the map has one: Sesma from Béxar to Gonzales, Santa Anna down the Columbia road from San Felipe.
  const offRoad = (head, points) => Math.min(...points.slice(1).map((b, i) => { const a = points[i]; const dx = b.x - a.x, dy = b.y - a.y; const f = Math.max(0, Math.min(1, ((head.x - a.x) * dx + (head.y - a.y) * dy) / (dx * dx + dy * dy || 1))); return Math.hypot(head.x - a.x - f * dx, head.y - a.y - f * dy); }));
  const sesma = headAt(world.map, column('sesma'), on(1836, 3, 12, 20));
  assert.ok(offRoad(sesma, findPath(world.map, 'bexar', 'gonzales').points) < 0.01, 'Sesma did not march by the road to Gonzales');
  const santa = headAt(world.map, column('santa-anna'), on(1836, 4, 9, 20));
  assert.ok(offRoad(santa, findPath(world.map, 'san-felipe', 'columbia').points) < 0.01, 'Santa Anna did not go down the Columbia road');
  // A camp is a camp: Sesma stands opposite Beeson's from the 20th to the 27th.
  const camp = headAt(world.map, column('sesma'), on(1836, 3, 23, 12));
  assert.equal(camp.camp, true);
  assert.equal(camp.moving, false);
});

test('the towns burn on their dates by the record\'s hand, and no town the record does not name burns', () => {
  const hand = Object.fromEntries(BURNINGS.map(one => [one.id, one.hand]));
  for (const id of ['gonzales', 'refugio', 'goliad', 'beesons', 'san-felipe']) assert.equal(hand[id], 'texian', `${id} was not burned by the Texians`);
  for (const id of ['bastrop', 'staffords', 'harrisburg', 'new-washington', 'powells']) assert.equal(hand[id], 'mexican', `${id} was not burned by the Mexicans`);
  const burned = new Set(BURNINGS.map(one => one.siteId).filter(Boolean));
  for (const id of ['victoria', 'matagorda', 'columbia', 'brazoria', 'velasco', 'washington', 'liberty']) assert.ok(!burned.has(id), `${id} burns, and no record says it did`);
  const date = id => BURNINGS.find(one => one.id === id).minute;
  assert.equal(date('gonzales'), on(1836, 3, 13, 23));
  assert.equal(date('san-felipe'), on(1836, 3, 30, 10));
  assert.equal(date('harrisburg'), on(1836, 4, 16, 12));
  assert.equal(date('new-washington'), on(1836, 4, 20, 8));
  // In a class: the smoke over Harrisburg on the 16th, seen by the Host and by nobody far off.
  const world = createGonzalesWorld('advance-march', 5, { map: 'colonies' });
  world.director.arrival = true;
  world.minute = on(1836, 4, 16, 14) + clockOf(world);
  assert.ok(firesNow(world).some(fire => fire.id === 'harrisburg'), 'Harrisburg is not smoking on the 16th');
  assert.ok(firesSeen(world, undefined, 'host').some(fire => fire.id === 'harrisburg'));
  const far = Object.values(world.households).find(household => household.members.every(id => near(world.entities[id].location, world.map.sites.harrisburg) > SMOKE_SIGHT_MILES));
  assert.ok(!firesSeen(world, far.id, 'student').some(fire => fire.id === 'harrisburg'), 'a family a long way off was shown Harrisburg\'s smoke');
});

test('exactly half of every class\'s land is inside the burn zone, two by two as students join, which of each two by the seed, the odd one over inside', () => {
  // Which of each two families is inside is the seed's (owner, 2026-09-29, triage D12: "Shuffle by seed"; `FIC-GONZ-963`), so
  // the place a student joins in no longer says whether their farm burns: across these classes family 1 is inside in some and
  // outside in others.
  const firstInside = new Set();
  for (const families of [5, 6, 7, 11, 16, 23, 30]) {
    for (const seed of ['a', 'b', 'c']) {
      const world = createGonzalesWorld(`advance-deal-${seed}-${families}`, families, { map: 'colonies' });
      const ids = Object.keys(world.households).sort((a, b) => Number(a.slice(3)) - Number(b.slice(3)));
      const inside = ids.map(id => inBurnZone(world.map, world.map.sites[world.households[id].homeSiteId]));
      firstInside.add(inside[0]);
      // The same seed deals the same sides: a class made again from its seed burns the same farms.
      const again = createGonzalesWorld(`advance-deal-${seed}-${families}`, families, { map: 'colonies' });
      assert.deepEqual(ids.map(id => inBurnZone(again.map, again.map.sites[again.households[id].homeSiteId])), inside, `${families} families, seed ${seed}: the same seed dealt other sides`);
      let count = 0;
      ids.forEach((id, index) => {
        const household = world.households[id], home = world.map.sites[household.homeSiteId];
        if (inside[index]) count++;
        // However many have joined, an even number is exactly half inside; the last of an odd class is inside.
        if (index % 2 === 1) assert.equal(count, (index + 1) / 2, `${families} families, seed ${seed}: ${count} of the first ${index + 1} inside`);
        if (index === ids.length - 1 && ids.length % 2) assert.equal(inside[index], true, `${families} families, seed ${seed}: the odd one over is outside`);
        // And the land is still the land's rule: a few miles from its own settlement.
        const town = near(home, world.map.sites[household.settlementId]);
        assert.ok(town >= LAND_FROM_TOWN.nearest - 0.01 && town <= LAND_FROM_TOWN.farthest + 0.01, `${id}'s land is ${town.toFixed(1)} miles from its settlement`);
      });
      // The settlements' counts by 1834 population are kept.
      const dealt = {};
      for (const household of Object.values(world.households)) dealt[household.settlementId] = (dealt[household.settlementId] || 0) + 1;
      assert.deepEqual(dealt, Object.fromEntries(Object.entries(dealCounts(families)).filter(([, n]) => n)), `${families} families, seed ${seed}: the counts moved`);
    }
  }
  assert.deepEqual([...firstInside].sort(), [false, true], 'family 1 is on the same side in every class: join order still tells a class whose farm burns');
});

test('burnSides: one of each two in join order, the odd one over inside, the same for the same key and not the same for every key', () => {
  const firsts = new Set();
  for (let n = 0; n < 200; n++) {
    for (const count of [1, 2, 5, 8, 30]) {
      const sides = burnSides(count, `key-${n}`);
      assert.equal(sides.length, count);
      for (let first = 0; first + 1 < count; first += 2) assert.notEqual(sides[first], sides[first + 1], `pair ${first} of ${count}: both on one side`);
      if (count % 2) assert.equal(sides[count - 1], true);
      assert.deepEqual(burnSides(count, `key-${n}`), sides);
      if (count === 30) firsts.add(sides.map(Number).join(''));
    }
  }
  // Two hundred keys deal many different classes, not two patterns taking turns.
  assert.ok(firsts.size > 150, `only ${firsts.size} different deals of thirty in two hundred keys`);
});

test('an old save keeps its land: nothing is dealt again, and its farms burn or stand by where they are', () => {
  // A class dealt as every class before 2026-09-26 was (`zoneDeal: false`), saved and opened again.
  const made = createGonzalesWorld('advance-old-save', 8, { map: 'colonies', zoneDeal: false });
  const homes = Object.fromEntries(Object.values(made.households).map(household => [household.id, { ...made.map.sites[household.homeSiteId] }]));
  const world = JSON.parse(JSON.stringify(made));
  validateWorld(world);
  const families = Object.values(world.households);
  for (const household of families) {
    const home = world.map.sites[household.homeSiteId];
    assert.deepEqual({ x: home.x, y: home.y }, { x: homes[household.id].x, y: homes[household.id].y }, `${household.id}'s land moved when the class was opened`);
  }
  // Its land is not half and half family by family: the old deal knew nothing of the zone.
  const against = families.filter((household, index) => Boolean(farmFate(world, household)) !== (index % 2 === 0));
  assert.ok(against.length > 0, 'this old class happens to be dealt half and half, so this test checks nothing');
  // Each farm's fate is its own land's: burned when the foragers reach it inside the zone, never outside it.
  for (const household of families) household.flight = { status: 'fled', orderedMinute: 0, refuge: 'lynchburg', leftMinute: 0 };
  world.period = 3;
  world.minute = Math.max(...families.map(household => burnMinute(world, household) ?? 0)) + 60;
  advanceArmiesPassing(world);
  for (const household of families) {
    assert.equal(Number.isFinite(household.flight.burned), inBurnZone(world.map, world.map.sites[household.homeSiteId]), `${household.id}'s farm ${household.flight.burned ? 'burned' : 'stood'} against its own land`);
  }
});

test('a family learns its farm burned only by its own people seeing it or by the word, and its page shows the farm as it left it until then', () => {
  const world = spring();
  // A family inside the zone, played, which goes as far east as it can the day it is told to go.
  const household = Object.values(world.households).find(one => inside(world, one) && one.settlementId !== 'gonzales') || Object.values(world.households).find(one => inside(world, one));
  household.played = true;
  household.improvements = { ...(household.improvements || {}), cabin: 'sound' };
  until(world, () => household.flight?.status === 'ordered', 4000);
  household.resources = { ...household.resources, food: 60, powder: 3 };
  const main = world.entities[household.mainId || household.principalId];
  const refuges = view(world, household.id).flight.refuges;
  const farthest = [...refuges].sort((x, y) => y.miles - x.miles)[0].id;
  applyAction(world, household.id, { action: 'flee', entityId: main.id, take: { food: 20 }, refuge: farthest });
  assert.equal(household.improvements.cabin, 'sound', 'the farm burned as the family left');
  assert.ok(household.flight.left?.food >= 40, 'what did not fit was not left in the house');
  // The foragers come: not before a day after the family was told.
  const at = burnMinute(world, household);
  assert.ok(at >= household.flight.orderedMinute + ORDER_GRACE_MINUTES);
  until(world, () => household.flight.burned, 6000);
  assert.ok(household.flight.burned >= at, 'the farm burned before the foragers came');
  const home = world.map.sites[household.homeSiteId];
  const eyes = () => household.members.map(id => world.entities[id]).filter(one => !['dead', 'captured'].includes(one.health.condition)).map(one => one.location);
  const nearest = () => Math.min(...eyes().map(point => near(point, home)));
  assert.ok(nearest() > SMOKE_SIGHT_MILES, 'the family was near enough to see the smoke; the test needs it far off');
  assert.equal(household.improvements.cabin, 'ruined', 'the foragers did not burn the house');
  // Nothing of it on the family's page yet: the farm as they left it, not burned, and not a word in their record.
  const before = view(world, household.id);
  assert.equal(before.land.cabin, 'sound', 'the page drew the farm burned before the family knew');
  assert.ok(!before.flight.burned, 'the flight sent to the page says the farm burned');
  assert.equal(before.household.flight.burned, undefined, 'the household sent to the page carries the burning');
  assert.ok(!before.events.some(event => /burn/i.test(event.text) && /farm|house/.test(event.text) && event.minute >= household.flight.burned), 'the family was told in its record');
  assert.ok(!before.reports.some(report => report.topicId === `farm-burned:${household.id}`));
  // Then the word comes, when it has had time to cover the ground to them.
  const burned = household.flight.burned;
  until(world, () => household.flight.burnKnown, 2000);
  assert.equal(household.flight.burnKnown.how, 'word');
  assert.ok(world.minute - burned >= nearest() / WORD_MILES_A_DAY * 1440 - 240, 'the word came faster than a rider');
  const after = view(world, household.id);
  assert.equal(after.land.cabin, 'ruined');
  assert.ok(after.events.some(event => /Word came along the road/.test(event.text) && /burned the house, the field and the fences/.test(event.text)), 'no account in plain words');
  assert.ok(after.reports.some(report => report.topicId === `farm-burned:${household.id}` && report.source === 'People fleeing east'));
  validateWorld(world);
});

test('the smoke is seen only near and only while it stands, the word comes no faster than people carry it, and nothing else tells a family', () => {
  const world = spring();
  const household = Object.values(world.households).find(one => inside(world, one));
  const home = world.map.sites[household.homeSiteId];
  const burnedNow = minute => ({ status: 'fled', orderedMinute: minute, refuge: 'lynchburg', burned: minute, burnedBy: { hand: 'mexican', columnId: 'sesma', name: 'Sesma’s column' }, unseen: { improvements: { cabin: 'sound' }, field: null, plots: null, furniture: null, interior: null } });
  const at = miles => { for (const id of household.members) world.entities[id].location = { x: home.x + miles, y: home.y, siteId: null }; };
  const start = world.minute;
  // Sixty miles off: nothing at once, nothing a day later (forty miles of word), the word a day and a half after.
  household.flight = burnedNow(start);
  at(60);
  advanceAdvanceWord(world);
  assert.equal(household.flight.burnKnown, undefined, 'a family sixty miles off learned it the moment it happened');
  world.minute = start + 1440;
  advanceAdvanceWord(world);
  assert.equal(household.flight.burnKnown, undefined, 'the word covered sixty miles in a day');
  world.minute = start + 1440 * 1.6;
  advanceAdvanceWord(world);
  assert.equal(household.flight.burnKnown?.how, 'word', 'the word never came at a rider\'s pace');
  // Within sight of the smoke while it stands: seen.
  world.minute = start;
  delete household.flight.burnKnown;
  household.flight = burnedNow(start);
  at(SMOKE_SIGHT_MILES - 1);
  advanceAdvanceWord(world);
  assert.equal(household.flight.burnKnown?.how, 'sight', 'a family whose own person stood in sight of the smoke did not see it');
  assert.ok(world.events.some(event => event.householdId === household.id && /smoke over the family's own land/.test(event.text)));
  // Coming near two days after, when the smoke has long gone: the word, not the smoke.
  household.flight = burnedNow(start - 2 * 1440);
  at(SMOKE_SIGHT_MILES - 1);
  advanceAdvanceWord(world);
  assert.equal(household.flight.burnKnown?.how, 'word', 'a family saw smoke two days after it had gone');
});

test('the burned farm is burned when the family comes home; a farm outside the zone stands, with what was left in it', () => {
  const world = spring();
  const burnedOne = Object.values(world.households).find(one => inside(world, one));
  const standing = Object.values(world.households).find(one => !inside(world, one));
  for (const household of [burnedOne, standing]) {
    household.played = true;
    household.improvements = { ...(household.improvements || {}), cabin: 'sound' };
  }
  // Both go, each with twenty food and the rest left at home; neither is at home to be taken.
  for (const household of [burnedOne, standing]) {
    until(world, () => household.flight?.status === 'ordered', 6000);
    household.resources = { ...household.resources, food: 80, seed: 5 };
    const main = world.entities[household.mainId || household.principalId];
    applyAction(world, household.id, { action: 'flee', entityId: main.id, take: { food: 20 }, refuge: view(world, household.id).flight.refuges[0].id });
  }
  until(world, () => world.director.complete, 9000);
  world.status = 'running';
  until(world, () => [burnedOne, standing].every(household => ['home'].includes(household.flight.status)), 6000);
  assert.equal(burnedOne.flight.status, 'home', 'the burned-out family never came home');
  assert.equal(standing.flight.status, 'home', 'the family from outside the zone never came home');
  assert.equal(burnedOne.improvements.cabin, 'ruined', 'the burned house was standing again at home');
  assert.ok(burnedOne.flight.burnKnown, 'the family came home and still did not know');
  assert.ok(world.events.some(event => event.householdId === burnedOne.id && /The family is home\. The house is ashes/.test(event.text)));
  assert.equal(standing.improvements.cabin, 'sound', 'a farm outside the zone was burned');
  assert.equal(standing.flight.burned, undefined);
  assert.ok(world.events.some(event => event.householdId === standing.id && /The Mexican army never came this way: the house stands.*still there: 60 food/.test(event.text)), 'what was left in the house was not found there again');
  assert.equal(standing.flight.left, undefined);
  validateWorld(world);
});

test('a family sees a column only where its own people are; the Host sees every one, and where each party is riding', () => {
  const world = spring();
  world.minute = on(1836, 4, 12, 12) + clockOf(world);
  const host = armiesSeen(world, undefined, 'host').filter(army => army.side === 'mexican');
  assert.ok(host.length >= 3, 'the Host does not see the columns in the country');
  const santa = host.find(army => army.id === 'santa-anna');
  assert.ok(santa && santa.commander === 'santa-anna' && santa.strength > 0, 'Santa Anna\'s column has no commander or strength on the Host\'s map');
  const household = Object.values(world.households)[0];
  for (const id of household.members) world.entities[id].location = { x: santa.x + COLUMN_SIGHT_MILES + 30, y: santa.y, siteId: null };
  assert.ok(!armiesSeen(world, household.id, 'student').some(army => army.id === 'santa-anna'), 'a family far from the column was shown it');
  // Standing on the family's own land is not enough when nobody of it is there: its people are.
  world.map.sites[household.homeSiteId] = { ...world.map.sites[household.homeSiteId], x: santa.x, y: santa.y };
  assert.ok(!armiesSeen(world, household.id, 'student').some(army => army.id === 'santa-anna'), 'a family was shown a column from the land it had left');
  world.entities[household.members[0]].location = { x: santa.x + 3, y: santa.y, siteId: null };
  const seen = armiesSeen(world, household.id, 'student').find(army => army.id === 'santa-anna');
  assert.ok(seen, 'a family whose person stood three miles off did not see the column');
  // A party riding out to a farm: the Host is told which, a family standing by it sees the party and is not.
  const target = Object.values(world.households).find(one => inside(world, one) && one.id !== household.id);
  target.flight = { status: 'fled', orderedMinute: 0, refuge: 'lynchburg', leftMinute: 0 };
  world.minute = burnMinute(world, target) - 20;
  const riding = armiesSeen(world, undefined, 'host').flatMap(army => (army.foragers || []).map(party => ({ army, party }))).find(({ party }) => party.to === target.homeSiteId);
  assert.ok(riding, 'the Host was not shown the party riding to the farm');
  world.entities[household.members[0]].location = { x: riding.party.x + 0.5, y: riding.party.y, siteId: null };
  const theirs = armiesSeen(world, household.id, 'student').find(army => army.id === riding.army.id);
  assert.ok(theirs?.foragers?.length, 'a family standing by a party did not see it');
  assert.ok(theirs.foragers.every(party => party.to === undefined), 'a student was told which farm a party is riding for');
});

test('a column on the march in front of a played family is watched at two hours a tick; one in camp, or far off, holds nothing', () => {
  const world = spring();
  const household = Object.values(world.households)[0];
  household.played = true; delete household.absent;
  const person = world.entities[household.members[0]];
  delete person.auto; delete person.service;
  // Everybody else of the family far off, at Nacogdoches, where no column came.
  for (const id of household.members) world.entities[id].location = { ...world.map.sites.nacogdoches, siteId: 'nacogdoches' };
  // Santa Anna's column at the first hour of April it is on the march (from San Felipe down the river).
  let t = on(1836, 4, 9, 12);
  while (!headAt(world.map, column('santa-anna'), t)?.moving) t += 60;
  world.minute = t + clockOf(world);
  const head = headAt(world.map, column('santa-anna'), t);
  person.location = { x: head.x + COLUMN_WATCH_MILES - 1, y: head.y, siteId: null };
  assert.equal(columnWatched(world), true, 'a family beside a marching column was not watched');
  assert.equal(militaryMinutes(world, 240), MILITARY_TRAVEL_MINUTES);
  person.location = { ...world.map.sites.nacogdoches, siteId: 'nacogdoches' };
  assert.equal(columnWatched(world), false, 'a column a hundred miles off held the class');
  // The same column camped at Thompson's ferry on the 13th holds nothing, however near.
  world.minute = on(1836, 4, 13, 12) + clockOf(world);
  const camp = headAt(world.map, column('santa-anna'), on(1836, 4, 13, 12));
  assert.equal(camp.camp, true);
  person.location = { x: camp.x + 1, y: camp.y, siteId: null };
  assert.equal(columnWatched(world), false, 'a column in camp held the class');
});

test('the foragers drive off the stock left on the range: a quarter of the cattle is found again, not half', () => {
  const household = { id: 'hh-x', herdLeft: { cattle: 12, hogs: 8, driven: true }, herd: { cattle: 0, hogs: 0 } };
  const world = { events: [], nextEventId: 1, tick: 0, minute: 0 };
  const found = findStockAgain(world, household);
  assert.deepEqual(found, { cattle: Math.floor(12 * FOUND_AFTER_FORAGERS.cattle), hogs: Math.floor(8 * FOUND_AFTER_FORAGERS.hogs) });
  assert.equal(found.cattle, 3);
});
