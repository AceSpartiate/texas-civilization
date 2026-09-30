// The end of the game as the class goes through it together, in a real browser (owner, 2026-09-29, the triage's D10 and D8;
// sim/end-sequence.mjs, docs/FLASHBACK.md §11-§12):
//
//   "a flashback video plays from on the classview (unless solo play) showing key highlights from the adventure from the various
//    players points of view. once that's finished players see their own personalized video play on their screens. they see their
//    family return home, see what's left, begin to rebuild if necessary, ceremonially bury lost family members, and then the head
//    of household sits down to count up what they have left. once the last video finishes, the classview reveals the final
//    rankings and the players get to see on their screens a full breakdown of their scores."
//
// A class on the real land is played headless to its end (tests/support/ended-class.mjs), its end sequence begun as the server
// begins it, and handed to a classroom server with two students' families. In headless Chrome, the Host's page and both students':
//   1. the Host's page makes the class's own video first and plays it by itself, large; the students' screens say to look at the
//      class screen; no page has a number of the ending;
//   2. played to its end, every student's page plays its own family's video by itself at the same moment (owner, 2026-09-30: "there
//      shouldn't be a wait. the videos are supposed to autoplay") - the story, then the homecoming's scenes, the farm sold or nothing
//      left to sell - with the story in words; the Host's Controls button opens its own controls over the ending; the Host's screen
//      counts down and says where each family is; a page reloaded in the middle joins where the class is; a page whose browser
//      refuses to start the video gets a large Play button; and nothing waits for any page;
//   3. when the longest video has played its length, the Host's screen shows the final table and the winner, and each student's
//      their breakdown, the farm's sale or the burned farm's glory in it;
//   4. the teacher plays the ending again from the start and skips ahead through it; a student replays their own video;
//   5. Play Solo: no class video, the player's own video, then the breakdown.
// Screenshots of every stage in docs/evidence/end-sequence-*.png. Same computer only: headless Chrome.
//
// Run: npm run test:end-sequence   (PLAYWRIGHT_MODULE and BROWSER_EXECUTABLE as the other proofs)
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash, randomBytes } from 'node:crypto';
import { createClassroom } from '../server/app.mjs';
import { endedClass } from '../tests/support/ended-class.mjs';
import { beginEndSequence } from '../sim/end-sequence.mjs';
import { farmAtEnd } from '../sim/farm-sale.mjs';
import { meetFamily } from './support/meet-family.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const pass = [];
const ok = label => { pass.push(label); console.log('PASS', label); };
const evidence = { shots: [] };
const keep = process.argv.includes('--keep');
mkdirSync('docs/evidence', { recursive: true });
const shot = async (page, name, locator = null) => { await page.evaluate(() => { const finale = document.querySelector('#finale'); if (finale) finale.scrollTop = 0; }); const path = `docs/evidence/end-sequence-${name}.png`; await (locator ? page.locator(locator).screenshot({ path }) : page.screenshot({ path })); evidence.shots.push(path); return path; };

