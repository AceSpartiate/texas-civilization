// The regressions the overlap checks in scripts/lesson-browser-proof.mjs guard, injected one at a time (CLAUDE.md: "A
// new test is not evidence until it has failed"). These four are the three faults a real screen was measured to have on
// 2026-09-21 (docs/evidence/screen-overlap.json, -1024.json, -390.json) put back one by one, so that each of the checks
// written against them is seen to fail on its own and for its own reason.
//
// This one runs a browser rather than the unit suite, so it is slow - about a minute and a half an injection - and it
// records the sentence the proof failed with rather than a list of test names: a browser proof stops at the first
// assertion that does not hold, which is exactly what is wanted here.
//
// Run: node scripts/screen-overlap-injections.mjs  → writes docs/evidence/screen-overlap-injections.json
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const PROOF = 'scripts/lesson-browser-proof.mjs';
const INJECTIONS = [
  {
    name: 'the guided start goes back to the middle of the screen, where it covered the family at 1024 and blocked "Choose a house" on a phone',
    file: 'public/style.css',
    from: '#lesson{position:absolute;z-index:14;top:10px;right:12px;left:min(328px,calc(44% + 12px));width:auto;max-width:34rem;margin-left:auto;',
    to: '#lesson{position:absolute;z-index:14;top:10px;left:50%;transform:translateX(-50%);width:min(34rem,calc(100% - 24px));',
    expect: 'drawn over the family',
  },
  {
    name: 'the bar stays where it is while a lesson names the icons, so the names land on the map\'s own buttons',
    file: 'public/style.css',
    from: '@media (min-width:761px){body[data-lesson=true] .panel-row[data-focused=true] .panel-icons{bottom:104px}}',
    to: '',
    expect: 'of room where',
  },
  {
    name: 'a panel stands over the whole family with nothing behind it to show that it does',
    file: 'public/app.js',
    from: '  if (backdrop) backdrop.hidden = !covering;\n  document.body.dataset.panel = String(covering);',
    to: "  if (backdrop) backdrop.hidden = true;\n  document.body.dataset.panel = 'false';",
    expect: 'a panel stands over the family with nothing to show it is there',
  },
  {
    name: 'the panel dims the family but never says in words that the family is behind it',
    file: 'public/style.css',
    from: '.panel-behind{margin:8px 0 0;font-size:12.5px;color:#6c6046;font-style:italic}',
    to: '.panel-behind{display:none}',
    expect: 'the panel covers the family and never says so',
  },
];

const run = () => {
  const result = spawnSync(process.execPath, [PROOF], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, env: process.env });
  const output = `${result.stdout}${result.stderr}`;
  if (!result.status) return { failed: false, passes: [...output.matchAll(/^PASS (.+)$/gm)].length };
  const said = /AssertionError[^\n]*: ([^\n]+)/.exec(output) || /Error: ([^\n]+)/.exec(output);
  // A proof that fell over without saying why is not a caught injection, and hiding that behind a tidy sentence is how
  // a harness comes to prove nothing: the last of what it printed is kept instead.
  return { failed: true, why: said ? said[1].trim() : `the proof failed without a sentence: ${output.trim().split('\n').slice(-6).join(' / ')}`, passes: [...output.matchAll(/^PASS (.+)$/gm)].length };
};

const clean = run();
if (clean.failed) throw new Error(`The proof fails before any injection: ${clean.why}`);
console.log(`clean: ${clean.passes} checks pass\n`);
const record = [];
for (const injection of INJECTIONS) {
  const original = readFileSync(injection.file, 'utf8');
  const CR = String.fromCharCode(13), LF = String.fromCharCode(10);
  const ends = text => (original.includes(CR + LF) ? text.split(LF).join(CR + LF) : text);
  const from = ends(injection.from), to = ends(injection.to);
  const count = original.split(from).length - 1;
  if (count !== 1) throw new Error(`${injection.name}: the text to replace is in ${injection.file} ${count} times`);
  writeFileSync(injection.file, original.replace(from, to));
  let result;
  try { result = run(); } finally { writeFileSync(injection.file, original); }
  // Caught is not enough: an injection that trips some *other* check has not proved the check it was written for.
  const forItsOwnReason = result.failed && (result.why || '').toLowerCase().includes(injection.expect.toLowerCase());
  record.push({ name: injection.name, file: injection.file, expect: injection.expect, caught: result.failed, forItsOwnReason, why: result.why || null, checksPassedFirst: result.passes });
  console.log(`${!result.failed ? 'MISSED' : forItsOwnReason ? 'caught' : 'caught, but by another check'}: ${injection.name}\n   -> ${result.why || 'the proof passed anyway'}\n`);
}
if (run().failed) throw new Error('The proof fails after every file was put back');
mkdirSync('docs/evidence', { recursive: true });
writeFileSync('docs/evidence/screen-overlap-injections.json', `${JSON.stringify({ record: 'screen-overlap-injections', date: new Date().toISOString().slice(0, 10), proof: PROOF, cleanChecks: clean.passes, injections: record }, null, 2)}\n`);
console.log(`${record.filter(one => one.forItsOwnReason).length} of ${record.length} caught by the check written for them; wrote docs/evidence/screen-overlap-injections.json`);
