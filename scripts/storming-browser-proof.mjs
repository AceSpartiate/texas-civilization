// The storming of Béxar, watched: docs/COLONIES.md §6l, build step 6.
//
// tests/storming.test.mjs proves the questions, the bounds on the dead and wounded, the grades of wound and when word comes
// home. This proves what a student sees: on December 4 the winter-quarters question and then Milam's call on the volunteer's
// own card, with nothing about the risk; the wrong express in the family's reports; the victory after it, with the terms as
// signed and the Mexican losses as a range; and what happened to their own person. It also shows a wound's lasting mark on the
// card - placed in process on the volunteer, and said so in the record, because a roll that marks hh-1 cannot be waited for.
//
// The class is played in process to December 3, because the march and the siege take about four hundred ticks. The seed is
// the siege proof's, whose hh-1 marches with the army (a family on the coast gathers at Victoria and never joins it).
//
// Run: npm run test:storming
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

function playedToDecember(seed, playerCount) {
  const world = createGonzalesWorld(seed, playerCount, { map: 'colonies' });
  world.status = 'running';
  const household = world.households['hh-1'];
  for (let i = 0; i < 1200 && !world.calls?.[household.id] && !world.director.complete; i++) stepWorld(world);
  if (world.calls?.[household.id]) {
    const answerers = projectWorld(world, household.id, 'student', { includeMap: false }).request.answerers;
    const found = Object.entries(answerers).find(([, options]) => options.find(o => o.id === 'turn-out')?.can);
    if (found) applyAction(world, household.id, { action: 'turn-out', entityId: found[0], mode: 'horse' });
  }
  const before = momentOf(world, 'winter-quarters') - 1440;
  for (let i = 0; i < 4000 && world.minute < before && !world.director.complete; i++) stepWorld(world);
  // A lasting mark, placed in process on hh-1's volunteer, since no roll that marks them can be waited for.
  const marked = world.army?.members.find(id => world.entities[id].householdId === 'hh-1');
  if (marked) world.entities[marked].marks = ['lost an eye'];
  world.status = 'lobby';
  return world;
}

const app = createClassroom({ seed: 'siege-proof', playerCount: 5, tickMs: 700, worldFactory: playedToDecember });
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
const RISK = /kill|die|death|danger|risk|wound|hurt/i;
mkdirSync('docs/evidence', { recursive: true });

try {
  const host = await post('/api/host', { key: app.state.hostKey });
  const hostCookie = host.headers.get('set-cookie').split(';')[0];
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 950 } })).newPage();
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url);
  await page.locator('[name=name]').fill('Storming reader');
  await page.locator('[name=code]').fill(app.state.sessionCode);
  await page.getByRole('button', { name: 'Join', exact: true }).click();
  await page.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-1');
  for (let i = 2; i <= 5; i++) await post('/api/join', { name: `Reader ${i}`, code: app.state.sessionCode });
  await post('/api/command', { id: `proof-start-${crypto.randomUUID()}`, action: 'start' }, hostCookie);
  await page.waitForFunction(() => window.__snapshot?.world.status === 'running');

  const answer = async (key, shot) => {
    await page.waitForFunction(([id, key]) => window.__snapshot?.world.army?.ours?.find(one => one.id === id)?.questions?.some(q => q.key === key && q.answer === 'open'), [volunteer, key], { timeout: 120000 });
    await page.locator(`.panel-row[data-entity-id="${volunteer}"] .panel-portrait`).click();
    const button = page.locator(`#selection-army button[data-action="army-answer"][data-question="${key}"][data-answer="yes"]`);
    await button.waitFor({ state: 'visible' });
    const text = (await page.locator('#selection-army').innerText()).replace(/\s+/g, ' ').trim();
    if (shot) await page.screenshot({ path: shot });
    await button.click();
    await page.waitForFunction(([id, key]) => !window.__snapshot?.world.army?.ours?.find(one => one.id === id)?.questions?.some(q => q.key === key && q.answer === 'open'), [volunteer, key], { timeout: 15000 });
    return text;
  };

  observed.winter = await answer('winter');
  assert.match(observed.winter, /winter quarters/);
  ok(`December 4, the winter-quarters question on the volunteer's card, answered to stay: "${observed.winter}"`);
  observed.milam = await answer('milam', 'docs/evidence/storming-milam-question.png');
  assert.match(observed.milam, /Ben Milam/);
  assert.doesNotMatch(observed.milam, RISK, 'Milam\'s call says what it risks');
  assert.equal(app.state.world.army.questions.milam.asks[volunteer], 'yes');
  ok(`Milam's call on the card, with nothing about the risk, answered by the server: "${observed.milam}"`);

  const report = () => page.evaluate(() => (window.__snapshot?.world.reports || []).find(r => r.topicId === 'bexar-storming') || null);
  await page.waitForFunction(() => (window.__snapshot?.world.reports || []).some(r => r.topicId === 'bexar-storming'), null, { timeout: 120000 });
  observed.express = await report();
  assert.equal(observed.express.status, 'rumor');
  assert.match(observed.express.text, /daylight on the 6th/);
  ok(`the wrong express reaches the family's reports first: "${observed.express.text}"`);

  await page.waitForFunction(() => (window.__snapshot?.world.reports || []).some(r => r.topicId === 'bexar-storming' && r.status === 'confirmed'), null, { timeout: 180000 });
  observed.victory = await report();
  assert.match(observed.victory.text, /Constitution of 1824/);
  assert.match(observed.victory.text, /about a hundred and fifty, or about three hundred/);
  ok('the victory follows, the terms as signed and the Mexican losses as a range');
  await page.waitForFunction(() => (window.__snapshot?.world.events || []).some(e => /the storming|while the others fought in the town/.test(e.text) && e.type !== 'information'), null, { timeout: 30000 });
  observed.own = await page.evaluate(() => window.__snapshot.world.events.find(e => /the storming|while the others fought in the town/.test(e.text) && e.type !== 'information').text);
  ok(`the family is told what happened to their person: "${observed.own}"`);

  // The lasting mark placed in process, on the person's own card.
  await page.waitForFunction(id => window.__snapshot?.world.entities?.find(e => e.id === id)?.marks?.length, volunteer, { timeout: 30000 });
  await page.locator(`.panel-row[data-entity-id="${volunteer}"] .panel-portrait`).click();
  await page.waitForTimeout(500);
  observed.card = await page.locator('#selection-state').innerText();
  await page.screenshot({ path: 'docs/evidence/storming-news.png' });
  assert.match(observed.card, /lost an eye/, `the lasting mark is not on the card: "${observed.card}"`);
  ok(`a lasting mark shows on the person's card: "${observed.card}"`);

  assert.deepEqual(errors, [], `the page threw: ${errors.join(' | ')}`);
  ok('no page errors');
  writeFileSync('docs/evidence/storming-browser.json', `${JSON.stringify({
    record: 'The storming of Béxar, in a browser: docs/COLONIES.md build step 6',
    date: new Date().toISOString().slice(0, 10), verdict: 'PASS',
    note: "Same computer only. A real class on the colonies map, played in process to December 3 with hh-1's volunteer in the army, then served live; a student answered the winter-quarters question and Milam's call on the card and watched the wrong express and then the victory reach the family. The lasting mark was placed on the volunteer in process. No LAN or district claim.",
    checks: pass, observed, screenshots: ['docs/evidence/storming-milam-question.png', 'docs/evidence/storming-news.png'],
  }, null, 2)}\n`);
  console.log(`\n${pass.length} checks passed.`);
} finally {
  await browser.close();
  await app.close();
}
