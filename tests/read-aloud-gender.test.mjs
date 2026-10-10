// Read Aloud's auto voice (read-aloud/gender.mjs): who is likely speaking each sentence, a woman or a man, or nobody
// it can name - in which case the teacher's chosen voice reads it.
import test from 'node:test';
import assert from 'node:assert/strict';
import { assignSpeakers, genderOfWords, readerOf, speakerOf, utterances } from '../read-aloud/gender.mjs';

const g = text => speakerOf(text)?.gender ?? null;
const genders = text => assignSpeakers(text).map(p => p.gender);

test('a person named by title, kin word, name or pronoun', () => {
  for (const w of ['Mrs. Lopez', 'Grandma', 'Sarah', 'she', 'Señora García', 'Aunt May', "Tom's sister", 'her daughter'])
    assert.equal(genderOfWords(w), 'female', w);
  for (const w of ['Mr. Lee', 'Uncle Ray', 'Father', 'he', 'José', 'Davy Crockett', "Mary's brother", 'her son'])
    assert.equal(genderOfWords(w), 'male', w);
  for (const w of ['Teacher', 'the student', 'Alex', 'Lopez', 'Everyone']) assert.equal(genderOfWords(w), null, w);
});

test('who said a quotation, before or after it', () => {
  assert.equal(g('"Come here," said Father.'), 'male');
  assert.equal(g('"I am so tired," she whispered.'), 'female');
  assert.equal(g('"Where are you going?" asked the old man.'), 'male');
  assert.equal(g('Sarah asked, "Why is the sky blue?"'), 'female');
  assert.equal(g('"Line up," Mr. Lee said quietly.'), 'male');
  assert.equal(g('"Line up," Mr. Lee quietly said.'), 'male');
  assert.equal(g('Grandma: Who wants cookies?'), 'female');
  assert.equal(g('Captain Smith: Hold the line!'), 'male');
});

test('nothing that names a speaker gives null, so the chosen voice reads it', () => {
  for (const s of ['Good morning, class.', 'The cat sat on the mat.', 'She went to the store.', '"Hello," said Alex.',
    'Teacher: Open your books.', 'He is my friend.'])
    assert.equal(g(s), null, s);
});

test('a reader who says who they are reads the whole text', () => {
  assert.equal(readerOf('Hi everyone! I am a mother of three, and today I will read to you.')?.gender, 'female');
  assert.equal(readerOf("As your dad, I'm proud of you.")?.gender, 'male');
  assert.equal(readerOf('My name is Maria. I like dogs.')?.gender, 'female');
  assert.equal(readerOf('Thank you for the cards.\nLove, Grandpa')?.gender, 'male');
  assert.equal(readerOf('I am happy. I am tall.'), null);
  assert.equal(readerOf('I saw a girl at the park.'), null);
  assert.deepEqual(genders('My name is Juan. I live in Texas. "Run!" said Mom. We ran.'), ['male', 'male', 'female', 'female', 'male']);
});

test('abbreviations, initials and decimals do not end a sentence', () => {
  const texts = text => utterances(text).map(g => g.join(' '));
  assert.deepEqual(texts('The U.S. Army marched at 6 a.m. on Monday. It was 3.5 miles.'),
    ['The U.S. Army marched at 6 a.m. on Monday.', 'It was 3.5 miles.']);
  assert.deepEqual(texts('Mr. and Mrs. Smith met John F. Kennedy, e.g. in 1960. The end.'),
    ['Mr. and Mrs. Smith met John F. Kennedy, e.g. in 1960.', 'The end.']);
  assert.deepEqual(texts('It is in the U.S.\nWe live there.'), ['It is in the U.S.', 'We live there.']);
});

test('every word of a pasted story is read: wrapped lines, titles, and a stray quote mark', () => {
  const texts = text => utterances(text).map(g => g.join(' ').replace(/\s+/g, ' '));
  // Found 2026-10-08: text pasted with line breaks inside its sentences played only the last paragraph.
  assert.deepEqual(texts('The Runaway Scrape\n\nIn the spring of 1836, families across\nTexas packed what they could\n\nThey crossed rivers,\nand many lost their homes\n\nThey turned back. The war was over.'),
    ['The Runaway Scrape', 'In the spring of 1836, families across Texas packed what they could', 'They crossed rivers, and many lost their homes', 'They turned back.', 'The war was over.']);
  assert.deepEqual(texts('She said, "Wait for me.\n\nThe next day was quiet. We slept.'),
    ['She said, "Wait for me.', 'The next day was quiet.', 'We slept.']);
  // Every letter of the text is in some sentence.
  const story = 'Title\n\nOne line\nwraps here. "An open quote\n\nNext paragraph. Ends';
  assert.equal(utterances(story).flat().join('').replace(/\s/g, ''), story.replace(/\s/g, ''));
});

test('a quotation over several sentences is one speaker; narration around it is not', () => {
  assert.deepEqual(genders('The door opened. "Come in. Sit down. Be quiet," said Mrs. Brown. Nobody moved.'),
    [null, 'female', 'female', 'female', null]);
  assert.deepEqual(genders('Dad: Time for bed.\nMom: Brush your teeth first.\nOkay!'), ['male', 'female', null]);
});
