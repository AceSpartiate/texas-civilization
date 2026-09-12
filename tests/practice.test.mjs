// An afternoon at the mark.
//
// The owner asked whether a family should be able to practise shooting at home to get
// better at it. Yesterday `docs/REFERENCE_ARCHITECTURES.md` §8 refused Total War's
// veterancy, and this is the amendment rather than a reversal - the distinction is the
// whole of it.
//
// **Veterancy is getting better at what you were already doing.** It would have let a
// family that hunted a lot quietly become a family that hunts well, inside one lesson, for
// free. **This is a choice that costs.** An afternoon nobody spends planting, and two
// powder out of a house that holds three - the very thing the skill is for. `HIST-GONZ-021`
// is why it costs: powder on this frontier was scarce and dear enough that rifles were
// designed around conserving it, so practice was something a family decided to afford.
//
// And it removes no pressure. Hunting has never had anything to do with the hoe, the town
// or the neighbours; farming and hands are still dealt at founding and stay there, which is
// what keeps a household without the handy member walking into Gonzales.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, projectWorld, stepWorld, validateWorld } from '../sim/world.mjs';
import { CHORES, PRACTICE_COST, SKILL_CAP, choreAvailability, skillsFor, steadyHand } from '../sim/chores.mjs';

const running = (seed = 'practice', count = 5) => {
  const built = createGonzalesWorld(seed, count);
  built.status = 'running';
  return built;
};
/** Somebody in this world whose hunting hand is what the test needs. */
function findHunter(world, wanted) {
  for (const household of Object.values(world.households)) {
    for (const id of household.members) {
      if (wanted(world.entities[id])) return { person: world.entities[id], householdId: household.id };
    }
  }
  return null;
}
function work(world, householdId, entityId, chore) {
  applyAction(world, householdId, { action: 'chore', entityId, chore });
  for (let tick = 0; tick < 400 && world.entities[entityId].chore; tick++) stepWorld(world);
  assert.equal(world.entities[entityId].chore, null, `${chore} never finished`);
}

test('an afternoon at the mark buys one step of a steadier hand, and is paid for in powder', () => {
  const world = running('mark');
  const poor = findHunter(world, person => person.skills.hunting === 1);
  assert.ok(poor, 'this world has nobody who needs the practice');
  const household = world.households[poor.householdId];
  const powder = household.resources.powder;
  work(world, poor.householdId, poor.person.id, 'practise-shooting');
  assert.equal(poor.person.skills.hunting, 2);
  assert.equal(household.resources.powder, powder - PRACTICE_COST, 'the afternoon was free');
  assert.ok(world.events.some(event => /spent the afternoon at the mark/.test(event.text)));
  validateWorld(world);
  // And nobody else in the family got better by standing near them.
  for (const id of household.members) {
    if (id === poor.person.id) continue;
    assert.deepEqual(world.entities[id].skills, skillsFor(id), `${id} improved without lifting a rifle`);
  }
});

test('it changes what that person can actually do, which is the whole point', () => {
  const world = running('mark');
  const poor = findHunter(world, person => person.skills.hunting === 1);
  assert.equal(steadyHand(poor.person), false, 'a long shot was never beyond them to begin with');
  work(world, poor.householdId, poor.person.id, 'practise-shooting');
  assert.equal(steadyHand(poor.person), true, 'the practice bought nothing they can use');
  // Said in the family's own record in terms a student can act on, not as a number.
  assert.ok(world.events.some(event => /a long shot is not beyond them now/.test(event.text)));
});

test('there is a ceiling, it is said in words, and two people cannot walk past it together', () => {
  const world = running('ceiling');
  const best = findHunter(world, person => person.skills.hunting === SKILL_CAP);
  assert.ok(best, 'nobody in this world shoots well');
  const refused = choreAvailability(world, world.households[best.householdId], best.person, 'practise-shooting');
  assert.equal(refused.can, false);
  assert.match(refused.why, /already shoots as well as anyone/);

  // The step guards the ceiling too. A household could send its best shot to the mark
  // twice over before the control caught up, and a skill of four is not a skill.
  const rising = findHunter(world, person => person.skills.hunting === 2);
  if (rising) {
    world.households[rising.householdId].resources.powder = 20;
    work(world, rising.householdId, rising.person.id, 'practise-shooting');
    assert.equal(rising.person.skills.hunting, SKILL_CAP);
    assert.throws(() => applyAction(world, rising.householdId, { action: 'chore', entityId: rising.person.id, chore: 'practise-shooting' }),
      /already shoots as well as anyone/);
    validateWorld(world);
  }
});

