// Fictional presentation pacing, not changed historical dates or marching speeds.
// See docs/MILITARY_EXPERIENCE.md, FIC-GONZ-320 and -321. Derive from canonical state; nothing new to migrate.
// ceiling: two fixed caps for the whole class, not the look-ahead scheduler MILITARY_EXPERIENCE.md asks for. One
// family's open question slows every household sharing the tick. Since 2026-09-22 an unanswered question holds the class
// at 20 minutes a tick only until its real-time budget runs out (sim/decision-budget.mjs: 90 seconds by default, not
// counted while the Host has paused) and its documented fallback decides it, or until the director's dated deadline if
// that comes first. Undo when the selective quiet-time scheduler (step 5 of that document) computes the next protected
// boundary across households.
import { battleStep } from './battle-stage.mjs';
import { columnsNow, foragersOf } from './advance.mjs';
export const MILITARY_TRAVEL_MINUTES = 120;
export const MILITARY_DECISION_MINUTES = 20;

/**
 * While a battle's watched phases run, the whole class's clock is held to the phase's step (docs/BATTLES.md §2.2,
 * `FIC-GONZ-445`): the fighting plays for three to six real minutes at the Study pace, proportionally less at Brisk and
 * Quick, and every family shares the one clock. Only ever the smaller of the two, so a battle never runs the clock faster
 * than it was going. Nothing stored: `battleStep` reads the engagement's own schedule off the minute.
 */
export function battleMinutes(world, proposed) {
  const step = battleStep(world);
  return step === null ? proposed : Math.min(proposed, step);
}

export function attendedMilitary(world) {
  return Object.values(world.entities || {}).filter(person => {
    const household = world.households?.[person.householdId];
    return household?.played && !household.absent && !person.auto
      && !['dead', 'captured'].includes(person.health?.condition)
      && (person.service?.status === 'serving' || world.army?.members?.includes(person.id)
        || (['home', 'return', 'march'].includes(person.travel?.purpose)
          && (person.service || person.commitments?.some(promise => promise.id === 'volunteer')))
        || person.travel?.purpose === 'service');
  });
}

export function militaryDecision(world) {
  for (const person of attendedMilitary(world)) {
    if (['courier', 'leave', 'road'].some(key => person.service?.[key] === 'open')) return person.id;
    // Travis's runner still crossing the plaza to them (sim/alamo-runner.mjs): the question is on its way, and a half-day
    // tick must not carry the class past it before he arrives.
    if (person.service?.courier === 'coming') return person.id;
    if (world.army?.detachment?.asks?.[person.id] === 'open' && !world.army.detachment.closed) return person.id;
    if (Object.values(world.army?.questions || {}).some(question => !question.closed && question.asks?.[person.id] === 'open')) return person.id;
  }
  return null;
}

export function militaryJourney(world, person) {
  if (world.army?.members?.includes(person.id)) return world.army.phase === 'marching' && !world.army.camp;
  return Boolean(person.travel && !person.travel.halted && !(person.travel.waitUntil > world.minute));
}

/**
 * Whether a played family at its screen has somebody within `COLUMN_WATCH_MILES` of a Mexican column **on the march** or its
 * foragers (sim/advance.mjs): then the march is in front of them and is watched at the travel scale, as a journey is
 * (`FIC-GONZ-467`). A column in camp holds nothing - Sesma's week opposite Beeson's, Filisola's at Old Fort - and neither does a
 * man serving with an army, whose camp keeps its own clock. Everywhere else the columns are background and hold nothing.
 * Measured with scripts/battle-class-time.mjs (`columnsWatched`) before this narrowing: every family at its screen, a column
 * held the class 18 to 29 minutes at Study; see docs/evidence/advance-class-time.json for after. ceiling: one family near a column slows the whole class, as
 * any held clock here does, until the look-ahead scheduler of docs/MILITARY_EXPERIENCE.md exists.
 */
export const COLUMN_WATCH_MILES = 6;
export function columnWatched(world) {
  if (world.period !== 3 || !world.map?.source) return false;
  const heads = columnsNow(world).filter(({ head }) => !head.retreat && head.moving);
  if (!heads.length) return false;
  const points = heads.flatMap(({ column, head }) => [head, ...foragersOf(world, column, head)]);
  return Object.values(world.entities || {}).some(person => {
    const household = world.households?.[person.householdId];
    return person.kind === 'person' && household?.played && !household.absent && !person.auto && person.location
      && person.service?.status !== 'serving' && !['dead', 'captured'].includes(person.health?.condition)
      && points.some(point => Math.hypot(point.x - person.location.x, point.y - person.location.y) <= COLUMN_WATCH_MILES);
  });
}

export function militaryMinutes(world, proposed) {
  proposed = battleMinutes(world, proposed);
  if (proposed > MILITARY_TRAVEL_MINUTES && columnWatched(world)) proposed = MILITARY_TRAVEL_MINUTES;
  const people = attendedMilitary(world);
  if (!people.length) return proposed;
  let minutes = militaryDecision(world) ? Math.min(proposed, MILITARY_DECISION_MINUTES) : proposed;
  if (people.some(person => militaryJourney(world, person))) {
    minutes = Math.min(minutes, MILITARY_TRAVEL_MINUTES);
  }
  // The existing director owns dates. Landing on a boundary prevents an opening and
  // its deadline from both running unseen inside one twelve-hour campaign update.
  for (const barrier of world.barriers || []) {
    if (!barrier.resolved && barrier.kind === 'historical-scene' && barrier.minute > world.minute) {
      minutes = Math.min(minutes, barrier.minute - world.minute);
    }
  }
  return minutes;
}
