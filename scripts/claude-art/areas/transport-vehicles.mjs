// Area D (docs/CLAUDE_ART_PLAN.md): the family's vehicles, drawn by Claude on 2026-09-28 - temporary, each frame to be replaced
// by Astra's of the same name.
//   D5   the cart (`cart-travel-*`, `cart-idle-*`), empty and loaded, east, south and north, the wheels turning
//   D14  the covered wagon with its ox yoked to the tongue as one rolling rig (`wagon-ox-*`), covered, loaded (bows bare over the
//        load) and empty, east, south and north
//   D15  the carreta laden, travelling (`carreta-loaded-travel-*`)
// The vehicles are kit/vehicles.mjs (built in three dimensions and projected into the game's view); the ox is the four-legged
// rig's (kit/quadruped.mjs) under a single neck yoke.
//
// History and what is a guess: a family's wagon of 1833-36 was an ox-drawn farm or "baggage" wagon (Parker, Trip to the West and
// Texas, 1836, p. 203; `HIST-TEX-441`), drawn here with a canvas on five bows as the library's `wagon-covered` has it; the record
// read gives no dimensions, so the size is the game's. Oxen were normally worked in pairs under a double neck yoke; the game
// hitches one ox (sim/beasts.mjs), so one ox is drawn in a single neck yoke with the tongue run to the ring under its neck - the
// request's own "one ox yoked to its tongue", and an interpretation, not a record. The carreta's solid pegged plank wheels, wooden
// axle and rawhide lashings follow `HIST-TEX-443` (Smithwick; Woodman's guide, 1835; Harris); the cart's spoked, iron-tyred
// wheels follow the library's `cart-open`.
import { groupFrame, placed } from '../kit/horse.mjs';
import { COATS, quadPose, drawQuadSide, drawQuadFrontal } from '../kit/quadruped.mjs';
import { drawCart, drawCarreta, drawWagon, projector } from '../kit/vehicles.mjs';
import { UNIT } from '../kit/style.mjs';

export const AREA = 'transport';
export const DATE = '2026-09-28';

const RES = 0.5, half = c => ({ w: c.w * RES, h: c.h * RES });
const STYLE = 'Warm hand-drawn storybook style, weathered brown wood, thin dark olive-brown outline, flat shade to the lower right, slightly elevated north-up three-quarter view; transparent ground, no shadow, no text.';
const HEADINGS = { e: 'east (west is the game\'s mirror)', s: 'toward the camera (south)', n: 'away from the camera (north)' };
const DIRS = ['e', 's', 'n'];

// ------------------------------------------------------------------------------------------------------------ D5 the cart
// One unit of the cart's own height (stake top, 100 units) is its logical height in every heading, so it does not change size
// when it turns; the page draws the cart at 0.8 of a wagon, as it draws the delivered `cart-open` views.
const CART = { w: 640, h: 560 };
// Side-on its logical height is the cart's own (stake top, 100 units). End-on it is the whole drawing's height, the bed rising into
// the distance included, as Astra's `cart-open-s`/`-n` and `carreta-travel-s`/`-n` are cropped and drawn - so a Claude cart or
// carreta turning south is the same size as hers.
const VERTICAL = { cart: { s: 152, n: 156 }, carreta: { s: 162, n: 162 } };
const cartFrame = (name, h, o) => groupFrame(name, { cell: CART, originX: h === 'e' ? 250 : CART.w / 2, groundY: CART.h - 30, logical: (h === 'e' ? 100 : VERTICAL.cart[h]) * UNIT, res: RES, note: o.note }, ink => drawCart(ink, h, o));
const CART_WHO = loaded => `The family's two-wheeled ox cart of the 1830s without its ox (the team is drawn separately): a plank box with stakes, two iron-tyred spoked wheels on one axle, a tongue with a ring${loaded ? ', loaded with sacks, a barrel and a rolled blanket' : ', empty'}`;
const cartSets = [];
for (const loaded of [false, true]) for (const h of DIRS) {
  const tag = `${loaded ? 'loaded-' : ''}${h}`;
  const travel = [0, 1, 2, 3].map(i => ({ name: `cart-travel-${tag}-${i + 1}`, height: 1.24, compare: [[`cart-open-${h}`, 1.24], ['ox-walk-1', 1.45]],
    prompt: `${CART_WHO(loaded)}, rolling ${HEADINGS[h]}, frame ${i + 1} of 4: the wheels turn a quarter of a spoke's spacing a frame, so the loop turns without a jump. ${STYLE}`,
    draw: () => cartFrame(`cart-travel-${tag}-${i + 1}`, h, { frame: i, loaded, note: `the cart rolling ${h}${loaded ? ', loaded' : ''}, frame ${i + 1} of 4` }) }));
  const idle = { name: `cart-idle-${tag}-1`, height: 1.24, compare: [[`cart-open-${h}`, 1.24]],
    prompt: `${CART_WHO(loaded)}, standing still, facing ${HEADINGS[h]}. ${STYLE}`,
    draw: () => cartFrame(`cart-idle-${tag}-1`, h, { frame: 0, loaded, rolling: false, note: `the cart standing${loaded ? ', loaded' : ''}, ${h}` }) };
  cartSets.push({ tag, h, loaded, travel, idle });
}

