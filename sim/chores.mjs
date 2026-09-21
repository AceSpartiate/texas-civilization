// Farm work, written as data rather than code.
//
// A chore is a short ordered list of steps - walk somewhere, spend some ticks doing a
// thing, consume or produce something, come back - and the runner below is one small
// interpreter over that list. Adding a chore means adding a table entry, not a branch.
// The pattern is Widelands': its lumberjack and farmer are literally step lists like
// "findspace / walk=coords / animate=plant / plant=attrib:seed_wheat / return", and it
// is what lets one engine carry dozens of different jobs. See docs/REFERENCE_ARCHITECTURES.md.
//
// Two rules from HISTORY.md shape everything here.
//
// `FIC-GONZ-008` requires outcomes to resolve "inside a visible risk, never by hidden
// punitive RNG". So there is no randomness in this file at all. A tool wears by a fixed
// amount per use and the remaining uses are shown to the student before they commit;
// running a hoe into the ground is a decision they can see coming, not a dice roll that
// happens to them. Yields are likewise fixed and stated on the control that spends them.
//
// `HIST-GONZ-013` documents corn and cotton for this locality and buffalo as the only
// documented local game. So a household grows corn or cotton and nothing else, and no
// hunted species is ever named.
import { heavyWorkPace, tooYoung, tooYoungWhy } from './family.mjs';
import { castVote, joinService, servingWhy, winterOffered, winterRefusal } from './winter.mjs';
import { houstonCamp } from './houston.mjs';
import { record } from './events.mjs';
import { dateOf } from './clock.mjs';
import { purseHeld, purseOf, recordTrade, traderAt } from './town.mjs';
import { carryCapacity, DEFAULT_MODE, MODES, propertyId } from './travel.mjs';
import {
  COTTON_SEED_PER_PLOT, SEED_PER_PLOT, clearSpell, clearedOf, harvestShare, needsWagonToHarvest, raiseFence, standingCrop,
} from './improvements.mjs';
import { fenceWork, groundAt, plotsOf } from './fields.mjs';
import { landAround, onRealLand } from './ground.mjs';
import { distanceToPolyline } from './terrain.mjs';
import { OVERLAND_REACH } from './ways.mjs';
import { moreFields, plotWorkRefusal, stakePlot, stroll, strollTarget } from './survey.mjs';
import { choosing, cutLaneSpell, digWell, lanePoint, laneRefusal, laneState, waterBurden, wellRefusal, wellTicks } from './homesite.mjs';
import { GAME, huntWait, huntingPlace, huntRefusal, killYield, placeWord, powderDamp, quarryGame, stillTicks } from './hunting.mjs';
import { weatherAt } from './weather.mjs';
import { FORAGE, FORAGE_REACH, fishingWater, forageFacts, onSaltWater } from './gathering.mjs';
import { fellRefusal, fellTicks, fellTree, logsLeftOut, logsLying, nextTree, oxFree, recordFelling, stackLogs, takeUpLogs } from './felling.mjs';
import { KINDS, countsTrees, woodsRule } from './woods.mjs';
import { TRADES, counterOptions, counterRefusal, rifleTrue, spendRifleShot, takeCounter, tradesAt } from './shops.mjs';
import { BABY_BURDEN, FURNITURE, PIECES, buyRefusal, furnish, makeRefusal, mindingBaby, wanting } from './furniture.mjs';
import { SPELL_TICKS, buildRefusal, buildSpell, helpRefusal, hostOf, houseBuilt, houseSettled, raising, recordHelpBegun, recordHelpDone, stageOf } from './houses.mjs';
export { MODES } from './travel.mjs';

const round = value => Math.round(value * 10000) / 10000;

// How long the field takes to come on, in ticks of twenty minutes. This is invented, and
// `FIC-GONZ-008` covers it: it is a rhythm for a lesson, not an agricultural calendar,
// and nothing in the interface claims otherwise.
export const RIPEN_TICKS = 18;
// A hoe gives this many field jobs, then wants mending. Fixed, and shown before use.
export const TOOL_LIFE = 5;

export const SKILLS = ['farming', 'hunting', 'hands'];

/**
 * How long somebody downwind will hold before they decide for themselves.
 *
 * Two fictional hours. A hunt that waited for ever on a student who had gone to look at
 * something else would be a chore that silently stopped being work, and a class where one
 * person simply never comes home. A rider's patience works the same way and for the same
 * reason (`PASSING_MINUTES` in sim/encounters.mjs).
 */
export const ASK_PATIENCE = 120;

/**
 * What somebody left to decide alone decides (sim/auto.mjs, docs/FAMILY_PANEL.md §11.7): the shot is taken when the hand
 * is steady or the rifle has been put in order, and waited for when it is not - what a hunter who knows their own hand
 * does - and every other question falls to the family's own answer, the fallback silence always took. Nothing impossible
 * is chosen: a person with no powder comes away. The same rule answers a person on auto at once and a player by hand whose
 * patience (`ASK_PATIENCE`) has run out, so the switch changes when the question is answered and never how.
 */
export function autoChoice(world, household, entity) {
  const ask = entity.chore?.ask;
  if (!ask) return null;
  const steady = steadyHand(entity) || (rifleTrue(household) && entity.health?.condition !== 'tired');
  const preferred = ask.id === 'shot' ? (steady ? ['take', 'wait', 'leave'] : ['wait', 'take', 'leave']) : [].concat(ask.fallback);
  return preferred.find(option => askAvailability(world, household, entity, option).can) || 'leave';
}

/**
 * Whether this person could make a long shot right now.
 *
 * The whole outcome of a hunt turns on this and **there is no die in it**. `FIC-GONZ-008`
 * requires outcomes to resolve inside a visible risk rather than by hidden punitive RNG,
 * and this file has always honoured that by containing no randomness at all. So a shot
 * connects or it does not for two reasons a student can read before choosing: whether the
 * person is tired, and whether hunting is a thing they can actually do.
 *
 * Both are already visible. Fatigue is shown in words on the person - "Mateo is tired
 * after 23 miles on the road" - and skill sits on every work control. And fatigue is where
 * this reaches back into everything else: walking to a far stand tires somebody and riding
 * barely does, so **how a family travelled decides whether it can shoot straight**. That is
 * the chain VISION.md §21 asks for, made out of parts that already existed.
 */
/**
 * Where a hunt's weather is read: the place on the family's own land the hunter went to, or - for the camp hunt on the
 * road east, whose `ground` is a word and not a point - wherever they are standing.
 */
export const huntPoint = entity =>
  (Number.isFinite(entity.chore?.ground?.x) ? entity.chore.ground : entity.location);

export const steadyHand = entity =>
  entity.health?.condition !== 'tired' && (entity.skills?.hunting ?? 1) >= 2;

/** Why a long shot would go wide, in the person's own terms, or null if it would not. */
export function unsteadyBecause(entity) {
  if (entity.health?.condition === 'tired') return `${entity.name} is tired, and a tired hand misses at this range`;
  if ((entity.skills?.hunting ?? 1) < 2) return `it is a long shot, and ${entity.name} has never had the knack of it`;
  return null;
}

/**
 * What a shot spends.
 *
 * Powder and lead, counted together as the one thing a muzzle-loader needs to be fired -
 * "as long as a man had lead, powder, and caps, he could shoot". `HIST-GONZ-020`. It is
 * the material tie between a family's ordinary work and the fight it may be asked to
 * join: the same barrel of powder feeds the hunt and goes upriver with whoever goes.
 */
/**
 * What the store gives for a bale.
 *
 * Cotton is the crop a family sells and corn is the crop it eats - `HIST-GONZ-013` and
 * `HIST-GONZ-022`. So cotton is worth about twice corn in the end, and **only** in the end:
 * it has to be carried to Gonzales first, an afternoon on the road and only as much as
 * whoever goes can carry. A family that plants cotton and never takes it to the store has
 * grown something it cannot eat.
 *
 * Two food a bale is invented (`FIC-GONZ-019`). Food is still the first thing the store
 * offers: coin was scarce enough in Mexican Texas that barter was the ordinary way of doing
 * business (`HIST-GONZ-023`), so the counter will pay coin too, but less of it - see `COIN`.
 */
export const COTTON_RATE = 2;
/**
 * Coin at the Gonzales store. Every number is invented (`FIC-GONZ-022`).
 *
 * The shape is documented (`HIST-GONZ-023`): coin was so scarce in Mexican Texas that not ten
 * transactions in a hundred used it, and barter was how business was done. So the store
 * would rather trade than pay out coin, and it shows in the prices - a bale fetches two food
 * or one real, and three food fetch one real - while the same coin buys more at the counter
 * than food does, because it is the scarce thing. A new hoe is iron that came a long way, and
 * the smith wants coin for it; mending the old one at home still costs none.
 */
// Food at five a real (owner, 2026-09-16, docs/MONEY_AND_GLORY.md §8.1, measured: at three a corn family that sold everything
// placed second in most classes; corn is the modest path and cotton, a real a bale, the profitable one).
export const COIN = Object.freeze({ cottonBale: 1, foodPerReal: 5, powder: 1, seed: 1, hoe: 2 });
export const reales = amount => amount === 1 ? '1 real' : `${amount} reales`;
/** A resource as a student reads it. */
export const resourceName = (resource, amount) => resource === 'money' ? (amount === 1 ? 'real' : 'reales') : resource;

export const SHOT_COST = 1;
/** What an afternoon at the mark costs, and the ceiling it works towards. `FIC-GONZ-018`. */
export const PRACTICE_COST = 2;
export const SKILL_CAP = 3;
export const dryHouse = household => (household.resources?.powder ?? 0) < SHOT_COST;
/**
 * Whether the neighbours' director gives this family its orders: sim/neighbours.mjs `automatic`, written out here because that
 * module reads this one. Its town errands (`directorOnly`) are listed for it and for nobody else.
 */
const directed = (world, household) => Boolean(world.neighbours && household && (!household.played || household.absent));

/**
 * Whether an answer is open to this family right now, and why not.
 *
 * Split from the note on purpose, and the split matters. The **price** on an answer is
 * quoted once and frozen, so it cannot change under a student who is reading it - the
 * march learned that first. Whether the answer is **open** is live, because a sibling may
 * have come home with powder in the meantime, and offering an answer the world would
 * refuse is the defect `callAvailability` exists to prevent.
 */
export function askAvailability(world, household, entity, optionId) {
  if (['take', 'wait'].includes(optionId) && dryHouse(household)) {
    return { can: false, why: 'There is no powder and lead in the house.' };
  }
  // A shop's counter is refused by the shop's own rules (sim/shops.mjs).
  if (entity.chore?.ask?.id === 'shop-counter' && optionId !== 'leave') {
    const why = counterRefusal(world, household, entity, optionId);
    return why ? { can: false, why } : { can: true, why: '' };
  }
  for (const needs of [].concat(ASKS[entity.chore?.ask?.id]?.requires?.[optionId] || [])) {
    if (!needs.test(household, world, entity)) return { can: false, why: typeof needs.why === 'function' ? needs.why(household, world, entity) : needs.why };
  }
  return { can: true, why: '' };
}

/** A question as the family should see it: the quoted prices, and what is open right now. */
export function askProjection(world, household, entity) {
  const ask = entity.chore?.ask;
  if (!ask) return null;
  return { ...ask, options: ask.options.map(option => ({ ...option, ...askAvailability(world, household, entity, option.id) })) };
}

/**
 * The one decision inside a hunt.
 *
 * A student used to press Hunt and receive food some minutes later, which is a dispatch
 * order and not a hunt. Now the work stops with somebody downwind and asks, and the three
 * answers are genuinely different: a shot that depends on who was sent and how they got
 * there, three more hours for a certainty, or cutting the afternoon short because
 * something at home matters more. Every cost is on its own control before it is pressed,
 * which is the same rule the march upriver follows.
 */
