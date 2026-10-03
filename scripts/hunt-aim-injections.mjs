// The regressions the shot aimed by the student (owner, 2026-10-02; sim/hunt-aim.mjs, public/hunt-aim.js) is guarded against,
// injected one at a time (CLAUDE.md: "A new test is not evidence until it has failed"): each replaces exact text with the mistake,
// runs the check written for it - tests/hunt-aim.test.mjs, or with --browser `npm run test:hunt-aim` - records what failed, and
// puts every file back byte for byte.
//
// Run: node scripts/hunt-aim-injections.mjs           → docs/evidence/hunt-aim-injections.json
// and: node scripts/hunt-aim-injections.mjs --browser → docs/evidence/hunt-aim-injections-browser.json
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const withBrowser = process.argv.includes('--browser');
const C = 'sim/chores.mjs', A = 'sim/hunt-aim.mjs', B = 'sim/decision-budget.mjs', P = 'public/hunt-aim.js';
const one = (file, from, to) => ({ file, from, to });
const INJECTIONS = [
  // ------------------------------------------------------------------ the server (tests/hunt-aim.test.mjs)
  { name: 'the shot is asked with nothing sighted beside it', edits: [one(C, "        ...(step.ask === 'shot' && { sight: sightingOf(world, household, entity) }),\n", '')] },
  { name: 'the sighting waits the ninety seconds of a work question', edits: [one(B, "(ask?.id === 'shot' ? (ask.aim ? 'aim' : 'sighting') : 'work')", "(ask?.id === 'shot' ? (ask.aim ? 'aim' : 'work') : 'work')")] },
  { name: 'the sighting\'s window is ninety seconds', edits: [one(B, 'sighting: 15_000', 'sighting: 90_000')] },
  { name: 'a sighting nobody took up lapses with nothing chosen, as before', edits: [one(C, "    else if (state.ask.id === 'shot') settleAsk(world, household, entity, autoChoice(world, household, entity), household.absent ? 'auto' : 'silence');\n", '')] },
  { name: 'the server takes the page\'s moment on trust', edits: [one(C, '  const at = boundedT(t, Math.max(0, now - ask.aim.startedAt));', '  const at = t;')] },
  { name: 'a page may fire with the field never opened', edits: [one(C, "  if (ask?.id !== 'shot' || !ask.aim) throw new Error('Nothing is in the sights.');", "  if (ask?.id !== 'shot') throw new Error('Nothing is in the sights.');\n  ask.aim ??= { startedAt: now - t, calm: false };")] },
  { name: 'one animal may be shot at twice', edits: [one(C, "  const state = entity.chore;\n  state.ask = null;\n  state.flags = [...(state.flags || []), 'aimed',", "  const state = entity.chore;\n  state.flags = [...(state.flags || []), 'aimed',")] },
  { name: 'any shot at an animal in view hits', edits: [one(A, '  return { hit: inView && reach <= 1,', '  return { hit: inView,')] },
  { name: 'a missed animal does not run', edits: [one(C, '  if (!judged.hit && state.quarry) state.quarry = { ...state.quarry, fled: true };\n', '')] },
  { name: 'an aimed shot is not fired: no powder, no kill', edits: [one(C, "export const SHOOTS = Object.freeze(['take', 'wait', 'aimed']);", "export const SHOOTS = Object.freeze(['take', 'wait']);")] },
  { name: 'a miss brings the kill home all the same', edits: [one(C, "      if (aimed ? !(state.flags || []).includes('hit') : !close && !steadyHand(entity) && !trueRifle) {", '      if (aimed ? false : !close && !steadyHand(entity) && !trueRifle) {')] },
  { name: 'letting it go fires the rifle', edits: [one(C, "  state.flags = [...(state.flags || []), 'fled', 'empty'];", "  state.flags = [...(state.flags || []), 'aimed', 'empty'];")] },
  { name: 'a shot after the animal has gone is judged as a shot', edits: [one(C, "  if (judged.phase === 'gone' || judged.phase === 'waiting') return letItGo(world, household, entity, 'gone');\n", '')] },
  { name: 'the aim is opened with no powder in the house', edits: [one(C, '  return powder.can ? null : powder.why;\n}', '  return null;\n}')] },
  { name: 'a hunter on auto may be aimed by the student', edits: [one(C, "  if (entity.auto) return `${entity.name} is on auto, and takes the shot as they judge it.`;\n", '')] },
  { name: 'the server ignores the page\'s less motion', edits: [one(C, '  ask.aim = { startedAt: now, calm: Boolean(calm) };', '  ask.aim = { startedAt: now, calm: false };')] },
  { name: 'the sighting goes to every page on the map', edits: [one('sim/overview.mjs', '...(entity.chore.quarry && { quarry: entity.chore.quarry })', '...(entity.chore.quarry && { quarry: entity.chore.quarry }), ...(entity.chore.ask && { ask: entity.chore.ask })')] },
  { name: 'an open field never closes', edits: [one(B, 'aim: 30_000', 'aim: 3_000_000')] },
  { name: 'a field opened and never fired is fired by the hunter himself', edits: [one(C, "    if (state.ask.aim) letItGo(world, household, entity, 'unfired');\n    else if", '    if')] },
  { name: 'the sighting\'s "!" is a plain work question', edits: [one('public/family-panel.js', "if (!entity.chore.ask.aim) needs.push({ kind: 'sighting',", "if (!entity.chore.ask.aim) needs.push({ kind: 'asking',")] },
  { name: 'the sighting has no card', edits: [one('public/military-attention.js', "  sighting: { title: person =>", "  sightingLost: { title: person =>")] },
  { name: 'the alert stays up while the student is aiming', edits: [one('public/family-panel.js', "{ if (!entity.chore.ask.aim) needs.push({ kind: 'sighting',", "{ if (true) needs.push({ kind: 'sighting',")] },
  { name: 'the best shot\'s sights wander most', edits: [one(A, 'export const SWAY = Object.freeze({ 1: 0.5, 2: 0.3, 3: 0.16 });', 'export const SWAY = Object.freeze({ 1: 0.16, 2: 0.3, 3: 0.5 });')] },
  { name: 'damp powder fires at once', edits: [one(A, '  const at = t + path.hangMs;', '  const at = t;')] },
  { name: 'a broken sighting is saved', edits: [one('sim/world.mjs', "    if (sight !== undefined && (typeof sight?.seed !== 'string' || !GAME[sight.quarry] || !['timber', 'brush', 'open'].includes(sight.cover) || !(sight.hand?.sway >= 0) || !(sight.hand.hangMs >= 0))) throw new Error('Invalid sighting');\n", '')] },
  // ------------------------------------------------------------------ the page (npm run test:hunt-aim)
  { name: 'the card\'s button only goes to the hunter, as the other cards do', browser: true, edits: [one('public/app.js', "  else openNeed(notice.entityId, notice.kind === 'sighting' ? 'sighting' : null);", "  else if (notice.kind !== 'sighting') openNeed(notice.entityId);")] },
  { name: 'the "!" does not open the field', browser: true, edits: [one('public/app.js', "  if (need?.kind === 'sighting' && takeTheShot(world, id)) return;\n", '')] },
  { name: 'the arrow keys do not move the sights', browser: true, edits: [one(P, "    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Shift'].includes(event.key)) { keys.add(event.key); event.preventDefault(); }\n    else if", '    if')] },
  { name: 'the page never tells the server it asked for less motion', browser: true, edits: [one(P, "    send({ action: 'aim-shot', entityId, calm })", "    send({ action: 'aim-shot', entityId })")] },
  { name: 'the missed deer is drawn standing on the map', browser: true, edits: [one('public/app.js', '  if (fled && QUARRY_RUN[kind] && animated(ctx, QUARRY_RUN[kind], x, y, size, seed, { flip })) return;\n', '')] },
  { name: 'a click does not fire', browser: true, edits: [one(P, "    if (event.pointerType !== 'touch' && event.button === 0) { event.preventDefault(); fire(); }", '')] },
];

