// The shops of the towns, in a real browser: docs/TOWNS.md.
//
// tests/shops.test.mjs proves what every trade does. This proves a student can use the street with
// the controls they have: the Go to a shop icon on a person's row, the question in town listing the
// shops that stand there, a counter whose every offer says what it does and what it costs, a meal at
// the tavern paid for in food, and the keepers standing in the town when one of the family is there.
//
// Run: npm run test:shops
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createClassroom } from '../server/app.mjs';
import { createSettledWorld, keepFoundingFamilies } from '../tests/support/settled.mjs';
import { meetFamily } from './support/meet-family.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const pass = [];
const ok = label => { pass.push(label); console.log('PASS', label); };
const observed = {};

const app = createClassroom({ seed: 'shops-proof', playerCount: 5, tickMs: 200, worldFactory: (seed, count) => keepFoundingFamilies(createSettledWorld(seed, count)) });
const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const errors = [];
const post = async (path, body, cookie) => {
  const response = await fetch(url + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(cookie && { Cookie: cookie }) }, body: JSON.stringify(body) });
  assert.equal(response.status, 200, `${path}: ${response.status}`);
  return response;
};
const answers = page => page.locator('#selection-work button[data-action=answer-chore]').evaluateAll(buttons =>
  buttons.map(button => ({ option: button.dataset.option, label: button.querySelector('.work-name')?.textContent, note: button.querySelector('.work-note')?.textContent, disabled: button.disabled })));

try {
  const host = await post('/api/host', { key: app.state.hostKey });
  const hostCookie = host.headers.get('set-cookie').split(';')[0];
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 950 } })).newPage();
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url);
  await page.locator('[name=name]').fill('Shops reader');
  await page.locator('[name=code]').fill(app.state.sessionCode);
  await page.getByRole('button', { name: 'Join', exact: true }).click();
  await page.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-1');
  // The title screen and the family made, before the world is drawn (public/creation.js, owner 2026-09-17).
  await meetFamily(page);
  for (let i = 2; i <= 5; i++) await post('/api/join', { name: `Reader ${i}`, code: app.state.sessionCode });
  await post('/api/command', { id: `proof-start-${crypto.randomUUID()}`, action: 'start' }, hostCookie);
  await page.waitForFunction(() => window.__snapshot?.world.status === 'running');

  const worker = 'hh-1-elena';
  const icon = page.locator(`.panel-row[data-entity-id="${worker}"] .panel-icon[data-key="visit-shop"]`);
  await icon.waitFor({ state: 'visible' });
  observed.icon = await icon.getAttribute('data-summary');
  await icon.click();
  ok(`the family panel offers the street: "${observed.icon}"`);

  // In town, the question lists the shops that stand there.
  await page.waitForFunction(id => window.__snapshot?.world.entities.find(e => e.id === id)?.chore?.ask?.id === 'which-shop', worker, { timeout: 60000 });
  await page.locator(`.panel-row[data-entity-id="${worker}"] .panel-portrait`).click();
  await page.locator('#selection-work button[data-action=answer-chore]').first().waitFor({ state: 'visible' });
  const street = await answers(page);
  observed.street = street.map(o => o.label);
  for (const trade of ['blacksmith', 'gunsmith', 'doctor', 'tavern', 'tanner', 'wheelwright', 'mill', 'weaver']) {
    assert.ok(street.some(o => o.option === trade), `the street has no ${trade}: ${street.map(o => o.option)}`);
  }
  ok(`in Gonzales the street has ${street.length - 1} shops: ${observed.street.join('; ')}`);

  // The keepers are standing in the town the family's person is in.
  const keepers = await page.evaluate(() => window.__snapshot.world.others.filter(o => o.resident).map(o => o.name));
  observed.keepers = keepers;
  assert.ok(keepers.length >= 8, `only ${keepers.length} townspeople are in sight: ${keepers}`);
  mkdirSync('test-results', { recursive: true });
  await page.screenshot({ path: 'test-results/shops-street.png' });
  ok(`${keepers.length} townspeople are in sight in Gonzales: ${keepers.join(', ')}`);

  await page.locator('#selection-work button[data-action=answer-chore][data-option="tavern"]').click();
  await page.waitForFunction(id => window.__snapshot?.world.entities.find(e => e.id === id)?.chore?.ask?.id === 'shop-counter', worker, { timeout: 30000 });
  await page.locator('#selection-work button[data-action=answer-chore][data-option="tavern:meal:food"]').waitFor({ state: 'visible' });
  const counter = await answers(page);
  observed.counter = counter;
  for (const o of counter.filter(o => o.option !== 'leave')) assert.ok(o.note && o.note.length > 10, `${o.option} says nothing`);
  assert.ok(counter.find(o => o.option === 'tavern:meal:coin').disabled, 'a meal for coin was offered to a family with no coin');
  ok(`the tavern's counter says what each costs and does: ${counter.map(o => `${o.label} (${o.note})`).join('; ')}`);

  await page.locator('#selection-work button[data-action=answer-chore][data-option="tavern:meal:food"]').click();
  await page.waitForFunction(() => (window.__snapshot?.world.events || []).some(e => /ate at the tavern/.test(e.text)), null, { timeout: 30000 });
  observed.story = await page.evaluate(() => window.__snapshot.world.events.find(e => /ate at the tavern/.test(e.text)).text);
  ok(`a meal at the tavern, paid in food, is in the family's story: "${observed.story}"`);

  assert.deepEqual(errors, [], `the page threw: ${errors.join(' | ')}`);
  ok('no page errors');
  writeFileSync('docs/evidence/shops-browser.json', `${JSON.stringify({
    record: 'The shops of the towns, in a browser: docs/TOWNS.md',
    date: new Date().toISOString().slice(0, 10),
    verdict: 'PASS',
    note: 'Same computer only. A student sent a person to town from the family panel, chose the tavern from the street, read its counter, and paid for a meal in food; the keepers were in sight while the person was in Gonzales. Every other trade is proved in tests/shops.test.mjs. No LAN or district claim.',
    checks: pass,
    observed,
  }, null, 2)}\n`);
  console.log(`\n${pass.length} checks passed.`);
} finally {
  await browser.close();
  await app.close();
}
