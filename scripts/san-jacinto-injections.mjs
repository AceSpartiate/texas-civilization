// The regressions San Jacinto's checks guard, injected one at a time (CLAUDE.md: "A new test is not evidence until it has
// failed"). The same harness as scripts/battle-injections.mjs, for the second engagement on the engine: each injection
// replaces one exact piece of the code with the mistake - found exactly once, CRLF or not - runs the check written for it,
// records what stopped it, and puts the file back byte for byte.
//
// A unit injection runs its test file and requires the named test, and no other in the file, to fail (or exactly the named
// set, where a regression breaks a rule several checks hold). A browser injection
// runs scripts/battle-san-jacinto-browser-proof.mjs and requires its failure to be the message written for that check. Each
// gate is run clean first, and again at the end with every file put back.
//
// Slow: the browser gate walks a spring class through the three days for each of its injections. Same computer.
// Run: node scripts/san-jacinto-injections.mjs [unit|browser]  -> writes docs/evidence/san-jacinto-injections.json
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const T = 'tests/battle-san-jacinto.test.mjs', V = 'tests/battle-view-san-jacinto.test.mjs';
const TESTS = {
  place: 'presence by place: only the men standing at the Lynchburg camp are in the line; a man stranded at an old camp is not rolled and is told so',
  baggage: 'the army\'s march to Lynchburg takes every well man at Harrisburg there by the 20th; a sick man stays with the baggage, is present and not in the line, and is said so',
  joiner: 'a man who joins at a camp the army has left keeps that camp and follows it at the forced march; one who arrives after the battle is told the real place',
  road: 'a man can set out to join Houston from the family\'s refuge or its road east, the control says when he would be with the army, and he is in the line',
  refuge: 'a family refuged at Lynchburg: a man with the army camped there is not with his family, is not taken when the column comes, and does not eat its food',
  line: 'from the parade the men of the families are in the line, held there, in the ranks and firing with it; the alert comes through each before contact, and nobody else is told',
  fate: 'a man killed goes down at his own minute in the charge: his family\'s page and the Host\'s draw it then, nobody else\'s, and his panel and journal wait for the word',
  capture: 'Santa Anna is brought before the wounded Houston on the 22nd: the prisoners\' documented cry, both named, neither given words; his column is not drawn beside the battle',
  after: 'afterwards: the account through the man in plain words, the families at their refuges turn for home, the men go home, and the class ends on the road home with the war won',
  saves: 'a class saved in the middle of San Jacinto reopens in the middle of it; one saved before the engine gains it from the clock; no save version moves; a Host\'s jump crosses the quiet night but not the fight',
  pace: 'the fighting plays three to six real minutes at the Study pace, the clock lands on every watched phase and never runs faster for it',
  camp: 'a camp at rest (pose `rest`) is scattered and unformed, some standing and some sitting, and fires nothing; the formed line against it stands in even ranks',
  words: 'the Texian line fires its volley on its own officers\' words in English; the Mexican ranks on theirs in Spanish',
  rout: 'in the rout a share of the broken side gives itself up where it stands, and the dead lie where they fell while the side runs on past them',
  party: 'a group of horse is drawn apart from its side, as riders, with its own fall; the breastwork, the fires and the marsh stand on the ground',
};
const UNIT = [
  { name: 'a service record fights: a man anywhere is rolled', file: 'sim/houston.mjs',
    from: '  const fighters = inLine || serving.filter(person => inTheLine(world, person)).map(person => person.id);', to: '  const fighters = serving.map(person => person.id);', test: T, expect: [TESTS.place, TESTS.baggage] },
  { name: 'the sick march with the army from Harrisburg', file: 'sim/houston.mjs',
    from: '    if (person.travel || person.location?.siteId === camp) continue;\n    if (leftWithBaggage(world, person, camp)) continue;', to: '    if (person.travel || person.location?.siteId === camp) continue;', test: T, expect: TESTS.baggage },
  { name: 'a joiner is given the camp he never reached, and stands at the old one', file: 'sim/winter.mjs',
    from: "  const siteId = kind === 'houston' ? (entity.location?.siteId || houstonCamp(world)) : kind === 'matamoros'", to: "  const siteId = kind === 'houston' ? houstonCamp(world) : kind === 'matamoros'", test: T, expect: TESTS.joiner },
  { name: 'a man too late is told the volunteers are gone from Gonzales', file: 'sim/winter.mjs',
    from: " : kind === 'houston' ? `${entity.name} reached ${reached} after the battle was fought. The army is going home, and so does ${entity.name}.`", to: '', test: T, expect: TESTS.joiner },
  { name: 'nobody can join from the refuge or the road', file: 'sim/chores.mjs',
    from: '  const withTheFlight = Boolean(chore.fromFlight) && withFlight(household, entity);', to: '  const withTheFlight = false;', test: T, expect: TESTS.road },
  { name: 'the join is offered with no word of when he would reach the army', file: 'sim/chores.mjs',
    from: '      : chore.estimate && can ? chore.estimate(world, household, entity)\n', to: '', test: T, expect: TESTS.road },
  { name: 'a serving man is counted with his refugee family', file: 'sim/road.mjs',
    from: "  const there = one => one.service?.status !== 'serving' && (flight?.status", to: "  const there = one => (flight?.status", test: T, expect: TESTS.refuge },
  { name: 'nobody falls in at the parade', file: 'sim/san-jacinto.mjs',
    from: "  if (at >= index('parade') && at < index('guns')) {", to: '  if (false) {', test: T, expect: TESTS.line },
  { name: 'the alert never comes', file: 'sim/san-jacinto.mjs',
    from: "  if (at >= index('guns')) return;\n  const stage", to: '  return;\n  const stage', test: T, expect: TESTS.line },
  { name: 'every family is sent the fight', file: 'sim/san-jacinto.mjs',
    from: "  } else if (role === 'student' && householdId && ownThere(world, householdId).length) {", to: "  } else if (role === 'student' && householdId) {", test: T, expect: [TESTS.baggage, TESTS.line, TESTS.after] },
  { name: 'a man\'s fall is sent before it happens', file: 'sim/battle-stage.mjs',
    from: 'members.filter(one => fates[one] && fates[one].minute <= world.minute)', to: 'members.filter(one => fates[one])', test: T, expect: TESTS.fate },
  { name: 'a man\'s fall is sent to every family', file: 'sim/san-jacinto.mjs',
    from: '    out.battle = { ...projectBattle(world, ID, { members, fates: fatesFor(world, householdId) }), reconstruction: false };',
    to: '    out.battle = { ...projectBattle(world, ID, { members, fates: fatesFor(world, null) }), reconstruction: false };', test: T, expect: TESTS.fate },
  { name: 'the fallen man walks on with the line', file: 'sim/san-jacinto.mjs',
    from: "    if (entry?.fallsAt && world.minute >= entry.fallsAt && (entry.fate === 'killed' || state.phase.index < index('prisoners'))) return;\n", to: '', test: T, expect: TESTS.fate },
  { name: 'the account comes through the dead man', file: 'sim/san-jacinto.mjs',
    from: '    const through = alive || hearer || men[0];', to: '    const through = men[0];', test: T, expect: TESTS.fate },
  { name: 'Santa Anna\'s column is drawn beside the battle', file: 'sim/armies.mjs',
    from: "    if (column.id === 'santa-anna' && jacinto && !jacinto.before) continue;", to: '', test: T, expect: TESTS.capture },
  { name: 'the family at Lynchburg sees the men out on the field', file: 'sim/town.mjs',
    from: ' && places.has(entity.location?.siteId) && !inTheField(entity));', to: ' && places.has(entity.location?.siteId));', test: T, expect: TESTS.after },
  { name: 'no account', file: 'sim/directors.mjs',
    from: ' tellSanJacintoAccounts(world, cause);', to: '', test: T, expect: [TESTS.baggage, TESTS.fate, TESTS.after] },
  { name: 'an old save opened in the charge runs on half a day', file: 'sim/san-jacinto.mjs',
    from: "startsAt(ID, world => world.period === 3 && world.director && sanJacintoGround(world) ? momentOf(world, DEF.startKey) : null);", to: '', test: T, expect: TESTS.saves },
  { name: 'a Host\'s jump runs over the parade', file: 'sim/time.mjs',
    from: '  const fight = liveBattles(world).find(state => state.phase.step || state.phases.some(one => one.step && one.from > world.minute && one.from <= world.minute + requestedMinutes));',
    to: '  const fight = liveBattles(world).find(state => state.phase.step);', test: T, expect: TESTS.saves },
  { name: 'a quiet phase\'s long tick carries the class past the parade', file: 'sim/battle-stage.mjs',
    from: '      const cap = background ?? (next && (next.step || next.background) ? room : null);', to: '      const cap = background ?? null;', test: T, expect: [TESTS.pace, TESTS.place, TESTS.line, TESTS.fate, TESTS.capture, TESTS.after, TESTS.saves] },
  { name: 'a camp at rest is drawn standing in rows', file: 'public/battle-view.js',
    from: "        else if (side.style === 'camp') {", to: '        else if (false) {', test: V, expect: TESTS.camp },
  { name: 'the Texian officers give the Mexican words', file: 'public/battle-view.js',
    from: '      const words = battle.commands?.bySide?.[side.side]?.volley || battle.commands?.volley;', to: '      const words = battle.commands?.volley;', test: V, expect: TESTS.words },
  { name: 'the dead slide along with their side', file: 'public/battle-view.js',
    from: '          if (pin && (pin.down || (!down && pin.layout === key))) ground = pin;', to: '          if (false) ground = pin;', test: V, expect: TESTS.rout },
  { name: 'a later fall lands on a man already down', file: 'public/battle-view.js',
    from: '      const order = [...seen].filter(slot => !map.has(slot.index)).sort(', to: '      const order = [...seen].sort(', test: V, expect: TESTS.rout },
  { name: 'a group is counted into its side', file: 'public/battle-view.js',
    from: '        if (side.key === side.side || side.part) drawn[side.side].push(point);', to: '        drawn[side.side].push(point);', test: V, expect: TESTS.party },
  { name: 'nothing stands on the ground', file: 'public/battle-view.js',
    from: '    const worksDrawn = drawWorks(ctx, battle, camera, figurePx, time, bounds);', to: '    const worksDrawn = 0;', test: V, expect: TESTS.party },
];

