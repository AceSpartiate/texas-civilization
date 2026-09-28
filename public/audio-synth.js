// Every sound effect in the game, made by the page itself with the Web Audio API (docs/AUDIO.md §2). No recording is
// shipped and none was downloaded: each sound is a recipe of noise, oscillators, filters and envelopes written for this
// game, so the project owns it outright and the owner may sell the game (the licence manifest,
// public/assets/audio/licenses.json, lists every recipe as the project's own work).
//
// A recipe is `(ctx, out, t, opts, noise)`: it builds its nodes into `out` (the voice's own gain, already placed and
// panned by public/audio.js), starts them at `t` on the context's clock, and returns how many seconds it sounds for.
// ceiling: synthesis, not recordings. Animals and the baby are the roughest of these (a formant sketch, not a creature);
// docs/AUDIO.md names the way out - a CC0 recording set (owner question AU3) - if the classroom finds them unconvincing.

const SILENT = 0.0001;

/** Three kinds of noise, two seconds each, made once per context: white (hiss), pink (rain, river), brown (rumble). */
export function makeNoise(ctx) {
  const length = Math.floor(ctx.sampleRate * 2);
  const make = fill => { const buffer = ctx.createBuffer(1, length, ctx.sampleRate); fill(buffer.getChannelData(0)); return buffer; };
  // A fixed little generator rather than Math.random, so a context's noise is the same every time the game is opened.
  let seed = 0x2f6b1a3d;
  const random = () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return ((seed >>> 0) / 4294967296) * 2 - 1; };
  const white = make(data => { for (let i = 0; i < data.length; i++) data[i] = random(); });
  const pink = make(data => {
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < data.length; i++) {
      const w = random();
      b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852;
      b3 = 0.8665 * b3 + w * 0.3104856; b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11; b6 = w * 0.115926;
    }
  });
  const brown = make(data => { let last = 0; for (let i = 0; i < data.length; i++) { last = (last + 0.02 * random()) / 1.02; data[i] = last * 3.5; } });
  return { white, pink, brown };
}

/** A gain that rises to `peak` over `attack` and dies away over `decay`, both in seconds. */
function envelope(ctx, t, peak, attack, decay, hold = 0) {
  const g = ctx.createGain();
  g.gain.setValueAtTime(SILENT, t);
  g.gain.linearRampToValueAtTime(peak, t + attack);
  if (hold) g.gain.setValueAtTime(peak, t + attack + hold);
  g.gain.exponentialRampToValueAtTime(SILENT, t + attack + hold + decay);
  return g;
}
function filter(ctx, type, frequency, Q = 0.7) {
  const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = frequency; f.Q.value = Q; return f;
}
/** A burst of noise through a chain of filters and an envelope, into `out`. */
function burst(ctx, out, t, buffer, { filters = [], peak = 1, attack = 0.002, decay = 0.2, hold = 0, offset = 0, rate = 1 }) {
  const source = ctx.createBufferSource(); source.buffer = buffer; source.playbackRate.value = rate;
  const env = envelope(ctx, t, peak, attack, decay, hold);
  let node = source;
  for (const one of filters) { node.connect(one); node = one; }
  node.connect(env); env.connect(out);
  source.start(t, offset % 1.5); source.stop(t + attack + hold + decay + 0.05);
  return attack + hold + decay;
}
/** A tone gliding from `from` to `to` Hz, with an envelope, into `out` (through `through` if given). */
function tone(ctx, out, t, { type = 'sine', from, to = from, glide = 0.1, peak = 1, attack = 0.003, decay = 0.2, hold = 0, through = null, detune = 0 }) {
  const osc = ctx.createOscillator(); osc.type = type; osc.detune.value = detune;
  osc.frequency.setValueAtTime(from, t);
  if (to !== from) osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), t + glide);
  const env = envelope(ctx, t, peak, attack, decay, hold);
  osc.connect(through || env); if (through) through.connect(env);
  env.connect(out);
  osc.start(t); osc.stop(t + attack + hold + decay + 0.05);
  return attack + hold + decay;
}

