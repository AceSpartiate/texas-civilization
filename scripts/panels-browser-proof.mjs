// The four panels the screen-overlap study could not reach honestly, held to the rules they were found breaking.
//
// `scripts/screen-overlap-study.mjs` asks the browser what is drawn over what. Four panels were excluded from it and the
// reason was a good one (docs/FAMILY_PANEL.md §12.11): an earlier turn of that script simply unhid them, and **an empty
// panel has almost no height, so it covered nothing and the run read as clean** - worse than not asking. This reaches
// each of them with the server's own content in it and refuses to pass when it finds a fault. The study reports; this
// gate holds. Both read from one instrument, `scripts/support/panel-states.mjs`, so the numbers in the evidence and the
// numbers held to here are the same numbers.
//
// The first thing every check does is ask whether there is a panel on the screen at all. A check that does not is the
// fault this whole file exists to stop repeating.
//
// Same computer only: headless Chrome at the supported desktop sizes, 1366x768 and 1024x768. Run: npm run test:panels
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { measureFourPanels } from './support/panel-states.mjs';
import { createClassroom } from '../server/app.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { familyRoll } from '../sim/family.mjs';
import { meetFamily } from './support/meet-family.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const pass = [];
const ok = label => { pass.push(label); console.log('PASS', label); };
const shots = [];
/** The Chromebook the school buys first, then the narrower supported desktop size. */
const SCREENS = [{ width: 1366, height: 768 }, { width: 1024, height: 768 }];
/** Smaller than any of the four really is, and larger than any of them collapsed. */
const PANEL = { width: 120, height: 60 };

mkdirSync('test-results', { recursive: true });
mkdirSync('docs/evidence', { recursive: true });
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const measured = {};

