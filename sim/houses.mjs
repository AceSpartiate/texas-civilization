// The house a family chooses, raises, and then lives with.
//
// docs/SETTLING_IN.md §5, step 4. A family that arrives has no roof (sim/settling.mjs) and
// camps by the wagon. It chooses **a layout** - four, each with what it needs, what it is good
// for and what it costs - and builds it as ordinary work: anybody in the family old enough to
// be sent can be set to "Work on the house", several at once, until it stands. Then it acts
// through the two hooks the camp already uses: how well rest mends at home, and how much food
// spoils. Nothing about a house is hidden from the student before it is chosen (`FIC-GONZ-008`).
//
// What is history and what is not:
//   - Round-log and hewn-log single-pen houses, and the dog-run: `HIST-GONZ-025`. A dog-run
//     stood in the colonies by about 1828 - Austin's own house at San Felipe - so it is a
//     period house, and a big one (`HIST-GONZ-035`).
//   - The jacal is a documented Texas-Mexican house (`HIST-GONZ-026`), but not documented at
//     Gonzales (`HIST-GONZ-033`); offering it to a family here is `FIC-GONZ-024`.
//   - Every amount of work, every tool rule beyond "hewing wants a broadaxe", every room size
//     and every effect is invented (`FIC-GONZ-024`).
//
// ceiling: a house goes up in hours of the family's time, not the week that a settler and one
// helper took for a bare cabin in 1823 (`HIST-GONZ-032`). A class lasts under two days of
// fictional time, and a house that could not be finished inside it would be a house nobody
// ever lived in. What is kept is the order - a jacal before a round-log house before a hewn one,
// and a dog-run as the most work by far - and the shape of the choice. Undo it if the class clock
// ever covers weeks.
// ceiling: the construction methods of §5 - chimney, roof, floor - are not choices yet. Each
// house is one thing. They come after the house-raising (step 5), on the research already
// registered (`HIST-GONZ-029` to `031`).
// ceiling: nothing wears or spends a building tool. A felling axe is needed, not used up; the
// tool model wears only the hoe (`TOOL_LIFE` in sim/chores.mjs).
// ceiling: **rain holds up no part of one of the four houses above** (`FIC-GONZ-290`, docs/WEATHER.md §10.5). A house
// chosen whole is one bar of work covering felling, hauling, the walls, the roof and the daubing together, and there is
// no roofing stage in it to hold: stopping the bar would stop the felling too, which the rain does not. Only a house
// built piece by piece (sim/houseplot.mjs) has stages the sky can tell apart, and only there is the rain read. Undo this
// the day the four houses get stages of their own.
import { record } from './events.mjs';
import { householdName } from './family.mjs';
import { improvementsOf, setImprovement } from './improvements.mjs';
import { CAMP_REST_SHARE, CAMP_SPOILAGE_PER_DAY } from './settling.mjs';
import {
  PIECES, PLANS, PLAN_IDS, nextStage, pieceDone, pieceWords, placeRefusal, planPieces, plotBuildRefusal, plotBuildSpell,
  plotInvalid, plotLayout, plotNeeds, plotPhase, plotRaising, plotShelter, stageWants, weatherHold,
} from './houseplot.mjs';
import { weatherAt } from './weather.mjs';
import { countsTrees, woodsRule } from './woods.mjs';

/**
 * The day's weather where this family's house stands, or null before it has a place - which is the answer every caller
 * without a world gets too, and means "no sky is being read", not "fair".
 *
 * A house is built at the family's own homestead, so the sky is read there and nowhere else (`FIC-GONZ-290`). The hunt
 * reads its sky where the hunter walked to (`huntPoint`); the house has no such question.
 */
export const skyAtHome = (world, household) => {
  const home = world?.map?.sites?.[household?.homeSiteId];
  return home ? weatherAt(world, home) : null;
};

/**
 * Whether this family's house is planned piece by piece on the house plot (sim/houseplot.mjs, docs/WOODS_AND_BUILDING.md
 * §6): a class that counts its trees one by one. Every other house is one of the four below, raised as one bar of work.
 */
