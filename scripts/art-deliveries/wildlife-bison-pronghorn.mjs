const frames = prefix => [1, 2, 3, 4].map(frame => `${prefix}-${frame}`);
const clip = (sprites, duration) => ({
  frames: sprites.map(sprite => ({ sprite, duration })),
  loop: true,
  authored: true,
  motion: 'none',
  direction: 'east; west by mirroring',
});

export const SHEETS = {
  'wildlife-bison-pronghorn': [
    ...frames('bison-idle'),
    ...frames('bison-run'),
    ...frames('pronghorn-idle'),
    ...frames('pronghorn-bound'),
  ],
};

export const ANIMATION_CLIPS = {
  'bison-idle': clip(frames('bison-idle'), 720),
  'bison-run': clip(frames('bison-run'), 180),
  'pronghorn-idle': clip(frames('pronghorn-idle'), 680),
  'pronghorn-bound': clip(frames('pronghorn-bound'), 165),
};

const prompt = 'Use case: stylized-concept. Asset type: production animated wildlife sprite atlas for a top-down three-quarter-view historical strategy game. Input image: the supplied wildlife-deer.png is a strict style, rendering, camera, outline, scale, cell-spacing, and transparency reference only; create different animals. Primary request: Create one square 4 columns by 4 rows sprite atlas with exactly sixteen complete, isolated, east-facing animal sprites on genuine transparent RGBA. Rows 1-2 are one historically plausible American bison of the 1830s: massive dark brown forequarters, shoulder hump, shaggy beard, smaller hindquarters, short black horns. Row 1 is a calm four-frame graze/idle loop: head low, chew, slight step, head partly raised. Row 2 is an alert-to-running four-frame loop: alert stance, push-off, suspended gallop, landing stride. Rows 3-4 are one historically plausible pronghorn: tan-and-white body, white rump and throat patches, dark branched horns, slim legs. Row 3 is a calm four-frame graze/idle loop: head low, chew, slight step, head raised. Row 4 is an alert-to-bounding four-frame loop: alert stance, push-off, airborne bound, landing stride. Style/medium: match the reference atlas exactly: warm outlined storybook game rendering, painterly animal texture, crisp dark-brown contours, elevated side/three-quarter camera, readable small-scale silhouettes, restrained natural colors. Composition: strict equal 4x4 grid; one animal centered in every cell; all animals face right/east; consistent identity within each species; consistent foot baseline; the bison is visibly larger and heavier than the pronghorn but every figure stays wholly inside its cell; wide transparent gutters. Constraints: actual transparent background; motion frames must visibly differ and form coherent loops; correct legs and anatomy; no antlers on bison; pronghorn horns distinct from deer antlers; no cast shadows. Avoid: background, ground patch, scenery, grid lines, labels, text, watermark, extra animals, duplicate animal inside a cell, overlapping cells, cropping, clipped horns or hooves, motion blur, photorealism.';

export const promptEntries = [{
  sheet: 'wildlife-bison-pronghorn',
  promptId: 'frontier-v1/wildlife-bison-pronghorn',
  tool: 'built-in image_gen.imagegen',
  mode: 'generate',
  prompt,
  referenced_image_paths: ['C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/wildlife-deer.png'],
  generatedSourcePath: 'C:/Users/zachw/.codex/generated_images/01a0c44d-440d-7482-96d4-bf5e96e8c5c2/exec-cfcf2284-a29f-4da3-b0b3-ea2f995339cc.png',
  runtimeFile: 'public/assets/frontier-v1/atlases/wildlife-bison-pronghorn.png',
  postProcessing: 'None. Generated PNG copied byte-for-byte; only read-only alpha and atlas-bound validation.',
  review: 'Accepted as distinct historically plausible bison and pronghorn silhouettes with readable calm and locomotion cycles, genuine transparency, complete anatomy, and strict cell separation.',
}];

export const provenanceEntries = promptEntries.map(({ prompt: ignoredPrompt, ...entry }) => entry);
export const notes = [
  'Bison and pronghorn art is presentation-only. Hunt selection, quarry position, timing, movement and outcome remain authoritative simulation state.',
  'All source frames face east. West-facing display mirrors the source and does not require duplicate atlas art.',
];
