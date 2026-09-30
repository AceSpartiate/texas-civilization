// Corn and cotton in one field, in a real browser (owner, 2026-09-30: "players can still plow new and extra fields right? so i as a
// player could have corn growing for food as well as cotton to sell?"; docs/LAND_GRANTS.md §5.2).
//
// tests/per-plot-crops.test.mjs proves the simulation: each cleared plot its own crop, its own minutes and its own harvest, seed a
// plot, a partial planting said, auto and the director. None of that reaches a student unless the planting is easy - the icon, a
// plot tapped on the map or none for every bare plot, and corn or cotton - and the field shows what is in it: each plot drawn with its
// own crop and stage in Astra's crop art, and the field line on the map a picture and a count for each crop, ripe ones lit.
//
// Run: npm run test:mixed-field (PLAYWRIGHT_MODULE and BROWSER_EXECUTABLE as for every browser proof).
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
const shots = [];

// The server's clock runs forty times fast (`now`, as the auto proof does): a crop stands its real minutes (sim/crops.mjs: corn four,
// cotton six), which at this proof's 300 ms tick and forty times is corn in about twenty ticks and cotton in thirty, and the invented
// Gonzales afternoon (some 365 ticks) holds the whole season. Nothing below reads another clock.
const clockStarted = Date.now(), CLOCK_FAST = 40;
const SIDE = Math.sqrt(10 / 640);
const app = createClassroom({ seed: 'mixed-field-proof', playerCount: 5, tickMs: 300, now: () => clockStarted + (Date.now() - clockStarted) * CLOCK_FAST, worldFactory(seed, count) {
  const world = createSettledWorld(seed, count);
  const household = world.households['hh-1'];
  household.resources.seed = 24;
  household.tools.hoe = 0;
  // Three cleared plots of prairie side by side in the corner of the family's field, the third fenced: clearing and fencing are
  // proved in their own right (scripts/farm-browser-proof.mjs); this proves what goes in them.
  const field = world.map.terrain.find(feature => feature.kind === 'field' && feature.ownerHouseholdId === 'hh-1');
  const corner = { x: Math.min(...field.points.map(p => p.x)) + SIDE / 2, y: Math.min(...field.points.map(p => p.y)) + SIDE / 2 };
  household.plots = [
    { id: 'plot-1', x: +corner.x.toFixed(3), y: +corner.y.toFixed(3), ground: 'prairie', state: 'cleared' },
    { id: 'plot-2', x: +(corner.x + SIDE + 0.002).toFixed(3), y: +corner.y.toFixed(3), ground: 'prairie', state: 'cleared' },
    { id: 'plot-3', x: +corner.x.toFixed(3), y: +(corner.y + SIDE + 0.002).toFixed(3), ground: 'prairie', state: 'cleared', fence: 'sound' },
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
mkdirSync('docs/evidence', { recursive: true });

let record = {};
try {
  const host = await post('/api/host', { key: app.state.hostKey });
  const hostCookie = host.headers.get('set-cookie').split(';')[0];
  const context = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 950 } });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url);
  await page.locator('[name=name]').fill('Farmer');
  await page.locator('[name=code]').fill(app.state.sessionCode);
  await page.getByRole('button', { name: 'Join', exact: true }).click();
  await page.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-1');
  await meetFamily(page);
  for (let i = 2; i <= 5; i++) await post('/api/join', { name: `Reader ${i}`, code: app.state.sessionCode });
  await post('/api/command', { id: `proof-start-${crypto.randomUUID()}`, action: 'start' }, hostCookie);
  await page.waitForFunction(() => window.__snapshot?.world.status === 'running');
  const principal = await page.evaluate(() => window.__snapshot.world.household.principalId);
  // The owner's pictures: the tip and the messages put away, and the map closed in on the three plots in the middle of the screen,
  // near enough that the crop art is what is drawn (public/field-surface.js draws Astra's plants on a plot seventy pixels across).
  const frame = async () => {
    for (const selector of ['#tip:not([hidden]) .tip-close']) if (await page.locator(selector).isVisible().catch(() => false)) await page.locator(selector).click();
    if (/^Keep playing/.test(await page.locator('#military-toggle').textContent().catch(() => '') || '')) await page.locator('#military-toggle').click();
    const where = () => page.evaluate(() => {
      const canvas = document.querySelector('#world-map'), rect = canvas.getBoundingClientRect(), k = rect.width / canvas.width;
      const corners = (window.__plotsDrawn || []).flatMap(plot => plot.corners);
      const xs = corners.map(c => rect.left + c.x * k), ys = corners.map(c => rect.top + c.y * k);
      return { cx: (Math.min(...xs) + Math.max(...xs)) / 2, cy: (Math.min(...ys) + Math.max(...ys)) / 2, w: Math.max(...xs) - Math.min(...xs) };
    });
    for (let step = 0; step < 14; step++) {
      const at = await where();
      if (at.w > 470) break;
      await page.mouse.move(at.cx, at.cy);
      await page.mouse.wheel(0, -240);
      await page.waitForTimeout(250);
    }
    await page.locator('#world-map').focus();
    for (let step = 0; step < 30; step++) {
      const at = await where();
      const dx = at.cx - 820, dy = at.cy - 390;
      if (Math.abs(dx) < 90 && Math.abs(dy) < 70) break;
      await page.keyboard.press(Math.abs(dx) >= 90 ? (dx > 0 ? 'ArrowRight' : 'ArrowLeft') : (dy > 0 ? 'ArrowDown' : 'ArrowUp'));
      await page.waitForTimeout(120);
    }
    await page.mouse.move(5, 940);
    await page.waitForTimeout(500);
  };
  const shot = async name => { await frame(); const path = `docs/evidence/mixed-field-${name}.png`; await page.screenshot({ path }); shots.push(path); };
  const press = async selector => {
    await page.waitForFunction(found => { const button = document.querySelector(found); return button && !button.disabled && button.getAttribute('aria-disabled') !== 'true'; }, selector, { timeout: 30000 });
    await page.evaluate(found => document.querySelector(found).click(), selector);
  };
  const plots = () => page.evaluate(() => window.__snapshot.world.land.plots.map(plot => ({ id: plot.id, sown: Boolean(plot.sown), crop: plot.crop || null, ripe: Boolean(plot.ripe) })));
  const drawn = () => page.evaluate(() => (window.__plotsDrawn || []).map(plot => ({ id: plot.id, crop: plot.crop || null, stage: plot.stage || null, fence: plot.fence })));
  const chips = () => page.evaluate(() => {
    const root = document.querySelector('#field-summary');
    return { hidden: root.hidden, label: root.getAttribute('aria-label'), chips: [...root.querySelectorAll('.crop-chip')].map(chip => ({ crop: chip.dataset.crop, stage: chip.dataset.stage, n: chip.querySelector('b').textContent, drawn: chip.querySelector('canvas').dataset.drawn === 'true' })) };
  });
  // Close in on the field: the land view, then in until the three plots fill the middle of the map.
  await page.locator('#map-nav [data-view=home]').click();
  const fit = async () => {
    for (let step = 0; step < 8; step++) {
      const size = await page.evaluate(() => { const plot = window.__plotsDrawn?.find(one => one.id === 'plot-1'); return plot ? Math.abs(plot.corners[1].x - plot.corners[0].x) : 0; });
      if (size > 150) break;
      await page.locator('#map-nav [data-view=in]').click();
      await page.waitForTimeout(250);
    }
  };
  await fit();
  const row = `.panel-row[data-entity-id="${principal}"] .panel-icon`;

  // ------------------------------------------------------------------ the plant icon opens the choice
  const bar = await page.locator(`${row}[data-key=plant-field]`).evaluate(button => ({ name: button.dataset.name, summary: button.dataset.summary, note: button.dataset.note, action: button.dataset.action }));
  assert.equal(bar.action, 'survey-start', `planting does not open the choice of plot and crop: ${JSON.stringify(bar)}`);
  assert.match(bar.summary, /corn to eat or cotton to sell/);
  await press(`${row}[data-key=plant-field]`);
  await page.locator('#survey-choose').waitFor({ state: 'visible', timeout: 10000 });
  const opened = await page.evaluate(() => ({ eyebrow: document.querySelector('#survey-eyebrow').textContent, title: document.querySelector('#survey-title').textContent, text: document.querySelector('#survey-text').textContent, crops: !document.querySelector('#plant-crops').hidden, send: !document.querySelector('#survey-send').hidden }));
  assert.equal(opened.eyebrow, 'PLANTING');
  assert.match(opened.text, /^Every bare plot: 3 plots, corn to eat or cotton to sell\. Or tap one plot on the map/);
  assert.equal(opened.crops, true, 'no corn or cotton to press');
  assert.equal(opened.send, false);
  ok(`the plant icon opens "${opened.title}": "${opened.text}", with a button for corn and one for cotton`);
  // Without the map: the bare plots are offered as buttons, as the plots to clear and fence are (sim/suggest.mjs), for a keyboard.
  await page.waitForFunction(() => document.querySelectorAll('#survey-suggested:not([hidden]) button').length === 3, null, { timeout: 10000 });
  const offeredPlots = await page.locator('#survey-suggested button').allTextContents();
  ok(`the bare plots are offered as buttons too, for a keyboard: ${offeredPlots.join(' / ')}`);
  await shot('chooser');

  // ------------------------------------------------------ one plot tapped, in cotton
  const tap = async id => {
    const at = await page.evaluate(plotId => {
      const plot = window.__plotsDrawn.find(one => one.id === plotId), canvas = document.querySelector('#world-map'), rect = canvas.getBoundingClientRect();
      const x = plot.corners.reduce((sum, p) => sum + p.x, 0) / 4, y = plot.corners.reduce((sum, p) => sum + p.y, 0) / 4;
      return { x: rect.left + x * rect.width / canvas.width, y: rect.top + y * rect.height / canvas.height };
    }, id);
    await page.mouse.click(at.x, at.y);
    await page.waitForFunction(() => /^Ten acres/.test(document.querySelector('#survey-text')?.textContent || ''), null, { timeout: 10000 });
  };
  await tap('plot-2');
  const tapped = await page.locator('#survey-text').textContent();
  assert.match(tapped, /^Ten acres of prairie .*, cleared, with no fence \(the stock take a third of what grows\)\. Bare\.$/, `the plot was not described for planting: "${tapped}"`);
  assert.equal(await page.locator('#plant-all').isVisible(), true, 'no way back to every bare plot');
  await page.locator('#plant-crops [data-crop=cotton]').click();
  await page.waitForFunction(() => window.__snapshot.world.land.plots.find(plot => plot.id === 'plot-2')?.crop === 'cotton', null, { timeout: 60000 });
  ok(`a plot tapped on the map ("${tapped}") and "Plant cotton": plot-2 is in cotton`);

  // ------------------------------------------------------ every bare plot, in corn
  await page.waitForFunction(id => !window.__snapshot.world.entities.find(one => one.id === id)?.chore, principal, { timeout: 60000 });
  await press(`${row}[data-key=plant-field]`);
  await page.waitForFunction(() => /^Every bare plot: 2 plots/.test(document.querySelector('#survey-text')?.textContent || ''), null, { timeout: 10000 });
  await page.locator('#plant-crops [data-crop=corn]').click();
  await page.waitForFunction(() => window.__snapshot.world.land.plots.every(plot => plot.sown), null, { timeout: 60000 });
  const sown = await plots();
  assert.deepEqual(sown.map(plot => plot.crop), ['corn', 'cotton', 'corn']);
  ok(`with nothing tapped, "Plant corn" put corn in both bare plots: ${sown.map(plot => `${plot.id} ${plot.crop}`).join(', ')}`);
  const seed = await page.evaluate(() => window.__snapshot.world.household.resources.seed);
  assert.equal(seed, 24 - 3 - 2 * 2, 'the seed was not spent a plot at a time, each its own crop\'s');
  ok(`the seed was spent plot by plot: 3 for the cotton, 2 for each plot of corn, ${seed} left`);

  // ------------------------------------------------------ drawn, and on the field line
  await page.waitForTimeout(600);
  const growing = await drawn();
  assert.deepEqual(growing.map(plot => [plot.id, plot.crop, plot.stage]), [['plot-1', 'corn', 'planted'], ['plot-2', 'cotton', 'planted'], ['plot-3', 'corn', 'planted']]);
  const line = await chips();
  assert.equal(line.hidden, false);
  assert.deepEqual(line.chips.map(chip => [chip.crop, chip.stage, chip.n]), [['corn', 'growing', '2'], ['cotton', 'growing', '1']]);
  assert.ok(line.chips.every(chip => chip.drawn), 'a crop picture on the field line is the stand-in, not the crop art');
  assert.match(line.label, /^Field: Corn growing on 2 plots, the first ready in about \d+ minutes; Cotton growing on 1 plot\.$/);
  const supplies = await page.locator('#supplies').textContent();
  assert.doesNotMatch(supplies, /field bare|growing|ready/, `the field is still words on the supplies line: "${supplies}"`);
  ok(`each plot drawn with its own crop and the field line in pictures: ${line.chips.map(chip => `${chip.crop} ${chip.stage} ${chip.n}`).join(', ')} ("${line.label}")`);
  await shot('growing');

  // ------------------------------------------------------ the corn comes on first
  await page.waitForFunction(() => window.__snapshot.world.land.plots.filter(plot => plot.crop === 'corn').every(plot => plot.ripe), null, { timeout: 120000 });
  const cornRipe = await plots();
  assert.equal(cornRipe.find(plot => plot.id === 'plot-2').ripe, false, 'the cotton came on with the corn');
  await page.waitForTimeout(600);
  const ripeLine = await chips();
  assert.deepEqual(ripeLine.chips.map(chip => [chip.crop, chip.stage, chip.n]), [['corn', 'ripe', '2'], ['cotton', 'growing', '1']]);
  const lit = await page.evaluate(() => { const chip = document.querySelector('#field-summary .crop-chip[data-stage=ripe]'); const style = getComputedStyle(chip); return { background: style.backgroundColor, tick: getComputedStyle(chip.querySelector('b'), '::after').content }; });
  assert.equal(lit.background, 'rgb(122, 71, 38)');
  assert.match(lit.tick, /✓/);
  assert.deepEqual((await drawn()).map(plot => plot.stage), ['ripe', 'planted', 'ripe']);
  ok(`the corn ripe before the cotton, drawn so, and its chip lit with a tick: ${ripeLine.label}`);
  await shot('corn-ripe');

  // ------------------------------------------------------ brought in: the corn alone
  const food = await page.evaluate(() => window.__snapshot.world.household.resources.food);
  const harvest = await page.locator(`${row}[data-key=harvest-field]`).evaluate(button => button.dataset.note);
  // Two plots of corn, one unfenced: the stock have a third of that one (sim/improvements.mjs `harvestShare`).
  assert.match(harvest, /About \d+ food of \d+ standing; the rest has gone to stock in an unfenced field\./, `the harvest does not say what it would bring in: "${harvest}"`);
  await press(`${row}[data-key=harvest-field]`);
  await page.waitForFunction(() => window.__snapshot.world.land.plots.filter(plot => plot.id !== 'plot-2').every(plot => !plot.sown), null, { timeout: 60000 });
  const after = await plots();
  assert.equal(after.find(plot => plot.id === 'plot-2').sown, true, 'the cotton was cut green');
  const foodAfter = await page.evaluate(() => window.__snapshot.world.household.resources.food);
  assert.ok(foodAfter > food + 10, `the corn did not come in as food: ${food} to ${foodAfter}`);
  ok(`"Bring in the crop" (${harvest}) brought in the two corn plots and left the cotton standing: food ${food.toFixed(1)} to ${foodAfter.toFixed(1)}`);
  await page.waitForTimeout(600);
  const afterLine = await chips();
  // The cotton growing still, or come on while the corn was carried in (the clock runs forty times fast here).
  assert.deepEqual(afterLine.chips.map(chip => [chip.crop, chip.crop === 'cotton' ? 'standing' : chip.stage, chip.n]), [['cotton', 'standing', '1'], ['bare', 'bare', '2']]);
  await page.waitForFunction(() => window.__snapshot.world.land.plots.find(plot => plot.id === 'plot-2')?.ripe, null, { timeout: 120000 });
  await page.waitForTimeout(600);
  await shot('cotton-ripe');
  ok('the cotton comes on after, by itself');

  // ------------------------------------------------------ and on a narrow screen the line still fits
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.waitForTimeout(600);
  const box = await page.locator('#field-summary').boundingBox();
  assert.ok(box && box.x >= 0 && box.x + box.width <= 1024 && box.height < 60, `the field line does not fit at 1024: ${JSON.stringify(box)}`);
  ok(`the field line fits at 1024x768: ${Math.round(box.width)}x${Math.round(box.height)} px`);

  assert.deepEqual(errors, [], `page errors: ${errors.join(' | ')}`);
  ok('no page errors anywhere in the run');
  record = {
    record: 'mixed-field-browser',
    date: new Date().toISOString().slice(0, 10),
    browser: await browser.version(),
    ownerDirection: '"players can still plow new and extra fields right? so i as a player could have corn growing for food as well as cotton to sell?" (2026-09-30)',
    checks: pass,
    screenshots: shots,
    measured: { opened, tapped, sown, seedLeft: seed, growing, line, ripeLine, harvest, food: { before: food, after: foodAfter }, afterLine },
    notProved: [
      'A real class. Same computer, headless Chrome, one student; no Chromebook, touch screen or LAN claim.',
      'That a student reads the chips without the words. The owner asked for pictures over explanation; the words are the label and each chip\'s title for a screen reader and a hover.',
    ],
  };
  writeFileSync('docs/evidence/mixed-field-browser.json', JSON.stringify(record, null, 2) + '\n');
  console.log('\nwrote docs/evidence/mixed-field-browser.json');
} finally {
  await browser.close();
  await app.close();
}
