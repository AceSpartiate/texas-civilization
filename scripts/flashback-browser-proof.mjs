// The end-of-game flashback, made and watched in a real browser (docs/FLASHBACK.md; owner, 2026-09-28: "a 1 minute video
// generated from key points and decisions they made, recorded and saved on the host computer and played back for the student").
//
// A short class on the real land is played headless to its end (tests/support/ended-class.mjs) and handed to a classroom
// server as its save, with one student's family. Then, in headless Chrome:
//   - the Host's page, opened on the ended class, makes every family's video by itself - drawn from the game's own art,
//     encoded frame by frame and sent to the server - and each is on the disk in the class's own folder, a WebM of about a
//     minute (read back by server/webm.mjs) and a sane size;
//   - the student's page plays its own family's video from the server, with the captions below it as words, and cannot fetch
//     another family's;
//   - the Host plays a family's video, and the whole class's in turn.
// Frames of the student's video are photographed into docs/evidence as the proof's pictures.
//
// `--measure 15,30` also makes every video of a class of 15 and of 30 families and reports how long it took on this computer.
//
// Same computer only: headless Chrome. Run: npm run test:flashback
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash, randomBytes } from 'node:crypto';
import { createClassroom } from '../server/app.mjs';
import { readWebmFacts } from '../server/webm.mjs';
import { endedClass } from '../tests/support/ended-class.mjs';
import { meetFamily } from './support/meet-family.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const pass = [];
const ok = label => { pass.push(label); console.log('PASS', label); };
const evidence = { runs: [] };
const measureArg = process.argv.indexOf('--measure');
const measure = measureArg > 0 ? process.argv[measureArg + 1].split(',').map(Number) : [];
const keep = process.argv.includes('--keep');
mkdirSync('docs/evidence', { recursive: true });

/** A classroom on an ended class: its save written as a class that played to the end, with a student in hh-1. */
async function classroomOn(world, label) {
  const folder = mkdtempSync(join(tmpdir(), `flashback-${label}-`));
  const credential = randomBytes(24).toString('hex'), hostKey = randomBytes(24).toString('hex'), sessionId = randomBytes(6).toString('hex');
  const save = { saveVersion: 3, revision: 1, hostKey, sessionId, sessionCode: 'FLASH1', clients: { [createHash('sha256').update(credential).digest('hex')]: { name: 'Flashback reader', householdId: 'hh-1', commands: [] } }, hostCommands: [], world };
  writeFileSync(join(folder, 'class.json'), JSON.stringify(save));
  const app = createClassroom({ savePath: join(folder, 'class.json'), tickMs: 1000 });
  const port = await app.listen(0, '127.0.0.1');
  return { app, folder, credential, hostKey, sessionId, url: `http://127.0.0.1:${port}` };
}

async function hostPage(browser, room, errors) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 950 } });
  const login = await context.request.post(`${room.url}/api/host`, { data: { key: room.hostKey } });
  assert.equal(login.status(), 200, 'the Host could not sign in');
  const page = await context.newPage();
  if (process.env.FLASHBACK_LATENCY) await page.addInitScript(mode => { globalThis.__flashbackLatency = mode; }, process.env.FLASHBACK_LATENCY);
  page.on('pageerror', error => errors.push(`host: ${error.message}`));
  page.on('console', message => { if (message.type() === 'error' && !/Failed to load resource/.test(message.text())) errors.push(`host console: ${message.text()}`); });
  // A request the server refused, by what it asked for (a console line says only that one failed).
  page.on('response', response => { if (response.status() >= 400) errors.push(`host: ${response.status()} ${new URL(response.url()).pathname}`); });
  await page.goto(`${room.url}/host`);
  await page.waitForFunction(() => window.__snapshot?.world?.status === 'ended');
  return page;
}

/** Every family's video made by the Host's page: how long it took, and what is on the disk. */
async function makeAll(page, room, families) {
  const started = Date.now();
  await page.waitForFunction(count => (window.__flashback?.done?.length || 0) + (window.__flashback?.failed?.size || 0) >= count && !window.__flashback.running, families, { timeout: families * 240000, polling: 1000 });
  const seconds = (Date.now() - started) / 1000;
  const made = await page.evaluate(() => ({ done: window.__flashback.done, failed: [...window.__flashback.failed], how: window.__flashback.how, stacks: window.__flashback.stacks || null }));
  if (made.failed.length) console.log('STACKS', JSON.stringify(made.stacks, null, 1));
  assert.deepEqual(made.failed, [], `videos not made: ${JSON.stringify(made.failed)}`);
  const folder = join(room.folder, 'flashbacks', room.sessionId);
  const files = readdirSync(folder).filter(name => name.endsWith('.webm')).sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
  const disk = files.map(name => {
    const bytes = readFileSync(join(folder, name));
    const facts = readWebmFacts(bytes);
    return { file: name, bytes: statSync(join(folder, name)).size, durationMs: facts.durationMs, codec: facts.codec, width: facts.width, height: facts.height, frames: facts.blocks, keyframes: facts.keyframes, lastFrameMs: Math.round(facts.lastBlockMs) };
  });
  return { seconds, made, disk, folder };
}

