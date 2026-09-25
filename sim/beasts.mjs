/**
 * How many horses and oxen a family owns, and the animals it buys (owner, 2026-09-24: "players should also be able to buy more
 * horses and other animals. they should be relatively expensive though."; docs/TOWNS.md §4d).
 *
 * **Every beast is its own animal.** Until this a family had one horse, one ox and one wagon, each an entity named by its part
 * (`propertyId`: `hh-1-horse`, `hh-1-animal`, `hh-1-wagon`), and every reader asked for the one by its id. A horse or an ox bought
 * in town is another entity beside it, with an id of its own that never changes (`hh-1-horse-2`, `hh-1-animal-2`), a name, a place
 * on the map and a `borrowedBy` like the first. So two horses are two riders: sim/keeping.mjs `userOf` holds one animal a person,
 * and a refusal comes only when every one is out.
 *
 * **What part an animal plays** is read from what it is (`roleOf`), not from its id: a wagon is the wagon, a horse the horse, and
 * every other animal an ox - which is also what a class saved before there were horses has always drawn an animal as (sim/world.mjs,
 * `species`). So every class saved before opens exactly as it was: one of each, found by the ids it always had. No save version
 * moved; nothing old is read another way.
 *
 * **Brought home on a halter** (`LEAD_PACE`): a bought horse or ox is not ridden or yoked home. It walks home led by whoever bought
 * it, whatever way they go - on foot, on the family's horse, or tied behind the wagon - and it is theirs on the road until it is in
 * the yard (`leads`, sim/world.mjs `beginTravel`). A led horse keeps up with anybody; a led ox walks at an ox's pace, and so
 * does whoever leads it. Cattle and hogs bought are driven home at the same pace and join the herd (sim/stock.mjs), which is two
 * numbers on the range and not animals on the map. One person leads one animal home (`LEAD_MOST`).
 *
 * **Wagons are counted too** (owner, 2026-09-25: "families should arrive with an appropriate number of wagons. larger families get
 * more than one wagon based on their population. ... wheelwright sells one, very expensive."; docs/SETTLING_IN.md §4a,
 * docs/TOWNS.md §4f). A family of more than `WAGON_PEOPLE` people is fitted out at its roll with a wagon for every eight of
 * them and an ox to draw each (`wagonsForPeople`, `fitOut`, `FIC-GONZ-391`), and the wheelwright builds one more for coin
 * (sim/shops.mjs, `FIC-GONZ-392`). A second wagon is its own entity beside the family wagon (`hh-1-wagon-2`), found as a wagon by
 * what it is, and `userOf` holds one a person: two wagons are two loads out at once, each behind its own ox.
 *
 * This file imports only the travel table, so sim/keeping.mjs, sim/world.mjs, sim/shops.mjs and sim/scrape.mjs can all ask it.
 */
import { WAGON_SPEED, propertyId } from './travel.mjs';

/** The part an animal or the wagon plays: 'horse', 'ox' or 'wagon'; null for anything else. */
export function roleOf(entity) {
  if (!entity) return null;
  if (entity.kind === 'wagon') return 'wagon';
  if (entity.kind !== 'animal') return null;
  return entity.species === 'horse' ? 'horse' : 'ox';
}
/** One and many of each, in the words a sentence uses. */
export const BEAST_WORDS = Object.freeze({ horse: ['horse', 'horses'], ox: ['ox', 'oxen'], wagon: ['wagon', 'wagons'] });

/**
 * Every beast of this part the family owns, the one it always had first and the rest in the order they were bought. A class saved
 * before has only the first, found by the id it always had, so an old family is read exactly as it was.
 */
export function beastsOf(world, household, role) {
  if (!household) return [];
  // What the family owns is its property list; the first is found by the id it always had, and put first.
  const first = world.entities[propertyId(household.id, role)];
  const found = first && roleOf(first) === role && (household.property || []).includes(first.id) ? [first] : [];
  for (const id of household.property || []) {
    const beast = world.entities[id];
    if (beast && beast !== first && roleOf(beast) === role) found.push(beast);
  }
  return found;
}
/** Every animal and wagon the family owns. */
export const allBeasts = (world, household) => (household?.property || []).map(id => world.entities[id]).filter(beast => roleOf(beast));
/** The ones still the family's: not taken by the army, not left in a bog. */
export const kept = beast => !['taken', 'lost'].includes(beast?.condition);

/**
 * The names bought animals are given, in the order a family buys them (`FIC-GONZ-389`, invented): Bess the mare and Juniper the ox
 * are every family's first, and these are the next. Deterministic - the family's second horse is always the first name here - so a
 * class replays the same.
 */
