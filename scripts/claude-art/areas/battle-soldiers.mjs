// The armies fighting (docs/CLAUDE_ART_PLAN.md area C: C5, C6, C8, C10, C11): the Texian volunteer and the Mexican line
// infantryman in the poses the battle engine stands in for today - a regular firing through a loophole, firing over a parapet,
// a skirmisher running and kneeling to fire, climbing a cut bank to fire over its lip, wading through the marsh. (The wounded
// carried, rest and sleep in camp, the volunteer at a loophole, the crowbar and the trench are Astra's since 2026-10-03.)
// Every figure faces east (mirrored for west) unless its name says -s or -n.
//
// Drawn from the person rig with the battle kit (scripts/claude-art/battle-kit/): the volunteer after Astra's `volunteer-*`
// (a brown frock coat, a broad hat, a shot pouch and horn, a long rifle), the regular after her `regular-*` (a blue coatee faced
// red, white trousers, white crossbelts, the shako, the India Pattern musket); the uniform's sources and how sure each detail
// is are in battle-kit/figures.mjs. Nothing of a wound is ever drawn (VISION.md §16). Claude's temporary art.
import { frameOf, personFrame, drawPerson } from '../kit/rig.mjs';
import { POSES } from '../kit/poses.mjs';
import { add, lerp, blob, capsule, curve, ellipse, poly } from '../kit/svg.mjs';
import { LINE } from '../kit/style.mjs';
import { VOLUNTEER, REGULAR, CAZADOR, SETTLERS } from '../battle-kit/figures.mjs';
import * as PO from '../battle-kit/poses.mjs';
import { drawGun, drawRamrod, seg, COLOURS } from '../battle-kit/gear.mjs';
import { cookFire, wallEdge, doorEdge, bankFace, trenchBank, waterLine } from '../battle-kit/props.mjs';
import { nested, group } from '../battle-kit/groups.mjs';
import { clip, STYLE, NO_GORE } from '../battle-kit/sheet.mjs';

export const AREA = 'battles';
export const DATE = '2026-09-28';
const R = {
  battles: 'Request 2026-09-25 — battles: the pieces the engine stands in for',
  ambient: 'Request 2026-09-28 — ambient life',
  sanjac: 'Request 2026-09-25 — San Jacinto',
  storming: 'Request 2026-09-25 — the storming of Béxar',
  alamo: 'Request 2026-09-25 — the Alamo: ladders, the guns served, the walls manned, night',
  coleto: 'Request 2026-09-25 — Coleto and Goliad',
  troops: 'Request 2026-09-27 — Mexican troops after a family on the road',
  concepcion: 'Request 2026-09-25 — Concepción and the Grass Fight',
};
const WHO = {
  volunteer: 'a Texian volunteer of 1835-36 as Astra draws `volunteer-*`: a brown frock coat, tan trousers, a broad brown felt hat, a short beard, a shot pouch and powder horn on a strap, a long rifle',
  regular: 'a Mexican line infantryman of 1836 as Astra draws `regular-*`: a dark blue coatee with red collar and cuffs and short tails, white trousers, white crossbelts with a black cartridge box, a black shako with a brass plate and a red pompom, the India Pattern musket',
};
const SPEC = { volunteer: VOLUNTEER, regular: REGULAR };
const KIND = { volunteer: 'rifle', regular: 'musket' };
const WIDE = { w: 480, h: 400 }, AT = { cell: WIDE, originX: 190 };
const frame = (name, spec, pose, opts = {}) => personFrame(name, ink => { opts.before?.(ink); drawPerson(ink, spec, pose); opts.after?.(ink); }, { note: name, ...(opts.cell ? { cell: opts.cell, originX: opts.originX } : AT) });

const sheets = {}, clips = {};
/** A sheet of frames: [name, what, draw, compare] rows. */
function sheet(id, request, replaceWith, rows, cell = WIDE, columns = 4) {
  sheets[id] = { cell, columns, request, replaceWith, frames: rows.map(([name, prompt, draw, compare]) => ({ name, prompt, draw, compare })) };
}

