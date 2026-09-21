// The one instrument the family-creation wizard is measured with, shared by the study that reports what it finds
// (scripts/creation-overlap-study.mjs) and the proof that refuses to pass when it finds a fault
// (scripts/creation-browser-proof.mjs). One copy, so that the numbers in the evidence and the numbers the gate holds to
// are the same numbers.
//
// Two traps it was built around, both of which cost a wrong answer in the study it is modelled on
// (docs/FAMILY_PANEL.md §12.11):
//   (a) A control that is hidden has a box of zero size. It overlaps nothing, it is never off the screen, and a stage
//       full of them reads as clean. So `real` says whether the card being measured is genuinely drawn and big enough
//       to be one, and a caller that does not check it is measuring nothing.
//   (b) A `position:fixed` box is NOT clipped by an ancestor that scrolls, so a naive ancestor walk reports clipping
//       that does not happen. `clipBoxOf` stops its walk at the first `position:fixed` box for exactly that reason.
// Whatever this returns was checked against screenshots looked at by eye before any of it was believed.

/** The finger the classroom actually uses. 44px is the smallest target Apple, Google and WCAG 2.5.8 all agree on. */
export const FINGER = 44;

/**
 * Everything on the screen of one step. `panel` is the card the step is answered on, and is what trap (a) is asked of.
 * Measured in the page, all of it, so that every number is the browser's own and not this script's arithmetic.
 */
