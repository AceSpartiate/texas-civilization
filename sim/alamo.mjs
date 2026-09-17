// The siege and fall of the Alamo, with San Patricio and Agua Dulce: docs/COLONIES.md §7f and build step 9, decided by the
// owner by multiple choice (2026-09-16). Researched in docs/battle-research/alamo.md (`HIST-TEX-054` to `-061`).
//
// - **The siege** (February 23): whoever of a family is at Béxar is shut in the Alamo with the garrison, and cannot be sent
//   for. On the days Travis sent riders out, a played person inside is asked once whether they will carry a letter; about one
//   volunteer in four is chosen, rides out to Gonzales, and lives.
// - **The relief**: every family that has heard Travis's letter may send a grown member to Gonzales; whoever is there by two in
//   the afternoon of February 27 rides with Kimbell and Martin and is inside the Alamo before dawn on March 1.
// - **The fall** (March 6): every man inside is killed, as every defender was; a woman is spared with the noncombatants and
//   comes away with Susanna Dickinson.
// - **The south**: those who went with the Matamoros men are split between Johnson's party, struck at San Patricio on
//   February 27, and Grant's, destroyed at Agua Dulce on March 2, and rolled at each fight's recorded shares for killed,
//   captured and escaped. The captured are prisoners at Matamoros; the escaped go to Fannin at Goliad.
// - **The word**: a death or a capture is not on a family's screen until the word of it reaches them - at Gonzales the fall is
//   a rumour on March 11 and confirmed on the 13th; elsewhere it comes that evening; the southern fights by rumour some days
//   after them. The world knows what happened when it happens; the family learns it when the word does.
import { record } from './events.mjs';
import { learn, establishTruth } from './knowledge.mjs';
import { awardGlory } from './glory.mjs';
import { frailty } from './army.mjs';
import { modeWith } from './keeping.mjs';

const GONE = ['dead', 'captured'];
const BEXAR = 'bexar', GONZALES = 'gonzales';

/** A share in [0, 1) that is always the same for this class, this person and this question. */
export function share(world, personId, question) {
  let hash = 0x811c9dc5;
  for (const char of `${world.seed}:${personId}:${question}`) { hash ^= char.charCodeAt(0); hash = Math.imul(hash, 0x01000193) >>> 0; }
  return hash / 0x100000000;
}

/** Of the volunteers who offer to carry a letter out, about one in four is sent (owner: couriers were chosen). */
export const COURIER_CHOSEN = 0.25;
/** The days Travis sent riders out (`HIST-TEX-055`): Martin on the 24th, Seguín on the 25th, Smith on March 3, Allen on the 5th. */
export const COURIER_DAYS = Object.freeze(['courier-1', 'courier-2', 'courier-3', 'courier-4']);
/** Johnson's party at San Patricio was 34 men, Grant's at Agua Dulce 26 (`HIST-TEX-059`): the share in Johnson's. */
export const JOHNSON_SHARE = 34 / 60;
/**
 * The southern fights' shares of killed, captured and escaped, from the record's counts as they were given (`HIST-TEX-059`):
 * San Patricio 8, 13 and 6 of those accounted for; Agua Dulce 14, 6 and 6. Killed is weighted by hidden strength and health,
 * as every battle's deaths are (`rollFates` in sim/army.mjs).
 */
export const SOUTH_RATES = Object.freeze({
  'san-patricio': { killed: 8 / 27, captured: 13 / 27 },
  'agua-dulce': { killed: 14 / 26, captured: 6 / 26 },
});

const male = person => person?.sex ? person.sex === 'male' : ['father', 'son'].includes(person?.kin?.role);
const inService = (world, kind) => Object.values(world.entities).filter(person => person.householdId && person.service?.status === 'serving' && person.service.kind === kind && !GONE.includes(person.health?.condition));
const householdOf = (world, person) => world.households[person.householdId];
const tell = (world, person, text, { claimId = 'FIC-GONZ-045', importance = 3, type = 'consequence' } = {}) => record(world, type, {
  actorId: person.id, householdId: person.householdId, importance, classification: 'FICTIONAL FOR GAMEPLAY', claimId, text,
});

