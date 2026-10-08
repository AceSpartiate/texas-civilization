// SPDX-License-Identifier: GPL-3.0-or-later
//
// Read Aloud's voice helper: Kokoro loaded once and kept, so a sentence costs only its own making and not the
// second the voice program takes to load its model each time it is started (measured 2026-10-08: about 1.0 s of
// every run of sherpa-onnx-offline-tts.exe, before any sound).
//
// A program of its own, as the game keeps its voice (docs/READ_ALOUD.md on the read-aloud branch): sherpa-onnx has
// espeak-ng built in, under the GPL, so it is loaded here and never into read-aloud/server.mjs, which only talks to
// this process over its standard input and output. This file is under the GPL-3.0-or-later for the same reason.
//
// In:  one JSON line per request  {"id":1,"text":"...","sid":3,"speed":1,"out":"C:\\...\\x.wav"}
// Out: one JSON line per answer   {"id":1,"ok":true} or {"id":1,"ok":false,"error":"..."}; first {"ready":true,...}
import { createInterface } from 'node:readline';
import { writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const sherpa = require('sherpa-onnx-node');
const dir = process.env.READ_ALOUD_VOICE_DIR;
const say = obj => process.stdout.write(JSON.stringify(obj) + '\n');

// 16-bit mono WAV, as the voice program wrote them, so the cache holds one kind of file.
function wav(samples, rate) {
  const out = Buffer.alloc(44 + samples.length * 2);
  out.write('RIFF', 0); out.writeUInt32LE(36 + samples.length * 2, 4); out.write('WAVEfmt ', 8);
  out.writeUInt32LE(16, 16); out.writeUInt16LE(1, 20); out.writeUInt16LE(1, 22); out.writeUInt32LE(rate, 24);
  out.writeUInt32LE(rate * 2, 28); out.writeUInt16LE(2, 32); out.writeUInt16LE(16, 34);
  out.write('data', 36); out.writeUInt32LE(samples.length * 2, 40);
  for (let i = 0; i < samples.length; i++) out.writeInt16LE(Math.round(Math.max(-1, Math.min(1, samples[i])) * 32767), 44 + i * 2);
  return out;
}

const started = Date.now();
const tts = await sherpa.OfflineTts.createAsync({
  model: {
    kokoro: {
      model: `${dir}/kokoro/model.onnx`, voices: `${dir}/kokoro/voices.bin`, tokens: `${dir}/kokoro/tokens.txt`,
      dataDir: `${dir}/kokoro/espeak-ng-data`, lang: 'en-us',
    },
    numThreads: Number(process.env.READ_ALOUD_THREADS || 4), provider: 'cpu', debug: 0,
  },
  maxNumSentences: 1,
});
say({ ready: true, loadMs: Date.now() - started, sampleRate: tts.sampleRate });

// One at a time, in the order asked: the server decides that order.
let chain = Promise.resolve();
createInterface({ input: process.stdin }).on('line', line => {
  let job;
  try { job = JSON.parse(line); } catch { return; }
  chain = chain.then(async () => {
    try {
      const t = Date.now();
      const audio = await tts.generateAsync({ text: job.text, sid: job.sid, speed: job.speed });
      writeFileSync(job.out, wav(audio.samples, audio.sampleRate));
      say({ id: job.id, ok: true, ms: Date.now() - t, seconds: +(audio.samples.length / audio.sampleRate).toFixed(2) });
    } catch (error) {
      say({ id: job.id, ok: false, error: String(error?.message || error) });
    }
  });
}).on('close', () => process.exit(0));
