// The flashback's videos, on the server's side (docs/FLASHBACK.md §4-5): the WebM the Host's page writes (public/webm-writer.js)
// as the server reads it back (server/webm.mjs), and the routes that take a family's video, keep it in the class's own folder
// and serve it - to the Host any family's, to a student their own only, never before the class has ended, never too big, too
// short or not a video.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { muxWebM, sizeBytes } from '../public/webm-writer.js';
import { readWebmFacts } from '../server/webm.mjs';
import { FLASHBACK_LIMITS } from '../server/flashback.mjs';
import { createClassroom } from '../server/app.mjs';

/** A video's worth of made-up VP8 frames: `seconds` at 20 a second, a keyframe every forty. */
function frames(seconds, { every = 40, bytes = 300 } = {}) {
  return Array.from({ length: seconds * 20 }, (_, i) => ({ data: Uint8Array.from({ length: bytes }, (_, j) => (i * 31 + j) % 251), timestampMs: i * 50, key: i % every === 0 }));
}
const video = (seconds, options = {}) => muxWebM({ width: 854, height: 480, frames: frames(seconds, options), durationMs: seconds * 1000, title: 'Test family' });

test('the WebM written is the WebM read: its codec, size, length, frames and keyframes', () => {
  const bytes = video(60);
  const facts = readWebmFacts(bytes);
  assert.equal(facts.docType, 'webm');
  assert.equal(facts.codec, 'V_VP8');
  assert.deepEqual([facts.width, facts.height], [854, 480]);
  assert.equal(facts.durationMs, 60000);
  assert.equal(facts.declaredDuration, true);
  assert.equal(facts.blocks, 1200);
  assert.equal(facts.keyframes, 30);
  assert.equal(facts.lastBlockMs, 59950);
  // EBML sizes: the shortest that holds the number, all ones kept for "unknown".
  assert.deepEqual([...sizeBytes(0)], [0x80]);
  assert.deepEqual([...sizeBytes(126)], [0xfe]);
  assert.deepEqual([...sizeBytes(127)], [0x40, 0x7f]);
});

test('a live recorder\'s WebM - no duration, and a Segment of unknown size - is read by its last frame', () => {
  const whole = muxWebM({ width: 854, height: 480, frames: frames(45), durationMs: null });
  // The Segment's size said as "unknown", as MediaRecorder writes it.
  const at = whole.indexOf(0x18, 20);
  assert.deepEqual([...whole.subarray(at, at + 4)], [0x18, 0x53, 0x80, 0x67]);
  const sizeLength = 8 - Math.floor(Math.log2(whole[at + 4]));
  const segmentLive = [...whole.subarray(0, at + 4), 0x01, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, ...whole.subarray(at + 4 + sizeLength)];
  // And every Cluster's size "unknown" too: each runs to the next Cluster, as a live recorder writes them.
  const live = [];
  for (let i = 0; i < segmentLive.length; i++) {
    if (segmentLive[i] === 0x1f && segmentLive[i + 1] === 0x43 && segmentLive[i + 2] === 0xb6 && segmentLive[i + 3] === 0x75) {
      live.push(0x1f, 0x43, 0xb6, 0x75, 0x01, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff);
      i += 4 + (8 - Math.floor(Math.log2(segmentLive[i + 4]))) - 1;
    } else live.push(segmentLive[i]);
  }
  const facts = readWebmFacts(live);
  assert.equal(facts.declaredDuration, false);
  assert.equal(facts.durationMs, 44950);
  assert.equal(facts.blocks, 900);
});

test('what is not a WebM video is said to be so', () => {
  assert.match(readWebmFacts(new Uint8Array(200)).error, /not a WebM/);
  assert.match(readWebmFacts(Buffer.from('{"not":"a video"}')).error, /not a WebM/);
  assert.throws(() => muxWebM({ width: 1, height: 1, frames: [{ data: new Uint8Array(4), timestampMs: 0, key: false }], durationMs: 1000 }), /keyframe/);
});

/** A class on the invented country, a student in hh-1, ended by the Host: the flashback's routes, end to end. */
async function endedRoom(t) {
  const folder = mkdtempSync(join(tmpdir(), 'flashback-routes-'));

  const app = createClassroom({ seed: 'flashback-routes', playerCount: 5, tickMs: 5000, savePath: join(folder, 'class.json') });
  t.after(async () => { await app.close(); rmSync(folder, { recursive: true, force: true }); });
  const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
  const hostLogin = await fetch(`${url}/api/host`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: app.state.hostKey }) });
  const host = hostLogin.headers.get('set-cookie').split(';')[0];
  const joined = await fetch(`${url}/api/join`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Reader', code: app.state.sessionCode }) });
  const student = joined.headers.get('set-cookie').split(';')[0];
  const command = action => fetch(`${url}/api/command`, { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: host }, body: JSON.stringify({ id: `cmd-${action}-${Date.now()}`, action, anyway: true }) });
  return { app, url, host, student, folder, command };
}
const send = (room, cookie, household, body, type = 'video/webm') => fetch(`${room.url}/api/flashback/video?household=${household}`, { method: 'POST', headers: { Cookie: cookie, 'Content-Type': type }, body });

