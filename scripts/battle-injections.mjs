// The regressions the battle engine's checks guard, injected one at a time (CLAUDE.md: "A new test is not evidence until it
// has failed"). Each injection replaces one exact piece of the code with the mistake - found exactly once, CRLF or not -
// runs the check written for it, records what stopped it, and puts the file back byte for byte.
//
// Two kinds. A unit injection runs its whole test file and requires the named test, and no other in the file, to fail. A
// browser injection runs scripts/battle-gonzales-browser-proof.mjs and requires its failure to be the message written for
// that check. Each gate is run clean first, and again at the end with every file put back.
//
// Slow: the browser gate walks a whole class to the end of the fight for each of its injections. Same computer.
// Run: node scripts/battle-injections.mjs [unit|browser]  -> writes docs/evidence/battle-injections.json
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const QUIET = 'tests/battle-quiet.test.mjs';
const UNIT = [
  { name: 'the call shuts by a third of the walk, too late for a man answering at the last minute', file: 'sim/directors.mjs',
    from: "  const walk = minutesToJoin(world, ground.timber, 'foot') ?? 0;", to: "  const walk = (minutesToJoin(world, ground.timber, 'foot') ?? 0) / 3;",
    test: 'tests/battle-arrival.test.mjs', expect: 'answered at any time the call is open - even the last minute, on foot or on the horse - the man is with the men before first light, and fights' },
  { name: 'somebody reaching town after the call shut is asked anyway', file: 'sim/directors.mjs',
    from: '    if (world.minute > closes) {', to: '    if (false) {',
    test: 'tests/battle-arrival.test.mjs', expect: 'once the call shuts it cannot be answered, and a family reaching town too late to catch the men is told so and never asked' },
  { name: 'the river holds the man going with the men at the ford', file: 'sim/world.mjs',
    from: '  if (travel.withForce) return;', to: '',
    test: 'tests/battle-arrival.test.mjs', expect: 'the river over the ford does not hold somebody going with the men: they crossed that night, and so does he' },
  { name: 'a man in the line can be ordered home before it is over', file: 'sim/world.mjs',
    from: "  if (held && input.action !== 'rename') throw new Error(held);", to: '',
    test: 'tests/battle-arrival.test.mjs', expect: 'nobody with the men can be sent anywhere else until they come back with them' },
  { name: 'a Host\'s time jump runs through the fight', file: 'sim/time.mjs',
    from: '  if (fight) return { requestedMinutes, advancedMinutes: 0, blockedBy: `battle:${fight.def.id}`, eventId: null };', to: '',
    test: 'tests/battle-arrival.test.mjs', expect: 'a Host\'s time jump stops at the fight and never passes it' },
  { name: 'a named man is given reconstructed words', file: 'sim/battle-stage.mjs',
    from: "      if (line.name && line.kind === 'reconstructed') fail(`reconstructed line ${line.id} is put in a named person's mouth`);", to: '',
    test: 'tests/battle-stage.test.mjs', expect: 'an engagement is checked when it loads: documented words carry a claim, a named man speaks nothing reconstructed, nobody falls who may not' },
  { name: 'the old dawn moment kept, so the director and the fight disagree about first light', file: 'sim/directors.mjs',
    from: "approach: gonzalesAt('dawn-skirmish'),", to: 'approach: 4680,',
    test: 'tests/battle-stage.test.mjs', expect: 'the fight stands on the director\'s clock: its phases date the old moments, and nothing moves the day' },
  { name: 'an old save is never given the fight', file: 'sim/directors.mjs',
    from: "  armBattle(world, 'gonzales', momentOf(world, GONZALES.startKey));", to: "  if (world.battles) armBattle(world, 'gonzales', momentOf(world, GONZALES.startKey));",
    test: 'tests/battle-stage.test.mjs', expect: 'a class saved in the middle of the fight reopens in the middle of it, and an old save with no record of it gains one from the clock' },
  // Re-aimed 2026-09-26: at twenty minutes a tick the dawn skirmish's taunt is also carried past between two ticks, so the flag
  // test failed with it; three times the phases' steps runs the fight in about two real minutes and lands on every phase.
  { name: 'the fight run three times faster than its steps, over in about two real minutes', file: 'sim/battle-stage.mjs',
    from: '    const step = state.phase.step;', to: '    const step = state.phase.step && state.phase.step * 3;',
    test: 'tests/battle-stage.test.mjs', expect: 'the fighting plays three to six real minutes at the Study pace on both maps, and the clock never runs faster for it' },
  { name: 'a phase\'s later lines are sent before they are said', file: 'sim/battle-stage.mjs',
    from: '      if (at <= minute) said.push({ ...line, minute: at, phase: phase.id });', to: '      said.push({ ...line, minute: at, phase: phase.id });',
    test: 'tests/battle-stage.test.mjs', expect: 'a page is sent nothing that has not happened yet: no later line, shot, fall or phase' },
  { name: 'every family is sent the fight, wherever its people are', file: 'sim/directors.mjs',
    from: '      if (ownAtField(world, householdId).length) battle =', to: '      if (true) battle =',
    test: 'tests/battle-viewers.test.mjs', expect: 'the Host and the families with somebody there watch it live; the town, the farm, a spectator and a reconnect are sent nothing' },
  { name: 'the alert is put again every tick', file: 'sim/directors.mjs',
    from: '      if (!person || battle.alerted[household.id]) continue;', to: '      if (!person) continue;',
    test: 'tests/battle-viewers.test.mjs', expect: 'the family whose man is going is alerted through him before contact, once; nobody else is' },
  { name: 'the town hears every shot of the gun, not the report once for each moment', file: 'sim/directors.mjs',
    from: '      if (heard[phase.id]) continue;', to: '',
    test: 'tests/battle-viewers.test.mjs', expect: 'the town hears the gun - twice, in words - and never the fight; the farm hears nothing' },
  { name: 'the account does not say why it ended as it did', file: 'sim/directors.mjs',
    from: '    `Why it ended so: Castañeda had orders', to: '    `Castañeda had orders',
    test: 'tests/battle-viewers.test.mjs', expect: 'afterwards the family is told through its man what happened, what he did and why it ended so, and the journal keeps it' },
  { name: 'volunteers laid out on a grid', file: 'public/battle-view.js',
    from: '    const a = hash(`${seed}:${tries}:a`), b = hash(`${seed}:${tries}:b`);', to: '    const a = (tries % 8) / 7, b = Math.floor(tries / 8) / 7;',
    test: 'tests/battle-view.test.mjs', expect: 'volunteers are laid out loose and regulars in ranks, and no two loose men stand on one spot' },
  { name: 'the smoke ignores the wind', file: 'public/battle-view.js',
    from: '      vx: w.x * 2.2e-6 + (Math.random() - 0.5) * 2e-7, vy: w.y * 2.2e-6', to: '      vx: (Math.random() - 0.5) * 2e-7, vy: 0',
    test: 'tests/battle-view.test.mjs', expect: 'every man fires on his own cycle, again and again, and the smoke gathers, lingers, drifts with the wind and thins when the firing stops' },
  { name: 'the officer says nothing before a volley', file: 'public/battle-view.js',
    from: "      if (side.fire !== 'volley' || !words) continue;", to: '      continue;',
    test: 'tests/battle-view.test.mjs', expect: 'the officer gives the words of each volley, and every line is drawn over whoever said it at the moment the tick dated it' },
  { name: 'a side the record forbids is drawn falling', file: 'public/battle-view.js',
    from: '      if (battle.noFalling?.includes(fall.side)) continue;', to: '',
    test: 'tests/battle-view.test.mjs', expect: 'a fall is drawn where the record puts one, carried off after; a side that may not fall never does; a family\'s man fires with the force' },
  { name: 'the alert is put up over the family\'s open call', file: 'public/military-attention.js',
    from: '  if (alert && !deciding && own.some(person => person.id === alert.entityId)) {', to: '  if (alert && own.some(person => person.id === alert.entityId)) {',
    test: 'tests/battle-view.test.mjs', expect: 'the card: Watch through the family\'s own person before the fighting, never over an open decision, and the account after' },
  // Keep fighting, speed lead-ups (owner, 2026-09-26; docs/BATTLES.md §2b.11). `expect` may name more than one test when one
  // mistake is rightly seen by each of them; then exactly those fail.
  { name: 'a quiet phase marked on the fighting is accepted', file: 'sim/battle-stage.mjs',
    from: "    if (phase.quiet !== undefined && (phase.quiet !== true || phase.step === undefined || phase.contact)) fail(`phase ${phase.id} is quiet only with a step, and never while it is fought`);", to: '',
    test: QUIET, expect: 'a quiet phase is marked in the data only with a step and never on the fighting, and the fighting of every engagement is held' },
  { name: 'every lead-up held for every class, as before 2026-09-26', file: 'sim/battle-stage.mjs',
    from: '    if (step && state.phase.quiet && !familyThere(world, state)) {', to: '    if (false) {',
    test: QUIET, expect: ['a lead-up goes at the ordinary pace with no played family there, and is held at its step while one has somebody there', 'on a real class the lead-up at Gonzales is held for the family whose man went up the river, and goes faster with nobody there'] },
  { name: 'a played family\'s man in the force is not counted there', file: 'sim/battle-stage.mjs',
    from: '  if (watchedByAFamily(world, state.battle)) return true;\n', to: '',
    test: QUIET, expect: 'a lead-up goes at the ordinary pace with no played family there, and is held at its step while one has somebody there' },
  { name: 'a played family\'s man standing with the force before it records him is not there', file: 'sim/battle-stage.mjs',
    from: '  return people.some(person => places.some(place => Math.hypot(place.x - person.location.x, place.y - person.location.y) <= THERE_MILES));', to: '  return false;',
    test: QUIET, expect: 'a played family\'s man standing with the force before it has recorded him is there, and one half a mile off and more is not' },
  { name: 'a quiet phase with nobody there taken in one odd-sized tick the page snaps', file: 'sim/battle-stage.mjs',
    from: '      const minutes = QUIET_STEPS.find(one => one <= room) ?? 1;', to: '      const minutes = Math.max(1, room);',
    test: QUIET, expect: ['a lead-up goes at the ordinary pace with no played family there, and is held at its step while one has somebody there', 'the fighting is held at its step whoever is there, and a quiet phase before it lands the clock on its first minute'] },
  { name: 'the fighting goes at the class\'s pace with nobody there', file: 'sim/battle-stage.mjs',
    from: '    if (step && state.phase.quiet && !familyThere(world, state)) {', to: '    if (step && (state.phase.quiet || state.phase.contact) && !familyThere(world, state)) {',
    test: QUIET, expect: ['the fighting is held at its step whoever is there, and a quiet phase before it lands the clock on its first minute', 'on a real class the lead-up at Gonzales is held for the family whose man went up the river, and goes faster with nobody there'] },
];

