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
import { lapseSupply, supplyAskFor } from './supplies.mjs';
import { lapseMuster, musterAskFor } from './muster.mjs';
import { questionWaits, sendOnFrom } from './encounters.mjs';
import { actingId } from './acting.mjs';
import { STUDY_TICK_MS } from './crops.mjs';
import { starveLimitKey, starveOnLimit } from './hunger.mjs';

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
export function openDecisions(world, { heldFor, fightUp } = {}) {
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
  // from when the word reached them, not counted while that student is still in the guided start (`held`), nor while the call
  // waits behind the rider who brought the word (sim/encounters.mjs `questionWaits`, owner 2026-09-29, `FIC-GONZ-909`): its
  // five minutes start when it is shown, so a call that queued is never short of time for it.
  for (const [householdId, call] of Object.entries(world.calls || {})) {
    const household = world.households?.[householdId];
    if (call?.status !== 'open' || !household?.played || household.absent) continue;
    const personId = [household.mainId, household.principalId, ...(household.members || [])].find(id => world.entities[id]);
    if (!personId) continue;
    open.push({ key: `call:${householdId}`, personId, call: true, held: Boolean(heldFor?.(household)) || questionWaits(world, householdId, call), expire: () => { lapseCall(world, householdId); sendOnFrom(world, householdId); } });
  }
  // What the army before Béxar asks of a played family at its screen (sim/supplies.mjs, owner 2026-09-29, D5): on the call's own
  // clock and by its rules - five real minutes from when it is shown, none of them while it waits behind a rider.
  for (const householdId of Object.keys(world.supplies || {})) {
    const household = world.households?.[householdId], ask = supplyAskFor(world, householdId);
    if (!ask || !household?.played || household.absent) continue;
    const personId = [household.mainId, household.principalId, ...(household.members || [])].find(id => world.entities[id]);
    if (!personId) continue;
    // Nor while the family's own man's fight is on its page (owner, 2026-09-30, "Watch goes over it"): the fight's card goes up
    // over the request (public/military-attention.js), and a student watching it is not spending the request's minutes, so they
    // stand where they were until the card is down and the request is in front of them again.
    open.push({ key: `call:supply:${householdId}:${ask.askId}`, personId, call: true, held: Boolean(heldFor?.(household)) || questionWaits(world, householdId, ask) || Boolean(fightUp?.(household)), expire: () => { lapseSupply(world, householdId); sendOnFrom(world, householdId); } });
  }
  // The muster's question (sim/muster.mjs, owner 2026-10-06), on the call's clock: five real minutes from when it is shown, and then
  // every man not answered for joins the army - what most did, and what the class did before anybody was asked.
  for (const householdId of Object.keys(world.muster || {})) {
    const household = world.households?.[householdId], ask = musterAskFor(world, householdId);
    if (!ask || !household?.played || household.absent) continue;
    const personId = Object.keys(ask.asks).find(id => ask.asks[id] === 'open' && world.entities[id]) || household.principalId;
    open.push({ key: `call:muster:${householdId}`, personId, call: true, held: Boolean(heldFor?.(household)) || questionWaits(world, householdId, ask) || Boolean(fightUp?.(household)), expire: () => lapseMuster(world, householdId) });
  }
  return open;
}

/**
 * Spend this tick's real milliseconds on every open question, and decide the ones whose budget is gone. Returns the keys
 * decided. A question answered or closed since the last tick is forgotten, so a new one opened later starts at nothing.
 */
