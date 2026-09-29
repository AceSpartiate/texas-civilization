// Who is ready in the lobby (owner, 2026-09-29, by multiple choice: "Show name + ready"; triage 1.7, classroom audit S6;
// docs/HOST_PAGE.md §2.12). The Host's row for each family names the student playing it, and in the lobby marks the family
// ready once it is rolled, named and packed: "Done packing" is now told to the server (sim/wagon.mjs `donePacking`), and a
// change to the load or the stock after it takes the mark away. Start is unchanged. A student is sent none of it.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createClassroom } from '../server/app.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { choicesFor, isParent, LOOK_PARTS } from '../sim/appearance.mjs';
import { applyAction, validateWorld } from '../sim/world.mjs';
import { familiesOverview } from '../sim/host.mjs';

const caller = port => async (path, data, cookie) => {
  const response = await fetch(`http://127.0.0.1:${port}${path}`, { method: data ? 'POST' : 'GET', headers: { ...(data && { 'Content-Type': 'application/json' }), ...(cookie && { Cookie: cookie }) }, ...(data && { body: JSON.stringify(data) }) });
  return { status: response.status, body: await response.json(), cookie: response.headers.get('set-cookie')?.split(';')[0] };
};

test('the Host\'s row names the student and marks the family ready once it is rolled, named and packed; a new load takes it away; Start is unchanged; a student is sent neither', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'texas-lobby-ready-'));
  const app = createClassroom({ seed: 'lobby-ready', playerCount: 5, savePath: join(dir, 'save.json'), tickMs: 20, worldFactory: createGonzalesWorld });
  try {
    const port = await app.listen(0, '127.0.0.1'), call = caller(port);
    const sam = await call('/api/join', { name: 'Sam Reyes', code: app.state.sessionCode });
    const ana = await call('/api/join', { name: 'Ana Cruz', code: app.state.sessionCode });
    const host = await call('/api/host', { key: app.state.hostKey });
    const id = sam.body.world.householdId, other = ana.body.world.householdId;
    const command = async (name, input, cookie = sam.cookie) => { const answer = await call('/api/command', { id: name, ...input }, cookie); assert.equal(answer.status, 200, `${name}: ${answer.body.error}`); };
    const hostView = async () => (await call('/api/state', null, host.cookie)).body;
    const row = async householdId => (await hostView()).world.live.families.find(family => family.id === householdId);
    // The student's own name, on the Host's page, from the moment they join.
    const first = await hostView();
    assert.equal(first.presence.students?.[id], 'Sam Reyes', 'the Host is not sent the student\'s name');
    assert.equal(first.presence.students?.[other], 'Ana Cruz');
    assert.equal((await row(id)).ready, undefined, 'a family that has done nothing is ready');
    // Rolled, named and its parents' looks chosen: still packing.
    await command('ready-roll', { action: 'roll-family' });
    assert.equal((await row(id)).ready, undefined, 'a family only rolled is ready');
    await command('ready-name', { action: 'rename', surname: 'Reyes' });
    const world = app.state.world;
    for (const parent of world.households[id].members.map(one => world.entities[one]).filter(isParent)) {
      const choices = choicesFor(parent);
      await command(`ready-looks-${parent.id}`, { action: 'set-appearance', entityId: parent.id, ...Object.fromEntries(LOOK_PARTS.map(part => [part, choices[part][0]])) });
    }
    assert.equal((await row(id)).ready, undefined, 'a family made but not packed is ready');
    // Done packing: ready.
    await command('ready-packed', { action: 'done-packing' });
    assert.equal((await row(id)).ready, true, 'a family rolled, named and packed is not marked ready');
    assert.equal((await row(other)).ready, undefined, 'a family whose student has done nothing is ready');
    // Packed but not made is not ready either: Ana packs first.
    await command('ana-packed', { action: 'done-packing' }, ana.cookie);
    assert.equal((await row(other)).ready, undefined, 'a family packed but never rolled is ready');
    // A student who opens the wagon again and changes the load is packing again.
    const load = app.state.world.households[id].load;
    await command('ready-repack', { action: 'load-wagon', item: load[0].id, amount: load[0].amount });
    assert.equal((await row(id)).ready, undefined, 'a family that changed its load after Done packing is still ready');
    await command('ready-packed-again', { action: 'done-packing' });
    assert.equal((await row(id)).ready, true);
    // Nothing of it reaches a student: not the names, not the mark.
    const student = JSON.stringify((await call('/api/state', null, ana.cookie)).body);
    assert.ok(!student.includes('Sam Reyes'), 'a student was sent another student\'s name');
    assert.ok(!student.includes('"ready"'), 'a student was sent the ready mark');
    // Start is unchanged: it waits for nobody, and a family still packing goes with what it has.
    await command('ready-start', { action: 'start', anyway: true }, host.cookie);
    assert.equal(app.state.world.status, 'running', 'Start waited for a family that was not ready');
    const running = await hostView();
    assert.equal(running.world.live.families.find(family => family.id === id).ready, undefined, 'the ready mark stayed after Start');
    assert.equal(running.presence.students[id], 'Sam Reyes', 'the student\'s name went from the row at Start');
    // And Done packing once the wagon has gone is refused in words.
    const late = await call('/api/command', { id: 'ready-late', action: 'done-packing' }, sam.cookie);
    assert.equal(late.status, 400);
    assert.match(late.body.error, /already left/);
  } finally {
    await app.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test('the packed mark is true or absent, is the family\'s own, and is taken away by a change of stock too', () => {
  const world = createGonzalesWorld('packed-mark', 5);
  const household = world.households['hh-1'];
  household.played = true;
  applyAction(world, 'hh-1', { action: 'done-packing' });
  assert.equal(household.packed, true);
  validateWorld(world);
  household.packed = false;
  assert.throws(() => validateWorld(world), /Invalid packed marker/);
  household.packed = true;
  applyAction(world, 'hh-1', { action: 'bring-stock', stock: !household.stock });
  assert.equal(household.packed, undefined, 'a family that changed its stock after Done packing is still packed');
  // Only the lobby's: a family ready in the lobby is not marked ready once the class runs.
  applyAction(world, 'hh-1', { action: 'roll-family' });
  applyAction(world, 'hh-1', { action: 'rename', surname: 'Reyes' });
  for (const parent of household.members.map(id => world.entities[id]).filter(isParent)) {
    const choices = choicesFor(parent);
    applyAction(world, 'hh-1', { action: 'set-appearance', entityId: parent.id, ...Object.fromEntries(LOOK_PARTS.map(part => [part, choices[part][0]])) });
  }
  applyAction(world, 'hh-1', { action: 'done-packing' });
  assert.equal(familiesOverview(world).find(family => family.id === 'hh-1').ready, true, 'the scene proves nothing: the family is not ready in the lobby');
  world.status = 'running';
  assert.equal(familiesOverview(world).find(family => family.id === 'hh-1').ready, undefined, 'a family was marked ready after Start');
});
