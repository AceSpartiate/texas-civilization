// The regressions the biome-game tests guard, injected one at a time: docs/BIOME_GAMEPLAY.md §6.
//
// CLAUDE.md: a new test is not evidence until it has failed. Each injection below replaces one exact piece of the rules with
// the regression a test is written against, runs the test files that read those rules, records which tests failed, and puts
// the file back byte for byte. It stops if a replacement does not match exactly once, so a stale injection is never passed
// off as a proof.
//
// Run: node scripts/biome-game-injections.mjs  → writes docs/evidence/biome-game-injections.json
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const FILES = ['tests/biome-game.test.mjs', 'tests/biomes.test.mjs', 'tests/hunt-land.test.mjs', 'tests/house-plot.test.mjs', 'tests/improvements.test.mjs', 'tests/chores.test.mjs', 'tests/hunting.test.mjs'];
const INJECTIONS = [
  { name: 'ducks and buffalo in every month', file: 'sim/hunting.mjs', from: '(!GAME[id].months || GAME[id].months.includes(month))', to: 'true' },
  { name: 'the quarry ignores the cover it keeps to', file: 'sim/hunting.mjs', from: 'GAME[id] && GAME[id].covers.includes(cover) &&', to: 'GAME[id] &&' },
  { name: 'the control does not say what would come', file: 'sim/hunting.mjs', from: "const comes = place.comes ? `Waiting here, ${quarryYieldWords(place.comes)}.` : '';", to: "const comes = '';" },
  { name: 'every kill is a deer\'s meat', file: 'sim/chores.mjs', from: 'const kill = killYield(quarry,', to: 'const kill = killYield(\'deer\',' },
  { name: 'every kill brings a hide', file: 'sim/chores.mjs', from: 'if (kill.hide) household.resources.hides = (household.resources.hides ?? 0) + kill.hide;', to: 'household.resources.hides = (household.resources.hides ?? 0) + 1;' },
  { name: 'a deer drawn for any quarry', file: 'sim/chores.mjs', from: "if (step.quarry && (!state.ground?.quarry || state.ground.quarry === 'deer'))", to: 'if (step.quarry)' },
  { name: 'ducks and geese wait as long as the ground', file: 'sim/hunting.mjs', from: 'Math.max(game, GAME[quarryId]?.flocks || 0)', to: 'game' },
  // Rewritten 2026-09-20 with the quarry's country: `inRange` became `rangeShare`, so these five injections had gone
  // stale and would have stopped the harness. Each replaces the same regression against the same line as it now stands.
  { name: 'an old class given the biomes\' quarry', file: 'sim/hunting.mjs', from: "if (rule === 'biomes') {", to: 'if (true) {' },
  // The country of each quarry, and the belt on a named creek (2026-09-19, the critique of the biomes).
  { name: 'the stand\'s quarry not cut to the place it is asked about', file: 'sim/hunting.mjs', from: 'if (share > 0) shares.set(id, share);', to: 'shares.set(id, 1);' },
  { name: 'the wild herds and the buffalo roam every country', file: 'sim/hunting.mjs', from: "if (range === 'west-of-the-lavaca') return westOfTheLavaca(point) ? 1 : (THINNED_EAST.has(id) ? THIN : 0);", to: "if (range === 'west-of-the-lavaca') return 1;" },
  { name: 'the Lavaca line read from the wrong bank', file: 'sim/hunting.mjs', from: 'for (const at of crossings) if (at > point.x) east++;', to: 'for (const at of crossings) if (at < point.x) east++;' },
  { name: 'ducks and geese on dry prairie away from any water', file: 'sim/hunting.mjs', from: 'return WET_STANDS.has(stand) || (near !== null && near <= WATERFOWL_MILES) ? 1 : 0;', to: 'return 1;' },
  { name: 'the buffalo given the ducks\' own months', file: 'sim/hunting.mjs', from: 'const BISON_MONTHS = Object.freeze([8, 9, 10, 11, 0, 1, 2, 3]);', to: 'const BISON_MONTHS = WINTER;' },
  // The bestiary checked against the record (2026-09-20): the antelope out of the colonies, the buffalo rare, the mustang
  // thin rather than stopped, the deer the commonest thing on the open prairie. docs/BIOME_GAMEPLAY.md §9.
  { name: 'the antelope back on the mesquite prairie', file: 'sim/woods.mjs', from: "quarry: ['deer', 'mustang', 'javelina', 'turkey'],", to: "quarry: ['deer', 'mustang', 'pronghorn', 'javelina', 'turkey']," },
  { name: 'the antelope back on the hill country tops', file: 'sim/woods.mjs', from: "quarry: ['deer', 'turkey', 'bison', 'bear'],", to: "quarry: ['deer', 'turkey', 'bison', 'pronghorn', 'bear']," },
  { name: 'the antelope taken out of its own country too', file: 'sim/woods.mjs', from: "quarry: ['javelina', 'deer', 'turkey', 'pronghorn'],", to: "quarry: ['javelina', 'deer', 'turkey']," },
  { name: 'the buffalo as common on the grass as the deer', file: 'sim/hunting.mjs', from: "months: BISON_MONTHS, range: 'west-of-the-lavaca', weight: 0.1", to: "months: BISON_MONTHS, range: 'west-of-the-lavaca', weight: 1" },
  { name: 'the mustang stopped dead at the Lavaca again', file: 'sim/hunting.mjs', from: '(THINNED_EAST.has(id) ? THIN : 0)', to: '0' },
  { name: 'the mustang east of the Lavaca at its full weight', file: 'sim/hunting.mjs', from: 'export const THIN = 0.15;', to: 'export const THIN = 1;' },
  { name: 'the deer on the open prairie worth no more than a wild herd', file: 'sim/hunting.mjs', from: 'const OPEN_DEER_WEIGHT = 2;', to: 'const OPEN_DEER_WEIGHT = 1;' },
  { name: 'a named creek\'s belt no wider than a branch\'s fringe', file: 'sim/woods.mjs', from: 'export const CREEK_GALLERY_MILES = 0.14;', to: 'export const CREEK_GALLERY_MILES = CREEK_STRIP_MILES;' },
  { name: 'the Hill Country\'s creeks given a belt too', file: 'sim/woods.mjs', from: "const GALLERY_STRIP = new Set(['tallgrass-prairie',", to: "const GALLERY_STRIP = new Set(['hill-savanna', 'tallgrass-prairie'," },
  { name: 'a hunting place naming no known quarry is accepted', file: 'sim/world.mjs', from: ' || (hunted.quarry !== undefined && !GAME[hunted.quarry])', to: '' },
  { name: 'the logs fetched never reach the pile', file: 'sim/chores.mjs', from: 'stackLogs(household, { wall: state.logs });', to: '' },
  // The text this one replaces moved on 2026-09-19 when a team left at the timber was fetched home (the mode became a
  // function); the injection had gone stale and stopped the whole harness, which is why this record was out of date.
  { name: 'logs fetched however the family asked to go', file: 'sim/chores.mjs', from: "if (chore.forceMode) modeId = typeof chore.forceMode === 'function' ? chore.forceMode(world, household) : chore.forceMode;", to: '' },
  { name: 'asking the cost writes the timber into the map', file: 'sim/chores.mjs', from: 'const wood = logwoodGround(world, household, false), home', to: 'const wood = logwoodGround(world, household), home' },
  // Matched a line at a time since 2026-09-19: these two spanned a line break and carried \r\n, and this repository's files
  // are LF, so they matched nothing and stopped the harness before it could write its record.
  { name: 'fetching logs offered without an axe', file: 'sim/chores.mjs', from: "if (household.tools?.axe === undefined) return { can: false, why: 'Felling wants an axe", to: "if (false) return { can: false, why: 'Felling wants an axe" },
  { name: 'a family with no timber of its own always builds a jacal', file: 'sim/neighbours.mjs', from: '&& !fetchesLogs(world, household, homeSite)', to: '&& true' },
  { name: 'a fence costs the same however far the rails come', file: 'sim/fields.mjs', from: 'ticks: FENCE_TICKS + Math.round(FENCE_TICKS_A_MILE * far)', to: 'ticks: FENCE_TICKS' },
  { name: 'the fence chore ignores the country', file: 'sim/chores.mjs', from: "const ticks = step.work === 'well' ? wellTicks(household) : fence ? fence.ticks :", to: "const ticks = step.work === 'well' ? wellTicks(household) : fence ? 8 :" },
];

