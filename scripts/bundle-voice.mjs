// Put the read-aloud voice's program and model beside the game, in runtime/voice/ (owner, 2026-09-30, D15; docs/READ_ALOUD.md
// §5), and record what it is - the way scripts/bundle-runtime.ps1 puts node.exe in runtime/. Like node.exe it is not in git
// (runtime/ is ignored): it is fetched here, checked against the SHA-256 pinned below, and shipped by scripts/package.ps1.
//
//   node scripts/bundle-voice.mjs                  download from the official places, check, unpack
//   node scripts/bundle-voice.mjs --from <folder>  take the archives from a folder instead (same names, same checks)
//   node scripts/bundle-voice.mjs --check          say whether runtime/voice is complete and matches its record
//
// What goes in, and why each (docs/AUDIO_LICENSES.md has the licences):
//   bin/sherpa-onnx-offline-tts.exe, onnxruntime*.dll   k2-fsa's standalone Windows build: runs Kokoro with no Python and no
//                                                        npm package. espeak-ng (GPL-3.0) is built into it, so it runs as a
//                                                        process of its own, never inside node.exe.
//   bin/opusenc.exe                                      Xiph's encoder (BSD): the WAV it speaks to the Ogg Opus a Chromebook plays.
//   kokoro/                                              Kokoro-82M v1.0, full precision (Apache-2.0), as sherpa-onnx packs it,
//                                                        with espeak-ng's data for English only.
//   LICENSES/                                            every licence, and the GPL's source: espeak-ng's, sherpa-onnx's and
//                                                        piper-phonemize's source archives and a written offer for the rest.
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { copyFileSync, createReadStream, existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const root = fileURLToPath(new URL('..', import.meta.url));
const target = join(root, 'runtime', 'voice');
const record = join(root, 'docs', 'evidence', 'voice-runtime-manifest.json');
// Windows' own tar (bsdtar) reads .tar.bz2, .tar.gz and .zip; Git's GNU tar takes "C:" for a remote host.
const TAR = join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'tar.exe');

/** Every download, from where its makers publish it, with the SHA-256 it had when it was read on 2026-09-30. */
export const DOWNLOADS = Object.freeze([
  { name: 'sherpa-onnx-v1.13.8-win-x64-shared-MT-Release.tar.bz2', url: 'https://github.com/k2-fsa/sherpa-onnx/releases/download/v1.13.8/sherpa-onnx-v1.13.8-win-x64-shared-MT-Release.tar.bz2', sha256: '6dffdc715a4465b989446a6105265d2cb345e7101591a17d35534b6758f6e8df', what: 'the voice program (sherpa-onnx 1.13.8, Apache-2.0, with ONNX Runtime, MIT, and espeak-ng, GPL-3.0)' },
  { name: 'kokoro-multi-lang-v1_0.tar.bz2', url: 'https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/kokoro-multi-lang-v1_0.tar.bz2', sha256: 'c5f7e2d2caf082bc1d20fb70334a61d99d20b484500aad32e7cf84c128ea3298', what: 'Kokoro-82M v1.0, full precision, and its 54 voices (Apache-2.0; hexgrad/Kokoro-82M, packed by k2-fsa)' },
  { name: 'opus-tools-0.2-win64.zip', url: 'https://archive.mozilla.org/pub/opus/win64/opus-tools-0.2-win64.zip', sha256: '84e643f1cc3fd26fc743ea7830392de765507f72846e24719804d3d07f1ad96f', what: 'opusenc (Xiph.Org opus-tools 0.2, BSD-2-Clause; libopus BSD-3-Clause), linked from opus-codec.org/downloads' },
  { name: 'espeak-ng-ed530aa113046142eb5115cf2fc9157854d0ffe1.zip', url: 'https://github.com/csukuangfj/espeak-ng/archive/ed530aa113046142eb5115cf2fc9157854d0ffe1.zip', sha256: 'e4e262cbe34f7fe21f91f1ba3397f2728e1f30eafbae7853f2b753a9ed13f0dd', what: 'the source of the espeak-ng built into the voice program (GPL-3.0): the commit and hash sherpa-onnx 1.13.8 pins in cmake/espeak-ng-for-piper.cmake', source: true },
  { name: 'piper-phonemize-f3ff95afc03640bc1399e113e83361192a2fafb4.zip', url: 'https://github.com/csukuangfj/piper-phonemize/archive/f3ff95afc03640bc1399e113e83361192a2fafb4.zip', sha256: 'd9cca4e2bdc7d6dd8dffb96a4668283dbd3f77a9c194a3e530c1e8eba9406a5d', what: 'the source of piper-phonemize (MIT), which joins espeak-ng to the voice program: pinned in cmake/piper-phonemize.cmake', source: true },
  { name: 'sherpa-onnx-1.13.8.tar.gz', url: 'https://github.com/k2-fsa/sherpa-onnx/archive/refs/tags/v1.13.8.tar.gz', sha256: 'b0374cc56dbc186d442ae73d5de743bb092470b640c4c50ce7b029044c0c4fa8', what: 'the source of the voice program itself (sherpa-onnx 1.13.8, Apache-2.0), with the build scripts that name every other part', source: true },
]);
/** The ONNX Runtime licence text, from its own repository at the version sherpa-onnx 1.13.8 builds against. */
const ORT_LICENSE = { url: 'https://raw.githubusercontent.com/microsoft/onnxruntime/v1.23.2/LICENSE', sha256: null };

