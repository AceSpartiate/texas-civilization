// What a family ate between deer: small game, fish, oysters and honey.
//
// docs/BIOMES.md §17.3 and docs/BIOME_GAMEPLAY.md §9.4, owner 2026-09-20 ("all three"). The bestiary audit of the same day
// listed these as the best-attested things in the record that the game had no idea about, and said why each was left out:
// each is a new **kind** of work rather than a correction to a quarry's weight. This is that work.
//
// The hunt this game has is a still-hunt - walk out, work in, wait downwind for hours, take or hold one shot - and it is
// the only way a family has ever had of bringing in food that it did not grow. The record does not read like that. It
// reads like this:
//
//   "Venison, **and small game**"                       Dilue Rose Harris of her family's table (`HIST-TEX-264`)
//   "Innumerable perch, trout, and other scaly fry"     Kuykendall, of the colony's own brooks
//   "Oyster beds are frequent along the coast...        Woodman, 1835, p. 59
//    may be conveniently gathered"
//   "Bees were plentiful, and we were rarely            Kuykendall; Dewees, "a vast quantity of bee trees about here";
//    without honey"                                     Smithwick's first Texas meal, "dried venison sopped in honey"
//
// **Four things these four works have in common, and each is the point of them.** They are short, so an hour is worth
// spending on one; they are certain, so nothing here can miss (`FIC-GONZ-008`); three of the four want no powder, and two
// want no knack at all, so **the people who cannot hunt can still bring in food** - which is exactly who Harris's small
// game and Kuykendall's perch were brought in by. And each belongs to a country: the coast has oysters and the prairie
// has not, the timbered creek has fish and honey and the open grass has neither. What a family can eat now depends on
// where it settled, which is the whole argument of docs/BIOMES.md applied to the table rather than to the trees.
//
// `FIC-GONZ-173` to `-176`. What is NOT here: the feral hog (it belongs to the stock economy of `HIST-TEX-112`, because a
// hog in the woods was somebody's or had been), and the panther, the wolf and the alligator (the game has no hidden risk
// to a person out on the land by design, `FIC-GONZ-008`, and a wolf that can hurt somebody is a change to that rule).
import { landAround, onRealLand } from './ground.mjs';
import { huntingPlace } from './hunting.mjs';
import { distanceToPolyline } from './terrain.mjs';

/** How far from the house a family will go for a day's gathering, in miles: near work, not an expedition. */
export const FORAGE_REACH = 3;
/** Water a line is worth putting in has to run all year; how near the house it has to be is `FORAGE_REACH`. */
const PERENNIAL = info => info.kind !== 'creek' || info.perennial;
/** The stands that stand on salt water: where the oyster beds are (docs/BIOMES.md §16, LANDFIRE 14860 and the islands). */
export const SALT_STANDS = Object.freeze(['salt-prairie', 'dunes']);

/**
 * The four works, and what each one gives.
 *
 * `food` is what one person's hands bring in before their own skill is counted, in the same units as everything else a
 * family eats: one person eats 0.35 in a day (sim/periods.mjs), so a mess of perch is a day and a half for a family of
 * five and a squirrel or two is rather more than one.
 *
 * ceiling: honey is food. A settler valued it as the only sweet they had and traded it, and a `honey` resource would want
 * a price in every shop and a row in every panel; what it is worth to the family that cuts the tree is the four food it
 * eats, and the event says the word. If honey is ever wanted as a trade good, this is the line to undo.
 */
export const FORAGE = Object.freeze({
  smallgame: Object.freeze({
    food: 2, hours: 1, powder: true, skill: 'hunting', cover: ['timber', 'brush'],
    what: 'a squirrel or two',
    // Holley pp. 99-100, "in great abundance"; Smithwick shot squirrels in the pecans at San Felipe. Deliberately NOT a
    // quarry in `GAME`: putting it in the draw would take places away from the deer and make the long hunt worse, which
    // is the thing docs/BIOME_GAMEPLAY.md §9.4 warned about. It is a different hour's work instead.
    why: 'Holley: squirrel, rabbit, raccoon and opossum "in great abundance" (`HIST-TEX-264`).',
  }),
  fish: Object.freeze({
    food: 3, hours: 2, skill: 'hands', water: 'perennial',
    what: 'perch and trout',
    why: 'Kuykendall: "Innumerable perch, trout, and other scaly fry" in the colony\'s brooks (`HIST-TEX-264`).',
  }),
  oysters: Object.freeze({
    food: 3, hours: 2, skill: 'hands', salt: true,
    what: 'oysters',
    why: 'Woodman, 1835: beds "frequent along the coast... may be conveniently gathered" (`HIST-TEX-264`).',
  }),
  honey: Object.freeze({
    food: 4, hours: 2, skill: 'hands', axe: true, cover: ['timber'],
    what: 'honey, and the comb',
    why: 'Dewees, "a vast quantity of bee trees about here"; Kuykendall, "rarely without honey" (`HIST-TEX-264`).',
  }),
});

