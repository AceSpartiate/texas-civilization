// What a town's store (and its weaver) can use (owner, 2026-09-28, by multiple choice on docs/audits/2026-09-28-design.md B9:
// **"Seasons and a limited market"** - the store buys only what it can use and its price falls as it fills). Kept when the seasons
// went the same day (owner: "have crops be independent of the seasons ... adjust prices to compensate"; sim/crops.mjs).
//
// Until today the store bought every bale and every five food a family carried in, for coin outside its keeper's purse (owner,
// 2026-09-16), and nothing ever filled: with a crop every eighteen ticks that was a coin pump, and a class's winners finished at
// 122,000 to 347,000 against the three to ten reales a family starts with (docs/BALANCE.md §9.3).
//
// Now each town's shop that buys a good wants so much of it - a share for every family near the town - and holds what it has
// bought until it has sold it on or sent it down to the coast, which it does steadily, a month to clear what it wants. While it
// holds less than half what it wants it pays its full price; from half to full it pays half; full, it takes no more until some
// has gone. What it holds is read off the class's calendar, so the weeks the class skips over the winter empty it as they would.
// Every family in the town - played, gone, or run by the neighbours' director - sells into the same store.
//
// **All of it is invented** (`FIC-GONZ-722`): no quantity a Gonzales or San Felipe store took, nor any price for a bale or a
// bushel, is in this project's research, and `HIST-GONZ-022` warns against claiming one. The shape is documented: coin was scarce
// and barter usual (`HIST-GONZ-023`), and a store in the colonies sold on what it bought, shipping cotton to the coast.
// Deterministic: no chance in it (`FIC-GONZ-008`); every price is on the control before it is chosen.
//
// State: `world.markets[siteId][trade:good] = { held, minute }`, written only when something is sold. Absent on every class saved
// before today, which is a store that holds nothing yet - the correct empty value - so no save version moved.

const DAY = 1440;
/** A month to sell on or ship everything a shop wants. */
export const SELLS_ON_DAYS = 30;

/**
 * What each buying shop wants of a good, for every family near its town, and what it pays while it holds less than half of
 * that (`[0]`) and from half to full (`[1]`). `per` is how many of the good one payment is for (the store's food, five to a
 * real); `coinEach` the coin a payment is; `foodEach` the food a unit fetches. `FIC-GONZ-722`.
 */
export const MARKET = Object.freeze({
  // Re-tuned 2026-09-28 when crops went to real minutes (owner: "adjust prices to compensate"; docs/BALANCE.md §11): food a real for
  // four (five until then), and the store's want of cotton three bales a family (four), so a corn family that sells has a price and
  // cotton, the dearer crop, does not have the store to itself.
  'store:food': Object.freeze({ want: 30, tiers: Object.freeze([{ coinEach: 1, per: 4 }, { coinEach: 1, per: 8 }]) }),
  'store:cotton': Object.freeze({ want: 3, tiers: Object.freeze([{ coinEach: 2, foodEach: 2 }, { coinEach: 1, foodEach: 1 }]) }),
  'weaver:cotton': Object.freeze({ want: 2, tiers: Object.freeze([{ coinEach: 2, foodEach: 3 }, { coinEach: 1, foodEach: 1.5 }]) }),
});
const KEEPER_WORDS = Object.freeze({ store: 'The store', weaver: 'The weaver' });
const UNIT = Object.freeze({ food: ['food', 'food'], cotton: ['bale', 'bales'] });
const round = value => Math.round(value * 10000) / 10000;

/** The families whose town this is: what the shop's want is sized to. At least one. */
export function familiesAt(world, siteId) {
  const near = Object.values(world.households || {}).filter(household => (household.settlementId || 'gonzales') === siteId).length;
  return Math.max(1, near);
}
/** How much of this good this town's shop wants in all. */
export const wantAt = (world, siteId, key) => (MARKET[key]?.want ?? 0) * familiesAt(world, siteId);

/** What the shop holds now, after what it has sold on since it last bought. Pure: safe while building a projection. */
export function heldAt(world, siteId, key, minute = world.minute) {
  const entry = world.markets?.[siteId]?.[key];
  if (!entry) return 0;
  const gone = wantAt(world, siteId, key) / SELLS_ON_DAYS * Math.max(0, (minute - entry.minute) / DAY);
  return round(Math.max(0, entry.held - gone));
}
/** Which price the shop is paying at this much held: 0 full price, 1 half, -1 it takes no more. */
export function tierAt(held, want) {
  if (held < want / 2) return 0;
  if (held < want) return 1;
  return -1;
}

/**
 * Selling `units` of an offer's good to the shop in this town, lot by lot at the price each lot fetches as the shop fills, paid
 * in coin or in food. Pure: returns `{ sold, got, lots, full }` - the units taken, the coin or food paid, the payments made, and
 * whether the shop filled before all was taken. `coinLimit` caps what a keeper's own purse can pay out.
 * An offer with no market (the tanner's hides) is sold at its fixed price, as it always was.
 */
