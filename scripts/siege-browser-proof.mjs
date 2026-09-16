// The siege and the Grass Fight, watched: docs/COLONIES.md §6k, build step 6.
//
// tests/siege.test.mjs proves the camps, the questions, the fight's bounds and when word of it comes home. This proves what a
// student sees: the army named at the old mill; Austin's storm order asked on their volunteer's own card with nothing about
// what it risks, and answered; the pledge; the rumour of silver and the question to go out after the pack train; and days
// later the wrong rumour, then the fuller word with the Mexican losses as a range, and what happened to their own person.
//
// The class is played in process to November 20, the day before the storm order, because the march and the siege take
// about three hundred and fifty ticks.
//
// Run: npm run test:siege
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

/** A class on the real land, played to the day before Austin's storm order, with hh-1's volunteer in the ranks. */
function playedToTheSiege(seed, playerCount) {
  const world = createGonzalesWorld(seed, playerCount, { map: 'colonies' });
  world.status = 'running';
  const household = world.households['hh-1'];
  for (let i = 0; i < 1200 && !world.calls?.[household.id] && !world.director.complete; i++) stepWorld(world);
  if (world.calls?.[household.id]) {
    const answerers = projectWorld(world, household.id, 'student', { includeMap: false }).request.answerers;
    const found = Object.entries(answerers).find(([, options]) => options.find(o => o.id === 'turn-out')?.can);
    if (found) applyAction(world, household.id, { action: 'turn-out', entityId: found[0], mode: 'horse' });
  }
  const before = momentOf(world, 'storm-order') - 1440;
  for (let i = 0; i < 3000 && world.minute < before && !world.director.complete; i++) stepWorld(world);
  world.status = 'lobby';
  return world;
}

const app = createClassroom({ seed: 'siege-proof', playerCount: 5, tickMs: 700, worldFactory: playedToTheSiege });
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

