// The battles' works and props (docs/CLAUDE_ART_PLAN.md area C: C9, C15, C16, C17, C18, C19; C4 and C5's are Astra's since
// 2026-10-03): a Mexican column on the march,
// Castrillón's ammunition crate, the Grass Fight's slit bundle, a padre with a cart after Concepción, the armies' camps on the map, and the Alamo's north-wall and church
// guns. Claude's temporary art: interpretive silhouettes, never an exact portrait of a surviving gun or a documented object.
//
// People-scale props are drawn in the person rig's units (a person 100 tall, the frame's logical height 300 = one person), so
// the page draws them at the figure's own size; the flags match the size and anchor of Astra's `flag-come-and-take-it` and
// `gonzales-flag-work-*` frames so they drop into the same calls.
//
// Sources: the breastwork "constructed of packs and baggage, leaving an opening in the centre" (Houston, HIST-TEX-522); the
// plaza's barricades of ditch, earth bank and posts with a gun embrasure (Field; Dance; the 2007 excavation under Main Plaza -
// docs/battle-research/staging.md §3.9); the Alamo's church platform held three guns on an earth ramp (the Sánchez Navarro plan,
// strongly supported) and the north wall two or three - their calibres are not known, so the guns drawn are generic iron pieces
// (https://www.sonsofdewittcolony.org/adp/history/1836/the_battle/the_weapons/cannon.html); the Come and Take It flag's star
// rests on Smithwick's late memoir alone and is disputed (https://www.tshaonline.org/handbook/entries/gonzales-come-and-take-it-cannon).
import { personFrame, drawPerson, frameOf } from '../kit/rig.mjs';
import { Ink, frameSvg, add, lerp, blob, capsule, curve, ellipse, poly, f2 } from '../kit/svg.mjs';
import { LINE, PALETTE, UNIT, tone } from '../kit/style.mjs';
import { drawMounted } from '../kit/horse.mjs';
import { COATS, quadPose, drawQuadSide } from '../kit/quadruped.mjs';
import { POSES } from '../kit/poses.mjs';
import { REGULAR_PACK, MX_OFFICER, PADRE } from '../battle-kit/figures.mjs';
import * as PO from '../battle-kit/poses.mjs';
import { drawGun, seg, COLOURS } from '../battle-kit/gear.mjs';
import { EARTH, EARTH_DARK, GRASS, STONE, STONE_DARK } from '../battle-kit/props.mjs';
import { nested, group } from '../battle-kit/groups.mjs';
import { clip, STYLE, NO_GORE } from '../battle-kit/sheet.mjs';

export const AREA = 'battles';
export const DATE = '2026-09-28';
const R = {
  sanjac: 'Request 2026-09-25 — San Jacinto',
  storming: 'Request 2026-09-25 — the storming of Béxar',
  advance: 'Request 2026-09-26 — the Mexican advance',
  famous: 'Request 2026-09-26 — the famous people: the roster\'s remaining figures and poses',
  concepcion: 'Request 2026-09-25 — Concepción and the Grass Fight',
  gonzales: 'Request 2026-09-25 — Gonzales before the fight',
  armies: 'Claude-drawn stand-ins (replace with Astra\'s)',
  alamo: 'Request 2026-09-25 — the Alamo: ladders, the guns served, the walls manned, night',
};
const sheets = {}, clips = {};
const sheet = (id, request, replaceWith, cell, frames, columns) => { sheets[id] = { cell, columns, request, replaceWith, frames }; };
/** A prop drawn in the person rig's units in a cell of its own, its logical height one person unless `persons` says. */
const prop = (name, cell, originX, draw, { persons = 1, groundY } = {}) => ({ ...personFrame(name, draw, { note: name, cell, originX, ...(groundY && { groundY }) }), logicalHeight: Math.round(300 * persons) });

