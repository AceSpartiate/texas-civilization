// Area D (docs/CLAUDE_ART_PLAN.md): animals without a rider, drawn by Claude on 2026-09-28 - temporary, each frame to be
// replaced by Astra's of the same name.
//   D1   the milk cow on the run (`milk-cow-walk-e/-n/-s`, `milk-cow-graze`), a rope trailing from her horns
//   D11  the horse herd driven off at San Patricio and Agua Dulce (`herd-drove`, `herd-scatter`)
//   D12  the Grass Fight's pack train (`mule-packed-grass-walk-*`) and mules at a gun's limber, a driver riding the near one
//        (`limber-mules-walk`)
// All from the four-legged rig (kit/quadruped.mjs): the same jointed legs and gaits as the horse, the cattle's own frame.
import { animalFrame, groupFrame, placed, drawMounted, MOUNTED_LOGICAL } from '../kit/horse.mjs';
import { COATS, quadPose, drawQuadSide, drawQuadFrontal } from '../kit/quadruped.mjs';
import { UNIT, LINE, tone } from '../kit/style.mjs';
import { add, capsule, ellipse, blob, curve, poly, lerp } from '../kit/svg.mjs';
import { grass, grassEnd } from '../kit/loads.mjs';
import { CAST } from '../kit/style.mjs';

export const AREA = 'transport';
export const DATE = '2026-09-28';

const RES = 0.5, half = c => ({ w: c.w * RES, h: c.h * RES });
const STYLE = 'Warm hand-drawn storybook style, thin dark olive-brown outline, flat shade to the lower right, slightly elevated north-up three-quarter view; transparent ground, no shadow, no text.';

// --------------------------------------------------------------------------------------------------- D1 the milk cow
// Drawn so her whole height (horn tips) is the frame's logical height, as the range longhorn's `cattle-longhorn-*` frames are,
// so the page draws her at the longhorn's size (public/app.js draws the cow at 1.2 of a person).
const COW = { w: 620, h: 380 }, COW_UNITS = 108;
const cowFrame = (name, o) => animalFrame(name, 'cow', { logical: 300, heightUnits: COW_UNITS, cell: COW, groundY: COW.h - 26, originX: o.view && o.view !== 'e' ? COW.w / 2 : 290, coat: COATS.milk, res: RES, opts: { rope: true }, ...o });
const COW_WHO = 'The family\'s milk cow of the 1830s - a gentle, lighter-boned brown-and-white cow with short curved horns and a full udder, not a range longhorn - with a rope made fast round her horns and trailing loose, as a child leads her behind the family on the Runaway Scrape';
const cowWalkE = [0, 1, 2, 3].map(i => ({ name: `milk-cow-walk-e-${i + 1}`, height: 1.2, compare: [['cattle-longhorn-red-1', 1.2], ['cow-walk-1', 1.2]],
  prompt: `${COW_WHO}: walking east (west mirrored), frame ${i + 1} of 4 of the cattle's four-beat walk, the head nodding. ${STYLE}`,
  draw: () => cowFrame(`milk-cow-walk-e-${i + 1}`, { frame: i, note: `the milk cow walking east, frame ${i + 1} of 4` }) }));
const cowWalkV = view => [0, 2].map((f, i) => ({ name: `milk-cow-walk-${view}-${i + 1}`, height: 1.2, compare: [[`cow-walk-${view}-1`, 1.2]],
  prompt: `${COW_WHO}: walking ${view === 's' ? 'toward the camera' : 'away from the camera'}, frame ${i + 1} of 2. ${STYLE}`,
  draw: () => cowFrame(`milk-cow-walk-${view}-${i + 1}`, { view, frame: f, note: `the milk cow walking ${view}, frame ${i + 1} of 2` }) }));
