// The winter's choices: docs/COLONIES.md §7e and build step 8(b), decided by the owner by multiple choice (2026-09-16).
// Researched in docs/battle-research/winter-1835-36.md (`HIST-TEX-047` to `-053`).
//
// "All of the above, but each character can only be in one location, so each family would need to send an applicable
// person to each that they want to participate in. Choices will need to be made." In the second class period a grown
// member of a family can:
//
// - **enlist for land at San Felipe**, where the council sat: the regular army ($24 and 800 acres for two years or the
//   war, `HIST-TEX-048`) or the auxiliary volunteers (640 acres for the war, 320 for a year). Glory now, the land at the
//   end if they are alive and still serving (owner). A regular who is sent for has deserted: the glory is taken back
//   twice over and they can never enlist again. An auxiliary can be sent for, and forfeits the land;
// - **ride to Béxar and join the garrison** under Neill, Bowie and then Travis (`HIST-TEX-049`, `-051`);
// - **go south to join the Matamoros men** (`HIST-TEX-049`), at San Patricio on the Nueces since 2026-09-25 (sim/south.mjs;
//   at Refugio on a class whose map has no south);
// - **vote on February 1** in the family's own settlement town, if a man of twenty-one or more (`HIST-TEX-052`).
//
// Each is a chore in `sim/chores.mjs` (the `winter` flag): it walks or rides there and the step below does the rest, so
// the road, the mode, the refusals and the family panel are the ones every errand already has. Somebody serving is in one
// place and does nothing else until they are sent for.
//
// ceiling: the service has no fights yet. What happens to the garrison on February 23 and to the Matamoros men at San
// Patricio and Agua Dulce is the Alamo's and Matamoros's own research, not this step's; until then serving is standing
// where they went, and the second period ends on February 23.
import { record } from './events.mjs';
import { awardGlory } from './glory.mjs';
import { canAnswerCalls, canFight, cannotFightWhy, cannotAnswerWhy } from './family.mjs';
import { houstonCamp, houstonOpen } from './houston.mjs';
import { southClosing, southSite } from './south.mjs';
import { battleState } from './battle-stage.mjs';

/** Where each kind of service is joined, and what it promises. */
export const SERVICE = Object.freeze({
  regular: { siteId: 'san-felipe', acres: 800, bound: true, name: 'the regular army', claimId: 'HIST-TEX-048', event: 'enlistment' },
  'auxiliary-war': { siteId: 'san-felipe', acres: 640, bound: false, name: 'the auxiliary volunteers, for the war', claimId: 'HIST-TEX-048', event: 'enlistment' },
  'auxiliary-year': { siteId: 'san-felipe', acres: 320, bound: false, name: 'the auxiliary volunteers, for a year', claimId: 'HIST-TEX-048', event: 'enlistment' },
  // ceiling: Neill's garrison was in the town and the Alamo; the game has one place for Béxar.
  garrison: { siteId: 'bexar', acres: 0, bound: false, name: 'the garrison at Béxar', claimId: 'HIST-TEX-051', event: 'garrison' },
  // At San Patricio since 2026-09-25, where Johnson and Grant took the men (`HIST-TEX-513`, docs/MAP_ACCURACY.md §13); a class
  // whose map has no south joins at Refugio, where Houston met them (sim/south.mjs `southSite`).
  matamoros: { siteId: 'san-patricio', acres: 0, bound: false, name: 'the Matamoros expedition', claimId: 'HIST-TEX-049', event: 'matamoros' },
  // The Alamo (sim/alamo.mjs): the men waiting at Gonzales to ride in with Kimbell and Martin, and those who got away from the
  // southern fights to Fannin at Goliad.
  relief: { siteId: 'gonzales', acres: 0, bound: false, name: 'the men going in from Gonzales', claimId: 'HIST-TEX-057', event: 'alamo' },
  fannin: { siteId: 'goliad', acres: 0, bound: false, name: 'Fannin\'s command at Goliad', claimId: 'HIST-TEX-059', event: 'goliad' },
  // Houston's army of the spring (sim/houston.mjs): joined at whichever camp it is in.
  houston: { siteId: 'gonzales', acres: 0, bound: false, name: 'General Houston\'s army', claimId: 'HIST-TEX-066', event: 'houston' },
});

/** Land counts at the end at one real for every twenty acres, added after glory multiplies the coin (owner, 2026-09-16). */
export const ACRES_PER_REAL = 20;
/** Men of this age and more voted (owner's choice of the 1836 rule). */
export const VOTING_AGE = 21;

