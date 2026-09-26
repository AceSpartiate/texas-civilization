// The regressions the Alamo's checks guard, injected one at a time (CLAUDE.md: "A new test is not evidence until it has
// failed"), the same way scripts/battle-injections.mjs does it for the engine and Gonzales: each injection replaces one
// exact piece of the code - found exactly once, CRLF or not - runs the check written for it, records what stopped it, and puts
// the file back byte for byte. A unit injection runs its whole test file and requires the named test, and no other, to fail;
// a browser injection runs scripts/battle-alamo-browser-proof.mjs and requires its failure to be the message written for it.
// Each gate is run clean first and again at the end with every file put back.
//
// Slow: the browser gate plays a whole class from February 23 to March 13 for each of its injections. Same computer.
// Run: node scripts/battle-alamo-injections.mjs [unit|browser]  -> writes docs/evidence/battle-alamo-injections.json
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const DATA = 'tests/battle-alamo.test.mjs', VIEW = 'tests/battle-alamo-view.test.mjs';
const UNIT = [
  { name: 'the assault an hour late on the calendar', file: 'sim/battles/alamo.mjs',
    from: "      id: 'quiet', minutes: 420,", to: "      id: 'quiet', minutes: 480,",
    test: DATA, expect: 'the Alamo is data the engine holds to its rules, dated on the director\'s calendar, and its assault is the longest held fight' },
  { name: 'a route cuts through the north quarters', file: 'sim/alamo-posts.mjs',
    from: 'P(60, 15.6, [[108, 516], [108, 30], [60, 30]])', to: 'P(60, 15.6, [[108, 516]])',
    test: DATA, expect: 'every post and every way in and out is walked over the plan a foot at a time without going through a wall' },
  { name: 'the garrison set down in the fort, as before 2026-09-25', file: 'sim/alamo.mjs',
    from: "    // docs/BATTLES.md §9): the garrison went into the Alamo that afternoon (`HIST-TEX-054`).\n    takePost(world, person);", to: "    // docs/BATTLES.md §9): the garrison went into the Alamo that afternoon (`HIST-TEX-054`).\n    person.location = onMap(world, { x: 110, y: 280 });",
    test: DATA, expect: 'the garrison walks in from the town through the south gate to posts on the walls, a leg at a time, and nobody is set down' },
  { name: 'the north battery never comes closer', file: 'sim/battles/alamo.mjs',
    from: "    [north]: { from: 50, to: 660, every: 38 },", to: "    'battery-north-far': { from: 50, to: 660, every: 38 },",
    test: DATA, expect: 'the siege is lived: the guns every day and the answer, the north battery and the lines closer, the huts, and the night quiet' },
  { name: 'the siege held for a class with nobody there', file: 'sim/battle-stage.mjs',
    from: "      const background = state.phase.background && watchedByAFamily(world, state.battle) ? state.phase.background : null;", to: '      const background = state.phase.background || null;',
    test: DATA, expect: 'the clock lives the siege a quarter-day a tick only for a class with somebody there, holds the assault for everybody, and never runs faster' },
  { name: 'a courier walks out', file: 'sim/alamo.mjs',
    from: "  if (person.travel.mode === 'foot') Object.assign(person.travel, { speed: Math.max(person.travel.speed, MODES.horse.speed), saddle: true, lent: 'garrison' });", to: '',
    test: DATA, expect: 'a courier rides out through the gate at a rider\'s pace, reaches Gonzales before the relief rides, and may go back in with it' },
  { name: 'the relief rides to Béxar\'s plaza, inside the Mexican lines', file: 'sim/alamo.mjs',
    from: '    if (wait) endShortOf(person.travel, wait);', to: '',
    test: DATA, expect: 'the relief rides from Gonzales to wait short of the lines, rides in with the company to the gate, and walks to a post: never set down' },
  // Two guards keep a man on the road out (the relief's ride marks him late, and reliefEnters does too); what only one thing
  // does is tell him and turn him home.
  { name: 'a man left on the road is never told or turned home', file: 'sim/alamo-battle.mjs',
    from: '    if (!person.service.late || person.travel) continue;', to: '    continue;',
    test: DATA, expect: 'a relief man still on the road when the company goes in is left behind, told so, and turns home' },
  { name: 'everybody falls when the north wall does', file: 'sim/alamo-battle.mjs',
    from: '  const ids = FALL_PHASES[wallOf(person.service?.post)] || FALL_PHASES.north;', to: '  const ids = FALL_PHASES.north;',
    test: DATA, expect: 'each fighter falls when the storming reaches his post - the north wall first, the rooms last - and a woman is spared when it stops' },
  { name: 'the family\'s journal is told at the moment he falls', file: 'sim/alamo-battle.mjs',
    from: "    Object.assign(service, { fate: 'fell', fellAt: due.minute });", to: "    Object.assign(service, { fate: 'fell', fellAt: due.minute }); record(world, 'consequence', { actorId: person.id, householdId: person.householdId, text: `${person.name} was killed on the wall.` });",
    test: DATA, expect: 'the student may watch their own man fall; the family\'s journal and its people learn nothing until the word comes' },
  { name: 'every family is sent the Alamo', file: 'sim/alamo-battle.mjs',
    from: "  if (role !== 'student' || !householdId || !watchersOf(world).has(householdId)) return", to: "  if (role !== 'student' || !householdId) return",
    test: DATA, expect: 'only the Host and a family with somebody there are sent the Alamo: nobody else, not a count, not a card, and nothing from the future' },
  { name: 'the storming\'s card not at the man\'s side', file: 'sim/alamo-battle.mjs',
    from: "        ? `At ${person.name}'s side, on ${postLabel(person.service.post)}:", to: "        ? `On ${postLabel(person.service.post)}:",
    test: DATA, expect: 'the cards come through the person: none before the alarm on March 6, the alarm\'s at the man\'s side with Watch' },
  { name: 'an old save\'s garrison left on the plaza', file: 'sim/alamo-battle.mjs',
    from: '  for (const person of insideNow(world)) if (!person.service.post && !state.over) walkToPost(world, person, postFor(world, person, alamoRole(person)));', to: '',
    test: DATA, expect: 'a class saved in the middle of the assault opens in the middle of it; one saved before posts or battles opens without a new saveVersion' },
  { name: 'the garrison bunched in the middle of each wall', file: 'public/battle-view.js',
    from: "  if (style === 'wall' && side.spread?.width) {", to: '  if (false) {',
    test: VIEW, expect: 'the garrison stands along its walls, evenly, each wall facing out over itself, and a family\'s man takes one place on it' },
  { name: 'the guns are not drawn', file: 'public/battle-view.js',
    from: '    const gunsShown = (battle.guns || []).map(', to: '    const gunsShown = [].map(',
    test: VIEW, expect: 'the guns fire each dated shot once, the defenders\' canister throws a cone of smoke, and the batteries bombard all day' },
  { name: 'a fallen man goes on firing', file: 'public/battle-view.js',
    from: "    if (fell && since >= 0 && fell.fate !== 'escaped') {", to: '    if (false) {',
    test: VIEW, expect: 'a family\'s man at his post fires until the moment he falls, then goes down and lies still, and never fires again' },
  { name: 'Travis and Joe are not drawn', file: 'public/battle-view.js',
    from: '    const peopleShown = drawPeople(ctx, battle, camera, figurePx, time, now);', to: '    const peopleShown = [];',
    test: VIEW, expect: 'Travis is drawn at the north battery, says only his documented words there, and falls among the first; Joe hides, then comes out' },
  { name: 'no ladders', file: 'public/battle-view.js',
    from: '      if (side.ladders && side.action !== \'gone\' && shown) drawLadders(ctx, side, placeAt(shown, now), side.facing, camera, figurePx, time);', to: '',
    test: VIEW, expect: 'the columns carry ladders, climb the north wall on them, and the assault is fought in the dark until the dawn comes up' },
  { name: 'the Come and Take It cloth over Béxar', file: 'public/battle-view.js',
    from: "    if (flag.kind !== 'red' && art.animated(ctx, 'flag-come-and-take-it-wind',", to: "    if (art.animated(ctx, 'flag-come-and-take-it-wind',",
    test: VIEW, expect: 'the red flag of no quarter flies over Béxar as a plain red field, never as the Come and Take It flag' },
  { name: 'the reminder that he is inside hides the storming\'s card', file: 'public/military-attention.js',
    from: "  const deciding = notices.some(notice => notice.kind !== 'siege') ||", to: '  const deciding = notices.length ||',
    test: VIEW, expect: 'the storming\'s card goes up over the quiet reminder that somebody is inside, and not over a question' },
];

