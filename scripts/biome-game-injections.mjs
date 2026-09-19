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

const FILES = ['tests/biome-game.test.mjs', 'tests/hunt-land.test.mjs', 'tests/house-plot.test.mjs', 'tests/improvements.test.mjs', 'tests/chores.test.mjs', 'tests/hunting.test.mjs'];
const INJECTIONS = [
  { name: 'ducks and buffalo in every month', file: 'sim/hunting.mjs', from: '(!GAME[id].months || GAME[id].months.includes(month))', to: 'true' },
  { name: 'the quarry ignores the cover it keeps to', file: 'sim/hunting.mjs', from: 'GAME[id] && GAME[id].covers.includes(cover) &&', to: 'GAME[id] &&' },
  { name: 'the control does not say what would come', file: 'sim/hunting.mjs', from: "const comes = place.comes ? `Waiting here, ${quarryYieldWords(place.comes)}.` : '';", to: "const comes = '';" },
  { name: 'every kill is a deer\'s meat', file: 'sim/chores.mjs', from: 'const kill = killYield(quarry,', to: 'const kill = killYield(\'deer\',' },
  { name: 'every kill brings a hide', file: 'sim/chores.mjs', from: 'if (kill.hide) household.resources.hides = (household.resources.hides ?? 0) + kill.hide;', to: 'household.resources.hides = (household.resources.hides ?? 0) + 1;' },
  { name: 'a deer drawn for any quarry', file: 'sim/chores.mjs', from: "if (step.quarry && (!state.ground?.quarry || state.ground.quarry === 'deer'))", to: 'if (step.quarry)' },
  { name: 'ducks and geese wait as long as the ground', file: 'sim/hunting.mjs', from: 'Math.max(game, GAME[quarryId]?.flocks || 0)', to: 'game' },
  { name: 'an old class given the biomes\' quarry', file: 'sim/hunting.mjs', from: "const quarry = rule === 'biomes' ? stand.quarry || [] : null;", to: "const quarry = standOf(here.stand).quarry || [];" },
  { name: 'a hunting place naming no known quarry is accepted', file: 'sim/world.mjs', from: ' || (hunted.quarry !== undefined && !GAME[hunted.quarry])', to: '' },
  { name: 'the logs fetched never reach the pile', file: 'sim/chores.mjs', from: 'stackLogs(household, { wall: state.logs });', to: '' },
  { name: 'logs fetched however the family asked to go', file: 'sim/chores.mjs', from: 'if (chore.forceMode) modeId = chore.forceMode;', to: '' },
  { name: 'asking the cost writes the timber into the map', file: 'sim/chores.mjs', from: 'const wood = logwoodGround(world, household, false), home', to: 'const wood = logwoodGround(world, household), home' },
  { name: 'fetching logs offered without an axe', file: 'sim/chores.mjs', from: "if (household.tools?.axe === undefined) return { can: false, why: 'Felling wants an axe, and there is none in the house.' };\r\n  const wagon", to: 'const wagon' },
  { name: 'a family with no timber of its own always builds a jacal', file: 'sim/neighbours.mjs', from: '\r\n    && !fetchesLogs(world, household, homeSite);', to: ';' },
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
