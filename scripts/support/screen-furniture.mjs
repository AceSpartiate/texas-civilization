// What is drawn over what, for every piece of furniture the student's page and the Host's page can put on the screen
// (owner, 2026-09-28: "Check for UI elements that block others. Move them somewhere else.").
//
// One instrument for `scripts/overlap-browser-proof.mjs`. It asks the browser, never the stylesheet:
//   - every piece of furniture that is **really drawn** (a hidden or empty box covers nothing and would read as clean -
//     trap (a) of scripts/support/panel-states.mjs), with its box cut to the screen and to whatever scrolls it;
//   - every pair of those boxes that share pixels, and whether the two are one inside the other in the page (a row inside
//     the family's column is not the column covering itself) - unless the inner one is `position:fixed`, which leaves its
//     parent's box behind (the ability bar is a fixed box inside the main person's row, trap (b));
//   - every control inside that furniture whose own points belong to something else (`elementFromPoint`), which is what a
//     student pressing it meets;
//   - every piece of furniture that runs off the screen's edge;
//   - what the canvas draws that a student has to read - speech bubbles, the fight's caption, the person being given an
//     order - and whether a DOM panel stands over it. The canvas is under every panel, so it can never cover a button; the
//     question for it is only the other way round.
//
// Nothing here decides whether an overlap is a fault. The proof does, with its list of pairs that are deliberate and why.

/**
 * The student's page: name, selector, and what kind of thing it is. `every` measures each match on its own (the family's
 * rows); otherwise the first shown match. Popups and dialogs are listed with the furniture because the question the owner
 * asked is exactly whether a popup lands on something - the proof holds the deliberate ones apart, by name, with a reason.
 */
export const STUDENT_FURNITURE = [
  // Top left: the status lines and the two lobby buttons under them.
  { name: 'status: session', selector: '#session', kind: 'status' },
  { name: 'status: world', selector: '#world', kind: 'status' },
  { name: 'status: food', selector: '#food', kind: 'status' },
  { name: 'status: supplies', selector: '#supplies', kind: 'status' },
  { name: 'wagon button', selector: '#wagon-open', kind: 'control' },

  // Down the left (owner-decided, docs/FAMILY_PANEL.md §7).
  { name: 'family: fold', selector: '#family-collapse', kind: 'family' },
  { name: 'family: row', selector: '#family-rows > .panel-row', kind: 'family', every: true },
  // The lone parent's path, offered at the head of the column (sim/courtship.mjs, owner 2026-09-29).
  { name: 'lone parent ability', selector: '#ask-neighbours', kind: 'family' },
  // The house's card (owner, 2026-09-29), under it: it replaced the "Choose a house" pill that stood above the column.
  { name: 'house card', selector: '#house-card', kind: 'family' },
  // Bottom middle: the main person's work (docs/FAMILY_PANEL.md §12.2).
  { name: 'ability bar', selector: '.panel-row[data-focused=true] .panel-icons', kind: 'bar' },
  // Bottom right: the map's own buttons, and the ending's way back.
  { name: 'journal button', selector: '#journal-toggle', kind: 'control' },
  { name: 'map buttons', selector: '#map-nav', kind: 'control' },
  // The sound control beside the Journal, and its panel of sliders (public/audio.js, 2026-09-28).
  { name: 'sound button', selector: '#sound-toggle', kind: 'control' },
  { name: 'sound panel', selector: '#sound-panel', kind: 'popup' },
  { name: 'ending button', selector: '#ending-open', kind: 'control' },
  { name: 'map framing', selector: '#map-framing', kind: 'caption' },
  // Top right: the connection line, Play Solo's own controls, the guided start and the messages.
  { name: 'connection', selector: '#connection', kind: 'status' },
  { name: 'solo controls', selector: '#solo-controls', kind: 'control' },
  { name: 'guided start', selector: '#lesson', kind: 'lesson' },
  { name: 'resume tutorial', selector: '#lesson-resume', kind: 'lesson' },
  { name: 'walk-through', selector: '#tutorial', kind: 'lesson' },
  { name: 'messages', selector: '#military-notice', kind: 'notice' },
  // The lines the page says: top middle.
  { name: 'error line', selector: '#error', kind: 'notice' },
  { name: 'save fault', selector: '#save-fault', kind: 'notice' },
  { name: 'lifecycle line', selector: '#lifecycle', kind: 'notice' },
  { name: 'host notice', selector: '#host-notice', kind: 'notice' },
  // Popups over the map.
  { name: 'person card', selector: '#selection', kind: 'popup' },
  { name: 'call menu', selector: '#call-menu', kind: 'popup' },
  { name: 'errand popup', selector: '#errand', kind: 'popup' },
  { name: 'going popup', selector: '#going', kind: 'popup' },
  { name: 'meeting', selector: '#encounter', kind: 'popup' },
  { name: 'town scene', selector: '#town-scene', kind: 'popup' },
  { name: 'site chooser', selector: '#site-choose', kind: 'popup' },
  { name: 'stake chooser', selector: '#survey-choose', kind: 'popup' },
  { name: 'house plans', selector: '#house-plan', kind: 'popup' },
  { name: 'house plot', selector: '#house-plot', kind: 'popup' },
  { name: 'house placement', selector: '#house-placement', kind: 'popup' },
  { name: 'wagon load', selector: '#wagon-load', kind: 'popup' },
  { name: 'icon tip', selector: '#panel-tip', kind: 'tip' },
  // The tip at first meeting over the map (public/tips.js, owner 2026-09-28). Not a tooltip: it stays until put away, so it is
  // held like any other piece - it may stand on nothing and nothing may stand on it.
  { name: 'first-meeting tip', selector: '#tip', kind: 'notice' },
  // Dialogs that stand over everything on purpose.
  { name: 'journal', selector: '#family-journal[data-open=true]', kind: 'dialog' },
  { name: 'ending', selector: '#ending', kind: 'dialog' },
  { name: 'inside the house', selector: '#interior', kind: 'dialog' },
  // The lone parent's scenes: the whole screen while they last, Continue the only way on (public/courtship.js).
  { name: 'lone parent scenes', selector: '#courtship', kind: 'dialog' },
  { name: 'reconnecting', selector: '#reconnecting', kind: 'dialog' },
];

