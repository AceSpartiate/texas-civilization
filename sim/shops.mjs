/**
 * The shops of the towns: docs/TOWNS.md, owner-decided 2026-09-16.
 *
 * > "each town should have a variety of stores buying and selling things for the game. gunsmith,
 * > blacksmith, etc. don't be afraid to add more as necessary. towns should feel alive."
 *
 * Every settlement has the general store, a smith and a carpenter; the larger towns have the trades
 * their research documents, and Gonzales - the town every class on the invented country has - has a
 * full street of them (docs/TOWNS.md §3). Every keeper is an invented person (the owner's choice, on
 * the terms `FIC-GONZ-009` set for Marta Ibarra); every price and effect is invented (`FIC-GONZ-038`).
 *
 * One chore, `visit-shop`, goes to the family's own town and asks which shop; the shop's counter then
 * offers what it sells or buys, each for coin or for food, each stating what it does before it is
 * chosen (`FIC-GONZ-008`) and refused in words when it cannot be done. What a purchase does is written
 * here, on small household state read at the hooks that already exist:
 *
 *   household.gear   = { shoes, saddle, wagon, blankets }   - read by travel and rest
 *   household.rifle  = { shots }                             - read by the shot
 *   household.resources.hides                                - written by a successful hunt
 *
 * All absent on a class saved before this, which is a family with none of them, so no save version moves.
 */
import { record } from './events.mjs';
import { TOWN_LAYOUTS, townPoint } from './town-layouts.mjs';
import { learn } from './knowledge.mjs';
import { carryCapacity } from './travel.mjs';
import { purseOf, purseHeld } from './town.mjs';
import { addTool, allWorn, toolCount } from './tools.mjs';

const reales = amount => `${amount} ${amount === 1 ? 'real' : 'reales'}`;
const round = value => Math.round(value * 10000) / 10000;

/** The most of one tool on one trip to town: plenty for a family, and a load a tool (sim/errands.mjs). ceiling: a cap, not a rule. */
export const TOOL_MOST = 4;
/** A rifle at the gunsmith's (`FIC-GONZ-388`, invented), and the most brought home at once. */
export const RIFLE_COIN = 8, RIFLE_FOOD = 16, RIFLE_MOST = 2;
/** How many shots a rifle put in order by the gunsmith stays true for. */
export const TUNED_SHOTS = 10;
export const SHOES_SHARE = 0.85;
export const SADDLE_SHARE = 0.75;
export const WAGON_SPEED_SHARE = 1.15;
export const BLANKET_SHARE = 1.25;
/** What a tavern meal takes off the miles in somebody's legs. */
export const TAVERN_REST_MILES = 8;
/** What the miller returns for food carried in: a fifth more, his toll already taken. */
export const MILL_RETURN = 1.2;
/** A hide from a deer taken, sold to the tanner. */
export const HIDE_COIN = 1, HIDE_FOOD = 2;
/** The weaver pays for a whole bale. */
export const WEAVER_BALE_COIN = 1, WEAVER_BALE_FOOD = 3;
/** Coin a buying keeper holds for each family near the town. */
export const KEEPER_PURSE_PER_FAMILY = 1;

const gear = household => household.gear || {};
const TOOL_NAMES = { axe: 'a felling axe', auger: 'an auger', broadaxe: 'a broadaxe', froe: 'a froe' };

/**
 * What each trade does. An offer is `sell` (the shop sells something: priced in coin and food) or
 * `buy` (the shop buys something from the family: paid in coin from the keeper's purse, or in food).
 * `refuse(world, household, entity)` returns why it cannot be done at all; `give(world, household, entity)`
 * does it and returns the sentence for the family's story.
 */
