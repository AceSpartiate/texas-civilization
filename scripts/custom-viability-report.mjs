// The custom-viability record read out by shape (docs/BALANCE.md §23): before the custom, now, and now with a student who never
// finds Keep house, the wash or the garden. Reads what scripts/custom-viability.mjs --study wrote; runs nothing.
//
// Run: node scripts/custom-viability-report.mjs [docs/evidence/custom-viability.json] [--out docs/evidence/custom-viability-summary.json]
import { readFileSync, writeFileSync } from 'node:fs';

const file = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'docs/evidence/custom-viability.json';
const out = process.argv.includes('--out') ? process.argv[process.argv.indexOf('--out') + 1] : null;
const record = JSON.parse(readFileSync(file, 'utf8'));
const COLUMNS = [['before', 'playing'], ['now', 'playing'], ['now', 'nohouse'], ['now', 'cued']];
const median = list => { const sorted = list.filter(Number.isFinite).sort((a, b) => a - b); if (!sorted.length) return null; const mid = sorted.length / 2; return sorted.length % 2 ? sorted[Math.floor(mid)] : (sorted[mid - 1] + sorted[mid]) / 2; };
const mean = list => (list.length ? list.reduce((a, b) => a + b, 0) / list.length : null);
const r1 = value => (value === null || value === undefined ? null : Math.round(value * 10) / 10);
const r2 = value => (value === null || value === undefined ? null : Math.round(value * 100) / 100);

const shapes = [...new Set(record.runs.flatMap(run => run.families.map(family => family.shape)))];
const order = [...Object.keys(record.shapes), 'rolledBoth', 'rolledMother', 'rolledFather'].filter(shape => shapes.includes(shape));
const share = (time, group) => { const t = time?.[group]; if (!t) return null; const all = t.mens + t.womens + t.shared + t.none; return all ? t.none / all : null; };

