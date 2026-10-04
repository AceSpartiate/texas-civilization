// The family panel (docs/FAMILY_PANEL.md, owner 2026-09-15): a row per person down the left of the map - father, mother,
// then the children oldest first - with a portrait, a name that saves itself, and an icon for every action the server
// offers that person now.
//
// Nothing here decides what is possible. Which actions a person has, and why any is refused, come from the projection
// (`world.work`, `world.travelModes`, `world.household.mainId`); what somebody is doing, and so which icon glows, comes from
// the projection too. This module only orders, words and draws what was sent, and it imports nothing, so the rules it does
// hold - the order, the sentences, the glow, the call's menu - are tested headlessly (tests/family-panel.test.mjs,
// tests/family-commands.test.mjs).

/**
 * One sentence for every action, shown when an icon is hovered or focused.
 *
 * Written here rather than cut from the chore catalogue's `describe`, which is several sentences of how and why: the
 * owner asked for one sentence of what. Every chore in `CHORES` must have one; a chore added without one fails a test.
 */
export const PANEL_SUMMARIES = Object.freeze({
  'survey-plot': 'Walk out to a place you choose on your land and stake out ten acres.',
  'cut-lane': 'Cut the brush and timber out of the lane between the house and the road.',
  'dig-well': 'Dig down by the house until there is water, so nobody has to carry it from the creek.',
  'fence-yard': 'Split rails and fence a yard round the house for the little ones to play in.',
  'plant-field': 'Put in corn to eat or cotton to sell, on every bare plot or one you choose on the map.',
  'harvest-field': 'Cut the crop on every ripe plot and carry it in: corn is food, cotton goes to the store.',
  'clear-plot': 'Grub, cut and break a staked plot you choose on the map so it can be planted.',
  'fence-plot': 'Split rails and fence a cleared plot you choose on the map against the loose stock.',
  'build-house': 'Put work into the house the family has chosen until it stands.',
  'help-raise': 'Help the neighbours here raise the walls of the house going up on their land.',
  'hunt-timber': 'Go out to the nearest timber or brush to hunt, and carry home what they can.',
  'hunt-land': 'Hunt at a place you choose on the family’s own land, and carry home what they can.',
  'practise-shooting': 'Spend an afternoon and two powder shooting at a mark to steady their aim.',
  'take-small-game': 'An hour after squirrels and rabbits in the timber: one shot, and nobody comes home empty.',
  'fish-the-water': 'Sit down at the water with a line and bring home what is on it, with no powder and no knack needed.',
  'gather-oysters': 'Walk down to the beds along the shore and gather what can be carried home.',
  'cut-bee-tree': 'Take the axe to the tree the bees are working, and bring the honey home.',
  'fish-road': 'Sit at the water while the family waits at the crossing, and take food out of the river.',
  'butcher-beef': 'Kill a beef: the family keeps what it can and the neighbours get the rest, because it will not keep.',
  'butcher-hog': 'Kill a hog and salt it down, which is meat that keeps.',
  'look-to-stock': 'Ride the range after the stock to count it, mark the calves and bring in strays; a herd minded through the month is fatter and raises more young.',
  'sell-cotton': 'Carry the cotton to the store in town and trade it for food or coin.',
  'fetch-powder': 'Go to the store in town and buy powder and lead.',
  'fetch-seed': 'Go to the store in town and buy seed.',
  'sell-food': 'Carry spare food to the store in town and sell it for coin.',
  'mend-hoe': 'Set the worn hoe right again at home.',
  'replace-hoe': 'Go to the smith in town and buy a sound hoe for coin.',
  'visit-shop': 'Choose what they should buy and sell at the shops in town, then send them with the list.',
  // The old walk to the shops, kept only for a class saved in the middle of it (docs/TOWNS.md §4b): offered to nobody.
  'visit-shop-street': 'Walk the street in town, choosing a shop there and what to buy at its counter.',
  'make-furniture': 'Make a piece of furniture for the house from a log off the pile, or a small tree from the timber when the pile has none to spare.',
  'buy-furniture': 'Go to the carpenter in town and buy a piece of furniture for coin or food.',
  // One press since 2026-09-28 (owner: "Why do we need multiple action buttons for moving logs?"): out to the nearest timber, the
  // logs onto the pile. Hauling and fetching logs are part of it and have no icon of their own; the two below are only for a row
  // in the middle of one in a class saved before (they glow as felling, `GLOWS_AS`).
  'fell-trees': 'Go out with the felling axe to the nearest timber on the family’s land; the logs go onto the pile at the house.',
  'haul-logs': 'Bring the felled logs lying out to the house.',
  'fetch-logs': 'Take the ox and wagon to the nearest timber, off your land if need be, and bring six logs home.',
  'make-carreta': 'Make an ox cart at home from three logs of the pile and a rawhide, which carries less than a wagon.',
  'enlist-regular': 'Go to San Felipe and enlist in the regular army for $24 and 800 acres of land, promised.',
  'enlist-auxiliary': 'Go to San Felipe and sign on as an auxiliary volunteer, for 640 acres or 320, promised.',
  'join-garrison': 'Go to Béxar and join the men holding the town and the Alamo.',
  'join-matamoros': 'Go south to Refugio and join the volunteers bound for Matamoros.',
  'go-vote': 'Go into town and vote for the delegates to the convention.',
  'join-relief': 'Ride to Gonzales to go in to the Alamo with the men gathering there.',
  'join-houston': 'Go to the camp of General Houston\'s army and stay with it.',
  // A Tejano family's men (sim/tejano.mjs, owner 2026-09-29).
  'join-seguin': 'Go to Houston\'s army and join Juan Seguín\'s company of Tejanos, its rear guard.',
  'hunt-road': 'Halt the family on the road east and go out from the camp for game, powder in hand.',
  'tend-sick': 'Halt the family for a day and nurse whoever is sick, so nobody in their care dies and the sick mend sooner.',
  // The owner's "stopping to rest should help characters recover" (sim/disease.mjs, docs/DISEASE.md §3.7).
  'rest-road': 'Stop the family on the road a day so its sick rest: twice the mending and half the risk, and no miles made.',
  'camp-apart': 'Move the camp upstream, away from the crowd and the sickness going round it, and trade with nobody there.',
  'nurse-home': 'Stay by whoever is sick at home and nurse them, so nobody in their care dies and the sick mend sooner.',
  'trade-crossing': 'Buy food with a real among the families camped at the crossing or the refuge, dear as it is.',
  'winter-recall': 'Send for them to leave where they serve and come home.',
  'camp-drill': 'Spend a day drilling with the company at the camp; three days make them steady in the line.',
  'camp-forage': 'Spend a day out for the mess, bringing beef and corn in to the camp.',
  'camp-guard': 'Stand a night on the camp guard.',
  'camp-scout': 'Ride out with the scouts for a day to find the enemy, which wants a horse and can bring them back hurt.',
  // What a family's children can be set to (sim/children.mjs, docs/FAMILY_CREATION.md §3's amendment of 2026-09-21).
  'child-play': 'Let them have the rest of the day to themselves at whatever play they choose, which makes nothing and is the point of it.',
  // The kinds of play and the hens (sim/children.mjs `PLAY_KINDS`, owner 2026-09-26: "different types of play").
  'child-stick-horse': 'Let them gallop a stick horse up and down the yard for the rest of the day.',
  'child-doll': 'Let them sit by the house with a corn-husk doll and keep house for it.',
  'child-tag': 'Let them run at tag about the yard with the other children.',
  'child-hide': 'Let them play hide-and-seek behind the house and the woodpile.',
  'child-cart': 'Let them make a toy ox cart with a stick axle and two hard biscuits for wheels.',
  'child-hoop': 'Let them drive an old barrel hoop down the lane with a stick and back.',
  'child-marbles': 'Let them kneel in the dirt at marbles and knucklebones.',
  'child-hens': 'Send them out to scatter a handful of corn for the hens.',
  // The flight's own work (sim/flight-work.mjs, owner 2026-09-26: new tasks for a family on the Runaway Scrape).
  'flee-hide': 'Hide what the wagon cannot take - the powder, the seed, the tools, the chest and the cotton - in the river bottom, to find again when the family is home.',
  'flee-bundle': 'Tie up a bundle for them to carry, so the family can take more with it on foot.',
  'flee-cow': 'Put a rope on one milk cow for them to drive behind the family, to be milked on the road.',
  'milk-cow': 'Milk the family\'s cow, once a day: a little food, and a job a child of seven can do.',
  'milk-road': 'Milk the cow driven along with the family, once a day at the halt: a little food.',
  // The women's own work (owner, 2026-10-03; sim/housework.mjs), women's by custom (sim/custom.mjs).
  'keep-house': 'Keep house: the cooking, the mending and the sweeping, which make the family\'s food go further today and tomorrow.',
  'work-garden': 'Work the kitchen garden beside the house, once a day: a little food in its season.',
  'wash-clothes': 'Do the wash, so nobody of the family goes to town or the war in dirty clothes.',
  // The tent until the house stands (sim/shelter.mjs, owner 2026-10-02): on nobody's bar since it goes up on arrival (2026-10-03); a
  // row glows with it only while somebody puts up a tent the family did not have at the first turn of the weather.
  'pitch-tent': 'Put up the wagon sheet as a tent by the camp, somewhere dry to go when it rains until the house has a roof.',
  'road-lookout': 'Set them to watch the road behind, so word of riders reaches the family sooner.',
  'road-sing': 'Have them sing on the road, so the walkers are worn less by it.',
  'road-little-ones': 'Have them keep the little ones walking by the hand, so the family goes at the pace of its older walkers.',
  'camp-fire': 'Have them fetch wood and water and keep a fire going at the camp, so no norther finds the family out in the cold.',
  'ferry-help': 'Send them to help the ferryman load, so the family’s turn at the crossing comes sooner.',
  'share-food': 'Carry a food from the family’s store to the hungriest family camped at the same place.',
  'ford-carry': 'Wade the family over now with the little ones carried, rather than wait for the boat.',
  'child-kindling': 'Send them round the yard for bark, chips and dead sticks for the fire, with no axe.',
  'child-birds': 'Set them at the edge of the field to drive the blackbirds off the standing crop.',
  'child-eggs': 'Send them round the hens’ nests, which brings a little food into the house once a day.',
  'child-water': 'Send them between the water and the house with a pail all morning.',
  'child-mind': 'Set them to watch the little ones, which takes the baby off a parent while it lasts.',
  'child-help': 'Send them running to the nearest neighbours to ask them to take the family in.',
  'travel-gonzales': 'Go into the town of Gonzales and stay there until sent somewhere else.',
  'travel-home': 'Come back to the family’s own land.',
  visit: 'Choose a neighbour’s homestead and go there, to trade or to help raise their walls.',
  work: 'Do the everyday work about the homestead, which keeps it going but brings in no food.',
  rest: 'Sit still at home, which is the only thing that mends tiredness.',
  'stop-chore': 'Stop what they are doing and come away; what is already done stays done.',
});

/** What the orders that are not chores are called. Chores are named by the server's catalogue. */
export const ORDER_NAMES = Object.freeze({
  'travel-gonzales': 'Travel to Gonzales', 'travel-home': 'Return home', visit: 'Go to a neighbour’s homestead',
  work: 'Work about the place', rest: 'Rest', 'stop-chore': 'Call off the work', 'winter-recall': 'Send for them to come home',
});

/**
 * The picture on every icon: the `icon-<key>` frame of the action-icon contract (docs/ART_REQUESTS.md, request 2026-09-15).
 *
 * stand-in: docs/ART_REQUESTS.md, "Claude-drawn stand-ins (replace with Astra's)". Every `icon-*` frame drawn today is
 * Claude-drawn, from public/assets/claude-standins/ (`madeBy: "claude"` in its atlas.json); Astra's `icon-<key>` of the same
 * name, registered through `npm run build:art`, replaces it without a change here. The winter's eight (request 2026-09-16)
 * are Claude-drawn the same way. A frame that has not loaded draws the `dot` glyph until the sheet arrives.
 */
