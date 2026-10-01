// The regressions the family's start (owner, 2026-09-29; sim/starts.mjs, sim/tejano.mjs, sim/start-story.mjs) is guarded against,
// injected one at a time (CLAUDE.md: "A new test is not evidence until it has failed"). Each injection replaces exact text with the
// mistake a test is written against, runs tests/starts.test.mjs, records which tests failed - the one written for it is named in
// `expect` and must be among them - and puts every file back byte for byte.
//
// The last three tests play a class to the spring (about a minute and a half), so an injection that cannot reach them (`spring`
// false) runs the file with them skipped; one that can runs the whole file.
//
// Run: node scripts/starts-injections.mjs → docs/evidence/starts-injections.json
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const FILES = ['tests/starts.test.mjs', 'tests/starts-bexar.test.mjs'];
const T = {
  deal: 'a class that deals starts seats Victoria, whose families are Tejano; one of Liberty\'s is free Black from ten families; the first of each is among the first six to join',
  sides: 'moving a start early exchanges only two families on the same side of the burn zone, and keeps every family\'s land',
  old: 'a class made without starts deals none and offers every tone, as before; its names are of each family\'s place',
  tones: 'each start\'s parents are offered only its skin tones, dealt within them, refused outside them, and a tone outside them does not open',
  children: 'children take a tone between their parents, so inside the start\'s range',
  names: 'names are dealt from the start\'s own pools, and a Tejano family plants corn',
  spouse: 'a lone parent\'s new husband or wife is of the family\'s start: tone, name and the family they come from',
  seen: 'the start is on the family\'s own book only: not on the tick, and not on another family\'s page',
  law: 'the start\'s story is told once, at its moment: the law to a free Black family only, and the ending\'s last line',
  readers: 'only the start\'s own modules read a family\'s start: no price, trade, work, fate or director does',
  valid: 'a company or a told line that could not have been does not open',
  autumn: 'a Tejano family\'s man rides with Seguín\'s company in the autumn, and is told what it did and that it went home',
  spring: 'in the spring a Tejano family\'s man may join Seguín\'s company in Houston\'s army, and nobody else\'s may',
  road: 'on the road east a family passes enslaved people, drawn where it is and told once, and hears of escapes at a crossing',
};
const SPRING = [T.autumn, T.spring, T.road];
const DOWNRIVER_TEST = 'the rancho lies down the San Antonio River toward Goliad only, on every seed tried, never above the town or beside it';
const S = 'sim/starts.mjs', STORY = 'sim/start-story.mjs', J = 'sim/tejano.mjs', A = 'sim/appearance.mjs', W = 'sim/world.mjs', C = 'sim/courtship.mjs';