const BROWSER = [
  { name: 'the guns never fire', file: 'public/battle-view.js',
    from: '    const gunsShown = (battle.guns || []).map(', to: '    const gunsShown = [].map(', expect: 'the Mexican guns did not fire' },
  { name: 'the family\'s man stands idle at his post', file: 'public/battle-view.js',
    from: "        firing: ['scattered', 'volley', 'picket'].includes(force?.fire) && force.action !== 'gone' && !['asleep', 'surrender'].includes(pose),", to: '        firing: false,', expect: 'never fired from his post' },
  { name: 'the columns come as a crowd, not in files', file: 'public/battle-view.js',
    from: "  if (['ranks', 'mounted', 'column', 'wall'].includes(style)) {", to: "  if (['ranks', 'mounted', 'wall'].includes(style)) {", expect: 'the column or the wall is not in order' },
  { name: 'his fall is never shown', file: 'sim/alamo-battle.mjs',
    from: "  const battle = { ...projectBattle(world, 'alamo', { members: own.map(person => person.id), units: units(own), fates }),", to: "  const battle = { ...projectBattle(world, 'alamo', { members: own.map(person => person.id), units: units(own), fates: {} }),", expect: 'was never seen to fall' },
  { name: 'the journal is told at the moment he falls', file: 'sim/alamo-battle.mjs',
    from: "    delete service.walk;\n    person.task = 'rest';", to: "    delete service.walk;\n    record(world, 'consequence', { actorId: person.id, householdId: person.householdId, text: `${person.name} was killed on the wall.` });\n    person.task = 'rest';", expect: 'the journal knew' },
  { name: 'the family with nobody there is sent the Alamo', file: 'sim/alamo-battle.mjs',
    from: "  if (role !== 'student' || !householdId || !watchersOf(world).has(householdId)) return", to: "  if (role !== 'student' || !householdId) return", expect: 'the family with nobody there was sent the Alamo' },
  { name: 'the Host is not sent the Alamo', file: 'sim/alamo-battle.mjs',
    from: "  if (role === 'host') {\n    const battle =", to: "  if (false) {\n    const battle =", expect: 'the Host was not sent the Alamo live' },
  { name: 'no card at the storming', file: 'sim/alamo-battle.mjs',
    from: "      card(person.householdId, 'assault', person, text);", to: '', expect: 'timed out waiting' },
  { name: 'nothing to the student who watched', file: 'sim/alamo-battle.mjs',
    from: '      battle.debrief[entry.householdId] = {', to: '      ({}) || {', expect: 'What you saw' },
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
  const result = spawnSync(process.execPath, ['--test', file], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 30 * 60 * 1000 });
  const output = `${result.stdout}${result.stderr}`;
  const summary = output.split('✖ failing tests:')[1] || '';
  const failed = [...new Set([...summary.matchAll(/^✖ (.+?) \(\d[\d.]*m?s\)\s*$/gm)].map(match => match[1]))];
  if (result.status !== 0 && !failed.length) failed.push(`exit ${result.status}: ${output.slice(-300)}`);
  return { passed: result.status === 0, failed };
}
function runBrowser() {
  const result = spawnSync(process.execPath, ['scripts/battle-alamo-browser-proof.mjs'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 40 * 60 * 1000 });
  const output = `${result.stdout}${result.stderr}`;
  const failure = /AssertionError[^:]*: (.+)/.exec(output)?.[1]?.trim() || /Error: (.+)/.exec(output)?.[1]?.trim() || (result.status === 0 ? null : `exit ${result.status}: ${output.slice(-300)}`);
  return { passed: result.status === 0, failure, checks: (output.match(/^PASS /gm) || []).length };
}

