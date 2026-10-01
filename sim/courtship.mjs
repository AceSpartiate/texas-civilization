// The lone parent's path: two neighbours' farms, a wedding - by bond, or for a Tejano family by the priest from La Bahía - and a
// house the neighbours raise.
//
// The owner's decision, 2026-09-29, verbatim: "at the start of the game. if a player is unlucky enough to have a lone parent,
// the following path is made available. a special ability appears when they reach their land. this ability should be
// highlighted and special looking. it will send them, with their children to visit other nearby farms to ask neighbors for
// help in raising their house. travel is skipped, and we see the family visit and talk to a family. on the 2nd family they
// meet a family that has a son of eligible marriage age. the age will be the same as our lone parent. light flirting occurs.
// travel is skipped again and we see the couple with the families gathered at our farm for a marriage. a short ceremony is
// shown and afterwards we find our new family with two parents. a basic house is also prebuilt for the player to make up for
// lost time with this series of things going on."
//
// And the owner's answers the same day: a lone father meets a **daughter** his age; the two neighbour families are **invented
// families nobody plays**, and no other student's family is touched or seen; the ability is **offered and can be declined** - it
// waits until it is pressed, for as long as the family has not raised a house of its own; and the new spouse is **rolled like a
// parent** (the same hidden dice), with looks and a name chosen for them, renamed later the usual way. Specified in
// docs/FAMILY_CREATION.md, *The lone parent's path*, and docs/SETTLING_IN.md §8a.
//
// What the server keeps, on the household (`household.courtship`, absent until the ability is pressed, so no save version moved):
//
//   began, until   the calendar minutes the family set out and comes home (`AWAY_MINUTES` apart): travel is skipped, and the
//                  family is away visiting for that span of 1835 - its people refused work and roads, drawn nowhere on its own
//                  page (`visiting` on each of them), and home again when the clock reaches `until`.
//   stage          'away', then 'home'.
//   party          who went: everybody of the family at home when it was pressed.
//   neighbours     the two invented families, with stable ids (`<household>-nb-1`, `-nb-2`, their people `-nb-1-p1` ...). They are
//                  **not households**: they are never in `world.households`, so they are never a contender, never counted as a
//                  class family, never run by a director and never seen on anybody's map. They live here, for the scenes and for
//                  the family's own book (the spouse was "born a Salcedo, of the farm past the ford").
//   spouse         the new parent as rolled at the press, and the id they are given: `<household>-spouse`, a stable new id.
//   rite           'bond', or 'priest' for a Tejano family (below).
//   seen           [steps recorded in the family's story so far]; `watched` once the student has walked the scenes.
//
// **The rite: marriage by bond** (`HIST-TEX-740`). In Mexican Texas only a priest could marry a couple and there was no civil
// ceremony; the church sent one resident priest to the Anglo colonies (Muldoon, 1831-32), and as late as 1835 there were only two
// secular priests in all Texas. Couples who could not reach one signed a bond before the local authority and witnesses, binding
// themselves to be married by a priest when one came; a Brazoria County bond of 1829 was made before the commissioner of the
// precinct. **Every start a family can have is an empresario colony with no resident priest in the sources read** (Austin's,
// DeWitt's, the Galveston Bay company's, De León's; docs/COLONIES.md §5.1), and the game models no family's faith, so every wedding
// here is by bond, before an invented commissioner, and the words promise the priest's marriage to come. `ceiling:` a De León's
// colony family (Victoria) may have been married by a visiting priest instead - the empresario brought priests from La Bahía,
// Nacogdoches and Béxar (TSHA, *De León's Colony*) - but when is not dated; `RITES` is the place a church wedding would go.
//
// **Amended by the owner, 2026-09-29 ("Priest from La Bahía"; docs/FAMILY_CREATION.md, *The family's start*):** a Tejano family
// (sim/starts.mjs) is married by **the priest from La Bahía**, unnamed and invented, before its neighbours as witnesses, and no bond
// is signed (`rite: 'priest'`, `HIST-TEX-781`: De León's colony had a church and no priest of its own, and Mass was said when a
// priest from La Bahía could come). An Anglo-American or free Black family keeps the bond. `ceiling:` that the priest is in the
// country on the day the family needs him is the game's convenience, and the church's own inquiry before a wedding (witnesses that
// the two were free to marry) is not shown.
//
// ceiling: the courtship is compressed into one day, as a house is into hours (sim/houses.mjs): a class lasts under two days of
// 1835. The scenes never say how long they have known each other.
// ceiling: a rider who comes to the land while the family is away finds its people where the server keeps them, at home; the
// family is away only in what it may be ordered to do and what its own page draws. Undo by giving the visit a real journey.
// ceiling: the children's `kin.parents` keep the parent they were born to, so how they look (taken after their parents,
// sim/appearance.mjs) does not change on the wedding day; the new parent is their step-parent (`kin.stepchildren`).
import { record } from './events.mjs';
import { dateOf } from './clock.mjs';
import { ageBand, ageNow, compositionFor, dealTraits, householdName, listWords, tableOf } from './family.mjs';
import { appearanceOf } from './appearance.mjs';
import { namingOf, poolsFor, skinChoices } from './starts.mjs';
import { CLOTHING, HAIR, HEAD, SKIN } from './look-vocabulary.mjs';
import { HOUSES, houseBuilt, houseSettled, pieced } from './houses.mjs';
import { PIECES, planPieces } from './houseplot.mjs';
import { checkHousePlacement } from './house-placement.mjs';
import { CELL_MILES } from './house-footprint.mjs';
import { setImprovement } from './improvements.mjs';
import { countsTrees, woodsRule } from './woods.mjs';
import { skillsFor } from './chores.mjs';
import { released } from './childhood.mjs';

