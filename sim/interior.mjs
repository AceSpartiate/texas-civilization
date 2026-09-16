// Inside the house: docs/SETTLING_IN.md step 7, decided by the owner by multiple choice (2026-09-16).
//
// "Decoration is placing what the family brought and made in its house." The owner chose: the student opens the interior by
// clicking the family's own house on the map; each room has marked spots (by the hearth, under the window, by the door) and
// an item is set on a free one; what can be placed is the furniture the family made or bought and the goods that came in
// the wagon; and the interior opens only once a house stands - a family still camping has nowhere to set anything.
//
// Placement is for the student's attachment. It changes nothing in the world: furniture's small effects come from owning it
// (sim/furniture.mjs), wherever it stands or whether it is set out at all. Nothing here is recorded in the family's story;
// arranging a room twenty times is not news.
//
// Stored as `household.interior = { [spotId]: itemId }`; absent reads as a bare room, so every class saved before opens.
import { FURNITURE } from './furniture.mjs';
import { wagonItem } from './wagon.mjs';
import { landView } from './houses.mjs';
import { INTERIORS, INTERIOR_ART, INTERIOR_OF } from './interior-data.mjs';

export { INTERIORS, INTERIOR_ART };

/** Which interior this family's house has, or null while there is no house standing. */
export function interiorOf(household) {
  const view = landView(household);
  if (view.shelter !== 'house') return null;
  const kind = INTERIOR_OF[view.layout] || view.layout;
  return INTERIORS[kind] ? kind : 'round-log';
}

/** Everything this family has that can be set out, each once: its furniture, and the goods and stores it brought. */
export function interiorItems(household) {
  const items = [];
  for (const piece of Object.keys(household.furniture || {})) if (FURNITURE[piece]) items.push({ id: `furniture:${piece}`, name: FURNITURE[piece].name });
  for (const entry of household.load || []) {
    const item = wagonItem(entry.id);
    if (!item || !entry.amount) continue;
    const id = `${item.kind === 'good' ? 'good' : item.kind === 'stores' ? 'stores' : 'tool'}:${item.id}`;
    if (INTERIOR_ART[id]) items.push({ id, name: item.name });
  }
  return items;
}

/** Why this cannot be set here, or null. `spot` null is packing the item away. */
export function placeRefusal(world, household, itemId, spot) {
  const kind = interiorOf(household);
  if (!kind) return 'The family is still camping. There is no house yet to set things in.';
  const item = interiorItems(household).find(entry => entry.id === itemId);
  if (!item) return 'The family has no such thing to set out.';
  if (spot === null || spot === undefined || spot === '') return null;
  if (!INTERIORS[kind].spots.some(([id]) => id === spot)) return 'There is no such place in this house.';
  const there = household.interior?.[spot];
  if (there && there !== itemId) return `${interiorItems(household).find(entry => entry.id === there)?.name || 'Something'} already stands there.`;
  return null;
}

/** Set a thing in a spot, moving it from wherever it stood; or, with no spot, put it away. */
export function placeItem(world, household, itemId, spot) {
  const why = placeRefusal(world, household, itemId, spot);
  if (why) throw new Error(why);
  const interior = Object.fromEntries(Object.entries(household.interior || {}).filter(([, item]) => item !== itemId));
  if (spot) interior[spot] = itemId;
  household.interior = interior;
}

/**
 * The family's own house, as the interior view needs it, kept small because it rides every tick: which interior (null while
 * camping), what stands where, and which things the family has. The spots and the art are static (sim/interior-data.mjs).
 */
export function interiorProjection(household) {
  return { kind: interiorOf(household), placed: household.interior || {}, items: interiorItems(household).map(item => item.id) };
}

/** Everything that must be true of a saved interior. */
export function interiorInvalid(world) {
  for (const household of Object.values(world.households)) {
    if (household.interior === undefined) continue;
    if (!household.interior || typeof household.interior !== 'object') return 'Invalid interior';
    const spots = new Set(Object.values(INTERIORS).flatMap(interior => interior.spots.map(([id]) => id)));
    const items = Object.values(household.interior);
    if (new Set(items).size !== items.length) return 'An interior holds one thing in two places';
    for (const [spot, item] of Object.entries(household.interior)) {
      if (!spots.has(spot) || !INTERIOR_ART[item]) return 'An interior holds something that cannot be there';
    }
  }
  return null;
}
