import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { decodeRgba, root, LOCOMOTION } from '../scripts/build-atlas-manifest.mjs';

/**
 * Astra's frames measured the way she drew them (docs/ART_REQUESTS.md, "Redo and edit requests - 2026-10-04", C1-C3).
 *
 * The audit of 2026-10-04 read the built manifests and Astra's PNGs and found three faults in how the builder measured her
 * frames: figures sliding back and forth along their path in a stride (C1), figures changing size within one clip (C2), and
 * famous people drawn small in every pose because an action pose set their height (C3). Each test below measures the
 * shipped atlas.json and animation.json the way the audit did; tests/art-library.test.mjs holds that atlas.json is what the
 * builder makes of the PNGs, so a builder change shows up here only once it is rebuilt - which is how each was proved.
 */
const atlas = JSON.parse(readFileSync(root + 'atlas.json', 'utf8'));
const clips = JSON.parse(readFileSync(root + 'animation.json', 'utf8')).clips;
const images = {};
const image = sheet => images[sheet] ??= decodeRgba(readFileSync(root + atlas.sheets[sheet].image));
const logical = frame => frame.logicalHeight || frame.h;
const median = list => { const s = [...list].sort((a, b) => a - b); return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2; };
const cycle = clip => { const names = clip.frames.map(frame => frame.sprite); return clip.loop ? [...names, names[0]] : names; };

/**
 * Where each frame's painted figure is, measured here from the PNG and not by the builder's code: the centroid of the
 * silhouette (the centre of mass of a figure drawn side-on), and the centroid of its torso - the band 0.40-0.75 of its
 * height above its ground line, above the legs and below a bobbing head.
 */
const bodies = {};
function body(name) {
  if (bodies[name]) return bodies[name];
  const frame = atlas.frames[name], { width, data } = image(frame.sheet), ground = frame.y + frame.anchorY * frame.h;
  let sum = 0, count = 0, torso = 0, torsoCount = 0;
  for (let y = frame.y; y < frame.y + frame.h; y++) for (let x = frame.x; x < frame.x + frame.w; x++) {
    if (data[(y * width + x) * 4 + 3] <= 40) continue;
    sum += x; count++;
    const up = (ground - y) / logical(frame);
    if (up >= 0.4 && up <= 0.75) { torso += x; torsoCount++; }
  }
  return bodies[name] = { mass: sum / count, torso: torsoCount ? torso / torsoCount : sum / count };
}
// How far the figure moves against its own ground point from one frame to the next, in its heights.
function slide(id, measure) {
  const names = cycle(clips[id]);
  let most = 0;
  for (let i = 1; i < names.length; i++) {
    const [a, b] = [names[i - 1], names[i]].map(name => { const frame = atlas.frames[name]; return (frame.x + frame.anchorX * frame.w - body(name)[measure]) / logical(frame); });
    most = Math.max(most, Math.abs(b - a));
  }
  return most;
}
const locomotion = Object.keys(clips).filter(id => LOCOMOTION.test(id) && new Set(clips[id].frames.map(frame => frame.sprite)).size > 1);

/**
 * C1. The audit: 47 of 330 locomotion clips jumped more than 0.08 of a height from one frame to the next, up to 0.81 (the
 * javelina's run), because each frame's ground point was the middle of the widest row near its bottom - one hoof in a
 * gallop. Now each clip has one ground point, held against the figure's centre of mass; measured here (independently of the
 * builder) as the slide of the silhouette's centroid, and again as the slide of its torso.
 *
 * The torso is no measure of a frame with no foot on the ground: its ground line is then a hoof or a wing in the air, so
 * its "torso" band is somewhere else on the body. The clips below have such frames, and are held to the centroid only.
 */
const AIRBORNE = Object.freeze({
  'deer-bound': 'two of its four frames are in the air', 'pronghorn-bound': 'in the air mid-bound',
  'turkey-bound': 'wings out, feet off the ground', 'geese-flight': 'a flock in the air: no ground line at all',
  'lancer-charge': 'the horse gathered and fully stretched: the lowest hoof is off the ground',
});
test('C1: a figure stays put over its ground point through a stride, walk, ride or run (slide <= 0.08 of its height)', () => {
  assert.ok(locomotion.length >= 330, `measured ${locomotion.length} locomotion clips; the audit found 330`);
  const sliding = [], torsoSliding = [];
  for (const id of locomotion) {
    const mass = slide(id, 'mass'), torso = slide(id, 'torso');
    if (mass > 0.08) sliding.push(`${id} ${mass.toFixed(3)}`);
    if (!AIRBORNE[id] && torso > 0.08) torsoSliding.push(`${id} ${torso.toFixed(3)}`);
  }
  assert.deepEqual(sliding, [], 'the figure slides against its ground point (centre of mass)');
  assert.deepEqual(torsoSliding, [], 'the figure slides against its ground point (torso)');
  // Measured by the torso, the airborne clips slide 0.08-0.17 of a height (2026-10-04): each is a clip where the two measures
  // of "the body" disagree, not a clip that slides. Held to a ceiling so a real slide in one still shows.
  for (const id of Object.keys(AIRBORNE)) assert.ok(slide(id, 'torso') <= 0.17, `${id} slides ${slide(id, 'torso').toFixed(3)} by its torso`);
});

