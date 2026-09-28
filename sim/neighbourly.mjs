// What families did for each other, and what it brings back: the owner's answer of 2026-09-28 to docs/audits/2026-09-28-design.md
// B5 ("help between families is recorded and never used again"), by multiple choice: **"Yes: they remember and repay"** - a family
// you helped offers help back when you need it (room in their wagon in the Scrape, food when you are short, taking in your
// children), and helping is recorded in the ending.
//
// **One ledger** (`world.neighbourly.deeds`): every raising a neighbour put hours into, every trade, every food carried over, the
// room kept in a wagon, children taken in - written once, where the world did it, by small hooks in sim/houses.mjs, sim/trade.mjs
// and sim/flight-work.mjs. The neighbours' call to Gonzales is read from the household's own `relationships.neighbor`, the one
// field that recorded it before this module (sim/directors.mjs `settleHelp`), so a class saved before reads the same and no
// `saveVersion` moved. A deed has a weight (`DEED_WEIGHT`); what one family owes another is the other's deeds for it less its own
// for the other (`standings`). A fair trade weighs nothing: it was even when it was made.
//
// **Repayment when needed**, through a named person and said in both stories. When a family that was helped can see the family
// that helped it in need, it offers back: food when the helper is short (at home, a few miles apart, or camped at the same refuge),
// room in its wagon for the helper's goods when both are told to leave, and a hand at the helper's raising. A family a student plays
// is **asked** first whether to offer (the student may say no), and a student's family that is offered help **may accept or
// decline**. A family nobody plays offers and accepts at its rules (sim/neighbours.mjs), and waits half a day for an answer about
// the wagon before it goes. Children taken in are the other builder's rule (the oldest child steps up, or a neighbour takes them
// in): `takesIn` names the family that would, the one that owes most, and `recordTakenIn` writes it here.
//
// **The ending** says it (sim/ending.mjs): who helped whom, in plain words, on each family's page and the Host's. Whether helping
// earns glory is the owner's open question (docs/MONEY_AND_GLORY.md, the support tier, against "only major historical events earn
// glory"): nothing here awards any.
//
// Every number is this game's own (`FIC-GONZ-760`). No die is rolled anywhere in this file.
import { record } from './events.mjs';
import { householdName, tooYoung } from './family.mjs';
import { raising } from './houses.mjs';
import { FLIGHT_SPACE, flightRoom, scrapeOn } from './scrape.mjs';
import { EATEN_A_DAY, FOOD_KEPT_PER_PERSON, automatic, mouthsAt } from './neighbours.mjs';
import { DEED_WEIGHT, ROOM_WAIT_MINUTES, noteDeed, state } from './deeds.mjs';

// The ledger's leaf (sim/deeds.mjs), exported from here too: this is where the rest of the game asks for it.
export { DEED_WEIGHT, ROOM_WAIT_MINUTES, lentRoom, noteDeed, raisingHand, waitingOnNeighbour } from './deeds.mjs';

/** How near two homes must be for the families to know of each other's raising and to carry food over: straight miles. */
export const NEAR_MILES = 8;
/** A family with less than this many days' food in the house is short. */
export const SHORT_DAYS = 3;
/** What a family that remembers brings: up to three days of the other's eating, and never more than this at once. */
export const FOOD_GIVEN_DAYS = 3, FOOD_GIVEN_MAX = 8;
/** An offer stands a day; after an answer or a lapse the same family is not offered the same thing again for three. */
export const ASK_MINUTES = 1440, ASK_AGAIN_MINUTES = 3 * 1440;
/** Needs are looked for every third tick, as a family nobody plays thinks. */
export const LOOK_EVERY = 3;
export const ASK_KINDS = Object.freeze(['food', 'room']);
const CLAIM = 'FIC-GONZ-760';
const GONE = ['dead', 'captured'];

const cap = text => text.charAt(0).toUpperCase() + text.slice(1);
const settlementOf = household => household.settlementId || 'gonzales';
const named = (world, household) => householdName(world, household);

/**
 * Every deed, the written ones and the neighbours' call to Gonzales as the household has always kept it
 * (`relationships.neighbor`: 1 for carrying food to town, 2 for standing at the camp, sim/directors.mjs `settleHelp`).
 */
