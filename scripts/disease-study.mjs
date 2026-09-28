// The disease study (docs/DISEASE.md build step 8; the owner's bound of 2026-09-27: "about 3 in 100 over the whole flight for
// all diseases together", mostly babies and small children): classes of families nobody plays, fifteen a class, each family
// rolled as a student's is in the lobby (sim/family.mjs `rollFamily`, so there are babies and children in it), on the colonies,
// through the three class periods, reporting who fell sick of what, who turned very sick, and who died, by age and by disease -
// for families as the director plays them (`careful`: nursing whoever is sick, resting a day for the very sick unless the army
// is close behind, never sending the sick to work) and for families that never nurse or rest (`careless`: the three chores taken
// out of what the director is offered). The owner's figure is read against a **mixed** class: half its families careful and half
// careless, the halves swapped from one spring to the next so every family is measured both ways - "still weighted to the small
// and the uncared-for", the owner's own words for the option chosen (docs/DISEASE.md §7). The modes `auto` (every family
// careful) and `careless` (none) remain for a look at either end alone.
//
// The first two periods are played once a class and kept (in `--snapshots`, when given); the spring is then played again from
// the same winter under several seeds (`world.seed` changed at the spring's opening, so the road's dice fall differently and the
// winter behind it is the same). That is what lets a study of many flights run in the time a class takes. The first two periods'
// own sickness - the ague of the autumn on the river bottoms and its winter relapses, the siege's flux - is reported from the
// once-played periods.
//
// Run: node scripts/disease-study.mjs <classes> <springs> [modes=mixed] [--snapshots dir] [--first n] [--out file]
//   → docs/evidence/disease-study.json (or --out), with `rates`: the numbers it was measured against (sim/disease.mjs
//   `studiedRates`), which tests/disease.test.mjs compares with the module so the evidence cannot go stale silently.
// Several run side by side (each its own `--first` and `--out`) are put together with: node scripts/disease-study.mjs --merge a.json,b.json
//   → docs/evidence/disease-study.json.
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { rollFamily, stepWorld } from '../sim/world.mjs';
import { beginSecondPeriod, beginThirdPeriod } from '../sim/periods.mjs';
import { CHORES } from '../sim/chores.mjs';
import { studiedRates } from '../sim/disease.mjs';

const args = process.argv.slice(2);
const flag = name => { const at = args.indexOf(name); if (at < 0) return null; const value = args[at + 1]; args.splice(at, 2); return value; };
const snapshots = flag('--snapshots'), first = Number(flag('--first') || 0), outFile = flag('--out') || 'docs/evidence/disease-study.json', merge = flag('--merge');
const classes = Number(args[0] || 4), springs = Number(args[1] || 4);
const modes = (args[2] || 'mixed').split(',');
const FAMILIES = 15;
const band = age => (!Number.isFinite(age) ? '16+' : age < 2 ? '0-1' : age < 6 ? '2-5' : age < 16 ? '6-15' : '16+');
const BANDS = ['0-1', '2-5', '6-15', '16+'];
const people = world => Object.values(world.entities).filter(one => one.kind === 'person' && one.householdId);

/** Every sickness begun, turned very sick and ended in death from here on, read off the record by the stage each line carries. */
function watch(world) {
  const from = world.events.length;
  return () => {
    const fell = [], grave = [], died = [];
    for (const event of world.events.slice(from)) {
      const person = world.entities[event.actorId];
      if (!person?.householdId || !event.sickness) continue;
      const one = { id: person.id, disease: event.disease || 'sickness', age: person.age };
      if (event.sickness === 'fell') fell.push(one);
      else if (event.sickness === 'grave') grave.push(one);
      else if (event.sickness === 'died') died.push(one);
    }
    return { fell, grave, died };
  };
}

