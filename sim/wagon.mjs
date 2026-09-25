// What a family brings in the wagon, the room it takes, and what each thing becomes.
//
// docs/SETTLING_IN.md §4, step 3. Students choose what to load within the wagon's space, and
// **anything not loaded is not in the game**. So a family's starting stores, its building tools
// and its belongings are not set beside the load - they are *derived* from it, every time it
// changes. A student who puts in a barrel of meal and takes it out again finds the family with
// exactly what is in the wagon, not with a barrel spent and another handed back.
//
// **Every item, space and amount here is invented (`FIC-GONZ-024`).** §2 names the research this
// waits on - what a settler family of 1835 carried in a wagon - and until that lands with a claim
// nothing on this screen may be presented as history, so no description says what people did.
//
// The default load is packed when the household is created rather than at Start. The owner's
// words were that a student who joins late and never loads "is loaded with a sensible default at
// Start"; a wagon already packed when the lobby opens gives exactly that family exactly that
// default, and it needs no hook in the Start transition - which matters, because
// `sim/headless.mjs` starts a class without going through `server/app.mjs` at all.
//
// A class saved before this has no `load` on its households. Its stores are the ones it was
// founded with, and its wagon cannot be repacked: loading it would replace those stores with an
// empty wagon's. So it plays exactly as it did, and no save version moved.
//
// What the load does *not* do yet, on purpose:
// ceiling: tools are owned and not yet read. §5 makes a broadaxe the price of a hewn-log house;
// step 4 (houses) is the first thing that reads `household.tools.axe` and its fellows.
// ceiling: belongings are a list in the family's book and nothing more until step 6 (furniture)
// and step 7 (the interior view) give them rooms to stand in.

/**
 * How much room the wagon has.
 *
 * Invented (`FIC-GONZ-024`), and chosen so the sensible default fills most of it: a family that
 * wants a chest and chairs gives up meal for them, which is the decision this is for.
 * ceiling: this is not `carry` in `sim/travel.mjs`, which caps what one journey brings home from a
 * hunt or a harvest. Two numbers for one wagon is tolerable while one counts a move-in and the
 * other a day's haul; make them one when a family can pack the wagon again to leave (`HIST-GONZ-019`).
 */
export const WAGON_SPACE = 16;

/**
 * How much of that driving stock in costs: the herd is fed on the road (docs/LAND_GRANTS.md,
 * `FIC-GONZ-025`). Whether a family drives stock is `household.stock`, set in `sim/grants.mjs`.
 * ceiling: stock do nothing else yet - no herding, increase, sale or slaughter. The loose-stock
 * loss in an unfenced field stays the same for every family.
 */
export const STOCK_SPACE = 2;
/**
 * How many wagons the family packs (owner, 2026-09-25; sim/beasts.mjs `wagonsForPeople`, `fitOut`): the family wagon and every
 * one it was fitted out with at its roll, read off its property by id - `hh-1-wagon`, `hh-1-wagon-2` - because this file is
 * handed a household and never the world. Only the lobby packs, when nothing can have been bought or lost; a class saved before
 * has the one wagon it always had.
 */
export const wagonCount = household => Math.max(1, (household?.property || []).filter(id => id === `${household.id}-wagon` || id.startsWith(`${household.id}-wagon-`)).length);
/**
 * How much room a cart has, where a family of the poorest means comes with one in place of the wagon (owner, 2026-09-25;
 * sim/means.mjs, `FIC-GONZ-393`): three quarters of a wagon's. Invented, like the wagon's sixteen; the record has carts behind
 * one yoke and says nothing of what they held (`HIST-TEX-441`).
 */
export const CART_SPACE = 12;
/**
 * How much room a carreta has, the ox cart a family makes at home (owner, 2026-09-25: "have it be something families can make at
 * home? could work the same, just with reduced carrying capacity"; sim/carreta.mjs, `FIC-GONZ-398`): ten, to a cart's twelve and
 * a wagon's sixteen. It is read by the flight east (sim/scrape.mjs), since a carreta is made after the family has come in and is
 * never packed in the lobby. Invented: the record has the plank-wheeled carts and their squeaking axles, not what they held.
 */
export const CARRETA_SPACE = 10;
/**
 * How much room a family with no vehicle has for its load (owner, 2026-09-25: "yes, it should be possible to start with no
 * wagon"; sim/means.mjs, `FIC-GONZ-397`): what its one ox carries under a pack - seven, which is the hoe, the felling axe, the
 * seed its first planting wants (two sacks, or three for cotton) and a shot of powder, with a space to spare for corn: the
 * least the first steps want, the hunt among them (docs/LESSON.md). The family's food goes on its own backs (`household.packs`). Invented.
 */
