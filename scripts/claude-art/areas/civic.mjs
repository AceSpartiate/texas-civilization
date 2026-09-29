// Béxar's civic buildings and the missions round it, drawn by Claude as temporary stand-ins (owner, 2026-09-28: "make all of
// the remaining art. yours will be temporary. label yours so astra can replace as it makes the final versions"):
//   - E6  `bexar-san-fernando-1836`, `bexar-governors-palace-1836` (request 2026-09-14, Béxar civic architecture)
//   - E14 `san-fernando-tower-1836`, San Fernando's tower as the red flag's setting (request 2026-09-25, the Alamo, item 5)
//   - E11 `mission-concepcion`, seen from about 500 yards (request 2026-09-25, Concepción and the Grass Fight, item 4)
//
// Drawn procedurally in the view of her building sheets (scripts/claude-art/kit/oblique.mjs): the front square to the camera,
// the top and the right-hand end seen a little, thin olive-brown outline, flat facets lit from the upper left, her warm
// masonry colours. Every frame's prompt says what is documented, what is inferred and what is not known, and names sources.
//
// **The research (2026-09-28).** San Fernando before 1868: HABS TX-34 (Library of Congress, the survey's data pages,
// tile.loc.gov/.../tx0012data.pdf); TSHA *San Fernando Cathedral*; the Portal to Texas History's photograph metapth459982;
// docs/LOCATION_ART_GUIDE.md (the Gothic front is 1868-73: rejected). The Governor's Palace: TSHA *Spanish Governor's Palace*
// and the City of San Antonio's archaeology report (sanantonio.gov, Spanish_Governors_Palace_Archeology_Report.pdf); the 1930
// Harvey P. Smith restoration's inventions (its U-plan, garden, fountain and carved doors: rejected). Concepción: TSHA
// *Nuestra Señora de la Purísima Concepción de Acuña Mission*; NPS *Mission Concepción*; UTSA Center for Archaeological
// Research; docs/battle-research/staging.md §1.9 (the lookouts in the cupola, HIST-TEX-480).

import { LINE, tone } from '../kit/style.mjs';
import { MATERIAL, buildingFrame, rand } from '../kit/oblique.mjs';

export const AREA = 'places';
export const DATE = '2026-09-28';

// San Fernando's old stucco: grey, weathered (HABS: the stone "gray old" until it was whitewashed in 1859).
const STUCCO = '#c9bb9e', STUCCO_ROOF = '#d3c5a6', LIMESTONE = '#cfb993', PALACE = '#e0c9a0', BRONZE = '#9a6a2c';
const octagon = (cx, cz, r) => Array.from({ length: 8 }, (_, i) => { const t = Math.PI / 8 + (i * Math.PI) / 4; return [cx + Math.cos(t) * r, cz + Math.sin(t) * r]; });
const square = (x0, x1, z0, z1) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];

/** A frame: an Ink and an Oblique with world (0, 0, 0) at `origin`, and the frame record with its anchor there. */
const building = buildingFrame;

/**
 * San Fernando's one tower, on the south-east corner of the roof (HABS: octagonal, round-arched openings, an octagonal
 * pyramid roof with a small lantern, "like a cupola" on the roof), standing on a square pedestal at the corner. `base` is the
 * roof's height; the corner is at (x1, z0). Returns the lantern's top, where the red flag's pole stands.
 */
