// What is covering what, on the screen the class of 2026-09-21 played on.
//
// The guided start tells a student to press a particular thing ("press the axe at the bottom of the screen"). That
// sentence is a lie the moment something else is drawn over the axe. The pieces of this interface are positioned
// independently - a strip at the top, a column down the left, a bar across the bottom middle, panels that open at
// left:12px/top:64px, a card that follows a person around the map - and nothing has ever asked whether two of them
// land on the same pixels.
//
// This asks the browser rather than reading the stylesheet: for every control a student can press, sample its own
// points and ask `document.elementFromPoint` what is actually on top there. A control none of whose points belong to
// it is covered, and the thing covering it is named.
//
// Four panels used to be left out of it, and the reason was worth keeping: `#site-choose`, `#survey-choose`,
// `#encounter` and `#call-menu` each want a state the guided-start class never reaches, and an earlier turn of this
// script simply unhid them - an empty panel has almost no height, so it covered nothing and the run read as clean.
// Since 2026-09-21 they are reached with the server's own content in them (scripts/support/panel-states.mjs), on a
// second class on the real land, and each one is asserted to be really drawn before any of its numbers are believed.
//
// Run: node scripts/screen-overlap-study.mjs            -> docs/evidence/screen-overlap.json
//      node scripts/screen-overlap-study.mjs 390 844    -> at a phone's size
import { mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { createClassroom } from '../server/app.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { meetFamily } from './support/meet-family.mjs';
import { measureFourPanels } from './support/panel-states.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

/** The Chromebook the school buys, unless the command line says otherwise. */
const SCREEN = { width: Number(process.argv[2]) || 1366, height: Number(process.argv[3]) || 768 };

/**
 * Everything on the screen that a student is meant to be able to press or read. Deliberately not a list of ids: the
 * question is whether *anything* pressable is covered, including controls added after this was written.
 */
const CONTROLS = 'button:not([hidden]):not(:disabled),.panel-icon,.panel-focus,.panel-name,#lesson-says,#lesson-help';

const app = createClassroom({ seed: 'overlap-1', playerCount: 5, tickMs: 250, worldFactory: createGonzalesWorld });
const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const post = async (path, body, cookie) => {
  const response = await fetch(url + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(cookie && { Cookie: cookie }) }, body: JSON.stringify(body) });
  if (response.status !== 200) throw new Error(`${path}: ${response.status}`);
  return response;
};
mkdirSync('docs/evidence', { recursive: true });
mkdirSync('test-results', { recursive: true });

/** Who is on top at each of a control's own points, and so whether the control is really there to be pressed. */
const coverage = page => page.evaluate(selector => {
  const name = element => {
    if (!element) return 'nothing';
    const id = element.id || element.closest('[id]')?.id;
    return id ? `#${id}` : `${element.tagName.toLowerCase()}.${[...element.classList].join('.') || '?'}`;
  };
  const seen = [];
  for (const control of document.querySelectorAll(selector)) {
    const box = control.getBoundingClientRect();
    if (box.width < 2 || box.height < 2) continue;
    if (getComputedStyle(control).visibility === 'hidden') continue;
    // Off the screen entirely is a different fault, and worth knowing about too.
    const onScreen = box.right > 0 && box.bottom > 0 && box.left < innerWidth && box.top < innerHeight;
    const points = [[box.left + box.width / 2, box.top + box.height / 2],
      [box.left + 3, box.top + 3], [box.right - 3, box.top + 3], [box.left + 3, box.bottom - 3], [box.right - 3, box.bottom - 3]];
    // A panel that dims the map behind it is covering the family on purpose and says so in words (renderPanelBackdrop
    // in public/app.js). That is the answer to this study, not another instance of the fault, so it is counted apart:
    // what is looked for here is a control hidden by something that never admits to hiding it.
    const dimmed = '#panel-backdrop,#house-plan,#house-plot';
    let deliberate = document.body.dataset.panel === 'true';
    const over = points.map(([x, y]) => {
      if (x < 0 || y < 0 || x > innerWidth || y > innerHeight) { deliberate = false; return 'off the screen'; }
      const top = document.elementFromPoint(x, y);
      if (top && (top === control || control.contains(top) || top.contains(control))) return null;
      if (!top || !top.closest(dimmed)) deliberate = false;
      return name(top);
    });
    const blocked = over.filter(Boolean);
    if (!blocked.length && onScreen) continue;
    if (deliberate && blocked.length) { seen.push({ control: name(control), deliberate: true, by: [...new Set(blocked)] }); continue; }
    seen.push({
      control: name(control), label: (control.dataset?.name || control.textContent || '').trim().slice(0, 40),
      box: { x: Math.round(box.x), y: Math.round(box.y), w: Math.round(box.width), h: Math.round(box.height) },
      onScreen, points: points.length, blocked: blocked.length,
      // The centre is the point a finger or a mouse actually goes for.
      centreBlockedBy: over[0], by: [...new Set(blocked)],
    });
  }
  return seen;
}, CONTROLS);

