// Soldiers at rest (request 2026-09-28 — ambient life, item 3): `volunteer-clean-rifle`, `volunteer-camp-sit`,
// `volunteer-camp-cook` and the same for `regular-`, two frames each, east-facing (mirrored for west). Plugs into the camps'
// men (sim/ambient.mjs `CAMP_TEXIAN`, `CAMP_MEXICAN`; public/ambient.js `figureClip`): a rifle cleaned instead of the
// ramrod's stroke, which read as loading, and men sitting and cooking at the fire in the soldiers' own figures.
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
  'clean-rifle': { near: 'ramrod', what: ['sitting on a log, the musket across the knees, a rag at the lock', 'the rag run up the barrel toward the muzzle'] },
  'camp-sit': { near: 'idle-e', what: ['sitting on a log at ease, forearms on the knees', 'sitting back, a tin cup raised to drink'] },
  'camp-cook': { near: 'load', what: ['kneeling at a small fire, stirring an iron pot with a long spoon, steam rising', 'the spoon drawn round the pot'] },
};
export const NEAREST = { 'clean-rifle': 'volunteer-gun-ram', 'camp-sit': 'volunteer-idle-e', 'camp-cook': 'volunteer-fire-reload' };

export const SHEETS = { 'claude-camp-rest': { cell: { w: 400, h: 400 }, scale: 0.6, columns: 6, request: REQUEST,
  replaceWith: 'item 3: two frames each, east-facing and mirrored for west, the soldier figure\'s own logical height and foot baseline',
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
