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
  'plant-field': 'Turn the rows of every cleared plot and put in seed.',
  'harvest-field': 'Cut the ripe crop on every planted plot and carry it in.',
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
  'look-to-stock': 'Ride the range and through the timber after the stock, and mark the calves.',
  'sell-cotton': 'Carry the cotton to the store in town and trade it for food or coin.',
  'fetch-powder': 'Go to the store in town and buy powder and lead.',
  'fetch-seed': 'Go to the store in town and buy seed.',
  'sell-food': 'Carry spare food to the store in town and sell it for coin.',
  'mend-hoe': 'Set the worn hoe right again at home.',
  'replace-hoe': 'Go to the smith in town and buy a sound hoe for coin.',
  'visit-shop': 'Choose what they should buy and sell at the shops in town, then send them with the list.',
  // The old walk to the shops, kept only for a class saved in the middle of it (docs/TOWNS.md §4b): offered to nobody.
  'visit-shop-street': 'Walk the street in town, choosing a shop there and what to buy at its counter.',
  'make-furniture': 'Fetch a small tree from the timber and make a piece of furniture for the house.',
  'buy-furniture': 'Go to the carpenter in town and buy a piece of furniture for coin or food.',
  'fell-trees': 'Fell the trees at a place in timber you choose on the family’s land.',
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
  'hunt-road': 'Halt the family on the road east and go out from the camp for game, powder in hand.',
  'tend-sick': 'Halt the family for a day and nurse whoever is sick, so nobody in their care dies and the sick mend sooner.',
  'trade-crossing': 'Buy food with a real among the families camped at the crossing or the refuge, dear as it is.',
  'winter-recall': 'Send for them to leave where they serve and come home.',
  'camp-drill': 'Spend a day drilling with the company at the camp; three days make them steady in the line.',
  'camp-forage': 'Spend a day out for the mess, bringing beef and corn in to the camp.',
  'camp-guard': 'Stand a night on the camp guard.',
  'camp-scout': 'Ride out with the scouts for a day to find the enemy, which wants a horse and can bring them back hurt.',
  // What a family's children can be set to (sim/children.mjs, docs/FAMILY_CREATION.md §3's amendment of 2026-09-21).
  'child-play': 'Let them have the hour to themselves, which makes nothing and is the point of it.',
  'child-kindling': 'Send them round the yard for bark, chips and dead sticks for the fire, with no axe.',
  'child-birds': 'Set them at the edge of the field to drive the blackbirds off the standing crop.',
  'child-eggs': 'Send them round the hens’ nests, which brings a little food into the house once a day.',
  'child-water': 'Send them between the water and the house with a pail all morning.',
  'child-mind': 'Set them to watch the little ones, which takes the baby off a parent while it lasts.',
  'travel-gonzales': 'Go into the town of Gonzales and stay there until sent somewhere else.',
  'travel-home': 'Come back to the family’s own land.',
  visit: 'Choose a neighbour’s homestead and go there, to trade or to help raise their walls.',
  work: 'Do the everyday work about the homestead, which brings in a little food each day.',
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
  // stand-in: docs/ART_REQUESTS.md, request 2026-09-16 - the camp's icons. The camp's four (sim/camp.mjs) are drawn glyphs
  // (`drawGlyph`) until a sheet lands: Astra's `icon-camp-<key>` frames replace them by naming the sprite here.
  ['camp-drill', { glyph: 'drill' }], ['camp-forage', { glyph: 'forage' }], ['camp-guard', { glyph: 'guard' }], ['camp-scout', { glyph: 'scout' }],
  // The road's chores (sim/road.mjs, docs/ROAD_EAST.md): no frame yet. stand-in: docs/ART_REQUESTS.md, request 2026-09-16 -
  // the road's icons; each is a glyph drawn by `drawGlyph` until `icon-<key>` is registered, which `drawIcon` then prefers.
  ['hunt-road', { glyph: 'hunt-road' }], ['tend-sick', { glyph: 'tend-sick' }], ['trade-crossing', { glyph: 'trade-crossing' }],
  // Fetching logs from the timber (sim/chores.mjs, docs/BIOME_GAMEPLAY.md §3.2): no frame yet. stand-in: docs/ART_REQUESTS.md,
  // request 2026-09-19 - the logs fetched from the timber; a glyph drawn by `drawGlyph` until `icon-fetch-logs` is registered.
  ['fetch-logs', { glyph: 'fetch-logs' }],
  // The carreta made at home (sim/carreta.mjs, owner 2026-09-25): no frame yet. stand-in: docs/ART_REQUESTS.md, request 2026-09-25 -
  // the carreta; a glyph drawn by `drawGlyph` (two solid wheels under a plank bed) until `icon-make-carreta` is registered.
  ['make-carreta', { glyph: 'carreta' }],
  // The old walk to the shops, for a class saved in the middle of it: the same picture as going to town to trade.
  ['visit-shop-street', { sprite: 'icon-visit-shop' }],
  // What a family ate between deer (sim/gathering.mjs, docs/BIOMES.md §17.3): no frames yet. stand-in: docs/ART_REQUESTS.md,
  // request 2026-09-20 - the gathering icons; each is a glyph drawn by `drawGlyph` until `icon-<key>` is registered.
  ['take-small-game', { glyph: 'small-game' }], ['fish-the-water', { glyph: 'fish' }], ['fish-road', { glyph: 'fish' }],
  ['gather-oysters', { glyph: 'oysters' }], ['cut-bee-tree', { glyph: 'bee-tree' }],
  // The family's own stock (sim/stock.mjs, docs/STOCK.md): no frames yet. stand-in: docs/ART_REQUESTS.md, request
  // 2026-09-20 - the stock icons; glyphs drawn by `drawGlyph` until `icon-<key>` is registered.
  ['butcher-beef', { glyph: 'beef' }], ['butcher-hog', { glyph: 'hog' }], ['look-to-stock', { glyph: 'range' }],
  // What the family's children do (sim/children.mjs, docs/FAMILY_CREATION.md §3's amendment of 2026-09-21).
  ['child-play', { sprite: 'icon-child-play' }], ['child-kindling', { sprite: 'icon-child-kindling' }],
  ['child-birds', { sprite: 'icon-child-birds' }], ['child-eggs', { sprite: 'icon-child-eggs' }],
  ['child-water', { sprite: 'icon-child-water' }], ['child-mind', { sprite: 'icon-child-mind' }],
]));
/** The camp's work, the chores a man serving with Houston's army is offered (sim/camp.mjs); the only work a serving row shows. */
export const CAMP_CHORES = Object.freeze(['camp-drill', 'camp-forage', 'camp-guard', 'camp-scout']);

