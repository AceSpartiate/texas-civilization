// The owner's answers of 2026-09-29 to the triage's decisions (docs/audits/2026-09-29-triage.md): C4 "60 s minimum", D5
// "Supply request", D7 "0.3 a day" and D11 "Advance with calendar". D6 "Drop 'forward'" is held in tests/camp.test.mjs and D12
// "Shuffle by seed" in tests/mexican-advance.test.mjs, beside the rules they changed. Each test here was seen failing under the
// injection scripts/owner-rules-injections.mjs names for it (docs/evidence/owner-rules-injections.json).
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, projectWorld, rollFamily, stepWorld, validateWorld } from '../sim/world.mjs';
import { WORK_FOOD_A_DAY, advanceRoutine } from '../sim/routines.mjs';
import { advanceAges } from '../sim/ages.mjs';
import { ageNow, bornOf, canAnswerCalls, canFight, sexOf, tooYoung } from '../sim/family.mjs';
import { isBaby } from '../sim/babies.mjs';
import { dateOf } from '../sim/clock.mjs';
import { sicknessDay } from '../sim/disease.mjs';
import { QUESTION_BUDGETS, graveLimitKey, limitOut, spendDecisionBudget } from '../sim/decision-budget.mjs';
import { questionWaits } from '../sim/encounters.mjs';
import { directorProjection } from '../sim/directors.mjs';
import { SUPPLY_FOOD, SUPPLY_POWDER, spareHorse, supplyAskFor } from '../sim/supplies.mjs';
import { GLORY_WEIGHT, distanceMultiplier } from '../sim/glory.mjs';
import { familyEnding, worthLine } from '../sim/ending.mjs';
import { findPath } from '../sim/geography.mjs';
import { callMenu, needsOf } from '../public/family-panel.js';
import { MOMENTS, militaryNotices } from '../public/military-attention.js';
import { armyClass, until } from './support/campaign.mjs';
import { settle } from './support/settled.mjs';

const DAY = 1440;
const view = (world, householdId) => projectWorld(world, householdId, 'student', { includeMap: false });
const people = (world, household) => household.members.map(id => world.entities[id]).filter(Boolean);
/** A colonies class with every family rolled, home and under a roof, running. */
function rolledClass(seed, count = 5) {
  const world = createGonzalesWorld(seed, count, { map: 'colonies' });
  for (const household of Object.values(world.households)) rollFamily(world, household);
  settle(world);
  world.status = 'running';
  return world;
}
const iso = ms => new Date(ms).toISOString().slice(0, 10);
/** A birth date that makes this person `age` today and a year older tomorrow. */
function birthdayTomorrow(world, age) {
  const today = dateOf(world, world.minute);
  return iso(Date.UTC(today.getUTCFullYear() - (age + 1), today.getUTCMonth(), today.getUTCDate() + 1));
}

// ------------------------------------------------------------------------------------------------ D7, "0.3 a day"

test('D7: somebody working about the place brings in 0.3 food a day, where it was one', () => {
  assert.equal(WORK_FOOD_A_DAY, 0.3);
  const world = rolledClass('owner-rules-food');
  const household = Object.values(world.households).find(one => people(world, one).filter(person => !tooYoung(person)).length >= 2);
  const grown = people(world, household).filter(person => !tooYoung(person)).slice(0, 2);
  for (const person of people(world, household)) { person.task = 'rest'; person.chore = null; }
  household.resources.food = 100;
  // The same day three ways: nobody working, two working, and nobody working with one food more in the store. The third says
  // what one food is worth after the day's spoilage, so the two workers' part is read exactly.
  const day = (workers, food = 100) => {
    const copy = structuredClone(world), home = copy.households[household.id];
    home.resources.food = food;
    for (const person of grown.slice(0, workers)) copy.entities[person.id].task = 'work';
    advanceRoutine(copy, DAY);
    return home.resources.food;
  };
  const idle = day(0), working = day(2), oneMore = day(0, 101);
  const worth = oneMore - idle;
  assert.ok(Math.abs((working - idle) / worth - 2 * 0.3) < 1e-3, `two working about the place brought in ${((working - idle) / worth).toFixed(3)} food, not 0.6`);
  // Two grown people working about the place no longer feed even themselves: 0.6 in against 0.7 eaten.
  const pair = structuredClone(world), home = pair.households[household.id];
  for (const id of home.members) if (!grown.some(person => person.id === id)) pair.entities[id].location = { ...pair.map.sites['san-felipe'], siteId: 'san-felipe' };
  for (const person of grown) pair.entities[person.id].task = 'work';
  home.resources.food = 20;
  for (let d = 0; d < 10; d++) advanceRoutine(pair, DAY);
  assert.ok(home.resources.food < 20, `two working about the place alone went from 20 food to ${home.resources.food}`);
});

