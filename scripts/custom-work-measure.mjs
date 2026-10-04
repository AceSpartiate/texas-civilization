// What men's work and women's work cost a family's building and farming (owner, 2026-10-03, "Custom, necessity opens";
// docs/CUSTOMARY_WORK.md, docs/BALANCE.md §22). Measures only; nothing here changes a rule.
//
// Every family of a class played as the director plays a family nobody plays (sim/neighbours.mjs `thinkFor`, the hunger harness's
// *playing* student), through the first period, on the real land. For each family: the day its house was roofed, the plots it had
// cleared, the food in the house at the end of the period, and its people's days of work by kind - building and felling, the field,
// food (hunts and gathering), the women's own work (keeping house, the garden, the wash) and nothing (no chore). Grouped by shape: both
// parents, a lone mother, a lone father. `--root` runs it against another tree (a checkout of main before the custom), so the same
// harness measures before and after.
//
// Run: node scripts/custom-work-measure.mjs [--seeds a,b] [--families 15] [--root <dir>] [--out file.json]
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const arg = (name, fallback) => { const at = process.argv.indexOf(`--${name}`); return at > 0 ? process.argv[at + 1] : fallback; };
const root = resolve(arg('root', '.'));
const seeds = arg('seeds', 'custom-1,custom-2,custom-3').split(',');
const families = Number(arg('families', '15'));
const out = arg('out', null);
const load = path => import(pathToFileURL(resolve(root, path)).href);
const { createGonzalesWorld } = await load('sim/gonzales.mjs');
const { applyAction, projectWorld, rollFamily, stepWorld } = await load('sim/world.mjs');
const { THINK_EVERY, thinkFor } = await load('sim/neighbours.mjs');
const { houseSettled } = await load('sim/houses.mjs');
const { clearedPlots } = await load('sim/fields.mjs');
const DAY = 1440;
const KIND = {
  build: ['build-house', 'fell-trees', 'fetch-logs', 'haul-logs', 'cut-lane', 'fence-plot', 'fence-yard', 'dig-well', 'clear-plot', 'survey-plot', 'make-carreta', 'make-furniture'],
  field: ['plant-field', 'harvest-field'],
  food: ['hunt-timber', 'hunt-land', 'take-small-game', 'fish-the-water', 'gather-oysters', 'cut-bee-tree', 'butcher-hog', 'butcher-beef', 'milk-cow', 'look-to-stock'],
  house: ['keep-house', 'work-garden', 'wash-clothes', 'nurse-home'],
};
const kindOf = id => (id ? Object.keys(KIND).find(kind => KIND[kind].includes(id)) || 'other' : 'none');

function runClass(seed) {
  const world = createGonzalesWorld(seed, families, { map: 'colonies', neighbours: true });
  for (const household of Object.values(world.households)) { rollFamily(world, household); household.played = true; }
  world.status = 'running';
  const households = Object.values(world.households);
  const shape = household => { const roles = household.members.map(id => world.entities[id]?.kin?.role); return roles.includes('father') && roles.includes('mother') ? 'both' : roles.includes('mother') ? 'mother' : 'father'; };
  const roofed = new Map(), work = new Map(households.map(household => [household.id, { build: 0, field: 0, food: 0, house: 0, other: 0, none: 0, women: { build: 0, field: 0, food: 0, house: 0, other: 0, none: 0 } }]));
  for (let i = 0; i < 12000 && !world.director.complete && world.status === 'running'; i++) {
    stepWorld(world);
    for (const household of households) {
      if (!roofed.has(household.id) && houseSettled(household)) roofed.set(household.id, world.minute / DAY);
      const tally = work.get(household.id);
      for (const id of household.members) {
        const person = world.entities[id];
        if (!person || (person.age ?? 30) < 16 || ['dead', 'captured'].includes(person.health?.condition) || person.service || household.arriving) continue;
        const kind = kindOf(person.chore?.id);
        tally[kind] += 1;
        if (person.sex === 'female' || person.kin?.role === 'mother') tally.women[kind] += 1;
      }
    }
    households.forEach((household, index) => {
      if (household.arriving || (world.tick + index) % THINK_EVERY !== 0) return;
      household.absent = true;
      try { thinkFor(world, household, { project: id => projectWorld(world, id, 'student', { includeMap: false }), act: input => applyAction(world, household.id, input) }); } catch { /* refused */ }
      delete household.absent;
    });
  }
  return households.map(household => {
    const tally = work.get(household.id), all = Object.values(tally).filter(Number.isFinite).reduce((a, b) => a + b, 0) || 1;
    const women = Object.values(tally.women).reduce((a, b) => a + b, 0) || 1;
    return { seed, id: household.id, shape: shape(household), people: household.members.length, roofedDay: roofed.has(household.id) ? Math.round(roofed.get(household.id) * 10) / 10 : null,
      plots: clearedPlots(household).length, food: Math.round((household.resources.food || 0) * 10) / 10, garden: Boolean(household.garden),
      share: Object.fromEntries(['build', 'field', 'food', 'house', 'none'].map(kind => [kind, Math.round(tally[kind] / all * 100)])),
      womenShare: Object.fromEntries(['build', 'field', 'food', 'house', 'none'].map(kind => [kind, Math.round(tally.women[kind] / women * 100)])),
      days: Math.round(world.minute / DAY * 10) / 10 };
  });
}

const median = list => { const sorted = list.filter(Number.isFinite).sort((a, b) => a - b); return sorted.length ? sorted[Math.floor(sorted.length / 2)] : null; };
const rows = seeds.flatMap(seed => { const started = Date.now(); const done = runClass(seed); console.error(`${seed}: ${Math.round((Date.now() - started) / 1000)} s`); return done; });
const summary = {};
for (const shape of ['both', 'mother', 'father', 'all']) {
  const set = rows.filter(row => shape === 'all' || row.shape === shape);
  if (!set.length) continue;
  const share = key => Object.fromEntries(['build', 'field', 'food', 'house', 'none'].map(kind => [kind, median(set.map(row => row[key][kind]))]));
  summary[shape] = { families: set.length, roofed: set.filter(row => row.roofedDay !== null).length, roofedDayMedian: median(set.map(row => row.roofedDay)),
    plotsMedian: median(set.map(row => row.plots)), foodMedian: median(set.map(row => row.food)), gardens: set.filter(row => row.garden).length,
    workShare: share('share'), womenShare: share('womenShare') };
}
const result = { record: 'custom-work-measure', root, seeds, families, date: new Date().toISOString().slice(0, 10), summary, rows };
console.log(JSON.stringify(summary, null, 1));
if (out) writeFileSync(out, `${JSON.stringify(result, null, 1)}\n`);
