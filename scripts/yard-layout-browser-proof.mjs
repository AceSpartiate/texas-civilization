// What stands round a family's house, each in its own place, in a real browser (owner, 2026-10-13: "a lot of assets get put in the
// same place and overlap. garden and logs for example conflict with roads and the tent").
//
// tests/yard-layout.test.mjs proves the layout on the ground over many families (sim/yard-layout.mjs). This shoots what a student
// sees: several families' yards, on different land, at the camp before the house and with the house standing, its yard fenced and
// its ways trodden; and reads back where the page drew the tent, the garden, the woodpile and the camp and checks that no two of
// them, and none of them and the house, are drawn over each other.
//
// Same computer only: headless Chrome. Run: npm run test:yard-layout (SHOTS=<dir> for the pictures, test-results by default;
// YARD_SEEDS=a,b to choose).
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createClassroom } from '../server/app.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { advanceLandPaths, raiseYard } from '../sim/land-paths.mjs';
import { applyAction, stepWorld } from '../sim/world.mjs';
import { holdingOf } from '../sim/grants.mjs';
import { siteFactsFor } from '../sim/homesite.mjs';
import { houseSettled, planHouse } from '../sim/houses.mjs';
import { PIECES } from '../sim/houseplot.mjs';
import { pitchTent } from '../sim/settling.mjs';
import { gardenPoint } from '../sim/housework.mjs';
import { keepFoundingFamilies, taught } from '../tests/support/settled.mjs';
import { housesOnLand } from '../sim/house-placement.mjs';
import { pictureBox, yardLayout } from '../sim/yard-layout.mjs';

const roundBox = box => Object.fromEntries(Object.entries(box).map(([k, v]) => [k, Math.round(v)]));
import { meetFamily } from './support/meet-family.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const SHOTS = process.env.SHOTS || 'test-results';
mkdirSync(SHOTS, { recursive: true });
const SEEDS = (process.env.YARD_SEEDS || 'yard-layout-1,yard-layout-4,yard-layout-7').split(',');
const STATES = (process.env.YARD_STATES || 'camp,house').split(',');
const pass = [];
const ok = label => { pass.push(label); console.log('PASS', label); };
const observed = [];

/** A family on the real land with its site chosen, everybody home; at the camp (the tent up) or with its house finished, the yard fenced. */
function yardWorld(seed, count, state) {
  const world = createGonzalesWorld(seed, count, { map: 'colonies' });
  world.status = 'running';
  for (let tick = 0; tick < 200 && Object.values(world.households).some(household => household.arriving); tick++) stepWorld(world);
  const household = world.households['hh-1'], bounds = holdingOf(world, household).bounds;
  const sites = [];
  for (let i = 0; i < 7; i++) for (let j = 0; j < 7; j++) sites.push({ x: +(bounds.minX + (bounds.maxX - bounds.minX) * (i + 0.5) / 7).toFixed(2), y: +(bounds.minY + (bounds.maxY - bounds.minY) * (j + 0.5) / 7).toFixed(2) });
  // The site nearest the middle of the land that the family may build on, as a student mostly chooses.
  const mid = { x: (bounds.minX + bounds.maxX) / 2, y: (bounds.minY + bounds.maxY) / 2 };
  sites.sort((a, b) => Math.hypot(a.x - mid.x, a.y - mid.y) - Math.hypot(b.x - mid.x, b.y - mid.y));
  applyAction(world, 'hh-1', { action: 'choose-site', ...sites.find(point => siteFactsFor(world, household, point).can) });
  for (let tick = 0; tick < 60 && household.members.some(id => world.entities[id].travel); tick++) stepWorld(world);
  for (const one of Object.values(world.households)) one.lesson = { step: 'done' };
  household.logs = { wall: 24, sill: 4, poor: 3 };
  household.herd = { cattle: 4, hogs: 3 };
  household.garden = { ...gardenPoint(world, household), laid: 0, worked: 0 };
  if (state === 'house') {
    household.improvements.cabin = 'none';
    delete household.tent;
    planHouse(world, household, 'round-log');
    for (const piece of household.house.pieces) piece.stage = PIECES[piece.type].stages.length;
    household.improvements.cabin = 'sound';
    raiseYard(world, household, null);
    for (let i = 0; i < 12; i++) advanceLandPaths(world, houseSettled);
  } else {
    household.improvements.cabin = 'none';
    pitchTent(world, household);
  }
  // A few ticks, as a class runs: the beasts walked to their stands (sim/yard-layout.mjs `settleStands`), the ways trodden.
  for (let i = 0; i < 3; i++) stepWorld(world);
  world.status = 'lobby';
  return taught(keepFoundingFamilies(world));
}

