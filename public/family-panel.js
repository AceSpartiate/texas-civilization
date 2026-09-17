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
  'sell-cotton': 'Carry the cotton to the store in town and trade it for food or coin.',
  'fetch-powder': 'Go to the store in town and buy powder and lead.',
  'fetch-seed': 'Go to the store in town and buy seed.',
  'sell-food': 'Carry spare food to the store in town and sell it for coin.',
  'mend-hoe': 'Set the worn hoe right again at home.',
  'replace-hoe': 'Go to the smith in town and buy a sound hoe for coin.',
  'visit-shop': 'Go into town and trade at one of its shops: the smith, the gunsmith, the doctor, the tavern and more.',
  'make-furniture': 'Fetch a small tree from the timber and make a piece of furniture for the house.',
  'buy-furniture': 'Go to the carpenter in town and buy a piece of furniture for coin or food.',
  'fell-trees': 'Fell the trees at a place in timber you choose on the family’s land.',
  'haul-logs': 'Bring the felled logs lying out to the house.',
  'enlist-regular': 'Go to San Felipe and enlist in the regular army for $24 and 800 acres of land, promised.',
  'enlist-auxiliary': 'Go to San Felipe and sign on as an auxiliary volunteer, for 640 acres or 320, promised.',
  'join-garrison': 'Go to Béxar and join the men holding the town and the Alamo.',
  'join-matamoros': 'Go south to Refugio and join the volunteers bound for Matamoros.',
  'go-vote': 'Go into town and vote for the delegates to the convention.',
  'join-relief': 'Ride to Gonzales to go in to the Alamo with the men gathering there.',
  'join-houston': 'Go to the camp of General Houston\'s army and stay with it.',
  'winter-recall': 'Send for them to leave where they serve and come home.',
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
  'survey-plot', 'cut-lane', 'dig-well', 'plant-field', 'harvest-field', 'clear-plot', 'fence-plot', 'build-house', 'help-raise',
  'hunt-timber', 'hunt-land', 'practise-shooting', 'sell-cotton', 'fetch-powder', 'fetch-seed', 'sell-food', 'mend-hoe', 'replace-hoe',
  'visit-shop', 'make-furniture', 'buy-furniture', 'fell-trees', 'haul-logs',
  'enlist-regular', 'enlist-auxiliary', 'join-garrison', 'join-matamoros', 'go-vote', 'join-relief', 'join-houston', 'winter-recall',
  'travel-gonzales', 'travel-home', 'visit', 'work', 'rest', 'stop-chore',
].map(key => [key, { sprite: `icon-${key}` }])));

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
  // Somebody with the army, the garrison or the expedition (sim/winter.mjs) has one order and no other: sending for them.
  if (entity.service?.status === 'serving') {
    const shut = entity.service.besieged ? `${entity.name || 'They'} is shut in the Alamo.` : entity.service.riding ? `${entity.name || 'They'} has ridden for the Alamo.` : '';
    return [{ key: 'winter-recall', kind: 'order', name: ORDER_NAMES['winter-recall'], summary: PANEL_SUMMARIES['winter-recall'],
      note: entity.service.kind === 'regular' ? 'A regular who leaves has deserted, and loses glory.' : entity.service.acres ? 'The promise of land is lost.' : '',
      why: shut, can: settable && !entity.travel && !shut, active: false }];
  }
  const active = activeKey(entity, { homeId, main, homesteads });
  // A refusal the land hunt shares with the timber hunt is sent once, on the timber hunt (sim/chores.mjs `choresFor`).
  const sharedWhy = entry => entry.id === 'hunt-land' && !entry.can && !entry.why ? offered.find(other => other.id === 'hunt-timber')?.why : entry.why;
  const icons = [];
  for (const entry of offered) {
    const spec = catalogue.get?.(entry.id) || {};
    const why = sharedWhy(entry);
    if (!entry.can && NOT_A_CHOICE.test(why || '') && active !== entry.id) continue;
    // What it costs and what it brings, from the server's numbers; putting them side by side is formatting.
    const haul = entry.haul && Number.isFinite(carry)
      ? `Brings home ${Math.min(entry.haul.got, carry)} ${entry.haul.resource}${entry.haul.got > carry ? ` of ${entry.haul.got}; the rest is left behind.` : '.'}`
      : '';
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
 * When every icon on a row is refused for one and the same reason and nothing is going on - a child under ten, somebody on
 * the road in - the row says the reason once instead of a line of dimmed pictures. Null when the icons should be shown. A
 * row busy with a chore always has its open call-off icon, so what they are doing is never collapsed away.
 */
export function rowReason(icons) {
  if (!icons.length || icons.some(icon => icon.can)) return null;
  const reasons = new Set(icons.map(icon => icon.why));
  return reasons.size === 1 && [...reasons][0] ? [...reasons][0] : null;
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

/** Which card section answers each need, in the order a need is shown when a person has more than one. */
export const NEED_KINDS = Object.freeze(['rider', 'flight', 'army', 'courier', 'call', 'asking', 'offer']);

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
  const ours = world.army?.ours?.find(one => one.id === entityId);
  if (ours && (ours.detachment === 'open' || (ours.questions || []).some(question => question.answer === 'open'))) {
    needs.push({ kind: 'army', text: `The army is asking ${name} something.` });
  }
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
 * Whether a row shows its person idle: alive, not at work, not on a road, not with the army, and able to be set to
 * something now. A child under ten, or somebody every order is refused to, is not "idle" - there is nothing to give them -
 * and a principal told to work about the place is working.
 */
export function isIdle(entity, icons = [], { withArmy = false } = {}) {
  // `task` is the server's: working about the place and helping where a call sent them are work; only resting is idle.
  if (gone(entity) || withArmy || entity.service?.status === 'serving' || entity.chore || entity.travel || (entity.task && entity.task !== 'rest')) return false;
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
  const frame = icon?.sprite && spriteFrame(icon.sprite);
  if (frame) {
    const fit = Math.min(size * .86 / frame.w, size * .86 / frame.h);
    const x = (size - frame.w * fit) / 2 + frame.w * fit * frame.anchorX, y = (size - frame.h * fit) / 2 + frame.h * fit * frame.anchorY;
    if (drawSprite(ctx, icon.sprite, x, y, fit * (frame.logicalHeight || frame.h))) return true;
  }
  drawGlyph(ctx, icon?.glyph || 'dot', size);
  return !icon?.sprite;
}

/** The one glyph left: a dot, drawn while an icon's sheet has not arrived (or never does; the library is optional). */
function drawGlyph(ctx, glyph, size) {
  const s = size / 48;
  ctx.save();
  ctx.scale(s, s);
  ctx.fillStyle = '#8a6a3d';
  ctx.beginPath(); ctx.arc(24, 24, 6, 0, Math.PI * 2); ctx.fill();
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
 * by `castVariant` and `childFigure` in public/motion.js), fitted to the square on the page's flat ground.
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