export const ASKS = {
  // The store counter. Paying, or being paid, is a choice made at the counter rather than a
  // second chore on the list, in the one shape every decision in this game takes. Nobody
  // answering means the old way: goods for goods.
  // Which crop goes in (owner, 2026-09-16, docs/MONEY_AND_GLORY.md §8.1): corn, which is food, or cotton, which takes twice the
  // seed and sells at a real a bale. The family's own crop is offered first and is what silence plants, so a family nobody plays
  // grows what it grew.
  'crop-choice': {
    doing: 'at the field with the seed',
    // Silence plants the family's own crop, or the other when there is not the seed for it.
    fallback: household => (household.field?.crop || 'corn') === 'cotton' ? ['cotton', 'corn'] : ['corn', 'cotton'],
    text: entity => `${entity.name} can put in corn, or cotton.`,
    options: (entity, world, household) => [
      { id: 'corn', label: 'Plant corn', note: `${SEED_PER_PLOT} seed a plot; the crop is food` },
      { id: 'cotton', label: 'Plant cotton', note: `${COTTON_SEED_PER_PLOT} seed a plot; the store pays ${reales(COIN.cottonBale)} a bale` },
    ].sort((a, b) => (a.id === (household.field?.crop || 'corn') ? -1 : b.id === (household.field?.crop || 'corn') ? 1 : 0)),
    requires: {
      cotton: { test: household => (household.resources.seed ?? 0) >= COTTON_SEED_PER_PLOT * clearedOf(household), why: household => `Cotton wants ${COTTON_SEED_PER_PLOT * clearedOf(household)} seed for this field, and there is not that much in the house.` },
    },
  },
  'cotton-counter': {
    doing: 'at the counter with the cotton',
    fallback: 'food',
    text: entity => `The storekeeper will take ${entity.name}'s cotton for food or for coin, and would rather it were food.`,
    options: () => [
      { id: 'food', label: 'Take food for it', note: `${COTTON_RATE} food a bale` },
      { id: 'coin', label: 'Take coin for it', note: `${reales(COIN.cottonBale)} a bale, whole bales only` },
      { id: 'leave', label: 'Keep the cotton', note: 'Carry it home again' },
    ],
    requires: {
      coin: [
        { test: household => (household.resources.cotton ?? 0) >= 1, why: 'The store pays coin only for a whole bale.' },
      ],
    },
  },
  // The auxiliary volunteers' two terms (sim/winter.mjs, `HIST-TEX-048`). Nobody answering signs for the year.
  'auxiliary-terms': {
    doing: 'at the table with the roll',
    fallback: 'year',
    text: entity => `${entity.name} can sign on for the war, for 640 acres, or for one year, for 320.`,
    options: () => [
      { id: 'war', label: 'Sign on for the war', note: '640 acres, promised' },
      { id: 'year', label: 'Sign on for a year', note: '320 acres, promised' },
      { id: 'leave', label: 'Do not sign', note: 'Come home again' },
    ],
    requires: {},
  },
  'powder-counter': {
    doing: 'at the counter',
    fallback: ['food', 'coin'],
    text: entity => `${entity.name} can pay for powder and lead in food or in coin.`,
    options: () => [
      { id: 'food', label: 'Pay in food', note: '2 food for 3 powder' },
      { id: 'coin', label: 'Pay in coin', note: `${reales(COIN.powder)} for 3 powder` },
      { id: 'leave', label: 'Buy nothing', note: 'Nothing spent' },
    ],
    requires: {
      food: { test: household => (household.resources.food ?? 0) >= 2, why: 'There is not enough food to pay with.' },
      coin: { test: household => (household.resources.money ?? 0) >= COIN.powder, why: 'There is no coin in the house.' },
    },
  },
  'seed-counter': {
    doing: 'at the counter',
    fallback: ['food', 'coin'],
    text: entity => `${entity.name} can pay for seed in food or in coin.`,
    options: () => [
      { id: 'food', label: 'Pay in food', note: '3 food for 2 seed' },
      { id: 'coin', label: 'Pay in coin', note: `${reales(COIN.seed)} for 2 seed` },
      { id: 'leave', label: 'Buy nothing', note: 'Nothing spent' },
    ],
    requires: {
      food: { test: household => (household.resources.food ?? 0) >= 3, why: 'There is not enough food to pay with.' },
      coin: { test: household => (household.resources.money ?? 0) >= COIN.seed, why: 'There is no coin in the house.' },
    },
  },
  // Furniture (sim/furniture.mjs, docs/SETTLING_IN.md §6): which piece to make, asked at home before the trip for timber.
  'furniture-make': {
    doing: 'deciding what to make',
    fallback: ['shelves', 'benches', 'cradle', 'table', 'bedstead'],
    text: entity => `What should ${entity.name} make? It means a trip to the timber for a small tree, and then the work of it.`,
    options: () => [
      ...PIECES.map(piece => ({ id: piece, label: `Make ${FURNITURE[piece].a}`, note: `${FURNITURE[piece].does} ${FURNITURE[piece].work} spells of work.` })),
      { id: 'leave', label: 'Make nothing', note: 'Nothing spent' },
    ],
    requires: Object.fromEntries(PIECES.map(piece => [piece, { test: household => !makeRefusal(household, piece), why: household => makeRefusal(household, piece) }])),
  },
  // The carpenter's counter: a piece, paid for in coin or in food.
  'carpenter-counter': {
    doing: "at the carpenter's",
    fallback: 'leave',
    text: entity => `The carpenter has pieces made. ${entity.name} can pay in coin or in food.`,
    options: () => [
      ...PIECES.flatMap(piece => [
        { id: `${piece}-coin`, label: `Buy ${FURNITURE[piece].a} for coin`, note: `${reales(FURNITURE[piece].coin)}. ${FURNITURE[piece].does}` },
        { id: `${piece}-food`, label: `Buy ${FURNITURE[piece].a} for food`, note: `${FURNITURE[piece].food} food. ${FURNITURE[piece].does}` },
      ]),
      { id: 'leave', label: 'Buy nothing', note: 'Nothing spent' },
    ],
    requires: Object.fromEntries(PIECES.flatMap(piece => ['coin', 'food'].map(pay => [`${piece}-${pay}`, { test: household => !buyRefusal(household, piece, pay), why: household => buyRefusal(household, piece, pay) }]))),
  },
  // The shops (sim/shops.mjs, docs/TOWNS.md): which one, then that shop's counter.
  'which-shop': {
    doing: 'on the street in town',
    fallback: 'leave',
    text: entity => `${entity.name} is in town. Which shop?`,
    options: (entity, world) => [
      ...tradesAt(world, entity.location.siteId).map(trade => ({ id: trade, label: `Go to ${TRADES[trade].shop}`, note: TRADES[trade].offers.map(offer => offer.label).join('; ') })),
      { id: 'leave', label: 'Come home again', note: 'Nothing spent' },
    ],
  },
  'shop-counter': {
    doing: 'at the counter',
    fallback: 'leave',
    text: entity => `What will ${entity.name} do at ${TRADES[(entity.chore?.flags || []).find(flag => TRADES[flag])]?.shop || 'the shop'}?`,
    options: entity => counterOptions((entity.chore?.flags || []).find(flag => TRADES[flag])),
  },
  shot: {
    doing: 'downwind, with the shot there to take',
    fallback: 'take',
    // The quarry the place holds on the biomes (sim/hunting.mjs `quarryAt`); a deer everywhere else, as it always was.
    text: (entity, world) => `${entity.name} is downwind of ${GAME[entity.chore?.ground?.quarry]?.a || 'a deer'}, with a shot to take. It is not a close one.${world && powderDamp(world, huntPoint(entity)) ? ' The rain is on the powder.' : ''}`,
    options: (entity, world, household) => [
      { id: 'take', label: 'Take the shot', note: `One powder. ${(rifleTrue(household) && entity.health?.condition !== 'tired' ? null : unsteadyBecause(entity)) || `${entity.name} is steady, and it is within reach${rifleTrue(household) && !steadyHand(entity) ? ', with the rifle put in order' : ''}`}` },
      // The certainty waiting buys is a dry day's (`powderDamp`): a student is told what the rain takes away from it
      // before they choose, which is `FIC-GONZ-008`'s rule about visible risk applied to the weather.
      { id: 'wait', label: 'Wait for it to come closer', note: powderDamp(world, huntPoint(entity)) ? `One powder, three more hours, and the rain is on the powder: ${(rifleTrue(household) && entity.health?.condition !== 'tired') || steadyHand(entity) ? 'a steady hand can still be sure of it' : 'even close it may not fire'}` : 'One powder, three more hours, and then the shot is a certainty' },
      { id: 'leave', label: 'Leave it and come home', note: 'Nothing spent, nothing to carry, and the rest of the day is the family\u2019s' },
    ],
  },
};

// What each person is good at when the world is built. Values are 1 to 3, and the spread
// is deliberately uneven: a household that has nobody who can mend a hoe has to go into
// town or ask a neighbour, which is the pressure that makes the town matter.
//
// **Farming and hands stay exactly as they were dealt, for the whole life of a class.** If
// they could be trained up, that pressure would evaporate and the town would stop
// mattering, which is the argument that kept every skill fixed until now.
//
// **Hunting is the one that can be practised**, and it is a narrow exception with a reason.
// A family may spend an afternoon at the mark and two powder to raise it by one. That is
// not the same thing as getting better by doing what you were already doing - the cost is
// deliberate, visible, and paid in the very thing the skill is for, so the choice is
// "spend the powder now to shoot better later" rather than a reward for repetition. It
// removes no pressure: hunting skill has never had anything to do with the hoe, the town
// or the neighbours. And `HIST-GONZ-021` is the reason it is expensive rather than free -
// powder on this frontier was scarce and costly enough that rifles were built around
// conserving it, so practice was a thing a family decided to afford.
//
// `docs/REFERENCE_ARCHITECTURES.md` §8 refused Total War's veterancy on 2026-09-12 and
// this is the amendment to that verdict, with the distinction written out there.
export function skillsFor(id) {
  // Each skill is hashed from the id *and its own name*, then avalanched. Deriving all
  // three from one hash by shifting different bits out of it looks independent and is
  // not: with ids as similar as `hh-1-rosa` and `hh-1-elena` it produced whole families
  // who shared the same three numbers.
  const skills = {};
  for (const skill of SKILLS) {
    let hash = 2166136261;
    for (const character of `${id}:${skill}`) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
    hash ^= hash >>> 15; hash = Math.imul(hash, 2246822507); hash ^= hash >>> 13;
    skills[skill] = 1 + ((hash >>> 0) % 3);
  }
  return skills;
}

// A better hand works faster, never instantly, and never below one tick.
const paceFor = (ticks, skill, strength = 1) => Math.max(1, Math.round(ticks * (skill === 3 ? .7 : skill === 2 ? 1 : 1.35) * strength));
const yieldFor = (amount, skill) => round(amount * (skill === 3 ? 1.4 : skill === 2 ? 1.15 : 1));