/**
 * The nearest water worth fishing, or null.
 *
 * A creek that goes dry in the summer holds nothing to catch, so only perennial water counts (sim/ground.mjs's own
 * `perennial`, which is the record's rule for which creeks ran); on the invented country every drawn river and creek
 * counts, because that map does not say which ran.
 */
export function fishingWater(world, point, reach = FORAGE_REACH) {
  if (!point) return null;
  if (onRealLand(world)) {
    const box = { minX: point.x - reach - 1, minY: point.y - reach - 1, maxX: point.x + reach + 1, maxY: point.y + reach + 1 };
    const found = landAround(box).nearestWater(point, PERENNIAL, reach);
    return found ? { x: found.at.x, y: found.at.y, miles: found.distance, name: found.name || null, kind: found.kind } : null;
  }
  let best = null;
  for (const course of world.map?.terrain || []) {
    if (course.kind !== 'river' && course.kind !== 'creek') continue;
    const miles = distanceToPolyline(point, course.points);
    if (miles <= reach && (!best || miles < best.miles)) best = { x: point.x, y: point.y, miles, name: course.name || null, kind: course.kind };
  }
  return best;
}

/** Whether this place stands on salt water: the country round the bays and on the islands, and water within reach of it. */
export function onSaltWater(world, point, reach = FORAGE_REACH) {
  if (!onRealLand(world) || !point) return false;
  if (SALT_STANDS.includes(huntingPlace(world, point).stand)) return true;
  // A house set back a little from the salt prairie still walks down to the beds: the ground is read a short way off as
  // well as underfoot, along the four bearings, which is how the hunt reads an edge (sim/hunting.mjs `huntingPlace`).
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const about = { x: point.x + dx * reach, y: point.y + dy * reach };
    if (SALT_STANDS.includes(huntingPlace(world, about).stand)) return true;
  }
  return false;
}

/**
 * What this family could gather where it lives, work by work: whether it can, where it would go and what it would bring
 * home. Said before anybody is sent, like every other cost in this game (`FIC-GONZ-008`).
 *
 * `cover` is the ground at the house's own hunting place, which is the same ground the hunt is told about.
 */
export function forageFacts(world, household, kind, home, { cover = null, axe = false, powder = false } = {}) {
  const work = FORAGE[kind];
  if (!work || !home) return { can: false, why: 'No such work.' };
  if (work.powder && !powder) return { can: false, why: 'There is no powder and lead in the house.' };
  if (work.axe && !axe) return { can: false, why: 'Cutting a bee tree wants an axe, and there is none in the house.' };
  if (work.cover && cover && !work.cover.includes(cover)) {
    return { can: false, why: kind === 'honey' ? 'There is no timber within reach of the house for a bee tree.' : 'There is no timber or brush within reach of the house.' };
  }
  if (work.water) {
    const water = fishingWater(world, home);
    if (!water) return { can: false, why: 'There is no water within reach of the house that runs all year.' };
    const named = water.name ? `${/River$/.test(water.name) ? 'the ' : ''}${water.name}` : water.kind === 'river' ? 'the river' : 'the creek';
    return { can: true, where: named, miles: Math.round(water.miles * 10) / 10, food: work.food, hours: work.hours, what: work.what };
  }
  if (work.salt && !onSaltWater(world, home)) return { can: false, why: 'The oyster beds are on the coast, and this land is not.' };
  return { can: true, ...(work.salt && { where: 'the beds along the shore' }), food: work.food, hours: work.hours, what: work.what };
}

// The winter turkey and the lean deer - the fourth thing this session built - live in sim/hunting.mjs, with the rest of
// what a quarry is worth: `winterShare`, `WINTER_MONTHS`, `FIC-GONZ-177`. They are the same reading of Kuykendall as the
// four works above, and they are there rather than here so that nothing imports this module to weigh a deer (sim/hunting.mjs
// is imported by this one, and one direction is all a module graph should ever have).
