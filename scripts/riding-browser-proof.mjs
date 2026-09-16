// Somebody on the horse sits on it, and somebody driving the ox and wagon sits on the wagon: proved in a real browser.
//
// Owner's playtest, 2026-09-16: "characters don't actually sit on the horse when using it ... Same thing for the Ox and
// Wagon." The rules are pure functions in public/motion.js (`seatOf`, `carriedWithRider`, `seatLayout`) and are tested in
// tests/riding.test.mjs; what only a browser can answer is whether the page draws them - the person's own figure over the
// mount, the mount not drawn a second time beside them - and that the second person is told who has the horse.
//
// Run: npm run test:riding
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createClassroom } from '../server/app.mjs';
import { createSettledWorld, keepFoundingFamilies } from '../tests/support/settled.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const pass = [];
const ok = (label, condition = true) => { assert.ok(condition, label); pass.push(label); console.log('PASS', label); };

// Slow ticks, so a journey is still on the road while it is looked at.
const app = createClassroom({ seed: 'riding-proof', playerCount: 5, tickMs: 4000, worldFactory: (seed, count) => keepFoundingFamilies(createSettledWorld(seed, count)) });
const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const errors = [];
const post = async (path, body, cookie) => {
  const response = await fetch(url + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(cookie && { Cookie: cookie }) }, body: JSON.stringify(body) });
  assert.equal(response.status, 200, `${path}: ${response.status} ${await response.clone().text()}`);
  return response;
};

