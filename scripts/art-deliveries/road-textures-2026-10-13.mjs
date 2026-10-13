// The painted ground of the roads, the town streets and a family's paths (owner, 2026-10-13: "use our new image generation
// setup to improve roads"). The first art in this library painted with the owner's local pipeline rather than by Astra:
// ComfyUI + FLUX.2 klein 9B (Q8 GGUF) on this computer, every job through the shared toolkit's GPU lease
// (E:/VN-Tools/asset-toolkit/comfy.py). scripts/road-art/generate.py holds the prompts and seeds; scripts/road-art/finish.py
// made each tile seamless from its own pixels, moved it to the roads' colours and packed the sheet. docs/art-sources/ground-roads-2026-10-13/ keeps
// the four chosen paintings as generated and the review sheets. Drawn by public/ground-texture.js.
import { readFileSync } from 'node:fs';

const RECORD = JSON.parse(readFileSync(new URL('../road-art/textures.json', import.meta.url), 'utf8'));
const TEXTURES = RECORD.textures;

export const SHEETS = { 'ground-roads': TEXTURES.map(texture => texture.sprite) };

const SOURCES = 'docs/art-sources/ground-roads-2026-10-13';
export const promptEntries = [{
  sheet: 'ground-roads',
  promptId: 'frontier-v1/ground-roads',
  tool: 'local ComfyUI, FLUX.2 klein 9B Q8_0 GGUF (text to image, 4 steps, CFG 1, 1024x1024), through E:/VN-Tools/asset-toolkit/comfy.py',
  mode: 'generate; seams cut on the CPU from the painting itself',
  prompt: TEXTURES.map(texture => `${texture.sprite} (laid ${texture.laid}; candidate seed ${texture.candidate} of 1-4): ${texture.subject} ${RECORD.style}`).join('\n\n'),
  rejectedSeamRepaints: RECORD.rejectedSeamRepaints,
  candidates: TEXTURES.map(texture => ({ sprite: texture.sprite, chosen: texture.candidate, crop: texture.crop || null, meanColour: texture.target, contrastKept: texture.keep })),
  generatedSourcePath: `${SOURCES}/raw/`,
  runtimeFile: 'public/assets/frontier-v1/atlases/ground-roads.png',
  postProcessing: 'Each chosen 1024 candidate rolled half its size (down only for a tile laid along a way, both ways for a flat one), the seam band across the middle repainted by a reference edit and composited under a feathered mask that never reaches the edges, so the tile repeats exactly; its mean moved to the roads\' own colour with its spread kept at the share given; halved to 512 with Lanczos; packed one to a clear 768 cell. scripts/road-art/finish.py.',
  review: 'Sixteen candidates on one contact sheet (contact-candidates.jpg); the chosen tiles checked repeated 3x3 (tiling-3x3.png) and on the map at the zooms students see (docs/evidence/roads-after-*.png). No text, signatures or objects in the chosen tiles; the street candidate\'s corner building was cropped off before the seam pass.',
}];

export const provenanceEntries = promptEntries.map(({ prompt, rejectedSeamRepaints, candidates, ...entry }) => entry);
export const notes = ['Ground tiles are laid by public/ground-texture.js along the roads\' and paths\' existing geometry; they change how a way looks, never where it runs or who may use it.'];
