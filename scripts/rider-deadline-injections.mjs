// The regressions "a rider leaves in time for the question behind him" guards (owner, 2026-09-29, choosing "Rider leaves at
// dawn"; sim/encounters.mjs `riderMustGo`, docs/COLONIES.md §5.4b), injected one at a time (CLAUDE.md: "A new test is not
// evidence until it has failed"). Each replaces one exact piece of a file with the mistake a test is written against, runs the
// test file, records which tests failed, checks that the test written for it is among them, and puts the file back byte for byte.
//
// Run: npm run test:rider-deadline-injections  → writes docs/evidence/rider-deadline-injections.json
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const FILES = ['tests/rider-deadline.test.mjs'];
const T = { early: 'the rider riding on early to leave it its ninety seconds', once: 'is shown at once, the rider sent on', ahead: 'counted on the calendar after he has gone', keeps: 'keeps his ninety seconds' };
const E = 'sim/encounters.mjs';
const INJECTIONS = [
  { name: 'the rider stands his ninety seconds whatever waits behind him (the defect)', file: E, from: ' || riderMustGo(world, encounter)\n', to: '\n', expect: T.early },
  { name: 'the rider goes only once the question has no time left', file: E, from: '  return leftMs <= QUEUED_QUESTION_MS + 2 * tickMs;', to: '  return leftMs <= 2 * tickMs;', expect: T.early },
  { name: 'the time left is counted on the calendar held for the rider, not the one after him', file: E, from: '(Math.min(...closes) - world.minute) / Math.max(1, calendarAhead(world)) * tickMs;', to: '(Math.min(...closes) - world.minute) / Math.max(1, calendarMinutes(world)) * tickMs;', expect: T.ahead },
  { name: 'the rumor carries no closing minute', file: 'sim/directors.mjs', from: "  world.rumors[household.id] = { id, text, status: 'open', offeredMinute: world.minute, closes: momentOf(world, 'approach') };", to: "  world.rumors[household.id] = { id, text, status: 'open', offeredMinute: world.minute };", expect: T.early },
  { name: 'every rider with a question behind him rides on at once', file: E, from: '  return leftMs <= QUEUED_QUESTION_MS + 2 * tickMs;', to: '  return true;', expect: T.early },
  { name: 'a question the calendar does not close soon sends him on too', file: E, from: '  return leftMs <= QUEUED_QUESTION_MS + 2 * tickMs;', to: '  return leftMs <= 1e12;', expect: T.keeps },
];

const failing = output => [...new Set([...output.matchAll(/^\s*✖ (.+?) \(\d/gm)].map(match => match[1].trim()).filter(name => !/^tests[\\/]/.test(name) && name !== 'failing tests:'))];
const run = () => { const result = spawnSync(process.execPath, ['--test', ...FILES], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 900_000 }); return failing(`${result.stdout}${result.stderr}`); };

for (const injection of INJECTIONS) {
  if (!readFileSync(injection.file, 'utf8').replace(/\r\n/g, '\n').includes(injection.from)) throw new Error(`Injection pattern not found in ${injection.file}: ${injection.name}`);
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
writeFileSync('docs/evidence/rider-deadline-injections.json', `${JSON.stringify({ record: 'rider-deadline-injections', date: new Date().toISOString().slice(0, 10), files: FILES, caught: record.filter(one => one.caught).length, only: record.filter(one => one.only).length, of: record.length, injections: record }, null, 2)}\n`);
console.log(`\n${record.filter(one => one.caught).length} of ${record.length} caught by the test written for them (${record.filter(one => one.only).length} by that test alone). Wrote docs/evidence/rider-deadline-injections.json`);
