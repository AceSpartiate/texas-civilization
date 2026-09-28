// What families did for each other, and what it brings back: the owner's answer of 2026-09-28 to the design audit's B5, by
// multiple choice - "Yes: they remember and repay" (sim/neighbourly.mjs, docs/COLONIES.md §5.9b).
//
// One ledger of deeds, written where the world did them (a raising's hours, a trade, food shared on the road, the neighbours'
// call as the household always kept it); a family that owes one in need offers back through a named person - food when it is
// short, room in its wagon when both are told to leave, a hand at its raising - asked of a student and answered by a student,
// done at their rules by a family nobody plays; and the ending says who helped whom.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, projectWorld, stepWorld, validateWorld } from '../sim/world.mjs';
import { CHORES } from '../sim/chores.mjs';
import { HOUSES, RAISING_FROM, raising } from '../sim/houses.mjs';
import { tooYoung } from '../sim/family.mjs';
import { flightRoom, orderOut } from '../sim/scrape.mjs';
import { thinkFor } from '../sim/neighbours.mjs';
import { familyEnding, hostEnding } from '../sim/ending.mjs';
import {
  advanceNeighbourly, deedsOf, goodsSpace, homeMiles, noteDeed, owes, recordTakenIn, standings, takesIn, waitingOnNeighbour, NEAR_MILES,
} from '../sim/neighbourly.mjs';

const view = (world, householdId) => projectWorld(world, householdId, 'student', { includeMap: false });
const storyOf = (world, householdId) => world.events.filter(event => event.householdId === householdId).map(event => event.text).join('\n');
const grown = (world, household) => household.members.map(id => world.entities[id]).find(person => !tooYoung(person));
/** Look for needs as the tick does, on a tick it looks (every third). */
const look = world => { world.tick += (3 - (world.tick % 3)) % 3; advanceNeighbourly(world); };

/** A class running with every family arrived, and the two whose homes are nearest each other. */
function running(seed, { neighbours = false, map = 'gonzales' } = {}) {
  // The first of a few seeds whose two nearest families live within reach of each other.
  for (let turn = 0; turn < 12; turn++) {
    const world = createGonzalesWorld(turn ? `${seed}-${turn}` : seed, map === 'colonies' ? 15 : 5, { neighbours, map });
    world.status = 'running';
    for (let tick = 0; tick < 400 && Object.values(world.households).some(household => household.arriving); tick++) stepWorld(world);
    const households = Object.values(world.households);
    let pair = null;
    for (const a of households) for (const b of households) {
      if (a.id < b.id && (!pair || homeMiles(world, a, b) < homeMiles(world, pair[0], pair[1]))) pair = [a, b];
    }
    if (homeMiles(world, pair[0], pair[1]) > NEAR_MILES) continue;
    // Nobody else is played, and nobody else is short: only the pair's needs are in question.
    for (const household of households) { delete household.played; household.resources.food = Math.max(household.resources.food, 30); }
    return { world, helped: pair[0], helper: pair[1] };
  }
  throw new Error('no two families live near each other');
}
const at = (world, entity, siteId) => { entity.travel = null; entity.chore = null; entity.task = 'rest'; entity.location = { ...world.map.sites[siteId], siteId }; };

