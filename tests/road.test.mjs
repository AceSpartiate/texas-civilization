// The road east (owner, 2026-09-16, docs/ROAD_EAST.md): what a family does besides run in the Runaway Scrape, and what runs
// behind it. The rain and the bogged wagon - dug out, waited out, or left behind; a hunt from the camp with the family
// halted; nursing the sick and buying food among the families camped at a crossing; the pursuit - a warning while a Mexican
// column is near, the choice to press on, and a family that sits still overtaken and robbed, its men taken at a share; the
// neighbours' director, auto and absence answering the same questions by the same rule; the Host's words; a saved road.
//
// The seed is chosen for its weather: it rains on March 14 and 15 with the first family's wagon bogging both days, and the
// 16th is dry (sim/road.mjs `rainyDay`, hashed from the seed); its first family lives at Gonzales.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, projectWorld, rollFamily, stepWorld, validateWorld } from '../sim/world.mjs';
import { beginSecondPeriod, beginThirdPeriod } from '../sim/periods.mjs';
import { calendarMinutes } from '../sim/clock.mjs';
import { CHORES } from '../sim/chores.mjs';
import { WAGON_SPEED, WALK_SPEED } from '../sim/travel.mjs';
import { share } from '../sim/scrape.mjs';
import { BOG_SHARE, DIG_MILES, PRISONER_SHARE, SPENT_PACE, WARNING_MILES, OVERTAKEN_MILES, dayOf, rainyDay, pursuit } from '../sim/road.mjs';
import { waitingOn, whereWords } from '../sim/host.mjs';
import { needsOf } from '../public/family-panel.js';

const SEED = 'road-1638';
const DAY = 1440;
const view = (world, householdId) => projectWorld(world, householdId, 'student', { includeMap: false });
const until = (world, done, limit = 3000) => { for (let t = 0; t < limit && !done() && world.status === 'running'; t++) stepWorld(world); };
const main = (world, household) => world.entities[household.mainId || household.principalId];
const people = (world, household) => household.members.map(id => world.entities[id]).filter(one => one.kind === 'person');
const travellers = (world, household) => [...household.members, ...household.property].map(id => world.entities[id]).filter(one => one?.travel?.purpose === 'flee');

let shared = null;
/** A real-land class with rolled families, played through two periods and continued into the spring, running. */
const spring = (options = {}) => {
  if (options.neighbours) return build({ neighbours: true });
  return structuredClone(shared ??= build());
};
function build(options = {}) {
  const world = createGonzalesWorld(SEED, 8, { map: 'colonies', ...options });
  for (const household of Object.values(world.households)) rollFamily(world, household);
  world.status = 'running';
  until(world, () => world.director.complete, 9000);
  beginSecondPeriod(world); world.status = 'running';
  until(world, () => world.director.complete, 9000);
  beginThirdPeriod(world); world.status = 'running';
  return world;
}
/** The first family, a student's, told to leave and gone with the wagon and forty food. */
function fled(world, { auto = false } = {}) {
  const household = world.households['hh-1'];
  assert.equal(household.settlementId, 'gonzales', 'the seed no longer deals the first family to Gonzales');
  household.played = true;
  stepWorld(world);
  assert.equal(household.flight?.status, 'ordered');
  household.resources = { ...household.resources, food: 40, seed: 4, cotton: 2, powder: 3, money: 2 };
  if (auto) main(world, household).auto = true;
  applyAction(world, household.id, { action: 'flee', entityId: main(world, household).id, take: { food: 40, seed: 4, cotton: 2, powder: 3 }, refuge: 'san-felipe' });
  assert.equal(household.flight.status, 'fled');
  assert.equal(household.flight.mode, 'wagon');
  return household;
}

