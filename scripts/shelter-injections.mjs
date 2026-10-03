// The regressions the tent, the shelter and the quicker house guard (owner, 2026-10-02; tests/shelter.test.mjs,
// tests/house-pace.test.mjs; sim/shelter.mjs, sim/work-pace.mjs), injected one at a time (CLAUDE.md: "A new test is not evidence
// until it has failed"). Each replaces exact pieces of files with the mistake a test is written against, runs the two test files,
// records which tests failed, checks the test written for it is among them, and puts every file back byte for byte.
//
// Run: node scripts/shelter-injections.mjs [--only=<name prefix>]  → writes docs/evidence/shelter-injections.json
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const FILES = ['tests/shelter.test.mjs', 'tests/house-pace.test.mjs'];
const T = {
  weather: 'the weather that sends people in', tent: 'the tent: offered', rain: 'rain: everybody with no task',
  companion: 'somebody of ten or more sits with the children', order: "a student's order wins", prefer: 'the companion: somebody free before',
  alone: 'with nobody of ten or more who can come', unplayed: 'a family nobody plays', first: 'the first turn of the weather', house: 'with a roof the family goes into the house',
  paces: 'the paces:', words: 'the words follow', build: 'one ordinary hand raises', fell: 'one ordinary hand fells',
};
const one = (file, from, to) => ({ file, from, to });
const S = 'sim/shelter.mjs';
const INJECTIONS = [
  { name: 'a dry norther sends nobody in', edits: [one(S, "export const INCLEMENT = Object.freeze(['rain', 'storm', 'norther']);", "export const INCLEMENT = Object.freeze(['rain', 'storm']);")], expect: T.weather },
  { name: 'fog sends people in', edits: [one(S, "export const INCLEMENT = Object.freeze(['rain', 'storm', 'norther']);", "export const INCLEMENT = Object.freeze(['rain', 'storm', 'norther', 'fog']);")], expect: T.weather },
  { name: 'the children stay out in the rain', edits: [one(S, "const child = person => tooYoung(person) && !person.carriedBy && person.baby?.state !== 'held';", 'const child = () => false;')], expect: T.rain },
  { name: 'somebody at a task goes in too', edits: [one(S, 'const free = person => !tooYoung(person) && !person.chore && !person.aside && !person.talk;', 'const free = person => !tooYoung(person) && !person.aside && !person.talk;')], expect: T.rain },
  { name: 'nobody comes out when it clears', edits: [one(S, '        if (person.shelter) comeOut(person, household.homeSiteId);\n', '')], expect: T.rain },
  { name: 'a child\'s job goes on inside', edits: [one('sim/chores.mjs', '  if (heldIndoors(entity)) return;\n', '')], expect: T.rain },
  { name: 'the page is not told who is in', edits: [one(S, 'export const shelterShown = entity => (entity?.shelter ?', 'export const shelterShown = entity => (false ?')], expect: T.rain },
  { name: 'nobody sits with the children', edits: [one(S, '    if (!companion && children.length && !quiet) {', '    if (false) {')], expect: T.companion },
  { name: 'the feller is called in from the timber', edits: [one(S, "export const CANNOT_LEAVE = Object.freeze(['hunts', 'huntLand', 'forage', 'fells', ", "export const CANNOT_LEAVE = Object.freeze(['hunts', 'huntLand', 'forage', ")], expect: T.companion },
  { name: 'the companion\'s work goes on without them', edits: [one('sim/chores.mjs', '  // Called aside by the family\'s little ones (sim/aside.mjs): the work stands exactly where it is, step, wait and all.\n  if (calledAside(entity)) return;\n', '')], expect: T.companion },
  { name: 'the companion\'s row says nothing', edits: [one(S, "export const shelterLine = (world, entity) => (entity?.aside?.kind === 'shelter'", 'export const shelterLine = (world, entity) => (false')], expect: T.companion },
  { name: 'the companion is refused orders', edits: [one('sim/aside.mjs', "export const asideRefuses = entity => Boolean(entity?.aside) && entity.aside.kind !== 'shelter';", 'export const asideRefuses = entity => Boolean(entity?.aside);')], expect: T.order },
  { name: 'an order does not send the companion', edits: [one(S, '    if (companion && companion.chore && companion.chore.id !== companion.aside.held) {', '    if (false) {')], expect: T.order },
  { name: 'the one sent is called in again the same day', edits: [one(S, '    && person.shelterExcused !== dayOf(world));', ');')], expect: T.order },
  { name: 'a grown person called in before an older child', edits: [one(S, '  return nearest(working.filter(person => person.age < ADULT_AT)) || nearest(working);', '  return nearest(working);')], expect: T.prefer },
  { name: 'a worker called in before somebody free', edits: [one(S, '  if (inside || !callIn) return inside;', '  if (!callIn) return inside;')], expect: T.prefer },
  { name: 'the children alone, and nobody told', edits: [one(S, '        tell(world, household, children[0], `Nobody of ten or more is free to sit with', '        if (false) tell(world, household, children[0], `Nobody of ten or more is free to sit with')], expect: T.alone },
  { name: 'a family nobody plays is stopped for its children', edits: [one(S, '    const quiet = !household.played || household.absent || ', '    const quiet = household.absent || ')], expect: T.unplayed },
  { name: 'nobody puts the tent up by themself', edits: [one(S, '  if (housed(household) || household.tent || !travel) return;', '  return;')], expect: T.first },
  { name: 'never under the wagon', edits: [one(S, "  if (wagon) return { at: 'wagon', x: r4(wagon.location.x), y: r4(wagon.location.y) };", '')], expect: T.first },
  { name: 'the tent left standing under a roof', edits: [one(S, '    if (household.tent && housed(household)) delete household.tent;\n', '')], expect: T.tent },
  { name: 'the tent put up away from the camp', edits: [one(S, '  household.tent = { x: at.x, y: at.y, minute: world.minute };', '  household.tent = { x: at.x + 0.01, y: at.y, minute: world.minute };')], expect: T.tent },
  { name: 'never into the house', edits: [one(S, "  if (housed(household)) { const door = houseDoor(world, household); if (door) return { at: 'house', ...door }; }", '')], expect: T.house },
  { name: 'a shelter that cannot be is opened', edits: [one('sim/world.mjs', ' || milkingInvalid(world) || shelterInvalid(world);', ' || milkingInvalid(world);')], expect: T.house },
  { name: 'the house at its old pace', edits: [one('sim/work-pace.mjs', 'export const HOUSE_PACE = 0.5;', 'export const HOUSE_PACE = 1;')], expect: T.build },
  { name: 'felling at its old pace', edits: [one('sim/work-pace.mjs', 'export const FELL_PACE = 0.5;', 'export const FELL_PACE = 1;')], expect: T.fell },
  { name: 'fetching logs left at the old pace', edits: [one('sim/work-pace.mjs', 'const felling = chore => Boolean(chore?.fells || chore?.fetchesLogs);', 'const felling = chore => Boolean(chore?.fells);')], expect: T.paces },
  { name: 'the chooser says the old hours', edits: [one('sim/houses.mjs', 'hours: houseHours(choice.work * SPELL_TICKS) }));', 'hours: houseHours(choice.work * SPELL_TICKS) * 2 }));')], expect: T.words },
];

