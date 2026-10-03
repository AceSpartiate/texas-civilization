// How We Look: docs/SETTLING_IN.md §7, build step 8, and the owner's pop-ups of 2026-09-17.
//
// Owner: "The How We Look section should have images for each section too. This should appear next." By multiple choice: a
// head-and-shoulders picture for every option and a bigger one of the whole choice; required, with the defaults already
// chosen, one parent at a time; set once. It comes up after the family has its last name (public/app.js `renderSurname`),
// for each parent whose looks have not been chosen. Done sends all four parts together; the server refuses anything not on
// offer and anything already chosen (sim/appearance.mjs).
//
// The choice preview uses the same painted cast frames as the live map and family portrait.

import { drawAvatarFigure, drawAvatarPortrait } from '/avatar-art.js';
import { loadArt, onArtReady } from '/art.js';
import { SKIN_COLOURS, HAIR_COLOURS, CLOTHING_COLOURS } from '/looks-art.js';

const PARTS = Object.freeze([
  ['skin', 'Skin'],
  ['hair', 'Hair'],
  ['clothing', 'Clothes'],
  ['head', null],
]);
const HEAD_WORDS = Object.freeze({ hat: 'Felt hat', beard: 'Beard', bonnet: 'Bonnet', 'pinned hair': 'Hair pinned up', bareheaded: 'Bareheaded', 'hat and beard': 'Hat & beard', moustache: 'Moustache', 'straw hat': 'Straw hat', braid: 'Braid', 'loose hair': 'Loose hair', headscarf: 'Headscarf' });
const capital = word => word[0].toUpperCase() + word.slice(1);

let actions = null;
let showing = null; // the parent's id the pop-up is drawn for
let picked = null;  // what is chosen in the pop-up so far
let saving = false;
let previewWalking = false;
let previewDirection = 's';
let previewPerson = null;
const COLOURS = { skin: SKIN_COLOURS, hair: HAIR_COLOURS, clothing: CLOTHING_COLOURS };

const make = (tag, text, className) => {
  const node = document.createElement(tag);
  if (text !== undefined && text !== null) node.textContent = text;
  if (className) node.className = className;
  return node;
};

/** The parent still to be chosen for, oldest role first (the father, then the mother). */
const waiting = family => (family?.people || []).filter(person => person.choices && !person.chosen);
/** Every parent of the family, answered or not: the fixed total the "Parent 1 of 2" line counts against. */
const parentsOf = family => (family?.people || []).filter(person => person.choices);
/** Where this parent stands among all of them, for the pop-up's own counter. */
const placeOf = (family, id) => {
  const all = parentsOf(family);
  return { index: Math.max(0, all.findIndex(person => person.id === id)), of: all.length };
};

