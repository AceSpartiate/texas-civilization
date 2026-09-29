// The regressions the owner's three answers of 2026-09-29 are guarded against, injected one at a time (CLAUDE.md: "A new test
// is not evidence until it has failed"): **"Pause after 3 min"** (tests/empty-pause.test.mjs), **"Any played family"**
// (tests/ending.test.mjs, tests/ending-story.test.mjs) and **"Show name + ready"** (tests/lobby-ready.test.mjs,
// tests/host-page.test.mjs). Each injection replaces exact text in one or more files with the mistake a test is written
// against, runs the test files (or, marked `browser`, `npm run test:host-lobby`), records what failed, and puts every file
// back byte for byte.
//
// Run: node scripts/owner-pause-win-lobby-injections.mjs  → docs/evidence/owner-pause-win-lobby-injections.json
// and: node scripts/owner-pause-win-lobby-injections.mjs --browser  → docs/evidence/owner-pause-win-lobby-injections-browser.json
// The browser injections need PLAYWRIGHT_MODULE and BROWSER_EXECUTABLE as every browser proof does.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const FILES = ['tests/empty-pause.test.mjs', 'tests/lobby-ready.test.mjs', 'tests/host-page.test.mjs', 'tests/ending.test.mjs', 'tests/ending-story.test.mjs', 'tests/acting.test.mjs', 'tests/host-live.test.mjs', 'tests/absence.test.mjs', 'tests/wagon-load.test.mjs'];
const withBrowser = process.argv.includes('--browser');

