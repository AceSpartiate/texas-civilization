// Houston's camp: what a man serving with Houston's army does between joining and San Jacinto. docs/HOUSTON_CAMP.md,
// researched in `HIST-TEX-075` to `-083`; the game's own rules are `FIC-GONZ-053` to `-056`.
//
// Owner (2026-09-16): "Soldiers in Houston's Army should have things to do too. Drilling, etc." Before this a man who joined
// Houston stood at the camp and did nothing until he was sent for or the battle came. Now his row has the camp's work, each
// in the shape every chore has - steps, a cost in days, a refusal in words - and each with a consequence the family reads:
//
// - **Drill** (`camp-drill`): a day with the company. Three days make him steady in the line (`DRILL_TO_STEADY`), which
//   counts at San Jacinto: the record says the fortnight's drill at Groce's "had a good effect in disciplining us"
//   (`HIST-TEX-075`), so a drilled man's weight in the battle's roll is three quarters of his frailty
//   (`DRILLED_STEADINESS` in sim/houston.mjs, applied through `rollFates`' `weightOf`). No new die: the battle's one seeded
//   roll is what it was; drilling moves the line it is read against, and the record says so when the word comes.
// - **Forage** (`camp-forage`): a day out for the mess - beef and corn from the farms the families left and from Groce's
//   (`HIST-TEX-077`). Said in the family's record.
// - **Guard** (`camp-guard`): a night on the camp guard (`HIST-TEX-083`). Said.
// - **Scout** (`camp-scout`): a day out with the scouts, only with a horse at hand; the scouts met the enemy's patrols, and
//   about two in a hundred outings bring a man back slightly hurt (`SCOUT_HURT`, by a hashed share of the outing - the
//   road's and the massacre's way; the control says a scout can be hurt).
// - **Two questions** the army puts to him, on his card with a "!": with the word of Fannin's defeat (March 25), whether
//   he leaves to see to his family, as many did (`HIST-TEX-076`; a regular who leaves has deserted, and the card says so);
//   and at the fork of the road on April 16, the right-hand road to Harrisburg and the enemy or the left to Nacogdoches
//   (`HIST-TEX-082`). The army goes right whatever he says - it did - and a man who called for the enemy's road has a part
//   in the record (`forward`, sim/glory.mjs).
//
// The camp's work is a supporting part (docs/MONEY_AND_GLORY.md §4): one award, `served`, the first time a man does any of
// it, weighted like carrying supplies, so it never rivals the fight's own. A family nobody plays, a family whose student
// has gone, and a man on auto do the camp's work at documented rates (`campChoice`) and answer the questions the tick they
// are asked at the same shares (`FIC-GONZ-055`), so nobody's man sits idle and nobody's odds change with the switch.
//
// The chores are registered into the one table (`registerChores`) and keep their rules here: `offered` (who sees them),
// `refusal` (why not now) and `run` (what the last step does) are the hooks sim/chores.mjs gives a chore kept in its own
// module. Nothing here reads glory, and nothing is stored that an old save lacks a correct empty value for: `drilled`,
// `leave`, `road` and `camp` on the service are absent until earned or asked.
import { CHORES, abandonChore, registerChores } from './chores.mjs';
import { record } from './events.mjs';
import { awardGlory } from './glory.mjs';
import { WOUND_GRADES } from './army.mjs';
import { modeWith } from './keeping.mjs';
import { DRILL_TO_STEADY, MARCH_CAMPS, atGroces, campName, drilledSteady, houstonCamp } from './houston.mjs';
import { recallFromService, recallRefusal } from './winter.mjs';
import { share } from './scrape.mjs';

const GONE = ['dead', 'captured'];
const DAY = 1440;
/** About two outings in a hundred bring a scout back hurt (`FIC-GONZ-053`; the record has one man wounded in the skirmish of April 20, `HIST-TEX-067`). */
export const SCOUT_HURT = 0.02;
/** The camp's chores, in the order a row shows them. */
export const CAMP_CHORES = Object.freeze(['camp-drill', 'camp-forage', 'camp-guard', 'camp-scout']);
/**
 * How a man whose family does not choose spends a day at the camp (`FIC-GONZ-055`): mostly drilling, as the army did at
 * Groce's; about one day in six out for the mess, one in six on guard, one in twenty with the scouts. Chosen by a hashed
 * share of the class, the man and the day, so a class replays the same.
 */
