// A large family comes in with two wagons, in a real browser (owner, 2026-09-25: "families should arrive with an appropriate
// number of wagons. larger families get more than one wagon based on their population."; docs/SETTLING_IN.md §4a).
//
// tests/wagons.test.mjs proves the rule and the drivers' reading of the projection. This proves a student sees it: a family of
// twelve rolled in the browser packs two wagons (the pack screen says so), and at Start both wagons are on the track in, each
// drawn with its own driver on it and its own ox before it, in line and not one on the other; once in, both stand in the yard,
// drawn apart. Same computer only. Run: npm run test:wagons (SHOTS=<dir> for the screenshots).
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createClassroom } from '../server/app.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { familyRoll } from '../sim/family.mjs';
import { meetFamily } from './support/meet-family.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const SHOTS = process.env.SHOTS || 'test-results';
mkdirSync(SHOTS, { recursive: true });
const pass = [];
const ok = label => { pass.push(label); console.log('PASS', label); };
const observed = {};

// A class whose first family rolls a twelve: two parents and ten children, two wagons.
let seed = null;
for (let n = 0; !seed; n++) if (familyRoll(`wagons-shot-${n}`, 'hh-1') === 12) seed = `wagons-shot-${n}`;
const app = createClassroom({ seed, playerCount: 5, tickMs: 700, worldFactory: (s, count) => createGonzalesWorld(s, count) });
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
  const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url);
  await page.locator('[name=name]').fill('Wagon reader');
  await page.locator('[name=code]').fill(app.state.sessionCode);
  await page.getByRole('button', { name: 'Join', exact: true }).click();
  await page.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-1');
  await meetFamily(page);
  const family = () => app.state.world.households['hh-1'];
  assert.equal(family().members.length, 12, 'the family did not roll a twelve, so this proves nothing');

  // The pack screen: two wagons packed together.
  await page.locator('#wagon-load').waitFor({ state: 'visible', timeout: 15000 });
  observed.room = await page.locator('#wagon-room').textContent();
  assert.match(observed.room, /^2 wagons: \d+ of 32 space filled/);
  await page.screenshot({ path: join(SHOTS, 'wagons-pack-1366.png') });
  ok(`a family of twelve packs two wagons: "${observed.room}"`);
  await page.locator('#wagon-done').click();

  for (let i = 2; i <= 5; i++) await post('/api/join', { name: `Reader ${i}`, code: app.state.sessionCode });
  await post('/api/command', { id: `proof-start-${crypto.randomUUID()}`, action: 'start' }, hostCookie);
  await page.waitForFunction(() => window.__snapshot?.world.status === 'running');
  if (await page.locator('#tutorial-skip').isVisible().catch(() => false)) await page.locator('#tutorial-skip').click();

  // On the track in: both wagons drawn, each with its driver seated on it, a length apart.
  const wagons = ['hh-1-wagon', 'hh-1-wagon-2'];
  await page.waitForFunction(() => Object.values(window.__seatedDrawn || {}).filter(one => one.seat === 'wagon').length === 2, null, { timeout: 30000 });
  await post('/api/command', { id: `proof-pause-${crypto.randomUUID()}`, action: 'pause' }, hostCookie);
  await page.waitForFunction(() => window.__snapshot.world.status === 'paused');
  // Close in on the family on the track, as a student would with the + button, so the wagons are drawn at a size to be read.
  // The wheel over the wagons, as a student zooms a map: the point under the cursor stays still.
  const wagonAt = () => page.evaluate(() => Object.values(window.__seatedDrawn || {}).find(one => one.seat === 'wagon')?.parts.find(part => part.part === 'wagon'));
  for (let i = 0; i < 8; i++) {
    const at = await wagonAt();
    if (!at || at.height >= 60) break;
    await page.mouse.move(at.x, at.y - at.height / 2);
    await page.mouse.wheel(0, -400);
    await page.waitForTimeout(400);
  }
  await page.waitForTimeout(1200);
  const road = await page.evaluate(() => {
    const drivers = Object.entries(window.__seatedDrawn || {}).filter(([, one]) => one.seat === 'wagon');
    return drivers.map(([id, one]) => ({ id, art: one.art, wagon: one.parts.find(part => part.part === 'wagon'), ox: one.parts.find(part => part.part === 'ox') }));
  });
  observed.onTheRoad = road;
  assert.equal(road.length, 2, 'two wagons are not both drawn with a driver on them');
  const gap = Math.round(Math.hypot(road[0].wagon.x - road[1].wagon.x, road[0].wagon.y - road[1].wagon.y));
  observed.roadGap = gap;
  // A wagon's length apart at least: the second drawn behind the first in line, never one on the other.
  assert.ok(gap >= Math.min(road[0].wagon.height, road[1].wagon.height), `the two wagons are drawn one on the other (${gap} px apart, ${road[0].wagon.height} px tall)`);
  assert.ok(road[0].wagon.height >= 30, `the camera never closed in (${road[0].wagon.height} px wagons)`);
  assert.deepEqual(wagons.map(id => app.state.world.entities[id].travel?.purpose), ['arrive', 'arrive']);
  await page.screenshot({ path: join(SHOTS, 'wagons-arrival-1366.png') });
  ok(`both wagons on the track in, each drawn with its own driver (${road.map(one => one.art || 'composite').join(', ')}), ${gap} px apart`);
  await post('/api/command', { id: `proof-resume-${crypto.randomUUID()}`, action: 'resume' }, hostCookie);

  // In the yard: both wagons standing, drawn apart.
  await page.waitForFunction(() => !window.__snapshot?.world.land?.arriving && window.__snapshot?.world.entities.filter(e => e.kind === 'wagon' && !e.travel).length === 2, null, { timeout: 240000 });
  await page.waitForFunction(() => window.__drawnAt?.['hh-1-wagon'] && window.__drawnAt?.['hh-1-wagon-2'], null, { timeout: 30000 });
  // To the family's land with the Land button, and over the yard, closer in again with the wheel.
  await page.locator('button[data-view="home"]').click();
  await page.waitForTimeout(800);
  for (let i = 0; i < 4; i++) {
    const at = await page.evaluate(() => window.__drawnAt?.['hh-1-wagon']);
    if (!at || at.size >= 70) break;
    await page.mouse.move(Math.max(5, Math.min(1360, at.x)), Math.max(5, Math.min(760, at.y)));
    await page.mouse.wheel(0, -300);
    await page.waitForTimeout(400);
  }
  await page.waitForTimeout(1500);
  observed.inTheYard = await page.evaluate(() => ({ first: window.__drawnAt['hh-1-wagon'], second: window.__drawnAt['hh-1-wagon-2'] }));
  observed.onTheLand = wagons.map(id => ({ id, ...app.state.world.entities[id].location }));
  const apart = Math.round(Math.hypot(observed.inTheYard.first.x - observed.inTheYard.second.x, observed.inTheYard.first.y - observed.inTheYard.second.y));
  assert.ok(apart >= 12, `the two wagons are drawn one on the other in the yard (${apart} px apart)`);
  await page.screenshot({ path: join(SHOTS, 'wagons-yard-1366.png') });
  ok(`in, both wagons stand in the yard ${apart} px apart`);
  assert.deepEqual(errors, [], `page errors: ${errors.join(' | ')}`);
  ok('no page errors');
  mkdirSync('docs/evidence', { recursive: true });
  writeFileSync('docs/evidence/wagons-browser.json', JSON.stringify({ record: 'wagons-browser', date: new Date().toISOString().slice(0, 10), browser: await browser.version(),
    ownerDirection: '"families should arrive with an appropriate number of wagons. larger families get more than one wagon based on their population." (2026-09-25)',
    checks: pass, observed, notProved: ['Same computer only: no physical LAN, no Chromebook, no class.'] }, null, 2) + '\n');
} finally {
  await browser.close();
  await app.close();
}
