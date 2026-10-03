// The regressions food only from real sources and seed kept at the harvest guard (owner, 2026-10-02; tests/food-sources.test.mjs,
// docs/HUNGER.md §10), injected one at a time (CLAUDE.md: "A new test is not evidence until it has failed"). Each replaces exact
// pieces of files with the mistake a test is written against, runs tests/food-sources.test.mjs, records which tests failed, checks
// the test written for it is among them, and puts every file back byte for byte.
//
// Run: node scripts/food-sources-injections.mjs [--only=<name prefix>]  → writes docs/evidence/food-sources-injections.json
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const FILES = ['tests/food-sources.test.mjs'];
const T = {
  fish: 'the bug: two grown people on auto at the creek', honey: 'the bug: a bee tree on auto', haul: 'one haul a day:',
  about: 'working about the place makes no food', seed: 'seed kept: a corn plot', never: 'seed kept: never more than came in',
  saves: 'saves:', feeds: 'the ways to food glow', days: 'a haul for every day out',
};
const one = (file, from, to) => ({ file, from, to });
const INJECTIONS = [
  // The bug itself, as it was on v2026.10.02.1: nothing stops a second haul the same day.
  { name: 'the bug back: no limit on hauls a day', edits: [one('sim/chores.mjs', "  if (chore.forage) { const why = forageRefusal(world, entity, chore.forage); if (why) return { can: false, why }; }\n", '')], expect: T.fish },
  { name: 'the haul never marked', edits: [one('sim/chores.mjs', '          noteForaged(world, entity, step.forage);\n', '')], expect: T.haul },
  { name: 'the haul a family\'s, not a person\'s', edits: [one('sim/gathering.mjs', "export const foragedToday = (world, entity, kind) => entity?.foraged?.[kind] === dayOf(world);", "export const foragedToday = (world, entity, kind) => Object.values(world.entities).some(one => one.householdId === entity?.householdId && one.foraged?.[kind] === dayOf(world));")], expect: T.haul },
  { name: 'the haul a week, not a day', edits: [one('sim/gathering.mjs', 'export const dayOf = world => Math.floor((world.minute || 0) / 1440);', 'export const dayOf = world => Math.floor((world.minute || 0) / (7 * 1440));')], expect: T.haul },
  { name: 'one haul for a trip of days', edits: [one('sim/chores.mjs', '      const days = step.forage ? forageDays(world, state) : 1;', '      const days = 1;')], expect: T.days },
  { name: 'no cap on the days a trip is paid for', edits: [one('sim/gathering.mjs', 'export const FORAGE_MOST_DAYS = 3;', 'export const FORAGE_MOST_DAYS = 30;')], expect: T.days },
  { name: 'the start of the trip never written', edits: [one('sim/chores.mjs', '  entity.chore.since = world.minute;\n', '')], expect: T.days },
  { name: 'working about the place makes food again', edits: [one('sim/routines.mjs', '    const fed = Math.max(0, household.resources.food - eaten * days);', "    const fed = Math.max(0, household.resources.food + (present.filter(e => e.task === 'work' && !e.chore).length * 0.3 - eaten) * days);")], expect: T.about },
  { name: 'the gauge counts work about the place again', edits: [one('sim/hunger.mjs', '  return { eat, make: 0 };', "  return { eat, make: people.filter(person => person.task === 'work' && !person.chore).length * 2 };")], expect: T.about },
  { name: 'no seed kept at the harvest', edits: [one('sim/chores.mjs', '      if (saved.seed > 0) household.resources.seed = round((household.resources.seed ?? 0) + saved.seed);\n', '')], expect: T.seed },
  { name: 'the seed kept costs the crop nothing', edits: [one('sim/chores.mjs', '        got[crop].kept = round(got[crop].kept - saved[crop]);\n', '')], expect: T.seed },
  { name: 'the seed kept told as crop the stock ate', edits: [one('sim/chores.mjs', "      const lost = grazed ? ' The rest had gone to stock in an unfenced field.' : '';", "      const lost = Object.values(got).some(one => one.kept < one.grown) ? ' The rest had gone to stock in an unfenced field.' : '';")], expect: T.seed },
  { name: 'cotton seed costs three bales', edits: [one('sim/crops.mjs', 'export const COTTON_SEED_BALES = 1;', 'export const COTTON_SEED_BALES = 3;')], expect: T.seed },
  { name: 'the seed not said', edits: [one('sim/chores.mjs', " seed kept back for the next planting: ${seedFrom", " seed put by: ${seedFrom")], expect: T.seed },
  { name: 'more seed kept than came in', edits: [one('sim/crops.mjs', '      const seed = Math.min(seedFor(\'corn\'), food);', '      const seed = seedFor(\'corn\');')], expect: T.never },
  { name: 'a haul day that cannot be is opened', edits: [one('sim/world.mjs', ' || hungerInvalid(world) || foragedInvalid(world);', ' || hungerInvalid(world);')], expect: T.saves },
  { name: 'the ways to food never glow', edits: [one('public/family-panel.js', 'export const feedsNow = (key, level) => FOOD_WORKS.has(key) && FEED_LEVELS.has(level);', 'export const feedsNow = (key, level) => false;')], expect: T.feeds },
  { name: 'everything glows as food', edits: [one('public/family-panel.js', 'export const feedsNow = (key, level) => FOOD_WORKS.has(key) && FEED_LEVELS.has(level);', 'export const feedsNow = (key, level) => FEED_LEVELS.has(level);')], expect: T.feeds },
];

