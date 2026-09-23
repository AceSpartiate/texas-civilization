// Where a family may set a house on its own land: docs/WOODS_AND_BUILDING.md §6.5, HANDOFF.md "House placement preview".
//
// Judged on the house as the map draws it (sim/house-footprint.mjs), not in true feet: its ground footprint must lie on
// buildable ground inside the family's own line and clear of the water and of the family's own field, and no house's
// ground or pictures may cover another's (`spacingRefusal`). Houses already standing are never moved or refused - only a
// new placement is judged - so a class saved when the check was an 80 by 64 foot envelope opens with its houses where
// they were, even two now drawn over one another.
import { holdingOf } from './grants.mjs';
import { IN_THE_WATER, landAround, onRealLand, siteFacts } from './ground.mjs';
import { woodsRule } from './woods.mjs';
import { plotCatalogue } from './houseplot.mjs';
import { plotsOf, squareOf } from './fields.mjs';
import { houseOnGround, overlaps, spacingRefusal, standingAt } from './house-footprint.mjs';

let catalogue = null;
/** The plot's pieces and plans, as the page is sent them: what a footprint is worked out from on both sides. */
const pieceCatalogue = () => (catalogue ||= plotCatalogue());

/**
 * Every house of the family on the ground (`houseOnGround`): the one being raised and those it has finished, each at its
 * placement, or at the site where one placed nowhere is drawn. `houses` defaults to the family's own.
 */
export function housesOnLand(world, household, houses = [household.house, ...(household.completedHouses || [])]) {
  const site = world.map.sites[household.homeSiteId];
  return houses.filter(Boolean).map(house => ({ house, at: standingAt(house, site) })).filter(each => each.at)
    .map(({ house, at }) => houseOnGround(house, pieceCatalogue(), at));
}

/** The nine points of a box that the ground under a house is read at: its corners, the middles of its sides, its middle. */
const ninePoints = box => [box.minX, (box.minX + box.maxX) / 2, box.maxX].flatMap(x => [box.minY, (box.minY + box.maxY) / 2, box.maxY].map(y => ({ x, y })));

/**
 * The placement, checked, or a throw with the refusal in the family's words. `layout` is the plan being placed, whose
 * pieces make its footprint (a plan the catalogue does not know claims the whole plot, `houseCells`).
 */
export function checkHousePlacement(world, household, placement, layout) {
  if (!placement || !Number.isFinite(placement.x) || !Number.isFinite(placement.y) || ![0, 90, 180, 270].includes(placement.rotation)) throw new Error('Choose a house position and a quarter-turn orientation.');
  const bounds = holdingOf(world, household)?.bounds;
  if (!bounds) throw new Error('Choose a site on your own holding.');
  const at = { x: placement.x, y: placement.y, rotation: placement.rotation };
  const house = houseOnGround({ plan: layout }, pieceCatalogue(), at);
  // The ground: every rule a house's point has (in the land and set back from its line, not in the water, not too steep),
  // at nine points of the drawn footprint.
  for (const point of ninePoints(house.footprint)) {
    const facts = siteFacts(point, bounds, woodsRule(world));
    if (!facts.can) throw new Error(facts.why || 'The whole house must fit on buildable ground inside your land.');
  }
  // And the whole footprint clear of the water, so a creek cannot run between those points.
  if (onRealLand(world) && landAround(house.footprint).waterNear(house.footprint, IN_THE_WATER)) throw new Error('That is in the water.');
  // Its pictures stand on the family's own land too: set back from the line, a house's roof never stands over a neighbour's
  // ground, so no two families' houses can be drawn one over the other.
  if (house.claim.minX < bounds.minX || house.claim.maxX > bounds.maxX || house.claim.minY < bounds.minY || house.claim.maxY > bounds.maxY) throw new Error('That is on the line of your land. Set the house back from it.');
  // Not on the family's field: ground it has staked or cleared (sim/survey.mjs refuses a plot over a house the same way).
  if (plotsOf(world, household).some(plot => overlaps(squareOf(plot), house.footprint))) throw new Error('That would stand on your field.');
  const why = spacingRefusal(house, housesOnLand(world, household, household.completedHouses || []));
  if (why) throw new Error(why);
  return at;
}