/** The chores of the winter, by what their last step does. */
export const WINTER_CHORES = Object.freeze({
  'enlist-regular': 'regular', 'enlist-auxiliary': 'auxiliary', 'join-garrison': 'garrison', 'join-matamoros': 'matamoros', 'go-vote': 'vote', 'join-relief': 'relief', 'join-houston': 'houston',
});

const passed = (world, key) => Boolean(world.director?.milestones?.[key]);
/** Whether each kind can still be joined (owner, §7f): the garrison closes when the siege begins, going south on February 27, the relief when it rides. */
const stillOpen = (world, household, kind) => kind === 'garrison' ? !passed(world, 'alamo-siege')
  : kind === 'matamoros' ? !passed(world, 'san-patricio')
  : kind === 'relief' ? Boolean(world.knowledge?.households?.[household.id]?.['alamo-siege']) && !passed(world, 'relief-leaves')
  : kind === 'houston' ? houstonOpen(world)
  // In the spring only Houston's army can be joined: enlisting at San Felipe ended when the council fled, the garrison fell, the south is Urrea's.
  : world.period !== 3;

const GONE = ['dead', 'captured'];
/**
 * Whether somebody may vote: a man of twenty-one or more. A family nobody has rolled has no ages or sexes, only who is who
 * (sim/family.mjs): its father is a grown man, and a son of no stated age is not counted as one.
 */
export function mayVote(entity) {
  const male = entity?.sex ? entity.sex === 'male' : entity?.kin?.role === 'father';
  const grown = Number.isFinite(entity?.age) ? entity.age >= VOTING_AGE : entity?.kin?.role === 'father';
  return Boolean(male && grown);
}
const serving = entity => entity?.service?.status === 'serving';
const place = (world, siteId) => world.map.sites[siteId]?.name || siteId;

/** Whether the winter's choices are open: the second period, once its news has come, and before it ends; and the spring, for Houston's army. */
export const winterOpen = world => ((world.period === 2 && Boolean(world.director?.milestones?.['winter-news'])) || world.period === 3) && !world.director?.complete;
/** Whether the polls are open, February 1. */
export const pollsOpen = world => world.period === 2 && Boolean(world.director?.milestones?.['election-opens']) && !world.director?.milestones?.['election-close'];

/** Whether this chore is put in front of this person at all, so nothing of the winter rides the channel in 1835. */
export function winterOffered(world, household, entity, choreId) {
  if (!winterOpen(world)) return false;
  if (WINTER_CHORES[choreId] === 'vote') return pollsOpen(world) && mayVote(entity) && !entity.voted;
  return stillOpen(world, household, WINTER_CHORES[choreId]);
}

/** Why this person cannot be sent on this winter chore now, or null. */
export function winterRefusal(world, household, entity, choreId) {
  const kind = WINTER_CHORES[choreId];
  if (!kind) return null;
  if (!winterOpen(world)) return 'That is not a choice this winter.';
  if (serving(entity)) return `${entity.name} is already with ${SERVICE[entity.service.kind].name}.`;
  if (kind === 'vote') {
    if (!pollsOpen(world)) return 'The polls are open on February 1.';
    if (!mayVote(entity)) return `Only men of ${VOTING_AGE} and over vote.`;
    if (entity.voted) return `${entity.name} has voted.`;
    return null;
  }
  if (!stillOpen(world, household, kind)) return { garrison: 'Béxar is under siege. Only the men going in from Gonzales can reach the garrison now.', matamoros: 'Nobody is going south to Matamoros now.', relief: 'The men from Gonzales have ridden for the Alamo.', houston: 'The battle is fought. The army is going home.' }[kind] || 'That is not a choice now.';
  // Who may go is who may be sent to the fighting: a father, or a son of sixteen or more (docs/FAMILY_CREATION.md step 4;
  // owner, 2026-09-16: women did not go to battle, and it is not offered them).
  if (!canFight(entity)) return cannotFightWhy(entity);
  if (['regular', 'auxiliary'].includes(kind) && entity.deserted) return `${entity.name} deserted the army and cannot enlist again.`;
  // Honest about the road (docs/BATTLES.md §2.6): a man who could not reach Johnson's men before the raid is not sent.
  if (kind === 'matamoros') return southClosing(world, household, entity);
  return null;
}

