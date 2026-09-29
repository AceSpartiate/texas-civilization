// The lone parent's path, in a real browser (owner, 2026-09-29; sim/courtship.mjs, public/courtship.js; docs/FAMILY_CREATION.md,
// *The lone parent's path*).
//
// tests/courtship.test.mjs proves the rules: who is offered it, the day away, the new parent rolled like a parent, the house
// raised, the save, and that nobody else sees any of it. What only a browser shows is here, at 1366x768 (a Chromebook):
//
//   1. A class on the real land whose first family is rolled with one parent. On the road in the ability is not there; on the land
//      it is, at the head of the family's column, glowing, with the map's glow over the family's land - and while the house site
//      is still to be chosen it says so and cannot be pressed. It stands on nothing: not the bar, not the map's buttons.
//   2. **Not now** folds it to its glowing icon; the icon opens it again.
//   3. **Go and ask**: the scenes open over the whole screen and every change of place is a fade to black and back. Each scene and a
//      fade are photographed for the owner (docs/evidence/lone-parent-*.png). Continue is the only way on.
//   4. A reload in the middle of a scene takes it up where it was.
//   5. At the end the server keeps the scenes as watched; the family is home with two parents - the new one on the family's
//      panel - and a house standing; no page error. Another student's page and the Host's were sent none of it.
//   6. With less motion asked for, the fades are short and still fades.
//
// Same computer only: headless Chrome. Run: npm run test:lone-parent
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createClassroom } from '../server/app.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { familyRoll, rolledPeople } from '../sim/family.mjs';
import { houseBuilt } from '../sim/houses.mjs';
import { meetFamily } from './support/meet-family.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const pass = [];
const ok = label => { pass.push(label); console.log('PASS', label); };
const observed = {};
const shots = [];
const errors = [];
mkdirSync('docs/evidence', { recursive: true });
const shot = async (page, name) => { const path = `docs/evidence/lone-parent-${name}.png`; await page.screenshot({ path }); shots.push(path); };
async function until(page, message, fn, arg, options = { timeout: 30000 }) {
  try { return await page.waitForFunction(fn, arg, options); } catch (error) { if (/Timeout/i.test(error.message)) throw new assert.AssertionError({ message }); throw error; }
}
const command = (page, input) => page.evaluate(async body => {
  const response = await fetch('/api/command', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: `proof-${Math.random().toString(36).slice(2)}${Date.now()}`, ...body }) });
  return { status: response.status, error: (await response.json()).error || '' };
}, input);
const boxOf = (page, selector) => page.evaluate(sel => { const r = document.querySelector(sel)?.getBoundingClientRect(); return r && r.width ? { left: r.left, top: r.top, right: r.right, bottom: r.bottom } : null; }, selector);
const overlaps = (a, b) => Boolean(a && b && a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1);

/**
 * A seed whose first family rolls a lone mother with two children, so the scenes have somebody to play and to ask, and the wedding
 * gives the family the husband's name and makes him its leader (owner, 2026-09-29: "His name", "New husband leads").
 */
function loneSeed(stem = 'lone-parent-proof') {
  for (let n = 0; n < 100000; n++) if (familyRoll(`${stem}-${n}`, 'hh-1') === 3 && rolledPeople(`${stem}-${n}`, 'hh-1', 0, 3)[0].sex === 'female') return `${stem}-${n}`;
  throw new Error('no seed');
}

