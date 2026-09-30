// The end of the game as a sequence the class goes through together (owner, 2026-09-29, the triage's D10; sim/end-sequence.mjs,
// docs/FLASHBACK.md §11): the class's video on the Host's screen, then each family's own on its own screen, and only then the
// final table and each family's breakdown. Proved here: the stages and what moves them on, the numbers of the ending sent to no
// page before the reveal, what a page may and may not ask, Play Solo beginning at the family's own video, a server with no videos
// going straight to the reveal, a class taken up again losing its sequence, and a class that ended before any of this opening
// at its reveal.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { projectWorld, validateWorld } from '../sim/world.mjs';
import { CLASS_GRACE_MS, CLASS_WAIT_MS, END_MS, MAKE_WAIT_MS, START_MS, advanceEndSequence, beginEndSequence, dueStage, endSequenceStep, endSequenceView, familyStates } from '../sim/end-sequence.mjs';
import { continueEnded } from '../sim/periods.mjs';
import { muxWebM } from '../public/webm-writer.js';
import { createClassroom } from '../server/app.mjs';

const ended = seed => { const world = createGonzalesWorld(seed, 5); world.status = 'ended'; return world; };
const host = world => projectWorld(world, undefined, 'host', { includeMap: false });
const family = (world, id) => projectWorld(world, id, 'student', { includeMap: false });

test('the class video, then the families\' own, then the reveal: what moves each stage on, and when', () => {
  const world = ended('end-seq-stages');
  assert.equal(beginEndSequence(world, { now: 1000 }), true);
  assert.equal(beginEndSequence(world, { now: 2000 }), false, 'a class with a sequence began another');
  assert.equal(world.endSequence.stage, 'class');
  validateWorld(world);
  // The class stage: the video's length and the grace after it was made (or began playing); never made, the wait.
  const video = { madeAt: 5000, durationMs: 150000 };
  assert.equal(dueStage(world, { classVideo: video, families: {} }, 5000 + 150000 + CLASS_GRACE_MS - 1), null);
  assert.equal(dueStage(world, { classVideo: video, families: {} }, 5000 + 150000 + CLASS_GRACE_MS), 'family');
  endSequenceStep(world, { role: 'host' }, 'class-playing', 100000);
  assert.equal(dueStage(world, { classVideo: video, families: {} }, 5000 + 150000 + CLASS_GRACE_MS), null, 'the Host began playing it later, and it was cut short');
  assert.equal(dueStage(world, { classVideo: null, families: {} }, 1000 + CLASS_WAIT_MS - 1), null);
  assert.equal(dueStage(world, { classVideo: null, families: {} }, 1000 + CLASS_WAIT_MS), 'family');
  // The Host's page says it played to its end.
  endSequenceStep(world, { role: 'host' }, 'class-watched', 200000);
  assert.equal(world.endSequence.stage, 'family');
  // The families' stage (owner, 2026-09-30: "there shouldn't be a wait. the videos are supposed to autoplay"): every family's
  // video starts at one moment, once every family whose page is open has its video made, and the stage lasts as long as the longest.
  const facts = { classVideo: video, families: { 'hh-1': { here: true, made: { madeAt: 150000, durationMs: 80000 } }, 'hh-2': { here: true, made: null }, 'hh-3': { here: false, made: null } } };
  assert.deepEqual(familyStates(world.endSequence, facts, 210000), { 'hh-1': 'ready', 'hh-2': 'making', 'hh-3': 'away' });
  assert.equal(advanceEndSequence(world, facts, 210000), null, 'the videos started before an open page\'s video was made');
  assert.equal(world.endSequence.playAt, undefined);
  // The last open page's video made: all start together, START_MS on; a closed page (hh-3) holds nothing.
  facts.families['hh-2'].made = { madeAt: 300000, durationMs: 88000 };
  const change = advanceEndSequence(world, facts, 300000);
  assert.deepEqual(change, { playAt: 300000 + START_MS, endsAt: 300000 + START_MS + 88000 + END_MS }, 'the start is not one moment, or the stage not the longest video');
  assert.equal(world.endSequence.stage, 'family');
  // Every page told the same moment, as time from now, whatever it has said or not said.
  const view = endSequenceView(world, { role: 'student' }, null, 301000);
  assert.equal(view.playIn, START_MS - 1000);
  assert.equal(view.endsIn, START_MS - 1000 + 88000 + END_MS);
  assert.deepEqual(familyStates(world.endSequence, facts, 300000 + START_MS + 85000), { 'hh-1': 'played', 'hh-2': 'playing', 'hh-3': 'away' });
  // Nothing a page says moves it: the stage ends on the server's clock, as long as the longest video and END_MS.
  assert.throws(() => endSequenceStep(world, { role: 'student' }, 'watched', 310000), /Unknown step/);
  assert.equal(dueStage(world, facts, 300000 + START_MS + 88000 + END_MS - 1), null);
  assert.equal(advanceEndSequence(world, facts, 300000 + START_MS + 88000 + END_MS)?.stage, 'reveal');
  // A video never made (the Host's page closed): the stage starts with those made once MAKE_WAIT_MS has gone by.
  const capped = ended('end-seq-cap');
  beginEndSequence(capped, { now: 0, solo: true });
  assert.equal(capped.endSequence.stage, 'family', 'Play Solo has no class video');
  const waiting = { classVideo: null, families: { 'hh-1': { here: true, made: { madeAt: 0, durationMs: 80000 } }, 'hh-2': { here: true, made: null } } };
  assert.equal(advanceEndSequence(capped, waiting, MAKE_WAIT_MS - 1), null);
  assert.deepEqual(advanceEndSequence(capped, waiting, MAKE_WAIT_MS), { playAt: MAKE_WAIT_MS + START_MS, endsAt: MAKE_WAIT_MS + START_MS + 80000 + END_MS });
  // Nobody's page open at all (a Play Solo player's page not yet come): no reveal at once; it waits for a page, MAKE_WAIT_MS at most.
  const empty = ended('end-seq-empty');
  beginEndSequence(empty, { now: 0, solo: true });
  const nobody = { classVideo: null, families: { 'hh-1': { here: false, made: null } } };
  assert.equal(advanceEndSequence(empty, nobody, 1), null, 'the stage ended before any page had opened');
  assert.equal(advanceEndSequence(empty, nobody, MAKE_WAIT_MS)?.stage, 'reveal');
  validateWorld(world); validateWorld(capped);
});