/** Somebody arrives where they meant to serve, and joins. Called by the chore's last step. */
export function joinService(world, household, entity, kind) {
  const terms = SERVICE[kind];
  if (!terms || GONE.includes(entity.health?.condition)) return null;
  // Arrived after the way was shut (sim/alamo.mjs): the chore's `shut-out` step takes them home again.
  if (!stillOpen(world, household, kind)) {
    if (entity.chore) entity.chore.flags = [...(entity.chore.flags || []), 'shut-out'];
    return record(world, 'consequence', { actorId: entity.id, householdId: household.id, importance: 2, text: kind === 'garrison' ? `${entity.name} reached Béxar too late: the Mexican army is in the town and the Alamo is shut.` : kind === 'relief' ? `${entity.name} reached Gonzales after the men for the Alamo had ridden.` : `${entity.name} found the volunteers gone from ${place(world, terms.siteId)}.` });
  }
  // Houston's army is wherever its camp is now; somebody who reaches an empty camp follows it (sim/houston.mjs `followCamp`).
  const siteId = kind === 'houston' ? houstonCamp(world) : kind === 'matamoros' ? southSite(world) : terms.siteId;
  entity.service = { kind, status: 'serving', since: world.minute, siteId, ...(terms.acres && { acres: terms.acres }) };
  const eventId = record(world, 'army', {
    actorId: entity.id, householdId: household.id, importance: 3, classification: 'DOCUMENTED', claimId: terms.claimId,
    text: terms.acres
      ? `${entity.name} put their name to the roll of ${terms.name} at ${place(world, terms.siteId)}, on the promise of ${terms.acres} acres of land.`
      : `${entity.name} has joined ${terms.name} at ${place(world, siteId)}.`,
  });
  // Glory now for enlisting (owner); the garrison and the expedition earn theirs from what they are there for, later.
  if (terms.acres) awardGlory(world, { event: 'enlistment', claimId: terms.claimId, personId: entity.id, householdId: household.id, role: 'enlisted', fromSiteId: terms.siteId, causes: [eventId] });
  return eventId;
}

/** A man votes at his settlement's polls. */
export function castVote(world, household, entity) {
  if (entity.voted) return null;
  if (!pollsOpen(world)) return record(world, 'consequence', { actorId: entity.id, householdId: household.id, importance: 2, text: `${entity.name} reached ${place(world, entity.location.siteId)} after the polls had closed.` });
  entity.voted = true;
  const siteId = entity.location.siteId;
  const eventId = record(world, 'choice', {
    actorId: entity.id, householdId: household.id, importance: 2, classification: 'DOCUMENTED', claimId: 'HIST-TEX-052',
    text: `${entity.name} voted at ${place(world, siteId)} for the delegates to the convention.`,
  });
  awardGlory(world, { event: 'election', claimId: 'HIST-TEX-052', personId: entity.id, householdId: household.id, role: 'voted', fromSiteId: siteId, causes: [eventId] });
  return eventId;
}

/** Why somebody cannot be sent for, or null. */
/** Six in the morning of March 19, 1836: Fannin's column leaves Goliad in the fog (`HIST-TEX-063`). */
export const FANNIN_MARCHES = 221760 + 18 * 1440 + 360;
export function recallRefusal(entity, world = null) {
  // With Fannin from the morning of March 19 (sim/houston.mjs): on the prairie, then a prisoner; nobody can be sent after them.
  if (entity?.service?.kind === 'fannin' && ['serving', 'prisoner'].includes(entity.service.status) && Number.isFinite(world?.minute) && world.minute >= FANNIN_MARCHES) return `${entity.name} has marched out of Goliad with Fannin, and nobody can be sent after them.`;
  if (!serving(entity)) return `${entity.name} is not away with anybody to be sent for.`;
  // In a southern fight, or once it has been fought: nobody can reach them, and the refusal says nothing of what became of them
  // - the family learns that only with the word (staging.md §4.6 case d; a recall used to reach a man already dead or taken).
  if (entity.service.kind === 'matamoros' && (entity.service.fight || entity.service.fate)) {
    const where = entity.service.party === 'agua-dulce' ? "Grant's party south of the Nueces" : 'San Patricio';
    const fight = world && entity.service.fight ? battleState(world, entity.service.fight) : null;
    const begun = fight && !fight.before && world.minute >= fight.phases.find(phase => phase.contact).from;
    return entity.service.fate || begun
      ? `No word has come from ${where}. Nobody can reach ${entity.name} now.`
      : `${entity.name} is with ${entity.service.party === 'agua-dulce' ? "Grant's party" : "Johnson's men at San Patricio"}, and nobody can reach them now.`;
  }
  if (entity.service.besieged) return `${entity.name} is shut in the Alamo, and nobody can be sent for through the Mexican lines.`;
  if (entity.service.riding) return `${entity.name} has ridden for the Alamo with the Gonzales men.`;
  if (GONE.includes(entity.health?.condition)) return `${entity.name} cannot come home.`;
  if (entity.travel) return `${entity.name} is on the road.`;
  return null;
}

/**
 * The family sends for somebody serving. A regular has deserted: the glory for enlisting is taken back twice over and they
 * may never enlist again (owner). An auxiliary forfeits the land. The garrison and the expedition simply come home.
 */
