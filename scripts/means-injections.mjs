// Injections for the family's means and the company on the road (owner, 2026-09-25: "introduce rolling for starting wealth. tie
// it into the extra wagons. part of wealth will be number of wagons. if a family doesn't have enough wagons, older family members
// walk. have this potentially affect travelling speed."; sim/means.mjs, sim/company.mjs, docs/SETTLING_IN.md §4b). CLAUDE.md: "a new
// test is not evidence until it has failed". Each injection puts back one exact mistake, the test files the change touches are
// run, the failing tests are recorded against the test the injection was written for, and every file is restored.
// Run: node scripts/means-injections.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const FILES = ['tests/means.test.mjs', 'tests/afoot.test.mjs', 'tests/wagons.test.mjs', 'tests/arrival.test.mjs', 'tests/family-roll.test.mjs', 'tests/wagon-load.test.mjs', 'tests/creation-words.test.mjs', 'tests/grants.test.mjs'];
const T = {
  die: "the means die is the class's and the household's, the same every time, and every band is reached",
  bands: 'each band comes with the vehicles it says, an ox to each and the horse, and the load packed for their room',
  seats: "a driver to every vehicle, then the sick and the youngest ride, a baby in its carrier's arms, and the eldest walk",
  pace: 'the family goes at its slowest: the ox with a vehicle, a small child on foot slower, and on foot its smallest walker',
  road: 'on the road in each is seated, walkers are tired as walkers, the family comes in together, and the page draws them so',
  slow: "a family of many small children in one cart comes in slower than the ox, and one with room at the ox's pace",
  flight: 'the flight east and the way home are seated and paced as the family is; a cart holds three quarters of a wagon',
  foot: 'a family whose vehicle is gone flees on foot at the pace of its smallest walker, carrying a baby',
  cart: 'a family with a cart does its first steps, brings in a crop that wants the wagon, and keeps the whole of its lesson',
  nobody: 'the families nobody plays are given means on the first running tick and go on living their lives',
  old: "a class made before the means opens as it was: no means, no seats, the ox's pace, and a saved class keeps its own",
  wire: "nothing hidden is read or sent; no other family's means or seats reach a student; the seats cost the tick little",
  food: 'no family arrives with fewer than five days of food for its eaters, whatever its means and its size',
};
const one = (file, from, to) => ({ file, from, to });
const INJECTIONS = [
  { name: 'the old trim: nothing carried on foot, a poor family of twelve arrives with 4 food', expect: T.food, edits: [one('sim/means.mjs', '  packForRoom(world, household);\n  carryTheRest(world, household);\n', '  packForRoom(world, household);\n')] },
  { name: 'the food carried on foot lost when the cart is repacked', expect: T.food, edits: [one('sim/wagon.mjs', '  household.resources = { ...household.resources, ...storesWithPacks(household, load) };\n  household.tools', '  household.resources = { ...household.resources, ...loadStores(load) };\n  household.tools')] },
  { name: 'three days, not five', expect: T.food, edits: [one('sim/means.mjs', 'export const ARRIVAL_DAYS = 5;', 'export const ARRIVAL_DAYS = 3;')] },
  { name: "the means die thrown on the family die's question", expect: T.die, edits: [one('sim/family.mjs', ':means-roll`) % FAMILY_DIE)', ':family-roll`) % FAMILY_DIE)')] },
  { name: 'the means not rolled with the family', expect: T.die, edits: [one('sim/world.mjs', '  if (world.meansRoll) applyMeans(world, household);\n', '')] },
  { name: 'a poor family comes with a wagon, not a cart', expect: T.bands, edits: [one('sim/means.mjs', 'from: 3, to: 6, wagons: 1, cart: true }', 'from: 3, to: 6, wagons: 1 }')] },
  { name: 'a comfortable family comes with one wagon', expect: T.bands, edits: [one('sim/means.mjs', 'from: 15, to: 18, wagons: 2 }', 'from: 15, to: 18, wagons: 1 }')] },
  { name: 'the extra wagons come with no ox', expect: T.bands, edits: [one('sim/means.mjs', "  for (const role of ['wagon', 'ox']) {", "  for (const role of ['wagon']) {")] },
  { name: "a cart holds a wagon's room", expect: T.bands, edits: [one('sim/wagon.mjs', '(carted(household) ? WAGON_SPACE - CART_SPACE : 0)', '0')] },
  { name: 'the stores not packed into the other wagons', expect: T.bands, edits: [one('sim/wagon.mjs', "ITEMS.get(entry.id)?.kind === 'stores' ? Math.min(entry.amount * wagons, mostFor(household, ITEMS.get(entry.id))) : entry.amount]));\n  const used", 'entry.amount]));\n  const used')] },
  { name: 'the hoe and the seed trimmed out of a cart first', expect: T.bands, edits: [one('sim/wagon.mjs', "[['provisions', 1], ['powder', 1], ['provisions', 0],", "[['hoe', 0], ['seed', 0], ['provisions', 1], ['powder', 1], ['provisions', 0],")] },
  { name: 'the oldest ride first', expect: T.seats, edits: [one('sim/company.mjs', '.sort((a, b) => (unwell(b) - unwell(a)) || byAge(a, b));', '.sort((a, b) => (unwell(b) - unwell(a)) || byAge(b, a));')] },
  { name: 'the sick wait their turn', expect: T.seats, edits: [one('sim/company.mjs', '.sort((a, b) => (unwell(b) - unwell(a)) || byAge(a, b));', '.sort((a, b) => byAge(a, b));')] },
  { name: 'a baby takes a seat of its own', expect: T.seats, edits: [one('sim/company.mjs', 'const carried = person => Number.isFinite(person.age) && person.age < CARRIED_UNDER;', 'const carried = () => false;')] },
  { name: "a cart takes a wagon's riders", expect: T.seats, edits: [one('sim/company.mjs', 'export const ridersIn = vehicle => (vehicle?.cart || vehicle?.carreta ? CART_RIDERS : WAGON_RIDERS);', 'export const ridersIn = () => WAGON_RIDERS;')] },
  { name: 'a child of eight drives', expect: T.seats, edits: [one('sim/company.mjs', 'const mayDrive = person => !Number.isFinite(person.age) || person.age >= SENT_FROM_AGE;', 'const mayDrive = () => true;')] },
  { name: 'walkers never slow the family', expect: T.pace, edits: [one('sim/company.mjs', '  return vehicles.length ? Math.min(WAGON_SPEED, slowest) : Math.min(WALK_SPEED, slowest);', '  return vehicles.length ? WAGON_SPEED : WALK_SPEED;')] },
  { name: 'a small child walks as fast as a grown one', expect: T.pace, edits: [one('sim/company.mjs', '  return age >= 6 ? CHILD_WALK_SPEED : SMALL_WALK_SPEED;', '  return WALK_SPEED;')] },
  { name: "a family on foot at the ox's pace", expect: T.foot, edits: [one('sim/company.mjs', ': Math.min(WALK_SPEED, slowest);', ': WAGON_SPEED;')] },
  { name: 'nobody seated on the road in', expect: T.road, edits: [one('sim/settling.mjs', '  if (!world.meansRoll) return;\n  const movers', '  return;\n  const movers')] },
  { name: 'a walker tired as a rider', expect: T.road, edits: [one('sim/world.mjs', 'const how = travel.saddle ? MODES.horse : travel.afoot ? MODES.foot : modeOf(travel);', 'const how = travel.saddle ? MODES.horse : modeOf(travel);')] },
  { name: 'a baby carried tired by the road', expect: T.road, edits: [one('sim/world.mjs', 'const cost = travel.carried ? 0 :', 'const cost =')] },
  { name: 'the seats not sent to the family', expect: T.road, edits: [one('sim/world.mjs', 'mode: travel.mode, ...seatOfTravel(travel) } };', 'mode: travel.mode } };')] },
  { name: 'riders drawn walking beside the wagon as well', expect: T.road, edits: [one('public/motion.js', "  if (entity.kind === 'person' && entity.travel?.rides) {\n    const team", '  if (false) {\n    const team')] },
  { name: 'the page deals the drivers itself', expect: T.road, edits: [one('public/motion.js', 'const planned = aboard.some(entity => entity.travel.drives || entity.travel.rides || entity.travel.afoot);', 'const planned = false;')] },
  { name: 'a small child walking does not hold the cart back', expect: T.slow, edits: [one('sim/company.mjs', 'export const CHILD_WALK_SPEED = 2 / 3, SMALL_WALK_SPEED = 0.5;', 'export const CHILD_WALK_SPEED = 2 / 3, SMALL_WALK_SPEED = 0.65;')] },
  { name: 'the flight east not seated', expect: T.flight, edits: [one('sim/scrape.mjs', "  if (world.meansRoll) setOut(travellers, mode === 'wagon' ? drawnVehicles(travellers) : [], journey, riddenHorses(world, travellers));", '  if (false) setOut(travellers, [], journey);'), one('sim/scrape.mjs', '    if (!world.meansRoll) entity.travel = journey();\n    entity.location', '    entity.travel = journey();\n    entity.location')] },
  { name: 'the way home not seated', expect: T.flight, edits: [one('sim/scrape.mjs', "    if (world.meansRoll) setOut(home, mode === 'wagon' ? drawnVehicles(home) : [], journey, riddenHorses(world, home));", '    if (false) setOut(home, [], journey);'), one('sim/scrape.mjs', '      if (!world.meansRoll) entity.travel = journey();', '      entity.travel = journey();')] },
  { name: "a cart holds a wagon's room in the flight", expect: T.flight, edits: [one('sim/scrape.mjs', 'const roomOf = wagon => (wagon.cart ? CART_SPACE : wagon.carreta ? CARRETA_SPACE : WAGON_SPACE);', 'const roomOf = wagon => (wagon.carreta ? CARRETA_SPACE : WAGON_SPACE);')] },
  { name: 'a cart is not the vehicle a crop wants', expect: T.cart, edits: [one('sim/means.mjs', "  if (band.cart && wagon) { wagon.cart = true; wagon.name = 'Family cart'; }", "  if (band.cart && wagon) { wagon.cart = true; wagon.name = 'Family cart'; wagon.condition = 'broken'; }")] },
  { name: 'the families nobody plays given no means', expect: T.nobody, edits: [one('sim/world.mjs', '  settleMeans(world);\n', '')] },
  { name: "the means written into a family's record", expect: T.nobody, edits: [one('sim/means.mjs', '  for (const household of Object.values(world.households)) if (!household.means) applyMeans(world, household);', "  for (const household of Object.values(world.households)) if (!household.means) { applyMeans(world, household); world.events.push({ id: `ev-m-${household.id}`, type: 'memory', householdId: household.id, text: 'The family means are rolled.' }); }")] },
  { name: 'a class made before seated too', expect: T.old, edits: [one('sim/settling.mjs', '  if (!world.meansRoll) return;\n  const movers', '  const movers')] },
  { name: 'means never checked on a save', expect: T.old, edits: [one('sim/means.mjs', 'export function meansInvalid(world) {\n', 'export function meansInvalid(world) {\n  return null;\n')] },
  { name: 'the Host not told who walks', expect: T.wire, edits: [one('sim/overview.mjs', ', ...seatOfTravel(entity.travel) };', ' };')] },
  { name: "the family book carries the people's hidden stats", expect: T.wire, edits: [one('sim/means.mjs', 'seats: seatWords(people, vehicles, horses) };', 'seats: seatWords(people, vehicles, horses), who: people.map(one => one.traits) };')] },
  { name: "another family's cart sent to a student", expect: T.wire, edits: [one('sim/world.mjs', 'const entities = Object.values(world.entities).filter(e => e.householdId === householdId && householdId)', 'const entities = Object.values(world.entities).filter(e => (e.householdId === householdId || e.cart) && householdId)')] },
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
writeFileSync('docs/evidence/means-injections.json', JSON.stringify({ record: 'means-injections', date: new Date().toISOString().slice(0, 10), files: FILES,
  caught: results.filter(r => r.caught).length, onlyThat: results.filter(r => r.onlyThat).length, of: results.length, results }, null, 2) + '\n');
console.log(`${results.filter(r => r.caught).length} of ${results.length} caught by the test written for them (${results.filter(r => r.onlyThat).length} by that test alone); wrote docs/evidence/means-injections.json`);