// C4 (San Jacinto's stacked muskets and breastwork of packs) and C5 (Béxar's street barricade and sandbag breastwork) are
// Astra's (2026-10-03: `musket-stack-*`, `breastwork-packs-left`/`-right`, `barricade-street-*`, `sandbag-*`): Claude's were
// deleted at the merge of 2026-10-04.

// ---------------------------------------------------------------------------------------------------- C9: a column on the march
{
  const F = frameOf(REGULAR_PACK), march = PO.march(F, { kind: 'musket' });
  const frames = [0, 1, 2, 3].map(i => ({ name: `regular-march-column-${i + 1}`, height: 1, compare: [['regular-march-1', 1], ['dragoon-march-1', 1.35]],
    prompt: `A Mexican column on the march through the Runaway Scrape, spring 1836 (frame ${i + 1} of 4, east): eight infantrymen in files of three - blue coatees, white trousers, shakos, knapsacks with blanket rolls, muskets at the trail - a mounted officer at the head in a shako with a gold pompom and a red sash, and a two-wheeled baggage cart behind drawn by a mule, loaded with sacks under a cloth. Seen from a little above and to the side; the files in step. ${STYLE}`,
    draw: () => personFrame(`regular-march-column-${i + 1}`, ink => {
      // The cart behind, with its mule.
      const cx = -320;
      group(ink, [cx + 70, 0], 0.8, sub => drawQuadSide(sub, 'mule', quadPose('mule', { gait: 'walk', frame: i }), { coat: COATS.mouse, halter: true }));
      ink.line(seg([cx + 18, 26], [cx + 80, 42]), { colour: '#6a4a2e', width: 3 });
      ink.shape(poly([[cx - 34, 20], [cx + 22, 20], [cx + 24, 40], [cx - 36, 40]]), '#8a6a44', { off: 1 });
      ink.shape(blob([[cx - 32, 40], [cx - 26, 58], [cx - 4, 62], [cx + 16, 56], [cx + 22, 40]], 0.6), '#d8c8a0', { off: 1.2, lift: true });
      ink.shape(ellipse([cx - 4, 18], 17, 17), '#6a4a2e', { off: 1 }); ink.shape(ellipse([cx - 4, 18], 4, 4), '#3a2616', { shade: false, outline: 1.8 });
      for (let a = 0; a < 6; a++) ink.line(seg([cx - 4, 18], [cx - 4 + Math.cos(a) * 15, 18 + Math.sin(a) * 15]), { width: 1.8 });
      // Three ranks of three (the last rank two), the far file first; every man in step.
      const men = [];
      for (let rank = 0; rank < 3; rank++) for (let file = 0; file < 3; file++) if (!(rank === 2 && file === 0)) men.push({ x: -150 + rank * 52 + (2 - file) * 6, y: (2 - file) * 9, file });
      men.sort((a, b) => b.y - a.y);
      for (const m of men) nested(ink, REGULAR_PACK, march[(i + (m.file === 1 ? 0 : 0)) % 4], [m.x, m.y], 1);
      // The officer at the head, on a dark horse.
      const hx = 70, dark = { coat: '#4a2e1e', mane: '#1a1210', hoof: '#1e1612', blaze: '#f2e6cc', tack: '#3a2418', saddle: '#3a2418', blanket: '#2f3f6a' };
      group(ink, [hx, 0], 1, sub => drawMounted(sub, MX_OFFICER, i, { coat: COATS.black, tack: 'military', blanket: dark.blanket }));
    }, { note: `regular-march-column ${i + 1}`, cell: { w: 1700, h: 600 }, originX: 1060, groundY: 560 }) }));
  sheet('claude-march-column', R.advance, 'item 3: `regular-march-column` (six to eight infantry in files of three, a mounted officer at the head, a cart behind; 4 frames, east), the `regular-*`/`dragoon-*` height', { w: 1700, h: 600 }, frames, 2);
  clips['regular-march-column'] = clip([1, 2, 3, 4].map(n => [`regular-march-column-${n}`, 200]), { prompt: 'A Mexican column on the march, east: files in step, the officer riding at the head, the cart behind; four frames at the regulars\' march pace.' });
}

