// The regressions the read-aloud checks guard (owner, 2026-09-30, D15; docs/READ_ALOUD.md), injected one at a time (CLAUDE.md:
// "A new test is not evidence until it has failed"). Each replaces one exact piece of a file with the mistake a test is
// written against, runs the test files, records which tests failed, checks that the test written for it is among them, and
// puts the file back byte for byte.
//
// Run: npm run test:read-aloud-injections  → writes docs/evidence/read-aloud-injections.json
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const FILES = ['tests/read-aloud-text.test.mjs', 'tests/read-aloud-service.test.mjs', 'tests/read-aloud-server.test.mjs', 'tests/audio-licenses.test.mjs', 'tests/read-aloud-ending.test.mjs'];
const T = {
  names: 'every famous person, every name the Tejano', accents: 'no accented name the game can say', respell: 'the respellings are the ones checked',
  ascii: 'what the voice is given is plain ASCII', split: 'a line is split where sentences end', template: 'a template\'s fixed sentences',
  key: 'a sentence in a voice has one key', voices: 'the page and the server have the same voices', volume: 'the voice is as loud as the Sound setting',
  pressed: 'a line a student pressed is spoken before', moves: 'a line waiting in the server\'s own queue moves up', words: 'only the game\'s words are spoken',
  pack: 'the package\'s sentences are ready at once', prune: 'the server\'s own queue keeps only its newest lines', available: 'only a joined page may ask',
  served: 'a page\'s line is made and then served', notice: 'what a rider and the family\'s own person say is begun', recorded: 'read-aloud speaks only in voices the manifest records',
  gpl: 'the voice\'s programs are recorded',
  // The end of the game and the starving card (owner, 2026-09-30, answers to the read-aloud questions).
  parts: 'every part of a family\'s breakdown is read', hostSpeaks: 'the Host will speak every sentence of a real family',
  long: 'a long reading is asked for a line at a time', skip: 'a sentence the Host will not speak is passed over',
  turns: 'when many pages press at once', students: 'two students pressing at once take turns', card: 'the messages card reads its eyebrow',
};
const INJECTIONS = [
  { name: 'a Tejano pool name nobody checked (Cayetano\'s row gone)', file: 'server/voice/pronunciation.mjs', from: "  'Cayetano': 'Kah-yeh-tah-no',\n", to: '', expect: T.names },
  { name: 'a name read as written, taken off the checked list (Pedro)', file: 'server/voice/pronunciation.mjs', from: "'Anselmo', 'Pedro', 'Miguel',", to: "'Anselmo', 'Miguel',", expect: T.names },
  { name: 'an accented town keeper not respelled (Treviño)', file: 'server/voice/pronunciation.mjs', from: "  'Treviño': 'Treh-veen-yo',\n", to: '', expect: T.accents },
  { name: 'respelling inside other words', file: 'server/voice/pronunciation.mjs', from: "new RegExp(`(?<!${letter})${escape(written.normalize('NFC'))}(?!${letter})`, 'gu')", to: "new RegExp(escape(written.normalize('NFC')), 'gu')", expect: T.respell },
  { name: 'the accent kept in what the voice is given', file: 'server/voice/text.mjs', from: ".normalize('NFD').replace(/\\p{M}/gu, '').replace(/[^\\x20-\\x7E]/g, ' ')", to: ".normalize('NFC')", expect: T.ascii },
  { name: '"Col." read as the end of a sentence', file: 'server/voice/text.mjs', from: "'Mr', 'Mrs', 'Ms', 'Dr', 'Col', ", to: "'Mr', 'Mrs', 'Ms', 'Dr', ", expect: T.split },
  { name: 'a template\'s hole not taken for the start of a sentence', file: 'server/voice/text.mjs', from: '[\\p{Lu}\\p{N}\\u{E000}]|\\s*\\u{E000})/gu', to: '[\\p{Lu}\\p{N}])/gu', expect: T.template },
  { name: 'the voice left out of the key', file: 'server/voice/text.mjs', from: '.update(`${MODEL}|${voice.id}|${spoken(sentence)}`)', to: '.update(`${MODEL}|${spoken(sentence)}`)', expect: T.key },
  { name: 'a mother read in a man\'s voice', file: 'public/read-aloud.js', from: "const WOMAN_ROLES = new Set(['mother', 'daughter',", to: "const WOMAN_ROLES = new Set(['daughter',", expect: T.voices },
  { name: 'the voice heard with Sound off', file: 'public/read-aloud.js', from: '  if (!settings || settings.muted) return 0;', to: '  if (!settings) return 0;', expect: T.volume },
  { name: 'the server\'s own lines spoken before a pressed one', file: 'server/voice/service.mjs', from: 'const job = nextPressed() || soon.shift();', to: 'const job = soon.shift() || nextPressed();', expect: T.pressed },
  { name: 'a pressed line left waiting in the server\'s queue', file: 'server/voice/service.mjs', from: 'if (at >= 0) { soon.splice(at, 1); job.queued = now(); job.who = who; pressed.push(job); }', to: 'if (at >= 0) { job.queued = now(); job.who = who; }', expect: T.moves },
  { name: 'any words spoken, not only the game\'s', file: 'server/voice/service.mjs', from: '        const allowed = speakable(sentence, theirs());', to: '        const allowed = true;', expect: T.words },
  { name: 'a class\'s own names not counted as its words', file: 'server/voice/service.mjs', from: 'all.has(word) || extra?.has(word) ||', to: 'all.has(word) ||', expect: T.words },
  { name: 'the package\'s sentences never read', file: 'server/voice/service.mjs', from: 'packages.set(stamp, { keys: new Set(Object.keys(manifest.lines || {})),', to: 'packages.set(stamp, { keys: new Set(),', expect: T.pack },
  { name: 'the kept sounds never pruned', file: 'server/voice/service.mjs', from: '    if (cacheBytes <= capBytes) return;', to: '    return;', expect: T.prune },
  { name: 'a class with no voice says it can read aloud', file: 'server/app.mjs', from: "return json(res, 200, { available: Boolean(voice?.available),", to: "return json(res, 200, { available: true,", expect: T.available },
  { name: 'the classroom never begins the lines it writes', file: 'server/app.mjs', from: '    voiceNotice();\n', to: '', expect: T.notice },
  { name: 'the rider\'s words begun in the narrator\'s voice', file: 'server/app.mjs', from: "voice: line.speaker === 'rider' ? 'rider' : voiceOfPerson(world.entities[encounter.listenerId])", to: "voice: 'narrator'", expect: T.notice },
  { name: 'a woman spoken in another voice than the manifest records', file: 'server/voice/text.mjs', from: "woman: Object.freeze({ id: 'af_kore', sid: 5,", to: "woman: Object.freeze({ id: 'af_sarah', sid: 9,", expect: T.recorded },
  { name: 'espeak-ng recorded as running inside the game', file: 'public/assets/audio/licenses.json', from: '"separateProcess": true,', to: '"separateProcess": false,', expect: T.gpl },
  { name: 'the voice loaded into node.exe', file: 'server/voice/service.mjs', from: "import { spawn } from 'node:child_process';", to: "import { spawn } from 'node:child_process';\nconst inProcess = () => process.dlopen;", expect: T.gpl },
  // The end of the game and the starving card (owner, 2026-09-30).
  { name: 'the breakdown\'s neighbours left unread', file: 'public/ending.js', from: '  if (family.neighbours?.length) reading.neighbours = [', to: '  if (false) reading.neighbours = [', expect: T.parts },
  { name: 'coin in and out read as a sign', file: 'public/ending.js', from: "const coinSaid = amount => `${amount > 0 ? 'came in' : 'went out'}: ${reales(Math.abs(amount))}`;", to: 'const coinSaid = amount => signed(amount);', expect: T.parts },
  { name: 'the sum read as symbols', file: 'public/ending.js', from: "const mathSaid = text => String(text ?? '').replace(", to: "const mathSaid = text => String(text ?? '') || ''.replace(", expect: T.parts },
  { name: 'a name\'s possessive refused', file: 'server/voice/service.mjs', from: "every(word => ours(word) || ours(word.replace(/['’]s$/, '')))", to: 'every(word => ours(word))', expect: T.hostSpeaks },
  { name: 'a long reading asked all at once', file: 'public/read-aloud.js', from: "(await ask('/api/voice', { lines: [line] })).parts", to: "(await ask('/api/voice', { lines: clean })).parts.filter((part, at) => at === clean.indexOf(line))", expect: T.long },
  { name: 'a refused sentence stops the reading', file: 'public/read-aloud.js', from: 'if (!part?.ready) { skipped++; continue; }', to: 'if (!part?.ready) { skipped++; return; }', expect: T.skip },
  { name: 'a page\'s turns forgotten: first come, first spoken', file: 'server/voice/service.mjs', from: 'const rank = (turns.get(job.who) || 0) + (ahead.get(job.who) || 0);', to: 'const rank = at;', expect: T.turns },
  { name: 'the classroom never says whose page asked', file: 'server/app.mjs', from: ", who: identity.householdId || identity.role }));", to: ' }));', expect: T.students },
  { name: 'the card\'s title said twice', file: 'public/read-aloud.js', from: '    if (!said || out.some(one => plain(one).includes(said))) continue;', to: '    if (!said) continue;', expect: T.card },
];

