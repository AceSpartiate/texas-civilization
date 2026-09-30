// Read aloud (owner, 2026-09-30, D15: "i don't want to use the stock voice ... processed on the host computer, and streamed to
// the player devices so they don't have to download anything"; docs/READ_ALOUD.md).
//
// A small button on the words a student is reading - a tip, a call, a story card, a rider's line, the journal's newest line -
// that plays them in a natural voice made on the teacher's laptop (server/voice/). The page only asks and plays: it sends the
// words it shows and the voice they are said in, the server answers with the sentences' keys and which are ready, and the
// page plays `/voice/<key>.opus` through one <audio>. Nothing is installed on a Chromebook and nothing is made on it.
//
// - **Never the browser's own voice.** A line not made yet shows "Getting ready…" until it is; one the server cannot make
//   says so. `speechSynthesis` is never touched (the owner refused it: "it's awful").
// - **One line at a time.** Pressing another button stops the one playing; pressing the same one again stops it.
// - **As loud as the Sound setting says.** Sound off means silent, and the button says so rather than playing.
// - **Presentation only.** It decides nothing and sends no order.
//
// It imports only public/audio-mix.js (which imports nothing), so its rules are tested headlessly.
import { audioRole, loadSettings } from './audio-mix.js';

/** The voices a page may ask for (server/voice/text.mjs `VOICES`): the narrator, a woman, a man, and the rider at the gate. */
export const VOICE_ROLES = Object.freeze(['narrator', 'woman', 'man', 'rider']);
const WOMAN_ROLES = new Set(['mother', 'daughter', 'wife', 'widow', 'woman', 'girl']);
/** Who speaks for a person of the game: a woman's voice for a woman or a girl, a man's for a man or a boy. The server's own rule. */
export function voiceOfPerson(person) {
  const sex = person?.sex || (WOMAN_ROLES.has(person?.kin?.role || person?.role) ? 'female' : null);
  return sex === 'female' ? 'woman' : 'man';
}

/**
 * How loud a line is read, from the page's Sound settings: nothing when sound is off, else the square root of the master
 * volume, so the student's quiet 30% (public/audio-mix.js `STUDENT_MASTER`) still reads at a voice's speaking level (0.55)
 * and 100% is full. The music, effects and buttons sliders do not touch it: a voice is none of those.
 */
export function voiceVolume(settings) {
  if (!settings || settings.muted) return 0;
  const master = Math.max(0, Math.min(1, Number(settings.master)));
  return Number.isFinite(master) ? Math.sqrt(master) : 0;
}

/**
 * What a story card reads (the messages card: a call, ¡Alto!, somebody very sick, somebody starving): its eyebrow, its title and
 * its words, each thing said once. A part another part already says is left out - "Paz is starving" over "Paz is starving." is
 * said once, and "¡Alto!" once when the title begins with it - so the hunger card reads "No food. Paz is starving."
 */
