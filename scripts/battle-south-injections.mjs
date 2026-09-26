// The regressions the south's checks guard (the map to the Nueces, San Patricio and Agua Dulce on the engine), injected one at a
// time (CLAUDE.md: "A new test is not evidence until it has failed"), as scripts/battle-injections.mjs does for Gonzales: each
// replaces one exact piece of code - found exactly once, CRLF or not - runs the check written for it, records what stopped it,
// and puts the file back byte for byte. A unit injection must fail the named test and no other in its file; a browser
// injection must fail scripts/battle-south-browser-proof.mjs with the message written for that check. Each gate is run clean
// first and again at the end.
//
// Kept apart from scripts/battle-injections.mjs so the builders of the other engagements can add theirs there without a merge.
// Slow: the browser gate walks a class from the winter to Agua Dulce for each of its injections. Same computer.
// Run: node scripts/battle-south-injections.mjs [unit|browser] -> writes docs/evidence/battle-south-injections.json
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const SOUTH = 'tests/battle-south.test.mjs', MAP = 'tests/south-map.test.mjs', VIEW = 'tests/battle-view-south.test.mjs';
const UNIT = [
  { name: 'a recall reaches a man already in the fight, or dead or taken before the word', file: 'sim/winter.mjs',
    from: "  if (entity.service.kind === 'matamoros' && (entity.service.fight || entity.service.fate)) {", to: '  if (false) {',
    test: SOUTH, expect: 'nobody can be sent for once the fight begins, and the refusal says nothing of what became of them' },
  { name: 'a man\'s fate lands the moment the fight is armed, not at its staged moment', file: 'sim/south.mjs',
    from: '      if (world.minute >= fate.minute && !fate.applied) {', to: '      if (!fate.applied) {',
    test: SOUTH, expect: 'each man\'s fate is the roll it always was, lands at its own moment inside the fight, and is on no screen and in no report before' },
  { name: 'a man\'s fate is sent to his family\'s page before it happens', file: 'sim/battle-stage.mjs',
    from: 'members.filter(one => fates[one] && fates[one].minute <= world.minute)', to: 'members.filter(one => fates[one])',
    test: SOUTH, expect: 'each man\'s fate is the roll it always was, lands at its own moment inside the fight, and is on no screen and in no report before' },
  { name: 'Agua Dulce kept at six in the morning', file: 'sim/directors.mjs',
    from: "'agua-dulce': 223830,", to: "'agua-dulce': 223560,",
    test: SOUTH, expect: 'San Patricio is fought at three in the morning of February 27, Agua Dulce at half past ten on March 2, and the day never moves' },
  { name: 'the men are put in the force only after the first shot', file: 'sim/south.mjs',
    from: '  if (!state.over && world.minute < contactFrom) {', to: '  if (!state.over && world.minute >= contactFrom) {',
    test: SOUTH, expect: 'a man sent south is at San Patricio, and in the force before the first shot, or rides with Grant and drives the horses north' },
  { name: 'every family is sent the fight, whether it has a man there or not', file: 'sim/south.mjs',
    from: "    if (role === 'student' && own.length) return", to: "    if (role === 'student') return",
    test: SOUTH, expect: 'the Host sees each fight live and is framed on it; a family with a man there sees it and is alerted; a family with nobody there is sent nothing' },
  { name: 'the account does not say why it ended as it did', file: 'sim/south.mjs',
    from: "  return [happened, `What yours did: ${men.map(did).join(' ')}`, why, disputed].join('\\n\\n');", to: "  return [happened, `What yours did: ${men.map(did).join(' ')}`, disputed].join('\\n\\n');",
    test: SOUTH, expect: 'afterwards the escaped ride for Goliad and the prisoners are marched south; at the word each family is told in plain words, and nobody else' },
  { name: 'a man is sent south who could never reach San Patricio before the raid', file: 'sim/winter.mjs',
    from: "  if (kind === 'matamoros') return southClosing(world, household, entity);", to: '',
    test: SOUTH, expect: 'the join is refused, in words, once a man could not reach San Patricio before the raid, and offered before' },
  { name: 'the woods end at the box, so San Patricio stands on no ground', file: 'sim/woods.mjs',
    from: "  const strip = key === 'biomes' ? southStrip() : null;", to: '  const strip = null;',
    test: MAP, expect: 'the land the simulation reads runs on below the box to 27.6°N, on the box\'s own lattice, and the box is untouched' },
  { name: 'a class saved before the south is never given it', file: 'server/storage.mjs',
    from: '  if (save.world) openSouth(save.world);', to: '',
    test: MAP, expect: 'a class saved before the south opens with it at the save\'s door: added, nothing it had moved, and no save version' },
  { name: 'an old save keeps the outside road to San Patricio beside the walked one', file: 'sim/south.mjs',
    from: "    if (route.kind === 'outside' && [route.from, route.to].some(end => added.has(end))) delete map.routes[id];", to: '',
    test: MAP, expect: 'a class saved before the south opens with it at the save\'s door: added, nothing it had moved, and no save version' },
  { name: 'a night fight drawn by day', file: 'public/battle-view.js',
    from: "    const night = battle.light === 'night' || battle.light === 'dawn' ? drawNight(ctx, battle, camera, figurePx, now, bounds) : null;", to: '    const night = null;',
    test: VIEW, expect: 'a night fight is dark but for the lit windows, the fire and the flashes' },
  { name: 'the men shut in a house are drawn standing in the open', file: 'public/battle-view.js',
    from: "        if (pose === 'hidden') {", to: '        if (false) {',
    test: VIEW, expect: 'a side in parts is drawn part by part: men asleep lying down, men in a house unseen but firing from it, men giving up with their hands up' },
  { name: 'the fallen are carried along with their part', file: 'public/battle-view.js',
    from: '        const ground = down ? view.fallenSpots.get(seedKey) : at;', to: '        const ground = down && !side.part ? view.fallenSpots.get(seedKey) : at;',
    test: VIEW, expect: 'a man who falls lies where he fell while the rest of his part is marched off' },
  { name: 'a family\'s man killed is still drawn at his work', file: 'public/battle-view.js',
    from: "      if (fell.fate === 'killed') return", to: "      if (false) return",
    test: VIEW, expect: 'a family\'s man is drawn in his part - asleep, in the house, giving up - and once his fate has come, in it' },
  // The owner's decisions of 2026-09-26 (docs/BATTLES.md §2b.7, §2b.8).
  { name: 'Agua Dulce kept at the point near Banquete, ten miles out', file: 'scripts/build-colonies-map.mjs',
    from: "['agua-dulce', 'Agua Dulce Creek', 'ground', -97.81, 27.639,", to: "['agua-dulce', 'Agua Dulce Creek', 'ground', -97.84972, 27.8475,",
    rebuild: true,
    test: MAP, expect: 'the Agua Dulce ground is the Handbook\'s twenty-six miles below San Patricio on the road south, not the point near Banquete' },
  { name: 'a class saved with the old ground keeps it at the door', file: 'sim/south.mjs',
    from: '  if (southWalkable(world)) return moveAguaDulce(world);', to: '  if (southWalkable(world)) return false;',
    test: MAP, expect: 'a class saved with the south before the owner moved Agua Dulce has it moved at the save\'s door, unless its drive north has begun' },
  { name: 'the prisoners are left standing at the end of the road south', file: 'sim/south.mjs',
    from: '        person.service.offMap = world.minute;\n', to: '',
    test: SOUTH, expect: 'the prisoners are seen marched away down the road south, then are gone from the map: not left standing at its end, and seen by nobody there' },
  { name: 'another family standing at the road\'s end still sees the prisoners there', file: 'sim/town.mjs',
    from: '    .filter(entity => !Number.isFinite(entity.service?.offMap));', to: '    ;',
    test: SOUTH, expect: 'the prisoners are seen marched away down the road south, then are gone from the map: not left standing at its end, and seen by nobody there' },
];

