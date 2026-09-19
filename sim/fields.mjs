// The field is the plots a family has cleared: docs/LAND_GRANTS.md §5, build step 3.
//
// A family stakes ten acres wherever it chooses on its own land (sim/survey.mjs), clears them a spell at a time, fences
// them one at a time, and plants and harvests every cleared plot together. Clearing timber is three times the work of
// breaking prairie (`HIST-GONZ-039`); every other number here is `FIC-GONZ-025`.
//
// A class that has never surveyed or cleared anything stores no plots. Its field is read as plots instead: its old
// `field.cleared` patches, ten acres each, in a block in the corner of its field on the map nearest the house, fenced if
// its old fence was up and sown if its crop is in (§6). Nothing is written until the family changes a plot, so every
// class saved before this opens as it was and no save version moved.
import { distanceToPolyline } from './terrain.mjs';
import { landAround, onRealLand } from './ground.mjs';
import { patchAt, timberMilesFrom, woodsRule } from './woods.mjs';

export const PLOT_ACRES = 10;
/** About an eighth of a mile a side. */
export const PLOT_SIDE = Math.sqrt(PLOT_ACRES / 640);
/** The most patches a class saved before plots could have broken (the retired `CLEARING_MAX`, `FIC-GONZ-015`). */
export const OLD_PATCHES = 4;
/** Spells of work (sim/houses.mjs `SPELL_TICKS` each) to clear ten acres. Timber three times prairie (`HIST-GONZ-039`). */
export const CLEARING_SPELLS = Object.freeze({ prairie: 10, brush: 20, timber: 30 });
export const GROUNDS = Object.keys(CLEARING_SPELLS);

const round = (value, places = 3) => { const fixed = +value.toFixed(places); return fixed === 0 ? 0 : fixed; };
export const squareOf = point => ({ minX: point.x - PLOT_SIDE / 2, minY: point.y - PLOT_SIDE / 2, maxX: point.x + PLOT_SIDE / 2, maxY: point.y + PLOT_SIDE / 2 });
export const overlaps = (a, b) => a.minX < b.maxX && b.minX < a.maxX && a.minY < b.maxY && b.minY < a.maxY;

/** What ground a place is: timber, brush or prairie, from the map the class is played on. */
export function groundAt(world, point) {
  if (onRealLand(world)) {
    const cover = landAround({ minX: point.x - 2, minY: point.y - 2, maxX: point.x + 2, maxY: point.y + 2 }).coverAt(point, woodsRule(world));
    return cover === 'open' ? 'prairie' : cover;
  }
  // The invented country: timber along the water (HIST-GONZ-012), as its map draws it; open prairie between.
  const water = world.map.terrain.filter(feature => feature.kind === 'river' || feature.kind === 'creek');
  return water.some(course => distanceToPolyline(point, course.points) < 1.15) ? 'timber' : 'prairie';
}

/**
 * The plots as the field counts them, without where they lie: what is stored, or a class's old field read as plots.
 * Enough for everything that only counts - seed, yield, the fence's share, the wagon - so none of that needs the map.
 */
export function fieldPlots(household) {
  if (household.plots) return household.plots;
  const patches = Math.min(OLD_PATCHES, Math.max(1, household.field?.cleared ?? 1));
  const fence = household.improvements?.fence;
  const sown = (household.field?.state ?? 'bare') !== 'bare';
  return Array.from({ length: patches }, (_, index) => ({ id: `plot-${index + 1}`, state: 'cleared', ...(fence && fence !== 'none' && { fence }), ...(sown && { sown: true }) }));
}

/** Every plot a family has, with where it lies and its ground. */
export function plotsOf(world, household) {
  if (household.plots) return household.plots;
  const field = world.map.terrain.find(feature => feature.kind === 'field' && feature.ownerHouseholdId === household.id);
  if (!field) return [];
  const minX = Math.min(...field.points.map(p => p.x)), minY = Math.min(...field.points.map(p => p.y));
  return fieldPlots(household).map((plot, index) => {
    const point = { x: round(minX + PLOT_SIDE * (index % 2 + 0.5)), y: round(minY + PLOT_SIDE * (Math.floor(index / 2) + 0.5)) };
    return { id: plot.id, ...point, ground: groundAt(world, point), ...plot };
  });
}

