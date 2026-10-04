/**
 * The errand to town: what to buy and sell is chosen before anybody leaves (owner, 2026-09-24; docs/TOWNS.md §4b).
 *
 * > "When sending someone to town to stores, there should be a popup first asking what they should buy or sell. (Currently
 * > I can't buy more seed.) They'll take priority on the wagon and take it so they can carry whatever it is they need to. If
 * > someone is using the wagon (or horse, or any item really), then no one else can use it."
 *
 * **Why the owner could not buy seed.** Until this, `visit-shop` walked a person to town and only then asked two questions -
 * which shop, and what at its counter - each of which a person waited two hours of 1835 for (`ASK_PATIENCE`) and then
 * answered alone, and alone they answered "come home again" and "nothing today". Two hours is six ticks: under a minute at
 * the study pace, six seconds at the quick one, and **no time at all for a person on auto**, whose questions are answered
 * the tick they are asked (sim/chores.mjs `advanceChore`). A student who had turned auto on, or was looking at anybody else
 * when the walker reached town, got the trip and never the seed; the journal said so in a line nobody was reading
 * (a solo game of 2026-09-21 shows it: auto switched on, sent to the shops, home with nothing).
 *
 * Now the list is the order. One command carries every line (`{ action: 'chore', chore: 'visit-shop', errand: [...] }`),
 * the server checks it before anything moves (`planErrand`), chooses how the person goes from the load, and at the shops
 * does what the list says, in its order (`carryOutErrand`). Nothing is asked in town.
 *
 * **What the list can hold** is what the family's own town deals in today: every offer of every shop standing there
 * (sim/shops.mjs `TRADES`), at the prices those shops ask, each line `{ id: 'trade:offer', n, pay: 'coin' | 'food' }`.
 * `n` counts purchases for what a shop sells (two seed a purchase), lots for what it buys (four food a real, a bale, a hide)
 * and food for the mill.
 *
 * **The order at the shops** (`inTurn`): what the family sells first, then the mill, then what it buys, each in the list's
 * order - so a sale pays for a purchase whichever of them the student put first.
 *
 * **What is checked when it is sent**, in that order and against what the family has now: the shop is standing there; the
 * offer is not refused (a sound hoe, a well person at the doctor's); the family has what it sells and can pay what it buys; one of each thing bought once; and the load fits a way
 * of going the family has free. **Not** checked: the keeper's purse, which is the keeper's business and found out at the
 * counter (owner, 2026-09-12, docs/MONEY_AND_GLORY.md §3).
 *
 * **What happens if things differ on arrival** (the honest rule, 2026-09-24, deterministic, no chance in it): what a shop sells
 * never changes price. What the store and the weaver pay for cotton and food does since 2026-09-28 (sim/market.mjs): they take
 * only what they can use and pay less as they fill, so the list is quoted at the price when it is sent and paid at the price
 * when the person gets there, if another family sold first. What else can differ is what the house holds - somebody at home ate the food meant to pay, a sibling
 * spent the coin - whether a keeper is still at the shop, and a keeper's purse. At each line, in turn, as many of it are
 * done as can still be paid for, and **nothing is paid for anything not received**; what was not done is said in the
 * family's story with the reason, and comes home again.
 *
 * **The load and the way of going.** Every good counts a load a unit, in the same units the house counts it (sim/travel.mjs
 * `carry`); coin weighs nothing; a tool, shoes, a saddle or blankets a load each; the rifle a load each way. The load is the
 * larger of what is carried to town (what is sold, food to pay with that no sale in town has already paid, corn for the mill)
 * and what is carried home (what was bought, and the food that is left in hand). The person
 * goes **the quickest way that carries it** that the family has free (`userOf`, sim/keeping.mjs): the horse, then on foot,
 * then the ox and wagon. The wheelwright works on the wagon itself, so a list with him takes the wagon. The popup shows the
 * server's own sentence for it ("Takes the wagon: 14 of 20 loads").
 *
 * Prices, loads and effects are the shops' own, all invented (`FIC-GONZ-038`); the load of a bought thing is `FIC-GONZ-387`.
 * ceiling: what is bought is the family's at the counter, as every errand has always paid out (the house is one ledger); the
 * goods are not carried as a separate load that could be lost on the road home. A load held on the road is the way out.
 */
import { record } from './events.mjs';
import { MILL_RETURN, OUTSIDE_PURSE, TRADES, counterRefusal, tradesAt } from './shops.mjs';
import { marketSale, marketWords, priceNow, recordSale } from './market.mjs';
import { MODES } from './travel.mjs';
import { hasWords, holderOf, userOf } from './keeping.mjs';
import { toolWords } from './tools.mjs';
import { LEAD_MOST, LEAD_PACE, beastWords, beastsOf, kept, wagonWith } from './beasts.mjs';
import { herdOf, herdWords, hasStock, salePrice, sellStock } from './stock.mjs';
import { shownWays, waysFor } from './going.mjs';
import { purseOf } from './town.mjs';
// Clothes that want washing (owner, 2026-10-03; sim/housework.mjs): the shops ask a quarter more and pay a fifth less.
import { askedOf, dearerWhy, paidTo } from './housework.mjs';