export const RECIPES = {
  /** One musket: the crack, the bang, and a low thump. */
  musket(ctx, out, t, opts, noise) {
    burst(ctx, out, t, noise.white, { filters: [filter(ctx, 'highpass', 2500)], peak: 0.5, decay: 0.04 });
    burst(ctx, out, t, noise.white, { filters: [filter(ctx, 'bandpass', 1100 + (opts.vary || 0) * 300, 0.8)], peak: 0.9, decay: 0.22, offset: (opts.vary || 0) * 0.7 });
    burst(ctx, out, t, noise.brown, { filters: [filter(ctx, 'lowpass', 220)], peak: 0.9, attack: 0.004, decay: 0.35 });
    return 0.45;
  },
  /** A rank firing together: a handful of shots inside a sixth of a second, and the roll of it off the ground. */
  volley(ctx, out, t, opts, noise) {
    const shots = Math.min(7, 3 + Math.floor((opts.count || 8) / 6));
    for (let i = 0; i < shots; i++) {
      const at = t + (i / shots) * 0.16 + ((i * 37) % 11) / 400;
      burst(ctx, out, at, noise.white, { filters: [filter(ctx, 'bandpass', 900 + ((i * 53) % 7) * 120, 0.7)], peak: 0.55, decay: 0.2, offset: i * 0.13 });
    }
    burst(ctx, out, t, noise.brown, { filters: [filter(ctx, 'lowpass', 260)], peak: 1, attack: 0.01, decay: 0.9 });
    burst(ctx, out, t + 0.25, noise.pink, { filters: [filter(ctx, 'lowpass', 700)], peak: 0.25, attack: 0.05, decay: 0.8 });
    return 1.2;
  },
  /** A cannon: a crack, a falling boom, a long rumble, and its echo. */
  cannon(ctx, out, t, opts, noise) {
    burst(ctx, out, t, noise.white, { filters: [filter(ctx, 'bandpass', 900, 0.6)], peak: 0.8, decay: 0.15 });
    tone(ctx, out, t, { from: 70, to: 32, glide: 0.9, peak: 1, attack: 0.004, decay: 1.4 });
    burst(ctx, out, t, noise.brown, { filters: [filter(ctx, 'lowpass', 320)], peak: 1, attack: 0.01, decay: 2.2 });
    burst(ctx, out, t + 0.42, noise.brown, { filters: [filter(ctx, 'lowpass', 180)], peak: 0.35, attack: 0.08, decay: 1.6 });
    return 2.6;
  },
  /**
   * A bugle call on the natural notes of a bugle. Not any army's documented call (docs/AUDIO.md §2, HIST-TEX-503): the
   * degüello is never played, and the calls are written for the game - `attack` for the assault's bugles, `parley` for
   * the call at Béxar the Texians did not understand (HIST-TEX-491).
   */
  bugle(ctx, out, t, opts) {
    const G4 = 392, C5 = 523.25, E5 = 659.25, G5 = 784;
    const calls = {
      attack: [[G4, 0.14], [C5, 0.14], [E5, 0.14], [G5, 0.42], [E5, 0.14], [G5, 0.14], [E5, 0.14], [C5, 0.14], [G5, 0.7]],
      parley: [[C5, 0.5], [E5, 0.5], [G5, 0.9], [E5, 0.5], [C5, 1.1]],
      assembly: [[G4, 0.3], [C5, 0.3], [C5, 0.15], [E5, 0.3], [C5, 0.3], [G4, 0.6]],
    };
    let at = t;
    for (const [f, length] of calls[opts.call] || calls.attack) {
      const brass = filter(ctx, 'lowpass', f * 3.2, 2);
      brass.frequency.setValueAtTime(f * 1.2, at); brass.frequency.linearRampToValueAtTime(f * 4, at + 0.05);
      tone(ctx, out, at, { type: 'sawtooth', from: f * 0.985, to: f, glide: 0.04, peak: 0.5, attack: 0.03, hold: Math.max(0, length - 0.1), decay: 0.08, through: brass });
      at += length + 0.03;
    }
    return at - t + 0.1;
  },
  /** A side drum: a roll (`roll`) or a march beat (`beat`), each stroke a snap of noise and a short body. */
  drum(ctx, out, t, opts, noise) {
    const strokes = [];
    if (opts.pattern === 'beat') for (let bar = 0; bar < 2; bar++) for (const [at, accent] of [[0, 1], [0.5, 0.6], [0.75, 0.5], [1, 0.9], [1.5, 0.6]]) strokes.push([bar * 2 + at * 0.9, accent]);
    else for (let i = 0; i < 28; i++) strokes.push([i * 0.07, 0.35 + 0.65 * (i / 27)]);
    for (const [at, accent] of strokes) {
      burst(ctx, out, t + at, noise.white, { filters: [filter(ctx, 'bandpass', 2400, 0.9)], peak: 0.7 * accent, decay: 0.09, offset: at });
      tone(ctx, out, t + at, { type: 'triangle', from: 190, to: 150, glide: 0.05, peak: 0.5 * accent, decay: 0.07 });
    }
    return strokes.at(-1)[0] + 0.2;
  },
  /** A horse's hoofs on dry ground: a trot's two beats, or a gallop's three. */
  hoof(ctx, out, t, opts, noise) {
    const beats = opts.gait === 'gallop' ? [0, 0.08, 0.17] : [0, 0.19];
    for (const [i, at] of beats.entries()) {
      burst(ctx, out, t + at, noise.white, { filters: [filter(ctx, 'bandpass', 650 + i * 90, 3)], peak: 0.8, decay: 0.05, offset: at * 3 });
      tone(ctx, out, t + at, { from: 140, to: 90, glide: 0.04, peak: 0.6, decay: 0.05 });
    }
    return 0.3;
  },
  'horse-snort'(ctx, out, t, opts, noise) {
    const g = filter(ctx, 'bandpass', 420, 1.8);
    const flutter = ctx.createOscillator(), depth = ctx.createGain();
    flutter.frequency.value = 26; depth.gain.value = 300; flutter.connect(depth); depth.connect(g.frequency);
    flutter.start(t); flutter.stop(t + 0.6);
    burst(ctx, out, t, noise.white, { filters: [g], peak: 2.2, attack: 0.03, decay: 0.45 });
    return 0.55;
  },
  /** A wagon going: the rumble of the wheels and a creak of the axle. */
  wagon(ctx, out, t, opts, noise) {
    burst(ctx, out, t, noise.brown, { filters: [filter(ctx, 'lowpass', 240)], peak: 0.8, attack: 0.3, hold: 1.2, decay: 0.6 });
    const creak = filter(ctx, 'bandpass', 700, 9);
    tone(ctx, out, t + 0.4, { type: 'sawtooth', from: 55, to: 78, glide: 0.35, peak: 0.35, attack: 0.05, decay: 0.35, through: creak });
    tone(ctx, out, t + 1.3, { type: 'sawtooth', from: 70, to: 52, glide: 0.3, peak: 0.25, attack: 0.05, decay: 0.3, through: filter(ctx, 'bandpass', 820, 9) });
    return 2.2;
  },
  /** A low call: an ox (`ox`) lower and longer than a cow (`cattle`). */
  ox(ctx, out, t, opts) { return moo(ctx, out, t, 98, 1.5); },
  cattle(ctx, out, t, opts) { return moo(ctx, out, t, 135, 1.1); },
  /** Hens: a run of clucks and one long complaint. */
  hens(ctx, out, t) {
    let at = t;
    for (let i = 0; i < 5; i++) {
      tone(ctx, out, at, { type: 'square', from: 760 + (i % 2) * 90, to: 520, glide: 0.05, peak: 1.2, attack: 0.004, decay: 0.05, through: filter(ctx, 'bandpass', 1300, 4) });
      at += 0.11 + (i % 3) * 0.04;
    }
    tone(ctx, out, at + 0.1, { type: 'square', from: 980, to: 620, glide: 0.25, peak: 1, attack: 0.02, decay: 0.25, through: filter(ctx, 'bandpass', 1400, 4) });
    return at - t + 0.45;
  },
  /** One light footfall on earth. */
  step(ctx, out, t, opts, noise) {
    burst(ctx, out, t, noise.brown, { filters: [filter(ctx, 'lowpass', 380)], peak: 0.8, attack: 0.004, decay: 0.08, offset: opts.vary || 0 });
    return 0.1;
  },
  /** An axe biting a trunk: a knock and a chip. */
  axe(ctx, out, t, opts, noise) {
    tone(ctx, out, t, { type: 'triangle', from: 260, to: 120, glide: 0.05, peak: 0.9, decay: 0.12 });
    burst(ctx, out, t, noise.white, { filters: [filter(ctx, 'bandpass', 1500, 1.2)], peak: 0.7, decay: 0.07 });
    return 0.2;
  },
  /** A tree going over: the fibres creaking, then the crash and the leaves. */
  'tree-fall'(ctx, out, t, opts, noise) {
    tone(ctx, out, t, { type: 'sawtooth', from: 85, to: 55, glide: 1.1, peak: 0.4, attack: 0.1, decay: 1.1, through: filter(ctx, 'bandpass', 600, 8) });
    burst(ctx, out, t + 1.2, noise.brown, { filters: [filter(ctx, 'lowpass', 700)], peak: 1, attack: 0.01, decay: 1.2 });
    burst(ctx, out, t + 1.2, noise.white, { filters: [filter(ctx, 'highpass', 2200)], peak: 0.35, attack: 0.02, decay: 1 });
    return 2.5;
  },
  /** A hammer on a peg or a log at a raising. */
  hammer(ctx, out, t, opts, noise) {
    tone(ctx, out, t, { from: 520, to: 420, glide: 0.03, peak: 0.8, decay: 0.09 });
    tone(ctx, out, t, { type: 'triangle', from: 180, to: 140, glide: 0.05, peak: 0.6, decay: 0.12 });
    burst(ctx, out, t, noise.white, { filters: [filter(ctx, 'bandpass', 3000, 1)], peak: 0.4, decay: 0.02 });
    return 0.2;
  },
  /** Thunder: a crack if close, then a long uneven rumble. */
  thunder(ctx, out, t, opts, noise) {
    if (!opts.far) burst(ctx, out, t, noise.white, { filters: [filter(ctx, 'highpass', 1200)], peak: 0.5, attack: 0.005, decay: 0.3 });
    const rumble = filter(ctx, 'lowpass', 380);
    rumble.frequency.setValueAtTime(420, t); rumble.frequency.exponentialRampToValueAtTime(120, t + 4);
    burst(ctx, out, t + 0.05, noise.brown, { filters: [rumble], peak: 1, attack: 0.15, hold: 0.6, decay: 3.2, offset: 0.3 });
    burst(ctx, out, t + 1.1, noise.brown, { filters: [filter(ctx, 'lowpass', 200)], peak: 0.6, attack: 0.3, decay: 2, offset: 0.9 });
    return 4.5;
  },
  /** A baby crying: three rising and falling wails with a catch of breath between. Quiet on purpose. */
  baby(ctx, out, t, opts, noise) {
    let at = t;
    for (let i = 0; i < 3; i++) {
      const length = 0.6 + (i % 2) * 0.25;
      const vowel = filter(ctx, 'bandpass', 1050, 2.5), bright = filter(ctx, 'bandpass', 2900, 3);
      const mix = ctx.createGain(); mix.gain.value = 1; vowel.connect(mix); bright.connect(mix);
      const osc = ctx.createOscillator(); osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(400, at); osc.frequency.linearRampToValueAtTime(500 + i * 20, at + length * 0.35); osc.frequency.linearRampToValueAtTime(360, at + length);
      const vib = ctx.createOscillator(), vibDepth = ctx.createGain(); vib.frequency.value = 7; vibDepth.gain.value = 14; vib.connect(vibDepth); vibDepth.connect(osc.frequency);
      const env = envelope(ctx, at, 0.6, 0.06, 0.18, length - 0.24);
      osc.connect(vowel); osc.connect(bright); mix.connect(env); env.connect(out);
      osc.start(at); vib.start(at); osc.stop(at + length + 0.1); vib.stop(at + length + 0.1);
      burst(ctx, out, at + length + 0.05, noise.white, { filters: [filter(ctx, 'bandpass', 2200, 1)], peak: 0.12, attack: 0.05, decay: 0.15 });
      at += length + 0.32;
    }
    return at - t;
  },
  /**
   * A church bell (the alarm from San Fernando's tower, February 23, 1836, FIC-GONZ-621): the partials of a cast bell,
   * struck and left to ring, rung fast over and over as an alarm. ceiling: one bell's voice for any bell the game rings.
   */
  bell(ctx, out, t, opts, noise) {
    const strikes = opts.strikes || 8, apart = opts.apart || 0.75, prime = 470;
    const partials = [[0.5, 0.5, 3.5], [1, 0.8, 2.6], [1.19, 0.45, 1.8], [1.5, 0.3, 1.5], [2, 0.5, 1.4], [2.51, 0.18, 0.9], [3.01, 0.12, 0.7]];
    for (let i = 0; i < strikes; i++) {
      const at = t + i * apart;
      burst(ctx, out, at, noise.white, { filters: [filter(ctx, 'bandpass', 3200, 1)], peak: 0.2, decay: 0.03 });
      for (const [ratio, peak, decay] of partials) tone(ctx, out, at, { from: prime * ratio, peak: peak * 0.5, attack: 0.002, decay });
    }
    return (strikes - 1) * apart + 3.6;
  },
  /** ¡Alto!: hoofs pulled up hard, a low sting under it, and the horse blowing. */
  alto(ctx, out, t, opts, noise) {
    for (const [i, at] of [0, 0.14, 0.3, 0.52].entries()) {
      burst(ctx, out, t + at, noise.white, { filters: [filter(ctx, 'bandpass', 620, 3)], peak: 0.9 - i * 0.12, decay: 0.06, offset: at });
      tone(ctx, out, t + at, { from: 130, to: 85, glide: 0.05, peak: 0.6 - i * 0.08, decay: 0.06 });
    }
    for (const f of [73.4, 110, 146.8, 155.6]) {
      tone(ctx, out, t + 0.55, { type: 'sawtooth', from: f, peak: 0.16, attack: 0.02, hold: 0.5, decay: 1.2, through: filter(ctx, 'lowpass', 900, 1) });
    }
    burst(ctx, out, t + 0.55, noise.white, { filters: [filter(ctx, 'bandpass', 2400, 0.9)], peak: 0.5, decay: 0.12 });
    RECIPES['horse-snort'](ctx, out, t + 1.4, opts, noise);
    return 2.4;
  },
  /** The soft tick of a button. */
  click(ctx, out, t) { tone(ctx, out, t, { from: 1700, to: 1400, glide: 0.01, peak: 0.5, decay: 0.03 }); return 0.05; },
  /** A card opening: a short swish of paper. */
  card(ctx, out, t, opts, noise) {
    const f = filter(ctx, 'bandpass', 900, 1.2);
    f.frequency.setValueAtTime(900, t); f.frequency.exponentialRampToValueAtTime(3200, t + 0.14);
    burst(ctx, out, t, noise.white, { filters: [f], peak: 0.6, attack: 0.03, decay: 0.12 });
    return 0.2;
  },
  /** A question arriving: two soft notes, a fourth apart, rising. */
  question(ctx, out, t) {
    tone(ctx, out, t, { type: 'triangle', from: 587.3, peak: 0.5, decay: 0.7 });
    tone(ctx, out, t + 0.16, { type: 'triangle', from: 784, peak: 0.5, decay: 0.9 });
    return 1.1;
  },
  /** A family's work lapsing: two low wooden knocks, falling. Gentle - it is a reminder, not an alarm. */
  lapse(ctx, out, t) {
    tone(ctx, out, t, { type: 'triangle', from: 330, peak: 0.6, decay: 0.25 });
    tone(ctx, out, t + 0.22, { type: 'triangle', from: 262, peak: 0.6, decay: 0.35 });
    return 0.65;
  },
  /** News arriving (a rider's word, the war): a paper and one soft drum tap. */
  news(ctx, out, t, opts, noise) {
    RECIPES.card(ctx, out, t, opts, noise);
    tone(ctx, out, t + 0.12, { type: 'triangle', from: 110, to: 80, glide: 0.1, peak: 0.6, decay: 0.3 });
    return 0.5;
  },
};

