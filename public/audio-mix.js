// The game's sound, the part that decides rather than plays (docs/AUDIO.md). Owner, 2026-09-28: "we need audio. we need
// sound effects, music, etc. everything has to be free, and shouldn't prevent me from selling the game in the future."
//
// Nothing here touches Web Audio or the page. It says which sounds exist and on which bus, how loud a page starts for
// who is looking at it (a room of thirty Chromebooks is not one solo player), what a person's settings are and where they
// are kept, how far away a sound is from the camera and how that turns into loudness and pan, and whether a new sound is
// let in at all - so that thirty shots in one frame are a volley, not thirty sounds, and a cannon is never buried under
// musketry. Every rule is a unit test (tests/audio-mix.test.mjs).

/**
 * Every sound effect the game can play. `bus` is the volume slider it answers to; `priority` decides who is dropped when the
 * page is already playing as much as it may (higher stays); `max` is how many of this one may sound at once; `gapMs` the
 * least time between two starts of it (anything closer is folded into the one already sounding); `gain` its level before
 * distance. Every one is made by the page itself (public/audio-synth.js) - no recording is shipped - and each is listed
 * in public/assets/audio/licenses.json, which tests/audio-licenses.test.mjs holds to this catalogue.
 */
export const SOUNDS = Object.freeze({
  musket: { bus: 'fx', priority: 4, max: 4, gapMs: 45, gain: 0.7 },
  volley: { bus: 'fx', priority: 6, max: 2, gapMs: 350, gain: 0.8 },
  cannon: { bus: 'fx', priority: 8, max: 2, gapMs: 250, gain: 0.7 },
  bugle: { bus: 'fx', priority: 7, max: 1, gapMs: 4000, gain: 0.45 },
  drum: { bus: 'fx', priority: 5, max: 1, gapMs: 3000, gain: 0.45 },
  hoof: { bus: 'fx', priority: 2, max: 3, gapMs: 180, gain: 0.35 },
  'horse-snort': { bus: 'fx', priority: 3, max: 1, gapMs: 6000, gain: 0.35 },
  wagon: { bus: 'fx', priority: 2, max: 1, gapMs: 2500, gain: 0.35 },
  ox: { bus: 'fx', priority: 3, max: 1, gapMs: 9000, gain: 0.4 },
  cattle: { bus: 'fx', priority: 3, max: 1, gapMs: 9000, gain: 0.4 },
  hens: { bus: 'fx', priority: 2, max: 1, gapMs: 7000, gain: 0.3 },
  step: { bus: 'fx', priority: 1, max: 2, gapMs: 260, gain: 0.18 },
  axe: { bus: 'fx', priority: 3, max: 2, gapMs: 700, gain: 0.45 },
  'tree-fall': { bus: 'fx', priority: 5, max: 1, gapMs: 4000, gain: 0.55 },
  hammer: { bus: 'fx', priority: 3, max: 2, gapMs: 450, gain: 0.4 },
  thunder: { bus: 'fx', priority: 7, max: 1, gapMs: 6000, gain: 0.8 },
  baby: { bus: 'fx', priority: 6, max: 1, gapMs: 14000, gain: 0.32 },
  bell: { bus: 'fx', priority: 9, max: 1, gapMs: 20000, gain: 0.5 },
  alto: { bus: 'fx', priority: 9, max: 1, gapMs: 8000, gain: 0.75 },
  // The page's own furniture: never positional, always let in, on its own quiet bus.
  click: { bus: 'ui', priority: 5, max: 2, gapMs: 60, gain: 0.25 },
  card: { bus: 'ui', priority: 5, max: 1, gapMs: 250, gain: 0.3 },
  question: { bus: 'ui', priority: 6, max: 1, gapMs: 1500, gain: 0.35 },
  lapse: { bus: 'ui', priority: 6, max: 1, gapMs: 4000, gain: 0.35 },
  news: { bus: 'ui', priority: 6, max: 1, gapMs: 2500, gain: 0.35 },
});

/** The sounds that go on while something lasts - rain, wind, the river, a fire - each one voice, raised and lowered. */
export const BEDS = Object.freeze({
  rain: { bus: 'fx', gain: 0.4 },
  wind: { bus: 'fx', gain: 0.35 },
  river: { bus: 'fx', gain: 0.22 },
  fire: { bus: 'fx', gain: 0.3 },
});

