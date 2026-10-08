// Read Aloud's auto voice (read-aloud/gender.mjs): who is likely speaking each sentence, a woman or a man, or nobody
// it can name - in which case the teacher's chosen voice reads it.
import test from 'node:test';
import assert from 'node:assert/strict';
import { assignSpeakers, genderOfWords, readerOf, speakerOf } from '../read-aloud/gender.mjs';

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

test('a quotation over several sentences is one speaker; narration around it is not', () => {
  assert.deepEqual(genders('The door opened. "Come in. Sit down. Be quiet," said Mrs. Brown. Nobody moved.'),
    [null, 'female', 'female', 'female', null]);
  assert.deepEqual(genders('Dad: Time for bed.\nMom: Brush your teeth first.\nOkay!'), ['male', 'female', null]);
});
