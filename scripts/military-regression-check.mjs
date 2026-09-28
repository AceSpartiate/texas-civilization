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
  // Re-aimed 2026-09-27: the sort became an `order` of kinds when the battle cards joined it (2026-09-25).
  ['priority', 'public/military-attention.js', "const order = kind => (kind === 'siege' ? 3 :", "const order = kind => (kind === 'siege' ? 0 :", 'an Alamo decision precedes', 'tests/military-attention.test.mjs'],
  ['army-request', 'public/military-attention.js', '|| world.army?.ours?.some', '|| false && world.army?.ours?.some', 'army and Houston requests', 'tests/military-attention.test.mjs'],
  // Re-aimed 2026-09-27: a second function in the file (the Mexican advance, 2026-09-26) carries the same words.
  ['auto-person', 'sim/military-pacing.mjs', '    return household?.played && !household.absent && !person.auto\n', '    return household?.played && !household.absent\n', 'a live Alamo courier choice', 'tests/military-pacing.test.mjs'],
  ['absent-family', 'sim/military-pacing.mjs', '    return household?.played && !household.absent && !person.auto\n', '    return household?.played && !person.auto\n', 'a played military journey slows', 'tests/military-pacing.test.mjs'],
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
  ['alamo-origin', 'sim/alamo-posts.mjs', 'x: 0.28673085317694386', 'x: 0.2867', 'the simulation lays the Alamo where the map draws it', 'tests/alamo-runner.test.mjs'],
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
  // Re-aimed 2026-09-27: the warning is Blas Herrera's since 2026-09-26 (sim/surprise.mjs `tellHerrera`).
  ['warn-garrison', 'sim/directors.mjs', "  once(world, 'herrera', () => tellHerrera(world));", '', 'when Herrera', 'tests/alamo-runner.test.mjs'],
  ['budget-close-runner', 'sim/alamo.mjs', "    closeRunner(world, person, 'unanswered', false);", '', 'an unanswered courier question runs out after ninety real seconds', 'tests/decision-budget.test.mjs'],
  // 2026-09-27: a question nobody answers in time lapses with nothing chosen (owner; sim/lapse.mjs, FIC-GONZ-633). The
  // first of each is the old behaviour itself, auto's answer, put back.
  ['lapse-courier', 'sim/alamo.mjs', "    service.courier = 'stays';\n    recordLapse(", "    service.courier = 'volunteered';\n    recordLapse(", 'an unanswered courier question lapses with nothing chosen', 'tests/decision-budget.test.mjs'],
  ['lapse-keeps-auto', 'sim/alamo.mjs', '  if (answeredFor(world, person)) {', '  if (courierPending(person)) {', 'somebody nobody is answering for is still decided as auto decides', 'tests/decision-budget.test.mjs'],
  ['lapse-army', 'sim/army.mjs', "    question.asks[id] = 'silent';\n    if (person) recordLapse(", "    question.asks[id] = 'yes';\n    if (person) recordLapse(", 'an army question runs out and lapses', 'tests/decision-budget.test.mjs'],
  ['lapse-detachment', 'sim/army.mjs', "    detachment.asks[id] = 'stay';\n    recordLapse(", "    detachment.asks[id] = 'go';\n    recordLapse(", "Bowie and Fannin's division question runs out and lapses", 'tests/decision-budget.test.mjs'],
  ['lapse-camp', 'sim/camp.mjs', "    entity.service[key] = 'no';\n    recordLapse(", "    entity.service[key] = 'yes';\n    recordLapse(", "Houston's camp question runs out and lapses", 'tests/decision-budget.test.mjs'],
  ['lapse-shot', 'sim/chores.mjs', "  if (ask.id === 'shot') return 'leave';\n", '', 'nobody stands in a wood for ever', 'tests/hunting.test.mjs'],
  ['lapse-road', 'sim/road.mjs', "  if (ask.id === 'bog' && flight.bog) flight.bog.waiting = true;\n", '', 'a road question nobody answers lapses', 'tests/road.test.mjs'],
  // 2026-09-27: a settlement's call lapses after five real minutes (owner; FIC-GONZ-636). No budget at all is the old
  // behaviour itself; tests/call-lapse.test.mjs was run against it (three of four fail) rather than injected here.
  ['call-lapse-chooses', 'sim/calls.mjs', "  call.status = 'expired';\n  call.lapsed = true;", "  call.status = 'refused';\n  call.lapsed = true;", "a played family's settlement call lapses after five real minutes", 'tests/call-lapse.test.mjs'],
  ['call-rider-stays', 'sim/decision-budget.mjs', 'lapseCall(world, householdId); sendOnFrom(world, householdId);', 'lapseCall(world, householdId);', "a played family's settlement call lapses after five real minutes", 'tests/call-lapse.test.mjs'],
  ['call-in-lesson', 'sim/decision-budget.mjs', '      if (decision.held) continue;', '', 'the call\'s minutes do not run while the family\'s student is in the guided start', 'tests/call-lapse.test.mjs'],
  ['call-absent', 'sim/decision-budget.mjs', "    if (call?.status !== 'open' || !household?.played || household.absent) continue;", "    if (call?.status !== 'open' || !household?.played) continue;", "nobody's call lapses for a family whose student has gone", 'tests/call-lapse.test.mjs'],
  ['call-own-budget', 'sim/decision-budget.mjs', "      const of = decision.call ? (callBudgetMs ?? CALL_BUDGET_MS) : (budgetMs ?? DECISION_BUDGET_MS);", "      const of = decision.call ? CALL_BUDGET_MS : (budgetMs ?? DECISION_BUDGET_MS);", "the call's budget is a server option carried through the tick", 'tests/call-lapse.test.mjs'],
  // 2026-09-27: messengers leave when the errand is done (owner; sim/encounters.mjs `advanceDepartures`, FIC-GONZ-634).
  ['runner-goes-in', 'sim/encounters.mjs', "export const goneFromSight = entity => Boolean(entity?.gone) || entity?.runner?.phase === 'waiting';", 'export const goneFromSight = entity => Boolean(entity?.gone);', 'the runner leaves once the question has lapsed', 'tests/alamo-runner.test.mjs'],
  ['rider-gone-unseen', 'sim/encounters.mjs', 'if (spokenWith && !goneFromSight(spokenWith) && (', 'if (spokenWith && (', 'a rider rides away once the meeting is over', 'tests/riders-leave.test.mjs'],
  ['rider-standing-unseen', 'sim/town.mjs', '    .filter(entity => !goneFromSight(entity));', '', 'a rider rides away once the meeting is over', 'tests/riders-leave.test.mjs'],
  ['rider-host-unseen', 'sim/overview.mjs', 'filter(entity => entity.location && !goneFromSight(entity))', 'filter(entity => entity.location)', 'a rider rides away once the meeting is over', 'tests/riders-leave.test.mjs'],
  ['rider-turn-back', 'sim/encounters.mjs', '    if (carrier.travel) { turnBack(world, carrier); continue; }', '    if (carrier.travel) continue;', 'a rider met out on the road turns round', 'tests/riders-leave.test.mjs'],
  ['rider-fork', 'sim/world.mjs', "    if (report.overflow > 0) progressTravel(world, next, report.overflow / next.travel.speed);\n    delete carrier.report;", "    if (report.overflow > 0) progressTravel(world, next, report.overflow / next.travel.speed);\n    carrier.report = { ...report, destination: null };", 'a rider who handed the word on at a fork rides home', 'tests/riders-leave.test.mjs'],
  ['express-home', 'sim/expresses.mjs', 'courier: true, base: siteId,', 'courier: true, base: stop,', 'an express rider who brought the word to a settlement rides home', 'tests/riders-leave.test.mjs'],
  ['meter-pause', 'sim/decision-budget.mjs', 'if (!running) { last = null; return 0; }', 'if (!running) { return 0; }', "a Host's pause is never counted", 'tests/decision-budget.test.mjs'],
  ['budget-config', 'sim/world.mjs', 'spendDecisionBudget(world, realMs, { budgetMs: decisionBudgetMs, callBudgetMs,', 'spendDecisionBudget(world, realMs, { callBudgetMs,', 'the budget is configurable', 'tests/decision-budget.test.mjs'],
  ['camp-budget', 'sim/decision-budget.mjs', "if (service[question] === 'open') open.push(", 'if (false) open.push(', "Houston's camp question runs out", 'tests/decision-budget.test.mjs'],
  ['army-budget', 'sim/decision-budget.mjs', "if (!question.closed && question.asks?.[person.id] === 'open') open.push(", 'if (false) open.push(', 'an army question runs out', 'tests/decision-budget.test.mjs'],
  ['detachment-budget', 'sim/decision-budget.mjs', "if (army?.detachment && !army.detachment.closed && army.detachment.asks?.[person.id] === 'open') open.push(", 'if (false) open.push(', "Bowie and Fannin's division question runs out", 'tests/decision-budget.test.mjs'],
  ['absent-budget', 'sim/decision-budget.mjs', 'Boolean(world.households?.[person.householdId]?.played) && answeredFor(world, person)', 'Boolean(world.households?.[person.householdId]?.played) && !person.auto', "nobody's budget runs for a family whose student has gone", 'tests/decision-budget.test.mjs'],
  ['auto-budget', 'sim/decision-budget.mjs', 'Boolean(world.households?.[person.householdId]?.played) && answeredFor(world, person)', 'Boolean(world.households?.[person.householdId]?.played) && !world.households[person.householdId].absent', "nobody's budget runs for a family whose student has gone", 'tests/decision-budget.test.mjs'],
  ['budget-cumulative', 'sim/decision-budget.mjs', 'entry.spent += realMs;', 'entry.spent = realMs;', 'the budget adds up across ticks and is kept in the save', 'tests/decision-budget.test.mjs'],
  ['budget-forget', 'sim/decision-budget.mjs', 'for (const key of Object.keys(world.decisionClock || {})) if (!keys.has(key)) delete world.decisionClock[key];', '', 'a question answered is forgotten', 'tests/decision-budget.test.mjs'],
];

// ONLY=name,name runs just those cases and writes no evidence (for working on a few); the record is a whole run.
const only = process.env.ONLY ? process.env.ONLY.split(",") : null;
if (only) cases.splice(0, cases.length, ...cases.filter(one => only.includes(one[0])));
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
if (!only) writeFileSync('docs/evidence/military-injections.json', JSON.stringify({
  date: new Date().toISOString().slice(0, 10),
  note: 'Same computer only. Each mutation applied by a load hook in a child process; the whole test file runs and exactly the named test must fail.',
  caught: evidence.length - missed, of: evidence.length, checks: evidence,
}, null, 2) + '\n');
console.log(`\n${evidence.length - missed} of ${evidence.length} caught.`);
if (missed) process.exit(1);
