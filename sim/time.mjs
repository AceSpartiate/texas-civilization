import { record } from './events.mjs';
import { advanceRoutine } from './routines.mjs';
import { deliverReports } from './knowledge.mjs';
import { advanceEncounters } from './encounters.mjs';
import { advanceRelays, progressTravel, validateWorld } from './world.mjs';
import { groundLeft } from './travel.mjs';

export function resolveTimeJump(world, requestedMinutes) {
  if (!Number.isInteger(requestedMinutes) || requestedMinutes < 0 || requestedMinutes > 60 * 24 * 60) throw new Error('Time jump must be whole minutes, at most 60 days.');
  if (world.status !== 'running') throw new Error('Time compression requires a running world.');
  const from = world.minute;
  const limit = from + requestedMinutes;
  const arrivals = Object.values(world.entities).filter(e => e.principal && e.travel && ['help', 'service'].includes(e.travel.purpose)).map(e => ({ id: `arrival:${e.id}`, minute: from + Math.max(0, Math.ceil(groundLeft(e.travel) / e.travel.speed) - 1) * 20 }));
  const barrier = [...world.barriers.filter(b => !b.resolved), ...arrivals].filter(b => b.minute >= from && b.minute <= limit).sort((a, b) => a.minute - b.minute || a.id.localeCompare(b.id))[0];
  // Somebody already standing with a rider is pending meaningful contact, and compressed
  // time may not run past a conversation that has not finished.
  const meeting = Object.values(world.encounters || {}).find(e => e.status === 'open');
  const target = meeting ? from : barrier ? barrier.minute : limit;
  let blockedBy = meeting ? `encounter:${meeting.id}` : barrier?.id || null;
  if (target === from) return { requestedMinutes, advancedMinutes: 0, blockedBy, eventId: null };
  const beforeFood = Object.fromEntries(Object.values(world.households).map(h => [h.id, h.resources.food]));
  // Advance in the same small units as live simulation so travel affects home labor.
  let remaining = target - from;
  while (remaining > 0) {
    const minutes = Math.min(20, remaining);
    world.minute += minutes;
    for (const entity of Object.values(world.entities)) progressTravel(world, entity, minutes / 20);
    // Word keeps changing hands through compressed time. Without this a rider who reached
    // a fork during a jump would stand there holding it until the class ticked live again,
    // and the family at the far end of the chain would never be told at all.
    advanceRelays(world);
    advanceRoutine(world, minutes); deliverReports(world); remaining -= minutes;
    // A rider coming alongside a family is the moment the jump was skipping over, so the
    // jump stops there rather than carrying the class past a conversation it never saw.
    const met = advanceEncounters(world);
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
