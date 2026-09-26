// A class at the edge of the siege of the Alamo, for the browser proofs of the Alamo on the engine
// (scripts/battle-alamo-browser-proof.mjs): a real class on the colonies map with rolled families, played in process through
// the first period and continued into the winter, with one family's father put in the garrison at Béxar in process (every
// proof that uses it says so in its record), and run to the morning of February 23.
import { createGonzalesWorld } from '../../sim/gonzales.mjs';
import { rollFamily, stepWorld } from '../../sim/world.mjs';
import { beginSecondPeriod } from '../../sim/periods.mjs';
import { momentOf } from '../../sim/directors.mjs';

/** The family's father, or its first person. */
export const fatherOf = (world, householdId) => {
  const household = world.households[householdId];
  return household.members.map(id => world.entities[id]).find(person => person.kin?.role === 'father') || world.entities[household.members[0]];
};

/** `inside`: the household whose father is in the garrison; `outside`: households kept away from Béxar and the relief. */
export function alamoClass(seed, playerCount, { inside = 'hh-1', outside = ['hh-2'], stopBefore = 1500 } = {}) {
  const world = createGonzalesWorld(seed, playerCount, { map: 'colonies' });
  for (const household of Object.values(world.households)) rollFamily(world, household);
  world.status = 'running';
  for (let i = 0; i < 9000 && !world.director.complete; i++) stepWorld(world);
  beginSecondPeriod(world);
  world.status = 'running';
  for (let i = 0; i < 400 && !world.director.milestones['winter-news']; i++) stepWorld(world);
  const father = fatherOf(world, inside);
  const site = world.map.sites.bexar;
  delete father.auto;
  Object.assign(father, { travel: null, chore: null, task: 'rest', location: { x: site.x, y: site.y, siteId: 'bexar' }, service: { kind: 'garrison', status: 'serving', since: world.minute, siteId: 'bexar' } });
  const until = momentOf(world, 'alamo-siege') - stopBefore;
  for (let i = 0; i < 3000 && world.minute < until; i++) {
    stepWorld(world);
    // Nobody of the families kept out goes to Béxar or with the relief: a family with nobody there.
    for (const id of outside) for (const personId of world.households[id].members) {
      const person = world.entities[personId];
      if (['garrison', 'relief'].includes(person.service?.kind)) { person.service = null; person.chore = null; person.travel = null; person.location = { ...world.map.sites[world.households[id].homeSiteId], siteId: world.households[id].homeSiteId }; }
    }
  }
  // The two families the proofs play are past the lesson of their first hour (sim/lesson.mjs): it is March 1836.
  for (const id of [inside, ...outside]) world.households[id].lesson = { ...world.households[id].lesson, step: 'done', stopped: true, at: world.minute };
  world.status = 'lobby';
  return world;
}
