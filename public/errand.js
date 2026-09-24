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
 * The popup itself. `deps`: `$`, `element`, `api` (GET), `say`, `send(input)` (public/app.js's, which gives the order its id
 * the way every command's is made) and `onSent(entityId)`. Returns `{ open(entityId), render(world), close() }`.
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
    const query = `/api/errand?entityId=${encodeURIComponent(state.entityId)}${list?.length ? `&list=${encodeURIComponent(JSON.stringify(list))}` : ''}`;
    try {
      const { errand } = await api(query);
      if (!state || seq !== state.seq) return;
      state.facts = errand;
      state.quote = errand.quote || null;
      // A quote is only good for the list it was asked about: Send waits for the answer to the list on the screen.
      state.quotedList = list?.length ? list : null;
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
    const fresh = list.length > 0 && JSON.stringify(list) === JSON.stringify(state.quotedList || null);
    const quote = fresh ? state.quote : null;
    $('#errand-stock').textContent = facts ? stockWords(quote?.stock || facts.stock) : '';
    const after = quote?.can ? quote.after : null;
    $('#errand-after').textContent = after ? `${stockWords(after).replace('The family has', 'After it, the family will have')}` : '';
    const host = $('#errand-lines');
    const focused = document.activeElement?.closest?.('#errand-lines') ? { id: document.activeElement.closest('[data-line]')?.dataset.line, act: document.activeElement.dataset.act } : null;
    host.replaceChildren(...byShop(facts?.lines).map(shop => {
      const section = element('section', '', 'errand-shop');
      section.append(element('h3', shop.keeper ? `${shop.shop} · ${shop.keeper}` : shop.shop, 'errand-shop-name'));
      const list = element('ul', '', 'errand-shop-lines');
      for (const line of shop.lines) {
        const count = state.counts.get(line.id) || 0;
        const item = element('li', '', 'errand-line');
        item.dataset.line = line.id;
        item.dataset.count = String(count);
        if (line.why) item.dataset.shut = 'true';
        const words = element('div', '', 'errand-words');
        words.append(element('span', line.label, 'errand-label'), element('span', line.why || line.price, 'errand-price'));
        words.title = line.does;
        const controls = element('div', '', 'errand-controls');
        if (line.pays?.length > 1) {
          const pay = state.pays.get(line.id) || line.pays[0];
          for (const way of line.pays) {
            const button = element('button', way === 'coin' ? 'Coin' : 'Food', 'errand-pay');
            button.type = 'button'; button.dataset.act = `pay-${way}`;
            button.setAttribute('aria-pressed', String(pay === way));
            button.setAttribute('aria-label', `${line.label}: pay in ${way}`);
            button.disabled = Boolean(line.why);
            controls.append(button);
          }
        }
        const less = element('button', '−', 'errand-step'), more = element('button', '+', 'errand-step');
        less.type = more.type = 'button';
        less.dataset.act = 'less'; more.dataset.act = 'more';
        less.setAttribute('aria-label', `One fewer: ${line.label}`); more.setAttribute('aria-label', `One more: ${line.label}`);
        less.disabled = count <= 0;
        more.disabled = Boolean(line.why) || count >= line.most;
        const shown = element('span', String(count), 'errand-count');
        shown.setAttribute('aria-label', `${count} of ${line.label}`);
        controls.append(less, shown, more);
        item.append(words, controls);
        list.append(item);
      }
      section.append(list);
      return section;
    }));
    if (focused?.id) host.querySelector(`[data-line="${CSS.escape(focused.id)}"] [data-act="${focused.act}"]`)?.focus({ preventScroll: true });
    $('#errand-how').textContent = !list.length ? 'Nothing is on the list yet.' : !quote ? 'Reckoning the load…' : quote.can ? quote.how : '';
    const why = state.error || facts?.shut || (quote && !quote.can ? quote.why : '');
    $('#errand-why').textContent = why || '';
    const send = $('#errand-send');
    send.disabled = Boolean(state.busy) || !quote?.can || Boolean(facts?.shut);
    send.textContent = state.busy ? 'Sending…' : `Send ${name}`;
    // What a proof reads: the server's sentences as drawn, and the list as the page would send it.
    window.__errand = { entityId: state.entityId, list, how: $('#errand-how').textContent, why, can: !send.disabled, lines: (facts?.lines || []).map(line => ({ id: line.id, why: line.why || null, count: state.counts.get(line.id) || 0 })) };
  }

  async function send() {
    if (!state || state.busy || $('#errand-send').disabled) return;
    const list = currentList();
    state.busy = true; draw();
    try {
      await sendCommand({ action: 'chore', chore: 'visit-shop', entityId: state.entityId, errand: list });
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
    const button = event.target.closest('[data-act]'), row = event.target.closest('[data-line]');
    if (!button || !row || button.disabled) return;
    const id = row.dataset.line, line = state.facts?.lines.find(one => one.id === id);
    if (!line) return;
    const act = button.dataset.act;
    const count = state.counts.get(id) || 0;
    if (act === 'more') state.counts.set(id, Math.min(line.most, count + 1));
    else if (act === 'less') state.counts.set(id, Math.max(0, count - 1));
    else if (act.startsWith('pay-')) state.pays.set(id, act.slice(4));
    if (!state.counts.get(id)) state.counts.delete(id);
    state.error = '';
    state.quotedList = undefined;
    draw();
    requote();
  });
  // Escape sends nobody; Enter sends the list, from anywhere in the popup but its own close and cancel.
  root.addEventListener('keydown', event => {
    if (!state) return;
    if (event.key === 'Escape') { event.preventDefault(); close(); return; }
    if (event.key === 'Enter' && !event.target.closest('#errand-close, #errand-cancel')) { event.preventDefault(); send(); }
  });

  return {
    open(entityId) {
      state = { entityId, facts: null, quote: null, counts: new Map(), pays: new Map(), seq: 0, busy: false, error: '', key: null, quotedList: null };
      draw();
      fetchFacts();
      root.querySelector('#errand-cancel')?.focus({ preventScroll: true });
    },
    /** On every snapshot: when the family's stock or this person's ways of going change, ask the server again. */
    render(current) {
      if (!state || !current) return;
      if (current.role === 'host') { close(); return; }
      const key = JSON.stringify([current.household?.resources, current.travelModes?.[state.entityId], Boolean(current.entities?.find(one => one.id === state.entityId)?.chore)]);
      if (state.key === key) return;
      const first = state.key === null;
      state.key = key;
      if (!first) fetchFacts(currentList());
    },
    close,
  };
}
