// A student with only a keyboard farms (triage 2.13, classroom audit S8, 2026-09-29), in a real browser.
//
// Choosing the house site, surveying and clearing a first plot all wanted a tap on the map. Now the server offers suggested
// places as buttons (sim/suggest.mjs, `/api/suggest`), and Enter on the map looks at the spot in its middle. This walks the
// real land's first hour with the keyboard alone - Tab, Enter and the arrow keys, never a pointer - from the wagon at the
// surveyor's mark to a house site set, ten acres surveyed and staked, and that plot being cleared. Joining, making the family
// and the teacher's Start are done as every proof does them: they are not what this proves.
//
// Run: npm run test:keyboard-farm (PLAYWRIGHT_MODULE, BROWSER_EXECUTABLE as for every proof). Same computer only.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createClassroom } from '../server/app.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { meetFamily } from './support/meet-family.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const pass = [];
const ok = label => { pass.push(label); console.log('PASS', label); };

// The real land, where a family comes in to its surveyor's mark and chooses where the house stands (sim/homesite.mjs).
const app = createClassroom({ seed: 'keyboard-farm', playerCount: 5, tickMs: 300, worldFactory: (seed, count) => createGonzalesWorld(seed, count, { map: 'colonies' }) });
const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const errors = [];
const post = async (path, body, cookie) => {
  const response = await fetch(url + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(cookie && { Cookie: cookie }) }, body: JSON.stringify(body) });
  assert.equal(response.status, 200, `${path}: ${response.status}`);
  return response;
};

