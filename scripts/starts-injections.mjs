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

const FILES = ['tests/starts.test.mjs'];
const T = {
  deal: 'a class that deals starts seats Victoria, whose families are Tejano; one of Liberty\'s is free Black from ten families; the first of each is among the first six to join',
  sides: 'moving a start early exchanges only two families on the same side of the burn zone, and keeps every family\'s land',
  old: 'a class made without starts deals none, offers every tone and deals the mixed names, as before',
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
const S = 'sim/starts.mjs', STORY = 'sim/start-story.mjs', J = 'sim/tejano.mjs', A = 'sim/appearance.mjs', W = 'sim/world.mjs', C = 'sim/courtship.mjs';

const INJECTIONS = [
  // ------------------------------------------------------------------------------------------------ the deal
  { name: 'Victoria is not seated: a class of five has no Tejano family', expect: T.deal, edits: [
    { file: 'sim/colonies-region.mjs', from: '  const counts = dealCounts(playerCount, starts ? STARTS_SEATED : undefined);', to: '  const counts = dealCounts(playerCount);' }] },
  { name: 'Victoria\'s families are dealt as Anglo-American', expect: T.deal, edits: [
    { file: S, from: "  const starts = places.map(place => (place.settlementId === TEJANO_AT ? 'tejano' : 'anglo'));", to: "  const starts = places.map(() => 'anglo');" }] },
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
    { file: 'sim/family.mjs', from: '  const pools = poolsFor(heritage) || NAME_POOLS;', to: '  const pools = NAME_POOLS;' }] },
  { name: 'a Tejano family plants cotton', expect: T.names, edits: [
    { file: W, from: "    const crop = region.heritages?.[i - 1] === 'tejano' ? 'corn' : drawn;", to: '    const crop = drawn;' }] },
  { name: 'the spouse\'s family is dealt any tone', expect: T.spouse, edits: [
    { file: C, from: 'appearance: looksFor(`${key}:${id}`, sex, years, skinChoices(of)) };', to: 'appearance: looksFor(`${key}:${id}`, sex, years) };' }] },
  { name: 'the spouse is named from the mixed pools', expect: T.spouse, edits: [
    { file: C, from: '  const given = nameFrom(role, `${world.seed}:${id}:name`, taken, poolsFor(household.heritage) || NAME_POOLS);', to: '  const given = nameFrom(role, `${world.seed}:${id}:name`, taken);' }] },
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
  { name: 'words are put in their mouths', expect: T.road, spring: true, edits: [
    { file: STORY, from: "  return { id, kind: 'enslaved', people, pairs: [] };", to: "  return { id, kind: 'enslaved', people, pairs: [{ key: id, ids: [people[0].id, people[1].id], talking: true }] };" }] },
];

const failing = output => [...output.matchAll(/^✖ (.+?) \(\d/gm)].map(match => match[1]).filter((name, i, all) => name !== 'failing tests:' && all.indexOf(name) === i);
const runTests = (spring = true) => {
  const skip = spring ? [] : SPRING.flatMap(name => ['--test-skip-pattern', name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')]);
  const result = spawnSync(process.execPath, ['--test', ...skip, ...FILES], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  return failing(`${result.stdout}${result.stderr}`);
};

const clean = runTests();
if (clean.length) throw new Error(`The tests fail before any injection: ${clean.join('; ')}`);
const record = [];
const CR = String.fromCharCode(13), LF = String.fromCharCode(10);
for (const injection of INJECTIONS) {
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
      writeFileSync(edit.file, text.replace(from, to));
    }
    const failed = runTests(Boolean(injection.spring));
    const caught = failed.includes(injection.expect);
    record.push({ name: injection.name, files: [...originals.keys()], expect: injection.expect, spring: Boolean(injection.spring), caught, alone: failed.length === 1 && caught, failed });
    console.log(`${caught ? 'caught' : 'MISSED'}${failed.length > 1 ? ` (and ${failed.length - 1} more)` : ''}: ${injection.name} -> ${failed.join(' | ') || 'nothing failed'}`);
  } finally { for (const [file, text] of originals) writeFileSync(file, text); }
}
if (runTests().length) throw new Error('The tests fail after every file was put back');
mkdirSync('docs/evidence', { recursive: true });
const out = 'docs/evidence/starts-injections.json';
writeFileSync(out, `${JSON.stringify({ record: 'starts-injections', date: new Date().toISOString().slice(0, 10), files: FILES, injections: record }, null, 2)}\n`);
console.log(`\n${record.filter(r => r.caught).length} of ${record.length} caught by the test written for each (${record.filter(r => r.alone).length} by that test alone); wrote ${out}`);
