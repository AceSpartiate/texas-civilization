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
/** The room this family's wagon has, given what it drives in. */
export const wagonSpaceFor = household => WAGON_SPACE - (household?.stock === true ? STOCK_SPACE : 0);

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
export function defaultLoad(random) {
  return canonical({ provisions: 3 + Math.floor(random() * 2), seed: 2, powder: STARTING_POWDER, axe: 1, hoe: 1, bedding: 1, pot: 1 });
}

/** The stores a load puts in the house. */
export function loadStores(load) {
  const stores = { food: 0, seed: 0, powder: 0 };
  for (const entry of load || []) {
    for (const [resource, amount] of Object.entries(ITEMS.get(entry.id)?.grants || {})) stores[resource] += amount * entry.amount;
  }
  return stores;
}
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
  if (amount > entry.most) return entry.most === 1 ? `A family brings one ${entry.name.toLowerCase()} at most.` : `The wagon takes ${entry.most} of those at most.`;
  const current = household.load.find(loaded => loaded.id === itemId)?.amount ?? 0;
  const after = spaceOf(household.load) + entry.space * (amount - current);
  const room = wagonSpaceFor(household);
  if (after > room) return `There is no room. That needs ${entry.space * (amount - current)} more, and the wagon has ${room - spaceOf(household.load)} left of ${room}${household.stock ? ' with the stock to feed' : ''}.`;
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
  household.resources = { ...household.resources, ...loadStores(load) };
  household.tools = Object.fromEntries(loadTools(load).map(tool => [tool, household.tools[tool] ?? 0]));
  household.belongings = loadBelongings(load);
  // The wagon on the road in is drawn with something in it, and unloaded where the journey ends
  // (`progressTravel` already clears `laden` at the family's own land).
  const wagon = world.entities[`${household.id}-wagon`];
  if (wagon && household.arriving) wagon.laden = load.length > 0;
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
  return { used: spaceOf(household.load), space: wagonSpaceFor(household), can: !why, ...(why && { why }) };
}

/** A household's load record is well formed and fits the wagon. Absent is a class saved before step 3. */
export function loadInvalid(household) {
  if (household.load === undefined) return household.belongings === undefined ? null : 'Belongings without a load';
  if (!Array.isArray(household.load)) return 'Invalid wagon load';
  const seen = new Set();
  for (const entry of household.load) {
    const known = ITEMS.get(entry?.id);
    if (!known || seen.has(entry.id) || !Number.isInteger(entry.amount) || entry.amount < 1 || entry.amount > known.most) return 'Invalid wagon load';
    seen.add(entry.id);
  }
  if (spaceOf(household.load) > wagonSpaceFor(household)) return 'The wagon is loaded past its space';
  // Belongings are held as a list of their own rather than read off the load, because furniture
  // (step 6) will add to them once the wagon is long unloaded. Every one must still be a real thing.
  if (!Array.isArray(household.belongings) || household.belongings.some(id => ITEMS.get(id)?.kind !== 'good')) return 'Invalid belongings';
  return null;
}
