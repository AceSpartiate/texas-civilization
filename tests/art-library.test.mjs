import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { buildManifest, decodeRgba, root, SHEETS } from '../scripts/build-atlas-manifest.mjs';

const manifest = JSON.parse(readFileSync(root + 'atlas.json', 'utf8'));
const expected = Object.values(SHEETS).flat().filter(Boolean);

// A shipped manifest whose rectangles no longer match the shipped art is the worst
// failure this library can have, because nothing throws: every sprite simply draws a
// slice of the wrong picture, or half of the right one. Re-measuring the atlases and
// comparing is the only check that catches it.
test('atlas.json still describes the art that is actually shipped', () => {
  assert.deepEqual(readdirSync(root + 'atlases').filter(name => /\.png$/i.test(name)).sort(), Object.values(manifest.sheets).map(sheet => sheet.image.split('/').at(-1)).sort(), 'every runtime PNG must be inventoried');
  assert.deepEqual(buildManifest(), manifest, 'atlas.json is stale - rerun node scripts/build-atlas-manifest.mjs');
  assert.deepEqual(Object.keys(manifest.frames), expected, 'frame names and reading order must match the generation prompts');
});

test('every frame is a usable sprite: inside its sheet, non-empty, and standing on its own anchor', () => {
  const images = {};
  for (const [name, sheet] of Object.entries(manifest.sheets)) {
    images[name] = decodeRgba(readFileSync(root + sheet.image));
    assert.equal(images[name].width, sheet.width, `${name} width`);
    assert.equal(images[name].height, sheet.height, `${name} height`);
  }
  const boxes = [];
  for (const [name, frame] of Object.entries(manifest.frames)) {
    const image = images[frame.sheet];
    assert.ok(image, `${name} names a sheet that exists`);
    assert.ok(frame.x >= 0 && frame.y >= 0 && frame.x + frame.w <= image.width && frame.y + frame.h <= image.height, `${name} lies inside its sheet`);
    // An anchor outside the frame would place the sprite beside the ground it stands on.
    assert.ok(frame.anchorX >= 0 && frame.anchorX <= 1 && frame.anchorY >= 0 && frame.anchorY <= 1, `${name} anchor is inside its frame`);
    // Feet, not head or middle: everything in this library stands on its base.
    assert.ok(frame.anchorY > 0.6, `${name} anchor is near the base, not up the body (got ${frame.anchorY})`);
    let visible = 0;
    for (let y = frame.y; y < frame.y + frame.h; y++) {
      for (let x = frame.x; x < frame.x + frame.w; x++) if (image.data[(y * image.width + x) * 4 + 3] > 24) visible++;
    }
    assert.ok(visible > 1200, `${name} is a real sprite and not empty transparency (${visible} visible pixels)`);
    // The anchor row must have something on it, or the sprite floats above its shadow.
    const anchorRow = frame.y + Math.round(frame.anchorY * (frame.h - 1));
    let onAnchor = 0;
    for (let x = frame.x; x < frame.x + frame.w; x++) if (image.data[(anchorRow * image.width + x) * 4 + 3] > 40) onAnchor++;
    assert.ok(onAnchor > 0, `${name} has art on its ground line`);
    boxes.push({ name, frame });
  }
  // Overlapping frames would draw a neighbour's canopy into this sprite's corner.
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
    const a = boxes[i], b = boxes[j];
    if (a.frame.sheet !== b.frame.sheet) continue;
    const apart = a.frame.x + a.frame.w <= b.frame.x || b.frame.x + b.frame.w <= a.frame.x
      || a.frame.y + a.frame.h <= b.frame.y || b.frame.y + b.frame.h <= a.frame.y;
    assert.ok(apart, `${a.name} and ${b.name} overlap in ${a.frame.sheet}`);
  }
});

// The library is an enhancement, never a dependency. If the sheets fail to arrive the
// map must still draw, so nothing in the renderer may assume a sprite is there.
test('the renderer treats every sprite as optional', () => {
  const app = readFileSync(fileURLToPath(new URL('../public/app.js', import.meta.url)), 'utf8');
  const art = readFileSync(fileURLToPath(new URL('../public/art.js', import.meta.url)), 'utf8');
  assert.match(art, /return 0;/, 'drawSprite reports when it could not draw');
  assert.match(art, /image\.onerror/, 'a sheet that fails to load is survivable, not an exception');
  // Every drawSprite call is either guarded by its return value or is decoration whose
  // absence costs nothing. These four carry the farm, so each must have a fallback.
  for (const guarded of ['grass-tuft', 'rocks', 'oak-broad']) {
    assert.match(app, new RegExp(`!drawSprite\\(ctx, ('|\\w+ \\? ')?${guarded}|hasSprite\\('${guarded}'\\)`), `${guarded} has a drawn fallback`);
  }
  assert.match(app, /if \(drawSprite\(ctx, pickSprite\(HOMESTEAD_CABINS/, 'a homestead falls back to the drawn cabin');
  assert.match(app, /loadArt\(\)/, 'the page asks for the library');
  assert.doesNotMatch(app, /await loadArt/, 'nothing waits on the art before drawing the world');
});