export const CAMP_SHARES = Object.freeze({ forage: 1 / 6, guard: 1 / 6, scout: 1 / 20 });

/** Whether this person is serving with Houston's army and not yet through the battle. */
export const withHouston = entity => entity?.service?.kind === 'houston' && entity.service.status === 'serving';
const household_ = (world, entity) => world.households[entity.householdId];
const tell = (world, entity, text, { type = 'consequence', importance = 2, claimId = 'FIC-GONZ-053', causes = [] } = {}) => record(world, type, {
  actorId: entity.id, householdId: entity.householdId, importance, classification: 'FICTIONAL FOR GAMEPLAY', claimId, text, causes,
});

/** Why this man cannot be given this camp chore now, or null. Refused in words, on the control (docs/COLONIES.md §7a says nothing of what a choice risks; a chore's cost is on the control). */
export function campRefusal(world, household, entity, choreId) {
  if (!withHouston(entity)) return `${entity.name} is not with General Houston's army.`;
  if (entity.service.fate) return 'The battle is fought. The army is going home.';
  if (entity.travel) return `${entity.name} is on the road.`;
  if (entity.location?.siteId !== houstonCamp(world)) return `${entity.name} has not reached the camp.`;
  // On the march east the army made "a forced march of fifty-five miles" (Houston, `HIST-TEX-088`): a night's camp on the
  // road, with a guard to stand and the scouts out, and no day to drill in.
  if (choreId === 'camp-drill' && MARCH_CAMPS.includes(houstonCamp(world))) return 'The army is on the march to Harrisburg. There is no day to drill.';
  if (choreId === 'camp-drill' && drilledSteady(entity)) return `${entity.name} has drilled ${DRILL_TO_STEADY} days and stands steady in the line.`;
  if (choreId === 'camp-scout' && modeWith(world, entity) !== 'horse') return `The scouts ride, and ${entity.name} has no horse at the camp.`;
  return null;
}

/** The camp's work once done, said and counted: one supporting award the first time, never a second. */
function served(world, entity, causeId) {
  const camp = houstonCamp(world);
  awardGlory(world, { event: 'houston-camp', claimId: 'HIST-TEX-075', personId: entity.id, householdId: entity.householdId, role: 'served', fromSiteId: camp, causes: causeId ? [causeId] : [] });
}

const RUNS = {
  drill(world, household, entity) {
    const service = entity.service;
    service.drilled = (service.drilled || 0) + 1;
    const steady = drilledSteady(entity);
    const eventId = tell(world, entity, steady
      ? `${entity.name} drilled a day with the company at ${campName(world)}, and has drilled ${service.drilled} days: steady in the line now, which will count when the army fights.`
      : `${entity.name} drilled a day with the company at ${campName(world)} (${service.drilled} of ${DRILL_TO_STEADY} days to stand steady in the line).`, { type: 'memory', claimId: 'HIST-TEX-075' });
    served(world, entity, eventId);
  },
  forage(world, household, entity) {
    const eventId = tell(world, entity, atGroces(world)
      ? `${entity.name} went out for the mess and came back with a beef from Groce's herd and corn from his cribs.`
      : `${entity.name} went out for the mess and came back with a beef and a sack of corn from the farms the families left.`, { claimId: 'HIST-TEX-077' });
    served(world, entity, eventId);
  },
  guard(world, household, entity) {
    const eventId = tell(world, entity, `${entity.name} stood a night on the camp guard at ${campName(world)}.`, { claimId: 'HIST-TEX-083' });
    served(world, entity, eventId);
  },
  scout(world, household, entity) {
    const service = entity.service;
    service.scouted = (service.scouted || 0) + 1;
    const hurt = scoutHurt(world, entity, service.scouted);
    if (hurt) entity.health = { condition: WOUND_GRADES.slight.condition, grade: 'slight', recoversAt: world.minute + WOUND_GRADES.slight.minutes };
    const eventId = tell(world, entity, hurt
      ? `${entity.name} rode out with the scouts and ran into a Mexican patrol; they came back slightly hurt, and are on their feet.`
      : `${entity.name} rode out with the scouts and came back with word of where the enemy is.`, { claimId: 'HIST-TEX-083', importance: hurt ? 3 : 2 });
    served(world, entity, eventId);
  },
};
/** Whether this outing brings the scout back hurt: the documented share, by a hashed share of the outing. */
export const scoutHurt = (world, entity, outing) => share(world, entity.id, `scout:${outing}`) < SCOUT_HURT;

