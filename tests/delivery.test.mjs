// How the server's bytes travel (server/delivery.mjs, docs/PERFORMANCE_LOAD.md): scripts and large JSON gzipped for a
// browser that takes it, a reload of the page answered 304 instead of the whole script, and an atlas whose URL names its
// own hash kept by the browser for good - so a Chromebook's second visit downloads no art at all.
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { createClassroom } from '../server/app.mjs';
import { acceptsGzip, PINNED_CACHE, REVALIDATE_CACHE } from '../server/delivery.mjs';

const publicRoot = fileURLToPath(new URL('../public/', import.meta.url));

// The literal request, with exactly the headers given: fetch would ask for gzip and undo it behind the test's back.
function request(port, path, headers = {}, method = 'GET', body) {
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname: '127.0.0.1', port, path, method, headers }, res => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, bytes: Buffer.concat(chunks) }));
      res.on('error', reject);
    });
    req.on('error', reject);
    req.end(body);
  });
}
const unzipped = response => response.headers['content-encoding'] === 'gzip' ? gunzipSync(response.bytes) : response.bytes;

test('the page\'s scripts go gzipped to a browser that takes gzip, and a reload is answered 304', async () => {
  const app = createClassroom({ playerCount: 5 });
  const port = await app.listen(0, '127.0.0.1');
  try {
    const file = readFileSync(`${publicRoot}app.js`);
    const zipped = await request(port, '/app.js', { 'Accept-Encoding': 'gzip, deflate' });
    assert.equal(zipped.status, 200);
    assert.equal(zipped.headers['content-encoding'], 'gzip', 'app.js went uncompressed to a browser that asked for gzip');
    assert.ok(zipped.bytes.length < file.length / 2, `app.js gzipped is ${zipped.bytes.length} of ${file.length} bytes`);
    assert.deepEqual(gunzipSync(zipped.bytes), file);
    assert.equal(Number(zipped.headers['content-length']), zipped.bytes.length);
    assert.match(zipped.headers.vary, /Accept-Encoding/);
    // Never kept without asking, so an updated game is never run from an old copy.
    assert.equal(zipped.headers['cache-control'], 'no-cache');
    const again = await request(port, '/app.js', { 'Accept-Encoding': 'gzip', 'If-None-Match': zipped.headers.etag });
    assert.equal(again.status, 304, 'a reload fetched the whole of app.js again');
    assert.equal(again.bytes.length, 0);
    // A browser that does not take gzip, or refuses it, gets the file as it is - and not the gzip's validator.
    for (const headers of [{}, { 'Accept-Encoding': 'gzip;q=0, identity' }]) {
      const plain = await request(port, '/app.js', headers);
      assert.equal(plain.headers['content-encoding'], undefined, JSON.stringify(headers));
      assert.deepEqual(plain.bytes, file);
      assert.notEqual(plain.headers.etag, zipped.headers.etag);
      assert.equal((await request(port, '/app.js', { ...headers, 'If-None-Match': zipped.headers.etag })).status, 200);
    }
  } finally { await app.close(); }
});

test('a large JSON answer goes gzipped, a small one as it is', async () => {
  const app = createClassroom({ playerCount: 5 });
  const port = await app.listen(0, '127.0.0.1');
  try {
    const joined = await request(port, '/api/join', { 'Content-Type': 'application/json' }, 'POST', JSON.stringify({ name: 'Delivery reader', code: app.state.sessionCode }));
    const cookie = joined.headers['set-cookie'][0].split(';')[0];
    const map = await request(port, '/api/map', { Cookie: cookie, 'Accept-Encoding': 'gzip' });
    assert.equal(map.status, 200);
    assert.equal(map.headers['content-encoding'], 'gzip', 'the map went uncompressed');
    assert.equal(map.headers['cache-control'], 'no-store');
    const plain = await request(port, '/api/map', { Cookie: cookie });
    assert.equal(plain.headers['content-encoding'], undefined);
    assert.deepEqual(JSON.parse(unzipped(map)), JSON.parse(plain.bytes));
    const small = await request(port, '/api/state', { 'Accept-Encoding': 'gzip' });
    assert.equal(small.status, 401);
    assert.equal(small.headers['content-encoding'], undefined, 'a one-line refusal was gzipped');
    assert.deepEqual(JSON.parse(small.bytes), { error: 'Join this class first.' });
  } finally { await app.close(); }
});