test('the ledger writes a deed for a raising, a trade, food shared on the road, and reads the neighbours\' call a class already kept', () => {
  const { world, helped, helper } = running('ledger-kinds');
  // A raising: one of the helper's people puts hours into the helped family's walls, through the chore a student sends.
  applyAction(world, helped.id, { action: 'plan-house', layout: 'round-log' });
  helped.house.work = Math.ceil(HOUSES['round-log'].work * RAISING_FROM);
  const hand = grown(world, helper);
  at(world, hand, helped.homeSiteId);
  applyAction(world, helper.id, { action: 'chore', entityId: hand.id, chore: 'help-raise' });
  for (let tick = 0; tick < 40 && hand.chore; tick++) stepWorld(world);
  if (hand.chore) applyAction(world, helper.id, { action: 'stop-chore', entityId: hand.id });
  const raised = deedsOf(world).find(deed => deed.kind === 'raising');
  assert.ok(raised, 'a raising left no deed');
  assert.deepEqual([raised.fromId, raised.toId, raised.personId], [helper.id, helped.id, hand.id]);
  assert.ok(raised.hours > 0);

  // A trade, face to face, answered.
  const one = grown(world, helped), other = grown(world, helper);
  at(world, one, 'gonzales'); at(world, other, 'gonzales');
  helped.resources.seed = 5;
  applyAction(world, helped.id, { action: 'offer', entityId: one.id, toEntityId: other.id, give: { seed: 2 }, ask: { food: 3 } });
  const offer = view(world, helper.id).offers[0];
  applyAction(world, helper.id, { action: 'accept-offer', entityId: other.id, offerId: offer.id });
  const traded = deedsOf(world).find(deed => deed.kind === 'trade');
  assert.deepEqual([traded.fromId, traded.toId, traded.give, traded.ask], [helped.id, helper.id, { seed: 2 }, { food: 3 }]);

  // Food shared with a family camped at the same refuge on the road east (sim/flight-work.mjs `share-food`).
  for (const household of [helped, helper]) household.flight = { status: 'refuged', refuge: 'gonzales', orderedMinute: 0 };
  helped.resources.food = 1;
  CHORES['share-food'].steps.at(-1).run(world, helper, other);
  const shared = deedsOf(world).find(deed => deed.kind === 'food');
  assert.deepEqual([shared.fromId, shared.toId, shared.personId, shared.amount], [helper.id, helped.id, other.id, 1]);

  // The neighbours' call to Gonzales, as a class saved before this kept it: on the household, and read as a deed.
  helped.relationships.neighbor = 2;
  const call = deedsOf(world).find(deed => deed.kind === 'call');
  assert.deepEqual([call.fromId, call.toId, call.weight], [helped.id, null, 2]);
  validateWorld(world);
});

test('an old save with no ledger reads its neighbours\' call, validates, and owes by settlement', () => {
  const { world, helped, helper } = running('ledger-old');
  delete world.neighbourly;
  helped.relationships.neighbor = 1;
  validateWorld(world);
  assert.equal(world.neighbourly, undefined, 'reading the ledger wrote one');
  const table = standings(world);
  // Everybody of the settlement that called owes the family that answered; the family owes nobody for its own answer.
  const same = (helper.settlementId || 'gonzales') === (helped.settlementId || 'gonzales');
  assert.equal(owes(table, helper.id, helped.id), same ? 1 : 0);
  assert.equal(owes(table, helped.id, helper.id), 0);
  // Two families that both answered are even.
  helper.relationships.neighbor = 1;
  if (same) assert.equal(owes(standings(world), helper.id, helped.id), 0);
});

