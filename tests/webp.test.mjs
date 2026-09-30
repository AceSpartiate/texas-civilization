// The art as WebP (owner, 2026-09-29, triage D14 "All to WebP"; scripts/build-webp.mjs, server/delivery.mjs `pictureFor`,
// docs/PERFORMANCE_LOAD.md). The PNGs stay the masters; the WebPs are made from them, not committed, and served only while
// they are still the PNG's - so a tree where they were never made, or a sheet delivered since, shows the PNG.
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { planWebp, webpOf, WEBP_DIR as BUILT_DIR } from '../scripts/build-webp.mjs';
import { pictureFor, WEBP_DIR } from '../server/delivery.mjs';
import { createClassroom } from '../server/app.mjs';
import { variantOf } from '../public/person-palette.js';

const publicRoot = fileURLToPath(new URL('../public/', import.meta.url));
const atlas = file => JSON.parse(readFileSync(`${publicRoot}assets/${file}`, 'utf8'));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const libraries = () => [{ atlas: atlas('frontier-v1/atlas.json'), base: 'frontier-v1/' }, { atlas: atlas('claude-standins/atlas.json'), base: '' }];

test('every sheet with a person the page recolours is lossless, and everything else is quality 90', () => {
  const plan = planWebp(libraries(), readFileSync(`${publicRoot}style.css`, 'utf8'));
  const by = new Map(plan.map(item => [item.png, item]));
  assert.equal(BUILT_DIR, WEBP_DIR, 'the build and the server name different folders');
  // Her cast and Claude's cast, whose skin, hair and clothes public/person-palette.js finds by colour: exact.
  for (const png of ['frontier-v1/atlases/civilians.png', 'frontier-v1/atlases/people-walk.png', 'claude-standins/claude-chop.png']) {
    assert.equal(by.get(png)?.lossless, true, `${png} would be lossy`);
  }
  // Land, buildings, animals: quality 90.
  for (const png of ['frontier-v1/atlases/nature.png', 'frontier-v1/atlases/buildings.png']) assert.equal(by.get(png)?.lossless, false, `${png} is lossless`);
  // And the rule, sheet by sheet, for both libraries: lossless exactly where a recoloured frame is.
  for (const { atlas: library, base } of libraries()) {
    const people = new Set(Object.entries(library.frames).filter(([name]) => variantOf(name)).map(([, frame]) => frame.sheet));
    for (const [sheet, info] of Object.entries(library.sheets)) {
      const png = info.image.startsWith('/assets/') ? info.image.slice(8) : base + info.image;
      assert.equal(by.get(png)?.lossless, people.has(sheet), `${sheet}`);
      assert.equal(by.get(png)?.webp, `${WEBP_DIR}${png.replace(/\.png$/, '.webp')}`);
    }
  }
  // The creation screen's two landscapes, named in the stylesheet by their WebP, are made from the PNGs they mirror.
  for (const name of ['creation-title-landscape', 'creation-roll-landscape']) {
    assert.equal(by.get(`${name}.png`)?.webp, webpOf(`${name}.png`), `${name} is not made`);
    assert.ok(existsSync(`${publicRoot}assets/${name}.png`), `${name}.png, the master, is missing`);
  }
});

/** A folder standing for public/assets/, and the server's `find` over it. */
function folder() {
  const root = mkdtempSync(join(tmpdir(), 'texas-webp-'));
  const find = name => existsSync(join(root, name)) ? join(root, name) : null;
  const put = (name, bytes) => { mkdirSync(join(root, name, '..'), { recursive: true }); writeFileSync(join(root, name), bytes); };
  return { root, find, put };
}

test('the server sends the WebP only while it was made from the PNG beside it, and the PNG otherwise', () => {
  const { root, find, put } = folder();
  try {
    const png = Buffer.from('a png master'), webp = Buffer.from('its webp');
    put('lib/sheet.png', png);
    // Never made (a fresh checkout): the WebP's URL answers with the PNG, never pinned.
    assert.deepEqual(pictureFor(`${WEBP_DIR}lib/sheet.webp`, find), { path: join(root, 'lib/sheet.png'), extension: 'png', pins: null });
    put(`${WEBP_DIR}lib/sheet.webp`, webp);
    put(`${WEBP_DIR}record.json`, JSON.stringify({ pictures: { [`${WEBP_DIR}lib/sheet.webp`]: { png: sha(png), webp: sha(webp) } } }));
    // Made from this PNG: the WebP, pinned by the PNG's hash, which is what the page asks with.
    assert.deepEqual(pictureFor(`${WEBP_DIR}lib/sheet.webp`, find), { path: join(root, WEBP_DIR, 'lib/sheet.webp'), extension: 'webp', pins: [sha(png)] });
    // The PNG asked for by name is still the PNG.
    assert.equal(pictureFor('lib/sheet.png', find).extension, 'png');
    // A new PNG delivered since: the old WebP is not hers any more, and the PNG goes.
    const newer = Buffer.from('a newer png master, with its own size');
    put('lib/sheet.png', newer);
    assert.equal(pictureFor(`${WEBP_DIR}lib/sheet.webp`, find).extension, 'png', 'a WebP of the old PNG was sent for the new one');
    // A package that ships the WebP and not the PNG: both URLs answer with the WebP the record names.
    put('lib/sheet.png', png);
    rmSync(join(root, 'lib/sheet.png'));
    assert.equal(pictureFor(`${WEBP_DIR}lib/sheet.webp`, find).extension, 'webp');
    assert.deepEqual(pictureFor('lib/sheet.png', find), { path: join(root, WEBP_DIR, 'lib/sheet.webp'), extension: 'webp', pins: [sha(png)] });
    // A WebP whose bytes are not the ones recorded is never sent.
    put(`${WEBP_DIR}lib/sheet.webp`, Buffer.from('something else'));
    assert.equal(pictureFor(`${WEBP_DIR}lib/sheet.webp`, find), null);
    // Nothing else is touched: a PNG or a WebP outside the made folder is itself.
    put('lib/own.webp', webp);
    assert.deepEqual(pictureFor('lib/own.webp', find), { path: join(root, 'lib/own.webp'), extension: 'webp', pins: [] });
    assert.equal(pictureFor('lib/missing.png', find), null);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

function request(port, path) {
  return new Promise((resolve, reject) => {
    http.get({ hostname: '127.0.0.1', port, path }, res => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, bytes: Buffer.concat(chunks) }));
    }).on('error', reject);
  });
}

test('a WebP never made is answered with its PNG over HTTP, as a PNG, and revalidated', async () => {
  const assets = join(publicRoot, 'assets');
  const fixture = mkdtempSync(join(assets, 'webp-fixture-'));
  const name = basename(fixture);
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aNuoAAAAASUVORK5CYII=', 'base64');
  writeFileSync(join(fixture, 'sheet.png'), png);
  const app = createClassroom({ playerCount: 5 });
  const port = await app.listen(0, '127.0.0.1');
  try {
    const response = await request(port, `/assets/${WEBP_DIR}${name}/sheet.webp?v=${sha(png).slice(0, 16)}`);
    assert.equal(response.status, 200);
    assert.equal(response.headers['content-type'], 'image/png');
    assert.deepEqual(response.bytes, png);
    assert.equal(response.headers['cache-control'], 'public, max-age=0, must-revalidate', 'a PNG sent for a WebP was kept for good');
    assert.equal((await request(port, `/assets/${WEBP_DIR}${name}/missing.webp`)).status, 404);
  } finally {
    await app.close();
    rmSync(fixture, { recursive: true, force: true });
  }
});
