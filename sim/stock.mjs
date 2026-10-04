// The family's own stock: cattle on the range, hogs on the mast.
//
// docs/STOCK.md, `HIST-TEX-112`, `HIST-TEX-263`, `FIC-GONZ-180` to `-185`. Owner, 2026-09-20, asked what stock should do:
// "a herd that feeds you, **and the stock can be lost**".
//
// Until today `household.stock` was a single boolean chosen in the lobby that decided **the size of a family's land
// grant and nothing else** (docs/LAND_GRANTS.md: "Stock do nothing else yet"). That was the largest thing the record had
// and the game did not: Almonte's survey of 1834 counts about **75,000 cattle and 110,000 hogs** in the two American
// departments, hogs outnumbering cattle two to one on the Brazos (`HIST-TEX-263`). A colony family's meat was mostly its
// own stock; the deer was what it hunted between beeves.
//
// **Four things the record insists on, and each is a rule here.**
//
//   **They feed themselves.** Holley, 1836: "Even in the winter season the pasturage is sufficiently good to dispense
//   with feeding live stock"; the canebrakes fed cattle through the winter. Woodman, of hogs: raised "on the native mast
//   of the country, **without trouble to the owner**". So there is no fodder, no cost and no daily work here at all. A
//   herd is not a burden; it is the thing that quietly feeds a family that has one.
//
//   **They increase where and when the country feeds them.** Calves in the spring, and hogs on the autumn mast - which
//   is why the Brazos ran two hogs to every cow.
//
//   **A beef cannot be kept.** Dilue Rose Harris: "**When one man butchered a beef, he divided with his neighbors.**" A
//   family in 1835 had no way to keep four hundred pounds of fresh meat in September, and the answer everybody used was
//   the neighbours - who would do the same next month. So butchering a beef here **feeds the families near you**, and
//   both records say so. Pork is the opposite: less of it, and it salts down and keeps, which is the other half of why
//   the hogs outnumbered the cattle.
//
//   **And they can be lost.** They ran loose on an open range - that is what a league of grazing land *is* - and a
//   family that never rode out after them lost them. `HIST-TEX-263`: a "wild cow" on a colonist's prairie in 1835 is
//   most likely somebody's unbranded stock out of twenty-five thousand head running loose.
//
// ceiling: the herd is two numbers on the household and not a drove of animals on the map. Where they graze, which cow
// is whose, the brand and the mark, and the drive to Natchitoches that was the real cattle money (`HIST-TEX-263`:
// "usually driven for sale to Natchitoches") are all outside it. Nothing here is drawn from a random stream: every
// increase and every stray is hashed from the class, the family and the day (`share`), so a class replays exactly.
import { dateOf } from './clock.mjs';
import { record } from './events.mjs';
import { share } from './shares.mjs';

/** What a family that drove stock in brings (`FIC-GONZ-180`). */
export const OPENING_HERD = Object.freeze({ cattle: 6, hogs: 12 });

/** The months calves come, and the share of the herd that calves in each of them (`FIC-GONZ-181`). */
export const CALVING_MONTHS = Object.freeze([2, 3, 4]);
export const CALF_SHARE = 0.12;
/** The months the mast is on the ground, and the share of the hogs that farrow in each (`FIC-GONZ-181`). */
export const MAST_MONTHS = Object.freeze([9, 10, 11]);
export const PIG_SHARE = 0.25;

/**
 * How much of a herd nobody has looked to drifts away in a month, by kind (`FIC-GONZ-183`).
 *
 * Cattle range far and are lost oftener; hogs keep to the timber they feed in and are lost less. Both are the game's own
 * numbers: the record says stock ran loose and that unbranded stock was there for the taking, and says nothing about a
 * rate.
 */
export const STRAY_SHARE = Object.freeze({ cattle: 0.1, hogs: 0.05 });
/** How long a family's ride round the range holds good, in days. */
export const LOOKED_TO_DAYS = 30;

/** What comes off a beef, and what a family can keep of it before it spoils (`FIC-GONZ-182`). */
export const BEEF_FOOD = 40, BEEF_KEPT = 15;
/**
 * How far a share of a butchered beef reaches, in miles, and how many families it is divided among at most.
 *
 * ceiling: **ten miles, because this game's families stand further apart than the record's neighbours did.** A league is
 * two and a half miles square, so a real colonist's nearest house was under three miles off and the meat went round the
 * same afternoon; here a class's families are dealt across whole settlements and at four miles most of them had nobody
 * at all to divide with (measured 2026-09-20). The way out is to deal families nearer each other, not to send meat
 * further.
 */
