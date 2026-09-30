// Read aloud on the end-of-game breakdown and the starving card (owner, 2026-09-30: "Yes, add it"; docs/READ_ALOUD.md §7).
//
// What each part of a family's breakdown reads (public/ending.js `endingReading`), that the Host will speak all of it, that a
// long reading is asked a line at a time and a sentence the Host will not speak is passed over (public/read-aloud.js), that
// thirty families pressing their story at once each hear their first sentence before any hears its second
// (server/voice/service.mjs `nextPressed`), and what the messages card reads (`cardLines`).
//
// Proven by injection on 2026-09-30 (scripts/read-aloud-injections.mjs): a part of the breakdown left unread, a sign read as a
// symbol, the whole reading asked at once, a refused sentence stopping the reading, the pressed queue first-come-first-served,
// and the card's title said twice - each failed only its own test.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { settleMeans } from '../sim/means.mjs';
import { applyAction, projectWorld, stepWorld } from '../sim/world.mjs';
import { learn } from '../sim/knowledge.mjs';
import { familyEnding } from '../sim/ending.mjs';
import { withoutStartingCoin } from './support/settled.mjs';
import { endingReading } from '../public/ending.js';
import { cardLines, createReadAloud } from '../public/read-aloud.js';
import { createVoice, wordsFrom } from '../server/voice/service.mjs';
import { sourceVocabulary } from '../server/voice/inventory.mjs';
import { splitSentences } from '../server/voice/text.mjs';

// ------------------------------------------------------------------ a class played to its end (as tests/ending.test.mjs plays it)
let ended = null;
function endedClass() {
  if (ended) return ended;
  const world = createGonzalesWorld('ending', 5);
  world.status = 'running';
  settleMeans(world); withoutStartingCoin(world); world.households['hh-3'].resources.money = 4;
  while (!world.truth['cannon-request']) stepWorld(world);
  learn(world, 'hh-1', 'cannon-request', { status: 'confirmed', source: 'Somebody who saw it' });
  let answered = false;
  while (world.status === 'running') {
    stepWorld(world);
    const call = projectWorld(world, 'hh-1', 'student', { includeMap: false }).request;
    if (call?.status !== 'open') continue;
    if (call.kind === 'supplies' && !answered) { applyAction(world, 'hh-1', { action: 'help', entityId: world.households['hh-1'].principalId }); answered = true; }
    if (call.kind === 'march') applyAction(world, 'hh-1', { action: 'go-upriver', entityId: call.actorId });
  }
  return (ended = world);
}
/** A family's own breakdown as the server sends it, with every part it can have. */
function fullEnding() {
  const world = endedClass();
  const family = structuredClone(familyEnding(world, 'hh-1'));
  family.coin = [...family.coin, { date: 'October 3', text: 'Bought powder at the store', coin: -2 }, { date: 'October 4', text: 'Sold cotton', coin: 3 }];
  family.prisoners = [{ text: 'Thomas was taken prisoner at Goliad.' }];
  family.prisonerRule = 'Each person taken prisoner takes a share from the count.';
  family.neighbours = [{ date: 'October 2', text: 'The family carried food to its neighbours' }];
  family.reveal = { title: 'What nobody in Texas knew', paragraphs: ['The Mexican army marched through the snow.'], ask: 'Why was Béxar caught unprepared?' };
  return { world, family };
}