export const PACK_SPACE = 7;
/** Whether this family's one vehicle is a cart (sim/means.mjs marks it, and the entity with it: `cart: true`). */
export const carted = household => household?.means?.cart === true;
/** Whether this family came with no vehicle, its load on the ox (sim/means.mjs: the band that is hard up). */
export const afoot = household => household?.means?.afoot === true;
/** "cart", "wagon", "wagons" or "packs": what the family's vehicles are called on the pack screen and in its refusals. */
export const vehicleWord = household => (afoot(household) ? 'packs' : carted(household) ? 'cart' : wagonCount(household) > 1 ? 'wagons' : 'wagon');
/** Whether the vehicle word is said as many ("the wagons have", "the packs have"). */
const many = household => afoot(household) || wagonCount(household) > 1;
/**
 * The room the family's wagons have together, before the stock is fed: sixteen a wagon (`FIC-GONZ-024`, `FIC-GONZ-391`), a
 * cart's twelve for the one vehicle of a family that came with a cart, and the ox's packs for a family that came with none.
 */
export const wagonRoom = household => afoot(household) ? PACK_SPACE : WAGON_SPACE * wagonCount(household) - (carted(household) ? WAGON_SPACE - CART_SPACE : 0);
/** The room this family's wagons have, given what it drives in. */
export const wagonSpaceFor = household => wagonRoom(household) - (household?.stock === true ? STOCK_SPACE : 0);
/**
 * The most of one thing the family packs: a store's lots go a wagon's worth to each wagon (eight barrels a wagon), and a tool
 * or a good is still one at most. ceiling: one felling axe however many wagons; a second tool is bought in town (docs/TOWNS.md §4c).
 */
export const mostFor = (household, entry) => entry.kind === 'stores' ? entry.most * wagonCount(household) : entry.most;

/**
 * What a family has in the house at the founding: three shots.
 *
 * Enough for a hunt, a second thought, and something to carry upriver, which is exactly the
 * tension it exists to create. Invented (`FIC-GONZ-016`). It lives here now because it is what
 * the default load packs; `sim/world.mjs` re-exports it for everything that already reads it.
 */
export const STARTING_POWDER = 3;

/**
 * The list. `space` is room in the wagon for one of the thing.
 *
 * `stores` are counted out in lots (`most` of them at a time) and become `household.resources`;
 * `tool` and `good` are one of each at most. A tool becomes a key in `household.tools` at no wear;
 * a good becomes an entry in `household.belongings`. `describe` is shown on the control before
 * the thing is chosen (`FIC-GONZ-008`), so it says what the thing does in this game - or, for
 * what nothing reads yet, that it is kept for the house.
 *
 * Powder and lead are one store because `sim/chores.mjs` spends them together: a shot costs one.
 */
const item = fields => Object.freeze({ most: 1, ...fields });
export const WAGON_ITEMS = Object.freeze([
  item({ id: 'provisions', kind: 'stores', name: 'Barrel of meal and salt meat', space: 1, most: 8, grants: { food: 4 },
    describe: 'Four food a barrel. It is what the family eats until the field or the timber feeds it.' }),
  item({ id: 'seed', kind: 'stores', name: 'Sack of seed', space: 1, most: 6, grants: { seed: 1 },
    describe: 'One seed a sack. Planting the field spends two; more has to be bought in Gonzales.' }),
  item({ id: 'powder', kind: 'stores', name: 'Powder and lead', space: 1, most: 6, grants: { powder: 1 },
    describe: 'One shot a lot. A hunt spends one, and whoever goes upriver takes what is in the house.' }),
  item({ id: 'hoe', kind: 'tool', name: 'Hoe', space: 1,
    describe: 'For planting, bringing in the crop and breaking ground. Without one, none of the field work can be done.' }),
  item({ id: 'axe', kind: 'tool', name: 'Felling axe', space: 2,
    describe: 'For felling trees. Kept for building a house: any log house will need one.' }),
  item({ id: 'broadaxe', kind: 'tool', name: 'Broadaxe', space: 1,
    describe: 'For hewing logs flat. Kept for building: a house of hewn logs will need it and the felling axe.' }),
  item({ id: 'froe', kind: 'tool', name: 'Froe', space: 1,
    describe: 'For riving roof boards. Kept for building: a board roof will need one; thatch will not.' }),
  item({ id: 'auger', kind: 'tool', name: 'Auger', space: 1,
    describe: 'For boring peg holes. Kept for building, and for making furniture at home.' }),
  item({ id: 'bedding', kind: 'good', name: 'Bedding', space: 2, describe: 'Kept for the house.' }),
  item({ id: 'pot', kind: 'good', name: 'Iron pot', space: 1, describe: 'Kept for the house.' }),
  item({ id: 'chest', kind: 'good', name: 'Chest', space: 3, describe: 'Kept for the house.' }),
  item({ id: 'spinning-wheel', kind: 'good', name: 'Spinning wheel', space: 3,
    describe: 'For spinning thread, once there is cotton or wool to spin. Kept for the house.' }),
  item({ id: 'books', kind: 'good', name: 'A few books', space: 1, describe: 'Kept for the house.' }),
  item({ id: 'mosquito-bars', kind: 'good', name: 'Mosquito bars', space: 1, describe: 'Netting to sleep under. Kept for the house.' }),
  item({ id: 'tinware', kind: 'good', name: 'Tinware', space: 1, describe: 'Tin plates, cups and a baking pan. Kept for the house.' }),
  item({ id: 'chairs', kind: 'good', name: 'Chairs, in pieces', space: 2, describe: 'Chairs taken apart to travel and put together on the land. Kept for the house.' }),
]);
const ITEMS = new Map(WAGON_ITEMS.map(entry => [entry.id, entry]));
export const wagonItem = id => ITEMS.get(id) ?? null;