export const CHORES = {
  // Survey (docs/LAND_GRANTS.md §4, sim/survey.mjs): ten acres staked out where the student chose on the family's own land.
  // The person walks out over the family's own ground, paces and stakes it, and walks back; they never leave home.
  'survey-plot': {
    name: 'Survey ten acres', skill: 'farming', where: 'home', onSite: true, survey: true,
    describe: 'Walk out to a place on your own land, pace out ten acres and drive the stakes. Choose the place on the map first.',
    steps: [
      { stroll: 'plot', doing: 'walking out to the ground being surveyed' },
      { work: 2, doing: 'pacing out and staking ten acres' },
      { stake: true },
      { stroll: 'yard', doing: 'walking back to the house' },
    ],
  },
  // The lane to the road (sim/homesite.mjs, owner 2026-09-14): marked when the site is chosen, and cut by the family, a spell
  // at a time from the house outward, until it reaches the road. Many hands may work at it, like the house.
  'cut-lane': {
    name: 'Cut the lane to the road', skill: 'hands', where: 'home', heavy: true, onSite: true, lane: true,
    describe: 'Clear a way for the wagon from the house to the road: brush and timber out of it, a stretch at a time. Until it is cut, going along it is as slow as the country it crosses.',
    steps: [
      { walk: 'lane', doing: 'walking out to where the lane is being cut' },
      { work: 3, doing: 'cutting the lane' },
      { cutLane: 3 },
      { walk: 'yard', doing: 'coming back up the lane' },
    ],
  },
  // A well, for a house set too far from running water to carry it (sim/homesite.mjs, docs/LAND_GRANTS.md §8.2). Offered only
  // where one is wanted. Its length is the family's own: deeper the higher the house stands above the water.
  'dig-well': {
    name: 'Dig a well', skill: 'hands', where: 'home', heavy: true, onSite: true, well: true,
    describe: 'Dig down by the house until there is water. Long, hard work, and deeper the higher the house stands; after it, nobody carries water from the creek.',
    steps: [
      { walk: 'yard', doing: 'marking out the well by the house' },
      { work: 'well', doing: 'digging the well' },
      { dig: 'well' },
    ],
  },
  // The field is every cleared plot, wherever the family staked them (docs/LAND_GRANTS.md §5): planting and harvest walk
  // out to each in turn and back, so ten acres a mile off cost the walk there that ten acres by the house do not.
  'plant-field': {
    name: 'Plant the field', skill: 'farming', tool: 'hoe', where: 'home', heavy: true,
    // Two seed for every cleared plot: a family that clears more has more to put in, and more to find.
    needsPerPlot: { seed: SEED_PER_PLOT }, field: 'bare',
    describe: 'Walk out to every cleared plot, turn the rows and put in seed.',
    steps: [
      { stroll: 'fields', doing: 'walking out to the fields' },
      { ask: 'crop-choice' },
      { work: 4, doing: 'breaking the rows' },
      { when: ['corn'], consumePerPlot: { seed: SEED_PER_PLOT } },
      { when: ['cotton'], consumePerPlot: { seed: COTTON_SEED_PER_PLOT } },
      { when: ['corn'], crop: 'corn' },
      { when: ['cotton'], crop: 'cotton' },
      { work: 3, doing: 'putting in seed' },
      { field: 'planted' },
      { wear: 'hoe' },
      { stroll: 'yard', doing: 'coming in from the fields' },
    ],
  },
  'harvest-field': {
    name: 'Bring in the crop', skill: 'farming', tool: 'hoe', where: 'home', heavy: true,
    field: 'ripe', wantsWagon: true,
    describe: 'The crop is ready. Walk out to every planted plot, cut it and carry it in.',
    steps: [
      { stroll: 'fields', doing: 'walking out to the fields' },
      { work: 6, doing: 'cutting the crop' },
      { produceCrop: true },
      { field: 'bare' },
      { wear: 'hoe' },
      { stroll: 'yard', doing: 'carrying the crop in' },
    ],
  },
  // Clearing a staked plot (docs/LAND_GRANTS.md §5): the student chooses the plot on the map. Worked in spells like the
  // house, by as many of the family as are set to it, until the ground is cleared or they are called home; the work done
  // stays on the plot. Prairie ten spells, brush twenty, timber thirty and the felling axe (HIST-GONZ-039, FIC-GONZ-025).
  'clear-plot': {
    name: 'Clear a staked plot', skill: 'farming', where: 'home', heavy: true, plotWork: true,
    describe: 'Walk out to ten acres the family staked, and grub, cut and break them for planting. Prairie is ten spells of work, brush twenty, timber thirty and wants the felling axe. Choose the plot on the map.',
    steps: [
      { stroll: 'plot', doing: 'walking out to the ground being cleared' },
      { clearWork: true, work: SPELL_TICKS },
      { clearSpell: true },
      { wear: 'plot' },
      { stroll: 'yard', doing: 'coming in from the clearing' },
    ],
  },
  'fence-plot': {
    name: 'Fence a cleared plot', skill: 'hands', where: 'home', heavy: true, plotWork: true,
    describe: 'Split rails and lay them round ten cleared acres. Stock here run loose, and an unfenced plot feeds them first. Rails come from the nearest timber, so a plot out on the open prairie takes longer; the plot on the map says how long. Choose the plot on the map.',
    steps: [
      // ceiling: rails are split with an axe and a maul, and nothing here asks for either or wears them; the house and
      // the lane read the felling axe, and this should when tools wear by the job.
      { stroll: 'plot', doing: 'walking out to the plot' },
      // How long is the country's (sim/fields.mjs `fenceWork`, docs/BIOME_GAMEPLAY.md §3.3): rails from timber at hand, rails
      // carried from further off, or mesquite where the plot stands.
      { work: 'fence', doing: 'splitting rails' },
      { raise: 'fence' },
      { stroll: 'yard', doing: 'coming in from the plot' },
    ],
  },
  // The house (docs/SETTLING_IN.md step 4, sim/houses.mjs). One chore for the whole of it, which
  // keeps going spell after spell until the house stands or the person is called off: a house is
  // one amount of work that the family puts in together, and a student who had to send somebody
  // back to it every hour would be clicking, not building.
  'build-house': {
    name: 'Work on the house', skill: 'hands', where: 'home', heavy: true, house: true,
    describe: 'Put in work on the house the family has chosen. They keep at it until the house stands or they are called off, and anybody else set to it works alongside.',
    steps: [
      { walk: 'yard', doing: 'going over to where the house is going up' },
      { houseWork: true, work: SPELL_TICKS },
      { build: true },
    ],
  },
  // A house-raising (docs/SETTLING_IN.md §6, step 5, sim/houses.mjs). Done on somebody else's land:
  // the person is standing there already, so there is no walk, and every spell they put in goes into
  // that family's house. They stop when the walls are up.
  'help-raise': {
    name: 'Help raise the walls', skill: 'hands', where: 'neighbour', heavy: true, helps: true,
    describe: 'Put in work raising the walls of the house going up on this land. Every hour of it is an hour off that family’s own, and both families will remember it.',
    steps: [
      { houseWork: true, work: SPELL_TICKS },
      { build: true },
    ],
  },
  // Only where the trees are not counted one by one (the invented country): on the real land a family hunts a place of its
  // own choosing instead, and two hunts on one panel was one too many (owner, 2026-09-17: "do we need two hunting options?").
  'hunt-timber': {
    plainCountry: true,
    name: 'Hunt in the timber', skill: 'hunting', where: 'home', hauls: true,
    describe: 'Out to the nearest timber or brush and back: close by where the land is timbered, a long way across the prairie where it is not. The kill is a big one; what comes home is what they can carry.',
    // A hunt used to be one line - five ticks of standing in one spot with a searching
    // pose playing - and the owner asked to see somebody actually hunting. So it is the
    // steps it always was underneath, said out loud: work in from the edge, move up
    // through the trees, wait still, and take the shot. Every one of them is a real step
    // the server runs, because the renderer must never invent an action the world did not
    // take; what the client does with them is choose a pose and a puff of smoke.
    //
    // `HIST-GONZ-013` makes buffalo the only documented game for this locality and
    // `sim/chores.mjs` has always refused to name any other. **Nothing here names or draws
    // the quarry at all** - the shot is smoke in the trees and then somebody walking home
    // carrying something. That is not a limitation worked around; it is the honest picture,
    // and it is why no deer was drawn.
    steps: [
      { travel: 'timber', doing: 'on the road to {cover}' },
      { stalk: 'edge', work: 1, doing: 'reading the ground at the edge of {cover}' },
      { stalk: 'deep', work: 1, doing: 'working up through {cover}' },
      { stalk: 'still', quarry: 'far', work: 1, doing: 'waiting downwind, and still' },
      // And here the work stops and asks. Everything after this depends on the answer,
      // which is why the steps below carry the answers they belong to.
      { ask: 'shot' },
      { when: ['wait'], quarry: 'near', work: 3, doing: 'letting it come closer' },
      { when: ['take', 'wait'], shot: true, doing: 'the shot' },
      // Ten, and a good hunter takes more - but only the wagon can bring that much back.
      // On foot this still yields the five it always did, so a family that changes
      // nothing is no worse off than it was; the wagon is an upside for the family that
      // spends the extra hour on the road, not a tax on the one that does not.
      { when: ['take', 'wait'], strike: { food: 10 } },
      { when: ['carrying'], travel: 'home', doing: 'carrying it home from {cover}' },
      { when: ['empty'], travel: 'home', doing: 'coming home from {cover} with nothing' },
    ],
  },
  'practise-shooting': {
    name: 'Practise at the mark', skill: 'hunting', where: 'home',
    needs: { powder: PRACTICE_COST },
    describe: 'An afternoon at a mark set up at the edge of the yard, and two powder gone. A steadier hand makes the long shot and brings more home.',
    steps: [
      { walk: 'field', doing: 'setting up a mark at the edge of the yard' },
      { work: 5, doing: 'shooting at the mark' },
      { consume: { powder: PRACTICE_COST } },
      { practise: 'hunting' },
      { walk: 'yard', doing: 'coming in from the mark' },
    ],
  },
  'sell-cotton': {
    directorOnly: true,
    name: 'Take the cotton to the store', skill: 'hands', where: 'home', hauls: true,
    needs: { cotton: 1 },
    describe: `Cotton is not food. The store in town trades ${COTTON_RATE} food for every bale, or ${reales(COIN.cottonBale)} for a whole one, and takes as much as whoever goes can carry.`,
    steps: [
      { travel: 'town', doing: 'on the road to {town} with the cotton' },
      { work: 2, doing: 'at the store' },
      { trade: 'cotton', doing: 'trading the cotton' },
      { ask: 'cotton-counter' },
      { when: ['food'], sell: { good: 'cotton', want: 'food', rate: COTTON_RATE } },
      { when: ['coin'], sell: { good: 'cotton', want: 'money', per: 1, gives: COIN.cottonBale } },
      { travel: 'home', doing: 'walking home from {town}' },
    ],
  },
  'fetch-powder': {
    directorOnly: true,
    name: 'Buy powder and lead in town', skill: 'hands', where: 'home', hauls: true,
    needsAny: [{ food: 2 }, { money: COIN.powder }],
    describe: `Trade in town for powder and lead, paying 2 food or ${reales(COIN.powder)}. A shot spends one, and whoever goes upriver takes what is in the house with them.`,
    steps: [
      { travel: 'town', doing: 'on the road to {town}' },
      { work: 2, doing: 'looking for the trader' },
      { trade: 'powder', doing: 'trading for powder and lead' },
      { ask: 'powder-counter' },
      { when: ['food'], consume: { food: 2 } },
      { when: ['coin'], consume: { money: COIN.powder } },
      { when: ['food', 'coin'], produce: { powder: 3 } },
      { travel: 'home', doing: 'walking home from {town}' },
    ],
  },
  'fetch-seed': {
    directorOnly: true,
    name: 'Fetch seed from town', skill: 'hands', where: 'home', hauls: true,
    needsAny: [{ food: 3 }, { money: COIN.seed }],
    describe: `Trade in town for seed, paying 3 food or ${reales(COIN.seed)}. The road is as long as it is.`,
    steps: [
      { travel: 'town', doing: 'on the road to {town}' },
      { work: 2, doing: 'looking for the seed trader' },
      { trade: 'seed', doing: 'trading for seed' },
      { ask: 'seed-counter' },
      { when: ['food'], consume: { food: 3 } },
      { when: ['coin'], consume: { money: COIN.seed } },
      { when: ['food', 'coin'], produce: { seed: 2 } },
      { travel: 'home', doing: 'walking home from {town}' },
    ],
  },
  'sell-food': {
    directorOnly: true,
    name: 'Sell food at the store for coin', skill: 'hands', where: 'home', hauls: true,
    needs: { food: COIN.foodPerReal },
    describe: `The store pays coin for food it can sell on: ${reales(1)} for every ${COIN.foodPerReal} food, whole reales only, and as much as whoever goes can carry.`,
    steps: [
      { travel: 'town', doing: 'on the road to {town} with food to sell' },
      { work: 2, doing: 'at the store' },
      { trade: 'food', doing: 'selling food' },
      { sell: { good: 'food', want: 'money', per: COIN.foodPerReal, gives: 1 } },
      { travel: 'home', doing: 'walking home from {town}' },
    ],
  },
  // The winter's choices (sim/winter.mjs, docs/COLONIES.md §7e): offered only in the second class period. Each goes to where
  // the thing is done and the `winter` step does it; somebody who has joined stays there until they are sent for.
  'enlist-regular': {
    name: 'Enlist in the regular army at San Felipe', skill: 'hands', where: 'home', winter: true,
    describe: 'Ride or walk to San Felipe, where the council sits, and sign on in the regular army for two years or the war, on the promise of $24 and 800 acres of land. A regular who leaves has deserted.',
    steps: [
      { travel: 'san-felipe', doing: 'on the road to San Felipe to enlist' },
      { work: 1, doing: 'waiting to sign the roll' },
      { winter: 'regular' },
    ],
  },
  'enlist-auxiliary': {
    name: 'Enlist as an auxiliary volunteer at San Felipe', skill: 'hands', where: 'home', winter: true,
    describe: 'Ride or walk to San Felipe and sign on as an auxiliary volunteer: 640 acres of land for the war, or 320 for a year. An auxiliary can be sent for, and loses the land.',
    steps: [
      { travel: 'san-felipe', doing: 'on the road to San Felipe to enlist' },
      { work: 1, doing: 'waiting to sign the roll' },
      { ask: 'auxiliary-terms' },
      { when: ['war'], winter: 'auxiliary-war' },
      { when: ['year'], winter: 'auxiliary-year' },
      { when: ['leave'], travel: 'home', doing: 'walking home from San Felipe' },
    ],
  },
  'join-garrison': {
    name: 'Join the garrison at Béxar', skill: 'hands', where: 'home', winter: true,
    describe: 'Go to Béxar and join the men holding the town and the Alamo, who are short of everything. They stay until sent for.',
    steps: [
      { travel: 'bexar', doing: 'on the road to Béxar' },
      { work: 1, doing: 'reporting to the garrison' },
      { winter: 'garrison' },
      { when: ['shut-out'], travel: 'home', doing: 'turning back for home' },
    ],
  },
  // The relief (sim/alamo.mjs, docs/COLONIES.md §7f): to Gonzales, to ride in with Kimbell and Martin on February 27.
  'join-relief': {
    name: 'Ride to Gonzales to go in to the Alamo', skill: 'hands', where: 'home', winter: true,
    describe: 'Travis has written that he is besieged. Men are gathering at Gonzales to ride through the Mexican lines into the Alamo; whoever is there by the afternoon of February 27 goes with them.',
    steps: [
      { travel: 'gonzales', doing: 'on the road to Gonzales' },
      { work: 1, doing: 'with the men gathering at Gonzales' },
      { winter: 'relief' },
      { when: ['shut-out'], travel: 'home', doing: 'turning back for home' },
    ],
  },
  'join-matamoros': {
    name: 'Go south to join the Matamoros men', skill: 'hands', where: 'home', winter: true,
    describe: 'Go south to Refugio and join the volunteers gathering to carry the war to Matamoros. They stay until sent for.',
    steps: [
      { travel: 'refugio', doing: 'on the road south to Refugio' },
      { work: 1, doing: 'finding the volunteers' },
      { winter: 'matamoros' },
      { when: ['shut-out'], travel: 'home', doing: 'turning back for home' },
    ],
  },
  // Houston's army of the spring (sim/houston.mjs): to wherever its camp is when they set out; they follow it after.
  'join-houston': {
    name: 'Go and join General Houston\'s army', skill: 'hands', where: 'home', winter: true,
    describe: 'Go to the camp of the army Houston is gathering as he falls back east, and stay with it. They can be sent for to help the family.',
    steps: [
      { travel: 'houston-camp', doing: 'on the road to the army' },
      { work: 1, doing: 'reporting to the army' },
      { winter: 'houston' },
      { when: ['shut-out'], travel: 'home', doing: 'turning back for home' },
    ],
  },
  'go-vote': {
    name: 'Go into town to vote', skill: 'hands', where: 'home', winter: true,
    describe: 'On February 1 the settlements elect their delegates to the convention. The polls are in town; whoever goes is away from the work for the trip.',
    steps: [
      { travel: 'town', doing: 'on the road to {town} to vote' },
      { work: 1, doing: 'waiting at the polls in {town}' },
      { winter: 'vote' },
      { travel: 'home', doing: 'walking home from {town}' },
    ],
  },
  'mend-hoe': {
    name: 'Mend the hoe', skill: 'hands', where: 'home',
    needsTool: 'worn',
    describe: 'Set the hoe right again at home. Needs a steady hand.',
    steps: [
      { walk: 'yard', doing: 'fetching the hoe' },
      { work: 4, doing: 'mending the hoe' },
      { mend: 'hoe' },
    ],
  },
  'visit-shop': {
    name: 'Go to a shop in town', skill: 'hands', where: 'home', hauls: true, shops: true,
    describe: "Walk the town's street: the blacksmith, the gunsmith, the doctor, the tavern and the rest, whichever the family's town has. Each shop says what it sells and buys, for coin or food.",
    steps: [
      { travel: 'town', doing: 'on the road to {town}' },
      { work: 1, doing: 'walking the street in {town}' },
      { ask: 'which-shop' },
      ...Object.keys(TRADES).flatMap(trade => [
        { when: [trade], trade, doing: `at ${TRADES[trade].shop}` },
        { when: [trade], ask: 'shop-counter' },
      ]),
      { shop: true },
      { travel: 'home', doing: 'walking home from {town}' },
    ],
  },
  'make-furniture': {
    name: 'Make furniture', skill: 'hands', where: 'home', furniture: 'make',
    describe: 'Make a table, benches, a bedstead, shelves or a cradle from a small tree, with the tools the wagon brought. Each piece does one small thing once there is a roof over it.',
    steps: [
      { ask: 'furniture-make' },
      { when: PIECES, travel: 'timber', doing: 'on the road to {cover} for a small tree' },
      { when: PIECES, work: 2, doing: 'felling and splitting a small tree' },
      { when: PIECES, travel: 'home', doing: 'carrying the timber home' },
      ...PIECES.map(piece => ({ when: [piece], work: FURNITURE[piece].work, doing: `making ${FURNITURE[piece].a}` })),
      ...PIECES.map(piece => ({ when: [piece], furnish: piece, how: 'made' })),
    ],
  },
  'buy-furniture': {
    name: 'Buy furniture from the carpenter', skill: 'hands', where: 'home', hauls: true, furniture: 'buy',
    describe: 'The carpenter in town sells a table, benches, a bedstead, shelves or a cradle, for coin or for food. Each piece does one small thing once there is a roof over it.',
    steps: [
      { travel: 'town', doing: 'on the road to {town}' },
      { work: 2, doing: "looking over the carpenter's pieces" },
      { trade: 'furniture', doing: "at the carpenter's" },
      { ask: 'carpenter-counter' },
      ...PIECES.flatMap(piece => [
        { when: [`${piece}-coin`], consume: { money: FURNITURE[piece].coin } },
        { when: [`${piece}-food`], consume: { food: FURNITURE[piece].food } },
        { when: [`${piece}-coin`, `${piece}-food`], furnish: piece, how: 'bought' },
      ]),
      { travel: 'home', doing: 'carrying it home from {town}' },
    ],
  },
  'replace-hoe': {
    directorOnly: true,
    name: 'Buy a hoe in town', skill: 'hands', where: 'home',
    needs: { money: COIN.hoe }, needsTool: 'worn',
    describe: `Buy a sound hoe from the smith in town. Iron comes a long way, and the smith wants coin for it: ${reales(COIN.hoe)}.`,
    steps: [
      { travel: 'town', doing: 'on the road to {town}' },
      { work: 2, doing: 'looking for the smith' },
      { trade: 'iron', doing: 'buying a hoe' },
      { consume: { money: COIN.hoe } },
      { mend: 'hoe' },
      { travel: 'home', doing: 'walking home from {town}' },
    ],
  },
};
// Hunting on the family's own land (docs/WOODS_AND_BUILDING.md §5, sim/hunting.mjs): the hunt's own stages, at a place the
// student chose inside the family's line. Its `travel` steps are walks about the land (`advanceChore`), and how good the
// ground is decides how long the hunter waits still.
// Felling the family's own trees and hauling the logs to the house (docs/WOODS_AND_BUILDING.md §6.1, sim/felling.mjs).
CHORES['fell-trees'] = {
  name: 'Fell trees', skill: 'hands', where: 'home', heavy: true, fells: true,
  describe: 'Out with the felling axe to a place in timber on the family\'s own land that you choose. The trees within a few rods come down one by one, straight wall timber first, and their logs lie where they fell until they are hauled to the house.',
  steps: [
    { stroll: 'ground', doing: 'walking out to the timber with the axe' },
    { fell: true, doing: 'felling' },
    { saidFelling: true },
    { stroll: 'yard', doing: 'walking in from the felling' },
  ],
};
CHORES['haul-logs'] = {
  name: 'Haul logs to the house', skill: 'hands', where: 'home', heavy: true, hauling: true,
  describe: 'Bring the logs that lie where they were felled to the house, one on the shoulder a trip, or a load of six dragged behind the ox when the ox is at home.',
  steps: [
    { haul: true, doing: 'hauling logs' },
    { stroll: 'yard', doing: 'coming in from the hauling' },
  ],
};
/**
 * Logs fetched from the nearest timber with the ox and wagon (docs/BIOME_GAMEPLAY.md §3.2, `FIC-GONZ-066`). A family whose own
 * land is open prairie or mesquite has few trees to fell (docs/BIOMES.md §8), and a settler with no timber hauled it from the
 * river bottom, as settlers did (`HIST-TEX-110`): sawn lumber was scarce and dear, made at a few mills. So a family with the
 * felling axe and its ox and wagon at home can go to the edge of the nearest timber (`logwoodGround`), fell and load a wagon
 * load of sound logs, and bring them to the house's log pile. What it costs is the wagon's pace there and back and the
 * felling, said on the control before it is sent, in hours and miles.
 * ceiling: the timber fetched from is nobody's in particular - much of the colonies was ungranted in 1835 - and its trees are
 * not taken off the map; the logs are sound logs, the family choosing its trees.
 */
export const FETCH_LOGS = 6;
/** Ticks of felling and loading a wagon load, at an ordinary hand's pace: three log trees, two ticks each (sim/felling.mjs). */
export const FETCH_FELL_TICKS = 6;
CHORES['fetch-logs'] = {
  // Out with the team; or on foot to the team where somebody called away left it at the timber, and home with it and a load.
  name: 'Fetch logs from the timber', skill: 'hands', where: 'home', heavy: true, fetchesLogs: true,
  forceMode: (world, household) => fetchLogsFacts(world, household).teamLeft ? DEFAULT_MODE : 'wagon',
  describe: `With the felling axe and the ox and wagon, out to the nearest timber, off the family's land if need be, to fell ${FETCH_LOGS} sound logs, load them and bring them to the house. The ox and wagon go at their own pace, so the further the timber, the longer it takes.`,
  steps: [
    { travel: 'logwood', doing: 'on the way to {logwood} with the ox and wagon' },
    { work: FETCH_FELL_TICKS, doing: 'felling and loading logs at {logwood}' },
    { loadLogs: FETCH_LOGS },
    { travel: 'home', mode: 'wagon', doing: 'hauling logs home from {logwood}' },
    { stackLoad: true },
  ],
};
/**
 * Whether the family's ox and wagon stand together at this place, free: nobody driving them, nobody holding them. At home
 * that is `oxFree` and the wagon beside it.
 */
