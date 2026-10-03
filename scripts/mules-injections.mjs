// Injections for the mule bought in town (owner, 2026-10-03: "we should also add the ability to buy a mule in town. mules were a lot
// cheaper than horses."; docs/TOWNS.md §4h, sim/beasts.mjs). CLAUDE.md: "a new test is not evidence until it has failed". Each
// injection puts back one exact mistake, the mule's tests are run, and every file is restored. An injection is caught when every
// test it names fails; `only` says nothing else failed with it.
// Run: node scripts/mules-injections.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

// Since the owner's answers of the same day ("yes, but speed should adjust if it's too heavy. mules would be perfect for the carreta
// right though?"; the price "8"): the pull against the weight, tests/draught.test.mjs.
const FILES = ['tests/mules.test.mjs', 'tests/mules-drawn.test.mjs', 'tests/riding.test.mjs', 'tests/draught.test.mjs'];
const T = {
  price: 'the stock pens sell a mule for coin only, a lot cheaper than a horse',
  buy: "a mule bought is led home on a halter at its leader's pace and stands in the yard; nobody is offered the mule until then",
  ride: 'one rider at a time, slower than the horse, faster than walking; the next is told who has it',
  pack: 'the mule carries a pack the horse cannot: nine loads go on the mule, twelve want the wagon',
  lame: 'a mule lamed in a chase carries nobody until it mends, and the family is told it is lame',
  war: "a mule is no horse where the war asks for one, carries a seat on the family's road, and draws a vehicle only where no ox does better",
  pull: 'the pull against the weight: the ox as it always was, a mule quick with the carreta and slow with a laden wagon, a pair of mules well',
  muleWagon: 'a family with a mule and no ox takes its wagon behind the mule, quick out empty and slow home laden, and the card shows both',
  carreta: 'the carreta goes behind the mule, the wagon behind the ox, and a pair of mules draws the wagon together',
  company: "on the family's journey together a mule in harness carries nobody, and the train keeps the team's pace",
  flight: 'the flight east takes the mule with the rest, and the soldiers take it',
  drawn: "a mule is drawn as Claude's mule - standing, led on its halter, saddled under a rider - and never as an ox",
  saddle: 'somebody on the mule sits in its saddle, the mule under them and not drawn again beside them',
  ox: "the ox alone is yoked to a wagon: a mule on the wagon's road is not taken for its ox",
  seatArt: 'the page asks the seat for its own art, and gives the delivered rig its own height',
};
const INJECTIONS = [
  { name: 'the mule priced as a horse', expect: [T.price], file: 'sim/shops.mjs', from: 'export const MULE_COIN = 8;', to: 'export const MULE_COIN = 25;' },
  { name: 'the mule at ten, before the owner said eight', expect: [T.price], file: 'sim/shops.mjs', from: 'export const MULE_COIN = 8;', to: 'export const MULE_COIN = 10;' },
  { name: 'the mule offered for food, a wagon load carried to town', expect: [T.price], file: 'sim/shops.mjs',
    from: "id: 'mule', kind: 'sell', label: 'Buy a mule', coin: MULE_COIN, food: null,", to: "id: 'mule', kind: 'sell', label: 'Buy a mule', coin: MULE_COIN, food: 20," },
  { name: 'buying a mule brings home a horse', expect: [T.buy], file: 'sim/shops.mjs',
    from: "give: (world, household, entity) => boughtBeast(world, household, entity, 'mule'),", to: "give: (world, household, entity) => boughtBeast(world, household, entity, 'horse')," },
  { name: 'every family is offered the mule it has not got', expect: [T.buy], file: 'sim/travel.mjs',
    from: "needs: ['mule'], crossesFord: true, owned: true,", to: "needs: ['mule'], crossesFord: true, owned: false," },
  { name: 'a led mule holds its leader to the ox\'s pace', expect: [T.buy], file: 'sim/beasts.mjs',
    from: 'export const LEAD_PACE = Object.freeze({ ox: WAGON_SPEED,', to: 'export const LEAD_PACE = Object.freeze({ mule: WAGON_SPEED, ox: WAGON_SPEED,' },
  { name: 'the mule goes at the horse\'s pace', expect: [T.ride, T.buy], file: 'sim/travel.mjs', from: 'export const MULE_SPEED = 4 / 3;', to: 'export const MULE_SPEED = 5 / 3;' },
  { name: 'the mule is no thing one person at a time has', expect: [T.ride, T.muleWagon, T.carreta], file: 'sim/keeping.mjs',
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
  // The pull against the weight (sim/draught.mjs).
  { name: 'the ox slowed by a laden wagon (its pull short of the weight)', expect: [T.pull, T.carreta, T.war], file: 'sim/draught.mjs',
    from: '  ox: Object.freeze({ pace: WAGON_SPEED, pull: 30 }),', to: '  ox: Object.freeze({ pace: WAGON_SPEED, pull: 20 }),' },
  { name: 'the mule no quicker in harness than the ox', expect: [T.pull, T.muleWagon, T.carreta, T.company], file: 'sim/draught.mjs',
    from: '  mule: Object.freeze({ pace: 2.5 / 3, pull: 18 }),', to: '  mule: Object.freeze({ pace: WAGON_SPEED, pull: 18 }),' },
  { name: 'the load weighs nothing', expect: [T.pull, T.muleWagon, T.carreta, T.war], file: 'sim/draught.mjs',
    from: 'export const weightOf = (vehicle, load = loadOf(vehicle)) => VEHICLES[vehicleKind(vehicle)].weight + load;', to: 'export const weightOf = (vehicle, load = loadOf(vehicle)) => VEHICLES[vehicleKind(vehicle)].weight;' },
  { name: 'a mule draws nothing (only the ox, as before the owner\'s answer)', expect: [T.war, T.muleWagon, T.carreta, T.company], file: 'sim/draught.mjs',
    from: "export const DRAUGHT_ROLES = Object.freeze(['ox', 'mule']);", to: "export const DRAUGHT_ROLES = Object.freeze(['ox']);" },
  { name: 'no pair: one beast to a vehicle', expect: [T.carreta], file: 'sim/draught.mjs', from: 'export const TEAM_MOST = 2;', to: 'export const TEAM_MOST = 1;' },
  { name: 'the team chosen for the vehicle empty, so a lone mule takes the wagon from the ox', expect: [T.carreta], file: 'sim/keeping.mjs',
    from: '  const team = bestTeam(pool, vehicle || {}, loadOf(vehicle || {}, true));', to: '  const team = bestTeam(pool, vehicle || {}, load);' },
  { name: 'the family\'s vehicles take the first beast, not the best (the ox to the carreta)', expect: [T.company], file: 'sim/draught.mjs',
    from: '    const [one] = bestTeam(pool.filter(beast => !teams.some(team => team.team.includes(beast))), vehicle, loadFor(vehicle));', to: '    const one = pool.filter(beast => !teams.some(team => team.team.includes(beast)))[0];' },
  { name: 'the beasts in harness do not say what they draw', expect: [T.muleWagon], file: 'sim/world.mjs',
    from: ", ...(pace.length && { pace }), ...(draws && { draws }) };", to: ', ...(pace.length && { pace }) };' },
  { name: 'the laden wagon comes home at the empty pace', expect: [T.muleWagon], file: 'sim/world.mjs',
    from: "  const drawn = !riding && mode.id === 'wagon' ? teamFor(world, entity) : null;", to: "  const drawn = !riding && mode.id === 'wagon' ? teamFor(world, entity, { laden: false }) : null;" },
  { name: 'the way\'s card sends no pace for the bars', expect: [T.muleWagon], file: 'sim/going.mjs',
    from: '    ...(team && { mph: mph(speed), ...(laden < speed - 1e-9 && { ladenMph: mph(laden), heavy: `laden, ${mph(laden)} mph` }) }),\n', to: '' },
  { name: 'the card draws no laden bar', expect: [T.muleWagon], file: 'public/going.js',
    from: "      if (way.ladenMph) speed.append(bar(way.ladenMph, 'going-way-bar going-way-bar-laden', `laden ${way.ladenMph}`));\n", to: '' },
  { name: 'a mule in harness on the family\'s journey is given a rider', expect: [T.company], file: 'sim/company.mjs',
    from: 'const plan = seatPlan(people, vehicles, horses.filter(horse => !hitched.has(horse.id)));', to: 'const plan = seatPlan(people, vehicles, horses);' },
  { name: 'the family\'s train keeps the ox\'s pace behind a mule', expect: [T.company], file: 'sim/company.mjs',
    from: 'teams.length ? Math.min(...teams.map(team => team.pace)) : WAGON_SPEED);', to: 'WAGON_SPEED);' },
  { name: 'the page yokes the ox walking along, not the mule in harness', expect: [T.company], file: 'public/motion.js',
    from: '    team.ox = oxen.find(ox => !yoked.has(ox.id) && ox.travel.draws === team.wagon.id) || null;\n', to: '    team.ox = null;\n' },
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
    from: "const oxen = own.filter(entity => entity.kind === 'animal' && entity.travel?.mode === 'wagon' && (Boolean(entity.travel.draws) || !MOUNT_SPECIES.includes(entity.species)));",
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
