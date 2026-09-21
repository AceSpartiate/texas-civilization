// Standing in for the lesson the server will send, so the screen half of the guided start can be built and proved before
// `projectWorld` carries `world.lesson` (that side is being built in parallel, 2026-09-21). The contract is exactly the one
// being built to, and nothing here is a field the page invents: the page reads `world.lesson` and adds nothing to it.
//
//     world.lesson = { step, index, of, title, says, did, allow: ['chore:build-house'], done: false }
//
// Put into the snapshot as it is parsed rather than written onto the world afterwards, for the reason
// scripts/support/weather-stub.mjs gives: writing it on afterwards leaves a window in which the page draws a world with no
// lesson, and the panel is then rebuilt twice for every snapshot.

/** One step of the lesson, as the server will send it. */
export const stubLesson = (step, { index = 1, of = 10, title = '', says = '', did = null, allow = [], done = false } = {}) =>
  ({ step, index, of, title, says, did, allow, done });

/** The steps of the lesson the contract names, with the words a server would reasonably send for each. */
export const STUB_STEPS = Object.freeze([
  { step: 'arrive', title: 'Your family is coming in', says: 'Watch the wagon come in along the road. Nothing to do yet.', allow: [] },
  { step: 'order', title: 'Put somebody to work', says: 'Press the axe at the bottom of the screen to start work on the house.', allow: ['chore:build-house'] },
  { step: 'house', title: 'Raise the house', says: 'Keep them at the house until it stands.', allow: ['chore:build-house', 'order:stop-chore'] },
  { step: 'survey', title: 'Stake out ten acres', says: 'Press the stake, then choose a place on your own land.', allow: ['chore:survey-plot'] },
  { step: 'clear', title: 'Clear the plot', says: 'Press the grubbing hoe and choose the plot you staked.', allow: ['chore:clear-plot'] },
  { step: 'plant', title: 'Put in the seed', says: 'Press the young corn to turn the rows and put in your seed.', allow: ['chore:plant-field'] },
  { step: 'harvest', title: 'Bring in the crop', says: 'Press the ripe corn to cut the crop and carry it in.', allow: ['chore:harvest-field'] },
  { step: 'sell', title: 'Take it to town', says: 'Send your main person into Gonzales with what you have to sell.', allow: ['order:travel-gonzales'] },
  { step: 'hunt', title: 'Go out for meat', says: 'Press the rifle to send somebody to the timber to hunt.', allow: ['chore:hunt-timber', 'chore:hunt-land'] },
  { step: 'well', title: 'Dig the well', says: 'Press the bucket to dig down by the house until there is water.', allow: ['chore:dig-well'] },
]);

/** The n-th step of STUB_STEPS as the contract shapes it, counting from one. */
export const stubStep = (at, did = null) => stubLesson(STUB_STEPS[at - 1].step,
  { index: at, of: STUB_STEPS.length, title: STUB_STEPS[at - 1].title, says: STUB_STEPS[at - 1].says, did, allow: STUB_STEPS[at - 1].allow });

/**
 * Install on a Playwright context BEFORE any page script runs. Afterwards `holdLesson(page, lesson)` sets the step, and
 * `null` takes it away; every snapshot from then on carries it, including the one being parsed when it was set.
 */
export async function installLessonStub(context) {
  await context.addInitScript(() => {
    window.__lessonStub = null;
    const parse = JSON.parse;
    JSON.parse = function (...args) {
      const value = parse.apply(this, args);
      if (value && typeof value === 'object' && value.world && window.__lessonStub) value.world.lesson = window.__lessonStub;
      return value;
    };
  });
}

/** Set the step on a page whose context carries the stub, and put it on the snapshot already in hand. */
export async function holdLesson(page, lesson) {
  await page.evaluate(one => {
    window.__lessonStub = one;
    const world = window.__snapshot?.world;
    if (!world) return;
    if (one) world.lesson = one; else delete world.lesson;
  }, lesson);
  // The page redraws on the snapshot it is holding, so the strip and the bar are the step's before this returns.
  await page.evaluate(() => { if (window.__snapshot) window.__render?.(window.__snapshot); });
}
