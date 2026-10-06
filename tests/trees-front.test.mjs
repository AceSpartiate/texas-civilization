// The trees drawn again over somebody walking among them are the ground's own trees, drawn as the ground drew them (owner,
// 2026-10-05: "Characters that walk through woods sometimes bring the trees with them in a cluster as they walk (graphical
// glitch)."; public/trees-front.js, public/app.js `treesInFront`).
//
// The glitch, as found: the page drew again, over each person on the family's land, every tree near them in the tiles - also the
// trees the ground leaves out (in cleared ground, in a river's channel), which then came and went round whoever walked there; in the
// zoom band where the trees fade in it drew each at its fading strength over itself, a darker tree that walked with them; it stood
// them upright where the ground leaned them in the wind; and it picked them round the server's point, not the figure drawn off it.
// These tests run the page's own `treesInFront`, read out of public/app.js, against a ground and a person set up for each case.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CROWN_HALF, FULL_STRENGTH, figureBox, inFront, redrawn } from '../public/trees-front.js';

const page = readFileSync(new URL('../public/app.js', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
function declaration(start, end) {
  const from = page.indexOf(start);
  assert.ok(from >= 0, `${start} was not found in public/app.js, so this test checks nothing`);
  return page.slice(from, page.indexOf(end, from) + end.length);
}

/** A camera a mile to 2000 pixels, the world's (10, 10) in the middle of an 800 by 600 canvas. */
const scale = 2000;
const camera = { scale, figure: 38, toScreen: p => ({ x: 400 + (p.x - 10) * scale, y: 300 + (p.y - 10) * scale }), toWorld: s => ({ x: 10 + (s.x - 400) / scale, y: 10 + (s.y - 300) / scale }) };
const canvas = { width: 800, height: 600 };
const kind = { id: 'post-oak', picture: 'post-oak', sized: true, scale: 1 };

/**
 * The page's `treesInFront`, run over `trees` (what the tiles hold near the person), with `drawn` the trees the ground drew (by
 * `x,y`) and `drawnAt` where the person's figure was drawn. Returns the trees painted again, with how each was painted.
 */
function runTreesInFront({ trees, drawn, person, drawnAt }) {
  const painted = [], standing = [], window = {};
  const ctx = { save() {}, restore() {}, beginPath() {}, rect(...box) { this.box = box; }, clip() { this.clipped = this.box; } };
  const treesInFront = new Function('woodsShown', 'woodsCatalogue', 'groundTrees', 'treesNear', 'redrawn', 'treeLook', 'inFront', 'figureBox', 'drawnAt', 'paintTree', 'SIZE', 'window',
    `${declaration('function treesInFront(', '\n}\n')}\nreturn treesInFront;`,
  )(() => true, { tiles: {} }, drawn, () => trees, redrawn, tree => ({ tree: `${tree.kind.picture}-log`, standIn: null, height: camera.figure * 1.6 }), inFront, figureBox,
    new Map(Object.entries(drawnAt)), (ctx, item) => painted.push({ ...item, clip: ctx.clipped }), { timberTree: 1.6 }, window);
  treesInFront(ctx, {}, camera, canvas, [person], standing);
  for (const each of standing.sort((a, b) => a.y - b.y)) each.draw();
  return { painted, shown: window.__treesInFront };
}
/** A person on the land: their server point, and where their figure was drawn (the middle of it, `drawnAt`, as public/app.js keeps it). */
const person = (at, feet = at) => {
  const point = camera.toScreen(at), drawnFeet = camera.toScreen(feet);
  return { person: { id: 'p-1', point, figure: camera.figure }, drawnAt: { 'p-1': { x: drawnFeet.x, y: drawnFeet.y - camera.figure * 0.45, size: camera.figure } } };
};
/** A tree a little in front of and below somebody standing at (10, 10): its trunk nearer the viewer, its crown over them. */
const ahead = { x: 10.002, y: 10.006, kind, size: 1 };
const groundOf = (...items) => new Map(items.map(([tree, item]) => [`${tree.x},${tree.y}`, { alpha: 1, lean: 0, gale: false, seed: 7, ...item }]));

test('a tree the ground drew in front of somebody is drawn again over them, as the ground drew it, and kept to the figure', () => {
  const { painted, shown } = runTreesInFront({ trees: [ahead], drawn: groundOf([ahead, { lean: 0.3, gale: false, seed: 99 }]), ...person({ x: 10, y: 10 }) });
  assert.equal(painted.length, 1, 'drawn again over them');
  assert.equal(painted[0].lean, 0.3, 'leaning in the wind as the ground leaned it');
  assert.equal(painted[0].seed, 99);
  assert.deepEqual(shown.map(one => one.key), [`${ahead.x},${ahead.y}`]);
  // Kept to the figure: the clip is the figure's own box, so no tree is drawn twice beside them.
  const box = figureBox({ x: 400, y: 300 }, camera.figure);
  assert.deepEqual(painted[0].clip, [box.left, box.top, box.width, box.height]);
});

test('a tree the ground left out - in cleared ground, in a river - is never drawn round somebody walking there', () => {
  // The ground drew other trees, behind them: this one, in front, it left out.
  const drawnElsewhere = { x: 9.99, y: 9.99, kind, size: 1 };
  const { painted } = runTreesInFront({ trees: [ahead, drawnElsewhere], drawn: groundOf([drawnElsewhere, {}]), ...person({ x: 10, y: 10 }) });
  assert.equal(painted.length, 0, 'a tree the ground did not draw came along with them');
});

test('while the trees fade in with the zoom, none is drawn again: one over itself would read darker and walk with them', () => {
  const { painted } = runTreesInFront({ trees: [ahead], drawn: groundOf([ahead, { alpha: 0.6 }]), ...person({ x: 10, y: 10 }) });
  assert.equal(painted.length, 0);
  assert.ok(FULL_STRENGTH > 0.6 && FULL_STRENGTH <= 1);
  assert.equal(redrawn(groundOf([ahead, { alpha: 1 }]), ahead)?.alpha, 1);
  assert.equal(redrawn(groundOf([ahead, { alpha: 0.97 }]), ahead), null);
});

test('the trees are picked by where the figure is drawn, not by the server\'s point it is drawn off', () => {
  // The server has them at (10, 10), the tree just in front of that; the page drew them a figure lower, in front of the tree.
  const off = person({ x: 10, y: 10 }, { x: 10, y: 10.012 });
  assert.equal(runTreesInFront({ trees: [ahead], drawn: groundOf([ahead, {}]), ...off }).painted.length, 0, 'drawn over a figure standing in front of it');
  // And drawn a figure higher, behind a tree the server point is in front of.
  const behind = { x: 10, y: 9.997, kind, size: 1 };
  const up = person({ x: 10, y: 9.99 }, { x: 10, y: 9.995 });
  assert.equal(runTreesInFront({ trees: [behind], drawn: groundOf([behind, {}]), ...up }).painted.length, 1, 'not drawn over the figure it stands in front of');
});

test('in front means nearer the viewer with the crown over the figure', () => {
  const feet = { x: 100, y: 100 };
  assert.equal(inFront({ x: 100, y: 110 }, 60, feet, 40), true);
  assert.equal(inFront({ x: 100, y: 90 }, 60, feet, 40), false, 'behind them');
  assert.equal(inFront({ x: 100, y: 170 }, 60, feet, 40), false, 'its crown does not reach up to them');
  assert.equal(inFront({ x: 100 + 60 * CROWN_HALF + 40 * 0.28 + 1, y: 110 }, 60, feet, 40), false, 'off to the side');
});