/** A classroom on an ended class whose end sequence has just begun, with a student in each of `students`. */
async function classroomOn(world, label, students, { solo = false } = {}) {
  const folder = mkdtempSync(join(tmpdir(), `end-sequence-${label}-`));
  const hostKey = randomBytes(24).toString('hex'), sessionId = randomBytes(6).toString('hex');
  const credentials = Object.fromEntries(students.map(id => [id, randomBytes(24).toString('hex')]));
  beginEndSequence(world, { now: Date.now(), solo, keeps: true });
  const clients = Object.fromEntries(students.map(id => [createHash('sha256').update(credentials[id]).digest('hex'), { name: `Reader ${id}`, householdId: id, commands: [] }]));
  writeFileSync(join(folder, 'class.json'), JSON.stringify({ saveVersion: 3, revision: 1, hostKey, sessionId, sessionCode: 'ENDSEQ', clients, hostCommands: [], world }));
  const app = createClassroom({ savePath: join(folder, 'class.json'), tickMs: 1000, solo });
  const port = await app.listen(0, '127.0.0.1');
  return { app, folder, credentials, hostKey, sessionId, url: `http://127.0.0.1:${port}` };
}
function watchErrors(page, who, errors) {
  page.on('pageerror', error => errors.push(`${who}: ${error.message}`));
  page.on('console', message => { if (message.type() === 'error' && !/Failed to load resource/.test(message.text())) errors.push(`${who} console: ${message.text()}`); });
}
async function hostPage(browser, room, errors) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  assert.equal((await context.request.post(`${room.url}/api/host`, { data: { key: room.hostKey } })).status(), 200);
  const page = await context.newPage();
  watchErrors(page, 'host', errors);
  await page.goto(`${room.url}/host`);
  await page.waitForFunction(() => window.__snapshot?.world?.status === 'ended');
  return page;
}
async function studentPage(browser, room, householdId, surname, errors) {
  const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  await context.addCookies([{ name: `tr_student_${room.sessionId}`, value: room.credentials[householdId], url: room.url }]);
  const page = await context.newPage();
  watchErrors(page, householdId, errors);
  await page.goto(room.url);
  await meetFamily(page, surname, { timeout: 15000 });
  await page.waitForFunction(() => window.__snapshot?.endSequence);
  return page;
}
const stageOf = page => page.evaluate(() => window.__snapshot?.endSequence?.stage);
const hasEnding = page => page.evaluate(() => Boolean(window.__snapshot?.world?.ending));
/** A video on the page played faster, so the proof does not wait its whole length in real time (the page's own element). */
const hurry = (page, selector, rate = 16) => page.evaluate(({ selector, rate }) => { const video = document.querySelector(selector); video.playbackRate = rate; if (video.paused) video.play().catch(() => {}); }, { selector, rate });
async function playing(page, selector, ms = 2000) {
  return page.evaluate(async ({ selector, ms }) => {
    const video = document.querySelector(selector);
    const start = video.currentTime;
    await new Promise(resolve => setTimeout(resolve, ms));
    return { src: video.currentSrc, duration: video.duration, advanced: video.currentTime - start, hidden: video.hidden || video.closest('[hidden]') !== null, visible: video.getBoundingClientRect().width > 0 };
  }, { selector, ms });
}
/** Frames of a video at the middle of each beat named, photographed. */
async function frames(page, selector, script, kinds, prefix) {
  const out = [];
  for (const beat of script.beats.filter(one => kinds.includes(one.kind))) {
    const at = (beat.startMs + beat.durationMs * 0.6) / 1000;
    // The decoded frame itself, drawn from the video element to a canvas: an element screenshot of a video inside the scrolling
    // overlay caught the page behind it (found 2026-09-30), and this is what the student sees.
    const url = await page.evaluate(async ({ selector, at }) => {
      const video = document.querySelector(selector); video.pause(); video.controls = false; video.currentTime = at;
      await new Promise(resolve => video.addEventListener('seeked', resolve, { once: true }));
      const canvas = document.createElement('canvas'); canvas.width = video.videoWidth; canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0);
      return canvas.toDataURL('image/png');
    }, { selector, at });
    const path = `docs/evidence/end-sequence-${prefix}-${beat.index}-${beat.kind}.png`;
    writeFileSync(path, Buffer.from(url.split(',')[1], 'base64'));
    evidence.shots.push(path); out.push(path);
  }
  return out;
}

