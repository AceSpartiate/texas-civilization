// A class brought to the eve of the storming of Béxar in a few seconds (sim/battles/bexar-storming.mjs, sim/bexar-fight.mjs).
//
// Not a test file: `node --test` picks up `*.test.mjs`, and this is imported, never run.
//
// The whole march and siege take about four hundred ticks and a minute of a machine (tests/storming.test.mjs walks them, and
// keeps doing so). This walks a class on the real land to the day the army is made, puts the chosen families' grown men in it,
// marches it and sets it down at the mill, and moves the clock to the morning of December 4 with every earlier moment marked
// as passed - which is what a class arriving there has, less the siege's own questions, which the storming never reads.
import { createGonzalesWorld } from '../../sim/gonzales.mjs';
import { applyAction, stepWorld } from '../../sim/world.mjs';
import { TIMELINE, momentOf } from '../../sim/directors.mjs';
import { SIEGE_CAMPS, marchOut, moveCamp } from '../../sim/army.mjs';
import { settle } from './settled.mjs';

let base = null;
/** The class at the day the army is made: made once per test process, and cloned for each class asked for. */
function organised() {
  base ??= (() => {
    const world = settle(createGonzalesWorld('bexar-base', 8, { map: 'colonies', neighbours: true }));
    world.status = 'running';
    for (let i = 0; i < 3000 && world.minute <= momentOf(world, 'organised'); i++) stepWorld(world);
    return world;
  })();
  return structuredClone(base);
}
const grownMan = (world, household) => household.members.map(id => world.entities[id]).find(person => person.kind === 'person' && (person.age ?? 30) >= 18 && person.sex !== 'female' && !['dead', 'captured'].includes(person.health?.condition))
  || world.entities[household.principalId];

/**
 * A class at six in the morning of December 4, the army at the mill. `roles` maps a family (by index among the families of
 * the class) to what it plays: 'fighter' (goes in with Milam), 'reserve' (stays at the mill), 'reinforce' (goes in with the
 * companies on the 8th) or 'home' (nobody in the army). Families named are played; everybody else is a neighbour.
 */
export function bexarClass(seed, roles = ['fighter', 'reserve', 'reinforce', 'home']) {
  const world = organised();
  world.seed = seed;
  const households = Object.values(world.households);
  const people = {};
  roles.forEach((role, index) => {
    const household = households[index];
    household.played = true; delete household.absent;
    const person = grownMan(world, household);
    people[role] ??= [];
    people[role].push({ household, person });
    // Nobody in the army: out of its ranks, and nobody of theirs still promised to it, or they would go after it (sim/army.mjs
    // `followTheArmy`, since 2026-09-25).
    if (role === 'home') {
      world.army.members = world.army.members.filter(id => world.entities[id].householdId !== household.id);
      for (const id of household.members) for (const promise of world.entities[id]?.commitments || []) if (promise.id === 'volunteer' && promise.status === 'active') promise.status = 'ended';
      return;
    }
    person.commitments = [...(person.commitments || []).filter(p => p.id !== 'volunteer'), { id: 'volunteer', type: 'service', status: 'active' }];
    person.travel = null; person.location = { ...world.map.sites.gonzales, siteId: 'gonzales' };
    if (!world.army.members.includes(person.id)) world.army.members.push(person.id);
  });
  // Every other played family's people out of the army, so the ones named are the only played ones in it.
  marchOut(world);
  world.director.phase = 'campaign';
  const target = momentOf(world, 'winter-quarters') - 60;
  for (const key of Object.keys(TIMELINE)) {
    if (momentOf(world, key) >= target) continue;
    world.director.milestones[key] = true;
    const barrier = world.barriers.find(b => b.id === `gonzales:${key}`);
    if (barrier) barrier.resolved = true;
  }
  world.minute = target;
  moveCamp(world, 'mill');
  const bexar = world.map.sites.bexar;
  world.army.progress = world.army.road.distance;
  world.army.x = bexar.x + SIEGE_CAMPS.mill.dx; world.army.y = bexar.y + SIEGE_CAMPS.mill.dy;
  world.army.camp = SIEGE_CAMPS.mill.name; world.army.leftMinute = world.minute;
  for (const id of world.army.members) { const person = world.entities[id]; if (person.travel) person.travel.progress = world.army.progress; }
  return { world, people };
}

/** Answer every open army question for the named families as their roles say. */
export function answerAsPlayed(world, people) {
  for (const [role, list] of Object.entries(people)) {
    for (const { household, person } of list) {
      for (const [key, question] of Object.entries(world.army?.questions || {})) {
        if (question.closed || question.asks[person.id] !== 'open') continue;
        const yes = key === 'winter' ? true : key === 'milam' ? role === 'fighter' : key === 'reinforce' ? role === 'reinforce' : false;
        applyAction(world, household.id, { action: 'army-answer', entityId: person.id, question: key, answer: yes ? 'yes' : 'no' });
      }
    }
  }
}
export const stepTo = (world, minute, people, limit = 4000) => {
  for (let i = 0; i < limit && world.minute < minute && world.status === 'running'; i++) { if (people) answerAsPlayed(world, people); stepWorld(world); }
  return world.minute >= minute;
};
export { TIMELINE, momentOf };
