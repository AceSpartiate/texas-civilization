// A sheet of art arriving draws the map's kept ground again only if the ground was drawn without it (2026-09-29, measuring
// the Host's first-draw hitch at the Alamo: every arrival used to throw the ground away, and a dozen land when the famous people
// are sent). public/art.js names the sheets a drawing asked about and did not have (`watchMissing`) and says which sheet has
// arrived; public/app.js `redrawForArrival` compares the two. It also counts the sheets drawn at least once, which is how
// scripts/famous-people-browser-proof.mjs tells a first draw from a steady one.
import test from 'node:test';
import assert from 'node:assert/strict';

const frame = sheet => ({ sheet, x: 0, y: 0, w: 10, h: 10, anchorX: 0.5, anchorY: 1 });
const ATLAS = {
  sheets: Object.fromEntries(['ground-a', 'ground-b', 'ground-c', 'ground-d', 'famous-e'].map(name => [name, { image: `${name}.png` }])),
  frames: { a: frame('ground-a'), b: frame('ground-b'), 'c-1': frame('ground-c'), d: frame('ground-d'), e: frame('famous-e') },
};
const ANIMATION = { clips: { c: { frames: [{ sprite: 'c-1', duration: 100 }] } } };
/** A 2D context that draws nothing. */
const context = () => new Proxy({ globalAlpha: 1 }, { get: (target, key) => (key in target ? target[key] : () => {}), set: (target, key, value) => { target[key] = value; return true; } });

test('the sheets a drawing asked about and did not have are named, and each arriving sheet says which it is', async () => {
  const saved = { fetch: globalThis.fetch, createImageBitmap: globalThis.createImageBitmap };
  const release = [];
  globalThis.fetch = async url => {
    if (url.endsWith('/frontier-v1/atlas.json')) return { ok: true, json: async () => ATLAS };
    if (url.endsWith('/frontier-v1/animation.json')) return { ok: true, json: async () => ANIMATION };
    if (url.endsWith('.json')) return { ok: false };
    return { ok: true, blob: async () => ({ url }) };
  };
  // Each sheet's picture is held until the test lets it go, so the asking happens while every sheet is still on its way.
  globalThis.createImageBitmap = blob => new Promise(resolve => release.push(() => resolve({ from: blob.url })));
  try {
    const art = await import(`../public/art.js?arrival-test=${Date.now()}`);
    // Before the manifests are read nothing can be named: null, so anything arriving may be wanted.
    const early = art.watchMissing();
    assert.equal(early(), null, 'a drawing before the manifests were read named the sheets it was without');
    await art.loadArt();
    const arrived = [];
    art.onArtReady((status, sheet) => arrived.push(sheet));
    const ctx = context();
    const stop = art.watchMissing();
    // Every way of asking: drawn, asked after, a clip asked after, a sprite asked after.
    assert.equal(art.hasSprite('a'), false);
    assert.equal(art.drawSprite(ctx, 'b', 0, 0, 10), 0);
    assert.equal(art.clipReady('c'), false);
    assert.equal(art.spriteReady('d'), false);
    const noted = stop();
    // Asked about after the watch ended: not the ground's.
    art.spriteReady('e');
    assert.deepEqual([...noted].sort(), ['ground-a', 'ground-b', 'ground-c', 'ground-d'], 'the sheets the drawing was without were not all named, or others were');
    for (let i = 0; release.length < 4 && i < 500; i++) await new Promise(resolve => setTimeout(resolve, 2));
    assert.equal(release.length, 4, 'the sheets drawn or asked for were not all fetched (hasSprite only reports)');
    for (const go of release) go();
    for (let i = 0; arrived.length < 4 && i < 500; i++) await new Promise(resolve => setTimeout(resolve, 2));
    assert.deepEqual([...arrived].sort(), ['famous-e', 'ground-b', 'ground-c', 'ground-d'], `an arriving sheet did not say which it was: ${arrived}`);
    // A sheet drawn the first time is counted once.
    const before = art.sheetsFirstDrawn();
    assert.ok(art.drawSprite(ctx, 'e', 0, 0, 10) > 0);
    assert.ok(art.drawSprite(ctx, 'e', 5, 0, 10) > 0);
    assert.equal(art.sheetsFirstDrawn() - before, 1, 'a sheet drawn twice was counted as drawn for the first time twice, or not at all');
  } finally { Object.assign(globalThis, saved); }
});
