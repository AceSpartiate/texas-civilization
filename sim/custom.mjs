// Men's work and women's work: "Custom, necessity opens" (owner, 2026-10-03; docs/CUSTOMARY_WORK.md).
//
// > "also, work was usually gender specific. we should incorporate that in a historically accurate yet reasonable for a game way."
//
// The owner's answers, by multiple choice: each work is men's, women's or shared; the other sex's work is greyed while somebody of
// the customary sex, sixteen or over, is at home and able, and **opens on its own** when every such person is away, sick or dead -
// with one line in the family's story the first time it opens for somebody ("With James gone to the army, Martha took up the axe.").
// Cattle on horseback are the men's and boys' of twelve and over, a woman's only when no man is at home; the hogs and the milking
// are everybody's. **Amended 2026-10-04** (the owner: "none, they only appear if the correct gender isn't around to do it"): the
// other sex's work is not on a person's bar at all while somebody of its custom is home - not greyed - and appears, lit, when it opens.
//
// **One table and one rule, here.** `CUSTOM` names every work that has a custom; everything else - the field, the town, the water,
// the hogs, the cow, the road east and the Scrape, the children's own works - is shared and never asked. `customRefusal` is read
// by sim/chores.mjs `choreAvailability`, the one gate every order passes (a student's hand, auto, the director's families, the
// guided start), so nothing else needs to know the rule exists.
//
// - **Who keeps the custom**: a man (or a woman) of the family of sixteen or over - `FIGHTS_FROM_AGE`, the age a grown son answers
//   for the family - or a parent of the founding four, who have no stated age. A boy of ten to fifteen follows the men's work and a
//   girl the women's, but **nobody under sixteen keeps it for anybody else**: a mother with a son of fourteen and her husband at the
//   war may take up the axe beside the boy.
// - **At home and able** (`keeps`): on the family's own land - standing there, or out on a work of the place (the creek, the
//   timber, the range) that comes home by itself - and not dead, taken, very sick, sick, or lying wounded. **Away** is a journey (to
//   town, to the war, upriver), serving with any force or held its prisoner (only then: a man sent for or deserted and home keeps
//   it, owner 2026-10-04, `withTheArmy`), helping where a call sent them, visiting at the neighbours'.
// - **Help, not lead; children keep house** (owner, 2026-10-04; docs/CUSTOMARY_WORK.md §1c, §2b, §4b): `helpsWhom` and `childKeeps`.
//   Deliberately *not* away: being called aside by the little ones (sim/aside.mjs). The brief that came with the owner's request
//   counted it, and it was left out: a father holding a crying baby for twenty minutes does not open the axe to the mother, and
//   the work would flicker on and off the bar with every cry.
// - **A father coming home mid-job**: the work in hand is finished. The rule is asked only when a work is begun or joined; a
//   woman on auto at the felling when he rides in finishes that tree, and her next is refused, so she keeps house instead
//   (sim/auto.mjs). ceiling: a job is never stopped by a man's return; a long job begun by necessity runs to its end. Worth undoing
//   only if a student finds a mother clearing ten acres beside a husband who has been home a week.
// - **Never anybody but the family's own people.** The custom of free white and Tejano households, and the neighbours' custom read
//   for free Black families (`FIC-GONZ-1152`, reconstructed), is applied to a family's members and to nobody else. **Enslaved
//   people's labour ignored it entirely** - enslaved women worked the fields, felled and hauled (`HIST-TEX-1153`) - so the game
//   must never apply this table to an enslaved worker; none is ever a family's member or given work (VISION.md §15,
//   sim/means.mjs), and `customApplies` refuses anybody who is not a family member of a household, as a guard for the day one is.
// - **Fighting, enlisting and voting are not here**: they are the men's and never open (sim/family.mjs `canFight`, sim/winter.mjs).
//
// Every rule's history is in HISTORY.md: `HIST-TEX-1150` to `-1153`; the game's choices `FIC-GONZ-1150` to `-1152`.
import { record } from './events.mjs';
import { FIGHTS_FROM_AGE, sexOf } from './family.mjs';

