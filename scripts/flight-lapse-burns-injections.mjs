// The regressions the burning of a lapsed order to leave guards (owner, 2026-09-29: "72 s at quick, but if the student doesn't
// respond, burn their house. They should have been paying attention."; sim/scrape.mjs `burnForSilence`, `FIC-GONZ-907`), injected
// one at a time (CLAUDE.md: "A new test is not evidence until it has failed"). Each replaces one exact piece of a file with the
// mistake a test is written against, runs the test file, records which tests failed, checks that the test written for it is among
// them, and puts the file back byte for byte.
//
// Run: npm run test:flight-lapse-burns-injections  → writes docs/evidence/flight-lapse-burns-injections.json
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const FILES = ['tests/flight-lapse-burns.test.mjs'];
const T = { burns: 'a student who lets the order to leave run out is packed off', warn: 'the order warns before it runs out', spared: 'answered in time, or on auto' };
const INJECTIONS = [
  { name: 'the order lapses and the family goes, but nothing burns', file: 'sim/scrape.mjs', from: "  if (why === 'waited') burnForSilence(world, household);\n", to: '', expect: T.burns },
  { name: 'the house burns but the burning is not counted on the flight', file: 'sim/scrape.mjs', from: "  flight.burned = world.minute;\n  flight.burnedBy = { hand: 'texian', name: 'the Texas army', lapsed: true,", to: "  flight.burnedBy = { hand: 'texian', name: 'the Texas army', lapsed: true,", expect: T.burns },
  { name: 'the journal does not say the order went unanswered and the house burned', file: 'sim/scrape.mjs', from: "  if (!ruin(world, household, ['cabin', 'field', 'fence'], { text }).length) tell(", to: "  if (!ruin(world, household, ['cabin', 'field', 'fence']).length) tell(", expect: T.burns },
  { name: 'the family is not told its own house burned', file: 'sim/scrape.mjs', from: "  learn(world, household.id, farmTopic(household), { status: 'confirmed', source: 'Their own eyes'", to: "  false && learn(world, household.id, farmTopic(household), { status: 'confirmed', source: 'Their own eyes'", expect: T.burns },
  { name: 'the ending tells it as a burning while the family was away', file: 'sim/ending-story.mjs', from: '  const farm = burned && flight.burnedBy?.lapsed', to: '  const farm = false', expect: T.burns },
  { name: 'at Quick the order waits its three minutes, not the day of grace', file: 'sim/auto.mjs', from: '  return limitOut(world, flightLimitKey(household)) || (Number.isFinite(flight?.orderedMinute) && world.minute - flight.orderedMinute >= ORDER_GRACE_MINUTES);', to: '  return limitOut(world, flightLimitKey(household));', expect: T.burns },
  { name: 'the order does not warn what silence costs', file: 'sim/world.mjs', from: '{ leftMs: left, ifUnanswered: FLIGHT_IF_UNANSWERED }', to: '{ leftMs: left }', expect: T.warn },
  { name: 'the "!" does not warn of the house', file: 'public/family-panel.js', from: "text: `The family has been told to leave for the east.${world.flight.ifUnanswered ? ` ${world.flight.ifUnanswered}` : ''}`", to: "text: 'The family has been told to leave for the east.'", expect: T.warn },
  { name: 'a family on auto is burned too, as if its student had not answered', file: 'sim/auto.mjs', from: "autoFlee(world, household, { why: main?.auto ? 'auto' : 'waited' })", to: "autoFlee(world, household, { why: 'waited' })", expect: T.spared },
  { name: 'a family whose student has gone is packed off and burned for silence', file: 'sim/auto.mjs', from: "    if (household.played && !household.absent && flight?.status === 'ordered' && !flight.burned && !household.takenIn) {", to: "    if (household.played && flight?.status === 'ordered' && !flight.burned && !household.takenIn) {", expect: T.spared },
  { name: 'a family nobody plays is packed off and burned for silence', file: 'sim/auto.mjs', from: "    if (household.played && !household.absent && flight?.status === 'ordered' && !flight.burned && !household.takenIn) {", to: "    if (!household.absent && flight?.status === 'ordered' && !flight.burned && !household.takenIn) {", expect: T.spared },
];

const failing = output => [...new Set([...output.matchAll(/^\s*✖ (.+?) \(\d/gm)].map(match => match[1].trim()).filter(name => !/^tests[\\/]/.test(name) && name !== 'failing tests:'))];
const run = () => { const result = spawnSync(process.execPath, ['--test', ...FILES], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }); return failing(`${result.stdout}${result.stderr}`); };

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
writeFileSync('docs/evidence/flight-lapse-burns-injections.json', `${JSON.stringify({ record: 'flight-lapse-burns-injections', date: new Date().toISOString().slice(0, 10), files: FILES, caught: record.filter(one => one.caught).length, only: record.filter(one => one.only).length, of: record.length, injections: record }, null, 2)}\n`);
console.log(`\n${record.filter(one => one.caught).length} of ${record.length} caught by the test written for them (${record.filter(one => one.only).length} by that test alone). Wrote docs/evidence/flight-lapse-burns-injections.json`);
