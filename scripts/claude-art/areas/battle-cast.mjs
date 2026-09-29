// A family's own people firing (request 2026-09-25 — battles: the pieces the engine stands in for, item 1; docs/CLAUDE_ART_PLAN.md
// C1): every grown cast figure in their own clothes with a long rifle - aim, fire, load (kneeling) and ramrod, the clip
// `<cast>-fire-reload` at the volunteer's timing - and hit: `<cast>-injured` (sitting up, an arm in a sling) and
// `<cast>-reclining` (lying still under a blanket). Until now a family's person in a fight was drawn in the volunteer's firing
// cycle, or, with an appearance, in their own hoeing cycle. No blood, no wound shown (VISION.md §16).
//
// The frames the clip plays are `<cast>-fire-reload-1` (aim) and `-2` (fire) with `<cast>-load` and `<cast>-ramrod`: area A
// draws `<cast>-aim` and `<cast>-fire` for hunting at home (request 2026-09-28 — people at work, item 7), so the battle's own
// aim and shot are named inside the clip. Drawn from the person rig in each figure's own dress; Claude's temporary art.
import { frameOf, personFrame, drawPerson } from '../kit/rig.mjs';
import { add, blob, curve, capsule, poly } from '../kit/svg.mjs';
import { LINE, CAST as SPECS } from '../kit/style.mjs';
import * as PO from '../battle-kit/poses.mjs';
import { drawGun } from '../battle-kit/gear.mjs';
import { clip, STYLE, NO_GORE } from '../battle-kit/sheet.mjs';

export const AREA = 'battles';
export const DATE = '2026-09-28';
export const CAST = ['rust', 'teal', 'elder', 'blue', 'rust-woman', 'indigo', 'ochre', 'blue-girl'];
const REQUEST = 'Request 2026-09-25 — battles: the pieces the engine stands in for';
const REPLACE = 'item 1: `<cast>-aim`, `<cast>-fire`, `<cast>-load` (kneeling, as `volunteer-load`), `<cast>-ramrod`, clip `<cast>-fire-reload`, and `-injured`, `-reclining`, in the cast figure\'s own clothes at the `volunteer-*` height';
// A wider cell than a standing person's, the figure left of its middle, so a levelled rifle's muzzle stays inside it.
const CELL = { w: 480, h: 400 }, ORIGIN = { cell: CELL, originX: 190 };
const own = figure => `the same person, face, hair, clothes and colours as Astra's ${figure} sheets (a settler of 1835 in their own clothes)`;

/** Sitting up hurt: on the ground, propped on the far hand, the near arm in a white sling. */
function injured(F) {
  const sit = PO.sitFloor(F, { hug: false, lean: -8, tilt: 4 });
  const g = PO.g(F);
  return { ...sit, knees: { near: 1, far: 1 }, feet: { near: add(sit.feet.near, [6 * g, 0]), far: add(sit.feet.far, [2 * g, 0]) },
    hands: { near: PO.at(F, 5, -14 - (F.hip - sit.pelvis[1]) / g), far: [sit.pelvis[0] - 12 * g, F.ankle + 1] }, elbows: { near: 1, far: -1 },
    after: (ink, j) => {
      // The sling: a white cloth from the neck to the forearm held across the chest.
      const hand = j.handNear;
      ink.shape(blob([add(j.N, [-1, 1]), add(j.N, [3, 0]), add(hand, [3, 2]), add(hand, [-2, -3]), add(hand, [-6, -2])], 0.6), '#efe6d0', { off: 0.5, outline: LINE.inner });
    } };
}
/** Lying still on the back under a grey blanket drawn up to the chin (Astra's `*-reclining`): a man killed, nothing shown. */
function reclining(figure, F) {
  const x0 = F.hip * 0.55, y0 = F.B.limb * 1.25, neck = x0 - F.neck + 1.5, feet = x0 + 4, top = y0 + F.B.depth * 0.95 + 1.5;
  return ink => {
    // Under the blanket a skirt is drawn as legs and the hat is off, so nothing spills past the blanket or under the ground.
    const spec = SPECS[figure];
    drawPerson(ink, { ...spec, hat: spec.hat?.kind === 'bonnet' ? spec.hat : null, lower: { ...spec.lower, kind: 'trousers' } }, { view: 'e', lying: true });
    ink.shape(blob([[neck, 0.5], [neck - 1.5, top - 2], [neck + 10, top + 1.5], [(neck + feet) / 2, top], [feet - 8, top - 3], [feet + 2.5, top - 5], [feet + 3.5, 1], [(neck + feet) / 2, -0.5]], 0.7), '#8a7f6e', { off: 1.2, lift: true });
    for (const t of [0.3, 0.55]) { const x = neck + (feet - neck) * t; ink.line(curve([[x, 0.5], [x + 1, top * 0.55], [x + 0.5, top + 0.5]]), { colour: '#9a3a2a', width: 2.6 }); }
  };
}

