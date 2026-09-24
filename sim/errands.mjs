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
 * `n` counts purchases for what a shop sells (two seed a purchase), lots for what it buys (five food a real, a bale, a hide)
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
 * **What happens if things differ on arrival** (the honest rule, 2026-09-24, deterministic, no chance in it): prices never
 * move, so a price cannot differ. What can is what the house holds - somebody at home ate the food meant to pay, a sibling
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
import { MILL_RETURN, TRADES, counterRefusal, tradesAt } from './shops.mjs';
import { DEFAULT_MODE, MODES, propertyId } from './travel.mjs';
import { hasWords, userOf } from './keeping.mjs';
import { findWay } from './ways.mjs';
import { purseOf } from './town.mjs';

/** The longest list one person can be sent with, and the most of one line. ceiling: plenty for a class; a cap, not a rule. */
export const ERRAND_LINES = 12;
export const LINE_MOST = 20;
/** What the family's stock line shows beside the list, and what the list can move. */
export const STOCK = Object.freeze(['food', 'seed', 'powder', 'money', 'cotton', 'hides']);
/** The store buys a family's cotton and food for coin outside its purse (owner, 2026-09-16, docs/MONEY_AND_GLORY.md §8.1). */
const OUTSIDE_PURSE = Object.freeze({ store: ['cotton', 'food'] });

const round = value => Math.round(value * 10000) / 10000;
const reales = amount => `${amount} ${amount === 1 ? 'real' : 'reales'}`;
const loads = amount => { const shown = Math.round(amount * 10) / 10; return `${shown} ${shown === 1 ? 'load' : 'loads'}`; };
const cap = text => text.charAt(0).toUpperCase() + text.slice(1);
/** The family's own town: sim/chores.mjs `townOf`, written out here because that module imports this one. */
const townOf = household => household.settlementId || 'gonzales';
const MODE_WORDS = Object.freeze({ foot: 'Goes on foot', horse: 'Rides the horse', wagon: 'Takes the wagon' });
/** How the ways of going are tried: the quickest first (sim/travel.mjs speeds). */
const QUICKEST = Object.freeze(Object.values(MODES).slice().sort((a, b) => b.speed - a.speed).map(mode => mode.id));

const parse = id => { const [trade, offerId] = String(id || '').split(':'); const offer = TRADES[trade]?.offers.find(o => o.id === offerId); return offer ? { trade, offer } : null; };
const pays = offer => offer.kind === 'service' ? [] : offer.kind === 'sell'
  ? ['coin', 'food'].filter(pay => Number.isFinite(pay === 'coin' ? offer.coin : offer.food) && (pay === 'coin' ? offer.coin : offer.food) > 0)
  : ['coin', 'food'].filter(pay => pay === 'coin' ? offer.coinEach > 0 : offer.foodEach > 0);