export function deedsOf(world) {
  const called = [];
  for (const household of Object.values(world.households || {})) {
    const weight = household.relationships?.neighbor || 0;
    if (weight > 0) called.push({ id: `call-${household.id}`, kind: 'call', fromId: household.id, toId: null, weight, settlementId: settlementOf(household), minute: world.requests?.[household.id]?.offeredMinute ?? 0, ...(world.requests?.[household.id]?.actorId && { personId: world.requests[household.id].actorId }) });
  }
  return [...(world.neighbourly?.deeds || []), ...called];
}
export const weightOf = deed => (deed.kind === 'call' ? deed.weight || 1 : DEED_WEIGHT[deed.kind] || 0);

/**
 * What each family owes each other: `table[a][b]` is what a owes b (negative when b owes a). The neighbours' call is owed by every
 * other family of the settlement that called, and two families that both answered are even.
 */
export function standings(world) {
  const table = {};
  const add = (debtor, creditor, weight) => {
    if (debtor === creditor || !weight) return;
    (table[debtor] ??= {})[creditor] = (table[debtor][creditor] || 0) + weight;
    (table[creditor] ??= {})[debtor] = (table[creditor][debtor] || 0) - weight;
  };
  const households = Object.values(world.households || {});
  for (const deed of deedsOf(world)) {
    const weight = weightOf(deed);
    if (deed.toId) add(deed.toId, deed.fromId, weight);
    else if (deed.kind === 'call') for (const other of households) if (settlementOf(other) === deed.settlementId) add(other.id, deed.fromId, weight);
  }
  return table;
}
export const owes = (table, debtorId, creditorId) => Math.max(0, table[debtorId]?.[creditorId] || 0);

/** Whether two families have had anything to do with each other: a deed either way (the neighbours' call is not meeting). */
export function acquainted(world, oneId, otherId) {
  return (world.neighbourly?.deeds || []).some(deed => (deed.fromId === oneId && deed.toId === otherId) || (deed.fromId === otherId && deed.toId === oneId));
}

/** The deed the family remembers when it helps back: the heaviest the other did for it, the latest of those. */
export function remembered(world, debtorId, creditorId) {
  const debtor = world.households[debtorId];
  const theirs = deedsOf(world).filter(deed => deed.fromId === creditorId && weightOf(deed) > 0
    && (deed.toId === debtorId || (deed.kind === 'call' && debtor && settlementOf(debtor) === deed.settlementId)));
  return theirs.sort((a, b) => weightOf(b) - weightOf(a) || b.minute - a.minute)[0] || null;
}

/**
 * Why a family helps back, in words: said of the family that remembers (`them`: "they remember X helping raise their walls"), to
 * its own student (`you`: "your family remembers ... your walls"), or in its own story (`us`: "the family remembers ... its walls").
 */
const VOICES = Object.freeze({ them: ['they remember', 'their', 'them'], you: ['your family remembers', 'your', 'you'], us: ['the family remembers', 'its', 'it'] });
export function memoryWords(world, deed, voice = 'them') {
  if (!deed) return '';
  const [remember, their, them] = VOICES[voice];
  const person = world.entities[deed.personId]?.name;
  const helper = world.households[deed.fromId];
  const who = person || (helper ? named(world, helper) : 'a neighbour');
  switch (deed.kind) {
    case 'raising': return `${remember} ${who} helping raise ${their} walls`;
    case 'food': return `${remember} the food ${who} carried to ${them}`;
    case 'room': return `${remember} the room kept for ${them} in a wagon on the road east`;
    case 'shelter': return `${remember} ${their} children being taken in`;
    case 'call': return `${remember} ${who} answering the neighbours' call to Gonzales`;
    default: return '';
  }
}
const deedById = (world, id) => (id ? deedsOf(world).find(deed => deed.id === id) || null : null);

// ---------------------------------------------------------------------------------------------------------------------------
// Who can act for a family, where the families are, and what each needs and can spare.

