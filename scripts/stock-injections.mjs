// The regressions tests/stock.test.mjs guards, injected one at a time (CLAUDE.md: "A new test is not evidence until it
// has failed"). Each injection replaces one exact piece of sim/stock.mjs, sim/chores.mjs or sim/neighbours.mjs with the
// mistake a test is written against, runs the test file, records which tests failed, and puts the file back byte for
// byte.
//
// Run: node scripts/stock-injections.mjs  → writes docs/evidence/stock-injections.json
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const FILES = ['tests/stock.test.mjs'];
const FILE = 'sim/stock.mjs';
const INJECTIONS = [
  // 1. The herd a family already chose, and the save that does not move.
  {
    name: 'a class saved before today opens with no stock, whatever its family chose in the lobby',
    from: "  return household.stock === true ? { ...OPENING_HERD } : { cattle: 0, hogs: 0 };",
    to: '  return { cattle: 0, hogs: 0 };',
  },
  {
    name: 'every family has a herd, including the ones that drove none in',
    from: "  return household.stock === true ? { ...OPENING_HERD } : { cattle: 0, hogs: 0 };",
    to: '  return { ...OPENING_HERD };',
  },
  {
    name: 'the herd is one object shared by every family that reads it',
    from: '  return household.stock === true ? { ...OPENING_HERD } : { cattle: 0, hogs: 0 };',
    to: '  return household.stock === true ? OPENING_HERD : { cattle: 0, hogs: 0 };',
  },
  // 2. What the country feeds, and when.
  {
    name: 'calves are dropped in every month of the year',
    from: '  if (CALVING_MONTHS.includes(month)) grew.cattle = born(world, household, day, \'calves\', herd.cattle, CALF_SHARE);',
    to: "  grew.cattle = born(world, household, day, 'calves', herd.cattle, CALF_SHARE);",
  },
  {
    name: 'the hogs farrow all year, mast or no mast',
    from: "  if (MAST_MONTHS.includes(month)) grew.hogs = born(world, household, day, 'pigs', herd.hogs, PIG_SHARE);",
    to: "  grew.hogs = born(world, household, day, 'pigs', herd.hogs, PIG_SHARE);",
  },
  {
    name: 'the calving is put in the autumn and the mast in the spring',
    from: 'export const CALVING_MONTHS = Object.freeze([2, 3, 4]);',
    to: 'export const CALVING_MONTHS = Object.freeze([9, 10, 11]);',
  },
  {
    name: 'nothing is ever born at all',
    from: '  return Math.min(count, whole + over);',
    to: '  return 0;',
  },
  // 3. The straying, and the day that stops it.
  {
    name: 'a herd nobody rides after loses nothing: the open range keeps itself',
    from: '  if (looked > LOOKED_TO_DAYS) {',
    to: '  if (false && looked > LOOKED_TO_DAYS) {',
  },
  {
    name: 'the ride round the range buys nothing, and stock strays whatever anybody does',
    from: "  const looked = Number.isFinite(household.herdLookedDay) ? day - household.herdLookedDay : Infinity;",
    to: '  const looked = Infinity;',
  },
  {
    name: 'the day on the range is never written down, so it holds for nothing',
    from: '  household.herdLookedDay = dayOf(world);',
    to: '',
  },
  {
    name: 'hogs stray as readily as cattle, though they keep to the timber they feed in',
    from: 'export const STRAY_SHARE = Object.freeze({ cattle: 0.1, hogs: 0.05 });',
    to: 'export const STRAY_SHARE = Object.freeze({ cattle: 0.1, hogs: 0.1 });',
  },
  {
    name: 'the herd is counted every day rather than on the first of the month, so a month of straying happens thirty times',
    from: '  if (date !== 1) return;',
    to: '',
  },
  // 4. The beef that cannot be kept, and the pork that can.
  {
    name: 'the family keeps the whole beef, four hundred pounds of it, in September',
    from: '  const over = Math.max(0, BEEF_FOOD - BEEF_KEPT);',
    to: '  const over = 0;',
  },
  {
    name: 'the neighbours are sent the meat and never told where it came from',
    from: "    record(world, 'stock', {\n      householdId: other.id, importance: 2, claimId: 'FIC-GONZ-182',",
    to: "    if (false) record(world, 'stock', {\n      householdId: other.id, importance: 2, claimId: 'FIC-GONZ-182',",
  },
  {
    name: 'the beef is divided and the family it came from is not told at all',
    from: "  record(world, 'stock', {\n    actorId: entity.id, householdId: household.id, importance: 2, claimId: 'FIC-GONZ-182',\n    text: given.length",
    to: "  if (false) record(world, 'stock', {\n    actorId: entity.id, householdId: household.id, importance: 2, claimId: 'FIC-GONZ-182',\n    text: given.length",
  },
  {
    name: 'a beef is killed and no cow leaves the range',
    from: '  herd.cattle = Math.max(0, herd.cattle - 1);',
    to: '',
  },
  {
    name: 'a hog is killed and no hog leaves the timber',
    from: '  herd.hogs = Math.max(0, herd.hogs - 1);',
    to: '',
  },
  {
    name: 'the pork spoils like beef, so nothing a family kills ever keeps',
    from: 'export const PORK_FOOD = 12;',
    to: 'export const PORK_FOOD = 0;',
  },
  {
    name: 'the meat never reaches the larder: the work says it happened and produces nothing',
    file: 'sim/chores.mjs',
    from: '      step = { produce: { food: kept } };',
    to: '      continue;',
  },
  // 5. The road east.
  {
    name: 'the family drives its cattle to the Sabine ahead of the army',
    from: '  household.herd = { cattle: 0, hogs: 0 };',
    to: '',
  },
  {
    name: 'what was left on the range is never written down, so nothing can be found again',
    from: '  household.herdLeft = { ...herd };',
    to: '',
  },
  {
    name: 'a family that comes home finds every head it left',
    from: 'export const FOUND_AGAIN = Object.freeze({ cattle: 0.5, hogs: 0.25 });',
    to: 'export const FOUND_AGAIN = Object.freeze({ cattle: 1, hogs: 1 });',
  },
  {
    name: 'the hogs come back better than the cattle, though they have been loose on the mast',
    from: 'export const FOUND_AGAIN = Object.freeze({ cattle: 0.5, hogs: 0.25 });',
    to: 'export const FOUND_AGAIN = Object.freeze({ cattle: 0.25, hogs: 0.5 });',
  },
  {
    name: 'the stock left on the range can be found over and over',
    from: '  delete household.herdLeft;',
    to: '',
  },
  // 6. Who has stock at all.
  {
    name: 'the director deals stock to nobody, as it did until today',
    file: 'sim/neighbours.mjs',
    from: "  if (share(world, real.id, 'drove-stock-in') >= STOCK_SHARE) { real.herd = { cattle: 0, hogs: 0 }; return; }",
    to: '  { real.herd = { cattle: 0, hogs: 0 }; return; }',
  },
  {
    name: 'the director deals stock to every family, so nobody is ever short of grazing land',
    file: 'sim/neighbours.mjs',
    from: "  if (share(world, real.id, 'drove-stock-in') >= STOCK_SHARE) { real.herd = { cattle: 0, hogs: 0 }; return; }",
    to: '  // every family',
  },
  // Not injected: dealing the stock again every think changes nothing at all, because the answer is hashed from the
  // class and the family and comes back the same every time. The guard on it is belt-and-braces, and an injection that
  // cannot fail is not a proof of anything.
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
  record.push({ name: injection.name, file, failed });
  console.log(`${failed.length ? 'caught' : 'MISSED'}: ${injection.name} -> ${failed.join(' | ') || 'nothing failed'}`);
}
if (run().length) throw new Error('The tests fail after every file was put back');
mkdirSync('docs/evidence', { recursive: true });
writeFileSync('docs/evidence/stock-injections.json', `${JSON.stringify({ record: 'stock-injections', date: new Date().toISOString().slice(0, 10), files: FILES, injections: record }, null, 2)}\n`);
console.log(`\n${record.filter(r => r.failed.length).length} of ${record.length} caught; wrote docs/evidence/stock-injections.json`);