export function spendDecisionBudget(world, realMs, { budgetMs = DECISION_BUDGET_MS, callBudgetMs = CALL_BUDGET_MS, heldFor, fightUp, beginTravel, questionBudgets } = {}) {
  const open = openDecisions(world, { heldFor, fightUp });
  const limited = openLimits(world);
  const keys = new Set([...open, ...limited].map(decision => decision.key));
  for (const key of Object.keys(world.decisionClock || {})) if (!keys.has(key)) delete world.decisionClock[key];
  spendLimits(world, limited, realMs, questionBudgets);
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

// ------------------------------------------------------------------------------------------------ the real-time limits
//
// **Real-time limits** (owner, 2026-09-29, by multiple choice on the triage's C2: "A (recommended) real-time budgets: a rider
// 90 s, the order to leave 3 min, ¡Alto! about 30 s with the chase held, and road and hunt questions timed in real seconds";
// docs/audits/2026-09-29-triage.md 1.2 and 1.3, `FIC-GONZ-906`). Until this those questions waited a count of ticks or of
// calendar minutes: a rider 1,200 minutes stretched with the calendar (sixty ticks, 9.5 real minutes at Study), the order to
// leave a day of the calendar (72 ticks, 11.4 minutes, the calendar held at the farming scale all the while), the road's
// questions twelve ticks, ¡Alto! three ticks (3 seconds at Quick), and a question in the middle of work two hours of the calendar
// - one tick in the winter and the spring, where a tick is four or twelve hours, so every hunt run by hand was lost. Now each
// is counted in **real seconds, the same at every pace and in every phase**, on this module's clock:
//
// - Only for a question a **student is answering**: a played family at its screen, the one it would fall to not on auto. A
//   family nobody plays, one whose student has gone (sim/absence.mjs) or a person on auto is answered as before - at once, or
//   by the tick or calendar count the module keeps for it - because there is no reader to time.
// - **The same real milliseconds as the military questions** (`realTimeMeter`): suspended while the Host has paused, kept in
//   the save, and the first tick after Resume counts nothing. A tick stepped in process (the tests, the balance measure, a
//   headless world) says nothing of real time and **counts as one tick at the Study pace** (`STUDY_TICK_MS`), as a crop in the
//   ground does (sim/crops.mjs), so the simulation stays deterministic and a stepped class answers as a class at Study would.
// - **What happens when the time is out is unchanged**, and stays where it always was: the rider rides on (sim/encounters.mjs),
//   the family is packed off as auto packs it (sim/auto.mjs), the road's question and the hunt's lapse (sim/road.mjs,
//   sim/chores.mjs, sim/lapse.mjs), the order to halt lapses and the family is taken (sim/pursuit.mjs). This module only keeps
//   the time: each asks `limitOut` in its own place in the tick.
// - **The calendar hold stays bounded by them.** A rider, the order to leave and the road's questions hold the class's calendar
//   at the farming scale while a student decides (sim/clock.mjs `deciding`), and the chase is held at its step (sim/pursuit.mjs);
//   those holds now last at most these real seconds. A question in the middle of work holds nothing but the one person.
// - The page counts each down on its "!" from the real time left (`limitLeft`, projected as `leftMs`).

/** Real milliseconds each question on a real-time limit waits for its student. A server option (`questionBudgets`) overrides any of them. */
export const QUESTION_BUDGETS = Object.freeze({ rider: 90_000, flight: 180_000, alto: 30_000, road: 90_000, work: 90_000, grave: 60_000, starve: 60_000, sighting: 15_000, aim: 30_000 });
/**
 * **A sighting on the hunt** (owner, 2026-10-02: "when they see an animal the player should see an alert. if players click on it
 * in time, then a first person mini game starts"; sim/hunt-aim.mjs, `FIC-GONZ-1080`): the hunt's shot question, for a student at
 * the screen, waits `sighting` - fifteen real seconds, an animal standing downwind does not stand all afternoon - and then the
 * hunter takes the shot himself (sim/chores.mjs `lapsedChoice`). Taken up, the field is open `aim` - the longest run across it,
 * with room - and an animal never fired at is gone. Both on this clock, held while the Host pauses. Only the one person waits.
 */
export const workKind = ask => (ask?.id === 'shot' ? (ask.aim ? 'aim' : 'sighting') : 'work');
/**
 * The real time a question waiting behind a rider must still have in front of the student once he has gone, before the calendar
 * closes it (owner, 2026-09-29, "Rider leaves at dawn"; sim/encounters.mjs `riderMustGo`): the ninety seconds every other
 * question on the real clock is given.
 */
export const QUEUED_QUESTION_MS = 90_000;

/** The person answering for a family now (sim/acting.mjs), or its main person, or the first of it still in the world. */
function answererOf(world, household) {
  const id = [actingId(world, household), household.mainId, household.principalId, ...(household.members || [])].find(one => one && world.entities[one]);
  return id ? world.entities[id] : null;
}
/** A played family with its student at the screen. */
const watched = household => Boolean(household?.played && !household.absent);
/** A rider's wait is on the real clock: he has stopped with a played family whose student is there (not Travis's runner). */
export function riderOnLimit(world, encounter) {
  return Boolean(encounter?.status === 'open' && !encounter.kind && watched(world.households?.[encounter.householdId]));
}
/** The order to leave is on the real clock: a played family at its screen, told to go, not burned out or taken in, its answerer by hand. */
export function flightOnLimit(world, household) {
  const flight = household?.flight;
  if (!watched(household) || flight?.status !== 'ordered' || flight.burned || household.takenIn) return false;
  const answerer = answererOf(world, household);
  return Boolean(answerer && !answerer.auto);
}
/** The road's open question (the bog, the army close behind, ¡Alto!) is on the real clock: a played family at its screen, answered by hand. */
export function roadOnLimit(world, household) {
  if (!household?.flight?.ask || !watched(household)) return false;
  const answerer = world.entities[actingId(world, household)];
  return Boolean(answerer && answeredFor(world, answerer));
}
/** A question in the middle of this person's work is on the real clock: a played family at its screen, the person by hand. */
export function workOnLimit(world, entity) {
  return Boolean(entity?.chore?.ask && world.households?.[entity.householdId]?.played && answeredFor(world, entity));
}
/**
 * The keys of the clock. A rider's names the questions put to him so far, so **every question asked starts his ninety seconds
 * again** (the rule the calendar count always kept); the others name when they were opened, so a new one starts at nothing.
 */
export const riderLimitKey = encounter => `rider:${encounter.id}:${encounter.asked?.length || 0}`;
export const flightLimitKey = household => `flight:${household.id}`;
export const roadLimitKey = (household, ask) => `${ask.id === 'alto' ? 'alto' : 'road'}:${household.id}:${ask.openedTick}`;
// The aim is its own key, so the field's seconds start at nothing when the sighting is taken up.
export const workLimitKey = (entity, ask) => `${ask.aim ? 'aim' : 'work'}:${entity.id}:${ask.openedMinute}`;
/** One very sick spell of one person: forgotten when they are past the worst or dead, so a second spell starts at nothing. */
export const graveLimitKey = entity => `grave:${entity.id}`;

/**
 * **A minute to nurse the very sick** (owner, 2026-09-29, by multiple choice on the triage's C4: "60 s minimum"; triage 2.1,
 * the design audit's S21; `FIC-GONZ-960`). In the second and third periods a day of the calendar passes in ten or twenty real
 * seconds, so a child announced very sick could die before the student had found the "!". Now somebody very sick in a played
 * family at its screen cannot die of it until **sixty real seconds** (`QUESTION_BUDGETS.grave`) have passed since they were
 * said to be very sick, on this module's clock - suspended while the Host has paused, kept in the save, a tick stepped in process
 * counting one at the Study pace - and the "!" and the story card count the time down (`leftMs`). While it runs, their very sick
 * days wait with it (sim/disease.mjs `sicknessDay`), so the minute is added in front of the days the record's rates give, not
 * taken out of them; nursing still brings them past the worst at once. Nothing is held for anybody else: a family nobody plays,
 * or whose student has gone, has no reader to give a minute to, and its sick go by the calendar as before. The calendar itself
 * is not held (the owner's option B, not chosen). In the first period nobody dies of a sickness at all (`deathsAllowed`), and
 * nothing is counted.
 */
export function graveOnLimit(world, entity) {
  if (entity?.kind !== 'person' || entity.health?.condition !== 'sick' || !entity.health.grave) return false;
  if ((world.period || 1) < 2) return false; // sim/disease.mjs `deathsAllowed`: nobody dies of a sickness in the first period.
  return watched(world.households?.[entity.householdId]);
}
/** Whether this very sick person's minute is still running: they cannot die of it yet. */
export const graveHeld = (world, entity) => graveOnLimit(world, entity) && !limitOut(world, graveLimitKey(entity));

/** Every question on a real-time limit open now, each with its key, its kind and who it is put to. */
export function openLimits(world) {
  const open = [];
  for (const encounter of Object.values(world.encounters || {})) {
    if (riderOnLimit(world, encounter) && world.entities[encounter.listenerId]) open.push({ key: riderLimitKey(encounter), kind: 'rider', personId: encounter.listenerId });
  }
  for (const household of Object.values(world.households || {})) {
    if (flightOnLimit(world, household)) open.push({ key: flightLimitKey(household), kind: 'flight', personId: answererOf(world, household).id });
    if (roadOnLimit(world, household)) open.push({ key: roadLimitKey(household, household.flight.ask), kind: household.flight.ask.id === 'alto' ? 'alto' : 'road', personId: actingId(world, household) });
  }
  for (const entity of Object.values(world.entities || {})) {
    if (workOnLimit(world, entity)) open.push({ key: workLimitKey(entity, entity.chore.ask), kind: workKind(entity.chore.ask), personId: entity.id });
    if (graveOnLimit(world, entity)) open.push({ key: graveLimitKey(entity), kind: 'grave', personId: entity.id });
    // Starving (owner, 2026-09-30; sim/hunger.mjs `starveHeld`, `FIC-GONZ-997`): the same minute, before hunger may kill them.
    if (starveOnLimit(world, entity)) open.push({ key: starveLimitKey(entity), kind: 'starve', personId: entity.id });
  }
  return open;
}
/** The budget of a kind of question: the server's override, or the owner's number. */
const budgetOf = (kind, questionBudgets) => questionBudgets?.[kind] ?? QUESTION_BUDGETS[kind];

/** Spend this tick's real time - or a Study tick, stepped in process - on every question on a real-time limit. */
function spendLimits(world, limited, realMs, questionBudgets) {
  const ms = Number.isFinite(realMs) ? Math.max(0, realMs) : STUDY_TICK_MS;
  for (const question of limited) {
    const of = budgetOf(question.kind, questionBudgets);
    world.decisionClock ??= {};
    const entry = world.decisionClock[question.key] ??= { personId: question.personId, spent: 0, of, limit: question.kind };
    entry.spent += ms;
    entry.of = of;
    // The pace of the last measured tick, for a countdown that has to turn ticks into real time (sim/auto.mjs `flightLeftMs`).
    if (ms > 0) entry.tickMs = ms;
  }
}
/** Whether the question under this key has had its real time. Kept until the question closes, so its own module acts on it. */
export function limitOut(world, key) {
  const entry = world.decisionClock?.[key];
  return Boolean(entry && entry.spent >= entry.of);
}
/**
 * The real milliseconds this question has left, for the countdown on the "!": what is left of its budget, or the whole budget
 * before its first tick has been counted. The server's clock is what closes it; the page only counts down from what it heard.
 */
export function limitLeft(world, key, kind) {
  const entry = world.decisionClock?.[key];
  return entry ? Math.max(0, Math.round(entry.of - entry.spent)) : QUESTION_BUDGETS[kind];
}

/** Whether this person has a question open that has used most of its budget: the page says what will happen if unanswered. */
export const decisionPressing = (world, personId) => Object.entries(world.decisionClock || {})
  .some(([key, entry]) => !key.startsWith('call:') && !entry.limit && entry.personId === personId && entry.spent >= entry.of * PRESSING_SHARE);
/**
 * The real milliseconds left before this person's soonest open question lapses, or null when none has started to spend
 * (docs/audits/2026-09-28-design.md S33: "a visible countdown on every timed question"). The page counts it down from the
 * moment it hears it; the server's own clock is what lapses the question, so a slow count on the page decides nothing.
 */
export function decisionLeft(world, personId) {
  let left = null;
  for (const [key, entry] of Object.entries(world.decisionClock || {})) {
    if (key.startsWith('call:') || entry.limit || entry.personId !== personId) continue;
    const now = Math.max(0, Math.round(entry.of - entry.spent));
    left = left === null ? now : Math.min(left, now);
  }
  return left;
}
/** The real milliseconds left of this family's settlement call, or null while its minutes have not begun to run. */
export function callLeft(world, householdId) {
  const entry = world.decisionClock?.[`call:${householdId}`];
  return entry ? Math.max(0, Math.round(entry.of - entry.spent)) : null;
}
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
