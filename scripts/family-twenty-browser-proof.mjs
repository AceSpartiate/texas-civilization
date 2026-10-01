// A family of twenty on the screen (owner, 2026-09-22: "if i roll a 20, there should be 18 kids").
//
// tests/family-roll.test.mjs proves a 20 makes two parents and eighteen children and that what they are sent fits the tick.
// What only a browser can show is that a student can still use the page with all of them on it: the names card holds
// twenty boxes and its Continue can be reached, the family panel down the left scrolls to its last child instead of running
// off the screen, and the map beside it is still the map - at a Chromebook's 1366 by 768, 1440 by 950 and 1024 by 768. A
// phone's 400 by 800 is a gate again since 2026-09-27 (owner; docs/GATES.md): six checks, see the phone section below. And with
// the column too tight for full rows, each baby's row shows one short word beside its name instead of nothing (owner,
// 2026-09-27: "Show a short word"; docs/CHILDREN.md §9), at 1366 by 768, 1440 by 950 and 1024 by 768.
//
// Run: npm run test:family-twenty   (PLAYWRIGHT_MODULE and BROWSER_EXECUTABLE as for every browser proof)
// Writes docs/evidence/family-twenty-browser.json. Same computer only: no classroom Wi-Fi, no Chromebook, no real phone.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createClassroom } from '../server/app.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { familyRoll } from '../sim/family.mjs';
import { meetFamily } from './support/meet-family.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const pass = [];
const ok = label => { pass.push(label); console.log('PASS', label); };
const measured = {};
// The first seed whose first family rolls a 20: found, not forced, so the server rolls it exactly as it would in a class.
let n = 0; while (familyRoll(`twenty-${n}`, 'hh-1') !== 20) n++;
const seed = `twenty-${n}`;
const app = createClassroom({ seed, playerCount: 5, tickMs: 1000, worldFactory: createGonzalesWorld });
const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const errors = [];
mkdirSync('test-results', { recursive: true });

/** Where the panel is, whether it scrolls, and how much of the screen the map is still the top thing at. */
const layout = page => page.evaluate(() => {
  const panel = document.querySelector('#family-panel'), box = panel.getBoundingClientRect();
  // On a phone the guided start's strip runs across the top (docs/FAMILY_PANEL.md §12.11); what the map is asked of is the
  // screen below it, as in test:family-panel, so the number is the panel's and not the lesson's.
  const strip = document.querySelector('#lesson');
  const stripBottom = strip && !strip.hidden && window.innerWidth <= 760 ? strip.getBoundingClientRect().bottom : 0;
  const grid = [];
  for (let gx = 0; gx < 16; gx++) for (let gy = 0; gy < 12; gy++) {
    const x = (gx + .5) * window.innerWidth / 16, y = (gy + .5) * window.innerHeight / 12;
    const top = document.elementFromPoint(x, y);
    grid.push({ below: y > stripBottom, map: top?.id === 'world-map', panel: Boolean(top?.closest?.('#family-panel')) });
  }
  return {
    rows: document.querySelectorAll('#family-rows .panel-row').length,
    panel: { left: Math.round(box.left), top: Math.round(box.top), width: Math.round(box.width), bottom: Math.round(box.bottom) },
    scrolls: panel.scrollHeight > panel.clientHeight + 1, scrollHeight: panel.scrollHeight, clientHeight: panel.clientHeight,
    mapShare: grid.filter(point => point.below && point.map).length / grid.filter(point => point.below).length, stripBottom: Math.round(stripBottom),
    panelShare: grid.filter(point => point.panel).length / grid.length,
    pageScrolls: document.documentElement.scrollWidth > window.innerWidth || document.documentElement.scrollHeight > window.innerHeight + 1,
    viewport: { width: window.innerWidth, height: window.innerHeight },
  };
});
/** The last child's row brought into view inside the panel: its portrait inside both the panel and the screen. */
const lastRowReachable = page => page.evaluate(async () => {
  const panel = document.querySelector('#family-panel');
  const rows = [...document.querySelectorAll('#family-rows .panel-row')];
  const last = rows.at(-1);
  last.scrollIntoView({ block: 'end' });
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  const face = (last.querySelector('.panel-portrait') || last).getBoundingClientRect(), box = panel.getBoundingClientRect();
  const inside = face.top >= box.top - 1 && face.bottom <= box.bottom + 1 && face.bottom <= window.innerHeight + 1 && face.height > 0;
  const top = document.elementFromPoint(face.left + face.width / 2, face.top + face.height / 2);
  // What stands over the child when something does, so a failure names it.
  const over = top && !last.contains(top) ? (top.closest('[id]')?.id || top.className || top.tagName) : null;
  // And the tip over the map, which takes no clicks and so is looked through by `elementFromPoint`: standing over the child, it
  // hides them as surely as anything that does (found 2026-09-30: on the phone it stood over the column's last 90 px).
  const tip = document.querySelector('#tip'), tipBox = tip && !tip.hidden ? tip.getBoundingClientRect() : null;
  const underTip = Boolean(tipBox?.height) && face.left < tipBox.right && tipBox.left < face.right && face.top < tipBox.bottom && tipBox.top < face.bottom;
  return { inside, onTop: Boolean(top && last.contains(top)) && !underTip, scrollTop: panel.scrollTop, id: last.dataset.entityId, ...((over || underTip) && { over: over || 'tip', face: { top: Math.round(face.top), bottom: Math.round(face.bottom) } }), ...(tipBox?.height && { tip: { id: tip.dataset.tip, top: Math.round(tipBox.top) } }) };
});

