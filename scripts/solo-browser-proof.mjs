// Solo Mode, in a real browser, through the real entry point (docs/DEPLOYMENT.md).
//
// tests/solo.test.mjs proves the server's half: one request deals a joined, running family whose
// clock waits until the family is made; the link opens once; only a solo server has the door; loopback only; its own save.
// This runs `npm run solo` itself - scripts/solo.mjs starting `server/main.mjs --solo` - beside
// a real class that is already running in the same data folder, and checks what the owner
// actually sees: the player page opens already joined with the class running, no join form
// and no ticket left in the address bar, and the world held until the family is made (owner,
// 2026-09-18) and going on after; the solo class view opens from its Host address; a
// second `npm run solo` reuses the server and deals a new game; the solo server cannot be
// reached on this computer's network address; and the real class, its save and its port are
// exactly as they were.
//
// And closing the game (owner, 2026-09-27): `server/main.mjs --solo` entered as the launcher enters it, a saved game
// continued and opening paused, the page's own Resume, Pause and Save, then the page closed - the game paused and written at
// once, the server stopping itself - relaunched to the same tick, and the page's whole browser killed with the same result.
//
// Same computer only: headless Chrome. Run: npm run test:solo
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { createClassroom, PACES } from '../server/app.mjs';
import { meetFamily } from './support/meet-family.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { resolveSavePath, joinCandidates } from '../server/deployment.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const pass = [];
const ok = label => { pass.push(label); console.log('PASS', label); };
const observed = {};

const freePort = () => new Promise(resolve => { const probe = createServer().listen(0, '127.0.0.1', () => { const { port } = probe.address(); probe.close(() => resolve(port)); }); });
const dataDir = mkdtempSync(join(tmpdir(), 'texas-solo-proof-'));
const soloPort = await freePort();
const env = { ...process.env, TEXAS_DATA_DIR: dataDir, SOLO_PORT: String(soloPort), PLAYERS: '5' };
delete env.SAVE_PATH; delete env.PORT;

/** Run `npm run solo -- --no-open` and wait for its play address. Resolves with the process still running. */
function runSolo() {
  const child = spawn(process.execPath, ['scripts/solo.mjs', '--no-open'], { env, stdio: ['ignore', 'pipe', 'pipe'] });
  let text = '';
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`npm run solo printed no address in 90 s:\n${text}`)), 90000);
    const read = chunk => {
      text += chunk;
      const play = text.match(/SOLO PLAY: (\S+)/), host = text.match(/SOLO HOST: (\S+)/);
      if (play && host) { clearTimeout(timer); resolve({ child, play: play[1], host: host[1], output: () => text }); }
    };
    child.stdout.on('data', read); child.stderr.on('data', read);
    child.on('exit', code => { if (!/SOLO PLAY/.test(text)) { clearTimeout(timer); reject(new Error(`npm run solo exited ${code}:\n${text}`)); } });
  });
}

// A real class already running from the same data folder, on its own port, as a teacher's would be.
const realSave = resolveSavePath(dataDir, {});
const real = createClassroom({ seed: 'solo-proof-real-class', playerCount: 5, tickMs: 10000, savePath: realSave, worldFactory: createGonzalesWorld });
const realPort = await real.listen(0, '127.0.0.1');
const realBefore = { sessionId: real.state.sessionId, code: real.state.sessionCode, save: readFileSync(realSave, 'utf8') };

