/**
 * Households trading with each other.
 *
 * Two rules shape the whole file.
 *
 * A trade is a thing said face to face. An offer can only be made between two people
 * standing in the same place, and it lapses the moment they part. That is what keeps the
 * map meaningful: there is no market, no order book and no way to trade with somebody
 * across the county, because `CLAUDE_DEVELOPMENT_ROADMAP.md` §1D rules out an
 * optimisation surface and a spreadsheet is exactly what a global market would become.
 *
 * Nothing here is random, for the same reason `sim/chores.mjs` is not: `FIC-GONZ-008`
 * requires an outcome to resolve inside a risk the student could see before committing.
 * An offer is accepted or it is refused, and both families are told which.
 *
 * A household never learns another household's stores. What an offer reveals is only
 * what the offering family chose to put in it.
 */
import { record } from './events.mjs';
import { householdName } from './family.mjs';

// The two things a household actually keeps. Tools are not traded: a hoe is a wear count
// rather than a countable stock, and the pressure the design wants from a worn hoe is
// that somebody handy has to mend it, not that it can be bought from next door.
// Powder is tradeable for the same reason food and seed are: a family can have one and
// want another. It is the good most likely to be unevenly spread, because what a family
// spends it on - hunting, and going upriver - is a choice rather than a routine.
export const GOODS = ['food', 'seed', 'powder'];
export const MAX_AMOUNT = 20;
export const MAX_OPEN_OFFERS = 3;

// Offers are optional state: a class saved before trading existed simply had none, which
// is a correct empty answer rather than a missing field. That is why no save version
// moved for this feature.
function ensure(world) {
  if (!world.offers) world.offers = {};
  if (!world.nextOfferId) world.nextOfferId = 1;
  return world;
}
const round2 = value => Math.round(value * 100) / 100;
export const describeGoods = amounts => GOODS.filter(good => amounts[good]).map(good => `${amounts[good]} ${good}`).join(' and ');

/**
 * Every household in a class is currently a copy of the same four names, so "Thomas
 * traded with Thomas" is what an unqualified message actually says. Anybody from another
 * family is named with their family; your own people never are, because you know them.
 * This goes away on its own once households can be named — see HANDOFF next-task 3.
 */
// A household that nobody has named is named for its own principal, so this reads
// "Ramona of Jethro's family" rather than "Ramona of Family 3".
const named = (world, entity) => {
  const household = entity && world.households[entity.householdId];
  return entity ? `${entity.name} of ${household ? householdName(world, household) : 'another family'}` : 'a neighbour';
};

/** Standing together, right now, at a real place. Travelling is not standing anywhere. */
export function together(one, other) {
  return Boolean(one && other && !one.travel && !other.travel
    && one.location?.siteId && one.location.siteId === other.location?.siteId);
}
function readAmounts(input, side) {
  const amounts = {};
  for (const good of GOODS) {
    const raw = input?.[good];
    if (raw === undefined || raw === null || raw === 0) continue;
    if (!Number.isInteger(raw) || raw < 1 || raw > MAX_AMOUNT) throw new Error(`Trade whole food or seed, one to ${MAX_AMOUNT} at a time.`);
    amounts[good] = raw;
  }
  if (!Object.keys(amounts).length) throw new Error(side === 'give' ? 'Say what your family is giving.' : 'Say what your family is asking for.');
  return amounts;
}
function shortfall(household, amounts) {
  for (const good of GOODS) {
    if (amounts[good] && (household.resources[good] || 0) < amounts[good]) {
      return `${Math.floor(household.resources[good] || 0)} ${good}, not ${amounts[good]}`;
    }
  }
  return null;
}
function move(from, to, amounts) {
  for (const good of GOODS) {
    if (!amounts[good]) continue;
    // Math.max also keeps a rounding wobble from ever writing -0, which survives JSON as
    // -0 and breaks the save's deep equality on reload.
    from.resources[good] = Math.max(0, round2(from.resources[good] - amounts[good]));
    to.resources[good] = Math.max(0, round2((to.resources[good] || 0) + amounts[good]));
  }
}

