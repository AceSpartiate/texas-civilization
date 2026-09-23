// A person who can do nothing says why, in one line, in a real browser at the size a class plays it: 1366x768.
//
// The owner, 2026-09-21: "When I switch characters, the action bar at the bottom should switch to that person's bar."
// Asked what an empty bar should show, they chose one line saying why, in the person's own terms, over a row of greyed
// icons and over leaving it blank.
//
// tests/panel-silence.test.mjs proves which sentence is chosen, against the simulation, and scripts/panel-silence-injections.mjs
// holds that down. What only a browser can show is here, and it is the half that lives in public/app.js and
// public/style.css: that the line is really drawn on a child's row where the icon group is not drawn at all, that the
// main person's line is in the bar at the bottom of the screen instead of on their row, that it is never said twice, and
// that a bar the guided start has shut still shows its icons and says nothing of the kind.
//
// Run: npm run test:panel-silence
//      node scripts/panel-silence-browser-proof.mjs --inject   (each fault put in, the proof re-run, the file put back)
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createClassroom } from '../server/app.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { rollFamily } from '../sim/world.mjs';
import { meetFamily } from './support/meet-family.mjs';
import { holdLesson, installLessonStub, stubStep } from './support/lesson-stub.mjs';

// ------------------------------------------------------------------------------------------------ the injections
// Each is the mistake one check below is written against, in the page's own half of this. `--inject` puts one in, runs
// this proof as a fresh process, records which checks failed, and puts the file back byte for byte.
const INJECTIONS = [
  {
    file: 'public/app.js',
    name: 'the line is drawn on every row, so the main person is told the same thing twice - on their row and in their bar',
    from: '    const silence = focused ? \'\' : reason || \'\';',
    to: '    const silence = reason || \'\';',
  },
  {
    file: 'public/app.js',
    name: 'the row reads its reason from the icons alone, so somebody dead or captured is a face, a name and nothing',
    from: '    const reason = rowReason(icons, { offered, entity });',
    to: '    const reason = rowReason(icons);',
  },
  {
    file: 'public/style.css',
    name: 'the line is drawn in the row but folded out of sight, which is the empty bar again with extra steps',
    from: '.panel-why{grid-row:3;grid-column:1 / -1;font:11px/1.3 Georgia,serif;color:#e4d6ae;padding:1px 1px 0}',
    to: '.panel-why{display:none}',
  },
];

if (process.argv.includes('--inject')) {
  const self = process.argv[1];
  const run = () => {
    const result = spawnSync(process.execPath, [self], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, env: process.env });
    return [...`${result.stdout}${result.stderr}`.matchAll(/^FAIL (.+)$/gm)].map(match => match[1]);
  };
  const clean = run();
  if (clean.length) throw new Error(`The proof fails before any injection: ${clean.join('; ')}`);
  const record = [];
  for (const injection of INJECTIONS) {
    const original = readFileSync(injection.file, 'utf8');
    // A working copy on Windows has CRLF and these patterns are written with plain newlines; a pattern that cannot match
    // is a harness that quietly proves nothing. Four harnesses here have been caught doing exactly that.
    const CR = String.fromCharCode(13), LF = String.fromCharCode(10);
    const ends = text => (original.includes(CR + LF) ? text.split(LF).join(CR + LF) : text);
    const from = ends(injection.from), to = ends(injection.to);
    const count = original.split(from).length - 1;
    if (count !== 1) throw new Error(`${injection.name}: the text to replace is in ${injection.file} ${count} times`);
    writeFileSync(injection.file, original.replace(from, to));
    let failed;
    try { failed = run(); } finally { writeFileSync(injection.file, original); }
    record.push({ name: injection.name, file: injection.file, failed });
    console.log(`${failed.length ? 'caught' : 'MISSED'}: ${injection.name} -> ${failed.join(' | ') || 'nothing failed'}`);
  }
  if (run().length) throw new Error('The proof fails after every file was put back');
  mkdirSync('docs/evidence', { recursive: true });
  writeFileSync('docs/evidence/panel-silence-screen-injections.json', `${JSON.stringify({ record: 'panel-silence-screen-injections', date: new Date().toISOString().slice(0, 10), proof: 'scripts/panel-silence-browser-proof.mjs', injections: record }, null, 2)}\n`);
  console.log(`\n${record.filter(one => one.failed.length).length} of ${record.length} caught; wrote docs/evidence/panel-silence-screen-injections.json`);
  process.exit(0);
}