/** A family a student plays and is present for, one the director runs, or neither (an unplayed family in a class without them). */
export function handOf(world, household) {
  if (!household || household.arriving) return null;
  if (automatic(world, household)) return 'auto';
  return household.played && !household.absent ? 'student' : null;
}
const people = (world, household) => household.members.map(id => world.entities[id]).filter(Boolean);
const onTheRoad = household => Boolean(household.flight && ['fled', 'refuged', 'returning'].includes(household.flight.status));
/** Where the family is, as one place two families can share: its home land, or the refuge it is camped at. Null on the road. */
function placeOf(household) {
  if (!onTheRoad(household)) return { at: 'home', siteId: household.homeSiteId };
  return household.flight.status === 'refuged' ? { at: 'refuge', siteId: household.flight.refuge } : null;
}
/** Straight miles between two families' homes. */
export function homeMiles(world, one, other) {
  const a = world.map.sites[one.homeSiteId], b = world.map.sites[other.homeSiteId];
  return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : Infinity;
}
/** Whether two families are near enough to carry food between them today: homes a few miles apart, or camped at one refuge. */
function withinReach(world, one, other) {
  const a = placeOf(one), b = placeOf(other);
  if (!a || !b || a.at !== b.at) return false;
  return a.at === 'home' ? homeMiles(world, one, other) <= NEAR_MILES : a.siteId === b.siteId;
}
/** Somebody of the family who could carry help over: grown, well enough, free, and where the family is. */
export function bearerOf(world, household) {
  const place = placeOf(household);
  if (!place) return null;
  const free = person => person.kind === 'person' && !tooYoung(person) && !GONE.includes(person.health?.condition)
    && !['wounded', 'sick'].includes(person.health?.condition) && person.service?.status !== 'serving' && !person.travel
    && person.location?.siteId === place.siteId;
  const all = people(world, household).filter(free);
  const main = all.find(person => person.id === (household.mainId || household.principalId));
  return main || all[0] || null;
}
const foodOf = household => Math.floor(household.resources?.food || 0);
/** Short of food: less than `SHORT_DAYS` of the family's eating in the house. */
export const shortOfFood = (world, household) => (household.resources?.food || 0) < mouthsAt(world, household) * EATEN_A_DAY * SHORT_DAYS;
/** Food a family can give and still keep its own larder (sim/neighbours.mjs `FOOD_KEPT_PER_PERSON`, the director's own floor). */
export const foodToSpare = (world, household) => Math.max(0, Math.floor(foodOf(household) - mouthsAt(world, household) * FOOD_KEPT_PER_PERSON));
/** The room the family's goods at home take in the wagon, as the flight counts it (sim/scrape.mjs `FLIGHT_SPACE`). */
export const goodsSpace = household => Object.entries(FLIGHT_SPACE).reduce((sum, [good, space]) => sum + Math.floor(household.resources?.[good] || 0) * space, 0);
/** Told to leave and not gone: the families whose wagons are still being loaded. */
const loading = (world, household) => scrapeOn(world) && Boolean(household.flight && ['ordered', 'stayed'].includes(household.flight.status));

/** What `helper` could offer `needy` of this kind now, or null: the amount, and who carries it. */
export function canHelp(world, helper, needy, kind) {
  if (kind === 'food') {
    if (!withinReach(world, helper, needy) || !shortOfFood(world, needy)) return null;
    const amount = Math.min(foodToSpare(world, helper), Math.ceil(mouthsAt(world, needy) * EATEN_A_DAY * FOOD_GIVEN_DAYS), FOOD_GIVEN_MAX);
    const bearer = bearerOf(world, helper);
    return amount >= 1 && bearer ? { amount, personId: bearer.id } : null;
  }
  if (kind === 'room') {
    if (!loading(world, helper) || !loading(world, needy) || world.neighbourly?.lent?.[needy.id]) return null;
    if (settlementOf(helper) !== settlementOf(needy) && homeMiles(world, helper, needy) > NEAR_MILES) return null;
    const theirs = flightRoom(world, helper);
    if (theirs.mode !== 'wagon') return null;
    const spare = Math.floor(theirs.room - goodsSpace(helper));
    const short = Math.ceil(goodsSpace(needy) - flightRoom(world, needy).room);
    const room = Math.min(spare, short);
    const bearer = bearerOf(world, helper);
    return room >= 1 && bearer ? { amount: room, personId: bearer.id } : null;
  }
  return null;
}

// ---------------------------------------------------------------------------------------------------------------------------
// The offers.

