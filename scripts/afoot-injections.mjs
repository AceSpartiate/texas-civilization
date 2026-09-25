// Injections for the second table of means: starting coin, a family with no vehicle, the carreta made at home and the horse that
// carries a rider (owner, 2026-09-25, the evening's amendment; sim/means.mjs, sim/company.mjs, sim/carreta.mjs, FIC-GONZ-397 and
// -398). CLAUDE.md: "a new test is not evidence until it has failed". Each injection puts back one exact mistake, the test files
// the change touches are run, the failing tests are recorded against the test the injection was written for, and every file is
// restored. Run: node scripts/afoot-injections.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const FILES = ['tests/afoot.test.mjs', 'tests/carreta.test.mjs', 'tests/means.test.mjs', 'tests/lesson.test.mjs', 'tests/ending.test.mjs', 'tests/store.test.mjs'];
const T = {
  coin: 'every face of the means die gives a fixed coin from 3 to 10, never falling as the face rises, and it is in the house',
  first: 'a class that rolled on the first table keeps it: four bands, a cart at the bottom, no coin, and the horse led',
  walk: 'a family that is hard up walks in: its kit on the ox, its food on its own backs, one on the horse, nobody hungry',
  lessonAfoot: 'a family with no vehicle does the whole of its lesson, and sells its crop in town on foot',
  hand: 'a crop that would want the wagon is brought in by hand by a family with none, and slower; one whose wagon is away is told so',
  town: 'a family with no vehicle goes to town more than once for a big load, and flees east on foot with one on the horse',
  offered: 'the carreta is offered where logs lie in a pile, and refused in words for want of the axe, the logs, a hide, or the class begun',
  made: 'made, it takes three logs, the poorest first, and a hide, and stands in the yard as the vehicle of a family that had none',
  used: 'it is used as the wagon is, one person at a time, and carries less: twelve on a trip, ten in the flight, two riders',
  harvest: 'a harvest that wants the wagon takes the carreta, and a family that made one no longer carries its crop in by hand',
  horse: "the horse carries a rider: one more seat after the vehicles', to the sick and then the youngest, and a baby in its carrier's arms",
  road: 'on the road in each is seated, walkers are tired as walkers, the family comes in together, and the page draws them so',
  lesson: 'the whole of it, played through: the family ends with a house, a field it cleared, the crop it chose, coin for it, and a hunt',
  account: "every coin that came into the house or went out of it is in the family's account",
};
const one = (file, from, to) => ({ file, from, to });
const INJECTIONS = [
  // Coin.
  { name: 'the top face gives eleven reales', expect: T.coin, edits: [one('sim/means.mjs', '7, 7, 8, 8, 9, 10]);', '7, 7, 8, 8, 9, 11]);')] },
  { name: 'the coin falls as the face rises', expect: T.coin, edits: [one('sim/means.mjs', 'MEANS_COIN = Object.freeze([3, 3, 3, 3, 4, 4,', 'MEANS_COIN = Object.freeze([3, 3, 4, 3, 4, 4,')] },
  { name: 'the coin rolled and not put in the house', expect: T.coin, edits: [one('sim/means.mjs', '  if (coin) household.resources = { ...household.resources, money: (household.resources?.money ?? 0) + coin };\n', '')] },
  { name: 'the coin not said with the band', expect: T.coin, edits: [one('sim/means.mjs', "  return coin ? `${haul}, the family's horse, and ${realesWords(coin)}.` : `${haul}, and the family's horse.`;", "  return `${haul}, and the family's horse.`;")] },
  { name: 'a class of the first table rolls on the second', expect: T.first, edits: [one('sim/means.mjs', 'export const bandsOf = world => (secondTable(world) ? MEANS_BANDS : MEANS_BANDS_BEFORE);', 'export const bandsOf = () => MEANS_BANDS;')] },
  { name: 'a class of the first table given coin', expect: T.first, edits: [one('sim/means.mjs', '  const coin = secondTable(world) ? coinFor(roll) : 0;', '  const coin = coinFor(roll);')] },
  { name: 'the horse ridden in a class of the first table', expect: T.first, edits: [one('sim/company.mjs', "export const riddenHorses = (world, movers = []) => (world?.meansRoll === 2 ?", "export const riddenHorses = (world, movers = []) => (world?.meansRoll ?")] },
  { name: 'a means record with the wrong coin let in', expect: T.coin, edits: [one('sim/means.mjs', "    if (means.coin !== undefined && (!secondTable(world) || means.coin !== coinFor(means.roll))) return 'Invalid means';\n    if (secondTable(world) && means.coin === undefined) return 'Invalid means';\n", '')] },
  // A family with no vehicle.
  { name: 'a family that is hard up comes with the family wagon', expect: T.walk, edits: [one('sim/means.mjs', '  if (band.afoot) for (const one of wagonsOf(world, household)) {', '  if (false) for (const one of wagonsOf(world, household)) {')] },
  { name: 'a family on foot leaves its ox behind with the wagon', expect: T.walk, edits: [one('sim/means.mjs', '    household.property = household.property.filter(id => id !== one.id);\n  }', "    household.property = household.property.filter(id => id !== one.id);\n    const ox = beastsOf(world, household, 'ox')[0];\n    if (ox) { delete world.entities[ox.id]; household.property = household.property.filter(id => id !== ox.id); }\n  }")] },
  { name: "the ox's packs too small for a shot", expect: T.walk, edits: [one('sim/wagon.mjs', 'export const PACK_SPACE = 7;', 'export const PACK_SPACE = 6;')] },
  { name: 'a family on foot sent in by the wagon', expect: T.walk, edits: [one('sim/settling.mjs', "  const mode = walking ? 'foot' : 'wagon';", "  const mode = 'wagon';"), one('sim/settling.mjs', "      if (walking && entity.travel.progress === 0 && entity.travel.mode !== 'foot') {", '      if (false) {'), one('sim/company.mjs', "    if (!vehicles.length && rest.mode === 'wagon') rest.mode = 'foot';\n", '')] },
  { name: 'the arrival line says the ox carried nothing', expect: T.walk, edits: [one('sim/settling.mjs', 'food on their backs, in sacks and bundles, and the ox carried the rest.`', 'food more on foot, in sacks and bundles.`')] },
  { name: 'walkers on foot drawn on one spot', expect: T.walk, edits: [one('public/motion.js', "(entity.travel?.mode === 'wagon' || entity.travel?.mode === 'foot') && Boolean(entity.travel.afoot)", "entity.travel?.mode === 'wagon' && Boolean(entity.travel.afoot)")] },
  { name: 'a big crop refused a family that has no vehicle at all', expect: T.hand, edits: [one('sim/chores.mjs', '  if (chore.wantsWagon && needsWagonToHarvest(household) && ownsVehicle(world, household) && !wagonAtHome(world, household)) {', '  if (chore.wantsWagon && needsWagonToHarvest(household) && !wagonAtHome(world, household)) {')] },
  { name: 'carried in by hand as fast as by the wagon', expect: T.hand, edits: [one('sim/chores.mjs', "    begin: (world, household, entity) => { if (byHand(world, household)) entity.chore.flags = [...(entity.chore.flags || []), 'by-hand']; },", '    begin: () => {},')] },
  { name: 'a harvest by hand holds a wagon nobody has', expect: T.hand, edits: [one('sim/chores.mjs', "    takes: (world, household) => needsWagonToHarvest(household) && ownsVehicle(world, household) ? ['ox', 'wagon'] : [],", "    takes: (world, household) => needsWagonToHarvest(household) ? ['ox', 'wagon'] : [],")] },
  { name: 'a family with no wagon told to wait for the wagon', expect: T.town, edits: [one('sim/errands.mjs', "  if (!needsWagon && !beastsOf(world, household, 'wagon').some(kept)) return", "  if (false) return")] },
  { name: 'the lesson on foot says the wagon', expect: T.lessonAfoot, edits: [one('sim/lesson.mjs', "    says: (world, household) => walked(household)\n", "    says: (world, household) => false\n")] },
  // The horse carries a rider.
  { name: 'the horse carries nobody', expect: T.horse, edits: [one('sim/company.mjs', ', ...horses.map(horse => ({ id: horse.id, left: 1, saddle: true }))];', '];')] },
  { name: 'the horse seated before the wagons', expect: T.horse, edits: [one('sim/company.mjs', 'const free = [...vehicles.map(vehicle => ({ id: vehicle.id, left: ridersIn(vehicle) })), ...horses.map(horse => ({ id: horse.id, left: 1, saddle: true }))];', 'const free = [...horses.map(horse => ({ id: horse.id, left: 1, saddle: true })), ...vehicles.map(vehicle => ({ id: vehicle.id, left: ridersIn(vehicle) }))];')] },
  { name: 'a baby left off the horse its mother rides', expect: T.horse, edits: [one('sim/company.mjs', "{ rides: theirs.drives || theirs.rides, ...(theirs.saddle && { saddle: true }) }", '{ rides: theirs.drives || theirs.rides }')] },
  { name: 'the rider on the horse tired as a walker', expect: T.road, edits: [one('sim/world.mjs', 'const how = travel.saddle ? MODES.horse : travel.afoot ? MODES.foot : modeOf(travel);', 'const how = travel.saddle ? MODES.foot : travel.afoot ? MODES.foot : modeOf(travel);')] },
  { name: 'the rider on the horse not drawn in the saddle', expect: T.road, edits: [one('public/motion.js', " && (entity.travel?.mode === 'horse' || (Boolean(entity.travel?.saddle) && !entity.travel.carried));", " && entity.travel?.mode === 'horse';")] },
  { name: 'the ridden horse drawn again by itself', expect: T.road, edits: [one('public/motion.js', "  if (entity.kind === 'animal' && entity.species === 'horse' && entities.some(one => one.kind === 'person' && one.travel?.saddle && !one.travel.carried && one.travel.rides === entity.id)) return true;\n", '')] },
  { name: 'the saddle not sent to the page', expect: T.road, edits: [one('sim/company.mjs', ' rides: travel.rides, saddle: travel.saddle, afoot:', ' rides: travel.rides, afoot:')] },
  // The carreta.
  { name: 'the carreta offered with no log pile', expect: T.offered, edits: [one('sim/carreta.mjs', 'export const carretaOffered = world => secondTable(world) && countsTrees(woodsRule(world));', 'export const carretaOffered = world => secondTable(world);')] },
  { name: 'a carreta made with no hide', expect: T.offered, edits: [one('sim/carreta.mjs', "  if ((household.resources?.hides ?? 0) < CARRETA_HIDES) return", '  if (false) return')] },
  { name: 'a carreta made with too few logs', expect: T.offered, edits: [one('sim/carreta.mjs', '  if (logs < CARRETA_LOGS) return', '  if (false) return')] },
  { name: 'two carretas made at once', expect: T.offered, edits: [one('sim/carreta.mjs', '  if (already && already !== entity) return', '  if (false) return')] },
  { name: 'the wall timber cut for wheels first', expect: T.made, edits: [one('sim/carreta.mjs', "const LOG_ORDER = Object.freeze(['poor', 'sill', 'wall']);", "const LOG_ORDER = Object.freeze(['wall', 'sill', 'poor']);")] },
  { name: 'the hide not taken', expect: T.made, edits: [one('sim/carreta.mjs', '  household.resources.hides -= CARRETA_HIDES;\n', '')] },
  { name: 'the carreta of a family on foot is not the family wagon', expect: T.made, edits: [one('sim/carreta.mjs', '  if (!world.entities[first]) {', '  if (false) {')] },
  { name: 'the page not told it is a carreta', expect: T.made, edits: [one('sim/world.mjs', '...(e.carreta && { carreta: true }), borrowedBy', 'borrowedBy')] },
  { name: 'a carreta let in a class of the first table', expect: T.made, edits: [one('sim/means.mjs', "entity.cart || !secondTable(world) || !world.households", 'entity.cart || !world.households')] },
  { name: "the carreta carries a wagon's load", expect: T.used, edits: [one('sim/keeping.mjs', '  return wagon?.carreta ? CARRETA_CARRY : mode.carry;', '  return mode.carry;')] },
  { name: "the carreta seats a wagon's riders", expect: T.used, edits: [one('sim/company.mjs', '(vehicle?.cart || vehicle?.carreta ? CART_RIDERS : WAGON_RIDERS)', '(vehicle?.cart ? CART_RIDERS : WAGON_RIDERS)')] },
  { name: "the carreta holds a wagon's room in the flight", expect: T.used, edits: [one('sim/scrape.mjs', 'const roomOf = wagon => (wagon.cart ? CART_SPACE : wagon.carreta ? CARRETA_SPACE : WAGON_SPACE);', 'const roomOf = wagon => (wagon.cart ? CART_SPACE : WAGON_SPACE);')] },
  { name: 'the carreta made broken', expect: T.harvest, edits: [one('sim/carreta.mjs', "  Object.assign(carreta, { carreta: true, name: made ? 'Second carreta' : 'Carreta' });", "  Object.assign(carreta, { carreta: true, name: made ? 'Second carreta' : 'Carreta', condition: 'broken' });")] },
  // The coin the family came with, and what it is not.
  { name: 'the coin the family came with taken for a crop sold', expect: T.lesson, edits: [one('sim/lesson.mjs', '  || (household.resources?.money ?? 0) > (startCoin(household) ? (household.lesson?.had?.money ?? Infinity) : 0);', '  || (household.resources?.money ?? 0) > 0;')] },
  { name: "the coin the family came with missing from the ending's account", expect: T.account, edits: [one('sim/ending.mjs', '  const coin = [...start, ...world.events', '  const coin = [...world.events')] },
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
writeFileSync('docs/evidence/afoot-injections.json', JSON.stringify({ record: 'afoot-injections', date: new Date().toISOString().slice(0, 10), files: FILES,
  caught: results.filter(r => r.caught).length, onlyThat: results.filter(r => r.onlyThat).length, of: results.length, results }, null, 2) + '\n');
console.log(`${results.filter(r => r.caught).length} of ${results.length} caught by the test written for them (${results.filter(r => r.onlyThat).length} by that test alone); wrote docs/evidence/afoot-injections.json`);
