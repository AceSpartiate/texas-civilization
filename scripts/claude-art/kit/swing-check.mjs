// Measure a swing as motion, not as poses (owner, 2026-09-28: "make sure the chop swings look natural"): for each frame of
// a swing, where the hands were asked to be on the handle and where the arms could put them, the handle's length, where the
// feet stand, and where the tool's head is. `checkSwing` returns the faults, so a test (tests/claude-rig.test.mjs) and the
// preview (scripts/claude-art/preview-swing.mjs) read the same numbers.
import { Ink, len, sub } from './svg.mjs';
import { drawPerson, frameOf, rigidTool } from './rig.mjs';
import { POSES, SWINGS } from './poses.mjs';
import { TOOLS } from './props.mjs';

/** The joints of every frame of `swing` for `figure`, as the rig draws them. */
export function swingFrames(figure, swing) {
  const F = frameOf(figure);
  return POSES[swing](F).map(pose => drawPerson(new Ink('check', 1), figure, pose));
}

/**
 * The faults in a swing: a hand more than `slack` units off the handle, a handle not its own length, a foot that moves
 * between frames, and a head that jumps: the largest step of the tool's head from one frame to the next may not be more than
 * `jump` times the median step, so the arc is travelled evenly and not in one leap.
 */
export function checkSwing(figure, swing, { slack = 0.75, jump = 2.6 } = {}) {
  const frames = swingFrames(figure, swing), faults = [];
  const length = TOOLS[POSES[swing](frameOf(figure))[0].tool.kind].length;
  frames.forEach((j, i) => {
    const n = len(sub(j.handNear, j.wantNear)), f = len(sub(j.handFar, j.wantFar));
    if (n > slack) faults.push(`${figure} ${swing} ${i + 1}: the top hand is ${n.toFixed(1)} off the handle`);
    if (f > slack) faults.push(`${figure} ${swing} ${i + 1}: the bottom hand is ${f.toFixed(1)} off the handle`);
  });
  const poses = POSES[swing](frameOf(figure));
  poses.forEach((pose, i) => {
    const { butt, tip } = pose.tool.grip ? rigidTool(pose.tool) : pose.tool, handle = len(sub(tip, butt));
    if (Math.abs(handle - length) > 0.01) faults.push(`${figure} ${swing} ${i + 1}: the handle is ${handle.toFixed(2)}, not ${length}`);
    for (const which of ['near', 'far']) {
      const [x0] = poses[0].feet[which], [x] = pose.feet[which];
      if (Math.abs(x - x0) > 0.01) faults.push(`${figure} ${swing} ${i + 1}: the ${which} foot slid ${(x - x0).toFixed(1)}`);
      if (pose.feet[which][1] < frameOf(figure).ankle - 0.01) faults.push(`${figure} ${swing} ${i + 1}: the ${which} foot is below the ground`);
    }
  });
  const steps = frames.map((j, i) => len(sub(frames[(i + 1) % frames.length].head, j.head)));
  const median = [...steps].sort((a, b) => a - b)[Math.floor(steps.length / 2)];
  steps.forEach((step, i) => { if (step > median * jump) faults.push(`${figure} ${swing}: the head jumps ${step.toFixed(0)} from frame ${i + 1} to ${(i + 1) % frames.length + 1} (median step ${median.toFixed(0)})`); });
  return faults;
}

export const SWING_NAMES = Object.keys(SWINGS);