export const pieced = household => Array.isArray(household?.house?.pieces);
const plotted = world => countsTrees(woodsRule(world));

/**
 * The houses a family can choose.
 *
 * `work` is spells of labour: one spell is three ticks of an ordinary hand at an ordinary pace,
 * slower or faster by skill with the hands and, because it is heavy work, by hidden strength -
 * exactly as fencing and breaking ground are paced. `room` is how many people it holds before it
 * is crowded. `restShare` is how much of the ordinary rest a person gets lying down in it, and
 * `spoilagePerDay` how much of the food spoils a day - the same two numbers the camp states.
 */
const house = fields => Object.freeze({ ...fields, needs: Object.freeze(fields.needs) });
export const HOUSES = Object.freeze({
  'round-log': house({
    id: 'round-log', name: 'Round-log cabin', needs: ['axe'], work: 40, room: 4, restShare: 0.85, spoilagePerDay: 0.015,
    describe: 'One room of logs with the bark on, notched at the corners.',
    good: 'The quickest log house to raise, and a felling axe is all it wants.',
    bad: 'Round logs leave wide gaps: rest mends more slowly and food keeps worse than in a tight house.',
  }),
  'hewn-log': house({
    id: 'hewn-log', name: 'Hewn-log cabin', needs: ['axe', 'broadaxe'], work: 64, room: 4, restShare: 1.15, spoilagePerDay: 0,
    describe: 'One room of logs hewn flat on both faces, so they lie close.',
    good: 'Tight walls: rest mends best and the food keeps.',
    bad: 'Hewing is slow, heavy work, and it wants a broadaxe as well as a felling axe.',
  }),
  'dog-run': house({
    id: 'dog-run', name: 'Dog-run house', needs: ['axe'], work: 120, room: 8, restShare: 1, spoilagePerDay: 0.005,
    describe: 'Two log pens under one roof, with an open passage between them.',
    good: 'Two rooms: a large family is not crowded, and the passage is a shaded place to work.',
    bad: 'Twice the logs and the most work by far. A family alone will be hard put to finish it before any news comes.',
  }),
  jacal: house({
    id: 'jacal', name: 'Jacal', needs: [], work: 24, room: 3, restShare: 0.9, spoilagePerDay: 0.01,
    describe: 'Posts set in the ground, walls of sticks and mud, and a roof of thatch.',
    good: 'Quick to put up, and it wants no axe at all.',
    bad: 'One small room: more than three people are crowded in it. Thatch has to be renewed every few years.',
  }),
});
export const HOUSE_IDS = Object.keys(HOUSES);
/** Ticks of ordinary work in one spell on a house. */
export const SPELL_TICKS = 3;
/**
 * What of the rest a crowded house still gives. Invented (`FIC-GONZ-024`), and stated on the land
 * line of any family that is crowded. A family of five in a one-room house sleeps worse, not badly.
 */
export const CROWDED_SHARE = 0.8;

/** The catalogue, for `/api/chores`: fixed for a class, so it is sent once and never on the tick. */
export const houseCatalogue = () => Object.values(HOUSES).map(choice => ({ ...choice, hours: choice.work * SPELL_TICKS * 20 / 60 }));

/** The house this family has chosen or built, or null. */
export const houseOf = household => household.house ?? null;
/** Whether this family has a roof and nothing left to build: a finished house, or the cabin a class saved before step 4 always had. */
export const houseSettled = household => houseBuilt(household) || (!household.house && improvementsOf(household).cabin === 'sound');
/** A house of pieces is built when every piece stands; a family lives in it once one pen does. */
/** Whether this family's chosen house is finished. */
export const houseBuilt = household => pieced(household) ? household.house.pieces.length > 0 && household.house.pieces.every(pieceDone) : Boolean(household.house) && household.house.work >= HOUSES[household.house.layout].work;

/**
 * What the family is doing on the house at this point in it, for the person's own line.
 *
 * Stages are shares of the whole rather than steps of their own. A house is one amount of work
 * that several people can put in at once, and splitting it into stages anybody had to finish in
 * order would make two people working together wait on each other.
 */
