// Soldiers at rest (request 2026-09-28 — ambient life, item 3): `volunteer-camp-cook` and `regular-camp-cook`, two frames
// each, east-facing (mirrored for west). Plugs into the camps' men (sim/ambient.mjs `CAMP_TEXIAN`, `CAMP_MEXICAN`;
// public/ambient.js `figureClip`): men cooking at the fire in the soldiers' own figures. Cleaning a rifle and sitting at ease
// are Astra's `-camp-clean` and `-rest-sit` (2026-10-03); Claude's `-clean-rifle` and `-camp-sit` were deleted at the merge of
// 2026-10-04.
//
// Drawn from the rig's volunteer (a Texian in his own frontier clothes) and regular (the 1836 line infantryman, dark blue coatee,
// red facings, white crossbelt, shako) - interpretations at play size, not a uniform plate - at the soldiers' own longer
// build. Temporary: Astra's clip of the same name replaces each.
import { personFrame, frameOf } from '../kit/rig.mjs';
import { CAMP, CAMP_TIMING, drawPosed } from '../kit/work-poses.mjs';

export const AREA = 'work';
export const DATE = '2026-09-28';
export const FIGURES = ['volunteer', 'regular'];
const REQUEST = 'Request 2026-09-28 — ambient life';
const POSES = {
  'camp-cook': { near: 'load', what: ['kneeling at a small fire, stirring an iron pot with a long spoon, steam rising', 'the spoon drawn round the pot'] },
};
export const NEAREST = { 'camp-cook': 'volunteer-fire-reload' };

export const SHEETS = { 'claude-camp-rest': { cell: { w: 400, h: 400 }, scale: 0.6, columns: 6, request: REQUEST,
  replaceWith: 'item 3: men cooking at the fire, two frames each, east-facing and mirrored for west, the soldier figure\'s own logical height and foot baseline',
  frames: FIGURES.flatMap(figure => Object.entries(POSES).flatMap(([pose, { near, what }]) => CAMP[pose](frameOf(figure)).map((p, i) => ({
    name: `${figure}-${pose}-${i + 1}`, compare: [[`${figure}-${near}`, 1], [`${figure}-e`, 1]],
    prompt: `A ${figure === 'volunteer' ? 'Texian volunteer in his own frontier clothes, slouch hat' : 'Mexican line infantryman of 1836, dark blue coatee with red facings, white crossbelt, shako'} at rest in camp, ${pose.replace('-', ' ')}, frame ${i + 1} of 2: ${what[i]}. Side on, facing east; an interpretation at play size, not a uniform plate; nothing pointed at anyone; warm hand-drawn storybook style, dark olive-brown outline, flat shade, transparent ground, no shadow, no text.`,
    draw: () => personFrame(`${figure}-${pose}-${i + 1}`, ink => drawPosed(ink, figure, p), { scale: p.scale || 1, note: `${figure} ${pose}, frame ${i + 1} of 2: ${what[i]}` }),
  })))) } };

export const CLIPS = Object.fromEntries(FIGURES.flatMap(figure => Object.entries(POSES).map(([pose, { what }]) => [`${figure}-${pose}`, {
  frames: CAMP_TIMING[pose].map((duration, i) => ({ sprite: `${figure}-${pose}-${i + 1}`, duration })),
  loop: true, motion: 'none', direction: 'east; west by mirroring',
  prompt: `${figure} ${pose.replace('-', ' ')} in camp, two frames looping (${CAMP_TIMING[pose].join(', ')} ms): ${what.join('; ')}.`,
}])));