const which = process.argv[2] || 'all';
// `dry`: say which injections' text is not found exactly once, and change nothing.
if (which === 'dry') {
  for (const injection of [...UNIT, ...BROWSER]) {
    const original = readFileSync(injection.file, 'utf8');
    const from = original.includes(CR + LF) ? injection.from.split(LF).join(CR + LF) : injection.from;
    const count = original.split(from).length - 1;
    console.log(`${count === 1 ? 'found' : `FOUND ${count} TIMES`}: ${injection.name}`);
  }
  process.exit(0);
}
// A fourth word runs only the injections whose name has it in, and keeps every other result from the last record.
const only = process.argv[3] || null;
const chosen = list => list.filter(one => !only || one.name.includes(only));
const record = { unit: [], browser: [] };
const evidencePath = 'docs/evidence/battle-alamo-injections.json';
let previous = {};
try { previous = JSON.parse(readFileSync(evidencePath, 'utf8')); } catch { /* the first run */ }

if (which === 'all' || which === 'unit') {
  const files = [...new Set(UNIT.map(one => one.test))];
  for (const file of files) { const clean = runUnit(file); if (!clean.passed) throw new Error(`${file} fails before any injection: ${clean.failed.join('; ')}`); }
  for (const injection of chosen(UNIT)) {
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
  for (const injection of chosen(BROWSER)) {
    const seen = inject(injection, runBrowser);
    const caught = !seen.passed && Boolean(seen.failure?.includes(injection.expect));
    record.browser.push({ name: injection.name, file: injection.file, expect: injection.expect, caught, failure: seen.failure, checksPassedFirst: seen.checks });
    console.log(`${caught ? 'caught' : seen.passed ? 'MISSED' : 'CAUGHT BY ANOTHER CHECK'}: ${injection.name} -> ${seen.failure || 'the gate passed'}`);
  }
  const after = runBrowser();
  if (!after.passed) throw new Error(`The browser gate fails after every file was put back: ${after.failure}`);
}
mkdirSync('docs/evidence', { recursive: true });
// This run's results in place of the last record's of the same name; the rest of the last record kept.
const keep = (was = [], now) => [...was.filter(one => !now.some(run => run.name === one.name)), ...now].filter(one => [...UNIT, ...BROWSER].some(defined => defined.name === one.name));
const merged = {
  record: 'battle-alamo-injections', date: new Date().toISOString().slice(0, 10),
  gates: { unit: `node --test ${DATA} and ${VIEW}, the named test and no other`, browser: 'scripts/battle-alamo-browser-proof.mjs' },
  unit: keep(previous.unit, record.unit),
  browser: keep(previous.browser, record.browser),
  cleanBrowserChecks: record.cleanBrowserChecks ?? previous.cleanBrowserChecks ?? null,
  environment: 'Same computer: node --test, and a local classroom server with headless Chrome at 1366x768 and 1024x768.',
};
writeFileSync(evidencePath, `${JSON.stringify(merged, null, 2)}\n`);
const all = [...merged.unit, ...merged.browser];
console.log(`\n${all.filter(one => one.caught).length} of ${all.length} caught by the check written for them. Wrote ${evidencePath}`);