test('a student\'s family that owes one short of food is asked; says yes; the family in need accepts and the food moves, said in both stories', () => {
  const { world, helped, helper } = running('repay-food');
  helped.played = true; helper.played = true;
  noteDeed(world, { kind: 'raising', fromId: helper.id, toId: helped.id, personId: grown(world, helper).id, hours: 4 });
  helper.resources.food = 0.5;
  helped.resources.food = 40;
  look(world);
  // Asked of the family that owes, never yet of the family in need.
  const asked = view(world, helped.id).neighbourly.asks;
  assert.equal(asked.length, 1);
  assert.equal(asked[0].side, 'give');
  assert.equal(asked[0].kind, 'food');
  assert.match(asked[0].text, /short of food/);
  assert.match(asked[0].text, /helping raise your walls/);
  assert.equal(view(world, helper.id).neighbourly.asks.length, 0, 'the family in need saw an offer nobody has made');
  const answerer = grown(world, helped);
  applyAction(world, helped.id, { action: 'neighbour-answer', entityId: answerer.id, askId: asked[0].id, answer: 'yes' });
  // Now the family in need is offered it, by the person who went.
  const offered = view(world, helper.id).neighbourly.asks;
  assert.equal(offered.length, 1);
  assert.equal(offered[0].side, 'take');
  assert.match(offered[0].text, new RegExp(`${answerer.name} of .* offers ${offered[0].amount} food`));
  const before = { mine: helped.resources.food, theirs: helper.resources.food };
  applyAction(world, helper.id, { action: 'neighbour-answer', entityId: grown(world, helper).id, askId: offered[0].id, answer: 'yes' });
  assert.equal(helper.resources.food, before.theirs + offered[0].amount);
  assert.equal(helped.resources.food, before.mine - offered[0].amount);
  const food = deedsOf(world).find(deed => deed.kind === 'food');
  assert.deepEqual([food.fromId, food.toId, food.personId], [helped.id, helper.id, answerer.id]);
  assert.match(storyOf(world, helper.id), new RegExp(`${answerer.name} of .* brought ${offered[0].amount} food over when the family was short: they remember`));
  assert.match(storyOf(world, helped.id), new RegExp(`${answerer.name} carried ${offered[0].amount} food over`));
  assert.equal(view(world, helper.id).neighbourly.asks.length, 0);
  // What the family in need is shown says nothing of the other family's stores.
  assert.doesNotMatch(JSON.stringify(view(world, helper.id).neighbourly), new RegExp(`\\b${helped.resources.food}\\b food`));
  validateWorld(world);
});

test('declined, nothing moves and it is said; a student may also not offer at all', () => {
  const { world, helped, helper } = running('repay-decline');
  helped.played = true; helper.played = true;
  noteDeed(world, { kind: 'raising', fromId: helper.id, toId: helped.id, hours: 4 });
  helper.resources.food = 0.5; helped.resources.food = 40;
  look(world);
  const [asked] = view(world, helped.id).neighbourly.asks;
  applyAction(world, helped.id, { action: 'neighbour-answer', entityId: grown(world, helped).id, askId: asked.id, answer: 'yes' });
  const [offered] = view(world, helper.id).neighbourly.asks;
  applyAction(world, helper.id, { action: 'neighbour-answer', entityId: grown(world, helper).id, askId: offered.id, answer: 'no' });
  assert.equal(helper.resources.food, 0.5, 'declined food moved');
  assert.equal(helped.resources.food, 40);
  assert.match(storyOf(world, helper.id), /said no to 3 food|said no to \d+ food/);
  assert.match(storyOf(world, helped.id), /said no to the food/);
  assert.ok(!deedsOf(world).some(deed => deed.kind === 'food'));
  // Not asked again the next day.
  world.minute += 1440; look(world);
  assert.equal(view(world, helped.id).neighbourly.asks.length, 0, 'asked again the day after an answer');

  // A student who will not offer: nothing reaches the family in need.
  const again = running('repay-refuse');
  again.helped.played = true; again.helper.played = true;
  noteDeed(again.world, { kind: 'raising', fromId: again.helper.id, toId: again.helped.id, hours: 4 });
  again.helper.resources.food = 0.5; again.helped.resources.food = 40;
  look(again.world);
  const [put] = view(again.world, again.helped.id).neighbourly.asks;
  applyAction(again.world, again.helped.id, { action: 'neighbour-answer', entityId: grown(again.world, again.helped).id, askId: put.id, answer: 'no' });
  assert.equal(view(again.world, again.helper.id).neighbourly?.asks.length ?? 0, 0);
  assert.match(storyOf(again.world, again.helped.id), /did not offer/);
  // Only the family asked can answer, and only its own offer.
  assert.throws(() => applyAction(again.world, again.helper.id, { action: 'neighbour-answer', entityId: grown(again.world, again.helper).id, askId: put.id, answer: 'yes' }), /no longer open/);
});