test('every part of a family\'s breakdown is read, in the server\'s words, in the order shown, with no sign read as a symbol', () => {
  const { family } = fullEnding();
  const reading = endingReading(family);
  assert.deepEqual(Object.keys(reading), ['numbers', 'story', 'coin', 'glory', 'prisoners', 'neighbours', 'reveal']);
  const all = Object.values(reading).flat();
  const has = text => all.some(line => line.includes(String(text).replace(/[.]$/, '')));
  for (const text of [family.name, ...family.story, ...(family.questions || []), ...family.coin.map(line => line.text),
    ...family.awards.map(award => award.text), ...family.prisoners.map(one => one.text), family.prisonerRule,
    ...family.neighbours.map(line => line.text), family.reveal.title, ...family.reveal.paragraphs, family.reveal.ask].filter(Boolean)) assert.ok(has(text), `not read: ${text}`);
  // The sums, in words: every number of the sum said, "times", and what it equals.
  const sum = reading.numbers.find(line => / times /.test(line) && new RegExp(`equals ${family.final}\\.$`).test(line));
  assert.ok(sum, `the sum is not read in words: ${reading.numbers.join(' | ')}`);
  for (const number of family.sum.match(/\d+/g)) assert.ok(sum.includes(number), `the sum's ${number} is not read: ${sum}`);
  if (family.sumSaid) assert.ok(reading.numbers.length >= 6, 'the sum said a step at a time is not read');
  for (const award of family.awards.filter(one => one.worth)) assert.ok(reading.glory.some(line => line.includes(award.text) && award.worth.match(/\d+/g).every(n => line.includes(n))), `an award's worth is not read: ${award.worth}`);
  assert.ok(has(`Final number: ${family.final}`) && has(`Glory: ${family.glory}`), 'the numbers are not read');
  assert.deepEqual(reading.story.slice(1, 1 + family.story.length), family.story.map(line => (/[.!?]$/.test(line) ? line : `${line}.`)), 'the story is read out of order');
  // Coin in and out in words: the page shows + and −, which a voice would read as "plus" or drop.
  assert.ok(reading.coin.some(line => /Bought powder at the store, went out: 2 reales\./.test(line)), reading.coin.join(' | '));
  assert.ok(reading.coin.some(line => /Sold cotton, came in: 3 reales\./.test(line)));
  for (const line of all) {
    assert.doesNotMatch(line, /[+−]/, `a sign is read as a symbol: ${line}`);
    assert.match(line, /[.!?…]["'”’)]?$/, `a line with no end: ${line}`);
  }
  // Between periods, coin and land only, as shown.
  const interim = endingReading({ interim: true, name: 'The Crane family', money: 3, land: true, acres: 177 });
  assert.deepEqual(Object.keys(interim), ['numbers']);
  assert.ok(interim.numbers.includes('Land promised: 177 acres.') && interim.numbers.includes('Coin in the house: 3 reales.'));
});

test('the Host will speak every sentence of a real family\'s breakdown: none is refused as words the game never writes', () => {
  const { world } = fullEnding();
  const family = familyEnding(world, 'hh-1');
  // The Host's own check (server/voice/service.mjs `speakable`), against the game's words and the class's names.
  const voice = createVoice({ vocabulary: sourceVocabulary() }), names = wordsFrom(world);
  const refused = Object.values(endingReading(family)).flat().flatMap(splitSentences).filter(sentence => !voice.speakable(sentence, names));
  assert.deepEqual(refused, [], 'sentences of the breakdown the Host would refuse to speak');
});

// ------------------------------------------------------------------ the page's reading, with a pretend page and a pretend Host
class Element {
  constructor(tag) { Object.assign(this, { tagName: tag, children: [], dataset: {}, attrs: {}, listeners: {}, hidden: false, textContent: '', className: '', isConnected: true }); }
  append(...nodes) { this.children.push(...nodes); }
  setAttribute(name, value) { this.attrs[name] = value; }
  addEventListener(type, fn) { (this.listeners[type] ??= []).push(fn); }
  get classList() { return { contains: name => this.className.split(' ').includes(name) }; }
  querySelector(selector) { const name = selector.slice(1); const find = node => { for (const child of node.children) { if (child.className?.split?.(' ').includes(name)) return child; const found = find(child); if (found) return found; } return null; }; return find(this); }
  click() { for (const fn of this.listeners.click || []) fn({ stopPropagation() {} }); }
}
/** A page whose Host answers from `said` (sentence -> 'ready' | 'refused' | a count of askings until ready). */
function page(said) {
  const posts = [], played = [];
  class Audio {
    play() { played.push(this.src.replace(/^\/voice\/|\.opus$/g, '')); setTimeout(() => this.onended?.(), 1); return Promise.resolve(); }
    pause() {} removeAttribute() {} load() {}
  }
  const win = { setTimeout, performance, Audio };
  const doc = { createElement: tag => new Element(tag), createElementNS: (_, tag) => new Element(tag) };
  const ask = async (path, body) => {
    if (!body) return { available: true };
    posts.push({ lines: body.lines.length, at: played.length });
    return { parts: body.lines.flatMap(line => splitSentences(line.text)).map(sentence => {
      const state = said[sentence];
      if (typeof state === 'number') { said[sentence] = state - 1; return state > 0 ? { key: sentence, ready: false, making: true } : { key: sentence, ready: true }; }
      return state === 'refused' ? { key: sentence, ready: false, making: false, refused: true } : { key: sentence, ready: true };
    }) };
  };
  const reading = createReadAloud({ ask, settings: () => ({ master: 1, muted: false }), win, doc, pollMs: 1 });
  return { reading, posts, played, win };
}
const until = async check => { for (let i = 0; i < 500 && !check(); i++) await new Promise(resolve => setTimeout(resolve, 2)); };

test('a long reading is asked for a line at a time, every line at the press, and read in order', async () => {
  const lines = Array.from({ length: 30 }, (_, i) => `Line ${i + 1} of the story is here.`);
  const { reading, posts, played, win } = page({ 'Line 2 of the story is here.': 3 });
  await reading.ensure();
  const button = reading.button(() => lines.map(text => ({ text, voice: 'narrator' })));
  button.click();
  await until(() => win.__readAloud?.ended >= 1);
  assert.deepEqual(played, lines, 'not every line was read, or not in order');
  assert.ok(posts.every(post => post.lines === 1), 'a page asked for more than one line at once, which a long story would exceed');
  assert.ok(posts.slice(0, 30).every(post => post.at === 0), 'the lines were not all asked for before the first was played');
  assert.equal(button.dataset.state, 'idle');
});

test('a sentence the Host will not speak is passed over and the rest is read; with none to read, the button says so', async () => {
  const { reading, played } = page({ 'The second is refused.': 'refused' });
  await reading.ensure();
  const button = reading.button(() => [{ text: 'The first is read. The second is refused. The third is read.', voice: 'narrator' }]);
  button.click();
  await until(() => played.length >= 2 && button.dataset.state === 'idle');
  assert.deepEqual(played, ['The first is read.', 'The third is read.']);
  assert.equal(button.dataset.state, 'idle');
  const alone = page({ 'Nothing here.': 'refused' });
  await alone.reading.ensure();
  const nothing = alone.reading.button(() => [{ text: 'Nothing here.', voice: 'narrator' }]);
  nothing.click();
  await until(() => nothing.dataset.state === 'cannot');
  assert.equal(nothing.dataset.state, 'cannot');
  assert.deepEqual(alone.played, []);
});

// ------------------------------------------------------------------ the Host: each page in turn
test('when many pages press at once, each hears its first sentence before any hears its second', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'voice-turns-'));
  const spoken = [], gates = [];
  const synth = async (job, { opus }) => { spoken.push(job.text); await new Promise(resolve => gates.push(resolve)); writeFileSync(opus, 'OggS'); };
  const words = new Set(['the', 'first', 'second', 'third', 'of', 'family', 'one', 'two', 'three']);
  const voice = createVoice({ cacheDir: join(dir, 'cache'), synthesiser: synth, vocabulary: words, log: { warn() {} } });
  try {
    for (const [who, name] of [['hh-1', 'one'], ['hh-2', 'two'], ['hh-3', 'three']]) {
      voice.request(['first', 'second', 'third'].map(n => ({ text: `The ${n} of family ${name}.`, voice: 'narrator' })), { who });
    }
    for (let i = 0; i < 9; i++) { while (!gates.length) await new Promise(resolve => setImmediate(resolve)); gates.shift()(); await new Promise(resolve => setImmediate(resolve)); }
    assert.deepEqual(spoken, [
      'The first of family one.', 'The first of family two.', 'The first of family three.',
      'The second of family one.', 'The second of family two.', 'The second of family three.',
      'The third of family one.', 'The third of family two.', 'The third of family three.',
    ]);
  } finally { voice.close(); rmSync(dir, { recursive: true, force: true }); }
});

// ------------------------------------------------------------------ the messages card
test('the messages card reads its eyebrow, title and words, each thing once: the starving card is "No food. Paz is starving."', () => {
  assert.equal(cardLines({ eyebrow: 'No food', title: 'Paz is starving', words: 'Paz is starving.' }), 'No food. Paz is starving.');
  assert.equal(cardLines({ eyebrow: 'A call to arms', title: 'A call to arms', words: 'Your settlement is calling for men.' }), 'A call to arms. Your settlement is calling for men.');
  assert.equal(cardLines({ eyebrow: '¡Alto!', title: '¡Alto! Soldiers on the road', words: 'Answer fast.' }), '¡Alto! Soldiers on the road. Answer fast.');
  assert.equal(cardLines({ eyebrow: 'Very sick', title: 'Ana is very sick', words: 'Ana can die within a day.' }), 'Ana is very sick. Ana can die within a day.');
  assert.equal(cardLines({ title: 'Inside the Alamo', words: '' }), 'Inside the Alamo.');
});
