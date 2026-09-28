// Several classes on one computer (2026-09-28, docs/audits/2026-09-28-classroom.md B6): a teacher with several sections
// keeps each one's class and opens any of them again. Until then New Class archived the class it replaced where nothing
// could ever open it again, so period 2's class and period 4's could not both be played across the days of the game.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readdirSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { createClassroom } from '../server/app.mjs';

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
const command = (caller, action, extra = {}) => caller.call('/api/command', { id: `cmd-${Math.random().toString(36).slice(2)}${Date.now()}`, action, ...extra });

test('New Class keeps the class it replaces, and the Host opens either again with its students, keys and place', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'texas-classes-'));
  const savePath = join(dir, 'classroom.json');
  let app = createClassroom({ seed: 'classes', savePath, tickMs: 40, playerCount: 6 });
  let port = await app.listen(0, '127.0.0.1');
  try {
    let host = client(port);
    await host.call('/api/host', { key: app.state.hostKey });
    const second = [];
    for (let i = 0; i < 5; i++) { const student = client(port); await student.call('/api/join', { name: `Second ${i}`, code: app.state.sessionCode }); second.push(student); }
    const secondId = app.state.sessionId, secondCode = app.state.sessionCode;
    const secondKey = (await second[2].call('/api/state')).body.familyKey;
    await command(host, 'start');
    await delay(200);
    // A running class is never put away from under its students.
    const running = await command(host, 'new-class', { name: 'Period 4' });
    assert.equal(running.status, 400);
    assert.match(running.body.error, /Pause this class first/);
    await command(host, 'pause');
    const pausedAt = app.state.world.minute;
    const made = await command(host, 'new-class', { name: 'Period 4', size: 8 });
    assert.equal(made.status, 200, made.body.error);
    const fourthId = app.state.sessionId;
    assert.notEqual(fourthId, secondId);
    assert.equal(app.state.className, 'Period 4');
    assert.equal(app.state.world.playerCount, 8, 'the size the teacher asked for');
    assert.equal(app.state.world.status, 'lobby');
    assert.ok(existsSync(join(dir, 'classes', `${secondId}.json`)), 'the class put away is kept');
    // The previous class's students are not in this one.
    assert.equal((await second[0].call('/api/state')).status, 401);
    const fourth = client(port);
    await fourth.call('/api/join', { name: 'Fourth 0', code: app.state.sessionCode });

    const listed = (await host.call('/api/classes')).body.classes;
    assert.deepEqual(listed.map(entry => [entry.id, entry.open, entry.name]), [[fourthId, true, 'Period 4'], [secondId, false, null]]);
    const kept = listed[1];
    assert.equal(kept.code, secondCode);
    assert.equal(kept.joined, 5);
    assert.equal(kept.families, 6);
    assert.equal(kept.status, 'paused');
    assert.match(kept.date, /^September \d+, 1835$/);

    // The next day: the server was stopped and started again, and the teacher opens period 2's class.
    await app.close();
    app = createClassroom({ seed: 'classes', savePath, tickMs: 40, playerCount: 6 });
    port = await app.listen(0, '127.0.0.1');
    host = client(port);
    await host.call('/api/host', { key: app.state.hostKey });
    assert.equal(app.state.sessionId, fourthId, 'the class open when the server stopped opens with it');
    const opened = await command(host, 'open-class', { classId: secondId });
    assert.equal(opened.status, 200, opened.body.error);
    const state = app.state;
    assert.equal(state.sessionId, secondId);
    assert.equal(state.sessionCode, secondCode, 'the same class code');
    assert.equal(state.world.status, 'paused', 'opened paused, where it was left');
    assert.equal(state.world.minute, pausedAt);
    assert.equal(Object.keys(state.clients).length, 5);
    // The same students, on the same devices, reconnect to the same families; and a family key is the same key.
    for (const [index, student] of second.entries()) {
      const again = client(port);
      for (const [name, value] of student.jar) again.jar.set(name, value);
      assert.equal((await again.call('/api/state')).body.world.householdId, `hh-${index + 1}`);
    }
    assert.equal((await client(port).call('/api/rejoin', { key: secondKey })).body.world.householdId, 'hh-3');
    // The Host keeps working without the launcher, and period 4's class is on the list to open again.
    assert.equal(host.jar.has(`tr_host_${secondId}`), true);
    const after = (await host.call('/api/classes')).body.classes;
    assert.deepEqual(after.map(entry => [entry.id, entry.open]), [[secondId, true], [fourthId, false]]);
    assert.equal(after[1].joined, 1);
    assert.equal(JSON.parse(readFileSync(savePath, 'utf8')).sessionId, secondId, 'the open class is the save the launcher reads');
    await command(host, 'resume');
    await delay(150);
    assert.ok(app.state.world.minute > pausedAt, 'and it plays on');
    // Opening the class that is open, or one that is not there, is refused in words.
    await command(host, 'pause');
    assert.match((await command(host, 'open-class', { classId: secondId })).body.error, /already open/);
    assert.match((await command(host, 'open-class', { classId: 'nothere12345' })).body.error, /not there/);
    assert.match((await command(host, 'open-class', { classId: '../classroom' })).body.error, /not a saved class/);
    // Back to period 4, with its one student.
    assert.equal((await command(host, 'open-class', { classId: fourthId })).status, 200);
    assert.equal(app.state.className, 'Period 4');
    assert.equal(Object.keys(app.state.clients).length, 1);
    assert.equal(readdirSync(join(dir, 'classes')).filter(file => file.endsWith('.json')).length, 2, 'two classes, two files');
  } finally { await app.close(); rmSync(dir, { recursive: true, force: true }); }
});

test('an unnamed class nobody joined is not kept, and a student only ever reaches the class that is open', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'texas-classes-empty-'));
  const app = createClassroom({ seed: 'classes-empty', savePath: join(dir, 'classroom.json'), tickMs: 40, playerCount: 5 });
  const port = await app.listen(0, '127.0.0.1');
  try {
    const host = client(port);
    await host.call('/api/host', { key: app.state.hostKey });
    const empty = app.state.sessionId;
    assert.equal((await command(host, 'new-class')).status, 200);
    assert.equal(existsSync(join(dir, 'classes', `${empty}.json`)), false, 'nothing to keep');
    assert.deepEqual((await host.call('/api/classes')).body.classes.map(entry => entry.id), [app.state.sessionId]);
    // A student with the old code gets nowhere.
    const student = client(port);
    assert.equal((await student.call('/api/classes')).status, 401);
    const named = await command(host, 'new-class', { name: '  Period   6  ' });
    assert.equal(named.status, 200);
    assert.equal(app.state.className, 'Period 6', 'spaces tidied');
    assert.equal((await student.call('/api/join', { name: 'Sam', code: app.state.sessionCode })).status, 200);
    assert.equal((await student.call('/api/classes')).status, 403, 'only the teacher sees the list of classes');
  } finally { await app.close(); rmSync(dir, { recursive: true, force: true }); }
});