export const TRADES = Object.freeze({
  // The general store, which every settlement has (docs/TOWNS.md §2). Until 2026-09-17 these were errands of their own on
  // the family panel - fetch seed, fetch powder, sell food, sell the cotton, buy a hoe - so a student had two ways to the
  // same counter and no way to compare them. They are the store's own trades now, at exactly the prices those errands paid,
  // and the errands are left to the families nobody plays (sim/chores.mjs `directorOnly`).
  // The prices are the ones those errands paid (`COIN` in sim/chores.mjs), written out here because chores.mjs reads this
  // table and cannot be read back from it.
  store: {
    name: 'storekeeper', shop: 'the store',
    offers: [
      {
        id: 'seed', kind: 'sell', label: 'Buy seed', coin: 1, food: 3, brings: { seed: 2 }, does: 'Two sacks of seed: enough to plant a cleared plot.',
        refuse: () => null,
        give: (world, household, entity) => { household.resources.seed = round((household.resources.seed ?? 0) + 2); return `${entity.name} bought two seed at the store.`; },
      },
      {
        id: 'powder', kind: 'sell', label: 'Buy powder and lead', coin: 1, food: 2, brings: { powder: 3 }, does: 'Three powder. The gunsmith, where there is one, gives more for the money.',
        refuse: () => null,
        give: (world, household, entity) => { household.resources.powder = round((household.resources.powder ?? 0) + 3); return `${entity.name} bought three powder and lead at the store.`; },
      },
      {
        // A family may own as many hoes as it buys (owner, 2026-09-24, docs/TOWNS.md §4c): a new one beside a worn one goes into
        // use and the worn one waits to be mended (sim/tools.mjs). Coin only, as it always was (the "null food" bug stays mended).
        id: 'hoe', kind: 'sell', label: 'Buy a sound hoe', coin: 2, food: null, most: TOOL_MOST, load: 1, does: 'Iron comes a long way, and the store wants coin for it. Beside a worn hoe, the new one goes into use and the old waits to be mended.',
        refuse: () => null,
        give: (world, household, entity) => { const worn = allWorn(household, 'hoe'); addTool(household, 'hoe'); return `${entity.name} bought a sound hoe at the store${worn ? ', and the worn one waits to be mended' : ''}.`; },
      },
      {
        // Five food a real, and the sixth stays in the house: `per` is the lot the keeper pays for, so no part of a real is
        // ever paid. This is the errand's own arithmetic (`COIN.foodPerReal`), moved to the counter.
        id: 'food', kind: 'buy', label: 'Sell food', coinEach: 1, per: 5, good: 'food',
        does: 'The store pays a real for every five food it can sell on, whole reales only.',
        refuse: (world, household) => (household.resources.food ?? 0) >= 5 ? null : 'There is not five food in the house to sell.',
      },
      {
        id: 'cotton', kind: 'buy', label: 'Sell the cotton', coinEach: 1, foodEach: 2, good: 'cotton',
        does: 'A real a whole bale, or two food. The weaver, where there is one, gives three food.',
        refuse: (world, household) => (household.resources.cotton ?? 0) >= 1 ? null : 'There is no whole bale of cotton in the house.',
      },
    ],
  },
  blacksmith: {
    name: 'blacksmith', shop: "the blacksmith's",
    offers: Object.entries({ axe: [3, 6], auger: [2, 4], broadaxe: [3, 6], froe: [1, 2] }).map(([tool, [coin, food]]) => ({
      id: `tool-${tool}`, kind: 'sell', label: `Buy ${TOOL_NAMES[tool]}`, coin, food, most: TOOL_MOST, load: 1,
      does: { axe: 'For felling, building and making furniture.', auger: 'For boring holes: a bedstead, a table and shelves want one.', broadaxe: 'For hewing logs flat: a hewn-log house wants one.', froe: 'For riving roof boards.' }[tool],
      // Another of the same (owner, 2026-09-24): a second felling axe lets one carry an axe off the land while another fells at home.
      refuse: () => null,
      give: (world, household, entity) => { const had = toolCount(household, tool); addTool(household, tool); return `${entity.name} bought ${TOOL_NAMES[tool]} from the blacksmith${had ? `; the family has ${had + 1} now` : ''}.`; },
    })),
  },
  gunsmith: {
    name: 'gunsmith', shop: "the gunsmith's",
    offers: [
      {
        id: 'powder', kind: 'sell', label: 'Buy powder and lead', coin: 2, food: 4, brings: { powder: 5 }, does: 'Five powder: more for the money than the store gives.',
        refuse: () => null,
        give: (world, household, entity) => { household.resources.powder = round((household.resources.powder ?? 0) + 5); return `${entity.name} bought five powder and lead from the gunsmith.`; },
      },
      {
        // The rifle goes to the gunsmith and home again: a load each way, and it has to be in the house to go (sim/keeping.mjs).
        id: 'rifle', kind: 'sell', label: "Have the family's rifle put in order", coin: 2, food: 4, once: true, load: 1, carried: 1, takes: 'rifle',
        does: `A rifle that shoots true: a hand that never had the knack makes the long shot, for the next ${TUNED_SHOTS} shots. A tired hand still misses.`,
        refuse: (world, household) => !toolCount(household, 'rifle') ? 'There is no rifle in the house to put in order.' : (household.rifle?.shots ?? 0) > 0 ? 'The rifle is already in order.' : null,
        give: (world, household, entity) => { household.rifle = { shots: TUNED_SHOTS }; return `${entity.name} had the family's rifle put in order by the gunsmith.`; },
      },
      {
        // A rifle of the family's own (owner, 2026-09-24: "send someone to buy more rifles"; docs/TOWNS.md §4c). Sold by the
        // gunsmith, where a town has one, since the rifle is a gunsmith's work; a town with no gunsmith sells none. The price is
        // invented (`FIC-GONZ-388`): ceiling: eight reales or sixteen food - dearer than anything else on the street, as a rifle
        // was the dearest thing a settler owned (`HIST-GONZ-027`: the country could not supply an outfit), and no 1835 Texas price
        // for one was found. A price from the record would replace it.
        id: 'buy-rifle', kind: 'sell', label: 'Buy a rifle', coin: RIFLE_COIN, food: RIFLE_FOOD, most: RIFLE_MOST, load: 1,
        does: 'A long rifle of the family\'s own: two can be out hunting at once, or one at the war while another hunts at home.',
        refuse: () => null,
        give: (world, household, entity) => { addTool(household, 'rifle'); return `${entity.name} bought a rifle from the gunsmith; the family has ${toolCount(household, 'rifle') === 1 ? 'a rifle again' : `${toolCount(household, 'rifle')} rifles now`}.`; },
      },
    ],
  },
  doctor: {
    name: 'doctor', shop: "the doctor's",
    offers: [{
      id: 'see', kind: 'sell', label: 'See the doctor', coin: 2, food: 3, once: true,
      does: 'Somebody tired is set right at once; somebody hurt mends in half the time left.',
      refuse: (world, household, entity) => ['tired', 'minor-injury'].includes(entity.health?.condition) ? null : `${entity.name} is well, and the doctor has nothing to do.`,
      give: (world, household, entity) => {
        if (entity.health.condition === 'tired') { entity.health = { condition: 'well' }; entity.exertion = 0; return `The doctor saw ${entity.name}, who is rested and well again.`; }
        const left = Math.max(0, (entity.health.recoversAt ?? world.minute) - world.minute);
        entity.health = { ...entity.health, recoversAt: world.minute + Math.round(left / 2) };
        return `The doctor saw ${entity.name}, and the hurt will mend in half the time.`;
      },
    }],
  },
  tavern: {
    name: 'tavern', shop: 'the tavern',
    offers: [{
      id: 'meal', kind: 'sell', label: 'A meal, and the talk', coin: 1, food: 1, once: true,
      does: `A hot meal takes some of the road out of the legs, and whatever the town has heard is heard.`,
      refuse: () => null,
      give: (world, household, entity) => {
        entity.exertion = Math.max(0, round((entity.exertion || 0) - TAVERN_REST_MILES));
        let heard = 0;
        for (const [topicId, report] of Object.entries(world.knowledge?.public || {})) {
          if (world.knowledge.households[household.id]?.[topicId]) continue;
          if (learn(world, household.id, topicId, { status: report.status, source: 'Talk at the tavern' })) heard++;
        }
        return heard ? `${entity.name} ate at the tavern and heard the talk: ${heard === 1 ? 'one piece of news' : `${heard} pieces of news`} the family had not had.` : `${entity.name} ate at the tavern. Nobody there knew anything the family had not heard.`;
      },
    }],
  },
  tanner: {
    name: 'tanner and saddler', shop: "the tanner's",
    offers: [
      {
        id: 'hides', kind: 'buy', label: 'Sell the hides', coinEach: HIDE_COIN, foodEach: HIDE_FOOD, good: 'hides',
        does: `${reales(HIDE_COIN)} or ${HIDE_FOOD} food for each hide from a deer taken.`,
        refuse: (world, household) => (household.resources.hides ?? 0) >= 1 ? null : 'There are no hides in the house. A deer taken brings one home.',
      },
      {
        id: 'shoes', kind: 'sell', label: 'Buy shoes for the family', coin: 2, food: 4, once: true, load: 1, does: 'Good shoes: a mile on foot tires the family less.',
        refuse: (world, household) => gear(household).shoes ? 'The family is already shod.' : null,
        give: (world, household, entity) => { household.gear = { ...gear(household), shoes: true }; return `${entity.name} bought shoes for the family from the tanner.`; },
      },
      {
        id: 'saddle', kind: 'sell', label: 'Buy a saddle', coin: 3, food: 6, once: true, load: 1, does: 'A proper saddle: a mile on the horse tires the rider less.',
        refuse: (world, household) => gear(household).saddle ? 'The family already has a saddle.' : !household.property?.some(id => id.endsWith('-horse')) ? 'The family has no horse to put it on.' : null,
        give: (world, household, entity) => { household.gear = { ...gear(household), saddle: true }; return `${entity.name} bought a saddle from the saddler.`; },
      },
    ],
  },
  wheelwright: {
    name: 'wheelwright', shop: "the wheelwright's",
    offers: [{
      // The wheelwright works on the wagon itself, so it goes to town (docs/TOWNS.md §4b): the errand takes it.
      id: 'wagon', kind: 'sell', label: 'Have the wagon put in good order', coin: 2, food: 4, once: true, needsMode: 'wagon', does: 'Trued wheels and a greased axle: the ox and wagon go faster.',
      refuse: (world, household) => gear(household).wagon ? 'The wagon is already in good order.' : !household.property?.some(id => id.endsWith('-wagon')) ? 'The family has no wagon.' : null,
      give: (world, household, entity) => { household.gear = { ...gear(household), wagon: true }; return `${entity.name} had the wagon put in good order by the wheelwright.`; },
    }],
  },
  mill: {
    name: 'miller', shop: 'the mill',
    offers: [{
      id: 'grind', kind: 'service', label: 'Have corn ground to meal', coin: 0, food: 0,
      does: 'The miller takes his toll in meal; what comes home goes a fifth further. As much as whoever went can carry.',
      refuse: (world, household) => (household.resources.food ?? 0) >= 1 ? null : 'There is no corn in the house to grind.',
      give: (world, household, entity) => {
        const carried = Math.min(household.resources.food ?? 0, carryCapacity(entity.chore?.mode));
        const gained = round(carried * (MILL_RETURN - 1));
        household.resources.food = round((household.resources.food ?? 0) + gained);
        return `${entity.name} had ${round(carried)} food ground at the mill, and it goes ${gained} further as meal.`;
      },
    }],
  },
  weaver: {
    name: 'weaver', shop: "the weaver's",
    offers: [
      {
        id: 'cotton', kind: 'buy', label: 'Sell cotton to the weaver', coinEach: WEAVER_BALE_COIN, foodEach: WEAVER_BALE_FOOD, good: 'cotton',
        does: `${reales(WEAVER_BALE_COIN)} or ${WEAVER_BALE_FOOD} food a whole bale: the weaver pays more food than the store.`,
        refuse: (world, household) => (household.resources.cotton ?? 0) >= 1 ? null : 'There is no whole bale of cotton in the house.',
      },
      {
        id: 'blankets', kind: 'sell', label: 'Buy blankets', coin: 1, food: 2, once: true, load: 1, does: 'Warm blankets: sleeping by the wagon mends a quarter better.',
        refuse: (world, household) => gear(household).blankets ? 'The family already has blankets.' : null,
        give: (world, household, entity) => { household.gear = { ...gear(household), blankets: true }; return `${entity.name} bought blankets from the weaver.`; },
      },
    ],
  },
});

