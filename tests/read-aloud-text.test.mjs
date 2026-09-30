// Read aloud's words (owner, 2026-09-30, D15; docs/READ_ALOUD.md): how a line becomes sentences, how the game's names are
// said, and the one key a sentence in a voice is kept under by the package and by the Host alike.
//
// Proven by injection on 2026-09-30 (scripts/read-aloud-injections.mjs): Seguín's row taken out of the table, a Tejano pool
// name taken out of both lists, "Col." left off the abbreviations, a template's hole not counted as a sentence's start, the
// accent kept in what the voice is given, the voice left out of the key, the page and the server disagreeing about a woman,
// and the volume ignoring "Sound off" - each failed only its own test.
import test from 'node:test';
import assert from 'node:assert/strict';
import { AS_WRITTEN, RESPELL, respell } from '../server/voice/pronunciation.mjs';
import { HOLE, KEY, ROLES, VOICES, keyOf, plain, splitSentences, spoken, voiceOfPerson } from '../server/voice/text.mjs';
import { VOICE_ROLES, voiceOfPerson as pageVoiceOf, voiceVolume } from '../public/read-aloud.js';
// The simulation first, as the server loads it: sim/shops.mjs is part of a cycle that only resolves from the top.
import '../sim/world.mjs';
import { PEOPLE } from '../sim/people.mjs';
import { POOLS } from '../sim/starts.mjs';
import { NAME_POOLS } from '../sim/family.mjs';
import { KEEPERS } from '../sim/shops.mjs';
import { CARPENTERS, RESIDENTS, STOREKEEPERS } from '../sim/town.mjs';
import { stringsOf, readable } from '../server/voice/inventory.mjs';