export const BEEF_MILES = 10, BEEF_FAMILIES = 4;
/** A hog is less, and all of it keeps: it is salted down. */
export const PORK_FOOD = 12;

const DAY = 1440;
const dayOf = world => Math.floor((world.minute || 0) / DAY);
const monthOf = (world, day) => dateOf(world, day * DAY + 12 * 60).getUTCMonth();
const dateOn = (world, day) => dateOf(world, day * DAY + 12 * 60).getUTCDate();

/**
 * The herd this family has, defaulted from the lobby choice it already made.
 *
 * **No save version moves for this** (`CLAUDE.md`: bump it when an old save would open a world that is *wrong*). A class
 * saved before today has no `herd`, and the correct empty value is not empty: it is the herd the family's own stock
 * choice always implied - `OPENING_HERD` for a family that drove stock in, and nothing for one that did not. So every
 * existing class opens on the world it would have had, and a family that chose no stock still has none.
 */
export function herdOf(household) {
  if (!household) return { cattle: 0, hogs: 0 };
  if (household.herd) return household.herd;
  return household.stock === true ? { ...OPENING_HERD } : { cattle: 0, hogs: 0 };
}
/** The herd written onto the household, so it can be changed. Called only where something is about to change it. */
function herdOn(household) {
  household.herd ??= herdOf(household);
  return household.herd;
}
/**
 * Head bought at the stock pens and driven home, onto the range with the rest (docs/TOWNS.md §4d, sim/shops.mjs `stockman`). A
 * family that drove no stock in starts a herd of its own with them. Its land grant is not made again: the league a stock raiser
 * was given was given at the arrival (docs/LAND_GRANTS.md). ceiling: a family on a labor keeps its bought cattle on the open
 * range round it, as the record's loose stock ran, and nothing here asks where they graze.
 */
export function addToHerd(household, kind, head) {
  const herd = herdOn(household);
  herd[kind] = (herd[kind] || 0) + head;
}
export const hasStock = household => { const herd = herdOf(household); return herd.cattle > 0 || herd.hogs > 0; };
/** How many head of everything, for the words and for the ending. */
export const headCount = household => { const herd = herdOf(household); return herd.cattle + herd.hogs; };

/** The herd in the family's own words: "six cattle and twelve hogs", "one cow", "nothing on the range". */
export function herdWords(household) {
  const herd = herdOf(household);
  const part = (count, one, many) => (count === 1 ? `one ${one}` : `${count} ${many}`);
  const said = [herd.cattle > 0 && part(herd.cattle, 'cow', 'cattle'), herd.hogs > 0 && part(herd.hogs, 'hog', 'hogs')].filter(Boolean);
  return said.length ? said.join(' and ') : 'nothing on the range';
}

/**
 * The days a herd changes on its own: the calves in the spring, the pigs on the mast, and what strays from a herd
 * nobody has ridden out after.
 *
 * Run once a day, on the first tick of it. Everything is hashed from the class, the family and the day, so a class
 * replays the same herd and a student who saves and reloads gets the stock they had (`FIC-GONZ-008`).
 */
export function advanceStock(world, household) {
  const herd = herdOf(household);
  if (!herd.cattle && !herd.hogs) return;
  const day = dayOf(world);
  if (household.herdDay === day) return;
  const was = household.herdDay;
  household.herdDay = day;
  if (was === undefined) return; // The first day a class is looked at is not a day that passed in it.
  for (let past = was + 1; past <= day; past++) tickHerd(world, household, past);
}

