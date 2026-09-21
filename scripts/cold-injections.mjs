// The regressions tests/cold.test.mjs guards, injected one at a time (CLAUDE.md: "A new test is not evidence until it
// has failed"). Each injection replaces one exact piece of sim/scrape.mjs or sim/routines.mjs with the mistake a test is
// written against, runs the test file, records which tests failed, and puts the file back byte for byte.
//
// Run: node scripts/cold-injections.mjs  → writes docs/evidence/cold-injections.json
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const FILES = ['tests/cold.test.mjs'];
const FILE = 'sim/scrape.mjs';
const INJECTIONS = [
  {
    name: 'the cold does nothing at all, as it did until today',
    from: 'export const COLD_WEIGHT = 2;',
    to: 'export const COLD_WEIGHT = 1;',
  },
  {
    name: 'a norther is a death sentence rather than a risk: the weight is taken ten times over',
    from: 'export const COLD_WEIGHT = 2;',
    to: 'export const COLD_WEIGHT = 10;',
  },
  {
    name: 'the cold is never counted in the day\'s sickness, though it is worked out',
    from: '  frailty(person) * ((person.age ?? 30) < 6 ? 2 : 1) * (hungry ? 2 : 1) * (cold ? COLD_WEIGHT : 1);',
    to: '  frailty(person) * ((person.age ?? 30) < 6 ? 2 : 1) * (hungry ? 2 : 1);',
  },
  {
    name: 'the family is never told a norther came down on the road',
    from: "      if (cold && !flight.coldDay) { flight.coldDay = day; tell(world, household, 'A norther came down on the road, and the family has no roof to get under.', { importance: 2, claimId: 'FIC-GONZ-135' }); }",
    to: '',
  },
  {
    name: 'the family is told of the cold on every norther day of the road, over and over',
    from: '      if (cold && !flight.coldDay) { flight.coldDay = day;',
    to: '      if (cold) { flight.coldDay = day;',
  },
  {
    name: 'the sky is read where the family set out from rather than where it has got to',
    from: '      const where = alive[0]?.location || world.map.sites[household.homeSiteId];',
    to: '      const where = world.map.sites[household.homeSiteId];',
    expect: 'may pass: a family in the first days of its flight is still in the country it left',
  },
  {
    name: 'every kind of day is counted as cold, so the road is a lottery for half the spring',
    from: "export const coldSky = (world, point, day) => Boolean(point) && weatherAt(world, point, day).kind === 'norther';",
    to: 'export const coldSky = () => true;',
  },
  {
    name: 'rain is counted as cold too, which is the word the claim leaves out on purpose',
    from: "export const coldSky = (world, point, day) => Boolean(point) && weatherAt(world, point, day).kind === 'norther';",
    to: "export const coldSky = (world, point, day) => Boolean(point) && ['norther', 'rain', 'storm'].includes(weatherAt(world, point, day).kind);",
  },
  // The cold at home.
  {
    name: 'a family under its own roof is made sick by the weather like anybody else',
    file: 'sim/routines.mjs',
    from: "  if (!home || shelterOf(world, household).kind !== 'camp') return;",
    to: '  if (!home) return;',
  },
  // Not injected: the at-home roll only looks at people standing at the family's own house, and nobody on the road
  // east is. Taking its flight guard away changes no outcome, so the guard is belt and braces and is marked as such in
  // sim/routines.mjs. An injection that cannot fail is not a proof of anything.
  {
    // Not injected, and worth saying why: taking the `coldDay` guard away changes no outcome at all. The share is
    // hashed on the day (`cold-sick:${day}`), so rolling it on every tick of that day answers the same every time, and
    // the first person to fall sick stops being 'well' anyway. It is a guard against work, not against a wrong world,
    // and an injection that cannot fail is not a proof of anything.
    name: 'the cold at home reads the day from the clock rather than counting ticks',
    file: 'sim/routines.mjs',
    from: '  const day = Math.floor((world.minute || 0) / 1440);',
    to: '  const day = (household.coldTicks = (household.coldTicks || 0) + 1);',
  },
  {
    name: 'a roofless family is made sick in any weather, not only under a norther',
    file: 'sim/routines.mjs',
    from: '  if (!coldSky(world, home, day)) return;',
    to: '',
  },
  {
    // Found by these tests on 2026-09-21: rolled once a day *and* scaled by the tick's own minutes, a family under
    // canvas in a norther was about seventy times safer than one on the road in the same weather, and forty days of it
    // cost a class of twenty nothing at all.
    name: 'the cold at home is scaled by the tick as well as rolled once a day, so canvas is safer than a roof',
    file: 'sim/routines.mjs',
    from: '    if (share(world, person.id, `cold-sick:${day}`) >= 1 - (1 - SICK_PER_DAY) ** weight) continue;',
    to: '    if (share(world, person.id, `cold-sick:${day}`) >= 1 - (1 - SICK_PER_DAY) ** (weight * 0.014)) continue;',
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
writeFileSync('docs/evidence/cold-injections.json', `${JSON.stringify({ record: 'cold-injections', date: new Date().toISOString().slice(0, 10), files: FILES, injections: record }, null, 2)}\n`);
console.log(`\n${record.filter(r => r.failed.length).length} of ${record.length} caught; wrote docs/evidence/cold-injections.json`);