/** How far up a house going up is, as the stage its picture shows: the site laid out, the walls rising, the roof going on. */
export function phaseOf(household) {
  const plan = houseOf(household);
  if (!plan) return null;
  if (pieced(household)) return plotPhase(plan.pieces);
  const share = plan.work / HOUSES[plan.layout].work;
  return share >= 1 ? 'finished' : share < RAISING_FROM ? 'site' : share < RAISING_TO ? 'walls' : 'roofing';
}

export function stageOf(household, world = null) {
  const plan = houseOf(household);
  if (!plan) return null;
  if (pieced(household)) {
    if (houseBuilt(household)) return 'finished';
    // The sky as well as the plot: on a wet day the stages the rain holds up are passed over, so the line a person's own
    // control shows is the work they are actually doing and not the roof that is waiting (`FIC-GONZ-290`).
    const here = skyAtHome(world, household);
    const next = nextStage(plan.pieces, here);
    if (next) return `${next.stage.doing} on ${pieceWords(plan.pieces, next.piece)}`;
    return weatherHold(plan.pieces, here) ? 'waiting for the rain to stop' : 'waiting on the pens';
  }
  const share = plan.work / HOUSES[plan.layout].work;
  if (share >= 1) return 'finished';
  if (plan.layout === 'jacal') return share < RAISING_FROM ? 'cutting and setting the posts' : share < RAISING_TO ? 'weaving the walls and daubing them with mud' : 'thatching the roof';
  if (share < RAISING_FROM) return plan.layout === 'hewn-log' ? 'felling logs and hewing them flat' : 'felling and hauling logs';
  if (share < RAISING_TO) return 'raising the walls';
  return 'putting on the roof';
}

// ---- The house-raising (docs/SETTLING_IN.md §6, step 5) --------------------------------------------
//
// Raising the walls is the part of a house neighbours can join. Somebody from another family who is
// standing on the land while its walls are going up can help raise them, and every spell they put in
// is a spell off the family's own work. Both families' stories say so. Nobody is asked, pressed or
// reminded to help, and a family that raises its walls alone gets there more slowly - the gate
// "Help is optional" in §9.
//
// No first-hand account of a house-raising in the Texas colonies was found (`HIST-GONZ-032`): the
// custom is plausible for settlers from the Lower South and invented here (`FIC-GONZ-024`), and so is
// every part of how it works.
// ceiling: helping earns no glory. Glory is for the part a family took in the events of 1835
// (`docs/MONEY_AND_GLORY.md`, owner-decided), and neighbourliness is not one of them.
// ceiling: help is only for the walls. Felling, hewing and roofing stay the family's own work, as
// §6 has it; a neighbour arriving early or late is told which part of the house it has reached.

/** The share of a house's work where the walls start going up, and where they are up. */
export const RAISING_FROM = 0.4;
export const RAISING_TO = 0.8;

/** The family whose homestead this person is standing on, if it is not their own. Travelling is standing nowhere. */
export function hostOf(world, entity) {
  if (!entity?.location?.siteId || entity.travel) return null;
  const host = Object.values(world.households).find(household => household.homeSiteId === entity.location.siteId);
  return host && host.id !== entity.householdId ? host : null;
}

/** Why this person cannot help raise the walls where they are standing, or null if they can. */
export function helpRefusal(world, entity) {
  const host = hostOf(world, entity);
  if (!host) return `${entity.name} is not on a neighbour's land.`;
  if (world.status !== 'running') return 'Neighbours help one another once the class has begun.';
  const plan = houseOf(host);
  const family = householdName(world, host);
  if (!plan) return `${family} have not begun a house.`;
  if (houseBuilt(host)) return `${family}'s house is built.`;
  if (pieced(host)) return plotRaising(plan.pieces) ? null : `${family} are ${stageOf(host)}; no walls are going up.`;
  const share = plan.work / HOUSES[plan.layout].work;
  if (share < RAISING_FROM) return `${family} are still ${stageOf(host)}; the walls are not ready to raise.`;
  if (share >= RAISING_TO) return `The walls of ${family}'s house are up.`;
  return null;
}