// ------------------------------------------------------------------------------------------------------- the proof
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

/** The Chromebook the school buys, which is the screen this record is about. */
const SCREEN = { width: 1366, height: 768 };
// This seed deals the first family a father of 45, a mother of 41 and four children under ten, which is the family the
// owner hit: four rows that could do nothing and said nothing about it.
const SEED = 'panel-silence';

const failures = [];
const check = (condition, label) => { if (condition) console.log('PASS', label); else { failures.push(label); console.log(`FAIL ${label}`); } };
const measured = {};

/**
 * The class this proof plays, with one thing set that no order can set: the mother taken prisoner. A row whose person is
 * dead or captured is the emptiest there is - `panelActions` gives it no icons at all - and there is no command a
 * student or a teacher can send that produces one, so it is dealt with the world. The family is rolled here too, because
 * `rollFamily` replaces the founding four and would undo it; the join flow then meets a family already made, which is
 * exactly what a student rejoining a running class meets.
 */
const worldFactory = (seed, playerCount, options) => {
  const world = createGonzalesWorld(seed, playerCount, options);
  rollFamily(world, world.households['hh-1']);
  const mother = world.households['hh-1'].members[1];
  world.entities[mother].health = { condition: 'captured' };
  world.entities[mother].task = 'rest';
  world.entities[mother].chore = null;
  return world;
};

