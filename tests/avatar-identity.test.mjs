import test from 'node:test';
import assert from 'node:assert/strict';
import { avatarBand, avatarVariant, avatarBinding, PARENT_VARIANTS } from '../public/avatar-identity.js';
import { HEAD } from '../sim/look-vocabulary.mjs';
import {familyRigClip} from '../public/family-rig-bindings.js';
import { entityClip } from '../public/motion.js';
import { readFileSync } from 'node:fs';
const clips = JSON.parse(readFileSync(new URL('../public/assets/frontier-v1/animation.json', import.meta.url))).clips;

const appearance = { skin: 'brown', hair: 'black', clothing: 'teal', head: 'hat and beard' };

test('each offered parent head option has a distinct painted identity', () => {
  for (const sex of ['male', 'female']) {
    const ids = HEAD[sex].map(head => avatarVariant({ ...appearance, head }, sex));
    assert.equal(new Set(ids).size, HEAD[sex].length);
    for (const head of HEAD[sex]) assert.ok(PARENT_VARIANTS[sex][head]);
  }
});

test('numeric age uses the same infant, toddler, child, youth and adult boundaries as the simulation', () => {
  for (const [age, band] of [[0, 'infant'], [1, 'infant'], [2, 'small'], [4, 'small'], [5, 'child'], [9, 'child'], [10, 'youth'], [17, 'youth'], [18, 'adult']]) {
    assert.equal(avatarBand({ age }), band);
  }
});

test('inherited appearance never replaces a young body with either parent model', () => {
  for (const sex of ['male', 'female']) for (const band of ['infant', 'small', 'child', 'youth']) {
    const entity = { id: 'child', kind: 'person', sex, band, appearance };
    const variant = avatarVariant(appearance, sex, entity);
    assert.equal(variant, band === 'infant' ? 'infant' : band === 'small' ? 'smallchild' : band === 'youth' ? `youth-${sex === 'female' ? 'girl' : 'boy'}` : sex === 'female' ? 'girl' : 'boy');
    for (const action of [{}, { speaking: true }, { facing: 'n' }, { stepping: 'e' }, { stepping: 'n' }, { health: { condition: 'injured' } }]) {
      const person = { ...entity, ...action };
      const selected = avatarBinding(person, entityClip(person)).id;
      assert.ok(selected.startsWith(`${variant}-`));
      assert.ok(clips[selected], `missing shipped age-specific pose: ${selected}`);
    }
  }
});

test('a parent keeps the chosen head silhouette during walking, work and rest', () => {
  for (const sex of ['male', 'female']) for (const head of HEAD[sex]) {
    const entity = { id: 'parent', kind: 'person', sex, band: 'adult', appearance: { ...appearance, head } };
    const variant = avatarVariant(entity.appearance, sex, entity);
    for (const pose of ['idle-s', 'walk', 'walk-s', 'walk-n', 'work', 'rest', 'listen-s']) {
      const expected=familyRigClip(variant,pose);
      assert.equal(avatarBinding(entity, { id: `rust-${pose}` }).id, expected);
      assert.ok(clips[expected], `missing shipped parent pose: ${expected}`);
    }
  }
});

test('a parent with a look carries and mends in her own family rig, whatever her head', () => {
  // Until 2026-10-13 her figures lacked both (merged 2026-10-02: carrying was her walk, mending her work); Astra's family rig
  // (public/family-rig-bindings.js) carries and hammers for every identity.
  const entity = { id: 'parent', kind: 'person', sex: 'female', band: 'adult', appearance: { ...appearance, head: 'headscarf' } };
  assert.equal(avatarBinding(entity, { id: 'rust-woman-carry' }).id, 'mother-scarf-rig-carry');
  assert.equal(avatarBinding(entity, { id: 'rust-woman-repair' }).id, 'mother-scarf-rig-hammer');
  assert.equal(avatarBinding({ ...entity, appearance: { ...appearance, head: 'pinned hair' } }, { id: 'rust-woman-carry' }).id, 'teal-rig-carry');
});