test('no page is sent a number of the ending before the reveal, and every page is at the reveal', () => {
  const world = ended('end-seq-hidden');
  world.households['hh-1'].resources.money = 7;
  world.glory = { 'hh-1': { total: 876543, awards: { 'gonzales:x': { event: 'gonzales', personId: world.households['hh-1'].principalId, role: 'present', miles: 12, points: 876543, minute: 10 } } } };
  const marker = /876543/;
  beginEndSequence(world, { now: 0 });
  for (const stage of ['class', 'family']) {
    world.endSequence.stage = stage;
    assert.equal(host(world).ending, undefined, `the Host was sent the ending at the ${stage} stage`);
    assert.equal(family(world, 'hh-1').ending, undefined, `a family was sent its breakdown at the ${stage} stage`);
    assert.doesNotMatch(JSON.stringify(host(world)), marker, `glory reached the Host at the ${stage} stage`);
    assert.doesNotMatch(JSON.stringify(family(world, 'hh-1')), marker, `glory reached the family at the ${stage} stage`);
  }
  world.endSequence.stage = 'reveal';
  assert.equal(host(world).ending.host.best, 7 * (1 + 876543));
  assert.equal(family(world, 'hh-1').ending.family.glory, 876543);
  // A class that ended before there was a sequence opens at its reveal: it was revealed when it ended.
  delete world.endSequence;
  assert.ok(host(world).ending.host, 'a class ended before the sequence lost its ending');
});

