// The Claude rig's swings move like a person swinging a tool (owner, 2026-09-28: "make sure the chop swings look natural"):
// in every frame of the chop, the hoe, the split and the dig, for each of the eight grown cast figures, both hands are on
// the handle, the handle is its own length, the feet do not move, and the tool's head travels its arc evenly, with no one
// frame-to-frame leap far larger than the rest (scripts/claude-art/kit/swing-check.mjs). The timing holds the wind-up and the
// strike longer than the in-betweens, and the clip, the pose library and the game agree on which frame the tool lands on.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { checkSwing, SWING_NAMES } from '../scripts/claude-art/kit/swing-check.mjs';
import { SWINGS, POSES } from '../scripts/claude-art/kit/poses.mjs';
import { frameOf } from '../scripts/claude-art/kit/rig.mjs';
import { STROKES } from '../public/work-art.js';

const CAST = ['rust', 'teal', 'elder', 'blue', 'rust-woman', 'indigo', 'ochre', 'blue-girl'];
const standins = JSON.parse(readFileSync(fileURLToPath(new URL('../public/assets/claude-standins/atlas.json', import.meta.url)), 'utf8'));

test('every swing, for every cast figure: hands on a rigid handle, feet planted, the head on an even arc', () => {
  assert.deepEqual(SWING_NAMES.sort(), ['chop', 'dig', 'hoe', 'split']);
  const faults = CAST.flatMap(figure => SWING_NAMES.flatMap(swing => checkSwing(figure, swing)));
  assert.deepEqual(faults, []);
});

test('each swing holds its wind-up and its strike longer than the in-betweens, and names the frame it lands on', () => {
  for (const [swing, { durations, beat }] of Object.entries(SWINGS)) {
    assert.equal(durations.length, POSES[swing](frameOf('rust')).length, `${swing}: a duration a frame`);
    const inBetweens = durations.filter((_, i) => i !== 0 && i !== beat);
    assert.ok(durations[0] > Math.max(...inBetweens) && durations[beat] > Math.max(...inBetweens), `${swing}: the wind-up (${durations[0]}) and the strike (${durations[beat]}) are held longer than the in-betweens (${inBetweens})`);
  }
});

test('the chop clips are the pose library\'s swing, for all eight, and the game strikes on the frame the clip names', () => {
  for (const figure of CAST) {
    const clip = standins.clips[`${figure}-chop`];
    assert.ok(clip, `${figure}-chop is drawn`);
    assert.deepEqual(clip.frames.map(f => f.duration), SWINGS.chop.durations, `${figure}-chop keeps the swing's timing`);
    assert.equal(clip.beat, SWINGS.chop.beat, `${figure}-chop lands where the swing does`);
  }
  assert.equal(STROKES.chop.drawn.beat, SWINGS.chop.beat, 'public/work-art.js throws the chips on the frame the axe lands');
});