/** Word of something, told to these families and not the others. */
function word(world, topicId, households, { truth, text = truth, status = 'confirmed', claimId, source }) {
  if (!world.truth[topicId]) establishTruth(world, { id: topicId, text: truth, siteId: BEXAR, classification: 'DOCUMENTED', claimId });
  for (const household of households) learn(world, household.id, topicId, { status, source, text });
}
const gonzalesFamilies = world => Object.values(world.households).filter(household => (household.settlementId || GONZALES) === GONZALES);
const otherFamilies = world => Object.values(world.households).filter(household => (household.settlementId || GONZALES) !== GONZALES);

/** Whether the siege has begun: Béxar's garrison is closed to all but the relief. */
export const besieged = world => Boolean(world.director?.milestones?.['alamo-siege']);

/** February 23: whoever of a family is at Béxar is shut in the Alamo, the garrison and anybody lying there wounded alike. */
export function beginSiege(world, causeId) {
  for (const person of Object.values(world.entities)) {
    if (!person.householdId || person.kind !== 'person' || GONE.includes(person.health?.condition)) continue;
    if (person.location?.siteId !== BEXAR || person.travel) continue;
    if (person.service?.status !== 'serving' || person.service.kind !== 'garrison') {
      person.service = { kind: 'garrison', status: 'serving', since: world.minute, siteId: BEXAR };
      person.chore = null; person.task = 'rest';
    }
    person.service.besieged = true;
    tell(world, person, `The Mexican army has come into Béxar under a red flag. ${person.name} is shut in the Alamo with the garrison.`, { claimId: 'HIST-TEX-054' });
  }
}

/** A day Travis sends riders out: every played person inside not yet asked is asked whether they will carry a letter. */
/**
 * The share of the garrison that offers to ride when the choice is auto's (`FIC-GONZ-048`): about a third. Some sixteen
 * couriers are known to have gone out (`HIST-TEX-055`), and with one offer in four chosen (`COURIER_CHOSEN`) that is
 * sixty or so offers among fewer than two hundred men.
 */
export const COURIER_OFFERED = 1 / 3;
const autoOffers = (world, person) => share(world, person.id, 'courier-offer') < COURIER_OFFERED;
const offerSaid = (person, offers) => offers ? `${person.name} offered to carry Travis's letters out.` : `${person.name} will stay inside the walls.`;

export function askCouriers(world) {
  let asked = 0;
  for (const person of inService(world, 'garrison')) {
    if (!person.service.besieged || person.service.courier) continue;
    if (!householdOf(world, person)?.played) continue;
    // On auto, answered the moment it is asked, at auto's share (sim/auto.mjs); nobody waits on the family.
    if (person.auto) {
      const offers = autoOffers(world, person);
      person.service.courier = offers ? 'volunteered' : 'stays';
      record(world, 'choice', { actorId: person.id, householdId: person.householdId, importance: 2, decision: `courier-${offers ? 'volunteer' : 'stay'}`, text: offerSaid(person, offers) });
      continue;
    }
    person.service.courier = 'open';
    tell(world, person, `Travis wants riders to carry letters out through the Mexican lines. ${person.name} can offer to go.`, { claimId: 'HIST-TEX-055', type: 'pressure' });
    asked++;
  }
  return asked;
}

/** Why a courier answer cannot be given, or null. */
export function courierRefusal(person, answer) {
  if (person?.service?.courier !== 'open') return `${person?.name || 'Nobody'} is not being asked to ride out.`;
  if (!['volunteer', 'stay'].includes(answer)) return 'That is not one of the answers.';
  return null;
}
export function answerCourier(world, person, answer) {
  const why = courierRefusal(person, answer);
  if (why) throw new Error(why);
  person.service.courier = answer === 'volunteer' ? 'volunteered' : 'stays';
  record(world, 'choice', { actorId: person.id, householdId: person.householdId, importance: 2, decision: `courier-${answer}`,
    text: offerSaid(person, answer === 'volunteer') });
}

