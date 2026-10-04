// The women's own work: keeping house, the kitchen garden, and the wash (owner, 2026-10-03; docs/CUSTOMARY_WORK.md §4-6).
//
// > "keep house, garden, wash clothes. if a family member goes to town/war/away then other npc's should have negative comments
// > about their smell, higher than normal prices, etc unless a woman has been washing clothes."
//
// Three works on the one chore table (`registerHousework`, called from sim/world.mjs as the milking is), each customarily the
// women's (sim/custom.mjs: a man takes it up only when no woman of sixteen or over is at home and able), each once a day for the
// family, and each a thing a student can see:
//
// | Work | What it does | Where it is drawn |
// | --- | --- | --- |
// | `keep-house` Keep house | The hidden housekeeping saving (sim/family.mjs `housekeepingSaving`) **comes from somebody who kept house**: the best housework of whoever kept it today or yesterday, and nothing if nobody did. Until 2026-10-03 it came from the best housekeeper standing at home, whatever they were doing. | At the front of the house: cooking at the hearth, sewing and mending, sweeping out. |
// | `work-garden` Work the garden | A kitchen garden beside the house, laid out the first day and worked after: `GARDEN_FOOD` food a day in its season, `GARDEN_WINTER` in the winter months. A real source of food (docs/HUNGER.md §10). | The beds beside the house, drawn once laid out, green in season. |
// | `wash-clothes` Wash clothes | Everybody of the family at home has clean clothes for `CLEAN_DAYS`. Away from home with dirty clothes - in town, at the war, at the neighbours' - the people met say so (`REMARKS`), and the shops ask more and pay less (`DEARER`, `CHEAPER`). | In the yard: water carried up, the wash boiled with lye soap, beaten on the bench and hung on the fence. |
//
// The history is in HISTORY.md (`HIST-TEX-1150` to `-1154`); every number here is the game's (`FIC-GONZ-1153` to `-1157`): no source
// gives a frontier family's garden by the day, how long a shirt stays clean, or what a storekeeper charged a dirty customer. **The
// smell and the prices are an invention for play** (`FIC-GONZ-1155`, `-1156`), the owner's, and the game says so in its docs.
import { choreAvailability, homeWork, registerChores } from './chores.mjs';
import { record } from './events.mjs';
import { housekeepingSaving, tooYoung } from './family.mjs';
import { childKeeps, withTheArmy } from './custom.mjs';
import { calledAside } from './aside.mjs';
import { dateOf } from './clock.mjs';
import { holdingOf } from './grants.mjs';
import { stirredShare } from './shares.mjs';

export const CLAIMS = Object.freeze({ house: 'FIC-GONZ-1153', garden: 'FIC-GONZ-1154', remarks: 'FIC-GONZ-1155', prices: 'FIC-GONZ-1156', wash: 'FIC-GONZ-1157', washFor: 'FIC-GONZ-1160' });
const DAY = 1440;
const dayOf = (world, minute = world.minute) => Math.floor((minute || 0) / DAY);
const round = value => Math.round(value * 10000) / 10000;
const nameOf = person => person?.given || person?.name || 'somebody';

// ---------------------------------------------------------------------------------------------------- keeping house

/** A house kept today keeps the family's food the rest of today and tomorrow: the saving reads the last `KEPT_DAYS` days. */
export const KEPT_DAYS = 2;
/** Whoever kept house within `KEPT_DAYS` days, as a list (empty when nobody did): the people the saving is read from. */
export function keptBy(world, household) {
  const kept = household?.housekept;
  if (!kept || !Number.isInteger(kept.day) || dayOf(world) - kept.day >= KEPT_DAYS) return [];
  const person = world.entities[kept.by];
  return person && person.health?.condition !== 'dead' ? [person] : [];
}
/**
 * How much longer the family's food lasts today for the house being kept (sim/routines.mjs, sim/hunger.mjs): the hidden saving of
 * sim/family.mjs, read from whoever kept house and from nobody else. Hidden: no control states it (`FIC-GONZ-021`).
 */