const BROWSER = [
  { name: 'nobody can join from the refuge', file: 'sim/chores.mjs',
    from: '  const withTheFlight = Boolean(chore.fromFlight) && withFlight(household, entity);', to: '  const withTheFlight = false;', expect: 'joining Houston from the refuge was refused' },
  { name: 'no alert when the armies meet', file: 'sim/san-jacinto.mjs',
    from: '    if (alert) out.battleAlert = alert;', to: '', expect: 'no alert with Watch came through the man when the armies met' },
  { name: 'the Texians drawn loose like the camp', file: 'public/battle-view.js',
    from: "  if (['ranks', 'mounted', 'column', 'wall'].includes(style)) {", to: "  if (['mounted', 'column', 'wall'].includes(style)) {", expect: 'the Texian line is not the formed side' },
  { name: 'no smoke', file: 'public/battle-view.js',
    from: '    const w = wind || { x: 0, y: 0 };', to: '    return;', expect: 'no smoke on screen' },
  { name: 'nobody says anything', file: 'public/battle-view.js',
    from: '    const put = (line, at, alpha) => {', to: '    const put = () => {}, unused = (line, at, alpha) => {', expect: '"Remember the Alamo!" was not drawn' },
  { name: 'nobody falls in at the parade', file: 'sim/san-jacinto.mjs',
    from: "  if (at >= index('parade') && at < index('guns')) {", to: '  if (false) {', expect: 'no alert came through the man at the parade' }, // the parade's card goes only to a man in the line, so it is the first check to see nobody fell in
  { name: 'the Host is not sent the fight', file: 'sim/san-jacinto.mjs',
    from: '    out.battle = { ...projectBattle(world, ID, { members, fates: fatesFor(world, null) }), reconstruction: false };', to: '    out.battle = null;', expect: 'the Host was not sent the fight live' },
  { name: 'the family with nobody there is sent the fight', file: 'sim/san-jacinto.mjs',
    from: "  } else if (role === 'student' && householdId && ownThere(world, householdId).length) {", to: "  } else if (role === 'student' && householdId) {", expect: 'with nobody in the army was sent the battle' },
  { name: 'no account afterwards', file: 'sim/directors.mjs',
    from: ' tellSanJacintoAccounts(world, cause);', to: '', expect: 'the account never appeared' },
];

