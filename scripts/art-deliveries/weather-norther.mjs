export const SHEETS = {
  'weather-norther': [
    'oak-broad-wind',
    'oak-spreading-wind',
    'pecan-wind',
    null,
    'grass-tuft-wind',
    'smoke-streaming',
    null,
    null,
  ],
};

export const ANIMATION_CLIPS = {
  'oak-broad-wind': { frames: [{ sprite: 'oak-broad-wind', duration: 1200 }], loop: true, authored: false, motion: 'none', direction: 'not applicable' },
  'oak-spreading-wind': { frames: [{ sprite: 'oak-spreading-wind', duration: 1200 }], loop: true, authored: false, motion: 'none', direction: 'not applicable' },
  'pecan-wind': { frames: [{ sprite: 'pecan-wind', duration: 1200 }], loop: true, authored: false, motion: 'none', direction: 'not applicable' },
  'grass-tuft-wind': { frames: [{ sprite: 'grass-tuft-wind', duration: 900 }], loop: true, authored: false, motion: 'none', direction: 'not applicable' },
  'smoke-streaming': { frames: [{ sprite: 'smoke-streaming', duration: 1100 }], loop: true, authored: false, motion: 'drift', direction: 'not applicable' },
};

const prompt = 'Use case: stylized-concept. Asset type: transparent production sprite sheet. Create exactly five isolated weather game sprites on a fully transparent RGBA canvas in a strict 3 columns by 2 rows layout. Top: broad oak gale pose, spreading oak gale pose, tall pecan gale pose. Bottom: grass tuft flattened right, low thin gray-white smoke ribbon streaming right from a tiny upwind origin, and a completely blank transparent cell. Match the supplied nature sprites hand-painted frontier game style, olive foliage, bark texture, dark crisp contour, and detail density. Trees are bent strongly to screen-right by a cold norther, trunk base fixed at bottom center, crown swept and thinned downwind, sparse leaves blowing right. Preserve distinct botanical silhouettes. Wide transparent gutters; one complete object per cell; no overlap or cropping. No backdrop, ground plane, frames, labels, scenery, glow, or watermark.';
const spacingPrompt = 'Edit the supplied sprite atlas only to increase spacing and ensure strict cell containment. Preserve each of the five painted subjects in style, identity, pose, detail, and alpha transparency. Keep a strict 3-column by 2-row layout. Pull every branch and detached leaf inward enough to leave transparent gutters at both sides of each cell boundary. Keep grass bottom-left, smoke bottom-middle, and bottom-right empty. Remove detached leaves crossing a boundary. No backdrop, glow, grid, labels, shadow, ground plane, scenery, or watermark.';
const generated = 'C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-5bf13212-4211-4d63-82ba-c1792fd58af8.png';
const spaced = 'C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-3cb70a74-345f-4a57-b078-35fbff33634b.png';
const accepted = 'C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-ad0755f5-1262-497e-a6f3-65caff933899.png';

export const promptEntries = [{
  sheet: 'weather-norther',
  promptId: 'frontier-v1/weather-norther',
  tool: 'built-in image_gen.imagegen',
  mode: 'generate + edit',
  prompt,
  referenced_image_paths: ['C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/nature.png'],
  generatedSourcePath: accepted,
  runtimeFile: 'public/assets/frontier-v1/atlases/weather-norther.png',
  postProcessing: 'None. The accepted built-in spacing edit was copied unchanged; only read-only validation.',
  review: 'Accepted as five separated, downwind silhouettes on genuine RGBA transparency; the final sixth grid cell remains clear.',
  edits: [
    { prompt: spacingPrompt, reference: generated, generatedSourcePath: spaced, result: 'Rejected after measured validation: source used a 3x2 layout while the registry requires four columns for sparse sheets.' },
    { prompt: 'Re-layout the five preserved subjects into a strict four-column by two-row production grid with cells 4, 7, and 8 empty and at least twenty transparent pixels inside each boundary.', reference: spaced, generatedSourcePath: accepted, result: 'Accepted: 79.7% clear alpha, zero overlap pixels trimmed, all objects retained.' },
  ],
}];

export const provenanceEntries = promptEntries.map(({ prompt: omittedPrompt, edits, ...entry }) => ({
  ...entry,
  generationHistory: [
    { generatedSourcePath: generated, result: 'Rejected for delivery: detached leaves crossed the logical tree-cell boundary.' },
    ...edits,
  ],
}));
export const notes = ['Norther sprites are presentation only; authoritative weather intensity and spatial mixing remain simulation state.'];