export function makeOffer(world, householdId, entity, input) {
  ensure(world);
  const household = world.households[householdId];
  const other = world.entities[input.toEntityId];
  if (!other || other.kind !== 'person') throw new Error('Choose somebody to trade with.');
  if (other.resident) throw new Error(`${other.name} trades at the Gonzales counter, not by private offer.`);
  if (!other.householdId || !world.households[other.householdId]) throw new Error('That person has no household to trade with.');
  if (other.householdId === householdId) throw new Error('Your own family already shares one store.');
  if (!together(entity, other)) throw new Error(`${entity.name} has to be standing with ${other.name} to offer them anything.`);
  if (entity.chore) throw new Error(`${entity.name} is in the middle of the work. Call it off first.`);

  const give = readAmounts(input.give, 'give');
  const ask = readAmounts(input.ask, 'ask');
  if (GOODS.some(good => give[good] && ask[good])) throw new Error('A trade swaps one thing for another.');
  const short = shortfall(household, give);
  if (short) throw new Error(`Your family has ${short}.`);

  const open = Object.values(world.offers).filter(offer => offer.fromHouseholdId === householdId);
  if (open.length >= MAX_OPEN_OFFERS) throw new Error('Wait for an answer to the offers your family has already made.');
  if (open.some(offer => offer.toEntityId === other.id)) throw new Error(`${other.name} already has an offer from your family.`);

  const id = `offer-${world.nextOfferId++}`;
  world.offers[id] = {
    id, fromHouseholdId: householdId, toHouseholdId: other.householdId,
    fromEntityId: entity.id, toEntityId: other.id, siteId: entity.location.siteId,
    give, ask, tick: world.tick,
  };
  record(world, 'assignment', {
    actorId: entity.id, householdId,
    text: `${entity.name} offered ${describeGoods(give)} to ${named(world, other)} for ${describeGoods(ask)}.`,
  });
  return world.offers[id];
}

/**
 * Accepting, declining and withdrawing. The person named on our side of the offer has to
 * be the one acting, so the ordinary "choose one of your family" guard in `applyAction`
 * is the same guard that stops one family answering for another.
 */
export function respondToOffer(world, householdId, entity, action, offerId) {
  ensure(world);
  const offer = world.offers[offerId];
  if (!offer) throw new Error('That offer is no longer open.');
  const from = world.entities[offer.fromEntityId], to = world.entities[offer.toEntityId];

  if (action === 'withdraw-offer') {
    if (offer.fromHouseholdId !== householdId) throw new Error('Only the family that made an offer can take it back.');
    if (entity.id !== offer.fromEntityId) throw new Error(`${from.name} made that offer.`);
    delete world.offers[offerId];
    record(world, 'assignment', { actorId: from.id, householdId, text: `${from.name} took back the offer to ${named(world, to)}.` });
    return;
  }
  if (offer.toHouseholdId !== householdId) throw new Error('That offer was not made to your family.');
  if (entity.id !== offer.toEntityId) throw new Error(`That offer was made to ${to.name}.`);

  if (action === 'decline-offer') {
    delete world.offers[offerId];
    // Both families learn the answer. A refusal is information, and the family that asked
    // must not be left waiting on a silence it cannot tell from a lapse.
    record(world, 'consequence', { actorId: to.id, householdId, text: `${to.name} declined the offer from ${named(world, from)}.` });
    record(world, 'consequence', { actorId: from.id, householdId: offer.fromHouseholdId, text: `${from.name}'s offer was declined by ${named(world, to)}.` });
    return;
  }

  if (!together(from, to)) {
    delete world.offers[offerId];
    throw new Error(`${from.name} is no longer standing with ${to.name}.`);
  }
  const giver = world.households[offer.fromHouseholdId], taker = world.households[offer.toHouseholdId];
  // ceiling: nothing is held back at offer time, so a family can offer goods and then
  // spend them. The check is here instead. Reserve the goods on the offer if a student
  // ever finds an accepted trade failing surprising rather than obvious.
  const giverShort = shortfall(giver, offer.give);
  if (giverShort) {
    delete world.offers[offerId];
    record(world, 'consequence', { actorId: from.id, householdId: offer.fromHouseholdId, text: `${from.name} could not make good the offer to ${named(world, to)}.` });
    throw new Error(`${from.name}'s family no longer has that to give.`);
  }
  const takerShort = shortfall(taker, offer.ask);
  if (takerShort) throw new Error(`Your family has ${takerShort}.`);

  move(giver, taker, offer.give);
  move(taker, giver, offer.ask);
  delete world.offers[offerId];
  const given = describeGoods(offer.give), asked = describeGoods(offer.ask);
  record(world, 'consequence', { actorId: to.id, householdId, text: `${to.name} traded ${asked} to ${named(world, from)} for ${given}.` });
  record(world, 'consequence', { actorId: from.id, householdId: offer.fromHouseholdId, text: `${from.name} traded ${given} to ${named(world, to)} for ${asked}.` });
}

