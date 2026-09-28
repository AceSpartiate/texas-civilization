// The regressions tests/crop-minutes.test.mjs, tests/market.test.mjs and tests/ending.test.mjs guard, injected one at a time (CLAUDE.md: "A new test is not
// evidence until it has failed"). Each injection replaces one exact piece of sim/crops.mjs, sim/market.mjs, sim/chores.mjs,
// sim/errands.mjs or sim/ending.mjs with the mistake a test is written against, runs the three test files, records which tests
// failed, and puts the file back byte for byte.
//
// Run: node scripts/crops-market-injections.mjs  → writes docs/evidence/crops-market-injections.json
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const FILES = ['tests/crop-minutes.test.mjs', 'tests/market.test.mjs', 'tests/ending.test.mjs', 'tests/money.test.mjs'];
const INJECTIONS = [
  // Crops in real minutes (sim/crops.mjs).
  {
    name: 'a crop ripens in ticks, whatever real time they took, as it did before',
    file: 'sim/crops.mjs',
    from: "export const ripe = (world, field) => field?.state === 'planted' && grownOf(world, field) >= growMs(field.crop);",
    to: "export const ripe = (world, field) => field?.state === 'planted' && world.tick - field.changedTick >= RIPEN_TICKS;",
  },
  {
    name: 'every tick counts as a Study-pace tick, whatever the server measured: the class speed changes a crop\'s minutes',
    file: 'sim/crops.mjs',
    from: '  household.field = { ...field, grownMs: grownOf(world, field) + (Number.isFinite(realMs) ? realMs : STUDY_TICK_MS) };',
    to: '  household.field = { ...field, grownMs: grownOf(world, field) + STUDY_TICK_MS };',
  },
  {
    name: 'cotton ripens as fast as corn',
    file: 'sim/crops.mjs',
    from: "  cotton: Object.freeze({ minutes: 6, seed: COTTON_SEED_PER_PLOT, yields: 'cotton' }),",
    to: "  cotton: Object.freeze({ minutes: 4, seed: COTTON_SEED_PER_PLOT, yields: 'cotton' }),",
  },
  {
    name: 'corn keeps the three minutes of the first answer, not the four the owner asked for',
    file: 'sim/crops.mjs',
    from: "  corn: Object.freeze({ minutes: 4, seed: SEED_PER_PLOT, yields: 'food' }),",
    to: "  corn: Object.freeze({ minutes: 3, seed: SEED_PER_PLOT, yields: 'food' }),",
  },
  {
    name: 'a tick the server measured as nothing - the first after a pause - grows the crop a Study tick anyway',
    file: 'sim/crops.mjs',
    from: '  household.field = { ...field, grownMs: grownOf(world, field) + (Number.isFinite(realMs) ? realMs : STUDY_TICK_MS) };',
    to: '  household.field = { ...field, grownMs: grownOf(world, field) + (realMs > 0 ? realMs : STUDY_TICK_MS) };',
  },
  {
    name: 'a crop sown in a class saved before this starts growing from nothing',
    file: 'sim/crops.mjs',
    from: '  return Math.max(0, (world.tick - (field?.changedTick ?? world.tick))) * STUDY_TICK_MS;',
    to: '  return 0;',
  },
  {
    name: 'a save may hold a crop the game does not grow',
    file: 'sim/crops.mjs',
    from: "  if (!field || !['bare', 'planted', 'ripe'].includes(field.state) || !CROPS[field.crop]) return 'Invalid field state';",
    to: "  if (!field || !['bare', 'planted', 'ripe'].includes(field.state)) return 'Invalid field state';",
  },
  {
    name: 'the real time a crop has stood is never checked in a save',
    file: 'sim/crops.mjs',
    from: "  if (field.grownMs !== undefined && (!Number.isFinite(field.grownMs) || field.grownMs < 0)) return 'Invalid field state';",
    to: '',
  },
  // Planting (sim/chores.mjs).
  {
    name: 'a planter who finds no crop open at the rows falls to the first answer and plants it, out of season or without seed',
    file: 'sim/chores.mjs',
    from: '  const chosen = ask.options.find(candidate => candidate.id === option) || (option === \'leave\' && ASKS[ask.id]?.noneOpen) || ask.options[0];',
    to: '  const chosen = ask.options.find(candidate => candidate.id === option) || ask.options[0];',
  },
  // The market (sim/market.mjs).
  {
    name: 'the store pays full price however much it holds, and never fills',
    file: 'sim/market.mjs',
    from: '  if (held < want / 2) return 0;',
    to: '  return 0;',
  },
  {
    name: 'the store never sells anything on: once full, full for ever',
    file: 'sim/market.mjs',
    from: '  const gone = wantAt(world, siteId, key) / SELLS_ON_DAYS * Math.max(0, (minute - entry.minute) / DAY);',
    to: '  const gone = 0;',
  },
  {
    name: 'what the store bought is never written down',
    file: 'sim/market.mjs',
    from: '  world.markets[siteId] = { ...(world.markets[siteId] || {}), [key]: { held: round(held + units), minute: world.minute } };',
    to: '',
  },
  {
    name: 'a full store is never said to be full',
    file: 'sim/market.mjs',
    from: '  return tierAt(heldAt(world, siteId, key), wantAt(world, siteId, key)) < 0 ? marketWords(world, siteId, trade, good) : null;',
    to: '  return null;',
  },
  {
    name: 'a save may hold a market for a town that is not there, or held below nothing',
    file: 'sim/market.mjs',
    from: "      if (!MARKET[key] || !Number.isFinite(entry?.held) || entry.held < 0 || !Number.isFinite(entry.minute) || entry.minute < 0) return 'Invalid market';",
    to: '',
  },
  {
    name: "the director's own errand is sent to a full store",
    file: 'sim/chores.mjs',
    from: "    const why = marketRefusal(world, townOf(household), 'store', choreId === 'sell-cotton' ? 'cotton' : 'food');",
    to: '    const why = null;',
  },
  {
    name: "the errand's list shows the store's first price, not what it pays now",
    file: 'sim/errands.mjs',
    from: 'price: priceWords(offer, now), each: eachWords(offer)',
    to: 'price: priceWords(offer), each: eachWords(offer)',
  },
  {
    name: 'a sale by the errand is not the store\'s: the next family finds it as empty as before',
    file: 'sim/errands.mjs',
    from: '      if (sale.sold > 0) recordSale(world, siteId, trade, offer.good, sale.sold);',
    to: '',
  },
  // No limit until the Runaway Scrape, then four a family; spare corn sold too (sim/market.mjs, sim/chores.mjs, sim/neighbours.mjs).
  {
    name: 'the stores are limited from the first day, not from the Runaway Scrape',
    file: 'sim/market.mjs',
    from: 'export const limited = world => (world?.period || 1) >= 3;',
    to: 'export const limited = world => true;',
  },
  {
    name: 'the stores are never limited, even in the Scrape',
    file: 'sim/market.mjs',
    from: 'export const limited = world => (world?.period || 1) >= 3;',
    to: 'export const limited = world => false;',
  },
  {
    name: 'a sale before the Scrape is held against the store, so it opens the spring already full',
    file: 'sim/market.mjs',
    from: '  if (!MARKET[key] || !(units > 0) || !limited(world)) return;',
    to: '  if (!MARKET[key] || !(units > 0)) return;',
  },
  {
    name: 'the store wants three bales a family in the Scrape, not the owner\'s four',
    file: 'sim/market.mjs',
    from: "  'store:cotton': Object.freeze({ want: 4, tiers: Object.freeze([{ coinEach: 2, foodEach: 2 }, { coinEach: 1, foodEach: 1 }]) }),",
    to: "  'store:cotton': Object.freeze({ want: 3, tiers: Object.freeze([{ coinEach: 2, foodEach: 2 }, { coinEach: 1, foodEach: 1 }]) }),",
  },
  {
    name: 'the neighbours\' director never sells spare corn',
    file: 'sim/neighbours.mjs',
    from: "      spareFood(world, world.households[view.household.id]) >= FOOD_LOT && 'sell-food',",
    to: '',
  },
  {
    name: 'the food errand sells all it can carry, into the family\'s three weeks of eating',
    file: 'sim/chores.mjs',
    from: "      const carried = round(Math.min(good === 'food' ? spareFood(world, household) : household.resources[good] ?? 0, household.resources[good] ?? 0, vehicleCarry(world, entity, state.mode)));",
    to: "      const carried = round(Math.min(household.resources[good] ?? 0, vehicleCarry(world, entity, state.mode)));",
  },
  // The ending (sim/ending.mjs).
  {
    name: 'the Scrape\'s prisoners weigh as they did before the owner weighed them more',
    file: 'sim/ending.mjs',
    from: 'export const PRISONER_WEIGHT = 1.5;',
    to: 'export const PRISONER_WEIGHT = 1;',
  },
];

