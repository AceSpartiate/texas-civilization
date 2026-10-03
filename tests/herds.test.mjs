// The herder and the herd that pays (owner, 2026-10-03, verbatim: "when players bring cattle and hogs, why don't we see their real
// herds? shouldn't a character that's assigned to tend the herd have appropriate skills and abilities for that? it should be a path to
// making food and wealth too." and "there's already an action for looking after the animals on the range, change and adapt it.").
// sim/stock.mjs (`tendHerd`, `herdingOf`, `careOf`, `conditionOf`, `sellStock`), the stock pens' two new lines (sim/shops.mjs,
// sim/errands.mjs), the herd sold with the farm (sim/farm-sale.mjs), and the page's drawing of it (public/herd-view.js).
// docs/STOCK.md §10. Each test is seen failing under the injection scripts/herds-injections.mjs names for it.
import test from 'node:test';
import assert from 'node:assert/strict';
import { applyAction, projectWorld, stepWorld, validateWorld } from '../sim/world.mjs';
import { choreAvailability, choresFor } from '../sim/chores.mjs';
import {
  BEEF_BY, CALF_SHARE, CARE_DAYS, CATTLE_FROM_AGE, FIND_SHARE, HOGS_FROM_AGE, LEARN_DAYS, PIG_SHARE, PORK_BY, RAISED_BONUS, SALE_COIN,
  advanceStock, careOf, conditionOf, divideBeef, herdOf, herdingDealt, herdingOf, killHog, sellStock, tendHerd,
} from '../sim/stock.mjs';
import { errandQuote } from '../sim/errands.mjs';
import { farmReckoning } from '../sim/farm-sale.mjs';
import { dateOf } from '../sim/clock.mjs';
import { herdFigures, HERD_DRAWN_MOST, herdHover } from '../public/herd-view.js';
import { createSettledWorld } from './support/settled.mjs';

const DAY = 1440;
const home = seed => { const world = createSettledWorld(seed, 5); world.status = 'running'; return world; };
const members = (world, household) => household.members.map(id => world.entities[id]);
/** Somebody of the family made for the test at this age, at home (the dice are not asked). */
function kin(world, household, id, age) {
  const at = world.entities[household.members[0]].location;
  const person = { id, kind: 'person', name: `P${id}`, householdId: household.id, age, sex: 'male', kin: { role: 'son' }, task: 'rest', chore: null, health: { condition: 'well' }, location: { ...at }, traits: { obedience: 6 } };
  world.entities[id] = person;
  household.members.push(id);
  return person;
}
const grownUp = (world, household) => members(world, household).find(person => !Number.isFinite(person.age) || person.age >= 16);
const offeredTo = (world, household, person, id) => choresFor(world, household, person).find(entry => entry.id === id) || null;
const finish = (world, person, most = 80) => { for (let tick = 0; tick < most && person.chore; tick++) stepWorld(world); };
const tomorrow = world => { const next = (Math.floor(world.minute / DAY) + 1) * DAY; for (let tick = 0; tick < 400 && world.minute < next; tick++) stepWorld(world); };
const dayNow = world => Math.floor(world.minute / DAY);
/** The first day of a month (0-based) on or after `day`. */
function firstOf(world, month, day = dayNow(world)) {
  for (let at = day; at < day + 800; at++) { const date = dateOf(world, at * DAY + 12 * 60); if (date.getUTCMonth() === month && date.getUTCDate() === 1) return at; }
  throw new Error('no such month');
}
/** A herd's month walked forward, without the world: `minded` days of a hand of `hand` written into the log first. */
function monthOf(world, household, { from, to, minded = 0, hand = 3 }) {
  household.herdDay = from - 1;
  household.herdCare = Array.from({ length: minded }, (_, i) => ({ d: to - 1 - i, h: { 1: 0.6, 2: 0.8, 3: 1 }[hand], c: { 1: 0.6, 2: 0.8, 3: 1 }[hand] }));
  household.herdLookedDay = to - 1;
  world.minute = to * DAY + 9 * 60;
  advanceStock(world, household);
  return herdOf(household);
}

// ------------------------------------------------------------------------------------------------ the hand

