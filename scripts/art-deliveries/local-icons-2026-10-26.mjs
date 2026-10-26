// The family panel's icons and marks that the page drew in strokes and masks, painted with the owner's local pipeline on FLUX.2
// klein 4B fp8 (Apache-2.0), 2026-10-26: batch 4 of docs/ART_PLAN_LOCAL_2026-10-25.md, docs/ART_DELIVERY_2026-10-26-LOCAL-ICONS.md.
// Icons are asked for by name (`drawIcon` takes `icon-<key>` first; `drawMoreIcon`); the marks are handed to the style sheet by
// public/painted-marks.js and the cue's two drawn by `CUE_MARKS` in public/app.js.
import { localDelivery } from '../local-art/delivery.mjs';

const SHEETS = {
  'icons-family-local-1': ['icon-more', 'icon-go-inside', 'icon-join-seguin', 'icon-pitch-tent', 'icon-keep-house', 'icon-work-garden',
    'icon-wash-clothes', 'icon-milk-cow', 'icon-fence-yard', 'icon-camp-cook', 'icon-camp-wood', 'icon-camp-bullets', 'icon-camp-shelter',
    'icon-camp-buy', 'icon-camp-hunt', 'icon-town-wages'],
  'icons-family-local-2': ['icon-town-board', 'mark-hunger', 'mark-food', 'mark-help'],
  'marks-local-1': ['mark-cue-house', 'mark-cue-wash', 'mark-shelter-house', 'mark-shelter-tent'],
};

const delivery = localDelivery({
  batch: 'b4',
  sheets: SHEETS,
  sources: 'docs/art-sources/icons-local-2026-10-26',
  made: { 'icon-camp-hunt': 'icon-camp-hunt-repair' },
  postProcessing: 'Each painted at 1024x1024 on a flat pale ground from a board of two of Astra\'s icons nearest in subject (or her three panel marks), the ground keyed out on the CPU (scripts/local-art/batches_2026_10_26.py `key_out`), cut to the sprite and fitted to her icon size (300 px; marks 320), packed one to a clear 384 cell.',
  review: 'Four candidates each on keyed contact sheets (contact-1.jpg, contact-2.jpg, contact-repair.jpg); every candidate licence-checked from its own file; picks looked at full size: coins with numerals refused (text), hands and the horse counted. Two items flagged after their one repair (the hoe painted as a spade; the deer tracks as paw prints). In the game: docs/evidence/icons-local-compare.png.',
});

export const { promptEntries, provenanceEntries } = delivery;
export { SHEETS };
