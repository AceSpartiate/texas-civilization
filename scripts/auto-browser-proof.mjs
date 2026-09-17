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
// Same computer only: headless Chrome. Run: npm run test:auto
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createClassroom } from '../server/app.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';

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
  await page.locator('#roll-family').click();
  await page.waitForFunction(() => document.querySelector('#roll-family')?.textContent === 'Meet your family', null, { timeout: 15000 });
  await page.locator('#roll-family').click();
  await page.locator('#family-book').waitFor({ state: 'visible' });
  await page.locator('#journal-close').click();
  if (await page.locator('#wagon-done').isVisible()) await page.locator('#wagon-done').click();
  if (await page.locator('#tutorial-skip').isVisible()) await page.locator('#tutorial-skip').click();
  await page.locator('#family-panel').waitFor({ state: 'visible' });
  await page.waitForFunction(() => window.__familyPanel?.length >= 3);
  await post('/api/command', { id: `proof-start-${crypto.randomUUID()}`, action: 'start' }, hostCookie);
  await page.waitForFunction(() => window.__snapshot?.world.status === 'running', null, { timeout: 15000 });
  world().households['hh-1'].resources.powder = 8;

  // ------------------------------------------------------------------------------------------- the switch, off then on
  const rows = await page.evaluate(() => window.__familyPanel);
  assert.ok(rows.every(row => row.auto === false), 'somebody was on auto before anybody pressed anything');
  assert.equal(await page.locator('.panel-row .panel-auto').count(), rows.length, 'not every row has the switch');
  ok('every row has the switch, and nobody is on auto to begin with');
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
  await page.locator(`.panel-row[data-entity-id="${hunterId}"] .panel-icon[data-key="hunt-timber"]`).click();
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
  assert.ok(hunts(hunterId) >= 2, `${hunter().name} finished ${hunts(hunterId)} hunts in ${measured.secondsToTwoHunts} s: the hunt was not repeated`);
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
    task: 'docs/FAMILY_PANEL.md §11.7: the auto switch on every row, held by the server (set-auto); a hunt on auto decided alone with no "!" and repeated when the hunter comes home; off, nobody goes again; nothing scrolling sideways at 400 px.',
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