/**
 * C2. The audit: 52 sheets had no logical height, so every frame was stretched to the requested height whatever the pose,
 * and 35 of their 108 clips changed size by more than 10% (the deer shrank about 30% raising its head). Now every figure's
 * frames share one logical height, so the scale a clip draws at is the same in every frame.
 *
 * Not figures, and left with each frame at its own height on purpose (each caller sizes them): a puff of smoke grows,
 * a burst spreads, a boat's smoke column rises, a chest's lid opens.
 */
const GROWS = Object.freeze({
  'musket-smoke': 'a puff that grows', 'cannon-smoke': 'a bank that grows', 'road-dust': 'dust that rises',
  'canister-burst': 'a burst that spreads', 'smoke-column-far-rise': 'a column that rises',
  'steamboat-laden': 'her smoke column; app.js ceiling at `SIZE.steamboat`', 'steamboat-moored': 'her smoke column; app.js ceiling at `SIZE.steamboat`',
  'home-chest-opening': 'a chest, its lid rising', 'alamo-chest-opening': 'a chest, its lid rising',
});
test('C2: a figure keeps one size through every clip it is drawn in (scale spread <= 10%)', () => {
  const growing = [], stale = [];
  for (const [id, clip] of Object.entries(clips)) {
    const frames = [...new Set(clip.frames.map(frame => frame.sprite))].map(name => atlas.frames[name]);
    if (frames.length < 2) continue;
    const scales = frames.map(frame => 1 / logical(frame)), spread = Math.max(...scales) / Math.min(...scales);
    if (GROWS[id]) { if (spread <= 1.1) stale.push(`${id} keeps its size now: take it off GROWS`); continue; }
    if (spread > 1.1) growing.push(`${id} ${spread.toFixed(3)}`);
  }
  assert.deepEqual(growing, [], 'a clip draws its figure at a different scale from one frame to the next');
  assert.deepEqual(stale, []);
  // One animal, one size, from clip to clip: the deer grazing, alert, bounding and drinking is one deer.
  for (const figure of ['deer', 'bear', 'javelina', 'bison', 'pronghorn', 'turkey', 'mustang', 'geese', 'wild-cattle']) {
    const heights = new Set(Object.entries(atlas.frames).filter(([name, frame]) => name.startsWith(`${figure}-`) && frame.sheet.startsWith('wildlife-')).map(([, frame]) => frame.logicalHeight));
    assert.equal(heights.size, 1, `${figure} is drawn at one scale in every pose (${[...heights]})`);
  }
  // The seated, lying and kneeling men are measured against the man standing, so the sizes public/battle-view.js guessed
  // for them (x0.7 seated and asleep, x0.65 kneeling and crouching, x1.18 on the crate) come out of the art instead. Each
  // drawn height, as a fraction of the man standing, must be what such a pose is.
  const drawn = name => atlas.frames[name].h / logical(atlas.frames[name]);
  const POSES = [
    ['volunteer-rest-sit-1', 0.55, 0.72, 'seated on the ground'], ['regular-rest-sit-1', 0.55, 0.72, 'seated on the ground, in a shako'],
    ['volunteer-sleep-1', 0.3, 0.45, 'lying down'], ['regular-sleep-1', 0.3, 0.45, 'lying down'],
    ['volunteer-loophole-aim', 0.6, 0.78, 'kneeling to aim'], ['volunteer-loophole-load', 0.6, 0.78, 'kneeling to load'],
    ['settler-gun-rammer-cover-1', 0.6, 0.78, 'crouched, hands over his ears'], ['settler-gun-ram-1', 0.85, 0.98, 'lunging with the rammer'],
    ['volunteer-dig-1', 0.9, 1.01, 'digging, bent over the spade'], ['twin-crew-ram', 0.75, 0.9, 'lunging with the rammer'],
    ['castrillon-crate-command-1', 1.1, 1.25, 'standing on a crate'],
  ];
  for (const [name, low, high, what] of POSES) assert.ok(drawn(name) >= low && drawn(name) <= high, `${name} (${what}) draws ${drawn(name).toFixed(2)} of the man standing; ${low}-${high} expected`);
});

/**
 * C3. The audit: a famous sheet's logical height was its tallest frame in rows 1-3, which could be an action pose - a
 * raised arm - so 9 of its 120 sheets drew their person at least 6% small in every pose (Hockley 13.5%, Sherman 12%,
 * Susanna carrying Angelina 16%). Now a sheet with walking frames is measured from them: every person walks at the height
 * the cast walks at, within 5%.
 */
test('C3: every famous person walks at the height the whole cast walks at (within 5%)', () => {
  const walking = {};
  for (const [name, frame] of Object.entries(atlas.frames)) {
    if (!frame.sheet.startsWith('famous-') || !/-walk(?:-|$)/.test(name)) continue;
    (walking[frame.sheet] ??= []).push(frame.audit.sourceBounds[3] / logical(frame));
  }
  const sheets = Object.entries(walking).map(([sheet, heights]) => [sheet, median(heights)]);
  assert.ok(sheets.length >= 80, `${sheets.length} famous sheets with walking frames`);
  const cast = median(sheets.map(([, height]) => height));
  const off = sheets.filter(([, height]) => Math.abs(height / cast - 1) > 0.05).map(([sheet, height]) => `${sheet} ${(height / cast).toFixed(3)}`);
  assert.deepEqual(off, [], `cast median ${cast.toFixed(3)} of the requested height`);
});