try {
  const context = await browser.newContext({ reducedMotion: 'no-preference', viewport: { width: 1366, height: 768 } });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url);
  await page.locator('[name=name]').fill('Twenty');
  await page.locator('[name=code]').fill(app.state.sessionCode);
  await page.getByRole('button', { name: 'Join', exact: true }).click();
  await page.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-1');
  // Four classmates, so the class is the size it is built for and Start is taken the first time.
  for (let i = 2; i <= 5; i++) await fetch(`${url}/api/join`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: `Classmate ${i}`, code: app.state.sessionCode }) });

  // The title screen and the die, as a student does.
  await page.locator('#creation-begin-button').waitFor({ state: 'visible', timeout: 30000 });
  await page.locator('#creation-begin-button').click();
  await page.locator('#roll-family').click();
  await page.waitForFunction(() => document.querySelector('#roll-family')?.textContent === 'Meet your family', null, { timeout: 20000 });
  assert.equal(await page.locator('#family-die').textContent(), '20');
  ok('the server rolls this family a 20');
  await page.locator('#roll-family').click();
  await page.locator('#surname').waitFor({ state: 'visible', timeout: 15000 });
  await page.locator('#surname-input').fill('Twentyman');
  await page.locator('#surname-save').click();
  await page.locator('#surname').waitFor({ state: 'hidden', timeout: 15000 });

  // The names card: twenty boxes, and Continue reachable on a Chromebook's screen.
  await page.locator('#names').waitFor({ state: 'visible', timeout: 15000 });
  const boxes = await page.locator('#names input').count();
  measured.nameBoxes = boxes;
  assert.equal(boxes, 20, `the names card has ${boxes} boxes`);
  await page.locator('#names-done').scrollIntoViewIfNeeded();
  const done = await page.locator('#names-done').boundingBox();
  measured.namesDone = done;
  assert.ok(done && done.y >= 0 && done.y + done.height <= 768, `Continue is at ${JSON.stringify(done)}, off a 768-high screen`);
  await page.screenshot({ path: 'test-results/family-twenty-names.png' });
  ok(`the names card holds all ${boxes} names and its Continue can be reached at 1366 by 768`);
  await page.locator('#names-done').click();
  await page.locator('#names').waitFor({ state: 'hidden', timeout: 15000 });
  await meetFamily(page);
  if (await page.locator('#wagon-done').isVisible()) await page.locator('#wagon-done').click();
  if (await page.locator('#tutorial-skip').isVisible()) await page.locator('#tutorial-skip').click();
  await page.locator('#family-panel').waitFor({ state: 'visible' });
  await page.waitForFunction(() => document.querySelectorAll('#family-rows .panel-row').length === 20, null, { timeout: 15000 });
  if (await page.locator('#selection-close').isVisible()) await page.locator('#selection-close').click();
  await page.waitForTimeout(600);

  // ------------------------------------------------------------------------------------------------ 1366 by 768
  const desk = await layout(page);
  measured.desktop = desk;
  await page.screenshot({ path: 'test-results/family-twenty-desktop.png' });
  assert.equal(desk.rows, 20);
  assert.ok(desk.panel.bottom <= desk.viewport.height, `the panel runs off the bottom of the screen: ${JSON.stringify(desk.panel)}`);
  assert.ok(desk.scrolls, 'twenty rows fit a 768-high screen without scrolling, which this proof does not believe');
  assert.equal(desk.pageScrolls, false, 'the page itself scrolls instead of the panel');
  assert.ok(desk.panel.width <= 320, `the panel is ${desk.panel.width} px wide`);
  assert.ok(desk.mapShare > 0.55, `the map is the top thing at only ${Math.round(desk.mapShare * 100)}% of the screen`);
  ok(`at 1366 by 768 twenty rows scroll inside a ${desk.panel.width} px panel that ends at ${desk.panel.bottom} px, and the map is on top at ${Math.round(desk.mapShare * 100)}% of the screen`);
  const deskLast = await lastRowReachable(page);
  measured.desktopLast = deskLast;
  assert.ok(deskLast.inside && deskLast.onTop, `the last child cannot be brought into view: ${JSON.stringify(deskLast)}`);
  await page.screenshot({ path: 'test-results/family-twenty-desktop-last.png' });
  ok('the youngest child, last of twenty, scrolls into view inside the panel and nothing covers them');

  // ------------------------------------------------------------------------------------ the class running, the bar full
  // In the lobby the ability bar is one sentence; once the family is home it is a row of pictures across the bottom middle
  // (docs/FAMILY_PANEL.md §12). A family of four never reaches it. A family of twenty fills the column to its foot, and the
  // foot has to stop above the bar or the last children's portraits are under it (found 2026-09-22 by test:family-panel,
  // whose seed now rolls fourteen: the father's "Bring in the crop" took the click meant for his youngest).
  const hostResponse = await fetch(`${url}/api/host`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: app.state.hostKey }) });
  const hostCookie = hostResponse.headers.get('set-cookie').split(';')[0];
  assert.equal(hostResponse.status, 200, 'the Host could not sign in');
  const start = n => fetch(`${url}/api/command`, { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: hostCookie }, body: JSON.stringify({ id: `twenty-start-${n}-${Date.now()}`, action: 'start' }) });
  const started = await start(1);
  assert.equal(started.status, 200, `Start was refused: ${await started.text()}`);
  await page.waitForFunction(() => window.__snapshot?.world.status === 'running', null, { timeout: 30000 });
  await page.waitForFunction(() => window.__snapshot.world.entities.filter(e => e.kind === 'person').every(e => !e.travel), null, { timeout: 60000 });
  if (await page.locator('#selection-close').isVisible()) await page.locator('#selection-close').click();
  // The father's portrait, as a student chooses whose work is on the bar.
  await page.locator('#family-rows .panel-row').first().locator('.panel-portrait').click();
  if (await page.locator('#selection-close').isVisible()) await page.locator('#selection-close').click();
  const barClear = async size => {
    await page.setViewportSize(size);
    await page.waitForFunction(() => document.querySelectorAll('.panel-row[data-focused=true] .panel-icon').length > 3, null, { timeout: 30000 });
    await page.waitForTimeout(500);
    return page.evaluate(async () => {
      const panel = document.querySelector('#family-panel');
      const bar = document.querySelector('.panel-row[data-focused=true] .panel-icons').getBoundingClientRect();
      const box = panel.getBoundingClientRect();
      const last = [...document.querySelectorAll('#family-rows .panel-row')].at(-1);
      last.scrollIntoView({ block: 'end' });
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const face = last.querySelector('.panel-portrait').getBoundingClientRect();
      const top = document.elementFromPoint(face.left + face.width / 2, face.top + face.height / 2);
      const overlapsBar = box.bottom > bar.top && box.left < bar.right && box.right > bar.left;
      return { panelBottom: Math.round(box.bottom), barTop: Math.round(bar.top), barLeft: Math.round(bar.left), overlapsBar, lastOnTop: Boolean(top && last.contains(top)), covering: top ? `${top.tagName}.${top.className}` : 'nothing' };
    });
  };
  /**
   * A baby's short word (owner, 2026-09-27, by multiple choice: "Show a short word"; docs/CHILDREN.md §9): with the column too
   * tight for full rows, each baby's row that is not the main person's shows one word for what it is doing - beside its name, on
   * the name's own line, inside its row - where until then it showed nothing; its sentence is off the row and is the word's title.
   */
  const babyWords = () => page.evaluate(() => {
    const panel = document.querySelector('#family-panel');
    const shown = node => Boolean(node) && node.getClientRects().length > 0 && node.getBoundingClientRect().width > 0;
    const people = window.__snapshot.world.entities;
    const babies = [...document.querySelectorAll('#family-rows .panel-row')].filter(row => (people.find(one => one.id === row.dataset.entityId)?.age ?? 9) < 2);
    return { tight: panel.dataset.tight === 'true', babies: babies.map(row => {
      const word = row.querySelector('.panel-life-word'), line = row.querySelector('.panel-life-line'), name = row.querySelector('.panel-name'), body = row.querySelector('.panel-body');
      const wordBox = word?.getBoundingClientRect(), nameBox = name.getBoundingClientRect(), bodyBox = body.getBoundingClientRect();
      const middle = wordBox ? (wordBox.top + wordBox.bottom) / 2 : null;
      return { id: row.dataset.entityId, focused: row.dataset.focused === 'true', word: word?.textContent || null, wordShown: shown(word), lineShown: shown(line), sentence: line?.textContent || null, title: word?.title || null,
        onNameLine: middle !== null && middle >= nameBox.top - 1 && middle <= nameBox.bottom + 1, insideRow: Boolean(wordBox) && wordBox.left >= bodyBox.left - 1 && wordBox.right <= bodyBox.right + 1 };
    }) };
  });
  const WORDS = ['crawling', 'crying', 'held', 'napping', 'asleep', 'carried'];
  for (const size of [{ width: 1366, height: 768 }, { width: 1440, height: 950 }, { width: 1024, height: 768 }]) {
    const clear = await barClear(size);
    measured[`bar-${size.width}x${size.height}`] = clear;
    // Twenty rows, each on one line inside the column with the whole name in its box (owner, 2026-09-30, "Move Idle and House
    // off": the role and age, the name, a baby's word, Auto and the star - "daughter, 12", "Lavinia" - in the 19rem column).
    const rowsOut = await page.evaluate(() => {
      const panel = document.querySelector('#family-panel').getBoundingClientRect();
      return [...document.querySelectorAll('#family-rows .panel-row')].map(row => {
        const input = row.querySelector('.panel-name'), name = input.getBoundingClientRect(), middle = (name.top + name.bottom) / 2;
        const tools = [...row.querySelectorAll('.panel-tools > *')].filter(one => one.getClientRects().length).map(one => one.getBoundingClientRect());
        return { id: row.dataset.entityId, label: row.querySelector('.panel-label')?.textContent, name: input.value, right: Math.round(row.getBoundingClientRect().right), column: Math.round(panel.right),
          oneLine: tools.every(one => one.top <= middle && one.bottom >= middle), box: input.clientWidth, needs: input.scrollWidth };
      }).filter(row => row.right > row.column + 1 || !row.oneLine || row.needs > row.box + 1);
    });
    assert.deepEqual(rowsOut, [], `at ${size.width} by ${size.height} a row of twenty runs past the column, onto a second line, or cuts its name`);
    await page.screenshot({ path: `test-results/family-twenty-bar-${size.width}.png` });
    assert.ok(!clear.overlapsBar, `at ${size.width} by ${size.height} the panel runs down under the ability bar: ${JSON.stringify(clear)}`);
    assert.ok(clear.lastOnTop, `at ${size.width} by ${size.height} the youngest child's portrait is covered by ${clear.covering}`);
    ok(`with the class running at ${size.width} by ${size.height}, every one of the twenty rows stands on one line in the column with its name whole`);
    ok(`with the class running at ${size.width} by ${size.height}, the panel ends at ${clear.panelBottom} px above the ability bar at ${clear.barTop} px, and the youngest child's portrait can be pressed`);
    const words = await babyWords();
    measured[`baby-words-${size.width}x${size.height}`] = words;
    const others = words.babies.filter(one => !one.focused);
    assert.ok(words.tight, `at ${size.width} by ${size.height} twenty rows are not tight, so the short word was never asked for`);
    assert.ok(others.length >= 1, `at ${size.width} by ${size.height} the family of twenty has no baby's row to read: ${JSON.stringify(words)}`);
    for (const one of others) {
      assert.ok(one.wordShown && WORDS.includes(one.word), `at ${size.width} by ${size.height} a baby's row in the tight column shows no short word: ${JSON.stringify(one)}`);
      assert.ok(!one.lineShown, `at ${size.width} by ${size.height} a baby's sentence is on its row in the tight column as well as its word: ${JSON.stringify(one)}`);
      assert.ok(one.onNameLine && one.insideRow, `at ${size.width} by ${size.height} a baby's word is not beside its name inside its row: ${JSON.stringify(one)}`);
      assert.equal(one.title, one.sentence, `at ${size.width} by ${size.height} a baby's word does not carry its sentence`);
    }
    ok(`at ${size.width} by ${size.height}, the column tight, ${others.length} ${others.length === 1 ? 'baby’s row shows' : 'babies’ rows show'} one short word beside the name (${others.map(one => `"${one.word}"`).join(', ')}) and the sentence as its title`);
  }

  // ------------------------------------------------------------------------------------------------ a phone's width
  const phone = await browser.newContext({ reducedMotion: 'no-preference', viewport: { width: 400, height: 800 }, isMobile: true, hasTouch: true });
  await phone.addCookies(await context.cookies());
  const small = await phone.newPage();
  small.on('pageerror', error => errors.push(`phone: ${error.message}`));
  await small.goto(url);
  await meetFamily(small);
  await small.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-1');
  await small.locator('#family-panel').waitFor({ state: 'visible' });
  // The class is still in its lobby, so a page opened afresh shows the wagon again; it is put away as on the desktop.
  if (await small.locator('#wagon-done').isVisible()) await small.locator('#wagon-done').click();
  if (await small.locator('#tutorial-skip').isVisible()) await small.locator('#tutorial-skip').click();
  if (await small.locator('#selection-close').isVisible()) await small.locator('#selection-close').click();
  await small.waitForTimeout(600);
  const mobile = await layout(small);
  measured.phone = mobile;
  await small.screenshot({ path: 'test-results/family-twenty-phone.png' });
  // **A gate again** (owner, 2026-09-27, docs/GATES.md). From 2026-09-26 to 2026-09-27 these six were recorded and not
  // asserted, because phones are otherwise unsupported and since the compact action bar of 2026-09-22 they failed every run
  // (the panel on top at 35% of a 400 px screen, the map at 26%, the youngest of twenty under the bar). The owner made them a
  // gate for the family panel again and the phone's layout was fixed to hold them: the work bar one row that scrolls sideways,
  // and the column as tall as the room down to the bar's own top (public/style.css, public/app.js `fitColumn`). The
  // thresholds are the ones they always were. Phones stay "not officially supported" everywhere else; this is the panel's gate.
  const phoneLast = await lastRowReachable(small);
  measured.phoneLast = phoneLast;
  const phoneChecks = [
    [mobile.rows === 20, `${mobile.rows} rows`],
    [mobile.panel.bottom <= mobile.viewport.height, `the panel ends at ${mobile.panel.bottom} of ${mobile.viewport.height} px`],
    [mobile.pageScrolls === false, 'the page itself does not scroll'],
    [mobile.panelShare < 0.3, `the panel is on top at ${Math.round(mobile.panelShare * 100)}% of the screen (asked: under 30%)`],
    [mobile.mapShare > 0.4, `the map is on top at ${Math.round(mobile.mapShare * 100)}% below the guided start (asked: over 40%)`],
    [phoneLast.inside && phoneLast.onTop, `the last child can be brought into view (${JSON.stringify(phoneLast)})`],
  ].map(([held, what]) => ({ held: Boolean(held), what }));
  measured.phoneGate = { gate: true, since: '2026-09-27', checks: phoneChecks };
  await small.screenshot({ path: 'test-results/family-twenty-phone-last.png' });
  for (const one of phoneChecks) assert.ok(one.held, `on a 400 by 800 phone: ${one.what}`);
  ok(`on a 400 by 800 phone all six hold: ${phoneChecks.map(one => one.what).join('; ')}`);
  // The open row on one line inside the column with the name whole (owner, 2026-09-30, "Move Idle and House off": the row keeps to
  // its column with only a baby's word, Auto and the star beside the name).
  const openRow = await small.evaluate(() => {
    const panel = document.querySelector('#family-panel').getBoundingClientRect();
    return [...document.querySelectorAll('#family-rows .panel-row[data-expanded=true]')].map(row => {
      const input = row.querySelector('.panel-name'), name = input.getBoundingClientRect(), middle = (name.top + name.bottom) / 2;
      const tools = [...row.querySelectorAll('.panel-tools > *')].filter(one => one.getClientRects().length).map(one => one.getBoundingClientRect());
      return { id: row.dataset.entityId, name: input.value, inside: row.getBoundingClientRect().right <= Math.min(panel.right, innerWidth) + 1, oneLine: tools.every(one => one.top <= middle && one.bottom >= middle), whole: input.scrollWidth <= input.clientWidth + 1 };
    });
  });
  measured.phoneOpenRow = openRow;
  assert.ok(openRow.length && openRow.every(one => one.inside && one.oneLine && one.whole), `on a 400 by 800 phone the open row runs out, wraps or cuts its name: ${JSON.stringify(openRow)}`);
  ok(`on a 400 by 800 phone the open row (${openRow.map(one => one.name).join(', ')}) stands on one line inside the column with the name whole`);

  assert.deepEqual(errors, [], `page errors: ${errors.join('; ')}`);
  ok('no page error in either');
  mkdirSync('docs/evidence', { recursive: true });
  writeFileSync('docs/evidence/family-twenty-browser.json', `${JSON.stringify({
    record: 'family-twenty-browser', date: new Date().toISOString().slice(0, 10), seed,
    environment: 'Same computer: a local classroom server and headless Chrome. Not a physical LAN, a classroom, a Chromebook or a real phone.',
    pass, measured,
    screenshots: ['test-results/family-twenty-names.png', 'test-results/family-twenty-desktop.png', 'test-results/family-twenty-desktop-last.png', 'test-results/family-twenty-phone.png'],
  }, null, 2)}\n`);
  console.log(`\n${pass.length} checks passed; wrote docs/evidence/family-twenty-browser.json`);
} finally {
  await browser.close();
  await app.close?.();
}
process.exit(0);
