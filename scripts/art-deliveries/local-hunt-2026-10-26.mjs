// The hunter's first-person field and rifle (request 2026-10-02 "the hunter's first-person field", F17), painted with the owner's
// local pipeline on FLUX.2 klein 4B fp8 (Apache-2.0), 2026-10-26: batch 3 of docs/ART_PLAN_LOCAL_2026-10-25.md,
// docs/ART_DELIVERY_2026-10-26-LOCAL-HUNT.md. Drawn by public/hunt-aim.js (`fieldSprite`, `RIFLE` in public/hunt-art.js).
import { localDelivery } from '../local-art/delivery.mjs';

const SHEETS = {
  'hunt-fields-local-1': ['hunt-field-timber', 'hunt-field-timber-winter', 'hunt-field-brush', 'hunt-field-brush-winter'],
  'hunt-fields-local-2': ['hunt-field-open'],
  'hunt-fields-local-3': ['hunt-field-open-winter'],
  'hunt-rifle-local': ['hunt-rifle'],
};

const delivery = localDelivery({
  batch: 'b3',
  sheets: SHEETS,
  sources: 'docs/art-sources/hunt-local-2026-10-26',
  made: { 'hunt-field-timber-winter': 'hunt-field-timber-winter-repair', 'hunt-field-brush-winter': 'hunt-field-brush-winter-repair' },
  postProcessing: 'The fields painted at 1792x1008 and Lanczos-scaled to the contract\'s 1600x900, moved toward Astra\'s oil landscape by colour as the rider scenes were (spread halfway, mean a sixth), each opaque painting in a clear 1840x1100 cell; the winters are reference edits of the chosen summers. The rifle painted on a flat grey ground, keyed out on the CPU, fitted to 900 px in a clear 1100 cell. scripts/local-art/batches_2026_10_26.py `finish b3`.',
  review: 'Eight of each field and of the rifle, four of each winter edit and one repair round (four each) for the timber and brush winters, which first came back under snow; contact sheets (contact.jpg, contact-edits.jpg, contact-repair.jpg, contact-rifle.jpg); every candidate licence-checked from its own file; picks looked at full size. In the game: docs/evidence/hunt-local-compare.png and npm run test:hunt-aim.',
});

export const { promptEntries, provenanceEntries } = delivery;
export { SHEETS };