/** Which trades stand at each settlement beyond the store, the smith and the carpenter (docs/TOWNS.md §3). */
export const TOWN_TRADES = Object.freeze({
  gonzales: ['blacksmith', 'gunsmith', 'doctor', 'tavern', 'tanner', 'wheelwright', 'mill', 'weaver'],
  'san-felipe': ['blacksmith', 'gunsmith', 'doctor', 'tavern', 'tanner', 'wheelwright', 'mill', 'weaver'],
  columbia: ['blacksmith', 'gunsmith', 'doctor', 'tavern', 'tanner', 'wheelwright', 'weaver'],
  mina: ['blacksmith', 'gunsmith', 'tavern'],
  liberty: ['blacksmith', 'tavern'],
  matagorda: ['blacksmith', 'tavern'],
  victoria: ['blacksmith'],
});

/** The invented keepers, per town and trade. Mixed names, as every town here is (FIC-GONZ-009). */
export const KEEPERS = Object.freeze({
  gonzales: { blacksmith: 'Josiah Pike', gunsmith: 'Tobias Rhine', doctor: 'Dr. Felipe Arocha', tavern: 'Hannah Deering', tanner: 'Calvin Oakes', wheelwright: 'Rafael Cantú', mill: 'Micajah Hobbs', weaver: 'Lucía Benavides' },
  'san-felipe': { blacksmith: 'Ira Pettibone', gunsmith: 'Seth Haverly', doctor: 'Dr. Josiah Crane', tavern: 'Martha Cudworth', tanner: 'Esteban Lerma', wheelwright: 'Obadiah Fenn', mill: 'Silas Garrow', weaver: 'Prudence Lamb' },
  columbia: { blacksmith: 'Jesse Worrell', gunsmith: 'Daniel Hext', doctor: 'Dr. Amos Kellum', tavern: 'Rebecca Tolliver', tanner: 'José María Huizar', wheelwright: 'Levi Stroud', weaver: 'Charity Pruett' },
  mina: { blacksmith: 'Caleb Varner', gunsmith: 'Wiley Pratt', tavern: 'Nancy Blevins' },
  liberty: { blacksmith: 'Moses Tubb', tavern: 'Dolores Ybarbo' },
  matagorda: { blacksmith: 'Horace Pell', tavern: 'Eliza Crump' },
  victoria: { blacksmith: 'Ramón Sosa' },
});
/**
 * Which of those keepers are women, per town and trade; every other keeper is a man. Authored with the names, not read from
 * them (this project infers nothing from what somebody is called), so the map draws each keeper as who they are
 * (sim/town.mjs `seenAs`). Until 2026-09-24 no keeper had a sex and the page chose a figure by a hash of the id.
 */