test('rain bogs the wagon: the family is halted and asked, the calendar holds while a played family decides, and digging out frees it with the ox spent and the diggers worn', () => {
  const world = spring();
  const household = fled(world);
  const person = main(world, household);
  until(world, () => household.flight.bog, 20);
  assert.ok(household.flight.bog, 'the wagon never bogged on a rain day');
  assert.equal(rainyDay(world, dayOf(world.minute)), true, 'it bogged on a dry day');
  assert.ok(share(world, household.id, `bog:${dayOf(world.minute)}`) < BOG_SHARE, 'it bogged against its share');
  assert.ok(travellers(world, household).every(one => one.travel.halted), 'the family went on with the wagon in the mud');
  const shown = view(world, household.id).flight;
  assert.equal(shown.ask?.id, 'bog');
  assert.deepEqual(shown.ask.options.map(option => option.id), ['dig', 'wait', 'abandon']);
  assert.ok(shown.ask.options.every(option => option.note && typeof option.can === 'boolean'), 'an answer without its price');
  assert.equal(shown.weather, 'rain');
  assert.deepEqual(needsOf(view(world, household.id), person.id).map(need => need.kind), ['road'], 'the main person carries no "!" for the road');
  assert.equal(calendarMinutes(world), 20, 'the calendar did not hold for a played family deciding');
  assert.equal(waitingOn(world, household), 1);
  assert.throws(() => applyAction(world, household.id, { action: 'road-answer', entityId: person.id, option: 'fly' }), /not one of the answers/);
  const before = Object.fromEntries(people(world, household).map(one => [one.id, one.exertion || 0]));
  applyAction(world, household.id, { action: 'road-answer', entityId: person.id, option: 'dig' });
  assert.ok(household.flight.bog.freeing, 'digging was not begun');
  assert.equal(household.flight.ask, undefined);
  assert.equal(calendarMinutes(world), 240, 'the calendar still held once the family had answered');
  assert.throws(() => applyAction(world, household.id, { action: 'road-answer', entityId: person.id, option: 'dig' }), /Nobody is waiting/);
  const held = person.travel.progress;
  until(world, () => !household.flight.bog, 6);
  assert.equal(household.flight.bog, undefined, 'the wagon was never dug out');
  assert.equal(person.travel.progress, held, 'the family moved while it dug');
  assert.ok(Number.isFinite(household.flight.oxSpentUntil), 'the ox was not spent');
  assert.equal(view(world, household.id).flight.oxSpent, true);
  for (const one of travellers(world, household)) assert.equal(one.travel.speed, WAGON_SPEED * SPENT_PACE, `${one.name} goes at full pace behind a spent ox`);
  for (const one of people(world, household)) if (one.kin?.role === 'father' || one.kin?.role === 'mother') assert.equal(one.exertion, before[one.id] + DIG_MILES, `${one.name} was not worn by the digging`);
  assert.ok(world.events.some(event => event.householdId === household.id && /came out of the mud/.test(event.text)));
  stepWorld(world);
  assert.ok(travellers(world, household).every(one => !one.travel.halted), 'the family stayed halted once the wagon was free');
  assert.ok(person.travel.progress > held, 'the family did not go on');
  until(world, () => !Number.isFinite(household.flight.oxSpentUntil), 10);
  for (const one of travellers(world, household)) assert.equal(one.travel.speed, WAGON_SPEED, `${one.name} still goes at half pace after the ox rested`);
  validateWorld(world);
});