test('a hand with stock: dealt with the person, grown by the days at it, never past three, and nothing stored for a class saved before', () => {
  const world = home('herd-hand');
  const household = world.households['hh-1'];
  household.herd = { cattle: 6, hogs: 12 };
  const grown = grownUp(world, household);
  const dealt = herdingDealt(grown.id);
  assert.ok([1, 2, 3].includes(dealt), `dealt ${dealt}`);
  // Nothing stored: an old save's person is the hand their id deals them.
  assert.equal(grown.herding, undefined);
  assert.equal(herdingOf(grown), dealt);
  // Dealt across a class, every hand appears: it is a knack, not a constant.
  const hands = new Set(Object.values(world.entities).filter(one => one.kind === 'person').map(one => herdingDealt(one.id)));
  assert.deepEqual([...hands].sort(), [1, 2, 3], 'the class was dealt only some of the hands');
  // A day at it is a day learned - one a day however many rides - and every LEARN_DAYS days a hand better, never past three.
  // Somebody dealt the least knack, so every step of the learning shows.
  const learnerId = Array.from({ length: 50 }, (_, i) => `p-learner-${i}`).find(id => herdingDealt(id) === 1);
  const learner = kin(world, household, learnerId, 20);
  const start = herdingOf(learner);
  tendHerd(world, household, learner, { mounted: true });
  tendHerd(world, household, learner, { mounted: true });
  assert.equal(learner.herding.days, 1, 'two rides in a day were two days learned');
  for (let i = 1; i < LEARN_DAYS; i++) { world.minute += DAY; tendHerd(world, household, learner, { mounted: true }); }
  assert.equal(learner.herding.days, LEARN_DAYS);
  assert.equal(herdingOf(learner), Math.min(3, start + 1), 'eight days at the stock taught nothing');
  if (start < 3) assert.ok(world.events.some(event => event.actorId === learner.id && /a good hand with stock now|the best hand with stock/.test(event.text)), 'the better hand was not said');
  for (let i = 0; i < LEARN_DAYS * 3; i++) { world.minute += DAY; tendHerd(world, household, learner, { mounted: true }); }
  assert.equal(herdingOf(learner), 3, 'a hand went past three');
  // The page is told the hand of every person of a family with stock, never their dealt number alone.
  const view = projectWorld(world, household.id, 'student', { includeMap: false });
  assert.equal(view.entities.find(one => one.id === learner.id).hand, 3);
  assert.equal(view.entities.find(one => one.id === learner.id).rangeDays, learner.herding.days);
  validateWorld(world);
  // A save whose days at the stock cannot be is refused at the door.
  learner.herding = { days: 0, last: 1 };
  assert.throws(() => validateWorld(world), /Invalid days at the stock/);
});

test('who may: a child of seven minds the hogs, cattle from twelve, on the horse when it is free; once a day', () => {
  const world = home('herd-who');
  const household = world.households['hh-1'];
  household.herd = { cattle: 6, hogs: 12 };
  const five = kin(world, household, 'p-five', 5), seven = kin(world, household, 'p-seven', HOGS_FROM_AGE), twelve = kin(world, household, 'p-twelve', CATTLE_FROM_AGE);
  assert.equal(offeredTo(world, household, five, 'look-to-stock'), null, 'a child of five is offered the stock');
  assert.ok(offeredTo(world, household, seven, 'look-to-stock')?.can, 'a child of seven is not offered the hogs');
  assert.ok(offeredTo(world, household, twelve, 'look-to-stock')?.can, 'a boy of twelve is not offered the stock');
  // No hogs: a child has nothing to mind.
  household.herd = { cattle: 6, hogs: 0 };
  assert.equal(offeredTo(world, household, seven, 'look-to-stock'), null, 'a child of seven is offered cattle');
  household.herd = { cattle: 6, hogs: 12 };
  // The child minds the hogs: the hogs are looked to and the cattle are not.
  applyAction(world, household.id, { action: 'chore', entityId: seven.id, chore: 'look-to-stock' });
  finish(world, seven);
  assert.equal(household.hogsLookedDay, dayNow(world));
  assert.notEqual(household.herdLookedDay, dayNow(world), 'a child of seven worked the cattle');
  assert.ok(world.events.some(event => event.actorId === seven.id && /minded the hogs in the timber/.test(event.text)), 'the child minding the hogs was not said');
  // Once a day, refused in words.
  const again = choreAvailability(world, household, seven, 'look-to-stock');
  assert.equal(again.can, false, 'the stock was tended twice in a day by one person');
  assert.match(again.why, /has been out after the stock today/);
  // A grown hand takes the family's horse when it is free, and holds it until the day is done.
  const grown = grownUp(world, household);
  applyAction(world, household.id, { action: 'chore', entityId: grown.id, chore: 'look-to-stock' });
  const horse = household.property.map(id => world.entities[id]).find(beast => beast?.species === 'horse');
  if (horse) {
    assert.ok(grown.chore.with?.includes('horse'), 'the grown hand went out on foot with the horse free');
    assert.equal(grown.chore.mounted, true);
    assert.ok(choreAvailability(world, household, twelve, 'look-to-stock').can, 'the boy is refused the stock while the horse is out');
    applyAction(world, household.id, { action: 'chore', entityId: twelve.id, chore: 'look-to-stock' });
    assert.ok(!twelve.chore.with?.includes('horse'), 'two people rode one horse');
  }
  finish(world, grown); finish(world, twelve);
  assert.equal(household.herdLookedDay, dayNow(world), 'the grown hand did not look to the cattle');
  validateWorld(world);
});