function sanFernandoTower(o, x1, z0, base, seed) {
  const cx = x1 - 4.6, cz = z0 + 4.6;
  o.box({ x0: x1 - 9.2, x1, z0, z1: z0 + 9.2, y0: base - 0.5, y1: base + 4 }, STUCCO);
  o.prism(octagon(cx, cz, 4.6), base + 4, base + 17, STUCCO);
  // The belfry's round-headed openings on the faces the camera sees, a bell hanging in the front one.
  const oct = octagon(cx, cz, 4.6);
  for (let i = 0; i < 8; i++) {
    const a = oct[i], b = oct[(i + 1) % 8], nz = -(b[0] - a[0]), nx = b[1] - a[1];
    const out = nx * ((a[0] + b[0]) / 2 - cx) + nz * ((a[1] + b[1]) / 2 - cz) > 0 ? [nx, 0, nz] : [-nx, 0, -nz];
    if (!o.sees(out) || out[0] * 0.34 - out[2] < 0.9) continue;
    o.faceArch(a, b, 0.5, base + 7.5, 2.3, base + 13);
    if (Math.abs(out[0]) < 1 && out[2] < 0) {
      const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      const bell = [[m[0] - 0.8, base + 9.3, m[1] + 0.2], [m[0] + 0.8, base + 9.3, m[1] + 0.2], [m[0] + 0.6, base + 11.2, m[1] + 0.2], [m[0], base + 11.9, m[1] + 0.2], [m[0] - 0.6, base + 11.2, m[1] + 0.2]];
      o.face(bell, BRONZE, { outline: LINE.fine + 0.4 });
    }
  }
  o.prism(octagon(cx, cz, 5.3), base + 17, base + 18.2, tone(STUCCO, 0.06));
  o.pyramid(octagon(cx, cz, 5.3), base + 18.2, base + 25, '#b9a888');
  o.cylinder(cx, cz, 1.1, base + 24.2, base + 26.8, STUCCO);
  o.dome(cx, cz, 1.3, base + 26.8, 1.3, '#b9a888', { ribs: 0 });
  void seed;
  return o.at(cx, base + 28.1, cz);
}

/** A buttress against a south wall (z = 0) at x: a deep lower stage, one set-back, sloped weatherings on both (HABS). */
function buttress(o, x, colour) {
  o.box({ x0: x - 2.4, x1: x + 2.4, z0: -4.5, z1: 0, y1: 14 }, colour, { top: false });
  o.face([[x - 2.4, 14, -4.5], [x + 2.4, 14, -4.5], [x + 2.4, 16, -2.5], [x - 2.4, 16, -2.5]], tone(colour, 0.12));
  o.box({ x0: x - 2, x1: x + 2, z0: -2.5, z1: 0, y0: 14, y1: 24 }, colour, { top: false, front: true });
  o.face([[x - 2, 24, -2.5], [x + 2, 24, -2.5], [x + 2, 26.5, 0], [x - 2, 26.5, 0]], tone(colour, 0.12));
  o.line([[x - 2.4, 0.2, -4.5], [x + 2.4, 0.2, -4.5]], { width: LINE.inner + 2, colour: tone(colour, -0.35), opacity: 0.35 });
}