test('a bogged family can wait for a dry day, or leave the wagon and go on on foot with what it can carry, faster', () => {
  // Waiting.
  let world = spring();
  let household = fled(world);
  until(world, () => household.flight.bog, 20);
  const bogDay = household.flight.bog.day;
  applyAction(world, household.id, { action: 'road-answer', entityId: main(world, household).id, option: 'wait' });
  assert.equal(household.flight.bog.waiting, true);
  assert.equal(view(world, household.id).flight.bogged.waiting, true);
  until(world, () => !household.flight.bog, 40);
  assert.equal(household.flight.bog, undefined, 'the ground never dried');
  assert.ok(dayOf(world.minute) > bogDay && !rainyDay(world, dayOf(world.minute)), 'the wagon came free on a rain day, or the same day');
  assert.equal(household.flight.oxSpentUntil, undefined, 'waiting spent the ox');
  assert.ok(world.events.some(event => event.householdId === household.id && /ground has dried/.test(event.text)));
  // Leaving the wagon.
  world = spring();
  household = fled(world);
  until(world, () => household.flight.bog, 20);
  const wagon = world.entities[`${household.id}-wagon`], ox = world.entities[`${household.id}-animal`], horse = world.entities[`${household.id}-horse`];
  const grown = people(world, household).filter(one => one.kin?.role === 'father' || one.kin?.role === 'mother' || one.age >= 16).length;
  const carried = view(world, household.id).flight.ask.options.find(option => option.id === 'abandon').note;
  assert.match(carried, new RegExp(`carries ${grown * 1.25}`), `the price does not say what the grown people carry: ${carried}`);
  applyAction(world, household.id, { action: 'road-answer', entityId: main(world, household).id, option: 'abandon' });
  assert.equal(household.flight.mode, 'foot');
  assert.equal(household.flight.bog, undefined);
  assert.equal(wagon.condition, 'lost'); assert.equal(ox.condition, 'lost');
  assert.equal(wagon.travel?.purpose, 'lost', 'the wagon did not stay where it was left');
  assert.equal(horse.travel?.purpose, 'flee', 'the horse was left with the wagon');
  for (const one of people(world, household).filter(one => one.travel)) { assert.equal(one.travel.mode, 'foot'); assert.equal(one.travel.speed, WALK_SPEED); assert.equal(one.travel.halted, undefined); }
  assert.ok(household.resources.food <= grown * 1.25 / 0.25 + 1e-9 && household.resources.food > 0, `the family carries ${household.resources.food} food on foot`);
  assert.equal(household.resources.money, 2, 'the coin was lost with the wagon');
  assert.ok(world.events.some(event => event.householdId === household.id && /left the wagon and the ox/.test(event.text)));
  validateWorld(world);
  until(world, () => household.flight.status === 'refuged', 400);
  assert.equal(household.flight.status, 'refuged', 'the family never reached its refuge on foot');
  assert.equal(wagon.travel?.purpose, 'lost', 'the lost wagon arrived with the family');
  validateWorld(world);
});

test('a hunt from the camp halts the family where it is, asks the shot as at home, and brings food back; then the family goes on', () => {
  const world = spring();
  const household = fled(world, { auto: true });
  const person = main(world, household);
  const hunter = people(world, household).find(one => one.id !== person.id && (one.kin?.role === 'father' || one.kin?.role === 'mother' || one.age >= 16)) || person;
  until(world, () => household.flight.crossing, 200);
  assert.ok(household.flight.crossing, 'the family never waited at a river');
  delete person.auto;
  // Not offered at home, offered here, refused without powder, in the family's own words.
  const offered = view(world, household.id).work[hunter.id].find(entry => entry.id === 'hunt-road');
  assert.ok(offered?.can, `the hunt from the camp is not open on the road: ${offered?.why}`);
  household.resources.powder = 0;
  assert.match(view(world, household.id).work[hunter.id].find(entry => entry.id === 'hunt-road').why, /powder/);
  household.resources.powder = 3;
  // A steady hand, so the shot goes home and the food is the hunt's.
  hunter.skills = { ...hunter.skills, hunting: 3 }; hunter.exertion = 0; hunter.health = { condition: 'well' };
  const food = household.resources.food;
  applyAction(world, household.id, { action: 'chore', entityId: hunter.id, chore: 'hunt-road' });
  assert.equal(hunter.chore?.id, 'hunt-road');
  assert.equal(view(world, household.id).flight.camp, 'Hunt from the camp');
  assert.equal(whereWords(world, hunter, household), 'waiting to get over at The Colorado crossing');
  until(world, () => hunter.chore?.ask, 12);
  assert.equal(hunter.chore?.ask?.id, 'shot', 'the hunt never stopped to ask');
  assert.deepEqual(needsOf(view(world, household.id), hunter.id).map(need => need.kind), ['asking']);
  applyAction(world, household.id, { action: 'answer-chore', entityId: hunter.id, option: 'take' });
  until(world, () => !hunter.chore, 12);
  assert.equal(hunter.chore, null, 'the hunt never ended');
  assert.ok(household.resources.food > food, `no food came back to the camp: ${household.resources.food} from ${food}`);
  assert.equal(household.resources.powder, 2, 'the shot spent no powder');
  // The crossing is long over; the camp held the family until the hunter came back, and then it went on - unless the same
  // tick's rain bogged the wagon, which is the road's own business and holds it again.
  assert.equal(household.flight.crossing, undefined, 'the river still held the family after the hunt');
  const held = person.travel.progress;
  if (!household.flight.bog) {
    assert.ok(travellers(world, household).every(one => !one.travel.halted), 'the family stayed halted once the hunt was over');
    stepWorld(world);
    assert.ok(person.travel.progress > held || household.flight.bog, 'the family did not go on after the hunt');
  }
  validateWorld(world);
});

