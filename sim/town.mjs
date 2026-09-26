// The people of Gonzales.
//
// `HIST-GONZ-011` documents thirty-two structures by 1836 and nothing about who lived in
// them. `HISTORY.md` records that the **population of Gonzales in 1835 was searched for
// and NOT FOUND**, and must not be stated. So this file does not model a town's worth of
// people, and nothing in the interface counts them: it gives a student three named people
// they can actually meet, and says plainly that they are invented.
//
// They are fictional in exactly the way the player households are fictional, and they are
// registered as `FIC-GONZ-009`. Their trades are invented too. A settlement of this size
// plausibly had someone who worked iron, but plausible is not documented, so the claim
// lives in the fiction registry rather than being smuggled in as scenery.
//
// Real people connected to this place - Ezekiel Williams, Byrd Lockhart, Green DeWitt -
// are deliberately NOT used here. A named historical person requires their own checked
// claim, and putting one behind a trade counter would invent a life for them.
import { record } from './events.mjs';
import { appearanceCode, appearanceOf } from './appearance.mjs';
import { advanceShopkeepers, createShopkeepers, keeperSex, KEEPERS } from './shops.mjs';
import { householdName, sexOf, bandOf } from './family.mjs';
import { facingOf, ridersInSight } from './encounters.mjs';
import { heldByBattle } from './battle-stage.mjs';
import { advanceTownScenes, residentSpot } from './town-scenes.mjs';

/**
 * How much coin the Gonzales store holds at the start of a class, per family in it.
 *
 * The owner chose a limited purse, and it is the scarcity `HIST-GONZ-023` documents made
 * directly visible: not ten transactions in a hundred used specie, so a storekeeper had little
 * coin to pay out. Two reales a family is invented (`FIC-GONZ-022`). Coin a family pays in
 * goes back into the purse; nothing else refills it.
 */
export const STORE_PURSE_PER_FAMILY = 2;
/** The coin a trader holds, without changing anything - safe to call while building a projection. */
export const purseHeld = (world, trader) => !trader ? 0 : Number.isInteger(trader.purse) ? trader.purse : STORE_PURSE_PER_FAMILY * (world.playerCount || 15);
/** The coin a trader holds, set on first use for a class saved before there was a purse. Only for steps that change it. */
export function purseOf(world, trader) {
  if (!trader) return 0;
  if (!Number.isInteger(trader.purse)) trader.purse = STORE_PURSE_PER_FAMILY * (world.playerCount || 15);
  return trader.purse;
}
export const RESIDENTS = [
  {
    id: 'town-ibarra', name: 'Marta Ibarra', sex: 'female', trade: 'seed', deals: ['seed', 'powder', 'cotton', 'food'],
    // Deliberately mixed: DeWitt's colony was in Mexican Texas, and a town there was not
    // uniformly Anglo. This is a fictional person, not a representative of anyone.
    // She has always been the general store; now the description says so, and she takes
    // the cotton as well as selling the seed and the powder.
    about: 'keeps the general store off the commons: seed, powder and lead, and she buys cotton',
    round: [{ x: -.16, y: -.10 }, { x: -.05, y: .02 }, { x: -.20, y: .06 }],
  },
  {
    id: 'town-pike', name: 'Josiah Pike', sex: 'male', trade: 'iron',
    about: 'works iron, and will set a worn tool right for a price',
    round: [{ x: .18, y: .08 }, { x: .24, y: -.02 }, { x: .12, y: .12 }],
  },
  {
    // The carpenter (docs/SETTLING_IN.md §6): a table, benches, a bedstead, shelves or a cradle, for coin or food.
    // Invented, like everybody here (FIC-GONZ-009); 1835 Gonzales had some thirty-odd buildings, and no named carpenter was found.
    id: 'town-carpenter', name: 'Anselmo Lozano', sex: 'male', trade: 'furniture',
    about: 'is the carpenter: tables, benches, bedsteads, shelves and cradles, for coin or for food',
    round: [{ x: .08, y: -.14 }, { x: .14, y: -.06 }, { x: .02, y: -.10 }],
  },
  {
    id: 'town-crandall', name: 'Ruth Crandall', sex: 'female', trade: null,
    about: 'is usually somewhere on the commons',
    round: [{ x: .02, y: .16 }, { x: -.08, y: .20 }, { x: .10, y: .18 }, { x: 0, y: .10 }],
  },
];