export function recallFromService(world, household, entity, { beginTravel, modeWith }) {
  const why = recallRefusal(entity, world);
  if (why) throw new Error(why);
  const terms = SERVICE[entity.service.kind];
  // A regular taken into Houston's army is a regular still (sim/houston.mjs `takeInEnlisted`).
  const deserting = entity.service.bound ?? terms.bound;
  entity.service = { ...entity.service, status: deserting ? 'deserted' : 'released', until: world.minute, acres: 0 };
  if (deserting) entity.deserted = true;
  const text = deserting
    ? `${entity.name} left the regular army at ${place(world, terms.siteId)} without a discharge and started home. They have deserted, and will not be taken again.`
    : terms.acres
      ? `${entity.name} left ${terms.name} and started home. The promise of land went with it.`
      : `${entity.name} left ${terms.name} at ${place(world, terms.siteId)} and started home.`;
  const eventId = record(world, 'army', { actorId: entity.id, householdId: household.id, importance: 3, classification: 'FICTIONAL FOR GAMEPLAY', claimId: 'FIC-GONZ-044', text });
  if (deserting) awardGlory(world, { event: 'desertion', claimId: terms.claimId, personId: entity.id, householdId: household.id, role: 'enlisted', fromSiteId: terms.siteId, causes: [eventId], adjust: earned => -2 * earned, note: 'They deserted.' });
  const mode = modeWith(world, entity);
  try { beginTravel(world, entity, household.homeSiteId, eventId, 'home', mode); } catch (error) { if (mode === 'foot') throw error; beginTravel(world, entity, household.homeSiteId, eventId, 'home'); }
  return eventId;
}

/**
 * The land a family is promised at the end: every living member on land terms who is still serving or was released with the
 * promise kept, at a real for twenty acres. Released, not only serving: an enlisted man taken into Houston's army
 * (sim/houston.mjs `takeInEnlisted`) is released after San Jacinto and goes home with the promise, which is the whole point
 * of enlisting (docs/COLONIES.md §7e). Being sent for zeroes the acres (`recallFromService`), so a release with acres on it
 * is an honourable one. Found by the whole-game browser run, 2026-09-16: a man who served out the war finished with no land.
 */
export function landPromised(world, household) {
  let acres = 0;
  for (const id of household.members) {
    const person = world.entities[id];
    if (!person || GONE.includes(person.health?.condition) || !['serving', 'released'].includes(person.service?.status)) continue;
    acres += person.service.acres || 0;
  }
  return { acres, reales: Math.floor(acres / ACRES_PER_REAL) };
}

/**
 * What somebody serving may still be asked: nothing that is not about being sent for, named, or spoken to - and, for a man
 * with Houston, the camp's own work and the army's questions (sim/camp.mjs; `chore` is refused for anything but the camp's
 * work by `choreAvailability`).
 */
export const SERVING_ACTIONS = Object.freeze(['winter-recall', 'alamo-courier', 'rename', 'set-main', 'ask-rider', 'leave-rider', 'army-answer', 'chore', 'stop-chore', 'houston-answer']);
export const servingWhy = (world, entity) => entity.service.besieged
  ? `${entity.name} is shut in the Alamo with the garrison.`
  : `${entity.name} is with ${SERVICE[entity.service.kind].name} at ${place(world, entity.service.siteId)}, and can only be sent for.`;

/** A saved service that cannot be, or null. */
export function winterInvalid(world) {
  for (const entity of Object.values(world.entities)) {
    const service = entity.service;
    if (service === undefined) continue;
    if (!service || !SERVICE[service.kind] || !['serving', 'released', 'deserted', 'fell', 'captured', 'prisoner'].includes(service.status)) return 'Invalid service';
    // 'coming': Travis's runner is walking to them (sim/alamo-runner.mjs). `courierDay` and `courierOffer` are absent on a class
    // saved before volunteers were asked again on later days, which correctly reads as never asked and never offered.
    if (service.courier !== undefined && !['coming', 'open', 'volunteered', 'stays', 'passed', 'sent'].includes(service.courier)) return 'Invalid courier answer';
    if (service.courierDay !== undefined && !/^courier-[1-4]$/.test(service.courierDay)) return 'Invalid courier day';
    if (service.courierOffer !== undefined && typeof service.courierOffer !== 'boolean') return 'Invalid courier offer';
    if (service.fate !== undefined && !['fell', 'spared', 'killed', 'captured', 'escaped', 'executed', 'wounded', 'unhurt'].includes(service.fate)) return 'Invalid fate';
    if (service.acres !== undefined && (!Number.isInteger(service.acres) || service.acres < 0)) return 'Invalid acres promised';
  }
  return null;
}

