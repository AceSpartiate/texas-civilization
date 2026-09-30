// Two class periods: docs/COLONIES.md §7e and build step 8(a), decided by the owner by multiple choice (2026-09-16).
//
// "Day 1 ends after Béxar and saves; day 2 opens the same families in January 1836." The first period is the class every
// real-land class has always been, ending on the evening of December 15 when word of Béxar reaches the government. It
// ends with **interim standings** - since 2026-09-28 without glory or a ranking, which VISION §20 keeps for the ending
// (sim/ending.mjs `interimFamily`, `interimHost`) - rather than a winner, because the war
// is not over. The Host then **continues** the class instead of starting a new one: the same save, the same family keys,
// the same people.
//
// The weeks between are **skipped gently**, which is the owner's answer: everyone who went home arrives home; wounds heal
// by the time that passed, so a dangerous wound from the storming may still be mending; the family eats an ordinary
// winter, and nobody starves over time nobody could play. Nothing else happens in them - no work, no trade, no news beyond
// what was already on the road. `FIC-GONZ-044`.
//
// The second period opens at dawn on **January 25, 1836** with the farming scale, the ten quiet minutes a class starts
// with, and then the winter's news on the campaign calendar. Its dated moments are in `sim/directors.mjs` TIMELINE.
import { record } from './events.mjs';
import { learn } from './knowledge.mjs';
import { expireCalls } from './calls.mjs';
import { momentOf } from './directors.mjs';
import { eatenADay } from './family.mjs';
import { closeLessons } from './lesson.mjs';
import { settleExpresses } from './expresses.mjs';

/** The period a class is in: absent on every class saved before there were two, which were all the first. */
export const periodOf = world => world.period || 1;

/**
 * Whether the Host can carry this class on into the second period: the first period has ended where it ends, on the
 * real land of the colonies. The invented Gonzales country ends at the fight and has no winter to go on to.
 */
export function canContinue(world) {
  if (world.status !== 'ended' || !world.map?.source) return false;
  if (periodOf(world) === 1) return Boolean(world.director?.milestones?.['bexar-end']);
  // The third period, the spring of 1836 (docs/COLONIES.md §7g), follows the second's end on the night of March 13.
  if (periodOf(world) === 2) return Boolean(world.director?.milestones?.['alamo-end']);
  return false;
}
/** What the Host's button says: the period that follows this one. */
export const nextPeriodLabel = world => periodOf(world) === 1 ? 'Continue to the winter of 1836' : 'Continue to the spring of 1836';

/**
 * A class ended part-way through a period (owner, 2026-09-28: "Yes, allow Continue"; docs/HOST_PAGE.md §2.8): the teacher's
 * End Game, before the period reached its own end. Every period's own end (the director's four, sim/directors.mjs) sets
 * `director.complete` in the same step as `ended`; End Game sets only `status`, and nothing ticks or takes an order while a class
 * is ended, so the world is the world the moment before - its status apart. The ending, the standings and the flashbacks are all
 * read from that status (sim/ending.mjs `endingProjection`, sim/flashback.mjs `flashbackReady`), and go with it.
 */
export const endedEarly = world => world?.status === 'ended' && !world.director?.complete;
/** Why this class cannot be taken up again, or null. */
export function continueRefusal(world) {
  if (world?.status !== 'ended') return 'This class has not ended.';
  if (world.director?.complete) return canContinue(world) ? `This period ended where it ends: press ${nextPeriodLabel(world)} instead.` : 'This class came to its own end, and cannot be taken up again.';
  return null;
}
/** Take up a class ended by mistake where it was ended, paused for the teacher's Resume. Written in the Host's record only. */
export function continueEnded(world) {
  const why = continueRefusal(world);
  if (why) throw new Error(why);
  world.status = 'paused';
  // The end sequence belonged to that ending (sim/end-sequence.mjs), as its videos did.
  delete world.endSequence;
  record(world, 'lifecycle', { visibility: 'host', importance: 2, text: 'The teacher took the class up again where End Game had ended it, paused.' });
}