function tickHerd(world, household, day) {
  const month = monthOf(world, day), date = dateOn(world, day);
  // Increase and straying are both reckoned on the first of the month: a herd is not counted daily by anybody, and a
  // day's worth of a tenth of a herd is a number too small to say out loud.
  if (date !== 1) return;
  const herd = herdOn(household);
  const grew = { cattle: 0, hogs: 0 }, lost = { cattle: 0, hogs: 0 };

  // The young the wolves did not get (owner, 2026-10-03; `FIC-GONZ-1131`): the shares are what an open range raises with nobody
  // minding it, and a herd minded through the month raises up to half as many again (`RAISED_BONUS`) - Holley's wolves "carrying
  // away pigs ... calves" (`HIST-TEX-264`) are what a herder rides out against. `careOf` is the month's minding, by whose hands.
  if (CALVING_MONTHS.includes(month)) grew.cattle = born(world, household, day, 'calves', herd.cattle, CALF_SHARE * (1 + RAISED_BONUS * careOf(world, household, 'cattle', day)));
  if (MAST_MONTHS.includes(month)) grew.hogs = born(world, household, day, 'pigs', herd.hogs, PIG_SHARE * (1 + RAISED_BONUS * careOf(world, household, 'hogs', day)));
  herd.cattle += grew.cattle;
  herd.hogs += grew.hogs;
  // The young are drawn smaller than the rest until they have grown (public/herd-view.js `YOUNG_DAYS`).
  if (grew.cattle || grew.hogs) household.herdYoung = { cattle: grew.cattle, hogs: grew.hogs, day };

  // Strays not found again in time are gone for good: half of what is still out at each month's counting (`STRAYS_GONE`), gone
  // wild in the bottoms or under somebody else's mark. What is still out there a herder may find (`tendHerd`).
  const out = household.herdStrayed;
  if (out) {
    for (const kind of ['cattle', 'hogs']) out[kind] = Math.max(0, (out[kind] || 0) - born(world, household, day, `gone:${kind}`, out[kind] || 0, STRAYS_GONE));
    if (!out.cattle && !out.hogs) delete household.herdStrayed;
  }
  // What drifts off an open range nobody has ridden. A family that looked to its stock inside `LOOKED_TO_DAYS` loses
  // nothing at all, which is the whole reason to spend the day on it. A child minding the hogs (`HOGS_FROM_AGE`) looks to the
  // hogs and not to the cattle (`hogsLookedDay`). What strays is out on the range, not gone (`herdStrayed`).
  for (const kind of ['cattle', 'hogs']) {
    if (day - lookedOn(household, kind) > LOOKED_TO_DAYS) lost[kind] = born(world, household, day, `stray:${kind}`, herd[kind], STRAY_SHARE[kind]);
  }
  herd.cattle -= lost.cattle;
  herd.hogs -= lost.hogs;
  if (lost.cattle || lost.hogs) household.herdStrayed = { cattle: (household.herdStrayed?.cattle || 0) + lost.cattle, hogs: (household.herdStrayed?.hogs || 0) + lost.hogs };

  const said = [];
  if (grew.cattle) said.push(`${grew.cattle === 1 ? 'a calf was' : `${grew.cattle} calves were`} dropped on the range`);
  if (grew.hogs) said.push(`${grew.hogs === 1 ? 'a pig' : `${grew.hogs} pigs`} came of the mast in the timber`);
  if (lost.cattle || lost.hogs) {
    const gone = [lost.cattle && `${lost.cattle} ${lost.cattle === 1 ? 'cow' : 'cattle'}`, lost.hogs && `${lost.hogs} ${lost.hogs === 1 ? 'hog' : 'hogs'}`].filter(Boolean).join(' and ');
    said.push(`${gone} strayed off and nobody has been out after them`);
  }
  if (!said.length) return;
  record(world, 'stock', {
    householdId: household.id, importance: lost.cattle || lost.hogs ? 2 : 1,
    claimId: lost.cattle || lost.hogs ? 'FIC-GONZ-183' : 'FIC-GONZ-181',
    text: `${said.join('; ')}. The family has ${herdWords(household)}.`,
  });
}

/**
 * How many head of `count` a share of them comes to, with the remainder decided by the class's own hash rather than by
 * rounding: a herd of six at a share of 0.12 is 0.72 of a calf, and 0.72 of a calf has to be one calf or none.
 */
function born(world, household, day, question, count, rate) {
  if (count <= 0) return 0;
  const exact = count * rate, whole = Math.floor(exact);
  const over = share(world, household.id, `stock:${question}:${day}`) < exact - whole ? 1 : 0;
  return Math.min(count, whole + over);
}

// ---- the herder (owner, 2026-10-03) ------------------------------------------------------------------------------------------
//
// > "when players bring cattle and hogs, why don't we see their real herds? shouldn't a character that's assigned to tend the herd
// > have appropriate skills and abilities for that? it should be a path to making food and wealth too." ... "there's already an
// > action for looking after the animals on the range, change and adapt it."
//
// So *Ride the range after the stock* (`look-to-stock`) is the herder's work, and the same id it always had. Everything in §2 of
// docs/STOCK.md still holds: the herd feeds itself and increases with nobody minding it at the rates it always had, and a ride a
// month still keeps it from straying. What minding it more adds is the herder's own (`FIC-GONZ-1130` to `-1135`):
//
//   **A hand with stock** (`herdingOf`): dealt with the person at founding, 1 to 3, as the other knacks are (sim/chores.mjs
//   `skillsFor`), and - unlike them - grown by the days spent at it (`LEARN_DAYS`), because stock is learned by working it.
//   **Who may**: a child of seven minds the hogs in the timber (`HOGS_FROM_AGE`); cattle are worked from twelve (`CATTLE_FROM_AGE`;
//   Dilue Harris's brother of thirteen was sent to help drive cattle, `HIST-TEX-641`), and on horseback when the family's horse is
//   free (`MOUNTED_CARE`) - "management of cattle on horseback" (`HIST-TEX-1130`).
//   **What minding does**, read over the last thirty days (`careOf`): more of the young raised (`RAISED_BONUS`), a fatter herd
//   (`conditionOf`: more meat off a beef or a hog, a better price at the pens), and strays found again (`FIND_SHARE`).
//
// ceiling: the herd is still two numbers and a few fields on the household, not a drove of animals each with an id; the page draws
// the counts (public/herd-view.js). A brand and a mark per beast, a cow's own age, and steers told from cows are outside it.

