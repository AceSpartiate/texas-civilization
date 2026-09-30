// Speak every fixed sentence of the game once, at package time, on the developer's machine (owner, 2026-09-30, D15;
// docs/READ_ALOUD.md §4): the tips, the calls, the army's questions, the timeline's news, the riders' words that name
// nobody. What is made is Ogg Opus in public/voice/<key>.opus with public/voice/manifest.json, which scripts/package.ps1
// ships and the Host's voice (server/voice/service.mjs) plays without speaking anything. Made, not kept: public/voice/ is
// not in git, like the WebP art.
//
//   node scripts/build-voice.mjs              speak what is missing (from the shared cache first), drop what is no longer said
//   node scripts/build-voice.mjs --check      exit 1 unless every fixed sentence is there and nothing else is
//   node scripts/build-voice.mjs --only <n>   speak at most n missing sentences (a proof's quick build); the manifest lists
//                                             what is there
//   node scripts/build-voice.mjs --match <text>   speak only sentences containing <text>
//
// Needs runtime/voice (node scripts/bundle-voice.mjs). Every sentence spoken is also kept in a cache shared by every
// checkout on this computer (%LOCALAPPDATA%\TexasRevolution\voice-build, or VOICE_BUILD_CACHE), so a second worktree or
// the next release speaks only what changed. `VOICE_BUILD_JOBS` sentences are spoken at once (a third of the cores).
import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { cpus } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CONVERSATIONS } from '../sim/encounters.mjs';
import { HOLE, MODEL, VOICES, keyOf, splitSentences } from '../server/voice/text.mjs';
import { fixedSentences, readable, sourceVocabulary } from '../server/voice/inventory.mjs';
import { kokoroSynthesiser, runtimeReady } from '../server/voice/service.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
export const OUT = join(root, 'public', 'voice');
const runtimeDir = join(root, 'runtime', 'voice');
const shared = process.env.VOICE_BUILD_CACHE || join(process.env.LOCALAPPDATA || join(root, 'output'), 'TexasRevolution', 'voice-build');

/**
 * Every fixed sentence and the voice it is spoken in. The narrator reads everything the game writes; a rider's words that
 * name nobody are his (read out of sim/encounters.mjs `CONVERSATIONS` with every name and number a hole), and what a
 * family's person asks him is said in both a man's and a woman's voice, since either may be the one at the gate.
 */
export function inventory() {
  const lines = new Map();
  const add = (role, sentence) => { if (readable(sentence)) lines.set(keyOf(role, sentence), { role, text: sentence }); };
  for (const sentence of fixedSentences()) add('narrator', sentence);
  const hole = new Proxy({}, { get: (_, name) => (name === 'firsthand' || name === 'tellerSaw' ? undefined : name === 'hands' ? 2 : HOLE) });
  for (const script of Object.values(CONVERSATIONS)) {
    const said = [];
    for (const firsthand of [true, false]) for (const tellerSaw of [true, false]) for (const hands of [1, 2]) {
      const account = new Proxy({}, { get: (_, name) => (name === 'firsthand' ? firsthand : name === 'tellerSaw' ? tellerSaw : name === 'hands' ? hands : hole[name]) });
      said.push(script.opening(account), ...script.lines.map(line => line.answer(account)));
    }
    for (const text of said) for (const sentence of splitSentences(text)) add('rider', sentence);
    for (const line of script.lines) for (const sentence of splitSentences(line.ask)) { add('man', sentence); add('woman', sentence); }
  }
  return lines;
}