export const KEPT_BY_WOMEN = Object.freeze({
  gonzales: ['tavern', 'weaver'], 'san-felipe': ['tavern', 'weaver'], columbia: ['tavern', 'weaver'],
  mina: ['tavern'], liberty: ['tavern'], matagorda: ['tavern'], victoria: [],
});
export const keeperSex = (settlementId, trade) => KEPT_BY_WOMEN[settlementId]?.includes(trade) ? 'female' : 'male';

/**
 * Where every keeper keeps shop, in miles from the town's centre (owner, 2026-09-16: "use one of the pre-existing
 * buildings per shopkeeper for places already built. for new locations give each shopkeeper their own place").
 *
 * **Gonzales is already built** (public/gonzales-art.js): each keeper takes one of its drawn buildings, named by its id
 * there and at its exact position - `tests/shops.test.mjs` reads that file and holds the two together. Marta Ibarra keeps
 * the general store and Josiah Pike the ironworker's yard, as the drawing always labelled them.
 *
 * **Every other settlement is new**: each keeper gets a building of their own, placed round the town's centre and drawn
 * from `world.map.shops` with the trade's sprite. ceiling: the places are invented and evenly spread; the measured plans
 * in docs/town-research/ are where each shop's documented or likeliest lot belongs, once those towns are laid out.
 */