/** The longest list one person can be sent with, and the most of one line. ceiling: plenty for a class; a cap, not a rule. */
export const ERRAND_LINES = 12;
export const LINE_MOST = 20;
/** What the family's stock line shows beside the list, and what the list can move. */
export const STOCK = Object.freeze(['food', 'seed', 'powder', 'money', 'cotton', 'hides']);

const round = value => Math.round(value * 10000) / 10000;
/** "2 seed", "1 hide", "3 hides": an amount of a good as the list and the story say it (a rawhide from the tanner, 2026-09-30). */
const goodWords = (good, amount) => `${amount} ${good === 'hides' && amount === 1 ? 'hide' : good}`;
const reales = amount => `${amount} ${amount === 1 ? 'real' : 'reales'}`;
const loads = amount => { const shown = Math.round(amount * 10) / 10; return `${shown} ${shown === 1 ? 'load' : 'loads'}`; };
const cap = text => text.charAt(0).toUpperCase() + text.slice(1);
/** "1 head of cattle", "3 cattle", "1 hog": the family's own stock as a line says it. */
const headWords = (kind, n) => (kind === 'cattle' ? (n === 1 ? 'head of cattle' : 'cattle') : n === 1 ? 'hog' : 'hogs');
/** The family's own town: sim/chores.mjs `townOf`, written out here because that module imports this one. */
const townOf = household => household.settlementId || 'gonzales';
const MODE_WORDS = Object.freeze({ foot: 'Goes on foot', horse: 'Rides the horse', mule: 'Rides the mule', wagon: 'Takes the wagon' });

const parse = id => { const [trade, offerId] = String(id || '').split(':'); const offer = TRADES[trade]?.offers.find(o => o.id === offerId); return offer ? { trade, offer } : null; };
// Coin first: the popup presses the first way before the student chooses (public/errand.js `errandList`), so a sale is paid in
// coin unless the student chooses food (owner, 2026-09-27).
const pays = offer => offer.kind === 'service' ? [] : offer.kind === 'sell'
  ? ['coin', 'food'].filter(pay => Number.isFinite(pay === 'coin' ? offer.coin : offer.food) && (pay === 'coin' ? offer.coin : offer.food) > 0)
  : ['coin', 'food'].filter(pay => pay === 'coin' ? offer.coinEach > 0 : offer.foodEach > 0);
const per = offer => offer.per ?? 1;
/** The offer at what this person is asked for it in the state of their clothes (sim/housework.mjs `askedOf`); the offer itself when clean. */
function dearOffer(world, entity, offer) {
  const coin = Number.isFinite(offer.coin) ? askedOf(world, entity, offer.coin, 'coin') : offer.coin;
  const food = Number.isFinite(offer.food) ? askedOf(world, entity, offer.food, 'food') : offer.food;
  return coin === offer.coin && food === offer.food ? offer : { ...offer, coin, food };
}
/** The most of one line: a thing bought once (the doctor, shoes) one; a tool its shop's own most (sim/shops.mjs); else plenty. */
const mostOf = offer => offer.most ?? (offer.kind === 'sell' && offer.once ? 1 : LINE_MOST);
/** What one of this line is: a purchase, a lot sold, or a food ground. */
function eachWords(offer) {
  if (offer.kind === 'service') return '1 food ground';
  if (offer.herd) return `1 ${headWords(offer.herd, 1)}`;
  if (offer.kind === 'buy') return per(offer) === 1 ? `1 ${offer.good === 'cotton' ? 'bale' : offer.good === 'hides' ? 'hide' : offer.good}` : `${per(offer)} ${offer.good}`;
  return offer.brings ? Object.entries(offer.brings).map(([good, amount]) => goodWords(good, amount)).join(', ') : null;
}
function priceWords(offer, now = null) {
  if (offer.kind === 'service') return 'the miller takes his toll in meal';
  if (offer.kind === 'buy') {
    // What the store or the weaver pays now, as it fills (sim/market.mjs): the base lot at today's price.
    const price = now || offer;
    const got = pays(offer).map(pay => pay === 'coin' ? `${reales(price.coinEach)}${(price.per ?? 1) !== per(offer) ? ` for every ${price.per}` : ''}` : `${Math.round(price.foodEach * per(offer) * 100) / 100} food`);
    return `pays ${got.join(' or ')} for ${eachWords(offer)}`;
  }
  return pays(offer).map(pay => pay === 'coin' ? reales(offer.coin) : `${offer.food} food`).join(' or ') + (offer.brings ? ` for ${eachWords(offer)}` : '');
}
/**
 * The order the shops are dealt with in: everything the family sells first, then the mill, then everything it buys, each in
 * the list's own order - as anybody with a crop to sell and things to buy goes about a town, so the coin or food a sale
 * brings can pay for what is bought after it. Deterministic; a list read in this order is the list as it is done.
 */
const TURN = Object.freeze({ buy: 0, service: 1, sell: 2 });
// A new wagon last of all: the ox that draws it is bought first, whichever the student put first (sim/shops.mjs `buy-wagon`).
const turnOf = offer => offer?.newWagon ? 3 : TURN[offer?.kind] ?? 0;
const inTurn = list => list.map((line, at) => ({ line, at, turn: turnOf(parse(line?.id)?.offer) }))
  .sort((a, b) => a.turn - b.turn || a.at - b.at).map(({ line }) => line);
