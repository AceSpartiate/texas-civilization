// Injects each regression the country outside the box's tests guard (tests/map-outside.test.mjs), runs the map's test files,
// and restores everything, checking the restore byte for byte. Writes docs/evidence/map-outside-injections.json.
//
//   node --max-old-space-size=8192 docs/evidence/map-outside/injections.mjs <raw-dir> [case]
//
// <raw-dir> is the outside layer's raw data (docs/evidence/outside-data.json), for the cases that rebuild it.
import { copyFileSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { gunzipSync, gzipSync } from 'node:zlib';

const raw = process.argv[2];
if (!raw) { console.error('usage: node docs/evidence/map-outside/injections.mjs <raw-dir> [case]'); process.exit(2); }
const TESTS = 'tests/map-outside.test.mjs tests/geography-truth.test.mjs tests/land.test.mjs tests/map-base.test.mjs tests/woods.test.mjs tests/woods-view.test.mjs';
const REBUILD = [`node --max-old-space-size=8192 scripts/build-outside.mjs "${raw}"`];
const OUTSIDE_FILES = ['public/terrain/outside-province.json.gz', 'public/terrain/outside-land.json.gz', 'public/terrain/outside-woods.json.gz', 'public/terrain/outside-woods.bin.gz'];
const LOAD = "if (!outside) outside = JSON.parse(gunzipSync(readFileSync(OUTSIDE_FILE)).toString('utf8'));";
const cases = [
  { name: 'a box file written again with the same content (colonies-woods.json.gz gzipped at level 6)', expect: ["the box's own files are byte for byte"],
    files: ['public/terrain/colonies-woods.json.gz'],
    prepare: () => { const file = 'public/terrain/colonies-woods.json.gz'; writeFileSync(file, gzipSync(gunzipSync(readFileSync(file)), { level: 6 })); } },
  { name: 'the page sent the box\'s bounds, so the camera stops at the box', expect: ['the map reaches the Sabine', 'the page is sent the real province'],
    note: 'tests/geography-truth.test.mjs holds the page\'s bounds too',
    edits: [['sim/province.mjs', 'return { ...map, province, bounds: mapBounds() };', 'return { ...map, province, bounds: province.bounds };']] },
  { name: 'a point of the Rio Grande\'s one-mile band moved two miles off the finer band', expect: ['every band of the outside layer nests'],
    edits: [['sim/province.mjs', LOAD, `${LOAD}\n  if (!outside.__injected) { outside.__injected = true; const river = outside.rivers.find(r => r.name === 'Rio Grande' && r.levels[2] && r.levels[2].length > 20); river.levels[2][10] += 200; }`]] },
  { name: 'pieces outside the box cut at its edge instead of carried one point across it; rebuilt', expect: ["the rivers that cross the box's edge meet"],
    edits: [['scripts/build-outside.mjs', 'if (!current) { current = []; if (i > 0) current.push(points[i - 1]); }', 'if (!current) { current = []; }'],
      ['scripts/build-outside.mjs', '} else if (current) { current.push(p); out.push(current); current = null; }', '} else if (current) { out.push(current); current = null; }']],
    rebuild: REBUILD, files: OUTSIDE_FILES },
  { name: 'the Rio Grande drawn two miles west of itself', expect: ['the Rio Grande, the Nueces and the Sabine are where they are'],
    edits: [['sim/province.mjs', LOAD, `${LOAD}\n  if (!outside.__injected) { outside.__injected = true; for (const river of outside.rivers) if (river.name === 'Rio Grande') river.levels = river.levels.map(flat => flat && flat.map((v, i) => i % 2 === 0 ? v - 200 : v)); }`]] },
  { name: 'the shape the page is sent (/api/map) leaves out the rivers outside the box', expect: ['the Rio Grande, the Nueces and the Sabine are where they are'],
    edits: [['sim/province.mjs', '      ...outsideBands().rivers.filter(river => river.levels[CLASSIC_LINE_BAND])', '      ...[].filter(river => river.levels[CLASSIC_LINE_BAND])']] },
  { name: 'Mexico left undrawn, a hole south of the Rio Grande; rebuilt', expect: ['Mexico is country'],
    edits: [['scripts/build-outside.mjs', "if (mexico[i]) { land[i] = code('brush'); stands[i] = BRUSH; continue; }", 'if (mexico[i]) { land[i] = NONE; continue; }']],
    rebuild: REBUILD, files: OUTSIDE_FILES },
  { name: 'the outside layer drawing the box\'s whole interior over the box; rebuilt', expect: ['the outside leaves the box to the box'],
    edits: [['scripts/build-outside.mjs', 'if (deep) continue; // the box draws it', '// the box draws it']],
    rebuild: REBUILD, files: OUTSIDE_FILES },
  { name: 'steep ground from a 60 m rise, not 70, outside the box', expect: ["the rules outside are the box's own"],
    edits: [['scripts/terrain/land-rules.mjs', 'rise >= 70 ||', 'rise >= 60 ||']] },
  { name: 'the page\'s pieces cut with no margin of their neighbours', expect: ['the page draws the outside in pieces'],
    edits: [['public/land-levels.js', 'export function tileGrid(grid, { most = 375000, margin = 3 } = {}) {', 'export function tileGrid(grid, { most = 375000, margin = 0 } = {}) {']] },
  { name: 'the box\'s edge cells taken away off the outside\'s lattice (the offset turned round)', expect: ['the page draws the outside in pieces'],
    edits: [['public/land-levels.js', 'const offsetColumn = Math.round((grid.minX - outside.minX) / grid.cellMiles), offsetRow = Math.round((grid.minY - outside.minY) / grid.cellMiles);', 'const offsetColumn = Math.round((outside.minX - grid.minX) / grid.cellMiles), offsetRow = Math.round((outside.minY - grid.minY) / grid.cellMiles);']] },
  { name: 'the map\'s woods tiles stop at the box', expect: ['the woods outside are drawn'],
    edits: [['sim/woods-view.mjs', "  const options = { rule: 'landfire', nearCreek: land.nearCreek, beyond: outsideStandAt };\r\n  const minX = tx * size, minY = ty * size;\r\n  if (level === 'shade')", "  const options = { rule: 'landfire', nearCreek: land.nearCreek };\r\n  const minX = tx * size, minY = ty * size;\r\n  if (level === 'shade')"]] },
];
const hashOf = file => createHash('sha256').update(readFileSync(file)).digest('hex');
const only = process.argv[3] ? cases.filter((_, i) => String(i) === process.argv[3]) : cases;
const results = [];
for (const c of only) {
  const originals = new Map();
  for (const [file] of c.edits || []) if (!originals.has(file)) originals.set(file, readFileSync(file));
  const files = c.files || [];
  const before = Object.fromEntries(files.map(file => [file, hashOf(file)]));
  for (const file of files) copyFileSync(file, `${file}.injection-backup`);
  let output = '';
  try {
    for (const [file, find, replace] of c.edits || []) {
      const text = readFileSync(file, 'utf8'), wanted = text.includes(find) ? find : find.replaceAll('\r\n', '\n');
      if (!text.includes(wanted)) throw new Error(`injection text not found in ${file}: ${find.slice(0, 60)}`);
      writeFileSync(file, text.replace(wanted, wanted === find ? replace : replace.replaceAll('\r\n', '\n')));
    }
    c.prepare?.();
    for (const command of c.rebuild || []) execSync(command, { stdio: 'pipe' });
    try { output = execSync(`node --test ${TESTS}`, { stdio: 'pipe', encoding: 'utf8', maxBuffer: 1 << 28 }); } catch (error) { output = error.stdout; }
  } finally {
    for (const [file, bytes] of originals) writeFileSync(file, bytes);
    for (const file of files) { copyFileSync(`${file}.injection-backup`, file); rmSync(`${file}.injection-backup`); }
  }
  const restored = files.every(file => hashOf(file) === before[file]);
  const failed = [...new Set([...output.matchAll(/^✖ (.+?) \(\d/gm)].map(m => m[1]))].filter(name => name !== 'failing tests:');
  if (process.argv[3]) console.log((output.split('failing tests:')[1] || '').split('\n').filter(line => !/^\s+at /.test(line)).slice(0, 40).join('\n'));
  const caught = c.expect.every(e => failed.some(f => f.startsWith(e))) && failed.length === c.expect.length;
  results.push({ injected: c.name, ...(c.note && { note: c.note }), failed, caughtByThoseTestsOnly: caught, restoredByteForByte: restored });
  console.log(caught && restored ? 'CAUGHT' : 'NOT AS EXPECTED', '-', c.name, '->', failed.join(' | '), restored ? '' : '(NOT RESTORED)');
}
if (!process.argv[3]) writeFileSync('docs/evidence/map-outside-injections.json', `${JSON.stringify({ date: new Date().toISOString().slice(0, 10), tests: TESTS.split(' '), results, caught: results.filter(r => r.caughtByThoseTestsOnly && r.restoredByteForByte).length, of: results.length }, null, 2)}\n`);