// ------------------------------------------------------------------------------------------------ D11, "Advance with calendar"

test('D11: a boy of fifteen turns sixteen on his birthday, and may then answer a call and go to the fighting', () => {
  const world = rolledClass('owner-rules-age');
  const boy = Object.values(world.entities).find(person => person.kind === 'person' && person.householdId && sexOf(person) === 'male' && person.kin?.role === 'son');
  assert.ok(boy, 'no son in this class');
  boy.age = 15; boy.born = birthdayTomorrow(world, 15);
  validateWorld(world);
  assert.equal(ageNow(world, boy), 15);
  assert.equal(canFight(boy), false); assert.equal(canAnswerCalls(boy), false);
  advanceAges(world);
  assert.equal(boy.age, 15, 'a birthday came a day early');
  world.minute += DAY;
  advanceAges(world);
  assert.equal(boy.age, 16, 'the birthday passed and he is still fifteen');
  assert.equal(canFight(boy), true); assert.equal(canAnswerCalls(boy), true);
  assert.ok(world.events.some(event => event.actorId === boy.id && /is sixteen today, and old enough now to answer for the family and to go to the fighting/.test(event.text)), 'the family was not told');
  // The panel's age is the age today, sent every tick, and the page shows it over the family's book fetched before the birthday.
  assert.equal(view(world, boy.householdId).entities.find(entity => entity.id === boy.id).age, 16);
  const menu = callMenu({ status: 'open', id: 'r', kind: 'call', text: 'Go?', answerers: { [boy.id]: [{ id: 'turn-out', label: 'Go', note: '', can: true }, { id: 'stay-put', label: 'Stay', note: '', can: true }] } },
    { people: [{ id: boy.id, role: 'son', age: 15 }], entities: [{ id: boy.id, name: boy.name, age: 16, health: { condition: 'well' } }] });
  assert.equal(menu.rows[0].who, 'Son, 16', 'the page shows the age the family\'s book had before the birthday');
  // Once, not every tick after.
  advanceAges(world);
  assert.equal(world.events.filter(event => event.actorId === boy.id && event.birthday === 16).length, 1);
  validateWorld(world);
});

test('D11: a baby turns two and is a baby no longer; a child of nine turns ten and may be sent; stepping the class moves them', () => {
  const world = rolledClass('owner-rules-baby');
  const [baby, child] = Object.values(world.entities).filter(person => person.kind === 'person' && person.householdId && ['son', 'daughter'].includes(person.kin?.role));
  baby.age = 1; baby.born = birthdayTomorrow(world, 1);
  child.age = 9; child.born = birthdayTomorrow(world, 9);
  assert.equal(isBaby(baby), true); assert.equal(tooYoung(child), true);
  // The class's own ticks, a day and a little of them: nothing but the calendar moves the ages.
  const end = world.minute + DAY + 60;
  until(world, () => world.minute >= end, 2000);
  assert.equal(baby.age, 2); assert.equal(isBaby(baby), false);
  assert.equal(child.age, 10); assert.equal(tooYoung(child), false);
  validateWorld(world);
});

