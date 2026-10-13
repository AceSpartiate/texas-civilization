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

/**
 * How strongly a tree drawn again over somebody is laid over them: thinned, so the person is seen through the leaves in front
 * of them, still behind the tree and among the woods, and never hidden (owner, 2026-10-13: "Thin the trees over family members
 * instead of hiding them" - at the yard zoom in the timber, four of a family of five were names over bushes). The tree drawn
 * again is the ground's own tree over itself, so off the person it is the same colour at any strength: only the person shows
 * through, and no box.
 */
export const FRONT_STRENGTH = 0.45;

/** The screen box a figure drawn with its feet at `feet`, `figure` tall, stands in: what a tree drawn again over it is kept to. */
export const figureBox = (feet, figure) => ({ left: feet.x - figure * 0.5, top: feet.y - figure * 1.1, width: figure, height: figure * 1.1 + 2 });

/**
 * Paints the trees drawn again over somebody (`paint`, given a context: they are painted back to front, at full strength), kept to
 * the figure's `box`, and lays them over the person thinned (`FRONT_STRENGTH`), carrying the weather the ground under them got
 * before anybody was drawn (`weather`, given a context, or null on a fair day: public/app.js lays the wet earth and the fog and
 * rain veil with it).
 *
 * In a layer of its own (`layers`, two canvases the size of the page's): the trees together, so where crowns overlap they are
 * thinned once and not laid back up to solid one over another; the weather over them there, or on a day of fog or storm the
 * figure's box showed as a hard-edged square of clearer woods in the veiled ground round it (seen in the weather proof,
 * 2026-10-13); and the layer then cut back to the trees' own shape before it goes onto the page. So the weather is on the trees
 * alone, and the person under them is never veiled: a person is a fact and is drawn at full strength; the trees in front of them
 * are scenery (public/weather-art.js `drawWeatherVeil`).
 * ceiling: the weather is laid over the trees' anti-aliased edge and that edge then cut by its own coverage, so a half-covered
 * pixel at the rim of a crown comes out a shade fainter than the ground's; invisible at the sizes the trees are drawn, and laying
 * the weather on the layer premultiplied by hand is the way out if it is ever seen. Returns whether the weather was laid.
 *
 * Laid once over the whole family, not once a person (`layers`' third canvas, `laid`: what has gone onto the page this frame,
 * cleared by `clearLaid` before the first). A family sitting together under the tent has boxes that overlap, and each person's
 * trees laid again over a neighbour already under their own thinned the same leaves back up to solid: in the weather proof's
 * yard (2026-10-13) Henry, Peter and Frances Weatherby sat under three and four laid layers - at four, 0.55 to the fourth of a
 * person shows - and read as names over bushes. Now a pixel a layer was already laid on this frame is cut out of the next before it goes down.
 * ceiling: where two people's boxes overlap, the trees laid there are the first group's; a tree in front of the second person
 * alone is then not drawn again over them in the overlap, and they are seen over it there. Laying the union of both groups once
 * is the way out if it is ever noticed.
 */
export function paintInFront(ctx, box, paint, weather, layers) {
  const x = Math.floor(box.left), y = Math.floor(box.top), w = Math.ceil(box.left + box.width) - x, h = Math.ceil(box.top + box.height) - y;
  const [trees, shape, laid] = layers(ctx.canvas.width, ctx.canvas.height);
  const layer = trees.getContext('2d'), cut = shape.getContext('2d');
  for (const each of [layer, cut]) {
    each.setTransform(1, 0, 0, 1, 0, 0); each.globalAlpha = 1; each.globalCompositeOperation = 'source-over';
    each.clearRect(x, y, w, h);
  }
  layer.save();
  layer.beginPath(); layer.rect(x, y, w, h); layer.clip();
  paint(layer);
  if (weather) {
    // The trees' own shape, before the weather spreads over the box round them.
    cut.drawImage(trees, x, y, w, h, x, y, w, h);
    weather(layer);
    layer.globalCompositeOperation = 'destination-in';
    layer.drawImage(shape, x, y, w, h, x, y, w, h);
  }
  // Nothing laid twice this frame: what an earlier person's trees already laid here is cut out of these.
  if (laid) { layer.globalCompositeOperation = 'destination-out'; layer.drawImage(laid, x, y, w, h, x, y, w, h); }
  layer.restore();
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = FRONT_STRENGTH; ctx.globalCompositeOperation = 'source-over';
  ctx.drawImage(trees, x, y, w, h, x, y, w, h);
  ctx.restore();
  if (laid) {
    const mark = laid.getContext('2d');
    mark.setTransform(1, 0, 0, 1, 0, 0); mark.globalAlpha = 1; mark.globalCompositeOperation = 'source-over';
    mark.drawImage(trees, x, y, w, h, x, y, w, h);
  }
  return Boolean(weather);
}

/** Forgets what the trees drawn again laid on the page (`paintInFront`'s `laid`): once a frame, before the first is laid. */
export function clearLaid(layers, width, height) {
  const laid = layers(width, height)[2];
  if (!laid) return;
  const mark = laid.getContext('2d');
  mark.setTransform(1, 0, 0, 1, 0, 0);
  mark.clearRect(0, 0, width, height);
}
