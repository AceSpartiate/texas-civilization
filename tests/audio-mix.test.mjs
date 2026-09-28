// The mixer's limits and a page's starting levels (public/audio-mix.js, docs/AUDIO.md §3-5): what keeps thirty Chromebooks
// from being a wall of noise and a battle from being thirty clicks.
//
// Each proven by injection on 2026-09-28 (docs/AUDIO.md §7).
import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULTS, LOUDNESS_BUDGET, STUDENT_MASTER, MAX_VOICES, MUSIC_CEILING, Mixer, SOUNDS, audioRole, busLevels, hearShots, loadSettings, placeSound, saveSettings, settingsFor } from '../public/audio-mix.js';

const screen = { width: 1200, height: 800 };

test('a student in a class starts with everything on, quiet; the Host and a solo player start on at full level (owner, AU1)', () => {
  assert.equal(audioRole({ hostPage: true }), 'host');
  assert.equal(audioRole({ solo: true }), 'solo');
  assert.equal(audioRole({}), 'student');
  const student = settingsFor('student', null), host = settingsFor('host', null);
  assert.equal(student.muted, false);
  assert.equal(host.muted, false);
  assert.equal(settingsFor('solo', null).muted, false);
  assert.equal(student.master, STUDENT_MASTER);
  assert.ok(STUDENT_MASTER >= 0.2 && STUDENT_MASTER <= 0.4, `a student's master is ${STUDENT_MASTER}, not quiet`);
  const levels = busLevels(student), full = busLevels(host);
  assert.ok(levels.music > 0 && levels.fx > 0, 'a student page starts with music and effects on');
  assert.ok(levels.fx <= full.fx * 0.5 && levels.music <= full.music * 0.5, `a student page is not quieter than the Host's: ${JSON.stringify(levels)} against ${JSON.stringify(full)}`);
  // A student's own choice on this device wins over the quiet default.
  assert.equal(settingsFor('student', { master: 0.9, muted: true }).master, 0.9);
  assert.equal(settingsFor('student', { master: 0.9, muted: true }).muted, true);
});

test('music is never louder than the effects, at any slider setting', () => {
  for (const role of Object.keys(DEFAULTS)) {
    const levels = busLevels({ ...DEFAULTS[role], muted: false });
    assert.ok(levels.music < levels.fx, `${role}: music ${levels.music} is not under effects ${levels.fx}`);
  }
  // Music turned all the way up is still held under its ceiling.
  const loud = busLevels({ master: 1, music: 1, fx: 1, ui: 1, muted: false });
  assert.equal(loud.music, MUSIC_CEILING);
  assert.ok(loud.music < loud.fx);
});

test('settings are remembered per device and per kind of page, and a broken store falls back', () => {
  const store = new Map();
  const storage = { getItem: key => store.get(key) ?? null, setItem: (key, value) => store.set(key, value) };
  assert.equal(saveSettings('student', { ...DEFAULTS.student, muted: true, fx: 0.3 }, storage), true);
  assert.equal(loadSettings('student', storage).muted, true);
  assert.equal(loadSettings('student', storage).fx, 0.3);
  // The same Chromebook's solo game keeps its own.
  assert.equal(loadSettings('solo', storage).fx, DEFAULTS.solo.fx);
  const throwing = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };
  assert.deepEqual(loadSettings('student', throwing), { ...DEFAULTS.student });
  assert.equal(saveSettings('student', DEFAULTS.student, throwing), false);
  store.set('tr-audio:host', '{not json');
  assert.deepEqual(loadSettings('host', storage), { ...DEFAULTS.host });
  assert.equal(settingsFor('host', { master: 7, music: -1, muted: 'yes' }).master, 1);
  assert.equal(settingsFor('host', { master: 7, music: -1, muted: 'yes' }).music, 0);
  assert.equal(settingsFor('host', { master: 7, music: -1, muted: 'yes' }).muted, false);
});