const app = createClassroom({ seed: SEED, playerCount: 5, tickMs: 250, worldFactory });
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
  await post('/api/command', { id: 'cmd-start', action: 'start', anyway: true }, hostCookie);
  await page.waitForFunction(() => window.__snapshot?.world.status === 'running', null, { timeout: 20000 });
  // The family on its own land, with no step of the guided start shutting anything: the bar is the family's own.
  await holdLesson(page, 'none');
  await page.waitForFunction(() => document.querySelector('.panel-row[data-focused=true] .panel-icon:not([aria-disabled=true])'), null, { timeout: 60000 });

  /** Every row as the page has it, with what its line says and whether that line is really on the screen. */
  const rowsOf = () => page.evaluate(() => {
    const world = window.__snapshot.world;
    return [...document.querySelectorAll('.panel-row')].map(row => {
      const id = row.dataset.entityId;
      const line = row.querySelector('.panel-why');
      const box = line?.getBoundingClientRect();
      const group = row.querySelector('.panel-icons');
      const groupBox = group?.getBoundingClientRect();
      const reason = group?.querySelector('.panel-reason');
      return {
        id, name: world.entities.find(one => one.id === id)?.name || null,
        focused: row.dataset.focused === 'true',
        // What the row's own line says, and whether a student can actually see it there.
        line: line && !line.hidden ? line.textContent : null,
        lineShown: Boolean(box && box.width > 0 && box.height > 0),
        lineBox: box ? { left: Math.round(box.left), top: Math.round(box.top), right: Math.round(box.right), bottom: Math.round(box.bottom) } : null,
        // The icon group: drawn at all, how many icons in it, and whether it is carrying the line instead.
        groupDrawn: Boolean(groupBox && groupBox.width > 0),
        icons: group ? group.querySelectorAll('.panel-icon').length : 0,
        open: group ? [...group.querySelectorAll('.panel-icon')].filter(one => one.getAttribute('aria-disabled') !== 'true').length : 0,
        barLine: reason ? reason.textContent : null,
        barBox: reason ? (b => ({ left: Math.round(b.left), top: Math.round(b.top), right: Math.round(b.right), bottom: Math.round(b.bottom) }))(reason.getBoundingClientRect()) : null,
        // The sentence the server itself put on this person's work, which is what every line must be.
        sent: [...new Set((world.work?.[id] || []).filter(entry => !entry.can).map(entry => entry.why).filter(Boolean))],
        tooYoung: (world.work?.[id] || []).some(entry => /is too young to be sent/.test(entry.why || '')),
      };
    });
  });

  // ---------------------------------------------------------------- a child under ten: a face, a name, and now a reason
  let rows = await rowsOf();
  measured.rows = rows.map(row => ({ name: row.name, focused: row.focused, icons: row.icons, open: row.open, line: row.line, barLine: row.barLine }));
  const young = rows.filter(row => row.tooYoung);
  // Two when this was written, because every child under ten was refused everything. Since the children's works of
  // 2026-09-21 (`sim/children.mjs`) a child of two and over has a bar of their own, so what is left refused is the
  // infants - usually one in a family. One is enough to measure the fault, and the prisoner below is measured too; what
  // this guard is for is that the row really is on the screen with really nothing on it, which the checks inside the
  // loop assert one by one.
  check(young.length >= 1, `this class deals ${young.length} of the family refused everything, so the fault being measured is really on the screen`);
  for (const row of young) {
    // The fault could appear: this row's icon group is not drawn at all, so without a line it is a face and a name.
    check(!row.groupDrawn, `${row.name}: the icon group is not drawn on their row, which is the empty bar being measured`);
    check(row.lineShown, `${row.name}: the reason is really drawn on their row`);
    check(row.sent.length === 1 && row.line === row.sent[0], `${row.name}: the line is the server's own sentence, word for word - "${row.line}"`);
    check(row.line === `${row.name} is too young to be sent.`, `${row.name}: the line names them and says why - "${row.line}"`);
    check(row.lineBox.right <= SCREEN.width && row.lineBox.bottom <= SCREEN.height && row.lineBox.left >= 0, `${row.name}: the line is on the screen`);
  }

  // -------------------------------------------------------------------- everybody who can do something says nothing
  for (const row of rows.filter(one => one.open > 0 || (!one.tooYoung && one.focused))) {
    check(row.line === null, `${row.name}: a person with work open says nothing about having nothing to do`);
  }
  const main = rows.find(row => row.focused);
  check(main && main.open > 0, `the main person's bar is theirs and has ${main?.open} things open`);

  // -------------------------------------------------------------- somebody taken: a row with no icons at all to speak with
  // A row whose person is dead or captured is not merely refused, it is empty - `panelActions` gives it no icons at all -
  // so the line has to be read from the work the server listed for them, and a row that reads only its icons goes silent.
  const takenId = await page.evaluate(() => window.__snapshot.world.entities.find(one => one.health?.condition === 'captured')?.id || null);
  check(Boolean(takenId), 'the class really has somebody taken prisoner on the panel');
  const gone = rows.find(row => row.id === takenId);
  measured.captured = { name: gone.name, icons: gone.icons, line: gone.line, sent: gone.sent };
  check(gone.icons === 0, `${gone.name}: a prisoner's row has no icons at all, which is the emptiest bar there is`);
  check(gone.lineShown && gone.line !== null, `${gone.name}: their row still says why - "${gone.line}"`);
  check(gone.sent.includes(gone.line), `${gone.name}: and it is the server's own sentence for them`);

  // ------------------------------------------------------------- a bar the guided start has shut is not an empty bar
  // The step that asks for nothing at all (`arrive`, `allow: []`) shuts the whole bar. That is not a person with
  // nothing to do, and the row must not say it is; the icons stay, plainly shut, with the step's own words on them.
  await holdLesson(page, stubStep(1));
  const shut = await rowsOf();
  const shutMain = shut.find(row => row.focused);
  check(shutMain.icons > 4 && shutMain.open === 0, `the step shuts the whole bar: ${shutMain.icons} icons, ${shutMain.open} open`);
  check(shutMain.barLine === null, 'a bar the guided start has shut still shows its icons, not one line');
  check(shutMain.line === null, "the main person's row says nothing while a step is shutting their bar");
  check(shut.filter(row => row.tooYoung).every(row => row.lineShown && row.line === row.sent[0]),
    'and in the same tick a child the server really refused still shows their own line');
  measured.lessonShut = { icons: shutMain.icons, open: shutMain.open, barLine: shutMain.barLine, line: shutMain.line };
  await holdLesson(page, 'none');

  // ----------------------------------------------------- the main person with an empty bar: the line is in the bar
  // Sent to Gonzales, they can do nothing at all until they arrive, and every icon on the bar is refused for that one
  // reason. The bar at the bottom of the screen is where a student is looking, so that is where the line goes.
  //
  // **Since 2026-09-22 the line for somebody on a journey is the page's own word, "Travelling"** (docs/FAMILY_PANEL.md
  // §14.7; the owner: "their icon should say 'Travelling' next to it"). §14.2 is untouched by it - it is about *why*
  // somebody may not be given an order, and those lines are all still the server's, which is what every other check in
  // this file holds. This one says what they are doing, and the word outranks the server's "... is on the road." It goes
  // in the same place, by the same rule, and everything measured about the place still applies.
  const mainId = await page.evaluate(() => window.__snapshot.world.household.mainId || window.__snapshot.world.household.principalId);
  await page.evaluate(id => fetch('/api/command', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: `cmd-${Date.now()}`, action: 'travel', entityId: id, destination: 'gonzales' }) }), mainId);
  await page.waitForFunction(id => window.__snapshot?.world.entities.find(one => one.id === id)?.travel, mainId, { timeout: 30000 });
  await page.waitForFunction(() => document.querySelector('.panel-row[data-focused=true] .panel-reason'), null, { timeout: 30000 });
  rows = await rowsOf();
  const away = rows.find(row => row.id === mainId);
  measured.away = { name: away.name, barLine: away.barLine, barBox: away.barBox, line: away.line, icons: away.icons };
  check(away.focused, 'the person sent away is still the main person, so this is their bar');
  check(away.icons === 0 && away.barLine !== null, 'their bar is one line where a row of greyed icons used to be');
  check(away.barLine === 'Travelling', `the bar's line is the word for somebody on a journey - "${away.barLine}"`);
  check(away.line === null, 'and it is not said twice: their own row stays quiet while the bar carries it');
  check(away.barBox.bottom <= SCREEN.height && away.barBox.right <= SCREEN.width && away.barBox.left >= 0, 'the bar’s line is on the screen');
  check(Math.abs((away.barBox.left + away.barBox.right) / 2 - SCREEN.width / 2) <= 2, 'the bar’s line is bottom middle, where the bar is');
  check(rows.filter(row => row.tooYoung).every(row => row.lineShown), 'the children’s lines are untouched by any of it');

  await page.screenshot({ path: 'test-results/panel-silence.png' });
  check(errors.length === 0, `the page threw nothing: ${errors.join(' | ') || 'none'}`);

  mkdirSync('docs/evidence', { recursive: true });
  writeFileSync('docs/evidence/panel-silence-screen.json', `${JSON.stringify({ record: 'panel-silence-screen', date: new Date().toISOString().slice(0, 10), seed: SEED, screen: SCREEN, measured }, null, 2)}\n`);
} finally {
  await browser.close();
  await app.close();
}

if (failures.length) { console.error(`\n${failures.length} check(s) failed.`); process.exit(1); }
console.log('\nAll checks passed; wrote docs/evidence/panel-silence-screen.json and test-results/panel-silence.png');