// C2 (the wounded carried, `bearers-carry`) and C4 (a camp at rest, `*-rest-sit` and `*-sleep`) are Astra's (2026-10-03): Claude's
// were deleted at the merge of 2026-10-04. Cleaning a rifle, sitting and cooking in camp are area A's (areas/camp-rest.mjs).

// ---------------------------------------------------------------------------------------------------- C5: Béxar's streets
// The volunteer at a loophole, forcing a door with a crowbar and digging the trench are Astra's (2026-10-03,
// `volunteer-loophole-*`, `volunteer-crowbar`, `volunteer-dig`): Claude's were deleted at the merge of 2026-10-04. The regular at
// a loophole is still Claude's.
{
  const rows = [];
  for (const side of ['regular']) {
    const spec = SPEC[side], F = frameOf(spec), c = PO.fireCycle(F, { kind: KIND[side] }), g = PO.g(F);
    const wall = ink => wallEdge(ink, 26 * g, { hole: F.neck - 3 + 5 * g });
    const lean = p => ({ ...p, pelvis: add(p.pelvis, [4 * g, 0]), feet: { near: add(p.feet.near, [4 * g, 0]), far: add(p.feet.far, [4 * g, 0]) }, tool: p.tool && { ...p.tool } });
    const steps = [['aim', c.aim, 'aiming through a loophole in a stone house\'s wall, the barrel in the hole, the man pressed to the wall'], ['fire', c.fire, 'the shot through the loophole, the recoil rocking him back'],
      ['load', { ...c.ramrod, pelvis: add(c.ramrod.pelvis, [-6 * g, 0]), feet: { near: add(c.ramrod.feet.near, [-6 * g, 0]), far: add(c.ramrod.feet.far, [-6 * g, 0]) } }, 'stepped back from the loophole to ram the next load']];
    steps.forEach(([k, p, what], i) => {
      const name = `${side}-loophole-fire-${i + 1}`;
      rows.push([name, `${WHO[side]}; ${what} (frame ${i + 1} of 3). The wall's edge is in the frame, in front of him, so he is half hidden: Béxar, December 1835 ("a pigeon nursery", Lopez). ${STYLE}`,
        () => frame(name, spec, i < 2 ? lean(p) : p, { after: wall }), [[`${side}-aim`, 1], ['stone-tile-house', 1.6]]]);
    });
    clips[`${side}-loophole-fire`] = clip([[`${side}-loophole-fire-1`, 700], [`${side}-loophole-fire-2`, 120], [`${side}-loophole-fire-3`, 1650]], { loop: false, prompt: `${WHO[side]}: firing through a loophole and stepping back to load, on the volunteer's fire-reload timing (the flash on the second frame).` });
  }
  sheet('claude-bexar-streets', R.storming, 'item 1: a regular firing through a loophole (2-4 frames); the `regular-*` height (the volunteer is Astra\'s `volunteer-loophole-*`, 2026-10-03)', rows);
}

