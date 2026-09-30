// Who a family is, as well as where it starts: the Anglo-American family of the colonies, the Tejano family of De León's colony at
// Victoria, and the free Black family near Liberty (owner, 2026-09-29: "build all of these as possible starts except for the native
// american options ... ensure that skin tone options based on the race of the characters is locked to what is realistic"; and, of
// the Black family's start, "Free Black family"). docs/FAMILY_CREATION.md, *The family's start*, is the design and its research.
//
// **Dealt with the land, not rolled.** A family's start is where it is and who it is together: a Tejano family's land is in De
// León's colony, a free Black family's near Liberty. The land is dealt when the class is made (sim/colonies-region.mjs), before
// anybody joins, so the start is dealt with it (`dealStarts`), from the land already dealt and never from the class's own stream,
// so every crop, load and timber band after it is the draw it always was. The student learns it on the card before the dice
// (`startWords`); the dice still decide the family's size and means, as ever.
//
// **How often** (`FIC-GONZ-980`): Victoria is seated in every class, as Gonzales and Liberty are (`STARTS_SEATED`), and every family
// dealt to Victoria is Tejano - one in a class of 5 to 20, two in a class of 25 or 30; in a class of `FREE_BLACK_FROM` or more
// with two families or more at Liberty, one of Liberty's is a free Black family. Then the first of each is moved to a place among
// the first `EARLY` families to join, on its own side of the burn zone, so a class of any size that has them plays them. The rest
// are Anglo-American families, as most of the colonists of 1835 were (`HIST-TEX-011`).
//
// **What it changes, and nothing else** (`HIST-TEX-780` to `-789` for the record, `FIC-GONZ-980` to `-986` for the game's own):
//   - the names the game deals (`POOLS`), which a student may still change;
//   - the skin tones the parents may be given (`SKIN_RANGES`) - the owner's "locked to what is realistic", overlapping where
//     history had it - and so every child, who takes after the parents, and a lone parent's new husband or wife;
//   - the card that says where the family has come from, and the lines of its story (sim/start-story.mjs);
//   - a Tejano family plants corn, and its men ride with Seguín's company (sim/tejano.mjs);
//   - a free Black family is told truthfully of the law as it changed (sim/start-story.mjs).
// It never changes a hidden stat, a price, a trade, what a family may do in the core loop, or how any director treats it: nothing
// about a person is inferred from how they look or where their family came from (VISION.md §15). Held by a test that only these
// modules read a family's start (tests/starts.test.mjs).
//
// **Old classes.** A class made before this carries no `world.starts`, deals no starts, offers every skin tone to every family and
// mixes its names as it always did (sim/family.mjs `NAME_POOLS`). No save version moved.
import { SKIN } from './look-vocabulary.mjs';

/** The rule a class made since deals by, stored as `world.starts`. Absent on every class made before. */
export const STARTS_RULE = 1;
/** Who a family can be. Absent (a class made before) is none of them, and every range is offered. */
export const HERITAGES = Object.freeze(['anglo', 'tejano', 'free-black']);
/** Seated before the rest are dealt, in a class made since: Gonzales and Liberty as before, and Victoria for its Tejano family. */
export const STARTS_SEATED = Object.freeze(['gonzales', 'liberty', 'victoria']);
/** The settlement whose families are Tejano: De León's colony (`HIST-TEX-780`). */
export const TEJANO_AT = 'victoria';
/** The settlement one of whose families may be free Black: Liberty, the country of the Ashworths (`HIST-TEX-783`). */
export const FREE_BLACK_AT = 'liberty';
/** The smallest class with a free Black family: one with two families or more at Liberty, so the owner's own Liberty seat stays. */
export const FREE_BLACK_FROM = 10;
/** How early in the order students join a Tejano and a free Black family is moved: among the first six (`FIC-GONZ-980`). */
export const EARLY = 6;

/**
 * The skin tones a parent of each start may be given (owner, 2026-09-29: "locked to what is realistic"), as the first and last of
 * `SKIN`, which runs lightest to darkest. They overlap where history had it (`FIC-GONZ-981`): Anglo-American and European settlers
 * fair to tan; Tejanos, of Spanish, Mexican and Indigenous descent, light to brown; free Black Texans, many of them of African and
 * European descent both, olive to deep brown.
 */
export const SKIN_RANGES = Object.freeze({
  anglo: Object.freeze(['fair', 'tan']),
  tejano: Object.freeze(['light', 'brown']),
  'free-black': Object.freeze(['olive', 'deep brown']),
});
/** The tones of a range, lightest first. */
const toneRange = ([first, last]) => SKIN.slice(SKIN.indexOf(first), SKIN.indexOf(last) + 1);
/** The skin tones this start offers: its range, or every tone for a family with no start (a class made before). */
export const skinChoices = heritage => (SKIN_RANGES[heritage] ? toneRange(SKIN_RANGES[heritage]) : SKIN);
/** The start of the family this person belongs to, or undefined. */
export const heritageOf = (world, entity) => world?.households?.[entity?.householdId]?.heritage;

