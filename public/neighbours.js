// The family's neighbours, and help offered back between families: the owner's answer of 2026-09-28 ("Yes: they remember and
// repay"), and the design audit's S7 (trading and neighbours' raisings were nearly impossible to find).
//
// Everything here is the server's (sim/neighbourly.mjs `neighbourlyView`): who the neighbours are - near, or known by something
// done between the families - whose walls are going up, what lies between them, the offers waiting on the family, and room kept
// in a neighbour's wagon. The page decides nothing: it draws the list, sends the family's answer to an offer, sends somebody to a
// neighbour's land, and puts them to the raising when the server says they may.

const make = (tag, text, className) => {
  const node = document.createElement(tag);
  if (text !== undefined && text !== null) node.textContent = text;
  if (className) node.className = className;
  return node;
};
const $ = selector => document.querySelector(selector);
const GONE = ['dead', 'captured'];

/** Who of the family answers and goes: the main person when they can, else the first grown person who can. */
export function actorFor(world) {
  const own = (world?.entities || []).filter(entity => entity.kind === 'person' && entity.householdId === world.householdId
    && !GONE.includes(entity.health?.condition) && entity.service?.status !== 'serving' && !(Number.isFinite(entity.age) && entity.age < 10));
  const mainId = world?.household?.mainId || world?.household?.principalId;
  return own.find(person => person.id === mainId) || own[0] || null;
}
/** Somebody of the family standing on this neighbour's land whom the server would let help raise its walls. */
export function helperAt(world, siteId) {
  return (world?.entities || []).find(entity => entity.kind === 'person' && entity.householdId === world.householdId
    && entity.location?.siteId === siteId && !entity.travel
    && (world.work?.[entity.id] || []).some(work => work.id === 'help-raise' && work.can)) || null;
}

/**
 * Somebody of a neighbour's family standing on their land with one of ours, to offer a trade to (sim/trade.mjs: a trade is said
 * face to face). The server sends another family's person - among `others`, with a `condition` - only while they stand with one
 * of ours (sim/town.mjs `observedBy`), so this is null until then.
 */
export function tradePartnerAt(world, householdId, siteId) {
  const here = entity => entity.kind === 'person' && entity.location?.siteId === siteId && !entity.travel;
  if (!(world?.entities || []).some(entity => here(entity) && entity.householdId === world.householdId && !GONE.includes(entity.health?.condition))) return null;
  return (world.others || []).find(entity => here(entity) && entity.householdId === householdId && !entity.resident && !GONE.includes(entity.condition)) || null;
}
/**
 * Where a trade the student asked for on this sheet has got to (triage 2026-09-29, 2.6): the one sent is `going`, or has not set
 * out yet (`waiting`); is there with somebody of theirs, and the trade `open`s with them; is there and `nobody` of theirs is; or is
 * `lost` - sent somewhere else, gone, or taken. `seenGoing` is whether they have been seen on the road there, since the snapshot
 * after the order can still show them at home.
 */
export function tradeArrival(world, awaited) {
  const goer = (world?.entities || []).find(entity => entity.id === awaited.entityId);
  if (!goer || GONE.includes(goer.health?.condition)) return { state: 'lost' };
  if (goer.travel) return { state: goer.travel.to === awaited.siteId ? 'going' : 'lost' };
  if (goer.location?.siteId !== awaited.siteId) return { state: awaited.seenGoing ? 'lost' : 'waiting' };
  const partner = tradePartnerAt(world, awaited.householdId, awaited.siteId);
  return partner ? { state: 'open', partnerId: partner.id } : { state: 'nobody' };
}

let send = null;
let openTrade = null;
/** The trade asked for and not yet opened: who was sent, to which family's land. `ceiling:` kept by this page only, so a reload on the
 * way forgets it and the student opens the trade from the sheet once they are there; keep it on the server if a class meets that. */
let awaited = null;
let open = false;
let seenAsks = new Set();
let shownKey = '';