export const GONZALES_PLACES = Object.freeze({
  store: { building: 'gonzales-store-art', x: -.16, y: -.13 },
  blacksmith: { building: 'gonzales-iron-art', x: .18, y: .05 },
  tavern: { building: 'gonzales-house-art-16', x: -.25, y: -.15 },
  wheelwright: { building: 'gonzales-house-art-17', x: -.07, y: -.15 },
  gunsmith: { building: 'gonzales-house-art-18', x: .06, y: -.16 },
  tanner: { building: 'gonzales-house-art-19', x: .23, y: -.10 },
  doctor: { building: 'gonzales-house-art-20', x: -.25, y: .14 },
  weaver: { building: 'gonzales-house-art-21', x: .29, y: .15 },
  carpenter: { building: 'gonzales-house-art-22', x: .19, y: .21 },
  mill: { building: 'gonzales-house-art-23', x: -.12, y: .22 },
});
/** A new town's places, in the order store, carpenter, then its trades. */
const NEW_PLACES = [{ x: -.16, y: -.13 }, { x: .18, y: .05 }, { x: .20, y: -.16 }, { x: -.24, y: .10 }, { x: .04, y: .22 }, { x: -.04, y: -.24 }, { x: .28, y: .18 }, { x: -.28, y: -.06 }, { x: -.16, y: .26 }, { x: .30, y: -.04 }];
/** The building each kind of shop is drawn as in a new town. stand-in: docs/ART_REQUESTS.md, request 2026-09-16 - the shops of the towns. */
export const SHOP_SPRITES = Object.freeze({ store: 'trading-house', carpenter: 'timber-shop', blacksmith: 'shed-open', gunsmith: 'cabin-small', doctor: 'house-hewn-log', tavern: 'house-dog-run', tanner: 'storehouse', wheelwright: 'timber-shop', mill: 'storehouse', weaver: 'cabin-weathered' });
export const SHOP_LABELS = Object.freeze({ store: 'General store', carpenter: 'Carpenter', blacksmith: 'Blacksmith', gunsmith: 'Gunsmith', doctor: 'Doctor', tavern: 'Tavern', tanner: 'Tanner & saddler', wheelwright: 'Wheelwright', mill: 'Mill', weaver: 'Weaver' });
/** Where a keeper stands: just in front of the door. */
const DOOR = 0.012;
const place = value => { const fixed = +value.toFixed(3); return fixed === 0 ? 0 : fixed; };
export const keeperId = (settlementId, trade) => `town-${trade}-${settlementId}`;

