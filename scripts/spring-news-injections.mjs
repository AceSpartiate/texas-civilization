// The regressions "every family hears the spring's big news at the same moment" (triage 2.7) is guarded against, injected one at
// a time (CLAUDE.md: "A new test is not evidence until it has failed"): the spring's word by express, settlement by settlement
// (sim/expresses.mjs `sendExpress`, `hearExpresses`; sim/directors.mjs `carryWord`, `tellWhenHeard`; docs/COLONIES.md §5.4c).
// Each replaces one exact piece of a file with the mistake a test is written against, runs the test file, records which tests
// failed, checks that the test written for it is among them, and puts the file back byte for byte.
//
// Run: npm run test:spring-news-injections  → writes docs/evidence/spring-news-injections.json
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const FILES = ['tests/spring-news.test.mjs'];
const T = { alamo: 'the Alamo\'s fall reaches each family', flight: 'in the spring a family hears where its people are', gap: 'the debrief\'s widest gap', saves: 'an express\'s word is checked' };
const X = 'sim/expresses.mjs', D = 'sim/directors.mjs';
const INJECTIONS = [
  { name: 'the rest of the country hears the fall on one evening, as before (the defect)', file: D,
    from: "once(world, 'fall-colonies', () => { if (!world.expresses?.['alamo-fall']) word(", to: "once(world, 'fall-colonies', () => { if (true) word(", expect: T.alamo },
  { name: 'every family is told by a rider straight out from where the word came in', file: X,
    from: '    const site = place.siteId && stops.find(stop => stop.id === place.siteId)\n      || stops.reduce((near, stop) => !near || crow(stop, place) < crow(near, place) ? stop : near, null);',
    to: '    const site = world.map.sites[state.from];', expect: T.alamo },
  { name: 'the fall is sent on from Gonzales with the rumour, before Mrs. Dickinson confirmed it', file: D,
    from: "source: 'Two riders from Béxar, at Gonzales' }));", to: "source: 'Two riders from Béxar, at Gonzales' }) && false || sendExpress(world, 'alamo-fall', { from: 'gonzales', status: 'unconfirmed', text: ALAMO_WORD.fall, source: 'A rider from Gonzales', beginTravel }));", expect: T.alamo },
  { name: 'a family hears the moment its stop does, before the express is read and ridden out', file: X,
    from: '      : minute + (site.id === state.from ? 0 : RELAY_MINUTES) + rideMinutes(', to: '      : minute + 0 * rideMinutes(', expect: T.alamo },
  { name: 'a death is on every family\'s screen when the first family hears', file: D,
    from: '  if (fall.size) tellFall(world, Object.values(world.households).filter(household => fall.has(household.id)));', to: '  if (fall.size) tellFall(world, Object.values(world.households));', expect: T.alamo },
  { name: 'the spring\'s word is brought to the door by a rider of the settlement, as the autumn\'s is', file: X,
    from: '      for (const household of state.word ? [] : Object.values(world.households)) {', to: '      for (const household of Object.values(world.households)) {', expect: T.alamo },
  { name: 'every family at its refuge turns home at the victory, heard or not', file: D,
    from: '  turnHome(world, null, victory);', to: '  if (done[\'victory-word\']) turnHome(world, null);', expect: T.flight },
  { name: 'the victory is told to every family on the day the army goes home', file: D,
    from: "if (!world.expresses?.['san-jacinto']) word(world, 'san-jacinto', everyone,", to: "if (true) word(world, 'san-jacinto', everyone,", expect: T.flight },
  { name: 'the gap is counted from the last, firmer account', file: 'sim/ending-story.mjs',
    from: 'minute: first.get(`${household.id}:${topic}`) ?? world.knowledge', to: 'minute: world.knowledge', expect: T.gap },
  { name: 'an express from a place not on the map is kept', file: X,
    from: "    if (state.from !== undefined && !world.map.sites[state.from]) return 'An express from nowhere';\n", to: '', expect: T.saves },
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
writeFileSync('docs/evidence/spring-news-injections.json', `${JSON.stringify({ record: 'spring-news-injections', date: new Date().toISOString().slice(0, 10), files: FILES, caught: record.filter(one => one.caught).length, only: record.filter(one => one.only).length, of: record.length, injections: record }, null, 2)}\n`);
console.log(`\n${record.filter(one => one.caught).length} of ${record.length} caught by the test written for them (${record.filter(one => one.only).length} by that test alone). Wrote docs/evidence/spring-news-injections.json`);
