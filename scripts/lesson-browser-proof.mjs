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
  const context = await browser.newContext({ reducedMotion: 'no-preference', viewport: SCREEN });
  await installLessonStub(context);
  const page = await context.newPage();
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
  assert.ok(bar.smallestGap >= 6, `the icons are not spaced out: the smallest gap is ${bar.smallestGap}px`);
  assert.ok(bar.iconSize >= 44, `an icon is smaller than a fingertip: ${bar.iconSize}px`);
  // **One bar, not two.** Until 2026-09-21 a 58rem cap wrapped a nineteen-icon row to sixteen and three, and the three
  // floated above the rest: to a student, two bars. Both halves of that are held down - every icon on one line, and only
  // one group of icons with a box on the screen anywhere.
  assert.equal(bar.rows, 1, `the bar is ${bar.rows} rows of icons, which reads as ${bar.rows} bars`);
  assert.equal(bar.groupsOnScreen, 1, `${bar.groupsOnScreen} groups of icons are on the screen at once`);
  ok(`the main person's work is one row bottom middle at 1366x768: ${bar.count} icons on ${bar.rows} line, centred at ${bar.centre}, ${bar.fromBottom}px up, ${bar.smallestGap}px apart, ${bar.iconSize}px each, ${bar.share}% of the screen`);

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
      buttons: strip.querySelectorAll('button,input,select,a').length,
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
  assert.equal(measured.strip.buttons, 0, 'the guided start has a control on it, which is the page deciding a step is done');
  assert.match(measured.strip.read, /STEP 2 OF 10\./);
  ok(`the step is the server's words and has no control at all: "${measured.strip.title}" - ${measured.strip.says} (${measured.strip.share}% of the screen)`);
  // The old, skippable walk-through is not offered underneath it.
  assert.equal(await page.locator('#tutorial').isHidden(), true, 'the skippable walk-through is offered under the lesson');
  ok('the skippable walk-through is put away while the class is being led');

  // The bar: one thing open, everything else plainly shut.
  measured.step = await page.evaluate(() => [...document.querySelectorAll('.panel-row[data-focused=true] .panel-icon')].map(icon => ({
    key: icon.dataset.key, shut: icon.dataset.shut === 'true', pointed: icon.dataset.pointed === 'true',
    pressable: icon.getAttribute('aria-disabled') !== 'true', opacity: Number(getComputedStyle(icon).opacity),
  })));
  const pressable = measured.step.filter(icon => icon.pressable);
  assert.deepEqual(pressable.map(icon => icon.key), [open], `more than the step's own work can be pressed: ${pressable.map(one => one.key)}`);
  assert.deepEqual(measured.step.filter(icon => icon.pointed).map(icon => icon.key), [open]);
  assert.ok(measured.step.filter(icon => icon.shut).every(icon => icon.opacity < 0.5), 'a shut icon is not plainly shut');
  ok(`the step leaves one thing to press of ${measured.step.length}, rings it, and dims the rest`);

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
    return { card, strip, over, travelShown: shown('#selection-travel'), visitShown: shown('#visit-row'), more: document.querySelector('#selection-more')?.textContent || null,
      share: card ? Math.round((card.right - card.left) * (card.bottom - card.top) / (innerWidth * innerHeight) * 1000) / 10 : 0 };
  });
  measured.card = { folded: await cardNow() };
  assert.equal(measured.card.folded.over, false, `the card stands on the step: card ${JSON.stringify(measured.card.folded.card)}, strip ${JSON.stringify(measured.card.folded.strip)}`);
  assert.equal(measured.card.folded.travelShown, false, 'the "Going by" block is open on the card while a step is running');
  assert.equal(measured.card.folded.visitShown, false, 'the neighbours list is open on the card while a step is running');
  assert.ok(measured.card.folded.more, 'nothing on the card says how to get the folded part back');
  // **Folded, not shut.** The server allows `travel` on every step of the lesson on purpose (`ALWAYS` in sim/lesson.mjs),
  // so what the card puts away has to be one press from coming back, or the page would be stopping what the world permits.
  await page.locator('#selection-more').click();
  await page.waitForFunction(() => document.querySelector('#selection-travel')?.getBoundingClientRect().height > 0, null, { timeout: 5000 });
  measured.card.opened = await cardNow();
  assert.equal(measured.card.opened.travelShown, true);
  assert.ok(measured.card.opened.share > measured.card.folded.share, 'the card did not grow when its journey block came back');
  assert.equal(measured.card.opened.over, false, 'the opened card stands on the step');
  await page.locator('#selection-more').click();
  await page.waitForFunction(() => !(document.querySelector('#selection-travel')?.getBoundingClientRect().height > 0), null, { timeout: 5000 });
  ok(`the card is clear of the step and folds its journey block away: ${measured.card.folded.share}% of the screen against ${measured.card.opened.share}% open, top at ${measured.card.folded.card.top} under a strip ending at ${measured.card.folded.strip.bottom}, and one press brings it back`);
  await shoot(page, 'step');

  // Pressing a shut one sends nothing and says the one thing to do instead.
  const shut = measured.step.find(icon => icon.shut && icon.key !== 'stop-chore');
  const before = await page.evaluate(() => window.__snapshot.revision);
  // `force`, because the browser's own idea of an enabled control already refuses it: a shut icon carries `aria-disabled`,
  // and Playwright will not press one without being told to. That is the first half of the proof; the sentence is the second.
  measured.shutRefusedByTheBrowser = await page.locator(`.panel-row[data-focused=true] .panel-icon[data-key="${shut.key}"]`)
    .click({ timeout: 1500 }).then(() => false).catch(() => true);
  assert.equal(measured.shutRefusedByTheBrowser, true, 'a shut icon is an ordinary enabled button to the browser');
  await page.locator(`.panel-row[data-focused=true] .panel-icon[data-key="${shut.key}"]`).click({ force: true });
  await page.locator('#panel-tip').waitFor({ state: 'visible', timeout: 5000 });
  measured.shutSays = await page.evaluate(() => document.querySelector('#panel-tip-note').textContent);
  assert.match(measured.shutSays, /^Not this yet\./);
  assert.match(measured.shutSays, new RegExp(step.says.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.equal(await page.evaluate(() => (document.querySelector('#error').textContent || '').trim()), '', 'a shut icon gave the student a refusal to read');
  ok(`a shut icon sends nothing and says what to do instead: "${measured.shutSays}"`);

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
  await page.evaluate(() => document.querySelector('.panel-row[data-focused=true] .panel-icon')?.focus());
  measured.keyboard = await page.evaluate(() => ({
    focused: document.activeElement?.className, label: document.activeElement?.getAttribute('aria-label'),
    tipShown: !document.querySelector('#panel-tip').hidden,
  }));
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
      'The lesson itself: `world.lesson` is stubbed (scripts/support/lesson-stub.mjs) because the server side is being built in parallel. What is proved is that the page reads the contract and adds nothing to it.',
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
