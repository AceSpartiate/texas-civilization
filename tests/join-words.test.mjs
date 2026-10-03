// Join words (owner, 2026-10-03: "is it possible to use a word or phrase instead like a webpage?" - "Fewest words, no server" -
// and then "3 words, ensure they're short, easy to type, and related to the texas revolution", port kept at 1835; docs/HOST_PAGE.md
// §2.17). Three words from a 1,024-word list of 1830s Texas carry the Host laptop's private address to the page at
// playtexas.github.io, which sends the student to the bare address, where the class code is asked for. The page's decoder is the
// game's encoder: one module, copied.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { WORDS, DEFAULT_PORT, JOIN_SITE, decodeJoin, encodeJoin, isClassroomAddress, joinLink, suggestWords, wordIndex, wordsStartingWith } from '../sim/join-words.mjs';
import { createClassroom } from '../server/app.mjs';

const site = new URL('../site/playtexas/', import.meta.url);
const RANGES = ['192.168', '172.16-31', '10.x'];

// A small deterministic generator, so a failure names an address that can be tried again.
function* addresses(count, seed = 1, { ports = true, only = null } = {}) {
  let s = seed;
  const next = () => (s = (Math.imul(s, 1103515245) + 12345) >>> 0) / 2 ** 32;
  const byte = () => Math.floor(next() * 256);
  for (let i = 0; i < count; i++) {
    const kind = only ?? RANGES[i % 3];
    const address = kind === '192.168' ? `192.168.${byte()}.${byte()}` : kind === '10.x' ? `10.${byte()}.${byte()}.${byte()}` : `172.${16 + Math.floor(next() * 16)}.${byte()}.${byte()}`;
    const port = ports && i % 4 === 3 ? 1 + Math.floor(next() * 65535) : DEFAULT_PORT;
    yield { address, port: port === DEFAULT_PORT && ports && i % 4 === 3 ? DEFAULT_PORT + 1 : port, kind };
  }
}

test('the list: 1,024 short words of 1830s Texas, each starting with its own four letters, none one letter from another, and frozen', () => {
  assert.equal(WORDS.length, 1024);
  assert.equal(new Set(WORDS).size, 1024);
  const long = WORDS.filter(word => word.length > 7);
  for (const word of WORDS) assert.match(word, /^[a-z]{3,8}$/, word);
  assert.deepEqual(long.sort(), ['columbia', 'gonzales', 'victoria'], 'only the three town names are longer than 7 letters');
  assert.equal(new Set(WORDS.map(word => word.slice(0, 4))).size, 1024, 'two words start with the same four letters');
  // No two words one letter apart, or one swap of neighbouring letters apart: a slip of one letter is a word not on the list.
  const near = (a, b) => {
    if (a.length === b.length) {
      const diff = [...a].map((c, i) => (c === b[i] ? -1 : i)).filter(i => i >= 0);
      return diff.length === 1 || (diff.length === 2 && diff[1] === diff[0] + 1 && a[diff[0]] === b[diff[1]] && a[diff[1]] === b[diff[0]]);
    }
    const [s, l] = a.length < b.length ? [a, b] : [b, a];
    return l.length - s.length === 1 && [...l].some((_, i) => l.slice(0, i) + l.slice(i + 1) === s);
  };
  for (let i = 0; i < WORDS.length; i++) for (let j = i + 1; j < WORDS.length; j++) assert.ok(!near(WORDS[i], WORDS[j]), `${WORDS[i]} and ${WORDS[j]}`);
  // Of the Texas Revolution: its places, people and things are on the list.
  for (const word of ['texas', 'alamo', 'goliad', 'gonzales', 'brazos', 'austin', 'houston', 'seguin', 'travis', 'zavala', 'cannon', 'musket', 'saddle', 'mule', 'oxcart', 'flag', 'adobe', 'mustang', 'pecan', 'norther', 'tejano', 'texian']) {
    assert.ok(WORDS.includes(word), `${word} is not on the list`);
  }
  // The page and every game in every classroom must read the same list (the module's ceiling): it never changes.
  assert.equal(createHash('sha256').update(WORDS.join('\n')).digest('hex'), '1656e67e3ea43222f6bc5bf0f22237407c776145e09a1c7297759230ff38878b');
  // And the same words for the same address, whoever made them and whenever.
  for (const [address, port, words] of [
    ['192.168.1.20', 1835, 'vapor erasmo slipper'], ['192.168.4.38', 1835, 'vaquero avoid upkeep'], ['10.12.200.7', 1835, 'bags sage ines'],
    ['172.20.1.9', 1835, 'thunder alive patsy'], ['10.5.0.2', 1835, 'almanac luisa cask'],
    ['192.168.1.20', 3000, 'young alive collie scarf cistern'], ['10.255.0.1', 3000, 'useful eager bedrock scarf fresh'],
  ]) assert.equal(encodeJoin({ address, port }).join(' '), words, `${address}:${port}`);
});

