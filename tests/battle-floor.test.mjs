// A fight is never watched faster than its real-time floor (owner, 2026-09-30, after watching the Battle of Gonzales in a real
// class on v2026.09.29.3: "it happened too fast"; docs/BATTLES.md §15.1, `FIC-GONZ-1050`).
//
// The floor is real time only: the calendar, the phases, the ticks and every outcome are the same at every pace, and only how
// long a tick of the fighting lasts on the screen changes. These hold the arithmetic (every fight at every pace), the clock (the
// floor is asked for exactly while the fighting is fought, and not in a lead-up nobody is at), and the server (the timer really
// waits, the page is told the tick's length and the pace apart, and a class run in process is left at its pace).
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ENGAGEMENTS, WATCH_SECONDS, battleState, battleTickFloorMs, fightTicks, fightingPhase, tickFloorOf } from '../sim/battle-stage.mjs';
import { applyAction, stepWorld } from '../sim/world.mjs';
import { createClassroom, PACES } from '../server/app.mjs';
import { gonzalesClass, TIMELINE } from './support/battle.mjs';

/** The class of tests/battle-viewers.test.mjs: hh-1 and hh-4 sent up the river, hh-2's man kept in town, hh-3 at home. */
function fightingClass(seed) {
  const world = gonzalesClass(seed, { fighters: ['hh-1', 'hh-4'], townsfolk: ['hh-2'], stayers: ['hh-3'] });
  const answered = new Set();
  for (let tick = 0; tick < 2000 && answered.size < 3; tick++) {
    stepWorld(world);
    for (const id of ['hh-1', 'hh-4', 'hh-2']) {
      if (answered.has(id) || world.marches[id]?.status !== 'open') continue;
      applyAction(world, id, { action: id === 'hh-2' ? 'stay-in-town' : 'go-upriver', entityId: world.marches[id].actorId, mode: 'foot' });
      answered.add(id);
    }
  }
  return world;
}

test('every fight has a floor, and at every pace its fighting is watched at least that long and never faster than before', () => {
  for (const def of Object.values(ENGAGEMENTS)) {
    assert.ok(WATCH_SECONDS[def.id] > 0, `${def.id} has no real-time floor`);
    const ticks = fightTicks(def), floor = tickFloorOf(def);
    assert.ok(ticks > 0 && floor > 0, `${def.id}: ${ticks} ticks, ${floor} ms`);
    // Long enough a tick to read a bubble (public/speech.js holds one at least 3.8 s) - at three seconds, never under.
    assert.ok(floor >= 3000, `${def.id}'s fighting would show a tick for only ${floor} ms`);
    for (const [name, ms] of Object.entries(PACES)) {
      const before = ticks * ms, after = ticks * Math.max(ms, floor);
      assert.ok(after >= WATCH_SECONDS[def.id] * 1000 - ticks, `${def.id} at ${name}: ${after} ms, under its floor`);
      assert.ok(after >= before, `${def.id} at ${name} would be watched faster than before`);
      // Study was already slower than every floor: not a second of it moves.
      if (name === 'study') assert.equal(after, before, `${def.id} at Study changed`);
    }
  }
  // The Alamo is still the longest single held fight (owner, docs/BATTLES.md §2b.5): no other fight's floor is above it but
  // Béxar's, whose four episodes are four fights.
  for (const [id, seconds] of Object.entries(WATCH_SECONDS)) if (!['alamo', 'bexar-storming', 'coleto'].includes(id)) assert.ok(seconds < WATCH_SECONDS.alamo, `${id} outlasts the Alamo`);
});

