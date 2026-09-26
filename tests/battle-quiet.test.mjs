// Keep fighting, speed lead-ups (owner, 2026-09-26, by multiple choice; docs/BATTLES.md §2b.11).
//
// Every fight's fighting is held at its step for every class, whoever is there. Its quiet phases - the lead-up and the
// aftermath, marked `quiet` in the engagement - are held only while a played, present family has somebody there: in the force
// (`watchedByAFamily`), or standing on its ground before the force has recorded them (`familyThere`). With nobody there they go at
// the class's own pace, and a tick still lands on each one's end, so every phase begins on a tick of its own.
import test from 'node:test';
import assert from 'node:assert/strict';
import { stepWorld } from '../sim/world.mjs';
import { calendarMinutes } from '../sim/clock.mjs';
import { ENGAGEMENTS, BATTLE_STEPS, battleState, battleStep, checkEngagement, familyThere, phaseOffset, THERE_MILES } from '../sim/battle-stage.mjs';
import { AGUA_DULCE } from '../sim/battles/agua-dulce.mjs';
import { GONZALES } from '../sim/battles/gonzales.mjs';
import { CALENDAR_STEPS } from '../public/motion.js';
import { gonzalesClass, gonzalesFamilies, principalOf, stepUntil, TIMELINE } from './support/battle.mjs';
import { applyAction } from '../sim/world.mjs';

const START = 100000;
/**
 * The Agua Dulce fight on a bare map (its ground is the Agua Dulce site and the end of the road south, eleven miles off), with
 * one family of one man: played or not, absent or not, in the force or not, standing where `at` puts him.
 */
function drive({ played = true, absent = false, inForce = false, at = { x: 30, y: 30 } } = {}) {
  return {
    minute: START,
    map: { sites: { 'agua-dulce': { id: 'agua-dulce', x: 0, y: 0 }, 'matamoros-road': { id: 'matamoros-road', x: 0, y: 11 } } },
    households: { 'hh-1': { id: 'hh-1', played, ...(absent && { absent: true }), members: ['p-1'] } },
    entities: { 'p-1': { id: 'p-1', kind: 'person', name: 'Tom', householdId: 'hh-1', health: { condition: 'well' }, location: { ...at, siteId: null } } },
    battles: { 'agua-dulce': { id: 'agua-dulce', start: START, participants: inForce ? { 'p-1': { householdId: 'hh-1', joined: START } } : {}, alerted: {}, told: {}, heard: {} } },
  };
}
const inPhase = (world, id, into = 0) => { world.minute = START + phaseOffset(AGUA_DULCE, id) + into; return world; };
const phaseMinutes = id => AGUA_DULCE.phases.find(phase => phase.id === id).minutes;
/** The largest tick the page draws as an ordinary one that fits in `room`: how a quiet phase with nobody there is taken. */
const ordinary = room => [...CALENDAR_STEPS].sort((a, b) => b - a).find(step => step <= room);

test('a quiet phase is marked in the data only with a step and never on the fighting, and the fighting of every engagement is held', () => {
  const bad = change => { const def = JSON.parse(JSON.stringify(AGUA_DULCE)); def.ground = AGUA_DULCE.ground; change(def); return () => checkEngagement(def); };
  assert.throws(bad(def => { def.phases.find(phase => phase.id === 'ambush').quiet = true; }), /never while it is fought/);
  assert.throws(bad(def => { const drive = def.phases.find(phase => phase.id === 'drive'); delete drive.step; }), /quiet only with a step/);
  for (const def of Object.values(ENGAGEMENTS)) {
    for (const phase of def.phases) if (phase.contact) assert.ok(!phase.quiet && (phase.step || phase.background), `${def.id} ${phase.id} is fought and not held`);
    // Every engagement keeps a lead-up or an aftermath of its own unless it has none (the Alamo's siege is its `background`).
    if (def.id !== 'alamo') assert.ok(def.phases.some(phase => phase.quiet), `${def.id} has no quiet phase`);
  }
  // A quiet phase adds no step the page does not already draw as a walk.
  assert.ok(BATTLE_STEPS.every(step => CALENDAR_STEPS.includes(step)), `${BATTLE_STEPS}`);
});