/**
 * The most the page plays at once, whatever is happening. A thirty-man volley is a handful of voices; the rest are
 * folded into it. ceiling: one page's own limit; the room's thirty pages are kept quiet by starting quiet (`DEFAULTS`),
 * not by talking to each other.
 */
export const MAX_VOICES = 12;
/** The summed level of what is sounding may not pass this; a new sound over it is let in quieter, not louder. */
export const LOUDNESS_BUDGET = 2.4;
/** Music is never louder than the effects: its bus is this much of its slider (docs/AUDIO.md §3). */
export const MUSIC_CEILING = 0.45;
/** While a big moment sounds (cannon, the bell, ¡Alto!) the music gives way to this share of itself. */
export const DUCK_TO = 0.4;
export const DUCKING = new Set(['cannon', 'bell', 'alto', 'volley', 'thunder']);

/**
 * How loud a page starts, by who is looking at it (docs/AUDIO.md §5). Owner, 2026-09-28, answering AU1: **"Everything on,
 * quiet"**. A student's page in a class starts with music and effects on and the master volume at `STUDENT_MASTER` (30%,
 * against the Host's and a solo player's 80%): thirty Chromebooks in one room at full volume are a wall of noise, and the
 * teacher's projector carries the class's music and big moments. A student who changes it with the Sound button is
 * remembered on that device, and what is remembered wins. Nothing plays before the first gesture on any page.
 */
export const STUDENT_MASTER = 0.3;
export const DEFAULTS = Object.freeze({
  student: Object.freeze({ master: STUDENT_MASTER, music: 0.5, fx: 0.7, ui: 0.5, muted: false }),
  host: Object.freeze({ master: 0.8, music: 0.6, fx: 0.8, ui: 0.4, muted: false }),
  solo: Object.freeze({ master: 0.8, music: 0.6, fx: 0.8, ui: 0.5, muted: false }),
});

/** Which page this is, from what the page knows: the Host's path, then the snapshot's `solo`. */
export function audioRole({ hostPage = false, solo = false } = {}) {
  return hostPage ? 'host' : solo ? 'solo' : 'student';
}

const LEVELS = ['master', 'music', 'fx', 'ui'];
const unit = value => Math.max(0, Math.min(1, Number(value)));

/** One person's settings on this device, for this kind of page; anything missing or broken falls back to the default. */
export function settingsFor(role, stored) {
  const base = DEFAULTS[role] || DEFAULTS.student;
  const out = { ...base };
  if (stored && typeof stored === 'object') {
    for (const key of LEVELS) if (Number.isFinite(Number(stored[key])) && stored[key] !== null && stored[key] !== '') out[key] = unit(stored[key]);
    if (typeof stored.muted === 'boolean') out.muted = stored.muted;
  }
  return out;
}

/** The key a kind of page keeps its settings under: a Chromebook used as a student's and as a solo game keeps both. */
export const storageKey = role => `tr-audio:${role}`;

/** Read settings from storage that may be missing, empty or throw (a private window, blocked site data). */
export function loadSettings(role, storage) {
  try {
    const raw = storage?.getItem(storageKey(role));
    return settingsFor(role, raw ? JSON.parse(raw) : null);
  } catch { return settingsFor(role, null); }
}
export function saveSettings(role, settings, storage) {
  try { storage?.setItem(storageKey(role), JSON.stringify(settingsFor(role, settings))); return true; } catch { return false; }
}

/** The level each bus is set to: master times its own slider, nothing at all when muted, music held under its ceiling. */
export function busLevels(settings) {
  if (!settings || settings.muted) return { music: 0, fx: 0, ui: 0 };
  const master = unit(settings.master);
  return { music: master * unit(settings.music) * MUSIC_CEILING, fx: master * unit(settings.fx), ui: master * unit(settings.ui) };
}

/**
 * How near a sound is to what the camera shows, and so how loud and to which side. `at` is where it is on the screen in
 * pixels, `size` the canvas, `figure` how tall a person is drawn there (public/map-camera.js): a fight seen across the
 * whole country is a murmur even at the middle of the screen. Returns `{ gain, pan, far }`, gain 0 for anything more than
 * a screen and a half off; `far` (0 to 1) is how much the air has taken the top off it.
 */