export const CLAIMS = Object.freeze({ rule: 'FIC-GONZ-1150', opened: 'FIC-GONZ-1151', reconstructed: 'FIC-GONZ-1152', childrenKeep: 'FIC-GONZ-1158', help: 'FIC-GONZ-1159' });

/**
 * Every work with a custom: `[whose, the work as the refusal says it, what taking it up by necessity is called]`. Everything not
 * here is shared. The third is said after the person's name in the opening line ("Martha took up the axe").
 */
export const CUSTOM = Object.freeze({
  // The men's: the axe, the rifle, breaking and fencing ground, building, the well, the beef.
  'survey-plot': ['men', 'Surveying', 'paced out the ground {self}'],
  'cut-lane': ['men', 'Cutting the lane', 'took up the axe'],
  'fence-yard': ['men', 'Splitting rails', 'split the rails {self}'],
  'fence-plot': ['men', 'Splitting rails', 'split the rails {self}'],
  'dig-well': ['men', 'Digging the well', 'took up the spade'],
  'clear-plot': ['men', 'Clearing ground', 'set to clearing the ground {self}'],
  'build-house': ['men', 'Building', 'went to work on the house {self}'],
  'help-raise': ['men', 'Raising walls', 'went to the raising {self}'],
  'fell-trees': ['men', 'Felling', 'took up the axe'],
  'haul-logs': ['men', 'Hauling logs', 'hauled the logs {self}'],
  'fetch-logs': ['men', 'Fetching logs', 'went for the logs {self}'],
  'make-carreta': ['men', 'Making a carreta', 'took up the tools'],
  'make-furniture': ['men', 'Carpentry', 'took up the tools'],
  'hunt-timber': ['men', 'Hunting', 'took up the rifle'],
  'hunt-land': ['men', 'Hunting', 'took up the rifle'],
  'take-small-game': ['men', 'Hunting small game', 'took up the rifle'],
  'practise-shooting': ['men', 'Shooting at the mark', 'took up the rifle'],
  'cut-bee-tree': ['men', 'Cutting a bee tree', 'took up the axe'],
  'butcher-beef': ['men', 'Killing a beef', 'killed the beef {self}'],
  // The women's: the house, the garden, the wash and the sick (sim/housework.mjs, sim/disease.mjs).
  'keep-house': ['women', 'Keeping house', 'kept the house {self}'],
  'work-garden': ['women', 'The kitchen garden', 'worked the garden {self}'],
  'wash-clothes': ['women', 'The wash', 'did the wash {self}'],
  'nurse-home': ['women', 'Nursing', 'sat up with the sick {self}'],
});
/** Cattle worked on the range, which is part of *Ride the range after the stock* (sim/stock.mjs): the hogs are everybody's. */
export const CATTLE = Object.freeze(['men', 'Working the cattle', 'rode out after the cattle {self}']);

/** Whose a work is by custom: 'men', 'women' or 'shared'. */
export const customOf = choreId => CUSTOM[choreId]?.[0] || 'shared';
const SEX_OF = Object.freeze({ men: 'male', women: 'female' });
const WORD_OF = Object.freeze({ male: 'men', female: 'women' });

/** Whether the custom is asked of this person at all: a member of the family the work is asked for, never anybody else. */
export const customApplies = (household, entity) => Boolean(household && entity?.kind === 'person' && entity.householdId === household.id
  && household.members?.includes(entity.id) && sexOf(entity));

/** Grown, for keeping the custom: sixteen or over, or a parent of the founding four, whose ages the game does not know. */
export function grownForCustom(entity) {
  if (Number.isFinite(entity?.age)) return entity.age >= FIGHTS_FROM_AGE;
  return ['father', 'mother'].includes(entity?.kin?.role);
}

