// The Claude-drawn stand-ins (docs/ART_REQUESTS.md, "Claude-drawn stand-ins (replace with Astra's)"): a second, separate
// library of frames and clips drawn for requests Astra has not delivered, built by scripts/build-claude-standins.mjs from
// the area modules in scripts/claude-art/areas/ into public/assets/claude-standins/. These tests hold it to the same
// discipline as hers - the manifest describes the PNGs that are actually shipped and every frame is a real, in-bounds
// sprite - and to what makes it temporary and replaceable: every frame and clip is marked as Claude's, has its provenance
// (who, when, the written intent, the source SVG, "temporary"), is named in the ART_REQUESTS table, and nothing in it
// shares a name with a frame or clip Astra has delivered.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { decodeRgba } from '../scripts/build-atlas-manifest.mjs';
import { loadModules, plannedSheets, frameSource, sourceOf, readAreas, merge, root, WEB_ROOT, PROVENANCE_FILE } from '../scripts/build-claude-standins.mjs';

const manifest = JSON.parse(readFileSync(root + 'atlas.json', 'utf8'));
const provenance = JSON.parse(readFileSync(PROVENANCE_FILE, 'utf8'));
const astra = JSON.parse(readFileSync(fileURLToPath(new URL('../public/assets/frontier-v1/atlas.json', import.meta.url)), 'utf8'));
const astraClips = JSON.parse(readFileSync(fileURLToPath(new URL('../public/assets/frontier-v1/animation.json', import.meta.url)), 'utf8')).clips;
const requests = readFileSync(fileURLToPath(new URL('../docs/ART_REQUESTS.md', import.meta.url)), 'utf8');
const modules = await loadModules();

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
    assert.equal(frame.source, sourceOf(frame.module, name), `${name}: its source is svg/<module>/claude-${name}.svg`);
    assert.ok(existsSync(root + frame.source), `${name}: the SVG it was drawn from is on disk`);
  }
  for (const [name, clip] of Object.entries(manifest.clips)) assert.equal(clip.madeBy, 'claude', `clip ${name} is not marked madeBy claude`);
});

test('every Claude frame and clip has its provenance: made by Claude, the date, the written intent, the source, temporary', () => {
  const named = [...Object.keys(manifest.frames), ...Object.keys(manifest.clips)];
  for (const name of named) {
    const entry = provenance.entries[name];
    assert.ok(entry, `${name} has no entry in docs/claude-art-provenance.json - rerun npm run build:standins`);
    assert.equal(entry.madeBy, 'claude', `${name}: provenance madeBy`);
    assert.match(entry.date || '', /^\d{4}-\d{2}-\d{2}$/, `${name}: provenance date`);
    assert.ok(typeof entry.prompt === 'string' && entry.prompt.length >= 40, `${name}: the written intent it was drawn to (the 'prompt') is missing or a stub`);
    assert.equal(entry.status, `temporary: replace with Astra's ${name}`, `${name}: provenance does not say it is temporary`);
    if (entry.kind === 'frame') assert.ok(existsSync(fileURLToPath(new URL(`../${entry.source}`, import.meta.url))), `${name}: provenance source ${entry.source} is not on disk`);
  }
  assert.deepEqual(Object.keys(provenance.entries).sort(), named.sort(), 'docs/claude-art-provenance.json lists exactly the frames and clips shipped');
});