/** The youngest who minds the hogs in the timber, and the youngest who works cattle. */
export const HOGS_FROM_AGE = 7, CATTLE_FROM_AGE = 12;
/** Days at the stock that make a hand better by one, up to the knack's ceiling of three. */
export const LEARN_DAYS = 8;
/** A month's minding: this many days of it, weighed by the hand (`CARE_WEIGHT`), is a herd fully minded. */
export const CARE_DAYS = 8;
export const CARE_WEIGHT = Object.freeze({ 1: 0.6, 2: 0.8, 3: 1 });
/** Cattle worked on foot count for this much of a mounted day: a league of prairie is not gathered on foot. */
export const MOUNTED_CARE = 0.5;
/** A herd fully minded raises this much more of its young than one left to itself. */
export const RAISED_BONUS = 0.5;
/** The share of the strays still out that a day's riding brings in, by the hand. */
export const FIND_SHARE = Object.freeze({ 1: 0.25, 2: 0.5, 3: 0.75 });
/** The share of the strays still out that is gone for good at each month's counting. */
export const STRAYS_GONE = 0.5;
/** Minding at or over this much is a herd in good flesh in its season. */
export const FAT_CARE = 0.5;
export const CONDITIONS = Object.freeze(['thin', 'fair', 'fat']);
/** "fat ", "thin " or nothing: the flesh as the record says it, before "beef" or "hog". */
const fleshWord = flesh => (flesh === 'fat' || flesh === 'thin' ? `${flesh} ` : '');
/** What a beef and a hog give in each condition: the fair one is what they always gave (`BEEF_FOOD`, `PORK_FOOD`). */
export const BEEF_BY = Object.freeze({ thin: 32, fair: BEEF_FOOD, fat: 48 });
/** A fat hog gives no more than a hog costs at the pens in food (sim/shops.mjs `HOG_FOOD`, 14): food never buys more food. */
export const PORK_BY = Object.freeze({ thin: 9, fair: PORK_FOOD, fat: 14 });
/** A beef killed gives its hide, for the tanner (sim/shops.mjs `tanner`) or a carreta's lashings. */
export const BEEF_HIDES = 1;
/**
 * What the stock pens pay for a head, by condition (`FIC-GONZ-1134`, MODELLED on `HIST-TEX-440` and `HIST-TEX-1131`): Almonte's "bull
 * or young bullock" at four to six pesos, so a steer 3 thin, 4 fair and 6 fat - under the ten a cow and calf costs, five a head, so
 * only a herd in good flesh sells for more than it was bought for. A hog 1, 2 or 3: no price for a live hog was found, and the pens
 * pay under the 4 they ask, so a hog is never bought and sold again at a profit. Coin, paid outside the keeper's purse: the trader
 * drives what he buys on to Natchitoches or New Orleans, where cattle "fetched twice their Texas market value" (`HIST-TEX-1131`).
 */
export const SALE_COIN = Object.freeze({ cattle: Object.freeze({ thin: 3, fair: 4, fat: 6 }), hogs: Object.freeze({ thin: 1, fair: 2, fat: 3 }) });
/** The most head one person drives to the pens on one trip. ceiling: a cap, not a rule; a drive of a whole herd is a journey of its own. */
export const SALE_MOST = Object.freeze({ cattle: 4, hogs: 6 });

/** The months each kind is in its best flesh when minded, and lean when not (`conditionOf`). Months are 0-based. */
const FAT_MONTHS = Object.freeze({ cattle: [4, 5, 6, 7, 8, 9, 10, 11], hogs: [9, 10, 11, 0, 1] });
const LEAN_MONTHS = Object.freeze({ cattle: [1, 2], hogs: [6, 7] });

/** The day this kind was last looked to: a grown hand's ride counts for both, a child's for the hogs. */
function lookedOn(household, kind) {
  const both = Number.isFinite(household.herdLookedDay) ? household.herdLookedDay : -Infinity;
  return kind === 'hogs' && Number.isFinite(household.hogsLookedDay) ? Math.max(both, household.hogsLookedDay) : both;
}

