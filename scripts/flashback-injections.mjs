// Each flashback test watched failing (CLAUDE.md: "A new test is not evidence until it has failed"). Every injection below is the
// exact regression a test guards, put into the code; the test file is run; the test named must fail, and every other test in
// the file must still pass; then the code is put back. The class the story tests read is played once and kept for the run
// (FLASHBACK_FIXTURE), so each injection takes seconds.
//
// Run: node scripts/flashback-injections.mjs  → docs/evidence/flashback-injections.json
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { endedClass } from '../tests/support/ended-class.mjs';

const folder = mkdtempSync(join(tmpdir(), 'flashback-injections-'));
const fixture = join(folder, 'class.json');
writeFileSync(fixture, JSON.stringify(endedClass('flashback-test', 5, { played: 2 })));

const STORY = 'tests/flashback.test.mjs', VIDEO = 'tests/flashback-video.test.mjs', ENDING = 'tests/ending-story.test.mjs';
const INJECTIONS = [
  { file: 'sim/flashback.mjs', test: STORY, fails: 'no word in any family\'s flashback is a virtue or gore', from: "add({ kind: 'house', weight: 82, minute: built.minute, place: home, caption: `The family raised its own house", to: "add({ kind: 'house', weight: 82, minute: built.minute, place: home, caption: `The brave family raised its own house" },
  { file: 'sim/flashback.mjs', test: STORY, fails: 'a death in battle is one plain sentence', also: ['glory is never in it'], from: "if ((staged?.fate === 'killed' || (here && fate.kind === 'dead')) && fate?.kind === 'dead') return { person, said: `${firstName(person)} was killed there.`, death: true };", to: "if ((staged?.fate === 'killed' || (here && fate.kind === 'dead')) && fate?.kind === 'dead') return { person, said: `${firstName(person)} was killed there, and earned glory.`, death: true };\n      if (fate?.kind === 'dead') return { person, said: `For it the family earned ${world.glory?.[household.id]?.awards?.[`${event}:${person.id}`]?.points} points.`, death: true };" },
  { file: 'sim/flashback.mjs', test: STORY, fails: 'a death of sickness is told without the name', from: 'caption: scrub(beat.caption),', to: 'caption: beat.caption,' },
  { file: 'sim/flashback.mjs', test: STORY, fails: 'every "meanwhile" is a true happening', from: '&& !(Number.isFinite(one.heardMinute) && one.heardMinute <= beat.minute)', to: '' },
  { file: 'sim/flashback.mjs', test: STORY, fails: 'the flashback exists only once the class has ended for good', from: "export const flashbackReady = world => world?.status === 'ended' && !interimStandings(world);", to: "export const flashbackReady = world => world?.status === 'ended';" },
  { file: 'sim/flashback.mjs', test: STORY, fails: 'every family gets a story of ten to fifteen beats', from: "beats.at(-1).startMs = at; beats.at(-1).durationMs = durationMs - at;", to: "beats.at(-1).startMs = at + 500; beats.at(-1).durationMs = durationMs - at;" },
  { file: 'sim/homecoming.mjs', test: STORY, fails: 'the trip home is deterministic and leaves the saved class as it was', also: ['*'], from: 'const copy = structuredClone(world);', to: 'const copy = world;' },
  { file: 'sim/homecoming.mjs', test: STORY, fails: 'every family on the road comes home, to the house as it truly stands', from: "household.improvements.cabin === 'ruined' ? 'burned' : 'standing'", to: "household.improvements.cabin === 'ruined' ? 'standing' : 'standing'" },
  { file: 'server/app.mjs', test: VIDEO, fails: 'served to the Host and to that family alone', from: "if (identity.role !== 'host' && householdId !== identity.householdId) return json(res, 403, { error: 'Only your own family’s flashback.' });", to: '' },
  { file: 'server/flashback.mjs', test: VIDEO, fails: 'served to the Host and to that family alone', from: 'if (!(read.durationMs >= FLASHBACK_LIMITS.minMs && read.durationMs <= FLASHBACK_LIMITS.maxMs))', to: 'if (false)' },
  { file: 'server/app.mjs', test: VIDEO, fails: 'the flashback routes answer nothing before the class has ended', from: "if (!flashbackReady(state.world)) return json(res, 409, { error: 'The class has not ended.' });\n        const bytes", to: "const bytes" },
  { file: 'server/webm.mjs', test: VIDEO, fails: 'a live recorder', from: 'if (size.size === null && id.id === CLUSTER) {', to: 'if (false) {' },
  { file: 'sim/ending-story.mjs', test: ENDING, fails: 'the spring is said as it was', from: "? burned ? ' They came home to the ashes.' : ' They came home to the house standing.'", to: "? ' They came home to a burned farm.'" },
  { file: 'sim/ending-story.mjs', test: ENDING, fails: 'somebody taken prisoner in the war is named', from: "person.health?.condition === 'captured' && person.service?.status === 'captured'", to: "person.health?.condition === 'captured' && person.service?.status === 'never'" },
  { file: 'sim/ending.mjs', test: ENDING, fails: 'the debrief begins with this class', from: 'discussion: [...classHooks(world), ...DISCUSSION]', to: 'discussion: DISCUSSION' },
  { file: 'public/webm-writer.js', test: VIDEO, fails: 'the WebM written is the WebM read', from: "head[3] = frame.key ? 0x80 : 0x00;", to: 'head[3] = 0x00;' },
];