// ---------------------------------------------------------------------------------------------------- C6: men on a wall
{
  const F = frameOf(VOLUNTEER), g = PO.g(F), c = PO.fireCycle(F, { kind: 'rifle' });
  // The parapet's top at the waist: everything below it is behind the wall (the Alamo's walls are drawn by the page).
  const parapet = F.hip + 8 * g, rows = [];
  const clipTop = (pose, spec = VOLUNTEER) => ink => group(ink, [0, 0], 1, sub => drawPerson(sub, spec, pose), { clip: [-200, parapet, 400, 300] });
  const low = { ...c.load, pelvis: add(c.load.pelvis, [0, -2]) };
  const east = [['aim', c.aim, 'aiming over the parapet, the body from the waist up above the wall top'], ['fire', c.fire, 'the shot over the parapet'], ['load', low, 'dropped below the parapet to load: only the hat and the rifle\'s muzzle show over the wall top']];
  east.forEach(([k, p, what], i) => {
    const name = `volunteer-parapet-fire-e-${i + 1}`;
    rows.push([name, `${WHO.volunteer}; on the Alamo's wall facing east: ${what} (frame ${i + 1} of 3). Drawn only above the wall top (the page draws the wall); the feet anchor stays at his feet. ${STYLE}`,
      () => personFrame(name, clipTop(p), { note: name, ...AT }), [['volunteer-aim', 1]]]);
  });
  // Toward and away from the camera: the rifle level at the shoulder pointing out of the picture or into it.
  for (const view of ['s', 'n']) {
    const toward = view === 's';
    // The rifle at the right shoulder, the left hand forward under it, the cheek down on the stock: toward the camera the barrel
    // is a short foreshortened stub ending in the muzzle's ring; away from it, the stock and the elbows show.
    const aim = { view, pelvis: PO.P(F, 0, -1), hands: toward ? { right: PO.at(F, 5, 4), left: PO.at(F, 0, 2) } : { right: PO.at(F, 6, 2), left: PO.at(F, -1, 5) }, after: (ink, j) => {
      const sh = add(j.N, [4.5, -3]);
      if (toward) { ink.shape(capsule(sh, add(sh, [-4, -3]), 2.2, 1.8), COLOURS.stockMaple, { shade: false, outline: 2.4 }); ink.shape(capsule(add(sh, [-4, -3]), add(sh, [-6, -4]), 1.3, 1.3), COLOURS.barrel, { shade: false, outline: 2.2 }); ink.shape(ellipse(add(sh, [-6.5, -4.2]), 2.4, 2.4), '#1a1614', { shade: false, outline: 2.2 }); }
      else { ink.shape(capsule(add(sh, [-1, -1]), add(sh, [-2.5, 9]), 1.6, 1.0), COLOURS.stockMaple, { shade: false, outline: 2.2 }); }
    } };
    const fire = { ...aim, pelvis: PO.P(F, 0, -0.5) };
    const load = { view, pelvis: PO.P(F, 0, -26), hands: { right: PO.at(F, 4, 8 - 26), left: PO.at(F, -3, -6 - 26) }, after: (ink, j) => drawGun(ink, add(j.P, [3, -14]), add(j.P, [4, 60]), { kind: 'rifle', down: 1 }) };
    [['aim', aim, `aiming over the parapet ${toward ? 'toward the camera (the south wall)' : 'away from the camera (the north wall)'}`], ['fire', fire, 'the shot over the parapet'], ['load', load, 'dropped below the parapet to load: the hat and the muzzle show']].forEach(([k, p, what], i) => {
      const name = `volunteer-parapet-fire-${view}-${i + 1}`;
      rows.push([name, `${WHO.volunteer}; on the Alamo's wall ${toward ? 'facing south, toward the camera' : 'facing north, away from the camera'}: ${what} (frame ${i + 1} of 3). Drawn only above the wall top. ${STYLE}`,
        () => personFrame(name, clipTop(p), { note: name, ...AT }), [['volunteer-s', 1], ['volunteer-march-s-1', 1]]]);
    });
  }
  sheet('claude-parapet', R.alamo, 'item 3: volunteers firing over a parapet, the body from the waist up over a wall top, east, west, north and south, with a loading frame below the parapet', rows, WIDE, 3);
  for (const v of ['e', 's', 'n']) clips[`volunteer-parapet-fire-${v}`] = clip([[`volunteer-parapet-fire-${v}-1`, 700], [`volunteer-parapet-fire-${v}-2`, 120], [`volunteer-parapet-fire-${v}-3`, 1650]], { loop: false, direction: v === 'e' ? 'east; west by mirroring' : v === 's' ? 'south' : 'north',
    prompt: `${WHO.volunteer}: on the wall, aiming and firing over the parapet and dropping below it to load, on the fire-reload timing.` });
}

// C7, Coleto's marksmen in the grass (`regular-prone-*`): Astra's prone marksman (2026-10-03) retired Claude's when merged.

