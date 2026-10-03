// Injections for the mule bought in town (owner, 2026-10-03: "we should also add the ability to buy a mule in town. mules were a lot
// cheaper than horses."; docs/TOWNS.md §4h, sim/beasts.mjs). CLAUDE.md: "a new test is not evidence until it has failed". Each
// injection puts back one exact mistake, the mule's tests are run, and every file is restored. An injection is caught when every
// test it names fails; `only` says nothing else failed with it.
// Run: node scripts/mules-injections.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const FILES = ['tests/mules.test.mjs', 'tests/mules-drawn.test.mjs', 'tests/riding.test.mjs'];
const T = {
  price: 'the stock pens sell a mule for coin only, a lot cheaper than a horse',
  buy: "a mule bought is led home on a halter at its leader's pace and stands in the yard; nobody is offered the mule until then",
  ride: 'one rider at a time, slower than the horse, faster than walking; the next is told who has it',
  pack: 'the mule carries a pack the horse cannot: nine loads go on the mule, twelve want the wagon',
  lame: 'a mule lamed in a chase carries nobody until it mends, and the family is told it is lame',
  war: "a mule is no horse where the war asks for one, carries a seat on the family's road, and draws no wagon",
  flight: 'the flight east takes the mule with the rest, and the soldiers take it',
  drawn: "a mule is drawn as Claude's mule - standing, led on its halter, saddled under a rider - and never as an ox",
  saddle: 'somebody on the mule sits in its saddle, the mule under them and not drawn again beside them',
  ox: "the ox alone is yoked to a wagon: a mule on the wagon's road is not taken for its ox",
  seatArt: 'the page asks the seat for its own art, and gives the delivered rig its own height',
};
const INJECTIONS = [
  { name: 'the mule priced as a horse', expect: [T.price], file: 'sim/shops.mjs', from: 'export const MULE_COIN = 10;', to: 'export const MULE_COIN = 25;' },
  { name: 'the mule offered for food, a wagon load carried to town', expect: [T.price], file: 'sim/shops.mjs',
    from: "id: 'mule', kind: 'sell', label: 'Buy a mule', coin: MULE_COIN, food: null,", to: "id: 'mule', kind: 'sell', label: 'Buy a mule', coin: MULE_COIN, food: 20," },
  { name: 'buying a mule brings home a horse', expect: [T.buy], file: 'sim/shops.mjs',
    from: "give: (world, household, entity) => boughtBeast(world, household, entity, 'mule'),", to: "give: (world, household, entity) => boughtBeast(world, household, entity, 'horse')," },
  { name: 'every family is offered the mule it has not got', expect: [T.buy], file: 'sim/travel.mjs',
    from: "needs: ['mule'], crossesFord: true, owned: true,", to: "needs: ['mule'], crossesFord: true, owned: false," },
  { name: 'a led mule holds its leader to the ox\'s pace', expect: [T.buy], file: 'sim/beasts.mjs',
    from: 'export const LEAD_PACE = Object.freeze({ ox: WAGON_SPEED,', to: 'export const LEAD_PACE = Object.freeze({ mule: WAGON_SPEED, ox: WAGON_SPEED,' },
  { name: 'the mule goes at the horse\'s pace', expect: [T.ride, T.buy], file: 'sim/travel.mjs', from: 'export const MULE_SPEED = 4 / 3;', to: 'export const MULE_SPEED = 5 / 3;' },
  { name: 'the mule is no thing one person at a time has', expect: [T.ride], file: 'sim/keeping.mjs',
    from: "export const ROLES = Object.freeze(['horse', 'mule', 'ox', 'wagon']);", to: "export const ROLES = Object.freeze(['horse', 'ox', 'wagon']);" },
  { name: 'the mule carries no more than the horse', expect: [T.pack, T.buy], file: 'sim/travel.mjs',
    from: "id: 'mule', name: 'On the mule', speed: MULE_SPEED, carry: 10,", to: "id: 'mule', name: 'On the mule', speed: MULE_SPEED, carry: 7," },
  { name: 'the errand does not say why the mule and not the horse', expect: [T.pack], file: 'sim/errands.mjs',
    from: "        : open.id === 'mule' && load > MODES.horse.carry ? `, more than the horse carries (${MODES.horse.carry})`\n", to: '' },
  { name: 'a lamed mule is ridden (only a horse was ever lame)', expect: [T.lame], file: 'sim/keeping.mjs',
    from: "!((role === 'horse' || role === 'mule') && lame(world, beast))", to: "!(role === 'horse' && lame(world, beast))" },
  { name: 'a lame mule in the yard is "not here"', expect: [T.lame], file: 'sim/world.mjs',
    from: "    if (free.length && free.every(beast => lame(world, beast) && beast.location?.siteId === entity.location?.siteId)) return { can: false, why: `The ${NOUN[role]} is lame and carries nobody until it mends.` };\n", to: '' },
  { name: 'the family\'s journey together seats nobody on the mule', expect: [T.war, T.lame], file: 'sim/company.mjs',
    from: 'movers.filter(entity => isMount(entity) &&', to: "movers.filter(entity => entity?.species === 'horse' &&" },
  { name: 'a mule is a horse to the scouts, the Grass Fight and Horton', expect: [T.war], file: 'sim/keeping.mjs',
    from: "export const ridesAHorse = (world, entity) => modeWith(world, entity) === 'horse';", to: "export const ridesAHorse = (world, entity) => modeWith(world, entity) !== 'foot';" },
  { name: 'a mule draws the wagon as an ox (every animal not a horse was an ox)', expect: [T.war], file: 'sim/company.mjs',
    from: 'const oxen = movers.filter(entity => isOx(entity) &&', to: "const oxen = movers.filter(entity => entity.kind === 'animal' && entity.species !== 'horse' &&" },
  { name: 'the flight leaves the mule at home', expect: [T.flight], file: 'sim/scrape.mjs',
    from: 'const beasts = (world, household) => BEAST_ROLES.flatMap(role => beastsOf(world, household, role));', to: "const beasts = (world, household) => ['horse', 'ox', 'wagon'].flatMap(role => beastsOf(world, household, role));" },
  { name: 'the page draws the mule as an ox', expect: [T.drawn], file: 'public/motion.js',
    from: "    if (entity.species === 'mule') {\n      const walk = entity.travel?.mode === 'mule'", to: "    if (false) {\n      const walk = entity.travel?.mode === 'mule'" },
  { name: 'somebody on the mule is drawn walking', expect: [T.saddle], file: 'public/motion.js',
    from: " || entity.travel?.mode === 'mule' || (Boolean(entity.travel?.saddle)", to: ' || (Boolean(entity.travel?.saddle)' },
  { name: 'the ridden mule is drawn again beside its rider', expect: [T.saddle], file: 'public/motion.js',
    from: "export const underARider = entity => entity.kind === 'animal' && MOUNT_SPECIES.includes(entity.species) && entity.travel?.mode === entity.species;",
    to: "export const underARider = entity => entity.kind === 'animal' && entity.species === 'horse' && entity.travel?.mode === 'horse';" },
  { name: 'the mule the family seated somebody on is not found under them', expect: [T.saddle], file: 'public/motion.js',
    from: '\n    || (entity?.travel?.saddle && own.find(other => other.id === entity.travel.rides)) || null;', to: '\n    || null;' },
  { name: 'a mule on the wagon\'s road is yoked to it', expect: [T.ox], file: 'public/motion.js',
    from: "const oxen = own.filter(entity => entity.kind === 'animal' && !MOUNT_SPECIES.includes(entity.species) && entity.travel?.mode === 'wagon');",
    to: "const oxen = own.filter(entity => entity.kind === 'animal' && entity.species !== 'horse' && entity.travel?.mode === 'wagon');" },
  { name: 'a rider on the mule is drawn on the painted chestnut horse', expect: [T.seatArt], file: 'public/app.js',
    from: 'const ready = !entity.appearance && !onMule && Boolean(', to: 'const ready = !entity.appearance && Boolean(' },
];
const failing = output => [...output.matchAll(/^✖ (.+?) \(\d/gm)].map(match => match[1]).filter((name, index, all) => all.indexOf(name) === index);
const run = () => { try { execFileSync(process.execPath, ['--test', ...FILES], { encoding: 'utf8', stdio: 'pipe' }); return []; } catch (error) { return failing(`${error.stdout}`); } };

const baseline = run();
if (baseline.length) throw new Error(`the tests fail before any injection: ${baseline.join('; ')}`);
const results = [];
for (const injection of INJECTIONS) {
  const text = readFileSync(injection.file, 'utf8'), crlf = text.includes('\r\n'), plain = crlf ? text.replace(/\r\n/g, '\n') : text;
  if (!plain.includes(injection.from)) throw new Error(`${injection.name}: not found`);
  const changed = plain.replace(injection.from, injection.to);
  try {
    writeFileSync(injection.file, crlf ? changed.replace(/\n/g, '\r\n') : changed);
    const failed = run();
    const caught = injection.expect.every(name => failed.includes(name));
    const only = caught && failed.every(name => injection.expect.includes(name));
    results.push({ injection: injection.name, caught, only, failed });
    console.log(`${caught ? (only ? 'CAUGHT' : 'CAUGHT (and more)') : 'MISSED'}: ${injection.name} -> ${failed.join(' | ')}`);
  } finally { writeFileSync(injection.file, text); }
}
mkdirSync('docs/evidence', { recursive: true });
writeFileSync('docs/evidence/mules-injections.json', `${JSON.stringify({ date: new Date().toISOString().slice(0, 10), files: FILES, caught: results.filter(r => r.caught).length, only: results.filter(r => r.only).length, of: results.length, results }, null, 2)}\n`);
console.log(`${results.filter(r => r.caught).length} of ${results.length} caught, ${results.filter(r => r.only).length} by their own test alone`);