const sheets = {}, clips = {};
for (const figure of CAST) {
  const F = frameOf(figure), c = PO.fireCycle(F, { kind: 'rifle' });
  const frames = [
    ['fire-reload-1', p => personFrame(p, ink => drawPerson(ink, figure, c.aim), ORIGIN), 'aiming a long rifle from a braced stance: the butt in the shoulder, the cheek down on the stock, the left foot forward'],
    ['fire-reload-2', p => personFrame(p, ink => drawPerson(ink, figure, c.fire), ORIGIN), 'the shot: the recoil rocks the shoulders back and lifts the muzzle'],
    ['load', p => personFrame(p, ink => drawPerson(ink, figure, c.load), ORIGIN), 'kneeling on the right knee to load, the rifle upright before them, pouring the charge down the muzzle'],
    ['ramrod', p => personFrame(p, ink => drawPerson(ink, figure, c.ramrod), ORIGIN), 'standing, the rifle upright by the left foot, drawing the ramrod up at arm\'s length'],
    ['injured', p => personFrame(p, ink => drawPerson(ink, figure, injured(F)), ORIGIN), `hit: sitting up on the ground, propped on one hand, the other arm in a white sling; ${NO_GORE}`],
    ['reclining', p => personFrame(p, reclining(figure, F), ORIGIN), `killed: lying still on the back under a grey blanket drawn up to the chin, as Astra's volunteer-reclining; ${NO_GORE}`],
  ];
  sheets[`claude-battle-${figure}`] = { cell: CELL, columns: 3, request: REQUEST, replaceWith: REPLACE,
    frames: frames.map(([pose, draw, what]) => ({ name: `${figure}-${pose}`, compare: [[`volunteer-${pose.startsWith('fire-reload') ? (pose.endsWith('1') ? 'aim' : 'fire') : pose}`, 1], [`${figure}-idle-e`, 1]],
      prompt: `${figure} in a fight of 1835-36, ${what}; ${own(figure)}, side on and facing east (mirrored for west). ${STYLE}`, draw: () => draw(`${figure}-${pose}`) })) };
  clips[`${figure}-fire-reload`] = clip([[`${figure}-fire-reload-1`, 700], [`${figure}-fire-reload-2`, 120], [`${figure}-load`, 750], [`${figure}-ramrod`, 900]], { loop: false,
    prompt: `${figure} firing and loading, as the volunteer's fire-reload clip: aim 700 ms, the shot 120, kneeling to load 750, the ramrod 900; the page times the flash to the second frame.` });
  clips[`${figure}-load`] = clip([[`${figure}-load`, 2000]], { prompt: `${figure} kneeling to load between shots, held (the pause before the next aim).` });
  clips[`${figure}-injured`] = clip([[`${figure}-injured`, 2700]], { motion: 'breathe', prompt: `${figure} hit and sitting up, breathing: ${NO_GORE}` });
  clips[`${figure}-reclining`] = clip([[`${figure}-reclining`, 3000]], { prompt: `${figure} killed, lying still under a blanket: ${NO_GORE}` });
}
export const SHEETS = sheets;
export const CLIPS = clips;
