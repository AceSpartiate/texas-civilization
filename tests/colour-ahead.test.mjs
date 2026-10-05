// A person's frames are coloured ahead, in the browser's idle time, and one drawing colours at most a few milliseconds of them
// (public/art.js `appearanceFrame`, 2026-10-04): the Host's map at the Alamo coloured a dozen children's frames in one animation
// frame when a tick set several families walking, 45-90 ms against a median of 7 (scripts/famous-people-browser-proof.mjs).
// Here a frame takes 7 ms to colour, past the 6 ms budget, so the second colouring in one drawing is past it.
import test from 'node:test';
import assert from 'node:assert/strict';

const frame = (x, w = 10) => ({ sheet: 'people', x, y: 0, w, h: 20, anchorX: 0.5, anchorY: 1, logicalHeight: 20 });
const ATLAS = {
  sheets: { people: { image: 'people.png' } },
  frames: { 'kid-walk-e-1': frame(0), 'kid-walk-e-2': frame(10, 12), 'kid-walk-e-3': frame(22), 'kid-walk-s-1': frame(32) },
};
const red = { skin: 'olive', hair: 'brown', clothing: 'rust' }, blue = { skin: 'olive', hair: 'brown', clothing: 'indigo' };

test('the rest of a clip is coloured while idle, a drawing past its budget holds the step before, and never in the wrong colours', async () => {
  const saved = { fetch: globalThis.fetch, createImageBitmap: globalThis.createImageBitmap, document: globalThis.document, requestIdleCallback: globalThis.requestIdleCallback };
  globalThis.fetch = async url => {
    if (url.endsWith('/frontier-v1/atlas.json')) return { ok: true, json: async () => ATLAS };
    if (url.endsWith('/frontier-v1/animation.json')) return { ok: true, json: async () => ({ clips: {} }) };
    if (url.endsWith('.json')) return { ok: false };
    return { ok: true, blob: async () => ({ url }) };
  };
  globalThis.createImageBitmap = async () => ({});
  // Each canvas made is one frame coloured; reading its pixels takes 7 ms.
  const made = [];
  globalThis.document = {
    createElement: () => {
      const canvas = { width: 0, height: 0, getContext: () => ({
        drawImage: (image, x) => { canvas.from = x; },
        getImageData: (x, y, w, h) => { const until = performance.now() + 7; while (performance.now() < until); return { data: new Uint8ClampedArray(w * h * 4), width: w, height: h }; },
        putImageData: () => {},
      }) };
      made.push(canvas);
      return canvas;
    },
  };
  // The browser's idle moments come when the test says.
  const idle = [];
  globalThis.requestIdleCallback = work => idle.push(work);
  const runIdle = () => { while (idle.length) idle.shift()({ timeRemaining: () => 50 }); };
  try {
    const art = await import(`../public/art.js?colour-ahead-test=${Date.now()}`);
    await art.loadArt({ sheets: ['people'] });
    const drawn = [];
    const ctx = new Proxy({ globalAlpha: 1 }, {
      get: (target, key) => (key === 'drawImage' ? (source, x, y, w, h) => drawn.push({ source, w, h }) : key in target ? target[key] : () => {}),
      set: (target, key, value) => { target[key] = value; return true; },
    });
    const draw = (name, appearance) => { art.drawSprite(ctx, name, 0, 0, 20, { appearance }); return drawn.at(-1); };

    // One drawing: the first step of a clip in red is coloured, which spends the budget.
    const first = draw('kid-walk-e-1', red);
    assert.equal(made.length, 1, 'the first frame of a clip was not coloured');
    assert.equal(first.source, made[0]);
    // Its next step, in the same drawing past the budget: the step before, at that step's own measures, coloured after.
    const held = draw('kid-walk-e-2', red);
    assert.equal(made.length, 1, 'a drawing past its budget coloured another step of a clip it had already drawn');
    assert.equal(held.source, made[0], 'a step past the budget was not drawn as the step before');
    assert.equal(held.w, 10, 'the step before was drawn at the measures of the step it stood for');
    // A clip never drawn in red, and the same clip never drawn in blue: coloured at once whatever the budget.
    draw('kid-walk-s-1', red);
    assert.equal(made.length, 2, 'a clip never drawn in these colours was not coloured at once');
    const other = draw('kid-walk-e-2', blue);
    assert.equal(made.length, 3, 'a step was drawn in another palette\'s colours');
    assert.equal(other.source, made[2]);

    // The next drawing, after the idle moment: every step of the clip is ready in red, and nothing is coloured as it draws.
    await Promise.resolve();
    // A new drawing has its own budget: a step not yet coloured is coloured, not held.
    const fresh = draw('kid-walk-e-3', red);
    assert.equal(made.length, 4, 'the next drawing was given no budget of its own');
    assert.equal(fresh.source, made[3]);
    runIdle();
    const ahead = made.length;
    assert.ok(ahead >= 5, `the rest of the clip was not coloured while idle (${ahead - 3} more)`);
    // Blue's first and third steps were never drawn: only the colouring ahead made them.
    for (const [name, appearance] of [['kid-walk-e-2', red], ['kid-walk-e-1', blue], ['kid-walk-e-3', blue]]) {
      const one = draw(name, appearance);
      assert.equal(made.length, ahead, `${name} in ${appearance.clothing} was coloured as it drew, not ahead`);
      assert.equal(one.source.from, ATLAS.frames[name].x, `${name} was drawn as another step`);
    }
  } finally { Object.assign(globalThis, saved); }
});
