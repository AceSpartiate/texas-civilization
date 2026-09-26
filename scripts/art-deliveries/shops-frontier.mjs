// Distinct, transparent 1835 trade buildings for towns beyond Gonzales.
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
  'shop-mill': {
    source: 'exec-dd3b7c3d-a26a-4033-b630-ef4fc1452351.png',
    prompt: 'One transparent 1835 Texas horse-powered gristmill in the established buildings-atlas style: low log-and-timber mill house, wide doorway and visible millstone, simple wooden horse sweep, warm hand-inked outlines, elevated three-quarter view. No water wheel, lettering, people or scenery.',
    review: 'Millstone and horse sweep distinguish the mill from a storehouse; genuine alpha beyond the silhouette.',
  },
  'shop-tanner': {
    source: 'exec-b44c762a-8bb4-42eb-a5c5-d77e27a2dcd3.png',
    prompt: 'One transparent 1835 Texas tanner open-sided timber shed in the established buildings-atlas style: two stretched hides on frames, shallow bark-tanning pit and leather straps, warm hand-inked outlines, elevated three-quarter view. No people, lettering or scenery.',
    review: 'Hide frames and pit identify the trade; genuine alpha beyond the silhouette.',
  },
  'shop-weaver': {
    source: 'exec-9f2e2934-fc6d-4754-8c8d-9f7add36f8c7.png',
    prompt: 'One transparent 1835 Texas weaver log shop in the established buildings-atlas style: broad open doorway with handloom and partly woven cloth, spinning wheel under the eave, short clothesline of dyed fabric, warm hand-inked outlines, elevated three-quarter view. No people, lettering or scenery.',
    review: 'Loom and cloth line identify the trade; genuine alpha beyond the silhouette.',
  },
  'shop-carpenter': {
    source: 'exec-956bd971-c77b-4b52-9eb9-0c1622007571.png',
    prompt: 'One transparent 1835 Texas carpenter open timber shed in the established buildings-atlas style: broad bench, sawhorse, hand plane, rough planks and a half-built door, warm hand-inked outlines, elevated three-quarter view. No people, letters, modern tools or scenery.',
    review: 'Planks and hand-work bench distinguish the trade from a generic shed; genuine alpha.',
  },
  'shop-gunsmith': {
    source: 'exec-30e49900-751a-4002-be92-0ede4f7b5b0e.png',
    prompt: 'One transparent 1835 Texas gunsmith log shop in the established buildings-atlas style: low roof, open door, eave bench with period hand tools and flintlock long gun, pictorial rifle-shaped sign, warm hand-inked outlines, elevated three-quarter view. No forge, people, letters, modern firearms or scenery.',
    review: 'Workbench and pictorial musket sign distinguish it from the smithy; genuine alpha.',
  },
  'shop-doctor': {
    source: 'exec-a635faad-d623-4de7-a794-31c1a83d1be7.png',
    prompt: 'One transparent modest 1835 Texas doctor hewn-log office in the established buildings-atlas style: open doorway with simple table and medicine jars, tiny pictorial mortar-and-pestle shingle, warm hand-inked outlines, elevated three-quarter view. No red cross, people, letters or scenery.',
    review: 'Mortar-and-pestle shingle and jars signal the medical role without an anachronistic red cross; genuine alpha.',
  },
  'shop-stockman': {
    source: 'exec-95351455-bb3d-4580-b830-b13220ed8857.png',
    prompt: 'One transparent 1835 Texas stockman rail pen in the established buildings-atlas style: rectangular split-rail enclosure, gate, snubbing post, trough and tiny shelter, open interior for separately animated livestock, warm hand-inked outlines, elevated three-quarter view. No baked-in animals, people, lettering or scenery.',
    review: 'Pen remains readable at town scale; empty interior reserves room for existing animated horse and cow actors rather than freezing animals into architecture.',
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
export const notes = ['Ten town trade buildings replace generic sprites. Existing building stillness is intentional; future forge fire and smoke should use a separate effect layer. The stock pen has no baked-in livestock so animated animals can occupy it.'];
