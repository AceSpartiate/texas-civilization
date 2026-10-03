// Injections for join words (owner, 2026-10-03, "Fewest words, no server"; docs/HOST_PAGE.md §2.17). CLAUDE.md: "a new test is not
// evidence until it has failed". Each injection puts back one exact mistake, tests/join-words.test.mjs is run, and every file is
// restored. An injection is caught when every test it names fails; the record keeps whatever else failed with it.
// With --browser, two more are run against the browser proof (npm run test:join-words; PLAYWRIGHT_MODULE, BROWSER_EXECUTABLE).
// Run: node scripts/join-words-injections.mjs [--browser]
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const FILES = ['tests/join-words.test.mjs'];
const T = {
  list: 'the list: 2048 words, a to z, 3 to 8 letters, each starting with its own four letters, and frozen',
  fewest: 'fewest words: 2 for 192.168 on the usual port, 3 for 10.x and 172.16-31, more only for another port',
  round: 'every address round-trips: the words lead back to the address and port that made them, and to the bare address',
  private: 'only the three private ranges: the page can never be sent to the Internet',
  forgiven: 'typing is forgiven where it can be: case, hyphens, commas, spaces, and anything after the fourth letter',
  typo: 'a typo is caught rather than sending a student somewhere else',
  site: 'the page at playtexas.github.io decodes with the game\'s own module, and is self-contained',
  host: 'the Host is given the words for the students\' network, can choose another of this computer\'s addresses, and no student sees them',
  card: 'the Host\'s card and the join form: the words, then the class code, large; the code first on the bare address',
};
const W = 'public/join-words.js';
const INJECTIONS = [
  { name: 'a word on the list changed (crane spelt crate: two words with one start, and the frozen list moved)', expect: [T.list],
    file: W, from: ' crane ', to: ' cratee ' },
  { name: 'no check bits: every word pair is some address', expect: [T.typo, T.list],
    file: W, from: '  for (let bit = width - 1; bit >= 0; bit--) out.push(bit < 32 ? (hash >>> bit) & 1 : 0);', to: '  for (let bit = width - 1; bit >= 0; bit--) out.push(0);' },
  { name: 'the decoder takes words without making them again (no check at all)', expect: [T.typo],
    file: W, from: "  if (!again || again.length !== count || again.some((word, place) => word !== WORDS[indexes[place]])) return { ok: false, reason: 'check', count };", to: '' },
  { name: 'any address is a classroom address: the page could be sent to the Internet', expect: [T.private],
    file: W, from: "  if (a === 10) return 'wide';\n  return null;", to: "  return 'wide';" },
  { name: 'another port is not carried: the words lead to 1835 whatever the server listens on', expect: [T.round, T.fewest],
    file: W, from: '  if (port === DEFAULT_PORT) {', to: '  if (true) {' },
  { name: 'no two-word form: 192.168 takes the long way', expect: [T.fewest],
    file: W, from: "    if (network === 'home') { put(octets[2], 8); put(octets[3], 8); return { bits, count: 2 }; }\n", to: "    if (network === 'home') { put(0, 1); put(octets[2], 8); put(octets[3], 8); return { bits, count: 3 }; }\n" },
  { name: 'every letter of a word is read, so a misspelling after the fourth is refused', expect: [T.forgiven],
    file: W, from: "const key = token => String(token).toLowerCase().replace(/[^a-z]/g, '').slice(0, 4);", to: "const key = token => { const typed = String(token).toLowerCase().replace(/[^a-z]/g, ''); const word = WORDS[KEYS.get(typed.slice(0, 4))]; return word === typed ? typed.slice(0, 4) : typed; };" },
  { name: 'the page\'s copy of the module drifts from the game\'s', expect: [T.site],
    file: 'site/playtexas/join-words.js', from: "export const JOIN_SITE = 'playtexas.github.io';", to: "export const JOIN_SITE = 'playtexas.github.io'; // edited here" },
  { name: 'the logic styles the page (Astra\'s look would be overridden)', expect: [T.site],
    file: 'site/playtexas/page.js', from: "const state = name => { document.body.dataset.state = name; };", to: "const state = name => { document.body.dataset.state = name; document.body.style.background = 'white'; };" },
  { name: 'the page loads a font from the Internet', expect: [T.site],
    file: 'site/playtexas/index.html', from: '<link rel="stylesheet" href="style.css">', to: '<link rel="stylesheet" href="style.css"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Rye">' },
  { name: 'the Host is not given the words', expect: [T.host],
    file: 'server/app.mjs', from: 'joinWords: joinView(), ', to: '' },
  { name: 'the teacher\'s choice of network is ignored', expect: [T.host],
    file: 'server/app.mjs', from: '              joinPick = input.address;\n', to: '' },
  { name: 'any address is accepted as the students\' network', expect: [T.host],
    file: 'server/app.mjs', from: "              if (!joinUrls.some(entry => entry.address === input.address)) throw new Error('That is not one of this computer’s addresses.');\n", to: '' },
  { name: 'the words carry the class code into the address they lead to', expect: [T.round, T.host],
    file: W, from: 'export const joinAddress = ({ address, port = DEFAULT_PORT }) => `http://${address}:${port}/`;', to: 'export const joinAddress = ({ address, port = DEFAULT_PORT, code = \'6744EF\' }) => `http://${address}:${port}/${code}`;' },
  { name: 'the class code box after the name on the join form', expect: [T.card],
    file: 'public/index.html', from: '<label class="join-code-box">', to: '<input type="hidden" name="name"><label class="join-code-box">' },
  { name: 'the Host\'s card loses the class code beside the words', expect: [T.card],
    file: 'public/index.html', from: ' id="join-words-code"', to: '' },
];
const failing = output => [...output.matchAll(/^✖ (.+?) \(\d/gm)].map(match => match[1]).filter((name, index, all) => all.indexOf(name) === index);
const run = () => { try { execFileSync(process.execPath, ['--test', ...FILES], { encoding: 'utf8', stdio: 'pipe' }); return []; } catch (error) { return failing(`${error.stdout}`); } };

// A checkout with core.autocrlf has CRLF in some files: the injections are written with LF and matched either way.
const eol = (text, original) => (original.includes('\r\n') ? text.replace(/\r?\n/g, '\r\n') : text);
const results = [];
const clean = run();
if (clean.length) { console.error(`The tests fail before any injection: ${clean.join('; ')}`); process.exit(1); }
for (const injection of INJECTIONS) {
  const original = readFileSync(injection.file, 'utf8');
  injection.from = eol(injection.from, original); injection.to = eol(injection.to, original);
  if (!original.includes(injection.from)) { results.push({ ...injection, caught: false, why: 'the text to change is not there' }); console.log('MISSING', injection.name); continue; }
  writeFileSync(injection.file, original.replace(injection.from, injection.to));
  let failed;
  try { failed = run(); } finally { writeFileSync(injection.file, original); }
  const caught = injection.expect.every(name => failed.includes(name));
  results.push({ name: injection.name, file: injection.file, expect: injection.expect, failed, caught, alone: failed.length === injection.expect.length });
  console.log(caught ? 'CAUGHT' : 'MISSED', injection.name, failed.length > injection.expect.length ? `(and ${failed.length - injection.expect.length} more)` : '');
}

// The browser proof, against the page and the Host's card in a real browser.
if (process.argv.includes('--browser')) {
  const BROWSER = [
    { name: 'the page reads the words and never goes to the class', file: 'site/playtexas/page.js', from: '  setTimeout(() => location.assign(result.url), now ? 0 : 700);', to: '' },
    { name: 'the Host\'s card never shows the words', file: 'public/app.js', from: "  $('#join-words-box').hidden = !words;", to: "  $('#join-words-box').hidden = true;" },
    { name: 'the bare address puts the class code box after the name', file: 'public/index.html', from: '  <label>Your name <input name="name" required maxlength="40" autocomplete="off"></label>\n', to: '', after: '<label class="join-code-box">', insert: '  <label>Your name <input name="name" required maxlength="40" autocomplete="off"></label>\n' },
  ];
  for (const injection of BROWSER) {
    const original = readFileSync(injection.file, 'utf8');
    const from = eol(injection.from, original);
    if (!original.includes(from)) { results.push({ name: `browser: ${injection.name}`, caught: false, why: 'the text to change is not there' }); console.log('MISSING', injection.name); continue; }
    let changed = original.replace(from, eol(injection.to, original));
    if (injection.after) changed = changed.replace(injection.after, `${injection.insert.trimStart()}  ${injection.after}`);
    writeFileSync(injection.file, changed);
    let caught = false, said = '';
    try { execFileSync(process.execPath, ['scripts/join-words-browser-proof.mjs'], { encoding: 'utf8', stdio: 'pipe', timeout: 240000 }); }
    catch (error) { caught = true; said = String(error.stdout + error.stderr).split('\n').find(line => /AssertionError|Error:|Timeout/.test(line))?.trim() || 'failed'; }
    finally { writeFileSync(injection.file, original); }
    results.push({ name: `browser: ${injection.name}`, file: injection.file, proof: 'test:join-words', caught, said });
    console.log(caught ? 'CAUGHT' : 'MISSED', `browser: ${injection.name}`, said);
  }
  // Put the proof's own record back as a clean run leaves it.
  execFileSync(process.execPath, ['scripts/join-words-browser-proof.mjs'], { stdio: 'ignore', timeout: 240000 });
}
const caught = results.filter(result => result.caught).length;
console.log(`${caught} of ${results.length} caught.`);
mkdirSync('docs/evidence', { recursive: true });
writeFileSync('docs/evidence/join-words-injections.json', `${JSON.stringify({ record: 'join-words-injections', date: new Date().toISOString().slice(0, 10), caught, of: results.length, results }, null, 2)}\n`);
if (caught !== results.length) process.exitCode = 1;