// A name's words: capitalised, a possessive dropped, a full stop kept only on an abbreviation (Dr., Jr.), an initial (J.) left out.
const tokens = text => String(text).split(/[\s,()]+/).map(word => word.replace(/[’']s$/, '').replace(/[;:]$/, ''))
  .map(word => (/^\p{Lu}\p{Ll}{0,3}\.$/u.test(word) ? word : word.replace(/\.$/, '')))
  .filter(word => /^\p{Lu}/u.test(word) && !/^\p{Lu}\.?$/u.test(word));
const covered = word => Object.hasOwn(RESPELL, word) || AS_WRITTEN.has(word) || Object.keys(RESPELL).some(key => key.includes(' ') && key.split(' ').includes(word));

test('every famous person, every name the Tejano and the old mixed pools deal, is respelled or checked as read right', () => {
  const names = new Set();
  for (const person of Object.values(PEOPLE)) for (const word of [...tokens(person.name), ...tokens(person.fullName || '')]) names.add(word);
  for (const pool of Object.values(POOLS.tejano)) for (const name of pool) names.add(name);
  for (const pool of Object.values(NAME_POOLS)) for (const name of pool) names.add(name);
  const missing = [...names].filter(word => !covered(word) && !['Mr.', 'I'].includes(word)).sort();
  assert.deepEqual(missing, [], `names nobody has checked the voice says rightly (server/voice/pronunciation.mjs): ${missing.join(', ')}`);
});

test('no accented name the game can say reaches the voice without a respelling', () => {
  const said = [
    ...Object.values(KEEPERS).flatMap(town => Object.values(town)), ...Object.values(STOREKEEPERS).map(one => one.name),
    ...RESIDENTS.map(one => one.name), ...Object.values(CARPENTERS).map(one => one.name),
    ...Object.values(PEOPLE).map(one => one.name), ...Object.values(POOLS).flatMap(pools => Object.values(pools).flat()), ...Object.values(NAME_POOLS).flat(),
  ];
  // Kept in the text shown; dropped by `plain` before the voice. Respelled, the accent's sound is kept in English letters.
  const lost = [...new Set(said.flatMap(tokens))].filter(word => /[^\x20-\x7E’]/.test(word) && !covered(word)).sort();
  assert.deepEqual(lost, [], `accented names that would lose their accent unspoken: ${lost.join(', ')}`);
});

test('the respellings are the ones checked, applied as whole words, longest first', () => {
  assert.equal(respell('Juan Seguín’s company rode out from Béxar.'), 'Juan Seh-gheen’s company rode out from Bayhar.');
  assert.equal(respell('Santa Anna has come to Refugio.'), 'Sahntah Ahnah has come to Reh-fury-oh.');
  assert.equal(respell('Ana Esparza stayed.'), 'Ana Esparza stayed.', 'a name read right as written is left alone');
  assert.equal(respell('Col. Travis and Dr. Sutherland.'), 'Colonel Travis and Doctor Sutherland.');
  assert.equal(respell('Seguínas'), 'Seguínas', 'never inside another word');
  assert.equal(respell('Tejanos under Seguín'), 'Teh-hah-nohs under Seh-gheen');
});

test('what the voice is given is plain ASCII: its program reads the command line in the Windows code page', () => {
  for (const said of Object.values(RESPELL)) assert.match(said, /^[\x20-\x7E]+$/, `${said} is not plain`);
  const line = spoken('“¡Alto!” shouted the dragoon — José’s wagon stopped… at Béxar.');
  assert.match(line, /^[\x20-\x7E]+$/, line);
  assert.equal(line, '"Ahl-toe!" shouted the dragoon, Ho-say\'s wagon stopped... at Bayhar.');
  assert.equal(plain('Músquiz'), 'Musquiz');
});

test('a line is split where sentences end, never at an abbreviation or an initial', () => {
  assert.deepEqual(splitSentences('A rider has come in. The soldiers came for the cannon!  Will you go?'), ['A rider has come in.', 'The soldiers came for the cannon!', 'Will you go?']);
  assert.deepEqual(splitSentences('Col. Travis sent J. W. Smith out. He rode for Gonzales.'), ['Col. Travis sent J. W. Smith out.', 'He rode for Gonzales.']);
  assert.deepEqual(splitSentences('“Come and take it.” The flag flew over the cannon.'), ['“Come and take it.”', 'The flag flew over the cannon.']);
  assert.deepEqual(splitSentences('Soldiers shout “¡Alto!”, which means “Halt!”. Press the “!”.'), ['Soldiers shout “¡Alto!”, which means “Halt!”.', 'Press the “!”.']);
  assert.deepEqual(splitSentences('  '), []);
});

test('a template\'s fixed sentences are split exactly as the line it makes, so the package holds them', () => {
  // As the build reads a template (server/voice/inventory.mjs): every `${...}` a hole.
  const [template] = stringsOf('const t = name => `${name} reached Gonzales, where volunteers are gathering. They wait to be made into an army.${tired}`;');
  assert.equal(template.template, true);
  const built = splitSentences(template.text).filter(readable);
  assert.deepEqual(built, ['They wait to be made into an army.']);
  // And the line the server writes, whatever the name and whatever follows.
  const line = splitSentences('Juan Seguín reached Gonzales, where volunteers are gathering. They wait to be made into an army. He is already tired.');
  assert.ok(line.includes(built[0]), `the runtime split ${JSON.stringify(line)} does not hold the package's sentence`);
  assert.ok(splitSentences(`${HOLE} came. It is late.`).includes('It is late.'));
});

test('a sentence in a voice has one key, the package\'s and the Host\'s, and a different voice or saying is a different key', () => {
  const key = keyOf('narrator', 'Seguín rode out.');
  assert.match(key, KEY);
  assert.equal(key, keyOf('narrator', 'Seguín rode out.'));
  assert.notEqual(key, keyOf('woman', 'Seguín rode out.'));
  assert.notEqual(key, keyOf('narrator', 'Seguin rode on.'));
  assert.equal(keyOf('narrator', 'Seguín rode out.'), keyOf('narrator', 'Seguin rode out.'), 'the key is what is said, not how it is spelled');
  assert.throws(() => keyOf('robot', 'Hello.'));
});

test('the page and the server have the same voices and give a person the same one', () => {
  assert.deepEqual([...VOICE_ROLES].sort(), [...ROLES].sort());
  assert.equal(new Set(Object.values(VOICES).map(voice => voice.id)).size, ROLES.length, 'two roles share a voice');
  assert.match(VOICES.woman.id, /^[ab]f_/, 'the woman\'s voice is a woman\'s');
  assert.match(VOICES.man.id, /^[ab]m_/, 'the man\'s voice is a man\'s');
  assert.match(VOICES.rider.id, /^[ab]m_/, 'the rider\'s voice is a man\'s');
  for (const person of [{ sex: 'female' }, { sex: 'male' }, { kin: { role: 'mother' } }, { kin: { role: 'son' } }, { role: 'daughter' }, {}]) {
    assert.equal(voiceOfPerson(person), pageVoiceOf(person));
  }
  assert.equal(voiceOfPerson({ kin: { role: 'mother' } }), 'woman');
  assert.equal(voiceOfPerson({ sex: 'female', kin: { role: 'daughter' } }), 'woman');
  assert.equal(voiceOfPerson({ sex: 'male' }), 'man');
});

test('the voice is as loud as the Sound setting, and silent when sound is off', () => {
  assert.equal(voiceVolume({ master: 0.3, muted: true }), 0);
  assert.equal(voiceVolume(null), 0);
  assert.equal(voiceVolume({ master: 1, muted: false }), 1);
  assert.equal(voiceVolume({ master: 0, muted: false }), 0);
  assert.ok(Math.abs(voiceVolume({ master: 0.3, muted: false }) - Math.sqrt(0.3)) < 1e-9);
  assert.ok(voiceVolume({ master: 0.8 }) > voiceVolume({ master: 0.3 }), 'louder setting, louder voice');
});