const CR = String.fromCharCode(13), LF = String.fromCharCode(10);
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
  const result = spawnSync(process.execPath, ['--test', file], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 20 * 60 * 1000 });
  const output = `${result.stdout}${result.stderr}`;
  const summary = output.split('✖ failing tests:')[1] || '';
  const failed = [...new Set([...summary.matchAll(/^✖ (.+?) \(\d[\d.]*m?s\)\s*$/gm)].map(match => match[1]))];
  if (result.status !== 0 && !failed.length) failed.push(`exit ${result.status}: ${output.slice(-300)}`);
  return { passed: result.status === 0, failed };
}
function runBrowser() {
  const result = spawnSync(process.execPath, ['scripts/battle-san-jacinto-browser-proof.mjs'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 40 * 60 * 1000 });
  const output = `${result.stdout}${result.stderr}`;
  const failure = /AssertionError[^:]*: (.+)/.exec(output)?.[1]?.trim() || /Error: (.+)/.exec(output)?.[1]?.trim() || (result.status === 0 ? null : `exit ${result.status}: ${output.slice(-300)}`);
  return { passed: result.status === 0, failure, checks: (output.match(/^PASS /gm) || []).length };
}

const which = process.argv[2] || 'all';
// A third argument runs only the injections whose name contains it, and keeps every other result from the last record.
const only = process.argv[3] || null;
const chosen = list => list.filter(one => !only || one.name.includes(only));
const record = { unit: [], browser: [] };
const evidencePath = 'docs/evidence/san-jacinto-injections.json';
let previous = {};
try { previous = JSON.parse(readFileSync(evidencePath, 'utf8')); } catch { /* the first run */ }

