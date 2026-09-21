// The family-creation wizard as a thing on a screen, in a real browser (owner's screen work, 2026-09-21).
//
// `scripts/looks-browser-proof.mjs` proves the wizard *asks the right things and keeps the answers*. This proves the
// other half: that a student can actually reach what it asks. Every step - the title, the die, the family's last name,
// everybody's first names, each parent's looks - and the wagon that follows them, at the Chromebook the school buys and
// at a phone, measured with the same instrument the study reports from (`scripts/support/creation-geometry.mjs`):
//
//   1. the card of the step is really drawn, and carries as many controls as the step needs   (trap (a): a hidden card
//      has a box of zero size, covers nothing, and a run full of them reads as clean);
//   2. nothing is drawn over any control of it, and none of them is off the screen;
//   3. every target a finger presses is at least 44px each way, and no two are closer than 8px;
//   4. the button that ends the step is on the card as the card opens, not below its own fold;
//   5. the page never scrolls sideways;
//   6. the card names itself with a heading and carries a line that announces a refusal;
//   7. focus arrives on the card, and Tab does not walk off it into the world behind the curtain;
//   8. nothing of that world is reachable at all while the curtain is up.
//
// The family is rolled from a seed that gives it two parents and eight children - the largest the twenty-sided die
// makes - because the naming card is the one part of the wizard whose height is the family's.
//
// Run: npm run test:creation      -> docs/evidence/creation-browser.json
//      CREATION_SIZES=1366x768,1024x768,390x844 npm run test:creation
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createClassroom } from '../server/app.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { FINGER, measureStep, tabOrder } from './support/creation-geometry.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

/** The Chromebook the school buys, and the narrowest thing anybody has held this up to. */
const SIZES = (process.env.CREATION_SIZES || '1366x768,1024x768,390x844').split(',').map(one => {
  const [width, height] = one.trim().split('x').map(Number);
  return { width, height };
});
/** Two targets closer than this are two targets a finger cannot tell apart. */
const APART = 8;
const SEED = 'wizard-17';

const pass = [];
const ok = label => { pass.push(label); console.log('PASS', label); };
const observed = {};

// A class of its own for each size. The first household of this seed is the one that rolls a twenty, and only the first
// student to join gets it, so measuring two sizes against one class would measure the second against whatever the die
// happened to give the second family.
const classrooms = [];
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const errors = [];

/**
 * One step of the wizard, held to every rule above. `controls` is the smallest number of things a student must be able
 * to press on this card: without it, a step whose controls have all been made invisible measures nothing and passes,
 * which is the way this kind of check goes quietly vacuous. `refusal` marks the steps that can be answered wrongly and
 * so must carry a line that says so out loud - Begin cannot be, and is not asked for one.
 */
const STEPS = [
  { stage: 'title-begin', card: '#creation-begin', endOf: '#creation-begin-button', controls: 1, heading: 'Your family' },
  { stage: 'die', card: '#family-roll', endOf: '#roll-family', controls: 1, refusal: true },
  { stage: 'die-rolled', card: '#family-roll', endOf: '#roll-family', controls: 1, refusal: true },
  { stage: 'surname', card: '#surname', endOf: '#surname-save', controls: 2, refusal: true },
  { stage: 'names', card: '#names', endOf: '#names-done', controls: 11, refusal: true },
  { stage: 'looks-first', card: '#looks', endOf: '#looks-done', controls: 10, refusal: true },
  { stage: 'looks-second', card: '#looks', endOf: '#looks-done', controls: 10, refusal: true },
  { stage: 'wagon', card: '#wagon-load', endOf: '#wagon-done', controls: 6, world: true, refusal: true },
];
const stepOf = stage => STEPS.find(one => one.stage === stage);