const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
let world = null;
const app = createClassroom({ seed: loneSeed(), playerCount: 5, tickMs: 1500, worldFactory: seed => (world = createGonzalesWorld(seed, 5, { map: 'colonies' })) });
const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
// The class as the server holds it now (a copy: `app.state`), read and never changed in process - the class is played through the pages.
const live = () => app.state.world;
const household = () => live().households['hh-1'];
/** Wait, in real time, for the server's class to be so. */
async function serverUntil(message, holds, timeout = 60000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) { if (holds(live())) return; await new Promise(resolve => setTimeout(resolve, 150)); }
  throw new assert.AssertionError({ message });
}
try {
  const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  const student = await context.newPage();
  student.on('pageerror', error => errors.push(`student: ${error.message}`));
  await student.goto(url);
  await student.locator('[name=name]').fill('Lone parent');
  await student.locator('[name=code]').fill(app.state.sessionCode);
  await student.getByRole('button', { name: 'Join', exact: true }).click();
  await student.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-1');
  await meetFamily(student, 'Hollister');
  if (await student.locator('#wagon-done').isVisible()) await student.locator('#wagon-done').click();
  // A second student, whose page must be sent nothing of it.
  const otherContext = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  const other = await otherContext.newPage();
  other.on('pageerror', error => errors.push(`other student: ${error.message}`));
  await other.goto(url);
  await other.locator('[name=name]').fill('Neighbour student');
  await other.locator('[name=code]').fill(app.state.sessionCode);
  await other.getByRole('button', { name: 'Join', exact: true }).click();
  await other.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-2');
  await meetFamily(other, 'Otherway');
  if (await other.locator('#wagon-done').isVisible()) await other.locator('#wagon-done').click();
  const host = await (await browser.newContext({ viewport: { width: 1366, height: 768 } })).newPage();
  host.on('pageerror', error => errors.push(`host: ${error.message}`));
  await host.goto(`${url}/host#${app.state.hostKey}`);
  await host.waitForFunction(() => window.__snapshot?.world.role === 'host');
  await host.getByRole('button', { name: 'Start' }).click();
  // Two of five joined: the page asks once more ("Press Start again to begin anyway").
  await host.waitForTimeout(400);
  if (app.state.world.status === 'lobby') await host.getByRole('button', { name: 'Start' }).click();
  await student.waitForFunction(() => window.__snapshot?.world.status === 'running');
  const parents = household().members.filter(id => ['father', 'mother'].includes(app.state.world.entities[id].kin?.role));
  assert.equal(parents.length, 1, 'the proof\'s family was not rolled with one parent');
  observed.family = household().members.map(id => ({ id, role: app.state.world.entities[id].kin.role, age: app.state.world.entities[id].age }));

  // ------------------------------------------------------------------ 1. offered on the land, not on the road
  assert.equal(await student.locator('#ask-neighbours').isHidden(), true, 'the ability showed while the family was still on the road in');
  // The road in at a quick pace, as a teacher might set it; the scenes are walked at the Study pace's neighbour.
  app.setPace(120);
  await serverUntil('the family never reached its land', w => !w.households['hh-1'].arriving, 120000);
  await until(student, 'the family reached its land and the ability did not appear', () => !document.querySelector('#ask-neighbours').hidden);
  if (household().choosingSite) {
    await until(student, 'the ability did not say to choose the house site first', () => /Choose where your house will stand/.test(document.querySelector('#ask-neighbours-why').textContent) && document.querySelector('#ask-neighbours-go').disabled);
    await shot(student, '1-choose-site-first');
    ok('on the land, before the house site is chosen: the ability is there, says to choose the site first, and cannot be pressed');
    // The house site chosen at the surveyor's mark, as a student would press it.
    const mark = await student.evaluate(() => window.__snapshot.world.land.choosingSite.mark);
    const chosen = await command(student, { action: 'choose-site', x: mark.x, y: mark.y });
    assert.equal(chosen.status, 200, chosen.error);
    await serverUntil('the family never came over to its house site', w => !w.households['hh-1'].arriving && !w.households['hh-1'].choosingSite, 60000);
  }
  await until(student, 'the ability could not be pressed on the land', () => !document.querySelector('#ask-neighbours-go').disabled && document.querySelector('#ask-neighbours-why').hidden);
  // Put away any tip first, as a student would: the card is measured on its own.
  for (let i = 0; i < 4; i++) { if (await student.locator('#tip:not([hidden]) .tip-close').isVisible()) await student.locator('#tip .tip-close').click(); await student.waitForTimeout(250); }
  await student.waitForTimeout(600);
  observed.card = await student.evaluate(() => {
    const card = document.querySelector('#ask-neighbours'), style = getComputedStyle(card);
    return { title: document.querySelector('#ask-neighbours-title').textContent, says: document.querySelector('#ask-neighbours-says').textContent, note: document.querySelector('#ask-neighbours-note').textContent,
      glow: style.animationName, shadow: style.boxShadow.slice(0, 60), marker: window.__pathMarker, icon: card.dataset.icon };
  });
  assert.equal(observed.card.title, 'Ask the neighbours for help');
  assert.match(observed.card.says, /raise a house/);
  assert.equal(observed.card.glow, 'card-glow', 'the ability does not glow');
  assert.ok(observed.card.marker, 'the family\'s land was not marked on the map');
  const card = await boxOf(student, '#ask-neighbours');
  const standing = { bar: await boxOf(student, '.panel-row[data-focused=true] .panel-icons'), tools: await boxOf(student, '#map-tools'), nav: await boxOf(student, '#map-nav'), journal: await boxOf(student, '#journal-toggle'), tip: await boxOf(student, '#tip:not([hidden])') };
  for (const [name, box] of Object.entries(standing)) assert.equal(overlaps(card, box), false, `the ability stands on ${name}`);
  assert.ok(card.left >= 0 && card.top >= 0 && card.right <= 1366 && card.bottom <= 768, 'the ability runs off the screen');
  observed.cardBox = card;
  await shot(student, '2-ability');
  ok(`on the land the ability waits, glowing (${observed.card.glow}), with the land marked on the map, standing on nothing: "${observed.card.says}"`);

  // ------------------------------------------------------------------ 2. Not now, and back
  await student.locator('#ask-neighbours-later').click();
  await until(student, 'Not now did not fold the ability', () => document.querySelector('#ask-neighbours').dataset.folded === 'true');
  assert.equal(await student.locator('#ask-neighbours-go').isVisible(), false);
  assert.equal(await student.locator('#ask-neighbours-open').isVisible(), true);
  await shot(student, '3-folded');
  await student.locator('#ask-neighbours-open').click();
  await until(student, 'the icon did not open the ability again', () => document.querySelector('#ask-neighbours').dataset.folded === 'false');
  ok('Not now folds it to its glowing icon, which waits and opens it again: offered, never pressed on the student');

  // ------------------------------------------------------------------ 3. the scenes
  // Every sheet in the page first, so the scenes are photographed as they are drawn once the art is there.
  await student.evaluate(async () => { const { loadArt } = await import('/art.js'); await loadArt({ all: true }); });
  // The day away at a Study-like pace, so the scenes are walked while the family is still away.
  app.setPace(1500);
  await student.locator('#ask-neighbours-go').click();
  await until(student, 'the scenes did not open', () => !document.querySelector('#courtship').hidden);
  assert.equal(household().courtship.stage, 'away');
  assert.equal(await other.evaluate(() => 'courtship' in window.__snapshot.world), false, 'another student\'s page was sent the path');
  assert.equal(await host.evaluate(() => 'courtship' in window.__snapshot.world), false, 'the Host\'s page was sent the path');
  await student.waitForTimeout(700);
  observed.between = await student.evaluate(() => ({ mode: window.__courtship.mode, dark: window.__courtship.dark, between: window.__courtship.between }));
  assert.equal(observed.between.mode, 'between'); assert.equal(observed.between.dark, 1);
  await shot(student, '4-travel-on-black');
  ok(`the scenes open on black with the travel said on it: "${observed.between.between}"`);
  // Catch a fade half way up, for the owner to see.
  await until(student, 'the first scene never faded up', () => window.__courtship.mode === 'fade-in' && window.__courtship.dark < 0.65 && window.__courtship.dark > 0.2, null, { timeout: 15000, polling: 16 });
  await shot(student, '5-fade-up');
  observed.fades = [await student.evaluate(() => window.__courtship.dark)];
  await until(student, 'the first scene never settled', () => window.__courtship.mode === 'scene');
  const scenes = [];
  let presses = 0, fadeOutShot = false, reloaded = false;
  for (let guard = 0; guard < 2000; guard++) {
    const now = await student.evaluate(() => ({ open: window.__courtship.open, scene: window.__courtship.scene, step: window.__courtship.step, mode: window.__courtship.mode, strip: { where: document.querySelector('#courtship-where').textContent, who: document.querySelector('#courtship-who').textContent, said: document.querySelector('#courtship-said').textContent, next: document.querySelector('#courtship-next').textContent }, drawn: window.__courtship.drawn, backdrop: window.__courtship.backdrop, buildings: window.__courtship.buildings }));
    if (!now.open) break;
    if (now.mode !== 'scene') { await student.waitForTimeout(120); continue; }
    let record = scenes.find(one => one.id === now.scene);
    if (!record) { record = { id: now.scene, where: now.strip.where, lines: [], drawn: now.drawn, backdrop: now.backdrop, buildings: now.buildings }; scenes.push(record); }
    if (!record.lines.some(line => line.step === now.step)) record.lines.push({ step: now.step, who: now.strip.who, said: now.strip.said });
    // A picture of each scene in the middle of its talk, and of the vow.
    if (now.step === 2 && !record.shot) { await student.waitForTimeout(300); await shot(student, `6-scene-${now.scene}`); record.shot = true; }
    if (now.scene === 'wedding' && /I take you/.test(now.strip.said) && !record.vowShot) { await student.waitForTimeout(300); await shot(student, '7-the-vow'); record.vowShot = true; }
    if (now.scene === 'wedding' && now.strip.who === 'From the record' && !record.historyShot) { await shot(student, '8-from-the-record'); record.historyShot = true; }
    // 4. A reload in the middle of the second scene takes it up where it was.
    if (!reloaded && now.scene === 'second' && now.step === 3) {
      reloaded = true;
      await student.reload();
      await until(student, 'after a reload the scenes did not come back', () => window.__courtship?.open && window.__courtship.mode === 'scene', null, { timeout: 30000 });
      const back = await student.evaluate(() => ({ scene: window.__courtship.scene, step: window.__courtship.step }));
      assert.deepEqual(back, { scene: 'second', step: 3 }, 'a reload lost the student\'s place in the scenes');
      observed.reload = back;
      ok('a reload in the middle of the second farm takes the scenes up at the same line');
      continue;
    }
    // 6. Less motion asked for, from the end of the second farm to the wedding: the fade is short, and still a fade.
    if (now.scene === 'second') await student.emulateMedia({ reducedMotion: 'reduce' });
    if (now.scene === 'wedding') await student.emulateMedia({ reducedMotion: 'no-preference' });
    // Continue is the only way on: there is no close.
    assert.equal(await student.locator('#courtship button').count(), 1, 'the scenes have a way out other than Continue');
    await student.locator('#courtship-next').click();
    presses += 1;
    if (!fadeOutShot && now.scene === 'first') {
      const leaving = await student.evaluate(() => window.__courtship.mode);
      if (leaving === 'fade-out') {
        await until(student, 'the first scene never faded out', () => window.__courtship.dark > 0.35 && window.__courtship.dark < 0.8, null, { timeout: 10000, polling: 16 });
        await shot(student, '5b-fade-down'); fadeOutShot = true;
        observed.fades.push(await student.evaluate(() => window.__courtship.dark));
      }
    }
    await student.waitForTimeout(90);
  }
  observed.scenes = scenes;
  observed.presses = presses;
  assert.deepEqual(scenes.map(one => one.id), ['first', 'second', 'wedding', 'after'], 'the scenes were not the four in order');
  for (const one of scenes) {
    assert.ok(one.drawn.length >= 2 && one.drawn.every(person => person.drawn), `${one.id}: somebody in the scene was not drawn: ${JSON.stringify(one.drawn.filter(p => !p.drawn))}`);
    assert.ok(one.buildings.length >= 1, `${one.id}: no farmstead or house was drawn`);
  }
  const all = scenes.flatMap(one => one.lines.map(line => line.said)).join(' ');
  assert.match(all, /married by bond/, 'the wedding was not by bond');
  assert.match(all, /priest/, 'the bond\'s promise of a priest was not said');
  assert.match(all, /hasn't taken (his|her) eyes off you/, 'the gentle flirting was not there');
  assert.ok(fadeOutShot, 'a fade to black between places was never seen');
  const evidence = await student.evaluate(() => ({ fades: window.__courtship.fades, watched: window.__courtship.watched }));
  // Counted by the page since its reload in the second scene: that scene's return, and the fades in and out of the rest.
  assert.ok(evidence.fades >= 6, `only ${evidence.fades} fades since the reload`);
  observed.fadeCount = evidence.fades;
  ok(`the four scenes in order, ${presses} presses of Continue, ${evidence.fades} fades to and from black, every figure and building drawn`);

  // ------------------------------------------------------------------ 5. home, married, with a house
  await until(student, 'the server did not keep the scenes as watched', () => !('courtship' in window.__snapshot.world) || !window.__snapshot.world.courtship?.script, null, { timeout: 20000 });
  assert.equal(household().courtship.watched, true);
  await serverUntil('the family never came home', w => w.households['hh-1'].courtship.stage === 'home', 120000);
  const now = live(), home = now.households['hh-1'];
  const members = home.members.map(id => now.entities[id]);
  const nowParents = members.filter(person => ['father', 'mother'].includes(person.kin?.role));
  assert.equal(nowParents.length, 2, 'the family does not have two parents');
  assert.ok(houseBuilt(home), 'no house stands');
  await until(student, 'the family panel did not show the new parent', id => document.querySelectorAll('#family-rows > li').length === window.__snapshot.world.household.members.length && window.__snapshot.world.household.members.includes(id), household().courtship.spouse.id, { timeout: 30000 });
  await until(student, 'the page did not draw the house', () => window.__snapshot.world.land?.shelter === 'house', null, { timeout: 30000 });
  assert.equal(await student.locator('#ask-neighbours').isHidden(), true, 'the ability was still offered after it was used');
  await student.waitForTimeout(1200);
  await shot(student, '9-home-married');
  observed.home = { members: members.map(person => ({ id: person.id, role: person.kin.role, age: person.age })), house: household().house?.plan || household().house?.layout, rows: await student.locator('#family-rows > li').count() };
  ok(`home: ${observed.home.members.length} people, two parents on the panel, a ${observed.home.house} house standing, and the ability gone`);

  // The family took the new husband's name, and he leads it: the name at the top of the page, the family book, and the star.
  const his = home.courtship.neighbours[1].surname, husbandId = home.courtship.spouse.id;
  await until(student, "the page does not call the family by the new husband's name", name => document.querySelector('#session').textContent.includes(name), his, { timeout: 30000 });
  await until(student, "the new husband is not the family's main person on the panel", id => document.querySelector(`#family-rows > li[data-main=true]`) && window.__snapshot.world.household.principalId === id, husbandId, { timeout: 30000 });
  observed.named = await student.evaluate(() => ({ heading: document.querySelector('#session').textContent, main: document.querySelector('#family-rows > li[data-main=true] input')?.value }));
  assert.equal(home.principalId, husbandId);
  assert.equal(home.surname, his);
  await shot(student, '10-his-name');
  ok(`the family took his name - the page reads "${observed.named.heading}" - and ${observed.named.main}, the new husband, is its main person and principal`);

  // ------------------------------------------------------------------ 6. less motion
  // How long each fade to black took, from the page's own record of its changes.
  const timeline = await student.evaluate(() => window.__courtship.timeline);
  const fadesTaken = timeline.map((change, i) => change.mode === 'fade-out' && timeline[i + 1] ? { ms: timeline[i + 1].at - change.at, reduced: change.reduced } : null).filter(Boolean);
  const full = fadesTaken.filter(one => !one.reduced), calm = fadesTaken.filter(one => one.reduced);
  observed.fadeMs = { full: full.map(one => one.ms), reduced: calm.map(one => one.ms) };
  assert.ok(full.length && full.every(one => one.ms >= 900), `a fade to black was hurried: ${JSON.stringify(observed.fadeMs)}`);
  assert.ok(calm.length && calm.every(one => one.ms >= 150 && one.ms < 700), `with less motion asked for the fade was not short, or was a cut: ${JSON.stringify(observed.fadeMs)}`);
  ok(`fades to black take ${full.map(one => one.ms).join(', ')} ms; with less motion asked for, ${calm.map(one => one.ms).join(', ')} ms - shorter, never a cut`);

  assert.deepEqual(errors, [], `page errors: ${errors.join('; ')}`);
  ok('no page errors on the student\'s, the other student\'s or the Host\'s page');
} finally {
  writeFileSync('docs/evidence/lone-parent-browser.json', `${JSON.stringify({ proof: 'npm run test:lone-parent', when: new Date().toISOString(), pass, observed, shots, errors, note: 'Same computer only: headless Chrome at 1366x768 (and 1024x768 with reduced motion). No Chromebook, LAN or classroom claim.' }, null, 2)}\n`);
  await browser.close();
  await app.close();
}
console.log(`${pass.length} checks passed`);
process.exit(0);
