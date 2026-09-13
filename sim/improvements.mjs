// What a family has made of its land, and what can be taken from it.
//
// A homestead is not a fixed backdrop. A household starts with a patch of
// broken ground, and the afternoon it spends clearing more of its own labor is an
// afternoon it does not spend planting, hunting, or carrying food into Gonzales. That is
// the whole decision: the field a family ends with is the one it chose to make room for.
//
// Three things are modelled, and every one of them can be ruined.
//
//   cabin    Stood from the founding in every class saved before arrivals. A new class begins
//            with none (`sim/settling.mjs`) and camps by the wagon; building one is
//            docs/SETTLING_IN.md step 4. Nothing here pulls one down.
//   field    Broken ground, counted in how many times it has been cleared.
//   fence    Split rails round the crop. A family starts without one.
//
// `HIST-GONZ-018` is why the fence matters rather than being decoration: stock in this
// colony ran free and were not fed, so what was fenced was the crop and not the animal.
// The renderer has drawn a rail fence round every field since the art landed, which was a
// picture of something the world had never modelled. Now it draws one when there is one.
//
// **Everything here is destructible on purpose, and nothing in the Gonzales afternoon
// destroys anything.** `HIST-GONZ-019`: Houston reached Gonzales on 11 March 1836 and
// ordered every inhabitant to leave with him, and families came back months later to
// homes that no longer existed. That is the chapter this state is for. Building the
// capability now costs almost nothing and is the difference between a Runaway Scrape that
// takes a family's own property and one that prints a sentence about it; retrofitting it
// later would mean touching every save in existence.
import { record } from './events.mjs';

/** How many times a family can break new ground. Invented for the lesson; `FIC-GONZ-015`. */
export const CLEARING_MAX = 4;
/** What one clearing of ground yields when it is brought in. */
export const YIELD_PER_CLEARING = 5;
/** Seed one clearing of ground swallows at planting. */
export const SEED_PER_CLEARING = 2;
/**
 * What free-ranging stock take out of an unfenced crop, as a share of the harvest.
 *
 * Invented, and deliberately a flat fraction rather than a die: `FIC-GONZ-008` requires
 * outcomes to resolve inside a visible risk and never by hidden punitive RNG, so the
 * number is stated on the control that harvests and on the control that fences.
 */
export const UNFENCED_LOSS = 1 / 3;
/** Above this much broken ground, a harvest is more than four people can carry in by hand. */
export const WAGON_HARVEST_CLEARINGS = 3;

export const STATES = ['none', 'sound', 'ruined'];

/**
 * What this household has on its land.
 *
 * A class saved before any of this has no `improvements` at all, and the empty value is
 * the correct one and the one every family used to have: a cabin standing, and no fence.
 * So no save version moved - `sim/trade.mjs` is the worked example of the same call.
 */
export function improvementsOf(household) {
  return { cabin: 'sound', fence: 'none', ...(household.improvements || {}) };
}
/** How many times this household's ground has been broken. Absent reads as the first patch. */
export const clearedOf = household => Math.min(CLEARING_MAX, Math.max(1, household.field?.cleared ?? 1));
export const isFenced = household => improvementsOf(household).fence === 'sound';

/** The share of a harvest that actually reaches the family, given what is round the field. */
export const harvestShare = household => isFenced(household) ? 1 : 1 - UNFENCED_LOSS;

/** What bringing in this household's crop would yield, before anybody's skill touches it. */
export const standingCrop = household => YIELD_PER_CLEARING * clearedOf(household);

/** Whether this crop is more than the family can carry in without the wagon. */
export const needsWagonToHarvest = household => clearedOf(household) >= WAGON_HARVEST_CLEARINGS;

export function setImprovement(world, household, kind, state) {
  if (!STATES.includes(state)) throw new Error('Invalid improvement state');
  household.improvements = { ...improvementsOf(household), [kind]: state };
  return household.improvements;
}

/** One more turn of broken ground, and the event that says the afternoon went into it. */
export function clearGround(world, household, entity) {
  const was = clearedOf(household);
  if (was >= CLEARING_MAX) throw new Error('There is no more ground to break here.');
  household.field = { ...household.field, cleared: was + 1 };
  record(world, 'property', {
    actorId: entity?.id, householdId: household.id, importance: 2,
    text: `${entity ? `${entity.name} broke` : 'The family broke'} new ground. The field is ${was + 1} times what it was when they came.`,
  });
  return household.field.cleared;
}

export function raiseFence(world, household, entity) {
  const was = improvementsOf(household).fence;
  setImprovement(world, household, 'fence', 'sound');
  record(world, 'property', {
    actorId: entity?.id, householdId: household.id, importance: 2,
    text: was === 'ruined'
      ? `${entity?.name || 'The family'} set the rails back up. The crop is out of reach of the stock again.`
      : `${entity?.name || 'The family'} split rails and fenced the field. The stock are out of the crop now.`,
  });
}

/**
 * Something a family made is taken from it.
 *
 * ceiling: nothing in the Gonzales slice calls this. There is no documented destruction
 * of homesteads around Gonzales on 2 October 1835 and this project does not invent one -
 * see the exclusions in HISTORY.md. It exists because the chapter it is for is documented
 * (`HIST-GONZ-019`) and because property that can be ruined has to be modelled as
 * property that can be ruined from the first save that contains it. Proved by
 * tests/improvements.test.mjs, which calls it directly.
 */
export function ruin(world, household, kinds, { by = null, text = null } = {}) {
  const ruined = [];
  for (const kind of kinds) {
    if (kind === 'field') {
      // Burnt ground is still ground. What is lost is the standing crop and the work of
      // clearing, not the labor itself, so a family that comes back has a patch again.
      if (clearedOf(household) === 1 && (household.field?.state ?? 'bare') === 'bare') continue;
      household.field = { ...household.field, cleared: 1, state: 'bare', changedTick: world.tick };
      ruined.push('field');
      continue;
    }
    if (improvementsOf(household)[kind] === 'ruined') continue;
    setImprovement(world, household, kind, 'ruined');
    ruined.push(kind);
  }
  if (!ruined.length) return ruined;
  record(world, 'consequence', {
    householdId: household.id, importance: 3, ...(by && { actorId: by }),
    text: text || `What the family made of this place is gone: ${ruined.join(', ')}.`,
  });
  return ruined;
}

/** Everything on this land and what state it is in, for the family's own panel. */
export function improvementProjection(household) {
  const standing = improvementsOf(household);
  return {
    cabin: standing.cabin,
    fence: standing.fence,
    cleared: clearedOf(household),
    clearingMax: CLEARING_MAX,
    harvestShare: harvestShare(household),
    needsWagon: needsWagonToHarvest(household),
  };
}