/** The flat-roofed church itself: nave, buttresses, the polygonal south transept and apse, the low dome over the crossing. */
function sanFernando(o) {
  const X0 = -30, X1 = 30, Z1 = 28, WALL = 30, TOP = 32.5;
  // The polygonal apse at the west end, behind and to the left.
  o.prism([[X0, 4], [X0 - 6, 7], [X0 - 9, 14], [X0 - 6, 21], [X0, 24]], 0, 28, STUCCO, { top: true });
  // The nave: its south side to the camera, its front (the east end) the right-hand end, the roof flat behind a parapet.
  o.box({ x0: X0, x1: X1, z0: 0, z1: Z1, y1: TOP }, STUCCO);
  o.face([[X0 + 0.8, TOP, 0.8], [X1 - 0.8, TOP, 0.8], [X1 - 0.8, TOP, Z1 - 0.8], [X0 + 0.8, TOP, Z1 - 0.8]], STUCCO_ROOF, { outline: LINE.fine + 0.4 });
  for (let x = X0 + 8; x < X1 - 4; x += 8) o.line([[x, TOP, 1.5], [x, TOP, Z1 - 1.5]], { width: LINE.fine, colour: tone(STUCCO_ROOF, -0.25), opacity: 0.6 });
  o.line([[X0, WALL, 0], [X1, WALL, 0]], { width: LINE.fine + 0.3, colour: tone(STUCCO, -0.4), opacity: 0.7 });
  o.wear(X0 + 2, X1 - 2, 3, WALL - 2, 0, STUCCO, { seed: 7, count: 9 });
  // High round-headed windows between the buttresses (their number and place are not recorded: a reading).
  for (const x of [-9, 2, 17.5]) o.arch(x, 19, 2.6, 23.5, 0, MATERIAL.opening, { frame: 0.5 });
  // The east front, the right-hand end: one round-arched door under a heavy moulded entablature (HABS), a small window over it.
  o.sideArch(X1, Z1 / 2, 0, 7, 10.5, MATERIAL.opening);
  o.sideArch(X1, Z1 / 2, 0.2, 6, 10.3, MATERIAL.door);
  o.face([[X1, 15, Z1 / 2 - 6], [X1, 15, Z1 / 2 + 6], [X1, 17.2, Z1 / 2 + 6.6], [X1, 17.2, Z1 / 2 - 6.6]], tone(STUCCO, -0.08), { outline: LINE.fine + 0.6 });
  o.sideArch(X1, Z1 / 2, 20.5, 2.4, 23.5, MATERIAL.opening, { outline: LINE.fine + 0.6 });
  // Three buttresses on the south side, each with one set-back (HABS).
  for (const x of [-6, 10, 25]) buttress(o, x, STUCCO);
  // The south transept, polygonal, at the crossing; a window in its front.
  const transept = [[-27, 0], [-27, -5], [-24, -9], [-15, -9], [-12, -5], [-12, 0]];
  o.prism(transept, 0, 27, STUCCO);
  o.faceArch([-24, -9], [-15, -9], 0.5, 15, 2.6, 19.5, MATERIAL.opening);
  o.wear(-23, -16, 2, 12, -9, STUCCO, { seed: 3, count: 3 });
  // The low dome with its small lantern over the crossing (HABS), on a short octagonal drum.
  const cx = -19.5, cz = Z1 / 2 - 2;
  o.prism(octagon(cx, cz, 9.5), TOP - 0.5, TOP + 4.5, STUCCO);
  o.dome(cx, cz, 9.6, TOP + 4.5, 8, '#bfae8e');
  o.cylinder(cx, cz, 1.8, TOP + 12, TOP + 16, STUCCO);
  o.dome(cx, cz, 2.1, TOP + 16, 1.8, '#b9a888', { ribs: 0 });
  // The tower on the south-east corner.
  return sanFernandoTower(o, X1, 0, TOP, 11);
}

