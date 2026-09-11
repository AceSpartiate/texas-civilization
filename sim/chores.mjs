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

const round = value => Math.round(value * 10000) / 10000;

// How long the field takes to come on, in ticks of twenty minutes. This is invented, and
// `FIC-GONZ-008` covers it: it is a rhythm for a lesson, not an agricultural calendar,
// and nothing in the interface claims otherwise.
export const RIPEN_TICKS = 18;
// A hoe gives this many field jobs, then wants mending. Fixed, and shown before use.
export const TOOL_LIFE = 5;

export const SKILLS = ['farming', 'hunting', 'hands'];

// Skill is fixed per person at founding and never changes. Values are 1 to 3, and the
// spread is deliberately uneven: a household that has nobody who can mend a hoe has to
// go into town or ask a neighbour, which is the pressure that makes the town matter.
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
    needs: { seed: 2 }, field: 'bare',
    describe: 'Turn the rows and put in seed. Costs two seed.',
    steps: [
      { walk: 'field', doing: 'walking out to the field' },
      { work: 4, doing: 'breaking the rows' },
      { consume: { seed: 2 } },
      { work: 3, doing: 'putting in seed' },
      { field: 'planted' },
      { wear: 'hoe' },
      { walk: 'yard', doing: 'coming in from the field' },
    ],
  },
  'harvest-field': {
    name: 'Bring in the crop', skill: 'farming', tool: 'hoe', where: 'home',
    field: 'ripe',
    describe: 'The field is ready. Cut it and carry it in.',
    steps: [
      { walk: 'field', doing: 'walking out to the field' },
      { work: 6, doing: 'cutting the crop' },
      { produce: { food: 6 } },
      { field: 'bare' },
      { wear: 'hoe' },
      { walk: 'yard', doing: 'carrying the crop in' },
    ],
  },
  'hunt-timber': {
    name: 'Hunt in the timber', skill: 'hunting', where: 'home',
    describe: 'A long trip to the timber and back. Brings in food, costs no seed.',
    steps: [
      { travel: 'timber', doing: 'on the road to the timber' },
      { work: 5, doing: 'hunting in the timber' },
      { produce: { food: 5 } },
      { travel: 'home', doing: 'walking home from the timber' },
    ],
  },
  'fetch-seed': {
    name: 'Fetch seed from Gonzales', skill: 'hands', where: 'home',
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
  if (chore.needsTool && toolState(household.tools?.hoe ?? 0) !== chore.needsTool) return { can: false, why: 'The hoe is sound.' };
  if (chore.tool && toolState(household.tools?.[chore.tool] ?? 0) === 'worn') return { can: false, why: 'The hoe is worn out and wants mending.' };
  for (const [resource, amount] of Object.entries(chore.needs || {})) {
    if ((household.resources[resource] ?? 0) < amount) return { can: false, why: `Not enough ${resource}.` };
  }
  return { can: true, why: '' };
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
export function choreCatalogue() {
  return Object.entries(CHORES).map(([id, chore]) => ({
    id, name: chore.name, describe: chore.describe, skill: chore.skill,
    // Stated up front, so spending the last seed is a visible decision.
    cost: Object.entries(chore.needs || {}).map(([resource, amount]) => `${amount} ${resource}`).join(', '),
  }));
}

/**
 * The changing half: whether this person can be sent on each chore right now, and why
 * not. This is a permission, so it stays on the server and is recomputed every tick.
 */
export function choresFor(world, household, entity) {
  return Object.entries(CHORES).map(([id, chore]) => {
    const { can, why } = choreAvailability(world, household, entity, id);
    return can
      ? { id, can: true, level: entity.skills?.[chore.skill] ?? 1 }
      : { id, can: false, why, level: entity.skills?.[chore.skill] ?? 1 };
  });
}

export function beginChore(world, household, entity, choreId, { beginTravel }) {
  const { can, why } = choreAvailability(world, household, entity, choreId);
  if (!can) throw new Error(why || 'That work is not available.');
  entity.chore = { id: choreId, step: -1, wait: 0, doing: 'setting out' };
  entity.task = 'work';
  const chore = CHORES[choreId];
  record(world, 'assignment', { actorId: entity.id, householdId: household.id, text: `${entity.name} set out: ${chore.name.toLowerCase()}.` });
  advanceChore(world, household, entity, { beginTravel });
  return entity.chore;
}

/** One step of one person's chore. Called once per tick per working person. */
function advanceChore(world, household, entity, { beginTravel }) {
  const chore = CHORES[entity.chore.id];
  const skill = entity.skills?.[chore.skill] ?? 1;
  // A travel step owns the person until the road is behind them.
  if (entity.travel) return;
  const state = entity.chore;
  // Spend a tick of the current step, and only move on once it is actually paid for.
  // Returning here whenever the counter was non-zero would cost one extra tick per step,
  // so a four-tick job would quietly take five.
  if (state.wait > 0) {
    state.wait--;
    if (state.wait > 0) return;
  }
  while (true) {
    state.step++;
    const step = chore.steps[state.step];
    if (!step) return finishChore(world, household, entity, chore);
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
      beginTravel(world, entity, destination, null, 'chore');
      return;
    }
    if (step.work) { state.wait = paceFor(step.work, skill); return; }
    if (step.consume) {
      for (const [resource, amount] of Object.entries(step.consume)) {
        household.resources[resource] = round(Math.max(0, (household.resources[resource] ?? 0) - amount));
      }
      continue;
    }
    if (step.produce) {
      for (const [resource, amount] of Object.entries(step.produce)) {
        household.resources[resource] = round((household.resources[resource] ?? 0) + yieldFor(amount, skill));
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
      recordTrade(world, household.id, entity, trader, step.trade === 'iron' ? 'a hoe' : step.trade);
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
export function advanceChores(world, { beginTravel }) {
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
      advanceChore(world, household, entity, { beginTravel });
    }
  }
}
