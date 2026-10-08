// Packages Read Aloud (read-aloud/) as a zip to unzip and run on another Windows computer:
//   node scripts/package-read-aloud.mjs
// It writes dist/read-aloud/Read Aloud/ (the folder as it will be installed) and dist/read-aloud/ReadAloud-<date>.zip.
//
// Layout, the same as in this repo so the program finds its parts the same way:
//   Read Aloud.vbs, Stop Read Aloud.vbs, Add desktop shortcut.vbs, README.txt
//   read-aloud/      server.mjs, index.html, presets.mjs, gender.mjs (never the cache), voice-worker/ with node_modules
//   runtime/node.exe, runtime/LICENSE
//   runtime/voice/   the game's downloaded voices: bin, kokoro, LICENSES (with the GPL source), manifest.json
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(repo, 'dist', 'read-aloud');
const stage = join(out, 'Read Aloud');
const voice = join(repo, 'runtime', 'voice');

for (const need of ['runtime/node.exe', 'runtime/LICENSE', 'runtime/voice/bin/sherpa-onnx-offline-tts.exe',
  'runtime/voice/kokoro/model.onnx', 'runtime/voice/kokoro/voices.bin', 'runtime/voice/LICENSES/README.txt']) {
  if (!existsSync(join(repo, need))) throw new Error(`Missing ${need}: Read Aloud cannot be packaged without it.`);
}

rmSync(out, { recursive: true, force: true });
mkdirSync(join(stage, 'read-aloud'), { recursive: true });
mkdirSync(join(stage, 'runtime'), { recursive: true });

// VBScript and Notepad want Windows line endings.
const crlf = (from, to) => writeFileSync(to, readFileSync(from, 'utf8').replace(/\r?\n/g, '\r\n'));
crlf(join(repo, 'Read Aloud.vbs'), join(stage, 'Read Aloud.vbs'));
for (const name of readdirSync(join(repo, 'read-aloud', 'package'))) crlf(join(repo, 'read-aloud', 'package', name), join(stage, name));
for (const name of ['server.mjs', 'index.html', 'presets.mjs', 'gender.mjs']) {
  cpSync(join(repo, 'read-aloud', name), join(stage, 'read-aloud', name));
}
// The voice helper that keeps Kokoro loaded, with its sherpa-onnx (npm install in read-aloud/voice-worker first).
const worker = join(repo, 'read-aloud', 'voice-worker');
if (!existsSync(join(worker, 'node_modules', 'sherpa-onnx-win-x64', 'sherpa-onnx.node'))) {
  throw new Error('read-aloud/voice-worker has no node_modules: run npm install there first.');
}
cpSync(worker, join(stage, 'read-aloud', 'voice-worker'), { recursive: true });
cpSync(join(repo, 'runtime', 'node.exe'), join(stage, 'runtime', 'node.exe'));
cpSync(join(repo, 'runtime', 'LICENSE'), join(stage, 'runtime', 'LICENSE'));
cpSync(voice, join(stage, 'runtime', 'voice'), { recursive: true });

const date = new Date().toISOString().slice(0, 10);
const zip = join(out, `ReadAloud-${date}.zip`);
// Windows' own tar writes a zip with -a; the zip holds the "Read Aloud" folder itself.
execFileSync(join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'tar.exe'), ['-a', '-c', '-f', zip, 'Read Aloud'],
  { cwd: out, stdio: 'inherit' });
console.log(`${zip}  ${(statSync(zip).size / 1048576).toFixed(0)} MB`);
