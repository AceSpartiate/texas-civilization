// The Host's live page (owner, 2026-09-16, docs/HOST_PAGE.md): the class family by family in words, the Rumor Mill, and
// the spotlight the teacher's camera goes to when something happens that most of the class would miss.
//
// Owner: a class panel that shows "where everyone is, what waits on them, who is here" (no coin, no glory: glory stays
// hidden until the ending, VISION.md §20); "the host screen should give teasers of information. Call it the Rumor Mill. as
// reports come in, a short, easy to read story should populate for this. It will adapt and change as new rumors flow in.
// Some are true, some aren't. When major events happen, such as the Fall of the Alamo, the Goliad Massacre, or the burning
// of a player's house, the host camera should zoom in on that and show it live. These would be events that many students
// would miss."
//
// Everything here is read from the world and sent to the Host alone (sim/world.mjs `projectWorld`); a student's payload
// gains nothing (tests/host-live.test.mjs). The Rumor Mill is one running story of what the families have heard, in the
// words of their tellings and as firm as they had it, never the truth beside it (sim/rumour-story.mjs), so the Host still
// reflects what the colonies knew (VISION.md §18) even though the teacher's map has no fog.
import { record } from './events.mjs';
import { householdName } from './family.mjs';
import { CHORES } from './chores.mjs';
import { SERVICE } from './winter.mjs';
import { campName } from './houston.mjs';
import { rumourStory } from './rumour-story.mjs';
// A cycle with sim/directors.mjs (which calls `spotlight`), safe because both sides use the other only inside functions.
import { dateOf } from './directors.mjs';

/** How long the Host's camera stays on a moment before the whole class comes back into the frame: half a day of the calendar. */
export const SPOTLIGHT_MINUTES = 12 * 60;

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const dayOf = (world, minute) => { const at = dateOf(world, minute); return `${MONTHS[at.getUTCMonth()]} ${at.getUTCDate()}`; };
const placeName = (world, siteId) => world.map?.sites?.[siteId]?.name || siteId || 'somewhere';

/**
 * Something happened that the whole class should see: where, and in what words. The Host's camera goes there and the
 * banner says so until `SPOTLIGHT_MINUTES` pass or the next one comes; the teacher can always press Whole class.
 */
export function spotlight(world, { key, text, siteId = null, x = null, y = null, claimId = null, householdId = null }) {
  const site = siteId ? world.map?.sites?.[siteId] : null;
  const at = { x: x ?? site?.x, y: y ?? site?.y };
  if (!Number.isFinite(at.x) || !Number.isFinite(at.y)) return null;
  const eventId = record(world, 'spotlight', { visibility: 'public', importance: 3, text, siteId, classification: claimId ? 'DOCUMENTED' : 'FICTIONAL FOR GAMEPLAY', claimId, ...(householdId && { householdId }) });
  world.spotlight = { key, text, siteId, x: at.x, y: at.y, minute: world.minute, eventId, ...(claimId && { claimId }), ...(householdId && { householdId }) };
  return world.spotlight;
}

/** The spotlight as the Host is shown it, or null once it has passed. */
export function spotlightProjection(world) {
  const s = world.spotlight;
  if (!s || world.minute - s.minute > SPOTLIGHT_MINUTES) return null;
  return { key: s.key, text: s.text, siteId: s.siteId, x: s.x, y: s.y, minute: s.minute, date: dayOf(world, s.minute), ...(s.householdId && { householdId: s.householdId, family: householdName(world, world.households[s.householdId]) }) };
}