function draw(person, { index = 0, of = 1 } = {}) {
  previewPerson = person;
  const box = document.querySelector('#looks');
  document.querySelector('#looks-title').textContent = `How ${person.given || person.name} looks`;
  document.querySelector('#looks-role').textContent = `${person.role === 'mother' ? 'Mom' : 'Dad'}${Number.isFinite(person.age) ? ` · Age ${person.age}` : ''}`;
  // Which parent of how many, and what Done does next. A family with two parents showed the father, took Done, and put the
  // mother up with nothing having said there was a second screen (2026-09-21) - the same fault as the map click. Counted
  // over every parent of the family, not over the ones still waiting, so the total does not shrink as they are answered.
  const step = document.querySelector('#looks-step');
  if (step) {
    const last = index + 1 >= of;
    step.textContent = `${of > 1 ? `Parent ${index + 1} of ${of}. ` : ''}${last ? 'Save when ready to meet your family.' : 'Save this look, then choose the next parent.'}`;
  }
  drawAvatarPortrait(document.querySelector('#looks-preview'), picked, person.sex, person);
  drawAvatarFigure(document.querySelector('#looks-figure'), picked, person.sex, person, { walking: previewWalking, direction: previewDirection });
  document.querySelector('#looks-summary').textContent = `${capital(picked.skin)} skin · ${picked.hair} hair · ${picked.clothing} clothes`;
  const rows = document.querySelector('#looks-parts');
  rows.replaceChildren(...PARTS.map(([part, label]) => {
    const row = make('fieldset', null, 'looks-part');
    row.append(make('legend', label || 'Hair & headwear'));
    const options = make('div', null, 'looks-options');
    for (const value of person.choices[part] || []) {
      const option = make('button', null, 'looks-option');
      option.type = 'button';
      option.dataset.part = part;
      option.dataset.value = value;
      option.setAttribute('aria-pressed', String(picked[part] === value));
      const words = part === 'head' ? HEAD_WORDS[value] || value : capital(value);
      option.setAttribute('aria-label', `${label || 'Head'}: ${words}`);
      if (part === 'head') {
        const canvas = make('canvas');
        canvas.width = canvas.height = 96;
        drawAvatarPortrait(canvas, { ...picked, [part]: value }, person.sex, person);
        option.append(canvas);
      } else {
        const swatch = make('span', null, 'looks-swatch');
        swatch.style.backgroundColor = COLOURS[part][value];
        swatch.setAttribute('aria-hidden', 'true');
        option.append(swatch);
        option.classList.add('looks-colour-option');
      }
      option.append(make('span', words));
      options.append(option);
    }
    row.append(options);
    return row;
  }));
  box.dataset.entityId = person.id;
  document.querySelector('#looks-done').textContent = index + 1 < of ? 'Save & choose the next parent' : 'Save & meet your family';
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
    previewWalking = false;
    previewDirection = 's';
    document.querySelector('#looks-walk').setAttribute('aria-pressed', 'false');
    picked = { ...next.appearance };
    document.querySelector('#looks-error').textContent = '';
    draw(next, placeOf(family, next.id));
  }
  if (box.hidden) { box.hidden = false; setTimeout(() => box.querySelector('.looks-option[aria-pressed="true"]')?.focus(), 0); }
}

/**
 * `command(order)` sends an order to the server, `refresh()` refetches the family book and redraws, `family()` is the family
 * book the page holds. Supplied by public/app.js, which owns all three.
 */
export function bindLooks({ command, refresh, family }) {
  actions = { command, refresh, family };
  // The second cast sheet is lazy. Repaint the visible choices when it arrives.
  onArtReady(() => {
    if (!showing || document.querySelector('#looks')?.hidden) return;
    const book = actions.family();
    const person = waiting(book).find(one => one.id === showing);
    if (person) draw(person, placeOf(book, person.id));
  });
  loadArt({ sheets: ['people-cast2-idle', ...['mother-scarf', 'mother-braid', 'mother-loose', 'mother-straw', 'father-hat', 'father-beard', 'father-moustache', 'father-straw'].map(name => `people-family-${name}`)] });
  document.querySelector('#looks-walk')?.addEventListener('click', event => {
    previewWalking = !previewWalking;
    event.currentTarget.setAttribute('aria-pressed', String(previewWalking));
  });
  document.querySelector('#looks-turn')?.addEventListener('click', () => {
    const directions = ['s', 'e', 'n', 'w'];
    previewDirection = directions[(directions.indexOf(previewDirection) + 1) % 4];
  });
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  function animatePreview(time) {
    if (showing && previewPerson && !document.querySelector('#looks')?.hidden) {
      drawAvatarFigure(document.querySelector('#looks-figure'), picked, previewPerson.sex, previewPerson, { walking: previewWalking, direction: previewDirection, time: reduced.matches ? 0 : time });
    }
    requestAnimationFrame(animatePreview);
  }
  requestAnimationFrame(animatePreview);
  document.querySelector('#looks-parts')?.addEventListener('click', event => {
    const option = event.target.closest('button[data-part]');
    if (!option || !picked) return;
    picked = { ...picked, [option.dataset.part]: option.dataset.value };
    const book = actions.family();
    const person = waiting(book).find(one => one.id === showing);
    if (person) { draw(person, placeOf(book, person.id)); document.querySelector(`#looks-parts button[data-part="${option.dataset.part}"][data-value="${CSS.escape(option.dataset.value)}"]`)?.focus(); }
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