function teamAt(world, household, siteId) {
  const wagon = world.entities[propertyId(household.id, 'wagon')];
  if (!wagon || wagon.travel || wagon.borrowedBy || wagon.location?.siteId !== siteId) return false;
  return household.property.some(id => {
    const beast = world.entities[id];
    return beast?.species === 'ox' && beast.location?.siteId === siteId && !beast.travel && !beast.borrowedBy && beast.condition !== 'lost';
  });
}
/**
 * How far the nearest timber is, and about how long a wagon load takes, or why the family cannot fetch logs now. The team is
 * at home, or standing at that timber where somebody called away in the middle of a load left it (`teamLeft`; found
 * 2026-09-19, a family's team stood there the rest of the class): then whoever goes walks out to it and drives it home loaded.
 */
export function fetchLogsFacts(world, household) {
  if (household.tools?.axe === undefined) return { can: false, why: 'Felling wants an axe, and there is none in the house.' };
  const wood = logwoodGround(world, household, false), home = world.map.sites[household.homeSiteId];
  const teamLeft = Boolean(wood && teamAt(world, household, wood.id));
  if (!teamLeft && !(oxFree(world, household) && teamAt(world, household, household.homeSiteId))) {
    return { can: false, why: 'Fetching logs wants the ox and wagon at home.' };
  }
  if (!wood) return { can: false, why: 'There is no timber within reach of the house.' };
  const miles = Math.hypot(wood.x - home.x, wood.y - home.y);
  // The wagon's pace is miles a tick of twenty minutes (sim/travel.mjs): there and back, and the felling; out on foot to a team
  // left at the timber.
  const hours = Math.max(1, Math.round(((teamLeft ? miles / MODES.foot.speed : miles / MODES.wagon.speed) + miles / MODES.wagon.speed + FETCH_FELL_TICKS) / 3));
  const where = `${wood.name.charAt(0).toLowerCase()}${wood.name.slice(1)}, ${miles < 0.2 ? 'beside the house' : `${Math.round(miles * 10) / 10} miles off`}`;
  return { can: true, miles: round(miles), hours, teamLeft, cost: teamLeft ? `about ${hours} ${hours === 1 ? 'hour' : 'hours'}, on foot to the ox and wagon left at ${where}, and home with them` : `the ox and wagon for about ${hours} ${hours === 1 ? 'hour' : 'hours'}, to ${where}` };
}
CHORES['hunt-land'] = {
  name: 'Hunt on our land', skill: 'hunting', where: 'home', hauls: true, huntLand: true,
  describe: 'On foot to a place on the family\'s own land that you choose, and home again. Timber by the water is the best ground for deer and open prairie the poorest; the edge of the timber is better than the middle. What comes home is what they can carry.',
  steps: CHORES['hunt-timber'].steps,
};

// ---- what a family ate between deer (sim/gathering.mjs, docs/BIOMES.md §17.3) ------------------
//
// Four short works, none of which can go wrong and two of which want no knack at all. They are
// offered only where the country holds them, so a family on the coast sees the oyster beds and a
// family on the prairie does not, and the one on a timbered creek sees the fish and the bee tree.
// Each finds its own place - the water, the shore, the family's own cover - rather than asking the
// student to choose one on the map, because the hunt already asks that and once is enough.

/** The cover within reach of the house, as the hunt itself reads it, or null where there is none. */
function forageCover(world, household) {
  const ground = huntingGround(world, household, false);
  if (ground) return ground.cover === 'brush' ? 'brush' : 'timber';
  const home = world.map.sites[household.homeSiteId];
  return home ? groundAt(world, home) === 'prairie' ? null : groundAt(world, home) : null;
}
/** What this family could gather, work by work: the facts sim/gathering.mjs decides, with the house's own ground in them. */
export function forageFor(world, household, kind) {
  const home = world.map.sites[household.homeSiteId];
  if (!home) return { can: false, why: 'The family has no house yet.' };
  return forageFacts(world, household, kind, home, {
    cover: forageCover(world, household),
    axe: household.tools?.axe !== undefined,
    powder: !dryHouse(household),
  });
}
/**
 * Where a family fishes: the nearest water that runs all year, kept as a site of its own,
 * `water-<household>`, which moves when the house does. The site stands on the bank the house's
 * side, which is where somebody sits down with a line.
 */
function fishingSite(world, household, keep = true) {
  const home = world.map.sites[household.homeSiteId];
  if (!home) return null;
  const id = `water-${household.id}`;
  const same = site => site && site.fromX === home.x && site.fromY === home.y;
  if (same(world.map.sites[id])) return world.map.sites[id];
  const water = fishingWater(world, home);
  if (!water) return null;
  const round3 = value => Math.round(value * 1000) / 1000;
  const name = water.name ? `${/River$/.test(water.name) ? 'The ' : ''}${water.name}` : water.kind === 'river' ? 'The river' : 'The creek';
  const site = {
    id, name, kind: 'water', fishing: true, ownerHouseholdId: household.id,
    x: round3(water.x), y: round3(water.y), fromX: home.x, fromY: home.y,
  };
  return keep ? keepSite(world, site) : site;
}
/** Where a family gathers oysters: the nearest water at all, which on salt ground is the bay. Kept as `shore-<household>`. */
function shoreSite(world, household, keep = true) {
  const home = world.map.sites[household.homeSiteId];
  if (!home || !onRealLand(world) || !onSaltWater(world, home)) return null;
  const id = `shore-${household.id}`;
  const same = site => site && site.fromX === home.x && site.fromY === home.y;
  if (same(world.map.sites[id])) return world.map.sites[id];
  const box = { minX: home.x - FORAGE_REACH - 1, minY: home.y - FORAGE_REACH - 1, maxX: home.x + FORAGE_REACH + 1, maxY: home.y + FORAGE_REACH + 1 };
  const water = landAround(box).nearestWater(home, () => true, FORAGE_REACH);
  if (!water) return null;
  const round3 = value => Math.round(value * 1000) / 1000;
  const site = {
    id, name: 'The oyster beds', kind: 'water', shore: true, ownerHouseholdId: household.id,
    x: round3(water.at.x), y: round3(water.at.y), fromX: home.x, fromY: home.y,
  };
  return keep ? keepSite(world, site) : site;
}
/** Which claim each of the four works is: docs/BIOMES.md §17.3, HISTORY.md. */
const FORAGE_CLAIMS = Object.freeze({ smallgame: 'FIC-GONZ-173', fish: 'FIC-GONZ-174', oysters: 'FIC-GONZ-175', honey: 'FIC-GONZ-176' });
/**
 * Where a gathering work goes, written onto the chore as it begins.
 *
 * It is a **walk** and not a journey: the hunt on the family's own land already walks out to a place
 * overland (`stroll`, sim/survey.mjs) rather than taking a road between sites, and there is no road to
 * a creek bank or an oyster bed. Writing `ground` onto the chore is what puts every `travel` step of
 * these four onto that branch.
 */
function forageGround(world, household, kind) {
  const home = world.map.sites[household.homeSiteId];
  if (!home) return null;
  if (kind === 'fish') {
    const site = fishingSite(world, household, false);
    return site && { x: site.x, y: site.y, name: site.name };
  }
  if (kind === 'oysters') {
    const site = shoreSite(world, household, false);
    return site && { x: site.x, y: site.y, name: site.name };
  }
  const cover = huntingGround(world, household, false);
  return cover ? { x: cover.x, y: cover.y, cover: cover.cover === 'brush' ? 'the brush' : 'the timber', name: cover.name } : null;
}
const forageBegin = kind => (world, household, entity) => {
  const ground = forageGround(world, household, kind);
  if (ground) entity.chore.ground = ground;
};
const forageOffered = kind => (world, household) => forageFor(world, household, kind).can;
/** Said on the control before anybody is sent: the hours, where they would go, and the powder if it takes one. */
function forageCost(world, household, choreId) {
  const chore = CHORES[choreId], facts = forageFor(world, household, chore.forage), hours = FORAGE[chore.forage].hours;
  const where = facts.where ? `, ${facts.where}${facts.miles > 0.2 ? ` ${facts.miles} miles off` : ''}` : '';
  const powder = FORAGE[chore.forage].powder ? `, ${SHOT_COST} powder` : '';
  return `${hours} ${hours === 1 ? 'hour' : 'hours'}${where}${powder}`;
}

CHORES['take-small-game'] = {
  name: 'Take small game', skill: 'hunting', where: 'home', hauls: true, forage: 'smallgame',
  offered: forageOffered('smallgame'), begin: forageBegin('smallgame'),
  needs: { powder: SHOT_COST },
  describe: 'An hour in the timber or the brush with the rifle, after squirrels and rabbits. It is nothing like the long wait for a deer: nobody has to have the knack, nothing is stalked, and nobody comes home empty — but a squirrel or two is a squirrel or two.',
  steps: [
    { travel: 'timber', doing: 'out after small game in {cover}' },
    { work: 3, doing: 'looking for squirrels in {cover}' },
    { consume: { powder: SHOT_COST } },
    { forage: 'smallgame', produce: { food: FORAGE.smallgame.food } },
    { travel: 'home', doing: 'carrying it home from {cover}' },
  ],
};
CHORES['fish-the-water'] = {
  name: 'Fish the creek', skill: 'hands', where: 'home', hauls: true, forage: 'fish',
  offered: forageOffered('fish'), begin: forageBegin('fish'),
  describe: 'Down to the water with a line, and back with what is on it. It costs no powder and wants no knack: "Innumerable perch, trout, and other scaly fry" is what a settler wrote of the colony\'s own brooks, and a child can sit on a bank.',
  steps: [
    { travel: 'water', doing: 'walking down to {water}' },
    { work: 6, doing: 'fishing {water}' },
    { forage: 'fish', produce: { food: FORAGE.fish.food } },
    { travel: 'home', doing: 'carrying the catch home from {water}' },
  ],
};
CHORES['gather-oysters'] = {
  name: 'Gather oysters', skill: 'hands', where: 'home', hauls: true, forage: 'oysters',
  offered: forageOffered('oysters'), begin: forageBegin('oysters'),
  describe: 'Out to the beds along the shore at low water, and home with as much as can be carried. Only the coast has them, and they cost nothing but the walk: "Oyster beds are frequent along the coast... may be conveniently gathered."',
  steps: [
    { travel: 'shore', doing: 'walking down to the beds along the shore' },
    { work: 6, doing: 'gathering oysters at the beds' },
    { forage: 'oysters', produce: { food: FORAGE.oysters.food } },
    { travel: 'home', doing: 'carrying the oysters home from the shore' },
  ],
};
CHORES['cut-bee-tree'] = {
  name: 'Cut a bee tree', skill: 'hands', where: 'home', hauls: true, forage: 'honey', heavy: true,
  offered: forageOffered('honey'), begin: forageBegin('honey'),
  describe: 'Find the tree the bees are working and take the axe to it. Honey was the only sweet a family had, and the men who wrote about this country were rarely without it — but it costs a tree and an afternoon, and the bees are not glad.',
  steps: [
    { travel: 'timber', doing: 'out looking for a bee tree in {cover}' },
    { work: 6, doing: 'cutting the bee tree' },
    { forage: 'honey', produce: { food: FORAGE.honey.food } },
    { travel: 'home', doing: 'carrying the honey home from {cover}' },
  ],
};

export const toolState = wear => wear >= TOOL_LIFE ? 'worn' : 'sound';
/** A price as a student reads it: "2 food", "1 real", "2 food, 1 seed". */
const costWords = set => Object.entries(set).map(([resource, amount]) => resource === 'money' ? reales(amount) : `${amount} ${resource}`).join(', ');

/** The field a household works, as a point, so a person can stand in their own crop. */
function fieldPoint(world, household) {
  const feature = world.map.terrain.find(f => f.kind === 'field' && f.ownerHouseholdId === household.id);
  if (!feature) return null;
  const xs = feature.points.map(p => p.x), ys = feature.points.map(p => p.y);
  return { x: round((Math.min(...xs) + Math.max(...xs)) / 2), y: round((Math.min(...ys) + Math.max(...ys)) / 2) };
}
const yardPoint = (world, household) => {
  const site = world.map.sites[household.homeSiteId];
  return { x: round(site.x - .025), y: round(site.y + .035) };
};

/**
 * The three places a hunt passes through inside one stand of timber.
 *
 * Offsets from the stand's own point, in miles, so a hunter works inward and then holds
 * still rather than standing on the spot the road left them. Their canonical site never
 * changes - they are at the timber throughout, which is what `travel` and `arrival` have
 * already said - and this only moves them about the place they are standing, exactly as
 * `walk` moves somebody about their own yard.
 *
 * Jittered by the person's own id so two families hunting the same stand are not drawn
 * standing inside one another.
 */
const STALK = { edge: { dx: .05, dy: .08 }, deep: { dx: -.1, dy: -.035 }, still: { dx: .015, dy: -.13 } };
function stalkPoint(world, entity, where) {
  const ground = entity.chore?.ground;
  const site = ground ? { ...ground } : world.map.sites[entity.location.siteId], spot = STALK[where];
  if (!site || !spot) return null;
  let hash = 2166136261;
  for (const character of `${entity.id}:${where}`) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  const jitter = ((hash >>> 0) % 200) / 200 - .5;
  // A family's own hunting ground stands at the edge of its cover (`huntingGround`), so the stages go in, away from the
  // house: along `toward`, the way the cover lies, and a little to one side.
  if (site.toward) {
    // On the family's own land the place was chosen: the stages stay close round it, so nobody stalks off over the line.
    const near = ground ? .25 : 1;
    const along = { edge: .03, deep: .1, still: .16 }[where] * near, aside = (spot.dx + jitter * .05) * near;
    return { x: round(site.x + site.toward.x * along - site.toward.y * aside), y: round(site.y + site.toward.y * along + site.toward.x * aside) };
  }
  return { x: round(site.x + spot.dx + jitter * .05), y: round(site.y + spot.dy + jitter * .05) };
}

/**
 * Where the deer stands (`HIST-TEX-015`): ahead of the hunter, the way into the cover, far enough that it is not a close
 * shot, or half as far once they have waited. The server places it, so the renderer never invents where an animal is.
 * The client draws the projected quarry with registered deer art; this function remains its sole position authority.
 */
const QUARRY_MILES = Object.freeze({ far: 0.065, near: 0.035 });
function quarryPoint(world, entity, range) {
  const site = entity.chore?.ground || world.map.sites[entity.location.siteId];
  const toward = site?.toward || { x: 0, y: -1 };
  const miles = QUARRY_MILES[range] ?? QUARRY_MILES.far;
  return { kind: 'deer', x: round(entity.location.x + toward.x * miles), y: round(entity.location.y + toward.y * miles) };
}

/**
 * The town a family trades in: the settlement it was dealt to on the real map (docs/COLONIES.md), and Gonzales on the
 * invented map, where it always was.
 */
export const townOf = household => household.settlementId || 'gonzales';

