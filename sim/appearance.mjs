/**
 * What the parents look like, and the children after them: docs/SETTLING_IN.md §7, build step 8.
 *
 * After the roll a student chooses each parent's skin tone, hair colour and clothing colour, and a
 * hat or a beard for a man, a bonnet or pinned hair for a woman. Children are not chosen - the
 * owner's direction - but taken after their parents, deterministically from the class's seed: a
 * skin tone within the range between the parents (or the lone parent's own), hair from one of them,
 * and clothing in one of the family's colours.
 *
 * **Appearance never changes anything else.** Nothing in the simulation reads it: no stat, price,
 * request, trade, treatment or director. `tests/appearance.test.mjs` proves it the way glory's
 * blindness is proved - the same class played with different appearances comes out the same.
 * VISION.md §15 and HISTORY.md's representation rules apply: the colonies were not a single people,
 * and nothing about a person may be inferred from how they look. So every range here is offered to
 * every family, whatever its names, and a default is dealt from the seed alone.
 *
 * **Amended by the owner, 2026-09-29** ("ensure that skin tone options based on the race of the characters is locked to what is
 * realistic"): in a class that deals starts (sim/starts.mjs), a parent's skin tone is chosen from the range realistic for the
 * family's start - Anglo-American, Tejano or free Black - and the ranges overlap where history had them (`SKIN_RANGES`,
 * `FIC-GONZ-981`). The default is dealt within it, a child takes a tone between the parents and so inside it too, and a lone
 * parent's new husband or wife is dealt within it (sim/courtship.mjs). Hair, clothes and head are offered to every family as
 * before. Nothing reads the start or the tone to decide anything else. A class made before deals no starts and offers every tone.
 *
 * Stored as `entity.appearance` on a parent only once somebody has chosen; everything else is
 * derived, so a class saved before this needs nothing and no save version moves.
 *
 * The chooser and live client now share an appearance-driven avatar renderer. The authored
 * cast sheets remain for people without family appearance; layered painted replacements
 * can eventually replace the procedural layers without changing saved choices.
 */

import { rollRefusal } from './family.mjs';
/** SKIN is ordered lightest to darkest, so "between the parents" means something. */
import { SKIN, HAIR, CLOTHING, HEAD } from './look-vocabulary.mjs';
import { heritageOf, skinChoices } from './starts.mjs';
export { SKIN, HAIR, CLOTHING, HEAD, appearanceCode } from './look-vocabulary.mjs';

const PARENT_ROLES = ['father', 'mother'];
export const isParent = entity => PARENT_ROLES.includes(entity?.kin?.role);
const sexOf = entity => entity?.sex || (entity?.kin?.role === 'mother' ? 'female' : 'male');

