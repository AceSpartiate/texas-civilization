// The Host's live page in words (public/live-page.js, docs/HOST_PAGE.md): what the class panel, the Rumor Mill and the
// spotlight banner say, from the Host's projection and the server's presence. Headless: the module decides nothing and
// remembers nothing, so it is tested as pure functions; the browser proof presses the page.
import test from 'node:test';
import assert from 'node:assert/strict';
import { PRESENCE_LABELS, familyRows, presenceWord, storyView, spotlightBanner } from '../public/live-page.js';

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

test('the Rumor Mill shows the running story and the latest word with its day and how firm it was; with no news it says so', () => {
  const story = { paragraphs: ['In October, the Mexican detachment withdrew, and the Texians kept the cannon.'], latest: { date: 'October 2', status: 'rumor', text: 'They say the cannon was taken.' }, key: 'k1' };
  const view = storyView(story);
  assert.deepEqual(view.paragraphs, story.paragraphs);
  assert.equal(view.latest, 'The latest, October 2 (a rumour): They say the cannon was taken.');
  assert.equal(view.key, 'k1');
  assert.equal(storyView({ ...story, latest: { ...story.latest, status: 'unconfirmed' } }).latest, 'The latest, October 2 (not yet sure): They say the cannon was taken.');
  assert.deepEqual(storyView(undefined), { key: 'quiet', paragraphs: ['No word has reached the colonies yet.'], latest: null });
  assert.deepEqual(storyView({ paragraphs: [], latest: null, key: 'x' }).paragraphs, ['No word has reached the colonies yet.']);
});

test('the spotlight banner carries the day, the words and the place, and is nothing when no spotlight stands', () => {
  assert.equal(spotlightBanner(null), null);
  const shown = spotlightBanner({ key: 'alamo-fall', minute: 100, date: 'March 6', text: 'The Alamo falls.', x: 1, y: 2 });
  assert.deepEqual(shown, { key: 'alamo-fall:100', date: 'March 6', text: 'The Alamo falls.', x: 1, y: 2 });
});