try {
  const host = await post('/api/host', { key: app.state.hostKey });
  const hostCookie = host.headers.get('set-cookie').split(';')[0];
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 950 } })).newPage();
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url);
  await page.locator('[name=name]').fill('Siege reader');
  await page.locator('[name=code]').fill(app.state.sessionCode);
  await page.getByRole('button', { name: 'Join', exact: true }).click();
  await page.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-1');
  for (let i = 2; i <= 5; i++) await post('/api/join', { name: `Reader ${i}`, code: app.state.sessionCode });
  await post('/api/command', { id: `proof-start-${crypto.randomUUID()}`, action: 'start' }, hostCookie);
  await page.waitForFunction(() => window.__snapshot?.world.status === 'running');

  observed.camp = await page.locator('#army-where').textContent();
  assert.match(observed.camp, /camped at the old mill above Béxar/, `the page does not name the mill: "${observed.camp}"`);
  ok(`the page names where the army is camped: "${observed.camp}"`);

  /** Wait for a question on the volunteer's card, read it, screenshot it, and press an answer. */
  const answer = async (key, yes, shot) => {
    await page.waitForFunction(([id, key]) => window.__snapshot?.world.army?.ours?.find(one => one.id === id)?.questions?.some(q => q.key === key && q.answer === 'open'), [volunteer, key], { timeout: 90000 });
    await page.locator(`.panel-row[data-entity-id="${volunteer}"] .panel-portrait`).click();
    const button = page.locator(`#selection-army button[data-action="army-answer"][data-question="${key}"][data-answer="${yes ? 'yes' : 'no'}"]`);
    await button.waitFor({ state: 'visible' });
    const text = (await page.locator('#selection-army').innerText()).replace(/\s+/g, ' ').trim();
    mkdirSync('test-results', { recursive: true });
    if (shot) await page.screenshot({ path: shot });
    await button.click();
    await page.waitForFunction(([id, key]) => !window.__snapshot?.world.army?.ours?.find(one => one.id === id)?.questions?.some(q => q.key === key && q.answer === 'open'), [volunteer, key], { timeout: 15000 });
    return text;
  };

  observed.storm = await answer('storm', true, 'docs/evidence/siege-storm-question.png');
  assert.match(observed.storm, /stormed at dawn/);
  assert.doesNotMatch(observed.storm, RISK, 'the storm question says what it risks');
  assert.equal(app.state.world.army.questions.storm.asks[volunteer], 'yes');
  ok(`the storm order is asked on the volunteer's card and answered by the server: "${observed.storm}"`);

  observed.pledge = await answer('pledge', true);
  assert.match(observed.pledge, /pledge to stay/);
  assert.equal(app.state.world.army.questions.pledge.asks[volunteer], 'yes');
  ok('the pledge is asked and answered on the card');

  observed.grass = await answer('grass', true, 'docs/evidence/siege-grass-question.png');
  assert.match(observed.grass, /silver/);
  assert.doesNotMatch(observed.grass, RISK, 'the Grass Fight question says what it risks');
  ok(`the rumour of silver comes with the question to go out after the pack train: "${observed.grass}"`);

  // The word comes to the family's own reports: the wrong rumour first, days after the fight, then the fuller word.
  const report = () => page.evaluate(() => (window.__snapshot?.world.reports || []).find(r => r.topicId === 'grass-fight') || null);
  await page.waitForFunction(() => (window.__snapshot?.world.reports || []).some(r => r.topicId === 'grass-fight'), null, { timeout: 120000 });
  observed.rumour = await report();
  assert.equal(observed.rumour.status, 'rumor', 'the first word of the fight was not a rumour');
  assert.match(observed.rumour.text, /no loss on our side/);
  ok(`the rumour reaches the family's reports first: "${observed.rumour.text}"`);
  await page.waitForFunction(() => (window.__snapshot?.world.reports || []).some(r => r.topicId === 'grass-fight' && r.status === 'confirmed'), null, { timeout: 120000 });
  observed.word = await report();
  assert.match(observed.word.text, /three, fifteen, about fifty, or sixty/, 'the Mexican losses are not shown as a range');
  observed.silver = await page.evaluate(() => (window.__snapshot.world.reports || []).find(r => r.topicId === 'silver-train'));
  assert.equal(observed.silver?.status, 'contradicted', 'the silver rumour was never set right');
  await page.locator('#family-journal').click().catch(() => {});
  const journal = await page.locator('body').innerText();
  assert.ok(journal.includes('grass cut for the horses'), 'the fuller word is not on the page');
  ok('the fuller word follows, with the Mexican losses as a range, and the silver is set right');
  await page.waitForFunction(() => (window.__snapshot?.world.events || []).some(e => /went out with Bowie|slightly hurt in the fight|ran from the field|in the camp at the mill when/.test(e.text)), null, { timeout: 30000 });
  observed.own = await page.evaluate(() => window.__snapshot.world.events.find(e => /went out with Bowie|slightly hurt in the fight|ran from the field|in the camp at the mill when/.test(e.text)).text);
  await page.screenshot({ path: 'docs/evidence/siege-news.png' });
  ok(`the family is told what happened to their person: "${observed.own}"`);

  assert.deepEqual(errors, [], `the page threw: ${errors.join(' | ')}`);
  ok('no page errors');
  writeFileSync('docs/evidence/siege-browser.json', `${JSON.stringify({
    record: 'The siege and the Grass Fight, in a browser: docs/COLONIES.md build step 6',
    date: new Date().toISOString().slice(0, 10),
    verdict: 'PASS',
    note: "Same computer only. A real class on the colonies map, played in process to November 20 with hh-1's volunteer in the army, then served live; a student read the camp, answered the storm order, the pledge and the Grass Fight question on the volunteer's card, and watched the rumour and then the fuller word reach the family. No LAN or district claim.",
    checks: pass,
    observed,
    screenshots: ['docs/evidence/siege-storm-question.png', 'docs/evidence/siege-grass-question.png', 'docs/evidence/siege-news.png'],
  }, null, 2)}\n`);
  console.log(`\n${pass.length} checks passed.`);
} finally {
  await browser.close();
  await app.close();
}