test('always three words, for every private range; five only for a port other than 1835', () => {
  for (const address of ['192.168.0.1', '192.168.255.255', '10.0.0.0', '10.255.255.255', '172.16.0.0', '172.31.255.255']) {
    assert.equal(encodeJoin({ address }).length, 3, address);
    assert.equal(encodeJoin({ address, port: DEFAULT_PORT }).length, 3, address);
  }
  for (const address of ['192.168.1.20', '172.20.1.9', '10.1.2.3']) assert.equal(encodeJoin({ address, port: 3000 }).length, 5, address);
  // Four words are never made, and refused.
  assert.equal(decodeJoin(encodeJoin({ address: '10.1.2.3', port: 3000 }).slice(0, 4).join(' ')).reason, 'count');
  // The class code is not carried: the same words whatever the code, so New Class leaves them alone.
  assert.deepEqual(encodeJoin({ address: '192.168.1.20', code: '6744EF' }), encodeJoin({ address: '192.168.1.20', code: 'ABC123' }));
});

test('every address round-trips, in all three ranges: the words lead back to the address and port that made them', () => {
  let count = 0;
  for (const { address, port } of addresses(30000)) {
    const words = encodeJoin({ address, port });
    const read = decodeJoin(words.join(' '));
    assert.ok(read.ok, `${address}:${port} -> ${words.join(' ')} did not read back`);
    assert.equal(read.address, address); assert.equal(read.port, port);
    assert.equal(read.url, `http://${address}:${port}/`);
    count++;
  }
  // Every 192.168 address and every 172.16-31 address on the usual port, exhaustively; and the edges of 10.x.
  for (let a = 0; a < 256; a++) for (let b = 0; b < 256; b++) {
    assert.equal(decodeJoin(encodeJoin({ address: `192.168.${a}.${b}` }).join(' ')).address, `192.168.${a}.${b}`);
  }
  for (let s = 16; s < 32; s++) for (let a = 0; a < 256; a++) for (let b = 0; b < 256; b += 3) {
    assert.equal(decodeJoin(encodeJoin({ address: `172.${s}.${a}.${b}` }).join(' ')).address, `172.${s}.${a}.${b}`);
  }
  for (const address of ['10.0.0.0', '10.0.0.1', '10.255.255.255', '10.128.0.0', '172.16.0.0', '172.31.255.255', '192.168.0.0', '192.168.255.255']) {
    assert.equal(decodeJoin(encodeJoin({ address }).join(' ')).address, address);
  }
  assert.ok(count === 30000);
});

test('only the three private ranges: the page can never be sent to the Internet', () => {
  for (const address of ['8.8.8.8', '127.0.0.1', '172.15.0.1', '172.32.0.1', '192.169.1.1', '169.254.1.1', '100.64.0.1', '1.2.3', 'x.y.z.w', '', '256.1.1.1']) {
    assert.equal(encodeJoin({ address }), null, address);
    assert.equal(isClassroomAddress(address), false, address);
  }
  for (const address of ['10.0.0.0', '172.16.0.0', '172.31.255.255', '192.168.0.0']) assert.ok(isClassroomAddress(address), address);
  for (const port of [0, 65536, -1, 1.5, 'x']) assert.equal(encodeJoin({ address: '192.168.1.1', port }), null, String(port));
  // And nothing typed decodes to anything else: three and five words (a sample) are private or refused.
  for (let i = 0; i < 20000; i++) {
    const three = `${WORDS[(i * 7919) % 1024]} ${WORDS[(i * 104729) % 1024]} ${WORDS[(i * 31) % 1024]}`;
    const read = decodeJoin(i % 2 ? three : `${three} ${WORDS[(i * 13) % 1024]} ${WORDS[(i * 17) % 1024]}`);
    if (read.ok) assert.ok(isClassroomAddress(read.address), read.address);
  }
});