export const PANEL_ICONS = Object.freeze(Object.fromEntries([
  ...[
    'survey-plot', 'cut-lane', 'dig-well', 'plant-field', 'harvest-field', 'clear-plot', 'fence-plot', 'build-house', 'help-raise',
    'hunt-timber', 'hunt-land', 'practise-shooting', 'sell-cotton', 'fetch-powder', 'fetch-seed', 'sell-food', 'mend-hoe', 'replace-hoe',
    'visit-shop', 'make-furniture', 'buy-furniture', 'fell-trees', 'haul-logs',
    'enlist-regular', 'enlist-auxiliary', 'join-garrison', 'join-matamoros', 'go-vote', 'join-relief', 'join-houston', 'winter-recall',
    'travel-gonzales', 'travel-home', 'visit', 'work', 'rest', 'stop-chore',
  ].map(key => [key, { sprite: `icon-${key}` }]),
  // Seguín's company (sim/tejano.mjs). stand-in: docs/ART_REQUESTS.md, request 2026-09-29 "the family's start" - `icon-join-seguin`;
  // until it is drawn, the joining of Houston's army, which it is.
  ['join-seguin', { sprite: 'icon-join-houston' }],
  // The camp's four (sim/camp.mjs) select their registered `icon-<key>` sprites in drawIcon; glyphs remain load fallbacks.
  ['camp-drill', { glyph: 'drill' }], ['camp-forage', { glyph: 'forage' }], ['camp-guard', { glyph: 'guard' }], ['camp-scout', { glyph: 'scout' }],
  // The road's chores (sim/road.mjs, docs/ROAD_EAST.md) have registered `icon-<key>` frames; glyphs are load fallbacks.
  ['hunt-road', { glyph: 'hunt-road' }], ['tend-sick', { glyph: 'tend-sick' }], ['trade-crossing', { glyph: 'trade-crossing' }],
  // Sickness (sim/disease.mjs). stand-in: docs/ART_REQUESTS.md, request 2026-09-27 "the sickness icons" - `icon-rest-road`,
  // `icon-nurse-home` and `icon-camp-apart` are Claude-drawn today ("Claude-drawn stand-ins", taken first by `drawIcon`); without
  // their sheet, the rest order's picture, the road's nursing and a drawn glyph. Astra's of the same names replace Claude's.
  ['rest-road', { sprite: 'icon-rest' }], ['nurse-home', { sprite: 'icon-tend-sick', glyph: 'tend-sick' }], ['camp-apart', { glyph: 'camp-apart' }],
  // Fetching logs from the timber uses registered `icon-fetch-logs`; the glyph is a load fallback.
  ['fetch-logs', { glyph: 'fetch-logs' }],
  ['make-carreta', { sprite: 'icon-make-carreta' }],
  // The yard (owner, 2026-10-02; sim/land-paths.mjs). stand-in: docs/ART_REQUESTS.md, request 2026-10-02 "paths and the yard" -
  // `icon-fence-yard`: until it is drawn, fencing a plot, which it is kin to. (*Cut a path* had an icon here until every path went
  // automatic, owner 2026-10-03, "All automatic".)
  ['fence-yard', { sprite: 'icon-fence-plot' }],
  // The house's rooms on the bar (owner, 2026-09-30, "Move Idle and House off"; public/app.js `HOUSE_ICON`). stand-in:
  // docs/ART_REQUESTS.md, request 2026-09-30 "the House icon on the bar" - `icon-go-inside`; until it is drawn, the house the family
  // raises, which it is.
  ['go-inside', { sprite: 'icon-build-house' }],
  // The old walk to the shops, for a class saved in the middle of it: the same picture as going to town to trade.
  ['visit-shop-street', { sprite: 'icon-visit-shop' }],
  ['take-small-game', { sprite: 'icon-take-small-game' }], ['fish-the-water', { sprite: 'icon-fish-the-water' }],
  ['fish-road', { sprite: 'icon-fish-the-water' }], ['gather-oysters', { sprite: 'icon-gather-oysters' }],
  ['cut-bee-tree', { sprite: 'icon-cut-bee-tree' }],
  ['butcher-beef', { sprite: 'icon-butcher-beef' }], ['butcher-hog', { sprite: 'icon-butcher-hog' }],
  ['look-to-stock', { sprite: 'icon-look-to-stock' }],
  // Milking the cow (sim/milking.mjs, owner 2026-10-02). stand-in: docs/ART_REQUESTS.md, request 2026-10-02 - the milking icon,
  // `icon-milk-cow`: until it is drawn, the cow on a rope (Claude's `icon-flee-cow`, or its stroked glyph).
  ['milk-cow', { sprite: 'icon-flee-cow', glyph: 'flee-cow' }], ['milk-road', { sprite: 'icon-flee-cow', glyph: 'flee-cow' }],
  // What the family's children do (sim/children.mjs, docs/FAMILY_CREATION.md §3's amendment of 2026-09-21).
  ['child-play', { sprite: 'icon-child-play' }], ['child-kindling', { sprite: 'icon-child-kindling' }],
  ['child-birds', { sprite: 'icon-child-birds' }], ['child-eggs', { sprite: 'icon-child-eggs' }],
  ['child-water', { sprite: 'icon-child-water' }], ['child-mind', { sprite: 'icon-child-mind' }],
  // stand-in: docs/ART_REQUESTS.md, request 2026-09-26 - children's play and the Scrape's work. Claude-drawn `icon-<key>` frames
  // today ("Claude-drawn stand-ins"), the stroked glyphs under them until a sheet loads; Astra's replace them with no change here.
  ...['child-stick-horse', 'child-doll', 'child-tag', 'child-hide', 'child-cart', 'child-hoop', 'child-marbles', 'child-hens',
    'flee-hide', 'flee-bundle', 'flee-cow', 'road-lookout', 'road-sing', 'road-little-ones', 'camp-fire', 'ferry-help', 'share-food', 'ford-carry',
    // stand-in: docs/ART_REQUESTS.md, request 2026-09-28 - the oldest child going for help (sim/acting.mjs).
    'child-help',
    // stand-in: docs/ART_REQUESTS.md, request 2026-10-02 - the tent (sim/shelter.mjs): `icon-pitch-tent`, a stroked tent until drawn.
    'pitch-tent',
    // stand-in: docs/ART_REQUESTS.md, request 2026-10-03 "men's work, women's work and the wash", items 1-3 - `icon-keep-house`,
    // `icon-work-garden`, `icon-wash-clothes`: stroked glyphs until they are drawn (sim/housework.mjs).
    'keep-house', 'work-garden', 'wash-clothes',
  ].map(key => [key, { glyph: key }]),
]));
/** The camp's work, the chores a man serving with Houston's army is offered (sim/camp.mjs); the only work a serving row shows. */
export const CAMP_CHORES = Object.freeze(['camp-drill', 'camp-forage', 'camp-guard', 'camp-scout']);

/**
 * Chores sent with a place the student taps on the map: their icon starts choosing the place (sim/survey.mjs). Felling was one
 * until 2026-09-28; it is one press now, to the nearest timber on the family's land (owner: "I should be able to set one person on
 * felling trees ... set each to auto, and eventually get a house").
 */
export const ON_MAP = Object.freeze(['survey-plot', 'clear-plot', 'fence-plot', 'hunt-land', 'plant-field']);
/**
 * Work that glows as another on the row (sim/chores.mjs `partOf`): fetching logs from off the land, which *Fell trees* begins for a
 * family whose land has no timber, and the retired haul of a class saved in the middle of one, are both felling.
 */
export const GLOWS_AS = Object.freeze({ 'fetch-logs': 'fell-trees', 'haul-logs': 'fell-trees' });
/**
 * Refusals that are not a choice at all. A sound hoe cannot be mended and a corn family has no cotton; a dimmed icon saying
 * so all afternoon is clutter pretending to be a choice, the same rule the work list on the card had.
 */
export const NOT_A_CHOICE = /^The hoe is sound|^Not enough cotton/;

const ROLE_RANK = { father: 0, mother: 1 };
const CHILD_ROLES = new Set(['son', 'daughter']);

/**
 * The rows, top to bottom: father, mother, then the children oldest first.
 *
 * `members` is the household's own order (sim/family.mjs); `people` is the family's book from `/api/family`, which carries
 * each person's role and age (the panel waits for it). A lone mother is simply first. Anybody without an age keeps the
 * household's order among the children, and anybody without a role comes after everybody who has one.
 */
export function panelOrder(members = [], people = []) {
  const index = new Map(members.map((id, at) => [id, at]));
  const byId = new Map(people.map(person => [person.id, person]));
  const rank = id => {
    const role = byId.get(id)?.role;
    return role in ROLE_RANK ? ROLE_RANK[role] : CHILD_ROLES.has(role) ? 2 : 3;
  };
  const age = id => byId.get(id)?.age;
  return [...members].sort((a, b) => {
    const byRole = rank(a) - rank(b);
    if (byRole) return byRole;
    // Oldest first, among the children; a missing age leaves the household's order alone.
    if (rank(a) === 2 && Number.isFinite(age(a)) && Number.isFinite(age(b)) && age(a) !== age(b)) return age(b) - age(a);
    return index.get(a) - index.get(b);
  });
}

/**
 * Which icon glows for this person: the action the projection says they are doing, or null.
 *
 * A chore wins, including while they walk out to it and back. With no chore, being on the road to Gonzales, home or
 * another homestead is that journey; standing still, the main person's standing order to work or rest is what they are
 * doing. `main` is whether this is the family's main person (`world.household.mainId`), whose row alone has those icons.
 */
export function activeKey(entity, { homeId = null, main = false, homesteads = [] } = {}) {
  if (!entity || ['dead', 'captured'].includes(entity.health?.condition)) return null;
  if (entity.chore?.id) return GLOWS_AS[entity.chore.id] || entity.chore.id;
  if (entity.travel) {
    if (!main) return null;
    if (entity.travel.to === 'gonzales') return 'travel-gonzales';
    if (homeId && entity.travel.to === homeId) return 'travel-home';
    return homesteads.includes(entity.travel.to) ? 'visit' : null;
  }
  if (!main) return null;
  return entity.task === 'work' ? 'work' : entity.task === 'rest' ? 'rest' : null;
}

/** The first sentence of a longer text, for a chore this build has no sentence for yet. */
const firstSentence = text => (String(text || '').match(/^.*?[.!?](?=\s|$)/)?.[0] || String(text || '')).trim();

/**
 * The server's reason for refusing one entry of `world.work`, with the one refusal it deliberately sends only once put
 * back: a refusal the land hunt shares with the timber hunt rides on the timber hunt alone (sim/chores.mjs `choresFor`).
 * Read by the icons and by `rowReason`, so the row's one line and the icon a student hovers can never disagree.
 */
const whyOf = (entry, offered, catalogue = null, customSays = null) => (entry.custom && !entry.can && !entry.why
  ? customWords(entry, catalogue, customSays)
  : entry.id === 'hunt-land' && !entry.can && !entry.why
  ? offered.find(other => other.id === 'hunt-timber')?.why
  : entry.why);
/**
 * A refusal by custom in the server's own words (owner, 2026-10-03; sim/custom.mjs `customSays`): the work's name as the catalogue gives
 * it, then what the family is told once for its side - "Felling" + " is " + "men's work, and James is at home." The tick carries only
 * whose work it is on each refused entry, to keep within its size.
 */
export const customWords = (entry, catalogue, customSays) => `${catalogue?.get?.(entry.id)?.custom?.[1] || 'That'} is ${customSays?.[entry.custom] || `${entry.custom}'s work.`}`;

/**
 * Every icon on one person's row, in order: their work, then the main person's orders, then calling off the work.
 *
 * `offered` is `world.work[id]` as the server sent it; `catalogue` the chore catalogue by id (names, descriptions, costs);
 * `main` whether this is the family's main person (`world.household.mainId`), the one the server lets travel, work about the
 * place and rest; `carry` what this person could carry the way they are set to travel (`world.travelModes`), for a haul's
 * note. `settable` is whether orders may be given at all (running, or the lobby). Each icon says what it sends; nothing is
 * sent from here.
 */
