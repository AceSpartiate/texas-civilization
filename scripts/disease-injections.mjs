// The regressions tests/disease.test.mjs guards, injected one at a time (CLAUDE.md: "A new test is not evidence until it has
// failed"). Each injection replaces one exact piece of a file with the mistake a test is written against, runs the test file,
// records which tests failed, checks they are the ones the injection names (`expect`) and no others, and puts the file back
// byte for byte. The pattern is scripts/cold-injections.mjs's.
//
// Run: node scripts/disease-injections.mjs [name-filter]  → writes docs/evidence/disease-injections.json (all of them only)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const FILES = ['tests/disease.test.mjs'];
const INJECTIONS = [
  // Build step 0: sickness mends everywhere.
  {
    // Nothing mends the sick but the road's own loop, which since 2026-09-27 mends nobody (sim/scrape.mjs): as it was for
    // everybody off the road until then.
    name: 'nobody is mended off the road, as it was until 2026-09-27',
    file: 'sim/world.mjs',
    from: '  mendSickness(world, calendar);\n',
    to: '',
    expect: ['step 0: somebody sick at home', 'step 0: a man serving', 'step 0: somebody made sick by a norther', 'step 0: on the road a sickness', 'step 1: a class saved before', 'step 2: on the calendar', 'step 2: "Stop and rest a day"'],
  },
  {
    // The mending read after the day's work rather than after the roads: a halt that ends in a tick counts that tick, stood still,
    // as a tick of walking (found 2026-09-27 by the browser proof: a day's rest mended half a day).
    name: 'the sick mend by what the family does after the roads have moved, not by what the road did',
    file: 'sim/world.mjs',
    from: '  mendSickness(world, calendar);\n',
    to: '',
    also: { file: 'sim/world.mjs', from: '  advanceDisease(world);\n', to: '  advanceDisease(world);\n  mendSickness(world, calendar);\n' },
    expect: ['step 2: "Stop and rest a day"'],
  },
  {
    // A second, silent mending ahead of the one that tells, as the road's own loop mended before 2026-09-27: two places mend.
    name: 'the sick are mended in two places, one of them silent',
    file: 'sim/world.mjs',
    from: '  mendSickness(world, calendar);\n',
    to: "  for (const one of Object.values(world.entities)) if (one.health?.condition === 'sick' && world.minute >= one.health.recoversAt) one.health = { condition: 'well' };\n  mendSickness(world, calendar);\n",
    expect: ['step 0: on the road a sickness'],
  },

  // Build step 1: the names.
  {
    name: 'a disease\'s claim is an ID nobody registered',
    file: 'sim/disease.mjs',
    from: "army: 'HIST-TEX-669', groces: 'HIST-TEX-670', scrape: 'HIST-TEX-671',",
    to: "army: 'HIST-TEX-669', groces: 'HIST-TEX-670', scrape: 'HIST-TEX-699',",
    expect: ['step 1: five diseases'],
  },
  {
    name: 'a sickness of no known name is let into a saved class',
    file: 'sim/disease.mjs',
    from: "    if (health?.disease !== undefined && !DISEASE_IDS.includes(health.disease)) return 'Unknown sickness';\n",
    to: '',
    expect: ['step 1: a class saved before'],
  },
  {
    name: 'the Host is told "sick" and never what of',
    file: 'sim/disease.mjs',
    from: "  return `${person.health.grave ? 'very sick' : 'sick'}${spec.generic ? '' : ` with ${spec.name}`}, `;",
    to: "  return 'sick, ';",
    expect: ['step 1: the family and the Host'],
  },

  // Build step 2: rest.
  {
    name: 'rest and work swapped: resting mends at half pace and working at double',
    file: 'sim/disease.mjs',
    from: 'export const MEND = Object.freeze({ rest: 2, ride: 1, work: 0.5 });',
    to: 'export const MEND = Object.freeze({ rest: 0.5, ride: 1, work: 2 });',
    // The rates the study measured move with it, so the evidence is stale too (tests/disease.test.mjs step 8).
    expect: ['step 2: rest is twice', 'step 2: on the calendar', 'step 2: "Stop and rest a day"', 'step 8: the measured deaths'],
  },
  {
    name: 'rest does nothing for the risk: resting weighs as much as walking',
    file: 'sim/disease.mjs',
    from: 'export const RISK = Object.freeze({ rest: 0.5, ride: 1, work: 2 });',
    to: 'export const RISK = Object.freeze({ rest: 2, ride: 1, work: 2 });',
    expect: ['step 2: rest is twice', 'step 8: the measured deaths'],
  },
  {
    name: 'somebody idle at home is not resting (the owner: "an idle sick person counts as resting")',
    file: 'sim/disease.mjs',
    from: "  if (person.task === 'work' || person.task === 'help') return 'work';\n  return 'rest';\n",
    to: "  if (person.task === 'work' || person.task === 'help') return 'work';\n  return 'ride';\n",
    // And every test that reads a resting line or rests somebody at home.
    expect: ['step 1: the family and the Host', 'step 2: rest is twice', 'step 2: on the calendar', 'step 2: nursing keeps', 'step 2: sick and left alone'],
  },
  // Not injected, and worth saying why: "a day to answer" is held twice by the shape of `sicknessDay` - the day somebody turns
  // very sick ends that day's roll inside the not-yet-very-sick branch, and `health.day` rolls a person once a day - so
  // taking out `if (day <= health.graveDay) return;`, even with the turning's own `return`, changes no outcome (both were tried
  // on 2026-09-27 and nothing failed). The guard is belt and braces, and an injection that cannot fail proves nothing. What the
  // test does catch is a death from being only sick, below.
  {
    name: 'somebody only sick may die of it, as the road\'s sickness always could',
    file: 'sim/disease.mjs',
    from: '    sickFood(world, household, person, day);\n    return;\n',
    to: "    if (deathsAllowed(world) && roll(world, person.id, `sick-death:${day}`) < chance(spec.death, weight)) { die(world, household, person, where); return; }\n    sickFood(world, household, person, day);\n    return;\n",
    // The nursed die too, being only sick, which the nursing test counts.
    expect: ['step 2: nobody dies of being sick', 'step 2: nursing keeps'],
  },
  {
    name: 'nursing keeps nobody alive',
    file: 'sim/disease.mjs',
    from: '  if (nursedOn(person, day)) {\n',
    to: '  if (false) {\n',
    expect: ['step 2: nursing keeps'],
  },
  {
    name: 'nursed and resting, still very sick',
    file: 'sim/disease.mjs',
    from: "    if (activity === 'rest') { ease(world, person, 'nursed and resting'); return; }\n",
    to: "    if (activity === 'rest') return;\n",
    expect: ['step 2: nursing keeps'],
  },
  {
    name: '"Stop and rest a day" halts nobody',
    file: 'sim/disease.mjs',
    from: "name: 'Stop and rest a day', skill: 'rest', where: 'road', road: true, halts: true,",
    to: "name: 'Stop and rest a day', skill: 'rest', where: 'road', road: true, halts: false,",
    expect: ['step 2: "Stop and rest a day"'],
  },
  {
    name: '"Stop and rest a day" is offered with nobody sick or tired',
    file: 'sim/disease.mjs',
    from: "  if (!withFamily(world, household).people.some(one => ['sick', 'tired'].includes(one.health?.condition))) return 'Nobody with the family is sick or tired.';\n",
    to: '',
    expect: ['step 2: "Stop and rest a day"'],
  },
  {
    name: 'somebody very sick is sent to work',
    file: 'sim/chores.mjs',
    from: "  if (entity.health.grave) return { can: false, why: `${entity.name} is too sick to get up.` };\n",
    to: '',
    expect: ['step 2: a sick person may work'],
  },
  {
    name: 'somebody very sick is sent on a journey',
    file: 'sim/world.mjs',
    from: '  { const why = sickRefusal(entity); if (why) throw new Error(why); }\n',
    to: '',
    expect: ['step 2: a sick person may work'],
  },
  {
    name: 'the warning is not on the work a sick person is sent to',
    file: 'public/family-panel.js',
    from: "    const warn = entry.can && entity.sickness?.warn && !REST_WORK.includes(entry.id) ? entity.sickness.warn : '';\n",
    to: "    const warn = '';\n",
    expect: ['step 2: a sick person may work'],
  },
  {
    name: 'somebody very sick carries no "!"',
    file: 'public/family-panel.js',
    from: "  if (entity.sickness?.grave) needs.push({ kind: 'sick', text: `${name}: ${entity.sickness.line || 'very sick.'}` });\n",
    to: '',
    expect: ['step 2: a sick person may work'],
  },
  {
    name: 'work about the place goes on when the sickness comes',
    file: 'sim/disease.mjs',
    from: "  if (person.task === 'work' && !person.chore && !person.travel) person.task = 'rest';\n",
    to: '',
    // The family's line says resting only when the sick one has gone to bed.
    expect: ['step 1: the family and the Host', 'step 2: sick and left alone'],
  },
  {
    name: 'the resting sick are drawn standing about',
    file: 'public/motion.js',
    from: "  if (restingSick({ ...entity, condition })) return { id: `${variant}-injured-rest`, frozen: true, upright: true };\n",
    to: '',
    expect: ['step 2: sick and left alone'],
  },

  // Build step 3: within a family.
  {
    name: 'the measles comes out in the family at once, not ten days on',
    file: 'sim/disease.mjs',
    from: "    // Ten to twelve days on, hashed: the measles' own wait before anybody knows (CDC; §2.2).\n    person.exposed = { ...(person.exposed || {}), [disease]: world.minute + (10 + Math.floor(roll(world, person.id, `wait:${disease}`) * 3)) * DAY };\n",
    to: "    person.exposed = { ...(person.exposed || {}), [disease]: world.minute + Math.floor(roll(world, person.id, `wait:${disease}`) * 3) * DAY };\n",
    expect: ['step 3: measles in the family'],
  },
  {
    name: 'somebody who has had the measles takes it again',
    file: 'sim/disease.mjs',
    from: '  return !hadIt(world, person, disease);\n',
    to: '  return true;\n',
    // Nobody has had it, so the crowds catch it from those who have as well.
    expect: ['step 3: measles in the family', 'step 3: who has had the measles', 'step 4: measles and whooping cough go round'],
  },
  {
    name: 'who has had the measles is dealt the same at every age',
    file: 'sim/disease.mjs',
    from: "  if (disease === 'measles') return age < 2 ? 0.02 : age < 6 ? 0.15 : age < 10 ? 0.35 : age < 16 ? 0.55 : age < 30 ? 0.75 : 0.85;\n",
    to: "  if (disease === 'measles') return 0.5;\n",
    expect: ['step 3: measles in the family', 'step 3: who has had the measles'],
  },
  {
    name: 'the whooping cough is taken at any age',
    file: 'sim/disease.mjs',
    from: '  if (spec.under && ageOf(person) >= spec.under) return false;\n',
    to: '',
    expect: ['step 3: whooping cough is a child'],
  },

  // Build step 4: the crowded places.
  {
    name: 'the crowded places have their sickness all the spring, not on the record\'s dates',
    file: 'sim/disease.mjs',
    from: 'export const crowdOpen = (world, crowd) => (world.period || 1) === 3 && within(world, crowd.from, crowd.to);',
    to: 'export const crowdOpen = (world, crowd) => (world.period || 1) === 3;',
    expect: ['step 4: measles and whooping cough go round'],
  },
  {
    name: 'measles goes round at every refuge, not only the record\'s',
    file: 'sim/disease.mjs',
    from: '  return CROWDS.find(one => one.sites.includes(camp) && crowdOpen(world, one)) || null;\n',
    to: '  return CROWDS.find(one => crowdOpen(world, one)) || null;\n',
    expect: ['step 4: measles and whooping cough go round'],
  },
  {
    name: 'the camp\'s water is fouled after a day',
    file: 'sim/disease.mjs',
    from: 'export const FLUX_PER_DAY = 0.02, FLUX_AFTER_DAYS = 2;',
    to: 'export const FLUX_PER_DAY = 0.02, FLUX_AFTER_DAYS = 1;',
    expect: ['step 4: the flux comes after two days', 'step 8: the measured deaths'],
  },
  {
    name: 'camping apart does not keep a family out of the fouled water',
    file: 'sim/disease.mjs',
    from: "  return flight?.status === 'refuged' && !campedApart(world, household) && (world.period || 1) === 3\n",
    to: "  return flight?.status === 'refuged' && (world.period || 1) === 3\n",
    expect: ['step 4: the flux comes after two days'],
  },
  {
    name: 'camped apart, the family still trades with the crowd',
    file: 'sim/road.mjs',
    from: "  if (chore.skill === 'trade' && campedApart(world, household)) return 'The family is camped apart from the others, and there is nobody near to trade with.';\n",
    to: '',
    expect: ['step 4: the flux comes after two days'],
  },
  {
    name: 'the sick die in the first period, at the siege of Béxar with it',
    file: 'sim/disease.mjs',
    from: 'export const deathsAllowed = world => (world.period || 1) >= 2;',
    to: 'export const deathsAllowed = world => true;',
    expect: ['step 4: nobody dies of a sickness in the first period'],
  },
  {
    name: 'word of the Trinity\'s sickness is everywhere at once',
    file: 'sim/disease.mjs',
    from: 'export const WORD_MILES_A_DAY = 15;',
    to: 'export const WORD_MILES_A_DAY = 1500;',
    expect: ['step 4: word of the sickness'],
  },
  {
    name: 'Houston\'s camp has no sickness in April',
    file: 'sim/disease.mjs',
    from: '  if (period === 3 && withHouston(person) && within(world, CAMP_FROM, CAMP_TO)) {\n',
    to: '  if (period === 4 && withHouston(person) && within(world, CAMP_FROM, CAMP_TO)) {\n',
    expect: ['step 4: Houston\'s camp'],
  },

  // Build step 5: the ague.
  {
    name: 'the fever of the bottoms comes to the prairie too',
    file: 'sim/disease.mjs',
    from: '    cache.set(key, BOTTOMLAND.has(stand));\n',
    to: '    cache.set(key, true);\n',
    expect: ['step 5: the chills and fever come to river-bottom'],
  },
  {
    name: 'the frost does not end the fever',
    file: 'sim/disease.mjs',
    from: '  if (period === 1 && atHome && !household.arriving && day < frostDay(world, household) && onBottomland(world, household)) {\n',
    to: '  if (period === 1 && atHome && !household.arriving && onBottomland(world, household)) {\n',
    expect: ['step 5: the chills and fever come to river-bottom'],
  },
  {
    name: 'the bark does not keep the fever from coming back',
    file: 'sim/disease.mjs',
    from: "  if (health.disease === 'ague' && !health.barked && !health.relapse",
    to: "  if (health.disease === 'ague' && !health.relapse",
    expect: ['step 5: the chills and fever come back'],
  },

  // Build step 6: the doctor and the rice and tea.
  {
    name: 'the doctor turns the sick away, as he did until 2026-09-27',
    file: 'sim/shops.mjs',
    from: "['tired', 'minor-injury', 'sick'].includes(entity.health?.condition) ? null",
    to: "['tired', 'minor-injury'].includes(entity.health?.condition) ? null",
    expect: ['step 6: the doctor sees the sick'],
  },
  {
    name: 'the bark does nothing for the chills and fever',
    file: 'sim/disease.mjs',
    from: '    health.recoversAt = world.minute + Math.round(left / 2);\n',
    to: '    health.recoversAt = world.minute + left;\n',
    expect: ['step 6: the doctor sees the sick'],
  },
  {
    name: 'calomel and bleeding do no harm',
    file: 'sim/disease.mjs',
    from: '  health.recoversAt += 2 * DAY;\n',
    to: '',
    expect: ['step 6: the doctor sees the sick'],
  },
  {
    name: 'the rice and tea do nothing',
    file: 'sim/disease.mjs',
    from: '  person.health.recoversAt -= DAY;\n  tell(world, person, `${person.name} was given rice and tea',
    to: '  tell(world, person, `${person.name} was given rice and tea',
    expect: ['step 6: rice and tea'],
  },

  // Build step 7: the families nobody plays, and the Host.
  {
    name: 'a family nobody plays sends its sick to work at home',
    file: 'sim/neighbours.mjs',
    from: "\n    && person.health?.condition !== 'dead' && person.health?.condition !== 'captured' && person.health?.condition !== 'sick');\n",
    to: "\n    && person.health?.condition !== 'dead' && person.health?.condition !== 'captured');\n",
    expect: ['step 7: a family nobody plays never sends'],
  },
  {
    name: 'a family nobody plays leaves its sick at home un-nursed',
    file: 'sim/neighbours.mjs',
    from: "    if (nurse && attempt({ action: 'chore', entityId: nurse.id, chore: 'nurse-home' })) idle.splice(idle.indexOf(nurse), 1);\n",
    to: '',
    expect: ['step 7: a family nobody plays never sends'],
  },
  {
    name: 'a family nobody plays never stops for its very sick',
    file: 'sim/neighbours.mjs',
    from: "        if (hand) attempt({ action: 'chore', entityId: hand.id, chore: 'rest-road' });\n",
    to: '',
    expect: ['step 7: on the road a family nobody plays'],
  },
  {
    name: 'a family nobody plays stops to rest with the army close behind',
    file: 'sim/neighbours.mjs',
    from: '    if (!flight.danger && !flight.bogged) {\n',
    to: '    if (!flight.bogged) {\n',
    expect: ['step 7: on the road a family nobody plays'],
  },
  {
    name: 'a child dead of a sickness is named on the Host\'s class panel',
    file: 'sim/host.mjs',
    from: "filter(person => person?.kind === 'person' && !diedAChild(person))",
    to: "filter(person => person?.kind === 'person')",
    expect: ['step 7: a child who died'],
  },
  {
    name: 'somebody dead of a sickness is on the Host\'s map',
    file: 'sim/overview.mjs',
    from: " && !(entity.health?.condition === 'dead' && entity.health.disease)).map(entity => overviewEntity(world, entity)),",
    to: ').map(entity => overviewEntity(world, entity)),',
    expect: ['step 7: a child who died'],
  },

  {
    name: 'somebody of the family dead of a sickness is sent with a place, and drawn',
    file: 'sim/world.mjs',
    from: "    ...(e.kind === 'person' && e.health?.condition === 'dead' && e.health.disease && { location: null }),\n",
    to: '',
    expect: ['step 7: a child who died'],
  },

  // Build step 8: the measurement.
  {
    name: 'a death rate moved and the study not run again',
    file: 'sim/disease.mjs',
    from: "name: 'the measles', short: 'measles', days: 7,",
    to: "name: 'the measles', short: 'measles', days: 8,",
    expect: ['step 8: the measured deaths'],
  },
];

