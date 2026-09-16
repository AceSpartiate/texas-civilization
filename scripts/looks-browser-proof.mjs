// How the family looks, in a real browser: docs/SETTLING_IN.md §7, build step 8.
//
// tests/appearance.test.mjs proves the rules - chosen after the roll, parents only, children after
// their parents, and nothing in the game reading any of it. This proves a student can do it: roll,
// open the book, change a parent's hair and clothes from the choices offered, see the words change
// without pressing anything, see a child take after them with nothing to choose, and find it all
// still so after reloading the page.
//
// Run: npm run test:looks
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createClassroom } from '../server/app.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const pass = [];
const ok = label => { pass.push(label); console.log('PASS', label); };
const observed = {};

const app = createClassroom({ seed: 'family-proof', playerCount: 5, tickMs: 200, worldFactory: createGonzalesWorld });
const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const errors = [];

try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 950 } });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url);
  await page.locator('[name=name]').fill('Looks reader');
  await page.locator('[name=code]').fill(app.state.sessionCode);
  await page.getByRole('button', { name: 'Join', exact: true }).click();
  await page.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-1');

  // Before the roll there is nobody to dress.
  assert.equal(await page.locator('#family-looks').isHidden(), true, 'looks were offered before the roll');
  await page.locator('#roll-family').click();
  await page.waitForFunction(() => document.querySelector('#roll-family')?.textContent === 'Meet your family', null, { timeout: 15000 });
  await page.locator('#roll-family').click();
  await page.locator('#family-looks').waitFor({ state: 'visible' });
  const family = await page.evaluate(async () => (await (await fetch('/api/family')).json()).family);
  const parent = family.people.find(person => person.choices);
  const child = family.people.find(person => ['son', 'daughter'].includes(person.role));
  assert.ok(parent && child, 'this seed needs a parent and a child');
  ok('after the roll the book shows how the family looks');

  // A parent: every choice offered, as the server offers it.
  const row = page.locator(`#family-looks li[data-entity-id="${parent.id}"]`);
  for (const part of ['skin', 'hair', 'clothing', 'head']) {
    const offered = await row.locator(`select[data-part="${part}"] option`).allTextContents();
    assert.deepEqual(offered, parent.choices[part], `${part} offers something other than the server's choices`);
  }
  // A child: words, and nothing to choose.
  const childRow = page.locator('#family-looks li.looks-child', { hasText: child.name });
  assert.equal(await childRow.locator('select').count(), 0, 'a child was offered choices');
  observed.childBefore = await childRow.textContent();
  assert.match(observed.childBefore, /takes after their parents/i);
  ok(`a parent is offered the server's choices, a child none: "${observed.childBefore}"`);

  // Changed, and saved with no button: the words update from the server.
  const hair = parent.choices.hair.find(value => value !== parent.appearance.hair && value !== 'grey');
  const clothing = parent.choices.clothing.find(value => value !== parent.appearance.clothing);
  await row.locator('select[data-part="hair"]').selectOption(hair);
  await page.waitForFunction(([id, value]) => document.querySelector(`#family-looks li[data-entity-id="${id}"] .looks-words`)?.textContent.includes(`${value} hair`), [parent.id, hair]);
  await row.locator('select[data-part="clothing"]').selectOption(clothing);
  await page.waitForFunction(([id, value]) => document.querySelector(`#family-looks li[data-entity-id="${id}"] .looks-words`)?.textContent.includes(`${value} clothes`), [parent.id, clothing]);
  observed.parentAfter = await row.locator('.looks-words').textContent();
  assert.equal(await page.locator('#family-looks button').count(), 0, 'there is a button to save');
  ok(`a parent's hair and clothes change and save as they are chosen: "${observed.parentAfter}"`);

  // Reloaded: still so, from the server.
  await page.reload();
  await page.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-1');
  const toggle = page.locator('#journal-toggle');
  if (await page.locator('#family-journal').getAttribute('data-open') !== 'true') await toggle.click();
  await page.locator('#family-looks').waitFor({ state: 'visible' });
  const kept = await page.locator(`#family-looks li[data-entity-id="${parent.id}"] .looks-words`).textContent();
  assert.ok(kept.includes(`${hair} hair`) && kept.includes(`${clothing} clothes`), `the choice was not kept: "${kept}"`);
  ok('reloaded, the choices are still there');

  await page.locator('#family-looks').scrollIntoViewIfNeeded();
  mkdirSync('docs/evidence', { recursive: true });
  await page.screenshot({ path: 'docs/evidence/looks-book.png' });
  // Loaded at phone width rather than shrunk to it: the person panel keeps a position computed at the
  // wider size until something moves it, which is a known limit of that panel and not of this book.
  await page.setViewportSize({ width: 400, height: 860 });
  await page.reload();
  await page.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-1');
  if (await page.locator('#family-journal').getAttribute('data-open') !== 'true') await page.locator('#journal-toggle').click();
  await page.locator('#family-looks').waitFor({ state: 'visible' });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  const wide = await page.evaluate(() => [...document.querySelectorAll('body *')].filter(el => el.getBoundingClientRect().right > document.documentElement.clientWidth + 1 && el.offsetParent !== null).slice(0, 8).map(el => `${el.tagName}#${el.id}.${el.className} ${Math.round(el.getBoundingClientRect().left)}-${Math.round(el.getBoundingClientRect().right)}`));
  assert.ok(overflow <= 1, `the page scrolls sideways at phone width by ${overflow}px: ${wide.join(' | ')}`);
  await page.locator('#family-looks').scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'docs/evidence/looks-book-phone.png' });
  ok('at phone width the page does not scroll sideways');

  assert.deepEqual(errors, [], `the page threw: ${errors.join(' | ')}`);
  ok('no page errors');

  writeFileSync('docs/evidence/looks-browser.json', `${JSON.stringify({
    record: 'How the family looks, in a browser: docs/SETTLING_IN.md build step 8',
    date: new Date().toISOString().slice(0, 10),
    verdict: 'PASS',
    note: 'Same computer only. A student joined, rolled, chose a parent\'s hair and clothes in the family book, and reloaded. The figure on the map is unchanged: layered people art is a stand-in (docs/ART_REQUESTS.md). No LAN or district claim.',
    checks: pass,
    observed,
    screenshots: ['docs/evidence/looks-book.png', 'docs/evidence/looks-book-phone.png'],
  }, null, 2)}\n`);
  console.log(`\n${pass.length} checks passed.`);
} finally {
  await browser.close();
  await app.close();
}
