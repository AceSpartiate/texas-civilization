// A farm that grows, in a real browser.
//
// tests/improvements.test.mjs proves the simulation: that breaking ground costs an
// afternoon, that a bigger field swallows more seed and gives back more, that stock get
// into an unfenced crop, and that all of it can be taken away again. None of that reaches
// a student unless the work is offered in words, the cost is on the button before it is
// pressed, and - the part only a browser can answer - the field is actually drawn bigger
// afterwards. The map is fetched once a class and never changes, so a field that grows has
// to be drawn from the household, and "did it grow" cannot be asked of the projection.
//
// Run: npm run test:farm
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createClassroom } from '../server/app.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const pass = [];
const ok = label => { pass.push(label); console.log('PASS', label); };

// A quick tick, because breaking ground is deliberately a long job and this is not a test
// of how long it takes - tests/improvements.test.mjs already counts the ticks.
const app = createClassroom({ seed: 'farm-proof', playerCount: 5, tickMs: 60, worldFactory(seed, count) {
  const world = createGonzalesWorld(seed, count);
  // Enough seed that nothing here is refused for poverty; the cost itself is asserted below.
  world.households['hh-1'].resources.seed = 24;
  return world;
} });
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
  const context = await browser.newContext({ reducedMotion: 'no-preference', viewport: { width: 1440, height: 950 } });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url);
  await page.locator('[name=name]').fill('Farm reader');
  await page.locator('[name=code]').fill(app.state.sessionCode);
  await page.getByRole('button', { name: 'Join', exact: true }).click();
  await page.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-1');
  for (let i = 2; i <= 5; i++) await post('/api/join', { name: `Reader ${i}`, code: app.state.sessionCode });
  await post('/api/command', { id: `proof-start-${crypto.randomUUID()}`, action: 'start' }, hostCookie);
  await page.waitForFunction(() => window.__snapshot?.world.status === 'running');

  const choose = async id => {
    await page.locator('#journal-toggle').click();
    await page.locator(`[data-select="${id}"]`).click();
    await page.locator('#journal-close').click();
    await page.locator('#selection').waitFor({ state: 'visible' });
  };
  // Close in, or the field is drawn too small for a fence to be worth painting. The
  // selector is asserted rather than swallowed: a zoom control that quietly does not exist
  // let the class run three thousand ticks while Playwright waited, which ended the
  // afternoon and disabled every button - a slow, silent way to fail for the wrong reason.
  await page.locator('#map-nav [data-view=home]').click();
  for (let zoom = 0; zoom < 5; zoom++) await page.locator('#map-nav [data-view=in]').click();
  await choose('hh-1-thomas');

  // --------------------------------------------------------- the work is offered in words
  const offered = await page.locator('#selection-work button.work-option').evaluateAll(buttons =>
    buttons.map(button => ({ id: button.dataset.chore, name: button.querySelector('.work-name')?.textContent, note: button.querySelector('.work-note')?.textContent })));
  const clearing = offered.find(entry => entry.id === 'clear-ground');
  const fencing = offered.find(entry => entry.id === 'build-fence');
  assert.ok(clearing, `no way to break new ground: ${JSON.stringify(offered.map(o => o.id))}`);
  assert.ok(fencing, 'no way to fence the field');
  assert.match(fencing.note, /stock/i, `the fence does not say what it is for: "${fencing.note}"`);
  ok(`a family is offered "${clearing.name}" and "${fencing.name}", and the fence says why it matters`);

  const planting = offered.find(entry => entry.id === 'plant-field');
  assert.match(planting.name, /2 seed/, `planting does not state its price: "${planting.name}"`);
  ok(`the price of planting is on the button: "${planting.name}"`);

  // ------------------------------------------------------------ and the field grows for it
  const fieldNow = () => page.evaluate(() => ({ ...window.__fieldRect }));
  const before = await fieldNow();
  assert.ok(before.width > 0 && before.height > 0, 'the field was never drawn at all');
  assert.equal(before.fence, 'none', 'a family started with a fence it never built');
  assert.equal(before.cleared, 1);

  await page.locator('button[data-chore=clear-ground]').click();
  await page.waitForFunction(() => window.__snapshot.world.land.cleared === 2, null, { timeout: 60000 });
  await page.waitForTimeout(300);
  const after = await fieldNow();
  const grew = (after.width * after.height) / (before.width * before.height);
  assert.ok(grew > 1.4, `the field was drawn ${grew.toFixed(2)} times its old area after an afternoon of clearing`);
  ok(`an afternoon of clearing is visible on the ground: the field is drawn ${grew.toFixed(2)}x the area it was`);

  // ------------------------------------------------------------------- and the rails go up
  await choose('hh-1-thomas');
  await page.locator('button[data-chore=build-fence]').click();
  await page.waitForFunction(() => window.__snapshot.world.land.fence === 'sound', null, { timeout: 60000 });
  await page.waitForTimeout(300);
  const fenced = await fieldNow();
  assert.equal(fenced.fence, 'sound', 'the rails went up and nothing was drawn round the field');
  ok('rails round the crop are drawn only once a family has split them');

  // --------------------------------------------- and the harvest says what is standing in it
  await post('/api/command', { id: `proof-pause-${crypto.randomUUID()}`, action: 'pause' }, hostCookie);
  await page.waitForFunction(() => window.__snapshot.world.status === 'paused');
  const ripened = await page.evaluate(async () => {
    const response = await fetch('/api/state');
    return (await response.json()).world.land;
  });
  record.land = ripened;

  const belongings = await page.evaluate(() => {
    document.querySelector('#journal-toggle').click();
    const line = document.querySelector('#property li[data-land]');
    return line ? { text: line.textContent, cleared: line.dataset.cleared, fence: line.dataset.fence } : null;
  });
  assert.ok(belongings, 'the family journal does not list the land among what the family has');
  assert.equal(belongings.cleared, '2');
  assert.equal(belongings.fence, 'sound');
  assert.match(belongings.text, /ground broken 2 of a possible 4/);
  ok(`the land is the first thing in the list of what the family has: "${belongings.text}"`);

  mkdirSync('test-results', { recursive: true });
  await page.screenshot({ path: 'test-results/farm-expanded.png' });
  assert.deepEqual(errors, [], `page errors: ${errors.join(' | ')}`);
  ok('no page errors anywhere in the run');

  record = {
    record: 'farm-improvements-browser',
    date: new Date().toISOString().slice(0, 10),
    browser: await browser.version(),
    ownerDirection: '"players should be able to expand their farms... they\'ll need to be destructible (runaway scrape)."',
    checks: pass,
    measured: { fieldBefore: before, fieldAfter: after, drawnAreaRatio: Number(grew.toFixed(2)), fenced: fenced.fence, ...record },
    notProved: [
      'Anything about destruction in a browser. Nothing in the Gonzales afternoon ruins a homestead and this project invents no such event; the transition is proved directly in tests/improvements.test.mjs and is drawn from cabin-ruin and fence-broken, which no played class has yet shown.',
      'That clearing is worth its afternoon at the study pace in a real class. Ten ticks of work is about a minute and a half of a lesson; whether a student spends it is a classroom question.',
      'That a student understands the fence before losing a third of a crop to it. The number is on both controls; nobody has watched a class read them.',
    ],
  };
  mkdirSync('docs/evidence', { recursive: true });
  writeFileSync('docs/evidence/farm-improvements-browser.json', JSON.stringify(record, null, 2) + '\n');
  console.log('\nwrote docs/evidence/farm-improvements-browser.json');
} finally {
  await browser.close();
  await app.close();
}