const measured = [];
/** Every rule, on one step, at one size. Each failure says which rule and which step, so an injection can be told apart. */
const holds = async (page, stage, screen) => {
  const step = stepOf(stage);
  // A step's card is drawn on the tick its step arrives and the page settles on the tick after; a student cannot press
  // anything inside a frame, so it is let settle rather than caught mid-flicker.
  await page.waitForTimeout(350);
  const seen = await measureStep(page, step.card, step.endOf);
  const where = `${stage} at ${screen.width}x${screen.height}`;
  // (1) Trap (a), both halves: the card itself, and enough on it to be worth measuring.
  assert.ok(seen.real, `the ${where} card is not really on the screen (${JSON.stringify(seen.panelBox)}), so nothing measured on it means anything`);
  assert.ok(seen.controls >= step.controls, `the ${where} card has ${seen.controls} controls on it, fewer than the ${step.controls} a student must be able to press`);
  // (2) Covered, and off the screen.
  assert.equal(seen.covered.length, 0, `something is drawn over a control of the ${where} card: ${seen.covered.map(one => `${one.control} "${one.label}" under ${one.by.join(', ')}`).join('; ')}`);
  assert.equal(seen.offScreen.length, 0, `a control of the ${where} card is off the screen: ${seen.offScreen.map(one => `${one.control} "${one.label}" at ${one.box.x},${one.box.y}`).join('; ')}`);
  // (3) A finger.
  assert.equal(seen.tooSmallForAFinger.length, 0, `a control of the ${where} card is smaller than a finger (${FINGER}px): ${seen.tooSmallForAFinger.map(one => `${one.control} "${one.label}" ${one.box.w}x${one.box.h}`).join('; ')}`);
  assert.ok(!seen.tightestGap || seen.tightestGap.gap >= APART, `two controls of the ${where} card are only ${seen.tightestGap?.gap}px apart, closer than the ${APART}px a finger needs between them (${seen.tightestGap?.between.join(' and ')})`);
  // (4) The way out of the step.
  assert.ok(seen.endOfStep?.inView, `the button that ends the ${where} step is below the fold of its own card: ${seen.endOfStep?.control} "${seen.endOfStep?.label}" is ${seen.endOfStep?.below}px past it`);
  // (5) Sideways.
  assert.ok(seen.pageScrollsSideways <= 1, `the page scrolls ${seen.pageScrollsSideways}px sideways at the ${where} step`);
  // (6) What a screen reader is handed.
  assert.ok(seen.announced.heading, `the ${where} card has no heading of its own to be announced by`);
  if (step.heading) assert.equal(seen.announced.heading, step.heading, `the ${where} card is announced as "${seen.announced.heading}"`);
  if (step.refusal) assert.ok(seen.announced.errorLine.length, `the ${where} card has no line that announces a refusal`);
  // (7) and (8): the keyboard, and the world behind the curtain. The wagon is a panel of the world itself and has no
  // curtain to be behind, so it is held to the rest and not to these.
  const tab = await tabOrder(page, step.card);
  if (!step.world) {
    assert.ok(seen.focusOnArrivalInside, `focus does not arrive on the ${where} card: it is on ${seen.focusOnArrival}`);
    assert.equal(tab.escaped, null, `Tab leaves the ${where} card for the world behind the curtain, onto ${tab.escaped}`);
    assert.equal(seen.behindTheCurtain.length, 0, `${seen.behindTheCurtain.length} controls of the world behind the curtain are still reachable at the ${where} step: ${[...new Set(seen.behindTheCurtain)].slice(0, 6).join(', ')}`);
  }
  measured.push({ stage, screen, card: seen.panelBox, controls: seen.controls, scrolls: seen.scrolls, endOfStep: seen.endOfStep, tightestGap: seen.tightestGap, heading: seen.announced.heading, focusOnArrival: seen.focusOnArrival, behindTheCurtain: seen.behindTheCurtain.length });
  // The walk above moved focus; let it go so the next step's arrival is the page's doing and not this proof's.
  await page.evaluate(() => document.activeElement?.blur?.());
  return seen;
};