const offered = (world, household, entity) => withHouston(entity);
const chore = (id, name, describe, steps, extra = {}) => ({
  name, skill: 'hands', where: 'camp', camp: true, describe, steps, offered, refusal: (world, household, entity) => campRefusal(world, household, entity, id), ...extra,
});
registerChores({
  'camp-drill': chore('camp-drill', 'Drill with the company', `A day's drill with the company at the camp. Three days of it make a man steady in the line, and that counts when the army fights: the drilled companies held at San Jacinto.`, [
    { work: 3, doing: 'drilling with the company' },
    { run: RUNS.drill },
  ]),
  'camp-forage': chore('camp-forage', 'Go out for beef and corn', `A day out for the mess: a beef and corn from the farms the families left, or from Groce's, brought in to the camp's fires.`, [
    { work: 3, doing: 'out for beef and corn for the mess' },
    { run: RUNS.forage },
  ]),
  'camp-guard': chore('camp-guard', 'Stand guard', `A night on the camp guard, round the fires and the baggage.`, [
    { work: 2, doing: 'on the camp guard' },
    { run: RUNS.guard },
  ]),
  'camp-scout': chore('camp-scout', 'Ride out with the scouts', `A day out with the scouts, looking for the enemy. Only with a horse at the camp. The scouts meet the enemy's patrols, and a scout can come back hurt.`, [
    { work: 3, doing: 'out with the scouts' },
    { run: RUNS.scout },
  ]),
});

/**
 * What a man does today when his family does not choose (a family nobody plays, sim/neighbours.mjs; a family whose student
 * has gone, sim/absence.mjs; a man on auto, sim/auto.mjs): the first of the day's preference the server offers him, or null.
 * `offered` is his `world.work` list as the projection sends it, so the director reads what a student would.
 */
export function campChoice(world, entity, offered = []) {
  if (!withHouston(entity) || entity.chore || entity.travel) return null;
  const day = Math.floor(world.minute / DAY);
  const roll = share(world, entity.id, `camp:${day}`);
  const first = roll < CAMP_SHARES.forage ? 'camp-forage' : roll < CAMP_SHARES.forage + CAMP_SHARES.guard ? 'camp-guard' : roll < CAMP_SHARES.forage + CAMP_SHARES.guard + CAMP_SHARES.scout ? 'camp-scout' : 'camp-drill';
  const order = [first, ...CAMP_CHORES.filter(id => id !== first && id !== 'camp-scout')];
  return order.find(id => offered.find(entry => entry.id === id && entry.can)) || null;
}

/**
 * Every tick, before the chores: a man at the camp's work whom the army has marched away from it (`followCamp` in
 * sim/houston.mjs), or who has been sent for, leaves it off and is told so. Without this a day's drill begun at Beeson's
 * would finish at Groce's.
 */
export function advanceCamp(world) {
  for (const entity of Object.values(world.entities)) {
    if (!entity.chore || !CHORES[entity.chore.id]?.camp || !entity.householdId) continue;
    const household = household_(world, entity);
    if (!household) continue;
    if (!withHouston(entity) || entity.travel || entity.location?.siteId !== houstonCamp(world)) abandonChore(world, household, entity);
  }
}

