// Original game interpretation of Manuel Fernández Castrillón; no portrait claim.
const root = 'C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/';
export const SHEETS = {
  'famous-castrillon': ['castrillon-idle', 'castrillon-walk-e-1', 'castrillon-walk-e-2', 'castrillon-command'],
  'famous-castrillon-fate': ['castrillon-turn-away', 'castrillon-stumble', 'castrillon-kneel', 'castrillon-still'],
};
export const ANIMATION_CLIPS = {
  'castrillon-walk-e': {
    frames: [1, 2].map(n => ({ sprite: `castrillon-walk-e-${n}`, duration: 270 })),
    loop: true, authored: true, motion: 'none', direction: 'east; mirror for west',
  },
  'castrillon-fall': {
    frames: [
      { sprite: 'castrillon-turn-away', duration: 180 },
      { sprite: 'castrillon-stumble', duration: 220 },
      { sprite: 'castrillon-kneel', duration: 300 },
    ],
    loop: false, authored: true, motion: 'none', direction: 'east; mirror for west',
  },
};
export const promptEntries = [
  {
    sheet: 'famous-castrillon', promptId: 'frontier-v1/famous-castrillon', tool: 'built-in image_gen.imagegen', mode: 'generate',
    prompt: 'Transparent 2x2 game character atlas in the established painterly Texas Revolution style. Manuel Fernández Castrillón as an original interpretation, older mustached Mexican general in dark navy coat with gold epaulettes, red collar and sash, pale trousers, dark cap. Same complete figure in every isolated cell: idle facing east, east walk step one, east walk step two, arm raised in command. Broad transparent gutters; no words, scenery, borders, extra people or exact likeness claim.',
    generatedSourcePath: `${root}exec-1a0905a8-6409-4713-a37e-c5bee353a226.png`, runtimeFile: 'public/assets/frontier-v1/atlases/famous-castrillon.png',
    postProcessing: 'None. Copied unchanged; atlas builder measures alpha components and reading-order cells.',
    review: 'Distinct command silhouette and two authored walking steps; costume and face are interpretive.',
  },
  {
    sheet: 'famous-castrillon-fate', promptId: 'frontier-v1/famous-castrillon-fate', tool: 'built-in image_gen.imagegen', mode: 'generate',
    prompt: 'Transparent 2x2 companion sheet matching the supplied Castrillón character exactly in scale, palette, coat, cap and face. Four isolated non-graphic story frames: turn away and begin walking, stumble, kneel, lie still. No blood, text, scenery, extra people or portrait claim.',
    referenced_image_paths: [`${root}exec-1a0905a8-6409-4713-a37e-c5bee353a226.png`],
    generatedSourcePath: `${root}exec-6d8bd711-9708-4eb2-8b29-b571ecdb1cfe.png`, runtimeFile: 'public/assets/frontier-v1/atlases/famous-castrillon-fate.png',
    postProcessing: 'None. Copied unchanged; atlas builder measures alpha components and reading-order cells.',
    review: 'Non-graphic three-stage fall and separate still frame for the existing San Jacinto fate. The simulation owns timing and position.',
  },
];
export const provenanceEntries = promptEntries.map(({ prompt, ...entry }) => entry);
export const notes = ['Castrillón has a distinct command pose, two-step walk, non-graphic fall and still pose. The historical interpretation, timing and position stay in the simulation.'];