const record = [];
/** The four panels §12.11 left out, once they have been reached in a real state. */
let panels = [];
/** Controls a student cannot press at all, because the browser itself refuses to send the click to them. */
const blocked = [];
const study = async (page, state, how) => {
  const seen = await coverage(page);
  const covered = seen.filter(one => !one.deliberate);
  const dimmed = seen.filter(one => one.deliberate);
  const whole = covered.filter(one => one.blocked === one.points && one.onScreen);
  const partly = covered.filter(one => one.blocked && one.blocked < one.points && one.onScreen);
  const off = covered.filter(one => !one.onScreen);
  record.push({ state, how, covered: whole, partly, offScreen: off, dimmedOnPurpose: dimmed.length });
  await page.screenshot({ path: `test-results/overlap-${state}.png` });
  const say = one => `${one.control}${one.label ? ` "${one.label}"` : ''} under ${one.by.join(', ')}`;
  console.log(`\n${state} (${how})`);
  if (!whole.length && !partly.length && !off.length) console.log(`  nothing covered${dimmed.length ? `; ${dimmed.length} dimmed on purpose behind a panel that says so` : ''}`);
  for (const one of whole) console.log(`  COVERED   ${say(one)}`);
  for (const one of partly) console.log(`  partly    ${say(one)} (${one.blocked} of ${one.points} points${one.centreBlockedBy ? ', centre too' : ', centre clear'})`);
  for (const one of off) console.log(`  OFFSCREEN ${one.control}${one.label ? ` "${one.label}"` : ''} at ${one.box.x},${one.box.y}`);
};

/**
 * The name drawn under an icon during the lesson is a `::before`, so it can cover nothing and nothing can cover it -
 * `elementFromPoint` cannot see it at all. Its box is worked out from the icon's and the pseudo-element's own used
 * width and height, and then asked the two questions that matter: is it still inside the box its parent scrolls, and
 * does it land on top of other furniture.
 */
const labels = page => page.evaluate(() => {
  const boxes = [];
  for (const icon of document.querySelectorAll('.panel-icon[data-pointed=true],.panel-icon[data-active=true]')) {
    const style = getComputedStyle(icon, '::before');
    if (!style.content || style.content === 'none') continue;
    const box = icon.getBoundingClientRect();
    const width = parseFloat(style.width), height = parseFloat(style.height) + parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
    const label = { name: icon.dataset.name || icon.dataset.key, x: Math.round(box.left + box.width / 2 - width / 2), y: Math.round(box.bottom), w: Math.round(width), h: Math.round(height) };
    // Whatever scrolls above it in the page clips it: a scrolling box shows nothing drawn outside its own edges.
    let clipper = null;
    for (let node = icon.parentElement; node && node !== document.body && !clipper; node = node.parentElement) {
      const parent = getComputedStyle(node);
      if (parent.overflowX !== 'visible' || parent.overflowY !== 'visible') {
        const edge = node.getBoundingClientRect();
        // An icon scrolled off the side of a bar that scrolls takes its name with it, which is the bar working. What is
        // looked for is a name cut off while its own icon is in plain view.
        const iconOut = box.left < edge.left - 0.5 || box.right > edge.right + 0.5;
        if (!iconOut && (label.y + label.h > edge.bottom + 0.5 || label.x < edge.left - 0.5 || label.x + label.w > edge.right + 0.5)) {
          clipper = { element: node.id ? `#${node.id}` : `.${[...node.classList].join('.')}`, overflow: `${parent.overflowX}/${parent.overflowY}`, edge: { bottom: Math.round(edge.bottom), left: Math.round(edge.left), right: Math.round(edge.right) } };
        }
        if (iconOut) label.iconScrolledOutOfView = true;
      }
      // A box fixed to the screen is not inside anything that scrolls above it: the walk stops there, or every icon
      // reads as clipped by the column it belongs to in the page and is not drawn in. (Barring an ancestor that makes
      // a containing block for it - a transform or a filter - which nothing on this page has.)
      if (parent.position === 'fixed') break;
    }
    const lands = [...document.querySelectorAll('#map-nav,#ending-open,#selection,#tutorial,#encounter,#lesson')]
      .filter(one => !one.hidden && one.getBoundingClientRect().width > 2)
      .filter(one => { const other = one.getBoundingClientRect(); return label.x < other.right && label.x + label.w > other.left && label.y < other.bottom && label.y + label.h > other.top; })
      .map(one => `#${one.id}`);
    boxes.push({ ...label, offScreen: label.y + label.h > innerHeight, clippedBy: clipper, over: lands });
  }
  return boxes;
});