const round = value => { const fixed = +value.toFixed(2); return fixed === 0 ? 0 : fixed; };

/**
 * A storekeeper for every other settlement families live near, on the real map (docs/COLONIES.md, owner 2026-09-14:
 * a store at each settlement). Invented people, registered as FIC-GONZ-009 like Marta Ibarra, with invented names;
 * no real merchant of any of these towns is used, for the reason the Gonzales residents give above. Each sells seed,
 * powder and ironware, and buys cotton and food, from a purse sized to the families near it.
 */
export const STOREKEEPERS = Object.freeze({
  'san-felipe': { name: 'Hiram Stovall', pronoun: 'he', round: [{ x: -.14, y: -.08 }, { x: -.04, y: .03 }, { x: -.18, y: .07 }] },
  columbia: { name: 'Adelaide Vance', pronoun: 'she', round: [{ x: .12, y: -.10 }, { x: .02, y: .02 }, { x: .16, y: .05 }] },
  matagorda: { name: 'Lucius Farrow', pronoun: 'he', round: [{ x: -.10, y: .12 }, { x: .02, y: .06 }, { x: -.16, y: .02 }] },
  mina: { name: 'Tomasa Villegas', pronoun: 'she', round: [{ x: .10, y: .10 }, { x: -.02, y: .04 }, { x: .14, y: -.02 }] },
  liberty: { name: 'Amos Whitcomb', pronoun: 'he', round: [{ x: -.12, y: -.12 }, { x: 0, y: -.02 }, { x: -.16, y: .04 }] },
  victoria: { name: 'Inés Cárdenas', pronoun: 'she', round: [{ x: .14, y: -.06 }, { x: .04, y: .04 }, { x: .18, y: .08 }] },
});

/** A carpenter at every other settlement a family lives near, on the real map. Invented people, FIC-GONZ-009. */
export const CARPENTERS = Object.freeze({
  'san-felipe': { name: 'Ezekiel Marsh', sex: 'male', round: [{ x: .10, y: -.12 }, { x: .16, y: -.04 }] },
  columbia: { name: 'Pablo Garza', sex: 'male', round: [{ x: -.10, y: .12 }, { x: -.16, y: .04 }] },
  matagorda: { name: 'Nathaniel Toombs', sex: 'male', round: [{ x: .12, y: .10 }, { x: .06, y: .16 }] },
  mina: { name: 'Gideon Ashby', sex: 'male', round: [{ x: -.12, y: -.08 }, { x: -.06, y: -.14 }] },
  liberty: { name: 'Juan Manuel Rosales', sex: 'male', round: [{ x: .12, y: .08 }, { x: .18, y: .02 }] },
  victoria: { name: 'Absalom Grier', sex: 'male', round: [{ x: -.14, y: .08 }, { x: -.08, y: .14 }] },
});

const pronounSex = pronoun => pronoun === 'she' ? 'female' : 'male';
/**
 * The sex authored for a townsperson, found by their id: for a class saved before 2026-09-24, when nobody in a town had a
 * `sex` and the page drew each by a hash of the id (Marta Ibarra could be an old man and Josiah Pike a woman). The same
 * tables every townsperson is made from, so a saved class and a new one draw the same keeper the same way; the missing field
 * has a correct value, so no save version moved. Null for anybody who is not one of them.
 */