export const houseSaving = (world, household) => housekeepingSaving(keptBy(world, household));
/** Whether the house has been kept today. */
export const keptToday = (world, household) => household?.housekept?.day === dayOf(world);

function keepHouse(world, household, entity) {
  household.housekept = { day: dayOf(world), by: entity.id };
  record(world, 'consequence', { actorId: entity.id, householdId: household.id, importance: 1, classification: 'FICTIONAL FOR GAMEPLAY', claimId: CLAIMS.house,
    text: `${entity.name} kept house: the cooking, the mending and the sweeping done, and the food made to go further.` });
}

// ---------------------------------------------------------------------------------------------------- the kitchen garden

/** What a day in the garden brings in, in its season, and in the winter months (the greens and turnips): `FIC-GONZ-1154`. */
export const GARDEN_FOOD = 0.3, GARDEN_WINTER = 0.1;
/** The winter months, 0-based: December to February, on the real land; the invented country's one September never reaches them. */
const GARDEN_WINTER_MONTHS = Object.freeze([11, 0, 1]);
export const gardenSeason = world => (world?.map?.source && GARDEN_WINTER_MONTHS.includes(dateOf(world, world.minute).getUTCMonth()) ? 'winter' : 'growing');
/** Where the garden lies: beside the house to the east, clear of the yard by the door, inside the family's own land. */
export function gardenPlace(world, household) {
  const site = world.map.sites[household.homeSiteId];
  if (!site) return null;
  let x = site.x + 0.045, y = site.y + 0.012;
  const bounds = holdingOf(world, household)?.bounds;
  if (bounds && [bounds.minX, bounds.maxX, bounds.minY, bounds.maxY].every(Number.isFinite)) {
    if (x > bounds.maxX - 0.01) x = site.x - 0.06;
    x = Math.min(Math.max(x, bounds.minX + 0.01), bounds.maxX - 0.01);
    y = Math.min(Math.max(y, bounds.minY + 0.01), bounds.maxY - 0.01);
  }
  return { x: round(x), y: round(y) };
}
/** Whether the garden has been worked today: once a day for the family, by whoever. */
export const gardenedToday = (world, household) => household?.garden?.worked === dayOf(world);

function workGarden(world, household, entity) {
  const day = dayOf(world);
  if (!household.garden) {
    const at = gardenPlace(world, household);
    household.garden = { ...at, laid: day, worked: day };
    record(world, 'property', { actorId: entity.id, householdId: household.id, importance: 2, classification: 'FICTIONAL FOR GAMEPLAY', claimId: CLAIMS.garden,
      text: `${entity.name} laid out a kitchen garden beside the house. It will give a little every day it is worked, from tomorrow.` });
    return;
  }
  household.garden.worked = day;
  if (household.garden.laid === day) return;
  const amount = gardenSeason(world) === 'winter' ? GARDEN_WINTER : GARDEN_FOOD;
  household.resources.food = round((household.resources.food ?? 0) + amount);
  record(world, 'consequence', { actorId: entity.id, householdId: household.id, importance: 1, classification: 'FICTIONAL FOR GAMEPLAY', claimId: CLAIMS.garden,
    text: gardenSeason(world) === 'winter' ? `${entity.name} worked the garden and brought in greens and turnips: ${amount} food.` : `${entity.name} worked the garden and brought in what was ready: ${amount} food.` });
}

// ---------------------------------------------------------------------------------------------------- the wash

/** Clothes washed within this many days are clean: a weekly wash day (owner, 2026-10-04, "Weekly wash day"; `FIC-GONZ-1157`, after `HIST-TEX-1152`). Eight until then. */
export const CLEAN_DAYS = 7;
/** The wash is not done again within this many days: once a week, exactly (owner, 2026-10-04). Four until then. */
export const WASH_AGAIN_DAYS = 7;
/** What a shop asks a customer whose clothes want washing, and what it pays one (`FIC-GONZ-1156`): a quarter more, a fifth less. */
export const DEARER = 1.25, CHEAPER = 0.8;

