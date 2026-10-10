// Read Aloud: a small program, separate from the game, that reads aloud whatever the teacher types or presses.
//
// It borrows only the game's downloaded voices: Kokoro-82M v1.0 through sherpa-onnx, the runtime that
// scripts/bundle-voice.mjs puts in runtime/voice (docs/READ_ALOUD.md on the read-aloud branch). Nothing of the
// game's server, world or saves is loaded. Each sentence is one run of the voice's own program, kept on disk by
// voice, speed and words, so a preset pressed twice is spoken once.
//
// Run: runtime\node.exe read-aloud\server.mjs   (or double-click "Read Aloud.vbs")
// Then open http://127.0.0.1:1840

import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, statSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createInterface } from 'node:readline';
import { availableParallelism, constants as osConstants, setPriority, userInfo } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PRESETS } from './presets.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.READ_ALOUD_PORT || 1840);
const RUNTIME = process.env.READ_ALOUD_VOICE_DIR || join(here, '..', 'runtime', 'voice');
// Each person's own, in their own profile, never in the program's folder: a copy installed once for everybody
// (Program Files, a shared or network folder) may not be writable by them, and two computers or two people must
// never write one file. READ_ALOUD_CACHE overrides.
const CACHE = process.env.READ_ALOUD_CACHE
  || (process.env.LOCALAPPDATA ? join(process.env.LOCALAPPDATA, 'Read Aloud', 'spoken') : join(here, 'cache'));
// ceiling: kept sentences are trimmed to CACHE_KEEP (oldest first) when past CACHE_MAX, once at start; a cap checked
// as it grows would be justified only if one session ever made hundreds of megabytes.
const CACHE_MAX = 600 * 1024 * 1024, CACHE_KEEP = 400 * 1024 * 1024;
function trimCache() {
  try {
    const files = readdirSync(CACHE).filter(f => f.endsWith('.wav')).map(f => {
      const st = statSync(join(CACHE, f)); return { f, size: st.size, used: st.atimeMs || st.mtimeMs };
    });
    let total = files.reduce((n, x) => n + x.size, 0);
    if (total <= CACHE_MAX) return;
    for (const x of files.sort((a, b) => a.used - b.used)) {
      if (total <= CACHE_KEEP) break;
      rmSync(join(CACHE, x.f), { force: true }); total -= x.size;
    }
  } catch {}
}
const FILES = {
  tts: 'bin/sherpa-onnx-offline-tts.exe',
  model: 'kokoro/model.onnx', voices: 'kokoro/voices.bin', tokens: 'kokoro/tokens.txt', data: 'kokoro/espeak-ng-data',
};
const file = name => join(RUNTIME, FILES[name]);

// Kokoro v1.0's English speakers, by their number in voices.bin (sherpa-onnx's order; the same numbers the game's
// casting used, docs/evidence/read-aloud/scripts/cast.py). The game's four cast voices come first.
const VOICES = [
  { id: 'af_heart', sid: 3, name: 'Heart', who: 'American woman', game: 'the game\'s narrator' },
  { id: 'af_kore', sid: 5, name: 'Kore', who: 'American woman', game: 'the game\'s woman' },
  { id: 'am_puck', sid: 18, name: 'Puck', who: 'American man', game: 'the game\'s man' },
  { id: 'am_fenrir', sid: 14, name: 'Fenrir', who: 'American man', game: 'the game\'s rider' },
  ...[['af_alloy', 0], ['af_aoede', 1], ['af_bella', 2], ['af_jessica', 4], ['af_nicole', 6], ['af_nova', 7], ['af_river', 8],
    ['af_sarah', 9], ['af_sky', 10], ['am_adam', 11], ['am_echo', 12], ['am_eric', 13], ['am_liam', 15], ['am_michael', 16],
    ['am_onyx', 17], ['am_santa', 19], ['bf_alice', 20], ['bf_emma', 21], ['bf_isabella', 22], ['bf_lily', 23],
    ['bm_daniel', 24], ['bm_fable', 25], ['bm_george', 26], ['bm_lewis', 27]].map(([id, sid]) => ({
    id, sid, name: id[3].toUpperCase() + id.slice(4),
    who: `${id[0] === 'a' ? 'American' : 'British'} ${id[1] === 'f' ? 'woman' : 'man'}`,
  })),
];
const voiceById = new Map(VOICES.map(v => [v.id, v]));

const ready = () => Object.keys(FILES).every(name => existsSync(file(name)));