function summarise(population, seen) {
  const byBand = Object.fromEntries(BANDS.map(key => [key, { people: 0, fell: 0, grave: 0, died: 0 }]));
  for (const person of population) byBand[band(person.age)].people++;
  for (const stage of ['fell', 'grave', 'died']) for (const one of seen[stage]) byBand[band(one.age)][stage]++;
  const byDisease = {};
  for (const stage of ['fell', 'grave', 'died']) for (const one of seen[stage]) { byDisease[one.disease] ??= { fell: 0, grave: 0, died: 0 }; byDisease[one.disease][stage]++; }
  return { people: population.length, fell: seen.fell.length, grave: seen.grave.length, died: seen.died.length, perHundred: Math.round(seen.died.length / Math.max(1, population.length) * 10000) / 100, byBand, byDisease };
}

const run = (world, limit = 14000) => { for (let tick = 0; tick < limit && !world.director.complete && world.status === 'running'; tick++) stepWorld(world); };
const kept = Object.fromEntries(['tend-sick', 'rest-road', 'nurse-home'].map(id => [id, CHORES[id]?.offered]));
/**
 * `careless` takes the three chores away from every family; `mixed` from every other family of the class (the ones marked
 * `careless` in the study's own copy of the world, never in a class): a class where half the families see to their sick and
 * half do not, which is the class the owner's "about three in a hundred over the whole flight" is read against.
 */
const setMode = mode => {
  for (const [id, offered] of Object.entries(kept)) {
    if (!CHORES[id]) continue;
    const own = offered || (() => true);
    CHORES[id].offered = mode === 'careless' ? () => false : mode === 'mixed' ? (world, household, entity) => !household.studyCareless && own(world, household, entity) : own;
  }
};

/** The class played through its autumn and winter, or read back from where it was kept. */
function winterOf(seed) {
  const file = snapshots && `${snapshots}/${seed}.json`;
  if (file && existsSync(file)) return JSON.parse(readFileSync(file, 'utf8'));
  setMode('auto');
  const world = createGonzalesWorld(seed, FAMILIES, { map: 'colonies', neighbours: true });
  for (const household of Object.values(world.households)) rollFamily(world, household);
  world.status = 'running';
  const autumn = watch(world);
  run(world);
  const autumnSummary = summarise(people(world), autumn());
  beginSecondPeriod(world); world.status = 'running';
  const winter = watch(world);
  run(world);
  const kept = { world: JSON.stringify(world), autumn: autumnSummary, winter: summarise(people(world), winter()) };
  if (file) { mkdirSync(snapshots, { recursive: true }); writeFileSync(file, JSON.stringify(kept)); }
  return kept;
}

