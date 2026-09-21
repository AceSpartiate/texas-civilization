export const SHEETS = {
  // The built-in generator preserved the requested four-column alignment on the
  // lower half of its square canvas. Empty first-row cells make that layout explicit.
  'ferry-flatboat': [
    null, null, null, null,
    'ferry-flatboat', 'ferry-flatboat-laden', 'ferry-post', null,
  ],
  'steamboat-moored': [
    'steamboat-moored-1', 'steamboat-moored-2',
    'steamboat-moored-3', 'steamboat-moored-4',
  ],
};

export const ANIMATION_CLIPS = {
  'ferry-flatboat-idle': { frames: [{ sprite: 'ferry-flatboat', duration: 3400 }], loop: true, authored: false, motion: 'rock', direction: 'east; west by mirroring' },
  'ferry-flatboat-laden-idle': { frames: [{ sprite: 'ferry-flatboat-laden', duration: 3400 }], loop: true, authored: false, motion: 'rock', direction: 'east; west by mirroring' },
  'steamboat-moored': {
    frames: [
      { sprite: 'steamboat-moored-1', duration: 1100 },
      { sprite: 'steamboat-moored-2', duration: 1100 },
    ],
    loop: true, authored: true, motion: 'drift', direction: 'east; west by mirroring',
  },
  'steamboat-gangplank': { frames: [{ sprite: 'steamboat-moored-3', duration: 1600 }], loop: true, authored: false, motion: 'none', direction: 'east; west by mirroring' },
  'steamboat-cotton-moored': { frames: [{ sprite: 'steamboat-moored-4', duration: 1600 }], loop: true, authored: false, motion: 'drift', direction: 'east; west by mirroring' },
};

const ferryPrompt = 'Use case: historical-scene. Asset type: production transparent PNG sprite atlas. Create exactly three isolated 1830s Texas cable-ferry sprites in a strict four-column row with the fourth cell empty: an empty square-ended sawn-plank flatboat with low sides and hinged apron ramps; the same flatboat carrying a covered wagon, modest brown ox team and ferryman pulling the cable; and one stout braced timber ferry post with the rope turned around it. Slightly elevated broadside view, bow right. Match the supplied frontier transport atlas: warm storybook art, dark olive-brown outline, flat shading, weathered wood. Genuine transparent alpha; no painted water, bank, dock, lettering, flag, modern hardware, grid or watermark.';
const ferrySpacingPrompt = 'Edit this sprite atlas only to enforce the production grid. Preserve the three painted subjects and genuine alpha. Re-layout and proportionally shrink them into four equal columns: empty ferry in column 1, laden ferry in column 2, rope post in column 3, column 4 transparent. Leave at least 24 transparent pixels inside every boundary; align bases at 86%. No backdrop, water, grid, label, glow, ground plane or watermark.';
const steamboatPrompt = 'Use case: historical-scene. Asset type: production transparent animated sprite atlas. Four frames of the historically named side-wheel steamboat Yellow Stone in a strict 2 by 2 grid. Bow screen-right, slightly elevated broadside. Long low narrow hull, modest plain cabin, one visible starboard paddle box amidships, two tall black sheet-iron chimneys, small plain pilothouse, weathered wood and cream trim, no later Texas deck or gingerbread. Frames: thin smoke; lifted smoke; gangplank extended from bow; cotton bales stacked on main deck. Paddles still. Match the frontier transport atlas. Genuine transparent alpha, consistent registration, no river, shore, sky, lettering, flag, people, grid or watermark.';

export const promptEntries = [
  {
    sheet: 'ferry-flatboat', promptId: 'frontier-v1/ferry-flatboat', tool: 'built-in image_gen.imagegen', mode: 'generate + edit',
    prompt: ferryPrompt,
    referenced_image_paths: ['C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/transport.png'],
    generatedSourcePath: 'C:/Users/zachw/.codex/generated_images/01a0c3a7-e504-7523-9a9d-f7e5b2c5869e/exec-ae903c8f-1205-4b78-b8df-a9362f105161.png',
    runtimeFile: 'public/assets/frontier-v1/atlases/ferry-flatboat.png',
    postProcessing: 'None. Accepted built-in spacing edit copied unchanged; validation is read-only.',
    review: 'Accepted: empty and laden plank flatboats read distinctly from the legacy log raft; ferry post and cable turns remain isolated on genuine transparency.',
    edits: [{ prompt: ferrySpacingPrompt, reference: 'C:/Users/zachw/.codex/generated_images/01a0c3a7-e504-7523-9a9d-f7e5b2c5869e/exec-a58deb74-03bd-4ed3-adab-b9abc616116e.png', result: 'Accepted after strict cell-spacing correction.' }],
  },
  {
    sheet: 'steamboat-moored', promptId: 'frontier-v1/steamboat-yellow-stone-moored', tool: 'built-in image_gen.imagegen', mode: 'generate',
    prompt: steamboatPrompt,
    referenced_image_paths: ['C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/transport.png'],
    generatedSourcePath: 'C:/Users/zachw/.codex/generated_images/01a0c3a7-e504-7523-9a9d-f7e5b2c5869e/exec-d0799919-d444-4321-9b4c-1b50568bcca0.png',
    runtimeFile: 'public/assets/frontier-v1/atlases/steamboat-moored.png',
    postProcessing: 'None. Built-in output copied unchanged; validation is read-only.',
    review: 'Accepted after a spacing edit as the moored-state subset: four registered sidewheeler frames with still paddles, two smoke beats, gangplank and cotton load.',
    edits: [{ prompt: 'Preserve the four states but shrink and re-register each boat inside a strict 2 by 2 grid with 24 transparent pixels inside every center boundary.', reference: 'C:/Users/zachw/.codex/generated_images/01a0c3a7-e504-7523-9a9d-f7e5b2c5869e/exec-35215b63-8234-41a4-9051-ec89270d826a.png', result: 'Accepted after eliminating gangplank overlap at the vertical cell boundary.' }],
  },
];

export const provenanceEntries = promptEntries.map(({ prompt: omittedPrompt, edits, ...entry }) => ({
  ...entry,
  generationHistory: entry.sheet === 'ferry-flatboat'
    ? [
        { generatedSourcePath: 'C:/Users/zachw/.codex/generated_images/01a0c3a7-e504-7523-9a9d-f7e5b2c5869e/exec-a58deb74-03bd-4ed3-adab-b9abc616116e.png', result: 'Rejected for delivery because the three subjects did not obey four-column cell boundaries.' },
        { generatedSourcePath: entry.generatedSourcePath, result: 'Accepted after spacing edit and isolated manifest validation.' },
      ]
    : [
        { generatedSourcePath: 'C:/Users/zachw/.codex/generated_images/01a0c3a7-e504-7523-9a9d-f7e5b2c5869e/exec-35215b63-8234-41a4-9051-ec89270d826a.png', result: 'Rejected for delivery: bottom-left gangplank crossed the vertical cell boundary by 331 visible pixels.' },
        { generatedSourcePath: entry.generatedSourcePath, result: 'Accepted after spacing edit and isolated manifest validation.' },
      ],
}));

export const notes = [
  'Ferry sprites are presentation only; simulation crossing type, wait, availability and passenger state remain authoritative server data.',
  'This Yellow Stone delivery intentionally covers only the requested moored subset. Under-way empty and army-laden paddle loops remain open until their own sheets pass review.',
];