// ------------------------------------------------------------------------------------------------------ the army's questions
/**
 * What the army asks a man with Houston, each on his own card with a "!" (`FIC-GONZ-054`, `-056`). The words say what an
 * answer does to him and his family - leaving is a thing the family can read the price of - and never what staying risks.
 * `unplayed` is the share at which a family nobody plays, a family whose student has gone, and a man on auto answer yes,
 * and what nobody answering in time is decided as.
 */
export const CAMP_QUESTIONS = Object.freeze({
  // March 25: word of Fannin's defeat; "many of the men left the army to join their families" - about 1,400 fell to about 500 (`HIST-TEX-076`).
  leave: {
    claimId: 'HIST-TEX-076', unplayed: 0.5, closes: 'goliad-leave-close',
    ask: name => `Word has come that Fannin's whole command is taken on the prairie. Many of the men are leaving the army to see to their families. Does ${name} go home?`,
    yes: name => `${name} leaves for home`, no: name => `${name} stays with the army`,
    note: entity => entity.service?.bound ? 'A regular who leaves has deserted: the family loses the glory of enlisting twice over, and they will not be taken again.'
      : entity.service?.acres ? 'They start home at once, and the promise of land goes with it.' : 'They start home at once. Whatever the army does next happens without them.',
    said: { yes: name => `${name} left the army to see to the family, as many did.`, no: name => `${name} stayed with the army.` },
  },
  // April 16, the fork at Roberts', beyond Spring Creek: the right-hand road to Harrisburg and the enemy, the left to the Trinity
  // and Nacogdoches (`HIST-TEX-082`, `HIST-TEX-088`).
  road: {
    claimId: 'HIST-TEX-082', unplayed: 0.75, closes: 'which-road-close',
    ask: name => `The army has come to a fork of the road: the left-hand road goes to Nacogdoches and safety, the right to Harrisburg and the enemy. The men are shouting which. What does ${name} call for?`,
    yes: name => `${name} calls for the right-hand road, to Harrisburg`, no: name => `${name} would take the left-hand road, for Nacogdoches`,
    note: () => 'The army takes the road the most of the men shout for.',
    said: { yes: name => `${name} shouted for the right-hand road, to Harrisburg and the enemy.`, no: name => `${name} would have taken the left-hand road, for Nacogdoches.` },
  },
});
const autoAnswer = (world, key, entity) => share(world, entity.id, `camp-${key}`) < CAMP_QUESTIONS[key].unplayed ? 'yes' : 'no';

/** Whether a family somebody plays and is at the screen of has a camp question in front of it: the calendar holds while one does (sim/clock.mjs). */
export const campQuestionOpen = world => Object.values(world.entities).some(entity => withHouston(entity) && ['open'].some(v => entity.service.leave === v || entity.service.road === v)
  && world.households[entity.householdId]?.played && !world.households[entity.householdId].absent);

/** Open a question to every man with Houston. A family that does not choose is answered at once. */
export function openCampQuestion(world, key, causeId, { beginTravel } = {}) {
  const spec = CAMP_QUESTIONS[key];
  if (!spec) return;
  for (const entity of Object.values(world.entities)) {
    if (!withHouston(entity) || entity.service[key] || GONE.includes(entity.health?.condition)) continue;
    const household = household_(world, entity);
    if (!household) continue;
    if (!household.played || household.absent || entity.auto) { settleCampAnswer(world, key, entity, autoAnswer(world, key, entity), entity.auto ? 'auto' : 'unplayed', { beginTravel }); continue; }
    entity.service[key] = 'open';
    record(world, 'pressure', { actorId: entity.id, householdId: entity.householdId, importance: 3, classification: 'DOCUMENTED', claimId: spec.claimId, causes: causeId ? [causeId] : [], text: spec.ask(entity.name) });
  }
}

/** Why this answer cannot be given now, in the words the control shows. */
export function campQuestionRefusal(world, household, entity, key, answer) {
  if (!CAMP_QUESTIONS[key]) return 'There is no such question.';
  if (!['yes', 'no'].includes(answer)) return 'That is not one of the answers.';
  if (!entity || entity.householdId !== household.id) return 'That is not your family.';
  if (!withHouston(entity)) return `${entity.name} is not with General Houston's army.`;
  if (entity.service[key] !== 'open') return `${entity.name} has already been answered for.`;
  return null;
}