/**
 * The day this person's clothes were last washed: written when the family's wash is done with them at home (`washed`). Absent on
 * everybody of a class saved before 2026-10-03, and on everybody before the family's first wash: read as the day the class was first
 * stepped after it opened (`world.washBase`, written once by `advanceWash`), so an old class opens with everybody clean and no save
 * version moves.
 */
export const washedDay = (world, person) => (Number.isInteger(person?.washed) ? person.washed : Number.isInteger(world.washBase) ? world.washBase : dayOf(world));
/** Whether this person's clothes want washing: more than `CLEAN_DAYS` since they were. */
export const dirty = (world, person) => person?.kind === 'person' && Boolean(person.householdId) && dayOf(world) - washedDay(world, person) >= CLEAN_DAYS;
/** Days since the family's last wash, or null for none yet. */
const sinceWash = (world, household) => (Number.isInteger(household?.washDay) ? dayOf(world) - household.washDay : null);

/** Everybody whose clothes are here: at home, or out on a work of the place that comes home by itself. Not anybody away. */
const clothesHere = (world, household) => household.members.map(id => world.entities[id]).filter(person => person && person.health?.condition !== 'dead'
  && (person.chore && homeWork(person.chore.id) ? true : !person.travel && person.location?.siteId === household.homeSiteId) && !withTheArmy(person) && !person.visiting);
/**
 * **The wash for whoever's dirty** (owner, 2026-10-04, BALANCE.md §23 issue 4, "Wash whoever's dirty": the one sent to town was the one
 * away on wash day, and the family might not wash again for a week). Whether this person's clothes want the wash now: dirty, or away
 * when the family's last wash day was done, so they missed it. `FIC-GONZ-1160`.
 */
export const wantsWash = (world, household, person) => dirty(world, person)
  || (Number.isInteger(household?.washDay) && washedDay(world, person) < household.washDay);
/** Whoever at home wants the wash now (`wantsWash`): the people a wash before the week is out is done for. */
export const washWanted = (world, household) => clothesHere(world, household).filter(person => wantsWash(world, household, person));

function washClothes(world, household, entity) {
  const day = dayOf(world);
  const since = sinceWash(world, household);
  // Wash day, the weekly one, for everybody at home; before the week is out, only for whoever wants it - and the weekly day stays
  // where it was, so the household's rhythm is the week's (owner, 2026-10-04: "Wash whoever's dirty").
  const weekly = since === null || since >= WASH_AGAIN_DAYS;
  const here = weekly ? clothesHere(world, household) : washWanted(world, household);
  if (weekly) household.washDay = day;
  for (const person of here) person.washed = day;
  const whose = here.length === 1 ? 'one set of clothes' : `the clothes of ${here.length}`;
  record(world, 'consequence', { actorId: entity.id, householdId: household.id, importance: 1, classification: 'FICTIONAL FOR GAMEPLAY', claimId: weekly ? CLAIMS.wash : CLAIMS.washFor,
    text: weekly ? `${entity.name} did the wash: ${whose} boiled, beaten and hung on the fence to dry.`
      : here.length ? `${entity.name} did a wash for ${here.map(person => person.given || person.name).join(' and ')}, who wanted it before wash day: ${whose} boiled, beaten and hung on the fence to dry.`
      : `${entity.name} put the wash water on, but nobody's clothes wanted it after all.` });
}

/**
 * What a shop asks this person for something priced `amount`, paid in coin or food (sim/errands.mjs): a quarter more, rounded up -
 * a real or a quarter of a food - when their clothes want washing; the price as it is otherwise.
 */
export function askedOf(world, person, amount, pay = 'coin') {
  if (!dirty(world, person) || !Number.isFinite(amount) || amount <= 0) return amount;
  return pay === 'coin' ? Math.ceil(amount * DEARER - 1e-9) : Math.ceil(amount * DEARER * 4 - 1e-9) / 4;
}
/**
 * What a shop pays this person for what it buys, on the whole sale: a fifth less, rounded to the real or the quarter of a food, when
 * their clothes want washing. Rounded, not down: a sale of one real is not made nothing, and from three reales up it is a real less.
 */
