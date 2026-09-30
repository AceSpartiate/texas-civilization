// The class code inside the address (owner, 2026-09-30: "why do players need to enter a join code? if multiple hosts are on the
// same network, why dont we have different addresses for that?" - and, asked by multiple choice, "Code inside the address").
// The Host shows `http://<laptop>:3000/<code>`: one thing to type. The server answers a single path segment of a class code's
// shape with the join page and nothing else; the code is checked at the join, the away list and the claim as it always was, and
// one that came in the address is answered as an old class's address. The bare address, `?code=` and `/host` are as they were.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createClassroom } from '../server/app.mjs';

function client(port) {
  const jar = new Map();
  const header = () => [...jar].map(([name, value]) => `${name}=${value}`).join('; ');
  return {
    async call(path, data) {
      const response = await fetch(`http://127.0.0.1:${port}${path}`, {
        method: data ? 'POST' : 'GET',
        headers: { ...(data && { 'Content-Type': 'application/json' }), ...(jar.size && { Cookie: header() }) },
        ...(data && { body: JSON.stringify(data) }),
      });
      for (const raw of response.headers.getSetCookie()) {
        const [pair] = raw.split(';');
        const index = pair.indexOf('=');
        jar.set(pair.slice(0, index), pair.slice(index + 1));
      }
      return { status: response.status, body: await response.json() };
    },
  };
}
const command = (caller, action, extra = {}) => caller.call('/api/command', { id: `cmd-${Math.random().toString(36).slice(2)}${Date.now()}`, action, ...extra });
async function classroom() {
  const dir = mkdtempSync(join(tmpdir(), 'texas-code-address-'));
  const app = createClassroom({ seed: 'code-address', savePath: join(dir, 'class.json'), playerCount: 6, tickMs: 1000 });
  const port = await app.listen(0, '127.0.0.1'), base = `http://127.0.0.1:${port}`;
  const host = client(port);
  await host.call('/api/host', { key: app.state.hostKey });
  return { app, port, base, host, dispose: async () => { await app.close(); rmSync(dir, { recursive: true, force: true }); } };
}
const page = readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
const get = (url, init) => fetch(url, { redirect: 'manual', ...init });

test('the address with the class code in it is the join page; anything else of its kind is a 404, as before', async () => {
  const { app, base, dispose } = await classroom();
  try {
    const code = app.state.sessionCode;
    for (const path of [`/${code}`, `/${code.toLowerCase()}`, '/', '/host', `/?code=${code}`, '/0O1IlA']) {
      const response = await get(base + path);
      assert.equal(response.status, 200, `${path} is not the page`);
      assert.match(response.headers.get('content-type'), /^text\/html/);
      assert.equal(await response.text(), page, `${path} is not the join page`);
    }
    // A trailing slash is sent to the address without it, so the page's relative addresses resolve as they do at `/`.
    const slashed = await get(`${base}/${code}/`);
    assert.equal(slashed.status, 308);
    assert.equal(slashed.headers.get('location'), `/${code}`);
    // Not a class code's shape, a second segment, a file-like name, or anything but GET: what any unknown path always got - "Join
    // this class first" to a stranger, a 404 to somebody in the class - and never the page or a file.
    const cookie = { headers: { Cookie: `${(await get(`${base}/api/host`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: app.state.hostKey }) })).headers.get('set-cookie').split(';')[0]}` } };
    const stranger = (await get(`${base}/no-such-page`)).status;
    assert.equal(stranger, 401);
    for (const path of ['/ZZZZZZ', '/ABCDEFG', '/ABCDE', `/${code}/app.js`, `/${code}/..%2Fserver%2Fapp.mjs`, '/ABC12G', '/AB.C12', `/${code}.js`, '/..%2F..', '/%2E%2E%2Fpa', `/${code}//`]) {
      const anonymous = await get(base + path);
      assert.equal(anonymous.status, stranger, `${path} answered ${anonymous.status} to a stranger`);
      assert.doesNotMatch(await anonymous.text(), /<html|import |export /i, `${path} sent a page or a file`);
      const known = await get(base + path, cookie);
      assert.equal(known.status, 404, `${path} answered ${known.status} in the class`);
    }
    const posted = await get(`${base}/${code}`, { method: 'POST', headers: { ...cookie.headers, 'Content-Type': 'application/json' }, body: '{}' });
    assert.equal(posted.status, 404, 'only a GET is the page');
  } finally { await dispose(); }
});

