// The page's sound (docs/AUDIO.md). public/app.js makes one of these and tells it three things, each in one line: every
// snapshot (`observe`), every drawn frame with what the battle and a chase drew (`frame`), and where to put its control
// (`mount`). Everything else is here and in its three helpers: public/audio-mix.js (what may sound and how loud),
// public/audio-cues.js (what the game's events sound like), public/audio-synth.js and public/audio-music.js (the sounds
// and the music, made by the page - nothing is downloaded).
//
// A page makes no AudioContext until it has both a gesture (browsers refuse sound before one) and a setting that is not
// muted, so a muted student Chromebook spends nothing on sound at all.
import { BEDS, DUCK_TO, Mixer, SOUNDS, audioRole, busLevels, loadSettings, placeSound, saveSettings, settingsFor } from './audio-mix.js';
import { createCueState, frameCues, moodFor, snapshotCues } from './audio-cues.js';
import { RECIPES, crackle, drop, makeBed, makeNoise } from './audio-synth.js';
import { MusicPlayer } from './audio-music.js';

const AMBIENT_MS = 250;
const TICK_MS = 250;
/** Panels whose opening is heard as a card: the journal, a town scene, the ending, the messages. */
const CARDS = ['#family-journal', '#town-scene', '#ending', '#military-notice', '#house-plan', '#wagon-load'];