export function townsfolkSex(id) {
  const resident = RESIDENTS.find(person => person.id === id);
  if (resident) return resident.sex;
  const [, kind, ...rest] = String(id).split('-'), settlementId = rest.join('-');
  if (kind === 'store' && STOREKEEPERS[settlementId]) return pronounSex(STOREKEEPERS[settlementId].pronoun);
  if (kind === 'carpenter' && CARPENTERS[settlementId]) return CARPENTERS[settlementId].sex;
  if (KEEPERS[settlementId]?.[kind]) return keeperSex(settlementId, kind);
  return null;
}
/**
 * What a glance tells you of a person, and all the map needs to draw them as who they are: a man or a woman, and roughly how
 * old - never the exact age. The one answer every projection sends (a student's own family in sim/world.mjs `projectWorld`,
 * somebody met in `observedBy` below, everybody on the Host's map in sim/overview.mjs), and public/motion.js `figureOf` draws
 * from it. Nothing hidden rides with it: the hidden stats (`traits`, docs/FAMILY_CREATION.md §4) are never read here.
 */
export function seenAs(entity, world = null) {
  const sex = sexOf(entity) || (entity?.resident ? townsfolkSex(entity.id) : null), band = bandOf(entity);
  const appearance = world && appearanceOf(world, entity);
  return { ...(sex && { sex }), ...(band && { band }), ...(appearance && { a: appearanceCode(appearance, sex) }) };
}

/** Put the residents in the town. Called once, when the world is built. */
export function createTownspeople(world) {
  // On the real map, a store in every other settlement a family lives near, with a purse for the families near it.
  const near = Object.values(world.map.sites).filter(site => site.kind === 'homestead' && site.settlementId);
  for (const [settlementId, keeper] of Object.entries(STOREKEEPERS)) {
    const families = near.filter(site => site.settlementId === settlementId).length;
    const place = world.map.sites[settlementId];
    if (!families || !place) continue;
    const id = `town-store-${settlementId}`;
    world.entities[id] = {
      id, name: keeper.name, sex: pronounSex(keeper.pronoun), kind: 'person', householdId: null, depth: 'moderate', principal: false, resident: 'seed',
      deals: ['seed', 'powder', 'cotton', 'food', 'iron'], purse: STORE_PURSE_PER_FAMILY * families, townSiteId: settlementId,
      about: `keeps the store at ${place.name}: seed, powder and lead, ironware, and ${keeper.pronoun} buys cotton`,
      location: { x: round(place.x + keeper.round[0].x), y: round(place.y + keeper.round[0].y), siteId: settlementId },
      travel: null, health: { condition: 'well' }, task: 'work',
    };
  }
  for (const [settlementId, carpenter] of Object.entries(CARPENTERS)) {
    const families = near.filter(site => site.settlementId === settlementId).length;
    const place = world.map.sites[settlementId];
    if (!families || !place) continue;
    const id = `town-carpenter-${settlementId}`;
    world.entities[id] = {
      id, name: carpenter.name, sex: carpenter.sex, kind: 'person', householdId: null, depth: 'moderate', principal: false, resident: 'furniture',
      deals: ['furniture'], townSiteId: settlementId,
      about: `is the carpenter at ${place.name}: tables, benches, bedsteads, shelves and cradles, for coin or for food`,
      location: { x: round(place.x + carpenter.round[0].x), y: round(place.y + carpenter.round[0].y), siteId: settlementId },
      travel: null, health: { condition: 'well' }, task: 'work',
    };
  }
  const town = world.map.sites.gonzales;
  if (!town) return;
  // On the real map Gonzales's store holds coin for the families near Gonzales, not the whole class.
  const gonzalesFamilies = near.length ? near.filter(site => site.settlementId === 'gonzales').length : (world.playerCount || 15);
  for (const resident of RESIDENTS) {
    world.entities[resident.id] = {
      id: resident.id, name: resident.name, sex: resident.sex, kind: 'person',
      // No household: they are not anybody's family, and no student commands them.
      // `resident` is what this person is known for and is what the student is shown;
      // `deals` is everything they will actually trade in. Marta's own description has
      // always said "seed and stores", and powder is stores.
      householdId: null, depth: 'moderate', principal: false, resident: resident.trade || 'none',
      deals: resident.deals || [resident.trade].filter(Boolean),
      // Coin the storekeeper can pay out (docs/MONEY_AND_GLORY.md, owner's choice of a limited
      // purse). Only somebody who buys goods for coin needs one.
      ...((resident.deals || []).includes('cotton') && { purse: STORE_PURSE_PER_FAMILY * gonzalesFamilies }),
      // What this person is, in their own words. It lives here rather than in the client,
      // which had its own copy keyed off `resident` - so changing the table changed the
      // table and nothing a student could see.
      about: resident.about,
      location: { x: round(town.x + resident.round[0].x), y: round(town.y + resident.round[0].y), siteId: 'gonzales' },
      travel: null, health: { condition: 'well' }, task: 'work',
    };
  }
  // The shops of the towns (sim/shops.mjs, docs/TOWNS.md), after the residents so Gonzales's smith is Josiah Pike.
  createShopkeepers(world, near);
}

