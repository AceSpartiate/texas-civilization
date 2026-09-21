// The regressions the checks in scripts/panels-browser-proof.mjs guard, injected one at a time (CLAUDE.md: "A new test
// is not evidence until it has failed"). Five: the three faults a real screen was measured to have on 2026-09-21 put
// back one by one, and two that make a panel *vacuous* rather than wrong - because the reason those four panels were
// left out of the overlap study in the first place is that an empty panel covers nothing and reads as clean.
//
// This one runs a browser rather than the unit suite, so it is slow - about five minutes an injection, three screen
// sizes and two classes each - and it records the sentence the proof failed with rather than a list of test names: a
// browser proof stops at the first assertion that does not hold, which is exactly what is wanted here.
//
// Run: node scripts/panels-overlap-injections.mjs  → writes docs/evidence/panels-overlap-injections.json
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const PROOF = 'scripts/panels-browser-proof.mjs';
const INJECTIONS = [
  {
    name: 'the call\'s menu goes back to guessing the strip\'s height, where it covered "Show placement controls" outright at 1024',
    file: 'public/style.css',
    from: 'body[data-lesson=true] #call-menu{top:calc(18px + var(--lesson-room,116px));max-height:min(62vh,520px);z-index:15}',
    to: 'body[data-lesson=true] #call-menu{top:126px;max-height:min(62vh,520px);z-index:15}',
    expect: '#call-menu is drawn over the guided start',
  },
  {
    name: 'the meeting grows up past the strip again, taking the middle out of the guided start\'s one control',
    file: 'public/style.css',
    from: 'max-height:min(70vh,620px,calc(100vh - 82px - var(--lesson-room,0px)));overflow-y:auto',
    to: 'max-height:min(70vh,620px);overflow-y:auto',
    expect: '#encounter is drawn over the guided start',
  },
  {
    name: 'the two placement panels go back to a fixed top on a phone, where the strip covered "Not now" outright',
    file: 'public/style.css',
    from: '  body[data-lesson=true] #site-choose,body[data-lesson=true] #survey-choose{top:calc(14px + var(--lesson-room,90px))}',
    to: '  body[data-lesson=true] #site-choose,body[data-lesson=true] #survey-choose{top:56px}',
    expect: 'its own controls #survey-cancel',
  },
  {
    name: 'the panel that asks where the house stands is never unhidden - the empty panel this whole file exists to stop reading as clean',
    file: 'public/app.js',
    from: '  panel.hidden = !choosing || world.role === \'host\';',
    to: '  panel.hidden = true;',
    expect: '#site-choose was never drawn',
  },
  {
    name: 'the panel is drawn but its one button never is, so it is a panel a student cannot use and a measurement of nothing',
    file: 'public/app.js',
    from: "  $('#site-build').hidden = !facts?.can;",
    to: "  $('#site-build').hidden = true;",
    expect: 'carries no control a student could press',
  },
];

const run = () => {
  const result = spawnSync(process.execPath, [PROOF], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, env: process.env });
  const output = `${result.stdout}${result.stderr}`;
  if (!result.status) return { failed: false, passes: [...output.matchAll(/^PASS (.+)$/gm)].length };
  // Not greedy: an assertion whose own sentence contains a colon was otherwise recorded by whatever followed its *last*
  // colon, and so read as caught by another check. Every sentence in this proof begins "1366x768: ...", so the lazy
  // form is not an optimisation here - it is the difference between recording the check and recording the screen size.
  const said = /AssertionError[^\n]*?: ([^\n]+)/.exec(output) || /Error: ([^\n]+)/.exec(output);
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
  // **CRLF.** This repository is checked out with Windows line endings, and a `from` written with newlines matches
  // nothing in it: three harnesses here have been found silently replacing nothing for exactly this reason, and a
  // harness that replaces nothing reports every injection as MISSED while proving the file was never touched.
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
writeFileSync('docs/evidence/panels-overlap-injections.json', `${JSON.stringify({ record: 'panels-overlap-injections', date: new Date().toISOString().slice(0, 10), proof: PROOF, cleanChecks: clean.passes, injections: record }, null, 2)}\n`);
console.log(`${record.filter(one => one.forItsOwnReason).length} of ${record.length} caught by the check written for them; wrote docs/evidence/panels-overlap-injections.json`);
