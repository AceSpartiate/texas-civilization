// Shared, ordered appearance choices for the simulation and client renderer.
// Their order is the wire codec's contract; the server and browser import this same
// module so adding a tone cannot silently change one side's interpretation.
export const SKIN = Object.freeze(['fair', 'light', 'warm light', 'olive', 'tan', 'copper', 'brown', 'dark brown', 'deep brown']);
export const HAIR = Object.freeze(['black', 'dark brown', 'brown', 'chestnut', 'auburn', 'red', 'sandy', 'fair', 'grey']);
export const CLOTHING = Object.freeze(['rust', 'indigo', 'ochre', 'teal', 'butternut', 'grey', 'cream', 'forest', 'clay', 'plum', 'navy']);
export const HEAD = Object.freeze({
  male: Object.freeze(['hat', 'beard', 'bareheaded', 'hat and beard', 'moustache', 'straw hat']),
  female: Object.freeze(['bonnet', 'pinned hair', 'braid', 'loose hair', 'headscarf', 'straw hat']),
});
export const HEAD_RADIX = Math.max(...Object.values(HEAD).map(options => options.length)) + 1;

/** Compact public-map value; saved appearance and the family book remain words. */
export function appearanceCode(appearance, sex) {
  if (!appearance) return null;
  const indices = [SKIN.indexOf(appearance.skin), HAIR.indexOf(appearance.hair), CLOTHING.indexOf(appearance.clothing)];
  if (indices.some(index => index < 0)) return null;
  const headIndex = HEAD[sex]?.indexOf(appearance.head) ?? -1;
  const head = appearance.head === undefined || headIndex < 0 ? HEAD_RADIX - 1 : headIndex;
  return (((indices[0] * HAIR.length + indices[1]) * CLOTHING.length + indices[2]) * HEAD_RADIX + head);
}

export function decodeAppearance(code, sex) {
  if (!Number.isInteger(code) || code < 0) return null;
  const head = code % HEAD_RADIX; code = Math.floor(code / HEAD_RADIX);
  const clothing = code % CLOTHING.length; code = Math.floor(code / CLOTHING.length);
  const hair = code % HAIR.length;
  const skin = Math.floor(code / HAIR.length);
  const appearance = { skin: SKIN[skin], hair: HAIR[hair], clothing: CLOTHING[clothing] };
  if (head !== HEAD_RADIX - 1) appearance.head = HEAD[sex]?.[head];
  return appearance.skin && appearance.hair && appearance.clothing ? appearance : null;
}
