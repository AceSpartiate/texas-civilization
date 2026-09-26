// How long the server takes to load the land and deal a class, and what the map sent to a page weighs: the before and after
// of the south strip (docs/MAP_ACCURACY.md §13). Same computer only; timings move between runs, the bytes do not.
//
// Run: node scripts/south-startup-measure.mjs [--label name]. Writes docs/evidence/south-startup-<label>.json.
import { gzipSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';

const label = process.argv.includes('--label') ? process.argv[process.argv.indexOf('--label') + 1] : 'run';
const t0 = performance.now();
const { realTerrain } = await import('../sim/terrain-data.mjs');
const { gridStandAt } = await import('../sim/woods.mjs');
const { coloniesMap } = await import('../sim/colonies-map.mjs');
const { createGonzalesWorld } = await import('../sim/gonzales.mjs');
const { projectMap } = await import('../sim/world.mjs');
const t1 = performance.now();
realTerrain(); gridStandAt({ x: 0, y: 0 }); coloniesMap();
const t2 = performance.now();
const world = createGonzalesWorld('south-measure', 15, { map: 'colonies' });
const t3 = performance.now();
const map = JSON.stringify(projectMap(world));
const out = {
  label, importMs: Math.round(t1 - t0), landLoadMs: Math.round(t2 - t1), dealMs: Math.round(t3 - t2),
  heapMB: Math.round(process.memoryUsage().heapUsed / 1e6), rssMB: Math.round(process.memoryUsage().rss / 1e6),
  apiMapBytes: map.length, apiMapGzip: gzipSync(map).length, sites: Object.keys(world.map.sites).length, routes: Object.keys(world.map.routes).length,
};
console.log(JSON.stringify(out));
writeFileSync(`docs/evidence/south-startup-${label}.json`, `${JSON.stringify(out, null, 2)}\n`);