const failing = output => [...new Set([...output.matchAll(/^\s*✖ (.+?) \(\d/gm)].map(match => match[1].trim()).filter(name => !/^tests[\\/]/.test(name) && name !== 'failing tests:'))];
const run = () => {
  const result = spawnSync(process.execPath, ['--test', '--test-reporter=spec', ...FILES], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const out = `${result.stdout}${result.stderr}`;
  return { failed: failing(out), passed: [...out.matchAll(/^\s*✔ /gm)].length };
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
  const caught = result.failed.some(name => name.includes(injection.expect));
  const alone = caught && result.failed.every(name => name.includes(injection.expect));
  record.push({ name: injection.name, files: injection.edits.map(edit => edit.file), expected: injection.expect, caught, only: alone, failed: result.failed });
  console.log(`${caught ? 'CAUGHT' : 'MISSED'}${caught && !alone ? ' (with others)' : ''} ${injection.name}${caught && alone ? '' : ` (failed: ${result.failed.join('; ') || 'nothing'})`}`);
}
if (run().failed.length) throw new Error('The tests fail after every file was put back');
if (!only) {
  mkdirSync('docs/evidence', { recursive: true });
  writeFileSync('docs/evidence/shelter-injections.json', `${JSON.stringify({ record: 'shelter-injections', date: new Date().toISOString().slice(0, 10), caught: record.filter(one => one.caught).length, only: record.filter(one => one.only).length, of: record.length, injections: record }, null, 1)}\n`);
}
console.log(`\n${record.filter(one => one.caught).length} of ${record.length} caught by the test written for them (${record.filter(one => one.only).length} by that test alone).${only ? '' : ' Wrote docs/evidence/shelter-injections.json'}`);