/** Whether a house is still at the stage a neighbour can help with. */
export const raising = household => pieced(household) ? !houseBuilt(household) && plotRaising(household.house.pieces) : Boolean(houseOf(household)) && !houseBuilt(household)
  && household.house.work / HOUSES[household.house.layout].work >= RAISING_FROM
  && household.house.work / HOUSES[household.house.layout].work < RAISING_TO;

/** One neighbour has come to help: said in both families' stories. */
export function recordHelpBegun(world, helperHousehold, entity, host) {
  record(world, 'raising', {
    actorId: entity.id, householdId: helperHousehold.id, importance: 2, claimId: 'FIC-GONZ-024',
    text: `${entity.name} went to help ${householdName(world, host)} raise the walls of their ${pieced(host) ? 'house' : HOUSES[host.house.layout].name.toLowerCase()}.`,
  });
  record(world, 'raising', {
    householdId: host.id, importance: 2, claimId: 'FIC-GONZ-024',
    text: `${entity.name} of ${householdName(world, helperHousehold)} came to help raise the walls.`,
  });
}

/** A neighbour's help is over: what they put in, said in both families' stories. */
export function recordHelpDone(world, helperHousehold, entity, host, spells) {
  if (!host) return;
  // Came, and found the walls already up - the family raised them itself in the meantime. Both stories
  // say so, so neither is left with a neighbour who arrived and then vanished from it.
  if (spells < 1) {
    if (raising(host)) return;
    record(world, 'raising', {
      actorId: entity.id, householdId: helperHousehold.id, importance: 2, claimId: 'FIC-GONZ-024',
      text: `The walls of ${householdName(world, host)}'s house were up before ${entity.name} could put any work in.`,
    });
    record(world, 'raising', {
      householdId: host.id, importance: 2, claimId: 'FIC-GONZ-024',
      text: `The walls were up before ${entity.name} of ${householdName(world, helperHousehold)} could put any work in.`,
    });
    return;
  }
  const hours = spells * SPELL_TICKS * 20 / 60;
  const done = !raising(host);
  record(world, 'raising', {
    actorId: entity.id, householdId: helperHousehold.id, importance: 2, claimId: 'FIC-GONZ-024',
    text: `${entity.name} put ${hours} ${hours === 1 ? 'hour' : 'hours'} into raising ${householdName(world, host)}'s walls${done ? ', and saw them up' : ''}.`,
  });
  record(world, 'raising', {
    householdId: host.id, importance: 2, claimId: 'FIC-GONZ-024',
    text: `${entity.name} of ${householdName(world, helperHousehold)} put ${hours} ${hours === 1 ? 'hour' : 'hours'} into raising the walls${done ? ', and they are up' : ''}.`,
  });
}

/** Whether the family may choose this house now, and why not. */
export function planRefusal(world, household, layout) {
  if (plotted(world) && !household.house?.layout) {
    if (!PLANS[layout]) return 'That is not a kind of house anybody here builds.';
    if (!['lobby', 'running'].includes(world.status)) return 'Nothing can be planned while the class is stopped.';
    if (pieced(household) && household.house.pieces.some(p => p.stage > 0 || p.progress > 0)) return 'Work on the house has begun; add or take away pieces instead.';
    if (!household.house && improvementsOf(household).cabin === 'sound') return 'The family already has a roof over it.';
    const tools = new Set(PLANS[layout].pieces.flatMap(([type]) => PIECES[type].needs));
    const missing = [...tools].filter(tool => household.tools?.[tool] === undefined);
    if (missing.length) return `It wants ${missing.map(tool => tool === 'axe' ? 'a felling axe' : `a ${tool}`).join(' and ')}, and there is none in the house.`;
    return null;
  }
  const choice = HOUSES[layout];
  if (!choice) return 'That is not a kind of house anybody here builds.';
  if (!['lobby', 'running'].includes(world.status)) return 'Nothing can be planned while the class is stopped.';
  const plan = houseOf(household);
  if (plan && houseBuilt(household)) return 'The house is built.';
  // A class saved before houses were built has the cabin that always stood, and no plan for another.
  if (!plan && improvementsOf(household).cabin === 'sound') return 'The family already has a roof over it.';
  if (plan && plan.work > 0 && plan.layout !== layout) return `Work on the ${HOUSES[plan.layout].name.toLowerCase()} has begun, and it is too late to build something else.`;
  const missing = choice.needs.filter(tool => household.tools?.[tool] === undefined);
  if (missing.length) return `It wants ${missing.map(tool => tool === 'axe' ? 'a felling axe' : `a ${tool}`).join(' and ')}, and there is none in the house.`;
  return null;
}

