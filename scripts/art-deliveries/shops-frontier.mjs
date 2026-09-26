// Three distinct, transparent 1835 trade buildings for towns beyond Gonzales.
// The reference atlas is used only for style and scale; the game receives the
// reviewed PNGs in public/assets/frontier-v1/atlases/.
const reference = 'C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/buildings.png';
const generated = 'C:/Users/zachw/.codex/generated_images/01a082eb-77f7-7f73-8400-ebcc7426ac7b/';
const shops = {
  'shop-blacksmith': {
    source: 'exec-2a9da188-c973-4c52-a571-52c74aed36e9.png',
    original: 'exec-e0f97830-ba1b-47dc-bf5f-385bd985235e.png',
    prompt: 'One transparent 1835 Texas frontier blacksmith forge shed in the established buildings-atlas style: open log-and-plank front, anvil, leather bellows, low stone forge, modest smoke, warm hand-inked outlines and watercolor wood texture, elevated three-quarter view, no lettering or modern tools. Edit removed only the original background vignette.',
    review: 'Anvil, bellows and forge remain legible when the shop is reduced to town scale; genuine alpha beyond the silhouette.',
  },
  'shop-wheelwright': {
    source: 'exec-e1e35e07-a7c5-499f-a605-ba7a7699a09f.png',
    prompt: 'One transparent 1835 Texas wheelwright timber shop in the established buildings-atlas style: open front, wagon wheels by the doorway, unfinished wheel and spokes at a bench, shaving horse, warm hand-inked outlines, elevated three-quarter view. No forge, lettering, modern parts or scenery.',
    review: 'Wheels read independently of the blacksmith forge and ordinary timber shop at town scale; genuine alpha.',
  },
  'shop-tavern': {
    source: 'exec-09f89de7-59ee-474d-bc77-915bebe8bd96.png',
    prompt: 'One transparent modest two-pen 1835 Texas log tavern in the established buildings-atlas style: short shaded front gallery, two plank doors, rough benches, water barrel, low shingle roof, warm hand-inked outlines, elevated three-quarter view. No lettering, people or scenery.',
    review: 'Two-bay gallery and benches distinguish it from a cabin; genuine alpha and no invented signage.',
  },
};

export const SHEETS = Object.fromEntries(Object.keys(shops).map(name => [name, [name]]));
export const ANIMATION_CLIPS = {};
export const promptEntries = Object.entries(shops).map(([sheet, item]) => ({
  sheet, promptId: `frontier-v1/${sheet}`, tool: 'built-in image_gen.imagegen',
  mode: item.original ? 'edit' : 'generate', prompt: item.prompt,
  referenced_image_paths: item.original ? [`${generated}${item.original}`] : [reference],
  generatedSourcePath: `${generated}${item.source}`,
  runtimeFile: `public/assets/frontier-v1/atlases/${sheet}.png`,
  postProcessing: 'None. Generated RGBA PNG copied unchanged; alpha bounds measured by the atlas build.',
  review: item.review,
}));
export const provenanceEntries = promptEntries.map(({ prompt, ...entry }) => entry);
export const notes = ['Three town trade buildings replace repeated generic sprites. Existing building stillness is intentional; future forge fire and smoke should use a separate effect layer.'];
