// The armies fighting, at rest and carrying their hurt (docs/CLAUDE_ART_PLAN.md area C: C2, C3, C4, C5, C6, C7, C8, C10, C11,
// C12): the Texian volunteer and the Mexican line infantryman in the poses the battle engine stands in for today - two men
// carrying a third on a blanket, cleaning a rifle, sitting, cooking, resting and asleep in camp, firing through a loophole,
// forcing a door with a crowbar, digging a trench, firing over a parapet, a cazador lying in the grass, a skirmisher running
// and kneeling to fire, climbing a cut bank to fire over its lip, wading through the marsh, and three settlers serving the
// Gonzales gun. Every figure faces east (mirrored for west) unless its name says -s or -n.
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

// ---------------------------------------------------------------------------------------------------- C2: the wounded carried
{
  const F = frameOf(VOLUNTEER), g = PO.g(F), walk = POSES.walk(F), back = -104;
  const hurt = { ...VOLUNTEER, hat: null };
  const rows = walk.map((pose, i) => {
    const other = walk[(i + 2) % 4], bob = (pose.pelvis[1] - F.hip) / g;
    const name = `bearers-carry-${i + 1}`;
    return [name, `Two Texian volunteers walking east one behind the other, carrying between them a wounded comrade in a grey blanket slung by its corners, his head and one arm showing, alive and sitting half up; frame ${i + 1} of 4. ${WHO.volunteer} (all three). ${NO_GORE} ${STYLE}`,
      () => personFrame(name, ink => {
        const rh = add([back, 0], PO.at(F, 10, -20 + bob)), fh = PO.at(F, -9, -20 + bob);
        nested(ink, VOLUNTEER, { ...other, hands: { near: PO.at(F, 10, -20 + bob), far: PO.at(F, 9, -19 + bob) }, elbows: { near: 1, far: 1 } }, [back, 0], 1);
        // The man carried: lying on his back in the sag of the blanket, head toward the front man, knees up.
        const mid = lerp(rh, fh, 0.5);
        group(ink, add(mid, [18, -10]), 0.82, sub => drawPerson(sub, hurt, { ...PO.sitFloor(F, { hug: false, lean: 4 }), hands: { near: PO.at(F, 10, -12), far: PO.at(F, 6, -16) } }), { rotate: -96 });
        ink.shape(blob([add(rh, [0, 1]), add(lerp(rh, fh, 0.25), [0, -9]), add(mid, [0, -12]), add(lerp(rh, fh, 0.75), [0, -9]), add(fh, [0, 1]), add(mid, [0, -3])], 0.7), '#8a7f6e', { off: 1.4 });
        ink.line(curve([add(lerp(rh, fh, 0.3), [0, -5]), add(mid, [0, -8]), add(lerp(rh, fh, 0.7), [0, -5])]), { colour: '#9a3a2a', width: 2.2 });
        nested(ink, VOLUNTEER, { ...pose, hands: { near: PO.at(F, -9, -20 + bob), far: PO.at(F, -8, -19 + bob) }, elbows: { near: -1, far: -1 } }, [0, 0], 1);
      }, { note: name, cell: { w: 680, h: 400 }, originX: 500 }), [['volunteer-march-1', 1], ['volunteer-injured', 1]]];
  });
  sheet('claude-bearers-carry', R.battles, 'item 3: `bearers-carry-1`..`-4`, two men carrying a third on a blanket, walking east; no blood', rows, { w: 680, h: 400 }, 2);
  clips['bearers-carry'] = clip([1, 2, 3, 4].map(i => [`bearers-carry-${i}`, 240]), { prompt: `Two volunteers carrying a wounded man back from the line in a blanket, walking east. ${NO_GORE}` });
}

