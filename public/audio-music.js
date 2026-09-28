// The game's music (docs/AUDIO.md §3), played by the page from written notes - no recording is shipped. Each piece is
// either a public-domain tune (the composition's date is in its `source`) rendered by this page, or a piece written for
// this game, and the parts that play it (fiddle, fife, a plucked guitar, a reed organ, a side drum) are recipes of the
// page's own. The licence manifest (public/assets/audio/licenses.json) lists every piece, and tests/audio-licenses.test.mjs
// refuses a piece that is not listed or whose composition is not public domain or the project's own.
//
// Not played, on purpose: the degüello (HIST-TEX-503, disputed) and "Will You Come to the Bower?" at San Jacinto
// (HIST-TEX-525, tradition; the owner's J3: "nothing is played"). A battle has an unnamed drone and drum under it, not a
// tune that claims to be what was played there.

/** Every piece, by id. `melody` is `<note><octave>:<beats>` separated by spaces (`r` a rest); `chords` one per bar,
 * `name:beats` where a bar changes chord. A piece loops: its melody fills its bars exactly (tests/audio-music.test.mjs). */
export const TUNES = Object.freeze({
  folia: {
    title: 'La Folía', mood: 'title', bpm: 80, beats: 3, lead: 'fiddle', accompany: 'pluck', level: 0.9,
    source: { kind: 'public-domain-ground', composition: 'La Folía, the Spanish and Portuguese dance ground, 16th-17th century', melody: 'written for this game over the traditional ground' },
    chords: 'Dm A Dm C F C Dm A Dm A Dm C F C Dm:2,A:1 Dm',
    melody: 'D5:1 D5:1.5 E5:.5 C#5:2 A4:1 D5:1 F5:1.5 E5:.5 E5:2 C5:1 F5:1 A5:1.5 G5:.5 G5:1 E5:1 C5:1 F5:1 E5:1 D5:1 C#5:3 '
      + 'A5:1 A5:1.5 G5:.5 E5:2 C#5:1 F5:1 D5:1.5 E5:.5 G5:1 E5:1 C5:1 A5:1 F5:1.5 C5:.5 E5:1 G5:1 E5:1 D5:1.5 E5:.5 C#5:1 D5:3',
  },
  'brazos-morning': {
    title: 'Brazos Morning', mood: 'farm', bpm: 92, beats: 4, lead: 'fiddle', accompany: 'pluck', level: 0.8,
    source: { kind: 'original', composition: 'written for this game, 2026-09-28' },
    chords: 'G C G D G C G:2,D:2 G Em C G D G C D G',
    melody: 'B4:1 D5:1 G5:1.5 F#5:.5 E5:1 G5:1 E5:1 C5:1 D5:1.5 B4:.5 G4:1 B4:1 A4:3 r:1 '
      + 'B4:1 D5:1 G5:1.5 A5:.5 G5:1 E5:1 C5:1 E5:1 D5:1 B4:1 A4:1 F#4:1 G4:3 r:1 '
      + 'B4:1 E5:1 G5:1.5 F#5:.5 E5:2 C5:2 D5:1 B4:1 D5:1 G5:1 F#5:2 A5:1 F#5:1 '
      + 'G5:1.5 F#5:.5 E5:1 D5:1 E5:1 C5:1 A4:1 C5:1 D5:1 A4:1 B4:.5 C5:.5 D5:1 G4:3 r:1',
  },
  muster: {
    title: 'Muster', mood: 'war', bpm: 104, beats: 2, lead: 'fife', accompany: 'none', drum: 'march', level: 0.7,
    source: { kind: 'original', composition: 'written for this game, 2026-09-28, in the manner of a fife-and-drum march' },
    chords: 'Em Em D D Em C D Em G D Em B Em C B Em',
    melody: 'E4:.5 E4:.25 F#4:.25 G4:.5 E4:.5 B4:1 G4:1 A4:.5 F#4:.5 D4:.5 F#4:.5 A4:1.5 r:.5 '
      + 'G4:.5 G4:.25 A4:.25 B4:.5 G4:.5 E4:.5 G4:.5 C5:.5 B4:.5 A4:.5 F#4:.5 D4:.5 E4:.25 F#4:.25 E4:1.5 r:.5 '
      + 'B4:.5 B4:.5 D5:.5 B4:.5 A4:.5 A4:.5 F#4:.5 D4:.5 G4:.5 B4:.5 E5:.5 D5:.5 D#5:1 B4:1 '
      + 'E5:.5 D5:.5 B4:.5 G4:.5 C5:.5 B4:.5 A4:.5 G4:.5 F#4:.5 A4:.5 B4:.5 D#4:.5 E4:1.5 r:.5',
  },
  'before-the-guns': {
    title: 'Before the Guns', mood: 'battle', bpm: 66, beats: 4, lead: 'fiddle', accompany: 'drone', drum: 'pulse', level: 0.75,
    source: { kind: 'original', composition: 'written for this game, 2026-09-28: a drone and a drum, no tune that claims to be what was played' },
    chords: 'Dm Dm Dm Dm Bb Bb A A',
    melody: 'r:4 r:2 A3:2 D4:3 C4:1 A3:4 r:4 r:2 F4:2 E4:2 G4:2 A3:4',
  },
  'long-road-east': {
    title: 'The Long Road East', mood: 'scrape', bpm: 70, beats: 3, lead: 'fiddle', accompany: 'pad', level: 0.8,
    source: { kind: 'original', composition: 'written for this game, 2026-09-28' },
    chords: 'Am Am G Am F C G E Am Am C G F Dm E Am',
    melody: 'E4:1 A4:1.5 B4:.5 C5:2 B4:1 D5:2 B4:1 A4:3 A4:1 C5:1.5 D5:.5 E5:2 C5:1 D5:1 B4:1 G4:1 G#4:3 '
      + 'A4:1 C5:1.5 E5:.5 E5:2 D5:1 C5:1 E5:1 G5:1 G5:2 D5:1 F5:1 E5:1 C5:1 D5:1.5 C5:.5 A4:1 B4:2 G#4:1 A4:3',
  },
  'new-britain': {
    title: 'New Britain ("Amazing Grace")', mood: 'ending', bpm: 64, beats: 3, lead: 'flute', accompany: 'pad', level: 0.65,
    source: { kind: 'public-domain-tune', composition: 'New Britain, American shape-note hymn tune, first printed 1829 (Columbian Harmony); arrangement written for this game' },
    chords: 'G G C G G D D D G G C G G D G G',
    melody: 'G4:2 B4:.5 G4:.5 B4:2 A4:1 G4:2 E4:1 D4:2 D4:1 G4:2 B4:.5 G4:.5 B4:2 A4:1 D5:3 D5:2 B4:1 '
      + 'D5:2 B4:.5 G4:.5 B4:2 A4:1 G4:2 E4:1 D4:2 D4:1 G4:2 B4:.5 G4:.5 B4:2 A4:1 G4:3 G4:2 D4:1',
  },
  'auld-lang-syne': {
    title: 'Auld Lang Syne', mood: 'ending', bpm: 72, beats: 4, lead: 'fiddle', accompany: 'pad', level: 0.75,
    source: { kind: 'public-domain-tune', composition: 'Auld Lang Syne, Scottish traditional air as printed with Burns\'s words, 1799; arrangement written for this game' },
    chords: 'F C F Bb F C Dm:2,C:2 F',
    melody: 'F4:1.5 F4:.5 F4:1 A4:1 G4:1.5 F4:.5 G4:1 A4:1 F4:1.5 F4:.5 A4:1 C5:1 D5:3 D5:1 '
      + 'C5:1.5 A4:.5 A4:1 F4:1 G4:1.5 F4:.5 G4:1 A4:1 F4:1.5 D4:.5 D4:1 C4:1 F4:3 C4:1',
  },
});