export function paidTo(world, person, amount, pay = 'coin') {
  if (!dirty(world, person) || !Number.isFinite(amount) || amount <= 0) return amount;
  return pay === 'coin' ? Math.round(amount * CHEAPER) : Math.round(amount * CHEAPER * 4) / 4;
}
/** Why the price is not the price, for the errand's line (owner: "the price shown higher with a reason"), or null. */
export const dearerWhy = (world, person) => (dirty(world, person) ? `${nameOf(person)}'s clothes want washing: the shops ask a quarter more and pay a fifth less.` : null);

// ---------------------------------------------------------------------------------------------------- what people say

/**
 * What the people a dirty person meets say (owner, 2026-10-03: "negative comments about their smell"). Short, of the period, never
 * crude, several of each, chosen by a share of the person and the place. Every line is the game's (`FIC-GONZ-1155`).
 */
export const REMARKS = Object.freeze({
  town: Object.freeze([
    'Stand a little off from the counter, if you please.',
    'Mercy. When did that shirt last see a washtub?',
    'You have brought half the road in with you, friend.',
    'I will thank you not to lean on the flour.',
    'There is a creek runs right by this town, you know.',
    'Is there nobody at your place to do the wash?',
  ]),
  army: Object.freeze([
    'Stay downwind of me on the march, if you please.',
    'I have smelt sweeter mules.',
    'Did you come straight from the hog pen?',
    'Your mother never let you out the door like that.',
    'Bed down at the far end of the fire, friend.',
  ]),
  neighbours: Object.freeze([
    'Come in, come in. Leave that coat on the porch.',
    'Is there no soap at your place?',
    'The wash has gone hard at your house, I see.',
  ]),
});
/** The fewest days between two remarks to one person, so an army on the march is not one long complaint. */
export const REMARK_DAYS = 3;
/** Ticks a remark stays over the speaker's head. */
export const REMARK_TICKS = 3;

const GONE = Object.freeze(['dead', 'captured']);
const living = person => person?.kind === 'person' && !GONE.includes(person.health?.condition);
/** Who at this place would say it: a townsman or a keeper first, then a soldier or volunteer, then another family's people. */
function speakerAt(world, household, person, siteId) {
  const here = Object.values(world.entities).filter(one => living(one) && one.householdId !== household.id && !one.travel && one.location?.siteId === siteId);
  if (!here.length) return null;
  const ranked = [here.filter(one => one.deals || one.resident || one.shopSpot), here.filter(one => one.service?.status === 'serving'), here];
  const pool = ranked.find(list => list.length);
  return pool[Math.floor(stirredShare(world, person.id, `remark:${siteId}:${dayOf(world)}`) * pool.length) % pool.length];
}
/** What kind of place this is for the words: the war, a neighbour's farm, or a town. */
function placeKind(world, person, speaker, siteId) {
  if (withTheArmy(person) || speaker?.service) return 'army';
  if (speaker?.householdId && world.households[speaker.householdId]?.homeSiteId === siteId) return 'neighbours';
  return 'town';
}

/**
 * Every tick: the day old classes are read as washed is written once; and anybody of a played family who has come somewhere away
 * from home with dirty clothes is told so by whoever is there, once a place and at most once in `REMARK_DAYS` days. Not on the road
 * east, where every family's clothes were the same (`FIC-GONZ-1155`); not at home. Written on the person (`remark`), absent when
 * nothing has been said, which is also every class saved before.
 */
