// Area D (docs/CLAUDE_ART_PLAN.md): the family's mule, drawn by Claude on 2026-10-03 - temporary, each frame to be replaced by
// Astra's of the same name.
//   D19  the mule a family buys at the stock pens (owner, 2026-10-03: "we should also add the ability to buy a mule in town. mules
//        were a lot cheaper than horses."; sim/beasts.mjs, docs/TOWNS.md §4h): led home and standing in the yard on its halter
//        (`mule-walk-e/-s/-n`, `mule-idle`), and saddled under a rider (`mule-saddled-walk-e/-s/-n`) - the rider is the person's own
//        figure laid over it by the page (public/app.js `drawSeated`), as a child on the horse was before its own art.
// The same four-legged rig as the Grass Fight's pack mules (transport-animals.mjs, D12), at the horse's scale: `horse-walk` is drawn
// at 1.5 of a person, and the frame's logical height is a horse's poll height, so the page draws the mule at the horse's size.
import { animalFrame } from '../kit/horse.mjs';
import { COATS } from '../kit/quadruped.mjs';
import { UNIT } from '../kit/style.mjs';

export const AREA = 'transport';
export const DATE = '2026-10-03';

const RES = 0.5, half = c => ({ w: c.w * RES, h: c.h * RES });
const STYLE = 'Warm hand-drawn storybook style, thin dark olive-brown outline, flat shade to the lower right, slightly elevated north-up three-quarter view; transparent ground, no shadow, no text.';
const MULE = { w: 600, h: 420 }, MULE_UNITS = 147;
// A darker brown than the Mexican train's mouse-coloured mules, so the family's mule is not one of theirs, and never the chestnut horse.
const COAT = { ...COATS.mouse, coat: '#6e5a46', belly: '#a8947a' };
const WHO = 'The family\'s own mule, bought at the stock pens in 1835 - a brown mule with long ears, a light muzzle and belly, a roached mane and a tufted tail';
const VIEW_WORDS = { e: 'walking east (west mirrored)', s: 'walking toward the camera', n: 'walking away from the camera' };
const frame = (name, view, i, opts, note) => animalFrame(name, 'mule', { logical: Math.round(MULE_UNITS * UNIT), heightUnits: MULE_UNITS, cell: MULE, groundY: MULE.h - 26,
  originX: view !== 'e' ? MULE.w / 2 : 280, coat: COAT, res: RES, view, frame: i, opts, note });

const walkSet = (base, opts, what) => ['e', 's', 'n'].map(view => [0, 1, 2, 3].map(i => ({
  name: `${base}-${view}-${i + 1}`, height: 1.5, compare: [[view === 'e' ? 'horse-walk-1' : `horse-walk-${view}-1`, 1.5], [`mule-packed-grass-walk-${view}-1`, 1.5]],
  prompt: `${WHO}, ${what}: ${VIEW_WORDS[view]}, frame ${i + 1} of 4 of the walk, the long ears nodding. ${STYLE} Claude-drawn stand-in, temporary: replace with Astra's ${base}-${view}-${i + 1}.`,
  draw: () => frame(`${base}-${view}-${i + 1}`, view, i, opts, `the family's mule ${what}, ${view}, frame ${i + 1} of 4`),
})));
// Led home or walking in the yard: a rope halter and nothing else.
const walk = walkSet('mule-walk', { halter: true }, 'on a rope halter, led');
// Under a rider: a bridle and a plain saddle on a brown blanket - the family's saddle, or one borrowed with the mule.
const saddled = walkSet('mule-saddled-walk', { tack: true, saddle: true, blanket: '#7a5a34' }, 'bridled and saddled, carrying a rider (the rider is drawn by the game)');
const idle = [{ name: 'mule-idle-1', height: 1.5, compare: [['horse-chestnut', 1.5], ['mule-packed-grass-walk-e-1', 1.5]],
  prompt: `${WHO}, standing at rest in the yard on its halter, side-on facing east (west mirrored), one hind hoof cocked. ${STYLE} Claude-drawn stand-in, temporary: replace with Astra's mule-idle.`,
  draw: () => animalFrame('mule-idle-1', 'mule', { logical: Math.round(MULE_UNITS * UNIT), heightUnits: MULE_UNITS, cell: MULE, groundY: MULE.h - 26, originX: 280, coat: COAT, res: RES, opts: { halter: true }, note: 'the family\'s mule standing in the yard' }) }];

const REQUEST = 'Request 2026-10-03 — riders in every vehicle';
const loop = (frames, ms, direction, prompt) => ({ frames: frames.map(f => ({ sprite: f.name, duration: ms })), loop: true, motion: 'none', direction, prompt });
const DIRECTION = { e: 'east; west by mirroring', s: 'south', n: 'north' };
export const SHEETS = {
  'claude-family-mule': { cell: half(MULE), columns: 4, request: REQUEST, replaceWith: 'item 1: the family\'s mule on its halter, east, north and south, 4 frames each, and standing, at the scale of horse-walk',
    frames: [...walk.flat(), ...idle] },
  'claude-family-mule-saddled': { cell: half(MULE), columns: 4, request: REQUEST, replaceWith: 'item 1: the family\'s mule bridled and saddled, east, north and south, 4 frames each, at the scale of horse-walk (the rider in Astra\'s own items 2-3)',
    frames: saddled.flat() },
};
export const CLIPS = {
  'mule-idle': { frames: [{ sprite: 'mule-idle-1', duration: 1200 }], loop: true, motion: 'none', direction: 'east; west by mirroring', prompt: 'The family\'s mule standing at rest in the yard on its halter, one hind hoof cocked: a held frame.' },
  'mule-walk': loop(walk[0], 230, DIRECTION.e, 'The family\'s mule walking east on its halter: a four-frame loop.'),
  ...Object.fromEntries(['e', 's', 'n'].map((view, k) => [`mule-walk-${view}`, loop(walk[k], 230, DIRECTION[view], `The family's mule walking ${view} on its halter: a four-frame loop.`)])),
  'mule-saddled-walk': loop(saddled[0], 230, DIRECTION.e, 'The family\'s mule saddled, walking east under a rider: a four-frame loop.'),
  ...Object.fromEntries(['e', 's', 'n'].map((view, k) => [`mule-saddled-walk-${view}`, loop(saddled[k], 230, DIRECTION[view], `The family's mule saddled, walking ${view} under a rider: a four-frame loop.`)])),
};
