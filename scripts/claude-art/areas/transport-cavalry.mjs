// Area D (docs/CLAUDE_ART_PLAN.md): the Mexican cavalry, drawn by Claude on 2026-09-28 - temporary, each frame to be replaced by
// Astra's of the same name.
//   D2   the escort dragoon riding hard (`dragoon-gallop-e/-n/-s`), firing his carbine from the galloping horse
//        (`dragoon-carbine-fire`), and firing from a standing horse in the battles (`dragoon-fire-1`/`-2`)
//   D8   Ramírez y Sesma's lancers: `lancer-march`, `lancer-idle`, `lancer-charge` (at the gallop, lance level; never striking)
//   D9   a column's foragers: `forager-ride-1..4` (horsemen, one leading a pack mule of corn) and `forager-drive-1..4` (two
//        horsemen driving cattle)
//   D10  `dragoon-wounded-led-1`/`-2`: a man slumped in the saddle, a comrade on foot leading his horse
// The dragoon is Astra's (`dragoon-*`): dark blue coatee, red facings, white crossbelts, brass helmet with a black crest; an
// interpretation at play size, not a uniform plate (kit/riders.mjs). Nothing is ever shown struck: a volley's smoke and flash
// are the battle's own, drawn at the muzzle by public/battle-view.js.
import { mountedFrame, drawMounted, placed, groupFrame } from '../kit/horse.mjs';
import { COATS, quadPose, drawQuadSide } from '../kit/quadruped.mjs';
import { drawPerson, frameOf } from '../kit/rig.mjs';
import { POSES } from '../kit/poses.mjs';
import { Ink, add, curve, lerp } from '../kit/svg.mjs';
import { drawTool } from '../kit/props.mjs';
import { DRAGOON, riderFrontal, carbineRaised, aimFromSaddle, slung, lanceUp, lanceCouched, slumped, riderSide } from '../kit/riders.mjs';
import { sacks } from '../kit/loads.mjs';

export const AREA = 'transport';
// Drawn at full size and scaled to half (kit/horse.mjs `wrap`): a mounted frame's logical height 270, near Astra's own.
const RES = 0.5, half = c => ({ w: c.w * RES, h: c.h * RES });
const MF = (name, figure, frame, o) => mountedFrame(name, figure, frame, { res: RES, ...o });
const GF = (name, o, draw) => groupFrame(name, { res: RES, ...o }, draw);

export const DATE = '2026-09-28';

const CELL = { w: 720, h: 560 };
const TALL = { w: 760, h: 720 }; // a lance upright stands well above the rider's helmet
const STYLE = 'Warm hand-drawn storybook style, thin dark olive-brown outline, flat shade to the lower right, slightly elevated north-up three-quarter view; transparent ground, no shadow, no text.';
const TROOPER = 'A Mexican dragoon of 1835-36 as Astra draws him - dark blue coatee with red collar and facings, white crossbelts, brass helmet with a black crest, pale trousers, black boots - on a chestnut with a dark blue saddle cloth';
const HORSE = { coat: COATS.chestnut, tack: 'military', blanket: '#26345a' };
const GALLOP = i => `at the gallop, frame ${i + 1} of 4 of a four-beat gallop (the hind legs landing one after the other, then the forelegs, then a moment with all four gathered under him in the air), the body rocking and the neck pumping`;
const slungCarbine = (F, seat, ctx) => slung(riderSide(F, seat, { bob: ctx.bob, lean: 12 }), F);
const frontalCarbine = (F, seat, ctx) => ({ ...riderFrontal(F, seat, ctx.view, { spread: (ctx.at.half + 5) / 1.3, drop: 32 }),
  after: (ink, j) => drawTool(ink, 'rifle', add(j.P, ctx.view === 's' ? [-16, 34] : [-14, 10]), add(j.P, ctx.view === 's' ? [14, 6] : [14, 38]), { side: 1 }) });

