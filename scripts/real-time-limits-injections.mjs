// The regressions the real-time limits guard (owner, 2026-09-29: a rider 90 s, the order to leave 3 min, ¡Alto! about 30 s with
// the chase held, road and work questions in real seconds; sim/decision-budget.mjs `QUESTION_BUDGETS`), injected one at a time
// (CLAUDE.md: "A new test is not evidence until it has failed"). Each replaces one exact piece of a file with the mistake a test
// is written against, runs the test files, records which tests failed, checks that the test written for it is among them, and
// puts the file back byte for byte.
//
// Run: npm run test:real-time-limits-injections  → writes docs/evidence/real-time-limits-injections.json
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const FILES = ['tests/real-time-limits.test.mjs', 'tests/need-ranking.test.mjs'];
const T = {
  rider: 'a student\'s rider waits ninety real seconds', measure: 'a class the server does not measure', flight: 'the order to leave waits three real minutes',
  road: 'the road\'s question waits ninety real seconds', alto: 'waits thirty real seconds at every pace with the chase held', hunt: 'a hunter\'s question waits ninety real seconds',
  nobody: 'a question nobody is reading keeps its own count', sent: 'the server sends the time left',
};
const INJECTIONS = [
  { name: 'a student\'s rider waits his calendar minutes again, stretched with the phase', file: 'sim/encounters.mjs', from: '    const waited = riderOnLimit(world, encounter) ? limitOut(world, riderLimitKey(encounter))', to: '    const waited = false ? limitOut(world, riderLimitKey(encounter))', expect: T.rider },
  { name: 'a question put to the rider does not start his ninety seconds again', file: 'sim/decision-budget.mjs', from: 'export const riderLimitKey = encounter => `rider:${encounter.id}:${encounter.asked?.length || 0}`;', to: 'export const riderLimitKey = encounter => `rider:${encounter.id}`;', expect: T.rider },
  { name: 'a rider stopped with a family nobody plays is put on the real clock', file: 'sim/decision-budget.mjs', from: "  return Boolean(encounter?.status === 'open' && !encounter.kind && watched(world.households?.[encounter.householdId]));", to: "  return Boolean(encounter?.status === 'open' && !encounter.kind && world.households?.[encounter.householdId]);", expect: T.nobody },
  { name: 'the rider goes to the page without his time left', file: 'sim/encounters.mjs', from: '    ...(riderOnLimit(world, encounter) && { leftMs:', to: '    ...(false && { leftMs:', expect: T.measure },
  { name: 'a tick the server measured as no time is counted as a Study tick', file: 'sim/decision-budget.mjs', from: '  const ms = Number.isFinite(realMs) ? Math.max(0, realMs) : STUDY_TICK_MS;', to: '  const ms = Number.isFinite(realMs) && realMs > 0 ? realMs : STUDY_TICK_MS;', expect: T.measure },
  { name: 'a tick stepped in process counts no time, so a stepped class never lapses a work question', file: 'sim/decision-budget.mjs', from: '  const ms = Number.isFinite(realMs) ? Math.max(0, realMs) : STUDY_TICK_MS;', to: '  const ms = Number.isFinite(realMs) ? Math.max(0, realMs) : 0;', expect: T.hunt },
  { name: 'the order to leave waits its day of the calendar again', file: 'sim/auto.mjs', from: '      if (main?.auto || flightWaited(world, household)) autoFlee', to: '      if (main?.auto || world.minute - flight.orderedMinute >= 1440) autoFlee', expect: T.flight },
  { name: 'at Quick the order waits its three minutes past the day of grace, into the burning', file: 'sim/auto.mjs', from: '  return limitOut(world, flightLimitKey(household)) || (Number.isFinite(flight?.orderedMinute) && world.minute - flight.orderedMinute >= ORDER_GRACE_MINUTES);', to: '  return limitOut(world, flightLimitKey(household));', expect: T.flight },
  { name: 'the order\'s "!" at Quick counts the three minutes the family will not get', file: 'sim/auto.mjs', from: '  return Math.min(left, ticks * (world.decisionClock?.[key]?.tickMs || STUDY_TICK_MS));', to: '  return left;', expect: T.flight },
  { name: 'the road\'s question waits its twelve ticks again', file: 'sim/road.mjs', from: '  if (flight.ask && (roadOnLimit(world, household) ? limitOut(world, roadLimitKey(household, flight.ask)) : world.tick - flight.ask.openedTick >= ROAD_PATIENCE_TICKS)) {', to: '  if (flight.ask && world.tick - flight.ask.openedTick >= ROAD_PATIENCE_TICKS) {', expect: T.road },
  { name: 'the road\'s question goes to the page without its time left', file: 'sim/road.mjs', from: '...(leftMs !== null && { leftMs }), text:', to: 'text:', expect: T.road },
  { name: '¡Alto! lapses after three ticks again, whatever the pace', file: 'sim/pursuit.mjs', from: "  if (flight.ask?.id === 'alto' && (!roadOnLimit(world, household) || limitOut(world, roadLimitKey(household, flight.ask)))) answerAltoFor", to: "  if (flight.ask?.id === 'alto' && world.tick - flight.ask.openedTick >= 3) answerAltoFor", expect: T.alto },
  { name: '¡Alto! is given the road\'s ninety seconds', file: 'sim/decision-budget.mjs', from: "kind: household.flight.ask.id === 'alto' ? 'alto' : 'road', personId: actingId(world, household) });", to: "kind: 'road', personId: actingId(world, household) });", expect: T.alto },
  { name: 'the soldiers come on while the family decides', file: 'sim/pursuit.mjs', from: '  const ended = fresh || waiting() ? null : runChase(', to: '  const ended = fresh ? null : runChase(', expect: T.alto },
  { name: 'the family draws away from soldiers standing still while it decides', file: 'sim/pursuit.mjs', from: '  return waiting();\n}', to: '  return false;\n}', expect: T.alto },
  { name: 'a hunter\'s question waits its two hours of the calendar again', file: 'sim/chores.mjs', from: '    if (workOnLimit(world, entity) ? !limitOut(world, workLimitKey(entity, state.ask)) :', to: '    if (false ? !limitOut(world, workLimitKey(entity, state.ask)) :', expect: T.hunt },
  { name: 'a hunter\'s question goes to the page without its time left', file: 'sim/chores.mjs', from: '...(workOnLimit(world, entity) && { leftMs:', to: '...(false && { leftMs:', expect: T.hunt },
];