const INJECTIONS = [
  // ------------------------------------------------------------------------------------------------ the deal
  { name: 'Victoria is not seated: a class of five has no Tejano family', expect: T.deal, edits: [
    { file: S, from: '  if (families < BEXAR_FROM) return dealCounts(families, STARTS_SEATED);', to: '  if (families < BEXAR_FROM) return dealCounts(families);' }] },
  { name: 'Victoria\'s families are dealt as Anglo-American', expect: T.deal, edits: [
    { file: S, from: "  const starts = places.map(place => (TEJANO_PLACES.includes(place.settlementId) ? 'tejano' : 'anglo'));", to: "  const starts = places.map(() => 'anglo');" }] },
  { name: 'a class smaller than ten is dealt a free Black family', expect: T.deal, edits: [
    { file: S, from: '  if (places.length >= FREE_BLACK_FROM && liberty.length >= 2) ', to: '  if (liberty.length >= 1) ' }] },
  { name: 'the starts are left where the deal put them, often past the families students join', expect: T.deal, edits: [
    { file: S, from: '    if (at < 0 || at < EARLY) continue;', to: '    continue;' }] },
  { name: 'a start is moved early across the burn zone', expect: T.sides, edits: [
    { file: S, from: "if (starts[i] === 'anglo' && side(i) === side(at)) early.push(i);", to: "if (starts[i] === 'anglo') early.push(i);" }] },
  { name: 'every class deals starts, a class made before too', expect: T.old, edits: [
    { file: W, from: 'buildColoniesRegion(random, playerCount, { zone: zoneDeal, starts })', to: 'buildColoniesRegion(random, playerCount, { zone: zoneDeal, starts: true })' }] },
  // ------------------------------------------------------------------------------------------------ the tones
  { name: 'every tone is offered to every family', expect: T.tones, edits: [
    { file: A, from: 'export const choicesFor = (entity, world = null) => ({ skin: skinChoices(heritageOf(world, entity)),', to: 'export const choicesFor = (entity, world = null) => ({ skin: SKIN,' }] },
  { name: 'the default tone is dealt from every tone', expect: T.tones, edits: [
    { file: A, from: "    skin: chosen.skin ?? pick(skinChoices(heritageOf(world, entity)), key('skin')),", to: "    skin: chosen.skin ?? pick(SKIN, key('skin'))," }] },
  { name: 'the free Black range runs from the fairest tone', expect: T.tones, edits: [
    { file: S, from: "  'free-black': Object.freeze(['olive', 'deep brown']),", to: "  'free-black': Object.freeze(['fair', 'deep brown'])," }] },
  { name: 'a child is dealt any tone, not one between the parents', expect: T.children, edits: [
    { file: A, from: "    skin: SKIN[lo + (hash(key('skin')) % (hi - lo + 1))],", to: "    skin: SKIN[hash(key('skin')) % SKIN.length]," }] },
  // ------------------------------------------------------------------------------------------------ names, corn, the spouse
  { name: 'the names ignore the start', expect: T.names, edits: [
    { file: 'sim/family.mjs', from: '  const pools = poolsFor(named);', to: '  const pools = NAME_POOLS;' }] },
  // The names of a class with no starts are of each family's place (owner, 2026-10-01; tests/names-by-start.test.mjs as well).
  { name: 'a family of a class with no starts is named Anglo-American at Victoria too', expect: T.old, edits: [
    { file: S, from: "export const namingOf = household => household?.heritage || (TEJANO_PLACES.includes(household?.settlementId) ? 'tejano' : 'anglo');", to: "export const namingOf = household => household?.heritage || 'anglo';" }] },
  { name: 'a Tejano family plants cotton', expect: T.names, edits: [
    { file: W, from: "    const crop = region.heritages?.[i - 1] === 'tejano' ? 'corn' : drawn;", to: '    const crop = drawn;' }] },
  { name: 'the spouse\'s family is dealt any tone', expect: T.spouse, edits: [
    { file: C, from: 'appearance: looksFor(`${key}:${id}`, sex, years, skinChoices(of)) };', to: 'appearance: looksFor(`${key}:${id}`, sex, years) };' }] },
  { name: 'the spouse is named from the mixed pools', expect: T.spouse, edits: [
    { file: C, from: '  const given = nameFrom(role, `${world.seed}:${id}:name`, taken, poolsFor(namingOf(household)));', to: "  const given = nameFrom(role, `${world.seed}:${id}:name`, taken, poolsFor('tejano'));" }] },
  { name: 'a Tejano spouse is born to any family of the colonies', expect: T.spouse, edits: [
    { file: C, from: "  if (heritage === 'tejano') return { first: TEJANO_NEIGHBOURS, second: TEJANO_NEIGHBOURS };", to: "  if (heritage === 'tejano') return { first: TEJANO_NEIGHBOURS, second: NEIGHBOUR_FAMILIES };" }] },
  // ------------------------------------------------------------------------------------------------ knowledge, the law, the ending
  { name: 'the start rides on every tick', expect: T.seen, edits: [
    { file: W, from: '  delete shown.heritage;\n', to: '' }] },
  { name: 'the law is told again every tick', expect: T.law, edits: [
    { file: STORY, from: '      if (told(world, household.id, word.key) || world.minute < minuteOn(world, word.on)) continue;', to: '      if (world.minute < minuteOn(world, word.on)) continue;' }] },
  { name: 'the law is told to every family', expect: T.law, edits: [
    { file: STORY, from: "    if (household.heritage !== 'free-black') continue;\n", to: '' }] },
  { name: 'the law is told before its day', expect: T.law, edits: [
    { file: STORY, from: '      if (told(world, household.id, word.key) || world.minute < minuteOn(world, word.on)) continue;', to: '      if (told(world, household.id, word.key)) continue;' }] },
  { name: 'the ending says nothing of afterwards', expect: T.law, edits: [
    { file: 'sim/ending.mjs', from: '    afterWords(world, household),\n', to: '' }] },
  { name: 'the market reads a family\'s start', expect: T.readers, edits: [
    { file: 'sim/market.mjs', from: "import ", to: "const startOf = household => household?.heritage;\nimport " }] },
  { name: 'an Anglo family\'s man can be marked Seguín\'s and the class still opens', expect: T.valid, edits: [
    { file: J, from: "    if (!COMPANIES.includes(entity.company) || entity.kind !== 'person' || !seguinFamily(world, world.households[entity.householdId])) return 'Invalid company';", to: "    if (!COMPANIES.includes(entity.company)) return 'Invalid company';" }] },
  // ------------------------------------------------------------------------------------------------ Seguín's company (the spring class)
  { name: 'a Tejano man is asked as any volunteer, with no word of Seguín', expect: T.autumn, spring: true, edits: [
    { file: 'sim/calls.mjs', from: "    offer('turn-out', seguin ? SEGUIN_CALL.label(place) :", to: "    offer('turn-out', false ? SEGUIN_CALL.label(place) :" }] },
  { name: 'turning out does not make him Seguín\'s', expect: T.autumn, spring: true, edits: [
    { file: 'sim/calls.mjs', from: '  if (seguin) joinSeguin(entity);\n', to: '' }] },
  { name: 'the family is never told of the Salado', expect: T.autumn, spring: true, edits: [
    { file: J, from: "      if (milestones.detachment && !milestones['bexar-end']", to: "      if (false && milestones.detachment && !milestones['bexar-end']" }] },
  { name: 'Seguín\'s company is put in front of every family\'s men', expect: T.spring, spring: true, edits: [
    { file: J, from: '    offered: (world, household) => seguinFamily(world, household),', to: '    offered: () => true,' }] },
  { name: 'joining Seguín\'s company in the spring does not mark him Seguín\'s', expect: T.spring, spring: true, edits: [
    { file: J, from: '      { run: (world, household, entity) => { joinSeguin(entity); } },', to: '      { run: () => {} },' }] },
  // ------------------------------------------------------------------------------------------------ the road east (the spring class)
  { name: 'the halted wagons are drawn on every family\'s page', expect: T.road, spring: true, edits: [
    { file: STORY, from: '      if (id !== householdId) continue;\n', to: '' }] },
  { name: 'a family is told of the halted wagons again and again', expect: T.road, spring: true, edits: [
    { file: STORY, from: "    if (!told(world, household.id, 'road') && !flight.crossing && ", to: '    if (!flight.crossing && ' }] },
  { name: 'nobody waiting at a crossing sees the people waiting there', expect: T.road, spring: true, edits: [
    { file: STORY, from: '    if (!host && !families.includes(householdId)) continue;', to: '    if (!host) continue;' }] },
  // ------------------------------------------------------------------------------------------------ the owner's answers of 2026-09-29/30
  { answers: true },
  { name: 'every family is married by bond', expect: "a Tejano family is married by the priest from La Bahía; an Anglo-American or a free Black family by bond", edits: [
    { file: 'sim/courtship.mjs', from: "export const riteFor = household => (household?.heritage === 'tejano' ? 'priest' : 'bond');", to: "export const riteFor = () => 'bond';" }] },
  { name: 'the priest\'s wedding is told as the bond', expect: "a Tejano family is married by the priest from La Bahía; an Anglo-American or a free Black family by bond", edits: [
    { file: 'sim/courtship.mjs', from: "    text: path.rite === 'priest'\n      ? `The ${one.plural}", to: "    text: false\n      ? `The ${one.plural}" }] },
  { name: 'no family is dealt near Béxar', expect: "from twenty families one family is Tejano, on a rancho near Béxar: inside the burn zone, off the missions, early to join, with a store in town", file: 'tests/starts-bexar.test.mjs', edits: [
    { file: 'sim/starts.mjs', from: '  return { ...dealCounts(families - 1, STARTS_SEATED), [BEXAR_AT]: 1 };', to: '  return dealCounts(families, STARTS_SEATED);' }] },
  { name: 'the family near Béxar is dealt outside the burn zone', expect: "from twenty families one family is Tejano, on a rancho near Béxar: inside the burn zone, off the missions, early to join, with a store in town", file: 'tests/starts-bexar.test.mjs', edits: [
    { file: 'sim/colonies-region.mjs', from: '    if (room[BEXAR_AT]) room[BEXAR_AT] = { in: ground[BEXAR_AT].in.length ? 1 : 0, out: 0 };', to: '    if (room[BEXAR_AT]) room[BEXAR_AT] = { in: 0, out: 1 };' }] },
  { name: 'land by the missions is taken for the Béxar family', expect: "from twenty families one family is Tejano, on a rancho near Béxar: inside the burn zone, off the missions, early to join, with a store in town", file: 'tests/starts-bexar.test.mjs', edits: [
    { file: 'sim/starts.mjs', from: '  || MISSION_OFFSETS.every(', to: '  || true || MISSION_OFFSETS.every(' }] },
  { name: 'the family near Béxar is dealt as Anglo-American', expect: "from twenty families one family is Tejano, on a rancho near Béxar: inside the burn zone, off the missions, early to join, with a store in town", file: 'tests/starts-bexar.test.mjs', edits: [
    { file: 'sim/starts.mjs', from: 'export const TEJANO_PLACES = Object.freeze([TEJANO_AT, BEXAR_AT]);', to: 'export const TEJANO_PLACES = Object.freeze([TEJANO_AT]);' }] },
  { name: 'Béxar has no store', expect: "from twenty families one family is Tejano, on a rancho near Béxar: inside the burn zone, off the missions, early to join, with a store in town", file: 'tests/starts-bexar.test.mjs', edits: [
    { file: 'sim/town.mjs', from: "  bexar: { name: 'Josefa Quintanilla', pronoun: 'she', round: [{ x: .12, y: .10 }, { x: .02, y: .04 }, { x: .16, y: .02 }] },\n", to: '' }] },
  { name: 'every family is told the war at Béxar\'s door', expect: "a family near Béxar is told what it hears of the war at its door, once each, at its moment, and nobody else is", file: 'tests/starts-bexar.test.mjs', edits: [
    { file: 'sim/start-story.mjs', from: "    if (household.settlementId !== 'bexar' || household.flight) continue;", to: '    if (household.flight) continue;' }] },
  { name: 'the Béxar family is told each line again and again', expect: "a family near Béxar is told what it hears of the war at its door, once each, at its moment, and nobody else is", file: 'tests/starts-bexar.test.mjs', edits: [
    { file: 'sim/start-story.mjs', from: '      if (told(world, household.id, word.key)) continue;\n      const from = word.at', to: '      const from = word.at' }] },
  { name: 'the Béxar family does not know of the Alamo\'s fall till the express', expect: "a family near Béxar is told what it hears of the war at its door, once each, at its moment, and nobody else is", file: 'tests/starts-bexar.test.mjs', edits: [
    { file: 'sim/start-story.mjs', from: "        learn(world, household.id, 'alamo-fall', {", to: "        if (false) learn(world, household.id, 'alamo-fall', {" }] },
  { name: 'the Béxar family\'s ending is De León\'s colony\'s', expect: "a family near Béxar is told what it hears of the war at its door, once each, at its moment, and nobody else is", file: 'tests/starts-bexar.test.mjs', edits: [
    { file: 'sim/start-story.mjs', from: "  if (household?.heritage === 'tejano' && household.settlementId === 'bexar') return BEXAR_AFTER;\n", to: '' }] },
  { name: 'Seguín\'s call is answered at a gathering place that is not the family\'s land', expect: "a family near Béxar is asked by Seguín from its own land when the army comes near, and its man rides from home to the army", file: 'tests/starts-bexar.test.mjs', edits: [
    { file: 'sim/calls.mjs', from: '    home: true,\n    afterArmy:', to: '    afterArmy:' }] },
  { name: 'a man who answered Seguín at home never sets out after the army', expect: "a family near Béxar is asked by Seguín from its own land when the army comes near, and its man rides from home to the army", file: 'tests/starts-bexar.test.mjs', edits: [
    { file: 'sim/army.mjs', from: '      if (!FOLLOW_FROM.includes(at) && !again && !fromHome) continue;', to: '      if (!FOLLOW_FROM.includes(at) && !again) continue;' }] },
  { name: 'the word to leave near Béxar says the Mexican army is coming', expect: "near Béxar the word to leave comes from Seguín\'s men, and a rancho left in a rush is burned by Santa Anna\'s foragers, not the Texas army", file: 'tests/starts-bexar.test.mjs', edits: [
    { file: 'sim/scrape.mjs', from: '${SETTLEMENT_DAYS[settlementOf(household)]?.word || ', to: '${false || ' }] },
  { name: 'the Texas army burns a rancho near Béxar', expect: "near Béxar the word to leave comes from Seguín\'s men, and a rancho left in a rush is burned by Santa Anna\'s foragers, not the Texas army", file: 'tests/starts-bexar.test.mjs', edits: [
    { file: 'sim/scrape.mjs', from: "  const mexican = settlementOf(household) === 'bexar';", to: '  const mexican = false;' }] },
  { name: 'the rancho hears the bell only within three miles', expect: "near Béxar the word to leave comes from Seguín\'s men, and a rancho left in a rush is burned by Santa Anna\'s foragers, not the Texas army", file: 'tests/starts-bexar.test.mjs', edits: [
    { file: 'sim/surprise.mjs', from: '      || (world.households[person.householdId]?.settlementId === BEXAR && ', to: '      || (false && ' }] },
  { name: 'a Tejano man in the garrison is not one of Seguín\'s men', expect: "a Tejano man in the winter garrison is with Seguín\'s men, and on the night of February 25 rides out of the Alamo with Seguín", file: 'tests/starts-bexar.test.mjs', edits: [
    { file: 'sim/tejano.mjs', from: '      if (person.company !== SEGUIN) joinSeguin(person);\n', to: '' }] },
  { name: 'nobody rides out with Seguín', expect: "a Tejano man in the winter garrison is with Seguín\'s men, and on the night of February 25 rides out of the Alamo with Seguín", file: 'tests/starts-bexar.test.mjs', edits: [
    { file: 'sim/directors.mjs', from: "if (day === 'courier-2') seguinRidesOut(", to: 'if (false) seguinRidesOut(' }] },
  { name: 'the Alamo\'s word calls him a courier with Travis\'s letters', expect: "a Tejano man in the winter garrison is with Seguín\'s men, and on the night of February 25 rides out of the Alamo with Seguín", file: 'tests/starts-bexar.test.mjs', edits: [
    { file: 'sim/alamo.mjs', from: 'text = person.service.withSeguin ? seguinOutWords(person.name) : ', to: 'text = ' }] },
  { name: 'a Tejano woman in the Alamo rides out with Seguín', expect: "a woman of a Tejano family shut in the Alamo is not made one of Seguín\'s men and does not ride out with him", file: 'tests/starts-bexar.test.mjs', edits: [
    { file: 'sim/tejano.mjs', from: ' || person.service.relief || !canFight(person)) continue;', to: ' || person.service.relief) continue;' }] },
  { name: 'a poor Tejano family comes with a cart', expect: "a Tejano family of the poorest means comes with a carreta, drawn as Astra\'s carreta, that carries as the cart does", file: 'tests/starts-bexar.test.mjs', edits: [
    { file: 'sim/means.mjs', from: "  if (band.cart && wagon && household.heritage === 'tejano') {", to: '  if (false) {' }] },
  { name: 'the carreta is drawn as a cart', expect: "a Tejano family of the poorest means comes with a carreta, drawn as Astra\'s carreta, that carries as the cart does", file: 'tests/starts-bexar.test.mjs', edits: [
    { file: 'sim/world.mjs', from: "...((e.carreta || e.style === 'carreta') && { carreta: true })", to: '...(e.carreta && { carreta: true })' }] },
  { name: 'the pack screen calls the carreta a cart', expect: "a Tejano family of the poorest means comes with a carreta, drawn as Astra\'s carreta, that carries as the cart does", file: 'tests/starts-bexar.test.mjs', edits: [
    { file: 'sim/wagon.mjs', from: "(household.heritage === 'tejano' ? 'carreta' : 'cart')", to: "'cart'" }] },
  { name: 'an Anglo family\'s cart may be drawn as a carreta', expect: "a Tejano family of the poorest means comes with a carreta, drawn as Astra\'s carreta, that carries as the cart does", file: 'tests/starts-bexar.test.mjs', edits: [
    { file: 'sim/means.mjs', from: " || world.households[entity.householdId]?.heritage !== 'tejano')) return 'Invalid cart';", to: ")) return 'Invalid cart';" }] },
  // ------------------------------------------------------------------------------------------------ "Downriver only" (owner, 2026-09-30)
  { name: 'the rancho may lie anywhere round Béxar', downriver: true, expect: DOWNRIVER_TEST, file: 'tests/starts-bexar.test.mjs', edits: [
    { file: S, from: '  || (downriver(at, settlement) && MISSION_OFFSETS.every(', to: '  || (MISSION_OFFSETS.every(' }] },
  { name: 'the rancho is measured up the river, away from Goliad', downriver: true, expect: DOWNRIVER_TEST, file: 'tests/starts-bexar.test.mjs', edits: [
    { file: S, from: 'const dx = 5.3 - -61.63, dy = 58.09 - 4.6,', to: 'const dx = -61.63 - 5.3, dy = 4.6 - 58.09,' }] },
  { name: 'the rancho may lie by the town itself, not down the river', downriver: true, expect: DOWNRIVER_TEST, file: 'tests/starts-bexar.test.mjs', edits: [
    { file: S, from: 'export const DOWNRIVER_FROM = 3;', to: 'export const DOWNRIVER_FROM = -12;' }] },
  { name: 'with no rancho the seat goes to the wrong colony', downriver: true, expect: DOWNRIVER_TEST, file: 'tests/starts-bexar.test.mjs', edits: [
    { file: S, from: '  return Object.keys(all).find(id => all[id] > (fewer[id] || 0));', to: "  return 'gonzales';" }] },
  { name: 'words are put in their mouths', expect: T.road, spring: true, edits: [
    { file: STORY, from: "  return { id, kind: 'enslaved', people, pairs: [] };", to: "  return { id, kind: 'enslaved', people, pairs: [{ key: id, ids: [people[0].id, people[1].id], talking: true }] };" }] },
];

