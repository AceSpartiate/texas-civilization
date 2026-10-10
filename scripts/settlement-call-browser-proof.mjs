// The settlement's call to arms, seen and not only said, in a real browser (triage 2026-09-29, 2.5; owner 2026-10-03: "visual cues
// over explanatory text"). The first big decision of the game had its card among the messages, but folded with "Keep playing" it was
// a small "!" again, and a student who pressed "Got it" on the tip by habit let it lapse in its five minutes.
//
// A class of the invented country, the first family on its land, the class paused, and the call put into the page's own snapshot and
// drawn (`window.__render`, as scripts/story-cards-browser-proof.mjs does): the call is drawn from the projection alone
// (public/military-attention.js `callCue`). Who is sent a call, and when, is the node tests' (tests/calls.test.mjs, tests/
// military-attention.test.mjs). Here, on the page: a beacon on the ground under each person who can answer, their "!" larger; their
// portraits beckoning on the family's panel; the edges of the screen warming once as it comes in, and not again for the same call; the
// card in its own accent; folded with "Keep playing", the messages still beckoning, where every other folded card is still; nothing of
// it for the army's request for supplies; and with reduced motion the beacon and the portraits still, the flash not at all. Nothing is
// held and nothing answered: the class stays paused and the call stays open throughout.
//
// Same computer only: headless Chrome at 1366x768 and 1024x600. Run: npm run test:settlement-call
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createClassroom } from '../server/app.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { familyRoll } from '../sim/family.mjs';
import { meetFamily } from './support/meet-family.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const pass = [], observed = {}, shots = [], errors = [];
const ok = label => { pass.push(label); console.log('PASS', label); };
mkdirSync('docs/evidence', { recursive: true });

