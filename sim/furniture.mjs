/**
 * Furniture and the carpenter: docs/SETTLING_IN.md §6, build step 6.
 *
 * A table, benches, a bedstead, shelves and a cradle. Each is **made at home** - an afternoon at the
 * timber for a small tree and the work of making it, with the tools the wagon brought and paced by
 * `hands` - or **bought from the carpenter** in the family's own town, for coin or food at a counter
 * in the same shape as the store. One of each, at most.
 *
 * Each piece does one small thing, on the hooks a house already has, and says what before it is
 * chosen (`FIC-GONZ-008`): a bedstead and benches help rest mend at home, a table makes the food go a
 * little further, shelves keep it from spoiling, and a cradle lets a parent with a baby at home do
 * heavy work at their full pace. Everything but the cradle needs a roof over it to do anything; a
 * bedstead standing by the wagon is a bedstead in the weather.
 *
 * Every number here is invented, registered as `FIC-GONZ-037`. No source read says what furniture a
 * family of the colonies made or bought, or what it cost; Holley's "nothing for show, but all for
 * use" and a table set with wooden platters (`HIST-GONZ-027`) are the tone, not the numbers. The
 * carpenters are invented residents on the terms `FIC-GONZ-009` set for Marta Ibarra.
 *
 * Stored as `household.furniture = { [piece]: 'made' | 'bought' }`; absent reads as none, so a class
 * saved before this has no furniture and changes nothing, and no save version moves.
 *
 * The art is delivered (`home-table`, `home-bench`, `home-bedstead`, `home-shelves`, `home-cradle` in
 * `home-furnishings`) and waits for the interior view, step 7; until then a family's furniture is listed in
 * words in its book.
 */

export const FURNITURE = Object.freeze({
  bedstead: {
    name: 'Bedstead', a: 'a bedstead', work: 8, tools: ['axe', 'auger'], coin: 3, food: 6,
    rest: 1.1, does: 'Rest at home mends a tenth faster.',
  },
  table: {
    name: 'Table', a: 'a table', work: 6, tools: ['axe', 'auger'], coin: 2, food: 4,
    eaten: 0.95, does: 'Meals at a table go a little further: the family eats a twentieth less.',
  },
  benches: {
    name: 'Benches', a: 'benches', work: 3, tools: ['axe'], coin: 1, food: 2,
    rest: 1.05, does: 'Somewhere to sit: rest at home mends a twentieth faster.',
  },
  shelves: {
    name: 'Shelves', a: 'shelves', work: 3, tools: ['axe', 'auger'], coin: 1, food: 2,
    spoil: 0.7, does: 'Stores kept up off the floor: food spoils a third less.',
  },
  cradle: {
    name: 'Cradle', a: 'a cradle', work: 4, tools: ['axe'], coin: 1, food: 2,
    cradle: true, does: 'A baby can be set down: a parent does heavy work at home at full pace.',
  },
});
export const PIECES = Object.freeze(Object.keys(FURNITURE));
/** A baby this young has to be carried or minded (the family book's own "infant" band). */
export const BABY_UNDER = 2;
/** How much slower a parent does heavy work at home with a baby and no cradle. */
export const BABY_BURDEN = 1.25;

const owned = household => household.furniture || {};
export const hasPiece = (household, piece) => Boolean(owned(household)[piece]);
const toolWords = { axe: 'a felling axe', auger: 'an auger' };

/** Why this family cannot make this piece now, or null. */
export function makeRefusal(household, piece) {
  const kind = FURNITURE[piece];
  if (!kind) return 'That is not a piece of furniture.';
  if (hasPiece(household, piece)) return `The family already has ${kind.a}.`;
  const missing = kind.tools.find(tool => household.tools?.[tool] === undefined);
  if (missing) return `Making ${kind.a} wants ${toolWords[missing]}, and there is none in the house.`;
  return null;
}

/** Why this family cannot buy this piece this way now, or null. */
export function buyRefusal(household, piece, pay) {
  const kind = FURNITURE[piece];
  if (!kind) return 'That is not a piece of furniture.';
  if (hasPiece(household, piece)) return `The family already has ${kind.a}.`;
  if (pay === 'coin' && (household.resources.money ?? 0) < kind.coin) return `It costs ${kind.coin} ${kind.coin === 1 ? 'real' : 'reales'}, and there is not that much coin in the house.`;
  if (pay === 'food' && (household.resources.food ?? 0) < kind.food) return 'There is not enough food to pay with.';
  return null;
}

/** The pieces a family could still make or buy, for whether the work is offered at all. */
export const wanting = household => PIECES.filter(piece => !hasPiece(household, piece));

/**
 * What the family's furniture does now: shares of rest at home, food eaten and food spoiling.
 * Only under a roof. Every share is exactly 1 for a family with none, which is every class saved before.
 */
export function furnitureShares(household, housed) {
  const shares = { rest: 1, eaten: 1, spoil: 1 };
  if (!housed) return shares;
  for (const piece of PIECES) {
    if (!hasPiece(household, piece)) continue;
    const kind = FURNITURE[piece];
    if (kind.rest) shares.rest *= kind.rest;
    if (kind.eaten) shares.eaten *= kind.eaten;
    if (kind.spoil) shares.spoil *= kind.spoil;
  }
  return shares;
}

/**
 * Whether this person is doing heavy work at home with a baby to mind: a parent, a living child
 * under two at home, and no cradle. It never stops the work - it slows it, and says so.
 *
 * Since 2026-09-21 a child of seven or more who has been *set to* minding the younger ones lifts it while they are at it
 * (`child-mind`, sim/children.mjs, docs/FAMILY_CREATION.md §3's amendment) - the same relief the cradle gives, and the one
 * effect the children's small jobs have on anything the simulation already counted. The chore's id is written out rather
 * than imported: sim/children.mjs imports sim/chores.mjs, which imports this file, and one restated string is cheaper than
 * making that arrow exist. `tests/children.test.mjs` fails if the id ever moves.
 *
 * ceiling: only a child actually set to it counts. The other parent standing idle at home does not, and counting that is
 * still the obvious refinement if the slowdown bites in play.
 */
export function mindingBaby(world, household, entity) {
  if (hasPiece(household, 'cradle')) return false;
  if (household.members.some(id => world.entities[id]?.chore?.id === 'child-mind')) return false;
  if (!['father', 'mother'].includes(entity.kin?.role)) return false;
  return household.members.some(id => {
    const person = world.entities[id];
    return person && person.id !== entity.id && Number.isFinite(person.age) && person.age < BABY_UNDER
      && person.health?.condition !== 'dead' && person.location?.siteId === household.homeSiteId;
  });
}

/** A piece reaches the house. */
export function furnish(household, piece, how) {
  household.furniture = { ...owned(household), [piece]: how };
}

/** A stored piece that is no piece, or kept in a way no piece is kept. */
export function furnitureInvalid(world) {
  for (const household of Object.values(world.households)) {
    if (household.furniture === undefined) continue;
    if (!household.furniture || typeof household.furniture !== 'object') return 'Invalid furniture';
    for (const [piece, how] of Object.entries(household.furniture)) {
      if (!FURNITURE[piece] || !['made', 'bought'].includes(how)) return 'Invalid furniture';
    }
  }
  return null;
}

/** The family's furniture, in words, for its own book. */
export const furnitureWords = household => PIECES.filter(piece => hasPiece(household, piece))
  .map(piece => `${FURNITURE[piece].name} (${owned(household)[piece]})`);