test('what a page may ask of the sequence: the teacher moves it on, and a family\'s page asks nothing', () => {
  const world = ended('end-seq-steps');
  beginEndSequence(world, { now: 0 });
  assert.throws(() => endSequenceStep(world, { role: 'student', householdId: 'hh-1' }, 'skip', 1), /Only the teacher/);
  assert.throws(() => endSequenceStep(world, { role: 'student', householdId: 'hh-1' }, 'restart', 1), /Only the teacher/);
  assert.throws(() => endSequenceStep(world, { role: 'student', householdId: 'hh-1' }, 'class-watched', 1), /teacher's screen/);
  assert.throws(() => endSequenceStep(world, { role: 'student', householdId: 'hh-1' }, 'glory', 1), /Unknown step/);
  // A family says nothing: its video runs on the class's clock (owner, 2026-09-30).
  assert.throws(() => endSequenceStep(world, { role: 'student', householdId: 'hh-1' }, 'watched', 1), /Unknown step/);
  assert.equal(endSequenceStep(world, { role: 'host' }, 'skip', 2), 'family');
  assert.equal(endSequenceStep(world, { role: 'host' }, 'skip', 3), 'reveal');
  assert.equal(endSequenceStep(world, { role: 'host' }, 'skip', 4), 'reveal');
  // Played again from the start: the class video, and nobody has watched anything yet.
  assert.equal(endSequenceStep(world, { role: 'host' }, 'restart', 5), 'class');
  // In Play Solo the player is the class's Host too, and begins again at the family's own video.
  const solo = ended('end-seq-solo');
  beginEndSequence(solo, { now: 0, solo: true });
  assert.equal(endSequenceStep(solo, { role: 'student', householdId: 'hh-1', solo: true }, 'skip', 2), 'reveal');
  assert.equal(endSequenceStep(solo, { role: 'student', householdId: 'hh-1', solo: true }, 'restart', 3), 'family');
  // Not before the end, and not between periods; and a class taken up again drops its sequence.
  const running = createGonzalesWorld('end-seq-running', 5);
  assert.equal(beginEndSequence(running, { now: 0 }), false);
  assert.throws(() => endSequenceStep(running, { role: 'host' }, 'skip', 1), /not ended/);
  continueEnded(world);
  assert.equal(world.endSequence, undefined, 'a class taken up again kept the sequence of its ending');
  // A server that keeps no videos has nothing to play: straight to the reveal.
  const bare = ended('end-seq-bare');
  beginEndSequence(bare, { now: 0, keeps: false });
  assert.equal(bare.endSequence.stage, 'reveal');
  assert.throws(() => endSequenceStep(bare, { role: 'host' }, 'restart', 1), /no videos/);
  // Well formed, or refused.
  bare.endSequence.stage = 'afterwards';
  assert.throws(() => validateWorld(bare), /Invalid end sequence/);
});

/** A class on the invented country, a student in hh-1, started and then ended by the Host, served with a save folder. */
async function room(t, { savePath = true } = {}) {
  const folder = mkdtempSync(join(tmpdir(), 'end-sequence-'));
  // The server's wall clock, moved on by the test (`clock.at`): the end sequence runs on it.
  const clock = { at: Date.now() };
  const app = createClassroom({ seed: 'end-sequence', playerCount: 5, tickMs: 10000, now: () => clock.at, ...(savePath && { savePath: join(folder, 'class.json') }) });
  t.after(async () => { await app.close(); rmSync(folder, { recursive: true, force: true }); });
  const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
  const hostLogin = await fetch(`${url}/api/host`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: app.state.hostKey }) });
  const hostCookie = hostLogin.headers.get('set-cookie').split(';')[0];
  const joined = await fetch(`${url}/api/join`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Reader', code: app.state.sessionCode }) });
  const student = joined.headers.get('set-cookie').split(';')[0];
  const command = (action, extra = {}) => fetch(`${url}/api/command`, { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: hostCookie }, body: JSON.stringify({ id: `cmd-${action}-${Date.now()}-${Math.random().toString(36).slice(2)}`, action, anyway: true, ...extra }) });
  const step = (cookie, name) => fetch(`${url}/api/end-sequence`, { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookie }, body: JSON.stringify({ step: name }) });
  const state = async cookie => (await fetch(`${url}/api/state`, { headers: { Cookie: cookie } })).json();
  // The student's page open: a family whose page is closed is not waited for.
  const stream = new AbortController();
  t.after(() => stream.abort());
  const events = await fetch(`${url}/api/events`, { headers: { Cookie: student }, signal: stream.signal });
  events.body.getReader().read().catch(() => {});
  await command('start');
  await command('end');
  return { app, url, host: hostCookie, student, command, step, state, stream, clock };
}

