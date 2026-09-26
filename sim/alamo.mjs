// The siege and fall of the Alamo, with San Patricio and Agua Dulce: docs/COLONIES.md §7f and build step 9, decided by the
// owner by multiple choice (2026-09-16). Researched in docs/battle-research/alamo.md (`HIST-TEX-054` to `-061`).
//
// - **Before it** (the rumour of about February 18): a family with somebody in the garrison is told, in words, that they can
//   still be sent for and that nobody can be once the Mexican army is in the town (`warnGarrison`).
// - **The siege** (February 23): whoever of a family is at Béxar is shut in the Alamo with the garrison, stands at their place
//   inside the walls, and cannot be sent for. On each of the four days Travis sent riders out (owner, 2026-09-22: volunteers
//   are reconsidered on later courier dates), Travis's runner walks to every played man inside who could carry a letter
//   (sim/alamo-runner.mjs) and asks, once that day; about one volunteer in four is chosen that night, rides out to Gonzales,
//   and lives. An answer nobody gives is decided by the documented fallback (`settleUnanswered`, docs/ALAMO_FATES.md).
// - **The relief**: every family that has heard Travis's letter may send a grown member to Gonzales; whoever is there by two in
//   the afternoon of February 27 rides with Kimbell and Martin and is inside the Alamo before dawn on March 1.
// - **The fall** (March 6): by role and place, not by sex (owner, 2026-09-22; docs/ALAMO_FATES.md). Every man of fighting age
//   still inside at the assault is killed, as every combatant was; a woman or child inside is spared with the noncombatants
//   and comes away east as Susanna Dickinson did. Whoever was sent out as a courier is not inside, and lives.
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
import { canAnswerCalls } from './family.mjs';
import { closeRunner, sendRunner, takePost } from './alamo-runner.mjs';

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
/**
 * What somebody inside the Alamo is there as (docs/ALAMO_FATES.md, `FIC-GONZ-381`): a **fighter** - a man or a boy of an age
 * to answer for the family (sim/family.mjs `canAnswerCalls`, sixteen and up), however he came to be inside, sick or well -
 * or a **noncombatant**, every woman and every younger child. It decides who Travis's runner asks to carry a letter and
 * what the assault does to them. Not sex alone: a boy of eight is a noncombatant, as Enrique Esparza was (`HIST-TEX-433`).
 */
export const alamoRole = person => male(person) && canAnswerCalls(person) ? 'fighter' : 'noncombatant';
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
    // ceiling: set down at their place inside the walls; the walk from the town into the fort on the afternoon of the 23rd is
    // not drawn. The Alamo was where the garrison went (`HIST-TEX-054`), and the runner needs them there to walk to.
    takePost(world, person);
    tell(world, person, `The Mexican army has come into Béxar under a red flag. ${person.name} is shut in the Alamo with the garrison.`, { claimId: 'HIST-TEX-054' });
  }
}

/**
 * The rumour that Santa Anna is marching on Béxar: a survival opportunity said in words before it closes (owner, 2026-09-22;
 * `FIC-GONZ-383`). Every family with somebody in the garrison is told that they can still be sent for, and that once the
 * Mexican army is in the town nobody will be. It promises nothing about what the army will do.
 */
export function warnGarrison(world) {
  for (const person of inService(world, 'garrison')) {
    if (person.service.besieged) continue;
    tell(world, person, `It is said Santa Anna is marching on Béxar. ${person.name} is with the garrison there and can still be sent for. If the Mexican army reaches the town, the garrison will be shut in, and nobody can be sent for then.`, { claimId: 'FIC-GONZ-383', type: 'pressure' });
  }
}

/**
 * The share of the garrison that offers to ride when the choice is auto's (`FIC-GONZ-048`): about a third. Some sixteen
 * couriers are known to have gone out (`HIST-TEX-055`), and with one offer in four chosen (`COURIER_CHOSEN`) that is
 * sixty or so offers among fewer than two hundred men.
 */
