// The regressions the checks of 2026-09-30 guard - the fight's real-time floor, black-powder smoke, the film of a fight on the
// class view, and what the Host may know while it films (docs/BATTLES.md §15) - injected one at a time (CLAUDE.md: "A new test
// is not evidence until it has failed"). Each injection replaces exact text (found exactly once, CRLF or not; `also` for a second
// place), runs the check written for it, records what stopped it, and puts every file back byte for byte.
//
// A unit injection runs its test file and requires the named test, and no other in the file, to fail. A browser injection runs
// scripts/battle-cinema-browser-proof.mjs and requires its failure to carry the message written for that check. Each gate is
// run clean first and again at the end. Same computer.
// Run: node scripts/battle-cinema-injections.mjs [unit|browser]  -> docs/evidence/battle-cinema-injections.json
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const FLOOR = 'tests/battle-floor.test.mjs', SMOKE = 'tests/battle-smoke.test.mjs', FILM = 'tests/battle-cinema.test.mjs', KNOW = 'tests/host-battle-knowledge.test.mjs';
const UNIT = [
  // The floor.
  { name: 'a fight floored under three seconds a tick', file: 'sim/battle-stage.mjs', from: "'goliad-massacre': 90,", to: "'goliad-massacre': 60,",
    test: FLOOR, expect: 'every fight has a floor, and at every pace its fighting is watched at least that long and never faster than before' },
  { name: 'the lead-ups floored too', file: 'sim/battle-stage.mjs', from: '    if (!fightingPhase(state.phase)) continue;', to: '    if (!state.phase?.step) continue;',
    test: FLOOR, expect: 'the clock asks for the floor exactly while the fighting is fought, and Gonzales at Quick lasts its two minutes' },
  { name: 'the server tells the floor and never waits it', file: 'server/app.mjs', from: '    const want = tickEvery();', to: '    const want = pace;',
    test: FLOOR, expect: 'the server waits the floor between the fighting ticks and tells the page the tick and the pace apart; a test class keeps its pace' },
  { name: 'the real server not given the floor', file: 'server/main.mjs', from: "  battleFloors: process.env.BATTLE_FLOORS !== '0',", to: '',
    test: FLOOR, expect: 'the real server floors its fights; the pace buttons read the pace, not the tick' },
  // The smoke.
  { name: 'the banks never thicker than half', file: 'public/battle-view.js', from: 'const bankAlpha = density => Math.min(0.82,', to: 'const bankAlpha = density => Math.min(0.5,',
    test: SMOKE, expect: 'the smoke builds up under repeated fire until the firing line stands hidden in it, and is drawn over the men' },
  { name: 'the banks never thin', file: 'public/battle-view.js', from: '      bank.d *= Math.exp(-dt / (bank.big ? CANNON_BANK_FADE_MS : BANK_FADE_MS));', to: '      bank.d *= 1;',
    test: SMOKE, expect: 'the smoke drifts with the wind, lingers tens of seconds after the fire stops, and thins slowly away' },
  { name: 'a gun\'s shot no more smoke than a musket\'s', file: 'public/battle-view.js', from: '    feedBank(x, y, big ? 1.1 : 0.6, now, w, big);', to: '    feedBank(x, y, 0.6, now, w, false);',
    test: SMOKE, expect: 'a gun makes a bank of its own that outlasts a musket\'s' },
  { name: 'a bank for every shot past the cap', file: 'public/battle-view.js', from: '    if (!near && view.banks.length >= BANK_CAP)', to: '    if (false && !near && view.banks.length >= BANK_CAP)',
    test: SMOKE, expect: 'however long the firing, the smoke on the field stays bounded' },
  { name: 'no haze for less motion', file: 'public/battle-view.js', from: '    if (reducedMotion) {\n      // Less motion:', to: '    if (false) {\n      // Less motion:',
    test: SMOKE, expect: 'for less motion nothing grows or drifts: a still haze stands over the lines that are firing' },
  // The film.
  { name: 'no establishing shot from far off', file: 'public/battle-cinema.js', from: '        const wide = { ...c.field, scale: c.field.scale / CINEMA.wideOut };', to: '        const wide = { ...c.field };',
    test: FILM, expect: 'on the Host it starts by itself: a fade to black, the field from far off with a title, pushing in, and the fade up' },
  { name: 'the camera kept on a man shown hit', file: 'public/battle-cinema.js', from: "          if (id && id !== 'field' && (!one || one.fallen)) { nextShot(input, now); break; }", to: '',
    also: [{ from: '    if (!one || one.fallen || !Number.isFinite(one.x)) { c.followed = null; return field; }', to: '    if (!one || !Number.isFinite(one.x)) { c.followed = null; return field; }' }],
    test: FILM, expect: 'it follows the field and each of the class\'s own people in turn, gliding, and never stays on one shown hit' },
  { name: 'no hold on the field before the fade', file: 'public/battle-cinema.js', from: '          if (now - c.since >= CINEMA.holdMs + (c.reduced ? 0 : CINEMA.fadeOutMs))', to: '          if (now - c.since >= (c.reduced ? 0 : CINEMA.fadeOutMs))',
    test: FILM, expect: 'when the fighting is over it holds on the field while the smoke clears, fades, and puts the teacher\'s view back' },
  { name: 'a fight gone from the map cuts the film off', file: 'public/battle-cinema.js', from: "          if (!input.field) { go('closing', now); break; }", to: "          if (!input.field) { go('off', now); break; }",
    test: FILM, expect: 'when the fighting is over it holds on the field while the smoke clears, fades, and puts the teacher\'s view back' },
  { name: 'the film takes the camera back from the teacher', file: 'public/battle-cinema.js', from: "        case 'released':\n          if (over || !input.field)", to: "        case 'released':\n          if (true || over || !input.field)",
    test: FILM, expect: 'the teacher takes the camera at any moment, keeps it for that fight, and can give it back; nothing is put back after' },
  { name: 'the film goes on over the end of the game', file: 'public/battle-cinema.js', from: '      if (input.ended) {', to: '      if (false && input.ended) {',
    test: FILM, expect: 'the end of the game stops it at once; another fight sent in its place is cut to through black; less motion cuts' },
  { name: 'a student\'s camera taken without Watch', file: 'public/battle-cinema.js', from: "          if (input.focus && input.field && mode === 'host') begin(input, now);", to: '          if (input.focus && input.field) begin(input, now);',
    test: FILM, expect: 'a student\'s page never starts it by itself; Watch starts the follow on the family\'s own, with no fade and no title' },
  { name: 'every family the same colour', file: 'public/battle-cinema.js', from: '  return FAMILY_COLOURS[(Number.isFinite(n) && n > 0 ? n - 1 : 0) % FAMILY_COLOURS.length];', to: '  return FAMILY_COLOURS[0];',
    test: FILM, expect: 'each family keeps one colour, told apart from the next' },
  // What the Host may know.
  { name: 'a fate sent before its minute', file: 'sim/battle-stage.mjs', from: '    const fell = Object.fromEntries(members.filter(one => fates[one] && fates[one].minute <= world.minute)', to: '    const fell = Object.fromEntries(members.filter(one => fates[one])',
    test: KNOW, expect: 'the Host is shown a family\'s man in the fight from the start and his fate only from its minute: nothing on its wire says it sooner' },
];
const BROWSER = [
  { name: 'the floor not kept by the server', file: 'server/app.mjs', from: "    if (!battleFloors || state.world.status !== 'running') return pace;", to: '    return pace;', expect: 'the fighting\'s ticks were not held to the floor' },
  { name: 'no fade to black into the fight', file: 'public/battle-cinema.js', from: "      if (c.state === 'opening' || c.state === 'recut') return Math.min(1, t / CINEMA.fadeOutMs);", to: '', expect: 'no fade to black before the fight' },
  { name: 'every family the same colour on the class view', file: 'public/app.js', from: "colour: familyColour(entity.householdId) });", to: "colour: familyColour('hh-1') });", expect: 'names without their family or its colour' },
  { name: 'Esc does nothing', file: 'public/app.js', from: "  if (event.key !== 'Escape' || event.defaultPrevented) return;", to: '  return;', expect: 'Esc did not take the camera' },
  { name: 'faded for less motion', file: 'public/battle-cinema.js', from: '      if (c.reduced) return 0;\n      const t = now - c.since;', to: '      const t = now - c.since;', expect: 'a page asking for less motion was faded' },
  { name: 'the camera not put back', file: 'public/app.js', from: '  if (back) { manualView = back.view', to: '  if (false) { manualView = back.view', expect: 'the camera was not put back' },
  { name: 'the smoke gone soon after the firing', file: 'public/battle-view.js', from: 'BANK_MAX = 6, BANK_GONE = 0.035;', to: 'BANK_MAX = 6, BANK_GONE = 1.5;', expect: 'the smoke did not lie on the field twenty seconds' },
];

