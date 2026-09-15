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
import { woodsRule } from './woods.mjs';

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