/** How long the family is away, in minutes of 1835: the morning's two visits and the day's raising and wedding. `FIC-GONZ-950`. */
export const AWAY_MINUTES = 240;
/** When, after setting out, the family reaches the second farm. `FIC-GONZ-950`. */
export const SECOND_FARM_AT = 90;
/** The plainest house there is, raised by the neighbours: one round-log pen and a stick-and-mud chimney (sim/houseplot.mjs `PLANS`). */
export const RAISED_PLAN = 'round-log';
/** The kinds of wedding the game can show: by bond, and by the priest from La Bahía for a Tejano family (see the head of this file). */
export const RITES = Object.freeze(['bond', 'priest']);
/** The wedding a family has: a Tejano family's is the priest's (owner, 2026-09-29, "Priest from La Bahía"), everybody else's by bond. */
export const riteFor = household => (household?.heritage === 'tejano' ? 'priest' : 'bond');
/** The claims: the bond and the priest's coming are documented, everything else about the path is invented. */
export const CLAIMS = Object.freeze({ rite: 'HIST-TEX-740', path: 'FIC-GONZ-950', tejanoRite: 'HIST-TEX-781', priest: 'FIC-GONZ-987' });
/**
 * What the record says under a Tejano family's wedding (sim/starts.mjs; `HIST-TEX-781`): only a priest could marry a couple, De León's
 * colony had a church and no priest of its own, and a priest came from La Bahía to say Mass when he could. The Anglo colonists' bond
 * is said as theirs. Nothing here says when the priest came, how often, or who he was: the record does not.
 */
export const TEJANO_RITE_WORDS = 'In Mexican Texas only a Catholic priest could marry a couple, and priests were few. De León’s colony had a log church but no priest of its own; a priest came from La Bahía to say Mass when he could. Anglo colonists who could not reach a priest signed a bond instead.';

/**
 * The invented neighbour families (`FIC-GONZ-950`), on the terms `FIC-GONZ-001` and `-017` set for every invented name: not the
 * names of real colonists, no register consulted, mixed Anglo and Tejano as the colonies were. `farm` is which farmstead the page
 * draws: a log cabin with a porch, or a jacal under a brush ramada.
 */
export const NEIGHBOUR_FAMILIES = Object.freeze([
  Object.freeze({ surname: 'Ashby', plural: 'Ashbys', farm: 'porch', where: 'up the creek' }),
  Object.freeze({ surname: 'Tolliver', plural: 'Tollivers', farm: 'porch', where: 'over the rise' }),
  Object.freeze({ surname: 'Kittredge', plural: 'Kittredges', farm: 'porch', where: 'down the creek' }),
  Object.freeze({ surname: 'Whitlow', plural: 'Whitlows', farm: 'porch', where: 'by the big pecan' }),
  Object.freeze({ surname: 'Salcedo', plural: 'Salcedos', farm: 'ramada', where: 'past the ford' }),
  Object.freeze({ surname: 'Montañez', plural: 'Montañez family', farm: 'ramada', where: 'across the bottom' }),
  Object.freeze({ surname: 'Treviño', plural: 'Treviños', farm: 'ramada', where: 'beyond the live oaks' }),
  Object.freeze({ surname: 'Villa', plural: 'Villas', farm: 'ramada', where: 'up the draw' }),
]);
/**
 * In a class that deals starts (sim/starts.mjs, owner 2026-09-29), the neighbours are of the family's own country, and the family the
 * new husband or wife comes from is of the family's own start, so the one who marries in is dealt a skin tone, a name and a surname
 * that belong with the family's (the owner: skin tones "locked to what is realistic"; a new spouse "follows the same rule"). Invented,
 * on the same terms as the list above (`FIC-GONZ-950`, `-984`): each start has a family of each farmstead, so the two visits are
 * still two different homes.
 *   - `second`: whom the spouse is born to - a family of the same start.
 *   - `first`: the neighbours the family goes to first - for an Anglo-American family anybody of the colonies, as above; for a
 *     Tejano family of De León's colony, Tejano; for a free Black family, its Anglo-American neighbours, who help with the house as
 *     the Ashworths' neighbours stood by them (`HIST-TEX-783`).
 */
const ANGLO_NEIGHBOURS = Object.freeze([
  ...NEIGHBOUR_FAMILIES.filter(family => family.farm === 'porch'),
  Object.freeze({ surname: 'Pruett', plural: 'Pruetts', farm: 'ramada', where: 'past the ford' }),
  Object.freeze({ surname: 'Hensley', plural: 'Hensleys', farm: 'ramada', where: 'up the draw' }),
]);
const TEJANO_NEIGHBOURS = Object.freeze([
  ...NEIGHBOUR_FAMILIES.filter(family => family.farm === 'ramada'),
  Object.freeze({ surname: 'Olivares', plural: 'Olivares family', farm: 'porch', where: 'over the rise' }),
  Object.freeze({ surname: 'Serna', plural: 'Sernas', farm: 'porch', where: 'by the big pecan' }),
]);
const FREE_BLACK_NEIGHBOURS = Object.freeze([
  Object.freeze({ surname: 'Tanner', plural: 'Tanners', farm: 'porch', where: 'down the bayou' }),
  Object.freeze({ surname: 'Bledsoe', plural: 'Bledsoes', farm: 'ramada', where: 'across the bottom' }),
]);
/** The families the two visits are dealt from, for a family of this start: `null` (a class made before) keeps the one list. */
export function neighbourPools(heritage) {
  if (heritage === 'tejano') return { first: TEJANO_NEIGHBOURS, second: TEJANO_NEIGHBOURS };
  if (heritage === 'free-black') return { first: ANGLO_NEIGHBOURS, second: FREE_BLACK_NEIGHBOURS };
  if (heritage === 'anglo') return { first: NEIGHBOUR_FAMILIES, second: ANGLO_NEIGHBOURS };
  return { first: NEIGHBOUR_FAMILIES, second: NEIGHBOUR_FAMILIES };
}
/** Whose names a neighbour family is dealt: its list's, in every class, so its people's names go with its last name (owner, 2026-10-01). */
const namedAs = family => (FREE_BLACK_NEIGHBOURS.includes(family) ? 'free-black' : TEJANO_NEIGHBOURS.includes(family) ? 'tejano' : 'anglo');
/** The start a neighbour family of a class that deals starts is of: its list's. None in a class that deals none (every skin tone). */
const heritageOfNeighbour = (family, heritage) => (heritage ? namedAs(family) : null);

