// What the classroom server still guarantees now that it does less per commit (docs/PERFORMANCE_SERVER.md, 2026-09-17).
//
// A student's order and a tick are shown at once and written within `saveWithinMs`; the Host's commands, joining and
// stopping are written before they are answered; a timed write that fails puts the class back to its last save, paused
// and saying so; and a page is sent a snapshot only when what it sees has changed, or when it sent the order.
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { mkdtempSync, mkdirSync, readFileSync, rmdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { createClassroom } from '../server/app.mjs';

const SAVE_WITHIN = 300;

async function classroom(options = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'texas-cadence-'));
  const savePath = join(dir, 'class.json');
  const app = createClassroom({ savePath, playerCount: 5, tickMs: 10000, saveWithinMs: SAVE_WITHIN, ...options });
  const port = await app.listen(0, '127.0.0.1');
  const call = async (path, data, cookie) => {
    const response = await fetch(`http://127.0.0.1:${port}${path}`, { method: data ? 'POST' : 'GET', headers: { ...(data && { 'Content-Type': 'application/json' }), ...(cookie && { Cookie: cookie }) }, ...(data && { body: JSON.stringify(data) }) });
    return { status: response.status, body: await response.json(), cookie: response.headers.get('set-cookie')?.split(';')[0] };
  };
  const host = await call('/api/host', { key: app.state.hostKey });
  const a = await call('/api/join', { code: app.state.sessionCode, name: 'A' });
  const b = await call('/api/join', { code: app.state.sessionCode, name: 'B' });
  const streams = [];
  const open = cookie => new Promise((resolve, reject) => {
    const stream = { frames: [] };
    const request = http.get(`http://127.0.0.1:${port}/api/events`, { headers: { Cookie: cookie }, agent: false }, response => {
      response.setEncoding('utf8');
      let pending = '';
      response.on('data', chunk => {
        pending += chunk;
        let end;
        while ((end = pending.indexOf('\n\n')) !== -1) {
          const data = pending.slice(0, end).split('\n').find(line => line.startsWith('data: '));
          pending = pending.slice(end + 2);
          if (data) stream.frames.push(JSON.parse(data.slice(6)));
        }
      });
      response.on('error', () => {});
      resolve(stream);
    });
    request.on('error', reject);
    stream.close = () => request.destroy();
    streams.push(stream);
  });
  const saved = () => JSON.parse(readFileSync(savePath, 'utf8'));
  const principal = householdId => app.state.world.households[householdId].principalId;
  const order = (cookie, body) => call('/api/command', { id: `order-${Math.random().toString(36).slice(2, 12)}`, ...body }, cookie);
  const dispose = async () => { for (const stream of streams) stream.close(); await app.close(); rmSync(dir, { recursive: true, force: true }); };
  return { app, dir, savePath, call, host, a, b, open, saved, principal, order, dispose };
}

test('an order is shown at once and written within the save window, and a Host command writes everything at once', async () => {
  const c = await classroom();
  try {
    const id = c.principal('hh-1');
    assert.equal((await c.order(c.a.cookie, { action: 'set-auto', entityId: id, auto: true })).status, 200);
    assert.equal(c.app.state.world.entities[id].auto, true, 'the order was not applied');
    assert.equal(c.saved().world.entities[id].auto, undefined, 'the order was written before the save window: every order pays a write again');
    await delay(SAVE_WITHIN + 400);
    assert.equal(c.saved().world.entities[id].auto, true, 'the order was never written');

    const other = c.principal('hh-2');
    assert.equal((await c.order(c.b.cookie, { action: 'set-auto', entityId: other, auto: true })).status, 200);
    assert.equal((await c.call('/api/command', { id: 'host-pause-order', action: 'end' }, c.host.cookie)).status, 200);
    const written = c.saved();
    assert.equal(written.world.status, 'ended', 'a Host command was answered before it was written');
    assert.equal(written.world.entities[other].auto, true, 'the order before a Host command was not written with it');
  } finally { await c.dispose(); }
});

test('closing the server writes the orders it has shown and not yet written', async () => {
  const c = await classroom({ saveWithinMs: 60000 });
  try {
    const id = c.principal('hh-1');
    assert.equal((await c.order(c.a.cookie, { action: 'set-auto', entityId: id, auto: true })).status, 200);
    assert.equal(c.saved().world.entities[id].auto, undefined);
    await c.app.close();
    assert.equal(c.saved().world.entities[id].auto, true, 'a stopped server lost an order it had shown');
  } finally { await c.dispose(); }
});

test('New Class archives the class as it was last shown, not as it was last written', async () => {
  const c = await classroom({ saveWithinMs: 60000 });
  try {
    const id = c.principal('hh-1');
    assert.equal((await c.order(c.a.cookie, { action: 'set-auto', entityId: id, auto: true })).status, 200);
    const answer = await c.call('/api/command', { id: 'cadence-new-class', action: 'new-class' }, c.host.cookie);
    assert.equal(answer.status, 200, JSON.stringify(answer.body));
    const archived = JSON.parse(readFileSync(join(c.dir, 'archive', answer.body.archived), 'utf8'));
    assert.equal(archived.world.entities[id].auto, true, 'the archive lost an order shown before New Class');
  } finally { await c.dispose(); }
});

