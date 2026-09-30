// The Host's voice (owner, 2026-09-30, D15; docs/READ_ALOUD.md §4-5): the sentences read aloud that could not be spoken at
// package time - the ones with a family's names or numbers in them - spoken on the teacher's laptop, kept, and sent to the
// Chromebooks as Ogg Opus.
//
// - **Presentation only.** Nothing here reads or changes the class: it is handed words and gives back sound. The server
//   stays the one authority on what happened; a voice that fails, is slow or is not installed changes nothing but whether a
//   line can be heard.
// - **Never in the tick's way.** Kokoro runs in its own process (`runtime/voice/bin/sherpa-onnx-offline-tts.exe`, then
//   `opusenc.exe`), one sentence at a time, at below-normal priority on `threads` threads, and the server only waits on it
//   through an event. No Python, no npm package, nothing loaded into node.exe - which also keeps espeak-ng, GPL-3.0 and built
//   into the voice's program, a separate program from the game (docs/AUDIO_LICENSES.md).
// - **Kept by content.** A sentence in a voice is kept under `keyOf` (server/voice/text.mjs) in the class data folder, so the
//   same news said to twenty families is spoken once, and a class opened again tomorrow has it. The package's own sentences
//   (`public/voice/`, spoken at package time by scripts/build-voice.mjs) are never spoken here at all.
// - **The line pressed first.** Two queues: `pressed`, lines a student has pressed play on, oldest press first; and `soon`,
//   lines spoken as the server writes them (a rider's words, a family's newest line in its record), made while nobody is
//   waiting and dropped oldest first past `soonCap`. A sentence pressed while it waits in `soon` moves to `pressed`.
// - **Only the game's words.** A page asks for text; a sentence is spoken only if every word of it is a word the game's source
//   writes or a name in the class (server/voice/inventory.mjs `sourceVocabulary`, `wordsFrom`), so a page cannot make the
//   teacher's laptop say anything the game does not.
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, statSync, createReadStream } from 'node:fs';
import { constants as osConstants, setPriority } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { KEY, ROLES, VOICES, keyOf, spoken, splitSentences } from './text.mjs';
import { sourceVocabulary, wordsOf } from './inventory.mjs';

/** Where the voice's program and model are unpacked by scripts/bundle-voice.mjs. */
export const RUNTIME_FILES = Object.freeze({
  tts: 'bin/sherpa-onnx-offline-tts.exe', opusenc: 'bin/opusenc.exe',
  model: 'kokoro/model.onnx', voices: 'kokoro/voices.bin', tokens: 'kokoro/tokens.txt', data: 'kokoro/espeak-ng-data',
});
/** The most a page may ask for at once: lines, and characters in a line. */
export const ASK = Object.freeze({ lines: 12, chars: 2400, sentences: 24 });
/** Opus for speech: 24 kbit/s mono at the model's 24 kHz, about 3 KB a second. */
export const OPUS_BITRATE = 24;

/**
 * The real synthesiser: one sentence through Kokoro to a WAV, then through opusenc to Opus, each a process of its own.
 * `ceiling:` the model is loaded afresh for every sentence (about a second on the owner's desktop): a program that stays
 * loaded and reads sentences one after another is the way out if the queue is ever measured to matter in class.
 *
 * **Normal priority, few threads - measured, not assumed** (2026-09-30, docs/READ_ALOUD.md §6). Below-normal priority was the
 * plan, and on this computer (a hybrid Intel CPU, Windows 11) it made one sentence take 11.2 s instead of 2.1 s, and three at
 * once made almost no progress in seven minutes: Windows runs a below-normal process as background work, on the efficiency
 * cores, throttled. What keeps the tick from waiting is instead that the voice is a separate process on at most `threads`
 * threads (two, or one on four cores or fewer), one sentence at a time, and the tick's own thread is never asked to wait for
 * it - the burst measurement (scripts/voice-burst.mjs) records the server's event-loop delay while it runs. `lowPriority`
 * puts below-normal back, for a machine where it is measured to help.
 */
