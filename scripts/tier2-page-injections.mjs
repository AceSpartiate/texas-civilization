// The regressions the node tests written for the Tier 2 page items guard (triage 2026-09-29: 2.2, 2.4, 2.6), put back one at a
// time (CLAUDE.md: "A new test is not evidence until it has failed"). Each injection changes one file, runs the one test file
// written for it, records whether that test - and only that test - failed, and puts the file back byte for byte.
//
// The browser halves are injected by `npm run test:overlap-injections` (2.2 and 2.12, OVERLAP_INJECT) and recorded in
// docs/evidence/overlap-injections-tier2-page.json; this is the node half.
//
// Run: node scripts/tier2-page-injections.mjs  -> docs/evidence/tier2-page-injections.json
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const INJECTIONS = [
  {
    name: 'the family\'s key is never shown at the end of making the family (2.4)',
    file: 'public/creation.js',
    from: "  if (!step && state.making && !state.keyed && familyKey) return 'key';\n",
    to: '',
    test: 'tests/creation.test.mjs',
    expect: /the family's key comes last/,
  },
  {
    name: 'the family\'s key shown again after it was put away (2.4)',
    file: 'public/creation.js',
    from: "  if (!step && state.making && !state.keyed && familyKey) return 'key';\n",
    to: "  if (!step && state.making && familyKey) return 'key';\n",
    test: 'tests/creation.test.mjs',
    expect: /the family's key comes last/,
  },
  {
    name: 'a trade asked for on the Neighbours sheet opens before the one sent has arrived (2.6)',
    file: 'public/neighbours.js',
    from: "  if (goer.travel) return { state: goer.travel.to === awaited.siteId ? 'going' : 'lost' };\n",
    to: "  if (goer.travel) return { state: 'open', partnerId: awaited.householdId };\n",
    test: 'tests/neighbours-page.test.mjs',
    expect: /a trade asked for on the Neighbours sheet/,
  },
  {
    name: 'a trade asked for is forgotten on the snapshot before the one sent sets out (2.6)',
    file: 'public/neighbours.js',
    from: "  if (goer.location?.siteId !== awaited.siteId) return { state: awaited.seenGoing ? 'lost' : 'waiting' };\n",
    to: "  if (goer.location?.siteId !== awaited.siteId) return { state: 'lost' };\n",
    test: 'tests/neighbours-page.test.mjs',
    expect: /a trade asked for on the Neighbours sheet/,
  },
  {
    name: 'a neighbour\'s person counted a trade partner with none of the family standing there (2.6)',
    file: 'public/neighbours.js',
    from: "  if (!(world?.entities || []).some(entity => here(entity) && entity.householdId === world.householdId && !GONE.includes(entity.health?.condition))) return null;\n",
    to: '',
    test: 'tests/neighbours-page.test.mjs',
    expect: /Offer a trade is offered|the neighbour found for a trade/,
  },
  {
    name: 'the neighbour looked for among the family\'s own people, where the server never sends another family (2.6; the first cut of this, found by test:neighbours)',
    file: 'public/neighbours.js',
    from: "  return (world.others || []).find(entity => here(entity) && entity.householdId === householdId && !entity.resident && !GONE.includes(entity.condition)) || null;\n",
    to: "  return (world.entities || []).find(entity => here(entity) && entity.householdId === householdId && !entity.resident && !GONE.includes(entity.condition)) || null;\n",
    test: 'tests/neighbours-page.test.mjs',
    // Every test of the file stands on it: whether a partner is there is what the arrival asks too.
    expect: /Offer a trade is offered|the neighbour found for a trade|a trade asked for on the Neighbours sheet/,
  },
  {
    name: 'the army\'s question no longer counted as one that will not wait (2.2)',
    file: 'public/military-attention.js',
    from: "export const URGENT = Object.freeze(new Set(['alto', 'road', 'flight', 'call', 'rider', 'courier', 'orders', 'sick']));\n",
    to: "export const URGENT = Object.freeze(new Set(['alto', 'road', 'flight', 'call', 'courier', 'orders', 'sick']));\n",
    test: 'tests/military-attention.test.mjs',
    expect: /will not wait/,
  },
];

const failing = output => [...output.matchAll(/^not ok \d+ - (.+)$/gm)].map(match => match[1].trim());
const run = test => {
  const result = spawnSync(process.execPath, ['--test', '--test-reporter=tap', test], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  return { status: result.status, failed: failing(`${result.stdout}${result.stderr}`) };
};
const record = [];
for (const test of new Set(INJECTIONS.map(one => one.test))) {
  const clean = run(test);
  if (clean.status !== 0) throw new Error(`${test} fails before any injection: ${clean.failed.join(' | ')}`);
}
for (const injection of INJECTIONS) {
  const original = readFileSync(injection.file, 'utf8');
  const CR = String.fromCharCode(13), LF = String.fromCharCode(10);
  const ends = text => (original.includes(CR + LF) ? text.split(LF).join(CR + LF) : text);
  const from = ends(injection.from), to = ends(injection.to);
  const count = original.split(from).length - 1;
  if (count !== 1) throw new Error(`${injection.name}: the text to replace is in ${injection.file} ${count} times, not once`);
  writeFileSync(injection.file, original.replace(from, to));
  let result;
  try { result = run(injection.test); } finally { writeFileSync(injection.file, original); }
  const own = result.failed.filter(name => injection.expect.test(name));
  const others = result.failed.filter(name => !injection.expect.test(name));
  record.push({ name: injection.name, file: injection.file, test: injection.test, caught: result.status !== 0, byItsOwnTest: own.length > 0 && !others.length, failed: result.failed });
  console.log(`${own.length && !others.length ? 'caught by its own test' : result.status !== 0 ? 'caught, but not only by its own test' : 'MISSED'}: ${injection.name}\n   -> ${result.failed.join(' | ') || 'nothing failed'}`);
}
for (const test of new Set(INJECTIONS.map(one => one.test))) {
  const after = run(test);
  if (after.status !== 0) throw new Error(`${test} fails after every file was put back: ${after.failed.join(' | ')}`);
}
mkdirSync('docs/evidence', { recursive: true });
writeFileSync('docs/evidence/tier2-page-injections.json', `${JSON.stringify({
  record: 'tier2-page-injections', date: new Date().toISOString().slice(0, 10),
  note: 'Triage 2026-09-29, Tier 2 items 2.2, 2.4 and 2.6: each injection puts one regression back; `byItsOwnTest` is whether the test written for it, and only that test, failed. Same computer, node --test.',
  injections: record,
}, null, 2)}\n`);
console.log(`\n${record.filter(one => one.byItsOwnTest).length} of ${record.length} caught by their own test; wrote docs/evidence/tier2-page-injections.json`);