const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const errors = [];
const rooms = [];
try {
  // ------------------------------------------------------------------------------------------------ a class, played to its end
  const began = Date.now();
  const world = endedClass('end-sequence-proof', 5, { played: 3, surnames: ['Flashwright', 'Harrowgate'] });
  const reckoned = Object.fromEntries(['hh-1', 'hh-2'].map(id => [id, farmAtEnd(world, world.households[id])]));
  evidence.class = { families: 5, seconds: Math.round((Date.now() - began) / 1000), farms: Object.fromEntries(Object.entries(reckoned).map(([id, farm]) => [id, farm.kind === 'sale' ? `sold for ${farm.total}` : farm.kind])) };
  ok(`a class of five families (three played, two with students) was played headless to its end in ${evidence.class.seconds} s; the students' farms: ${JSON.stringify(evidence.class.farms)}`);
  const room = await classroomOn(world, 'class', ['hh-1', 'hh-2']);
  rooms.push(room);

  // ------------------------------------------------------------------------------------------------ 1. the class's own video
  const host = await hostPage(browser, room, errors);
  const one = await studentPage(browser, room, 'hh-1', 'Flashwright', errors);
  const two = await studentPage(browser, room, 'hh-2', 'Harrowgate', errors);
  for (const page of [host, one, two]) assert.equal(await stageOf(page), 'class');
  for (const page of [host, one, two]) assert.equal(await hasEnding(page), false, 'a page had the ending before the videos');
  await host.locator('#finale').waitFor({ state: 'visible' });
  await one.locator('#finale-title', { hasText: 'Look up at the class screen' }).waitFor();
  await two.locator('#finale-title', { hasText: 'Look up at the class screen' }).waitFor();
  const studentVideos = await one.evaluate(() => [...document.querySelectorAll('video')].filter(video => !video.paused).length);
  assert.equal(studentVideos, 0, 'a student\'s page played a video while the class video was on the class screen');
  await shot(one, '1-student-watch-the-class-screen');
  ok('the class ended: every screen is at the class video; the students\' say to look at the class screen and play nothing; no page has a number of the ending');
  // The Host's page makes the class's video first, and plays it by itself.
  await host.waitForFunction(() => window.__flashback?.done?.some(one => one.householdId === 'class'), null, { timeout: 300000, polling: 1000 });
  const firstMade = await host.evaluate(() => window.__flashback.done[0]);
  assert.equal(firstMade.householdId, 'class', `the Host's page made ${firstMade.householdId} before the class's video`);
  assert.ok(firstMade.durationMs >= 60000 && firstMade.durationMs <= 150000, `the class video is ${firstMade.durationMs} ms`);
  await host.waitForFunction(() => { const video = document.querySelector('#finale-video'); return !video.hidden && /household=class/.test(video.currentSrc) && video.readyState >= 2; }, null, { timeout: 60000 });
  const classPlay = await playing(host, '#finale-video');
  assert.ok(classPlay.advanced > 1 && classPlay.visible, `the class video did not play by itself on the Host: ${JSON.stringify(classPlay)}`);
  ok(`the Host's page made the class's own video first (${Math.round(firstMade.durationMs / 1000)} s, made in ${Math.round(firstMade.madeMs / 1000)} s) and played it by itself, large, on the class screen`);
  await shot(host, '1-host-class-video');
  // Two families' videos made at once while the class video plays (owner, 2026-09-30: "make two at once"), and the class video
  // playing on smoothly beside them: its clock against the wall's, and the frames the browser dropped, over six seconds.
  await host.waitForFunction(() => window.__flashback.now.size >= 2 && !window.__flashback.now.has('class'), null, { timeout: 60000, polling: 100 });
  const beside = await host.evaluate(async () => {
    const video = document.querySelector('#finale-video');
    const q0 = video.getVideoPlaybackQuality(), t0 = video.currentTime, w0 = performance.now();
    const making = new Set(window.__flashback.now.keys());
    let least = window.__flashback.now.size;
    const watch = setInterval(() => { least = Math.min(least, window.__flashback.now.size); }, 100);
    await new Promise(resolve => setTimeout(resolve, 6000));
    clearInterval(watch);
    const q1 = video.getVideoPlaybackQuality();
    return { wall: (performance.now() - w0) / 1000, advanced: video.currentTime - t0, paused: video.paused, dropped: q1.droppedVideoFrames - q0.droppedVideoFrames, frames: q1.totalVideoFrames - q0.totalVideoFrames, making: [...making], least };
  });
  evidence.twoAtOnce = beside;
  assert.equal(beside.making.length, 2, `the Host's page was not making two at once: ${JSON.stringify(beside)}`);
  assert.ok(!beside.paused && beside.advanced >= beside.wall * 0.9, `the class video stalled while two were made: ${beside.advanced.toFixed(2)} s played in ${beside.wall.toFixed(2)} s`);
  assert.ok(beside.dropped <= Math.max(3, beside.frames * 0.1), `the class video dropped ${beside.dropped} of ${beside.frames} frames while two were made`);
  ok(`two families' videos made at once (${beside.making.join(', ')}) while the class video played: ${beside.advanced.toFixed(2)} s of it in ${beside.wall.toFixed(2)} s, ${beside.dropped} of ${beside.frames} frames dropped`);
  const classScript = (await (await host.context().request.get(`${room.url}/api/flashback/script?household=class`)).json()).script;
  evidence.classVideo = { durationMs: classScript.durationMs, beats: classScript.beats.map(beat => `${beat.kind}: ${beat.caption}`) };
  const classFrames = await frames(host, '#finale-video', classScript, ['arrival', 'fight', 'news', 'flight', 'burned', 'home'], 'class-frame');
  ok(`frames of the class video photographed: ${classFrames.length}`);
  // Played to its end (faster than real time): the class goes on to the families' own videos.
  await host.evaluate(() => { const video = document.querySelector('#finale-video'); video.currentTime = Math.max(0, video.duration - 3); });
  await hurry(host, '#finale-video', 4);
  for (const page of [host, one, two]) await page.waitForFunction(() => window.__snapshot?.endSequence?.stage === 'family', null, { timeout: 60000 });
  const classEnded = await host.evaluate(() => window.__finale.classEnded);
  ok('when the class video had played to its end, every screen went on to the families\' own videos');

  // ------------------------------------------------------------------------------------------------ 2. every family's own, at once
  // The teacher's own controls during the ending (owner, 2026-09-30: "Controls button"), opened over it without leaving it.
  await host.locator('#finale-controls').click();
  const controls = await host.evaluate(() => {
    const shown = [...document.querySelectorAll('#hud-right button')].filter(one => one.getBoundingClientRect().width > 0 && getComputedStyle(one).visibility !== 'hidden');
    const on = shown.filter(one => { const r = one.getBoundingClientRect(); return one.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)); });
    return { shown: shown.map(one => one.textContent.trim()), onTop: on.map(one => one.textContent.trim()), finale: !document.querySelector('#finale').hidden, stage: window.__snapshot.endSequence.stage };
  });
  assert.ok(controls.onTop.length && controls.onTop.length === controls.shown.length, `the Host's controls are not over the ending: ${JSON.stringify(controls)}`);
  assert.ok(controls.finale, 'opening the controls left the ending');
  await shot(host, '2-host-controls');
  await host.locator('#finale-controls').click();
  assert.equal(await host.evaluate(() => document.body.dataset.finaleControls || ''), '');
  ok(`the Controls button opens the teacher's own controls over the ending, which goes on (${controls.onTop.join(', ')}), and closes them`);
  // Every family's video starts by itself on its student's page at the same moment (owner, 2026-09-30).
  for (const page of [one, two]) await page.waitForFunction(() => window.__finale?.started, null, { timeout: 400000, polling: 500 });
  const starts = await Promise.all([one, two].map(page => page.evaluate(() => window.__finale.started)));
  const apart = Math.abs(starts[0].wall - starts[1].wall);
  assert.ok(apart < 1500, `the families' videos started ${apart} ms apart`);
  // Never before the class video had finished (owner, 2026-09-30); the families' made so far that their START_MS was past start
  // as it ends, the rest START_MS after the last was made.
  const afterClass = Math.min(...starts.map(one => one.wall)) - classEnded;
  assert.ok(afterClass >= -300, `a family's video started ${-afterClass} ms before the class video had finished`);
  const lastMadeWall = await host.evaluate(() => Math.max(...window.__flashback.done.filter(one => ['hh-1', 'hh-2'].includes(one.householdId)).map(one => one.at || 0)));
  evidence.start = { afterClassMs: afterClass, lastMadeBeforeClassEndMs: classEnded - lastMadeWall };
  ok(`the families' videos started ${(afterClass / 1000).toFixed(1)} s after the class video finished (their last made ${((classEnded - lastMadeWall) / 1000).toFixed(1)} s before it finished)`);
  for (const [page, id] of [[one, 'hh-1'], [two, 'hh-2']]) {
    const own = await playing(page, '#finale-slot #flashback-video');
    assert.ok(own.advanced > 1 && own.visible, `${id}'s own video did not play by itself: ${JSON.stringify(own)}`);
    assert.ok(new RegExp(`household=${id}`).test(own.src), `${id}'s page played ${own.src}`);
    assert.ok(own.duration > 70 && own.duration < 95, `${id}'s video is ${own.duration} s`);
    assert.equal(await hasEnding(page), false);
  }
  // When the stage ends, as the page worked it out when the start came (its own clock, the server's `endsIn`).
  const stageEnds = await one.evaluate(() => window.__finale.clock.endWall);
  ok(`both students' own videos started by themselves ${apart} ms apart, over the whole screen, without a word from either page (${Math.round((await one.evaluate(() => document.querySelector('#finale-slot #flashback-video').duration)))} and ${Math.round((await two.evaluate(() => document.querySelector('#finale-slot #flashback-video').duration)))} s)`);
  await shot(one, '2-student-own-video');
  await host.waitForFunction(() => /are playing: the final numbers in \d+ s/.test(document.querySelector('#finale-words').textContent), null, { timeout: 5000 });
  const hostWords = await host.locator('#finale-families li').allTextContents();
  assert.ok(hostWords.length === 2 && hostWords.every(line => /watching|has seen it/.test(line)), `the Host's screen does not say where each family is: ${hostWords}`);
  await shot(host, '2-host-families-watching');
  ok(`the Host's screen counts down to the final numbers and says where each family is: ${hostWords.join('; ')}`);
  // A page reloaded in the middle starts where the class is, not at the beginning.
  await two.reload();
  await two.waitForFunction(() => window.__finale?.started, null, { timeout: 30000 });
  const rejoined = await two.evaluate(() => window.__finale.started);
  assert.ok(rejoined.from > 3, `the reloaded page started at ${rejoined.from} s, not where the class is`);
  ok(`a student's page reloaded in the middle joined its video where the class is (${rejoined.from} s in)`);
  // A browser that will not start a video by itself: the large Play button, which starts it where the class is; nothing waits.
  await one.context().addInitScript(() => {
    const real = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () { if (this.id === 'flashback-video' && !window.__refusedOnce) { window.__refusedOnce = true; return Promise.reject(new DOMException('The user has not interacted with the page.', 'NotAllowedError')); } return real.call(this); };
  });
  await one.reload();
  await one.locator('#finale-play').waitFor({ state: 'visible', timeout: 30000 });
  await shot(one, '2-student-play-button');
  assert.equal(await stageOf(host), 'family');
  await one.locator('#finale-play').click();
  const pressed = await playing(one, '#finale-slot #flashback-video');
  assert.ok(pressed.advanced > 1 && pressed.visible, `the Play button did not play the video: ${JSON.stringify(pressed)}`);
  assert.equal(await one.locator('#finale-play').isVisible(), false);
  ok(`autoplay refused (the page's play() rejected, as a browser's policy would): a large Play button, pressed, played the video from ${Math.round(await one.evaluate(() => document.querySelector('#finale-slot #flashback-video').currentTime))} s, where the class is`);
  // The homecoming's scenes, photographed from the students' own videos, and said in words below them.
  const oneScript = (await (await one.context().request.get(`${room.url}/api/flashback/script?household=hh-1`)).json()).script;
  const twoScript = (await (await two.context().request.get(`${room.url}/api/flashback/script?household=hh-2`)).json()).script;
  const words = await one.locator('#finale-slot #flashback-transcript li').allTextContents();
  assert.ok(words.some(line => /sat down at the table to count/.test(line)), 'the story in words has no counting at the table');
  ok(`the story in words below the video, ${words.length} lines, ends with the counting at the table`);
  const scenes = [...await frames(one, '#finale-slot #flashback-video', oneScript, ['home', 'rebuild', 'burial', 'count', 'sale'], 'scene-hh-1'),
    ...await frames(two, '#finale-slot #flashback-video', twoScript, ['home', 'rebuild', 'burial', 'count', 'sale'], 'scene-hh-2')];
  const kinds = new Set([...oneScript.beats, ...twoScript.beats].filter(beat => beat.epilogue).map(beat => beat.kind));
  for (const kind of ['home', 'count']) assert.ok(kinds.has(kind), `no ${kind} scene`);
  evidence.homecoming = Object.fromEntries([['hh-1', oneScript], ['hh-2', twoScript]].map(([id, script]) => [id, script.beats.filter(beat => beat.epilogue).map(beat => `${beat.kind}: ${beat.caption}`)]));
  for (const [id, script] of [['hh-1', oneScript], ['hh-2', twoScript]]) {
    const sale = script.beats.find(beat => beat.kind === 'sale'), count = script.beats.find(beat => beat.kind === 'count');
    if (reckoned[id].kind === 'sale') assert.ok(sale && sale.caption.includes(`for ${reckoned[id].total} reales`), `${id}'s farm was not sold in its video at the ending's price`);
    if (reckoned[id].kind === 'burned') assert.ok(!sale && /nothing left of it to sell/.test(count.caption), `${id}'s burned farm was sold`);
  }
  ok(`the homecoming's scenes (${[...kinds].join(', ')}) photographed: ${scenes.length} frames; the farm sold where it stands and nothing to sell where it burned`);
  // The reveal on the server's clock: the longest video's length and the buffer, whatever the pages did (they were paused, sought,
  // reloaded and refused here), and not before.
  assert.equal(await stageOf(host), 'family', 'the class was revealed before the longest video had played');
  for (const page of [host, one, two]) await page.waitForFunction(() => window.__snapshot?.endSequence?.stage === 'reveal', null, { timeout: Math.max(30000, stageEnds - Date.now() + 20000) });
  const late = Date.now() - stageEnds;
  assert.ok(late > -2000, `the reveal came ${-late} ms before the stage's end`);
  ok(`the reveal came on the server's clock, ${Math.round(late / 100) / 10} s after the stage's stated end (the server looks each second): no page's word was waited for`);

  // ------------------------------------------------------------------------------------------------ 3. the reveal
  await host.locator('#ending').waitFor({ state: 'visible', timeout: 15000 });
  await host.waitForFunction(() => document.querySelector('#finale').hidden);
  const winner = await host.locator('.ending-winner').textContent();
  assert.match(winner, /finished first/);
  const rows = await host.locator('.ending-table tbody tr').count();
  assert.equal(rows, 5);
  await shot(host, '3-host-final-rankings');
  ok(`at the reveal the class screen showed the final table (${rows} families) and the winner: "${winner}"`);
  for (const [page, id] of [[one, 'hh-1'], [two, 'hh-2']]) {
    await page.locator('#ending').waitFor({ state: 'visible', timeout: 15000 });
    const sum = await page.locator('#ending .ending-said').first().textContent();
    const farm = reckoned[id];
    if (farm.kind === 'sale') assert.match(sum, new RegExp(`sold the farm for ${farm.total} reales`), `${id}'s breakdown has no sale: ${sum}`);
    if (farm.kind === 'burned') {
      assert.match(sum, /The farm was burned, so there was nothing to sell/);
      assert.ok((await page.locator('#ending .ending-awards li').allTextContents()).some(line => /A burned farm counts \d+ glory/.test(line)), `${id}'s breakdown has no line for the burned farm`);
    }
    await shot(page, `3-student-breakdown-${id}`);
    ok(`${id}'s screen shows its full breakdown: "${sum.slice(0, 140)}…"`);
  }
  // The student replays their own video after the reveal, in the ending panel.
  await one.locator('#flashback-replay').click();
  const replay = await playing(one, '#flashback-video', 1200);
  assert.ok(replay.advanced > 0.3, `the student's replay did not play: ${JSON.stringify(replay)}`);
  ok('a student replays their own video after the reveal');

  // ------------------------------------------------------------------------------------------------ 4. played again, skipped
  await host.locator('#flashback-host summary').click();
  await host.locator('#flashback-again').click();
  await host.locator('#flashback-again', { hasText: 'Play it all again' }).waitFor();
  await host.locator('#flashback-again').click();
  for (const page of [host, one, two]) await page.waitForFunction(() => window.__snapshot?.endSequence?.stage === 'class', null, { timeout: 15000 });
  for (const page of [host, one, two]) assert.equal(await hasEnding(page), false, 'the numbers stayed on a screen when the ending was played again');
  await host.waitForFunction(() => { const video = document.querySelector('#finale-video'); return !video.hidden && !video.paused; }, null, { timeout: 30000 });
  ok('the teacher played the ending again from the start: the class video on the class screen, the numbers gone from every screen');
  await host.locator('#finale-skip').click();
  for (const page of [host, one, two]) await page.waitForFunction(() => window.__snapshot?.endSequence?.stage === 'family', null, { timeout: 15000 });
  await host.locator('#finale-skip', { hasText: 'final numbers' }).waitFor();
  await host.locator('#finale-skip').click();
  for (const page of [host, one, two]) await page.waitForFunction(() => window.__snapshot?.endSequence?.stage === 'reveal' && window.__snapshot.world.ending, null, { timeout: 15000 });
  ok('the teacher skipped ahead, stage by stage, to the final numbers');
  // A student cannot skip.
  const refused = await one.evaluate(async () => (await fetch('/api/end-sequence', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ step: 'skip' }) })).status);
  assert.equal(refused, 400);
  ok('a student\'s page cannot move the class on');

  // ------------------------------------------------------------------------------------------------ 5. Play Solo
  const soloWorld = endedClass('end-sequence-solo', 5, { played: 1 });
  const soloRoom = await classroomOn(soloWorld, 'solo', ['hh-1'], { solo: true });
  rooms.push(soloRoom);
  const solo = await studentPage(browser, soloRoom, 'hh-1', 'Flashwright', errors);
  assert.equal(await stageOf(solo), 'family', 'Play Solo began anywhere but the player\'s own video');
  assert.equal(await solo.evaluate(() => Boolean(window.__snapshot.flashback.classVideo)), false);
  await solo.waitForFunction(() => window.__flashback?.done?.length || window.__flashback?.failed?.size, null, { timeout: 300000, polling: 1000 });
  assert.equal(await solo.evaluate(() => window.__flashback.done[0]?.householdId), 'hh-1', 'the solo page made something else first');
  await solo.waitForFunction(() => { const video = document.querySelector('#finale-slot #flashback-video'); return video && !video.hidden && video.readyState >= 2; }, null, { timeout: 60000 });
  // It starts at the stage's own moment, START_MS after it was made (sim/end-sequence.mjs), not the moment it has loaded.
  await solo.waitForFunction(() => window.__finale?.started, null, { timeout: 60000 });
  assert.equal(await stageOf(solo), 'family', 'Play Solo left the player\'s own video before it started');
  const soloPlay = await playing(solo, '#finale-slot #flashback-video');
  assert.ok(soloPlay.advanced > 1);
  await shot(solo, '4-solo-own-video');
  ok('Play Solo: no class video; the player\'s page made its own family\'s video and played it by itself');
  await solo.waitForFunction(() => window.__snapshot?.endSequence?.stage === 'reveal' && window.__snapshot.world.ending?.family, null, { timeout: 180000 });
  await solo.locator('#ending').waitFor({ state: 'visible', timeout: 15000 });
  await shot(solo, '4-solo-breakdown');
  ok('Play Solo: when its video had played its length, the player\'s screen showed the full breakdown');

  assert.deepEqual(errors.filter(line => !/\b(409|404)\b/.test(line)), []);
  ok('no page error on any page');
} finally {
  writeFileSync('docs/evidence/end-sequence-browser.json', JSON.stringify({ at: new Date().toISOString(), pass, errors, ...evidence }, null, 1));
  await browser.close();
  for (const room of rooms) { await room.app.close(); if (!keep) rmSync(room.folder, { recursive: true, force: true }); }
}
console.log(`\n${pass.length} checks passed.`);