test('the pursuit: a family camped at San Felipe is warned as Santa Anna’s column nears, its main person carries the "!", and pressing on takes it east to Lynchburg', () => {
  const world = spring();
  const household = fled(world, { auto: true });
  const person = main(world, household);
  until(world, () => household.flight.status === 'refuged', 400);
  assert.equal(household.flight.refuge, 'san-felipe');
  delete person.auto;
  assert.equal(household.flight.danger, undefined, 'the column was near before it entered the country');
  until(world, () => household.flight.danger, 2000);
  assert.ok(household.flight.danger, 'no warning ever came');
  assert.equal(household.flight.danger.id, 'santa-anna');
  assert.ok(household.flight.danger.miles <= WARNING_MILES);
  assert.ok(pursuit(world, world.map.sites['san-felipe']).miles <= WARNING_MILES);
  const shown = view(world, household.id).flight;
  assert.equal(shown.ask?.id, 'danger');
  assert.match(shown.ask.text, /Santa Anna/);
  assert.deepEqual(shown.ask.options.map(option => option.id), ['press-on', 'stay', 'abandon']);
  assert.match(shown.ask.options[0].label, /Lynchburg/);
  assert.deepEqual(needsOf(shown ? view(world, household.id) : null, person.id).map(need => need.kind), ['road']);
  assert.equal(calendarMinutes(world), 20, 'the calendar did not hold for the warning');
  assert.ok(world.events.some(event => event.householdId === household.id && /Word along the road: Santa Anna/.test(event.text)), 'the warning is not in the family\'s record');
  assert.equal(whereWords(world, person, household), 'at San Felipe de Austin, fled from home');
  applyAction(world, household.id, { action: 'road-answer', entityId: person.id, option: 'press-on' });
  assert.equal(household.flight.status, 'fled');
  assert.equal(household.flight.refuge, 'lynchburg');
  assert.equal(household.flight.mode, 'wagon');
  assert.ok(travellers(world, household).length >= 2, 'the family did not set out together');
  assert.equal(calendarMinutes(world), 240);
  until(world, () => household.flight.status === 'refuged', 300);
  assert.equal(household.flight.refuge, 'lynchburg', 'the family never reached Lynchburg');
  assert.equal(household.flight.overtaken, undefined, 'a family that pressed on was overtaken');
  validateWorld(world);
});

