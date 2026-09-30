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
//   field    The plots the family has cleared (sim/fields.mjs, docs/LAND_GRANTS.md §5), ten acres each, wherever on
//            its land it staked them. It replaced "break new ground up to four times" (`FIC-GONZ-015`) on 2026-09-14.
//   fence    Split rails round one plot at a time. A family starts without any.
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
import { fellStanding } from './felling.mjs';
import { clearedPlots, clearingSpells, cropOf, fieldPlots, keepPlots, ripePlots, sownPlots } from './fields.mjs';
import { whereFromHouse } from './survey.mjs';

/** What ten cleared acres of cotton yield when they are brought in: bales. */
export const YIELD_PER_PLOT = 5;
/**
 * What ten cleared acres of corn yield: food, twice cotton's count since 2026-09-28 (owner, by multiple choice: "10 food a plot"), so a
 * corn family grows more than it eats and has spare corn for the store (docs/BALANCE.md §12-§13). Five until then. `FIC-GONZ-008`.
 */
export const CORN_YIELD_PER_PLOT = 10;
/** What a plot of this crop yields. */
export const yieldPerPlot = crop => crop === 'corn' ? CORN_YIELD_PER_PLOT : YIELD_PER_PLOT;
/**
 * Seed ten cleared acres swallow at planting, corn and cotton: kept with the crops since 2026-09-30 (sim/crops.mjs), which this
 * module's plots now read, and still read from here by everything that always read them.
 */
export { COTTON_SEED_PER_PLOT, SEED_PER_PLOT } from './crops.mjs';
/**
 * What free-ranging stock take out of an unfenced crop, as a share of the harvest.
 *
 * Invented, and deliberately a flat fraction rather than a die: `FIC-GONZ-008` requires
 * outcomes to resolve inside a visible risk and never by hidden punitive RNG, so the
 * number is stated on the control that harvests and on the control that fences.
 */
export const UNFENCED_LOSS = 1 / 3;
/** From this many plots in crop, a harvest is more than four people can carry in by hand. */
export const WAGON_HARVEST_PLOTS = 3;

export const STATES = ['none', 'sound', 'ruined'];

/**
 * What this household has on its land.
 *
 * A class saved before any of this has no `improvements` at all, and the empty value is
 * the correct one and the one every family used to have: a cabin standing, and no fence.
 * So no save version moved - `sim/trade.mjs` is the worked example of the same call.
 * `fence` here is the old whole-field fence, read only for a class whose field has never become plots (sim/fields.mjs).
 */
export function improvementsOf(household) {
  return { cabin: 'sound', fence: 'none', ...(household.improvements || {}) };
}
/** How many plots of this household's are cleared: its field. */
export const clearedOf = household => clearedPlots(household).length;
/** Every cleared plot has rails round it. */
export const isFenced = household => { const cleared = clearedPlots(household); return cleared.length > 0 && cleared.every(plot => plot.fence === 'sound'); };

/**
 * The share of a harvest that actually reaches the family: the stock take a third of what grows on an unfenced plot.
 * Counted over the plots a harvest would bring in (`cropPlots`), or over the cleared plots when nothing is sown.
 */
export function harvestShare(household, plots = cropPlots(household)) {
  const growing = plots.length ? plots : clearedPlots(household);
  if (!growing.length) return 1;
  return 1 - UNFENCED_LOSS * growing.filter(plot => plot.fence !== 'sound').length / growing.length;
}

/**
 * The plots a harvest would bring in (owner, 2026-09-30, each plot its own crop: docs/LAND_GRANTS.md §5.2): the ripe ones; while
 * none is ripe, those in crop, for the control that says what is coming; and the cleared ones before anything is planted.
 */
export const cropPlots = household => {
  const ripe = ripePlots(household);
  if (ripe.length) return ripe;
  const sown = sownPlots(household);
  return sown.length ? sown : clearedPlots(household);
};
/**
 * What these plots would yield brought in, before anybody's skill touches it: food from corn, bales from cotton, each plot with its
 * own crop's yield, and with a third less where it is unfenced when `kept` (the stock's share).
 */
export function cropYields(household, plots = cropPlots(household), { kept = false } = {}) {
  const yields = { food: 0, cotton: 0 };
  for (const plot of plots) {
    const crop = cropOf(household, plot);
    yields[crop === 'cotton' ? 'cotton' : 'food'] += yieldPerPlot(crop) * (kept && plot.fence !== 'sound' ? 1 - UNFENCED_LOSS : 1);
  }
  return yields;
}
/** What bringing in this household's crop would yield, before anybody's skill touches it: food and bales counted together. */
export const standingCrop = household => { const { food, cotton } = cropYields(household); return food + cotton; };

/** Whether this crop is more than the family can carry in without the wagon: three plots or more brought in at once. */
export const needsWagonToHarvest = (household, plots = cropPlots(household)) => plots.length >= WAGON_HARVEST_PLOTS;