// --------------------------------------------------------------------------------------------------- D2 the dragoon riding hard
const gallopE = [0, 1, 2, 3].map(i => ({ name: `dragoon-gallop-e-${i + 1}`, height: 1.8, compare: [['dragoon-march-1', 1.8], ['mustang-gallop-1', 1.45]],
  prompt: `${TROOPER}, riding hard east (west mirrored) ${GALLOP(i)}; he leans forward over the neck, his carbine slung across his back. ${STYLE}`,
  draw: () => MF(`dragoon-gallop-e-${i + 1}`, DRAGOON, i, { gait: 'gallop', ...HORSE, cell: CELL, originX: 320, pose: slungCarbine, note: `the escort dragoon at the gallop, frame ${i + 1} of 4` }) }));
const gallopV = view => [0, 2].map((f, i) => ({ name: `dragoon-gallop-${view}-${i + 1}`, height: 1.8, compare: [[`dragoon-march-${view}-1`, 1.8]],
  prompt: `${TROOPER}, riding hard ${view === 's' ? 'toward the camera' : 'away from the camera'}, frame ${i + 1} of 2 of the gallop (${i ? 'the hind legs driving under, the forelegs reaching' : 'the forelegs folded high, the body up'}), his carbine slung. ${STYLE}`,
  draw: () => MF(`dragoon-gallop-${view}-${i + 1}`, DRAGOON, f, { view, gait: 'gallop', ...HORSE, cell: CELL, pose: frontalCarbine, note: `the escort dragoon at the gallop, ${view}, frame ${i + 1} of 2` }) }));
const WHAT = ['brings the carbine up across his body', 'fires it from the shoulder, the muzzle kicked up', 'lowers it again'];
const carbine = [0, 1, 2].map(i => ({ name: `dragoon-carbine-fire-${i + 1}`, height: 1.8, compare: [['dragoon-march-1', 1.8]],
  prompt: `${TROOPER}, at the gallop east (frames 1-3 of the gallop), ${WHAT[i]}: one shot from a galloping horse, as the chase has it (sim/pursuit.mjs). No flash or smoke is painted - the chase draws its own at the muzzle - and nothing is shown hit. ${STYLE}`,
  draw: () => MF(`dragoon-carbine-fire-${i + 1}`, DRAGOON, i, { gait: 'gallop', ...HORSE, cell: CELL, originX: 320, note: `the dragoon's carbine from the saddle: ${WHAT[i]}`,
    pose: (F, seat, ctx) => i === 1 ? aimFromSaddle(F, seat, { bob: ctx.bob, recoil: 10, length: 40 }) : carbineRaised(F, seat, { bob: ctx.bob, low: i === 2 }) }) }));
const fire = [0, 1].map(i => ({ name: `dragoon-fire-${i + 1}`, height: 1.8, compare: [['dragoon-e', 1.8], ['dragoon-march-1', 1.8]],
  prompt: `${TROOPER}, on a standing horse, facing east: firing his carbine from the saddle - ${i ? 'the recoil, the muzzle kicked up' : 'aimed level from the shoulder'}. No flash or smoke painted (the battle draws its own); nothing shown hit. ${STYLE}`,
  draw: () => MF(`dragoon-fire-${i + 1}`, DRAGOON, null, { ...HORSE, cell: CELL, originX: 320, note: `a dragoon firing from the saddle, ${i ? 'recoil' : 'aim'}`,
    pose: (F, seat) => aimFromSaddle(F, seat, { recoil: i ? 12 : 0, length: 40 }) }) }));

// --------------------------------------------------------------------------------------------------- D8 the lancers
const LANCER = `${TROOPER.replace('A Mexican dragoon', 'A Mexican lancer')}, a lance with a small red pennon`;
const lancer = (name, frame, gait, pose, words) => ({ name, height: 1.8, compare: [['dragoon-march-1', 1.8], ['dragoon-e', 1.8]],
  prompt: `${LANCER}: ${words}. The lance is never shown striking anyone. ${STYLE}`,
  draw: () => MF(name, DRAGOON, frame, { gait, ...HORSE, cell: TALL, originX: 340, note: words, pose }) });
