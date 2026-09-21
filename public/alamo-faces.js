/**
 * Which painted surface each part of the Alamo compound wears, seen from the south.
 *
 * Astra delivered five straight-on elevations on 2026-09-21 (`alamo-face-strips`,
 * docs/ART_DELIVERY_2026-09-21-ALAMO-FACE-STRIPS.md), replacing the one wall module cut and repeated over every surface of
 * the compound. This file is only the choice - which strip goes on what - and imports nothing, so a test can ask it the
 * same questions the renderer asks and get the same answers (tests/alamo-faces.test.mjs). public/bexar-art.js lays the
 * answer on the face; public/alamo-layout.js says where the faces are.
 *
 * Nothing here is world state. A footprint, a height, an opening, a wall's condition and the destructible north wall are
 * all `public/alamo-layout.js` and the simulation's, and none of them is read or changed by choosing a picture.
 */
export const ALAMO_FACES = Object.freeze({
  // A seamless plain limestone face: the outer walls and the pens' walls.
  limestone: 'alamo-face-limestone',
  // A one-storey room range: patched plaster, a plank door, a barred window and beam ends.
  rooms: 'alamo-face-rooms',
  // The two-storey convento end: a lower door, an upper window, the floor line between.
  convento: 'alamo-face-convento',
  // The roofless church's unfinished south wall, rough at the top.
  church: 'alamo-face-church-south',
  // The gate passage under its timber lintel, laid over the opening the layout gives.
  gate: 'alamo-face-gate',
  // Not of this delivery: the timber palisade keeps the stakes it has had since `alamo-modules`.
  palisade: 'alamo-palisade',
});
/** A roofed range of this height or more is drawn as two storeys - the rule the beam-end rows in bexar-art already read. */
export const STOREYS = 16;
/** A roofed range's south front (public/alamo-layout.js `alamoMassing` blocks). In this plan only the long barrack is two storeys. */
export const blockFace = block => (block.height >= STOREYS ? ALAMO_FACES.convento : ALAMO_FACES.rooms);
/** A run of wall with no roof: the palisade's stakes, the roofless church's own shell, or plain limestone. */
export const wallFace = wall => (wall.material === 'timber' ? ALAMO_FACES.palisade : wall.kind === 'church' ? ALAMO_FACES.church : ALAMO_FACES.limestone);
/** An opening through a range: the south gate, which is the one opening the massing carries. */
export const openingFace = () => ALAMO_FACES.gate;
