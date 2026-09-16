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
import { learn } from './knowledge.mjs';
import { carryCapacity } from './travel.mjs';
import { purseOf, purseHeld } from './town.mjs';

const reales = amount => `${amount} ${amount === 1 ? 'real' : 'reales'}`;
const round = value => Math.round(value * 10000) / 10000;

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
  blacksmith: {
    name: 'blacksmith', shop: "the blacksmith's",
    offers: Object.entries({ axe: [3, 6], auger: [2, 4], broadaxe: [3, 6], froe: [1, 2] }).map(([tool, [coin, food]]) => ({
      id: `tool-${tool}`, kind: 'sell', label: `Buy ${TOOL_NAMES[tool]}`, coin, food,
      does: { axe: 'For felling, building and making furniture.', auger: 'For boring holes: a bedstead, a table and shelves want one.', broadaxe: 'For hewing logs flat: a hewn-log house wants one.', froe: 'For riving roof boards.' }[tool],
      refuse: (world, household) => household.tools?.[tool] !== undefined ? `The family already has ${TOOL_NAMES[tool]}.` : null,
      give: (world, household, entity) => { household.tools = { ...household.tools, [tool]: 0 }; return `${entity.name} bought ${TOOL_NAMES[tool]} from the blacksmith.`; },
    })),
  },
  gunsmith: {
    name: 'gunsmith', shop: "the gunsmith's",
    offers: [
      {
        id: 'powder', kind: 'sell', label: 'Buy powder and lead', coin: 2, food: 4, does: 'Five powder: more for the money than the store gives.',
        refuse: () => null,
        give: (world, household, entity) => { household.resources.powder = round((household.resources.powder ?? 0) + 5); return `${entity.name} bought five powder and lead from the gunsmith.`; },
      },
      {
        id: 'rifle', kind: 'sell', label: "Have the family's rifle put in order", coin: 2, food: 4,
        does: `A rifle that shoots true: a hand that never had the knack makes the long shot, for the next ${TUNED_SHOTS} shots. A tired hand still misses.`,
        refuse: (world, household) => (household.rifle?.shots ?? 0) > 0 ? 'The rifle is already in order.' : null,
        give: (world, household, entity) => { household.rifle = { shots: TUNED_SHOTS }; return `${entity.name} had the family's rifle put in order by the gunsmith.`; },
      },
    ],
  },
  doctor: {
    name: 'doctor', shop: "the doctor's",
    offers: [{
      id: 'see', kind: 'sell', label: 'See the doctor', coin: 2, food: 3,
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
      id: 'meal', kind: 'sell', label: 'A meal, and the talk', coin: 1, food: 1,
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
        id: 'shoes', kind: 'sell', label: 'Buy shoes for the family', coin: 2, food: 4, does: 'Good shoes: a mile on foot tires the family less.',
        refuse: (world, household) => gear(household).shoes ? 'The family is already shod.' : null,
        give: (world, household, entity) => { household.gear = { ...gear(household), shoes: true }; return `${entity.name} bought shoes for the family from the tanner.`; },
      },
      {
        id: 'saddle', kind: 'sell', label: 'Buy a saddle', coin: 3, food: 6, does: 'A proper saddle: a mile on the horse tires the rider less.',
        refuse: (world, household) => gear(household).saddle ? 'The family already has a saddle.' : !household.property?.some(id => id.endsWith('-horse')) ? 'The family has no horse to put it on.' : null,
        give: (world, household, entity) => { household.gear = { ...gear(household), saddle: true }; return `${entity.name} bought a saddle from the saddler.`; },
      },
    ],
  },
  wheelwright: {
    name: 'wheelwright', shop: "the wheelwright's",
    offers: [{
      id: 'wagon', kind: 'sell', label: 'Have the wagon put in good order', coin: 2, food: 4, does: 'Trued wheels and a greased axle: the ox and wagon go faster.',
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
        id: 'blankets', kind: 'sell', label: 'Buy blankets', coin: 1, food: 2, does: 'Warm blankets: sleeping by the wagon mends a quarter better.',
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

/** Where the shops stand, offsets from the town's centre, one per trade in `TOWN_TRADES` order. */
const SPOTS = [{ x: .20, y: -.02 }, { x: -.22, y: .12 }, { x: .06, y: .22 }, { x: -.02, y: -.20 }, { x: .24, y: .16 }, { x: -.18, y: -.18 }, { x: .16, y: -.18 }, { x: -.26, y: -.02 }];
const place = value => { const fixed = +value.toFixed(2); return fixed === 0 ? 0 : fixed; };
export const keeperId = (settlementId, trade) => `town-${trade}-${settlementId}`;

/**
 * Put the keepers in the towns. On the invented country only Gonzales exists; on the real land every
 * settlement a family lives near. Gonzales's blacksmith is Josiah Pike, who has always been there, so he
 * is given the trade rather than a second smith. Called once, when the world is built.
 */
export function createShopkeepers(world, near) {
  for (const [settlementId, trades] of Object.entries(TOWN_TRADES)) {
    const site = world.map.sites[settlementId];
    if (!site) continue;
    const families = settlementId === 'gonzales' && !near.length ? (world.playerCount || 15) : near.filter(home => home.settlementId === settlementId).length;
    if (!families) continue;
    trades.forEach((trade, index) => {
      if (settlementId === 'gonzales' && trade === 'blacksmith' && world.entities['town-pike']) {
        world.entities['town-pike'].deals = [...new Set([...(world.entities['town-pike'].deals || []), 'blacksmith'])];
        return;
      }
      const id = keeperId(settlementId, trade), spot = SPOTS[index % SPOTS.length];
      const buys = TRADES[trade].offers.some(offer => offer.kind === 'buy');
      world.entities[id] = {
        id, name: KEEPERS[settlementId][trade], kind: 'person', householdId: null, depth: 'moderate', principal: false,
        resident: trade, deals: [trade], townSiteId: settlementId, shopSpot: spot,
        ...(buys && { purse: KEEPER_PURSE_PER_FAMILY * families }),
        about: `keeps ${TRADES[trade].shop} at ${site.name}`,
        location: { x: place(site.x + spot.x), y: place(site.y + spot.y), siteId: settlementId },
        travel: null, health: { condition: 'well' }, task: 'work',
      };
    });
  }
}

/** Keepers keep to their doors, stepping out and back as the day goes. Deterministic from the tick. */
export function advanceShopkeepers(world) {
  for (const entity of Object.values(world.entities)) {
    if (!entity.shopSpot || entity.travel) continue;
    const site = world.map.sites[entity.townSiteId];
    if (!site) continue;
    const out = Math.floor(world.tick / 4 + entity.id.length) % 3 === 0 ? 0.03 : 0;
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
        ? [
          { id: `${trade}:${offer.id}:coin`, label: `${offer.label} for coin`, note: offer.does },
          { id: `${trade}:${offer.id}:food`, label: `${offer.label} for food`, note: offer.does },
        ]
        : [
          { id: `${trade}:${offer.id}:coin`, label: `${offer.label}: ${reales(offer.coin)}`, note: offer.does },
          { id: `${trade}:${offer.id}:food`, label: `${offer.label}: ${offer.food} food`, note: offer.does },
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
    // Sold by the unit: every whole one carried, and no more than the keeper's purse pays for.
    const carried = Math.floor(Math.min(household.resources[offer.good] ?? 0, carryCapacity(entity.chore?.mode)));
    const units = pay === 'coin' ? Math.min(carried, Math.floor(purseOf(world, trader) / offer.coinEach)) : carried;
    if (units < 1) return;
    household.resources[offer.good] = round((household.resources[offer.good] ?? 0) - units);
    if (pay === 'coin') {
      const got = units * offer.coinEach;
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
