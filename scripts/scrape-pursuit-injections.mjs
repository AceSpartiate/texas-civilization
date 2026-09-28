// The regressions the Scrape's route and chase checks guard, injected one at a time (CLAUDE.md: "A new test is not evidence
// until it has failed"). Each injection replaces one exact piece of the code with the mistake - found exactly once, CRLF or not
// - runs the check written for it, records what stopped it, and puts the file back byte for byte.
//
// Unit injections run tests/scrape-pursuit.test.mjs and require the named test, and no other in the file, to fail. Browser
// injections run scripts/scrape-pursuit-browser-proof.mjs and require its failure to be the message written for that check.
// Each gate is run clean first and again at the end.
//
// Run: node scripts/scrape-pursuit-injections.mjs [unit|browser]  -> writes docs/evidence/scrape-pursuit-injections.json
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const T = 'tests/scrape-pursuit.test.mjs';
const NAMES = {
  route: 'the family chooses where it goes and by which way, with stops, and changes it on the road; the train goes as one',
  road: 'the road is quicker; across country is slower by its going, a wagon cannot cross timber, and a family off the road is seen from half as far',
  dated: 'only a column on its dated road or a patrol out ahead of one can see a family, on the record\'s days',
  alto: 'Mexican horsemen come on, order the family to halt in Spanish with the English under it, and a family that halts is taken without a shot',
  paces: 'the chase goes at the record\'s paces: an ox wagon slower than infantry, a family on foot or on horseback faster, cavalry faster than all',
  table: 'the shots are the researched table: by range, shooter and target, a moving target at six in ten, nothing past two hundred yards',
  children: 'children are never hit, and most shots miss: the soldiers aim at the grown people, the animals and the wagon',
  beasts: 'a beast hit slows the train: a lamed ox halves the wagon\'s pace, and an ox shot down leaves a running family on foot',
  giveUp: 'they give up at the timber, after their miles, and at dark; they take a family they come up with',
  auto: 'an automatic family halts when it is ordered to, and an order nobody answers halts the family; both written down',
  seen: 'the class\'s clock is held to the chase only for a family at its screen, and the chase is its own and the Host\'s to see, with its route its own alone',
  old: 'an old save opens: a flight with no route, no chase, no path fields validates and runs, and no save version moved',
};
const UNIT = [
  { name: 'the family stops at its first stop and never goes on to the next', file: 'sim/flight-route.mjs',
    from: '  if (!route || route.stops.length < 2) return false;', to: '  if (route || !route) return false;', expect: NAMES.route },
  { name: 'a family across country seen from as far as on the road', file: 'sim/pursuit.mjs',
    from: 'export const COUNTRY_SIGHT = 0.5;', to: 'export const COUNTRY_SIGHT = 1;', expect: NAMES.road },
  { name: 'the patrols out a day before the record has them', file: 'sim/pursuit.mjs',
    from: 'const inWindow = (patrol, t) => (patrol.windows || [[patrol.from, patrol.until]]).some(([from, until]) => t >= from && t < until);',
    to: 'const inWindow = (patrol, t) => (patrol.windows || [[patrol.from, patrol.until]]).some(([from, until]) => t >= from - 1440 && t < until);', expect: NAMES.dated },
  { name: 'the order to halt in Spanish with no English under it', file: 'sim/pursuit.mjs',
    from: "else say(world, chase, 'alto', '¡Alto!', 'Halt!');", to: "else say(world, chase, 'alto', '¡Alto!', '');", expect: NAMES.alto },
  { name: 'infantry faster than a family on foot', file: 'sim/pursuit.mjs',
    from: 'export const INFANTRY_MPH = 2.5,', to: 'export const INFANTRY_MPH = 3.5,', expect: NAMES.paces },
  { name: 'a running target as easy to hit as a still one', file: 'sim/pursuit.mjs',
    from: 'export const MOVING_SHARE = 0.6;', to: 'export const MOVING_SHARE = 1;', expect: NAMES.table },
  { name: 'the children among the targets', file: 'sim/pursuit.mjs',
    from: "  const targets = people.filter(one => grown(one) && one.health?.condition !== 'dead' && !one.travel?.carried)",
    to: "  const targets = people.filter(one => one.health?.condition !== 'dead' && !one.travel?.carried)", expect: NAMES.children },
  { name: 'a lamed ox pulls at its full pace', file: 'sim/pursuit.mjs',
    from: "  const hurtOx = flight.mode === 'wagon' && beasts.some(beast => beast.hurt && beast.species !== 'horse' && beast.kind === 'animal');",
    to: '  const hurtOx = false;', expect: NAMES.beasts },
  { name: 'the horsemen follow a family into the timber', file: 'sim/pursuit.mjs',
    from: "  if (point && chase.lead > TIMBER_YARDS && hidesIn(world, point)) return 'timber';", to: '', expect: NAMES.giveUp },
  { name: 'an automatic family\'s halt written as a student\'s answer', file: 'sim/pursuit.mjs',
    from: "  answerRoad(world, household, roadAutoAnswer(world, household) || 'halt', how);", to: "  answerRoad(world, household, roadAutoAnswer(world, household) || 'halt', 'answered');", expect: NAMES.auto },
  { name: 'an absent family\'s chase holds the class', file: 'sim/military-pacing.mjs',
    from: '    if (!step || !household.played || household.absent) continue;', to: '    if (!step || !household.played) continue;', expect: [NAMES.seen, NAMES.auto] },
  { name: 'another family sent the first family\'s route', file: 'sim/world.mjs',
    from: "    ...(household?.flight ? { flight: flightProjection(world, household) } : {}),",
    to: "    ...(household?.flight ? { flight: { ...flightProjection(world, household), ...(household.id !== 'hh-1' && world.households['hh-1']?.flight && { route: flightProjection(world, world.households['hh-1']).route }) } } : {}),", expect: NAMES.seen },
  { name: 'the save version moved', file: 'server/app.mjs',
    from: 'saveVersion: 3,', to: 'saveVersion: 4,', expect: NAMES.old },
];
const BROWSER = [
  { name: 'another family\'s map drew the first family\'s path', file: 'sim/world.mjs',
    from: "    ...(household?.flight ? { flight: flightProjection(world, household) } : {}),",
    to: "    ...(household?.flight ? { flight: { ...flightProjection(world, household), ...(household.id !== 'hh-1' && world.households['hh-1']?.flight && { route: flightProjection(world, world.households['hh-1']).route }) } } : {}),",
    expect: 'another family\'s map drew the first family\'s way' },
  { name: 'the Host\'s map drew a family\'s path', file: 'public/app.js',
    from: '  window.__routeDrawn = drawRouteLine(ctx, host ? null : world.flight, camera, canvas);', to: '  window.__routeDrawn = drawRouteLine(ctx, host ? { route: { line: [[{ x: camera.cx, y: camera.cy }, { x: camera.cx + 1, y: camera.cy }]] } } : world.flight, camera, canvas);',
    expect: 'the Host\'s map drew a family\'s way' },
  { name: 'the orders never drawn over the horsemen', file: 'public/chase-view.js',
    from: '      if (said && drawnSoldiers.length && figurePx >= 9) {', to: '      if (false) {',
    expect: '"¡Alto!" was not drawn over the horsemen' },
  { name: 'the shots never drawn', file: 'public/chase-view.js',
    from: '        if (shot.fired || now < shot.at || still) continue;', to: '        continue;',
    expect: 'no shot was drawn' },
];