// ------------------------------------------------------------------------------------------------------------ D15 the carreta laden
const CARRETA = { w: 660, h: 580 };
const carretaLoaded = DIRS.map(h => [0, 1, 2, 3].map(i => ({ name: `carreta-loaded-travel-${h}-${i + 1}`, height: 1.24, compare: [[`carreta-travel-${h}-1`, 1.24], ['carreta-loaded-e', 1.24]],
  prompt: `The carreta laden and travelling ${HEADINGS[h]}, without its ox: two great solid wheels of pegged planks on a wooden axle, no iron tyre; an open frame of poles lashed with rawhide; a pole tongue; loaded with sacks of corn, a barrel and a striped blanket; frame ${i + 1} of 4, the plank seams and pegs of the wheels turning an eighth of a turn a frame (the wheel repeats every half turn, so the loop has no jump). The record: "great, clumsy, solid wooden wheels" and rawhide (Smithwick), "the unhewn sticks which squeak in the holes of the plank wheels" (Woodman's guide, 1835) - HIST-TEX-443. ${STYLE}`,
  draw: () => groupFrame(`carreta-loaded-travel-${h}-${i + 1}`, { cell: CARRETA, originX: h === 'e' ? 250 : CARRETA.w / 2, groundY: CARRETA.h - 30, logical: (h === 'e' ? 100 : VERTICAL.carreta[h]) * UNIT, res: RES, note: `the carreta laden, ${h}, frame ${i + 1} of 4` },
    ink => drawCarreta(ink, h, { frame: i, loaded: true })) })));

// ------------------------------------------------------------------------------------------------------------ D14 the wagon and its ox
// The whole rig at the wagon's scale: the cover's top is 164 units, which is 1.55 of a person (the size the game draws
// `wagon-covered`), and the ox is drawn at 1.3 of the rig's own ox so that its horns stand at the 1.45 of a person the game draws
// `ox-walk` at. Side-on the anchor is the ground under the middle of the wagon's bed; end-on it is the ground under the nearest
// end (the ox's forefeet going south, the tail of the wagon going north).
const RIG = { w: 1660, h: 620 }, RIG_V = { w: 480, h: 900 }, OX = 1.3, OX_AT = 226;
const COVERS = { on: 'its canvas cover on its bows, puckered at both ends', loaded: 'its bows bare over a load of sacks, a barrel and a rolled blanket', empty: 'its bows bare over an empty bed' };
function wagonRig(name, h, i, cover) {
  const vertical = h !== 'e';
  const cell = vertical ? RIG_V : RIG;
  return groupFrame(name, { cell, originX: vertical ? cell.w / 2 : 520, groundY: cell.h - 30, logical: 164 * UNIT, res: RES, note: `the wagon and its ox, ${h}, ${cover}, frame ${i + 1} of 4` }, ink => {
    const ox = quadPose('ox', { gait: 'walk', frame: i });
    if (h === 'e') {
      // The tongue runs from the front axle forward under the ox to the ring of its yoke; the ox over it.
      const ringLocal = [44 * 0.95 * OX, 66 * 0.95 * OX];
      drawWagon(ink, 'e', { frame: i, cover, tongueTo: [OX_AT + ringLocal[0] - 10, 0, ringLocal[1] - 6] });
      placed(ink, OX_AT, 0, sub => drawQuadSide(sub, 'ox', ox, { coat: COATS.ox, yoke: true }), { scale: OX });
      return;
    }
    // End-on the wagon is long and short: the ox ahead of it is nearer the camera going south (drawn last, lower) and beyond it
    // going north (drawn first, higher).
    const tongueTo = [OX_AT - 20, 0, 40];
    const P = projector(h, { depth: 0.22, near: h === 's' ? OX_AT + 10 : -134 });
    const oxAt = P([OX_AT, 0, 0]);
    const drawOx = () => placed(ink, oxAt[0], oxAt[1], sub => drawQuadFrontal(sub, 'ox', h, { frame: i, coat: COATS.ox, yoke: true }), { scale: OX });
    if (h === 'n') drawOx();
    drawWagon(ink, h, { frame: i, cover, tongueTo, near: h === 's' ? OX_AT + 10 : -134 });
    if (h === 's') drawOx();
  });
}
const wagonSets = [];
for (const cover of ['on', 'loaded', 'empty']) for (const h of DIRS) {
  const tag = `${cover === 'on' ? '' : cover + '-'}${h}`;
  wagonSets.push({ tag, h, cover, frames: [0, 1, 2, 3].map(i => ({ name: `wagon-ox-${tag}-${i + 1}`, height: 1.55, compare: [['wagon-covered', 1.55], [h === 'e' ? 'ox-walk-1' : `ox-walk-${h}-1`, 1.45]],
    prompt: `The family's farm wagon of the 1830s, ${COVERS[cover]}, with one brown ox yoked to its tongue as one rolling rig, going ${HEADINGS[h]}, frame ${i + 1} of 4: the ox's plodding four-beat walk, the wagon's four iron-tyred spoked wheels (the hind pair bigger) turning with it. One ox in a single neck yoke with the tongue to the ring under its neck is the game's hitch (one ox a wagon), an interpretation: oxen were usually worked in pairs. ${STYLE}`,
    draw: () => wagonRig(`wagon-ox-${tag}-${i + 1}`, h, i, cover) })) });
}

