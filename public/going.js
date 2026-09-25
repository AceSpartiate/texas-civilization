// How they will go, asked before anybody leaves (owner, 2026-09-24; docs/FAMILY_PANEL.md §15): "when sending someone to
// travel, the game should ask how they'll travel."
//
// **The page decides nothing here.** Which orders make a journey is the server's (`journey` on the chore catalogue, and the
// answers to a call that go somewhere); every way, its pace, the time there, what it carries against what is carried, how
// tiring it is, whether it is free and why not, and which is quickest are the server's too (`GET /api/ways`, sim/going.mjs,
// sim/world.mjs `goingFor`), fetched when the chooser opens and again whenever this person's ways of going change - never on
// the tick. The page keeps only which way the student pressed, and sends the one order with it; the server checks it again
// and refuses it in the holder's name if it is no longer free.
//
// `drawWays` is the one component for the question, drawn by this chooser and by the errand to town (public/errand.js), which
// asks the same question with a load that must fit. Kept apart from public/app.js so the rules below are tested headlessly
// (tests/going-page.test.mjs) and the chooser is proved in a browser (scripts/going-browser-proof.mjs).

/** The answers to a call that put somebody on a road, and the plain journey: the orders that always ask. */
export const JOURNEY_ACTIONS = Object.freeze(['travel', 'help', 'go-see', 'go-upriver', 'turn-out']);

/**
 * Whether this order asks how they will go before it is sent: a journey, an answer that goes somewhere, or work the server's
 * catalogue marks as making a journey (`journey: true`, sim/chores.mjs `makesJourney`). The errand to town has its own popup,
 * which asks it with the list. The server has the last word: an order that starts no journey from where the person stands is
 * told so by `/api/ways`, and sent as it is.
 */
export function asksTheWay(input, catalogue = new Map()) {
  if (!input?.entityId || input.mode) return false;
  if (JOURNEY_ACTIONS.includes(input.action)) return true;
  return input.action === 'chore' && input.chore !== 'visit-shop' && Boolean(catalogue.get?.(input.chore)?.journey);
}

/** The way that is chosen: the student's, while the server still says it can go; otherwise the quickest, which is chosen for them. */
export function chosenWay(ways = [], quickest = null, pressed = null) {
  const pick = pressed && ways.find(way => way.id === pressed && way.can);
  return pick ? pick.id : quickest || null;
}

/**
 * The one way to send it by without asking (owner, 2026-09-25: "When a journey has only one possible way, skip the 'how will they
 * go?' chooser. Only ask when there's a real choice"): the server's `oneWay`, when it says only one way can go and nothing shuts
 * the order - and only before the chooser has been drawn and while no refusal is waiting to be read, so a way refused on sending
 * is shown on the chooser rather than sent again. Null means ask.
 */
export function skipsTheChooser(going, { shown = false, error = '' } = {}) {
  if (!going?.journey || shown || error || going.shut) return null;
  const way = going.oneWay && (going.ways || []).find(one => one.id === going.oneWay && one.can);
  return way ? way.id : null;
}

/** The order as the server is asked about it: what it is, without its id or a way already chosen. */
export function orderAsked(input) {
  const { id, mode, entityId, ...order } = input || {};
  return order;
}

/**
 * The ways of going, as one row of cards (owner, 2026-09-24): every way the server sent, quickest first, the quickest marked
 * and chosen unless another is pressed; each with the server's facts, and a way that cannot go shut with the server's reason
 * in it and on its title. `view`: `{ ways, quickest, chosen }`. `element(tag, text, className)` is the page's own.
 */
export function drawWays(host, { ways = [], quickest = null, chosen = null } = {}, element) {
  const row = element('div', '', 'going-ways-row');
  for (const way of ways) {
    const button = element('button', '', 'going-way');
    button.type = 'button';
    button.dataset.way = way.id;
    button.setAttribute('aria-pressed', String(way.id === chosen));
    button.disabled = !way.can;
    if (!way.can) button.title = way.why || '';
    button.append(element('span', way.id === quickest ? `${way.name} (quickest)` : way.name, 'going-way-name'));
    const facts = [way.pace, way.time && `${way.time} there`, way.carrying || `carries ${way.carry}`].filter(Boolean).join(' · ');
    button.append(element('span', facts, 'going-way-facts'));
    if (way.brings) button.append(element('span', way.brings, 'going-way-brings'));
    // An animal bought on the errand, led or driven home, and the pace it holds them to (sim/going.mjs `homeWords`).
    if (way.leads) button.append(element('span', way.leads, 'going-way-brings'));
    button.append(element('span', way.can ? way.tiring : way.why, way.can ? 'going-way-tiring' : 'going-way-why'));
    row.append(button);
  }
  host.replaceChildren(row);
}

/**
 * The chooser. `deps`: `$`, `element`, `api` (GET), `say`, `send(input)` (public/app.js's, which gives the order its id as
 * every command's is made). Returns `{ open(input) → Promise<{ sent, error? }>, render(world), close() }`.
 */