const askKey = (fromId, toId, kind) => `${fromId}>${toId}:${kind}`;
const openAsk = (world, fromId, toId, kind) => Object.values(world.neighbourly?.asks || {}).find(ask => ask.fromId === fromId && ask.toId === toId && ask.kind === kind);
const say = (world, householdId, text, extra = {}) => record(world, 'consequence', { householdId, importance: 2, classification: 'FICTIONAL FOR GAMEPLAY', claimId: CLAIM, text, ...extra });
const what = (kind, amount) => (kind === 'food' ? `${amount} food` : `room for ${amount} in their wagon`);

function closeAsk(world, ask) {
  delete world.neighbourly.asks[ask.id];
  world.neighbourly.last[askKey(ask.fromId, ask.toId, ask.kind)] = world.minute;
}

/** The help given: the goods moved or the room kept, the deed written, and both stories told through the person who carried it. */
function give(world, ask) {
  const helper = world.households[ask.fromId], needy = world.households[ask.toId];
  const person = world.entities[ask.personId];
  const bearer = person?.name || cap(named(world, helper));
  const memory = memoryWords(world, deedById(world, ask.forId));
  const because = memory ? `: ${memory}` : '';
  if (ask.kind === 'food') {
    const amount = Math.min(ask.amount, foodOf(helper));
    if (amount < 1) { say(world, needy.id, `${cap(named(world, helper))} had no food left to bring after all.`); return false; }
    helper.resources.food = Math.max(0, Math.round((helper.resources.food - amount) * 10000) / 10000);
    needy.resources.food = Math.round(((needy.resources.food || 0) + amount) * 10000) / 10000;
    noteDeed(world, { kind: 'food', fromId: helper.id, toId: needy.id, personId: ask.personId, amount, forId: ask.forId });
    say(world, needy.id, `${bearer} of ${named(world, helper)} brought ${amount} food over when the family was short${because}.`, { actorId: ask.personId });
    say(world, helper.id, `${bearer} carried ${amount} food over to ${named(world, needy)}, who were short.`, { actorId: ask.personId });
    return true;
  }
  state(world).lent[needy.id] = { fromId: helper.id, room: ask.amount, minute: world.minute };
  noteDeed(world, { kind: 'room', fromId: helper.id, toId: needy.id, personId: ask.personId, amount: ask.amount, forId: ask.forId });
  say(world, needy.id, `${cap(named(world, helper))} are keeping room for ${ask.amount} of the family's goods in their wagon on the road east${because}. The room is counted in the wagon until either family leaves.`, { actorId: ask.personId });
  say(world, helper.id, `The family is keeping room for ${ask.amount} of ${named(world, needy)}'s goods in its wagon on the road east.`, { actorId: ask.personId });
  return true;
}

/** A new offer: straight to the family in need when the helper is run by the director, or first to the helper's student. */
function makeAsk(world, helper, needy, kind, offer, forDeed) {
  const s = state(world);
  const ask = { id: `help-${s.next++}`, kind, fromId: helper.id, toId: needy.id, personId: offer.personId, amount: offer.amount, forId: forDeed?.id || null, minute: world.minute, status: handOf(world, helper) === 'auto' ? 'offered' : 'asking' };
  s.asks[ask.id] = ask;
  if (ask.status === 'asking') {
    const memory = memoryWords(world, forDeed, 'us');
    say(world, helper.id, `${cap(named(world, needy))} ${kind === 'food' ? 'are short of food' : 'have more than their wagon will carry east'}.${memory ? ` ${cap(memory)}.` : ''} The family could offer ${kind === 'food' ? `${offer.amount} food` : `room for ${offer.amount} in its wagon`}: the Neighbours list asks.`, { importance: 3 });
  } else offered(world, ask);
  return ask;
}
/** The offer reaches the family in need: a family nobody plays takes it at once (it is in need); a student is asked. */
function offered(world, ask) {
  const helper = world.households[ask.fromId], needy = world.households[ask.toId];
  ask.status = 'offered'; ask.minute = world.minute;
  if (handOf(world, needy) === 'auto') { give(world, ask); closeAsk(world, ask); return; }
  const person = world.entities[ask.personId]?.name || cap(named(world, helper));
  const memory = memoryWords(world, deedById(world, ask.forId));
  say(world, needy.id, `${person} of ${named(world, helper)} offers ${what(ask.kind, ask.amount)}${memory ? `: ${memory}` : ''}.`, { importance: 3, actorId: ask.personId });
}