/**
 * Where a family hunts: the edge of the timber or brush nearest its house (FIC-GONZ-030).
 *
 * Found in play 2026-09-14: every family hunted one of two named stands of timber, fifteen miles off on the invented map,
 * when most farms had timber on the place. Where game was is where the cover was, and that is the land's own: timber
 * along the water, brush on broken ground (sim/ground.mjs, sim/fields.mjs `groundAt`). So a family on a timbered creek
 * hunts a few hundred yards from its door, and a family out on the prairie rides miles for it - which is the region of
 * Texas it lives in, and nothing else.
 *
 * Found by walking out from the house along thirty-two bearings an eighth of a mile at a time, as far as anybody strikes
 * out across country (sim/ways.mjs `OVERLAND_REACH`). A big river is never between: timber lines its near bank first. The place is kept as a site of the
 * family's own, `hunt-<household>`, standing on the open ground at the edge so the wagon can come up to it; it moves when
 * the house does. Null when there is no cover within reach - a family then hunts the nearest named stand, as before.
 */
export const HUNT_BEARINGS = 32;
export const HUNT_STEP = 0.125;
/** How far into the cover a bearing is read, in steps, to choose the one that leads deepest in. */
const HUNT_DEPTH_STEPS = 4;
export function huntingGround(world, household, keep = true) {
  return coverGround(world, household, `hunt-${household.id}`, ground => ground !== 'prairie', { hunting: true }, keep);
}
/**
 * Where a family fetches logs when its own land has too few (`fetch-logs`, docs/BIOME_GAMEPLAY.md §3.2): the edge of the
 * timber nearest its house, found as the hunting ground is but timber only - a mesquite thicket gives no logs - and kept as a
 * site of the family's own, `logwood-<household>`, which moves when the house does. Null when no timber is within reach.
 */
export function logwoodGround(world, household, keep = true) {
  return coverGround(world, household, `logwood-${household.id}`, ground => ground === 'timber', { logwood: true }, keep);
}
/**
 * What was found and not yet kept, by world: asking what a trip would cost (the control's words, the neighbours' choice) must
 * not write a site into the map, or every browser is told the homesteads changed when nothing did.
 */
const unkept = new WeakMap();
/**
 * The edge of the nearest cover of the kind wanted, along thirty-two bearings from the house, kept as a site of the family's
 * when `keep` (the moment somebody goes there), and only remembered off the map when not.
 */
function coverGround(world, household, id, wanted, marks, keep = true) {
  const home = world.map.sites[household.homeSiteId];
  if (!home) return null;
  const same = site => site && site.fromX === home.x && site.fromY === home.y;
  if (same(world.map.sites[id])) return world.map.sites[id];
  const remembered = unkept.get(world)?.get(id);
  if (same(remembered)) return remembered.none ? null : keep ? keepSite(world, remembered) : remembered;
  const remember = site => { if (!unkept.has(world)) unkept.set(world, new Map()); unkept.get(world).set(id, site); return site; };
  let best = null;
  for (let bearing = 0; bearing < HUNT_BEARINGS; bearing++) {
    const angle = (bearing / HUNT_BEARINGS) * Math.PI * 2, toward = { x: Math.cos(angle), y: Math.sin(angle) };
    for (let r = HUNT_STEP; r <= OVERLAND_REACH && (!best || r <= best.r); r += HUNT_STEP) {
      const point = { x: home.x + toward.x * r, y: home.y + toward.y * r };
      const ground = groundAt(world, point);
      if (!wanted(ground)) continue;
      // Of the bearings that reach cover soonest, the one that goes deepest into it: a house standing in the timber faces
      // into the timber, not out of it onto the prairie a few rods off (found in play 2026-09-14).
      let depth = 0;
      while (depth < HUNT_DEPTH_STEPS && wanted(groundAt(world, { x: home.x + toward.x * (r + (depth + 1) * HUNT_STEP), y: home.y + toward.y * (r + (depth + 1) * HUNT_STEP) }))) depth++;
      if (best && (r > best.r || (r === best.r && depth <= best.depth))) break;
      // The open ground just short of it, where a hunter comes up to the edge; the cover itself if the house stands in it.
      const edge = r > HUNT_STEP ? { x: home.x + toward.x * (r - HUNT_STEP / 2), y: home.y + toward.y * (r - HUNT_STEP / 2) } : point;
      best = { r, depth, edge, ground, toward };
      break;
    }
  }
  if (!best) { remember({ fromX: home.x, fromY: home.y, none: true }); return null; }
  const round3 = value => Math.round(value * 1000) / 1000;
  const site = {
    id, name: groundName(world, best.edge, best.ground), kind: 'woods', ...marks, ownerHouseholdId: household.id,
    x: round3(best.edge.x), y: round3(best.edge.y), cover: best.ground === 'brush' ? 'brush' : 'timber',
    toward: { x: round3(best.toward.x), y: round3(best.toward.y) }, fromX: home.x, fromY: home.y,
  };
  return keep ? keepSite(world, site) : remember(site);
}
/** A site found for a family, written into the map: every browser is told the map changed. */
function keepSite(world, site) {
  unkept.get(world)?.delete(site.id);
  world.map.sites[site.id] = site;
  world.map.revision = (world.map.revision || 0) + 1;
  return site;
}
/** "The timber on Kerr Creek", "the brush": the family's hunting ground in the words of the water it stands by. */
function groundName(world, point, ground) {
  if (ground === 'brush') return 'The brush';
  let water = null;
  if (onRealLand(world)) water = landAround({ minX: point.x - 2, minY: point.y - 2, maxX: point.x + 2, maxY: point.y + 2 }).nearestWater(point, info => Boolean(info.name), 1.5);
  else water = (world.map.terrain || []).filter(course => (course.kind === 'river' || course.kind === 'creek') && course.name && distanceToPolyline(point, course.points) < 1.5)[0];
  return water?.name ? `The timber on ${/River$/.test(water.name) ? 'the ' : ''}${water.name}` : 'The timber';
}
/** The word for where a family's hunter is: its own ground's cover, or the timber of an old stand. */
const coverWord = (world, household) => world.map.sites[`hunt-${household.id}`]?.cover === 'brush' ? 'the brush' : 'the timber';

/** Where the family hunts: its own ground (`huntingGround`), or the nearest named stand of timber when it has none in reach. */
function timberFor(world, household) {
  const own = huntingGround(world, household);
  if (own) return own.id;
  const home = world.map.sites[household.homeSiteId];
  const stands = Object.values(world.map.sites).filter(site => site.kind === 'woods' && !site.hunting && !site.logwood);
  if (!stands.length) return null;
  return stands.reduce((best, site) => Math.hypot(site.x - home.x, site.y - home.y) < Math.hypot(best.x - home.x, best.y - home.y) ? site : best).id;
}

/**
 * Whether this person can be asked to do this chore right now, and if not, why.
 * The reason is shown to the student: a control that is refused without saying why is
 * worse than no control.
 */
export function choreAvailability(world, household, entity, choreId, logsOut = null) {
  const chore = CHORES[choreId];
  if (!chore) return { can: false, why: 'No such work.' };
  if (entity.kind !== 'person' || entity.householdId !== household.id) return { can: false, why: 'Not one of your family.' };
  if (entity.health.condition === 'dead' || entity.health.condition === 'captured') return { can: false, why: 'This person cannot work.' };
  if (tooYoung(entity)) return { can: false, why: tooYoungWhy(entity) };
  if (entity.chore) return { can: false, why: `${entity.name} is already ${entity.chore.doing}.` };
  // The road's own chores (sim/road.mjs) are for somebody travelling east with the family, or camped with it at the refuge.
  if (entity.travel && !chore.road) return { can: false, why: `${entity.name} is on the road.` };
  // A chore kept in its own module carries its own refusal (`refuse`), asked here so this table never imports that module.
  if (chore.refuse) { const why = chore.refuse(world, household, entity, chore); if (why) return { can: false, why }; }
  if (entity.task === 'help') return { can: false, why: `${entity.name} is away helping.` };
  // Somebody who has joined the army, the garrison or the expedition is in one place and does nothing else (sim/winter.mjs) -
  // except the camp's own work, which a chore kept in its own module marks `camp` and gates itself (sim/camp.mjs).
  if (entity.service?.status === 'serving' && !chore.camp) return { can: false, why: servingWhy(world, entity) };
  if (chore.winter) { const why = winterRefusal(world, household, entity, choreId); if (why) return { can: false, why }; }
  // A chore registered from its own module carries its own refusal (`registerChores`).
  if (chore.refusal) { const why = chore.refusal(world, household, entity); if (why) return { can: false, why }; }
  if (chore.where === 'home' && entity.location.siteId !== household.homeSiteId) return { can: false, why: `${entity.name} is not at home.` };
  if (chore.helps) { const why = helpRefusal(world, entity); if (why) return { can: false, why }; }
  // On the real land the house, the field and the well wait for the family to say where the house stands (sim/homesite.mjs).
  if ((chore.onSite || chore.house || chore.field || chore.plotWork) && choosing(household)) return { can: false, why: 'Choose where the house will stand first.' };
  if (chore.well) { const why = wellRefusal(household); if (why) return { can: false, why }; }
  if (chore.survey && world.status === 'lobby') return { can: false, why: 'The family surveys its land once the class has begun.' };
  if (chore.huntLand && world.status === 'lobby') return { can: false, why: 'The family hunts its land once the class has begun.' };
  if (chore.shops && !Object.values(world.entities).some(one => one.shopSpot || one.deals?.includes('blacksmith'))) return { can: false, why: 'There are no shops in this country.' };
  if (chore.furniture && !wanting(household).length) return { can: false, why: 'The family has every piece of furniture it can use.' };
  if (chore.furniture === 'make' && household.tools?.axe === undefined) return { can: false, why: 'Making furniture wants a felling axe, and there is none in the house.' };
  if (chore.furniture === 'buy' && !Object.values(world.entities).some(one => one.deals?.includes('furniture'))) return { can: false, why: 'There is no carpenter in this country.' };
  if (chore.fells && household.tools?.axe === undefined) return { can: false, why: 'Felling wants an axe, and there is none in the house.' };
  if (chore.fetchesLogs) {
    if (world.status === 'lobby') return { can: false, why: 'The family fetches logs once the class has begun.' };
    if (choosing(household)) return { can: false, why: 'Choose where the house will stand first.' };
    const facts = fetchLogsFacts(world, household);
    if (!facts.can) return { can: false, why: facts.why };
  }
  if (chore.hauling && !(logsOut ?? logsLeftOut(world, household))) return { can: false, why: 'No felled logs lie out to haul.' };
  if (chore.lane) { const why = laneRefusal(world, household); if (why) return { can: false, why }; }
  if (chore.field && (household.field?.state ?? 'bare') !== chore.field) {
    return { can: false, why: chore.field === 'ripe' ? 'The field is not ready.' : 'The field is already planted.' };
  }
  // Which plot is chosen on the map; here, only whether there is any plot this work could be sent to.
  if (chore.plotWork && world.status === 'lobby') return { can: false, why: 'The family works its land once the class has begun.' };
  if (choreId === 'clear-plot' && !plotsOf(world, household).some(plot => plot.state === 'staked')) return { can: false, why: 'There is no staked ground to clear. Survey ten acres first.' };
  if (choreId === 'fence-plot' && !plotsOf(world, household).some(plot => plot.state === 'cleared' && plot.fence !== 'sound')) return { can: false, why: 'Every cleared plot is fenced.' };
  if (chore.field === 'bare' && !clearedOf(household)) return { can: false, why: 'There is no cleared ground to plant. Clear a staked plot first.' };
  if (chore.house) { const why = buildRefusal(household); if (why) return { can: false, why }; }
  if (choreId === 'practise-shooting' && (entity.skills?.hunting ?? 1) >= SKILL_CAP) {
    return { can: false, why: `${entity.name} already shoots as well as anyone on this land.` };
  }
  // Past a certain amount of ground the crop is simply more than four people can carry
  // in by hand. The ox and the wagon have to be standing here - which, now that taking
  // them somewhere means they are somewhere else, is a thing a family can get wrong.
  if (chore.wantsWagon && needsWagonToHarvest(household) && !wagonAtHome(world, household)) {
    return { can: false, why: 'This much crop wants the wagon, and the wagon is not here.' };
  }
  // A missing hoe used to read as a sound one. Now planting, harvest and breaking ground want it
  // in the house before they will start; mending wants it there to mend, but buying one is
  // exactly how a family without a hoe gets one, so that is not refused for want of a hoe.
  if (chore.tool && household.tools?.[chore.tool] === undefined) return { can: false, why: 'There is no hoe in the house.' };
  if (chore.needsTool) {
    const wear = household.tools?.hoe;
    if (wear === undefined) {
      if (choreId === 'mend-hoe') return { can: false, why: 'There is no hoe in the house to mend.' };
    } else if (toolState(wear) !== chore.needsTool) return { can: false, why: 'The hoe is sound.' };
  }
  if (chore.tool && toolState(household.tools?.[chore.tool] ?? 0) === 'worn') return { can: false, why: 'The hoe is worn out and wants mending.' };
  for (const [resource, amount] of Object.entries(needsOf(household, chore))) {
    if ((household.resources[resource] ?? 0) < amount) return { can: false, why: resource === 'money' ? `It costs ${reales(amount)}, and there is not that much coin in the house.` : `Not enough ${resource}.` };
  }
  // Paid for one way or another at the counter: enough of any one of them will do.
  if (chore.needsAny && !chore.needsAny.some(set => Object.entries(set).every(([resource, amount]) => (household.resources[resource] ?? 0) >= amount))) {
    return { can: false, why: `It costs ${chore.needsAny.map(costWords).join(' or ')}.` };
  }
  return { can: true, why: '' };
}

/**
 * What this chore costs this household right now. Fixed for most; for planting it grows
 * with the ground, because a bigger field swallows more seed.
 */
export function needsOf(household, chore) {
  // Planting is quoted at the family's own crop: cotton wants twice the seed (docs/MONEY_AND_GLORY.md §8.1), so a cotton family
  // gathers the seed for cotton before it sets out, and is not turned to corn at the field for want of it.
  const cotton = chore.field === 'bare' && household.field?.crop === 'cotton';
  const perPlot = Object.fromEntries(Object.entries(chore.needsPerPlot || {})
    .map(([resource, amount]) => [resource, (resource === 'seed' && cotton ? COTTON_SEED_PER_PLOT : amount) * clearedOf(household)]));
  return { ...chore.needs, ...perPlot };
}

/**
 * Whether this household's wagon is standing on its own land and fit to use.
 *
 * Three lines of `modeAvailability` restated rather than imported: that function lives in
 * sim/world.mjs, which imports this file, and this file is handed `beginTravel` as a
 * parameter for exactly that reason. Keeping the arrow from existing is worth the
 * repetition - and this asks a narrower question, about one place rather than any place.
 */
function wagonAtHome(world, household) {
  const wagon = world.entities?.[propertyId(household.id, 'wagon')];
  const ox = world.entities?.[propertyId(household.id, 'ox')];
  return [wagon, ox].every(beast =>
    beast && !beast.travel && beast.location.siteId === household.homeSiteId && (!beast.condition || beast.condition === 'sound'));
}

/** Every chore this person could be sent on, with the reason for any that are refused. */
/**
 * The unchanging half: what work exists, what it is called, what it costs. Fetched once
 * per class rather than repeated in every snapshot.
 *
 * Splitting this out was not tidiness. Sending the whole table to every student on every
 * tick made it 4.46 KB of a 6.8 KB payload - two thirds of a student's bandwidth spent
 * retransmitting six fixed sentences. The shaded relief made exactly this mistake before
 * it moved to /api/map, and it is worth naming as a pattern: static text has no business
 * on a per-tick channel.
 */
/**
 * The unchanging half of how somebody may go. Fetched once per class beside the chore
 * catalogue, for exactly the reason that one exists: static text does not belong on a
 * per-tick channel.
 */
export function modeCatalogue() {
  return Object.values(MODES).map(mode => ({ id: mode.id, name: mode.name, describe: mode.describe, carry: mode.carry }));
}