// ------------------------------------------------------------------------------------------------ what minding does

test('minded through the month, the herd raises more of its young: the rates as they always were with nobody minding, half again minded', () => {
  const world = home('herd-young');
  const household = world.households['hh-1'];
  const april = firstOf(world, 3);
  const calves = minded => { household.herd = { cattle: 100, hogs: 0 }; return monthOf(world, household, { from: april, to: april, minded }).cattle - 100; };
  const left = calves(0);
  assert.ok(Math.abs(left - 100 * CALF_SHARE) <= 1, `a herd nobody minded dropped ${left} calves, not ${100 * CALF_SHARE}`);
  const minded = calves(CARE_DAYS);
  assert.ok(Math.abs(minded - 100 * CALF_SHARE * (1 + RAISED_BONUS)) <= 1, `a herd fully minded dropped ${minded} calves`);
  assert.ok(minded > left, 'minding raised no more calves');
  assert.deepEqual(household.herdYoung, { cattle: minded, hogs: 0, day: april }, 'the young were not written for the page');
  const november = firstOf(world, 10);
  household.herd = { cattle: 0, hogs: 100 };
  const pigs = monthOf(world, household, { from: november, to: november, minded: CARE_DAYS }).hogs - 100;
  assert.ok(Math.abs(pigs - 100 * PIG_SHARE * (1 + RAISED_BONUS)) <= 1, `a herd of hogs fully minded farrowed ${pigs}`);
  // A worse hand minds less in the same days.
  const handOf = level => kin(world, household, Array.from({ length: 80 }, (_, i) => `p-hand-${level}-${i}`).find(id => herdingDealt(id) === level && !world.entities[id]), 30);
  const mindedBy = person => { household.herdCare = []; for (let i = CARE_DAYS; i >= 1; i--) { world.minute = (november - i) * DAY + 9 * 60; tendHerd(world, household, person, { mounted: true }); } return careOf(world, household, 'hogs', november); };
  assert.ok(mindedBy(handOf(1)) < 1, 'a hand new to stock minds as well as the best');
  assert.equal(mindedBy(handOf(3)), 1, 'the best hand out the month minded it less than fully');
});

test('strays are out on the range, not gone: a hand brings them in by their knack, and what is not found goes for good', () => {
  const world = home('herd-strays');
  const household = world.households['hh-1'];
  household.herd = { cattle: 100, hogs: 100 };
  const may = firstOf(world, 5); // June: nothing is born in it, so the herd moves only by what strays.
  household.herdDay = may - 1; household.herdLookedDay = may - 60; world.minute = may * DAY + 9 * 60;
  advanceStock(world, household);
  const out = { ...household.herdStrayed };
  assert.ok(out.cattle > 0 && out.hogs > 0, `nothing strayed off a range nobody rode: ${JSON.stringify(out)}`);
  assert.equal(herdOf(household).cattle, 100 - out.cattle);
  // A hand of three brings in three in four of them.
  const hand = kin(world, household, 'p-hand', 30);
  hand.herding = { days: LEARN_DAYS * 3, last: may - 1 };
  const found = tendHerd(world, household, hand, { mounted: true });
  assert.ok(Math.abs(found.cattle - out.cattle * FIND_SHARE[3]) <= 1, `found ${found.cattle} of ${out.cattle}`);
  assert.equal(herdOf(household).cattle, 100 - out.cattle + found.cattle);
  assert.ok(world.events.some(event => event.actorId === hand.id && /brought in .* that had strayed/.test(event.text)), 'the strays brought in were not said');
  // What is left out halves at the next month's counting.
  const left = household.herdStrayed.cattle;
  household.herdDay = may; world.minute = firstOf(world, 6) * DAY + 9 * 60; household.herdLookedDay = firstOf(world, 6) - 1;
  advanceStock(world, household);
  assert.ok((household.herdStrayed?.cattle || 0) <= Math.ceil(left / 2), 'strays never went for good');
  validateWorld(world);
});

