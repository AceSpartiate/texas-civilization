// The regressions tests/children.test.mjs guards, injected one at a time (CLAUDE.md: "A new test is not evidence until it
// has failed"). Each injection replaces one exact piece of the code the children's works are made of with the mistake a
// test is written against, runs the test file, records which tests failed, and puts the file back byte for byte. It stops
// if a replacement does not match exactly once, so a stale injection is never passed off as a proof.
//
// CRLF: this working copy is CRLF and a `from` written with bare newlines matches nothing in it, which is how four
// harnesses in this repo were found to have been silently catching zero. `ends` converts each pattern to the line endings
// the file on disk actually has before it looks for it, and the exactly-once check below is what makes a miss loud.
//
// Run: node scripts/children-injections.mjs  → writes docs/evidence/children-injections.json
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const FILES = ['tests/children.test.mjs'];
const CHILDREN = 'sim/children.mjs', CHORES = 'sim/chores.mjs', WORLD = 'sim/world.mjs', FURNITURE = 'sim/furniture.mjs', LESSON = 'sim/lesson.mjs';
const INJECTIONS = [
  // 1. The age ladder.
  {
    name: 'play is offered from birth, so an infant has a bar after all',
    file: CHILDREN, from: "  'child-play': 2,", to: "  'child-play': 0,",
  },
  {
    name: 'the ladder is flattened: every work from five, the pail and the baby included',
    file: CHILDREN, from: "  'child-water': 7,\n  'child-mind': 7,", to: "  'child-water': 5,\n  'child-mind': 5,",
  },
  {
    name: 'the band never closes, so a father of forty has a Play button',
    file: CHILDREN, from: '  if (!Number.isFinite(age) || age >= SENT_FROM_AGE) return [];', to: '  if (!Number.isFinite(age)) return [];',
  },
  {
    // The founding four's children have no `age` at all. Standing in for one here is the whole of the children's band,
    // which is what an `?? ` default would do if it were written to make the works reachable rather than to exclude them.
    name: 'a person the game knows no age for is given the whole of a child’s bar',
    file: CHILDREN, from: '  if (!Number.isFinite(age) || age >= SENT_FROM_AGE) return [];\n  return CHILD_WORKS.filter(id => age >= CHILD_WORK_FROM[id]);',
    to: '  if (Number.isFinite(age) && age >= SENT_FROM_AGE) return [];\n  return CHILD_WORKS.filter(id => (age ?? 8) >= CHILD_WORK_FROM[id]);',
  },
  {
    name: 'the band ends at ten inclusive, so a ten-year-old keeps the children’s works',
    file: CHILDREN, from: '  if (!Number.isFinite(age) || age >= SENT_FROM_AGE) return [];', to: '  if (!Number.isFinite(age) || age > SENT_FROM_AGE) return [];',
  },
  // 2. The bar, and what is on it.
  {
    name: 'the chore table refuses a child every work again, which is the empty bar the owner hit',
    file: CHORES, from: '  if (tooYoung(entity) && !chore.child) return { can: false, why: tooYoungWhy(entity) };', to: '  if (tooYoung(entity)) return { can: false, why: tooYoungWhy(entity) };',
  },
  {
    name: 'the adult works are left on a child’s row: thirty dimmed pictures saying "too young" beside the Play button',
    file: CHORES, from: '    && !(childBar && !chore.child)\n', to: '',
  },
  {
    name: 'the adult works are hidden from an infant too, so their row goes blank and has no reason left to show',
    file: CHORES, from: '  const childBar = tooYoung(entity) && Object.values(CHORES).some(other => other.child && other.offered(world, household, entity));',
    to: '  const childBar = tooYoung(entity);',
  },
  {
    name: 'the bird-scaring and the minding are offered whatever the family has, as a dimmed refusal on every tick',
    file: CHILDREN, from: "  if (choreId === 'child-mind') return littleOnesAtHome(world, household, entity);\n  if (choreId === 'child-birds') return standing(household);\n  return true;",
    to: '  return true;',
  },
  // 3. The server holds the gate.
  {
    name: 'the order gate is closed again, so nothing a child is offered can actually be sent',
    file: WORLD, from: "  if (tooYoung(entity) && !['rename', 'rest', 'ask-rider', 'leave-rider'].includes(input.action) && !childAction(input)) throw new Error(tooYoungWhy(entity));",
    to: "  if (tooYoung(entity) && !['rename', 'rest', 'ask-rider', 'leave-rider'].includes(input.action)) throw new Error(tooYoungWhy(entity));",
  },
  {
    name: 'the age ladder is checked only when the row is drawn, and an order sent straight to the server is taken',
    file: CHILDREN, from: '  if (age < CHILD_WORK_FROM[choreId]) return `${entity.name} is only ${age}, and too small for that.`;\n', to: '',
  },
  {
    name: 'a child who has grown out of the band can still be set to play',
    file: CHILDREN, from: "  if (age >= SENT_FROM_AGE) return `${entity.name} is ${age} now, and has the family's own work to do.`;\n", to: '',
  },
  {
    name: 'a child’s work takes them off the family’s own land, which is the half of the 2026-09-12 rule that stands',
    file: CHILDREN, from: "  steps: [{ work: CHILD_WORK_TICKS[id], doing }, { run }],",
    to: "  steps: [{ travel: 'timber', doing }, { work: CHILD_WORK_TICKS[id], doing }, { travel: 'home', doing }, { run }],",
  },
  // 4. The eggs, which are the one thing a child adds to the family's store.
  {
    name: 'the hens lay all day: the nests can be gone round over and over for as much food as the family likes',
    file: CHILDREN, from: "  if (choreId === 'child-eggs' && eggsGathered(world, household)) return 'The nests have been gone round today. The hens lay once a day.';\n", to: '',
  },
  {
    name: 'every child brings in the same eggs, so a five-year-old is as good at it as a nine-year-old',
    file: CHILDREN, from: 'export const EGGS_BASE = 0.3, EGGS_PER_YEAR = 0.05;', to: 'export const EGGS_BASE = 0.3, EGGS_PER_YEAR = 0;',
  },
  {
    name: 'the day is stamped but the eggs never reach the house',
    file: CHILDREN, from: '    household.resources.food = Math.round(((household.resources.food ?? 0) + got) * 10000) / 10000;\n', to: '',
  },
  {
    name: 'the eggs are gathered and the day is never stamped, so the once-a-day rule is unreachable',
    file: CHILDREN, from: '    household.eggsDay = dayOf(world);\n', to: '',
  },
  // 5. Minding the younger ones, and the four that add nothing.
  {
    name: 'a child minding the baby does nothing for the parents: the cradle is the only relief again',
    file: FURNITURE, from: "  if (household.members.some(id => world.entities[id]?.chore?.id === 'child-mind')) return false;\n", to: '',
  },
  {
    name: 'the relief outlives the minding: having a child of seven in the house is enough, for ever',
    file: FURNITURE, from: "  if (household.members.some(id => world.entities[id]?.chore?.id === 'child-mind')) return false;",
    to: '  if (household.members.some(id => (world.entities[id]?.age ?? 0) >= 7 && (world.entities[id]?.age ?? 99) < 10)) return false;',
  },
  {
    name: 'play quietly feeds the family, which is the thing it is most important that it does not do',
    file: CHILDREN, from: "    tell(world, entity, line(entity.name), 'FIC-GONZ-300');",
    to: "    household.resources.food = Math.round(((household.resources.food ?? 0) + 1) * 10000) / 10000;\n    tell(world, entity, line(entity.name), 'FIC-GONZ-300');",
  },
  {
    name: 'the hour a child spends at play leaves nothing in the family’s record at all',
    file: CHILDREN, from: "    const line = PLAYS[Math.floor(share(world, entity.id, `play:${Math.floor(world.minute / 60)}`) * PLAYS.length) % PLAYS.length];\n    tell(world, entity, line(entity.name), 'FIC-GONZ-300');",
    to: '    return;',
  },
  {
    name: 'the hour is drawn from a stream, so a class does not replay and a reload tells a different story',
    file: CHILDREN, from: 'const line = PLAYS[Math.floor(share(world, entity.id, `play:${Math.floor(world.minute / 60)}`) * PLAYS.length) % PLAYS.length];',
    to: 'const line = PLAYS[Math.floor(Math.random() * PLAYS.length) % PLAYS.length];',
  },
  // 6. The lesson, and a save that cannot be.
  {
    name: 'the guided beginning refuses a child their hour because the house is not raised yet',
    file: LESSON, from: "  'chore:child-play', 'chore:child-kindling', 'chore:child-birds', 'chore:child-eggs', 'chore:child-water', 'chore:child-mind',\n", to: '',
  },
  {
    name: 'a saved class saying a one-year-old was at play opens without a word',
    file: CHILDREN, from: "    if (entity.chore && isChildWork(entity.chore.id) && !oldEnoughFor(entity, entity.chore.id)) return 'Child work by somebody it is not for';\n", to: '',
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
writeFileSync('docs/evidence/children-injections.json', `${JSON.stringify({
  record: 'children-injections',
  date: new Date().toISOString().slice(0, 10),
  note: 'What a family’s children can be set to (2026-09-21). Every injection is a rule of sim/children.mjs, or of the four gates it is wired through, taken back out.',
  files: FILES,
  injections: record,
}, null, 2)}\n`);
console.log(`\n${record.filter(r => r.failed.length).length} of ${record.length} caught; wrote docs/evidence/children-injections.json`);