export function advanceWash(world) {
  if (!Number.isInteger(world.washBase)) world.washBase = dayOf(world);
  const day = dayOf(world);
  for (const household of Object.values(world.households)) {
    if (!household.played || household.absent) continue;
    const fled = household.flight && household.flight.status !== 'home';
    for (const id of household.members) {
      const person = world.entities[id];
      if (!living(person)) continue;
      const last = person.remark;
      // Said and heard: the words leave the speaker's head after `REMARK_TICKS`; the day stays, for `REMARK_DAYS`.
      if (last?.said && world.tick - last.tick >= REMARK_TICKS) { delete last.said; delete last.by; }
      const siteId = person.location?.siteId;
      if (!siteId || person.travel || fled || person.visiting) continue;
      // Home again: the next place away is a new place, even the same town.
      if (siteId === household.homeSiteId) { if (last?.at) delete last.at; continue; }
      if (last?.at === siteId) continue;
      const recent = Number.isInteger(last?.day) && day - last.day < REMARK_DAYS;
      const speaker = recent || !dirty(world, person) ? null : speakerAt(world, household, person, siteId);
      if (!speaker) { person.remark = { ...(last || {}), at: siteId }; continue; }
      const kind = placeKind(world, person, speaker, siteId);
      const lines = REMARKS[kind];
      const text = lines[Math.floor(stirredShare(world, person.id, `remark-words:${siteId}:${day}`) * lines.length) % lines.length];
      person.remark = { at: siteId, day, tick: world.tick, by: speaker.id, said: text };
      const place = world.map.sites[siteId]?.name;
      record(world, 'consequence', { actorId: person.id, householdId: household.id, importance: 2, classification: 'FICTIONAL FOR GAMEPLAY', claimId: CLAIMS.remarks,
        text: `${speaker.name}${place ? ` at ${place}` : ''} wrinkled ${speaker.sex === 'female' ? 'her' : 'his'} nose at ${person.name}'s clothes: "${text}"` });
    }
  }
}
/** The words over the speaker's head while a remark is fresh, for the family's own page (sim/world.mjs `familyTalk`). */
export function remarkLines(world, household) {
  const lines = [];
  for (const id of household.members) {
    const remark = world.entities[id]?.remark;
    if (!remark?.said || !remark.by || world.tick - remark.tick >= REMARK_TICKS) continue;
    lines.push({ id: `${id}:remark:${remark.tick}`, sceneId: `remark:${id}`, speakerId: remark.by, text: remark.said, kind: 'reconstructed', claimId: CLAIMS.remarks });
  }
  return lines;
}

// ---------------------------------------------------------------------------------------------------- the works

const homeAndSettled = (world, household) => !household.arriving && (!household.flight || ['home', 'ordered', 'stayed'].includes(household.flight.status));
const atTheHouse = (world, household, entity) => entity.location?.siteId === household.homeSiteId;
/**
 * A child under ten keeps house and does the wash only for a lone parent (owner, 2026-10-04, "Children keep house"; sim/custom.mjs
 * `childKeeps`): seven or more, and only one custom kept at home. The two works are marked a child's (`child`: a child's bar shows them
 * and a child's order is taken) and `grown` (worked at a grown work's pace); this is their age ladder.
 */
const childMay = (world, household, entity, id) => !tooYoung(entity) || childKeeps(world, household, entity, id, homeWork);
// The three works are joined like a fence (`crew: 'join'`) since 2026-10-04, so a man or boy may help a woman at them (sim/custom.mjs
// `helpsWhom`). ceiling: keeping house and the garden are steps of a tick each and a step is never shorter than a tick, so a second
// pair of hands does not shorten them (the wash goes five ticks to four). Worth undoing only if a class wants that help to show.