const failing = output => [...new Set([...output.matchAll(/^\s*✖ (.+?) \(\d/gm)].map(match => match[1].trim()).filter(name => !/^tests[\\/]/.test(name) && name !== 'failing tests:'))];
const run = () => { const result = spawnSync(process.execPath, ['--test', '--test-timeout=60000', ...FILES], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 600000 }); return failing(`${result.stdout}${result.stderr}`); };

for (const injection of INJECTIONS) {
  const original = readFileSync(injection.file, 'utf8');
  if (!original.replace(/\r\n/g, '\n').includes(injection.from)) throw new Error(`Injection pattern not found in ${injection.file}: ${injection.name}`);
}
const clean = run();
if (clean.length) throw new Error(`The tests fail before anything is injected: ${clean.join('; ')}`);
const record = [];
for (const injection of INJECTIONS) {
  const original = readFileSync(injection.file, 'utf8');
  const crlf = original.includes('\r\n');
  const text = original.replace(/\r\n/g, '\n').replace(injection.from, injection.to);
  writeFileSync(injection.file, crlf ? text.replace(/\n/g, '\r\n') : text);
  let failed;
  try { failed = run(); } finally { writeFileSync(injection.file, original); }
  const caught = failed.some(name => name.includes(injection.expect));
  const only = caught && failed.every(name => name.includes(injection.expect));
  record.push({ name: injection.name, file: injection.file, expected: injection.expect, caught, only, failed });
  console.log(`${caught ? (only ? 'CAUGHT' : 'CAUGHT+') : 'MISSED'}  ${injection.name}${caught && !only ? ` (also: ${failed.filter(name => !name.includes(injection.expect)).join('; ')})` : ''}`);
}
mkdirSync('docs/evidence', { recursive: true });
writeFileSync('docs/evidence/read-aloud-injections.json', `${JSON.stringify({ record: 'read-aloud-injections', date: new Date().toISOString().slice(0, 10), files: FILES, caught: record.filter(one => one.caught).length, of: record.length, injections: record }, null, 2)}\n`);
const missed = record.filter(one => !one.caught);
console.log(`\n${record.length - missed.length} of ${record.length} caught. Wrote docs/evidence/read-aloud-injections.json`);
if (missed.length) process.exit(1);