export const measureStep = (page, panelSelector, endSelector) => page.evaluate(({ selector, finger, endOf }) => {
  const name = element => {
    if (!element) return 'nothing';
    const id = element.id || element.closest('[id]')?.id;
    return id ? `#${id}` : `${element.tagName.toLowerCase()}.${[...element.classList].join('.') || '?'}`;
  };
  const rect = box => ({ x: Math.round(box.x), y: Math.round(box.y), w: Math.round(box.width), h: Math.round(box.height) });
  const panel = document.querySelector(selector);
  const panelBox = panel ? panel.getBoundingClientRect() : null;
  // Trap (a): a hidden card has a box of zero size, overlaps nothing, and would read as a clean stage.
  const real = Boolean(panel) && !panel.hidden && getComputedStyle(panel).visibility !== 'hidden'
    && panelBox.width >= 120 && panelBox.height >= 60;

  // Every control of this card, plus anything pressable anywhere on the page: a control of the card covered by something
  // else is the fault, and a control of the *world* left pressable behind the curtain is a different one.
  const CONTROLS = 'button:not([hidden]):not(:disabled),input:not([type=hidden]):not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href],[tabindex]:not([tabindex="-1"])';
  const drawn = [...document.querySelectorAll(CONTROLS)].filter(one => {
    const box = one.getBoundingClientRect();
    return box.width >= 2 && box.height >= 2 && getComputedStyle(one).visibility !== 'hidden';
  });

  const covered = [], small = [], offScreen = [], scrolledAway = [];
  const mine = drawn.filter(one => panel && panel.contains(one));
  // What a finger actually presses. A 13px radio inside its own <label> is a label-sized target, not a 13px one, and
  // measuring the input alone reports a fault that a finger does not meet.
  const target = control => {
    const wrapper = control.closest('label');
    if (!wrapper || !panel.contains(wrapper)) return { element: control, box: control.getBoundingClientRect() };
    const box = wrapper.getBoundingClientRect();
    return box.width >= 2 && box.height >= 2 ? { element: wrapper, box, viaLabel: true } : { element: control, box: control.getBoundingClientRect() };
  };
  // What actually clips a control: the nearest ancestor between it and the card that does not show what is drawn outside
  // itself, or the card. **The walk stops at a `position:fixed` box** - trap (b) - because such a box is not clipped by
  // an ancestor that scrolls above it, and a walk that carries on past one reports clipping that does not happen. Only
  // the card and the one list inside it scroll here, so the walk is one or two steps.
  const clipBoxOf = control => {
    for (let node = control.parentElement; node && node !== document.body; node = node.parentElement) {
      const style = getComputedStyle(node);
      if (style.overflowX !== 'visible' || style.overflowY !== 'visible') return node.getBoundingClientRect();
      if (style.position === 'fixed' || node === panel) break;
    }
    return panel ? panel.getBoundingClientRect() : null;
  };
  // A control scrolled out of a box that scrolls is reachable; it is counted apart and not as a fault.
  const inBox = (box, edge) => !edge || (box.bottom > edge.top + 0.5 && box.top < edge.bottom - 0.5 && box.right > edge.left + 0.5 && box.left < edge.right - 0.5);
  const visible = panel ? panel.getBoundingClientRect() : null;
  const seenTargets = new Set();
  for (const control of mine) {
    const box = control.getBoundingClientRect();
    const label = (control.value || control.textContent || control.getAttribute('aria-label') || '').trim().slice(0, 40);
    const clip = clipBoxOf(control);
    if (!inBox(box, clip) || !inBox(box, visible)) { scrolledAway.push({ control: name(control), label, box: rect(box) }); continue; }
    const points = [[box.left + box.width / 2, box.top + box.height / 2],
      [box.left + 3, box.top + 3], [box.right - 3, box.top + 3], [box.left + 3, box.bottom - 3], [box.right - 3, box.bottom - 3]];
    const over = points.map(([x, y]) => {
      if (x < 0 || y < 0 || x > innerWidth || y > innerHeight) return 'off the screen';
      // A point past the edge of the card, or of the list inside it, belongs to a row half-scrolled under that edge.
      // What is on top there is the card's surroundings: the box scrolling, not one control covering another. Both
      // edges have to be asked - a list that scrolls can itself stand outside the card it is on.
      const past = edge => edge && (y < edge.top || y > edge.bottom || x < edge.left || x > edge.right);
      if (past(clip) || past(visible)) return null;
      const top = document.elementFromPoint(x, y);
      if (top && (top === control || control.contains(top) || top.contains(control))) return null;
      return name(top);
    });
    const blocked = over.filter(Boolean);
    const inside = box.left >= -0.5 && box.top >= -0.5 && box.right <= innerWidth + 0.5 && box.bottom <= innerHeight + 0.5;
    if (blocked.length) covered.push({ control: name(control), label, box: rect(box), blocked: blocked.length, points: points.length, centreBlockedBy: over[0], by: [...new Set(blocked)] });
    if (!inside) offScreen.push({ control: name(control), label, box: rect(box) });
    // A finger needs 44px each way, of whatever it actually presses.
    const hit = target(control);
    if (seenTargets.has(hit.element)) continue;
    seenTargets.add(hit.element);
    if (hit.box.height + 0.5 < finger || hit.box.width + 0.5 < finger) small.push({ control: name(control), label, box: rect(hit.box), viaLabel: Boolean(hit.viaLabel), short: Math.round(finger - hit.box.height), narrow: Math.round(finger - hit.box.width) });
  }

  // How close two controls a finger presses are to each other: under 8px is two targets a finger cannot tell apart.
  const targets = [...seenTargets].filter(one => inBox(one.getBoundingClientRect(), clipBoxOf(one)) && inBox(one.getBoundingClientRect(), visible));
  let tightest = null;
  for (let i = 0; i < targets.length; i++) {
    for (let j = i + 1; j < targets.length; j++) {
      const a = targets[i].getBoundingClientRect(), b = targets[j].getBoundingClientRect();
      if (targets[i].contains(targets[j]) || targets[j].contains(targets[i])) continue;
      const dx = Math.max(a.left - b.right, b.left - a.right), dy = Math.max(a.top - b.bottom, b.top - a.bottom);
      // Boxes that overlap on both axes are one control inside another's row; only separated pairs have a gap.
      const gap = dx >= 0 || dy >= 0 ? Math.max(dx, dy) : -1;
      if (gap < 0) continue;
      if (!tightest || gap < tightest.gap) tightest = { gap: Math.round(gap * 10) / 10, between: [name(targets[i]), name(targets[j])], labels: [(targets[i].textContent || '').trim().slice(0, 20), (targets[j].textContent || '').trim().slice(0, 20)] };
    }
  }

  // The button that ends the step, named by the caller rather than guessed: is it on the card as the card first opens,
  // and if not, how far past its own fold must a student scroll to find it?
  const submit = endOf ? panel?.querySelector(endOf) : null;
  const fold = !panel || !submit ? null : (() => {
    const panelRect = panel.getBoundingClientRect(), submitRect = submit.getBoundingClientRect();
    return {
      control: name(submit), label: (submit.textContent || '').trim().slice(0, 30), box: rect(submitRect),
      below: Math.round(submitRect.bottom - panelRect.bottom),
      inView: submitRect.bottom <= panelRect.bottom + 0.5 && submitRect.top >= panelRect.top - 0.5 && submitRect.bottom <= innerHeight + 0.5,
    };
  })();

  // Where focus is as the step arrives. A card nothing focuses is a card a screen reader never announces and a keyboard
  // never reaches without tabbing the whole page first. Read before anything here moves focus.
  const landed = document.activeElement;
  const arrived = !landed || landed === document.body ? 'the page itself' : name(landed);

  return {
    panel: selector, real, focusOnArrival: arrived, focusOnArrivalInside: Boolean(panel && landed && panel.contains(landed)),
    panelBox: panelBox ? rect(panelBox) : null,
    panelFits: Boolean(panelBox) && panelBox.top >= -0.5 && panelBox.bottom <= innerHeight + 0.5 && panelBox.left >= -0.5 && panelBox.right <= innerWidth + 0.5,
    scrolls: panel ? Math.max(0, ...[panel, ...panel.querySelectorAll('*')].map(node => Math.round(node.scrollHeight - node.clientHeight))) : null,
    endOfStep: fold,
    controls: mine.length, covered, tooSmallForAFinger: small, offScreen, scrolledOutOfTheCard: scrolledAway, tightestGap: tightest,
    pageScrollsSideways: Math.round(document.documentElement.scrollWidth - document.documentElement.clientWidth),
    pageScrollsDown: Math.round(document.documentElement.scrollHeight - document.documentElement.clientHeight),
    // What a screen reader is handed: the card's own role and the heading it is named by.
    announced: panel ? {
      role: panel.getAttribute('role'), modal: panel.getAttribute('aria-modal'),
      labelledBy: panel.getAttribute('aria-labelledby'),
      heading: document.getElementById(panel.getAttribute('aria-labelledby') || '')?.textContent?.trim() || null,
      errorLine: [...panel.querySelectorAll('[role=alert],[role=status]')].map(one => `#${one.id}`),
    } : null,
    // Controls of the *world* still reachable while the curtain is up. A subtree marked `inert` is not one of them: the
    // browser takes it out of the tab order and out of the accessibility tree, which is the whole point of marking it.
    behindTheCurtain: document.querySelector('#creation')?.hidden === false
      ? drawn.filter(one => !panel?.contains(one) && !document.querySelector('#creation')?.contains(one) && !one.closest('[inert]')).map(one => name(one)) : [],
  };
}, { selector: panelSelector, finger: FINGER, endOf: endSelector || null });

