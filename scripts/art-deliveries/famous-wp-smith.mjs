// Original interpretive costume/face, not a historical portrait.
export const SHEETS = { 'famous-wp-smith': [
 ...[1,2,3,4].map(n => `wp-smith-walk-e-${n}`),
 ...[1,2].map(n => `wp-smith-walk-s-${n}`),
 ...[1,2].map(n => `wp-smith-walk-n-${n}`),
 'wp-smith-idle', 'wp-smith-speak', 'wp-smith-exhort', 'wp-smith-listen',
 'wp-smith-book', 'wp-smith-read', 'wp-smith-point', 'wp-smith-rest',
] };
export const ANIMATION_CLIPS = {};
for (const [dir,count] of [['e',2],['s',2],['n',2]]) ANIMATION_CLIPS[`wp-smith-walk-${dir}`] = {
 frames: Array.from({length:count}, (_,i) => ({sprite:`wp-smith-walk-${dir}-${i+1}`, duration:count===4?190:280})),
 loop:true, authored:true, motion:'none', direction:dir==='e'?'east; mirror for west':dir==='s'?'south':'north',
};
ANIMATION_CLIPS['wp-smith-address'] = {
 frames:[{sprite:'wp-smith-speak',duration:850},{sprite:'wp-smith-exhort',duration:1000}],
 loop:true, authored:true, motion:'none', direction:'east; mirror for west',
};
export const promptEntries = [{
 sheet:'famous-wp-smith', promptId:'frontier-v1/famous-wp-smith', tool:'built-in image_gen.imagegen', mode:'generate-and-refine',
 prompt:"Create NEW original interpretive Reverend W. P. Smith, Texas Revolution Gonzales 1835, transparent game character atlas. Reference STYLE ONLY warm hand-painted outlined storybook frontier game, olive brown thin contours, subdued earth colors, slightly elevated three-quarter view, readable small stylized adult. Different identity than Austin reference: older lean man, long narrow face, short GREY hair and neat grey sideburns clean shaven, dark charcoal broad brim felt hat, warm brown long civilian frock coat, muted rust waistcoat, offwhite cravat, dark brown trousers dark boots. No military insignia no modern clerical collar no weapons. Costume and face are interpretive not exact portrait. STRICT 4 columns4rows exactly16 isolated fullbody sprites, each <=75%cellheight, <=75%width, center in equal cells and baseline, 30px transparent gutters between every row and column. Row1 FOUR EAST walking phases strongly different leg positions: left forward contact, left planted right knee bent passing, RIGHT forward contact opposite arm swing, right planted left knee bent passing. Row2 TWO SOUTH walk frames then TWO NORTH walk frames. Row3 east idle, east speech palm raised at chest, east speech open hand out exhortation, east listening hands relaxed. Row4 east holding closed small brown book, east reading open book no lettering, east restrained pointing, seated rest stool. Full feet hats props preserved, constant scale consistent costume and face. No text grid labels ground shadows background firing blood. True transparent alpha. Match existing painted game style, not 3D photorealistic or pixel art.", refinementPrompt:undefined,
 referenced_image_paths:['C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/famous-austin.png'],
 originalSourcePath:'C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-3170a652-8dd8-43dc-a059-6d7b5d776dfa.png',
 generatedSourcePath:'C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/exec-b31c06e2-e7e9-4776-a17b-9a37ad196c33.png', runtimeFile:'public/assets/frontier-v1/atlases/famous-wp-smith.png',
 postProcessing:'None; selected refined PNG copied unchanged.',
 review:'Civilian speaker with original interpreted costume/face. East gait refinement supplies distinct contact and lifted-knee passing poses; the runtime uses the first two. The other two are retained variants, not four unique phases. Book is an optional art prop, not evidence that he held one at Gonzales. No new words, routes or historical outcome.',
}];
export const provenanceEntries=promptEntries.map(({prompt,...entry})=>entry);
export const notes=['W. P. Smith uses his own speech gesture cycle during the existing Gonzales command pose. Book, reading, rest and vertical travel are available for future explicit projected poses. No unwarranted fallen or firing pose was added.'];

