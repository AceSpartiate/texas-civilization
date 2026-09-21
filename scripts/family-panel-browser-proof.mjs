// The family panel, in a real browser: docs/FAMILY_PANEL.md (owner, 2026-09-15).
//
// tests/family-panel.test.mjs proves the rules against the simulation: the order of the rows, an icon and one sentence for
// every action, the glow following the projection, and nothing sent that the server does not already take. What only a
// browser can show is that a student actually gets it: the rows down the left in that order, the popup on hover, an icon
// pressed setting somebody to work and glowing until the server says they are done, a portrait taking the camera to its
// person, and every name changed without a button and still there after a reload. And that on a phone it leaves the map.
//
// Run: npm run test:family-panel
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createClassroom } from '../server/app.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { meetFamily } from './support/meet-family.mjs';
// docs/FAMILY_PANEL.md §12 (owner, 2026-09-21): a person's work is on the screen only while they are the family's main
// person, so this proof chooses them first, as a student does.
import { asMain } from './support/main-person.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const pass = [];
const ok = label => { pass.push(label); console.log('PASS', label); };
const measured = {};

// This seed rolls both parents and four children, so the order has something to prove. A quick tick, because the family
// drives in and practises at the mark before the glow can go out; not so quick the class ends while names are typed.
const app = createClassroom({ seed: 'panel-3', playerCount: 5, tickMs: 250, worldFactory: createGonzalesWorld });
const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const errors = [];
const post = async (path, body, cookie) => {
  const response = await fetch(url + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(cookie && { Cookie: cookie }) }, body: JSON.stringify(body) });
  assert.equal(response.status, 200, `${path}: ${response.status}`);
  return response;
};
mkdirSync('test-results', { recursive: true });

