// A class left running with nobody in it pauses itself (owner, 2026-09-29, by multiple choice: "Pause after 3 min"; triage
// 1.1, classroom audit S1, design audit S1; docs/HOST_PAGE.md §2.11). Once no student's page has been open for `emptyPauseMs`
// while the class runs, server/app.mjs pauses it, writes it on the Host's record, and tells the Host's page why until Resume.
//
// The span is measured on the server's clock (`Date.now`), which these tests hold still and move by hand, as
// tests/absence.test.mjs does for the absence grace, so "inside" and "past" are exact on a loaded computer. The ticks, the
// streams and their closing stay real and are waited for.
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { createClassroom, EMPTY_PAUSE_MS } from '../server/app.mjs';

const caller = port => async (path, data, cookie) => {
  const response = await fetch(`http://127.0.0.1:${port}${path}`, { method: data ? 'POST' : 'GET', headers: { ...(data && { 'Content-Type': 'application/json' }), ...(cookie && { Cookie: cookie }) }, ...(data && { body: JSON.stringify(data) }) });
  return { status: response.status, body: await response.json(), cookie: response.headers.get('set-cookie')?.split(';')[0] };
};
function openStream(port, cookie) {
  return new Promise((resolve, reject) => {
    const request = http.get(`http://127.0.0.1:${port}/api/events`, { headers: { Cookie: cookie }, agent: false }, response => {
      if (response.statusCode !== 200) { response.resume(); reject(new Error(`stream returned ${response.statusCode}`)); return; }
      response.resume();
      resolve({ close: () => new Promise(done => { request.on('close', () => done()); request.destroy(); }) });
    });
    request.on('error', reject);
  });
}
/** The Host's own stream, keeping the last snapshot it was sent: what the Host's page actually shows. */
function watchStream(port, cookie) {
  return new Promise((resolve, reject) => {
    const seen = { last: null };
    const request = http.get(`http://127.0.0.1:${port}/api/events`, { headers: { Cookie: cookie }, agent: false }, response => {
      if (response.statusCode !== 200) { response.resume(); reject(new Error(`stream returned ${response.statusCode}`)); return; }
      let buffer = '';
      response.setEncoding('utf8');
      response.on('data', chunk => {
        buffer += chunk;
        let end;
        while ((end = buffer.indexOf('\n\n')) !== -1) {
          const message = buffer.slice(0, end); buffer = buffer.slice(end + 2);
          const data = message.split('\n').filter(line => line.startsWith('data: ')).map(line => line.slice(6)).join('\n');
          // The ping names the stream (server/app.mjs, `event: ping`, sent first since 59522723) and is not a snapshot.
          if (data && !/^event: ping$/m.test(message)) seen.last = JSON.parse(data);
        }
      });
      resolve({ seen, close: () => new Promise(done => { request.on('close', () => done()); request.destroy(); }) });
    });
    request.on('error', reject);
  });
}
async function settle(done, limitMs = 30000) {
  const end = performance.now() + limitMs;
  while (!(await done()) && performance.now() < end) await delay(5);
}

test('three minutes is what the owner chose', () => {
  assert.equal(EMPTY_PAUSE_MS, 3 * 60 * 1000);
});