/** The Host's page: the class down the left, the teacher's controls down the right, the spotlight at the top middle. */
export const HOST_FURNITURE = [
  { name: 'status: session', selector: '#session', kind: 'status' },
  { name: 'status: world', selector: '#world', kind: 'status' },
  { name: 'the class', selector: '#host-class', kind: 'host' },
  { name: 'rumor mill', selector: '#rumor-mill', kind: 'host' },
  { name: 'spotlight', selector: '#host-spotlight', kind: 'notice' },
  { name: 'connection', selector: '#connection', kind: 'status' },
  { name: 'teacher controls', selector: '#host-controls', kind: 'control' },
  { name: 'pace', selector: '#host-pace', kind: 'control' },
  { name: 'recover', selector: '#recover', kind: 'control' },
  { name: 'join links', selector: '#join-links', kind: 'host' },
  { name: 'class days', selector: '#class-days', kind: 'host' },
  { name: 'class size', selector: '#class-size-row', kind: 'control' },
  { name: 'late students', selector: '#late', kind: 'control' },
  { name: 'classes', selector: '#classes', kind: 'control' },
  { name: 'map buttons', selector: '#map-nav', kind: 'control' },
  { name: 'journal button', selector: '#journal-toggle', kind: 'control' },
  { name: 'ending button', selector: '#ending-open', kind: 'control' },
  { name: 'map framing', selector: '#map-framing', kind: 'caption' },
  { name: 'error line', selector: '#error', kind: 'notice' },
  { name: 'save fault', selector: '#save-fault', kind: 'notice' },
  { name: 'lifecycle line', selector: '#lifecycle', kind: 'notice' },
  // Why the class paused itself with nobody in it (server/app.mjs `pauseIfEmpty`, owner 2026-09-29).
  { name: 'paused itself', selector: '#host-paused', kind: 'notice' },
  { name: 'host notice', selector: '#host-notice', kind: 'notice' },
  { name: 'ending', selector: '#ending', kind: 'dialog' },
  { name: 'reconnecting', selector: '#reconnecting', kind: 'dialog' },
];