// The voice's program reads its command line in the Windows code page, where a curly quote or an accented letter
// arrives broken (found by the game's own build, READ_ALOUD.md §3). So it is only ever given plain ASCII.
export function plainText(text) {
  return String(text ?? '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[‘’ʼ]/g, "'").replace(/[“”]/g, '"')
    .replace(/[–—]/g, ', ').replace(/…/g, '...')
    .replace(/[^\x20-\x7e\n]/g, ' ')
    .replace(ABBREVIATIONS, (m, word) => SAY_AS[word.toLowerCase()] ?? m)
    // The voice program cuts its text into sentences at every full stop and pauses at each: "U.S." would be
    // "U." pause "S." So a full stop after a single letter (U.S., a.m., John F. Kennedy) or inside a number (3.5)
    // is taken out of what the voice hears; the letters are still said as letters.
    .replace(/\b([A-Za-z])\.(?=[A-Za-z]\.|\s|$|[,;:)"'])/g, '$1 ')
    .replace(/(\d)\.(\d)/g, '$1 point $2')
    .replace(/\s+/g, ' ').trim()
    .slice(0, 2000);
}
// Abbreviations said as words, which also keeps their full stop from ending a sentence.
const SAY_AS = {
  'a.m.': 'ay em', 'p.m.': 'pee em', 'e.g.': 'for example','i.e.': 'that is', 'etc.': 'et cetera', 'vs.': 'versus', 'mr.': 'Mister', 'mrs.': 'Missus',
  'ms.': 'Miz', 'dr.': 'Doctor', 'jr.': 'Junior', 'sr.': 'Senior', 'capt.': 'Captain', 'col.': 'Colonel',
  'gen.': 'General', 'lt.': 'Lieutenant', 'sgt.': 'Sergeant', 'prof.': 'Professor', 'rev.': 'Reverend', 'mt.': 'Mount',
  'ft.': 'Fort', 'approx.': 'approximately', 'jan.': 'January', 'feb.': 'February', 'aug.': 'August',
  'sept.': 'September', 'oct.': 'October', 'nov.': 'November', 'dec.': 'December',
};
const ABBREVIATIONS = new RegExp(`(?<![\\w.])(${Object.keys(SAY_AS).map(k => k.replace(/\./g, '\\.')).join('|')})(?!\\w)`, 'gi');

// The voice. Normally two helpers (voice-worker/worker.mjs), each keeping Kokoro loaded and making one piece at a
// time: `front` for what somebody is waiting on, about 0.3 s for a short sentence, and `back`, for making the presets
// ahead, started when there is such work and closed when there has been none for a while (each holds about 600 MB).
// The two must not run together: measured 2026-10-08, `front` took 2.1 s instead of 0.6 s for the same sentence
// while `back` was making a preset, on a 24-core computer at 8% load. So `back` works only when it has been CALM_MS
// since anybody waited, and the moment somebody does, the piece it is making is stopped (the process ended, which is
// instant) and put back in line. Until `front` is ready, or if it cannot start, the voice program itself does the
// waited-on work, two pieces at once because each run spends a second loading the model before it says anything.
// A request nobody waits for any more (Stop, a new text) is dropped before it starts.
const waiting = [];
const warming = [];
const inFlight = new Map();
let exeBusy = 0;
const CALM_MS = 3000;
let lastWaited = 0, calmTimer = null;
const helperReady = () => existsSync(join(here, 'voice-worker', 'node_modules', 'sherpa-onnx-node')) && ready();

class Helper {
  constructor(name, threads, { idleMs = 0, low = false } = {}) {
    Object.assign(this, { name, threads, idleMs, low, process: null, ready: false, busy: false, job: null, next: 1, pending: new Map(), failures: 0, idle: null });
  }
  get usable() { return this.failures <= 3; }
  start() {
    if (this.process || !this.usable || !helperReady()) return;
    const child = spawn(process.execPath, [join(here, 'voice-worker', 'worker.mjs')], {
      windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, READ_ALOUD_VOICE_DIR: RUNTIME, READ_ALOUD_THREADS: String(this.threads) },
    });
    this.process = child;
    if (this.low) try { setPriority(child.pid, osConstants.priority.PRIORITY_LOW); } catch {}
    let err = '';
    child.stderr.on('data', d => { err = (err + d).slice(-2000); });
    createInterface({ input: child.stdout }).on('line', line => {
      let m; try { m = JSON.parse(line); } catch { return; }
      if (m.ready) { this.ready = true; this.failures = 0; console.log(`Read Aloud: ${this.name} voice loaded (${m.loadMs} ms, ${this.threads} threads)`); pump(); return; }
      const done = this.pending.get(m.id);
      if (process.env.READ_ALOUD_DEBUG) console.log(`${this.name}: ${m.ms} ms for ${m.seconds} s`);
      if (done) { this.pending.delete(m.id); done(m.ok ? null : new Error(m.error)); }
    });
    child.on('exit', code => {
      const asked = this.closing;
      Object.assign(this, { ready: false, process: null, busy: false, job: null, closing: false });
      for (const done of this.pending.values()) done(new Error(`voice helper stopped (${code}): ${err.trim().split('\n').pop() || ''}`));
      this.pending.clear();
      if (!asked) this.failures++;
      pump();
    });
  }
  run(job, done) {
    clearTimeout(this.idle);
    this.busy = true;
    this.job = job;
    const id = this.next++;
    this.pending.set(id, error => { this.busy = false; this.job = null; done(error); this.rest(); });
    this.process.stdin.write(JSON.stringify({ id, text: job.text, sid: job.voice.sid, speed: job.speed, out: job.part }) + '\n');
  }
  // Stopped at once, for somebody waiting: its piece goes back in line (pump's done).
  stopNow() {
    if (!this.process) return;
    if (this.job) this.job.requeue = true;
    this.closing = true;
    this.process.kill();
  }
  // `back` closes once it has had nothing to do for idleMs; it starts again when there is.
  rest() {
    if (!this.idleMs) return;
    clearTimeout(this.idle);
    this.idle = setTimeout(() => { if (!this.busy && this.process) { this.closing = true; this.process.stdin.end(); } }, this.idleMs);
    this.idle.unref();
  }
}
// Measured 2026-10-08 on 24 cores: 8 threads 20% quicker than 4, and no quicker past 8. Half the computer, 2 to 8.
const front = new Helper('front', Math.min(8, Math.max(2, availableParallelism() >> 1)));
const back = new Helper('back', Math.max(2, front.threads >> 1), { idleMs: 30000, low: true });

function speak(text, voice, speed, { urgent = true, signal = null } = {}) {
  const key = createHash('sha256').update(`${voice.id}|${speed}|${text}`).digest('hex').slice(0, 24);
  const wav = join(CACHE, `${key}.wav`);
  if (existsSync(wav)) return Promise.resolve(wav);
  let job = inFlight.get(key);
  if (job) {
    if (urgent && warming.includes(job)) { warming.splice(warming.indexOf(job), 1); waiting.push(job); }
    if (urgent) job.urgent = true;
  } else {
    job = { text, voice, speed, wav, part: `${wav}.${process.pid}.${Math.random().toString(36).slice(2, 8)}.part.wav`, waiters: 0, urgent };
    job.promise = new Promise((resolve, reject) => { job.resolve = resolve; job.reject = reject; });
    job.promise.finally(() => inFlight.delete(key)).catch(() => {});
    inFlight.set(key, job);
    (urgent ? waiting : warming).push(job);
  }
  if (urgent) lastWaited = Date.now();
  if (signal) {
    job.waiters++;
    signal.addEventListener('abort', () => {
      // The last one waiting has gone: if it hasn't started, don't make it.
      if (--job.waiters > 0 || job.started) return;
      const queue = waiting.includes(job) ? waiting : warming.includes(job) ? warming : null;
      if (queue) { queue.splice(queue.indexOf(job), 1); inFlight.delete(key); job.reject(new Error('abandoned')); }
    }, { once: true });
  }
  pump();
  return job.promise;
}

const calm = () => !waiting.length && !front.busy && exeBusy === 0 && Date.now() - lastWaited >= CALM_MS;

function pump() {
  front.start();
  // Somebody is waiting: the presets stop, this instant, and start again once it is calm.
  if (!calm() && back.busy) back.stopNow();
  if (warming.length && calm()) back.start();
  for (;;) {
    let job = null, by = null;
    if (waiting.length && front.ready && !front.busy) [job, by] = [waiting.shift(), front];
    else if (waiting.length && !front.ready && exeBusy < 2) [job, by] = [waiting.shift(), 'exe'];
    else if (warming.length && calm() && back.ready && !back.busy) [job, by] = [warming.shift(), back];
    // No `back` (it could not start): presets are made by `front` when it is calm.
    else if (warming.length && calm() && !back.usable && front.ready) [job, by] = [warming.shift(), front];
    if (!job) break;
    job.started = true;
    const done = error => {
      if (job.urgent) lastWaited = Date.now();
      // Stopped for somebody waiting: back in line - at the front of it if that somebody wants this very piece.
      if (error && job.requeue) { job.requeue = false; job.started = false; rmSync(job.part, { force: true }); (job.urgent ? waiting : warming).unshift(job); pump(); return; }
      if (error) { rmSync(job.part, { force: true }); job.reject(error); }
      else if (!existsSync(job.part)) job.reject(new Error('the voice made no sound'));
      else {
        // Another of this person's windows may have finished the same sentence first: theirs is as good.
        try { renameSync(job.part, job.wav); } catch { rmSync(job.part, { force: true }); }
        if (existsSync(job.wav)) job.resolve(job.wav); else job.reject(new Error('the sentence could not be kept'));
      }
      pump();
    };
    if (by === 'exe') runProgram(job, error => { exeBusy--; done(error); }), exeBusy++;
    else by.run(job, done);
  }
  // Presets still to make, but not calm yet: look again when it will be.
  if (warming.length && !calmTimer) {
    calmTimer = setTimeout(() => { calmTimer = null; pump(); }, Math.max(100, lastWaited + CALM_MS - Date.now() + 50));
    calmTimer.unref();
  }
}

// The voice program itself, one run per piece.
function runProgram(job, done) {
  const child = spawn(file('tts'), [
    `--kokoro-model=${file('model')}`, `--kokoro-voices=${file('voices')}`, `--kokoro-tokens=${file('tokens')}`,
    `--kokoro-data-dir=${file('data')}`, '--kokoro-lang=en-us', `--kokoro-length-scale=${(1 / job.speed).toFixed(3)}`,
    '--num-threads=4', `--sid=${job.voice.sid}`, `--output-filename=${job.part}`, job.text,
  ], { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] });
  let err = '';
  child.stderr.on('data', d => { err = (err + d).slice(-2000); });
  let finished = false;
  const end = error => { if (!finished) { finished = true; done(error); } };
  child.on('error', end);
  child.on('close', code => end(code === 0 ? null : new Error(`voice exited ${code}: ${err.trim().split('\n').pop()}`)));
}

const send = (res, status, body, type = 'application/json') => {
  res.writeHead(status, { 'content-type': type, 'cache-control': 'no-store' });
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
};

async function body(req) {
  let raw = '';
  for await (const chunk of req) { raw += chunk; if (raw.length > 20000) throw new Error('too long'); }
  return JSON.parse(raw || '{}');
}

const clampSpeed = s => Math.round(Math.min(1.5, Math.max(0.6, Number(s) || 1)) * 20) / 20;

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) {
      return send(res, 200, readFileSync(join(here, 'index.html')), 'text/html; charset=utf-8');
    }
    if (req.method === 'GET' && url.pathname === '/gender.mjs') {
      return send(res, 200, readFileSync(join(here, 'gender.mjs')), 'text/javascript; charset=utf-8');
    }
    if (req.method === 'GET' && url.pathname === '/config') {
      return send(res, 200, { ready: ready(), runtime: RUNTIME, voices: VOICES, presets: PRESETS, user: userInfo().username });
    }
    if (req.method === 'POST' && url.pathname === '/speak') {
      if (!ready()) return send(res, 503, { error: `The voices are not installed at ${RUNTIME}.` });
      const { text, voice, speed } = await body(req);
      const words = plainText(text);
      const v = voiceById.get(voice) || VOICES[0];
      if (!words) return send(res, 400, { error: 'Nothing to read.' });
      const gone = new AbortController();
      res.on('close', () => { if (!res.writableFinished) gone.abort(); });
      const wav = await speak(words, v, clampSpeed(speed), { signal: gone.signal });
      if (gone.signal.aborted) return;
      return send(res, 200, await readFile(wav), 'audio/wav');
    }
    if (req.method === 'POST' && url.pathname === '/warm') {
      // Make the presets ahead while nobody is waiting, so pressing one plays at once. The page sends the pieces it
      // will ask for (a story is several), each with its voice, so they are kept under the keys reading will use.
      const { pieces = [], speed } = await body(req);
      if (ready()) for (const p of pieces.slice(0, 400)) {
        const words = plainText(p.text);
        if (words) speak(words, voiceById.get(p.voice) || VOICES[0], clampSpeed(speed), { urgent: false }).catch(() => {});
      }
      return send(res, 200, { queued: pieces.length });
    }
    send(res, 404, { error: 'Not found' });
  } catch (error) {
    if (!res.destroyed && !res.headersSent) send(res, 500, { error: String(error.message || error) });
  }
});

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  mkdirSync(CACHE, { recursive: true });
  trimCache();
  // Only this computer: the teacher's laptop and its projector, not the classroom network.
  front.start();
  server.listen(PORT, '127.0.0.1', () => {
    console.log(`Read Aloud: http://127.0.0.1:${PORT}  (voices ${ready() ? 'found' : 'MISSING'} at ${RUNTIME})`);
  });
}