function governorsPalace(o) {
  const X0 = -32, X1 = 32, Z1 = 30, WALL = 13.5, TOP = 15.5;
  o.box({ x0: X0, x1: X1, z0: 0, z1: Z1, y1: TOP }, PALACE);
  // The flat roof behind its parapet: the parapet's inner face and the roof a step down.
  o.face([[X0 + 1, TOP, 1], [X1 - 1, TOP, 1], [X1 - 1, TOP, Z1 - 1], [X0 + 1, TOP, Z1 - 1]], '#cdb68d', { outline: LINE.fine + 0.4 });
  o.line([[X0, WALL, 0], [X1, WALL, 0]], { width: LINE.fine + 0.3, colour: tone(PALACE, -0.4), opacity: 0.6 });
  o.wear(X0 + 2, X1 - 2, 2, WALL - 1, 0, PALACE, { seed: 21, count: 11 });
  // Small deep-set windows with wooden bars (their number is not recorded; the front's present windows are later).
  for (const x of [-25, -15, 13, 23]) o.rect(x, 5.2, 3, 4.2, 0, MATERIAL.opening, { bars: 2, sill: 0.6, lintel: 0.5 });
  // The one great door, its stone surround and the carved keystone over it (the keystone's date and arms, "1749", are
  // carved, not drawn: no text in the art).
  o.face([[-5.2, 0, 0], [5.2, 0, 0], [5.2, 11.2, 0], [0, 12.4, 0], [-5.2, 11.2, 0]], tone(LIMESTONE, 0.06), { outline: LINE.inner });
  o.face([[-3.8, 0, 0], [3.8, 0, 0], [3.8, 9.6, 0], [0, 10.5, 0], [-3.8, 9.6, 0]], MATERIAL.door, { outline: LINE.inner });
  o.line([[0, 0.3, 0], [0, 10.2, 0]], { width: LINE.fine + 0.3, colour: MATERIAL.doorDark });
  for (const y of [3, 6.5]) for (const x of [-2.4, 2.4]) o.face([[x - 0.9, y, 0], [x + 0.9, y, 0], [x + 0.9, y + 2.2, 0], [x - 0.9, y + 2.2, 0]], tone(MATERIAL.door, -0.12), { outline: LINE.fine });
  o.face([[-1.1, 10.2, 0], [1.1, 10.2, 0], [1.4, 13, 0], [-1.4, 13, 0]], tone(LIMESTONE, 0.1), { outline: LINE.fine + 0.6 });
  // Wooden spouts (canales) through the parapet, to throw the flat roof's rain clear of the wall.
  for (const x of [-28, -9, 8, 28]) o.box({ x0: x - 0.5, x1: x + 0.5, z0: -2.8, z1: 0, y0: WALL - 0.2, y1: WALL + 0.8 }, MATERIAL.timber);
  // A worn stone bench along the front (a reading: many Béxar fronts had one).
  o.box({ x0: 8, x1: 18, z0: -1.4, z1: 0, y1: 1.4 }, tone(LIMESTONE, -0.05));
}