const results = [];
function run(test) {
  try { return { code: 0, out: execFileSync(process.execPath, ['--test', '--test-reporter=tap', test], { encoding: 'utf8', env: { ...process.env, FLASHBACK_FIXTURE: fixture }, maxBuffer: 64 * 1024 * 1024 }) }; }
  catch (error) { return { code: error.status, out: String(error.stdout || '') }; }
}
const failedNames = out => [...out.matchAll(/^not ok \d+ - (.*)$/gm)].map(match => match[1]);
const baseline = { [STORY]: failedNames(run(STORY).out), [VIDEO]: failedNames(run(VIDEO).out), [ENDING]: failedNames(run(ENDING).out) };
if (Object.values(baseline).some(list => list.length)) throw new Error(`the tests fail before any injection: ${JSON.stringify(baseline)}`);
let bad = 0;
for (const injection of INJECTIONS) {
  const original = readFileSync(injection.file, 'utf8');
  const crlf = original.includes('\r\n');
  const text = crlf ? original.replace(/\r\n/g, '\n') : original;
  if (!text.includes(injection.from)) { results.push({ ...injection, ok: false, why: 'the code to inject into was not found' }); bad++; continue; }
  writeFileSync(injection.file, crlf ? text.replace(injection.from, injection.to).replace(/\n/g, '\r\n') : text.replace(injection.from, injection.to));
  try {
    const failed = failedNames(run(injection.test).out);
    // The test named must fail; another may fail with it only where the injection breaks what that one guards too (`also`).
    const ok = failed.some(name => name.includes(injection.fails)) && failed.every(name => name.includes(injection.fails) || (injection.also || []).some(other => other === '*' || name.includes(other)));
    if (!ok) bad++;
    results.push({ file: injection.file, test: injection.test, expected: injection.fails, failed, ok });
    console.log(ok ? 'CAUGHT' : 'MISSED', injection.file, '→', failed.join(' | ') || 'nothing failed');
  } finally { writeFileSync(injection.file, original); }
}
writeFileSync('docs/evidence/flashback-injections.json', JSON.stringify({ at: new Date().toISOString(), results }, null, 1));
rmSync(folder, { recursive: true, force: true });
console.log(`${INJECTIONS.length - bad} of ${INJECTIONS.length} injections caught by exactly their own test.`);
if (bad) process.exit(1);