/**
 * Residents go about their day. This is the cheapest thing that makes a place look
 * inhabited, and it is the lesson Widelands teaches by omission: its buildings mostly
 * have no "working" animation at all, and the sense of life comes from people visibly
 * moving between places. Nobody here is simulated beyond where they are standing.
 */
export function advanceTown(world) {
  advanceShopkeepers(world);
  // The storekeepers of the other settlements keep to their own counters.
  for (const [settlementId, keeper] of Object.entries(STOREKEEPERS)) {
    const entity = world.entities[`town-store-${settlementId}`], place = world.map.sites[settlementId];
    if (!entity || entity.travel || !place || entity.shopSpot) continue;
    const spot = keeper.round[Math.floor(world.tick / 3 + entity.id.length) % keeper.round.length];
    entity.location = { x: round(place.x + spot.x), y: round(place.y + spot.y), siteId: settlementId };
  }
  for (const [settlementId, carpenter] of Object.entries(CARPENTERS)) {
    const entity = world.entities[`town-carpenter-${settlementId}`], place = world.map.sites[settlementId];
    if (!entity || entity.travel || !place || entity.shopSpot) continue;
    const spot = carpenter.round[Math.floor(world.tick / 3 + entity.id.length) % carpenter.round.length];
    entity.location = { x: round(place.x + spot.x), y: round(place.y + spot.y), siteId: settlementId };
  }
  const town = world.map.sites.gonzales;
  if (!town) return;
  for (const resident of RESIDENTS) {
    const entity = world.entities[resident.id];
    if (!entity || entity.travel || entity.shopSpot) continue;
    // In the days before the fight the town's scenes put them where the town was gathering (sim/town-scenes.mjs); the page
    // walks them there.
    const scene = residentSpot(world, resident.id);
    if (scene) { entity.location = { ...scene, siteId: 'gonzales' }; continue; }
    // Deterministic from the tick, so a reloaded world puts everyone back where they were.
    const spot = resident.round[Math.floor(world.tick / 3 + resident.id.length) % resident.round.length];
    entity.location = { x: round(town.x + spot.x), y: round(town.y + spot.y), siteId: 'gonzales' };
  }
  // Anybody of a family lending a hand in one of those scenes whose work is done, or who has been sent elsewhere, stops.
  advanceTownScenes(world);
}

/** Whoever is standing at this site and deals in this trade, or null. */
export function traderAt(world, siteId, trade) {
  // A class saved before anybody dealt in more than one thing has no `deals`, and the
  // correct reading of that is the one trade they were known for - so no save moved.
  return Object.values(world.entities).find(entity =>
    (entity.deals ? entity.deals.includes(trade) : entity.resident === trade)
    && entity.location?.siteId === siteId && entity.health?.condition === 'well') || null;
}

export function recordTrade(world, householdId, entity, trader, what) {
  record(world, 'consequence', {
    actorId: entity.id, householdId,
    text: `${entity.name} traded with ${trader.name} at ${world.map.sites[trader.location?.siteId]?.name || 'Gonzales'} for ${what}.`,
  });
}

