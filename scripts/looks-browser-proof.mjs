// Naming the family and How We Look, in a real browser (owner, 2026-09-17).
//
// "After rolling for a family, the player should see an interface pop up and ask them to name their family. It shouldn't
// say 'Our family is called' it should say 'Family Last Name' and that last name should be added to the members of the
// family as such." Then: "The How We Look section should have images for each section too. This should appear next."
//
// tests/surname.test.mjs and tests/appearance.test.mjs prove the rules. This proves a student meets them: roll, and the last
// name is asked for in a box that will not close; named, every person on the panel carries it; then each parent's looks,
// one at a time, with a picture on every choice and the preview following what is picked; Done keeps it; reloaded, nothing
// is asked again; the journal button reads Journal and edits neither.
//
// Run: npm run test:looks
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createClassroom } from '../server/app.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const pass = [];
const ok = label => { pass.push(label); console.log('PASS', label); };
const observed = {};

const app = createClassroom({ seed: 'family-proof', playerCount: 5, tickMs: 200, worldFactory: createGonzalesWorld });
const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const errors = [];
const family = page => page.evaluate(async () => (await (await fetch('/api/family')).json()).family);

try {
  mkdirSync('docs/evidence', { recursive: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 950 } });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url);
  const paletteComplete = await page.evaluate(async () => {
    const [vocabulary, palette] = await Promise.all([import('/look-vocabulary.js'), import('/looks-art.js')]);
    return vocabulary.SKIN.every(value => palette.SKIN_COLOURS[value])
      && vocabulary.HAIR.every(value => palette.HAIR_COLOURS[value])
      && vocabulary.CLOTHING.every(value => palette.CLOTHING_COLOURS[value]);
  });
  assert.equal(paletteComplete, true, 'a server appearance option has no portrait colour');
  await page.locator('[name=name]').fill('Looks reader');
  await page.locator('[name=code]').fill(app.state.sessionCode);
  await page.getByRole('button', { name: 'Join', exact: true }).click();
  await page.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-1');

  // Before the roll nothing is asked.
  await page.waitForTimeout(600);
  assert.equal(await page.locator('#surname').isHidden(), true, 'the last name was asked for before the roll');
  assert.equal(await page.locator('#looks').isHidden(), true, 'the looks were asked for before the roll');
  assert.equal((await page.locator('#journal-toggle').textContent()).trim(), 'Journal');
  ok('before the roll nothing is asked, and the button at the bottom reads Journal');

  // The title screen comes first (public/creation.js, owner 2026-09-17): Begin, then the die.

  await page.locator('#creation-begin-button').waitFor({ state: 'visible', timeout: 30000 });

  await page.locator('#creation-begin-button').click();

  await page.locator('#roll-family').click();
  await page.waitForFunction(() => document.querySelector('#roll-family')?.textContent === 'Meet your family', null, { timeout: 15000 });
  await page.locator('#roll-family').click();
  await page.locator('#surname').waitFor({ state: 'visible', timeout: 15000 });
  assert.equal(await page.locator('#surname label').textContent(), 'Family Last Name');
  assert.equal(await page.locator('#surname').getByText('Our family is called').count(), 0);
  assert.equal(await page.locator('#looks').isHidden(), true, 'the looks came up before the last name');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  assert.equal(await page.locator('#surname').isHidden(), false, 'Escape closed the naming box');
  ok('after the roll the "Family Last Name" box comes up, before the looks, and Escape does not close it');

  await page.locator('#surname-input').fill('Navarro');
  observed.surnamePreview = await page.locator('#surname-people').textContent();
  assert.match(observed.surnamePreview, /Navarro/);
  await page.screenshot({ path: 'docs/evidence/looks-surname.png' });
  await page.locator('#surname-save').click();
  await page.locator('#surname').waitFor({ state: 'hidden' });
  await page.waitForFunction(() => (window.__snapshot?.world.entities || []).filter(e => e.householdId === 'hh-1' && e.kind === 'person').every(e => e.name.endsWith(' Navarro')), null, { timeout: 10000 });
  const book = await family(page);
  observed.names = book.people.map(person => person.name);
  assert.ok(book.people.every(person => person.name === `${person.given} Navarro`), `not everybody carries the last name: ${observed.names.join(', ')}`);
  // Everybody's first names come next, filled in as the game dealt them (owner, 2026-09-17).
  await page.locator('#names').waitFor({ state: 'visible', timeout: 10000 });
  assert.equal(await page.locator('#looks').isHidden(), true, 'the looks came up before the names');
  const nameRows = await page.locator('#names-list input').evaluateAll(inputs => inputs.map(input => input.value));
  assert.deepEqual(nameRows.sort(), book.people.map(person => person.given).sort(), 'the naming card does not hold everybody by their first name');
  observed.nameRows = nameRows;
  await page.screenshot({ path: 'docs/evidence/looks-names.png' });
  await page.locator('#names-done').click();
  await page.locator('#names').waitFor({ state: 'hidden', timeout: 10000 });
  ok(`the naming card holds every one of the family by their first name (${nameRows.join(', ')}) and Continue keeps them`);

  const panelNames = await page.locator('.panel-name').evaluateAll(inputs => inputs.map(input => input.value));
  assert.deepEqual(panelNames.sort(), book.people.map(person => person.given).sort(), 'the panel boxes are not the first names');
  ok(`named, every member carries the last name (${observed.names.join(', ')}); the panel's boxes hold the first names`);

  // The looks, one parent at a time.
  const parents = book.people.filter(person => person.choices);
  assert.ok(parents.length, 'this seed needs a parent');
  await page.locator('#looks').waitFor({ state: 'visible', timeout: 10000 });
  for (const [index, parent] of parents.entries()) {
    await page.waitForFunction(id => document.querySelector('#looks')?.dataset.entityId === id && !document.querySelector('#looks').hidden, parent.id, { timeout: 10000 });
    for (const part of ['skin', 'hair', 'clothing', 'head']) {
      const offered = await page.locator(`#looks-parts button[data-part="${part}"]`).evaluateAll(buttons => buttons.map(b => b.dataset.value));
      assert.deepEqual(offered, parent.choices[part], `${part} offers something other than the server's choices`);
      assert.equal(await page.locator(`#looks-parts button[data-part="${part}"] canvas`).count(), offered.length, `a ${part} choice has no picture`);
      const pressed = await page.locator(`#looks-parts button[data-part="${part}"][aria-pressed="true"]`).evaluateAll(b => b.map(x => x.dataset.value));
      assert.deepEqual(pressed, [parent.appearance[part]], `the default ${part} is not the one chosen`);
    }
    const before = await page.locator('#looks-preview').evaluate(canvas => canvas.toDataURL());
    const beforeFigure = await page.locator('#looks-figure').evaluate(canvas => canvas.toDataURL());
    const hair = parent.choices.hair.find(value => value !== parent.appearance.hair && value !== 'grey');
    const head = parent.choices.head.find(value => value !== parent.appearance.head);
    await page.locator(`#looks-parts button[data-part="hair"][data-value="${hair}"]`).click();
    await page.locator(`#looks-parts button[data-part="head"][data-value="${head}"]`).click();
    const after = await page.locator('#looks-preview').evaluate(canvas => canvas.toDataURL());
    const afterFigure = await page.locator('#looks-figure').evaluate(canvas => canvas.toDataURL());
    assert.notEqual(after, before, 'the preview did not follow the choice');
    assert.notEqual(afterFigure, beforeFigure, 'the map-figure preview did not follow the choice');
    assert.equal(await page.locator(`#looks-parts button[data-part="hair"][data-value="${hair}"]`).getAttribute('aria-pressed'), 'true');
    if (index === 0) await page.screenshot({ path: 'docs/evidence/looks-popup.png' });
    await page.locator('#looks-done').click();
    await page.waitForFunction(async ([id, value, headValue]) => {
      const person = (await (await fetch('/api/family')).json()).family.people.find(one => one.id === id);
      return person.chosen && person.appearance.hair === value && person.appearance.head === headValue;
    }, [parent.id, hair, head], { timeout: 10000 });
    observed[`chose-${parent.role}`] = `${hair} hair, ${head}`;
  }
  await page.locator('#looks').waitFor({ state: 'hidden', timeout: 10000 });
  ok(`each parent's looks came up in turn with a picture on every choice, the defaults pressed, the preview following, and Done kept ${Object.entries(observed).filter(([k]) => k.startsWith('chose-')).map(([k, v]) => `${k.slice(6)}: ${v}`).join('; ')}`);

  // Reloaded: nothing asked again; the journal shows who is whose and edits nothing.
  await page.reload();
  await page.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-1');
  await page.waitForTimeout(1500);
  assert.equal(await page.locator('#surname').isHidden(), true, 'the last name was asked for again');
  assert.equal(await page.locator('#looks').isHidden(), true, 'the looks were asked for again');
  const savedLooks = await family(page);
  for (const parent of parents) {
    const onMap = await page.evaluate(id => window.__snapshot.world.entities.find(one => one.id === id)?.appearance, parent.id);
    assert.deepEqual(onMap, savedLooks.people.find(one => one.id === parent.id).appearance, 'the compact map look decodes to a different parent');
  }
  const portraitsMatch = await page.evaluate(async ids => {
    const { drawAvatarPortrait } = await import('/avatar-art.js');
    return ids.map(id => {
      const person = window.__snapshot.world.entities.find(one => one.id === id);
      const actual = document.querySelector(`.panel-row[data-entity-id="${id}"] .panel-portrait canvas`);
      if (!person?.appearance || !actual) return false;
      const expected = document.createElement('canvas');
      expected.width = expected.height = actual.width;
      drawAvatarPortrait(expected, person.appearance, person.sex);
      return expected.toDataURL() === actual.toDataURL();
    });
  }, parents.map(person => person.id));
  assert.deepEqual(portraitsMatch, parents.map(() => true), 'a family-panel portrait differs from the chosen appearance');
  ok('after reload both parent portraits use the same layers and choices as the creation preview');
  // The journal is pressed with the wagon panel still open on purpose. That click is what caught a dim given to the
  // wagon panel on 2026-09-21 and taken out again the same day: a lobby panel that covers the family explains nothing
  // by dimming, and it cost this button (docs/FAMILY_PANEL.md §12.11).
  if (await page.locator('#family-journal').getAttribute('data-open') !== 'true') await page.locator('#journal-toggle').click();
  await page.locator('#family-kin li').first().waitFor({ state: 'visible' });
  assert.equal(await page.locator('#family-journal input[data-rename], #family-journal select').count(), 0, 'the journal still edits names or looks');
  observed.kin = await page.locator('#family-kin li').first().textContent();
  assert.match(observed.kin, /Navarro/);
  ok(`reloaded, nothing is asked again, and the journal says who is whose without editing: "${observed.kin}"`);

  // At phone width, a fresh family's pop-ups fit.
  const phone = await browser.newContext({ viewport: { width: 400, height: 860 } });
  const small = await phone.newPage();
  small.on('pageerror', error => errors.push(error.message));
  await small.goto(url);
  await small.locator('[name=name]').fill('Phone reader');
  await small.locator('[name=code]').fill(app.state.sessionCode);
  await small.getByRole('button', { name: 'Join', exact: true }).click();
  await small.waitForFunction(() => window.__snapshot?.world.householdId);
  await small.locator('#creation-begin-button').waitFor({ state: 'visible', timeout: 30000 });
  await small.locator('#creation-begin-button').click();
  await small.locator('#roll-family').click();
  await small.waitForFunction(() => document.querySelector('#roll-family')?.textContent === 'Meet your family', null, { timeout: 15000 });
  await small.locator('#roll-family').click();
  await small.locator('#surname-input').fill('Ybarbo');
  await small.locator('#surname-save').click();
  await small.locator('#names-done').click();
  await small.locator('#looks').waitFor({ state: 'visible', timeout: 10000 });
  const box = await small.locator('#looks').boundingBox();
  const overflow = await small.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert.ok(overflow <= 1 && box.x >= 0 && box.x + box.width <= 401, `the looks pop-up does not fit at phone width (${JSON.stringify(box)}, overflow ${overflow})`);
  await small.screenshot({ path: 'docs/evidence/looks-popup-phone.png' });
  ok('at phone width the looks pop-up fits and the page does not scroll sideways');

  assert.deepEqual(errors, [], `the page threw: ${errors.join(' | ')}`);
  ok('no page errors');

  writeFileSync('docs/evidence/looks-browser.json', `${JSON.stringify({
    record: 'Naming the family and How We Look, in a browser (owner, 2026-09-17)',
    date: new Date().toISOString().slice(0, 10),
    verdict: 'PASS',
    note: 'Same computer only. A student joined, rolled, gave the family its last name in the pop-up, chose each parent\'s looks from pictures, and reloaded. The pictures are Claude-drawn stand-ins; the figure on the map is unchanged (layered people art, docs/ART_REQUESTS.md). No LAN or district claim.',
    checks: pass,
    observed,
    screenshots: ['docs/evidence/looks-surname.png', 'docs/evidence/looks-names.png', 'docs/evidence/looks-popup.png', 'docs/evidence/looks-popup-phone.png'],
  }, null, 2)}\n`);
  console.log(`\n${pass.length} checks passed.`);
} finally {
  await browser.close();
  await app.close();
}