/** Whether the standings a class ends with are interim: the first period, which a second follows. */
export const interimStandings = world => Boolean(world.map?.source) && ((periodOf(world) === 1 && Boolean(world.director?.milestones?.['bexar-end'])) || (periodOf(world) === 2 && Boolean(world.director?.milestones?.['alamo-end'])));

/** How many days of what the family eats it is always left over the winter, so nobody starves over time nobody played. */
export const WINTER_FLOOR_DAYS = 14;

const GONE = ['dead', 'captured'];
const round = value => Math.round(value * 10000) / 10000;

/** Put somebody down at a site, off whatever road they were on. */
function setDown(world, entity, siteId) {
  const site = world.map.sites[siteId];
  if (!site) return;
  entity.travel = null;
  entity.location = { x: site.x, y: site.y, siteId };
}

/**
 * The weeks nobody plays, and the second period opened. Returns the id of the event that says so.
 *
 * ceiling: nothing is played over the gap - no crop grows, nothing spoils, no neighbour trades - and the families nobody
 * plays are carried over exactly as the families somebody plays are. If a class ever wants the winter to have happened to
 * the farms, it is `advanceRoutine` run over these days with spoilage, and the owner's "nobody starves" kept as the floor.
 */
export function beginSecondPeriod(world) {
  if (!canContinue(world) || periodOf(world) !== 1) throw new Error('Only a class that has finished its first period can go on to the winter.');
  const opens = momentOf(world, 'winter-opens');
  const days = Math.max(0, (opens - world.minute) / 1440);

  // Word still on the road at the end of the first period has arrived by January, from whoever carried it.
  expireCalls(world);
  for (const encounter of Object.values(world.encounters || {})) {
    if (encounter.status !== 'open') continue;
    encounter.status = 'closed'; encounter.closedMinute = world.minute; encounter.reason = 'winter';
  }
  for (const carrier of Object.values(world.entities)) {
    if (!carrier.courier) continue;
    const report = carrier.report;
    if (report && world.households[report.audience] && world.truth[report.topicId]) {
      learn(world, report.audience, report.topicId, { status: report.status, source: 'Word that came over the winter' });
    }
    delete carrier.report;
    const at = carrier.travel?.to || report?.destination || carrier.location.siteId;
    setDown(world, carrier, world.map.sites[at] ? at : carrier.location.siteId || Object.keys(world.map.sites)[0]);
    // And gone home over the winter, errand done (owner, 2026-09-27; sim/encounters.mjs `advanceDepartures`): nobody finds a
    // rider from October still standing where he stopped when January opens.
    // An express still carrying word between settlements keeps it, and brings it in as before.
    if (!carrier.express) { delete carrier.leaving; carrier.gone = true; }
  }
  // Word the families were hearing by express (sim/expresses.mjs, docs/COLONIES.md §5.4d) has reached the last of them too.
  settleExpresses(world, 'Word that came over the winter');
  // An offer is a thing said face to face (sim/trade.mjs), and nobody stood together over the winter.
  world.offers = {};
  // The guided start is the first period's (owner, 2026-09-28: "end the tutorial for a family when the first period ends"):
  // every family still on a step is let go, and the winter's choices are never met with "Not yet" (sim/lesson.mjs).
  closeLessons(world);

  // Everyone who went home arrives home; anyone still lying wounded stays where the surgeon has them until the wound mends.
  const lying = [];
  for (const household of Object.values(world.households)) {
    const home = household.homeSiteId;
    for (const id of [...household.members, ...(household.property || [])]) {
      const entity = world.entities[id];
      if (!entity || GONE.includes(entity.health?.condition)) continue;
      const mending = entity.health?.condition === 'wounded' && Number.isFinite(entity.health.recoversAt) && entity.health.recoversAt > opens;
      if (['wounded', 'minor-injury'].includes(entity.health?.condition) && !mending) entity.health = { condition: 'well' };
      if (entity.health?.condition === 'tired') entity.health = { condition: 'well' };
      if (entity.kind === 'person') {
        entity.exertion = 0;
        entity.chore = null;
        entity.task = 'rest';
        for (const promise of entity.commitments || []) if (promise.status === 'active' && promise.id === 'volunteer') promise.status = 'ended';
      }
      if (entity.borrowedBy && !mending) entity.borrowedBy = null;
      // Still lying wounded where the surgeon has them, outside any service: the family is told so below, since the winter
      // opens with the men home. When the wound mends they are told again and start home (sim/army.mjs `sendMendedHome`).
      if (mending && entity.kind === 'person' && entity.location?.siteId && entity.location.siteId !== home && entity.service?.status !== 'serving') lying.push(entity);
      if (mending) continue;
      setDown(world, entity, home);
    }
    // An ordinary winter's eating for whoever was at home through it, and never below a fortnight's food. Each eats by their
    // age (sim/family.mjs `eatenADay`, FIC-GONZ-360).
    // ceiling: ages as they are on the evening the first period ends, for all the weeks after; a child whose birthday falls
    // in the gap eats the winter at the band below, a quarter of a share for at most seven weeks. Worth a day-by-day sum only
    // if the winter ever has anything else happen in it.
    const eaten = eatenADay(world, household.members.map(id => world.entities[id]).filter(person => person && !GONE.includes(person.health?.condition)));
    const food = household.resources?.food ?? 0;
    const floor = Math.min(food, eaten * WINTER_FLOOR_DAYS);
    if (household.resources) household.resources.food = round(Math.max(floor, food - eaten * days));
  }
  // The army went home in December; nobody is in it over the winter.
  if (world.army) world.army.members = [];

  world.period = 2;
  world.minute = opens;
  world.director.complete = false;
  world.director.phase = 'home';
  world.status = 'paused';
  const opened = record(world, 'period-opens', {
    visibility: 'public', importance: 3, classification: 'FICTIONAL FOR GAMEPLAY', claimId: 'FIC-GONZ-044',
    text: 'The winter has passed. It is January 25, 1836. The men who took Béxar are home, and the families are at work on their land again. The war is not over.',
  });
  // Except a man still lying wounded (design audit S13): his family is told where he is, and that he comes home when he mends.
  for (const person of lying) record(world, 'consequence', { actorId: person.id, householdId: person.householdId, importance: 3, classification: 'FICTIONAL FOR GAMEPLAY', claimId: 'FIC-GONZ-041', causes: [opened], text: `${person.name} is still lying wounded at ${world.map.sites[person.location.siteId]?.name || 'the surgeon’s'}, and will start home when the wound mends.` });
  return opened;
}

/**
 * The third period, the spring of 1836 (docs/COLONIES.md §7g): the same class carried on from the night Gonzales burned to
 * dawn on March 14, seven hours later. There is no winter to skip: everybody is where they were, the roads are as they were,
 * and the families of Gonzales are told to leave that morning (sim/scrape.mjs). Paused, so the teacher starts it.
 */
export function beginThirdPeriod(world) {
  if (!canContinue(world) || periodOf(world) !== 2) throw new Error('Only a class that has finished its second period can go on to the spring.');
  world.period = 3;
  world.minute = Math.max(world.minute, momentOf(world, 'scrape-opens'));
  world.director.complete = false;
  world.director.phase = 'gathering';
  world.status = 'paused';
  return record(world, 'period-opens', {
    visibility: 'public', importance: 3, classification: 'FICTIONAL FOR GAMEPLAY', claimId: 'FIC-GONZ-046',
    text: 'Dawn, March 14, 1836. Gonzales is ashes behind the army, and the Mexican columns are coming east. The war has come to the families now.',
  });
}
/** The next period, whichever it is. */
export const beginNextPeriod = world => periodOf(world) === 1 ? beginSecondPeriod(world) : beginThirdPeriod(world);