/** The riders go: of those who offered, about one in four is chosen, rides out to Gonzales and lives; the asking closes. */
export function sendCouriers(world, day, { beginTravel }) {
  for (const person of inService(world, 'garrison')) {
    const service = person.service;
    // Nobody answered in time: decided as auto decides (sim/auto.mjs), and an offer made this way can still be chosen tonight.
    if (service.courier === 'open') {
      const offers = autoOffers(world, person);
      service.courier = offers ? 'volunteered' : 'stays';
      tell(world, person, `Nobody answered for ${person.name} in time, and it was decided for them. ${offerSaid(person, offers)}`, { importance: 2, type: 'choice' });
    }
    if (service.courier !== 'volunteered') continue;
    if (share(world, person.id, day) >= COURIER_CHOSEN) {
      service.courier = 'passed';
      tell(world, person, `Travis chose other riders. ${person.name} stays inside the walls.`, { importance: 2 });
      continue;
    }
    service.courier = 'sent';
    Object.assign(service, { status: 'released', until: world.minute, besieged: false });
    const eventId = tell(world, person, `${person.name} slipped out through the Mexican lines in the dark with Travis's letters, riding for Gonzales.`, { claimId: 'HIST-TEX-055' });
    awardGlory(world, { event: 'alamo', claimId: 'HIST-TEX-055', personId: person.id, householdId: person.householdId, role: 'present', fromSiteId: BEXAR, causes: [eventId] });
    try { beginTravel(world, person, GONZALES, eventId, 'home'); } catch { /* ceiling: a courier with nowhere to ride stands where they are */ }
  }
}

/** February 27, two in the afternoon: whoever waits in Gonzales to go in rides for Béxar with Kimbell and Martin. */
export function reliefRides(world, { beginTravel }) {
  for (const person of inService(world, 'relief')) {
    if (person.location?.siteId !== GONZALES || person.travel) continue;
    person.service.riding = true;
    const eventId = tell(world, person, `${person.name} rode out of Gonzales for the Alamo with Kimbell and Martin's company.`, { claimId: 'HIST-TEX-057' });
    const mode = modeWith(world, person);
    try { beginTravel(world, person, BEXAR, eventId, 'march', mode); } catch { try { beginTravel(world, person, BEXAR, eventId, 'march'); } catch { /* ceiling: set down at Béxar on March 1 */ } }
  }
}

/** Before dawn, March 1: the relief is through the lines and inside the walls. */
export function reliefEnters(world) {
  for (const person of inService(world, 'relief')) {
    if (!person.service.riding) continue;
    const site = world.map.sites[BEXAR];
    person.travel = null;
    person.location = { x: site.x, y: site.y, siteId: BEXAR };
    person.service = { kind: 'garrison', status: 'serving', since: world.minute, siteId: BEXAR, besieged: true, relief: true };
    tell(world, person, `${person.name} got through the Mexican lines in the dark with the Gonzales men, and is inside the Alamo.`, { claimId: 'HIST-TEX-057' });
  }
}

/** March 6: the walls are stormed. Every man inside is killed and every woman spared; nobody's family knows it yet. */
export function stormAlamo(world, causeId) {
  for (const person of inService(world, 'garrison')) {
    if (!person.service.besieged) continue;
    const fell = male(person);
    person.service.fate = fell ? 'fell' : 'spared';
    awardGlory(world, { event: 'alamo', claimId: 'HIST-TEX-058', personId: person.id, householdId: person.householdId, role: fell ? 'fought' : 'present', fromSiteId: BEXAR, causes: causeId ? [causeId] : [] });
  }
}

/** March 8: the spared women and children are let go, and make their way east as Susanna Dickinson did. */
export function survivorsLeave(world, { beginTravel }) {
  for (const person of inService(world, 'garrison')) {
    if (person.service.fate !== 'spared') continue;
    Object.assign(person.service, { status: 'released', until: world.minute, besieged: false });
    try { beginTravel(world, person, householdOf(world, person).homeSiteId, null, 'home'); } catch { /* ceiling: they stand at Béxar */ }
  }
}

/** The fate of the Alamo reaches these families: a death becomes true on their screen, and they are told what became of theirs. */
export function tellFall(world, households) {
  const ids = new Set(households.map(household => household.id));
  for (const person of Object.values(world.entities)) {
    if (!ids.has(person.householdId) || person.service?.kind !== 'garrison' || !person.service.fate || person.service.told) continue;
    person.service.told = true;
    if (person.service.fate === 'fell') {
      Object.assign(person.service, { status: 'fell', besieged: false });
      person.health = { condition: 'dead' }; person.task = 'rest'; person.chore = null;
      tell(world, person, `${person.name} was killed when the Alamo was stormed at dawn on March 6. No man inside the walls lived.`, { claimId: 'HIST-TEX-058' });
    } else {
      tell(world, person, `${person.name} was among the women spared when the Alamo fell, and was let go with Mrs. Dickinson.`, { claimId: 'HIST-TEX-058' });
    }
  }
}