export function marketSale(world, siteId, trade, offer, units, pay, { coinLimit = Infinity } = {}) {
  const key = `${trade}:${offer.good}`, market = MARKET[key];
  let sold = 0, got = 0, lots = 0, full = false, spent = 0;
  if (!market) {
    const per = offer.per ?? 1, each = pay === 'coin' ? offer.coinEach : offer.foodEach * per;
    lots = Math.floor(units / per + 1e-9);
    if (pay === 'coin') lots = Math.min(lots, Math.floor(coinLimit / offer.coinEach));
    return { sold: lots * per, got: round(lots * each), lots, full: false };
  }
  const want = wantAt(world, siteId, key);
  let held = heldAt(world, siteId, key);
  for (;;) {
    const tier = tierAt(held, want);
    if (tier < 0) { full = true; break; }
    const price = market.tiers[tier], per = price.per ?? 1;
    // Paid in food, the part of a bale goes too, as the store's barter always took it; coin is paid only for whole lots.
    if (pay === 'food' && units - sold > 1e-9 && units - sold + 1e-9 < per) {
      const part = round(units - sold);
      sold += part; got += price.foodEach * part; held += part;
      break;
    }
    if (units - sold + 1e-9 < per) break;
    const each = pay === 'coin' ? price.coinEach : price.foodEach * per;
    if (pay === 'coin' && spent + each > coinLimit) break;
    sold += per; got += each; lots++; held += per;
    if (pay === 'coin') spent += each;
  }
  return { sold: round(sold), got: round(got), lots, full };
}
/** Write down what the shop took (and what it has sold on since it last bought). */
export function recordSale(world, siteId, trade, good, units) {
  const key = `${trade}:${good}`;
  if (!MARKET[key] || !(units > 0)) return;
  const held = heldAt(world, siteId, key);
  world.markets ||= {};
  world.markets[siteId] = { ...(world.markets[siteId] || {}), [key]: { held: round(held + units), minute: world.minute } };
}

/** How the shop's buying stands, in words for the counter and the errand's list, or null where it has no market. */
export function marketWords(world, siteId, trade, good) {
  const key = `${trade}:${good}`, market = MARKET[key];
  if (!market) return null;
  const want = wantAt(world, siteId, key), held = heldAt(world, siteId, key), tier = tierAt(held, want);
  const [one, many] = UNIT[good] || [good, good];
  const n = amount => { const shown = Math.max(1, Math.floor(amount)); return `${shown} ${shown === 1 ? one : many}`; };
  const week = Math.round(want / SELLS_ON_DAYS * 7 * 10) / 10;
  if (tier < 0) return `${KEEPER_WORDS[trade]} has all the ${good} it can use, and sells on about ${week} ${week === 1 ? one : many} a week.`;
  if (tier === 0) return `${KEEPER_WORDS[trade]} is buying: full price for about ${n(want / 2 - held)} more, then half until it has ${n(want)}.`;
  return `${KEEPER_WORDS[trade]} is filling up: half price for about ${n(want - held)} more.`;
}
/** The price a payment fetches now, as the offer's own numbers: `{ coinEach, per, foodEach }`, or null when the shop is full. */
export function priceNow(world, siteId, trade, offer) {
  const market = MARKET[`${trade}:${offer.good}`];
  if (!market) return { coinEach: offer.coinEach, per: offer.per ?? 1, foodEach: offer.foodEach };
  const tier = tierAt(heldAt(world, siteId, `${trade}:${offer.good}`), wantAt(world, siteId, `${trade}:${offer.good}`));
  if (tier < 0) return null;
  return { per: 1, ...market.tiers[tier] };
}
/** Why the shop in this town will not take this good now, or null. */
export function marketRefusal(world, siteId, trade, good) {
  const key = `${trade}:${good}`;
  if (!MARKET[key]) return null;
  return tierAt(heldAt(world, siteId, key), wantAt(world, siteId, key)) < 0 ? marketWords(world, siteId, trade, good) : null;
}

/** Stored market state that could not have been written (sim/world.mjs `validateWorld`). */
export function marketsInvalid(world) {
  if (world.markets === undefined) return null;
  if (!world.markets || typeof world.markets !== 'object') return 'Invalid market';
  for (const [siteId, goods] of Object.entries(world.markets)) {
    if (!world.map?.sites?.[siteId] || !goods || typeof goods !== 'object') return 'Invalid market';
    for (const [key, entry] of Object.entries(goods)) {
      if (!MARKET[key] || !Number.isFinite(entry?.held) || entry.held < 0 || !Number.isFinite(entry.minute) || entry.minute < 0) return 'Invalid market';
    }
  }
  return null;
}
