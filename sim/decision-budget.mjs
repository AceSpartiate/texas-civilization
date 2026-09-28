// A real-time budget for an unanswered military decision (owner, 2026-09-22: "Give unanswered decisions a configurable
// 90-second real-time budget, suspended during Host pause, with a documented fallback"; docs/MILITARY_EXPERIENCE.md step 4;
// `FIC-GONZ-385`).
//
// While a played, present person not on auto has a military question open - Travis's runner waiting on them in the Alamo,
// Bowie and Fannin's division, the army's questions before Béxar, Houston's camp - every tick slows to reading pace for the
// whole class (sim/military-pacing.mjs). Before this, one student leaving a question unanswered held the class there until
// the question's own dated deadline. Now each open question also has real seconds to be answered in:
//
// - **Real time, not the world's clock.** The server measures the real milliseconds between the ticks it runs and hands them
//   to `stepWorld` (`realTimeMeter`, server/app.mjs). A tick run by a test or a time jump carries none, so nothing here
//   changes a class stepped in process unless it asks.
// - **Suspended while the Host has paused the class.** A paused class runs no ticks, and the meter forgets where it was, so
//   the paused minutes are never counted: the first tick after Resume carries none.
// - **Kept in the save** (`world.decisionClock`), so reloading or reconnecting does not start a question's budget again.
//   Absent on every class saved before this, which correctly reads as nothing spent.
// - **On expiry the question lapses** (owner, 2026-09-27: "questions that are not answered fast enough disappear";
//   sim/lapse.mjs, `FIC-GONZ-633`). Nothing is chosen for the family - the man in the Alamo stays at his post, the volunteer
//   is not sent in, the man with Houston does not leave - and the family's journal says plainly that nobody answered and what
//   that meant: the courier question by `settleUnanswered` (sim/alamo.mjs), Bowie and Fannin's division by
//   `decideDetachmentFor`, the army's by `decideQuestionFor` (sim/army.mjs), Houston's by `decideCampQuestionFor`
//   (sim/camp.mjs). Until 2026-09-27 auto answered at the record's share (`FIC-GONZ-048`). Once lapsed, the question is
//   closed and the class stops being slowed for it.
import { settleUnanswered } from './alamo.mjs';
import { decideDetachmentFor, decideQuestionFor } from './army.mjs';
import { decideCampQuestionFor } from './camp.mjs';
import { answeredFor } from './lapse.mjs';
import { lapseCall } from './calls.mjs';
import { sendOnFrom } from './encounters.mjs';

/** Real milliseconds an unanswered military question may stay open. A server option or `DECISION_BUDGET_MS` overrides it. */
export const DECISION_BUDGET_MS = 90_000;
/**
 * Real milliseconds a settlement's call to turn out stays open to a played family (owner, 2026-09-27, by multiple choice:
 * "Lapse after a while", with the option's own example of five minutes after the rider arrives; `FIC-GONZ-636`). Counted
 * from when the call is put to the family - for a far family that is the moment the rider's word reaches it - on the same
 * clock as the military questions: suspended while the Host has paused the class, kept in the save, and **not counted while
 * that family's student is still in the guided start** (`heldFor`, which sim/world.mjs answers with sim/lesson.mjs `inLesson`: on a step, not finished and not
 * closed with the X), so nobody is shut out of the war while learning to farm. A server option (`callBudgetMs`) or
 * `CALL_BUDGET_MS` in the environment overrides it. On lapse nothing is chosen (sim/calls.mjs `lapseCall`).
 */
export const CALL_BUDGET_MS = 5 * 60_000;
/** The share of the budget after which the question is said to be pressing: the page warns, in words, what will happen. */
export const PRESSING_SHARE = 2 / 3;

/** Somebody a student is actually answering for: a played, present family, not on auto, alive and free (sim/lapse.mjs). */
const attended = (world, person) => Boolean(world.households?.[person.householdId]?.played) && answeredFor(world, person);