/** Mission Concepción's church, its west front to the camera (towers flanking, the dome behind), the convento to the south. */
function concepcion(o) {
  // ceiling: the nave drawn about 60 ft long where it is about 89 inside, so that from the front it does not run off the
  // frame to the upper right; the transepts, hidden from the front at this distance, are not drawn.
  const NAVE = [-15, 15], LEN = 62, WALL = 30;
  // The nave behind the front, and the dome over the crossing on its drum.
  o.box({ x0: NAVE[0], x1: NAVE[1], z0: 8, z1: LEN, y1: WALL + 1 }, LIMESTONE);
  const cz = 46;
  o.cylinder(0, cz, 10.5, WALL, WALL + 7, LIMESTONE);
  for (let i = 0; i < 4; i++) o.arch(-6 + i * 4, WALL + 2, 1.4, WALL + 4.6, cz - 10.4, MATERIAL.opening, { outline: LINE.fine });
  o.dome(0, cz, 10.8, WALL + 7, 9, '#c4ad85');
  o.cylinder(0, cz, 2.1, WALL + 15.5, WALL + 20, LIMESTONE);
  o.dome(0, cz, 2.4, WALL + 20, 2, '#b9a47c', { ribs: 0 });
  // The convento, a one-storey range with an arcade, joined on the south; its far end broken (the mission a barn since 1794).
  o.box({ x0: 27, x1: 64, z0: 6, z1: 30, y1: 14 }, tone(LIMESTONE, -0.04));
  for (let i = 0; i < 7; i++) o.arch(30.5 + i * 5, 0, 3.2, 7.5, 6, MATERIAL.opening, { outline: LINE.fine + 0.6 });
  o.box({ x0: 64, x1: 71, z0: 6, z1: 26, y1: 8 }, tone(LIMESTONE, -0.08), { top: true });
  o.face([[64, 14, 6], [66, 11, 6], [68, 12.5, 6], [71, 8, 6], [64, 8, 6]], tone(LIMESTONE, -0.04), { outline: LINE.fine + 0.6 });
  // The two towers and the front between them.
  const tower = (x0, x1) => {
    o.box({ x0, x1, z0: 0, z1: 12, y1: 44 }, LIMESTONE);
    o.box({ x0: x0 + 0.8, x1: x1 - 0.8, z0: 0.8, z1: 11.2, y0: 44, y1: 53 }, LIMESTONE);
    o.arch((x0 + x1) / 2, 45.5, 3.6, 50.2, 0.8, MATERIAL.opening, { outline: LINE.fine + 0.6 });
    o.box({ x0: x0 - 0.4, x1: x1 + 0.4, z0: -0.4, z1: 12.4, y0: 53, y1: 54.4 }, tone(LIMESTONE, 0.06));
    o.pyramid(square(x0 + 0.6, x1 - 0.6, 0.6, 11.4), 54.4, 60, '#bba27a');
    o.cylinder((x0 + x1) / 2, 6, 0.7, 59.4, 61.6, LIMESTONE);
    // The red and ochre of the painted plaster, faded to traces round the tower windows (NPS).
    for (let k = 0; k < 3; k++) { const c = o.at(x0 + 2 + rand(k + x0) * (x1 - x0 - 4), 30 + rand(k * 3 + x0) * 10, 0); o.ink.dot(`M ${c[0] - 6} ${c[1]} l 12 -3 l 2 5 l -12 2 Z`, k % 2 ? '#b46a3a' : '#c99a4a', 0.45); }
  };
  tower(15, 27);
  o.box({ x0: -15, x1: 15, z0: 0, z1: 8, y1: 34 }, LIMESTONE, { end: false });
  // The front's gable, stepped to a point over the choir window.
  o.face([[-15, 34, 0], [15, 34, 0], [6, 40, 0], [0, 42.5, 0], [-6, 40, 0]], LIMESTONE);
  o.wear(-13, 13, 2, 32, 0, LIMESTONE, { seed: 31, count: 7 });
  // The carved portal: a round-headed door in a stone frame with a triangular pediment; the choir window over it.
  o.face([[-6, 0, 0], [6, 0, 0], [6, 15.5, 0], [-6, 15.5, 0]], tone(LIMESTONE, 0.1), { outline: LINE.inner });
  o.face([[-7, 15.5, 0], [7, 15.5, 0], [0, 20, 0]], tone(LIMESTONE, 0.1), { outline: LINE.inner });
  o.arch(0, 0, 6, 10.5, 0, MATERIAL.door, { outline: LINE.inner });
  o.arch(0, 24, 3, 28, 0, MATERIAL.opening, { frame: 0.6 });
  tower(-27, -15);
}

// ---------------------------------------------------------------------------------------------------------------- frames
// Scale. The Béxar reconstruction (public/bexar-layout.js) draws a building `heightFeet * pixelsPerFoot` tall at its frame's
// logical height: the generic houses are 57-69 there, about five of the town's feet a real foot, and the `chapel` stand-in
// 105. These are drawn at 7 source pixels a real foot, and their logical height is set so that a real foot is 3.6 of the
// town's feet for the church and 4 for the palace: the palace stands about as tall as a house, as a one-storey block does, and the
// church - the tallest thing in the town - about twice the chapel, with its nave shortened (ceiling: the church's length is
// not recorded, and the true length at this scale would cover both plazas' ends; drawn about 60 ft of nave).
const PX = 7;
const SF_UNITS = 3.6, PALACE_UNITS = 4;
function sanFernandoFrame() {
  const w = 720, h = 560, origin = [330, 505];
  return building('bexar-san-fernando-1836', { w, h, origin, anchor: [0, -9.5], px: PX, logicalHeight: Math.round((105 * PX) / SF_UNITS),
    note: 'San Fernando church at Béxar as it stood in 1836, from the south: nave, buttresses, the polygonal south transept and apse, the low dome over the crossing and the one octagonal tower on the south-east corner; the east front, with its door, is the right-hand end' }, o => sanFernando(o));
}
function palaceFrame() {
  const w = 560, h = 230, origin = [262, 200];
  return building('bexar-governors-palace-1836', { w, h, origin, anchor: [0, -1.4], px: PX, logicalHeight: Math.round((80 * PX) / PALACE_UNITS),
    note: 'the Governor\'s Palace (the comandancia) on Military Plaza as it stood in 1836: a long one-storey plastered stone block, flat roof behind a parapet, spouts, small barred windows, one great door under a keystone' }, o => governorsPalace(o));
}
/**
 * E14: the corner of the church that carries the tower - the church's own south-east corner, drawn in the church's own
 * coordinates at its scale, so it lies exactly over `bexar-san-fernando-1836`'s tower. The battle view (public/battle-view.js
 * `drawFlag`) lays it on the church the map draws and stands the red flag's pole on its lantern; `TOWER_ON_CHURCH` gives the
 * numbers it reads (printed by `node -e` on this module; see drawFlag's comment).
 */
