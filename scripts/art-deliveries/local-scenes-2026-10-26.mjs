// The rider scenes' backdrops (request 2026-10-05, E40-E44) and the courtship yards (request 2026-09-29, item 5, E19), painted with
// the owner's local pipeline on FLUX.2 klein 4B fp8 (Apache-2.0) on 2026-10-26: batch 1 of docs/ART_PLAN_LOCAL_2026-10-25.md,
// docs/ART_DELIVERY_2026-10-26-LOCAL-SCENES.md. Whole opaque paintings, 960x540, drawn to cover a scene (public/rider-scene.js
// `backdropOf`, public/courtship.js `BACKDROP`); scripts/build-atlas-manifest.mjs frames them to their exact rectangle.
import { localDelivery } from '../local-art/delivery.mjs';

const SHEETS = {
  'scenes-local-1': ['scene-street-gonzales', 'scene-street-texian', 'scene-street-tejano', 'scene-camp-volunteers'],
  'scenes-local-2': ['scene-road-prairie', 'scene-road-woods', 'scene-ford', 'scene-yard-night'],
  'scenes-local-3': ['scene-alamo-plaza', 'courtship-yard-morning', 'courtship-yard-noon', 'courtship-yard-evening'],
};

const delivery = localDelivery({
  batch: 'b1',
  sheets: SHEETS,
  sources: 'docs/art-sources/scenes-local-2026-10-26',
  made: { 'scene-ford': 'scene-ford-repair' },
  postProcessing: 'Painted at 1360x768; cropped to 16:9 about the middle and Lanczos-scaled to the contract\'s 960x540; every one but the night yard moved toward Astra\'s oil landscape (creation-title-landscape.png) by colour (its spread at half strength, its mean at a sixth, so her sunset does not tint a noon street), as the bake-off recommended for klein 4B\'s lighter, more line-drawn backdrops; packed four to a sheet, each in a clear 1120x700 cell. scripts/local-art/batches_2026_10_26.py `finish b1`, CPU only.',
  review: 'Eight candidates an item (the courtship morning and evening four each, edits of the chosen noon yard; the ford one repair round of four) on one contact sheet (contact.jpg, contact-edits.jpg); every candidate licence-checked from its own file; the picks looked at full size for people, text, signatures and anachronism; the rider scenes and the courtship seen in the game (docs/evidence/scenes-local-compare.png).',
});

export const { promptEntries, provenanceEntries } = delivery;
export { SHEETS };
