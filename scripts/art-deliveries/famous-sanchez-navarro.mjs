// Interpretive game costume and face; not portrait or uniform evidence.
export const SHEETS = { 'famous-sanchez-navarro': [
  ...[1,2,3,4].map(n => `sanchez-navarro-walk-e-${n}`),
  ...[1,2].map(n => `sanchez-navarro-walk-s-${n}`),
  ...[1,2].map(n => `sanchez-navarro-walk-n-${n}`),
  'sanchez-navarro-idle', 'sanchez-navarro-parley', 'sanchez-navarro-listen', 'sanchez-navarro-dispatch',
  'sanchez-navarro-read', 'sanchez-navarro-offer', 'sanchez-navarro-point', 'sanchez-navarro-rest',
] };
export const ANIMATION_CLIPS = {};
for (const dir of ['e','s','n']) ANIMATION_CLIPS[`sanchez-navarro-walk-${dir}`] = {
  frames: [1,2].map(n => ({ sprite: `sanchez-navarro-walk-${dir}-${n}`, duration: 280 })),
  loop: true, authored: true, motion: 'none', direction: dir === 'e' ? 'east; mirror for west' : dir === 's' ? 'south' : 'north',
};
ANIMATION_CLIPS['sanchez-navarro-parley'] = {
  frames: [{ sprite: 'sanchez-navarro-listen', duration: 900 }, { sprite: 'sanchez-navarro-parley', duration: 650 }],
  loop: true, authored: true, motion: 'none', direction: 'east; mirror for west',
};
export const promptEntries = [{
  sheet: 'famous-sanchez-navarro', promptId: 'frontier-v1/famous-sanchez-navarro', tool: 'built-in image_gen.imagegen', mode: 'generate',
  prompt: 'Create NEW original interpretive Jose Juan Sanchez Navarro character atlas. Reference is ONLY style: match warm outlined storybook frontier game, slightly elevated 3/4 view, muted ochre cream navy moss colors, readable small proportions. Not exact likeness/uniform claim. DISTINCT lean middle-aged Mexican officer, angular face, dark short sideburns, small neat dark moustache, simple navy peaked cap without tall shako, navy coat with moss-green collar/cuffs, modest muted brass epaulettes, cream trousers, black boots, sheathed sword stays sheathed. TRUE transparent PNG strict 4 columns x 4 rows, exactly16 fullbody isolated sprites. Each figure occupies at most75% of cell height and80%width, centered with 30px clear transparent gutters, no touching rows. Same costume scale face throughout. Row1 FOUR east walk gait frames: left contact, right knee passing, right contact reversed arms, left knee passing. Row2 TWO south walking then TWO north walking, distinct legs. Row3 east idle, east open-palm parley speaking, east listening hands relaxed, east holding folded dispatch. Row4 east reading open document, east offering folded dispatch, east restrained pointing, east seated rest stool. Entire hats feet props intact, generous margins. No labels text lettering grid background ground patches shadows weapons firing blood. Keep subdued hand-painted reference style, not 3D not photoreal.',
  referenced_image_paths: ['C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/famous-condelle.png'],
  generatedSourcePath: 'C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-13eeabc8-5dbe-4512-8856-bbeae5240c0d.png',
  runtimeFile: 'public/assets/frontier-v1/atlases/famous-sanchez-navarro.png', postProcessing: 'None; copied unchanged.',
  review: 'Clear isolated poses and matching shipped officer style. East frames 3 and 4 repeat the contact/passing silhouette family; the runtime deliberately uses the first two as a modest two-pose walk rather than claiming four distinct gait phases. Costume and likeness are interpretations.',
}];
export const provenanceEntries = promptEntries.map(({ prompt, ...entry }) => entry);
export const notes = ['Sánchez Navarro has dedicated parley and document art; the existing Bexar parley uses his own idle. Conversation cycle and document gestures are available for future explicit projected poses, not invented dialogue.'];
