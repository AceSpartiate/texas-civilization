import { record } from './events.mjs';
import { advanceRoutine } from './routines.mjs';
import { deliverReports } from './knowledge.mjs';
import { advanceEncounters } from './encounters.mjs';
import { advanceRelays, milesATick, progressTravel, validateWorld } from './world.mjs';
import { groundLeft } from './travel.mjs';
import { calendarMinutes } from './clock.mjs';
import { attendedMilitary, militaryDecision, militaryJourney } from './military-pacing.mjs';
import { liveBattles } from './battle-stage.mjs';

export function resolveTimeJump(world, requestedMinutes) {
  if (!Number.isInteger(requestedMinutes) || requestedMinutes < 0 || requestedMinutes > 60 * 24 * 60) throw new Error('Time jump must be whole minutes, at most 60 days.');
  if (world.status !== 'running') throw new Error('Time compression requires a running world.');
  const from = world.minute;
  // Skip quiet intervals, never a student's live military decision or journey.
  // These are derived from state, so reconnecting cannot bypass the guard.
  // ceiling: the jump refuses outright rather than running up to the start of the protected interval. Undo with the
  // selective quiet-time scheduler (docs/MILITARY_EXPERIENCE.md step 5), which knows where that interval begins.
  const decision = militaryDecision(world);
  const travelling = attendedMilitary(world).find(person => militaryJourney(world, person));
  if (decision || travelling) return { requestedMinutes, advancedMinutes: 0, blockedBy: `military:${decision || travelling.id}`, eventId: null };
  // A battle being fought is watched, never jumped over (docs/BATTLES.md §2.2): the jump refuses until it is over.
  const fight = liveBattles(world)[0];
  if (fight) return { requestedMinutes, advancedMinutes: 0, blockedBy: `battle:${fight.def.id}`, eventId: null };
  const limit = from + requestedMinutes;
  // A jump is made of ticks, and a tick may stand for more than twenty minutes of the calendar
  // on the real land (sim/clock.mjs). Somebody's arrival is still counted in the ticks their
  // travel actually takes; only the date those ticks land on moves with the phase.
  const step = calendarMinutes(world);
  const arrivals = Object.values(world.entities).filter(e => e.principal && e.travel && ['help', 'service'].includes(e.travel.purpose)).map(e => ({ id: `arrival:${e.id}`, minute: from + Math.max(0, Math.ceil(groundLeft(e.travel) / milesATick(world, e)) - 1) * step }));
  const barrier = [...world.barriers.filter(b => !b.resolved), ...arrivals].filter(b => b.minute >= from && b.minute <= limit).sort((a, b) => a.minute - b.minute || a.id.localeCompare(b.id))[0];
  // Somebody already standing with a rider is pending meaningful contact, and compressed
  // time may not run past a conversation that has not finished.
  const meeting = Object.values(world.encounters || {}).find(e => e.status === 'open');
  const target = meeting ? from : barrier ? barrier.minute : limit;
  let blockedBy = meeting ? `encounter:${meeting.id}` : barrier?.id || null;
  if (target === from) return { requestedMinutes, advancedMinutes: 0, blockedBy, eventId: null };
  const beforeFood = Object.fromEntries(Object.values(world.households).map(h => [h.id, h.resources.food]));
  // Advance in the same small units as live simulation so travel affects home labor: one
  // tick's worth of the calendar at a time, whatever that phase's tick is worth.
  let remaining = target - from;
  while (remaining > 0) {
    const minutes = Math.min(step, remaining);
    const ticks = minutes / step;
    world.minute += minutes;
    for (const entity of Object.values(world.entities)) progressTravel(world, entity, ticks);
    // Somebody a rider came by is met before the word changes hands at a fork, as in `stepWorld`.
    const passed = advanceEncounters(world);
    // Word keeps changing hands through compressed time. Without this a rider who reached
    // a fork during a jump would stand there holding it until the class ticked live again,
    // and the family at the far end of the chain would never be told at all.
    advanceRelays(world);
    advanceRoutine(world, minutes); deliverReports(world); remaining -= minutes;
    // A rider coming alongside a family is the moment the jump was skipping over, so the
    // jump stops there rather than carrying the class past a conversation it never saw.
    const met = [...passed, ...advanceEncounters(world)];
    if (met.length) { blockedBy = `encounter:${met[0].id}`; break; }
  }
  const elapsed = world.minute - from;
  const eventId = record(world, 'time-compression', { text: `${elapsed} minutes of routine life passed.`, fromMinute: from, toMinute: world.minute, blockedBy, entityCount: Object.keys(world.entities).length });
  for (const household of Object.values(world.households)) {
    record(world, 'routine-summary', { householdId: household.id, text: `Routine household life continued; food changed from ${beforeFood[household.id].toFixed(1)} to ${household.resources.food.toFixed(1)}. Absences and promises remain.`, causes: [eventId] });
  }
  validateWorld(world);
  return { requestedMinutes, advancedMinutes: elapsed, blockedBy, eventId };
}
