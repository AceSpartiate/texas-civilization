// The auto switch in a real browser: docs/FAMILY_PANEL.md §11.7 (owner, 2026-09-16).
//
// "For all combat, and hunting, the player should be able to let it automatically happen (autohunt, or autofight) but the
// player should have the ability to micromanage their character during hunting or battle. If they fail to make the
// character's choices in a timely manner then eventually the auto should take over."
//
// tests/auto.test.mjs proves the rules against the simulation: the switch is the world's, a hunt on auto never stops to
// ask and is repeated, the army's questions and Travis's couriers answered at once at the record's share, silence decided
// the same way when the window closes, the Runaway Scrape following the main person's switch. This proves what a student
// does: the word "auto" on a row pressed, and the row showing pressed only once the server says so; a hunt sent from the
// panel with the switch on, the hunter going out again by themself when they come home, and no "!" ever raised on them;
// the switch pressed off, and nobody going out again; and at 400 px nothing scrolling sideways with the switch on every row.
//
// Amended 2026-09-25 (docs/FAMILY_PANEL.md §16): the switch at the two classroom sizes, off and on; and the owner's season -
// one person on auto to plant, another given the unripe harvest to wait for - run with nobody pressing anything, the field
// cycling and each row saying what auto is doing and why it waits. AUTO_SHOTS=<folder> also writes the panel screenshots there.
//
// Same computer only: headless Chrome. Run: npm run test:auto
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createClassroom } from '../server/app.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { meetFamily } from './support/meet-family.mjs';
// docs/FAMILY_PANEL.md §12 (owner, 2026-09-21): a person's work is on the screen only while they are the family's main
// person, so this proof chooses them first, as a student does.
import { asMain } from './support/main-person.mjs';
import { sendTheWay } from './support/going.mjs';
import { clearedOf } from '../sim/improvements.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const pass = [];
const ok = label => { pass.push(label); console.log('PASS', label); };
const measured = {};
const shots = [];
const shot = async (page, name) => { const path = `docs/evidence/auto-${name}.png`; await page.screenshot({ path }); shots.push(path); };

