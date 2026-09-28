// The game's sound in a real class, headless, with the Web Audio API replaced by a counting stand-in (docs/AUDIO.md §7;
// tests/support/mock-audio.mjs). Owner, 2026-09-28: "we need audio. we need sound effects, music, etc."
//
// A class through the real join flow: the Host and two students on Chromebook-sized pages. It holds:
//   - no page makes an AudioContext before a gesture; a student's page starts with everything on, quiet (owner, AU1,
//     2026-09-28: "Everything on, quiet" - the master at 30%) and its engine starts at that level on the first press of the
//     join flow; the Host's page starts with sound on at full level and plays music once pressed;
//   - a student who turns sound off with the button beside the Journal is remembered on that device after a reload, and
//     the saved choice wins over the quiet default: no engine at all, even after a press;
//   - on the quiet student's page: a real fight (the Gonzales fight's own projection, sim/battle-stage.mjs, moved under the camera) is
//     heard as musket fire and the cannon; a chase on the Scrape is heard as its shot and ¡Alto!; a storm as rain and
//     thunder; the bell at Béxar for a family whose own man heard it; the family's baby crying;
//   - the muted student's page, given every one of the same, plays nothing and makes no AudioContext - while its cues
//     show it saw each event;
//   - the frame cost of the page's sound, and no page error.
// Same computer, headless Chrome. Run: npm run test:audio
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createClassroom } from '../server/app.mjs';
import { meetFamily } from './support/meet-family.mjs';
import { firingTicks, movedTo } from './support/audio-battle.mjs';
import { installMockAudio } from '../tests/support/mock-audio.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const pass = [];
const ok = label => { pass.push(label); console.log('PASS', label); };
const directory = mkdtempSync(join(tmpdir(), 'texas-audio-'));
const app = createClassroom({ seed: 'audio-proof', playerCount: 5, tickMs: 800, savePath: join(directory, 'class.json') });
const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const errors = [];
const evidence = {};
const fight = firingTicks();
async function pageFor(viewport) {
  const context = await browser.newContext({ viewport });
  await context.addInitScript(`(${installMockAudio.toString()})(window);`);
  const page = await context.newPage();
  page.setDefaultTimeout(30000);
  page.on('pageerror', error => errors.push(error.message));
  return page;
}
// The page's sound is fetched after the page (public/app.js), so every read waits for it to have come.
const audioOf = async page => { await page.waitForFunction(() => window.__audio); return page.evaluate(() => ({ ...window.__audio, mock: { ...window.__mockAudio } })); };
const playedOf = async page => (await audioOf(page)).played.map(one => one.id);
/** The page's own snapshot, changed and drawn in its hand (the proofs' `window.__render`), running so nothing is held still. */
async function inject(page, change) {
  await page.evaluate(change => {
    const snapshot = structuredClone(window.__snapshot);
    const world = snapshot.world;
    world.status = 'running';
    if ('battle' in change) world.battle = change.battle;
    if ('weather' in change) world.weather = change.weather;
    if ('flight' in change) world.flight = change.flight;
    if (change.minute) world.minute = change.minute;
    if (change.report) world.reports = [...(world.reports || []), { ...change.report, source: change.report.source.replace('$NAME', world.entities.find(one => one.principal)?.name || 'Somebody') }];
    if (change.baby) { const one = world.entities.find(entity => entity.kind === 'person' && !entity.principal) || world.entities.find(entity => entity.kind === 'person'); one.baby = { state: 'cry' }; one.lifeWord = 'crying'; }
    snapshot.revision = (snapshot.revision || 0) + 1;
    window.__render(snapshot);
  }, change);
}
const since = async (page, count) => (await playedOf(page)).slice(count);

