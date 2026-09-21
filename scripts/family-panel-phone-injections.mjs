// The regressions the family panel's phone checks guard, injected one at a time
// (CLAUDE.md: "A new test is not evidence until it has failed").
//
// docs/FAMILY_PANEL.md §7 says the panel on a phone "takes no more than the left portrait column and one row, so the map
// stays visible". That was read at a single point - 60% across, 55% down - from 2026-09-16 until 2026-09-21, and it is
// now read on a grid of 288 points, because the guided start's strip pushed the whole column down by its own height and
// the point stopped being over the map. A grid is a bigger instrument than a point, and a bigger instrument is worth
// exactly nothing until each of its checks has been watched to fail. So each injection here breaks one of them in
// `public/style.css`, runs `npm run test:family-panel`, records the check that failed, and puts the stylesheet back byte
// for byte.
//
// Every injection is inside the phone block (`@media (max-width:760px)`), so the desktop half of the proof - eleven
// checks that run before the phone is opened - passes throughout and a run that dies early is a harness fault rather
// than a caught regression.
//
// Run: node scripts/family-panel-phone-injections.mjs  -> writes docs/evidence/family-panel-phone-injections.json
// Wants PLAYWRIGHT_MODULE and BROWSER_EXECUTABLE, as the proof does. About twenty minutes: five runs of a browser proof.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const FILE = 'public/style.css';
const PROOF = 'scripts/family-panel-browser-proof.mjs';

const INJECTIONS = [
  {
    name: 'a phone opens every row at once instead of one, so six name boxes run down the map',
    guards: 'openRows, strays',
    from: '  .panel-row:not([data-expanded=true]) .panel-body{display:none}\n',
    to: '',
  },
  {
    name: 'a folded row draws its face out over the map instead of in the column',
    guards: 'strays',
    from: '  .panel-portrait{width:44px;height:44px}\n',
    to: '  .panel-portrait{width:44px;height:44px}\n  .panel-row:not([data-expanded=true]) .panel-portrait{margin-left:210px}\n',
  },
  {
    name: 'the work bar keeps desktop-sized icons on a phone and wraps to several lines up the map - the fault §12 fixed on 2026-09-21',
    guards: 'mapShare',
    from: '  .panel-icon{flex:none;width:38px;min-width:38px}\n',
    to: '  .panel-icon{flex:none;width:64px;min-width:64px}\n  .panel-row[data-focused=true] .panel-icons{flex-wrap:wrap}\n',
  },
];

/** The proof's own failure sentence: node prints the assertion message on the line after the banner. */
const failure = output => {
  const assertion = output.match(/AssertionError \[ERR_ASSERTION\]: ([^\n\r]+)/);
  if (assertion) return assertion[1].trim();
  const error = output.match(/^(?:Error|TypeError|TimeoutError): ([^\n\r]+)/m);
  return error ? `${error[1].trim()} (not an assertion - the proof died rather than caught it)` : null;
};
const passes = output => [...output.matchAll(/^PASS (.+)$/gm)].map(match => match[1]);

const run = () => {
  const result = spawnSync(process.execPath, [PROOF], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const output = `${result.stdout}${result.stderr}`;
  return { failed: failure(output), checks: passes(output).length };
};

const clean = run();
if (clean.failed) throw new Error(`The proof fails before any injection: ${clean.failed}`);
console.log(`clean: ${clean.checks} checks pass`);

const record = [];
for (const injection of INJECTIONS) {
  const original = readFileSync(FILE, 'utf8');
  // Three harnesses in this repo were found silently matching nothing because the file on disk is CRLF and the text
  // written here is LF. Every `from` and `to` is put into the file's own endings before it is looked for.
  const CR = String.fromCharCode(13), LF = String.fromCharCode(10);
  const ends = text => (original.includes(CR + LF) ? text.split(LF).join(CR + LF) : text);
  const from = ends(injection.from), to = ends(injection.to);
  const count = original.split(from).length - 1;
  if (count !== 1) throw new Error(`${injection.name}: the text to replace is in ${FILE} ${count} times, not once`);
  writeFileSync(FILE, original.replace(from, to));
  let result;
  try { result = run(); } finally { writeFileSync(FILE, original); }
  record.push({ name: injection.name, guards: injection.guards, checksBeforeIt: result.checks, failed: result.failed });
  console.log(`${result.failed ? 'caught' : 'MISSED'}: ${injection.name}\n   -> ${result.failed || 'nothing failed'}`);
}

const after = run();
if (after.failed) throw new Error(`The proof fails after the stylesheet was put back: ${after.failed}`);
mkdirSync('docs/evidence', { recursive: true });
writeFileSync('docs/evidence/family-panel-phone-injections.json', `${JSON.stringify({
  record: 'family-panel-phone-injections',
  date: new Date().toISOString().slice(0, 10),
  file: FILE,
  proof: PROOF,
  note: 'docs/FAMILY_PANEL.md §7 on a phone, read on a grid of 288 points instead of at one. Each injection breaks one of the grid’s checks in the phone block of the stylesheet; `checksBeforeIt` is how many of the proof’s checks still passed, which for every one of these should be the eleven that run before the phone is opened. Same computer only.',
  clean: clean.checks,
  injections: record,
}, null, 2)}\n`);
console.log(`\n${record.filter(one => one.failed).length} of ${record.length} caught; wrote docs/evidence/family-panel-phone-injections.json`);