test('a family with no powder cannot practise, and is told so on the control', () => {
  const world = running('dry-mark');
  const poor = findHunter(world, person => person.skills.hunting === 1);
  const household = world.households[poor.householdId];
  household.resources.powder = PRACTICE_COST - 1;
  const shown = projectWorld(world, poor.householdId, 'student', { includeMap: false })
    .work[poor.person.id].find(entry => entry.id === 'practise-shooting');
  assert.equal(shown.can, false);
  assert.match(shown.why, /Not enough powder/);
  assert.equal(shown.cost, `${PRACTICE_COST} powder`, 'the price is on the control before it is pressed');
  assert.throws(() => applyAction(world, poor.householdId, { action: 'chore', entityId: poor.person.id, chore: 'practise-shooting' }), /Not enough powder/);
});

test('only shooting can be practised, because only shooting costs nothing to leave alone', () => {
  // The line that keeps the town mattering. A household with nobody who can mend a hoe has
  // to go into Gonzales or ask a neighbour; if `hands` could be trained up at home that
  // pressure would evaporate, and with it the reason the town is on the map.
  const practisable = Object.entries(CHORES)
    .flatMap(([id, chore]) => chore.steps.filter(step => step.practise).map(step => [id, step.practise]));
  assert.deepEqual(practisable, [['practise-shooting', 'hunting']],
    `something now trains ${practisable.map(([, skill]) => skill).join(', ')}`);

  // Played out: a whole class of work, and farming and hands have not moved.
  const world = running('fixed');
  const household = world.households['hh-1'];
  household.resources.powder = 20; household.resources.seed = 20; household.resources.food = 40;
  for (const chore of ['plant-field', 'mend-hoe', 'clear-ground', 'build-fence']) {
    const can = choreAvailability(world, household, world.entities['hh-1-thomas'], chore);
    if (can.can) work(world, 'hh-1', 'hh-1-thomas', chore);
  }
  const founding = skillsFor('hh-1-thomas');
  assert.equal(world.entities['hh-1-thomas'].skills.farming, founding.farming, 'farming was trained by doing it');
  assert.equal(world.entities['hh-1-thomas'].skills.hands, founding.hands, 'hands were trained by doing it');
});

test('a hand that has been practised stays practised', () => {
  const world = running('persist');
  const poor = findHunter(world, person => person.skills.hunting === 1);
  work(world, poor.householdId, poor.person.id, 'practise-shooting');
  const after = poor.person.skills.hunting;
  // Through the rest of the afternoon, and through everything else the world does.
  for (let tick = 0; tick < 120; tick++) stepWorld(world);
  assert.equal(world.entities[poor.person.id].skills.hunting, after, 'the practice wore off');
  // And through a round trip, which is what a save and reload is.
  const reloaded = JSON.parse(JSON.stringify(world));
  validateWorld(reloaded);
  assert.equal(reloaded.entities[poor.person.id].skills.hunting, after);
  // A founding hand is no longer the whole story, and nothing may assume it is.
  assert.notEqual(reloaded.entities[poor.person.id].skills.hunting, skillsFor(poor.person.id).hunting);
});

test('a skill that is not between one and three is not a skill', () => {
  const world = running('bounds');
  world.entities['hh-1-thomas'].skills = { ...world.entities['hh-1-thomas'].skills, hunting: SKILL_CAP + 1 };
  assert.throws(() => validateWorld(world), /Invalid hunting skill/);
  world.entities['hh-1-thomas'].skills = { ...world.entities['hh-1-thomas'].skills, hunting: 0 };
  assert.throws(() => validateWorld(world), /Invalid hunting skill/);
  world.entities['hh-1-thomas'].skills = { ...world.entities['hh-1-thomas'].skills, hunting: 2.5 };
  assert.throws(() => validateWorld(world), /Invalid hunting skill/);
  world.entities['hh-1-thomas'].skills = skillsFor('hh-1-thomas');
  validateWorld(world);
});
