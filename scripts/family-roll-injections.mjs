// The regressions tests/family-roll.test.mjs guards for the owner's roll of 2026-09-22 ("if i roll a 20, there should be
// 18 kids ... each number over 4 is another kid"; "The roll is the family"), injected one at a time (CLAUDE.md: "A new test
// is not evidence until it has failed"). Each injection replaces one exact piece of the code with the mistake a test is
// written against, runs the test file, records which tests failed, and puts the file back byte for byte. It stops if a
// replacement does not match exactly once, so a stale injection is never passed off as a proof.
//
// CRLF: this working copy is CRLF and a `from` written with bare newlines matches nothing in it. `ends` converts each
// pattern to the line endings the file on disk actually has before it looks for it, and the exactly-once check below is
// what makes a miss loud.
//
// Run: node scripts/family-roll-injections.mjs  → writes docs/evidence/family-roll-injections.json
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const FILES = ['tests/family-roll.test.mjs'];
const FAMILY = 'sim/family.mjs', WORLD = 'sim/world.mjs';
const INJECTIONS = [
  // 1. The table.
  {
    name: 'a 4 is read as a lone parent and three children, not two parents and two',
    file: FAMILY, from: '  return roll <= 3 ? { parents: 1, children: roll - 1 } : { parents: 2, children: roll - 2 };',
    to: '  return roll <= 4 ? { parents: 1, children: roll - 1 } : { parents: 2, children: roll - 2 };',
  },
  {
    name: 'new rolls are still read on the 2026-09-14 faces, so a 20 is ten people',
    file: FAMILY, from: "export const FAMILY_TABLE = 'd20-size';", to: "export const FAMILY_TABLE = 'd20-faces';",
  },
  // 2. Old classes open as they were.
  {
    name: 'a new roll is not marked with its table, so it reads as a 2026-09-14 class',
    file: WORLD, from: '  household.rollTable = FAMILY_TABLE;\n', to: '',
  },
  {
    name: 'the mark is ignored and every roll is read by its die alone',
    file: FAMILY, from: "export const tableOf = household => household?.rollTable ?? (household?.die === 20 ? 'd20-faces' : 'd6');",
    to: "export const tableOf = household => (household?.die === 20 ? 'd20-faces' : 'd6');",
  },
  {
    name: 'a class rolled 2026-09-14 is re-read on the new table, so its ten become a family that should be twenty',
    file: FAMILY, from: "export const tableOf = household => household?.rollTable ?? (household?.die === 20 ? 'd20-faces' : 'd6');",
    to: "export const tableOf = household => household?.rollTable ?? (household?.die === 20 ? 'd20-size' : 'd6');",
  },
  {
    name: 'the validator reads every saved roll on the new table',
    file: WORLD, from: 'compositionFor(household.roll, tableOf(household))', to: 'compositionFor(household.roll)',
  },
  {
    name: 'a save may carry any table name it likes',
    file: WORLD, from: "    if (household.rollTable !== undefined && (household.rollTable !== FAMILY_TABLE || household.die !== FAMILY_DIE)) throw new Error('Invalid family table');\n", to: '',
  },
  // 3. Ages that could exist.
  {
    name: 'a mother too old for eighteen different ages is not made younger, so a 20 comes out with fewer children',
    file: FAMILY, from: '  if (motherOf() > oldest) {', to: '  if (false) {',
  },
  {
    name: 'the father is never checked: eighteen children to a father who was nine at the eldest’s birth',
    file: FAMILY, from: '    if (fatherHigh < high && fatherHigh - low + 1 < children) first += Math.min(high, low + children - 1) - fatherHigh;\n    high = Math.min(high, first - FATHER_AT_BIRTH);',
    to: '',
  },
  {
    name: 'the father caps the children’s ages but is never made older, so a large family loses children',
    file: FAMILY, from: '    if (fatherHigh < high && fatherHigh - low + 1 < children) first += Math.min(high, low + children - 1) - fatherHigh;\n', to: '',
  },
  // 4. Names, and the tick.
  {
    name: 'children are dealt from four cards a family, so the fifth son repeats the first son’s name',
    file: FAMILY, from: '    const name = deal(index * 4 + sons[role]++, role);', to: '    const name = deal(index * 4 + (sons[role]++ % 4), role);',
  },
  {
    name: 'every person’s kin rides on the tick, the whole family carried on each of them',
    file: WORLD, from: 'depth: e.depth, principal: e.principal, ', to: 'depth: e.depth, principal: e.principal, kin: e.kin, ',
  },
];

const failing = output => [...output.matchAll(/^✖ (.+?) \(\d/gm)].map(match => match[1]).filter((name, i, all) => name !== 'failing tests:' && all.indexOf(name) === i);
const run = () => { const result = spawnSync(process.execPath, ['--test', ...FILES], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }); return failing(`${result.stdout}${result.stderr}`); };

const clean = run();
if (clean.length) throw new Error(`The tests fail before any injection: ${clean.join('; ')}`);
const record = [];
for (const injection of INJECTIONS) {
  const file = injection.file;
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
writeFileSync('docs/evidence/family-roll-injections.json', `${JSON.stringify({
  record: 'family-roll-injections',
  date: new Date().toISOString().slice(0, 10),
  note: 'The roll is the family (owner, 2026-09-22). Every injection is a rule of the new table, of reading an old class on its own table, of the ages of a family of up to eighteen children, or of what a family of twenty is sent, taken back out.',
  files: FILES,
  injections: record,
}, null, 2)}\n`);
console.log(`\n${record.filter(r => r.failed.length).length} of ${record.length} caught; wrote docs/evidence/family-roll-injections.json`);