const BROWSER = [
  { name: 'no smoke: a shot leaves nothing behind', file: 'public/battle-view.js',
    from: '    const w = wind || { x: 0, y: 0 };', to: '    return;', expect: 'no smoke on screen' },
  { name: 'the owner\'s finding: every man fires once and freezes', file: 'public/battle-view.js',
    from: '          const t = (time + (slot.phase ?? hash(`${seed}:p`)) * 20000) % cycle;', to: '          const t = Math.min(time, cycle - 1);', expect: 'no shot was fired between two moments' },
  { name: 'the Texians drawn in ranks like the Mexicans', file: 'public/battle-view.js',
    from: "  if (['ranks', 'mounted', 'column', 'wall'].includes(style)) {", to: "  if (['ranks', 'mounted', 'column', 'wall', 'loose'].includes(style)) {", expect: 'the Texian spread is not looser' },
  { name: 'nobody says anything', file: 'public/battle-view.js',
    from: '    const put = (line, at, alpha) => {', to: '    const put = () => {}, unused = (line, at, alpha) => {', expect: 'too few words were drawn' },
  { name: 'the family\'s person stands idle among the men firing', file: 'public/battle-view.js',
    from: '    if (!member.firing) return', to: '    if (true) return', expect: 'never fired' },
  { name: 'the Host is not sent the fight', file: 'sim/directors.mjs',
    from: "      battle = { ...projectBattle(world, 'gonzales', { members: formationMembers(world).map(person => person.id), legacyPhase }), reconstruction: false };", to: '      battle = null;', expect: 'the Host was not sent the fight live' },
  { name: 'the town seven miles off is sent the fight', file: 'sim/directors.mjs',
    from: '      if (ownAtField(world, householdId).length) battle =', to: '      if (true) battle =', expect: 'the family in town was sent the battle' },
  { name: 'no alert', file: 'sim/directors.mjs',
    from: "  let battleAlert = role === 'student' && householdId ? alertFor(world, householdId, state, Boolean(battle)) : null;", to: '  let battleAlert = null;', expect: 'no alert with Watch came' },
  { name: 'Watch does nothing', file: 'public/app.js',
    from: "  if (notice.kind === 'battle') { watchField(world, notice.field); return; }", to: "  if (notice.kind === 'battle') { return; }", expect: 'Watch did not frame the field' },
  { name: 'no account afterwards', file: 'sim/directors.mjs',
    from: "  let battleAccount = role === 'student' && householdId ? accountFor(world, householdId) : null;", to: '  let battleAccount = null;', expect: 'the account never appeared' },
];

