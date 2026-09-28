// How many ticks each family had of watching a rider come before he spoke to them, over the first period of one class on the
// real land (tests/clock.test.mjs, "the news phase gives a student as many ticks of watching a rider come as the farming phase
// does"). Run as a worker so the several classes that test pools run side by side: workerData `{ seed, hold }`, where `hold`
// is the phase the calendar is held at through the news ('home') or null to let it speed up; posts the list of ticks.
//
// Not a test file: `node --test` picks up `*.test.mjs`, and this is imported or run as a worker, never run by the runner.
import { parentPort, workerData } from 'node:worker_threads';
import { createGonzalesWorld } from '../../sim/gonzales.mjs';
import { projectWorld, stepWorld } from '../../sim/world.mjs';

export function approaches(seed, hold) {
  const world = createGonzalesWorld(seed, 30, { map: 'colonies', neighbours: true });
  world.status = 'running';
  const seen = {}, ticksOfApproach = [];
  for (let tick = 0; tick < 2000 && !world.director.complete; tick++) {
    stepWorld(world);
    if (hold && world.director.phase === 'news') world.director.phase = hold;
    for (const household of Object.values(world.households)) {
      for (const other of projectWorld(world, household.id, 'student', { includeMap: false }).others) {
        const key = `${household.id}:${other.id}`;
        if (other.carrier && seen[key] === undefined) seen[key] = world.tick;
      }
    }
    for (const encounter of Object.values(world.encounters || {})) {
      if (encounter.openedMinute !== world.minute) continue;
      const first = seen[`${encounter.householdId}:${encounter.carrierId}`];
      ticksOfApproach.push(first === undefined ? 0 : world.tick - first);
    }
  }
  return ticksOfApproach;
}

if (parentPort && workerData?.seed) parentPort.postMessage(approaches(workerData.seed, workerData.hold));
