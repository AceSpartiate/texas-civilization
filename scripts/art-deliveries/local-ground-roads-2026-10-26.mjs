// The painted ground of the roads, the town streets and a family's paths (owner, 2026-10-13: "use our new image generation
// setup to improve roads"), repainted on 2026-10-26 with FLUX.2 klein 4B fp8 (Apache-2.0) because the 2026-10-13 tiles were
// klein 9B, whose licence is non-commercial (docs/ART_PLAN_LOCAL_2026-10-25.md, batch 0; owner: "repaint the road tiles first").
// Painted with the owner's local pipeline on this computer, every job through the shared toolkit's GPU lease
// (E:/VN-Tools/asset-toolkit/comfy.py) and built by scripts/local-art/tx_workflows.py, which refuses any other model.
// scripts/road-art/generate.py holds the prompts and seeds; scripts/road-art/finish.py made each tile seamless from its own
// pixels, moved it to the roads' colours and packed the sheet. docs/art-sources/ground-roads-2026-10-26/ keeps the four
// chosen paintings as generated (each with its own workflow inside, which scripts/local-art/licence_check.py reads) and the
// review sheets. Drawn by public/ground-texture.js.
import { readFileSync } from 'node:fs';

const RECORD = JSON.parse(readFileSync(new URL('../road-art/textures.json', import.meta.url), 'utf8'));
const TEXTURES = RECORD.textures;
// The prompt each candidate was painted with (scripts/road-art/generate.py `prompt`): seeds 1-4 reference edits, 5-8 text alone.
const REF_NOTE = 'Use the reference images only for their colour palette and hand-painted brushwork, not for their shapes, layout or objects. Paint a new picture: ';
const ALONG = {
  'road-wagon': ' Two parallel wheel ruts run straight down the frame from the top edge to the bottom edge.',
  'path-trodden': ' The trodden line runs straight down the middle of the frame from the top edge to the bottom edge.',
};
const edited = texture => texture.candidate <= 4;
const promptOf = texture => `${edited(texture) ? REF_NOTE : ''}${texture.subject}${ALONG[texture.name] || ''} ${RECORD.style}`;

export const SHEETS = { 'ground-roads': TEXTURES.map(texture => texture.sprite) };

const SOURCES = 'docs/art-sources/ground-roads-2026-10-26';
export const promptEntries = [{
  sheet: 'ground-roads',
  promptId: 'frontier-v1/ground-roads',
  tool: 'local ComfyUI, FLUX.2 klein 4B fp8 (Apache-2.0) with the Qwen3-4B fp8-mixed encoder and the FLUX.2 VAE (4 steps, CFG 1, 1024x1024), through E:/VN-Tools/asset-toolkit/comfy.py',
  mode: 'generate (seeds 1-4: reference edits of Astra\'s ground pieces for palette and brushwork; seeds 5-8: text alone); seams cut on the CPU from the painting itself',
  prompt: TEXTURES.map(texture => `${texture.sprite} (laid ${texture.laid}; candidate seed ${texture.candidate} of 1-8, ${edited(texture) ? 'a reference edit' : 'text alone'}): ${promptOf(texture)}`).join('\n\n'),
  references: 'Seeds 1-4 only, for palette and brushwork: Astra\'s four path-and-bank pieces of grass-creek-terrain (the wagon road, the street) or her grassy creek pieces of concepcion-bank-terrain (the path, the verge), on the map\'s ground colour, and the map\'s own ground before any road tile (docs/evidence/roads-before-land.png). Made by scripts/local-art/bakeoff_2026_10_25.py `refs`. Nothing painted by klein 9B.',
  rejectedSeamRepaints: RECORD.rejectedSeamRepaints,
  candidates: TEXTURES.map(texture => ({ sprite: texture.sprite, chosen: texture.candidate, crop: texture.crop || null, meanColour: texture.target, contrastKept: texture.keep })),
  generatedSourcePath: `${SOURCES}/raw/`,
  runtimeFile: 'public/assets/frontier-v1/atlases/ground-roads.png',
  postProcessing: 'Each chosen 1024 candidate: its broad light and dark flattened; rolled half its size (down only for a tile laid along a way, both ways for a flat one); the seam left across the middle covered by a band cut from elsewhere in the same painting and joined along the line of least difference (image quilting), never blended and never touching the edges, so the tile repeats exactly; its mean moved to the roads\' own colour with its spread kept at the share given; halved to 512 with Lanczos; packed one to a clear 768 cell. scripts/road-art/finish.py, CPU only.',
  review: 'Thirty-two candidates (four tiles, eight each) on one contact sheet, each beside its 3x3 repeat after the seam pass (contact-candidates.jpg); every candidate\'s model proved from its own file by scripts/local-art/licence_check.py; the chosen tiles checked repeated 3x3 (tiling-3x3.png) and on the map at the zooms students see, against the klein 9B tiles they replace (docs/evidence/roads-4b-compare.png).',
}];

export const provenanceEntries = promptEntries.map(({ prompt, rejectedSeamRepaints, candidates, references, ...entry }) => entry);
export const notes = ['Ground tiles are laid by public/ground-texture.js along the roads\' and paths\' existing geometry; they change how a way looks, never where it runs or who may use it.'];
