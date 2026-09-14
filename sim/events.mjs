export function record(world, type, data = {}) {
  // A field given as undefined (`actorId: rumor.actorId` for a rumor nobody carried) is left out rather than stored, as a save
  // leaves it out: otherwise the class reloaded from its save was not the class that was saved (found by the slice proof, 2026-09-14).
  const given = Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined));
  const event = { id: `ev-${world.nextEventId++}`, tick: world.tick, minute: world.minute, type, importance: 1, causes: [], visibility: 'private', classification: 'FICTIONAL FOR GAMEPLAY', claimId: null, ...given };
  world.events.push(event); return event.id;
}
