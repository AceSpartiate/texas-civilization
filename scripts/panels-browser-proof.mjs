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
// Same computer only: headless Chrome at 1366x768, 1024x768 and 390x844. Run: npm run test:panels
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { measureFourPanels } from './support/panel-states.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const pass = [];
const ok = label => { pass.push(label); console.log('PASS', label); };
const shots = [];
/** The Chromebook the school buys first, then the narrower one that found the last fault, then a phone. */
const SCREENS = [{ width: 1366, height: 768 }, { width: 1024, height: 768 }, { width: 390, height: 844 }];
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