/**
 * Whether this person is somewhere the work can be taken from them: on the family's land, standing there or out on a work of the
 * place. `homeWork` is asked of the work in hand (sim/chores.mjs passes it), so this module never imports the chore table.
 */
function atHome(household, entity, homeWork) {
  if (entity.visiting || entity.task === 'help') return false;
  if (withTheArmy(entity)) return false;
  if (entity.chore && homeWork?.(entity.chore.id)) return true;
  return !entity.travel && entity.location?.siteId === household.homeSiteId;
}
/**
 * With the army only while serving, or held a prisoner (owner, 2026-10-04, BALANCE.md §23 issue 6, "only while serving"): a man sent
 * for (`released`) or who deserted keeps his `service` record for the land and the glory (sim/winter.mjs `recallFromService`), and
 * until 2026-10-04 any record at all counted him away for good - his wife had the men's work beside him for the rest of the class.
 */
export const withTheArmy = entity => ['serving', 'prisoner'].includes(entity?.service?.status);
/** Able to do the family's work: not gone, not sick, not lying wounded. A tired or slightly hurt man still keeps the custom. */
const able = entity => !['dead', 'captured', 'sick', 'wounded'].includes(entity.health?.condition) && !entity.health?.grave
  && entity.service?.status !== 'prisoner';

/** The family's grown people of this sex who keep the custom now: at home and able. Father and mother first, then eldest first. */
export function keepers(world, household, sex, homeWork = null) {
  return grownOf(world, household, sex).filter(person => able(person) && atHome(household, person, homeWork));
}
/** The family's grown people of this sex, living or not: father and mother first, then eldest first. */
function grownOf(world, household, sex) {
  const rank = person => (['father', 'mother'].includes(person.kin?.role) ? -1 : -(person.age ?? 0));
  return household.members.map(id => world.entities[id]).filter(person => person?.kind === 'person' && sexOf(person) === sex && grownForCustom(person))
    .sort((a, b) => rank(a) - rank(b));
}

const names = people => (people.length === 1 ? people[0].given || people[0].name
  : people.length === 2 ? `${people[0].given || people[0].name} and ${people[1].given || people[1].name}`
  : `${people[0].given || people[0].name} and the others`);

/**
 * Why this person may not take up this work by custom, in the control's words, or null. `custom` is the table's row (or `CATTLE`).
 * "Felling is men's work, and James is at home."
 */
export function customWhy(world, household, entity, row, homeWork = null) {
  if (!row || !customApplies(household, entity)) return null;
  const [whose, work] = row;
  const sex = SEX_OF[whose];
  if (sexOf(entity) === sex) return null;
  const home = keepers(world, household, sex, homeWork).filter(person => person.id !== entity.id);
  if (!home.length) return null;
  return `${work} is ${saysOf(whose, home)}`;
}
/** The words after the work's name: "men's work, and James is at home." */
const saysOf = (whose, home) => `${whose}'s work, and ${names(home)} ${home.length === 1 ? 'is' : 'are'} at home.`;
/**
 * The refusal for a work of the table, or null. A child of seven or more keeping house or doing the wash for a lone parent is not
 * refused (`childKeeps`).
 */
export const customRefusal = (world, household, entity, choreId, homeWork = null) => (childKeeps(world, household, entity, choreId, homeWork) ? null
  : customWhy(world, household, entity, CUSTOM[choreId], homeWork));

// ---------------------------------------------------------------------------------------------------- children keep house