function hashOf(text) {
  let hash = 2166136261;
  for (const character of String(text)) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  hash ^= hash >>> 15; hash = Math.imul(hash, 2246822507); hash ^= hash >>> 13;
  return hash >>> 0;
}
const pick = (list, key) => list[hashOf(key) % list.length];
const DAY_MS = 86400000;
const isoDay = ms => new Date(ms).toISOString().slice(0, 10);
const SEX_ROLE = Object.freeze({ male: { grown: 'father', young: 'son' }, female: { grown: 'mother', young: 'daughter' } });
const other = sex => (sex === 'male' ? 'female' : 'male');
const firstName = person => person?.given || String(person?.name || '').split(' ')[0] || 'somebody';

// ---------------------------------------------------------------- who the path is for

/** The family's parents as rolled: how many the die gave it, or null for a family nobody rolled. */
const rolledParents = household => {
  if (!household?.roll) return null;
  try { return compositionFor(household.roll, tableOf(household)).parents; } catch { return null; }
};
/** The lone parent of a family rolled with one: the living father or mother, and nobody who has married since. */
export function loneParentOf(world, household) {
  if (rolledParents(household) !== 1 || household.courtship) return null;
  const parents = household.members.map(id => world.entities[id]).filter(person => ['father', 'mother'].includes(person?.kin?.role));
  if (parents.length !== 1 || parents[0].kin.spouse) return null;
  return parents[0];
}

/** Whether the path is shown to this family at all: a student's own family, rolled with one parent, on its land, with no house. */
export function pathShown(world, household) {
  if (!household?.played || household.absent || household.courtship) return false;
  const parent = loneParentOf(world, household);
  if (!parent || ['dead', 'captured'].includes(parent.health?.condition)) return false;
  if (!['running', 'paused'].includes(world.status) || household.arriving) return false;
  // Offered until the family has a roof of its own it raised itself (the owner: "until they build a house themselves or use
  // it"). A house begun but not finished is still no roof: the neighbours finish it instead (`raiseTheHouse`).
  if (houseSettled(household)) return false;
  if (household.flight || household.takenIn) return false;
  return true;
}

/** Why the family cannot go now, or null. A refusal is a sentence the student reads on the ability. */
export function pathRefusal(world, household) {
  if (!household) return 'No family to send.';
  // The ability is the student's to press: a family nobody plays, and one whose student has gone, is run by the computer, which
  // never takes this path (docs/FAMILY_CREATION.md, *The lone parent's path*).
  if (!household.played || household.absent) return 'Only the family’s own student can take this path.';
  if (household.courtship) return 'The family has already been to the neighbours.';
  const parent = loneParentOf(world, household);
  if (!parent) return 'This is for a family that began with one parent.';
  if (world.status !== 'running') return world.status === 'paused' ? 'The class is paused.' : 'The neighbours can be visited once the class has begun.';
  if (household.arriving) return 'The family has not reached its land yet.';
  if (houseSettled(household)) return 'The family already has a roof of its own.';
  if (household.flight || household.takenIn) return 'Not while the family is on the road.';
  if (household.choosingSite) return 'Choose where your house will stand first, so the neighbours know where to raise it.';
  if (['dead', 'captured'].includes(parent.health?.condition) || parent.service) return `${parent.name} is not here to go.`;
  if (parent.health?.grave) return `${parent.name} is too sick to go visiting.`;
  if (parent.travel || parent.location?.siteId !== household.homeSiteId) return `${parent.name} is not at home. The family goes from home, together.`;
  return null;
}

// ---------------------------------------------------------------- the neighbours and the spouse, rolled at the press

const looksFor = (key, sex, age, skins = SKIN) => ({
  // Within the range of the neighbour family's start, where the class deals starts (sim/starts.mjs); every tone otherwise.
  skin: pick(skins, `${key}:skin`),
  hair: age >= 50 && hashOf(`${key}:grey`) % 3 ? 'grey' : pick(HAIR.filter(hair => hair !== 'grey'), `${key}:hair`),
  clothing: pick(CLOTHING, `${key}:clothing`),
  head: pick(HEAD[sex], `${key}:head`),
});

/** A first name from the pools, not one this family or these neighbours already use. */
function nameFrom(role, key, taken, pools) {
  const pool = pools[role];
  const start = hashOf(key) % pool.length;
  for (let i = 0; i < pool.length; i++) {
    const name = pool[(start + i) % pool.length];
    if (!taken.has(name)) { taken.add(name); return name; }
  }
  return pool[start];
}

/**
 * The two families, dealt from the seed and the household: the first from one kind of farmstead and the second from the other, so
 * the two visits look like two different homes. The second has the grown son or daughter of the parent's own age.
 */
export function dealNeighbours(world, household, parent, taken) {
  const key = `${world.seed}:${household.id}:courtship`;
  const own = household.surname;
  // Of the family's own country, and the spouse's family of its own start (`neighbourPools`): a family of a class that deals no
  // starts by the names it was dealt (sim/starts.mjs `namingOf`; owner, 2026-10-01). The skin tones are a start's alone.
  const heritage = household.heritage || null;
  const pools = neighbourPools(namingOf(household));
  const usable = pools.first.filter(family => family.surname !== own);
  const first = pick(usable, `${key}:first`);
  const second = pick(pools.second.filter(family => family.surname !== own && family.farm !== first.farm), `${key}:second`);
  const age = ageNow(world, parent) ?? parent.age ?? 30;
  const spouseSex = other(parent.sex);
  let of = null, family = null;
  // Each neighbour named from the pools of its own family's list, so a Salcedo is not called Caleb (`namedAs`).
  const person = (familyId, n, role, sex, years) => {
    const id = `${familyId}-p${n}`;
    return { id, given: nameFrom(role, `${key}:${id}:name`, taken, poolsFor(namedAs(family))), role, sex, age: years, appearance: looksFor(`${key}:${id}`, sex, years, skinChoices(of)) };
  };
  family = first; of = heritageOfNeighbour(first, heritage);
  // The first family: a couple of the parent's own time of life and a child or two to play with the family's own.
  const oneId = `${household.id}-nb-1`, twoId = `${household.id}-nb-2`;
  const husband = 26 + (hashOf(`${key}:one-age`) % 22);
  const wife = Math.max(20, husband - (hashOf(`${key}:one-gap`) % 6));
  const young = 1 + (hashOf(`${key}:one-kids`) % 2);
  const kids = Array.from({ length: young }, (_, k) => {
    const sex = hashOf(`${key}:one-kid-${k}`) % 2 ? 'female' : 'male';
    return person(oneId, 3 + k, SEX_ROLE[sex].young, sex, Math.min(wife - 18, 4 + ((hashOf(`${key}:one-kid-age-${k}`) % 8) + k * 2)));
  });
  const one = { id: oneId, surname: first.surname, plural: first.plural, farm: first.farm, where: first.where,
    people: [person(oneId, 1, 'father', 'male', husband), person(oneId, 2, 'mother', 'female', wife), ...kids] };
  // The second: the parents of a grown son or daughter the lone parent's own age (the owner: "the age will be the same as our
  // lone parent"), and the one who will marry, rolled like a parent (`rollSpouse`).
  const father = age + 22 + (hashOf(`${key}:two-age`) % 8);
  const mother = Math.max(age + 18, father - (hashOf(`${key}:two-gap`) % 6));
  family = second; of = heritageOfNeighbour(second, heritage);
  const two = { id: twoId, surname: second.surname, plural: second.plural, farm: second.farm, where: second.where,
    people: [person(twoId, 1, 'father', 'male', father), person(twoId, 2, 'mother', 'female', mother)] };
  return { one, two, spouseSex, age };
}