/**
 * The answer to an offer, from the family it was put to: `yes` or `no`. The helper's student answers whether to offer; the needy
 * family's student whether to take it. Any of the family who can act may give the answer, as a trade is answered.
 */
export function answerNeighbour(world, household, entity, askId, answer) {
  const ask = world.neighbourly?.asks?.[askId];
  if (!ask) throw new Error('That offer is no longer open.');
  if (!['yes', 'no'].includes(answer)) throw new Error('Answer yes or no.');
  const helper = world.households[ask.fromId], needy = world.households[ask.toId];
  if (ask.status === 'asking') {
    if (household.id !== ask.fromId) throw new Error('That is not your family\'s to answer.');
    if (answer === 'no') {
      closeAsk(world, ask);
      say(world, helper.id, `The family did not offer ${named(world, needy)} ${ask.kind === 'food' ? 'food' : 'room in its wagon'}.`, { actorId: entity.id });
      return;
    }
    const now = canHelp(world, helper, needy, ask.kind);
    if (!now) { closeAsk(world, ask); throw new Error(ask.kind === 'food' ? 'The family has no food to spare now, or they are no longer short.' : 'The wagon has no room to spare now, or one of the families has gone.'); }
    Object.assign(ask, { amount: Math.min(ask.amount, now.amount), personId: entity.id });
    offered(world, ask);
    if (world.neighbourly.asks[ask.id]) say(world, helper.id, `${entity.name} went to offer ${named(world, needy)} ${ask.kind === 'food' ? `${ask.amount} food` : `room for ${ask.amount} in the wagon`}.`, { actorId: entity.id });
    return;
  }
  if (household.id !== ask.toId) throw new Error('That offer was not made to your family.');
  if (answer === 'yes' && ask.kind === 'room' && !canHelp(world, helper, needy, 'room')) {
    closeAsk(world, ask);
    throw new Error('The room is no longer there: one of the families has gone, or the wagon is full.');
  }
  closeAsk(world, ask);
  if (answer === 'no') {
    say(world, needy.id, `${entity.name} thanked ${named(world, helper)} and said no to ${what(ask.kind, ask.amount)}.`, { actorId: entity.id });
    say(world, helper.id, `${cap(named(world, needy))} said no to the ${ask.kind === 'food' ? 'food' : 'room in the wagon'}.`);
    return;
  }
  give(world, ask);
}

// ---------------------------------------------------------------------------------------------------------------------------
// Each tick.

/** Offers whose need or means has gone, or that no one answered in a day, lapse; room lent lapses when the lender leaves first. */
function lapse(world) {
  const s = world.neighbourly;
  if (!s) return;
  for (const ask of Object.values(s.asks)) {
    const helper = world.households[ask.fromId], needy = world.households[ask.toId];
    const stale = world.minute - ask.minute >= ASK_MINUTES;
    if (!stale && helper && needy && canHelp(world, helper, needy, ask.kind)) continue;
    closeAsk(world, ask);
    const shown = ask.status === 'asking' ? helper : needy;
    if (shown && handOf(world, shown) === 'student') say(world, shown.id, ask.status === 'asking'
      ? `The chance to offer ${named(world, needy)} ${ask.kind === 'food' ? 'food' : 'room in the wagon'} has passed.`
      : `The offer of ${what(ask.kind, ask.amount)} from ${named(world, helper)} has lapsed.`);
  }
  for (const [needyId, entry] of Object.entries(s.lent)) {
    const needy = world.households[needyId], helper = world.households[entry.fromId];
    if (entry.gone || !needy || !helper) continue;
    if (!loading(world, needy)) { entry.gone = world.minute; continue; }
    if (!loading(world, helper)) {
      delete s.lent[needyId];
      say(world, needy.id, `${cap(named(world, helper))} have gone east, and the room in their wagon went with them.`);
    }
  }
}