/** February 27: nobody new goes south; those there are split between Johnson's party and Grant's. */
export function splitSouth(world) {
  for (const person of inService(world, 'matamoros')) person.service.party = share(world, person.id, 'party') < JOHNSON_SHARE ? 'san-patricio' : 'agua-dulce';
}

/** One southern fight: each of its party rolled for killed, captured or escaped. The escaped go to Fannin at Goliad at once. */
export function fightSouth(world, fight, { beginTravel }) {
  const rates = SOUTH_RATES[fight];
  for (const person of inService(world, 'matamoros')) {
    if (person.service.party !== fight || person.service.fate) continue;
    const dies = 1 - (1 - rates.killed) ** frailty(person);
    const roll = share(world, person.id, fight);
    const fate = roll < dies ? 'killed' : roll < dies + rates.captured ? 'captured' : 'escaped';
    person.service.fate = fate;
    const eventId = tell(world, person, `${person.name} was with ${fight === 'san-patricio' ? 'Johnson\'s men at San Patricio' : 'Grant\'s party at Agua Dulce Creek'} when Urrea's cavalry came.`, { claimId: 'HIST-TEX-059', importance: 1, type: 'army' });
    awardGlory(world, { event: fight, claimId: 'HIST-TEX-059', personId: person.id, householdId: person.householdId, role: 'fought', fromSiteId: 'refugio', causes: [eventId] });
    if (fate === 'escaped') {
      person.service = { kind: 'fannin', status: 'serving', since: world.minute, siteId: 'goliad', escapedFrom: fight };
      try { beginTravel(world, person, 'goliad', eventId, 'march'); } catch { /* ceiling: they stand where they were */ }
    }
  }
}

/** Word of a southern fight reaches the families: the dead and the captured become true, and each family hears of its own. */
export function tellSouth(world, fight) {
  const place = fight === 'san-patricio' ? 'San Patricio' : 'Agua Dulce Creek';
  for (const person of Object.values(world.entities)) {
    const service = person.service;
    if (!person.householdId) continue;
    if (service?.kind === 'fannin' && service.escapedFrom === fight && !service.told) {
      service.told = true;
      tell(world, person, `${person.name} got away when the Mexican cavalry struck at ${place}, and has gone to Fannin at Goliad.`, { claimId: 'HIST-TEX-059' });
      continue;
    }
    if (service?.kind !== 'matamoros' || service.party !== fight || !service.fate || service.told) continue;
    service.told = true;
    if (service.fate === 'killed') {
      Object.assign(service, { status: 'fell' });
      person.health = { condition: 'dead' }; person.task = 'rest';
      tell(world, person, `${person.name} was killed when the Mexican cavalry struck at ${place}.`, { claimId: 'HIST-TEX-059' });
    } else {
      Object.assign(service, { status: 'captured' });
      person.health = { condition: 'captured' }; person.task = 'rest';
      tell(world, person, `${person.name} was taken prisoner at ${place} and marched to Matamoros.`, { claimId: 'HIST-TEX-059' });
    }
  }
}

/** Families nobody plays near enough to act: the share of their grown hands who ride to Gonzales to go in with the relief. */
export const RELIEF_SHARE = 0.1;

export const ALAMO_WORD = Object.freeze({
  siege: 'Travis writes from the Alamo that he is besieged by a thousand or more Mexicans under Santa Anna, under a continual bombardment, and calls on every man able to bear arms to come to his aid. He will never surrender or retreat.',
  fannin: 'Fannin set out from Goliad to relieve the Alamo with some three hundred men and four guns, and has turned back; his wagons broke down and his oxen strayed.',
  declaration: 'The convention at Washington has declared Texas independent, on March 2, and named Sam Houston commander of all its forces.',
  sanPatricio: 'It is said Urrea\'s cavalry fell on Johnson\'s men at San Patricio before dawn, killing some and taking the rest prisoner.',
  aguaDulce: 'It is said Grant and his party were cut to pieces by Mexican cavalry at Agua Dulce Creek.',
  fallRumour: 'Two Mexican riders from Béxar say the Alamo has fallen and every man in it is dead. General Houston thinks they are spies.',
  fall: 'The Alamo has fallen. It was stormed at dawn on March 6, and every man in it was killed; Mrs. Dickinson, her child and Travis\'s servant Joe were spared and have come in to Gonzales.',
});
export { gonzalesFamilies, otherFamilies, word };