export const TOWER_FRAME = Object.freeze({ w: 240, h: 480, px: 7, origin: [-54, 450] });
const TOWER_ANCHOR = [21, -4.5];
function towerFrame() {
  const { w, h, px, origin } = TOWER_FRAME;
  let top;
  const frame = building('san-fernando-tower-1836', { w, h, origin, anchor: TOWER_ANCHOR, px, logicalHeight: h,
    note: 'the south-east corner of San Fernando church in 1836 with its octagonal tower on the roof, the setting of the red flag of no quarter; the pole stands on the lantern' }, o => {
    const X0 = 12, X1 = 30, TOP = 32.5;
    o.box({ x0: X0, x1: X1, z0: 0, z1: 10, y1: TOP }, STUCCO);
    o.face([[X0 + 0.8, TOP, 0.8], [X1 - 0.8, TOP, 0.8], [X1 - 0.8, TOP, 9.2], [X0 + 0.8, TOP, 9.2]], STUCCO_ROOF, { outline: LINE.fine + 0.4 });
    o.line([[X0, 30, 0], [X1, 30, 0]], { width: LINE.fine + 0.3, colour: tone(STUCCO, -0.4), opacity: 0.7 });
    o.wear(X0 + 1, X1 - 1, 3, 28, 0, STUCCO, { seed: 5, count: 4 });
    o.arch(17.5, 19, 2.6, 23.5, 0, MATERIAL.opening, { frame: 0.5 });
    buttress(o, 25, STUCCO);
    top = sanFernandoTower(o, X1, 0, TOP, 3);
  });
  // Where the pole stands, as shares of the drawn height from the anchor: across (right +) and up.
  frame.flagFoot = [+(((top[0] - frame.anchorX * w) / h).toFixed(4)), +(((frame.anchorY * h - top[1]) / h).toFixed(4))];
  return frame;
}
/**
 * Where the tower frame lies on the church frame: its anchor from the church's, in the church's source pixels (right, up),
 * and both logical heights - so the page can lay one on the other at the town's scale.
 */
export function towerOnChurch() {
  const church = sanFernandoFrame(), tower = towerFrame();
  const at = (x, z) => [(x + z * 0.34) * PX, (z * 0.3) * PX];
  const a = at(0, -9.5), b = at(TOWER_ANCHOR[0], TOWER_ANCHOR[1]);
  return { offset: [+(b[0] - a[0]).toFixed(1), +(b[1] - a[1]).toFixed(1)], churchLogical: church.logicalHeight, towerLogical: tower.logicalHeight, flagFoot: tower.flagFoot };
}
function concepcionFrame() {
  const w = 600, h = 440, origin = [160, 410];
  return building('mission-concepcion', { w, h, origin, px: 5, logicalHeight: h,
    note: 'Mission Concepción as it stood in 1835, seen from far off: the west front between its two towers, the dome with its lantern over the crossing behind, the convento\'s arcade to the south, its far end broken' }, o => concepcion(o));
}

