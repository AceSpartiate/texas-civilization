/**
 * Glory: how far a family took part in what happened. Step 3 of docs/MONEY_AND_GLORY.md.
 *
 * **Written here and read nowhere else in the simulation.** The owner's direction is that
 * glory is hidden until the end of the game, and the constitution's amendment adds that no
 * director may read it to decide what to offer a family (VISION.md §11). So this module
 * only ever adds to it, and `tests/glory.test.mjs` proves both halves: a planted value
 * reaches no student or Host payload, and a class with glory and the same class without it
 * play out identically.
 *
 * It lives at `world.glory`, not on the household. A household is projected to its own
 * student whole, so anything stored on it is on that student's wire; the spec's
 * `household.glory` would have leaked on the first tick.
 *
 * Every weight and rule below is invented and registered as `FIC-GONZ-023`. What earns
 * glory is only a part in an event registered as documented history - at Gonzales,
 * `HIST-GONZ-004` - and the part is read from `world.participation`, which the directors
 * write from what the world actually did.
 *
 * ceiling: the save file holds glory in plain JSON beside everything else, so anybody who
 * opens a class's save can read it. Hiding it from a teacher's text editor is not what the
 * owner asked for; hiding it from every screen in the class is.
 */
import { record } from './events.mjs';
import { findPath } from './geography.mjs';

/**
 * What each part is worth: every kind of taking part counts, and fighting counts most. The
 * owner's decision, 2026-09-12. At Gonzales nobody from a household fought - the call was to
 * come with the supplies - so only the first two can be earned there.
 */
// `willing` is a volunteer who said they would go in when Austin ordered Béxar stormed on November 21, which never came
// (owner, 2026-09-16, docs/COLONIES.md §7b). What it is worth is this game's own: the weight of being present.
// `enlisted` is somebody who signed on for land in the winter of 1836 and `voted` a man who voted on February 1 (owner,
// 2026-09-16, docs/COLONIES.md §7e, sim/winter.mjs): enlisting is worth being present; voting, a little.
export const GLORY_WEIGHT = Object.freeze({ supplied: 1, present: 2, fought: 3, willing: 2, enlisted: 2, voted: 1 });
/** Every fifteen road miles a family lived from where it happened multiplies the part once more. */
export const GLORY_MILES_STEP = 15;

/** How many times over a part counts for a family this far from where it happened. */
export const distanceMultiplier = miles => 1 + Math.floor(Math.max(0, miles) / GLORY_MILES_STEP);

/**
 * One award, once per person per event.
 *
 * Recorded in the family's own event log as a sealed event - never projected while the class
 * runs - with the cause that earned it, because the reveal at the end has to be able to say
 * *why*. A casualty earns nothing extra: the award is for the part somebody took, and nothing
 * here reads their health.
 */
export function awardGlory(world, { event, claimId, personId, householdId, role, fromSiteId, causes = [], adjust = null, note = null }) {
  const weight = GLORY_WEIGHT[role];
  const household = world.households[householdId];
  if (!weight || !household || !world.entities[personId]) return 0;
  if (!world.glory) world.glory = {};
  const ledger = world.glory[householdId] ??= { total: 0, awards: {} };
  const key = `${event}:${personId}`;
  if (ledger.awards[key]) return 0;
  const miles = findPath(world.map, fromSiteId, household.homeSiteId)?.distance ?? 0;
  // `adjust` is the one rule that changes what a part is worth after the fact: a woman sent to fight who does not come
  // through (docs/MONEY_AND_GLORY.md §4, owner 2026-09-14), whose award is taken away twice over. It never adds.
  const earned = weight * distanceMultiplier(miles);
  const points = adjust ? Math.min(earned, Math.round(adjust(earned))) : earned;
  const eventId = record(world, 'glory', {
    householdId, actorId: personId, visibility: 'sealed', importance: 1,
    classification: 'FICTIONAL FOR GAMEPLAY', claimId: 'FIC-GONZ-023', causes,
    text: `${world.entities[personId].name}: ${role} at ${event} (${claimId}), ${Math.round(miles)} road miles from home - ${points}.`,
  });
  ledger.awards[key] = { event, claimId, personId, role, miles: Math.round(miles * 10) / 10, points, minute: world.minute, eventId, ...(note && { note }) };
  ledger.total += points;
  return points;
}

/** Everything the participation record for an event is worth, awarded once. */
export function awardParticipation(world, event, { claimId, fromSiteId, causes = [] }) {
  for (const [personId, part] of Object.entries(world.participation?.[event] || {})) {
    awardGlory(world, { event, claimId, personId, householdId: part.householdId, role: part.role, fromSiteId, causes });
  }
}