export function setImprovement(world, household, kind, state) {
  if (!STATES.includes(state)) throw new Error('Invalid improvement state');
  household.improvements = { ...improvementsOf(household), [kind]: state };
  return household.improvements;
}

/**
 * One spell of clearing on a staked plot. Returns true when that spell cleared it. The work done stays on the plot, so a
 * person called home and sent back later picks up where the family left off.
 */
export function clearSpell(world, household, entity, plotId) {
  const plot = keepPlots(world, household).find(candidate => candidate.id === plotId);
  if (!plot || plot.state !== 'staked') return true;
  plot.work = (plot.work || 0) + 1;
  if (plot.work < clearingSpells(plot)) return false;
  delete plot.work;
  plot.state = 'cleared';
  // The trees that stood on it come down with it (owner, 2026-09-17: "instead of having survey just magically clearing trees,
  // there should be a way to cut those trees down, and use those to build with"). The same felling the axe does tree by tree
  // (sim/felling.mjs), done here because the ground itself was cleared: the trees leave the map, their logs go onto the family's
  // one pile (owner, 2026-09-28), and nothing is created that the woods did not hold.
  const felled = fellStanding(world, household, plot);
  record(world, 'property', {
    actorId: entity?.id, householdId: household.id, importance: 2, claimId: 'FIC-GONZ-025',
    text: `${entity ? entity.name : 'The family'} finished clearing ten acres of ${plot.ground} ${whereFromHouse(world, household, plot)}. The field is ${clearedOf(household) * 10} acres now.${felled.trees ? ` ${felled.trees === 1 ? 'One tree came down' : `${felled.trees} trees came down`} with it, and ${felled.logs === 1 ? 'one log went' : `${felled.logs} logs went`} onto the pile at the house.` : ''}`,
  });
  return true;
}

export function raiseFence(world, household, entity, plotId) {
  const plot = keepPlots(world, household).find(candidate => candidate.id === plotId);
  if (!plot || plot.state !== 'cleared' || plot.fence === 'sound') return;
  const was = plot.fence;
  plot.fence = 'sound';
  const where = whereFromHouse(world, household, plot);
  record(world, 'property', {
    actorId: entity?.id, householdId: household.id, importance: 2,
    text: was === 'ruined'
      ? `${entity?.name || 'The family'} set the rails back up round the ten acres ${where}. The stock are out of that crop again.`
      : `${entity?.name || 'The family'} split rails and fenced the ten acres ${where}. The stock are out of that crop now.`,
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
export function ruin(world, household, kinds, { by = null, text = null, visibility = null } = {}) {
  const ruined = [];
  for (const kind of kinds) {
    if (kind === 'field') {
      // Burnt ground is still ground, and the stakes are still in it. What is lost is the standing crop and the work of
      // clearing, not the land itself: every plot goes back to staked and uncleared (docs/LAND_GRANTS.md §5).
      if (!clearedOf(household) && !fieldPlots(household).some(plot => plot.work) && !sownPlots(household).length) continue;
      // Each plot's own crop goes with it (sim/crops.mjs), and what it last grew with the clearing.
      for (const plot of keepPlots(world, household)) { plot.state = 'staked'; delete plot.work; delete plot.sown; delete plot.fence; delete plot.crop; delete plot.grownMs; delete plot.ripe; }
      { const { grownMs: _grown, ...field } = household.field || {}; household.field = { ...field, state: 'bare', changedTick: world.tick }; }
      ruined.push('field');
      continue;
    }
    if (kind === 'fence') {
      // Rails come down round every plot that had them.
      const standing = clearedPlots(household).filter(plot => plot.fence === 'sound');
      if (!standing.length) continue;
      for (const plot of keepPlots(world, household)) if (plot.fence === 'sound') plot.fence = 'ruined';
      ruined.push('fence');
      continue;
    }
    if (improvementsOf(household)[kind] === 'ruined') continue;
    setImprovement(world, household, kind, 'ruined');
    ruined.push(kind);
  }
  if (!ruined.length) return ruined;
  record(world, 'consequence', {
    householdId: household.id, importance: 3, ...(by && { actorId: by }),
    // 'sealed': it happened, and the family does not know yet (sim/scrape.mjs `burnByForagers`); revealed with the ending.
    ...(visibility && { visibility }),
    text: text || `What the family made of this place is gone: ${ruined.join(', ')}.`,
  });
  return ruined;
}

/** Everything on this land and what state it is in, for the family's own panel. The plots themselves ride beside it. */
export function improvementProjection(household) {
  const standing = improvementsOf(household);
  return {
    cabin: standing.cabin,
    cleared: clearedOf(household),
    fenced: clearedPlots(household).filter(plot => plot.fence === 'sound').length,
    harvestShare: harvestShare(household),
    needsWagon: needsWagonToHarvest(household),
  };
}