/** The catalogue, for `/api/chores`: it never changes, so it is fetched once and not sent every tick. */
export const wagonCatalogue = () => ({ space: WAGON_SPACE, items: WAGON_ITEMS });

/** How much room a load fills. */
export const spaceOf = load => (load || []).reduce((used, entry) => used + (ITEMS.get(entry.id)?.space ?? 0) * entry.amount, 0);

/** A load in catalogue order, nothing at zero, so the same choices are always the same record. */
const canonical = amounts => WAGON_ITEMS.filter(entry => amounts[entry.id] > 0).map(entry => ({ id: entry.id, amount: amounts[entry.id] }));

/**
 * What a family that never opened the load screen brings.
 *
 * Three or four barrels (the one draw decides, and sits in the RNG stream exactly where the old
 * founding-food draw sat, so every seed makes the same land, crops and town as before), two sacks
 * of seed, three shots, a felling axe, a hoe, bedding and a pot: 14 or 15 of the 16.
 * ceiling: a default family can build the crudest house in step 4 and not the best. A default is
 * for a student who never chose, and it should not out-choose one who did.
 */
export function defaultLoad(random, crop = 'corn') {
  const barrels = 3 + Math.floor(random() * 2);
  // A cotton family brings the three sacks its first planting wants (docs/MONEY_AND_GLORY.md §8.1: cotton takes half again
  // the seed a plot) and a barrel the less, so the load is the room it always was: the dearer crop costs it meal.
  const cotton = crop === 'cotton';
  return canonical({ provisions: cotton ? barrels - 1 : barrels, seed: cotton ? 3 : 2, powder: STARTING_POWDER, axe: 1, hoe: 1, bedding: 1, pot: 1 });
}

/** The stores a load puts in the house. */
export function loadStores(load) {
  const stores = { food: 0, seed: 0, powder: 0 };
  for (const entry of load || []) {
    for (const [resource, amount] of Object.entries(ITEMS.get(entry.id)?.grants || {})) stores[resource] += amount * entry.amount;
  }
  return stores;
}
/**
 * The stores in the house from a load, with the food the family carries beside its vehicles (`household.packs`, sim/means.mjs
 * `ARRIVAL_DAYS`): fixed when its means are rolled, and never the load's to take away, so repacking the cart moves only what the
 * cart holds.
 */
export const storesWithPacks = (household, load) => { const stores = loadStores(load); stores.food += household?.packs?.food ?? 0; return stores; };
/** The tools a load puts in the house. */
export const loadTools = load => (load || []).filter(entry => ITEMS.get(entry.id)?.kind === 'tool').map(entry => entry.id);
/** The belongings a load puts in the house. */
export const loadBelongings = load => (load || []).filter(entry => ITEMS.get(entry.id)?.kind === 'good').map(entry => entry.id);

/** A fresh household's stores, tools and belongings, straight from its load. */
export function householdFromLoad(load) {
  return {
    resources: { ...loadStores(load), money: 0 },
    tools: Object.fromEntries(loadTools(load).map(tool => [tool, 0])),
    belongings: loadBelongings(load),
    load,
  };
}

/**
 * Why this family cannot set this thing to this amount now, or null when it can.
 *
 * With no item it answers for the wagon as a whole, which is what the projection asks.
 */
