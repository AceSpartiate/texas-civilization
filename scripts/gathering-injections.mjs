// The regressions tests/gathering.test.mjs guards, injected one at a time (CLAUDE.md: "A new test is not evidence until
// it has failed"). Each injection replaces one exact piece of sim/gathering.mjs, sim/chores.mjs or sim/hunting.mjs with
// the mistake a test is written against, runs the test file, records which tests failed, and puts the file back byte for
// byte. It stops if a replacement does not match exactly once, so a stale injection is never passed off as a proof.
//
// Run: node scripts/gathering-injections.mjs  → writes docs/evidence/gathering-injections.json
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const FILES = ['tests/gathering.test.mjs'];
const FILE = 'sim/gathering.mjs';
const INJECTIONS = [
  // 1. The country decides. This is the whole argument of the set: the coast has oysters and the prairie has not.
  {
    name: 'the oyster beds are offered wherever a family lives, forty miles inland included',
    from: "  if (work.salt && !onSaltWater(world, home)) return { can: false, why: 'The oyster beds are on the coast, and this land is not.' };",
    to: '',
  },
  {
    name: 'salt water is any water, so a creek in the timber is an oyster bed',
    from: '  if (SALT_STANDS.includes(huntingPlace(world, point).stand)) return true;',
    to: '  if (huntingPlace(world, point).stand) return true;',
  },
  {
    name: 'a bee tree can be cut on the open prairie, where there is no tree',
    from: '  if (work.cover && cover && !work.cover.includes(cover)) {',
    to: '  if (false && work.cover && cover && !work.cover.includes(cover)) {',
  },
  {
    name: 'a line goes into a creek that is dry half the year',
    from: "const PERENNIAL = info => info.kind !== 'creek' || info.perennial;",
    to: 'const PERENNIAL = () => true;',
  },
  {
    name: 'a family fishes water thirty miles from the house',
    from: 'export const FORAGE_REACH = 3;',
    to: 'export const FORAGE_REACH = 30;',
  },
  {
    name: 'a refusal says nothing, so a student is shown a work that will not run and no reason',
    from: "    if (!water) return { can: false, why: 'There is no water within reach of the house that runs all year.' };",
    to: '    if (!water) return { can: false, why: \'\' };',
  },
  // 2. What each work gives, and that it gives it.
  {
    name: 'the control quotes food the work does not actually bring home',
    from: '    return { can: true, where: named, miles: Math.round(water.miles * 10) / 10, food: work.food, hours: work.hours, what: work.what };',
    to: '    return { can: true, where: named, miles: Math.round(water.miles * 10) / 10, food: work.food + 2, hours: work.hours, what: work.what };',
  },
  {
    name: 'a day at the water brings home nothing at all',
    from: "  fish: Object.freeze({\n    food: 3, hours: 2, skill: 'hands', water: 'perennial',",
    to: "  fish: Object.freeze({\n    food: 0, hours: 2, skill: 'hands', water: 'perennial',",
  },
  // 3. The shot, the axe, and the knack that is not wanted.
  {
    name: 'small game is taken with no powder in the house',
    from: "  if (work.powder && !powder) return { can: false, why: 'There is no powder and lead in the house.' };",
    to: '',
  },
  {
    name: 'the shot costs nothing, so the powder never runs out',
    file: 'sim/chores.mjs',
    from: "    { consume: { powder: SHOT_COST } },\n    { forage: 'smallgame', produce: { food: FORAGE.smallgame.food } },",
    to: "    { forage: 'smallgame', produce: { food: FORAGE.smallgame.food } },",
  },
  {
    name: 'a bee tree is cut with no axe in the house',
    from: "  if (work.axe && !axe) return { can: false, why: 'Cutting a bee tree wants an axe, and there is none in the house.' };",
    to: '',
  },
  // 4. Where they go, and how.
  {
    name: 'the walk to the water is asked of the roads, which do not go to a creek bank',
    file: 'sim/chores.mjs',
    from: "const forageBegin = kind => (world, household, entity) => {\n  const ground = forageGround(world, household, kind);\n  if (ground) entity.chore.ground = ground;\n};",
    to: 'const forageBegin = () => () => {};',
  },
  {
    name: 'every gathering work sets out for the timber, wherever its own place is',
    file: 'sim/chores.mjs',
    from: "  if (kind === 'fish') {\n    const site = fishingSite(world, household, false);\n    return site && { x: site.x, y: site.y, name: site.name };\n  }",
    to: '',
  },
  // 5. What rides on the per-tick channel.
  {
    name: "four more numbers a student never reads, for every person, every tick",
    file: 'sim/chores.mjs',
    from: '    const full = chore.hauls && !chore.huntLand && !chore.forage ? haulFor(entity, id) : null;',
    to: '    const full = chore.hauls && !chore.huntLand ? haulFor(entity, id) : null;',
  },
  {
    name: 'the control says nothing about what a gathering work costs',
    file: 'sim/chores.mjs',
    from: '      : chore.forage ? forageCost(world, household, id)',
    to: "      : chore.forage ? ''",
  },
  // 6. The winter turkey and the lean deer.
  {
    name: 'the winter is the same as the summer: no fat turkey, no lean deer',
    file: 'sim/hunting.mjs',
    from: 'export const winterShare = (quarryId, month) => (WINTER_MONTHS.includes(month) && WINTER_YIELD[quarryId]) || 1;',
    to: 'export const winterShare = () => 1;',
  },
  {
    name: 'the winter is given to every animal, the denned bear included',
    file: 'sim/hunting.mjs',
    from: 'export const winterShare = (quarryId, month) => (WINTER_MONTHS.includes(month) && WINTER_YIELD[quarryId]) || 1;',
    to: 'export const winterShare = (quarryId, month) => (WINTER_MONTHS.includes(month) && (WINTER_YIELD[quarryId] || 1.5)) || 1;',
  },
  {
    name: 'the winter holds all year, so a turkey is fat in July',
    file: 'sim/hunting.mjs',
    from: 'export const WINTER_MONTHS = Object.freeze([11, 0, 1]);',
    to: 'export const WINTER_MONTHS = Object.freeze([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);',
  },
  {
    name: 'a kill that does not know the date is given the winter anyway',
    file: 'sim/hunting.mjs',
    from: '  const meat = skillYield(game.meat * (month === null ? 1 : winterShare(quarryId, month)));',
    to: '  const meat = skillYield(game.meat * winterShare(quarryId, month ?? 0));',
  },
  // 7. What the family is told.
  {
    name: 'the work says nothing when somebody comes home with the catch',
    file: 'sim/chores.mjs',
    from: '        if (step.forage) {',
    to: '        if (false && step.forage) {',
  },
  {
    name: 'every gathering work is said in the same words, so a squirrel is a perch',
    file: 'sim/chores.mjs',
    from: "            text: `${entity.name} brought home ${work.what}: ${kept} food.`,",
    to: "            text: `${entity.name} brought home something: ${kept} food.`,",
  },
  {
    name: 'what came home is said with the claim of another work entirely',
    file: 'sim/chores.mjs',
    from: "const FORAGE_CLAIMS = Object.freeze({ smallgame: 'FIC-GONZ-173', fish: 'FIC-GONZ-174', oysters: 'FIC-GONZ-175', honey: 'FIC-GONZ-176' });",
    to: "const FORAGE_CLAIMS = Object.freeze({ smallgame: 'FIC-GONZ-173', fish: 'FIC-GONZ-173', oysters: 'FIC-GONZ-175', honey: 'FIC-GONZ-176' });",
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
  // Some of these files are kept with Windows line endings and some are not, and an injection that spans two lines has to
  // match the file it is going into rather than the one it was written in.
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
writeFileSync('docs/evidence/gathering-injections.json', `${JSON.stringify({ record: 'gathering-injections', date: new Date().toISOString().slice(0, 10), files: FILES, injections: record }, null, 2)}\n`);
console.log(`\n${record.filter(r => r.failed.length).length} of ${record.length} caught; wrote docs/evidence/gathering-injections.json`);
