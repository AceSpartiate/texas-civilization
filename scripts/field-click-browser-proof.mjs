// A field clicked for its crop, and the carreta's missing hide found by a hunt, in a real browser (owner, 2026-09-30, after playing
// the release v2026.09.29.3: "when i was playing earlier, there was no mechanism for choosing what crop is planted on each field. let
// me click on the fields so i can select what is grown there. i never saw where i could hunt to get leather to make the little carts,
// and i really wanted one since i was using me wagon for something else."; docs/LAND_GRANTS.md §5.2, docs/FAMILY_PANEL.md §23,
// docs/WOODS_AND_BUILDING.md §6.6).
//
// tests/field-click-hunt.test.mjs proves the rules headlessly. This proves a student sees and uses them, on the real land:
//   1. a plot under the mouse is lit and the pointer is a hand; clicked with no work chosen first, the chooser opens on it, says it
//      is bare and who would plant it, with each crop's seed on its button; Plant corn sows that plot; a second plot tapped by touch
//      is planted in cotton by the next free hand;
//   2. a growing plot clicked says what grows and when; from the keyboard, the field line's chip opens it, the focus in the chooser;
//   3. a ripe plot clicked says so and *Bring it in* brings it in;
//   4. the carreta, short of its hide, is on the bar greyed with its wants; pressed, its popup lists them and offers both ways
//      (owner, 2026-09-30, "Tanner sells"): "Buy one from the tanner" opens the town errand with the rawhide on the list, and "Go
//      hunting" opens the hunt's place chooser; a hunt there brings a hide home (the supplies line says so) and spends the last
//      powder, after which the hunt is greyed, refused for want of powder, pointing at "Buy powder in town" ("Refuse it"); the
//      carreta is then open and made;
//   5. a cleared plot with no fence clicked offers "Fence it" beside its crop, and it sends somebody to fence it; a fenced plot
//      does not ("Add 'Fence it'").
// Same computer only: headless Chrome, no Chromebook, no LAN, no class.
//
// Run: npm run test:field-click (PLAYWRIGHT_MODULE and BROWSER_EXECUTABLE as for every browser proof).
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createClassroom } from '../server/app.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { rollFamily } from '../sim/world.mjs';
import { settleMeans } from '../sim/means.mjs';
import { holdingOf } from '../sim/grants.mjs';
import { GAME, huntFacts } from '../sim/hunting.mjs';
import { rainingAt } from '../sim/weather.mjs';
import { tradesAt } from '../sim/shops.mjs';
import { settle, taught } from '../tests/support/settled.mjs';
import { meetFamily } from './support/meet-family.mjs';

import { keepMoreOpen } from './support/short-bar.mjs';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const pass = [];
const ok = label => { pass.push(label); console.log('PASS', label); };
const shots = [];
const SIDE = Math.sqrt(10 / 640);

/** The class: hh-1 on the real land, its family rolled and home, two cleared plots by the house, the axe and three logs, no hide. */
function fixture(seed) {
  const world = createGonzalesWorld(seed, 5, { map: 'colonies' });
  settleMeans(world);
  const household = world.households['hh-1'];
  rollFamily(world, household);
  taught(settle(world));
  delete household.choosingSite;
  const home = world.map.sites[household.homeSiteId];
  const bounds = holdingOf(world, household).bounds;
  // Two plots of prairie side by side, a little off the yard, inside the family's own line.
  const x = Math.min(Math.max(home.x + 0.18, bounds.minX + SIDE), bounds.maxX - 2.2 * SIDE), y = Math.min(Math.max(home.y + 0.12, bounds.minY + SIDE), bounds.maxY - SIDE);
  household.plots = [
    { id: 'plot-1', x: +x.toFixed(3), y: +y.toFixed(3), ground: 'prairie', state: 'cleared' },
    { id: 'plot-2', x: +(x + SIDE + 0.004).toFixed(3), y: +y.toFixed(3), ground: 'prairie', state: 'cleared', fence: 'sound' },
  ];
  household.resources.seed = 20;
  // One shot's powder: the hunt below spends it, and the next hunt is refused for want of powder.
  household.resources.powder = 1;
  household.resources.hides = 0;
  household.tools.hoe = 0;
  household.tools.axe = 0;
  household.logs = { wall: 1, sill: 1, poor: 1 };
  return world;
}
// A seed whose first two days are dry at the house: a wet day can stop the waited shot (sim/hunting.mjs `powderDamp`), and this
// proves where the hunt is found, not the weather (test:hunt-weather does that).
let seed = null;
for (let n = 0; n < 40 && !seed; n++) {
  const world = fixture(`field-click-proof-${n}`);
  const home = world.map.sites[world.households['hh-1'].homeSiteId];
  // And a town with a tanner, whose rawhide the carreta's popup offers beside a hunt.
  const town = world.households['hh-1'].settlementId || 'gonzales';
  if (![0, 1, 2].some(day => rainingAt(world, home, day)) && tradesAt(world, town).includes('tanner')) seed = `field-click-proof-${n}`;
}
assert.ok(seed, 'no dry seed for the proof');