try {
  mkdirSync('docs/evidence', { recursive: true });
  mkdirSync('test-results', { recursive: true });
  for (const screen of SIZES) {
    const app = createClassroom({ seed: SEED, playerCount: 5, tickMs: 200, worldFactory: createGonzalesWorld });
    classrooms.push(app);
    const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
    const context = await browser.newContext({ reducedMotion: 'reduce', viewport: screen });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(`${screen.width}: ${error.message}`));
    await page.goto(url);

    // The title screen, and into it the way a student does.
    await page.locator('[name=name]').fill(`Reader ${screen.width}`);
    await page.locator('[name=code]').fill(app.state.sessionCode);
    await page.getByRole('button', { name: 'Join', exact: true }).click();
    await page.waitForFunction(() => window.__snapshot?.world.householdId);
    await page.locator('#creation-begin').waitFor({ state: 'visible', timeout: 30000 });
    await holds(page, 'title-begin', screen);

    // The die.
    await page.locator('#creation-begin-button').click();
    await page.locator('#family-roll').waitFor({ state: 'visible', timeout: 20000 });
    await holds(page, 'die', screen);
    await page.locator('#roll-family').click();
    await page.waitForFunction(() => document.querySelector('#roll-family')?.textContent === 'Meet your family', null, { timeout: 20000 });
    await holds(page, 'die-rolled', screen);

    // The last name.
    await page.locator('#roll-family').click();
    await page.locator('#surname').waitFor({ state: 'visible', timeout: 20000 });
    await holds(page, 'surname', screen);
    await page.locator('#surname-input').fill('Navarro');
    await page.locator('#surname-save').click();

    // Everybody's first names. The family is the largest the die makes, which is what the card is worth measuring at.
    await page.locator('#names').waitFor({ state: 'visible', timeout: 20000 });
    const people = await page.evaluate(async () => (await (await fetch('/api/family')).json()).family.people.length);
    assert.ok(people >= 10, `this seed no longer rolls the largest family the die makes: ${people} people, and the naming card is only worth measuring at its tallest`);
    observed[`family-${screen.width}`] = people;
    await holds(page, 'names', screen);
    await page.screenshot({ path: `test-results/creation-proof-${screen.width}-names.png` });

    // Each parent's looks.
    await page.locator('#names-done').click();
    await page.locator('#looks').waitFor({ state: 'visible', timeout: 20000 });
    for (const which of ['first', 'second']) {
      await holds(page, `looks-${which}`, screen);
      const who = await page.locator('#looks').getAttribute('data-entity-id');
      await page.locator('#looks-done').click();
      await page.waitForFunction(id => document.querySelector('#looks').hidden || document.querySelector('#looks').dataset.entityId !== id, who, { timeout: 20000 });
      if (await page.locator('#looks').isHidden()) break;
    }
    await page.screenshot({ path: `test-results/creation-proof-${screen.width}-looks.png` });

    // The curtain comes down, and the wagon is what a student meets next.
    await page.locator('#creation').waitFor({ state: 'hidden', timeout: 30000 });
    // Nothing of the world may still be marked inert once the curtain is down, or a student who has finished the wizard
    // meets a world that cannot be pressed at all.
    const sealed = await page.evaluate(() => document.querySelectorAll('.map-stage [inert],.map-stage[inert]').length);
    assert.equal(sealed, 0, `the curtain is down and ${sealed} parts of the world are still sealed shut behind it at ${screen.width}x${screen.height}`);
    await page.locator('#wagon-load').waitFor({ state: 'visible', timeout: 30000 });
    await holds(page, 'wagon', screen);
    await page.screenshot({ path: `test-results/creation-proof-${screen.width}-wagon.png` });
    ok(`every step of the wizard is reachable at ${screen.width}x${screen.height}: nothing covered, nothing off the screen, no target under ${FINGER}px, every step's button on its own card, focus on every card and the world behind the curtain sealed`);
    await context.close();
  }

  assert.deepEqual(errors, [], `the page threw: ${errors.join(' | ')}`);
  ok('no page errors');

  writeFileSync('docs/evidence/creation-browser.json', `${JSON.stringify({
    record: 'The family-creation wizard as a thing on a screen (2026-09-21)',
    date: new Date().toISOString().slice(0, 10), verdict: 'PASS', seed: SEED, finger: FINGER, apart: APART, sizes: SIZES,
    note: 'Same computer only. A student joined, was carried through all five steps of the wizard and on to the wagon at each size, and every control was measured with document.elementFromPoint and the browser\'s own tab order. No LAN or district claim.',
    checks: pass, observed, steps: measured,
  }, null, 2)}\n`);
  console.log(`\n${pass.length} checks passed over ${measured.length} step-and-size measurements.`);
} finally {
  await browser.close();
  for (const app of classrooms) await app.close();
}
