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

/**
 * What nobody in Texas knew (sim/surprise.mjs, owner 2026-09-26: the true story of the snow march "At the ending"): the
 * Mexican army's snow and why Béxar was caught unprepared, as the server wrote it, once the class has lived February 23.
 */
function revealView(reveal) {
  const section = make('section', null, 'ending-reveal');
  section.append(make('h3', reveal.title));
  for (const paragraph of reveal.paragraphs) section.append(make('p', paragraph));
  if (reveal.ask) section.append(make('p', reveal.ask, 'ending-ask'));
  return section;
}

/**
 * A family's name in the Host's tables, marked when no student was playing it at the end (sim/ending.mjs): one nobody ever
 * played, or one a student played that the computer was running when the class ended - its student away (owner, 2026-09-29:
 * "Any played family", marked if the computer finished it). Only the first is "nobody played them".
 */
export const familyLabel = family => family.finishedByDirector ? `${family.name} (finished by the computer)` : family.automatic ? `${family.name} (nobody played them)` : family.name;

let shown = '';
let closed = false;

function familyView(family) {
  const parts = [make('h2', family.name, 'ending-title')];
  const numbers = make('dl', null, 'ending-numbers');
  // Between periods, coin and land only (owner, 2026-09-28; sim/ending.mjs `interimFamily`, VISION §20): no glory, and none of
  // the ending's story, which is the end's to tell.
  const shown = family.interim
    ? [['Coin in the house', reales(family.money)], ['Land promised', family.land ? `${family.acres} acres` : 'none']]
    : [['Coin in the house', reales(family.money)], ['Glory', String(family.glory)], ['Final number', String(family.final)]];
  for (const [term, value] of shown) {
    const pair = make('div');
    pair.append(make('dt', term), make('dd', value));
    numbers.append(pair);
  }
  if (family.interim) return [...parts, make('p', 'This is where your family stands so far. The war is not over: the next class goes on from here.', 'ending-sum'), numbers];
  // The sum, then the same sum said a step at a time in whole numbers (triage 2026-09-29 2.10): the server's words.
  parts.push(numbers, make('p', family.sum, 'ending-sum'));
  if (family.sumSaid) parts.push(make('p', family.sumSaid, 'ending-said'));
  const story = make('section');
  story.append(make('h3', 'Our story'));
  for (const line of family.story) story.append(make('p', line));
  // Questions about the family's own story (sim/ending-story.mjs), the server's words.
  if (family.questions?.length && !family.interim) {
    const asked = make('ul', null, 'ending-questions');
    for (const question of family.questions) asked.append(make('li', question, 'ending-ask'));
    story.append(asked);
  }
  parts.push(story);
  const coin = make('section');
  coin.append(make('h3', 'Where the coin came from and went'));
  if (family.coin.length) {
    const list = make('ul');
    for (const line of family.coin) list.append(make('li', `${line.date}: ${line.text} (${signed(line.coin)})`));
    coin.append(list);
  } else coin.append(make('p', 'Nothing was bought or sold for coin.'));
  parts.push(coin);
  // Who was taken prisoner in the spring, and what it took from the count: the server's words (sim/ending.mjs), none of its own.
  if (family.prisoners?.length) {
    const taken = make('section', null, 'ending-prisoners');
    taken.append(make('h3', 'Taken prisoner'));
    const list = make('ul');
    for (const one of family.prisoners) list.append(make('li', one.text));
    taken.append(list, make('p', family.prisonerRule, 'ending-sum'));
    parts.push(taken);
  }
  const glory = make('section');
  glory.append(make('h3', 'What earned glory'));
  // Each award with its own sum, the part's weight times the miles' multiplier, and not a bare number (triage 2026-09-29 2.10);
  // and, with none, a line true of any period's ending, not only October's (3.6).
  if (family.awards.length) {
    if (family.gloryRule) glory.append(make('p', family.gloryRule, 'ending-said'));
    const list = make('ul', null, 'ending-awards');
    for (const award of family.awards) {
      const item = make('li', `${award.date}: ${award.text}`);
      if (award.worth) item.append(make('span', award.worth, 'ending-worth'));
      list.append(item);
    }
    glory.append(list);
  } else glory.append(make('p', 'No award was earned.'));
  parts.push(glory);
  // What the family did for its neighbours and they for it (sim/neighbourly.mjs, owner 2026-09-28): the server's words.
  if (family.neighbours?.length) {
    const neighbours = make('section', null, 'ending-neighbours');
    neighbours.append(make('h3', 'Neighbours'));
    const list = make('ul');
    for (const line of family.neighbours) list.append(make('li', `${line.date}: ${line.text}`));
    neighbours.append(list);
    parts.push(neighbours);
  }
  if (family.reveal) parts.push(revealView(family.reveal));
  return parts;
}

