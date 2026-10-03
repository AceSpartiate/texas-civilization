// Join words (owner, 2026-10-03: "is it possible to use a word or phrase instead like a webpage?", then "could we make the join
// words be a join word? singular?" - and, by multiple choice, "Fewest words, no server"; docs/HOST_PAGE.md §2.17). Two or three
// words carry the Host laptop's private address (and its port when not 1835) to the page at playtexas.github.io, which sends the
// student to the bare address, where the class code is asked for. The page's decoder is the game's encoder: one module, copied.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { WORDS, DEFAULT_PORT, JOIN_SITE, decodeJoin, encodeJoin, isClassroomAddress, joinLink, suggestWords, wordIndex, wordsStartingWith } from '../sim/join-words.mjs';
import { createClassroom } from '../server/app.mjs';

const site = new URL('../site/playtexas/', import.meta.url);

// A small deterministic generator, so a failure names an address that can be tried again.
function* addresses(count, seed = 1) {
  let s = seed;
  const next = () => (s = (Math.imul(s, 1103515245) + 12345) >>> 0) / 2 ** 32;
  const byte = () => Math.floor(next() * 256);
  for (let i = 0; i < count; i++) {
    const kind = i % 3;
    const address = kind === 0 ? `192.168.${byte()}.${byte()}` : kind === 1 ? `10.${byte()}.${byte()}.${byte()}` : `172.${16 + Math.floor(next() * 16)}.${byte()}.${byte()}`;
    const port = i % 4 === 3 ? 1 + Math.floor(next() * 65535) : DEFAULT_PORT;
    yield { address, port };
  }
}

test('the list: 2048 words, a to z, 3 to 8 letters, each starting with its own four letters, and frozen', () => {
  assert.equal(WORDS.length, 2048);
  assert.equal(new Set(WORDS).size, 2048);
  for (const word of WORDS) assert.match(word, /^[a-z]{3,8}$/, word);
  assert.equal(new Set(WORDS.map(word => word.slice(0, 4))).size, 2048, 'two words start with the same four letters');
  // The page and every game in every classroom must read the same list (the module's ceiling): it never changes.
  assert.equal(createHash('sha256').update(WORDS.join('\n')).digest('hex'), '294471f121812ae45aa8920c9cab21630cb2914950d03918310e98a7c61f8b4e');
  // And the same words for the same address, whoever made them and whenever.
  for (const [address, port, words] of [
    ['192.168.1.20', 1835, 'address pasta'], ['192.168.4.38', 1835, 'amulet crane'], ['10.12.200.7', 1835, 'aqua canoe tumble'],
    ['172.20.1.9', 1835, 'mosaic caramel bubble'], ['192.168.1.20', 3000, 'acrobat flapjack ketchup crescent'],
    ['10.255.0.1', 3000, 'zoo able believe swamp orange'],
  ]) assert.equal(encodeJoin({ address, port }).join(' '), words, `${address}:${port}`);
});

test('fewest words: 2 for 192.168 on the usual port, 3 for 10.x and 172.16-31, more only for another port', () => {
  assert.equal(encodeJoin({ address: '192.168.0.1' }).length, 2);
  assert.equal(encodeJoin({ address: '192.168.255.255', port: DEFAULT_PORT }).length, 2);
  assert.equal(encodeJoin({ address: '10.0.0.1' }).length, 3);
  assert.equal(encodeJoin({ address: '172.16.0.1' }).length, 3);
  assert.equal(encodeJoin({ address: '172.31.255.254' }).length, 3);
  assert.equal(encodeJoin({ address: '192.168.1.20', port: 3000 }).length, 4);
  assert.equal(encodeJoin({ address: '172.20.1.9', port: 8080 }).length, 4);
  assert.equal(encodeJoin({ address: '10.1.2.3', port: 3000 }).length, 5);
  // The class code is not carried (owner, "Fewest words"): the same words whatever the code, so New Class leaves them alone.
  assert.deepEqual(encodeJoin({ address: '192.168.1.20', code: '6744EF' }), encodeJoin({ address: '192.168.1.20', code: 'ABC123' }));
});