// A frame is covered by the ART_REQUESTS table when its name, a clip it is in, or a backticked pattern with `*` that
// matches it appears in the "Claude-drawn stand-ins" section.
const section = (() => {
  const start = requests.indexOf('## Claude-drawn stand-ins');
  assert.ok(start >= 0, 'docs/ART_REQUESTS.md has its "Claude-drawn stand-ins" section');
  const end = requests.indexOf('\n## ', start + 5);
  return requests.slice(start, end < 0 ? undefined : end);
})();
const tokens = [...section.matchAll(/`([^`\s]+)`/g)].map(m => m[1]);
const covered = name => tokens.some(token => token === name || (token.includes('*') && new RegExp(`^${token.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replaceAll('*', '[a-z0-9-]*')}$`).test(name)));
test('every Claude frame is named in the "Claude-drawn stand-ins" table of docs/ART_REQUESTS.md', () => {
  for (const name of Object.keys(manifest.frames)) {
    const clips = Object.entries(manifest.clips).filter(([, clip]) => clip.frames.some(f => f.sprite === name)).map(([clip]) => clip);
    assert.ok(covered(name) || clips.some(covered), `${name} (clips: ${clips.join(', ') || 'none'}) is not named in the "Claude-drawn stand-ins" table of docs/ART_REQUESTS.md: add it (or its clip, or a \`pattern-*\`) to its area's row`);
  }
});

test('no stand-in shares a name with a frame or clip Astra has delivered: when she does, delete the stand-in', () => {
  const delivered = Object.keys(manifest.frames).filter(name => astra.frames[name]);
  assert.deepEqual(delivered, [], `Astra's atlas now has ${delivered.join(', ')}: her frame wins in the loader; delete its entry in its scripts/claude-art/areas module (and a hand-written SVG) and rerun npm run build:standins`);
  const clips = Object.keys(manifest.clips).filter(name => astraClips[name]);
  assert.deepEqual(clips, [], `Astra's animation.json now has ${clips.join(', ')}: delete the Claude clip and its frames`);
  for (const name of Object.keys(manifest.sheets)) assert.ok(!astra.sheets[name], `${name} is also a sheet in Astra's atlas`);
});

test('the merged manifest and provenance are exactly the merge of the area JSONs, and every area JSON is a current module', () => {
  const areas = readAreas();
  const { manifest: expected, provenance: expectedProvenance } = merge(areas);
  assert.deepEqual(manifest, expected, 'atlas.json is not the merge of areas/*.json - run npm run build:standins -- --merge');
  assert.deepEqual(provenance, expectedProvenance, 'docs/claude-art-provenance.json is not the merge of areas/*.json - run npm run build:standins -- --merge');
  assert.deepEqual(areas.map(a => a.module).sort(), modules.filter(m => Object.keys(plannedSheets(m)).length).map(m => m.module).sort(), 'every module with something drawn has its area JSON, and no JSON is left from a deleted module');
});

test('the manifest describes the PNGs and sources actually shipped, and nothing is drawn that is not listed', () => {
  for (const m of modules) {
    const planned = plannedSheets(m);
    for (const [sheet, spec] of Object.entries(planned)) {
      assert.ok(manifest.sheets[sheet], `${sheet} (${m.module}) is not built - rerun npm run build:standins -- --only ${m.module}`);
      const listed = Object.entries(manifest.frames).filter(([, frame]) => frame.sheet === sheet).map(([name]) => name);
      assert.deepEqual(listed.sort(), spec.frames.map(f => f.frame.name).sort(), `${sheet}: the frames on disk differ from the manifest - rerun the build`);
      // A generated frame's SVG on disk is what its module draws now: a stale source means a stale PNG.
      for (const { frame, source } of spec.frames) if (source.generated) {
        assert.equal(readFileSync(root + sourceOf(m.module, frame.name), 'utf8').replace(/\r\n/g, '\n'), source.svg, `${frame.name}: its SVG on disk is not what ${m.module} draws now - rerun npm run build:standins -- --only ${m.module}`);
      }
    }
    // A hand-written frame without its SVG is simply not drawn yet, never half-registered.
    for (const spec of Object.values(m.SHEETS)) for (const frame of spec.frames) if (!frame.draw) {
      assert.equal(Boolean(frameSource(m.module, spec, frame)), Boolean(manifest.frames[frame.name]), `${frame.name}: source and manifest disagree`);
    }
  }
  const onDisk = readdirSync(root).filter(name => /\.png$/i.test(name)).sort();
  assert.deepEqual(onDisk, Object.values(manifest.sheets).map(sheet => sheet.image.split('/').at(-1)).sort(), 'every PNG in the folder is inventoried');
  for (const [name, sheet] of Object.entries(manifest.sheets)) {
    const png = readFileSync(root + sheet.image.split('/').at(-1));
    assert.equal(png.length, sheet.bytes, `${name}: bytes changed since the manifest was written`);
    assert.equal(createHash('sha256').update(png).digest('hex'), sheet.sha256, `${name}: PNG changed since the manifest was written`);
  }
});

