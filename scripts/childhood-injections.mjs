// The regressions the children's, babies' and the Scrape's own tests guard, injected one at a time (CLAUDE.md: "A new test is not
// evidence until it has failed"). Each injection replaces one exact piece of the code with the mistake a test is written against,
// runs the test file that guards it, records which of that file's tests failed, and puts the file back byte for byte. **Caught**
// means the test named for the rule failed; **alone** means nothing else in its file did. It stops if a replacement does not
// match exactly once, so a stale injection is never passed off as a proof.
//
// CRLF: the working copy is CRLF and a `from` written with bare newlines matches nothing in it. `ends` converts each pattern to
// the line endings the file on disk has before it looks, and the exactly-once check makes a miss loud.
//
// Run: npm run test:children-injections  → writes docs/evidence/childhood-injections.json
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const CHILDHOOD = 'sim/childhood.mjs', BABIES = 'sim/babies.mjs', FLIGHT = 'sim/flight-work.mjs', OBEDIENCE = 'sim/obedience.mjs', FAMILY = 'sim/family.mjs';
const WORLD = 'sim/world.mjs', CHORES = 'sim/chores.mjs', CHILDREN = 'sim/children.mjs', LESSON = 'sim/lesson.mjs', PANEL = 'public/family-panel.js';
const T = {
  childhood: 'tests/childhood.test.mjs', babies: 'tests/babies.test.mjs', flight: 'tests/flight-work.test.mjs', children: 'tests/children.test.mjs', panel: 'tests/family-panel.test.mjs',
};
const INJECTIONS = [
  // The idle child and the parent (FIC-GONZ-476, -477).
  { name: 'the idle child never goes to anybody', file: CHILDHOOD, from: '    if (world.tick - child.idleSince < IDLE_TICKS) continue;', to: '    if (world.tick - child.idleSince < 9999) continue;', test: T.childhood, expect: /goes to the nearest parent/ },
  { name: 'the parent’s work goes on while the child talks', file: CHORES, from: '  if (calledAside(entity)) return;\n  const state = entity.chore;', to: '  const state = entity.chore;', test: T.childhood, expect: /goes to the nearest parent/ },
  { name: 'the child goes to the furthest parent, not the nearest', file: CHILDHOOD, from: 'dist(a) - dist(b) || a.id.localeCompare(b.id)', to: 'dist(b) - dist(a) || a.id.localeCompare(b.id)', test: T.childhood, expect: /goes to the nearest parent/ },
  { name: 'the parent is never let go when the talk ends', file: CHILDHOOD, from: '    if (!grown.aside.childIds.length) delete grown.aside;', to: '', test: T.childhood, expect: /goes to the nearest parent/ },
  { name: 'a stopped parent can be given new work', file: WORLD, from: '  if (entity.aside && ASIDE_REFUSED.has(input.action)) throw', to: '  if (false && entity.aside && ASIDE_REFUSED.has(input.action)) throw', test: T.childhood, expect: /goes to the nearest parent/ },
  { name: 'a one-tick job for the child leaves the parent standing', file: WORLD, from: '    released(world, entity);', to: '', test: T.childhood, expect: /record hears of a child’s talk once a day/ },
  { name: 'the little ones’ comings and goings crowd the page’s news', file: WORLD, from: '    if (e.ambient) continue;', to: '', test: T.childhood, expect: /record hears of a child’s talk once a day/ },
  { name: 'the journal is told every time a child goes to a parent', file: CHILDHOOD, from: '  if (entity.told?.[kind] === day) return false;', to: '', test: T.childhood, expect: /record hears of a child’s talk once a day/ },
  { name: 'a child alone at home stands with nothing', file: CHILDHOOD, from: "      try { beginChore(world, household, child, 'child-play', travel); } catch { continue; }", to: '      continue;', test: T.childhood, expect: /with no parent at home/ },
  { name: 'a child stops a parent in the guided start', file: CHILDHOOD, from: '|| inLesson(world, household) || !awake(world)', to: '|| !awake(world)', test: T.childhood, expect: /nobody is stopped by a child/ },
  { name: 'a child goes looking for a parent in the dark', file: CHILDHOOD, from: '|| inLesson(world, household) || !awake(world)', to: '|| inLesson(world, household)', test: T.childhood, expect: /nobody is stopped by a child/ },
  { name: 'a child stops a parent for four hours a tick', file: CHILDHOOD, from: ' || calendarMinutes(world) > TALK_SCALE', to: '', test: T.childhood, expect: /nobody is stopped by a child/ },
  { name: 'a child stops a parent in a family nobody plays', file: CHILDHOOD, from: '  const quiet = !household.played || household.absent', to: '  const quiet = household.absent', test: T.childhood, expect: /nobody is stopped by a child/ },
  // Play drawn (FIC-GONZ-475).
  { name: 'a child at play is never moved about the yard', file: CHILDHOOD, from: '      if (entity.chore && isPlay(entity.chore.id)) playStep(world, household, entity);', to: '      if (false) playStep(world, household, entity);', test: T.childhood, expect: /a child at play is seen at it/ },
  // A child's automation (FIC-GONZ-480).
  { name: 'a child’s automation goes on for ever', file: CHILDHOOD, from: "  if (world.tick >= entity.childAuto.until) return autoOff(world, household, entity, 'time');", to: '', test: T.childhood, expect: /own automation/ },
  { name: 'a child’s automation goes off without a notice on the row', file: CHILDHOOD, from: '  entity.autoNotice = { tick: world.tick, why };', to: '', test: T.childhood, expect: /own automation/ },
  { name: 'every child is trusted with automation for as long', file: CHILDHOOD, from: 'export const childAutoTicks = roll => Math.round(', to: 'export const childAutoTicks = roll => 30 || Math.round(', test: T.childhood, expect: /own automation/ },
  // Obedience (FIC-GONZ-478, -479).
  { name: 'a better child wanders off more', file: OBEDIENCE, from: '  wander: Object.freeze([0.06, 0.002]),', to: '  wander: Object.freeze([0.002, 0.06]),', test: T.childhood, expect: /obedience decides how often/ },
  { name: 'a better child tires of automation more', file: OBEDIENCE, from: '  autoOff: Object.freeze([0.05, 0.002]),', to: '  autoOff: Object.freeze([0.002, 0.05]),', test: T.childhood, expect: /obedience decides how often/ },
  { name: 'a better child dawdles more', file: OBEDIENCE, from: '  dawdle: Object.freeze([0.3, 0.02]),', to: '  dawdle: Object.freeze([0.02, 0.3]),', test: T.childhood, expect: /obedience decides how often/ },
  { name: 'children are made with no roll', file: FAMILY, from: 'traits: { ...dealTraits(seed, id, sex, age), obedience: obedienceRoll(seed, id) } });', to: 'traits: dealTraits(seed, id, sex, age) });', test: T.childhood, expect: /obedience is rolled for each child/ },
  { name: 'a child’s roll is sent to the family’s page', file: WORLD, from: '    ...(e.carriedBy && { carriedBy: e.carriedBy }),', to: '    ...(e.carriedBy && { carriedBy: e.carriedBy }), ...(e.traits?.obedience && { obedience: e.traits.obedience }),', test: T.childhood, expect: /obedience is rolled for each child/ },
  { name: 'how long a child’s automation lasts is sent to the page', file: WORLD, from: '    ...(e.carriedBy && { carriedBy: e.carriedBy }),', to: '    ...(e.carriedBy && { carriedBy: e.carriedBy }), ...(e.childAuto && { childAuto: e.childAuto }),', test: T.childhood, expect: /obedience is rolled for each child/ },
  { name: 'an old child’s roll is written back into the save', file: FAMILY, from: 'export const obedienceOf = (world, entity) => entity?.traits?.obedience ?? obedienceRoll(world?.seed, entity?.id);', to: 'export const obedienceOf = (world, entity) => entity?.traits ? (entity.traits.obedience ??= obedienceRoll(world?.seed, entity?.id)) : obedienceRoll(world?.seed, entity?.id);', test: T.childhood, expect: /saved before there was a roll/ },
  { name: 'an old child is given a roll that is not their seed and id', file: FAMILY, from: 'export const obedienceOf = (world, entity) => entity?.traits?.obedience ?? obedienceRoll(world?.seed, entity?.id);', to: 'export const obedienceOf = (world, entity) => entity?.traits?.obedience ?? 10;', test: T.childhood, expect: /saved before there was a roll/ },
  // Babies (FIC-GONZ-482 to -486).
  { name: 'a baby never crawls', file: BABIES, from: '      baby.location = { x: r4(spot.x + Math.cos(turn) * far), y: r4(spot.y + Math.sin(turn) * far), siteId: place };', to: '', test: T.babies, expect: /a baby crawls about/ },
  { name: 'the nearest of anybody comes, not the nearest woman of age', file: BABIES, from: '  const carer = nearest(free.filter(womanOfAge)) || nearest(free);', to: '  const carer = nearest(free);', test: T.babies, expect: /held by the nearest woman of age/ },
  { name: 'she is not put back where she stood', file: BABIES, from: '  person.location = { x: was.x, y: was.y, siteId: was.siteId };', to: '', test: T.babies, expect: /held by the nearest woman of age/ },
  { name: 'her work goes on while she holds the baby', file: CHORES, from: '  if (calledAside(entity)) return;\n  const state = entity.chore;', to: '  const state = entity.chore;', test: T.babies, expect: /held by the nearest woman of age/ },
  { name: 'no cap on a day’s holding', file: BABIES, from: '(sick || takenToday(world, person) < COMFORT_CAP_TICKS)', to: '(true)', test: T.babies, expect: /cap of one person’s day/ },
  { name: 'a sick baby is held to the cap', file: BABIES, from: '(sick || takenToday(world, person) < COMFORT_CAP_TICKS)', to: '(takenToday(world, person) < COMFORT_CAP_TICKS)', test: T.babies, expect: /cap of one person’s day/ },
  { name: 'a child minding the baby does not answer it', file: BABIES, from: '  if (minder) {', to: '  if (false) {', test: T.babies, expect: /who comes/ },
  { name: 'a second woman is stopped for a twin', file: BABIES, from: '  if (holder) {', to: '  if (false) {', test: T.babies, expect: /who comes/ },
  { name: 'the only woman of age leaves the baby behind', file: BABIES, from: '  if (!babies.length) return;', to: '  return;', test: T.babies, expect: /only woman of age/ },
  { name: 'she takes the baby with another woman of age at home', file: BABIES, from: '  if (woman) {', to: '  if (false) {', test: T.babies, expect: /only woman of age/ },
  { name: 'a carried baby is never set down at home', file: BABIES, from: '      delete baby.carriedBy;\n      baby.travel = null;', to: '      baby.travel = null;', test: T.babies, expect: /only woman of age/ },
  { name: 'a child talking holds her as well as the baby', file: BABIES, from: '    if (child?.talk?.withId !== carer.id) continue;', to: '    continue;', test: T.babies, expect: /never hold each other up/ },
  { name: 'a four-hour tick is stopped for a baby', file: BABIES, from: 'if (slow && played) comfort', to: 'if (played) comfort', test: T.babies, expect: /calendar too fast/ },
  { name: 'a family nobody plays is stopped by its babies', file: BABIES, from: "    const played = household.played && !household.absent && world.status === 'running';\n    if (!played) continue;", to: "    const played = world.status === 'running';\n    if (!played) continue;", test: T.babies, expect: /calendar too fast/ },
  // The Scrape's own work (FIC-GONZ-487 to -489, HIST-TEX-639, -640).
  { name: 'the flight’s work is offered on the farm before anybody is told to leave', file: FLIGHT, from: '  if (chore.before) return toldToGo(household) && entity.location', to: '  if (chore.before) return entity.location', test: T.flight, expect: /offered only while the family is told to leave/ },
  { name: 'hiding hides nothing', file: FLIGHT, from: '  if (!flight?.hid) return left;', to: '  return left;', test: T.flight, expect: /what is hidden before the family leaves/ },
  { name: 'what was hidden is never dug up', file: FLIGHT, from: '  for (const [good, amount] of found) household.resources[good] = (household.resources[good] ?? 0) + amount;', to: '', test: T.flight, expect: /what is hidden before the family leaves/ },
  { name: 'a child’s bundle carries nothing', file: FLIGHT, from: '.length * BUNDLE_ROOM);', to: '.length * 0);', test: T.flight, expect: /bundle carries more/ },
  { name: 'a lookout sees no further', file: FLIGHT, from: '(lookoutOf(world, household) ? LOOKOUT_MILES : standard)', to: '(standard)', test: T.flight, expect: /a lookout sees the army further off/ },
  { name: 'singing wears the walkers as much', file: FLIGHT, from: 'export const SINGING_SHARE = 0.75;', to: 'export const SINGING_SHARE = 1;', test: T.flight, expect: /a lookout sees the army further off/ },
  { name: 'the little ones kept walking go no faster', file: FLIGHT, from: '!(hurried && ageOf(one) < 6)', to: 'true', test: T.flight, expect: /a lookout sees the army further off/ },
  { name: 'the faster pace is kept when nobody keeps the little ones walking', file: FLIGHT, from: '    else if (!now && flight.hurried) {', to: '    else if (false) {', test: T.flight, expect: /a lookout sees the army further off/ },
  { name: 'a fire kept lasts only the day', file: FLIGHT, from: 'household.flight.fireDay >= day - 1', to: 'household.flight.fireDay === day', test: T.flight, expect: /a fire keeps the cold off/ },
  { name: 'the ferry can be helped at twice', file: FLIGHT, from: 'household.flight.crossing.helped ? ', to: 'false ? ', test: T.flight, expect: /a fire keeps the cold off/ },
  { name: 'help at the ferry brings the turn no sooner', file: FLIGHT, from: '      crossing.until = Math.max(world.minute, crossing.until - FERRY_HELP_HOURS * 60);', to: '', test: T.flight, expect: /a fire keeps the cold off/ },
  { name: 'food shared reaches nobody', file: FLIGHT, from: '      other.resources.food = Math.round(', to: '      other.resources.food = 0 * Math.round(', test: T.flight, expect: /a fire keeps the cold off/ },
  { name: 'carried over, the family still waits for the boat', file: FLIGHT, from: '      delete flight.crossing;', to: '', test: T.flight, expect: /carry its little ones over/ },
  { name: 'a sick child is not let over first', file: FLIGHT, from: '  return sickChild(world, household) ? hours * SICK_FIRST_SHARE : hours;', to: '  return hours;', test: T.flight, expect: /carry its little ones over/ },
  { name: 'a child’s flight work is never dawdled over', file: FLIGHT, from: 'if (chore.job && tooYoung(entity)) beginsJob(', to: 'if (false) beginsJob(', test: T.flight, expect: /a job, and a child’s obedience/ },
  // The ladder, the lesson and the icons (FIC-GONZ-475).
  { name: 'the stick horse is kept past seven', file: CHILDREN, from: "Object.freeze({ 'child-stick-horse': 7, 'child-hens': 7 });", to: "Object.freeze({ 'child-hens': 7 });", test: T.children, expect: /the age ladder decides/ },
  { name: 'tag is offered at two', file: CHILDREN, from: "  'child-tag': 3,", to: "  'child-tag': 2,", test: T.children, expect: /the age ladder decides/ },
  { name: 'the lesson refuses a child marbles', file: LESSON, from: "  'chore:child-marbles', 'chore:child-hens',", to: "  'chore:child-hens',", test: T.children, expect: /the lesson never refuses a child/ },
  { name: 'a flight work has no icon', file: PANEL, from: "    'flee-hide', 'flee-bundle', 'road-lookout',", to: "    'flee-hide', 'road-lookout',", test: T.panel, expect: /every chore and every order has an icon/ },
];

