// Several classes on one computer (2026-09-28, docs/audits/2026-09-28-classroom.md B6): a teacher with several sections
// keeps each one's class and opens any of them again. Until then New Class archived the class it replaced where nothing
// could ever open it again, so period 2's class and period 4's could not both be played across the days of the game.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, renameSync, rmSync, readdirSync, readFileSync, existsSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { createClassroom } from '../server/app.mjs';
import { continueEnded, continueRefusal } from '../sim/periods.mjs';

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

/** The world as it stands, less what End Game and Continue themselves change: its status and the Host's own record of it. */
const worldApartFromTheEnd = world => {
  const lifecycle = world.events.filter(event => event.type === 'lifecycle').length;
  return JSON.stringify({ ...world, status: null, nextEventId: world.nextEventId - lifecycle, events: world.events.filter(event => event.type !== 'lifecycle') });
};

test('a class ended part-way through a period is continued from Classes where it was, paused; its ending and flashbacks go', async () => {
  // Owner, 2026-09-28: "Yes, allow Continue" (docs/HOST_PAGE.md §2.8).
  const dir = mkdtempSync(join(tmpdir(), 'texas-continue-'));
  const savePath = join(dir, 'classroom.json');
  const app = createClassroom({ seed: 'continue', savePath, tickMs: 40, playerCount: 5 });
  const port = await app.listen(0, '127.0.0.1');
  try {
    const host = client(port), students = [];
    await host.call('/api/host', { key: app.state.hostKey });
    for (let i = 0; i < 5; i++) { const student = client(port); await student.call('/api/join', { name: `Family ${i}`, code: app.state.sessionCode }); students.push(student); }
    await command(host, 'start');
    await delay(200);
    // Not ended: nothing to continue.
    const live = await command(host, 'continue-class');
    assert.equal(live.status, 400);
    assert.match(live.body.error, /has not ended/);
    await command(host, 'pause');
    const before = worldApartFromTheEnd(app.state.world), minute = app.state.world.minute;
    assert.equal((await command(host, 'end')).status, 200);
    assert.equal(app.state.world.status, 'ended');
    assert.notEqual(app.state.world.director?.complete, true, 'the class came to its own end, not End Game\'s');
    // End Game begins the end sequence (owner, 2026-09-29, D10; sim/end-sequence.mjs): the class video first, the ending at its reveal.
    let ended = (await host.call('/api/state')).body;
    assert.equal(ended.endSequence?.stage, 'class', 'End Game did not begin the end sequence');
    assert.equal(ended.world.ending, undefined, 'the ending was shown before the videos');
    for (let i = 0; i < 2; i++) assert.equal((await host.call('/api/end-sequence', { step: 'skip' })).status, 200);
    ended = (await host.call('/api/state')).body;
    assert.ok(ended.world.ending?.host, 'End Game showed no ending');
    assert.equal(ended.flashback?.ready, true, 'End Game did not make the flashbacks ready');
    const listed = (await host.call('/api/classes')).body.classes.find(one => one.open);
    assert.equal(listed.continuable, true, 'the Classes list does not offer the class ended part-way to be continued');
    // A video made for that ending, as the Host's page would have kept it.
    const videos = join(dir, 'flashbacks', app.state.sessionId);
    mkdirSync(videos, { recursive: true });
    writeFileSync(join(videos, 'hh-1.webm'), 'a video of the ending that was');
    writeFileSync(join(videos, 'hh-1.json'), JSON.stringify({ householdId: 'hh-1', bytes: 30, durationMs: 60000 }));
    // Only the teacher continues a class.
    assert.equal((await command(students[0], 'continue-class', { entityId: 'hh-1-parent-1' })).status, 400);
    assert.equal(app.state.world.status, 'ended');

    const again = await command(host, 'continue-class');
    assert.equal(again.status, 200, again.body.error);
    assert.equal(app.state.world.status, 'paused', 'the class was not taken up again paused');
    assert.equal(worldApartFromTheEnd(app.state.world), before, 'the class taken up again is not the class as it was the moment before End Game');
    assert.equal(app.state.world.minute, minute);
    assert.ok(app.state.world.events.some(event => event.type === 'lifecycle' && event.visibility === 'host'), 'the Host\'s record does not say the class was taken up again');
    assert.equal(JSON.parse(readFileSync(savePath, 'utf8')).world.status, 'paused', 'the save still holds the class ended');
    const shown = (await host.call('/api/state')).body;
    assert.equal(shown.world.ending, undefined, 'the ending is still shown to the Host');
    assert.equal(shown.flashback, undefined, 'the flashbacks are still offered');
    assert.equal((await students[0].call('/api/state')).body.world.ending, undefined, 'the ending is still shown to a student');
    assert.equal(existsSync(videos), false, 'the flashback made for the mistaken ending was kept');
    assert.equal((await host.call('/api/classes')).body.classes.find(one => one.open).continuable, false);
    assert.equal((await command(host, 'continue-class')).status, 400, 'a class was continued twice');

    // Resumed, it goes on from where it was; ended again, it ends afresh, with no video of the first ending.
    assert.equal((await command(host, 'resume')).status, 200);
    await delay(200);
    assert.ok(app.state.world.minute > minute, 'the class did not go on');
    await command(host, 'end');
    // A new end sequence, from the class video again, skipped to its reveal.
    assert.equal((await host.call('/api/state')).body.endSequence?.stage, 'class', 'ended again, it did not begin the end afresh');
    for (let i = 0; i < 2; i++) await host.call('/api/end-sequence', { step: 'skip' });
    const endedAgain = (await host.call('/api/state')).body;
    assert.ok(endedAgain.world.ending?.host, 'ended again, it showed no ending');
    assert.ok(endedAgain.flashback.families.every(family => !family.made), 'the first ending\'s video came back');
  } finally { await app.close(); rmSync(dir, { recursive: true, force: true }); }
});