// ---------------------------------------------------------------------------------------------------- C3, C4: at rest in camp
for (const side of ['volunteer', 'regular']) {
  const spec = SPEC[side], F = frameOf(spec), g = PO.g(F), kind = KIND[side], len = kind === 'rifle' ? 78 : 74;
  const sit = PO.sitFloor(F, { hug: false, lean: 10 });
  const knees = add(sit.pelvis, [F.B.thigh * 0.62, F.B.thigh * 0.72]);
  const across = (ink, dy = 0) => drawGun(ink, add(knees, [-len * 0.62 * g, 1.5 + dy]), add(knees, [len * 0.38 * g, 5 + dy]), { kind, down: -1 });
  const rows = [];
  // Cleaning the rifle: sitting, the piece across the knees, a wiping rod worked in and out of the muzzle.
  for (const [i, x] of [[1, 6], [2, 16]]) {
    const name = `${side}-clean-rifle-${i}`;
    rows.push([name, `${WHO[side]}; sitting on the ground cleaning his piece: the barrel across his knees, a wiping rod worked into the muzzle (frame ${i} of 2: the rod ${i === 1 ? 'pushed in' : 'drawn out'}). ${STYLE}`,
      () => frame(name, spec, { ...sit, hands: { near: add(knees, [x * g, 5]), far: add(knees, [-6 * g, 3]) } }, { after: ink => { across(ink); drawRamrod(ink, add(knees, [(x - 2) * g, 5.5]), add(knees, [(x + 24) * g, 6.5])); } }), [[`${side}-ramrod`, 1], [`${side}-injured`, 1]]]);
  }
  // Sitting at the fire, the arms on the knees; the head turned to the next man and back.
  for (const i of [1, 2]) {
    const name = `${side}-camp-sit-${i}`;
    rows.push([name, `${WHO[side]}; sitting on the ground in camp, the arms round the knees, the piece laid beside him, ${i === 1 ? 'looking ahead' : 'the head turned to talk'} (frame ${i} of 2). ${STYLE}`,
      () => frame(name, spec, { ...PO.sitFloor(F, { hug: true, lean: 10, tilt: i === 1 ? 6 : -14 }), mouth: i === 2 ? 'open' : undefined }, { before: ink => drawGun(ink, [-30 * g, 1], [(len - 30) * g, 3], { kind, down: -1 }) }), [[`${side}-injured`, 1]]]);
  }
  // Cooking: crouched at a small fire, stirring the kettle.
  for (const i of [1, 2]) {
    const name = `${side}-camp-cook-${i}`, k = PO.kneelPose(F, { lean: 26 });
    rows.push([name, `${WHO[side]}; crouched on one knee at a small cook fire, stirring a kettle hung over it with a stick (frame ${i} of 2). ${STYLE}`,
      () => frame(name, spec, { ...k, tilt: -8, hands: { near: PO.at(F, 22 + (i === 1 ? 0 : 3), -34), far: PO.at(F, 8, -38) }, elbows: { near: 1, far: 1 } },
        { before: ink => cookFire(ink, 33 * g, { phase: i - 1 }), after: ink => ink.line(seg(PO.at(F, 22 + (i === 1 ? 0 : 3), -33), [33 * g + (i === 1 ? -1 : 2), 13]), { colour: COLOURS.leatherLight, width: 2.2 }) }), [['campfire', 0.9]]]);
  }
  // At rest (San Jacinto's camp, the afternoon of April 21): sitting with the piece across the knees; asleep.
  {
    const name = `${side}-rest-sit`;
    rows.push([name, `${WHO[side]}; sitting at rest on the ground, the piece across his knees, the hands on it: resting, not hurt. ${STYLE}`,
      () => frame(name, spec, { ...sit, tilt: 10, hands: { near: add(knees, [4 * g, 5]), far: add(knees, [-8 * g, 4]) } }, { after: ink => across(ink) }), [[`${side}-injured`, 1]]]);
    const sleep = `${side}-sleep`;
    rows.push([sleep, `${WHO[side]}; asleep on his back on the ground, his head on his pack, his knees drawn up, his hat tipped over his face and a blanket over his legs, the piece beside him - plainly asleep, never to be mistaken for \`${side}-reclining\` (a man killed, lying flat under a blanket to the chin). ${STYLE}`,
      () => personFrame(sleep, ink => {
        drawGun(ink, [-58, 1], [-58 + len * 0.95, 2.5], { kind, down: 1 });
        // The pack under the head.
        ink.shape(blob([[-66, 0], [-66, 11], [-52, 12], [-51, 0]], 0.4), side === 'regular' ? '#5a4632' : COLOURS.leatherLight, { off: 0.8 });
        // On his back with his head on the pack, the hat over his face, the blanket over his legs only.
        const bare = { ...spec, hat: null };
        group(ink, [6, 3], 1, sub => drawPerson(sub, bare, { view: 'e', lying: true }));
        const head = [6 + F.hip * 0.55 - F.headC, 3 + F.B.limb * 1.25];
        ink.shape(ellipse(add(head, [1, F.B.head * 0.9]), F.B.head * 1.5, F.B.head * 0.45, -10), spec.hat.colour || '#6a5236', { off: 0.6 });
        ink.shape(blob([[head[0] + 42, 1], [head[0] + 44, 17], [head[0] + 70, 17], [head[0] + 86, 13], [head[0] + 88, 1]], 0.6), '#8a7f6e', { off: 1 });
      }, { note: sleep, ...AT }), [[`${side}-reclining`, 1], [`${side}-injured`, 1]]]);
  }
  sheet(`claude-${side}-camp`, side === 'volunteer' ? R.ambient : R.ambient, `${R.ambient} item 3 (clean-rifle, camp-sit, camp-cook, 2 frames each) and request 2026-09-25 San Jacinto item 2 (rest-sit, sleep): the \`${side}-*\` logical height, east mirrored for west`, rows);
  for (const act of ['clean-rifle', 'camp-sit', 'camp-cook']) clips[`${side}-${act}`] = clip([[`${side}-${act}-1`, act === 'camp-sit' ? 2200 : 520], [`${side}-${act}-2`, act === 'camp-sit' ? 1600 : 520]], { prompt: `${WHO[side]}, at rest in camp: ${act.replace('-', ' ')}, two frames looping.` });
}