/** A box that scrolls clips anything drawn outside it, pseudo-elements included. Asked of the icon bar's own ancestors. */
const clipping = page => page.evaluate(() => {
  const icon = document.querySelector('.panel-row[data-focused=true] .panel-icon');
  if (!icon) return null;
  const out = [];
  for (let node = icon.parentElement; node && node !== document.body; node = node.parentElement) {
    const style = getComputedStyle(node);
    if (style.overflowX !== 'visible' || style.overflowY !== 'visible') out.push({ element: node.id ? `#${node.id}` : `.${[...node.classList].join('.')}`, overflowX: style.overflowX, overflowY: style.overflowY });
  }
  const box = icon.getBoundingClientRect();
  return { clippedBy: out, roomBelow: Math.round(innerHeight - box.bottom), roomAbove: Math.round(box.top) };
});

try {
  const host = await post('/api/host', { key: app.state.hostKey });
  const hostCookie = host.headers.get('set-cookie').split(';')[0];
  const context = await browser.newContext({ reducedMotion: 'no-preference', viewport: SCREEN });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));

  await page.goto(url);
  await page.locator('[name=name]').fill('Chromebook');
  await page.locator('[name=code]').fill(app.state.sessionCode);
  await page.getByRole('button', { name: 'Join', exact: true }).click();
  await page.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-1');
  for (let i = 2; i <= 5; i++) await post('/api/join', { name: `Reader ${i}`, code: app.state.sessionCode });
  await meetFamily(page);
  if (await page.locator('#wagon-done').isVisible()) await page.locator('#wagon-done').click();
  if (await page.locator('#tutorial-skip').isVisible()) await page.locator('#tutorial-skip').click();
  await page.locator('#family-panel').waitFor({ state: 'visible', timeout: 30000 });
  await post('/api/command', { id: 'cmd-start', action: 'start', anyway: true }, hostCookie);
  await page.waitForFunction(() => window.__snapshot?.world.status === 'running', null, { timeout: 20000 });
  await page.waitForFunction(() => document.querySelector('.panel-row[data-focused=true] .panel-icon:not([aria-disabled=true])'), null, { timeout: 60000 });

  // The state a student is in for the whole guided start: the strip at the top, the bar at the bottom, the column down
  // the left. Nothing opened, nothing pressed.
  await study(page, 'guided-start', 'the real server, the real lesson, nothing opened');

  // The card that follows a person about the map, which is what pressing a portrait does.
  await page.locator('.panel-portrait').first().click().catch(() => {});
  await page.waitForTimeout(600);
  await study(page, 'person-card', 'a portrait pressed, the card open where the page puts it');
  await page.locator('#selection-close').click().catch(() => {});

  // Choosing a house: the panel that opens at the top left, over whatever was there.
  if (await page.locator('#house-open').isVisible()) {
    // Pressing it the way a student does, which is the whole question: a control that something else is drawn over is
    // not a control. Playwright refuses a click that would land on another element, and says which one.
    let reached = 'the real "Choose a house" button pressed';
    try {
      await page.locator('#house-open').click({ timeout: 8000 });
    } catch (error) {
      const over = /<([a-z]+) id="([^"]+)"[^>]*>[^<]*<\/\1> from <([a-z]+) id="([^"]+)"/.exec(error.message);
      reached = `THE BUTTON COULD NOT BE PRESSED: ${over ? `#${over[4]} is drawn over it` : 'something is drawn over it'}`;
      console.log(`\n  ${reached}`);
      blocked.push({ control: '#house-open', at: SCREEN, by: over ? `#${over[4]}` : 'unknown' });
      await page.locator('#house-open').click({ force: true, timeout: 8000 }).catch(() => {});
      reached = `${reached}; opened anyway to measure what it covers`;
    }
    await page.waitForTimeout(500);
    await study(page, 'house-plan', reached);
    await page.locator('#house-close').click({ force: true }).catch(() => {});
    await page.waitForTimeout(300);
  }

  const drawn = await labels(page);
  console.log('');
  for (const label of drawn) console.log(`  label "${label.name}" at ${label.x},${label.y} ${label.w}x${label.h}: ${label.clippedBy ? `CLIPPED by ${label.clippedBy.element} (${label.clippedBy.overflow}, its bottom ${label.clippedBy.edge.bottom})` : label.iconScrolledOutOfView ? 'its icon is scrolled out of the bar, and the name goes with it' : 'not clipped'}${label.offScreen ? ', OFF THE BOTTOM' : ''}${label.over.length ? `, drawn over ${label.over.join(', ')}` : ''}`);

  const clipped = await clipping(page);
  console.log(`\nthe bar's own box: ${clipped.clippedBy.length ? `clipped by ${clipped.clippedBy.map(one => `${one.element} (${one.overflowX}/${one.overflowY})`).join(', ')}` : 'clips nothing'}; ${clipped.roomBelow}px below an icon, ${clipped.roomAbove}px above`);

  // "Resume tutorial" (owner, 2026-09-22): the X pressed and confirmed, the strip gone, and the small button standing
  // where it was for five real minutes. Measured last on this class, because the X is what gets it there.
  if (await page.locator('#lesson-stop').isVisible()) {
    await page.locator('#lesson-stop').click();
    await page.locator('#lesson-stop-yes').click();
    await page.locator('#lesson-resume').waitFor({ state: 'visible', timeout: 20000 });
    await page.waitForTimeout(400);
    await study(page, 'resume-offered', 'the X pressed and confirmed; "Resume tutorial" where the strip was');
  } else console.log('\n  resume-offered NOT REACHED: there was no X to press');

  // --------------------------------------------------------------- the four panels this study could not reach honestly
  // `#site-choose`, `#survey-choose`, `#encounter` and `#call-menu` want a state the class above never gets to. An
  // earlier turn of this script simply unhid them: an empty panel has almost no height, so it covered nothing and the
  // run read as clean, which is worse than not asking. They are reached with the server's own content in them now
  // (scripts/support/panel-states.mjs), and every one of them is asserted to be really drawn before its numbers are
  // believed. The class is a different one - on the **real land**, played to the morning the settlement's call arrives -
  // because three of the four only exist there.
  panels = await measureFourPanels(browser, SCREEN);
  for (const one of panels) {
    console.log(`\n${one.state} (${one.how})`);
    if (!one.measured.real) { console.log(`  NOT REACHED: ${one.panel} is not drawn, or is too small to be a panel (${JSON.stringify(one.measured.panelBox)}) - nothing below this is a measurement`); continue; }
    const say = entry => `${entry.control}${entry.label ? ` "${entry.label}"` : ''} under ${entry.by.join(', ')}`;
    console.log(`  ${one.panel} is ${one.measured.panelBox.w}x${one.measured.panelBox.h} at ${one.measured.panelBox.x},${one.measured.panelBox.y}, ${one.measured.ownControls} controls of its own, ${one.measured.panelFits ? 'wholly on the screen' : 'OFF THE SCREEN'}`);
    for (const [what, against] of Object.entries(one.measured.against)) {
      if (against?.shares) console.log(`  shares ${against.overlapWidth}x${against.overlapHeight}px with the ${what} (${JSON.stringify(against.box)})`);
    }
    for (const entry of one.measured.covered) console.log(`  COVERED   ${say(entry)}`);
    for (const entry of one.measured.partly) console.log(`  partly    ${say(entry)} (${entry.blocked} of ${entry.points} points${entry.centreBlockedBy ? ', centre too' : ', centre clear'})`);
    for (const entry of one.measured.offScreen) console.log(`  OFFSCREEN ${entry.control} "${entry.label}" at ${entry.box.x},${entry.box.y}`);
    if (one.measured.ownControlsCovered.length) console.log(`  ITS OWN CONTROLS COVERED: ${one.measured.ownControlsCovered.join(', ')}`);
    if (!one.measured.covered.length && !one.measured.partly.length && !one.measured.offScreen.length) console.log('  nothing covered');
  }

  const summary = {
    record: 'screen-overlap', date: new Date().toISOString().slice(0, 10), screen: SCREEN,
    controls: CONTROLS, states: record, bar: clipped, labels: drawn, unpressable: blocked, pageErrors: errors,
    fourPanels: panels,
  };
  writeFileSync(`docs/evidence/screen-overlap${SCREEN.width === 1366 ? '' : `-${SCREEN.width}`}.json`, `${JSON.stringify(summary, null, 2)}\n`);
  const total = record.reduce((sum, one) => sum + one.covered.length, 0);
  const panelTotal = panels.reduce((sum, one) => sum + (one.measured.real ? one.measured.covered.length : 0), 0);
  const unreached = panels.filter(one => !one.measured.real).map(one => one.panel);
  console.log(`\n${total} controls wholly covered across ${record.length} states; ${panelTotal} across the four panels${unreached.length ? `, of which ${unreached.join(', ')} WERE NOT REACHED and prove nothing` : ' (all four really drawn)'}`);
  console.log(`wrote docs/evidence/screen-overlap${SCREEN.width === 1366 ? '' : `-${SCREEN.width}`}.json`);
} finally {
  await browser.close();
  await app.close();
}
