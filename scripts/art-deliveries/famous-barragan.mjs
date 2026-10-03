// Interpretive captain art; no likeness or exact uniform claim.
export const SHEETS = { 'famous-barragan': [
 ...[1,2,3,4].map(n => `barragan-walk-e-${n}`),
 ...[1,2].map(n => `barragan-walk-s-${n}`),
 ...[1,2].map(n => `barragan-walk-n-${n}`),
 'barragan-idle', 'barragan-stop', 'barragan-protect', 'barragan-guide',
 'barragan-speak', 'barragan-listen', 'barragan-point', 'barragan-rest',
] };
export const ANIMATION_CLIPS = {};
for (const dir of ['e','s','n']) ANIMATION_CLIPS[`barragan-walk-${dir}`] = {
 frames: [1,2].map(n => ({ sprite: `barragan-walk-${dir}-${n}`, duration: 280 })),
 loop: true, authored: true, motion: 'none', direction: dir === 'e' ? 'east; mirror for west' : dir === 's' ? 'south' : 'north',
};
ANIMATION_CLIPS['barragan-intervene'] = {
 frames: [{ sprite: 'barragan-stop', duration: 800 }, { sprite: 'barragan-protect', duration: 1000 }],
 loop: true, authored: true, motion: 'none', direction: 'east; mirror for west',
};
export const promptEntries = [{
 sheet: 'famous-barragan', promptId: 'frontier-v1/famous-barragan', tool: 'built-in image_gen.imagegen', mode: 'generate',
 prompt: "Create a new original interpretive Captain Barragan Texas Revolution officer sprite atlas. Reference image STYLE ONLY: match warm outlined painted storybook game cast, thin dark olive-brown contours, slightly elevated 3/4 camera, subdued navy cream ochre moss palette and small readable proportions. Distinct character: middle-aged broad-shouldered Mexican captain, warm brown complexion, rounded face, short black hair, clean shaven, low dark navy officer cap with narrow brass band, navy coat with muted ochre collar/cuffs, restrained small brass shoulder tabs not ornate fringe, cream trousers dark boots, saber remains sheathed. Costume/face artistic interpretation not exact portrait or uniform. STRICT 4x4 equally spaced grid exactly16 fullbody isolated cutouts, each fits within75%cellheight and75%cellwidth, generous alpha gutters at least30px between silhouettes and rows, feet/hats/props intact same scale baseline. Row1 FOUR east walking poses left contact, right knee passing, right contact, left knee passing visibly alternate legs and arms. Row2 TWO south walking then TWO north walking. Row3 east idle arms relaxed, east one hand raised palm OUT stop intervention, east both palms OUT protective intervention, east arm stretched low guiding someone behind him (no other person). Row4 east speaking one hand near chest, east listening, east restrained pointing, seated rest on simple stool. Same identity/costume every cell. Hands unarmed, peaceful protective gestures, no firing death blood crowds. True transparent alpha no background ground shadow text labels grid, no photorealism no 3D.",
 referenced_image_paths: ['C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/famous-sanchez-navarro.png'],
 generatedSourcePath: 'C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-7e3d7f6a-9642-4acb-975a-41e80e0ec5f1.png',
 runtimeFile: 'public/assets/frontier-v1/atlases/famous-barragan.png', postProcessing: 'None; copied unchanged.',
 review: 'Original interpretive face and costume. Protective unarmed gestures for the existing Joe intervention. Runtime walk uses a restrained two-pose cadence; the other east poses are retained as variants.',
}];
export const provenanceEntries = promptEntries.map(({ prompt, ...entry }) => entry);
export const notes = ['Barragán uses his own walking and protective command gesture at the existing Alamo aftermath route. Guiding, conversation, vertical walking and rest poses are available for later explicit staging. No invented words or historical changes.'];