async function main() {
  const args = process.argv.slice(2);
  const only = args.includes('--only') ? Number(args[args.indexOf('--only') + 1]) : Infinity;
  const match = args.includes('--match') ? args[args.indexOf('--match') + 1] : null;
  const lines = inventory();
  mkdirSync(OUT, { recursive: true });
  if (args.includes('--check')) {
    const missing = [...lines.keys()].filter(key => !existsSync(join(OUT, `${key}.opus`)));
    const stale = readdirSync(OUT).filter(name => name.endsWith('.opus') && !lines.has(name.slice(0, -5)));
    console.log(`${lines.size} sentences; ${missing.length} not spoken; ${stale.length} no longer said.`);
    process.exitCode = missing.length || stale.length || !existsSync(join(OUT, 'manifest.json')) ? 1 : 0;
    return;
  }
  // What is no longer said goes; what the shared cache has is copied; the rest is spoken.
  for (const name of readdirSync(OUT)) if (name.endsWith('.opus') && !lines.has(name.slice(0, -5))) rmSync(join(OUT, name));
  mkdirSync(join(shared, 'tmp'), { recursive: true });
  let copied = 0;
  const todo = [];
  for (const [key, line] of lines) {
    if (existsSync(join(OUT, `${key}.opus`))) continue;
    if (existsSync(join(shared, `${key}.opus`))) { copyFileSync(join(shared, `${key}.opus`), join(OUT, `${key}.opus`)); copied++; continue; }
    if (match && !line.text.includes(match)) continue;
    todo.push({ key, ...line });
  }
  const speak = todo.slice(0, only);
  if (speak.length && !runtimeReady(runtimeDir)) throw new Error('The voice is not in runtime/voice: run node scripts/bundle-voice.mjs first.');
  const jobs = Math.max(1, Number(process.env.VOICE_BUILD_JOBS) || Math.floor(cpus().length / 3));
  console.log(`${lines.size} fixed sentences: ${lines.size - todo.length - copied} already here, ${copied} from the shared cache, ${speak.length} to speak with ${jobs} at once.`);
  const synth = kokoroSynthesiser({ runtimeDir, threads: 2 });
  const started = Date.now();
  let done = 0, failed = 0;
  const queue = [...speak];
  await Promise.all(Array.from({ length: jobs }, async () => {
    for (let job = queue.shift(); job; job = queue.shift()) {
      const wav = join(shared, 'tmp', `${job.key}.wav`), opus = join(shared, 'tmp', `${job.key}.opus`);
      try {
        await synth(job, { wav, opus });
        copyFileSync(opus, join(shared, `${job.key}.opus`));
        rmSync(opus, { force: true });
        copyFileSync(join(shared, `${job.key}.opus`), join(OUT, `${job.key}.opus`));
      } catch (error) { failed++; console.error(`  could not speak "${job.text.slice(0, 60)}": ${error.message}`); continue; }
      if (++done % 50 === 0 || done === speak.length) {
        const rate = (Date.now() - started) / done;
        console.log(`  ${done}/${speak.length} spoken, about ${Math.round((speak.length - done) * rate / 60000)} min left`);
      }
    }
  }));
  // The manifest: every sentence that is here, and the game's words for the Host's voice to check a page's asking against.
  const here = {};
  let bytes = 0;
  for (const [key, line] of lines) {
    const path = join(OUT, `${key}.opus`);
    if (!existsSync(path)) continue;
    const size = statSync(path).size;
    here[key] = { voice: line.role, text: line.text, bytes: size };
    bytes += size;
  }
  writeFileSync(join(OUT, 'manifest.json'), JSON.stringify({
    about: 'The read-aloud sentences spoken at package time (scripts/build-voice.mjs, docs/READ_ALOUD.md). Made, not kept in git.',
    model: MODEL, voices: Object.fromEntries(Object.entries(VOICES).map(([role, voice]) => [role, voice.id])),
    made: new Date().toISOString(), sentences: Object.keys(here).length, of: lines.size, bytes,
    vocabulary: [...sourceVocabulary()].sort(), lines: here,
  }));
  console.log(`public/voice: ${Object.keys(here).length} of ${lines.size} sentences, ${(bytes / 1048576).toFixed(1)} MB${failed ? `; ${failed} could not be spoken` : ''}.`);
  if (failed) process.exitCode = 1;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main().catch(error => { console.error(error.message); process.exitCode = 1; });