/**
 * The least type a student's page may set (triage 2026-09-29, 2.12, from the classroom audit's M6: labels in 9–10 px type were
 * hard to read on a Chromebook). Every piece of text **really drawn** on the page - its own words, not a box around other
 * words - in a smaller computed size is returned, with where it is and what it says. The Host's page is not held to it: the
 * teacher's screen and the projector have their own proofs.
 */
export const LEAST_TYPE = 12;
export const readSmallText = (page, least = LEAST_TYPE) => page.evaluate(least => {
  const small = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const seen = new Set();
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const element = node.parentElement;
    if (!element || seen.has(element) || !node.data.trim()) continue;
    seen.add(element);
    if (element.closest('script,style,noscript,template')) continue;
    if (element.checkVisibility && !element.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) continue;
    const box = element.getBoundingClientRect();
    // A line read out to a screen reader and kept off the screen (a box of a pixel, or clipped away) is not type anybody sees.
    if (box.width < 3 || box.height < 3 || box.right < 0 || box.bottom < 0 || box.left > innerWidth || box.top > innerHeight) continue;
    const size = parseFloat(getComputedStyle(element).fontSize);
    if (size < least - 0.05) small.push({ at: element.id ? `#${element.id}` : `${element.tagName.toLowerCase()}.${[...element.classList].join('.')}`, size, text: node.data.trim().replace(/\s+/g, ' ').slice(0, 40) });
  }
  return small;
}, least);

/** Everything a student or a teacher presses or types into. */
const CONTROL_SELECTOR = 'button,select,input,summary,a[href],.panel-icon,[role=button]';

/**
 * The screen as it is now: furniture drawn, the pairs that share pixels, the controls something else is over, what runs
 * off the edge, and what the canvas draws that has to be read. All in CSS pixels, all the browser's own numbers.
 */
