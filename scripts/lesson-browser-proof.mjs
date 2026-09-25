// The screen the class of 2026-09-21 asked for, in a real browser at the size they played it: 1366x768.
//
// The owner, after that class: "the ui covered too much of their screen. the abilities for each character needs to be
// hidden unless they're selected as the main. their abilities should be bottom middle of the screen and spaced out in such
// a way as to maximize the visibility of the screen", and "we need to have the tutorial be an integrated forced part of
// the game ... one task at a time, guided by the ui and unavoidable."
//
// tests/lesson-screen.test.mjs proves the rules of the guided start against the simulation and holds them down with
// injections. What only a browser can show is here: that the bar really is at the bottom middle, that another person's
// work really is off the screen until they are the main one, that a step really does shut the rest of the bar and ring
// the one thing to do, that a shut icon sends nothing, and that the keyboard still reaches all of it.
//
// The lesson is stubbed (scripts/support/lesson-stub.mjs) because `projectWorld` does not carry `world.lesson` yet; the
// contract is the one being built to and the page reads it and adds nothing.
//
// Run: npm run test:lesson
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createClassroom } from '../server/app.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { meetFamily } from './support/meet-family.mjs';
import { holdLesson, installLessonStub, stubStep } from './support/lesson-stub.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const pass = [];
const ok = label => { pass.push(label); console.log('PASS', label); };
const measured = {};
/** The Chromebook the school buys, which is the screen this whole record is about. */
const SCREEN = { width: 1366, height: 768 };
const shots = [];
const shoot = async (page, name) => { const path = `test-results/lesson-${name}.png`; await page.screenshot({ path }); shots.push(path); };
/**
 * The X on the strip (owner, 2026-09-22), measured where it stands: big enough to press on a Chromebook (32px at the
 * least), inside the strip, on no word of it, and the thing a press at its centre actually reaches.
 */
let xPage = null;
const xOnTheStrip = async where => {
  const x = await xPage.evaluate(() => {
    const box = one => { const r = one.getBoundingClientRect(); return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height }; };
    const button = document.querySelector('#lesson-stop'), strip = document.querySelector('#lesson');
    const at = box(button), around = box(strip);
    // The words themselves, not their boxes: the eyebrow and title are padded clear of the X, so their boxes reach under it.
    const words = ['#lesson-step', '#lesson-title', '#lesson-says', '#lesson-help', '#lesson-action', '#lesson-did'].flatMap(selector => {
      const node = document.querySelector(selector);
      if (!node || node.hidden || !node.textContent.trim()) return [];
      const range = document.createRange(); range.selectNodeContents(node);
      return [...range.getClientRects()].map(rect => ({ selector, left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom }));
    });
    const on = words.filter(word => word.left < at.right && at.left < word.right && word.top < at.bottom && at.top < word.bottom).map(word => word.selector);
    const hit = document.elementFromPoint(at.left + at.width / 2, at.top + at.height / 2);
    return { size: [Math.round(at.width), Math.round(at.height)], inside: at.left >= around.left && at.right <= around.right && at.top >= around.top && at.bottom <= around.bottom,
      on, reached: hit === button || button.contains(hit), name: button.getAttribute('aria-label') };
  });
  assert.ok(x.size[0] >= 32 && x.size[1] >= 32, `at ${where} the X is ${x.size.join('x')}px, smaller than a Chromebook target`);
  assert.equal(x.inside, true, `at ${where} the X hangs outside the strip`);
  assert.deepEqual(x.on, [], `at ${where} the X is drawn on the words of ${x.on.join(', ')}`);
  assert.equal(x.reached, true, `at ${where} something else is drawn over the X`);
  assert.equal(x.name, 'Stop the guided start');
  ok(`at ${where} the X is ${x.size.join('x')}px, inside the strip, on no word, reachable, and named "${x.name}"`);
  return x;
};

/**
 * "Resume tutorial" (owner, 2026-09-22), measured where it stands: a Chromebook target, wholly on the screen, reachable at
 * its centre, and drawn over no other control, card or word - nor under one.
 */
const resumeClear = async (page, where) => {
  const found = await page.evaluate(() => {
    const button = document.querySelector('#lesson-resume');
    const r = button.getBoundingClientRect();
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    const others = [...document.querySelectorAll('button,.panel-icon,.panel-portrait,#military-notice,#map-nav,#error,#family-panel,#selection,#site-choose,#survey-choose,#house-plan,#house-plot,#encounter,#call-menu,#tutorial')]
      .filter(one => one !== button && !button.contains(one) && !one.contains(button) && !one.closest('[hidden]'))
      .map(one => ({ one, box: one.getBoundingClientRect() }))
      .filter(({ box }) => box.width > 1 && box.height > 1 && box.left < r.right && r.left < box.right && box.top < r.bottom && r.top < box.bottom)
      .map(({ one }) => one.id ? `#${one.id}` : `${one.tagName.toLowerCase()}.${[...one.classList].join('.')}`);
    return { size: [Math.round(r.width), Math.round(r.height)], at: [Math.round(r.left), Math.round(r.top)],
      onScreen: r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight,
      reached: hit === button || button.contains(hit), shares: others, text: button.textContent.trim() };
  });
  assert.equal(found.text, 'Resume tutorial');
  assert.ok(found.size[1] >= 32, `at ${where} "Resume tutorial" is ${found.size.join('x')}px, smaller than a Chromebook target`);
  assert.equal(found.onScreen, true, `at ${where} "Resume tutorial" hangs off the screen`);
  assert.equal(found.reached, true, `at ${where} something is drawn over "Resume tutorial"`);
  assert.deepEqual(found.shares, [], `at ${where} "Resume tutorial" shares pixels with ${found.shares.join(', ')}`);
  ok(`at ${where} "Resume tutorial" is ${found.size.join('x')}px at ${found.at.join(',')}, on the screen, reachable, and on nothing else`);
  return found;
};