/** Looks for families in need that a family that owes them can help, and makes the offers. */
function offerHelp(world) {
  const households = Object.values(world.households);
  const hands = new Map(households.map(household => [household.id, handOf(world, household)]));
  const table = standings(world);
  for (const helper of households) {
    if (!hands.get(helper.id)) continue;
    for (const [needyId, weight] of Object.entries(table[helper.id] || {})) {
      const needy = world.households[needyId];
      if (weight <= 0 || !needy || !hands.get(needyId)) continue;
      for (const kind of ASK_KINDS) {
        if (openAsk(world, helper.id, needyId, kind)) continue;
        const last = world.neighbourly?.last?.[askKey(helper.id, needyId, kind)];
        if (Number.isFinite(last) && (kind === 'room' || world.minute - last < ASK_AGAIN_MINUTES)) continue;
        const offer = canHelp(world, helper, needy, kind);
        if (offer) makeAsk(world, helper, needy, kind, offer, remembered(world, helper.id, needyId));
      }
    }
  }
}

/**
 * A neighbour's raising, said in the journal of every student's family that could know of it - homes within `NEAR_MILES`, or a
 * family it has dealt with - once (the audit's S7: "a journal line when a neighbour starts raising walls").
 * ceiling: the word of a raising reaches the near families at once, not by somebody carrying it; the news of the colonies
 * (sim/expresses.mjs) is the way out if a class finds it too quick.
 */
function tellRaisings(world) {
  const households = Object.values(world.households);
  const building = households.filter(household => raising(household));
  if (!building.length) return;
  let table = null;
  for (const listener of households) {
    if (handOf(world, listener) !== 'student') continue;
    for (const host of building) {
      if (host.id === listener.id) continue;
      const key = `${listener.id}>${host.id}:raising`;
      if (world.neighbourly?.told?.[key]) continue;
      const miles = homeMiles(world, listener, host);
      const known = acquainted(world, listener.id, host.id);
      if (miles > NEAR_MILES && !known) continue;
      state(world).told[key] = world.minute;
      table ??= standings(world);
      const memory = owes(table, listener.id, host.id) > 0 ? memoryWords(world, remembered(world, listener.id, host.id), 'us') : '';
      const far = `${Math.round(miles)} ${Math.round(miles) === 1 ? 'mile' : 'miles'} off`;
      say(world, listener.id, `${known ? `${cap(named(world, host))}, ${far}, are` : `The neighbours at ${world.map.sites[host.homeSiteId]?.name || 'a homestead'}, ${far}, are`} raising the walls of their house.${memory ? ` ${cap(memory)}.` : ''} Anybody of the family standing on their land can help raise them; the Neighbours list shows the way.`);
    }
  }
}

/** Once a tick, after the directors and before the families nobody plays think. */
export function advanceNeighbourly(world) {
  if (world.status !== 'running') return;
  lapse(world);
  if (world.tick % LOOK_EVERY) return;
  offerHelp(world);
  tellRaisings(world);
}

// ---------------------------------------------------------------------------------------------------------------------------
// Taking in children: the connection for the rule "the oldest child steps up, or a neighbour takes them in".

/**
 * The family that would take in this family's children: of the families with somebody grown and free, the one that owes it most,
 * the nearest of those; with nobody owing, the nearest within `NEAR_MILES`. Null when there is none. Read only - the rule that
 * moves the children calls `recordTakenIn` when it does.
 */
export function takesIn(world, householdId) {
  const household = world.households[householdId];
  if (!household) return null;
  const table = standings(world);
  const able = Object.values(world.households).filter(other => other.id !== householdId && !onTheRoad(other) && bearerOf(world, other));
  const ranked = able.map(other => ({ id: other.id, owe: owes(table, other.id, householdId), miles: homeMiles(world, other, household) }))
    .filter(one => one.owe > 0 || one.miles <= NEAR_MILES)
    .sort((a, b) => b.owe - a.owe || a.miles - b.miles);
  return ranked[0]?.id || null;
}
/** Children taken in by a neighbour, written into the ledger and both stories. */
export function recordTakenIn(world, takerId, familyId, childIds = []) {
  const taker = world.households[takerId], family = world.households[familyId];
  if (!taker || !family) return null;
  const forDeed = remembered(world, takerId, familyId);
  const deed = noteDeed(world, { kind: 'shelter', fromId: takerId, toId: familyId, childIds: [...childIds], forId: forDeed?.id || null });
  const names = childIds.map(id => world.entities[id]?.name).filter(Boolean);
  const who = names.length ? names.join(' and ') : 'the children';
  const memory = memoryWords(world, forDeed);
  say(world, familyId, `${cap(named(world, taker))} took in ${who}${memory ? `: ${memory}` : ''}.`);
  say(world, takerId, `The family took in ${who} of ${named(world, family)}.`);
  return deed;
}