test('a timed write that fails puts the class back to its last save, paused and saying so, and a refused order cannot un-pause it', async () => {
  const c = await classroom();
  try {
    const id = c.principal('hh-1');
    const before = c.saved();
    mkdirSync(`${c.savePath}.tmp`);
    assert.equal((await c.order(c.a.cookie, { action: 'set-auto', entityId: id, auto: true })).status, 200);
    for (let i = 0; i < 40 && !c.app.snapshot({ role: 'host' }).fault; i++) await delay(50);
    const fault = c.app.snapshot({ role: 'host' }).fault;
    assert.equal(fault?.code, 'SAVE_FAILED', 'a failed timed write was not reported');
    assert.equal(fault.lastSavedRevision, before.revision);
    assert.equal(c.app.state.world.entities[id].auto, undefined, 'the class was not put back to its last save');
    assert.equal(c.app.state.world.status, 'paused');
    assert.deepEqual(c.saved(), before, 'the last save was touched');
    // Refused while paused: undoing it must not undo the fault's pause.
    assert.equal((await c.order(c.a.cookie, { action: 'set-auto', entityId: id, auto: true })).status, 400);
    assert.equal(c.app.state.world.status, 'paused', 'a refused order un-paused a class paused by a failed save');
    rmdirSync(`${c.savePath}.tmp`);
    assert.equal((await c.call('/api/command', { id: 'cadence-resume-1', action: 'resume' }, c.host.cookie)).status, 200);
    assert.equal(c.app.snapshot({ role: 'host' }).fault, null);
    assert.equal(c.saved().world.status, 'lobby');
  } finally { await c.dispose(); }
});

// Waits for something the server does in its own time (a broadcast `broadcastSoon` holds back, a tick) instead of sleeping a
// guess at how long it takes, as tests/absence.test.mjs does. The limit only turns a hang into the assertion that follows;
// nothing passes because of it.
async function settle(done, limitMs = 30000) {
  const end = performance.now() + limitMs;
  while (!done() && performance.now() < end) await delay(5);
}

// "Was sent nothing" and "was sent one" cannot be waited for, so each step ends on a barrier: a third family's page opening
// or closing changes how many families are here (`connected`), which every page sees, in a broadcast after everything sent
// before it, and a page's frames arrive in the order they were written. What a page was sent in a step is what it was sent
// before that barrier. The steps once slept 500 ms each and failed under a loaded computer (2026-09-19) when the held-back
// broadcast arrived later than that.
test('a page is sent a snapshot when what it sees changed or it sent the order, and every page is sent every tick', async () => {
  const c = await classroom();
  try {
    const third = await c.call('/api/join', { code: c.app.state.sessionCode, name: 'C' });
    const pageA = await c.open(c.a.cookie), pageB = await c.open(c.b.cookie);
    const pages = [pageA, pageB];
    let marks = [0, 0];
    // Waits until both pages have been shown `here` families here, and returns what each was sent since the last barrier and
    // before this one.
    const barrier = async here => {
      const at = () => pages.map((page, p) => page.frames.findIndex((frame, i) => i >= marks[p] && frame.connected === here));
      await settle(() => at().every(i => i !== -1));
      const ends = at();
      assert.ok(ends.every(i => i !== -1), `a page was never shown ${here} families here`);
      const sent = pages.map((page, p) => page.frames.slice(marks[p], ends[p]));
      marks = ends.map(i => i + 1);
      return sent;
    };
    // Both pages open, and the broadcast held back for them has arrived.
    await barrier(2);
    const id = c.principal('hh-1');
    assert.equal((await c.order(c.a.cookie, { action: 'set-auto', entityId: id, auto: true })).status, 200);
    // The order's broadcast has been sent once its sender has it, so the barrier cannot be folded into it.
    await settle(() => pageA.frames.length > marks[0]);
    const pageC = await c.open(third.cookie);
    let [toA, toB] = await barrier(3);
    assert.equal(toA.length, 1, 'the family that gave the order was not shown it');
    assert.equal(toA[0].world.entities.find(one => one.id === id).auto, true);
    assert.equal(toB.length, 0, 'a page whose view did not change was sent the class again');
    // The same order again changes nothing anybody sees; its sender still hears back.
    assert.equal((await c.order(c.a.cookie, { action: 'set-auto', entityId: id, auto: true })).status, 200);
    await settle(() => pageA.frames.length > marks[0]);
    pageC.close();
    [toA, toB] = await barrier(2);
    assert.equal(toA.length, 1, 'the page that sent an order was not answered with a snapshot');
    assert.equal(toB.length, 0);
    // Ticks reach everybody.
    assert.equal((await c.call('/api/command', { id: 'cadence-start-1', action: 'start', anyway: true }, c.host.cookie)).status, 200);
    c.app.setPace(40);
    await settle(() => pages.every(page => page.frames.some(f => f.world.tick >= 4)));
    for (const page of [pageA, pageB]) {
      const ticks = new Set(page.frames.map(f => f.world.tick));
      for (let tick = 1; tick <= 4; tick++) assert.ok(ticks.has(tick), `a page missed tick ${tick}`);
    }
  } finally { await c.dispose(); }
});
