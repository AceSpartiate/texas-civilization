// The errand to town, on the screen (owner, 2026-09-24; docs/TOWNS.md §4b): "When sending someone to town to stores, there
// should be a popup first asking what they should buy or sell."
//
// **The page decides nothing here.** What the family's town deals in, every price, the family's stock, whether a list can be
// sent, the load and how the person goes are the server's (`GET /api/errand`, sim/errands.mjs), fetched when the popup opens
// and again whenever the list changes or the family's stock or beasts do. The page only keeps the counts the student has set
// and draws the server's sentences; the one order it sends is refused by the same reckoning the popup read.
//
// Kept apart from public/app.js, which hands it what it needs (`mountErrand`), so the list rules below are tested headlessly
// (tests/errand-page.test.mjs) and the popup is proved in a browser (scripts/errand-browser-proof.mjs).
import { drawWays } from './going.js';

/** The list the server is sent, in the order the lines are drawn: every line with a count, and how it is paid. */
export function errandList(lines, counts, pays) {
  return (lines || []).filter(line => (counts.get(line.id) || 0) > 0).map(line => ({
    id: line.id, n: counts.get(line.id),
    ...(line.pays?.length && { pay: line.pays.includes(pays.get(line.id)) ? pays.get(line.id) : line.pays[0] }),
  }));
}

/** The family's stock, in the words of the house. */
export function stockWords(stock = {}) {
  const parts = [`${Math.floor((stock.food ?? 0) * 10) / 10} food`, `${stock.seed ?? 0} seed`, `${stock.powder ?? 0} powder`, `${stock.money ?? 0} ${stock.money === 1 ? 'real' : 'reales'}`];
  if (stock.cotton) parts.push(`${Math.floor(stock.cotton * 10) / 10} cotton`);
  if (stock.hides) parts.push(`${stock.hides} ${stock.hides === 1 ? 'hide' : 'hides'}`);
  return `The family has ${parts.join(' · ')}.`;
}

/** The lines grouped by shop, in the server's order: [{ shop, keeper, lines }]. */
export function byShop(lines = []) {
  const shops = [];
  for (const line of lines) {
    let shop = shops.find(one => one.trade === line.trade);
    if (!shop) shops.push(shop = { trade: line.trade, shop: line.shop, keeper: line.keeper, lines: [] });
    shop.lines.push(line);
  }
  return shops;
}

/**
 * The shape of the list: which shops, which lines in them and which buttons each line has. The lines' elements are built
 * again only when this changes; everything else about a line - its price or refusal, its count, which way of paying is
 * pressed, what may be pressed - is written into the elements already there.
 */
export function listShape(lines = []) {
  return JSON.stringify(byShop(lines).map(shop => [shop.trade, shop.shop, shop.keeper, shop.lines.map(line => [line.id, Boolean(line.does), line.pays?.length > 1 ? line.pays : []])]));
}

/**
 * What of the family's stock the popup shows, as the popup shows it (`stockWords`): the goods alone, food to the tenth. The
 * popup asks the server again when this changes, not when anything else in the house does - the eating that moves the food
 * by a crumb every tick asked it every tick before (2026-09-28).
 */
export function stockKey(resources = {}) {
  return JSON.stringify(['food', 'seed', 'powder', 'money', 'cotton', 'hides'].map(good => (good === 'food' ? Math.floor((resources?.food ?? 0) * 10) / 10 : resources?.[good] ?? 0)));
}

/**
 * The popup itself. `deps`: `$`, `element`, `api` (GET), `say`, `send(input)` (public/app.js's, which gives the order its id
 * the way every command's is made) and `onSent(entityId)`. Returns `{ open(entityId, { line }), render(world), close() }`; `line`, a line the list opens with on it.
 */