/**
 * The Host between periods: coin and land only (owner, 2026-09-28; sim/ending.mjs `interimHost`; VISION §20: glory is hidden from
 * the Host too until the ending). Every family's coin and land in household order, nobody named, and the next period offered.
 */
function interimHostView(closing) {
  const wrap = make('div', null, 'ending-table-wrap');
  const table = make('table', null, 'ending-table');
  const head = make('tr');
  for (const label of ['Family', 'Coin', 'Land']) head.append(make('th', label));
  const thead = make('thead');
  thead.append(head);
  const body = make('tbody');
  for (const family of closing.families) {
    const row = make('tr');
    row.append(make('td', familyLabel(family)), make('td', reales(family.money)), make('td', family.land ? reales(family.land) : '—'));
    body.append(row);
  }
  table.append(thead, body);
  wrap.append(table);
  return [make('h2', 'How the families stand so far', 'ending-title'),
    make('p', `The war is not over. The class goes on from here: press ${closing.nextLabel || 'Continue'} when the class meets again.`, 'ending-sum'), wrap];
}

function hostView(closing) {
  if (closing.interim) return interimHostView(closing);
  const names = Object.fromEntries(closing.families.map(family => [family.householdId, family.name]));
  const parts = [make('h2', 'How the families finished', 'ending-title')];
  const first = closing.winners.map(id => names[id]);
  parts.push(make('p', first.length
    ? `${first.length > 1 ? `${first.slice(0, -1).join(', ')} and ${first.at(-1)} finished first, level` : `${first[0]} finished first`}, with a final number of ${closing.best}.`
    : 'No family a student played finished this class.', 'ending-winner'));
  const wrap = make('div', null, 'ending-table-wrap');
  const table = make('table', null, 'ending-table');
  const head = make('tr');
  // The whole war, not only October (triage 2026-09-29 2.8): the Alamo's news, the spring's choice and the farm beside the
  // cannon's news. The road miles from Gonzales are in each family's own story.
  const labels = ['Family', 'Who went', 'Heard of the cannon', 'Heard the Alamo fell', 'In the spring', 'Farm', 'Taken prisoner', 'Coin', 'Glory', 'Land', 'Final'];
  for (const label of labels) head.append(make('th', label));
  const thead = make('thead');
  thead.append(head);
  table.append(thead);
  const body = make('tbody');
  for (const family of closing.families) {
    const row = make('tr');
    if (closing.winners.includes(family.householdId)) row.dataset.first = 'true';
    row.append(
      make('td', familyLabel(family)),
      make('td', family.went.length ? family.went.join(', ') : 'nobody'),
      make('td', family.heard || 'never'),
      make('td', family.heardAlamo || '—'),
      make('td', family.spring || '—'),
      make('td', family.farm || '—'),
      make('td', family.prisoners ? String(family.prisoners) : '—'),
      make('td', reales(family.money)),
      make('td', String(family.glory)),
      make('td', family.land ? reales(family.land) : '—'),
      make('td', String(family.final)),
    );
    body.append(row);
  }
  table.append(body);
  wrap.append(table);
  // The formula as the server counts it, prisoners' share and all, written one way (triage 2026-09-29 3.7; sim/ending.mjs
  // `FORMULA_WORDS`): the page has no copy of its own to drift from it.
  parts.push(wrap);
  if (closing.formulaWords) parts.push(make('p', closing.formulaWords, 'ending-sum'));
  // Who helped whom across the class (sim/neighbourly.mjs `helpedLines`), one line a pair, the server's words.
  if (closing.helped?.length) {
    const helped = make('section', null, 'ending-helped');
    helped.append(make('h3', 'Who helped whom'));
    const list = make('ul');
    for (const line of closing.helped) list.append(make('li', line));
    helped.append(list);
    parts.push(helped);
  }
  const talk = make('section');
  talk.append(make('h3', 'For the class'));
  const list = make('ol');
  for (const question of closing.discussion) list.append(make('li', question));
  talk.append(list);
  parts.push(talk);
  if (closing.reveal) parts.push(revealView(closing.reveal));
  return parts;
}

/** Draw the ending if there is one, once per change, leaving it closed if somebody closed it. */
export function renderEnding(world) {
  const panel = document.querySelector('#ending');
  const reopen = document.querySelector('#ending-open');
  const ending = world?.ending;
  const interim = Boolean((ending?.host || ending?.family)?.interim);
  document.querySelector('#ending-eyebrow').textContent = interim ? 'THE STORY SO FAR' : 'THE END OF THE STORY';
  reopen.textContent = interim ? 'The story so far' : 'How it ended';
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