const cowGraze = [0, 1].map(i => ({ name: `milk-cow-graze-${i + 1}`, height: 1.2, compare: [['cattle-longhorn-red-3', 1.2], ['cow-graze-1', 1.2]],
  prompt: `${COW_WHO}: grazing at the camp, facing east, her head down to the grass, ${i ? 'tearing a mouthful, the tail flicked' : 'reaching'}; the rope lying on the ground. ${STYLE}`,
  draw: () => cowFrame(`milk-cow-graze-${i + 1}`, { graze: true, poseOpts: { head: i ? -4 : 2, tailSwing: i ? 6 : 0 }, note: `the milk cow grazing, frame ${i + 1} of 2` }) }));

// --------------------------------------------------------------------------------------------------- D11 the herd driven off
// One horse's height (poll to hoof, about 147 rig units) is the frame's logical height, so the page can draw the herd sprite
// at the size it draws one `mustang-gallop` (public/battle-view.js `drawHerd`, 1.15 of a person) and every horse in it is a
// mustang's size.
const HERD = { w: 1400, h: 620 }, HERD_UNITS = 147;
const HERD_COATS = [COATS.dun, COATS.bay, COATS.sorrel, COATS.black, COATS.grey, COATS.chestnut, COATS.mouse];
const HERDING = [[-230, 70], [-60, 78], [120, 74], [-150, 46], [30, 50], [200, 42], [-250, 20], [-90, 24], [80, 18], [240, 12], [-170, -4], [0, -6], [160, -8]];
const herdDrove = [0, 1, 2, 3].map(i => ({ name: `herd-drove-${i + 1}`, height: 1.15, compare: [['mustang-gallop-1', 1.15], ['mustang-gallop-5', 1.15]],
  prompt: `Several hundred horses driven off at the gallop as one mass, seen as a dozen or so packed close in rows going back into the distance - dun, bay, sorrel, black, grey - east (west mirrored), frame ${i + 1} of 4 of the gallop, each horse at its own phase. No riders, no tack, no dust painted. ${STYLE}`,
  draw: () => groupFrame(`herd-drove-${i + 1}`, { cell: HERD, originX: HERD.w / 2, groundY: HERD.h - 30, logical: Math.round(HERD_UNITS * UNIT), res: RES, note: `the herd driven off, frame ${i + 1} of 4` }, ink => {
    HERDING.map((p, n) => ({ p, n })).sort((a, b) => b.p[1] - a.p[1]).forEach(({ p, n }) =>
      placed(ink, p[0], p[1], sub => drawQuadSide(sub, 'horse', quadPose('horse', { gait: 'gallop', frame: i + ((n * 0.37) % 1) * 4 }), { coat: HERD_COATS[n % HERD_COATS.length] })));
  }) }));
const SCATTER = [[-250, 40, 1], [-20, 70, -1], [210, 30, 1], [-140, 0, -1], [110, -10, 1], [300, 64, 1], [-330, 70, -1]];
const herdScatter = [0, 1, 2, 3].map(i => ({ name: `herd-scatter-${i + 1}`, height: 1.15, compare: [['mustang-gallop-1', 1.15], ['mustang-alert-1', 1.15]],
  prompt: `The same herd broken and scattering: seven horses running apart, some turned back the other way, spread wide with ground between them, frame ${i + 1} of 4 of the gallop. ${STYLE}`,
  draw: () => groupFrame(`herd-scatter-${i + 1}`, { cell: { w: 1600, h: 620 }, originX: 800, groundY: 590, logical: Math.round(HERD_UNITS * UNIT), res: RES, note: `the herd scattering, frame ${i + 1} of 4` }, ink => {
    SCATTER.map((p, n) => ({ p, n })).sort((a, b) => b.p[1] - a.p[1]).forEach(({ p, n }) =>
      // Some turned back the other way: the same horse drawn mirrored about its own middle.
      placed(ink, p[0], p[1], sub => drawQuadSide(sub, 'horse', quadPose('horse', { gait: 'gallop', frame: i + ((n * 0.41) % 1) * 4 }), { coat: HERD_COATS[(n + 2) % HERD_COATS.length] }), { flip: p[2] < 0 }));
  }) }));