export const BEAST_NAMES = Object.freeze({
  horse: ['Dandy the gelding', 'Kit the mare', 'Pardo the gelding', 'Nell the mare', 'Blue the gelding', 'Chico the gelding'],
  ox: ['Buck the ox', 'Berry the ox', 'Duke the ox', 'Brindle the ox', 'Star the ox', 'Pomp the ox'],
  // The family wagon is the first; the rest are counted, as a family would say them (`FIC-GONZ-391`).
  wagon: ['Second wagon', 'Third wagon', 'Fourth wagon', 'Fifth wagon'],
});
/**
 * The most horses, the most oxen and the most wagons one family can own, the first among them (`FIC-GONZ-389`). ceiling: a cap so
 * the family's own projection stays small (each animal is an entity on the wire), counting those the army took or the road lost,
 * since they are still entities; nobody in a class of an hour buys this many, and a real reason would lift it. A family of twenty
 * is fitted out with three wagons and three oxen (`wagonsForPeople`), so it can still buy one of each.
 */
export const BEASTS_MOST = 4;

/**
 * How many people one wagon moves (owner, 2026-09-25; `FIC-GONZ-391`, on `HIST-TEX-441`). The record gives no rule by family
 * size: a family came overland "with his family and a small portion of his goods in a wagon" (Parker), a party was told to bring
 * "a strong large wagon" (Woodman), and more wagons went with more wealth, not more children - Harris's neighbours who owned wagons
 * were "the aristocracy", and one big wagon behind six yoke carried five families in the flight. So the rule is the game's own,
 * set where the record's families sit: seven or eight children was a large family of the time (docs/FAMILY_CREATION.md §2,
 * Haines), so one wagon moves up to eight people - every family the record describes - and each eight more is another wagon.
 * Counted by **head**, not by what they eat: the owner asked for wagons by population, and a child rides, sleeps and is clothed out
 * of the wagon whatever share of the food it eats.
 * ceiling: wealth is what really put a second wagon on the road; nothing in the game rolls a family's wealth, and one would replace this.
 */
export const WAGON_PEOPLE = 8;
/** The wagons a family of this many people comes with: one to eight, one; nine to sixteen, two; seventeen to twenty, three. */
export const wagonsForPeople = count => Math.max(1, Math.ceil((Number(count) || 0) / WAGON_PEOPLE));

/**
 * A new beast or wagon of the family's, with an id that is the next free one after the first - `hh-1-horse-2`, `hh-1-animal-3`,
 * `hh-1-wagon-2` - and never changes. Bought, it stands where the buyer stands and is theirs until it is home (`borrowedBy`,
 * sim/keeping.mjs `holderOf`: a beast standing with somebody away from home is theirs). Brought at the founding (`fitOut`), it
 * stands in the yard and is nobody's (`entity` null, `at` its place).
 */
export function addBeast(world, household, role, entity, { at = null } = {}) {
  const base = propertyId(household.id, role);
  let n = 2;
  while (world.entities[`${base}-${n}`]) n++;
  const id = `${base}-${n}`;
  const names = BEAST_NAMES[role];
  const name = names[(n - 2) % names.length];
  const where = at || entity?.location || world.map.sites[household.homeSiteId];
  world.entities[id] = {
    id, name, ...(role === 'wagon' ? { kind: 'wagon' } : { kind: 'animal', species: role }), householdId: household.id, depth: 'aggregate',
    location: { x: where.x, y: where.y, siteId: where.siteId ?? null }, travel: null, condition: 'sound', borrowedBy: entity?.id ?? null,
  };
  household.property = [...(household.property || []), id];
  return world.entities[id];
}

/**
 * A family fitted out for its size, at its roll (sim/world.mjs `rollFamily`, a class made since 2026-09-25): as many wagons as
 * `wagonsForPeople` gives its people, and an ox to draw every one (sim/travel.mjs: the ox and wagon go together, one ox to a
 * wagon), set down in the yard beside the family wagon and Juniper, a little further along the rail each. Never takes a wagon
 * away: every family has the first. Returns how many wagons it has.
 * ceiling: the game's ox is the team - one ox draws one wagon, as Juniper always has - where the record's wagons went behind a
 * yoke or more (`HIST-TEX-441`); a yoke of two would be two entities to every wagon on the wire.
 */
export function fitOut(world, household) {
  const want = Math.min(BEASTS_MOST, wagonsForPeople(household.members.length));
  const site = world.map.sites[household.homeSiteId];
  for (const role of ['wagon', 'ox']) {
    while (beastsOf(world, household, role).length < want) {
      const beast = addBeast(world, household, role, null, { at: { x: site.x, y: site.y, siteId: site.id } });
      beast.location = { ...yardSpot(site, beast), siteId: site.id };
    }
  }
  return beastsOf(world, household, 'wagon').length;
}
/** The wagon this person has with them - on the road with them, or standing where they stand - or null (`holderOf` handed in). */
export function wagonWith(world, entity, holderOf) {
  const household = world.households[entity?.householdId];
  return beastsOf(world, household, 'wagon').find(wagon => holderOf(world, wagon) === entity) || null;
}