const WORKS = {
  'keep-house': {
    name: 'Keep house', skill: 'hands', where: 'home', job: true, keeps: 'house', crew: 'join', child: true, grown: true, indoors: true,
    describe: 'An hour or two at the hearth and about the house: the cooking, the mending and the sweeping. A house kept makes the family\'s food go further, today and tomorrow; a house nobody keeps does not. Women\'s work by custom: a man keeps house when no woman of the family is at home, and a man or boy of ten may help a woman at it. A child of seven keeps house for a lone parent.',
    offered: (world, household, entity) => homeAndSettled(world, household) && (!entity || childMay(world, household, entity, 'keep-house')),
    refusal: (world, household, entity) => {
      if (!childMay(world, household, entity, 'keep-house')) return `${entity.name} is too young to keep house while a man and a woman of the family are at home.`;
      if (!atTheHouse(world, household, entity)) return `${entity.name} is not at home.`;
      if (keptToday(world, household)) return `The house has been kept today, by ${nameOf(world.entities[household.housekept.by])}.`;
      return null;
    },
    steps: [
      { walk: 'house', doing: 'going in to see to the house' },
      { work: 1, doing: 'cooking at the hearth' },
      { work: 1, doing: 'sewing and mending' },
      { work: 1, doing: 'sweeping out and setting the house to rights' },
      { run: keepHouse },
    ],
  },
  'work-garden': {
    name: 'Work the garden', skill: 'farming', where: 'home', job: true, keeps: 'garden', crew: 'join',
    describe: `The kitchen garden beside the house: beans, peas, greens, sweet potatoes and melons. Laid out the first day, then worked a little every day: about ${GARDEN_FOOD} food a day in its season and ${GARDEN_WINTER} in the winter months, once a day for the family. Women's and girls' work by custom.`,
    offered: (world, household) => homeAndSettled(world, household),
    refusal: (world, household, entity) => {
      if (!atTheHouse(world, household, entity)) return `${entity.name} is not at home.`;
      if (gardenedToday(world, household)) return 'The garden has been worked today; it will want working again tomorrow.';
      return null;
    },
    steps: [
      { walk: 'garden', doing: 'going out to the garden' },
      { work: 2, doing: 'hoeing and weeding the garden' },
      { work: 1, doing: 'picking what is ready in the garden' },
      { run: workGarden },
      { walk: 'yard', doing: 'carrying it in from the garden' },
    ],
  },
  'wash-clothes': {
    name: 'Wash clothes', skill: 'hands', where: 'home', job: true, keeps: 'wash', crew: 'join', child: true, grown: true,
    describe: `Wash day: water carried up and heated, the clothes boiled with lye soap, beaten on the bench and hung on the fence. Everybody at home goes clean for ${CLEAN_DAYS} days. Once a week, and before the week is out for anybody at home whose clothes want it - somebody who missed wash day, or is dirty. Somebody away in dirty clothes is told so - in town the shops ask a quarter more and pay a fifth less. Women's work by custom, and the girls help; a man or boy of ten may help a woman at it, and a child of seven does it for a lone parent.`,
    offered: (world, household, entity) => homeAndSettled(world, household) && (!entity || childMay(world, household, entity, 'wash-clothes')),
    refusal: (world, household, entity) => {
      if (!childMay(world, household, entity, 'wash-clothes')) return `${entity.name} is too young to do the wash while a man and a woman of the family are at home.`;
      if (!atTheHouse(world, household, entity)) return `${entity.name} is not at home.`;
      const since = sinceWash(world, household);
      // Before the week is out, only while somebody at home wants it (`washWanted`): the weekly day is the household's.
      if (since !== null && since < WASH_AGAIN_DAYS && !washWanted(world, household).length) return since === 0 ? 'The wash was done today; it is done once a week.' : `The wash was done ${since === 1 ? 'yesterday' : `${since} days ago`}; it is done once a week.`;
      return null;
    },
    steps: [
      { walk: 'yard', doing: 'carrying water up for the wash' },
      { work: 2, doing: 'boiling the wash with lye soap' },
      { work: 2, doing: 'beating the wash on the battling bench' },
      { work: 1, doing: 'rinsing the wash and hanging it on the fence' },
      { run: washClothes },
    ],
  },
};
export const HOUSE_WORKS = Object.freeze(Object.keys(WORKS));

let registered = false;
/** The three works join the one table here, called from sim/world.mjs, as the milking does. */
export function registerHousework() {
  if (registered) return;
  registered = true;
  registerChores(WORKS);
}
/** Where the `garden` walk stands somebody: in the garden, laid out or to be. */
export const gardenPoint = (world, household) => (household.garden ? { x: household.garden.x, y: household.garden.y } : gardenPlace(world, household));