test('the flashback routes answer nothing before the class has ended', async t => {
  const room = await endedRoom(t);
  await room.command('start');
  assert.equal((await fetch(`${room.url}/api/flashback/script?household=hh-1`, { headers: { Cookie: room.host } })).status, 409);
  assert.equal((await send(room, room.host, 'hh-1', video(60))).status, 409);
  assert.equal((await (await fetch(`${room.url}/api/state`, { headers: { Cookie: room.host } })).json()).flashback, undefined, 'the snapshot spoke of flashbacks before the end');
});

test('a family\'s video is kept in the class\'s own folder and served to the Host and to that family alone', async t => {
  const room = await endedRoom(t);
  await room.command('start');
  await room.command('end');
  const state = await (await fetch(`${room.url}/api/state`, { headers: { Cookie: room.host } })).json();
  assert.equal(state.flashback.ready, true);
  assert.equal(state.flashback.keeps, true);
  assert.equal(state.flashback.families.length, 5);
  assert.ok(state.flashback.families.every(family => family.made === null));
  // The script: the Host any family's, the student their own and no other.
  const script = await (await fetch(`${room.url}/api/flashback/script?household=hh-3`, { headers: { Cookie: room.host } })).json();
  assert.ok(script.script.beats.length >= 2 && script.script.durationMs === 60000);
  assert.equal((await fetch(`${room.url}/api/flashback/script`, { headers: { Cookie: room.student } })).status, 200);
  assert.equal((await fetch(`${room.url}/api/flashback/script?household=hh-2`, { headers: { Cookie: room.student } })).status, 403);
  // What is refused: not a video, too short, too big, a family the class does not have, and a student's page in a class.
  assert.equal((await send(room, room.host, 'hh-1', Buffer.from('{}'), 'application/json')).status, 415);
  assert.equal((await send(room, room.host, 'hh-1', new Uint8Array(4096))).status, 415);
  assert.equal((await send(room, room.host, 'hh-1', video(8))).status, 422);
  assert.equal((await send(room, room.host, 'hh-1', new Uint8Array(FLASHBACK_LIMITS.maxBytes + 1024))).status, 413);
  assert.equal((await send(room, room.host, 'hh-99', video(60))).status, 404);
  assert.equal((await send(room, room.student, 'hh-1', video(60))).status, 403);
  assert.equal((await fetch(`${room.url}/api/flashback/video?household=hh-1`, { headers: { Cookie: room.student } })).status, 404, 'a video nobody made was served');
  // Made: on the disk, beside the save, in this class's folder.
  const bytes = video(60);
  const saved = await send(room, room.host, 'hh-1', bytes);
  assert.equal(saved.status, 200);
  const note = await saved.json();
  assert.equal(note.durationMs, 60000);
  const sessionId = room.app.state.sessionId;
  const path = join(room.folder, 'flashbacks', sessionId, 'hh-1.webm');
  assert.ok(existsSync(path));
  assert.deepEqual(new Uint8Array(readFileSync(path)), bytes);
  // Served: whole to its own family, and a range of it (a replay or a seek).
  const own = await fetch(`${room.url}/api/flashback/video?household=hh-1`, { headers: { Cookie: room.student } });
  assert.equal(own.status, 200);
  assert.equal(own.headers.get('content-type'), 'video/webm');
  assert.deepEqual(new Uint8Array(await own.arrayBuffer()), bytes);
  const part = await fetch(`${room.url}/api/flashback/video?household=hh-1`, { headers: { Cookie: room.student, Range: 'bytes=100-199' } });
  assert.equal(part.status, 206);
  assert.deepEqual(new Uint8Array(await part.arrayBuffer()), bytes.subarray(100, 200));
  assert.equal((await fetch(`${room.url}/api/flashback/video?household=hh-1`, { headers: { Cookie: room.host } })).status, 200);
  // Not to another family's student, and the snapshot says it is made.
  await send(room, room.host, 'hh-2', video(60));
  assert.equal((await fetch(`${room.url}/api/flashback/video?household=hh-2`, { headers: { Cookie: room.student } })).status, 403);
  const after = await (await fetch(`${room.url}/api/state`, { headers: { Cookie: room.student } })).json();
  assert.equal(after.flashback.householdId, 'hh-1');
  assert.equal(after.flashback.made.durationMs, 60000);
  assert.equal(after.flashback.families, undefined, 'a student was told of other families\' videos');
  // A new class keeps the last class's videos in its own folder and starts its own.
  await room.command('new-class');
  assert.notEqual(room.app.state.sessionId, sessionId);
  assert.ok(existsSync(path), 'a new class threw away the last one\'s videos');
});
