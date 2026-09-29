// The Esparza family (request 2026-09-26 — the Esparza family, items 1-6; docs/CLAUDE_ART_PLAN.md C14; docs/BATTLES.md §14.6):
// Ana Salazar de Esparza, María de Jesús, Enrique, Francisco Esparza, the burial party that carried Gregorio to the Campo
// Santo, and Gregorio asleep beside his family on the night of March 5. Famous sheets as the delivered ones are: four east,
// two south and two north walking frames, then the poses the battles and the request ask for.
//
// No likeness is claimed for anybody (none survives of any of them but Enrique's photographs as an old man); the dress is 1830s
// Béxar as it is usually described - a rebozo over a camisa and skirt, a short jacket, a sash, calzoneras, a sombrero - an
// interpretation (sources in scripts/claude-art/battle-kit/figures.mjs). The burial party carries a body wrapped whole in a
// blanket and tied: no face, no wound, no blood (VISION.md §16). Claude's temporary art.
import { frameOf, personFrame, drawPerson } from '../kit/rig.mjs';
import { CAST, LINE } from '../kit/style.mjs';
import { POSES } from '../kit/poses.mjs';
import { add, lerp, blob, capsule, curve, ellipse } from '../kit/svg.mjs';
import { ESPARZA } from '../battle-kit/figures.mjs';
import * as PO from '../battle-kit/poses.mjs';
import { drawGun, seg } from '../battle-kit/gear.mjs';
import { nested } from '../battle-kit/groups.mjs';
import { person, clip, STYLE, NO_GORE, NO_LIKENESS } from '../battle-kit/sheet.mjs';

export const AREA = 'battles';
export const DATE = '2026-09-28';
const REQUEST = 'Request 2026-09-26 — the Esparza family';
const REPLACE = 'a famous sheet as scripts/art-deliveries/famous-people.mjs delivers them (four east, two south, two north walking frames, then the poses); the `volunteer-*` logical height for grown people, the library\'s children\'s for the children; east mirrored for west; no gore; no likeness claimed';
const promptFor = (id, what) => `${ESPARZA[id].who}. ${ESPARZA[id].look}. ${what}. ${NO_LIKENESS} ${STYLE}`;
// Francisco, the youngest (two or three): the library's small child's build, in a Tejano child's colouring and a white gown.
const TODDLER = { ...CAST.smallchild, skin: '#c9895a', hair: '#231812', shirt: '#efe6d0', lower: { kind: 'gown', colour: '#efe6d0' } };

const SKIRTED = new Set(['ana-esparza', 'maria-de-jesus']);
const WALKS = (F, id) => [
  ...(SKIRTED.has(id) ? PO.shortWalk(F, POSES.walk(F), 0.55) : POSES.walk(F)).map((pose, i) => [`walk-e-${i + 1}`, pose, `walking east, frame ${i + 1} of 4`]),
  ...POSES['walk-s'](F).map((pose, i) => [`walk-s-${i + 1}`, pose, `walking toward the camera, frame ${i + 1} of 2`]),
  ...POSES['walk-n'](F).map((pose, i) => [`walk-n-${i + 1}`, pose, `walking away from the camera, frame ${i + 1} of 2`]),
];
const idle = F => ({ view: 'e', pelvis: PO.P(F), lean: 2, feet: { near: PO.foot(F, 3.5), far: PO.foot(F, -3) } });

/** A folded blanket held against the chest in both arms (the blanket each woman was given at Músquiz's house). */
const blanket = at => ink => {
  ink.shape(blob([add(at, [-4, 3.5]), add(at, [9, 4]), add(at, [9.5, -3.5]), add(at, [-4, -4])], 0.3), '#7a6a8a', { off: 0.6 });
  for (const y of [-1.8, 1.2]) ink.line(seg(add(at, [-3.8, y]), add(at, [9.2, y + 0.2])), { colour: '#d8c8a0', width: 1.6 });
};

