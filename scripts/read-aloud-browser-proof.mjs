// Read aloud in a real browser (owner, 2026-09-30, D15: natural voices, never the stock browser voice, made on the host computer
// and streamed to the players; docs/READ_ALOUD.md). The real voice runs: Kokoro-82M through runtime/voice, the package's own
// sentences from public/voice (node scripts/build-voice.mjs), and a fresh Host cache, so every sentence not in the package is
// spoken on this computer while the proof waits.
//
// A Play Solo game on the real land, fifteen families, seed q6: the player's family lives near San Felipe, and the first
// rider with the word from Gonzales is met by its daughter Effie. Proved here:
//
//   1. a tip read aloud: its button reached with the keyboard, its sentences the package's (nothing spoken on the Host), each
//      fetched as Ogg Opus and played to its end; the tip's own "Got it" still reached and its words still letting a click through;
//   2. the rider's first line read aloud in the rider's voice (a man's: am_fenrir): the sentences naming where he came from and
//      who gave him the word are spoken on the Host, the button says "Getting ready…" until they are, and then it plays;
//   3. the question read aloud in its asker's own voice - a woman's (af_kore) or a man's - since the rider's scenes (2026-10-05) have whoever of the scene ask it;
//   4. one line at a time: a second button pressed stops the first;
//   4b. the end of the game (owner, 2026-09-30: "Yes, add it"): a button on every part of the family's breakdown, and its
//      story read to its end, a line asked at a time, the sentences with its names spoken on the Host, none refused;
//   5. the Sound setting: sound off, the button says so and plays nothing;
//   6. never the browser's own voice: speechSynthesis is never spoken to.
//
// Same computer only: headless Chrome. Run: npm run test:read-aloud
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { createClassroom } from '../server/app.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { rollFamily, stepWorld } from '../sim/world.mjs';
import { createVoice } from '../server/voice/service.mjs';
import { VOICES, keyOf, splitSentences } from '../server/voice/text.mjs';
import { meetFamily } from './support/meet-family.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = fileURLToPath(new URL('..', import.meta.url));
const pass = [];
const ok = label => { pass.push(label); console.log('PASS', label); };
const measured = {};
const shots = [];
mkdirSync('docs/evidence', { recursive: true });
const shot = async (page, name) => { const path = `docs/evidence/read-aloud-${name}.png`; await page.screenshot({ path }); shots.push(path); };

const packageDir = join(root, 'public', 'voice');
if (!existsSync(join(packageDir, 'manifest.json'))) throw new Error('No package voice: run node scripts/build-voice.mjs first.');
const packaged = JSON.parse(readFileSync(join(packageDir, 'manifest.json'), 'utf8')).lines;
const cacheDir = mkdtempSync(join(tmpdir(), 'read-aloud-proof-'));
// No lines begun by the server on its own (`soonCap: 0`): each sentence the package lacks is made only when pressed, so the
// button's "Getting ready…" is seen every run. That the server begins a rider's words as they are said is proved by
// tests/read-aloud-server.test.mjs; here, the voice itself, the wait and the playing.
const voice = createVoice({ runtimeDir: join(root, 'runtime', 'voice'), packageDir, cacheDir, threads: 2, soonCap: 0 });
if (!voice.hostVoice) throw new Error('No voice in runtime/voice: run node scripts/bundle-voice.mjs first.');