const out = { record: 'disease-study', date: new Date().toISOString().slice(0, 10), families: FAMILIES, classes, springs, modes, rates: studiedRates(), autumnWinter: [], spring: {} };
if (merge) {
  // Parts run side by side, put together: they must have been measured against the same rates, and these must be the module's.
  const parts = merge.split(',').map(file => JSON.parse(readFileSync(file, 'utf8')));
  for (const part of parts) if (JSON.stringify(part.rates) !== JSON.stringify(out.rates)) throw new Error('A part was measured against other rates than the module has now.');
  Object.assign(out, { classes: parts.reduce((total, part) => total + part.classes, 0), springs: parts[0].springs, modes: parts[0].modes, parts: parts.map(part => ({ date: part.date, seeds: part.autumnWinter.map(one => one.seed) })) });
  out.autumnWinter = parts.flatMap(part => part.autumnWinter);
  for (const part of parts) for (const [mode, runs] of Object.entries(part.spring)) (out.spring[mode] ??= []).push(...runs);
}
for (let c = first; !merge && c < first + classes; c++) {
  const seed = `disease-${String.fromCharCode(97 + c)}`;
  const kept = winterOf(seed);
  out.autumnWinter.push({ seed, autumn: kept.autumn, winter: kept.winter });
  console.error(seed, 'autumn and winter ready');
  for (const mode of modes) {
    setMode(mode);
    for (let s = 0; s < springs; s++) {
      const spring = JSON.parse(kept.world);
      if (s) spring.seed = `${spring.seed}~${s}`;
      if (mode === 'mixed') Object.values(spring.households).forEach((household, i) => { if ((i + s) % 2) household.studyCareless = true; });
      beginThirdPeriod(spring); spring.status = 'running';
      const population = people(spring).filter(one => !['dead', 'captured'].includes(one.health?.condition));
      const seen = watch(spring);
      run(spring);
      const seenNow = seen();
      const result = summarise(population, seenNow);
      // In a mixed class, the careful half and the careless half apart as well as together.
      if (mode === 'mixed') {
        const careless = person => Boolean(spring.households[person.householdId]?.studyCareless);
        const died = new Set(seenNow.died.map(one => one.id));
        result.groups = Object.fromEntries(['careful', 'careless'].map(group => {
          const members = population.filter(person => careless(person) === (group === 'careless'));
          const dead = members.filter(person => died.has(person.id));
          return [group, { people: members.length, died: dead.length, diedUnderSix: dead.filter(person => Number.isFinite(person.age) && person.age < 6).length }];
        }));
      }
      (out.spring[mode] ??= []).push({ seed: spring.seed, ...result });
      console.error(seed, mode, s, `${result.died} of ${result.people} died (${result.perHundred} in 100); ${result.fell} fell sick, ${result.grave} very sick`);
    }
  }
}
/** Several runs pooled: the whole-flight figure the owner's bound is read against. */
export function pool(runs) {
  const sum = key => runs.reduce((total, one) => total + one[key], 0);
  const byBand = Object.fromEntries(BANDS.map(key => [key, runs.reduce((total, one) => ({ people: total.people + one.byBand[key].people, fell: total.fell + one.byBand[key].fell, grave: total.grave + (one.byBand[key].grave || 0), died: total.died + one.byBand[key].died }), { people: 0, fell: 0, grave: 0, died: 0 })]));
  const byDisease = {};
  for (const one of runs) for (const [key, value] of Object.entries(one.byDisease)) { byDisease[key] ??= { fell: 0, grave: 0, died: 0 }; for (const stage of ['fell', 'grave', 'died']) byDisease[key][stage] += value[stage] || 0; }
  const groups = runs.some(one => one.groups) ? Object.fromEntries(['careful', 'careless'].map(group => {
    const people = runs.reduce((total, one) => total + (one.groups?.[group].people || 0), 0), died = runs.reduce((total, one) => total + (one.groups?.[group].died || 0), 0);
    const diedUnderSix = runs.reduce((total, one) => total + (one.groups?.[group].diedUnderSix || 0), 0);
    return [group, { people, died, diedUnderSix, perHundred: Math.round(died / Math.max(1, people) * 10000) / 100 }];
  })) : null;
  return { flights: runs.length, people: sum('people'), fell: sum('fell'), grave: sum('grave'), died: sum('died'), perHundred: Math.round(sum('died') / Math.max(1, sum('people')) * 10000) / 100, byBand, byDisease, ...(groups && { groups }) };
}
out.pooled = Object.fromEntries(Object.entries(out.spring).map(([mode, runs]) => [mode, pool(runs)]));
mkdirSync('docs/evidence', { recursive: true });
writeFileSync(outFile, `${JSON.stringify(out, null, 2)}\n`);
console.log(JSON.stringify({ pooled: Object.fromEntries(Object.entries(out.pooled).map(([mode, one]) => [mode, { people: one.people, fell: one.fell, grave: one.grave, died: one.died, perHundred: one.perHundred, byBand: one.byBand, byDisease: one.byDisease, ...(one.groups && { groups: one.groups }) }])) }));
console.log(JSON.stringify(out.autumnWinter.map(one => ({ seed: one.seed, autumn: { fell: one.autumn.fell, died: one.autumn.died, byDisease: one.autumn.byDisease }, winter: { fell: one.winter.fell, died: one.winter.died, byDisease: one.winter.byDisease } }))));