try {
  mkdirSync('test-results', { recursive: true });
  mkdirSync('docs/evidence', { recursive: true });
  const host = await pageFor({ width: 1366, height: 768 });
  await host.goto(`${url}/host#${app.state.hostKey}`);
  await host.waitForFunction(() => window.__snapshot?.world.role === 'host');
  const students = {};
  for (const [householdId, viewport] of Object.entries({ 'hh-1': { width: 1366, height: 768 }, 'hh-2': { width: 1024, height: 768 } })) {
    const page = await pageFor(viewport);
    await page.goto(url);
    // Before any gesture: the quiet default is set, and nothing is made.
    const before = await audioOf(page);
    assert.equal(before.role, 'student');
    assert.equal(before.mock.contexts, 0, `${householdId}: a student page made an AudioContext before any gesture`);
    assert.equal(before.settings.muted, false, `${householdId}: a student page starts muted`);
    assert.equal(before.settings.master, 0.3, `${householdId}: a student page starts at master ${before.settings.master}, not the quiet 30%`);
    await page.locator('[name=name]').fill(`Student ${householdId}`);
    await page.locator('[name=code]').fill(app.state.sessionCode);
    await page.getByRole('button', { name: 'Join', exact: true }).click();
    await page.waitForFunction(id => window.__snapshot?.world.householdId === id, householdId);
    await meetFamily(page, { 'hh-1': 'Listener', 'hh-2': 'Quiet' }[householdId]);
    students[householdId] = page;
  }
  const { 'hh-1': listener, 'hh-2': quiet } = students;

  // ------------------------------------------------------------------ defaults, and nothing before a gesture
  const hostBefore = await audioOf(host);
  assert.equal(hostBefore.role, 'host'); assert.equal(hostBefore.settings.muted, false);
  assert.equal(hostBefore.mock.contexts, 0, 'the Host page made an AudioContext before any gesture');
  const hostLevels = hostBefore.levels;
  for (const page of [listener, quiet]) {
    const one = await audioOf(page);
    assert.equal(one.role, 'student'); assert.equal(one.settings.muted, false, 'a student page did not start with sound on');
    assert.equal(one.mock.contexts, 1, 'the join flow\'s presses did not start a student page\'s sound engine');
    assert.ok(one.levels.fx > 0 && one.levels.music > 0, `a student page starts with music and effects on: ${JSON.stringify(one.levels)}`);
    assert.ok(one.levels.fx <= hostLevels.fx * 0.5 && one.levels.music <= hostLevels.music * 0.5, `a student page is not quiet: ${JSON.stringify(one.levels)} against the Host's ${JSON.stringify(hostLevels)}`);
    assert.equal(await page.locator('#sound-toggle').textContent(), 'Sound');
  }
  const studentNow = await audioOf(listener);
  evidence.studentDefault = { settings: studentNow.settings, levels: studentNow.levels, hostLevels };
  ok(`before any gesture no page has an AudioContext; each student's first press started its engine at the quiet default (master 30%: effects ${studentNow.levels.fx.toFixed(2)}, music ${studentNow.levels.music.toFixed(3)} against the Host's ${hostLevels.fx.toFixed(2)} and ${hostLevels.music.toFixed(3)}); the Host starts on`);

  await host.waitForFunction(() => window.__snapshot.connected === 2);
  await host.getByRole('button', { name: 'Start', exact: true }).click();
  if (!(await host.waitForFunction(() => window.__snapshot.world.status === 'running', null, { timeout: 3000 }).then(() => true, () => false))) {
    await host.getByRole('button', { name: /Start/ }).first().click();
    await host.waitForFunction(() => window.__snapshot.world.status === 'running');
  }
  await host.waitForTimeout(1500);
  const hostOn = await audioOf(host);
  assert.equal(hostOn.mock.contexts, 1, 'the Host page made no AudioContext after pressing Start');
  assert.ok(['farm', 'war', 'title'].includes(hostOn.mood), `the Host plays ${hostOn.mood}`);
  assert.ok(hostOn.mock.starts > 10, `the Host's music started ${hostOn.mock.starts} sources in 1.5 s`);
  evidence.host = { mood: hostOn.mood, sourcesStartedIn1500ms: hostOn.mock.starts };
  ok(`the Host's press of Start unlocked sound: one AudioContext, "${hostOn.mood}" music playing (${hostOn.mock.starts} sources started)`);
  await host.locator('#host-controls [data-action=pause]').click();
  await host.waitForFunction(() => window.__snapshot.world.status === 'paused');
  await listener.waitForFunction(() => window.__snapshot.world.status === 'paused');
  await quiet.waitForFunction(() => window.__snapshot.world.status === 'paused');

  // ------------------------------------------------------------------ a student turns sound off, and it is remembered
  await quiet.locator('#sound-toggle').click();
  await quiet.locator('#sound-on').uncheck();
  await quiet.locator('#sound-toggle').click();
  assert.equal(await quiet.locator('#sound-toggle').textContent(), 'Sound off');
  const stored = await quiet.evaluate(() => JSON.parse(localStorage.getItem('tr-audio:student')));
  assert.equal(stored.muted, true);
  await quiet.reload();
  await quiet.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-2');
  await meetFamily(quiet, 'Quiet', { timeout: 1500 });
  await quiet.locator('#world-map').click({ position: { x: 40, y: 700 } }).catch(() => quiet.mouse.click(40, 700));
  await quiet.waitForTimeout(500);
  const reloaded = await audioOf(quiet);
  assert.equal(reloaded.settings.muted, true, 'the student\'s choice was not remembered across a reload: the quiet default won');
  assert.equal(reloaded.mock.contexts, 0, 'a page its student muted made an AudioContext after a press');
  ok('a student turned sound off with the button beside the Journal; after a reload the saved choice won over the quiet default, and the page made no AudioContext even after a press');

  // ------------------------------------------------------------------ the fight, heard
  const camera = await listener.evaluate(() => window.__camera);
  const ticks = fight.map(view => movedTo(view, { x: camera.cx, y: camera.cy }));
  const shotsBefore = (await playedOf(listener)).length;
  for (const [i, battle] of ticks.entries()) {
    for (const page of [listener, quiet]) await inject(page, { battle, minute: battle.minute });
    await listener.waitForTimeout(i === 0 ? 800 : 500);
  }
  await listener.waitForTimeout(1500);
  const battleHeard = await since(listener, shotsBefore);
  const count = id => battleHeard.filter(one => one === id).length;
  const view = await listener.evaluate(() => window.__battleView);
  assert.ok(view && view.shotsTotal > 0, `the battle view drew no shots: ${JSON.stringify(view?.shotsBy)}`);
  assert.ok(count('musket') + count('volley') >= 3, `the fight was heard as ${JSON.stringify(battleHeard)}`);
  assert.ok(count('cannon') >= 1, `the cannon was not heard: ${JSON.stringify(battleHeard)}`);
  const audioNow = await audioOf(listener);
  assert.equal(audioNow.mood, 'battle');
  const frameMs = [...audioNow.frameMs].sort((a, b) => a - b);
  evidence.battle = { ticks: ticks.map(one => `${one.phase} ${one.minute}`), shotsDrawn: view.shotsTotal, heard: Object.fromEntries([...new Set(battleHeard)].map(id => [id, count(id)])), dropped: audioNow.dropped,
    soundFrameMs: { median: frameMs[Math.floor(frameMs.length / 2)], p95: frameMs[Math.floor(frameMs.length * 0.95)], max: frameMs.at(-1), frames: frameMs.length } };
  ok(`the Gonzales fight's own projection: ${view.shotsTotal} shots drawn were heard as ${count('musket')} muskets, ${count('volley')} volleys and ${count('cannon')} cannon (${audioNow.dropped} folded or refused by the mixer); the music went to "battle"; the page's sound took ${evidence.battle.soundFrameMs.median} ms a frame (median), ${evidence.battle.soundFrameMs.p95} ms p95`);
  for (const page of [listener, quiet]) await inject(page, { battle: null });

  // ------------------------------------------------------------------ a chase on the Scrape: the shot and ¡Alto!
  const chaseAt = await listener.evaluate(() => ({ x: window.__camera.cx + 0.02, y: window.__camera.cy, minute: window.__snapshot.world.minute }));
  const chase = (minute, extra = {}) => ({ id: 'chase-proof', name: 'a patrol', kind: 'cavalry', men: 6, lead: 0, x: chaseAt.x, y: chaseAt.y, dir: { x: 1, y: 0 }, minute, phase: 'hailed', shotCount: 0, hits: 0,
    soldiers: [{ g: 140 }, { g: 150 }, { g: 160 }], lines: [], shots: [], ...extra });
  const beforeChase = (await playedOf(listener)).length;
  for (const page of [listener, quiet]) await inject(page, { minute: chaseAt.minute + 1, flight: { status: 'fled', chase: chase(chaseAt.minute + 1) } });
  await listener.waitForTimeout(600);
  const hailed = { status: 'fled', ask: { id: 'alto', openedMinute: chaseAt.minute + 2, text: '¡Alto!', options: [] },
    chase: chase(chaseAt.minute + 2, { lines: [{ id: 'alto', text: '¡Alto!', gloss: 'Halt!', minute: chaseAt.minute + 2 }], shots: [{ n: 1, man: 0, yards: 140, target: 'family', hit: false, minute: chaseAt.minute + 2 }] }) };
  for (const page of [listener, quiet]) await inject(page, { minute: chaseAt.minute + 2, flight: hailed });
  await listener.waitForTimeout(1500);
  const chaseHeard = await since(listener, beforeChase);
  assert.ok(chaseHeard.includes('alto'), `¡Alto! was not heard: ${JSON.stringify(chaseHeard)}`);
  assert.ok(chaseHeard.includes('musket'), `the chase's shot was not heard: ${JSON.stringify(chaseHeard)}`);
  assert.equal((await audioOf(listener)).mood, 'scrape');
  evidence.chase = chaseHeard;
  ok(`a chase on the road: its shot and ¡Alto! were heard (${chaseHeard.join(', ')}), and the music went to the Scrape's`);
  for (const page of [listener, quiet]) await inject(page, { flight: null });

  // ------------------------------------------------------------------ a storm: rain and thunder
  const storm = { day: 1, bounds: { westOf: -1e6, eastOf: 1e6 }, regions: Object.fromEntries(['west', 'centre', 'east'].map(name => [name, { kind: 'storm', water: 0.2, since: 0, wet: true, wind: { from: 0.5, force: 0.7 } }])) };
  const beforeStorm = (await playedOf(listener)).length;
  for (const page of [listener, quiet]) await inject(page, { weather: storm });
  const thundered = await listener.waitForFunction(() => window.__audio.played.some(one => one.id === 'thunder'), null, { timeout: 16000 }).then(() => true, () => false);
  const stormAudio = await audioOf(listener);
  assert.ok(stormAudio.beds.rain > 0.5, `rain bed ${stormAudio.beds.rain}`);
  assert.ok(thundered, `no thunder in 16 s of storm: ${JSON.stringify(await since(listener, beforeStorm))}`);
  evidence.storm = { beds: stormAudio.beds };
  ok(`a storm over the family: rain at ${stormAudio.beds.rain} and thunder, wind at ${stormAudio.beds.wind}`);
  for (const page of [listener, quiet]) await inject(page, { weather: null });

  // ------------------------------------------------------------------ the bell at Béxar, heard by the family's own man
  const beforeBell = (await playedOf(listener)).length;
  const minute = await listener.evaluate(() => window.__snapshot.world.minute);
  for (const page of [listener, quiet]) await inject(page, { report: { topicId: 'bexar-arrival', status: 'confirmed', source: '$NAME, at Béxar', receivedMinute: minute, ageMinutes: 0, text: 'The bell at San Fernando: the Mexican army is in sight.' } });
  await listener.waitForTimeout(800);
  const bellHeard = await since(listener, beforeBell);
  assert.ok(bellHeard.includes('bell'), `the bell was not rung: ${JSON.stringify(bellHeard)}`);
  ok(`the family's own man at Béxar heard the bell: ${bellHeard.join(', ')}`);

  // ------------------------------------------------------------------ the baby crying
  const beforeBaby = (await playedOf(listener)).length;
  for (const page of [listener, quiet]) await inject(page, { baby: true });
  await listener.waitForTimeout(800);
  const babyHeard = await since(listener, beforeBaby);
  assert.ok(babyHeard.includes('baby'), `the baby was not heard: ${JSON.stringify(babyHeard)}`);
  ok('the family\'s baby crying was heard');

  // ------------------------------------------------------------------ the muted page: every event seen, nothing played
  const silent = await audioOf(quiet);
  assert.equal(silent.settings.muted, true);
  assert.equal(silent.mock.contexts, 0, 'the muted page made an AudioContext');
  assert.equal(silent.mock.starts, 0, 'the muted page started a sound');
  assert.deepEqual(silent.played, [], 'the muted page played something');
  const seen = new Set(silent.cues.map(one => one.id));
  for (const id of ['alto', 'bell', 'baby']) assert.ok(seen.has(id), `the muted page did not even see ${id}: ${[...seen]}`);
  evidence.muted = { contexts: silent.mock.contexts, starts: silent.mock.starts, cuesSeen: [...seen] };
  ok(`the muted student page was given the same fight, chase, storm, bell and baby: it saw them (${[...seen].join(', ')}) and played nothing - no AudioContext, no source started`);

  // ------------------------------------------------------------------ every sound, rendered for real
  // The stand-in above only counts; this renders each effect and a stretch of each piece in Chrome's own Web Audio engine
  // (an OfflineAudioContext, no speaker) and measures it: every one makes sound, none is out of all proportion.
  const bench = await browser.newPage();
  await bench.goto(`${url}/`);
  const measured = await bench.evaluate(async () => {
    const [{ RECIPES, makeNoise }, { SOUNDS }, { TUNES, arrange, playNote }] = await Promise.all([import('/audio-synth.js'), import('/audio-mix.js'), import('/audio-music.js')]);
    const measure = data => { let peak = 0, sum = 0, finite = true; for (const v of data) { if (!Number.isFinite(v)) finite = false; const a = Math.abs(v); if (a > peak) peak = a; sum += v * v; } return { peak: +peak.toFixed(3), rms: +Math.sqrt(sum / data.length).toFixed(4), finite }; };
    const out = { effects: {}, music: {} };
    for (const id of Object.keys(SOUNDS)) {
      const ctx = new OfflineAudioContext(1, 22050 * 6, 22050), noise = makeNoise(ctx), voice = ctx.createGain();
      voice.gain.value = SOUNDS[id].gain; voice.connect(ctx.destination);
      const seconds = RECIPES[id](ctx, voice, 0.01, { call: 'attack', pattern: 'roll', count: 12 }, noise);
      const data = (await ctx.startRendering()).getChannelData(0).slice(0, Math.ceil(22050 * Math.min(6, seconds + 0.2)));
      out.effects[id] = { seconds: +seconds.toFixed(2), ...measure(data) };
    }
    for (const id of Object.keys(TUNES)) {
      const ctx = new OfflineAudioContext(1, 22050 * 8, 22050), noise = makeNoise(ctx), gain = ctx.createGain();
      gain.gain.value = TUNES[id].level; gain.connect(ctx.destination);
      const piece = arrange(id);
      for (const event of piece.events) { const at = event.beat * piece.secondsPerBeat; if (at < 7.5) playNote(ctx, gain, noise, event, at + 0.01, event.beats * piece.secondsPerBeat, event.level); }
      out.music[id] = measure((await ctx.startRendering()).getChannelData(0));
    }
    return out;
  });
  for (const [id, one] of Object.entries({ ...measured.effects, ...measured.music })) {
    assert.ok(one.finite, `${id} rendered a non-number`);
    assert.ok(one.peak > 0.02, `${id} is silent: ${JSON.stringify(one)}`);
    assert.ok(one.peak < 3, `${id} is far too loud: ${JSON.stringify(one)}`);
  }
  evidence.rendered = measured;
  ok(`every effect (${Object.keys(measured.effects).length}) and a stretch of every piece (${Object.keys(measured.music).length}) rendered in Chrome's own Web Audio engine: all make sound, none out of proportion`);
  await bench.close();

  assert.deepEqual(errors, [], `page errors: ${errors.join(' | ')}`);
  ok('no page error on any page');
  evidence.listener = { played: (await audioOf(listener)).played.length, contexts: (await audioOf(listener)).mock.contexts, sourcesStarted: (await audioOf(listener)).mock.starts };
  writeFileSync('docs/evidence/audio-browser-proof.json', `${JSON.stringify({ date: new Date().toISOString().slice(0, 10), pass, evidence }, null, 2)}\n`);
  console.log(`\n${pass.length} checks passed.`);
} finally {
  await browser.close();
  await app.close?.();
  try { rmSync(directory, { recursive: true, force: true }); } catch { /* the save may still be closing */ }
}
process.exit(0);