const lancerMarch = [0, 1, 2, 3].map(i => lancer(`lancer-march-${i + 1}`, i, 'walk', (F, seat, ctx) => lanceUp(F, seat, ctx), `walking east (west mirrored), the lance upright with its butt by the stirrup, frame ${i + 1} of 4 of the walk`));
const lancerIdle = [lancer('lancer-idle-1', null, 'walk', (F, seat) => lanceUp(F, seat), 'his horse standing square, the lance upright, facing east (the game mirrors it for west)')];
const lancerCharge = [0, 1, 2, 3].map(i => lancer(`lancer-charge-${i + 1}`, i, 'gallop', (F, seat, ctx) => lanceCouched(F, seat, ctx), `charging east ${GALLOP(i)}, the lance couched level under his arm, pointing ahead and a little down`));

// --------------------------------------------------------------------------------------------------- D10 the wounded led off
const wounded = [0, 1].map(i => ({ name: `dragoon-wounded-led-${i + 1}`, height: 1.8, compare: [['dragoon-march-1', 1.8], ['dragoon-march-2', 1.8]],
  prompt: `A wounded Mexican dragoon slumped forward in the saddle, his head down and his hands on the pommel, nothing of a wound shown; a comrade on foot at the horse's head leads it east by the reins, walking (frame ${i + 1} of 2). ${TROOPER.replace('A Mexican dragoon of 1835-36 as Astra draws him - ', 'Both in ')}. ${STYLE}`,
  draw: () => MF(`dragoon-wounded-led-${i + 1}`, DRAGOON, i * 2, { ...HORSE, cell: { w: 860, h: 560 }, originX: 320, note: `a wounded dragoon led off, frame ${i + 1} of 2`,
    pose: (F, seat, ctx) => slumped(F, seat, ctx),
    after: (ink, at) => {
      // The comrade on foot, a pace ahead of the horse's head, looking back, his far hand back on the reins at the bit.
      const man = new Ink(ink.prefix + '-m', ink.k * 1.3, { yUp: true });
      man.n = ink.n + 900;
      const walk = POSES.walk(frameOf(DRAGOON))[i * 2];
      const X = 96, bit = [at.bit[0] / 1.3, at.bit[1] / 1.3];
      const pelvis = add(walk.pelvis, [X, 0]);
      const j = drawPerson(man, DRAGOON, { ...walk, pelvis, feet: { near: add(walk.feet.near, [X, 0]), far: add(walk.feet.far, [X, 0]) }, hands: { near: add(walk.hands.near, [X, 0]), far: add(bit, [2, 0]) }, elbows: { far: 1 }, tilt: -6 });
      const joints = { handFar: [j.handFar[0] * 1.3, j.handFar[1] * 1.3] };
      ink.n = man.n + 1;
      ink.defs.push(...man.defs);
      ink.raw(`<g transform="scale(1.3)">${man}</g>`);
      ink.line(curve([joints.handFar, lerp(joints.handFar, at.bit, 0.5), at.bit]), { colour: '#3e2816', width: 2.2 });
    } }) }));

// --------------------------------------------------------------------------------------------------- D9 the foragers
const FORAGE = { w: 1500, h: 720 };
const foragerRide = [0, 1, 2, 3].map(i => ({ name: `forager-ride-${i + 1}`, height: 1.8, compare: [['dragoon-march-1', 1.8]],
  prompt: `A foraging party of a Mexican column riding east (west mirrored), frame ${i + 1} of 4 of the walk: two dragoons in their blue coatees and helmets, the second a little behind and further off, the first leading a pack mule loaded with sacks of corn on a sawbuck saddle by a lead rope. ${STYLE}`,
  draw: () => GF(`forager-ride-${i + 1}`, { cell: FORAGE, originX: 820, note: `foragers riding, one leading a pack mule of corn, frame ${i + 1} of 4` }, ink => {
    // The far rider (drawn first, higher and a little smaller for distance), the pack mule, the near rider leading it.
    placed(ink, 150, 20, sub => drawMounted(sub, DRAGOON, i, { ...HORSE, phase: 0.5, pose: (F, seat, ctx) => slung(riderSide(F, seat, { bob: ctx.bob }), F) }));
    const mule = quadPose('mule', { gait: 'walk', frame: i + 0.3 });
    const muleAt = placed(ink, -170, 2, sub => drawQuadSide(sub, 'mule', mule, { coat: COATS.mouse, halter: true, pack: sacks(3) }));
    const lead = drawMounted(ink, DRAGOON, i, { ...HORSE, pose: (F, seat, ctx) => ({ ...slung(riderSide(F, seat, { bob: ctx.bob }), F), hands: { near: add(seat, [-6, 14]), far: add(seat, [12, 16]) } }) });
    // The lead rope from the near rider's hand back to the mule's halter.
    const hand = [lead.joints.handNear[0] * lead.scale, lead.joints.handNear[1] * lead.scale], halter = add(muleAt.bit, [-170, 2]);
    ink.line(curve([hand, add(lerp(hand, halter, 0.5), [0, -14]), halter]), { colour: '#c8a878', width: 2.6 });
  }) }));
