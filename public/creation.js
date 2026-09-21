// Making a family, before the world is seen (owner, 2026-09-17: "the rolling for a family, naming them, choosing the looks,
// should all happen before the world renders. the experience in solo vs live class should be the same. before we see the
// character creation interface experience, we need an intro screen. Name it 'Family: Texas 1835/36'").
//
// One curtain over the whole page and five steps on it, the same in a class and in Play Solo:
//   1. the title screen - the game's name, a drawn scene, a few lines, and the way in (a class joins here; Play Solo begins);
//   2. the die (`#family-roll`, docs/FAMILY_CREATION.md);
//   3. the family's last name (`#surname`);
//   4. everybody's first name, all on one card, already filled in;
//   5. how each parent looks, one at a time (`#looks`). Children take after their parents and are not chosen.
// The map is not drawn at all while the curtain is up: public/app.js skips `drawWorld`, so a slow computer spends nothing on
// a world nobody is looking at yet.
//
// stand-in: docs/ART_REQUESTS.md, "Claude-drawn stand-ins (replace with Astra's)" - the title scene, drawn here in canvas.

import { drawIntroScene } from './intro-art.js';

let actions = null;
/** Where this page has got to: the title screen is behind it once `begun`, the names once `named`. Kept per family. */
const state = { begun: false, named: false, householdId: null, drawn: false, focused: null };

/**
 * The cards of the wizard that live inside the map's own stage rather than beside it. They are drawn *above* the curtain
 * (public/style.css, `body[data-creating=true]`), so sealing the world behind it has to leave them out.
 */
const WIZARD_CARDS = new Set(['family-roll', 'surname', 'looks']);

/**
 * While the curtain is up, the world behind it is `inert`: not focusable, not clickable, not read out. Measured
 * 2026-09-21 (docs/FAMILY_PANEL.md §13, `scripts/creation-overlap-study.mjs`): without this, Tab walked off every step of
 * the wizard onto the map canvas and as many as 89 controls of a world the student cannot even see, while `#surname`,
 * `#names` and `#looks` each told a screen reader `aria-modal="true"`. `inert` is the browser's own answer and needs no
 * key handling of ours.
 *
 * The lines that announce a fault are left out as well: they hold nothing to focus, and a live region inside an inert
 * subtree is not announced.
 */
function sealTheCurtain(up) {
  const stage = document.querySelector('.map-stage');
  if (!stage) return;
  for (const node of stage.children) {
    const role = node.getAttribute('role');
    if (WIZARD_CARDS.has(node.id) || role === 'alert' || role === 'status') continue;
    node.inert = up;
  }
}

/**
 * When a step arrives, focus goes to its card, so that a screen reader reads the card's own heading and a keyboard starts
 * inside it. Only on a change of step: `renderCreation` runs on every tick, and a card that took focus back every tick
 * would be a card nobody could type in. A card whose own field is focused by the page (the last name) is left alone.
 *
 * Two things this has to survive, both measured on 2026-09-21:
 *   - The card is not always drawn on the tick its step arrives: the die and the looks are shown by their own render, one
 *     tick later. So the step is only marked announced once the card is really there, and until then this tries again.
 *   - Focus can fall off the page altogether. Pressing the die disables its own button while it tumbles, and a browser
 *     blurs a control it has just disabled: focus landed on nothing, with no way back but Tab from the top of the
 *     document. Whenever focus has fallen to nothing while a step is up, it is brought back to the card.
 */
function announceStep(step, card) {
  const key = `${step}:${card?.dataset.entityId || ''}`;
  const adrift = !document.activeElement || document.activeElement === document.body;
  if (state.focused === key && !adrift) return;
  if (!card || card.hidden) return;
  state.focused = key;
  if (card.contains(document.activeElement)) return;
  if (!card.hasAttribute('tabindex')) card.setAttribute('tabindex', '-1');
  card.focus({ preventScroll: true });
}
const $ = selector => document.querySelector(selector);
const element = (tag, text, className) => { const node = document.createElement(tag); if (text !== undefined) node.textContent = text; if (className) node.className = className; return node; };

/** Remembered for this page and family, so a reload in the middle does not start the introduction again. */
function remember(key, value) {
  state[key] = value;
  try { sessionStorage.setItem(`creation:${state.householdId}:${key}`, value ? '1' : ''); } catch { /* a browser that keeps nothing */ }
}
function recall(householdId) {
  if (state.householdId === householdId) return;
  state.householdId = householdId;
  for (const key of ['begun', 'named']) {
    try { state[key] = sessionStorage.getItem(`creation:${householdId}:${key}`) === '1'; } catch { state[key] = false; }
  }
}

/**
 * Which step this page is on, or null once the family is made and the world may be seen.
 * `join` is the title screen before a class is joined; `begin` is the title screen for somebody already in.
 */