test('families nobody plays repay at their rules: an automatic family offers at once, and one in need takes it', () => {
  const { world, helped, helper } = running('repay-auto', { neighbours: true });
  // The helped family is the director's; the helper a student's.
  helper.played = true;
  noteDeed(world, { kind: 'raising', fromId: helper.id, toId: helped.id, hours: 4 });
  helper.resources.food = 0.5; helped.resources.food = 40;
  look(world);
  assert.equal(view(world, helped.id).neighbourly.asks.length, 0, 'a family nobody plays was asked');
  const [offered] = view(world, helper.id).neighbourly.asks;
  assert.equal(offered?.side, 'take', 'the automatic family made no offer');

  // Both nobody's: the food moves the tick it is seen.
  const both = running('repay-auto-both', { neighbours: true });
  noteDeed(both.world, { kind: 'raising', fromId: both.helper.id, toId: both.helped.id, hours: 4 });
  both.helper.resources.food = 0.5; both.helped.resources.food = 40;
  look(both.world);
  assert.ok(both.helper.resources.food > 0.5, 'an automatic family in need did not take the food');
  assert.ok(deedsOf(both.world).some(deed => deed.kind === 'food' && deed.fromId === both.helped.id));
  // Once repaid it is even, and nothing more is offered.
  assert.equal(owes(standings(both.world), both.helped.id, both.helper.id), 1, 'a raising weighs two, a food one');
  validateWorld(both.world);
});

/** Both families told to leave in the spring: the helped family with an empty wagon, the helper with more than its own will carry. */
function spring(seed, { neighbours = false, map } = {}) {
  const scene = running(seed, { neighbours, map });
  const { world } = scene;
  // The family that lends the room is the one of the two with a wagon (a family nobody plays may have made do without one).
  if (!scene.helped.property.some(id => world.entities[id]?.kind === 'wagon')) [scene.helped, scene.helper] = [scene.helper, scene.helped];
  const { helped, helper } = scene;
  world.period = 3; world.director.complete = false;
  for (const household of [helped, helper]) {
    orderOut(world, household);
    for (const id of household.members) at(world, world.entities[id], household.homeSiteId);
    for (const id of household.property) { const beast = world.entities[id]; beast.travel = null; beast.borrowedBy = null; beast.location = { ...world.map.sites[household.homeSiteId], siteId: household.homeSiteId }; }
  }
  helped.resources = { ...helped.resources, food: 8, seed: 0, cotton: 0, powder: 0 };
  helper.resources = { ...helper.resources, food: 0, seed: 4, cotton: 0, powder: 0 };
  // More food than its wagons hold by the room of sixteen barrels, whatever its wagons.
  helper.resources.food = Math.ceil((flightRoom(world, helper).room + 4) / 0.25);
  assert.equal(flightRoom(world, helped).mode, 'wagon', JSON.stringify(helped.property.map(id => [id, world.entities[id]?.location, world.entities[id]?.condition, world.entities[id]?.travel])));
  assert.ok(goodsSpace(helper) > flightRoom(world, helper).room, `the helper's goods fit its wagon: ${goodsSpace(helper)} in ${JSON.stringify(flightRoom(world, helper))}`);
  noteDeed(world, { kind: 'raising', fromId: helper.id, toId: helped.id, personId: grown(world, helper).id, hours: 6 });
  return scene;
}