const INJECTIONS = [
  // ---------------------------------------------------------------------------------------------- Pause after 3 min
  { name: 'a class left empty never pauses itself (as before)', edits: [{ file: 'server/app.mjs',
    from: "    try { if (pauseIfEmpty()) return; } catch (error) { console.error('The class could not pause itself:', error.cause?.message || error.message); }\n", to: '' }] },
  { name: 'a class pauses itself with a student\'s page open', edits: [{ file: 'server/app.mjs',
    from: '    if (playerHere()) { emptySince = null; return false; }\n', to: '' }] },
  { name: 'Resume gives a class only what was left of its span', edits: [{ file: 'server/app.mjs',
    from: '    if (!running) { emptySince = null; return; }', to: '    if (!running) return;' }] },
  { name: 'a class in its lobby pauses itself', edits: [{ file: 'server/app.mjs',
    from: '    if (!running) { emptySince = null; return; }', to: "    if (!running) { emptySince = null; if (emptyPauseMs && state.world.status === 'lobby') commit(s => { s.world.status = 'paused'; }); return; }" }] },
  { name: 'the Host is never told why the class paused', edits: [{ file: 'server/app.mjs',
    from: "      ...(emptyPaused?.sessionId === state.sessionId && state.world.status === 'paused' && { emptyPaused: { at: emptyPaused.at, ms: emptyPaused.ms } }),\n", to: '' }] },
  { name: 'a student is sent why the class paused', edits: [{ file: 'server/app.mjs',
    from: '    if (solo) payload.solo = true;\n', to: '    if (solo) payload.solo = true;\n    if (emptyPaused) payload.emptyPaused = emptyPaused;\n' }] },
  { name: 'the reason stays on the Host\'s page after Resume', edits: [
    { file: 'server/app.mjs', from: "emptyPaused?.sessionId === state.sessionId && state.world.status === 'paused' && {", to: 'emptyPaused?.sessionId === state.sessionId && {' },
    { file: 'server/app.mjs', from: "        if (state.world.status !== 'paused') emptyPaused = null;\n", to: '' },
    { file: 'server/app.mjs', from: '  function pauseIfEmpty() {\n    emptyPaused = null;\n', to: '  function pauseIfEmpty() {\n' }] },
  { name: 'the reason is set after the pause is broadcast, so the Host\'s page never hears it', edits: [
    { file: 'server/app.mjs', from: '    emptyPaused = { at: new Date(at).toISOString(), ms: emptyPauseMs, sessionId: state.sessionId };\n    try {', to: '    try {' },
    { file: 'server/app.mjs', from: '    emptySince = null;\n    console.log(`No student', to: '    emptyPaused = { at: new Date(at).toISOString(), ms: emptyPauseMs, sessionId: state.sessionId };\n    emptySince = null;\n    console.log(`No student' }] },
  { name: 'every class in process watches, and the tests and proofs are paused from under them', edits: [{ file: 'server/app.mjs',
    from: 'flashbackDir, emptyPauseMs = null } = {}) {', to: 'flashbackDir, emptyPauseMs = EMPTY_PAUSE_MS } = {}) {' }] },
  { name: 'ten minutes, not the owner\'s three', edits: [{ file: 'server/app.mjs', from: 'export const EMPTY_PAUSE_MS = 180000;', to: 'export const EMPTY_PAUSE_MS = 600000;' }] },
  { name: 'the real classroom server is never given the watch', edits: [{ file: 'server/main.mjs',
    from: "  ...(!solo && { emptyPauseMs: Number(process.env.EMPTY_PAUSE_MS) > 0 ? Number(process.env.EMPTY_PAUSE_MS) : EMPTY_PAUSE_MS }),\n", to: '' }] },
  { name: 'the Host\'s words for the pause are empty', edits: [{ file: 'public/live-page.js',
    from: "  if (!emptyPaused) return '';\n", to: "  return '';\n" }] },
  { name: 'the Host\'s page never shows why the class paused', browser: true, edits: [{ file: 'public/app.js',
    from: "  $('#host-paused').hidden = !pausedWords;\n", to: "  $('#host-paused').hidden = true;\n" }] },
  // ---------------------------------------------------------------------------------------------- Any played family
  { name: 'a played family whose student is away at the end cannot finish first (as before)', edits: [{ file: 'sim/ending.mjs',
    from: '  const contenders = families.filter(family => (!family.automatic || family.finishedByDirector) && !family.wiped);', to: '  const contenders = families.filter(family => !family.automatic && !family.wiped);' }] },
  { name: 'a family the computer finished is not marked so', edits: [{ file: 'sim/ending.mjs',
    from: '      ...(automatic(world, household) && household.played && { finishedByDirector: true }),\n', to: '' }] },
  { name: 'the Host\'s table says nobody played a family the computer finished (as before)', edits: [{ file: 'public/ending.js',
    from: 'export const familyLabel = family => family.finishedByDirector ? `${family.name} (finished by the computer)` : family.automatic', to: 'export const familyLabel = family => family.automatic' }] },
  { name: 'the standings between periods drop the mark', edits: [{ file: 'sim/ending.mjs',
    from: ', ...(one.finishedByDirector && { finishedByDirector: true })', to: '' }] },
  { name: 'a family whose people are all dead or prisoners can be named the winner (as before)', edits: [{ file: 'sim/ending.mjs',
    from: '      ...(nobodyLeft(world, household) && { wiped: true }),', to: '      ...(livingOf(world, household) === 0 && { wiped: true }),' }] },
  { name: 'a prisoner stops counting among the family\'s living for the prisoners\' share', edits: [{ file: 'sim/ending.mjs',
    from: "const livingOf = (world, household) => household.members.filter(id => world.entities[id] && world.entities[id].health?.condition !== GONE_FOR_GOOD).length;",
    to: "const livingOf = (world, household) => household.members.filter(id => world.entities[id] && !['dead', 'captured'].includes(world.entities[id].health?.condition)).length;" }] },
  { name: 'the class\'s debrief leaves out a family the computer finished (as before)', edits: [{ file: 'sim/ending-story.mjs',
    from: 'const namedFamilies = world => Object.values(world.households).filter(household => household.played);', to: 'const namedFamilies = world => Object.values(world.households).filter(household => household.played && !household.absent);' }] },
  { name: 'the class\'s debrief names a family nobody played', edits: [{ file: 'sim/ending-story.mjs',
    from: 'const namedFamilies = world => Object.values(world.households).filter(household => household.played);', to: 'const namedFamilies = world => Object.values(world.households);' }] },
  // ---------------------------------------------------------------------------------------------- Show name + ready
  { name: 'the Host is not sent the students\' names', edits: [{ file: 'server/app.mjs', from: '      students[id] = client.name;\n', to: '' }] },
  { name: 'nobody is ever marked ready', edits: [{ file: 'sim/host.mjs', from: '    ...(readyInLobby(world, household) && { ready: true }),\n', to: '' }] },
  { name: 'a family made but not packed is ready', edits: [{ file: 'sim/host.mjs', from: 'Boolean(household.played && household.roll && household.packed)', to: 'Boolean(household.played && household.roll)' }] },
  { name: 'a family packed but never made is ready', edits: [{ file: 'sim/host.mjs', from: "Boolean(household.played && household.roll && household.packed) && !familyMaking(world, household);", to: 'Boolean(household.played && household.packed);' }] },
  { name: 'the ready mark stays after Start', edits: [{ file: 'sim/host.mjs', from: "export const readyInLobby = (world, household) => world.status === 'lobby' && ", to: 'export const readyInLobby = (world, household) => ' }] },
  { name: 'a new load after Done packing keeps the mark', edits: [{ file: 'sim/world.mjs', from: 'setLoad(world, household, input.item, input.amount); delete household.packed; return;', to: 'setLoad(world, household, input.item, input.amount); return;' }] },
  { name: 'a new stock choice after Done packing keeps the mark', edits: [{ file: 'sim/world.mjs', from: 'setStock(world, household, input.stock); delete household.packed; return;', to: 'setStock(world, household, input.stock); return;' }] },
  { name: 'Done packing is taken after Start', edits: [{ file: 'sim/wagon.mjs', from: "  if (world.status !== 'lobby') throw new Error('The wagon has already left: there is nothing more to pack.');\n", to: '' }] },
  { name: 'a save may hold any packed mark', edits: [{ file: 'sim/world.mjs', from: "    if (household.packed !== undefined && household.packed !== true) throw new Error('Invalid packed marker');\n", to: '' }] },
  { name: 'the Host\'s rows carry no student\'s name', edits: [{ file: 'public/live-page.js', from: "    student: presence?.students?.[family.id] || '',", to: "    student: ''," }] },
  { name: 'the Host\'s rows carry no ready mark', edits: [{ file: 'public/live-page.js', from: '    ready: Boolean(family.ready),', to: '    ready: false,' }] },
  { name: 'Done packing in a class is never told to the server (as before)', browser: true, edits: [{ file: 'public/app.js',
    from: "action: 'done-packing' }); }", to: "action: 'seen-tip', tip: 'none' }); }" }] },
  { name: 'the Host\'s page draws no ready mark', browser: true, edits: [{ file: 'public/app.js',
    from: "      if (row.ready) { const ready = element('span', 'ready', 'host-ready');", to: "      if (false) { const ready = element('span', 'ready', 'host-ready');" }] },
];