test('the clock asks for the floor exactly while the fighting is fought, and Gonzales at Quick lasts its two minutes', () => {
  const world = fightingClass('floor-clock');
  let floored = 0, fightingSeen = 0, realMs = 0, quietNoFloor = 0, before = 0;
  const floor = tickFloorOf(ENGAGEMENTS.gonzales);
  while (world.minute < TIMELINE.resolved + 600 && world.status === 'running') {
    const state = world.battles?.gonzales ? battleState(world, 'gonzales') : null;
    const asked = battleTickFloorMs(world);
    if (state?.live && fightingPhase(state.phase)) {
      fightingSeen++;
      assert.equal(asked, floor, `the floor was not asked for in ${state.phase.id} at ${world.minute}`);
      floored++; realMs += Math.max(PACES.quick, asked);
    } else {
      assert.equal(asked, null, `a floor was asked for outside the fighting, in ${state?.phase?.id || 'no fight'} at ${world.minute}`);
      if (state?.live && state.phase.quiet) quietNoFloor++;
      if (!state?.live) before++;
    }
    stepWorld(world);
  }
  assert.equal(fightingSeen, fightTicks(ENGAGEMENTS.gonzales), 'the clock did not take the fighting in the ticks the arithmetic counts');
  assert.ok(realMs >= WATCH_SECONDS.gonzales * 1000 - 50, `Gonzales at Quick lasts ${realMs} ms`);
  assert.ok(quietNoFloor > 0 && before > 0, 'the quiet phases and the days before were never sampled');
  // Scaled for a proof, and never under a millisecond.
  const dawn = ENGAGEMENTS.gonzales.phases.findIndex(phase => phase.id === 'dawn-skirmish');
  world.minute = world.battles.gonzales.start + ENGAGEMENTS.gonzales.phases.slice(0, dawn).reduce((sum, phase) => sum + phase.minutes, 0) + 1;
  assert.equal(battleTickFloorMs(world, { scale: 0.25 }), Math.round(floor * 0.25));
});

test('the server waits the floor between the fighting ticks and tells the page the tick and the pace apart; a test class keeps its pace', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'texas-floor-'));
  // A class standing at first light, in the skirmish: twelve ticks of fighting ahead.
  const atDawn = () => {
    const world = fightingClass('floor-server');
    const dawn = ENGAGEMENTS.gonzales.phases.findIndex(phase => phase.id === 'dawn-skirmish');
    const at = world.battles.gonzales.start + ENGAGEMENTS.gonzales.phases.slice(0, dawn).reduce((sum, phase) => sum + phase.minutes, 0);
    while (world.minute < at) stepWorld(world);
    return world;
  };
  const run = async (options, name) => {
    const app = createClassroom({ seed: name, playerCount: 5, savePath: join(dir, `${name}.json`), tickMs: 200, worldFactory: atDawn, ...options });
    try {
      assert.equal(app.state.world.status, 'running');
      assert.ok(fightingPhase(battleState(app.state.world, 'gonzales').phase), 'the class did not open in the fighting');
      const shown = app.snapshot({ role: 'host' });
      const startTick = app.state.world.tick;
      await new Promise(resolve => setTimeout(resolve, 1500));
      return { shown, ticks: app.state.world.tick - startTick, every: app.tickEvery };
    } finally { await app.close(); }
  };
  try {
    // scale 0.1: Gonzales's 3,529 ms a tick is 353 ms, above this class's 200.
    const floored = await run({ battleFloors: { scale: 0.1 } }, 'floored');
    const free = await run({}, 'free');
    const floor = Math.round(tickFloorOf(ENGAGEMENTS.gonzales) * 0.1);
    assert.equal(floored.shown.tickMs, floor, 'the page was not told how long a tick of the fighting lasts');
    assert.equal(floored.shown.paceMs, 200, 'the page was not told the pace the teacher chose');
    assert.equal(floored.every, floor);
    assert.equal(free.shown.tickMs, 200); assert.equal(free.every, 200);
    // In a second and a half: about four floored ticks (the first at the pace, then every 353 ms) against about seven.
    assert.ok(floored.ticks <= 5, `the floored class ran ${floored.ticks} ticks in 1.5 s`);
    assert.ok(free.ticks >= floored.ticks + 2, `the floor did not slow the class: ${floored.ticks} against ${free.ticks}`);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('the real server floors its fights; the pace buttons read the pace, not the tick', () => {
  // Read rather than imported, because server/main.mjs starts a real server the moment it is loaded (tests/pace.test.mjs).
  const entry = readFileSync(fileURLToPath(new URL('../server/main.mjs', import.meta.url)), 'utf8');
  assert.match(entry, /battleFloors: process\.env\.BATTLE_FLOORS !== '0'/, 'server/main.mjs does not floor a class\'s fights');
  const page = readFileSync(fileURLToPath(new URL('../public/app.js', import.meta.url)), 'utf8');
  assert.match(page, /paces\[button\.dataset\.pace\] === \(snapshot\.paceMs \?\? snapshot\.tickMs\)/, 'the pace buttons go dark while a fight holds a tick');
  const panel = readFileSync(fileURLToPath(new URL('../public/class-panel.js', import.meta.url)), 'utf8');
  assert.match(panel, /tickMs: snapshot\.paceMs \?\? snapshot\.tickMs/, 'the class days are counted from the fight\'s tick, not the pace');
});