/**
 * How fast an animal led home on a halter or driven home walks, in miles a farming tick (sim/travel.mjs), when it holds its
 * leader back: an ox at the ox team's pace (`HIST-TEX-093`: an ox team about two miles an hour), and cattle and hogs driven
 * at the same (`FIC-GONZ-389`, invented: the record gives no pace for a few head driven home). A led horse keeps up with anybody,
 * so it is not here.
 */
export const LEAD_PACE = Object.freeze({ ox: WAGON_SPEED, cattle: WAGON_SPEED, hogs: WAGON_SPEED });
/**
 * One person leads one animal home on a halter (`FIC-GONZ-389`): a horse or an ox, never both, whichever way they go. What they
 * lead is written on them (`entity.leads`, the animal's id; `entity.drives`, cattle and hogs by the head) at the counter, and goes
 * with them on every road until they are home (sim/world.mjs `progressTravel`) - the errand called off in town included - or
 * they are dead or taken (sim/keeping.mjs `homeAgain`).
 */
export const LEAD_MOST = 1;
/** The slowest pace of what this person is bringing home on the hoof, or null when nothing holds them back. */
export function ledPace(world, entity) {
  const paces = [
    ...(entity?.leads || []).map(id => LEAD_PACE[roleOf(world.entities[id])]),
    ...Object.keys(entity?.drives || {}).map(kind => LEAD_PACE[kind]),
  ].filter(Number.isFinite);
  return paces.length ? Math.min(...paces) : null;
}

/**
 * Where a beast or a wagon stands in the yard, home from the road: a few rods west of the house, as Bess, Juniper and the family
 * wagon were set down when the family came (sim/world.mjs), each one after the first a little further along the rail - so two
 * horses are two horses and two wagons two wagons, not one drawn on the other.
 */
export function yardSpot(site, beast) {
  // The number on the end of the id: `hh-1-horse-3` is the third horse, and the first has none. (Until 2026-09-25 this read
  // `/-(d+)$/`, which matched no number, so every animal bought stood on the second one's spot.)
  const n = Number(String(beast.id).match(/-(\d+)$/)?.[1] || 1);
  const [dx, dy] = beast.kind === 'wagon' ? [-.045, .05] : beast.species === 'horse' ? [-.06, .01] : [-.035, .02];
  return { x: Math.round((site.x + dx - .02 * (n - 1)) * 10000) / 10000, y: Math.round((site.y + dy + .012) * 10000) / 10000 };
}

/** "two horses, 2 oxen, 2 wagons": the family's animals as the popup's stock line says them, and its wagons when it has more than one. */
export function beastWords(world, household) {
  const parts = [];
  for (const role of ['horse', 'ox', 'wagon']) {
    const n = beastsOf(world, household, role).filter(kept).length;
    if (!n || (role === 'wagon' && n < 2)) continue;
    const [one, many] = BEAST_WORDS[role];
    parts.push(n === 1 ? `${role === 'ox' ? 'an' : 'a'} ${one}` : `${n} ${many}`);
  }
  return parts;
}

/** Stored animals that could not have been bought, and leads that are nobody's (sim/world.mjs `validateWorld`). */
export function beastsInvalid(world) {
  for (const household of Object.values(world.households || {})) {
    for (const role of ['horse', 'ox', 'wagon']) if (beastsOf(world, household, role).length > BEASTS_MOST) return 'Too many animals';
    for (const id of household.property || []) {
      const beast = world.entities[id];
      if (beast && beast.householdId !== household.id) return 'Invalid family property';
    }
  }
  for (const entity of Object.values(world.entities)) {
    const leads = entity.leads;
    if (leads !== undefined) {
      const household = world.households[entity.householdId];
      if (!Array.isArray(leads) || !leads.length || leads.length > LEAD_MOST || leads.some(id => !household?.property?.includes(id) || !['horse', 'ox'].includes(roleOf(world.entities[id])))) return 'Invalid animal led home';
    }
    const drives = entity.drives;
    if (drives !== undefined && (!drives || typeof drives !== 'object' || !Object.keys(drives).length || Object.entries(drives).some(([kind, n]) => !(kind in LEAD_PACE) || kind === 'ox' || !Number.isInteger(n) || n < 1))) return 'Invalid stock driven home';
  }
  return null;
}
