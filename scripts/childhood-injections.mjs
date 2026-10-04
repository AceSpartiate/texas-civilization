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
const SCRAPE = 'sim/scrape.mjs', ROAD = 'sim/road.mjs';
const WORLD = 'sim/world.mjs', CHORES = 'sim/chores.mjs', CHILDREN = 'sim/children.mjs', LESSON = 'sim/lesson.mjs', PANEL = 'public/family-panel.js';
const DAY = 'sim/child-day.mjs';
const T = {
  childhood: 'tests/childhood.test.mjs', babies: 'tests/babies.test.mjs', flight: 'tests/flight-work.test.mjs', children: 'tests/children.test.mjs', panel: 'tests/family-panel.test.mjs',
};
const INJECTIONS = [
  // The idle child and the parent (FIC-GONZ-476, -477).
  { name: 'the idle child never goes to anybody', file: CHILDHOOD, from: '    if (world.tick - child.idleSince < IDLE_TICKS) continue;', to: '    if (world.tick - child.idleSince < 9999) continue;', test: T.childhood, expect: /goes to the nearest parent/ },
  { name: 'the parent’s work goes on while the child talks', file: CHORES, from: '  if (calledAside(entity)) return;\n', to: '', test: T.childhood, expect: /goes to the nearest parent/ },
  { name: 'the child goes to the furthest parent, not the nearest', file: CHILDHOOD, from: 'dist(a) - dist(b) || a.id.localeCompare(b.id)', to: 'dist(b) - dist(a) || a.id.localeCompare(b.id)', test: T.childhood, expect: /goes to the nearest parent/ },
  { name: 'the parent is never let go when the talk ends', file: CHILDHOOD, from: '    if (!grown.aside.childIds.length) delete grown.aside;', to: '', test: T.childhood, expect: /goes to the nearest parent/ },
  { name: 'a stopped parent can be given new work', file: WORLD, from: '  if (asideRefuses(entity) && ASIDE_REFUSED.has(input.action)) throw', to: '  if (false && asideRefuses(entity) && ASIDE_REFUSED.has(input.action)) throw', test: T.childhood, expect: /goes to the nearest parent/ },
  // Since the field's own order (plant-field) also lets the child go, the line is named by the comment over the chore's.
  { name: 'a one-tick job for the child leaves the parent standing', file: WORLD, from: '    // A child given something to do lets go of the grown-up they were talking with, there and then (sim/childhood.mjs).\n    released(world, entity);', to: '', test: T.childhood, expect: /record hears of a child’s talk once a day/ },
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
  { name: 'a child’s automation goes on for ever', file: CHILDHOOD, from: "  if (dayOver(world, entity.childAuto)) return autoOff(world, household, entity, 'time');", to: '', test: T.childhood, expect: /own automation/ },
  { name: 'a child’s automation goes off without a notice on the row', file: CHILDHOOD, from: '  entity.autoNotice = { tick: world.tick, why };', to: '', test: T.childhood, expect: /own automation/ },
  // Until the day ends (owner, 2026-09-29, "Until the day ends"; sim/child-day.mjs).
  { name: 'a child’s automation goes off before the day is out', file: CHILDHOOD, from: "  if (dayOver(world, entity.childAuto)) return autoOff(world, household, entity, 'time');", to: "  if (world.tick - entity.childAuto.since >= 18) return autoOff(world, household, entity, 'time');", test: T.childhood, expect: /own automation/ },
  { name: 'no "!" when a child’s auto goes off (page)', file: PANEL, from: "  if (entity.autoOff) needs.push(", to: "  if (false) needs.push(", test: T.childhood, expect: /own automation/ },
  { name: 'no "!" when a child’s auto goes off (server)', file: WORLD, from: '    ...(autoOffAsking(e) && { autoOff: true }),', to: '', test: T.childhood, expect: /own automation/ },
  { name: 'the "!" leaves with the notice, before the child is given anything', file: CHILDHOOD, from: ' >= NOTICE_TICKS && !autoOffAsking(entity)) delete entity.autoNotice;', to: ' >= NOTICE_TICKS) delete entity.autoNotice;', test: T.childhood, expect: /own automation/ },
  { name: 'the "!" stays on a child given something to do', file: CHILDHOOD, from: '  if (child?.autoNotice) delete child.autoNotice;', to: '', test: T.childhood, expect: /own automation/ },
  { name: 'a child’s play goes its old two hours, not the day', file: CHORES, from: '    if (step.allDay && !state.spell) {', to: '    if (false) {', test: T.childhood, expect: /play lasts until the day ends/ },
  { name: 'a spell of play on auto lasts the whole day', file: CHORES, from: '...(extra.spell && chore.play && { spell: true }), ', to: '', test: T.childhood, expect: /play lasts until the day ends/ },
  { name: 'on a four-hour tick a child’s day is over in six ticks', file: DAY, from: ' && world.tick - since >= DAY_FLOOR_TICKS;', to: ';', test: T.childhood, expect: /play lasts until the day ends/ },
  { name: 'a child’s play writes "set out" every time', file: CHORES, from: "  } else if (chore.play ? firstPlayToday(world, entity) : ", to: "  } else if (chore.play ? true : ", test: T.childhood, expect: /at most once a day/ },
  // Triage 2026-09-29, 2.3, the second half: each kind of play's own line once a day, and no bare "finished:" for play.
  { name: 'every spell of play writes its own line again', file: CHILDREN, from: 'const playedToday = (world, entity, kind) => onceToday(world, entity, `played:${kind}`);', to: 'const playedToday = () => true;', test: T.childhood, expect: /each kind of a child’s play is written/ },
  { name: 'every spell of play ends with a bare "finished:"', file: CHORES, from: "  if (!chore.play && !onAuto) record(world, 'consequence', { actorId: entity.id, householdId: household.id, text: `${entity.name} finished: ", to: "  if (!onAuto) record(world, 'consequence', { actorId: entity.id, householdId: household.id, text: `${entity.name} finished: ", test: T.childhood, expect: /each kind of a child’s play is written/ },
  // The rest of 2.3 (2026-10-03): a child's own jobs on auto - each kind once a day, no bare "finished:", a job the student gives told every time.
  { name: 'every job on auto writes "set out" again', file: CHORES, from: " : !entity.chore.onAuto || onceToday(world, entity, `set-out:${choreId}`)) record(world, 'assignment'", to: " : true) record(world, 'assignment'", test: T.childhood, expect: /each kind of a child’s job on auto/ },
  { name: 'every job on auto writes its own line again', file: CHILDREN, from: 'const workedToday = (world, entity, id) => onceToday(world, entity, `worked:${id}`);', to: 'const workedToday = () => true;', test: T.childhood, expect: /each kind of a child’s job on auto/ },
  { name: 'every job on auto ends with a bare "finished:"', file: CHORES, from: "  if (!chore.play && !onAuto) record(world, 'consequence'", to: "  if (!chore.play) record(world, 'consequence'", test: T.childhood, expect: /each kind of a child’s job on auto/ },
  { name: 'a job the student gives is quieted as if on auto', file: CHORES, from: '...(extra.spell && chore.childJob && !chore.play && { onAuto: true }), ', to: '...(chore.childJob && !chore.play && { onAuto: true }), ', test: T.childhood, expect: /each kind of a child’s job on auto/ },
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
  { name: 'her work goes on while she holds the baby', file: CHORES, from: '  if (calledAside(entity)) return;\n', to: '', test: T.babies, expect: /held by the nearest woman of age/ },
  { name: 'no cap on a day’s holding', file: BABIES, from: '(sick || takenToday(world, person) < COMFORT_CAP_TICKS)', to: '(true)', test: T.babies, expect: /cap of one person’s day/ },
  { name: 'a sick baby is held to the cap', file: BABIES, from: '(sick || takenToday(world, person) < COMFORT_CAP_TICKS)', to: '(takenToday(world, person) < COMFORT_CAP_TICKS)', test: T.babies, expect: /cap of one person’s day/ },
  { name: 'a child minding the baby does not answer it', file: BABIES, from: '  if (minder) {', to: '  if (false) {', test: T.babies, expect: /who comes/ },
  { name: 'a second woman is stopped for a twin', file: BABIES, from: '  if (holder) {', to: '  if (false) {', test: T.babies, expect: /who comes/ },
  { name: 'the only woman of age leaves the baby behind', file: BABIES, from: '  if (!babies.length) return;', to: '  return;', test: T.babies, expect: /only woman of age/ },
  { name: 'she takes the baby with another woman of age at home', file: BABIES, from: '  if (woman) {', to: '  if (false) {', test: T.babies, expect: /only woman of age/ },
  { name: 'a carried baby is never set down at home', file: BABIES, from: '      delete baby.carriedBy;\n      baby.travel = null;', to: '      baby.travel = null;', test: T.babies, expect: /only woman of age/ },
  // A baby on her hip on foot (owner 2026-09-27, FIC-GONZ-630).
  { name: 'hip: she walks at her own pace with the baby on her hip', file: BABIES, from: '  if (travel.speed > slowed) travel.speed = slowed;', to: '', test: T.babies, expect: /quarter slower on foot/ },
  { name: 'hip: the baby slows her on the horse and with the wagon too', file: BABIES, from: "  if (!travel || travel.mode !== 'foot' || !babiesCarriedBy(world, entity).length) return;", to: '  if (!travel || !babiesCarriedBy(world, entity).length) return;', test: T.babies, expect: /quarter slower on foot/ },
  { name: 'hip: her row does not say why she is slower', file: BABIES, from: '    if (entity.travel.hip) return `On foot with', to: '    if (false) return `On foot with', test: T.babies, expect: /quarter slower on foot/ },
  { name: 'hip: she walks home at her own pace with the baby still on her hip', file: WORLD, from: '{ takeBabyAlong(world, entity); hipPace(world, entity); }', to: '{ takeBabyAlong(world, entity); if (entity.travel.from === world.households[entity.householdId].homeSiteId) hipPace(world, entity); }', test: T.babies, expect: /quarter slower on foot/ },
  { name: 'a child talking holds her as well as the baby', file: BABIES, from: '    if (child?.talk?.withId !== carer.id) continue;', to: '    continue;', test: T.babies, expect: /never hold each other up/ },
  { name: 'a four-hour tick is stopped for a baby', file: BABIES, from: 'if (slow && played) comfort', to: 'if (played) comfort', test: T.babies, expect: /calendar too fast/ },
  { name: 'a family nobody plays is stopped by its babies', file: BABIES, from: "    const played = household.played && !household.absent && world.status === 'running';\n    if (!played) continue;", to: "    const played = world.status === 'running';\n    if (!played) continue;", test: T.babies, expect: /calendar too fast/ },
  // The Scrape's own work (FIC-GONZ-487 to -489, HIST-TEX-639, -640).
  { name: 'the flight’s work is offered on the farm before anybody is told to leave', file: FLIGHT, from: '  if (chore.before) return mayMakeReady(world, household) && entity.location', to: '  if (chore.before) return entity.location', test: T.flight, expect: /offered only while the family is told to leave/ },
  { name: 'hiding hides nothing', file: FLIGHT, from: '  if (!flight?.hid) return left;', to: '  return left;', test: T.flight, expect: /what is hidden before the family leaves/ },
  { name: 'what was hidden is never dug up', file: FLIGHT, from: '  for (const [good, amount] of found) { if (isHouseholdGood(good)) restoreGood(household, good, amount); else household.resources[good] = (household.resources[good] ?? 0) + amount; }', to: '', test: T.flight, expect: /what is hidden before the family leaves/ },
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
  // The milk cow (owner 2026-09-27, FIC-GONZ-631).
  { name: 'cow: a family with no cattle is offered a milk cow', file: FLIGHT, from: '    shown: (world, household) => hasCow(household) || Boolean(readyingOf(household)?.cow),\n', to: '', test: T.flight, expect: /one milk cow on the run/ },
  { name: 'cow: a grown man drives the cow', file: FLIGHT, from: "fromAge: COW_FROM_AGE, toAge: COW_TO_AGE, job: true,", to: "fromAge: COW_FROM_AGE, job: true,", test: T.flight, expect: /one milk cow on the run/ },
  { name: 'cow: the cow is not taken out of the herd left on the range', file: FLIGHT, from: "  addToHerd(household, 'cattle', -1);\n  flight.cow = { by: driver.id, since: world.minute };", to: '  flight.cow = { by: driver.id, since: world.minute };', test: T.flight, expect: /one milk cow on the run/ },
  { name: 'cow: the cow stays at home with the herd', file: SCRAPE, from: '  takeCow(world, household, goers);\n', to: '', test: T.flight, expect: /one milk cow on the run/ },
  { name: 'cow: the child’s row does not say they drive her', file: WORLD, from: '|| cowLine(world, household, e) ||', to: '||', test: T.flight, expect: /one milk cow on the run/ },
  // Since 2026-10-02 she is milked by somebody (sim/milking.mjs; scripts/milking-injections.mjs), and gives nothing by herself.
  { name: 'cow: she milks herself again', file: FLIGHT, from: '  if (!cow.told) { cow.told = true;', to: '  household.resources.food += MILK_A_DAY;\n  if (!cow.told) { cow.told = true;', test: T.flight, expect: /gives nothing by herself/ },
  { name: 'cow: obedience does not govern her', file: FLIGHT, from: 'export const cowStrayChance = roll => wanderChance(roll) * 5;', to: 'export const cowStrayChance = roll => 0.05;', test: T.flight, expect: /gives nothing by herself/ },
  { name: 'cow: a child of a low roll loses her for good', file: FLIGHT, from: '    cow.strayDay = day;\n', to: '    cow.strayDay = day; if (obedienceOf(world, driver) < 5) delete flight.cow;\n', test: T.flight, expect: /gives nothing by herself/ },
  { name: 'cow: the army leaves the family its cow', file: ROAD, from: "  if (loseCow(household)) animals.push('the milk cow');\n", to: '', test: T.flight, expect: /taken if the Mexican army/ },
  { name: 'cow: she never comes home', file: SCRAPE, from: '      cowHome(world, household);\n', to: '', test: T.flight, expect: /taken if the Mexican army/ },
  // The cow's pace (owner 2026-09-27, "Slow a family on foot"; FIC-GONZ-631 amended).
  { name: 'cow pace: a family on foot is not slowed by her', file: FLIGHT, from: '    if (household.flight.cow && onFoot && one.travel.speed > COW_PACE) {', to: '    if (false) {', test: T.flight, expect: /milk cow’s pace/ },
  { name: 'cow pace: she is not the pace of cattle on the road', file: FLIGHT, from: 'export const COW_PACE = LEAD_PACE.cattle;', to: 'export const COW_PACE = LEAD_PACE.cattle / 2;', test: T.flight, expect: /milk cow’s pace/ },
  { name: 'cow pace: a family with no cow goes at a cow’s pace', file: FLIGHT, from: '    if (household.flight.cow && onFoot && one.travel.speed > COW_PACE) {', to: '    if (onFoot && one.travel.speed > COW_PACE) {', test: T.flight, expect: /milk cow’s pace/ },
  // A family with a wagon marked as held to her would also change the driver's row, which the first cow test reads too; the card is
  // this test's alone.
  { name: 'cow pace: a family with a wagon is told she slows it', file: FLIGHT, from: "export const heldToCow = (world, household) => Boolean(household?.flight?.cow) && household.members.some(id => world.entities[id]?.travel?.cow === true);", to: "export const heldToCow = (world, household) => Boolean(household?.flight?.cow) && ['fled', 'returning'].includes(household.flight.status);", test: T.flight, expect: /milk cow’s pace/ },
  { name: 'cow pace: the family leaves at a walker’s pace with her', file: SCRAPE, from: '  cowPace(world, household);\n  leaveStock(world, household);', to: '  leaveStock(world, household);', test: T.flight, expect: /milk cow’s pace/ },
  { name: 'cow pace: the driver’s row does not say why the family is slower', file: FLIGHT, from: "  if (entity.travel?.cow) return 'Driving the milk cow along", to: "  if (false) return 'Driving the milk cow along", test: T.flight, expect: /milk cow’s pace/ },
  { name: 'cow pace: the flight card is not told why the family is slower', file: SCRAPE, from: '...(heldToCow(world, household) && { cowPace: true })', to: '...(false && { cowPace: true })', test: T.flight, expect: /milk cow’s pace/ },
  { name: 'cow pace: the wagon left, the family on foot goes at a walker’s pace', file: ROAD, from: '  // On foot now: with the milk cow along, at her pace (sim/flight-work.mjs `cowPace`).\n  cowPace(world, household);\n', to: '', test: T.flight, expect: /milk cow’s pace/ },
  { name: 'cow pace: on to a further refuge at a walker’s pace', file: ROAD, from: '  // On foot with the milk cow, at her pace (sim/flight-work.mjs `cowPace`).\n  cowPace(world, household);\n  return true;', to: '  return true;', test: T.flight, expect: /milk cow’s pace/ },
  { name: 'cow pace: taken by the army, the family is still held to her', file: ROAD, from: '  // The cow taken, nobody is held to her pace any longer.\n  cowPace(world, household);\n', to: '', test: T.flight, expect: /milk cow’s pace/ },
  { name: 'cow pace: home on foot at a walker’s pace with her', file: SCRAPE, from: '    // Home on foot with the milk cow, at her pace (sim/flight-work.mjs `cowPace`).\n    cowPace(world, household);\n', to: '', test: T.flight, expect: /milk cow’s pace/ },
  { name: 'cow pace: the little ones kept walking go faster than she does', file: FLIGHT, from: '  // With the milk cow along on foot, no faster than her (owner, 2026-09-27).\n  cowPace(world, household);\n', to: '', test: T.flight, expect: /milk cow’s pace/ },
  // A baby's short word (owner 2026-09-27, "Show a short word").
  { name: 'word: a baby’s row is sent no short word', file: WORLD, from: '    ...(lifeWord && { lifeWord }),\n', to: '', test: T.babies, expect: /one short word/ },
  { name: 'word: a crying baby is given the word for crawling', file: BABIES, from: "cry: 'crying',", to: "cry: 'crawling',", test: T.babies, expect: /one short word/ },
  { name: 'word: a carried baby is given the word for what it was doing', file: BABIES, from: "  if (entity.carriedBy || entity.travel?.carried) return 'carried';\n", to: '', test: T.babies, expect: /one short word/ },
  { name: 'word: a grown-up is given a baby’s word', file: WORLD, from: '  const lifeWord = life && babyWord(world, household, e);', to: "  const lifeWord = life && (babyWord(world, household, e) || 'working');", test: T.babies, expect: /one short word/ },
  // The ladder, the lesson and the icons (FIC-GONZ-475).
  { name: 'the stick horse is kept past seven', file: CHILDREN, from: "Object.freeze({ 'child-stick-horse': 7, 'child-hens': 7 });", to: "Object.freeze({ 'child-hens': 7 });", test: T.children, expect: /the age ladder decides/ },
  { name: 'tag is offered at two', file: CHILDREN, from: "  'child-tag': 3,", to: "  'child-tag': 2,", test: T.children, expect: /the age ladder decides/ },
  { name: 'the lesson refuses a child marbles', file: LESSON, from: "  'chore:child-marbles', 'chore:child-hens',", to: "  'chore:child-hens',", test: T.children, expect: /the lesson never refuses a child/ },
  { name: 'a flight work has no icon', file: PANEL, from: "    'flee-hide', 'flee-bundle', 'flee-cow', 'road-lookout',", to: "    'flee-hide', 'flee-cow', 'road-lookout',", test: T.panel, expect: /every chore and every order has an icon/ },
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
    note: 'Children at play, the idle child and the parent, a child’s automation and obedience, babies, and the Runaway Scrape’s own work (docs/CHILDREN.md, 2026-09-26); a child’s play and automation until the day ends, and the "!" when a child’s auto goes off (2026-09-29). Each injection is run against the one test file that guards it; "alone" means the test named for the rule was the only one in that file to fail.',
    injections: record,
  }, null, 2)}\n`);
}
console.log(`\n${record.filter(r => r.caught).length} of ${record.length} caught, ${record.filter(r => r.alone).length} alone${only ? '' : '; wrote docs/evidence/childhood-injections.json'}`);