const failing = output => [...output.matchAll(/^✖ (.+?) \(\d/gm)].map(match => match[1]).filter((name, i, all) => name !== 'failing tests:' && all.indexOf(name) === i);
const run = () => { const result = spawnSync(process.execPath, ['--test', ...FILES], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }); return failing(`${result.stdout}${result.stderr}`); };

const clean = run();
if (clean.length) throw new Error(`The tests fail before any injection: ${clean.join('; ')}`);
const record = [];
for (const injection of INJECTIONS) {
  const original = readFileSync(injection.file, 'utf8');
  const count = original.split(injection.from).length - 1;
  if (count !== 1) throw new Error(`${injection.name}: the text to replace is in ${injection.file} ${count} times`);
  writeFileSync(injection.file, original.replace(injection.from, injection.to));
  let failed;
  try { failed = run(); } finally { writeFileSync(injection.file, original); }
  record.push({ ...injection, failed });
  console.log(`${failed.length ? 'caught' : 'MISSED'}: ${injection.name} -> ${failed.join(' | ') || 'nothing failed'}`);
}
if (run().length) throw new Error('The tests fail after every file was put back');
mkdirSync('docs/evidence', { recursive: true });
writeFileSync('docs/evidence/biome-game-injections.json', `${JSON.stringify({ record: 'Regressions injected into the biome-game rules, one at a time: docs/BIOME_GAMEPLAY.md §6', date: new Date().toISOString().slice(0, 10), files: FILES, injections: record.map(({ from, to, ...rest }) => rest) }, null, 1)}\n`);