/**
 * In a town that is drawn (sim/town-layouts.mjs), every keeper keeps one of its buildings, as Gonzales's do (owner,
 * 2026-09-16: "Use one of the pre-existing buildings per shopkeeper for places already built"). A trade the research
 * places in a documented building - San Felipe's smithy, Peyton's tavern - is there; every other trade takes the next
 * of the town's ordinary houses, nearest the centre first. Returns trade -> { x, y, building } in miles from the site.
 */
export function placesInLayout(settlementId, trades) {
  const layout = TOWN_LAYOUTS[settlementId];
  if (!layout) return {};
  const places = {}, used = new Set();
  for (const trade of trades) {
    const building = layout.buildings.find(b => b.trade === trade && !used.has(b.id));
    if (building) { used.add(building.id); places[trade] = { ...townPoint(layout, building), building: building.id }; }
  }
  const houses = layout.buildings.filter(b => b.filler);
  for (const trade of trades) {
    if (places[trade]) continue;
    const building = houses.find(b => !used.has(b.id));
    if (!building) continue;
    used.add(building.id); places[trade] = { ...townPoint(layout, building), building: building.id };
  }
  return places;
}

/**
 * Put the keepers in the towns. On the invented country only Gonzales exists; on the real land every
 * settlement a family lives near. Gonzales's blacksmith is Josiah Pike, who has always been there, so he
 * is given the trade rather than a second smith. Called once, when the world is built.
 */
/**
 * Put the keepers in the towns, each at their own door. On the invented country only Gonzales exists; on the real land
 * every settlement a family lives near. The store and the carpenter were made by sim/town.mjs, and Gonzales's blacksmith is
 * Josiah Pike, who has always been there; they are given their doors here with everybody else, and every shop is written
 * to `world.map.shops` so a town's buildings can be drawn for anybody, whether or not one of their family is standing there.
 * Called once, when the world is built.
 */
export function createShopkeepers(world, near) {
  for (const [settlementId, trades] of Object.entries(TOWN_TRADES)) {
    const site = world.map.sites[settlementId];
    if (!site) continue;
    const families = settlementId === 'gonzales' && !near.length ? (world.playerCount || 15) : near.filter(home => home.settlementId === settlementId).length;
    if (!families) continue;
    const gonzales = settlementId === 'gonzales';
    const existing = gonzales
      ? { store: world.entities['town-ibarra'], carpenter: world.entities['town-carpenter'], blacksmith: world.entities['town-pike'] }
      : { store: world.entities[`town-store-${settlementId}`], carpenter: world.entities[`town-carpenter-${settlementId}`] };
    const shops = [];
    const layoutPlaces = placesInLayout(settlementId, ['store', 'carpenter', ...trades]);
    ['store', 'carpenter', ...trades].forEach((trade, index) => {
      const at = gonzales ? GONZALES_PLACES[trade] : layoutPlaces[trade] || NEW_PLACES[index % NEW_PLACES.length];
      if (!at) return;
      let keeper = existing[trade];
      if (!keeper && TRADES[trade]) {
        const id = keeperId(settlementId, trade);
        const buys = TRADES[trade].offers.some(offer => offer.kind === 'buy');
        keeper = world.entities[id] = {
          id, name: KEEPERS[settlementId][trade], sex: keeperSex(settlementId, trade), kind: 'person', householdId: null, depth: 'moderate', principal: false,
          resident: trade, deals: [trade],
          ...(buys && { purse: KEEPER_PURSE_PER_FAMILY * families }),
          about: `keeps ${TRADES[trade].shop} at ${site.name}`,
          travel: null, health: { condition: 'well' }, task: 'work',
        };
      }
      if (!keeper) return;
      if (TRADES[trade]) keeper.deals = [...new Set([...(keeper.deals || []), trade])];
      keeper.townSiteId = settlementId;
      keeper.shopSpot = { x: at.x, y: place(at.y + DOOR) };
      keeper.location = { x: place(site.x + keeper.shopSpot.x), y: place(site.y + keeper.shopSpot.y), siteId: settlementId };
      shops.push({ trade, keeperId: keeper.id, x: at.x, y: at.y, label: SHOP_LABELS[trade], ...(at.building ? { building: at.building } : { sprite: SHOP_SPRITES[trade] }) });
    });
    world.map.shops = { ...(world.map.shops || {}), [settlementId]: shops };
  }
}