const sha256 = path => new Promise((resolve, reject) => {
  const hash = createHash('sha256');
  createReadStream(path).on('data', chunk => hash.update(chunk)).on('end', () => resolve(hash.digest('hex'))).on('error', reject);
});
const hashBuffer = buffer => createHash('sha256').update(buffer).digest('hex');
function untar(archive, into, ...members) {
  mkdirSync(into, { recursive: true });
  const result = spawnSync(TAR, ['-xf', archive, '-C', into, ...members], { encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`Could not unpack ${archive}: ${result.stderr || result.error}`);
}
function walk(dir) {
  return readdirSync(dir).flatMap(name => { const path = join(dir, name); return statSync(path).isDirectory() ? walk(path) : [path]; });
}

async function fetchTo(url, path) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url}: ${response.status}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  writeFileSync(path, buffer);
  return buffer;
}

async function bundle({ from = null, force = false } = {}) {
  if (existsSync(target) && !force) throw new Error(`${relative(root, target)} is already there. Run with --force to make it again.`);
  const work = join(tmpdir(), `tr-voice-${Date.now()}`);
  mkdirSync(work, { recursive: true });
  try {
    const got = {};
    for (const item of DOWNLOADS) {
      const path = from ? join(from, item.name) : join(work, item.name);
      if (!from) { console.log(`Downloading ${item.url}`); await fetchTo(item.url, path); }
      else if (!existsSync(path)) throw new Error(`${item.name} is not in ${from}`);
      const actual = await sha256(path);
      if (actual !== item.sha256) throw new Error(`${item.name} is not the file that was checked: SHA-256 ${actual}, expected ${item.sha256}. Nothing was unpacked.`);
      got[item.name] = path;
      console.log(`  ${item.name}: SHA-256 checked`);
    }
    const stage = join(work, 'voice');
    for (const dir of ['bin', 'kokoro', 'LICENSES/source']) mkdirSync(join(stage, dir), { recursive: true });
    // The program: only what the voice uses.
    untar(got[DOWNLOADS[0].name], work);
    const cli = join(work, 'sherpa-onnx-v1.13.8-win-x64-shared-MT-Release', 'bin');
    for (const name of ['sherpa-onnx-offline-tts.exe', 'onnxruntime.dll', 'onnxruntime_providers_shared.dll']) copyFileSync(join(cli, name), join(stage, 'bin', name));
    // The model, with espeak-ng's data for English: every other language's dictionary is left out (17 MB to about 1 MB).
    untar(got[DOWNLOADS[1].name], work);
    const model = join(work, 'kokoro-multi-lang-v1_0');
    for (const name of ['model.onnx', 'voices.bin', 'tokens.txt']) renameSync(join(model, name), join(stage, 'kokoro', name));
    const data = join(model, 'espeak-ng-data');
    for (const path of walk(data)) {
      const rel = relative(data, path);
      if (/^[a-z]+_dict$/.test(rel) && rel !== 'en_dict') continue;
      mkdirSync(dirname(join(stage, 'kokoro', 'espeak-ng-data', rel)), { recursive: true });
      copyFileSync(path, join(stage, 'kokoro', 'espeak-ng-data', rel));
    }
    copyFileSync(join(model, 'LICENSE'), join(stage, 'LICENSES', 'Kokoro-82M-LICENSE.txt'));
    // The encoder alone: opusinfo (GPL-2.0) and opusdec are not needed and do not ship.
    untar(got[DOWNLOADS[2].name], join(work, 'opus'));
    const opus = walk(join(work, 'opus'));
    copyFileSync(opus.find(path => path.endsWith('opusenc.exe')), join(stage, 'bin', 'opusenc.exe'));
    copyFileSync(opus.find(path => path.endsWith('LICENSE')), join(stage, 'LICENSES', 'opus-tools-LICENSE.txt'));
    // The licences read out of the sources themselves, and the sources.
    untar(got['sherpa-onnx-1.13.8.tar.gz'], work, 'sherpa-onnx-1.13.8/LICENSE', 'sherpa-onnx-1.13.8/cmake');
    copyFileSync(join(work, 'sherpa-onnx-1.13.8', 'LICENSE'), join(stage, 'LICENSES', 'sherpa-onnx-LICENSE.txt'));
    untar(got['espeak-ng-ed530aa113046142eb5115cf2fc9157854d0ffe1.zip'], work, 'espeak-ng-ed530aa113046142eb5115cf2fc9157854d0ffe1/COPYING');
    copyFileSync(join(work, 'espeak-ng-ed530aa113046142eb5115cf2fc9157854d0ffe1', 'COPYING'), join(stage, 'LICENSES', 'espeak-ng-COPYING-GPL-3.0.txt'));
    untar(got['piper-phonemize-f3ff95afc03640bc1399e113e83361192a2fafb4.zip'], work, 'piper-phonemize-f3ff95afc03640bc1399e113e83361192a2fafb4/LICENSE.md');
    copyFileSync(join(work, 'piper-phonemize-f3ff95afc03640bc1399e113e83361192a2fafb4', 'LICENSE.md'), join(stage, 'LICENSES', 'piper-phonemize-LICENSE.txt'));
    const ortVersion = (readFileSync(join(work, 'sherpa-onnx-1.13.8', 'cmake', 'onnxruntime-win-x64.cmake'), 'utf8').match(/releases\/download\/v(\d+\.\d+\.\d+)\//) || [])[1];
    if (!ortVersion) throw new Error('The ONNX Runtime version could not be read from sherpa-onnx cmake/onnxruntime-win-x64.cmake.');
    const ortLicence = await fetchTo(ORT_LICENSE.url.replace('v1.23.2', `v${ortVersion}`), join(stage, 'LICENSES', 'onnxruntime-LICENSE.txt'));
    for (const item of DOWNLOADS.filter(one => one.source)) copyFileSync(got[item.name], join(stage, 'LICENSES', 'source', item.name));
    // The written offer for every other part of the voice program's source, named from its own build scripts.
    const deps = [];
    for (const file of readdirSync(join(work, 'sherpa-onnx-1.13.8', 'cmake')).filter(name => name.endsWith('.cmake') && !/onnxruntime-(android|linux|osx|wasm|win-arm|win-x86|win-x64-(gpu|directml|static))|googletest|pybind|portaudio|websocketpp|asio/.test(name))) {
      const text = readFileSync(join(work, 'sherpa-onnx-1.13.8', 'cmake', file), 'utf8');
      const url = text.match(/set\(\w+_URL\s+"(https:[^"]+)"/)?.[1];
      const hash = text.match(/set\(\w+_HASH\s+"SHA256=([0-9a-f]+)"/)?.[1];
      if (url) deps.push(`  ${file.replace('.cmake', '')}: ${url}${hash ? `\n    SHA-256 ${hash}` : ''}`);
    }
    writeFileSync(join(stage, 'LICENSES', 'README.txt'), readme({ ortVersion, deps }).replace(/\r?\n/g, '\r\n'));
    // What was put where, for the package and for `--check`.
    const files = {};
    for (const path of walk(stage)) {
      const rel = relative(stage, path).split('\\').join('/');
      files[rel] = { bytes: statSync(path).size, sha256: await sha256(path) };
    }
    const manifest = {
      manifestVersion: 1, application: 'texas-revolution-foundation', what: 'The read-aloud voice (docs/READ_ALOUD.md)',
      model: 'Kokoro-82M v1.0 fp32', onnxRuntime: ortVersion, bundledAtUtc: new Date().toISOString(),
      downloads: DOWNLOADS.map(({ name, url, sha256: hash, what }) => ({ name, url, sha256: hash, what })).concat([{ name: 'onnxruntime-LICENSE.txt', url: ORT_LICENSE.url.replace('v1.23.2', `v${ortVersion}`), sha256: hashBuffer(ortLicence), what: 'the ONNX Runtime licence (MIT)' }]),
      bytes: Object.values(files).reduce((sum, file) => sum + file.bytes, 0), files,
    };
    writeFileSync(join(stage, 'manifest.json'), JSON.stringify(manifest, null, 1));
    rmSync(target, { recursive: true, force: true });
    mkdirSync(dirname(target), { recursive: true });
    renameSync(stage, target);
    mkdirSync(dirname(record), { recursive: true });
    const { files: _, ...recorded } = manifest;
    writeFileSync(record, `${JSON.stringify({ ...recorded, files: Object.keys(files).length }, null, 1)}\n`);
    console.log(`The voice is in ${relative(root, target)}: ${Object.keys(files).length} files, ${(manifest.bytes / 1048576).toFixed(1)} MB.`);
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

function readme({ ortVersion, deps }) {
  return `The read-aloud voice of Texas Revolution: what it is made of, and whose it is.

The game reads its lines aloud with a computer voice made on this computer. Nothing here is sent anywhere.

  bin/sherpa-onnx-offline-tts.exe   sherpa-onnx 1.13.8 by k2-fsa (Apache-2.0, sherpa-onnx-LICENSE.txt). It has
                                    espeak-ng built in, which is under the GNU General Public License version 3
                                    (espeak-ng-COPYING-GPL-3.0.txt), so this program as a whole is under GPL-3.0.
                                    The game runs it as a separate program and never links it.
  bin/onnxruntime.dll,              ONNX Runtime ${ortVersion} by Microsoft (MIT, onnxruntime-LICENSE.txt).
  bin/onnxruntime_providers_shared.dll
  bin/opusenc.exe                   opus-tools 0.2 by the Xiph.Org Foundation (BSD, opus-tools-LICENSE.txt).
  kokoro/                           Kokoro-82M v1.0 by hexgrad (Apache-2.0, Kokoro-82M-LICENSE.txt), in the
                                    form sherpa-onnx publishes it, with espeak-ng's English data (GPL-3.0).

The source of the GPL-3.0 program
---------------------------------
source/ holds the complete source of espeak-ng as built into bin/sherpa-onnx-offline-tts.exe, and the source of
sherpa-onnx 1.13.8 and piper-phonemize, the parts that join it to the rest:

  espeak-ng-ed530aa113046142eb5115cf2fc9157854d0ffe1.zip
  sherpa-onnx-1.13.8.tar.gz          (build it with the instructions in its README; cmake/ names every part)
  piper-phonemize-f3ff95afc03640bc1399e113e83361192a2fafb4.zip

The build fetches these other parts, each under its own permissive licence, from where its makers publish it:

${deps.join('\n')}

Written offer: for at least three years from the date you received this copy, the publisher of Texas Revolution
will give anyone who asks a copy of the complete corresponding source of bin/sherpa-onnx-offline-tts.exe,
including every part named above, for no more than the cost of providing it. Ask through the project's releases
page, https://github.com/AceSpartiate/texas-civilization, or its owner.

The speech the voice makes is the game's own, and no licence above claims it.
`;
}

async function check() {
  const path = join(target, 'manifest.json');
  if (!existsSync(path)) { console.log('No voice in runtime/voice: run node scripts/bundle-voice.mjs'); process.exitCode = 1; return; }
  const manifest = JSON.parse(readFileSync(path, 'utf8'));
  const bad = [];
  for (const [rel, file] of Object.entries(manifest.files)) {
    const full = join(target, rel);
    if (!existsSync(full) || statSync(full).size !== file.bytes || await sha256(full) !== file.sha256) bad.push(rel);
  }
  if (bad.length) { console.log(`runtime/voice does not match its record: ${bad.join(', ')}`); process.exitCode = 1; return; }
  console.log(`runtime/voice matches its record: ${Object.keys(manifest.files).length} files, ${(manifest.bytes / 1048576).toFixed(1)} MB.`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  const from = args.includes('--from') ? args[args.indexOf('--from') + 1] : null;
  (args.includes('--check') ? check() : bundle({ from, force: args.includes('--force') })).catch(error => { console.error(error.message); process.exitCode = 1; });
}
