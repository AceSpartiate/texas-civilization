// Area A's Claude-drawn poses (scripts/claude-art/kit/work-poses.mjs; docs/CLAUDE_ART_PLAN.md area A) move like people at the
// work, and the game draws them where it asks for the work (owner, 2026-09-28: "make all of the remaining art ... label yours so
// astra can replace"; the builder's brief: "planted feet, tools kept a constant length and held in the hands"):
//   - a pose that does not walk keeps both feet where they stood in every frame (a foot may lift, never slide);
//   - every hand the pose puts somewhere (on a stick, a rag, a basket, a haft) is reached by the arm, not left in the air;
//   - each ambient activity the server names has its own clip for all eight cast figures, and the page asks for it;
//   - each work effect has its three-frame sheet, drawn in place of the canvas marks once it has loaded;
//   - the soldiers at rest have their clips.
// Proved by injection: `npm run test:claude-art` (scripts/claude-art/injections.mjs).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { AMBIENT, WORK, CAMP, drawPosed } from '../scripts/claude-art/kit/work-poses.mjs';
import { POSES } from '../scripts/claude-art/kit/poses.mjs';
import { frameOf } from '../scripts/claude-art/kit/rig.mjs';
import { Ink, len, sub } from '../scripts/claude-art/kit/svg.mjs';
import { ambientClip, AMBIENT_DRAWN, drawnClipName } from '../public/motion.js';
import { STROKES, drawnStroke, drawWorkLayer } from '../public/work-art.js';

const CAST = ['rust', 'teal', 'elder', 'blue', 'rust-woman', 'indigo', 'ochre', 'blue-girl'];
const standins = JSON.parse(readFileSync(fileURLToPath(new URL('../public/assets/claude-standins/atlas.json', import.meta.url)), 'utf8'));
const makers = figure => {
  const F = frameOf(figure);
  return {
    ...Object.fromEntries(Object.entries(AMBIENT).map(([name, make]) => [name, () => make(F)])),
    ...Object.fromEntries(Object.entries(WORK).map(([name, make]) => [name, () => make(F, name === 'split' ? POSES.split : POSES.dig)])),
  };
};
/** Poses that walk (their feet move by design), and the frame that steps on. */
const WALKS = new Set(['carry-water', 'drill']);
const STEPS = { reap: 3 };

test('area A poses that do not walk keep both feet where they stood, for every cast figure', () => {
  const faults = [];
  for (const figure of CAST) for (const [name, make] of Object.entries(makers(figure))) {
    if (WALKS.has(name)) continue;
    const frames = make(), first = frames[0];
    frames.forEach((pose, i) => {
      if (!pose.feet || !first.feet || STEPS[name] === i) return;
      for (const which of ['near', 'far']) {
        // Along the ground: a foot may lift (onto the spade's tread) but not slide.
        const moved = Math.abs(pose.feet[which][0] - first.feet[which][0]);
        if (moved > 0.01) faults.push(`${figure} ${name} ${i + 1}: the ${which} foot slid ${moved.toFixed(1)}`);
      }
    });
  }
  assert.deepEqual(faults, []);
});

test('every hand an area A pose places is reached by its arm: on the stick, the rag, the haft, the basket - never in the air', () => {
  const faults = [];
  const check = (figure, name, frames) => frames.forEach((pose, i) => {
    const j = drawPosed(new Ink('check', 1), figure, pose);
    if (!j.wantNear) return; // a frontal frame places its hands its own way
    for (const [hand, want] of [['near', j.wantNear], ['far', j.wantFar]]) {
      const asked = hand === 'near' ? pose.hands?.near || pose.tool : pose.hands?.far || pose.tool;
      if (!asked) continue;
      const got = hand === 'near' ? j.handNear : j.handFar, off = len(sub(got, want));
      if (off > 1) faults.push(`${figure} ${name} ${i + 1}: the ${hand} hand is ${off.toFixed(1)} short of where the pose puts it`);
    }
  });
  for (const figure of CAST) for (const [name, make] of Object.entries(makers(figure))) check(figure, name, make());
  for (const figure of ['volunteer', 'regular']) for (const [name, make] of Object.entries(CAMP)) check(figure, name, make(frameOf(figure)));
  assert.deepEqual(faults, []);
});