/**
 * Chores kept in their own module (the road east's, Houston's camp's) register here at load, so that two pieces of work built
 * apart never edit the one table. A chore already in the table is refused: an id is a promise a saved class keeps.
 *
 * A module that registers can be reached while this one is still loading - sim/camp.mjs is, through winter → houston → scrape
 * → host → directors - and then `CHORES` is not yet a value. Those wait in `pendingChores` (a `var`, which exists from the
 * module's instantiation, unlike a `const`) and are taken into the table the moment it is made, below it.
 */
var pendingChores;
export function registerChores(extra) {
  let table;
  try { table = CHORES; } catch { (pendingChores ??= []).push(extra); return; }
  for (const [id, chore] of Object.entries(extra)) { if (table[id]) throw new Error(`Chore ${id} is already defined`); table[id] = chore; }
}
for (const extra of pendingChores || []) registerChores(extra);
pendingChores = null;

export function choreCatalogue() {
  return Object.entries(CHORES).map(([id, chore]) => ({
    id, name: chore.name, describe: chore.describe, skill: chore.skill,
    // Stated up front, so spending the last seed is a visible decision.
    cost: Object.entries(chore.needs || {}).map(([resource, amount]) => `${amount} ${resource}`).join(', '),
    // A cost that grows with the ground cannot be stated once for the whole class; the
    // per-tick permission carries the real number for this household.
    scales: Boolean(chore.needsPerPlot),
  }));
}

/**
 * The changing half: whether this person can be sent on each chore right now, and why
 * not. This is a permission, so it stays on the server and is recomputed every tick.
 */
export function choresFor(world, household, entity, logsOut = null) {
  // A family with a roof over it has no house to work on, and a refusal saying so to every person on
  // every tick would be freight: this channel's size budget caught it (tests/chores.test.mjs).
  const settled = houseSettled(household);
  // And helping raise walls is only a thing to do standing on a neighbour's land.
  const visiting = Boolean(hostOf(world, entity));
  // Nor a well to dig where nobody needs one.
  const wantsWell = Boolean(household.site?.needsWell && !household.well);
  // Nor a lane to cut where the family has none, or has cut it.
  const wantsLane = Boolean(laneState(world, household)?.left > 0);
  // Nor ground to clear where nothing is staked, or rails to split where every cleared plot has them.
  const plots = plotsOf(world, household);
  const wants = { 'clear-plot': plots.some(plot => plot.state === 'staked'), 'fence-plot': plots.some(plot => plot.state === 'cleared' && plot.fence !== 'sound') };
  // Nor felling where the trees are not counted one by one, nor hauling with nothing lying out (sim/felling.mjs).
  const counted = countsTrees(woodsRule(world));
  const lying = counted && (logsOut ??= logsLeftOut(world, household)) > 0;
  const list = Object.entries(CHORES).filter(([id, chore]) => !(chore.house && settled) && !(chore.helps && !visiting) && !(chore.well && !wantsWell) && !(chore.lane && !wantsLane)
    && !(chore.plotWork && !wants[id])
    && !(chore.fells && !counted) && !(chore.hauling && !lying) && !(chore.fetchesLogs && !counted)
    && !(chore.plainCountry && counted)
    // The town errands are the store's own trades now (sim/shops.mjs): a family walks the street and deals at the counter,
    // and only the families nobody plays are still sent on an errand by their director (owner, 2026-09-17). The director
    // reads this list: hidden from it as well, from 2026-09-17 to -19 no family nobody played bought powder or seed or sold
    // its cotton, and it hunted its three shots and went without (docs/BIOME_GAMEPLAY.md §5.2).
    && !(chore.directorOnly && !directed(world, household))
    // Nor furniture while the family is still on the road in, or once it has every piece (sim/furniture.mjs).
    && !(chore.furniture && (household.arriving || !wanting(household).length))
    && !(chore.shops && household.arriving)
    // Nor the winter's choices outside the second period's winter, nor a vote before the polls or for somebody who has none.
    && !(chore.winter && !winterOffered(world, household, entity, id))
    // The road's chores (sim/road.mjs) only while the family is on its way east or camped at its refuge.
    && !(chore.road && !['fled', 'refuged'].includes(household.flight?.status))
    // A chore kept in its own module says who sees it (`registerChores`); and somebody serving sees only the camp's work,
    // not thirty refusals saying they are away (sim/camp.mjs).
    && !(chore.offered && !chore.offered(world, household, entity))
    && !(entity.service?.status === 'serving' && !chore.camp)
    // Nor survey or plot work before the class has begun, which would be a refusal for every person on every lobby tick.
    && !((chore.survey || chore.plotWork || chore.huntLand || chore.fells || chore.fetchesLogs) && world.status === 'lobby')).map(([id, chore]) => {
    const { can, why } = choreAvailability(world, household, entity, id, logsOut);
    // `haul` is what this person's own hands would bring back from this trip, before any
    // cap. The cap itself is the mode's `carry`, which the projection sends alongside; the
    // control puts the two together so a student sees what a choice costs before making
    // it, which is `FIC-GONZ-008`'s rule about visible outcomes applied to a number.
    // What this person's own hands would bring back, before any cap. `kept` is left off
    // deliberately: the control works it out from this and the mode's `carry`, which the
    // projection already sends, and a second copy of a number nobody reads is exactly the
    // freight this channel is not for.
    // The hunt on the family's own land goes on foot, so the mode's carry on the control would be wrong for it: its
    // description says what comes home instead, and the channel is spared the number (tests/family.test.mjs).
    // The four gathering works go on foot for the same reason, and what each brings home is a fixed thing said in its own
    // words on the control - "a squirrel or two", "perch and trout" - so they are spared it too. Four chores' worth of
    // haul for every person in the family is most of a kilobyte a tick for a number that never changes.
    const full = chore.hauls && !chore.huntLand && !chore.forage ? haulFor(entity, id) : null;
    const haul = full && { resource: full.resource, got: full.got };
    // What this one actually costs this family today, and what the field would give back.
    // Fetching logs costs the ox and wagon for as long as the nearest timber is far: said in hours and miles (`fetchLogsFacts`).
    const cost = chore.fetchesLogs ? fetchLogsFacts(world, household).cost || ''
      // The four gathering works cost hours and a walk rather than a resource, and one of them costs a shot as well.
      : chore.forage ? forageCost(world, household, id)
      : chore.needsAny ? chore.needsAny.map(costWords).join(' or ') : costWords(needsOf(household, chore));
    const crop = chore.wantsWagon
      ? { grown: round(yieldFor(standingCrop(household), entity.skills?.[chore.skill] ?? 1)), share: harvestShare(household) }
      : null;
    // `level` used to ride here for every chore for every person and was read by nothing
    // at all - thirty-six copies a tick of a number with no reader.
    return can
      ? { id, can: true, ...(cost && { cost }), ...(haul && { haul }), ...(crop && { crop }) }
      : { id, can: false, why, ...(cost && { cost }), ...(haul && { haul }), ...(crop && { crop }) };
  });
  // A hunt on the family's land refused for the same reason as the hunt in the timber says so once: the page reads it there.
  const timber = list.find(entry => entry.id === 'hunt-timber'), land = list.find(entry => entry.id === 'hunt-land');
  if (land && !land.can && timber && land.why === timber.why) delete land.why;
  return list;
}

/**
 * The family answers, or the moment passes without them.
 *
 * A chore that asks must never become a chore that waits for ever: a student who has gone
 * to look at a neighbour's trouble would otherwise come back to somebody standing in a
 * wood until the class ended. So the answer is theirs for two hours and then the person
 * decides for themselves - and the record says which of those happened, because "we chose
 * to take the shot" and "nobody was listening" are different stories about the same family.
 */
function settleAsk(world, household, entity, option, how = 'answered') {
  const state = entity.chore, ask = state.ask;
  // Nobody answering falls to 'leave' where nothing else can be; an ask with no such answer settles on its first.
  const chosen = ask.options.find(candidate => candidate.id === option) || ask.options[0];
  option = chosen.id;
  state.ask = null;
  state.flags = [...(state.flags || []), option, ...(option === 'leave' ? ['empty'] : [])];
  record(world, 'choice', {
    actorId: entity.id, householdId: household.id, decision: option, importance: how === 'auto' ? 1 : 2,
    text: how === 'silence' ? `Nobody answered. ${entity.name} decided alone: ${chosen.label.toLowerCase()}.`
      : how === 'auto' ? `${entity.name}, deciding for themself, chose: ${chosen.label.toLowerCase()}.`
      : `${entity.name} will ${chosen.label.toLowerCase()}.`,
  });
  return option;
}

/** One of your family, answering something they were asked in the middle of their work. */
export function answerChore(world, household, entity, option) {
  const ask = entity.chore?.ask;
  if (!ask) throw new Error('Nobody is waiting on an answer.');
  if (!ask.options.some(candidate => candidate.id === option)) throw new Error('That is not one of the answers.');
  // Asked again at the moment it is answered rather than trusted from when it was offered:
  // a household's powder can change while somebody stands in a wood, and a control that
  // says a thing is possible must not be refused on the press.
  const allowed = askAvailability(world, household, entity, option);
  if (!allowed.can) throw new Error(allowed.why);
  return settleAsk(world, household, entity, option, false);
}

export function beginChore(world, household, entity, choreId, { beginTravel, modeAvailability }, modeId = DEFAULT_MODE, extra = {}) {
  const chore = CHORES[choreId];
  // Clearing and fencing need the plot, sent the same way, and are refused for that plot first: the plot chosen is what the refusal is about.
  if (chore.plotWork) {
    const plot = plotsOf(world, household).find(candidate => candidate.id === extra.plotId);
    const why = plotWorkRefusal(world, household, choreId, plot || null, { entity });
    if (why) throw new Error(why);
    extra = { plot: { x: plot.x, y: plot.y }, plotId: plot.id };
  }
  const { can, why } = choreAvailability(world, household, entity, choreId);
  if (!can) throw new Error(why || 'That work is not available.');
  // Survey needs the place; it is sent as its own order with the place in it (sim/survey.mjs).
  if (chore.survey && !extra.plot) throw new Error('Choose a place on your land to survey.');
  // Felling needs the place too, and is refused for that place first (sim/felling.mjs).
  if (chore.fells) {
    const why = fellRefusal(world, household, extra.ground);
    if (why) throw new Error(why);
    extra = { ground: { x: round(extra.ground.x), y: round(extra.ground.y) } };
  }
  // So does hunting the family's own land (sim/hunting.mjs), sent on foot by its own order (sim/world.mjs).
  if (chore.huntLand) {
    const why = huntRefusal(world, household, extra.ground);
    if (why) throw new Error(why);
    const home = world.map.sites[household.homeSiteId], place = huntingPlace(world, extra.ground);
    const dx = extra.ground.x - home.x, dy = extra.ground.y - home.y, far = Math.hypot(dx, dy);
    // On the biomes the quarry the place holds today goes with the hunter: the one the family was told of (sim/hunting.mjs).
    extra = { ground: { x: round(extra.ground.x), y: round(extra.ground.y), game: place.game, cover: placeWord(place), toward: far > 0.001 ? { x: round(dx / far), y: round(dy / far) } : { x: 0, y: -1 }, ...(place.comes && { quarry: place.comes }) } };
  }
  // Refused before the work is written down.
  //
  // Keyed on whether the chore travels at all, not on whether it hauls. A chore that
  // travels but carries nothing back - buying a hoe in town - would otherwise keep a mode
  // nobody had checked, and the return leg runs inside `advanceChores` during a tick. A
  // journey that turns out to be impossible there throws from inside `stepWorld`, which
  // does not refuse one student's order: it stops the whole class.
  // A chore that can only go one way goes that way, whatever was asked: logs come home in the wagon.
  if (chore.forceMode) modeId = typeof chore.forceMode === 'function' ? chore.forceMode(world, household) : chore.forceMode;
  if (chore.steps.some(step => step.travel) && modeId !== DEFAULT_MODE) {
    const mode = modeAvailability?.(world, entity, modeId);
    if (mode && !mode.can) throw new Error(mode.why);
  }
  entity.chore = { id: choreId, step: -1, wait: 0, doing: 'setting out', ...(modeId !== DEFAULT_MODE && { mode: modeId }), ...(extra.plot && { plot: { x: extra.plot.x, y: extra.plot.y } }), ...(extra.plotId && { plotId: extra.plotId }), ...(extra.ground && { ground: extra.ground }) };
  entity.task = 'work';
  // A chore kept in its own module may need to set something up as it begins: a road chore halts the family (sim/road.mjs).
  chore.begin?.(world, household, entity);
  if (chore.helps) {
    const host = hostOf(world, entity);
    Object.assign(entity.chore, { hostHouseholdId: host.id, spells: 0 });
    recordHelpBegun(world, household, entity, host);
  } else record(world, 'assignment', { actorId: entity.id, householdId: household.id, text: `${entity.name} set out: ${chore.name.toLowerCase()}.` });
  advanceChore(world, household, entity, { beginTravel });
  return entity.chore;
}

/**
 * How much of a hauling chore's yield this person would actually bring home, said before
 * they are sent. The whole point of the cap is that it is a decision rather than a
 * surprise, and a number on the button is what makes it one.
 */
export function haulFor(entity, choreId, modeId = DEFAULT_MODE) {
  const chore = CHORES[choreId];
  if (!chore?.hauls) return null;
  // `strike` is a produce that had to hit something first; what it would yield is the
  // same number and belongs on the control just the same. Reading only `produce` here is
  // how the hunt's own haul note silently became null the day the shot could miss.
  const yielding = chore.steps.find(step => step.produce || step.strike);
  const produce = yielding?.produce || yielding?.strike;
  if (!produce) return null;
  const [resource, amount] = Object.entries(produce)[0];
  const got = yieldFor(amount, entity.skills?.[chore.skill] ?? 1);
  return { resource, got: round(got), kept: round(Math.min(got, carryCapacity(modeId))) };
}

