// The regressions tests/weather.test.mjs guards, injected one at a time (CLAUDE.md: "A new test is not evidence until it
// has failed"). Each injection replaces one exact piece of sim/weather.mjs with the mistake a test is written against, runs
// the test file, records which tests failed, and puts the file back byte for byte. It stops if a replacement does not match
// exactly once, so a stale injection is never passed off as a proof.
//
// This is the model's own proof. The drawing has one of its own (scripts/weather-injections.mjs), and the two do not
// overlap: that one breaks the page, this one breaks the weather the page is given.
//
// Run: node scripts/weather-model-injections.mjs  → writes docs/evidence/weather-model-injections.json
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const FILES = ['tests/weather.test.mjs'];
const FILE = 'sim/weather.mjs';
const INJECTIONS = [
  // 1. The record's own days.
  {
    name: 'a day written for the whole country is given to one region only',
    from: "    for (const region of regions === 'all' ? REGIONS : [regions]) found[region] = { kind, claimId };",
    to: '    found[regions === \'all\' ? REGIONS[0] : regions] = { kind, claimId };',
  },
  {
    name: 'the coin is tossed first and the record only consulted when it has nothing to say',
    from: "  if (written?.[region]) return { kind: written[region].kind, claimId: written[region].claimId };\n  if (norther[region]) return { kind: 'norther', arrived: norther[region].arrived, force: norther[region].force };",
    to: "  if (norther[region]) return { kind: 'norther', arrived: norther[region].arrived, force: norther[region].force };\n  if (written?.[region]) return { kind: written[region].kind, claimId: written[region].claimId };",
  },
  {
    name: 'a written day is drawn from the record but no longer says which page it came off',
    from: '    for (const region of regions === \'all\' ? REGIONS : [regions]) found[region] = { kind, claimId };',
    to: '    for (const region of regions === \'all\' ? REGIONS : [regions]) found[region] = { kind };',
  },
  {
    name: 'the written days are read a month out, so the record lands on the wrong days entirely',
    from: '  const { month, day: date } = monthDayOf(world, day);\n  const found = {};',
    to: '  const { month, day: date } = monthDayOf(world, day + 30);\n  const found = {};',
  },
  // 2. Cold is shared across the map and rain is not.
  {
    name: 'one coin a day for the whole country, which is what the model replaced',
    from: '  if (dayShare(world, `rain:${region}`, day) < RAIN_SHARE[region][month] * wet) {',
    to: '  if (dayShare(world, `rain`, day) < RAIN_SHARE[region][month] * wet) {',
  },
  {
    name: 'a norther is rolled country by country, so the cold stops at a line on the map',
    from: '    if (dayShare(world, \'norther\', began) >= NORTHER_SHARE[month]) continue;',
    to: '    if (dayShare(world, `norther:${day}`, began) >= NORTHER_SHARE[month]) continue;',
  },
  {
    name: 'the cold never reaches the east at all',
    from: "      const arrived = region === 'east' ? began + 1 : began;\n      if (day >= arrived && day < arrived + days) holding[region] = { began, arrived, force: region === 'east' ? 0.7 : 1 };",
    to: "      if (region === 'east') continue;\n      const arrived = began;\n      if (day >= arrived && day < arrived + days) holding[region] = { began, arrived, force: 1 };",
  },
  // 3. The shares by month and country.
  {
    name: 'one rain table for the whole map: the east is as dry as Bexar',
    from: '  if (dayShare(world, `rain:${region}`, day) < RAIN_SHARE[region][month] * wet) {',
    to: '  if (dayShare(world, `rain:${region}`, day) < RAIN_SHARE.west[month] * wet) {',
  },
  {
    name: 'the month is read off by one, so every month rains at the month before it',
    from: '  const { month } = monthDayOf(world, day);\n  const wet = inWetSpring(monthDayOf(world, day)) ? WET_SPRING.times : 1;',
    to: '  const { month } = monthDayOf(world, day - 31);\n  const wet = inWetSpring(monthDayOf(world, day)) ? WET_SPRING.times : 1;',
  },
  // 4. A river remembers.
  {
    name: 'a river falls straight back to nothing the day the rain stops',
    from: '      const water = was === undefined ? WATER_AT_OPENING[region]\n        : Math.max(0, Math.min(1, Math.round((was.water + (rise ? rise * (1 - was.water) : -WATER_FALL)) * 1000) / 1000));',
    to: '      const water = was === undefined ? WATER_AT_OPENING[region]\n        : Math.max(0, Math.min(1, Math.round((rise ? was.water + rise * (1 - was.water) : 0) * 1000) / 1000));',
  },
  {
    name: 'the water is today\'s sky again: up while it rains and down the moment it stops',
    from: '      const rise = WATER_RISE[wet ? \'rain\' : kind] ?? 0;',
    to: '      const rise = WATER_RISE[wet ? \'rain\' : kind] ?? 0;\n      if (!rise && was) was.water = 0;',
  },
  {
    name: 'the class opens on empty rivers, with the Guadalupe down on 29 September 1835',
    from: '      const water = was === undefined ? WATER_AT_OPENING[region]',
    to: '      const water = was === undefined ? 0',
  },
  // 5. The rise saturates.
  {
    name: 'the rise is added straight on, which shut a ford on 62 days of 210',
    from: '(was.water + (rise ? rise * (1 - was.water) : -WATER_FALL))',
    to: '(was.water + (rise ? rise : -WATER_FALL))',
  },
  {
    name: 'a river can be shut by one wet day, because the rise is taken to the shut line at once',
    from: '(was.water + (rise ? rise * (1 - was.water) : -WATER_FALL))',
    to: '(was.water + (rise ? Math.max(rise, WATER_SHUT - was.water) : -WATER_FALL))',
  },
  // 6. The wet spring.
  {
    name: 'the wet spring begins on 1 March and rains through Gray\'s ten fine warm days',
    from: 'export const WET_SPRING = Object.freeze({ from: { month: 2, day: 21 }',
    to: 'export const WET_SPRING = Object.freeze({ from: { month: 2, day: 1 }',
  },
  {
    name: 'the wet spring is not applied at all, and the spring of 1836 is an ordinary one',
    from: '  const wet = inWetSpring(monthDayOf(world, day)) ? WET_SPRING.times : 1;',
    to: '  const wet = 1;',
  },
  {
    name: 'the wet spring runs the whole of March and April, ends included, whatever the day',
    from: '  if (month === from.month && day < from.day) return false;',
    to: '',
  },
  // 7. Replay, and the streaks.
  {
    name: 'the day is hashed unmixed, and FNV-1a runs the weather in streaks',
    from: 'const dayShare = (world, question, day) => share(world, \'weather\', `${question}:${Math.imul(day + 1, 2654435761) >>> 0}`);',
    to: 'const dayShare = (world, question, day) => share(world, \'weather\', `${question}:${day}`);',
  },
  {
    name: 'the weather is drawn from a stream, so a class does not replay and a reload is a different day',
    from: 'const dayShare = (world, question, day) => share(world, \'weather\', `${question}:${Math.imul(day + 1, 2654435761) >>> 0}`);',
    to: 'const dayShare = () => Math.random();',
  },
  {
    name: 'the class\'s own seed is left out, so every class in the district gets the same weather',
    from: 'const dayShare = (world, question, day) => share(world, \'weather\', `${question}:${Math.imul(day + 1, 2654435761) >>> 0}`);',
    to: 'const dayShare = (world, question, day) => share({ seed: \'weather\' }, \'weather\', `${question}:${Math.imul(day + 1, 2654435761) >>> 0}`);',
  },
  // 8. Where a place stands.
  {
    name: 'the line between two countries is off by a mile, and a place on it reads the wrong one',
    from: 'export const regionAt = point => (point.x < REGION_BOUNDS.westOf ? \'west\' : point.x > REGION_BOUNDS.eastOf ? \'east\' : \'centre\');',
    to: 'export const regionAt = point => (point.x <= REGION_BOUNDS.westOf ? \'west\' : point.x >= REGION_BOUNDS.eastOf ? \'east\' : \'centre\');',
  },
  {
    name: 'the map is read the wrong way round, and Bexar gets Nacogdoches\' weather',
    from: 'export const regionAt = point => (point.x < REGION_BOUNDS.westOf ? \'west\' : point.x > REGION_BOUNDS.eastOf ? \'east\' : \'centre\');',
    to: 'export const regionAt = point => (point.x < REGION_BOUNDS.westOf ? \'east\' : point.x > REGION_BOUNDS.eastOf ? \'west\' : \'centre\');',
  },
  {
    name: 'a ford is called shut at a level the wade does not treat as shut',
    from: 'export const fordShut = (world, point, day = dayOf(world.minute)) => waterAt(world, point, day) >= WATER_SHUT;',
    to: 'export const fordShut = (world, point, day = dayOf(world.minute)) => waterAt(world, point, day) >= WATER_HIGH;',
  },
  {
    // Found by this test on 2026-09-20 and fixed in the model: the wet roll fired on the day a norther *began*, and the
    // east's own first day is the day after, so no norther ever brought rain to the east.
    name: 'a norther can only bring its rain where it began, so it reaches the east dry every time',
    from: "  if (norther[region]) return { kind: 'norther', arrived: norther[region].arrived, force: norther[region].force };",
    to: "  if (norther[region]) return { kind: 'norther', arrived: norther[region].began, force: norther[region].force };",
  },
  {
    name: 'a norther that brought its rain with it is not counted as rain falling',
    from: "  return here.kind === 'rain' || here.kind === 'storm' || (here.kind === 'norther' && here.wet);",
    to: "  return here.kind === 'rain' || here.kind === 'storm';",
  },
  // 9. The fog, and the norther out of season.
  {
    name: 'a fog rises on any morning, wet day behind it or not',
    from: "  if (['rain', 'storm'].includes(yesterday) && dayShare(world, `fog:${region}`, day) < FOG_SHARE) return { kind: 'fog' };",
    to: '  if (dayShare(world, `fog:${region}`, day) < FOG_SHARE) return { kind: \'fog\' };',
  },
  {
    name: 'northers come as often in July as in January',
    from: '    if (dayShare(world, \'norther\', began) >= NORTHER_SHARE[month]) continue;',
    to: '    if (dayShare(world, \'norther\', began) >= NORTHER_SHARE[0]) continue;',
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
  const count = original.split(injection.from).length - 1;
  if (count !== 1) throw new Error(`${injection.name}: the text to replace is in ${file} ${count} times`);
  writeFileSync(file, original.replace(injection.from, injection.to));
  let failed;
  try { failed = run(); } finally { writeFileSync(file, original); }
  record.push({ name: injection.name, file, failed });
  console.log(`${failed.length ? 'caught' : 'MISSED'}: ${injection.name} -> ${failed.join(' | ') || 'nothing failed'}`);
}
if (run().length) throw new Error('The tests fail after every file was put back');
mkdirSync('docs/evidence', { recursive: true });
writeFileSync('docs/evidence/weather-model-injections.json', `${JSON.stringify({ record: 'weather-model-injections', date: new Date().toISOString().slice(0, 10), files: FILES, injections: record }, null, 2)}\n`);
console.log(`\n${record.filter(r => r.failed.length).length} of ${record.length} caught; wrote docs/evidence/weather-model-injections.json`);