test('each ambient activity the server names has its own clip for all eight cast figures, and the page asks for it', () => {
  for (const [activity, pose] of Object.entries(AMBIENT_DRAWN)) {
    for (const figure of CAST) {
      assert.ok(standins.clips[`${figure}-${pose}`], `${figure}-${pose} (for ${activity}) is not drawn`);
      const clip = ambientClip(figure, { a: activity, p: 'repair' });
      assert.equal(drawnClipName(clip, clip.id), `${figure}-${pose}`, `${activity}: the page does not ask for ${figure}-${pose}`);
      assert.equal(clip.id, `${figure}-repair`, `${activity}: the delivered pose the server names is not kept for a figure without the clip`);
    }
  }
  assert.equal(ambientClip('rust', { a: 'sit', p: 'rest' }).drawn, undefined, 'sitting a while has no clip of its own and asks for none');
});

test('each work effect has its three-frame sheet, drawn in place of the canvas marks once it has loaded', () => {
  const ctx = new Proxy({}, { get: () => () => {}, set: () => true });
  const effects = { chips: STROKES.chop, dust: STROKES.hoe, earth: STROKES.dig, shavings: STROKES.whittle, ripple: drawnStroke(STROKES.fish) };
  for (const [effect, stroke] of Object.entries(effects)) {
    const asked = [];
    const clock = { frame: 0, since: 40, period: 1000, count: 1 };
    const marks = drawWorkLayer(ctx, stroke.tool ? { ...stroke, tool: undefined } : stroke, 100, 200, 40, 1, clock, false, 'rust', (c, name) => { asked.push(name); return 1; });
    assert.equal(asked.length, 1, `${effect}: the sheet was not asked for (${asked})`);
    const sheet = asked[0].replace(/-\d$/, '');
    for (const n of [1, 2, 3]) assert.ok(standins.frames[`${sheet}-${n}`], `${sheet}-${n} is not drawn`);
    assert.ok(standins.clips[sheet], `${sheet} has no clip`);
    assert.equal(marks, 1, `${effect}: the canvas marks are drawn over the sheet`);
    const fallback = drawWorkLayer(ctx, stroke.tool ? { ...stroke, tool: undefined } : stroke, 100, 200, 40, 1, clock, false, 'rust', () => 0);
    assert.ok(fallback >= 1, `${effect}: nothing is drawn while the sheet has not loaded`);
  }
  for (const n of [1, 2, 3, 4]) assert.ok(standins.frames[`tree-fall-${n}`], `tree-fall-${n} is not drawn`);
});

test('the soldiers at rest have their clips, and the page asks for them by the camp\'s activity', () => {
  const source = readFileSync(fileURLToPath(new URL('../public/ambient.js', import.meta.url)), 'utf8');
  const table = JSON.parse(source.match(/SOLDIERS_AT_REST = Object\.freeze\((\{[^)]*\})\)/)[1].replace(/(\w+):/g, '"$1":').replaceAll("'", '"'));
  assert.deepEqual(Object.keys(table).sort(), ['cook', 'rifle', 'sit']);
  for (const figure of ['volunteer', 'regular']) for (const pose of Object.values(table)) assert.ok(standins.clips[`${figure}-${pose}`], `${figure}-${pose} is not drawn`);
  const sim = readFileSync(fileURLToPath(new URL('../sim/ambient.mjs', import.meta.url)), 'utf8');
  for (const figure of ['volunteer', 'regular']) for (const a of ['sit', 'cook']) assert.match(sim, new RegExp(`\\{ a: '${a}', f: '${figure}'`), `no ${figure} ${a}s in camp`);
});
