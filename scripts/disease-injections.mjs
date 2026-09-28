// The regressions tests/disease.test.mjs guards, injected one at a time (CLAUDE.md: "A new test is not evidence until it has
// failed"). Each injection replaces one exact piece of a file with the mistake a test is written against, runs the test file,
// records which tests failed, checks they are the ones the injection names (`expect`) and no others, and puts the file back
// byte for byte. The pattern is scripts/cold-injections.mjs's.
//
// Run: node scripts/disease-injections.mjs [name-filter]  → writes docs/evidence/disease-injections.json (all of them only)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const FILES = ['tests/disease.test.mjs'];
const INJECTIONS = [
  // Build step 0: sickness mends everywhere.
  {
    name: 'nobody is mended anywhere but the road, as it was until 2026-09-27',
    file: 'sim/world.mjs',
    from: '  advanceDisease(world, calendar);\n',
    to: '',
    expect: ['step 0: somebody sick at home', 'step 0: a man serving', 'step 0: somebody made sick by a norther', 'step 0: on the road a sickness'],
  },
  {
    name: 'the road mends its own sick as well, so a sickness is mended in two places',
    file: 'sim/scrape.mjs',
    from: '          // The mending is sim/disease.mjs\'s, for everybody wherever they are (docs/DISEASE.md build step 0).\n',
    to: '          else if (world.minute >= person.health.recoversAt) person.health = { condition: \'well\' };\n',
    expect: ['step 0: on the road a sickness'],
  },
];

const failing = output => [...output.matchAll(/^✖ (.+?) \(\d/gm)].map(match => match[1]).filter((name, i, all) => name !== 'failing tests:' && all.indexOf(name) === i);
const run = () => { const result = spawnSync(process.execPath, ['--test', ...FILES], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }); return failing(`${result.stdout}${result.stderr}`); };

const only = process.argv[2] || '';
const chosen = INJECTIONS.filter(injection => injection.name.includes(only));
const clean = run();
if (clean.length) throw new Error(`The tests fail before any injection: ${clean.join('; ')}`);
const record = [];
let wrong = 0;
for (const injection of chosen) {
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
  // Caught, and caught by exactly the tests it names: each expected name is a prefix of a failing test, and nothing else failed.
  const expected = injection.expect || [];
  const missing = expected.filter(prefix => !failed.some(name => name.startsWith(prefix)));
  const extra = failed.filter(name => !expected.some(prefix => name.startsWith(prefix)));
  const ok = failed.length > 0 && !missing.length && !extra.length;
  if (!ok) wrong++;
  record.push({ name: injection.name, file, failed, expected, ok });
  console.log(`${ok ? 'caught' : failed.length ? 'CAUGHT BY THE WRONG TESTS' : 'MISSED'}: ${injection.name} -> ${failed.join(' | ') || 'nothing failed'}${missing.length ? ` [missing: ${missing.join('; ')}]` : ''}${extra.length ? ` [extra: ${extra.join('; ')}]` : ''}`);
}
if (run().length) throw new Error('The tests fail after every file was put back');
if (!only) {
  mkdirSync('docs/evidence', { recursive: true });
  writeFileSync('docs/evidence/disease-injections.json', `${JSON.stringify({ record: 'disease-injections', date: new Date().toISOString().slice(0, 10), files: FILES, injections: record }, null, 2)}\n`);
}
console.log(`\n${record.filter(r => r.ok).length} of ${record.length} caught by exactly their tests${only ? '' : '; wrote docs/evidence/disease-injections.json'}`);
if (wrong) process.exitCode = 1;
