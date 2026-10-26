// The homestead's things painted with the owner's local pipeline on FLUX.2 klein 4B fp8 (Apache-2.0), 2026-10-26: batch 2 of
// docs/ART_PLAN_LOCAL_2026-10-25.md, docs/ART_DELIVERY_2026-10-26-LOCAL-HOMESTEAD.md. The family's tent (request 2026-10-02, E30),
// the kitchen garden summer and winter (request 2026-10-03, item 8, F35), the wash kettle and line (item 10, E21) and the wood pile
// at four sizes (request 2026-09-28, item 16, A2). Each painted on a plain grey ground in Astra's style from a board of her own
// frames, the ground keyed out on the CPU.
import { localDelivery } from '../local-art/delivery.mjs';

const SHEETS = {
  'homestead-local-1': ['homestead-tent', 'garden-beds', 'garden-beds-winter', 'wash-line', 'wash-kettle-1', 'wash-kettle-2'],
  'homestead-local-2': ['wood-pile-1', 'wood-pile-2', 'wood-pile-3', 'wood-pile-4'],
};

const delivery = localDelivery({
  batch: 'b2',
  sheets: SHEETS,
  sources: 'docs/art-sources/homestead-local-2026-10-26',
  postProcessing: 'Painted at 1024x1024 on a flat pale grey ground; the ground and any grey shadow on it keyed out on the CPU by a flood fill from the edges (scripts/local-art/batches_2026_10_26.py `key_out`; the kettle also inside its bail); cut to the sprite and fitted to 440 px; the kettle\'s two frames and the four piles each cut at one scale, which the atlas build gives one logical height; packed one to a clear 512 cell. The winter beds, the kettle\'s second frame and the three smaller piles are reference edits of the chosen summer beds, kettle and forty-log pile, so each set is one thing.',
  review: 'Eight candidates of the tent, the beds and the pile, four of the kettle and the line, and four of each edit (two of the kettle\'s), keyed on a mid green-grey on contact sheets (contact.jpg, contact-edits.jpg); every candidate licence-checked from its own file; the picks looked at full size. In the game: docs/evidence/homestead-local-compare.png and the yard-layout proof (each drawn inside its own footprint).',
});

export const { promptEntries, provenanceEntries } = delivery;
export { SHEETS };
