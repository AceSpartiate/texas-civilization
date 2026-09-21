// How much of a Chromebook screen the game's own chrome covers, and what is left for the map.
//
// The class of 2026-09-21 played this on Chromebooks and the first thing said about it was that the interface covered too
// much of the screen. That is a number, not an opinion, so it is measured: at 1366x768 - the Chromebook the school buys -
// every part of the page that paints over the map is rasterised into the viewport and the covered pixels are counted. The
// union is counted, not the sum, so two panels that overlap are not charged twice.
//
// It is deliberately a *list* of the parts rather than "everything inside the stage": the HUD columns are transparent flex
// boxes whose bounding box includes the gaps between their children, and charging those gaps to the interface would flatter
// the after by the same amount it flattered the before. What is charged is what paints.
//
// Run: node scripts/screen-measure.mjs [label]   -> writes docs/evidence/screen-measure-<label>.json and two screenshots.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createClassroom } from '../server/app.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { meetFamily } from './support/meet-family.mjs';
import { holdLesson, installLessonStub, stubStep } from './support/lesson-stub.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const label = process.argv[2] || 'now';
/** The Chromebook the school buys. Everything below is measured at this size and no other. */
const SCREEN = { width: 1366, height: 768 };

/**
 * Every part of the page that paints over the map. A container that paints nothing (the HUD columns, the rows list) is not
 * here: its children are.
 */
const PARTS = [
  '#session', '#world', '#food', '#supplies', '#connection', '#wagon-open', '#house-open',
  '.panel-row .panel-portrait', '.panel-row .panel-body', '.panel-icons', '.panel-attention',
  '#family-collapse', '#lesson', '#tutorial', '#selection', '#panel-tip', '#call-menu', '#encounter',
  '#map-tools', '#host-controls', '#host-pace', '#recover', '#join-links', '#error', '#host-live', '#host-spotlight',
  '#wagon-load', '#house-plan', '#house-plot', '#survey-choose', '#site-choose', '#family-roll',
];

const app = createClassroom({ seed: 'panel-3', playerCount: 5, tickMs: 250, worldFactory: createGonzalesWorld });
const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
mkdirSync('test-results', { recursive: true });
mkdirSync('docs/evidence', { recursive: true });

/** The covered share of the screen, rasterised so overlapping panels are counted once. */
const coverage = async page => page.evaluate(({ parts, screen }) => {
  const seen = new Uint8Array(screen.width * screen.height);
  const boxes = [];
  for (const selector of parts) {
    for (const node of document.querySelectorAll(selector)) {
      if (node.hidden || node.closest('[hidden]')) continue;
      const style = getComputedStyle(node);
      if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) continue;
      const box = node.getBoundingClientRect();
      if (box.width < 1 || box.height < 1) continue;
      const left = Math.max(0, Math.floor(box.left)), top = Math.max(0, Math.floor(box.top));
      const right = Math.min(screen.width, Math.ceil(box.right)), bottom = Math.min(screen.height, Math.ceil(box.bottom));
      if (right <= left || bottom <= top) continue;
      boxes.push({ selector, x: Math.round(box.x), y: Math.round(box.y), w: Math.round(box.width), h: Math.round(box.height) });
      for (let y = top; y < bottom; y++) for (let x = left; x < right; x++) seen[y * screen.width + x] = 1;
    }
  }
  let covered = 0;
  for (let i = 0; i < seen.length; i++) covered += seen[i];
  // How far into the screen the left-hand furniture reaches - the thing a student sitting in front of it actually feels,
  // because it is the width taken off the map for the whole of its height. Only what is anchored to the left gutter counts;
  // the ability bar is centred at the bottom and is not a column.
  const leftMost = boxes.filter(box => box.x < 40).reduce((most, box) => Math.max(most, box.x + box.w), 0);
  return { covered, share: covered / (screen.width * screen.height), boxes, leftColumnWidth: Math.round(leftMost) };
}, { parts: PARTS, screen: SCREEN });

const record = { record: 'screen-measure', label, date: new Date().toISOString().slice(0, 10), screen: SCREEN, browser: await browser.version(), scenes: {} };
try {
  const context = await browser.newContext({ reducedMotion: 'reduce', viewport: SCREEN });
  // The lesson the server will send (scripts/support/lesson-stub.mjs). Installed but not held: the scenes below are the
  // page without one until the last, which is the page with one.
  try { await installLessonStub(context); } catch { /* a build before the stub */ }
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url);
  await page.locator('[name=name]').fill('Chromebook');
  await page.locator('[name=code]').fill(app.state.sessionCode);
  await page.getByRole('button', { name: 'Join', exact: true }).click();
  await page.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-1');
  await meetFamily(page);
  if (await page.locator('#wagon-done').isVisible()) await page.locator('#wagon-done').click();
  await page.locator('#family-panel').waitFor({ state: 'visible', timeout: 30000 });
  await page.waitForTimeout(1200);

  // The lobby, as a student first sees it: the family panel, the status lines, the map buttons and whatever walk-through is up.
  record.scenes.lobby = await coverage(page);
  await page.screenshot({ path: `test-results/screen-${label}-lobby.png` });

  // A person chosen and their card open beside them: the busiest the screen gets in ordinary play.
  const first = await page.evaluate(() => document.querySelector('.panel-portrait')?.dataset.portrait);
  if (first) {
    await page.locator(`.panel-portrait[data-portrait="${first}"]`).click();
    await page.waitForTimeout(900);
  }
  record.scenes.chosen = await coverage(page);
  await page.screenshot({ path: `test-results/screen-${label}-chosen.png` });

  // The guided start running, which is what a student who has just joined will see: the strip instead of the walk-through
  // card. Skipped on a build that has neither, so the "before" and the "after" are read from the same script.
  if (await page.evaluate(() => typeof window.__render === 'function')) {
    // A step whose one open action is one the server is really offering this family now, so the scene is the scene a
    // student meets rather than a stub arguing with the world.
    const open = await page.evaluate(() => document.querySelector('.panel-row[data-focused=true] .panel-icon:not([aria-disabled=true])[data-action=chore]')?.dataset.key || null);
    const step = stubStep(2, 'Your family reached their land.');
    await holdLesson(page, open ? { ...step, allow: [`chore:${open}`] } : step);
    await page.waitForTimeout(700);
    record.scenes.lesson = await coverage(page);
    await page.screenshot({ path: `test-results/screen-${label}-lesson.png` });
    // And with nobody chosen, which is what a student who has not pressed a face sees: the strip, the rows and the bar,
    // and no card at all. Both are recorded because the card is a quarter of the right of the screen and whether it is
    // open is the student's doing, not the interface's.
    if (await page.locator('#selection-close').isVisible()) {
      await page.locator('#selection-close').click();
      await page.waitForTimeout(500);
      record.scenes.lessonNoCard = await coverage(page);
      await page.screenshot({ path: `test-results/screen-${label}-lesson-no-card.png` });
    }
    await holdLesson(page, 'none').catch(() => holdLesson(page, null));
  }
  record.pageErrors = errors;
  for (const [name, scene] of Object.entries(record.scenes)) {
    console.log(`${label} ${name}: ${(scene.share * 100).toFixed(1)}% of 1366x768 covered; the left column reaches ${scene.leftColumnWidth}px`);
  }
  assert.deepEqual(errors, [], `page errors: ${errors.join(' | ')}`);
  writeFileSync(`docs/evidence/screen-measure-${label}.json`, `${JSON.stringify(record, null, 2)}\n`);
  console.log(`wrote docs/evidence/screen-measure-${label}.json`);
} finally {
  await browser.close();
  await app.close();
}