try {
  const host = await post('/api/host', { key: app.state.hostKey });
  const hostCookie = host.headers.get('set-cookie').split(';')[0];
  const context = await browser.newContext({ reducedMotion: 'no-preference', viewport: { width: 1200, height: 800 }, deviceScaleFactor: 3 });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url);
  await page.locator('[name=name]').fill('Riding reader');
  await page.locator('[name=code]').fill(app.state.sessionCode);
  await page.getByRole('button', { name: 'Join', exact: true }).click();
  await page.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-1');
  for (let i = 2; i <= 5; i++) await post('/api/join', { name: `Reader ${i}`, code: app.state.sessionCode });
  await post('/api/command', { id: `proof-start-${crypto.randomUUID()}`, action: 'start' }, hostCookie);
  await page.waitForFunction(() => window.__snapshot?.world.status === 'running');
  // Out of the way of the map: the offer of a walk-through.
  await page.getByRole('button', { name: /No thanks/ }).click().catch(() => {});
  const command = input => page.evaluate(async body => {
    const response = await fetch('/api/command', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: `proof-${Math.random().toString(36).slice(2)}`, ...body }) });
    return { status: response.status, body: await response.json() };
  }, input);
  // A close crop round the rider and their mount, from where the page says it drew them, with the card closed.
  const closeUp = async (id, path) => {
    await page.locator('#selection-close').click().catch(() => {});
    // Closer than the portrait's own framing, so the figure on the mount can be seen.
    for (let i = 0; i < 2; i++) await page.locator('button[data-view="in"]').click();
    await page.waitForTimeout(700);
    // The page draws in canvas pixels; the screenshot is cut in CSS pixels.
    const parts = await page.evaluate(who => {
      // Width and height are capped separately (public/app.js `fitCanvas`), so each axis has its own scale.
      const canvas = document.querySelector('#world-map'), rect = canvas.getBoundingClientRect(), kx = rect.width / canvas.width, ky = rect.height / canvas.height;
      return window.__seatedDrawn[who].parts.map(part => ({ x: rect.left + part.x * kx, y: rect.top + part.y * ky, height: part.height * ky }));
    }, id);
    const left = Math.min(...parts.map(part => part.x - part.height * 1.4)), right = Math.max(...parts.map(part => part.x + part.height * 1.4));
    const top = Math.min(...parts.map(part => part.y - part.height * 1.3)), bottom = Math.max(...parts.map(part => part.y + part.height * 0.4));
    await page.screenshot({ path, clip: { x: Math.max(0, left), y: Math.max(0, top), width: Math.min(1200, right) - Math.max(0, left), height: Math.min(800, bottom) - Math.max(0, top) } });
  };
  const names = await page.evaluate(() => Object.fromEntries(window.__snapshot.world.entities.map(e => [e.id, e.name])));

  // ------------------------------------------------------------------------------------------------ on the horse
  const rode = await command({ action: 'travel', entityId: 'hh-1-thomas', destination: 'gonzales', mode: 'horse' });
  assert.equal(rode.status, 200, JSON.stringify(rode.body));
  await page.waitForFunction(() => window.__snapshot.world.entities.find(e => e.id === 'hh-1-thomas')?.travel?.mode === 'horse');
  await page.locator('.panel-portrait[data-portrait="hh-1-thomas"]').click();
  await page.waitForFunction(() => window.__seatedDrawn?.['hh-1-thomas']?.seat === 'horse');
  await page.waitForTimeout(900);
  const horse = await page.evaluate(() => ({ seated: window.__seatedDrawn['hh-1-thomas'], drawn: Object.keys(window.__drawnAt), clips: [...window.__animationClips] }));
  const riderPart = horse.seated.parts.find(part => part.part === 'rider'), horsePart = horse.seated.parts.find(part => part.part === 'horse');
  ok('the person sent on the horse is drawn sitting on it', Boolean(riderPart && horsePart));
  ok(`their feet are up on the horse's back, not on the road (${horsePart.y - riderPart.y}px above the horse's hooves), and they are cut off below the waist`, riderPart.y < horsePart.y - horsePart.height * 0.25 && riderPart.shown < 1);
  ok('the horse is not drawn a second time walking beside them', !horse.drawn.includes('hh-1-horse'));
  ok(`drawn as themselves, not as the courier: ${horse.clips.filter(clip => /^rust-idle|^horse-walk/.test(clip)).join(', ')}`,
    horse.clips.some(clip => /^rust-idle-/.test(clip)) && horse.clips.some(clip => /^horse-walk/.test(clip)) && !horse.clips.some(clip => /^mounted-courier/.test(clip)));
  mkdirSync('docs/evidence', { recursive: true });
  await closeUp('hh-1-thomas', 'docs/evidence/riding-horse.png');

  // The second person is told who has it, and the server refuses the order anyway.
  const refused = await page.evaluate(() => window.__snapshot.world.travelModes['hh-1-rosa'].find(mode => mode.id === 'horse'));
  ok(`a second person is told who has the horse: "${refused.why}"`, refused.can === false && refused.why === `${names['hh-1-thomas']} has the horse.`);
  const forged = await command({ action: 'chore', entityId: 'hh-1-rosa', chore: 'hunt-timber', mode: 'horse' });
  ok(`and an order for it sent anyway is refused by the server: ${forged.status} "${forged.body.error}"`, forged.status !== 200 && forged.body.error === `${names['hh-1-thomas']} has the horse.`);

  // ------------------------------------------------------------------------------------------ driving the wagon
  const drove = await command({ action: 'chore', entityId: 'hh-1-mateo', chore: 'hunt-timber', mode: 'wagon' });
  assert.equal(drove.status, 200, JSON.stringify(drove.body));
  await page.waitForFunction(() => window.__snapshot.world.entities.find(e => e.id === 'hh-1-mateo')?.travel?.mode === 'wagon');
  await page.locator('.panel-portrait[data-portrait="hh-1-mateo"]').click();
  await page.waitForFunction(() => window.__seatedDrawn?.['hh-1-mateo']?.seat === 'wagon');
  await page.waitForTimeout(900);
  const wagon = await page.evaluate(() => ({ seated: window.__seatedDrawn['hh-1-mateo'], drawn: Object.keys(window.__drawnAt), clips: [...window.__animationClips] }));
  const driver = wagon.seated.parts.find(part => part.part === 'rider'), box = wagon.seated.parts.find(part => part.part === 'wagon'), ox = wagon.seated.parts.find(part => part.part === 'ox');
  ok('the person driving the ox and wagon is drawn on the wagon, with the ox in front', Boolean(driver && box && ox));
  ok(`sitting up on the wagon's seat, not walking on the road (feet ${box.y - driver.y}px above the wagon's wheels)`, driver.y < box.y - driver.height * 0.15 && driver.shown < 1);
  ok('the ox and the wagon are not drawn again by themselves', !wagon.drawn.includes('hh-1-animal') && !wagon.drawn.includes('hh-1-wagon'));
  ok(`with the ox walking and the wagon rolling: ${wagon.clips.filter(clip => /^ox-walk|^wagon-/.test(clip)).join(', ')}`,
    wagon.clips.some(clip => /^ox-walk/.test(clip)) && wagon.clips.some(clip => /^wagon-.*travel$/.test(clip)));
  await closeUp('hh-1-mateo', 'docs/evidence/riding-wagon.png');

  assert.deepEqual(errors, [], `page errors: ${errors.join(' | ')}`);
  ok('no page errors anywhere in the run');

  writeFileSync('docs/evidence/riding-browser.json', JSON.stringify({
    record: 'riding-browser',
    date: new Date().toISOString().slice(0, 10),
    browser: await browser.version(),
    ownerDirection: '"characters don\'t actually sit on the horse when using it. More than one character is able to use each mode of transportation even if it\'s already in use, that shouldn\'t be the case. A character should actually sit on the horse when using it. Same thing for the Ox and Wagon."',
    checks: pass,
    measured: { horse: horse.seated, wagon: wagon.seated },
    screenshots: ['docs/evidence/riding-horse.png', 'docs/evidence/riding-wagon.png'],
    notProved: [
      'Same computer only: one browser and the server on one machine. Nothing here is LAN or district evidence.',
      'That the stand-in reads well at every zoom and in every direction; the screenshots are one zoom, the direction the road happened to run.',
      'That two students, on two devices, racing for the one horse are both answered correctly at the same instant: the server refuses the second order (tests/keeping.test.mjs), but no two-device race was run.',
    ],
  }, null, 2) + '\n');
  console.log('\nwrote docs/evidence/riding-browser.json');
} finally {
  await browser.close();
  await app.close();
}
