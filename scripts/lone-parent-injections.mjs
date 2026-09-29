// The regressions the lone parent's path (owner, 2026-09-29; sim/courtship.mjs) is guarded against, injected one at a time
// (CLAUDE.md: "A new test is not evidence until it has failed"). Each injection replaces exact text with the mistake a test is
// written against, runs tests/courtship.test.mjs (or, marked `browser`, `npm run test:lone-parent`), records which tests failed -
// the one written for it is named in `expect` and must be among them - and puts every file back byte for byte.
//
// Run: node scripts/lone-parent-injections.mjs            → docs/evidence/lone-parent-injections.json
// and: node scripts/lone-parent-injections.mjs --browser  → docs/evidence/lone-parent-injections-browser.json
// The browser injections need PLAYWRIGHT_MODULE and BROWSER_EXECUTABLE as every browser proof does.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const FILES = ['tests/courtship.test.mjs'];
const withBrowser = process.argv.includes('--browser');
const T = {
  offered: 'the ability is offered to a student\'s family rolled with one parent, once it is on its land, and to nobody else',
  road: 'not on the road in, not in the lobby, and on the real land not before the house site is chosen',
  away: 'pressed, the family is away for the day: its people refused work and roads, and seen by nobody',
  home: 'home again, the family has two parents: the new one rolled like a parent, the lone parent\'s own age, with a stable id',
  father: 'a lone father meets a daughter his own age',
  name: 'a lone mother\'s family takes the new husband\'s name, and keeps the name it had in the book; every id stays',
  leads: 'a new husband leads the family: its principal and main person, whom the calls and the family\'s decisions go to',
  father2: 'a lone father who marries keeps his name and stays the principal',
  house: 'a basic house is raised and lived in: built, the family under its roof, and the house work sees it as built',
  begun: 'a house the family had begun is finished for it, not thrown away for another',
  own: 'the family that raised its own house is not offered the path',
  nobody: 'nobody else is sent any of it: not another family, not the Host; the neighbours are no households and hide nothing',
  scenes: 'the scenes: four, in order, gentle, with the wedding by bond and its one line of history, until the student has walked them',
  flashback: 'the family\'s flashback remembers the wedding, and does not put the new parent on the road in',
  save: 'a class saved with the family away opens away, and comes home; a save from before opens as it was',
  page: 'the page: everybody in a scene stands on it, the couple face each other close enough to hold hands, and a missing pose falls back',
};
const C = 'sim/courtship.mjs';

