// Area D (docs/CLAUDE_ART_PLAN.md): people on horseback, drawn by Claude on 2026-09-28 - temporary, each frame to be replaced by
// Astra's of the same name.
//   D3   the children on the family's horse: `girl-ride-*`, `boy-ride-*`, `smallchild-ride-*` (east, south, north; 4 frames)
//   D6   a Tejano horseman of Béxar: `tejano-rider-ride-*`
//   D7   a Texian volunteer on his own horse: `volunteer-mounted-*` (walk three ways, trot, idle, firing) and `volunteer-ride-*`
//   D13  Juan Seguín and Dr. John Sutherland mounted: `seguin-ride-*`, `sutherland-ride-*`
// Every frame is the four-legged rig's horse (kit/quadruped.mjs) under the person rig (kit/rig.mjs), at the mounted size the
// game draws a rider (1.8 of a person, `MOUNTED_HEIGHT`; logical height 540). East is mirrored for west by the game.
//
// The baby is not drawn on the horse: the server never seats a baby alone (sim/company.mjs `seatPlan` gives every baby to its
// carrier), so `infant-ride-*` has nothing to stand in for; a rider carrying a baby is the request for a walker or rider with
// an infant in the arms (request 2026-09-25 — riders, walkers and the cart, item 3).
import { mountedFrame } from '../kit/horse.mjs';
import { COATS } from '../kit/quadruped.mjs';
import { drawTool } from '../kit/props.mjs';
import { add } from '../kit/svg.mjs';
import { TEJANO, SEGUIN, SUTHERLAND, VOLUNTEER, riderFrontal, rifleAcross, aimFromSaddle, escopetaUp } from '../kit/riders.mjs';

export const AREA = 'transport';
// Drawn at full size and scaled to half (kit/horse.mjs `wrap`): a mounted frame's logical height 270, near Astra's own.
const RES = 0.5, half = c => ({ w: c.w * RES, h: c.h * RES });
const MF = (name, figure, frame, o) => mountedFrame(name, figure, frame, { res: RES, ...o });
const GF = (name, o, draw) => groupFrame(name, { res: RES, ...o }, draw);

export const DATE = '2026-09-28';

const CELL = { w: 720, h: 560 };
const VIEWS = ['e', 's', 'n'];
const STEP = { walk: 230, trot: 150 };
const STYLE = 'Warm hand-drawn storybook style, thin dark olive-brown outline, flat shade to the lower right, slightly elevated north-up three-quarter view; transparent ground, no shadow, no text.';
const HORSE_WORDS = {
  e: i => `side-on facing east (west is the game's mirror), walking, frame ${i + 1} of 4 of a four-beat walk (near hind, near fore, far hind, far fore; three hooves down at a time, the head nodding)`,
  s: i => `coming toward the camera, walking, frame ${i + 1} of 4 (one leg lifted in turn, the body rolling a little)`,
  n: i => `going away from the camera, walking, frame ${i + 1} of 4 (one leg lifted in turn, the tail swinging)`,
};
const frontalWith = (extra) => (F, seat, ctx) => ({ ...riderFrontal(F, seat, ctx.view, { spread: (ctx.at.half + 5) / (1.3 * (ctx.riderScale || 1)), drop: 30 }), ...extra(F, seat, ctx) });

/** Frames and clips of one rider riding three ways (and more), in one sheet. */
function riderSet({ name, figure, who, coat = COATS.bay, riderScale = 1, poseFor = {}, compare = [], request, extra = [] }) {
  const frames = [], clips = {};
  for (const view of VIEWS) {
    const ids = [0, 1, 2, 3].map(i => `${name}-${view}-${i + 1}`);
    ids.forEach((id, i) => frames.push({ name: id, height: 1.8, compare: [...compare, [view === 'e' ? 'rust-ride-e-1' : `rust-ride-${view}-1`, 1.8]],
      prompt: `${who} riding the family's horse ${HORSE_WORDS[view](i)}. The horse: a muscled bay with a black mane and tail and dark lower legs, a small white star, a plain saddle on a red blanket, jointed legs with round fetlocks and sloping pasterns. The rider sits it astride: the thigh down and forward, the knee bent, the foot in the stirrup under the hip, the hands low at the reins, riding the horse's rise and fall. ${STYLE} Claude-drawn stand-in, temporary: replace with Astra's ${id}.`,
      draw: () => MF(id, figure, i, { view, coat, riderScale, cell: CELL, originX: view === 'e' ? 320 : CELL.w / 2, note: `${who}, ${HORSE_WORDS[view](i)}`,
        pose: poseFor[view] ? (F, seat, ctx) => poseFor[view](F, seat, { ...ctx, riderScale }) : undefined }) }));
    clips[`${name}-${view}`] = { frames: ids.map(sprite => ({ sprite, duration: STEP.walk })), loop: true, motion: 'none', direction: view === 'e' ? 'east; west by mirroring' : view === 'n' ? 'north' : 'south',
      prompt: `${who} riding the family's horse ${view === 'e' ? 'east (west mirrored)' : view === 'n' ? 'away (north)' : 'toward the camera (south)'}: a four-frame walk loop at the pace of Astra's mounted cast (230 ms a frame).` };
  }
  frames.push(...extra.flatMap(set => set.frames));
  for (const set of extra) Object.assign(clips, set.clips);
  return { frames, clips, request };
}