/**
 * An offer is over when the two people are no longer standing together — somebody walked
 * to the field, or set off for town. Only the family that made it is told, because they
 * are the one left waiting on an answer; the family that received it simply sees the
 * offer go, and the event log has no compaction to spend on both sides of a non-event.
 */
export function advanceOffers(world) {
  ensure(world);
  for (const offer of Object.values(world.offers)) {
    const from = world.entities[offer.fromEntityId], to = world.entities[offer.toEntityId];
    if (together(from, to)) continue;
    delete world.offers[offer.id];
    record(world, 'assignment', {
      actorId: offer.fromEntityId, householdId: offer.fromHouseholdId,
      text: `The offer to ${named(world, to)} lapsed when they parted.`,
    });
  }
}

/**
 * Every offer this household is part of, always written from its own side, so a student
 * never has to work out which way round somebody else's offer runs. It carries the other
 * family's person — already visible, because the offer cannot outlive standing together —
 * and nothing whatever about their stores.
 */
export function offersFor(world, householdId) {
  ensure(world);
  if (!householdId) return [];
  return Object.values(world.offers)
    .filter(offer => offer.fromHouseholdId === householdId || offer.toHouseholdId === householdId)
    .map(offer => {
      const made = offer.fromHouseholdId === householdId;
      const ours = world.entities[made ? offer.fromEntityId : offer.toEntityId];
      const theirs = world.entities[made ? offer.toEntityId : offer.fromEntityId];
      return {
        id: offer.id,
        direction: made ? 'made' : 'received',
        ourEntityId: ours?.id || null,
        ourName: ours?.name || '',
        theirEntityId: theirs?.id || null,
        theirName: theirs?.name || '',
        // The other family's fictional name, which is not the student's own name and is
        // already implied by the household id in `others`. Without it the interface says
        // "Thomas offers" to a family whose own principal is also called Thomas.
        theirHousehold: (() => {
          const other = world.households[made ? offer.toHouseholdId : offer.fromHouseholdId];
          return other ? householdName(world, other) : '';
        })(),
        weGive: made ? { ...offer.give } : { ...offer.ask },
        weGet: made ? { ...offer.ask } : { ...offer.give },
      };
    });
}

/** Who this person could offer a trade to right now: another family's people, here. */
export function tradePartners(world, householdId, entity) {
  if (!entity || entity.travel || !entity.location?.siteId) return [];
  return Object.values(world.entities).filter(other =>
    other.kind === 'person' && other.householdId && other.householdId !== householdId
    && world.households[other.householdId] && together(entity, other));
}