// --------------------------------------------------------------------------------------------------- D12 the pack mules and the limber
// Mules at the horse's scale (`horse-walk` is drawn at 1.5 of a person): the frame's logical height is a horse's poll height.
const MULE = { w: 600, h: 420 }, MULE_UNITS = 147;
const MULE_WHO = 'A pack mule of the Mexican train at the Grass Fight (November 26, 1835) - a mouse-brown mule with long ears, a roached mane and a tufted tail, on a halter - loaded high on a pack saddle with bundles of cut grass for the horses at Béxar, the load the Texians took for silver';
const muleFrame = (name, o) => animalFrame(name, 'mule', { logical: Math.round(MULE_UNITS * UNIT), heightUnits: MULE_UNITS, cell: MULE, groundY: MULE.h - 26, originX: o.view && o.view !== 'e' ? MULE.w / 2 : 280, coat: COATS.mouse, res: RES,
  opts: o.view && o.view !== 'e' ? { halter: true, pack: grassEnd } : { halter: true, pack: grass }, ...o });
const muleSets = ['e', 's', 'n'].map(view => [0, 1, 2, 3].map(i => ({ name: `mule-packed-grass-walk-${view}-${i + 1}`, height: 1.5, compare: [[view === 'e' ? 'horse-walk-1' : `horse-walk-${view}-1`, 1.5], ['ox-packed-walk-e-1', 1.45]],
  prompt: `${MULE_WHO}: walking ${view === 'e' ? 'east (west mirrored)' : view === 's' ? 'toward the camera' : 'away from the camera'}, frame ${i + 1} of 4 of the walk. ${STYLE}`,
  draw: () => muleFrame(`mule-packed-grass-walk-${view}-${i + 1}`, { view, frame: i, note: `a pack mule under grass, ${view}, frame ${i + 1} of 4` }) })));
// Two mules in harness at a light gun's limber, a driver in the Mexican artillery's dark coat riding the near wheel mule, the
// limber's two wheels turning behind: the artillery's own draught mules taking a gun away.
const LIMBER = { w: 1200, h: 520 };
const DRIVER = { ...CAST.regular, hat: { kind: 'shako', colour: '#2a2a30', band: '#b8342a' } };
function limberFrame(i) {
  return groupFrame(`limber-mules-walk-${i + 1}`, { cell: LIMBER, originX: 560, groundY: LIMBER.h - 28, logical: Math.round(MULE_UNITS * UNIT), res: RES, note: `mules at a limber, frame ${i + 1} of 4` }, ink => {
    // The far mule, the limber (a chest on two wheels and its pole), then the near mule with the driver astride.
    placed(ink, 20, 10, sub => drawQuadSide(sub, 'mule', quadPose('mule', { gait: 'walk', frame: i + 2 }), { coat: { ...COATS.mouse, coat: '#6e5e4c' }, halter: true }));
    const wheel = [-150, 30], r = 30, turn = i * 22.5;
    ink.shape(poly([[-190, 40], [-190, 74], [-110, 74], [-110, 40]]), '#6a5a3a', { off: 1.4 });
    ink.shape(poly([[-192, 72], [-108, 72], [-110, 80], [-190, 80]]), '#5a4a30', { shade: false, outline: LINE.inner });
    ink.line(`M -110 46 L 28 52`, { width: 5, colour: '#7a5a34' });
    ink.shape(ellipse(wheel, r, r), '#8a6a3e', { shade: false, outline: LINE.outer });
    ink.line(ellipse(wheel, r - 4, r - 4), { width: LINE.inner });
    for (let k = 0; k < 6; k++) { const a = (turn + k * 30) * Math.PI / 180; ink.line(`M ${wheel[0] - Math.cos(a) * (r - 4)} ${wheel[1] - Math.sin(a) * (r - 4)} L ${wheel[0] + Math.cos(a) * (r - 4)} ${wheel[1] + Math.sin(a) * (r - 4)}`, { width: 2.8, colour: '#5a4020' }); }
    ink.shape(ellipse(wheel, 6, 6), '#3a3a36', { shade: false, outline: LINE.inner });
    drawMounted(ink, DRIVER, i, { species: 'mule', coat: COATS.mouse, tack: true, blanket: '#5a4a30' });
    ink.line(`M 0 60 C -40 58 -80 54 -110 52`, { width: 2.6, colour: '#3e2816' });
  });
}
const limber = [0, 1, 2, 3].map(i => ({ name: `limber-mules-walk-${i + 1}`, height: 1.5, compare: [['horse-walk-1', 1.5], ['twin-sisters-limbered-1', 1.5]],
  prompt: `Two draught mules in harness taking a light gun's limber away east (west mirrored), a Mexican artilleryman in a dark blue coat and shako riding the near mule, the limber's two spoked wheels turning, frame ${i + 1} of 4 of the walk. ${STYLE}`,
  draw: () => limberFrame(i) }));

