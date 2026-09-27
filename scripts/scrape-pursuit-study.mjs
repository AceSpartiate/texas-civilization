// How rare it is to meet Mexican troops on the Scrape (owner, 2026-09-27: "Rare, where columns were"; docs/SCRAPE.md §13).
//
// Plays whole classes of families nobody plays - every family run by sim/neighbours.mjs, as scripts/balance-study.mjs does -
// through all three periods, and counts for every family that fled: whether soldiers saw it and came after it (a chase begun,
// sim/pursuit.mjs), whether they came within hail, whether it was taken, and by whom (a column's infantry or a patrol's
// horsemen). Families nobody plays halt when they are ordered to, so nobody here is fired on; the shots are the tests' and the
// browser proof's. Beside it, what the rule before 2026-09-27 would have done in the same class: the first tick each family
// sat within five miles of a column's head, or moved within a mile and a half (sim/road.mjs before this, `OVERTAKEN_MILES`,
// `CLOSE_MILES`), counted and not applied.
//
// Run: node scripts/scrape-pursuit-study.mjs [classes] [families]   (default 6 15) -> docs/evidence/scrape-pursuit-study.json
import { writeFileSync, mkdirSync } from 'node:fs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { stepWorld, validateWorld } from '../sim/world.mjs';
import { beginSecondPeriod, beginThirdPeriod } from '../sim/periods.mjs';
import { familyPoint, pursuit } from '../sim/road.mjs';
import { ORDER_GRACE_MINUTES } from '../sim/advance.mjs';

const [classes = 6, families = 15] = process.argv.slice(2).map(Number);
const rows = [];
for (let c = 0; c < classes; c++) {
  const seed = `pursuit-${c}`;
  const world = createGonzalesWorld(seed, families, { map: 'colonies', neighbours: true });
  world.status = 'running';
  const run = () => { for (let t = 0; t < 12000 && !world.director.complete && world.status === 'running'; t++) step(); };
  const seen = new Map(), old = new Map();
  function step() {
    stepWorld(world);
    if (world.period !== 3) return;
    for (const household of Object.values(world.households)) {
      const flight = household.flight;
      if (!flight || !['fled', 'refuged'].includes(flight.status)) continue;
      const chase = flight.chase;
      if (chase && !seen.has(chase.id)) seen.set(chase.id, { householdId: household.id, by: chase.by, kind: chase.kind, minute: chase.began });
      if (chase) Object.assign(seen.get(chase.id), { phase: chase.phase, hailed: Boolean(chase.hailed), shots: chase.shotCount });
      // The old rule, asked and not applied.
      if (!old.has(household.id)) {
        const point = familyPoint(world, household), near = point && pursuit(world, point);
        const moving = flight.status === 'fled' && !flight.crossing && !flight.bog;
        const graced = Number.isFinite(flight.orderedMinute) && world.minute < flight.orderedMinute + ORDER_GRACE_MINUTES;
        if (near && !graced && near.miles <= (moving ? 1.5 : 5)) old.set(household.id, { by: near.id, minute: world.minute });
      }
    }
  }
  run();
  beginSecondPeriod(world); world.status = 'running'; run();
  beginThirdPeriod(world); world.status = 'running'; run();
  validateWorld(world);
  const fled = Object.values(world.households).filter(household => household.flight && household.flight.status !== 'ordered' && (household.flight.leftMinute || household.flight.pursued || household.flight.overtaken));
  const chases = [...seen.values()];
  const met = new Set(chases.map(one => one.householdId));
  const hailed = new Set(chases.filter(one => one.hailed).map(one => one.householdId));
  const cavalry = new Set(chases.filter(one => one.kind === 'cavalry').map(one => one.householdId));
  const taken = new Set(chases.filter(one => one.phase === 'caught').map(one => one.householdId));
  const row = { seed, families, fled: fled.length, met: met.size, hailed: hailed.size, cavalry: cavalry.size, taken: taken.size, chases: chases.length, oldRule: old.size, byWatcher: Object.fromEntries([...new Set(chases.map(one => one.by))].map(by => [by, chases.filter(one => one.by === by).length])) };
  rows.push(row);
  console.log(JSON.stringify(row));
}
const sum = key => rows.reduce((total, row) => total + row[key], 0);
const summary = {
  classes, families, fled: sum('fled'), met: sum('met'), hailed: sum('hailed'), cavalry: sum('cavalry'), taken: sum('taken'), oldRule: sum('oldRule'),
  metShare: Math.round(sum('met') / Math.max(1, sum('fled')) * 1000) / 1000,
  hailedShare: Math.round(sum('hailed') / Math.max(1, sum('fled')) * 1000) / 1000,
  cavalryShare: Math.round(sum('cavalry') / Math.max(1, sum('fled')) * 1000) / 1000,
  oldRuleShare: Math.round(sum('oldRule') / Math.max(1, sum('fled')) * 1000) / 1000,
};
console.log(JSON.stringify(summary));
mkdirSync(new URL('../docs/evidence/', import.meta.url), { recursive: true });
writeFileSync(new URL('../docs/evidence/scrape-pursuit-study.json', import.meta.url), `${JSON.stringify({ measured: new Date().toISOString().slice(0, 10), summary, rows }, null, 2)}\n`);
