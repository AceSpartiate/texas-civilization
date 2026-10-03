// The regressions the herder and the herd that pays guard (owner, 2026-10-03; tests/herds.test.mjs, sim/stock.mjs, public/herd-view.js),
// injected one at a time (CLAUDE.md: "A new test is not evidence until it has failed"). Each replaces exact pieces of files with the
// mistake a test is written against, runs tests/herds.test.mjs, records which tests failed, checks the test written for it is among
// them, and puts every file back byte for byte.
//
// Run: node scripts/herds-injections.mjs [--only=<name prefix>]  → writes docs/evidence/herds-injections.json
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const FILES = ['tests/herds.test.mjs'];
const T = {
  hand: 'a hand with stock', who: 'who may:', young: 'minded through the month', strays: 'strays are out on the range',
  flesh: 'a minded herd is fat', sell: 'selling stock at the pens', end: 'the herd counts at the end',
  drawn: 'the page draws the real herd', moves: 'the page draws the herd near the house',
};
const one = (file, from, to) => ({ file, from, to });
const S = 'sim/stock.mjs', V = 'public/herd-view.js', E = 'sim/errands.mjs', C = 'sim/chores.mjs';
const INJECTIONS = [
  // The hand.
  { name: 'the hand never grows with the days', edits: [one(S, ' + Math.floor((entity?.herding?.days || 0) / LEARN_DAYS))', ' + 0)')], expect: T.hand },
  { name: 'every ride a day learned', edits: [one(S, '  if (entity.herding?.last !== day) entity.herding =', '  if (true) entity.herding =')], expect: T.hand },
  { name: 'a hand past three', edits: [one(S, 'export const herdingOf = entity => Math.min(3,', 'export const herdingOf = entity => Math.min(9,')], expect: T.hand },
  { name: 'the hand not sent to the page', edits: [one('sim/world.mjs', '{ hand: herdingOf(e), ...(e.herding && { rangeDays: e.herding.days }) }', '{}')], expect: T.hand },
  { name: 'days at the stock that cannot be are opened', edits: [one('sim/world.mjs', ' || shelterInvalid(world) || herdInvalid(world);', ' || shelterInvalid(world);')], expect: T.hand },
  // Who may.
  { name: 'a child of five minds the stock', edits: [one(S, 'export const HOGS_FROM_AGE = 7, CATTLE_FROM_AGE = 12;', 'export const HOGS_FROM_AGE = 5, CATTLE_FROM_AGE = 12;')], expect: T.who },
  { name: 'a child of seven works the cattle', edits: [one(S, "  if (work === 'all') household.herdLookedDay = day; else household.hogsLookedDay = day;", '  household.herdLookedDay = day;')], expect: T.who },
  { name: 'out after the stock twice a day', edits: [one(C, '    if (tendedToday(world, entity)) return', '    if (false) return')], expect: T.who },
  { name: 'never on the horse', edits: [one(C, "  takes: (world, household, entity) => (herdWork(entity) === 'all' && horseHome(world, household, entity) ? ['horse'] : []),", '  takes: () => [],')], expect: T.who },
  { name: 'two riders on one horse', edits: [one(C, "const horseHome = (world, household, entity) => !userOf(world, household, 'horse', entity)\n  && ", 'const horseHome = (world, household, entity) => ')], expect: T.who },
  // What minding does.
  { name: 'minding raises no more calves', edits: [one(S, "CALF_SHARE * (1 + RAISED_BONUS * careOf(world, household, 'cattle', day))", 'CALF_SHARE')], expect: T.young },
  { name: 'a herd nobody minds raises fewer than it always did', edits: [one(S, "CALF_SHARE * (1 + RAISED_BONUS * careOf(world, household, 'cattle', day))", "CALF_SHARE * (0.5 + RAISED_BONUS * careOf(world, household, 'cattle', day))")], expect: T.young },
  { name: 'minded hogs raise no more pigs', edits: [one(S, "PIG_SHARE * (1 + RAISED_BONUS * careOf(world, household, 'hogs', day))", 'PIG_SHARE')], expect: T.young },
  { name: 'the young not written for the page', edits: [one(S, '  if (grew.cattle || grew.hogs) household.herdYoung = { cattle: grew.cattle, hogs: grew.hogs, day };\n', '')], expect: T.young },
  { name: 'every hand minds as the best', edits: [one(S, 'export const CARE_WEIGHT = Object.freeze({ 1: 0.6, 2: 0.8, 3: 1 });', 'export const CARE_WEIGHT = Object.freeze({ 1: 1, 2: 1, 3: 1 });')], expect: T.young },
  { name: 'strays vanish instead of going out on the range', edits: [one(S, '  if (lost.cattle || lost.hogs) household.herdStrayed =', '  if (false) household.herdStrayed =')], expect: T.strays },
  { name: 'every hand finds every stray', edits: [one(S, 'export const FIND_SHARE = Object.freeze({ 1: 0.25, 2: 0.5, 3: 0.75 });', 'export const FIND_SHARE = Object.freeze({ 1: 1, 2: 1, 3: 1 });')], expect: T.strays },
  { name: 'strays never go for good', edits: [one(S, 'export const STRAYS_GONE = 0.5;', 'export const STRAYS_GONE = 0;')], expect: T.strays },
  { name: 'the strays brought in not said', edits: [one(S, "  const foundWords = found.cattle + found.hogs ? ` and brought in ${herdWords({ herd: found })} that had strayed` : '';", "  const foundWords = '';")], expect: T.strays },
  { name: 'a minded herd never fat', edits: [one(S, "  if (minded) return FAT_MONTHS[kind].includes(month) ? 'fat' : 'fair';", "  if (minded) return 'fair';")], expect: T.flesh },
  { name: 'a herd left alone never thin', edits: [one(S, "  return LEAN_MONTHS[kind].includes(month) ? 'thin' : 'fair';", "  return 'fair';")], expect: T.flesh },
  { name: 'pork not by the flesh', edits: [one(S, '  const pork = PORK_BY[condition];', '  const pork = PORK_FOOD;')], expect: T.flesh },
  { name: 'a beef gives no hide', edits: [one(S, '  household.resources.hides = (household.resources.hides ?? 0) + BEEF_HIDES;\n', '')], expect: T.flesh },
  { name: 'the price not by the flesh', edits: [one(S, '  const condition = conditionOf(world, household, kind), each = SALE_COIN[kind][condition];', "  const condition = conditionOf(world, household, kind), each = SALE_COIN[kind].fair;")], expect: T.flesh },
  // Wealth.
  { name: 'stock sold stays in the herd', edits: [one(S, '  herd[kind] -= sold;\n', '')], expect: T.sell },
  { name: 'stock driven in at a walker\'s pace', edits: [one(C, '      for (const [kind, n] of Object.entries(sells)) entity.drives =', '      for (const [kind, n] of []) entity.drives =')], expect: T.sell },
  { name: 'the drover still driving what he sold', edits: [one(E, '        if (left > 0) entity.drives[kind] = left; else delete entity.drives[kind];', '        if (left > 0) entity.drives[kind] = left;')], expect: T.sell },
  { name: 'more sold than the herd has', edits: [one(E, "      if ((herdLeft[kind] ?? 0) < n) return { why:", '      if (false) return { why:')], expect: T.sell },
  { name: 'the drive to the pens not said', edits: [one(E, "  const there = sold.length ?", "  const there = false ?")], expect: T.sell },
  { name: 'the herd not counted at the end', edits: [one('sim/farm-sale.mjs', 'export const HERD_WITH_FARM = true;', 'export const HERD_WITH_FARM = false;')], expect: T.end },
  // What the page draws.
  { name: 'a big herd\'s group miscounted', edits: [one(V, '      groups = [{ young: false, count: total[kind] - youngFigures - grownFigures }];', '      groups = [{ young: false, count: total[kind] - grownFigures }];')], expect: T.drawn },
  { name: 'no cap on figures drawn', edits: [one(V, 'export const drawnMost = scale => (scale >= NEAR_SCALE ? HERD_DRAWN_MOST : scale >= FAR_SCALE ? 8 : 2);', 'export const drawnMost = () => 1000;')], expect: T.drawn },
  { name: 'the young drawn as big as the rest', edits: [one(V, ' * (one.young ? YOUNG_SIZE : 1)', '')], expect: T.drawn },
  { name: 'the hover names nobody minding', edits: [one(V, "  if (keeper) parts.push(", '  if (false) parts.push(')], expect: T.drawn },
  { name: 'out on the range at night', edits: [one(V, '  const out = night ? NIGHT_OUT : OUT[kind];', '  const out = OUT[kind];')], expect: T.moves },
  { name: 'the herd pays the herder no mind', edits: [one(V, '  if (herder) return {', '  if (false) return {')], expect: T.moves },
  { name: 'a beast off the family\'s land', edits: [one(V, '      if (bounds) { x =', '      if (false) { x =')], expect: T.moves },
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
  writeFileSync('docs/evidence/herds-injections.json', `${JSON.stringify({ record: 'herds-injections', date: new Date().toISOString().slice(0, 10), caught: record.filter(one => one.caught).length, only: record.filter(one => one.only).length, of: record.length, injections: record }, null, 1)}\n`);
}
console.log(`\n${record.filter(one => one.caught).length} of ${record.length} caught by the test written for them (${record.filter(one => one.only).length} by that test alone).${only ? '' : ' Wrote docs/evidence/herds-injections.json'}`);