const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const errors = [];
try {
  for (const seed of SEEDS) for (const state of STATES) {
    const app = createClassroom({ seed, playerCount: 5, tickMs: 700, worldFactory: (s, count) => yardWorld(s, count, state) });
    const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
    try {
      const post = async (path, body, cookie) => {
        const response = await fetch(url + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(cookie && { Cookie: cookie }) }, body: JSON.stringify(body) });
        assert.equal(response.status, 200, `${path}: ${response.status}`);
        return response;
      };
      const hostCookie = (await post('/api/host', { key: app.state.hostKey })).headers.get('set-cookie').split(';')[0];
      const page = await (await browser.newContext({ viewport: { width: 1366, height: 768 } })).newPage();
      page.on('pageerror', error => errors.push(`${seed} ${state}: ${error.message}`));
      await page.goto(url);
      await page.locator('[name=name]').fill('Yard reader');
      await page.locator('[name=code]').fill(app.state.sessionCode);
      await page.getByRole('button', { name: 'Join', exact: true }).click();
      await page.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-1');
      await meetFamily(page);
      for (let i = 2; i <= 5; i++) await post('/api/join', { name: `Reader ${i}`, code: app.state.sessionCode });
      for (const button of ['#wagon-done', '#tutorial-skip']) if (await page.locator(button).isVisible()) await page.locator(button).click({ timeout: 5000 }).catch(() => {});
      await post('/api/command', { id: `proof-start-${crypto.randomUUID()}`, action: 'start' }, hostCookie);
      await page.waitForFunction(() => window.__snapshot?.world.status === 'running', null, { timeout: 20000 });
      // Two ticks run, as a class's first moments do: whatever Start changed on the land (the family's means, its stock) is settled.
      const started = await page.evaluate(() => window.__snapshot.world.tick);
      await page.waitForFunction(tick => window.__snapshot.world.tick >= tick + 2, started, { timeout: 30000 });
      await post('/api/command', { id: `proof-pause-${crypto.randomUUID()}`, action: 'pause' }, hostCookie);
      await page.waitForFunction(() => window.__snapshot?.world.status === 'paused', null, { timeout: 20000 });
      for (let i = 0; i < 4; i++) {
        const got = page.getByRole('button', { name: 'Got it' });
        if (!(await got.isVisible().catch(() => false))) break;
        await got.click({ timeout: 3000 }).catch(() => {});
      }
      // The family's land, closed in on the house until about a third of a mile across is on the screen, and the house dragged to the middle.
      await page.locator('[data-view="home"]').click();
      await page.waitForTimeout(400);
      for (let i = 0; i < 14 && await page.evaluate(() => { const c = window.__camera, m = document.querySelector('#world-map'); return m.width / c.scale > 0.6; }); i++) {
        await page.locator('[data-view="in"]').click();
        await page.waitForTimeout(150);
      }
      const site = app.state.world.map.sites[app.state.world.households['hh-1'].homeSiteId];
      const onPage = at => page.evaluate(at => {
        const canvas = document.querySelector('#world-map'), rect = canvas.getBoundingClientRect(), camera = window.__camera;
        const sx = canvas.width / 2 + (at.x - camera.cx) * camera.scale, sy = canvas.height / 2 + (at.y - camera.cy) * camera.scale;
        return { x: rect.left + sx * rect.width / canvas.width, y: rect.top + sy * rect.height / canvas.height };
      }, at);
      const from = await onPage(site), box = await page.locator('#world-map').boundingBox();
      const to = { x: box.x + box.width * 0.6, y: box.y + box.height * 0.45 };
      await page.mouse.move(from.x, from.y); await page.mouse.down();
      for (let k = 1; k <= 8; k++) await page.mouse.move(from.x + (to.x - from.x) * k / 8, from.y + (to.y - from.y) * k / 8);
      await page.mouse.up();
      await page.waitForTimeout(1500);
      const shot = join(SHOTS, `yard-${seed}-${state}.png`);
      await page.screenshot({ path: shot });
      const drawn = await page.evaluate(siteId => ({
        tent: window.__tentsDrawn?.[siteId] || null, garden: window.__gardenDrawn?.[siteId] || null, pile: window.__woodPileAt || null,
        camera: { cx: window.__camera.cx, cy: window.__camera.cy, scale: window.__camera.scale, width: document.querySelector('#world-map').width, height: document.querySelector('#world-map').height },
        yard: window.__yardDrawn || null,
        paths: (window.__pathsDrawn || []).map(path => ({ to: path.to, worn: path.worn })), pictures: window.__yardPictures || null,
        figures: Object.fromEntries(Object.entries(window.__drawnAt || {}).filter(([id]) => /^hh-1-/.test(id))),
      }), site.id);
      // Read back: where each thing was drawn against where the server laid it out.
      const world = app.state.world, household = world.households['hh-1'], layout = yardLayout(world, household), { camera } = drawn;
      const toScreen = p => ({ x: camera.width / 2 + (p.x - camera.cx) * camera.scale, y: camera.height / 2 + (p.y - camera.cy) * camera.scale });
      const onScreen = box => { const a = toScreen({ x: box.minX, y: box.minY }), b = toScreen({ x: box.maxX, y: box.maxY }); return { left: a.x, top: a.y, right: b.x, bottom: b.y }; };
      const meets = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
      const faults = [];
      const pictures = Object.entries(drawn.pictures || {}).filter(([what, box]) => what !== 'figure' && box);
      assert.ok(pictures.some(([what]) => what === 'woodpile') && pictures.some(([what]) => what === 'garden'), `the woodpile and the garden were not drawn: ${JSON.stringify(drawn.pictures)}`);
      if (state === 'camp') assert.ok(pictures.some(([what]) => what === 'tent') && pictures.some(([what]) => what === 'camp'), `the tent and the camp were not drawn: ${JSON.stringify(drawn.pictures)}`);
      for (const [what, box] of pictures) {
        // Inside its footprint, as the server laid it out: what is clear on the ground is clear on the screen.
        const laid = layout.boxes.find(one => one.what === what);
        if (!laid) continue;
        const room = onScreen(laid.box);
        if (box.left < room.left - 2 || box.right > room.right + 2 || box.top < room.top - 2 || box.bottom > room.bottom + 2) faults.push(`${what} drawn ${JSON.stringify(box)} outside its footprint ${JSON.stringify(roundBox(room))}`);
        for (const house of housesOnLand(world, household)) if (meets(box, onScreen(house.claim))) faults.push(`${what} drawn over the house`);
      }
      for (let i = 0; i < pictures.length; i++) for (let j = i + 1; j < pictures.length; j++) if (meets(pictures[i][1], pictures[j][1])) faults.push(`${pictures[i][0]} drawn over ${pictures[j][0]}`);
      // No way drawn through the logs, the garden or the tent (a tree cell in from their edges: a way's corner may brush one).
      const cell = 0.0039 * camera.scale;
      for (const path of drawn.paths) for (const [what, box] of pictures.filter(([what]) => what !== 'camp')) {
        const inner = { left: box.left + cell, right: box.right - cell, top: box.top + cell, bottom: box.bottom - cell };
        if (inner.left < inner.right && inner.top < inner.bottom && path.worn.some((p, i) => i > 0 && [0.25, 0.5, 0.75, 1].some(t => { const x = path.worn[i - 1].x + (p.x - path.worn[i - 1].x) * t, y = path.worn[i - 1].y + (p.y - path.worn[i - 1].y) * t; return x > inner.left && x < inner.right && y > inner.top && y < inner.bottom; }))) faults.push(`the way to ${path.to} drawn through the ${what}`);
      }
      // Each beast and wagon idle in the yard drawn standing at its own stand - or, where work about the place left it (the horse back
      // from the stock), standing clear of everything round the house and of the others (sim/yard-layout.mjs `settleStands`).
      let atStands = 0;
      for (const [id, stand] of Object.entries(layout.stands)) {
        const at = drawn.figures[id], entity = world.entities[id];
        if (!at || entity.travel || entity.borrowedBy) continue;
        if (Math.hypot(entity.location.x - stand.x, entity.location.y - stand.y) > 1e-6) {
          const what = entity.kind === 'wagon' ? 'wagon' : entity.species === 'horse' ? 'horse' : entity.species === 'mule' ? 'mule' : 'ox';
          const mine = pictureBox(what, entity.location), meets2 = (a, b) => a.minX < b.maxX && b.minX < a.maxX && a.minY < b.maxY && b.minY < a.maxY;
          if (layout.boxes.some(one => one.id !== id && meets2(mine, one.box))) faults.push(`${id} left standing over something in the yard`);
          continue;
        }
        atStands++;
        const want = toScreen(stand), feet = { x: at.x, y: at.y + at.size * 0.45 };
        if (Math.hypot(feet.x - want.x, feet.y - want.y) > 3) faults.push(`${id} drawn ${Math.round(Math.hypot(feet.x - want.x, feet.y - want.y))} px off its stand`);
      }
      assert.deepEqual(faults, [], `${seed} ${state}`);
      observed.push({ seed, state, shot, site: { x: site.x, y: site.y }, drawn, stands: layout.stands });
      ok(`${seed} ${state}: ${pictures.map(([what]) => what).join(', ')} each drawn inside its own footprint, none over another, the house or a way; ${atStands} of ${Object.keys(layout.stands).length} beasts and wagons at their stands, the rest clear (${shot})`);
    } finally {
      await app.close();
    }
  }
  assert.deepEqual(errors, [], `page errors: ${errors.join(' | ')}`);
  ok('no page errors');
  writeFileSync('docs/evidence/yard-layout-browser.json', JSON.stringify({ record: 'yard-layout-browser', date: new Date().toISOString().slice(0, 10), browser: await browser.version(), checks: pass, observed }, null, 2) + '\n');
} finally {
  await browser.close();
}