function moo(ctx, out, t, pitch, length) {
  const osc = ctx.createOscillator(); osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(pitch * 0.92, t); osc.frequency.linearRampToValueAtTime(pitch * 1.08, t + length * 0.3); osc.frequency.linearRampToValueAtTime(pitch * 0.85, t + length);
  const f1 = filter(ctx, 'bandpass', 480, 3), f2 = filter(ctx, 'bandpass', 900, 4), low = filter(ctx, 'lowpass', 1400);
  const mix = ctx.createGain(); mix.gain.value = 1;
  const env = envelope(ctx, t, 0.9, 0.18, 0.35, length - 0.5);
  f1.frequency.setValueAtTime(380, t); f1.frequency.linearRampToValueAtTime(620, t + length * 0.6);
  osc.connect(f1); osc.connect(f2); f1.connect(mix); f2.connect(mix); mix.connect(low); low.connect(env); env.connect(out);
  osc.start(t); osc.stop(t + length + 0.1);
  return length;
}

/**
 * The sounds that last - rain, wind, the river, a fire - each a looping noise with its own filters, raised and lowered by
 * `set(level)` rather than started and stopped, so a shower coming on is heard coming on. A bed at level 0 costs a few
 * idle nodes; public/audio.js does not make one until it is first wanted.
 */
