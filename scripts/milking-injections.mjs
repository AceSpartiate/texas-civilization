// The regressions milking the cow guards (owner, 2026-10-02; tests/milking.test.mjs, sim/milking.mjs), injected one at a time
// (CLAUDE.md: "A new test is not evidence until it has failed"). Each replaces exact pieces of files with the mistake a test is
// written against, runs tests/milking.test.mjs, records which tests failed, checks the test written for it is among them, and puts
// every file back byte for byte.
//
// Run: node scripts/milking-injections.mjs [--only=<name prefix>]  → writes docs/evidence/milking-injections.json
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const FILES = ['tests/milking.test.mjs'];
const T = {
  home: 'at home: a family with cattle', food: 'at home: the milk is food', none: 'no cow, no milking', road: 'on the road:',
  auto: 'auto: a grown person on auto', child: 'auto: a child on auto', saves: 'saves:',
};
const one = (file, from, to) => ({ file, from, to });
const INJECTIONS = [
  { name: 'a child of five milks', edits: [one('sim/milking.mjs', 'export const MILK_FROM_AGE = 7;', 'export const MILK_FROM_AGE = 5;')], expect: T.home },
  { name: 'the cow milked twice a day', edits: [one('sim/milking.mjs', "    if (milkedToday(world, household, where)) return 'The cow has been milked today; she gives once a day.';\n", '')], expect: T.home },
  { name: 'the milking never marked', edits: [one('sim/milking.mjs', "    if (where === 'road') household.flight.cow.milkedDay = day; else household.milkDay = day;\n", '')], expect: T.home },
  { name: 'a cow at home gives the road\'s milk', edits: [one('sim/milking.mjs', 'export const MILK_AT_HOME = 0.35;', 'export const MILK_AT_HOME = 0.2;')], expect: T.food },
  { name: 'milking not among the food works', edits: [one('public/family-panel.js', "'child-eggs', 'milk-cow', 'milk-road']));", "'child-eggs']));")], expect: T.food },
  { name: 'milked with no cow', edits: [one('sim/milking.mjs', "    } else if (!cowAtHome(household)) return 'The family has no cow to milk.';", '    }')], expect: T.none },
  { name: 'no want of a cow said', edits: [one('sim/milking.mjs', "const lacks = where => (world, household) => (where === 'home' && !cowAtHome(household) ? { cow: [0, 1] } : null);", 'const lacks = where => () => null;')], expect: T.none },
  { name: 'shown with no way to a cow', edits: [one('sim/milking.mjs', '    return cowAtHome(household) || (!tooYoung(entity) && cowToBuy(world, household));', '    return true;')], expect: T.none },
  { name: 'the stock pens not the way to a cow', edits: [one('sim/wants.mjs', "  cow: [['stockman', 'cattle']],\n", '')], expect: T.none },
  { name: 'the cow on the road milks herself again', edits: [one('sim/flight-work.mjs', "  if (!cow.told) { cow.told = true; tell(world, household, driver, `The milk cow can be milked at the halt once a day", "  household.resources.food += MILK_A_DAY; tell(world, household, driver, `The milk cow gave a little milk tonight.`, 'FIC-GONZ-631', 1);\n  if (!cow.told) { cow.told = true; tell(world, household, driver, `The milk cow can be milked at the halt once a day")], expect: T.road },
  { name: 'milked on a day she strayed', edits: [one('sim/milking.mjs', "      if (household.flight.cow.strayDay === dayOf(world)) return 'The milk cow got away into the brush today, and was found too late to milk.';\n", '')], expect: T.road },
  { name: 'milked on the road with no cow along', edits: [one('sim/milking.mjs', "    if (where === 'road') return cowOnRoad(household);", "    if (where === 'road') return true;")], expect: T.road },
  { name: 'auto does not repeat the milking', edits: [one('sim/auto.mjs', "  'milk-cow', 'milk-road',\n", '')], expect: T.auto },
  { name: 'auto never milks on the road', edits: [one('sim/auto.mjs', "      if (['milk-cow', 'milk-road'].includes(person.order?.chore) && onTheRoad(household)) {", '      if (false) {')], expect: T.auto },
  { name: 'a child on auto never milks', edits: [one('sim/childhood.mjs', "const JOBS_FIRST = Object.freeze(['child-eggs', 'milk-cow', ", "const JOBS_FIRST = Object.freeze(['child-eggs', ")], expect: T.child },
  { name: 'a milking day that cannot be is opened', edits: [one('sim/world.mjs', ' || foragedInvalid(world) || milkingInvalid(world);', ' || foragedInvalid(world);')], expect: T.saves },
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
  writeFileSync('docs/evidence/milking-injections.json', `${JSON.stringify({ record: 'milking-injections', date: new Date().toISOString().slice(0, 10), caught: record.filter(one => one.caught).length, only: record.filter(one => one.only).length, of: record.length, injections: record }, null, 1)}\n`);
}
console.log(`\n${record.filter(one => one.caught).length} of ${record.length} caught by the test written for them (${record.filter(one => one.only).length} by that test alone).${only ? '' : ' Wrote docs/evidence/milking-injections.json'}`);