/** Work that is rest for whoever holds it, so a sick person is not warned off it (sim/disease.mjs `RESTING_CHORES`). */
const REST_WORK = Object.freeze(['rest-road']);
/** The sickness line on a row (sim/disease.mjs `sicknessShown`): the server's words, or nothing. */
export const sickLine = entity => (entity?.sickness?.line ? String(entity.sickness.line) : '');
export function panelActions({ entity, offered = [], catalogue = new Map(), main = false, homeId = null, homesteads = [], atHome = false,
  settable = true, carry = null, wants = null, customSays = null } = {}) {
  if (!entity || ['dead', 'captured'].includes(entity.health?.condition)) return [];
  // Somebody with the men in a fight (sim/battle-stage.mjs `heldByBattle`) is given no order until it is over and they come
  // back with the men; the server refuses any, and the reason is theirs (`held`).
  if (entity.held) return [];
  // Somebody with the army, the garrison or the expedition (sim/winter.mjs) has one order and no other: sending for them -
  // except a man with Houston's army, whose row has the camp's work first (sim/camp.mjs), as the server offers it.
  if (entity.service?.status === 'serving') {
    const shut = entity.service.besieged ? `${entity.name || 'They'} is shut in the Alamo.` : entity.service.riding ? `${entity.name || 'They'} has ridden for the Alamo.` : entity.service.unreachable || '';
    const camp = offered.filter(entry => CAMP_CHORES.includes(entry.id)).map(entry => {
      const spec = catalogue.get?.(entry.id) || {};
      return { key: entry.id, kind: 'chore', name: spec.name || entry.id, summary: PANEL_SUMMARIES[entry.id] || firstSentence(spec.describe),
        note: entry.cost ? `Costs ${entry.cost}.` : '', can: Boolean(settable && entry.can), why: entry.can ? '' : entry.why || '', onMap: false, active: entity.chore?.id === entry.id };
    });
    return [...camp, { key: 'winter-recall', kind: 'order', name: ORDER_NAMES['winter-recall'], summary: PANEL_SUMMARIES['winter-recall'],
      note: entity.service.kind === 'regular' ? 'A regular who leaves before their time is up has deserted: the land is lost, and they will not be taken again.' : entity.service.acres ? 'The promise of land is lost.' : '',
      why: shut, can: settable && !entity.travel && !shut, active: false },
    ...(entity.chore ? [{ key: 'stop-chore', kind: 'order', name: ORDER_NAMES['stop-chore'], summary: PANEL_SUMMARIES['stop-chore'], note: '', why: '', can: settable, active: false }] : [])];
  }
  const active = activeKey(entity, { homeId, main, homesteads });
  const icons = [];
  for (const entry of offered) {
    const spec = catalogue.get?.(entry.id) || {};
    const why = whyOf(entry, offered, catalogue, customSays);
    if (!entry.can && NOT_A_CHOICE.test(why || '') && active !== entry.id) continue;
    // What it costs and what it brings, from the server's numbers; putting them side by side is formatting.
    const haul = entry.haul && Number.isFinite(carry)
      ? `Brings home ${Math.min(entry.haul.got, carry)} ${entry.haul.resource}${entry.haul.got > carry ? ` of ${entry.haul.got}; the rest is left behind.` : '.'}`
      // With no way chosen yet - it is asked when they are sent (public/going.js, owner 2026-09-24) - what a good trip gives;
      // the chooser says what each way brings home of it.
      : entry.haul ? `A good trip gives about ${entry.haul.got} ${entry.haul.resource}; what comes home depends on how they go.` : '';
    // Each crop it would bring home, after the stock's third on unfenced plots (sim/chores.mjs `harvestControl`, owner 2026-09-30):
    // sent where there is cotton; corn alone, and a server of before, send the whole, which is food.
    const brings = entry.crop?.cotton
      ? [entry.crop.food && `${Math.round(entry.crop.food)} food`, entry.crop.cotton && `${Math.round(entry.crop.cotton)} cotton`].filter(Boolean).join(' and ')
      : null;
    const crop = !entry.crop ? ''
      : brings ? `About ${brings} standing${entry.crop.share < 1 ? '; the stock have had a third of each unfenced plot' : ''}.`
      : entry.crop.share < 1
        ? `About ${Math.round(entry.crop.grown * entry.crop.share)} food of ${Math.round(entry.crop.grown)} standing; the rest has gone to stock in an unfenced field.`
        : `About ${Math.round(entry.crop.grown)} food standing.`;
    // Refused work that somebody on auto may still be given, to wait for (sim/auto.mjs `waitingWork`): open to press, and its
    // popup says the server's reason and the server's words for what pressing it does.
    const waits = Boolean(entry.waits && !entry.can && active !== entry.id);
    // Somebody sick may still be sent, with the server's warning on the work (sim/disease.mjs `sicknessShown`, the owner
    // 2026-09-27): working slows the mending and they may get worse. Calling the family's halt to rest is not work.
    const warn = entry.can && entity.sickness?.warn && !REST_WORK.includes(entry.id) ? entity.sickness.warn : '';
    icons.push({
      key: entry.id, kind: 'chore', name: spec.name || entry.id,
      summary: PANEL_SUMMARIES[entry.id] || firstSentence(spec.describe),
      // Who would be left at home if they go to the war (sim/acting.mjs `leavesLittleOnes`, design audit S14): the server's words, first.
      note: waits ? [why, entry.waits].filter(Boolean).join(' ') : [entry.leaves || '', warn, entry.cost ? `Costs ${entry.cost}.` : '', haul, crop, entry.estimate || ''].filter(Boolean).join(' '),
      can: Boolean(settable && (entry.can || waits)), why: entry.can ? '' : why || '',
      onMap: ON_MAP.includes(entry.id), active: active === entry.id, ...(waits && { waits: true }),
      // Refused only for a thing the family has not got (the server's `short`): kept on the bar greyed, a goal (§23).
      ...(!entry.can && !waits && entry.short && { goal: true }),
      // Refused by custom (owner, 2026-10-03, "Custom, necessity opens"; sim/custom.mjs): kept on the bar greyed, with the server's words,
      // and lit the tick nobody of that custom is at home. 'men' or 'women'.
      ...(!entry.can && !waits && entry.custom && { custom: entry.custom }),
      // What the family has of what it wants for this (`world.household.wants`): the strip on the icon, the list in its popup.
      ...(needsFor(entry.id, wants) && { needs: needsFor(entry.id, wants) }),
    });
  }
  // Somebody doing a chore the server no longer lists (it happens: a field planted is a field not to plant) is still shown
  // doing it, so nobody is ever busy at something the row cannot show.
  if (active && entity.chore && (GLOWS_AS[entity.chore.id] || entity.chore.id) === active && !icons.some(icon => icon.key === active)) {
    const spec = catalogue.get?.(active) || {};
    icons.unshift({ key: active, kind: 'chore', name: spec.name || active, summary: PANEL_SUMMARIES[active] || firstSentence(spec.describe),
      note: '', can: false, why: '', onMap: ON_MAP.includes(active), active: true });
  }
  if (main) {
    // The same rule the card's buttons had: not while on the road, and not to where they already are.
    const still = settable && !entity.travel;
    const at = entity.location?.siteId;
    const order = (key, extra, can) => icons.push({ key, kind: 'order', name: ORDER_NAMES[key], summary: PANEL_SUMMARIES[key], note: '', why: '', can, active: active === key, ...extra });
    order('travel-gonzales', { destination: 'gonzales' }, still && at !== 'gonzales');
    order('travel-home', { destination: 'home' }, still && Boolean(homeId) && !atHome);
    if (homesteads.length) order('visit', { visit: true }, still);
    order('work', {}, still);
    order('rest', {}, still);
  }
  if (entity.chore) icons.push({ key: 'stop-chore', kind: 'order', name: ORDER_NAMES['stop-chore'], summary: PANEL_SUMMARIES['stop-chore'], note: '', why: '', can: settable, active: false });
  return icons;
}

/**
 * The one line a person who can do nothing shows in place of a bar (docs/FAMILY_PANEL.md §14, owner 2026-09-21: "one line
 * saying why, in the person's own terms"). Null whenever the icons should be shown. A row busy with a chore always has its
 * open call-off icon, so what they are doing is never collapsed away.
 *
 * **Nothing here writes a sentence.** Every line this returns is one the server sent, word for word: `tooYoungWhy` and
 * `servingWhy` from sim/family.mjs and sim/winter.mjs, the per-chore `why` from `choreAvailability`. The page's only job
 * is to pick which of them is the reason about *this person* rather than about a field or a hoe - and that is the one the
 * server put on every piece of work it offered them. The orders beside the work (travel, rest, call off) carry no reason
 * of their own, so they are not read while there is work to read.
 *
 * **A bar the guided start has shut is not this.** `sim/lesson.mjs` refuses in `applyAction` and leaves `world.work`
 * alone, so a step that shuts the bar leaves every icon `can: true` and `icons.some(icon => icon.can)` sends this back
 * null - a student mid-lesson reads the step's own words on the icons, never "there is nothing for them to do". A child
 * under ten in the same tick still gets their own line, because the server really did refuse them.
 *
 * `entity` and `offered` are the row's person and `world.work[id]` as the server sent it. They are read for one case only:
 * somebody dead or captured, whose row `panelActions` empties outright, so no icon is left to carry the reason the server
 * did send with the work it refused them.
 * ceiling: the dead and the captured share one sentence, `choreAvailability`'s "This person cannot work.", which does not
 * name them the way every other line here does. The way out is the server's own wording, not a sentence invented here.
 * ceiling: a row refused for several different reasons at once keeps its line of dimmed pictures, each carrying its own;
 * one line cannot say two things, and the reasons are read on the icons as they always were.
 */
export function rowReason(icons, { offered = [], entity = null } = {}) {
  if (icons.some(icon => icon.can)) return null;
  const only = list => {
    const reasons = new Set(list.map(one => one.why || ''));
    return list.length && reasons.size === 1 ? [...reasons][0] || null : null;
  };
  const chores = icons.filter(icon => icon.kind === 'chore');
  if (chores.length) return only(chores);
  if (icons.length) return only(icons);
  return gone(entity) ? only(offered.map(entry => ({ why: entry.can ? '' : whyOf(entry, offered) }))) : null;
}

/**
 * The word a person's row shows while they are on a journey, or null.
 *
 * Owner, 2026-09-22: "their icon should say 'Travelling' next to it." It goes where §14's reason goes and by §14's rule - in
 * the bar for the main person, on the row for everybody else (`.panel-why`) - so nothing new was invented for it; the one
 * difference is that it is shown *beside* a bar that still has open icons rather than in place of one, because somebody
 * walking out to a chore can still be called off while they walk.
 *
 * It is the page's own word, which §14.2 says of a refusal it is not. That rule is about **why somebody may not be given an
 * order**, and every such line is still the server's, word for word. This says what they are doing, which the row has always
 * said in the page's own terms (the glowing icon, `activeKey`); the owner asked for the word and this is it.
 *
 * Somebody the class's clock is carrying faster than a student may follow is not this: `travel.away` (sim/sight.mjs) has no
 * road, no progress and no place, and their row keeps the server's fuller sentence - where they went, how far off, and when
 * they should be there - which is all a family has of them.
 * ceiling: somebody held on a bank while the water is up (`waitUntil`) or reined in to speak (`halted`) is standing still and
 * still says Travelling. Their card says which; a second word on the row would be a second thing to read.
 */
export const TRAVELLING_WORD = 'Travelling';
export const travellingLine = entity => (entity?.travel && !entity.travel.away ? TRAVELLING_WORD : null);
/**
 * The server's fuller sentence for somebody carried out of sight (`travel.away`, sim/sight.mjs), or null: read off the work
 * it refused them, word for word, exactly as `rowReason` reads a refusal. It goes where `travellingLine`'s word goes - beside
 * the icons in the bar for the main person, on the row for everybody else - because since the bar draws only what can be
 * pressed (8e6ecd5, 2026-09-22) a row with an icon still glowing had no refused icon left to carry it, and the family lost
 * the one thing it has of them (docs/FAMILY_PANEL.md §14.3; found by `npm run test:travel-sight`, 2026-09-26).
 */
export const awayLine = (entity, icons = []) => (entity?.travel?.away ? rowReason(icons.filter(icon => icon.kind === 'chore' && !icon.active)) : null);

/**
 * The greyed row's line for one of the family who is with the army (owner, 2026-09-30, "Greyed, better words"; docs/FAMILY_PANEL.md
 * §20c): the row stays greyed while the map draws nothing of them, but it says where they are - "With the army at the Salado" -
 * and not "On the road to Béxar — back in view when they arrive", which they will not be. The place is the server's own, wherever
 * the army halts (sim/army.mjs `armyProjection`: its siege camp, else the place it stands at); on the march, "on the road to Béxar".
 * Null for anybody not in the family's part of the army, whose row says where they are going as before.
 * ceiling: the volunteer army of 1835 (`world.army`) only; Houston's army and the Alamo's garrison say their road as before - words
 * of their own if a class finds them wrong.
 */
export function armyAwayWords(world, entityId) {
  const army = world?.army;
  if (!army || !(army.ours || []).some(one => one.id === entityId)) return null;
  if (army.camp) return `With the army at ${army.camp}`;
  if (army.at && army.at !== 'on the road') return `With the army at ${army.at}`;
  return 'With the army on the road to Béxar';
}

/**
 * The name to send for what somebody typed, or null when there is nothing to save: blank, or what the world already holds.
 * The server cleans and has the last word; this only avoids sending a rename that changes nothing.
 */
export function nameToSave(typed, current) {
  const name = String(typed ?? '').replace(/\s+/g, ' ').trim();
  if (!name || name === String(current ?? '').trim()) return null;
  return name;
}

/** How long a pause in typing is before a name saves itself, in milliseconds (docs/FAMILY_PANEL.md §5). */
export const RENAME_PAUSE_MS = 1500;

// ------------------------------------------------------------------------------------ needs, idleness and the main person
// docs/FAMILY_PANEL.md §11 (owner, 2026-09-16): an "!" on the row of anybody who needs the student, a row that shows it is
// idle, and one person the student chooses as their main one. Everything here reads the student's own projection; nothing
// is remembered on the page about what anybody needs.

const gone = entity => !entity || ['dead', 'captured'].includes(entity.health?.condition);

/** The call, march or rumour's question this person could answer now, with their own answers; or null. */
export function requestFor(world, entity) {
  const request = world?.request;
  if (!entity || request?.status !== 'open') return null;
  // Everybody who could answer it, each with their own prices. A class served by an older server has no `answerers`, and
  // there the call was the principal's or the march's person's.
  if (request.answerers) return request.answerers[entity.id] ? { ...request, options: request.answerers[entity.id] } : null;
  const asked = request.actorId || world.household?.principalId;
  return entity.id === asked ? request : null;
}

/** The rider standing with this person waiting to be spoken to; or null. A meeting belongs to the one the rider stopped for. */
export function meetingFor(world, entity) {
  const encounter = world?.encounter;
  return entity && encounter?.status === 'open' && encounter.listenerId === entity.id ? encounter : null;
}

/**
 * Every kind of need, **most urgent first** (docs/audits/2026-09-28-design.md S33, the owner's "fix the blockers"): the
 * soldiers' ¡Alto! (thirty real seconds before silence halts the family), the road's question, the order to leave, somebody very
 * sick (a day to nurse them), a rider standing with them (who rides on, and whose word is often what the call is about),
 * the settlement's call (five real minutes), the army's and the camp's and Travis's questions (ninety real seconds each),
 * work that has stopped to ask, a small child whose own auto went off (2026-09-29), an offer. A person with more than one shows the first, and across the whole column the rows
 * are ranked by it (`rankNeeds`). Also which card section answers each (`NEED_SECTIONS` in public/app.js).
 */
// The sighting on a hunt (owner, 2026-10-02; sim/hunt-aim.mjs) is work that has stopped to ask, ranked with it: its own kind, so its
// card and its "!" open the field to aim across rather than the person's card. Fifteen real seconds; it never outranks the owner's order.
export const NEED_KINDS = Object.freeze(['alto', 'road', 'flight', 'sick', 'hunger', 'rider', 'call', 'army', 'camp', 'courier', 'sighting', 'asking', 'child', 'offer']);

/**
 * Who is with the family and answers its own decisions - the order to leave, the route, the road's questions, "¡Alto!" - as the
 * server resolved it (sim/acting.mjs `actingFor`; `household.actingId`, sent only when it is not the main person): the main
 * person when they are with the family, else the next grown person there, else the oldest child of seven or more.
 */
export const actingOf = world => world?.household?.actingId || world?.household?.mainId || world?.household?.principalId || null;
/** The family taken in by a neighbour family, in words (sim/acting.mjs `takeIn`), or ''. */
export function takenInWords(world) {
  const taken = world?.household?.takenIn;
  if (!taken) return '';
  return `With nobody grown of the family left to see to them, ${taken.name} took the little ones in. They live with them now and go where they go, until somebody grown of the family comes for them.`;
}

