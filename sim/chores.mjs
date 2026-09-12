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
import { record } from './events.mjs';
import { recordTrade, traderAt } from './town.mjs';
import { carryCapacity, DEFAULT_MODE, MODES, propertyId } from './travel.mjs';
import {
  CLEARING_MAX, SEED_PER_CLEARING, UNFENCED_LOSS, clearGround, clearedOf, harvestShare,
  improvementsOf, isFenced, needsWagonToHarvest, raiseFence, standingCrop,
} from './improvements.mjs';
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
export const SHOT_COST = 1;
/** What an afternoon at the mark costs, and the ceiling it works towards. `FIC-GONZ-018`. */
export const PRACTICE_COST = 2;
export const SKILL_CAP = 3;
export const dryHouse = household => (household.resources?.powder ?? 0) < SHOT_COST;

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
  shot: {
    doing: 'downwind, with the shot there to take',
    fallback: 'take',
    text: entity => `${entity.name} is downwind of something, with a shot to take. It is not a close one.`,
    options: entity => [
      { id: 'take', label: 'Take the shot', note: `One powder. ${unsteadyBecause(entity) || `${entity.name} is steady, and it is within reach`}` },
      { id: 'wait', label: 'Wait for it to come closer', note: 'One powder, three more hours, and then the shot is a certainty' },
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
const paceFor = (ticks, skill) => Math.max(1, Math.round(ticks * (skill === 3 ? .7 : skill === 2 ? 1 : 1.35)));
const yieldFor = (amount, skill) => round(amount * (skill === 3 ? 1.4 : skill === 2 ? 1.15 : 1));

export const CHORES = {
  'plant-field': {
    name: 'Plant the field', skill: 'farming', tool: 'hoe', where: 'home',
    // Two seed for the first patch and two more for every time the ground has been
    // broken since: a family that clears more has more to put in, and more to find.
    needsPerClearing: { seed: SEED_PER_CLEARING }, field: 'bare',
    describe: 'Turn the rows and put in seed.',
    steps: [
      { walk: 'field', doing: 'walking out to the field' },
      { work: 4, doing: 'breaking the rows' },
      { consumePerClearing: { seed: SEED_PER_CLEARING } },
      { work: 3, doing: 'putting in seed' },
      { field: 'planted' },
      { wear: 'hoe' },
      { walk: 'yard', doing: 'coming in from the field' },
    ],
  },
  'harvest-field': {
    name: 'Bring in the crop', skill: 'farming', tool: 'hoe', where: 'home',
    field: 'ripe', wantsWagon: true,
    describe: 'The field is ready. Cut it and carry it in.',
    steps: [
      { walk: 'field', doing: 'walking out to the field' },
      { work: 6, doing: 'cutting the crop' },
      { produceCrop: true },
      { field: 'bare' },
      { wear: 'hoe' },
      { walk: 'yard', doing: 'carrying the crop in' },
    ],
  },
  'clear-ground': {
    name: 'Break new ground', skill: 'farming', tool: 'hoe', where: 'home',
    field: 'bare',
    describe: 'Cut the brush back and turn ground nobody has worked. A long afternoon, and the field is bigger for good.',
    steps: [
      { walk: 'field', doing: 'walking out to the edge of the field' },
      { work: 10, doing: 'breaking new ground' },
      { clear: 1 },
      { wear: 'hoe' },
      { walk: 'yard', doing: 'coming in from the field' },
    ],
  },
  'build-fence': {
    name: 'Fence the field', skill: 'hands', where: 'home',
    describe: 'Split rails and lay them round the crop. Stock here run loose, and an unfenced field feeds them first.',
    steps: [
      // ceiling: rails are split with an axe and a maul, and this household owns one hoe.
      // The tool model is deliberately one tool; a second one is next-task 1 in HANDOFF.md,
      // and this chore should wear it when there is one.
      { walk: 'field', doing: 'walking out to the field' },
      { work: 8, doing: 'splitting rails' },
      { raise: 'fence' },
      { walk: 'yard', doing: 'coming in from the field' },
    ],
  },
  'hunt-timber': {
    name: 'Hunt in the timber', skill: 'hunting', where: 'home', hauls: true,
    describe: 'A long trip to the timber and back. The kill is a big one; what comes home is what they can carry.',
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
      { travel: 'timber', doing: 'on the road to the timber' },
      { stalk: 'edge', work: 1, doing: 'reading the ground at the edge of the timber' },
      { stalk: 'deep', work: 1, doing: 'working up through the timber' },
      { stalk: 'still', work: 1, doing: 'waiting downwind, and still' },
      // And here the work stops and asks. Everything after this depends on the answer,
      // which is why the steps below carry the answers they belong to.
      { ask: 'shot' },
      { when: ['wait'], work: 3, doing: 'letting it come closer' },
      { when: ['take', 'wait'], shot: true, doing: 'the shot' },
      // Ten, and a good hunter takes more - but only the wagon can bring that much back.
      // On foot this still yields the five it always did, so a family that changes
      // nothing is no worse off than it was; the wagon is an upside for the family that
      // spends the extra hour on the road, not a tax on the one that does not.
      { when: ['take', 'wait'], strike: { food: 10 } },
      { when: ['carrying'], travel: 'home', doing: 'carrying it home from the timber' },
      { when: ['empty'], travel: 'home', doing: 'coming home from the timber with nothing' },
    ],
  },
  'practise-shooting': {
    name: 'Practise at the mark', skill: 'hunting', where: 'home',
    needs: { powder: PRACTICE_COST },
    describe: 'An afternoon at a mark set up behind the cabin, and two powder gone. A steadier hand makes the long shot and brings more home.',
    steps: [
      { walk: 'field', doing: 'setting up a mark behind the cabin' },
      { work: 5, doing: 'shooting at the mark' },
      { consume: { powder: PRACTICE_COST } },
      { practise: 'hunting' },
      { walk: 'yard', doing: 'coming in from the mark' },
    ],
  },
  'fetch-powder': {
    name: 'Buy powder and lead in Gonzales', skill: 'hands', where: 'home', hauls: true,
    needs: { food: 2 },
    describe: 'Trade in town for powder and lead. A shot spends one, and whoever goes upriver takes what is in the house with them.',
    steps: [
      { travel: 'gonzales', doing: 'on the road to Gonzales' },
      { work: 2, doing: 'looking for the trader' },
      { trade: 'powder', doing: 'trading for powder and lead' },
      { consume: { food: 2 } },
      { produce: { powder: 3 } },
      { travel: 'home', doing: 'walking home from Gonzales' },
    ],
  },
  'fetch-seed': {
    name: 'Fetch seed from Gonzales', skill: 'hands', where: 'home', hauls: true,
    needs: { food: 3 },
    describe: 'Trade in town for seed. Costs three food, and the road is as long as it is.',
    steps: [
      { travel: 'gonzales', doing: 'on the road to Gonzales' },
      { work: 2, doing: 'looking for the seed trader' },
      { trade: 'seed', doing: 'trading for seed' },
      { consume: { food: 3 } },
      { produce: { seed: 2 } },
      { travel: 'home', doing: 'walking home from Gonzales' },
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
  'replace-hoe': {
    name: 'Buy a hoe in Gonzales', skill: 'hands', where: 'home',
    needs: { food: 3 }, needsTool: 'worn',
    describe: 'Trade in town for a sound hoe. Costs three food.',
    steps: [
      { travel: 'gonzales', doing: 'on the road to Gonzales' },
      { work: 2, doing: 'looking for the smith' },
      { trade: 'iron', doing: 'trading for a hoe' },
      { consume: { food: 3 } },
      { mend: 'hoe' },
      { travel: 'home', doing: 'walking home from Gonzales' },
    ],
  },
};

export const toolState = wear => wear >= TOOL_LIFE ? 'worn' : 'sound';

/** The field a household works, as a point, so a person can stand in their own crop. */
function fieldPoint(world, household) {
  const feature = world.map.terrain.find(f => f.kind === 'field' && f.ownerHouseholdId === household.id);
  if (!feature) return null;
  const xs = feature.points.map(p => p.x), ys = feature.points.map(p => p.y);
  return { x: round((Math.min(...xs) + Math.max(...xs)) / 2), y: round((Math.min(...ys) + Math.max(...ys)) / 2) };
}
const yardPoint = (world, household) => {
  const site = world.map.sites[household.homeSiteId];
  return { x: round(site.x - .12), y: round(site.y + .18) };
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
const STALK = { edge: { dx: .13, dy: .21 }, deep: { dx: -.27, dy: -.09 }, still: { dx: .04, dy: -.35 } };
function stalkPoint(world, entity, where) {
  const site = world.map.sites[entity.location.siteId], spot = STALK[where];
  if (!site || !spot) return null;
  let hash = 2166136261;
  for (const character of `${entity.id}:${where}`) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  const jitter = ((hash >>> 0) % 200) / 200 - .5;
  return { x: round(site.x + spot.dx + jitter * .12), y: round(site.y + spot.dy + jitter * .12) };
}

/** The nearest stand of timber, so distance to work is the household's own distance. */
function timberFor(world, household) {
  const home = world.map.sites[household.homeSiteId];
  const stands = Object.values(world.map.sites).filter(site => site.kind === 'woods');
  if (!stands.length) return null;
  return stands.reduce((best, site) => Math.hypot(site.x - home.x, site.y - home.y) < Math.hypot(best.x - home.x, best.y - home.y) ? site : best).id;
}

/**
 * Whether this person can be asked to do this chore right now, and if not, why.
 * The reason is shown to the student: a control that is refused without saying why is
 * worse than no control.
 */
export function choreAvailability(world, household, entity, choreId) {
  const chore = CHORES[choreId];
  if (!chore) return { can: false, why: 'No such work.' };
  if (entity.kind !== 'person' || entity.householdId !== household.id) return { can: false, why: 'Not one of your family.' };
  if (entity.health.condition === 'dead' || entity.health.condition === 'captured') return { can: false, why: 'This person cannot work.' };
  if (entity.chore) return { can: false, why: `${entity.name} is already ${entity.chore.doing}.` };
  if (entity.travel) return { can: false, why: `${entity.name} is on the road.` };
  if (entity.task === 'help') return { can: false, why: `${entity.name} is away helping.` };
  if (chore.where === 'home' && entity.location.siteId !== household.homeSiteId) return { can: false, why: `${entity.name} is not at home.` };
  if (chore.field && (household.field?.state ?? 'bare') !== chore.field) {
    return { can: false, why: chore.field === 'ripe' ? 'The field is not ready.' : 'The field is already planted.' };
  }
  if (choreId === 'clear-ground' && clearedOf(household) >= CLEARING_MAX) {
    return { can: false, why: 'There is no more ground here worth breaking.' };
  }
  if (choreId === 'build-fence' && isFenced(household)) return { can: false, why: 'The field is already fenced.' };
  if (choreId === 'practise-shooting' && (entity.skills?.hunting ?? 1) >= SKILL_CAP) {
    return { can: false, why: `${entity.name} already shoots as well as anyone on this land.` };
  }
  // Past a certain amount of ground the crop is simply more than four people can carry
  // in by hand. The ox and the wagon have to be standing here - which, now that taking
  // them somewhere means they are somewhere else, is a thing a family can get wrong.
  if (chore.wantsWagon && needsWagonToHarvest(household) && !wagonAtHome(world, household)) {
    return { can: false, why: 'This much crop wants the wagon, and the wagon is not here.' };
  }
  if (chore.needsTool && toolState(household.tools?.hoe ?? 0) !== chore.needsTool) return { can: false, why: 'The hoe is sound.' };
  if (chore.tool && toolState(household.tools?.[chore.tool] ?? 0) === 'worn') return { can: false, why: 'The hoe is worn out and wants mending.' };
  for (const [resource, amount] of Object.entries(needsOf(household, chore))) {
    if ((household.resources[resource] ?? 0) < amount) return { can: false, why: `Not enough ${resource}.` };
  }
  return { can: true, why: '' };
}

/**
 * What this chore costs this household right now. Fixed for most; for planting it grows
 * with the ground, because a bigger field swallows more seed.
 */
export function needsOf(household, chore) {
  const perClearing = Object.fromEntries(Object.entries(chore.needsPerClearing || {})
    .map(([resource, amount]) => [resource, amount * clearedOf(household)]));
  return { ...chore.needs, ...perClearing };
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

export function choreCatalogue() {
  return Object.entries(CHORES).map(([id, chore]) => ({
    id, name: chore.name, describe: chore.describe, skill: chore.skill,
    // Stated up front, so spending the last seed is a visible decision.
    cost: Object.entries(chore.needs || {}).map(([resource, amount]) => `${amount} ${resource}`).join(', '),
    // A cost that grows with the ground cannot be stated once for the whole class; the
    // per-tick permission carries the real number for this household.
    scales: Boolean(chore.needsPerClearing),
  }));
}

/**
 * The changing half: whether this person can be sent on each chore right now, and why
 * not. This is a permission, so it stays on the server and is recomputed every tick.
 */
export function choresFor(world, household, entity) {
  return Object.entries(CHORES).map(([id, chore]) => {
    const { can, why } = choreAvailability(world, household, entity, id);
    // `haul` is what this person's own hands would bring back from this trip, before any
    // cap. The cap itself is the mode's `carry`, which the projection sends alongside; the
    // control puts the two together so a student sees what a choice costs before making
    // it, which is `FIC-GONZ-008`'s rule about visible outcomes applied to a number.
    // What this person's own hands would bring back, before any cap. `kept` is left off
    // deliberately: the control works it out from this and the mode's `carry`, which the
    // projection already sends, and a second copy of a number nobody reads is exactly the
    // freight this channel is not for.
    const full = chore.hauls ? haulFor(entity, id) : null;
    const haul = full && { resource: full.resource, got: full.got };
    // What this one actually costs this family today, and what the field would give back.
    const cost = Object.entries(needsOf(household, chore)).map(([resource, amount]) => `${amount} ${resource}`).join(', ');
    const crop = chore.wantsWagon
      ? { grown: round(yieldFor(standingCrop(household), entity.skills?.[chore.skill] ?? 1)), share: harvestShare(household) }
      : null;
    // `level` used to ride here for every chore for every person and was read by nothing
    // at all - thirty-six copies a tick of a number with no reader.
    return can
      ? { id, can: true, ...(cost && { cost }), ...(haul && { haul }), ...(crop && { crop }) }
      : { id, can: false, why, ...(cost && { cost }), ...(haul && { haul }), ...(crop && { crop }) };
  });
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
function settleAsk(world, household, entity, option, byDefault) {
  const state = entity.chore, ask = state.ask;
  const chosen = ask.options.find(candidate => candidate.id === option);
  state.ask = null;
  state.flags = [...(state.flags || []), option, ...(option === 'leave' ? ['empty'] : [])];
  record(world, 'choice', {
    actorId: entity.id, householdId: household.id, decision: option, importance: 2,
    text: byDefault
      ? `Nobody answered. ${entity.name} decided alone: ${chosen.label.toLowerCase()}.`
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

export function beginChore(world, household, entity, choreId, { beginTravel, modeAvailability }, modeId = DEFAULT_MODE) {
  const { can, why } = choreAvailability(world, household, entity, choreId);
  if (!can) throw new Error(why || 'That work is not available.');
  const chore = CHORES[choreId];
  // Refused before the work is written down.
  //
  // Keyed on whether the chore travels at all, not on whether it hauls. A chore that
  // travels but carries nothing back - buying a hoe in town - would otherwise keep a mode
  // nobody had checked, and the return leg runs inside `advanceChores` during a tick. A
  // journey that turns out to be impossible there throws from inside `stepWorld`, which
  // does not refuse one student's order: it stops the whole class.
  if (chore.steps.some(step => step.travel) && modeId !== DEFAULT_MODE) {
    const mode = modeAvailability?.(world, entity, modeId);
    if (mode && !mode.can) throw new Error(mode.why);
  }
  entity.chore = { id: choreId, step: -1, wait: 0, doing: 'setting out', ...(modeId !== DEFAULT_MODE && { mode: modeId }) };
  entity.task = 'work';
  record(world, 'assignment', { actorId: entity.id, householdId: household.id, text: `${entity.name} set out: ${chore.name.toLowerCase()}.` });
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
function advanceChore(world, household, entity, { beginTravel }) {
  const chore = CHORES[entity.chore.id];
  const skill = entity.skills?.[chore.skill] ?? 1;
  // A travel step owns the person until the road is behind them.
  if (entity.travel) return;
  const state = entity.chore;
  // Waiting on the family. Nothing moves, nothing is spent, and the step is not advanced
  // past - without this the question would be asked and answered by the next tick, which
  // is a question in name only.
  if (state.ask) {
    if (world.minute - state.ask.openedMinute < ASK_PATIENCE) return;
    // Deciding alone still cannot do the impossible. A person with nothing to fire comes
    // away, which is what they would actually do.
    const alone = askAvailability(world, household, entity, state.ask.fallback).can ? state.ask.fallback : 'leave';
    settleAsk(world, household, entity, alone, true);
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
    if (step.doing) state.doing = step.doing;
    if (step.walk) {
      // Inside the homestead. The person's canonical site is unchanged - they are still
      // at home - but they stand where the work is.
      //
      // This step may only ever move someone who is already standing on their own land.
      // A `walk` is not a journey, and letting one run for a person who has ended up
      // somewhere else would carry them home across the map for nothing: exactly the
      // teleport the world's "returning home requires a journey" rule forbids.
      if (entity.location.siteId !== household.homeSiteId) return abandonChore(world, household, entity, chore);
      const point = step.walk === 'field' ? fieldPoint(world, household) : yardPoint(world, household);
      if (point) entity.location = { x: point.x, y: point.y, siteId: household.homeSiteId };
      state.wait = 1;
      return;
    }
    if (step.travel) {
      const destination = step.travel === 'home' ? household.homeSiteId
        : step.travel === 'timber' ? timberFor(world, household) : step.travel;
      // Already standing there: nothing to walk, so fall through to the next step.
      if (!destination || entity.location.siteId === destination) continue;
      beginTravel(world, entity, destination, null, 'chore', state.mode || DEFAULT_MODE);
      return;
    }
    if (step.ask) {
      // The work stops here and waits for the family. Nothing is decided and nothing is
      // spent; the person stands where they are until somebody answers or their own
      // patience runs out.
      const ask = ASKS[step.ask];
      state.doing = ask.doing;
      state.ask = {
        id: step.ask, openedMinute: world.minute, fallback: ask.fallback,
        text: ask.text(entity), options: ask.options(entity),
      };
      record(world, 'pressure', {
        actorId: entity.id, householdId: household.id, importance: 2,
        text: `${ask.text(entity)} ${entity.name} is waiting on the family's word.`,
      });
      return;
    }
    if (step.strike) {
      // Whether the shot went home, decided by the person and the range and nothing else.
      // Waiting closed the range, so somebody who waited connects whatever their state.
      const close = (state.flags || []).includes('wait');
      if (!close && !steadyHand(entity)) {
        state.flags = [...(state.flags || []), 'empty'];
        record(world, 'consequence', {
          actorId: entity.id, householdId: household.id, importance: 2,
          text: `${entity.name} fired and missed \u2014 ${unsteadyBecause(entity)}. The afternoon is gone.`,
        });
        continue;
      }
      state.flags = [...(state.flags || []), 'carrying'];
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
    if (step.shot) {
      // The one moment of a hunt, and the only thing drawn of it is smoke in the trees.
      // Recorded because it is a thing that happened in a place at a time: a shot carries,
      // and the day somebody wants a neighbour to have heard one, this is what they hang
      // it on. It names no animal, because no animal has been named.
      household.resources.powder = round(Math.max(0, (household.resources.powder ?? 0) - SHOT_COST));
      record(world, 'hunt', {
        actorId: entity.id, householdId: household.id,
        text: `${entity.name} fired in the timber.`,
      });
      state.wait = 1;
      return;
    }
    if (step.work) { state.wait = paceFor(step.work, skill); return; }
    if (step.consume) {
      for (const [resource, amount] of Object.entries(step.consume)) {
        household.resources[resource] = round(Math.max(0, (household.resources[resource] ?? 0) - amount));
      }
      continue;
    }
    if (step.consumePerClearing) {
      for (const [resource, amount] of Object.entries(step.consumePerClearing)) {
        household.resources[resource] = round(Math.max(0, (household.resources[resource] ?? 0) - amount * clearedOf(household)));
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
    if (step.clear) { clearGround(world, household, entity); continue; }
    if (step.raise === 'fence') { raiseFence(world, household, entity); continue; }
    if (step.produceCrop) {
      // What is standing, less what the stock have had out of it. Both numbers are on the
      // controls that spend the afternoon, so a family that harvests an unfenced field
      // knew before they started what it would cost them.
      const grown = yieldFor(standingCrop(household), skill);
      const kept = round(grown * harvestShare(household));
      household.resources.food = round((household.resources.food ?? 0) + kept);
      if (kept < grown) {
        record(world, 'consequence', {
          actorId: entity.id, householdId: household.id, importance: 2,
          text: `${entity.name} brought in ${kept} food. The rest had gone to stock in an unfenced field.`,
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
      }
      continue;
    }
    if (step.field) {
      household.field = { ...household.field, state: step.field, changedTick: world.tick };
      continue;
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
      recordTrade(world, household.id, entity, trader, step.trade === 'iron' ? 'a hoe' : step.trade === 'powder' ? 'powder and lead' : step.trade);
      continue;
    }
    if (step.mend) { household.tools[step.mend] = 0; continue; }
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
function finishChore(world, household, entity, chore) {
  entity.chore = null;
  entity.task = 'rest';
  record(world, 'consequence', { actorId: entity.id, householdId: household.id, text: `${entity.name} finished: ${chore.name.toLowerCase()}.` });
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
      advanceChore(world, household, entity, { beginTravel, modeAvailability });
    }
  }
}