try {
  const host = await post('/api/host', { key: app.state.hostKey });
  const hostCookie = host.headers.get('set-cookie').split(';')[0];
  const context = await browser.newContext({ reducedMotion: 'no-preference', viewport: { width: 1440, height: 950 } });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));

  await page.goto(url);
  await page.locator('[name=name]').fill('Panel reader');
  await page.locator('[name=code]').fill(app.state.sessionCode);
  await page.getByRole('button', { name: 'Join', exact: true }).click();
  await page.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-1');
  for (let i = 2; i <= 5; i++) await post('/api/join', { name: `Reader ${i}`, code: app.state.sessionCode });

  // The die first, as a student does; the panel waits for it.
  assert.equal(await page.locator('#family-panel').isHidden(), true, 'the panel offers people the roll is about to replace');
  // The title screen comes first (public/creation.js, owner 2026-09-17): Begin, then the die.
  await page.locator('#creation-begin-button').waitFor({ state: 'visible', timeout: 30000 });
  await page.locator('#creation-begin-button').click();
  await page.locator('#roll-family').click();
  await page.waitForFunction(() => document.querySelector('#roll-family')?.textContent === 'Meet your family', null, { timeout: 15000 });
  await page.locator('#roll-family').click();
  // "Meet your family" opens the family book; this proof is about the panel, so the book is put away.
  // The family's last name and how the parents look, asked for after the roll (owner, 2026-09-17).
  await meetFamily(page);
  if (await page.locator('#wagon-done').isVisible()) await page.locator('#wagon-done').click();
  if (await page.locator('#tutorial-skip').isVisible()) await page.locator('#tutorial-skip').click();
  await page.locator('#family-panel').waitFor({ state: 'visible' });

  // ------------------------------------------------------------------------------------------------------------ the order
  const family = await page.evaluate(async () => (await (await fetch('/api/family')).json()).family);
  await page.waitForFunction(count => document.querySelectorAll('#family-rows .panel-row').length === count, family.people.length);
  const book = new Map(family.people.map(person => [person.id, person]));
  const rows = (await page.locator('#family-rows .panel-row').evaluateAll(items => items.map(item => item.dataset.entityId))).map(id => book.get(id));
  measured.order = rows.map(person => `${person.role} ${person.age}`);
  assert.deepEqual(rows.slice(0, 2).map(person => person.role), ['father', 'mother'], `rows: ${measured.order}`);
  const childAges = rows.slice(2).map(person => person.age);
  assert.ok(childAges.length >= 2, 'this seed was chosen for its children');
  assert.deepEqual(childAges, [...childAges].sort((a, b) => b - a), `children not oldest first: ${childAges}`);
  ok(`the rows are father, mother, then the children oldest first: ${measured.order.join(', ')}`);
  const panelBox = await page.locator('#family-panel').boundingBox();
  assert.ok(panelBox.x < 40, `the panel is not on the left: ${JSON.stringify(panelBox)}`);
  ok(`down the left of the map (x ${Math.round(panelBox.x)}, ${Math.round(panelBox.width)} by ${Math.round(panelBox.height)})`);

  // ------------------------------------------------------------------- the icons and marks are drawn art, not glyphs or type
  // docs/ART_REQUESTS.md, "Claude-drawn stand-ins": every icon names an `icon-<key>` frame and the marks `mark-*` frames, from
  // the separate claude-standins library until Astra's replace them. Wait for the sheets, then read the canvases.
  await page.waitForFunction(async () => {
    const art = await import('/art.js');
    return ['icon-rest', 'mark-main', 'mark-need'].every(name => art.hasSprite(name));
  }, null, { timeout: 15000 });
  await page.waitForFunction(() => document.querySelector('.panel-focus[data-drawn=true]'));
  const drawn = await page.evaluate(async () => {
    const art = await import('/art.js');
    const painted = canvas => { const ctx = canvas.getContext('2d'); const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data; let n = 0; for (let i = 3; i < data.length; i += 4) if (data[i] > 24) n++; return n; };
    const icons = [...document.querySelectorAll('.panel-icon')].map(icon => ({ key: icon.dataset.key, frame: art.spriteFrame(`icon-${icon.dataset.key}`), painted: painted(icon.querySelector('canvas')) }));
    const marks = [...document.querySelectorAll('[data-mark]')].map(node => ({ mark: node.dataset.mark, drawn: node.dataset.drawn, painted: painted(node.querySelector('canvas')), text: getComputedStyle(node.querySelector('.panel-mark-text')).display }));
    return { icons, marks };
  });
  for (const icon of drawn.icons) {
    assert.ok(icon.frame, `${icon.key}: no icon-${icon.key} frame in either library`);
    assert.ok(icon.painted > 200, `${icon.key}: its canvas is blank (${icon.painted} painted pixels)`);
  }
  for (const mark of drawn.marks) {
    assert.equal(mark.drawn, 'true', `${mark.mark} was not drawn`);
    assert.ok(mark.painted > 100, `${mark.mark}: its canvas is blank`);
    assert.equal(mark.text, 'none', `${mark.mark}: the type it replaced is still showing`);
  }
  const madeBy = [...new Set(drawn.icons.map(icon => icon.frame.madeBy || 'astra'))];
  measured.art = { icons: drawn.icons.length, marks: drawn.marks.length, madeBy };
  ok(`every icon (${drawn.icons.length}) and mark (${drawn.marks.length}) is drawn from a frame, none a glyph or type (drawn by: ${madeBy.join(', ')})`);

  // ------------------------------------------------------------------------------------------------------ hover, in words
  const father = rows[0].id;
  const fatherIcon = page.locator(`.panel-row[data-entity-id="${father}"] .panel-icon[data-key="rest"]`);
  await fatherIcon.hover();
  await page.locator('#panel-tip').waitFor({ state: 'visible' });
  const tip = { name: await page.locator('#panel-tip-name').textContent(), summary: await page.locator('#panel-tip-summary').textContent() };
  assert.equal(tip.name, 'Rest');
  assert.match(tip.summary, /^[A-Z][^.!?]*\.$/, `the popup is not one sentence: "${tip.summary}"`);
  const label = await fatherIcon.getAttribute('aria-label');
  assert.ok(label.includes(tip.summary), 'the icon’s accessible name does not carry its summary');
  measured.hover = tip;
  ok(`hovering an icon shows a small popup with one sentence: "${tip.name}" - "${tip.summary}"`);
  await page.mouse.move(900, 500);
  await page.waitForFunction(() => document.querySelector('#panel-tip').hidden);
  // By keyboard too: focus shows the same popup.
  await fatherIcon.focus();
  await page.locator('#panel-tip').waitFor({ state: 'visible' });
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => document.querySelector('#panel-tip').hidden);
  ok('focusing an icon from the keyboard shows the same popup, and Escape puts it away');
  await page.screenshot({ path: 'test-results/family-panel-lobby.png' });

  // ------------------------------------------------------------------------------------- press an icon; glow; stop glowing
  await post('/api/command', { id: `proof-start-${crypto.randomUUID()}`, action: 'start' }, hostCookie);
  await page.waitForFunction(() => window.__snapshot?.world.status === 'running');
  // The family drives in first (docs/SETTLING_IN.md step 2): nothing is done at home from the road.
  await page.waitForFunction(() => {
    const world = window.__snapshot.world;
    return world.entities.filter(e => e.kind === 'person').every(e => !e.travel);
  }, null, { timeout: 30000 });
  const worker = await page.waitForFunction(() => {
    const icon = document.querySelector('.panel-icon[data-key="practise-shooting"]:not([aria-disabled="true"])');
    return icon?.dataset.entityId || null;
  }, null, { timeout: 15000 }).then(handle => handle.jsonValue());
  await asMain(page, worker);
  const practise = page.locator(`.panel-row[data-entity-id="${worker}"] .panel-icon[data-key="practise-shooting"]`);
  const powderBefore = await page.evaluate(() => window.__snapshot.world.household.resources.powder);
  await practise.click();
  await page.waitForFunction(id => window.__snapshot.world.entities.find(e => e.id === id)?.chore?.id === 'practise-shooting', worker);
  await page.waitForFunction(id => document.querySelector(`.panel-row[data-entity-id="${id}"] .panel-icon[data-key="practise-shooting"]`)?.dataset.active === 'true', worker);
  const glow = await practise.evaluate(icon => getComputedStyle(icon).boxShadow);
  assert.notEqual(glow, 'none', 'an active icon is marked but not drawn glowing');
  const glowing = await page.locator('.panel-icon[data-active=true]').evaluateAll(icons => icons.map(icon => `${icon.dataset.entityId}:${icon.dataset.key}`));
  assert.ok(glowing.includes(`${worker}:practise-shooting`));
  ok(`pressing "Practise at the mark" sets ${worker} to it on the server, and its icon glows`);
  await page.screenshot({ path: 'test-results/family-panel-glow.png' });
  // It keeps glowing while the server says they are at it, and goes out the tick it says they are done.
  let sawGlowWhileBusy = 0;
  for (let i = 0; i < 400; i++) {
    const state = await page.evaluate(id => ({
      chore: window.__snapshot.world.entities.find(e => e.id === id)?.chore?.id || null,
      active: document.querySelector(`.panel-row[data-entity-id="${id}"] .panel-icon[data-key="practise-shooting"]`)?.dataset.active || null,
    }), worker);
    if (!state.chore) break;
    if (state.active === 'true') sawGlowWhileBusy++;
    await page.waitForTimeout(100);
  }
  await page.waitForFunction(id => !window.__snapshot.world.entities.find(e => e.id === id)?.chore, worker, { timeout: 60000 });
  await page.waitForFunction(id => document.querySelector(`.panel-row[data-entity-id="${id}"] .panel-icon[data-key="practise-shooting"]`)?.dataset.active !== 'true', worker);
  const powderAfter = await page.evaluate(() => window.__snapshot.world.household.resources.powder);
  assert.ok(powderAfter < powderBefore, 'the practice finished without spending any powder, so it was not really done');
  measured.glow = { worker, samplesGlowingWhileBusy: sawGlowWhileBusy, powderBefore, powderAfter };
  ok(`it glowed through the practice (${sawGlowWhileBusy} samples) and went out when the server said it was done (powder ${powderBefore} to ${powderAfter})`);

  // --------------------------------------------------------------------------------- the portrait takes the camera there
  const youngest = rows.at(-1).id;
  // Back out first. Choosing the practising worker as the main person (§12: their work has to be on the screen to be
  // pressed) took the camera to them and zoomed it to the stop, and a camera already at the stop cannot zoom in again.
  for (let step = 0; step < 4; step++) await page.locator('#map-nav [data-view=out]').click();
  await page.waitForTimeout(400);
  const before = await page.evaluate(() => window.__camera);
  await page.locator(`.panel-portrait[data-portrait="${youngest}"]`).click();
  await page.waitForFunction(id => document.querySelector('#map-nav [data-view=follow]')?.textContent.startsWith('Watching'), youngest);
  await page.waitForTimeout(400);
  const after = await page.evaluate(id => {
    const entity = window.__snapshot.world.entities.find(e => e.id === id);
    return { camera: window.__camera, at: entity.location };
  }, youngest);
  assert.ok(after.camera.scale > before.scale, `the camera did not zoom in: ${before.scale} to ${after.camera.scale}`);
  assert.equal(after.camera.following, false);
  const off = Math.hypot(after.camera.cx - after.at.x, after.camera.cy - after.at.y);
  assert.ok(off < 0.02, `the camera is ${off.toFixed(3)} miles from the person`);
  assert.equal(await page.locator('#selection').getAttribute('data-entity-id'), youngest, 'their card did not open');
  measured.camera = { before: { cx: before.cx, cy: before.cy, scale: before.scale }, after: { cx: after.camera.cx, cy: after.camera.cy, scale: after.camera.scale }, milesFromPerson: +off.toFixed(4) };
  ok(`pressing a portrait moves the camera onto that person and zooms in (scale ${Math.round(before.scale)} to ${Math.round(after.camera.scale)}, ${off.toFixed(3)} miles off)`);
  await page.screenshot({ path: 'test-results/family-panel-portrait.png' });

  // ---------------------------------------------------------------------------------- every name, saved without a button
  assert.equal(await page.locator('#family-panel button:not(.panel-portrait):not(.panel-icon):not(.panel-attention):not(.panel-focus):not(.panel-house):not(.panel-auto):not(#family-collapse)').count(), 0, 'the panel has a button that is not a portrait, an icon, one of the §11 controls (the "!", the star, House, auto) or §12\u2019s Hide names');
  assert.equal(await page.locator('#family-journal .name-row button, #family-name-form button').count(), 0, 'the family book still has Rename buttons');
  const newNames = ['Asa', 'Keziah', 'Hiram', 'Delia', 'Obed', 'Minerva', 'Levi', 'Soledad', 'Jonas', 'Effie'];
  const renamed = {};
  const ids = rows.map(person => person.id);
  for (const [at, id] of ids.entries()) {
    renamed[id] = newNames[at];
    const input = page.locator(`#panel-name-${id}`);
    await input.fill(newNames[at]);
    // Most are left with Tab; the last is simply left alone to prove the pause saves it.
    if (at < ids.length - 1) await input.press('Tab');
  }
  await page.waitForFunction(expected => Object.entries(expected).every(([id, name]) => window.__snapshot.world.entities.find(e => e.id === id)?.given === name), renamed, { timeout: 15000 });
  ok(`all ${ids.length} names changed in place and saved themselves - left by Tab, and the last by a pause in typing: ${Object.values(renamed).join(', ')}`);
  // A refusal, in the server's words.
  const first = page.locator(`#panel-name-${ids[0]}`);
  await first.fill('!!!');
  await first.press('Enter');
  await page.waitForFunction(() => /at least one letter/.test(document.querySelector('#error')?.textContent || ''));
  await page.waitForFunction(([id, name]) => document.querySelector(`#panel-name-${id}`).value === name, [ids[0], renamed[ids[0]]]);
  ok('a name with no letters is refused in the server’s words, and the box goes back to the name the world holds');
  // And the family book agrees, and it all survives a reload.
  await page.reload();
  await page.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-1');
  await page.waitForFunction(expected => Object.entries(expected).every(([id, name]) => document.querySelector(`#panel-name-${id}`)?.value === name), renamed, { timeout: 15000 });
  // The book says the names in full, first and last (owner, 2026-09-17: first names are given on the panel only).
  const bookNames = await page.evaluate(ids => ids.map(id => document.querySelector(`#family-kin .kin-row[data-entity-id="${id}"] strong`)?.textContent), ids);
  assert.deepEqual(bookNames, ids.map(id => `${renamed[id]} Proofwright`), 'the family book does not show the new names');
  ok('after a reload every new name is in its box on the panel and in the family book');

  // ------------------------------------------------------------------------------------------ the desktop, looked at
  await page.locator('#map-nav [data-view=follow]').click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'test-results/family-panel-desktop.png' });

  // ------------------------------------------------------------------------------------------------------ a phone's width
  const phone = await browser.newContext({ reducedMotion: 'no-preference', viewport: { width: 400, height: 800 }, isMobile: true, hasTouch: true });
  const cookies = await context.cookies();
  await phone.addCookies(cookies);
  const small = await phone.newPage();
  small.on('pageerror', error => errors.push(`phone: ${error.message}`));
  await small.goto(url);
  // A page opened afresh sees the title screen again (public/creation.js), the family already made behind it.
  await meetFamily(small);
  await small.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-1');
  await small.locator('#family-panel').waitFor({ state: 'visible' });
  if (await small.locator('#tutorial-skip').isVisible()) await small.locator('#tutorial-skip').click();
  // A rider may have come to the door while the family was being made; the card is closed before the panel is measured.
  if (await small.locator('#selection-close').isVisible()) await small.locator('#selection-close').click();
  await small.waitForTimeout(600);
  const phoneLayout = await small.evaluate(() => {
    const box = element => element.getBoundingClientRect();
    const panel = box(document.querySelector('#family-panel'));
    const open = [...document.querySelectorAll('.panel-row')].filter(row => getComputedStyle(row.querySelector('.panel-body')).display !== 'none');
    const centre = document.elementFromPoint(window.innerWidth * .6, window.innerHeight * .55);
    // How much of the screen the panel's visible parts actually cover.
    const covered = [...document.querySelectorAll('.panel-portrait, .panel-body')].filter(el => getComputedStyle(el).display !== 'none')
      .map(box).filter(rect => rect.bottom > panel.top && rect.top < panel.bottom).reduce((sum, rect) => sum + rect.width * Math.max(0, Math.min(rect.bottom, panel.bottom) - Math.max(rect.top, panel.top)), 0);
    return { panel: { x: panel.x, y: panel.y, width: panel.width, height: panel.height }, openRows: open.length, centre: centre?.id || centre?.tagName, covered: covered / (window.innerWidth * window.innerHeight),
      pageScrolls: document.documentElement.scrollWidth > window.innerWidth };
  });
  measured.phone = phoneLayout;
  assert.equal(phoneLayout.openRows, 1, 'on a phone more than one row is open');
  assert.equal(phoneLayout.centre, 'world-map', `the middle of a phone screen is not the map: ${phoneLayout.centre}`);
  assert.ok(phoneLayout.covered < 0.3, `the panel covers ${Math.round(phoneLayout.covered * 100)}% of a phone screen`);
  assert.equal(phoneLayout.pageScrolls, false, 'the page scrolls sideways on a phone');
  ok(`on a 400 px phone the panel is a column of portraits with one row open, covering ${Math.round(phoneLayout.covered * 100)}% of the screen, and the map is under the middle`);
  await small.screenshot({ path: 'test-results/family-panel-phone.png' });
  // Another portrait opens that person's row instead.
  const second = ids[1];
  await small.locator(`.panel-portrait[data-portrait="${second}"]`).click();
  await small.waitForFunction(id => document.querySelector(`.panel-row[data-entity-id="${id}"]`)?.dataset.expanded === 'true', second);
  await small.waitForTimeout(500);
  await small.screenshot({ path: 'test-results/family-panel-phone-open.png' });
  ok('on a phone, pressing another portrait opens that person’s row');

  assert.deepEqual(errors, [], `page errors: ${errors.join(' | ')}`);
  ok('no page errors anywhere in the run');

  mkdirSync('docs/evidence', { recursive: true });
  writeFileSync('docs/evidence/family-panel-browser.json', JSON.stringify({
    record: 'family-panel-browser',
    date: new Date().toISOString().slice(0, 10),
    browser: await browser.version(),
    task: 'docs/FAMILY_PANEL.md: the owner’s family panel (2026-09-15) - rows father, mother, children oldest first; portraits; icons with a one-sentence popup that glow while the server says the person is doing that; portrait to camera; names that save themselves.',
    environment: 'Same computer: a local classroom server and headless Chrome. Not a physical LAN, a classroom or a real phone.',
    checks: pass,
    measured,
    screenshots: ['test-results/family-panel-lobby.png', 'test-results/family-panel-glow.png', 'test-results/family-panel-portrait.png', 'test-results/family-panel-desktop.png', 'test-results/family-panel-phone.png', 'test-results/family-panel-phone-open.png'],
    notProved: [
      'Portraits and icons as art: both are stand-ins (docs/ART_REQUESTS.md, requests 2026-09-15).',
      'A real phone or tablet, touch scrolling of the icon strip, or a screen reader: the phone here is Chrome at 400 by 800 pixels.',
      'Every action’s icon being pressed in a browser. tests/family-panel.test.mjs sends every open icon’s order to the simulation; this run presses one.',
    ],
  }, null, 2) + '\n');
  console.log('\nwrote docs/evidence/family-panel-browser.json');
} finally {
  await browser.close();
  await app.close();
}
