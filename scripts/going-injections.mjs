// Injections for the way asked before anybody leaves (owner, 2026-09-24; docs/FAMILY_PANEL.md §15). CLAUDE.md: "a new test is
// not evidence until it has failed". Each injection puts back one exact mistake, the test files the change touches are run,
// the failing tests are recorded, and the file is restored. Run: node scripts/going-injections.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const FILES = ['tests/going.test.mjs', 'tests/going-page.test.mjs', 'tests/errands.test.mjs', 'tests/travel-modes.test.mjs', 'tests/auto.test.mjs',
  'tests/neighbours.test.mjs', 'tests/hunting.test.mjs', 'tests/geography.test.mjs', 'tests/tools.test.mjs', 'tests/upriver.test.mjs', 'tests/war-rifle.test.mjs',
  'tests/family-panel.test.mjs', 'tests/keeping.test.mjs'];
const INJECTIONS = [
  { name: 'the ways tried slowest first', file: 'sim/going.mjs', from: '.sort((a, b) => b.speed - a.speed)', to: '.sort((a, b) => a.speed - b.speed)' },
  { name: 'an order with no way walks, as before', file: 'sim/world.mjs', from: 'const mode = input.mode || orderMode(world, household, entity, input);', to: 'const mode = input.mode || DEFAULT_MODE;' },
  { name: 'the chooser never asks who has a thing', file: 'sim/going.mjs', from: 'const open = modeAvailability ? modeAvailability(world, entity, id, path) :', to: 'const open = modeAvailability ? { can: true } :' },
  { name: 'auto repeats the way it last went', file: 'sim/auto.mjs', from: 'quickestForChore(world, household, person, order.chore, modeAvailability)', to: 'order.mode' },
  { name: 'the director walks everybody', file: 'sim/neighbours.mjs', from: 'const ride = attempt;', to: "const ride = input => attempt({ ...input, mode: 'foot' });" },
  { name: 'the page does not ask for work with a road in it', file: 'public/going.js', from: "Boolean(catalogue.get?.(input.chore)?.journey)", to: 'false' },
  { name: 'the page sends the quickest whatever was pressed', file: 'public/going.js', from: 'return pick ? pick.id : quickest || null;', to: 'return quickest || null;' },
  { name: 'a shut way loses its reason on the page', file: 'public/going.js', from: "if (!way.can) button.title = way.why || '';", to: '' },
  { name: 'the four short works counted as journeys', file: 'sim/chores.mjs', from: '!chore.forage && !chore.huntLand && !chore.plan', to: '!chore.huntLand && !chore.plan' },
  { name: 'logs offered every way', file: 'sim/chores.mjs', from: "...(only && { only, onlyWhy: ONLY_WHY[choreId]?.[only] || null }),", to: '' },
  { name: 'the quickest not marked', file: 'public/going.js', from: "way.id === quickest ? `${way.name} (quickest)` : way.name", to: 'way.name' },
];

function failing() {
  try { execFileSync(process.execPath, ['--test', ...FILES], { encoding: 'utf8', stdio: 'pipe' }); return []; }
  catch (error) { return [...new Set(String(error.stdout).split('\n').filter(line => /^✖ /.test(line) && !/failing tests/.test(line)).map(line => line.replace(/^✖ /, '').replace(/ \(\d+(\.\d+)?ms\)$/, '')))]; }
}
const baseline = failing();
if (baseline.length) throw new Error(`the suite fails before anything is injected: ${baseline.join(' | ')}`);
const results = [];
for (const injection of INJECTIONS) {
  const original = readFileSync(injection.file, 'utf8');
  if (!original.includes(injection.from)) throw new Error(`${injection.name}: the text to replace is not in ${injection.file}`);
  writeFileSync(injection.file, original.replace(injection.from, injection.to));
  let failed;
  try { failed = failing(); } finally { writeFileSync(injection.file, original); }
  results.push({ ...injection, caught: failed.length > 0, failed });
  console.log(failed.length ? 'CAUGHT' : 'MISSED', injection.name, '->', failed.join(' | '));
}
mkdirSync('docs/evidence', { recursive: true });
writeFileSync('docs/evidence/going-injections.json', JSON.stringify({ record: 'going-injections', date: new Date().toISOString().slice(0, 10), files: FILES,
  caught: results.filter(one => one.caught).length, of: results.length, results }, null, 2) + '\n');
console.log(`${results.filter(one => one.caught).length} of ${results.length} caught; wrote docs/evidence/going-injections.json`);
