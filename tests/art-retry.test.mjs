// A sheet whose request fails is asked for again (2026-09-29). The owner, on v2026.09.29.1: "multiple choices in the
// character creator screens are just solid colors". public/art.js kept a sheet's first failure for the life of the page, so
// one lost request for the second cast sheet left every How We Look choice drawn from it a plain backdrop until a reload
// (scripts/looks-face-proof.mjs proves the pop-up itself; this proves the library).
import test from 'node:test';
import assert from 'node:assert/strict';

const frame = sheet => ({ sheet, x: 0, y: 0, w: 10, h: 10, anchorX: 0.5, anchorY: 1 });
const ATLAS = { sheets: { cast: { image: 'cast.png' } }, frames: { man: frame('cast') } };
/** A 2D context that draws nothing. */
const context = () => new Proxy({ globalAlpha: 1 }, { get: (target, key) => (key in target ? target[key] : () => {}), set: (target, key, value) => { target[key] = value; return true; } });

test('a sheet whose first request failed is fetched again, arrives, and draws', async () => {
  const saved = { fetch: globalThis.fetch, createImageBitmap: globalThis.createImageBitmap };
  const asked = [];
  globalThis.fetch = async url => {
    if (url.endsWith('/frontier-v1/atlas.json')) return { ok: true, json: async () => ATLAS };
    if (url.endsWith('.json')) return { ok: false };
    asked.push(url);
    // The first request is lost, as on a Wi-Fi roam or a server restart the page lives through.
    if (asked.length === 1) throw new TypeError('Failed to fetch');
    return { ok: true, blob: async () => ({ url }) };
  };
  globalThis.createImageBitmap = async blob => ({ from: blob.url });
  try {
    const art = await import(`../public/art.js?retry-test=${Date.now()}`);
    await art.loadArt();
    const arrived = [];
    art.onArtReady((status, sheet) => arrived.push([sheet, art.hasSprite('man')]));
    const ctx = context();
    assert.equal(art.drawSprite(ctx, 'man', 0, 0, 10), 0);
    for (let i = 0; !arrived.length && i < 200; i++) await new Promise(resolve => setTimeout(resolve, 5));
    assert.deepEqual(arrived[0], ['cast', false], 'the failed request did not say it had finished');
    // Drawn again and again while the failure stands, as the map does every frame: asked once, not every frame.
    for (let i = 0; i < 50; i++) art.drawSprite(ctx, 'man', 0, 0, 10);
    assert.equal(asked.length, 1, `a failed sheet was asked for again at once, ${asked.length} times`);
    for (let i = 0; !arrived.some(([, drawn]) => drawn) && i < 600; i++) await new Promise(resolve => setTimeout(resolve, 10));
    assert.ok(arrived.some(([sheet, drawn]) => sheet === 'cast' && drawn), `the sheet was never fetched again after its first request failed (asked ${asked.length} time(s))`);
    assert.equal(asked.length, 2);
    assert.ok(art.drawSprite(ctx, 'man', 0, 0, 10) > 0, 'the sheet arrived on the second try but does not draw');
  } finally { Object.assign(globalThis, saved); }
});