// ---------------------------------------------------------------------------------------------------- C15: Castrillón's crate
sheet('claude-ammunition-crate', R.famous, 'Castrillón and the rest: a scale-matched ammunition crate under his command pose', { w: 400, h: 400 }, [{ name: 'ammunition-crate', compare: [['castrillon-command', 1], ['crate', 0.6]],
  prompt: `A Mexican army ammunition crate of plain boards with rope handles and iron corners, about knee high to a man and a little wider, three-quarter from the front: the box General Castrillón got up on to rally his men at San Jacinto (the battle's caption; scaled to the famous sheets' people). ${STYLE}`,
  draw: () => prop('ammunition-crate', { w: 400, h: 400 }, 200, ink => {
    ink.shape(poly([[-24, 0], [18, 0], [18, 22], [-24, 22]]), '#8a6a44', { off: 1.2 });
    ink.shape(poly([[-24, 22], [18, 22], [28, 30], [-14, 30]]), '#a8865a', { shade: false, outline: LINE.outer });
    ink.shape(poly([[18, 0], [28, 8], [28, 30], [18, 22]]), '#6a4e30', { shade: false, outline: LINE.outer });
    for (const y of [7.5, 15]) ink.line(seg([-24, y], [18, y]), { width: 1.4, opacity: 0.6 });
    ink.line(curve([[-12, 16], [-3, 11], [6, 16]]), { colour: '#c8a060', width: 2.2 });
    for (const [x, y] of [[-24, 0], [18, 0], [-24, 22], [18, 22]]) ink.shape(poly([[x - 1.5, y - 1.5], [x + 2.5, y - 1.5], [x + 2.5, y + 2.5], [x - 1.5, y + 2.5]]), PALETTE.iron, { shade: false, outline: 1.2 });
  }) }]);

// ---------------------------------------------------------------------------------------------------- C16: the Grass Fight; after Concepción
{
  // `grass-bundle-cut`: Astra's (2026-10-03, with her grass-laden mules) retired Claude's when merged.
  const F = frameOf(PADRE), walk = PO.shortWalk(F, POSES.walk(F), 0.7);
  const frames = walk.map((pose, i) => ({ name: `padre-carts-${i + 1}`, compare: [['cart-baggage', 1.25], ['volunteer-march-1', 1]],
    prompt: `After Concepción, October 28, 1835: a padre of Béxar in a black cassock and a broad flat hat walking east ahead of a two-wheeled cart drawn by a mule, leading it, come for the Mexican dead and wounded (Smithwick gives it only in outline; kept general). The cart's load is covered with a blanket: no one is shown in it, no wound, no blood (VISION.md §16). Frame ${i + 1} of 4. ${STYLE}`,
    draw: () => personFrame(`padre-carts-${i + 1}`, ink => {
      const cx = -100;
      group(ink, [cx + 80, 0], 0.8, sub => drawQuadSide(sub, 'mule', quadPose('mule', { gait: 'walk', frame: i }), { coat: COATS.mouse, halter: true }));
      ink.line(seg([cx + 22, 26], [cx + 90, 42]), { colour: '#6a4a2e', width: 3 });
      ink.shape(poly([[cx - 40, 20], [cx + 26, 20], [cx + 28, 38], [cx - 42, 38]]), '#8a6a44', { off: 1 });
      ink.shape(blob([[cx - 38, 38], [cx - 30, 50], [cx - 4, 53], [cx + 20, 49], [cx + 26, 38]], 0.6), '#7a6a5a', { off: 1.2, lift: true });
      ink.shape(ellipse([cx - 6, 18], 17, 17), '#6a4a2e', { off: 1 }); ink.shape(ellipse([cx - 6, 18], 4, 4), '#3a2616', { shade: false, outline: 1.8 });
      for (let a = 0; a < 6; a++) ink.line(seg([cx - 6, 18], [cx - 6 + Math.cos(a) * 15, 18 + Math.sin(a) * 15]), { width: 1.8 });
      nested(ink, PADRE, { ...pose, hands: { near: PO.at(F, 3, -14), far: PO.at(F, 1, -13) }, elbows: { near: 1, far: 1 } }, [cx + 196, -3], 1);
    }, { note: `padre with a cart ${i + 1}`, cell: { w: 800, h: 420 }, originX: 420, groundY: 392 }) }));
  sheet('claude-padre-carts', R.concepcion, 'item 8: a padre with carts for the dead and wounded after Concepción (told in the caption today); nothing of the dead shown', { w: 800, h: 420 }, frames, 2);
  clips['padre-carts'] = clip([1, 2, 3, 4].map(n => [`padre-carts-${n}`, 260]), { prompt: `A padre walking beside a covered cart after Concepción: four frames at a slow walk. ${NO_GORE}` });
}