/**
 * What one household is permitted to see of somebody else.
 *
 * A student sees their own family in full. They see anyone else only where one of their
 * own people is standing, and then only what standing next to a person would show: who
 * they are, where they are, and what they appear to be doing. Never their household's
 * stores, their skills, their errand, their reports or their memories.
 *
 * This is the same rule as the rest of the projection, applied to people rather than
 * facts: the filtering happens here, on the server, and the renderer is never handed
 * something it is expected not to draw.
 */
export function observedBy(world, householdId) {
  if (!householdId) return [];
  const mine = Object.values(world.entities).filter(entity => entity.householdId === householdId && entity.location?.siteId);
  const places = new Set(mine.map(entity => entity.location.siteId));
  // Somebody in the line of a fight is out on the field, not standing in the town the camp is named for: a family camped at
  // Lynchburg does not see the men at San Jacinto, and is not sent them (docs/BATTLES.md §2.1). A family with its own man in
  // that fight is sent the fight, and them in it, by the battle itself (`members`).
  const inTheField = entity => Boolean(heldByBattle(world, entity)) && !mine.some(own => heldByBattle(world, own));
  const standingWith = Object.values(world.entities)
    .filter(entity => entity.householdId !== householdId && entity.kind === 'person' && places.has(entity.location?.siteId) && !inTheField(entity))
    // Somebody of another family who fell at the Alamo is not seen standing at his post again (sim/alamo-battle.mjs); nothing
    // of how or when is sent - he is simply not among the living one can see.
    .filter(entity => !(Number.isFinite(entity.service?.fellAt) && entity.service.fellAt <= world.minute))
    // Nor is a prisoner walked south out of sight down the road to Matamoros (sim/south.mjs `marchPrisoners`).
    .filter(entity => !Number.isFinite(entity.service?.offMap));
  // A rider carrying word is visible while they are still coming, because watching
  // somebody ride up to your door is the arrival, and news that materialises at the moment
  // it is spoken has no approach at all. Anybody within sight of one of this family's own
  // people, since a rider now stops for whoever they come alongside; what they carry stays
  // on the server exactly as before.
  const riders = ridersInSight(world, householdId).filter(rider => !standingWith.includes(rider));
  return [...standingWith, ...riders]
    .map(entity => ({
      id: entity.id, name: entity.name, kind: 'person', ...(entity.about && { about: entity.about }),
      // What a glance tells you: a man or a woman, and roughly how old. Never the exact age.
      ...seenAs(entity, world),
      // Whose family they belong to is visible - that is the point of meeting them - but
      // nothing about that family's private state travels with it.
      householdId: entity.householdId, resident: entity.resident || null,
      // A rider is visibly a rider, on a horse. That is all it says: `report` never
      // leaves the server, and seeing one tells you nothing about what they carry. It
      // reads `courier` rather than `report` because delivering a message does not put
      // somebody off their horse - the errand ends, the horse does not.
      ...(entity.courier || entity.report ? { carrier: true, ...facingOf(world, entity) } : {}),
      // Travis's runner, on foot inside the Alamo (sim/alamo-runner.mjs): turned to whoever he is speaking with, as a rider is.
      // Nothing of what he says or whom he was sent to travels.
      ...(entity.runner ? facingOf(world, entity) || {} : {}),
      // The family's own fictional name, not the student's. Every household is currently a
      // copy of the same four people, so "Thomas" alone cannot tell two families apart.
      // Which family, said the way that family is known - and a household nobody has
      // named is known by its principal rather than by a row number.
      household: world.households[entity.householdId] ? householdName(world, world.households[entity.householdId]) : null,
      location: { x: entity.location.x, y: entity.location.y, siteId: entity.location.siteId },
      // Only a rider's route travels, and only to the family it is riding to - so the
      // road on the wire is the road up to that student's own door. It is here so the
      // approach is drawn as movement rather than as a figure jumping a mile a tick.
      ...((entity.courier || entity.report) && entity.travel ? { travel: { points: entity.travel.points, progress: entity.travel.progress, distance: entity.travel.distance } } : {}),
      task: entity.task === 'travel' ? 'travel' : entity.task,
      condition: entity.health?.condition || 'well',
      observed: true,
    }));
}