export const measureScreen = (page, furniture) => page.evaluate(({ list, controls }) => {
  const round = box => ({ x: Math.round(box.left), y: Math.round(box.top), w: Math.round(box.right - box.left), h: Math.round(box.bottom - box.top) });
  const cut = (a, b) => ({ left: Math.max(a.left, b.left), top: Math.max(a.top, b.top), right: Math.min(a.right, b.right), bottom: Math.min(a.bottom, b.bottom) });
  const area = box => Math.max(0, box.right - box.left) * Math.max(0, box.bottom - box.top);
  const screen = { left: 0, top: 0, right: innerWidth, bottom: innerHeight };
  const shown = element => {
    if (!element?.isConnected) return false;
    if (element.checkVisibility && !element.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) return false;
    const box = element.getBoundingClientRect();
    return box.width >= 3 && box.height >= 3;
  };
  /** The box as its own scrolling ancestors leave it, stopping at a fixed box (trap (b)); not yet cut to the screen. */
  const inside = element => {
    let box = element.getBoundingClientRect();
    box = { left: box.left, top: box.top, right: box.right, bottom: box.bottom };
    if (getComputedStyle(element).position === 'fixed') return box;
    for (let node = element.parentElement; node && node !== document.body; node = node.parentElement) {
      const style = getComputedStyle(node);
      if (style.overflowX !== 'visible' || style.overflowY !== 'visible') box = cut(box, node.getBoundingClientRect());
      if (style.position === 'fixed') break;
    }
    return box;
  };
  /** The box a student can actually see: cut to every box that scrolls it, and to the screen. */
  const seen = element => cut(inside(element), screen);
  /**
   * Whether a control is cut away by a box that does not scroll (overflow hidden or clip): a control a student can never
   * bring into view, which is worse than covered. One in a box that scrolls is only scrolled away, and that is the box working.
   */
  const cutAway = element => {
    const own = element.getBoundingClientRect();
    for (let node = element.parentElement; node && node !== document.body; node = node.parentElement) {
      const style = getComputedStyle(node);
      const edge = node.getBoundingClientRect();
      const outside = own.bottom > edge.bottom + 1 || own.top < edge.top - 1 || own.right > edge.right + 1 || own.left < edge.left - 1;
      if (outside && ['hidden', 'clip'].includes(style.overflowY) && ['hidden', 'clip'].includes(style.overflowX)) return `#${node.id || node.className}`;
      if (outside && (style.overflowY === 'auto' || style.overflowY === 'scroll')) return null;
      if (style.position === 'fixed') break;
    }
    return null;
  };
  /** Whether `inner` sits in `outer`'s box in the page, rather than being lifted out of it by `position:fixed`. */
  const nested = (outer, inner) => {
    if (!outer.contains(inner)) return false;
    for (let node = inner; node && node !== outer; node = node.parentElement) if (getComputedStyle(node).position === 'fixed') return false;
    return true;
  };

  const drawn = [];
  for (const one of list) {
    const matches = one.every ? [...document.querySelectorAll(one.selector)] : [document.querySelector(one.selector)].filter(Boolean);
    matches.filter(shown).forEach((element, index) => {
      const raw = element.getBoundingClientRect();
      const box = seen(element);
      if (area(box) < 9) return;
      drawn.push({
        name: one.every ? `${one.name} ${index + 1}` : one.name, kind: one.kind, element,
        box, raw: { left: raw.left, top: raw.top, right: raw.right, bottom: raw.bottom },
      });
    });
  }

  // ------------------------------------------------------------------------------------------ pairs sharing pixels
  const overlaps = [];
  for (let i = 0; i < drawn.length; i++) {
    for (let j = i + 1; j < drawn.length; j++) {
      const a = drawn[i], b = drawn[j];
      if (nested(a.element, b.element) || nested(b.element, a.element)) continue;
      const shared = cut(a.box, b.box);
      const w = shared.right - shared.left, h = shared.bottom - shared.top;
      // A pixel or two is a shadow or a rounding, not a panel standing on another.
      if (w < 3 || h < 3) continue;
      overlaps.push({ a: a.name, b: b.name, kinds: [a.kind, b.kind], shared: { w: Math.round(w), h: Math.round(h) }, at: round(shared) });
    }
  }

  // ------------------------------------------------------------------------- controls something else is drawn over
  // The innermost piece a thing belongs to: an icon of the ability bar is inside the main person's row in the page, and
  // it is the bar's, not the row's.
  const owner = element => drawn.filter(one => one.element === element || one.element.contains(element))
    .sort((a, b) => (a.element.contains(b.element) ? 1 : b.element.contains(a.element) ? -1 : 0))[0];
  const label = element => (element.getAttribute('aria-label') || element.dataset?.name || element.textContent || element.id || element.tagName).trim().replace(/\s+/g, ' ').slice(0, 40);
  const nameOf = element => {
    if (!element) return 'nothing';
    const piece = owner(element);
    if (piece) return piece.name;
    const id = element.id || element.closest('[id]')?.id;
    return id ? `#${id}` : element.tagName.toLowerCase();
  };
  const covered = [], asked = new Set(), unreachable = [];
  for (const piece of drawn) {
    for (const control of piece.element.querySelectorAll(controls)) {
      if (asked.has(control) || !shown(control)) continue;
      asked.add(control);
      const clip = cutAway(control);
      if (clip) { unreachable.push({ control: label(control), in: owner(control)?.name || piece.name, cutBy: clip }); continue; }
      const box = seen(control);
      if (box.right - box.left < 6 || box.bottom - box.top < 6) continue; // scrolled out of its list, or off the screen
      const inset = 3, cx = (box.left + box.right) / 2, cy = (box.top + box.bottom) / 2;
      const points = [[cx, cy], [box.left + inset, box.top + inset], [box.right - inset, box.top + inset], [box.left + inset, box.bottom - inset], [box.right - inset, box.bottom - inset]];
      const mine = owner(control);
      const by = points.map(([x, y]) => {
        const top = document.elementFromPoint(x, y);
        if (!top || top === control || control.contains(top) || top.contains(control)) return null;
        // A tooltip that follows the pointer is over whatever the pointer is on; that is what a tooltip is.
        if (top.closest('#panel-tip')) return null;
        // The map itself at a point is nothing drawn over the control: it is a round button's corner, where the button is not.
        if (top.id === 'world-map') return null;
        // A piece's own parts laid over each other - the star and the "!" on a portrait's corner - are that piece's design.
        if (owner(top) === mine) return null;
        return nameOf(top);
      });
      const blocked = by.filter(Boolean);
      if (!blocked.length) continue;
      // Pressed where a student presses (the middle), or most of it gone: either is a control a student cannot reliably use.
      covered.push({ control: label(control), in: mine?.name || piece.name, by: [...new Set(blocked)], centre: Boolean(by[0]), points: blocked.length, of: points.length });
    }
  }

  // ----------------------------------------------------------------------------------------------- off the screen
  // What is left of a piece once whatever scrolls it has cut it: a panel scrolled inside a column that scrolls is the column
  // working, not a panel off the screen.
  const offScreen = drawn
    .map(one => ({ one, box: inside(one.element) }))
    .filter(({ box }) => box.left < -2 || box.top < -2 || box.right > innerWidth + 2 || box.bottom > innerHeight + 2)
    .map(({ one, box }) => ({ name: one.name, box: round(box) }));

  // --------------------------------------------------------------------------- what the canvas draws, under the DOM
  const canvas = document.querySelector('#world-map');
  const frame = canvas.getBoundingClientRect(), k = canvas.width / (frame.width || 1);
  const toScreen = box => ({ left: frame.left + box.x / k, top: frame.top + box.y / k, right: frame.left + (box.x + box.w) / k, bottom: frame.top + (box.y + box.h) / k });
  const read = [];
  for (const line of [...(window.__familySaid || []), ...(window.__townSaid || []), ...(window.__ambientSaid || [])]) if (line.box) read.push({ what: `bubble "${String(line.text).slice(0, 30)}"`, box: toScreen(line.box) });
  const caption = window.__battleCaption;
  if (caption && window.__snapshot?.world?.battle) {
    // Where the page says it drew it; a page from before it said so drew it in the middle, 560 wide.
    const width = caption.width ?? Math.min(560, canvas.width - 40);
    read.push({ what: 'fight caption', box: toScreen({ x: caption.left ?? (canvas.width - width) / 2, y: caption.top, w: width, h: caption.height }) });
  }
  // The person the card is about - the one a student has pressed to give an order to - where the map drew them.
  const card = document.querySelector('#selection');
  const chosen = card && shown(card) ? card.dataset.entityId : null;
  const spot = chosen && window.__drawnAt?.[chosen];
  if (spot) read.push({ what: 'the person being ordered', box: toScreen({ x: spot.x - spot.size * .3, y: spot.y - spot.size * .5, w: spot.size * .6, h: spot.size }) });
  // And while a rider talks, the one of the family he is talking to.
  const listener = document.querySelector('#encounter:not([hidden])') && window.__snapshot?.world?.encounter?.listenerId;
  const heard = listener && listener !== chosen && window.__drawnAt?.[listener];
  if (heard) read.push({ what: 'the person being spoken to', box: toScreen({ x: heard.x - heard.size * .3, y: heard.y - heard.size * .5, w: heard.size * .6, h: heard.size }) });
  const hidden = [];
  for (const one of read) {
    if (area(cut(one.box, screen)) < 4) continue;
    for (const piece of drawn) {
      if (piece.kind === 'dialog' || piece.kind === 'tip') continue;
      const shared = cut(one.box, piece.box);
      const w = shared.right - shared.left, h = shared.bottom - shared.top;
      if (w < 4 || h < 4) continue;
      const share = area(shared) / area(cut(one.box, screen));
      hidden.push({ what: one.what, under: piece.name, share: Math.round(share * 100) / 100, box: round(one.box) });
    }
  }

  return {
    screen: { width: innerWidth, height: innerHeight },
    drawn: drawn.map(one => ({ name: one.name, kind: one.kind, box: round(one.box) })),
    overlaps, covered, unreachable, offScreen, canvas: { read: read.map(one => ({ what: one.what, box: round(one.box) })), hidden },
    // Whether the camera is framing the family by itself (Follow), rather than on a person the student pressed or a place
    // they moved it to: the family frame is the camera's, and a person it happens to put under a panel is pressed to bring
    // them to the middle.
    following: Boolean(window.__camera?.following),
    flags: {
      panel: document.body.dataset.panel || null, meeting: document.body.dataset.meeting || null, placing: document.body.dataset.placing || null,
      backdrop: shown(document.querySelector('#panel-backdrop')), journalBackdrop: shown(document.querySelector('#journal-backdrop')),
      // The messages carrying a question that will not wait (triage 2026-09-29, 2.2): nothing the student opened may stand on it.
      urgent: shown(document.querySelector('#military-notice')) && document.querySelector('#military-notice').dataset.urgent === 'true',
    },
  };
}, { list: furniture, controls: CONTROL_SELECTOR });