const failing = output => [...new Set([...output.matchAll(/^\s*✖ (.+?) \(\d/gm)].map(match => match[1].trim()).filter(name => !/^tests[\\/]/.test(name) && name !== 'failing tests:'))];
const run = () => {
  const result = spawnSync(process.execPath, ['--test', '--test-reporter=spec', ...FILES], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const out = `${result.stdout}${result.stderr}`;
  return { failed: failing(out), passed: [...out.matchAll(/^\s*✔ /gm)].length };
};
for (const injection of INJECTIONS) {
  for (const edit of injection.edits) {
    const text = readFileSync(edit.file, 'utf8').replace(/\r\n/g, '\n');
    const at = text.indexOf(edit.from);
    if (at < 0) throw new Error(`Injection pattern not found in ${edit.file}: ${injection.name}`);
    if (text.indexOf(edit.from, at + 1) >= 0) throw new Error(`Injection pattern found twice in ${edit.file}: ${injection.name}`);
  }
}
const only = (process.argv.find(arg => arg.startsWith('--only=')) || '').slice(7);
const chosen = INJECTIONS.filter(injection => !only || injection.name.startsWith(only));
const clean = run();
if (clean.failed.length || !clean.passed) throw new Error(`The tests fail before anything is injected: ${clean.failed.join('; ') || 'nothing ran'}`);
const record = [];
for (const injection of chosen) {
  const originals = new Map(injection.edits.map(edit => [edit.file, readFileSync(edit.file, 'utf8')]));
  let result;
  try {
    for (const edit of injection.edits) {
      const original = readFileSync(edit.file, 'utf8'), crlf = original.includes('\r\n');
      const text = original.replace(/\r\n/g, '\n').replace(edit.from, edit.to);
      writeFileSync(edit.file, crlf ? text.replace(/\n/g, '\r\n') : text);
    }
    result = run();
  } finally { for (const [file, text] of originals) writeFileSync(file, text); }
  const caught = result.failed.some(name => name.includes(injection.expect));
  const alone = caught && result.failed.every(name => name.includes(injection.expect));
  record.push({ name: injection.name, files: injection.edits.map(edit => edit.file), expected: injection.expect, caught, only: alone, failed: result.failed });
  console.log(`${caught ? 'CAUGHT' : 'MISSED'}${caught && !alone ? ' (with others)' : ''} ${injection.name}${caught && alone ? '' : ` (failed: ${result.failed.join('; ') || 'nothing'})`}`);
}
if (run().failed.length) throw new Error('The tests fail after every file was put back');
if (!only) {
  mkdirSync('docs/evidence', { recursive: true });
  writeFileSync('docs/evidence/food-sources-injections.json', `${JSON.stringify({ record: 'food-sources-injections', date: new Date().toISOString().slice(0, 10), caught: record.filter(one => one.caught).length, only: record.filter(one => one.only).length, of: record.length, injections: record }, null, 1)}\n`);
}
console.log(`\n${record.filter(one => one.caught).length} of ${record.length} caught by the test written for them (${record.filter(one => one.only).length} by that test alone).${only ? '' : ' Wrote docs/evidence/food-sources-injections.json'}`);