test('a class that came to its own end is not continued: a period goes on by its own button, the war not at all', () => {
  assert.equal(continueRefusal({ status: 'running', director: { complete: false } }), 'This class has not ended.');
  assert.equal(continueRefusal({ status: 'ended', director: { complete: false } }), null);
  assert.match(continueRefusal({ status: 'ended', director: { complete: true }, map: { source: 'colonies' }, period: 1 }), /own end|Continue to the winter/);
  assert.match(continueRefusal({ status: 'ended', director: { complete: true } }), /came to its own end/);
  const world = { status: 'ended', director: { complete: true }, events: [], nextEventId: 1, tick: 0, minute: 0 };
  assert.throws(() => continueEnded(world), /came to its own end/);
  assert.equal(world.status, 'ended');
});

test('a kept class is deleted from the list into the archive with its flashbacks, never the open one, and put back by hand', async () => {
  // Owner, 2026-09-28: "Yes, with a confirm" (docs/HOST_PAGE.md §2.9; docs/RECOVERY.md, "A deleted class").
  const dir = mkdtempSync(join(tmpdir(), 'texas-delete-'));
  const savePath = join(dir, 'classroom.json');
  const app = createClassroom({ seed: 'delete', savePath, tickMs: 40, playerCount: 5 });
  const port = await app.listen(0, '127.0.0.1');
  try {
    const host = client(port), student = client(port);
    await host.call('/api/host', { key: app.state.hostKey });
    await student.call('/api/join', { name: 'Sam', code: app.state.sessionCode });
    const kept = app.state.sessionId;
    // Its flashbacks, as the Host's page keeps them.
    const videos = join(dir, 'flashbacks', kept);
    mkdirSync(videos, { recursive: true });
    writeFileSync(join(videos, 'hh-1.webm'), 'a video');
    writeFileSync(join(videos, 'hh-1.json'), '{}');
    assert.equal((await command(host, 'new-class', { name: 'Period 7' })).status, 200);
    const open = app.state.sessionId;
    assert.ok(existsSync(join(dir, 'classes', `${kept}.json`)), 'the class put away was not kept');

    // Never the class that is open, never a student, never a class that is not there.
    const refusedOpen = await command(host, 'delete-class', { classId: open });
    assert.equal(refusedOpen.status, 400);
    assert.match(refusedOpen.body.error, /That class is open/);
    const newcomer = client(port);
    await newcomer.call('/api/join', { name: 'Ana', code: app.state.sessionCode });
    assert.equal((await command(newcomer, 'delete-class', { classId: kept })).status, 400, 'a student deleted a class');
    assert.equal((await command(host, 'delete-class', { classId: 'no-such-class' })).status, 400);
    assert.ok(existsSync(join(dir, 'classes', `${kept}.json`)));

    const deleted = await command(host, 'delete-class', { classId: kept });
    assert.equal(deleted.status, 200, deleted.body.error);
    const { save, flashbacks } = deleted.body.deleted;
    assert.match(save, new RegExp(`^archive/classes-${kept}-deleted-[\\w-]+\\.json$`), `the save went to ${save}`);
    assert.equal(flashbacks, save.replace(/\.json$/, '-flashbacks'));
    assert.equal(existsSync(join(dir, 'classes', `${kept}.json`)), false, 'the class is still on the shelf');
    assert.equal(JSON.parse(readFileSync(join(dir, save), 'utf8')).sessionId, kept, 'the save in the archive is not the class');
    assert.ok(existsSync(join(dir, flashbacks, 'hh-1.webm')), 'the flashbacks were not kept with it');
    assert.equal(existsSync(videos), false, 'the flashbacks were left behind');
    assert.ok(!(await host.call('/api/classes')).body.classes.some(one => one.id === kept), 'the deleted class is still listed');
    assert.equal(app.state.sessionId, open, 'deleting a class changed the class that is open');

    // Put back as RECOVERY says: the save into classes/<session>.json and the flashbacks into flashbacks/<session>.
    renameSync(join(dir, save), join(dir, 'classes', `${kept}.json`));
    renameSync(join(dir, flashbacks), videos);
    assert.ok((await host.call('/api/classes')).body.classes.some(one => one.id === kept), 'the class put back is not listed');
    assert.equal((await command(host, 'open-class', { classId: kept })).status, 200, 'the class put back cannot be opened');
    assert.equal(app.state.sessionId, kept);
    assert.equal((await student.call('/api/state')).status, 200, 'its student cannot come back to it');
  } finally { await app.close(); rmSync(dir, { recursive: true, force: true }); }
});