test('D11: an old save has ages at the class start and no birth dates; each is given a stable one, the same every time it opens', () => {
  const world = rolledClass('owner-rules-old-age');
  const person = Object.values(world.entities).find(one => one.kind === 'person' && one.householdId && Number.isFinite(one.age));
  // As a class saved before 2026-09-22 has it: an age at the start, no date.
  delete person.born; person.age = 12;
  const saved = JSON.parse(JSON.stringify(world));
  const born = bornOf(saved, saved.entities[person.id]);
  assert.equal(bornOf(JSON.parse(JSON.stringify(saved)), saved.entities[person.id]), born, 'the derived birth date moved between two openings');
  // Opened: nobody's age jumps, whatever the calendar says; the ages are counted on from here.
  saved.minute += 200 * DAY;
  advanceAges(saved);
  assert.equal(saved.entities[person.id].age, 12, 'an old save aged everybody when it was opened');
  assert.equal(saved.agesMinute, saved.minute);
  // A year on, the birthday has passed: twelve becomes thirteen, and the date it was derived from is written down.
  saved.minute += 365 * DAY;
  advanceAges(saved);
  assert.equal(saved.entities[person.id].age, 13);
  assert.equal(saved.entities[person.id].born, born);
  // Opened again from that save: the age does not move again, and nothing else is told.
  const again = JSON.parse(JSON.stringify(saved));
  const told = again.events.length;
  advanceAges(again);
  assert.equal(again.entities[person.id].age, 13);
  assert.equal(again.events.length, told);
  validateWorld(again);
});

// ------------------------------------------------------------------------------------------------ C4, "60 s minimum"

/** A played family at its screen in the second period, one of whose small children is very sick and nursed by nobody. */
function veryIll(seed) {
  const world = rolledClass(seed);
  world.period = 2;
  const child = Object.values(world.entities).find(person => person.kind === 'person' && person.householdId && Number.isFinite(person.age) && person.age < 6);
  const household = world.households[child.householdId];
  household.played = true; delete household.absent;
  const day = Math.floor(world.minute / DAY);
  child.health = { condition: 'sick', recoversAt: world.minute + 20 * DAY, disease: 'measles', since: world.minute, grave: true, graveDay: day, day };
  return { world, household, child, day };
}
/** The first day on which, with nothing held, this very sick child dies. */
function dyingDay(seed) {
  for (let offset = 1; offset < 400; offset++) {
    const { world, household, child, day } = veryIll(seed);
    household.played = false;
    child.health.graveDay = day + offset - 1;
    sicknessDay(world, household, child, { day: day + offset, hungry: true });
    if (child.health.condition === 'dead') return offset;
  }
  return null;
}

test('C4: a very sick child of a played family cannot die in the minute after they are said to be very sick; after it, they can', () => {
  assert.equal(QUESTION_BUDGETS.grave, 60_000);
  const offset = dyingDay('owner-rules-grave');
  assert.ok(offset, 'no day kills this child: the test cannot tell a hold from luck');
  const { world, household, child, day } = veryIll('owner-rules-grave');
  child.health.graveDay = day + offset - 1;
  // Forty real seconds into the minute: the same day's roll that kills a child nobody plays kills nobody here.
  world.decisionClock = { [graveLimitKey(child)]: { personId: child.id, spent: 40_000, of: 60_000, limit: 'grave' } };
  sicknessDay(world, household, child, { day: day + offset, hungry: true });
  assert.equal(child.health.condition, 'sick', 'a very sick child died inside the minute');
  assert.equal(child.health.grave, true, 'the minute eased them without nursing');
  assert.equal(child.health.graveDay, day + offset, 'the very sick days did not wait with the minute');
  // The minute is out: the next day the record's own chance applies again.
  world.decisionClock[graveLimitKey(child)].spent = 60_000;
  assert.equal(limitOut(world, graveLimitKey(child)), true);
  let died = false;
  for (let more = 1; more <= 400 && !died && child.health.grave; more++) {
    child.health.graveDay = day + offset + more - 1;
    sicknessDay(world, household, child, { day: day + offset + more, hungry: true });
    died = child.health.condition === 'dead';
  }
  assert.ok(died, 'after the minute nothing could kill them');
});