/**
 * Where Tab goes from the step's card. Walked with the browser's own focus, so the answer is the browser's tab order and
 * not a guess from the markup. `escaped` is the first thing focused that is neither in the card nor in the curtain.
 */
export const tabOrder = async (page, panelSelector, steps = 30) => {
  await page.evaluate(selector => document.querySelector(selector)?.querySelector('input,button,select,textarea')?.focus(), panelSelector);
  const seen = [];
  let escaped = null;
  for (let i = 0; i < steps; i++) {
    const where = await page.evaluate(selector => {
      const active = document.activeElement;
      if (!active || active === document.body) return { name: 'the page itself', inside: false, curtain: false };
      const panel = document.querySelector(selector);
      const id = active.id || active.closest('[id]')?.id;
      return {
        name: id ? `#${id}` : `${active.tagName.toLowerCase()}.${[...active.classList].join('.') || '?'}`,
        inside: Boolean(panel && panel.contains(active)),
        curtain: Boolean(document.querySelector('#creation')?.contains(active)) || document.querySelector('#creation')?.hidden !== false,
      };
    }, panelSelector);
    seen.push(where.name);
    if (!where.inside && !where.curtain && !escaped && where.name !== 'the page itself') escaped = where.name;
    await page.keyboard.press('Tab');
  }
  return { order: seen, escaped, wrapped: seen.length > 2 && seen[0] === seen[seen.lastIndexOf(seen[0])] && seen.lastIndexOf(seen[0]) > 0 };
};

