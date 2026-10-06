// The regressions a rider's scene guards (owner, 2026-10-05: "Every rider who reaches you"; tests/rider-scenes.test.mjs;
// sim/rider-scene.mjs, sim/rider-talk.mjs, sim/encounters.mjs, sim/expresses.mjs, public/rider-scene.js), injected one at a time
// (CLAUDE.md: "A new test is not evidence until it has failed"). Each replaces exact pieces of files with the mistake a test is
// written against, runs the test file, records which tests failed, checks the test written for it is among them, and puts every
// file back byte for byte.
//
// Run: node scripts/rider-scene-injections.mjs [--only=<name prefix>]  → writes docs/evidence/rider-scene-injections.json
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const FILES = ['tests/rider-scenes.test.mjs'];
const T = {
  where: 'the scene is where the person the rider stopped is standing', who: 'whoever is near is in the scene',
  talk: 'the rider who stops is met in a scene', kin: 'somebody of the family away with the volunteers',
  words: 'every word the director sends by express', express: 'an express rider tells the family',
  queue: 'one family listens to one rider at a time', old: 'a class saved before rider scenes still opens',
  light: 'the scene is lit by the class', page: 'the page sets each place',
};
const one = (file, from, to) => ({ file, from, to });
const S = 'sim/rider-scene.mjs', R = 'sim/rider-talk.mjs', E = 'sim/encounters.mjs', X = 'sim/expresses.mjs', P = 'public/rider-scene.js';
const INJECTIONS = [
  { name: 'never at home', edits: [one(S, '  if (homeHere && !townSite) {', '  if (false) {')], expect: T.where },
  { name: 'a serving man is wherever he stands', edits: [one(S, "  if (person.service?.status === 'serving' || site?.kind === 'camp') {", "  if (site?.kind === 'camp') {")], expect: T.where },
  { name: 'the river does not part a scene', edits: [one(S, '    && !blocked(person.location, listener.location))', '    && true)')], expect: T.who },
  { name: 'the town\'s people never in it', edits: [one(S, "  if (person.resident || person.keeper || person.townSiteId) return 'town';", "  if (false) return 'town';")], expect: T.who },
  { name: 'everybody said before the rider', edits: [one(R, '  (encounter.talk ||= []).push({ after: encounter.said.length,', '  (encounter.talk ||= []).push({ after: 0,')], expect: T.talk },
  { name: 'nobody says goodbye', edits: [one(E, "  if (reason !== 'parted' && encounter.scene) react(world, encounter, 'closing');", '')], expect: T.talk },
  { name: 'the listener asks every question', edits: [one(E, "  const asked = say(world, encounter, 'listener', line.ask, [encounter.metEventId], askerFor(world, encounter, line));", "  const asked = say(world, encounter, 'listener', line.ask, [encounter.metEventId]);")], expect: T.talk },
  { name: 'the one away asked after by anybody', edits: [one(R, '  spouse: one => one.spouseOfAway,', '  spouse: () => false,'), one(R, '  own: one => one.spouseOfAway || one.childOfAway,', '  own: () => false,')], expect: T.kin },
  { name: 'a word with nothing of its own to ask', edits: [one(R, "  'winter-council': { ask: 'Who is in charge, then?',", "  'winter-councils': { ask: 'Who is in charge, then?',")], expect: T.words },
  { name: 'the express told with no rider', edits: [one(X, "      tellPassing(world, household.id, { topicId, listenerId: heard.personId,", "      false && tellPassing(world, household.id, { topicId, listenerId: heard.personId,")], expect: T.express },
  { name: 'a family nobody plays given a scene', edits: [one(E, '  if (!household?.played || !listener ||', '  if (!household || !listener ||')], expect: T.express },
  { name: 'the answers sent with the questions', edits: [one(E, 'questions: open ? questionsFor(encounter).map(line => ({ id: line.id, ask: line.ask, by: askerFor(world, encounter, line) }))', 'questions: open ? questionsFor(encounter).map(line => ({ id: line.id, ask: line.ask, by: askerFor(world, encounter, line), answer: line.answer(accountOf(world, encounter)) }))')], expect: T.express },
  { name: 'two riders talk to a family at once', edits: [one(E, '  const queued = Boolean(openFor(world, householdId));', '  const queued = false;')], expect: T.queue },
  { name: 'the next comes on while the first still talks', edits: [one(E, "    if (encounter.status !== 'waiting' || openFor(world, encounter.householdId)) continue;", "    if (encounter.status !== 'waiting') continue;")], expect: T.queue },
  { name: 'an old save without a scene refused', edits: [one(S, '  if (scene === undefined) return null;', "  if (scene === undefined) return 'Invalid rider scene';")], expect: T.old },
  { name: 'the afternoon an hour short', edits: [one(S, "  if (hour < 18) return { light: 'evening', when: 'Afternoon' };", "  if (hour < 17) return { light: 'evening', when: 'Afternoon' };")], expect: T.light },
  { name: 'Gonzales drawn as any town', edits: [one(P, "    const row = id === 'gonzales' ? STREET.gonzales :", "    const row = id === 'gonzalez' ? STREET.gonzales :")], expect: T.page },
];