// ---------------------------------------------------------------------------------------------------- C8: after a family on the road
{
  const F = frameOf(REGULAR), rows = [];
  PO.run(F, { kind: 'musket' }).forEach((p, i) => {
    const name = `skirmisher-run-e-${i + 1}`;
    rows.push([name, `${WHO.regular}; running east after a fleeing family, the musket carried across the body at the port, a long stride with both feet off the ground at the pass (frame ${i + 1} of 4). Nobody drawn hurt. ${STYLE}`,
      () => frame(name, REGULAR, p), [['regular-march-1', 1], ['regular-march-2', 1]]]);
  });
  const k = PO.kneelFire(F, { kind: 'musket' });
  ['aim', 'fire', 'load', 'ramrod'].forEach((key, i) => {
    const name = `skirmisher-kneel-fire-${i + 1}`;
    rows.push([name, `${WHO.regular}; kneeling on the right knee to fire: ${['aiming', 'the shot', 'loading, the musket upright before him', 'ramming the load home'][i]} (frame ${i + 1} of 4). ${STYLE}`,
      () => frame(name, REGULAR, k[key]), [[`regular-${key}`, 1]]]);
  });
  sheet('claude-skirmisher', R.troops, 'item 3: `skirmisher-run-e` (4 frames) and `skirmisher-kneel-fire` (aim, fire, load; 4 frames), the line\'s regular', rows);
  clips['skirmisher-run-e'] = clip([1, 2, 3, 4].map(i => [`skirmisher-run-e-${i}`, 140]), { prompt: `${WHO.regular}, running east, four frames at a run (140 ms).` });
  clips['skirmisher-kneel-fire'] = clip([[`skirmisher-kneel-fire-1`, 700], [`skirmisher-kneel-fire-2`, 120], [`skirmisher-kneel-fire-3`, 750], [`skirmisher-kneel-fire-4`, 900]], { loop: false, prompt: `${WHO.regular}, kneeling to fire and load, on the fire-reload clip's timing.` });
}

// ---------------------------------------------------------------------------------------------------- C10: under the bank at Concepción
{
  const F = frameOf(VOLUNTEER), g = PO.g(F), c = PO.fireCycle(F, { kind: 'rifle' }), rows = [];
  const bx = 22 * g, top = 58, step = 24;
  const bank = ink => bankFace(ink, bx, { top, step });
  const up = (p, dy) => ({ ...p, pelvis: add(p.pelvis, [0, dy]), feet: { near: add(p.feet.near, [0, dy]), far: add(p.feet.far, [0, dy]) }, ...(p.tool && { tool: { ...p.tool, butt: add(p.tool.butt, [0, dy]), tip: add(p.tool.tip, [0, dy]), draw: ink => drawGun(ink, add(p.tool.butt, [0, dy]), add(p.tool.tip, [0, dy]), { kind: 'rifle' }) } }) });
  const shift = (p, dx) => ({ ...p, pelvis: add(p.pelvis, [dx, 0]), feet: { near: add(p.feet.near, [dx, 0]), far: add(p.feet.far, [dx, 0]) } });
  const climb = { view: 'e', pelvis: PO.P(F, 8, 4), lean: 22, feet: { near: [bx + 3, step + 0.5 + F.ankle], far: PO.foot(F, -2) }, knees: { near: 1, far: 1 },
    tool: PO.gun(F, 'rifle', [0, -6], [26, 60], { near: 0.3, far: 0.5, down: 1 }), elbows: { near: -1, far: -1 } };
  const onStep = p => shift(up(p, step - 2), 6 * g);
  const frames = [
    [climb, 'stepping up the cut in the bank, the rifle in his hands'],
    [onStep(c.aim), 'up on the step, aiming over the lip of the bank'],
    [onStep(c.fire), 'the shot over the lip'],
    [{ ...climb, pelvis: PO.P(F, 4, 2), lean: 8 }, 'stepping down off the cut'],
    [shift(c.load, -4 * g), 'kneeling under the bank to load, out of the enemy\'s sight'],
    [shift(c.ramrod, -4 * g), 'standing under the bank ramming the next load home'],
  ];
  frames.forEach(([p, what], i) => {
    const name = `volunteer-bank-climb-${i + 1}`;
    rows.push([name, `${WHO.volunteer}; at Concepción, October 28, 1835, under the cut riverbank: ${what} (frame ${i + 1} of 6). A slice of the bank - earth five or six feet high, a step cut in it, grass on the lip - is in the frame. ${STYLE}`,
      () => frame(name, VOLUNTEER, p, { after: bank }), [['volunteer-load', 1], ['volunteer-aim', 1]]]);
  });
  sheet('claude-bank-climb', R.concepcion, 'item 2: `volunteer-bank-climb-1`..`-6`: step up the cut, aim and fire over the lip, step down, load under the bank', rows, WIDE, 3);
  clips['volunteer-bank-climb'] = clip([[1, 500], [2, 700], [3, 140], [4, 450], [5, 900], [6, 900]].map(([i, d]) => [`volunteer-bank-climb-${i}`, d]), { loop: false, prompt: `${WHO.volunteer}: the climb-fire-drop cycle under the bank, the shot on the third frame.` });
}