export function mountGoing({ $, element, api, say = () => {}, send: sendCommand }) {
  const root = $('#going');
  if (!root) return { open: async () => ({ sent: false }), render() {}, close() {}, isOpen: false };
  let state = null;

  function finish(result) {
    const done = state?.resolve;
    state = null;
    root.hidden = true;
    delete document.body.dataset.going;
    window.__going = null;
    window.__goingPending = false;
    done?.(result);
  }
  const close = () => finish({ sent: false });

  async function fetchFacts() {
    if (!state) return;
    const seq = ++state.seq;
    try {
      const { going } = await api(`/api/ways?entityId=${encodeURIComponent(state.input.entityId)}&order=${encodeURIComponent(JSON.stringify(orderAsked(state.input)))}`);
      if (!state || seq !== state.seq) return;
      state.facts = going;
      state.error = state.refused || '';
      state.refused = '';
      // Nothing to ask: the order makes no journey from where they stand. Sent as it is, with no chooser drawn.
      if (!going.journey) { await sendNow(); return; }
      // Nothing to choose: one way can go (owner, 2026-09-25). Sent that way, with no chooser drawn; a refusal draws it.
      const only = skipsTheChooser(going, { shown: state.shown, error: state.error });
      if (only) {
        window.__goingSkipped = { entityId: state.input.entityId, order: orderAsked(state.input), mode: only, ways: going.ways };
        await sendNow(only, { quiet: true });
        return;
      }
    } catch (error) {
      if (!state || seq !== state.seq) return;
      state.error = error.message;
    }
    draw();
  }

  function draw() {
    if (!state) return;
    const facts = state.facts;
    if (facts && !facts.journey) return;
    state.shown = true;
    root.hidden = false;
    document.body.dataset.going = 'true';
    const name = facts?.person?.name || 'They';
    $('#going-title').textContent = facts ? `How will ${name} go?` : 'How will they go?';
    $('#going-text').textContent = facts ? facts.journey.says : 'Asking how they can go…';
    const chosen = chosenWay(facts?.ways, facts?.quickest, state.mode);
    drawWays($('#going-ways'), { ways: facts?.ways || [], quickest: facts?.quickest || null, chosen }, element);
    const why = state.error || facts?.shut || (facts && !chosen ? 'No way of going is open to them now.' : '');
    $('#going-why').textContent = why;
    const send = $('#going-send');
    send.disabled = Boolean(state.busy) || !facts || !chosen || Boolean(facts.shut);
    send.textContent = state.busy ? 'Sending…' : `Send ${name}`;
    // What a proof reads: the server's ways as drawn, and the way the order would carry.
    window.__going = { entityId: state.input.entityId, order: orderAsked(state.input), ways: facts?.ways || null, quickest: facts?.quickest || null, chosen, why, can: !send.disabled };
  }

  async function sendNow(mode = null, { quiet = false } = {}) {
    if (!state || state.busy) return;
    state.busy = true;
    if (state.facts?.journey && !quiet) draw();
    const input = { ...state.input, ...(mode && { mode }) };
    try {
      await sendCommand(input);
      finish({ sent: true });
    } catch (error) {
      if (!state) return;
      state.busy = false;
      say(error.message);
      // Nothing was drawn for an order that makes no journey: its refusal is the page's error line and the answer.
      if (!state.facts?.journey) { finish({ sent: false, error: error.message }); return; }
      // Refused - somebody took the horse meanwhile: said in the server's words, and the ways asked again, so the one taken
      // is shut in the holder's name and the quickest still free is chosen.
      state.refused = error.message;
      state.mode = null;
      fetchFacts();
    }
  }
  function send() {
    if (!state || state.busy || $('#going-send').disabled) return;
    sendNow(chosenWay(state.facts?.ways, state.facts?.quickest, state.mode));
  }

  root.addEventListener('click', event => {
    if (!state) return;
    if (event.target.closest('#going-close, #going-cancel')) { close(); return; }
    if (event.target.closest('#going-send')) { send(); return; }
    const way = event.target.closest('[data-way]');
    if (way && !way.disabled) { state.mode = way.dataset.way; state.error = ''; draw(); root.querySelector(`[data-way="${way.dataset.way}"]`)?.focus({ preventScroll: true }); }
  });
  // Escape sends nobody; Enter sends them the way that is chosen, from anywhere in the chooser but its close and cancel (on a
  // way, Enter chooses it and sends: the one press a keyboard needs).
  root.addEventListener('keydown', event => {
    if (!state) return;
    if (event.key === 'Escape') { event.preventDefault(); close(); return; }
    if (event.key !== 'Enter' || event.target.closest('#going-close, #going-cancel')) return;
    event.preventDefault();
    const way = event.target.closest('[data-way]');
    if (way && !way.disabled) state.mode = way.dataset.way;
    send();
  });

  return {
    /** Ask how they go, then send the order with it. Resolves when it is sent, refused without a chooser, or cancelled. */
    open(input) {
      if (state) finish({ sent: false });
      // Set at once, before the server is asked: a proof can tell an order that asks from one that does not.
      window.__goingPending = true;
      window.__goingAsked = (window.__goingAsked || 0) + 1;
      return new Promise(resolve => {
        state = { input, facts: null, mode: null, busy: false, error: '', refused: '', seq: 0, key: null, shown: false, resolve };
        // The keyboard lands on the way that is chosen: Enter sends them by it, Tab reaches the others, Escape sends nobody.
        fetchFacts().then(() => { if (state?.facts?.journey) (root.querySelector('[data-way][aria-pressed=true]:not([disabled])') || root.querySelector('#going-cancel'))?.focus({ preventScroll: true }); });
      });
    },
    /** On every snapshot: when this person's ways of going, or whether they are free to go, change, ask the server again. */
    render(current) {
      if (!state || !current) return;
      if (current.role === 'host') { close(); return; }
      const one = current.entities?.find(entity => entity.id === state.input.entityId);
      const key = JSON.stringify([current.travelModes?.[state.input.entityId], Boolean(one?.travel), Boolean(one?.chore), one?.location?.siteId ?? null]);
      if (state.key === key) return;
      const first = state.key === null;
      state.key = key;
      if (!first && state.facts?.journey && !state.busy) fetchFacts();
    },
    close,
    get isOpen() { return Boolean(state); },
  };
}
