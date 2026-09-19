// The places, crossings and roads of the settled colonies, built over the real terrain by
// scripts/build-colonies-map.mjs (docs/COLONIES.md §5.2). Loaded once per process and shared:
// every class uses the same places and roads.
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';

let loaded = null;
export function coloniesMap() {
  if (!loaded) loaded = JSON.parse(gunzipSync(readFileSync(new URL('../public/terrain/colonies-map.json.gz', import.meta.url))).toString('utf8'));
  return loaded;
}

/** The rivers a road may cross only at a crossing (the build script's barriers). */
export const BARRIER_RIVERS = Object.freeze(['Guadalupe River', 'Colorado River', 'Brazos River', 'Trinity River', 'San Antonio River']);

/**
 * How a road gets over water (docs/MAP_ACCURACY.md §10, 2026-09-19): a place of one of these kinds is a crossing. `crossing` is
 * the kind a class saved before then carries for the three named crossings of the big rivers.
 */
export const CROSSING_KINDS = Object.freeze(['ford', 'ferry', 'bridge']);
export const isCrossing = site => CROSSING_KINDS.includes(site?.kind) || site?.kind === 'crossing';
/**
 * A crossing the word and the fleeing families stop at: the Colorado crossing at La Grange, Beeson's and the Atascosito
 * crossing. They were `crossing` places until 2026-09-19 and are now a ferry each, marked `stage` so what stopped there still
 * does - and a class saved before, whose places are still `crossing`, is read the same.
 */
export const isStage = site => site?.kind === 'crossing' || site?.stage === true;

/** The colony settlements families can start near (docs/COLONIES.md §5.1). */
export const startsOf = map => Object.values(map.places).filter(place => place.start);

/**
 * How many people each start's municipality had in 1834 (Almonte, `HIST-TEX-011`; Liberty `HIST-TEX-013`), the weights
 * families are dealt by. Whole municipalities, not towns.
 */
export const START_WEIGHTS = Object.freeze({ 'san-felipe': 2500, columbia: 2100, matagorda: 1400, mina: 1100, liberty: 1000, gonzales: 900, victoria: 300 });
/** Seated before dealing: Gonzales, where the story opens (owner), and Liberty (owner, 2026-09-14). */
export const SEATED = Object.freeze(['gonzales', 'liberty']);

/**
 * How many of a class's families start near each settlement: one at each seat, then the rest in proportion to
 * the weights by largest remainder, ties to the larger settlement (docs/COLONIES.md §5.1).
 */
export function dealCounts(families) {
  const ids = Object.keys(START_WEIGHTS);
  const counts = Object.fromEntries(ids.map(id => [id, 0]));
  for (const id of SEATED.slice(0, families)) counts[id]++;
  const rest = families - Object.values(counts).reduce((a, b) => a + b, 0);
  const total = ids.reduce((sum, id) => sum + START_WEIGHTS[id], 0);
  const shares = ids.map(id => ({ id, exact: START_WEIGHTS[id] / total * rest }));
  for (const share of shares) counts[share.id] += Math.floor(share.exact);
  let left = families - Object.values(counts).reduce((a, b) => a + b, 0);
  for (const share of [...shares].sort((a, b) => (b.exact % 1) - (a.exact % 1) || START_WEIGHTS[b.id] - START_WEIGHTS[a.id])) {
    if (left-- <= 0) break;
    counts[share.id]++;
  }
  return counts;
}
