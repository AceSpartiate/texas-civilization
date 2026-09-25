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

  if (CALVING_MONTHS.includes(month)) grew.cattle = born(world, household, day, 'calves', herd.cattle, CALF_SHARE);
  if (MAST_MONTHS.includes(month)) grew.hogs = born(world, household, day, 'pigs', herd.hogs, PIG_SHARE);
  herd.cattle += grew.cattle;
  herd.hogs += grew.hogs;

  // What drifts off an open range nobody has ridden. A family that looked to its stock inside `LOOKED_TO_DAYS` loses
  // nothing at all, which is the whole reason to spend the day on it.
  const looked = Number.isFinite(household.herdLookedDay) ? day - household.herdLookedDay : Infinity;
  if (looked > LOOKED_TO_DAYS) {
    for (const kind of ['cattle', 'hogs']) lost[kind] = born(world, household, day, `stray:${kind}`, herd[kind], STRAY_SHARE[kind]);
    herd.cattle -= lost.cattle;
    herd.hogs -= lost.hogs;
  }

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

/** Somebody has ridden the range: the herd is counted, the calves marked, and nothing strays for `LOOKED_TO_DAYS`. */
export function lookedToStock(world, household, entity) {
  const herd = herdOn(household);
  household.herdLookedDay = dayOf(world);
  record(world, 'stock', {
    actorId: entity.id, householdId: household.id, importance: 1, claimId: 'FIC-GONZ-183',
    text: `${entity.name} rode the range and counted the stock: ${herdWords(household)}. The calves are marked, and nothing will stray for a month.`,
  });
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
  herd.cattle = Math.max(0, herd.cattle - 1);
  const over = Math.max(0, BEEF_FOOD - BEEF_KEPT);
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
      ? `${entity.name} killed a beef: ${BEEF_KEPT} food is what the family can keep, and the rest went to ${given.length === 1 ? 'the nearest family' : `the ${given.length} nearest families`}. The family has ${herdWords(household)}.`
      : `${entity.name} killed a beef: ${BEEF_KEPT} food is all the family can keep, and with nobody near to divide the rest with, it was lost. The family has ${herdWords(household)}.`,
  });
  return BEEF_KEPT;
}

/** A hog killed: less meat, and all of it salted down and kept. */
export function killHog(world, household, entity) {
  const herd = herdOn(household);
  herd.hogs = Math.max(0, herd.hogs - 1);
  record(world, 'stock', {
    actorId: entity.id, householdId: household.id, importance: 2, claimId: 'FIC-GONZ-182',
    text: `${entity.name} killed a hog and salted it down: ${PORK_FOOD} food that will keep. The family has ${herdWords(household)}.`,
  });
  return PORK_FOOD;
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
  record(world, 'stock', {
    householdId: household.id, importance: 2, claimId: 'FIC-GONZ-184',
    text: `The stock stayed where it was: ${herdWords({ herd })} left on the range. Nobody drives cattle ahead of an army.`,
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
export function findStockAgain(world, household) {
  const left = household.herdLeft;
  if (!left) return null;
  delete household.herdLeft;
  const found = {
    cattle: Math.floor(left.cattle * FOUND_AGAIN.cattle),
    hogs: Math.floor(left.hogs * FOUND_AGAIN.hogs),
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
