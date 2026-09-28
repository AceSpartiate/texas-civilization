// The music (public/audio-music.js, docs/AUDIO.md §3): every piece is written out whole, loops cleanly, and is played ahead
// of the clock without ever playing a pass twice or all at once after a page has slept.
import test from 'node:test';
import assert from 'node:assert/strict';
import { MOODS, MusicPlayer, TUNES, arrange, frequency, parseChords, parseMelody } from '../public/audio-music.js';
import { createMockAudio } from './support/mock-audio.mjs';

test('notes are the notes: A4 is 440 and an octave doubles', () => {
  assert.equal(frequency('A4'), 440);
  assert.ok(Math.abs(frequency('A5') - 880) < 1e-9);
  assert.ok(Math.abs(frequency('C4') - 261.6256) < 1e-3);
  assert.equal(frequency('F#4'), frequency('Gb4'));
  assert.throws(() => frequency('H4'));
});

test('every piece fills its bars exactly, so it loops without a stumble', () => {
  for (const [id, tune] of Object.entries(TUNES)) {
    const melody = parseMelody(tune.melody), harmony = parseChords(tune.chords, tune.beats);
    assert.ok(Math.abs(melody.length - harmony.length) < 1e-9, `${id}: melody ${melody.length} beats, chords ${harmony.length}`);
    const piece = arrange(id);
    assert.ok(piece.events.every(event => event.beat >= 0 && event.beat < piece.length), `${id}: a note outside the loop`);
    assert.ok(piece.length * piece.secondsPerBeat > 15, `${id} is under fifteen seconds a pass`);
  }
});

test('every mood of the game has music, and every piece is played by some mood', () => {
  for (const mood of ['title', 'farm', 'war', 'battle', 'scrape', 'ending']) assert.ok(MOODS[mood]?.length, `no music for ${mood}`);
  const used = new Set(Object.values(MOODS).flat());
  for (const id of Object.keys(TUNES)) assert.ok(used.has(id), `${id} is never played`);
  for (const id of used) assert.ok(TUNES[id], `a mood plays ${id}, which does not exist`);
});

test('nothing played claims to be what history disputes: no degüello, no Bower', () => {
  for (const [id, tune] of Object.entries(TUNES)) {
    assert.doesNotMatch(`${id} ${tune.title} ${tune.source.composition}`, /deg[uü]ello|bower/i, id);
  }
});

test('the player plays ahead of the clock, once per note, and a page that slept does not play everything it missed', () => {
  const audio = createMockAudio();
  const ctx = new audio.AudioContext();
  const out = ctx.createGain();
  const player = new MusicPlayer(ctx, out, { white: ctx.createBuffer(1, 10, 44100) }, { lookahead: 1 });
  player.setMood('farm');
  let played = 0;
  for (let t = 0; t < 30; t += 0.25) { audio.advance(ctx, 0.25); played += player.tick(); }
  const piece = arrange('brazos-morning');
  const perSecond = piece.events.length / (piece.length * piece.secondsPerBeat);
  assert.ok(played > perSecond * 25 && played < perSecond * 32, `${played} notes in 30 s, expected about ${Math.round(perSecond * 30)}`);
  // Asleep for ten minutes: the next tick schedules only what is due now, not ten minutes of notes.
  audio.advance(ctx, 600);
  const burst = player.tick();
  assert.ok(burst < perSecond * 3, `${burst} notes played at once after sleeping`);
  // A new mood crossfades; the same mood again changes nothing.
  assert.equal(player.setMood('farm'), false);
  assert.equal(player.setMood('battle'), true);
  assert.equal(player.current.piece.id, 'before-the-guns');
  player.setMood(null);
  assert.equal(player.current, null);
});