test('every address round-trips: the words lead back to the address and port that made them, and to the bare address', () => {
  let count = 0;
  for (const { address, port } of addresses(30000)) {
    const words = encodeJoin({ address, port });
    const read = decodeJoin(words.join(' '));
    assert.ok(read.ok, `${address}:${port} -> ${words.join(' ')} did not read back`);
    assert.equal(read.address, address); assert.equal(read.port, port);
    assert.equal(read.url, `http://${address}:${port}/`);
    count++;
  }
  // Every one of the 65,536 two-word addresses, exhaustively.
  for (let a = 0; a < 256; a++) for (let b = 0; b < 256; b++) {
    const read = decodeJoin(encodeJoin({ address: `192.168.${a}.${b}` }).join(' '));
    assert.equal(read.ok && read.address, `192.168.${a}.${b}`);
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
  // And nothing typed decodes to anything else: every pair and triple of words (a sample) is private or refused.
  for (let i = 0; i < 20000; i++) {
    const read = decodeJoin(`${WORDS[(i * 7919) % 2048]} ${WORDS[(i * 104729) % 2048]}${i % 2 ? ` ${WORDS[(i * 31) % 2048]}` : ''}`);
    if (read.ok) assert.ok(isClassroomAddress(read.address), read.address);
  }
});

test('typing is forgiven where it can be: case, hyphens, commas, spaces, and anything after the fourth letter', () => {
  const words = encodeJoin({ address: '10.12.200.7' }); // aqua canoe tumble
  for (const typed of ['AQUA CANOE TUMBLE', 'aqua-canoe-tumble', ' aqua,  canoe , tumble ', 'Aqua\tCanoe\nTumble', 'aquaa canoo tumbel', '#aqua-canoe-tumble']) {
    assert.equal(decodeJoin(typed).address, '10.12.200.7', typed);
  }
  assert.equal(wordIndex('squirel'), WORDS.indexOf('squirrel'));
  assert.equal(wordIndex('ca'), -1);
  assert.equal(wordIndex('cats'), -1);
  assert.deepEqual(decodeJoin(words.join(' ')).words, words);
});

test('a typo is caught rather than sending a student somewhere else', () => {
  // A word not on the list: refused, with where it is and the nearest words.
  const unknown = decodeJoin('amulet crame');
  assert.equal(unknown.ok, false); assert.equal(unknown.reason, 'unknown'); assert.equal(unknown.place, 2);
  assert.ok(unknown.suggestions.includes('crane'), unknown.suggestions.join());
  assert.ok(suggestWords('nee').includes('knee'));
  assert.ok(wordsStartingWith('squ').includes('squirrel'));
  assert.equal(decodeJoin('').reason, 'empty');
  assert.equal(decodeJoin('amulet').reason, 'short');
  assert.equal(decodeJoin('a b c d e f'.split(' ').map((_, i) => WORDS[i]).join(' ')).reason, 'long');
  // A word swapped for another word on the list, two words swapped, a word dropped or one added: refused all but rarely - the
  // check bits are what is left of the words (6 on the two-word form, so about 1 in 64 slips through; module's ceiling).
  const rate = (form, mutate) => {
    let tried = 0, slipped = 0;
    for (const { address, port } of addresses(4000, 7)) {
      const words = encodeJoin({ address, port });
      if (words.length !== form) continue;
      for (const changed of mutate(words)) {
        tried++;
        const read = decodeJoin(changed.join(' '));
        if (read.ok && !(read.address === address && read.port === port)) slipped++;
      }
    }
    return { tried, slipped, rate: slipped / tried };
  };
  const substitutions = words => words.flatMap((_, place) => [1, 5, 77, 1023].map(step => words.map((word, at) => at === place ? WORDS[(WORDS.indexOf(word) + step) % 2048] : word)));
  const swaps = words => words.length > 1 && words[0] !== words[1] ? [[words[1], words[0], ...words.slice(2)]] : [];
  const drops = words => words.map((_, place) => words.filter((__, at) => at !== place));
  const adds = words => [[...words, WORDS[42]], [WORDS[1999], ...words]];
  // A dropped or added word lands on another form - two words, or four - and meets that form's check instead.
  for (const [form, limits] of [[2, { substitutions: 1 / 32, swaps: 1 / 32, drops: 1 / 32, adds: 1 / 32 }], [3, { substitutions: 1 / 128, swaps: 1 / 128, drops: 1 / 32, adds: 1 / 32 }]]) {
    for (const [name, mutate] of Object.entries({ substitutions, swaps, drops, adds })) {
      const limit = limits[name];
      const { tried, slipped, rate: seen } = rate(form, mutate);
      assert.ok(tried > 50, `${form}-word ${name}: only ${tried} tried`);
      assert.ok(seen <= limit, `${form}-word ${name}: ${slipped} of ${tried} slipped through (${(seen * 100).toFixed(2)}%)`);
    }
  }
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
  assert.equal(joinLink(['amulet', 'crane']), 'https://playtexas.github.io/#amulet-crane');
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
    assert.deepEqual(state.joinWords.words, ['address', 'pasta']);
    assert.equal(state.joinWords.address, '192.168.1.20');
    assert.equal(state.joinWords.url, `http://192.168.1.20:${DEFAULT_PORT}/${code}`, 'the card\'s address and QR code still carry the code');
    assert.equal(state.joinWords.link, 'https://playtexas.github.io/#address-pasta');
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
