export const SHEETS = {
  'icons-children': [
    'icon-child-play', 'icon-child-kindling', 'icon-child-birds', 'icon-child-eggs',
    'icon-child-water', 'icon-child-mind', null, null,
    null, null, null, null,
    null, null, null, null,
  ],
};

export const ANIMATION_CLIPS = {};

const prompt = 'Use case: stylized-concept. Production UI sprite atlas for an 1835–1836 Texas frontier family game. Match the referenced icon atlas exactly in scale, treatment, palette, cell spacing, and TRUE TRANSPARENT RGBA background: warm hand-painted miniature icons, restrained umber/ochre/rust/sage/indigo/cream, thin crisp dark-brown outline, one centered isolated silhouette per occupied cell, readable at 34 CSS pixels. EXACT 4 columns by 4 rows of equal cells. Only the first six cells are occupied in row-major order; cells 7–16 must be completely empty transparent pixels. Cell 1: CHILD PLAY, joyful simple wooden stick horse and small hoop, clearly recreation. Cell 2: CHILD KINDLING, safe armful of bark strips, chips, and thin dead sticks, absolutely no axe, hatchet, knife, blade, or sharp tool. Cell 3: SHOO BIRDS, two blackbirds lifting away from one standing corn ear, lively wing motion. Cell 4: GATHER EGGS, three pale eggs in a small woven straw nest. Cell 5: FETCH WATER, small wooden water pail with curved handle and two droplets. Cell 6: MIND YOUNGER CHILD, an older frontier child safely carrying a smaller child on one hip, simple 1830s clothing, complete full-body silhouette. Preserve wide clear gutters and keep every occupied subject wholly within its cell. TRUE transparent alpha means no color at all behind or between icons. No vignette, glow, gradient, brown background, black background, checkerboard, paper texture, scenery, text, labels, numbers, borders, grid lines, watermark, cropping, weapons, or modern objects.';

export const promptEntries = [{
  sheet: 'icons-children',
  promptId: 'frontier-v1/icons-children',
  tool: 'built-in image_gen.imagegen',
  mode: 'generate',
  prompt,
  referenced_image_paths: ['C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/icons-family-actions-1.png'],
  generatedSourcePath: 'C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-3be0dde8-4c87-474f-a52a-daab0808f431.png',
  runtimeFile: 'public/assets/frontier-v1/atlases/icons-children.png',
  postProcessing: 'None. Generated original copied unchanged; only read-only validation.',
  review: 'Accepted as six distinct, period-plausible child-action icons with true transparent gutters. The kindling carries no blade; play reads as recreation; the remaining ten cells are deliberately empty.',
}];

export const provenanceEntries = promptEntries.map(({ prompt: omittedPrompt, ...entry }) => entry);
export const notes = ['2026-09-22: All six children’s action-bar glyph stand-ins replaced with illustrated icons. Icons are presentation only; age, availability, work progress and outcomes remain authoritative simulation state.'];