const app = createClassroom({ seed: 'auto-proof-1', playerCount: 5, tickMs: 150, worldFactory: seed => createGonzalesWorld(seed, 5) });
const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const errors = [];
const post = async (path, body, cookie) => {
  const response = await fetch(url + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(cookie && { Cookie: cookie }) }, body: JSON.stringify(body) });
  const text = await response.text();
  assert.equal(response.status, 200, `${path}: ${response.status} ${text}`);
  return response;
};
mkdirSync('docs/evidence', { recursive: true });
const world = () => app.state.world;
const hunts = id => world().events.filter(event => event.actorId === id && /finished: hunt/.test(event.text)).length;
// How each row's switch looks, read off the page: its word, pressed state, whether it is on the screen, and whether it glows
// green (docs/FAMILY_PANEL.md §16: the glow is green, never the gold of the work a person is doing now).
const switchLooks = page => page.evaluate(() => [...document.querySelectorAll('.panel-row')].map(row => {
  const button = row.querySelector('.panel-auto'), box = button.getBoundingClientRect(), style = getComputedStyle(button);
  return {
    id: row.dataset.entityId, hidden: button.hidden, young: (window.__snapshot?.world.entities.find(one => one.id === row.dataset.entityId)?.age ?? 99) < 10, text: button.querySelector('.panel-auto-word')?.textContent, pressed: button.getAttribute('aria-pressed'),
    visible: !button.hidden && box.width > 30 && box.height >= 24 && box.left >= 0 && box.right <= innerWidth && box.top >= 0 && box.bottom <= innerHeight,
    glowing: /rgb\(1(11|26|43), (191|217|224), (74|87|102)/.test(style.boxShadow), shadow: style.boxShadow, background: style.backgroundColor, color: style.color,
    line: row.querySelector('.panel-auto-line')?.hidden === false ? row.querySelector('.panel-auto-line').textContent : null,
    // The switch made wider must not cut the name beside it short.
    nameFits: (() => { const name = row.querySelector('.panel-name'); return !name || name.scrollWidth <= name.clientWidth + 1; })(),
  };
}));
// The owner's screenshots of the panel (2026-09-25) go to the session's scratchpad as well as to the evidence folder.
const SCRATCH = process.env.AUTO_SHOTS || null;
const panelShot = async (page, name) => {
  await shot(page, name);
  if (SCRATCH) { mkdirSync(SCRATCH, { recursive: true }); await page.screenshot({ path: `${SCRATCH}/autoplay-${name}.png` }); }
};

try {
  const host = await post('/api/host', { key: app.state.hostKey });
  const hostCookie = host.headers.get('set-cookie').split(';')[0];
  const context = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 950 } });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url);
  await page.locator('[name=name]').fill('Hunter');
  await page.locator('[name=code]').fill(app.state.sessionCode);
  await page.getByRole('button', { name: 'Join', exact: true }).click();
  await page.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-1');
  for (let i = 2; i <= 5; i++) await post('/api/join', { name: `Neighbour ${i}`, code: app.state.sessionCode });
  // The title screen comes first (public/creation.js, owner 2026-09-17): Begin, then the die.
  await page.locator('#creation-begin-button').waitFor({ state: 'visible', timeout: 30000 });
  await page.locator('#creation-begin-button').click();
  await page.locator('#roll-family').click();
  await page.waitForFunction(() => document.querySelector('#roll-family')?.textContent === 'Meet your family', null, { timeout: 15000 });
  await page.locator('#roll-family').click();
  // The family's last name and how the parents look, asked for after the roll (owner, 2026-09-17).
  await meetFamily(page);
  // Seed for two plantings (the season below), packed as a student packs the wagon in the lobby: meal out, the
  // sacks of seed to the most one wagon takes (sim/wagon.mjs), whatever the family's means. `app.state` is a copy of the server's, so the world cannot be
  // handed things from here; the family carries them in.
  const packed = await page.evaluate(async () => {
    const send = async body => { const response = await fetch('/api/command', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: `pack-${Math.random().toString(36).slice(2)}`, ...body }) }); return response.status === 200 ? 200 : `${response.status} ${await response.text()}`; };
    const barrels = (window.__snapshot?.world.household.load || []).find(entry => entry.id === 'provisions')?.amount || 0;
    const first = await send({ action: 'load-wagon', item: 'provisions', amount: Math.max(0, barrels - 5) });
    // A poor family's cart (sim/means.mjs) is full with its tools: the bedding and the pot stay behind for the seed.
    for (const item of ['bedding', 'pot']) await send({ action: 'load-wagon', item, amount: 0 });
    await new Promise(resolve => setTimeout(resolve, 400));
    return [first, await send({ action: 'load-wagon', item: 'seed', amount: 6 }), barrels, window.__snapshot?.world.household.load];
  });
  assert.deepEqual(packed.slice(0, 2), [200, 200], `the wagon was not packed with seed: ${JSON.stringify(packed)}`);
  if (await page.locator('#wagon-done').isVisible()) await page.locator('#wagon-done').click();
  if (await page.locator('#tutorial-skip').isVisible()) await page.locator('#tutorial-skip').click();
  await page.locator('#family-panel').waitFor({ state: 'visible' });
  await page.waitForFunction(() => window.__familyPanel?.length >= 3);
  await post('/api/command', { id: `proof-start-${crypto.randomUUID()}`, action: 'start' }, hostCookie);
  await page.waitForFunction(() => window.__snapshot?.world.status === 'running', null, { timeout: 15000 });
  // (No powder is handed over here: `app.state` is a copy, and the family's own three shots are what the hunts below use.)
  // The guided start stopped with its X, as a student may (docs/LESSON.md, owner 2026-09-22): since 2026-09-25 auto keeps the
  // lesson's gate as a student's hand does (sim/auto.mjs), and a hunt given on the step that allows any work is not repeated on
  // the house's step. That rule is tests/auto-repeat.test.mjs's; this proof is the panel's.
  await page.waitForFunction(() => window.__snapshot?.world?.status === 'running' && ('lesson' in window.__snapshot.world ? !document.querySelector('#lesson-stop')?.hidden : true), null, { timeout: 15000 });
  if (await page.evaluate(() => 'lesson' in window.__snapshot.world)) {
    await page.locator('#lesson-stop').click();
    await page.locator('#lesson-stop-yes').click();
    await page.waitForFunction(() => window.__snapshot?.world && !('lesson' in window.__snapshot.world), null, { timeout: 20000 });
  }

  // ------------------------------------------------------------------------------------------- the switch, off then on
  const rows = await page.evaluate(() => window.__familyPanel);
  assert.ok(rows.every(row => row.auto === false), 'somebody was on auto before anybody pressed anything');
  assert.equal(await page.locator('.panel-row .panel-auto').count(), rows.length, 'not every row has the switch');
  ok('every row has the switch, and nobody is on auto to begin with');
  // Off, at the two classroom sizes (owner, 2026-09-25: "isn't quite visible enough"): the word "Auto" beside the key, dark on
  // light, on every row that can be given work, and nothing glowing.
  measured.off = {};
  for (const [width, height] of [[1366, 768], [1024, 768]]) {
    await page.setViewportSize({ width, height });
    await page.waitForTimeout(400);
    measured.off[width] = await switchLooks(page);
    await panelShot(page, `off-${width}x${height}`);
    // Every switch shown reads "Auto" and does not glow; the grown people's, at the top of the column, are on the screen.
    const shownSwitches = measured.off[width].filter(one => !one.hidden);
    assert.ok(shownSwitches.every(one => one.text === 'Auto' && one.pressed === 'false' && !one.glowing) && shownSwitches.slice(0, 2).every(one => one.visible && one.nameFits) && measured.off[width].every(one => one.hidden === one.young), `off at ${width}: ${JSON.stringify(measured.off[width])}`);
  }
  await page.setViewportSize({ width: 1440, height: 950 });
  ok('off, at 1366x768 and 1024x768: every switch shown reads "Auto" and nothing glows; the grown people\'s are on the screen with their names whole; no switch on a child under ten');
  await page.waitForFunction(() => document.querySelector('.panel-icon[data-key="hunt-timber"]:not([aria-disabled="true"])'), null, { timeout: 20000 });
  const hunterId = await page.evaluate(() => document.querySelector('.panel-icon[data-key="hunt-timber"]:not([aria-disabled="true"])').closest('.panel-row').dataset.entityId);
  // Read fresh each time: the server's world object is replaced as it runs, so a reference taken now goes stale.
  const hunter = () => world().entities[hunterId];
  const sw = page.locator(`.panel-row[data-entity-id="${hunterId}"] .panel-auto`);
  assert.equal(await sw.getAttribute('aria-pressed'), 'false');
  await sw.click();
  await page.waitForFunction(id => window.__familyPanel?.find(row => row.id === id)?.auto === true, hunterId, { timeout: 10000 });
  assert.equal(hunter().auto, true, 'the server does not hold the switch');
  assert.equal(await sw.getAttribute('aria-pressed'), 'true');
  assert.match(await sw.getAttribute('aria-label'), /take the choices back/);
  assert.ok(world().events.some(event => event.actorId === hunterId && /decide for themself/.test(event.text)), 'the switch was not written into the family record');
  ok(`the word "auto" pressed on ${hunter().name}'s row: the server holds it, the row shows pressed on the next snapshot, and the record says so`);
  await shot(page, 'switch-on');

  // ------------------------------------------------------------------- a hunt from the panel: decided alone, and repeated
  await asMain(page, hunterId);
  await page.locator(`.panel-row[data-entity-id="${hunterId}"] .panel-icon[data-key="hunt-timber"]`).click();
  // How they go is asked first (owner, 2026-09-24; public/going.js): the quickest, as the chooser has it.
  await sendTheWay(page);
  // The server's answer: the order taken (the icon glows) or refused (its sentence on the error line).
  const answer = await page.waitForFunction(id => {
    const error = (document.querySelector('#error')?.textContent || '').trim();
    if (error) return { error };
    return document.querySelector(`.panel-row[data-entity-id="${id}"] .panel-icon[data-key="hunt-timber"]`)?.dataset.active === 'true' ? { glowed: true } : null;
  }, hunterId, { timeout: 10000, polling: 50 }).then(handle => handle.jsonValue()).catch(() => ({}));
  assert.equal(answer.glowed, true, `the hunt was not taken: ${answer.error || 'no glow'} (server: ${JSON.stringify(hunter().chore)} ${hunter().task} ${JSON.stringify(hunter().location)})`);
  ok('a hunt sent from the panel with the switch on, and the icon glowing');
  const started = Date.now();
  let asking = 0, glows = 0, wasGlowing = true;
  while (hunts(hunterId) < 2 && Date.now() - started < 240000) {
    await page.waitForTimeout(150);
    const row = await page.evaluate(id => window.__familyPanel?.find(one => one.id === id), hunterId);
    if (row?.needs?.includes('asking')) asking++;
    const glowing = row?.active?.includes('hunt-timber') || false;
    if (glowing && !wasGlowing) glows++;
    wasGlowing = glowing;
  }
  measured.secondsToTwoHunts = Math.round((Date.now() - started) / 100) / 10;
  measured.huntsFinished = hunts(hunterId);
  measured.snapshotsAsking = asking;
  measured.glowResumed = glows;
  assert.ok(hunts(hunterId) >= 2, `${hunter().name} finished ${hunts(hunterId)} hunts in ${measured.secondsToTwoHunts} s: the hunt was not repeated (order ${JSON.stringify(hunter().order)}, task ${hunter().task}, chore ${JSON.stringify(hunter().chore)}, at ${hunter().location?.siteId}; ${world().events.filter(event => event.actorId === hunterId).slice(-5).map(event => event.text).join(" / ")})`);
  assert.equal(asking, 0, `a "!" for work that stopped to ask was on ${hunter().name} in ${asking} snapshots`);
  assert.ok(world().events.some(event => event.actorId === hunterId && /deciding for themself/.test(event.text)), 'the shot was not decided alone');
  // The next hunt begins on the tick the last one ends, so the glow need never dip: measured, not required.
  ok(`${hunter().name} decided the shot alone with no "!" and went out again by themself: ${hunts(hunterId)} hunts in ${measured.secondsToTwoHunts} s`);
  await shot(page, 'hunting-again');

  // ------------------------------------------------------------------------------------------- off: nobody goes again
  await sw.click();
  await page.waitForFunction(id => window.__familyPanel?.find(row => row.id === id)?.auto === false, hunterId, { timeout: 10000 });
  assert.equal(hunter().auto, undefined, 'off left something on the person');
  assert.equal(await sw.getAttribute('aria-pressed'), 'false');
  const before = hunts(hunterId);
  const settled = Date.now();
  while (hunter().chore && Date.now() - settled < 120000) await page.waitForTimeout(150);
  const done = hunts(hunterId);
  await page.waitForTimeout(150 * 40);
  assert.equal(hunts(hunterId), done, `${hunter().name} went out again with the switch off`);
  measured.huntsAfterOff = hunts(hunterId) - before;
  ok('pressed off: the hunt in hand finished and nobody went out again');

  // ------------------------------------------- the owner's season (2026-09-25): one on auto to plant, another on the harvest
  // "i could put a character on planting autoplay, and another one on harvest. then they'd naturally keep going until i turned
  // off autoplay for them."
  const people = await page.evaluate(() => window.__familyPanel);
  const planterId = people.find(one => one.role === 'father')?.id, reaperId = people.find(one => one.role === 'mother')?.id;
  assert.ok(planterId && reaperId, `no father and mother on the panel: ${JSON.stringify(people.map(one => one.role))}`);
  const household = () => world().households['hh-1'];
  // The seed the family packed (above) is two plantings of either crop.
  assert.ok(household().resources.seed >= 6, `the family has ${household().resources.seed} seed, not the six it packed`);
  for (let t = 0; t < 600 && (world().entities[planterId].chore || world().entities[reaperId].chore); t++) await page.waitForTimeout(100);
  const fieldStates = [household().field?.state || 'bare'];
  assert.equal(fieldStates[0], 'bare', 'the field is not bare to begin the season');
  const onAuto = async id => {
    await page.locator(`.panel-row[data-entity-id="${id}"] .panel-auto`).click();
    await page.waitForFunction(one => window.__familyPanel?.find(row => row.id === one)?.auto === true, id, { timeout: 10000 });
  };
  // A student's order first, by hand, and then the switch: the order given is the task auto repeats.
  await asMain(page, planterId);
  await page.locator(`.panel-row[data-entity-id="${planterId}"] .panel-icon[data-key="plant-field"]`).click();
  await page.waitForFunction(id => window.__familyPanel?.find(row => row.id === id)?.active?.includes('plant-field'), planterId, { timeout: 10000 });
  await onAuto(planterId);
  await page.waitForFunction(id => /^Auto: plant the field/.test(window.__familyPanel?.find(row => row.id === id)?.autoSays || ''), planterId, { timeout: 10000 });
  ok(`${world().entities[planterId].name} sent to plant the field from the panel, then put on auto: the row says "Auto: plant the field"`);
  await onAuto(reaperId);
  // The harvest cannot be done yet. On auto its icon is still open to press (the server's `waits`), and pressing it makes it
  // her task: she works about the place until the crop is ripe, and the row says so in the server's words.
  await asMain(page, reaperId);
  const reap = page.locator(`.panel-row[data-entity-id="${reaperId}"] .panel-icon[data-key="harvest-field"]`);
  await reap.waitFor({ state: 'visible', timeout: 10000 });
  assert.equal(await reap.getAttribute('data-waits'), 'true', 'the unripe harvest is not offered to wait for');
  await reap.click();
  await page.waitForFunction(id => /^Auto: bring in the crop\./.test(window.__familyPanel?.find(row => row.id === id)?.autoSays || ''), reaperId, { timeout: 10000 });
  assert.equal(world().entities[reaperId].order?.chore, 'harvest-field');
  ok(`${world().entities[reaperId].name} on auto and given the harvest before anything is ripe: it is her task, and she waits`);
  const said = { planter: new Set(), reaper: new Set() };
  let glowSeen = null;
  const seasonStarted = Date.now();
  const finishedCount = (id, name) => world().events.filter(event => event.actorId === id && event.text.endsWith(`finished: ${name}.`)).length;
  while ((finishedCount(planterId, 'plant the field') < 2 || finishedCount(reaperId, 'bring in the crop') < 1 || household().field.state !== 'planted') && Date.now() - seasonStarted < 180000) {
    await page.waitForTimeout(120);
    const state = household().field?.state;
    if ((measured.seedTrace ??= []).at(-1) !== household().resources.seed) measured.seedTrace.push(household().resources.seed);
    if (state && fieldStates.at(-1) !== state) fieldStates.push(state);
    const shown = await page.evaluate(ids => ids.map(id => window.__familyPanel?.find(row => row.id === id)), [planterId, reaperId]);
    if (shown[0]?.autoSays) said.planter.add(`${shown[0].autoWaiting ? 'waiting' : 'at it'}: ${shown[0].autoSays}`);
    if (shown[1]?.autoSays) said.reaper.add(`${shown[1].autoWaiting ? 'waiting' : 'at it'}: ${shown[1].autoSays}`);
    // Both on, and one of them waiting: the moment the screenshots are for.
    if (!glowSeen && shown.every(row => row?.auto) && shown.some(row => row?.autoWaiting) && state === 'planted') {
      glowSeen = { at: Math.round((Date.now() - seasonStarted) / 100) / 10, looks: await switchLooks(page), lines: shown.map(row => row.autoSays) };
      for (const [width, height] of [[1366, 768], [1024, 768]]) {
        await page.setViewportSize({ width, height });
        await page.waitForTimeout(300);
        glowSeen[`looks${width}`] = await switchLooks(page);
        await panelShot(page, `on-${width}x${height}`);
      }
      await page.setViewportSize({ width: 1440, height: 950 });
    }
  }
  measured.season = { seconds: Math.round((Date.now() - seasonStarted) / 100) / 10, fieldStates, plantings: finishedCount(planterId, 'plant the field'), harvests: finishedCount(reaperId, 'bring in the crop'), said: { planter: [...said.planter], reaper: [...said.reaper] }, glowSeen };
  assert.deepEqual(fieldStates.slice(0, 5), ['bare', 'planted', 'ripe', 'bare', 'planted'], `the field went ${fieldStates.join(' > ')} in ${measured.season.seconds} s (planter ${JSON.stringify(world().entities[planterId].order)} ${world().entities[planterId].task} ${JSON.stringify(world().entities[planterId].chore)}; seed ${JSON.stringify(measured.seedTrace)}, cleared ${clearedOf(household())}; ${world().events.filter(event => event.actorId === planterId).slice(-4).map(event => event.text).join(' / ')})`);
  assert.ok(finishedCount(planterId, 'plant the field') >= 2 && finishedCount(reaperId, 'bring in the crop') >= 1, `planted ${finishedCount(planterId, 'plant the field')}, brought in ${finishedCount(reaperId, 'bring in the crop')}`);
  ok(`the field planted, grown, brought in and planted again with nobody pressing anything: ${fieldStates.join(' > ')} in ${measured.season.seconds} s`);
  assert.ok([...said.planter].some(line => /^waiting: Auto: plant the field\. The field is already planted\. Working about the place/.test(line)), `the planter's row never said why he waited: ${[...said.planter].join(' / ')}`);
  assert.ok([...said.reaper].some(line => /^waiting: Auto: bring in the crop\. The field is not ready\. Working about the place/.test(line)), `the reaper's row never said why she waited: ${[...said.reaper].join(' / ')}`);
  assert.ok([...said.planter].some(line => /^at it: Auto: plant the field, over and over\./.test(line)) && [...said.reaper].some(line => /^at it: Auto: bring in the crop, over and over\./.test(line)), 'a row never said what auto was doing');
  ok('each row said what auto was doing and, while it waited, why, in the server\'s words');
  assert.ok(glowSeen, 'the two switches were never seen on together with one waiting');
  for (const looks of [glowSeen.looks1366, glowSeen.looks1024]) {
    const lit = looks.filter(one => [planterId, reaperId].includes(one.id));
    assert.ok(lit.length === 2 && lit.every(one => one.text === 'Auto ✓' && one.pressed === 'true' && one.glowing && one.visible && one.nameFits), `the switches on: ${JSON.stringify(lit)}`);
    assert.ok(looks.filter(one => ![planterId, reaperId].includes(one.id)).every(one => one.text === 'Auto' && !one.glowing), 'a switch that is off glows');
  }
  ok('on, at 1366x768 and 1024x768: both switches read "Auto ✓", are pressed, and glow green; the others read "Auto" and do not');
  // Off again: both leave off, and the field is left as it stands.
  for (const id of [planterId, reaperId]) {
    await page.locator(`.panel-row[data-entity-id="${id}"] .panel-auto`).click();
    await page.waitForFunction(one => window.__familyPanel?.find(row => row.id === one)?.auto === false, id, { timeout: 10000 });
  }
  assert.equal(await page.locator(`.panel-row[data-entity-id="${planterId}"] .panel-auto-line`).isVisible(), false, 'off, the row still says what auto is doing');
  ok('pressed off: the line goes, and the switch reads "Auto" again');

  // ------------------------------------------------------------------------------------------- at phone width
  await page.setViewportSize({ width: 400, height: 800 });
  await page.waitForTimeout(600);
  const scroll = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, inner: window.innerWidth }));
  assert.ok(scroll.width <= scroll.inner, `the page scrolls sideways at 400 px: ${scroll.width} > ${scroll.inner}`);
  measured.phone = scroll;
  ok('at 400 px nothing scrolls sideways with the switch on every row');
  await shot(page, 'phone');

  assert.deepEqual(errors, [], `page errors: ${errors.join(' | ')}`);
  ok('no page errors anywhere in the run');

  writeFileSync('docs/evidence/auto-browser.json', `${JSON.stringify({
    record: 'auto-browser',
    date: new Date().toISOString().slice(0, 10),
    verdict: 'PASS',
    browser: await browser.version(),
    task: 'docs/FAMILY_PANEL.md §11.7: the auto switch on every row, held by the server (set-auto); a hunt on auto decided alone with no "!" and repeated when the hunter comes home; off, nobody goes again; and §16 (owner 2026-09-25): the switch reads "Auto" off and "Auto ✓" with a green glow on, at 1366x768 and 1024x768; one person on auto to plant and another given the unripe harvest to wait for, the field planted, grown, brought in and planted again with nobody pressing anything, and each row saying what auto is doing and why it waits, in the server words; nothing scrolling sideways at 400 px.',
    environment: 'Same computer: a local classroom server at 150 ms a tick and headless Chrome. Not a physical LAN, a classroom, a real phone or a weak computer.',
    checks: pass,
    measured,
    screenshots: shots,
    notProved: [
      'The army\'s questions, Travis\'s couriers and the Runaway Scrape on auto in a browser: proved against the simulation in tests/auto.test.mjs; the cards they use are the ones scripts/army-browser-proof.mjs, scripts/alamo-siege-browser-proof.mjs and scripts/scrape-browser-proof.mjs press.',
      'The flight card\'s "Stay, and take the risk": the action is tested in tests/auto.test.mjs; the button is not pressed here.',
      'A weak computer or a real phone: the phone here is Chrome at 400 by 800.',
    ],
  }, null, 2)}\n`);
  console.log(`\n${pass.length} checks passed; wrote docs/evidence/auto-browser.json`);
} finally {
  await browser.close();
  await app.close();
}