try {
  for (const screen of SCREENS) {
    const at = `${screen.width}x${screen.height}`;
    const seen = await measureFourPanels(browser, screen, { shot: path => shots.push(path) });
    measured[at] = seen;
    assert.equal(seen.length, 4, `${at}: ${seen.length} of the four panels were walked, not 4`);

    // ------------------------------------------------------------------ every one of the four is really on the screen
    // **The check this file exists for.** A hidden panel has a box of zero size: it overlaps nothing, it is never off
    // the screen, and a run full of them reads as perfectly clean. Every number below is worthless without this one.
    for (const one of seen) {
      assert.ok(one.measured.real, `${at}: ${one.panel} was never drawn, or is too small to be a panel: ${JSON.stringify(one.measured.panelBox)} - an empty panel covers nothing and would read as clean`);
      assert.ok(one.measured.ownControls >= 1, `${at}: ${one.panel} is drawn but carries no control a student could press, so it is not the panel this measures`);
      assert.ok((one.measured.words || '').length >= 20, `${at}: ${one.panel} is drawn but nearly wordless ("${one.measured.words}"), so the server's own content never reached it`);
    }
    ok(`${at}: all four panels really drawn, with the server's own words in them (${seen.map(one => `${one.panel} ${one.measured.panelBox.w}x${one.measured.panelBox.h}`).join(', ')})`);

    // --------------------------------------------------------------------- and none of them is off the screen's edge
    for (const one of seen) {
      assert.ok(one.measured.panelFits, `${at}: ${one.panel} hangs off the edge of the screen at ${JSON.stringify(one.measured.panelBox)}`);
      assert.deepEqual(one.measured.ownControlsCovered, [], `${at}: ${one.panel} cannot be used - its own controls ${one.measured.ownControlsCovered.join(', ')} have something drawn over them`);
    }
    ok(`${at}: all four fit the screen and none has anything drawn over its own controls`);

    // ------------------------------------------------------------- nothing is drawn over the guided start's own words
    // §12.11, on the panels that dim the map: "The strip stays above the dim, because it is the instruction." A panel
    // that covers the strip breaks the same rule by other means, and this is where all three of these were found doing
    // it: the call's menu wholly covered "Show placement controls" at 1024, and the meeting covered it at every size -
    // wholly on a phone, where the guided start's only control could not be pressed at all while a rider stood.
    for (const one of seen) {
      const strip = one.measured.against.strip;
      if (!strip) continue;
      assert.ok(!strip.shares, `${at}: ${one.panel} is drawn over the guided start by ${strip.overlapWidth}x${strip.overlapHeight}px, and the strip is the instruction`);
    }
    const onTheStrip = seen.flatMap(one => [...one.measured.covered, ...one.measured.partly].filter(entry => entry.control === '#lesson-action' || entry.control === '#lesson-help').map(entry => `${one.panel} over ${entry.control}`));
    assert.deepEqual(onTheStrip, [], `${at}: the guided start's own words are covered: ${onTheStrip.join('; ')}`);
    ok(`${at}: none of the four is drawn over the guided start, and nothing covers a word or a control of it`);

    // ------------------------------------------------------------ the bar steps aside while a rider talks, and returns
    // Owner, 2026-09-22, by multiple choice over the numbers this file used to print as contested: "While a rider is
    // talking, the ability bar is not drawn ... and the bar comes back the instant the meeting closes." The meeting and
    // the bar shared 520x48px at 1366 and 520x42 at 1024. A bar hidden by `display:none` has no box, so `against.bar` is
    // null for a bar that is gone - and also for a bar that was never there. The second assertion tells the two apart.
    const meeting = seen.find(one => one.panel === '#encounter');
    assert.ok(!meeting.measured.against.bar?.shares, `${at}: the ability bar is drawn under the meeting, sharing ${meeting.measured.against.bar?.overlapWidth}x${meeting.measured.against.bar?.overlapHeight}px with it`);
    assert.ok(meeting.afterwards?.meetingShut && meeting.afterwards.barDrawn, `${at}: the meeting closed and the ability bar did not come back: ${JSON.stringify(meeting.afterwards)}`);
    ok(`${at}: no ability bar under the meeting, and the bar is back the moment the meeting shuts`);

    // ------------------------------------------------ the column folds to faces while a place is chosen, and reopens
    // Owner, 2026-09-22: "While you are choosing a place, the family column collapses to its narrow strip of portraits -
    // a state that already exists as 'Hide names' - and opens again afterwards." The two panels shared 304px of the
    // column's width at every size. Held against the faces and the fold button, not `#hud-left`, whose box is as wide as
    // its longest status line and would read the empty space beside the faces as covered.
    for (const one of seen.filter(entry => entry.panel === '#site-choose' || entry.panel === '#survey-choose')) {
      for (const part of ['faces', 'fold']) {
        const against = one.measured.against[part];
        assert.ok(against, `${at}: ${one.panel} was measured with no ${part} on the screen, so nothing here was checked`);
        assert.ok(!against.shares, `${at}: ${one.panel} is drawn over the family's ${part} by ${against.overlapWidth}x${against.overlapHeight}px`);
      }
      // Counted by what is on top, not by whose control it is. The family's own parts overlap each other - the "!" sits
      // on a portrait's corner, and a round badge's corner points land on the map - under all four panels alike, and the
      // first run of this check read those as the placement panel covering the family.
      const onTheFamily = [...one.measured.covered, ...one.measured.partly]
        // Only the family's column, which is what the owner's decision was about. At 390 the docked person card is open
        // in this state since 2026-09-22 (a portrait's first press selects) and the site panel lies over three of its
        // controls - as the panel's old full-width place would too. That pair is recorded in the evidence, not held here.
        .filter(entry => /^#family-|panel-/.test(entry.control))
        .filter(entry => entry.by.some(on => on === one.panel || /^#(site|survey)-/.test(on)))
        .map(entry => `${entry.control} "${entry.label}" under ${entry.by.join(', ')}`);
      assert.deepEqual(onTheFamily, [], `${at}: ${one.panel} covers part of the family: ${onTheFamily.join(', ')}`);
    }
    const fold = seen.find(one => one.panel === '#survey-choose').afterwards;
    assert.deepEqual(fold, { foldedBefore: false, foldedDuring: true, panelShut: true, foldedAfter: false }, `${at}: the column did not fold for the stake and open again after it: ${JSON.stringify(fold)}`);
    ok(`${at}: both placement panels stand clear of the folded faces, and the names open again when the stake is put away`);
  }

  // --------------------------------------------- a family of twenty, two on auto: the column above the bar, at both sizes
  // docs/FAMILY_PANEL.md §17 (owner, 2026-09-25: "Fix it"). At 1024x768 a two-row bar rose above the column's fixed
  // `bottom:200px` and covered its foot, and the auto lines made the column taller. The column is bounded by the bar's
  // measured top now. Held here for the largest family the die makes, with the guided start's lifted bar and the full
  // bar after it is stopped: no row of the column is under the bar or the Journal and Land buttons or off the screen,
  // the main person is scrolled into view, and the list scrolls down to the youngest child.
  const column = await measureTheColumn(browser);

  // ---------------------------------------------------------------- what is still contested, measured and not asserted
  // Two of the faults this found were not repairs, and were printed here with their numbers until the owner chose between
  // them (2026-09-22; docs/FAMILY_PANEL.md §12.12). Both are asserted above now, and the numbers below should read
  // "nothing" for them. What is still genuinely open is the meeting over the column, which on a phone is the whole column.
  const contested = Object.entries(measured).map(([at, seen]) => ({
    at,
    meetingOverTheBar: seen.find(one => one.panel === '#encounter')?.measured.against.bar,
    meetingOverTheColumn: seen.find(one => one.panel === '#encounter')?.measured.against.column,
    siteOverTheColumn: seen.find(one => one.panel === '#site-choose')?.measured.against.column,
    surveyOverTheColumn: seen.find(one => one.panel === '#survey-choose')?.measured.against.column,
    coveredByTheMeeting: seen.find(one => one.panel === '#encounter')?.measured.covered.length ?? null,
    siteOverTheCard: seen.find(one => one.panel === '#site-choose')?.measured.against.card,
  }));
  // A rectangle that does not overlap has a negative side, and printing that as a measurement reads as a fault that is
  // not there. Only a real overlap is given a number.
  const shared = against => (against?.shares ? `${against.overlapWidth}x${against.overlapHeight}px` : 'nothing');
  for (const row of contested) {
    console.log(`\n  ${row.at}: the meeting shares ${shared(row.meetingOverTheBar)} with the ability bar and ${shared(row.meetingOverTheColumn)} with the family's column (${row.coveredByTheMeeting} controls wholly covered); the site panel shares ${shared(row.siteOverTheColumn)} with the column and the stake panel ${shared(row.surveyOverTheColumn)}`);
  }

  writeFileSync('docs/evidence/panels-browser.json', `${JSON.stringify({
    record: 'panels-browser', date: new Date().toISOString().slice(0, 10), browser: await browser.version(),
    screens: SCREENS, panel: PANEL,
    task: 'The four panels scripts/screen-overlap-study.mjs could not reach honestly (docs/FAMILY_PANEL.md §12.11): #site-choose, #survey-choose, #encounter and #call-menu, reached in a real state with the server\'s own content in them and measured.',
    environment: 'Same computer: a local classroom server and headless Chrome. Not a physical LAN, a Chromebook, a classroom or a touch screen.',
    checks: pass, measured, contested, screenshots: shots,
    column: { measured: column, task: 'docs/FAMILY_PANEL.md §17: a rolled family of twenty with two people on auto, at 1366x768 and 1024x768, during the guided start (its bar lifted 40px) and after it is stopped (the full bar): the column\'s foot above the bar\'s top and the bottom buttons, every row in view on top at its portrait, the main person scrolled into view, and the youngest child reached by scrolling. Screenshots: test-results/column-*.png (or COLUMN_SHOTS).' },
    notProved: [
      'The meeting still stands over the family\'s column on a phone (and by 64px at 1024). Nobody has decided that one; it is recorded with numbers, not asserted.',
      'On a phone the site panel lies over the docked person card, three of its controls included (siteOverTheCard in contested). Its old full-width place overlapped the card too, by box arithmetic; nobody has decided which of the two should give way.',
      'The fold is checked opening again after the stake is put away with Not now, not after a house site is actually set: setting one would end the placing and the class this walks together.',
      'One family, one seed and one lesson step per panel. A family of one parent, a long name, and the steps between arriving and the stake are not walked.',
      'No real assistive technology, no physical LAN, no Chromebook and no touch screen.',
    ],
  }, null, 2)}\n`);
  console.log(`\n${pass.length} checks pass over ${SCREENS.length} sizes; wrote docs/evidence/panels-browser.json`);
} finally {
  await browser.close();
}

/**
 * The family column with the largest family the die makes (docs/FAMILY_PANEL.md §17). A seed whose first family rolls a
 * 20, found rather than forced, played in a real class: joined, made, started, home. Two of the grown people are put on
 * auto from the page, as a student presses the switch, so their rows carry the auto sentence.
 */
async function measureTheColumn(browser) {
  let n = 0; while (familyRoll(`column-${n}`, 'hh-1') !== 20) n++;
  const seed = `column-${n}`;
  const app = createClassroom({ seed, playerCount: 5, tickMs: 300, worldFactory: createGonzalesWorld });
  const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
  const post = async (path, body, cookie) => {
    const response = await fetch(url + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(cookie && { Cookie: cookie }) }, body: JSON.stringify(body) });
    assert.equal(response.status, 200, `${path}: ${response.status} ${await response.clone().text()}`);
    return response;
  };
  const scratch = process.env.COLUMN_SHOTS || 'test-results';
  mkdirSync(scratch, { recursive: true });
  const seen = { seed };
  const context = await browser.newContext({ reducedMotion: 'no-preference', viewport: SCREENS[0] });
  try {
    const hostCookie = (await post('/api/host', { key: app.state.hostKey })).headers.get('set-cookie').split(';')[0];
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(url);
    await page.locator('[name=name]').fill('Twenty');
    await page.locator('[name=code]').fill(app.state.sessionCode);
    await page.getByRole('button', { name: 'Join', exact: true }).click();
    await page.waitForFunction(() => window.__snapshot?.world.householdId === 'hh-1');
    await meetFamily(page, 'Twentyman');
    if (await page.locator('#wagon-done').isVisible()) await page.locator('#wagon-done').click();
    if (await page.locator('#tutorial-skip').isVisible()) await page.locator('#tutorial-skip').click();
    await page.waitForFunction(() => document.querySelectorAll('#family-rows .panel-row').length === 20, null, { timeout: 20000 });
    await post('/api/command', { id: `column-start-${Date.now()}`, action: 'start', anyway: true }, hostCookie);
    await page.waitForFunction(() => window.__snapshot?.world.status === 'running', null, { timeout: 20000 });
    await page.waitForFunction(() => window.__snapshot.world.entities.filter(e => e.kind === 'person' && window.__snapshot.world.household.members.includes(e.id)).every(e => !e.travel), null, { timeout: 90000 });
    const close = async () => { if (await page.locator('#selection-close').isVisible()) await page.locator('#selection-close').click(); };
    await close();
    // Two grown people on auto, pressed on their own rows' switches as a student presses them: the mother and the eldest child.
    const onAuto = await page.evaluate(() => [...document.querySelectorAll('#family-rows .panel-row')].slice(1, 3).map(row => row.dataset.entityId));
    for (const id of onAuto) {
      await page.locator(`.panel-auto[data-auto="${id}"]`).scrollIntoViewIfNeeded();
      await page.locator(`.panel-auto[data-auto="${id}"]`).click();
    }
    await page.waitForFunction(ids => ids.every(id => document.querySelector(`.panel-row[data-entity-id="${id}"]`)?.dataset.onAuto === 'true'), onAuto, { timeout: 20000 });
    seen.onAuto = onAuto;

    /** Everything this holds, read off the page: the boxes, what is on top at each row's portrait, the scroll. */
    const read = () => page.evaluate(async () => {
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const panel = document.querySelector('#family-panel'), box = panel.getBoundingClientRect();
      const barEl = document.querySelector('.panel-row[data-focused=true] .panel-icons');
      const bar = barEl?.getBoundingClientRect();
      const tools = document.querySelector('#map-tools')?.getBoundingClientRect();
      const plain = one => one && { left: Math.round(one.left), right: Math.round(one.right), top: Math.round(one.top), bottom: Math.round(one.bottom) };
      const across = (one, other) => one.right > other.left && one.left < other.right;
      const rows = [...document.querySelectorAll('#family-rows .panel-row')];
      // Each row whose portrait is in the column's view: the part of it in view inside the screen and clear of the bar, and
      // the portrait on top at the middle of its visible part.
      const faces = rows.map(row => {
        const face = row.querySelector('.panel-portrait').getBoundingClientRect(), whole = row.getBoundingClientRect();
        const inView = face.bottom > box.top + 1 && face.top < box.bottom - 1;
        const from = Math.max(face.top, box.top), to = Math.min(face.bottom, box.bottom);
        const middle = inView ? document.elementFromPoint(face.left + face.width / 2, (from + to) / 2) : null;
        const visibleBottom = Math.min(whole.bottom, box.bottom);
        return { id: row.dataset.entityId, inView, onTop: Boolean(middle && row.contains(middle)), by: middle && !row.contains(middle) ? `${middle.tagName}#${middle.id}.${middle.className}` : null,
          whole: plain(whole), underBar: Boolean(bar && bar.width && inView && across(whole, { left: 0, right: innerWidth }) && visibleBottom > bar.top),
          offScreen: inView && (visibleBottom > innerHeight || whole.left < 0) };
      });
      const main = rows.find(row => row.dataset.focused === 'true');
      const mainBox = main?.getBoundingClientRect();
      const switches = rows.filter(row => row.dataset.onAuto === 'true').map(row => {
        const button = row.querySelector('.panel-auto'), line = row.querySelector('.panel-auto-line');
        return { id: row.dataset.entityId, word: button.querySelector('.panel-auto-word').textContent, pressed: button.getAttribute('aria-pressed'), glow: getComputedStyle(button).boxShadow,
          lineShown: !line.hidden && line.getClientRects().length > 0, line: line.textContent, tip: button.title, main: row.dataset.focused === 'true' };
      });
      return {
        viewport: { width: innerWidth, height: innerHeight }, column: plain(box), bar: bar && bar.width ? { ...plain(bar), rows: Math.round((bar.height - 16 + 4) / 74) } : null,
        tools: plain(tools), toolsAcross: Boolean(tools && across(tools, box)), room: getComputedStyle(document.querySelector('#hud-left')).bottom,
        scrolls: panel.scrollHeight > panel.clientHeight + 1, scrollTop: Math.round(panel.scrollTop), scrollHeight: panel.scrollHeight, clientHeight: panel.clientHeight,
        tight: panel.dataset.tight === 'true', lesson: document.body.dataset.lesson === 'true', faces, switches,
        main: main ? { id: main.dataset.entityId, inside: mainBox.top >= box.top - 1 && mainBox.bottom <= box.bottom + 1 } : null,
      };
    });
    /** The rules, for one reading. */
    const hold = (at, seen) => {
      assert.ok(seen.bar, `${at}: no ability bar on the screen, so nothing was measured against it`);
      assert.ok(seen.column.bottom <= seen.bar.top, `${at}: the column ends at ${seen.column.bottom}px, under the bar's top at ${seen.bar.top}px`);
      assert.ok(seen.column.bottom <= seen.viewport.height, `${at}: the column runs off the screen to ${seen.column.bottom}px`);
      if (seen.toolsAcross) assert.ok(seen.column.bottom <= seen.tools.top, `${at}: the column ends under the Journal and Land buttons (${seen.tools.top}px)`);
      const shown = seen.faces.filter(face => face.inView);
      assert.ok(shown.length >= 3, `${at}: only ${shown.length} rows are in the column's view`);
      const wrong = shown.filter(face => face.underBar || face.offScreen || !face.onTop);
      assert.deepEqual(wrong, [], `${at}: rows under the bar, off the screen or covered: ${JSON.stringify(wrong)}`);
      assert.ok(seen.scrolls, `${at}: twenty rows fit without scrolling, which this proof does not believe`);
      assert.ok(seen.main?.inside, `${at}: the main person's row is not in the column's view: ${JSON.stringify(seen.main)}`);
      // The two on auto keep their word and their green glow, whether or not the sentence is on the row.
      assert.equal(seen.switches.length, 2, `${at}: ${seen.switches.length} rows are on auto, not 2`);
      for (const one of seen.switches) {
        assert.equal(one.word, 'Auto ✓', `${at}: ${one.id}'s switch reads "${one.word}"`);
        assert.equal(one.pressed, 'true');
        // Green, never the gold of work being done: read off the shadow's first colour, whatever frame the breathing glow is at.
        const [r, g, b] = (one.glow.match(/rgba?\((\d+), (\d+), (\d+)/) || []).slice(1).map(Number);
        assert.ok(g > 150 && g > r + 40 && g > b + 60, `${at}: ${one.id}'s switch does not glow green: ${one.glow}`);
        assert.ok(one.line && one.tip.includes(one.line), `${at}: ${one.id}'s auto sentence "${one.line}" is not in the switch's tooltip "${one.tip}"`);
        if (one.main) assert.ok(one.lineShown, `${at}: the main person's auto sentence is hidden`);
        else assert.equal(one.lineShown, !seen.tight, `${at}: ${one.id}'s auto sentence is ${one.lineShown ? 'shown' : 'hidden'} with the column ${seen.tight ? 'tight' : 'roomy'}`);
      }
    };
    /** The list scrolled to its foot: the youngest child in view, on top, above the bar. */
    const reachLast = () => page.evaluate(async () => {
      const panel = document.querySelector('#family-panel');
      panel.scrollTop = panel.scrollHeight;
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const last = [...document.querySelectorAll('#family-rows .panel-row')].at(-1);
      const face = last.querySelector('.panel-portrait').getBoundingClientRect(), box = panel.getBoundingClientRect();
      const bar = document.querySelector('.panel-row[data-focused=true] .panel-icons')?.getBoundingClientRect();
      const top = document.elementFromPoint(face.left + face.width / 2, face.top + face.height / 2);
      return { inside: face.top >= box.top - 1 && face.bottom <= box.bottom + 1 && face.bottom <= innerHeight, onTop: Boolean(top && last.contains(top)),
        aboveBar: !bar?.width || last.getBoundingClientRect().bottom <= bar.top, scrollTop: Math.round(panel.scrollTop), by: top && !last.contains(top) ? `${top.tagName}#${top.id}.${top.className}` : null };
    });
    /** The last grown row made the main person with the list scrolled to its top, as the star does: brought into view. */
    const chooseLater = async () => {
      const later = await page.evaluate(() => {
        const people = window.__snapshot.world.entities;
        return [...document.querySelectorAll('#family-rows .panel-row')].map(row => row.dataset.entityId)
          .filter(id => { const one = people.find(e => e.id === id); return one && one.age >= 10 && !['dead', 'captured'].includes(one.health?.condition); }).at(-1);
      });
      await page.evaluate(() => { document.querySelector('#family-panel').scrollTop = 0; });
      await page.evaluate(async id => {
        const response = await fetch('/api/command', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: `column-main-${Math.random().toString(36).slice(2)}`, action: 'set-main', entityId: id }) });
        if (response.status !== 200) throw new Error(await response.text());
      }, later);
      await page.waitForFunction(id => document.querySelector(`.panel-row[data-entity-id="${id}"]`)?.dataset.focused === 'true', later, { timeout: 15000 });
      await page.waitForTimeout(400);
      return later;
    };
    const father = await page.evaluate(() => document.querySelector('#family-rows .panel-row').dataset.entityId);
    const toFather = async () => {
      await page.evaluate(() => { document.querySelector('#family-panel').scrollTop = 0; });
      await page.locator(`.panel-focus[data-focus="${father}"]`).click();
      await page.waitForFunction(id => document.querySelector(`.panel-row[data-entity-id="${id}"]`)?.dataset.focused === 'true', father, { timeout: 15000 });
      await close();
      await page.waitForTimeout(400);
    };

    for (const phase of ['lesson', 'full']) {
      if (phase === 'full' && await page.evaluate(() => 'lesson' in window.__snapshot.world && !document.querySelector('#lesson-stop')?.hidden)) {
        await page.locator('#lesson-stop').click();
        await page.locator('#lesson-stop-yes').click();
        await page.waitForFunction(() => !('lesson' in window.__snapshot.world), null, { timeout: 20000 });
      }
      for (const screen of SCREENS) {
        const at = `${screen.width}x${screen.height}, ${phase === 'lesson' ? 'the guided start' : 'the full bar'}`;
        await page.setViewportSize(screen);
        await toFather();
        const first = await read();
        const name = `column-${screen.width}x${screen.height}${phase === 'lesson' ? '-lesson' : ''}`;
        await page.screenshot({ path: `${scratch}/${name}.png` });
        // Recorded without the per-row detail, which is what the assertions read: the rows in view by id and top edge.
        const brief = one => ({ ...one, faces: one.faces.filter(face => face.inView).map(face => `${face.id} ${face.whole.top}-${face.whole.bottom}`), switches: one.switches.map(({ tip, glow, ...rest }) => rest) });
        seen[`${screen.width}x${screen.height}-${phase}`] = { father: brief(first) };
        hold(at, first);
        const last = await reachLast();
        await page.screenshot({ path: `${scratch}/${name}-last.png` });
        seen[`${screen.width}x${screen.height}-${phase}`].last = last;
        assert.ok(last.inside && last.onTop && last.aboveBar, `${at}: the youngest child cannot be scrolled into view clear of the bar: ${JSON.stringify(last)}`);
        const later = await chooseLater();
        const chosen = await read();
        await page.screenshot({ path: `${scratch}/${name}-main.png` });
        seen[`${screen.width}x${screen.height}-${phase}`].laterMain = { id: later, scrollTop: chosen.scrollTop, bar: chosen.bar, column: chosen.column, tight: chosen.tight };
        hold(`${at}, a later row the main person`, chosen);
        assert.equal(chosen.main.id, later);
        ok(`${at}: a family of twenty, two on auto - the column ends at ${first.column.bottom}px above the bar's top at ${first.bar.top}px (${first.bar.rows} row${first.bar.rows === 1 ? '' : 's'}), ${first.faces.filter(face => face.inView).length} rows in view and none covered, ${first.tight ? 'the auto sentences off the other rows and in the tooltips' : 'the auto sentences on the rows'}; the youngest reached by scrolling; the main person scrolled into view (to ${chosen.scrollTop}px)`);
      }
    }
    assert.deepEqual(errors, [], `page errors: ${errors.join('; ')}`);
    return seen;
  } finally {
    await context.close();
    await app.close?.();
  }
}