/**
 * What this person is waiting on the student for, most urgent first (`NEED_KINDS`). Every one is a thing the server has
 * already sent this family and will take an answer to; the words say who and what, and never what an answer risks
 * (docs/COLONIES.md §7a). Where the question will lapse, `leftMs` is how long it has in real time, as the server last said, in
 * real milliseconds for every one: the call, the army's questions, and since 2026-09-29 (owner, "Real-time limits") the rider,
 * the order to leave, the road's question, ¡Alto! and a question in the middle of work, which count real seconds the same at
 * every pace. Absent where nothing lapses or the clock has not begun.
 */
export function needsOf(world, entityId) {
  const entity = (world?.entities || []).find(one => one.id === entityId);
  // Nothing waits on a student watching another family (sim/watching.mjs): nobody on the page is theirs to answer for.
  if (gone(entity) || world.role === 'host' || world.watching) return [];
  const name = entity.name || 'Somebody';
  const needs = [];
  const ms = value => (Number.isFinite(value) ? { leftMs: value } : {});
  const meeting = meetingFor(world, entity);
  if (meeting) needs.push({ kind: 'rider', text: `${meeting.carrierName || 'A rider'} has stopped to speak with ${name}.`, ...ms(meeting.leftMs) });
  // Told to leave (sim/scrape.mjs): the family's decision, on the row of whoever is with the family and answers for it - the main
  // person when they are with it, else the next grown person there, else the oldest child of seven or more (sim/acting.mjs,
  // `actingOf`). Not on a father away with the army (interactions B1, 2026-09-28). Nothing while neighbours have taken it in.
  const acting = actingOf(world);
  if (world.flight?.status === 'ordered' && !world.household?.takenIn && entityId === acting) needs.push({ kind: 'flight', text: `The family has been told to leave for the east.${world.flight.ifUnanswered ? ` ${world.flight.ifUnanswered}` : ''}`, ...ms(world.flight.leftMs) });
  // The road's question (sim/road.mjs): the bogged wagon, the army close behind - the family's, on the same row. The soldiers'
  // ¡Alto! is its own kind: it is the most urgent thing in the game.
  if (world.flight?.ask && !world.household?.takenIn && entityId === acting) needs.push({ kind: world.flight.ask.id === 'alto' ? 'alto' : 'road', text: world.flight.ask.text || 'The road is asking the family something.', ...ms(world.flight.ask.leftMs) });
  const ours = world.army?.ours?.find(one => one.id === entityId);
  if (ours && (ours.detachment === 'open' || (ours.questions || []).some(question => question.answer === 'open'))) {
    needs.push({ kind: 'army', text: `The army is asking ${name} something.`, ...ms(entity.decisionLeftMs) });
  }
  // With Houston's army, asked whether they leave for the family, or which road at the fork (sim/camp.mjs).
  if (entity.service?.leave === 'open') needs.push({ kind: 'camp', text: `The army is asking whether ${name} goes home to the family.`, ...ms(entity.decisionLeftMs) });
  else if (entity.service?.road === 'open') needs.push({ kind: 'camp', text: `The army is asking ${name} which road it takes.`, ...ms(entity.decisionLeftMs) });
  // Inside the Alamo, asked whether they will carry Travis's letters out (sim/alamo.mjs).
  if (entity.service?.courier === 'open') needs.push({ kind: 'courier', text: `Travis is asking whether ${name} will ride out with his letters.`, ...ms(entity.decisionLeftMs) });
  const asked = requestFor(world, entity);
  if (asked?.options?.length) needs.push({ kind: 'call', text: `${name} can answer what the family is being asked.`, ...ms(asked.leftMs) });
  // Something sighted on a hunt (owner, 2026-10-02): the alert to take the shot, while it has not been taken up. Once the student is
  // aiming, nothing waits on them here: the field is open on their page.
  if (entity.chore?.ask?.id === 'shot' && entity.chore.ask.sight) { if (!entity.chore.ask.aim) needs.push({ kind: 'sighting', text: sightingWords(entity), ...ms(entity.chore.ask.leftMs) }); }
  else if (entity.chore?.ask) needs.push({ kind: 'asking', text: `${name}’s work has stopped to ask something.`, ...ms(entity.chore.ask.leftMs) });
  // A small child whose own automation has gone off, given nothing since (owner, 2026-09-29, "Until the day ends"; sim/childhood.mjs
  // `autoOffAsking`): after work that has stopped to ask, before an offer. Never how long it had lasted.
  if (entity.autoOff) needs.push({ kind: 'child', text: `${name}’s auto went off. Give ${name} something to do, or put Auto on again.` });
  for (const offer of world.offers || []) {
    if (offer.direction === 'received' && offer.ourEntityId === entityId) { needs.push({ kind: 'offer', text: `${offer.theirName || 'A neighbour'} has offered ${name} a trade.` }); break; }
  }
  // Turned very sick (sim/disease.mjs): the moment to answer - nurse, keep warm, rest. The server's own line, and since 2026-09-29
  // (owner, C4: "60 s minimum") the minute in which they cannot die, counted down while it runs (`leftMs`).
  if (entity.sickness?.grave) needs.push({ kind: 'sick', text: `${name}: ${entity.sickness.line || 'very sick.'}`, ...ms(entity.sickness.leftMs) });
  // Starving (sim/hunger.mjs, owner 2026-09-30): the family must find food, and the minute in which they cannot die of it yet.
  if (entity.hunger?.stage === 'starving') needs.push({ kind: 'hunger', text: `${name} is starving.`, ...ms(entity.hunger.leftMs) });
  return needs.sort(byUrgency);
}

/** Each quarry as a sighting names it (sim/hunting.mjs `GAME[...].a`, written out: this page imports no simulation). */
export const SIGHTED = Object.freeze({ deer: 'a deer', turkey: 'a turkey', bear: 'a bear', bison: 'a buffalo', pronghorn: 'an antelope', mustang: 'a mustang', cattle: 'a wild cow', javelina: 'a javelina', waterfowl: 'ducks and geese' });
/** What a hunter downwind has sighted, in the family's words: "Mateo Ruiz is downwind of a deer in the timber. Take the shot yourself, or Mateo will." */
export function sightingWords(entity) {
  const sight = entity?.chore?.ask?.sight, first = entity?.given || String(entity?.name || 'They').split(' ')[0];
  const where = sight?.cover === 'open' ? 'out on the open ground' : sight?.cover === 'brush' ? 'in the brush' : 'in the timber';
  return `${entity?.name || first} is downwind of ${SIGHTED[sight?.quarry] || SIGHTED.deer} ${where}. Take the shot yourself, or ${first} will.`;
}

/** Most urgent first: by kind (`NEED_KINDS`), then by the least time left; a need with no clock after one with one. */
function byUrgency(a, b) {
  const kind = NEED_KINDS.indexOf(a.kind) - NEED_KINDS.indexOf(b.kind);
  if (kind) return kind;
  return (a.leftMs ?? Infinity) - (b.leftMs ?? Infinity);
}

/**
 * The "!"s of the whole column in one order (S33, "one order across all rows"): each person's most urgent need, the most
 * urgent person first, numbered from 1. `ids` are the rows top to bottom; a row with nothing waiting is left out. The rows
 * themselves keep the family's order (father, mother, children oldest first - docs/FAMILY_PANEL.md): it is the "!" that
 * says which to answer first, with its number and, where the question will lapse, the time it has left.
 */
export function rankNeeds(world, ids = []) {
  const ranked = [];
  for (const id of ids) {
    const needs = needsOf(world, id);
    if (needs.length) ranked.push({ id, ...needs[0], more: needs.length - 1 });
  }
  ranked.sort(byUrgency);
  return ranked.map((need, at) => ({ ...need, rank: at + 1 }));
}

/**
 * Time left, in the fewest characters a twelve-year-old reads at a glance on the "!": "28s", "4 min", "2 h". Rounded up, so a
 * question with any time left never reads as none; null when there is no clock.
 */
export function leftWords(ms) {
  if (!Number.isFinite(ms) || ms < 0) return null;
  if (ms < 60_000) return `${Math.max(1, Math.ceil(ms / 1000))}s`;
  if (ms < 3_600_000) return `${Math.ceil(ms / 60_000)} min`;
  return `${Math.ceil(ms / 3_600_000)} h`;
}

/**
 * How many days at the camp make a man steady in the line. `DRILL_TO_STEADY` in sim/houston.mjs is the authority; this is
 * the page's copy of it, and tests/family-panel.test.mjs fails if the two ever part.
 */
export const DRILLED_ROW = 3;

/**
 * What this person has become, in the few words that go on their row beside "father, 38".
 *
 * The owner asked for it after playing (2026-09-17): an afternoon at the mark cost two powder and an afternoon, said so in
 * the story, and then nothing anywhere showed that the person was any different. Neither of these is a hidden stat being
 * revealed - a steady hand is already written on the hunt's own controls (`unsteadyBecause` in sim/chores.mjs) and the
 * drill is already said at San Jacinto. This is the same fact, where a student looks first.
 */
export function standing(entity) {
  const words = [];
  const hunting = entity?.skills?.hunting ?? 1;
  if (hunting >= 3) words.push('the best shot on this land');
  else if (hunting >= 2) words.push('a steady shot');
  if ((entity?.service?.drilled ?? 0) >= DRILLED_ROW) words.push('steady in the line');
  // A hand with stock (owner, 2026-10-03; sim/stock.mjs `herdingOf`), sent only for a family with stock (`hand`).
  if (entity?.hand >= 3) words.push('the best hand with stock');
  else if (entity?.hand >= 2) words.push('a good hand with stock');
  return words.join(', ');
}

/**
 * The horn on a person's portrait (owner, 2026-10-03: "show it visually"; sim/stock.mjs `herdingOf`): `{ hand, out, words }` for a good
 * hand or the best (`hand`, sent only for a family with stock), and for whoever is out after the herd now (`out`, lit) whatever their
 * hand; null otherwise. Its notches are the hand; the words are the hover's.
 */
export function herdMarkOf(entity) {
  if (!entity || !Number.isFinite(entity.hand) || ['dead', 'captured'].includes(entity.health?.condition)) return null;
  const out = entity.chore?.id === 'look-to-stock';
  if (entity.hand < 2 && !out) return null;
  const hand = ['', 'New to stock', 'A good hand with stock', 'The best hand with stock on this land'][entity.hand] || 'New to stock';
  const days = entity.rangeDays ? `: ${entity.rangeDays} ${entity.rangeDays === 1 ? 'day' : 'days'} at it` : '';
  return { hand: entity.hand, out, words: `${hand}${days}.${out ? ' Out after the herd now.' : ''}` };
}

/**
 * Whether a row shows its person idle: alive, not at work, not on a road, not with the army, and able to be set to
 * something now. A child under ten, or somebody every order is refused to, is not "idle" - there is nothing to give them -
 * and a principal told to work about the place is working.
 */
export function isIdle(entity, icons = [], { withArmy = false } = {}) {
  // `task` is the server's: working about the place and helping where a call sent them are work; only resting is idle.
  if (gone(entity) || withArmy || entity.chore || entity.travel || (entity.task && entity.task !== 'rest')) return false;
  // Somebody serving is idle only when the camp's work is open to them (sim/camp.mjs): a garrison man with nothing but
  // "send for them" on his row is where the family put him, not idle.
  if (entity.service?.status === 'serving') return icons.some(icon => icon.can && icon.kind === 'chore');
  return icons.some(icon => icon.can);
}

/**
 * The student's main person on the panel: the one the server says (`world.household.mainId`, resolved there by
 * `mainPersonId` in sim/family.mjs, so a dead or captured main person has already given way) if they are one of the rows
 * and can act; otherwise the principal; otherwise the first row - which only happens against a server older than the
 * field, or between a death and the next tick. `order` is the rows top to bottom; `entities` the family's people as sent.
 */
export function focusFor(mainId, { order = [], principalId = null, entities = [] } = {}) {
  const byId = new Map(entities.map(entity => [entity.id, entity]));
  const usable = id => id && order.includes(id) && !gone(byId.get(id));
  if (usable(mainId)) return mainId;
  if (usable(principalId)) return principalId;
  return order.find(usable) || null;
}

// ---------------------------------------------------------------------------------------------- the call's one menu
// Owner, 2026-09-16: "The ! should appear on anyone that can answer. When it's clicked on however, a single interactable
// menu should appear that lets the player make the choice for each applicable person. Say a series of checkmarks so the
// player can send who they want quickly and easily."

/** The answer that sends somebody, and the one that keeps them, for every call the server puts to a family. */
export const GO_ANSWERS = Object.freeze(['turn-out', 'help', 'go-see', 'go-upriver']);
export const STAY_ANSWERS = Object.freeze(['stay-put', 'stay', 'stay-home', 'stay-in-town']);

/**
 * Whether this call takes more than one of the family. A settlement's call does (sim/calls.mjs: once somebody has gone
 * the call stands for the rest to follow); the food call, the rumour and the march are put to one person, and the server
 * closes them on the first answer. ceiling: the food call and the rumour could take a second person the way the
 * settlement's call does; nothing in their settling (sim/directors.mjs `settleHelp`) is written for more than one yet.
 */
export const takesSeveral = request => request?.kind === 'call';

/**
 * The auto switch's words (docs/FAMILY_PANEL.md §11.7): what pressing it does, said before it is pressed. `on` is the
 * server's `entity.auto`; nothing is remembered in the browser.
 */