export function creationStep(world, family) {
  if (!world || world.role === 'host') return null;
  if (!world.householdId) { showTitle(); return 'join'; }
  recall(world.householdId);
  if (!family) return 'begin';
  if (!state.begun) return 'begin';
  // The die while it is theirs to roll. A family that has not rolled and may not - the class has begun and Start will roll it -
  // waits in the world, as it always did, and is asked its name as soon as it has been rolled.
  if (family.canRoll) return 'roll';
  if (!family.roll) return null;
  if (!family.named) return 'surname';
  // The names and the looks are asked for while the family is being made. A page opened later - another tab, another day -
  // sees the title screen and then the world: a family whose parents have been chosen for is already made.
  const waiting = (family.people || []).filter(person => person.choices && !person.chosen);
  if (!state.named && waiting.length) return 'names';
  if (waiting.length) return 'looks';
  return null;
}

/**
 * The title screen behind the join form, so the game's name is the first thing anybody sees. Called by public/app.js when it
 * shows the form; Begin comes next, in a class and in Play Solo alike (owner, 2026-09-17: the same experience in both).
 */
export function showTitle() {
  const veil = $('#creation');
  if (!veil) return;
  veil.hidden = false;
  veil.dataset.step = 'join';
  document.body.dataset.creating = 'true';
  sealTheCurtain(true);
  if (!state.drawn) { state.drawn = true; drawIntroScene($('#creation-scene')); }
  $('#creation-begin').hidden = true;
  $('#names').hidden = true;
}

/** Draw the curtain and whichever step belongs to it; returns the step, or null when the world may be drawn. */
export function renderCreation(world, family) {
  const step = creationStep(world, family);
  const veil = $('#creation');
  if (!veil) return null;
  veil.hidden = !step;
  document.body.dataset.creating = step ? 'true' : 'false';
  // Every card of the flow is put away with the curtain: one left standing sits over the world (found by the family-panel
  // proof on a phone, 2026-09-17).
  $('#creation-begin').hidden = step !== 'begin';
  $('#names').hidden = step !== 'names';
  // Nothing of the world behind the curtain may be tabbed to, clicked or read out while a step is up.
  sealTheCurtain(Boolean(step));
  if (!step) { state.focused = null; return null; }
  if (!state.drawn) { state.drawn = true; drawIntroScene($('#creation-scene')); }
  // The title screen is the whole of the first two steps; after that the scene is a quiet band behind the cards.
  veil.dataset.step = step;
  if (step === 'names') renderNames(family);
  announceStep(step, $({ join: '#join', begin: '#creation-begin', roll: '#family-roll', surname: '#surname', names: '#names', looks: '#looks' }[step]));
  return step;
}

/** Everybody's first name, filled in with the names the game dealt, and one Continue. */
function renderNames(family) {
  const list = $('#names-list');
  const shape = (family.people || []).map(person => person.id).join(',');
  if (list.dataset.shape !== shape) {
    list.dataset.shape = shape;
    list.replaceChildren(...(family.people || []).map(person => {
      const row = element('li', undefined, 'names-row');
      row.dataset.entityId = person.id;
      const age = !Number.isFinite(person.age) ? '' : person.age === 0 ? ', under a year' : `, ${person.age}`;
      const role = person.role ? person.role[0].toUpperCase() + person.role.slice(1) : 'Of this family';
      const label = element('label', `${role}${age}`);
      const input = element('input');
      input.id = `name-${person.id}`;
      input.maxLength = 24;
      input.autocomplete = 'off';
      input.value = person.given || person.name;
      label.htmlFor = input.id;
      row.append(label, input);
      return row;
    }));
  }
  $('#names-family').textContent = family.surname ? `The ${family.surname} family` : family.name;
}

/**
 * `command(order)` sends an order to the server, `refresh()` refetches the family book and redraws, `family()` is the book the
 * page holds. Supplied by public/app.js, which owns all three.
 */
export function bindCreation({ command, refresh, family }) {
  actions = { command, refresh, family };
  $('#creation-begin-button')?.addEventListener('click', () => { remember('begun', true); refresh(); });
  $('#names-form')?.addEventListener('submit', async event => {
    event.preventDefault();
    const book = actions.family();
    const button = $('#names-done');
    button.disabled = true;
    $('#names-error').textContent = '';
    try {
      // Only the names a student changed are sent; the rest are the game's own and are already what the box shows.
      for (const person of book?.people || []) {
        const input = $(`#name-${CSS.escape(person.id)}`);
        const typed = input?.value.trim();
        // An emptied box keeps the name the game dealt - the server would refuse a blank - so the box is put back to what
        // the world actually holds rather than left showing a name nobody has (2026-09-21).
        if (!typed) { if (input) input.value = person.given || person.name; continue; }
        if (typed === (person.given || person.name)) continue;
        await actions.command({ action: 'rename', entityId: person.id, name: typed });
      }
      remember('named', true);
      refresh();
    } catch (error) {
      $('#names-error').textContent = error.message;
    } finally {
      button.disabled = false;
    }
  });
}