const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const errors = [];
let server = null;
try {
  const first = await runSolo();
  server = first.child;
  observed.play = first.play.replace(/ticket=\w+/, 'ticket=…');
  assert.match(first.play, new RegExp(`^http://127\\.0\\.0\\.1:${soloPort}/solo/enter\\?ticket=[0-9a-f]{48}$`));

  // ------------------------------------------------------------------ the player, already joined
  const context = await browser.newContext({ viewport: { width: 1280, height: 850 } });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(first.play);
  await page.waitForFunction(() => window.__snapshot?.world?.householdId === 'hh-1', null, { timeout: 60000 });
  const seen = await page.evaluate(() => ({ status: window.__snapshot.world.status, solo: window.__snapshot.solo, path: location.pathname + location.search, joinHidden: document.querySelector('#join')?.hidden, familyKey: Boolean(window.__snapshot.familyKey) }));
  // In its own lobby, not running (owner, 2026-09-21). A solo game opened `running` until then, and the wagon and the
  // stock choice are sent only in the lobby - so the player was never asked either, and always held a labor of land
  // where a student who drives stock in holds a league and a labor.
  assert.equal(seen.status, 'lobby', 'the solo game opened running, where it is never asked what it packs');
  assert.equal(seen.solo, true, 'the page cannot tell it is a solo game, so it cannot know its Done packing is the Start');
  assert.equal(seen.path, '/', 'the one-use ticket is not left in the address bar');
  assert.equal(seen.joinHidden, true, 'no join form');
  assert.ok(seen.familyKey, 'the page is a family, not a visitor');
  ok('npm run solo opens the player page already joined as hh-1, in its own lobby, no join form, no ticket in the address');
  // Held while the family is made (owner, 2026-09-18, by multiple choice: "hold"): two of the study pace's ticks and more go
  // by, and the world has not moved and the die is still the player's - the world's second tick used to close it.
  const holdMs = PACES.study * 2 + 2000;
  await delay(holdMs);
  const held = await page.evaluate(async () => ({ tick: window.__snapshot.world.tick, canRoll: (await (await fetch('/api/family')).json()).family?.canRoll }));
  assert.equal(held.tick, 0, 'the world went on before the family was made');
  assert.equal(held.canRoll, true, 'the die was closed before the player came to it');
  await meetFamily(page, 'Proofwright', { timeout: 30000 });

  // ------------------------------------------------- the questions a class is asked, asked here too, and the Start
  // The wagon and the stock choice are what a solo game never used to see. The stock choice is the one that matters:
  // it decides a labor of land or a league and a labor, and whether the family arrives with six cattle and twelve hogs.
  await page.locator('#wagon-load').waitFor({ state: 'visible', timeout: 30000 });
  observed.asked = await page.evaluate(() => ({
    wagon: !document.querySelector('#wagon-load').hidden,
    stock: [...document.querySelectorAll('#wagon-stock input[name=wagon-stock]')].length,
    says: (document.querySelector('#stock-yes-text')?.textContent || '').trim(),
    tick: window.__snapshot.world.tick,
  }));
  assert.equal(observed.asked.wagon, true, 'the solo player is never asked what the family packs');
  assert.equal(observed.asked.stock, 2, 'the solo player is never asked whether the family drives stock in');
  assert.match(observed.asked.says, /cattle/i, 'the stock choice does not say what the family arrives with');
  assert.equal(observed.asked.tick, 0, 'the world went on while the player was still packing');
  ok(`Play Solo asks what a class asks: the wagon, and the stock choice in its own words - "${observed.asked.says.slice(0, 60)}…"`);

  // No teacher to press Start, so Done packing is the Start.
  await page.locator('#wagon-done').click();
  await page.waitForFunction(() => window.__snapshot.world.status === 'running', null, { timeout: 30000 });
  await page.waitForFunction(() => window.__snapshot.world.tick > 0, null, { timeout: 60000 });
  observed.held = { waitedMs: holdMs, tickWhileMaking: held.tick, tickAfter: await page.evaluate(() => window.__snapshot.world.tick) };
  ok(`the world waits while the family is made and packed (tick 0 after ${holdMs / 1000} s, the die still offered) and Done packing starts it (tick ${observed.held.tickAfter})`);

  const used = await context.newPage();
  const reused = await used.goto(first.play);
  assert.equal(reused.status(), 403, 'the same link opens nothing twice');
  await used.close();
  ok('the play link is one use: opening it again is refused');

  // ------------------------------------------------------------------ the solo class view
  const hostContext = await browser.newContext({ viewport: { width: 1280, height: 850 } });
  const host = await hostContext.newPage();
  host.on('pageerror', error => errors.push(error.message));
  await host.goto(first.host);
  await host.waitForFunction(() => window.__snapshot?.sessionCode && window.__snapshot?.presence, null, { timeout: 60000 });
  const hostSeen = await host.evaluate(() => ({ status: window.__snapshot.world.status, joined: window.__snapshot.presence.joined, households: Object.keys(window.__snapshot.world.households || {}).length }));
  assert.equal(hostSeen.status, 'running');
  assert.equal(hostSeen.joined, 1, 'one player joined');
  observed.hostView = hostSeen;
  ok(`the solo class view opens from its Host address: running, ${hostSeen.joined} family joined`);

  // ------------------------------------------------------------------ only this computer
  const lan = joinCandidates(soloPort)[0];
  if (lan) {
    const reached = await fetch(`http://${lan.address}:${soloPort}/health`, { signal: AbortSignal.timeout(3000) }).then(() => true, () => false);
    assert.equal(reached, false, `the solo server answered on ${lan.address}`);
    ok(`the solo server does not answer on this computer's network address (${lan.label}), only on 127.0.0.1`);
  } else console.log('SKIP no non-loopback interface to try');

  // ------------------------------------------------------------------ npm run solo again
  const firstSession = JSON.parse(readFileSync(join(dataDir, 'solo', 'classroom.json'), 'utf8')).sessionId;
  const second = await runSolo();
  await new Promise(resolve => second.child.exitCode !== null ? resolve() : second.child.on('exit', resolve));
  assert.equal(second.child.exitCode, 0, 'a second npm run solo reuses the running server and exits');
  assert.equal(server.exitCode, null, 'and the first server is still the one running');
  const secondSession = JSON.parse(readFileSync(join(dataDir, 'solo', 'classroom.json'), 'utf8')).sessionId;
  assert.notEqual(secondSession, firstSession, 'with a new game');
  const again = await context.newPage();
  await again.goto(second.play);
  // A new game is a new lobby, as the first one was: the wagon and the stock choice are asked again (owner,
  // 2026-09-21), so what is waited for here is the game opening joined, not the world moving.
  await again.waitForFunction(() => window.__snapshot?.world?.householdId === 'hh-1' && window.__snapshot.world.status === 'lobby', null, { timeout: 60000 });
  ok('a second npm run solo reuses the running solo server, deals a new game (new session) and opens it joined, in its own lobby');

  // ------------------------------------------------------------------ the real class, untouched
  assert.equal(real.state.sessionId, realBefore.sessionId);
  assert.equal(real.state.sessionCode, realBefore.code);
  assert.equal(readFileSync(realSave, 'utf8'), realBefore.save, 'the real class save is byte-for-byte the same');
  assert.ok(existsSync(join(dataDir, 'solo', 'classroom.json')), 'the solo game saved in its own folder');
  assert.notEqual(realPort, soloPort);
  assert.equal((await (await fetch(`http://127.0.0.1:${realPort}/health`)).json()).solo, false);
  ok(`a real class running from the same data folder is untouched: same session, same code, save unchanged; solo saved to solo\\classroom.json on its own port`);

  // ------------------------------------------------------------------ stop
  const login = await fetch(`http://127.0.0.1:${soloPort}/api/host`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: first.host.split('#')[1] }) });
  const cookie = login.headers.get('set-cookie').split(';')[0];
  await fetch(`http://127.0.0.1:${soloPort}/api/command`, { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookie }, body: JSON.stringify({ id: `stop-${Date.now()}`, action: 'stop-server' }) });
  for (let i = 0; i < 60 && server.exitCode === null; i++) await delay(250);
  assert.equal(server.exitCode, 0, 'the solo server stops gracefully from its Host');
  assert.equal(existsSync(join(dataDir, 'solo', 'classroom.json.lock')), false, 'and releases its save lock');
  server = null;
  ok('the solo server stops gracefully from its class view and releases its save lock');
  await context.close(); await hostContext.close();

  // ------------------------------------------------------------------ closing the game (owner, 2026-09-27)
  // "i shouldn't need to open the class view to pause, save or shut down the server. i should be able to just X off the
  // window and it'll automatically save, pause, and shut down." The real server/main.mjs --solo, entered the way the
  // launcher's Play Solo enters it (list, then continue), played with the page's own controls, and then left: the page
  // closed, and later its whole browser killed. SOLO_LEAVE_MS shortens the thirty seconds the server waits for a reload.
  const leaveMs = 3000;
  const soloDir = join(dataDir, 'solo'), live = join(soloDir, 'classroom.json');
  const onDisk = () => JSON.parse(readFileSync(live, 'utf8'));
  const soloOrigin = `http://127.0.0.1:${soloPort}`;
  const post = (path, body) => fetch(`${soloOrigin}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  async function startSolo() {
    const child = spawn(process.execPath, ['server/main.mjs', '--solo'], { env: { ...env, SOLO_LEAVE_MS: String(leaveMs), TICK_MS: '400' }, stdio: ['ignore', 'pipe', 'pipe'] });
    let text = ''; child.stdout.on('data', chunk => { text += chunk; }); child.stderr.on('data', chunk => { text += chunk; });
    child.output = () => text;
    const deadline = Date.now() + 60000;
    while (Date.now() < deadline) {
      const key = (() => { try { return readFileSync(join(soloDir, 'host-url.txt'), 'utf8').trim().split('#')[1]; } catch { return null; } })();
      const listed = key && await post('/api/solo/games', { key }).then(async response => response.ok ? (await response.json()).games : null, () => null);
      if (listed) return { child, key, games: listed };
      if (child.exitCode !== null) break;
      await delay(250);
    }
    throw new Error(`server/main.mjs --solo did not start:\n${text}`);
  }
  const exited = async (child, ms) => { for (const end = Date.now() + ms; Date.now() < end && child.exitCode === null;) await delay(100); return child.exitCode; };
  async function continueIn(browserFor, key, id) {
    const answer = await (await post('/api/solo', { key, continue: id })).json();
    assert.ok(answer.playUrl, `the saved game would not continue: ${JSON.stringify(answer)}`);
    const play = await (await browserFor.newContext({ viewport: { width: 1280, height: 850 } })).newPage();
    play.on('pageerror', error => errors.push(error.message));
    await play.goto(answer.playUrl);
    await play.waitForFunction(() => window.__snapshot?.world?.householdId === 'hh-1', null, { timeout: 60000 });
    // A page opened on a family already made shows the title screen first, and then the world (public/creation.js).
    await play.locator('#creation-begin-button').click({ timeout: 15000 });
    await play.waitForFunction(() => document.querySelector('#creation')?.hidden, null, { timeout: 15000 });
    return play;
  }
  const soloButtons = page => page.evaluate(() => ({
    shown: !document.querySelector('#solo-controls').hidden,
    visible: [...document.querySelectorAll('#solo-controls button')].filter(button => !button.hidden).map(button => button.textContent.trim()),
    status: window.__snapshot.world.status, tick: window.__snapshot.world.tick, hostControls: !document.querySelector('#host-controls').hidden,
  }));

  // The launcher's Play Solo: start, list, Continue the first game - kept running when the second took its place.
  const keptFirst = JSON.parse(readFileSync(join(soloDir, 'games', `${firstSession}.json`), 'utf8'));
  assert.equal(keptFirst.world.status, 'running', 'the first game was not kept running, so opening it paused proves nothing');
  let relaunched = await startSolo();
  server = relaunched.child;
  assert.ok(relaunched.games.some(game => game.id === firstSession), 'the first game is not among the saved games');
  const play = await continueIn(browser, relaunched.key, firstSession);
  const opened = await soloButtons(play);
  assert.equal(opened.status, 'paused', 'a continued game opened running before the player was looking');
  assert.equal(opened.tick, keptFirst.world.tick, 'the continued game is not where it was left');
  assert.equal(opened.shown, true, 'the solo player has no controls of their own');
  assert.equal(opened.hostControls, false, 'the solo player was shown the teacher\'s controls');
  assert.deepEqual(opened.visible, ['Resume', 'Save'], 'a paused game offers Resume and Save');
  ok(`Continue opens the saved game paused where it was left (tick ${opened.tick}), and the player's page has its own Resume and Save`);

  // Its own Resume, Pause and Save.
  await play.locator('#solo-controls [data-solo="solo-resume"]').click();
  await play.waitForFunction(tick => window.__snapshot.world.status === 'running' && window.__snapshot.world.tick > tick + 1, opened.tick, { timeout: 30000 });
  assert.deepEqual((await soloButtons(play)).visible, ['Pause', 'Save']);
  await play.locator('#solo-controls [data-solo="solo-pause"]').click();
  await play.waitForFunction(() => window.__snapshot.world.status === 'paused', null, { timeout: 10000 });
  const pausedAt = (await soloButtons(play)).tick;
  await delay(1500);
  assert.equal((await soloButtons(play)).tick, pausedAt, 'the world went on while the player had paused it');
  // The save is read only while the game is paused, when nothing else is writing it: a read that overlaps the server's
  // rename is refused by Windows, and would fail the server's write rather than this check.
  const pausedDisk = onDisk();
  assert.equal(pausedDisk.world.status, 'paused', 'the pause was not written');
  const pausedHelp = (await play.locator('#lesson-help').textContent().catch(() => '')).trim();
  assert.doesNotMatch(pausedHelp, /teacher/, 'the paused solo game tells the player to wait for a teacher');
  await play.locator('#solo-controls [data-solo="solo-save"]').click();
  await play.waitForFunction(() => /^Saved /.test(document.querySelector('#solo-saved').textContent), null, { timeout: 10000 });
  const savedDisk = onDisk();
  assert.equal(savedDisk.revision, pausedDisk.revision + 1, 'Save did not write the game');
  await play.locator('#solo-controls [data-solo="solo-resume"]').click();
  await play.waitForFunction(tick => window.__snapshot.world.status === 'running' && window.__snapshot.world.tick > tick, pausedAt, { timeout: 30000 });
  observed.controls = { openedAt: opened.tick, pausedAt, held: '1.5 s', pausedHelp, savedRevision: savedDisk.revision, savedLabel: await play.locator('#solo-saved').textContent() };
  ok(`the page's own Resume runs the game, Pause holds it (tick ${pausedAt} for 1.5 s, written paused), Save writes it (revision ${savedDisk.revision}, "${observed.controls.savedLabel}"), and Resume runs it on`);

  // The window's X: the page closes. Paused and written at once, and the server gone once the page has not come back.
  const tickRunning = (await soloButtons(play)).tick;
  const closedAt = Date.now();
  await play.close();
  // When it was written paused, in the server's own words once the write has succeeded - not by polling the save, since a
  // file held open for reading is what makes Windows refuse the rename that replaces it (seen: EPERM, and the pause written
  // only by the stop).
  const pausedWithin = async (from, ms) => {
    for (const end = Date.now() + ms; Date.now() < end; await delay(100)) {
      const said = [...server.output().matchAll(/the game is saved \((\w+), revision (\d+)\) at (\S+)\./g)].at(-1);
      if (said && said[1] === 'paused' && Date.parse(said[3]) >= from - 50) return { afterMs: Date.parse(said[3]) - from, revision: Number(said[2]) };
    }
    return null;
  };
  const pausedClose = await pausedWithin(closedAt, 5000);
  const pausedAfter = pausedClose?.afterMs ?? null;
  assert.ok(pausedAfter !== null && pausedAfter < leaveMs, `closing the page did not pause and save the game before the wait was over (${pausedAfter} ms):\n${server.output()}`);
  assert.equal(server.exitCode, null, 'the server stopped at once, leaving no time for a reload');
  assert.equal(await exited(server, leaveMs + 15000), 0, `the solo server did not stop itself after its page closed:\n${server.output()}`);
  const stoppedAfter = Date.now() - closedAt;
  assert.equal(existsSync(`${live}.lock`), false, 'the stopped server left its save lock');
  assert.equal(onDisk().world.status, 'paused', 'the stopped server left its game running on the disk');
  assert.ok(onDisk().revision >= pausedClose.revision && onDisk().world.tick >= tickRunning, 'the save went back in time');
  const closedTick = onDisk().world.tick;
  observed.closed = { pausedOnDiskAfterMs: pausedAfter, stoppedAfterMs: stoppedAfter, leaveMs, tick: closedTick };
  ok(`closing the page paused and saved the game at once (on the disk paused ${pausedAfter} ms after; tick ${closedTick}) and the server stopped itself ${(stoppedAfter / 1000).toFixed(1)} s later (wait ${leaveMs / 1000} s), exit 0, lock released`);

  // Play Solo again, Continue: the same game, paused, on the same tick.
  relaunched = await startSolo();
  server = relaunched.child;
  const listedAgain = relaunched.games.find(game => game.id === firstSession);
  assert.equal(listedAgain?.status, 'paused', 'the closed game is not listed, paused');
  // A browser of its own, started as a server so the proof holds its process and can kill it outright below.
  const crashServer = await chromium.launchServer({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
  const crashBrowser = await chromium.connect(crashServer.wsEndpoint());
  const back = await continueIn(crashBrowser, relaunched.key, firstSession);
  const resumed = await soloButtons(back);
  assert.equal(resumed.status, 'paused');
  assert.equal(resumed.tick, closedTick, 'the game reopened somewhere other than where it was closed');
  await back.locator('#solo-controls [data-solo="solo-resume"]').click();
  await back.waitForFunction(tick => window.__snapshot.world.tick > tick + 1, closedTick, { timeout: 30000 });
  ok(`relaunched and continued, the game is where it was closed (tick ${closedTick}), paused, and Resume runs it on`);

  // A crash: the browser holding the page killed outright, with no page event to say so. Windows was seen to take up to
  // twenty seconds to reset a killed Chrome's connection (measured 2026-09-27: 19 s, with the server writing every second),
  // so the server may learn of it that late; a closed page or the launcher's window is a quarter of a second.
  const crashed = crashServer.process();
  const crashedAt = Date.now();
  spawn('taskkill', ['/F', '/T', '/PID', String(crashed.pid)], { stdio: 'ignore' });
  const crashPausedAfter = (await pausedWithin(crashedAt, 60000))?.afterMs ?? null;
  assert.ok(crashPausedAfter !== null && server.exitCode === null, `a killed browser's game was not written paused before the server stopped (${crashPausedAfter} ms):\n${server.output()}`);
  assert.equal(await exited(server, leaveMs + 15000), 0, `the solo server did not stop itself after its browser was killed:\n${server.output()}`);
  observed.crash = { pausedOnDiskAfterMs: crashPausedAfter, stoppedAfterMs: Date.now() - crashedAt, tick: onDisk().world.tick };
  assert.equal(existsSync(`${live}.lock`), false);
  server = null;
  ok(`the page's browser killed outright (taskkill /F /T): the game was on the disk paused ${crashPausedAfter} ms after and the server stopped itself ${(observed.crash.stoppedAfterMs / 1000).toFixed(1)} s later, lock released`);

  assert.deepEqual(errors, [], `page errors: ${errors.join(' | ')}`);
  ok('no page errors');
  mkdirSync('docs/evidence', { recursive: true });
  writeFileSync('docs/evidence/solo-browser.json', JSON.stringify({ recordedAt: new Date().toISOString(), scope: 'same computer, headless Chrome', command: 'npm run test:solo', pass, observed }, null, 2) + '\n');
} finally {
  await browser.close();
  if (server && server.exitCode === null) server.kill();
  await real.close();
  await delay(300);
  rmSync(dataDir, { recursive: true, force: true });
}
