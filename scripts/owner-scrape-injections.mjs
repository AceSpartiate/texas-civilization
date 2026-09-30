// The regressions the owner's answers of 2026-09-29 to the triage's D9 guard (docs/audits/2026-09-29-triage.md D9; docs/SCRAPE.md
// §18-§20; tests/owner-scrape.test.mjs), injected one at a time (CLAUDE.md: "A new test is not evidence until it has failed"). Each
// replaces exact pieces of files with the mistake a test is written against, runs the tests, records which failed, checks the test
// written for it is among them, and puts every file back byte for byte.
//
// Run: npm run test:owner-scrape-injections  → writes docs/evidence/owner-scrape-injections.json
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const OWN = { files: ['tests/owner-scrape.test.mjs'] };
const T = {
  card: 'D9 (a): the card offers', carried: 'D9 (a): what is carried stays', mud: 'D9 (a): left with the wagon in the mud',
  refused: 'D9 (b): before its order', early: 'D9 (b): on real news', advance: 'D9 (b): the news of the Mexican army',
  stayer: 'D9 (c): foragers who reach a farm', unseen: 'D9 (c): a stayer with nobody at home',
};
const one = (file, from, to) => ({ file, from, to });
const INJECTIONS = [
  // (a) the household goods in the load
  { name: '(a) the card offers only the four stores', edits: [one('sim/scrape.mjs', "    space: { ...FLIGHT_SPACE, ...Object.fromEntries(Object.keys(goods).map(good => [good, HOUSEHOLD_SPACE[good]])) },", '    space: { ...FLIGHT_SPACE },')], expect: T.card },
  { name: '(a) the packing never takes a tool, the chest or the wheel', edits: [one('sim/scrape.mjs', "  const goods = ['food', 'seed', 'cotton', 'powder', ...HOUSEHOLD_GOODS.filter(good => good in (shown.space || {}))];", "  const goods = ['food', 'seed', 'cotton', 'powder'];")], expect: T.card },
  { name: '(a) what is not loaded stays in the family\'s hands', edits: [one('sim/scrape.mjs', '    if (left > 0) { removeGood(household, good, left); goodsLeft[good] = left; }', '    if (left > 0) { goodsLeft[good] = left; }')], expect: T.carried },
  { name: '(a) home to a standing house, the goods left in it are not found', edits: [one('sim/scrape.mjs', '        for (const [good, amount] of found) { if (isHouseholdGood(good)) restoreGood(household, good, amount); else household.resources[good] = (household.resources[good] ?? 0) + amount; }', '        for (const [good, amount] of found) { if (!isHouseholdGood(good)) household.resources[good] = (household.resources[good] ?? 0) + amount; }')], expect: T.carried },
  { name: '(a) the homecoming never says what was carried home', edits: [one('sim/scrape.mjs', "      if (Object.keys(broughtHome).length) tell(world, household, `They brought home", "      if (false) tell(world, household, `They brought home")], expect: T.carried },
  { name: '(a) the stayer\'s rule stripping a family that had gone', edits: [one('sim/scrape.mjs', "  const stayed = !['fled', 'refuged', 'returning', 'home'].includes(flight.status);", '  const stayed = true;')], expect: T.carried },
  { name: '(a) the wagon left in the mud with every household good still carried', edits: [one('sim/road.mjs', '    if (have > fits) { removeGood(household, good, have - fits); lost.push(goodWords(good, have - fits)); }', '')], expect: T.mud },
  { name: '(a) a column that comes up with the family leaves it its goods', edits: [one('sim/road.mjs', '  for (const [good, amount] of Object.entries(householdGoods(household))) { removeGood(household, good, amount); taken.push(goodWords(good, amount)); }', '')], expect: T.mud },
  { name: '(a) only powder, seed and cotton are hidden', edits: [one('sim/flight-work.mjs', "export const HIDDEN_GOODS = Object.freeze(['powder', 'seed', 'hoe', 'axe', 'broadaxe', 'froe', 'auger', 'chest', 'spinning-wheel', 'cotton']);", "export const HIDDEN_GOODS = Object.freeze(['powder', 'seed', 'cotton']);"), one('sim/flight-work.mjs', "if (flight.cache !== undefined && (!flight.cache || Object.entries(flight.cache).some(([good, amount]) => !HIDDEN_GOODS.includes(good)", "if (flight.cache !== undefined && (!flight.cache || Object.entries(flight.cache).some(([good, amount]) => false")], expect: T.mud },
  { name: '(a) what was hidden is dug up as stores', edits: [one('sim/flight-work.mjs', '  for (const [good, amount] of found) { if (isHouseholdGood(good)) restoreGood(household, good, amount); else household.resources[good] = (household.resources[good] ?? 0) + amount; }', '  for (const [good, amount] of found) household.resources[good] = (household.resources[good] ?? 0) + amount;')], expect: T.mud },
  // (b) leaving before the order
  { name: '(b) the early word read from the world\'s truth, not the family\'s hearing', edits: [one('sim/early-word.mjs', '  const known = Object.values(world.knowledge?.households?.[household.id] || {}).filter(', '  const known = Object.values(world.truth || {}).map(truth => ({ topicId: truth.id, status: \'confirmed\', receivedMinute: truth.minute, text: truth.text })).filter(')], expect: T.refused },
  { name: '(b) a rumour is enough', edits: [one('sim/early-word.mjs', "export const FIRM = Object.freeze(['unconfirmed', 'confirmed']);", "export const FIRM = Object.freeze(['rumor', 'unconfirmed', 'confirmed']);")], expect: T.refused },
  { name: '(b) nobody may leave before the order, as before', edits: [one('sim/scrape.mjs', '  if (!flight && !earlyWord(world, household)) return NO_WORD_YET;', "  if (!flight) return 'Nobody has told the family to leave.';")], expect: T.early },
  { name: '(b) a route of its own refused to a family with no order', edits: [one('sim/flight-route.mjs', "  if (!flight ? !earlyWord(world, household) : !['fled', 'refuged', 'ordered', 'stayed'].includes(flight.status)) return 'The family is not on the road east.';", "  if (!flight || !['fled', 'refuged', 'ordered', 'stayed'].includes(flight.status)) return 'The family is not on the road east.';")], expect: T.early },
  { name: '(b) the preparation works still wait for the order', edits: [one('sim/early-word.mjs', "export const mayMakeReady = (world, household) => ['ordered', 'stayed'].includes(household?.flight?.status) || Boolean(earlyWord(world, household));", "export const mayMakeReady = (world, household) => ['ordered', 'stayed'].includes(household?.flight?.status);")], expect: T.early },
  { name: '(b) leaving early costs no crop', edits: [one('sim/scrape.mjs', "  if (!['planted', 'ripe'].includes(field?.state)) return null;", '  return null;')], expect: T.early },
  { name: '(b) what was made ready is dropped at the order', edits: [one('sim/scrape.mjs', "  household.flight = { status: 'ordered', orderedMinute: world.minute, ...takeReadying(household) };", "  delete household.readying;\n  household.flight = { status: 'ordered', orderedMinute: world.minute };")], expect: T.early },
  { name: '(b) the family told it may go every tick', edits: [one('sim/early-word.mjs', '    if (household.flight || household.readying?.heard) continue;', '    if (household.flight) continue;')], expect: T.early },
  { name: '(b) the empty house of a family gone early is never reached', edits: [one('sim/advance.mjs', '  if (!Number.isFinite(household.flight.orderedMinute)) return Number.isFinite(household.flight.early?.minute) ? Math.max(fate.minute + clockOf(world), household.flight.early.minute) : null;', '  if (!Number.isFinite(household.flight.orderedMinute)) return null;')], expect: T.early },
  { name: '(b) the Texas army\'s own movements counted as the advance', edits: [one('sim/early-word.mjs', "export const EARLY_TOPICS = Object.freeze(['alamo-fall', 'goliad-defeat', 'santa-anna-brazos']);", "export const EARLY_TOPICS = Object.freeze(['alamo-fall', 'goliad-defeat', 'santa-anna-brazos', 'houston-colorado']);")], expect: T.advance },
  { name: '(b) word of a column not counted', edits: [one('sim/early-word.mjs', "export const EARLY_PREFIXES = Object.freeze(['column:', 'burned:']);", "export const EARLY_PREFIXES = Object.freeze(['burned:']);")], expect: T.advance },
  // (c) staying
  { name: '(c) foragers leave a stayer\'s goods alone, as before', edits: [one('sim/scrape.mjs', '  const taken = stayed ? takeStayersGoods(household) : {};', '  const taken = {};')], expect: T.stayer },
  { name: '(c) the foragers take the coin too', edits: [one('sim/scrape.mjs', '  for (const [good, amount] of Object.entries(householdGoods(household))) { removeGood(household, good, amount); taken[good] = amount; }\n  return taken;', '  for (const [good, amount] of Object.entries(householdGoods(household))) { removeGood(household, good, amount); taken[good] = amount; }\n  if (household.resources) household.resources.money = 0;\n  return taken;')], expect: T.stayer },
  { name: '(c) the family is not told what was taken', edits: [one('sim/advance-word.mjs', "  const took = by.taken?.length ? ` Before they burned it they took everything in the house: ${by.taken.join(', ')}.` : '';", "  const took = '';")], expect: T.stayer },
  { name: '(c) the page shows the goods gone before the family knows', edits: [one('sim/scrape.mjs', '...(Object.keys(taken).length && { taken }) });', '});')], expect: T.unseen },
];

