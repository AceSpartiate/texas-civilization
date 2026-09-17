// Injects each regression the new tests guard, runs the test file, and restores. Writes the record to docs/evidence.
import { readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
const ROOT = 'C:/Users/zachw/Texas Civilization/.claude/worktrees/agent-afbb3fb67a6cfb1b2/';
process.chdir(ROOT);
const PROV_LOAD = "if (!bands) bands = JSON.parse(gunzipSync(readFileSync(PROVINCE_FILE)).toString('utf8'));";
const shiftRiver = (name, dx, filter = 'true') => `${PROV_LOAD}\n  if (!bands.__injected) { bands.__injected = true; for (const river of bands.rivers) if (river.name === ${JSON.stringify(name)}) river.levels = river.levels.map(flat => flat && flat.map((v, i) => i % 2 === 0 && (() => { const x = flat[i] / 100, y = flat[i + 1] / 100; return ${filter}; })() ? v + ${Math.round(dx * 100)} : v)); }`;
const MAP_LOAD = "if (!loaded) loaded = JSON.parse(gunzipSync(readFileSync(new URL('../public/terrain/colonies-map.json.gz', import.meta.url))).toString('utf8'));";
const cases = [
  { name: 'the Colorado drawn 1.5 miles east, putting Mina on its west bank', test: 'tests/geography-truth.test.mjs', expect: ['each town stands on its documented bank'],
    edits: [['sim/province.mjs', PROV_LOAD, shiftRiver('Colorado River', 1.5)]] },
  { name: 'Béxar set down across the river on the Alamo side (a quarter mile east of Main Plaza), maps rebuilt', test: 'tests/geography-truth.test.mjs', expect: ['the San Antonio River runs between the Alamo', 'the page is sent the real province'], note: 'both tests hold the San Antonio between Béxar and the Alamo: the second on the classic shape an older page draws',
    edits: [['scripts/build-colonies-map.mjs', "['bexar', 'Béxar', 'town', -98.4936282, 29.4241219, 'HIST-TEX-010', false],", "['bexar', 'Béxar', 'town', -98.4890, 29.4241219, 'HIST-TEX-010', false],"]],
    rebuild: ['node scripts/build-colonies-map.mjs', 'node scripts/build-province.mjs'], files: ['public/terrain/colonies-map.json.gz', 'public/terrain/colonies-province.json.gz'] },
  { name: "Castañeda's camp set down on Gonzales's side of the Guadalupe", test: 'tests/geography-truth.test.mjs', expect: ["Gonzales is across the Guadalupe from Castañeda's camp"],
    edits: [['sim/colonies-map.mjs', MAP_LOAD, `${MAP_LOAD}\n  if (!loaded.__injected) { loaded.__injected = true; loaded.places['williams-camp'].x = loaded.places.gonzales.x + 0.4; loaded.places['williams-camp'].y = loaded.places.gonzales.y - 0.4; }`]] },
  { name: "Lynchburg back at TSHA's point at Interstate 10, maps rebuilt", test: 'tests/geography-truth.test.mjs', expect: ['Columbus and Harrisburg stand at their water'],
    edits: [['scripts/build-colonies-map.mjs', "['lynchburg', 'Lynchburg', 'town', -95.0740, 29.7690, 'HIST-TEX-084', false],", "['lynchburg', 'Lynchburg', 'town', -95.0554851, 29.7871704, 'HIST-TEX-084', false],"]],
    rebuild: ['node scripts/build-colonies-map.mjs', 'node scripts/build-province.mjs'], files: ['public/terrain/colonies-map.json.gz', 'public/terrain/colonies-province.json.gz'] },
  { name: 'a point of the Brazos at the one-mile band moved two miles off the finer band', test: 'tests/geography-truth.test.mjs', expect: ['the province drawn zoomed out is the real one'],
    edits: [['sim/province.mjs', PROV_LOAD, `${PROV_LOAD}\n  if (!bands.__injected) { bands.__injected = true; const river = bands.rivers.find(r => r.name === 'Brazos River' && r.levels[2] && r.levels[2].length > 20); river.levels[2][10] += 200; }`]] },
  { name: 'the page sent whatever province the class was saved with', test: 'tests/geography-truth.test.mjs', expect: ['the page is sent the real province'],
    edits: [['sim/province.mjs', 'if (map?.source !== COLONIES_SOURCE) return map;', 'return map;']] },
  { name: 'the classic shape drawing only the quarter-mile band, a chord across the bend at Béxar', test: 'tests/geography-truth.test.mjs', expect: ['the page is sent the real province'],
    edits: [['sim/province.mjs', '|| settlements.some(town => Math.hypot(town.x - p.x, town.y - p.y) <= CLASSIC_FINE_NEAR_TOWN));', '|| false);']] },
  { name: 'pine read as floodplain', test: 'tests/land.test.mjs', expect: ['the Lost Pines stand east of Mina'],
    edits: [['sim/land.mjs', "const decode = (byte, legend = LAND, reliefs = RELIEF) => ({ land: legend[byte & 15]?.id ?? 'none',", "const decode = (byte, legend = LAND, reliefs = RELIEF) => ({ land: legend[byte & 15]?.id === 'pine' ? 'floodplain' : legend[byte & 15]?.id ?? 'none',"]] },
  { name: 'brush read as savanna', test: 'tests/land.test.mjs', expect: ['south-west of Béxar is brush country'],
    edits: [['sim/land.mjs', "const decode = (byte, legend = LAND, reliefs = RELIEF) => ({ land: legend[byte & 15]?.id ?? 'none',", "const decode = (byte, legend = LAND, reliefs = RELIEF) => ({ land: legend[byte & 15]?.id === 'brush' ? 'savanna' : legend[byte & 15]?.id ?? 'none',"]] },
  { name: 'the brush named desert scrub', test: 'tests/land.test.mjs', expect: ['south-west of Béxar is brush country'],
    edits: [['sim/land.mjs', "{ id: 'brush', name: 'mesquite and thornscrub brush', colour: '#b4ac81' },", "{ id: 'brush', name: 'desert scrub', colour: '#b4ac81' },"]] },
  { name: 'the escarpment read as plain hills', test: 'tests/land.test.mjs', expect: ['north-west of San Antonio the hill country rises'],
    edits: [['sim/land.mjs', "relief: reliefs[byte >> 4]?.id ?? 'flat' });", "relief: reliefs[byte >> 4]?.id === 'escarpment' ? 'hills' : reliefs[byte >> 4]?.id ?? 'flat' });"]] },
  { name: 'beach read as prairie', test: 'tests/land.test.mjs', expect: ['Galveston Island is beach'],
    edits: [['sim/land.mjs', "const decode = (byte, legend = LAND, reliefs = RELIEF) => ({ land: legend[byte & 15]?.id ?? 'none',", "const decode = (byte, legend = LAND, reliefs = RELIEF) => ({ land: legend[byte & 15]?.id === 'sand' ? 'prairie' : legend[byte & 15]?.id ?? 'none',"]] },
  { name: 'a band cell takes the lowest class in its block, not the most common; land rebuilt', test: 'tests/land.test.mjs', expect: ['each band is the most common class of its cells'],
    edits: [['scripts/build-land.mjs', "const landClass = pick(landVotes, code('none'));", "const landClass = landVotes.findIndex((v, i) => v && i !== code('none'));"]],
    rebuild: ['node scripts/build-land.mjs'], files: ['public/terrain/colonies-land.json.gz', 'public/terrain/colonies-land.bin.gz'] },
];
const only = process.argv[2] ? cases.filter((_, i) => String(i) === process.argv[2]) : cases;
const results = [];
for (const c of only) {
  const originals = new Map();
  for (const [file] of c.edits) if (!originals.has(file)) originals.set(file, readFileSync(file, 'utf8'));
  const backups = (c.files || []).map(file => { copyFileSync(file, `${file}.injection-backup`); return file; });
  let output = '';
  try {
    for (const [file, find, replace] of c.edits) {
      const text = readFileSync(file, 'utf8');
      if (!text.includes(find)) throw new Error(`injection text not found in ${file}: ${find.slice(0, 60)}`);
      writeFileSync(file, text.replace(find, replace));
    }
    for (const command of c.rebuild || []) execSync(command, { stdio: 'pipe' });
    try { output = execSync(`node --test ${c.test}`, { stdio: 'pipe', encoding: 'utf8' }); } catch (error) { output = error.stdout; }
  } finally {
    for (const [file, text] of originals) writeFileSync(file, text);
    for (const file of backups) copyFileSync(`${file}.injection-backup`, file), execSync(`rm "${file}.injection-backup"`);
  }
  const failed = [...new Set([...output.matchAll(/^✖ (.+?) \(\d/gm)].map(m => m[1]))];
  if (process.argv[2]) console.log((output.split('failing tests:')[1] || '').split('\n').filter(line => !/^\s+at /.test(line)).join('\n'));
  const caught = c.expect.every(e => failed.some(f => f.startsWith(e))) && failed.length === c.expect.length;
  results.push({ injected: c.name, test: c.test, failed, caughtByThatTestOnly: caught });
  console.log(caught ? 'CAUGHT' : 'NOT AS EXPECTED', '-', c.name, '->', failed.join(' | '));
}
if (!process.argv[2]) writeFileSync('docs/evidence/map-accuracy-injections.json', JSON.stringify({ date: new Date().toISOString(), results }, null, 2));
