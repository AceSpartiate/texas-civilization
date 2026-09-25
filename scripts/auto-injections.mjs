// Injections for auto repeating one task (owner, 2026-09-25: "if it's on, the character should perform that task on repeat, and
// if it can't, then it should work around the house until that task becomes available again"; sim/auto.mjs,
// docs/FAMILY_PANEL.md §16). CLAUDE.md: "a new test is not evidence until it has failed". Each injection puts back one exact
// mistake, the test files the change touches are run, the failing tests are recorded against the test the injection was
// written for, and every file is restored.
// Run: node scripts/auto-injections.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const FILES = ['tests/auto-repeat.test.mjs', 'tests/auto.test.mjs', 'tests/going.test.mjs', 'tests/family-panel.test.mjs', 'tests/lesson.test.mjs', 'tests/errands.test.mjs', 'tests/chores.test.mjs', 'tests/save-cadence.test.mjs'];
const T = {
  season: 'planting and the harvest on auto, two people, across a season: the field is planted, grows, is brought in and planted again, and nobody is stuck',
  hoe: 'a worn hoe: auto mends it about the house, and goes back to the field',
  exits: 'the exits: off, called away, dead, and the family on the road east',
  lesson: 'the guided start holds the gate for auto: a task the step does not allow is not taken up, nor taken as a task to wait for',
  once: 'what repeats: the owner\'s field and hunts, the gathering and the house; never the errand, the herd or the war',
  page: 'the page says what the server says: the switch\'s words, the row\'s line, and refused work that can be waited for',
  old: 'a class saved before opens as it was: a person on auto with a remembered hunt keeps it as their one task',
  hunt: 'on auto a hunt never stops to ask: the shot is decided at once, the hunt repeated when they come home, and stopped by the switch',
};
const one = (file, from, to) => ({ file, from, to });
const AUTO = 'sim/auto.mjs', PAGE = 'public/family-panel.js', WORLD = 'sim/world.mjs';
const INJECTIONS = [
  { name: 'the task forgotten once it is taken up again: it is done twice and never after', expect: T.season, edits: [one(AUTO, '        delete order.held;\n      } catch (error) { hold(error.message); }', '        delete person.order;\n      } catch (error) { hold(error.message); }')] },
  { name: 'waiting, they stand about instead of working about the place', expect: T.season, edits: [one(AUTO, "        if (person.task !== 'work') person.task = 'work';\n        if (order.held === why) return;", '        if (order.held === why) return;')] },
  { name: 'a task that could not be done is never asked again', expect: T.season, edits: [one(AUTO, '      const why = heldWhy(world, household, person, order);\n      if (why) {', '      if (order.held) continue;\n      const why = heldWhy(world, household, person, order);\n      if (why) {')] },
  { name: 'refused work is refused on auto too: nobody can be put on the harvest before it is ripe', expect: T.season, edits: [one(WORLD, 'catch (error) { if (waitForTask(world, household, entity, input.chore, mode, error)) return; throw error; }', 'catch (error) { throw error; }')] },
  { name: 'no turns with the rifle: the hunter home takes it straight back', expect: T.hunt, edits: [one(AUTO, 'for (const id of [...household.members].sort((a, b) => waiting(a) - waiting(b))) {', 'for (const id of household.members) {')] },
  { name: 'off, the task is still taken up', expect: T.exits, edits: [one(AUTO, '      const person = world.entities[id];\n      if (!person?.auto) continue;', '      const person = world.entities[id];\n      if (!person?.auto && !person?.order) continue;')] },
  { name: 'away from home, auto still gives them work at home', expect: T.exits, edits: [one(AUTO, "  && person.location?.siteId === household.homeSiteId && !(household.flight", '  && !(household.flight')] },
  { name: 'the family fled, auto still sets them to the field', expect: T.exits, edits: [one(AUTO, "  && person.location?.siteId === household.homeSiteId && !(household.flight && household.flight.status !== 'home');", '  && person.location?.siteId === household.homeSiteId;')] },
  { name: 'the dead stay on auto', expect: T.exits, edits: [one(AUTO, "      if (GONE.includes(person.health?.condition)) { delete person.auto; delete person.order; continue; }\n", "      if (GONE.includes(person.health?.condition)) continue;\n")] },
  { name: 'auto walks round the guided start', expect: T.lesson, edits: [one(AUTO, '  if (notYet) return notYet;\n', '')] },
  { name: 'a worn hoe is left worn: they only work about the place', expect: T.hoe, edits: [one(AUTO, "const hoe = CHORES[order.chore]?.tool === 'hoe' && allWorn(household, 'hoe');", 'const hoe = false;')] },
  { name: 'work done once replaces the task', expect: T.once, edits: [one(AUTO, "export function noteOrder(entity, choreId, mode, extra = {}, household = null) {\n  if (!REPEATED.includes(choreId)) return;", "export function noteOrder(entity, choreId, mode, extra = {}, household = null) {\n  if (!REPEATED.includes(choreId) && choreId !== 'mend-hoe') return;"), one(AUTO, "  'build-house', 'cut-lane', 'dig-well', 'haul-logs',\n]);", "  'build-house', 'cut-lane', 'dig-well', 'haul-logs', 'mend-hoe',\n]);")] },
  { name: "the director's orders become the student's task", expect: T.once, edits: [one(AUTO, '  if (household?.absent) return;\n', '')] },
  { name: 'the page writes its own line for auto', expect: T.page, edits: [one(PAGE, "  return entity?.auto ? entity.autoTask?.says || '' : '';", "  return entity?.auto ? 'Auto: on.' : '';")] },
  { name: 'the page ignores the work that can be waited for', expect: T.page, edits: [one(PAGE, 'const waits = Boolean(entry.waits && !entry.can && active !== entry.id);', 'const waits = false;')] },
  { name: 'the server offers no work to wait for', expect: T.page, edits: [one(AUTO, "  if (!person?.auto || GONE.includes(person.health?.condition)) return entries;\n  return entries.map(", "  return entries;\n  return entries.map(")] },
  { name: 'the reason for waiting not said on the row', expect: T.page, edits: [one(AUTO, "  if (order.held) return shown(`Auto: ${task}. ${order.held} Working about the place meanwhile.`, true);", '  if (order.held) return shown(`Auto: ${task}.`, true);')] },
  { name: "an old save's reason for waiting refused", expect: T.old, edits: [one(WORLD, "if (entity.order?.held !== undefined && typeof entity.order.held !== 'string')", 'if (entity.order?.held !== undefined)')] },
];

