// The regressions tests/acting.test.mjs guards, injected one at a time (CLAUDE.md: "A new test is not evidence until it has
// failed"). Who acts for a family, the oldest child who steps up, a family taken in, the left behind, the baby and the war, very
// sick in bed, the family with nobody living, and the dead who never speak (owner, 2026-09-28; sim/acting.mjs,
// docs/FAMILY_PANEL.md §20). Each injection replaces one exact piece of code with the mistake a test is written against, runs the
// test file, records which of its tests failed, and puts the file back byte for byte. **Caught** means the test named for the rule
// failed; **alone** means nothing else in the file did. It stops if a replacement does not match exactly once.
//
// CRLF: the working copy may be CRLF; each pattern is converted to the file's own line endings before it is looked for.
//
// Run: npm run test:acting-injections  → writes docs/evidence/acting-injections.json
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const ACTING = 'sim/acting.mjs', WORLD = 'sim/world.mjs', PURSUIT = 'sim/pursuit.mjs', BABIES = 'sim/babies.mjs', CHILDHOOD = 'sim/childhood.mjs';
const SCRAPE = 'sim/scrape.mjs', CLOCK = 'sim/clock.mjs', ENDING = 'sim/ending.mjs', CHORES = 'sim/chores.mjs', PANEL = 'public/family-panel.js';
const TEST = 'tests/acting.test.mjs';
const INJECTIONS = [
  // Who decides for the family (interactions B1, FIC-GONZ-730).
  { name: 'the order\'s "!" stays on the main person with the army', file: PANEL, from: "  if (world.flight?.status === 'ordered' && !world.household?.takenIn && entityId === acting)", to: "  if (world.flight?.status === 'ordered' && !world.household?.takenIn && entityId === (world.household?.mainId || world.household?.principalId))", expect: /^B1: the father serving with Houston, the order/ },
  { name: 'the page is never told who is with the family', file: WORLD, from: '    ...(acting && acting.id !== main && { actingId: acting.id }), ', to: '    ', expect: /^B1: the father serving with Houston, the order/ },
  { name: 'the refusal to a man with the army does not name who answers', file: WORLD, from: "throw new Error(`${servingWhy(world, entity)}${deciding ? answersInstead() : ''}`);", to: 'throw new Error(servingWhy(world, entity));', expect: /^B1: the father serving with Houston, the order/ },
  { name: 'a man with the army is counted with the family', file: ACTING, from: "  if (['serving', 'prisoner'].includes(person?.service?.status)) return true;\n  if (world?.army?.members", to: "  if (world?.army?.members", expect: /^with nobody of seven or more, the nearest neighbours take/ },
  { name: 'the chase reads the main person\'s switch, not who is with the family', file: PURSUIT, from: '  const actor = world.entities[actingId(world, household)];', to: '  const actor = world.entities[household.mainId || household.principalId];', expect: /^B1: soldiers call "¡Alto!"/ },
  // The oldest child steps up (owner's "The oldest child steps up", FIC-GONZ-730).
  { name: 'a child is refused the family\'s decisions', file: WORLD, from: ' && !(deciding && acting?.id === entity.id)) throw new Error(tooYoungWhy(entity));', to: ') throw new Error(tooYoungWhy(entity));', expect: /^the oldest child steps up/ },
  { name: 'a child steps up only at ten', file: ACTING, from: 'export const STEPS_UP_FROM = 7;', to: 'export const STEPS_UP_FROM = 10;', expect: /^the oldest child steps up/ },
  { name: 'a smaller child is not told who answers', file: WORLD, from: "is the oldest with the family, and answers for it' : 'answers for it'}.` : ''}`);", to: "' : ''}.` : ''}`);", expect: /^the oldest child steps up/ },
  // Taken in (FIC-GONZ-731).
  { name: 'nobody takes the little ones in', file: ACTING, from: '        if (host) takeIn(world, household, host);', to: '', expect: /^with nobody of seven or more, the nearest neighbours take/ },
  { name: 'the taken-in stay behind when the neighbours go', file: ACTING, from: '    goWith(world, host, ours);', to: '', expect: /^with nobody of seven or more, the nearest neighbours take/ },
  { name: 'nobody grown of the family can fetch the children back', file: ACTING, from: '    if (grown) { release(world, household, host, grown, { beginTravel }); continue; }', to: '', expect: /^taken in at the neighbours' own place/ },
  { name: 'going for help is never offered', file: ACTING, from: "      offered: (world, household, entity) => entity.age >= STEPS_UP_FROM && actingFor", to: "      offered: (world, household, entity) => false && actingFor", expect: /^the oldest child at home may go for help/ },
  { name: 'a child may not run to the neighbours', file: WORLD, from: "  if (tooYoung(entity) && !(modeId === 'foot' && entity.chore?.id === 'child-help')) return", to: '  if (tooYoung(entity)) return', expect: /^the oldest child at home may go for help/ },
  // Left behind, and the wounded (FIC-GONZ-732).
  { name: 'nobody left behind follows', file: WORLD, from: '  advanceStragglers(world, { beginTravel, modeWith });', to: '', expect: /^left behind/ },
  { name: 'the wounded are left at home', file: SCRAPE, from: '  const goers = atHome(world, household);', to: "  const goers = atHome(world, household).filter(person => person.health?.condition !== 'wounded');", expect: /^the wounded go with the family/ },
  // The baby and the war (FIC-GONZ-733).
  { name: 'the baby marches with the army', file: BABIES, from: '  if (goingToWar(world, entity)) {', to: '  if (false) {', expect: /^a baby never marches/ },
  { name: 'nothing says the little ones are left alone', file: CHORES, from: ', ...(estimate && { estimate }), ...(leaves && { leaves }) }', to: ', ...(estimate && { estimate }) }', expect: /^a baby never marches/ },
  // Very sick in bed (FIC-GONZ-734).
  { name: 'work goes on for somebody too sick to get up', file: BABIES, from: '      if (person.chore) {\n        const work = ', to: '      if (false) {\n        const work = ', expect: /^very sick is in bed/ },
  { name: 'a very sick woman is sent to the crying baby', file: BABIES, from: "  const free = people.filter(person => ofAge(person) && ableAt(person, place)", to: "  const free = people.filter(person => ofAge(person) && at(person, place)", expect: /^very sick is in bed/ },
  { name: 'an idle child goes to stop a very sick parent\'s rest', file: CHILDHOOD, from: "\n      && !person.health?.grave && person.health?.condition !== 'wounded');", to: ');', expect: /^very sick is in bed/ },
  { name: 'nobody is offered to nurse the very sick', file: WORLD, from: "    .filter(one => one && one.id !== sick.id && one.kind === 'person' && choreAvailability(world, household, one, chore).can)", to: '    .filter(() => false)', expect: /^very sick is in bed/ },
  // A family with nobody living (playthrough 7).
  { name: 'a dead family is told to leave', file: SCRAPE, from: '  if (!people(world, household).some(person => !GONE.includes(person.health?.condition))) return;\n', to: '', expect: /^a family with nobody living/ },
  { name: 'a dead family holds the clock', file: CLOCK, from: " && !household.flight.burned && answering(household))) return true;", to: ' && !household.flight.burned)) return true;', expect: /^a family with nobody living/ },
  { name: 'a dead family can win', file: ENDING, from: '  const contenders = families.filter(family => !family.automatic && !family.wiped);', to: '  const contenders = families.filter(family => !family.automatic);', expect: /^a family with nobody living/ },
  // The dead never speak (interactions M1).
  { name: 'the dead keep their little ones', file: BABIES, from: '      if (!gone && !abed) continue;', to: '      if (!abed) continue;', expect: /^the dead never speak/ },
];

const failing = output => [...output.matchAll(/^✖ (.+?) \(\d/gm)].map(match => match[1]).filter((name, i, all) => name !== 'failing tests:' && all.indexOf(name) === i);
const run = () => { const result = spawnSync(process.execPath, ['--test', TEST], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }); return failing(`${result.stdout}${result.stderr}`); };

const only = process.argv[2] ? new RegExp(process.argv[2]) : null;
const chosen = INJECTIONS.filter(injection => !only || only.test(injection.name));
const clean = run();
if (clean.length) throw new Error(`${TEST} fails before any injection: ${clean.join('; ')}`);
const record = [];
for (const injection of chosen) {
  const file = injection.file;
  const original = readFileSync(file, 'utf8');
  const CR = String.fromCharCode(13), LF = String.fromCharCode(10);
  const ends = text => (original.includes(CR + LF) ? text.split(LF).join(CR + LF) : text);
  const from = ends(injection.from), to = ends(injection.to);
  const count = original.split(from).length - 1;
  if (count !== 1) throw new Error(`${injection.name}: the text to replace is in ${file} ${count} times`);
  writeFileSync(file, original.replace(from, () => to));
  let failed;
  try { failed = run(); } finally { writeFileSync(file, original); }
  const caught = failed.some(name => injection.expect.test(name));
  const alone = caught && failed.length === 1;
  record.push({ name: injection.name, file, caught, alone, failed });
  console.log(`${caught ? (alone ? 'caught alone' : 'caught') : 'MISSED'}: ${injection.name} -> ${failed.join(' | ') || 'nothing failed'}`);
}
if (run().length) throw new Error(`${TEST} fails after every file was put back`);
if (!only) {
  mkdirSync('docs/evidence', { recursive: true });
  writeFileSync('docs/evidence/acting-injections.json', `${JSON.stringify({
    record: 'acting-injections',
    date: new Date().toISOString().slice(0, 10),
    note: 'Who acts for a family, the oldest child who steps up, a family taken in, the left behind, the baby and the war, very sick in bed, the family with nobody living and the dead who never speak (docs/FAMILY_PANEL.md §20, 2026-09-28). Each injection is run against tests/acting.test.mjs; "alone" means the test named for the rule was the only one to fail.',
    injections: record,
  }, null, 2)}\n`);
}
console.log(`\n${record.filter(r => r.caught).length} of ${record.length} caught, ${record.filter(r => r.alone).length} alone${only ? '' : '; wrote docs/evidence/acting-injections.json'}`);