/** FNV-1a, so a draw depends on the seed and the person and on nothing a student can change. */
function hash(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
const pick = (list, key) => list[hash(key) % list.length];

/** A parent's looks: what the student chose, and a seeded default for anything not chosen. */
function parentAppearance(world, entity) {
  const chosen = entity.appearance || {};
  const key = part => `${world.seed}:${entity.id}:appearance:${part}`;
  return {
    // Within the range of the family's start (sim/starts.mjs); every tone for a family with none, drawn exactly as before.
    skin: chosen.skin ?? pick(skinChoices(heritageOf(world, entity)), key('skin')),
    hair: chosen.hair ?? pick(HAIR.filter(hair => hair !== 'grey' || entity.age >= 40), key('hair')),
    clothing: chosen.clothing ?? pick(CLOTHING, key('clothing')),
    head: chosen.head ?? pick(HEAD[sexOf(entity)], key('head')),
  };
}

/**
 * A child's looks, from their parents.
 *
 * ceiling: grey hair is age, not inheritance, so a child takes the other parent's hair when one is
 * grey, and dark brown when every parent is. A real family's children do not all share one parent's
 * colouring; one draw per child is the whole of the genetics here, and nothing more is claimed.
 */
function childAppearance(world, entity) {
  const parents = (entity.kin?.parents || []).map(id => world.entities[id]).filter(Boolean).map(parent => parentAppearance(world, parent));
  const key = part => `${world.seed}:${entity.id}:appearance:${part}`;
  if (!parents.length) return { skin: pick(skinChoices(heritageOf(world, entity)), key('skin')), hair: 'dark brown', clothing: pick(CLOTHING, key('clothing')) };
  const tones = parents.map(parent => SKIN.indexOf(parent.skin));
  const lo = Math.min(...tones), hi = Math.max(...tones);
  const coloured = parents.map(parent => parent.hair).filter(hair => hair !== 'grey');
  return {
    skin: SKIN[lo + (hash(key('skin')) % (hi - lo + 1))],
    hair: coloured.length ? pick(coloured, key('hair')) : 'dark brown',
    clothing: pick(parents.map(parent => parent.clothing), key('clothing')),
  };
}

/** How anybody in a family looks. Null for somebody who is not a person in a family. */
export function appearanceOf(world, entity) {
  if (!entity || entity.kind !== 'person' || !entity.householdId) return null;
  return isParent(entity) ? parentAppearance(world, entity) : childAppearance(world, entity);
}

/** In words, for the family book: "olive skin, black hair, rust clothes, a hat". */
export function looksWords(appearance) {
  if (!appearance) return '';
  const head = { hat: 'a hat', beard: 'a beard', bonnet: 'a bonnet', 'pinned hair': 'hair pinned up', bareheaded: 'bareheaded', 'hat and beard': 'a hat and beard', moustache: 'a moustache', 'straw hat': 'a straw hat', braid: 'a braid', 'loose hair': 'loose hair', headscarf: 'a headscarf' }[appearance.head];
  return [`${appearance.skin} skin`, `${appearance.hair} hair`, `${appearance.clothing} clothes`, head].filter(Boolean).join(', ');
}

/** The four parts of a parent's looks. */
export const LOOK_PARTS = Object.freeze(['skin', 'hair', 'clothing', 'head']);
/** Whether a parent's looks have been chosen: every part, which the pop-up sends together. */
export const lookChosen = entity => LOOK_PARTS.every(part => entity?.appearance?.[part] !== undefined);

/**
 * What may be chosen for one parent, for the page to offer: the skin tones of the family's start, where the class deals starts
 * (owner, 2026-09-29), and every tone otherwise. `world` is what says the family's start; without it, every tone.
 */
export const choicesFor = (entity, world = null) => ({ skin: skinChoices(heritageOf(world, entity)), hair: HAIR, clothing: CLOTHING, head: HEAD[sexOf(entity)] });

/** Why this change may not be made, or null. */
export function appearanceRefusal(world, household, entity, input) {
  if (!entity || entity.householdId !== household.id || entity.kind !== 'person') return 'Choose one of your family.';
  // Before the roll the people in the house are about to be replaced, so there is nobody yet to dress.
  if (rollRefusal(world, household) === null) return 'Roll the die to find out who your family is.';
  if (!isParent(entity)) return `${entity.name} takes after their parents. Choose how the parents look.`;
  // Set once (owner, 2026-09-17: "Names on the panel only"): chosen in the pop-up after the family is named, and then kept.
  if (lookChosen(entity)) return `How ${entity.name} looks has already been chosen.`;
  const choices = choicesFor(entity, world);
  for (const part of ['skin', 'hair', 'clothing', 'head']) {
    if (input[part] !== undefined && !choices[part].includes(input[part])) return `That is not one of the choices for ${part === 'head' ? 'a hat, beard, bonnet or hair' : part}.`;
  }
  return null;
}

/** A parent's looks chosen, part by part. Records nothing: how somebody looks is not an event. */
export function setAppearance(world, household, input) {
  const entity = world.entities[input.entityId];
  const why = appearanceRefusal(world, household, entity, input);
  if (why) throw new Error(why);
  const chosen = { ...(entity.appearance || {}) };
  for (const part of ['skin', 'hair', 'clothing', 'head']) if (input[part] !== undefined) chosen[part] = input[part];
  entity.appearance = chosen;
  return appearanceOf(world, entity);
}

/** A stored appearance that could not have been chosen, or null. */
export function appearanceInvalid(world) {
  for (const entity of Object.values(world.entities)) {
    if (entity.appearance === undefined) continue;
    if (!isParent(entity)) return 'Only a parent has a chosen appearance';
    const choices = choicesFor(entity, world);
    for (const [part, value] of Object.entries(entity.appearance)) {
      if (!choices[part]?.includes(value)) return 'Invalid appearance';
    }
  }
  return null;
}