const failing = output => [...output.matchAll(/^✖ (.+?) \(\d/gm)].map(match => match[1]).filter((name, i, all) => name !== 'failing tests:' && all.indexOf(name) === i);
const runTests = () => { const result = spawnSync(process.execPath, ['--test', ...FILES], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }); return failing(`${result.stdout}${result.stderr}`); };
const runBrowser = () => {
  const result = spawnSync(process.execPath, ['scripts/host-lobby-pause-browser-proof.mjs'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 300000 });
  if (result.status === 0) return [];
  const passed = [...`${result.stdout}`.matchAll(/^PASS (.+)$/gm)].length;
  const why = `${result.stderr}`.split('\n').find(line => /Error|assert|Timeout/.test(line)) || `exit ${result.status}`;
  return [`test:host-lobby failed after ${passed} checks: ${why.trim().slice(0, 240)}`];
};

const clean = runTests();
if (clean.length) throw new Error(`The tests fail before any injection: ${clean.join('; ')}`);
const record = [];
for (const injection of INJECTIONS) {
  // The node tests' injections, or with --browser the page's alone (each a whole browser proof, about a minute).
  if (Boolean(injection.browser) !== withBrowser) continue;
  const originals = new Map();
  const CR = String.fromCharCode(13), LF = String.fromCharCode(10);
  try {
    for (const edit of injection.edits) {
      if (!originals.has(edit.file)) originals.set(edit.file, readFileSync(edit.file, 'utf8'));
      const text = readFileSync(edit.file, 'utf8');
      const count = needle => text.split(needle).length - 1;
      // Written with LF; a file checked out with CRLF has the same lines with CR before each LF.
      const crlf = !count(edit.from) && count(edit.from.split(LF).join(CR + LF));
      const from = crlf ? edit.from.split(LF).join(CR + LF) : edit.from, to = crlf ? edit.to.split(LF).join(CR + LF) : edit.to;
      if (count(from) !== 1) throw new Error(`${injection.name}: the text to replace is in ${edit.file} ${count(from)} times`);
      writeFileSync(edit.file, text.replace(from, to));
    }
    const failed = injection.browser ? runBrowser() : runTests();
    record.push({ name: injection.name, files: [...originals.keys()], ...(injection.browser && { browser: true }), failed });
    console.log(`${failed.length ? 'caught' : 'MISSED'}: ${injection.name} -> ${failed.join(' | ') || 'nothing failed'}`);
  } finally { for (const [file, text] of originals) writeFileSync(file, text); }
}
if (runTests().length) throw new Error('The tests fail after every file was put back');
mkdirSync('docs/evidence', { recursive: true });
const out = `docs/evidence/owner-pause-win-lobby-injections${withBrowser ? '-browser' : ''}.json`;
writeFileSync(out, `${JSON.stringify({ record: 'owner-pause-win-lobby-injections', date: new Date().toISOString().slice(0, 10), files: FILES, ...(withBrowser && { browser: 'npm run test:host-lobby' }), injections: record }, null, 2)}\n`);
console.log(`\n${record.filter(r => r.failed.length).length} of ${record.length} caught; wrote ${out}`);
