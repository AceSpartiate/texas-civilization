// The regressions tests/family-roll.test.mjs guards for the owner's roll of 2026-09-22 ("if i roll a 20, there should be
// 18 kids ... each number over 4 is another kid"; "The roll is the family"), and those tests/rations.test.mjs and
// tests/periods.test.mjs guard for the owner's food by age and twins of the same day ("ages 0–2 use 25% of an adult
// portion, 3–9 use 50%, 10–15 use 75%, and 16+ use 100%. Preserve fractional totals. Allow seed-deterministic twins at
// approximately 1% of births"), injected one at a time (CLAUDE.md: "A new test is not evidence until it has failed"). Each
// injection replaces one exact piece of the code with the mistake a test is written against, runs the test files it names,
// records which tests failed, and puts the file back byte for byte. It stops if a replacement does not match exactly once,
// so a stale injection is never passed off as a proof.
//
// CRLF: this working copy is CRLF and a `from` written with bare newlines matches nothing in it. `ends` converts each
// pattern to the line endings the file on disk actually has before it looks for it, and the exactly-once check below is
// what makes a miss loud.
//
// Run: node scripts/family-roll-injections.mjs  → writes docs/evidence/family-roll-injections.json
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const ROLL = 'tests/family-roll.test.mjs', RATIONS = 'tests/rations.test.mjs', PERIODS = 'tests/periods.test.mjs';
/** What an injection runs unless it names its own: the two fast files. The winter's test plays a whole period, so only the winter's injection runs it. */
const FILES = [ROLL, RATIONS];
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
  // 3. Ages that could exist (rewritten 2026-09-22 for birth dates: the three injections of the one-a-year rule went with it).
  {
    name: 'the father is never checked: a child born to a father of nine',
    file: FAMILY, from: 'father: father === null ? Infinity : father - FATHER_AT_BIRTH - EDGE', to: 'father: Infinity',
  },
  {
    name: 'the mother is not held to 42 at the last birth: a mother of 45 has a newborn',
    file: FAMILY, from: 'low: Math.max(0, mother - MOTHER_AT_BIRTH[1] - 1 + EDGE)', to: 'low: 0',
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
  // 5. Food by age (2026-09-22).
  {
    name: 'a child of sixteen eats as a youth, three quarters of a share',
    file: FAMILY, from: 'Object.freeze([15, 3])', to: 'Object.freeze([16, 3])',
  },
  {
    name: 'the day’s food is rounded to whole grown shares, so a share and a half is two',
    file: FAMILY, from: 'export const eatenADay = (world, people) => mouthsOf(world, people) * ADULT_RATION;',
    to: 'export const eatenADay = (world, people) => Math.round(mouthsOf(world, people)) * ADULT_RATION;',
  },
  {
    name: 'age is read as it was when the die was rolled, so nobody moves up a band on a birthday',
    file: FAMILY, from: '  return born === null ? null : ageOnDay(born, dateOf(world, minute));', to: '  return born === null ? null : entity.age ?? null;',
  },
  {
    name: 'a birthday counts from the day after it',
    file: FAMILY, from: '(on.getUTCMonth() + 1 === month && on.getUTCDate() >= date)', to: '(on.getUTCMonth() + 1 === month && on.getUTCDate() > date)',
  },
  {
    name: 'the day at home is eaten by head again, a baby as a grown man',
    file: 'sim/routines.mjs', from: '    const eaten = eatenADay(world, present) *', to: '    const eaten = present.length * 0.35 *',
  },
  {
    name: 'the road east is eaten by head',
    file: 'sim/scrape.mjs', from: 'household.resources.food - eatenADay(world, alive) * days', to: 'household.resources.food - alive.length * 0.35 * days',
  },
  {
    name: 'the winter is eaten by head',
    file: 'sim/periods.mjs', from: 'const eaten = eatenADay(world, household.members.map(id => world.entities[id]).filter(person => person && !GONE.includes(person.health?.condition)));',
    to: 'const eaten = 0.35 * household.members.map(id => world.entities[id]).filter(person => person && !GONE.includes(person.health?.condition)).length;',
    files: [PERIODS],
  },
  {
    name: 'the neighbours’ director reckons its larder by head',
    file: 'sim/neighbours.mjs', from: 'export const mouthsAt = (world, household) => mouthsOf(world, household.members.map(id => world.entities[id]).filter(Boolean));',
    to: 'export const mouthsAt = (world, household) => household.members.length;',
  },
  // 6. Twins, and the spacing of births (2026-09-22).
  {
    name: 'twins are drawn from a random stream, not the seed',
    file: FAMILY, from: "share({ seed }, `${householdId}-child-${k + 1}`, 'twin') < chance", to: 'Math.random() < chance',
  },
  {
    name: 'twins three times as often as the owner’s one in a hundred',
    file: FAMILY, from: 'export const TWIN_SHARE = 0.01;', to: 'export const TWIN_SHARE = 0.03;',
  },
  {
    name: 'a twin is given the name of the twin born before',
    file: FAMILY, from: '    const name = deal(index * 4 + sons[role]++, role);',
    to: '    const name = born === people.at(-1)?.born && role === people.at(-1)?.role ? people.at(-1).name : deal(index * 4 + sons[role]++, role);',
  },
  {
    name: 'one child a year again: every gap a year',
    file: FAMILY, from: 'export const BIRTH_GAP = Object.freeze([1.4, 3]);', to: 'export const BIRTH_GAP = Object.freeze([1, 1.02]);',
  },
  {
    name: 'no grown child at home, so eighteen children are squeezed into eighteen years again',
    file: FAMILY, from: '    eldest = GROWN_AT_HOME;\n', to: '',
  },
];

const failing = output => [...output.matchAll(/^✖ (.+?) \(\d/gm)].map(match => match[1]).filter((name, i, all) => name !== 'failing tests:' && all.indexOf(name) === i);
const run = (files = FILES) => { const result = spawnSync(process.execPath, ['--test', ...files], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }); return failing(`${result.stdout}${result.stderr}`); };

const clean = run([...FILES, PERIODS]);
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
  writeFileSync(file, original.replace(from, () => to));
  let failed;
  try { failed = run(injection.files); } finally { writeFileSync(file, original); }
  record.push({ name: injection.name, file, files: injection.files || FILES, failed });
  console.log(`${failed.length ? 'caught' : 'MISSED'}: ${injection.name} -> ${failed.join(' | ') || 'nothing failed'}`);
}
if (run([...FILES, PERIODS]).length) throw new Error('The tests fail after every file was put back');
mkdirSync('docs/evidence', { recursive: true });
writeFileSync('docs/evidence/family-roll-injections.json', `${JSON.stringify({
  record: 'family-roll-injections',
  date: new Date().toISOString().slice(0, 10),
  note: 'The roll is the family (owner, 2026-09-22), and what the family eats by age, its twins and the spacing of its births (owner, 2026-09-22). Every injection is a rule of the table, of reading an old class on its own table, of the birth dates of a family of up to eighteen children, of eating by age in quarters, or of twins, taken back out.',
  files: [...FILES, PERIODS],
  injections: record,
}, null, 2)}\n`);
console.log(`\n${record.filter(r => r.failed.length).length} of ${record.length} caught; wrote docs/evidence/family-roll-injections.json`);