// ------------------------------------------------------------------------------------------------ D3 the children on the horse
const CHILDREN = { girl: { who: 'The family\'s girl of about eight, in her own rust dress and cream apron, two braids; her skirt spread over the saddle as a riding skirt, falling down the horse\'s side', scale: 0.7 },
  boy: { who: 'The family\'s boy of about eight, fair tousled hair, cream shirt, one brace, rolled trousers, barefoot', scale: 0.7 },
  smallchild: { who: 'The family\'s small child of about four, in a cream smock, a curly dark mop, sitting up in the saddle, the stirrups too far down to reach', scale: 0.55 } };
const children = Object.entries(CHILDREN).map(([child, c]) => riderSet({ name: `${child}-ride`, figure: child, who: c.who, riderScale: c.scale,
  compare: [[`${child}-idle-e`, c.scale], [`${child}-walk-1`, c.scale]] }));

// ------------------------------------------------------------------------------------------------ D6 the Tejano horseman
const tejanoFront = frontalWith((F, seat) => ({ after: (ink, j) => drawTool(ink, 'rifle', add(j.P, [20, 4]), add(j.P, [26, 52]), { side: -1 }), hands: { left: add(seat, [-6, 11]), right: add(seat, [18, 14]) } }));
const tejano = riderSet({ name: 'tejano-rider-ride', figure: TEJANO, coat: COATS.dun,
  who: 'A Tejano horseman of Béxar, 1836 (as of Seguín\'s company): a short brown jacket, a white shirt, a red sash, dark split trousers over leather leggings, a low-crowned wide hat; an escopeta held upright, its butt on his thigh; his horse a dun with a dark mane - dress an interpretation, no uniform claimed',
  poseFor: { e: (F, seat, ctx) => escopetaUp(F, seat, ctx), s: tejanoFront, n: tejanoFront }, compare: [['seguin-mounted-e', 1.8], ['dragoon-march-1', 1.8]] });

// ------------------------------------------------------------------------------------------------ D7 the volunteer on horseback
const volFront = frontalWith((F, seat, ctx) => ({ after: (ink, j) => ctx.view === 's'
  ? drawTool(ink, 'rifle', add(j.P, [-18, 8]), add(j.P, [30, 28]), { side: 1 })
  : drawTool(ink, 'rifle', add(j.P, [-14, 8]), add(j.P, [18, 44]), { side: 1 }) }));
