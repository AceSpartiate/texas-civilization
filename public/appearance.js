// How We Look: docs/SETTLING_IN.md §7, build step 8, and the owner's pop-ups of 2026-09-17.
//
// Owner: "The How We Look section should have images for each section too. This should appear next." By multiple choice: a
// head-and-shoulders picture for every option and a bigger one of the whole choice; required, with the defaults already
// chosen, one parent at a time; set once. It comes up after the family has its last name (public/app.js `renderSurname`),
// for each parent whose looks have not been chosen. Done sends all four parts together; the server refuses anything not on
// offer and anything already chosen (sim/appearance.mjs).
//
// stand-in: docs/ART_REQUESTS.md, "Claude-drawn stand-ins (replace with Astra's)" - looks portraits (public/looks-art.js).

import { drawLooks } from '/looks-art.js';

const PARTS = Object.freeze([
  ['skin', 'Skin'],
  ['hair', 'Hair'],
  ['clothing', 'Clothes'],
  ['head', null],
]);
const HEAD_WORDS = Object.freeze({ hat: 'Hat', beard: 'Beard', bonnet: 'Bonnet', 'pinned hair': 'Hair pinned up' });
const capital = word => word[0].toUpperCase() + word.slice(1);

let actions = null;
let showing = null; // the parent's id the pop-up is drawn for
let picked = null;  // what is chosen in the pop-up so far
let saving = false;

const make = (tag, text, className) => {
  const node = document.createElement(tag);
  if (text !== undefined && text !== null) node.textContent = text;
  if (className) node.className = className;
  return node;
};

/** The parent still to be chosen for, oldest role first (the father, then the mother). */
const waiting = family => (family?.people || []).filter(person => person.choices && !person.chosen);

function draw(person) {
  const box = document.querySelector('#looks');
  document.querySelector('#looks-title').textContent = `How ${person.given || person.name} looks`;
  document.querySelector('#looks-role').textContent = person.role ? capital(person.role) : '';
  drawLooks(document.querySelector('#looks-preview'), picked, person.sex);
  const rows = document.querySelector('#looks-parts');
  rows.replaceChildren(...PARTS.map(([part, label]) => {
    const row = make('fieldset', null, 'looks-part');
    row.append(make('legend', label || (person.sex === 'female' ? 'Bonnet or hair' : 'Hat or beard')));
    const options = make('div', null, 'looks-options');
    for (const value of person.choices[part] || []) {
      const option = make('button', null, 'looks-option');
      option.type = 'button';
      option.dataset.part = part;
      option.dataset.value = value;
      option.setAttribute('aria-pressed', String(picked[part] === value));
      const words = part === 'head' ? HEAD_WORDS[value] || value : capital(value);
      option.setAttribute('aria-label', `${label || 'Head'}: ${words}`);
      const canvas = make('canvas');
      canvas.width = canvas.height = 64;
      drawLooks(canvas, { ...picked, [part]: value }, person.sex);
      option.append(canvas, make('span', words));
      options.append(option);
    }
    row.append(options);
    return row;
  }));
  box.dataset.entityId = person.id;
}

/** Show the pop-up while a parent waits to be chosen for, and only once the family has its last name. */
export function renderLooks(family, { blocked = false } = {}) {
  const box = document.querySelector('#looks');
  if (!box) return;
  // Only for a rolled family that has its last name: the looks come next after the name.
  const next = blocked || !family?.roll || family.canRoll || !family.named ? null : waiting(family)[0];
  if (!next) { box.hidden = true; showing = null; return; }
  if (showing !== next.id) {
    showing = next.id;
    picked = { ...next.appearance };
    document.querySelector('#looks-error').textContent = '';
    draw(next);
  }
  if (box.hidden) { box.hidden = false; setTimeout(() => box.querySelector('.looks-option[aria-pressed="true"]')?.focus(), 0); }
}

/**
 * `command(order)` sends an order to the server, `refresh()` refetches the family book and redraws, `family()` is the family
 * book the page holds. Supplied by public/app.js, which owns all three.
 */
export function bindLooks({ command, refresh, family }) {
  actions = { command, refresh, family };
  document.querySelector('#looks-parts')?.addEventListener('click', event => {
    const option = event.target.closest('button[data-part]');
    if (!option || !picked) return;
    picked = { ...picked, [option.dataset.part]: option.dataset.value };
    const person = waiting(actions.family()).find(one => one.id === showing);
    if (person) { draw(person); document.querySelector(`#looks-parts button[data-part="${option.dataset.part}"][data-value="${CSS.escape(option.dataset.value)}"]`)?.focus(); }
  });
  document.querySelector('#looks-form')?.addEventListener('submit', async event => {
    event.preventDefault();
    if (!showing || saving) return;
    saving = true;
    const done = document.querySelector('#looks-done');
    done.disabled = true;
    try {
      await actions.command({ action: 'set-appearance', entityId: showing, skin: picked.skin, hair: picked.hair, clothing: picked.clothing, head: picked.head });
      document.querySelector('#looks-error').textContent = '';
      // Marked chosen here at once, so the next parent comes up without waiting for the book to be fetched again.
      const book = actions.family();
      const person = book?.people.find(one => one.id === showing);
      if (person) { person.chosen = true; person.appearance = { ...picked }; }
      showing = null;
      renderLooks(book);
      actions.refresh();
    } catch (error) {
      document.querySelector('#looks-error').textContent = error.message;
    } finally {
      saving = false; done.disabled = false;
    }
  });
}