/** The garden as the family's land line sends it: where, and green in its season. Absent until it is laid out. */
export function gardenProjection(world, household) {
  const garden = household?.garden;
  if (!garden || !Number.isFinite(garden.x)) return {};
  return { garden: { x: garden.x, y: garden.y, season: gardenSeason(world), ...(gardenedToday(world, household) && { worked: true }) } };
}
/**
 * **Prompt the student** (owner, 2026-10-04, BALANCE.md §23 issue 3: a student who never found *Keep house* left the women idle, the
 * family dirty in town and the food short). The house's work that wants doing now and the one person the page points at it: keeping
 * house when nobody has today, else the wash when somebody at home wants it (dirty, or missed wash day). Pointed at the first of
 * the family in the panel's order - father, mother, then the eldest child - who is **idle** (at home, nothing in hand, not on the road,
 * not stopped by a child, not on auto, which keeps house by itself, and able) and **may begin it** (`choreAvailability`, so the custom
 * decides who: a woman or girl while one is home, a man when none is, a child for a lone parent; never somebody who could only help).
 * Nobody while somebody of the family is at that work already, or once it is done. The page draws it as a cue on the portrait and
 * on the icon, with no words (public/app.js `paintCue`). Null when nothing is wanted or nobody idle may do it.
 */
export const CUE_WORKS = Object.freeze(['keep-house', 'wash-clothes']);
const PANEL_RANK = Object.freeze({ father: 0, mother: 1 });
export function houseCue(world, household) {
  if (world.status !== 'running' || !household?.members?.length || !homeAndSettled(world, household)) return null;
  const people = household.members.map(id => world.entities[id]).filter(person => person?.kind === 'person' && !['dead', 'captured'].includes(person.health?.condition));
  for (const work of CUE_WORKS) {
    if (people.some(person => person.chore?.id === work)) continue;
    // The wash only when somebody at home wants it (`washWanted`): not merely because a family has never washed, when it is open too.
    if (work === 'wash-clothes' && !washWanted(world, household).length) continue;
    const idle = people.filter(person => !person.chore && !person.travel && !person.auto && !calledAside(person) && !person.visiting && person.task !== 'help'
      && atTheHouse(world, household, person) && !withTheArmy(person) && person.health?.condition !== 'sick')
      .sort((a, b) => (PANEL_RANK[a.kin?.role] ?? 2) - (PANEL_RANK[b.kin?.role] ?? 2) || (b.age ?? 0) - (a.age ?? 0));
    for (const person of idle) {
      const said = choreAvailability(world, household, person, work);
      if (said.can && !said.help) return { personId: person.id, work };
    }
  }
  return null;
}
/** Clothes that want washing, on the person as the family's page sees them (the flies drawn over them): absent while clean. */
export const washShown = (world, person) => (dirty(world, person) ? { dirty: true } : {});

/** A saved piece of all this that cannot be, or null. Every field is absent on a class saved before 2026-10-03. */
export function houseworkInvalid(world) {
  if (world.washBase !== undefined && !Number.isInteger(world.washBase)) return 'Invalid wash day';
  for (const household of Object.values(world.households || {})) {
    const kept = household.housekept;
    if (kept !== undefined && (!kept || !Number.isInteger(kept.day) || typeof kept.by !== 'string')) return 'Invalid housekeeping';
    if (household.washDay !== undefined && !Number.isInteger(household.washDay)) return 'Invalid wash day';
    const garden = household.garden;
    if (garden !== undefined && (!garden || ![garden.x, garden.y].every(Number.isFinite) || !Number.isInteger(garden.laid) || !Number.isInteger(garden.worked))) return 'Invalid garden';
  }
  for (const person of Object.values(world.entities || {})) {
    if (person.washed !== undefined && !Number.isInteger(person.washed)) return 'Invalid wash day';
    const remark = person.remark;
    if (remark !== undefined && (!remark || typeof remark !== 'object' || (remark.at !== undefined && typeof remark.at !== 'string')
      || (remark.day !== undefined && !Number.isInteger(remark.day)) || (remark.tick !== undefined && !Number.isInteger(remark.tick)))) return 'Invalid remark';
  }
  return null;
}