const failing = output => [...output.matchAll(/^✖ (.+?) \(\d/gm)].map(match => match[1]).filter((name, i, all) => name !== 'failing tests:' && all.indexOf(name) === i);
const run = () => { const result = spawnSync(process.execPath, ['--test', ...FILES], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }); return failing(`${result.stdout}${result.stderr}`); };

const only = process.argv[2] || '';
const chosen = INJECTIONS.filter(injection => injection.name.includes(only));
const clean = run();
if (clean.length) throw new Error(`The tests fail before any injection: ${clean.join('; ')}`);
const record = [];
let wrong = 0;
for (const injection of chosen) {
  const file = injection.file;
  // One replacement, or two (`also`) made together - in the same file one after the other, or in two - and all put back.
  const originals = new Map();
  const replace = ({ file: where, from: before, to: after }) => {
    const text = readFileSync(where, 'utf8');
    if (!originals.has(where)) originals.set(where, text);
    const CR = String.fromCharCode(13), LF = String.fromCharCode(10);
    const ends = piece => (text.includes(CR + LF) ? piece.split(LF).join(CR + LF) : piece);
    const count = text.split(ends(before)).length - 1;
    if (count !== 1) throw new Error(`${injection.name}: the text to replace is in ${where} ${count} times`);
    writeFileSync(where, text.replace(ends(before), ends(after)));
  };
  let failed;
  try {
    replace(injection);
    if (injection.also) replace(injection.also);
    failed = run();
  } finally { for (const [where, text] of originals) writeFileSync(where, text); }
  // Caught, and caught by exactly the tests it names: each expected name is a prefix of a failing test, and nothing else failed.
  const expected = injection.expect || [];
  const missing = expected.filter(prefix => !failed.some(name => name.startsWith(prefix)));
  const extra = failed.filter(name => !expected.some(prefix => name.startsWith(prefix)));
  const ok = failed.length > 0 && !missing.length && !extra.length;
  if (!ok) wrong++;
  record.push({ name: injection.name, file, failed, expected, ok });
  console.log(`${ok ? 'caught' : failed.length ? 'CAUGHT BY THE WRONG TESTS' : 'MISSED'}: ${injection.name} -> ${failed.join(' | ') || 'nothing failed'}${missing.length ? ` [missing: ${missing.join('; ')}]` : ''}${extra.length ? ` [extra: ${extra.join('; ')}]` : ''}`);
}
if (run().length) throw new Error('The tests fail after every file was put back');
if (!only) {
  mkdirSync('docs/evidence', { recursive: true });
  writeFileSync('docs/evidence/disease-injections.json', `${JSON.stringify({ record: 'disease-injections', date: new Date().toISOString().slice(0, 10), files: FILES, injections: record }, null, 2)}\n`);
}
console.log(`\n${record.filter(r => r.ok).length} of ${record.length} caught by exactly their tests${only ? '' : '; wrote docs/evidence/disease-injections.json'}`);
if (wrong) process.exitCode = 1;