/** Whoever keeps this shop in this town now, or null: the keeper who deals in it, standing there and well (sim/shops.mjs `tradesAt`). */
const keeperAt = (world, siteId, trade) => Object.values(world.entities).find(entity => entity.deals?.includes(trade)
  && entity.location?.siteId === siteId && entity.health?.condition === 'well') || null;

/**
 * What the family's own town deals in today, as the popup lists it: every offer of every shop standing there, its price and
 * what one of it is, the most the list may hold of it, and why it cannot be had at all right now (the shop's own refusal).
 * Nothing here is another family's: the town's shops are on the public map, and the stock is this family's own.
 */
export function errandOffers(world, household, entity, town = null) {
  const siteId = town || townOf(household), site = world.map.sites[siteId];
  const lines = [];
  for (const trade of tradesAt(world, siteId)) {
    for (const offer of TRADES[trade].offers) {
      // A shop that has all it can use of what it buys is shut to it, and says how fast it sells on (sim/market.mjs).
      // The family's own stock is paid by its flesh today (sim/stock.mjs `salePrice`), not by a market.
      const flesh = offer.herd ? salePrice(world, household, offer.herd) : null;
      const now = flesh ? { coinEach: flesh.each, per: 1 } : offer.kind === 'buy' ? priceNow(world, siteId, trade, offer) : null;
      const shut = offer.refuse(world, household, entity)
        || (offer.kind === 'buy' && !now ? marketWords(world, siteId, trade, offer.good) : null)
        || (offer.takes && userOf(world, household, offer.takes, entity) ? hasWords(userOf(world, household, offer.takes, entity), [offer.takes], world, entity) : null);
      const most = mostOf(offer);
      // What this person is asked, in the state of their clothes (`askedOf`): the dearer price on the line, and the plain one beside it.
      const asked = offer.kind === 'sell' ? dearOffer(world, entity, offer) : offer;
      const dear = asked !== offer;
      const market = flesh ? `The ${offer.herd} are ${flesh.condition} today.` : offer.kind === 'buy' ? marketWords(world, siteId, trade, offer.good) : null;
      lines.push({
        id: `${trade}:${offer.id}`, trade, shop: cap(TRADES[trade].shop), keeper: keeperAt(world, siteId, trade)?.name || null,
        label: offer.label, kind: offer.kind, does: market ? `${offer.does} ${market}` : offer.does,
        price: dear ? `${priceWords(asked, now)} (${priceWords(offer, now).replace(/ for .*$/, '')} to a clean customer)` : priceWords(offer, now), each: eachWords(offer), pays: pays(offer), most,
        ...(shut && { why: shut }), ...((dear || (offer.kind === 'buy' && dearerWhy(world, entity))) && { dear: true }),
      });
    }
  }
  const dearer = dearerWhy(world, entity);
  return { town: { id: siteId, name: site?.name || 'town' }, lines, ...(dearer && { dearer }), stock: stockOf(household), tools: toolWords(household), animals: animalsOf(world, household), carry: Object.fromEntries(Object.values(MODES).map(mode => [mode.id, mode.carry])) };
}
const stockOf = household => Object.fromEntries(STOCK.map(good => [good, round(household.resources?.[good] ?? 0)]));
/** The family's animals as the popup's stock line says them (sim/beasts.mjs): "2 horses", "an ox", and the herd on the range. */
const animalsOf = (world, household) => [...beastWords(world, household), ...(hasStock(household) ? [`${herdWords(household)} on the range`] : [])];

/**
 * Check a list against what the family has now, in its order, without changing anything. Returns the lines as they would be
 * done, the load there and back, the family's stock after, and the first reason it cannot be sent, if there is one.
 */