export function loadRefusal(world, household, itemId, amount) {
  if (!household) return 'No family to load.';
  if (world.status !== 'lobby') return 'The class has begun. What the wagon brought is what the family has.';
  if (!household.load) return 'This family packed its wagon before there was any choosing, and it has what it came with.';
  if (itemId === undefined) return null;
  const entry = ITEMS.get(itemId);
  if (!entry) return 'That is not one of the things a family can bring.';
  if (!Number.isInteger(amount) || amount < 0) return 'Say how many, in whole things.';
  const most = mostFor(household, entry), wagons = wagonCount(household);
  if (amount > most) return most === 1 ? `A family brings one ${entry.name.toLowerCase()} at most.` : wagons > 1 ? `The ${wagons} wagons take ${most} of those at most.` : `The ${vehicleWord(household)} ${many(household) ? 'take' : 'takes'} ${most} of those at most.`;
  const current = household.load.find(loaded => loaded.id === itemId)?.amount ?? 0;
  const after = spaceOf(household.load) + entry.space * (amount - current);
  const room = wagonSpaceFor(household);
  if (after > room) return `There is no room. That needs ${entry.space * (amount - current)} more, and the ${wagons > 1 ? `${wagons} wagons have` : `${vehicleWord(household)} ${many(household) ? 'have' : 'has'}`} ${room - spaceOf(household.load)} left of ${room}${household.stock ? ' with the stock to feed' : ''}.`;
  return null;
}

/**
 * Set how many of one thing are in the wagon, and make the household what the wagon says.
 *
 * Stores, tools and belongings are recomputed from the whole load, never added to. Money is not
 * cargo, and a tool's wear cannot have moved in the lobby, so both are left alone. Nothing is
 * recorded: a student may pack and unpack twenty times before Start, and the family's story is
 * not the place for that. What came in is said once, when the family reaches its land
 * (`advanceArrivals` in `sim/settling.mjs`).
 */
export function setLoad(world, household, itemId, amount) {
  const why = loadRefusal(world, household, itemId, amount);
  if (why) throw new Error(why);
  const amounts = Object.fromEntries(household.load.map(entry => [entry.id, entry.amount]));
  amounts[itemId] = amount;
  const load = canonical(amounts);
  household.load = load;
  household.resources = { ...household.resources, ...storesWithPacks(household, load) };
  household.tools = Object.fromEntries(loadTools(load).map(tool => [tool, household.tools[tool] ?? 0]));
  household.belongings = loadBelongings(load);
  // The wagons on the road in are drawn with something in them, and unloaded where the journey ends
  // (`progressTravel` already clears `laden` at the family's own land).
  if (household.arriving) for (const wagon of wagonsOf(world, household)) wagon.laden = load.length > 0;
  return load;
}
/** Every wagon of the family's, the family wagon first (the same reading as sim/beasts.mjs `beastsOf`, by id, for this file). */
export const wagonsOf = (world, household) => (household?.property || []).map(id => world.entities[id]).filter(entity => entity?.kind === 'wagon');

/**
 * The load packed again for the wagons a family is fitted out with at its roll (sim/world.mjs `rollFamily`): every store the
 * wagon held goes into each wagon - a family of twelve in two wagons brings twice the meal, seed and powder a family of four
 * brings in one - and the tools and goods are still one of each. It is the same sensible default the one wagon had, for a
 * family that never opens the load screen, and a student repacks it like any other (`FIC-GONZ-391`). Returns the load.
 */
export function loadForWagons(world, household) {
  if (!household.load) return null;
  const wagons = wagonCount(household);
  const amounts = Object.fromEntries(household.load.map(entry => [entry.id, ITEMS.get(entry.id)?.kind === 'stores' ? Math.min(entry.amount * wagons, mostFor(household, ITEMS.get(entry.id))) : entry.amount]));
  const load = canonical(amounts);
  household.load = load;
  household.resources = { ...household.resources, ...storesWithPacks(household, load) };
  if (household.arriving) for (const wagon of wagonsOf(world, household)) wagon.laden = load.length > 0;
  return load;
}

/**
 * The load made to fit the family's room, for a family whose means have just been rolled (sim/means.mjs `applyMeans`): the stores
 * packed a wagon's worth to each wagon (as `loadForWagons` packs them), and then, where a cart has less room than the load, a barrel of meal out
 * at a time down to one, then the powder down to one shot, then the last barrel, then the bedding and the pot - what a family of
 * the poorest means leaves behind to bring the hoe, the axe and the seed. Tools and seed are never taken out: the family's first
 * steps need them (docs/LESSON.md). Returns the load.
 * ceiling: the order things come out is the game's own; a student repacks the cart as they like before Start.
 */
