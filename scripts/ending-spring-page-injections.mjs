// The page's half of the ending's regressions (docs/audits/2026-09-29-triage.md 2.8, 2.10, 3.6, 3.7), injected one at a time
// into public/ending.js (CLAUDE.md: "A new test is not evidence until it has failed"), each run against
// npm run test:ending-spring; the file put back byte for byte after each. Needs PLAYWRIGHT_MODULE and BROWSER_EXECUTABLE as
// the proof does. Run from the repository: node scripts/ending-spring-page-injections.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const file = `${root}/public/ending.js`;
const INJECTIONS = [
  { name: '3.6 "the events of that October" at an April ending', from: "make('p', 'No award was earned.')", to: "make('p', 'Nobody in the family took part in the events of that October.')" },
  { name: '2.8 the old October columns', from: "'Family', 'Who went', 'Heard of the cannon', 'Heard the Alamo fell', 'In the spring', 'Farm', 'Taken prisoner'", to: "'Family', 'Road miles from Gonzales', 'Heard of the cannon', 'Who went', 'Taken prisoner'" },
  { name: '3.7 the old footer, without the prisoners\' share', from: "if (closing.formulaWords) parts.push(make('p', closing.formulaWords, 'ending-sum'));", to: "parts.push(make('p', 'Final number = coin × (1 + glory) + land. A family with no coin is counted as having 1 real.', 'ending-sum'));" },
  { name: '2.10 each award a bare number again', from: "if (award.worth) item.append(make('span', award.worth, 'ending-worth'));", to: 'item.append(` (${award.points})`);' },
  { name: '2.10 the sum not said in sentences', from: "if (family.sumSaid) parts.push(make('p', family.sumSaid, 'ending-said'));", to: '' },
];
const results = [];
for (const injection of INJECTIONS) {
  const original = readFileSync(file, 'utf8');
  if (!original.includes(injection.from)) throw new Error(`not found: ${injection.name}`);
  writeFileSync(file, original.replace(injection.from, injection.to));
  let run;
  try { run = spawnSync(process.execPath, ['scripts/ending-spring-browser-proof.mjs'], { cwd: root, encoding: 'utf8', env: process.env, maxBuffer: 64 * 1024 * 1024, timeout: 600000 }); } finally { writeFileSync(file, original); }
  const out = `${run.stdout}${run.stderr}`;
  const why = (out.match(/^(AssertionError[^\n]*|Error[^\n]*)/m) || [''])[0];
  results.push({ name: injection.name, caught: run.status !== 0, why });
  console.log(`${run.status !== 0 ? 'CAUGHT' : 'MISSED'} ${injection.name}: ${why}`);
}
writeFileSync(`${root}/docs/evidence/ending-spring-page-injections.json`, `${JSON.stringify({ record: 'ending-spring-page-injections', date: new Date().toISOString().slice(0, 10), proof: 'npm run test:ending-spring', caught: results.filter(one => one.caught).length, of: results.length, injections: results }, null, 2)}\n`);
