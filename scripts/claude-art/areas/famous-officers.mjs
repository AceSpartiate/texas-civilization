// The famous people the roster still drew from the library's generic figures (request 2026-09-26 — the famous people: the
// roster's remaining figures and poses, items 1 and 3; docs/CLAUDE_ART_PLAN.md C13 and C15): J. W. Smith, Kimbell, Martin,
// Horton, W. P. Smith, Smither (Texians) and Condelle, Sánchez Navarro, Barragán (Mexican officers), each a famous sheet as the
// delivered ones are (four east, two south, two north walking frames, then the poses, `<person>-*`), with a horse for the five
// the battles have riding; and Castrillón's north and south walks, which his delivered sheet lacks.
//
// Not drawn here, because Astra has delivered them on `main` since the plan was written (2026-09-28: famous-austin, -urrea,
// -deaf-smith, -karnes, -neill, -lamar, -sherman, -rusk, -hockley, -mcculloch, -johnson, -grant): a Claude stand-in for any of
// them would only lose to hers in the loader.
//
// Every face is an original interpretation, never a likeness (docs/BATTLES.md §2c); the dress and what is known of each
// person, with sources and how sure each detail is, are in scripts/claude-art/battle-kit/figures.mjs. Drawn from the person
// rig with the battle kit's dress; Claude's temporary art.
import { frameOf } from '../kit/rig.mjs';
import { POSES } from '../kit/poses.mjs';
import { mountedFrame } from '../kit/horse.mjs';
import { add } from '../kit/svg.mjs';
import { FAMOUS } from '../battle-kit/figures.mjs';
import * as PO from '../battle-kit/poses.mjs';
import { drawSword } from '../battle-kit/gear.mjs';
import { person, clip, STYLE, NO_GORE, NO_LIKENESS } from '../battle-kit/sheet.mjs';

export const AREA = 'battles';
export const DATE = '2026-09-28';
export const PEOPLE = ['jw-smith', 'kimbell', 'martin', 'horton', 'wp-smith', 'smither', 'condelle', 'sanchez-navarro', 'barragan'];
const MEXICAN = new Set(['condelle', 'sanchez-navarro', 'barragan', 'castrillon']);
const REQUEST = 'Request 2026-09-26 — the famous people: the roster\'s remaining figures and poses';
const REPLACE = 'a 4×4 famous sheet as scripts/art-deliveries/famous-people.mjs delivers them: four east, two south, two north walking frames and the poses, the `volunteer-*` logical height, east mirrored for west, no gore, no likeness claimed';
const compareOf = id => MEXICAN.has(id) ? [['castrillon-idle', 1], ['cos-idle', 1]] : [['travis-idle', 1], ['moore-idle', 1]];

/** The poses each person is drawn in beyond the walks: what the battles ask of them (sim/battles/*.mjs `people`). */
function posesOf(id) {
  const one = FAMOUS[id], F = frameOf(one.spec), arm = F.B.upperArm + F.B.forearm, mx = MEXICAN.has(id);
  const o = PO.officer(F, { sword: mx });
  const out = [
    ['idle', o.stand, 'standing at ease, the weight on the back foot'],
    ['speak', o.speak, 'speaking, the right forearm raised and the palm open'],
    ['command', mx ? o.command : { ...o.command, hands: { near: PO.at(F, 13, 17), far: o.command.hands.far }, after: null }, mx ? 'giving an order, the sword raised forward over the head, the weight on the front foot' : 'calling the men on, the right arm raised forward, the weight on the front foot'],
    ['point', o.point, 'pointing the way with the right arm at full length'],
  ];
  if (one.fires) {
    const c = PO.fireCycle(F, { kind: one.fires });
    out.push(['aim', c.aim, 'aiming a long rifle from a braced stance, the butt in the shoulder'], ['fire', c.fire, 'firing: the recoil rocks the shoulders back and lifts the muzzle']);
  }
  if (one.falls) out.push(['fall', PO.fall(F), 'falling back, the arms thrown out; ' + NO_GORE], ['still', { view: 'e', lying: true }, 'lying still on his back on the ground; ' + NO_GORE]);
  if (id === 'wp-smith') out.push(['address', { ...o.speak, lean: -4, hands: { near: PO.at(F, 10, 19), far: PO.at(F, 5, 16) }, elbows: { near: -1, far: -1 } }, 'preaching to the men, both hands raised'],
    ['listen', { ...o.stand, tilt: 8, hands: { near: PO.at(F, 3, -18), far: PO.at(F, 1, -19) } }, 'listening, the head bowed and the hands clasped before him']);
  if (id === 'smither') out.push(['call', { ...o.speak, hands: { near: PO.at(F, 10, 12), far: PO.at(F, 8, 13) }, elbows: { near: -1, far: -1 }, mouth: 'open' }, 'calling out "Don\'t shoot!", both hands raised open']);
  if (id === 'sanchez-navarro') out.push(['parley', { ...o.speak, mouth: undefined, hands: { near: PO.at(F, 15, -4), far: PO.at(F, 1, -arm * 0.88) },
    after: (ink, j) => ink.shape(`M ${j.handNear[0] - 1} ${j.handNear[1] + 2} l 7 2.5 l 1.2 -7 l -7 -2.5 Z`, '#f2ead8', { shade: false, outline: 2.2 }) }, 'holding out a folded paper at the parley over the terms']);
  if (id === 'barragan') out.push(['protect', { ...o.point, hands: { near: PO.at(F, 24, 10), far: PO.at(F, -2, -arm * 0.86) }, mouth: 'open' }, 'stepping in with the left hand at his sabre and the right arm out, palm up, to stop two soldiers']);
  if (id === 'condelle') out.push(['address', { ...o.command, hands: { near: PO.at(F, 8, 22), far: o.command.hands.far } }, 'rallying his battalion, the sword held up']);
  if (mx) out.push(['listen', { ...o.stand, tilt: 6, hands: { near: PO.at(F, 5, -12), far: PO.at(F, -2, -arm * 0.88) } }, 'listening, a hand at the sword hilt']);
  return out;
}

