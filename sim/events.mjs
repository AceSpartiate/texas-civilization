export function record(world, type, data = {}) {
  const event = { id: `ev-${world.nextEventId++}`, tick: world.tick, minute: world.minute, type, importance: 1, causes: [], visibility: 'private', classification: 'FICTIONAL FOR GAMEPLAY', claimId: null, ...data };
  world.events.push(event); return event.id;
}
