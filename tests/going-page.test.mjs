// The chooser's rules on the page (public/going.js; owner, 2026-09-24: "when sending someone to travel, the game should ask how
// they'll travel"). Held here, headlessly: every order that puts somebody on a road asks before it is sent - each answer to a
// call that goes somewhere, a journey, and exactly the work the server's catalogue marks - and nothing else does; the way the
// order carries is the student's while the server says it can go and the quickest otherwise; and the one component draws the
// server's ways as they came, the quickest marked, the chosen pressed and a shut way shut with the server's reason.
import test from 'node:test';
import assert from 'node:assert/strict';
import { JOURNEY_ACTIONS, asksTheWay, chosenWay, drawWays, orderAsked } from '../public/going.js';
import { choreCatalogue } from '../sim/chores.mjs';

const catalogue = new Map(choreCatalogue().map(chore => [chore.id, chore]));

test('every order that puts somebody on a road asks how they will go, and nothing else does', () => {
  for (const action of ['travel', 'help', 'go-see', 'go-upriver', 'turn-out']) assert.ok(asksTheWay({ action, entityId: 'p' }, catalogue), `${action} did not ask`);
  assert.deepEqual([...JOURNEY_ACTIONS].sort(), ['go-see', 'go-upriver', 'help', 'travel', 'turn-out']);
  for (const chore of choreCatalogue()) {
    const asks = asksTheWay({ action: 'chore', chore: chore.id, entityId: 'p' }, catalogue);
    assert.equal(asks, Boolean(chore.journey), `${chore.id} ${asks ? 'asked' : 'did not ask'}`);
  }
  for (const chore of ['hunt-timber', 'make-furniture', 'buy-furniture', 'fetch-logs', 'go-vote', 'join-garrison']) assert.ok(asksTheWay({ action: 'chore', chore, entityId: 'p' }, catalogue), chore);
  // The errand asks it in its own popup, with the list; the stay-at-home answers, work at home and the rest never ask.
  for (const input of [{ action: 'chore', chore: 'visit-shop' }, { action: 'chore', chore: 'plant-field' }, { action: 'stay' }, { action: 'stay-put' }, { action: 'rest' }, { action: 'send-for' }, { action: 'hunt-land' }]) {
    assert.equal(asksTheWay({ ...input, entityId: 'p' }, catalogue), false, JSON.stringify(input));
  }
  // An order that already carries its way (the chooser's own) is sent, not asked again; nor one with nobody to send.
  assert.equal(asksTheWay({ action: 'travel', entityId: 'p', mode: 'horse' }, catalogue), false);
  assert.equal(asksTheWay({ action: 'travel' }, catalogue), false);
});

test('the way the order carries is the student\'s while it can go, and the quickest otherwise', () => {
  const ways = [{ id: 'horse', can: false, why: 'Rosa has the horse.' }, { id: 'foot', can: true }, { id: 'wagon', can: true }];
  assert.equal(chosenWay(ways, 'foot', null), 'foot');
  assert.equal(chosenWay(ways, 'foot', 'wagon'), 'wagon');
  assert.equal(chosenWay(ways, 'foot', 'horse'), 'foot', 'a way that was taken meanwhile is not sent');
  assert.equal(chosenWay([], null, null), null);
  assert.deepEqual(orderAsked({ id: 'x', action: 'chore', chore: 'hunt-timber', entityId: 'p', mode: 'foot' }), { action: 'chore', chore: 'hunt-timber' });
});

/** Just enough of an element to draw into and read back. */
function fake(tag, text = '', className = '') {
  const node = { tag, textContent: text, className, dataset: {}, attributes: {}, children: [], title: '', disabled: false, type: '',
    append(...kids) { this.children.push(...kids); }, replaceChildren(...kids) { this.children = kids; },
    setAttribute(name, value) { this.attributes[name] = value; } };
  return node;
}
const texts = node => [node.textContent, ...node.children.flatMap(texts)].filter(Boolean);

test('the one component draws the server\'s ways as they came: the quickest marked, the chosen pressed, a shut way shut with why', () => {
  const host = fake('div');
  const ways = [
    { id: 'horse', name: 'On the horse', carry: 7, pace: '5 miles an hour', time: 'about 35 minutes', tiring: 'Hardly tiring.', brings: 'Brings home 7 food of 10; the rest is left behind.', can: true },
    { id: 'foot', name: 'On foot', carry: 5, pace: '3 miles an hour', time: 'about 55 minutes', tiring: 'Tiring: every mile is on their legs.', can: true },
    { id: 'wagon', name: 'With the ox and wagon', carry: 20, pace: '2 miles an hour', can: false, why: 'Rosa has the ox and wagon, on the road to Gonzales.' },
  ];
  drawWays(host, { ways, quickest: 'horse', chosen: 'foot' }, fake);
  const cards = host.children[0].children;
  assert.deepEqual(cards.map(card => card.dataset.way), ['horse', 'foot', 'wagon']);
  assert.match(texts(cards[0]).join(' '), /On the horse \(quickest\)/);
  assert.ok(!texts(cards[1]).join(' ').includes('quickest'));
  assert.deepEqual(cards.map(card => card.attributes['aria-pressed']), ['false', 'true', 'false']);
  assert.deepEqual(cards.map(card => card.disabled), [false, false, true]);
  assert.equal(cards[2].title, 'Rosa has the ox and wagon, on the road to Gonzales.');
  assert.ok(texts(cards[2]).includes('Rosa has the ox and wagon, on the road to Gonzales.'), 'the reason is not on the shut way');
  assert.ok(texts(cards[0]).includes('Brings home 7 food of 10; the rest is left behind.'));
  assert.ok(texts(cards[0]).some(text => /5 miles an hour · about 35 minutes there · carries 7/.test(text)));
});