const failing = output => [...output.matchAll(/^✖ (.+?) \(\d/gm)].map(match => match[1]).filter((name, i, all) => name !== 'failing tests:' && all.indexOf(name) === i);
const runTests = () => { const result = spawnSync(process.execPath, ['--test', 'tests/hunt-aim.test.mjs'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }); return failing(`${result.stdout}${result.stderr}`); };
const runProof = () => {
  const result = spawnSync(process.execPath, ['scripts/hunt-aim-browser-proof.mjs'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 900000 });
  if (result.status === 0) return [];
  const passed = [...`${result.stdout}`.matchAll(/^PASS (.+)$/gm)].length;
  const why = `${result.stderr}`.split('\n').find(line => /Error|assert|Timeout/.test(line)) || `exit ${result.status}`;
  return [`the proof failed after ${passed} checks: ${why.trim().slice(0, 220)}`];
};
if (runTests().length) throw new Error('The tests fail before any injection');
const record = [];
const CR = String.fromCharCode(13), LF = String.fromCharCode(10);
for (const injection of INJECTIONS) {
  if (withBrowser !== Boolean(injection.browser)) continue;
  const originals = new Map();
  try {
    for (const edit of injection.edits) {
      if (!originals.has(edit.file)) originals.set(edit.file, readFileSync(edit.file, 'utf8'));
      const text = readFileSync(edit.file, 'utf8');
      const count = needle => text.split(needle).length - 1;
      const crlf = !count(edit.from) && count(edit.from.split(LF).join(CR + LF));
      const from = crlf ? edit.from.split(LF).join(CR + LF) : edit.from, to = crlf ? edit.to.split(LF).join(CR + LF) : edit.to;
      if (count(from) !== 1) throw new Error(`${injection.name}: the text to replace is in ${edit.file} ${count(from)} times`);
      writeFileSync(edit.file, text.replace(from, to));
    }
    const failed = withBrowser ? runProof() : runTests();
    record.push({ name: injection.name, files: [...originals.keys()], caught: failed.length > 0, failed });
    console.log(`${failed.length ? 'caught' : 'MISSED'}: ${injection.name} -> ${failed.join(' | ') || 'nothing failed'}`);
  } finally { for (const [file, text] of originals) writeFileSync(file, text); }
}
if (runTests().length) throw new Error('The tests fail after every file was put back');
mkdirSync('docs/evidence', { recursive: true });
const out = `docs/evidence/hunt-aim-injections${withBrowser ? '-browser' : ''}.json`;
writeFileSync(out, `${JSON.stringify({ record: 'hunt-aim-injections', date: new Date().toISOString().slice(0, 10), injections: record }, null, 2)}\n`);
console.log(`\n${record.filter(r => r.caught).length} of ${record.length} caught; wrote ${out}`);
