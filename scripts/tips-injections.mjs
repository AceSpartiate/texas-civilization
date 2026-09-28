// The regressions the checks of 2026-09-28 guard - tips at first meeting, the guided start's gate narrowed to the farm and
// ended with the first period, the "!"s ranked with their time left, and the Watch alert behind the family's own road -
// injected one at a time (CLAUDE.md: "A new test is not evidence until it has failed"). Each replaces one exact piece of a
// file with the mistake a test is written against, runs the test files, records which tests failed, checks that the test
// written for it is among them, and puts the file back byte for byte.
//
// Run: npm run test:tips-injections  → writes docs/evidence/tips-injections.json
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const FILES = ['tests/tips.test.mjs', 'tests/need-ranking.test.mjs', 'tests/lesson.test.mjs', 'tests/family-commands.test.mjs', 'tests/lesson-usability.test.mjs', 'tests/errands.test.mjs', 'tests/creation-words.test.mjs', 'tests/lesson-screen.test.mjs', 'tests/military-attention.test.mjs'];
const T = { words: 'every tip the server can remember', kept: 'seen tips are kept by the server', lobby: 'putting a tip away is never refused', due: 'each tip is due when its thing', once: 'a tip is shown once', order: 'every "!" of the column is in one order', left: 'the time left is read from what the server said', sent: 'the server sends the time left', watch: 'the Watch alert waits', never: 'never refuses food, nursing', held: 'still holds back another farm step', ends: 'ends for every family when the first period does', winter: 'a class saved in the winter' };
const INJECTIONS = [
  // Tips: the server's memory.
  { name: 'putting a tip away is not kept: the next snapshot, or a reload, shows it again', file: 'sim/tips.mjs', from: '  household.tipsSeen = [...seen, id];', to: '', expect: T.kept },
  { name: 'a tip put away twice is kept twice, and the save refuses the family', file: 'sim/tips.mjs', from: '  if (seen.includes(id)) return;', to: '', expect: T.kept },
  { name: 'any word at all is kept as a tip seen', file: 'sim/tips.mjs', from: "  if (!TIP_IDS.includes(id)) throw new Error('There is no such tip.');", to: '', expect: T.kept },
  { name: 'the director marks tips seen for a family whose student has gone', file: 'sim/tips.mjs', from: '  if (!household || household.absent || !household.played) throw', to: '  if (!household) throw', expect: T.kept },
  { name: 'a save may carry anything as the tips seen', file: 'sim/tips.mjs', from: "  if (!Array.isArray(seen) || seen.some(id => !TIP_IDS.includes(id)) || new Set(seen).size !== seen.length) return 'Invalid tips seen';", to: '', expect: T.kept },
  { name: 'the tips seen never reach the family\'s page, so every reload shows them all again', file: 'sim/world.mjs', from: '  delete shown.mainId;\n', to: '  delete shown.mainId;\n  delete shown.tipsSeen;\n', expect: T.kept },
  { name: 'the guided start refuses the order to put a tip away', file: 'sim/lesson.mjs', from: "  if (ALWAYS.includes(id) || !FARM_WORK.includes(id)) return null;", to: "  if (id !== 'seen-tip' && (ALWAYS.includes(id) || !FARM_WORK.includes(id))) return null;", expect: T.lobby },
  // Tips: the page's reading.
  { name: 'the Host - the projector - is shown tips', file: 'public/tips.js', from: "  if (!world || world.role === 'host' || !world.householdId || !world.household) return [];", to: '  if (!world || !world.householdId || !world.household) return [];', expect: T.due },
  { name: 'tips come up in the lobby and over the ending', file: 'public/tips.js', from: "  if (!['running', 'paused'].includes(world.status)) return [];", to: '', expect: T.due },
  { name: 'the star\'s tip comes up in the middle of the guided start', file: 'public/tips.js', from: '    star: world.status === \'running\' && !(world.lesson && !world.lesson.done) && ', to: "    star: world.status === 'running' && ", expect: T.due },
  { name: 'a call the family cannot answer is taken for its first meeting with a call', file: 'public/tips.js', from: " && own.some(one => requestFor(world, one)?.options?.length),", to: ',', expect: T.due },
  { name: 'a tip being read is pulled away when a more urgent one comes', file: 'public/tips.js', from: '    if (present.includes(showing)) return { show: showing, retire: null };', to: '', expect: T.once },
  { name: 'a tip whose thing went while it stood is never retired, so it comes back next time', file: 'public/tips.js', from: '    return { show: present.find(id => !done.has(id)) || null, retire: showing };', to: '    return { show: present.find(id => !done.has(id)) || null, retire: null };', expect: T.once },
  { name: 'the cost of resting on the road is only in the hover popup again', file: 'public/tips.js', from: 'but the family makes no miles and the Mexican army keeps coming.', to: 'and the family stops.', expect: T.words },
  // The "!"s ranked.
  { name: 'a row\'s needs are in the order they were found, not the most urgent first', file: 'public/family-panel.js', from: '  return needs.sort(byUrgency);', to: '  return needs;', expect: T.order },
  { name: 'the rows are not ranked against each other', file: 'public/family-panel.js', from: '  ranked.sort(byUrgency);\n', to: '', expect: T.order },
  { name: 'ties are not broken by the time left', file: 'public/family-panel.js', from: '  return (a.leftMs ?? Infinity) - (b.leftMs ?? Infinity);', to: '  return 0;', expect: T.order },
  { name: '¡Alto! is one more road question, ranked with the bog', file: 'public/family-panel.js', from: "kind: world.flight.ask.id === 'alto' ? 'alto' : 'road'", to: "kind: 'road'", expect: T.order },
  { name: 'ticks are read as seconds, whatever the class\'s pace', file: 'public/family-panel.js', from: '{ leftMs: count * tickMs }', to: '{ leftMs: count * 1000 }', expect: T.left },
  { name: 'the time left is rounded down, so a question with a moment left reads as gone', file: 'public/family-panel.js', from: '  if (ms < 60_000) return `${Math.max(1, Math.ceil(ms / 1000))}s`;', to: '  if (ms < 60_000) return `${Math.floor(ms / 1000)}s`;', expect: T.left },
  { name: 'the call goes to the page without its time left', file: 'sim/directors.mjs', from: '      if (clock) shown.leftMs = Math.max(0, Math.round(clock.of - clock.spent)); }', to: '      }', expect: T.sent },
  { name: 'the army\'s questions go to the page without their time left', file: 'sim/decision-budget.mjs', from: '    left = left === null ? now : Math.min(left, now);', to: '', expect: T.sent },
  { name: 'the call\'s five minutes are counted as a question of the person the clock names', file: 'sim/decision-budget.mjs', from: "    if (key.startsWith('call:') || entry.personId !== personId) continue;", to: '    if (entry.personId !== personId) continue;', expect: T.sent },
  { name: 'the order to leave goes to the page without its time left', file: 'sim/world.mjs', from: "...(household.flight.status === 'ordered' && Number.isFinite(household.flight.orderedMinute) && { ticksLeft", to: "...(false && { ticksLeft", expect: T.sent },
  { name: 'the soldiers\' ¡Alto! is given the road\'s twelve ticks', file: 'sim/road.mjs', from: "  const patience = ask.id === 'alto' ? ALTO_PATIENCE_TICKS : ROAD_PATIENCE_TICKS;", to: '  const patience = ROAD_PATIENCE_TICKS;', expect: T.sent },
  { name: 'Watch springs open over the family\'s own road', file: 'public/military-attention.js', from: ' || meeting?.status === \'open\' || roadAsking;', to: " || meeting?.status === 'open';", expect: T.watch },
  // The gate narrowed, and ended with the period.
  { name: 'the gate is as strict as it was: everything off the step is refused, food, nursing and the war with it', file: 'sim/lesson.mjs', from: "  if (ALWAYS.includes(id) || !FARM_WORK.includes(id)) return null;", to: '  if (ALWAYS.includes(id)) return null;', expect: T.never },
  { name: 'the town and the hunt are held back again, so a family on the house step cannot get food', file: 'sim/lesson.mjs', from: "export const NEVER_HELD = Object.freeze(['chore:visit-shop', 'hunt-land', 'chore:hunt-land', 'chore:hunt-timber']);", to: 'export const NEVER_HELD = Object.freeze([]);', expect: T.never },
  { name: 'the page is told nothing is shut while the server still refuses the other farm steps', file: 'sim/lesson.mjs', from: '    shut: shutBy(current, world, household),', to: '    shut: [],', expect: T.held },
  { name: 'the page reads the old `allow` and greys everything off the step', file: 'public/lesson.js', from: '  if (Array.isArray(lesson.shut)) return !names(lesson.shut, icon);\n', to: '', expect: T.held },
  { name: 'the gate forgets the farm entirely: no farm step\'s work is held back', file: 'sim/lesson.mjs', from: '  if (current.allow(world, household).includes(id)) return null;\n  return `Not yet - first, ${current.first}`;', to: '  return null;', expect: T.held },
  { name: 'the guided start goes on past the first period', file: 'sim/lesson.mjs', from: " && !household.flight && (world.period || 1) === 1;", to: ' && !household.flight;', expect: T.winter },
  { name: 'going on to the winter does not close the lessons still running', file: 'sim/periods.mjs', from: '  closeLessons(world);\n', to: '', expect: T.ends },
  { name: 'a save may carry a lesson closed by the period still standing on a step', file: 'sim/lesson.mjs', from: "  if ((lesson.stopped || lesson.closed) && lesson.step !== 'done') return 'Invalid lesson step';", to: "  if (lesson.stopped && lesson.step !== 'done') return 'Invalid lesson step';", expect: T.ends },
];

const failing = output => [...new Set([...output.matchAll(/^\s*✖ (.+?) \(\d/gm)].map(match => match[1].trim()).filter(name => !/^tests[\\/]/.test(name) && name !== 'failing tests:'))];
const run = () => { const result = spawnSync(process.execPath, ['--test', ...FILES], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }); return failing(`${result.stdout}${result.stderr}`); };

// Every pattern is checked before anything runs, so a stale one fails in a second rather than thirty injections in.
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
  record.push({ name: injection.name, file: injection.file, expected: injection.expect, caught, failed });
  console.log(`${caught ? 'CAUGHT' : 'MISSED'} ${injection.name}${caught ? '' : ` (failed: ${failed.join('; ') || 'nothing'})`}`);
}
if (run().length) throw new Error('The tests fail after every file was put back');
mkdirSync('docs/evidence', { recursive: true });
writeFileSync('docs/evidence/tips-injections.json', `${JSON.stringify({ record: 'tips-injections', date: new Date().toISOString().slice(0, 10), files: FILES, caught: record.filter(one => one.caught).length, of: record.length, injections: record }, null, 2)}\n`);
console.log(`\n${record.filter(one => one.caught).length} of ${record.length} caught by the test written for them. Wrote docs/evidence/tips-injections.json`);
