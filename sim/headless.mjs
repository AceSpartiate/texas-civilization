import { createGonzalesWorld } from './gonzales.mjs';
import { applyAction, stepWorld, validateWorld } from './world.mjs';

export function extractMetrics(world) {
  return {
    seed: world.seed, ticks: world.tick, minute: world.minute, complete: Boolean(world.director?.complete),
    eventCount: world.events.length, historicalOutcome: world.truth['gonzales-outcome']?.text || null,
    households: Object.values(world.households).map(household => {
      const people = household.members.map(id => world.entities[id]);
      const events = world.events.filter(e => e.householdId === household.id);
      const choices = events.filter(e => e.type === 'choice');
      return {
        householdId: household.id, survival: people.filter(e => e.health.condition !== 'dead').length,
        health: people.map(e => ({ id: e.id, condition: e.health.condition })), food: household.resources.food,
        transportation: household.property.filter(id => world.entities[id].kind === 'wagon' && world.entities[id].condition !== 'lost').length,
        familySeparation: people.filter(e => e.location.siteId !== household.homeSiteId).length,
        propertyLoss: household.property.filter(id => world.entities[id].condition === 'lost').length,
        evacuationState: 'not-modeled', meaningfulDecisions: choices.length,
        ticksSinceDecision: world.tick - (choices.at(-1)?.tick || 0),
        repeatedRequestCount: Math.max(0, events.filter(e => e.type === 'pressure').length - 1),
        persistentConsequences: events.filter(e => e.type === 'consequence').length,
        inheritedConsequences: null, memories: household.memories.length,
      };
    }),
  };
}
// Private developer harness: no bots or omniscient inspection endpoints on the classroom server.
export function runScenario({ seed = 'gonzales-1835', playerCount = 5, strategy = 'mixed', maxTicks = 1000 } = {}) {
  if (!['mixed', 'help', 'stay', 'idle'].includes(strategy)) throw new Error('Unknown bot strategy');
  const world = createGonzalesWorld(seed, playerCount); world.status = 'running';
  const inputs = [];
  while (world.status === 'running' && world.tick < maxTicks) {
    stepWorld(world);
    for (const [index, household] of Object.values(world.households).entries()) {
      if (strategy === 'idle' || world.requests[household.id]?.status !== 'open') continue;
      const action = strategy === 'mixed' ? index % 2 === 0 ? 'help' : 'stay' : strategy;
      const input = { tick: world.tick, householdId: household.id, entityId: household.principalId, action };
      applyAction(world, household.id, input); inputs.push(input);
    }
    validateWorld(world);
  }
  return { world, inputs, metrics: extractMetrics(world) };
}
