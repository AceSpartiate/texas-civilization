// The hunter's painted field and rifle (request 2026-10-02 "the hunter's first-person field", painted with the local pipeline
// 2026-10-26, docs/ART_DELIVERY_2026-10-26-LOCAL-HUNT.md): which painting a sighting is shown in, and where the rifle's muzzle and
// butt are in its frame. Kept apart from public/hunt-aim.js, which draws them, so node's tests can read them.

/** The season of a sighting by its month (0 January): December to February winter, as the field's leaves and grass are. */
export function seasonOf(sight) {
  const month = Number.isFinite(sight?.month) ? sight.month : 8;
  return [11, 0, 1].includes(month) ? 'winter' : [9, 10].includes(month) ? 'fall' : [2, 3, 4].includes(month) ? 'spring' : 'summer';
}
/** The covers the field is painted for; anything else is shown as timber. */
export const FIELD_COVERS = Object.freeze(['timber', 'brush', 'open']);
/** The painting of the field for a sighting: its cover, and its winter painting December to February. */
export function fieldSprite(sight) {
  const cover = FIELD_COVERS.includes(sight?.cover) ? sight.cover : 'timber';
  return `hunt-field-${cover}${seasonOf(sight) === 'winter' ? '-winter' : ''}`;
}
/**
 * Where the painted rifle's muzzle and the middle of its butt plate are in its frame, as fractions: the first and the last opaque
 * pixel along its long diagonal, read off the frame (tests/hunt-art.test.mjs holds them to the sheet's pixels). The rifle is
 * turned about the muzzle so the butt lies where the stroked stock's base did.
 */
export const RIFLE = Object.freeze({ muzzle: [0.017, 0.009], butt: [0.945, 0.948] });