/** The knack this person was dealt for stock, 1 to 3: hashed from their id and the word, as `skillsFor` deals the others. */
export function herdingDealt(id) {
  let hash = 2166136261;
  for (const character of `${id}:herding`) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  hash ^= hash >>> 15; hash = Math.imul(hash, 2246822507); hash ^= hash >>> 13;
  return 1 + ((hash >>> 0) % 3);
}
/**
 * How good a hand with stock this person is now: what they were dealt, and one better for every `LEARN_DAYS` days at it, never
 * past three. Nothing is stored for somebody who has never tended (a class saved before 2026-10-03 included): the dealt knack is
 * derived from their id, as their face is, so no save version moves.
 */
export const herdingOf = entity => Math.min(3, herdingDealt(entity?.id || '') + Math.floor((entity?.herding?.days || 0) / LEARN_DAYS));
/** What this person may mind: both kinds from twelve, the hogs from seven, nothing younger. */
export function herdWork(entity) {
  const age = Number.isFinite(entity?.age) ? entity.age : 30;
  return age >= CATTLE_FROM_AGE ? 'all' : age >= HOGS_FROM_AGE ? 'hogs' : null;
}
/** The words for a hand, as the row and the herd's hover say them. */
export const HAND_WORDS = Object.freeze({ 1: 'new to stock', 2: 'a good hand with stock', 3: 'the best hand with stock on this land' });

/**
 * How well this kind has been minded over the thirty days to `day`, 0 to 1: every day somebody tended it, weighed by the best hand
 * out that day (`CARE_WEIGHT`), cattle worked on foot at `MOUNTED_CARE`, and `CARE_DAYS` of that a herd fully minded.
 */
export function careOf(world, household, kind, day = dayOf(world)) {
  let sum = 0;
  for (const entry of household.herdCare || []) {
    if (entry.d > day || day - entry.d >= LOOKED_TO_DAYS) continue;
    if (kind === 'cattle' && !entry.c) continue;
    sum += (kind === 'cattle' ? entry.c : entry.h) || 0;
  }
  return Math.min(1, Math.round((sum / CARE_DAYS) * 1000) / 1000);
}
/**
 * The herd's flesh, by kind: `fat` when minded (`FAT_CARE`) in its season - cattle on the summer grass, hogs on the autumn mast -
 * `thin` when left to itself through its lean months - cattle at the end of the winter, hogs before the mast - and `fair` else,
 * which is what an unminded herd always was in this game (`BEEF_FOOD`, `PORK_FOOD`). Every season here is the game's own
 * (`FIC-GONZ-1132`): the record gives the mast and the winter range, not a herd's weight by the month.
 */
export function conditionOf(world, household, kind, day = dayOf(world)) {
  const month = monthOf(world, day), minded = careOf(world, household, kind, day) >= FAT_CARE;
  if (minded) return FAT_MONTHS[kind].includes(month) ? 'fat' : 'fair';
  return LEAN_MONTHS[kind].includes(month) ? 'thin' : 'fair';
}
/** Whether this person has been out after the stock today: once a day, as every other work that pays (sim/gathering.mjs). */
export const tendedToday = (world, entity) => entity?.herding?.last === dayOf(world);

/**
 * A day out after the stock (`look-to-stock`): the herd counted and the calves marked, nothing strays for `LOOKED_TO_DAYS` of what
 * this hand can mind, the day written into the month's minding (`herdCare`), strays found again by the hand's share
 * (`FIND_SHARE`), and the hand one day better at it. `mounted` when the family's horse went with them.
 */
