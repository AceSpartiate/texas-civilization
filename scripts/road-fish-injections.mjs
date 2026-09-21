// The regressions the road's line guards (tests/road.test.mjs, the last two tests), injected one at a time
// (CLAUDE.md: "A new test is not evidence until it has failed"). Each injection replaces one exact piece of sim/road.mjs
// or sim/neighbours.mjs with the mistake a test is written against, runs the test file, records which tests failed, and
// puts the file back byte for byte.
//
// Run: node scripts/road-fish-injections.mjs  → writes docs/evidence/road-fish-injections.json
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const FILES = ['tests/road.test.mjs'];
const FILE = 'sim/road.mjs';
const INJECTIONS = [
  {
    name: 'a line goes in anywhere on the road, miles from any water',
    from: "    if (!(flight.crossing || flight.status === 'refuged')) return 'There is no water to put a line in here; there is at a crossing and at the refuges.';",
    to: '',
  },
  {
    name: 'a line goes into a river that is over its banks and thick with drift',
    from: "    if (waterAt(world, where) >= WATER_SHUT) return 'The river is over its banks and thick with drift; nothing will take a line today.';",
    to: '',
  },
  {
    name: 'the flood is read at the level a ford is merely high, so the line is refused most of the spring',
    from: '    if (waterAt(world, where) >= WATER_SHUT) return',
    to: '    if (waterAt(world, where) >= 0.3) return',
  },
  {
    name: 'the river is read where the family is standing rather than at the crossing it waits at',
    from: '    const where = world.map.sites[flight.crossing?.siteId] || entity.location;',
    to: '    const where = entity.location;',
    expect: 'may pass: the two are usually in one country',
  },
  {
    name: 'the line burns a charge of powder, which is the thing the family has none of',
    from: "    name: 'Put a line in the river', skill: 'hands', where: 'road', road: true, halts: true, water: true, refuse: roadChoreRefusal,",
    to: "    name: 'Put a line in the river', skill: 'hands', where: 'road', road: true, halts: true, water: true, refuse: roadChoreRefusal,\n    needs: { powder: 1 },",
  },
  {
    name: 'the line costs a real, which is the other thing the family has none of',
    from: "    name: 'Put a line in the river', skill: 'hands', where: 'road', road: true, halts: true, water: true, refuse: roadChoreRefusal,",
    to: "    name: 'Put a line in the river', skill: 'hands', where: 'road', road: true, halts: true, water: true, refuse: roadChoreRefusal,\n    needs: { money: 1 },",
  },
  {
    name: 'nothing comes out of the river',
    from: '      { produce: { food: ROAD_FISH_FOOD } },',
    to: '',
  },
  {
    name: 'the road feeds a family as well as its own creek does',
    from: 'export const ROAD_FISH_FOOD = 2;',
    to: 'export const ROAD_FISH_FOOD = 3;',
  },
  {
    name: 'the family is never told what came out of the river',
    from: "    done: (world, household, entity) => tell(world, household, `${entity.name} took ${ROAD_FISH_FOOD} food out of the river at the camp.`, { claimId: 'FIC-GONZ-178', actorId: entity.id }),",
    to: '',
  },
  {
    name: "the director never sends anybody to the water, so a family with nothing starves as it did",
    file: 'sim/neighbours.mjs',
    from: "      if (short && !busy('hunt-road') && !busy('fish-road')) send('fish-road');",
    to: '',
  },
  {
    name: 'the director fishes only when it has powder, which is exactly when it does not need to',
    file: 'sim/neighbours.mjs',
    from: "      if (short && !busy('hunt-road') && !busy('fish-road')) send('fish-road');",
    to: "      if (short && (resources.powder || 0) >= 1 && !busy('fish-road')) send('fish-road');",
  },
];

const failing = output => [...output.matchAll(/^✖ (.+?) \(\d/gm)].map(match => match[1]).filter((name, i, all) => name !== 'failing tests:' && all.indexOf(name) === i);
const run = () => { const result = spawnSync(process.execPath, ['--test', ...FILES], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }); return failing(`${result.stdout}${result.stderr}`); };

const clean = run();
if (clean.length) throw new Error(`The tests fail before any injection: ${clean.join('; ')}`);
const record = [];
for (const injection of INJECTIONS) {
  const file = injection.file || FILE;
  const original = readFileSync(file, 'utf8');
  const CR = String.fromCharCode(13), LF = String.fromCharCode(10);
  const ends = text => (original.includes(CR + LF) ? text.split(LF).join(CR + LF) : text);
  const from = ends(injection.from), to = ends(injection.to);
  const count = original.split(from).length - 1;
  if (count !== 1) throw new Error(`${injection.name}: the text to replace is in ${file} ${count} times`);
  writeFileSync(file, original.replace(from, to));
  let failed;
  try { failed = run(); } finally { writeFileSync(file, original); }
  record.push({ name: injection.name, file, failed, ...(injection.expect && { expect: injection.expect }) });
  console.log(`${failed.length ? 'caught' : 'MISSED'}: ${injection.name} -> ${failed.join(' | ') || 'nothing failed'}`);
}
if (run().length) throw new Error('The tests fail after every file was put back');
mkdirSync('docs/evidence', { recursive: true });
writeFileSync('docs/evidence/road-fish-injections.json', `${JSON.stringify({ record: 'road-fish-injections', date: new Date().toISOString().slice(0, 10), files: FILES, injections: record }, null, 2)}\n`);
console.log(`\n${record.filter(r => r.failed.length).length} of ${record.length} caught; wrote docs/evidence/road-fish-injections.json`);