test('a minded herd is fat in its season and gives more meat and a better price; one left alone is thin in its lean months', () => {
  const world = home('herd-flesh');
  const household = world.households['hh-1'];
  household.herd = { cattle: 10, hogs: 10 };
  const june = firstOf(world, 5) + 10, march = firstOf(world, 2) + 10, november = firstOf(world, 10) + 10, august = firstOf(world, 7) + 10;
  const mind = day => { household.herdCare = Array.from({ length: CARE_DAYS }, (_, i) => ({ d: day - i, h: 1, c: 1 })); };
  household.herdCare = [];
  assert.equal(conditionOf(world, household, 'cattle', june), 'fair', 'a herd nobody minded is not as it always was');
  assert.equal(conditionOf(world, household, 'cattle', march), 'thin');
  assert.equal(conditionOf(world, household, 'hogs', august), 'thin');
  mind(june); assert.equal(conditionOf(world, household, 'cattle', june), 'fat');
  mind(november); assert.equal(conditionOf(world, household, 'hogs', november), 'fat');
  // The meat: a fat hog killed gives PORK_BY.fat; and a beef its hide.
  world.minute = november * DAY + 9 * 60;
  const killer = grownUp(world, household);
  const hides = household.resources.hides ?? 0;
  // The chore produces what these return (sim/chores.mjs `step.stock`); asked at the day chosen, without running the months between.
  assert.equal(killHog(world, household, killer), PORK_BY.fat, 'a fat hog gave no more than a fair one');
  assert.ok(world.events.some(event => /killed a fat hog/.test(event.text || '')), 'the fat hog was not said');
  household.herdCare = [];
  world.minute = august * DAY + 9 * 60;
  assert.equal(killHog(world, household, killer), PORK_BY.thin, 'a hog left alone through the summer is not thin');
  assert.equal(divideBeef(world, household, killer, []), 15, 'the family keeps what it can keep of any beef');
  assert.equal(household.resources.hides, hides + 1, 'the beef gave no hide');
  // The price at the pens by the flesh.
  household.herd = { cattle: 10, hogs: 10 };
  mind(june); world.minute = june * DAY + 9 * 60;
  assert.deepEqual(sellStock(world, household, 'cattle', 2), { sold: 2, got: 2 * SALE_COIN.cattle.fat, each: SALE_COIN.cattle.fat, condition: 'fat' });
  household.herdCare = []; world.minute = march * DAY + 9 * 60;
  assert.equal(sellStock(world, household, 'cattle', 1).got, SALE_COIN.cattle.thin);
  assert.ok(BEEF_BY.fat > BEEF_BY.fair && BEEF_BY.thin < BEEF_BY.fair);
  // Never more food than it costs: a fat hog is no more than the pens' hog in food.
  assert.ok(PORK_BY.fat <= 14, 'a hog bought for food and killed fat makes food out of nothing');
  // Never more coin than it cost: a head is never sold dearer than bought, but fat.
  assert.ok(SALE_COIN.cattle.fair * 2 < 10 && SALE_COIN.hogs.fat < 4);
});

// ------------------------------------------------------------------------------------------------ wealth