const foragerDrive = [0, 1, 2, 3].map(i => ({ name: `forager-drive-${i + 1}`, height: 1.8, compare: [['dragoon-march-1', 1.8], ['cattle-longhorn-red-1', 1.2]],
  prompt: `Two Mexican dragoons of a foraging party driving four head of range cattle east (west mirrored) before them - longhorned, red, dun and pied - frame ${i + 1} of 4 of the walk, one rider behind the cattle and one out to the side. ${STYLE}`,
  draw: () => GF(`forager-drive-${i + 1}`, { cell: FORAGE, originX: 710, note: `foragers driving cattle, frame ${i + 1} of 4` }, ink => {
    const cattle = [[80, 30, COATS.longhorn, 0.1], [170, 18, { ...COATS.longhorn, coat: '#b8925a', patches: null }, 0.6], [20, 4, { ...COATS.longhorn, coat: '#f0e2c8', patches: '#8a4a28' }, 0.35], [130, -6, COATS.longhorn, 0.8]];
    placed(ink, -60, 44, sub => drawMounted(sub, DRAGOON, i, { ...HORSE, phase: 0.25, pose: (F, seat, ctx) => slung(riderSide(F, seat, { bob: ctx.bob }), F) }));
    for (const [x, y, coat, phase] of cattle.sort((a, b) => b[1] - a[1])) placed(ink, x, y, sub => drawQuadSide(sub, 'longhorn', quadPose('longhorn', { gait: 'walk', frame: i + phase * 4 }), { coat }));
    placed(ink, -150, 0, sub => drawMounted(sub, DRAGOON, i, { ...HORSE, pose: (F, seat, ctx) => slung(riderSide(F, seat, { bob: ctx.bob }), F) }));
  }) }));

const walk = (frames, ms, extra = {}) => ({ frames: frames.map(f => ({ sprite: f.name, duration: ms })), loop: true, motion: 'none', direction: 'east; west by mirroring', ...extra });
// Retired 2026-10-03 when Astra's own art of the same names was merged (Astra's art wins): the dragoon firing from the saddle and the lancers (`dragoon-fire`, `lancer-charge`); the rest of those two sheets (the dragoon's gallop and carbine, the lancer's walk and idle) were never drawn beside hers (public/art-subjects.js: dragoons and lancers are her subjects) and went with them.
export const SHEETS = {
  'claude-dragoon-wounded': { cell: half({ w: 860, h: 560 }), columns: 2, request: 'Request 2026-09-25 — battles: the pieces the engine stands in for', replaceWith: 'item 3: a dragoon slumped in the saddle, another leading the horse, 2 frames east',
    frames: wounded },
  'claude-foragers': { cell: half(FORAGE), columns: 2, request: 'Request 2026-09-26 — the Mexican advance', replaceWith: 'item 1: a foraging party riding with a pack mule of corn, and two horsemen driving cattle, 4 frames each, east',
    frames: [...foragerRide, ...foragerDrive] },
};
export const CLIPS = {
  'dragoon-wounded-led': walk(wounded, 420, { prompt: 'A wounded dragoon slumped in the saddle, his horse led off at a walk by a comrade on foot: two frames.' }),
  'forager-ride': walk(foragerRide, 230, { prompt: 'A foraging party riding, one leading a pack mule of corn: a four-frame walk loop.' }),
  'forager-drive': walk(foragerDrive, 230, { prompt: 'Two horsemen driving four head of cattle: a four-frame walk loop.' }),
};
for (const clip of Object.values(CLIPS)) delete clip.durations;