function setOpen(value) {
  open = value;
  const sheet = $('#neighbours'), toggle = $('#neighbours-toggle');
  if (!sheet || !toggle) return;
  sheet.dataset.open = String(open);
  toggle.setAttribute('aria-expanded', String(open));
}
async function order(input, note) {
  const said = $('#neighbours-note');
  if (said) said.textContent = '';
  try { await send(input); if (said && note) said.textContent = note; return true; }
  catch (error) { if (said) said.textContent = error.message; return false; }
}

/**
 * Open the list: the bar's *Go to a neighbour's homestead* comes here since the person card was taken off the map (owner,
 * 2026-09-29: "just gets in the way"); each neighbour's *Send … there* is the journey the card's *Go there* was.
 */
export function openNeighbours() { setOpen(true); }

/** Drawn on every snapshot; rebuilt only when what it shows has changed. */
export function renderNeighbours(world) {
  const toggle = $('#neighbours-toggle'), sheet = $('#neighbours');
  if (!toggle || !sheet) return;
  const shown = world?.role !== 'host' && world?.neighbourly;
  toggle.hidden = !shown;
  if (!shown) { if (open) setOpen(false); return; }
  const { asks = [], neighbours = [], lent = null } = world.neighbourly;
  $('#neighbours-unread').hidden = !asks.length;
  // A new offer opens the list once, so it is not missed under the map; closing it keeps it closed until the next.
  const fresh = asks.filter(ask => !seenAsks.has(ask.id));
  if (fresh.length) { for (const ask of fresh) seenAsks.add(ask.id); setOpen(true); }
  const actor = actorFor(world);
  const here = Object.fromEntries(neighbours.map(one => [one.householdId, helperAt(world, one.siteId)?.id || null]));
  const standing = Object.fromEntries(neighbours.map(one => [one.householdId, (world.entities || []).some(entity => entity.householdId === world.householdId && entity.location?.siteId === one.siteId && !entity.travel)]));
  const partners = Object.fromEntries(neighbours.map(one => [one.householdId, tradePartnerAt(world, one.householdId, one.siteId)?.id || null]));
  // A trade asked for: opened the moment the one sent stands with somebody of theirs (triage 2026-09-29, 2.6).
  if (awaited) {
    const now = tradeArrival(world, awaited);
    if (now.state === 'going') awaited.seenGoing = true;
    else if (now.state === 'open') { awaited = null; setOpen(false); openTrade?.(now.partnerId); }
    else if (now.state === 'nobody') { awaited = null; say('Nobody of that family is at home to trade with just now.'); }
    else if (now.state === 'lost') awaited = null;
  }
  const key = JSON.stringify([asks, neighbours, lent, actor?.id, here, standing, partners]);
  if (key === shownKey) return;
  shownKey = key;

  const askList = $('#neighbours-asks');
  askList.replaceChildren(...asks.map(ask => {
    const card = make('div', null, 'neighbour-ask');
    card.dataset.ask = ask.id; card.dataset.side = ask.side; card.dataset.kind = ask.kind;
    card.append(make('p', ask.text));
    const yes = make('button', ask.side === 'give' ? 'Offer it' : 'Accept'), no = make('button', ask.side === 'give' ? 'Not this time' : 'Say no');
    yes.type = no.type = 'button';
    yes.dataset.answer = 'yes'; no.dataset.answer = 'no';
    yes.disabled = no.disabled = !actor;
    card.append(yes, no);
    return card;
  }));
  const lentLine = $('#neighbours-lent');
  lentLine.hidden = !lent;
  lentLine.textContent = lent ? `${lent.family.charAt(0).toUpperCase()}${lent.family.slice(1)} are keeping room for ${lent.room} of your goods in their wagon on the road east. It is counted in your wagon's room until either family leaves.` : '';

  const list = $('#neighbours-list');
  list.replaceChildren(...neighbours.map(one => {
    const item = make('li', null, 'neighbour');
    item.dataset.household = one.householdId;
    const head = make('p', null, 'neighbour-head');
    head.append(make('strong', one.name), make('span', ` · ${one.miles} ${one.miles === 1 ? 'mile' : 'miles'}`));
    item.append(head);
    const tags = [one.raising && 'Raising their walls now', one.weOwe && 'They helped your family', one.theyOwe && 'Your family helped them'].filter(Boolean);
    if (tags.length) item.append(make('p', tags.join(' · '), 'neighbour-tags'));
    for (const line of one.between || []) item.append(make('p', line, 'neighbour-between'));
    const buttons = make('div', null, 'neighbour-buttons');
    if (here[one.householdId] && one.raising) {
      const help = make('button', 'Help raise the walls');
      help.type = 'button'; help.dataset.help = here[one.householdId]; help.dataset.site = one.siteId;
      buttons.append(help);
    } else if (!standing[one.householdId] && actor) {
      const go = make('button', `Send ${actor.given || actor.name} there`);
      go.type = 'button'; go.dataset.go = one.siteId; go.dataset.entity = actor.id;
      buttons.append(go);
    }
    // Offering them a trade (triage 2026-09-29, 2.6: trading between students was hard to find - it needed one of yours and one of
    // theirs at the same place, then a press on their person). Somebody of theirs standing with one of yours: the trade opens now.
    // Otherwise it sends the same person *Send … there* would, and the trade opens when they arrive.
    if (partners[one.householdId]) {
      const trade = make('button', 'Offer a trade');
      trade.type = 'button'; trade.dataset.tradeWith = partners[one.householdId];
      buttons.append(trade);
    } else if (!standing[one.householdId] && actor) {
      const trade = make('button', 'Offer a trade');
      trade.type = 'button'; trade.dataset.trade = one.siteId; trade.dataset.entity = actor.id; trade.dataset.tradeHousehold = one.householdId;
      trade.title = `Sends ${actor.given || actor.name} there; the trade opens when they arrive.`;
      buttons.append(trade);
    }
    if (buttons.childElementCount) item.append(buttons);
    return item;
  }));
  $('#neighbours-empty').hidden = neighbours.length > 0;
}

