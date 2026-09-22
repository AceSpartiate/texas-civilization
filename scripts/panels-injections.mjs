// The regressions `npm run test:panels` guards for the two screen moments the owner chose on 2026-09-22 - the bar steps
// aside while a rider talks, the column folds to faces while a place is chosen - injected one at a time (CLAUDE.md: "A
// new test is not evidence until it has failed"). Each injection replaces one exact piece of the page with the mistake,
// runs the whole browser gate, records the assertion that stopped it, and puts the file back byte for byte.
//
// The second injection is not invented. It is the rule as first written: `body[data-meeting=true] .panel-icons` loses on
// specificity to the rule that places the bar, so the flag was set, the bar stayed, and only a measurement showed it.
//
// Slow - the gate walks two classes at three sizes for each injection. Same computer, headless Chrome.
// Run: node scripts/panels-injections.mjs  → writes docs/evidence/panels-injections.json
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const INJECTIONS = [
  {
    name: 'the bar is drawn under the meeting, because nothing hides it',
    file: 'public/style.css',
    from: 'body[data-meeting=true] .panel-row[data-focused=true] .panel-icons{display:none}\n',
    to: '',
    expect: 'the ability bar is drawn under the meeting',
  },
  {
    name: 'the rule as first written: the flag is set and the bar stays, because a shorter selector loses to the one that places it',
    file: 'public/style.css',
    from: 'body[data-meeting=true] .panel-row[data-focused=true] .panel-icons{display:none}\n',
    to: 'body[data-meeting=true] .panel-icons{display:none}\n',
    expect: 'the ability bar is drawn under the meeting',
  },
  {
    name: 'the bar never comes back, because the flag is only ever raised',
    file: 'public/app.js',
    from: "  document.body.dataset.meeting = String(shown('#encounter'));",
    to: "  if (shown('#encounter')) document.body.dataset.meeting = 'true';",
    expect: 'the ability bar did not come back',
  },
  {
    name: 'the column is never folded for a place, so the student keeps the names and the panel keeps its distance by luck',
    file: 'public/app.js',
    from: '  if (placing !== placingWas) { placingWas = placing; setPanelFolded(placing || panelFolded()); }',
    to: '  if (placing !== placingWas) { placingWas = placing; setPanelFolded(panelFolded()); }',
    expect: 'the column did not fold',
  },
  {
    name: 'the column folds for a place and never opens again, which takes the names away for good',
    file: 'public/app.js',
    from: '  if (placing !== placingWas) { placingWas = placing; setPanelFolded(placing || panelFolded()); }',
    to: '  if (placing !== placingWas) { placingWas = placing; setPanelFolded(true); }',
    expect: 'the column did not fold',
  },
  {
    name: 'the column folds but the panel stays where it was, over the faces',
    file: 'public/style.css',
    from: 'body[data-placing=true] #site-choose,body[data-placing=true] #survey-choose{left:var(--place-left,12px);top:var(--place-top,64px);right:auto;',
    to: 'body[data-placing=true] #site-choose,body[data-placing=true] #survey-choose{right:auto;',
    expect: "is drawn over the family's",
  },
  {
    name: 'the panel is put beside the faces without asking where the guided start ends, which at 1024 is lower than the faces begin',
    file: 'public/app.js',
    from: "  const top = Math.max(Math.min(...faces.map(box => box.top)), strip && strip.height > 1 ? strip.bottom + 8 : 0);",
    to: "  const top = Math.min(...faces.map(box => box.top));",
    expect: 'is drawn over the guided start',
  },
];

const run = () => {
  const result = spawnSync(process.execPath, ['scripts/panels-browser-proof.mjs'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 20 * 60 * 1000 });
  const output = `${result.stdout}${result.stderr}`;
  const failure = /AssertionError[^:]*: (.+)/.exec(output)?.[1]?.trim() || (result.status === 0 ? null : `exit ${result.status}: ${output.slice(-300)}`);
  return { passed: result.status === 0, failure, checks: (output.match(/^PASS /gm) || []).length };
};

const clean = run();
if (!clean.passed) throw new Error(`The gate fails before any injection: ${clean.failure}`);
const record = [];
for (const injection of INJECTIONS) {
  const original = readFileSync(injection.file, 'utf8');
  // Written with plain newlines; this working copy may be CRLF. A pattern that cannot match is a harness that quietly
  // proves nothing, which five harnesses in this repository were found doing.
  const CR = String.fromCharCode(13), LF = String.fromCharCode(10);
  const ends = text => (original.includes(CR + LF) ? text.split(LF).join(CR + LF) : text);
  const from = ends(injection.from), to = ends(injection.to);
  const count = original.split(from).length - 1;
  if (count !== 1) throw new Error(`${injection.name}: the text to replace is in ${injection.file} ${count} times`);
  writeFileSync(injection.file, original.replace(from, to));
  let seen;
  try { seen = run(); } finally { writeFileSync(injection.file, original); }
  const caught = !seen.passed && Boolean(seen.failure?.includes(injection.expect));
  record.push({ name: injection.name, file: injection.file, expect: injection.expect, caught, failure: seen.failure, checksPassedFirst: seen.checks });
  console.log(`${caught ? 'caught' : seen.passed ? 'MISSED' : 'CAUGHT BY ANOTHER CHECK'}: ${injection.name} -> ${seen.failure || 'the gate passed'}`);
}
const after = run();
if (!after.passed) throw new Error(`The gate fails after every file was put back: ${after.failure}`);
mkdirSync('docs/evidence', { recursive: true });
writeFileSync('docs/evidence/panels-injections.json', `${JSON.stringify({
  record: 'panels-injections', date: new Date().toISOString().slice(0, 10), gate: 'scripts/panels-browser-proof.mjs',
  cleanChecks: clean.checks, injections: record,
  environment: 'Same computer: a local classroom server and headless Chrome at 1366x768, 1024x768 and 390x844.',
}, null, 2)}\n`);
console.log(`\n${record.filter(one => one.caught).length} of ${record.length} caught by the check written for them. Wrote docs/evidence/panels-injections.json`);
