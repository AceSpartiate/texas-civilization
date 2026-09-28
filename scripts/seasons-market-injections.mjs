// The regressions tests/seasons.test.mjs and tests/market.test.mjs guard, injected one at a time (CLAUDE.md: "A new test is not
// evidence until it has failed"). Each injection replaces one exact piece of sim/seasons.mjs, sim/market.mjs, sim/chores.mjs,
// sim/lesson.mjs or sim/errands.mjs with the mistake a test is written against, runs the two test files, records which tests
// failed, and puts the file back byte for byte.
//
// Run: node scripts/seasons-market-injections.mjs  → writes docs/evidence/seasons-market-injections.json
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { LESSON_ENABLED } from '../sim/lesson.mjs';

const FILES = ['tests/seasons.test.mjs', 'tests/market.test.mjs'];
const INJECTIONS = [
  // The farming year (sim/seasons.mjs).
  {
    name: 'a crop ripens in eighteen ticks on the real land too, as it did before the seasons',
    file: 'sim/seasons.mjs',
    from: '  return at === null ? world.tick - field.changedTick >= RIPEN_TICKS : world.minute >= at;',
    to: '  return world.tick - field.changedTick >= RIPEN_TICKS;',
  },
  {
    name: 'every crop is in season all year on the real land',
    file: 'sim/seasons.mjs',
    from: "  if (!seasonal(world)) return crop !== 'garden';",
    to: '  return true;',
  },
  {
    name: 'a crop sown in a class saved before the seasons never comes in (no sown minute read as sown at nothing)',
    file: 'sim/seasons.mjs',
    from: '  if (!seasonal(world) || !Number.isFinite(field?.sownMinute)) return null;',
    to: '  if (!seasonal(world)) return null;',
  },
  {
    name: "a save may hold a crop the game does not grow",
    file: 'sim/seasons.mjs',
    from: "  if (!field || !['bare', 'planted', 'ripe'].includes(field.state) || !CROPS[field.crop]) return 'Invalid field state';",
    to: "  if (!field || !['bare', 'planted', 'ripe'].includes(field.state)) return 'Invalid field state';",
  },
  {
    name: 'the garden is never the silent answer: silence tries only the family\'s own crop and the other',
    file: 'sim/seasons.mjs',
    from: "  return [own, 'garden', other].filter(crop => cropsOffered(world).includes(crop));",
    to: "  return [own, other, 'garden'].filter(crop => cropsOffered(world).includes(crop)).slice(0, 2);",
  },
  // Planting and the harvest (sim/chores.mjs).
  {
    name: 'planting a garden forgets the crop the family came meaning to grow',
    file: 'sim/chores.mjs',
    from: "      const own = step.crop === 'garden' ? (household.field?.own || (household.field?.crop !== 'garden' ? household.field?.crop : null) || 'corn') : null;",
    to: '      const own = null;',
  },
  {
    name: 'the answer at the rows is not checked against the season',
    file: 'sim/chores.mjs',
    from: '      { test: (household, world) => !world || inSeason(world, crop), why: () => seasonWhy(crop) },',
    to: '',
  },
  {
    name: 'a planter who finds no crop open at the rows falls to the first answer and plants it, out of season or without seed',
    file: 'sim/chores.mjs',
    from: '  const chosen = ask.options.find(candidate => candidate.id === option) || (option === \'leave\' && ASKS[ask.id]?.noneOpen) || ask.options[0];',
    to: '  const chosen = ask.options.find(candidate => candidate.id === option) || ask.options[0];',
  },
  // The guided start (sim/lesson.mjs): only while it is switched on - its test is skipped while the owner has it off (2026-09-28).
  ...(LESSON_ENABLED ? [{
    name: 'the guided start waits at the harvest step for a crop weeks off',
    file: 'sim/lesson.mjs',
    from: '    done: (world, household) => harvested(household) || growing(world, household),',
    to: '    done: (world, household) => harvested(household),',
  }] : []),
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
writeFileSync('docs/evidence/seasons-market-injections.json', `${JSON.stringify({ record: 'seasons-market-injections', date: new Date().toISOString().slice(0, 10), files: FILES, injections: record }, null, 2)}\n`);
console.log(`\n${record.filter(r => r.failed.length).length} of ${record.length} caught; wrote docs/evidence/seasons-market-injections.json`);
