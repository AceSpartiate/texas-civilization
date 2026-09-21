// The family-creation wizard as a thing on a screen: what is drawn where, what a finger can hit, and what a student can
// reach without a mouse. The companion of scripts/screen-overlap-study.mjs (docs/FAMILY_PANEL.md §12.11), pointed at the
// five steps before the world is seen - the title, the die, the last name, everybody's first names, each parent's looks -
// and at the wagon that follows them.
//
// It asks the browser rather than the stylesheet. For every control a student can press it samples the control's own
// points and asks `document.elementFromPoint` what is actually on top; it measures the control's own box against 44px of
// finger; it asks whether the step's card is taller than the screen and whether the button that ends the step is below
// its own fold; and it walks Tab from the card to see where focus goes.
//
// The instrument itself is `scripts/support/creation-geometry.mjs`, shared with `scripts/creation-browser-proof.mjs` so
// that the numbers reported here and the numbers the gate holds to are the same numbers. Its two traps are written out
// there; in short, (a) a hidden card has a box of zero size and a stage full of them reads as clean, so a stage that is
// not `real` is recorded here as NOT MEASURED rather than as clean; and (b) a `position:fixed` box is not clipped by an
// ancestor that scrolls, so the walk that finds what clips a control stops at the first fixed box.
//
// Every stage also leaves a screenshot in test-results/, which is what these numbers were checked against by eye before
// any of them was believed.
//
// Run: node scripts/creation-overlap-study.mjs            -> docs/evidence/creation-overlap.json
//      node scripts/creation-overlap-study.mjs 1024 768   -> docs/evidence/creation-overlap-1024.json
//      node scripts/creation-overlap-study.mjs 390 844    -> at a phone's size
import { mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { createClassroom } from '../server/app.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { FINGER, measureStep, tabOrder } from './support/creation-geometry.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

/** The Chromebook the school buys, unless the command line says otherwise. */
const SCREEN = { width: Number(process.argv[2]) || 1366, height: Number(process.argv[3]) || 768 };

// A seed whose first household rolls a twenty: two parents and eight children, the largest family the die makes. The
// naming card is the one part of the wizard whose height is the family's, so it is measured at its worst.
const SEED = 'wizard-17';

const app = createClassroom({ seed: SEED, playerCount: 5, tickMs: 250, worldFactory: createGonzalesWorld });
const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
mkdirSync('docs/evidence', { recursive: true });
mkdirSync('test-results', { recursive: true });

const record = [];
const study = async (page, stage, panelSelector, how, endSelector) => {
  // A step's card is drawn on the tick its step arrives, but the page settles on the tick after: the card that was up
  // a moment ago is hidden, and the browser has to put the focus it held somewhere. A student cannot press anything
  // inside a frame, so the page is let settle before it is asked anything - otherwise the instrument reports a flicker.
  await page.waitForTimeout(350);
  const seen = await measureStep(page, panelSelector, endSelector);
  const tab = await tabOrder(page, panelSelector);
  // The end of the step, reached the way a student reaches it: scroll the card to the bottom and ask again. A button a
  // student can scroll to is not a fault; a button that is still not there afterwards is.
  let reached = null;
  if (endSelector) {
    await page.evaluate(sel => { for (const node of [document.querySelector(sel), ...document.querySelectorAll(`${sel} *`)]) if (node) node.scrollTop = node.scrollHeight; }, panelSelector);
    await page.waitForTimeout(120);
    reached = (await measureStep(page, panelSelector, endSelector)).endOfStep;
    await page.evaluate(sel => { for (const node of [document.querySelector(sel), ...document.querySelectorAll(`${sel} *`)]) if (node) node.scrollTop = 0; }, panelSelector);
  }
  // The tab walk above moved focus thirty times. Let it go, so that the next stage's `focusOnArrival` is what the page
  // itself did and not what this instrument did to it.
  await page.evaluate(() => document.activeElement?.blur?.());
  await page.screenshot({ path: `test-results/creation-${SCREEN.width}-${stage}.png` });
  record.push({ stage, how, ...seen, endOfStepScrolledTo: reached, keyboard: tab });
  console.log(`\n${stage} (${how}) - ${panelSelector}`);
  if (!seen.real) { console.log(`  NOT MEASURED: ${panelSelector} is not really on the screen (${JSON.stringify(seen.panelBox)}) - a hidden card overlaps nothing and would read as clean`); return; }
  console.log(`  card ${seen.panelBox.w}x${seen.panelBox.h} at ${seen.panelBox.x},${seen.panelBox.y}; ${seen.controls} controls; ${seen.panelFits ? 'inside the screen' : 'NOT INSIDE THE SCREEN'}${seen.scrolls > 0 ? `; its content runs ${seen.scrolls}px past its own box, which scrolls` : ''}`);
  for (const one of seen.covered) console.log(`  COVERED   ${one.control} "${one.label}" by ${one.by.join(', ')} (${one.blocked} of ${one.points} points${one.centreBlockedBy ? ', centre too' : ', centre clear'})`);
  for (const one of seen.offScreen) console.log(`  OFFSCREEN ${one.control} "${one.label}" at ${one.box.x},${one.box.y} ${one.box.w}x${one.box.h}`);
  for (const one of seen.tooSmallForAFinger) console.log(`  SMALL     ${one.control} "${one.label}" ${one.box.w}x${one.box.h}${one.viaLabel ? ' (its label)' : ''}${one.short > 0 ? `, ${one.short}px short` : ''}${one.narrow > 0 ? `, ${one.narrow}px narrow` : ''}`);
  if (seen.scrolledOutOfTheCard.length) console.log(`  scrolled  ${seen.scrolledOutOfTheCard.length} controls are below the card's fold and come up by scrolling it`);
  if (seen.endOfStep && !seen.endOfStep.inView) console.log(`  BELOW     ${seen.endOfStep.control} "${seen.endOfStep.label}" is ${seen.endOfStep.below}px past the fold as the card opens; ${reached?.inView ? 'scrolling the card brings it up' : 'AND SCROLLING THE CARD DOES NOT BRING IT UP'}`);
  if (seen.pageScrollsSideways > 1) console.log(`  SIDEWAYS  the page scrolls ${seen.pageScrollsSideways}px sideways`);
  if (seen.tightestGap) console.log(`  gap       closest two targets ${seen.tightestGap.gap}px apart (${seen.tightestGap.between.join(' / ')})`);
  console.log(`  announced role=${seen.announced.role} modal=${seen.announced.modal} heading="${seen.announced.heading}" alerts ${seen.announced.errorLine.join(', ') || 'none'}`);
  console.log(`  keyboard  ${tab.escaped ? `FOCUS LEAVES THE CARD to ${tab.escaped}` : 'stays on the card'}; ${seen.behindTheCurtain.length} world controls still drawn behind the curtain`);
  console.log(`  focus     arrives on ${seen.focusOnArrival}${seen.focusOnArrivalInside ? ' (on the card)' : ' - NOT ON THE CARD'}`);
};

try {
  const context = await browser.newContext({ reducedMotion: 'reduce', viewport: SCREEN });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));

  // 1. The title screen, with the class's join form on it.
  await page.goto(url);
  await page.locator('#join').waitFor({ state: 'visible', timeout: 20000 });
  await study(page, 'title-join', '#join', 'the title screen, the join form on it', 'button:not(#rejoin-toggle)');

  // 2. Joined: the title screen's own Begin.
  await page.locator('[name=name]').fill('Chromebook');
  await page.locator('[name=code]').fill(app.state.sessionCode);
  await page.getByRole('button', { name: 'Join', exact: true }).click();
  await page.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-1');
  await page.locator('#creation-begin').waitFor({ state: 'visible', timeout: 30000 });
  await study(page, 'title-begin', '#creation-begin', 'joined, the way in', '#creation-begin-button');

  // 3. The die.
  await page.locator('#creation-begin-button').click();
  await page.locator('#family-roll').waitFor({ state: 'visible', timeout: 20000 });
  await study(page, 'die', '#family-roll', 'the twenty-sided die, before it is rolled', '#roll-family');
  await page.locator('#roll-family').click();
  await page.waitForFunction(() => document.querySelector('#roll-family')?.textContent === 'Meet your family', null, { timeout: 20000 });
  await study(page, 'die-rolled', '#family-roll', 'the die rolled, the family read out', '#roll-family');

  // 4. The last name.
  await page.locator('#roll-family').click();
  await page.locator('#surname').waitFor({ state: 'visible', timeout: 20000 });
  await study(page, 'surname', '#surname', 'the family\'s last name', '#surname-save');
  // The error line, which is what a student meets when they answer it wrongly, and has its own height.
  await page.locator('#surname-input').fill('  ');
  await page.locator('#surname-save').click().catch(() => {});
  await page.waitForTimeout(500);
  await study(page, 'surname-error', '#surname', 'the last name refused', '#surname-save');

  // 5. Everybody's first names - a family of ten, the largest the die makes.
  await page.locator('#surname-input').fill('Navarro');
  await page.locator('#surname-save').click();
  await page.locator('#names').waitFor({ state: 'visible', timeout: 20000 });
  const household = await page.evaluate(async () => (await (await fetch('/api/family')).json()).family.people.length);
  await study(page, 'names', '#names', `everybody's first names, a family of ${household}`, '#names-done');

  // 6. Each parent's looks, one at a time until the box closes of its own accord.
  await page.locator('#names-done').click();
  await page.locator('#looks').waitFor({ state: 'visible', timeout: 20000 });
  for (const which of ['first', 'second', 'third', 'fourth']) {
    if (await page.locator('#looks').isHidden()) break;
    await study(page, `looks-${which}`, '#looks', `the ${which} parent's looks, the list of parts`, '#looks-done');
    const who = await page.locator('#looks').getAttribute('data-entity-id');
    await page.locator('#looks-done').click();
    await page.waitForFunction(id => document.querySelector('#looks').hidden || document.querySelector('#looks').dataset.entityId !== id, who, { timeout: 20000 });
  }

  // 7. The wagon, which follows the wizard.
  await page.locator('#creation').waitFor({ state: 'hidden', timeout: 30000 });
  await page.locator('#wagon-load').waitFor({ state: 'visible', timeout: 30000 }).catch(() => {});
  if (await page.locator('#wagon-load').isVisible()) await study(page, 'wagon', '#wagon-load', 'packing the wagon, after the curtain', '#wagon-done');

  const faults = record.filter(one => one.real).reduce((sum, one) => sum + one.covered.length + one.offScreen.length, 0);
  const small = record.filter(one => one.real).reduce((sum, one) => sum + one.tooSmallForAFinger.length, 0);
  const notMeasured = record.filter(one => !one.real).map(one => one.stage);
  const summary = {
    record: 'creation-overlap', date: new Date().toISOString().slice(0, 10), screen: SCREEN, seed: SEED, finger: FINGER,
    stages: record, notMeasured, pageErrors: errors,
  };
  writeFileSync(`docs/evidence/creation-overlap${SCREEN.width === 1366 ? '' : `-${SCREEN.width}`}.json`, `${JSON.stringify(summary, null, 2)}\n`);
  console.log(`\n${faults} controls covered or off the screen, ${small} under ${FINGER}px, across ${record.length} stages${notMeasured.length ? `; NOT MEASURED: ${notMeasured.join(', ')}` : ''}`);
  console.log(`wrote docs/evidence/creation-overlap${SCREEN.width === 1366 ? '' : `-${SCREEN.width}`}.json`);
} finally {
  await browser.close();
  await app.close();
}