/**
 * The new parent, rolled like any parent (the owner: "hidden stats on the same dice as any parent, with looks and name chosen
 * automatically"): the parent's own age, born on a day of that year of its own, `dealTraits` for the hidden three, and the looks a
 * parent is dealt when nobody chooses, stored so the student is not asked for them.
 */
export function rollSpouse(world, household, parent, sex, age, taken) {
  const id = `${household.id}-spouse`;
  const today = Date.parse(dateOf(world, world.minute).toISOString().slice(0, 10));
  // A birthday between one day and a year before today, `age` years back: the same age as the parent today, a birthday of their own.
  const back = 1 + (hashOf(`${world.seed}:${id}:birthday`) % 364);
  const bornMs = Date.UTC(new Date(today).getUTCFullYear() - age, new Date(today).getUTCMonth(), new Date(today).getUTCDate()) - back * DAY_MS;
  const role = SEX_ROLE[sex].grown;
  // A name from the pools the family is named from (sim/starts.mjs `namingOf`): the family they marry into is theirs.
  const given = nameFrom(role, `${world.seed}:${id}:name`, taken, poolsFor(namingOf(household)));
  return { id, given, sex, role, age, born: isoDay(bornMs), traits: dealTraits(world.seed, id, sex, age) };
}

// ---------------------------------------------------------------- pressing it, and the day away

const atHome = (household, person) => person && !person.travel && person.location?.siteId === household.homeSiteId
  && !['dead', 'captured'].includes(person.health?.condition) && !person.service;

/**
 * The family sets out (`ask-neighbours`). Everybody at home goes - the parent and the children - and is away for `AWAY_MINUTES`;
 * whatever they were at is left, and they are refused work and roads until they are back (`visitingWhy`).
 */
export function askNeighbours(world, household, { abandon } = {}) {
  const why = pathRefusal(world, household);
  if (why) throw new Error(why);
  const parent = loneParentOf(world, household);
  const taken = new Set(household.members.map(id => firstName(world.entities[id])));
  const { one, two, spouseSex, age } = dealNeighbours(world, household, parent, taken);
  const spouse = rollSpouse(world, household, parent, spouseSex, age, taken);
  const party = household.members.filter(id => atHome(household, world.entities[id]));
  // A child who had stopped a grown-up to talk goes with them now: the talk is over (sim/childhood.mjs `released`).
  for (const id of party) released(world, world.entities[id]);
  for (const id of party) {
    const person = world.entities[id];
    if (person.chore) { if (abandon) abandon(world, household, person); else person.chore = null; }
    if (person.task === 'work') person.task = 'rest';
    person.visiting = true;
  }
  household.courtship = {
    stage: 'away', began: world.minute, until: world.minute + AWAY_MINUTES, rite: riteFor(household), parentId: parent.id,
    party, neighbours: [one, two], spouse, seen: ['set-out'],
  };
  const kids = party.filter(id => id !== parent.id).map(id => firstName(world.entities[id]));
  record(world, 'courtship', {
    actorId: parent.id, householdId: household.id, importance: 2, claimId: CLAIMS.path,
    text: `${parent.name} set out${kids.length ? ` with ${listWords(kids)}` : ''} to ask the neighbours for help raising a house. At the ${one.surname} farm ${one.where}, ${one.people[0].given} and ${one.people[1].given} ${one.surname} promised a day's work on the walls.`,
  });
  return household.courtship;
}

