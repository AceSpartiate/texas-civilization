export const SHEETS = {
  'town-buildings-researched': [
    'building-frame-one-storey',
    'building-frame-storey-half',
    'building-frame-two-storey',
    'whiteside-hotel',
    'round-top-house',
    'round-top-house-weathered',
    'jacal-upright-post',
    'jacal-broad',
    'jacal-poor',
    'jacal-ramada',
    'mina-stockade',
    'mina-stockade-open',
    'liberty-court-room',
    'liberty-court-room-side',
    'building-frame-shop',
    'building-frame-residence',
  ],
};

export const ANIMATION_CLIPS = {};

const prompt = `Use case: historical-scene. Asset type: production sprite atlas for a 1835 Texas Revolution top-down town simulation. The two input images are style, palette, scale, outline, lighting and elevated-camera references only; create new historically distinct buildings. Produce one square 1254x1254 PNG, exactly 4 columns x 4 rows, sixteen isolated south-facing building sprites in strict reading order. TRUE transparent RGBA background; no checkerboard, scenery, terrain islands, labels, people, flags, signs, props outside buildings, borders, cell lines, or painted transparency. Keep every complete sprite wholly within its equal cell with at least 18px transparent gutter, ground-contact shadow contained inside the cell, consistent baseline and miniature world scale. Warm hand-illustrated frontier-v1 style: dark earthy brown outlines, restrained ochre wood and mud, weathered materials, clear readable silhouettes, slight elevated front-right view and upper-left light, not photoreal and not fantasy.
Row 1: (1) small one-storey sawn-timber frame building, pale weathered clapboard siding, shingle gable roof, glazed sash window and plank door; (2) storey-and-a-half frame store, taller clapboard walls, attic window in gable, shingle roof, sash windows, plank door; (3) two-storey four-room frame house resembling an early plain Texas civic residence, symmetrical clapboard front, two windows below and two above, centered door, simple shingle roof; (4) Whiteside Hotel of San Felipe: broad storey-and-a-half LOG dog-run house with two rooms flanking a clearly open central passage under one long roof, stick-and-mud chimney at each outer end, rough clapboards/shingles, no porch railing.
Row 2: (1) Round Top House of Victoria: round fortified two-level log or timber structure, heavy vertical-plank door, first-level gun slits, squat defensible silhouette, conical or polygonal shingled roof; (2) same Round Top House alternate weathered angle/condition, still round and fortified with gun slits and heavy door; (3) small upright-post jacal, sticks visible through pale mud daub, thatch gable roof, little door and tiny window; (4) broader jacal variant, uneven upright-post mud walls and thicker thatch roof.
Row 3: (1) narrow poorer jacal, patchy mud daub exposing woven sticks, low thatch roof; (2) jacal with a distinct open brush ramada attached at the front/side, ramada supported by thin posts, hut itself intact; (3) Mina frontier stockade: freestanding compact square enclosure of sharpened vertical logs with a visible gated front and a small log cabin enclosed within, read as one complete compound from the elevated view; (4) same Mina stockade alternate with gate open and enclosed cabin visible, compact complete compound.
Row 4: (1) Liberty Casa Consistorial, a small plain 22-foot-square hewn-log court room, centered plank door, two modest windows, shingle gable roof, civic but unornamented; (2) same Liberty court room alternate side-facing door/window arrangement; (3) simple clapboard commercial building variant with broad double plank shop door and two glazed sash windows; (4) modest one-storey frame residence variant with clapboards, one plank door, two sash windows and a small rear chimney.
Historical constraints: early 1830s Texas frontier construction; no Victorian trim, balconies, modern glass storefronts, brick rowhouse styling, stone castle towers, fantasy palisades, cannons, smoke, vegetation, roads, or background. Round Top House must read round and fortified, not as a normal square storehouse. Whiteside must visibly retain the open dog-run passage and two end chimneys. Stockade must be a complete enclosure, not loose fence segments. Output actual transparent alpha.`;

export const promptEntries = [{
  sheet: 'town-buildings-researched',
  promptId: 'frontier-v1/town-buildings-researched',
  tool: 'built-in image_gen.imagegen',
  mode: 'generate',
  prompt,
  referenced_image_paths: [
    'C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/buildings.png',
    'C:/Users/zachw/Texas Civilization/public/assets/frontier-v1/atlases/architecture-extra.png',
  ],
  generatedSourcePath: 'C:/Users/zachw/.codex/generated_images/01a0c3a8-0bfc-7c70-83c3-234327ddda52/exec-de2ca61f-9999-47fb-89de-c1d6838fb8e8.png',
  runtimeFile: 'public/assets/frontier-v1/atlases/town-buildings-researched.png',
  postProcessing: 'None. Original built-in imagegen PNG copied byte-for-byte; read-only alpha and atlas-bound validation only.',
  review: 'Sixteen clean south-facing structures. Distinct frames, Whiteside dog-run, two Round Top variants, four jacales, two Mina stockades, two Liberty court-room views, and two additional frame-building variants.',
}];

export const provenanceEntries = promptEntries;

export const notes = [
  'Town-building sprites are presentation assets. Town identity, ownership, access, destruction, and interior navigation remain authoritative simulation state.',
  'Round Top House and named civic buildings are historically informed silhouettes for classroom play, not claims of measured surviving elevations.',
];
