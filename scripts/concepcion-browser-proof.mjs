// Concepción, watched: docs/COLONIES.md §6i, build step 6.
//
// tests/concepcion.test.mjs proves the halts, the question, who fought and the bound on the dead. This proves what a student
// sees: the army named at its camp; on October 22 the question on their volunteer's own card, with nothing on it about what
// either answer risks; the answer taken by the server; and after the 28th, what happened to their person in their family's
// story and the camp at Concepción.
//
// The class is played in process to the Salado, a day before the question, because the march takes about 260 ticks.
//
// Run: npm run test:concepcion
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createClassroom } from '../server/app.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, projectWorld, stepWorld } from '../sim/world.mjs';
import { momentOf } from '../sim/directors.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const pass = [];
const ok = label => { pass.push(label); console.log('PASS', label); };
const observed = {};

/** A class on the real land, played to a day before Bowie and Fannin go ahead, with hh-1's volunteer in the ranks. */
function playedToTheSalado(seed, playerCount) {
  const world = createGonzalesWorld(seed, playerCount, { map: 'colonies' });
  world.status = 'running';
  const household = world.households['hh-1'];
  for (let i = 0; i < 1200 && !world.calls?.[household.id] && !world.director.complete; i++) stepWorld(world);
  if (world.calls?.[household.id]) {
    const answerers = projectWorld(world, household.id, 'student', { includeMap: false }).request.answerers;
    const found = Object.entries(answerers).find(([, options]) => options.find(o => o.id === 'turn-out')?.can);
    if (found) applyAction(world, household.id, { action: 'turn-out', entityId: found[0], mode: 'horse' });
  }
  const before = momentOf(world, 'detachment') - 1440;
  for (let i = 0; i < 2000 && world.minute < before && !world.director.complete; i++) stepWorld(world);
  world.status = 'lobby';
  return world;
}

const app = createClassroom({ seed: 'concepcion-proof', playerCount: 5, tickMs: 1500, worldFactory: playedToTheSalado });
const volunteer = app.state.world.army?.members.find(id => app.state.world.entities[id].householdId === 'hh-1');
assert.ok(volunteer, 'hh-1 has nobody in the army to watch');
const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const errors = [];
const post = async (path, body, cookie) => {
  const response = await fetch(url + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(cookie && { Cookie: cookie }) }, body: JSON.stringify(body) });
  assert.equal(response.status, 200, `${path}: ${response.status}`);
  return response;
};

try {
  const host = await post('/api/host', { key: app.state.hostKey });
  const hostCookie = host.headers.get('set-cookie').split(';')[0];
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 950 } })).newPage();
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url);
  await page.locator('[name=name]').fill('Concepción reader');
  await page.locator('[name=code]').fill(app.state.sessionCode);
  await page.getByRole('button', { name: 'Join', exact: true }).click();
  await page.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-1');
  for (let i = 2; i <= 5; i++) await post('/api/join', { name: `Reader ${i}`, code: app.state.sessionCode });
  await post('/api/command', { id: `proof-start-${crypto.randomUUID()}`, action: 'start' }, hostCookie);
  await page.waitForFunction(() => window.__snapshot?.world.status === 'running');

  // The army, named at its camp.
  await page.waitForFunction(() => window.__snapshot?.world.army?.camp, null, { timeout: 30000 });
  observed.camp = await page.locator('#army-where').textContent();
  assert.match(observed.camp, /camped at the Salado/, `the page does not name the camp: "${observed.camp}"`);
  ok(`the page names where the army is camped: "${observed.camp}"`);

  // October 22: the question, on the volunteer's own card.
  await page.waitForFunction(id => window.__snapshot?.world.army?.ours?.find(one => one.id === id)?.detachment === 'open', volunteer, { timeout: 60000 });
  await page.locator(`.panel-row[data-entity-id="${volunteer}"] .panel-portrait`).click();
  const go = page.locator('#selection-army button[data-action="detachment-go"]');
  await go.waitFor({ state: 'visible' });
  observed.question = (await page.locator('#selection-army').innerText()).trim();
  assert.match(observed.question, /Bowie and Fannin/);
  assert.doesNotMatch(observed.question, /kill|die|death|danger|risk|wound/i, 'the question says what the answer risks');
  mkdirSync('test-results', { recursive: true });
  await page.screenshot({ path: 'test-results/concepcion-question.png' });
  ok(`the family is asked on the volunteer's card, with nothing about the risk: "${observed.question.replace(/\s+/g, ' ')}"`);

  await go.click();
  await page.waitForFunction(id => window.__snapshot?.world.army?.ours?.find(one => one.id === id)?.detachment === 'go', volunteer, { timeout: 15000 });
  assert.equal(app.state.world.army.detachment.asks[volunteer], 'go');
  ok('the answer is the server\'s: the volunteer goes ahead with the division');

  // After the 28th: what happened to their person, in their own story; the army at Concepción.
  await page.waitForFunction(() => (window.__snapshot?.world.events || []).some(e => /at Mission Concepción/.test(e.text)), null, { timeout: 90000 });
  observed.story = await page.evaluate(() => window.__snapshot.world.events.filter(e => /at Mission Concepción/.test(e.text)).map(e => e.text));
  const part = app.state.world.participation.concepcion[volunteer];
  assert.equal(part.role, 'fought');
  ok(`the family is told what happened: "${observed.story.join(' / ')}"`);
  await page.waitForFunction(() => /Concepción/.test(document.querySelector('#army-where')?.textContent || '') || window.__snapshot?.world.status === 'ended', null, { timeout: 60000 });
  observed.after = await page.evaluate(() => window.__snapshot.world.army?.at);
  ok(`and the army's place afterwards: ${observed.after}`);

  assert.deepEqual(errors, [], `the page threw: ${errors.join(' | ')}`);
  ok('no page errors');
  writeFileSync('docs/evidence/concepcion-browser.json', `${JSON.stringify({
    record: 'Concepción, in a browser: docs/COLONIES.md build step 6',
    date: new Date().toISOString().slice(0, 10),
    verdict: 'PASS',
    note: "Same computer only. A real class on the colonies map, played in process to October 21 with hh-1's volunteer in the army, then served live; a student read the camp, answered the detachment question on the volunteer's card, and watched the fight's outcome reach the family. No LAN or district claim.",
    checks: pass,
    observed,
  }, null, 2)}\n`);
  console.log(`\n${pass.length} checks passed.`);
} finally {
  await browser.close();
  await app.close();
}