function reckon(world, household, entity, list, town = null) {
  if (!Array.isArray(list) || !list.length) return { why: 'Choose something to buy or sell first.' };
  if (list.length > ERRAND_LINES) return { why: `One person can be sent with at most ${ERRAND_LINES} things on the list.` };
  if (town !== null && (typeof town !== 'string' || !world.map.sites[town] || !tradesAt(world, town).length)) return { why: 'Nobody keeps shop there.' };
  const siteId = town || townOf(household), open = new Set(tradesAt(world, siteId)), seen = new Set();
  const have = stockOf(household);
  const lines = [];
  // What is carried: `out` is everything taken from the house to town; `pack` is what is in hand in town, which is what comes
  // home. Food paid at a counter comes out of the pack first - the food a sale in town has just paid - and from the house
  // only for the rest, so a family selling cotton for food and buying seed with it carries home only what is left.
  let out = 0, wagon = false, newWagon = false;
  const pack = { food: 0, other: 0 };
  // What comes home on the hoof (sim/beasts.mjs): a horse or an ox led on a halter, cattle and hogs driven. None of it is a load.
  const leads = [], drives = {};
  // The family's own stock driven in to sell (`herd` lines), against what is on the range.
  const herdLeft = { ...herdOf(household) }, sells = {};
  const foodFrom = amount => { const inHand = Math.min(pack.food, amount); pack.food = round(pack.food - inHand); out += amount - inHand; };
  for (const raw of inTurn(list)) {
    const found = parse(raw?.id);
    if (!found) return { why: 'That is not sold in this town.' };
    const { trade, offer } = found;
    const shop = TRADES[trade].shop, name = world.map.sites[siteId]?.name || 'town';
    if (!open.has(trade)) return { why: `Nobody keeps ${shop} in ${name} today.` };
    if (seen.has(raw.id)) return { why: `${offer.label} is on the list twice.` };
    seen.add(raw.id);
    const n = Number(raw.n);
    const most = mostOf(offer);
    if (!Number.isInteger(n) || n < 1) return { why: `Say how many of "${offer.label}", in whole numbers.` };
    if (n > most) return { why: most === 1 ? `${offer.label}: one is all anybody needs.` : `${offer.label}: at most ${most} on one trip.` };
    const payWays = pays(offer);
    // A sale the list does not say how to be paid for is paid in coin (owner, 2026-09-27: "Make coin the default"), as the popup
    // presses Coin before the student chooses (`pays` puts it first). A purchase must still say how it is paid.
    const pay = payWays.length ? String(raw.pay || (offer.kind === 'buy' && payWays.includes('coin') ? 'coin' : '')) : null;
    if (payWays.length && !payWays.includes(pay)) return { why: payWays.length === 1 ? `${offer.label} is paid in ${payWays[0]} only.` : `${offer.label}: say whether it is paid in ${payWays.join(' or ')}.` };
    const refused = offer.refuse(world, household, entity);
    if (refused) return { why: refused };
    if (offer.takes) { const holder = userOf(world, household, offer.takes, entity); if (holder) return { why: hasWords(holder, [offer.takes], world, entity) }; }
    if (offer.needsMode === 'wagon') wagon = true;
    if (offer.newWagon) newWagon = true;
    const line = { id: raw.id, n, ...(pay && { pay }) };
    if (offer.kind === 'sell') {
      const price = askedOf(world, entity, pay === 'coin' ? offer.coin : offer.food, pay), purse = pay === 'coin' ? 'money' : 'food';
      if (have[purse] + 1e-9 < price * n) return { why: pay === 'coin' ? `${offer.label} ${n > 1 ? `${n} times ` : ''}costs ${reales(price * n)}, and there will not be that much coin in the house.` : `${offer.label} ${n > 1 ? `${n} times ` : ''}costs ${price * n} food, and there will not be that much food to pay with.` };
      have[purse] = round(have[purse] - price * n);
      if (pay === 'food') foodFrom(price * n);
      for (const [good, amount] of Object.entries(offer.brings || {})) { have[good] = round((have[good] ?? 0) + amount * n); pack.other += amount * n; }
      pack.other += (offer.load ?? 0) * n;
      out += (offer.carried ?? 0) * n;
      if (offer.leads) for (let i = 0; i < n; i++) leads.push(offer.leads);
      for (const [kind, head] of Object.entries(offer.drives || {})) drives[kind] = (drives[kind] || 0) + head * n;
      lines.push({ ...line, costs: pay === 'coin' ? reales(price * n) : `${price * n} food`, ...(offer.brings && { gives: Object.entries(offer.brings).map(([good, amount]) => goodWords(good, amount * n)).join(', ') }) });
    } else if (offer.herd) {
      // The family's own stock sold at the pens (owner, 2026-10-03; sim/stock.mjs `sellStock`): out of the herd, never a load - it
      // is driven to town at its own pace (`sells`) - and paid by the head at the flesh it is in today.
      const kind = offer.herd;
      if ((herdLeft[kind] ?? 0) < n) return { why: `There ${herdLeft[kind] === 1 ? 'is' : 'are'} only ${herdLeft[kind] ?? 0} ${headWords(kind, herdLeft[kind] ?? 0)} ${kind === 'cattle' ? 'on the range' : 'in the timber'} to sell.` };
      herdLeft[kind] -= n;
      sells[kind] = (sells[kind] || 0) + n;
      const { each, condition } = salePrice(world, household, kind);
      have.money = round(have.money + each * n);
      lines.push({ ...line, gives: reales(each * n), costs: `${n} ${headWords(kind, n)}, ${condition}` });
    } else if (offer.kind === 'buy') {
      const units = n * per(offer);
      if (have[offer.good] + 1e-9 < units) return { why: `There will not be ${units} ${offer.good} in the house to sell.` };
      // What the shop will take and pay today, as it fills (sim/market.mjs); what it will not take comes home again.
      const sale = marketSale(world, siteId, trade, offer, units, pay);
      if (sale.sold <= 0) return { why: sale.full ? marketWords(world, siteId, trade, offer.good) : `${offer.label}: the ${shop.replace(/^the /, '')} will not pay for so little.` };
      have[offer.good] = round(have[offer.good] - sale.sold);
      if (offer.good === 'food') { foodFrom(units); pack.food += round(units - sale.sold); } else { out += units; pack.other += round(units - sale.sold); }
      const got = sale.got;
      if (pay === 'coin') have.money = round(have.money + got); else { have.food = round(have.food + got); pack.food += got; }
      lines.push({ ...line, gives: pay === 'coin' ? reales(got) : `${got} food`, costs: `${sale.sold} ${offer.good}`, ...(sale.sold < units && { back: `${round(units - sale.sold)} ${offer.good} would come home: ${sale.full ? `${cap(TRADES[trade].shop)} would have all it can use` : 'not enough for another payment'}.` }) });
    } else {
      if (have.food + 1e-9 < n) return { why: `There will not be ${n} food in the house to take to the mill.` };
      const back = round(n * MILL_RETURN);
      have.food = round(have.food - n + back);
      foodFrom(n); pack.food += back;
      lines.push({ ...line, costs: `${n} food`, gives: `${back} food as meal` });
    }
  }
  // A new wagon (owner, 2026-09-25; sim/shops.mjs `buy-wagon`): an ox draws it home, so one is bought on the same list and yoked
  // to it rather than led; the wheelwright cannot both work on the wagon brought in and send the buyer home in a new one.
  if (newWagon) {
    if (wagon) return { why: 'The wheelwright puts in order the wagon that is brought to him, and a new wagon is fetched by somebody on foot or riding. Send them separately.' };
    const ox = leads.indexOf('ox');
    if (ox < 0) return { why: 'A new wagon has to be drawn home, and an ox draws it. Put an ox from the stock pens on the list too.' };
    leads.splice(ox, 1);
  }
  if (leads.length > LEAD_MOST) return { why: 'One person can lead one animal home: a horse, a mule or an ox, not two. Send somebody else for the other.' };
  const home = pack.food + pack.other;
  // What is bought comes home in the new wagon, so only what is carried to town has to fit the way there.
  if (newWagon && home > MODES.wagon.carry + 1e-9) return { why: `That is ${loads(home)} to bring home, and the new wagon carries ${MODES.wagon.carry}. Send less.` };
  return { lines, out: round(out), home: round(home), load: round(newWagon ? out : Math.max(out, home)), after: have, wagon, newWagon, leads, drives, sells, town: siteId };
}