/** One step of one person's chore. Called once per tick per working person. */
function advanceChore(world, household, entity, { beginTravel, modeAvailability }) {
  const chore = CHORES[entity.chore.id];
  const skill = entity.skills?.[chore.skill] ?? 1;
  // A travel step owns the person until the road is behind them. A road chore (sim/road.mjs) runs where the family has
  // halted on its way east: the road is still theirs, but the ground has stopped going past.
  if (entity.travel && !(chore.road && entity.travel.halted)) return;
  const state = entity.chore;
  // Somebody working beside them finished the house: nobody goes on thatching a roof that is on.
  if (chore.house && houseBuilt(household)) return finishChore(world, household, entity, chore);
  // A neighbour stops when the walls are up, or when they are no longer standing on that land.
  const host = chore.helps ? world.households[state.hostHouseholdId] : null;
  if (chore.helps && (!host || hostOf(world, entity) !== host || !raising(host))) return finishHelping(world, household, entity, chore);
  // Waiting on the family. Nothing moves, nothing is spent, and the step is not advanced
  // past - without this the question would be asked and answered by the next tick, which
  // is a question in name only.
  if (state.ask) {
    // A family whose student has gone (sim/absence.mjs) is not waited for.
    if (!household.absent && world.minute - state.ask.openedMinute < ASK_PATIENCE) return;
    // Nobody answered in time: auto takes over for this one question (`autoChoice`). Deciding alone still cannot do the
    // impossible - a person with nothing to fire comes away - and a counter nobody answered pays the first way the family
    // can: food, as it always was, and coin if there is not the food.
    settleAsk(world, household, entity, autoChoice(world, household, entity), household.absent ? 'auto' : 'silence');
  }
  // Spend a tick of the current step, and only move on once it is actually paid for.
  // Returning here whenever the counter was non-zero would cost one extra tick per step,
  // so a four-tick job would quietly take five.
  if (state.wait > 0) {
    state.wait--;
    if (state.wait > 0) return;
  }
  while (true) {
    state.step++;
    // `let`, because a shot that connects hands itself on to the ordinary produce rule
    // rather than restating the carrying cap in a second place.
    let step = chore.steps[state.step];
    if (!step) return finishChore(world, household, entity, chore);
    // A step that belongs to an answer nobody gave is not this hunt's step.
    if (step.when && !step.when.some(flag => (state.flags || []).includes(flag))) continue;
    if (step.doing) state.doing = step.doing.replace('{town}', world.map.sites[townOf(household)]?.name || 'town').replace('{cover}', state.ground?.cover || coverWord(world, household))
      .replace('{logwood}', () => (logwoodGround(world, household, false)?.name || 'the timber').replace(/^The /, 'the '))
      .replace('{water}', () => (fishingSite(world, household, false)?.name || 'The creek').replace(/^The /, 'the '));
    if (step.walk) {
      // Inside the homestead. The person's canonical site is unchanged - they are still
      // at home - but they stand where the work is.
      //
      // This step may only ever move someone who is already standing on their own land.
      // A `walk` is not a journey, and letting one run for a person who has ended up
      // somewhere else would carry them home across the map for nothing: exactly the
      // teleport the world's "returning home requires a journey" rule forbids.
      if (entity.location.siteId !== household.homeSiteId) return abandonChore(world, household, entity, chore);
      const point = step.walk === 'field' ? fieldPoint(world, household) : step.walk === 'lane' ? (lanePoint(world, household) || yardPoint(world, household)) : yardPoint(world, household);
      if (point) entity.location = { x: point.x, y: point.y, siteId: household.homeSiteId };
      state.wait = 1;
      return;
    }
    if (step.travel && state.ground) {
      delete state.quarry;
      if (entity.location.siteId !== household.homeSiteId) return abandonChore(world, household, entity, chore);
      const target = step.travel === 'home' ? strollTarget(world, household, entity, 'yard') : state.ground;
      if (!stroll(world, household, entity, target)) { state.step--; return; }
      continue;
    }
    if (step.travel) {
      // Whatever was hunted is carried now, or was never taken.
      delete state.quarry;
      const destination = step.travel === 'home' ? household.homeSiteId
        : step.travel === 'timber' ? timberFor(world, household)
        : step.travel === 'logwood' ? logwoodGround(world, household)?.id
        // The water a family fishes and the shore it gathers on, each found from the house (sim/gathering.mjs).
        : step.travel === 'water' ? fishingSite(world, household)?.id
        : step.travel === 'shore' ? shoreSite(world, household)?.id
        : step.travel === 'town' ? townOf(household)
        // Houston's camp is wherever it is when they set out (sim/houston.mjs).
        : step.travel === 'houston-camp' ? houstonCamp(world) : step.travel;
      // Already standing there: nothing to walk, so fall through to the next step.
      if (!destination || entity.location.siteId === destination) continue;
      // How they meant to go may not be theirs any more: a chore that began with the horse can
      // reach its walking step after somebody else has taken it, and `beginTravel` refuses a mode
      // the family cannot supply. Refusing is right; throwing in the middle of a tick is not - it
      // stopped the whole class. They walk instead, which is always possible and is what somebody
      // who came out to find the horse gone would do.
      // A step may name its own way of going: logs come home in the wagon, however the fetcher went out to it.
      const wanted = step.mode || state.mode || DEFAULT_MODE;
      const held = wanted === DEFAULT_MODE || (modeAvailability?.(world, entity, wanted)?.can ?? true);
      if (!held) state.mode = DEFAULT_MODE;
      beginTravel(world, entity, destination, null, 'chore', held ? wanted : DEFAULT_MODE);
      return;
    }
    if (step.ask) {
      // The work stops here and waits for the family. Nothing is decided and nothing is
      // spent; the person stands where they are until somebody answers or their own
      // patience runs out.
      const ask = ASKS[step.ask];
      state.doing = ask.doing;
      state.ask = {
        id: step.ask, openedMinute: world.minute, fallback: typeof ask.fallback === 'function' ? ask.fallback(household) : ask.fallback,
        text: ask.text(entity, world, household), options: ask.options(entity, world, household),
      };
      // On auto the question is decided the tick it is asked - no "!", no wait, the person's own switch (sim/auto.mjs).
      if (entity.auto || household.absent) { settleAsk(world, household, entity, autoChoice(world, household, entity), 'auto'); continue; }
      record(world, 'pressure', {
        actorId: entity.id, householdId: household.id, importance: 2,
        text: `${ask.text(entity)} ${entity.name} is waiting on the family's word.`,
      });
      return;
    }
    if (step.strike) {
      // Whether the shot went home, decided by the person, the range and the sky, and nothing else.
      // Waiting closed the range, so somebody who waited connects whatever their state - **unless the powder is damp**
      // (`powderDamp`, sim/hunting.mjs, `FIC-GONZ-135`). Smithwick: "our only care being to keep our powder dry". In the
      // rain the close shot wants the steady hand the long one wants, or a rifle the gunsmith has put in order. There is
      // still no die in any of it: the same person on the same day does the same thing.
      const damp = powderDamp(world, huntPoint(entity), Math.floor(world.minute / 1440));
      const close = (state.flags || []).includes('wait') && !damp;
      // A rifle the gunsmith put in order makes the long shot for a hand without the knack; tired is still tired (sim/shops.mjs).
      const trueRifle = rifleTrue(household) && entity.health?.condition !== 'tired';
      if (!close && !steadyHand(entity) && !trueRifle) {
        state.flags = [...(state.flags || []), 'empty'];
        record(world, 'consequence', {
          actorId: entity.id, householdId: household.id, importance: 2,
          text: damp
            ? `${entity.name}'s powder had taken the wet and the rifle would not fire. The afternoon is gone.`
            : `${entity.name} fired and missed \u2014 ${unsteadyBecause(entity)}. The afternoon is gone.`,
        });
        continue;
      }
      state.flags = [...(state.flags || []), 'carrying'];
      // On the biomes the kill is the place's own quarry (sim/hunting.mjs `quarryAt`, docs/BIOME_GAMEPLAY.md §3): what it
      // makes, what one person carries of it and its hide, and the family is told what was brought down.
      const quarry = state.ground?.quarry && GAME[state.ground.quarry] ? state.ground.quarry : null;
      if (quarry) {
        // The month goes in with it: a turkey is fat in the winter and a deer lean (sim/hunting.mjs `winterShare`).
        const month = dateOf(world, world.minute || 0).getUTCMonth();
        const kill = killYield(quarry, chore.hauls ? carryCapacity(state.mode) : Infinity, amount => yieldFor(amount, skill), month);
        household.resources.food = round((household.resources.food ?? 0) + kill.carried);
        if (kill.hide) household.resources.hides = (household.resources.hides ?? 0) + kill.hide;
        const hide = kill.hide ? `, and ${quarry === 'bear' ? 'the skin' : quarry === 'bison' ? 'the robe' : 'the hide'}` : '';
        record(world, 'hunt-kill', {
          actorId: entity.id, householdId: household.id, importance: 2, quarry, food: round(kill.carried), claimId: 'FIC-GONZ-065',
          text: `${entity.name} brought down ${GAME[quarry].a}: ${round(kill.carried)} food came home${hide}.${kill.left > 0 ? ` The rest, ${kill.left} food, was more than ${entity.name} could carry and was left where it fell.` : ''}`,
        });
        continue;
      }
      // And the hide comes home with it, for the tanner (sim/shops.mjs).
      household.resources.hides = (household.resources.hides ?? 0) + 1;
      // Falls through to the ordinary produce rule, carrying cap and all, so what comes
      // home is decided in one place for every chore that hauls rather than two.
      step = { produce: step.strike };
    }
    if (step.stalk) {
      // Only ever moves somebody about the place they are already standing. A person on
      // the road has no site, and moving them would put them nowhere - which is the same
      // trap `walk` fell into once, resolved the same way: refuse rather than teleport.
      if (!entity.location.siteId) return;
      const point = stalkPoint(world, entity, step.stalk);
      if (point) entity.location = { x: point.x, y: point.y, siteId: entity.location.siteId };
      // Deliberately falls through to the `work` on the same step. Moving there and then
      // spending time there is one stage of a hunt, not two, and giving the move a tick of
      // its own bought nothing: the work that follows already holds the figure in its new
      // place for as long as it takes. Keeping them separate made a hunt half again as
      // long as it had been before any of this was visible.
    }
    // Only a deer is drawn. stand-in: docs/ART_REQUESTS.md, request 2026-09-19 - the game of 1836: any other quarry is words
    // only until its art exists, so it is given no place to be drawn at, rather than a deer's picture where the words say a bear.
    if (step.quarry && (!state.ground?.quarry || state.ground.quarry === 'deer')) state.quarry = quarryPoint(world, entity, step.quarry);
    if (step.shot) {
      // The one moment of a hunt, and the only thing drawn of it is smoke in the trees.
      // Recorded because it is a thing that happened in a place at a time: a shot carries,
      // and the day somebody wants a neighbour to have heard one, this is what they hang
      // it on. It names no animal, because no animal has been named.
      household.resources.powder = round(Math.max(0, (household.resources.powder ?? 0) - SHOT_COST));
      spendRifleShot(household);
      record(world, 'hunt', {
        actorId: entity.id, householdId: household.id,
        text: `${entity.name} fired in ${state.ground?.cover || coverWord(world, household)}.`,
      });
      state.wait = 1;
      return;
    }
    // Said in the words of whatever part of the house the family has got to.
    if (step.houseWork) state.doing = chore.helps ? `helping raise the walls` : stageOf(household);
    if (step.clearWork) {
      const plot = plotsOf(world, household).find(candidate => candidate.id === state.plotId);
      state.doing = plot?.ground === 'timber' ? 'felling timber on the clearing' : plot?.ground === 'brush' ? 'grubbing out brush' : 'breaking prairie sod';
    }
    // Heavy work goes at the pace of the person's hidden strength as well as their skill.
    // Heavy work at home goes slower still while the family carries its water from far off (sim/homesite.mjs).
    if (step.work) {
      let fence = null;
      if (step.work === 'fence') {
        fence = fenceWork(world, household, plotsOf(world, household).find(candidate => candidate.id === state.plotId));
        if (fence.how === 'mesquite') state.doing = 'cutting mesquite posts and brush';
        else if (fence.how === 'hauled') state.doing = 'carrying rails from the timber';
      }
      // The wait downwind is the ground's and the sky's together (sim/hunting.mjs `huntWait`, `FIC-GONZ-135`): game lies
      // up in the rain and a fog hides the approach.
      const sky = step.stalk === 'still' && state.ground ? huntWait(weatherAt(world, huntPoint(entity)).kind) : 1;
      const ticks = step.work === 'well' ? wellTicks(household) : fence ? fence.ticks : step.stalk === 'still' && state.ground ? stillTicks(quarryGame(state.ground.game, state.ground.quarry), step.work, sky) : step.work;
      const burden = chore.heavy && chore.where === 'home' ? waterBurden(household) : 1;
      // A parent with a baby at home and no cradle does heavy work slower, and it says so (sim/furniture.mjs).
      const baby = chore.heavy && chore.where === 'home' && entity.location.siteId === household.homeSiteId && mindingBaby(world, household, entity) ? BABY_BURDEN : 1;
      if (baby > 1 && state.doing && !state.doing.includes('the baby')) state.doing = `${state.doing}, with the baby to mind`;
      state.wait = paceFor(ticks, skill, (chore.heavy ? heavyWorkPace(entity) : 1) * burden * baby);
      return;
    }
    if (step.consume) {
      for (const [resource, amount] of Object.entries(step.consume)) {
        household.resources[resource] = round(Math.max(0, (household.resources[resource] ?? 0) - amount));
        // Coin paid at a counter is in the trader's purse now, and can be paid out again.
        const trader = resource === 'money' && world.entities[state.traderId];
        if (trader) trader.purse = purseOf(world, trader) + amount;
        // Said, and tagged with the coin it cost, because the ending tells a family where its coin went.
        if (resource === 'money' && amount > 0) {
          record(world, 'consequence', { actorId: entity.id, householdId: household.id, coin: -amount, text: `${entity.name} paid ${amount} ${resourceName('money', amount)} ${chore.road ? 'among the families camped there' : 'in town'}.` });
        }
      }
      continue;
    }
    if (step.consumePerPlot) {
      for (const [resource, amount] of Object.entries(step.consumePerPlot)) {
        household.resources[resource] = round(Math.max(0, (household.resources[resource] ?? 0) - amount * clearedOf(household)));
      }
      continue;
    }
    if (step.sell) {
      // As much as this person could carry, which is what they set out with. Deciding it
      // at the counter rather than at the door comes to the same number and keeps the
      // carrying rule in one place.
      const { good, want, rate, per, gives } = step.sell;
      const carried = round(Math.min(household.resources[good] ?? 0, carryCapacity(state.mode)));
      // Coin is paid only for whole bundles - a whole bale, three food - so what is sold for
      // coin is the whole bundles carried, and anything left over stays in the house.
      // Coin is paid out of the storekeeper's purse, and no more than it holds.
      // Cotton and food are the exception: the store buys a family's whole crop for coin, because it ships the bales and the corn
      // down to the coast on its own credit (owner, 2026-09-16, docs/COLONIES.md §7e and docs/MONEY_AND_GLORY.md §8.1, so a family
      // that stays home can sell what it grew; `FIC-GONZ-044`, `FIC-GONZ-047`). Everything else is paid from the storekeeper's
      // purse, which is scarce (`FIC-GONZ-022`).
      const trader = want === 'money' && !['cotton', 'food'].includes(good) ? world.entities[state.traderId] : null;
      const bundles = per ? Math.floor(carried / per) : 0;
      const affordable = trader ? Math.min(bundles, Math.floor(purseOf(world, trader) / gives)) : bundles;
      const sold = per ? affordable * per : carried;
      const got = per ? affordable * gives : round(carried * rate);
      if (trader) trader.purse -= got;
      if (trader && affordable < bundles) {
        record(world, 'consequence', {
          actorId: entity.id, householdId: household.id, importance: 2,
          text: `${trader.name} had coin for only ${affordable === 0 ? 'none of it' : `${affordable * per} ${good}`}, and the rest came home again.`,
        });
      }
      if (sold > 0) {
        household.resources[good] = round((household.resources[good] ?? 0) - sold);
        household.resources[want] = round((household.resources[want] ?? 0) + got);
        record(world, 'consequence', {
          actorId: entity.id, householdId: household.id, importance: 2,
          ...(want === 'money' && { coin: got }),
          text: `${entity.name} sold ${sold} ${good} at the store and brought home ${got} ${resourceName(want, got)}.`,
        });
      } else if (per && bundles === 0) {
        record(world, 'consequence', {
          actorId: entity.id, householdId: household.id, importance: 2,
          text: `${entity.name} had less than the store would pay coin for, and brought it home again.`,
        });
      }
      continue;
    }
    if (step.practise) {
      const was = entity.skills?.[step.practise] ?? 1;
      // ceiling: `choreAvailability` refuses this before the work is ever begun, and
      // `validateWorld` refuses a world holding a skill outside one to three, so no
      // injection can make this clamp fire today - it is the middle of three locks. It is
      // kept because it is the only one that would still hold if a chore ever carried two
      // `practise` steps, which is exactly the shape of a plausible mistake: adding a
      // second one is a one-line edit and nothing else in the file would notice.
      if (was < SKILL_CAP) {
        entity.skills = { ...entity.skills, [step.practise]: was + 1 };
        record(world, 'memory', {
          actorId: entity.id, householdId: household.id, importance: 2,
          text: was + 1 >= SKILL_CAP
            ? `${entity.name} spent the afternoon at the mark. Nobody on this land shoots better.`
            : `${entity.name} spent the afternoon at the mark, and a long shot is not beyond them now.`,
        });
      }
      continue;
    }
    if (step.clearSpell) {
      // Another spell, unless that cleared the plot (or somebody else's spell already had, or it was taken back to
      // staked while they walked out). Then everybody clearing it leaves off at once and comes in, as on the house.
      if (!clearSpell(world, household, entity, state.plotId)) { state.step = chore.steps.findIndex(candidate => candidate.clearWork) - 1; continue; }
      const homeward = chore.steps.findIndex(candidate => candidate.stroll === 'yard') - 1;
      for (const id of household.members) {
        const worker = world.entities[id];
        if (worker && worker !== entity && worker.chore?.id === 'clear-plot' && worker.chore.plotId === state.plotId) Object.assign(worker.chore, { step: homeward, wait: 0, doing: 'coming in from the clearing' });
      }
      continue;
    }
    if (step.build && chore.helps) {
      // The spell goes into the neighbour's house. If it was the spell that finished their walls, the
      // helper stops; if, improbably, it finished the house, that family's own builders stop too.
      const finished = buildSpell(world, host, entity);
      state.spells = (state.spells || 0) + 1;
      if (finished) for (const id of host.members) { const worker = world.entities[id]; if (worker && CHORES[worker.chore?.id]?.house) finishChore(world, host, worker, CHORES[worker.chore.id]); }
      if (finished || !raising(host)) return finishHelping(world, household, entity, chore);
      state.step = chore.steps.findIndex(candidate => candidate.houseWork) - 1;
      continue;
    }
    if (step.build) {
      // Another spell, unless that was the last one. Then everybody on the house stops at once, this
      // person and whoever was working beside them - not a tick later, still thatching a finished roof.
      if (!buildSpell(world, household, entity)) { state.step = chore.steps.findIndex(candidate => candidate.houseWork) - 1; continue; }
      for (const id of household.members) {
        const worker = world.entities[id];
        if (worker && CHORES[worker.chore?.id]?.house) finishChore(world, household, worker, CHORES[worker.chore.id]);
      }
      return;
    }
    if (step.raise === 'fence') { raiseFence(world, household, entity, state.plotId); continue; }
    if (step.dig === 'well') { digWell(world, household, entity); continue; }
    if (step.stake) { stakePlot(world, household, entity); continue; }
    if (step.stroll) {
      // About the family's own land on foot, a tick's walk at a time; never a journey, and never off the land.
      if (entity.location.siteId !== household.homeSiteId) return abandonChore(world, household, entity, chore);
      const target = strollTarget(world, household, entity, step.stroll);
      if (!target) continue;
      if (stroll(world, household, entity, target)) {
        // A round of the fields goes on to the next plot until it has reached them all.
        if (step.stroll !== 'fields' || !moreFields(world, household, entity)) continue;
        state.visited = (state.visited || 0) + 1;
      }
      state.step--;
      return;
    }
    if (step.fell) {
      // One tree at a time, until none is left in reach. A tree whose work is paid for comes down first.
      if (entity.location.siteId !== household.homeSiteId) return abandonChore(world, household, entity, chore);
      if (state.felling) { fellTree(world, household, entity, state.felling); delete state.felling; }
      const tree = nextTree(world, household, entity);
      if (!tree) continue;
      if (!stroll(world, household, entity, { x: tree.x, y: tree.y })) { state.step--; return; }
      state.felling = tree.id;
      state.doing = `felling ${/^[aeiou]/.test(KINDS[tree.kind].name) ? 'an' : 'a'} ${KINDS[tree.kind].name}`;
      state.wait = paceFor(fellTicks(tree), skill, heavyWorkPace(entity) * waterBurden(household));
      state.step--;
      return;
    }
    if (step.saidFelling) { recordFelling(world, household, entity); continue; }
    // A wagon load of logs fetched from the nearest timber (`fetch-logs`): loaded where they were felled, onto the pile at home.
    if (step.loadLogs) { state.logs = step.loadLogs; continue; }
    if (step.stackLoad) {
      if (entity.location.siteId !== household.homeSiteId || !state.logs) continue;
      stackLogs(household, { wall: state.logs });
      record(world, 'improvement', { actorId: entity.id, householdId: household.id, importance: 2, claimId: 'FIC-GONZ-066', text: `${entity.name} brought ${state.logs} logs home in the wagon from ${(logwoodGround(world, household, false)?.name || 'the timber').replace(/^The /, 'the ')}.` });
      delete state.logs;
      continue;
    }
    if (step.haul) {
      // Out to the nearest logs, take up a load, bring it to the house; again until none lie out.
      if (entity.location.siteId !== household.homeSiteId) return abandonChore(world, household, entity, chore);
      if (state.load) {
        if (!stroll(world, household, entity, strollTarget(world, household, entity, 'yard'))) { state.step--; return; }
        stackLogs(household, state.load);
        state.hauled = (state.hauled || 0) + state.load.n;
        delete state.load;
        state.step--;
        return;
      }
      const lying = logsLying(world, household)[0];
      if (!lying) {
        if (state.hauled) record(world, 'improvement', { actorId: entity.id, householdId: household.id, importance: 2, claimId: 'FIC-GONZ-032', text: `${entity.name} hauled ${state.hauled} ${state.hauled === 1 ? 'log' : 'logs'} to the house.` });
        continue;
      }
      if (!stroll(world, household, entity, { x: lying.x, y: lying.y })) { state.step--; return; }
      state.load = takeUpLogs(world, household, entity);
      state.doing = state.load.n > 1 ? `dragging ${state.load.n} logs behind the ox` : 'carrying a log to the house';
      state.wait = 1;
      state.step--;
      return;
    }
    if (step.cutLane) {
      // Another stretch, unless that reached the road. Then everybody cutting leaves off at once, as on the house, and
      // comes back up the lane: not a tick later, still swinging an axe at a lane that is cut.
      if (!cutLaneSpell(world, household, entity, step.cutLane)) { state.step = chore.steps.findIndex(candidate => candidate.walk === 'lane') - 1; continue; }
      const homeward = chore.steps.findIndex(candidate => candidate.walk === 'yard') - 1;
      for (const id of household.members) {
        const worker = world.entities[id];
        if (worker && worker !== entity && CHORES[worker.chore?.id]?.lane) Object.assign(worker.chore, { step: homeward, wait: 0, doing: 'coming back up the lane' });
      }
      continue;
    }
    if (step.produceCrop) {
      // What is standing, less what the stock have had out of it. Both numbers are on the
      // controls that spend the afternoon, so a family that harvests an unfenced field
      // knew before they started what it would cost them.
      // What the field actually grew. A cotton field used to come in as food, so a family
      // ate its cotton - which is not a balance choice, it is the game not knowing what
      // the crop was. Corn is the staple this colony lived on and cotton is what it sold.
      const crop = household.field?.crop === 'cotton' ? 'cotton' : 'food';
      const grown = yieldFor(standingCrop(household), skill);
      const kept = round(grown * harvestShare(household));
      household.resources[crop] = round((household.resources[crop] ?? 0) + kept);
      // Two things can be true of one harvest: the stock got into it, and it is a crop
      // nobody can eat. Said in one sentence rather than letting the fence swallow the
      // more important half - a family that comes home with cotton needs to know what it
      // is for whether or not the field was fenced.
      const lost = kept < grown ? ' The rest had gone to stock in an unfenced field.' : '';
      const inedible = crop === 'cotton' ? ' Nobody can eat it; it has to go to the store.' : '';
      if (lost || inedible) {
        record(world, 'consequence', {
          actorId: entity.id, householdId: household.id, importance: 2,
          text: `${entity.name} brought in ${kept} ${crop}.${lost}${inedible}`,
        });
      }
      continue;
    }
    if (step.produce) {
      // What a trip brings home is what they can carry home. The kill is the kill; how
      // much of it reaches the family is the decision they made when they set out, and
      // it is told plainly rather than quietly subtracted.
      //
      // ceiling: the cap is applied per resource rather than as one load shared between
      // them, which is the same answer while no chore produces two things at once. If one
      // ever does, this has to become a budget spent in order.
      const capacity = chore.hauls ? carryCapacity(state.mode) : Infinity;
      for (const [resource, amount] of Object.entries(step.produce)) {
        const got = yieldFor(amount, skill);
        const kept = round(Math.min(got, capacity));
        household.resources[resource] = round((household.resources[resource] ?? 0) + kept);
        if (kept < got) {
          record(world, 'consequence', {
            actorId: entity.id, householdId: household.id, importance: 2,
            text: `${entity.name} could carry ${kept} ${resource} home and left ${round(got - kept)} behind.`,
          });
        }
        // A wagon with something in it is drawn with something in it.
        if (kept > 0 && chore.hauls && state.mode === 'wagon') {
          const wagon = world.entities[propertyId(household.id, 'wagon')];
          if (wagon) wagon.laden = true;
        }
        // What was gathered, said in the words of the thing itself rather than as a number of food
        // (sim/gathering.mjs, `FIC-GONZ-173` to `-176`). Nothing here can fail, so this is the only
        // event these four works record: no miss, no refusal at the water, no empty-handed walk.
        if (step.forage) {
          const work = FORAGE[step.forage];
          record(world, 'forage', {
            actorId: entity.id, householdId: household.id, importance: 1, forage: step.forage, food: kept,
            claimId: FORAGE_CLAIMS[step.forage],
            text: `${entity.name} brought home ${work.what}: ${kept} food.`,
          });
        }
      }
      continue;
    }
    if (step.field) {
      household.field = { ...household.field, state: step.field, changedTick: world.tick };
      // The seed went into the plots cleared now, and a plot cleared while it grows is not in crop. Written only where
      // the plots are: a class's old field counts as sown whenever its crop is in (sim/fields.mjs).
      if (household.plots) for (const plot of household.plots) {
        if (step.field === 'planted' && plot.state === 'cleared') plot.sown = true;
        if (step.field === 'bare') delete plot.sown;
      }
      continue;
    }
    if (step.wear === 'plot') {
      // Grubbing prairie and brush wears the hoe; felling timber is the axe's work, and nothing wears the axe yet.
      const plot = plotsOf(world, household).find(candidate => candidate.id === state.plotId);
      if (!plot || plot.ground === 'timber' || household.tools?.hoe === undefined) continue;
      step = { wear: 'hoe' };
    }
    if (step.wear) {
      household.tools[step.wear] = (household.tools[step.wear] ?? 0) + 1;
      if (toolState(household.tools[step.wear]) === 'worn') {
        record(world, 'property', { actorId: entity.id, householdId: household.id, text: `The ${step.wear} is worn out. It wants mending, or a new one from town.`, importance: 2 });
      }
      continue;
    }
    if (step.trade) {
      // A trade is with somebody. If nobody who deals in this is standing here, the trip
      // was wasted - which is a real outcome, and is said plainly rather than silently
      // handing over goods that nobody gave.
      const trader = traderAt(world, entity.location.siteId, step.trade);
      if (!trader) {
        record(world, 'consequence', { actorId: entity.id, householdId: household.id, text: `${entity.name} found nobody at Gonzales dealing in ${step.trade}.`, importance: 2 });
        return abandonChore(world, household, entity, chore);
      }
      state.tradedWith = trader.name;
      state.traderId = trader.id;
      // Selling food is dealing for coin, not for food; the record said 'traded ... for food' until measured live.
      recordTrade(world, household.id, entity, trader, step.trade === 'iron' ? 'a hoe' : step.trade === 'powder' ? 'powder and lead' : step.trade === 'food' ? 'coin' : step.trade);
      continue;
    }
    if (step.mend) { household.tools[step.mend] = 0; continue; }
    // The crop the family chose at the field goes in (the ask 'crop-choice').
    if (step.crop) { household.field = { ...household.field, crop: step.crop }; continue; }
    // A step owned by the chore's own module (`registerChores`): what the camp's work does when it is done (sim/camp.mjs).
    if (step.run) { step.run(world, household, entity, state); continue; }
    // Arrived where they meant to join or to vote (sim/winter.mjs).
    if (step.winter) { if (step.winter === 'vote') castVote(world, household, entity); else joinService(world, household, entity, step.winter); continue; }
    if (step.shop) {
      const chosen = (state.flags || []).find(flag => flag.includes(':'));
      if (chosen) takeCounter(world, household, entity, chosen);
      continue;
    }
    if (step.furnish) {
      furnish(household, step.furnish, step.how);
      const kind = FURNITURE[step.furnish];
      record(world, 'property', {
        actorId: entity.id, householdId: household.id, importance: 2,
        text: step.how === 'made' ? `${entity.name} made ${kind.a}. ${kind.does}` : `${entity.name} bought ${kind.a} from ${state.tradedWith || 'the carpenter'}. ${kind.does}`,
      });
      continue;
    }
  }
}

