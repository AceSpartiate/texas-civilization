// One age-aware identity for the creation studio, family portraits and world.
export function avatarBand(person = {}) {
  if (person.band) return person.band;
  const age = person.age;
  return !Number.isFinite(age) || age >= 18 ? 'adult' : age >= 10 ? 'youth' : age >= 5 ? 'child' : age >= 2 ? 'small' : 'infant';
}

// stand-in: docs/ART_REQUESTS.md, request 2026-09-29 "the family's start", item 2 - a Tejano ranchero family's dress; until it
// is drawn a Tejano family is Astra's family figures in its chosen colours, her straw hats and headscarf the nearest to a
// sombrero and a rebozo.
export const PARENT_VARIANTS = Object.freeze({
  male: { hat: 'father-hat', beard: 'father-beard', bareheaded: 'ochre', 'hat and beard': 'elder', moustache: 'father-moustache', 'straw hat': 'father-straw' },
  female: { bonnet: 'rust-woman', 'pinned hair': 'teal', braid: 'mother-braid', 'loose hair': 'mother-loose', headscarf: 'mother-scarf', 'straw hat': 'mother-straw' },
});

export function avatarVariant(appearance, sex = 'male', person = {}) {
  const band = typeof person === 'string' ? person : avatarBand(person);
  if (band === 'infant') return 'infant';
  if (band === 'small') return 'smallchild';
  if (band === 'child') return sex === 'female' ? 'girl' : 'boy';
  if (band === 'youth') return sex === 'female' ? 'youth-girl' : 'youth-boy';
  return PARENT_VARIANTS[sex]?.[appearance?.head] || (sex === 'female' ? 'teal' : 'ochre');
}

const FAMILY_POSES = new Set(['walk', 'walk-s', 'walk-n', 'idle-s', 'idle-e', 'idle-w', 'idle-n', 'work', 'rest', 'injured-rest', 'listen-s', 'listen-n', 'speak']);
const CHILD_POSES = new Set(['walk', 'walk-s', 'walk-n', 'idle-s', 'idle-e', 'idle-w', 'idle-n', 'rest', 'rest-s', 'rest-e', 'injured-rest', 'injured-rest-s', 'injured-rest-e']);
const PREFIX = /^(rust-woman|blue-girl|smallchild|infant|indigo|ochre|elder|rust|teal|blue|girl|boy)-/;

/** Remap a pose, never an age. A missing child action keeps a child silhouette. */
export function avatarBinding(entity, binding) {
  const variant = avatarVariant(entity.appearance, entity.sex, entity);
  let pose = binding.id.replace(PREFIX, '');
  const band = avatarBand(entity);
  if (band === 'infant') pose = pose.startsWith('rest') || pose.startsWith('injured') ? 'rest' : ['idle-e', 'idle-w'].includes(pose) ? pose : 'idle-s';
  else if (['child', 'small'].includes(band)) {
    if (!CHILD_POSES.has(pose)) pose = pose.startsWith('injured') ? 'injured-rest' : pose.includes('rest') ? 'rest' : pose.endsWith('-n') ? 'idle-n' : 'idle-s';
  } else if (variant.startsWith('father-') || variant.startsWith('mother-') || band === 'youth') {
    // stand-in: docs/ART_REQUESTS.md, request 2026-10-03 "the family figures' missing poses" (A31-A33, B20, C22, D17) - a pose her
    // family figures have no picture of (reading the ground, sowing, mending, felling, holding the baby, firing...) is drawn in
    // her nearest one; add each name to FAMILY_POSES as it lands. The old cast's `carry` is a walk with a load (the harvest home,
    // a baby held): her figure's walk, not its hoeing.
    if (!FAMILY_POSES.has(pose)) pose = pose.startsWith('injured') ? 'injured-rest' : pose.includes('rest') ? 'rest' : pose.startsWith('idle') ? 'idle-s' : pose === 'carry' ? 'walk' : 'work';
  }
  const painted = variant.startsWith('father-') || variant.startsWith('mother-') || band === 'youth';
  if (painted && pose === 'idle-w') return { ...binding, id: `${variant}-idle-e`, flip: true, upright: false };
  return { ...binding, id: `${variant}-${pose}` };
}