test('a lead-up goes at the ordinary pace with no played family there, and is held at its step while one has somebody there', () => {
  const drive20 = AGUA_DULCE.phases.find(phase => phase.id === 'drive').step;
  // Nobody there: the drive in the largest ordinary ticks that fit it (the class's own pace is the smaller, as `battleMinutes`
  // takes it).
  assert.equal(battleStep(inPhase(drive(), 'drive')), ordinary(phaseMinutes('drive')));
  // Part way through, never past the phase's end into the next.
  assert.equal(battleStep(inPhase(drive(), 'drive', 20)), ordinary(phaseMinutes('drive') - 20));
  // A man of a family nobody plays, or whose student has gone, in the force: still nobody there.
  assert.equal(battleStep(inPhase(drive({ played: false, inForce: true }), 'drive')), ordinary(phaseMinutes('drive')));
  assert.equal(battleStep(inPhase(drive({ absent: true, inForce: true }), 'drive')), ordinary(phaseMinutes('drive')));
  // A played, present family's man in the force: held at the phase's step, as it was for everybody before.
  assert.equal(battleStep(inPhase(drive({ inForce: true }), 'drive')), drive20);
  assert.equal(battleStep(inPhase(drive({ inForce: true }), 'herd')), 5);
  assert.equal(battleStep(inPhase(drive({ inForce: true }), 'after')), 20);
  // The aftermath the same way.
  assert.equal(battleStep(inPhase(drive(), 'after')), ordinary(phaseMinutes('after')));
  // A dead man in it is nobody there.
  const dead = inPhase(drive({ inForce: true }), 'drive');
  dead.entities['p-1'].health.condition = 'dead';
  assert.equal(battleStep(dead), ordinary(phaseMinutes('drive')));
});

test('a played family\'s man standing with the force before it has recorded him is there, and one half a mile off and more is not', () => {
  // At the end of the road south, where Grant's men start the drive: with them, though no director has put him in the force yet
  // (the men at the mill who said yes to Milam and go in at three; a camp asked to ride out after the pack train).
  const withThem = inPhase(drive({ at: { x: 0, y: 11 } }), 'drive');
  assert.ok(familyThere(withThem, battleState(withThem, 'agua-dulce')));
  assert.equal(battleStep(withThem), 20);
  const off = inPhase(drive({ at: { x: THERE_MILES + 0.1, y: 11 } }), 'drive');
  assert.ok(!familyThere(off, battleState(off, 'agua-dulce')));
  // Not a played family's, standing right there: nobody there.
  const neighbour = inPhase(drive({ played: false, at: { x: 0, y: 11 } }), 'drive');
  assert.ok(!familyThere(neighbour, battleState(neighbour, 'agua-dulce')));
});

test('the fighting is held at its step whoever is there, and a quiet phase before it lands the clock on its first minute', () => {
  for (const options of [{}, { inForce: true }, { played: false }]) {
    assert.equal(battleStep(inPhase(drive(options), 'ambush')), 1, JSON.stringify(options));
    assert.equal(battleStep(inPhase(drive(options), 'ambush', 7)), 1, JSON.stringify(options));
  }
  // With nobody there the lead-up goes in ordinary ticks and the last of them ends on the charge's first minute, not inside it.
  const world = inPhase(drive(), 'drive'), charge = START + phaseOffset(AGUA_DULCE, 'ambush'), ticks = [];
  while (world.minute < charge) { const step = battleStep(world); ticks.push(step); world.minute += step; }
  assert.equal(world.minute, charge);
  assert.ok(ticks.every(step => CALENDAR_STEPS.includes(step)), `${ticks}`);
  // And a class not yet at the fight is landed on its first minute, as before.
  const before = drive(); before.minute = START - 500;
  assert.equal(battleStep(before), 500);
});

test('on a real class the lead-up at Gonzales is held for the family whose man went up the river, and goes faster with nobody there', () => {
  const world = gonzalesClass('battle-quiet', { map: 'colonies', fighters: 'first' });
  const [id] = gonzalesFamilies(world);
  stepUntil(world, () => world.marches?.[id]?.status === 'open');
  applyAction(world, id, { action: 'go-upriver', entityId: principalOf(world, id).id, mode: 'foot' });
  stepUntil(world, () => battleState(world, 'gonzales')?.phase?.id === 'field');
  const household = world.households[id], man = principalOf(world, id);
  assert.ok(world.battles.gonzales.participants[man.id], 'the man who went up the river is not in the force');
  // The field is theirs: an aftermath of eighty minutes. With his family played and at the screen, held at twenty minutes as
  // before.
  household.played = true; household.absent = false;
  assert.equal(calendarMinutes(world), 20);
  // With the family's student gone, or nobody playing it, the class's own hour a tick (the news, sim/clock.mjs).
  household.absent = true;
  assert.equal(calendarMinutes(world), 60);
  household.played = false; household.absent = false;
  assert.equal(calendarMinutes(world), 60);
  // The fighting before it was held for everybody: the fight's two-minute step at 8:40 with nobody playing.
  const fight = gonzalesClass('battle-quiet-fight', { map: 'colonies' });
  stepUntil(fight, () => battleState(fight, 'gonzales')?.phase?.id === 'fight');
  assert.equal(calendarMinutes(fight), GONZALES.phases.find(phase => phase.id === 'fight').step);
  assert.ok(fight.minute >= TIMELINE.exchange);
  stepWorld(fight);
});