export function mountErrand({ $, element, api, say, send: sendCommand, onSent = () => {} }) {
  const root = $('#errand');
  if (!root) return { open() {}, render() {}, close() {} };
  let state = null;

  function close() {
    state = null;
    root.hidden = true;
    delete document.body.dataset.errand;
  }
  async function fetchFacts(list = null) {
    if (!state) return;
    const seq = ++state.seq;
    const mode = state.mode;
    const query = `/api/errand?entityId=${encodeURIComponent(state.entityId)}${list?.length ? `&list=${encodeURIComponent(JSON.stringify(list))}` : ''}${list?.length && mode ? `&mode=${encodeURIComponent(mode)}` : ''}`;
    try {
      const { errand } = await api(query);
      if (!state || seq !== state.seq) return;
      state.facts = errand;
      state.quote = errand.quote || null;
      // Opened from a goal's way on (docs/FAMILY_PANEL.md §23, owner 2026-09-30): the line it wants is put on the list once, as a
      // press of its + would, and the list quoted - the tanner's rawhide for a carreta, the store's seed for the field.
      const wanted = state.wanted && errand.lines?.find(one => one.id === state.wanted && !one.why);
      if (state.wanted && !list?.length) {
        state.wanted = null;
        if (wanted) { state.counts.set(wanted.id, 1); state.highlight = wanted.id; draw(); fetchFacts(currentList()); return; }
      }
      // A quote is only good for the list it was asked about: Send waits for the answer to the list on the screen.
      state.quotedKey = list?.length ? JSON.stringify([list, mode]) : null;
      state.error = '';
    } catch (error) {
      if (!state || seq !== state.seq) return;
      state.error = error.message;
    }
    draw();
  }
  let timer = null;
  function requote() {
    clearTimeout(timer);
    timer = setTimeout(() => fetchFacts(currentList()), 120);
  }
  const currentList = () => errandList(state?.facts?.lines, state?.counts || new Map(), state?.pays || new Map());

  function draw() {
    if (!state) return;
    const facts = state.facts;
    root.hidden = false;
    document.body.dataset.errand = 'true';
    const name = facts?.person?.name || 'They';
    $('#errand-title').textContent = facts ? `${name} to ${facts.town.name}` : 'To town';
    $('#errand-text').textContent = facts ? `What should ${name} buy or sell in ${facts.town.name}? Choose before they go; they do it at the shops and bring it home.` : 'Asking the town what it has…';
    const list = currentList();
    const fresh = list.length > 0 && JSON.stringify([list, state.mode]) === state.quotedKey;
    const quote = fresh ? state.quote : null;
    // And its tools, counted (owner, 2026-09-24: a family may own more than one of each; the server's words).
    // And its animals (owner, 2026-09-24: a family may own more than one horse or ox, and buy stock at the pens; the server's words).
    $('#errand-stock').textContent = facts ? `${stockWords(quote?.stock || facts.stock)}${facts.tools?.length ? ` Tools: ${facts.tools.join(' · ')}.` : ''}${facts.animals?.length ? ` Animals: ${facts.animals.join(' · ')}.` : ''}` : '';
    const after = quote?.can ? quote.after : null;
    $('#errand-after').textContent = after ? `${stockWords(after).replace('The family has', 'After it, the family will have')}` : '';
    drawLines(facts?.lines);
    $('#errand-how').textContent = !list.length ? 'Nothing is on the list yet.' : !quote ? 'Reckoning the load…' : quote.can ? quote.how : '';
    drawWaysHere(quote, list);
    const why = state.error || facts?.shut || (quote && !quote.can ? quote.why : '');
    $('#errand-why').textContent = why || '';
    const send = $('#errand-send');
    send.disabled = Boolean(state.busy) || !quote?.can || Boolean(facts?.shut);
    send.textContent = state.busy ? 'Sending…' : `Send ${name}`;
    // What a proof reads: the server's sentences as drawn, and the list as the page would send it.
    window.__errand = { entityId: state.entityId, list, mode: state.mode, ways: quote?.ways || null, quickest: quote?.quickest || null, how: $('#errand-how').textContent, why, can: !send.disabled, lines: (facts?.lines || []).map(line => ({ id: line.id, why: line.why || null, count: state.counts.get(line.id) || 0 })) };
  }

  /**
   * The lines, drawn **in place** (2026-09-28): the shops, lines and buttons are built once for a shape of list
   * (`listShape`), and every later draw - each quote, each change of the family's stock - only rewrites their words, counts
   * and switches. A student pressing + or − never has the button replaced under the press; before, the whole list was
   * rebuilt on every draw, which the family's eating made about every tick, and a press could land on a detached button.
   */
  function drawLines(lines = []) {
    const host = $('#errand-lines');
    const shape = listShape(lines);
    if (host.dataset.shape !== shape) {
      const focused = document.activeElement?.closest?.('#errand-lines') ? { id: document.activeElement.closest('[data-line]')?.dataset.line, act: document.activeElement.dataset.act } : null;
      host.dataset.shape = shape;
      host.replaceChildren(...byShop(lines).map(shop => {
        const section = element('section', '', 'errand-shop');
        section.append(element('h3', shop.keeper ? `${shop.shop} · ${shop.keeper}` : shop.shop, 'errand-shop-name'));
        const list = element('ul', '', 'errand-shop-lines');
        for (const line of shop.lines) {
          const item = element('li', '', 'errand-line');
          item.dataset.line = line.id;
          const words = element('div', '', 'errand-words');
          words.append(element('span', '', 'errand-label'), element('span', '', 'errand-price'));
          // What it does, on a tap as well as a hover (docs/audits/2026-09-28-design.md S6: a Chromebook touch screen has no
          // hover, and sim/shops.mjs says each line's `does` "before the choice"): the words are a button that opens the line.
          if (line.does) {
            words.dataset.act = 'does';
            words.setAttribute('role', 'button');
            words.tabIndex = 0;
            words.append(element('span', '', 'errand-does'));
          }
          const controls = element('div', '', 'errand-controls');
          if (line.pays?.length > 1) {
            for (const way of line.pays) {
              const button = element('button', way === 'coin' ? 'Coin' : 'Food', 'errand-pay');
              button.type = 'button'; button.dataset.act = `pay-${way}`;
              controls.append(button);
            }
          }
          const less = element('button', '−', 'errand-step'), more = element('button', '+', 'errand-step');
          less.type = more.type = 'button';
          less.dataset.act = 'less'; more.dataset.act = 'more';
          controls.append(less, element('span', '', 'errand-count'), more);
          item.append(words, controls);
          list.append(item);
        }
        section.append(list);
        return section;
      }));
      if (focused?.id) host.querySelector(`[data-line="${CSS.escape(focused.id)}"] [data-act="${focused.act}"]`)?.focus({ preventScroll: true });
    }
    // Only what differs is written, so a line nothing has changed is not touched at all.
    const put = (node, key, value) => { if (node && node[key] !== value) node[key] = value; };
    const attr = (node, key, value) => { if (node && node.getAttribute(key) !== value) node.setAttribute(key, value); };
    for (const line of lines) {
      const item = host.querySelector(`[data-line="${CSS.escape(line.id)}"]`);
      if (!item) continue;
      const count = state.counts.get(line.id) || 0;
      if (item.dataset.count !== String(count)) item.dataset.count = String(count);
      if (line.why) { if (item.dataset.shut !== 'true') item.dataset.shut = 'true'; } else if ('shut' in item.dataset) delete item.dataset.shut;
      // The line a goal asked for (`wanted`), lit and in view once.
      // Scrolled after the frame is laid out: the list's own box is not yet its size when the lines are first built.
      if (state.highlight === line.id && item.dataset.wanted !== 'true') { item.dataset.wanted = 'true'; requestAnimationFrame(() => item.scrollIntoView?.({ block: 'center' })); }
      const words = item.querySelector('.errand-words');
      put(words.querySelector('.errand-label'), 'textContent', line.label);
      put(words.querySelector('.errand-price'), 'textContent', line.why || line.price);
      put(words, 'title', line.does || '');
      if (line.does) {
        const open = state.open.has(line.id), does = words.querySelector('.errand-does');
        attr(words, 'aria-expanded', String(open));
        put(does, 'textContent', line.does);
        put(does, 'hidden', !open);
      }
      const pay = state.pays.get(line.id) || line.pays?.[0];
      for (const button of item.querySelectorAll('.errand-pay')) {
        const way = button.dataset.act.slice(4);
        attr(button, 'aria-pressed', String(pay === way));
        attr(button, 'aria-label', `${line.label}: pay in ${way}`);
        put(button, 'disabled', Boolean(line.why));
      }
      const less = item.querySelector('[data-act="less"]'), more = item.querySelector('[data-act="more"]'), shown = item.querySelector('.errand-count');
      attr(less, 'aria-label', `One fewer: ${line.label}`); attr(more, 'aria-label', `One more: ${line.label}`);
      put(less, 'disabled', count <= 0);
      put(more, 'disabled', Boolean(line.why) || count >= line.most);
      put(shown, 'textContent', String(count));
      attr(shown, 'aria-label', `${count} of ${line.label}`);
    }
  }

  /**
   * How they go (owner, 2026-09-24): the server's ways, quickest first, the quickest that carries the load marked and chosen
   * unless the student chose another; a way that cannot go is shut and says why, in the server's words. The one component
   * every journey's chooser draws (public/going.js `drawWays`; owner, 2026-09-24: "the game should ask how they'll travel").
   */
  function drawWaysHere(quote, list) {
    const host = $('#errand-ways');
    if (!host) return;
    const ways = quote?.ways;
    host.hidden = !list.length || !ways;
    if (host.hidden) { host.replaceChildren(); return; }
    drawWays(host, { ways, quickest: quote.quickest || null, chosen: state.mode || quote.quickest || null }, element);
  }

  function toggleDoes(id) {
    if (!state || !id) return;
    if (state.open.has(id)) state.open.delete(id); else state.open.add(id);
    draw();
    root.querySelector(`[data-line="${CSS.escape(id)}"] [data-act="does"]`)?.focus({ preventScroll: true });
  }

  async function send() {
    if (!state || state.busy || $('#errand-send').disabled) return;
    const list = currentList();
    state.busy = true; draw();
    try {
      await sendCommand({ action: 'chore', chore: 'visit-shop', entityId: state.entityId, errand: list, ...(state.mode && { mode: state.mode }) });
      const sent = state.entityId;
      close();
      onSent(sent);
    } catch (error) {
      if (!state) return;
      state.busy = false; state.error = error.message;
      say(error.message);
      draw();
    }
  }

  root.addEventListener('click', event => {
    if (!state) return;
    if (event.target.closest('#errand-close, #errand-cancel')) { close(); return; }
    if (event.target.closest('#errand-send')) { send(); return; }
    // A way of going chosen: the quickest again is no choice at all, and the server says whether the one chosen can go.
    const way = event.target.closest('[data-way]');
    if (way && !way.disabled) {
      state.mode = way.dataset.way === state.quote?.quickest ? null : way.dataset.way;
      state.quotedKey = undefined;
      draw();
      requote();
      return;
    }
    const button = event.target.closest('[data-act]'), row = event.target.closest('[data-line]');
    if (!button || !row || button.disabled) return;
    // Opening what a line does changes no list: nothing is asked of the server again.
    if (button.dataset.act === 'does') { toggleDoes(row.dataset.line); return; }
    const id = row.dataset.line, line = state.facts?.lines.find(one => one.id === id);
    if (!line) return;
    const act = button.dataset.act;
    const count = state.counts.get(id) || 0;
    if (act === 'more') state.counts.set(id, Math.min(line.most, count + 1));
    else if (act === 'less') state.counts.set(id, Math.max(0, count - 1));
    else if (act.startsWith('pay-')) state.pays.set(id, act.slice(4));
    if (!state.counts.get(id)) state.counts.delete(id);
    state.error = '';
    state.quotedKey = undefined;
    draw();
    requote();
  });
  // Escape sends nobody; Enter sends the list, from anywhere in the popup but its own close and cancel.
  root.addEventListener('keydown', event => {
    if (!state) return;
    if (event.key === 'Escape') { event.preventDefault(); close(); return; }
    // Enter or Space on a line's words opens what it does, as a click does; it never sends the list from there.
    if ((event.key === 'Enter' || event.key === ' ') && event.target.dataset?.act === 'does') {
      event.preventDefault();
      toggleDoes(event.target.closest('[data-line]')?.dataset.line);
      return;
    }
    if (event.key === 'Enter' && !event.target.closest('#errand-close, #errand-cancel')) { event.preventDefault(); send(); }
  });

  return {
    open(entityId, { line = null } = {}) {
      state = { entityId, facts: null, quote: null, counts: new Map(), pays: new Map(), open: new Set(), mode: null, seq: 0, busy: false, error: '', key: null, quotedKey: null, wanted: line, highlight: null };
      draw();
      fetchFacts();
      root.querySelector('#errand-cancel')?.focus({ preventScroll: true });
    },
    /**
     * On every snapshot: when the family's stock as the popup shows it (`stockKey`) or this person's ways of going change,
     * ask the server again - not on every crumb of food eaten.
     */
    render(current) {
      if (!state || !current) return;
      if (current.role === 'host') { close(); return; }
      const key = JSON.stringify([stockKey(current.household?.resources), current.travelModes?.[state.entityId], Boolean(current.entities?.find(one => one.id === state.entityId)?.chore)]);
      if (state.key === key) return;
      const first = state.key === null;
      state.key = key;
      if (!first) fetchFacts(currentList());
    },
    close,
  };
}
