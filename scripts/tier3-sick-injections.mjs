// The regressions the sickness and wound rows of the 2026-09-29 triage's Tier 3 (3.8, 3.9, 3.13-3.16) are guarded against,
// injected one at a time (CLAUDE.md: "A new test is not evidence until it has failed"): each replaces exact text with the mistake
// - most of them the code as it was on `integration-2026-09-28` (4c38be85) - runs tests/tier3-sick.test.mjs and
// tests/storming.test.mjs, records what failed, checks that the test written for it is among them, and puts every file back byte
// for byte.
//
// Run: node scripts/tier3-sick-injections.mjs → docs/evidence/tier3-sick-injections.json
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const T = Object.freeze({
  doctor: '3.8: the doctor can be brought',
  nurse: '3.8: somebody lying wounded at home can be nursed',
  word: '3.9: a death from wounds comes to the family with the word',
  flash: '3.9: the flashback tells a death from wounds',
  before: '3.9: a family that heard of the storming before the wound killed',
  winter: '3.9: a family the word never reached in the autumn',
  child: '3.13: a child with nothing to do does not call a nursing parent aside',
  going: '3.13: a child already on the way',
  camp: '3.14: a very sick or wounded man in Houston',
  slight: '3.15: a slight hurt does not wipe a sickness',
  storm: '3.15: in the storming a wound that lays a man down',
  every: '3.15: every wound in the game',
  reverse: '3.15: a sickness coming out never wipes a wound',
  carried: '3.16: a sick baby carried on the road',
  held: '3.16: a sick baby held through a whole day',
});
const INJECTIONS = [
  // ------------------------------------------------------------------ 3.8 the wounded at home
  { name: 'the doctor cannot be brought to the wounded (as before: no such offer)', expect: [T.doctor], edits: [{ file: 'sim/shops.mjs', from: "id: 'call', kind: 'sell'", to: "id: 'call-gone', kind: 'sell'" }] },
  { name: 'the doctor comes and does nothing for the wound', expect: [T.doctor], edits: [{ file: 'sim/shops.mjs', from: '          one.health = { ...one.health, recoversAt: world.minute + Math.round(left / 2) };\n', to: '' }] },
  { name: 'nursing is for the sick only (as before)', expect: [T.nurse], edits: [{ file: 'sim/disease.mjs', from: "const needsNursing = one => ['sick', 'wounded'].includes(one?.health?.condition);", to: "const needsNursing = one => ['sick'].includes(one?.health?.condition);" }] },
  // ------------------------------------------------------------------ 3.9 a death from wounds
  { name: 'a death from wounds comes at once, before the word (as before)', expect: [T.word], edits: [{ file: 'sim/army.mjs', from: '    if (storming.told || storming.toldTo?.[person.householdId]) woundDeathTold(world, person, outcome, null);', to: '    woundDeathTold(world, person, outcome, null);' }] },
  { name: 'the account of a death from wounds is never on the card (as before)', expect: [T.word, T.before], edits: [{ file: 'sim/directors.mjs', from: "  const woundDeath = role === 'student' && householdId ? woundDeathCard(world, householdId) : null;", to: '  const woundDeath = null;' }] },
  { name: 'the account of a death from wounds is shown to every family', expect: [T.word], edits: [{ file: 'sim/army.mjs', from: '  const told = world.army?.storming?.deathsTold?.[householdId];', to: '  const told = Object.values(world.army?.storming?.deathsTold || {})[0];' }] },
  { name: 'the flashback says a man dead of his wound was hurt and lived (as before)', expect: [T.flash], edits: [{ file: 'sim/flashback.mjs', from: "      if (fate?.kind === 'dead' && event === 'bexar-storming' && world.army?.storming?.outcomes?.some(one => one.id === person.id && one.fate === 'died-of-wounds')) return", to: '      if (false) return' }] },
  { name: 'the flashback counts a death from wounds as a sickness (as before)', expect: [T.flash], edits: [{ file: 'sim/flashback.mjs', from: " || (/\\bdied of\\b/.test(said?.text || '') && !/\\bdied of (the|his|her|their) wound/.test(said?.text || ''));", to: " || /\\bdied of\\b/.test(said?.text || '');" }] },
  { name: 'a family told of the storming first is never told of the later death', expect: [T.before], edits: [{ file: 'sim/army.mjs', from: '    if (storming.told || storming.toldTo?.[person.householdId]) woundDeathTold(world, person, outcome, null);', to: '' }] },
  { name: 'the word over the winter does not tell the storming', expect: [T.winter], edits: [{ file: 'sim/periods.mjs', from: '  tellStorming(world, opened, new Set(Object.keys(world.households)));\n', to: '' }] },
  { name: 'a man dead of his wound is told of as still lying wounded over the winter', expect: [T.winter], edits: [{ file: 'sim/periods.mjs', from: ' || diedOfWounds.has(id)) continue;', to: ') continue;' }] },
  // ------------------------------------------------------------------ 3.13 the nursing parent
  { name: 'a child calls a nursing parent aside (as before)', expect: [T.child], edits: [{ file: 'sim/childhood.mjs', from: " && person.health?.condition !== 'wounded' && !nursing(person));", to: " && person.health?.condition !== 'wounded');" }] },
  { name: 'a child on the way keeps on to a parent sent to nurse', expect: [T.going], edits: [{ file: 'sim/childhood.mjs', from: " || grown.aside?.kind === 'baby' || nursing(grown) || quiet) {", to: " || grown.aside?.kind === 'baby' || quiet) {" }] },
  // ------------------------------------------------------------------ 3.14 Houston's camp
  { name: 'a very sick or wounded man in the camp is asked whether to go home (as before)', expect: [T.camp], edits: [{ file: 'sim/camp.mjs', from: "    if (key === 'leave' && abed(entity)) {", to: "    if (false && key === 'leave' && abed(entity)) {" }] },
  { name: '"go" from a man turned very sick is taken, and fails after the answer (as before)', expect: [T.camp], edits: [{ file: 'sim/camp.mjs', from: "  if (key === 'leave' && answer === 'yes' && abed(entity)) return `${abed(entity)}, and cannot go home.`;\n", to: '' }] },
  // ------------------------------------------------------------------ 3.15 a wound on the sick
  { name: 'a wound replaces a sickness outright (as before)', expect: [T.slight, T.storm], edits: [{ file: 'sim/disease.mjs', from: "  if (health?.condition !== 'sick') { person.health = wound; return wound; }", to: '  { person.health = wound; return wound; }' }] },
  { name: 'a wound that lays a man down wipes his sickness without a word', expect: [T.storm], edits: [{ file: 'sim/disease.mjs', from: "    tell(world, person, `${person.name} was ${health.grave ? 'very ' : ''}${sickWith} as well. Lying wounded, ${they(person)} will be over it in bed.`, { importance: 2, claimId: 'FIC-GONZ-734' });\n", to: '' }] },
  { name: 'Concepción sets its hurt outright (as before)', expect: [T.slight, T.every], edits: [{ file: 'sim/army.mjs', from: "    takeWound(world, person, { condition: 'minor-injury', recoversAt: world.minute + MEND_MINUTES });", to: "    person.health = { condition: 'minor-injury', recoversAt: world.minute + MEND_MINUTES };" }] },
  { name: 'the storming sets its wound outright (as before)', expect: [T.storm, T.every], edits: [{ file: 'sim/army.mjs', from: '    takeWound(world, person, { condition: spec.condition, grade, recoversAt: world.minute + spec.minutes });', to: '    person.health = { condition: spec.condition, grade, recoversAt: world.minute + spec.minutes };' }] },
  { name: 'a ball in a chase sets its wound outright (as before)', expect: [T.every], edits: [{ file: 'sim/pursuit.mjs', from: "    takeWound(world, entity, { condition: 'wounded', recoversAt: world.minute + WOUND_DAYS * 1440 });", to: "    entity.health = { condition: 'wounded', recoversAt: world.minute + WOUND_DAYS * 1440 };" }] },
  { name: 'Coleto sets its wound outright (as before)', expect: [T.every], edits: [{ file: 'sim/fannin.mjs', from: "    if (entry.fate === 'wounded') takeWound(world, person, { condition: WOUND_GRADES.severe.condition, grade: 'severe', recoversAt: world.minute + WOUND_GRADES.severe.minutes });", to: "    if (entry.fate === 'wounded') person.health = { condition: WOUND_GRADES.severe.condition, grade: 'severe', recoversAt: world.minute + WOUND_GRADES.severe.minutes };" }] },
  { name: 'the scouts set their hurt outright (as before)', expect: [T.every], edits: [{ file: 'sim/camp.mjs', from: "    if (hurt) takeWound(world, entity, { condition: WOUND_GRADES.slight.condition, grade: 'slight', recoversAt: world.minute + WOUND_GRADES.slight.minutes });", to: "    if (hurt) entity.health = { condition: WOUND_GRADES.slight.condition, grade: 'slight', recoversAt: world.minute + WOUND_GRADES.slight.minutes };" }] },
  { name: 'a sickness comes out over a wound and wipes it (as before)', expect: [T.reverse], edits: [{ file: 'sim/disease.mjs', from: "    if (['sick', 'wounded'].includes(person.health?.condition)) { person.exposed[disease] = at + DAY; continue; }", to: "    if (person.health?.condition === 'sick') { person.exposed[disease] = at + DAY; continue; }" }] },
  // ------------------------------------------------------------------ 3.16 the carried baby
  { name: 'carried on the road counts as nursing while the family goes on (as before)', expect: [T.carried], edits: [{ file: 'sim/disease.mjs', from: "    const held = person.baby?.state === 'held' || ((person.carriedBy || person.travel?.carried) && activityOf(world, person) === 'rest');", to: "    const held = person.baby?.state === 'held' || person.carriedBy || person.travel?.carried;" }] },
  { name: 'a moment held counts as a day\'s nursing (as before)', expect: [T.held], edits: [{ file: 'sim/disease.mjs', from: '    const heldADay = held && world.minute - person.health.heldSince >= DAY;', to: '    const heldADay = held;' }] },
];