const failing = output => [...output.matchAll(/^✖ (.+?) \(\d/gm)].map(match => match[1]).filter((name, i, all) => name !== 'failing tests:' && all.indexOf(name) === i);
const run = file => { const result = spawnSync(process.execPath, ['--test', file], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }); return failing(`${result.stdout}${result.stderr}`); };

const only = process.argv[2] ? new RegExp(process.argv[2]) : null;
const chosen = INJECTIONS.filter(injection => !only || only.test(injection.name));
for (const file of new Set(chosen.map(injection => injection.test))) {
  const clean = run(file);
  if (clean.length) throw new Error(`${file} fails before any injection: ${clean.join('; ')}`);
}
const record = [];
for (const injection of chosen) {
  const file = injection.file;
  const original = readFileSync(file, 'utf8');
  const CR = String.fromCharCode(13), LF = String.fromCharCode(10);
  const ends = text => (original.includes(CR + LF) ? text.split(LF).join(CR + LF) : text);
  const from = ends(injection.from), to = ends(injection.to);
  const count = original.split(from).length - 1;
  if (count !== 1) throw new Error(`${injection.name}: the text to replace is in ${file} ${count} times`);
  writeFileSync(file, original.replace(from, to));
  let failed;
  try { failed = run(injection.test); } finally { writeFileSync(file, original); }
  const caught = failed.some(name => injection.expect.test(name));
  const alone = caught && failed.length === 1;
  record.push({ name: injection.name, file, test: injection.test, caught, alone, failed });
  console.log(`${caught ? (alone ? 'caught alone' : 'caught') : 'MISSED'}: ${injection.name} -> ${failed.join(' | ') || 'nothing failed'}`);
}
for (const file of new Set(chosen.map(injection => injection.test))) if (run(file).length) throw new Error(`${file} fails after every file was put back`);
if (!only) {
  mkdirSync('docs/evidence', { recursive: true });
  writeFileSync('docs/evidence/childhood-injections.json', `${JSON.stringify({
    record: 'childhood-injections',
    date: new Date().toISOString().slice(0, 10),
    note: 'Children at play, the idle child and the parent, a child’s automation and obedience, babies, and the Runaway Scrape’s own work (docs/CHILDREN.md, 2026-09-26). Each injection is run against the one test file that guards it; "alone" means the test named for the rule was the only one in that file to fail.',
    injections: record,
  }, null, 2)}\n`);
}
console.log(`\n${record.filter(r => r.caught).length} of ${record.length} caught, ${record.filter(r => r.alone).length} alone${only ? '' : '; wrote docs/evidence/childhood-injections.json'}`);