let record = {};
try {
  const host = await post('/api/host', { key: app.state.hostKey });
  const hostCookie = host.headers.get('set-cookie').split(';')[0];
  const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url);
  await page.locator('[name=name]').fill('Keys only');
  await page.locator('[name=code]').fill(app.state.sessionCode);
  await page.getByRole('button', { name: 'Join', exact: true }).click();
  await page.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-1');
  await meetFamily(page);
  for (let i = 2; i <= 5; i++) await post('/api/join', { name: `Reader ${i}`, code: app.state.sessionCode });
  await post('/api/command', { id: `proof-start-${crypto.randomUUID()}`, action: 'start' }, hostCookie);
  await page.waitForFunction(() => window.__snapshot?.world.status === 'running');
  // Everybody but the one this proof orders about is put on auto, from the student's own page, so no idle child stops the
  // surveyor to talk (a real rule, and not what this proves): the order the keyboard sends is the one the server hears.
  await page.evaluate(async () => {
    const { household } = window.__snapshot.world;
    for (const id of household.members.filter(member => member !== household.principalId)) {
      await fetch('/api/command', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: `auto-${id}-${Date.now()}`, action: 'set-auto', entityId: id, auto: true }) });
    }
  });

  const active = () => page.evaluate(() => { const one = document.activeElement; return one ? `${one.tagName.toLowerCase()}${one.id ? `#${one.id}` : ''}${one.dataset?.chore ? `[${one.dataset.chore}]` : ''} "${(one.textContent || '').trim().slice(0, 60)}"` : 'nothing'; });
  const focusedIn = selector => page.evaluate(found => Boolean(document.activeElement?.matches(found)), selector);
  /** Tab until the focus is on `selector`, as a student would, and say how many presses it took. */
  const tabTo = async (selector, limit = 250) => {
    for (let presses = 0; presses <= limit; presses++) {
      if (await focusedIn(selector)) return presses;
      await page.keyboard.press('Tab');
    }
    throw new Error(`Tab never reached ${selector}; the focus is on ${await active()}`);
  };

  // ------------------------------------------------------------- the house site, from a suggested place
  await page.waitForFunction(() => window.__snapshot?.world.land?.choosingSite?.can && !document.querySelector('#site-choose').hidden, null, { timeout: 60000 });
  await page.waitForFunction(() => !document.querySelector('#site-suggested').hidden && document.querySelectorAll('#site-suggested button').length > 0, null, { timeout: 15000 });
  const sites = await page.locator('#site-suggested button').allTextContents();
  assert.ok(sites.length >= 1 && sites.length <= 3, `one to three sites: ${JSON.stringify(sites)}`);
  for (const label of sites) assert.match(label, /wagon: .+, (water close by|needs a well)$/, `a label a child can read: ${label}`);
  assert.equal(await page.locator('#site-suggested').getAttribute('role'), 'group');
  assert.equal(await page.locator('#site-suggested').getAttribute('aria-label'), 'Suggested places');
  ok(`the house site's panel offers ${sites.length} suggested places, labelled: ${sites.map(label => `"${label}"`).join(', ')}`);
  // Reached with Tab, not only given the focus: from the map (the first thing on the page a keyboard reaches), Tab walks to it.
  await page.evaluate(() => document.querySelector('#world-map').focus());
  const siteTabs = await tabTo('#site-suggested button');
  const siteIndex = await page.evaluate(() => document.activeElement.dataset.index);
  ok(`Tab reaches a suggested site from the map (${siteTabs} presses)`);
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => !document.querySelector('#site-build').hidden, null, { timeout: 15000 });
  assert.equal(await page.locator(`#site-suggested button[data-index="${siteIndex}"]`).getAttribute('aria-pressed'), 'true', 'the pressed place is marked');
  const siteWords = (await page.locator('#site-text').textContent()).trim();
  assert.match(siteWords, /^The house will stand/, `the site is looked over in the server's words: ${siteWords}`);
  ok(`Enter on it looks the place over, and the map goes there: "${siteWords.slice(0, 90)}…"`);
  await tabTo('#site-build', 20);
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => !window.__snapshot?.world.land?.choosingSite, null, { timeout: 15000 });
  const household = app.state.world.households['hh-1'];
  assert.ok(household.site && !household.choosingSite, 'the server set the house site');
  ok('Tab to "Set the house here" and Enter: the house site is chosen, with no pointer');

  // --------------------------------------------------------------------- ten acres surveyed from a suggestion
  const principal = await page.evaluate(() => window.__snapshot.world.household.principalId);
  const surveyIcon = `.panel-row[data-entity-id="${principal}"] .panel-icon[data-chore="survey-plot"]`;
  // The family comes over to the site with the wagon first; survey is offered when the person is home again.
  await page.waitForFunction(found => { const button = document.querySelector(found); return button && !button.disabled && button.getAttribute('aria-disabled') !== 'true'; }, surveyIcon, { timeout: 60000 });
  await page.evaluate(() => document.querySelector('#world-map').focus());
  const surveyTabs = await tabTo(surveyIcon);
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => !document.querySelector('#survey-choose').hidden && !document.querySelector('#survey-suggested').hidden && document.querySelectorAll('#survey-suggested button').length > 0, null, { timeout: 15000 });
  assert.ok(await focusedIn('#survey-suggested button'), `the keyboard is taken to the first suggested place; it is on ${await active()}`);
  const acres = await page.locator('#survey-suggested button').allTextContents();
  ok(`Tab to Survey (${surveyTabs} presses) and Enter: the panel opens with the focus on the first of ${acres.length}: ${acres.map(label => `"${label}"`).join(', ')}`);

  // The map itself: Tab to it, and while a place is being chosen it shows the ring Enter looks through; the arrow keys move it.
  const hint = (await page.locator('#survey-text').textContent()).trim();
  await tabTo('#world-map');
  await page.waitForFunction(() => window.__keyTarget === true, null, { timeout: 5000 });
  ok('Tab reaches the map, which shows the ring Enter looks through while a place is being chosen');
  for (let step = 0; step < 2; step++) await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('Enter');
  await page.waitForFunction(was => { const now = document.querySelector('#survey-text').textContent.trim(); return now !== was && now !== 'Looking the ground over…'; }, hint, { timeout: 15000 });
  const looked = (await page.locator('#survey-text').textContent()).trim();
  ok(`the arrow keys move the map and Enter looks at its middle, in the server's words: "${looked.slice(0, 90)}"`);

  // Then a suggested place, sent.
  await tabTo('#survey-suggested button[data-index="0"]');
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => document.querySelector('#survey-suggested button[data-index="0"]')?.getAttribute('aria-pressed') === 'true' && !document.querySelector('#survey-send').hidden, null, { timeout: 15000 })
    .catch(async error => { throw new Error(`${error.message}: ${await page.evaluate(() => JSON.stringify({ text: document.querySelector('#survey-text').textContent, note: document.querySelector('#survey-note').textContent, pressed: [...document.querySelectorAll('#survey-suggested button')].map(b => b.getAttribute('aria-pressed')), send: document.querySelector('#survey-send').hidden, panel: document.querySelector('#survey-choose').hidden }))}, focus ${await active()}`); });
  await tabTo('#survey-send', 20);
  await page.keyboard.press('Enter');
  await page.waitForFunction(id => { const entity = window.__snapshot?.world.entities.find(one => one.id === id); return entity?.chore?.id === 'survey-plot' || entity?.task === 'travel'; }, principal, { timeout: 15000 })
    .catch(async error => { throw new Error(`${error.message}: ${await page.evaluate(id => JSON.stringify({ text: document.querySelector('#survey-text').textContent, note: document.querySelector('#survey-note').textContent, error: document.querySelector('#error').textContent, panel: document.querySelector('#survey-choose').hidden, chore: window.__snapshot?.world.entities.find(one => one.id === id)?.chore, task: window.__snapshot?.world.entities.find(one => one.id === id)?.task }), principal)}; server: ${JSON.stringify({ chore: app.state.world.entities[principal].chore, task: app.state.world.entities[principal].task })}`); });
  assert.equal(app.state.world.entities[principal].chore?.id, 'survey-plot', 'the server sent the surveyor');
  ok('Tab to the first suggested place, Enter, Tab to "Survey it" and Enter: the surveyor is sent');

  // ------------------------------------------------------------------------- the staked plot cleared, from a suggestion
  const clearIcon = `.panel-row[data-entity-id="${principal}"] .panel-icon[data-chore="clear-plot"]`;
  await page.waitForFunction(found => { const button = document.querySelector(found); return (window.__snapshot?.world.land?.plots || []).some(plot => plot.state === 'staked') && button && !button.disabled && button.getAttribute('aria-disabled') !== 'true'; }, clearIcon, { timeout: 90000 });
  await page.evaluate(() => document.querySelector('#world-map').focus());
  await tabTo(clearIcon);
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => !document.querySelector('#survey-choose').hidden && !document.querySelector('#survey-suggested').hidden && document.querySelectorAll('#survey-suggested button').length > 0, null, { timeout: 15000 });
  const plots = await page.locator('#survey-suggested button').allTextContents();
  assert.ok(await focusedIn('#survey-suggested button'), `focus on the first plot; it is on ${await active()}`);
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => !document.querySelector('#survey-send').hidden, null, { timeout: 15000 });
  assert.equal((await page.locator('#survey-send').textContent()).trim(), 'Clear it');
  await tabTo('#survey-send', 20);
  await page.keyboard.press('Enter');
  await page.waitForFunction(id => window.__snapshot?.world.entities.find(one => one.id === id)?.chore?.id === 'clear-plot', principal, { timeout: 15000 });
  ok(`the plot the survey staked is offered to clear (${plots.map(label => `"${label}"`).join(', ')}), and Enter, Tab, Enter sets the clearing going`);

  assert.deepEqual(errors, [], `page errors: ${errors.join('; ')}`);
  ok('no page errors');
  record = { verdict: 'PASS', checks: pass.length };
} catch (error) {
  record = { verdict: 'FAIL', error: error.message, checks: pass.length };
  console.error(error);
  process.exitCode = 1;
} finally {
  await browser.close();
  await app.close();
  mkdirSync('docs/evidence', { recursive: true });
  writeFileSync('docs/evidence/keyboard-farm.json', `${JSON.stringify({ record: 'keyboard-farm', date: new Date().toISOString().slice(0, 10), sameComputerOnly: true, ...record, passed: pass }, null, 2)}\n`);
}
