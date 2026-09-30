// Injections for tests/watch-over-supply.test.mjs (owner, 2026-09-30, "Watch goes over it"): each regression put in, the test file
// run, the file restored. Every one must be caught. Run: node scripts/watch-over-supply-injections.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const injections = [
  ['Watch held back by the supply request again', 'public/military-attention.js', "const asking = world.request?.status === 'open' && world.request.kind !== 'supply';", "const asking = world.request?.status === 'open';"],
  ['the supply request ranked before the Watch card again', 'public/military-attention.js', "const rank = notice => (notice.kind === 'call' && world.request?.kind === 'supply' ? SUPPLY_ORDER : ORDER[notice.kind]);", 'const rank = notice => ORDER[notice.kind];'],
  ['the supply request dropped from the messages under Watch', 'public/military-attention.js', "if (need.kind === 'call') { if (seenCall.has(world.request?.id)) continue;", "if (need.kind === 'call') { if (seenCall.has(world.request?.id) || (world.battleAlert && world.request?.kind === 'supply')) continue;"],
  ['the request\'s clock not held under the fight\'s card', 'sim/decision-budget.mjs', ' || Boolean(fightUp?.(household))', ''],
  ['the fight never told to the clock', 'sim/world.mjs', 'heldFor: household => inLesson(world, household), fightUp, beginTravel', 'heldFor: household => inLesson(world, household), beginTravel'],
  ['the whole call to arms let through as well', 'public/military-attention.js', "const asking = world.request?.status === 'open' && world.request.kind !== 'supply';", "const asking = world.request?.status === 'open' && !['supply', 'call'].includes(world.request.kind);"],
];
const results = [];
for (const [name, file, from, to] of injections) {
  const before = readFileSync(file, 'utf8');
  if (!before.includes(from)) { results.push(`${name}: INJECTION DID NOT APPLY`); continue; }
  writeFileSync(file, before.replace(from, to));
  try {
    const run = spawnSync(process.execPath, ['--test', 'tests/watch-over-supply.test.mjs'], { encoding: 'utf8' });
    const failed = [...run.stdout.matchAll(/^✖ (.+?) \(\d/gm)].map(match => match[1]).filter((line, i, all) => all.indexOf(line) === i);
    results.push(`${name}: ${failed.length ? `caught by ${failed.length}: ${failed.join(' | ')}` : 'NOT CAUGHT'}`);
  } finally { writeFileSync(file, before); }
}
console.log(results.join('\n'));
if (results.some(line => /NOT CAUGHT|DID NOT APPLY/.test(line))) process.exitCode = 1;
