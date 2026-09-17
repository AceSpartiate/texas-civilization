// The Claude-drawn stand-ins (docs/ART_REQUESTS.md, "Claude-drawn stand-ins (replace with Astra's)"): a second, separate
// library of frames drawn for requests Astra has not delivered, built by scripts/build-claude-standins.mjs into
// public/assets/claude-standins/. These tests hold it to the same discipline as hers - the manifest describes the PNGs that
// are actually shipped and every frame is a real, in-bounds sprite - and to the one rule that makes it replaceable: nothing
// in it may share a name with a frame in her atlas. The moment she delivers `mark-need`, the loader lets hers win, and this
// test says to delete the stand-in.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { decodeRgba } from '../scripts/build-atlas-manifest.mjs';
import { SHEETS, plannedSheets, sourceOf, root, WEB_ROOT } from '../scripts/build-claude-standins.mjs';

const manifest = JSON.parse(readFileSync(root + 'atlas.json', 'utf8'));
const astra = JSON.parse(readFileSync(fileURLToPath(new URL('../public/assets/frontier-v1/atlas.json', import.meta.url)), 'utf8'));

test('every stand-in is marked as Claude-drawn, in the manifest and on disk', () => {
  assert.equal(manifest.madeBy, 'claude');
  assert.equal(manifest.library, 'claude-standins');
  for (const [name, sheet] of Object.entries(manifest.sheets)) {
    assert.equal(sheet.madeBy, 'claude', `${name} is not marked madeBy claude`);
    assert.match(name, /^claude-/, `${name}: a stand-in sheet is named claude-*`);
    assert.match(sheet.image, new RegExp(`^${WEB_ROOT}claude-[a-z0-9-]+\\.png$`), `${name}: image ${sheet.image} is not a claude-*.png under ${WEB_ROOT}`);
  }
  for (const [name, frame] of Object.entries(manifest.frames)) {
    assert.equal(frame.madeBy, 'claude', `${name} is not marked madeBy claude`);
    assert.ok(frame.request && frame.replaceWith, `${name} does not say which request it answers and what replaces it`);
    assert.equal(frame.source, sourceOf(name), `${name}: its source is svg/claude-${name}.svg`);
    assert.ok(existsSync(root + frame.source), `${name}: the SVG it was drawn from is on disk`);
  }
});

test('no stand-in shares a name with a frame Astra has delivered: when she does, delete the stand-in', () => {
  const delivered = Object.keys(manifest.frames).filter(name => astra.frames[name]);
  assert.deepEqual(delivered, [], `Astra's atlas now has ${delivered.join(', ')}: her frame wins in the loader; delete the SVG in ${root}svg, its entry in scripts/build-claude-standins.mjs and its row in docs/ART_REQUESTS.md, then rerun the build`);
  for (const name of Object.keys(manifest.sheets)) assert.ok(!astra.sheets[name], `${name} is also a sheet in Astra's atlas`);
});

test('the manifest describes the PNGs actually shipped, and nothing is drawn that is not listed', () => {
  const planned = plannedSheets();
  assert.deepEqual(Object.keys(manifest.sheets).sort(), Object.keys(planned).sort(), 'atlas.json is stale - rerun scripts/build-claude-standins.mjs');
  for (const [sheet, spec] of Object.entries(planned)) {
    const listed = Object.entries(manifest.frames).filter(([, frame]) => frame.sheet === sheet).map(([name]) => name);
    assert.deepEqual(listed.sort(), [...spec.frames].sort(), `${sheet}: the frames on disk differ from the manifest - rerun the build`);
  }
  const onDisk = readdirSync(root).filter(name => /\.png$/i.test(name)).sort();
  assert.deepEqual(onDisk, Object.values(manifest.sheets).map(sheet => sheet.image.split('/').at(-1)).sort(), 'every PNG in the folder is inventoried');
  for (const [name, sheet] of Object.entries(manifest.sheets)) {
    const png = readFileSync(root + sheet.image.split('/').at(-1));
    assert.equal(png.length, sheet.bytes, `${name}: bytes changed since the manifest was written`);
    assert.equal(createHash('sha256').update(png).digest('hex'), sheet.sha256, `${name}: PNG changed since the manifest was written`);
  }
  // Every name in SHEETS with a source on disk is built; a name without one is simply not drawn yet, never half-registered.
  for (const spec of Object.values(SHEETS)) for (const name of spec.frames) assert.equal(existsSync(root + sourceOf(name)), Boolean(manifest.frames[name]), `${name}: source and manifest disagree`);
});

test('every frame is a usable sprite: inside its sheet, transparent-cornered, non-empty, on a base anchor', () => {
  const images = {};
  for (const [name, sheet] of Object.entries(manifest.sheets)) {
    const image = decodeRgba(readFileSync(root + sheet.image.split('/').at(-1)));
    images[name] = image;
    assert.equal(image.width, sheet.width, `${name} width`);
    assert.equal(image.height, sheet.height, `${name} height`);
    const corners = [0, image.width - 1, (image.height - 1) * image.width, image.height * image.width - 1].map(pixel => image.data[pixel * 4 + 3]);
    assert.ok(corners.every(alpha => alpha === 0), `${name}: a corner is not transparent (${corners}); the sheet was not screenshotted with omitBackground`);
  }
  for (const [name, frame] of Object.entries(manifest.frames)) {
    const image = images[frame.sheet];
    assert.ok(image, `${name} names a sheet that exists`);
    assert.ok(frame.x >= 0 && frame.y >= 0 && frame.x + frame.w <= image.width && frame.y + frame.h <= image.height, `${name} lies inside its sheet`);
    assert.ok(frame.anchorX === 0.5 && frame.anchorY === 1, `${name} is anchored at its base centre`);
    let visible = 0, opaque = 0;
    for (let y = frame.y; y < frame.y + frame.h; y++) for (let x = frame.x; x < frame.x + frame.w; x++) {
      const alpha = image.data[(y * image.width + x) * 4 + 3];
      if (alpha > 24) visible++;
      if (alpha === 255) opaque++;
    }
    assert.ok(visible > 1200, `${name} is a real sprite, not empty transparency (${visible} visible pixels)`);
    assert.ok(visible < frame.w * frame.h * 0.9, `${name} fills its whole cell; a stand-in has real alpha round it (${visible} of ${frame.w * frame.h})`);
    assert.ok(opaque > 600, `${name} has solid paint, not a ghost (${opaque} opaque pixels)`);
  }
});
