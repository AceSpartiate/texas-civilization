// What the herd sold with the farm does to the ending (owner, 2026-10-03; sim/farm-sale.mjs `HERD_WITH_FARM`, docs/BALANCE.md §21).
// Measures only. Reads a record written by scripts/balance-measure.mjs (which keeps each family's `herdSold`, the herd's line of
// its farm's sale) and scores the same classes without that line: coin, glory, land and prisoners are what they were, so the second
// scoring is exact, not a guess at another class.
//
// Run: node scripts/herds-ending-measure.mjs [--in docs/evidence/herds-ending-measure.json]
import { readFileSync } from 'node:fs';
import { finalNumber, keptFor, PRISONER_WEIGHT } from '../sim/ending.mjs';

const arg = (name, fallback) => { const at = process.argv.indexOf(`--${name}`); return at > 0 ? process.argv[at + 1] : fallback; };
const record = JSON.parse(readFileSync(arg('in', 'docs/evidence/herds-ending-measure.json'), 'utf8'));
const classes = record.classes || record.raw || [];
if (!classes.length) throw new Error('No classes in the record');
const median = list => { const sorted = [...list].sort((a, b) => a - b); return sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0; };
const mean = list => (list.length ? list.reduce((sum, value) => sum + value, 0) / list.length : 0);
const finalOf = (family, herd) => finalNumber(family.coin + (family.sale ?? 0) - (herd ? 0 : family.herdSold ?? 0), family.glory, family.land, keptFor(family.prisoners.home + family.prisoners.road, family.living, PRISONER_WEIGHT));

let winnersChanged = 0, herdWinners = 0, stockWins = { with: 0, without: 0 };
const herdLines = [], gains = [], sellers = [];
for (const one of classes) {
  const score = herd => {
    const families = one.families.map(family => ({ ...family, final: finalOf(family, herd) }));
    const best = Math.max(...families.map(family => family.final));
    return { families, winners: families.filter(family => family.final === best).map(family => family.id) };
  };
  const withHerd = score(true), without = score(false);
  if (withHerd.winners.join() !== without.winners.join()) winnersChanged++;
  for (const family of one.families) {
    if ((family.herdSold ?? 0) > 0) { herdLines.push(family.herdSold); gains.push(finalOf(family, true) - finalOf(family, false)); }
  }
  for (const id of withHerd.winners) if ((one.families.find(family => family.id === id)?.herdSold ?? 0) > 0) stockWins.with++;
  for (const id of without.winners) if ((one.families.find(family => family.id === id)?.herdSold ?? 0) > 0) stockWins.without++;
  herdWinners += withHerd.winners.length;
}
const families = classes.flatMap(one => one.families);
console.log(JSON.stringify({
  classes: classes.length, families: families.length,
  familiesWithAHerdSold: herdLines.length,
  herdLine: { median: median(herdLines), mean: Math.round(mean(herdLines) * 10) / 10, min: Math.min(...herdLines), max: Math.max(...herdLines) },
  finalNumberGain: { median: median(gains), mean: Math.round(mean(gains)), max: Math.max(...gains) },
  saleMedian: { all: median(families.filter(family => family.sale > 0).map(family => family.sale)) },
  classesWhoseWinnerChanged: winnersChanged,
  winnersWithAHerdSold: stockWins,
  winners: herdWinners,
}, null, 1));