test('a family that stays is overtaken: the wagon, the animals and the goods taken, the grown men prisoners at the share, the rest let go; a played family is spotlit; and it is not taken twice', () => {
  const world = spring();
  const household = fled(world, { auto: true });
  const person = main(world, household);
  until(world, () => household.flight.status === 'refuged', 400);
  delete person.auto;
  until(world, () => household.flight.danger, 2000);
  applyAction(world, household.id, { action: 'road-answer', entityId: person.id, option: 'stay' });
  assert.equal(household.flight.danger.stayed, true);
  assert.equal(view(world, household.id).flight.danger.stayed, true);
  const before = people(world, household).filter(one => one.health.condition !== 'dead' && one.location.siteId === 'san-felipe');
  until(world, () => household.flight.overtaken, 400);
  assert.ok(household.flight.overtaken, 'the family that stayed was never overtaken');
  assert.ok(pursuit(world, world.map.sites['san-felipe']).miles <= OVERTAKEN_MILES || (household.flight.overtakenBy || []).includes('santa-anna'));
  assert.deepEqual([household.resources.food, household.resources.seed, household.resources.cotton, household.resources.powder], [0, 0, 0, 0], 'the goods were not taken');
  assert.equal(household.resources.money, 2, 'the coin was taken');
  for (const role of ['wagon', 'animal', 'horse']) { const beast = world.entities[`${household.id}-${role}`]; assert.equal(beast.condition, 'taken', `the ${role} was not taken`); assert.ok(world.map.sites[beast.location.siteId], `the ${role} is nowhere`); }
  for (const one of before) {
    const man = one.sex === 'male' && (one.kin?.role === 'father' || one.age >= 16);
    const taken = man && share(world, one.id, 'overtaken') < PRISONER_SHARE;
    assert.equal(one.health.condition === 'captured', taken, `${one.name} (${one.kin?.role}, ${one.age}) ${taken ? 'was let go' : 'was taken'}`);
    if (taken) assert.equal(whereWords(world, one, household), 'a prisoner');
  }
  assert.ok(world.events.some(event => event.householdId === household.id && /came up with the family at San Felipe/.test(event.text)));
  assert.equal(world.spotlight?.key, `overtaken:${household.id}:santa-anna`, 'the Host\'s camera did not go to the family');
  assert.equal(household.flight.status, 'refuged');
  assert.equal(household.flight.ask, undefined);
  assert.equal(view(world, household.id).flight.overtaken, true);
  validateWorld(world);
  const once = world.events.filter(event => event.householdId === household.id && /came up with the family/.test(event.text)).length;
  until(world, () => world.director.milestones['victory-word'], 2000);
  assert.equal(world.events.filter(event => event.householdId === household.id && /came up with the family/.test(event.text)).length, once, 'the same column took the family twice');
  assert.equal(household.flight.status, 'returning', 'the family did not turn home with the news');
  assert.equal(household.flight.mode, 'foot');
  validateWorld(world);
});

test('families nobody plays dig out, hunt from the camp when short, and press on when warned, through the director; an absent family, or one whose main person is on auto, is answered at once by the same rule', () => {
  // The director's family, from its own projection through applyAction.
  const world = spring({ neighbours: true });
  const household = world.households['hh-1'];
  household.resources = { ...household.resources, food: 12, powder: 3, money: 0 };
  until(world, () => household.flight?.status === 'fled', 12);
  assert.equal(household.flight?.status, 'fled', 'the director never fled its family');
  until(world, () => household.flight.bog, 20);
  assert.ok(household.flight.bog, 'the director\'s wagon never bogged');
  until(world, () => !household.flight.ask, 6);
  assert.equal(household.flight.ask, undefined, 'the director never answered the bog');
  const answer = world.events.find(event => event.householdId === household.id && event.decision === 'road-bog-dig');
  assert.ok(answer, 'the director did not dig its wagon out');
  assert.match(answer.text, /^The family will/, `the bog was answered by silence, not the director: ${answer.text}`);
  assert.equal(calendarMinutes(world), 240, 'a family nobody plays held the calendar');
  // Short of food with a shot in the house, one grown hand hunts from the camp.
  until(world, () => household.flight.crossing, 200);
  household.resources.food = 1;
  until(world, () => people(world, household).some(one => one.chore?.id === 'hunt-road'), 12);
  assert.ok(people(world, household).some(one => one.chore?.id === 'hunt-road'), 'the director did not hunt from the camp when short');
  assert.equal(people(world, household).filter(one => one.chore?.id === 'hunt-road').length, 1, 'two went hunting at once');
  // Warned at the refuge, it goes on east.
  until(world, () => household.flight.status === 'refuged', 400);
  assert.equal(household.flight.refuge, 'san-felipe');
  until(world, () => household.flight.refuge !== 'san-felipe', 2000);
  assert.ok(['lynchburg', 'liberty', 'nacogdoches'].includes(household.flight.refuge), `the director did not press on east when warned: ${household.flight.refuge}`);
  assert.equal(household.flight.overtaken, undefined);
  // An absent family is answered the tick after it is asked.
  const absent = spring();
  const theirs = fled(absent);
  absent.households['hh-1'].absent = true;
  until(absent, () => theirs.flight.bog, 20);
  assert.ok(theirs.flight.bog);
  assert.equal(calendarMinutes(absent), 240, 'an absent family held the calendar');
  stepWorld(absent);
  assert.equal(theirs.flight.ask, undefined, 'an absent family was not answered at once');
  assert.match(absent.events.find(event => event.householdId === theirs.id && event.decision === 'road-bog-dig')?.text || '', /deciding for itself/);
  // A main person on auto likewise.
  const auto = spring();
  const ours = fled(auto, { auto: true });
  until(auto, () => ours.flight.bog, 20);
  stepWorld(auto);
  assert.equal(ours.flight.ask, undefined, 'a family whose main person is on auto was not answered at once');
  assert.match(auto.events.find(event => event.householdId === ours.id && event.decision === 'road-bog-dig')?.text || '', /deciding for itself/);
});

