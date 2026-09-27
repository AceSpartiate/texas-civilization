// The regressions the family of twenty's phone gate guards, injected one at a time (CLAUDE.md: "A new test is not evidence
// until it has failed").
//
// Owner, 2026-09-27: the six phone measurements of `npm run test:family-twenty` are a gate again (docs/GATES.md), and the
// phone's layout was fixed to hold them - the work bar one row that scrolls sideways, and the column given the room from where
// it starts down to the bar's own measured top (`--phone-column`). Each injection undoes one part of that fix in the file it
// lives in, runs the proof, records the check that failed and how many passed before it, and puts the file back byte for byte.
// Every check before the phone is a desktop check and passes throughout, so `checksBeforeIt` should be the seven of them.
//
// Run: node scripts/family-twenty-phone-injections.mjs  -> writes docs/evidence/family-twenty-phone-injections.json
// Wants PLAYWRIGHT_MODULE and BROWSER_EXECUTABLE, as the proof does. A run of the proof for each, and one clean before and after.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const PROOF = 'scripts/family-twenty-browser-proof.mjs';
const INJECTIONS = [
  {
    name: 'the phone keeps the desktop two-row work bar across the bottom',
    file: 'public/style.css',
    from: '  .panel-row[data-focused=true] .panel-icons{left:8px;right:8px;transform:none;width:auto;max-width:none;grid-template-columns:none;grid-auto-flow:column;grid-auto-columns:60px;justify-content:safe center;overflow-x:auto;overflow-y:hidden;overscroll-behavior-x:contain;scrollbar-width:thin}\n',
    to: '',
  },
  {
    name: 'the phone column keeps the height written down for one screen, not the room down to the bar',
    file: 'public/style.css',
    from: '  #family-panel{max-height:var(--phone-column,calc(100vh - 290px - var(--lesson-room,0px)))}\n',
    to: '  #family-panel{max-height:calc(100vh - 150px - var(--lesson-room,0px))}\n',
  },
  {
    name: 'the page never measures the phone column (fitColumn returns on a phone, as it did)',
    file: 'public/app.js',
    from: "  const phone = matchMedia('(max-width:760px)').matches;\n",
    to: "  const phone = matchMedia('(max-width:760px)').matches;\n  if (phone) { document.body.style.setProperty('--phone-column', '2000px'); return; }\n",
  },
];

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
  const original = readFileSync(injection.file, 'utf8');
  const CR = String.fromCharCode(13), LF = String.fromCharCode(10);
  const ends = text => (original.includes(CR + LF) ? text.split(LF).join(CR + LF) : text);
  const from = ends(injection.from), to = ends(injection.to);
  const count = original.split(from).length - 1;
  if (count !== 1) throw new Error(`${injection.name}: the text to replace is in ${injection.file} ${count} times, not once`);
  writeFileSync(injection.file, original.replace(from, to));
  let result;
  try { result = run(); } finally { writeFileSync(injection.file, original); }
  record.push({ name: injection.name, file: injection.file, checksBeforeIt: result.checks, failed: result.failed });
  console.log(`${result.failed ? 'caught' : 'MISSED'}: ${injection.name}\n   -> ${result.failed || 'nothing failed'} (${result.checks} checks passed first)`);
}
const after = run();
if (after.failed) throw new Error(`The proof fails after every file was put back: ${after.failed}`);
mkdirSync('docs/evidence', { recursive: true });
writeFileSync('docs/evidence/family-twenty-phone-injections.json', `${JSON.stringify({
  record: 'family-twenty-phone-injections',
  date: new Date().toISOString().slice(0, 10),
  proof: PROOF,
  note: 'The family of twenty on a 400 by 800 phone, a gate again since 2026-09-27 (owner; docs/GATES.md). Each injection undoes one part of the phone layout fix; `checksBeforeIt` is how many of the proof’s checks passed before the one that failed, which should be the seven desktop checks. Same computer only: headless Chrome, not a real phone.',
  clean: clean.checks,
  injections: record,
}, null, 2)}\n`);
console.log(`\n${record.filter(one => one.failed).length} of ${record.length} caught; wrote docs/evidence/family-twenty-phone-injections.json`);