const SOURCES_SF = 'HABS TX-34 (Library of Congress); TSHA San Fernando Cathedral; Portal to Texas History metapth459982; docs/LOCATION_ART_GUIDE.md';
// `height` and `compare` (scripts/claude-art/compare.mjs) give each frame and her frames beside it their heights in the ratio
// the game draws them - Béxar's `heightFeet` (the chapel 105, a house 63, the palace 80), the battle's figure heights (the
// tower 4.6 figures, the pole 1.3; Concepción 5, the old church-generic 4.5) - scaled down together so a building stays in
// its row; they are ratios, not persons.
export const SHEETS = {
  'claude-bexar-civic': { cell: { w: 720, h: 560 }, columns: 1, request: 'Request 2026-09-14 — Béxar civic architecture',
    replaceWith: 'a researched 1836 façade in the frontier-v1 style, matched to chapel/adobe-flat scale and ground anchors',
    frames: [
      { name: 'bexar-san-fernando-1836', draw: sanFernandoFrame, height: 0.5, compare: [['chapel', 0.5], ['adobe-flat', 0.3], ['trading-house', 0.39]],
        prompt: `San Fernando church at Béxar as it stood in 1836, before the Gothic Revival front of 1868-73 (rejected). Seen from the south in the game's north-up three-quarter view, so its long south side faces the camera and its front - which faced east onto the Plaza de las Islas (Main Plaza), the apse and dome backing onto the Plaza de Armas (Military Plaza) - is the right-hand end. DOCUMENTED (HABS TX-34): a Latin-cross church of stuccoed rubble limestone, the roof vaults hidden by a plain parapet so the roof reads flat; three buttresses on each side, each with one set-back; polygonal transepts and apse; a low dome with a small lantern over the crossing; one tower only, octagonal, on the south-east corner, standing on the roof like a cupola, with round-arched openings and an octagonal pyramid roof with a small lantern; the east front a plain rectangle with a single round-arched door under a heavy moulded entablature. The stucco drawn grey and weathered (the stone "gray old" until whitewashed in 1859). UNCERTAIN, and drawn as a reading: the church's dimensions and proportions (none were found: the nave is drawn short so it fits between the plazas), the number and place of the side windows, the small window over the door, whether the lantern and belfry cap were whole in 1836, and the state of the roof (in 1840 it was "half gone"; drawn whole). A bell drawn in the front opening of the tower. Warm hand-drawn storybook style, thin dark olive-brown outline, flat facets lit from the upper left, transparent ground, no shadow, no text. Sources: ${SOURCES_SF}.` },
    ] },
  'claude-bexar-palace': { cell: { w: 560, h: 230 }, columns: 1, request: 'Request 2026-09-14 — Béxar civic architecture',
    replaceWith: 'a researched 1836 façade in the frontier-v1 style, matched to chapel/adobe-flat scale and ground anchors',
    frames: [
      { name: 'bexar-governors-palace-1836', draw: palaceFrame, height: 0.38, compare: [['adobe-flat', 0.3], ['adobe-tile', 0.3], ['chapel', 0.5]],
        prompt: `The Governor's Palace - the comandancia on the west side of the Plaza de Armas (Military Plaza), not the Casas Reales on Main Plaza - as it stood in 1836. DOCUMENTED (TSHA; the City of San Antonio's archaeology report): a long one-storey building of plastered rubble stone with walls about three feet thick, a flat roof behind a parapet with spouts (canales), walnut lintels, and a keystone carved with the date 1749 and royal arms over the door; the original a simple rectangle two rooms deep. Its front faced east onto the plaza; drawn, as every building in the library is, with the front to the camera. REJECTED as later: Harvey P. Smith's 1930 restoration (the U-plan, the walled garden and fountain, added rooms and doorway, the carved doors), and the mid- to late-1800s tin roof, shop fronts and new windows. UNCERTAIN: the number and place of the front's windows (drawn four small barred ones), the length (drawn about 64 ft), the bench, and its use in 1836 (probably still a Pérez family house). The keystone's date and arms are not drawn (no text); TSHA calls the arms Habsburg and other accounts Ferdinand VI's, and they disagree. Warm limewash worn to the stone in patches, thin dark olive-brown outline, flat facets lit from the upper left, transparent ground, no shadow.` },
    ] },
  'claude-alamo-tower': { cell: { w: TOWER_FRAME.w, h: TOWER_FRAME.h }, columns: 1, request: 'Request 2026-09-25 — the Alamo: ladders, the guns served, the walls manned, night',
    replaceWith: 'item 5: San Fernando\'s tower as the red flag\'s setting, placed under the flag',
    frames: [
      { name: 'san-fernando-tower-1836', draw: towerFrame, height: 1.53, compare: [['volunteer-march-s-1', 0.33], ['flag-red-still', 0.43]],
        prompt: `The south-east corner of San Fernando church at Béxar in February 1836 with its one tower, drawn as a piece of the church (registered to bexar-san-fernando-1836, laid over it by the battle view) as the setting of the red flag of no quarter that Santa Anna raised on the church tower (HIST-TEX-054, -504; battlefields.org, The Siege of the Alamo). The same tower as bexar-san-fernando-1836 (HABS TX-34): octagonal, standing on the roof at the corner on a square pedestal, round-arched openings with a bell in the front one, an octagonal pyramid roof and a small lantern, on which the flag's pole stands; below it a short stretch of the stuccoed south wall with one buttress and the parapet. UNCERTAIN: the tower's height and proportions (not recorded; drawn about 28 ft over the roof), the bell, and the state of the lantern in 1836. The church stood on the west side of the Plaza de las Islas, its front to it. Warm hand-drawn storybook style, grey weathered stucco, thin dark olive-brown outline, flat facets lit from the upper left, transparent ground, no shadow, no text.` },
    ] },
  'claude-mission-concepcion': { cell: { w: 600, h: 440 }, columns: 1, request: 'Request 2026-09-25 — Concepción and the Grass Fight',
    replaceWith: 'item 4: the church with its twin towers and dome, seen from about 500 yards',
    frames: [
      { name: 'mission-concepcion', draw: concepcionFrame, height: 1.67, compare: [['church-generic', 1.5], ['volunteer-march-s-1', 0.33]],
        prompt: 'Mission Nuestra Señora de la Purísima Concepción de Acuña, two miles below Béxar, as it stood on October 28, 1835, drawn small as it is seen from about 500 yards - the Texians\' lookouts were in its tower (HIST-TEX-480). DOCUMENTED (TSHA; NPS; UTSA): a cross-plan stone church about 89 x 22 ft inside with walls nearly four feet thick; its front faces west, with two square bell towers flanking it and a carved stone portal; a dome with a lantern on a drum over the crossing (the oldest unrestored masonry dome in the United States); the front once painted in bright geometric patterns, faded to bare limestone with red and ochre traces round the tower windows; a row of stone rooms (the granary) and the friars\' convento joined on the south; secularized in 1794 and used by settlers as a barn, with bats in it in 1846. Drawn with the west front to the camera, the dome behind it, the convento\'s arcade to the south (the right) and its far end broken. PROBABLE: the towers\' pyramid caps are what stood in 1835, the church being unrestored. UNCERTAIN: how much of the paint showed in 1835 (drawn as faint traces), the convento\'s form and how much of it and the compound wall stood (drawn a short arcade, broken at its end, and no wall), the cap finials. REJECTED: the 1861 repairs and the bell added later. Tan-grey limestone and tufa, thin dark olive-brown outline, flat facets lit from the upper left, transparent ground, no shadow.' },
    ] },
};