test('a running class with no student page open for the span pauses itself, says why to the Host alone, and Resume gives it the whole span again', async t => {
  const dir = mkdtempSync(join(tmpdir(), 'texas-empty-pause-'));
  const emptyPauseMs = 150;
  const app = createClassroom({ seed: 'empty-pause', playerCount: 5, savePath: join(dir, 'save.json'), tickMs: 20, emptyPauseMs });
  // A whole tick has run since this was called: a running class commits every tick, and so does the pause.
  const nextTick = async () => { const from = app.state.revision; await settle(() => app.state.revision > from); };
  const status = () => app.state.world.status;
  try {
    const port = await app.listen(0, '127.0.0.1'), call = caller(port);
    const families = await Promise.all(Array.from({ length: 5 }, (_, i) => call('/api/join', { name: `Student ${i}`, code: app.state.sessionCode })));
    const host = await call('/api/host', { key: app.state.hostKey });
    // The Host's page, open throughout: it is not a student, and does not keep the class running.
    const hostPage = await watchStream(port, host.cookie);
    t.mock.timers.enable({ apis: ['Date'], now: Date.now() });
    // A class in its lobby is not running, and never pauses, however long nobody is there.
    t.mock.timers.tick(emptyPauseMs * 4);
    await delay(150);
    assert.equal(status(), 'lobby', 'a class in its lobby paused itself');
    assert.equal((await call('/api/command', { id: 'empty-start', action: 'start' }, host.cookie)).status, 200, 'the class did not start');
    // A page open for longer than the span keeps the class running.
    const page = await openStream(port, families[0].cookie);
    await nextTick();
    t.mock.timers.tick(emptyPauseMs * 3);
    await nextTick(); await nextTick();
    assert.equal(status(), 'running', 'a class with a student\'s page open paused itself');
    // The last page closes: running to the last millisecond of the span, paused at it.
    await page.close();
    await settle(async () => (await call('/api/state', null, host.cookie)).body.presence?.here === 0);
    await nextTick();
    t.mock.timers.tick(emptyPauseMs - 1);
    await nextTick();
    assert.equal(status(), 'running', 'the class paused itself inside the span');
    t.mock.timers.tick(1);
    await nextTick();
    assert.equal(status(), 'paused', 'a class with no student\'s page open for the span did not pause itself');
    // The Host is told why, on the stream its page is drawn from, and it is on the Host's record; a student is told nothing of it.
    await settle(() => hostPage.seen.last?.world.status === 'paused');
    assert.equal(hostPage.seen.last?.emptyPaused?.ms, emptyPauseMs, 'the Host\'s page was never sent why the class paused');
    const hostView = (await call('/api/state', null, host.cookie)).body;
    assert.equal(hostView.emptyPaused?.ms, emptyPauseMs, 'the Host\'s page is not told why the class paused');
    assert.ok(Number.isFinite(Date.parse(hostView.emptyPaused.at)));
    assert.ok(app.state.world.events.some(event => event.visibility === 'host' && /paused itself: no student had the game open/.test(event.text)), 'the pause is not on the Host\'s record');
    const student = await call('/api/state', null, families[1].cookie);
    assert.equal(student.body.emptyPaused, undefined, 'a student was sent why the class paused');
    assert.ok(!JSON.stringify(student.body).includes('paused itself'), 'a student was sent the Host\'s record of the pause');
    // Nothing moves while it is paused.
    const tick = app.state.world.tick;
    t.mock.timers.tick(emptyPauseMs * 4);
    await delay(150);
    assert.equal(app.state.world.tick, tick, 'a paused class went on');
    // The teacher's Resume: running, the reason gone, and the whole span again before it pauses a second time.
    assert.equal((await call('/api/command', { id: 'empty-resume', action: 'resume' }, host.cookie)).status, 200);
    assert.equal(status(), 'running');
    assert.equal((await call('/api/state', null, host.cookie)).body.emptyPaused, undefined, 'the reason stayed on the Host\'s page after Resume');
    await nextTick();
    t.mock.timers.tick(emptyPauseMs - 1);
    await nextTick();
    assert.equal(status(), 'running', 'a resumed class paused itself again before a whole span had passed');
    // The teacher's own Pause and Resume, a moment short of the span: Resume gives it the whole span again, not the moment left.
    assert.equal((await call('/api/command', { id: 'empty-own-pause', action: 'pause' }, host.cookie)).status, 200);
    await delay(60);
    t.mock.timers.tick(emptyPauseMs * 4);
    assert.equal((await call('/api/command', { id: 'empty-own-resume', action: 'resume' }, host.cookie)).status, 200);
    await nextTick(); await nextTick();
    assert.equal(status(), 'running', 'a class the teacher paused and resumed paused itself at once');
    assert.equal((await call('/api/state', null, host.cookie)).body.emptyPaused, undefined, 'the teacher\'s own pause was said to be the class pausing itself');
    t.mock.timers.tick(emptyPauseMs);
    await nextTick();
    assert.equal(status(), 'paused', 'a resumed class left empty did not pause itself again');
    await hostPage.close();
  } finally {
    await app.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test('a class the tests and proofs run in process is never paused from under them: the watch is the real server\'s', async t => {
  const dir = mkdtempSync(join(tmpdir(), 'texas-empty-pause-off-'));
  const app = createClassroom({ seed: 'empty-pause-off', playerCount: 5, savePath: join(dir, 'save.json'), tickMs: 20 });
  const nextTick = async () => { const from = app.state.revision; await settle(() => app.state.revision > from); };
  try {
    const port = await app.listen(0, '127.0.0.1'), call = caller(port);
    await call('/api/join', { name: 'Student', code: app.state.sessionCode });
    const host = await call('/api/host', { key: app.state.hostKey });
    assert.equal((await call('/api/command', { id: 'off-start', action: 'start', anyway: true }, host.cookie)).status, 200);
    t.mock.timers.enable({ apis: ['Date'], now: Date.now() });
    await nextTick();
    t.mock.timers.tick(EMPTY_PAUSE_MS * 2);
    await nextTick(); await nextTick();
    assert.equal(app.state.world.status, 'running');
  } finally {
    await app.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test('the class a teacher actually opens watches for an empty room, and Play Solo does not', () => {
  // Read rather than imported, because server/main.mjs starts a real server the moment it is loaded (tests/pace.test.mjs).
  const entry = readFileSync(fileURLToPath(new URL('../server/main.mjs', import.meta.url)), 'utf8');
  const given = entry.match(/\.\.\.\(!solo && \{ emptyPauseMs: (.+?) \}\),/);
  assert.ok(given, 'server/main.mjs does not give a class the empty-room watch');
  assert.match(given[1], /: EMPTY_PAUSE_MS$/, 'server/main.mjs does not fall back to the owner\'s three minutes');
});
