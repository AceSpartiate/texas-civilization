// What the class view films (owner, 2026-09-30, asked: "major historical events, and events that would matter to the players";
// docs/BATTLES.md §16.2, sim/battle-stage.mjs `filmedAs`, the Host's `host.film`).
//
// The war's major events are filmed whether or not anybody's family is in them, from the first shot of the fighting to the last,
// and the Alamo from the army's coming to the burial. A minor fight is filmed only while a played family has somebody in it or
// at it - and stays filmed after he falls, so the film never stops on the minute he does. Only the Host is told.
import test from 'node:test';
import assert from 'node:assert/strict';
import { ENGAGEMENTS, MAJOR_EVENTS, armBattle, filmedAs, fightingPhase, schedule } from '../sim/battle-stage.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { projectWorld, stepWorld } from '../sim/world.mjs';
import { gonzalesClass, TIMELINE } from './support/battle.mjs';

const START = 200000;
const at = (world, id, phaseId, into = 0) => { world.minute = schedule(ENGAGEMENTS[id], START).find(phase => phase.id === phaseId).from + into; return world; };

test('the major events are filmed with nobody\'s family there, from the first shot to the last, and the Alamo from the army\'s coming to the burial', () => {
  assert.deepEqual(Object.keys(MAJOR_EVENTS).sort(), ['alamo', 'bexar-storming', 'coleto', 'concepcion', 'goliad-massacre', 'gonzales', 'grass-fight', 'san-jacinto']);
  for (const id of Object.keys(MAJOR_EVENTS)) {
    const world = createGonzalesWorld(`film-${id}`, 5, { map: 'colonies' });
    armBattle(world, id, START);
    const phases = schedule(ENGAGEMENTS[id], START), fighting = phases.filter(fightingPhase);
    for (const phase of phases) {
      world.minute = phase.from + Math.floor(phase.minutes / 2);
      const inside = world.minute >= fighting[0].from && world.minute < fighting.at(-1).to;
      // The Alamo, siege and fall (the owner's words), from the army's coming to the burial; every other, its fighting.
      const want = id === 'alamo' || inside ? 'major' : null;
      assert.equal(filmedAs(world, id), want, `${id} ${phase.id}: filmed as ${filmedAs(world, id)}, wanted ${want}`);
    }
    world.minute = START - 30;
    assert.equal(filmedAs(world, id), null, `${id} was filmed before it began`);
  }
});

test('a minor fight is filmed only with a played family\'s man in it, and stays filmed after he falls', () => {
  for (const id of ['san-patricio', 'agua-dulce']) {
    const world = createGonzalesWorld(`film-${id}`, 5, { map: 'colonies' });
    armBattle(world, id, START);
    const held = schedule(ENGAGEMENTS[id], START).find(fightingPhase);
    at(world, id, held.id, 1);
    assert.equal(filmedAs(world, id), null, `${id} with nobody there was filmed`);
    // A man of a family nobody plays: still not.
    const household = Object.values(world.households)[0], person = world.entities[household.members[0]];
    world.battles[id].participants[person.id] = { joined: world.minute };
    household.played = false;
    assert.equal(filmedAs(world, id), null, `${id} was filmed for a family nobody plays`);
    household.played = true;
    assert.equal(filmedAs(world, id), 'family', `${id} with a played family's man in it was not filmed`);
    person.health = { ...(person.health || {}), condition: 'dead' };
    world.battles[id].participants[person.id].released = true;
    assert.equal(filmedAs(world, id), 'family', `${id} stopped being filmed when the family's man fell`);
  }
});

test('the Host is told what the class view films during Gonzales with no family in it; nobody else is told', () => {
  const world = gonzalesClass('film-host', { fighters: [], townsfolk: [], stayers: ['hh-1', 'hh-2', 'hh-3'] });
  let filmed = 0, before = 0;
  for (let tick = 0; tick < 3000 && world.minute < TIMELINE.resolved + 200 && world.status === 'running'; tick++) {
    stepWorld(world);
    const host = projectWorld(world, undefined, 'host', { includeMap: false }).host;
    const student = projectWorld(world, 'hh-1', 'student', { includeMap: false });
    assert.ok(!JSON.stringify(student).includes('"film"'), 'a student was told what the class view films');
    if (host?.film) { assert.equal(host.film, 'major'); filmed++; } else if (world.battles?.gonzales && world.minute < TIMELINE.approach - 200) before++;
  }
  assert.ok(filmed >= 30, `the Gonzales fight was filmed for only ${filmed} ticks`);
  assert.ok(before > 0, 'the hours before the fight were never looked at');
});
