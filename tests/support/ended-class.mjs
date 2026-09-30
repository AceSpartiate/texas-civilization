// A whole class on the real land played headless to its end, for the flashback's tests and its browser proof (docs/FLASHBACK.md).
//
// Every family is run by the neighbours' own director (sim/neighbours.mjs), as the balance study plays a class: through the
// autumn, the winter and the spring to April 25, 1836, with the Host's two Continues between. `played` families are marked as
// a student's (they farm, answer, fight and flee as the director decides for an absent student's family); the first is rolled,
// named and dressed first, as a student makes a family, so its video has a family with a name and looks to draw.
// `onTick`, if given, is called with the world after every tick of play, so a test can watch the wire as the class goes.
import { createGonzalesWorld } from '../../sim/gonzales.mjs';
import { rollFamily, stepWorld } from '../../sim/world.mjs';
import { beginSecondPeriod, beginThirdPeriod } from '../../sim/periods.mjs';
import { nameFamily } from '../../sim/family.mjs';
import { choicesFor, isParent, setAppearance } from '../../sim/appearance.mjs';

// `surnames`: more than one family made as a student makes one (the end sequence's proof has two students), the first `surname`.
export function endedClass(seed = 'flashback-1', families = 5, { played = 2, surname = 'Flashwright', surnames = null, onTick = null } = {}) {
  const world = createGonzalesWorld(seed, families, { map: 'colonies', neighbours: true });
  const ids = Object.keys(world.households);
  (surnames || [surname]).forEach((name, index) => {
    const household = world.households[ids[index]];
    rollFamily(world, household);
    nameFamily(world, household, name);
    for (const id of household.members) {
      const person = world.entities[id];
      if (!isParent(person)) continue;
      const choices = choicesFor(person);
      setAppearance(world, household, { entityId: id, skin: choices.skin[(2 + index) % choices.skin.length], hair: choices.hair[(1 + index) % choices.hair.length], clothing: choices.clothing[(person.sex === 'female' ? 3 : 1) + index * 0], head: choices.head[0] });
    }
  });
  for (const id of ids.slice(0, played)) { world.households[id].played = true; world.households[id].absent = true; }
  world.status = 'running';
  const run = () => { for (let t = 0; t < 12000 && !world.director.complete && world.status === 'running'; t++) { stepWorld(world); onTick?.(world); } };
  run();
  beginSecondPeriod(world); world.status = 'running'; run();
  beginThirdPeriod(world); world.status = 'running'; run();
  world.status = 'ended';
  return world;
}