/**
 * The way this person would go with this load: the quickest of the family's ways of going that carries it and is free for
 * them, with the server's sentence for it. `modeAvailability` is sim/world.mjs's, handed in (this module is imported by
 * sim/chores.mjs, which that one imports).
 */
function chooseMode(world, household, entity, load, needsWagon, modeAvailability, trip = {}) {
  const ways = waysOf(world, household, entity, load, needsWagon, modeAvailability, trip);
  const open = ways.find(way => way.can);
  if (open) {
    // Why this way and not a quicker one: the wagon itself is the errand, the load is more than the horse carries, or the
    // quicker way is somebody else's today (their name, and what they are doing with it).
    const passed = ways.slice(0, ways.indexOf(open)).find(way => way.why && !way.tooMuch)?.why;
    // More than the quicker ways carry: the horse, and the mule when the family has one (2026-10-03).
    const mount = ways.some(way => way.id === 'mule') && load <= MODES.mule.carry + 1e-9 ? null : ways.some(way => way.id === 'mule') ? 'mule' : 'horse';
    const why = needsWagon ? ', and the wheelwright works on the wagon itself'
      : open.id === 'wagon' && load > MODES.horse.carry && mount ? `, more than the ${mount} carries (${MODES[mount].carry})`
        : open.id === 'mule' && load > MODES.horse.carry ? `, more than the horse carries (${MODES.horse.carry})`
          : passed ? `. ${passed}` : '';
    return { mode: open.id, how: `${MODE_WORDS[open.id]}: ${Math.round(load * 10) / 10} of ${open.carry ?? MODES[open.id].carry} loads${why}${why.endsWith('.') ? '' : '.'}`, ways };
  }
  if (!needsWagon && load > MODES.wagon.carry) return { why: `That is ${loads(load)}, and the wagon carries ${MODES.wagon.carry}. Send less.`, ways };
  // Nothing free carries it: said with every reason, in the holders' own names, and what the student can do about it.
  const refused = ways.filter(way => way.why && !way.tooMuch && !way.notTheWagon).map(way => way.why);
  // A family with a mule (2026-10-03): a load the horse cannot carry may still go on the mule, and the words say so.
  const mule = ways.some(way => way.id === 'mule');
  const wants = needsWagon ? 'The wheelwright works on the wagon itself, so this wants the wagon'
    : mule && load > MODES.horse.carry && load <= MODES.mule.carry ? `This wants the mule or the wagon: ${loads(load)}, and the horse carries ${MODES.horse.carry}`
      : load > (mule ? MODES.mule.carry : MODES.horse.carry) ? `This wants the wagon: ${loads(load)}, and the ${mule ? 'mule' : 'horse'} carries ${mule ? MODES.mule.carry : MODES.horse.carry}`
        : `This is more than can be carried on foot: ${loads(load)}, and a person carries ${MODES.foot.carry}`;
  const waitFor = needsWagon || load > (mule ? MODES.mule.carry : MODES.horse.carry) ? 'the wagon is free'
    : mule && load > MODES.horse.carry ? 'the mule or the wagon is free'
      : mule ? 'the horse, the mule or the wagon is free' : 'the horse or the wagon is free';
  // A family with no vehicle at all (sim/means.mjs; owner, 2026-09-25: "it shouldn't block gameplay, but some things might have to
  // happen slower") is not told to wait for a wagon it has not got: it goes more than once.
  if (!needsWagon && !beastsOf(world, household, 'wagon').some(kept)) return { why: `${wants}. ${refused.join(' ')} Send a smaller load, and go again for the rest.`, ways };
  return { why: `${wants}. ${refused.join(' ') || 'The wagon cannot go.'} Send a smaller load, or wait until ${waitFor}.`, ways };
}
/** The quicker way, as a sentence starts it. */
const QUICKER = Object.freeze({ foot: 'Walking', horse: 'The horse', mule: 'The mule', wagon: 'The wagon' });
/**
 * Every way this person could go with this load, quickest first (owner, 2026-09-24: the popup suggests the quickest, and the
 * student may choose any slower way that still carries it and is free): whether each is open, and the server's reason when
 * it is not - too small for the load, the wheelwright's work wanting the wagon, somebody else having it, no road. The same
 * reckoning every journey is asked (sim/going.mjs `waysFor`; owner, 2026-09-24: "the game should ask how they'll travel").
 */
