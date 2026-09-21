// Accepted unchanged built-in imagegen original. Integration owns renderer binding and central manifest writes.
const cast = ['rust', 'teal', 'elder', 'blue'];
const directions = ['s', 'e', 'w', 'n'];

export const SHEETS = {
  'people-wagon-drivers': cast.flatMap(person => directions.map(direction => `${person}-wagon-driver-${direction}`)),
};

export const ANIMATION_CLIPS = {};
for (const person of cast) {
  for (const direction of directions) {
    const id = `${person}-wagon-driver-${direction}`;
    ANIMATION_CLIPS[id] = {
      frames: [{ sprite: id, duration: 2200 }],
      loop: true,
      authored: false,
      motion: 'breathe',
      direction: ({ s: 'south', e: 'east', w: 'west', n: 'north' })[direction],
    };
  }
}

const generatedSourcePath = 'C:/Users/zachw/.codex/generated_images/01a0c4b1-bf5a-7a01-a980-e8baee7bf876/exec-4d464c1d-34ad-4a20-8afd-312f1fd8302f.png';
const prompt = 'Use case: historical-scene. Asset type: production transparent character-layer sprite atlas for an elevated three-quarter-view 1835 Texas classroom game. Image 1 is the strict identity, clothing, proportions, outline, palette, shading, and sprite-scale reference. Image 2 is ONLY a style and wagon-seat geometry reference; DO NOT draw any wagon, wheel, ox, harness, cargo, or wagon part. Create a square 1254 by 1254 PNG with genuine RGBA alpha transparency, strict 4 columns by 4 rows, exactly sixteen isolated SEATED DRIVER figures, one centered in each equal cell, generous fully transparent gutters, no overlap or cropping, no grid, labels, text, checkerboard, scenery, ground, shadows, extra people, horses, wagons, wheels, oxen, or floating duplicate equipment. Preserve these exact Image 1 identities by row: ROW 1 rust-shirt bearded adult man with broad brown hat, black neckerchief, suspenders and tan trousers; ROW 2 brown-skinned adult woman with pinned dark hair, muted teal blouse, cream apron and ochre skirt; ROW 3 elderly dark-skinned man with gray beard, brown hat, cream shirt, olive waistcoat and brown trousers; ROW 4 clean-shaven younger man with tousled dark hair, muted blue shirt, suspenders and tan trousers. Every person is shown seated on an INVISIBLE wagon bench, complete from head through hips and bent knees/boots where visible, with hands naturally controlling two thin brown leather reins that exit toward the direction of travel and a short period-plausible wooden ox goad held low in one hand. Reins and goad must stay connected to hands and fully inside each cell. Fixed column directions in EVERY row: COLUMN 1 faces SOUTH/toward viewer, seated frontal three-quarter posture, reins extend downward; COLUMN 2 faces EAST/screen-right in clear side view, reins extend right; COLUMN 3 faces WEST/screen-left in true side view, reins extend left; COLUMN 4 faces NORTH/away from viewer in clear full back view, reins extend upward. Do not mirror-identify clothing errors; preserve hats, hair, beard, apron, suspenders, and waistcoat consistently through every direction. These are composited OVER an existing wagon, so keep the lower silhouette compact, no visible chair or bench, and no background vehicle. Same head size and apparent scale across all sixteen cells, consistent seated hip anchor and bottom baseline within every row. Warm hand-painted miniature storybook game art with dark brown crisp contours, simple readable forms, muted rust/teal/ochre/olive/blue palette, dignified historically plausible clothing. True transparent alpha in every empty pixel; no matte.';
const record = {
  sheet: 'people-wagon-drivers',
  promptId: 'frontier-v1/people-wagon-drivers',
  tool: 'built-in image_gen.imagegen',
  mode: 'generate with two project references',
  generatedSourcePath,
  runtimeFile: 'public/assets/frontier-v1/atlases/people-wagon-drivers.png',
  prompt,
  postProcessing: 'None. Accepted RGBA PNG copied byte-for-byte from the built-in imagegen output.',
  review: 'Accepted as sixteen vehicle-free seated driver layers: four original-cast identities by south/east/west/north heading, with attached reins and short goad.',
};

export const promptEntries = [record];
export const provenanceEntries = [{
  ...record,
  references: [
    'public/assets/frontier-v1/atlases/civilians.png',
    'public/assets/frontier-v1/atlases/wagon-rig.png',
  ],
}];

export const notes = [
  '2026-09-21: Sixteen original-cast seated ox-wagon driver layers, four identities by four headings. The atlas contains no wagon or ox; those remain the existing composited rig.',
  'Reins and short goads are part of each driver silhouette. Renderer binding should replace seatedClip for wagon seats while retaining seatLayout for team, wagon, depth order, and anchor geometry.',
  'Read-only buildManifest/buildAnimations validation: 1254x1254 RGBA, 63.0167% fully transparent pixels, clear outer corners, 16 extracted frames, 16 clips, zero overlap pixels trimmed, and 100% visible pixels retained in every frame. SHA256 ea29de92502021ad58aef7dffaaf2647e8943f81d32ad35062d7ee73a1a3b123.',
];