const INJECTIONS = [
  // ------------------------------------------------------------------------------------------------ who is offered it
  { name: 'a family with two parents is offered the path', expect: T.offered, edits: [
    { file: C, from: '  if (rolledParents(household) !== 1 || household.courtship) return null;', to: '  if (household.courtship) return null;' },
    { file: C, from: '  if (parents.length !== 1 || parents[0].kin.spouse) return null;', to: '  if (!parents.length) return null;' }] },
  { name: 'the computer takes the path for a family whose student has gone', expect: T.offered, edits: [
    { file: C, from: '  if (!household?.played || household.absent || household.courtship) return false;', to: '  if (household.courtship) return false;' },
    { file: C, from: "  if (!household.played || household.absent) return 'Only the family’s own student can take this path.';\n", to: '' }] },
  { name: 'the path is offered on the road in', expect: T.road, edits: [
    { file: C, from: "  if (!['running', 'paused'].includes(world.status) || household.arriving) return false;", to: "  if (!['running', 'paused'].includes(world.status)) return false;" },
    { file: C, from: "  if (household.arriving) return 'The family has not reached its land yet.';\n", to: '' }] },
  { name: 'on the real land the path can be pressed before the house site is chosen', expect: T.road, edits: [
    { file: C, from: "  if (household.choosingSite) return 'Choose where your house will stand first, so the neighbours know where to raise it.';\n", to: '' }] },
  { name: 'a family that raised its own house is still offered the path', expect: T.own, edits: [
    { file: C, from: '  if (houseSettled(household)) return false;\n', to: '' },
    { file: C, from: "  if (houseSettled(household)) return 'The family already has a roof of its own.';\n", to: '' }] },
  // ------------------------------------------------------------------------------------------------ the day away
  { name: 'nobody is away: the family goes on working at home', expect: T.away, edits: [
    { file: C, from: '    person.visiting = true;\n', to: '' }] },
  { name: 'somebody away can be given orders', expect: T.away, edits: [
    { file: 'sim/world.mjs', from: '  if (entity.visiting && VISITING_REFUSED.has(input.action)) throw new Error(visitingWhy(world, entity));\n', to: '' }] },
  { name: 'somebody away can be set to work', expect: T.away, edits: [
    { file: 'sim/chores.mjs', from: "  if (entity.visiting) return { can: false, why: `${entity.name} is away with the family at the neighbours' farms.` };\n", to: '' },
    { file: 'sim/world.mjs', from: '  if (entity.visiting && VISITING_REFUSED.has(input.action)) throw new Error(visitingWhy(world, entity));\n', to: '' }] },
  { name: 'the house can be planned while the family is away', expect: T.away, edits: [
    { file: 'sim/world.mjs', from: "  if (household?.courtship?.stage === 'away' && ['plan-house', 'place-piece', 'remove-piece', 'choose-site'].includes(input.action)) throw new Error('The family is away at the neighbours\\' farms. The house waits until they are home.');\n", to: '' }] },
  { name: 'another family standing on the land sees the family that is away', expect: T.away, edits: [
    { file: 'sim/town.mjs', from: '    .filter(entity => !goneFromSight(entity))\n    // Nor a lone parent\'s family away at the neighbours\' farms (sim/courtship.mjs): not at home to be seen.\n    .filter(entity => !entity.visiting);', to: '    .filter(entity => !goneFromSight(entity));' }] },
  { name: 'the family\'s own page draws the family that is away', expect: T.away, edits: [
    { file: 'sim/world.mjs', from: '    ...(e.visiting && { visiting: true, location: null }),', to: '    ...(e.visiting && { visiting: true }),' }] },
  { name: 'the children idle at home while the family is away', expect: T.away, edits: [
    { file: 'sim/childhood.mjs', from: "    if (household.courtship?.stage === 'away') continue;\n", to: '' }] },
  { name: 'pressing it again sends the family out again', expect: T.away, edits: [
    { file: C, from: "  if (household.courtship) return 'The family has already been to the neighbours.';\n", to: '' }] },
  // ------------------------------------------------------------------------------------------------ the new parent
  { name: 'the family is married the moment it sets out, not when it comes home', expect: T.home, edits: [
    { file: C, from: '    if (world.minute >= path.until) comeHome(world, household);', to: '    comeHome(world, household);' }] },
  { name: 'the new parent is not the lone parent\'s own age', expect: T.home, edits: [
    { file: C, from: '  const age = ageNow(world, parent) ?? parent.age ?? 30;', to: '  const age = (ageNow(world, parent) ?? parent.age ?? 30) + 3;' }] },
  { name: 'the new parent is not rolled on a parent\'s dice', expect: T.home, edits: [
    { file: C, from: 'traits: dealTraits(world.seed, id, sex, age) };', to: 'traits: { strength: 5, health: 10, housework: 5 } };' }] },
  { name: 'the new parent\'s looks are left for the student to choose', expect: T.home, edits: [
    { file: C, from: '  entity.appearance = appearanceOf(world, entity);\n', to: '' }] },
  { name: 'the children are made the new parent\'s own, and change how they look', expect: T.home, edits: [
    { file: C, from: '  if (parent) parent.kin = { ...parent.kin, spouse: entity.id };', to: '  if (parent) parent.kin = { ...parent.kin, spouse: entity.id };\n  for (const child of children) world.entities[child].kin = { ...world.entities[child].kin, parents: [...world.entities[child].kin.parents, entity.id] };' }] },
  { name: 'the family book does not say who the new parent is to the children', expect: T.home, edits: [
    { file: 'sim/family.mjs', from: "        : stepchildren.length\n          ? `Married to ${nameOf(kin.spouse)}. Step${kin.role} to ${listWords(stepchildren)}.${born}`\n", to: '' }] },
  { name: 'a lone father meets a son', expect: T.father, edits: [
    { file: C, from: '  const spouseSex = other(parent.sex);', to: "  const spouseSex = 'male';" }] },
  // ------------------------------------------------------------------------ the owner's answers of 2026-09-29: "His name", "New husband leads"
  { name: 'a lone mother\'s family keeps its own name at the wedding', expect: T.name, edits: [
    { file: C, from: "  if (spouse.sex === 'male') { takeHisName(world, household, spouse, path); heLeads(household, parent, spouse); }", to: "  if (spouse.sex === 'male') heLeads(household, parent, spouse);" }] },
  { name: 'the name the family had is not kept in the book', expect: T.name, edits: [
    { file: 'sim/family.mjs', from: "      const formerly = path?.formerName && path.parentId === id ? ` Until the wedding, ${path.formerName}.` : '';", to: "      const formerly = '';" }] },
  { name: 'a new husband does not lead the family', expect: T.leads, edits: [
    { file: C, from: "  if (spouse.sex === 'male') { takeHisName(world, household, spouse, path); heLeads(household, parent, spouse); }", to: "  if (spouse.sex === 'male') takeHisName(world, household, spouse, path);" }] },
  { name: 'the mother stays the main person when her husband is the principal', expect: T.leads, edits: [
    { file: C, from: '  household.principalId = husband.id;\n  delete household.mainId;\n', to: '  household.principalId = husband.id;\n' }] },
  { name: 'a lone father\'s family takes his wife\'s name and she leads it', expect: T.father2, edits: [
    { file: C, from: "  if (spouse.sex === 'male') { takeHisName(", to: "  if (true) { takeHisName(" }] },
  // ------------------------------------------------------------------------------------------------ the house
  { name: 'no house is raised', expect: T.house, edits: [
    { file: C, from: '  const raised = raiseTheHouse(world, household);', to: "  const raised = 'raised';" }] },
  { name: 'the raised house is set down nowhere on the real land', expect: T.house, edits: [
    { file: C, from: '  const placement = plotted ? placeFor(world, household, plan?.placement) : null;', to: '  const placement = null;' }] },
  { name: 'a house the family had begun is thrown away for a round-log cabin', expect: T.begun, edits: [
    { file: C, from: '  if (plan && begun && !houseBuilt(household)) {', to: '  if (false) {' }] },
  // ------------------------------------------------------------------------------------------------ nobody else
  { name: 'the new parent\'s hidden stats are sent with the household', expect: T.nobody, edits: [
    { file: 'sim/world.mjs', from: '  delete shown.courtship;\n', to: '' }] },
  { name: 'the Host is sent a family\'s path', expect: T.nobody, edits: [
    { file: C, from: "  if (role === 'host' || !householdId) return {};\n  const household = world.households[householdId];", to: "  const household = world.households[householdId] || Object.values(world.households).find(one => one.courtship);" }] },
  // ------------------------------------------------------------------------------------------------ the scenes, the save
  { name: 'the scenes are sent again after the student has walked them', expect: T.scenes, edits: [
    { file: C, from: '  household.courtship.watched = true;\n', to: '' }] },
  { name: 'the line of history is drawn as invented', expect: T.scenes, edits: [
    { file: C, from: "kind: 'documented', claimId: CLAIMS.rite },", to: "kind: 'reconstructed', claimId: CLAIMS.rite }," }] },
  { name: 'the flashback forgets the wedding', expect: T.flashback, edits: [
    { file: 'sim/flashback.mjs', from: '  if (wed) {', to: '  if (false) {' }] },
  { name: 'the flashback puts the new parent on the road in', expect: T.flashback, edits: [
    { file: 'sim/flashback.mjs', from: " && person.id !== household.courtship?.spouse?.id).map(firstName);", to: ').map(firstName);' }] },
  { name: 'a save may hold any rite', expect: T.save, edits: [
    { file: C, from: " || !RITES.includes(path.rite)) return 'Invalid lone parent\\'s path';", to: ") return 'Invalid lone parent\\'s path';" }] },
  // ------------------------------------------------------------------------------------------------ the page's own rules
  { name: 'the couple stand too far apart to hold hands', expect: T.page, edits: [
    { file: 'public/courtship.js', from: "    put(spouse, centre + h * 0.245, 'w');", to: "    put(spouse, centre + h * 0.95, 'w');" }] },
  { name: 'a pose not drawn yet is asked for anyway, and nothing is drawn', expect: T.page, edits: [
    { file: 'public/courtship.js', from: '  if (ready(own)) return { id: own, flip: face === \'w\' };', to: '  return { id: own, flip: face === \'w\' };' }] },
  // ------------------------------------------------------------------------------------------------ the browser's (npm run test:lone-parent)
  { name: 'the ability does not glow', browser: true, edits: [
    { file: 'public/style.css', from: 'box-shadow:0 0 0 1px #fff3cf inset,0 0 0 3px var(--card-ring),0 0 10px 2px var(--card-glow);animation:card-glow var(--card-beat) ease-in-out infinite}', to: 'box-shadow:0 0 0 1px #fff3cf inset}' }] },
  { name: 'a change of place is a cut, not a fade to black', browser: true, edits: [
    { file: 'public/courtship.js', from: 'export const FADE_MS = 1100, REDUCED_FADE_MS = 280,', to: 'export const FADE_MS = 0, REDUCED_FADE_MS = 0,' }] },
  { name: 'less motion asked for is a cut', browser: true, edits: [
    { file: 'public/courtship.js', from: 'export const FADE_MS = 1100, REDUCED_FADE_MS = 280,', to: 'export const FADE_MS = 1100, REDUCED_FADE_MS = 0,' }] },
  { name: 'a reload loses the student\'s place in the scenes', browser: true, edits: [
    { file: 'public/courtship.js', from: '  function remember() { if (key) store.set(key, { scene, step }); }', to: '  function remember() {}' }] },
  { name: 'Not now presses the path instead of folding it', browser: true, edits: [
    { file: 'public/app.js', from: "$('#ask-neighbours-later')?.addEventListener('click', () => { setAskFolded(true); if (window.__snapshot) render(window.__snapshot); });", to: "$('#ask-neighbours-later')?.addEventListener('click', () => $('#ask-neighbours-go').click());" }] },
];