/** Every military question open to somebody a student is answering for, each with what happens if nobody answers. */
export function openDecisions(world, { heldFor } = {}) {
  const open = [];
  const army = world.army;
  for (const person of Object.values(world.entities || {})) {
    if (!person.householdId || !attended(world, person)) continue;
    const service = person.service;
    if (service?.courier === 'open') open.push({ key: `courier:${person.id}`, personId: person.id, expire: () => settleUnanswered(world, person, 'budget') });
    if (service?.kind === 'houston') for (const question of ['leave', 'road']) {
      if (service[question] === 'open') open.push({ key: `camp:${question}:${person.id}`, personId: person.id, expire: context => decideCampQuestionFor(world, question, person, context) });
    }
    if (army?.detachment && !army.detachment.closed && army.detachment.asks?.[person.id] === 'open') open.push({ key: `detachment:${person.id}`, personId: person.id, expire: () => decideDetachmentFor(world, person.id) });
    for (const [key, question] of Object.entries(army?.questions || {})) {
      if (!question.closed && question.asks?.[person.id] === 'open') open.push({ key: `army:${key}:${person.id}`, personId: person.id, expire: context => decideQuestionFor(world, key, person.id, context) });
    }
  }
  // A settlement's call to turn out (sim/calls.mjs), put to a played family whose student is at the screen: `CALL_BUDGET_MS`
  // from when the word reached them, not counted while that student is still in the guided start (`held`).
  for (const [householdId, call] of Object.entries(world.calls || {})) {
    const household = world.households?.[householdId];
    if (call?.status !== 'open' || !household?.played || household.absent) continue;
    const personId = [household.mainId, household.principalId, ...(household.members || [])].find(id => world.entities[id]);
    if (!personId) continue;
    open.push({ key: `call:${householdId}`, personId, call: true, held: Boolean(heldFor?.(household)), expire: () => { lapseCall(world, householdId); sendOnFrom(world, householdId); } });
  }
  return open;
}

/**
 * Spend this tick's real milliseconds on every open question, and decide the ones whose budget is gone. Returns the keys
 * decided. A question answered or closed since the last tick is forgotten, so a new one opened later starts at nothing.
 */
export function spendDecisionBudget(world, realMs, { budgetMs = DECISION_BUDGET_MS, callBudgetMs = CALL_BUDGET_MS, heldFor, beginTravel } = {}) {
  const open = openDecisions(world, { heldFor });
  const keys = new Set(open.map(decision => decision.key));
  for (const key of Object.keys(world.decisionClock || {})) if (!keys.has(key)) delete world.decisionClock[key];
  const decided = [];
  if (Number.isFinite(realMs) && realMs > 0) {
    for (const decision of open) {
      // A family whose student is still being walked through the guided start: the call waits, and none of its time goes.
      if (decision.held) continue;
      const of = decision.call ? (callBudgetMs ?? CALL_BUDGET_MS) : (budgetMs ?? DECISION_BUDGET_MS);
      world.decisionClock ??= {};
      const entry = world.decisionClock[decision.key] ??= { personId: decision.personId, spent: 0, of };
      entry.spent += realMs;
      entry.of = of;
      if (entry.spent < of) continue;
      decision.expire({ beginTravel });
      delete world.decisionClock[decision.key];
      decided.push(decision.key);
    }
  }
  if (world.decisionClock && !Object.keys(world.decisionClock).length) delete world.decisionClock;
  return decided;
}

/** Whether this person has a question open that has used most of its budget: the page says what will happen if unanswered. */
export const decisionPressing = (world, personId) => Object.entries(world.decisionClock || {})
  .some(([key, entry]) => !key.startsWith('call:') && entry.personId === personId && entry.spent >= entry.of * PRESSING_SHARE);
/** Whether this family's settlement call has used most of its five minutes: its card says the call will lapse. */
export const callPressing = (world, householdId) => {
  const entry = world.decisionClock?.[`call:${householdId}`];
  return Boolean(entry && entry.spent >= entry.of * PRESSING_SHARE);
};

/**
 * The real milliseconds between the ticks a server runs, for `spendDecisionBudget`. `lap(false)` on a tick that does not run -
 * the Host has paused, a fault paused it, the lobby, a family still being made - forgets the last time, so the time the
 * class stood still is never counted. A gap longer than `maxGapMs` (a stalled process) counts as that much and no more.
 */
export function realTimeMeter({ now = Date.now } = {}) {
  let last = null;
  return {
    lap(running, maxGapMs = 30_000) {
      if (!running) { last = null; return 0; }
      const at = now();
      const elapsed = last === null ? 0 : Math.max(0, Math.min(at - last, maxGapMs));
      last = at;
      return elapsed;
    },
  };
}

/** A saved clock that cannot be, or null. */
export function decisionClockInvalid(world) {
  if (world.decisionClock === undefined) return null;
  if (!world.decisionClock || typeof world.decisionClock !== 'object') return 'Invalid decision clock';
  for (const entry of Object.values(world.decisionClock)) {
    if (!world.entities[entry?.personId] || !Number.isFinite(entry.spent) || entry.spent < 0 || !Number.isFinite(entry.of) || entry.of <= 0) return 'Invalid decision clock';
  }
  return null;
}