export function tendHerd(world, household, entity, { mounted = false, work: given = null } = {}) {
  // `work`: the hogs only, for a woman who set out while a man was at home (owner, 2026-10-03; sim/chores.mjs `herdWorkHere`).
  const herd = herdOn(household), day = dayOf(world), work = given || herdWork(entity) || 'all';
  const skill = herdingOf(entity);
  if (work === 'all') household.herdLookedDay = day; else household.hogsLookedDay = day;
  // The day's minding, one entry a day: the best hand out that day for each kind.
  const weight = CARE_WEIGHT[skill];
  const cattle = work === 'all' ? Math.round(weight * (mounted ? 1 : MOUNTED_CARE) * 100) / 100 : 0;
  const log = (household.herdCare || []).filter(entry => day - entry.d < LOOKED_TO_DAYS && entry.d <= day);
  const today = log.find(entry => entry.d === day);
  if (today) { today.h = Math.max(today.h || 0, weight); if (cattle) today.c = Math.max(today.c || 0, cattle); }
  else log.push({ d: day, h: weight, ...(cattle && { c: cattle }) });
  household.herdCare = log;
  // Strays brought in, of the kinds this hand minds.
  const found = { cattle: 0, hogs: 0 };
  for (const kind of work === 'all' ? ['cattle', 'hogs'] : ['hogs']) {
    const out = household.herdStrayed?.[kind] || 0;
    if (!out) continue;
    found[kind] = born(world, household, day, `found:${entity.id}:${kind}`, out, FIND_SHARE[skill]);
    herd[kind] += found[kind];
    household.herdStrayed[kind] = out - found[kind];
  }
  if (household.herdStrayed && !household.herdStrayed.cattle && !household.herdStrayed.hogs) delete household.herdStrayed;
  // One day's learning a day, however many rides.
  const before = skill;
  if (entity.herding?.last !== day) entity.herding = { days: (entity.herding?.days || 0) + 1, last: day };
  const after = herdingOf(entity);
  const rode = work === 'hogs' ? `${entity.name} minded the hogs in the timber` : `${entity.name} ${mounted ? 'rode' : 'walked'} the range and counted the stock`;
  const foundWords = found.cattle + found.hogs ? ` and brought in ${herdWords({ herd: found })} that had strayed` : '';
  const flesh = [herd.cattle > 0 && work === 'all' && `the cattle ${conditionOf(world, household, 'cattle', day)}`, herd.hogs > 0 && `the hogs ${conditionOf(world, household, 'hogs', day)}`].filter(Boolean).join(', ');
  record(world, 'stock', {
    actorId: entity.id, householdId: household.id, importance: found.cattle + found.hogs ? 2 : 1, claimId: 'FIC-GONZ-1130',
    text: `${rode}${foundWords}: ${herdWords(household)}${flesh ? `, ${flesh}` : ''}. ${work === 'hogs' ? 'The hogs will not stray for a month.' : 'The calves are marked, and nothing will stray for a month.'}`,
  });
  if (after > before) {
    record(world, 'stock', { actorId: entity.id, householdId: household.id, importance: 2, claimId: 'FIC-GONZ-1130',
      text: `${entity.name} is ${HAND_WORDS[after]} now, after ${entity.herding.days} days at it.` });
  }
  return found;
}
/** The old name, kept for any caller that still asks it (the director rides the range through the chore). */
export const lookedToStock = (world, household, entity) => tendHerd(world, household, entity, { mounted: herdWork(entity) === 'all' });

/**
 * Head sold at the stock pens (sim/errands.mjs, the `stockman`'s `sell-cattle` and `sell-hogs`): out of the herd, at the price of
 * its condition (`SALE_COIN`), as many as the herd still has. Returns `{ sold, got, each, condition }`.
 */
export function sellStock(world, household, kind, n) {
  const herd = herdOn(household), sold = Math.max(0, Math.min(n, herd[kind] || 0));
  const condition = conditionOf(world, household, kind), each = SALE_COIN[kind][condition];
  herd[kind] -= sold;
  return { sold, got: sold * each, each, condition };
}
/** What one head of this kind fetches at the pens today, and in what flesh. */
export const salePrice = (world, household, kind) => { const condition = conditionOf(world, household, kind); return { each: SALE_COIN[kind][condition], condition }; };

/**
 * The herd as the family's page draws it and its hover tells it (`projectHousehold`, public/herd-view.js): the counts are the
 * household's own `herd`, sent as they always were; this adds the young dropped lately, the flesh, the month's minding, the strays
 * still out and who minded it last. The minding log itself stays on the server.
 */
export function ranchShown(world, household) {
  const herd = herdOf(household);
  if (!herd.cattle && !herd.hogs && !household.herdStrayed) return null;
  const day = dayOf(world);
  const last = (household.herdCare || []).reduce((best, entry) => (entry.d > (best?.d ?? -Infinity) ? entry : best), null);
  const keeper = household.members.map(id => world.entities[id]).filter(one => one?.herding?.last === last?.d && last).sort((a, b) => herdingOf(b) - herdingOf(a))[0];
  const hour = dateOf(world, world.minute || 0).getUTCHours();
  return {
    // In near the house at night (public/herd-view.js `herdNight`): the server's clock, so the page need not keep one.
    ...((hour < 6 || hour >= 20) && { night: true }),
    condition: { cattle: conditionOf(world, household, 'cattle', day), hogs: conditionOf(world, household, 'hogs', day) },
    care: { cattle: careOf(world, household, 'cattle', day), hogs: careOf(world, household, 'hogs', day) },
    ...(household.herdYoung && day - household.herdYoung.day < YOUNG_DAYS && { young: { cattle: household.herdYoung.cattle, hogs: household.herdYoung.hogs } }),
    ...(household.herdStrayed && { strayed: { cattle: household.herdStrayed.cattle || 0, hogs: household.herdStrayed.hogs || 0 } }),
    ...(keeper && { keeper: { id: keeper.id, name: keeper.given || keeper.name, hand: herdingOf(keeper), days: day - last.d } }),
  };
}
/** The same for the Host's map of every family's land (sim/overview.mjs). */
export const herdOnPage = (world, household) => ranchShown(world, household);
/** How long the young of a month are drawn as young. */
export const YOUNG_DAYS = 75;

