// Each test of the end sequence watched failing (CLAUDE.md: "A new test is not evidence until it has failed"; owner, 2026-09-29, D10
// and D8). Every injection below is the exact regression a test guards, put into the code; the test file is run; the test named must
// fail, and every other test in the file must still pass (or those `also` names); then the code is put back. The classes the story
// tests read are played once and kept for the run (FLASHBACK_FIXTURE, CLASS_FIXTURE), so each injection takes seconds.
//
// Run: node scripts/end-sequence-injections.mjs  → docs/evidence/end-sequence-injections.json
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { endedClass } from '../tests/support/ended-class.mjs';

const folder = mkdtempSync(join(tmpdir(), 'end-sequence-injections-'));
const flashbackFixture = join(folder, 'flashback.json'), classFixture = join(folder, 'class.json');
writeFileSync(flashbackFixture, JSON.stringify(endedClass('flashback-test', 5, { played: 2 })));
writeFileSync(classFixture, JSON.stringify(endedClass('end-scenes', 6, { played: 4 })));

const SEQ = 'tests/end-sequence.test.mjs', FARM = 'tests/farm-sale.test.mjs', SCENES = 'tests/end-scenes.test.mjs', STORY = 'tests/flashback.test.mjs', DEBRIEF = 'tests/ending-debrief.test.mjs';
const INJECTIONS = [
  // The sequence: its stages, what moves them, what a page may ask, and the numbers held back until the reveal.
  { file: 'sim/ending.mjs', test: SEQ, fails: 'no page is sent a number of the ending before the reveal', also: ['on the server'], from: '  if (!revealed(world)) return {};\n', to: '' },
  // The families' stage on the server's clock (owner, 2026-09-30: "there shouldn't be a wait. the videos are supposed to autoplay").
  { file: 'sim/end-sequence.mjs', test: SEQ, fails: 'the class video, then the families', also: ['on the server', 'start as it ends'], from: 'const playAt = Math.max(now, lastMade + START_MS);', to: 'const playAt = now;' },
  // The families' start never before the class video has ended, and as it ends when every video is ready (owner, 2026-09-30).
  { file: 'sim/end-sequence.mjs', test: SEQ, fails: 'never start before the class video has finished', also: ['the class video, then the families', 'on the server'], from: 'const playAt = Math.max(now, lastMade + START_MS);', to: 'const playAt = now + START_MS;' },
  { file: 'sim/end-sequence.mjs', test: SEQ, fails: 'never start before the class video has finished', also: ['the class video, then the families', 'on the server'], from: 'const playAt = Math.max(now, lastMade + START_MS);', to: 'const playAt = Math.max(now, lastMade);' },
  { file: 'sim/end-sequence.mjs', test: SEQ, fails: 'never start before the class video has finished', also: ['the class video, then the families', 'on the server'], from: "    if (!video && now >= sequence.since + CLASS_WAIT_MS) return { stage: 'family' };\n    return null;", to: "    if (!video && now >= sequence.since + CLASS_WAIT_MS) return { stage: 'family' };\n    { const clock = familyClock(sequence, facts, now); return clock?.reveal ? null : clock; }" },
  // Two at once, the class's alone and first (owner, 2026-09-30: "make two at once").
  { file: 'public/making-plan.js', test: SEQ, fails: 'makes the class\'s video alone and first', from: 'export const MAKE_AT_ONCE = 2;', to: 'export const MAKE_AT_ONCE = 1;' },
  { file: 'public/making-plan.js', test: SEQ, fails: 'makes the class\'s video alone and first', from: '  if (making.has(CLASS_ID)) return [];\n', to: '' },
  { file: 'public/making-plan.js', test: SEQ, fails: 'makes the class\'s video alone and first', from: '  if (wanted.includes(CLASS_ID)) return making.size ? [] : [CLASS_ID];\n', to: '' },
  { file: 'public/making-plan.js', test: SEQ, fails: 'makes the class\'s video alone and first', from: '.slice(0, Math.max(0, atOnce - making.size));', to: '.slice(0, atOnce);' },
  { file: 'sim/end-sequence.mjs', test: SEQ, fails: 'the class video, then the families', also: ['on the server', 'start as it ends'], from: 'Math.max(...made.map(fact => fact.made.durationMs))', to: 'Math.min(...made.map(fact => fact.made.durationMs))' },
  { file: 'sim/end-sequence.mjs', test: SEQ, fails: 'the class video, then the families', from: 'const open = Object.values(facts.families || {}).filter(fact => fact.here);', to: 'const open = Object.values(facts.families || {});' },
  { file: 'sim/end-sequence.mjs', test: SEQ, fails: 'the class video, then the families', from: 'if ((!open.length || made.length < open.length) && now < sequence.since + MAKE_WAIT_MS) return null;', to: 'if (!open.length || made.length < open.length) return null;' },
  { file: 'sim/end-sequence.mjs', test: SEQ, fails: 'the class video, then the families', from: 'if ((!open.length || made.length < open.length) && now < sequence.since + MAKE_WAIT_MS) return null;', to: 'if (made.length < open.length && now < sequence.since + MAKE_WAIT_MS) return null;' },
  { file: 'sim/end-sequence.mjs', test: SEQ, fails: 'the class video, then the families', also: ['on the server'], from: "if (Number.isFinite(sequence.endsAt)) return now >= sequence.endsAt ? { reveal: true } : null;", to: "if (Number.isFinite(sequence.endsAt)) return now >= sequence.endsAt + 60000 ? { reveal: true } : null;" },
  { file: 'sim/end-sequence.mjs', test: SEQ, fails: 'the class video, then the families', from: "    if (!fact.here) out[id] = 'away';", to: "    if (!fact.here) out[id] = 'making';" },
  { file: 'sim/end-sequence.mjs', test: SEQ, fails: 'the class video, then the families', also: ['on the server'], from: "playIn: sequence.playAt - now, endsIn: sequence.endsAt - now", to: "playIn: sequence.playAt, endsIn: sequence.endsAt" },
  { file: 'server/app.mjs', test: SEQ, fails: 'on the server: the Host ends the class', from: "    if (state.world.status !== 'ended' || closing) return;\n    try { endSequenceTick(); }", to: "    if (true) return;\n    try { endSequenceTick(); }" },
  { file: 'server/app.mjs', test: SEQ, fails: 'on the server: the Host ends the class', from: "families[id] = { here: households[id] === 'here', made: video(made[id], SCRIPT_VERSION) };", to: "families[id] = { here: households[id] === 'here', made: null };" },
  { file: 'sim/end-sequence.mjs', test: SEQ, fails: 'the class video, then the families', also: ['what a page may ask'], from: "stage: !keeps ? 'reveal' : solo ? 'family' : 'class'", to: "stage: !keeps ? 'reveal' : 'class'" },
  { file: 'sim/end-sequence.mjs', test: SEQ, fails: 'what a page may ask of the sequence', also: ['on the server'], from: "    if (!host) throw new Error('Only the teacher moves the class on.');\n", to: '' },
  { file: 'sim/periods.mjs', test: SEQ, fails: 'what a page may ask of the sequence', also: ['on the server'], from: '  delete world.endSequence;\n', to: '' },
  { file: 'server/app.mjs', test: SEQ, fails: 'on the server: the Host ends the class', also: ['keeps no videos'], from: "else if (input.action === 'end') { s.world.status = 'ended'; beginEnd(s.world); }", to: "else if (input.action === 'end') { s.world.status = 'ended'; }" },
  { file: 'server/flashback.mjs', test: SEQ, fails: 'on the server: the Host ends the class', from: "const most = householdId === CLASS_VIDEO_ID ? FLASHBACK_LIMITS.classMaxMs : FLASHBACK_LIMITS.maxMs;", to: 'const most = FLASHBACK_LIMITS.maxMs;' },
  // The farm at the end (D8).
  { file: 'sim/farm-sale.mjs', test: FARM, fails: 'an intact farm sells for its land', from: 'Math.round(house.work / 2.5)', to: 'Math.round(house.work / 2)' },
  { file: 'sim/farm-sale.mjs', test: FARM, fails: 'an intact farm sells for its land', from: "const labor = Math.min(holding.acres, Math.round(LABOR_ACRES));\n  const grazing = Math.max(0, holding.acres - labor);", to: "const labor = holding.acres;\n  const grazing = 0;" },
  { file: 'sim/ending.mjs', test: FARM, fails: 'an intact farm sells for its land', from: '  const final = finalNumber(money + sale, glory, land.reales, kept);', to: '  const final = finalNumber(money, glory, land.reales, kept) + sale;' },
  { file: 'sim/farm-sale.mjs', test: FARM, fails: 'a burned farm has nothing to sell and counts glory instead', from: "export const farmBurned = household => Number.isFinite(household.flight?.burned) || improvementsOf(household).cabin === 'ruined';", to: "export const farmBurned = household => household.flight?.burnedBy?.hand === 'mexican';" },
  { file: 'sim/ending.mjs', test: FARM, fails: 'a burned farm has nothing to sell and counts glory instead', from: '  const glory = (ledger?.total ?? 0) + farmGlory;', to: '  const glory = ledger?.total ?? 0;' },
  { file: 'sim/farm-sale.mjs', test: FARM, fails: 'nothing is counted while the class runs', from: "if (!household || world.status !== 'ended' || !world.map?.source || interimStandings(world)) return { kind: 'none' };", to: "if (!household || world.status !== 'ended' || !world.map?.source) return { kind: 'none' };" },
  { file: 'sim/farm-sale.mjs', test: FARM, fails: 'nothing is counted while the class runs', from: "if (!household || world.status !== 'ended' || !world.map?.source || interimStandings(world)) return { kind: 'none' };", to: "if (!household || world.status !== 'ended' || interimStandings(world)) return { kind: 'none' };" },
  { file: 'sim/farm-sale.mjs', test: FARM, fails: 'nothing is counted while the class runs', from: "if (!household || world.status !== 'ended' || !world.map?.source || interimStandings(world)) return { kind: 'none' };", to: "if (!household || !world.map?.source || interimStandings(world)) return { kind: 'none' };" },
  { file: 'sim/ending.mjs', test: DEBRIEF, fails: 'the final number is written one way', from: 'max(coin + farm sold, 1)', to: 'max(coin, 1)' },
  // The homecoming's scenes and the class's own video (D10).
  { file: 'sim/flashback.mjs', test: SCENES, fails: 'each family that came home sees what is left', from: '  if (burned) {\n    beats.push({ kind: \'rebuild\'', to: '  if (true) {\n    beats.push({ kind: \'rebuild\'' },
  { file: 'sim/flashback.mjs', test: SCENES, fails: 'each family that came home sees what is left', from: 'for ${reales(farm.total)}. With the coin', to: 'for ${reales(farm.total + 1)}. With the coin' },
  { file: 'sim/flashback.mjs', test: SCENES, fails: 'each family that came home sees what is left', from: "return home.find(person => person.kin?.role === 'father') || home.find(person => person.kin?.role === 'mother')", to: "return home.find(person => person.kin?.role === 'mother') || home.find(person => person.kin?.role === 'father')" },
  // Two guards stand between a sickness's dead and a name at the burial - who they were to the family, and the script's scrub of
  // every caption - so both are taken away together.
  { file: 'sim/flashback.mjs', test: SCENES, fails: 'a death of sickness is remembered at the burial without a name', also: ['each family that came home'], from: 'const remembered = lost.map(person => fates[person.id].sickness ? whoTo(person) : firstName(person));', to: 'const remembered = lost.map(person => firstName(person));',
    edits: [['caption: scrub(beat.caption),', 'caption: beat.caption,']] },
  { file: 'sim/class-flashback.mjs', test: SCENES, fails: 'the class\'s own video: two and a half minutes at most', from: 'export const CLASS_TITLE_MS = 6000, CLASS_CLOSING_MS = 8000, CLASS_BEAT_MS = 8500, CLASS_FIGHT_MS = 10000;', to: 'export const CLASS_TITLE_MS = 6000, CLASS_CLOSING_MS = 8000, CLASS_BEAT_MS = 18500, CLASS_FIGHT_MS = 20000;\nconst unused = CLASS_MS;' },
  { file: 'sim/class-flashback.mjs', test: SCENES, fails: 'the class\'s own video: two and a half minutes at most', from: 'const played = all.filter(household => household.played);', to: 'const played = all.filter(household => household.played).slice(0, 1);' },
  { file: 'sim/class-flashback.mjs', test: SCENES, fails: 'the class\'s own video: two and a half minutes at most', from: "caption: `Sickness came to ${families(sick.length)} on the road and in the camps.${lost.length ? ` ${cap(families(lost.length))} lost somebody to it.` : ''}`,", to: "caption: `Sickness came to ${families(sick.length)} on the road and in the camps.${lost.length ? ` ${cap(families(lost.length))} lost somebody to it.` : ''} ${Object.values(world.entities).filter(one => one.health?.condition === 'dead' && one.health.disease).map(one => one.name).join(', ')}`," },
  { file: 'sim/class-flashback.mjs', test: SCENES, fails: 'the class\'s video exists only once the class has ended for good', from: '  if (!flashbackReady(world)) return null;\n  const all', to: '  const all' },
  // Found by the proof: a death told twice, the second time from the day the family heard.
  { file: 'sim/flashback.mjs', test: STORY, fails: 'a death in battle is told once', from: "const told = found.some(beat => beat.kind === 'fight' && beat.people?.includes(person.id) && ((fate.kind === 'dead' && beat.death) || (fate.kind === 'captured' && /taken prisoner/.test(beat.caption))));", to: "const told = found.some(beat => beat.kind === 'fight' && beat.people?.includes(person.id) && Math.abs(beat.minute - fate.minute) <= 10 * DAY && (beat.death || /taken prisoner/.test(beat.caption)));" },
];

