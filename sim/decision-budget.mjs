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
// - **On expiry, the documented fallback**, with a line in the family's journal saying the choice was made for them because
//   nobody answered in time: the courier question by `settleUnanswered` (sim/alamo.mjs, docs/ALAMO_FATES.md), the army's and
//   Houston's by auto's answer at the record's share - the owner's standing rule that auto takes over a choice not made.
//   Once decided, the question is closed and the class stops being slowed for it.
import { settleUnanswered } from './alamo.mjs';
import { decideDetachmentFor, decideQuestionFor } from './army.mjs';
import { decideCampQuestionFor } from './camp.mjs';

/** Real milliseconds an unanswered military question may stay open. A server option or `DECISION_BUDGET_MS` overrides it. */
export const DECISION_BUDGET_MS = 90_000;
/** The share of the budget after which the question is said to be pressing: the page warns, in words, what will happen. */
export const PRESSING_SHARE = 2 / 3;

const GONE = ['dead', 'captured'];
/** Somebody a student is actually answering for: a played, present family, not on auto, alive and free. */
function attended(world, person) {
  const household = world.households?.[person.householdId];
  return Boolean(household?.played && !household.absent && !person.auto && !GONE.includes(person.health?.condition));
}

/** Every military question open to somebody a student is answering for, each with what happens if nobody answers. */
export function openDecisions(world) {
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
  return open;
}

/**
 * Spend this tick's real milliseconds on every open question, and decide the ones whose budget is gone. Returns the keys
 * decided. A question answered or closed since the last tick is forgotten, so a new one opened later starts at nothing.
 */
export function spendDecisionBudget(world, realMs, { budgetMs = DECISION_BUDGET_MS, beginTravel } = {}) {
  const open = openDecisions(world);
  const keys = new Set(open.map(decision => decision.key));
  for (const key of Object.keys(world.decisionClock || {})) if (!keys.has(key)) delete world.decisionClock[key];
  const decided = [];
  if (Number.isFinite(realMs) && realMs > 0) {
    for (const decision of open) {
      world.decisionClock ??= {};
      const entry = world.decisionClock[decision.key] ??= { personId: decision.personId, spent: 0, of: budgetMs };
      entry.spent += realMs;
      entry.of = budgetMs;
      if (entry.spent < budgetMs) continue;
      decision.expire({ beginTravel });
      delete world.decisionClock[decision.key];
      decided.push(decision.key);
    }
  }
  if (world.decisionClock && !Object.keys(world.decisionClock).length) delete world.decisionClock;
  return decided;
}

/** Whether this person has a question open that has used most of its budget: the page says what will happen if unanswered. */
export const decisionPressing = (world, personId) => Object.values(world.decisionClock || {})
  .some(entry => entry.personId === personId && entry.spent >= entry.of * PRESSING_SHARE);

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