export function makeBed(ctx, kind, out, noise) {
  const source = ctx.createBufferSource(); source.loop = true;
  const level = ctx.createGain(); level.gain.value = 0;
  const nodes = [];
  let chain;
  const lfo = (frequency, depth, param) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = frequency; g.gain.value = depth; o.connect(g); g.connect(param); o.start(); nodes.push(o); };
  if (kind === 'rain') {
    source.buffer = noise.white; chain = [filter(ctx, 'highpass', 900), filter(ctx, 'lowpass', 6500)];
  } else if (kind === 'wind') {
    source.buffer = noise.pink; const band = filter(ctx, 'bandpass', 520, 1.6); chain = [band];
    lfo(0.09, 260, band.frequency);
  } else if (kind === 'river') {
    source.buffer = noise.pink; chain = [filter(ctx, 'highpass', 280), filter(ctx, 'bandpass', 950, 0.6)];
  } else { // fire: a low roar; the crackle is added by public/audio.js as it goes
    source.buffer = noise.brown; chain = [filter(ctx, 'lowpass', 420)];
  }
  let node = source;
  for (const one of chain) { node.connect(one); node = one; }
  const swell = ctx.createGain(); swell.gain.value = 1;
  node.connect(swell); swell.connect(level); level.connect(out);
  if (kind === 'wind') lfo(0.13, 0.35, swell.gain);
  if (kind === 'river') lfo(0.21, 0.12, swell.gain);
  source.start();
  nodes.push(source);
  return {
    kind, level: 0,
    set(value, at = ctx.currentTime) {
      const v = Math.max(0, Math.min(1, value));
      this.level = v;
      level.gain.cancelScheduledValues(at); level.gain.setValueAtTime(level.gain.value, at); level.gain.linearRampToValueAtTime(v, at + 0.8);
    },
    stop() { for (const one of nodes) { try { one.stop(); } catch { /* already stopped */ } } try { level.disconnect(); } catch { /* gone */ } },
  };
}

/** One crackle of a fire, laid on the fire's bed now and then. */
export function crackle(ctx, out, t, noise, strength = 1) {
  burst(ctx, out, t, noise.white, { filters: [filter(ctx, 'bandpass', 2200 + (t * 997 % 1) * 1800, 1.5)], peak: 0.5 * strength, attack: 0.001, decay: 0.015 + (t * 131 % 1) * 0.02, offset: t % 1 });
}
/** One raindrop on a roof or a leaf, laid on the rain's bed. */
export function drop(ctx, out, t, noise, strength = 1) {
  burst(ctx, out, t, noise.white, { filters: [filter(ctx, 'bandpass', 3500 + (t * 773 % 1) * 2500, 3)], peak: 0.35 * strength, attack: 0.001, decay: 0.01, offset: t % 1 });
}
