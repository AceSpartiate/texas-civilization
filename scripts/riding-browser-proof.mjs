// Somebody on the horse sits on it, and somebody driving the ox and wagon sits on the wagon: proved in a real browser.
//
// Since Astra's mounted family and seated wagon drivers landed (2026-09-21) what that means has changed, and this proof
// is the photograph of the change: a rider is ONE painted frame of a person on the chestnut horse, not a figure cropped
// at the hip over a separately drawn horse, and a driver is a whole seated figure with reins and a goad on the wagon the
// renderer still draws. Both are read off `window.__seatedDrawn`, whose `art` is the delivered clip or null, and checked
// against `window.__animationClips`, which a clip only enters when `drawClip` actually returned a width - so a sheet that
// failed to load cannot pass this.
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
import { meetFamily } from './support/meet-family.mjs';

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
  // The title screen and the family made, before anything is drawn (public/creation.js, owner 2026-09-17): this proof
  // predates it and stood at the title screen until 2026-09-18.
  await meetFamily(page);
  for (let i = 2; i <= 5; i++) await post('/api/join', { name: `Reader ${i}`, code: app.state.sessionCode });
  await post('/api/command', { id: `proof-start-${crypto.randomUUID()}`, action: 'start' }, hostCookie);
  await page.waitForFunction(() => window.__snapshot?.world.status === 'running');
  // Out of the way of the map: the offer of a walk-through.
  await page.getByRole('button', { name: /No thanks/ }).click().catch(() => {});
  const command = input => page.evaluate(async body => {
    const response = await fetch('/api/command', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: `proof-${Math.random().toString(36).slice(2)}`, ...body }) });
    return { status: response.status, body: await response.json() };
  }, input);
  /**
   * Wait until the page is really drawing this person on this seat, zooming in until it is.
   *
   * A traveller crossing the screen faster than a walk can be drawn is a **marker** and no figure at all (public/motion.js
   * `MARKER_ABOVE`), so on a wide view `__seatedDrawn` is simply empty and every assertion below would be made about
   * nothing. That is the shape of mistake this project keeps finding - a check run in a state where the fault cannot
   * appear - so the wait is also the proof that the rider is on the screen before anything is measured.
   */
  const onScreen = async (id, seat) => {
    // The class is held while the rider is looked at, which is a state a real class is in every time a teacher stops it -
    // and the only state in which somebody crossing the country on horseback is a figure rather than a marker.
    await post('/api/command', { id: `proof-pause-${crypto.randomUUID()}`, action: 'pause' }, hostCookie);
    await page.waitForFunction(() => window.__snapshot.world.status === 'paused');
    await page.waitForFunction(who => window.__seatedDrawn?.[who.id]?.seat === who.seat, { id, seat }, { timeout: 20000 });
    const marker = await page.evaluate(who => window.__travelMarkers?.get(who)?.heightsPerSecond ?? 0, id);
    ok(`${id} is drawn as a figure on the map, not as a travel marker (${marker.toFixed(2)} heights a second)`, marker < 1);
  };
  const running = async () => {
    await post('/api/command', { id: `proof-resume-${crypto.randomUUID()}`, action: 'resume' }, hostCookie);
    await page.waitForFunction(() => window.__snapshot.world.status === 'running');
  };
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
  await onScreen('hh-1-thomas', 'horse');
  await page.waitForTimeout(900);
  const horse = await page.evaluate(() => ({ seated: window.__seatedDrawn['hh-1-thomas'], drawn: Object.keys(window.__drawnAt), clips: [...window.__animationClips],
    // The fault cannot show in a hidden canvas: the map's own box, so a drawn height is a height on a screen somebody has.
    canvas: [document.querySelector('#world-map').getBoundingClientRect().width, document.querySelector('#world-map').getBoundingClientRect().height] }));
  const riderPart = horse.seated.parts.find(part => part.part === 'rider');
  // `hh-1-thomas` is this family's principal, so he is always the rust figure: the clip is named, not guessed.
  const ridden = `rust-ride-${['n', 's'].includes(horse.seated.direction) ? horse.seated.direction : 'e'}`;
  ok(`the person sent on the horse is drawn as one painted horse-and-rider (${horse.seated.art})`, horse.seated.art === ridden && riderPart?.whole === true);
  ok('and not as a figure cropped at the hip laid over a separate horse', horse.seated.parts.length === 1 && riderPart.shown === undefined);
  ok(`the frame really painted this tick, at ${riderPart.height}px on the canvas`, horse.clips.includes(ridden) && riderPart.height > 8 && horse.canvas.some(size => size > 0));
  ok('the horse is not drawn a second time walking beside them', !horse.drawn.includes('hh-1-horse'));
  ok(`and no separate horse cycle is drawn under him at all: ${horse.clips.filter(clip => /^horse-|^rust-idle|^mounted-courier/.test(clip)).join(', ') || 'none'}`,
    !horse.clips.some(clip => /^horse-walk|^horse-chestnut|^mounted-courier|^rust-idle/.test(clip)));
  mkdirSync('docs/evidence', { recursive: true });
  await closeUp('hh-1-thomas', 'docs/evidence/riding-horse.png');

  // The second person is told who has it, and the server refuses the order anyway - with the class running, because a
  // held class refuses every order for its own reason and would answer this one without ever reading the horse.
  await running();
  const refused = await page.evaluate(() => window.__snapshot.world.travelModes['hh-1-rosa'].find(mode => mode.id === 'horse'));
  ok(`a second person is told who has the horse: "${refused.why}"`, refused.can === false && refused.why === `${names['hh-1-thomas']} has the horse.`);
  const forged = await command({ action: 'chore', entityId: 'hh-1-rosa', chore: 'hunt-timber', mode: 'horse' });
  ok(`and an order for it sent anyway is refused by the server: ${forged.status} "${forged.body.error}"`, forged.status !== 200 && forged.body.error === `${names['hh-1-thomas']} has the horse.`);

  // ------------------------------------------------------------------------------------------ driving the wagon
  const drove = await command({ action: 'chore', entityId: 'hh-1-mateo', chore: 'hunt-timber', mode: 'wagon' });
  assert.equal(drove.status, 200, JSON.stringify(drove.body));
  await page.waitForFunction(() => window.__snapshot.world.entities.find(e => e.id === 'hh-1-mateo')?.travel?.mode === 'wagon');
  await page.locator('.panel-portrait[data-portrait="hh-1-mateo"]').click();
  await onScreen('hh-1-mateo', 'wagon');
  await page.waitForTimeout(900);
  const wagon = await page.evaluate(() => ({ seated: window.__seatedDrawn['hh-1-mateo'], drawn: Object.keys(window.__drawnAt), clips: [...window.__animationClips],
    canvas: [document.querySelector('#world-map').getBoundingClientRect().width, document.querySelector('#world-map').getBoundingClientRect().height] }));
  const driver = wagon.seated.parts.find(part => part.part === 'rider'), box = wagon.seated.parts.find(part => part.part === 'wagon'), ox = wagon.seated.parts.find(part => part.part === 'ox');
  ok('the person driving the ox and wagon is drawn on the wagon, with the ox in front', Boolean(driver && box && ox));
  // `hh-1-mateo` is dealt the `blue` figure by the stable hash of his id, which is one of the four Astra painted driving.
  const driven = `blue-wagon-driver-${wagon.seated.direction}`;
  ok(`drawn as Astra's whole seated driver with his reins and goad (${wagon.seated.art})`, wagon.seated.art === driven && driver.seated === true && driver.shown === undefined);
  ok(`the frame really painted this tick, at ${driver.height}px on the canvas`, wagon.clips.includes(driven) && driver.height > 8 && wagon.canvas.some(size => size > 0));
  ok(`sitting up on the wagon's seat, not walking on the road (feet ${box.y - driver.y}px above the wagon's wheels)`, driver.y < box.y - driver.height * 0.15);
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
    delivered: { ridden: horse.seated.art, driven: wagon.seated.art },
    notProved: [
      'Same computer only: one browser and the server on one machine. Nothing here is LAN or district evidence.',
      'That the delivered art reads well at every zoom and in every direction; the screenshots are one zoom, the direction the road happened to run, and one of the three painted headings.',
      'The second cast driving and a child on the horse, which are still the composite stand-in because those layers are not delivered: no run here put either on a mount.',
      'That two students, on two devices, racing for the one horse are both answered correctly at the same instant: the server refuses the second order (tests/keeping.test.mjs), but no two-device race was run.',
    ],
  }, null, 2) + '\n');
  console.log('\nwrote docs/evidence/riding-browser.json');
} finally {
  await browser.close();
  await app.close();
}
