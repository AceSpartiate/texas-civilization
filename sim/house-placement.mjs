import { holdingOf } from './grants.mjs';
import { siteFacts } from './ground.mjs';
import { woodsRule } from './woods.mjs';

// Conservative envelope includes the full eight-foot construction grid and its eaves.
export function placementBounds(p) {
  const halfX = (p.rotation % 180 ? 32 : 40) / 5280;
  const halfY = (p.rotation % 180 ? 40 : 32) / 5280;
  return { minX: p.x - halfX, maxX: p.x + halfX, minY: p.y - halfY, maxY: p.y + halfY };
}

export function checkHousePlacement(world, household, placement) {
  if (!placement || !Number.isFinite(placement.x) || !Number.isFinite(placement.y) || ![0, 90, 180, 270].includes(placement.rotation)) throw new Error('Choose a house position and a quarter-turn orientation.');
  const bounds = holdingOf(world, household)?.bounds;
  if (!bounds) throw new Error('Choose a site on your own holding.');
  const box = placementBounds(placement);
  for (const x of [box.minX, placement.x, box.maxX]) for (const y of [box.minY, placement.y, box.maxY]) {
    const facts = siteFacts({ x, y }, bounds, woodsRule(world));
    if (!facts.can) throw new Error(facts.why || 'The whole house must fit on buildable ground inside your land.');
  }
  for (const home of household.completedHouses || []) {
    const origin = world.map.sites[household.homeSiteId];
    const other = placementBounds(home.placement || { x: origin.x, y: origin.y, rotation: 0 });
    if (box.minX < other.maxX && box.maxX > other.minX && box.minY < other.maxY && box.maxY > other.minY) throw new Error('Leave space between this house and the existing house.');
  }
  return { x: placement.x, y: placement.y, rotation: placement.rotation };
}
