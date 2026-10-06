// Which of the ground's trees are drawn again over somebody walking among them (public/app.js `treesInFront`).
//
// The woods are drawn into the kept ground, under everybody, and a tree whose trunk stands nearer the viewer than somebody's feet
// is drawn again over them, so a person in the timber is seen among the trees and not over them (owner, 2026-10-02: "it's weird
// seeing characters walk over trees"). The owner, 2026-10-05: "Characters that walk through woods sometimes bring the trees with
// them in a cluster as they walk (graphical glitch)." The tree drawn again was not always the tree under it: trees the ground
// leaves out - in cleared ground, in a river's channel - were drawn round whoever walked there, and came and went with them; in
// the zoom band where the trees fade in, a tree drawn again at its fading strength over itself was a darker tree that walked with
// them; it stood upright over a tree the wind leaned; and the trees were picked round the server's point, not round the figure,
// which is drawn off it. Now a tree is drawn again only where the ground drew it (`redrawn`), as the ground drew it, only at full
// strength, picked by the figure's own feet (`inFront`), and only over the figure (`figureBox`), so it is seen as nothing but the
// tree in front of somebody. Pure, so tests/trees-front.test.mjs holds it.

/** How wide a tree's crown is drawn, as a share of its height either side of its trunk; a person's figure, of theirs. */
export const CROWN_HALF = 0.42, FIGURE_HALF = 0.28;
/**
 * Below this the ground's trees are fading in (public/woods-view.js `WOODS_BANDS.trees`), and one drawn twice reads darker.
 * ceiling: in that band no tree is drawn again, so somebody walking is drawn over the faint trees in front of them, as before
 * 2026-10-02; drawing the tree again over the figure's own pixels alone (a mask of the figure) is the way out if it is ever noticed.
 */
export const FULL_STRENGTH = 0.98;

/**
 * The ground's own drawing of a tree to draw again, or null: the tree must be one the ground drew (`drawn`, by `x,y`), at full
 * strength. A tree the ground left out - in cleared ground, in a channel - is never drawn over anybody.
 */
export function redrawn(drawn, tree) {
  const item = drawn?.get(`${tree.x},${tree.y}`);
  return item && item.alpha >= FULL_STRENGTH ? item : null;
}

/**
 * Whether a tree whose trunk stands at `trunk` (screen) and drawn `height` tall is in front of a figure whose feet are drawn at
 * `feet`, `figure` tall: nearer the viewer (lower on the screen), its crown reaching up over their feet, and over their body side
 * to side.
 */
export function inFront(trunk, height, feet, figure) {
  if (trunk.y <= feet.y || trunk.y - height >= feet.y) return false;
  return Math.abs(trunk.x - feet.x) < height * CROWN_HALF + figure * FIGURE_HALF;
}

/** The screen box a figure drawn with its feet at `feet`, `figure` tall, stands in: what a tree drawn again over it is kept to. */
export const figureBox = (feet, figure) => ({ left: feet.x - figure * 0.5, top: feet.y - figure * 1.1, width: figure, height: figure * 1.1 + 2 });
