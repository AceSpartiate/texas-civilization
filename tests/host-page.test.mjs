// The Host's live page in words (public/live-page.js, docs/HOST_PAGE.md): what the class panel, the Rumor Mill and the
// spotlight banner say, from the Host's projection and the server's presence. Headless: the module decides nothing and
// remembers nothing, so it is tested as pure functions; the browser proof presses the page.
import test from 'node:test';
import assert from 'node:assert/strict';
import { PRESENCE_LABELS, familyRows, presenceWord, rumourLines, spotlightBanner } from '../public/live-page.js';

test('a family\'s presence word: nobody playing, here, away a moment, playing itself, gone', () => {
  const presence = { households: { 'hh-1': 'here', 'hh-2': 'away', 'hh-3': 'gone' } };
  assert.equal(presenceWord({ id: 'hh-9' }, presence), 'nobody');
  assert.equal(presenceWord({ id: 'hh-1', played: true }, presence), 'here');
  assert.equal(presenceWord({ id: 'hh-2', played: true }, presence), 'away');
  assert.equal(presenceWord({ id: 'hh-3', played: true }, presence), 'gone');
  assert.equal(presenceWord({ id: 'hh-3', played: true, absent: true }, presence), 'absent', 'the world\'s word does not outrank the grace');
  assert.equal(presenceWord({ id: 'hh-4', played: true }, undefined), 'gone');
  for (const word of ['nobody', 'here', 'away', 'absent', 'gone']) assert.ok(PRESENCE_LABELS[word], `no label for ${word}`);
  assert.equal(PRESENCE_LABELS.absent, 'playing itself');
});

test('the class rows carry each family\'s name, settlement, presence, how many things wait, and each person in words', () => {
  const live = { families: [
    { id: 'hh-1', name: 'Amos\'s family', settlement: 'Columbia', played: true, waiting: 2, people: [{ name: 'Amos', role: 'father', where: 'with the army at the camp above Béxar' }] },
    { id: 'hh-2', name: 'Asa\'s family', settlement: 'Liberty', waiting: 0, people: [{ name: 'Asa', role: 'father', where: 'at home: hunt in the timber' }] },
  ] };
  const rows = familyRows(live, { households: { 'hh-1': 'here' } });
  assert.deepEqual(rows.map(r => [r.id, r.presence, r.waiting, r.settlement]), [['hh-1', 'here', 2, 'Columbia'], ['hh-2', 'nobody', 0, 'Liberty']]);
  assert.deepEqual(rows[0].people, [{ name: 'Amos', role: 'father', where: 'with the army at the camp above Béxar' }]);
  assert.deepEqual(familyRows(null, null), []);
});

test('the Rumor Mill\'s pieces say the day, how firm the word is and how far it travelled, keep the earlier tellings, and change key when the story changes', () => {
  const pieces = rumourLines([
    { topicId: 'cannon', text: 'The cannon was fired and kept.', status: 'confirmed', minute: 5400, date: 'October 2', heardBy: 3, families: 5, earlier: [{ date: 'October 1', status: 'rumor', text: 'They say the cannon was taken.' }] },
    { topicId: 'silver', text: 'A pack train of silver is on the road.', status: 'rumor', minute: 4000, date: 'November 26', heardBy: 1, families: 5, earlier: [] },
  ]);
  assert.equal(pieces[0].head, 'October 2 · confirmed · heard by 3 of 5 families');
  assert.equal(pieces[0].text, 'The cannon was fired and kept.');
  assert.deepEqual(pieces[0].earlier, [{ head: 'October 1 · a rumour', text: 'They say the cannon was taken.' }]);
  assert.equal(pieces[1].head, 'November 26 · a rumour · heard by 1 of 5 families');
  const firmer = rumourLines([{ topicId: 'silver', text: 'It was grass.', status: 'contradicted', minute: 4100, date: 'November 26', heardBy: 4, families: 5, earlier: [] }]);
  assert.notEqual(firmer[0].key, pieces[1].key, 'a story that changed kept its key');
  assert.deepEqual(rumourLines(undefined), []);
});

test('the spotlight banner carries the day, the words and the place, and is nothing when no spotlight stands', () => {
  assert.equal(spotlightBanner(null), null);
  const shown = spotlightBanner({ key: 'alamo-fall', minute: 100, date: 'March 6', text: 'The Alamo falls.', x: 1, y: 2 });
  assert.deepEqual(shown, { key: 'alamo-fall:100', date: 'March 6', text: 'The Alamo falls.', x: 1, y: 2 });
});