function failing() {
  try { execFileSync(process.execPath, ['--test', ...FILES], { encoding: 'utf8', stdio: 'pipe' }); return []; }
  catch (error) { return [...new Set(String(error.stdout).split('\n').filter(line => /^✖ /.test(line) && !/failing tests/.test(line)).map(line => line.replace(/^✖ /, '').replace(/ \(\d+(\.\d+)?ms\)$/, '')))]; }
}
const baseline = failing();
if (baseline.length) throw new Error(`the suite fails before anything is injected: ${baseline.join(' | ')}`);
const results = [];
for (const injection of INJECTIONS) {
  const originals = new Map();
  for (const { file } of injection.edits) if (!originals.has(file)) originals.set(file, readFileSync(file, 'utf8'));
  const changed = new Map(originals);
  for (const { file, from, to } of injection.edits) {
    // The working copy may be CRLF: the patterns are matched in its own line endings, and each must be there exactly once.
    const text = changed.get(file), crlf = text.includes('\r\n');
    const wanted = crlf ? from.replace(/\n/g, '\r\n') : from, put = crlf ? to.replace(/\n/g, '\r\n') : to;
    if (text.split(wanted).length !== 2) throw new Error(`${injection.name}: the text to replace is not in ${file} exactly once`);
    changed.set(file, text.replace(wanted, () => put));
  }
  let failed;
  try { for (const [file, text] of changed) writeFileSync(file, text); failed = failing(); } finally { for (const [file, text] of originals) writeFileSync(file, text); }
  const caught = failed.includes(injection.expect);
  results.push({ name: injection.name, expect: injection.expect, edits: injection.edits, caught, onlyThat: caught && failed.length === 1, failed });
  console.log(caught ? (failed.length === 1 ? 'CAUGHT' : 'CAUGHT+') : 'MISSED', injection.name, '->', failed.join(' | '));
}
mkdirSync('docs/evidence', { recursive: true });
writeFileSync('docs/evidence/auto-injections.json', JSON.stringify({ record: 'auto-injections', date: new Date().toISOString().slice(0, 10), files: FILES,
  caught: results.filter(r => r.caught).length, onlyThat: results.filter(r => r.onlyThat).length, of: results.length, results }, null, 2) + '\n');
console.log(`${results.filter(r => r.caught).length} of ${results.length} caught by the test written for them (${results.filter(r => r.onlyThat).length} by that test alone); wrote docs/evidence/auto-injections.json`);