test('selling stock at the pens: chosen before anybody leaves, driven in at the cattle\'s pace, coin by the flesh, out of the herd', () => {
  const world = home('herd-sell');
  const household = world.households['hh-1'];
  household.herd = { cattle: 6, hogs: 12 };
  household.resources.money = 0;
  const grown = grownUp(world, household);
  const list = [{ id: 'stockman:sell-cattle', n: 2 }, { id: 'stockman:sell-hogs', n: 3 }];
  const quote = errandQuote(world, household, grown, list, {});
  assert.equal(quote.can, true, quote.why);
  assert.match(quote.how, /Drives 2 cattle and 3 hogs to the stock pens, at an ox's pace\./);
  assert.equal(quote.after.money, 2 * SALE_COIN.cattle.fair + 3 * SALE_COIN.hogs.fair, 'the quote is not by the flesh');
  // More than the herd has is refused before anybody goes.
  household.herd = { cattle: 6, hogs: 2 };
  const short = errandQuote(world, household, grown, [{ id: 'stockman:sell-hogs', n: 3 }], {});
  assert.equal(short.can, false, 'more hogs were sold than the herd has');
  assert.match(short.why, /only 2 hogs in the timber/);
  household.herd = { cattle: 6, hogs: 12 };
  applyAction(world, household.id, { action: 'chore', entityId: grown.id, chore: 'visit-shop', errand: list });
  assert.deepEqual(grown.drives, { cattle: 2, hogs: 3 }, 'the stock was not driven in');
  for (let tick = 0; tick < 400 && !grown.travel; tick++) stepWorld(world);
  assert.ok(grown.travel, 'the drover never set out');
  assert.ok(grown.travel.speed <= 0.66, `the drover went at ${grown.travel.speed}, not at the cattle's pace`);
  // Sold at the pens, the drover is driving nothing home: the road home goes at the drover's own pace.
  for (let tick = 0; tick < 1200 && grown.chore && !(grown.chore.step >= 3 && grown.travel); tick++) stepWorld(world);
  assert.ok(grown.travel, 'the drover never started home');
  assert.equal(grown.drives, undefined, 'the drover is driving home the stock he sold');
  finish(world, grown, 1200);
  assert.equal(grown.chore, null, 'the errand never ended');
  assert.deepEqual(herdOf(household), { cattle: 4, hogs: 9 }, 'the stock sold is still in the herd');
  assert.ok(household.resources.money >= 2 * SALE_COIN.cattle.thin + 3 * SALE_COIN.hogs.thin, `the family was paid ${household.resources.money}`);
  assert.ok(world.events.some(event => event.coin > 0 && /sold 2 cattle, (thin|fair|fat), to .* at the stock pens/.test(event.text)), 'the sale was not said with the coin');
  assert.equal(grown.drives, undefined, 'the drover is still driving stock after selling it');
  validateWorld(world);
});

test('the herd counts at the end: sold with an intact farm at the pens\' price by its flesh, and nothing for a herd left on the range', () => {
  const world = home('herd-end');
  const household = world.households['hh-1'];
  household.herd = { cattle: 6, hogs: 12 };
  const sale = farmReckoning(world, household);
  assert.equal(sale.kind, 'sale');
  const line = sale.items.find(item => /stock on the range/.test(item.what));
  assert.ok(line, 'the herd is not in the farm\'s sale');
  const day = dayNow(world);
  assert.equal(line.reales, 6 * SALE_COIN.cattle[conditionOf(world, household, 'cattle', day)] + 12 * SALE_COIN.hogs[conditionOf(world, household, 'hogs', day)]);
  household.herd = { cattle: 0, hogs: 0 };
  household.herdLeft = { cattle: 6, hogs: 12 };
  assert.ok(!farmReckoning(world, household).items.some(item => /stock on the range/.test(item.what)), 'a herd left on the range was sold');
});

// ------------------------------------------------------------------------------------------------ what the page draws

test('the page draws the real herd: a figure a head up to a cap, the young smaller, one group with its count for a big herd, fewer zoomed out', () => {
  const at = { x: 10, y: 10 };
  const base = { home: at, bounds: { minX: 9, maxX: 11, minY: 9, maxY: 11 }, hour: 12, seed: 'hh-1', time: 0 };
  const drawn = herd => herdFigures({ ...base, herd, scale: 4000 });
  const count = (figures, kind, young = false) => figures.filter(one => one.kind === kind && Boolean(one.young) === young).reduce((sum, one) => sum + one.count, 0);
  // Each head counted once, whatever is drawn: the figures' counts add up to the herd.
  for (const herd of [{ cattle: 6, hogs: 12 }, { cattle: 1, hogs: 0 }, { cattle: 40, hogs: 90, young: { cattle: 5, hogs: 20 } }]) {
    const figures = drawn(herd);
    assert.equal(count(figures, 'cattle') + count(figures, 'cattle', true), herd.cattle, `cattle drawn for ${JSON.stringify(herd)}`);
    assert.equal(count(figures, 'hogs') + count(figures, 'hogs', true), herd.hogs, `hogs drawn for ${JSON.stringify(herd)}`);
    assert.ok(figures.length <= HERD_DRAWN_MOST, `${figures.length} figures for ${JSON.stringify(herd)}`);
  }
  // A small herd is every head.
  assert.equal(drawn({ cattle: 6, hogs: 12 }).length, 18);
  // The young drawn smaller.
  const young = drawn({ cattle: 10, hogs: 0, young: { cattle: 3, hogs: 0 } });
  assert.equal(young.filter(one => one.young).length, 3);
  assert.ok(young.find(one => one.young).size < young.find(one => !one.young).size);
  // A big herd: a group stands for the rest and says how many.
  const big = drawn({ cattle: 40, hogs: 90 });
  assert.ok(big.some(one => one.count > 1), 'a big herd is drawn head by head');
  // Zoomed out: fewer figures, the same head counted.
  const far = herdFigures({ ...base, herd: { cattle: 6, hogs: 12 }, scale: 100 });
  assert.ok(far.length < 18 && far.length > 0, `zoomed out ${far.length} figures`);
  assert.equal(count(far, 'cattle') + count(far, 'hogs'), 18);
  // Nothing drawn for no herd.
  assert.equal(drawn({ cattle: 0, hogs: 0 }).length, 0);
  // The hover says what the server said: the counts, the flesh and who minded it.
  assert.match(herdHover({ cattle: 6, hogs: 12 }, { condition: { cattle: 'fat', hogs: 'fair' }, keeper: { name: 'Asa', hand: 3, days: 0 } }), /6 cattle, fat · 12 hogs, fair · minded today by Asa, the best hand with stock/);
  assert.match(herdHover({ cattle: 2, hogs: 0 }, { keeper: { name: 'Tom', hand: 1, now: true } }), /2 cattle · minded now by Tom, new to stock/);
  assert.match(herdHover({ cattle: 2, hogs: 0 }, {}), /nobody minding them/);
});

test('the page draws the herd near the house at night and with the herder when somebody is out after it', () => {
  const at = { x: 10, y: 10 };
  const base = { home: at, bounds: { minX: 8, maxX: 12, minY: 8, maxY: 12 }, seed: 'hh-1', time: 0, scale: 4000, herd: { cattle: 6, hogs: 6 } };
  const spread = figures => Math.max(...figures.map(one => Math.hypot(one.x - at.x, one.y - at.y)));
  const day = herdFigures({ ...base, hour: 12 }), night = herdFigures({ ...base, hour: 23 });
  assert.ok(spread(night) < 0.15 && spread(day) > 0.2, `the herd is as far out at night (${spread(night)}) as by day (${spread(day)})`);
  const herder = { x: 11.5, y: 11.5 };
  const driven = herdFigures({ ...base, hour: 12, herder });
  const near = figures => figures.filter(one => one.kind === 'cattle').reduce((sum, one) => sum + Math.hypot(one.x - herder.x, one.y - herder.y), 0);
  assert.ok(near(driven) < near(day), 'the cattle do not follow the herder');
  // Inside the family's land, every one.
  for (const one of [...day, ...night, ...driven]) assert.ok(one.x >= 8 && one.x <= 12 && one.y >= 8 && one.y <= 12, `a beast off the land at ${one.x},${one.y}`);
  // A labor is small (177 acres, about half a mile on a side): the herd is kept on it however far out it would graze.
  const labor = { minX: 9.9, maxX: 10.1, minY: 9.9, maxY: 10.1 };
  for (const one of herdFigures({ ...base, hour: 12, bounds: labor })) assert.ok(one.x >= labor.minX && one.x <= labor.maxX && one.y >= labor.minY && one.y <= labor.maxY, `a beast off a labor at ${one.x},${one.y}`);
});
