// The tools the work cycles hold, painted with the owner's local pipeline on FLUX.2 klein 4B fp8 (Apache-2.0), 2026-10-26 (owner,
// 2026-10-25: "plus a batch of painted tool parts"; docs/ART_PLAN_LOCAL_2026-10-25.md §3, docs/ART_DELIVERY_2026-10-26-LOCAL-TOOLS.md).
// Drawn by public/work-art.js (`TOOL_PARTS`, `paintToolPart`) in the hoeing cycle's hands and as the fishing pole.
import { localDelivery } from '../local-art/delivery.mjs';

const SHEETS = {
  'tools-local-1': ['tool-felling-axe', 'tool-maul', 'tool-spade', 'tool-broom', 'tool-pails', 'tool-cane-pole'],
  'tools-local-2': ['tool-battling-stick'],
};

const delivery = localDelivery({
  batch: 'tools',
  sheets: SHEETS,
  sources: 'docs/art-sources/tools-local-2026-10-26',
  postProcessing: 'Each painted at 1024x1024 on a flat pale grey ground from a board of two of Astra\'s icons showing the tool (or her bucket), lying along the picture\'s diagonal; keyed out on the CPU (the pails also inside their bails), cut to the sprite and fitted to 460 px in a clear 512 cell. Each haft tool\'s butt and head, as fractions of its frame, are read off its pixels (scripts/local-art/batches_2026_10_26.py `finish tools`) into public/work-art.js `TOOL_PARTS`.',
  review: 'Four candidates each on one keyed contact sheet (contact.jpg); every candidate licence-checked from its own file; the picks looked at full size: an axe with a spike on its poll refused. In the game: docs/evidence/tools-local-compare.png.',
});

export const { promptEntries, provenanceEntries } = delivery;
export { SHEETS };
