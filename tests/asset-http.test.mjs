import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join, resolve, relative, isAbsolute, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClassroom } from '../server/app.mjs';

const publicRoot = fileURLToPath(new URL('../public/', import.meta.url));
const assetsRoot = join(publicRoot, 'assets');

// Send the literal request target; fetch normalizes ../ before sending it.
function request(port, path, headers = {}, method = 'GET') {
  return new Promise((resolveResponse, reject) => {
    const req = http.request({ hostname: '127.0.0.1', port, path, method, headers }, res => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolveResponse({ status: res.statusCode, headers: res.headers, bytes: Buffer.concat(chunks) }));
      res.on('error', reject);
    });
    req.on('error', reject);
    req.end();
  });
}

function removeFixture(root, target) {
  const absolute = resolve(target), child = relative(resolve(root), absolute);
  assert.ok(child && child !== '..' && !child.startsWith(`..${sep}`) && !isAbsolute(child), 'test cleanup stays in its fixture parent');
  rmSync(absolute, { recursive: true, force: true });
}

test('art routes serve public modules and atlas bytes without exposing private files', async () => {
  mkdirSync(assetsRoot, { recursive: true });
  const fixture = mkdtempSync(join(assetsRoot, 'http-fixture-'));
  const privateFixture = mkdtempSync(join(tmpdir(), 'texas-asset-private-'));
  const prefix = `/assets/${basename(fixture)}`;
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aNuoAAAAASUVORK5CYII=', 'base64');
  // A transport fixture, not a playable image: verify that binary bytes stay intact.
  const webp = Buffer.from([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]);
  const manifest = JSON.stringify({ version: 1, image: 'sample.png' });
  writeFileSync(join(fixture, 'sample.png'), png);
  writeFileSync(join(fixture, 'sample.webp'), webp);
  writeFileSync(join(fixture, 'manifest.json'), manifest);
  writeFileSync(join(fixture, 'disallowed.txt'), 'must not be served');
  writeFileSync(join(fixture, '.hidden.json'), '{"private":true}');
  writeFileSync(join(privateFixture, 'save.json'), '{"hostKey":"private-test-secret"}');
  let linked = false;
  try { symlinkSync(join(privateFixture, 'save.json'), join(fixture, 'outside.json')); linked = true; }
  catch (error) { if (!['EPERM', 'EACCES'].includes(error.code)) throw error; }
  const app = createClassroom({ playerCount: 5 });
  const port = await app.listen(0, '127.0.0.1');
  try {
    for (const [path, mime] of [
      ['/', 'text/html'], ['/host', 'text/html'], ['/app.js', 'text/javascript'], ['/style.css', 'text/css'],
      ['/art.js', 'text/javascript'], ['/interface.js', 'text/javascript'],
      ['/art-catalog.html', 'text/html'], ['/art-catalog.js', 'text/javascript'],
    ]) {
      const file = join(publicRoot, path === '/' || path === '/host' ? 'index.html' : path.slice(1));
      const response = await request(port, path);
      // The server can be tested before every optional UI module is installed.
      assert.equal(response.status, existsSync(file) ? 200 : 404, path);
      if (existsSync(file)) {
        assert.equal(response.headers['content-type'], `${mime}; charset=utf-8`, path);
        assert.deepEqual(response.bytes, readFileSync(file), path);
      }
    }
    for (const [file, mime, bytes] of [
      ['sample.png', 'image/png', png], ['sample.webp', 'image/webp', webp],
      ['manifest.json', 'application/json; charset=utf-8', Buffer.from(manifest)],
    ]) {
      const response = await request(port, `${prefix}/${file}?v=frontier-1`);
      assert.equal(response.status, 200);
      assert.equal(response.headers['content-type'], mime);
      assert.equal(Number(response.headers['content-length']), bytes.length);
      assert.deepEqual(response.bytes, bytes);
      assert.equal(response.headers['x-content-type-options'], 'nosniff');
      assert.match(response.headers['content-security-policy'], /img-src 'self' data:/);
      assert.equal(response.headers['cache-control'], 'public, max-age=0, must-revalidate');
      assert.ok(response.headers.etag);
      const unchanged = await request(port, `${prefix}/${file}`, { 'If-None-Match': response.headers.etag });
      assert.equal(unchanged.status, 304);
      assert.equal(unchanged.bytes.length, 0);
    }
    const before = await request(port, `${prefix}/manifest.json`);
    writeFileSync(join(fixture, 'manifest.json'), '{"version":2}');
    const changed = await request(port, `${prefix}/manifest.json`, { 'If-None-Match': before.headers.etag });
    assert.equal(changed.status, 200);
    assert.notEqual(changed.headers.etag, before.headers.etag);
    for (const path of [
      '/assets', '/assets/missing.png', `${prefix}/missing.json`, `${prefix}/disallowed.txt`,
      `${prefix}/.hidden.json`, `${prefix}/../manifest.json`, `${prefix}/%2e%2e/manifest.json`,
      `${prefix}/%2Ehidden.json`, `${prefix}/sample.png%00.json`, `${prefix}/sample.png/extra.json`,
      '/assets/../../data/classroom.json', '/assets/..\\..\\data\\classroom.json',
      '/assets/%2e%2e/%2e%2e/data/classroom.json', '/assets/%252e%252e/data/classroom.json',
      '/assets/C:/Users/private/save.json', '/assets//manifest.json',
      ...(linked ? [`${prefix}/outside.json`] : []),
    ]) {
      const response = await request(port, path);
      assert.equal(response.status, 404, path);
      assert.deepEqual(JSON.parse(response.bytes), { error: 'Not found' }, path);
    }
    assert.equal((await request(port, `${prefix}/manifest.json`, {}, 'POST')).status, 404);
    for (const path of ['/data/classroom.json', '/server/app.mjs', '/package.json', '/api/state']) {
      const response = await request(port, path);
      assert.equal(response.status, 401, path);
      assert.ok(!response.bytes.includes('private-test-secret'), path);
      assert.ok(!response.bytes.includes(app.state.hostKey), path);
    }
  } finally {
    await app.close();
    removeFixture(assetsRoot, fixture);
    removeFixture(tmpdir(), privateFixture);
  }
});