const CR = '\r', LF = '\n';
function inject(injection, check) {
  const original = readFileSync(injection.file, 'utf8');
  const ends = text => (original.includes(CR + LF) ? text.split(LF).join(CR + LF) : text);
  const from = ends(injection.from), to = ends(injection.to);
  const count = original.split(from).length - 1;
  if (count !== 1) throw new Error(`${injection.name}: the text to replace is in ${injection.file} ${count} times`);
  writeFileSync(injection.file, original.replace(from, () => to));
  try { return check(); } finally { writeFileSync(injection.file, original); }
}
function runUnit(file) {
  const result = spawnSync(process.execPath, ['--test', file], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 30 * 60 * 1000 });
  const output = `${result.stdout}${result.stderr}`;
  const summary = output.split('✖ failing tests:')[1] || '';
  const failed = [...new Set([...summary.matchAll(/^✖ (.+?) \(\d[\d.]*m?s\)\s*$/gm)].map(match => match[1]))];
  if (result.status !== 0 && !failed.length) failed.push(`exit ${result.status}: ${output.slice(-300)}`);
  return { passed: result.status === 0, failed };
}
function runBrowser() {
  const result = spawnSync(process.execPath, ['scripts/scrape-pursuit-browser-proof.mjs'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 60 * 60 * 1000 });
  const output = `${result.stdout}${result.stderr}`;
  const failure = /AssertionError[^:]*: ([^\n]+)/.exec(output)?.[1]?.trim() || /Error: (.+)/.exec(output)?.[1]?.trim() || (result.status === 0 ? null : `exit ${result.status}: ${output.slice(-300)}`);
  return { passed: result.status === 0, failure, checks: (output.match(/^PASS /gm) || []).length };
}