/** Keepers keep to their doors, stepping out and back as the day goes. Deterministic from the tick. */
export function advanceShopkeepers(world) {
  for (const entity of Object.values(world.entities)) {
    if (!entity.shopSpot || entity.travel) continue;
    const site = world.map.sites[entity.townSiteId];
    if (!site) continue;
    // A step out to the street and back: never far enough to leave the door.
    const out = Math.floor(world.tick / 4 + entity.id.length) % 3 === 0 ? 0.008 : 0;
    entity.location = { x: place(site.x + entity.shopSpot.x + out), y: place(site.y + entity.shopSpot.y), siteId: entity.townSiteId };
  }
}

/** The trades with a keeper standing in this town now. */
export const tradesAt = (world, siteId) => Object.keys(TRADES).filter(trade => Object.values(world.entities).some(entity =>
  entity.deals?.includes(trade) && entity.location?.siteId === siteId && entity.health?.condition === 'well'));

/** Every counter option for a trade: an offer paid in coin and in food, or a sale for coin or food, or a service. */
export function counterOptions(trade) {
  return [
    ...TRADES[trade].offers.flatMap(offer => offer.kind === 'service'
      ? [{ id: `${trade}:${offer.id}`, label: offer.label, note: offer.does }]
      : offer.kind === 'buy'
        // A keeper who does not pay in food for a thing - the store, buying food itself - offers only the coin (2026-09-17).
        ? [
          ...(offer.coinEach ? [{ id: `${trade}:${offer.id}:coin`, label: `${offer.label} for coin`, note: offer.does }] : []),
          ...(offer.foodEach ? [{ id: `${trade}:${offer.id}:food`, label: `${offer.label} for food`, note: offer.does }] : []),
        ]
        // A thing the keeper sells for coin only - the store's hoe - has no food price, and no food option (found 2026-09-24:
        // the counter offered "Buy a sound hoe: null food", and a worn hoe was replaced for nothing).
        : [
          ...(Number.isFinite(offer.coin) ? [{ id: `${trade}:${offer.id}:coin`, label: `${offer.label}: ${reales(offer.coin)}`, note: offer.does }] : []),
          ...(Number.isFinite(offer.food) ? [{ id: `${trade}:${offer.id}:food`, label: `${offer.label}: ${offer.food} food`, note: offer.does }] : []),
        ]),
    { id: 'leave', label: 'Nothing today', note: 'Nothing spent' },
  ];
}

const parse = optionId => { const [trade, offerId, pay] = optionId.split(':'); return { trade, offer: TRADES[trade]?.offers.find(o => o.id === offerId), pay }; };

/** Why this counter option cannot be taken now, or null. */
export function counterRefusal(world, household, entity, optionId) {
  const { offer, pay } = parse(optionId);
  if (!offer) return 'That is not for sale here.';
  const why = offer.refuse(world, household, entity);
  if (why) return why;
  if (offer.kind === 'sell' && !Number.isFinite(pay === 'coin' ? offer.coin : offer.food)) return pay === 'food' ? `${TRADES[parse(optionId).trade].shop.replace(/^the /, 'The ')} wants coin for it, not food.` : 'That is not sold for coin.';
  if (offer.kind === 'sell' && pay === 'coin' && (household.resources.money ?? 0) < offer.coin) return `It costs ${reales(offer.coin)}, and there is not that much coin in the house.`;
  if (offer.kind === 'sell' && pay === 'food' && (household.resources.food ?? 0) < offer.food) return 'There is not enough food to pay with.';
  if (offer.kind === 'buy' && pay === 'coin' && purseHeld(world, world.entities[entity.chore?.traderId]) < offer.coinEach) return 'The keeper has no coin left to pay out.';
  return null;
}

