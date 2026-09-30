// A man who got away from a southern fight to Fannin (sim/alamo.mjs `tellSouth`, sim/south.mjs) and is then shot at Goliad
// (sim/houston.mjs `tellGoliad`). His escape was told with the same `told` Goliad's telling reads, so when he was shot his family's
// account named him (sim/fannin.mjs `tellFannin`) while his row was never marked dead: the family was told twice over and the
// panel still showed him alive. His escape is told once, and what became of him at Goliad is told as for every Fannin man.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { rollFamily } from '../sim/world.mjs';
import { tellSouth } from '../sim/alamo.mjs';
import { goliadTold, tellGoliad } from '../sim/houston.mjs';

/** A class on the real land with one grown man got away from Agua Dulce to Fannin at Goliad, as `fightSouth` leaves him. */
function escaped() {
  const world = createGonzalesWorld('escaped-to-fannin', 5, { map: 'colonies' });
  for (const household of Object.values(world.households)) rollFamily(world, household);
  const man = Object.values(world.entities).find(one => one.householdId && one.kind === 'person' && one.sex === 'male' && (one.age ?? 0) >= 16);
  const goliad = world.map.sites.goliad;
  Object.assign(man, { travel: null, chore: null, task: 'rest', location: { x: goliad.x, y: goliad.y, siteId: 'goliad' } });
  man.service = { kind: 'fannin', status: 'serving', since: world.minute, siteId: 'goliad', escapedFrom: 'agua-dulce' };
  return { world, man };
}
const linesOf = (world, man, pattern) => world.events.filter(event => event.actorId === man.id && pattern.test(event.text || ''));
/** Taken at Coleto and shot on Palm Sunday, as sim/houston.mjs `surrenderAtColeto` and the massacre's roll leave him. */
const shot = man => { man.service = { ...man.service, coleto: 'unhurt', status: 'prisoner', prisonerSince: 0, fate: 'executed' }; };
const beginTravel = () => { throw new Error('nobody shot travels'); };

test('a man who got away from the south to Fannin and was shot at Goliad: his escape told once, then his death, and his row dead', () => {
  const { world, man } = escaped();
  tellSouth(world, 'agua-dulce');
  tellSouth(world, 'agua-dulce');
  assert.equal(linesOf(world, man, /got away when the Mexican cavalry struck/).length, 1, 'his escape was not told exactly once');
  assert.equal(goliadTold(man.service), false, 'his escape was taken for word of what became of him at Goliad');
  shot(man);
  tellGoliad(world, { beginTravel });
  assert.equal(man.health.condition, 'dead', 'his row is not marked dead after the word of Goliad');
  assert.equal(man.service.status, 'fell');
  assert.equal(linesOf(world, man, /among the prisoners shot at Goliad/).length, 1, 'his family was not told he was shot');
  tellGoliad(world, { beginTravel });
  assert.equal(linesOf(world, man, /among the prisoners shot at Goliad/).length, 1, 'his family was told twice');
});

test('a class saved before the fix, his escape already told under `told`: told of Goliad all the same, and not of his escape again', () => {
  const { world, man } = escaped();
  man.service.told = true;
  tellSouth(world, 'agua-dulce');
  assert.equal(linesOf(world, man, /got away/).length, 0, 'an old save\'s escape was told again');
  shot(man);
  tellGoliad(world, { beginTravel });
  assert.equal(man.health.condition, 'dead', 'an old save\'s escaped man is not marked dead after the word of Goliad');
  assert.equal(linesOf(world, man, /among the prisoners shot at Goliad/).length, 1);
});
