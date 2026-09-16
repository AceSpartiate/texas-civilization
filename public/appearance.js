// What the family looks like, in the family book: docs/SETTLING_IN.md §7, build step 8.
//
// A parent's skin tone, hair, clothing colour and hat, beard, bonnet or pinned hair are chosen here,
// each saved the moment it is changed; a child is shown in words, taking after the parents, with
// nothing to choose. The choices and the words come from the server's family book
// (`familyProjection` in sim/family.mjs), and the server refuses anything not on offer.
//
// stand-in: docs/ART_REQUESTS.md, request 2026-09-12 (second) - layered people. The figure on the
// map is still chosen by sex and age; these choices show only here, in words, until layered people
// sheets let the renderer draw them.

const PARTS = Object.freeze([
  ['skin', 'Skin'],
  ['hair', 'Hair'],
  ['clothing', 'Clothes'],
  ['head', null],
]);

let actions = null;
let shown = '';

const make = (tag, text, className) => {
  const node = document.createElement(tag);
  if (text !== undefined && text !== null) node.textContent = text;
  if (className) node.className = className;
  return node;
};

function parentRow(person) {
  const item = make('li', null, 'looks-row');
  item.dataset.entityId = person.id;
  item.append(make('span', `${person.name}: ${person.looks}`, 'looks-words'));
  const fields = make('div', null, 'looks-fields');
  for (const [part, label] of PARTS) {
    const id = `looks-${part}-${person.id}`;
    const said = part === 'head' ? (person.choices.head.includes('hat') ? 'Hat or beard' : 'Bonnet or hair') : label;
    const wrap = make('label', said, 'looks-field');
    wrap.htmlFor = id;
    const select = make('select');
    select.id = id;
    select.dataset.entityId = person.id;
    select.dataset.part = part;
    for (const value of person.choices[part] || []) {
      const option = make('option', value);
      option.value = value;
      option.selected = person.appearance?.[part] === value;
      select.append(option);
    }
    wrap.append(select);
    fields.append(wrap);
  }
  item.append(fields);
  return item;
}

/** Draw the looks for this family, redrawing only when what the server says has changed. */
export function renderLooks(family) {
  const list = document.querySelector('#family-looks');
  if (!list) return;
  const people = family && !family.canRoll ? family.people.filter(person => person.looks) : [];
  const key = JSON.stringify(people.map(person => [person.id, person.name, person.looks, person.choices ? 1 : 0]));
  if (key === shown) return;
  // Never redraw under somebody who is choosing.
  if (list.contains(document.activeElement) && document.activeElement.tagName === 'SELECT') return;
  shown = key;
  list.hidden = !people.length;
  document.querySelector('#family-looks-title').hidden = !people.length;
  list.replaceChildren(...people.map(person => person.choices
    ? parentRow(person)
    : make('li', `${person.name}: ${person.looks}. Takes after their parents.`, 'looks-row looks-child')));
}

/**
 * `command(order)` sends an order to the server, `refresh()` refetches the family book and redraws,
 * `say(message)` shows a refusal. Supplied by public/app.js, which owns all three.
 */
export function bindLooks({ command, refresh, say }) {
  actions = { command, refresh, say };
  document.querySelector('#family-looks')?.addEventListener('change', async event => {
    const select = event.target.closest('select[data-part]');
    if (!select || !actions) return;
    try {
      await actions.command({ action: 'set-appearance', entityId: select.dataset.entityId, [select.dataset.part]: select.value });
      select.blur();
      shown = '';
      actions.refresh();
    } catch (error) { actions.say(error.message); }
  });
}