const CR = String.fromCharCode(13), LF = String.fromCharCode(10);
function inject(injection, check) {
  const original = readFileSync(injection.file, 'utf8');
  const ends = text => (original.includes(CR + LF) ? text.split(LF).join(CR + LF) : text);
  let changed = original;
  for (const one of [injection, ...(injection.also || [])]) {
    const from = ends(one.from), to = ends(one.to);
    const count = changed.split(from).length - 1;
    if (count !== 1) throw new Error(`${injection.name}: the text to replace is in ${injection.file} ${count} times`);
    changed = changed.replace(from, () => to);
  }
  writeFileSync(injection.file, changed);
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
  const result = spawnSync(process.execPath, ['scripts/battle-cinema-browser-proof.mjs'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 30 * 60 * 1000 });
  const output = `${result.stdout}${result.stderr}`;
  const failure = /AssertionError[^:]*: (.+)/.exec(output)?.[1]?.trim() || /Error: (.+)/.exec(output)?.[1]?.trim() || (result.status === 0 ? null : `exit ${result.status}: ${output.slice(-300)}`);
  return { passed: result.status === 0, failure, checks: (output.match(/^PASS /gm) || []).length };
}

const which = process.argv[2] || 'all';
const record = { unit: [], browser: [] };
const evidencePath = 'docs/evidence/battle-cinema-injections.json';
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
    record.browser.push({ name: injection.name, file: injection.file, expect: injection.expect, caught, failure: seen.failure?.slice(0, 400), checksPassedFirst: seen.checks });
    console.log(`${caught ? 'caught' : seen.passed ? 'MISSED' : 'CAUGHT BY ANOTHER CHECK'}: ${injection.name} -> ${seen.failure?.slice(0, 300) || 'the gate passed'}`);
  }
  const after = runBrowser();
  if (!after.passed) throw new Error(`The browser gate fails after every file was put back: ${after.failure}`);
}
mkdirSync('docs/evidence', { recursive: true });
const merged = {
  record: 'battle-cinema-injections', date: new Date().toISOString().slice(0, 10),
  gates: { unit: `${FLOOR}, ${SMOKE}, ${FILM}, ${KNOW}: the named test and no other`, browser: 'scripts/battle-cinema-browser-proof.mjs' },
  unit: record.unit.length ? record.unit : previous.unit || [],
  browser: record.browser.length ? record.browser : previous.browser || [],
  cleanBrowserChecks: record.cleanBrowserChecks ?? previous.cleanBrowserChecks ?? null,
  environment: 'Same computer: node --test, and a local classroom server with headless Chrome at 1366x768 and 1024x600.',
};
writeFileSync(evidencePath, `${JSON.stringify(merged, null, 2)}\n`);
const all = [...merged.unit, ...merged.browser];
console.log(`\n${all.filter(one => one.caught).length} of ${all.length} caught by the check written for them. Wrote ${evidencePath}`);