/**
 * The family decides what kind of house to build.
 *
 * Writes nothing into the story, like packing the wagon: this can be changed as often as the
 * family likes until the first spell of work is done, and a record of every change of mind would
 * be noise - and, in the lobby, would stop the family being rolled (`rollRefusal`).
 */
export function planHouse(world, household, layout) {
  const why = planRefusal(world, household, layout);
  if (why) throw new Error(why);
  household.house = plotted(world) && !household.house?.layout ? { plan: layout, pieces: planPieces(layout) } : { layout, work: houseOf(household)?.work ?? 0 };
  return household.house;
}

/** Why this piece cannot be placed, or null: only on a plot, while the class runs or waits, and where the plot allows. */
export function pieceRefusal(world, household, input) {
  if (!plotted(world) || household.house?.layout) return 'This family chooses its house whole.';
  if (!['lobby', 'running'].includes(world.status)) return 'Nothing can be planned while the class is stopped.';
  if (!household.house && improvementsOf(household).cabin === 'sound') return 'The family already has a roof over it.';
  if (input.action === 'remove-piece') {
    const p = (household.house?.pieces || [])[input.index];
    if (!p) return 'There is no such piece on the plot.';
    if (p.stage > 0 || p.progress > 0) return `Work on ${pieceWords(household.house.pieces, p)} has begun.`;
    const rest = household.house.pieces.filter(each => each !== p);
    if (rest.some(each => !PIECES[each.type].pen && placeRefusal(rest.filter(other => other !== each), each))) return `Other pieces stand against ${pieceWords(household.house.pieces, p)}; take them away first.`;
    return null;
  }
  const p = { type: input.piece, x: Number(input.x), y: Number(input.y) };
  return placeRefusal(household.house?.pieces || [], p);
}

/** Place a piece on the house plot, or take an unstarted one away. Writes nothing in the story, like choosing a plan. */
export function editPlot(world, household, input) {
  const why = pieceRefusal(world, household, input);
  if (why) throw new Error(why);
  household.house ||= { plan: 'own', pieces: [] };
  if (input.action === 'remove-piece') household.house.pieces.splice(input.index, 1);
  else household.house.pieces.push({ type: input.piece, x: Number(input.x), y: Number(input.y), stage: 0, progress: 0 });
  household.house.plan = 'own';
  return household.house;
}

/** Why nobody in this family can work on the house right now, or null. Read by `choreAvailability`. */
export function buildRefusal(household, world = null) {
  const plan = houseOf(household);
  if (!plan) return 'Choose a house to build first.';
  if (pieced(household)) return plotBuildRefusal(household, skyAtHome(world, household));
  if (houseBuilt(household)) return 'The house is built.';
  const missing = HOUSES[plan.layout].needs.filter(tool => household.tools?.[tool] === undefined);
  if (missing.length) return `The ${HOUSES[plan.layout].name.toLowerCase()} wants ${missing.map(tool => tool === 'axe' ? 'a felling axe' : `a ${tool}`).join(' and ')}.`;
  return null;
}

/**
 * One spell of work goes into the house, and the family moves in the moment it is done.
 *
 * Returns whether the house is now finished, so the chore knows to stop.
 */
export function buildSpell(world, household, entity) {
  const plan = houseOf(household);
  if (!plan || houseBuilt(household)) return true;
  if (pieced(household)) return plotBuildSpell(world, household, entity, handsOn(world, household), skyAtHome(world, household));
  plan.work += 1;
  if (!houseBuilt(household)) return false;
  setImprovement(world, household, 'cabin', 'sound');
  record(world, 'property', {
    actorId: entity?.id, householdId: household.id, importance: 3, claimId: 'FIC-GONZ-024',
    text: `The ${HOUSES[plan.layout].name.toLowerCase()} is finished. The family sleeps under its own roof tonight.`,
  });
  return true;
}

