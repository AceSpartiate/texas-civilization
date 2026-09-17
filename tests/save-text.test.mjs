// A class is its own save text (docs/PERFORMANCE_SERVER.md, 2026-09-17).
//
// The classroom undoes a refused or failed change by reading back the last committed class from the text it serialised
// (server/app.mjs `commit`), instead of cloning the whole class before every change. That is exact only while everything in
// a class survives JSON unchanged: no undefined-valued field, no NaN or Infinity, no -0, nothing but plain objects and
// arrays. A reopened save has always needed the same, so this holds the whole of a played class to it, all game long.
//
// The same played class checks the projection's shortcuts against what they replaced: the newest events read back from
// the end rather than every event filtered, the logs lying out counted rather than placed and sorted, and the view the
// server serialises without copying it first.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { PROJECTED_EVENTS, projectWorld, stepWorld } from '../sim/world.mjs';
import { beginNextPeriod } from '../sim/periods.mjs';
import { logsLeftOut, logsLying } from '../sim/felling.mjs';

/** Where JSON would change this value, or null. */
function notJson(value, path = 'world') {
  if (typeof value === 'number') return !Number.isFinite(value) ? `${path} is ${value}` : Object.is(value, -0) ? `${path} is -0` : null;
  if (value === undefined) return `${path} is undefined`;
  if (typeof value === 'function' || typeof value === 'bigint' || typeof value === 'symbol') return `${path} is a ${typeof value}`;
  if (value === null || typeof value !== 'object') return null;
  if (!Array.isArray(value) && Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null) return `${path} is a ${value.constructor?.name}`;
  for (const [key, child] of Object.entries(value)) { const found = notJson(child, `${path}.${key}`); if (found) return found; }
  return null;
}

let played = null;
/** A class of five on the real land, every family run by the neighbours, through all three periods, checked as it goes. */
const play = () => played ??= (() => {
  const world = createGonzalesWorld('save-text', 5, { map: 'colonies', neighbours: true });
  world.status = 'running';
  const problems = [];
  let ticks = 0;
  for (let period = 1; period <= 3; period++) {
    for (let t = 0; t < 5000 && world.status === 'running'; t++) {
      stepWorld(world);
      if (++ticks % 15 === 0) { const found = notJson(world); if (found) problems.push(`tick ${world.tick}: ${found}`); }
    }
    if (period < 3) { beginNextPeriod(world); world.status = 'running'; }
  }
  return { world, problems, ticks };
})();

test('a played class survives its own save text unchanged, all game long', () => {
  const { world, problems, ticks } = play();
  assert.ok(ticks > 300, `the class played only ${ticks} ticks`);
  assert.deepEqual(problems.slice(0, 5), [], 'a class held something its save text would change, so undoing a change from that text is not exact');
  assert.equal(notJson(world), null);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(world)), world);
});

test("the projection's shortcuts give what they replaced: the newest events, the logs lying out, the uncopied view", () => {
  const { world } = play();
  assert.ok(world.events.some(event => event.visibility === 'sealed'), 'the played class has no sealed events to leave out');
  assert.ok(Object.keys(world.woods?.felled || {}).length > 0, 'the played class felled no trees');
  for (const [householdId, role] of [...Object.keys(world.households).map(id => [id, 'student']), [undefined, 'host']]) {
    const expected = world.events.filter(e => e.visibility !== 'sealed')
      .filter(e => (householdId && e.householdId === householdId) || (role === 'host' && e.visibility === 'public'))
      .slice(-PROJECTED_EVENTS).map(e => e.id);
    assert.ok(expected.length === PROJECTED_EVENTS, `${householdId || 'the Host'} saw too few events for the slice to matter`);
    const view = projectWorld(world, householdId, role, { includeMap: false });
    assert.deepEqual(view.events.map(e => e.id), expected, `${householdId || 'the Host'} was shown different events`);
    // What the server sends is the uncopied view serialised at once: the same text as the copy.
    assert.equal(JSON.stringify(projectWorld(world, householdId, role, { includeMap: false, copy: false })), JSON.stringify(view), `${householdId || 'the Host'}'s uncopied view serialises differently`);
    if (!householdId) continue;
    const household = world.households[householdId];
    const lying = logsLying(world, household).reduce((sum, entry) => sum + entry.left, 0);
    assert.equal(logsLeftOut(world, household), lying, `${householdId}'s logs lying out were miscounted`);
    assert.equal(view.land.logs?.lying ?? 0, lying);
  }
});
