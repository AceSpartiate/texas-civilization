// The regressions "all of it by express" (owner, 2026-09-29: "Hold the end", "Keep it", "All of it"; docs/COLONIES.md §5.4d)
// is guarded against, injected one at a time (CLAUDE.md: "A new test is not evidence until it has failed"). Each replaces one
// exact piece of a file with the mistake a test is written against, runs the test files, records which tests failed, checks
// that the test written for it is among them, and puts the file back byte for byte.
//
// Run: npm run test:news-all-riders-injections  → writes docs/evidence/news-all-riders-injections.json
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const FILES = ['tests/news-all-riders.test.mjs', 'tests/winter.test.mjs', 'tests/battle-bexar.test.mjs'];
const T = {
  autumn: 'the autumn\'s news goes by express', winter: 'the winter\'s news and the spring\'s first word', over: 'word still on the road when the autumn ends',
  killed: 'killed: he falls at his staged moment', south: 'what became of its own men in the south', hold: 'the class\'s end waits, a day at most', offered: 'nothing of the winter is offered in 1835',
};
const D = 'sim/directors.mjs', X = 'sim/expresses.mjs';
const INJECTIONS = [
  { name: 'the autumn\'s and winter\'s news told to every family at once, as before (the defect)', file: D,
    from: '  const carried = Boolean(from) && sendExpress(world, topicId,', to: '  const carried = false && sendExpress(world, topicId,', expect: T.autumn },
  { name: 'a word the record dates at San Felipe leaves the army on that date instead of in time to be there', file: D,
    from: 'if (world.minute < Math.max(floor, momentOf(world, anchor) - expressMinutes(world, from, to))) return;', to: 'if (world.minute < Math.max(floor, momentOf(world, anchor))) return;', expect: T.autumn },
  { name: 'the schedule is not kept: the word waits on riders ridden on the long ticks', file: X,
    from: '    if (!state.due || state.settled) continue;\n    const topicId = state.topicId || key;\n    for (const [stop, minute] of Object.entries(state.due)) {', to: '    continue;\n    const topicId = state.topicId || key;\n    for (const [stop, minute] of Object.entries(state.due)) {', expect: T.autumn },
  { name: 'word still on the road at the autumn\'s end never comes in', file: 'sim/periods.mjs',
    from: "  settleExpresses(world, 'Word that came over the winter');", to: '', expect: T.over },
  { name: 'every family is told of its own at the storming when the first one hears', file: D,
    from: '  if (storming.size) tellStorming(world, null, storming);', to: '  if (storming.size) tellStorming(world, null);', expect: T.killed },
  { name: 'every family is told of its own in the south when the first one hears', file: D,
    from: '    if (heard.size) { tellSouth(world, fight, heard); tellSouthAccount(world, fight, heard); }', to: '    if (heard.size) { tellSouth(world, fight); tellSouthAccount(world, fight); }', expect: T.south },
  { name: 'Travis\'s letter reaches the other settlements all on one day', file: D,
    from: "    if (!world.expresses?.['alamo-siege']) word(world, 'alamo-siege', otherFamilies(world),", to: "    if (true) word(world, 'alamo-siege', otherFamilies(world),", expect: T.winter },
  { name: 'the winter\'s choices are offered before its news has reached the family', file: 'sim/winter.mjs',
    from: '  return !topicId || !world.expresses?.[topicId] || Boolean(world.knowledge?.households?.[household.id]?.[topicId]);', to: '  return true;', expect: T.offered },
  { name: 'the end does not wait for San Jacinto', file: D,
    from: "  if (holdForWord(world, 'san-jacinto', 'scrape-end')) return;\n", to: '', expect: T.hold },
  { name: 'the end waits as long as it takes', file: D,
    from: '  if (!world.expresses?.[key] || world.minute >= momentOf(world, endKey) + WORD_HOLD_MINUTES) return false;', to: '  if (!world.expresses?.[key]) return false;', expect: T.hold },
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
writeFileSync('docs/evidence/news-all-riders-injections.json', `${JSON.stringify({ record: 'news-all-riders-injections', date: new Date().toISOString().slice(0, 10), files: FILES, caught: record.filter(one => one.caught).length, only: record.filter(one => one.only).length, of: record.length, injections: record }, null, 2)}\n`);
console.log(`\n${record.filter(one => one.caught).length} of ${record.length} caught by the test written for them (${record.filter(one => one.only).length} by that test alone). Wrote docs/evidence/news-all-riders-injections.json`);