const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const errors = [];
const rooms = [];
try {
  // ----------------------------------------------------------------------------------------------- a short class, played
  const played = Date.now();
  const world = endedClass('flashback-proof', 5, { played: 2 });
  evidence.class = { families: 5, seconds: Math.round((Date.now() - played) / 100) / 10, ticks: world.tick, events: world.events.length, flights: Object.fromEntries(Object.values(world.households).map(h => [h.id, h.flight?.status || null])) };
  ok(`a class of five families was played headless to its end in ${evidence.class.seconds} s (${world.tick} ticks)`);
  const room = await classroomOn(world, 'proof');
  rooms.push(room);

  // Before anything is made, a student cannot have another family's video or script, nor anybody post one.
  const studentCookie = `tr_student_${room.sessionId}=${room.credential}`;
  const other = await fetch(`${room.url}/api/flashback/script?household=hh-2`, { headers: { Cookie: studentCookie } });
  assert.equal(other.status, 403, 'a student read another family\'s flashback script');
  const posted = await fetch(`${room.url}/api/flashback/video?household=hh-1`, { method: 'POST', headers: { Cookie: studentCookie, 'Content-Type': 'video/webm' }, body: new Uint8Array(64) });
  assert.equal(posted.status, 403, 'a student\'s page was let send a video');
  ok('a student cannot read another family\'s flashback, nor send one in a class');

  // ---------------------------------------------------------------------------------------------- the Host makes them
  const host = await hostPage(browser, room, errors);
  await host.locator('#flashback').waitFor({ state: 'visible', timeout: 30000 });
  const run = await makeAll(host, room, 5);
  evidence.runs.push({ families: 5, ...run, folder: undefined });
  assert.equal(run.disk.length, 5, `expected five videos on disk, found ${run.disk.length}`);
  for (const file of run.disk) {
    assert.ok(Math.abs(file.durationMs - 60000) <= 1500, `${file.file} is ${file.durationMs} ms long`);
    assert.ok(file.bytes > 150 * 1024 && file.bytes < 15 * 1024 * 1024, `${file.file} is ${file.bytes} bytes`);
    assert.equal(file.codec, 'V_VP8');
    assert.ok(file.keyframes >= 25, `${file.file} has ${file.keyframes} keyframes`);
  }
  ok(`the Host's page made all five videos in ${Math.round(run.seconds)} s (${run.made.how}), each about a minute: ${run.disk.map(file => `${file.file} ${Math.round(file.durationMs / 100) / 10} s ${Math.round(file.bytes / 1024)} KB`).join(', ')}`);
  ok(`the videos are on the Host's disk in the class's own folder: ${run.folder}`);
  await host.screenshot({ path: 'docs/evidence/flashback-host.png' });

  // ------------------------------------------------------------------------------------------------ the student plays
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await context.addCookies([{ name: `tr_student_${room.sessionId}`, value: room.credential, url: room.url }]);
  const student = await context.newPage();
  student.on('pageerror', error => errors.push(`student: ${error.message}`));
  await student.goto(room.url);
  await meetFamily(student, 'Flashwright', { timeout: 4000 });
  await student.waitForFunction(() => window.__snapshot?.flashback?.made);
  await student.locator('#flashback-video').waitFor({ state: 'visible', timeout: 30000 });
  await student.waitForFunction(() => { const video = document.querySelector('#flashback-video'); return video.readyState >= 2 && Number.isFinite(video.duration); }, null, { timeout: 30000 });
  const played1 = await student.evaluate(async () => {
    const video = document.querySelector('#flashback-video');
    const start = video.currentTime;
    await new Promise(resolve => setTimeout(resolve, 2500));
    return { src: video.currentSrc, duration: video.duration, advanced: video.currentTime - start, paused: video.paused, width: video.videoWidth, height: video.videoHeight };
  });
  assert.ok(/household=hh-1/.test(played1.src), `the student's page played ${played1.src}`);
  assert.ok(Math.abs(played1.duration - 60) < 1.5, `the student's video is ${played1.duration} s`);
  assert.ok(played1.advanced > 1, 'the student\'s video did not play by itself');
  ok(`the student's page played its own family's video by itself: ${Math.round(played1.duration * 10) / 10} s, ${played1.width}×${played1.height}, ${Math.round(played1.advanced * 10) / 10} s played in 2.5 s`);
  await student.locator('#flashback-transcript li').first().waitFor({ timeout: 15000 });
  const words = await student.locator('#flashback-transcript li').allTextContents();
  assert.ok(words.length >= 10 && words.length <= 15, `${words.length} lines of the story in words`);
  ok(`the captions are below the video as words, ${words.length} lines: "${words[1].slice(0, 90)}…"`);
  // Replay: back to the start, playing.
  await student.locator('#flashback-replay').click();
  const replayed = await student.evaluate(() => new Promise(resolve => setTimeout(() => { const video = document.querySelector('#flashback-video'); resolve({ at: video.currentTime, paused: video.paused }); }, 600)));
  assert.ok(replayed.at < 2 && !replayed.paused, `Replay left the video at ${replayed.at} s`);
  ok('Replay plays it again from the start');
  // Pictures from the video itself, at moments through it.
  const shots = [];
  for (const second of [2, 9, 21, 33, 45, 57]) {
    await student.evaluate(async at => { const video = document.querySelector('#flashback-video'); video.pause(); video.controls = false; video.currentTime = at; await new Promise(resolve => video.addEventListener('seeked', resolve, { once: true })); }, second);
    const path = `docs/evidence/flashback-frame-${String(second).padStart(2, '0')}s.png`;
    await student.locator('#flashback-video').screenshot({ path });
    shots.push(path);
  }
  evidence.frames = shots;
  ok(`frames of the student's video photographed: ${shots.join(', ')}`);
  await student.screenshot({ path: 'docs/evidence/flashback-student.png' });

  // ---------------------------------------------------------------------------------------- the Host plays any, and all
  await host.locator('#flashback-families button').nth(2).click();
  await host.waitForFunction(() => /household=hh-3/.test(document.querySelector('#flashback-video').currentSrc || ''));
  ok('the Host played one family\'s video from the list');
  await host.locator('#flashback-play-all').click();
  await host.waitForFunction(() => /household=hh-1/.test(document.querySelector('#flashback-video').currentSrc || '') && document.querySelector('#flashback-now').textContent.startsWith('Now playing'));
  const next = await host.evaluate(async () => { const video = document.querySelector('#flashback-video'); video.currentTime = video.duration - 0.3; await new Promise(resolve => setTimeout(resolve, 2500)); return video.currentSrc; });
  assert.ok(/household=hh-2/.test(next), `after the first ended the Host played ${next}`);
  ok('Play the whole class in turn goes on to the next family when one ends');

  // -------------------------------------------------------------------------------------------------- measurements
  for (const size of measure) {
    const built = Date.now();
    const big = endedClass(`flashback-measure-${size}`, size, { played: Math.ceil(size / 2) });
    const playSeconds = (Date.now() - built) / 1000;
    const roomBig = await classroomOn(big, `m${size}`);
    rooms.push(roomBig);
    const page = await hostPage(browser, roomBig, errors);
    const result = await makeAll(page, roomBig, size);
    const sizes = result.disk.map(file => file.bytes);
    const summary = { families: size, playSeconds: Math.round(playSeconds), makeSeconds: Math.round(result.seconds), perVideoSeconds: Math.round(result.seconds / size * 10) / 10, mbTotal: Math.round(sizes.reduce((a, b) => a + b, 0) / 1048576 * 10) / 10, mbSmallest: Math.round(Math.min(...sizes) / 1048576 * 100) / 100, mbLargest: Math.round(Math.max(...sizes) / 1048576 * 100) / 100, durations: [Math.min(...result.disk.map(file => file.durationMs)), Math.max(...result.disk.map(file => file.durationMs))], how: result.made.how };
    evidence.runs.push(summary);
    ok(`measured: ${size} families' videos made in ${summary.makeSeconds} s (${summary.perVideoSeconds} s each), ${summary.mbTotal} MB in all, ${summary.mbSmallest}–${summary.mbLargest} MB each`);
    await page.context().close();
  }
  assert.deepEqual(errors, []);
  ok('no page error on either page');
} finally {
  writeFileSync('docs/evidence/flashback-browser.json', JSON.stringify({ at: new Date().toISOString(), pass, errors, ...evidence }, null, 1));
  await browser.close();
  for (const room of rooms) { await room.app.close(); if (!keep) rmSync(room.folder, { recursive: true, force: true }); }
}
console.log(`\n${pass.length} checks passed.`);
