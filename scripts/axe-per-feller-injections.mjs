// Injections for "each needs an axe" (owner, 2026-09-28; docs/TOWNS.md §4b, amended). CLAUDE.md: "a new test is not evidence
// until it has failed". Each injection puts back one exact mistake, the felling and axe tests are run, and every file is restored.
// Run: node scripts/axe-per-feller-injections.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const FILES = ['tests/axe-per-feller.test.mjs', 'tests/auto-house.test.mjs', 'tests/felling.test.mjs', 'tests/tools.test.mjs', 'tests/war-rifle.test.mjs'];
const T = {
  refuse: 'a second feller needs a second felling axe: refused in plain words, and each holds a copy of their own until they stop',
  auto: 'a feller on auto with no free axe works about the place, says why, and takes the axe up the tick it is free',
};
const INJECTIONS = [
  { name: 'felling shares the axe at home, as before the owner\'s decision', expect: [T.refuse, T.auto],
    file: 'sim/chores.mjs', from: "  if (choreId === 'fell-trees') return 'own';", to: "  if (choreId === 'fell-trees') return 'home';" },
  { name: 'the refusal names the holder but not where another axe is to be had', expect: [T.refuse, T.auto],
    file: 'sim/chores.mjs', from: "return `There is no free felling axe: ${hasWords(holder, ['axe'], world, entity)} Buy another in town.`;", to: "return hasWords(holder, ['axe'], world, entity);" },
  { name: 'felling holds no axe at all', expect: [T.refuse, T.auto],
    file: 'sim/chores.mjs', from: "  return { held: [...new Set([...own, ...(axe ? ['axe'] : []), ...road])]", to: "  return { held: [...new Set([...own, ...(axe && axe !== 'own' ? ['axe'] : []), ...road])]" },
];
const failing = output => [...output.matchAll(/^✖ (.+?) \(\d/gm)].map(match => match[1]).filter((name, index, all) => all.indexOf(name) === index);
const run = () => { try { execFileSync(process.execPath, ['--test', ...FILES], { encoding: 'utf8', stdio: 'pipe' }); return []; } catch (error) { return failing(`${error.stdout}`); } };

const baseline = run();
if (baseline.length) throw new Error(`the tests fail before any injection: ${baseline.join('; ')}`);
const results = [];
for (const injection of INJECTIONS) {
  const text = readFileSync(injection.file, 'utf8'), crlf = text.includes('\r\n'), plain = crlf ? text.replace(/\r\n/g, '\n') : text;
  if (!plain.includes(injection.from)) throw new Error(`${injection.name}: not found`);
  const changed = plain.replace(injection.from, injection.to);
  try {
    writeFileSync(injection.file, crlf ? changed.replace(/\n/g, '\r\n') : changed);
    const failed = run();
    const caught = injection.expect.every(name => failed.includes(name));
    results.push({ injection: injection.name, caught, failed });
    console.log(`${caught ? 'CAUGHT' : 'MISSED'}: ${injection.name} -> ${failed.join(' | ')}`);
  } finally { writeFileSync(injection.file, text); }
}
mkdirSync('docs/evidence', { recursive: true });
writeFileSync('docs/evidence/axe-per-feller-injections.json', `${JSON.stringify({ date: new Date().toISOString().slice(0, 10), files: FILES, caught: results.filter(r => r.caught).length, of: results.length, results }, null, 2)}\n`);
console.log(`${results.filter(r => r.caught).length} of ${results.length} caught`);