export function kokoroSynthesiser({ runtimeDir, threads = 2, timeoutMs = 120000, spawnImpl = spawn, lowPriority = false } = {}) {
  const file = name => join(runtimeDir, RUNTIME_FILES[name]);
  const run = (exe, args) => new Promise((resolve, reject) => {
    const child = spawnImpl(exe, args, { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] });
    let stderr = '';
    child.stderr?.on('data', chunk => { stderr = (stderr + chunk).slice(-4000); });
    if (lowPriority) try { if (child.pid) setPriority(child.pid, osConstants.priority.PRIORITY_BELOW_NORMAL); } catch { /* not allowed here: it still runs */ }
    const timer = setTimeout(() => child.kill(), timeoutMs);
    child.on('error', error => { clearTimeout(timer); reject(error); });
    child.on('close', code => { clearTimeout(timer); code === 0 ? resolve() : reject(new Error(`${exe.split(/[\\/]/).pop()} exited ${code}: ${stderr.split('\n').filter(Boolean).slice(-2).join(' ')}`)); });
    running.add(child);
    child.on('close', () => running.delete(child));
  });
  const running = new Set();
  const synth = async ({ role, text }, { wav, opus }) => {
    await run(file('tts'), [
      `--kokoro-model=${file('model')}`, `--kokoro-voices=${file('voices')}`, `--kokoro-tokens=${file('tokens')}`,
      `--kokoro-data-dir=${file('data')}`, '--kokoro-lang=en-us', `--num-threads=${threads}`, `--sid=${VOICES[role].sid}`,
      `--output-filename=${wav}`, spoken(text),
    ]);
    await run(file('opusenc'), ['--quiet', '--bitrate', String(OPUS_BITRATE), '--comp', '10', wav, opus]);
    rmSync(wav, { force: true });
  };
  synth.stop = () => { for (const child of running) child.kill(); };
  return synth;
}

/** Whether the voice's program and model are all there. */
export const runtimeReady = runtimeDir => Boolean(runtimeDir) && Object.values(RUNTIME_FILES).every(name => existsSync(join(runtimeDir, name)));

/** The package's own sentences (public/voice/manifest.json), or none. Read once a process for each folder and its date. */
const packages = new Map();
export function readPackage(packageDir) {
  try {
    const path = join(packageDir, 'manifest.json');
    const stamp = `${path}:${statSync(path).mtimeMs}`;
    if (!packages.has(stamp)) {
      const manifest = JSON.parse(readFileSync(path, 'utf8'));
      packages.set(stamp, { keys: new Set(Object.keys(manifest.lines || {})), words: new Set(manifest.vocabulary || []), model: manifest.model });
    }
    return packages.get(stamp);
  } catch { return { keys: new Set(), words: null, model: null }; }
}

/**
 * The voice a classroom has when it is given none (server/app.mjs `createClassroom`): the package's own sentences, if they are
 * built here, and no Host voice - so a test's or a browser proof's class shows the read-aloud buttons as a real class does,
 * plays the fixed lines, and never starts Kokoro. server/main.mjs gives the real class its whole voice.
 */
export function packageOnlyVoice(packageDir = fileURLToPath(new URL('../../public/voice/', import.meta.url))) {
  return existsSync(join(packageDir, 'manifest.json')) ? createVoice({ packageDir }) : null;
}

/** The words of a class that are nobody's vocabulary but the class's: its people, its families and its places. */
export function wordsFrom(world) {
  const words = new Set();
  const add = text => { for (const word of wordsOf(text)) words.add(word); };
  for (const entity of Object.values(world?.entities || {})) { add(entity.name); add(entity.given); }
  for (const household of Object.values(world?.households || {})) { add(household.surname); add(household.name); }
  for (const site of Object.values(world?.map?.sites || {})) add(site.name);
  return words;
}