// The crops' real minutes run fifteen times fast (`now`, as the mixed-field proof does): corn in about sixteen seconds.
const clockStarted = Date.now(), CLOCK_FAST = 15;
const app = createClassroom({ seed, playerCount: 5, tickMs: 300, now: () => clockStarted + (Date.now() - clockStarted) * CLOCK_FAST, worldFactory: s => fixture(s) });
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
  // A touch screen as well as a mouse: one plot is tapped with a finger (triage D17's rule: the chooser is the second step).
  const context = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 950 }, hasTouch: true });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url);
  // Works that wait behind "More" since 2026-10-09 (owner, "Short bar + More") are opened as a student opens them.
  await keepMoreOpen(page);
  await page.locator('[name=name]').fill('Field reader');
  await page.locator('[name=code]').fill(app.state.sessionCode);
  await page.getByRole('button', { name: 'Join', exact: true }).click();
  await page.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-1');
  await meetFamily(page);
  for (let i = 2; i <= 5; i++) await post('/api/join', { name: `Reader ${i}`, code: app.state.sessionCode });
  await post('/api/command', { id: `proof-start-${crypto.randomUUID()}`, action: 'start' }, hostCookie);
  await page.waitForFunction(() => window.__snapshot?.world.status === 'running');
  await page.waitForFunction(() => (window.__snapshot.world.land?.plots || []).length === 2, null, { timeout: 20000 });

  const putAway = async () => {
    for (let round = 0; round < 4; round++) {
      let any = false;
      for (const selector of ['#tip:not([hidden]) .tip-close', '#tip:not([hidden]) #tip-close', '#journal-close']) if (await page.locator(selector).isVisible().catch(() => false)) { await page.locator(selector).click().catch(() => {}); any = true; }
      if (/^Keep playing/.test(await page.locator('#military-toggle').textContent().catch(() => '') || '')) { await page.locator('#military-toggle').click(); any = true; }
      if (!any) break;
      await page.waitForTimeout(200);
    }
  };
  await putAway();
  // The map closed in on the two plots in the middle of the screen.
  await page.locator('#map-nav [data-view=home]').click();
  const plotBox = id => page.evaluate(plotId => {
    const plot = (window.__plotsDrawn || []).find(one => one.id === plotId), canvas = document.querySelector('#world-map'), rect = canvas.getBoundingClientRect();
    if (!plot) return null;
    const k = rect.width / canvas.width, xs = plot.corners.map(c => rect.left + c.x * k), ys = plot.corners.map(c => rect.top + c.y * k);
    return { x: (Math.min(...xs) + Math.max(...xs)) / 2, y: (Math.min(...ys) + Math.max(...ys)) / 2, w: Math.max(...xs) - Math.min(...xs) };
  }, id);
  // Closed in until a plot is some 150 px across, and moved with the arrow keys until it stands in the middle, clear of the bar.
  const frame = async () => {
    for (let step = 0; step < 16; step++) {
      const at = await plotBox('plot-1');
      if (at && at.w > 150) break;
      if (at) await page.mouse.move(at.x, at.y);
      await page.mouse.wheel(0, -240);
      await page.waitForTimeout(250);
    }
    await page.locator('#world-map').focus();
    for (let step = 0; step < 30; step++) {
      const at = await plotBox('plot-1');
      const dx = at.x - 760, dy = at.y - 420;
      if (Math.abs(dx) < 120 && Math.abs(dy) < 90) break;
      await page.keyboard.press(Math.abs(dx) >= 120 ? (dx > 0 ? 'ArrowRight' : 'ArrowLeft') : (dy > 0 ? 'ArrowDown' : 'ArrowUp'));
      await page.waitForTimeout(120);
    }
    await page.waitForTimeout(400);
  };
  await frame();
  const plots = () => page.evaluate(() => window.__snapshot.world.land.plots.map(plot => ({ id: plot.id, sown: Boolean(plot.sown), crop: plot.crop || null, ripe: Boolean(plot.ripe) })));
  const chooser = () => page.evaluate(() => ({
    shown: !document.querySelector('#survey-choose').hidden, eyebrow: document.querySelector('#survey-eyebrow').textContent, title: document.querySelector('#survey-title').textContent,
    text: document.querySelector('#survey-text').textContent, crops: !document.querySelector('#plant-crops').hidden,
    buttons: [...document.querySelectorAll('#plant-crops .plant-crop')].map(button => button.textContent), harvest: !document.querySelector('#plot-harvest').hidden,
    fence: !document.querySelector('#plot-fence').hidden,
    who: document.querySelector('#plot-who-line').hidden ? null : document.querySelector('#plot-who').selectedOptions[0]?.textContent || null,
    whoCount: document.querySelector('#plot-who').options.length,
  }));
  const shot = async name => { const path = `docs/evidence/field-click-${name}.png`; await page.screenshot({ path }); shots.push(path); };

  // ------------------------------------------------------------------ 1. hovered, lit; clicked, the chooser on that plot
  const one = await plotBox('plot-1');
  await page.mouse.move(one.x, one.y);
  await page.mouse.move(one.x + 2, one.y + 1);
  await page.waitForFunction(() => window.__plotHover === 'plot-1', null, { timeout: 5000 });
  const cursor = await page.evaluate(() => document.querySelector('#world-map').style.cursor);
  assert.equal(cursor, 'pointer', 'the pointer is not a hand over a plot');
  await shot('hover');
  ok('a plot of the family\'s own field under the mouse is lit, and the pointer is a hand');
  const off = await page.evaluate(() => { const rect = document.querySelector('#world-map').getBoundingClientRect(); return { x: rect.left + 40, y: rect.top + rect.height - 120 }; });
  await page.mouse.move(off.x, off.y);
  await page.waitForFunction(() => window.__plotHover === null, null, { timeout: 5000 });
  ok('off the plot it is not lit');

  assert.equal(await page.locator('#survey-choose').isVisible(), false, 'a chooser was open before the click');
  await page.mouse.click(one.x, one.y);
  await page.waitForFunction(() => /Bare\.$/.test(document.querySelector('#survey-text')?.textContent || ''), null, { timeout: 10000 });
  const bare = await chooser();
  assert.equal(bare.eyebrow, 'PLANTING');
  assert.match(bare.text, /^Ten acres of prairie .*, cleared, with no fence .*\. Bare\.$/);
  assert.deepEqual(bare.buttons, ['Plant corn2 seed', 'Plant cotton3 seed'], `each crop's seed is not on its button: ${JSON.stringify(bare.buttons)}`);
  assert.ok(bare.who, 'the chooser does not say who would plant it');
  assert.match(bare.title, new RegExp(`^What ${bare.who} plants$`));
  assert.equal(bare.fence, true, 'a cleared plot with no fence does not offer Fence it');
  await shot('bare-chooser');
  ok(`a bare plot clicked with no work chosen opens "${bare.title}": "${bare.text}", Plant corn (2 seed) and Plant cotton (3 seed), ${bare.who} to go (${bare.whoCount} who could)`);
  await page.locator('#plant-crops [data-crop=corn]').click();
  // Who went: the one the chooser named (the server's state, read afresh: a proof is handed a copy).
  let planter = null;
  for (let i = 0; i < 40 && !planter; i++) { planter = Object.values(app.state.world.entities).find(one => one.householdId === 'hh-1' && one.chore?.id === 'plant-field')?.name || null; if (!planter) await page.waitForTimeout(100); }
  assert.equal(planter, bare.who);
  await page.waitForFunction(() => window.__snapshot.world.land.plots.find(plot => plot.id === 'plot-1')?.crop === 'corn', null, { timeout: 60000 });
  ok(`Plant corn sowed plot-1 in corn, by ${planter}`);

  // A second plot, tapped with a finger: the chooser, and nothing sent until the crop is pressed.
  const two = await plotBox('plot-2');
  const stillPlanting = await page.evaluate(name => window.__snapshot.world.entities.some(one => one.name === name && one.chore), bare.who);
  await page.touchscreen.tap(two.x, two.y);
  await page.waitForFunction(() => /fenced\. Bare\.$/.test(document.querySelector('#survey-text')?.textContent || ''), null, { timeout: 10000 });
  const tapped = await chooser();
  assert.equal((await plots()).find(plot => plot.id === 'plot-2').sown, false, 'a tap planted the plot before a crop was pressed');
  // Who goes is the person whose bar is shown when the server would send them, else the next who may (`plotHand`).
  if (stillPlanting) assert.notEqual(tapped.who, bare.who, `${bare.who} is planting already and was given the second plot too`);
  assert.equal(tapped.fence, false, 'a fenced plot offers Fence it');
  await page.locator('#plant-crops [data-crop=cotton]').click();
  await page.waitForFunction(() => window.__snapshot.world.land.plots.find(plot => plot.id === 'plot-2')?.crop === 'cotton', null, { timeout: 60000 });
  ok(`a second plot tapped by touch opened the chooser and sent nothing; Plant cotton sowed it, by ${tapped.who}${stillPlanting ? `, the next free hand while ${bare.who} planted` : ''}`);

  // ------------------------------------------------------------------ 2. growing: clicked, and from the keyboard
  await page.waitForFunction(() => window.__snapshot.world.land.plots.every(plot => plot.sown), null, { timeout: 60000 });
  await page.mouse.click(one.x, one.y);
  await page.waitForFunction(() => document.querySelector('#survey-title')?.textContent === 'Corn growing', null, { timeout: 10000 });
  const growing = await chooser();
  assert.equal(growing.eyebrow, 'FIELD');
  assert.match(growing.text, /Corn growing, ready (in about \d+ minutes|within the minute)\.$/);
  assert.doesNotMatch(growing.text, /already in corn/, 'the growing plot says what grows twice');
  assert.equal(growing.crops, false, 'a growing plot offered to be planted');
  assert.equal(growing.who, null, 'a growing plot asked who');
  assert.equal(growing.fence, true, 'a growing plot with no fence does not offer Fence it');
  await shot('growing');
  ok(`a growing plot clicked says "${growing.title}": "${growing.text}", with nothing to send but Fence it`);
  // Fence it: somebody of the family sent to fence that plot (the server's state, read afresh).
  await page.locator('#plot-fence').click();
  let fencer = null;
  for (let i = 0; i < 40 && !fencer; i++) { fencer = Object.values(app.state.world.entities).find(one => one.householdId === 'hh-1' && one.chore?.id === 'fence-plot')?.name || null; if (!fencer) await page.waitForTimeout(100); }
  assert.ok(fencer, `nobody was sent to fence it: "${await page.locator('#survey-note').textContent()}"`);
  await page.waitForFunction(() => document.querySelector('#survey-choose').hidden, null, { timeout: 5000 });
  ok(`"Fence it" on the unfenced plot sent ${fencer} to fence it; the fenced plot offered none`);
  // The keyboard's way to a plot without the map: the field line's chip.
  const chip = page.locator('#field-summary .crop-chip[data-crop=cotton][data-stage=growing]');
  await chip.focus();
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => document.querySelector('#survey-title')?.textContent === 'Cotton growing', null, { timeout: 10000 });
  const focused = await page.evaluate(() => document.activeElement?.closest('#survey-choose') ? document.activeElement.id || document.activeElement.textContent : null);
  assert.ok(focused, 'the keyboard was not taken into the chooser');
  ok(`from the keyboard, the field line's cotton chip opens the cotton plot ("Cotton growing"), the focus on "${focused}"`);
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => document.querySelector('#survey-choose').hidden, null, { timeout: 5000 });

  // ------------------------------------------------------------------ 4. the carreta short of a hide, and the hunt that brings one
  // Nobody of the family takes up work of their own from here on: on auto, a hand the page last saw idle could be sent to cut
  // the crop between that snapshot and the press, and the press was rightly refused ("… is already cutting the crop") - the
  // proof failing 3 runs in 5 on 1638f5ca, the game doing nothing wrong. What this proves is the student's own presses.
  for (const id of await page.evaluate(() => window.__snapshot.world.household.members || [])) {
    // A baby has no auto to put off, and is refused it.
    await page.evaluate(async body => (await fetch('/api/command', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })).status, { id: `proof-${crypto.randomUUID()}`, action: 'set-auto', entityId: id, auto: false });
  }
  await page.waitForTimeout(1200);
  // A free grown hand to make it: their portrait, so the bar is theirs (docs/FAMILY_PANEL.md).
  const maker = await page.evaluate(() => {
    const world = window.__snapshot.world;
    return (world.household.members || []).map(id => world.entities.find(one => one.id === id)).find(one => one && !one.chore && (world.work?.[one.id] || []).some(entry => entry.id === 'hunt-land' && entry.can))?.id;
  });
  assert.ok(maker, 'nobody free to hunt');
  await page.locator(`.panel-portrait[data-portrait="${maker}"]`).click();
  await page.waitForTimeout(400);
  const carreta = page.locator(`.panel-row[data-entity-id="${maker}"] .panel-icon[data-key="make-carreta"]`);
  await carreta.waitFor({ state: 'visible', timeout: 10000 });
  const greyed = await carreta.evaluate(button => ({ refused: button.getAttribute('aria-disabled'), goal: button.dataset.goal, beads: [...button.querySelectorAll('.panel-needs i')].map(bead => `${bead.dataset.want}:${bead.dataset.met}`), label: button.getAttribute('aria-label') }));
  assert.equal(greyed.refused, 'true');
  assert.equal(greyed.goal, 'true', 'the carreta is not drawn as a goal');
  assert.deepEqual(greyed.beads, ['axe:true', 'logs:true', 'hide:false']);
  ok(`the carreta, short of its hide, is on the bar greyed with its wants: ${greyed.beads.join(', ')}`);
  // A real press with the mouse (a refused icon is `aria-disabled`, which Playwright's own click will not press).
  const box = await carreta.boundingBox();
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await page.locator('.panel-tip-go').first().waitFor({ state: 'visible', timeout: 5000 });
  const popup = await page.evaluate(() => ({ note: document.querySelector('#panel-tip-note').textContent, needs: [...document.querySelectorAll('#panel-tip-needs b')].map(chip => chip.textContent), ways: [...document.querySelectorAll('#panel-tip-ways .panel-tip-go')].map(go => go.textContent) }));
  assert.match(popup.note, /no hide in the house\. A hunt brings one home\./);
  assert.deepEqual(popup.needs, ['Felling axe 1/1', 'Logs 3/3', 'Hide 0/1']);
  assert.deepEqual(popup.ways, ['Go hunting', 'Buy one from the tanner']);
  await shot('carreta-wants');
  ok(`pressed, its popup says "${popup.note}", lists ${popup.needs.join(', ')}, and offers: ${popup.ways.map(way => `"${way}"`).join(' and ')}`);
  // The tanner: the town errand opens with the rawhide already on the list.
  await page.locator('.panel-tip-go', { hasText: 'Buy one from the tanner' }).click();
  await page.waitForFunction(() => (window.__errand?.lines || []).some(line => line.id === 'tanner:rawhide' && line.count === 1), null, { timeout: 15000 });
  await page.waitForFunction(() => /Buy a rawhide/.test(document.querySelector('[data-line="tanner:rawhide"][data-wanted=true]')?.textContent || ''), null, { timeout: 5000 });
  const rawhide = await page.locator('[data-line="tanner:rawhide"] .errand-price').textContent();
  await page.waitForTimeout(300);
  const inView = await page.evaluate(() => { const line = document.querySelector('[data-line="tanner:rawhide"]').getBoundingClientRect(), list = document.querySelector('#errand-lines').getBoundingClientRect(); return line.top >= list.top - 1 && line.bottom <= list.bottom + 1; });
  assert.ok(inView, 'the rawhide line is on the list but scrolled out of sight');
  await shot('tanner');
  ok(`"Buy one from the tanner" opens the errand with "Buy a rawhide" on the list (${rawhide})`);
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => document.querySelector('#errand').hidden, null, { timeout: 5000 });
  { const again = await carreta.boundingBox(); await page.mouse.click(again.x + again.width / 2, again.y + again.height / 2); }
  await page.locator('.panel-tip-go', { hasText: 'Go hunting' }).click();
  await page.waitForFunction(() => !document.querySelector('#survey-choose').hidden && document.querySelector('#survey-eyebrow').textContent === 'HUNTING', null, { timeout: 10000 });
  ok('"Go hunting" opens the hunt\'s place chooser for the same person');

  // A place on the family's land where game with a hide comes (the server's own facts), framed and clicked.
  const world = app.state.world, household = world.households['hh-1'];
  const bounds = holdingOf(world, household).bounds, homeSite = world.map.sites[household.homeSiteId];
  const places = [];
  for (let i = 0; i < 15; i++) for (let j = 0; j < 15; j++) {
    const point = { x: bounds.minX + (bounds.maxX - bounds.minX) * (i + 0.5) / 15, y: bounds.minY + (bounds.maxY - bounds.minY) * (j + 0.5) / 15 };
    const facts = huntFacts(world, household, point);
    if (facts.can && facts.comes && GAME[facts.comes]?.hide > 0) places.push({ point, d: Math.hypot(point.x - homeSite.x, point.y - homeSite.y), comes: facts.comes });
  }
  places.sort((a, b) => a.d - b.d);
  assert.ok(places.length, 'nowhere on the land where game with a hide comes');
  const place = places[0];
  const screenOf = point => page.evaluate(p => {
    const canvas = document.querySelector('#world-map'), rect = canvas.getBoundingClientRect(), camera = window.__camera, k = rect.width / canvas.width;
    return { x: rect.left + (canvas.width / 2 + (p.x - camera.cx) * camera.scale) * k, y: rect.top + (canvas.height / 2 + (p.y - camera.cy) * camera.scale) * k };
  }, point);
  await page.locator('#world-map').focus();
  for (let step = 0; step < 60; step++) {
    const at = await screenOf(place.point);
    const dx = at.x - 900, dy = at.y - 450;
    if (Math.abs(dx) < 150 && Math.abs(dy) < 110) break;
    await page.keyboard.press(Math.abs(dx) >= 150 ? (dx > 0 ? 'ArrowRight' : 'ArrowLeft') : (dy > 0 ? 'ArrowDown' : 'ArrowUp'));
    await page.waitForTimeout(80);
  }
  const at = await screenOf(place.point);
  await page.mouse.click(at.x, at.y);
  await page.waitForFunction(() => !document.querySelector('#survey-send').hidden, null, { timeout: 10000 });
  const huntWords = await page.locator('#survey-text').textContent();
  await page.locator('#survey-send').click();
  await page.waitForFunction(id => window.__snapshot.world.entities.find(one => one.id === id)?.chore?.id === 'hunt-land', maker, { timeout: 10000 });
  ok(`a place clicked ("${huntWords.slice(0, 120)}…") and "Hunt there": ${maker} is out hunting`);
  // The shot asked: waited for, which on a dry day makes the kill certain (proved in its own right by test:hunt).
  await page.waitForFunction(id => window.__snapshot.world.entities.find(one => one.id === id)?.chore?.ask, maker, { timeout: 120000 });
  const answered = await page.evaluate(async body => (await fetch('/api/command', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })).status, { id: `proof-${crypto.randomUUID()}`, action: 'answer-chore', entityId: maker, option: 'wait' });
  assert.equal(answered, 200);
  await page.waitForFunction(() => (window.__snapshot.world.household.resources?.hides || 0) >= 1, null, { timeout: 180000 });
  await page.waitForFunction(() => /Hides 1/.test(document.querySelector('#supplies')?.textContent || ''), null, { timeout: 10000 });
  ok(`the hunt brought ${place.comes === 'bear' ? 'a bear\'s skin' : `the hide of ${GAME[place.comes].a}`} home, and the supplies line says "Hides 1"`);
  // The shot spent the last powder: the hunt is refused before anybody goes, greyed, pointing at powder in town ("Refuse it").
  await page.waitForFunction(id => !window.__snapshot.world.entities.find(one => one.id === id)?.chore, maker, { timeout: 120000 });
  await page.locator(`.panel-portrait[data-portrait="${maker}"]`).click();
  const huntIcon = page.locator(`.panel-row[data-entity-id="${maker}"] .panel-icon[data-key="hunt-land"]`);
  await page.waitForFunction(id => document.querySelector(`.panel-row[data-entity-id="${id}"] .panel-icon[data-key="hunt-land"]`)?.dataset.goal === 'true', maker, { timeout: 20000 });
  { const dry = await huntIcon.boundingBox(); await page.mouse.click(dry.x + dry.width / 2, dry.y + dry.height / 2); }
  await page.locator('.panel-tip-go').first().waitFor({ state: 'visible', timeout: 5000 });
  const dryPopup = await page.evaluate(() => ({ note: document.querySelector('#panel-tip-note').textContent, needs: [...document.querySelectorAll('#panel-tip-needs b')].map(chip => chip.textContent), ways: [...document.querySelectorAll('#panel-tip-ways .panel-tip-go')].map(go => go.textContent) }));
  assert.equal(dryPopup.note, 'There is no powder in the house to hunt with.');
  assert.deepEqual(dryPopup.needs, ['Powder 0/1']);
  assert.deepEqual(dryPopup.ways, ['Buy powder in town']);
  await shot('dry-hunt');
  ok(`with the last powder spent the hunt is greyed: "${dryPopup.note}", ${dryPopup.needs.join(', ')}, "${dryPopup.ways[0]}"`);
  await page.keyboard.press('Escape');
  // At 1024x600 the bar with its goals stays two rows, on the screen, its names whole (owner, 2026-09-30: "Keep the bar readable").
  await page.setViewportSize({ width: 1024, height: 600 });
  await page.waitForTimeout(800);
  const small = await page.evaluate(id => {
    const bar = document.querySelector(`.panel-row[data-entity-id="${id}"] .panel-icons`), box = bar.getBoundingClientRect();
    const icons = [...bar.querySelectorAll('.panel-icon')];
    const rows = new Set(icons.map(icon => Math.round(icon.getBoundingClientRect().top)));
    const cut = icons.filter(icon => { const name = icon.querySelector('.panel-action-name'); return name.scrollWidth > name.clientWidth + 1 || icon.getBoundingClientRect().width < 56; }).map(icon => icon.dataset.key);
    return { rows: rows.size, top: box.top, bottom: box.bottom, left: box.left, right: box.right, icons: icons.length, goals: icons.filter(icon => icon.dataset.goal === 'true').map(icon => icon.dataset.key), cut };
  }, maker);
  assert.ok(small.rows <= 2, `the bar is ${small.rows} rows at 1024x600`);
  assert.ok(small.top >= 0 && small.bottom <= 600 && small.left >= 0 && small.right <= 1024, `the bar leaves the screen at 1024x600: ${JSON.stringify(small)}`);
  assert.deepEqual(small.cut, [], `icons too narrow to read at 1024x600: ${small.cut}`);
  assert.ok(small.goals.includes('hunt-land'), 'the greyed hunt is gone from the bar at 1024x600');
  await shot('bar-1024');
  ok(`at 1024x600 the bar is ${small.rows} rows of ${small.icons} icons, its goals (${small.goals.join(', ')}) among them, all on the screen`);
  await page.setViewportSize({ width: 1440, height: 950 });
  await page.waitForTimeout(500);

  // ------------------------------------------------------------------ 3. ripe: clicked, and brought in
  await page.waitForFunction(() => window.__snapshot.world.land.plots.find(plot => plot.id === 'plot-1')?.ripe, null, { timeout: 120000 });
  await putAway();
  await page.locator('#map-nav [data-view=home]').click();
  await frame();
  const ripeAt = await plotBox('plot-1');
  await page.mouse.click(ripeAt.x, ripeAt.y);
  try { await page.waitForFunction(() => document.querySelector('#survey-title')?.textContent === 'Corn ripe', null, { timeout: 10000 }); }
  catch (error) { await page.screenshot({ path: 'test-results/field-click-ripe-failed.png' }); console.log(JSON.stringify({ ripeAt, chooser: await chooser(), plots: await plots(), drawn: await page.evaluate(() => window.__plotsDrawn) })); throw error; }
  const ripe = await chooser();
  assert.match(ripe.text, /Ripe corn, ready to bring in\.$/);
  assert.equal(ripe.harvest, true, 'no way to bring the ripe plot in');
  await shot('ripe');
  const bringer = ripe.who;
  await page.locator('#plot-harvest').click();
  // Sent: somebody of the family is bringing it in, or has already (the server's state, read afresh).
  let reaping = false;
  for (let i = 0; i < 60 && !reaping; i++) {
    const family = app.state.world.households['hh-1'];
    reaping = family.members.some(id => app.state.world.entities[id].chore?.id === 'harvest-field') || !family.plots.find(plot => plot.id === 'plot-1')?.ripe;
    if (!reaping) await page.waitForTimeout(250);
  }
  assert.ok(reaping, `nobody was sent to bring it in: "${await page.locator('#error').textContent().catch(() => '')}"`);
  ok(`a ripe plot clicked says "${ripe.title}": "${ripe.text}", and "Bring it in" sent ${bringer} to bring it in`);

  // ------------------------------------------------------------------ the carreta, made
  // The crop in first: the one sent to bring it in may be the maker, and until the server starts them on it they look free -
  // pressed then, the carreta was refused ("… is already cutting the crop"), 3 runs in 5 on 1638f5ca.
  await page.waitForFunction(id => { const world = window.__snapshot.world; return !world.household.plots?.find(plot => plot.id === 'plot-1')?.ripe && !world.entities.find(one => one.id === id)?.chore; }, maker, { timeout: 120000 });
  await page.waitForFunction(id => { const button = document.querySelector(`.panel-row[data-entity-id="${id}"] .panel-icon[data-key="make-carreta"]`); return button && button.getAttribute('aria-disabled') !== 'true' && !button.dataset.goal; }, maker, { timeout: 20000 });
  assert.equal(await carreta.locator('.panel-needs').count(), 0, 'the carreta still shows wants with everything in the house');
  await carreta.click();
  await page.waitForFunction(id => window.__snapshot.world.entities.find(one => one.id === id)?.chore?.id === 'make-carreta', maker, { timeout: 15000 });
  await page.waitForFunction(() => window.__snapshot.world.entities.some(one => one.kind === 'wagon' && one.carreta), null, { timeout: 180000 });
  await page.waitForTimeout(800);
  await shot('carreta-made');
  const made = await page.evaluate(() => ({ hides: window.__snapshot.world.household.resources.hides || 0, wants: window.__snapshot.world.household.wants?.carreta || null }));
  assert.equal(made.hides, 0, 'the hide was not used');
  ok('with the hide home the carreta is open; pressed, it is made, and the hide is gone into it');

  assert.deepEqual(errors, [], `the page threw: ${errors.join(' | ')}`);
  record = { at: new Date().toISOString(), seed, checks: pass, shots, notProved: ['Same computer only: headless Chrome with a touch screen emulated; no Chromebook, no LAN, no class.', 'The shot is answered by the command a "!" sends (proved by test:hunt), not by pressing the "!".'] };
  writeFileSync('docs/evidence/field-click-browser.json', `${JSON.stringify(record, null, 2)}\n`);
  console.log(`\n${pass.length} checks passed.`);
} finally {
  await browser.close();
  await app.close();
}