// ---------------------------------------------------------------------------------------------------- C5: Béxar's streets
{
  const rows = [];
  for (const side of ['volunteer', 'regular']) {
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
  // Forcing a door with a crowbar (Karnes and the men of Johnson's division): set, heave, heave, it gives.
  {
    const F = frameOf(VOLUNTEER), g = PO.g(F), door = ink => doorEdge(ink, 30 * g);
    const bar = (tip, hand) => ink => { ink.shape(capsule(hand, tip, 1.1, 0.8), '#4a4844', { shade: false, outline: 2.6 }); };
    const tip = [31 * g, F.neck - 12];
    const poses = [
      [{ view: 'e', pelvis: PO.P(F, 2, -1), lean: 12, feet: { near: PO.foot(F, 12), far: PO.foot(F, -6) }, knees: { near: 1, far: 1 }, hands: { near: PO.at(F, 18, -8), far: PO.at(F, 16, -6) } }, 'setting the bar\'s end into the crack of the door'],
      [{ view: 'e', pelvis: PO.P(F, -4, -5), lean: -6, feet: { near: PO.foot(F, 10), far: PO.foot(F, -12) }, knees: { near: 1, far: 1 }, hands: { near: PO.at(F, 8, -12), far: PO.at(F, 6, -10) } }, 'heaving back on the bar, the weight on the back foot'],
      [{ view: 'e', pelvis: PO.P(F, -7, -8), lean: -14, feet: { near: PO.foot(F, 10), far: PO.foot(F, -14) }, knees: { near: 1, far: 1 }, hands: { near: PO.at(F, 3, -18), far: PO.at(F, 1, -16) } }, 'heaving harder, leaning right back'],
      [{ view: 'e', pelvis: PO.P(F, -9, -4), lean: -4, feet: { near: PO.foot(F, 4), far: PO.foot(F, -16) }, knees: { near: 1, far: 1 }, hands: { near: PO.at(F, 2, -22), far: PO.at(F, 0, -20) } }, 'the door gives: he stumbles back with the bar'],
    ];
    poses.forEach(([p, what], i) => {
      const name = `volunteer-crowbar-${i + 1}`;
      rows.push([name, `${WHO.volunteer}, without his rifle; forcing a house's door with a crowbar at Béxar, December 1835 (Karnes, Johnson's report): ${what} (frame ${i + 1} of 4); the door post and the wall's edge in the frame. ${STYLE}`,
        () => frame(name, VOLUNTEER, p, { before: door, after: ink => { const j = [p.hands.near[0], p.hands.near[1]]; bar(i === 3 ? add(j, [22, 8]) : tip, j)(ink); } }), [['volunteer-ram-1', 1], ['wall-breach', 1.3]]]);
    });
    clips['volunteer-crowbar'] = clip([1, 2, 3, 4].map(i => [`volunteer-crowbar-${i}`, [420, 380, 520, 600][i - 1]]), { prompt: `${WHO.volunteer}: forcing a door with a crowbar - set, heave, heave, it gives - looping while the bar is at the door.` });
  }
  // Digging a trench across a street at night: the kit's spade cycle, the man standing in the trench behind its near bank.
  {
    const F = frameOf(VOLUNTEER);
    POSES.dig(F).forEach((p, i) => {
      const name = `volunteer-dig-${i + 1}`;
      rows.push([name, `${WHO.volunteer}, his rifle laid by; digging a trench across a street of Béxar at night with a spade - driven in, levered, the earth thrown up onto the bank, back (frame ${i + 1} of ${POSES.dig(F).length}) - standing in the trench behind the fresh earth of its near bank. ${STYLE}`,
        () => frame(name, VOLUNTEER, p, { after: ink => trenchBank(ink) }), [['rust-work-2', 1]]]);
    });
    clips['volunteer-dig'] = clip(POSES.dig(F).map((p, i) => [`volunteer-dig-${i + 1}`, [300, 260, 240, 320, 260, 220][i] ?? 260]), { beat: 0, prompt: `${WHO.volunteer}: digging a trench at night, the spade cycle looping; the spade goes in on the first frame.` });
  }
  sheet('claude-bexar-streets', R.storming, 'items 1, 3 and 4: a man firing through a loophole (volunteer and regular, 2-4 frames), a crowbar at a door (4 frames), digging a trench at night; the `volunteer-*`/`regular-*` height', rows);
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

// ---------------------------------------------------------------------------------------------------- C7: Coleto's marksmen
{
  const F = frameOf(CAZADOR), g = PO.g(F), rows = [];
  // Lying on the belly facing east, propped on the elbows, the legs out behind along the ground.
  const prone = (headUp, gun, what) => ({ view: 'e', pelvis: [-18 * g, F.B.limb * 0.55 + 1], lean: 80, tilt: headUp, feet: { near: [-62 * g, 2.5], far: [-58 * g, 4] }, knees: { near: -1, far: -1 },
    tool: gun, elbows: { near: -1, far: -1 }, what });
  const lie = prone(-58, null, 'lying still in the tall grass, the musket beside him, the head down');
  lie.hands = { near: PO.at(F, 8, -F.neck / g + 13), far: PO.at(F, 6, -F.neck / g + 14) };
  const base = [4 * g, F.B.limb * 0.55 + 11];
  const toG = p => [p[0] / g, (p[1] - (F.neck - 3)) / g];
  const aimGun = PO.gun(F, 'musket', toG(add(base, [0, 0])), toG(add(base, [70 * g, 2])), { near: 0.14, far: 0.34 });
  const fireGun = PO.gun(F, 'musket', toG(add(base, [-2, 1])), toG(add(base, [66 * g, 8])), { near: 0.14, far: 0.34 });
  const poses = [['lie', lie, lie.what, ink => drawGun(ink, [-8 * g, 1.5], [62 * g, 2.5], { kind: 'musket', down: 1 })], ['aim', prone(-66, aimGun, 'propped on his elbows in the grass, aiming the musket along the ground'), 'propped on his elbows in the grass, aiming the musket along the ground'], ['fire', prone(-60, fireGun, ''), 'the shot from the ground, the muzzle kicking up']];
  poses.forEach(([k, p, what, before]) => {
    const name = `regular-prone-${k}`;
    rows.push([name, `A Mexican cazador of a light company at Coleto, the night of March 19, 1836 - the line's blue coatee and white crossbelts, the shako with the green pompom of the light companies (strongly supported by secondary sources) - ${what}, facing east. ${STYLE}`,
      () => frame(name, CAZADOR, p, { before, cell: { w: 520, h: 400 }, originX: 250 }), [['regular-load', 1], ['regular-reclining', 1]]]);
  });
  sheet('claude-prone', R.coleto, 'item 1: `regular-prone-lie`, `regular-prone-aim`, `regular-prone-fire` (a cazador in the tall grass at night), east', rows, { w: 520, h: 400 }, 3);
  clips['regular-prone-fire-cycle'] = clip([['regular-prone-aim', 700], ['regular-prone-fire', 120], ['regular-prone-lie', 1650]], { loop: false, prompt: 'A cazador lying in the grass: aiming, the shot, and down again to load, as the fire-reload clip is timed.' });
}

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

// ---------------------------------------------------------------------------------------------------- C12: the Gonzales gun's crew
{
  const rows = [];
  const A = SETTLERS['settler-a'], B = SETTLERS['settler-b'], Cc = SETTLERS['settler-c'];
  const F = frameOf(A), g = PO.g(F);
  const rammer = (butt, tip) => ink => {
    ink.shape(capsule(butt, tip, 1.1, 1.1), '#b89a5e', { shade: false, outline: 2.8 });
    const d = [tip[0] - butt[0], tip[1] - butt[1]], l = Math.hypot(...d), u = [d[0] / l, d[1] / l];
    ink.shape(capsule(tip, add(tip, [u[0] * 7, u[1] * 7]), 2.6, 2.6), '#6a4a2e', { shade: false, outline: 2.6 });
  };
  const ram = [
    [{ view: 'e', pelvis: PO.P(F), lean: 2, feet: { near: PO.foot(F, 4), far: PO.foot(F, -4) }, hands: { near: PO.at(F, 8, -8), far: PO.at(F, 6, -2) } }, 'standing with the rammer staff upright', [[8, -30], [9, 34]]],
    [{ view: 'e', pelvis: PO.P(F, 2, -2), lean: 12, feet: { near: PO.foot(F, 10), far: PO.foot(F, -8) }, knees: { near: 1, far: 1 }, hands: { near: PO.at(F, 8, -14), far: PO.at(F, 16, -12) } }, 'bringing the staff down level toward the muzzle', [[-6, -16], [48, -10]]],
    [{ view: 'e', pelvis: PO.P(F, 6, -5), lean: 24, feet: { near: PO.foot(F, 16), far: PO.foot(F, -10) }, knees: { near: 1, far: 1 }, hands: { near: PO.at(F, 18, -18), far: PO.at(F, 28, -16) } }, 'the thrust: driving the charge home down the barrel', [[6, -20], [64, -13]]],
    [{ view: 'e', pelvis: PO.P(F, 1, -3), lean: 10, feet: { near: PO.foot(F, 12), far: PO.foot(F, -9) }, knees: { near: 1, far: 1 }, hands: { near: PO.at(F, 6, -16), far: PO.at(F, 14, -14) } }, 'drawing the staff back out', [[-10, -18], [46, -12]]],
  ];
  ram.forEach(([p, what, [a, b]], i) => {
    const name = `settler-gun-ram-${i + 1}`;
    rows.push([name, `A Gonzales settler of October 1835 in his own clothes (a rust shirt, braces, a black neckcloth, a felt hat, a short beard) serving the little bronze cannon on its cart wheels: ${what} (frame ${i + 1} of 4). ${STYLE}`,
      () => frame(name, A, p, { after: rammer(PO.at(F, ...a), PO.at(F, ...b)) }), [['volunteer-rammer-carry-1', 1], ['volunteer-ram-1', 1]]]);
  });
  const FB = frameOf(B), shot = at => ink => { ink.shape(ellipse(at, 4.2, 4.2), '#3a3836', { off: 0.8, lift: true }); };
  const carry = [
    [{ ...PO.kneelPose(FB, { lean: 38 }), tilt: -10, hands: { near: PO.at(FB, 14, -40), far: PO.at(FB, 12, -38) }, elbows: { near: 1, far: 1 } }, 'stooping to lift a round shot from the ground', PO.at(FB, 16, -41)],
    [{ ...POSES.walk(FB)[0], lean: 4, hands: { near: PO.at(FB, 9, -12), far: PO.at(FB, 7, -11) }, elbows: { near: 1, far: 1 } }, 'carrying the round shot to the gun in both hands', PO.at(FB, 11, -11)],
  ];
  carry.forEach(([p, what, at], i) => {
    const name = `settler-gun-carry-${i + 1}`;
    rows.push([name, `A second Gonzales settler (a blue shirt with braces, a wide straw hat, trousers rolled at the shin) serving the cart-wheel gun: ${what} (frame ${i + 1} of 2). ${STYLE}`,
      () => frame(name, B, p, { after: shot(at) }), [['volunteer-roundshot-lift', 1], ['volunteer-roundshot-carry', 1]]]);
  });
  const FC = frameOf(Cc);
  const linstock = (hand, tip) => ink => { ink.line(seg(hand, tip), { colour: '#6a4a2e', width: 2.6 }); ink.shape(ellipse(tip, 1.4, 1.4), '#e8903a', { shade: false, outline: 1.4 }); };
  const fire = [
    [{ view: 'e', pelvis: PO.P(FC, 2, -4), lean: 22, feet: { near: PO.foot(FC, 12), far: PO.foot(FC, -8) }, knees: { near: 1, far: 1 }, hands: { near: PO.at(FC, 18, -12), far: PO.at(FC, -4, -20) } }, 'reaching the lit match on its linstock to the touch-hole, leaning away from the gun', [PO.at(FC, 18, -12), PO.at(FC, 34, -26)]],
    [{ view: 'e', pelvis: PO.P(FC, -3, -1), lean: -6, tilt: -8, feet: { near: PO.foot(FC, 5), far: PO.foot(FC, -7) }, hands: { near: PO.at(FC, 3, 12), far: PO.at(FC, 0, 12) }, elbows: { near: -1, far: -1 } }, 'turned from the shot with his hands over his ears', null],
  ];
  fire.forEach(([p, what, stick], i) => {
    const name = `settler-gun-fire-${i + 1}`;
    rows.push([name, `A third Gonzales settler (an ochre shirt under a brown waistcoat, bare-headed, a moustache) serving the cart-wheel gun: ${what} (frame ${i + 1} of 2). ${STYLE}`,
      () => frame(name, Cc, p, { after: stick ? linstock(...stick) : null }), [['volunteer-lanyard-pull', 1], ['volunteer-cover-ears', 1]]]);
  });
  sheet('claude-settler-gun', R.battles, 'item 4: three settlers serving the Gonzales cart-wheel gun (`settler-gun-ram`, `-carry`, `-fire`), the `volunteer-*` height, east mirrored for west', rows);
  clips['settler-gun-ram'] = clip([[1, 260], [2, 240], [3, 360], [4, 300]].map(([i, d]) => [`settler-gun-ram-${i}`, d]), { loop: false, prompt: 'A settler ramming the Gonzales gun: staff up, down, the thrust, back (the volunteer-gun-ram timing).' });
  clips['settler-gun-carry'] = clip([[1, 420], [2, 420]].map(([i, d]) => [`settler-gun-carry-${i}`, d]), { prompt: 'A settler lifting and carrying round shot to the Gonzales gun.' });
  clips['settler-gun-fire'] = clip([[1, 360], [2, 700]].map(([i, d]) => [`settler-gun-fire-${i}`, d]), { loop: false, prompt: 'A settler touching off the Gonzales gun with a linstock and turning away, hands over his ears.' });
}

export const SHEETS = sheets;
export const CLIPS = clips;