const failing = output => [...output.matchAll(/^✖ (.+?) \(\d/gm)].map(match => match[1]).filter((name, i, all) => name !== 'failing tests:' && all.indexOf(name) === i);
const run = () => { const result = spawnSync(process.execPath, ['--test', ...FILES], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }); return failing(`${result.stdout}${result.stderr}`); };

const clean = run();
if (clean.length) throw new Error(`The tests fail before any injection: ${clean.join('; ')}`);
const record = [];
for (const injection of INJECTIONS) {
  const file = injection.file;
  const original = readFileSync(file, 'utf8');
  const CR = String.fromCharCode(13), LF = String.fromCharCode(10);
  const count = text => original.split(text).length - 1;
  // Written with LF; a file checked out with CRLF has the same lines with CR before each LF.
  const from = count(injection.from) === 1 ? injection.from : injection.from.split(LF).join(CR + LF);
  if (count(from) !== 1) throw new Error(`${injection.name}: the text to replace is in ${file} ${count(from)} times`);
  writeFileSync(file, original.replace(from, injection.to));
  let failed;
  try { failed = run(); } finally { writeFileSync(file, original); }
  record.push({ name: injection.name, file, failed });
  console.log(`${failed.length ? 'caught' : 'MISSED'}: ${injection.name} -> ${failed.join(' | ') || 'nothing failed'}`);
}
if (run().length) throw new Error('The tests fail after every file was put back');
mkdirSync('docs/evidence', { recursive: true });
writeFileSync('docs/evidence/crops-market-injections.json', `${JSON.stringify({ record: 'crops-market-injections', date: new Date().toISOString().slice(0, 10), files: FILES, injections: record }, null, 2)}\n`);
console.log(`\n${record.filter(r => r.failed.length).length} of ${record.length} caught; wrote docs/evidence/crops-market-injections.json`);