/** Why somebody of the family cannot be sent or set to work while the family is away visiting, or null. */
export function visitingWhy(world, entity) {
  if (!entity?.visiting) return null;
  const household = world.households[entity.householdId];
  const until = household?.courtship?.until;
  return `${entity.name} is away with the family at the neighbours' farms${Number.isFinite(until) ? `, home by ${clockWords(dateOf(world, until))}` : ''}.`;
}
/** "four in the afternoon", "about half past ten in the morning". */
export function clockWords(date) {
  const hours = date.getUTCHours(), minutes = date.getUTCMinutes();
  const words = ['twelve', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven'];
  const hour = words[hours % 12], part = hours < 12 ? 'in the morning' : hours < 17 ? 'in the afternoon' : 'in the evening';
  return `${minutes >= 45 ? 'nearly ' : minutes >= 15 ? 'about half past ' : 'about '}${minutes >= 45 ? words[(hours + 1) % 12] : hour} ${part}`;
}

/**
 * The time of day a scene happens at, by the class's own clock: the light the page draws it in and the word it is headed with.
 * The scenes are dated by the calendar (`began`, `began + SECOND_FARM_AT`, `until`), so a family that sets out at seven is married
 * before noon and one that sets out at three by lamplight, and nothing the scenes say contradicts the clock the class reads.
 */
export function partOfDay(date) {
  const hour = date.getUTCHours() + date.getUTCMinutes() / 60;
  if (hour < 5) return { light: 'night', when: 'Night', that: 'That night', by: 'by night' };
  if (hour < 10.5) return { light: 'morning', when: 'Morning', that: 'That morning', by: 'by mid-morning' };
  if (hour < 15) return { light: 'noon', when: 'Midday', that: 'At midday', by: 'by midday' };
  if (hour < 18) return { light: 'evening', when: 'Afternoon', that: 'That afternoon', by: 'by the afternoon' };
  if (hour < 21) return { light: 'evening', when: 'Evening', that: 'That evening', by: 'by evening' };
  return { light: 'night', when: 'Night', that: 'That night', by: 'by nightfall' };
}

/** Every tick: the second farm said in the family's story when the clock reaches it, and the family home at `until`. */
export function advanceCourtship(world) {
  for (const household of Object.values(world.households)) {
    const path = household.courtship;
    if (path?.stage !== 'away') continue;
    if (!path.seen.includes('second') && world.minute >= path.began + SECOND_FARM_AT) {
      const [, two] = path.neighbours;
      const parent = world.entities[path.parentId];
      path.seen.push('second');
      record(world, 'courtship', {
        actorId: parent?.id, householdId: household.id, importance: 2, claimId: CLAIMS.path,
        text: `At the ${two.surname} place ${two.where}, the ${two.plural} promised their help too, and so did ${path.spouse.given}, who is ${firstName(parent)}'s own age and could not stop smiling.`,
      });
    }
    if (world.minute >= path.until) comeHome(world, household);
  }
}

/**
 * The day ends at the family's own land: the neighbours have raised the house, the couple are married (by bond, or by the priest from
 * La Bahía for a Tejano family), and the new parent
 * is one of the family. Everything the family will live with from now on is decided here.
 */
export function comeHome(world, household) {
  const path = household.courtship;
  const parent = world.entities[path.parentId];
  const raised = raiseTheHouse(world, household);
  const spouse = joinTheFamily(world, household, parent, path.spouse);
  // A lone mother marries: the family takes his name and he leads it (owner, 2026-09-29: "His name", "New husband leads"). A lone
  // father marries: his wife takes his name, and he stays the principal.
  if (spouse.sex === 'male') { takeHisName(world, household, spouse, path); heLeads(household, parent, spouse); }
  for (const id of path.party) delete world.entities[id]?.visiting;
  path.stage = 'home';
  path.home = world.minute;
  path.house = raised;
  path.seen.push('home');
  const [one, two] = path.neighbours;
  const houseWords = raised === 'finished' ? 'finished the house the family had begun' : `raised a ${HOUSES[RAISED_PLAN].name.toLowerCase()}`;
  record(world, 'courtship', {
    actorId: parent?.id, householdId: household.id, importance: 3, claimId: CLAIMS.path,
    text: path.rite === 'priest'
      ? `The ${one.plural} and the ${two.plural} came to the land and ${houseWords}. ${partOfDay(dateOf(world, world.minute)).that} ${parent?.name} and ${spouse.name} were married by the priest from La Bahía, their neighbours the witnesses.`
      : `The ${one.plural} and the ${two.plural} came to the land and ${houseWords}. ${partOfDay(dateOf(world, world.minute)).that} ${parent?.name} and ${spouse.name} were married by bond before the commissioner of the precinct and their neighbours, promising to be married by a priest when one comes.`,
  });
  record(world, 'courtship', {
    actorId: spouse.id, householdId: household.id, importance: 2, claimId: CLAIMS.rite, classification: 'DOCUMENTED',
    text: path.rite === 'priest' ? TEJANO_RITE_WORDS
      : 'In Mexican Texas only a priest could marry a couple, and priests were few; couples in the colonies signed a bond before the local authority and witnesses, promising to be married by a priest when one came.',
    ...(path.rite === 'priest' && { claimId: CLAIMS.tejanoRite }),
  });
}

/**
 * The family takes the new husband's name (owner, 2026-09-29, by multiple choice: "His name" - as a bride did in 1835): the family's
 * last name becomes the one he was born to, every one of them is called by it, and the name it had is kept (`formerSurname`) for the
 * family book and the story. Only names change: every id, the household's among them, stays what it was.
 */
function takeHisName(world, household, husband, path) {
  const born = path.neighbours[1].surname;
  const was = household.surname || null;
  const wasCalled = householdName(world, household);
  if (was === born) return;
  path.formerSurname = was;
  path.formerName = wasCalled;
  household.surname = born;
  delete household.name;
  for (const id of household.members) {
    const person = world.entities[id];
    if (!person || person.kind !== 'person') continue;
    person.given ??= person.name;
    person.name = `${person.given} ${born}`;
  }
  record(world, 'memory', { householdId: household.id, actorId: husband.id, importance: 2, claimId: CLAIMS.path,
    text: `The family took ${firstName(husband)}'s name, ${born}. Until the wedding it was ${wasCalled}.` });
}

/**
 * A new husband leads the family (owner, 2026-09-29, by multiple choice: "New husband leads"): he is its principal, whom the
 * settlement's calls and the war's questions are put to, and its main person, the student's star. The lone mother's own choice of a
 * main person goes with it, as a choice among the people a family had before the wedding. A new wife does not lead; a lone father
 * stays the principal.
 */
function heLeads(household, mother, husband) {
  if (mother) { mother.principal = false; mother.depth = 'moderate'; }
  husband.principal = true; husband.depth = 'detailed';
  household.principalId = husband.id;
  delete household.mainId;
}

/** The new parent put into the family: a stable new id, the second parent's role, the step-parent of the children. */
function joinTheFamily(world, household, parent, rolled) {
  const site = world.map.sites[household.homeSiteId];
  const children = household.members.filter(id => ['son', 'daughter'].includes(world.entities[id]?.kin?.role));
  const name = household.surname ? `${rolled.given} ${household.surname}` : rolled.given;
  const at = parent && !parent.travel && parent.location?.siteId === household.homeSiteId ? parent.location : { x: site.x, y: site.y, siteId: site.id };
  const entity = {
    id: rolled.id, name, ...(household.surname && { given: rolled.given }), kind: 'person', householdId: household.id, depth: 'moderate', principal: false,
    location: { x: +(at.x + 0.012).toFixed(4), y: at.y, siteId: household.homeSiteId }, travel: null, health: { condition: 'well' }, task: 'rest',
    skills: skillsFor(rolled.id), chore: null,
    kin: { role: rolled.role, spouse: parent?.id || null, parents: [], children: [], stepchildren: children },
    relationships: {}, propertyRefs: [`${household.id}-wagon`], commitments: [],
    sex: rolled.sex, age: rolled.age, born: rolled.born, traits: { ...rolled.traits },
  };
  world.entities[entity.id] = entity;
  // Looks chosen for them, as a parent's are dealt when nobody chooses, and kept (so the student is not asked): the owner, "looks
  // and name chosen automatically".
  entity.appearance = appearanceOf(world, entity);
  // Second in the family's order, after the parent they married, as the panel reads it (father, mother, children oldest first).
  const at1 = household.members.indexOf(parent?.id);
  household.members.splice(at1 < 0 ? household.members.length : at1 + 1, 0, entity.id);
  if (parent) parent.kin = { ...parent.kin, spouse: entity.id };
  return entity;
}

/**
 * The house the neighbours raise: the family's own, finished, if it had begun one (the logs and the plan are its own); otherwise
 * the plainest house there is, a round-log cabin, set down on the family's land where it may stand. Returns 'finished' or 'raised'.
 */
export function raiseTheHouse(world, household) {
  const plan = household.house;
  const begun = pieced(household) ? plan.pieces.some(p => p.stage > 0 || p.progress > 0) : Boolean(plan && plan.work > 0);
  if (plan && begun && !houseBuilt(household)) {
    if (pieced(household)) for (const p of plan.pieces) { p.stage = PIECES[p.type].stages.length; p.progress = 0; }
    else plan.work = HOUSES[plan.layout].work;
    setImprovement(world, household, 'cabin', 'sound');
    return 'finished';
  }
  const plotted = countsTrees(woodsRule(world));
  const placement = plotted ? placeFor(world, household, plan?.placement) : null;
  household.house = plotted
    ? { plan: RAISED_PLAN, pieces: planPieces(RAISED_PLAN).map(p => ({ ...p, stage: PIECES[p.type].stages.length })), ...(placement && { placement }) }
    : { layout: RAISED_PLAN, work: HOUSES[RAISED_PLAN].work };
  setImprovement(world, household, 'cabin', 'sound');
  return 'raised';
}

/**
 * Where the raised house stands: where the family meant to put its own, if a cabin fits there, else the nearest place to the house
 * site the placement rule allows (sim/house-placement.mjs, the student's own rule), else no placement - drawn at the site, where
 * the director's houses and every old save's stand.
 */
export function placeFor(world, household, wanted = null) {
  const site = world.map.sites[household.homeSiteId];
  if (!site) return null;
  const tries = [];
  if (wanted) tries.push({ x: wanted.x, y: wanted.y, rotation: wanted.rotation || 0 });
  tries.push({ x: site.x, y: +(site.y - CELL_MILES).toFixed(4), rotation: 0 });
  for (let ring = 1; ring <= 8; ring++) {
    for (let step = 0; step < ring * 8; step++) {
      const turn = (step / (ring * 8)) * Math.PI * 2, reach = ring * CELL_MILES * 1.5;
      tries.push({ x: +(site.x + Math.cos(turn) * reach).toFixed(4), y: +(site.y - CELL_MILES + Math.sin(turn) * reach).toFixed(4), rotation: 0 });
    }
  }
  for (const at of tries) {
    try { return checkHousePlacement(world, household, at, RAISED_PLAN); } catch { /* not here; the next */ }
  }
  return null;
}

// ---------------------------------------------------------------- what the page is sent

/** The offer, for the family's own page: whether it can be pressed now and, if not, why. Absent when the path is not shown. */
export function offerView(world, household) {
  if (!pathShown(world, household)) return null;
  const why = pathRefusal(world, household);
  const parent = loneParentOf(world, household);
  const kids = household.members.filter(id => ['son', 'daughter'].includes(world.entities[id]?.kin?.role)).length;
  return {
    can: !why, ...(why && { why }),
    title: 'Ask the neighbours for help',
    says: kids
      ? `Take the children to the farms nearby and ask the neighbours to help ${firstName(parent)} raise a house.`
      : `Go to the farms nearby and ask the neighbours to help ${firstName(parent)} raise a house.`,
    note: `The family is away about ${AWAY_MINUTES / 60} hours.`,
  };
}

/** Everything the page shows of the path, for the family's own page only; absent for the Host and for every other family. */
export function courtshipView(world, householdId, role) {
  if (role === 'host' || !householdId) return {};
  const household = world.households[householdId];
  if (!household) return {};
  const path = household.courtship;
  if (path && !path.watched) return { courtship: { stage: path.stage, home: path.stage === 'home', script: courtshipScript(world, household) } };
  const offer = offerView(world, household);
  return offer ? { courtship: { offer } } : {};
}

/** The student has walked the scenes to the end (`courtship-watched`): they are not shown again, on this page or any other. */
export function markWatched(world, household) {
  if (!household?.courtship) throw new Error('The family has not been to the neighbours.');
  if (!household.played || household.absent) throw new Error('Only the family’s own student can do that.');
  household.courtship.watched = true;
}

// ---------------------------------------------------------------- the scenes' words
//
// Written here, not on the page (docs/FAMILY_PANEL.md §14.2: the page writes none of the sentences). Every line is invented
// (`FIC-GONZ-950`) and drawn with a dashed edge (public/speech.js: anything not documented), except the one line of history
// under the wedding, which is `HIST-TEX-740`. Gentle and short, for a room of twelve-year-olds: shy glances, a compliment, a
// laugh, joined hands.

const castOf = (world, household, path) => {
  const cast = {};
  for (const id of path.party) {
    const person = world.entities[id];
    if (!person) continue;
    const age = ageNow(world, person) ?? person.age;
    cast[id] = { id, name: person.name, given: firstName(person), sex: person.sex || null, age, band: ageBand(age) || 'adult', appearance: appearanceOf(world, person), family: true, ...(id === path.parentId && { lone: true }) };
  }
  const spouse = world.entities[path.spouse.id];
  const spouseLooks = spouse ? appearanceOf(world, spouse) : appearanceOf(world, { id: path.spouse.id, kind: 'person', householdId: household.id, sex: path.spouse.sex, age: path.spouse.age, kin: { role: path.spouse.role } });
  cast[path.spouse.id] = { id: path.spouse.id, name: path.spouse.given, given: path.spouse.given, sex: path.spouse.sex, age: path.spouse.age, band: 'adult', appearance: spouseLooks, family: false, spouse: true };
  for (const family of path.neighbours) for (const one of family.people) {
    cast[one.id] = { id: one.id, name: `${one.given} ${family.surname}`, given: one.given, sex: one.sex, age: one.age, band: ageBand(one.age) || 'adult', appearance: one.appearance, family: false, of: family.id };
  }
  // Who marries them, at the place the page keeps for him (`commissioner`): the commissioner of the precinct, invented, unnamed, and
  // drawn as the elder figure reading the bond; or for a Tejano family the priest from La Bahía, invented and unnamed, in dark clothes
  // (`priest`: the page recolours the elder for him; stand-in: the priest at a Tejano wedding, docs/ART_REQUESTS.md, item 5).
  cast.commissioner = path.rite === 'priest'
    ? { id: 'commissioner', name: 'The priest', given: 'The priest', sex: 'male', age: 55, band: 'adult', appearance: { skin: 'olive', hair: 'grey', clothing: 'navy', head: 'bareheaded' }, family: false, official: true, priest: true }
    : { id: 'commissioner', name: 'The commissioner', given: 'The commissioner', sex: 'male', age: 50, band: 'adult', appearance: { skin: 'tan', hair: 'grey', clothing: 'navy', head: 'hat' }, family: false, official: true };
  return cast;
};

/** The scenes, in order: the first farm, the second, the wedding at the family's own land, and afterwards. */
export function courtshipScript(world, household) {
  const path = household.courtship;
  const parent = world.entities[path.parentId];
  const P = firstName(parent);
  const S = path.spouse.given;
  const [one, two] = path.neighbours;
  const [a1, a2, ...aKids] = one.people;
  const [b1, b2] = two.people;
  const kids = path.party.filter(id => id !== parent?.id).map(id => world.entities[id]).filter(Boolean)
    .sort((a, b) => (ageNow(world, b) ?? b.age ?? 0) - (ageNow(world, a) ?? a.age ?? 0));
  const eldest = kids[0], youngest = kids.at(-1);
  const talker = kids.find(kid => (ageNow(world, kid) ?? kid.age ?? 0) >= 3) || null;
  const parentWord = parent?.sex === 'female' ? 'Ma' : 'Pa';
  const spouseIs = path.spouse.sex === 'female' ? { they: 'she', their: 'her', them: 'her', role: 'daughter', spouse: 'wife' } : { they: 'he', their: 'his', them: 'him', role: 'son', spouse: 'husband' };
  const parentIs = parent?.sex === 'female' ? { spouse: 'wife' } : { spouse: 'husband' };
  const b2word = 'Mother';
  const say = (speaker, text, pose = 'speak', extra = {}) => ({ speaker, text, pose, kind: 'reconstructed', claimId: CLAIMS.path, ...extra });
  const kidList = kids.map(firstName);
  const household_ = householdName(world, household);
  const at = minute => partOfDay(dateOf(world, minute));
  const t1 = at(path.began), t2 = at(path.began + SECOND_FARM_AT), t3 = at(path.until);
  const hello = t1.light === 'morning' ? 'Good morning!' : t1.when === 'Midday' ? 'Good day to you!' : 'Good evening!';
  const cap = text => text[0].toUpperCase() + text.slice(1);
  const raised = path.house === 'finished' || (path.stage === 'away' && (pieced(household) ? household.house?.pieces?.some(p => p.stage > 0 || p.progress > 0) : household.house?.work > 0));

  // The house the families stand beside at home: the plan the family had begun, finished, or the plain round-log cabin raised.
  const own = household.house?.layout || household.house?.plan;
  const homeHouse = raised && ['round-log', 'hewn-log', 'dog-run', 'jacal'].includes(own) ? own : RAISED_PLAN;
  const first = {
    id: 'first', light: t1.light, farm: one.farm, place: `The ${one.surname} farm, ${one.where}`, when: t1.when,
    between: `${P} ${kids.length ? 'and the children walk' : 'walks'} to the nearest farm.`,
    cast: [parent?.id, ...kids.map(kid => kid.id), a1.id, a2.id, ...aKids.map(kid => kid.id)].filter(Boolean),
    lines: [
      say(a1.id, `${hello} You must be the new family on the creek. Come in, come in.`, 'greet'),
      say(parent?.id, kids.length
        ? `We are. I'm ${P}, and ${kids.length === 1 ? 'this is' : 'these are'} ${listWords(kidList)}. We've no house yet, and only my two hands to raise one.`
        : `I am. I'm ${P}. I've no house yet, and only my two hands to raise one.`),
      say(a2.id, 'Then you won\'t raise it alone. Nobody should sleep under the sky with neighbours this near.'),
      say(a1.id, `We'll come with our axes. And go and ask the ${two.plural}, ${two.where}. They have strong arms, and good hearts.`),
      ...(talker && aKids[0] ? [
        say(aKids[0].id, `Will you come back and play, ${firstName(talker)}? We have a new calf.`, 'greet'),
        say(talker.id, `If ${parentWord} says so!`, 'laugh'),
      ] : []),
      say(parent?.id, 'We\'ll come back. Thank you, both of you.', 'laugh'),
    ],
  };
  const second = {
    id: 'second', light: t2.light, farm: two.farm, place: `The ${two.surname} place, ${two.where}`, when: t2.when,
    between: `On ${two.where}, to the ${two.surname} place.`,
    cast: [parent?.id, ...kids.map(kid => kid.id), b1.id, b2.id, path.spouse.id].filter(Boolean),
    lines: [
      say(b1.id, `Welcome! Sit down and rest. ${aKids.length ? listWords(aKids.map(kid => kid.given)) : `The ${one.plural}`} ran over to say you'd be coming.`, 'greet'),
      say(parent?.id, 'Then you know why we\'ve come. I\'m asking for a day\'s help with a house.'),
      say(b2.id, `You'll have it. And you'll have ${S} too - the best hand with an axe on this creek.`),
      say(path.spouse.id, `${b2word} says that about everybody.`, 'shy'),
      say(parent?.id, 'Then I hope she\'s right about you.', 'laugh'),
      say(b2.id, `${S} hasn't taken ${spouseIs.their} eyes off you since you came through the gate.`, 'laugh'),
      say(path.spouse.id, `${b2word}!`, 'shy'),
      ...(talker ? [say(talker.id, `I like ${spouseIs.them}.`, 'speak')] : []),
      say(path.spouse.id, `I'll fetch my axe and come right behind you, ${P}.`, 'shy'),
    ],
  };
  const wedding = {
    id: 'wedding', light: t3.light, farm: 'home', house: homeHouse, place: 'Your own land', when: t3.when,
    between: 'Both families come to your land with their axes.',
    caption: raised ? cap(`${t3.by} the house you had begun is finished.`) : cap(`${t3.by} a cabin stands where you camped.`),
    cast: [parent?.id, path.spouse.id, ...kids.map(kid => kid.id), a1.id, a2.id, ...aKids.map(kid => kid.id), b1.id, b2.id, 'commissioner'].filter(Boolean),
    lines: [
      say(a1.id, 'There - walls up and the roof on. You\'ll sleep dry tonight.'),
      say(path.spouse.id, `I've worked beside you today, ${P}, and I'd gladly work beside you every day after, if you'll have me.`, 'shy'),
      say(parent?.id, 'I will.', 'laugh'),
      ...(path.rite === 'priest'
        ? [say('commissioner', 'I came up from La Bahía to say Mass in the colony, and I am glad to stay for a wedding. Make your promises before God and these witnesses.', 'read-paper')]
        : [say('commissioner', 'There is no priest in the colony to marry you. So make your promises before these witnesses, and sign the bond to be married by a priest as soon as one comes.', 'read-paper')]),
      say(path.spouse.id, `I take you, ${P}, to be my ${parentIs.spouse}, and I will keep faith with you alone.`, 'vow'),
      say(parent?.id, `I take you, ${S}, to be my ${spouseIs.spouse}, and I will keep faith with you alone.`, 'vow'),
      ...(youngest && (ageNow(world, youngest) ?? youngest.age ?? 0) >= 3 ? [
        say(youngest.id, path.rite === 'priest' ? 'Can I say it too?' : 'Can I sign too?', 'speak'),
        say('commissioner', 'You can watch, and remember it. That is what witnesses are for.', 'read-paper'),
      ] : []),
      path.rite === 'priest'
        ? say('commissioner', 'Then you are husband and wife, before the Church and your neighbours. God bless this house, and all of you in it.', 'read-paper')
        : say('commissioner', 'Then sign here, and your neighbours will sign as witnesses. You are married by bond.', 'read-paper'),
      say(b1.id, `The ${one.plural} brought cornbread and a ham, and we brought tamales. Let's eat - and somebody find the fiddle!`, 'laugh'),
    ],
    history: path.rite === 'priest'
      ? { text: TEJANO_RITE_WORDS, kind: 'documented', claimId: CLAIMS.tejanoRite }
      : { text: 'In Mexican Texas only a Catholic priest could marry a couple, and priests were few. Couples in the colonies often signed a bond like this before a local officer and witnesses, promising to be married by a priest when one came.', kind: 'documented', claimId: CLAIMS.rite },
  };
  const after = {
    id: 'after', light: t3.light, farm: 'home', house: homeHouse, place: 'Your own land', when: 'Afterwards',
    between: t3.light === 'night' || t3.when === 'Evening' ? 'The neighbours go home by lantern light.' : 'The neighbours start for home, waving.',
    cast: [parent?.id, path.spouse.id, ...kids.map(kid => kid.id)].filter(Boolean),
    lines: [
      ...(youngest && (ageNow(world, youngest) ?? youngest.age ?? 0) >= 3 ? [say(youngest.id, 'Is this our house now?', 'speak'), say(parent?.id, 'It is. Ours - all of us.', 'laugh')] : [say(parent?.id, 'Our own roof. I can hardly believe it.', 'laugh')]),
      say(path.spouse.id, `And a good one. The ${one.plural} and my family built it to last.`),
    ],
    // A lone mother's family takes the new husband's name at the wedding (owner, 2026-09-29: "His name"); a lone father's keeps his.
    closing: path.spouse.sex === 'male'
      ? `${S} is one of the family now, and ${kids.length ? `${P} and the children take` : `${P} takes`} his name. The ${two.surname} family has two parents again, a roof of its own, and two families of neighbours who will not forget this day.`
      : `${S} is one of the family now. ${household_.replace(/^the /, 'The ')} has two parents again, a roof of its own, and two families of neighbours who will not forget this day.`,
  };
  return { rite: path.rite, cast: castOf(world, household, path), scenes: [first, second, wedding, after], eldest: eldest?.id || null };
}

// ---------------------------------------------------------------- saves

/** A stored path is well formed, or why not. Absent is a family that has not taken it, which every save before today is. */
export function courtshipInvalid(world, household) {
  for (const id of household.members) {
    const visiting = world.entities[id]?.visiting;
    if (visiting !== undefined && (visiting !== true || household.courtship?.stage !== 'away')) return 'Invalid visiting marker';
  }
  const path = household.courtship;
  if (path === undefined) return null;
  if (!path || typeof path !== 'object' || !['away', 'home'].includes(path.stage) || !RITES.includes(path.rite)) return 'Invalid lone parent\'s path';
  if (!Number.isFinite(path.began) || !Number.isFinite(path.until) || path.until < path.began) return 'Invalid lone parent\'s path';
  if (!Array.isArray(path.party) || !Array.isArray(path.neighbours) || path.neighbours.length !== 2 || !Array.isArray(path.seen)) return 'Invalid lone parent\'s path';
  if (!path.spouse || typeof path.spouse.id !== 'string' || !['male', 'female'].includes(path.spouse.sex)) return 'Invalid lone parent\'s path';
  if (path.stage === 'home' && !world.entities[path.spouse.id]) return 'A married family is missing its new parent';
  if (path.stage === 'away' && world.entities[path.spouse.id]) return 'The new parent joined before the wedding';
  if (path.watched !== undefined && path.watched !== true) return 'Invalid lone parent\'s path';
  return null;
}
/** How many people a rolled family is now: what it rolled, and one more once the lone parent has married. */
export const marriedIn = household => (household.courtship?.stage === 'home' ? 1 : 0);