// C17, the Come and Take It flag without its disputed star and half-painted on the table: Astra's no-star wind loop and flat
// half and finished states, with and without the star, since 2026-10-07 (gonzales-flag-variants-2026-10-07), merged 2026-10-09.

// ---------------------------------------------------------------------------------------------------- C18: the armies' camps
{
  const camp = (name, side) => personFrame(name, outer => group(outer, [0, 0], 0.5, ink => {
    const cloth = side === 'mexican' ? '#cfc6b2' : '#d8cdb4';
    const tent = (x, y, s) => {
      ink.shape(poly([[x - 30 * s, y], [x - 6 * s, y + 46 * s], [x + 30 * s, y + 40 * s], [x + 46 * s, y - 2 * s]]), tone(cloth, -0.12), { shade: false, outline: LINE.outer });
      ink.shape(poly([[x - 30 * s, y], [x - 6 * s, y + 46 * s], [x + 12 * s, y - 2 * s]]), cloth, { off: 1.4 });
      ink.shape(poly([[x - 16 * s, y], [x - 6 * s, y + 24 * s], [x + 2 * s, y]]), '#4a3a28', { shade: false, outline: LINE.inner });
    };
    const tents = side === 'mexican' ? [[-70, 44, 1.1], [30, 50, 1.2], [-10, 70, 0.9]] : [[-80, 42, 1.1], [-8, 60, 1], [56, 44, 1.1], [100, 66, 0.8]];
    for (const [x, y, s] of tents.sort((a, b) => b[1] - a[1])) tent(x, y, s);
    // Stacked arms and the colour on its pole.
    const sx = side === 'mexican' ? 70 : -40;
    for (const [bx, down] of [[-12, 1], [12, -1], [1, 1]]) drawGun(ink, [sx + bx, 20], [sx + bx * 0.1, 64], { kind: side === 'mexican' ? 'musket' : 'rifle', down, bayonet: side === 'mexican' });
    const px = side === 'mexican' ? -118 : 128;
    ink.shape(capsule([px, 10], [px, 130], 1.6, 1.4), '#6b563a', { shade: false, outline: 2.6 });
    if (side === 'mexican') {
      // The tricolour of 1823: green, white and red, the eagle a small dark mark at its centre.
      [['#2e7a3a', 0], ['#efe6d0', 1], ['#b8342a', 2]].forEach(([c, k]) => ink.shape(poly([[px + k * 14, 128], [px + (k + 1) * 14, 127], [px + (k + 1) * 14, 96], [px + k * 14, 97]]), c, { shade: false, outline: 2.2 }));
      ink.dot(ellipse([px + 21, 112], 3, 3), '#6a4a2a');
    } else {
      // A plain company colour: no one Texian flag flew in 1835-36, so a buff cloth with nothing on it (an interpretation).
      ink.shape(poly([[px, 128], [px + 38, 124], [px + 38, 98], [px, 100]]), '#c9b47a', { off: 1.2 });
    }
    // The kettle on its crane over the fire's place (the page draws the fire and its smoke over it).
    ink.line(seg([-10, 0], [-10, 26]), { width: 2.6 }); ink.line(seg([10, 0], [10, 26]), { width: 2.6 }); ink.line(seg([-11, 25], [11, 25]), { width: 2.4 });
    ink.shape(blob([[-6, 20], [6, 20], [5, 13], [0, 11.5], [-5, 13]], 0.7), '#2e2a26', { off: 0.5 });
  }), { note: name, cell: { w: 520, h: 520 }, originX: 260, groundY: 400 });
  const frames = ['mexican', 'texian'].map(side => ({ name: `army-camp-${side}`, height: 1.6, compare: [['tent-small', 1.2], ['campfire', 0.7]],
    prompt: `The ${side === 'mexican' ? 'Mexican army\'s' : 'Texian army\'s'} camp on the campaign map: ${side === 'mexican' ? 'three' : 'four'} wedge tents, a kettle on a crane over the fire's place, stacked arms and a colour on a pole (${side === 'mexican' ? 'the green, white and red tricolour of 1823' : 'a plain buff company colour - no single Texian flag flew in 1835-36, an interpretation'}), seen from a little above; the page draws the fire, its smoke and the men. ${STYLE}`,
    // Its logical height is set so that the page's camp size (`size` in public/army-view.js) draws the tents as tall as its canvas tents.
    draw: () => ({ ...camp(`army-camp-${side}`, side), logicalHeight: 96 }) }));
  // As one-frame clips (a clip's name is never a frame's), because the map asks for the camp through its `animated` (public/army-view.js).
  for (const side of ['mexican', 'texian']) clips[`army-camp-${side}-pitched`] = clip([[`army-camp-${side}`, 4000]], { direction: 'as drawn', prompt: `The ${side} army's camp on the map, held still: the page draws the fire and its smoke over it.` });
  sheet('claude-army-camp', R.armies, 'the armies on the map: a camp of three or four wedge tents, a cook fire with a pot, stacked arms and a colour on a pole, 192 by 192 in the map art\'s own light', { w: 520, h: 520 }, frames, 2);
}