const BROWSER = [
  { name: 'the houses never fire back', file: 'public/battle-view.js',
    from: "          if (still || side.fire === 'none') continue;\n          const wait = WAIT_MIN_MS + hash(`${seed}:hw`)",
    to: "          continue;\n          const wait = WAIT_MIN_MS + hash(`${seed}:hw`)", expect: 'the Texians never fired back from the houses' },
  { name: 'San Patricio drawn by day', file: 'public/battle-view.js',
    from: "    const night = battle.light === 'night' || battle.light === 'dawn' ? drawNight(ctx, battle, camera, figurePx, now, bounds) : null;", to: '    const night = null;', expect: 'was drawn by day' },
  { name: 'the man\'s fate on his page before it happens', file: 'sim/battle-stage.mjs',
    from: 'members.filter(one => fates[one] && fates[one].minute <= world.minute)', to: 'members.filter(one => fates[one])', expect: 'his fate was drawn at' },
  { name: 'the family with nobody there is sent the fight', file: 'sim/south.mjs',
    from: "    if (role === 'student' && own.length) return", to: "    if (role === 'student') return", expect: 'the family with nobody there was sent the battle' },
  { name: 'no alert through the man', file: 'sim/south.mjs',
    from: "    const alert = role === 'student' && householdId ? southAlert(world, id, state, householdId) : null;", to: '    const alert = null;', expect: 'no alert with Watch came through the man' },
  { name: 'the Host is not sent the south\'s fights', file: 'sim/directors.mjs',
    from: '  if (south?.battle && !battle) battle = south.battle;', to: "  if (south?.battle && !battle && role !== 'host') battle = south.battle;", expect: 'the Host was not sent San Patricio live' },
  { name: 'no herd', file: 'public/battle-view.js',
    from: '    const herdDrawn = drawHerd(ctx, camera, figurePx, time, now);', to: '    const herdDrawn = 0;', expect: 'the herd, the riders or the groves are missing' },
  { name: 'the page still draws a prisoner at the end of the road south', file: 'public/app.js',
    from: '  if (entity.service?.offMap) return;', to: '', expect: 'was still drawn at the end of the road south' },
  { name: 'no account when the word comes', file: 'sim/south.mjs',
    from: '    if (battle.told[householdId]) continue;', to: '    continue;', expect: 'no account of San Patricio came' },
];