function poses(id) {
  const one = ESPARZA[id], F = frameOf(one.spec), g = PO.g(F);
  const out = [['idle', idle(F), 'standing still']];
  if (id === 'ana-esparza') {
    out[0][2] = 'standing, the rebozo drawn close';
    out.push(['seated', PO.sitFloor(F), 'seated huddled on the floor of the church, the arms round her knees']);
    // Seated on the floor with an arm round a small child pressed against her side.
    const sit = PO.sitFloor(F, { hug: false, lean: 8 });
    out.push(['shelter-with-children', { ...sit, hands: { near: PO.at(F, 8, -24), far: add(sit.hands.far, [0, 0]) } }, 'seated on the floor, an arm round a small child pressed to her side', null, ink => nested(ink, TODDLER, PO.sitFloor(frameOf(TODDLER), { hug: true, lean: 16 }), [9 * g, 0], 0.46)]);
    out.push(['hold-blanket', { ...idle(F), hands: { near: PO.at(F, 7, -12), far: PO.at(F, 5, -10) }, elbows: { near: 1, far: 1 } }, 'standing, holding against her chest the folded blanket the officers gave each woman', null, blanket(PO.at(F, 7, -10))]);
  }
  if (id === 'maria-de-jesus' || id === 'enrique-esparza') out.push(['seated-huddled', PO.sitFloor(F, { lean: 16, tilt: 10 }), 'seated huddled on the floor, the arms round the knees']);
  if (id === 'enrique-esparza') out.push(['look', { ...idle(F), tilt: -22, lean: -4 }, 'standing, looking up (the moment he remembered)']);
  if (id === 'francisco-esparza') {
    const k = PO.kneelPose(F, { lean: 14 });
    out.push(['kneel-at-grave', { ...k, tilt: 18, hands: { near: PO.at(F, 8, -16 + (k.pelvis[1] - F.hip) / g), far: PO.at(F, 6, -15 + (k.pelvis[1] - F.hip) / g) }, elbows: { near: 1, far: 1 } },
      'kneeling at the grave in the Campo Santo, his head bowed and his sombrero in his hands', null, ink => {
        const c = PO.at(F, 9, -14 + (k.pelvis[1] - F.hip) / g);
        ink.shape(ellipse(c, 3 * g, 11 * g, 8), '#8a6a3e', { off: 0.6 });
        ink.shape(ellipse(add(c, [0.8 * g, 0]), 2.2 * g, 4.5 * g, 8), '#7a5c34', { shade: false, outline: LINE.inner });
      }]);
  }
  return out;
}

const sheets = {}, clips = {};
for (const id of ['ana-esparza', 'maria-de-jesus', 'enrique-esparza', 'francisco-esparza']) {
  const one = ESPARZA[id], F = frameOf(one.spec), child = one.spec.age === 'child';
  // A kneeling man's hat is in his hands, not on his head.
  const bare = { ...one.spec, hat: null };
  const list = [...WALKS(F, id).map(([pose, p, what]) => [pose, p, what]), ...poses(id)];
  const compare = child ? [[id === 'enrique-esparza' ? 'boy-idle-e' : 'girl-idle-s', 1]] : id === 'ana-esparza' ? [['alavez-idle-e', 1], ['susanna-dickinson-idle', 1]] : [['esparza-idle', 1], ['esparza-walk-e-1', 1]];
  sheets[`claude-${id}`] = { cell: { w: 400, h: 400 }, columns: 4, request: REQUEST, replaceWith: REPLACE,
    frames: list.map(([pose, p, what, before, after]) => ({ name: `${id}-${pose}`, compare, prompt: promptFor(id, what),
      draw: () => person(`${id}-${pose}`, pose === 'kneel-at-grave' ? bare : one.spec, p, { note: `${id}, ${what}`, before, after }) })) };
  clips[`${id}-walk-e`] = clip([1, 2, 3, 4].map(i => [`${id}-walk-e-${i}`, child ? 170 : 190]), { prompt: `${one.who}, walking east, four frames. ${NO_LIKENESS}` });
  clips[`${id}-walk-s`] = clip([1, 2].map(i => [`${id}-walk-s-${i}`, 260]), { direction: 'south', prompt: `${one.who}, walking toward the camera. ${NO_LIKENESS}` });
  clips[`${id}-walk-n`] = clip([1, 2].map(i => [`${id}-walk-n-${i}`, 260]), { direction: 'north', prompt: `${one.who}, walking away from the camera. ${NO_LIKENESS}` });
}

// Ana walking with the toddler (Francisco, two or three) on her hip: four frames.
{
  const one = ESPARZA['ana-esparza'], F = frameOf(one.spec), g = PO.g(F), T = frameOf(TODDLER);
  const frames = PO.shortWalk(F, POSES.walk(F), 0.55).map((pose, i) => {
    const bob = (pose.pelvis[1] - F.hip) / g;
    return { name: `ana-esparza-carry-toddler-${i + 1}`, compare: [['susanna-dickinson-carry-angelina', 1]], prompt: promptFor('ana-esparza', `walking east with a child of two on her hip, frame ${i + 1} of 4`),
      draw: () => personFrame(`ana-esparza-carry-toddler-${i + 1}`, ink => {
        drawPerson(ink, one.spec, { ...pose, hands: { near: PO.at(F, 6, -18 + bob), far: PO.at(F, 3, -12 + bob) }, elbows: { near: 1, far: 1 } });
        nested(ink, TODDLER, { ...PO.sitFloor(T, { hug: false, lean: 4 }), view: 'e' }, add(PO.at(F, 1, -30 + bob), [0, 0]), 0.44);
        // Her near arm round the child, drawn over it.
        ink.shape(capsule(PO.at(F, 1, -12 + bob), PO.at(F, 7, -17 + bob), F.B.limb * 0.42, F.B.limb * 0.36), one.spec.shirt, { off: 0.4 });
      }, { note: `Ana Esparza carrying her youngest, frame ${i + 1}` }) };
  });
  sheets['claude-ana-esparza-carry'] = { cell: { w: 400, h: 400 }, columns: 4, request: REQUEST, replaceWith: `${REPLACE}; \`ana-esparza-carry-toddler\`, a child of two on her hip, walking east`, frames };
  clips['ana-esparza-carry-toddler'] = clip([1, 2, 3, 4].map(i => [`ana-esparza-carry-toddler-${i}`, 210]), { prompt: `${one.who}: walking east with her youngest on her hip, four frames. ${NO_LIKENESS}` });
}

