// Injections for the animals bought at the stock pens and the rifle the families nobody plays buy again (owner, 2026-09-24;
// docs/TOWNS.md §4d and §4e). CLAUDE.md: "a new test is not evidence until it has failed". Each injection puts back one exact
// mistake (one or more edits), the test files the change touches are run, the failing tests are recorded against the test the
// injection was written for, and every file is restored. Run: node scripts/beasts-injections.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const FILES = ['tests/beasts.test.mjs', 'tests/rebuy.test.mjs', 'tests/errands.test.mjs', 'tests/tools.test.mjs', 'tests/shops.test.mjs', 'tests/going.test.mjs',
  'tests/neighbours.test.mjs', 'tests/keeping.test.mjs', 'tests/stock.test.mjs', 'tests/war-rifle.test.mjs', 'tests/travel-modes.test.mjs'];
const T = {
  prices: 'the stock pens sell a horse, an ox and a cow and calf for coin and a hog for coin or food, dearer than a rifle but the hog, paid only from what the family has',
  horse: 'a horse bought walks home on a halter beside the rider on the horse she came on, and is its own animal with its own name',
  riders: 'two horses are two riders, and a third is told both are out',
  ox: "an ox bought holds its leader to the ox's pace, the chooser says so, and it drags logs while the first ox pulls the wagon",
  one: 'one person leads one animal home; cattle and hogs are driven to the herd, and no led animal is a load',
  flight: 'a family keeps at most four horses, and the flight east takes the bought ones with the rest',
  old: 'a class saved before opens as it was, and one saved before there were horses can buy one and ride it',
  fog: "no other family's animals reach a student, and each one bought adds little to the family's own projection",
  goes: 'with no rifle left and somebody free, one person goes to the gunsmith on the errand a student sends, and the rifle comes home',
  floor: 'it pays in food only above the floor it keeps, else in coin, and never on credit',
  not: 'nobody is sent while the family still owns a rifle, one at the war included, nor while nobody is free, nor twice',
  far: 'a family whose town has no gunsmith goes to the nearest town that has one, by the road',
};
const one = (file, from, to) => ({ file, from, to });
const INJECTIONS = [
  { name: 'every horse is the one horse', expect: T.riders, edits: [one('sim/keeping.mjs', 'const copies = beasts ? Math.max(1, beasts.length)', "const copies = beasts ? (item === 'horse' ? 1 : Math.max(1, beasts.length))")] },
  { name: 'the horse bought is left standing in town', expect: T.horse, edits: [one('sim/world.mjs', 'for (const id of entity.leads || []) {', "for (const id of (entity.leads || []).filter(id => !id.includes('-horse-'))) {")] },
  { name: 'she rides the new horse home and leaves her own', expect: T.horse, edits: [one('sim/keeping.mjs', 'const beasts = beastsOf(world, household, role).filter(beast => !leading.includes(beast.id));', 'const beasts = beastsOf(world, household, role).reverse();')] },
  { name: 'a led ox keeps up with a trotting horse', expect: T.ox, edits: [one('sim/world.mjs', 'const led = riding ? null : ledPace(world, entity);', 'const led = null;')] },
  { name: 'a led animal counted as a load', expect: T.ox, edits: [one('sim/errands.mjs', 'if (offer.leads) for (let i = 0; i < n; i++) leads.push(offer.leads);', 'if (offer.leads) for (let i = 0; i < n; i++) { leads.push(offer.leads); pack.other += 1; }')] },
  { name: 'the chooser does not say the way home', expect: T.ox, edits: [one('sim/going.mjs', '...(home && { leads: homeWords(path, id, home) }),', '')] },
  { name: 'one person leads a horse and an ox home', expect: T.one, edits: [one('sim/errands.mjs', 'if (leads.length > LEAD_MOST) return', 'if (leads.length > LEAD_MOST + 1) return')] },
  { name: 'cattle bought never reach the herd', expect: T.one, edits: [one('sim/stock.mjs', '  herd[kind] = (herd[kind] || 0) + head;', '')] },
  { name: 'a horse at a rifle\'s price', expect: T.prices, edits: [one('sim/shops.mjs', 'export const HORSE_COIN = 25,', 'export const HORSE_COIN = 8,')] },
  { name: 'a food price the wagon could never carry', expect: T.prices, edits: [one('sim/shops.mjs', "label: 'Buy a horse', coin: HORSE_COIN, food: null,", "label: 'Buy a horse', coin: HORSE_COIN, food: 50,")] },
  { name: 'no cap on horses', expect: T.flight, edits: [one('sim/shops.mjs', "return n >= BEASTS_MOST ? `The family has", "return n >= BEASTS_MOST + 99 ? `The family has")] },
  { name: 'the flight east takes only the first of each', expect: T.flight, edits: [one('sim/scrape.mjs', "const beasts = (world, household) => ['horse', 'ox', 'wagon'].flatMap(role => beastsOf(world, household, role));", "const beasts = (world, household) => ['horse', 'ox', 'wagon'].map(role => beastsOf(world, household, role)[0]).filter(Boolean);")] },
  { name: 'an old ox with no species is no ox', expect: T.old, edits: [one('sim/beasts.mjs', "return entity.species === 'horse' ? 'horse' : 'ox';", "return entity.species === 'horse' ? 'horse' : entity.species === 'ox' ? 'ox' : null;")] },
  { name: "another family's animals in a student's projection", expect: T.fog, edits: [one('sim/world.mjs', 'const entities = Object.values(world.entities).filter(e => e.householdId === householdId && householdId)', "const entities = Object.values(world.entities).filter(e => (e.householdId === householdId || (e.kind === 'animal' && e.householdId)) && householdId)")] },
  { name: 'the director never sends anybody for a rifle', expect: T.goes, edits: [one('sim/neighbours.mjs', "      rifle() && 'visit-shop',", '')] },
  { name: 'the director spends below its floor', expect: T.floor, edits: [one('sim/neighbours.mjs', "(resources.food || 0) - RIFLE_FOOD >= rifleFloor(mouths) ? 'food'", "(resources.food || 0) >= RIFLE_FOOD ? 'food'")] },
  { name: 'the director buys on credit', expect: T.floor, edits: [one('sim/neighbours.mjs', "(resources.money || 0) >= RIFLE_COIN ? 'coin' : null", "'coin'")] },
  { name: 'the director buys a rifle beside the one it has', expect: T.not, edits: [one('sim/neighbours.mjs', "if (!real || toolCount(real, 'rifle') > 0) return null;", 'if (!real) return null;')] },
  { name: 'a rifle at the war counted as lost', expect: T.not, edits: [one('sim/neighbours.mjs', "if (!real || toolCount(real, 'rifle') > 0) return null;", "if (!real || (toolCount(real, 'rifle') > 0 && !real.members.some(id => world.entities[id]?.carries?.items?.includes('rifle')))) return null;")] },
  { name: 'somebody at work sent for the rifle', expect: T.not, edits: [
    one('sim/neighbours.mjs', "  const idle = people.filter(person => !tooYoung(person) && !person.chore && !person.travel", "  const idle = people.filter(person => !tooYoung(person) && !person.travel"),
    one('sim/chores.mjs', "  if (entity.chore) return { can: false, why: `${entity.name} is already ${entity.chore.doing}.` };", "  if (entity.chore && choreId !== 'visit-shop') return { can: false, why: `${entity.name} is already ${entity.chore.doing}.` };")] },
  { name: 'two sent for one rifle', expect: T.not, edits: [one('sim/neighbours.mjs', "'hunt-road', 'tend-sick', 'trade-crossing', 'visit-shop']);", "'hunt-road', 'tend-sick', 'trade-crossing']);")] },
  { name: 'the director always goes to its own town', expect: T.far, edits: [one('sim/neighbours.mjs', "...(rifle().town !== (view.household.settlementId || 'gonzales') && { town: rifle().town })", '')] },
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
writeFileSync('docs/evidence/beasts-injections.json', JSON.stringify({ record: 'beasts-injections', date: new Date().toISOString().slice(0, 10), files: FILES,
  caught: results.filter(r => r.caught).length, onlyThat: results.filter(r => r.onlyThat).length, of: results.length, results }, null, 2) + '\n');
console.log(`${results.filter(r => r.caught).length} of ${results.length} caught by the test written for them (${results.filter(r => r.onlyThat).length} by that test alone); wrote docs/evidence/beasts-injections.json`);
