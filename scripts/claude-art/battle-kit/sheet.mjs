// Shared helpers for the battle area's modules (scripts/claude-art/areas/battle-*.mjs, famous-officers.mjs, esparza-family.mjs):
// a person frame from a spec and a pose, the style sentence every prompt ends with, and clip declarations.
import { personFrame, drawPerson } from '../kit/rig.mjs';

export const STYLE = 'Warm hand-drawn storybook style after Astra\'s frontier-v1 sheets: thin dark olive-brown outline, flat shade with the light from the upper left, a restrained moss, rust, cream and ochre palette; transparent ground, no shadow, no text. Claude-drawn temporary stand-in, to be replaced by Astra\'s frame of the same name.';
export const NO_GORE = 'Nothing of a wound is drawn: no blood, no injury shown (VISION.md §16).';
export const NO_LIKENESS = 'An original interpretation, not a portrait: no likeness is claimed (docs/BATTLES.md §2c).';

/** A person frame: `spec` drawn in `pose`, with anything else `extra` draws (in rig units) before or after the figure. */
export function person(name, spec, pose, { note = name, before, after, ...opts } = {}) {
  return personFrame(name, ink => { before?.(ink); drawPerson(ink, spec, pose); after?.(ink); }, { note, ...opts });
}
/** A clip declared as Astra's are: `[sprite, duration]` pairs. */
export function clip(frames, { loop = true, motion = 'none', direction = 'east; west by mirroring', prompt, beat } = {}) {
  return { frames: frames.map(([sprite, duration]) => ({ sprite, duration })), loop, motion, direction, prompt, ...(beat !== undefined && { beat }) };
}