/** Take the option: pay, receive, and say it. Called by the `shop` step in sim/chores.mjs. */
export function takeCounter(world, household, entity, optionId) {
  const { trade, offer, pay } = parse(optionId);
  const trader = world.entities[entity.chore?.traderId];
  const why = counterRefusal(world, household, entity, optionId);
  if (why) {
    record(world, 'consequence', { actorId: entity.id, householdId: household.id, importance: 2, text: `${entity.name} could not: ${why}` });
    return;
  }
  if (offer.kind === 'buy') {
    // Sold by the lot: `per` is how many go to one payment (the store's five food a real, 2026-09-17; one of anything else),
    // every whole lot carried, and no more than the keeper's purse pays for. What will not make a whole lot stays at home.
    const per = offer.per ?? 1;
    const carried = Math.floor(Math.min(household.resources[offer.good] ?? 0, carryCapacity(entity.chore?.mode)));
    const lots = pay === 'coin'
      ? Math.min(Math.floor(carried / per), Math.floor(purseOf(world, trader) / offer.coinEach))
      : Math.floor(carried / per);
    const units = lots * per;
    if (units < 1) return;
    household.resources[offer.good] = round((household.resources[offer.good] ?? 0) - units);
    if (pay === 'coin') {
      const got = lots * offer.coinEach;
      trader.purse -= got;
      household.resources.money = (household.resources.money ?? 0) + got;
      record(world, 'consequence', { actorId: entity.id, householdId: household.id, importance: 2, coin: got, text: `${entity.name} sold ${units} ${offer.good} to ${trader.name} for ${reales(got)}.` });
    } else {
      const got = units * offer.foodEach;
      household.resources.food = round((household.resources.food ?? 0) + got);
      record(world, 'consequence', { actorId: entity.id, householdId: household.id, importance: 2, text: `${entity.name} sold ${units} ${offer.good} to ${trader.name} for ${got} food.` });
    }
    return;
  }
  if (offer.kind === 'sell') {
    if (pay === 'coin') {
      household.resources.money = (household.resources.money ?? 0) - offer.coin;
      if (trader) trader.purse = purseOf(world, trader) + offer.coin;
      record(world, 'consequence', { actorId: entity.id, householdId: household.id, coin: -offer.coin, text: `${entity.name} paid ${reales(offer.coin)} at ${TRADES[trade].shop}.` });
    } else {
      household.resources.food = round((household.resources.food ?? 0) - offer.food);
    }
  }
  record(world, 'property', { actorId: entity.id, householdId: household.id, importance: 2, text: offer.give(world, household, entity) });
}

// ---------------------------------------------------------------------------------------------- what the goods do

/** How much of a mile's weariness this person pays, for what the family owns: shoes on foot, a saddle on the horse. */
export function gearExertionShare(world, entity, modeId) {
  const household = world.households[entity.householdId];
  if (!household) return 1;
  if (modeId === 'foot' && gear(household).shoes) return SHOES_SHARE;
  if (modeId === 'horse' && gear(household).saddle) return SADDLE_SHARE;
  return 1;
}
/** How much faster a family's ox and wagon go, put in good order. */
export const wagonSpeedShare = (world, entity, modeId) => modeId === 'wagon' && gear(world.households[entity.householdId] || {}).wagon ? WAGON_SPEED_SHARE : 1;
/** How much better sleeping by the wagon mends, with blankets. */
export const campRestShare = household => gear(household).blankets ? BLANKET_SHARE : 1;
/** Whether the family's rifle is in order for this shot. */
export const rifleTrue = household => (household?.rifle?.shots ?? 0) > 0;
/** A shot spent: one fewer while the rifle stays true. */
export function spendRifleShot(household) {
  if (!rifleTrue(household)) return;
  household.rifle = { shots: household.rifle.shots - 1 };
}

/** Stored shop state that could not have been bought. */
export function shopsInvalid(world) {
  for (const household of Object.values(world.households)) {
    if (household.gear !== undefined && (!household.gear || typeof household.gear !== 'object' || Object.entries(household.gear).some(([key, value]) => !['shoes', 'saddle', 'wagon', 'blankets'].includes(key) || value !== true))) return 'Invalid gear';
    if (household.rifle !== undefined && (!Number.isInteger(household.rifle?.shots) || household.rifle.shots < 0 || household.rifle.shots > TUNED_SHOTS)) return 'Invalid rifle';
    if (household.resources?.hides !== undefined && (!Number.isInteger(household.resources.hides) || household.resources.hides < 0)) return 'Invalid hides';
  }
  return null;
}