const WALKS = F => [
  ...POSES.walk(F).map((pose, i) => [`walk-e-${i + 1}`, pose, `walking east, frame ${i + 1} of 4 (near foot forward, passing, far foot forward, passing)`]),
  ...POSES['walk-s'](F).map((pose, i) => [`walk-s-${i + 1}`, pose, `walking toward the camera, frame ${i + 1} of 2`]),
  ...POSES['walk-n'](F).map((pose, i) => [`walk-n-${i + 1}`, pose, `walking away from the camera, frame ${i + 1} of 2`]),
];
const promptFor = (id, what) => `${FAMOUS[id].who}. ${FAMOUS[id].look}. ${what}. ${NO_LIKENESS} ${STYLE}`;

const sheets = {}, clips = {};
for (const id of PEOPLE) {
  const one = FAMOUS[id], F = frameOf(one.spec);
  const frames = [...WALKS(F), ...posesOf(id)].map(([pose, p, what]) => ({
    name: `${id}-${pose}`, compare: compareOf(id), prompt: promptFor(id, what),
    draw: () => person(`${id}-${pose}`, one.spec, p, { note: `${id}, ${what}` }),
  }));
  sheets[`claude-famous-${id}`] = { cell: { w: 400, h: 400 }, columns: 4, request: REQUEST, replaceWith: REPLACE, frames };
  clips[`${id}-walk-e`] = clip([1, 2, 3, 4].map(i => [`${id}-walk-e-${i}`, 190]), { direction: 'east; west by mirroring', prompt: `${one.who}, walking east: the four-frame walk at the delivered famous sheets' pace (190 ms a frame). ${NO_LIKENESS}` });
  clips[`${id}-walk-s`] = clip([1, 2].map(i => [`${id}-walk-s-${i}`, 260]), { direction: 'south', prompt: `${one.who}, walking toward the camera, two frames. ${NO_LIKENESS}` });
  clips[`${id}-walk-n`] = clip([1, 2].map(i => [`${id}-walk-n-${i}`, 260]), { direction: 'north', prompt: `${one.who}, walking away from the camera, two frames. ${NO_LIKENESS}` });
  if (one.mounted) {
    const mounted = [0, 1, 2, 3].map(i => ({ name: `${id}-mounted-walk-e-${i + 1}`, frame: i, what: `riding east at the walk, frame ${i + 1} of 4` })).concat([{ name: `${id}-mounted-idle-e`, frame: null, what: 'on horseback, halted' }]);
    sheets[`claude-famous-${id}-mounted`] = { cell: { w: 760, h: 560 }, columns: 3, request: REQUEST, replaceWith: `${REPLACE}; mounted walk and idle as famous-houston-mounted`,
      frames: mounted.map(m => ({ name: m.name, height: 1.35, compare: [['houston-mounted-idle-e', 1.35], ['burleson-mounted-idle-e', 1.35]], prompt: promptFor(id, `${m.what}, on a chestnut horse (the library's family horse, not a documented mount)`),
        draw: () => mountedFrame(m.name, one.spec, m.frame, { note: `${id}, ${m.what}` }) })) };
    clips[`${id}-mounted-walk-e`] = clip([1, 2, 3, 4].map(i => [`${id}-mounted-walk-e-${i}`, 230]), { prompt: `${one.who}, riding east at the walk: four frames at the mounted courier's pace. ${NO_LIKENESS}` });
  }
}

// Castrillón's north and south walks (C15): his delivered sheet has an east walk only.
{
  const one = FAMOUS.castrillon, F = frameOf(one.spec);
  const walks = WALKS(F).filter(([pose]) => !pose.startsWith('walk-e'));
  sheets['claude-famous-castrillon-ns'] = { cell: { w: 400, h: 400 }, columns: 4, request: REQUEST, replaceWith: 'Castrillón\'s north and south walks (two frames each) in his delivered famous-castrillon dress and scale',
    frames: walks.map(([pose, p, what]) => ({ name: `castrillon-${pose}`, compare: [['castrillon-idle', 1], ['castrillon-walk-e-1', 1]], prompt: promptFor('castrillon', what),
      draw: () => person(`castrillon-${pose}`, one.spec, p, { note: `castrillon, ${what}` }) })) };
  clips['castrillon-walk-s'] = clip([1, 2].map(i => [`castrillon-walk-s-${i}`, 270]), { direction: 'south', prompt: `${one.who}: walking toward the camera, two frames at his delivered east walk's pace. ${NO_LIKENESS}` });
  clips['castrillon-walk-n'] = clip([1, 2].map(i => [`castrillon-walk-n-${i}`, 270]), { direction: 'north', prompt: `${one.who}: walking away from the camera, two frames. ${NO_LIKENESS}` });
}

export const SHEETS = sheets;
export const CLIPS = clips;