// The server's real clock, which the guided start's five minutes are measured on (sim/lesson.mjs `LESSON_RESUME_MS`),
// held here so the proof can move it past the window's end rather than wait five minutes.
let clockShift = 0;
const app = createClassroom({ seed: 'panel-3', playerCount: 5, tickMs: 250, worldFactory: createGonzalesWorld, now: () => Date.now() + clockShift });
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
  const context = await browser.newContext({ reducedMotion: 'no-preference', viewport: SCREEN });
  await installLessonStub(context);
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  xPage = page;

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
  // A class that is running, so the server really offers work: the whole point is that nobody meets a refusal.
  await post('/api/command', { id: 'cmd-start', action: 'start', anyway: true }, hostCookie);
  await page.waitForFunction(() => window.__snapshot?.world.status === 'running', null, { timeout: 20000 });
  await page.waitForFunction(() => document.querySelector('.panel-row[data-focused=true] .panel-icon:not([aria-disabled=true])'), null, { timeout: 60000 });

  // ---------------------------------------------------------------------------- the bar is the main person's, bottom middle
  const barOf = () => page.evaluate(() => {
    const group = document.querySelector('.panel-row[data-focused=true] .panel-icons');
    const box = group.getBoundingClientRect();
    const icons = [...group.querySelectorAll('.panel-icon')].map(icon => icon.getBoundingClientRect());
    const gaps = icons.slice(1).map((one, at) => Math.round(one.left - icons[at].right)).filter(gap => gap >= 0);
    return {
      entityId: group.closest('.panel-row').dataset.entityId,
      centre: Math.round(box.left + box.width / 2), width: Math.round(box.width),
      fromBottom: Math.round(innerHeight - box.bottom), rows: new Set(icons.map(one => Math.round(one.top))).size,
      count: icons.length, smallestGap: gaps.length ? Math.min(...gaps) : null, iconSize: icons.length ? Math.round(icons[0].width) : 0,
      // How much of the screen the bar itself takes, which is what "maximise the visibility of the screen" is about.
      share: Math.round(box.width * box.height / (innerWidth * innerHeight) * 1000) / 10,
      // How many groups of icons have a box on the screen at all. One bar means one group; a second anywhere is a second
      // bar to a student, however the page got there (2026-09-21: nineteen icons wrapped to 16 + 3 and read as two).
      groupsOnScreen: [...document.querySelectorAll('.panel-icons')].filter(one => one.getBoundingClientRect().width > 0).length,
    };
  });
  const focusedId = await page.evaluate(() => document.querySelector('.panel-row[data-focused=true]').dataset.entityId);
  const bar = await barOf();
  measured.bar = bar;
  assert.equal(bar.entityId, focusedId);
  assert.ok(Math.abs(bar.centre - SCREEN.width / 2) <= 2, `the bar is not middle: centred at ${bar.centre} of ${SCREEN.width}`);
  assert.ok(bar.fromBottom > 0 && bar.fromBottom < SCREEN.height / 4, `the bar is not at the bottom: ${bar.fromBottom}px up`);
  assert.ok(bar.smallestGap >= 4 || bar.smallestGap === null, `the icons overlap: the smallest gap is ${bar.smallestGap}px`);
  assert.ok(bar.iconSize >= 44, `an icon is smaller than a fingertip: ${bar.iconSize}px`);
  assert.ok(bar.rows <= 2, `the bar uses ${bar.rows} rows of icons`);
  assert.equal(bar.groupsOnScreen, 1, `${bar.groupsOnScreen} groups of icons are on the screen at once`);
  ok(`the main person's available work is bottom middle at 1366x768: ${bar.count} icons on ${bar.rows} rows, centred at ${bar.centre}, ${bar.fromBottom}px up, ${bar.iconSize}px each, ${bar.share}% of the screen`);

  // Nobody else's work is on the screen at all.
  const elsewhere = await page.evaluate(id => [...document.querySelectorAll('.panel-icon')]
    .filter(icon => icon.dataset.entityId !== id && icon.getBoundingClientRect().width > 0).length, focusedId);
  measured.otherPeopleIconsOnScreen = elsewhere;
  assert.equal(elsewhere, 0, `${elsewhere} icons belonging to somebody who is not the main person are on the screen`);
  ok('a person who is not the main one has no work on the screen');
  await shoot(page, 'bar');

  // ------------------------------------------------------------------------------- choosing another main person moves it
  const other = await page.evaluate(id => [...document.querySelectorAll('.panel-row')].map(row => row.dataset.entityId)
    .find(one => one !== id && document.querySelector(`.panel-row[data-entity-id="${one}"] .panel-focus`)), focusedId);
  await page.locator(`.panel-focus[data-focus="${other}"]`).click();
  await page.waitForFunction(id => document.querySelector('.panel-row[data-focused=true]')?.dataset.entityId === id, other, { timeout: 15000 });
  const moved = await barOf();
  assert.equal(moved.entityId, other);
  assert.ok(Math.abs(moved.centre - SCREEN.width / 2) <= 2, 'the bar left the middle when the main person changed');
  ok(`the star moves the bar: it is now ${moved.entityId}'s ${moved.count} icons, still centred at ${moved.centre}`);
  await page.locator(`.panel-focus[data-focus="${focusedId}"]`).click();
  await page.waitForFunction(id => document.querySelector('.panel-row[data-focused=true]')?.dataset.entityId === id, focusedId, { timeout: 15000 });

  // ------------------------------------------------------------------------------------------------- the guided start
  // **The server's own lesson, before any stub touches it.** Both halves of the guided start were built at once, in two
  // worktrees, against the contract in docs/LESSON.md; this is the first place they meet. What is held here is that the
  // page draws the step the *server* sent - step one of ten, the arrival - and not a shape the page made up.
  await page.locator('#lesson').waitFor({ state: 'visible', timeout: 15000 });
  const served = await page.evaluate(() => ({
    step: document.querySelector('#lesson-step').textContent,
    title: document.querySelector('#lesson-title').textContent,
    says: document.querySelector('#lesson-says').textContent,
    pips: document.querySelectorAll('#lesson-pips .lesson-pip').length,
  }));
  // Whichever step the class has actually reached - this proof's own setup walks the family in and chooses its house
  // site, which finishes the first step - but it must be one of the ten and it must be the server's.
  const reached = /STEP\s*(\d+)\s*OF\s*(\d+)/i.exec(served.step);
  assert.ok(reached, `the step the server sent read "${served.step}"`);
  assert.ok(Number(reached[1]) >= 1 && Number(reached[1]) <= 10, `the class is on step ${reached[1]}`);
  assert.equal(Number(reached[2]), 10, 'the lesson is not ten steps long');
  assert.equal(served.pips, 10, 'the server sent ten steps and the page drew a different number of pips');
  assert.ok(served.title.length > 0 && served.says.length > 0, 'the step the server sent arrived with no words on it');
  ok(`the server's own lesson is on the screen: "${served.step} - ${served.title}"`);

  // And with no lesson at all - a family already on its land, or a class that has finished the ten - nothing is drawn.
  await holdLesson(page, 'none');
  await page.waitForFunction(() => document.querySelector('#lesson').hidden, null, { timeout: 10000 });
  ok('no lesson, nothing drawn');
  const open = await page.evaluate(() => document.querySelector('.panel-row[data-focused=true] .panel-icon:not([aria-disabled=true])[data-action=chore]')?.dataset.key);
  assert.ok(open, 'the server offers this family no work, so this proof would prove nothing');
  const step = { ...stubStep(2, 'Your family reached their land.'), allow: [`chore:${open}`] };
  await holdLesson(page, step);
  await page.locator('#lesson').waitFor({ state: 'visible', timeout: 10000 });
  measured.strip = await page.evaluate(() => {
    const strip = document.querySelector('#lesson'), box = strip.getBoundingClientRect();
    return {
      step: document.querySelector('#lesson-step').textContent, title: document.querySelector('#lesson-title').textContent,
      says: document.querySelector('#lesson-says').textContent, did: document.querySelector('#lesson-did').textContent,
      read: document.querySelector('#lesson-read').textContent,
      pips: document.querySelectorAll('#lesson-pips .lesson-pip').length, filled: document.querySelectorAll('#lesson-pips .lesson-pip[data-done=true]').length,
      // The X and its question (owner, 2026-09-22) stop the whole guided start and are counted apart: they finish no step.
      buttons: [...strip.querySelectorAll('button,input,select,a')].filter(one => !one.classList.contains('lesson-stop-control')).length,
      centre: Math.round(box.left + box.width / 2), share: Math.round(box.width * box.height / (innerWidth * innerHeight) * 1000) / 10,
    };
  });
  assert.equal(measured.strip.step, 'STEP 2 OF 10');
  assert.equal(measured.strip.title, step.title);
  assert.equal(measured.strip.says, step.says);
  assert.equal(measured.strip.did, 'Your family reached their land.');
  assert.equal(measured.strip.pips, 10);
  assert.equal(measured.strip.filled, 1);
  // The one rule the strip exists to keep: only the world says a step is finished, so there is nothing here to press.
  assert.equal(measured.strip.buttons, 1, 'the guide has one navigation control');
  const commands = [];
  const capture = request => { if (request.url().endsWith('/api/command')) commands.push(request.postDataJSON()); };
  page.on('request', capture);
  await page.locator('#lesson-action').click();
  await page.waitForFunction(key => document.activeElement?.dataset.key === key, open);
  page.off('request', capture);
  assert.ok(commands.every(command => command.action === 'set-main'), 'the guide issued work or advanced a step');
  assert.equal(await page.locator('#lesson-step').textContent(), 'STEP 2 OF 10');
  ok('the guide selects the person and focuses the named action without issuing work or skipping the lesson');
  assert.match(measured.strip.read, /STEP 2 OF 10\./);
  ok(`the step keeps the server's words and a navigation control: "${measured.strip.title}" - ${measured.strip.says} (${measured.strip.share}% of the screen)`);
  // The old, skippable walk-through is not offered underneath it.
  assert.equal(await page.locator('#tutorial').isHidden(), true, 'the skippable walk-through is offered under the lesson');
  ok('the skippable walk-through is put away while the class is being led');

  // The bar: one thing open, everything else plainly shut.
  measured.step = await page.evaluate(() => [...document.querySelectorAll('.panel-row[data-focused=true] .panel-icon')].map(icon => ({
    key: icon.dataset.key, shut: icon.dataset.shut === 'true', pointed: icon.dataset.pointed === 'true', active: icon.dataset.active === 'true',
    pressable: icon.getAttribute('aria-disabled') !== 'true', opacity: Number(getComputedStyle(icon.querySelector('canvas')).opacity),
  })));
  const pressable = measured.step.filter(icon => icon.pressable);
  assert.deepEqual(pressable.map(icon => icon.key), [open], `more than the step's own work can be pressed: ${pressable.map(one => one.key)}`);
  assert.deepEqual(measured.step.filter(icon => icon.pointed).map(icon => icon.key), [open]);
  assert.equal(measured.step.filter(icon => (icon.shut || !icon.pressable) && !icon.active).length, 0, `unavailable icons remain in the action bar: ${JSON.stringify(measured.step)}`);
  ok(`the step shows only ${measured.step.length} available actions and rings the requested one`);

  // **Nothing stands on the step.** While a step is running the strip is the one thing that has to be readable, and the
  // card beside a person was being pushed up under it: the guided start was counted among the controls the card has to
  // stay above, and it is overhead, not underfoot (2026-09-21). And the card's own journey block - three stamps, a
  // paragraph and a list of neighbours, 250 px of the right of a Chromebook screen - is put away while the step starts
  // nobody on a road.
  await page.locator(`.panel-portrait[data-portrait="${focusedId}"]`).click();
  await page.locator('#selection').waitFor({ state: 'visible', timeout: 10000 });
  await page.waitForTimeout(500);
  const cardNow = () => page.evaluate(() => {
    const box = node => { const one = node?.getBoundingClientRect(); return one && one.width ? { left: Math.round(one.left), top: Math.round(one.top), right: Math.round(one.right), bottom: Math.round(one.bottom) } : null; };
    const shown = selector => Boolean(box(document.querySelector(selector))?.bottom);
    const card = box(document.querySelector('#selection')), strip = box(document.querySelector('#lesson'));
    const over = card && strip && card.left < strip.right && strip.left < card.right && card.top < strip.bottom && strip.top < card.bottom;
    return { card, strip, over, goingBy: Boolean(document.querySelector('#selection-travel')), visitShown: shown('#visit-row'), more: document.querySelector('#selection-more')?.textContent || null,
      share: card ? Math.round((card.right - card.left) * (card.bottom - card.top) / (innerWidth * innerHeight) * 1000) / 10 : 0 };
  });
  measured.card = { folded: await cardNow() };
  assert.equal(measured.card.folded.over, false, `the card stands on the step: card ${JSON.stringify(measured.card.folded.card)}, strip ${JSON.stringify(measured.card.folded.strip)}`);
  // How they go is asked when they are sent since 2026-09-24 (public/going.js), so the card has no "Going by" at all.
  assert.equal(measured.card.folded.goingBy, false, 'the old "Going by" block is still on the card');
  assert.equal(measured.card.folded.visitShown, false, 'the neighbours list is open on the card while a step is running');
  assert.ok(measured.card.folded.more, 'nothing on the card says how to get the folded part back');
  // **Folded, not shut.** The server allows `travel` on every step of the lesson on purpose (`ALWAYS` in sim/lesson.mjs),
  // so what the card puts away has to be one press from coming back, or the page would be stopping what the world permits.
  await page.locator('#selection-more').click();
  await page.waitForFunction(() => document.querySelector('#visit-row')?.getBoundingClientRect().height > 0, null, { timeout: 5000 });
  measured.card.opened = await cardNow();
  assert.equal(measured.card.opened.visitShown, true);
  assert.ok(measured.card.opened.share > measured.card.folded.share, 'the card did not grow when its neighbours list came back');
  assert.equal(measured.card.opened.over, false, 'the opened card stands on the step');
  await page.locator('#selection-more').click();
  await page.waitForFunction(() => !(document.querySelector('#visit-row')?.getBoundingClientRect().height > 0), null, { timeout: 5000 });
  ok(`the card is clear of the step and folds its neighbours list away: ${measured.card.folded.share}% of the screen against ${measured.card.opened.share}% open, top at ${measured.card.folded.card.top} under a strip ending at ${measured.card.folded.strip.bottom}, and one press brings it back`);
  await shoot(page, 'step');

  assert.equal(await page.locator('.panel-row[data-focused=true] .panel-icon[aria-disabled=true]:not([data-active=true])').count(), 0);
  ok('the action bar hides unavailable orders');
  const before = await page.evaluate(() => window.__snapshot.revision);

  // Pressing the one that is open sends the order, and the server's own glow comes back on it.
  //
  // **The stub comes off first.** Everything above is about the drawing, and a stub is the right way to put a step on the
  // screen at will. This is about the order actually going through, and the server has a lesson of its own now: an order
  // the page thinks is open but the step does not allow is refused, which is exactly the rule working. So the page is
  // handed back the server's own step and the icon pressed is one the server itself has left open.
  await holdLesson(page, null);
  await page.waitForFunction(() => window.__snapshot?.world?.lesson?.allow?.length > 0, null, { timeout: 20000 });
  // Whoever the step leaves work open on - not necessarily the person the bar happens to be showing. A step names one
  // piece of work, and which of the family may do it is the family's own business (a child cannot be sent).
  const whoCanWork = await page.evaluate(() => {
    for (const row of document.querySelectorAll('.panel-row')) {
      const icon = row.querySelector('.panel-icon[data-action=chore]:not([aria-disabled=true])');
      if (icon) return { entityId: row.dataset.entityId, key: icon.dataset.key };
    }
    return null;
  });
  assert.ok(whoCanWork, `the step the server sent leaves nothing open on anybody: ${JSON.stringify(await page.evaluate(() => window.__snapshot?.world?.lesson))}`);
  if (whoCanWork.entityId !== await page.evaluate(() => document.querySelector('.panel-row[data-focused=true]')?.dataset.entityId)) {
    await page.locator(`.panel-focus[data-focus="${whoCanWork.entityId}"]`).click();
    await page.waitForFunction(id => document.querySelector('.panel-row[data-focused=true]')?.dataset.entityId === id, whoCanWork.entityId, { timeout: 15000 });
  }
  const serverOpen = whoCanWork.key;
  assert.ok(serverOpen, 'the step the server sent leaves nothing on this person to press, so this proof would prove nothing');
  await page.locator(`.panel-row[data-focused=true] .panel-icon[data-key="${serverOpen}"]`).click();
  await page.waitForFunction(key => document.querySelector(`.panel-row[data-focused=true] .panel-icon[data-key="${key}"]`)?.dataset.active === 'true', serverOpen, { timeout: 20000 });
  measured.ordered = { key: serverOpen, revisionMoved: (await page.evaluate(() => window.__snapshot.revision)) > before };
  assert.equal(await page.evaluate(() => (document.querySelector('#error').textContent || '').trim()), '', 'the order the step allowed was refused');
  ok(`the one icon the server's own step leaves open sends its order, and the glow comes back on it (${serverOpen})`);

  // --------------------------------------------------------------------------------------- the keyboard and the folding
  await holdLesson(page, 'none');
  await page.waitForFunction(() => document.querySelector('#lesson').hidden, null, { timeout: 10000 });
  // Focused in one call and read in the next, this check failed about one run in three: the page redraws on every tick,
  // and a redraw between the two replaces the icon, taking the focus and the summary with it. Focusing and reading in
  // the same turn of the page's own thread cannot fall in that gap; the retries are for a redraw landing on the focus
  // itself, and the last reading is kept either way so a failure still says what was on the screen.
  const onFocus = async () => page.evaluate(() => {
    const icon = document.querySelector('.panel-row[data-focused=true] .panel-icon:not([data-active=true])');
    if (!icon) return { focused: null, label: null, tipShown: false };
    icon.focus();
    return { focused: document.activeElement?.className, label: document.activeElement?.getAttribute('aria-label'), tipShown: !document.querySelector('#panel-tip').hidden };
  });
  measured.keyboard = await onFocus();
  for (let tries = 0; tries < 8 && !measured.keyboard.tipShown; tries++) {
    await page.waitForTimeout(250);
    measured.keyboard = await onFocus();
  }
  assert.equal(measured.keyboard.focused, 'panel-icon', 'an icon on the bar cannot be reached with the keyboard');
  assert.ok(measured.keyboard.label?.length > 10, 'an icon on the bar has no accessible name');
  assert.equal(measured.keyboard.tipShown, true, 'the summary does not show on focus, only on hover');
  ok(`the bar is still a row of buttons in reading order, each named and each showing its sentence on focus: "${measured.keyboard.label.slice(0, 60)}…"`);
  await page.keyboard.press('Escape');

  // Folding the names away keeps the work.
  const columnBefore = await page.evaluate(() => Math.round(document.querySelector('.panel-body').getBoundingClientRect().right));
  await page.locator('#family-collapse').click();
  await page.waitForFunction(() => document.querySelector('#family-panel').dataset.collapsed === 'true', null, { timeout: 5000 });
  measured.folded = await page.evaluate(() => ({
    bodiesOnScreen: [...document.querySelectorAll('.panel-body')].filter(body => body.getBoundingClientRect().width > 0).length,
    facesOnScreen: [...document.querySelectorAll('.panel-portrait')].filter(face => face.getBoundingClientRect().width > 0).length,
    column: Math.round(Math.max(...[...document.querySelectorAll('#family-panel .panel-portrait,#family-collapse')].map(one => one.getBoundingClientRect().right))),
    barIcons: [...document.querySelectorAll('.panel-row[data-focused=true] .panel-icon')].filter(icon => icon.getBoundingClientRect().width > 0).length,
  }));
  measured.folded.columnBefore = columnBefore;
  assert.equal(measured.folded.bodiesOnScreen, 0);
  assert.ok(measured.folded.facesOnScreen > 1, 'folding took the faces away too');
  assert.ok(measured.folded.barIcons > 0, 'folding the names away took the main person’s work with it');
  ok(`folded, the column is ${measured.folded.column}px instead of ${columnBefore}px and the bar is untouched (${measured.folded.barIcons} icons)`);
  await shoot(page, 'folded');
  await page.locator('#family-collapse').click();

  // ------------------------------------------------------------- the strip and the family never share a pixel
  // Centred, the strip landed on the left-hand column at anything under about 1180px wide: at 1024 it covered the
  // father's star outright, and at a phone's width Chrome refused a click on "Choose a house" through it
  // (docs/evidence/screen-overlap-1024.json, scripts/screen-overlap-study.mjs). Both widths are asked here, because the
  // fault was invisible at the one the class played on.
  // The step must be standing, or there is no strip: a hidden panel has a box of nothing, which overlaps nothing, and
  // the check would pass however wrong the stylesheet was. That is how this check first read as clean against a strip
  // put deliberately back in the middle.
  await holdLesson(page, step);
  const apart = async where => {
    const boxes = await page.evaluate(() => ({
      strip: document.querySelector('#lesson').getBoundingClientRect().toJSON(),
      column: document.querySelector('#hud-left').getBoundingClientRect().toJSON(),
    }));
    assert.ok(boxes.strip.width > 100 && boxes.strip.height > 20, `at ${where} there is no strip on the screen to ask about`);
    assert.ok(boxes.column.width > 100 && boxes.column.height > 20, `at ${where} there is no family column on the screen to ask about`);
    const over = Math.min(boxes.strip.right, boxes.column.right) - Math.max(boxes.strip.left, boxes.column.left);
    const down = Math.min(boxes.strip.bottom, boxes.column.bottom) - Math.max(boxes.strip.top, boxes.column.top);
    assert.ok(over <= 0 || down <= 0, `at ${where} the guided start is drawn over the family's own column by ${Math.round(over)}x${Math.round(down)}px`);
    return { where, strip: boxes.strip, overlapWidth: Math.round(over), overlapHeight: Math.round(down) };
  };
  measured.apart = [await apart('1366x768')];
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.waitForTimeout(300);
  measured.apart.push(await apart('1024x768'));
  ok(`the guided start keeps off the family's column at 1366 and at 1024, where it used to cover the father's star`);
  await page.setViewportSize(SCREEN);
  await page.waitForTimeout(300);

  // ------------------------------------------------------------------- a panel over the family admits to being there
  // "Choose a house" covers the whole column - twenty-eight controls at this size - while the step's own words say to
  // assign a family member. It is allowed to, now, but it dims what it covers and says so in words (owner, 2026-09-21).
  // ------------------------------------------------------------------ the name under an icon lands on nothing else
  // Names now live inside the real buttons. Measure those DOM boxes, including long names,
  // rather than estimating an obsolete pseudo-element below the bar.
  measured.names = await page.evaluate(() => {
    const nav = document.querySelector('#map-nav').getBoundingClientRect();
    return [...document.querySelectorAll('.panel-row[data-focused=true] .panel-icon')].map(icon => {
      const label = icon.querySelector('.panel-action-name');
      const box = label?.getBoundingClientRect(), button = icon.getBoundingClientRect();
      return { name: icon.dataset.name, visible: Boolean(box?.height),
        contained: Boolean(box && box.top >= button.top && box.bottom <= button.bottom && box.left >= button.left && box.right <= button.right),
        overlapsNavigation: Boolean(box && box.left < nav.right && box.right > nav.left && box.top < nav.bottom && box.bottom > nav.top) };
    });
  });
  assert.ok(measured.names.length > 0, 'no actions to prove label layout');
  assert.ok(measured.names.every(label => label.visible && label.contained && !label.overlapsNavigation), 'action names must fit inside their buttons and stay clear of navigation');
  ok('all action names fit inside their buttons, clear of map navigation');

  // The step has to be standing for this: what is asked is that the dim covers the family and *not* the instruction.
  if (await page.locator('#house-open').isVisible()) {
    await page.locator('#house-open').click();
    await page.locator('#house-plan,#house-plot').first().waitFor({ state: 'visible', timeout: 10000 });
    measured.dim = await page.evaluate(() => ({
      backdrop: !document.querySelector('#panel-backdrop').hidden,
      body: document.body.dataset.panel,
      says: [...document.querySelectorAll('#house-plan .panel-behind,#house-plot .panel-behind')].filter(one => one.getBoundingClientRect().width > 0).map(one => one.textContent.trim())[0] || null,
      stripStillUp: !document.querySelector('#lesson').hidden,
    }));
    assert.equal(measured.dim.backdrop, true, 'a panel stands over the family with nothing to show it is there');
    assert.equal(measured.dim.body, 'true');
    assert.ok(measured.dim.says && /family/i.test(measured.dim.says), 'the panel covers the family and never says so');
    assert.equal(measured.dim.stripStillUp, true, 'the dim swallowed the instruction as well');
    await shoot(page, 'dimmed');
    // The dim is pressed to close, which is the first thing a student tries.
    await page.locator('#panel-backdrop').click();
    await page.waitForFunction(() => document.querySelector('#panel-backdrop').hidden, null, { timeout: 10000 });
    assert.equal(await page.evaluate(() => document.body.dataset.panel), 'false');
    ok(`the house panel dims the family behind it, says "${measured.dim.says}", keeps the step on screen, and the dim closes it`);
  }

  await holdLesson(page, { ...step, step: 'done', title: 'The land is yours', says: 'Your farm is ready. Choose what your family does next.', done: true });
  assert.equal(await page.locator('#lesson').isVisible(), true, 'completion vanished without telling the player');
  assert.equal(await page.locator('#lesson-action').isHidden(), true, 'completion still offers tutorial work');
  assert.equal(await page.locator('.panel-icon[data-shut=true]').count(), 0, 'completion still locks actions');
  ok('completion is visible and releases tutorial locks');
  await page.setViewportSize({ width: 390, height: 844 });
  await holdLesson(page, step);
  measured.phone = await page.locator('#lesson').boundingBox();
  assert.ok(measured.phone.x >= 0 && measured.phone.x + measured.phone.width <= 390, 'guide overflows a phone');
  await page.waitForFunction(() => {
    const card = document.querySelector('#selection');
    const bar = document.querySelector('.panel-row[data-focused=true] .panel-icons');
    return card && !card.hidden && bar && card.getBoundingClientRect().bottom + 4 <= bar.getBoundingClientRect().top;
  }, null, { timeout: 4000 });
  ok('on a phone the conversation answers stay above the action bar');
  await shoot(page, 'phone');
  ok('the guide fits a 390px phone viewport');
  measured.stopButton = { phone: await xOnTheStrip('390x844') };

  // ------------------------------------------------------------------------------------------ the X (owner, 2026-09-22)
  // "i should be able to X off the tutorial to stop it and just do what i want." Asked who gets it: "Everyone, always".
  // Run last, because after it this family's window to take the guided start back up is spent. The stub comes off: this
  // is the server's own lesson being stopped, and the server's own gate being opened.
  await page.setViewportSize(SCREEN);
  await holdLesson(page, null);
  await page.waitForFunction(() => window.__snapshot?.world?.lesson?.done === false && !document.querySelector('#lesson').hidden && !document.querySelector('#lesson-stop').hidden, null, { timeout: 20000 });
  measured.stopButton.chromebook = await xOnTheStrip('1366x768');
  measured.stopButton.step = await page.evaluate(() => window.__snapshot.world.lesson.step);

  // Orders the server's step refuses right now, asked of the server itself. The gate is read before anything moves
  // (sim/world.mjs `applyAction`), so a refused probe changes nothing.
  const who = await page.evaluate(() => document.querySelector('.panel-row[data-focused=true]')?.dataset.entityId);
  // Whoever it is was set to work above, and a busy person can be given nothing else: their work is called off first
  // (`stop-chore`, which no step refuses), so the only thing standing between them and an order is the lesson.
  const calledOff = await page.evaluate(async entityId => {
    if (!window.__snapshot.world.entities.find(one => one.id === entityId)?.chore) return null;
    const response = await fetch('/api/command', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: `off-${Date.now()}`, action: 'stop-chore', entityId }) });
    return { status: response.status, error: (await response.json()).error || '' };
  }, who);
  if (calledOff) assert.equal(calledOff.status, 200, `calling off the work was refused: ${calledOff.error}`);
  await page.waitForFunction(entityId => !window.__snapshot.world.entities.find(one => one.id === entityId)?.chore
    && !document.querySelector('.panel-row[data-focused=true] .panel-icon[data-action=chore][data-active=true]'), who, { timeout: 20000 });
  const beforeStopKeys = await page.evaluate(() => [...document.querySelectorAll('.panel-row[data-focused=true] .panel-icon')].map(icon => icon.dataset.key));
  measured.stopButton.availableBefore = beforeStopKeys;

  const sent = [];
  const listen = request => { if (request.url().endsWith('/api/command')) sent.push(request.postDataJSON()?.action); };
  page.on('request', listen);
  // The X asks first, in the strip, and "Keep going" changes nothing.
  await page.locator('#lesson-stop').click();
  await page.locator('#lesson-stop-ask').waitFor({ state: 'visible', timeout: 5000 });
  measured.stopButton.asks = await page.locator('#lesson-stop-words').textContent();
  assert.match(measured.stopButton.asks, /Stop the guided start\?/);
  assert.equal(await page.evaluate(() => document.activeElement?.id), 'lesson-stop-no', 'the question put the focus on the button that cannot be undone');
  await shoot(page, 'stop-ask');
  await page.locator('#lesson-stop-no').click();
  await page.locator('#lesson-stop-ask').waitFor({ state: 'hidden', timeout: 5000 });
  assert.equal(await page.locator('#lesson').isVisible(), true, '"Keep going" stopped the lesson');
  assert.deepEqual(sent, [], '"Keep going" sent an order');
  ok(`the X asks once, in the strip: "${measured.stopButton.asks}" - and "Keep going" sends nothing`);

  await page.locator('#lesson-stop').click();
  await page.locator('#lesson-stop-yes').click();
  await page.waitForFunction(() => document.querySelector('#lesson').hidden && window.__snapshot?.world && !('lesson' in window.__snapshot.world), null, { timeout: 20000 });
  page.off('request', listen);
  assert.deepEqual(sent, ['stop-lesson'], `the X sent ${JSON.stringify(sent)}`);
  assert.equal(await page.locator('.panel-icon[data-shut=true]').count(), 0, 'the bar is still shut after the X');
  assert.equal(await page.locator('#tutorial').isHidden(), true, 'the old walk-through was offered in the lesson’s place');
  ok('"Yes, stop it" sends stop-lesson once; the strip goes, the snapshot carries no lesson, nothing on the bar is shut, and the old walk-through is not offered instead');

  // The orders hidden by the guided step return after the player stops it.
  const afterStopKeys = await page.evaluate(() => [...document.querySelectorAll('.panel-row[data-focused=true] .panel-icon')].map(icon => icon.dataset.key));
  assert.ok(afterStopKeys.some(key => !beforeStopKeys.includes(key)), 'stopping the lesson revealed no newly available actions');
  assert.equal(await page.locator('.panel-row[data-focused=true] .panel-icon[aria-disabled=true]').count(), 0);
  measured.stopButton.availableAfter = afterStopKeys;
  ok(`stopping the lesson reveals ${afterStopKeys.length - beforeStopKeys.length} additional actions`);
  // "Resume tutorial" where the strip was (owner, 2026-09-22), for five real minutes from this press.
  await page.locator('#lesson-resume').waitFor({ state: 'visible', timeout: 10000 });
  const firstUntil = await page.evaluate(() => window.__snapshot.world.lessonResume?.until);
  assert.ok(Number.isFinite(firstUntil), 'the snapshot carries no offer to resume');
  measured.resume = { until: firstUntil, msWhenStopped: await page.evaluate(() => window.__snapshot.world.lessonResume.ms) };
  assert.ok(measured.resume.msWhenStopped > 4.5 * 60_000 && measured.resume.msWhenStopped <= 5 * 60_000, `the window is ${measured.resume.msWhenStopped} ms, not five minutes`);
  measured.resume.chromebook = await resumeClear(page, '1366x768');
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.waitForTimeout(400);
  measured.resume.small = await resumeClear(page, '1024x768');
  await shoot(page, 'resume-1024');
  await page.setViewportSize(SCREEN);
  await page.waitForTimeout(400);
  await shoot(page, 'resume');


  // And it stays off after a reload: the stop is the world's, not the page's.
  await page.reload();
  await page.waitForFunction(() => window.__snapshot?.world?.householdId === 'hh-1', null, { timeout: 30000 });
  const revision = await page.evaluate(() => window.__snapshot.revision);
  await page.waitForFunction(seen => window.__snapshot.revision > seen, revision, { timeout: 20000 });
  assert.equal(await page.evaluate(() => 'lesson' in window.__snapshot.world), false, 'the lesson came back on reload');
  assert.equal(await page.locator('#lesson').isHidden(), true, 'the strip came back on reload');
  ok('after a reload the strip stays gone and the server sends no lesson');
  await page.locator('#lesson-resume').waitFor({ state: 'visible', timeout: 10000 });
  assert.equal(await page.evaluate(() => window.__snapshot.world.lessonResume?.until), firstUntil, 'the reload moved the window');
  ok('after a reload "Resume tutorial" is still there, with the same window: the server holds it, not the page');

  // Pressed: the strip comes back on the step it was stopped on, and the gate with it.
  const resumeSent = [];
  const listenResume = request => { if (request.url().endsWith('/api/command')) resumeSent.push(request.postDataJSON()?.action); };
  page.on('request', listenResume);
  await page.locator('#lesson-resume').click();
  await page.waitForFunction(() => window.__snapshot?.world?.lesson?.done === false && !document.querySelector('#lesson').hidden, null, { timeout: 20000 });
  page.off('request', listenResume);
  assert.deepEqual(resumeSent, ['resume-lesson'], `"Resume tutorial" sent ${JSON.stringify(resumeSent)}`);
  measured.resume.stepAfter = await page.evaluate(() => window.__snapshot.world.lesson.step);
  assert.equal(measured.resume.stepAfter, measured.stopButton.step, `the strip came back on ${measured.resume.stepAfter}, not ${measured.stopButton.step}`);
  assert.equal(await page.locator('#lesson-resume').isHidden(), true, '"Resume tutorial" stayed up beside the strip');
  assert.ok(await page.locator('.panel-row[data-focused=true] .panel-icon').count() < afterStopKeys.length, 'the resumed lesson did not hide unavailable actions');
  await shoot(page, 'resumed');
  ok(`"Resume tutorial" sends resume-lesson once; the strip is back on the same step (${measured.resume.stepAfter}) and unavailable actions are hidden again`);

  // A second X does not buy five more minutes, and when the first press's five minutes are up the button goes by itself.
  await page.locator('#lesson-stop').click();
  await page.locator('#lesson-stop-yes').click();
  await page.locator('#lesson-resume').waitFor({ state: 'visible', timeout: 20000 });
  assert.equal(await page.evaluate(() => window.__snapshot.world.lessonResume?.until), firstUntil, 'the second X opened a new window');
  ok('a second X after the resume offers "Resume tutorial" again, inside the first press’s window, not a new one');
  clockShift = firstUntil + 1000 - Date.now();
  await page.waitForFunction(() => document.querySelector('#lesson-resume').hidden && !('lessonResume' in (window.__snapshot?.world || {})), null, { timeout: 20000 });
  assert.equal(await page.locator('#lesson').isHidden(), true, 'the strip came back when the window shut');
  measured.resume.goneWithoutReload = true;
  ok('with the server’s clock moved past the first press’s five minutes, "Resume tutorial" goes on its own, with no reload');

  assert.deepEqual(errors, [], `page errors: ${errors.join(' | ')}`);
  ok('no page errors anywhere in the run');

  mkdirSync('docs/evidence', { recursive: true });
  writeFileSync('docs/evidence/lesson-browser.json', `${JSON.stringify({
    record: 'lesson-browser',
    date: new Date().toISOString().slice(0, 10),
    browser: await browser.version(),
    screen: SCREEN,
    task: 'The owner after the class of 2026-09-21: the UI covered too much of a Chromebook screen; a character’s abilities are hidden unless they are the main one and sit bottom middle, spaced out; and the tutorial is an integrated, forced, one-task-at-a-time part of the game.',
    environment: 'Same computer: a local classroom server and headless Chrome at 1366x768. Not a physical LAN, a Chromebook, a classroom or a touch screen.',
    checks: pass,
    measured,
    screenshots: shots,
    notProved: [
      'All ten steps through browser clicks: this proof uses the real server for opening and an order, and controlled snapshots for specific guide states. The simulation suite exercises progression separately.',
      'A real Chromebook, its GPU or its touchpad: this is desktop Chrome at the same pixel size.',
      'Touch. The icons are 48px and spaced 10px, which is the size a fingertip wants, but nothing here pressed one with a finger.',
      'Every step of the lesson. One step is held and pressed; tests/lesson-screen.test.mjs walks the rules over the family’s whole bar.',
    ],
  }, null, 2)}\n`);
  console.log('\nwrote docs/evidence/lesson-browser.json');
} finally {
  await browser.close();
  await app.close();
}