test('C4: the minute runs on the real clock from when they are very sick, is shown on the "!" and the card, and is nobody\'s to hold for a family nobody plays or in the first period', () => {
  const { world, household, child } = veryIll('owner-rules-grave-clock');
  // Ten real seconds a tick: after the first tick the clock has begun, and the "!" counts down from what is left.
  stepWorld(world, { realMs: 10_000 });
  const entry = world.decisionClock?.[graveLimitKey(child)];
  assert.ok(entry, 'no minute started for a very sick child of a played family');
  const shown = view(world, household.id);
  const entity = shown.entities.find(one => one.id === child.id);
  assert.ok(Number.isFinite(entity.sickness?.leftMs) && entity.sickness.leftMs <= 60_000 && entity.sickness.leftMs > 0, `the row carries no time left (${entity.sickness?.leftMs})`);
  const need = needsOf(shown, child.id).find(one => one.kind === 'sick');
  assert.equal(need?.leftMs, entity.sickness.leftMs, 'the "!" does not show the time left to nurse them');
  const card = militaryNotices(shown).find(notice => notice.kind === 'sick' && notice.entityId === child.id);
  assert.equal(card?.leftMs, entity.sickness.leftMs, 'the story card does not show the time left');
  // Six more ticks of ten seconds: the minute is out, and the row no longer counts anything down.
  // Through the whole minute, days of the second period passing under it, they were neither dead nor past the worst unnursed.
  for (let t = 0; t < 6; t++) stepWorld(world, { realMs: 10_000 });
  assert.equal(child.health.condition, 'sick'); assert.equal(child.health.grave, true);
  assert.equal(limitOut(world, graveLimitKey(child)), true);
  assert.equal(view(world, household.id).entities.find(one => one.id === child.id).sickness?.leftMs, undefined);
  // A family nobody plays, a family whose student has gone, and anybody in the first period: nothing is counted or held.
  for (const setUp of [one => { one.household.played = false; }, one => { one.household.absent = true; }, one => { one.world.period = 1; }]) {
    const other = veryIll('owner-rules-grave-clock');
    setUp(other);
    stepWorld(other.world, { realMs: 10_000 });
    assert.equal(other.world.decisionClock?.[graveLimitKey(other.child)], undefined, 'a minute was held for nobody at a screen');
  }
  validateWorld(world);
});

// ------------------------------------------------------------------------------------------------ D5, "Supply request"

/** A class on the real land with three men in the army and the rest at home, just before the army's first ask. */
function beforeTheAsk(seed = 'owner-rules-supply') {
  const { world, sent, idle } = armyClass(seed, { to: 'leave-cibolo' });
  for (const id of idle) world.households[id].played = true;
  return { world, sent, idle };
}
const askOf = (world, householdId, askId) => world.supplies?.[householdId]?.[askId];

