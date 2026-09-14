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

/** The colony settlements families can start near (docs/COLONIES.md §5.1). */
export const startsOf = map => Object.values(map.places).filter(place => place.start);