/** How many people are at work on this family's house now: its own, and neighbours helping raise it. */
export const handsOn = (world, household) => Object.values(world.entities).filter(person => person.chore && ((person.householdId === household.id && person.chore.id === 'build-house') || person.chore.hostHouseholdId === household.id)).length;

/** How many of this family are alive and would be sleeping at home, for crowding. */
const sleepers = (world, household) => household.members.filter(id => {
  const condition = world.entities[id]?.health?.condition;
  return condition !== 'dead' && condition !== 'captured';
}).length;

/**
 * What this family's shelter does for it: rest at home and food kept.
 *
 * Three cases, and the first is the one every class saved before step 4 is in:
 *   - a roof and no house record: the cabin that always stood, which mends at the ordinary rate
 *     and spoils nothing - exactly the numbers such a class always ran on;
 *   - a finished house: its own two numbers, and less rest if more people sleep in it than it holds;
 *   - no roof: the camp by the wagon (sim/settling.mjs).
 */
export function shelterOf(world, household) {
  const standing = improvementsOf(household).cabin === 'sound';
  if (standing && !household.house) return { kind: 'house', restShare: 1, spoilagePerDay: 0 };
  // A house of pieces: what its finished pens and the pieces about them give (sim/houseplot.mjs).
  const built = standing && pieced(household) ? plotShelter(household.house.pieces) : null;
  if (built) {
    const crowded = sleepers(world, household) > built.room;
    return { kind: 'house', layout: plotLayout(household.house.pieces), restShare: crowded ? Math.round(built.restShare * CROWDED_SHARE * 10000) / 10000 : built.restShare, spoilagePerDay: built.spoilagePerDay, ...(crowded && { crowded: true }) };
  }
  if (standing && !pieced(household) && houseBuilt(household)) {
    const choice = HOUSES[household.house.layout];
    const crowded = sleepers(world, household) > choice.room;
    return { kind: 'house', layout: choice.id, restShare: crowded ? choice.restShare * CROWDED_SHARE : choice.restShare, spoilagePerDay: choice.spoilagePerDay, ...(crowded && { crowded: true }) };
  }
  return { kind: 'camp', restShare: CAMP_REST_SHARE, spoilagePerDay: CAMP_SPOILAGE_PER_DAY };
}

/**
 * The house on the family's own land line, and the houses it could still choose.
 *
 * `choices` is a permission - whether each house could be chosen right now, and the server's
 * sentence when not - so it rides on the tick, but only until work begins: after that the choice
 * is made, and four refusals nobody can act on are freight. The words about each house come once,
 * from the catalogue.
 */
export function houseProjection(world, household) {
  const plan = houseOf(household);
  const shelter = shelterOf(world, household);
  if (pieced(household) || (plotted(world) && !plan?.layout)) {
    const pieces = plan?.pieces || [];
    const begun = pieces.some(p => p.stage > 0 || p.progress > 0);
    const planned = plotShelter(pieces, { built: false });
    return {
      plot: true,
      ...(plan && { house: { plan: plan.plan, pieces: pieces.map(p => [p.type, p.x, p.y, p.stage, p.progress]), stage: stageOf(household, world), phase: phaseOf(household), ...(!houseBuilt(household) && { wants: stageWants(pieces, skyAtHome(world, household)), why: buildRefusal(household, world) }) } }),
      ...(shelter.layout && { home: { restShare: shelter.restShare, spoilagePerDay: shelter.spoilagePerDay, ...(shelter.crowded && { crowded: true }) } }),
      // What the whole plan would do and still wants, so the plot says it while it is being laid out and built.
      ...(pieces.length && { planned: { ...(planned || {}), ...plotNeeds(pieces) } }),
      ...(!begun && !(!plan && improvementsOf(household).cabin === 'sound') && { choices: PLAN_IDS.map(id => { const why = planRefusal(world, household, id); return why ? { id, can: false, why } : { id, can: true }; }) }),
    };
  }
  const choosing = !houseBuilt(household) && !(plan && plan.work > 0) && !(!plan && improvementsOf(household).cabin === 'sound');
  return {
    ...(plan && { house: { layout: plan.layout, work: plan.work, total: HOUSES[plan.layout].work, stage: stageOf(household, world), phase: phaseOf(household) } }),
    // What the finished house does for the family, in numbers, on its own land line (`FIC-GONZ-008`).
    ...(shelter.layout && { home: { restShare: shelter.restShare, spoilagePerDay: shelter.spoilagePerDay, ...(shelter.crowded && { crowded: true }) } }),
    ...(choosing && { choices: HOUSE_IDS.map(id => { const why = planRefusal(world, household, id); return why ? { id, can: false, why } : { id, can: true }; }) }),
  };
}

