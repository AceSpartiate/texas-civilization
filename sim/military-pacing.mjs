// Fictional presentation pacing, not changed historical dates or marching speeds.
// See docs/MILITARY_EXPERIENCE.md, FIC-GONZ-320 and -321. Derive from canonical state; nothing new to migrate.
// ceiling: two fixed caps for the whole class, not the look-ahead scheduler MILITARY_EXPERIENCE.md asks for. One
// family's open question slows every household sharing the tick. Since 2026-09-22 an unanswered question holds the class
// at 20 minutes a tick only until its real-time budget runs out (sim/decision-budget.mjs: 90 seconds by default, not
// counted while the Host has paused) and its documented fallback decides it, or until the director's dated deadline if
// that comes first. Undo when the selective quiet-time scheduler (step 5 of that document) computes the next protected
// boundary across households.
export const MILITARY_TRAVEL_MINUTES = 120;
export const MILITARY_DECISION_MINUTES = 20;

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

export function militaryMinutes(world, proposed) {
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
