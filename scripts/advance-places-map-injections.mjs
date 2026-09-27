// The map-building regressions the advance's places guard, injected one at a time into scripts/build-colonies-map.mjs (CLAUDE.md:
// "A new test is not evidence until it has failed"): the map is rebuilt with the mistake, tests/advance-places.test.mjs is run,
// and the named test - and no other in the file - must fail; then the script and the built map are put back byte for byte.
// Separate from scripts/mexican-advance-injections.mjs because each needs a rebuild of the map (about ten seconds).
//
// Run: node scripts/advance-places-map-injections.mjs  -> merges into docs/evidence/mexican-advance-injections.json (`map`)
import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const SCRIPT = 'scripts/build-colonies-map.mjs', MAP = 'public/terrain/colonies-map.json.gz', T = 'tests/advance-places.test.mjs';
const MARKERS = 'the five are places of the map at their markers, with the roads the columns went by and Thompson\'s ferry over the Brazos';
const INJECTIONS = [
  { name: 'the road from San Felipe laid by the easiest ground, over the Brazos and down its left bank',
    from: "  ['san-felipe', 'thompsons', 'The road down the Brazos', [{ name: 'the right bank of the Brazos', x: 94, y: -9 }]],", to: "  ['san-felipe', 'thompsons', 'The road down the Brazos'],", expect: MARKERS },
  { name: 'Stafford\'s at the research\'s estimate, not its marker',
    from: "  ['staffords', \"Stafford's\", 'farmstead', -95.583099, 29.623819, 'HIST-TEX-587', false],", to: "  ['staffords', \"Stafford's\", 'farmstead', -95.555, 29.616, 'HIST-TEX-587', false],", expect: MARKERS },
  { name: 'no road to the Old Fort',
    from: "  ['thompsons', 'old-fort', 'The road down the Brazos'],\n", to: '', expect: MARKERS },
];
const CR = '\r', LF = '\n';
const build = () => { const r = spawnSync(process.execPath, [SCRIPT], { encoding: 'utf8', maxBuffer: 1 << 26 }); if (r.status !== 0) throw new Error(`the map did not build: ${(r.stdout + r.stderr).slice(-400)}`); };
function runUnit() {
  const result = spawnSync(process.execPath, ['--test', T], { encoding: 'utf8', maxBuffer: 1 << 26 });
  const output = `${result.stdout}${result.stderr}`;
  const failed = [...new Set([...(output.split('✖ failing tests:')[1] || '').matchAll(/^✖ (.+?) \(\d[\d.]*m?s\)\s*$/gm)].map(m => m[1]))];
  if (result.status !== 0 && !failed.length) failed.push(`exit ${result.status}: ${output.slice(-300)}`);
  return { passed: result.status === 0, failed };
}
const script = readFileSync(SCRIPT, 'utf8'), map = readFileSync(MAP);
if (!runUnit().passed) throw new Error(`${T} fails before any injection`);
const results = [];
try {
  for (const injection of INJECTIONS) {
    const ends = text => (script.includes(CR + LF) ? text.split(LF).join(CR + LF) : text);
    const from = ends(injection.from), to = ends(injection.to);
    if (script.split(from).length !== 2) throw new Error(`${injection.name}: not found exactly once`);
    writeFileSync(SCRIPT, script.replace(from, () => to));
    try { build(); const seen = runUnit(); const caught = !seen.passed && seen.failed.length === 1 && seen.failed[0] === injection.expect;
      results.push({ name: injection.name, file: SCRIPT, test: T, expect: injection.expect, caught, failed: seen.failed });
      console.log(`${caught ? 'caught' : seen.passed ? 'MISSED' : 'CAUGHT BY ANOTHER OR MORE THAN ONE'}: ${injection.name} -> ${seen.failed.join(' | ') || 'every test passed'}`);
    } finally { writeFileSync(SCRIPT, script); writeFileSync(MAP, map); }
  }
} finally { writeFileSync(SCRIPT, script); writeFileSync(MAP, map); }
if (!runUnit().passed) throw new Error(`${T} fails after everything was put back`);
const path = 'docs/evidence/mexican-advance-injections.json';
const evidence = JSON.parse(readFileSync(path, 'utf8'));
evidence.map = results;
evidence.gates.map = `node scripts/advance-places-map-injections.mjs: the map rebuilt with each mistake, node --test ${T}, the named test and no other`;
writeFileSync(path, `${JSON.stringify(evidence, null, 2)}\n`.replace(/\n/g, '\r\n'));
console.log(`\n${results.filter(one => one.caught).length} of ${results.length} caught. Wrote ${path}`);