const VOL = 'A Texian volunteer on his own horse in his own frontier clothes: a brown coat over a pale shirt, a slouch hat, a beard, a belt; his long rifle across the pommel';
const volunteer = riderSet({ name: 'volunteer-mounted-walk', figure: VOLUNTEER, coat: COATS.sorrel, who: VOL,
  poseFor: { e: (F, seat, ctx) => rifleAcross(F, seat, ctx), s: volFront, n: volFront }, compare: [['volunteer-march-1', 1], ['mounted-courier-e-1', 1.8]] });
{
  // The trot, standing, and firing from the saddle on a standing horse (aim, recoil).
  const trot = [0, 1, 2, 3].map(i => ({ name: `volunteer-mounted-trot-${i + 1}`, height: 1.8, compare: [['mounted-courier-e-1', 1.8]],
    prompt: `${VOL}, trotting east (west mirrored), frame ${i + 1} of 4 of a two-beat trot: the diagonal pairs of legs together, the horse rising between them, the rider sitting it a beat late. ${STYLE}`,
    draw: () => MF(`volunteer-mounted-trot-${i + 1}`, VOLUNTEER, i, { gait: 'trot', coat: COATS.sorrel, cell: CELL, originX: 320, pose: (F, seat, ctx) => rifleAcross(F, seat, ctx), note: `a Texian volunteer trotting, frame ${i + 1} of 4` }) }));
  const idle = { name: 'volunteer-mounted-idle-1', height: 1.8, compare: [['mounted-courier-listen-1', 1.8]],
    prompt: `${VOL}, his horse standing square, facing east (west mirrored). ${STYLE}`,
    draw: () => MF('volunteer-mounted-idle-1', VOLUNTEER, null, { coat: COATS.sorrel, cell: CELL, originX: 320, pose: (F, seat, ctx) => rifleAcross(F, seat, ctx), note: 'a Texian volunteer on a standing horse' }) };
  const fire = [0, 1].map(i => ({ name: `volunteer-mounted-fire-${i + 1}`, height: 1.8, compare: [['volunteer-aim', 1], ['mounted-courier-e-1', 1.8]],
    prompt: `${VOL}, firing from the saddle of a standing horse, facing east: ${i ? 'the recoil, the muzzle kicked up' : 'the rifle at the shoulder, aimed level ahead'}. No flash or smoke is painted (the battle draws its own at the muzzle); nothing is shown hit. ${STYLE}`,
    draw: () => MF(`volunteer-mounted-fire-${i + 1}`, VOLUNTEER, null, { coat: COATS.sorrel, cell: CELL, originX: 320, pose: (F, seat) => aimFromSaddle(F, seat, { recoil: i ? 12 : 0, length: 56 }), note: `a Texian volunteer firing from the saddle, ${i ? 'recoil' : 'aim'}` }) }));
  volunteer.frames.push(...trot, idle, ...fire);
  const walk = view => volunteer.clips[`volunteer-mounted-walk-${view}`];
  Object.assign(volunteer.clips, {
    'volunteer-mounted': { ...walk('e'), prompt: 'A Texian volunteer riding east (west mirrored) at the walk, his rifle across the pommel.' },
    'volunteer-mounted-trot': { frames: trot.map(f => ({ sprite: f.name, duration: STEP.trot })), loop: true, motion: 'none', direction: 'east; west by mirroring', prompt: 'A Texian volunteer at the trot, a four-frame loop.' },
    'volunteer-mounted-idle': { frames: [{ sprite: 'volunteer-mounted-idle-1', duration: 2200 }], loop: true, motion: 'breathe', direction: 'east; west by mirroring', prompt: 'A Texian volunteer on his standing horse, breathing.' },
    'volunteer-mounted-fire': { frames: [{ sprite: 'volunteer-mounted-fire-1', duration: 700 }, { sprite: 'volunteer-mounted-fire-2', duration: 500 }], loop: false, motion: 'none', direction: 'east; west by mirroring', beat: 1, prompt: 'A Texian volunteer firing from the saddle: aim, then the recoil on the shot (beat 1).' },
    // The same rider serves the south's fights and the Gonzales men riding into the Alamo (request 2026-09-25 — San Jacinto, item 3).
    'volunteer-ride-e': { ...walk('e'), prompt: 'A Texian volunteer riding east at the walk (the same rider as volunteer-mounted).' },
    'volunteer-ride-s': { ...walk('s'), prompt: 'A Texian volunteer riding toward the camera at the walk (the same rider as volunteer-mounted).' },
    'volunteer-ride-n': { ...walk('n'), prompt: 'A Texian volunteer riding away at the walk (the same rider as volunteer-mounted).' },
  });
}

// ------------------------------------------------------------------------------------------------ D13 Seguín and Sutherland
const seguin = riderSet({ name: 'seguin-ride', figure: SEGUIN, coat: COATS.chestnut,
  who: 'Juan Seguín (an original interpretation after Astra\'s own figure of him, not a likeness): a dark blue short jacket, a white shirt, buff trousers, tall black boots, a dark flat-brimmed hat, clean-shaven; on a chestnut with white stockings',
  compare: [['seguin-mounted-e', 1.8], ['seguin-idle', 1]] });
const sutherland = riderSet({ name: 'sutherland-ride', figure: SUTHERLAND, coat: COATS.grey,
  who: 'Dr. John Sutherland, the physician who rode from Béxar to Gonzales with the word on February 23, 1836 (an original interpretation, not a likeness; nothing of his dress is recorded): a man of about forty in a dark green-black frock coat, a buff waistcoat, grey trousers, a dark hat and a short beard, on a grey horse',
  compare: [['mounted-courier-e-1', 1.8], ['courier-e', 1]] });

const sheet = (set, request, replaceWith) => ({ cell: half(CELL), columns: 4, request, replaceWith, frames: set.frames });
export const SHEETS = {
  'claude-ride-children': sheet({ frames: children.flatMap(c => c.frames) }, 'Request 2026-09-14 — family members on horseback', 'the child on the family\'s chestnut: 4 frames a heading, east (mirrored for west), south and north, the courier\'s cell size and ground anchor, drawn at 1.8 of a person'),
  'claude-ride-tejano': sheet(tejano, 'Request 2026-09-27 — the milk cow on the run, and Béxar before the bell', 'item 3: a Tejano horseman riding east, north and south, 4 frames each, at the mounted size'),
  'claude-ride-volunteer': sheet(volunteer, 'Request 2026-09-25 — San Jacinto', 'item 3: a Texian volunteer mounted, walk three ways, trot, idle and firing, at the mounted size'),
  'claude-ride-famous': sheet({ frames: [...seguin.frames, ...sutherland.frames] }, 'Request 2026-09-26 — the famous people: the roster\'s remaining figures and poses', 'mounted movement for Seguín and Dr. Sutherland: 4 frames east, south and north each, at the mounted size; original interpretations'),
};
export const CLIPS = Object.assign({}, ...children.map(c => c.clips), tejano.clips, volunteer.clips, seguin.clips, sutherland.clips);
