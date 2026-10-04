// The shot aimed by the student, in a real browser (owner, 2026-10-02, verbatim: "when a character goes hunting, when they see an
// animal the player should see an alert. if players click on it in time, then a first person mini game starts where they have to
// aim and hit the moving animal. if they miss, the animal runs away."; sim/hunt-aim.mjs, public/hunt-aim.js).
//
// Three hunts, each sent and run by the server as a class runs it:
//   1. 1366x768, the mouse: the sighting's "!" and its story card (*A deer!*, *Take the shot*, the seconds left), the card's button
//      opens the field, the deer comes in, stops to look, and the shot - the sights put on it - **hits**: the server says so, the
//      powder is spent once, the meat and the hide come home.
//   2. 1024x600, the keyboard, from the "!" on the hunter's row: the sights raised into the sky with the arrows and Space fired -
//      **a miss**: the server says so, one powder spent, no meat, and the deer runs (drawn bounding away on the map).
//   3. A second family on a touch screen asking for less motion: touch to put the sights on it, *Fire* - judged by the server the
//      same as the page read it; no bounding, a longer stop; and neither the first family's page nor the Host's projection holds a
//      word of the second family's sighting.
// Screenshots: docs/evidence/hunt-aim-*.png. Same computer only.
//
// Run: npm run test:hunt-aim
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createClassroom, PACES } from '../server/app.mjs';
import { createSettledWorld, keepFoundingFamilies } from '../tests/support/settled.mjs';
import { projectWorld } from '../sim/world.mjs';
import { meetFamily } from './support/meet-family.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const pass = [], shots = [], errors = [], observed = {};
const ok = label => { pass.push(label); console.log('PASS', label); };
const shot = async (page, name) => { const path = `docs/evidence/hunt-aim-${name}.png`; await page.screenshot({ path }); shots.push(path); };
mkdirSync('docs/evidence', { recursive: true });

// Powder enough for every shot below, in the house of every family (the server's world is its own: `app.state` is a copy).
const withPowder = world => { for (const one of Object.values(world.households)) one.resources.powder = 8; return world; };
const app = createClassroom({ seed: 'hunt-aim-proof', playerCount: 5, tickMs: 400, worldFactory: (seed, count) => withPowder(keepFoundingFamilies(createSettledWorld(seed, count))) });
const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const post = async (path, body, cookie) => {
  const response = await fetch(url + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(cookie && { Cookie: cookie }) }, body: JSON.stringify(body) });
  assert.equal(response.status, 200, `${path}: ${response.status} ${await response.clone().text()}`);
  return response;
};
async function join(context, name) {
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(`${name}: ${error.message}`));
  await page.goto(url);
  await page.locator('[name=name]').fill(name);
  await page.locator('[name=code]').fill(app.state.sessionCode);
  await page.getByRole('button', { name: 'Join', exact: true }).click();
  await page.waitForFunction(() => window.__snapshot?.world.householdId);
  await meetFamily(page);
  return page;
}
/** Send somebody to hunt the timber, as the student's own page orders it, and wait for the sighting. */
async function huntUntilSighting(page, entityId) {
  const sent = await page.evaluate(async id => {
    const response = await fetch('/api/command', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: crypto.randomUUID(), action: 'chore', entityId: id, chore: 'hunt-timber', mode: 'foot' }) });
    return { status: response.status, body: await response.json() };
  }, entityId);
  assert.equal(sent.status, 200, `the hunt was refused: ${JSON.stringify(sent.body)}`);
  await page.waitForFunction(id => window.__snapshot?.world.entities.find(one => one.id === id)?.chore?.ask?.sight, entityId, { timeout: 120000 });
  return page.evaluate(id => window.__snapshot.world.entities.find(one => one.id === id).chore.ask, entityId);
}
/** Where on the screen the sights must be held for the ball to find the body `lead` ms from now (the hand's wander taken off). */
const aimPoint = (page, lead) => page.evaluate(async ahead => {
  const { animalAt, swayAt, VIEW } = await import('/sim/hunt-aim.mjs');
  const aim = window.__huntAim, t = performance.now() - aim.t0 + ahead;
  const animal = animalAt(aim.path, t + aim.path.hangMs), sway = swayAt(aim.path, t);
  const box = document.querySelector('#hunt-aim-field').getBoundingClientRect();
  const s = Math.min(box.width / VIEW.w, box.height / VIEW.h), ox = (box.width - VIEW.w * s) / 2, oy = (box.height - VIEW.h * s) / 2;
  return { x: box.left + ox + (animal.body.cx - sway.dx) * s, y: box.top + oy + (animal.body.cy - sway.dy) * s, phase: animal.phase };
}, lead);
const stillPhase = page => page.waitForFunction(() => window.__huntAim?.phase === 'still', null, { timeout: 15000 });
const resultOf = page => page.waitForFunction(() => window.__huntAim?.result && !document.querySelector('#hunt-aim-result').hidden && window.__huntAim.result, null, { timeout: 15000 }).then(handle => handle.jsonValue());
const household = id => app.state.world.households[id];

