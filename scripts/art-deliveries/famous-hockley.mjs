// Original game interpretation of George W. Hockley; not a portrait claim.
const root = 'C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/';
export const SHEETS = {
  'famous-hockley': [
    ...[1, 2, 3, 4].map(n => `hockley-walk-e-${n}`),
    ...[1, 2].map(n => `hockley-walk-s-${n}`),
    ...[1, 2].map(n => `hockley-walk-n-${n}`),
    'hockley-idle', 'hockley-point', 'hockley-fire-signal', 'hockley-observe',
    'hockley-brace', 'hockley-reload-signal', 'hockley-plan', 'hockley-speak',
  ],
};
export const ANIMATION_CLIPS = {};
for (const [dir, count] of [['e', 4], ['s', 2], ['n', 2]]) ANIMATION_CLIPS[`hockley-walk-${dir}`] = {
  frames: Array.from({ length: count }, (_, i) => ({ sprite: `hockley-walk-${dir}-${i + 1}`, duration: count === 4 ? 190 : 290 })),
  loop: true, authored: true, motion: 'none', direction: dir === 'e' ? 'east; mirror for west' : dir === 's' ? 'south' : 'north',
};
ANIMATION_CLIPS['hockley-battery-command'] = {
  frames: [{ sprite: 'hockley-point', duration: 470 }, { sprite: 'hockley-fire-signal', duration: 300 }, { sprite: 'hockley-brace', duration: 330 }],
  loop: true, authored: true, motion: 'none', direction: 'east; mirror for west',
};
export const promptEntries = [{
  sheet: 'famous-hockley', promptId: 'frontier-v1/famous-hockley', tool: 'built-in image_gen.imagegen', mode: 'generate',
  prompt: 'Transparent 4x4 painterly Texas Revolution game atlas of original interpretive George W. Hockley, lean middle-aged artillery commander with a dark graying beard, brown wide-brim hat, slate-blue officer coat, tan waistcoat, ivory shirt, narrow red neckcloth and brown trousers. Four east walks, two south, two north, then idle, point battery, signal fire, observe, brace, signal reload, kneel over sketch, speak to crew. Same full-body identity, alpha gutters; no background, text, cannon, other figure or exact portrait claim.',
  generatedSourcePath: `${root}exec-e87b0e68-bd51-47ac-a345-38a01b892dc3.png`, runtimeFile: 'public/assets/frontier-v1/atlases/famous-hockley.png',
  postProcessing: 'None. Copied unchanged; atlas builder measures alpha components and reading-order cells.',
  review: 'A command-and-brace cycle at the Twin Sisters, distinct from a gunner physically loading or ramming a cannon. Outfit and face are interpretive.',
}];
export const provenanceEntries = promptEntries.map(({ prompt, ...entry }) => entry);
export const notes = ['Hockley has directional walking and a three-frame battery command cycle at San Jacinto. McCulloch and the generic crew retain physical gun-service actions.'];