const loop = (frames, ms, direction, prompt, extra = {}) => ({ frames: frames.map(f => ({ sprite: f.name, duration: ms })), loop: true, motion: 'none', direction, prompt, ...extra });
// Retired 2026-10-03 when Astra's own art of the same names was merged (Astra's art wins): the Grass Fight's pack mules (`mule-packed-grass-walk-*`).
export const SHEETS = {
  'claude-milk-cow': { cell: half(COW), columns: 4, request: 'Request 2026-09-27 — the milk cow on the run, and Béxar before the bell', replaceWith: 'item 1: a gentle dairy cow with a rope trailing from her horns, 4 frames east, 2 north and south, 2 grazing, at the cattle\'s logical height',
    frames: [...cowWalkE, ...cowWalkV('n'), ...cowWalkV('s'), ...cowGraze] },
  'claude-herd': { cell: half(HERD), columns: 2, request: 'Request 2026-09-25 — the south\'s fights: San Patricio by night and Agua Dulce Creek', replaceWith: 'item 4: several hundred horses moving as one mass, 4 frames, and scattering, at the mustangs\' scale',
    frames: herdDrove },
  'claude-herd-scatter': { cell: half({ w: 1600, h: 620 }), columns: 2, request: 'Request 2026-09-25 — the south\'s fights: San Patricio by night and Agua Dulce Creek', replaceWith: 'item 4: the herd scattering, at the mustangs\' scale',
    frames: herdScatter },
  'claude-limber': { cell: half(LIMBER), columns: 2, request: 'Request 2026-09-25 — Concepción and the Grass Fight', replaceWith: 'item 8: mules at a gun\'s limber, a driver riding the near one, 4 frames east',
    frames: limber },
};
export const CLIPS = {
  'milk-cow-walk-e': loop(cowWalkE, 260, 'east; west by mirroring', 'The milk cow walking east on her rope: a four-frame walk loop, a little slower than the horse.'),
  'milk-cow-walk-n': loop(cowWalkV('n'), 320, 'north', 'The milk cow walking away from the camera on her rope: two frames.'),
  'milk-cow-walk-s': loop(cowWalkV('s'), 320, 'south', 'The milk cow walking toward the camera on her rope: two frames.'),
  'milk-cow-graze': { frames: [{ sprite: 'milk-cow-graze-1', duration: 900 }, { sprite: 'milk-cow-graze-2', duration: 700 }], loop: true, motion: 'none', direction: 'east; west by mirroring', prompt: 'The milk cow grazing at the camp: reach and tear, slowly.' },
  'herd-drove': loop(herdDrove, 130, 'east; west by mirroring', 'The herd driven off at the gallop as one mass: a four-frame loop.'),
  'herd-scatter': loop(herdScatter, 130, 'east; west by mirroring', 'The herd scattering, some turned back: a four-frame loop.'),
  'limber-mules-walk': loop(limber, 230, 'east; west by mirroring', 'Mules at a gun\'s limber walking east, a driver riding the near one: a four-frame loop.'),
};