export function placeSound(at, size, figure = 24) {
  if (!at || !size || !(size.width > 0) || !(size.height > 0)) return { gain: 1, pan: 0, far: 0 };
  const cx = size.width / 2, cy = size.height / 2, half = Math.hypot(cx, cy);
  const d = Math.hypot(at.x - cx, at.y - cy) / half;
  if (!Number.isFinite(d) || d > 2.2) return { gain: 0, pan: 0, far: 1 };
  const near = d <= 0.35 ? 1 : 1 / (1 + 2.4 * (d - 0.35));
  const zoom = Math.max(0.2, Math.min(1, (Number(figure) || 24) / 26));
  const pan = Math.max(-0.8, Math.min(0.8, (at.x - cx) / cx * 0.8));
  return { gain: +(near * zoom).toFixed(4), pan: +pan.toFixed(3), far: +Math.max(0, Math.min(1, (d - 0.5) / 1.5 + (1 - zoom) * 0.6)).toFixed(3) };
}

/**
 * Musket shots seen in one frame, turned into what is heard: none at all, a few single shots, or a volley. A rank that
 * fires together on its officer's word is one crash, not twenty clicks; scattered fire stays scattered. Each shot is
 * `{ x, y, size }` on the screen; a `size` of 2 or more is a gun.
 */
export function hearShots(shots, size, figure) {
  const out = [];
  if (!Array.isArray(shots) || !shots.length) return out;
  const placed = shots.map(shot => ({ ...shot, ...placeSound(shot, size, figure) })).filter(shot => shot.gain > 0.01);
  for (const gun of placed.filter(shot => shot.size >= 2)) out.push({ id: 'cannon', gain: gun.gain, pan: gun.pan, far: gun.far });
  const muskets = placed.filter(shot => !(shot.size >= 2)).sort((a, b) => b.gain - a.gain);
  if (muskets.length >= 5) {
    const gain = Math.min(1, muskets[0].gain * (0.55 + Math.min(0.45, muskets.length / 40)));
    const pan = muskets.reduce((sum, shot) => sum + shot.pan, 0) / muskets.length;
    out.push({ id: 'volley', gain, pan: +pan.toFixed(3), far: muskets[0].far, count: muskets.length });
  } else for (const shot of muskets.slice(0, 3)) out.push({ id: 'musket', gain: shot.gain, pan: shot.pan, far: shot.far });
  return out;
}

/**
 * Who may sound. One per page, fed every sound the page would like to play; it answers with the level to play it at, or
 * null to leave it out. It is told the time (ms) rather than reading a clock, so a test can drive it.
 */
export class Mixer {
  constructor({ maxVoices = MAX_VOICES, budget = LOUDNESS_BUDGET, sounds = SOUNDS } = {}) {
    this.maxVoices = maxVoices; this.budget = budget; this.sounds = sounds;
    this.voices = []; // { id, until, level, priority }
    this.lastStart = new Map();
    this.dropped = 0;
  }
  /** What is sounding at `now`. */
  live(now) { this.voices = this.voices.filter(voice => voice.until > now); return this.voices; }
  loudness(now) { return this.live(now).reduce((sum, voice) => sum + voice.level, 0); }
  ducking(now) { return this.live(now).some(voice => DUCKING.has(voice.id)); }
  /**
   * Ask to start `id` at level `gain` (after distance), lasting `seconds`. Returns the level to play it at, or null.
   * A sound too soon after its own last start, one already at its own limit, or one that would push out only louder or
   * more important voices is refused; one that fits under the voice limit but not the budget is let in quieter.
   */
  admit(id, gain, now, seconds = 1) {
    const sound = this.sounds[id];
    if (!sound || !(gain > 0.005)) return null;
    const level = gain * sound.gain;
    const last = this.lastStart.get(id);
    if (last !== undefined && now - last < sound.gapMs) { this.dropped++; return null; }
    const live = this.live(now);
    if (live.filter(voice => voice.id === id).length >= sound.max) { this.dropped++; return null; }
    if (live.length >= this.maxVoices) {
      // Room is made only by stopping counting the least important, oldest voice below this one; it plays out, unheard
      // in the budget (a voice cannot be recalled mid-sound without a click).
      const weakest = [...live].sort((a, b) => a.priority - b.priority || a.until - b.until)[0];
      if (!weakest || weakest.priority >= sound.priority) { this.dropped++; return null; }
      this.voices.splice(this.voices.indexOf(weakest), 1);
    }
    const room = Math.max(0, this.budget - this.loudness(now));
    const played = sound.bus === 'ui' ? level : Math.min(level, Math.max(room, level * 0.25));
    if (!(played > 0.002)) { this.dropped++; return null; }
    this.voices.push({ id, until: now + seconds * 1000, level: played, priority: sound.priority });
    this.lastStart.set(id, now);
    return +played.toFixed(4);
  }
}
