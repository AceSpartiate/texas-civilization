// The family-creation wizard, walked in a real browser at the classroom's own screen (2026-09-21).
//
// tests/creation.test.mjs proves the order of the steps and tests/creation-words.test.mjs proves the words against the
// code that implements them. This proves a student on a Chromebook actually meets them: that each step's explanation is
// on the screen, inside its own card, at 1366x768; that the wagon panel states the land and the herd the stock choice
// brings, in the server's numbers; that the looks pop-up says which parent of how many is being asked for; and that
// nothing on any card is clipped out of reach.
//
// **Every check runs in the state where the fault could appear.** A check that measures a hidden panel proves nothing -
// a hidden element's box is empty and overlaps nothing, so it passes against deliberately broken code. `readable` refuses
// to look at anything that is not visible and has a real box, and `fits` is only ever called on a panel that is up.
//
// Same computer only, headless Chrome. No LAN or district claim.
// Run: npm run test:creation
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createClassroom } from '../server/app.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { OPENING_HERD } from '../sim/stock.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const pass = [];
const ok = label => { pass.push(label); console.log('PASS', label); };
const observed = {};
const shots = [];
// The classroom screen this game is played on (CLAUDE.md, docs/FAMILY_PANEL.md §12.11).
const CHROMEBOOK = { width: 1366, height: 768 };

const app = createClassroom({ seed: 'creation-proof', playerCount: 5, tickMs: 200, worldFactory: createGonzalesWorld });
const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const errors = [];

/**
 * The text of a selector that is genuinely on the screen.
 *
 * Refuses a hidden element, an empty box and empty text, so a check can never pass because there was nothing to look at -
 * the exact way a check passed against broken code on 2026-09-21.
 */
async function readable(page, selector) {
  assert.equal(await page.locator(selector).isVisible(), true, `${selector} is not on the screen, so nothing about it can be proved`);
  const box = await page.locator(selector).boundingBox();
  assert.ok(box && box.width > 8 && box.height > 4, `${selector} has no box on the screen: ${JSON.stringify(box)}`);
  const text = (await page.locator(selector).innerText()).replace(/\s+/g, ' ').trim();
  assert.ok(text.length > 0, `${selector} is on the screen with nothing written in it`);
  return text;
}

/** A panel that is up fits the window, and its last control can be reached. */
async function fits(page, selector, lastControl, viewport) {
  assert.equal(await page.locator(selector).isVisible(), true, `${selector} is not up, so its fit proves nothing`);
  const box = await page.locator(selector).boundingBox();
  assert.ok(box.x >= -1 && box.x + box.width <= viewport.width + 1, `${selector} runs off the side: ${JSON.stringify(box)}`);
  const sideways = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert.ok(sideways <= 1, `the page scrolls sideways with ${selector} up (${sideways}px)`);
  // The control at the bottom must be reachable: either in the window already, or inside a panel that scrolls to it.
  await page.locator(lastControl).scrollIntoViewIfNeeded();
  const control = await page.locator(lastControl).boundingBox();
  assert.ok(control && control.y >= -1 && control.y + control.height <= viewport.height + 1,
    `${lastControl} cannot be brought into the window: ${JSON.stringify(control)}`);
  return { panel: box, control };
}