/**
 * The names the game deals a family of each start (`FIC-GONZ-982`): twenty to a role, so a family of eighteen children never repeats
 * one. Invented placeholders on the terms of `FIC-GONZ-001` and `-017` - not the names of real colonists, and no register was matched
 * - chosen from given names common in the records of the period (`HIST-TEX-786`). A free Black family is dealt from the Anglo-American
 * pools, as the free Black Texans of the record were named (Aaron, Abner, Moses, William, Greenbury, Hendrick), on a deck of its own.
 */
export const POOLS = Object.freeze({
  anglo: Object.freeze({
    father: Object.freeze(['Thomas', 'Asa', 'Ezra', 'Caleb', 'Amos', 'Elias', 'Jethro', 'Hollis', 'Barnabas', 'Alvin',
      'Josiah', 'Silas', 'Nathan', 'Reuben', 'Jesse', 'Isaac', 'Samuel', 'Joel', 'Benjamin', 'Wiley']),
    mother: Object.freeze(['Sarah', 'Patience', 'Lucinda', 'Mahala', 'Rhoda', 'Keziah', 'Temperance', 'Charity', 'Almira', 'Drusilla',
      'Elizabeth', 'Nancy', 'Polly', 'Rebecca', 'Martha', 'Susannah', 'Mary', 'Hannah', 'Jane', 'Priscilla']),
    daughter: Object.freeze(['Delia', 'Effie', 'Winnie', 'Adela', 'Minerva', 'Lavinia', 'Orpha', 'Prudence', 'Docia', 'Sally',
      'Emily', 'Eliza', 'Harriet', 'Louisa', 'Ruth', 'Abigail', 'Matilda', 'Lydia', 'Frances', 'Clarissa']),
    son: Object.freeze(['Simeon', 'Jonas', 'Eli', 'Hiram', 'Obed', 'Levi', 'Zadok', 'Jasper', 'Enos', 'Micajah',
      'Joseph', 'Henry', 'George', 'Andrew', 'Daniel', 'Moses', 'Aaron', 'Peter', 'Noah', 'Calvin']),
  }),
  tejano: Object.freeze({
    father: Object.freeze(['José', 'Juan', 'Manuel', 'Francisco', 'Antonio', 'Ignacio', 'Nicolás', 'Bartolo', 'Feliciano', 'Ramón',
      'Vicente', 'Anselmo', 'Cipriano', 'Gregorio', 'Trinidad', 'Pedro', 'Miguel', 'Luis', 'Rafael', 'Santiago']),
    mother: Object.freeze(['María', 'Josefa', 'Manuela', 'Refugia', 'Antonia', 'Dorotea', 'Ysabel', 'Bernarda', 'Serafina', 'Paz',
      'Juana', 'Gertrudis', 'Concepción', 'Guadalupe', 'Rafaela', 'Francisca', 'Teresa', 'Luisa', 'Micaela', 'Encarnación']),
    daughter: Object.freeze(['Rosa', 'Paulita', 'Chana', 'Loreta', 'Marcela', 'Petra', 'Soledad', 'Tomasa', 'Nieves', 'Benita',
      'Ramona', 'Carmen', 'Luz', 'Dolores', 'Juanita', 'Candelaria', 'Catarina', 'Inés', 'Pilar', 'Rita']),
    son: Object.freeze(['Mateo', 'Teodoro', 'Andrés', 'Basilio', 'Pablo', 'Marcos', 'Cayetano', 'Rufino', 'Silvano', 'Emeterio',
      'Ruperto', 'Tomás', 'Julián', 'Agustín', 'Diego', 'Lorenzo', 'Fermín', 'Ambrosio', 'Jesús', 'Alejo']),
  }),
});
/** The pools a family of this start is dealt from, or null for a family with no start (sim/family.mjs deals the mixed pools). */
export const poolsFor = heritage => (heritage === 'tejano' ? POOLS.tejano : heritage === 'anglo' || heritage === 'free-black' ? POOLS.anglo : null);
/** The deck a family of this start is shuffled on: a free Black family's is its own, so it is not dealt the Anglo family's names beside it. */
export const deckFor = heritage => (heritage === 'free-black' ? 'free-black' : heritage || '');