const per = offer => offer.per ?? 1;
/** What one of this line is: a purchase, a lot sold, or a food ground. */
function eachWords(offer) {
  if (offer.kind === 'service') return '1 food ground';
  if (offer.kind === 'buy') return per(offer) === 1 ? `1 ${offer.good === 'cotton' ? 'bale' : offer.good === 'hides' ? 'hide' : offer.good}` : `${per(offer)} ${offer.good}`;
  return offer.brings ? Object.entries(offer.brings).map(([good, amount]) => `${amount} ${good}`).join(', ') : null;
}
function priceWords(offer) {
  if (offer.kind === 'service') return 'the miller takes his toll in meal';
  if (offer.kind === 'buy') {
    const got = pays(offer).map(pay => pay === 'coin' ? reales(offer.coinEach) : `${offer.foodEach * per(offer)} food`);
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
const inTurn = list => list.map((line, at) => ({ line, at, turn: TURN[parse(line?.id)?.offer.kind] ?? 0 }))
  .sort((a, b) => a.turn - b.turn || a.at - b.at).map(({ line }) => line);
/** Whoever keeps this shop in this town now, or null: the keeper who deals in it, standing there and well (sim/shops.mjs `tradesAt`). */
const keeperAt = (world, siteId, trade) => Object.values(world.entities).find(entity => entity.deals?.includes(trade)
  && entity.location?.siteId === siteId && entity.health?.condition === 'well') || null;

/**
 * What the family's own town deals in today, as the popup lists it: every offer of every shop standing there, its price and
 * what one of it is, the most the list may hold of it, and why it cannot be had at all right now (the shop's own refusal).
 * Nothing here is another family's: the town's shops are on the public map, and the stock is this family's own.
 */
export function errandOffers(world, household, entity) {
  const siteId = townOf(household), site = world.map.sites[siteId];
  const lines = [];
  for (const trade of tradesAt(world, siteId)) {
    for (const offer of TRADES[trade].offers) {
      const shut = offer.refuse(world, household, entity)
        || (offer.takes && userOf(world, household, offer.takes, entity) ? hasWords(userOf(world, household, offer.takes, entity), [offer.takes], world, entity) : null);
      const most = offer.kind === 'sell' ? (offer.once ? 1 : LINE_MOST) : LINE_MOST;
      lines.push({
        id: `${trade}:${offer.id}`, trade, shop: cap(TRADES[trade].shop), keeper: keeperAt(world, siteId, trade)?.name || null,
        label: offer.label, kind: offer.kind, does: offer.does, price: priceWords(offer), each: eachWords(offer), pays: pays(offer), most,
        ...(shut && { why: shut }),
      });
    }
  }
  return { town: { id: siteId, name: site?.name || 'town' }, lines, stock: stockOf(household), carry: Object.fromEntries(Object.values(MODES).map(mode => [mode.id, mode.carry])) };
}
const stockOf = household => Object.fromEntries(STOCK.map(good => [good, round(household.resources?.[good] ?? 0)]));

/**
 * Check a list against what the family has now, in its order, without changing anything. Returns the lines as they would be
 * done, the load there and back, the family's stock after, and the first reason it cannot be sent, if there is one.
 */
function reckon(world, household, entity, list) {
  if (!Array.isArray(list) || !list.length) return { why: 'Choose something to buy or sell first.' };
  if (list.length > ERRAND_LINES) return { why: `One person can be sent with at most ${ERRAND_LINES} things on the list.` };
  const siteId = townOf(household), open = new Set(tradesAt(world, siteId)), seen = new Set();
  const have = stockOf(household);
  const lines = [];
  // What is carried: `out` is everything taken from the house to town; `pack` is what is in hand in town, which is what comes
  // home. Food paid at a counter comes out of the pack first - the food a sale in town has just paid - and from the house
  // only for the rest, so a family selling cotton for food and buying seed with it carries home only what is left.
  let out = 0, wagon = false;
  const pack = { food: 0, other: 0 };
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
    const most = offer.kind === 'sell' && offer.once ? 1 : LINE_MOST;
    if (!Number.isInteger(n) || n < 1) return { why: `Say how many of "${offer.label}", in whole numbers.` };
    if (n > most) return { why: most === 1 ? `${offer.label}: one is all anybody needs.` : `${offer.label}: at most ${most} on one trip.` };
    const payWays = pays(offer);
    const pay = payWays.length ? String(raw.pay || '') : null;
    if (payWays.length && !payWays.includes(pay)) return { why: payWays.length === 1 ? `${offer.label} is paid in ${payWays[0]} only.` : `${offer.label}: say whether it is paid in ${payWays.join(' or ')}.` };
    const refused = offer.refuse(world, household, entity);
    if (refused) return { why: refused };
    if (offer.takes) { const holder = userOf(world, household, offer.takes, entity); if (holder) return { why: hasWords(holder, [offer.takes], world, entity) }; }
    if (offer.needsMode === 'wagon') wagon = true;
    const line = { id: raw.id, n, ...(pay && { pay }) };
    if (offer.kind === 'sell') {
      const price = pay === 'coin' ? offer.coin : offer.food, purse = pay === 'coin' ? 'money' : 'food';
      if (have[purse] + 1e-9 < price * n) return { why: pay === 'coin' ? `${offer.label} ${n > 1 ? `${n} times ` : ''}costs ${reales(price * n)}, and there will not be that much coin in the house.` : `${offer.label} ${n > 1 ? `${n} times ` : ''}costs ${price * n} food, and there will not be that much food to pay with.` };
      have[purse] = round(have[purse] - price * n);
      if (pay === 'food') foodFrom(price * n);
      for (const [good, amount] of Object.entries(offer.brings || {})) { have[good] = round((have[good] ?? 0) + amount * n); pack.other += amount * n; }
      pack.other += (offer.load ?? 0) * n;
      out += (offer.carried ?? 0) * n;
      lines.push({ ...line, costs: pay === 'coin' ? reales(price * n) : `${price * n} food`, ...(offer.brings && { gives: Object.entries(offer.brings).map(([good, amount]) => `${amount * n} ${good}`).join(', ') }) });
    } else if (offer.kind === 'buy') {
      const units = n * per(offer);
      if (have[offer.good] + 1e-9 < units) return { why: `There will not be ${units} ${offer.good} in the house to sell.` };
      have[offer.good] = round(have[offer.good] - units);
      if (offer.good === 'food') foodFrom(units); else out += units;
      const got = pay === 'coin' ? offer.coinEach * n : offer.foodEach * units;
      if (pay === 'coin') have.money = round(have.money + got); else { have.food = round(have.food + got); pack.food += got; }
      lines.push({ ...line, gives: pay === 'coin' ? reales(got) : `${got} food`, costs: `${units} ${offer.good}` });
    } else {
      if (have.food + 1e-9 < n) return { why: `There will not be ${n} food in the house to take to the mill.` };
      const back = round(n * MILL_RETURN);
      have.food = round(have.food - n + back);
      foodFrom(n); pack.food += back;
      lines.push({ ...line, costs: `${n} food`, gives: `${back} food as meal` });
    }
  }
  const home = pack.food + pack.other;
  return { lines, out: round(out), home: round(home), load: round(Math.max(out, home)), after: have, wagon };
}

/**
 * The way this person would go with this load: the quickest of the family's ways of going that carries it and is free for
 * them, with the server's sentence for it. `modeAvailability` is sim/world.mjs's, handed in (this module is imported by
 * sim/chores.mjs, which that one imports).
 */
function chooseMode(world, household, entity, load, needsWagon, modeAvailability) {
  const ways = waysOf(world, household, entity, load, needsWagon, modeAvailability);
  const open = ways.find(way => way.can);
  if (open) {
    // Why this way and not a quicker one: the wagon itself is the errand, the load is more than the horse carries, or the
    // quicker way is somebody else's today (their name, and what they are doing with it).
    const passed = ways.slice(0, ways.indexOf(open)).find(way => way.why && !way.tooMuch)?.why;
    const why = needsWagon ? ', and the wheelwright works on the wagon itself'
      : open.id === 'wagon' && load > MODES.horse.carry ? `, more than the horse carries (${MODES.horse.carry})`
        : passed ? `. ${passed}` : '';
    return { mode: open.id, how: `${MODE_WORDS[open.id]}: ${Math.round(load * 10) / 10} of ${MODES[open.id].carry} loads${why}${why.endsWith('.') ? '' : '.'}`, ways };
  }
  if (!needsWagon && load > MODES.wagon.carry) return { why: `That is ${loads(load)}, and the wagon carries ${MODES.wagon.carry}. Send less.`, ways };
  // Nothing free carries it: said with every reason, in the holders' own names, and what the student can do about it.
  const refused = ways.filter(way => way.why && !way.tooMuch && !way.notTheWagon).map(way => way.why);
  const wants = needsWagon ? 'The wheelwright works on the wagon itself, so this wants the wagon'
    : load > MODES.horse.carry ? `This wants the wagon: ${loads(load)}, and the horse carries ${MODES.horse.carry}`
      : `This is more than can be carried on foot: ${loads(load)}, and a person carries ${MODES.foot.carry}`;
  const waitFor = load > MODES.horse.carry || needsWagon ? 'the wagon is free' : 'the horse or the wagon is free';
  return { why: `${wants}. ${refused.join(' ') || 'The wagon cannot go.'} Send a smaller load, or wait until ${waitFor}.`, ways };
}
/** The quicker way, as a sentence starts it; and what each way carries, the same. */
const QUICKER = Object.freeze({ foot: 'Walking', horse: 'The horse', wagon: 'The wagon' });
const CARRIES = Object.freeze({ foot: 'On foot a person carries', horse: 'The horse carries', wagon: 'The wagon carries' });
/**
 * Every way this person could go with this load, quickest first (owner, 2026-09-24: the popup suggests the quickest, and the
 * student may choose any slower way that still carries it and is free): whether each is open, and the server's reason when
 * it is not - too small for the load, the wheelwright's work wanting the wagon, somebody else having it, no road.
 */
function waysOf(world, household, entity, load, needsWagon, modeAvailability) {
  const from = entity.location?.siteId, to = townOf(household);
  return QUICKEST.map(id => {
    const mode = MODES[id], base = { id, name: mode.name, carry: mode.carry };
    if (needsWagon && id !== 'wagon') return { ...base, can: false, why: 'The wheelwright works on the wagon itself, so the wagon has to go.', notTheWagon: true };
    if (mode.carry + 1e-9 < load) return { ...base, can: false, why: `${CARRIES[id]} ${mode.carry}, and this is ${loads(load)}.`, tooMuch: true };
    const path = from && world.map.sites[to] ? findWay(world, from, to, id) : null;
    const open = id === DEFAULT_MODE ? { can: true } : (modeAvailability ? modeAvailability(world, entity, id, path) : { can: false, why: 'No way of going was given.' });
    if (open.can && (path || id === DEFAULT_MODE)) return { ...base, can: true };
    return { ...base, can: false, why: open.why || `There is no road to town for the ${id}.` };
  });
}

/**
 * What the popup shows for a list: whether it can be sent and why not, the load, every way of going with the server's reason
 * for any that cannot (`ways`), the quickest that can (`quickest`, the popup's suggestion), how the person would go and why,
 * each line as it would be done, and the family's stock after. `mode` is the way the student chose, if they chose one: any
 * that carries the load and is free (owner, 2026-09-24), and refused in that way's own words if not. The same reckoning the
 * order is refused by, so the popup and the refusal can never disagree.
 */
export function errandQuote(world, household, entity, list, { modeAvailability, mode = null } = {}) {
  const reckoned = reckon(world, household, entity, list);
  if (reckoned.why) return { can: false, why: reckoned.why, stock: stockOf(household) };
  const way = chooseMode(world, household, entity, reckoned.load, reckoned.wagon, modeAvailability);
  const ways = way.ways.map(({ tooMuch, notTheWagon, ...shown }) => shown);
  const base = { load: reckoned.load, lines: reckoned.lines, stock: stockOf(household), after: reckoned.after, ways, ...(way.mode && { quickest: way.mode }) };
  if (mode && mode !== way.mode) {
    const chosen = ways.find(one => one.id === mode);
    if (!chosen) return { ...base, can: false, why: 'No such way of going.' };
    if (!chosen.can) return { ...base, can: false, mode, why: chosen.why };
    const slower = way.mode ? ` ${QUICKER[way.mode]} would be quicker.` : "";
    return { ...base, can: true, mode, how: `${MODE_WORDS[mode]}: ${Math.round(reckoned.load * 10) / 10} of ${MODES[mode].carry} loads, as you chose.${slower}` };
  }
  return { ...base, can: !way.why, ...(way.why && { why: way.why }), ...(way.mode && { mode: way.mode, how: way.how }) };
}

/**
 * The order's own check, before anything moves (sim/chores.mjs `beginChore`, through the chore's `plan`). Throws the
 * popup's own sentence; returns how the person goes and the list as it will be done.
 */
export function planErrand(world, household, entity, list, deps = {}) {
  const quote = errandQuote(world, household, entity, list, deps);
  if (!quote.can) throw new Error(quote.why);

  return { mode: quote.mode, errand: quote.lines.map(({ id, n, pay }) => ({ id, n, ...(pay && { pay }) })) };
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
      let done = 0, why = null;
      for (let i = 0; i < line.n; i++) {
        why = counterRefusal(world, household, entity, `${trade}:${offer.id}:${line.pay}`)
          || (offer.takes && userOf(world, household, offer.takes, entity) ? hasWords(userOf(world, household, offer.takes, entity), [offer.takes], world, entity) : null);
        if (why) break;
        if (line.pay === 'coin') { household.resources.money = (household.resources.money ?? 0) - offer.coin; keeper.purse = purseOf(world, keeper) + offer.coin; }
        else household.resources.food = round((household.resources.food ?? 0) - offer.food);
        const told = offer.give(world, household, entity);
        if (!offer.brings) record(world, 'property', { actorId: entity.id, householdId: household.id, importance: 2, text: told });
        done++;
      }
      if (done) {
        carried ||= Boolean(offer.brings || offer.load);
        const paid = line.pay === 'coin' ? reales(offer.coin * done) : `${offer.food * done} food`;
        const text = offer.brings ? `${entity.name} bought ${Object.entries(offer.brings).map(([good, amount]) => `${amount * done} ${good}`).join(', ')} at ${shop} for ${paid}.` : `${entity.name} paid ${paid} at ${shop}.`;
        say(text, line.pay === 'coin' ? { coin: -offer.coin * done } : {});
      }
      if (done < line.n) say(`${entity.name} could ${done ? `do only ${done} of ${line.n}` : 'not'}: ${offer.label.toLowerCase()} - ${why || 'it could not be done'}${done ? '' : ' Nothing was paid for it.'}`);
      continue;
    }
    if (offer.kind === 'buy') {
      const wanted = line.n, lot = per(offer);
      const inHouse = Math.floor((household.resources[offer.good] ?? 0) / lot + 1e-9);
      let lots = Math.min(wanted, inHouse), short = lots < wanted ? `there were only ${inHouse * lot} ${offer.good} in the house by then` : null;
      const outside = OUTSIDE_PURSE[trade]?.includes(offer.good);
      if (line.pay === 'coin' && !outside) {
        const affordable = Math.floor(purseOf(world, keeper) / offer.coinEach);
        if (affordable < lots) { lots = affordable; short = `${keeper.name} had coin for only ${affordable === 0 ? 'none of it' : `${affordable * lot} ${offer.good}`}`; }
      }
      if (lots > 0) {
        const units = lots * lot;
        household.resources[offer.good] = round((household.resources[offer.good] ?? 0) - units);
        if (line.pay === 'coin') {
          const got = lots * offer.coinEach;
          if (!outside) keeper.purse -= got;
          household.resources.money = (household.resources.money ?? 0) + got;
          say(`${entity.name} sold ${units} ${offer.good} to ${keeper.name} for ${reales(got)}.`, { coin: got });
        } else {
          const got = units * offer.foodEach;
          household.resources.food = round((household.resources.food ?? 0) + got);
          carried = true;
          say(`${entity.name} sold ${units} ${offer.good} to ${keeper.name} for ${got} food.`);
        }
      }
      if (short) say(`${cap(short)}, and ${lots ? 'the rest' : `the ${offer.good}`} came home again.`);
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
    const wagon = world.entities[propertyId(household.id, 'wagon')];
    if (wagon?.borrowedBy === entity.id) wagon.laden = true;
  }
}

/** A stored errand that could not have been sent (sim/world.mjs `validateWorld`). */
export function errandsInvalid(world) {
  for (const entity of Object.values(world.entities)) {
    const list = entity.chore?.errand;
    if (list === undefined) continue;
    if (entity.chore.id !== 'visit-shop' || !Array.isArray(list) || !list.length || list.length > ERRAND_LINES) return 'Invalid errand';
    for (const line of list) {
      const found = parse(line?.id);
      if (!found || !Number.isInteger(line.n) || line.n < 1 || line.n > LINE_MOST) return 'Invalid errand';
      if (pays(found.offer).length ? !pays(found.offer).includes(line.pay) : line.pay !== undefined) return 'Invalid errand';
    }
  }
  return null;
}