/** A line on the sheet, below its list: what an order did, or why it was refused. */
function say(words) { const said = $('#neighbours-note'); if (said) said.textContent = words; }

/**
 * Wired once: the toggle, the close, and every button the list draws. `command` sends one order to the server; `trade(entityId)`
 * opens the trade with another family's person, as a press on them does (public/app.js, the card's trade).
 */
export function bindNeighbours({ command, trade = null }) {
  send = command;
  openTrade = trade;
  $('#neighbours-toggle')?.addEventListener('click', () => setOpen(!open));
  $('#neighbours-close')?.addEventListener('click', () => setOpen(false));
  $('#neighbours')?.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button || button.disabled) return;
    const world = window.__snapshot?.world;
    const actor = actorFor(world);
    const ask = button.closest('[data-ask]');
    if (ask && button.dataset.answer && actor) {
      button.disabled = true;
      order({ action: 'neighbour-answer', entityId: actor.id, askId: ask.dataset.ask, answer: button.dataset.answer });
    } else if (button.dataset.tradeWith) {
      setOpen(false);
      openTrade?.(button.dataset.tradeWith);
    } else if (button.dataset.trade) {
      const goer = (world?.entities || []).find(entity => entity.id === button.dataset.entity);
      const asked = { entityId: button.dataset.entity, siteId: button.dataset.trade, householdId: button.dataset.tradeHousehold, seenGoing: false };
      awaited = asked;
      // Refused (the server's words are on the sheet): nothing is on the way, so nothing opens.
      order({ action: 'travel', entityId: asked.entityId, destination: asked.siteId }, `${goer?.given || goer?.name || 'They'} ${goer ? 'is' : 'are'} on the way. The trade opens when they get there.`)
        .then(sent => { if (!sent && awaited === asked) awaited = null; });
    } else if (button.dataset.go) {
      order({ action: 'travel', entityId: button.dataset.entity, destination: button.dataset.go }, 'On the way.');
    } else if (button.dataset.help) {
      order({ action: 'chore', entityId: button.dataset.help, chore: 'help-raise' }, 'Helping raise the walls.');
    }
  });
}
