const frames = (animal, action) => [1, 2, 3, 4].map(frame => `${animal}-${action}-${frame}`);

export const SHEETS = {
  'wildlife-geese-cattle': [
    ...frames('geese', 'rest'),
    ...frames('geese', 'flight'),
    ...frames('wild-cattle', 'graze'),
    ...frames('wild-cattle', 'run'),
  ],
};

const clip = (sprites, duration, direction) => ({
  frames: sprites.map(sprite => ({ sprite, duration })),
  loop: true,
  authored: true,
  motion: 'none',
  direction,
});

export const ANIMATION_CLIPS = {
  'geese-rest': clip(frames('geese', 'rest'), 560, 'east-oriented flock; state cycle, no translation'),
  'geese-flight': clip(frames('geese', 'flight'), 180, 'east; west by mirroring'),
  'wild-cattle-graze': clip(frames('wild-cattle', 'graze'), 680, 'east; west by mirroring'),
  'wild-cattle-run': clip(frames('wild-cattle', 'run'), 190, 'east; west by mirroring'),
};

const prompt = 'Use case: historical-scene. Asset type: production animated wildlife sprite atlas for a top-down three-quarter-view 1835–1836 Texas classroom game. Create one square PNG with EXACTLY 4 equal columns and 4 equal rows, sixteen isolated sprites on a genuinely transparent RGBA background. Use the supplied wildlife-deer atlas strictly as the style reference: warm hand-painted storybook game rendering, crisp dark-brown contour, modest painterly texture, elevated east-facing side/three-quarter view, readable small-scale silhouettes, consistent lighting and foot baseline. ROWS 1–2 — WILD GEESE. Depict a small historically plausible flock of 3–4 wild geese per cell, consistent birds and scale. Row 1 is four coherent resting/foraging flock animation beats: settled flock, heads feeding, one sentinel head raised, subtle regroup. Row 2 is four coherent eastward flight beats: compact shallow-V flock, wings high, wings level, wings down, wings recovering; clearly airborne with no ground, water, reeds, or scenery. Keep each flock compact enough for wide cell margins. ROWS 3–4 — RANGY TEXAS WILD COW/LONGHORN. Depict the SAME lean feral adult Texas longhorn cow in all eight cells, east-facing, weathered dark reddish-dun coat with pale underside, angular hips, very long outward-curving horns, no brand, rope, bell, yoke, tack, rider, or modern breed exaggeration. Row 3 is four coherent graze/idle beats: muzzle down grazing, chewing low, head halfway up, head fully alert. Row 4 is four coherent alert/run beats: braced alert, gather stride, extended running stride, landing/recovery stride; leg positions clearly differ and read as locomotion. Layout constraints: one complete flock or animal per equal cell; same identities, proportions, apparent size and lighting within each species; every beak, wingtip, horn, tail, hoof, and leg stays fully inside its cell with at least 24 px transparent gutter on all four sides; nothing crosses cell boundaries; no cropping. Genuine transparency only: no black or white matte, no checkerboard, no colored background, no grid, no labels, no text, no borders, no watermark. No terrain, grass, water, dust, ground patch, scenery, people, weapons, carcasses, blood, extra wildlife, or large cast shadow. Tiny contact shadow only beneath planted cattle hooves is acceptable. Production-ready animated game assets.';

export const promptEntries = [{
  sheet: 'wildlife-geese-cattle',
  promptId: 'frontier-v1/wildlife-geese-cattle',
  tool: 'built-in image_gen.imagegen',
  mode: 'generate from style reference',
  prompt,
  referenced_image_paths: ['C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/wildlife-deer.png'],
  generatedSourcePath: 'C:/Users/zachw/.codex/generated_images/01a0c44d-660e-7541-a11f-2d35bd5c40a5/exec-0e7dcf82-0423-4a79-8d8a-edd27d470c42.png',
  runtimeFile: 'public/assets/frontier-v1/atlases/wildlife-geese-cattle.png',
  postProcessing: 'None. Generated PNG copied unchanged; only read-only atlas validation.',
  review: 'Accepted as compact goose flock resting and flight states plus one consistent rangy feral longhorn cow with grazing, alert and running beats.',
}];

export const provenanceEntries = promptEntries.map(({ prompt: _prompt, ...entry }) => entry);
export const notes = ['Geese and wild-cattle clips are presentation-only. The server remains authoritative for quarry identity, position, movement, visibility and hunt outcomes.'];