const failing = output => [...new Set([...output.matchAll(/^\s*✖ (.+?) \(\d/gm)].map(match => match[1].trim()).filter(name => !/^tests[\\/]/.test(name) && name !== 'failing tests:'))];
const run = () => { const result = spawnSync(process.execPath, ['--test', ...FILES], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }); return failing(`${result.stdout}${result.stderr}`); };

// Every pattern is checked before anything runs, so a stale one fails in a second rather than halfway through.
for (const injection of INJECTIONS) {
  const original = readFileSync(injection.file, 'utf8');
  if (!original.replace(/\r\n/g, '\n').includes(injection.from)) throw new Error(`Injection pattern not found in ${injection.file}: ${injection.name}`);
}
const clean = run();
if (clean.length) throw new Error(`The tests fail before anything is injected: ${clean.join('; ')}`);
const record = [];
for (const injection of INJECTIONS) {
  const original = readFileSync(injection.file, 'utf8');
  const crlf = original.includes('\r\n');
  const text = original.replace(/\r\n/g, '\n').replace(injection.from, injection.to);
  writeFileSync(injection.file, crlf ? text.replace(/\n/g, '\r\n') : text);
  let failed;
  try { failed = run(); } finally { writeFileSync(injection.file, original); }
  const caught = failed.some(name => name.includes(injection.expect));
  const only = caught && failed.every(name => name.includes(injection.expect));
  record.push({ name: injection.name, file: injection.file, expected: injection.expect, caught, only, failed });
  console.log(`${caught ? 'CAUGHT' : 'MISSED'}${caught && !only ? ' (with others)' : ''} ${injection.name}${caught && only ? '' : ` (failed: ${failed.join('; ') || 'nothing'})`}`);
}
if (run().length) throw new Error('The tests fail after every file was put back');
mkdirSync('docs/evidence', { recursive: true });
writeFileSync('docs/evidence/real-time-limits-injections.json', `${JSON.stringify({ record: 'real-time-limits-injections', date: new Date().toISOString().slice(0, 10), files: FILES, caught: record.filter(one => one.caught).length, only: record.filter(one => one.only).length, of: record.length, injections: record }, null, 2)}\n`);
console.log(`\n${record.filter(one => one.caught).length} of ${record.length} caught by the test written for them (${record.filter(one => one.only).length} by that test alone). Wrote docs/evidence/real-time-limits-injections.json`);