function summarise(families) {
  const n = families.length;
  const roofed = families.filter(f => f.roofedDay !== null);
  const deaths = families.flatMap(f => f.deaths);
  const byCause = cause => deaths.filter(d => d.cause === cause).length;
  const sum = key => families.reduce((total, f) => total + (f[key] || 0), 0);
  const per = (period, pick) => mean(families.map(f => (f.per?.[period] ? pick(f.per[period]) : 0)));
  return {
    families: n,
    roofed: roofed.length, roofedDayMedian: r1(median(roofed.map(f => f.roofedDay))),
    cleared: [1, 2, 3].map(p => median(families.map(f => f.plots?.[p]))), sownP1: median(families.map(f => f.sown?.[1])),
    harvestsMean: r1(mean(families.map(f => f.harvests))), harvestFoodMedian: median(families.map(f => f.harvestFood)), cottonMedian: r1(median(families.map(f => f.harvestCotton))),
    food: [1, 2, 3].map(p => r1(median(families.map(f => f.food?.[p])))),
    hungry: families.filter(f => f.worst >= 1).length, weak: families.filter(f => f.worst >= 2).length, starving: families.filter(f => f.worst >= 3).length,
    hungryDaysMean: r1(mean(families.map(f => f.hungryDays))),
    deaths: deaths.length, hunger: byCause('hunger'), disease: byCause('disease'), war: byCause('war'), other: byCause('other'),
    hungerDeathsAtHome: deaths.filter(d => d.cause === 'hunger' && d.period < 3).length,
    coinMedian: r1(median(families.map(f => f.coin))), finalMedian: median(families.map(f => f.final)), rankMedian: median(families.map(f => f.rank)), winners: families.filter(f => f.winner).length, wiped: families.filter(f => f.wiped).length,
    townArrivals: sum('townArrivals'), dirtyArrivals: sum('dirtyArrivals'), remarks: sum('remarks'),
    markupReales: r1(0.25 * (sum('dirtyCoinOut') + sum('dirtyCoinIn'))), coinTradedDirty: r1(sum('dirtyCoinOut') + sum('dirtyCoinIn')),
    dirtyShareMedian: median(families.map(f => f.dirtyShare)), washesMean: r1(mean(families.map(f => f.washes))), keptDaysMean: r1(mean(families.map(f => f.keptDays))), gardenDaysMean: r1(mean(families.map(f => f.gardenDays))),
    homeDaysMean: r1(mean(families.map(f => f.homeDays))),
    keptByChildMean: r1(mean(families.map(f => f.keptByChild || 0))), helpsMean: r1(mean(families.map(f => f.helps || 0))), washesForMean: r1(mean(families.map(f => f.washesFor || 0))),
    stuckFamilyDays: r2(mean(families.map(f => f.stuckFamily))), hiddenAllDays: r2(mean(families.map(f => f.hiddenAll))), queuedBehindOneDays: r2(mean(families.map(f => f.queuedBehindOne))),
    stuckFamilyShare: r2(mean(families.map(f => (f.homeDays ? f.stuckFamily / f.homeDays : 0)))),
    stuckPersonDays: Object.fromEntries(['men', 'women', 'boys', 'girls'].map(g => [g, r2(mean(families.map(f => f.stuckPerson?.[g] || 0)))])),
    stuckBy: Object.fromEntries(['build', 'ground', 'hunt', 'house'].map(k => [k, r2(mean(families.map(f => f.stuckBy?.[k] || 0)))])),
    hiddenBy: Object.fromEntries(['build', 'ground', 'hunt', 'house'].map(k => [k, r2(mean(families.map(f => f.hiddenBy?.[k] || 0)))])),
    idleShare: Object.fromEntries(['men', 'women', 'boys', 'girls'].map(g => [g, r2(median(families.map(f => share(f.time, g))))])),
    workShare: Object.fromEntries(['men', 'women', 'boys', 'girls'].map(g => [g, (() => { const t = families.map(f => f.time?.[g]).filter(Boolean); const tot = k => t.reduce((a, x) => a + x[k], 0); const all = tot('mens') + tot('womens') + tot('shared') + tot('none'); return all ? Object.fromEntries(['mens', 'womens', 'shared', 'none'].map(k => [k, Math.round(tot(k) / all * 100)])) : null; })()])),
    byPeriod: Object.fromEntries([1, 2, 3].map(p => [p, { stuckFamilyDays: r2(per(p, one => one.stuckFamily)), hiddenAllDays: r2(per(p, one => one.hiddenAll)), homeDays: r2(per(p, one => one.home)),
      womenIdle: r2(median(families.map(f => share(f.per?.[p]?.time, 'women')))), womenMens: r2(median(families.map(f => { const t = f.per?.[p]?.time?.women; const all = t && t.mens + t.womens + t.shared + t.none; return all ? t.mens / all : null; }))) }])),
    enlisted: families.filter(f => f.enlisted?.length).length, enlistDayMedian: median(families.map(f => f.enlistDay)), sonHomeDaysMean: r1(mean(families.map(f => f.sonAtHomeWhileFatherAway || 0))),
  };
}

const summary = {};
for (const shape of [...order, 'all']) {
  summary[shape] = {};
  for (const [tree, mode] of COLUMNS) {
    const families = record.runs.filter(run => run.tree === tree && run.mode === mode).flatMap(run => run.families).filter(f => shape === 'all' || f.shape === shape);
    if (families.length) summary[shape][`${tree}-${mode}`] = summarise(families);
  }
}
const classes = Object.fromEntries(COLUMNS.map(([tree, mode]) => [`${tree}-${mode}`, record.runs.filter(run => run.tree === tree && run.mode === mode).map(run => ({ seed: run.seed, days: run.days, seconds: run.seconds }))]));
console.log(JSON.stringify(summary, null, 1));
if (out) writeFileSync(out, `${JSON.stringify({ record: 'custom-viability-summary', from: file, measured: record.measured, classes, summary }, null, 1)}\n`);
