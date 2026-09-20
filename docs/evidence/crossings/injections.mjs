// Each test of tests/crossings.test.mjs proven by injecting the regression it guards and watching it fail, alone.
//
//   node docs/evidence/crossings/injections.mjs
//
// Each injection changes one file by an exact replacement, rebuilds the colonies map when the build script was changed, runs
// tests/crossings.test.mjs, notes which tests failed, then puts the file back, rebuilds, and checks the map is byte for byte
// what it was. Writes docs/evidence/crossings/injections.json.
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const MAP = 'public/terrain/colonies-map.json.gz';
const hash = () => createHash('sha256').update(readFileSync(MAP)).digest('hex');
const build = () => execFileSync(process.execPath, ['scripts/build-colonies-map.mjs'], { stdio: 'pipe' });
const TESTS = {
  place: 'each crossing the record gives is at its place',
  every: 'every place a road meets a river or creek',
  // The three the crossings audit added on 2026-09-19 are proven in audit-injections.mjs beside this; named here so an
  // injection that also broke one of them could not pass unnoticed as "alone".
  squarest: 'a crossing stands where its road goes over the water',
  heads: 'no crossing stands on the head or the mouth',
  dry: 'a crossing has its water drawn under it',
  ferry: 'a ferry costs an hour',
  others: 'a rider with word and the flight',
  army: 'the army keeps its dated camps',
  old: 'a class saved before the crossings',
};
const INJECTIONS = [
  // 29.72333, not the 29.72533 this used until 2026-09-19: the crossings audit gave the build a rule that a meeting inside
  // the last twentieth of a mile of a drawn line is the road passing the water's head and no crossing (`TIP_MILES`), and at
  // 29.72533 the injected marker lies off the end of Vince Bayou altogether, so the build now refuses it instead of laying
  // a bad bridge. At 29.72333 it is still four tenths of a mile up the bayou, and a tenth clear of its end.
  { guards: 'place', what: "Vince's bridge laid four tenths of a mile up the bayou from its marker", file: 'scripts/build-colonies-map.mjs',
    from: "['vinces-bridge', \"Vince's bridge\", 'bridge', 'Vince Bayou', -95.22015, 29.71933,", to: "['vinces-bridge', \"Vince's bridge\", 'bridge', 'Vince Bayou', -95.22015, 29.72333," },
  { guards: 'every', what: 'the road from Roberts\' to Burnett\'s given no crossings of its creeks', file: 'scripts/build-colonies-map.mjs',
    from: "  for (const road of crossedRoads()) for (const crossing of crossingsOf(road)) {\r\n    if (!BARRIERS.includes(crossing.water)) found.push(",
    to: "  for (const road of crossedRoads()) for (const crossing of crossingsOf(road)) {\r\n    if (road.id === 'road-roberts-burnetts') continue;\r\n    if (!BARRIERS.includes(crossing.water)) found.push(" },
  { guards: 'ferry', what: "the ferry's wait reckoned at a walker's pace for every way of going", file: 'sim/travel.mjs',
    from: 'export const ferryMiles = modeId => FERRY_MINUTES / FARMING_TICK_MINUTES * (MODES[modeId] || MODES[DEFAULT_MODE]).speed;',
    to: 'export const ferryMiles = modeId => FERRY_MINUTES / FARMING_TICK_MINUTES * MODES.foot.speed;' },
  { guards: 'others', what: 'the flight made to wait at every ferry as well as its flooded crossings', file: 'sim/scrape.mjs',
    from: "filter(site => isStage(site) || ['san-felipe'", to: "filter(site => isStage(site) || site.kind === 'ferry' || ['san-felipe'" },
  { guards: 'army', what: "the army's march east a day of four hours' going", file: 'sim/travel.mjs',
    from: 'export const FORCED_MARCH_HOURS = 10;', to: 'export const FORCED_MARCH_HOURS = 4;' },
  { guards: 'old', what: "a class saved before read its three `crossing` places as ferries", file: 'sim/ways.mjs',
    from: "filter(site => site.kind === 'ferry')", to: "filter(site => site.kind === 'ferry' || site.kind === 'crossing')" },
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
if (hash() !== before) throw new Error('the map is not what it was after the injections');
const clean = spawnSync(process.execPath, ['--test', 'tests/crossings.test.mjs'], { encoding: 'utf8' });
const passing = /ℹ fail 0/.test(clean.stdout);
writeFileSync('docs/evidence/crossings/injections.json', JSON.stringify({ date: new Date().toISOString(), map: before, results, allAlone: results.every(r => r.alone), restoredAndPassing: passing }, null, 2));
console.log(results.every(r => r.alone) && passing ? 'PASS: every injection failed its own test and only it; restored and passing' : 'FAIL');