test('typing is forgiven where it can be: case, hyphens, commas, spaces, and anything after the fourth letter', () => {
  const words = encodeJoin({ address: '192.168.1.20' }); // vapor erasmo slipper
  for (const typed of ['VAPOR ERASMO SLIPPER', 'vapor-erasmo-slipper', ' vapor,  erasmo , slipper ', 'Vapor\tErasmo\nSlipper', 'vaporr erasmoo slipr', '#vapor-erasmo-slipper']) {
    assert.equal(decodeJoin(typed).address, '192.168.1.20', typed);
  }
  assert.equal(wordIndex('stirup'), WORDS.indexOf('stirrup'));
  assert.equal(wordIndex('gonzalez'), WORDS.indexOf('gonzales'));
  assert.equal(wordIndex('ca'), -1);
  assert.equal(wordIndex('cats'), -1);
  assert.deepEqual(decodeJoin(words.join(' ')).words, words);
});

test('a typo is caught rather than sending a student somewhere else: measured, and reported', () => {
  // A word not on the list: refused, with where it is and the nearest words.
  const unknown = decodeJoin('vapor ersamo slipper');
  assert.equal(unknown.ok, false); assert.equal(unknown.reason, 'unknown'); assert.equal(unknown.place, 2);
  assert.ok(unknown.suggestions.includes('erasmo'), unknown.suggestions.join());
  assert.ok(suggestWords('nee').includes('knee'));
  assert.ok(wordsStartingWith('sti').includes('stirrup'));
  assert.equal(decodeJoin('').reason, 'empty');
  assert.equal(decodeJoin('vapor erasmo').reason, 'short');
  assert.equal(decodeJoin(WORDS.slice(0, 6).join(' ')).reason, 'long');
  // A word swapped for another word on the list, two words swapped, a word dropped or one added: refused all but rarely. Each
  // address owns a block of values and exactly one value in it is right (56 for 10.x, 64 for 172.16-31, 1024 for 192.168), so a
  // slip lands on a right value about 1 time in the block size of wherever it lands.
  const rate = (only, mutate) => {
    let tried = 0, slipped = 0;
    for (const { address, port } of addresses(3000, 7, { ports: false, only })) {
      const words = encodeJoin({ address, port });
      for (const changed of mutate(words)) {
        tried++;
        const read = decodeJoin(changed.join(' '));
        if (read.ok && !(read.address === address && read.port === port)) slipped++;
      }
    }
    return { tried, slipped, rate: slipped / tried };
  };
  const substitutions = words => words.flatMap((_, place) => [1, 5, 77, 512, 1023].map(step => words.map((word, at) => at === place ? WORDS[(WORDS.indexOf(word) + step) % 1024] : word)));
  const swaps = words => [[words[1], words[0], words[2]], [words[0], words[2], words[1]], [words[2], words[1], words[0]]].filter(changed => changed.join() !== words.join());
  const drops = words => words.map((_, place) => words.filter((__, at) => at !== place));
  const adds = words => [[...words, WORDS[42], WORDS[7]], [WORDS[999], WORDS[3], ...words]];
  // The ceilings each range is held to, a little above what the blocks give (1/56, 1/64, 1/1024 where a slip stays in its range).
  // Measured 2026-10-03: 192.168 substitutions 1 in 344, swaps 1 in 76; 172.16-31 1 in 86 and 1 in 57; 10.x 1 in 68 and 1 in 58;
  // a dropped word never (two words are refused); an added pair about 1 in 1000 (the five-word form's 1 in 960).
  const limits = { '192.168': { substitutions: 1 / 200, swaps: 1 / 45, drops: 0, adds: 1 / 400 }, '172.16-31': { substitutions: 1 / 55, swaps: 1 / 40, drops: 0, adds: 1 / 400 }, '10.x': { substitutions: 1 / 45, swaps: 1 / 40, drops: 0, adds: 1 / 400 } };
  const report = {};
  for (const range of RANGES) {
    for (const [name, mutate] of Object.entries({ substitutions, swaps, drops, adds })) {
      const { tried, slipped, rate: seen } = rate(range, mutate);
      (report[range] ||= {})[name] = { tried, slipped, rate: Number(seen.toFixed(5)), oneIn: slipped ? Math.round(tried / slipped) : null };
      assert.ok(tried > 1000, `${range} ${name}: only ${tried} tried`);
      assert.ok(seen <= limits[range][name], `${range} ${name}: ${slipped} of ${tried} slipped through (${(seen * 100).toFixed(2)}%)`);
    }
  }
  // Reported, so the rates in docs/HOST_PAGE.md §2.17 are the ones measured.
  mkdirSync(new URL('../docs/evidence/', import.meta.url), { recursive: true });
  writeFileSync(new URL('../docs/evidence/join-words-typo-rates.json', import.meta.url), `${JSON.stringify({ record: 'join-words-typo-rates', words: 3, list: WORDS.length, rates: report }, null, 2)}\n`);
});

