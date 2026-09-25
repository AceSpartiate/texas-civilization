// The three tests of tests/water-overdrawn.test.mjs, each proven by injecting the regression it guards and watching it, and
// only it, fail (CLAUDE.md: "A new test is not evidence until it has failed"). docs/MAP_ACCURACY.md §10.8.
//
//   node docs/evidence/water-overdrawn/injections.mjs
//
// One exact replacement in one file, the test files that draw water run, the failures noted, the file put back and checked
// byte for byte. Writes docs/evidence/water-overdrawn/injections.json.
import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const FILES = ['tests/water-overdrawn.test.mjs', 'tests/weather-art.test.mjs', 'tests/rivers.test.mjs', 'tests/map-base.test.mjs'];
/** The tests that should fail, by a piece of each name no other name has. */
const TESTS = {
  flood: 'the river in flood and the fog on it lie on the water',
  lanes: 'a ford is drawn there',
  looks: 'reads as water, never as a road',
};
const INJECTIONS = [
  // The owner's brown trails: the high water laid along the straight chords between the points, as it was.
  { guards: 'flood', what: 'the high water laid along the chords between the points again, not the curve',
    file: 'public/weather-art.js',
    from: "    // over the rivers (owner, 2026-09-24).\n    const line = () => curveThrough(ctx, points);",
    to: "    // over the rivers (owner, 2026-09-24).\n    const line = () => { ctx.beginPath(); points.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); };" },
  { guards: 'flood', what: 'the fog banked along the chords again',
    file: 'public/weather-art.js',
    from: "    // On the water's own curve, as the high water is (`drawHighWater`).\n    const line = () => curveThrough(ctx, points);",
    to: "    // On the water's own curve, as the high water is (`drawHighWater`).\n    const line = () => { ctx.beginPath(); points.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); };" },
  // The lane as it was drawn: no ford anywhere on it.
  { guards: 'lanes', what: 'no wade found on any lane (the lane drawn straight over the water, as it was)',
    file: 'public/map-base.js', from: '  if (!(line?.length > 1)) return [];\n  let minX', to: '  return [];\n  let minX' },
  { guards: 'lanes', what: 'a lane wades the creeks but not the rivers',
    file: 'public/map-base.js', from: '    if (!(points?.length > 1)) continue;\n    for (let j = 1;', to: "    if (!(points?.length > 1) || course.kind === 'river') continue;\n    for (let j = 1;" },
  // The flood in the tan it was drawn in before 2026-09-24's second pass: on its curve, a wide band of the roads' own dirt.
  { guards: 'looks', what: 'the flood back in its old tan (#8a7444 edge, #a78d53 body)',
    file: 'public/weather-art.js', from: "bank: '#3c4428', body: '#5a6a3c',", to: "bank: '#8a7444', body: '#a78d53'," },
];
const results = [];
for (const injection of INJECTIONS) {
  const original = readFileSync(injection.file, 'utf8');
  // The files are checked out with CRLF on Windows: the replacement is made on the file's own line endings.
  const eol = original.includes('\r\n') ? '\r\n' : '\n', from = injection.from.replaceAll('\n', eol), to = injection.to.replaceAll('\n', eol);
  if (!original.includes(from)) throw new Error(`${injection.what}: the text to change is not in ${injection.file}`);
  writeFileSync(injection.file, original.replace(from, to));
  try {
    const run = spawnSync(process.execPath, ['--test', ...FILES], { encoding: 'utf8' });
    const failedLines = run.stdout.split('\n').filter(line => /^\s*✖/.test(line) && !/failing tests/.test(line));
    const failed = [...new Set(failedLines.map(line => line.replace(/^\s*✖\s*/, '').replace(/\s*\([\d.]+ms\)\s*$/, '').trim()))];
    const ours = Object.entries(TESTS).filter(([, name]) => failed.some(line => line.includes(name))).map(([key]) => key);
    results.push({ guards: injection.guards, injected: injection.what, file: injection.file, failed, alone: failed.length === 1 && ours.length === 1 && ours[0] === injection.guards });
    console.log(`${injection.guards}: ${injection.what} -> ${failed.join(' | ') || 'nothing failed'}`);
  } finally {
    writeFileSync(injection.file, original);
  }
  if (readFileSync(injection.file, 'utf8') !== original) throw new Error(`${injection.file} was not put back`);
}
const clean = spawnSync(process.execPath, ['--test', ...FILES], { encoding: 'utf8' });
const passing = /ℹ fail 0/.test(clean.stdout);
const ok = results.every(result => result.alone) && passing;
writeFileSync('docs/evidence/water-overdrawn/injections.json', JSON.stringify({
  record: 'Brown over the rivers, 2026-09-24: each new test proven by injecting the regression it guards (docs/MAP_ACCURACY.md §10.8)',
  date: new Date().toISOString(), files: FILES, results, allAlone: results.every(result => result.alone), restoredAndPassing: passing,
}, null, 2));
console.log(ok ? `PASS: ${results.length} of ${results.length} injections failed their own test and only it; restored and passing` : 'FAIL');
process.exitCode = ok ? 0 : 1;