export function autoLabel(entity, on) {
  return on
    ? `${entity.name} is on auto. ${autoLine(entity) || 'The last work at home given them is repeated.'} What they are asked is answered. Press to take the choices back.`
    : `Let ${entity.name} decide for themself: repeat the work at home given them, working about the place while it cannot be done, and answer what they are asked.`;
}

/**
 * The row's line for somebody on auto (owner, 2026-09-25, docs/FAMILY_PANEL.md §16): what they are auto-doing and, while they
 * wait, why - the server's own sentence (`autoTask.says`, sim/auto.mjs `autoShown`), never one written here. Empty when off.
 */
export function autoLine(entity) {
  return entity?.auto ? entity.autoTask?.says || '' : '';
}

/**
 * How far above the foot of the map the family column must stop (docs/FAMILY_PANEL.md §17, owner 2026-09-25: "Fix it", after a
 * two-row ability bar covered the bottom of a full column at 1024x768). Every number is a box the browser measured this frame;
 * nothing here is a height written down for one screen, which is what the fixed `bottom:200px` was.
 *
 * - `height` is the bottom of the box the column is positioned in (the map), `column` the column's own left and right.
 * - `bar` is the ability bar. **The column always stops above it**, wherever it stands across the screen (owner, 2026-09-21:
 *   "the left column stops above the ability bar"), so a bar that grows wider when another person is chosen cannot slide
 *   under a column that was only clear of it by being narrow. No bar (none drawn, or not measured): nothing to stop above.
 * - `others` are the rest of the furniture along the bottom - the Journal, Land and Follow buttons - which the column stops
 *   above only where one of them stands across the column's own width.
 *
 * Returns the gap, in whole pixels, from the foot of the map to the column's bottom edge: never less than `edge`, so the
 * column is never off the screen either.
 */
export function columnRoom({ height, column, bar = null, others = [], gap = 8, edge = 12 }) {
  const drawn = box => Boolean(box) && box.width > 0 && box.height > 0;
  const across = box => box.right > column.left && box.left < column.right;
  let foot = height - edge;
  if (drawn(bar)) foot = Math.min(foot, bar.top - gap);
  for (const box of others) if (drawn(box) && across(box)) foot = Math.min(foot, box.top - gap);
  return Math.max(edge, Math.ceil(height - foot));
}

/**
 * Where a scrolling list has to be scrolled to so that one row of it is in view, moving it as little as possible - the
 * `block: 'nearest'` of `scrollIntoView`, done on the column alone. `scrollIntoView` scrolls every ancestor that can scroll,
 * and would drag the map's own stage with it. `row` is the row's top and bottom in the list's content (0 is the top of the
 * list scrolled to its top); `view` is the list's `scrollTop` and `clientHeight`. A row taller than the view shows its top.
 */
export function scrollToShow(row, { scrollTop, clientHeight }) {
  if (row.top < scrollTop || row.bottom - row.top >= clientHeight) return Math.max(0, Math.floor(row.top));
  if (row.bottom > scrollTop + clientHeight) return Math.ceil(row.bottom - clientHeight);
  return scrollTop;
}

/**
 * The one menu for a call: every person who may answer it, with the answer that sends them and the one that keeps them,
 * as the server priced each for that person. `people` is the family's book (`/api/family`), for the line saying who they
 * are; `entities` the projection's people. Null when nothing is open to answer.
 */
export function callMenu(request, { people = [], entities = [] } = {}) {
  if (request?.status !== 'open' || !request.answerers) return null;
  const book = new Map(people.map(person => [person.id, person]));
  const byId = new Map(entities.map(entity => [entity.id, entity]));
  const rows = [];
  for (const [id, options] of Object.entries(request.answerers)) {
    const entity = byId.get(id);
    if (gone(entity)) continue;
    const person = book.get(id) || {};
    const go = options.find(option => GO_ANSWERS.includes(option.id)), stay = options.find(option => STAY_ANSWERS.includes(option.id));
    if (!go) continue;
    const shownAge = entity?.age ?? person.age;
    const age = Number.isFinite(shownAge) ? shownAge === 0 ? 'under a year' : String(shownAge) : '';
    const role = person.role ? person.role[0].toUpperCase() + person.role.slice(1) : 'Of this family';
    rows.push({ id, name: entity.name, who: [role, age].filter(Boolean).join(', '), go: { id: go.id, label: go.label, note: go.note, can: Boolean(go.can), why: go.why || '' },
      stay: stay ? { id: stay.id, label: stay.label, note: stay.note, can: Boolean(stay.can), why: stay.why || '' } : null });
  }
  if (!rows.length) return null;
  return { id: request.id, kind: request.kind, text: request.text, several: takesSeveral(request), rows,
    // What keeping everybody home is called, from the first row that may say so.
    stay: rows.find(row => row.stay?.can)?.stay || rows.find(row => row.stay)?.stay || null };
}

/**
 * What the menu sends when it is confirmed, in order: the sending answer for each person ticked, top to bottom; with
 * nobody ticked, the keeping answer once, for the person whose "!" was pressed if they may give it, else the first who may.
 * Nothing is sent from here; each entry is one command for the dispatcher, and the server has the last word on each.
 */
export function callPlan(menu, checked = [], clickedId = null) {
  if (!menu) return [];
  const going = menu.rows.filter(row => checked.includes(row.id)).map(row => ({ entityId: row.id, action: row.go.id }));
  if (going.length) return going;
  const keeper = menu.rows.find(row => row.id === clickedId && row.stay?.can) || menu.rows.find(row => row.stay?.can) || menu.rows.find(row => row.stay);
  return keeper ? [{ entityId: keeper.id, action: keeper.stay.id }] : [];
}

/**
 * What a press on an icon of the bar does (owner, 2026-09-29, triage D17 "Tap, then send"): `'explain'` shows its popup and
 * sends nothing, `'arm'` shows its popup with its cost, any warning and a **Send** button and sends nothing, `'send'` goes on to
 * send the order (or to open the chooser that sends it).
 *
 * A touch screen has no hover, so one tap sent an order before its cost or the server's warning (`leaves`: who is left at home,
 * design audit S14) had been seen. On a touch press the first tap arms, and the second tap on the same icon, or Send, sends.
 * A mouse or the keyboard is as it was: hovering or focusing shows the popup, and a press sends. A refused icon only explains,
 * however it is pressed. An icon that opens a chooser of its own before anything is sent - the town errand's list, the
 * Neighbours list, the card that asks twice before sending for a soldier, the ground to be tapped on the map for work there - is
 * not armed first: the chooser is the second step.
 */
export function iconPress({ touch = false, refused = false, armed = false, opensChooser = false } = {}) {
  if (refused) return 'explain';
  if (!touch || opensChooser || armed) return 'send';
  return 'arm';
}

// ---------------------------------------------------------------------------------------------------- drawing, in a page

/** Draw an icon's picture into its canvas: a library sprite fitted to the square, or a drawn glyph. */
export function drawIcon(canvas, key, { drawSprite, spriteFrame }) {
  const ctx = canvas.getContext('2d'), size = canvas.width;
  ctx.clearRect(0, 0, size, size);
  const icon = PANEL_ICONS[key];
  // The key's own `icon-<key>` frame first, the moment one is registered (the road's icons, the children's, the sickness icons
  // standing in on another key's picture), then the picture the table names, then the glyph.
  const sprite = spriteFrame(`icon-${key}`) ? `icon-${key}` : icon?.sprite || null;
  const frame = sprite && spriteFrame(sprite);
  if (frame) {
    const fit = Math.min(size * .86 / frame.w, size * .86 / frame.h);
    const x = (size - frame.w * fit) / 2 + frame.w * fit * frame.anchorX, y = (size - frame.h * fit) / 2 + frame.h * fit * frame.anchorY;
    if (drawSprite(ctx, sprite, x, y, fit * (frame.logicalHeight || frame.h))) return true;
  }
  drawGlyph(ctx, icon?.glyph || 'dot', size);
  return !icon?.sprite;
}

/**
 * The drawn glyphs: a dot while an icon's sheet has not arrived (or never does; the library is optional), and the camp's
 * four (stand-in: docs/ART_REQUESTS.md, request 2026-09-16 - the camp's icons): a musket at the shoulder for drill, a
 * beef's horns over a corn ear for foraging, a sentry's bayonet and a crescent moon for the guard, a horseshoe and a
 * spyglass for the scouts; and the road's three (docs/ROAD_EAST.md; stand-in: request 2026-09-16 - the road's icons):
 * `hunt-road` a rifle over a campfire, `tend-sick` a figure under a blanket with a cup beside, `trade-crossing` a coin passed
 * over a ferry's rail. Strokes, so they read as placeholders beside the illustrated icons; Astra's `icon-<key>` frames
 * replace them on registration with no change here.
 */