/**
 * **Children keep house** (owner, 2026-10-04, BALANCE.md §23 issue 2: a lone parent doing both customs fell behind). Keeping house
 * and the wash may be done by a child of the family of `CHILD_KEEPS_FROM` (seven) or more, of either sex, **whenever only one custom
 * is kept at home** - no grown man at home and able (a lone mother, or a mother whose husband is at the war or in town: she has the
 * men's work to do), or no grown woman (a lone father). In a family with both at home the children of seven to nine keep their own
 * works (the water, the eggs) and the boys of ten to fifteen are held from the women's work as before. The garden stays the women's.
 * The house a child keeps saves what that child's own housework saves (sim/family.mjs `housekeepingSaving`: a hidden trait that grows
 * with age, so a child of eight saves little); the wash a child does cleans as anybody's does. `FIC-GONZ-1158`.
 * ceiling: the saving is the child's own, never the parent's - a lone mother who wants the most from the house keeps it herself.
 * Worth undoing only if the owner wants a child's keeping house to count as the parent's.
 */
export const CHILDREN_KEEP = Object.freeze(['keep-house', 'wash-clothes']);
export const CHILD_KEEPS_FROM = 7;
/** Whether the family's children keep house now: nobody of one custom or the other, sixteen or over, is at home and able. */
export const childrenKeepHouse = (world, household, homeWork = null) => !keepers(world, household, 'male', homeWork).length || !keepers(world, household, 'female', homeWork).length;
/** Whether this child may keep house or do the wash now, for a lone parent (`CHILDREN_KEEP`). */
export function childKeeps(world, household, entity, choreId, homeWork = null) {
  if (!CHILDREN_KEEP.includes(choreId) || !customApplies(household, entity)) return false;
  if (!Number.isFinite(entity.age) || entity.age < CHILD_KEEPS_FROM || entity.age >= FIGHTS_FROM_AGE) return false;
  return childrenKeepHouse(world, household, homeWork);
}

// ---------------------------------------------------------------------------------------------------- help, not lead

/**
 * **Help, not lead** (owner, 2026-10-04, BALANCE.md §23 issues 1 and 5: one man did all the men's work while the women and girls stood
 * by, and one woman all the women's while the men did). Women and girls of `HELPS_FROM_AGE` (ten) or more may **join** men's work a man
 * or boy of the family is already at, and men and boys of ten or more women's work a woman or girl is already at - adding their hands
 * the way any more hands speed work (sim/hands.mjs) - and **never begin it**: while somebody of its custom is at home, the work is on
 * their bar only while one of that custom is at it, as a way to help, and it leaves when he does (sim/chores.mjs `helpLead`).
 * As at the record's house-raisings and log-rollings, and the women of the colonies in the field beside the men (`HIST-TEX-1151`):
 * `FIC-GONZ-1159`. Only work that more hands speed (a `crew` in sim/chores.mjs); not the hunt, the survey or the range.
 */
export const HELPS_FROM_AGE = 10;
const oldEnoughToHelp = entity => (Number.isFinite(entity?.age) ? entity.age >= HELPS_FROM_AGE : ['father', 'mother'].includes(entity?.kin?.role));
/**
 * Whom this person would help at this work across the custom, or null: the first of `atIt` (everybody of the family at the work now,
 * which sim/chores.mjs passes) who is of the work's own custom and not himself helping across it. Asked only once the custom has
 * refused this person the work.
 */
export function helpsWhom(world, household, entity, choreId, atIt) {
  const row = CUSTOM[choreId];
  if (!row || !customApplies(household, entity) || !oldEnoughToHelp(entity)) return null;
  const sex = SEX_OF[row[0]];
  if (sexOf(entity) === sex) return null;
  return atIt.find(person => person.id !== entity.id && sexOf(person) === sex && !person.chore?.helping) || null;
}

/**
 * Whether this person is taking this work up *by necessity* now: of the other sex to it, and allowed only because nobody of its sex
 * is at home and able. Null when it is their own work or shared.
 */
export function byNecessity(world, household, entity, row, homeWork = null) {
  if (!row || !customApplies(household, entity)) return null;
  const sex = SEX_OF[row[0]];
  if (sexOf(entity) === sex) return null;
  return keepers(world, household, sex, homeWork).some(person => person.id !== entity.id) ? null : row;
}

