// The Rumor Mill as one running story (owner, 2026-09-18, docs/HOST_PAGE.md §2.2): "a short, easy to read story" that
// "will adapt and change as new rumors flow in. Some are true, some aren't." By the owner's choice the story replaces the
// list, word that changed keeps its turn, and the story draws on everything any family has heard - which brings in the
// Alamo, Goliad and San Jacinto, told family by family and missing from the old public list.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { rollFamily, stepWorld } from '../sim/world.mjs';
import { beginSecondPeriod, beginThirdPeriod } from '../sim/periods.mjs';
import { establishTruth, learn } from '../sim/knowledge.mjs';
import { STORY_LINES, rumourStory } from '../sim/rumour-story.mjs';

const until = (world, done) => { for (let t = 0; t < 9000 && !done() && world.status === 'running'; t++) stepWorld(world); };
let played = null;
/** A class of eight played through all three periods with nobody at the controls. */
const warOver = () => played ??= (() => {
  const world = createGonzalesWorld('rumour-story', 8, { map: 'colonies', neighbours: true });
  for (const household of Object.values(world.households)) rollFamily(world, household);
  world.status = 'running'; until(world, () => world.director.complete);
  beginSecondPeriod(world); world.status = 'running'; until(world, () => world.director.complete);
  beginThirdPeriod(world); world.status = 'running'; until(world, () => world.director.complete);
  return world;
})();

test('the whole war is in the story, the third period too, a paragraph a month in order, every piece in its own written line', () => {
  const world = warOver();
  const story = rumourStory(world);
  const text = story.paragraphs.join(' ');
  for (const [topicId, words] of [['alamo-fall', /the Alamo fell at dawn on March 6/], ['goliad-defeat', /surrendered his whole command/], ['san-jacinto', /destroyed Santa Anna's army at San Jacinto/], ['cannon-request', /would not give it up/]]) {
    assert.ok(story.topics.includes(topicId), `${topicId} is not in the story`);
    assert.match(text, words, `${topicId} is not told in its line`);
  }
  // Every piece of news the war told has a line written for it: none falls back on its report's words.
  const unwritten = story.topics.filter(topicId => !STORY_LINES[topicId]);
  assert.deepEqual(unwritten, [], 'news the story has no line for');
  assert.doesNotMatch(text, /word came that "/, 'a piece fell back on its report\'s words');
  // A paragraph a month, from September 1835 to April 1836, the new year named once.
  assert.deepEqual(story.paragraphs.map(paragraph => paragraph.match(/^In (\w+(?: 1836)?),/)?.[1]), ['September', 'October', 'November', 'December', 'January 1836', 'February', 'March', 'April']);
  assert.equal(story.latest.topicId, 'san-jacinto', 'the latest word is not the last news of the war');
  // Short enough to read aloud: no sentence of it runs past sixty words.
  for (const sentence of text.split(/(?<=\.) (?=[A-Z])/)) assert.ok(sentence.split(/\s+/).length <= 60, `a sentence runs on: ${sentence}`);
});

test('word that changed keeps its turn: what the first word had, then the fuller word, or that it was not so', () => {
  const text = rumourStory(warOver()).paragraphs.join(' ');
  assert.match(text, /First word had it that a Mexican pack train was coming in to Béxar with silver to pay the garrison, but it was not so: the pack train carried only grass for the horses\./i);
  assert.match(text, /first word had it that two Mexican riders said the Alamo had fallen, though General Houston thought them spies\. Fuller word said the Alamo fell/i);
});

test('the story says how firm the word was and how far it went, never the truth; it changes as the word does', () => {
  const world = createGonzalesWorld('rumour-story-turn', 5, { map: 'colonies', neighbours: true });
  world.status = 'running';
  establishTruth(world, { id: 'test-topic', text: 'The truth of it.', siteId: 'gonzales' });
  learn(world, 'hh-1', 'test-topic', { status: 'rumor', source: 'A rider', text: 'They say the cannon was taken.' });
  const rumour = rumourStory(world);
  assert.match(rumour.paragraphs.join(' '), /it was said that word came that "They say the cannon was taken" \(heard by 1 of 5 families\)\./);
  assert.equal(rumour.latest.status, 'rumor');
  // Firmer, different word reaches three families: the story turns, and its key changes so the page rewrites it.
  world.minute += 600;
  for (const id of ['hh-1', 'hh-2', 'hh-3']) learn(world, id, 'test-topic', { status: 'confirmed', source: 'An express', text: 'The cannon was fired and kept.' });
  const firmer = rumourStory(world);
  assert.notEqual(firmer.key, rumour.key, 'the story did not change with the word');
  assert.match(firmer.paragraphs.join(' '), /first word had it that "They say the cannon was taken"\. Fuller word said word came that "The cannon was fired and kept" \(heard by 3 of 5 families\)\./i);
  // The rumour reaching a far family late does not undo the firmer word, nor make it the latest news.
  world.minute += 600;
  learn(world, 'hh-4', 'test-topic', { status: 'rumor', source: 'A rider', text: 'They say the cannon was taken.' });
  const late = rumourStory(world);
  assert.match(late.paragraphs.join(' '), /Fuller word said word came that "The cannon was fired and kept" \(heard by 4 of 5 families\)/i);
  assert.equal(late.latest.status, 'confirmed', 'a late rumour became the latest word');
  assert.doesNotMatch(JSON.stringify(late), /The truth of it/, 'the story told the truth rather than what was heard');
});