const loop = (frames, ms, direction, prompt) => ({ frames: frames.map(f => ({ sprite: f.name, duration: ms })), loop: true, motion: 'none', direction, prompt });
const dirWord = h => h === 'e' ? 'east; west by mirroring' : h === 's' ? 'south' : 'north';
export const SHEETS = {
  'claude-cart': { cell: half(CART), columns: 5, request: 'Request 2026-09-25 — riders, walkers and the cart', replaceWith: 'item 1: the cart without its ox, travelling east, north and south with the wheels turning, and standing, loaded and empty, at the scale of cart-open',
    frames: cartSets.flatMap(set => [...set.travel, set.idle]) },
  'claude-carreta-loaded': { cell: half(CARRETA), columns: 4, request: 'Request 2026-09-25 — the carreta', replaceWith: 'a loaded carreta travelling east, south and north, 4 frames each, at the delivered carreta scale',
    frames: carretaLoaded.flat() },
  'claude-wagon-ox': { cell: half(RIG), columns: 4, request: 'Request 2026-09-16 — driving the ox wagon', replaceWith: 'item 1: the covered wagon with one ox yoked to its tongue as one rolling rig, east, 4 frames, covered, loaded and empty',
    frames: wagonSets.filter(set => set.h === 'e').flatMap(set => set.frames) },
  'claude-wagon-ox-ns': { cell: half(RIG_V), columns: 8, request: 'Request 2026-09-16 — driving the ox wagon', replaceWith: 'item 1: the wagon and its ox coming toward the camera and going away, 4 frames each, covered, loaded and empty',
    frames: wagonSets.filter(set => set.h !== 'e').flatMap(set => set.frames) },
};
export const CLIPS = Object.fromEntries([
  ...cartSets.map(set => [`cart-travel-${set.tag}`, loop(set.travel, 240, dirWord(set.h), `The cart rolling ${set.h}${set.loaded ? ', loaded' : ''}: a four-frame loop, the wheels turning.`)]),
  ...cartSets.map(set => [`cart-idle-${set.tag}`, { frames: [{ sprite: set.idle.name, duration: 2000 }], loop: true, motion: 'none', direction: dirWord(set.h), prompt: `The family's cart standing still without its ox${set.loaded ? ', loaded' : ', empty'}, facing ${set.h}: one held frame.` }]),
  ...DIRS.map((h, k) => [`carreta-loaded-travel-${h}`, loop(carretaLoaded[k], 245, dirWord(h), `The carreta laden and rolling ${h}: a four-frame loop at the delivered carreta's 245 ms.`)]),
  ...wagonSets.map(set => [`wagon-ox-${set.tag}`, loop(set.frames, 260, dirWord(set.h), `The wagon and its ox going ${set.h} (${set.cover === 'on' ? 'covered' : set.cover}): a four-frame loop, the ox's plod and the wheels turning together.`)]),
]);