test('in the Scrape the helped family offers room in its wagon; accepted, the helper can load more and the lender less', () => {
  const { world, helped, helper } = spring('repay-room');
  helped.played = true; helper.played = true;
  const own = { helped: flightRoom(world, helped).room, helper: flightRoom(world, helper).room };
  look(world);
  const [asked] = view(world, helped.id).neighbourly.asks;
  assert.equal(asked?.kind, 'room', 'the helped family was not asked about room in its wagon');
  assert.match(asked.text, /more than their wagon will carry east/);
  applyAction(world, helped.id, { action: 'neighbour-answer', entityId: grown(world, helped).id, askId: asked.id, answer: 'yes' });
  const [offered] = view(world, helper.id).neighbourly.asks;
  assert.match(offered.text, /offers room for \d+ in their wagon: they remember .* helping raise their walls/);
  applyAction(world, helper.id, { action: 'neighbour-answer', entityId: grown(world, helper).id, askId: offered.id, answer: 'yes' });
  assert.equal(flightRoom(world, helper).room, own.helper + offered.amount);
  assert.equal(flightRoom(world, helped).room, own.helped - offered.amount);
  assert.equal(view(world, helper.id).neighbourly.lent.room, offered.amount);
  // What would not have fitted now does.
  // The flight card is sent the room with the lent part in it, and says so (sim/scrape.mjs `flightProjection`).
  assert.equal(view(world, helper.id).flight.room, own.helper + offered.amount);
  const load = { food: Math.floor((own.helper + offered.amount - 4) / 0.25), seed: 4 };
  assert.ok(load.food * 0.25 + 4 > own.helper, 'the load would have fitted anyway');
  assert.match(storyOf(world, helper.id), /keeping room for \d+ of the family's goods in their wagon on the road east: they remember/);
  assert.ok(deedsOf(world).some(deed => deed.kind === 'room' && deed.fromId === helped.id && deed.toId === helper.id));
  validateWorld(world);

  // The lender going first takes the room with it, and says so.
  helped.flight.status = 'fled';
  advanceNeighbourly(world);
  assert.equal(flightRoom(world, helper).room, own.helper, 'the room stayed when the wagon went');
  assert.match(storyOf(world, helper.id), /have gone east, and the room in their wagon went with them/);
});

test('a family nobody plays holds its going for an answer about its wagon, half a day at most', () => {
  // On the colonies, where there are refuges east to make for (the invented country has none).
  const { world, helped, helper } = spring('repay-room-wait', { neighbours: true, map: 'colonies' });
  helper.played = true;
  look(world);
  assert.ok(view(world, helped.id).flight.refuges.length, 'nowhere to go');
  assert.equal(waitingOnNeighbour(world, helped.id), true, 'the automatic lender is not waiting for an answer');
  const project = id => view(world, id);
  const tried = thinkFor(world, helped, { project, act: input => applyAction(world, helped.id, input) });
  assert.ok(!tried.some(input => input.action === 'flee'), 'it went east with an answer awaited');
  world.minute += 721;
  assert.equal(waitingOnNeighbour(world, helped.id), false);
  // Half a day on, it goes.
  const later = thinkFor(world, helped, { project, act: input => applyAction(world, helped.id, input) });
  assert.ok(later.some(input => input.action === 'flee'), 'it never went');
});

test('a family nobody plays that owes a family raising its walls sends somebody to help raise them', () => {
  const { world, helped, helper } = running('repay-raising', { neighbours: true });
  helper.played = true;
  noteDeed(world, { kind: 'raising', fromId: helper.id, toId: helped.id, hours: 4 });
  applyAction(world, helper.id, { action: 'plan-house', layout: 'round-log' });
  helper.house.work = Math.ceil(HOUSES['round-log'].work * RAISING_FROM);
  assert.ok(raising(helper));
  const shown = view(world, helped.id).neighbourly.neighbours.find(one => one.householdId === helper.id);
  assert.deepEqual([shown.raising, shown.weOwe], [true, true]);
  // Its people at home and idle.
  for (const id of helped.members) at(world, world.entities[id], helped.homeSiteId);
  const project = id => view(world, id);
  const tried = thinkFor(world, helped, { project, act: input => applyAction(world, helped.id, input) });
  const going = tried.find(input => input.action === 'travel' && input.destination === helper.homeSiteId);
  assert.ok(going, 'nobody set out for the raising');
  assert.equal(tried.filter(input => input.action === 'travel' && input.destination === helper.homeSiteId).length, 1, 'more than one went');
  // Standing there, they put their hands to it.
  at(world, world.entities[going.entityId], helper.homeSiteId);
  const next = thinkFor(world, helped, { project, act: input => applyAction(world, helped.id, input) });
  assert.ok(next.some(input => input.action === 'chore' && input.chore === 'help-raise' && input.entityId === going.entityId));
  // The student's family is told a raising near it has begun, once.
  const other = running('repay-raising-told');
  other.helped.played = true;
  applyAction(other.world, other.helper.id, { action: 'plan-house', layout: 'round-log' });
  other.helper.house.work = Math.ceil(HOUSES['round-log'].work * RAISING_FROM);
  look(other.world); other.world.tick += 3; look(other.world);
  assert.equal((storyOf(other.world, other.helped.id).match(/are raising the walls of their house/g) || []).length, 1);
});

test('the ending says who helped whom, on the family\'s page and the Host\'s', () => {
  const { world, helped, helper } = running('repay-ending');
  const hand = grown(world, helper);
  noteDeed(world, { kind: 'raising', fromId: helper.id, toId: helped.id, personId: hand.id, hours: 6 });
  noteDeed(world, { kind: 'room', fromId: helped.id, toId: helper.id, personId: grown(world, helped).id, amount: 4 });
  world.status = 'ended';
  const theirs = familyEnding(world, helper.id).neighbours.map(line => line.text);
  const ours = familyEnding(world, helped.id).neighbours.map(line => line.text);
  assert.ok(theirs.some(text => text.startsWith(`${hand.name} helped`) && /raise their walls \(6 hours\)/.test(text)), theirs.join(' | '));
  assert.ok(theirs.some(text => /kept room for 4 of the family's goods in their wagon/.test(text)), theirs.join(' | '));
  assert.ok(ours.some(text => new RegExp(`${hand.name} of .* helped raise the family's walls`).test(text)), ours.join(' | '));
  const host = hostEnding(world).helped;
  assert.ok(host.some(text => /helped raise their walls \(6 hours\)/.test(text)), host.join(' | '));
  assert.ok(host.some(text => /kept room for 4 in their wagon/.test(text)), host.join(' | '));
  // Shown only once the class has ended, as the rest of the ending.
  world.status = 'running';
  assert.equal(view(world, helper.id).ending, undefined);
});

test('the family that would take children in is the one that owes most; taking them in is written as a deed', () => {
  const { world, helped: nearest, helper } = running('repay-shelter');
  // With nobody owing, the nearest family; once a farther family owes, that one.
  assert.equal(takesIn(world, helper.id), nearest.id);
  const helped = Object.values(world.households).filter(one => one.id !== helper.id && one.id !== nearest.id)
    .sort((a, b) => homeMiles(world, b, helper) - homeMiles(world, a, helper))[0];
  noteDeed(world, { kind: 'raising', fromId: helper.id, toId: helped.id, hours: 4 });
  assert.equal(takesIn(world, helper.id), helped.id);
  const children = helper.members.filter(id => tooYoung(world.entities[id]));
  recordTakenIn(world, helped.id, helper.id, children);
  assert.ok(deedsOf(world).some(deed => deed.kind === 'shelter' && deed.fromId === helped.id && deed.toId === helper.id));
  assert.match(storyOf(world, helper.id), /took in .*they remember/);
  validateWorld(world);
});

// Help earns hidden glory (owner, 2026-09-28, by multiple choice: "Any help"; sim/deeds.mjs `HELP_ROLE`).
const helpAwards = (world, householdId) => Object.values(world.glory?.[householdId]?.awards || {}).filter(award => ['helped', 'sheltered'].includes(award.role));

test('help to another family earns the helper glory at the support weight, counted and said at the ending, and never in who went', () => {
  const { world, helped, helper } = running('help-glory');
  // A raising, through the chore a student sends.
  applyAction(world, helped.id, { action: 'plan-house', layout: 'round-log' });
  helped.house.work = Math.ceil(HOUSES['round-log'].work * RAISING_FROM);
  const hand = grown(world, helper);
  at(world, hand, helped.homeSiteId);
  applyAction(world, helper.id, { action: 'chore', entityId: hand.id, chore: 'help-raise' });
  for (let tick = 0; tick < 40 && hand.chore; tick++) stepWorld(world);
  if (hand.chore) applyAction(world, helper.id, { action: 'stop-chore', entityId: hand.id });
  const [raised] = helpAwards(world, helper.id);
  assert.ok(raised, 'a raising earned nothing');
  assert.deepEqual([raised.role, raised.points, raised.personId], ['helped', 1, hand.id]);
  assert.equal(helpAwards(world, helped.id).length, 0, 'the family helped earned for being helped');
  // Children taken in weigh as being present.
  recordTakenIn(world, helped.id, helper.id, []);
  assert.equal(helpAwards(world, helped.id)[0]?.points, 2);
  // Nothing of it on a page while the class runs.
  assert.doesNotMatch(JSON.stringify(view(world, helper.id)), /help:raising|"helped"/);
  // At the ending: counted in the number, said in words, and not who went to the war.
  world.status = 'ended';
  const ending = familyEnding(world, helper.id);
  assert.equal(ending.glory, world.glory[helper.id].total);
  assert.ok(ending.awards.some(award => award.text.startsWith(`${hand.name} helped `) && /raise their walls/.test(award.text) && award.points === 1), JSON.stringify(ending.awards));
  assert.ok(!hostEnding(world).families.find(family => family.householdId === helper.id).went.includes(hand.name), 'help was counted as going to the war');
  assert.match(ending.story.join(' '), /Nobody from the family went to Gonzales or to the army/);
});

test('glory for help cannot be farmed: trades earn nothing, and each kind of help to one family counts once', () => {
  const { world, helped, helper } = running('help-farm');
  const one = grown(world, helped), other = grown(world, helper);
  at(world, one, 'gonzales'); at(world, other, 'gonzales');
  helped.resources.seed = 20; helper.resources.seed = 20;
  // Trading the same goods back and forth.
  for (let round = 0; round < 3; round++) {
    applyAction(world, helped.id, { action: 'offer', entityId: one.id, toEntityId: other.id, give: { seed: 2 }, ask: { food: 2 } });
    applyAction(world, helper.id, { action: 'accept-offer', entityId: other.id, offerId: view(world, helper.id).offers[0].id });
    applyAction(world, helper.id, { action: 'offer', entityId: other.id, toEntityId: one.id, give: { seed: 2 }, ask: { food: 2 } });
    applyAction(world, helped.id, { action: 'accept-offer', entityId: one.id, offerId: view(world, helped.id).offers[0].id });
  }
  assert.equal(deedsOf(world).filter(deed => deed.kind === 'trade').length, 6);
  assert.equal(world.glory?.[helped.id]?.total ?? 0, 0, 'trading earned glory');
  assert.equal(world.glory?.[helper.id]?.total ?? 0, 0, 'trading earned glory');
  // Food passed back and forth, by different people: once each way, however often.
  const people = household => household.members.map(id => world.entities[id]).filter(person => !tooYoung(person));
  for (const person of people(helped)) noteDeed(world, { kind: 'food', fromId: helped.id, toId: helper.id, personId: person.id, amount: 1 });
  for (const person of people(helper)) noteDeed(world, { kind: 'food', fromId: helper.id, toId: helped.id, personId: person.id, amount: 1 });
  noteDeed(world, { kind: 'food', fromId: helped.id, toId: helper.id, amount: 1 });
  assert.equal(helpAwards(world, helped.id).length, 1, 'food to one family counted more than once');
  assert.equal(helpAwards(world, helper.id).length, 1);
  // A different kind of help to the same family is its own.
  noteDeed(world, { kind: 'room', fromId: helped.id, toId: helper.id, amount: 4 });
  assert.equal(helpAwards(world, helped.id).length, 2);
  // The neighbours' call is not help to a family: it earned its own part at Gonzales.
  helped.relationships.neighbor = 2;
  assert.equal(helpAwards(world, helped.id).length, 2);
  validateWorld(world);
});