const failing = output => [...output.matchAll(/^✖ (.+?) \(\d/gm)].map(match => match[1]).filter((name, i, all) => name !== 'failing tests:' && all.indexOf(name) === i);
const runTests = () => { const result = spawnSync(process.execPath, ['--test', ...FILES], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }); return failing(`${result.stdout}${result.stderr}`); };
const runBrowser = () => {
  const result = spawnSync(process.execPath, ['scripts/lone-parent-browser-proof.mjs'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 900000 });
  if (result.status === 0) return [];
  const passed = [...`${result.stdout}`.matchAll(/^PASS (.+)$/gm)].length;
  const why = `${result.stderr}`.split('\n').find(line => /Error|assert|Timeout/.test(line)) || `exit ${result.status}`;
  return [`test:lone-parent failed after ${passed} checks: ${why.trim().slice(0, 240)}`];
};

const clean = runTests();
if (clean.length) throw new Error(`The tests fail before any injection: ${clean.join('; ')}`);
const record = [];
const CR = String.fromCharCode(13), LF = String.fromCharCode(10);
for (const injection of INJECTIONS) {
  if (Boolean(injection.browser) !== withBrowser) continue;
  const originals = new Map();
  try {
    for (const edit of injection.edits) {
      if (!originals.has(edit.file)) originals.set(edit.file, readFileSync(edit.file, 'utf8'));
      const text = readFileSync(edit.file, 'utf8');
      const count = needle => text.split(needle).length - 1;
      // Written with LF; a file checked out with CRLF has the same lines with CR before each LF.
      const crlf = !count(edit.from) && count(edit.from.split(LF).join(CR + LF));
      const from = crlf ? edit.from.split(LF).join(CR + LF) : edit.from, to = crlf ? edit.to.split(LF).join(CR + LF) : edit.to;
      if (count(from) !== 1) throw new Error(`${injection.name}: the text to replace is in ${edit.file} ${count(from)} times`);
      writeFileSync(edit.file, text.replace(from, to));
    }
    const failed = injection.browser ? runBrowser() : runTests();
    const byItsTest = injection.browser ? failed.length > 0 : failed.includes(injection.expect);
    record.push({ name: injection.name, files: [...originals.keys()], ...(injection.browser ? { browser: true } : { expect: injection.expect }), caught: byItsTest, alone: !injection.browser && failed.length === 1 && byItsTest, failed });
    console.log(`${byItsTest ? 'caught' : 'MISSED'}${!injection.browser && failed.length > 1 ? ` (and ${failed.length - 1} more)` : ''}: ${injection.name} -> ${failed.join(' | ') || 'nothing failed'}`);
  } finally { for (const [file, text] of originals) writeFileSync(file, text); }
}
if (runTests().length) throw new Error('The tests fail after every file was put back');
mkdirSync('docs/evidence', { recursive: true });
const out = `docs/evidence/lone-parent-injections${withBrowser ? '-browser' : ''}.json`;
writeFileSync(out, `${JSON.stringify({ record: 'lone-parent-injections', date: new Date().toISOString().slice(0, 10), files: FILES, ...(withBrowser && { browser: 'npm run test:lone-parent' }), injections: record }, null, 2)}\n`);
console.log(`\n${record.filter(r => r.caught).length} of ${record.length} caught by the test written for each (${record.filter(r => r.alone).length} by that test alone); wrote ${out}`);