const CR = String.fromCharCode(13), LF = String.fromCharCode(10);
function inject(injection, check) {
  const original = readFileSync(injection.file, 'utf8');
  const ends = text => (original.includes(CR + LF) ? text.split(LF).join(CR + LF) : text);
  const from = ends(injection.from), to = ends(injection.to);
  const count = original.split(from).length - 1;
  if (count !== 1) throw new Error(`${injection.name}: the text to replace is in ${injection.file} ${count} times`);
  writeFileSync(injection.file, original.replace(from, () => to));
  // An injection into the map's build (`rebuild`) is built into the map the class reads, and the map is put back byte for byte.
  const MAP_FILE = 'public/terrain/colonies-map.json.gz', built = injection.rebuild ? readFileSync(MAP_FILE) : null;
  try {
    if (built) spawnSync(process.execPath, ['scripts/build-colonies-map.mjs'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    return check();
  } finally { writeFileSync(injection.file, original); if (built) writeFileSync(MAP_FILE, built); }
}
function runUnit(file) {
  const result = spawnSync(process.execPath, ['--test', file], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 20 * 60 * 1000 });
  const output = `${result.stdout}${result.stderr}`;
  const summary = output.split('✖ failing tests:')[1] || '';
  const failed = [...new Set([...summary.matchAll(/^✖ (.+?) \(\d[\d.]*m?s\)\s*$/gm)].map(match => match[1]))];
  if (result.status !== 0 && !failed.length) failed.push(`exit ${result.status}: ${output.slice(-300)}`);
  return { passed: result.status === 0, failed };
}
function runBrowser() {
  const result = spawnSync(process.execPath, ['scripts/battle-south-browser-proof.mjs'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 30 * 60 * 1000 });
  const output = `${result.stdout}${result.stderr}`;
  const failure = /AssertionError[^:]*: (.+)/.exec(output)?.[1]?.trim() || /Error: (.+)/.exec(output)?.[1]?.trim() || (result.status === 0 ? null : `exit ${result.status}: ${output.slice(-300)}`);
  return { passed: result.status === 0, failure, checks: (output.match(/^PASS /gm) || []).length };
}

const which = process.argv[2] || 'all';
// `--only <name>` runs that one injection (and the gate clean before and after) and keeps every other result as recorded.
const only = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1] : null;
const record = { unit: [], browser: [] };
const evidencePath = 'docs/evidence/battle-south-injections.json';
let previous = {};
try { previous = JSON.parse(readFileSync(evidencePath, 'utf8')); } catch { /* the first run */ }