export function cardLines({ eyebrow = '', title = '', words = '' } = {}) {
  const plain = text => text.toLowerCase().replace(/[^\p{L}\p{N} ]+/gu, '').replace(/\s+/g, ' ').trim();
  const out = [];
  for (const text of [eyebrow, title, words].map(one => String(one ?? '').trim()).filter(Boolean)) {
    const said = plain(text);
    if (!said || out.some(one => plain(one).includes(said))) continue;
    for (let at = out.length - 1; at >= 0; at--) if (said.includes(plain(out[at]))) out.splice(at, 1);
    out.push(text);
  }
  return out.map(text => (/[.!?…]["'”’]?$/.test(text) ? text : `${text}.`)).join(' ');
}

/** What the button says in each state, to the eye and to a screen reader. */
export const STATES = Object.freeze({
  idle: { words: 'Read aloud', label: 'Read this aloud (a computer voice)' },
  waiting: { words: 'Getting ready…', label: 'Getting ready to read this aloud. Press to stop.' },
  playing: { words: 'Stop', label: 'Stop reading aloud' },
  muted: { words: 'Sound is off', label: 'Sound is off. Turn it on with the speaker button to hear this read aloud.' },
  cannot: { words: 'Can’t read this', label: 'This cannot be read aloud on this computer.' },
});

/**
 * The page's read-aloud. `ask(path, body?)` is the page's own fetch of JSON (GET without a body, POST with one); `settings()` the
 * Sound settings now (public/audio.js), or nothing before the sound has loaded; `pollMs` how often a line being made is asked
 * after. Returns `button(lines, options)` to make a button for words - `lines` a function giving `[{ text, voice }]` at the
 * press - and `stop()`.
 */
export function createReadAloud({ ask, settings = () => null, win = globalThis.window, doc = globalThis.document, pollMs = 700, hostPage = false } = {}) {
  const buttons = new Set();
  let available = null;
  let current = null;
  const audio = win?.Audio ? new win.Audio() : null;
  if (audio) audio.preload = 'auto';
  // Presentation evidence for scripts/read-aloud-browser-proof.mjs, read by nothing in the page.
  const evidence = { available: null, pressed: [], asked: [], played: [], ended: 0, state: 'idle', stock: false };
  if (win) win.__readAloud = evidence;

  const soundNow = () => settings() || loadSettings(audioRole({ hostPage, solo: Boolean(win?.__snapshot?.solo) }), safeStorage(win));

  // Whether this class can read aloud: asked once the page is joined (`ensure`), and again after a refusal (not joined yet).
  let checking = null;
  async function check() {
    try { available = Boolean((await ask('/api/voice')).available); } catch { checking = null; return; }
    evidence.available = available;
    refresh();
  }
  /** Each button shown only where this class can read aloud, and where its own `when` says there are words to read. */
  function refresh() {
    for (const one of buttons) {
      const show = available === true && (!one.__when || Boolean(one.__when()));
      if (one.hidden === show) one.hidden = !show;
    }
  }
  const ensure = () => { checking ??= check(); return checking; };

  function setState(button, state) {
    const said = STATES[state] || STATES.idle;
    button.dataset.state = state;
    // A compact button is the speaker alone until it is busy: its words are its label, so the line it sits on reads as before.
    const words = button.querySelector('.read-aloud-words');
    const shown = button.classList.contains('read-aloud-compact') && state === 'idle' ? '' : said.words;
    if (words && words.textContent !== shown) words.textContent = shown;
    button.setAttribute('aria-label', said.label);
    button.title = said.label;
    button.setAttribute('aria-pressed', String(state === 'playing' || state === 'waiting'));
    if (current?.button === button || state !== 'idle') evidence.state = state;
  }

  function stop() {
    const run = current;
    current = null;
    if (!run) return;
    run.cancelled = true;
    if (audio) { try { audio.pause(); } catch { /* gone */ } audio.removeAttribute('src'); try { audio.load(); } catch { /* gone */ } }
    if (run.button.isConnected) setState(run.button, 'idle');
    evidence.state = 'idle';
  }

  const wait = ms => new Promise(resolve => win.setTimeout(resolve, ms));

  async function read(button, lines) {
    stop();
    const clean = (lines || []).filter(line => line && typeof line.text === 'string' && line.text.trim() && VOICE_ROLES.includes(line.voice));
    evidence.pressed.push({ at: Math.round(win.performance.now()), lines: clean.map(line => ({ voice: line.voice, chars: line.text.length })) });
    if (!clean.length) return;
    if (voiceVolume(soundNow()) === 0) { setState(button, 'muted'); win.setTimeout(() => { if (button.dataset.state === 'muted') setState(button, 'idle'); }, 4000); return; }
    const run = current = { button, cancelled: false };
    setState(button, 'waiting');
    // Each line asked for on its own, and all of them at the press (owner, 2026-09-30: the end-of-game breakdown read aloud): the
    // Host begins every one in the order pressed, and a long reading - a family's whole story - is never more than one asking may
    // hold (server/voice/service.mjs `ASK`). Asked again while a sentence is being made; asking again moves nothing back.
    const askLine = async line => {
      const parts = (await ask('/api/voice', { lines: [line] })).parts || [];
      evidence.asked.push({ at: Math.round(win.performance.now()), ready: parts.filter(part => part.ready).length, of: parts.length });
      return parts;
    };
    let played = 0, skipped = 0;
    try {
      const answers = await Promise.all(clean.map(askLine));
      for (let line = 0; line < clean.length; line++) {
        for (let index = 0; index < answers[line].length; index++) {
          if (run.cancelled) return;
          let part = answers[line][index];
          while (part && !part.ready && part.making && !part.refused) {
            setState(button, 'waiting');
            await wait(pollMs);
            if (run.cancelled) return;
            answers[line] = await askLine(clean[line]);
            if (run.cancelled) return;
            part = answers[line][index];
          }
          // A sentence the Host will not or cannot speak is passed over, and the rest is read (never a stock voice in its place).
          if (!part?.ready) { skipped++; continue; }
          setState(button, 'playing');
          await play(part.key, run);
          if (run.cancelled) return;
          played++;
        }
      }
      evidence.skipped = (evidence.skipped || 0) + skipped;
      if (current === run) { current = null; setState(button, played ? 'idle' : 'cannot'); if (played) evidence.ended++; }
    } catch (error) {
      if (current === run) { current = null; setState(button, 'cannot'); }
      console.warn('Read aloud:', error?.message || error);
    }
  }

  function play(key, run) {
    return new Promise((resolve, reject) => {
      if (!audio) { reject(new Error('This browser plays no audio')); return; }
      const started = win.performance.now();
      const done = () => { audio.onended = audio.onerror = null; resolve(); };
      audio.onended = () => { evidence.played.push({ key, ms: Math.round(win.performance.now() - started), volume: audio.volume }); done(); };
      audio.onerror = () => { audio.onended = audio.onerror = null; reject(new Error(`Could not play ${key}`)); };
      audio.volume = voiceVolume(soundNow());
      audio.src = `/voice/${key}.opus`;
      const playing = audio.play();
      playing?.catch?.(error => { if (!run.cancelled) { audio.onended = audio.onerror = null; reject(error); } });
    });
  }

  /**
   * A read-aloud button for some words. `lines()` is asked at the press, so the button reads what is on the screen then.
   * `compact` shows the speaker alone until the button is busy (for a line in a list), with the words for a screen reader;
   * `when()`, if given, says whether there is anything to read now (`refresh` asks it again).
   */
  function button(lines, { compact = false, className = '', when = null } = {}) {
    const one = doc.createElement('button');
    one.type = 'button';
    one.className = `read-aloud${compact ? ' read-aloud-compact' : ''}${className ? ` ${className}` : ''}`;
    const icon = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.setAttribute('viewBox', '0 0 24 24'); icon.setAttribute('class', 'read-aloud-icon'); icon.setAttribute('aria-hidden', 'true');
    icon.setAttribute('fill', 'none'); icon.setAttribute('stroke', 'currentColor'); icon.setAttribute('stroke-width', '1.8'); icon.setAttribute('stroke-linecap', 'round'); icon.setAttribute('stroke-linejoin', 'round');
    for (const d of ['M4 9h4l5-4v14l-5-4H4z', 'M16.5 8.5a5 5 0 0 1 0 7', 'M19 6a8.5 8.5 0 0 1 0 12']) {
      const path = doc.createElementNS('http://www.w3.org/2000/svg', 'path'); path.setAttribute('d', d); icon.append(path);
    }
    const words = doc.createElement('span'); words.className = 'read-aloud-words';
    one.append(icon, words);
    one.__when = when;
    one.hidden = !(available === true && (!when || when()));
    setState(one, 'idle');
    one.addEventListener('click', event => {
      event.stopPropagation();
      if (current?.button === one) { stop(); return; }
      read(one, lines());
    });
    // A key pressed on the button is the button's: Enter or Space never reaches the card or the list around it.
    one.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') event.stopPropagation(); });
    buttons.add(one);
    return one;
  }
  /** Forget buttons no longer on the page, and stop a line whose button has gone. */
  function tidy() {
    for (const one of buttons) if (!one.isConnected) buttons.delete(one);
    if (current && !current.button.isConnected) stop();
  }

  return { button, stop, tidy, ensure, refresh, get available() { return available; }, get playing() { return Boolean(current); } };
}

function safeStorage(win) {
  try { return win?.localStorage ?? null; } catch { return null; }
}