test('an atlas asked for by its own hash is kept for good; any other asking is revalidated', async () => {
  const atlas = JSON.parse(readFileSync(`${publicRoot}assets/frontier-v1/atlas.json`, 'utf8'));
  const [name, sheet] = Object.entries(atlas.sheets)[0];
  const path = `/assets/frontier-v1/${sheet.image}`;
  const bytes = readFileSync(`${publicRoot}assets/frontier-v1/${sheet.image}`);
  const sha = createHash('sha256').update(bytes).digest('hex');
  assert.equal(sheet.sha256, sha, `the manifest's hash of ${name} is not its file's`);
  const app = createClassroom({ playerCount: 5 });
  const port = await app.listen(0, '127.0.0.1');
  try {
    const pinned = await request(port, `${path}?v=${sha.slice(0, 16)}`, { 'Accept-Encoding': 'gzip' });
    assert.equal(pinned.status, 200);
    assert.equal(pinned.headers['cache-control'], PINNED_CACHE, 'a sheet asked for by its own hash is not kept');
    assert.equal(pinned.headers['content-encoding'], undefined, 'a PNG was gzipped');
    assert.deepEqual(pinned.bytes, bytes);
    for (const version of ['', `?v=${'0'.repeat(16)}`, `?v=${sha.slice(0, 8)}`]) {
      const other = await request(port, `${path}${version}`);
      assert.equal(other.headers['cache-control'], REVALIDATE_CACHE, `${version || 'no version'} was kept for good`);
    }
    const unchanged = await request(port, path, { 'If-None-Match': pinned.headers.etag });
    assert.equal(unchanged.status, 304);
    // The manifest is JSON and goes gzipped, with its own validator.
    const manifest = await request(port, '/assets/frontier-v1/atlas.json', { 'Accept-Encoding': 'gzip' });
    assert.equal(manifest.headers['content-encoding'], 'gzip');
    assert.deepEqual(JSON.parse(gunzipSync(manifest.bytes)), atlas);
    assert.equal((await request(port, '/assets/frontier-v1/atlas.json', { 'Accept-Encoding': 'gzip', 'If-None-Match': manifest.headers.etag })).status, 304);
  } finally { await app.close(); }
});

test('the page asks for each sheet by the hash its manifest records, and decodes it off the main thread', async () => {
  const atlas = JSON.parse(readFileSync(`${publicRoot}assets/frontier-v1/atlas.json`, 'utf8'));
  const asked = [], bitmaps = [];
  const saved = { fetch: globalThis.fetch, createImageBitmap: globalThis.createImageBitmap };
  globalThis.fetch = async url => {
    asked.push(url);
    if (url.endsWith('/atlas.json') && url.startsWith('/assets/frontier-v1/')) return { ok: true, json: async () => atlas };
    if (url.endsWith('.json')) return { ok: false };
    return { ok: true, blob: async () => ({ url }) };
  };
  globalThis.createImageBitmap = async blob => { const bitmap = { from: blob.url }; bitmaps.push(bitmap); return bitmap; };
  try {
    const { loadArt } = await import(`../public/art.js?delivery-test=${Date.now()}`);
    const loaded = await loadArt({ sheets: [] });
    const nature = atlas.sheets.nature;
    assert.ok(asked.includes(`/assets/frontier-v1/${nature.image}?v=${nature.sha256.slice(0, 16)}`), `the nature sheet was not asked for by its hash: ${asked.join(', ')}`);
    assert.ok(bitmaps.length > 0 && loaded.images.nature === bitmaps.find(bitmap => bitmap.from.includes('nature')), 'a sheet was not made an ImageBitmap');
  } finally { Object.assign(globalThis, saved); }
});

test('gzip is taken only where the browser offers it', () => {
  assert.equal(acceptsGzip({ headers: { 'accept-encoding': 'gzip, deflate' } }), true);
  assert.equal(acceptsGzip({ headers: { 'accept-encoding': 'deflate, GZIP;q=0.5' } }), true);
  assert.equal(acceptsGzip({ headers: { 'accept-encoding': 'gzip;q=0' } }), false);
  assert.equal(acceptsGzip({ headers: { 'accept-encoding': 'identity' } }), false);
  assert.equal(acceptsGzip({ headers: {} }), false);
});