// Stepped in process to a few ticks before the rider reaches the family (as scripts/one-rider-browser-proof.mjs does).
function beforeTheRider(_seed, count) {
  const world = createGonzalesWorld('q6', count, { map: 'colonies', neighbours: true });
  for (const household of Object.values(world.households)) rollFamily(world, household);
  world.status = 'running';
  world.households['hh-1'].played = true;
  const coming = () => Object.values(world.entities).find(one => one.report?.inPerson && one.report.audience === 'hh-1' && one.report.destination === one.report.homeSiteId && one.travel);
  for (let t = 0; t < 2000; t++) {
    const rider = coming();
    if (rider && rider.travel.distance - rider.travel.progress < rider.travel.speed * 3) break;
    stepWorld(world);
  }
  if (!coming()) throw new Error('q6: no rider on his last leg to the first family');
  delete world.households['hh-1'].played;
  return world;
}
const app = createClassroom({ seed: 'read-aloud', playerCount: 15, tickMs: 200, solo: true, worldFactory: beforeTheRider, voice });
const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
const browser = await chromium.launch({ headless: true, args: ['--autoplay-policy=no-user-gesture-required'], ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const errors = [];
const until = async (label, check, ms = 60000) => {
  const start = Date.now();
  while (Date.now() - start < ms) { if (await check()) return; await new Promise(resolve => setTimeout(resolve, 250)); }
  throw new assert.AssertionError({ message: `timed out: ${label}` });
};
/** Every sound fetched, as the network saw it. */
const fetched = [];

try {
  const game = app.newSoloGame('Read aloud');
  const student = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  student.on('pageerror', error => errors.push(`student: ${error.message}`));
  student.on('response', response => { const match = /\/voice\/([0-9a-f]{32})\.opus$/.exec(response.url()); if (match) fetched.push({ key: match[1], status: response.status(), type: response.headers()['content-type'] || '' }); });
  // The browser's own voice, watched: the owner refused it, so nothing may ever be spoken through it.
  await student.addInitScript(() => {
    window.__stock = 0;
    if (window.speechSynthesis) { const speak = window.speechSynthesis.speak.bind(window.speechSynthesis); window.speechSynthesis.speak = utterance => { window.__stock++; return speak(utterance); }; }
    // Each <audio> play, with what it played and whether it played to its end.
    window.__plays = [];
    const play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () { const entry = { src: this.src || this.currentSrc, ended: false, volume: this.volume }; window.__plays.push(entry); this.addEventListener('ended', () => { entry.ended = true; entry.duration = this.duration; }, { once: true }); return play.call(this); };
  });
  await student.goto(url + game.path);
  await student.waitForFunction(() => window.__snapshot?.world?.householdId === 'hh-1', null, { timeout: 30000 });
  await meetFamily(student);
  if (await student.locator('#journal-close').isVisible()) await student.locator('#journal-close').click();
  await student.locator('#wagon-done').waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
  if (await student.locator('#wagon-done').isVisible()) await student.locator('#wagon-done').click();
  await student.waitForFunction(() => window.__snapshot.world.status === 'running', null, { timeout: 30000 });
  await student.waitForFunction(() => window.__readAloud?.available === true, null, { timeout: 15000 });
  // Sound on at the student's own quiet level (public/audio-mix.js `STUDENT_MASTER`), as a class starts.
  measured.volumeSetting = await student.evaluate(() => JSON.parse(localStorage.getItem('tr-audio:solo') || 'null'));

  // ------------------------------------------------------------------ 1. a tip, from the package
  await until('a tip on the screen', () => student.evaluate(() => Boolean(window.__tip) && !document.querySelector('#tip').hidden));
  const tipId = await student.evaluate(() => window.__tip);
  const tipText = await student.evaluate(() => document.querySelector('#tip .tip-words').textContent);
  const tipKeys = splitSentences(tipText).map(sentence => keyOf('narrator', sentence));
  assert.ok(tipKeys.every(key => packaged[key]), `the tip "${tipId}" is not all in the package: node scripts/build-voice.mjs`);
  const spokenBefore = voice.stats.spoken;
  await student.locator('#tip .read-aloud').focus();
  assert.equal(await student.evaluate(() => document.activeElement?.classList.contains('read-aloud')), true, 'the keyboard cannot reach the tip\'s read-aloud button');
  await student.keyboard.press('Enter');
  await until('the tip read to its end', () => student.evaluate(n => window.__readAloud.ended >= 1 && window.__readAloud.played.length >= n, tipKeys.length), 30000);
  const tipPlays = await student.evaluate(() => window.__plays.map(one => ({ ...one })));
  for (const key of tipKeys) {
    assert.ok(fetched.some(one => one.key === key && one.status === 200 && /^audio\/ogg/.test(one.type)), `the tip's sentence ${key} was not fetched as Ogg Opus`);
    assert.ok(tipPlays.some(one => one.src.endsWith(`/voice/${key}.opus`) && one.ended), `the tip's sentence ${key} was not played to its end`);
  }
  assert.ok(!voice.stats.log.some(one => tipKeys.includes(one.key)), 'the Host spoke a sentence of the tip the package holds');
  measured.hostSpokeMeanwhile = voice.stats.spoken - spokenBefore;
  const tipLayout = await student.evaluate(() => {
    const tip = document.querySelector('#tip'), words = tip.querySelector('.tip-words').getBoundingClientRect(), close = tip.querySelector('.tip-close').getBoundingClientRect();
    const at = (x, y) => document.elementFromPoint(x, y);
    return { passesThrough: at((words.left + words.right) / 2, (words.top + words.bottom) / 2)?.id === 'world-map', closeReached: tip.querySelector('.tip-close').contains(at((close.left + close.right) / 2, (close.top + close.bottom) / 2)), button: (() => { const b = tip.querySelector('.read-aloud').getBoundingClientRect(); return { width: Math.round(b.width), height: Math.round(b.height) }; })() };
  });
  assert.equal(tipLayout.passesThrough, true, 'the tip\'s words no longer let a click through to the map');
  assert.equal(tipLayout.closeReached, true, '"Got it" is covered');
  assert.ok(tipLayout.button.height >= 36, `the read-aloud button is ${tipLayout.button.height}px tall, too small to tap`);
  measured.tip = { id: tipId, sentences: tipKeys.length, fromPackage: true, played: tipPlays.filter(one => one.ended).length, volume: tipPlays[0]?.volume, layout: tipLayout };
  await shot(student, 'tip');
  ok(`a tip ("${tipId}", ${tipKeys.length} sentences) read aloud from the keyboard: every sentence the package's, fetched as Ogg Opus and played to its end at volume ${tipPlays[0]?.volume?.toFixed(2)}; nothing spoken on the Host; "Got it" and the click-through untouched`);
  await student.locator('#tip .tip-close').click();

  // ------------------------------------------------------------------ 2. the rider, in a man's voice, made on the Host
  await until('the rider reaching the family', () => Object.values(app.state.world.encounters || {}).some(one => one.householdId === 'hh-1' && one.status === 'open'), 120000);
  const encounter = Object.values(app.state.world.encounters).find(one => one.householdId === 'hh-1' && one.status === 'open');
  const listener = app.state.world.entities[encounter.listenerId];
  measured.rider = { carrier: encounter.carrierName, listener: listener.name, listenerSex: listener.sex || listener.kin?.role };
  await student.waitForFunction(() => window.__snapshot?.world?.encounter?.status === 'open', null, { timeout: 15000 });
  await student.locator(`.panel-row[data-entity-id="${encounter.listenerId}"] .panel-attention`).click({ force: true });
  await student.waitForFunction(() => !document.querySelector('#encounter').hidden && document.querySelectorAll('#encounter-said li:not([data-pending])').length >= 1, null, { timeout: 10000 });
  // Held still while the lines are read, as a student may pause Play Solo: the rider would otherwise ride on.
  await student.locator('[data-solo="solo-pause"]').click();
  await student.waitForFunction(() => window.__snapshot?.world?.status === 'paused', null, { timeout: 10000 });
  const opening = encounter.said[0].text;
  const riderKeys = splitSentences(opening).map(sentence => keyOf('rider', sentence));
  const riderMade = riderKeys.filter(key => !packaged[key]);
  const before = await student.evaluate(() => window.__readAloud.ended);
  const riderButton = student.locator('#encounter-said li[data-speaker="rider"] .read-aloud').first();
  await riderButton.click();
  // What the button says while the Host speaks the sentences the package cannot hold.
  const states = new Set();
  const sampleStart = Date.now();
  while (Date.now() - sampleStart < 90000) {
    const now = await student.evaluate(before => ({ state: document.querySelector('#encounter-said li[data-speaker="rider"] .read-aloud')?.dataset.state, words: document.querySelector('#encounter-said li[data-speaker="rider"] .read-aloud .read-aloud-words')?.textContent, ended: window.__readAloud.ended > before }), before);
    states.add(`${now.state}:${now.words}`);
    if (now.ended) break;
    await student.waitForTimeout(100);
  }
  const riderPlays = await student.evaluate(() => window.__plays.map(one => ({ ...one })));
  for (const key of riderKeys) assert.ok(riderPlays.some(one => one.src.endsWith(`/voice/${key}.opus`) && one.ended), `the rider's sentence ${key} was not played to its end`);
  const riderLog = voice.stats.log.filter(one => riderKeys.includes(one.key));
  assert.equal(riderLog.length, riderMade.length, 'the Host did not speak exactly the rider\'s sentences the package lacks');
  assert.ok(riderMade.length >= 1, 'the rider\'s opening had nothing for the Host to make: the proof proves nothing about "Getting ready"');
  // Made when the student pressed, and not before: the button said so while it waited.
  assert.ok(riderLog.every(one => one.priority === 'pressed'), 'a rider\'s sentence was made before it was pressed');
  assert.ok([...states].includes('waiting:Getting ready…'), `the button never said "Getting ready…" while the Host spoke: ${[...states].join(', ')}`);
  assert.ok([...states].includes('playing:Stop'), `the button never said "Stop" while it played: ${[...states].join(', ')}`);
  assert.equal(VOICES.rider.id, 'am_fenrir');
  measured.riderLine = { text: opening, sentences: riderKeys.length, madeOnHost: riderMade.length, hostLog: riderLog, states: [...states], voice: VOICES.rider.id };
  await shot(student, 'rider');
  ok(`the rider's opening read in the rider's voice (${VOICES.rider.id}, a man's): ${riderKeys.length} sentences, ${riderMade.length} spoken on the Host (${riderLog.map(one => `${one.priority}, ${Math.round(one.tookMs)} ms`).join('; ')}), the button ${[...states].map(one => `"${one.split(':')[1]}"`).join(' then ')}; each fetched and played to its end`);

  // ------------------------------------------------------------------ 3. the question, in its asker's voice
  await student.locator('[data-solo="solo-resume"]').click();
  await student.waitForFunction(() => window.__snapshot?.world?.status === 'running', null, { timeout: 10000 });
  await student.locator('#encounter-asks .ask-option').first().click();
  await student.waitForFunction(() => document.querySelectorAll('#encounter-said li[data-speaker="listener"]').length >= 1, null, { timeout: 15000 });
  await student.locator('[data-solo="solo-pause"]').click();
  await student.waitForFunction(() => window.__snapshot?.world?.status === 'paused', null, { timeout: 10000 });
  // Since the rider's scenes (2026-10-05) a question is asked by whoever of the scene the page names on it, and read in that
  // person's own voice: a woman's for a woman or a girl, a man's for a man or a boy (public/read-aloud.js `voiceOfPerson`).
  const { asked, askerSex } = await student.evaluate(() => {
    const world = window.__snapshot.world, line = world.encounter.said.find(one => one.speaker === 'listener');
    const person = world.entities.find(one => one.id === line.speakerId) || world.encounter.scene?.cast?.[line.speakerId];
    return { asked: line.text, askerSex: person?.sex || null };
  });
  const askedVoice = askerSex === 'female' ? 'woman' : 'man';
  const womanKeys = splitSentences(asked).map(sentence => keyOf(askedVoice, sentence));
  const beforeWoman = await student.evaluate(() => window.__readAloud.ended);
  await student.locator('#encounter-said li[data-speaker="listener"] .read-aloud').first().click();
  await until('the daughter\'s question read to its end', () => student.evaluate(n => window.__readAloud.ended > n, beforeWoman), 60000);
  const womanPlays = await student.evaluate(() => window.__plays.map(one => ({ ...one })));
  for (const key of womanKeys) assert.ok(womanPlays.some(one => one.src.endsWith(`/voice/${key}.opus`) && one.ended), `the question's sentence ${key} was not played in the ${askedVoice}'s voice`);
  const pressedVoice = await student.evaluate(() => window.__readAloud.pressed.at(-1).lines.map(line => line.voice));
  assert.ok(askerSex, 'the question\'s asker is nobody the page knows');
  assert.deepEqual(pressedVoice, [askedVoice], `the question was asked in the voice ${pressedVoice}, by somebody ${askerSex}`);
  measured.womanLine = { text: asked, askerSex, voice: VOICES[askedVoice].id, fromPackage: womanKeys.every(key => packaged[key]) };
  ok(`the question ("${asked}") read in its asker's own voice, a ${askedVoice}'s (${VOICES[askedVoice].id})${measured.womanLine.fromPackage ? ', from the package' : ''}`);

  // ------------------------------------------------------------------ 4. one line at a time
  await student.locator('#encounter-said li[data-speaker="rider"] .read-aloud').first().click();
  await student.waitForFunction(() => document.querySelector('#encounter-said li[data-speaker="rider"] .read-aloud')?.dataset.state === 'playing', null, { timeout: 30000 });
  await student.locator('#encounter-said li[data-speaker="listener"] .read-aloud').first().click();
  await student.waitForTimeout(300);
  const one = await student.evaluate(() => ({ rider: document.querySelector('#encounter-said li[data-speaker="rider"] .read-aloud').dataset.state, daughter: document.querySelector('#encounter-said li[data-speaker="listener"] .read-aloud').dataset.state }));
  assert.equal(one.rider, 'idle', 'the rider went on reading after the daughter\'s line was pressed');
  assert.ok(['playing', 'waiting'].includes(one.daughter));
  await student.locator('#encounter-said li[data-speaker="listener"] .read-aloud').first().click();
  assert.equal(await student.evaluate(() => document.querySelector('#encounter-said li[data-speaker="listener"] .read-aloud').dataset.state), 'idle', 'pressing a reading button again does not stop it');
  ok('one line at a time: pressing the daughter\'s line stopped the rider\'s, and pressing it again stopped it');
  await student.locator('#encounter-said li[data-speaker="listener"] .read-aloud').first().click().catch(() => {});
  // The conversation put away, so nothing stands over the breakdown's controls.
  await student.locator('#encounter-close').click();
  await student.waitForFunction(() => document.querySelector('#encounter').hidden, null, { timeout: 10000 });

  // ------------------------------------------------------------------ 4b. the end of the game (owner, 2026-09-30: "Yes, add it")
  // The teacher ends the class; this server keeps no videos, so it goes straight to the families' breakdowns.
  const hostCookie = (await fetch(`${url}/api/host`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: app.state.hostKey }) })).headers.get('set-cookie').split(';')[0];
  const asHost = (path, body) => fetch(url + path, { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: hostCookie }, body: JSON.stringify(body) });
  const ended = await asHost('/api/command', { id: `read-aloud-end-${Date.now()}`, action: 'end' });
  assert.equal(ended.status, 200, `End Game: ${await ended.text()}`);
  for (let i = 0; i < 2; i++) await asHost('/api/end-sequence', { step: 'skip' }).catch(() => {});
  await student.waitForFunction(() => window.__snapshot?.world?.status === 'ended' && Boolean(window.__snapshot.world.ending?.family), null, { timeout: 60000 });
  await student.locator('#ending').waitFor({ state: 'visible', timeout: 30000 });
  await student.waitForFunction(() => [...document.querySelectorAll('#ending .read-aloud')].some(one => !one.hidden), null, { timeout: 15000 });
  const endingButtons = await student.evaluate(() => [...document.querySelectorAll('#ending .read-aloud')].filter(one => !one.hidden).map(one => one.closest('h2, h3')?.firstChild?.textContent));
  assert.ok(endingButtons.includes('Our story') && endingButtons.includes('What earned glory'), `the breakdown's parts have no read-aloud buttons: ${endingButtons.join(', ')}`);
  const beforeStory = await student.evaluate(() => ({ ended: window.__readAloud.ended, asked: window.__readAloud.asked.length, played: window.__readAloud.played.length }));
  const storyLog = voice.stats.log.length;
  await student.locator('#ending h3', { hasText: 'Our story' }).locator('.read-aloud').click();
  await until('the family\'s story read to its end', () => student.evaluate(n => window.__readAloud.ended > n, beforeStory.ended), 300000);
  const story = await student.evaluate(before => ({ asked: window.__readAloud.asked.slice(before.asked), played: window.__readAloud.played.slice(before.played), pressed: window.__readAloud.pressed.at(-1), skipped: window.__readAloud.skipped || 0 }), beforeStory);
  const storyLines = story.pressed.lines.length;
  assert.ok(storyLines >= 2, 'the story read was a line or less');
  assert.ok(story.asked.length >= storyLines && story.asked.every(one => one.of >= 1), 'the story was not asked for a line at a time');
  assert.ok(story.played.length >= storyLines, `the story's ${storyLines} lines played ${story.played.length} sentences`);
  assert.equal(story.skipped, 0, 'a sentence of the story was refused by the Host');
  const storyMade = voice.stats.log.slice(storyLog);
  measured.ending = { buttons: endingButtons, storyLines, sentencesPlayed: story.played.length, madeOnHost: storyMade.length, hostMs: storyMade.map(one => Math.round(one.tookMs)), skipped: story.skipped };
  await shot(student, 'ending');
  ok(`the end of the game: a read-aloud button on every part of the family's breakdown (${endingButtons.join(', ')}); "Our story" read to its end - ${storyLines} lines asked one at a time, ${story.played.length} sentences played, ${storyMade.length} spoken on the Host, none refused`);

  // ------------------------------------------------------------------ 5. Sound off
  const fetchedBefore = fetched.length;
  // Sound turned off the way a student does it: the speaker button, then "Sound on" unticked.
  // The breakdown is put away to reach the speaker, and opened again after.
  await student.locator('#ending-close').click();
  await student.locator('#sound-toggle').click();
  await student.locator('#sound-on').uncheck();
  await student.locator('#sound-toggle').click();
  await student.locator('#ending-open').click();
  const storyButton = student.locator('#ending h3', { hasText: 'Our story' }).locator('.read-aloud');
  await storyButton.click();
  await student.waitForTimeout(500);
  const muted = await storyButton.evaluate(one => ({ state: one.dataset.state, words: one.querySelector('.read-aloud-words').textContent }));
  assert.deepEqual(muted, { state: 'muted', words: 'Sound is off' });
  assert.equal(fetched.length, fetchedBefore, 'a sound was fetched with sound off');
  ok('sound off: the button says "Sound is off" and nothing is fetched or played');

  // ------------------------------------------------------------------ 6. never the stock voice
  assert.equal(await student.evaluate(() => window.__stock), 0, 'the browser\'s own voice was used');
  ok('the browser\'s own voice (speechSynthesis) was never spoken to');
  assert.deepEqual(errors, [], `page errors: ${errors.join(' | ')}`);
  measured.fetched = { count: fetched.length, bytes: null, allOgg: fetched.every(one => /^audio\/ogg/.test(one.type)) };
  measured.host = { spoken: voice.stats.spoken, failed: voice.stats.failed, msPerSentence: voice.stats.spoken ? Math.round(voice.stats.msTotal / voice.stats.spoken) : null };
} finally {
  await browser.close();
  await app.close();
  rmSync(cacheDir, { recursive: true, force: true });
}
writeFileSync('docs/evidence/read-aloud-browser-proof.json', `${JSON.stringify({ proof: 'read-aloud', date: new Date().toISOString().slice(0, 10), pass, measured, shots }, null, 2)}\n`);
console.log(`\n${pass.length} checks passed. Wrote docs/evidence/read-aloud-browser-proof.json`);