export const COURIER_OFFERED = 1 / 3;
const autoOffers = (world, person) => share(world, person.id, 'courier-offer') < COURIER_OFFERED;
const offerSaid = (person, offers) => offers ? `${person.name} offered to carry Travis's letters out.` : `${person.name} will stay inside the walls.`;
/** Whether Travis's runner is on the way to this person or waiting on their answer. */
export const courierPending = person => ['coming', 'open'].includes(person?.service?.courier);

/**
 * Whether Travis would ask this person today (owner, 2026-09-22: "Reconsider eligible volunteers on later courier dates";
 * `FIC-GONZ-382`). A fighter shut inside, alive and not taken, not already sent out, and not already asked this day. Asked
 * again on each later day whatever they said before - a volunteer passed over, or somebody who stayed - so the chance to
 * go stays open until the last rider has gone.
 */
export function courierEligible(world, person, day) {
  const service = person?.service;
  // Shut inside: not a courier already sent out (released, and no longer besieged), not somebody who never got in.
  if (!person?.householdId || service?.kind !== 'garrison' || !service.besieged) return false;
  if (GONE.includes(person.health?.condition)) return false;
  if (service.courierDay === day) return false;
  return alamoRole(person) === 'fighter';
}

/** A day Travis sends riders out: his runner goes to every played fighter inside who is eligible today. */
export function askCouriers(world, day) {
  let asked = 0;
  for (const person of Object.values(world.entities)) {
    if (!courierEligible(world, person, day)) continue;
    const household = householdOf(world, person);
    if (!household?.played) continue;
    person.service.courierDay = day;
    // On auto, or with nobody at the family's screen (sim/absence.mjs), answered the moment it is asked, at auto's share
    // (sim/auto.mjs); nobody waits on the family, and no runner walks to somebody nobody is watching.
    if (person.auto || household.absent) {
      const offers = autoOffers(world, person);
      person.service.courier = offers ? 'volunteered' : 'stays';
      person.service.courierOffer = offers;
      record(world, 'choice', { actorId: person.id, householdId: person.householdId, importance: 2, decision: `courier-${offers ? 'volunteer' : 'stay'}`, text: offerSaid(person, offers) });
      continue;
    }
    sendRunner(world, person, day);
    asked++;
  }
  return asked;
}

/** Why a courier answer cannot be given, or null. */
export function courierRefusal(person, answer) {
  if (person?.service?.courier === 'coming') return `Travis's runner has not reached ${person.name} yet.`;
  if (person?.service?.courier !== 'open') return `${person?.name || 'Nobody'} is not being asked to ride out.`;
  if (!['volunteer', 'stay'].includes(answer)) return 'That is not one of the answers.';
  return null;
}
export function answerCourier(world, person, answer) {
  const why = courierRefusal(person, answer);
  if (why) throw new Error(why);
  person.service.courier = answer === 'volunteer' ? 'volunteered' : 'stays';
  person.service.courierOffer = answer === 'volunteer';
  record(world, 'choice', { actorId: person.id, householdId: person.householdId, importance: 2, decision: `courier-${answer}`,
    text: offerSaid(person, answer === 'volunteer') });
  closeRunner(world, person, answer);
}

/**
 * Nobody answered the runner: the documented fallback (owner, 2026-09-22: "with a documented fallback"; docs/ALAMO_FATES.md;
 * `FIC-GONZ-384`). Used when the decision's real-time budget runs out (`why` 'budget', sim/decision-budget.mjs) and when the
 * riders go that night with the question still open (`why` 'deadline').
 *
 * The fallback is the owner's standing rule for every choice not made in time (`FIC-GONZ-048`, 2026-09-16): **auto takes
 * over**. The person decides alone, at auto's share - about a third offer - exactly as a person on auto and a family nobody is
 * at the screen for decide, and the army's and Houston's questions fall back the same way. One rule for every military
 * question, said in the journal in plain words. ceiling: an earlier offer is not carried forward - a volunteer passed over
 * who is not answered for on a later day decides afresh at the share. Staying at one's post is the alternative the historical
 * review would also defend (docs/ALAMO_FATES.md §4, "Nobody answered"); it is the owner's to choose, not this code's.
 */