export function createSoundscape({ hostPage = false, win = globalThis.window, doc = globalThis.document, storage = safeStorage(win) } = {}) {
  let role = audioRole({ hostPage });
  let settings = loadSettings(role, storage);
  let ctx = null, noise = null, master = null, buses = null, music = null, timer = null;
  let unlocked = false, lastAmbient = 0, lastWorld = null, creating = false;
  const mixer = new Mixer();
  const cueState = createCueState();
  const beds = new Map();
  const evidence = { role, settings: { ...settings }, levels: busLevels(settings), context: false, unlocked: false, mood: null, played: [], cues: [], beds: {}, dropped: 0, frameMs: [] };
  if (win) win.__audio = evidence;

  function record(list, item) { list.push(item); if (list.length > 300) list.shift(); }

  /** Make the context, once, and only when there is somebody to hear it. */
  function ensureContext() {
    if (ctx || settings.muted || !unlocked) return ctx;
    const Context = win?.AudioContext || win?.webkitAudioContext;
    if (!Context) return null;
    try { ctx = new Context({ latencyHint: 'playback' }); } catch { try { ctx = new Context(); } catch { return null; } }
    noise = makeNoise(ctx);
    master = ctx.createGain();
    // A limiter at the end, so a volley over a cannon over the bell can never clip on a Chromebook's small speaker.
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -10; limiter.knee.value = 6; limiter.ratio.value = 8; limiter.attack.value = 0.003; limiter.release.value = 0.25;
    master.connect(limiter); limiter.connect(ctx.destination);
    buses = { music: ctx.createGain(), fx: ctx.createGain(), ui: ctx.createGain() };
    for (const bus of Object.values(buses)) { bus.gain.value = 0; bus.connect(master); }
    master.gain.value = 1;
    music = new MusicPlayer(ctx, buses.music, noise);
    evidence.context = true;
    applyLevels();
    timer = win.setInterval(tick, TICK_MS);
    return ctx;
  }
  function applyLevels() {
    evidence.settings = { ...settings };
    evidence.levels = busLevels(settings);
    if (!ctx) return;
    const levels = busLevels(settings);
    const now = ctx.currentTime;
    const duck = mixer.ducking(performanceNow()) ? DUCK_TO : 1;
    const set = (param, value) => { param.cancelScheduledValues(now); param.setValueAtTime(param.value, now); param.linearRampToValueAtTime(value, now + 0.3); };
    set(buses.music.gain, levels.music * duck); set(buses.fx.gain, levels.fx); set(buses.ui.gain, levels.ui);
    if (settings.muted) { music?.setMood(null); for (const bed of beds.values()) bed.set(0); }
    else if (lastWorld) setMood(moodFor(lastWorld, { creating }));
  }
  function performanceNow() { return win?.performance?.now?.() ?? Date.now(); }

  /** A gesture: the browser now allows sound. */
  function unlock() {
    if (unlocked && ctx && ctx.state !== 'suspended') return;
    unlocked = true; evidence.unlocked = true;
    if (settings.muted) return;
    ensureContext();
    if (ctx?.state === 'suspended' && !doc?.hidden) ctx.resume?.().catch?.(() => {});
    if (lastWorld) setMood(moodFor(lastWorld, { creating }));
  }

  function setMood(mood) {
    evidence.mood = settings.muted ? null : mood;
    if (!music || settings.muted) return;
    music.setMood(mood);
  }

  /** Play one effect now: placed, let in by the mixer, built from its recipe. Returns the level played, or null. */
  function play(id, { gain = 1, pan = 0, far = 0, opts = {} } = {}) {
    const sound = SOUNDS[id];
    if (!sound || settings.muted || !ctx || ctx.state === 'closed') return null;
    const now = performanceNow();
    const level = mixer.admit(id, gain, now, 1);
    evidence.dropped = mixer.dropped;
    if (level === null) return null;
    const t = ctx.currentTime + 0.01;
    const voice = ctx.createGain(); voice.gain.value = level;
    let into = voice;
    if (sound.bus !== 'ui' && far > 0.15) {
      // The air takes the top off a far sound.
      const air = ctx.createBiquadFilter(); air.type = 'lowpass'; air.frequency.value = 9000 * (1 - far) + 700;
      voice.connect(air); into = air;
    }
    if (pan && ctx.createStereoPanner) { const panner = ctx.createStereoPanner(); panner.pan.value = pan; into.connect(panner); into = panner; }
    into.connect(buses[sound.bus]);
    let seconds = 1;
    try { seconds = RECIPES[id](ctx, voice, t, opts, noise) || 1; } catch (error) { console.warn('sound', id, error); }
    const live = mixer.voices.at(-1);
    if (live) live.until = now + seconds * 1000;
    win.setTimeout(() => { try { voice.disconnect(); } catch { /* gone */ } }, (seconds + 0.5) * 1000);
    record(evidence.played, { id, level, pan: +pan.toFixed(2), at: Math.round(now), ...(opts.call && { call: opts.call }) });
    if (sound.bus === 'fx' && ['cannon', 'bell', 'alto', 'volley', 'thunder'].includes(id)) applyLevels();
    return level;
  }

  /** The beds to the levels asked for; a fire crackles and rain drops as they go. */
  function setBeds(levels) {
    evidence.beds = { ...levels };
    if (!ctx || settings.muted) return;
    for (const [kind, want] of Object.entries(levels)) {
      const spec = BEDS[kind];
      if (!spec) continue;
      let bed = beds.get(kind);
      if (!bed && want > 0.02) { bed = makeBed(ctx, kind, buses[spec.bus], noise); beds.set(kind, bed); }
      bed?.set(want * spec.gain);
    }
  }
  function tick() {
    if (!ctx || settings.muted || ctx.state !== 'running') return;
    music?.tick();
    const t = ctx.currentTime;
    const fire = beds.get('fire'), rain = beds.get('rain');
    if (fire?.level > 0.02) for (let i = 0; i < 3; i++) if (Math.random() < fire.level * 2.5) crackle(ctx, buses.fx, t + Math.random() * 0.25, noise, fire.level * 1.5);
    if (rain?.level > 0.02) for (let i = 0; i < 4; i++) if (Math.random() < rain.level * 2) drop(ctx, buses.fx, t + Math.random() * 0.25, noise, rain.level * 1.5);
    if (!mixer.ducking(performanceNow()) && buses.music.gain.value < busLevels(settings).music * 0.9) applyLevels();
  }

  /** Every snapshot: the once-only sounds it brings, and the music it calls for. */
  function observe(snapshot) {
    const world = snapshot?.world;
    if (!world) return;
    const nextRole = audioRole({ hostPage, solo: Boolean(snapshot.solo) });
    if (nextRole !== role) { role = nextRole; evidence.role = role; settings = loadSettings(role, storage); if (unlocked && !settings.muted) ensureContext(); applyLevels(); renderControl(); }
    lastWorld = world;
    creating = doc?.body?.dataset?.creating === 'true';
    const cues = snapshotCues(cueState, snapshot);
    for (const cue of cues) record(evidence.cues, { id: cue.id, at: Math.round(performanceNow()) });
    if (settings.muted) { evidence.mood = null; return; }
    setMood(moodFor(world, { creating }));
    pending.push(...cues);
  }
  // Snapshot sounds that stand somewhere are placed at the next frame, when the page knows where things were drawn.
  let pending = [];

  /** Every drawn frame. Cheap when muted: nothing at all. */
  function frame({ camera, canvas, world, battle, chase, drawnAt }) {
    if (settings.muted || !ctx) { pending = []; return; }
    const started = performanceNow();
    const size = canvas ? { width: canvas.width, height: canvas.height } : null;
    const figure = camera?.figure ?? 24;
    for (const cue of pending) {
      let place = { gain: 1, pan: 0, far: 0 };
      const at = cue.entity ? drawnAt?.get?.(cue.entity) : cue.point && camera?.toScreen ? camera.toScreen(cue.point) : null;
      if (at && size) place = placeSound(at, size, figure);
      // Big moments are heard even off-screen: the bell carries three miles (FIC-GONZ-622).
      if (['bell', 'alto', 'question', 'lapse', 'news'].includes(cue.id)) place.gain = Math.max(place.gain, 0.6);
      play(cue.id, { ...place, opts: cue.opts || {} });
    }
    pending = [];
    const now = performanceNow();
    const ambient = now - lastAmbient >= AMBIENT_MS;
    if (ambient) lastAmbient = now;
    const heard = frameCues(cueState, { world, camera, size, drawnAt, battle, chase, ambient }, now);
    for (const cue of heard.cues) play(cue.id, { gain: cue.gain, pan: cue.pan, far: cue.far, opts: cue.opts || {} });
    if (heard.beds) setBeds(heard.beds);
    evidence.frameMs.push(+(performanceNow() - started).toFixed(3));
    if (evidence.frameMs.length > 240) evidence.frameMs.shift();
  }

  // --- The control: one button beside the Journal, and a small panel of sliders. ---
  let control = null;
  function mount(container) {
    if (!doc || !container || control) return;
    control = doc.createElement('div');
    control.id = 'sound-control';
    const button = doc.createElement('button');
    button.type = 'button'; button.id = 'sound-toggle'; button.setAttribute('aria-expanded', 'false'); button.setAttribute('aria-controls', 'sound-panel');
    const panel = doc.createElement('div');
    panel.id = 'sound-panel'; panel.hidden = true; panel.setAttribute('role', 'group'); panel.setAttribute('aria-label', 'Sound');
    const mute = doc.createElement('label'); mute.className = 'sound-mute';
    const muteBox = doc.createElement('input'); muteBox.type = 'checkbox'; muteBox.id = 'sound-on';
    mute.append(muteBox, doc.createTextNode(' Sound on'));
    panel.append(mute);
    const sliders = {};
    for (const [key, label] of [['master', 'Volume'], ['music', 'Music'], ['fx', 'Effects'], ['ui', 'Buttons']]) {
      const row = doc.createElement('label'); row.className = 'sound-row';
      const input = doc.createElement('input'); input.type = 'range'; input.min = '0'; input.max = '100'; input.step = '5'; input.dataset.level = key;
      input.setAttribute('aria-label', label);
      row.append(doc.createTextNode(label), input);
      panel.append(row); sliders[key] = input;
      input.addEventListener('input', () => { change({ [key]: Number(input.value) / 100, muted: false }); });
    }
    const note = doc.createElement('p'); note.className = 'sound-note'; note.id = 'sound-note';
    panel.append(note);
    muteBox.addEventListener('change', () => change({ muted: !muteBox.checked }));
    button.addEventListener('click', () => { panel.hidden = !panel.hidden; button.setAttribute('aria-expanded', String(!panel.hidden)); });
    control.append(panel, button);
    container.prepend(control);
    control.__parts = { button, panel, muteBox, sliders, note };
    renderControl();
  }
  function renderControl() {
    if (!control) return;
    const { button, muteBox, sliders, note } = control.__parts;
    button.textContent = '';
    const icon = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.setAttribute('viewBox', '0 0 24 24'); icon.setAttribute('class', 'icon'); icon.setAttribute('aria-hidden', 'true');
    icon.setAttribute('fill', 'none'); icon.setAttribute('stroke', 'currentColor'); icon.setAttribute('stroke-width', '1.7'); icon.setAttribute('stroke-linecap', 'round'); icon.setAttribute('stroke-linejoin', 'round');
    const path = d => { const p = doc.createElementNS('http://www.w3.org/2000/svg', 'path'); p.setAttribute('d', d); icon.append(p); };
    path('M4 9h4l5-4v14l-5-4H4z');
    if (settings.muted) path('M17 9l5 6M22 9l-5 6'); else { path('M16.5 8.5a5 5 0 0 1 0 7'); path('M19 6a8.5 8.5 0 0 1 0 12'); }
    // The words are for a screen reader and a tooltip; the button itself is only the speaker, so it takes no room from the map.
    const words = doc.createElement('span'); words.className = 'sr-only'; words.textContent = settings.muted ? 'Sound off' : 'Sound';
    button.append(icon, words);
    button.dataset.muted = String(settings.muted);
    button.title = settings.muted ? 'Sound is off. Press to turn it on or set the volume.' : 'Sound on. Press to set the volume.';
    muteBox.checked = !settings.muted;
    for (const [key, input] of Object.entries(sliders)) input.value = String(Math.round(settings[key] * 100));
    note.textContent = role === 'student' ? 'Sound starts quiet in class. Turn it down or off here; headphones if you turn it up.' : role === 'host' ? 'The projector plays the class’s music and the big moments.' : '';
  }
  function change(patch) {
    settings = settingsFor(role, { ...settings, ...patch });
    saveSettings(role, settings, storage);
    // Turning sound on is itself the gesture a browser waits for.
    if (!settings.muted) { unlocked = true; evidence.unlocked = true; ensureContext(); if (ctx?.state === 'suspended') ctx.resume?.().catch?.(() => {}); }
    applyLevels(); renderControl();
    if (!settings.muted && patch.muted === false && 'muted' in patch) play('click');
  }

  // The first gesture anywhere unlocks sound; a button pressed is a soft click; a card opening is a paper's swish.
  if (doc) {
    const onGesture = () => unlock();
    for (const type of ['pointerdown', 'keydown', 'touchend']) doc.addEventListener(type, onGesture, { capture: true, passive: true });
    doc.addEventListener('click', event => {
      const target = event.target?.closest?.('button, summary, [role="button"], select');
      if (target && !target.closest('#sound-control')) play('click');
    }, { capture: true, passive: true });
    doc.addEventListener('visibilitychange', () => {
      if (!ctx) return;
      if (doc.hidden) ctx.suspend?.().catch?.(() => {}); else if (!settings.muted) ctx.resume?.().catch?.(() => {});
    });
    const watch = () => {
      if (typeof win?.MutationObserver !== 'function') return;
      const observer = new win.MutationObserver(records => {
        for (const change of records) {
          const el = change.target;
          if (change.attributeName === 'hidden' && !el.hidden && change.oldValue !== null) { play('card'); return; }
          if (change.attributeName === 'data-open' && el.dataset.open === 'true' && change.oldValue !== 'true') { play('card'); return; }
        }
      });
      for (const selector of CARDS) { const el = doc.querySelector(selector); if (el) observer.observe(el, { attributes: true, attributeFilter: ['hidden', 'data-open'], attributeOldValue: true }); }
    };
    if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', watch, { once: true }); else watch();
  }

  return {
    observe, frame, mount, play, unlock,
    get settings() { return { ...settings }; }, get role() { return role; },
    set(patch) { change(patch); },
  };
}

function safeStorage(win) {
  try { return win?.localStorage ?? null; } catch { return null; }
}
