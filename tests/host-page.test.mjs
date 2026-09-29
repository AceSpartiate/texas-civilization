// The Host's live page in words (public/live-page.js, docs/HOST_PAGE.md): what the class panel, the Rumor Mill and the
// spotlight banner say, from the Host's projection and the server's presence. Headless: the module decides nothing and
// remembers nothing, so it is tested as pure functions; the browser proof presses the page.
import test from 'node:test';
import assert from 'node:assert/strict';
import { PRESENCE_LABELS, emptyPauseWords, familyRows, presenceWord, storyView, spotlightBanner } from '../public/live-page.js';

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
    { id: 'hh-1', name: 'Amos\'s family', settlement: 'Columbia', played: true, waiting: 2, guided: 'stopped the guided start at step 4', people: [{ name: 'Amos', role: 'father', where: 'with the army at the camp above Béxar' }] },
    { id: 'hh-2', name: 'Asa\'s family', settlement: 'Liberty', waiting: 0, people: [{ name: 'Asa', role: 'father', where: 'at home: hunt in the timber' }] },
  ] };
  const rows = familyRows(live, { households: { 'hh-1': 'here' } });
  assert.deepEqual(rows.map(r => [r.id, r.presence, r.waiting, r.settlement]), [['hh-1', 'here', 2, 'Columbia'], ['hh-2', 'nobody', 0, 'Liberty']]);
  // The guided start's line (docs/HOST_PAGE.md §2.5), passed through in the world's own words, and empty where there is none.
  assert.deepEqual(rows.map(r => r.guided), ['stopped the guided start at step 4', '']);
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

test('each row names the student playing the family and, in the lobby, marks it ready (owner, 2026-09-29: "Show name + ready")', () => {
  const live = { families: [
    { id: 'hh-1', name: 'the Reyes family', played: true, ready: true, waiting: 0, people: [] },
    { id: 'hh-2', name: 'the Cruz family', played: true, waiting: 0, people: [] },
    { id: 'hh-3', name: 'the Hale family', waiting: 0, people: [] },
  ] };
  const rows = familyRows(live, { households: { 'hh-1': 'here', 'hh-2': 'here' }, students: { 'hh-1': 'Sam Reyes', 'hh-2': 'Ana Cruz' } });
  assert.deepEqual(rows.map(r => [r.id, r.student, r.ready]), [['hh-1', 'Sam Reyes', true], ['hh-2', 'Ana Cruz', false], ['hh-3', '', false]]);
  assert.deepEqual(familyRows(live, { households: {} }).map(r => r.student), ['', '', ''], 'a presence with no names names somebody');
});

test('a class that paused itself says so plainly, with when and why and what to press; nothing when it did not', () => {
  const words = emptyPauseWords({ at: '2026-09-29T15:42:00.000Z', ms: 180000 }, () => '10:42 AM');
  assert.equal(words, 'The class paused itself at 10:42 AM: no student had the game open for 3 minutes, so nothing went on without them. Press Resume when the class is back.');
  assert.match(emptyPauseWords({ at: '2026-09-29T15:42:00.000Z', ms: 60000 }, () => 'then'), /for 1 minute,/);
  assert.match(emptyPauseWords({ at: '2026-09-29T15:42:00.000Z', ms: 3000 }, () => 'then'), /for 3 seconds,/);
  assert.equal(emptyPauseWords(undefined), '');
  assert.equal(emptyPauseWords(null), '');
});
