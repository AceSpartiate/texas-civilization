// The regressions one rider, one visit guards (owner, 2026-09-29: "If they're all carrying similar news, why does the family
// receive multiples? Why don't we integrate and simplify things?"; sim/encounters.mjs `VISIT_MINUTES`, `joinVisit`,
// `questionWaits`, `ridersInSight`; `FIC-GONZ-909`), injected one at a time (CLAUDE.md: "A new test is not evidence until it has
// failed"). Each replaces one exact piece of a file with the mistake a test is written against, runs the test files, records
// which tests failed, checks that the test written for it is among them, and puts the file back byte for byte.
//
// Run: npm run test:one-rider-injections  → writes docs/evidence/one-rider-injections.json
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const FILES = ['tests/one-rider.test.mjs', 'tests/call-lapse.test.mjs'];
const T = {
  fold: 'the same word, firmer, from a second rider mid-conversation', window: 'a firmer account a little after the visit',
  other: 'a rider with other word waits his turn', queue: 'a question put while a rider talks', sight: 'a family is drawn every rider in sight',
  save: 'a class saved with a second rider', clock: 'a played family\'s settlement call lapses after five real minutes',
  pass: 'a passing rider is drawn riding by at his own pace',
};
const E = 'sim/encounters.mjs';
const INJECTIONS = [
  { name: 'a second rider with the same word waits his turn and tells it all again', file: E, from: '      if (open && open !== joining) continue;', to: '      if (open) continue;', expect: T.fold },
  { name: 'nothing joins a visit: every firmer account is a meeting of its own', file: E, from: '      const joining = visitAbout(world, household.id, report.topicId);', to: '      const joining = null;', expect: T.fold },
  { name: 'the joined account is never learned', file: E, from: '  learn(world, householdId, report.topicId, { status: report.status, hands: said.hands, source: sourceOf(carrier, said), causes: [eventId] });', to: '', expect: T.fold },
  { name: 'the joined account is learned in the first rider\'s name', file: E, from: 'source: sourceOf(carrier, said), causes: [eventId] });', to: 'source: joining.carrierName, causes: [eventId] });', expect: T.fold },
  { name: 'the joining is written in the family\'s own record, on its screen', file: E, from: "    actorId: carrier.id, topicId: report.topicId, classification: 'FICTIONAL FOR GAMEPLAY', claimId: 'FIC-GONZ-909', causes: [joining.metEventId],", to: "    actorId: carrier.id, householdId, topicId: report.topicId, classification: 'FICTIONAL FOR GAMEPLAY', claimId: 'FIC-GONZ-909', causes: [joining.metEventId],", expect: T.fold },
  { name: 'the visit never closes: a firmer account a day later is folded too', file: E, from: 'export const VISIT_MINUTES = 360;', to: 'export const VISIT_MINUTES = Infinity;', expect: T.window },
  { name: 'only an open visit is joined: a firmer account a moment after it is told again', file: E, from: "&& (one.status === 'open' || world.minute - (one.closedMinute ?? one.openedMinute) < VISIT_MINUTES)) || null;", to: "&& one.status === 'open') || null;", expect: T.window },
  { name: 'any word joins the visit, not only the same one', file: E, from: "one.householdId === householdId && !one.kind && one.topicId === topicId\n", to: "one.householdId === householdId && !one.kind\n", expect: T.other },
  { name: 'a rider waiting at the gate is not counted among what waits', file: E, from: '  return { questions: questions.length ? 1 : 0, riders: riders.length + scenes };', to: '  return { questions: questions.length ? 1 : 0, riders: scenes };', expect: T.other },
  { name: 'the question is shown over the rider still talking', file: 'sim/directors.mjs', from: '  const request = asked && questionWaits(world, householdId, asked) ? null : asked;', to: '  const request = asked;', expect: T.queue },
  { name: 'a question already in front of the family is taken away when a rider comes', file: E, from: '  return Boolean(visit && !visit.kind && question.offeredMinute >= visit.openedMinute);', to: '  return Boolean(visit && !visit.kind);', expect: T.queue },
  { name: 'the conversation does not say something waits after it', file: E, from: '    ...(count && { waiting:', to: '    ...(false && { waiting:', expect: T.queue },
  { name: 'the call\'s five minutes run while it waits behind the rider', file: 'sim/decision-budget.mjs', from: ' || questionWaits(world, householdId, call), expire', to: ', expire', expect: T.clock },
  { name: 'another family\'s rider is not drawn to the family', file: E, from: '    if (!carrier.report?.inPerson && !carrier.leaving) continue;', to: '    if (!carrier.report?.inPerson || carrier.report.audience !== householdId) continue;', expect: T.sight },
  { name: 'the rider whose word was taken into the visit is drawn riding up and away', file: E, from: '    if (carrier.foldedInto === householdId || joiningHere(world, householdId, carrier, met)) continue;', to: '', expect: T.fold },
  { name: 'a passing rider is drawn at the server\'s pace', file: 'public/motion.js', from: '  pass.d = Math.min(pass.d + Math.max(0, pace) * Math.max(0, dtMs) / 1000, pass.road.distance, Math.max(was, cap));', to: '  pass.d = Math.min(pass.road.distance, Math.max(was, cap));', expect: T.pass },
  { name: 'a passing rider never fades out once he is by', file: 'public/motion.js', from: "  if (pass.state === 'riding' && (pass.d >= pass.until - 1e-9 || atEnd)) pass.state = 'fading';", to: '', expect: T.pass },
  { name: 'a passing rider is drawn from where the server first has him, not from the start of the stretch', file: 'public/motion.js', from: "  return Object.assign(pass, { state: 'riding', d: Math.max(0, near - before),", to: "  return Object.assign(pass, { state: 'riding', d: near,", expect: T.pass },
];

const failing = output => [...new Set([...output.matchAll(/^\s*✖ (.+?) \(\d/gm)].map(match => match[1].trim()).filter(name => !/^tests[\\/]/.test(name) && name !== 'failing tests:'))];
const run = () => { const result = spawnSync(process.execPath, ['--test', ...FILES], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 600_000 }); return failing(`${result.stdout}${result.stderr}`); };

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
writeFileSync('docs/evidence/one-rider-injections.json', `${JSON.stringify({ record: 'one-rider-injections', date: new Date().toISOString().slice(0, 10), files: FILES, caught: record.filter(one => one.caught).length, only: record.filter(one => one.only).length, of: record.length, injections: record }, null, 2)}\n`);
console.log(`\n${record.filter(one => one.caught).length} of ${record.length} caught by the test written for them (${record.filter(one => one.only).length} by that test alone). Wrote docs/evidence/one-rider-injections.json`);
