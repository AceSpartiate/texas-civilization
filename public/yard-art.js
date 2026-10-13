// What a family's camp is drawn with until its house has a roof (public/app.js `homesteadCamp`): the fire, the pot, a bedroll and the
// goods off the wagon, each at its own height in people (a person drawn `figure` px tall), set out from the camp's point.
//
// Owner, 2026-10-13: "fix the giant bedroll too". Until then each piece was a share of the size the camp was drawn at, and the camp was
// drawn at a house's size (`CABIN_PEOPLE`, 3.3 people) at the site: the bedroll 1.1 people tall and 1.9 wide - wider than the wagon
// beside it (1.8) - the goods 1.2 tall, the fire nearly a person. A rolled blanket lies about a third of a person high; a trunk and its
// bundles about half; the fire and the pot are knee-high. Pure, so tests/yard-art.test.mjs holds the sizes without a page.
//
// `dx`, `dy` and `height` in people from the camp's point; `clip` is drawn first where its sheet is in, the sprite otherwise.
export const CAMP_GOODS = Object.freeze([
  Object.freeze({ sprite: 'packed-belongings', dx: -0.15, dy: -0.12, height: 0.45 }),
  Object.freeze({ sprite: 'bedroll', dx: -0.62, dy: 0.28, height: 0.3 }),
  Object.freeze({ sprite: 'campfire', clip: 'fire-flicker', dx: 0.3, dy: 0.12, height: 0.5 }),
  Object.freeze({ sprite: 'cooking-pot', dx: 0.72, dy: 0.18, height: 0.3 }),
]);
