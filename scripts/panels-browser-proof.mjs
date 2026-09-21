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
  }

  // ---------------------------------------------------------------- what is still contested, measured and not asserted
  // Two of the faults this found are not repairs, and choosing between them is the owner's (HANDOFF.md, and
  // docs/FAMILY_PANEL.md §12.12). They are recorded here with their numbers so that the day they are decided, the
  // decision has arithmetic under it rather than an opinion.
  const contested = Object.entries(measured).map(([at, seen]) => ({
    at,
    meetingOverTheBar: seen.find(one => one.panel === '#encounter')?.measured.against.bar,
    meetingOverTheColumn: seen.find(one => one.panel === '#encounter')?.measured.against.column,
    siteOverTheColumn: seen.find(one => one.panel === '#site-choose')?.measured.against.column,
    surveyOverTheColumn: seen.find(one => one.panel === '#survey-choose')?.measured.against.column,
    coveredByTheMeeting: seen.find(one => one.panel === '#encounter')?.measured.covered.length ?? null,
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
      'The meeting and the ability bar still want the same pixels, and the two placement panels and the family\'s column still want the same pixels. Both are recorded with numbers and left to the owner; neither is asserted here.',
      'One family, one seed and one lesson step per panel. A family of one parent, a long name, and the steps between arriving and the stake are not walked.',
      'No real assistive technology, no physical LAN, no Chromebook and no touch screen.',
    ],
  }, null, 2)}\n`);
  console.log(`\n${pass.length} checks pass over ${SCREENS.length} sizes; wrote docs/evidence/panels-browser.json`);
} finally {
  await browser.close();
}
