// How fast a class is watched, and how fast the world is.
//
// These are two different things and the whole point of this file is that they never touch.
// A settler walks three miles an hour and a tick is twenty fictional minutes at every pace;
// what changes is only the number of real seconds a class spends watching the same
// fictional hour. The owner's complaint - "the characters are moving way too fast" - was
// never about speed. It was about a walking figure crossing 8.7 of its own body lengths
// every second, against 0.78 for a person walking at three miles an hour, because one tick
// took one second. The figure was eleven times too fast for its own drawn size.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createClassroom, PACES } from '../server/app.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { stepWorld } from '../sim/world.mjs';
import { ProjectionMotion } from '../public/motion.js';

function client(port) {
  const jar = new Map();
  const header = () => [...jar].map(([name, value]) => `${name}=${value}`).join('; ');
  return {
    jar,
    async call(path, data) {
      const response = await fetch(`http://127.0.0.1:${port}${path}`, {
        method: data ? 'POST' : 'GET',
        headers: { ...(data && { 'Content-Type': 'application/json' }), ...(jar.size && { Cookie: header() }) },
        ...(data && { body: JSON.stringify(data) }),
      });
      for (const raw of response.headers.getSetCookie()) {
        const [pair] = raw.split(';');
        const index = pair.indexOf('=');
        if (/Max-Age=0/i.test(raw)) jar.delete(pair.slice(0, index)); else jar.set(pair.slice(0, index), pair.slice(index + 1));
      }
      return { status: response.status, body: await response.json() };
    },
  };
}
const command = (caller, action, extra = {}) =>
  caller.call('/api/command', { id: `cmd-${Math.random().toString(36).slice(2)}${Date.now()}`, action, ...extra });

async function classroom(options = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'texas-pace-'));
  const app = createClassroom({ seed: 'pace', playerCount: 5, savePath: join(dir, 'class.json'), worldFactory: createGonzalesWorld, ...options });
  const port = await app.listen(0, '127.0.0.1');
  const host = client(port);
  await host.call('/api/host', { key: app.state.hostKey });
  return { app, port, host, dispose: async () => { await app.close(); rmSync(dir, { recursive: true, force: true }); } };
}

test('the named paces are the three a teacher is offered, and study is the one that makes a walk look like a walk', () => {
  assert.deepEqual(Object.keys(PACES), ['study', 'brisk', 'quick']);
  // 5680 fictional minutes at 20 a tick is 284 ticks; at 9.5 seconds each that is a class
  // period. The pace that makes the gait honest and the pace that fills a lesson are the
  // same number, which is the whole reason this one is the default.
  const slice = 284 * PACES.study / 1000 / 60;
  assert.ok(slice > 42 && slice < 48, `the Gonzales slice runs ${slice.toFixed(1)} minutes at the study pace`);
  // A person walks a mile a tick. Their drawn height is 0.115 miles, so at the study pace
  // they cover a shade under one body length a second, which is what walking looks like.
  const bodyLengths = (1 / (PACES.study / 1000)) / 0.115;
  assert.ok(bodyLengths > 0.7 && bodyLengths < 1.1, `${bodyLengths.toFixed(2)} body lengths a second`);
  assert.ok((1 / (PACES.quick / 1000)) / 0.115 > 8, 'and the old pace was the better part of nine');
});

test('the pace is how fast a class watches, never what it watches', async () => {
  const { app, host, dispose } = await classroom({ tickMs: PACES.quick });
  try {
    // The same world, stepped the same number of times, at two different paces.
    const fast = createGonzalesWorld('identical', 5);
    const slow = createGonzalesWorld('identical', 5);
    fast.status = slow.status = 'running';
    for (let i = 0; i < 40; i++) { stepWorld(fast); stepWorld(slow); }
    assert.deepEqual(slow, fast, 'nothing under sim/ can see the pace, so forty ticks are forty ticks');
    assert.equal(fast.minute, 800, 'and a tick is twenty fictional minutes at any pace');

    assert.equal(app.pace, PACES.quick);
    const changed = await command(host, 'pace', { pace: 'study' });
    assert.equal(changed.status, 200, changed.body.error);
    assert.equal(app.pace, PACES.study, 'the teacher slowed the class down');
    assert.equal(app.state.world.minute, 0, 'and moved the world by not one minute');
  } finally { await dispose(); }
});

test('a pace nobody offers is refused, and only the teacher may change it', async () => {
  const { app, port, host, dispose } = await classroom({ tickMs: PACES.brisk });
  try {
    const nonsense = await command(host, 'pace', { pace: 'instant' });
    assert.equal(nonsense.status, 400);
    assert.match(nonsense.body.error, /Unknown pace/);
    assert.equal(app.pace, PACES.brisk, 'and the class keeps the pace it had');

    const student = client(port);
    assert.equal((await student.call('/api/join', { name: 'Not the teacher', code: app.state.sessionCode })).status, 200);
    const refused = await command(student, 'pace', { pace: 'quick' });
    assert.equal(refused.status, 400);
    assert.equal(app.pace, PACES.brisk, 'a student cannot hurry the afternoon along');
  } finally { await dispose(); }
});