// The burial party (item 4): Francisco in front, a brother behind, the litter between them at the hands, and on it a body wrapped
// whole in a blanket and tied at three places. Anchored at the front man's feet, as `drawBearers` draws the named bearer there.
{
  const front = ESPARZA['francisco-esparza'].spec, rear = ESPARZA['esparza-brother'].spec, F = frameOf(front), g = PO.g(F);
  const walk = POSES.walk(F), back = -118;
  const frames = walk.map((pose, i) => {
    const other = walk[(i + 2) % 4], bob = (pose.pelvis[1] - F.hip) / g;
    return { name: `burial-party-walk-e-${i + 1}`, compare: [['esparza-walk-e-1', 1], ['volunteer-march-1', 1]],
      prompt: `The burial party of the afternoon of March 6, 1836: Francisco Esparza in front and one of his brothers behind, two Tejano men of Béxar in town clothes (short jackets, sashes, calzoneras, sombreros), walking east one behind the other, carrying between them on a litter of two poles Gregorio Esparza's body wrapped whole in a brown blanket and tied at three places - no face, no body shown, no wound, no blood (VISION.md §16); frame ${i + 1} of 4. ${NO_LIKENESS} ${STYLE}`,
      draw: () => personFrame(`burial-party-walk-e-${i + 1}`, ink => {
        const hand = y => PO.at(F, 0, y);
        const rearHands = add([back, 0], PO.at(F, 10, -21 + bob));
        const frontHands = PO.at(F, -9, -21 + bob);
        nested(ink, rear, { ...other, hands: { near: PO.at(F, 10, -21 + bob), far: PO.at(F, 8, -20 + bob) }, elbows: { near: 1, far: 1 } }, [back, 0], 1);
        // The poles and the wrapped body on them.
        const a = add(rearHands, [-4, 0]), b = add(frontHands, [5, 0]);
        ink.shape(capsule(a, b, 1.1, 1.1), '#8a6a44', { shade: false, outline: 3 });
        const l = lerp(a, b, 0.14), r = lerp(a, b, 0.86);
        ink.shape(blob([add(l, [0, 1]), add(l, [4, 8]), add(lerp(l, r, 0.5), [0, 9]), add(r, [-2, 9.5]), add(r, [3, 4]), add(r, [0, 0.5]), add(lerp(l, r, 0.5), [0, 0])], 0.7), '#7a5a3c', { off: 1.2 });
        for (const t of [0.2, 0.5, 0.8]) { const c = lerp(l, r, t); ink.line(curve([add(c, [-0.6, 0.6]), add(c, [0.3, 5]), add(c, [0.6, 8.8])]), { colour: '#d8c090', width: 2.2 }); }
        nested(ink, front, { ...pose, hands: { near: PO.at(F, -9, -21 + bob), far: PO.at(F, -8, -20 + bob) }, elbows: { near: -1, far: -1 } }, [0, 0], 1);
        void hand;
      }, { note: `the burial party, frame ${i + 1}`, cell: { w: 720, h: 400 }, originX: 540 }) };
  });
  sheets['claude-burial-party'] = { cell: { w: 720, h: 400 }, columns: 2, request: REQUEST, replaceWith: 'item 4: `burial-party-walk-e` (4 frames): two Tejano men carrying on a litter a body wholly wrapped, readable at 40 and 160 px', frames };
  clips['burial-party-walk-e'] = clip([1, 2, 3, 4].map(i => [`burial-party-walk-e-${i}`, 230]), { prompt: 'The burial party walking east with the wrapped body on its litter: four frames at a slow bearer\'s pace. No face, no wound, no blood (VISION.md §16).' });
}

// Gregorio asleep beside his family (item 6): sitting on the floor, his back to the wall, his head down, the musket beside him.
{
  const one = ESPARZA.esparza, F = frameOf(one.spec), g = PO.g(F);
  const sit = PO.sitFloor(F, { hug: false, lean: -10, tilt: 26 });
  sheets['claude-esparza-seated'] = { cell: { w: 400, h: 400 }, request: REQUEST, replaceWith: 'item 6: `esparza-seated`, Gregorio sitting against a wall asleep, his musket beside him, in his famous-esparza dress',
    frames: [{ name: 'esparza-seated', compare: [['esparza-idle', 1], ['esparza-still', 1]], prompt: promptFor('esparza', 'sitting on the floor of the sacristy with his back to the wall on the night of March 5, 1836, asleep, the head fallen forward, the hands in his lap and his musket leaning beside him'),
      draw: () => person('esparza-seated', one.spec, { ...sit, hands: { near: add(sit.pelvis, [9 * g, 5 * g]), far: add(sit.pelvis, [7 * g, 6 * g]) } }, { note: 'Gregorio Esparza asleep sitting',
        before: ink => drawGun(ink, [-14 * g, F.ankle], [-4 * g, F.ankle + 70 * g], { kind: 'musket', down: 1 }) }) }] };
}

export const SHEETS = sheets;
export const CLIPS = clips;
