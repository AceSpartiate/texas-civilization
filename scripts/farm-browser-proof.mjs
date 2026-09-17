// A farm that grows, in a real browser.
//
// tests/improvements.test.mjs and tests/clearing.test.mjs prove the simulation: that clearing a staked plot costs days of
// work, that the field is the cleared plots and a bigger one swallows more seed and gives back more, that stock get into an
// unfenced plot, and that all of it can be taken away again. None of that reaches a student unless the work is offered in
// words, the plot is chosen on the map and described before anybody is sent, and - the part only a browser can answer - the
// plot is drawn as field afterwards, with rails round the one that was fenced (docs/LAND_GRANTS.md §5).
//
// Run: npm run test:farm
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createClassroom } from '../server/app.mjs';
import { createSettledWorld } from '../tests/support/settled.mjs';
import { meetFamily } from './support/meet-family.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const pass = [];
const ok = label => { pass.push(label); console.log('PASS', label); };

// A quick tick, because clearing is deliberately a long job and this is not a test of how long it takes -
// tests/clearing.test.mjs already counts the spells. Not so quick that the story ends while plots are being chosen on the
// map: at sixty milliseconds the class reached its end (about three hundred ticks) before the first tap, and an ended class
// draws nothing new and refuses every button (found 2026-09-14). Three hundred milliseconds leaves room.
const app = createClassroom({ seed: 'farm-proof', playerCount: 5, tickMs: 300, worldFactory(seed, count) {
  // A settled class: these families are at home under a roof, as every class began before arrivals
  // (docs/SETTLING_IN.md step 2). This proves the work, not the arrival - tests/arrival.test.mjs does that.
  const world = createSettledWorld(seed, count);
  // Enough seed that nothing here is refused for poverty; the cost itself is asserted below.
  world.households['hh-1'].resources.seed = 24;
  // Ten acres of prairie already staked a fifth of a mile from the first patch: surveying is proved in its own right
  // (tests/survey.test.mjs, docs/evidence/survey.json); this proves clearing and fencing what a family has staked.
  const field = world.map.terrain.find(feature => feature.kind === 'field' && feature.ownerHouseholdId === 'hh-1');
  const corner = { x: Math.min(...field.points.map(p => p.x)), y: Math.min(...field.points.map(p => p.y)) };
  const side = Math.sqrt(10 / 640);
  world.households['hh-1'].plots = [
    { id: 'plot-1', x: +(corner.x + side / 2).toFixed(3), y: +(corner.y + side / 2).toFixed(3), ground: 'prairie', state: 'cleared' },
    { id: 'plot-2', x: +(corner.x + side / 2).toFixed(3), y: +(corner.y + side / 2 + 0.2).toFixed(3), ground: 'prairie', state: 'staked' },
  ];
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
  // The title screen and the family made, before the world is drawn (public/creation.js, owner 2026-09-17).
  await meetFamily(page);
  for (let i = 2; i <= 5; i++) await post('/api/join', { name: `Reader ${i}`, code: app.state.sessionCode });
  await post('/api/command', { id: `proof-start-${crypto.randomUUID()}`, action: 'start' }, hostCookie);
  await page.waitForFunction(() => window.__snapshot?.world.status === 'running');
  // Whoever the family turned out to be: a household that never rolled is rolled at Start (docs/FAMILY_CREATION.md), so
  // the founding family's Thomas this script once chose is gone by now.
  const principal = await page.evaluate(() => window.__snapshot.world.household.principalId);

  // Lists and work buttons are redrawn on every tick, sixty milliseconds apart here, so a button found is often replaced
  // before a pointer click lands on it. Pressed in the page instead, on the element as it stands, once it can be pressed.
  const press = async selector => {
    await page.waitForFunction(found => { const button = document.querySelector(found); return button && !button.disabled && button.getAttribute('aria-disabled') !== 'true'; }, selector, { timeout: 30000 });
    await page.evaluate(found => document.querySelector(found).click(), selector);
  };
  const choose = async id => {
    await page.locator('#journal-toggle').click();
    await press(`[data-select="${id}"]`);
    await page.locator('#journal-close').click();
    await page.locator('#selection').waitFor({ state: 'visible' });
  };
  // Close in, or the field is drawn too small for a fence to be worth painting. The
  // selector is asserted rather than swallowed: a zoom control that quietly does not exist
  // let the class run three thousand ticks while Playwright waited, which ended the
  // afternoon and disabled every button - a slow, silent way to fail for the wrong reason.
  await page.locator('#map-nav [data-view=home]').click();
  for (let zoom = 0; zoom < 5; zoom++) await page.locator('#map-nav [data-view=in]').click();
  await choose(principal);

  // --------------------------------------------------------- the work is offered in words
  // The work is icons on the principal's row of the family panel (docs/FAMILY_PANEL.md): a name, one sentence, and the
  // server's price or reason in each icon's popup.
  const work = `.panel-row[data-entity-id="${principal}"] .panel-icon`;
  const offered = await page.locator(work).evaluateAll(buttons =>
    buttons.map(button => ({ id: button.dataset.chore, name: button.dataset.name, summary: button.dataset.summary, note: button.dataset.note })));
  const clearing = offered.find(entry => entry.id === 'clear-plot');
  const fencing = offered.find(entry => entry.id === 'fence-plot');
  assert.ok(clearing, `no way to clear the staked plot: ${JSON.stringify(offered.map(o => o.id))}`);
  assert.ok(fencing, 'no way to fence a plot');
  assert.match(fencing.summary, /stock/i, `the fence does not say what it is for: "${fencing.summary}"`);
  assert.match(clearing.summary, /staked plot/i, `clearing does not say what it is for: "${clearing.summary}"`);
  ok(`a family is offered "${clearing.name}" and "${fencing.name}", and each says what it is for`);

  const planting = offered.find(entry => entry.id === 'plant-field');
  assert.match(planting.note, /[234] seed/, `planting does not state its price: "${planting.note}"`);
  ok(`the price of planting is in its popup: "${planting.name}: ${planting.note}"`);

  // A tap on the map at the middle of a plot as it is drawn: canvas pixels to page pixels, as the map's own pointer does.
  // The camera follows whoever was chosen, close in; the land view and a step out bring the plot on to the screen first.
  const tapPlot = async id => {
    await page.locator('#map-nav [data-view=home]').click();
    for (let step = 0; step < 6; step++) {
      const onScreen = await page.evaluate(plotId => {
        const plot = window.__plotsDrawn?.find(drawn => drawn.id === plotId), canvas = document.querySelector('#world-map');
        return Boolean(plot) && plot.corners.every(p => p.x > 40 && p.y > 160 && p.x < canvas.width - 40 && p.y < canvas.height - 160);
      }, id);
      if (onScreen) break;
      await page.locator('#map-nav [data-view=out]').click();
      await page.waitForTimeout(250);
    }
    const at = await page.evaluate(plotId => {
      const plot = window.__plotsDrawn.find(drawn => drawn.id === plotId), canvas = document.querySelector('#world-map'), rect = canvas.getBoundingClientRect();
      const x = plot.corners.reduce((sum, p) => sum + p.x, 0) / 4, y = plot.corners.reduce((sum, p) => sum + p.y, 0) / 4;
      return { x: rect.left + x * rect.width / canvas.width, y: rect.top + y * rect.height / canvas.height };
    }, id);
    await page.mouse.click(at.x, at.y);
    await page.waitForFunction(() => document.querySelector('#survey-send') && !document.querySelector('#survey-send').hidden, null, { timeout: 10000 })
      .catch(async error => { throw new Error(`tapping ${id} at ${JSON.stringify(at)} in a ${JSON.stringify(await page.evaluate(() => document.querySelector('#world-map').getBoundingClientRect()))} map showed: ${await page.locator('#survey-text').textContent()} (${error.message}); page: ${JSON.stringify(await page.evaluate(() => ({ canvas: [document.querySelector('#world-map').width, document.querySelector('#world-map').height], drawn: window.__plotsDrawn, status: window.__snapshot.world.status, tick: window.__snapshot.world.tick, holding: window.__holdingRect })))}`); });
  };

  // ------------------------------------------------------------ and the field grows for it
  const plotsNow = () => page.evaluate(() => window.__plotsDrawn.map(plot => ({ id: plot.id, state: plot.state, fence: plot.fence, cleared: plot.cleared })));
  const before = await plotsNow();
  assert.deepEqual(before.map(plot => plot.state), ['cleared', 'staked'], `the plots were not drawn as they stand: ${JSON.stringify(before)}`);
  assert.equal(before[0].fence, 'none', 'a family started with a fence it never built');

  await press(`${work}[data-key=clear-plot]`);
  await tapPlot('plot-2');
  const words = await page.locator('#survey-text').textContent();
  assert.match(words, /Ten acres of prairie .*staked\. 10 spells of clearing, with the hoe\./, `the plot was not described before clearing: "${words}"`);
  await page.locator('#survey-send').click();
  await page.waitForFunction(() => window.__snapshot.world.land.cleared === 2, null, { timeout: 120000 });
  await page.waitForTimeout(300);
  const after = await plotsNow();
  assert.deepEqual(after.map(plot => plot.state), ['cleared', 'cleared'], 'the plot was cleared and still drawn staked');
  ok(`ten acres chosen on the map and cleared are drawn as field: "${words}"`);

  // ------------------------------------------------------------------- and the rails go up
  await choose(principal);
  await press(`${work}[data-key=fence-plot]`);
  await tapPlot('plot-2');
  await page.locator('#survey-send').click();
  await page.waitForFunction(() => window.__snapshot.world.land.fenced === 1, null, { timeout: 60000 });
  await page.waitForTimeout(300);
  const fenced = await plotsNow();
  assert.deepEqual(fenced.map(plot => plot.fence), ['none', 'sound'], 'the rails went round the wrong plot, or nothing was drawn');
  ok('rails are drawn round the plot a family fenced, and only that one');

  // --------------------------------------------- and the land line says what the field is
  await post('/api/command', { id: `proof-pause-${crypto.randomUUID()}`, action: 'pause' }, hostCookie);
  await page.waitForFunction(() => window.__snapshot.world.status === 'paused');
  record.land = await page.evaluate(async () => (await (await fetch('/api/state')).json()).world.land);

  const belongings = await page.evaluate(() => {
    document.querySelector('#journal-toggle').click();
    const line = document.querySelector('#property li[data-land]');
    return line ? { text: line.textContent, cleared: line.dataset.cleared, fenced: line.dataset.fenced } : null;
  });
  assert.ok(belongings, 'the family journal does not list the land among what the family has');
  assert.equal(belongings.cleared, '2');
  assert.equal(belongings.fenced, '1');
  assert.match(belongings.text, /20 acres cleared in 2 plots, 1 fenced/);
  ok(`the land is the first thing in the list of what the family has: "${belongings.text}"`);

  mkdirSync('test-results', { recursive: true });
  await page.screenshot({ path: 'test-results/farm-expanded.png' });
  assert.deepEqual(errors, [], `page errors: ${errors.join(' | ')}`);
  ok('no page errors anywhere in the run');

  record = {
    record: 'farm-improvements-browser',
    date: new Date().toISOString().slice(0, 10),
    browser: await browser.version(),
    ownerDirection: '"players should be able to clear any piece of land on their land ... and create more plots through an action called Survey." (2026-09-13)',
    checks: pass,
    measured: { plotsBefore: before, plotsAfter: after, fenced, ...record },
    notProved: [
      'Anything about destruction in a browser. Nothing in the Gonzales afternoon ruins a homestead and this project invents no such event; the transition is proved directly in tests/improvements.test.mjs and tests/clearing.test.mjs.',
      'That clearing is worth its days of work at the study pace in a real class. Ten spells of prairie is about thirty ticks; whether a student spends them is a classroom question.',
      'That a student understands the fence before losing a third of a plot to it. The number is on both controls; nobody has watched a class read them.',
    ],
  };
  mkdirSync('docs/evidence', { recursive: true });
  writeFileSync('docs/evidence/farm-improvements-browser.json', JSON.stringify(record, null, 2) + '\n');
  console.log('\nwrote docs/evidence/farm-improvements-browser.json');
} finally {
  await browser.close();
  await app.close();
}
