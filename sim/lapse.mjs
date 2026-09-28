// A question nobody answered in time lapses (owner, 2026-09-27, verbatim: "questions that are not answered fast enough
// disappear."; `FIC-GONZ-633`).
//
// Until this, a question left unanswered past its time was answered for the family - auto took over at the record's share
// (`FIC-GONZ-048`, 2026-09-16), so a man in the Alamo could be offered as a courier, or a volunteer sent into Béxar, by
// nobody. Now, for a family a student is answering for, it simply closes: **nothing is chosen**, the person does nothing new,
// and the family's record says plainly that the question went unanswered and what that meant. What the question would have
// changed does not happen; what history does anyway (the fall of the Alamo, the army moving) still does.
//
// One rule, in every place a question has a time:
//   - the military questions under the real-time budget (sim/decision-budget.mjs) - Travis's runner, Bowie and Fannin's
//     division, the army's November and December questions, Houston's two camp questions - on the budget and on their dated
//     close alike;
//   - a question asked in the middle of a person's work (sim/chores.mjs `ASK_PATIENCE`, `lapsedChoice`): the shot is left, and
//     work already ordered goes on by the question's own fallback (paying in food, the family's own crop);
//   - the road's questions on the way east (sim/road.mjs `ROAD_PATIENCE_TICKS`).
//   - a played family's settlement call to turn out, after five real minutes (sim/decision-budget.mjs `CALL_BUDGET_MS`,
//     sim/calls.mjs `lapseCall`; owner 2026-09-27, `FIC-GONZ-636`): nobody turns out.
// Confirmed by the owner the same day, by multiple choice: "Yes, only students' lapse".
// A family nobody is answering for - nobody plays it, nobody is at its screen (sim/absence.mjs), or the person is on auto
// (sim/auto.mjs) - is decided as before, as its neighbours are: that is the director's and the switch's rule, and it never
// depended on the fallback.
import { record } from './events.mjs';

const GONE = ['dead', 'captured'];

/**
 * A family that answers its own questions by hand: not one whose student has gone (sim/absence.mjs), and not one nobody plays
 * in a class whose neighbours' director answers for such families (sim/neighbours.mjs) - the same families a question is
 * answered for at once when it is asked. A family nobody plays in a class with no director is "left as it was", and so its
 * questions lapse too.
 */
export const familyAnsweredFor = (world, household) => Boolean(household && !household.absent && (household.played || !world.neighbours));

/** Somebody whose question lapses when nobody answers it: of such a family, not on auto, alive and free. */
export function answeredFor(world, person) {
  const household = world.households?.[person?.householdId];
  return familyAnsweredFor(world, household) && !person.auto && !GONE.includes(person.health?.condition);
}

/** The line in the family's record: the question went unanswered, and what that meant. */
export function recordLapse(world, { householdId, actorId, text, causes = [] }) {
  return record(world, 'consequence', { householdId, actorId, importance: 2, classification: 'FICTIONAL FOR GAMEPLAY', claimId: 'FIC-GONZ-633', causes, lapsed: true, text });
}

/** What becomes of this person if nobody answers Travis's runner, said before it happens. */
export const courierIfUnanswered = person => `If nobody answers in time, the question lapses: nothing is chosen, and ${person.name} stays at their post.`;