test('nursing the sick keeps them alive that day and mends them sooner, and a real buys food among the families camped at a crossing', () => {
  const world = spring();
  const household = fled(world, { auto: true });
  until(world, () => household.flight.crossing, 200);
  assert.ok(household.flight.crossing);
  const [nurse, patient] = people(world, household).filter(one => one.kin?.role === 'father' || one.kin?.role === 'mother' || one.age >= 16);
  assert.ok(nurse && patient, 'the family has no two grown people');
  assert.match(view(world, household.id).work[nurse.id].find(entry => entry.id === 'tend-sick').why, /Nobody of the family is sick/);
  patient.health = { condition: 'sick', recoversAt: world.minute + 5 * DAY };
  const mends = patient.health.recoversAt;
  applyAction(world, household.id, { action: 'chore', entityId: nurse.id, chore: 'tend-sick' });
  assert.equal(nurse.chore?.id, 'tend-sick');
  assert.equal(view(world, household.id).flight.camp, 'Nurse the sick');
  until(world, () => !nurse.chore, 15);
  assert.equal(nurse.chore, null, 'the nursing never ended');
  assert.equal(patient.health.recoversAt, mends - DAY, `the sick did not mend a day sooner for the nursing: ${patient.health.recoversAt} against ${mends}`);
  assert.notEqual(patient.health.condition, 'dead', 'somebody nursed died');
  assert.ok(world.events.some(event => event.householdId === household.id && /a day nearer mending/.test(event.text)));
  // Trading.
  const buyer = people(world, household).find(one => one.id !== nurse.id && !one.chore && (one.kin?.role === 'father' || one.kin?.role === 'mother' || one.age >= 16)) || nurse;
  until(world, () => !buyer.chore, 12);
  household.resources.money = 2;
  const food = household.resources.food;
  applyAction(world, household.id, { action: 'chore', entityId: buyer.id, chore: 'trade-crossing' });
  until(world, () => !buyer.chore, 8);
  assert.equal(household.resources.money, 1, 'no real was paid');
  const bought = household.resources.food - food;
  assert.ok(bought > 1.4 && bought <= 2, `the real did not buy two food (less what the family ate meanwhile): ${bought}`);
  assert.ok(world.events.some(event => event.householdId === household.id && /paid 1 real among the families camped there/.test(event.text)));
  // Not on the open road between crossings.
  const moving = spring();
  const theirs = fled(moving, { auto: true });
  until(moving, () => !theirs.flight.bog && !theirs.flight.ask && travellers(moving, theirs).every(one => !one.travel.halted) && moving.tick % 2 === 0, 30);
  const there = view(moving, theirs.id).work[main(moving, theirs).id].find(entry => entry.id === 'trade-crossing');
  assert.equal(there?.can, false);
  assert.match(there?.why || '', /no other families camped here/);
});

test('the Host\'s words for the road, and a saved road that cannot be is refused', () => {
  const world = spring();
  const household = fled(world);
  const person = main(world, household);
  assert.equal(whereWords(world, person, household), 'on the road east to San Felipe de Austin');
  until(world, () => household.flight.bog, 20);
  assert.equal(whereWords(world, person, household), 'bogged in the mud on the road east to San Felipe de Austin');
  household.flight.ask = { id: 'landslide', openedTick: 1 };
  assert.throws(() => validateWorld(world), /Invalid road question/);
  household.flight.ask = { id: 'bog', openedMinute: world.minute };
  assert.throws(() => validateWorld(world), /Invalid road question/);
  delete household.flight.ask;
  household.flight.bog = { minute: world.minute };
  assert.throws(() => validateWorld(world), /Invalid bog/);
  household.flight.bog = { minute: world.minute, day: dayOf(world.minute) };
  validateWorld(world);
});