/** The plots written down, so one of them can change. A class's old field becomes its plots here and only here. */
export function keepPlots(world, household) {
  if (!household.plots) household.plots = plotsOf(world, household).map(plot => ({ ...plot }));
  return household.plots;
}

export const clearedPlots = household => fieldPlots(household).filter(plot => plot.state === 'cleared');
/** What is growing, or waiting to be brought in: the plots that were planted. */
export const sownPlots = household => (household.field?.state ?? 'bare') === 'bare' ? [] : fieldPlots(household).filter(plot => plot.sown);

/** The plot a point on the map falls in, or null. */
export function plotAt(world, household, point) {
  if (!Number.isFinite(point?.x) || !Number.isFinite(point?.y)) return null;
  return plotsOf(world, household).find(plot => Math.abs(point.x - plot.x) <= PLOT_SIDE / 2 && Math.abs(point.y - plot.y) <= PLOT_SIDE / 2) || null;
}

/** Spells a plot needs, and has had. */
export const clearingSpells = plot => CLEARING_SPELLS[plot.ground] ?? CLEARING_SPELLS.timber;
/** The tool clearing this ground wants: timber is felled, prairie and brush are grubbed and broken with the hoe. */
export const clearingTool = plot => plot.ground === 'timber' ? 'axe' : 'hoe';

/**
 * Fencing by the country (docs/BIOME_GAMEPLAY.md §3.3, `FIC-GONZ-067`). Rails are split from timber - oak, cedar and ash, "valuable
 * for fencing and building" - and mesquite made fence posts as good as cedar (`HIST-TEX-111`); a plot out on the open prairie
 * has its rails carried from the nearest timber, which is the work that makes the prairie's easy clearing (`HIST-GONZ-039`) no
 * free gift. Ticks of work: splitting ten acres' rails where timber stands by, and more for every mile the rails come from.
 * On a class whose woods are not the biomes of 1836 every fence is the old eight ticks, as it always was.
 */
export const FENCE_TICKS = 8;
/** Ticks more for every mile the nearest timber stands from the plot: the rails for ten acres come in several loads. */
export const FENCE_TICKS_A_MILE = 4;
/** Nearer than this the timber is at hand. Further than `FENCE_REACH` it is as far as the rails are ever carried from. */
export const FENCE_NEAR_MILES = 0.25, FENCE_REACH = 3;
/** The stands whose own mesquite makes the fence: posts and brush where the plot stands (Holley p. 43; the brush fence at Béxar, `HIST-TEX-111`). */
const MESQUITE_FENCE = new Set(['mesquite-savanna', 'chaparral']);

/** How this plot would be fenced and what it costs: `{ ticks, how, miles }`, `how` one of rails, mesquite or hauled. */
export function fenceWork(world, household, plot) {
  if (!plot || woodsRule(world) !== 'biomes' || !onRealLand(world)) return { ticks: FENCE_TICKS, how: 'rails', miles: 0 };
  const land = landAround({ minX: plot.x - 4, minY: plot.y - 4, maxX: plot.x + 4, maxY: plot.y + 4 });
  const options = { rule: 'biomes', nearCreek: land.nearCreek };
  if (MESQUITE_FENCE.has(patchAt(plot, options).stand)) return { ticks: FENCE_TICKS, how: 'mesquite', miles: 0 };
  const miles = timberMilesFrom(plot, options, FENCE_REACH);
  if (miles !== null && miles <= FENCE_NEAR_MILES) return { ticks: FENCE_TICKS, how: 'rails', miles };
  const far = miles === null ? FENCE_REACH : round(miles, 1);
  return { ticks: FENCE_TICKS + Math.round(FENCE_TICKS_A_MILE * far), how: 'hauled', miles: miles === null ? null : far };
}

/** How the fence would go up, in the words on the control: "Rails carried from the timber 1.2 miles off: about 5 hours." */
export function fenceWords(work) {
  const hours = Math.max(1, Math.round(work.ticks / 3));
  if (work.how === 'mesquite') return `Mesquite posts and brush from where it stands: about ${hours} hours.`;
  if (work.how === 'rails') return `Rails split from the timber at hand: about ${hours} hours.`;
  return work.miles === null
    ? `No timber within ${FENCE_REACH} miles: the rails come from far off, about ${hours} hours.`
    : `Rails carried from the timber ${work.miles} miles off: about ${hours} hours.`;
}