const which = process.argv[2] || 'all';
// `unit children`: only the injections whose name has the word, for a check mended after a run (each gate still run clean first).
const only = process.argv[3] || null;
if (only) UNIT.splice(0, UNIT.length, ...UNIT.filter(injection => injection.name.includes(only)));
const record = { unit: [], browser: [] };
const evidencePath = 'docs/evidence/scrape-pursuit-injections.json';
let previous = {};
try { previous = JSON.parse(readFileSync(evidencePath, 'utf8')); } catch { /* the first run */ }
if (which === 'all' || which === 'unit') {
  const clean = runUnit(T); if (!clean.passed) throw new Error(`${T} fails before any injection: ${clean.failed.join('; ')}`);
  for (const injection of UNIT) {
    const seen = inject(injection, () => runUnit(T));
    // The named test and no other; or, where one regression breaks a rule two checks hold (an absent family's chase holding the
    // class is both the clock's check and the automatic family's), exactly the set named.
    const expected = [injection.expect].flat();
    const caught = !seen.passed && seen.failed.length === expected.length && expected.every(name => seen.failed.includes(name));
    record.unit.push({ name: injection.name, file: injection.file, expect: injection.expect, caught, failed: seen.failed });
    console.log(`${caught ? 'caught' : seen.passed ? 'MISSED' : 'CAUGHT BY ANOTHER OR MORE THAN ONE'}: ${injection.name} -> ${seen.failed.join(' | ') || 'every test passed'}`);
  }
  const after = runUnit(T); if (!after.passed) throw new Error(`${T} fails after every file was put back: ${after.failed.join('; ')}`);
}
if (which === 'all' || which === 'browser') {
  const clean = runBrowser();
  if (!clean.passed) throw new Error(`The browser gate fails before any injection: ${clean.failure}`);
  record.cleanBrowserChecks = clean.checks;
  for (const injection of BROWSER) {
    const seen = inject(injection, runBrowser);
    const caught = !seen.passed && Boolean(seen.failure?.includes(injection.expect));
    record.browser.push({ name: injection.name, file: injection.file, expect: injection.expect, caught, failure: seen.failure, checksPassedFirst: seen.checks });
    console.log(`${caught ? 'caught' : seen.passed ? 'MISSED' : 'CAUGHT BY ANOTHER CHECK'}: ${injection.name} -> ${seen.failure || 'the gate passed'}`);
  }
}
mkdirSync('docs/evidence', { recursive: true });
const merged = {
  record: 'scrape-pursuit-injections', date: new Date().toISOString().slice(0, 10),
  gates: { unit: `node --test ${T}, the named test and no other`, browser: 'scripts/scrape-pursuit-browser-proof.mjs' },
  // A run of some of them keeps the rest from the last run, each replaced by name.
  unit: only ? [...(previous.unit || []).filter(one => !record.unit.some(now => now.name === one.name)), ...record.unit] : record.unit.length ? record.unit : previous.unit || [],
  browser: record.browser.length ? record.browser : previous.browser || [],
  cleanBrowserChecks: record.cleanBrowserChecks ?? previous.cleanBrowserChecks ?? null,
  environment: 'Same computer: node --test, and a local classroom server with headless Chrome at 1366x768 and 1024x768.',
};
writeFileSync(evidencePath, `${JSON.stringify(merged, null, 2)}\n`);
const all = [...merged.unit, ...merged.browser];
console.log(`\n${all.filter(one => one.caught).length} of ${all.length} caught by the check written for them. Wrote ${evidencePath}`);
