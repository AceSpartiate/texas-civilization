// The regressions tests/ambient.test.mjs guards, injected one at a time (CLAUDE.md: "A new test is not evidence until it has
// failed"). Each injection replaces one exact piece of the code with the mistake a test is written against, runs the test file,
// records which of its tests failed, and puts the file back byte for byte. **Caught** means the test named for the rule failed;
// **alone** means nothing else in the file did. A replacement that does not match exactly once stops the run.
//
// CRLF: the working copy is CRLF; `ends` converts each pattern to the file's own line endings before it looks.
//
// Run: node scripts/ambient-injections.mjs [name-pattern]  → writes docs/evidence/ambient-injections.json
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const AMBIENT = 'sim/ambient.mjs', MOTION = 'public/motion.js', TEST = 'tests/ambient.test.mjs';
const INJECTIONS = [
  { name: 'the page draws the idle standing, whatever the server sends', file: MOTION, from: "  if (entity.kind === 'person' && entity.amb?.p) return ambientClip(variant, entity.amb);", to: '', expect: /drawn standing idle is drawn at something/ },
  { name: 'a family\'s own person is walked to a neighbour', file: AMBIENT, from: "        const visitor = near ? null : (!a.householdId ? a : !b.householdId ? b : null);", to: '        const visitor = near ? null : a;', expect: /one walks to a neighbour's door/ },
  { name: 'the words are chosen by chance, not the seed', file: AMBIENT, from: "  const chosen = pick(options, stirredShare(world, pair.key, `line:${world.tick}`));", to: '  const chosen = pick(options, Math.random());', expect: /same class gives the same/ },
  { name: 'the projection writes the activity into the world', file: AMBIENT, from: '    projected.amb = { ...amb };', to: '    projected.amb = e.amb = { ...amb };', expect: /changes nothing/ },
  { name: 'a long line', file: AMBIENT, from: "['The coffee is almost gone.', 'Then we drink it weak.']", to: "['The coffee is almost entirely gone from the barrel today.', 'Then we drink it weak.']", expect: /short and plain/ },
  { name: 'the words are passed off as on record', file: AMBIENT, from: "speakerId: pair.ids[order], text, kind: 'reconstructed'", to: "speakerId: pair.ids[order], text, kind: 'documented'", expect: /nobody named in the record/ },
  { name: 'a family hears news it never heard', file: AMBIENT, from: "  if (viewer !== 'host') statuses.push(world.knowledge?.households?.[viewer]?.[topicId]?.status || null);", to: '', expect: /war news is said only/ },
  { name: 'a townsperson knows what the Host\'s public reports say', file: AMBIENT, from: '  const site = world.map?.sites?.[truth.siteId];\n  if (!site || !point) return null;', to: '  if (world.knowledge?.public?.[topicId]) return world.knowledge.public[topicId].status;\n  const site = world.map?.sites?.[truth.siteId];\n  if (!site || !point) return null;', expect: /war news is said only/ },
  { name: 'a rumour is said as sure', file: AMBIENT, from: "  return statuses.every(status => status === 'confirmed') ? 'sure' : 'hedged';", to: "  return 'sure';", expect: /a rumour is spoken as a rumour/ },
  { name: 'no cap on the exchanges a page is sent', file: AMBIENT, from: '      if (lines.length / 2 >= most) break;', to: '', expect: /a few exchanges a tick at most/ },
  { name: 'talk goes on through a fight', file: AMBIENT, from: '  const quiet = Boolean(view.battle?.sides || ', to: '  const quiet = Boolean(', expect: /a few exchanges a tick at most/ },
  { name: 'the family\'s own busy people are drawn at an activity', file: AMBIENT, from: '    if ((own || host) && (busy(e) || littleOne(e))) return;', to: '', expect: /the family's own/ },
  { name: 'a neighbour is drawn by their chore', file: AMBIENT, from: '      const [actId, activity] = pick(mine, stirredShare(world, e.id, `act:', to: '      const [actId, activity] = pick(mine, e.chore ? 0 : stirredShare(world, e.id, `act:', expect: /a neighbour's person at work/ },
  { name: 'the server draws a different number of camp men', file: AMBIENT, from: 'export const CAMP_MEN = 18;', to: 'export const CAMP_MEN = 12;', expect: /camps' men/ },
  { name: 'every family sees every refuge\'s crowd', file: AMBIENT, from: '.filter(siteId => host || mineAt.has(siteId))', to: '', expect: /crowd at a refuge/ },
  { name: 'an activity in a pose nobody holds', file: AMBIENT, from: "  whittle: act('whittling', 'repair', { standIn: 'whittle' }),", to: "  whittle: act('whittling', 'whittle', { standIn: 'whittle' }),", expect: /pose the cast holds/ },
];

const failing = output => [...output.matchAll(/^✖ (.+?) \(\d/gm)].map(match => match[1]).filter((name, i, all) => name !== 'failing tests:' && all.indexOf(name) === i);
const run = () => { const result = spawnSync(process.execPath, ['--test', TEST], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }); return failing(`${result.stdout}${result.stderr}`); };

const only = process.argv[2] ? new RegExp(process.argv[2]) : null;
const chosen = INJECTIONS.filter(injection => !only || only.test(injection.name));
const clean = run();
if (clean.length) throw new Error(`${TEST} fails before any injection: ${clean.join('; ')}`);
const record = [];
for (const injection of chosen) {
  const file = injection.file;
  const original = readFileSync(file, 'utf8');
  const CR = String.fromCharCode(13), LF = String.fromCharCode(10);
  const ends = text => (original.includes(CR + LF) ? text.split(LF).join(CR + LF) : text);
  const from = ends(injection.from), to = ends(injection.to);
  const count = original.split(from).length - 1;
  if (count !== 1) throw new Error(`${injection.name}: the text to replace is in ${file} ${count} times`);
  writeFileSync(file, original.replace(from, to));
  let failed;
  try { failed = run(); } finally { writeFileSync(file, original); }
  const caught = failed.some(name => injection.expect.test(name));
  const alone = caught && failed.length === 1;
  record.push({ name: injection.name, file, caught, alone, failed });
  console.log(`${caught ? (alone ? 'caught alone' : 'caught') : 'MISSED'}: ${injection.name} -> ${failed.join(' | ') || 'nothing failed'}`);
}
if (run().length) throw new Error(`${TEST} fails after every file was put back`);
if (!only) {
  mkdirSync('docs/evidence', { recursive: true });
  writeFileSync('docs/evidence/ambient-injections.json', `${JSON.stringify({
    record: 'ambient-injections',
    date: new Date().toISOString().slice(0, 10),
    note: 'Ambient life and chatter (docs/AMBIENT.md, 2026-09-28). Each injection is run against tests/ambient.test.mjs; "alone" means the test named for the rule was the only one to fail.',
    injections: record,
  }, null, 2)}\n`);
}
console.log(`\n${record.filter(r => r.caught).length} of ${record.length} caught, ${record.filter(r => r.alone).length} alone${only ? '' : '; wrote docs/evidence/ambient-injections.json'}`);
