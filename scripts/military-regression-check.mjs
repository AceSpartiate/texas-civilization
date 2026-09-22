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
  // 2026-09-22: Travis's runner, the fates by role and place, and the real-time decision budget (docs/ALAMO_FATES.md).
  ['runner-coming-pace', 'sim/military-pacing.mjs', "    if (person.service?.courier === 'coming') return person.id;", '', 'runner still crossing the plaza holds reading pace', 'tests/military-pacing.test.mjs'],
  ['runner-dedupe', 'public/military-attention.js', "if (service?.courier === 'open' && runnerWith === person.id) continue;", '', 'runner standing with the person is one invitation', 'tests/military-attention.test.mjs'],
  ['alamo-origin', 'sim/alamo-runner.mjs', 'x: 0.28673085317694386', 'x: 0.2867', 'the simulation lays the Alamo where the map draws it', 'tests/alamo-runner.test.mjs'],
  ['runner-walk', 'sim/alamo-runner.mjs', 'if (walk(runner, person.location, BESIDE_FEET)) openRunner(world, runner, person);', 'openRunner(world, runner, person);', 'runner walks from the colonel', 'tests/alamo-runner.test.mjs'],
  ['runner-privacy', 'sim/encounters.mjs', "if (role === 'host' || !householdId) return null;\n  const mine = Object.values(world.encounters || {}).filter(e => e.householdId === householdId);", "if (role === 'host' || !householdId) return null;\n  const mine = Object.values(world.encounters || {});", 'only the family the runner speaks to hears him', 'tests/alamo-runner.test.mjs'],
  ['runner-return', 'sim/alamo-runner.mjs', "{ runner.runner.phase = 'returning'; runner.task = 'travel'; }", '{ }', 'an answer closes the meeting in words', 'tests/alamo-runner.test.mjs'],
  ['noncombatant-asked', 'sim/alamo.mjs', "return alamoRole(person) === 'fighter';", 'return true;', 'a woman or a child shut inside is not asked', 'tests/alamo-runner.test.mjs'],
  ['auto-runner', 'sim/alamo.mjs', 'if (person.auto || household.absent) {', 'if (false) {', 'a family on auto or whose student has gone', 'tests/alamo-runner.test.mjs'],
  ['dead-asked', 'sim/alamo.mjs', '  if (GONE.includes(person.health?.condition)) return false;', '', 'the dead and the captured are not asked', 'tests/alamo-runner.test.mjs'],
  ['departed-asked', 'sim/alamo.mjs', "if (!person?.householdId || service?.kind !== 'garrison' || !service.besieged) return false;", "if (!person?.householdId || service?.kind !== 'garrison') return false;", 'a courier who has gone out is never asked again', 'tests/alamo-runner.test.mjs'],
  ['same-day', 'sim/alamo.mjs', '  if (service.courierDay === day) return false;', '', 'nobody is asked twice on the same day', 'tests/alamo-runner.test.mjs'],
  ['reconsider', 'sim/alamo.mjs', 'service.courierDay === day', 'service.courierDay', 'a volunteer passed over and a man who stayed are both asked again', 'tests/alamo-runner.test.mjs'],
  ['last-night-words', 'sim/alamo-runner.mjs', 'there may not be many more chances to get a man through', 'the colonel thanks you', 'what the runner says on the last night', 'tests/alamo-runner.test.mjs'],
  ['sex-fate', 'sim/alamo.mjs', "const fell = alamoRole(person) === 'fighter';", 'const fell = male(person);', 'at the assault a fighter inside is killed', 'tests/alamo-runner.test.mjs'],
  ['warn-garrison', 'sim/directors.mjs', ' warnGarrison(world); });', ' });', 'when Santa Anna is said to be marching', 'tests/alamo-runner.test.mjs'],
  ['budget-close-runner', 'sim/alamo.mjs', "  closeRunner(world, person, 'unanswered', offers);", '', 'an unanswered courier question runs out after ninety real seconds', 'tests/decision-budget.test.mjs'],
  ['fallback-share', 'sim/alamo.mjs', 'if (!courierPending(person)) return;\n  const offers = autoOffers(world, person);', 'if (!courierPending(person)) return;\n  const offers = false;', "the courier fallback is auto's answer", 'tests/decision-budget.test.mjs'],
  ['meter-pause', 'sim/decision-budget.mjs', 'if (!running) { last = null; return 0; }', 'if (!running) { return 0; }', "a Host's pause is never counted", 'tests/decision-budget.test.mjs'],
  ['budget-config', 'sim/world.mjs', 'spendDecisionBudget(world, realMs, { budgetMs: decisionBudgetMs, beginTravel });', 'spendDecisionBudget(world, realMs, { beginTravel });', 'the budget is configurable', 'tests/decision-budget.test.mjs'],
  ['camp-budget', 'sim/decision-budget.mjs', "if (service[question] === 'open') open.push(", 'if (false) open.push(', "Houston's camp question runs out", 'tests/decision-budget.test.mjs'],
  ['army-budget', 'sim/decision-budget.mjs', "if (!question.closed && question.asks?.[person.id] === 'open') open.push(", 'if (false) open.push(', 'an army question runs out', 'tests/decision-budget.test.mjs'],
  ['detachment-budget', 'sim/decision-budget.mjs', "if (army?.detachment && !army.detachment.closed && army.detachment.asks?.[person.id] === 'open') open.push(", 'if (false) open.push(', "Bowie and Fannin's division question runs out", 'tests/decision-budget.test.mjs'],
  ['absent-budget', 'sim/decision-budget.mjs', 'household?.played && !household.absent && !person.auto', 'household?.played && !person.auto', "nobody's budget runs for a family whose student has gone", 'tests/decision-budget.test.mjs'],
  ['auto-budget', 'sim/decision-budget.mjs', 'household?.played && !household.absent && !person.auto', 'household?.played && !household.absent', "nobody's budget runs for a family whose student has gone", 'tests/decision-budget.test.mjs'],
  ['budget-cumulative', 'sim/decision-budget.mjs', 'entry.spent += realMs;', 'entry.spent = realMs;', 'the budget adds up across ticks and is kept in the save', 'tests/decision-budget.test.mjs'],
  ['budget-forget', 'sim/decision-budget.mjs', 'for (const key of Object.keys(world.decisionClock || {})) if (!keys.has(key)) delete world.decisionClock[key];', '', 'a question answered is forgotten', 'tests/decision-budget.test.mjs'],
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
