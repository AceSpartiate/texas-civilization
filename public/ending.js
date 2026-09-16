// The end of the game, as the class sees it: docs/MONEY_AND_GLORY.md steps 4 and 5.
//
// Everything here comes from `world.ending`, which the server sends only once the class has ended
// (sim/ending.mjs). Nothing is computed on this side - not the multiplication, not the order, not
// who finished first - so the page cannot show a number the server did not decide.
//
// A family sees its own reckoning; the Host sees every family's three numbers in household order,
// the family that finished first, and the questions for the class. It can be closed to look at the
// map again and opened from the same place.

const make = (tag, text, className) => {
  const node = document.createElement(tag);
  if (text !== undefined && text !== null) node.textContent = text;
  if (className) node.className = className;
  return node;
};
const reales = amount => `${amount} ${amount === 1 ? 'real' : 'reales'}`;
const signed = amount => `${amount > 0 ? '+' : '−'}${reales(Math.abs(amount))}`;

let shown = '';
let closed = false;

function familyView(family) {
  const parts = [make('h2', family.name, 'ending-title')];
  const numbers = make('dl', null, 'ending-numbers');
  for (const [term, value] of [['Coin in the house', reales(family.money)], ['Glory', String(family.glory)], ['Final number', String(family.final)]]) {
    const pair = make('div');
    pair.append(make('dt', term), make('dd', value));
    numbers.append(pair);
  }
  parts.push(numbers, make('p', family.sum, 'ending-sum'));
  const story = make('section');
  story.append(make('h3', 'Our story'));
  for (const line of family.story) story.append(make('p', line));
  parts.push(story);
  const coin = make('section');
  coin.append(make('h3', 'Where the coin came from and went'));
  if (family.coin.length) {
    const list = make('ul');
    for (const line of family.coin) list.append(make('li', `${line.date}: ${line.text} (${signed(line.coin)})`));
    coin.append(list);
  } else coin.append(make('p', 'Nothing was bought or sold for coin.'));
  parts.push(coin);
  const glory = make('section');
  glory.append(make('h3', 'What earned glory'));
  if (family.awards.length) {
    const list = make('ul');
    for (const award of family.awards) list.append(make('li', `${award.date}: ${award.text} (${award.points})`));
    glory.append(list);
  } else glory.append(make('p', 'Nobody in the family took part in the events of that October.'));
  parts.push(glory);
  return parts;
}

function hostView(closing) {
  const names = Object.fromEntries(closing.families.map(family => [family.householdId, family.name]));
  const first = closing.winners.map(id => names[id]);
  const parts = [make('h2', 'How the families finished', 'ending-title')];
  parts.push(make('p', first.length
    ? `${first.length > 1 ? `${first.slice(0, -1).join(', ')} and ${first.at(-1)} finished first, level` : `${first[0]} finished first`}, with a final number of ${closing.best}.`
    : 'No family a student played finished this class.', 'ending-winner'));
  const wrap = make('div', null, 'ending-table-wrap');
  const table = make('table', null, 'ending-table');
  const head = make('tr');
  for (const label of ['Family', 'Road miles from Gonzales', 'Heard of the cannon', 'Who went', 'Coin', 'Glory', 'Final']) head.append(make('th', label));
  const thead = make('thead');
  thead.append(head);
  table.append(thead);
  const body = make('tbody');
  for (const family of closing.families) {
    const row = make('tr');
    if (closing.winners.includes(family.householdId)) row.dataset.first = 'true';
    row.append(
      make('td', family.automatic ? `${family.name} (nobody played them)` : family.name),
      make('td', family.miles ?? '—'),
      make('td', family.heard || 'never'),
      make('td', family.went.length ? family.went.join(', ') : 'nobody'),
      make('td', reales(family.money)),
      make('td', String(family.glory)),
      make('td', String(family.final)),
    );
    body.append(row);
  }
  table.append(body);
  wrap.append(table);
  parts.push(wrap, make('p', 'Final number = coin × (1 + glory). A family with no coin is counted as having 1 real.', 'ending-sum'));
  const talk = make('section');
  talk.append(make('h3', 'For the class'));
  const list = make('ol');
  for (const question of closing.discussion) list.append(make('li', question));
  talk.append(list);
  parts.push(talk);
  return parts;
}

/** Draw the ending if there is one, once per change, leaving it closed if somebody closed it. */
export function renderEnding(world) {
  const panel = document.querySelector('#ending');
  const reopen = document.querySelector('#ending-open');
  const ending = world?.ending;
  if (!ending || !(ending.family || ending.host)) {
    panel.hidden = true; reopen.hidden = true; shown = ''; closed = false;
    return;
  }
  const key = JSON.stringify(ending);
  if (key !== shown) {
    shown = key;
    document.querySelector('#ending-body').replaceChildren(...(ending.host ? hostView(ending.host) : familyView(ending.family)));
  }
  panel.hidden = closed;
  reopen.hidden = !closed;
}

export function bindEnding() {
  const panel = document.querySelector('#ending');
  const reopen = document.querySelector('#ending-open');
  document.querySelector('#ending-close').addEventListener('click', () => { closed = true; panel.hidden = true; reopen.hidden = false; reopen.focus(); });
  reopen.addEventListener('click', () => { closed = false; reopen.hidden = true; panel.hidden = false; document.querySelector('#ending-close').focus(); });
}