/** What is played for each moment of the game; a list is played in turn. */
export const MOODS = Object.freeze({
  title: ['folia'], farm: ['brazos-morning'], war: ['muster'], battle: ['before-the-guns'], scrape: ['long-road-east'], ending: ['new-britain', 'auld-lang-syne'],
});

const NAMES = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
/** A note's frequency: `A4` is 440. */
export function frequency(note) {
  const match = /^([A-G](?:#|b)?)(-?\d)$/.exec(note);
  if (!match || NAMES[match[1]] === undefined) throw new Error(`not a note: ${note}`);
  const midi = (Number(match[2]) + 1) * 12 + NAMES[match[1]];
  return 440 * 2 ** ((midi - 69) / 12);
}
export function parseMelody(text) {
  let beat = 0;
  const notes = [];
  for (const token of text.trim().split(/\s+/)) {
    const [name, length] = token.split(':');
    const beats = Number(length);
    if (!(beats > 0)) throw new Error(`bad length in ${token}`);
    if (name !== 'r') notes.push({ beat, beats, f: frequency(name) });
    beat += beats;
  }
  return { notes, length: beat };
}
/** A chord's notes: its root and triad (major, or minor with `m`). */
export function chordNotes(name) {
  const match = /^([A-G](?:#|b)?)(m?)$/.exec(name);
  if (!match || NAMES[match[1]] === undefined) throw new Error(`not a chord: ${name}`);
  const root = NAMES[match[1]], third = match[2] ? 3 : 4;
  const at = (semitone, octave) => 440 * 2 ** (((octave + 1) * 12 + semitone - 69) / 12);
  return { bass: at(root, 2), triad: [at(root, 3), at(root + third, 3), at(root + 7, 3)] };
}
export function parseChords(text, beatsPerBar) {
  let beat = 0;
  const chords = [];
  for (const bar of text.trim().split(/\s+/)) {
    const parts = bar.split(',');
    let used = 0;
    for (const part of parts) {
      const [name, length] = part.split(':');
      const beats = length ? Number(length) : beatsPerBar - used;
      chords.push({ beat: beat + used, beats, ...chordNotes(name) });
      used += beats;
    }
    if (Math.abs(used - beatsPerBar) > 1e-9) throw new Error(`bar ${bar} is not ${beatsPerBar} beats`);
    beat += beatsPerBar;
  }
  return { chords, length: beat };
}

/**
 * Everything one pass of a piece plays, in beats from its start: the lead, the accompaniment, the drum. Built once per
 * piece; the player walks through it and starts again at `length`.
 */
export function arrange(id) {
  const tune = TUNES[id];
  if (!tune) throw new Error(`no tune ${id}`);
  const melody = parseMelody(tune.melody), harmony = parseChords(tune.chords, tune.beats);
  const events = melody.notes.map(note => ({ ...note, part: tune.lead, level: 1 }));
  for (const chord of harmony.chords) {
    if (tune.accompany === 'pluck') {
      for (let b = 0; b < chord.beats; b++) {
        const onBar = (chord.beat + b) % tune.beats;
        if (onBar === 0 || (tune.beats === 4 && onBar === 2)) events.push({ beat: chord.beat + b, beats: 1, f: onBar === 2 ? chord.bass * 1.5 : chord.bass, part: 'bass', level: 1 });
        else chord.triad.forEach((f, i) => events.push({ beat: chord.beat + b + i * 0.02, beats: 0.8, f, part: 'pluck', level: 0.55 }));
      }
    } else if (tune.accompany === 'pad') {
      chord.triad.forEach(f => events.push({ beat: chord.beat, beats: chord.beats, f, part: 'pad', level: 0.5 }));
      events.push({ beat: chord.beat, beats: chord.beats, f: chord.bass, part: 'pad', level: 0.45 });
    } else if (tune.accompany === 'drone') {
      events.push({ beat: chord.beat, beats: chord.beats, f: chord.bass, part: 'drone', level: 0.8 });
      events.push({ beat: chord.beat, beats: chord.beats, f: chord.bass * 1.5, part: 'drone', level: 0.5 });
    }
  }
  const bars = harmony.length / tune.beats;
  for (let bar = 0; bar < bars; bar++) {
    const at = bar * tune.beats;
    if (tune.drum === 'march') {
      for (let b = 0; b < tune.beats; b++) {
        events.push({ beat: at + b, beats: 0.2, part: 'snare', level: b === 0 ? 1 : 0.6 });
        events.push({ beat: at + b + 0.5, beats: 0.2, part: 'snare', level: 0.35 });
      }
      events.push({ beat: at, beats: 0.4, part: 'kick', level: 0.8 });
    } else if (tune.drum === 'pulse') {
      events.push({ beat: at, beats: 0.6, part: 'kick', level: 0.9 });
      events.push({ beat: at + 2, beats: 0.6, part: 'kick', level: 0.6 });
      if (bar % 4 === 3) for (let i = 0; i < 12; i++) events.push({ beat: at + 2 + i / 6, beats: 0.1, part: 'snare', level: 0.15 + i * 0.04 });
    }
  }
  events.sort((a, b) => a.beat - b.beat);
  return { id, tune, events, length: harmony.length, melodyLength: melody.length, secondsPerBeat: 60 / tune.bpm };
}

/** Which mood a page is in, from what it was sent (public/audio-cues.js decides; this names what each plays). */
export function tunesFor(mood) { return MOODS[mood] || []; }

const SILENT = 0.0001;
/** One note of one part into `out`, at `t` for `seconds`, at `level`. Returns nothing; every node stops itself. */
export function playNote(ctx, out, noise, event, t, seconds, level) {
  const v = Math.max(0, level);
  const gain = ctx.createGain();
  const g = gain.gain;
  const osc = (type, f, detune = 0) => { const o = ctx.createOscillator(); o.type = type; o.frequency.value = f; o.detune.value = detune; return o; };
  const end = t + seconds;
  const lowpass = frequency => { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = frequency; return f; };
  const started = [];
  const route = (node, into) => { node.connect(into); return into; };
  if (event.part === 'fiddle' || event.part === 'fife' || event.part === 'flute') {
    const fiddle = event.part === 'fiddle';
    const a = osc(fiddle ? 'sawtooth' : 'triangle', event.f), vib = osc('sine', fiddle ? 5.5 : 4.5), depth = ctx.createGain();
    depth.gain.setValueAtTime(0, t); depth.gain.linearRampToValueAtTime(event.f * (fiddle ? 0.007 : 0.004), t + Math.min(0.35, seconds * 0.6));
    vib.connect(depth); depth.connect(a.frequency);
    const tone = lowpass(fiddle ? 2600 : 3200);
    a.connect(tone); tone.connect(gain);
    if (!fiddle) { const b = osc('sine', event.f * 2); const bg = ctx.createGain(); bg.gain.value = 0.25; b.connect(bg); bg.connect(gain); started.push(b); }
    started.push(a, vib);
    const peak = v * (fiddle ? 0.2 : 0.3), attack = fiddle ? 0.05 : 0.03;
    g.setValueAtTime(SILENT, t); g.linearRampToValueAtTime(peak, t + attack);
    g.setValueAtTime(peak * 0.85, Math.max(t + attack, end - 0.08)); g.exponentialRampToValueAtTime(SILENT, end + 0.06);
  } else if (event.part === 'pluck' || event.part === 'bass') {
    const a = osc('triangle', event.f), b = osc('sawtooth', event.f, 4), bright = lowpass(event.part === 'bass' ? 700 : 2400);
    bright.frequency.setValueAtTime(event.part === 'bass' ? 900 : 3000, t); bright.frequency.exponentialRampToValueAtTime(event.part === 'bass' ? 250 : 500, t + 0.35);
    const bmix = ctx.createGain(); bmix.gain.value = 0.35;
    a.connect(bright); b.connect(bmix); bmix.connect(bright); bright.connect(gain);
    started.push(a, b);
    const peak = v * (event.part === 'bass' ? 0.3 : 0.12);
    g.setValueAtTime(SILENT, t); g.linearRampToValueAtTime(peak, t + 0.005); g.exponentialRampToValueAtTime(SILENT, t + Math.max(0.3, Math.min(0.9, seconds)));
  } else if (event.part === 'pad' || event.part === 'drone') {
    const a = osc(event.part === 'drone' ? 'sawtooth' : 'sine', event.f), b = osc('sine', event.f * 2), soft = lowpass(event.part === 'drone' ? 420 : 1800);
    const bg = ctx.createGain(); bg.gain.value = 0.3;
    a.connect(soft); b.connect(bg); bg.connect(soft); soft.connect(gain);
    started.push(a, b);
    const peak = v * (event.part === 'drone' ? 0.1 : 0.07);
    g.setValueAtTime(SILENT, t); g.linearRampToValueAtTime(peak, t + Math.min(0.4, seconds / 3));
    g.setValueAtTime(peak, Math.max(t + 0.4, end - 0.3)); g.exponentialRampToValueAtTime(SILENT, end + 0.25);
  } else if (event.part === 'snare') {
    const src = ctx.createBufferSource(); src.buffer = noise.white;
    const band = ctx.createBiquadFilter(); band.type = 'bandpass'; band.frequency.value = 2300; band.Q.value = 0.9;
    src.connect(band); band.connect(gain);
    g.setValueAtTime(SILENT, t); g.linearRampToValueAtTime(v * 0.3, t + 0.002); g.exponentialRampToValueAtTime(SILENT, t + 0.1);
    src.start(t, (t * 7.3) % 1.5); src.stop(t + 0.15);
    route(gain, out);
    return;
  } else if (event.part === 'kick') {
    const a = osc('sine', 70); a.frequency.setValueAtTime(70, t); a.frequency.exponentialRampToValueAtTime(38, t + 0.3);
    a.connect(gain); started.push(a);
    g.setValueAtTime(SILENT, t); g.linearRampToValueAtTime(v * 0.45, t + 0.004); g.exponentialRampToValueAtTime(SILENT, t + 0.45);
  }
  gain.connect(out);
  for (const node of started) { node.start(t); node.stop(end + 0.4); }
}

/**
 * Plays the music for a mood through `out`, a little ahead of the clock (so a slow frame on a Chromebook does not stutter
 * it), and crossfades to another mood's when told. It is driven by `tick()`, which public/audio.js calls on a timer.
 */
export class MusicPlayer {
  constructor(ctx, out, noise, { lookahead = 1.5 } = {}) {
    this.ctx = ctx; this.out = out; this.noise = noise; this.lookahead = lookahead;
    this.mood = null; this.current = null; this.queue = []; this.turn = 0;
  }
  /** Change what is played. The same mood again changes nothing; null fades to silence. */
  setMood(mood) {
    if (mood === this.mood) return false;
    this.mood = mood;
    const now = this.ctx.currentTime;
    if (this.current) {
      const g = this.current.gain.gain;
      g.cancelScheduledValues(now); g.setValueAtTime(g.value, now); g.linearRampToValueAtTime(0, now + 2.5);
      const old = this.current.gain; const later = setTimeout(() => { try { old.disconnect(); } catch { /* gone */ } }, 4500); later?.unref?.();
      this.current = null;
    }
    this.queue = tunesFor(mood); this.turn = 0;
    if (this.queue.length) this.start(now + 0.6);
    return true;
  }
  start(at) {
    const id = this.queue[this.turn % this.queue.length];
    const piece = arrange(id);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, at); gain.gain.linearRampToValueAtTime(piece.tune.level, at + 2);
    gain.connect(this.out);
    this.current = { piece, gain, startAt: at, index: 0, passes: 0 };
  }
  tick() {
    const now = this.ctx.currentTime;
    const current = this.current;
    if (!current) return 0;
    const { piece } = current;
    let played = 0;
    // A page that was asleep (a closed lid, a hidden tab) does not play everything it missed at once.
    const passLength = piece.length * piece.secondsPerBeat;
    while (current.startAt + passLength < now) { current.startAt += passLength; current.index = 0; current.passes++; }
    for (;;) {
      const event = piece.events[current.index];
      if (!event) {
        current.startAt += passLength; current.index = 0; current.passes++;
        // A playlist moves to its next piece every second pass.
        if (this.queue.length > 1 && current.passes % 2 === 0) {
          this.turn++;
          const at = current.startAt;
          current.gain.gain.setValueAtTime(current.gain.gain.value, now); current.gain.gain.linearRampToValueAtTime(0, at);
          this.start(at);
          return played;
        }
        continue;
      }
      const at = current.startAt + event.beat * piece.secondsPerBeat;
      if (at > now + this.lookahead) break;
      if (at >= now - 0.05) { playNote(this.ctx, current.gain, this.noise, event, Math.max(at, now), event.beats * piece.secondsPerBeat, event.level); played++; }
      current.index++;
    }
    return played;
  }
  stop() { this.setMood(null); }
}