// ---------------------------------------------------------------------------------------------------- C19: the Alamo's guns
{
  // An iron gun on a wooden carriage, the muzzle east (the page mirrors it for west); `garrison` a four-truck carriage on a
  // timber platform (the church's), else a field carriage with a trail (the north wall's). Recoil: rolled back, muzzle up.
  const gunFrame = (name, { garrison, recoil }) => ({ ...personFrame(name, ink => {
    const back = recoil ? -12 : 0, lift = recoil ? 3 : 0;
    if (garrison) {
      ink.shape(poly([[-80, -1.5], [70, -1.5], [74, 8], [-84, 8]]), '#8a6a44', { off: 1.2 });
      for (let x = -76; x < 70; x += 18) ink.line(seg([x, -1.5], [x + 2, 8]), { width: 1.4, opacity: 0.7 });
      ink.shape(poly([[back - 40, 12], [back + 30, 12], [back + 26, 34], [back - 36, 30]]), '#7a5a38', { off: 1.2 });
      for (const x of [-30, 20]) { ink.shape(ellipse([back + x, 13], 9, 9), '#6a4a2e', { off: 1 }); ink.shape(ellipse([back + x, 13], 2.4, 2.4), '#2a1e14', { shade: false, outline: 1.2 }); }
      ink.shape(poly([[back - 58, 34 + lift * 0.2], [back + 62, 38 + lift], [back + 62, 48 + lift], [back - 58, 46 + lift * 0.2]]), '#3e3c38', { off: 1.2, lift: true });
      ink.shape(ellipse([back - 62, 40], 7, 7), '#3e3c38', { off: 0.6 });
      ink.shape(ellipse([back + 62, 43 + lift], 3, 5.5), '#141210', { shade: false, outline: 1.6 });
      for (const x of [-30, 10, 40]) ink.line(seg([back + x, 36 + lift * 0.3], [back + x, 47 + lift * 0.4]), { colour: '#5a5852', width: 1.6 });
      return;
    }
    ink.shape(poly([[back - 70, -1], [back - 60, -1], [back + 6, 26], [back - 2, 30]]), '#7a5a38', { off: 1 });
    ink.shape(poly([[back - 24, 22 + lift * 0.3], [back + 52, 28 + lift], [back + 52, 37 + lift], [back - 24, 34 + lift * 0.3]]), '#3e3c38', { off: 1.2, lift: true });
    ink.shape(ellipse([back - 28, 28], 6, 6), '#3e3c38', { off: 0.6 });
    ink.shape(ellipse([back + 52, 32.5 + lift], 2.6, 4.6), '#141210', { shade: false, outline: 1.6 });
    ink.shape(ellipse([back + 4, 20], 20, 20), '#6a4a2e', { off: 1.2 });
    ink.line(ellipse([back + 4, 20], 16, 16), { width: 2 });
    for (let a = 0; a < 7; a++) ink.line(seg([back + 4, 20], [back + 4 + Math.cos(a * 0.9) * 16, 20 + Math.sin(a * 0.9) * 16]), { width: 2 });
    ink.shape(ellipse([back + 4, 20], 4, 4), '#2a1e14', { shade: false, outline: 1.4 });
  }, { note: name, cell: { w: 560, h: 400 }, originX: 300 }), logicalHeight: 420 });
  const frames = [];
  for (const [id, garrison, where] of [['north', false, 'the north wall\'s battery (two or three guns there, their calibres not known: a generic iron field gun)'], ['church', true, 'the church\'s platform (three guns on an earth ramp in the apse, by the Sánchez Navarro plan; some say two were 12-pounders - disputed): a heavier iron gun on a four-truck garrison carriage on its timber platform']]) {
    for (const dir of ['e', 'w']) for (const recoil of [false, true]) {
      const name = `cannon-alamo-${id}-${recoil ? 'recoil-' : ''}${dir}`;
      frames.push({ name, compare: [[`cannon-iron-${dir}`, 1.4], ['cannon-18pdr-e', 2.2]], prompt: `The Alamo, February-March 1836: the gun of ${where}, ${recoil ? 'in recoil: rolled back on its carriage, the muzzle kicked up' : 'at rest'}, muzzle ${dir === 'e' ? 'east' : 'west'}; an interpretive silhouette, not a portrait of a surviving gun. ${STYLE}`,
        draw: () => {
          const f = gunFrame(name, { garrison, recoil });
          if (dir === 'e') return f;
          // West: the same drawing mirrored about the anchor, so a frame the page draws unflipped faces west.
          return { ...f, svg: f.svg.replace(/<g filter="url\(#grain\)"([^>]*)>/, `<g filter="url(#grain)"$1><g transform="translate(600 0) scale(-1 1)">`).replace(/<\/g>\s*<\/svg>\s*$/, '</g></g>\n</svg>\n'), anchorX: +(300 / 560).toFixed(4) };
        } });
    }
  }
  sheet('claude-alamo-guns', R.alamo, 'item 2: specific art for the Alamo\'s north-wall and church guns (rest and recoil, both facings), at the field guns\' scale', { w: 560, h: 400 }, frames, 4);
  for (const id of ['north', 'church']) for (const dir of ['e', 'w']) clips[`cannon-alamo-${id}-${dir}-recoil`] = clip([[`cannon-alamo-${id}-${dir}`, 110], [`cannon-alamo-${id}-recoil-${dir}`, 180], [`cannon-alamo-${id}-${dir}`, 470]], { loop: false, direction: dir === 'e' ? 'east' : 'west', prompt: `The Alamo's ${id} gun firing: at rest, the recoil, back at rest (as the painted Twin Sisters' recoil clip).` });
}

export const SHEETS = sheets;
export const CLIPS = clips;