/**
 * What one family has seen of another's land, as it stood the last time somebody was there.
 *
 * Nobody knows how a neighbour's house is coming on without going to look (VISION.md's rule
 * about knowledge travelling with people). A class that began with the families arriving knows
 * one thing about every homestead for certain - nobody had a house at dawn on the 28th - and a
 * family that has not been since still believes that. Kept on the household that saw it.
 */
export function noteLandSeen(world) {
  const homes = new Map(Object.values(world.households).map(household => [household.homeSiteId, household]));
  for (const household of Object.values(world.households)) {
    for (const id of household.members) {
      const entity = world.entities[id];
      const owner = homes.get(entity?.location?.siteId);
      if (!owner || owner === household || entity.travel) continue;
      const view = landView(owner);
      const was = household.seenLand?.[owner.homeSiteId];
      if (was && was.shelter === view.shelter && was.layout === view.layout) { was.minute = world.minute; continue; }
      household.seenLand = { ...household.seenLand, [owner.homeSiteId]: { ...view, minute: world.minute } };
    }
  }
}

/** A homestead as somebody standing on it would see it: a camp, a house going up, or a house. */
export function landView(household) {
  const plan = houseOf(household);
  const cabin = improvementsOf(household).cabin;
  if (cabin === 'ruined') return { shelter: 'ruined' };
  if (pieced(household)) {
    const layout = plotLayout(plan.pieces);
    if (cabin === 'sound') return { shelter: 'house', layout };
    return plan.pieces.some(p => p.stage > 0 || p.progress > 0) ? { shelter: 'building', layout, phase: plotPhase(plan.pieces) } : { shelter: 'camp' };
  }
  if (cabin === 'sound') return plan ? { shelter: 'house', layout: plan.layout } : { shelter: 'house' };
  // Seen going up, it is remembered at the stage it had reached. A class saved before stages has none, and is drawn at its site.
  if (plan && plan.work > 0) return { shelter: 'building', layout: plan.layout, phase: phaseOf(household) };
  return { shelter: 'camp' };
}

/** The house record, and what this household has seen of others, are well formed. */
export function houseInvalid(world, household) {
  if (pieced(household)) {
    const why = plotInvalid(household.house);
    if (why) return why;
    if (household.house.pieces.some(p => PIECES[p.type].pen && pieceDone(p)) && improvementsOf(household).cabin === 'none') return 'A finished house with no roof';
  } else if (household.house !== undefined) {
    const choice = HOUSES[household.house?.layout];
    if (!choice || !Number.isInteger(household.house.work) || household.house.work < 0 || household.house.work > choice.work) return 'Invalid house';
    if (household.house.work >= choice.work && improvementsOf(household).cabin === 'none') return 'A finished house with no roof';
  }
  for (const [siteId, view] of Object.entries(household.seenLand || {})) {
    if (!world.map.sites[siteId] || !['camp', 'building', 'house', 'ruined'].includes(view?.shelter) || (view.layout !== undefined && !HOUSES[view.layout]) || (view.phase !== undefined && !['site', 'walls', 'roofing', 'finished'].includes(view.phase)) || !Number.isFinite(view.minute)) return 'Invalid remembered land';
  }
  return null;
}