// ---------------------------------------------------------------------------------------------------- C11: into the marsh
{
  const rows = [];
  for (const side of ['regular', 'volunteer']) {
    const spec = side === 'regular' ? { ...REGULAR } : VOLUNTEER, F = frameOf(spec), g = PO.g(F);
    const water = F.ankle + F.B.shin + F.B.thigh * 0.35;
    const runs = PO.run(F, { kind: KIND[side] }).map(p => ({ ...p, lean: 10, tool: null, hands: { near: PO.at(F, 12, -10), far: PO.at(F, -10, -18) }, elbows: { near: -1, far: -1 } }));
    runs.forEach((p, i) => {
      const name = `figure-wading-${side}-${i + 1}`;
      rows.push([name, `${WHO[side]}, his piece gone; wading hard through the marsh at San Jacinto, the water up to his thighs, the arms working (frame ${i + 1} of 4). No blood, nobody shot close (VISION.md §16; docs/BATTLES.md §2b.2). ${STYLE}`,
        // The water's surface is the ground the page stands him on: the anchor is at the waterline, his legs below it unseen.
        () => personFrame(name, ink => { group(ink, [0, -water], 1, sub => drawPerson(sub, spec, { ...p, feet: { near: [p.feet.near[0] * 0.55, F.ankle], far: [p.feet.far[0] * 0.55, F.ankle + 4] } }), { clip: [-200, water, 400, 300] }); waterLine(ink, 0, { from: -30, to: 30, splash: i % 2 ? 6 : 2 }); }, { note: name, ...AT }),
        [[`${side}-march-1`, 1], ['water-ripple', 0.8]]]);
    });
    clips[`figure-wading-${side}`] = clip([1, 2, 3, 4].map(i => [`figure-wading-${side}-${i}`, 210]), { prompt: `${WHO[side]}: wading through the marsh, four frames.` });
  }
  sheet('claude-wading', R.sanjac, 'item 4: `figure-wading` (a man up to the thighs in water, running, in either side\'s clothes); no blood, nobody shot close', rows);
  clips['figure-wading'] = clip([1, 2, 3, 4].map(i => [`figure-wading-regular-${i}`, 210]), { prompt: 'The rout into the marsh at San Jacinto: a Mexican infantryman wading, four frames (the clip the page asks for; `figure-wading-volunteer` is a Texian).' });
}

// C12, the Gonzales gun's crew (`settler-gun-ram`, `-carry`, `-fire`): Astra delivered her civilian cannon crew on 2026-10-03
// (survivor-travel-gonzales-crew-2026-10-03), so Claude's three settlers of the same names were deleted when it was merged.

export const SHEETS = sheets;
export const CLIPS = clips;