// A family of at least two grown people, so the call has more than one to draw under.
const seed = (() => { for (let n = 0; n < 100000; n++) if (familyRoll(`settlement-call-${n}`, 'hh-1') >= 4) return `settlement-call-${n}`; throw new Error('no seed'); })();
const app = createClassroom({ seed, playerCount: 5, tickMs: 300, worldFactory: (s, count) => createGonzalesWorld(s, count) });
const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const shot = async (page, name, options = {}) => { const path = `docs/evidence/settlement-call-${name}.png`; await page.screenshot({ path, ...options }); shots.push(path); };
try {
  const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url);
  await page.locator('[name=name]').fill('Call reader');
  await page.locator('[name=code]').fill(app.state.sessionCode);
  await page.getByRole('button', { name: 'Join', exact: true }).click();
  await page.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-1');
  await meetFamily(page, 'Hollister');
  if (await page.locator('#wagon-done').isVisible()) await page.locator('#wagon-done').click();
  const host = await (await browser.newContext({ viewport: { width: 1366, height: 768 } })).newPage();
  host.on('pageerror', error => errors.push(`host: ${error.message}`));
  await host.goto(`${url}/host#${app.state.hostKey}`);
  await host.waitForFunction(() => window.__snapshot?.world.role === 'host');
  await host.getByRole('button', { name: 'Start' }).click();
  await host.waitForTimeout(400);
  if (app.state.world.status === 'lobby') await host.getByRole('button', { name: 'Start' }).click();
  await page.waitForFunction(() => window.__snapshot?.world.status === 'running' && !window.__snapshot.world.land?.arriving, null, { timeout: 90000 });
  await page.locator('#house-card').waitFor({ state: 'visible', timeout: 30000 });
  // Paused, so no tick draws over what is put into the page.
  await host.getByRole('button', { name: 'Pause' }).click();
  await page.waitForFunction(() => window.__snapshot?.world.status === 'paused');
  await page.evaluate(async () => { const { loadArt } = await import('/art.js'); await loadArt({ all: true }); });
  for (let i = 0; i < 4; i++) { if (await page.locator('#tip:not([hidden]) .tip-close').isVisible()) await page.locator('#tip .tip-close').click(); await page.waitForTimeout(200); }
  await page.locator('#selection-close').click({ timeout: 1000 }).catch(() => {});

  // The family's grown people, oldest first: the ones a call is put to.
  const grown = await page.evaluate(() => {
    const w = window.__snapshot.world;
    return w.entities.filter(one => one.householdId === w.householdId && one.kind === 'person' && (one.age ?? 30) >= 16).sort((x, y) => (y.age ?? 30) - (x.age ?? 30)).map(one => ({ id: one.id, name: one.name }));
  });
  assert.ok(grown.length >= 2, `the family has ${grown.length} grown people, so the beacon under more than one proves nothing`);
  const [first, second] = grown;
  // The call as the server projects it (sim/directors.mjs): its answerers, each with their own answers, and its time left.
  const callSet = (id, kind = 'call') => `w.request = { id: '${id}', kind: '${kind}', status: 'open', text: 'Volunteers are coming into Gonzales from every settlement. Does somebody from your family join them?', lapses: 'If nobody answers within a few minutes, the call lapses.', leftMs: 240000,
    answerers: { '${first.id}': [{ id: 'turn-out', label: 'Turn out', note: 'Takes 2 powder and the rifle.', can: true }, { id: 'stay', label: 'Stay home', note: '', can: true }], '${second.id}': [{ id: 'turn-out', label: 'Turn out', note: '', can: false, why: 'Only the men turn out.' }, { id: 'stay', label: 'Stay home', note: '', can: true }] },
    options: [{ id: 'turn-out', label: 'Turn out', note: '', can: true }] };`;
  const show = set => page.evaluate(set => {
    window.__cleanSnapshot ??= structuredClone(window.__snapshot);
    const base = structuredClone(window.__cleanSnapshot), w = base.world;
    delete w.request; delete w.encounter; delete w.battleAlert; delete w.battleAccount;
    // eslint-disable-next-line no-new-func
    if (set) new Function('w', set)(w);
    window.__render(base);
    return true;
  }, set);
  const read = () => page.evaluate(() => {
    const card = document.querySelector('#military-notice'), flash = document.querySelector('#call-flash');
    const rows = [...document.querySelectorAll('#family-panel .panel-row')].map(row => ({ id: row.dataset.entityId || row.dataset.id || '', called: row.dataset.called, beckon: getComputedStyle(row.querySelector('.panel-portrait')).animationName }));
    return { beacons: window.__callBeacons || [], marks: window.__viewMarks || [], rows, flash: { hidden: flash.hidden, animation: getComputedStyle(flash).animationName, pointer: getComputedStyle(flash).pointerEvents, at: window.__callFlash || null },
      card: { hidden: card.hidden, call: card.dataset.call || null, accent: card.dataset.accent, open: !document.querySelector('#military-message').hidden, glow: getComputedStyle(card).animationName, title: document.querySelector('#military-title').textContent },
      status: window.__snapshot.world.status, request: window.__snapshot.world.request?.status || null };
  });
  const calledRows = seen => seen.rows.filter(row => row.called === 'true');

  // ------------------------------------------------------------------ before: nothing of it
  await show(null);
  await page.waitForTimeout(500);
  observed.before = await read();
  assert.deepEqual(observed.before.beacons, [], 'a beacon was drawn with no call open');
  assert.deepEqual(calledRows(observed.before), [], 'a portrait beckoned with no call open');
  assert.equal(observed.before.flash.hidden, true, 'the screen\'s edges were lit with no call open');
  ok('with no call open: no beacon, no portrait beckoning, no flash');

  // ------------------------------------------------------------------ the call comes in
  await show(callSet('call-proof'));
  await page.waitForTimeout(650);
  observed.arrives = await read();
  await shot(page, 'arrives');
  assert.equal(observed.arrives.flash.hidden, false, 'the screen\'s edges did not light as the call came in');
  assert.equal(observed.arrives.flash.animation, 'call-flash');
  assert.equal(observed.arrives.flash.pointer, 'none', 'the flash takes the pointer');
  assert.equal(observed.arrives.flash.at?.id, 'call-proof');
  ok('as the call comes in, the edges of the screen warm (call-flash), taking no pointer');
  // The flash fades by itself.
  await page.waitForFunction(() => document.querySelector('#call-flash').hidden, null, { timeout: 6000 });
  observed.open = await read();
  await shot(page, 'open');
  assert.equal(observed.open.card.hidden, false); assert.equal(observed.open.card.open, true, 'the call\'s card came up folded');
  assert.equal(observed.open.card.accent, 'call'); assert.equal(observed.open.card.call, 'open');
  assert.equal(observed.open.card.glow, 'card-glow');
  // Only under who can go (owner, 2026-10-09: the play-through found the call's "!" on a mother who "does not go"): the first may turn out,
  // the second may only stay ("Only the men turn out."), and carries neither beacon nor "!" (public/family-panel.js `answersRequest`).
  assert.deepEqual(observed.open.beacons.map(one => one.id).sort(), [first.id], `the beacons stand under ${observed.open.beacons.map(one => one.id).join(', ')}, not under the one who can go`);
  assert.ok(observed.open.beacons.every(one => one.x > 0 && one.x < 1366 && one.y > 0 && one.y < 768), `a beacon is off the screen: ${JSON.stringify(observed.open.beacons)}`);
  // Never as small as the figures it stands under: the family framed on its land is drawn a dozen pixels high.
  assert.ok(observed.open.beacons.every(one => one.reach >= 60 && one.reach >= one.size * 2), `a beacon spreads only ${JSON.stringify(observed.open.beacons)} - the small "!" again`);
  assert.deepEqual(calledRows(observed.open).map(row => row.beckon), ['call-beckon'], `the portrait of the one who can go does not beckon alone: ${JSON.stringify(observed.open.rows)}`);
  assert.ok(observed.open.rows.filter(row => row.called !== 'true').every(row => row.beckon !== 'call-beckon'), 'somebody who cannot answer beckons');
  ok(`the call open: its card (${observed.open.card.title}), a beacon under ${first.name}, who may go, and that portrait beckoning; none under ${second.name}, who may not; the flash gone by itself`);
  // A close look at the beacon under the first.
  const under = observed.open.beacons.find(one => one.id === first.id);
  await shot(page, 'beacon', { clip: { x: Math.max(0, under.x - 140), y: Math.max(0, under.y - 170), width: 280, height: 240 } });

  // The same call again on the next render: the flash is not lit twice.
  await show(callSet('call-proof'));
  await page.waitForTimeout(400);
  observed.again = await read();
  assert.equal(observed.again.flash.hidden, true, 'the flash lit again for the same call');
  assert.equal(observed.again.flash.at?.at, observed.arrives.flash.at?.at, 'the flash was begun again for the same call');
  ok('the same call drawn again: the edges stay as they are - the flash is once for each call');

  // ------------------------------------------------------------------ folded with "Keep playing"
  await page.locator('#military-toggle').click();
  await page.waitForTimeout(400);
  observed.folded = await read();
  await shot(page, 'folded');
  assert.equal(observed.folded.card.open, false, '"Keep playing" did not fold the card');
  assert.equal(observed.folded.card.glow, 'call-beckon', `folded, the call's messages are still (${observed.folded.card.glow})`);
  assert.equal(observed.folded.beacons.length, 1, 'folding the card took the beacon away');
  // Another kind, folded, is still as it was: a rider's card.
  await show(`w.encounter = { id: 'enc-proof', status: 'open', listenerId: '${first.id}', carrierName: 'Silas Roe' };`);
  await page.waitForTimeout(400);
  if (await page.locator('#military-message').isVisible()) await page.locator('#military-toggle').click();
  await page.waitForTimeout(300);
  observed.foldedRider = await read();
  assert.equal(observed.foldedRider.card.open, false);
  assert.equal(observed.foldedRider.card.glow, 'none', `a folded rider's card beckons (${observed.foldedRider.card.glow}): only the call does`);
  assert.deepEqual(observed.foldedRider.beacons, [], 'a rider was drawn as the call');
  ok('folded with "Keep playing", the call\'s messages go on beckoning and its beacons stay; a folded rider\'s card is still, as before');

  // ------------------------------------------------------------------ the army's request for supplies: its card alone
  await show(callSet('supply-proof', 'supply'));
  await page.waitForTimeout(600);
  observed.supply = await read();
  assert.deepEqual(observed.supply.beacons, [], 'the army\'s request for supplies was drawn as the call to arms');
  assert.deepEqual(calledRows(observed.supply), [], 'the portraits beckoned for the army\'s request for supplies');
  assert.equal(observed.supply.flash.hidden, true, 'the flash lit for the army\'s request for supplies');
  assert.equal(observed.supply.card.call, null);
  ok('the army\'s request for supplies: its card and "!", and none of the call\'s beacon, beckoning or flash');

  // ------------------------------------------------------------------ a Chromebook's smaller screen
  await page.setViewportSize({ width: 1024, height: 600 });
  await show(callSet('call-proof-small'));
  await page.waitForFunction(() => document.querySelector('#call-flash').hidden, null, { timeout: 6000 });
  observed.small = await read();
  await shot(page, 'open-1024x600');
  assert.equal(observed.small.beacons.length, 1, 'at 1024x600 the beacon was not drawn under the one who can go');
  assert.ok(observed.small.beacons.every(one => one.x > 0 && one.x < 1024 && one.y > 0 && one.y < 600), `at 1024x600 a beacon is off the screen: ${JSON.stringify(observed.small.beacons)}`);
  ok('at 1024x600 the call\'s beacons stand on the screen, and the flash came and went for the new call');

  // ------------------------------------------------------------------ reduced motion
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await show(callSet('call-proof-still'));
  await page.waitForTimeout(600);
  observed.still = await read();
  await shot(page, 'reduced-motion');
  assert.equal(observed.still.flash.hidden, true, 'with reduced motion the screen\'s edges flashed');
  assert.equal(observed.still.beacons.length, 1, 'with reduced motion the beacon was not drawn at all');
  assert.ok(calledRows(observed.still).every(row => row.beckon === 'none'), 'with reduced motion the portraits still move');
  ok('with reduced motion: the beacons drawn still, the portraits ringed and still, no flash');

  // Nothing was held or answered: the page only drew.
  assert.equal(observed.still.status, 'paused');
  assert.equal(app.state.world.status, 'paused', 'the class moved while the call was drawn');
  assert.deepEqual(errors, [], `page errors: ${errors.join('; ')}`);
  ok('no page errors, and the class still paused: the cue holds nothing and answers nothing');
} finally {
  writeFileSync('docs/evidence/settlement-call-browser.json', `${JSON.stringify({ proof: 'npm run test:settlement-call', when: new Date().toISOString(), pass, observed, shots, errors, note: 'Same computer only: headless Chrome at 1366x768 and 1024x600. The call drawn from a projection put into the paused page (window.__render); who is sent a call is the node tests\'. No Chromebook, LAN or classroom.' }, null, 2)}\n`);
  await browser.close();
  await app.close();
}
console.log(`${pass.length} checks passed`);