/** Stored herd state that could not be (sim/world.mjs `validateWorld`). Absent everywhere on a class saved before 2026-10-03. */
export function herdInvalid(world) {
  const count = value => Number.isInteger(value) && value >= 0;
  for (const household of Object.values(world.households || {})) {
    if (household.herd !== undefined && (!household.herd || !count(household.herd.cattle) || !count(household.herd.hogs))) return 'Invalid herd';
    if (household.herdStrayed !== undefined && (!household.herdStrayed || !count(household.herdStrayed.cattle || 0) || !count(household.herdStrayed.hogs || 0))) return 'Invalid strays';
    if (household.herdYoung !== undefined && (!household.herdYoung || !count(household.herdYoung.cattle) || !count(household.herdYoung.hogs) || !Number.isInteger(household.herdYoung.day))) return 'Invalid young stock';
    if (household.hogsLookedDay !== undefined && !Number.isInteger(household.hogsLookedDay)) return 'Invalid day the hogs were looked to';
    if (household.herdCare !== undefined && (!Array.isArray(household.herdCare) || household.herdCare.length > LOOKED_TO_DAYS
      || household.herdCare.some(entry => !Number.isInteger(entry?.d) || !(entry.h > 0 && entry.h <= 1) || (entry.c !== undefined && !(entry.c > 0 && entry.c <= 1))))) return 'Invalid minding of the herd';
  }
  for (const entity of Object.values(world.entities || {})) {
    if (entity.herding !== undefined && (!entity.herding || !Number.isInteger(entity.herding.days) || entity.herding.days < 1 || !Number.isInteger(entity.herding.last))) return 'Invalid days at the stock';
  }
  return null;
}

/** Why this family cannot butcher this kind now, or null. */
export function butcherRefusal(household, kind) {
  const herd = herdOf(household);
  if (kind === 'cattle' && herd.cattle < 1) return 'There is no beef on the range to kill.';
  if (kind === 'hogs' && herd.hogs < 1) return 'There are no hogs in the timber to kill.';
  return null;
}

/**
 * A beef killed, and divided.
 *
 * `neighbours` is what the caller found within `BEEF_MILES`: at most `BEEF_FAMILIES` of them, nearest first. Each gets an
 * equal share of what the family cannot keep, and the meat is written into **both** records, because that is what the
 * sentence in the record is about ("when one man butchered a beef, he divided with his neighbors") and because a family
 * that has been given meat this month is a family that will divide its own next month.
 *
 * Returns what the family kept, which the chore then produces so that the carrying rule stays in one place.
 */
export function divideBeef(world, household, entity, neighbours) {
  const herd = herdOn(household);
  // In its flesh (owner, 2026-10-03; `conditionOf`): a fat beef is more meat for the neighbours, a thin one less; the family keeps
  // what it can keep either way. And its hide, for the tanner (`BEEF_HIDES`).
  const condition = conditionOf(world, household, 'cattle');
  herd.cattle = Math.max(0, herd.cattle - 1);
  household.resources.hides = (household.resources.hides ?? 0) + BEEF_HIDES;
  const over = Math.max(0, BEEF_BY[condition] - BEEF_KEPT);
  const given = neighbours.slice(0, BEEF_FAMILIES);
  const each = given.length ? Math.round((over / given.length) * 100) / 100 : 0;
  for (const other of given) {
    other.resources.food = Math.round(((other.resources.food ?? 0) + each) * 10000) / 10000;
    record(world, 'stock', {
      householdId: other.id, importance: 2, claimId: 'FIC-GONZ-182',
      text: `${entity.name} of ${household.name || 'a neighbouring family'} killed a beef and sent ${each} food over: it cannot be kept, and they divided it.`,
    });
  }
  record(world, 'stock', {
    actorId: entity.id, householdId: household.id, importance: 2, claimId: 'FIC-GONZ-182',
    text: given.length
      ? `${entity.name} killed a ${fleshWord(condition)}beef: ${BEEF_KEPT} food is what the family can keep, and the rest went to ${given.length === 1 ? 'the nearest family' : `the ${given.length} nearest families`}. The hide is kept for the tanner. The family has ${herdWords(household)}.`
      : `${entity.name} killed a ${fleshWord(condition)}beef: ${BEEF_KEPT} food is all the family can keep, and with nobody near to divide the rest with, it was lost. The hide is kept for the tanner. The family has ${herdWords(household)}.`,
  });
  return BEEF_KEPT;
}