/** Why one grown person of the custom is not here, as the opening line says it: "gone to the army", "in town", "dead". */
function goneWords(world, household, person, journeyOf) {
  const health = person.health?.condition;
  if (health === 'dead') return ['dead', 'dead'];
  if (health === 'captured' || person.service?.status === 'prisoner') return ['taken', 'a prisoner'];
  if (person.health?.grave || health === 'sick') return ['sick', 'down sick'];
  if (health === 'wounded') return ['wounded', 'lying wounded'];
  if (withTheArmy(person)) return ['army', 'gone to the army'];
  if (person.visiting) return ['visiting', "away at the neighbours'"];
  if (person.task === 'help') return ['help', 'away with the volunteers'];
  const going = journeyOf?.(person);
  if (going === 'war') return ['army', 'gone to the army'];
  // An errand to town, or simply gone to (or standing in) a town: "gone to town".
  const place = world.map?.sites?.[person.travel?.to || person.location?.siteId];
  if (going === 'town' || place?.kind === 'town') return ['town', 'gone to town'];
  return ['away', 'away'];
}

/**
 * Write the opening line, once for each circumstance (owner, 2026-10-03: "With James gone to the army, Martha took up the axe."):
 * called by sim/chores.mjs `beginChore` when anybody begins or joins work. Said again only when the reason changes - James home
 * from town and gone to the army is a new line; his second trip to town is not. Kept on the person (`necessity`, by custom), absent
 * on every class saved before, which reads as never said.
 */
export function noteNecessity(world, household, entity, choreId, { row = CUSTOM[choreId], homeWork = null, journeyOf = null } = {}) {
  const opened = byNecessity(world, household, entity, row, homeWork);
  if (!opened) return null;
  const [whose, , took] = opened;
  const sex = SEX_OF[whose];
  const grown = grownOf(world, household, sex).filter(person => person.id !== entity.id);
  const reasons = grown.map(person => [person, goneWords(world, household, person, journeyOf)]);
  const key = reasons.length ? reasons.map(([person, [why]]) => `${person.id}:${why}`).join(',') : 'none';
  entity.necessity ??= {};
  if (entity.necessity[whose] === key) return null;
  entity.necessity[whose] = key;
  const self = sexOf(entity) === 'female' ? 'herself' : 'himself';
  const said = reasons.length === 0 ? `With no ${sex === 'male' ? 'grown man' : 'grown woman'} in the family`
    : reasons.length === 1 ? `With ${reasons[0][0].given || reasons[0][0].name} ${reasons[0][1][1]}`
    : reasons.every(([, [why]]) => why === reasons[0][1][0]) ? `With ${names(reasons.map(([person]) => person))} ${reasons[0][1][1]}`
    : `With ${reasons.slice(0, 2).map(([person, [, words]]) => `${person.given || person.name} ${words}`).join(' and ')}${reasons.length > 2 ? ' and the others away' : ''}`;
  const text = `${said}, ${entity.given || entity.name} ${took.replace('{self}', self)}.`;
  record(world, 'consequence', { actorId: entity.id, householdId: household.id, importance: 2, classification: 'FICTIONAL FOR GAMEPLAY', claimId: CLAIMS.opened, text });
  return text;
}

/** The custom a person follows, for the page's words: 'men' or 'women', or null for somebody the custom is never asked of. */
export const customSide = entity => WORD_OF[sexOf(entity)] || null;

/** A saved opening that cannot be, or null. Absent on every class saved before 2026-10-03, which reads as never said. */
export function customInvalid(world) {
  for (const person of Object.values(world.entities || {})) {
    const seen = person.necessity;
    if (seen === undefined) continue;
    if (!seen || typeof seen !== 'object' || Array.isArray(seen) || Object.entries(seen).some(([whose, key]) => !['men', 'women'].includes(whose) || typeof key !== 'string')) return 'Invalid custom';
  }
  return null;
}
