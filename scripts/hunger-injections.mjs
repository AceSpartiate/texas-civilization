// The regressions hunger and starvation guard (owner, 2026-09-30; sim/hunger.mjs, tests/hunger.test.mjs, docs/HUNGER.md),
// injected one at a time (CLAUDE.md: "A new test is not evidence until it has failed"). Each replaces exact pieces of files with
// the mistake a test is written against, runs tests/hunger.test.mjs, records which tests failed, checks the test written for it is
// among them, and puts every file back byte for byte.
//
// Run: node scripts/hunger-injections.mjs [--only=<name prefix>]  → writes docs/evidence/hunger-injections.json
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const FILES = ['tests/hunger.test.mjs'];
const T = {
  stages: 'the stages: a grown person', fed: 'the stages: eating one', home: 'at home: the routine', road: 'on the road east:', overtaken: 'overtaken: the column',
  who: 'who first: a baby', weights: 'who first: children fed first', minute: 'the minute: a starving person', shown: 'the minute: shown on the row',
  director: 'the director:', neighbours: 'the neighbours:', weak: 'weak: slower at work', child: 'a child who died of hunger', gauge: 'the gauge:',
  winter: 'the winter nobody plays', saves: 'saves:',
};
const one = (file, from, to) => ({ file, from, to });
const INJECTIONS = [
  { name: 'a death at starving, without the sustained stretch', edits: [one('sim/hunger.mjs', "person.hunger.want < DEATH_AT || starveHeld", 'starveHeld')], expect: T.stages },
  { name: 'weak two days later', edits: [one('sim/hunger.mjs', 'export const WEAK_AT = 5,', 'export const WEAK_AT = 7,')], expect: T.stages },
  { name: 'eating never wins the want back', edits: [one('sim/hunger.mjs', '    else want = Math.max(0, was - RECOVER_PER_DAY * days);', '    else want = was;')], expect: T.fed },
  { name: 'the eating at home counts no want', edits: [one('sim/routines.mjs', '    ate(world, household, present, eaten * days, household.resources.food + workers * WORK_FOOD_A_DAY * days, days);\n', '')], expect: T.home },
  // The owner's answer of 2026-09-30 to question 3, "Leave a few days' food" (sim/road.mjs `overtake`, `LEFT_FOOD_DAYS`).
  { name: 'the column takes every crumb again', edits: [one('sim/road.mjs', '  if (left > 0) household.resources.food = left;\n', '')], expect: T.overtaken },
  { name: 'the column leaves a week, not a few days', edits: [one('sim/road.mjs', 'export const LEFT_FOOD_DAYS = 3;', 'export const LEFT_FOOD_DAYS = 7;')], expect: T.overtaken },
  { name: 'the column leaves more food than the family had', edits: [one('sim/road.mjs', 'Math.min(hadFood, Math.ceil(', 'Math.max(hadFood, Math.ceil(')], expect: T.overtaken },
  { name: 'the prisoners counted among those left food', edits: [one('sim/road.mjs', 'Math.ceil(eatenADay(world, letGo) * LEFT_FOOD_DAYS', 'Math.ceil(eatenADay(world, with_) * LEFT_FOOD_DAYS')], expect: T.overtaken },
  { name: 'the food left is not told', edits: [one('sim/road.mjs', " They left the family ${round(left)} food, a few days' eating.", '')], expect: T.overtaken },
  { name: 'the eating on the road counts no want', edits: [one('sim/scrape.mjs', '      ate(world, household, alive, eatenADay(world, alive) * days, household.resources.food, days);\n', '')], expect: T.road },
  { name: 'everybody goes down alike', edits: [one('sim/hunger.mjs', 'let weight = age < 2 ? 2.5 : age < 6 ? 2 : age < 16 ? 1.25 : age >= 60 ? 1.5 : 1;', 'let weight = 1;')], expect: T.who },
  { name: 'children not fed first', edits: [one('sim/hunger.mjs', '  if (age < 16 && withGrown) weight *= CHILDREN_FIRST;\n', '')], expect: T.weights },
  { name: 'no minute: a starving person dies at once', edits: [one('sim/hunger.mjs', "person.hunger.want < DEATH_AT || starveHeld(world, person)) continue;", 'person.hunger.want < DEATH_AT) continue;')], expect: T.minute },
  { name: 'the minute never starts on the real clock', edits: [one('sim/decision-budget.mjs', "    if (starveOnLimit(world, entity)) open.push({ key: starveLimitKey(entity), kind: 'starve', personId: entity.id });\n", '')], expect: T.minute },
  { name: 'the row carries no time left', edits: [one('sim/hunger.mjs', "starveOnLimit(world, person) && !limitOut(world, starveLimitKey(person)) ? { leftMs:", "false ? { leftMs:")], expect: T.shown },
  { name: 'no "!" for somebody starving', edits: [one('public/family-panel.js', "  if (entity.hunger?.stage === 'starving') needs.push(", "  if (false) needs.push(")], expect: T.shown },
  { name: 'a family whose student has gone starves on', edits: [one('sim/hunger.mjs', 'if (short) { if (!household.absent) want =', 'if (short) { if (true) want =')], expect: T.director },
  { name: 'a family nobody plays counted hungry', edits: [one('sim/hunger.mjs', "  if (!(days > 0) || !household?.played) return;", "  if (!(days > 0)) return;")], expect: T.director },
  { name: 'the store left out of what the family had: the neighbours\' food saves nobody', edits: [one('sim/routines.mjs', 'eaten * days, household.resources.food + workers * WORK_FOOD_A_DAY * days, days);', 'eaten * days, workers * WORK_FOOD_A_DAY * days, days);')], expect: T.neighbours },
  { name: 'the weak sent to fight', edits: [one('sim/family.mjs', "canAnswerCalls(entity) && entity.sex !== 'female' && !weakWithHunger(entity);", "canAnswerCalls(entity) && entity.sex !== 'female';")], expect: T.weak },
  { name: 'the weak work at the ordinary pace', edits: [one('sim/hunger.mjs', 'export const hungerPace = person => WORK_SLOWER[person?.hunger?.stage] || 1;', 'export const hungerPace = person => 1;')], expect: T.weak },
  { name: 'each on the road east at their own pace', edits: [one('sim/hunger.mjs', "  if (['flee', 'return'].includes(purpose) && entity.householdId) {", "  if (false) {")], expect: T.weak },
  { name: 'a child who starved named on the class panel', edits: [one('sim/disease.mjs', 'Boolean(person.health.disease || person.health.starved) && ageOf(person) < 16', 'Boolean(person.health.disease) && ageOf(person) < 16')], expect: T.child },
  { name: 'a child who starved drawn on the Host\'s map', edits: [one('sim/overview.mjs', '&& !diedQuietly(entity)).map(entity => overviewEntity(world, entity)),', ').map(entity => overviewEntity(world, entity)),')], expect: T.child },
  { name: 'the flashback says a child who starved died of a sickness', edits: [one('sim/flashback.mjs', "died of ${fate.starved ? 'hunger' : DISEASE_WORDS[fate.disease] || 'a sickness'}", "died of ${DISEASE_WORDS[fate.disease] || 'a sickness'}")], expect: T.child },
  { name: 'the gauge not sent', edits: [one('sim/world.mjs', '    ...(household.played && larderShown(world, household)) };', '    };')], expect: T.gauge },
  { name: 'the gauge in the wrong colour for a few days left', edits: [one('public/family-panel.js', "return days < 3 ? 'short' : days < 7 ? 'low'", "return days < 1 ? 'short' : days < 7 ? 'low'")], expect: T.gauge },
  { name: 'the second period opens hungry', edits: [one('sim/periods.mjs', '  recoverOverWinter(world);\n', '')], expect: T.winter },
  { name: 'a hunger that cannot be is opened', edits: [one('sim/world.mjs', 'neighbourlyInvalid(world) || hungerInvalid(world);', 'neighbourlyInvalid(world);')], expect: T.saves },
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
  writeFileSync('docs/evidence/hunger-injections.json', `${JSON.stringify({ record: 'hunger-injections', date: new Date().toISOString().slice(0, 10), caught: record.filter(one => one.caught).length, only: record.filter(one => one.only).length, of: record.length, injections: record }, null, 1)}\n`);
}
console.log(`\n${record.filter(one => one.caught).length} of ${record.length} caught by the test written for them (${record.filter(one => one.only).length} by that test alone).${only ? '' : ' Wrote docs/evidence/hunger-injections.json'}`);