const failing = output => [...new Set([...output.matchAll(/^\s*✖ (.+?) \(\d/gm)].map(match => match[1].trim()).filter(name => !/^tests[\\/]/.test(name) && name !== 'failing tests:'))];
const run = () => {
  const result = spawnSync(process.execPath, ['--test', '--test-reporter=spec', ...FILES], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const out = `${result.stdout}${result.stderr}`;
  // A file that will not load fails as a whole: said, so an injection that breaks the syntax is never read as caught.
  return { failed: failing(out), passed: [...out.matchAll(/^\s*✔ /gm)].length, broken: /SyntaxError|ReferenceError: \w+ is not defined/.test(out) };
};
for (const injection of INJECTIONS) {
  for (const edit of injection.edits) {
    const text = readFileSync(edit.file, 'utf8').replace(/\r\n/g, '\n');
    const at = text.indexOf(edit.from);
    if (at < 0) throw new Error(`Injection pattern not found in ${edit.file}: ${injection.name}`);
    if (text.indexOf(edit.from, at + 1) >= 0) throw new Error(`Injection pattern found twice in ${edit.file}: ${injection.name}`);
  }
}
const only = (process.argv.find(arg => arg.startsWith('--only=')) || '').slice(7);
const chosen = INJECTIONS.filter(injection => !only || injection.name.startsWith(only));
const clean = run();
if (clean.failed.length || !clean.passed) throw new Error(`The tests fail before anything is injected: ${clean.failed.join('; ') || 'nothing ran'}`);
const record = [];
for (const injection of chosen) {
  const originals = new Map(injection.edits.map(edit => [edit.file, readFileSync(edit.file, 'utf8')]));
  let result;
  try {
    for (const edit of injection.edits) {
      const original = readFileSync(edit.file, 'utf8'), crlf = original.includes('\r\n');
      const text = original.replace(/\r\n/g, '\n').replace(edit.from, edit.to);
      writeFileSync(edit.file, crlf ? text.replace(/\n/g, '\r\n') : text);
    }
    result = run();
  } finally { for (const [file, text] of originals) writeFileSync(file, text); }
  const caught = !result.broken && result.failed.some(name => name.includes(injection.expect));
  const alone = caught && result.failed.every(name => name.includes(injection.expect));
  record.push({ name: injection.name, files: injection.edits.map(edit => edit.file), expected: injection.expect, caught, only: alone, failed: result.failed, ...(result.broken && { broken: true }) });
  console.log(`${caught ? 'CAUGHT' : 'MISSED'}${caught && !alone ? ' (with others)' : ''} ${injection.name}${caught && alone ? '' : ` (failed: ${result.failed.join('; ') || 'nothing'}${result.broken ? '; the files did not load' : ''})`}`);
}
if (run().failed.length) throw new Error('The tests fail after every file was put back');
if (!only) {
  mkdirSync('docs/evidence', { recursive: true });
  writeFileSync('docs/evidence/rider-scene-injections.json', `${JSON.stringify({ record: 'rider-scene-injections', date: new Date().toISOString().slice(0, 10), caught: record.filter(one => one.caught).length, only: record.filter(one => one.only).length, of: record.length, injections: record }, null, 1)}\n`);
}
console.log(`\n${record.filter(one => one.caught).length} of ${record.length} caught by the test written for them (${record.filter(one => one.only).length} by that test alone).${only ? '' : ' Wrote docs/evidence/rider-scene-injections.json'}`);