test('on the server: the Host ends the class, the class video first, the student\'s own next, and the reveal when it has played', async t => {
  const r = await room(t);
  let host = await r.state(r.host), mine = await r.state(r.student);
  assert.equal(host.endSequence.stage, 'class');
  assert.equal(mine.endSequence.stage, 'class');
  assert.equal(host.world.ending, undefined, 'the Host was sent the final table before the videos');
  assert.equal(mine.world.ending, undefined, 'the student was sent the breakdown before the videos');
  assert.ok(host.flashback.classVideo, 'the Host is not told of the class video to make');
  assert.equal(mine.flashback.classVideo, undefined);
  // The class video is the teacher's to make and to watch; it may be two and a half minutes long.
  const video = seconds => muxWebM({ width: 854, height: 480, frames: Array.from({ length: seconds * 20 }, (_, i) => ({ data: new Uint8Array(40).fill(i % 251), timestampMs: i * 50, key: i % 40 === 0 })), durationMs: seconds * 1000 });
  const sendClass = cookie => fetch(`${r.url}/api/flashback/video?household=class&version=1`, { method: 'POST', headers: { Cookie: cookie, 'Content-Type': 'video/webm' }, body: video(150) });
  assert.equal((await sendClass(r.student)).status, 403);
  assert.equal((await sendClass(r.host)).status, 200);
  assert.equal((await fetch(`${r.url}/api/flashback/video?household=class`, { headers: { Cookie: r.student } })).status, 403, 'a student fetched the class video');
  assert.equal((await fetch(`${r.url}/api/flashback/script?household=class`, { headers: { Cookie: r.host } })).status, 200);
  host = await r.state(r.host);
  assert.equal(host.flashback.classVideo.made.durationMs, 150000);
  // A student cannot move the class on.
  assert.equal((await r.step(r.student, 'skip')).status, 400);
  assert.equal((await r.step(r.host, 'class-playing')).status, 200);
  assert.equal((await r.step(r.host, 'class-watched')).status, 200);
  mine = await r.state(r.student);
  assert.equal(mine.endSequence.stage, 'family');
  host = await r.state(r.host);
  assert.deepEqual(host.endSequence.families, [{ householdId: 'hh-1', state: 'making' }], 'the Host is not told where the family stands');
  assert.equal(mine.endSequence.playIn, undefined, 'the family\'s video was given a start before it was made');
  // Its video made: within the server's second, the start is set, START_MS ahead, for every page at once.
  const sendOwn = await fetch(`${r.url}/api/flashback/video?household=hh-1`, { method: 'POST', headers: { Cookie: r.host, 'Content-Type': 'video/webm' }, body: video(85) });
  assert.equal(sendOwn.status, 200);
  const started = Date.now();
  while (Date.now() - started < 5000 && !Number.isFinite((await r.state(r.student)).endSequence.playIn)) await new Promise(resolve => setTimeout(resolve, 200));
  mine = await r.state(r.student);
  assert.equal(mine.endSequence.playIn, START_MS, 'the videos do not start START_MS after the last is made');
  assert.equal(mine.endSequence.endsIn, START_MS + 85000 + END_MS);
  // Nothing the student's page says is needed, or accepted: the stage ends when the longest video has played, and the buffer.
  assert.equal((await r.step(r.student, 'watched')).status, 400);
  r.clock.at += START_MS + 85000 + END_MS - 1000;
  await new Promise(resolve => setTimeout(resolve, 1600));
  assert.equal((await r.state(r.host)).endSequence.stage, 'family', 'the stage ended before the longest video had played');
  r.clock.at += 1000;
  const ending = Date.now();
  while (Date.now() - ending < 5000 && (await r.state(r.host)).endSequence.stage !== 'reveal') await new Promise(resolve => setTimeout(resolve, 200));
  host = await r.state(r.host); mine = await r.state(r.student);
  assert.equal(host.endSequence.stage, 'reveal', 'the stage did not end on the server\'s clock');
  assert.ok(host.world.ending.host.families.length === 5, 'the Host has no final table at the reveal');
  assert.equal(mine.world.ending.family.householdId, 'hh-1', 'the student has no breakdown at the reveal');
  // Played again: the numbers go away again until its reveal.
  assert.equal((await r.step(r.host, 'restart')).status, 200);
  assert.equal((await r.state(r.student)).world.ending, undefined);
  assert.equal((await r.step(r.host, 'skip')).status, 200);
  assert.equal((await r.step(r.host, 'skip')).status, 200);
  assert.ok((await r.state(r.student)).world.ending.family);
  // Taken up again, the class has no sequence; ended again, a new one.
  assert.equal((await r.command('continue-class')).status, 200);
  assert.equal((await r.state(r.host)).endSequence, undefined);
});

test('on a server that keeps no videos the class goes straight to the reveal', async t => {
  const r = await room(t, { savePath: false });
  const host = await r.state(r.host);
  assert.equal(host.endSequence.stage, 'reveal');
  assert.ok(host.world.ending.host);
});
