// The regressions men's work, women's work and the wash guard (owner, 2026-10-03, "Custom, necessity opens"; amended 2026-10-04; tests/custom-work.test.mjs,
// tests/housework.test.mjs, tests/family-effects.test.mjs; sim/custom.mjs, sim/housework.mjs), injected one at a time (CLAUDE.md: "A new
// test is not evidence until it has failed"). Each replaces exact pieces of files with the mistake a test is written against, runs the
// three test files, records which tests failed, checks the test written for it is among them, and puts every file back byte for byte.
//
// Run: node scripts/custom-work-injections.mjs [--only=<name prefix>]  → writes docs/evidence/custom-work-injections.json
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const FILES = ['tests/custom-work.test.mjs', 'tests/housework.test.mjs', 'tests/family-effects.test.mjs'];
const T = {
  rule: "the rule: men's work is refused", bar: "another's work is not on the bar", opens: 'it opens when every man is away', boy: 'a boy under sixteen',
  line: 'the journal says it once', lone: 'a lone mother may do every work', steps: "the guided start's every step",
  play: "the guided start's work, played through", auto: 'auto keeps the custom', home: 'a man coming home in the middle',
  cattle: "cattle on the range are the men's", director: 'the families nobody plays keep the custom',
  kept: 'keeping house: the hidden saving', effects: 'the house kept makes the food last longer', garden: 'the kitchen garden',
  wash: 'the wash: everybody at home', town: 'dirty in town', war: 'dirty at the war', prices: 'the shops ask a quarter more',
  old: 'a class saved before the wash',
};
const one = (file, from, to) => ({ file, from, to });
const C = 'sim/chores.mjs', K = 'sim/custom.mjs', H = 'sim/housework.mjs', A = 'sim/auto.mjs', E = 'sim/errands.mjs', P = 'public/family-panel.js', W = 'sim/world.mjs';
const INJECTIONS = [
  // The rule.
  { name: 'no custom at all', edits: [one(C, '{ const why = customRefused(world, household, entity, choreId); if (why) return', '{ const why = null; if (why) return')], expect: T.rule },
  { name: 'the mirror lost: a man may do the women\'s work with a woman at home', edits: [one(K, "  const sex = SEX_OF[whose];\n  if (sexOf(entity) === sex) return null;\n  const home =", "  const sex = 'male';\n  if (sexOf(entity) === sex) return null;\n  const home =")], expect: T.rule },
  { name: 'the refusal not marked, so left on her list', edits: [one(C, 'return { can: false, why, custom: CUSTOM[choreId]?.[0] || CATTLE[0] }', 'return { can: false, why }')], expect: T.rule },
  { name: 'the custom-refused work sent greyed again', edits: [one(C, '        ? null\n', '        ? { id, can: false, why }\n')], expect: T.bar },
  // When it opens.
  { name: 'a sick man still keeps it', edits: [one(K, "const able = entity => !['dead', 'captured', 'sick', 'wounded'].includes(", "const able = entity => !['dead', 'captured'].includes(")], expect: T.opens },
  { name: 'a man at the war still keeps it', edits: [one(K, '  if (entity.service) return false;\n', '')], expect: T.opens },
  { name: 'a man in town still keeps it', edits: [one(K, '  return !entity.travel && entity.location?.siteId === household.homeSiteId;\n}', '  return true;\n}')], expect: T.opens },
  { name: 'a man out in the timber counted away', edits: [one(K, '  if (entity.chore && homeWork?.(entity.chore.id)) return true;\n', '')], expect: T.opens },
  { name: 'a man visiting or helping still keeps it', edits: [one(K, "  if (entity.visiting || entity.task === 'help') return false;\n", '')], expect: T.opens },
  { name: 'a boy of ten keeps it', edits: [one(K, '  if (Number.isFinite(entity?.age)) return entity.age >= FIGHTS_FROM_AGE;', '  if (Number.isFinite(entity?.age)) return entity.age >= 10;')], expect: T.boy },
  { name: 'refused even with nobody at home', edits: [one(K, '  if (!home.length) return null;', "  if (!home.length) return 'Nobody may.';")], expect: T.lone },
  // The line.
  { name: 'the line said every time', edits: [one(K, '  if (entity.necessity[whose] === key) return null;\n', '')], expect: T.line },
  { name: 'the line never said', edits: [one(K, "  record(world, 'consequence', { actorId: entity.id, householdId: household.id, importance: 2, classification: 'FICTIONAL FOR GAMEPLAY', claimId: CLAIMS.opened, text });\n", '')], expect: T.line },
  { name: 'the war said as away', edits: [one(K, "  if (person.service) return ['army', 'gone to the army'];", "  if (person.service) return ['away', 'away'];")], expect: T.line },
  { name: 'no man at all said wrong', edits: [one(K, "`With no ${sex === 'male' ? 'grown man' : 'grown woman'} in the family`", "`With the men away`")], expect: T.lone },
  // Auto, the job in hand, the cattle.
  { name: 'auto never keeps house meanwhile', edits: [one(A, '        if (houseworkMeanwhile(world, household, person, { beginTravel, modeAvailability })) { order.held = why; continue; }\n', '')], expect: T.auto },
  { name: 'a man home stops her work in hand', edits: [one(C, "  if (heldIndoors(entity)) return;\n  const state = entity.chore;\n", "  if (heldIndoors(entity)) return;\n  if (customRefused(world, household, entity, entity.chore.id)) return abandonChore(world, household, entity, chore);\n  const state = entity.chore;\n")], expect: T.home },
  { name: 'a woman works the cattle with a man at home', edits: [one(C, 'export const herdWorkHere = (world, household, entity) => (herdWork(entity) === \'all\' && customWhy(world, household, entity, CATTLE, homeWork) ? \'hogs\' : herdWork(entity));', 'export const herdWorkHere = (world, household, entity) => herdWork(entity);')], expect: T.cattle },
  { name: 'the hogs only not kept as she sets out', edits: [one(C, " if (herdWorkHere(world, household, entity) === 'hogs' && herdWork(entity) === 'all') entity.chore.hogsOnly = true;", '')], expect: T.cattle },
  { name: 'the range refused her with hogs to mind', edits: [one(C, "    if (herdWork(entity) !== 'all' || herdOf(household).cattle < 1 || herdOf(household).hogs > 0) return null;", "    if (herdWork(entity) !== 'all' || herdOf(household).cattle < 1) return null;")], expect: T.cattle },
  // Keeping house.
  { name: 'the saving from the best at home, kept or not', edits: [one(H, 'export const houseSaving = (world, household) => housekeepingSaving(keptBy(world, household));', 'export const houseSaving = (world, household) => housekeepingSaving(household.members.map(id => world.entities[id]));')], expect: T.kept },
  { name: 'a house kept once keeps for ever', edits: [one(H, ' || dayOf(world) - kept.day >= KEPT_DAYS) return [];', ') return [];')], expect: T.kept },
  { name: 'the house kept twice a day', edits: [one(H, '      if (keptToday(world, household)) return', '      if (false) return')], expect: T.kept },
  { name: 'the routine eats without the house kept', edits: [one('sim/routines.mjs', '(1 - houseSaving(world, household))', '(1 - 0)')], expect: T.effects },
  // The garden.
  { name: 'the garden gives nothing', edits: [one(H, '  household.resources.food = round((household.resources.food ?? 0) + amount);\n', '')], expect: T.garden },
  { name: 'the garden gives the day it is dug', edits: [one(H, '    household.garden = { ...at, laid: day, worked: day };', '    household.garden = { ...at, laid: day - 1, worked: day - 1 }; return workGarden(world, household, entity);')], expect: T.garden },
  { name: 'the garden worked twice a day', edits: [one(H, '      if (gardenedToday(world, household)) return', '      if (false) return')], expect: T.garden },
  { name: 'the garden not sent to the page', edits: [one(H, "  if (!garden || !Number.isFinite(garden.x)) return {};", '  return {};')], expect: T.garden },
  // The wash.
  { name: 'the wash cleans the man away too', edits: [one(H, "  const here = household.members.map(id => world.entities[id]).filter(person => person && person.health?.condition !== 'dead'\n", "  const here = household.members.map(id => world.entities[id]).filter(person => person || person.health?.condition !== 'dead'\n")], expect: T.wash },
  { name: 'clean for eighty days', edits: [one(H, 'export const CLEAN_DAYS = 7;', 'export const CLEAN_DAYS = 80;')], expect: T.wash },
  { name: 'clean a day past the week', edits: [one(H, 'export const CLEAN_DAYS = 7;', 'export const CLEAN_DAYS = 8;')], expect: T.wash },
  { name: 'the wash done every day', edits: [one(H, 'export const WASH_AGAIN_DAYS = 7;', 'export const WASH_AGAIN_DAYS = 0;')], expect: T.wash },
  { name: 'the wash a day before the week is out', edits: [one(H, 'export const WASH_AGAIN_DAYS = 7;', 'export const WASH_AGAIN_DAYS = 6;')], expect: T.wash },
  { name: 'no flies sent to the page', edits: [one(H, 'export const washShown = (world, person) => (dirty(world, person) ? { dirty: true } : {});', 'export const washShown = () => ({});')], expect: T.wash },
  // What is said.
  { name: 'told again every tick in one town', edits: [one(H, '      if (last?.at === siteId) continue;\n      const recent = Number.isInteger(last?.day) && day - last.day < REMARK_DAYS;', '      const recent = false;')], expect: T.town },
  { name: 'a clean customer told she smells', edits: [one(H, '      const speaker = recent || !dirty(world, person) ? null :', '      const speaker = recent ? null :')], expect: T.town },
  { name: 'the words never over the speaker', edits: [one(H, '    if (!remark?.said || !remark.by || world.tick - remark.tick >= REMARK_TICKS) continue;', '    continue;')], expect: T.town },
  { name: 'the words over the speaker for ever', edits: [one(H, '    if (!remark?.said || !remark.by || world.tick - remark.tick >= REMARK_TICKS) continue;', '    if (!remark?.said || !remark.by) continue;'), one(H, '      if (last?.said && world.tick - last.tick >= REMARK_TICKS) { delete last.said; delete last.by; }\n', '')], expect: T.town },
  { name: 'the page not sent the words', edits: [one(W, ', ...remarkLines(world, household)];', '];')], expect: T.town },
  { name: 'the volunteers speak as townsmen', edits: [one(H, "  if (person.service || speaker?.service) return 'army';\n", '')], expect: T.war },
  // The prices.
  { name: 'never dearer', edits: [one(H, "  return pay === 'coin' ? Math.ceil(amount * DEARER - 1e-9) : Math.ceil(amount * DEARER * 4 - 1e-9) / 4;", '  return amount;')], expect: T.prices },
  { name: 'never paid less', edits: [one(H, "  return pay === 'coin' ? Math.round(amount * CHEAPER) : Math.round(amount * CHEAPER * 4) / 4;", '  return amount;')], expect: T.prices },
  { name: 'the reason not on the popup', edits: [one(E, '  return { town: { id: siteId, name: site?.name || \'town\' }, lines, ...(dearer && { dearer }),', '  return { town: { id: siteId, name: site?.name || \'town\' }, lines,')], expect: T.prices },
  { name: 'quoted dearer, charged the plain price', edits: [one(E, "        const asked = askedOf(world, entity, line.pay === 'coin' ? offer.coin : offer.food, line.pay);", "        const asked = line.pay === 'coin' ? offer.coin : offer.food;")], expect: T.prices },
  // Old saves.
  { name: 'an old class opens dirty', edits: [one(H, "Number.isInteger(world.washBase) ? world.washBase : dayOf(world));", 'Number.isInteger(world.washBase) ? world.washBase : 0);'), one(H, '  if (!Number.isInteger(world.washBase)) world.washBase = dayOf(world);', '  if (!Number.isInteger(world.washBase)) world.washBase = 0;')], expect: T.old },
  { name: 'a wash day that cannot be is opened', edits: [one(H, "    if (person.washed !== undefined && !Number.isInteger(person.washed)) return 'Invalid wash day';\n", '')], expect: T.old },
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
  writeFileSync('docs/evidence/custom-work-injections.json', `${JSON.stringify({ record: 'custom-work-injections', date: new Date().toISOString().slice(0, 10), caught: record.filter(one => one.caught).length, only: record.filter(one => one.only).length, of: record.length, injections: record }, null, 1)}\n`);
}
console.log(`\n${record.filter(one => one.caught).length} of ${record.length} caught by the test written for them (${record.filter(one => one.only).length} by that test alone).${only ? '' : ' Wrote docs/evidence/custom-work-injections.json'}`);