/** The family's answer for its man. */
export function answerCampQuestion(world, household, entity, key, answer, { beginTravel, modeWith: modeOf } = {}) {
  const why = campQuestionRefusal(world, household, entity, key, answer);
  if (why) throw new Error(why);
  settleCampAnswer(world, key, entity, answer, 'answered', { beginTravel, modeWith: modeOf });
}

/**
 * What an answer does at once: leaving is being sent for (`recallFromService`: released, or deserted if a regular); calling
 * for the enemy's road is a part in the record. A man who cannot leave now - on the road, sent for already - stays, and it
 * is said.
 */
function settleCampAnswer(world, key, entity, answer, how, { beginTravel, modeWith: modeOf = modeWith } = {}) {
  const spec = CAMP_QUESTIONS[key];
  entity.service[key] = answer;
  const decision = `camp-${key}-${answer}`;
  const text = how === 'unplayed' ? spec.said[answer](entity.name) : how === 'auto' ? `${entity.name}, deciding for themself: ${spec.said[answer](entity.name)}`
    : how === 'silence' ? `Nobody answered for ${entity.name} in time, and it was decided for them. ${spec.said[answer](entity.name)}` : spec.said[answer](entity.name);
  const eventId = record(world, how === 'unplayed' ? 'army' : 'choice', { actorId: entity.id, householdId: entity.householdId, importance: 2, ...(how === 'unplayed' ? { classification: 'FICTIONAL FOR GAMEPLAY', claimId: 'FIC-GONZ-054' } : { decision }), text });
  if (key === 'leave' && answer === 'yes') {
    const household = household_(world, entity);
    const why = recallRefusal(entity, world);
    if (why || !household || !beginTravel) { entity.service.leave = 'no'; tell(world, entity, `${entity.name} could not leave: ${why || 'nobody could take them home'}. They stayed with the army.`, { claimId: 'FIC-GONZ-054' }); return; }
    if (entity.chore) abandonChore(world, household, entity);
    try { recallFromService(world, household, entity, { beginTravel, modeWith: modeOf }); } catch (error) { entity.service.leave = 'no'; tell(world, entity, `${entity.name} could not leave: ${error.message} They stayed with the army.`, { claimId: 'FIC-GONZ-054' }); }
  }
  if (key === 'road' && answer === 'yes') {
    awardGlory(world, { event: 'which-road', claimId: spec.claimId, personId: entity.id, householdId: entity.householdId, role: 'forward', fromSiteId: 'harrisburg', causes: [eventId] });
  }
}

/** Close a question: anybody not answered for in time is decided as auto decides (sim/auto.mjs), and what that does is done. */
export function closeCampQuestion(world, key, { beginTravel } = {}) {
  for (const entity of Object.values(world.entities)) decideCampQuestionFor(world, key, entity, { beginTravel });
}

/** Nobody answered for this one man in time: decided as auto decides. Also when the real-time budget runs out (sim/decision-budget.mjs). */
export function decideCampQuestionFor(world, key, entity, { beginTravel } = {}) {
  if (entity?.service?.kind !== 'houston' || entity.service[key] !== 'open') return;
  settleCampAnswer(world, key, entity, autoAnswer(world, key, entity), 'silence', { beginTravel });
}

/** A saved camp that cannot be, or null. */
export function campInvalid(world) {
  for (const entity of Object.values(world.entities)) {
    const service = entity.service;
    if (!service) continue;
    for (const key of ['leave', 'road']) if (service[key] !== undefined && !['open', 'yes', 'no'].includes(service[key])) return `Invalid camp answer`;
    for (const key of ['drilled', 'scouted']) if (service[key] !== undefined && (!Number.isInteger(service[key]) || service[key] < 0)) return `Invalid camp count`;
    if (entity.chore && CHORES[entity.chore.id]?.camp && service.kind !== 'houston') return 'Camp work by somebody not with Houston';
  }
  return null;
}