/** A hog killed: less meat, and all of it salted down and kept - more off a hog fattened on the mast (`PORK_BY`). */
export function killHog(world, household, entity) {
  const herd = herdOn(household);
  const condition = conditionOf(world, household, 'hogs');
  herd.hogs = Math.max(0, herd.hogs - 1);
  const pork = PORK_BY[condition];
  record(world, 'stock', {
    actorId: entity.id, householdId: household.id, importance: 2, claimId: 'FIC-GONZ-182',
    text: `${entity.name} killed a ${fleshWord(condition)}hog and salted it down: ${pork} food that will keep. The family has ${herdWords(household)}.`,
  });
  return pork;
}

/**
 * What the flight east does to a herd (`FIC-GONZ-184`).
 *
 * Cattle cannot be driven at a fleeing family's pace and were not: Dilue Harris's family left with what the cart held.
 * The hogs are in the timber and nobody even tries. So the whole herd stays on the range, and what a family would find
 * if it ever came back is not this game's to say - the class ends at the refuge. It is written down as **left**, so the
 * family's own record and the ending can say what it cost, rather than the number quietly becoming zero.
 */
export function leaveStock(world, household) {
  const herd = herdOf(household);
  if (!herd.cattle && !herd.hogs) return;
  household.herdLeft = { ...herd };
  household.herd = { cattle: 0, hogs: 0 };
  // The strays still out and the young are on the same range, left with the rest; nobody is minding anything now.
  delete household.herdStrayed; delete household.herdYoung; delete household.herdCare;
  record(world, 'stock', {
    householdId: household.id, importance: 2, claimId: 'FIC-GONZ-184',
    text: `The stock stayed where it was: ${herdWords({ herd })} left on the range. Nobody drives a herd ahead of an army.`,
  });
}

/**
 * What a family that comes home finds of the herd it left (`FIC-GONZ-184`).
 *
 * Cattle on an open range mostly keep to their own country and a fair number are still there; hogs in the timber have
 * been loose on the mast for two months with nobody near them, and most of them are not coming back. **That is where
 * the feral hogs of the record come from** - Holley's swine "frequently met with... descended from the domestic swine"
 * (`HIST-TEX-264`) - and it is why the bestiary left the feral hog to this module rather than making it a quarry: a hog
 * in the woods was somebody's, or had been.
 *
 * The shares are the game's own. What the record gives is the direction: the Runaway Scrape cost the colonies their
 * stock, and what a family found on its return was a fraction of what it drove out of.
 */
export const FOUND_AGAIN = Object.freeze({ cattle: 0.5, hogs: 0.25 });
/**
 * Where a column's foragers came (sim/scrape.mjs `burnByForagers`, `driven` on the herd left): the Mexican army lived off the
 * country's cattle, so a quarter of the cattle is found, not half (`FIC-GONZ-465`). The hogs in the timber are no easier to
 * drive than to find, and keep their quarter.
 */
export const FOUND_AFTER_FORAGERS = Object.freeze({ cattle: 0.25, hogs: 0.25 });
export function findStockAgain(world, household) {
  const left = household.herdLeft;
  if (!left) return null;
  delete household.herdLeft;
  const shares = left.driven ? FOUND_AFTER_FORAGERS : FOUND_AGAIN;
  const found = {
    cattle: Math.floor(left.cattle * shares.cattle),
    hogs: Math.floor(left.hogs * shares.hogs),
  };
  const herd = herdOn(household);
  herd.cattle += found.cattle;
  herd.hogs += found.hogs;
  const gone = { cattle: left.cattle - found.cattle, hogs: left.hogs - found.hogs };
  record(world, 'stock', {
    householdId: household.id, importance: 2, claimId: 'FIC-GONZ-184',
    text: found.cattle + found.hogs > 0
      ? `Of the stock left on the range, ${herdWords({ herd: found })} were found again; ${herdWords({ herd: gone })} are gone, and the hogs that are left have gone wild in the timber.`
      : 'Nothing was found of the stock left on the range. The hogs that lived have gone wild in the timber.',
  });
  return found;
}