test('D5: in the last week of October the army asks every family with nobody in it, and not a family whose man is serving', () => {
  const { world, sent, idle } = beforeTheAsk();
  until(world, () => idle.every(id => askOf(world, id, 'supply-autumn')), 3000);
  for (const id of idle) assert.ok(askOf(world, id, 'supply-autumn'), `${id}, with nobody in the army, was not asked`);
  for (const { householdId } of sent) assert.equal(askOf(world, householdId, 'supply-autumn'), undefined, `${householdId}, whose man is with the army, was asked as if it had sent nobody`);
  const asked = askOf(world, idle[0], 'supply-autumn');
  // Not before the committee's word, dated October 26 (`HIST-TEX-960`).
  assert.ok(dateOf(world, asked.offeredMinute).toISOString() >= '1835-10-26T09:00', `asked on ${dateOf(world, asked.offeredMinute).toISOString()}`);
  // The family's request, on the card, the "!" and the story card, answered by those at home.
  const shown = view(world, idle[0]);
  assert.equal(shown.request?.kind, 'supply');
  assert.match(shown.request.text, /army before Béxar is short of bread/);
  const answerers = Object.entries(shown.request.answerers);
  assert.ok(answerers.length, 'nobody at home may answer it');
  for (const [id, options] of answerers) {
    assert.deepEqual(options.map(option => option.id), ['supply-food', 'supply-powder', 'supply-horse', 'supply-none']);
    assert.equal(world.entities[id].location.siteId, world.households[idle[0]].homeSiteId, 'somebody away from home was asked to hand it over');
    assert.ok(needsOf(shown, id).some(need => need.kind === 'call'), 'no "!" on who may answer');
  }
  assert.equal(MOMENTS.call.title(null, shown), 'The army asks for supplies');
  assert.equal(MOMENTS.call.action(null, shown), 'Choose what to send');
  validateWorld(world);
});

test('D5: sending is a real cost and earns `supplied` from Béxar; keeping earns nothing; what the family has not got is refused with the reason on the control', () => {
  const { world, idle } = beforeTheAsk();
  until(world, () => idle.every(id => askOf(world, id, 'supply-autumn')), 3000);
  const [first, second, third] = idle;
  const answerer = id => Object.keys(view(world, id).request.answerers)[0];
  // Powder: two out of the house, and the support part in the siege at the miles from Béxar.
  world.households[first].resources.powder = 5;
  const firstAnswerer = answerer(first);
  applyAction(world, first, { action: 'supply-powder', entityId: firstAnswerer });
  assert.equal(world.households[first].resources.powder, 5 - SUPPLY_POWDER);
  const award = world.glory[first].awards[`supply-autumn:${askOf(world, first, 'supply-autumn').actorId}`];
  assert.ok(award, 'sending earned nothing');
  assert.equal(award.role, 'supplied');
  // Flat (owner, 2026-09-30, "Flat"): counted once, not times the miles from Béxar, since nobody of the family went with it - and
  // this family lives far enough from Béxar that the miles would have multiplied it.
  const miles = findPath(world.map, 'bexar', world.households[first].homeSiteId).distance;
  assert.ok(distanceMultiplier(miles) > 1, 'this family lives within fifteen miles of Béxar: flat and multiplied cannot be told apart');
  assert.equal(award.points, GLORY_WEIGHT.supplied, `sending earned ${award.points} glory, not the flat ${GLORY_WEIGHT.supplied}`);
  assert.equal(award.flat, true);
  // Said so at the ending: the sum and the story line.
  assert.equal(worthLine(award), 'Carrying supplies counts 1, once: nobody of the family went with it = 1 glory.');
  const told = familyEnding(world, first)?.awards?.find(one => one.role === 'supplied');
  assert.match(told?.text || '', /sent supplies to the army before Béxar, when it asked the settlements in October\.$/, `the ending says "${told?.text}"`);
  assert.equal(supplyAskFor(world, first), null, 'the ask stayed open after it was answered');
  // One answer for the family: asked again, it is refused.
  assert.throws(() => applyAction(world, first, { action: 'supply-food', entityId: firstAnswerer }), /Nobody is asking/);
  // The horse: gone from the family for good, and nothing left pointing at it.
  const horse = spareHorse(world, world.households[second]);
  assert.ok(horse, 'this family has no horse free to send: the test checks nothing about the horse');
  applyAction(world, second, { action: 'supply-horse', entityId: answerer(second) });
  assert.equal(world.entities[horse.id], undefined, 'the horse sent west is still at home');
  assert.ok(!world.households[second].property.includes(horse.id));
  assert.equal(spareHorse(world, world.households[second]), null);
  // Food the family has not got: refused, with the words the control shows, and nothing spent.
  world.households[third].resources.food = SUPPLY_FOOD - 1;
  const option = view(world, third).request.answerers[answerer(third)].find(one => one.id === 'supply-food');
  assert.equal(option.can, false);
  assert.match(option.why, /less than 6 food/);
  assert.throws(() => applyAction(world, third, { action: 'supply-food', entityId: answerer(third) }), new RegExp(option.why));
  assert.equal(world.households[third].resources.food, SUPPLY_FOOD - 1);
  // Keeping everything is a whole answer, and earns nothing.
  applyAction(world, third, { action: 'supply-none', entityId: answerer(third) });
  assert.equal(askOf(world, third, 'supply-autumn').status, 'kept');
  assert.equal(Object.keys(world.glory?.[third]?.awards || {}).length, 0, 'keeping earned glory');
  validateWorld(world);
});

