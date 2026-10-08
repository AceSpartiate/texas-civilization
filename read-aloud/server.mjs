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
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PRESETS } from './presets.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.READ_ALOUD_PORT || 1840);
const RUNTIME = process.env.READ_ALOUD_VOICE_DIR || join(here, '..', 'runtime', 'voice');
const CACHE = join(here, 'cache');
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
    .replace(/[^\x20-\x7e\n]/g, ' ').replace(/\s+/g, ' ').trim()
    .slice(0, 1000);
}

// One sentence at a time through the voice; a request somebody is waiting on goes ahead of warming the presets.
const waiting = [];
const warming = [];
const inFlight = new Map();
let busy = false;

function speak(text, voice, speed, { urgent = true } = {}) {
  const key = createHash('sha256').update(`${voice.id}|${speed}|${text}`).digest('hex').slice(0, 24);
  const wav = join(CACHE, `${key}.wav`);
  if (existsSync(wav)) return Promise.resolve(wav);
  if (inFlight.has(key)) {
    const job = inFlight.get(key);
    if (urgent && warming.includes(job)) { warming.splice(warming.indexOf(job), 1); waiting.push(job); }
    return job.promise;
  }
  const job = { text, voice, speed, wav };
  job.promise = new Promise((resolve, reject) => { job.resolve = resolve; job.reject = reject; });
  job.promise.finally(() => inFlight.delete(key)).catch(() => {});
  inFlight.set(key, job);
  (urgent ? waiting : warming).push(job);
  pump();
  return job.promise;
}

function pump() {
  if (busy) return;
  const job = waiting.shift() || warming.shift();
  if (!job) return;
  busy = true;
  const part = `${job.wav}.part.wav`;
  const child = spawn(file('tts'), [
    `--kokoro-model=${file('model')}`, `--kokoro-voices=${file('voices')}`, `--kokoro-tokens=${file('tokens')}`,
    `--kokoro-data-dir=${file('data')}`, '--kokoro-lang=en-us', `--kokoro-length-scale=${(1 / job.speed).toFixed(3)}`,
    '--num-threads=4', `--sid=${job.voice.sid}`, `--output-filename=${part}`, job.text,
  ], { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] });
  let err = '';
  child.stderr.on('data', d => { err = (err + d).slice(-2000); });
  const done = error => {
    busy = false;
    if (error) { rmSync(part, { force: true }); job.reject(error); }
    else { renameSync(part, job.wav); job.resolve(job.wav); }
    pump();
  };
  child.on('error', done);
  child.on('close', code => done(code === 0 && existsSync(part) ? null : new Error(`voice exited ${code}: ${err.trim().split('\n').pop()}`)));
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
      return send(res, 200, { ready: ready(), runtime: RUNTIME, voices: VOICES, presets: PRESETS });
    }
    if (req.method === 'POST' && url.pathname === '/speak') {
      if (!ready()) return send(res, 503, { error: `The voices are not installed at ${RUNTIME}.` });
      const { text, voice, speed } = await body(req);
      const words = plainText(text);
      const v = voiceById.get(voice) || VOICES[0];
      if (!words) return send(res, 400, { error: 'Nothing to read.' });
      const wav = await speak(words, v, clampSpeed(speed));
      return send(res, 200, await readFile(wav), 'audio/wav');
    }
    if (req.method === 'POST' && url.pathname === '/warm') {
      // Speak every preset in this voice while nobody is waiting, so pressing one plays at once.
      const { voice, speed } = await body(req);
      const v = voiceById.get(voice) || VOICES[0];
      if (ready()) for (const p of PRESETS) speak(plainText(p), v, clampSpeed(speed), { urgent: false }).catch(() => {});
      return send(res, 200, { queued: PRESETS.length });
    }
    send(res, 404, { error: 'Not found' });
  } catch (error) {
    send(res, 500, { error: String(error.message || error) });
  }
});

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  mkdirSync(CACHE, { recursive: true });
  // Only this computer: the teacher's laptop and its projector, not the classroom network.
  server.listen(PORT, '127.0.0.1', () => {
    console.log(`Read Aloud: http://127.0.0.1:${PORT}  (voices ${ready() ? 'found' : 'MISSING'} at ${RUNTIME})`);
  });
}