test('the class is told how long a tick lasts, so it can spread one tick of walking across it', async () => {
  const { app, host, dispose } = await classroom({ tickMs: PACES.study });
  try {
    const seen = await host.call('/api/state');
    assert.equal(seen.body.tickMs, PACES.study, 'the renderer cannot pace itself without this');
    await command(host, 'pace', { pace: 'quick' });
    assert.equal((await host.call('/api/state')).body.tickMs, PACES.quick, 'and it hears about a change');
    assert.equal(app.pace, PACES.quick);
  } finally { await dispose(); }
});

test('slowing a class down really does slow the clock down', async t => {
  // The one thing worth measuring rather than reasoning about: that the interval is
  // genuinely rebuilt. A `setInterval` cannot change its own period, so a pace change that
  // forgot to clear the old timer would pass every assertion above and change nothing.
  //
  // Measured on node's mock clock rather than the wall's: the server's own `setInterval`
  // runs, but time passes only when the test says so. It once slept 400 ms and asked for
  // four 40 ms ticks, and on a loaded computer got two or three (2026-09-19, 7 of 10 full
  // suites beside a busy loop). Only `setInterval` is held; the requests stay real.
  t.mock.timers.enable({ apis: ['setInterval'] });
  const { app, host, dispose } = await classroom({ tickMs: 40 });
  try {
    await command(host, 'start', { anyway: true });
    t.mock.timers.tick(400);
    const quick = app.state.world.tick;
    assert.ok(quick >= 4, `a fast class advanced ${quick} ticks`);
    assert.equal(quick, 10, 'a 40 ms class ticks every 40 ms');

    await command(host, 'pace', { pace: 'study' });
    const before = app.state.world.tick;
    t.mock.timers.tick(400);
    assert.equal(app.state.world.tick, before, 'and once slowed, 400ms is not nearly a tick');
    // Slowed, not stopped: a pace change that cleared the old timer and started none would pass the line above.
    t.mock.timers.tick(PACES.study - 400 - 1);
    assert.equal(app.state.world.tick, before, 'a slowed class ticked before its new pace came round');
    t.mock.timers.tick(1);
    assert.equal(app.state.world.tick, before + 1, 'a slowed class did not tick at its new pace');
  } finally { await dispose(); }
});

test('the class a teacher actually opens starts at the study pace', () => {
  // Read rather than imported, because server/main.mjs starts a real server the moment it
  // is loaded. This is the guard that matters most and the one that was missing: every
  // other test here passed happily while the shipped entry point defaulted back to the
  // one-second tick that caused the complaint in the first place.
  const entry = readFileSync(fileURLToPath(new URL('../server/main.mjs', import.meta.url)), 'utf8');
  const fallback = entry.match(/tickMs:\s*Number\(process\.env\.TICK_MS\s*\|\|\s*([^)]+)\)/);
  assert.ok(fallback, 'server/main.mjs still chooses a tick interval in the expected way');
  assert.equal(fallback[1].trim(), 'PACES.study', 'a launched class opens at the pace that makes a walk look like a walk');
  assert.ok(entry.includes('PACES'), 'and takes it from the named ladder rather than a loose number');
});

test('one tick of walking is spread across one tick of real time, however long that is', () => {
  // The bug this guards was invisible while a tick was a second and arrived the moment a
  // class could be slowed down: the renderer spread every tick's movement across at most
  // one second, so at the study pace a traveller glided for a second and then stood
  // frozen for the remaining eight and a half. A walk made of lurches is worse than a
  // walk that is too fast, because it is not a walk at all.
  const walker = travel => ({ id: 'walker', location: { x: 0, y: 0, siteId: null }, travel });
  const road = { from: 'home-1', to: 'gonzales', points: [{ x: 0, y: 0 }, { x: 10, y: 0 }], distance: 10 };

  for (const tickMs of [1000, 4000, 9500]) {
    const motion = new ProjectionMotion();
    // Two ticks, one tick of real time apart, the traveller a mile further on.
    motion.accept({ sessionId: 's', revision: 1, tickMs, world: { tick: 1, minute: 20, status: 'running', entities: [walker({ ...road, progress: 0 })], others: [] } }, 0);
    motion.accept({ sessionId: 's', revision: 2, tickMs, world: { tick: 2, minute: 40, status: 'running', entities: [walker({ ...road, progress: 1 })], others: [] } }, tickMs);

    const entity = walker({ ...road, progress: 1 });
    const at = fraction => motion.position(entity, tickMs + tickMs * fraction).x;
    // A quarter of the way through the tick, a quarter of the way along the mile.
    assert.ok(Math.abs(at(0.25) - 0.25) < 0.06, `${tickMs}ms: a quarter through the tick the walker is at ${at(0.25).toFixed(2)} of a mile`);
    assert.ok(Math.abs(at(0.5) - 0.5) < 0.06, `${tickMs}ms: halfway through the tick the walker is at ${at(0.5).toFixed(2)}`);
    // And still moving at nine tenths - the freeze showed up here, pinned at 1.0.
    assert.ok(at(0.9) < 0.98, `${tickMs}ms: at nine tenths of the tick the walker is at ${at(0.9).toFixed(2)}, not yet arrived`);
    assert.ok(at(0.9) > at(0.5), `${tickMs}ms: still going forward late in the tick`);
  }
});