const failing = output => [...output.matchAll(/^✖ (.+?) \(\d/gm)].map(match => match[1]).filter((name, i, all) => name !== 'failing tests:' && all.indexOf(name) === i);
// Each injection runs the one file its test is in (the owner's answers are tests/starts-bexar.test.mjs), the clean runs both.
const runTests = (spring = true, files = FILES) => {
  const skip = spring ? [] : SPRING.flatMap(name => ['--test-skip-pattern', name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')]);
  const result = spawnSync(process.execPath, ['--test', ...skip, ...files], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  return failing(`${result.stdout}${result.stderr}`);
};

const clean = runTests();
if (clean.length) throw new Error(`The tests fail before any injection: ${clean.join('; ')}`);
const record = [];
const CR = String.fromCharCode(13), LF = String.fromCharCode(10);
// `--answers`: only the owner's answers of 2026-09-29/30 and the deal's two injections the Béxar start rewrote; the rest were proved
// on the first build (docs/evidence/starts-injections.json) and touch code these did not change.
const answersOnly = process.argv.includes('--answers'), downriverOnly = process.argv.includes('--downriver');
const marker = INJECTIONS.findIndex(one => one.answers);
const REWRITTEN = ['Victoria is not seated: a class of five has no Tejano family', "Victoria's families are dealt as Anglo-American"];
for (const [index, injection] of INJECTIONS.entries()) {
  if (injection.answers) continue;
  if (answersOnly && index < marker && !REWRITTEN.includes(injection.name)) continue;
  // `--downriver`: only the owner's "Downriver only" of 2026-09-30.
  if (downriverOnly && !injection.downriver) continue;
  const originals = new Map();
  try {
    for (const edit of injection.edits) {
      if (!originals.has(edit.file)) originals.set(edit.file, readFileSync(edit.file, 'utf8'));
      const text = readFileSync(edit.file, 'utf8');
      const count = needle => text.split(needle).length - 1;
      // Written with LF; a file checked out with CRLF has the same lines with CR before each LF.
      const crlf = !count(edit.from) && count(edit.from.split(LF).join(CR + LF));
      const from = crlf ? edit.from.split(LF).join(CR + LF) : edit.from, to = crlf ? edit.to.split(LF).join(CR + LF) : edit.to;
      if (count(from) < 1 || (count(from) > 1 && from !== 'import ')) throw new Error(`${injection.name}: the text to replace is in ${edit.file} ${count(from)} times`);
      writeFileSync(edit.file, text.replace(from, () => to));
    }
    const failed = runTests(Boolean(injection.spring), [injection.file || FILES[0]]);
    const caught = failed.includes(injection.expect);
    record.push({ name: injection.name, files: [...originals.keys()], expect: injection.expect, spring: Boolean(injection.spring), caught, alone: failed.length === 1 && caught, failed });
    console.log(`${caught ? 'caught' : 'MISSED'}${failed.length > 1 ? ` (and ${failed.length - 1} more)` : ''}: ${injection.name} -> ${failed.join(' | ') || 'nothing failed'}`);
  } finally { for (const [file, text] of originals) writeFileSync(file, text); }
}
if (runTests().length) throw new Error('The tests fail after every file was put back');
mkdirSync('docs/evidence', { recursive: true });
const out = downriverOnly ? 'docs/evidence/starts-injections-downriver.json' : answersOnly ? 'docs/evidence/starts-injections-answers.json' : 'docs/evidence/starts-injections.json';
writeFileSync(out, `${JSON.stringify({ record: 'starts-injections', date: new Date().toISOString().slice(0, 10), files: FILES, injections: record }, null, 2)}\n`);
console.log(`\n${record.filter(r => r.caught).length} of ${record.length} caught by the test written for each (${record.filter(r => r.alone).length} by that test alone); wrote ${out}`);