/** Chores sent with a place the student taps on the map: their icon starts choosing the place (sim/survey.mjs). */
export const ON_MAP = Object.freeze(['survey-plot', 'clear-plot', 'fence-plot', 'hunt-land', 'fell-trees']);
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
  if (entity.chore?.id) return entity.chore.id;
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
const whyOf = (entry, offered) => (entry.id === 'hunt-land' && !entry.can && !entry.why
  ? offered.find(other => other.id === 'hunt-timber')?.why
  : entry.why);

/**
 * Every icon on one person's row, in order: their work, then the main person's orders, then calling off the work.
 *
 * `offered` is `world.work[id]` as the server sent it; `catalogue` the chore catalogue by id (names, descriptions, costs);
 * `main` whether this is the family's main person (`world.household.mainId`), the one the server lets travel, work about the
 * place and rest; `carry` what this person could carry the way they are set to travel (`world.travelModes`), for a haul's
 * note. `settable` is whether orders may be given at all (running, or the lobby). Each icon says what it sends; nothing is
 * sent from here.
 */
export function panelActions({ entity, offered = [], catalogue = new Map(), main = false, homeId = null, homesteads = [], atHome = false,
  settable = true, carry = null } = {}) {
  if (!entity || ['dead', 'captured'].includes(entity.health?.condition)) return [];
  // Somebody with the army, the garrison or the expedition (sim/winter.mjs) has one order and no other: sending for them -
  // except a man with Houston's army, whose row has the camp's work first (sim/camp.mjs), as the server offers it.
  if (entity.service?.status === 'serving') {
    const shut = entity.service.besieged ? `${entity.name || 'They'} is shut in the Alamo.` : entity.service.riding ? `${entity.name || 'They'} has ridden for the Alamo.` : '';
    const camp = offered.filter(entry => CAMP_CHORES.includes(entry.id)).map(entry => {
      const spec = catalogue.get?.(entry.id) || {};
      return { key: entry.id, kind: 'chore', name: spec.name || entry.id, summary: PANEL_SUMMARIES[entry.id] || firstSentence(spec.describe),
        note: entry.cost ? `Costs ${entry.cost}.` : '', can: Boolean(settable && entry.can), why: entry.can ? '' : entry.why || '', onMap: false, active: entity.chore?.id === entry.id };
    });
    return [...camp, { key: 'winter-recall', kind: 'order', name: ORDER_NAMES['winter-recall'], summary: PANEL_SUMMARIES['winter-recall'],
      note: entity.service.kind === 'regular' ? 'A regular who leaves has deserted, and loses glory.' : entity.service.acres ? 'The promise of land is lost.' : '',
      why: shut, can: settable && !entity.travel && !shut, active: false },
    ...(entity.chore ? [{ key: 'stop-chore', kind: 'order', name: ORDER_NAMES['stop-chore'], summary: PANEL_SUMMARIES['stop-chore'], note: '', why: '', can: settable, active: false }] : [])];
  }
  const active = activeKey(entity, { homeId, main, homesteads });
  const icons = [];
  for (const entry of offered) {
    const spec = catalogue.get?.(entry.id) || {};
    const why = whyOf(entry, offered);
    if (!entry.can && NOT_A_CHOICE.test(why || '') && active !== entry.id) continue;
    // What it costs and what it brings, from the server's numbers; putting them side by side is formatting.
    const haul = entry.haul && Number.isFinite(carry)
      ? `Brings home ${Math.min(entry.haul.got, carry)} ${entry.haul.resource}${entry.haul.got > carry ? ` of ${entry.haul.got}; the rest is left behind.` : '.'}`
      // With no way chosen yet - it is asked when they are sent (public/going.js, owner 2026-09-24) - what a good trip gives;
      // the chooser says what each way brings home of it.
      : entry.haul ? `A good trip gives about ${entry.haul.got} ${entry.haul.resource}; what comes home depends on how they go.` : '';
    const crop = entry.crop
      ? entry.crop.share < 1
        ? `About ${Math.round(entry.crop.grown * entry.crop.share)} food of ${Math.round(entry.crop.grown)} standing; the rest has gone to stock in an unfenced field.`
        : `About ${Math.round(entry.crop.grown)} food standing.`
      : '';
    icons.push({
      key: entry.id, kind: 'chore', name: spec.name || entry.id,
      summary: PANEL_SUMMARIES[entry.id] || firstSentence(spec.describe),
      note: [entry.cost ? `Costs ${entry.cost}.` : '', haul, crop].filter(Boolean).join(' '),
      can: Boolean(settable && entry.can), why: entry.can ? '' : why || '',
      onMap: ON_MAP.includes(entry.id), active: active === entry.id,
    });
  }
  // Somebody doing a chore the server no longer lists (it happens: a field planted is a field not to plant) is still shown
  // doing it, so nobody is ever busy at something the row cannot show.
  if (active && entity.chore?.id === active && !icons.some(icon => icon.key === active)) {
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

/** Which card section answers each need, in the order a need is shown when a person has more than one. */
export const NEED_KINDS = Object.freeze(['rider', 'flight', 'army', 'camp', 'courier', 'call', 'asking', 'offer']);

/**
 * What this person is waiting on the student for, most pressing first: a rider standing with them (who will not wait for
 * ever), a question from the army they are with, a call to answer, work that has stopped to ask, an offer made to them.
 * Every one is a thing the server has already sent this family and will take an answer to; the words say who and what,
 * and never what an answer risks (docs/COLONIES.md §7a).
 */
export function needsOf(world, entityId) {
  const entity = (world?.entities || []).find(one => one.id === entityId);
  if (gone(entity) || world.role === 'host') return [];
  const name = entity.name || 'Somebody';
  const needs = [];
  const meeting = meetingFor(world, entity);
  if (meeting) needs.push({ kind: 'rider', text: `${meeting.carrierName || 'A rider'} has stopped to speak with ${name}.` });
  // Told to leave (sim/scrape.mjs): the family's decision, on its main person's row.
  if (world.flight?.status === 'ordered' && entityId === (world.household?.mainId || world.household?.principalId)) needs.push({ kind: 'flight', text: 'The family has been told to leave for the east.' });
  // The road's question (sim/road.mjs): the bogged wagon, the army close behind - the family's, on its main person's row.
  if (world.flight?.ask && entityId === (world.household?.mainId || world.household?.principalId)) needs.push({ kind: 'road', text: world.flight.ask.text || 'The road is asking the family something.' });
  const ours = world.army?.ours?.find(one => one.id === entityId);
  if (ours && (ours.detachment === 'open' || (ours.questions || []).some(question => question.answer === 'open'))) {
    needs.push({ kind: 'army', text: `The army is asking ${name} something.` });
  }
  // With Houston's army, asked whether they leave for the family, or which road at the fork (sim/camp.mjs).
  if (entity.service?.leave === 'open') needs.push({ kind: 'camp', text: `The army is asking whether ${name} goes home to the family.` });
  else if (entity.service?.road === 'open') needs.push({ kind: 'camp', text: `The army is asking ${name} which road it takes.` });
  // Inside the Alamo, asked whether they will carry Travis's letters out (sim/alamo.mjs).
  if (entity.service?.courier === 'open') needs.push({ kind: 'courier', text: `Travis is asking whether ${name} will ride out with his letters.` });
  if (requestFor(world, entity)?.options?.length) needs.push({ kind: 'call', text: `${name} can answer what the family is being asked.` });
  if (entity.chore?.ask) needs.push({ kind: 'asking', text: `${name}’s work has stopped to ask something.` });
  for (const offer of world.offers || []) {
    if (offer.direction === 'received' && offer.ourEntityId === entityId) { needs.push({ kind: 'offer', text: `${offer.theirName || 'A neighbour'} has offered ${name} a trade.` }); break; }
  }
  return needs;
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
  return words.join(', ');
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
    ? `${entity.name} decides for themself: the last order given them is repeated, and what they are asked is answered. Press to take the choices back.`
    : `Let ${entity.name} decide for themself: repeat the last order given them, and answer what they are asked.`;
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
    const age = Number.isFinite(person.age ?? entity.age) ? (person.age ?? entity.age) === 0 ? 'under a year' : String(person.age ?? entity.age) : '';
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

// ---------------------------------------------------------------------------------------------------- drawing, in a page

/** Draw an icon's picture into its canvas: a library sprite fitted to the square, or a drawn glyph. */
export function drawIcon(canvas, key, { drawSprite, spriteFrame }) {
  const ctx = canvas.getContext('2d'), size = canvas.width;
  ctx.clearRect(0, 0, size, size);
  const icon = PANEL_ICONS[key];
  // An icon with a glyph and no sprite still takes the `icon-<key>` frame the moment one is registered (the road's icons).
  const sprite = icon?.sprite || (icon?.glyph && spriteFrame(`icon-${key}`) ? `icon-${key}` : null);
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
  } else {
    ctx.beginPath(); ctx.arc(24, 24, 6, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

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