if (which === 'all' || which === 'unit') {
  const files = [...new Set(UNIT.map(one => one.test))];
  for (const file of files) { const clean = runUnit(file); if (!clean.passed) throw new Error(`${file} fails before any injection: ${clean.failed.join('; ')}`); }
  for (const injection of chosen(UNIT)) {
    const seen = inject(injection, () => runUnit(injection.test));
    // The named test and no other; or, where one regression breaks a rule several checks hold (who is sent the fight), exactly
    // the set named - never a test outside it.
    const expected = [injection.expect].flat();
    const caught = !seen.passed && seen.failed.length === expected.length && expected.every(name => seen.failed.includes(name));
    record.unit.push({ name: injection.name, file: injection.file, test: injection.test, expect: injection.expect, caught, failed: seen.failed });
    console.log(`${caught ? 'caught' : seen.passed ? 'MISSED' : 'CAUGHT BY ANOTHER OR MORE THAN ONE'}: ${injection.name} -> ${seen.failed.join(' | ') || 'every test passed'}`);
  }
  for (const file of files) { const after = runUnit(file); if (!after.passed) throw new Error(`${file} fails after every file was put back: ${after.failed.join('; ')}`); }
}
if (which === 'all' || which === 'browser') {
  const clean = runBrowser();
  if (!clean.passed) throw new Error(`The browser gate fails before any injection: ${clean.failure}`);
  record.cleanBrowserChecks = clean.checks;
  for (const injection of chosen(BROWSER)) {
    const seen = inject(injection, runBrowser);
    const caught = !seen.passed && Boolean(seen.failure?.includes(injection.expect));
    record.browser.push({ name: injection.name, file: injection.file, expect: injection.expect, caught, failure: seen.failure, checksPassedFirst: seen.checks });
    console.log(`${caught ? 'caught' : seen.passed ? 'MISSED' : 'CAUGHT BY ANOTHER CHECK'}: ${injection.name} -> ${seen.failure || 'the gate passed'}`);
  }
  const after = runBrowser();
  if (!after.passed) throw new Error(`The browser gate fails after every file was put back: ${after.failure}`);
}
function mergeByName(old = [], fresh = []) { return old.map(one => fresh.find(f => f.name === one.name) || one).concat(fresh.filter(f => !old.some(one => one.name === f.name))); }
mkdirSync('docs/evidence', { recursive: true });
const merged = {
  record: 'san-jacinto-injections', date: new Date().toISOString().slice(0, 10),
  gates: { unit: `node --test ${T} ${V}, the named test and no other`, browser: 'scripts/battle-san-jacinto-browser-proof.mjs' },
  unit: only ? mergeByName(previous.unit, record.unit) : record.unit.length ? record.unit : previous.unit || [],
  browser: only ? mergeByName(previous.browser, record.browser) : record.browser.length ? record.browser : previous.browser || [],
  cleanBrowserChecks: record.cleanBrowserChecks ?? previous.cleanBrowserChecks ?? null,
  environment: 'Same computer: node --test, and a local classroom server with headless Chrome at 1366x768 and 1024x768.',
};
writeFileSync(evidencePath, `${JSON.stringify(merged, null, 2)}\n`.replace(/\n/g, '\r\n'));
const all = [...merged.unit, ...merged.browser];
console.log(`\n${all.filter(one => one.caught).length} of ${all.length} caught by the check written for them. Wrote ${evidencePath}`);