function waysOf(world, household, entity, load, needsWagon, modeAvailability, { town = null, home = null, newWagon = false, leadsHorse = false } = {}) {
  return waysFor(world, entity, { to: town || townOf(household), load, needsWagon, ...(home && { home }), ...(newWagon && { newWagon, leadsHorse }), noRoad: id => `There is no road to town for the ${id}.` }, modeAvailability);
}
/**
 * What comes home on the hoof, and the pace it holds its bringer to (sim/beasts.mjs `LEAD_PACE`): "Leads the new horse home on a
 * halter." "Leads the new ox home, at an ox's pace." "Drives 2 cattle and 3 hogs home, at an ox's pace." Null when nothing does.
 */
function homeOf(leads = [], drives = {}, newWagon = false) {
  const parts = [
    // The new wagon behind the new ox, at the wagon's pace (sim/travel.mjs `WAGON_SPEED`, the same as a led ox's).
    ...(newWagon ? ['drives the new wagon home behind the new ox'] : []),
    ...leads.map(role => `leads the new ${role} home${role === 'horse' || role === 'mule' ? ' on a halter' : ''}`),
    ...(Object.keys(drives).length ? [`drives ${Object.entries(drives).map(([kind, head]) => `${head} ${kind === 'cattle' ? 'cattle' : head === 1 ? 'hog' : 'hogs'}`).join(' and ')} home`] : []),
  ];
  if (!parts.length) return null;
  const paces = [...(newWagon ? [LEAD_PACE.ox] : []), ...leads.map(role => LEAD_PACE[role]), ...Object.keys(drives).map(kind => LEAD_PACE[kind])].filter(Number.isFinite);
  const pace = paces.length ? Math.min(...paces) : null;
  return { pace, words: `${cap(parts.join(' and '))}${pace ? ", at an ox's pace" : ''}.` };
}

/**
 * What the popup shows for a list: whether it can be sent and why not, the load, every way of going with the server's reason
 * for any that cannot (`ways`), the quickest that can (`quickest`, the popup's suggestion), how the person would go and why,
 * each line as it would be done, and the family's stock after. `mode` is the way the student chose, if they chose one: any
 * that carries the load and is free (owner, 2026-09-24), and refused in that way's own words if not. The same reckoning the
 * order is refused by, so the popup and the refusal can never disagree.
 */
export function errandQuote(world, household, entity, list, { modeAvailability, mode = null, town = null } = {}) {
  const reckoned = reckon(world, household, entity, list, town);
  if (reckoned.why) return { can: false, why: reckoned.why, stock: stockOf(household) };
  const home = homeOf(reckoned.leads, reckoned.drives, reckoned.newWagon);
  const way = chooseMode(world, household, entity, reckoned.load, reckoned.wagon, modeAvailability, { town: reckoned.town, home, newWagon: reckoned.newWagon, leadsHorse: reckoned.leads.some(role => role === 'horse' || role === 'mule') });
  const ways = shownWays(way.ways);
  const base = { load: reckoned.load, lines: reckoned.lines, stock: stockOf(household), after: reckoned.after, ways, ...(way.mode && { quickest: way.mode }), ...(home && { home: home.words }) };
  // The family's own stock driven in to sell (owner, 2026-10-03): said, at the pace it holds the drover to on the way there.
  const sold = Object.entries(reckoned.sells || {});
  const there = sold.length ? ` Drives ${sold.map(([kind, n]) => `${n} ${headWords(kind, n)}`).join(' and ')} to the stock pens, at an ox's pace.` : '';
  const andHome = `${there}${home ? ` ${home.words}` : ''}`;
  if (mode && mode !== way.mode) {
    const chosen = ways.find(one => one.id === mode);
    if (!chosen) return { ...base, can: false, why: 'No such way of going.' };
    if (!chosen.can) return { ...base, can: false, mode, why: chosen.why };
    const slower = way.mode ? ` ${QUICKER[way.mode]} would be quicker.` : "";
    return { ...base, can: true, mode, how: `${MODE_WORDS[mode]}: ${Math.round(reckoned.load * 10) / 10} of ${chosen.carry ?? MODES[mode].carry} loads, as you chose.${slower}${andHome}` };
  }
  return { ...base, can: !way.why, ...(way.why && { why: way.why }), ...(way.mode && { mode: way.mode, how: `${way.how}${andHome}` }) };
}