/** FNV-1a and a small xorshift stream, from the land already dealt, never the class's own stream. */
function streamOf(text) {
  let state = 2166136261;
  for (const char of String(text)) state = Math.imul(state ^ char.charCodeAt(0), 16777619);
  state ||= 1;
  return () => { state ^= state << 13; state ^= state >>> 17; state ^= state << 5; return (state >>> 0) / 4294967296; };
}

/**
 * Who each dealt family is, and the first Tejano and free Black family moved early in the order students join (`FIC-GONZ-980`).
 *
 * `places` is the land dealt, one a family in the order students join ({ x, y, settlementId }); it is reordered in place, and
 * only by exchanging two families on the same side of the burn zone (`sideOf`, null where there is none), so every family's land
 * and every side the zone deals are kept - only which family, of those on a side, holds which land. Returns the start of each.
 */
export function dealStarts(places, { sideOf = null } = {}) {
  const own = streamOf(`starts:${JSON.stringify(places)}`);
  const starts = places.map(place => (place.settlementId === TEJANO_AT ? 'tejano' : 'anglo'));
  const liberty = places.map((place, i) => (place.settlementId === FREE_BLACK_AT ? i : -1)).filter(i => i >= 0);
  if (places.length >= FREE_BLACK_FROM && liberty.length >= 2) starts[liberty[Math.floor(own() * liberty.length)]] = 'free-black';
  const side = i => (sideOf ? sideOf(places[i]) : true);
  for (const kind of ['tejano', 'free-black']) {
    const at = starts.indexOf(kind);
    if (at < 0 || at < EARLY) continue;
    const early = [];
    for (let i = 0; i < Math.min(EARLY, places.length); i++) if (starts[i] === 'anglo' && side(i) === side(at)) early.push(i);
    if (!early.length) continue;
    const to = early[Math.floor(own() * early.length)];
    [places[to], places[at]] = [places[at], places[to]];
    [starts[to], starts[at]] = [starts[at], starts[to]];
  }
  return starts;
}

/** The colony each start's land lies in, as the card says it (`HIST-TEX-011`, `-013`, `-780`). */
const COLONY = Object.freeze({
  'san-felipe': "Austin's colony", columbia: "Austin's colony", matagorda: "Austin's colony", mina: "Austin's colony",
  gonzales: "DeWitt's colony", liberty: 'the Galveston Bay and Texas Land Company grant', victoria: "De León's colony",
});

/**
 * Who the family is and where it has come from, in the words of the card before the dice (public/creation.js), or null in a class
 * that deals no starts. Short, plain and true: each sentence is the record's (`HIST-TEX-780`, `-783`, `-784`) or plainly the game's.
 */
export function startProjection(world, household) {
  if (!world?.starts || !household?.heritage) return null;
  const town = world.map.sites[household.settlementId]?.name || 'the settlement';
  const colony = COLONY[household.settlementId];
  const where = colony ? `near ${town}, in ${colony}` : `near ${town}`;
  if (household.heritage === 'tejano') {
    return {
      heritage: 'tejano', kicker: 'A TEJANO FAMILY', title: 'A Tejano family',
      lead: `Autumn 1835. Your family is Tejano: Mexican Texans. You are taking up land of your own ${where}, the one colony in Texas settled mostly by Mexican families. Its people farm and raise horses and cattle.`,
      claimId: 'HIST-TEX-780',
    };
  }
  if (household.heritage === 'free-black') {
    return {
      heritage: 'free-black', kicker: 'A FREE BLACK FAMILY', title: 'A free Black family',
      lead: `Autumn 1835. Your family is free and Black. You have come west from Louisiana to land of your own ${where}, as the Ashworths did a few years before you. Under Mexico's laws a free Black family may own land like any other. Not every neighbour is glad you came.`,
      claimId: 'HIST-TEX-783',
    };
  }
  return {
    heritage: 'anglo', kicker: 'A SETTLER FAMILY', title: 'Settlers from the United States',
    lead: `Autumn 1835. Your family has come from the United States to land of its own ${where}. Texas is part of Mexico, and most of its new settlers, like you, came from the United States.`,
    claimId: 'HIST-TEX-011',
  };
}

/** A start that could not have been dealt, or null (sim/world.mjs `validateWorld`). */
export function startsInvalid(world) {
  if (world.starts !== undefined && world.starts !== STARTS_RULE) return 'Invalid starts rule';
  for (const household of Object.values(world.households || {})) {
    if (household.heritage === undefined) continue;
    if (!world.starts || !HERITAGES.includes(household.heritage)) return 'Invalid family start';
    if (household.heritage === 'tejano' && household.settlementId !== TEJANO_AT) return 'A Tejano family starts in De León\'s colony';
    if (household.heritage === 'free-black' && household.settlementId !== FREE_BLACK_AT) return 'A free Black family starts near Liberty';
  }
  return null;
}
