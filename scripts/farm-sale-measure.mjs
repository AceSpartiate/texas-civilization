// The farm at the end, measured (owner, 2026-09-29, D8; sim/farm-sale.mjs, docs/BALANCE.md §16): how much the sale of an intact
// farm moves a family's final number, and the glory for a burned farm that moves a burned family's by as much.
//
// Reads a record of the balance measure run with the farm counted (scripts/balance-measure.mjs writes each family's `sale`,
// `farmGlory` and `farm`), and works the final numbers again from what each family held, as `--rescore` does: exact, since the
// farm is reckoned after the class and changes nothing anybody did.
//
// Run: node scripts/balance-measure.mjs --sizes 5,15,30 --classes 16,8,4 --workers 10 --out docs/evidence/farm-sale-measure.json
//      node scripts/farm-sale-measure.mjs docs/evidence/farm-sale-measure.json
import { readFileSync } from 'node:fs';
import { finalNumber, keptFor } from '../sim/ending.mjs';

const record = JSON.parse(readFileSync(process.argv[2] || 'docs/evidence/farm-sale-measure.json', 'utf8'));
const rows = record.classes.flatMap(one => one.families.map(family => ({ ...family, seed: one.seed, size: one.size })));
const kept = family => keptFor(family.prisoners.home + family.prisoners.road, family.living);
const final = (coin, glory, family) => finalNumber(coin, glory, family.land, kept(family));
const left = family => family.living - family.prisoners.home - family.prisoners.road > 0;
const median = list => { const s = [...list].sort((a, b) => a - b); return s.length ? s[Math.floor((s.length - 1) / 2)] : null; };
const quantiles = list => { const s = [...list].sort((a, b) => a - b); return [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1].map(p => s[Math.floor(p * (s.length - 1))]); };

const sold = rows.filter(family => family.farm === 'sale');
const burned = rows.filter(family => family.farm === 'burned' && family.farmGlory > 0);
const gloryBefore = family => family.glory - family.farmGlory;
const intactGain = sold.map(family => final(family.coin + family.sale, family.glory, family) - final(family.coin, family.glory, family));
const burnedGain = G => burned.map(family => final(family.coin, gloryBefore(family) + G, family) - final(family.coin, gloryBefore(family), family));
const target = median(intactGain);
let best = 0;
for (let G = 0; G <= 400; G++) if (Math.abs(median(burnedGain(G)) - target) < Math.abs(median(burnedGain(best)) - target)) best = G;
const relative = G => median(burned.map(family => final(family.coin, gloryBefore(family) + G, family) / Math.max(1, final(family.coin, gloryBefore(family), family))));
const intactRelative = median(sold.map(family => final(family.coin + family.sale, family.glory, family) / Math.max(1, final(family.coin, family.glory, family))));
let bestRelative = 0;
for (let G = 0; G <= 400; G++) if (Math.abs(relative(G) - intactRelative) < Math.abs(relative(bestRelative) - intactRelative)) bestRelative = G;

/** Wins by group - a tie shared - with a burned farm counted `G` glory, and the sale counted or not. */
function wins(G, withSale = true) {
  const out = { burned: 0, intact: 0, other: 0 };
  const classes = new Map();
  for (const family of rows) classes.set(family.seed, [...(classes.get(family.seed) || []), family]);
  for (const families of classes.values()) {
    const of = family => family.farm === 'burned' && family.farmGlory > 0 ? final(family.coin, gloryBefore(family) + G, family)
      : family.farm === 'sale' && withSale ? final(family.coin + family.sale, family.glory, family) : final(family.coin, gloryBefore(family), family);
    const contenders = families.filter(left);
    const top = Math.max(...contenders.map(of));
    const first = contenders.filter(family => of(family) === top);
    for (const family of first) out[family.farm === 'burned' ? 'burned' : family.farm === 'sale' ? 'intact' : 'other'] += 1 / first.length;
  }
  return Object.fromEntries(Object.entries(out).map(([key, value]) => [key, Math.round(value * 100) / 100]));
}

console.log(JSON.stringify({
  classes: record.classes.length, families: rows.length, sold: sold.length, burned: burned.length,
  sale: { all: quantiles(sold.map(family => family.sale)), labor: quantiles(sold.filter(family => !family.stock).map(family => family.sale)), league: quantiles(sold.filter(family => family.stock).map(family => family.sale)) },
  intactGain: { quantiles: quantiles(intactGain), median: target, medianRelative: Math.round(intactRelative * 1000) / 1000 },
  compensation: { matchingMedianGain: best, medianBurnedGainAtIt: median(burnedGain(best)), matchingMedianRelativeGain: bestRelative },
  wins: { before: wins(0, false), ...Object.fromEntries([0, 20, 40, 60, 80].map(G => [`after, ${G} glory`, wins(G)])) },
}, null, 1));