// ---------------------------------------------------------------------------------------------------------------------------
// What the family's page is sent, and what the ending says.

/** One deed said from this family's side, or null when it is not about this family. */
export function deedLine(world, deed, householdId) {
  const from = world.households[deed.fromId], to = deed.toId ? world.households[deed.toId] : null;
  const person = world.entities[deed.personId]?.name;
  if (!from) return null;
  const ours = deed.fromId === householdId, theirs = deed.toId === householdId;
  if (!ours && !theirs) return null;
  const other = ours ? to : from;
  const them = other ? named(world, other) : '';
  const hours = deed.hours ? ` (${deed.hours} ${deed.hours === 1 ? 'hour' : 'hours'})` : '';
  switch (deed.kind) {
    case 'raising': return ours ? `${person || 'Somebody of the family'} helped ${them} raise their walls${hours}.` : `${person || 'Somebody'} of ${them} helped raise the family's walls${hours}.`;
    case 'food': return ours ? `${person || 'The family'} carried ${deed.amount} food to ${them}.` : `${person || 'Somebody'} of ${them} brought ${deed.amount} food when the family was short.`;
    case 'room': return ours ? `The family kept room for ${deed.amount} of ${them}'s goods in its wagon on the road east.` : `${cap(them)} kept room for ${deed.amount} of the family's goods in their wagon on the road east.`;
    case 'shelter': return ours ? `The family took in children of ${them}.` : `${cap(them)} took in the family's children.`;
    case 'trade': return `${ours ? person || 'The family' : `${person || 'Somebody'} of ${them}`} traded with ${ours ? them : 'the family'}.`;
    case 'call': return ours ? `${person || 'The family'} answered the neighbours' call to Gonzales.` : null;
    default: return null;
  }
}

/** Every deed this family did or was done, in the order they happened, in words: the ending's "Neighbours" section. */
export function neighbourLines(world, householdId) {
  return deedsOf(world).filter(deed => deed.fromId === householdId || deed.toId === householdId)
    .sort((a, b) => a.minute - b.minute)
    .map(deed => ({ minute: deed.minute, kind: deed.kind, text: deedLine(world, deed, householdId) }))
    .filter(line => line.text);
}

/** Who helped whom across the class, one line for each family that did anything for another: the Host's closing view. */
export function helpedLines(world) {
  const pairs = new Map();
  for (const deed of deedsOf(world)) {
    if (!deed.toId || deed.kind === 'trade') continue;
    const key = `${deed.fromId}>${deed.toId}`;
    if (!pairs.has(key)) pairs.set(key, { fromId: deed.fromId, toId: deed.toId, kinds: new Map(), minute: deed.minute });
    const pair = pairs.get(key);
    pair.kinds.set(deed.kind, (pair.kinds.get(deed.kind) || 0) + (deed.hours || deed.amount || 1));
  }
  const words = { raising: n => `helped raise their walls (${n} ${n === 1 ? 'hour' : 'hours'})`, food: n => `brought ${n} food`, room: n => `kept room for ${n} in their wagon`, shelter: () => 'took in their children' };
  return [...pairs.values()].sort((a, b) => a.minute - b.minute).map(pair => ({
    fromId: pair.fromId, toId: pair.toId,
    text: `${cap(named(world, world.households[pair.fromId]))} → ${named(world, world.households[pair.toId])}: ${[...pair.kinds].map(([kind, n]) => words[kind]?.(n)).filter(Boolean).join('; ')}.`,
  }));
}

/**
 * The family's own page: the offers waiting on it, its neighbours - near, or known by a deed - with a raising going on and what
 * lies between them, and room lent to it. Nothing of another family's stores: a need is said in words, never a count.
 * Absent for the Host and for a family with none of it, which is also every class before.
 */