export const TRIM_ORDER = Object.freeze([['provisions', 1], ['powder', 1], ['provisions', 0], ['bedding', 0], ['pot', 0], ['powder', 0]]);
export function packForRoom(world, household) {
  if (!household.load) return null;
  // What the load put in the house before, so what changes is the difference: in the lobby the stores are the load's, and a
  // family given its means on the first running tick (sim/means.mjs `settleMeans`) keeps whatever else it has.
  const before = loadStores(household.load);
  const wagons = wagonCount(household);
  const amounts = Object.fromEntries(household.load.map(entry => [entry.id, ITEMS.get(entry.id)?.kind === 'stores' ? Math.min(entry.amount * wagons, mostFor(household, ITEMS.get(entry.id))) : entry.amount]));
  const used = () => spaceOf(Object.entries(amounts).map(([id, amount]) => ({ id, amount })));
  for (const [id, floor] of TRIM_ORDER) while (used() > wagonSpaceFor(household) && (amounts[id] ?? 0) > floor) amounts[id]--;
  const load = canonical(amounts);
  household.load = load;
  const after = loadStores(load);
  household.resources = { ...household.resources, ...Object.fromEntries(Object.keys(after).map(resource => [resource, Math.max(0, (household.resources?.[resource] ?? 0) + after[resource] - before[resource])])) };
  household.tools = Object.fromEntries(loadTools(load).map(tool => [tool, household.tools?.[tool] ?? 0]));
  household.belongings = loadBelongings(load);
  if (household.arriving) for (const wagon of wagonsOf(world, household)) wagon.laden = load.length > 0;
  return load;
}

/** The names of what a load brought, for the one line that says so. */
export function loadSentence(load) {
  const names = (load || []).map(entry => {
    const { name, kind } = ITEMS.get(entry.id);
    return kind === 'stores' && entry.amount > 1 ? `${entry.amount} × ${name.toLowerCase()}` : name.toLowerCase();
  });
  if (!names.length) return 'The wagon came in empty.';
  return `They unload what they brought: ${names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names.at(-1)}` : names[0]}.`;
}

/**
 * Whether this family's wagon can be repacked, for the load screen, with the server's sentence
 * when it cannot. The load itself is not repeated: `household` already rides on the tick with it.
 *
 * Sent only in the lobby. Once the class is running there is nothing to repack, and a refusal
 * nobody can act on has no business costing every student bytes every tick. Null, too, for a
 * class saved before there was a load.
 */
export function wagonProjection(world, household) {
  if (!household?.load || world.status !== 'lobby') return null;
  const why = loadRefusal(world, household);
  const wagons = wagonCount(household);
  // More than one wagon: how many, and the most of each store they take together, so the page's `+` stops where the server does.
  const most = wagons > 1 ? Object.fromEntries(WAGON_ITEMS.filter(entry => entry.kind === 'stores').map(entry => [entry.id, mostFor(household, entry)])) : null;
  // A cart (sim/means.mjs): the panel packs "the cart" and says so, with the cart's room.
  return { used: spaceOf(household.load), space: wagonSpaceFor(household), can: !why, ...(why && { why }), ...(most && { wagons, most }), ...(carted(household) && { vehicle: 'cart' }), ...(afoot(household) && { vehicle: 'packs' }), ...(household.packs?.food && { packs: household.packs.food }) };
}

/** A household's load record is well formed and fits the wagon. Absent is a class saved before step 3. */
export function loadInvalid(household) {
  if (household.load === undefined) return household.belongings === undefined ? null : 'Belongings without a load';
  if (!Array.isArray(household.load)) return 'Invalid wagon load';
  const seen = new Set();
  for (const entry of household.load) {
    const known = ITEMS.get(entry?.id);
    if (!known || seen.has(entry.id) || !Number.isInteger(entry.amount) || entry.amount < 1 || entry.amount > mostFor(household, known)) return 'Invalid wagon load';
    seen.add(entry.id);
  }
  if (spaceOf(household.load) > wagonSpaceFor(household)) return 'The wagon is loaded past its space';
  // Belongings are held as a list of their own rather than read off the load, because furniture
  // (step 6) will add to them once the wagon is long unloaded. Every one must still be a real thing.
  if (!Array.isArray(household.belongings) || household.belongings.some(id => ITEMS.get(id)?.kind !== 'good')) return 'Invalid belongings';
  return null;
}