test('a code from the address joins with only a name; a wrong or old one is answered as an old class address, at every door', async () => {
  const { app, port, host, dispose } = await classroom();
  try {
    const code = app.state.sessionCode;
    const student = client(port);
    const joined = await student.call('/api/join', { name: 'From the address', code, via: 'address' });
    assert.equal(joined.status, 200, joined.body.error);
    // The same leniency as a typed code: case, and the look-alikes.
    const lenient = await client(port).call('/api/join', { name: 'Lower case', code: code.toLowerCase().replace(/0/g, 'o').replace(/1/g, 'l'), via: 'address' });
    assert.equal(lenient.status, 200, lenient.body.error);
    // A New Class deals another code: yesterday's address is an old class's, and said so, with the code box to come back.
    await command(host, 'new-class', { name: 'Period 5' });
    const fresh = app.state.sessionCode;
    assert.notEqual(fresh, code);
    const old = await client(port).call('/api/join', { name: 'Yesterday', code, via: 'address' });
    assert.equal(old.status, 403);
    assert.equal(old.body.codeRefused, true);
    assert.match(old.body.error, /^This is an old class address\. Look at the Host screen for today’s address/);
    // Typed, the words are the ones there always were.
    const typed = await client(port).call('/api/join', { name: 'Typed wrong', code });
    assert.equal(typed.status, 403);
    assert.equal(typed.body.error, 'Check the class code on the Host screen.');
    // The away list and the claim: the same answer, counted as a wrong try as a typed one is.
    const away = await client(port).call('/api/away', { code, via: 'address' });
    assert.equal(away.status, 403);
    assert.match(away.body.error, /^This is an old class address/);
    const claim = await client(port).call('/api/claim', { code, householdId: 'hh-1', via: 'address' });
    assert.equal(claim.status, 403);
    assert.match(claim.body.error, /^This is an old class address/);
    const right = await client(port).call('/api/away', { code: fresh, via: 'address' });
    assert.equal(right.status, 200, right.body.error);
    // The bare address's way still works: the code typed.
    assert.equal((await client(port).call('/api/join', { name: 'Typed right', code: fresh })).status, 200);
  } finally { await dispose(); }
});

test('five wrong codes from the address make that device wait, as five typed ones do', async () => {
  const { port, dispose } = await classroom();
  try {
    const device = client(port);
    for (let i = 0; i < 5; i++) assert.equal((await device.call('/api/away', { code: 'ABCDEF', via: 'address' })).status, 403);
    assert.equal((await device.call('/api/away', { code: 'ABCDEF', via: 'address' })).status, 429, 'the address opened a door the limits do not hold');
  } finally { await dispose(); }
});

test('the Host shows one address with the code in it, the QR code is that address, and the page reads the code from it', () => {
  const app = readFileSync(new URL('../public/app.js', import.meta.url), 'utf8');
  assert.match(app, /const coded = url => `\$\{url\.replace\(\/\\\/\$\/, ''\)\}\$\{code \? `\/\$\{code\}` : ''\}`;/, 'the join address is not the address with the code in it');
  assert.match(app, /qrSvg\(plain, /, 'the QR code is not the address shown');
  assert.doesNotMatch(app, /code=\$\{encodeURIComponent\(code\)\}/, 'the QR code still carries ?code=');
  assert.match(app, /const CODE_IN_ADDRESS = \/\^\\\/\(\[0-9A-Fa-fOoIiLl\]\{6\}\)\$\/;/);
  const launcher = readFileSync(new URL('../launcher/ServerControl.cs', import.meta.url), 'utf8');
  assert.match(launcher, /PrimaryJoinUrl =>[^;]*ClassCode/, 'the launcher shows the address without the code');
});