test('a sound is quieter and duller the farther it is from the middle of the screen, and silent past a screen and a half', () => {
  const middle = placeSound({ x: 600, y: 400 }, screen, 30);
  const edge = placeSound({ x: 1150, y: 400 }, screen, 30);
  const off = placeSound({ x: 3000, y: 400 }, screen, 30);
  assert.equal(middle.gain, 1);
  assert.ok(edge.gain < middle.gain && edge.gain > 0.2, `edge ${edge.gain}`);
  assert.ok(edge.pan > 0.5, 'right of the middle is heard on the right');
  assert.ok(placeSound({ x: 50, y: 400 }, screen, 30).pan < -0.5);
  assert.ok(edge.far >= middle.far);
  assert.equal(off.gain, 0);
  // The whole country seen at once: a fight in the middle of the screen is a murmur.
  assert.ok(placeSound({ x: 600, y: 400 }, screen, 7).gain < 0.35);
});

test('a rank firing together is one volley, scattered shots stay single, and a gun is a gun', () => {
  const rank = Array.from({ length: 20 }, (_, i) => ({ x: 500 + i * 3, y: 400, size: 1 }));
  const heard = hearShots(rank, screen, 30);
  assert.deepEqual(heard.map(one => one.id), ['volley']);
  assert.equal(heard[0].count, 20);
  assert.deepEqual(hearShots(rank.slice(0, 3), screen, 30).map(one => one.id), ['musket', 'musket', 'musket']);
  assert.deepEqual(hearShots([{ x: 600, y: 400, size: 2.4 }], screen, 30).map(one => one.id), ['cannon']);
  assert.deepEqual(hearShots([{ x: 9000, y: 400, size: 1 }], screen, 30), []);
});

test('the mixer never plays more than its voices, lets the important in over the trivial, and keeps a sound\'s own limit', () => {
  const mixer = new Mixer();
  let now = 0, admitted = 0;
  // A long fight: muskets every 10 ms for two seconds. Only a few at a time, and never more than the page's limit.
  for (let i = 0; i < 200; i++, now += 10) {
    if (mixer.admit('musket', 1, now, 0.45) !== null) admitted++;
    assert.ok(mixer.live(now).length <= MAX_VOICES);
    assert.ok(mixer.live(now).filter(voice => voice.id === 'musket').length <= SOUNDS.musket.max);
  }
  assert.ok(admitted < 60, `${admitted} muskets let in over two seconds`);
  assert.ok(mixer.dropped > 100);
  // Fill every voice with long, unimportant sounds; the bell still gets in, a footstep does not.
  const full = new Mixer({ maxVoices: 4 });
  for (let i = 0; i < 4; i++) full.admit(['hens', 'wagon', 'hoof', 'axe'][i], 1, 0, 10);
  assert.equal(full.live(1).length, 4);
  assert.notEqual(full.admit('bell', 1, 1, 5), null);
  assert.equal(full.admit('step', 1, 2, 0.1), null);
  // Too soon after itself is refused.
  const gap = new Mixer();
  assert.notEqual(gap.admit('baby', 1, 0, 2), null);
  assert.equal(gap.admit('baby', 1, 5000, 2), null);
  assert.notEqual(gap.admit('baby', 1, SOUNDS.baby.gapMs + 1, 2), null);
});

test('the loudness budget turns a new sound down rather than letting the page get louder', () => {
  const mixer = new Mixer();
  mixer.admit('cannon', 1, 0, 3);
  mixer.admit('bell', 1, 0, 3);
  mixer.admit('thunder', 1, 0, 3);
  const before = mixer.loudness(1);
  const level = mixer.admit('volley', 1, 1, 1);
  assert.ok(level < SOUNDS.volley.gain, `volley played at ${level}`);
  assert.ok(mixer.loudness(1) <= Math.max(LOUDNESS_BUDGET, before) + SOUNDS.volley.gain * 0.25 + 1e-9);
  // The page's own buttons are on their own bus and are never turned down by the fight.
  assert.equal(mixer.admit('click', 1, 1, 0.05), SOUNDS.click.gain);
  assert.equal(mixer.ducking(1), true);
});