export function settleUnanswered(world, person, why = 'deadline') {
  const service = person.service;
  if (!courierPending(person)) return;
  const offers = autoOffers(world, person);
  service.courier = offers ? 'volunteered' : 'stays';
  service.courierOffer = offers;
  const when = why === 'budget' ? 'in time' : 'in time, before the riders went';
  const text = `Nobody answered for ${person.name} ${when}, and it was decided for them, as a person on auto decides. ${offerSaid(person, offers)}`;
  record(world, 'choice', { actorId: person.id, householdId: person.householdId, importance: 2, decision: `courier-${offers ? 'volunteer' : 'stay'}`, claimId: 'FIC-GONZ-384', text });
  closeRunner(world, person, 'unanswered', offers);
}

/**
 * The riders go that night: of those who offered, about one in four is chosen, slips out, rides for Gonzales and lives; the
 * rest stay inside and will be asked again on the next day Travis sends riders. Somebody already sent is never sent twice.
 */
export function sendCouriers(world, day, { beginTravel }) {
  for (const person of inService(world, 'garrison')) {
    const service = person.service;
    if (!service.besieged) continue;
    if (courierPending(person)) settleUnanswered(world, person, 'deadline');
    if (service.courier !== 'volunteered') continue;
    if (share(world, person.id, day) >= COURIER_CHOSEN) {
      service.courier = 'passed';
      tell(world, person, `Travis chose other riders tonight. ${person.name} stays inside the walls.`, { importance: 2 });
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
    takePost(world, person);
    tell(world, person, `${person.name} got through the Mexican lines in the dark with the Gonzales men, and is inside the Alamo.`, { claimId: 'HIST-TEX-057' });
  }
}

/**
 * March 6: the walls are stormed. What becomes of each person still inside is decided by what they are there as
 * (`alamoRole`, `FIC-GONZ-381`), and the place they are in: a fighter inside at the assault is killed, as every combatant
 * was (`HIST-TEX-058`, `-435`, `-436`); a noncombatant is spared (`HIST-TEX-432`, `-433`). Whoever was sent out as a courier
 * is not inside (`service.besieged` false) and is not touched. Nobody's family knows any of it yet.
 */
export function stormAlamo(world, causeId) {
  for (const person of inService(world, 'garrison')) {
    if (!person.service.besieged) continue;
    const fell = alamoRole(person) === 'fighter';
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
      tell(world, person, person.service.relief
        ? `${person.name} was killed when the Alamo was stormed at dawn on March 6, with the Gonzales men who had gone in on March 1. The garrison was overwhelmed.`
        : `${person.name} was killed when the Alamo was stormed at dawn on March 6. The garrison was overwhelmed.`, { claimId: 'HIST-TEX-058' });
    } else {
      tell(world, person, `${person.name} was among the women and children spared when the Alamo fell. Santa Anna's officers questioned them and let them go, and ${person.name} came away east as Mrs. Dickinson did.`, { claimId: 'HIST-TEX-432' });
    }
  }
}

/** February 27: nobody new goes south; those there are split between Johnson's party and Grant's. */
export function splitSouth(world) {
  // A man already put in a party - Grant's ride south about February 20, on a map with the south (sim/south.mjs `grantRides`) -
  // keeps it; the shares are the same, so the split is what it always was.
  for (const person of inService(world, 'matamoros')) if (!person.service.party) person.service.party = share(world, person.id, 'party') < JOHNSON_SHARE ? 'san-patricio' : 'agua-dulce';
}

/** One southern fight: each of its party rolled for killed, captured or escaped. The escaped go to Fannin at Goliad at once. */
export function fightSouth(world, fight, { beginTravel }) {
  const rates = SOUTH_RATES[fight];
  for (const person of inService(world, 'matamoros')) {
    // A man in the fight on the engine (sim/south.mjs) has his fate from it, at its own moment, by this same roll.
    if (person.service.party !== fight || person.service.fate || person.service.fight) continue;
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
