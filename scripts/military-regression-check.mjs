// Controlled regressions for the military pacing and invitation tests (docs/MILITARY_EXPERIENCE.md).
// Each mutation is applied by a module load hook inside a child test process: production files are never edited.
// Every case runs the WHOLE test file and requires that exactly the named test fails, and no other; a baseline run
// with no mutation must pass first. A mutation target that is not found exactly once throws, so a pattern that no
// longer matches the source (CRLF, a rename) cannot report a catch. Run: node scripts/military-regression-check.mjs
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const CR = String.fromCharCode(13), LF = String.fromCharCode(10);
const cases = [
  // [name, file, from, to, the one test expected to fail, test file]
  ['ownership', 'public/military-attention.js', 'person.householdId === world.householdId', 'true', 'military invitations expose only the owning household', 'tests/military-attention.test.mjs'],
  ['report-leak', 'public/military-attention.js', 'Listen to learn what they carry.', 'The Alamo fell.', 'a real rider invitation withholds', 'tests/military-attention.test.mjs'],
  ['priority', 'public/military-attention.js', "Number(a.kind === 'siege') - Number(b.kind === 'siege')", '0', 'an Alamo decision precedes', 'tests/military-attention.test.mjs'],
  ['army-request', 'public/military-attention.js', '|| world.army?.ours?.some', '|| false && world.army?.ours?.some', 'army and Houston requests', 'tests/military-attention.test.mjs'],
  ['auto-person', 'sim/military-pacing.mjs', '&& !person.auto', '', 'a live Alamo courier choice', 'tests/military-pacing.test.mjs'],
  ['absent-family', 'sim/military-pacing.mjs', '&& !household.absent', '', 'a played military journey slows', 'tests/military-pacing.test.mjs'],
  ['boundary', 'sim/military-pacing.mjs', 'minutes = Math.min(minutes, barrier.minute - world.minute);', 'void 0;', 'lands on its next historical boundary', 'tests/military-pacing.test.mjs'],
  ['tick-clock', 'sim/clock.mjs', 'if (runningSteps.has(world))', 'if (false && runningSteps.has(world))', 'all movement in a boundary tick', 'tests/military-pacing.test.mjs'],
  ['jump-guard', 'sim/time.mjs', 'if (decision || travelling)', 'if (false && (decision || travelling))', 'quiet-time skipping refuses', 'tests/military-pacing.test.mjs'],
  ['quiet-camp', 'sim/military-pacing.mjs', "world.army.phase === 'marching' && !world.army.camp", "world.army.phase === 'marching'", 'an army still tagged marching', 'tests/military-pacing.test.mjs'],
  ['released-courier', 'sim/military-pacing.mjs', "['home', 'return', 'march'].includes(person.travel?.purpose)", "['march'].includes(person.travel?.purpose)", 'a chosen courier leaving the Alamo', 'tests/military-pacing.test.mjs'],
  ['camp-arrival', 'sim/army.mjs', 'army.camp = null;', '', 'a camp order starts a visible journey', 'tests/military-pacing.test.mjs'],
  ['camp-free-tick', 'sim/army.mjs', 'army.camp = null; army.leftMinute = world.minute;', 'army.camp = null;', 'a camp order starts a visible journey', 'tests/military-pacing.test.mjs'],
];

mkdirSync('test-results/military-injections', { recursive: true });
const failingTests = output => [...output.matchAll(/^\s*not ok \d+ - (.+)$/gm)].map(match => match[1].trim());
const run = (testFile, hook) => {
  const args = [...(hook ? ['--import', `./${hook}`] : []), '--test', '--test-reporter=tap', testFile];
  const result = spawnSync(process.execPath, args, { encoding: 'utf8' });
  return { status: result.status, output: result.stdout + result.stderr };
};

for (const testFile of new Set(cases.map(one => one[5]))) {
  const clean = run(testFile);
  if (clean.status !== 0 || failingTests(clean.output).length) throw new Error(`${testFile} does not pass without a mutation:\n${clean.output}`);
}

const evidence = [];
let missed = 0;
for (const [name, file, rawFrom, to, expected, testFile] of cases) {
  const original = readFileSync(file, 'utf8');
  // The working copy may be CRLF: a pattern written with bare LF must be matched as the file actually is.
  const ends = text => (original.includes(CR + LF) ? text.split(CR + LF).join(LF).split(LF).join(CR + LF) : text.split(CR + LF).join(LF));
  const from = ends(rawFrom);
  const count = original.split(from).length - 1;
  if (count !== 1) throw new Error(`${name}: mutation target found ${count} times in ${file}, not exactly once`);
  const hook = `import { registerHooks } from 'node:module';\nregisterHooks({ load(url, context, next) { const result = next(url, context); if (url.endsWith(${JSON.stringify('/' + file)})) { const source = String(result.source); if (source.split(${JSON.stringify(from)}).length !== 2) throw new Error('Mutation target not found exactly once'); return { ...result, source: source.replace(${JSON.stringify(from)}, ${JSON.stringify(to)}) }; } return result; } });\n`;
  const path = `test-results/military-injections/${name}.mjs`;
  writeFileSync(path, hook);
  const { status, output } = run(testFile, path);
  writeFileSync(`test-results/military-injections/${name}.log`, output);
  const failed = failingTests(output);
  const caught = status !== 0 && failed.length === 1 && failed[0].includes(expected);
  if (!caught) missed++;
  evidence.push({ name, file, testFile, expected, failed, detected: caught });
  console.log(`${caught ? 'PASS detected' : 'MISSED'} ${name}${caught ? '' : ` (failed: ${JSON.stringify(failed)})`}`);
}
writeFileSync('docs/evidence/military-injections.json', JSON.stringify({
  date: new Date().toISOString().slice(0, 10),
  note: 'Same computer only. Each mutation applied by a load hook in a child process; the whole test file runs and exactly the named test must fail.',
  caught: evidence.length - missed, of: evidence.length, checks: evidence,
}, null, 2) + '\n');
console.log(`\n${evidence.length - missed} of ${evidence.length} caught.`);
if (missed) process.exit(1);