// `--only <words>`: the injections whose test name has these words, to try them again.
const only = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1] : null;
if (only) INJECTIONS.splice(0, INJECTIONS.length, ...INJECTIONS.filter(one => one.fails.includes(only)));
const results = [];
function run(test) {
  try { return { code: 0, out: execFileSync(process.execPath, ['--test', '--test-reporter=tap', test], { encoding: 'utf8', env: { ...process.env, FLASHBACK_FIXTURE: flashbackFixture, CLASS_FIXTURE: classFixture }, maxBuffer: 64 * 1024 * 1024 }) }; }
  catch (error) { return { code: error.status, out: String(error.stdout || '') }; }
}
const failedNames = out => [...out.matchAll(/^not ok \d+ - (.*)$/gm)].map(match => match[1]);
const files = [...new Set(INJECTIONS.map(one => one.test))];
const baseline = Object.fromEntries(files.map(file => [file, failedNames(run(file).out)]));
if (Object.values(baseline).some(list => list.length)) throw new Error(`the tests fail before any injection: ${JSON.stringify(baseline)}`);
let bad = 0;
for (const injection of INJECTIONS) {
  const original = readFileSync(injection.file, 'utf8');
  const crlf = original.includes('\r\n');
  const text = crlf ? original.replace(/\r\n/g, '\n') : original;
  if (!text.includes(injection.from)) { results.push({ file: injection.file, expected: injection.fails, ok: false, why: 'the code to inject into was not found' }); bad++; console.log('NOT FOUND', injection.file, injection.from.slice(0, 80)); continue; }
  let changed = text.replace(injection.from, injection.to);
  for (const [from, to] of injection.edits || []) { if (!changed.includes(from)) throw new Error(`${injection.file}: ${from} not found`); changed = changed.replace(from, to); }
  writeFileSync(injection.file, crlf ? changed.replace(/\n/g, '\r\n') : changed);
  try {
    const failed = failedNames(run(injection.test).out);
    const ok = failed.some(name => name.includes(injection.fails)) && failed.every(name => name.includes(injection.fails) || (injection.also || []).some(other => other === '*' || name.includes(other)));
    if (!ok) bad++;
    results.push({ file: injection.file, test: injection.test, expected: injection.fails, failed, ok });
    console.log(ok ? 'CAUGHT' : 'MISSED', injection.file, '→', failed.join(' | ') || 'nothing failed');
  } finally { writeFileSync(injection.file, original); }
}
writeFileSync('docs/evidence/end-sequence-injections.json', JSON.stringify({ at: new Date().toISOString(), caught: INJECTIONS.length - bad, of: INJECTIONS.length, results }, null, 1));
rmSync(folder, { recursive: true, force: true });
console.log(`\n${INJECTIONS.length - bad} of ${INJECTIONS.length} injected regressions caught by their own test.`);
if (bad) process.exit(1);