/**
 * The order's own check, before anything moves (sim/chores.mjs `beginChore`, through the chore's `plan`). Throws the
 * popup's own sentence; returns how the person goes and the list as it will be done.
 */
export function planErrand(world, household, entity, list, deps = {}) {
  const quote = errandQuote(world, household, entity, list, deps);
  if (!quote.can) throw new Error(quote.why);

  // Another town than the family's own (the director sending for a rifle to the nearest gunsmith, sim/neighbours.mjs): kept on the
  // work, so its road goes there. The family's own town is not written down, as it never was.
  const town = deps.town && deps.town !== townOf(household) ? deps.town : null;
  return { mode: quote.mode, errand: quote.lines.map(({ id, n, pay }) => ({ id, n, ...(pay && { pay }) })), ...(town && { town }) };
}

/**
 * At the shops: every line of the list, in its order, as far as it can still be done now (the honest rule above). One line
 * of the family's story for each, with the coin it moved for the ending's account, and a second line for anything short.
 */
export function carryOutErrand(world, household, entity, state) {
  const siteId = entity.location?.siteId;
  let carried = false;
  for (const line of inTurn(state.errand || [])) {
    const found = parse(line.id);
    if (!found) continue;
    const { trade, offer } = found, shop = TRADES[trade].shop;
    const keeper = keeperAt(world, siteId, trade);
    const say = (text, extra = {}) => record(world, 'consequence', { actorId: entity.id, householdId: household.id, importance: 2, ...extra, text });
    if (!keeper) { say(`${entity.name} found nobody keeping ${shop}, and nothing was done there.`); continue; }
    if (offer.kind === 'sell') {
      let done = 0, why = null, paidOut = 0;
      for (let i = 0; i < line.n; i++) {
        const asked = askedOf(world, entity, line.pay === 'coin' ? offer.coin : offer.food, line.pay);
        why = counterRefusal(world, household, entity, `${trade}:${offer.id}:${line.pay}`)
          || ((household.resources[line.pay === 'coin' ? 'money' : 'food'] ?? 0) + 1e-9 < asked ? (line.pay === 'coin' ? `It costs ${reales(asked)} to ${entity.name} in those clothes, and there is not that much coin in the house.` : `It costs ${asked} food to ${entity.name} in those clothes, and there is not that much food to pay with.`) : null)
          || (offer.takes && userOf(world, household, offer.takes, entity) ? hasWords(userOf(world, household, offer.takes, entity), [offer.takes], world, entity) : null);
        if (why) break;
        if (line.pay === 'coin') { household.resources.money = (household.resources.money ?? 0) - asked; keeper.purse = purseOf(world, keeper) + asked; }
        else household.resources.food = round((household.resources.food ?? 0) - asked);
        paidOut += asked;
        const told = offer.give(world, household, entity);
        if (!offer.brings) record(world, 'property', { actorId: entity.id, householdId: household.id, importance: 2, text: told });
        done++;
      }
      if (done) {
        carried ||= Boolean(offer.brings || offer.load);
        const paid = line.pay === 'coin' ? reales(paidOut) : `${round(paidOut)} food`;
        const plain = (line.pay === 'coin' ? offer.coin : offer.food) * done;
        // Dearer for the state of their clothes (sim/housework.mjs `askedOf`): said, with what it would have been.
        const dearer = paidOut > plain + 1e-9 ? ` - ${line.pay === 'coin' ? reales(plain) : `${plain} food`} to a clean customer, but ${keeper.name} looked at ${entity.name}'s clothes and asked more` : '';
        const text = offer.brings ? `${entity.name} bought ${Object.entries(offer.brings).map(([good, amount]) => goodWords(good, amount * done)).join(', ')} at ${shop} for ${paid}${dearer}.` : `${entity.name} paid ${paid} at ${shop}${dearer}.`;
        say(text, line.pay === 'coin' ? { coin: -paidOut, ...(dearer && { claimId: 'FIC-GONZ-1156' }) } : dearer ? { claimId: 'FIC-GONZ-1156' } : {});
      }
      if (done < line.n) say(`${entity.name} could ${done ? `do only ${done} of ${line.n}` : 'not'}: ${offer.label.toLowerCase()} - ${why || 'it could not be done'}${done ? '' : ' Nothing was paid for it.'}`);
      continue;
    }
    if (offer.herd) {
      // The family's own stock at the pens (sim/stock.mjs `sellStock`): as many of those driven in as the herd still has, at the
      // flesh they are in, coin outside the keeper's purse. They are off the drover's hands either way: what was not sold walks home.
      const kind = offer.herd, sale = sellStock(world, household, kind, line.n);
      if (entity.drives?.[kind]) {
        const left = entity.drives[kind] - line.n;
        if (left > 0) entity.drives[kind] = left; else delete entity.drives[kind];
        if (!Object.keys(entity.drives).length) delete entity.drives;
      }
      if (sale.sold) {
        household.resources.money = (household.resources.money ?? 0) + sale.got;
        say(`${entity.name} sold ${sale.sold} ${headWords(kind, sale.sold)}, ${sale.condition}, to ${keeper.name} at the stock pens for ${reales(sale.got)}.`, { coin: sale.got, claimId: 'FIC-GONZ-1134' });
      }
      if (sale.sold < line.n) say(`There ${herdOf(household)[kind] === 1 ? 'was' : 'were'} only ${sale.sold} of the ${line.n} ${headWords(kind, line.n)} to sell by then.`);
      continue;
    }
    if (offer.kind === 'buy') {
      const wanted = line.n, lot = per(offer);
      const inHouse = Math.floor((household.resources[offer.good] ?? 0) / lot + 1e-9);
      let lots = Math.min(wanted, inHouse), short = lots < wanted ? `there were only ${inHouse * lot} ${offer.good} in the house by then` : null;
      const outside = OUTSIDE_PURSE[trade]?.includes(offer.good);
      // What the shop takes today, at what it pays as it fills (sim/market.mjs), and no more than a keeper's own purse can pay.
      const purse = line.pay === 'coin' && !outside ? purseOf(world, keeper) : Infinity;
      const sale = marketSale(world, siteId, trade, offer, lots * lot, line.pay, { coinLimit: purse });
      if (sale.sold > 0) recordSale(world, siteId, trade, offer.good, sale.sold);
      // Said after the sale is written down, so the words are the shop as the person left it: full, and how fast it sells on.
      if (sale.full && sale.sold < lots * lot) short = marketWords(world, siteId, trade, offer.good).replace(/\.$/, '');
      else if (sale.sold < lots * lot && Number.isFinite(purse)) short = `${keeper.name} had coin for only ${sale.sold === 0 ? 'none of it' : `${sale.sold} ${offer.good}`}`;
      // A fifth less to somebody whose clothes want washing (sim/housework.mjs `paidTo`), on the whole sale, rounded.
      const fair = sale.got;
      if (sale.sold > 0) sale.got = paidTo(world, entity, sale.got, line.pay);
      const less = sale.got < fair - 1e-9 ? ` - ${line.pay === 'coin' ? reales(fair) : `${fair} food`} to a clean customer, and less for the state of ${entity.name}'s clothes` : '';
      if (sale.sold > 0) {
        const units = sale.sold;
        household.resources[offer.good] = round((household.resources[offer.good] ?? 0) - units);
        if (line.pay === 'coin') {
          const got = sale.got;
          if (!outside) keeper.purse -= got;
          household.resources.money = (household.resources.money ?? 0) + got;
          say(`${entity.name} sold ${units} ${offer.good} to ${keeper.name} for ${reales(got)}${less}.`, { coin: got });
        } else {
          const got = sale.got;
          household.resources.food = round((household.resources.food ?? 0) + got);
          carried = true;
          say(`${entity.name} sold ${units} ${offer.good} to ${keeper.name} for ${got} food${less}.`);
        }
      }
      if (short) say(`${cap(short)}, and ${sale.sold > 0 ? 'the rest' : `the ${offer.good}`} came home again.`);
      continue;
    }
    // The mill: corn carried in, meal carried home, the miller's toll taken in meal.
    const units = Math.min(line.n, Math.floor((household.resources.food ?? 0) + 1e-9));
    if (units < 1) { say(`${entity.name} had no corn left to take to the mill.`); continue; }
    const gained = round(units * (MILL_RETURN - 1));
    household.resources.food = round((household.resources.food ?? 0) + gained);
    carried = true;
    say(`${entity.name} had ${units} food ground at the mill, and it goes ${gained} further as meal.${units < line.n ? ` There was not the ${line.n} food meant for it.` : ''}`);
  }
  // A wagon with something in it is drawn with something in it, and is emptied in the yard (sim/world.mjs `progressTravel`).
  if (carried && state.mode === 'wagon') {
    // The wagon they came with, of however many the family owns (sim/beasts.mjs `wagonWith`).
    const wagon = wagonWith(world, entity, holderOf);
    if (wagon?.borrowedBy === entity.id) wagon.laden = true;
  }
}

