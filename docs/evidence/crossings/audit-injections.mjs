// The three tests the crossings audit of 2026-09-19 added, each proven by injecting the regression it guards and watching
// it fail, alone (docs/MAP_ACCURACY.md §10.6).
//
//   node docs/evidence/crossings/audit-injections.mjs
//
// Same shape as injections.mjs beside it: one exact replacement in one file, the colonies map rebuilt when the build script
// is what changed, tests/crossings.test.mjs run, the failures noted, the file put back, the map rebuilt and checked byte for
// byte. Writes docs/evidence/crossings/audit-injections.json.
//
// Each rebuild is a few minutes, so this takes about a quarter of an hour.
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const MAP = 'public/terrain/colonies-map.json.gz';
const hash = () => createHash('sha256').update(readFileSync(MAP)).digest('hex');
const build = () => execFileSync(process.execPath, ['scripts/build-colonies-map.mjs'], { stdio: 'pipe' });
/** The tests of tests/crossings.test.mjs, by a piece of each name that no other name has. */
const TESTS = {
  beesons: "Beeson's stands on the east bank",
  place: 'each crossing the record gives is at its place',
  every: 'every place a road meets a river or creek',
  squarest: 'a crossing stands where its road goes over the water',
  heads: 'no crossing stands on the head or the mouth',
  dry: 'a crossing has its water drawn under it',
  ferry: 'a ferry costs an hour',
  others: 'a rider with word and the flight',
  army: 'the army keeps its dated camps',
  old: 'a class saved before the crossings',
};
const INJECTIONS = [
  // The fault the audit found: on a road laid along a creek bottom the middle meeting of a run is a graze, and the ford was
  // drawn square across a water the road was running in (the ford on Brushy Creek, on a meeting of three degrees).
  { guards: 'squarest', what: 'the crossing put back at the middle meeting of its run instead of the squarest',
    file: 'scripts/build-colonies-map.mjs',
    from: 'out.push({ ...run.reduce((best, hit) => (squareness(hit) > squareness(best) + 1e-9 ? hit : best)), meetings: run.length });',
    to: 'out.push({ ...run[Math.floor((run.length - 1) / 2)], meetings: run.length });' },
  // The other fault: a meeting inside the last few yards of a drawn line is the road passing the water's head, and a ford
  // drawn there stands on the tip of a creek that goes nowhere (Bear Branch, East Branch Mad Island Slough).
  { guards: 'heads', what: 'the head of a watercourse allowed to carry a crossing again (TIP_MILES 0)',
    file: 'scripts/build-colonies-map.mjs', from: 'const TIP_MILES = 0.05;', to: 'const TIP_MILES = 0;' },
  // A ford is drawn wherever it is, but its creek is only kept round the settlements a class has families at - and round
  // each ford, which is what stops it being drawn on bare grass.
  { guards: 'dry', what: "a ford's own two miles of creek no longer kept on a class's map (CREEK_AT_CROSSING 0)",
    file: 'sim/colonies-region.mjs', from: 'export const CREEK_AT_CROSSING = 2;', to: 'export const CREEK_AT_CROSSING = 0;' },
];
const before = hash(), results = [];
for (const injection of INJECTIONS) {
  const original = readFileSync(injection.file, 'utf8');
  if (!original.includes(injection.from)) throw new Error(`${injection.guards}: the text to change is not in ${injection.file}`);
  writeFileSync(injection.file, original.replace(injection.from, injection.to));
  try {
    if (injection.file.startsWith('scripts/')) build();
    const run = spawnSync(process.execPath, ['--test', 'tests/crossings.test.mjs'], { encoding: 'utf8' });
    const failed = Object.entries(TESTS).filter(([, name]) => run.stdout.split('\n').some(line => line.startsWith('✖') && line.includes(name))).map(([key]) => key);
    results.push({ guards: injection.guards, injected: injection.what, file: injection.file, failed, alone: failed.length === 1 && failed[0] === injection.guards });
    console.log(`${injection.guards}: ${injection.what} -> failed ${failed.join(', ') || 'nothing'}`);
  } finally {
    writeFileSync(injection.file, original);
    if (injection.file.startsWith('scripts/')) build();
  }
}
const after = hash();
if (after !== before) throw new Error(`the map is not what it was after the injections: ${after}`);
const clean = spawnSync(process.execPath, ['--test', 'tests/crossings.test.mjs'], { encoding: 'utf8' });
const passing = /ℹ fail 0/.test(clean.stdout);
writeFileSync('docs/evidence/crossings/audit-injections.json', JSON.stringify({
  record: 'The crossings audit of 2026-09-19: each new test proven by injecting the regression it guards (docs/MAP_ACCURACY.md §10.6)',
  date: new Date().toISOString(), map: before, mapRestored: after === before, results,
  allAlone: results.every(r => r.alone), restoredAndPassing: passing,
}, null, 2));
console.log(results.every(r => r.alone) && passing ? 'PASS: every injection failed its own test and only it; restored and passing' : 'FAIL');
process.exitCode = results.every(r => r.alone) && passing ? 0 : 1;