export function createVoice({
  runtimeDir = null, packageDir = null, cacheDir = null, capBytes = 256 * 1024 * 1024, soonCap = 90, threads = 2,
  synthesiser = null, vocabulary = null, now = Date.now, log = console,
} = {}) {
  const pack = packageDir ? readPackage(packageDir) : { keys: new Set(), words: null };
  const host = Boolean(cacheDir) && (Boolean(synthesiser) || runtimeReady(runtimeDir));
  const synth = synthesiser || (host ? kokoroSynthesiser({ runtimeDir, threads }) : null);
  // The game's words: the package's list where it was built, else read from the source once (about a second, at start).
  let words = vocabulary || null;
  const known = () => (words ??= pack.words?.size ? pack.words : sourceVocabulary());
  // Read now, as the server starts, rather than inside the first commit that has a line to begin.
  if (host) known();
  if (host) { mkdirSync(join(cacheDir, 'tmp'), { recursive: true }); for (const name of readdirSync(join(cacheDir, 'tmp'))) rmSync(join(cacheDir, 'tmp', name), { force: true }); }
  // What the cache holds, by key, with its size and when it was last asked for; pruned oldest first past `capBytes`.
  const cached = new Map();
  let cacheBytes = 0;
  if (host) for (const name of readdirSync(cacheDir)) {
    const key = name.replace(/\.opus$/, '');
    if (!KEY.test(key) || !name.endsWith('.opus')) continue;
    const info = statSync(join(cacheDir, name));
    cached.set(key, { bytes: info.size, used: info.mtimeMs }); cacheBytes += info.size;
  }
  const jobs = new Map();
  const pressed = [], soon = [];
  const failed = new Map();
  let busy = null, closed = false;
  const stats = { spoken: 0, failed: 0, dropped: 0, msTotal: 0, audioBytes: 0, log: [] };

  const where = key => (pack.keys.has(key) && packageDir ? join(packageDir, `${key}.opus`) : cached.has(key) ? join(cacheDir, `${key}.opus`) : null);
  const ready = key => pack.keys.has(key) || cached.has(key);

  /** Whether every word of a sentence is the game's or the class's. */
  function speakable(sentence, extra) {
    const all = known();
    // A name's possessive is the name's ("Trinidad's family"), found at the end of the game.
    const ours = word => all.has(word) || extra?.has(word) || /^\d+$/.test(word);
    return wordsOf(sentence).every(word => ours(word) || ours(word.replace(/['’]s$/, '')));
  }

  function enqueue(key, role, text, priority, who = null) {
    if (!host || closed) return false;
    const fault = failed.get(key);
    if (fault && now() - fault < 60000) return false;
    let job = jobs.get(key);
    if (!job) {
      job = { key, role, text, priority, who, queued: now() };
      jobs.set(key, job);
      (priority === 'pressed' ? pressed : soon).push(job);
      if (soon.length > soonCap) { const drop = soon.shift(); jobs.delete(drop.key); stats.dropped++; }
    } else if (priority === 'pressed' && job.priority !== 'pressed') {
      // Being spoken already, it is simply waited for; waiting in `soon`, it moves to the back of `pressed`.
      job.priority = 'pressed';
      const at = soon.indexOf(job);
      if (at >= 0) { soon.splice(at, 1); job.queued = now(); job.who = who; pressed.push(job); }
    }
    pump();
    return true;
  }

  /**
   * The pressed sentence to speak next, **each page in turn** (owner, 2026-09-30: the end-of-game breakdown read aloud): the
   * oldest of the sentences that are first in their own page's waiting, then of those second, and so on. So when thirty students
   * press their family's story at the end, every family hears its first sentence before any hears its second, rather than the
   * thirtieth waiting for twenty-nine whole stories. A page is `who` (its family, or the Host); sentences with none are one page.
   */
  const turns = new Map();
  function nextPressed() {
    // A page's turns are counted while it has sentences waiting, and forgotten once it has none.
    for (const who of turns.keys()) if (!pressed.some(job => job.who === who)) turns.delete(who);
    if (!pressed.length) return null;
    const ahead = new Map();
    let best = 0, bestRank = Infinity;
    pressed.forEach((job, at) => {
      const rank = (turns.get(job.who) || 0) + (ahead.get(job.who) || 0);
      ahead.set(job.who, (ahead.get(job.who) || 0) + 1);
      if (rank < bestRank) { best = at; bestRank = rank; }
    });
    const [job] = pressed.splice(best, 1);
    turns.set(job.who, (turns.get(job.who) || 0) + 1);
    return job;
  }

  async function pump() {
    if (busy || closed || !synth) return;
    const job = nextPressed() || soon.shift();
    if (!job) return;
    busy = job;
    const started = now();
    const wav = join(cacheDir, 'tmp', `${job.key}.wav`), opus = join(cacheDir, 'tmp', `${job.key}.opus`);
    try {
      await synth(job, { wav, opus });
      if (closed) return;
      renameSync(opus, join(cacheDir, `${job.key}.opus`));
      const bytes = statSync(join(cacheDir, `${job.key}.opus`)).size;
      cached.set(job.key, { bytes, used: now() }); cacheBytes += bytes;
      stats.spoken++; stats.msTotal += now() - started; stats.audioBytes += bytes;
      stats.log.push({ key: job.key, priority: job.priority, waitedMs: started - job.queued, tookMs: now() - started, chars: job.text.length });
      if (stats.log.length > 200) stats.log.shift();
      prune();
    } catch (error) {
      failed.set(job.key, now()); stats.failed++;
      if (!closed) log.warn?.(`Read-aloud could not speak a line: ${error.message}`);
      for (const path of [wav, opus]) rmSync(path, { force: true });
    } finally {
      jobs.delete(job.key);
      busy = null;
      if (!closed) setImmediate(pump);
    }
  }

  function prune() {
    if (cacheBytes <= capBytes) return;
    for (const [key, entry] of [...cached].sort((a, b) => a[1].used - b[1].used)) {
      if (cacheBytes <= capBytes * 0.9) break;
      if (jobs.has(key)) continue;
      rmSync(join(cacheDir, `${key}.opus`), { force: true });
      cached.delete(key); cacheBytes -= entry.bytes;
    }
  }

  /**
   * A page's lines (`[{ text, voice }]`): each sentence's key, whether it can be played now, and - for one that cannot -
   * whether it is being made. `priority` is 'pressed' for a line a student pressed play on and 'soon' for one the server
   * wrote. `names` is the class's own words (`wordsFrom`).
   */
  function request(lines, { priority = 'pressed', names = null, who = null } = {}) {
    if (!Array.isArray(lines) || !lines.length || lines.length > ASK.lines) throw Object.assign(new Error('Ask for one to twelve lines.'), { status: 400 });
    const parts = [];
    // The class's words, worked out only if a sentence needs them - not for one ready or already being made, which is what a
    // page asking again every moment while it waits asks about.
    let classWords;
    const theirs = () => (classWords ??= typeof names === 'function' ? names() : names);
    for (const line of lines) {
      const role = line?.voice;
      if (!ROLES.includes(role)) throw Object.assign(new Error('No such voice.'), { status: 400 });
      const text = String(line?.text ?? '');
      if (text.length > ASK.chars) throw Object.assign(new Error('That is too long to read aloud.'), { status: 400 });
      for (const sentence of splitSentences(text)) {
        const key = keyOf(role, sentence);
        if (ready(key)) { touch(key); parts.push({ key, ready: true }); continue; }
        if (jobs.has(key)) { enqueue(key, role, sentence, priority, who); parts.push({ key, ready: false, making: true }); continue; }
        const allowed = speakable(sentence, theirs());
        const making = allowed && enqueue(key, role, sentence, priority, who);
        parts.push({ key, ready: false, making: Boolean(making), ...(!allowed && { refused: true }) });
      }
    }
    if (parts.length > ASK.sentences) throw Object.assign(new Error('That is too long to read aloud.'), { status: 400 });
    return { parts, waiting: pressed.length + (busy ? 1 : 0) };
  }
  function touch(key) { const entry = cached.get(key); if (entry) entry.used = now(); }

  /** One kept sentence to a page, as Ogg Opus that never changes under its key. */
  function serve(req, res, key) {
    const path = KEY.test(key) ? where(key) : null;
    if (!path || !existsSync(path)) { res.writeHead(404, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); return res.end('{"error":"Not ready"}'); }
    const size = statSync(path).size;
    touch(key);
    res.writeHead(200, { 'Content-Type': 'audio/ogg; codecs=opus', 'Content-Length': size, 'Cache-Control': 'private, max-age=31536000, immutable', 'Accept-Ranges': 'none' });
    if (req.method === 'HEAD') return res.end();
    createReadStream(path).pipe(res);
  }

  return {
    get available() { return host || pack.keys.size > 0; },
    get hostVoice() { return host; },
    get packaged() { return pack.keys.size; },
    request, serve, ready, where, speakable, stats,
    queue: () => ({ pressed: pressed.map(job => job.key), soon: soon.map(job => job.key), busy: busy?.key || null }),
    idle: () => !busy && !pressed.length && !soon.length,
    close() { closed = true; synth?.stop?.(); pressed.length = 0; soon.length = 0; jobs.clear(); },
  };
}