function drawGlyph(ctx, glyph, size) {
  const s = size / 48;
  ctx.save();
  ctx.scale(s, s);
  ctx.fillStyle = '#8a6a3d'; ctx.strokeStyle = '#8a6a3d'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (glyph === 'drill') {
    // A musket held at the shoulder: the barrel up, the stock down, a bayonet's point.
    ctx.beginPath(); ctx.moveTo(18, 42); ctx.lineTo(30, 8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(30, 8); ctx.lineTo(33, 3); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(14, 40); ctx.lineTo(24, 40); ctx.lineTo(22, 30); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(8, 44); ctx.lineTo(40, 44); ctx.stroke();
  } else if (glyph === 'forage') {
    // A beef's horns over an ear of corn.
    ctx.beginPath(); ctx.moveTo(8, 18); ctx.quadraticCurveTo(12, 6, 20, 14); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(40, 18); ctx.quadraticCurveTo(36, 6, 28, 14); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(24, 32, 6, 12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e9dcb8';
    for (const [x, y] of [[22, 26], [26, 26], [22, 32], [26, 32], [22, 38], [26, 38]]) { ctx.beginPath(); ctx.arc(x, y, 1.5, 0, Math.PI * 2); ctx.fill(); }
  } else if (glyph === 'guard') {
    // A sentry's musket with the bayonet fixed, under a crescent moon.
    ctx.beginPath(); ctx.moveTo(30, 44); ctx.lineTo(30, 14); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(30, 14); ctx.lineTo(30, 6); ctx.lineTo(33, 12); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.arc(14, 14, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e9dcb8'; ctx.beginPath(); ctx.arc(17, 12, 6, 0, Math.PI * 2); ctx.fill();
  } else if (glyph === 'scout') {
    // A horseshoe, and a spyglass laid across it.
    ctx.beginPath(); ctx.arc(24, 24, 13, Math.PI * 0.8, Math.PI * 2.2); ctx.stroke();
    ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(12, 38); ctx.lineTo(34, 16); ctx.stroke();
    ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(34, 16); ctx.lineTo(40, 10); ctx.stroke();
  } else if (glyph === 'hunt-road') {
    ctx.strokeStyle = '#3a2a18';
    // The fire, and the rifle leaning over it.
    ctx.fillStyle = '#c2582c';
    ctx.beginPath(); ctx.moveTo(16, 40); ctx.quadraticCurveTo(24, 22, 32, 40); ctx.closePath(); ctx.fill();
    ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(10, 42); ctx.lineTo(38, 42); ctx.stroke();
    ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(12, 38); ctx.lineTo(40, 8); ctx.stroke();
    ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(12, 38); ctx.lineTo(20, 30); ctx.stroke();
  } else if (glyph === 'tend-sick') {
    ctx.strokeStyle = '#3a2a18';
    // Somebody lying under a blanket, and a cup set beside them.
    ctx.fillStyle = '#5f7a8a';
    ctx.beginPath(); ctx.moveTo(6, 34); ctx.quadraticCurveTo(24, 20, 40, 34); ctx.lineTo(40, 40); ctx.lineTo(6, 40); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#d9b48a';
    ctx.beginPath(); ctx.arc(10, 27, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8a6a3d';
    ctx.fillRect(38, 22, 6, 7);
    ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(6, 42); ctx.lineTo(44, 42); ctx.stroke();
  } else if (glyph === 'camp-apart') {
    // stand-in: docs/ART_REQUESTS.md, request 2026-09-27 "the sickness icons". Three tents crowded on the bank below, and one
    // up the stream on its own, with the water between: the family's camp moved away from the crowd (sim/disease.mjs).
    ctx.strokeStyle = '#41556b'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(4, 44); ctx.quadraticCurveTo(20, 36, 30, 28); ctx.quadraticCurveTo(38, 20, 44, 18); ctx.stroke();
    ctx.fillStyle = '#8a6a3d';
    for (const [x, y] of [[8, 38], [16, 40], [12, 32]]) { ctx.beginPath(); ctx.moveTo(x - 5, y); ctx.lineTo(x, y - 7); ctx.lineTo(x + 5, y); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = '#5f7a8a';
    ctx.beginPath(); ctx.moveTo(30, 16); ctx.lineTo(37, 6); ctx.lineTo(44, 16); ctx.closePath(); ctx.fill();
  } else if (glyph === 'trade-crossing') {
    // A ferry's rail over the water, and a coin passed across it.
    ctx.strokeStyle = '#41556b'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(4, 38); ctx.quadraticCurveTo(12, 33, 20, 38); ctx.quadraticCurveTo(28, 43, 36, 38); ctx.quadraticCurveTo(40, 36, 44, 38); ctx.stroke();
    ctx.strokeStyle = '#3a2a18'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(8, 30); ctx.lineTo(40, 30); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(12, 30); ctx.lineTo(12, 22); ctx.moveTo(36, 30); ctx.lineTo(36, 22); ctx.stroke();
    ctx.fillStyle = '#c9a227'; ctx.beginPath(); ctx.arc(24, 16, 6, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#7a5a10'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(24, 16, 6, 0, Math.PI * 2); ctx.stroke();
  } else if (glyph === 'fetch-logs') {
    // Logs laid across a wagon's bed, on two wheels: fetching logs from the timber (docs/BIOME_GAMEPLAY.md §3.2).
    ctx.strokeStyle = '#3a2a18';
    ctx.fillStyle = '#8a6a3d';
    for (const y of [14, 20, 26]) { ctx.beginPath(); ctx.ellipse(24, y, 16, 3, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#d9b48a';
    for (const y of [14, 20, 26]) { ctx.beginPath(); ctx.arc(40, y, 2.5, 0, Math.PI * 2); ctx.fill(); }
    ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(6, 31); ctx.lineTo(42, 31); ctx.stroke();
    ctx.lineWidth = 2.5; for (const x of [14, 34]) { ctx.beginPath(); ctx.arc(x, 38, 6, 0, Math.PI * 2); ctx.stroke(); }
  } else if (glyph === 'carreta') {
    // Two great solid wheels on a wooden axle under a plank bed and its tongue: the carreta made at home (sim/carreta.mjs).
    ctx.strokeStyle = '#3a2a18';
    ctx.fillStyle = '#8a6a3d';
    ctx.fillRect(8, 16, 30, 6);
    ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(38, 19); ctx.lineTo(46, 26); ctx.stroke();
    ctx.fillStyle = '#a07c4a';
    for (const x of [15, 31]) { ctx.beginPath(); ctx.arc(x, 31, 9, 0, Math.PI * 2); ctx.fill(); ctx.lineWidth = 2; ctx.stroke(); }
    ctx.fillStyle = '#3a2a18';
    for (const x of [15, 31]) { ctx.beginPath(); ctx.arc(x, 31, 2.5, 0, Math.PI * 2); ctx.fill(); }
  } else if (glyph === 'small-game') {
    // A squirrel on a branch, its tail up: the hour's work, not the day's (sim/gathering.mjs).
    ctx.strokeStyle = '#3a2a18';
    ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(4, 40); ctx.lineTo(44, 40); ctx.stroke();
    ctx.fillStyle = '#8a6a3d';
    ctx.beginPath(); ctx.ellipse(22, 30, 9, 7, -0.3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(31, 23, 5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(34, 19); ctx.lineTo(36, 14); ctx.lineTo(31, 17); ctx.closePath(); ctx.fill();
    ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(14, 33); ctx.quadraticCurveTo(6, 26, 12, 14); ctx.stroke();
  } else if (glyph === 'fish') {
    // A fish over the water, and the line that took it.
    ctx.strokeStyle = '#41556b'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(4, 40); ctx.quadraticCurveTo(12, 35, 20, 40); ctx.quadraticCurveTo(28, 45, 36, 40); ctx.quadraticCurveTo(40, 38, 44, 40); ctx.stroke();
    ctx.fillStyle = '#7f96a8';
    ctx.beginPath(); ctx.ellipse(24, 24, 13, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(10, 24); ctx.lineTo(2, 17); ctx.lineTo(2, 31); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e9dcb8'; ctx.beginPath(); ctx.arc(32, 22, 2, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#3a2a18'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(38, 4); ctx.lineTo(34, 20); ctx.stroke();
  } else if (glyph === 'oysters') {
    // Two shells open on the sand, at low water.
    ctx.strokeStyle = '#3a2a18'; ctx.lineWidth = 2.5;
    ctx.fillStyle = '#b9ae96';
    ctx.beginPath(); ctx.ellipse(17, 26, 11, 8, -0.35, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(32, 33, 9, 7, 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e9dcb8';
    ctx.beginPath(); ctx.ellipse(17, 26, 6, 4, -0.35, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#41556b'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(4, 12); ctx.quadraticCurveTo(14, 7, 24, 12); ctx.quadraticCurveTo(34, 17, 44, 12); ctx.stroke();
  } else if (glyph === 'bee-tree') {
    // The trunk, the hollow the bees are working, and one bee.
    ctx.strokeStyle = '#3a2a18';
    ctx.fillStyle = '#8a6a3d'; ctx.fillRect(18, 10, 12, 32);
    ctx.fillStyle = '#c9a227';
    ctx.beginPath(); ctx.ellipse(24, 24, 5, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(24, 18); ctx.lineTo(24, 30); ctx.stroke();
    ctx.fillStyle = '#3a2a18'; ctx.beginPath(); ctx.arc(38, 16, 3, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(36, 12); ctx.lineTo(40, 12); ctx.stroke();
  } else if (glyph === 'beef') {
    // A long-horned cow standing side-on: the beef on the range.
    ctx.strokeStyle = '#3a2a18';
    ctx.fillStyle = '#8a6a3d';
    ctx.beginPath(); ctx.ellipse(23, 26, 13, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(37, 20, 5, 4, 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(36, 16); ctx.quadraticCurveTo(31, 10, 34, 8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(40, 16); ctx.quadraticCurveTo(45, 10, 42, 8); ctx.stroke();
    ctx.lineWidth = 3;
    for (const x of [15, 22, 29]) { ctx.beginPath(); ctx.moveTo(x, 33); ctx.lineTo(x, 42); ctx.stroke(); }
    ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(10, 22); ctx.lineTo(6, 34); ctx.stroke();
  } else if (glyph === 'hog') {
    // A hog with its snout down in the mast.
    ctx.strokeStyle = '#3a2a18';
    ctx.fillStyle = '#9a8272';
    ctx.beginPath(); ctx.ellipse(24, 24, 13, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(37, 27, 6, 5, 0.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3a2a18'; ctx.beginPath(); ctx.arc(42, 30, 2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#9a8272'; ctx.beginPath(); ctx.moveTo(33, 21); ctx.lineTo(36, 14); ctx.lineTo(39, 21); ctx.closePath(); ctx.fill();
    ctx.lineWidth = 3;
    for (const x of [17, 24, 30]) { ctx.beginPath(); ctx.moveTo(x, 31); ctx.lineTo(x, 40); ctx.stroke(); }
    ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(11, 20); ctx.quadraticCurveTo(6, 18, 8, 14); ctx.stroke();
    // The mast it is feeding on.
    ctx.fillStyle = '#8a6a3d';
    for (const [x, y] of [[12, 42], [18, 44], [24, 42]]) { ctx.beginPath(); ctx.ellipse(x, y, 2.5, 3.5, 0, 0, Math.PI * 2); ctx.fill(); }
  } else if (glyph === 'range') {
    // A rider's hat over open grass: the day out after the stock.
    ctx.strokeStyle = '#3a2a18';
    ctx.fillStyle = '#6a5136';
    ctx.beginPath(); ctx.ellipse(24, 26, 18, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(24, 18, 8, 9, 0, Math.PI, Math.PI * 2); ctx.fill();
    ctx.fillRect(16, 18, 16, 5);
    ctx.strokeStyle = '#6f7a4a'; ctx.lineWidth = 2.5;
    for (const x of [8, 14, 34, 40]) { ctx.beginPath(); ctx.moveTo(x, 44); ctx.quadraticCurveTo(x - 2, 38, x + 1, 33); ctx.stroke(); }
  } else if (glyph === 'play') {
    // A stick horse: the hour that is the child's own (sim/children.mjs).
    ctx.strokeStyle = '#3a2a18';
    ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(30, 12); ctx.lineTo(14, 42); ctx.stroke();
    ctx.fillStyle = '#8a6a3d';
    ctx.beginPath(); ctx.moveTo(24, 16); ctx.lineTo(30, 4); ctx.lineTo(40, 8); ctx.lineTo(40, 18); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e9dcb8'; ctx.beginPath(); ctx.arc(34, 11, 1.8, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#8a6a3d'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(26, 14); ctx.quadraticCurveTo(20, 18, 22, 26); ctx.stroke();
  } else if (glyph === 'kindling') {
    // An armful of chips and dead sticks, crossed, and no axe anywhere near them.
    ctx.strokeStyle = '#8a6a3d'; ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.moveTo(8, 38); ctx.lineTo(38, 16); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(10, 16); ctx.lineTo(40, 38); ctx.stroke();
    ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(6, 27); ctx.lineTo(42, 27); ctx.stroke();
    ctx.fillStyle = '#6a5136';
    for (const [x, y] of [[16, 42], [24, 44], [32, 42]]) { ctx.beginPath(); ctx.ellipse(x, y, 4, 2, 0, 0, Math.PI * 2); ctx.fill(); }
  } else if (glyph === 'birds') {
    // Two birds going up off a standing ear of corn.
    ctx.strokeStyle = '#3a2a18'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(6, 12); ctx.quadraticCurveTo(11, 7, 16, 12); ctx.quadraticCurveTo(21, 7, 26, 12); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(24, 22); ctx.quadraticCurveTo(28, 18, 32, 22); ctx.quadraticCurveTo(36, 18, 40, 22); ctx.stroke();
    ctx.fillStyle = '#6f7a4a';
    ctx.beginPath(); ctx.moveTo(18, 44); ctx.lineTo(18, 30); ctx.stroke();
    ctx.strokeStyle = '#6f7a4a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(20, 44); ctx.lineTo(20, 28); ctx.stroke();
    ctx.fillStyle = '#c9a227'; ctx.beginPath(); ctx.ellipse(20, 30, 5, 9, 0, 0, Math.PI * 2); ctx.fill();
  } else if (glyph === 'eggs') {
    // Three eggs in a nest of straw.
    ctx.strokeStyle = '#8a6a3d'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(24, 28, 16, 0, Math.PI); ctx.stroke();
    for (const x of [10, 24, 38]) { ctx.beginPath(); ctx.moveTo(x, 30); ctx.lineTo(x + (x < 24 ? -4 : x > 24 ? 4 : 0), 24); ctx.stroke(); }
    ctx.fillStyle = '#e9dcb8';
    for (const [x, y] of [[17, 26], [31, 26], [24, 20]]) { ctx.beginPath(); ctx.ellipse(x, y, 5, 6.5, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.strokeStyle = '#8a6a3d'; ctx.lineWidth = 1.5;
    for (const [x, y] of [[17, 26], [31, 26], [24, 20]]) { ctx.beginPath(); ctx.ellipse(x, y, 5, 6.5, 0, 0, Math.PI * 2); ctx.stroke(); }
  } else if (glyph === 'water-pail') {
    // A pail with a bail, and the water in it.
    ctx.strokeStyle = '#3a2a18'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(24, 18, 11, Math.PI, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#8a6a3d';
    ctx.beginPath(); ctx.moveTo(12, 18); ctx.lineTo(36, 18); ctx.lineTo(32, 42); ctx.lineTo(16, 42); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#41556b';
    ctx.beginPath(); ctx.moveTo(14, 24); ctx.lineTo(34, 24); ctx.lineTo(32, 40); ctx.lineTo(16, 40); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#3a2a18'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(12, 18); ctx.lineTo(36, 18); ctx.stroke();
  } else if (glyph === 'mind') {
    // A bigger child with a smaller one on their hip.
    ctx.fillStyle = '#d9b48a';
    ctx.beginPath(); ctx.arc(18, 12, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#6a5136';
    ctx.beginPath(); ctx.moveTo(12, 20); ctx.lineTo(24, 20); ctx.lineTo(26, 44); ctx.lineTo(10, 44); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#d9b48a';
    ctx.beginPath(); ctx.arc(33, 22, 4.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8a6a3d';
    ctx.beginPath(); ctx.ellipse(33, 32, 6, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#6a5136'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(22, 26); ctx.lineTo(31, 30); ctx.stroke();
  } else if (LITTLE_GLYPHS[glyph]) {
    // The children's play and the Scrape's work (stand-in: docs/ART_REQUESTS.md, request 2026-09-26).
    LITTLE_GLYPHS[glyph](ctx);
  } else {
    ctx.beginPath(); ctx.arc(24, 24, 6, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

/** Strokes on a 48-unit square, for the icons that have no frame yet. Each says its one thing in two or three marks. */
const line = (ctx, ...points) => { ctx.beginPath(); ctx.moveTo(...points[0]); for (const point of points.slice(1)) ctx.lineTo(...point); ctx.stroke(); };
const dot = (ctx, x, y, r, fill = true) => { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); if (fill) ctx.fill(); else ctx.stroke(); };
const LITTLE_GLYPHS = Object.freeze({
  // A tent: the sheet over its ridge pole, pegged down, the door open (sim/shelter.mjs).
  'pitch-tent': ctx => { line(ctx, [6, 40], [24, 9], [42, 40]); line(ctx, [24, 9], [24, 40]); line(ctx, [18, 40], [24, 26], [30, 40]); line(ctx, [3, 42], [45, 42]); },
  // A stick with a horse's head on it, and a string for a bridle.
  'child-stick-horse': ctx => { line(ctx, [12, 44], [30, 14]); ctx.beginPath(); ctx.ellipse(34, 11, 7, 4.5, -0.5, 0, Math.PI * 2); ctx.fill(); line(ctx, [30, 7], [29, 3]); line(ctx, [32, 16], [22, 26]); },
  // A doll in a husk skirt.
  'child-doll': ctx => { dot(ctx, 24, 11, 5); ctx.beginPath(); ctx.moveTo(24, 16); ctx.lineTo(36, 42); ctx.lineTo(12, 42); ctx.closePath(); ctx.fill(); line(ctx, [16, 22], [32, 22]); },
  // One running after another.
  'child-tag': ctx => { dot(ctx, 14, 12, 4); line(ctx, [14, 16], [12, 30], [8, 42]); line(ctx, [12, 30], [18, 42]); line(ctx, [13, 20], [22, 22]); dot(ctx, 34, 14, 4); line(ctx, [34, 18], [36, 32], [32, 42]); line(ctx, [36, 32], [42, 40]); line(ctx, [40, 20], [44, 16]); },
  // A wall, and a head just showing over it.
  'child-hide': ctx => { ctx.fillRect(8, 24, 32, 18); dot(ctx, 30, 20, 5); ctx.fillStyle = '#e9dcb8'; dot(ctx, 28, 19, 1.2); dot(ctx, 32, 19, 1.2); },
  // A box on an axle and two round biscuit wheels.
  'child-cart': ctx => { ctx.fillRect(10, 16, 28, 12); line(ctx, [8, 34], [40, 34]); ctx.fillStyle = '#c9a227'; dot(ctx, 14, 34, 6); dot(ctx, 34, 34, 6); },
  // A hoop, and the stick that drives it.
  'child-hoop': ctx => { ctx.lineWidth = 3.5; dot(ctx, 22, 26, 14, false); ctx.lineWidth = 3; line(ctx, [44, 6], [30, 22]); },
  // A ring drawn in the dirt with marbles in it, and a knucklebone.
  'child-marbles': ctx => { ctx.lineWidth = 2; dot(ctx, 22, 26, 15, false); dot(ctx, 16, 22, 3.5); dot(ctx, 26, 30, 3.5); dot(ctx, 22, 18, 3); ctx.fillRect(34, 36, 10, 5); },
  // A hen, and the corn thrown for her.
  'child-hens': ctx => { ctx.beginPath(); ctx.ellipse(22, 28, 12, 9, 0, 0, Math.PI * 2); ctx.fill(); dot(ctx, 32, 17, 5); ctx.fillStyle = '#c2582c'; ctx.beginPath(); ctx.moveTo(37, 17); ctx.lineTo(42, 18); ctx.lineTo(37, 20); ctx.fill(); ctx.fillStyle = '#c9a227'; for (const [x, y] of [[10, 42], [16, 44], [26, 43], [34, 42], [40, 44]]) dot(ctx, x, y, 1.8); },
  // A chest going into the ground, and a spade.
  'flee-hide': ctx => { line(ctx, [4, 30], [44, 30]); ctx.fillRect(10, 30, 20, 12); line(ctx, [38, 6], [38, 30]); ctx.fillRect(34, 26, 8, 8); },
  // A bundle knotted on a stick.
  'flee-bundle': ctx => { line(ctx, [6, 42], [40, 10]); ctx.beginPath(); ctx.ellipse(30, 24, 11, 9, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#e9dcb8'; dot(ctx, 34, 17, 2.5); },
  // A cow, and the rope from her horns to a hand.
  'flee-cow': ctx => { ctx.beginPath(); ctx.ellipse(28, 28, 13, 8, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillRect(18, 34, 3, 10); ctx.fillRect(34, 34, 3, 10); dot(ctx, 14, 22, 5); line(ctx, [11, 16], [8, 12]); line(ctx, [17, 16], [20, 12]); ctx.lineWidth = 2; line(ctx, [12, 25], [4, 38]); },
  // An eye, and the road going away behind it.
  'road-lookout': ctx => { line(ctx, [4, 44], [20, 30]); line(ctx, [44, 44], [28, 30]); ctx.beginPath(); ctx.ellipse(24, 14, 14, 7, 0, 0, Math.PI * 2); ctx.stroke(); dot(ctx, 24, 14, 4); },
  // Two notes.
  'road-sing': ctx => { dot(ctx, 14, 36, 5); dot(ctx, 34, 32, 5); line(ctx, [18, 36], [18, 10], [38, 6], [38, 32]); line(ctx, [18, 16], [38, 12]); },
  // A bigger walker leading a small one by the hand.
  'road-little-ones': ctx => { dot(ctx, 16, 10, 5); line(ctx, [16, 15], [16, 32], [11, 44]); line(ctx, [16, 32], [21, 44]); line(ctx, [16, 20], [30, 26]); dot(ctx, 33, 22, 3.5); line(ctx, [33, 26], [33, 36], [30, 44]); line(ctx, [33, 36], [36, 44]); },
  // A fire on two crossed logs.
  'camp-fire': ctx => { line(ctx, [8, 44], [40, 36]); line(ctx, [8, 36], [40, 44]); ctx.fillStyle = '#c2582c'; ctx.beginPath(); ctx.moveTo(14, 38); ctx.quadraticCurveTo(24, 6, 34, 38); ctx.closePath(); ctx.fill(); },
  // A flat ferry on the water, and its rope across.
  'ferry-help': ctx => { line(ctx, [2, 14], [46, 14]); ctx.beginPath(); ctx.moveTo(8, 26); ctx.lineTo(40, 26); ctx.lineTo(36, 34); ctx.lineTo(12, 34); ctx.closePath(); ctx.fill(); line(ctx, [24, 14], [24, 26]); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(4, 42); ctx.quadraticCurveTo(12, 38, 20, 42); ctx.quadraticCurveTo(28, 46, 36, 42); ctx.quadraticCurveTo(40, 40, 44, 42); ctx.stroke(); },
  // A loaf passed from one hand to another.
  'share-food': ctx => { ctx.beginPath(); ctx.ellipse(24, 20, 10, 6, 0, 0, Math.PI * 2); ctx.fill(); line(ctx, [4, 34], [16, 30], [22, 32]); line(ctx, [44, 34], [32, 30], [26, 32]); },
  // Water, and a grown one wading with a small one on their back.
  // A child running, an arm out, toward a house with its door open.
  'child-help': ctx => { dot(ctx, 12, 14, 4); line(ctx, [12, 18], [14, 30], [8, 42]); line(ctx, [14, 30], [20, 40]); line(ctx, [13, 22], [24, 18]); ctx.beginPath(); ctx.moveTo(28, 26); ctx.lineTo(37, 16); ctx.lineTo(46, 26); ctx.closePath(); ctx.fill(); ctx.fillRect(30, 26, 14, 16); ctx.fillStyle = '#e9dcb8'; ctx.fillRect(35, 32, 5, 10); },
  // The women's own work (stand-in: docs/ART_REQUESTS.md, request 2026-10-03, items 1-3): a pot over the fire; a sprout over three
  // rows; a tub with a shirt over its rim and the battling stick.
  'keep-house': ctx => { line(ctx, [10, 14], [24, 6], [38, 14]); ctx.beginPath(); ctx.ellipse(24, 26, 10, 8, 0, 0, Math.PI * 2); ctx.fill(); line(ctx, [12, 20], [36, 20]); line(ctx, [14, 40], [20, 34], [24, 40], [28, 34], [34, 40]); line(ctx, [8, 44], [40, 44]); },
  'work-garden': ctx => { for (const y of [30, 37, 44]) line(ctx, [6, y], [42, y]); line(ctx, [24, 28], [24, 12]); ctx.beginPath(); ctx.ellipse(18, 14, 6, 3, -0.5, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.ellipse(30, 10, 6, 3, 0.5, 0, Math.PI * 2); ctx.fill(); },
  'wash-clothes': ctx => { ctx.beginPath(); ctx.moveTo(8, 26); ctx.lineTo(40, 26); ctx.lineTo(36, 44); ctx.lineTo(12, 44); ctx.closePath(); ctx.fill(); line(ctx, [14, 26], [12, 16], [20, 14], [28, 14], [36, 16], [34, 26]); line(ctx, [40, 6], [30, 22]); ctx.fillStyle = '#e9dcb8'; ctx.fillRect(10, 30, 28, 3); },
  'ford-carry': ctx => { dot(ctx, 22, 8, 4.5); line(ctx, [22, 13], [22, 30]); dot(ctx, 30, 12, 3.5); line(ctx, [22, 18], [30, 16]); ctx.lineWidth = 2; for (const y of [32, 40]) { ctx.beginPath(); ctx.moveTo(4, y); ctx.quadraticCurveTo(14, y - 4, 24, y); ctx.quadraticCurveTo(34, y + 4, 44, y); ctx.stroke(); } },
});

/**
 * The line a person's row says about the family's little ones (docs/CHILDREN.md), in the server's own words, or ''. A grown-up
 * stopped to talk with a child who has nothing to do says why and what to do about it; a child says they are going to find
 * somebody, talking, dawdling, or that their automation has just gone off; a baby says it is crawling, crying, held or asleep.
 */
export const lifeLine = entity => (entity?.life ? String(entity.life) : '');
/**
 * A baby's one short word for what it is doing - "crawling", "crying", "held", "napping", "asleep", "carried" - in the server's own
 * word (sim/babies.mjs `babyWord`), or ''. Shown beside its name when the column is too tight for its sentence, which it replaces
 * there (owner, 2026-09-27, by multiple choice: "Show a short word"; docs/CHILDREN.md §9).
 */
export const lifeWord = entity => (entity?.lifeWord ? String(entity.lifeWord) : '');

/**
 * Draw one of the panel's marks into its canvas: `mark-need`, `mark-need-rider`, `mark-main`, `mark-idle`, `mark-auto-off`
 * or `mark-auto-on`, fitted to the square. True when it drew; false when the frame is not there, and the page shows the
 * type it had instead (docs/ART_REQUESTS.md, request 2026-09-16 - the family panel's marks).
 *
 * stand-in: the marks drawn today are Claude-drawn, from public/assets/claude-standins/; Astra's frames of the same names
 * replace them when registered.
 */
export function drawMark(canvas, name, { drawSprite, spriteFrame }) {
  const ctx = canvas.getContext('2d'), size = canvas.width;
  ctx.clearRect(0, 0, size, size);
  const frame = spriteFrame(name);
  if (!frame) return false;
  const fit = Math.min(size / frame.w, size / frame.h);
  const x = (size - frame.w * fit) / 2 + frame.w * fit * frame.anchorX, y = (size - frame.h * fit) / 2 + frame.h * fit * frame.anchorY;
  return Boolean(drawSprite(ctx, name, x, y, fit * (frame.logicalHeight || frame.h)));
}

/**
 * Draw a portrait: `portrait-<figure>`, the head and shoulders of the figure the map draws the person as (`figure`, chosen
 * by `figureOf` in public/motion.js, the one chooser the map uses too), fitted to the square on the page's flat ground.
 *
 * stand-in: docs/ART_REQUESTS.md, "Claude-drawn stand-ins (replace with Astra's)". The `portrait-*` frames drawn today are
 * Claude-drawn (public/assets/claude-standins/, request 2026-09-15 - face portraits); Astra's of the same names replace
 * them when registered. Without a portrait frame the older stand-in stays: the figure's own idle clip drawn large with only
 * its top showing, and a drawn silhouette until any sheet loads.
 */
export function drawPortrait(canvas, { clip, figure = null, band, principal = false, tint = 0 }, { drawClip, drawSprite = null, spriteFrame = null }) {
  const ctx = canvas.getContext('2d'), size = canvas.width;
  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = '#e9dcb8'; ctx.fillRect(0, 0, size, size);
  const portrait = figure && spriteFrame ? spriteFrame(`portrait-${figure}`) : null;
  if (portrait && drawSprite) {
    const fit = size / Math.max(portrait.w, portrait.h);
    if (drawSprite(ctx, `portrait-${figure}`, size / 2 - portrait.w * fit * (0.5 - portrait.anchorX), size / 2 + portrait.h * fit * (portrait.anchorY - 0.5), fit * (portrait.logicalHeight || portrait.h))) return true;
  }
  // How much of the figure fills the square: a grown figure's head and shoulders are about its top third; a small child's
  // head is a bigger share of them, and an infant in a basket is shown whole.
  const share = { infant: 1.05, small: 1.9, child: 2.3, youth: 2.8, adult: 2.9 }[band] || 2.9;
  const height = size * share;
  const feet = band === 'infant' ? size * .96 : size * .05 + height * .95;
  if (drawClip(ctx, clip, size / 2, feet, height, { paused: true, timeMs: 0 })) return true;
  const coat = principal ? '#a9512d' : ['#7d6a4c', '#5d6b52', '#8a6a4a', '#6d5a68', '#4f6570'][tint % 5];
  const skin = ['#e0b48c', '#c9915f', '#a76c41', '#7d4d2c', '#f0cba6'][(tint >> 3) % 5];
  ctx.strokeStyle = '#392e20'; ctx.lineWidth = size * .03;
  ctx.beginPath(); ctx.ellipse(size / 2, size * 1.02, size * .42, size * .36, 0, Math.PI, 0); ctx.closePath(); ctx.fillStyle = coat; ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(size / 2, size * .44, size * .2, 0, Math.PI * 2); ctx.fillStyle = skin; ctx.fill(); ctx.stroke();
  return false;
}

// ---------------------------------------------------------------------------------------------- the load for the east
// Design audit 2026-09-28 B7: "Leave for the east" opened with every good at 0, so the obvious two presses sent a family east
// with no food. The card now opens on the server's packing (`flight.packed`, sim/scrape.mjs `packFlight`: food first, then seed,
// cotton and powder, as a family that decides alone packs), and a load far under that is asked in its own words and cannot be
// sent by a double press (public/app.js `SLOW_CONFIRM`).

/** How much room a load takes, by the flight's own space for each good. */
export const loadSpace = (space = {}, take = {}) => Object.entries(take || {}).reduce((sum, [good, amount]) => sum + (space?.[good] ?? 0) * (Number(amount) || 0), 0);

/**
 * Whether a load leaves most of what the family could carry: `'empty'` when it takes nothing, `'light'` when it takes less than
 * half the room the server's own packing would fill, otherwise null - and null when there was nothing to take in the first place.
 */
export function lightLoad(flight, take) {
  const full = loadSpace(flight?.space, flight?.packed?.take);
  if (!(full > 0)) return null;
  const used = loadSpace(flight.space, take);
  return used <= 0 ? 'empty' : used < full / 2 ? 'light' : null;
}

// ---------------------------------------------------------------------------------------------- whose bar is shown
/**
 * Whose icons are the bar at the bottom (design audit 2026-09-28 B11): the person the student chose on the panel - by their
 * portrait, the "!", a notice's Go to - if they are alive and free to be looked at, otherwise the main person. Choosing somebody
 * by the "!" or a notice never changes who the main person is: that is `set-main`, sent by the star, by the portrait (owner
 * 2026-09-29: the same as the star, docs/FAMILY_PANEL.md) and by the bar's *Make … the main person*,
 * because the main person is who travels, rests, works about the place and - on auto - decides the family's flight and its
 * answers on the road (sim/auto.mjs, sim/pursuit.mjs).
 */
export function barPerson({ viewedId = null, mainId = null, entities = new Map() } = {}) {
  const viewed = viewedId ? entities.get(viewedId) : null;
  return viewed && !['dead', 'captured'].includes(viewed.health?.condition) ? viewedId : mainId;
}

// ------------------------------------------------------------------------------------------------ the family's food, as a gauge

/**
 * The food gauge's levels, calm to dangerous (owner, 2026-09-30: "better facilitate player awareness of where the family resources
 * stand and the severity of consequences of running out ... do it with highlights, colors, etc. don't use text and over explain";
 * docs/HUNGER.md §5). The first four are the days the store lasts at the family's eating (sim/hunger.mjs `larderShown`); the last
 * three are the worst of its people when it has run out.
 */
export const LARDER_LEVELS = Object.freeze(['plenty', 'fair', 'low', 'short', 'empty', 'weak', 'starving']);
/** The days of food that fill the gauge: a fortnight. */
export const LARDER_FULL_DAYS = 14;
/** Where the family's food stands: a level of `LARDER_LEVELS`, or null when the server sent no gauge (a family nobody plays). */
export function larderLevel(larder, food = 0) {
  if (!larder) return null;
  if (larder.stage === 'starving' || larder.stage === 'weak') return larder.stage;
  if (larder.stage === 'hungry' || (!(food > 0) && larder.days !== null && larder.days !== undefined)) return 'empty';
  const days = larder.days;
  if (days === null || days === undefined) return 'plenty';
  return days < 3 ? 'short' : days < 7 ? 'low' : days < LARDER_FULL_DAYS ? 'fair' : 'plenty';
}
/** How full the gauge is drawn, 0 to 1: the days the store lasts against a fortnight, full while nothing runs it down. */
export const larderFill = larder => (!larder || larder.days === null || larder.days === undefined ? 1 : Math.max(0, Math.min(1, larder.days / LARDER_FULL_DAYS)));
/** The gauge's hover and screen-reader label: a few words, never an explanation. */
export function larderLabel(larder, food = 0, level = larderLevel(larder, food)) {
  const amount = `Food ${Number(food || 0).toFixed(1)}`;
  const said = { plenty: '', fair: '', low: 'running low', short: 'almost gone', empty: 'none left', weak: 'none left, weak with hunger', starving: 'none left, starving' }[level] || '';
  const days = Number.isFinite(larder?.days) && larder.days > 0 ? `about ${Math.max(1, Math.floor(larder.days))} day${Math.floor(larder.days) === 1 ? '' : 's'}` : '';
  return [amount, days, said].filter(Boolean).join(', ');
}
/** Whether the gauge has got worse: a flash is for a stage reached, not for one left behind. */
export const larderWorse = (was, now) => Boolean(was && now && LARDER_LEVELS.indexOf(now) > LARDER_LEVELS.indexOf(was));
/** A person's hunger on their row (sim/hunger.mjs): 'fed', 'hungry', 'weak' or 'starving'. */
export const hungerOf = entity => (['hungry', 'weak', 'starving'].includes(entity?.hunger?.stage) ? entity.hunger.stage : 'fed');
/** Its word for the portrait's hover and a screen reader; nothing while fed. */
export const HUNGER_WORDS = Object.freeze({ fed: '', hungry: 'hungry', weak: 'weak with hunger', starving: 'starving' });
/**
 * Where food comes from (owner, 2026-10-02: "limit food generation to crops, fishing, hunting, etc."; docs/HUNGER.md §10): the works
 * that bring food in. While the family's food is low or gone (`FEED_LEVELS`), each of these on the bar glows the gauge's amber, so a
 * student looking at the red gauge sees which buttons answer it. No words: the icons' own names and popups say what each is.
 */
export const FOOD_WORKS = Object.freeze(new Set(['fish-the-water', 'take-small-game', 'gather-oysters', 'cut-bee-tree', 'hunt-timber', 'hunt-land',
  'plant-field', 'harvest-field', 'butcher-hog', 'butcher-beef', 'fish-road', 'hunt-road', 'trade-crossing', 'child-eggs', 'milk-cow', 'milk-road', 'work-garden']));
/** The gauge's levels at which the food works glow. */
export const FEED_LEVELS = Object.freeze(new Set(['low', 'short', 'empty', 'weak', 'starving']));
/** Whether this icon should glow as a way to food now. */
export const feedsNow = (key, level) => FOOD_WORKS.has(key) && FEED_LEVELS.has(level);

// ------------------------------------------------------------------------------- what a refused goal is short of
// docs/FAMILY_PANEL.md §23 (owner, 2026-09-30: "i never saw where i could hunt to get leather to make the little carts", and the same
// day "Every gettable lack"). Work refused for want of a thing the family could get - a tool, seed, powder, coin, food, a hide, logs -
// stays on the bar greyed (`goal`), with a strip of what it wants (`needs`) and, in its popup, the ways to get the first thing missing.
// The counts are the server's (`world.household.wants`, by work, and `buy`, what the family's own town sells; sim/wants.mjs).

/** What each want is called, in the popup's list. */
export const WANT_NAMES = Object.freeze({ axe: 'Felling axe', logs: 'Logs', hide: 'Hide', rifle: 'Rifle', powder: 'Powder', hoe: 'Hoe', seed: 'Seed', coin: 'Coin', food: 'Food', cow: 'Cow' });
/**
 * The ways to get each want, in the order offered, and each button's words. `buy` ways are the town errand (`visit-shop`), offered only
 * when a shop in the family's own town sells the thing (the server's `buy`), and open the errand with its line on the list (`line`):
 * a hide by a hunt or from the tanner (owner, 2026-09-30, "Tanner sells": both offered), logs by felling, a worn hoe mended or a new one
 * bought, food hunted or fished, and the rest bought.
 */
export const WANT_FROM = Object.freeze({
  hide: Object.freeze([{ key: 'hunt-land', label: 'Go hunting' }, { key: 'hunt-timber', label: 'Go hunting' }, { key: 'visit-shop', label: 'Buy one from the tanner', buy: true, line: 'tanner:rawhide' }]),
  logs: Object.freeze([{ key: 'fell-trees', label: 'Fell trees' }]),
  axe: Object.freeze([{ key: 'visit-shop', label: 'Buy an axe in town', buy: true, line: 'blacksmith:tool-axe' }]),
  rifle: Object.freeze([{ key: 'visit-shop', label: 'Buy a rifle in town', buy: true, line: 'gunsmith:buy-rifle' }]),
  powder: Object.freeze([{ key: 'visit-shop', label: 'Buy powder in town', buy: true, line: 'store:powder' }]),
  hoe: Object.freeze([{ key: 'mend-hoe', label: 'Mend the hoe' }, { key: 'visit-shop', label: 'Buy a hoe in town', buy: true, line: 'store:hoe' }]),
  seed: Object.freeze([{ key: 'visit-shop', label: 'Buy seed in town', buy: true, line: 'store:seed' }]),
  coin: Object.freeze([{ key: 'visit-shop', label: 'Sell in town for coin', buy: true }]),
  // A cow to milk (sim/milking.mjs, owner 2026-10-02): a cow and calf from the stock pens, where the family's town has them.
  cow: Object.freeze([{ key: 'visit-shop', label: 'Buy a cow and calf in town', buy: true, line: 'stockman:cattle' }]),
  food: Object.freeze([{ key: 'hunt-land', label: 'Go hunting' }, { key: 'hunt-timber', label: 'Go hunting' }, { key: 'fish-the-water', label: 'Go fishing' }, { key: 'take-small-game', label: 'Take small game' }]),
});
/** This icon's wants, in the server's order, each `{ want, have, need, met }`; null when the family is short of nothing for it. */
export function needsFor(key, wants) {
  const set = wants?.[key];
  if (!set) return null;
  const list = Object.entries(set).filter(([, pair]) => Array.isArray(pair))
    .map(([want, [have, need]]) => ({ want, have: Number(have) || 0, need: Number(need) || 1, met: Number(have) >= Number(need) }));
  return list.length && list.some(one => !one.met) ? list : null;
}
/**
 * The ways on from a goal: for the first thing missing that has any way on this person's bar (`keysOnBar`), every one of them -
 * `{ want, key, label, line? }` each, one a label - and a buy only where the family's own town sells it (`buy`). Empty when none is
 * on the bar (the work that brings it refused too, and not kept greyed): then the popup's reason is all there is.
 */
export function nextSteps(needs, keysOnBar = [], buy = []) {
  for (const need of needs || []) {
    if (need.met) continue;
    const ways = [], seen = new Set();
    for (const way of WANT_FROM[need.want] || []) {
      if (!keysOnBar.includes(way.key) || seen.has(way.label) || (way.buy && !buy.includes(need.want))) continue;
      seen.add(way.label);
      ways.push({ want: need.want, key: way.key, label: way.label, ...(way.line && { line: way.line }) });
    }
    if (ways.length) return ways;
  }
  return [];
}
/** The first way on, or null. */
export const nextStep = (needs, keysOnBar = [], buy = []) => nextSteps(needs, keysOnBar, buy)[0] || null;
/**
 * How many goals the bar may hold beside what can be pressed (owner, 2026-09-30: "Keep the bar readable at 1024x600"). The bar is a
 * grid of at most two rows (docs/FAMILY_PANEL.md, 2026-09-22) of 80 px columns, its names readable; `width` is what the page
 * gives it. Goals fill what the pressable icons leave of those two rows, and never more than `GOALS_MOST`. ceiling: the goals kept are
 * the first in the server's order; ranking which a family most needs is a question nobody has asked.
 */
export const GOALS_MOST = 6;
export const goalRoom = (pressable, width = 1146) => Math.max(0, Math.min(GOALS_MOST, 2 * Math.max(1, Math.floor(width / 80)) - pressable));

/**
 * What the bar draws of a row's icons: what can be pressed or is going on, as since 2026-09-22 (`pressable`, the page's own test of
 * that, the guided start's included), and - beside them - the goals refused only for something the family has not got (`goal`, the
 * server's `short`). A row with nothing to press keeps its one line of reason (§14) and no goals, so a person who can do nothing is
 * not shown a greyed carreta in place of why.
 */
export function barIcons(icons, pressable = icon => icon.active || icon.can, room = GOALS_MOST) {
  const open = icons.filter(pressable);
  if (!open.length) return open;
  // The goals first, then the work refused by custom (sim/custom.mjs), greyed with its words, in what room is left.
  const kept = [...icons.filter(icon => !open.includes(icon) && icon.goal), ...icons.filter(icon => !open.includes(icon) && !icon.goal && icon.custom)];
  const goals = new Set(kept.slice(0, Math.max(0, room)));
  return icons.filter(icon => open.includes(icon) || goals.has(icon));
}

// ------------------------------------------------------------------------------- a plot tapped on the map
// docs/LAND_GRANTS.md §5.2, amendment of 2026-09-30 (owner: "let me click on the fields so i can select what is grown there"). A
// plot of the family's own field tapped with no work chosen first opens the plot chooser on that plot: a bare plot to plant corn or
// cotton, a growing one to say when it is ready, a ripe one to bring in, a staked one to clear.

/** What a plot is now, for the chooser: 'staked', 'bare', 'growing' or 'ripe', from the family's own land line; null for no plot. */
export function plotStage(plot) {
  if (!plot) return null;
  if (plot.state === 'staked') return 'staked';
  if (plot.state !== 'cleared') return null;
  return !plot.sown ? 'bare' : plot.ripe ? 'ripe' : 'growing';
}
/** The work the chooser looks at the plot for (`/api/plot?job=`): clearing for staked ground, planting - which says what grows - for the rest. */
export const plotJobFor = plot => ({ staked: 'clear-plot', bare: 'plant-field', growing: 'plant-field', ripe: 'plant-field' })[plotStage(plot)] || null;
/** The work a press in the chooser would send for this plot: clearing, planting, or bringing in the ripe crop; nothing while it grows. */
export const plotWorkFor = plot => ({ staked: 'clear-plot', bare: 'plant-field', ripe: 'harvest-field' })[plotStage(plot)] || null;
/**
 * Who of the family a tapped plot's work would go to: the person whose bar is shown, then the main person, then the panel's order
 * (father, mother, children oldest first) - the first the server says may be sent on it now (`world.work`). When nobody may, the
 * person whose bar is shown, so the chooser says the server's reason in their name. Null with no rows at all.
 */
export function plotHand({ job, work = {}, barId = null, mainId = null, order = [] } = {}) {
  const may = id => Boolean(id) && (work[id] || []).some(entry => entry.id === job && entry.can);
  return [barId, mainId, ...order].find(may) || barId || mainId || order[0] || null;
}
/** Everybody who may be sent on this work now, in the panel's order: who the chooser offers to send instead. */
export const plotHands = ({ job, work = {}, order = [] } = {}) => order.filter(id => (work[id] || []).some(entry => entry.id === job && entry.can));
