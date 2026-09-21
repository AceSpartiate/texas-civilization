const variants = ['rust-woman', 'indigo', 'ochre', 'blue-girl'];

export const SHEETS = {
  'people-cast2-dialogue': variants.flatMap(variant => [
    `${variant}-speak-1`,
    `${variant}-speak-2`,
    `${variant}-listen-s`,
    `${variant}-listen-n`,
  ]),
};

export const ANIMATION_CLIPS = {};
for (const variant of variants) {
  ANIMATION_CLIPS[`${variant}-speak`] = {
    frames: [
      { sprite: `${variant}-speak-1`, duration: 750 },
      { sprite: `${variant}-speak-2`, duration: 900 },
    ],
    loop: true,
    authored: true,
    motion: 'none',
    direction: 'east; west by mirroring',
  };
  for (const direction of ['s', 'n']) {
    ANIMATION_CLIPS[`${variant}-listen-${direction}`] = {
      frames: [{ sprite: `${variant}-listen-${direction}`, duration: 2200 }],
      loop: true,
      authored: false,
      motion: 'breathe',
      direction: direction === 's' ? 'south' : 'north',
    };
  }
}

const prompt = 'Use case: historical-scene. Asset type: production 2D character sprite atlas for a top-down three-quarter-view Texas 1835 storybook game. Input image: identity and exact visual-style reference; preserve the four established characters, their skin tones, hair, clothing colors, proportions, dark brown outlines, soft painted material shading, and small-game-sprite readability. Create a square PNG with GENUINE transparent RGBA background, arranged as a strict 4 columns by 4 rows atlas containing exactly sixteen complete isolated full-body figures, one centered within each equal cell, generous clear gutters, no overlap, no crop, no grid or cell borders, no text, no checkerboard, no ground, no shadows, no scenery, no props, no speech bubbles, no extra people. Keep a consistent head size, character scale, and foot baseline within each row. Fixed row identities: ROW 1 rust-blouse tan-skirt bonneted adult woman; ROW 2 brown-skinned adult woman in indigo-blue ankle dress with cream kerchief; ROW 3 clean-shaven younger adult man in ochre shirt, dark-brown waistcoat, gray trousers and brown boots; ROW 4 adolescent girl in muted blue ankle dress, cream apron and one dark braid. EVERY ROW uses the same column contract: COLUMN 1 speaking while facing EAST/screen-right, one hand raised modestly near the chest; COLUMN 2 speaking while facing EAST/screen-right with a clearly different pose, open palm extended forward and mouth slightly changed; COLUMN 3 listening while facing SOUTH/toward viewer, hands gently joined at the waist and head leaned slightly forward; COLUMN 4 listening while facing NORTH/away from viewer, clear full back view with head subtly tilted. The two east-speaking poses must differ clearly in forearm, hand, and mouth shapes while preserving the same foot position. Columns 3 and 4 are calm attentive idle poses. Preserve dignified historically plausible clothing. Real alpha transparency in all empty pixels.';
const spacingPrompt = 'Use case: precise-object-edit. Edit ONLY the spacing and scale of this exact 4x4 dialogue sprite atlas. Within EACH of the sixteen existing equal logical cells, uniformly shrink that cell\'s one complete character to 88% of its current size and recenter it horizontally and vertically inside the SAME cell. Preserve every character identity, face, skin tone, clothing, color, outline, pose, orientation, hand gesture, expression, row order, and column order exactly. Preserve final canvas at exactly 1254 x 1254 pixels. Create at least 12 pixels of fully transparent gutter on every side of every logical cell, especially between rows and at the outer canvas edges. Do not move any character into another cell. Do not redraw or invent poses. Keep background genuinely transparent RGBA alpha zero. No grid, checkerboard, text, shadow, ground, props, speech bubbles, or extra people. This is a layout-spacing correction only.';
const generated = 'C:/Users/zachw/.codex/generated_images/01a0c395-e323-73b2-af6b-938e27414484/exec-b154b1df-7cc4-4dc7-adca-291217a03e9d.png';
const accepted = 'C:/Users/zachw/.codex/generated_images/01a0c395-e323-73b2-af6b-938e27414484/exec-3aa1a9b0-c485-42f7-a179-c982c363f145.png';
const reference = 'C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/people-cast2-idle.png';

export const promptEntries = [{
  sheet: 'people-cast2-dialogue',
  promptId: 'frontier-v1/people-cast2-dialogue',
  tool: 'built-in image_gen.imagegen',
  mode: 'generate + edit',
  prompt,
  referenced_image_paths: [reference],
  generatedSourcePath: accepted,
  runtimeFile: 'public/assets/frontier-v1/atlases/people-cast2-dialogue.png',
  postProcessing: 'None. The accepted PNG is the built-in spacing-edit output copied unchanged; only read-only RGBA and atlas-layout validation were performed.',
  review: 'Accepted after visual review and measured atlas validation: sixteen identity-consistent figures, two clearly distinct east-facing speech poses and south/north listening poses on genuine transparency.',
  edits: [{ prompt: spacingPrompt, reference: generated, generatedSourcePath: accepted, result: 'Accepted: dialogue gestures preserved and sprite scale reduced to improve logical-cell separation.' }],
}];

export const provenanceEntries = promptEntries.map(({ prompt: omittedPrompt, edits, ...entry }) => ({
  ...entry,
  generationHistory: [
    { generatedSourcePath: generated, reference, result: 'Rejected for delivery: figures visually touched logical row boundaries despite correct identities and poses.' },
    ...edits,
  ],
}));

export const notes = [
  'Second-cast dialogue supplies authored two-frame east-facing speech plus south/front and north/back listening poses; west-facing speech is rendered by mirroring.',
  'Dialogue animation remains presentation-only. Conversation knowledge, range, witnesses and timing remain authoritative simulation state.',
];
