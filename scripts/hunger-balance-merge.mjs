// Sums rows of scripts/hunger-balance.mjs runs (their JSON lines, one class each) into one record, as the harness itself sums them:
// for a measure run in pieces when one run is longer than a background job may last.
// Run: node scripts/hunger-balance-merge.mjs --out <file> <log> [<log> ...]
import { readFileSync, writeFileSync } from 'node:fs';

const at = process.argv.indexOf('--out');
const out = at > 0 ? process.argv[at + 1] : null;
const logs = process.argv.slice(2).filter((arg, index, all) => arg !== '--out' && all[index - 1] !== '--out');
const rows = logs.flatMap(log => readFileSync(log, 'utf8').split(/\r?\n/).filter(line => line.startsWith('{"seed"')).map(line => JSON.parse(line)));
const modes = [...new Set(rows.map(row => row.mode))];
const summary = Object.fromEntries(modes.map(mode => {
  const mine = rows.filter(row => row.mode === mode);
  const mean = key => Math.round((mine.reduce((sum, row) => sum + row[key], 0) / mine.length) * 10) / 10;
  const kind = name => Object.fromEntries(['families', 'hit', 'deaths'].map(key => [key, mine.reduce((sum, row) => sum + row.kinds[name][key], 0)]));
  return [mode, { kinds: { lone: kind('lone'), big: kind('big'), war: kind('war') }, foodAtEnd: Object.fromEntries([1, 2, 3].map(period => [period, Math.round(mine.reduce((sum, row) => sum + (row.foodAtEnd[period] || 0), 0) / mine.length * 10) / 10])), classes: mine.length, deathsPerClass: mean('deaths'), period1: mean('period1'), period2: mean('period2'), period3: mean('period3'), onRoad: mean('onRoad'), familiesHitPerClass: mean('familiesHit'), familiesHungryPerClass: mean('familiesHungry'), familiesWeakPerClass: mean('familiesWeak'), familiesStarvingPerClass: mean('familiesStarving'), hungryDaysMedian: mean('hungryDaysMedian'), wipedPerClass: mean('wiped'), peoplePerClass: mean('people'), classesWithAnyDeath: mine.filter(row => row.deaths > 0).length, firstDeathDay: Math.min(...mine.map(row => row.firstDay ?? Infinity)) }];
}));
console.log(JSON.stringify(summary, null, 1));
if (out) writeFileSync(out, `${JSON.stringify({ measured: new Date().toISOString().slice(0, 10), families: rows[0]?.families, seeds: [...new Set(rows.map(row => row.seed))], summary, rows }, null, 1)}\n`);