const failing = output => [...new Set([...output.matchAll(/^\s*✖ (.+?) \(\d/gm)].map(match => match[1].trim()).filter(name => !/^tests[\\/]/.test(name) && name !== 'failing tests:'))];
const run = ({ files, pattern }) => {
  const result = spawnSync(process.execPath, ['--test', ...(pattern ? ['--test-name-pattern', pattern] : []), ...files], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
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
const clean = run(OWN);
if (clean.failed.length || !clean.passed) throw new Error(`The tests fail before anything is injected: ${clean.failed.join('; ') || 'nothing ran'}`);
const record = [];
for (const injection of chosen) {
  const originals = new Map(injection.edits.map(edit => [edit.file, readFileSync(edit.file, 'utf8')]));
  let result;
  try {
    for (const edit of injection.edits) {
      const original = readFileSync(edit.file, 'utf8'), crlf = original.includes('\r\n');
      const text = original.replace(/\r\n/g, '\n').replace(edit.from, () => edit.to);
      writeFileSync(edit.file, crlf ? text.replace(/\n/g, '\r\n') : text);
    }
    result = run(OWN);
  } finally { for (const [file, text] of originals) writeFileSync(file, text); }
  const caught = result.failed.some(name => name.includes(injection.expect));
  const alone = caught && result.failed.every(name => name.includes(injection.expect));
  record.push({ name: injection.name, files: injection.edits.map(edit => edit.file), expected: injection.expect, caught, only: alone, failed: result.failed });
  console.log(`${caught ? 'CAUGHT' : 'MISSED'}${caught && !alone ? ' (with others)' : ''} ${injection.name}${caught && alone ? '' : ` (failed: ${result.failed.join('; ') || 'nothing'})`}`);
}
if (run(OWN).failed.length) throw new Error('The tests fail after every file was put back');
if (!only) {
  mkdirSync('docs/evidence', { recursive: true });
  writeFileSync('docs/evidence/owner-scrape-injections.json', `${JSON.stringify({ record: 'owner-scrape-injections', date: new Date().toISOString().slice(0, 10), caught: record.filter(one => one.caught).length, only: record.filter(one => one.only).length, of: record.length, injections: record }, null, 2)}\n`);
}
console.log(`\n${record.filter(one => one.caught).length} of ${record.length} caught by the test written for them (${record.filter(one => one.only).length} by that test alone).${only ? '' : ' Wrote docs/evidence/owner-scrape-injections.json'}`);