test('the page at playtexas.github.io decodes with the game\'s own module, and is self-contained', () => {
  // Byte for byte the game's module (scripts/playtexas-site.mjs --sync makes the copy).
  assert.ok(readFileSync(new URL('join-words.js', site)).equals(readFileSync(new URL('../sim/join-words.mjs', import.meta.url))),
    'site/playtexas/join-words.js is not sim/join-words.mjs: run node scripts/playtexas-site.mjs --sync');
  // The page's own files, and beyond them only the look's pictures (Astra's assets/) and her hand-off README (not published).
  const files = readdirSync(site, { recursive: true }).map(name => String(name).replace(/\\/g, '/')).sort();
  for (const needed of ['.nojekyll', 'index.html', 'join-words.js', 'page.js', 'style.css']) assert.ok(files.includes(needed), `site/playtexas/${needed} is missing`);
  for (const other of files.filter(name => !['.nojekyll', 'index.html', 'join-words.js', 'page.js', 'style.css', 'README.md', 'assets'].includes(name))) {
    assert.match(other, /^assets\/[\w.-]+\.(png|webp|jpg|svg|woff2?)$/, `site/playtexas/${other} is neither the page nor its look`);
  }
  // Every picture the look asks for is there, so the page needs nothing from anywhere else.
  for (const [, asset] of readFileSync(new URL('style.css', site), 'utf8').matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)) {
    if (!asset.startsWith('data:')) assert.ok(files.includes(asset), `style.css asks for ${asset}, which is not in site/playtexas/`);
  }
  const html = readFileSync(new URL('index.html', site), 'utf8'), page = readFileSync(new URL('page.js', site), 'utf8');
  const css = readFileSync(new URL('style.css', site), 'utf8');
  // Nothing from anywhere else: no external script, style, font, image or tracker, and no fetch, storage or cookie.
  for (const [name, text] of [['index.html', html], ['page.js', page], ['style.css', css]]) {
    assert.doesNotMatch(text.replace(/<!--[\s\S]*?-->/g, '').replace(/^\s*\/\/.*$/gm, ''), /(src|href)\s*=\s*["']?(https?:)?\/\/|@import|url\(\s*["']?https?:/i, `${name} loads something from elsewhere`);
    assert.doesNotMatch(text.replace(/^\s*\/\/.*$/gm, ''), /\bfetch\(|XMLHttpRequest|localStorage|sessionStorage|indexedDB|document\.cookie|navigator\.sendBeacon/, `${name} fetches or stores`);
  }
  assert.match(html, /<link rel="stylesheet" href="style\.css">/);
  assert.match(html, /<script type="module" src="page\.js"><\/script>/);
  assert.match(page, /from '\.\/join-words\.js'/);
  // The split Astra's visuals rely on (docs/DEPLOYMENT.md): no look in the logic, no logic in the markup.
  assert.doesNotMatch(page, /\.style\b|style=|cssText|<svg|\.png|\.webp|url\(/, 'page.js styles or draws');
  assert.doesNotMatch(html.replace(/<!--[\s\S]*?-->/g, ''), /<style|style=|<script(?![^>]*src="page\.js")/, 'index.html carries a look or a script of its own');
  for (const hook of ['join', 'words', 'go', 'suggest', 'read', 'say', 'going', 'going-to', 'going-link', 'help', 'help-address', 'help-tell']) {
    assert.match(html, new RegExp(`id="${hook}"`), `the hook #${hook} is gone from the markup`);
    // #go is the form's submit button: a hook for the look, used by the logic through #join.
    if (hook !== 'go') assert.match(page, new RegExp(`#${hook}\\b`), `page.js no longer uses #${hook}`);
  }
  assert.equal(JOIN_SITE, 'playtexas.github.io');
  assert.equal(joinLink(['vapor', 'erasmo', 'slipper']), 'https://playtexas.github.io/#vapor-erasmo-slipper');
});

function client(port) {
  const jar = new Map();
  return async (path, data) => {
    const response = await fetch(`http://127.0.0.1:${port}${path}`, {
      method: data ? 'POST' : 'GET',
      headers: { ...(data && { 'Content-Type': 'application/json' }), ...(jar.size && { Cookie: [...jar].map(([k, v]) => `${k}=${v}`).join('; ') }) },
      ...(data && { body: JSON.stringify(data) }),
    });
    for (const raw of response.headers.getSetCookie()) { const [pair] = raw.split(';'); const at = pair.indexOf('='); jar.set(pair.slice(0, at), pair.slice(at + 1)); }
    return { status: response.status, body: await response.json() };
  };
}

test('the Host is given the words for the students\' network, can choose another of this computer\'s addresses, and no student sees them', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'texas-join-words-'));
  const joinUrls = [];
  const app = createClassroom({ seed: 'join-words', savePath: join(dir, 'class.json'), playerCount: 5, tickMs: 1000, joinUrls });
  try {
    const port = await app.listen(0, '127.0.0.1');
    joinUrls.push({ label: 'Wi-Fi', address: '192.168.1.20', url: `http://192.168.1.20:${DEFAULT_PORT}/` },
      { label: 'NordLynx', address: '10.5.0.2', url: `http://10.5.0.2:${DEFAULT_PORT}/` }, { label: 'Odd', address: '148.61.2.9', url: `http://148.61.2.9:${DEFAULT_PORT}/` });
    const host = client(port), student = client(port);
    await host('/api/host', { key: app.state.hostKey });
    let state = (await host('/api/state')).body;
    const code = app.state.sessionCode;
    assert.deepEqual(state.joinWords.words, ['vapor', 'erasmo', 'slipper']);
    assert.equal(state.joinWords.address, '192.168.1.20');
    assert.equal(state.joinWords.url, `http://192.168.1.20:${DEFAULT_PORT}/${code}`, 'the card\'s address and QR code still carry the code');
    assert.equal(state.joinWords.link, 'https://playtexas.github.io/#vapor-erasmo-slipper');
    assert.equal(decodeJoin(state.joinWords.words.join(' ')).url, `http://192.168.1.20:${DEFAULT_PORT}/`, 'the words lead to the bare address');
    assert.deepEqual(state.joinWords.choices.map(choice => [choice.address, choice.classroom]), [['192.168.1.20', true], ['10.5.0.2', true], ['148.61.2.9', false]]);
    // The teacher chooses the VPN's network: the words, the address and the QR code follow; the class code is unchanged.
    const choose = address => host('/api/command', { id: `cmd-join-${Math.random().toString(36).slice(2)}`, action: 'join-network', address });
    assert.equal((await choose('10.5.0.2')).status, 200);
    state = (await host('/api/state')).body;
    assert.equal(state.joinWords.address, '10.5.0.2');
    assert.equal(state.joinWords.words.length, 3);
    assert.equal(decodeJoin(state.joinWords.words.join(' ')).address, '10.5.0.2');
    assert.equal(state.joinWords.url, `http://10.5.0.2:${DEFAULT_PORT}/${code}`);
    // A public address: no words, said plainly; and an address that is not this computer's is refused.
    assert.equal((await choose('148.61.2.9')).status, 200);
    state = (await host('/api/state')).body;
    assert.equal(state.joinWords.words, null); assert.equal(state.joinWords.classroom, false);
    assert.notEqual((await choose('8.8.8.8')).status, 200);
    // A student never gets the Host's join card, nor can choose.
    assert.equal((await student('/api/join', { name: 'Ann', code })).status, 200);
    const seen = (await student('/api/state')).body;
    assert.equal(seen.joinWords, undefined); assert.equal(seen.sessionCode, undefined);
    await student('/api/command', { id: `cmd-join-student-${Date.now()}`, action: 'join-network', address: '192.168.1.20' });
    state = (await host('/api/state')).body;
    assert.equal(state.joinWords.address, '148.61.2.9', 'a student changed the Host\'s network');
  } finally { await app.close(); rmSync(dir, { recursive: true, force: true }); }
});

test('the Host\'s card and the join form: the words, then the class code, large; the code first on the bare address', () => {
  const html = readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
  const app = readFileSync(new URL('../public/app.js', import.meta.url), 'utf8');
  for (const id of ['join-words-box', 'join-site', 'join-words', 'join-words-code', 'join-check', 'join-network', 'join-it', 'join-it-copy']) assert.match(html, new RegExp(`id="${id}"`), id);
  assert.match(app, /action: 'join-network'/);
  // The code box before the name, on the join form.
  const form = html.slice(html.indexOf('<form id="join"'), html.indexOf('</form>', html.indexOf('<form id="join"')));
  assert.ok(form.indexOf('name="code"') < form.indexOf('name="name"'), 'the class code is not first on the join form');
});