if (which === 'all' || which === 'unit') {
  const files = [...new Set(UNIT.map(one => one.test))];
  for (const file of files) { const clean = runUnit(file); if (!clean.passed) throw new Error(`${file} fails before any injection: ${clean.failed.join('; ')}`); }
  for (const injection of UNIT.filter(one => !only || one.name === only)) {
    const seen = inject(injection, () => runUnit(injection.test));
    const caught = !seen.passed && seen.failed.length === 1 && seen.failed[0] === injection.expect;
    record.unit.push({ name: injection.name, file: injection.file, test: injection.test, expect: injection.expect, caught, failed: seen.failed });
    console.log(`${caught ? 'caught' : seen.passed ? 'MISSED' : 'CAUGHT BY ANOTHER OR MORE THAN ONE'}: ${injection.name} -> ${seen.failed.join(' | ') || 'every test passed'}`);
  }
  for (const file of files) { const after = runUnit(file); if (!after.passed) throw new Error(`${file} fails after every file was put back: ${after.failed.join('; ')}`); }
}
if (which === 'all' || which === 'browser') {
  const clean = runBrowser();
  if (!clean.passed) throw new Error(`The browser gate fails before any injection: ${clean.failure}`);
  record.cleanBrowserChecks = clean.checks;
  for (const injection of BROWSER.filter(one => !only || one.name === only)) {
    const seen = inject(injection, runBrowser);
    const caught = !seen.passed && Boolean(seen.failure?.includes(injection.expect));
    record.browser.push({ name: injection.name, file: injection.file, expect: injection.expect, caught, failure: seen.failure, checksPassedFirst: seen.checks });
    console.log(`${caught ? 'caught' : seen.passed ? 'MISSED' : 'CAUGHT BY ANOTHER CHECK'}: ${injection.name} -> ${seen.failure || 'the gate passed'}`);
  }
  const after = runBrowser();
  if (!after.passed) throw new Error(`The browser gate fails after every file was put back: ${after.failure}`);
}
mkdirSync('docs/evidence', { recursive: true });
/** This run's results in the order the list has them, over what was recorded before for the injections not run now. */
const keep = (now, before = []) => now.length ? (only ? before.map(one => now.find(run => run.name === one.name) || one) : now) : before;
const merged = {
  record: 'battle-south-injections', date: new Date().toISOString().slice(0, 10),
  gates: { unit: `node --test ${[SOUTH, MAP, VIEW].join(', ')}: the named test and no other`, browser: 'scripts/battle-south-browser-proof.mjs' },
  unit: keep(record.unit, previous.unit),
  browser: keep(record.browser, previous.browser),
  cleanBrowserChecks: record.cleanBrowserChecks ?? previous.cleanBrowserChecks ?? null,
  environment: 'Same computer: node --test, and a local classroom server with headless Chrome at 1366x768 and 1024x768.',
};
writeFileSync(evidencePath, `${JSON.stringify(merged, null, 2)}\n`.replace(/\n/g, '\r\n'));
const all = [...merged.unit, ...merged.browser];
console.log(`\n${all.filter(one => one.caught).length} of ${all.length} caught by the check written for them. Wrote ${evidencePath}`);