try {
  mkdirSync('docs/evidence', { recursive: true });
  const context = await browser.newContext({ viewport: CHROMEBOOK });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url);
  await page.locator('[name=name]').fill('Creation reader');
  await page.locator('[name=code]').fill(app.state.sessionCode);
  await page.getByRole('button', { name: 'Join', exact: true }).click();
  await page.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-1');

  // ---------------------------------------------------------------- the title card
  await page.locator('#creation-begin').waitFor({ state: 'visible', timeout: 30000 });
  observed.titleCard = await readable(page, '#creation-begin');
  assert.match(observed.titleCard, /one task at a time/, 'the title card does not warn that the game walks the student through the farm');
  assert.doesNotMatch(observed.titleCard, /yours to work: the field, the timber, the town/, 'the old unqualified promise is on the title card');
  await fits(page, '#creation-begin', '#creation-begin-button', CHROMEBOOK);
  await page.screenshot({ path: 'docs/evidence/creation-title.png' });
  shots.push('docs/evidence/creation-title.png');
  ok(`the title card says what comes next and fits the Chromebook: "${observed.titleCard.slice(0, 120)}..."`);

  // ---------------------------------------------------------------- the die
  await page.locator('#creation-begin-button').click();
  await page.locator('#family-roll').waitFor({ state: 'visible', timeout: 15000 });
  observed.diePanel = await readable(page, '#family-roll');
  assert.match(observed.diePanel, /STEP 1 OF 4/, 'the die panel does not say which step it is');
  assert.match(observed.diePanel, /thrown once/, 'the die panel does not say the roll is taken once');
  assert.doesNotMatch(observed.diePanel, /\b(parents?|children|child)\b/i, 'the die panel gives away what the number maps to');
  await fits(page, '#family-roll', '#roll-family', CHROMEBOOK);
  await page.screenshot({ path: 'docs/evidence/creation-die.png' });
  shots.push('docs/evidence/creation-die.png');
  ok(`the die panel numbers itself and says the roll is taken once, without saying what it means: "${observed.diePanel.replace(/\n/g, ' ')}"`);

  await page.locator('#roll-family').click();
  await page.waitForFunction(() => document.querySelector('#roll-family')?.textContent === 'Meet your family', null, { timeout: 20000 });
  // The second die, thrown by the same press (owner, 2026-09-25; sim/means.mjs): the family's means in the server's words, and
  // the panel, taller with them, still fits the Chromebook with its button in reach.
  await page.locator('#means-result').waitFor({ state: 'visible', timeout: 10000 });
  observed.meansResult = await readable(page, '#means-result');
  // Since the evening of 2026-09-25 (sim/means.mjs, the second table): a band with no vehicle, and the coin said with the band.
  assert.match(observed.meansResult, /^(Hard up|Poor|Modest|Comfortable|Well-to-do)\. (No wagon or cart|A cart|A wagon|Two wagons|Three wagons)[^.]*, the family's horse, and (3|4|5|6|7|8|9|10) reales\./, 'the means are not said after the throw');
  await fits(page, '#family-roll', '#roll-family', CHROMEBOOK);
  await page.screenshot({ path: 'docs/evidence/creation-die-means.png' });
  shots.push('docs/evidence/creation-die-means.png');
  ok(`the second die says the family's means and the panel still fits: "${observed.meansResult}"`);
  await page.locator('#roll-family').click();

  // ---------------------------------------------------------------- the last name
  await page.locator('#surname').waitFor({ state: 'visible', timeout: 15000 });
  observed.surnamePanel = await readable(page, '#surname');
  assert.match(observed.surnamePanel, /STEP 2 OF 4/);
  assert.match(observed.surnamePanel, /cannot be changed afterwards/, 'the last name box does not say it is set once');
  assert.match(observed.surnamePanel, /first names can be changed/i, 'the last name box does not say first names can still be changed');
  // The list of names under the box is labelled, and is a list of the family, not an unexplained row of words.
  assert.match(await readable(page, '#surname-people-label'), /Your family/i);
  observed.surnamePeople = await readable(page, '#surname-people');
  await fits(page, '#surname', '#surname-save', CHROMEBOOK);
  await page.screenshot({ path: 'docs/evidence/creation-surname.png' });
  shots.push('docs/evidence/creation-surname.png');
  ok(`the last name box says it is set once and labels the family it names (${observed.surnamePeople})`);

  await page.locator('#surname-input').fill('Halloran');
  await page.waitForFunction(() => /Halloran/.test(document.querySelector('#surname-people')?.textContent || ''), null, { timeout: 5000 });
  observed.surnamePreview = (await page.locator('#surname-people').innerText()).trim();
  await page.locator('#surname-save').click();
  await page.locator('#surname').waitFor({ state: 'hidden', timeout: 15000 });

  // ---------------------------------------------------------------- everybody's first names
  await page.locator('#names').waitFor({ state: 'visible', timeout: 15000 });
  observed.namesHint = await readable(page, '#names-hint');
  assert.match(observed.namesHint, /Step 3 of 4/);
  assert.match(observed.namesHint, /already named/, 'the names card does not say nothing here is required');
  // The claim is true: every box holds the name the game dealt.
  const dealt = await page.evaluate(async () => (await (await fetch('/api/family')).json()).family.people.map(person => person.given || person.name));
  const boxes = await page.locator('#names-list input').evaluateAll(inputs => inputs.map(input => input.value));
  assert.deepEqual([...boxes].sort(), [...dealt].sort(), '"already named" is false: a box is empty or holds something else');
  observed.nameBoxes = boxes;
  await fits(page, '#names', '#names-done', CHROMEBOOK);
  // An emptied box is put back rather than left showing a name nobody has.
  await page.locator('#names-list input').first().fill('');
  await page.locator('#names-done').click();
  await page.waitForFunction(() => document.querySelector('#names').hidden || document.querySelector('#names-list input')?.value, null, { timeout: 15000 });
  observed.emptiedBoxBecame = await page.evaluate(() => document.querySelector('#names-list input')?.value || '(the card closed)');
  assert.notEqual(observed.emptiedBoxBecame, '', 'an emptied name box was left empty while the world kept the dealt name');
  await page.screenshot({ path: 'docs/evidence/creation-names.png' });
  shots.push('docs/evidence/creation-names.png');
  ok(`the names card says nothing is required, every box holds the dealt name, and an emptied box comes back as "${observed.emptiedBoxBecame}"`);

  if (!(await page.locator('#names').isHidden())) await page.locator('#names-done').click();
  await page.locator('#names').waitFor({ state: 'hidden', timeout: 15000 });

  // ---------------------------------------------------------------- how the parents look
  await page.locator('#looks').waitFor({ state: 'visible', timeout: 15000 });
  const parents = await page.evaluate(async () => (await (await fetch('/api/family')).json()).family.people.filter(person => person.choices).length);
  observed.parents = parents;
  observed.looksStep = await readable(page, '#looks-step');
  assert.match(observed.looksStep, /Step 4 of 4/);
  assert.match(observed.looksStep, parents > 1 ? /Parent 1 of \d/ : /Done finishes your family/, 'the looks pop-up does not say which parent of how many');
  if (parents > 1) assert.match(observed.looksStep, /brings up the next parent/, 'the looks pop-up does not warn that a second parent is coming');
  observed.looksNote = await readable(page, '#looks-note');
  assert.match(observed.looksNote, /changes nothing in the game/, 'the looks pop-up no longer says appearance decides nothing');
  assert.match(observed.looksNote, /Chosen once/, 'the looks pop-up does not say the looks are set once');
  assert.match(observed.looksNote, /children are not asked for/i, 'the looks pop-up does not say the children take after their parents');
  await fits(page, '#looks', '#looks-done', CHROMEBOOK);
  await page.screenshot({ path: 'docs/evidence/creation-looks.png' });
  shots.push('docs/evidence/creation-looks.png');
  ok(`the looks pop-up counts the parents (${observed.looksStep}) and says appearance decides nothing, is chosen once, and skips the children`);

  // The counter does not shrink as the parents are answered.
  for (let parent = 0; parent < parents; parent++) {
    const who = await page.locator('#looks').getAttribute('data-entity-id');
    if (parents > 1) {
      const line = await readable(page, '#looks-step');
      assert.match(line, new RegExp(`Parent ${parent + 1} of ${parents}\\.`), `the looks counter reads "${line}" on parent ${parent + 1} of ${parents}`);
      observed[`looksStep${parent + 1}`] = line;
    }
    await page.locator('#looks-done').click();
    await page.waitForFunction(id => document.querySelector('#looks').hidden || document.querySelector('#looks').dataset.entityId !== id, who, { timeout: 15000 });
  }
  await page.locator('#looks').waitFor({ state: 'hidden', timeout: 15000 });
  ok(`the looks counter keeps its total over every parent (${Object.keys(observed).filter(key => key.startsWith('looksStep') && key !== 'looksStep').map(key => observed[key]).join(' | ') || 'one parent, no counter'})`);

  // ---------------------------------------------------------------- the wagon and the stock
  await page.locator('#creation').waitFor({ state: 'hidden', timeout: 20000 });
  await page.locator('#wagon-load').waitFor({ state: 'visible', timeout: 20000 });
  observed.wagonText = await readable(page, '#wagon-load-text');
  assert.doesNotMatch(observed.wagonText, /Anything left out is not coming/, 'the wagon panel still says nothing left out is coming');
  assert.match(observed.wagonText, /bought in a town later/, 'the wagon panel does not say what can be bought later');
  observed.wagonWhen = await readable(page, '#wagon-when');
  assert.match(observed.wagonWhen, /until your teacher presses Start/, 'the wagon panel does not say when the choice closes');

  // The stock choice, with both halves of what it does, and every number the server's own.
  await page.locator('#wagon-stock').waitFor({ state: 'visible', timeout: 10000 });
  observed.stockNo = await readable(page, '#stock-no-text');
  observed.stockYes = await readable(page, '#stock-yes-text');
  const choice = await page.evaluate(() => window.__snapshot?.world.land?.stockChoice);
  assert.ok(choice, 'the page was handed no stock choice, so nothing about its words can be proved');
  assert.deepEqual(choice.herd, { ...OPENING_HERD }, 'the server no longer sends the herd the choice brings');
  assert.ok(observed.stockNo.includes(String(choice.laborAcres)), `the "no stock" line does not carry the server's acres: ${observed.stockNo}`);
  assert.ok(observed.stockYes.includes(choice.stockAcres.toLocaleString('en-US')), `the "drive stock in" line does not carry the server's acres: ${observed.stockYes}`);
  assert.ok(observed.stockYes.includes(`${choice.herd.cattle} cattle`) && observed.stockYes.includes(`${choice.herd.hogs} hogs`),
    `the "drive stock in" line does not say the animals it brings: ${observed.stockYes}`);
  assert.ok(observed.stockYes.includes(`${choice.space} spaces`), `the "drive stock in" line does not say the wagon cost: ${observed.stockYes}`);

  // The load buttons say what pressing them does, not what the thing already is.
  const toggle = page.locator('#wagon-items button[data-focus-key$="-toggle"]').first();
  // Pressed from the keyboard, as a student may: the panel's foot, with its note and Done, stands over the last lines of the list,
  // and the longer words of a family on foot ("No wagon or cart. The ox's packs: ...", 2026-09-25) left the first toggle under it,
  // where a pointer click is refused by the browser however it is scrolled. What pressing it does is the same.
  await toggle.evaluate(button => button.scrollIntoView({ block: 'center' }));
  observed.toggleBefore = (await toggle.innerText()).trim();
  await toggle.focus();
  await page.keyboard.press('Enter');
  await page.waitForFunction(label => {
    const button = document.querySelector('#wagon-items button[data-focus-key$="-toggle"]');
    return button && button.textContent.trim() !== label;
  }, observed.toggleBefore, { timeout: 10000 });
  observed.toggleAfter = (await page.locator('#wagon-items button[data-focus-key$="-toggle"]').first().innerText()).trim();
  assert.deepEqual([observed.toggleBefore, observed.toggleAfter].sort(), ['Load', 'Take out'],
    `a wagon toggle reads "${observed.toggleBefore}" then "${observed.toggleAfter}"; neither pair says what pressing it does`);

  // The whole panel, with its two new lines, still reaches its Done at 1366x768.
  observed.wagonBox = await fits(page, '#wagon-load', '#wagon-done', CHROMEBOOK);
  await page.screenshot({ path: 'docs/evidence/creation-wagon.png' });
  shots.push('docs/evidence/creation-wagon.png');
  ok(`the wagon panel says the land, the herd and the deadline, its load buttons say what pressing does, and Done packing is reachable at ${CHROMEBOOK.width}x${CHROMEBOOK.height}`);

  // ---------------------------------------------------------------- reopened, nothing is asked again
  // The same tab keeps how far it got in its own `sessionStorage` (public/creation.js, marked `ceiling:`), so a reload
  // here goes straight back to the world. A new tab sees the title screen again and nothing behind it.
  await page.reload();
  await page.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-1');
  await page.waitForTimeout(1500);
  for (const selector of ['#creation', '#family-roll', '#surname', '#names', '#looks']) {
    assert.equal(await page.locator(selector).isHidden(), true, `${selector} is up again after the family is made`);
  }
  const fresh = await context.newPage();
  fresh.on('pageerror', error => errors.push(error.message));
  await fresh.goto(url);
  await fresh.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-1');
  await fresh.locator('#creation-begin-button').waitFor({ state: 'visible', timeout: 20000 });
  observed.newTabCard = (await fresh.locator('#creation-begin').innerText()).replace(/\s+/g, ' ').trim();
  await fresh.locator('#creation-begin-button').click();
  await fresh.waitForTimeout(1500);
  for (const selector of ['#family-roll', '#surname', '#names', '#looks']) {
    assert.equal(await fresh.locator(selector).isHidden(), true, `${selector} is asked again in a new tab after the family is made`);
  }
  await fresh.close();
  ok('reloaded, the world is there with nothing asked again; a new tab sees the title screen and then the world, and no step is asked twice');

  assert.deepEqual(errors, [], `the page threw: ${errors.join(' | ')}`);
  ok('no page errors');

  writeFileSync('docs/evidence/creation-browser.json', `${JSON.stringify({
    record: 'The family-creation wizard walked in a browser at the classroom screen (2026-09-21)',
    date: new Date().toISOString().slice(0, 10),
    verdict: 'PASS',
    viewport: CHROMEBOOK,
    note: 'Same computer, headless Chrome, one student joined to a real class. Every check runs with the panel it measures visible: a hidden panel has an empty box and would pass against broken code. Play Solo is NOT covered here - a Solo game runs from its first tick, so `wagonProjection` sends nothing and a Solo player never sees the wagon panel or the stock choice at all. No LAN or district claim.',
    checks: pass,
    observed,
    screenshots: shots,
  }, null, 2)}\n`);
  console.log(`\n${pass.length} checks passed.`);
} finally {
  await browser.close();
  await app.close();
}