/**
 * The work is dropped where it stands, because something took this person elsewhere.
 * Told plainly rather than silently: a family that finds the seed spent and the field
 * still bare deserves to know the afternoon was lost, not to wonder.
 */
export function abandonChore(world, household, entity, chore = CHORES[entity.chore?.id]) {
  entity.chore = null;
  if (entity.task === 'work') entity.task = 'rest';
  record(world, 'consequence', { actorId: entity.id, householdId: household.id, text: `${entity.name} left off ${chore ? chore.name.toLowerCase() : 'the work'} unfinished.` });
}
/** A neighbour's help ends, and what they put in is said in both stories rather than a bare "finished". */
function finishHelping(world, household, entity, chore) {
  const host = world.households[entity.chore?.hostHouseholdId];
  const spells = entity.chore?.spells || 0;
  entity.chore = null;
  entity.task = 'rest';
  if (spells > 0 || (host && !raising(host))) recordHelpDone(world, household, entity, host, spells);
  else record(world, 'consequence', { actorId: entity.id, householdId: household.id, text: `${entity.name} left off ${chore.name.toLowerCase()} before putting any work in.` });
}
function finishChore(world, household, entity, chore) {
  entity.chore = null;
  entity.task = 'rest';
  record(world, 'consequence', { actorId: entity.id, householdId: household.id, text: `${entity.name} finished: ${chore.name.toLowerCase()}.` });
  // A chore kept in its own module may have something to do once the work is done (sim/road.mjs, the sick nursed a day).
  chore.done?.(world, household, entity);
}

/**
 * The field comes on by itself once it is planted. Growth is time passing, not work, so
 * it belongs here and not in a chore: a household that plants and then goes to war still
 * has a crop standing when someone comes back for it.
 */
export function advanceChores(world, { beginTravel, modeAvailability }) {
  for (const household of Object.values(world.households)) {
    const field = household.field;
    if (field?.state === 'planted' && world.tick - field.changedTick >= RIPEN_TICKS) {
      household.field = { ...field, state: 'ripe', changedTick: world.tick };
      record(world, 'property', { householdId: household.id, text: `The ${field.crop} is ready to bring in.`, importance: 2 });
    }
    for (const id of household.members) {
      const entity = world.entities[id];
      if (!entity?.chore) continue;
      if (entity.health.condition === 'dead' || entity.health.condition === 'captured') {
        // A person who cannot work does not silently keep working. The chore stops; the
        // condition is preserved, because routine time must never quietly resolve it.
        entity.chore = null;
        continue;
      }
      // Work that no longer exists - breaking new ground and fencing the whole field, retired when the field became
      // plots (docs/LAND_GRANTS.md §5) - is left off in a class saved in the middle of it, and said so.
      if (!CHORES[entity.chore.id]) { abandonChore(world, household, entity, null); continue; }
      advanceChore(world, household, entity, { beginTravel, modeAvailability });
    }
  }
}