/**
 * The family's own stock an errand drives in to sell, by kind (owner, 2026-10-03): written on the drover as the errand begins
 * (`entity.drives`, sim/beasts.mjs), so the road to town goes at the cattle's pace as the road home does with stock bought, and taken
 * off them at the pens (`carryOutErrand`).
 */
export function herdDrivenIn(errand = []) {
  const sells = {};
  for (const line of errand) {
    const kind = parse(line?.id)?.offer?.herd;
    if (kind) sells[kind] = (sells[kind] || 0) + line.n;
  }
  return sells;
}

/** A stored errand that could not have been sent (sim/world.mjs `validateWorld`). */
export function errandsInvalid(world) {
  for (const entity of Object.values(world.entities)) {
    const list = entity.chore?.errand;
    if (list === undefined) continue;
    if (entity.chore.id !== 'visit-shop' || !Array.isArray(list) || !list.length || list.length > ERRAND_LINES) return 'Invalid errand';
    if (entity.chore.town !== undefined && (typeof entity.chore.town !== 'string' || !world.map.sites[entity.chore.town])) return 'Invalid errand';
    for (const line of list) {
      const found = parse(line?.id);
      if (!found || !Number.isInteger(line.n) || line.n < 1 || line.n > LINE_MOST) return 'Invalid errand';
      if (pays(found.offer).length ? !pays(found.offer).includes(line.pay) : line.pay !== undefined) return 'Invalid errand';
    }
  }
  return null;
}