const CR = String.fromCharCode(13), LF = String.fromCharCode(10);
function inject(injection, check) {
  const original = readFileSync(injection.file, 'utf8');
  // Written with plain newlines; this working copy is CRLF. A pattern that cannot match is a harness that quietly proves
  // nothing, so it must be found exactly once.
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
  const result = spawnSync(process.execPath, ['scripts/battle-gonzales-browser-proof.mjs'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 30 * 60 * 1000 });
  const output = `${result.stdout}${result.stderr}`;
  const failure = /AssertionError[^:]*: (.+)/.exec(output)?.[1]?.trim() || /Error: (.+)/.exec(output)?.[1]?.trim() || (result.status === 0 ? null : `exit ${result.status}: ${output.slice(-300)}`);
  return { passed: result.status === 0, failure, checks: (output.match(/^PASS /gm) || []).length };
}

const which = process.argv[2] || 'all';
const record = { unit: [], browser: [] };
const evidencePath = 'docs/evidence/battle-injections.json';
let previous = {};
try { previous = JSON.parse(readFileSync(evidencePath, 'utf8')); } catch { /* the first run */ }

if (which === 'all' || which === 'unit') {
  const files = [...new Set(UNIT.map(one => one.test))];
  for (const file of files) { const clean = runUnit(file); if (!clean.passed) throw new Error(`${file} fails before any injection: ${clean.failed.join('; ')}`); }
  for (const injection of UNIT) {
    const seen = inject(injection, () => runUnit(injection.test));
    const expected = [].concat(injection.expect);
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
  for (const injection of BROWSER) {
    const seen = inject(injection, runBrowser);
    const caught = !seen.passed && Boolean(seen.failure?.includes(injection.expect));
    record.browser.push({ name: injection.name, file: injection.file, expect: injection.expect, caught, failure: seen.failure, checksPassedFirst: seen.checks });
    console.log(`${caught ? 'caught' : seen.passed ? 'MISSED' : 'CAUGHT BY ANOTHER CHECK'}: ${injection.name} -> ${seen.failure || 'the gate passed'}`);
  }
  const after = runBrowser();
  if (!after.passed) throw new Error(`The browser gate fails after every file was put back: ${after.failure}`);
}
mkdirSync('docs/evidence', { recursive: true });
const merged = {
  record: 'battle-injections', date: new Date().toISOString().slice(0, 10),
  gates: { unit: 'node --test tests/battle-*.test.mjs, the named test and no other', browser: 'scripts/battle-gonzales-browser-proof.mjs' },
  unit: record.unit.length ? record.unit : previous.unit || [],
  browser: record.browser.length ? record.browser : previous.browser || [],
  cleanBrowserChecks: record.cleanBrowserChecks ?? previous.cleanBrowserChecks ?? null,
  environment: 'Same computer: node --test, and a local classroom server with headless Chrome at 1366x768 and 1024x768.',
};
writeFileSync(evidencePath, `${JSON.stringify(merged, null, 2)}\n`.replace(/\n/g, '\r\n'));
const all = [...merged.unit, ...merged.browser];
console.log(`\n${all.filter(one => one.caught).length} of ${all.length} caught by the check written for them. Wrote ${evidencePath}`);