try {
  const host = await post('/api/host', { key: app.state.hostKey });
  const hostCookie = host.headers.get('set-cookie').split(';')[0];
  const mouse = await browser.newContext({ reducedMotion: 'no-preference', viewport: { width: 1366, height: 768 } });
  const page = await join(mouse, 'Aim reader');
  assert.equal(await page.evaluate(() => window.__snapshot.world.householdId), 'hh-1');
  for (let i = 2; i <= 4; i++) await post('/api/join', { name: `Reader ${i}`, code: app.state.sessionCode });
  // The second family's student, on a touch screen asking for less motion, joins now: a class is joined before it starts.
  const touch = await browser.newContext({ reducedMotion: 'reduce', hasTouch: true, viewport: { width: 1024, height: 600 } });
  const second = await join(touch, 'Touch reader');
  await post('/api/command', { id: `proof-start-${crypto.randomUUID()}`, action: 'start' }, hostCookie);
  await page.waitForFunction(() => window.__snapshot?.world.status === 'running');
  app.setPace(PACES.quick);
  const hunter = 'hh-1-mateo';
  for (let i = 0; i < 4; i++) { if (await page.locator('#tip:not([hidden]) .tip-close').isVisible().catch(() => false)) await page.locator('#tip .tip-close').click(); await page.waitForTimeout(150); }

  // ------------------------------------------------------------------ 1. the alert, and a hit with the mouse at 1366x768
  const ask = await huntUntilSighting(page, hunter);
  assert.equal(ask.id, 'shot');
  assert.ok(ask.sight.quarry && ask.sight.hand && Number.isFinite(ask.leftMs), `the sighting came without its quarry, hand or time: ${JSON.stringify(ask).slice(0, 300)}`);
  assert.ok(ask.leftMs <= 15000 && ask.leftMs > 5000, `the sighting's window is ${ask.leftMs} ms, not fifteen seconds`);
  await page.waitForFunction(() => !document.querySelector('#military-notice').hidden && document.querySelector('#military-notice').dataset.accent === 'sighting' && !document.querySelector('#military-message').hidden, null, { timeout: 5000 });
  observed.alert = await page.evaluate(id => ({
    eyebrow: document.querySelector('#military-eyebrow').textContent, title: document.querySelector('#military-title').textContent,
    words: document.querySelector('#military-words').textContent, button: document.querySelector('#military-go').textContent,
    left: document.querySelector('#military-left').hidden ? null : document.querySelector('#military-left').textContent,
    glow: getComputedStyle(document.querySelector('#military-notice')).animationName, icon: document.querySelector('#military-icon').dataset.drawn || '',
    mark: document.querySelector(`.panel-row[data-entity-id="${id}"] .panel-attention`)?.hidden === false,
    markNeed: document.querySelector(`.panel-row[data-entity-id="${id}"] .panel-attention`)?.dataset.need || null,
  }), hunter);
  assert.equal(observed.alert.button, 'Take the shot');
  assert.match(observed.alert.title, /^A deer!$|^An? .+!$|^Ducks and geese!$/);
  assert.equal(observed.alert.eyebrow, 'On the hunt');
  assert.match(observed.alert.left || '', /^About \d+s left to answer\.$/, `the card counts nothing down: "${observed.alert.left}"`);
  assert.equal(observed.alert.glow, 'card-glow');
  assert.ok(observed.alert.mark && observed.alert.markNeed === 'sighting', `no "!" for the sighting on the hunter's row: ${JSON.stringify(observed.alert)}`);
  await shot(page, 'alert-1366');
  ok(`the sighting is an alert: the "!" on the hunter's row and the card "${observed.alert.title}" - "${observed.alert.words}" - ${observed.alert.left} - [${observed.alert.button}]`);

  await page.locator('#military-go').click();
  await page.waitForFunction(() => window.__huntAim?.open && window.__huntAim.sent === 'aim', null, { timeout: 5000 });
  assert.ok(app.state.world.entities[hunter].chore.ask.aim, 'the server never heard that the student began to aim');
  ok('the card\'s button opens the first-person field, and the server notes the aim begun on its own clock');
  await page.waitForFunction(() => window.__huntAim?.phase === 'running' && window.__huntAim.animal?.drawn && window.__huntAim.animal.x > 2 && window.__huntAim.animal.x < 14, null, { timeout: 8000 });
  await shot(page, 'running-1366');
  await stillPhase(page);
  await page.waitForTimeout(200);
  await shot(page, 'still-1366');
  observed.first = await page.evaluate(() => ({ path: window.__huntAim.path, animal: window.__huntAim.animal, sheet: window.__huntAim.sheet }));
  ok(`the ${observed.first.path.quarry} comes into the ${observed.first.path.cover} from the ${observed.first.path.dir > 0 ? 'left' : 'right'}, drawn from Astra's ${observed.first.sheet} sheet, and stops to look`);
  const before = { ...household('hh-1').resources };
  const target = await aimPoint(page, 60);
  assert.equal(target.phase, 'still');
  await page.mouse.move(target.x, target.y);
  await page.mouse.down(); await page.mouse.up();
  await page.waitForTimeout(280);
  await shot(page, 'smoke-1366');
  const first = await resultOf(page);
  await page.waitForTimeout(150);
  await shot(page, 'hit-1366');
  const judged = app.state.world.entities[hunter].chore?.shot;
  assert.equal(first.hit, true, `the shot put on the deer did not hit: ${JSON.stringify({ first, judged, fired: await page.evaluate(() => window.__huntAim.fired) })}`);
  assert.equal(judged?.hit, true, 'the page said hit and the server did not');
  ok(`clicked with the sights on it: the server judged a hit (aim ${JSON.stringify(judged.aim)} inside the body ${JSON.stringify(judged.body)}), and the field says "${await page.locator('#hunt-aim-verdict').textContent()}"`);
  await page.locator('#hunt-aim-done').click();
  await page.waitForFunction(() => !window.__huntAim.open);
  await page.waitForFunction(id => !window.__snapshot.world.entities.find(one => one.id === id)?.chore, hunter, { timeout: 60000 });
  const after = household('hh-1').resources;
  assert.equal(after.powder, before.powder - 1, `powder ${before.powder} -> ${after.powder}`);
  assert.ok(after.food > before.food, `no meat came home: food ${before.food} -> ${after.food}`);
  assert.equal((after.hides ?? 0), (before.hides ?? 0) + 1, 'no hide came home');
  const kill = app.state.world.events.filter(event => event.actorId === hunter).map(event => event.text).find(text => /brought down|could carry/.test(text));
  ok(`the kill came home as every hunt's does: one powder spent (${before.powder} -> ${after.powder}), food ${before.food.toFixed(1)} -> ${after.food.toFixed(1)}, a hide - "${kill}"`);

  // ------------------------------------------------------------------ 2. a miss with the keyboard at 1024x600, from the "!"
  await page.setViewportSize({ width: 1024, height: 600 });
  await huntUntilSighting(page, hunter);
  await page.waitForFunction(id => document.querySelector(`.panel-row[data-entity-id="${id}"] .panel-attention`)?.dataset.need === 'sighting', hunter, { timeout: 5000 });
  await shot(page, 'alert-1024');
  await page.locator(`.panel-row[data-entity-id="${hunter}"] .panel-attention`).click({ force: true });
  await page.waitForFunction(() => window.__huntAim?.open && window.__huntAim.sent === 'aim', null, { timeout: 5000 });
  ok('the "!" on the hunter\'s row opens the field as the card does');
  assert.equal(await page.evaluate(() => document.activeElement?.id), 'hunt-aim-field', 'the field did not take the keyboard');
  await page.waitForFunction(() => ['running', 'still'].includes(window.__huntAim?.phase), null, { timeout: 8000 });
  const powderBefore = household('hh-1').resources.powder, foodBefore = household('hh-1').resources.food;
  await page.keyboard.down('ArrowUp'); await page.waitForTimeout(1300); await page.keyboard.up('ArrowUp');
  const raised = await page.evaluate(() => window.__huntAim.sights);
  assert.ok(raised.y < 2.5, `the arrows did not raise the sights: ${JSON.stringify(raised)}`);
  await shot(page, 'aiming-keys-1024');
  // Every snapshot from here on is watched for the server's quarry marked as running (`fled`): a tick may take it off the map soon after.
  await page.evaluate(id => { window.__fledSeen = false; window.__fledWatch = setInterval(() => { if (window.__snapshot?.world.entities.find(one => one.id === id)?.chore?.quarry?.fled) window.__fledSeen = true; if ([...(window.__animationClips || [])].some(clip => /-bound$|-gallop$/.test(clip))) window.__boundSeen = true; }, 20); }, hunter);
  await page.keyboard.press('Space');
  const second1 = await resultOf(page);
  await page.waitForTimeout(250);
  await shot(page, 'miss-1024');
  const judged2 = app.state.world.entities[hunter].chore?.shot;
  assert.equal(second1.hit, false); assert.equal(judged2?.hit, false, 'the server judged the shot into the sky a hit');
  assert.equal(await page.evaluate(() => { clearInterval(window.__fledWatch); return window.__fledSeen; }), true, 'the deer that was missed did not run');
  ok(`the arrows raise the sights into the sky (${raised.y.toFixed(2)} units down the field) and Space fires: a miss, "${await page.locator('#hunt-aim-verdict').textContent()}" - "${await page.locator('#hunt-aim-words').textContent()}"`);
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !window.__huntAim.open);
  // On the map, the deer that was missed runs: the server's quarry is marked `fled`, and the page draws its bound.
  // Drawn under the field while it was open, and after it, until the hunter turned for home (the watch above saw every frame).
  const ran = await page.evaluate(() => Boolean(window.__boundSeen));
  assert.ok(ran, 'the deer that was missed was never drawn running on the map');
  await page.waitForFunction(id => !window.__snapshot.world.entities.find(one => one.id === id)?.chore, hunter, { timeout: 60000 });
  assert.equal(household('hh-1').resources.powder, powderBefore - 1, 'the missed shot did not spend its powder');
  // The family eats meanwhile: no more food than before, never a kill's worth.
  assert.ok(household('hh-1').resources.food <= foodBefore + 1e-9, 'a missed shot brought food home');
  assert.ok(app.state.world.events.some(event => event.actorId === hunter && /fired and missed/.test(event.text)), 'the miss was not written down');
  ok(`the missed deer runs away${ran ? ', drawn bounding on the map' : ''}: one powder spent, no food, and the journal says "fired and missed"`);

  // ------------------------------------------------------------------ 3. touch, with less motion, a second family
  const theirs = await second.evaluate(() => window.__snapshot.world.householdId);
  // A man or boy of the family: hunting is men's work, refused to a woman while a man is at home (sim/custom.mjs, docs/CUSTOMARY_WORK.md).
  const touchHunter = await second.evaluate(() => {
    const w = window.__snapshot.world;
    const male = one => (one.sex || { father: 'male', son: 'male' }[one.kin?.role]) === 'male';
    return w.entities.filter(one => one.householdId === w.householdId && one.kind === 'person' && male(one) && one.band !== 'child' && one.band !== 'small' && one.band !== 'infant').sort((a, b) => (b.skills?.hunting ?? 1) - (a.skills?.hunting ?? 1))[0].id;
  });
  for (let i = 0; i < 4; i++) { if (await second.locator('#tip:not([hidden]) .tip-close').isVisible().catch(() => false)) await second.locator('#tip .tip-close').tap(); await second.waitForTimeout(150); }
  await huntUntilSighting(second, touchHunter);
  // Nobody else hears of it: the first family's page and the Host's projection hold nothing of this sighting.
  const leaked = JSON.stringify(await page.evaluate(() => window.__snapshot.world));
  const hostView = JSON.stringify(projectWorld(app.state.world, null, 'host', { includeMap: false }));
  const seed = app.state.world.entities[touchHunter].chore.ask.sight.seed;
  assert.ok(!leaked.includes(seed) && !hostView.includes(seed), 'another family\'s page or the Host can read this family\'s sighting');
  ok('the first family\'s page and the Host\'s projection hold nothing of the second family\'s sighting');
  await second.waitForFunction(() => !document.querySelector('#military-notice').hidden && document.querySelector('#military-notice').dataset.accent === 'sighting', null, { timeout: 5000 });
  await second.locator('#military-go').tap();
  await second.waitForFunction(() => window.__huntAim?.open && window.__huntAim.sent === 'aim', null, { timeout: 5000 });
  assert.equal(app.state.world.entities[touchHunter].chore.ask.aim.calm, true, 'the page asking for less motion was not told to the server');
  await stillPhase(second);
  const calmPath = await second.evaluate(() => window.__huntAim.path);
  assert.equal(calmPath.hop, 0, 'the animal bounds on a page that asked for less motion');
  await shot(second, 'touch-calm-1024');
  const spot = await aimPoint(second, 160);
  await second.touchscreen.tap(spot.x, spot.y);
  await second.locator('#hunt-aim-fire').tap();
  const third = await resultOf(second);
  await second.waitForTimeout(200);
  await shot(second, 'touch-result-1024');
  const judged3 = app.state.world.entities[touchHunter].chore?.shot;
  const guessed = await second.evaluate(() => window.__huntAim.fired.guess);
  assert.equal(judged3?.hit, guessed, 'the server judged the touch shot differently from the page');
  assert.equal(third.hit, judged3.hit);
  ok(`by touch, with less motion (no bounding, a ${calmPath.goAt - calmPath.stopAt} ms stop, the sights wandering slower): touched onto it and *Fire* - the server judged it ${judged3.hit ? 'a hit' : 'a miss'}, as the page read it`);

  assert.deepEqual(errors, [], `page errors: ${errors.join(' | ')}`);
  ok('no page errors');
} finally {
  writeFileSync('docs/evidence/hunt-aim-browser.json', `${JSON.stringify({ proof: 'npm run test:hunt-aim', when: new Date().toISOString(), browser: await browser.version(), pass, observed, shots, errors,
    note: 'Same computer only: headless Chrome. Mouse at 1366x768, keyboard at 1024x600, touch with reduced motion at 1024x600. The class at the Quick pace.' }, null, 2)}\n`);
  await browser.close();
  await app.close();
}
console.log(`${pass.length} checks passed`);
