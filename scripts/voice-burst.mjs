// The Host's worst moment for read-aloud, measured (owner, 2026-09-30, D15; docs/READ_ALOUD.md §6): thirty families given a line
// with their own person's name in it at once - the settlement's call answered, each family's volunteer reaching Gonzales - so
// thirty sentences no package can hold are queued on the teacher's laptop together. While the real voice speaks them, a class
// of thirty families on the real land is stepped once a second in this same process, as the server's tick is, and timed.
//
// Recorded: how long until each line is ready (first, median, last), the voice's own real-time factor, what one student's press
// on the 25th line waits (it goes to the front), and the tick's own time and the server's event-loop delay before and during.
//
//   node scripts/voice-burst.mjs [threads]    (default 2; the Host uses 2, or 1 on four cores or fewer)
// Writes docs/evidence/read-aloud/voice-burst-<threads>t.json. Same computer only: a school laptop was not measured.
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { cpus, loadavg, tmpdir, totalmem } from 'node:os';
import { join } from 'node:path';
import { monitorEventLoopDelay } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { createVoice } from '../server/voice/service.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { rollFamily, stepWorld } from '../sim/world.mjs';
import { SETTLEMENT_CALLS } from '../sim/calls.mjs';
import { POOLS } from '../sim/starts.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const threads = Number(process.argv[2]) || 2;
const cache = mkdtempSync(join(tmpdir(), 'voice-burst-'));
const voice = createVoice({ runtimeDir: join(root, 'runtime', 'voice'), packageDir: join(root, 'public', 'voice'), cacheDir: cache, threads });
if (!voice.hostVoice) throw new Error('No voice in runtime/voice: node scripts/bundle-voice.mjs');
const cpuLoad = () => { try { return Number(execSync('powershell -NoProfile -Command "(Get-CimInstance Win32_Processor | Measure-Object -Property LoadPercentage -Average).Average"', { encoding: 'utf8' }).trim()); } catch { return null; } };

// Thirty families, thirty people with their own names, the line the game writes when each reaches the gathering.
const given = [...POOLS.anglo.father, ...POOLS.tejano.father].slice(0, 30);
const surnames = ['Crane', 'Whitfield', 'Garza', 'Pruett', 'Lozano', 'Hale', 'Benavides', 'Tolliver', 'Kerr', 'Arocha', 'Blevins', 'Ybarbo', 'Stroud', 'Sosa', 'Pell', 'Treviño', 'Varner', 'Cantú', 'Hext', 'Rosales', 'Fenn', 'Ibarra', 'Marsh', 'Huizar', 'Pike', 'Villegas', 'Oakes', 'Lerma', 'Birdwell', 'Cárdenas'];
const names = new Set();
const lines = given.map((first, i) => { const name = `${first} ${surnames[i]}`; for (const word of name.toLowerCase().split(' ')) names.add(word); return { text: SETTLEMENT_CALLS['san-felipe'].there(name), voice: 'narrator' }; });

// The class being ticked meanwhile: thirty families on the real land, running.
const world = createGonzalesWorld('voice-burst', 30, { map: 'colonies', neighbours: true });
for (const household of Object.values(world.households)) rollFamily(world, household);
world.status = 'running';
for (let i = 0; i < 20; i++) stepWorld(world);
const loop = monitorEventLoopDelay({ resolution: 10 });
const ticks = { before: [], during: [] };
let phase = 'before';
const tick = () => { const started = performance.now(); stepWorld(world); ticks[phase].push(performance.now() - started); };
const stats = list => { const sorted = [...list].sort((a, b) => a - b); const at = q => sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))]; return { n: sorted.length, median: +at(0.5).toFixed(1), p95: +at(0.95).toFixed(1), max: +sorted.at(-1).toFixed(1) }; };

const loadBefore = cpuLoad();
loop.enable();
const timer = setInterval(tick, 1000);
await new Promise(resolve => setTimeout(resolve, 15000));
const delayBefore = { p50: +(loop.percentile(50) / 1e6).toFixed(1), p99: +(loop.percentile(99) / 1e6).toFixed(1), max: +(loop.max / 1e6).toFixed(1) };
loop.reset();
phase = 'during';

// The burst: every family's line as the server writes it (`soon`), then one student presses the 25th.
const started = performance.now();
const keys = lines.map(line => voice.request([line], { priority: 'soon', names }).parts.map(part => part.key));
const readyAt = new Map();
await new Promise(resolve => setTimeout(resolve, 3000));
const pressedKey = keys[24][0];
const pressedAt = performance.now();
voice.request([lines[24]], { priority: 'pressed', names });
const loadDuring = [];
while (keys.some(set => set.some(key => !voice.ready(key)))) {
  for (const set of keys) for (const key of set) if (!readyAt.has(key) && voice.ready(key)) readyAt.set(key, performance.now() - started);
  if (loadDuring.length < 3 && (performance.now() - started) > 10000 * (loadDuring.length + 1)) loadDuring.push(cpuLoad());
  await new Promise(resolve => setTimeout(resolve, 100));
}
for (const set of keys) for (const key of set) if (!readyAt.has(key)) readyAt.set(key, performance.now() - started);
const total = performance.now() - started;
clearInterval(timer);
const delayDuring = { p50: +(loop.percentile(50) / 1e6).toFixed(1), p99: +(loop.percentile(99) / 1e6).toFixed(1), max: +(loop.max / 1e6).toFixed(1) };
loop.disable();
const times = [...readyAt.values()].sort((a, b) => a - b);
const log = voice.stats.log;
const audioSeconds = log.reduce((sum, one) => sum + one.chars, 0) / 15;
const result = {
  date: new Date().toISOString().slice(0, 10), machine: `${cpus()[0].model}, ${cpus().length} logical cores, ${Math.round(totalmem() / 2 ** 30)} GB`,
  shared: 'Measured on the owner\'s desktop while other builders\' test suites ran on it (load recorded).', cpuLoadPercent: { before: loadBefore, during: loadDuring },
  threads, lines: lines.length, sentences: keys.flat().length, sample: lines[0].text,
  readySeconds: { first: +(times[0] / 1000).toFixed(1), median: +(times[Math.floor(times.length / 2)] / 1000).toFixed(1), last: +(times.at(-1) / 1000).toFixed(1) },
  perSentenceMs: { mean: Math.round(voice.stats.msTotal / Math.max(1, voice.stats.spoken)), ...stats(log.map(one => one.tookMs)) },
  pressedTwentyFifth: { waitedSeconds: +(((readyAt.get(pressedKey) ?? total) - (pressedAt - started)) / 1000).toFixed(1), orderSpoken: log.findIndex(one => one.key === pressedKey) + 1 },
  opusBytes: { total: voice.stats.audioBytes, perSentence: Math.round(voice.stats.audioBytes / Math.max(1, voice.stats.spoken)) },
  roughAudioSeconds: Math.round(audioSeconds),
  tickMs: { before: stats(ticks.before), during: stats(ticks.during) }, eventLoopDelayMs: { before: delayBefore, during: delayDuring },
  failed: voice.stats.failed,
};
voice.close();
rmSync(cache, { recursive: true, force: true });
mkdirSync(join(root, 'docs', 'evidence', 'read-aloud'), { recursive: true });
writeFileSync(join(root, 'docs', 'evidence', 'read-aloud', `voice-burst-${threads}t.json`), `${JSON.stringify(result, null, 1)}\n`);
console.log(JSON.stringify(result, null, 1));
process.exit(0);