test('every clip is a usable animation of Claude frames, as Astra\'s clips are declared', () => {
  for (const [name, clip] of Object.entries(manifest.clips)) {
    assert.ok(Array.isArray(clip.frames) && clip.frames.length, `${name} has frames`);
    for (const frame of clip.frames) {
      assert.ok(manifest.frames[frame.sprite], `${name}: frame ${frame.sprite} is a Claude frame`);
      assert.ok(Number.isFinite(frame.duration) && frame.duration > 0, `${name}: ${frame.sprite} has a positive duration`);
    }
    assert.equal(typeof clip.loop, 'boolean', `${name}: loop`);
    assert.equal(clip.authored, new Set(clip.frames.map(f => f.sprite)).size > 1, `${name}: authored says whether it has distinct poses`);
    assert.ok(['none', 'sway', 'breathe', 'rock', 'recoil', 'drift', 'pulse'].includes(clip.motion), `${name}: motion ${clip.motion}`);
    assert.ok(typeof clip.direction === 'string' && clip.direction, `${name}: direction`);
    if (clip.beat !== undefined) assert.ok(Number.isInteger(clip.beat) && clip.beat >= 0 && clip.beat < clip.frames.length, `${name}: beat is a frame of the clip`);
    // Every frame of one clip is drawn at one scale: the same logical height, so the figure does not change size mid-cycle.
    assert.equal(new Set(clip.frames.map(f => manifest.frames[f.sprite].logicalHeight ?? manifest.frames[f.sprite].h)).size, 1, `${name}: its frames share a logical height`);
  }
});

test('every frame is a usable sprite: inside its sheet, transparent-cornered, non-empty, on an anchor inside it', () => {
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
    assert.ok(frame.anchorX > 0 && frame.anchorX < 1 && frame.anchorY > 0.5 && frame.anchorY <= 1, `${name} is anchored at its ground contact (${frame.anchorX}, ${frame.anchorY})`);
    if (frame.logicalHeight !== undefined) assert.ok(frame.logicalHeight > 0, `${name}: logicalHeight`);
    let visible = 0, opaque = 0;
    for (let y = frame.y; y < frame.y + frame.h; y++) for (let x = frame.x; x < frame.x + frame.w; x++) {
      const alpha = image.data[(y * image.width + x) * 4 + 3];
      if (alpha > 24) visible++;
      if (alpha === 255) opaque++;
    }
    assert.ok(visible > 1200, `${name} is a real sprite, not empty transparency (${visible} visible pixels)`);
    assert.ok(visible < frame.w * frame.h * 0.9, `${name} fills its whole cell; a stand-in has real alpha round it (${visible} of ${frame.w * frame.h})`);
    assert.ok(opaque > 600, `${name} has solid paint, not a ghost (${opaque} opaque pixels)`);
    // Nothing is painted under the ground line except the lower foot of a stride or a log's round underside: a figure
    // does not float, and it does not stand in a shadow baked into the art.
    const ground = frame.y + Math.round(frame.anchorY * frame.h);
    let below = 0;
    for (let y = ground + 12; y < frame.y + frame.h; y++) for (let x = frame.x; x < frame.x + frame.w; x++) if (image.data[(y * image.width + x) * 4 + 3] > 24) below++;
    assert.ok(below < 400, `${name}: ${below} pixels are painted well below its ground anchor - a baked shadow, or a wrong anchorY`);
  }
});