/** One person, in words a teacher reads at a glance: where they are and what they are at. */
export function whereWords(world, person, household) {
  const condition = person.health?.condition;
  if (condition === 'dead') return 'dead';
  if (condition === 'captured') return 'a prisoner';
  const sick = condition === 'sick' ? 'sick, ' : '';
  const service = person.service;
  if (service?.status === 'serving' || service?.status === 'prisoner') {
    if (service.besieged) return `${sick}shut in the Alamo`;
    if (service.riding) return `${sick}riding for the Alamo`;
    if (service.status === 'prisoner') return `${sick}a prisoner at ${placeName(world, service.siteId)}`;
    // What he is at in the camp (sim/camp.mjs): "with Houston's army at Groce's, above San Felipe de Austin: drilling with the company".
    if (service.kind === 'houston') { const at = person.chore ? `: ${person.chore.doing}` : ''; return `${sick}with Houston's army at ${campName(world, service.siteId)}${at}`; }
    if (service.kind === 'fannin') return `${sick}with Fannin at ${placeName(world, service.siteId)}`;
    return `${sick}with ${SERVICE[service.kind]?.name || 'the army'} at ${placeName(world, service.siteId)}`;
  }
  if (world.army?.members?.includes(person.id)) return `${sick}with the army${world.army.camp ? ` at ${world.army.camp}` : ''}`;
  if (person.travel) {
    const purpose = person.travel.purpose;
    if (purpose === 'flee') {
      // The road east (sim/road.mjs): held by the mud, the river or the camp, or overtaken.
      const flight = household.flight || {}, to = placeName(world, person.travel.to);
      if (flight.overtaken && world.minute - flight.overtaken.minute <= 1440) return `${sick}overtaken by the Mexican army on the road east to ${to}`;
      if (flight.bog) return `${sick}bogged in the mud on the road east to ${to}`;
      if (flight.crossing) return `${sick}waiting to get over at ${placeName(world, flight.crossing.siteId)}`;
      if (person.chore) return `${sick}camped on the road east to ${to}: ${CHORES[person.chore.id]?.name?.toLowerCase() || 'at work'}`;
      return `${sick}on the road east to ${to}`;
    }
    if (purpose === 'return' || purpose === 'home' || person.travel.to === household.homeSiteId) return `${sick}on the road home`;
    if (purpose === 'march') return `${sick}marching with the army`;
    return `${sick}on the road to ${placeName(world, person.travel.to)}`;
  }
  const at = person.location?.siteId;
  const doing = person.chore ? CHORES[person.chore.id]?.name?.toLowerCase() : person.task === 'help' ? 'helping' : person.task === 'work' ? 'working' : null;
  if (household.flight && ['fled', 'refuged'].includes(household.flight.status) && at === household.flight.refuge) return `${sick}at ${placeName(world, at)}, fled from home${doing ? `: ${doing}` : ''}`;
  if (at === household.homeSiteId) return `${sick}at home${doing ? `: ${doing}` : ''}`;
  if (at) return `${sick}at ${placeName(world, at)}${doing ? `: ${doing}` : ''}`;
  return `${sick}somewhere on the road`;
}

/** How many things wait unanswered on this family right now: what the panel's "!" marks would count for its student. */
export function waitingOn(world, household) {
  let count = 0;
  for (const encounter of Object.values(world.encounters || {})) if (encounter.status === 'open' && encounter.householdId === household.id) count++;
  for (const question of Object.values(world.army?.questions || {})) if (!question.closed) for (const id of household.members) if (question.asks?.[id] === 'open') count++;
  if (world.army?.detachment && !world.army.detachment.closed) for (const id of household.members) if (world.army.detachment.asks?.[id] === 'open') count++;
  for (const id of household.members) {
    const person = world.entities[id];
    // Travis's runner standing with them is already counted as the meeting above (sim/alamo-runner.mjs).
    if (person?.service?.courier === 'open' && !Object.values(world.encounters || {}).some(one => one.status === 'open' && one.listenerId === person.id)) count++;
    // The army's questions to a man with Houston (sim/camp.mjs): leaving after the word of Goliad, the fork of the road.
    if (person?.service?.leave === 'open') count++;
    if (person?.service?.road === 'open') count++;
    if (person?.chore?.ask) count++;
  }
  if (household.flight?.status === 'ordered') count++;
  // The road's question - the bogged wagon, the army close behind (sim/road.mjs).
  if (household.flight?.ask) count++;
  for (const request of [world.calls?.[household.id], world.requests?.[household.id], world.marches?.[household.id]]) if (request?.status === 'open') count++;
  for (const offer of Object.values(world.offers || {})) if (offer.toHouseholdId === household.id && offer.status === 'open') count++;
  return count;
}

/** Every family, in words: who plays it and whether they are here is the server's to add (presence); the rest is the world's. */
// `guidedOf` is sim/lesson.mjs `lessonHostWords`, handed in by `projectWorld` rather than imported: this file importing
// the lesson closes a loop through sim/chores.mjs that leaves `CHORES` unread when the server starts.
export function familiesOverview(world, guidedOf = () => null) {
  return Object.values(world.households).map(household => ({
    id: household.id,
    name: householdName(world, household),
    ...(household.settlementId && { settlement: placeName(world, household.settlementId) }),
    // Kept small: thirty families go to the Host every tick (tests/host-view.test.mjs holds the payload's bound).
    ...(household.played && { played: true }),
    ...(household.absent && { absent: true }),
    waiting: waitingOn(world, household),
    // Whether the student pressed the X on the guided start, or took it back up (owner, 2026-09-22: "quietly show
    // dismissal/resumption to the teacher"): a line of words on the row, absent for every family that did neither.
    ...(guidedOf(household) && { guided: guidedOf(household) }),
    people: household.members.map(id => world.entities[id]).filter(person => person?.kind === 'person').map(person => ({
      name: person.name, role: person.kin?.role || (person.principal ? 'principal' : ''), where: whereWords(world, person, household),
    })),
  }));
}

/** What the Host's live page is sent, beside the map: never a student. */
export function hostLiveProjection(world, guidedOf) {
  return { families: familiesOverview(world, guidedOf), story: rumourStory(world), ...(spotlightProjection(world) && { spotlight: spotlightProjection(world) }) };
}
