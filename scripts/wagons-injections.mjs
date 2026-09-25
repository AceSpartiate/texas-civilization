// Injections for wagons by the family's size, the wheelwright's new wagon and the journey with one way (owner, 2026-09-25;
// docs/SETTLING_IN.md §4a, docs/TOWNS.md §4f, docs/FAMILY_PANEL.md §15). CLAUDE.md: "a new test is not evidence until it has
// failed". Each injection puts back one exact mistake (one or more edits), the test files the change touches are run, the failing
// tests are recorded against the test the injection was written for, and every file is restored. Run: node scripts/wagons-injections.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const FILES = ['tests/wagons.test.mjs', 'tests/beasts.test.mjs', 'tests/going.test.mjs', 'tests/going-page.test.mjs', 'tests/riding.test.mjs', 'tests/errands.test.mjs',
  'tests/arrival.test.mjs', 'tests/wagon-load.test.mjs', 'tests/shops.test.mjs', 'tests/keeping.test.mjs', 'tests/family-roll.test.mjs', 'tests/grants.test.mjs', 'tests/travel-modes.test.mjs'];
const T = {
  fitted: 'every family is fitted out with a wagon for every eight people and an ox to draw each, on every roll and across seeds',
  in: 'every wagon comes in with its own driver and ox, drawn in line, and the family is in when the last wheel is',
  two: 'two wagons are two loads out at once, each behind its own ox, and a third is told both are out',
  price: 'the wheelwright sells a new wagon for a hundred reales, coin only, the dearest thing in any town',
  refused: 'a new wagon wants an ox bought with it and a buyer who does not go by the wagon, and is refused at the counter with no ox to draw it',
  bought: "a new wagon is driven home behind the ox bought with it, at the wagon's pace, with the horse ridden in tied on behind",
  flight: 'the flight east loads every wagon an ox can draw at home',
  old: 'a class made before wagons went by size keeps one wagon a family, rolled or running, and opens as it was',
  fog: "no other family's wagons reach a student",
  oneway: 'a journey with one way that can go is sent that way without asking; a real choice, or none, is asked',
};
const one = (file, from, to) => ({ file, from, to });
const INJECTIONS = [
  { name: 'nobody fitted out at the roll', expect: T.fitted, edits: [one('sim/world.mjs', 'if (world.wagonsBySize && fitOut(world, household) > 1) loadForWagons(world, household);', '')] },
  { name: 'a wagon for every ten, not every eight', expect: T.fitted, edits: [one('sim/beasts.mjs', 'export const WAGON_PEOPLE = 8;', 'export const WAGON_PEOPLE = 10;')] },
  { name: 'a second wagon and no ox to draw it', expect: T.fitted, edits: [one('sim/beasts.mjs', "  for (const role of ['wagon', 'ox']) {\n    while (beastsOf(world, household, role).length < want) {", "  for (const role of ['wagon']) {\n    while (beastsOf(world, household, role).length < want) {")] },
  { name: 'the stores not packed into the second wagon', expect: T.fitted, edits: [one('sim/wagon.mjs', "ITEMS.get(entry.id)?.kind === 'stores' ? Math.min(entry.amount * wagons, mostFor(household, ITEMS.get(entry.id))) : entry.amount", 'entry.amount')] },
  { name: "the wagons' room one wagon's", expect: T.fitted, edits: [one('sim/wagon.mjs', 'export const wagonRoom = household => WAGON_SPACE * wagonCount(household);', 'export const wagonRoom = household => WAGON_SPACE;')] },
  { name: 'a class made before fitted out too', expect: T.old, edits: [one('sim/world.mjs', 'if (world.wagonsBySize && fitOut(world, household) > 1)', 'if (fitOut(world, household) > 1)')] },
  { name: 'every wagon is the one wagon', expect: T.two, edits: [one('sim/keeping.mjs', 'const copies = beasts ? Math.max(1, beasts.length)', "const copies = beasts ? (item === 'wagon' ? 1 : Math.max(1, beasts.length))")] },
  { name: 'the principal drawn driving every wagon in', expect: T.in, edits: [one('public/motion.js', '    team.driverId = order.find(entity => !taken.has(entity.id))?.id || null;', '    team.driverId = order[0]?.id || null;')] },
  { name: 'every wagon drawn behind the first ox', expect: T.in, edits: [one('public/motion.js', "    team.ox = oxen.find(ox => !yoked.has(ox.id) && (!ox.borrowedBy || ox.borrowedBy === team.wagon.borrowedBy)) || null;", '    team.ox = oxen[0] || null;')] },
  { name: "a wagon at a horse's price", expect: T.price, edits: [one('sim/shops.mjs', 'export const WAGON_COIN = 100;', 'export const WAGON_COIN = 25;')] },
  { name: 'a wagon sold for food', expect: T.price, edits: [one('sim/shops.mjs', "label: 'Buy a new wagon', coin: WAGON_COIN, food: null,", "label: 'Buy a new wagon', coin: WAGON_COIN, food: 200,")] },
  { name: 'no cap on wagons', expect: T.price, edits: [one('sim/shops.mjs', "        refuse: (world, household) => beastsFull(world, household, 'wagon'),", '        refuse: () => null,')] },
  { name: 'a new wagon with no ox to draw it', expect: T.refused, edits: [one('sim/errands.mjs', "    if (ox < 0) return { why: 'A new wagon has to be drawn home, and an ox draws it. Put an ox from the stock pens on the list too.' };\n    leads.splice(ox, 1);", '    if (ox >= 0) leads.splice(ox, 1);')] },
  { name: 'the counter sells a wagon with no ox there', expect: T.refused, edits: [one('sim/shops.mjs', '  const why = offer.refuse(world, household, entity) || offer.atCounter?.(world, household, entity);', '  const why = offer.refuse(world, household, entity);')] },
  { name: 'the buyer goes by the wagon and drives two home', expect: T.refused, edits: [one('sim/going.mjs', "  if (newWagon && id === 'wagon') return", "  if (false) return")] },
  { name: 'the buyer does not drive the new wagon home', expect: T.bought, edits: [one('sim/shops.mjs', "  if (entity.chore) entity.chore.mode = 'wagon';", '')] },
  { name: 'the horse ridden in is left in town', expect: T.bought, edits: [one('sim/shops.mjs', '  if (horse) leads.push(horse.id);', '')] },
  { name: 'the new ox led home, not yoked', expect: T.bought, edits: [one('sim/shops.mjs', '  const leads = (entity.leads || []).filter(id => id !== ox?.id);', '  const leads = [...(entity.leads || [])];')] },
  { name: 'the flight loads one wagon', expect: T.flight, edits: [one('sim/scrape.mjs', "  if (drawn) return { room: FLIGHT_ROOM * drawn, mode: 'wagon', ...(drawn > 1 && { wagons: drawn }) };", "  if (drawn) return { room: FLIGHT_ROOM, mode: 'wagon' };")] },
  { name: "another family's wagons in a student's projection", expect: T.fog, edits: [one('sim/world.mjs', 'const entities = Object.values(world.entities).filter(e => e.householdId === householdId && householdId)', "const entities = Object.values(world.entities).filter(e => (e.householdId === householdId || (e.kind === 'wagon' && e.householdId)) && householdId)")] },
  { name: 'always ask: the server never says there is one way', expect: T.oneway, edits: [one('sim/world.mjs', '...(!shut && open.length === 1 && { oneWay: open[0].id })', '...{}')] },
  { name: 'always ask: the page never skips the chooser', expect: T.oneway, edits: [one('public/going.js', '  return way ? way.id : null;\n}', '  return null;\n}')] },
  { name: 'the chooser skipped with a real choice', expect: T.oneway, edits: [one('sim/world.mjs', '...(!shut && open.length === 1 && { oneWay: open[0].id })', '...(!shut && open.length >= 1 && { oneWay: open[0].id })')] },
  { name: 'the page sends again after a refusal', expect: T.oneway, edits: [one('public/going.js', "  if (!going?.journey || shown || error || going.shut) return null;", '  if (!going?.journey || going.shut) return null;')] },
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
    const text = changed.get(file);
    if (!text.includes(from)) throw new Error(`${injection.name}: the text to replace is not in ${file}`);
    changed.set(file, text.replace(from, () => to));
  }
  let failed;
  try { for (const [file, text] of changed) writeFileSync(file, text); failed = failing(); } finally { for (const [file, text] of originals) writeFileSync(file, text); }
  const caught = failed.includes(injection.expect);
  results.push({ name: injection.name, expect: injection.expect, edits: injection.edits, caught, onlyThat: caught && failed.length === 1, failed });
  console.log(caught ? (failed.length === 1 ? 'CAUGHT' : 'CAUGHT+') : 'MISSED', injection.name, '->', failed.join(' | '));
}
mkdirSync('docs/evidence', { recursive: true });
writeFileSync('docs/evidence/wagons-injections.json', JSON.stringify({ record: 'wagons-injections', date: new Date().toISOString().slice(0, 10), files: FILES,
  caught: results.filter(r => r.caught).length, onlyThat: results.filter(r => r.onlyThat).length, of: results.length, results }, null, 2) + '\n');
console.log(`${results.filter(r => r.caught).length} of ${results.length} caught by the test written for them (${results.filter(r => r.onlyThat).length} by that test alone); wrote docs/evidence/wagons-injections.json`);