test('D5: the ask waits behind a rider and its minutes with it, lapses after the call\'s five real minutes with nothing sent, and the flour ask goes to every family at home', () => {
  const { world, sent, idle } = beforeTheAsk();
  until(world, () => askOf(world, idle[0], 'supply-autumn'), 3000);
  const id = idle[0], ask = askOf(world, id, 'supply-autumn');
  // A rider standing talking with the family when it was put (only what the queue reads of him): not shown, none of its minutes
  // run, and his conversation would say one more thing waits.
  world.encounters ??= {};
  world.encounters['rider-test'] = { id: 'rider-test', status: 'open', householdId: id, openedMinute: ask.offeredMinute, listenerId: world.households[id].principalId, carrierId: world.households[id].principalId };
  assert.equal(questionWaits(world, id, supplyAskFor(world, id)), true, 'the ask does not wait behind the rider');
  assert.equal(directorProjection(world, id, 'student').request, null, 'the ask was shown over the rider');
  spendDecisionBudget(world, 60_000);
  const key = `call:supply:${id}:supply-autumn`;
  assert.ok(!(world.decisionClock?.[key]?.spent > 0), 'its minutes ran while it waited behind the rider');
  delete world.encounters['rider-test'];
  assert.equal(directorProjection(world, id, 'student').request?.kind, 'supply');
  // Shown now: five real minutes, and then it lapses, nothing sent.
  const powder = world.households[id].resources.powder;
  let ticks = 0;
  for (; ticks < 40 && askOf(world, id, 'supply-autumn').status === 'open'; ticks++) stepWorld(world, { realMs: 10_000 });
  assert.equal(askOf(world, id, 'supply-autumn').status, 'expired');
  assert.ok(ticks >= 29 && ticks <= 31, `it lapsed after ${ticks} ticks of ten real seconds, not five minutes`);
  assert.ok(world.events.some(event => event.householdId === id && event.lapsed && /army's request in time, and it lapsed. Nothing was sent/.test(event.text)));
  assert.equal(world.households[id].resources.powder, powder, 'a lapsed ask took the powder');
  assert.equal(Object.keys(world.glory?.[id]?.awards || {}).some(key => key.startsWith('supply-')), false, 'a lapsed ask earned glory');
  // After the flour ran out: every family with somebody at home, the ones with a man in the army too.
  until(world, () => world.minute >= Math.round((Date.UTC(1835, 10, 26, 10) - Date.UTC(1835, 8, 28, 6)) / 60000), 6000);
  until(world, () => sent.every(({ householdId }) => askOf(world, householdId, 'supply-flour')) || world.director.complete, 400);
  for (const { householdId } of sent) assert.ok(askOf(world, householdId, 'supply-flour'), `${householdId}, with a man in the army, was not asked for flour`);
  assert.match(askOf(world, sent[0].householdId, 'supply-flour').text, /out of flour and the corn is gone/);
  validateWorld(world);
});