export function neighbourlyView(world, householdId, role) {
  const household = world.households?.[householdId];
  if (!household || role === 'host') return {};
  const asks = Object.values(world.neighbourly?.asks || {})
    .filter(ask => (ask.status === 'asking' && ask.fromId === householdId) || (ask.status === 'offered' && ask.toId === householdId))
    .map(ask => {
      const mine = ask.fromId === householdId;
      const other = world.households[mine ? ask.toId : ask.fromId];
      const person = world.entities[ask.personId]?.name;
      const forDeed = deedById(world, ask.forId);
      return {
        id: ask.id, kind: ask.kind, amount: ask.amount, side: mine ? 'give' : 'take',
        family: named(world, other),
        text: mine
          ? `${cap(named(world, other))} ${ask.kind === 'food' ? 'are short of food' : 'have more than their wagon will carry east'}. Offer them ${ask.kind === 'food' ? `${ask.amount} food` : `room for ${ask.amount} in your wagon`}?${forDeed ? ` ${cap(memoryWords(world, forDeed, 'you'))}.` : ''}`
          : `${person ? `${person} of ` : ''}${named(world, other)} ${person ? 'offers' : 'offer'} ${what(ask.kind, ask.amount)}${forDeed ? `: ${memoryWords(world, forDeed)}` : ''}.`,
      };
    });
  const table = standings(world);
  const deeds = world.neighbourly?.deeds || [];
  const neighbours = Object.values(world.households)
    .filter(other => other.id !== householdId)
    .map(other => ({ other, miles: homeMiles(world, household, other), known: acquainted(world, householdId, other.id) }))
    .filter(one => one.known || one.miles <= NEAR_MILES)
    .sort((a, b) => a.miles - b.miles)
    .slice(0, 8)
    .map(({ other, miles, known }) => {
      const between = deeds
        .filter(deed => (deed.fromId === other.id && deed.toId === householdId) || (deed.fromId === householdId && deed.toId === other.id))
        .slice(-3).map(deed => deedLine(world, deed, householdId)).filter(Boolean);
      return {
        householdId: other.id, siteId: other.homeSiteId,
        name: known ? cap(named(world, other)) : `The neighbours at ${world.map.sites[other.homeSiteId]?.name || 'a homestead'}`,
        miles: Math.round(miles * 10) / 10,
        ...(raising(other) && { raising: true }),
        ...(owes(table, householdId, other.id) > 0 && { weOwe: true }),
        ...(owes(table, other.id, householdId) > 0 && { theyOwe: true }),
        ...(between.length && { between }),
      };
    });
  const lent = world.neighbourly?.lent?.[householdId];
  const lentShown = lent && !lent.gone && world.households[lent.fromId] ? { family: named(world, world.households[lent.fromId]), room: lent.room } : null;
  if (!asks.length && !neighbours.length && !lentShown) return {};
  return { neighbourly: { asks, neighbours, ...(lentShown && { lent: lentShown }) } };
}

// ---------------------------------------------------------------------------------------------------------------------------
// The families nobody plays: a hand at the raising of a family they owe (sim/neighbours.mjs calls this for each idle person).

// ---------------------------------------------------------------------------------------------------------------------------

/** What a save must hold of it, when it holds it at all. */
export function neighbourlyInvalid(world) {
  const s = world.neighbourly;
  if (s === undefined) return null;
  if (!s || typeof s !== 'object' || !Array.isArray(s.deeds) || !s.asks || !s.lent || !s.told || !s.last || !Number.isInteger(s.next)) return 'Invalid neighbourly ledger';
  for (const deed of s.deeds) {
    if (!Object.hasOwn(DEED_WEIGHT, deed.kind) || !world.households[deed.fromId] || (deed.toId !== null && !world.households[deed.toId])) return 'A deed between families that are not there';
  }
  for (const ask of Object.values(s.asks)) {
    if (!ASK_KINDS.includes(ask.kind) || !['asking', 'offered'].includes(ask.status) || !world.households[ask.fromId] || !world.households[ask.toId] || !(ask.amount >= 1)) return 'Invalid offer between families';
  }
  for (const [needyId, entry] of Object.entries(s.lent)) {
    if (!world.households[needyId] || !world.households[entry.fromId] || !(entry.room >= 1)) return 'Invalid room lent in a wagon';
  }
  return null;
}