const TESTS = ['tests/tier3-sick.test.mjs', 'tests/storming.test.mjs'];
const failing = output => [...output.matchAll(/^✖ (.+?) \(\d/gm)].map(match => match[1]).filter((name, i, all) => name !== 'failing tests:' && all.indexOf(name) === i);
const runTests = () => { const result = spawnSync(process.execPath, ['--test', ...TESTS], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }); return failing(`${result.stdout}${result.stderr}`); };
const before = runTests();
if (before.length) throw new Error(`The tests fail before any injection: ${before.join(' | ')}`);
const record = [];
const CR = String.fromCharCode(13), LF = String.fromCharCode(10);
for (const injection of INJECTIONS) {
  const originals = new Map();
  try {
    for (const edit of injection.edits) {
      if (!originals.has(edit.file)) originals.set(edit.file, readFileSync(edit.file, 'utf8'));
      const text = readFileSync(edit.file, 'utf8');
      const count = needle => text.split(needle).length - 1;
      const crlf = !count(edit.from) && count(edit.from.split(LF).join(CR + LF));
      const from = crlf ? edit.from.split(LF).join(CR + LF) : edit.from, to = crlf ? edit.to.split(LF).join(CR + LF) : edit.to;
      if (count(from) !== 1) throw new Error(`${injection.name}: the text to replace is in ${edit.file} ${count(from)} times`);
      writeFileSync(edit.file, text.replace(from, to));
    }
    const failed = runTests();
    const missing = injection.expect.filter(want => !failed.some(name => name.startsWith(want)));
    const caught = failed.length > 0 && !missing.length;
    record.push({ name: injection.name, files: [...originals.keys()], expected: injection.expect, caught, failed, ...(missing.length && { missing }) });
    console.log(`${caught ? 'caught' : 'MISSED'}: ${injection.name} -> ${failed.join(' | ') || 'nothing failed'}${missing.length ? ` (expected ${missing.join(', ')})` : ''}`);
  } finally { for (const [file, text] of originals) writeFileSync(file, text); }
}
const after = runTests();
if (after.length) throw new Error(`The tests fail after every file was put back: ${after.join(' | ')}`);
mkdirSync('docs/evidence', { recursive: true });
const out = 'docs/evidence/tier3-sick-injections.json';
writeFileSync(out, `${JSON.stringify({ record: 'tier3-sick-injections', date: new Date().toISOString().slice(0, 10), injections: record }, null, 2)}\n`);
console.log(`\n${record.filter(r => r.caught).length} of ${record.length} caught; wrote ${out}`);
if (record.some(r => !r.caught)) process.exitCode = 1;
