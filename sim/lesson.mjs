// The guided beginning: docs/LESSON.md, `FIC-GONZ-210` to `-215`.
//
// A real class played this on Chromebooks on 2026-09-21. It ran. The students could not work out
// how to farm, or build a house, or do anything else. The owner's instruction:
//
// > "students couldn't figure out how to farm, or build a house, etc. we need to have the tutorial
// > be an integrated forced part of the game. they shouldn't be able to have freedom until they've
// > arrived at their farm, and been walked through each major function of the farming aspect. how to
// > delegate tasks, building a house, etc. one task at a time, guided by the ui and unavoidable. when
// > it's over, each student at their own pace should have built a house, farmed and sold a crop of
// > their choosing, hunted, and have a well on their land."
//
// So a student's own family walks through ten steps, in order, and **the server holds the gate**.
// While a step is running, `applyAction` refuses anything that is not on that step's `allow`, in
// words a twelve-year-old can read. The page uses the same list to grey the rest out, but the
// refusal is the server's, as every other rule in this codebase is: the client must never be the
// thing that decides what is possible.
//
// Four rules this file keeps, and each of them is load-bearing:
//
//   **A step completes when the world says so** and never when the page does. Every `done` below
//   reads the family's own state - a house that stands, ten acres cleared, coin in the house.
//   **Each student goes at their own pace.** The lesson is one family's, stored on that family, and
//   the Host's clock is untouched. Fifteen families may be on fifteen different steps.
//   **Nothing the game itself asks a family is ever refused** (`ALWAYS`). A lesson that could refuse
//   "help the neighbour" or "the army is asking" would break the afternoon it exists to teach.
//   **A family nobody plays has no lesson at all**, and neither has a family that was already
//   settled when the lesson first looked at it - which is every class saved before today. No save
//   version moved: `household.lesson` absent is worked out from what the family has, and for a
//   family standing in its own finished house the answer is "nothing to teach".
//
// Invented entire. Nothing here asserts anything about 1835, so the block of `HIST-TEX` numbers set
// aside for it is deliberately unused; docs/LESSON.md §7 says so.
import { record } from './events.mjs';
import { CHORES } from './chores.mjs';
import { choosing } from './homesite.mjs';
import { houseOf, houseSettled } from './houses.mjs';
import { clearedPlots, plotsOf, sownPlots } from './fields.mjs';

/**
 * What a student may always do, whatever step they are on.
 *
 * Two kinds of thing. The first is the family's own housekeeping - naming somebody, choosing who is
 * asked, setting the appearance - which moves nothing in the world. The second, and the reason this
 * list is long, is **every answer the game itself puts to a family**: the neighbour's call, the
 * march upriver, the rumor, the army's questions, the road east. Those arrive on the game's clock,
 * not the student's, and a rider left standing at a door because a lesson would not let anybody
 * answer him is a worse bug than the one this file fixes.
 *
 * `travel` is here for the same reason: somebody who answered a call and is standing in town has to
 * be able to walk home, and no step's own list would let them. So is trading with another family,
 * which is between two students and cannot be left half-said; so is helping raise a neighbour's
 * walls, which can only be done standing on that neighbour's land and is refused there by its own
 * rules; and so are the founding choices, which a solo game makes with the clock already running
 * (sim/headless.mjs) and which every other class makes in the lobby, where there is no lesson.
 */
export const ALWAYS = Object.freeze([
  'rename', 'set-main', 'set-auto', 'set-appearance', 'place-item', 'work', 'rest', 'travel',
  'stop-chore', 'answer-chore', 'ask-rider', 'leave-rider',
  'roll-family', 'load-wagon', 'bring-stock',
  'offer', 'accept-offer', 'decline-offer', 'withdraw-offer', 'chore:help-raise',
  'help', 'stay', 'go-see', 'stay-home', 'go-upriver', 'stay-in-town', 'turn-out', 'stay-put',
  'send-for', 'detachment-go', 'detachment-stay', 'army-answer', 'houston-answer', 'alamo-courier',
  'road-answer', 'flee', 'flight-stay', 'winter-recall',
]);

/**
 * Everything that gets a roof over the family.
 *
 * One list for the order and for the house, because they are the same work: on the real land a house
 * is planned piece by piece and wants logs in the pile first (sim/houseplot.mjs), so felling,
 * hauling and fetching are part of building and not a detour from it. On the invented country the
 * plan is one bar of work and the felling chores are not offered at all - `choresFor` hides them,
 * and a list naming work this class does not have costs nothing.
 */
const HOUSE_WORK = Object.freeze([
  'plan-house', 'place-piece', 'remove-piece',
  'chore:build-house', 'chore:cut-lane', 'fell-trees', 'chore:fell-trees', 'chore:haul-logs', 'chore:fetch-logs',
]);

/**
 * Every work a family can be given, for the one step that is about giving an order rather than about the work itself.
 *
 * Built from `CHORES` rather than written out, so a work added later is on this list the day it exists and the step
 * cannot quietly go empty again.
 */
const ANY_WORK = Object.freeze([...HOUSE_WORK, ...Object.keys(CHORES).map(id => `chore:${id}`)]);

/** Which of the family's people are out hunting: used to know a hunt has been made and come home from. */
const HUNTS = new Set(['hunt-land', 'hunt-timber']);
/** The errands that are a sale, for the same watching: what left the house went in trade and not down the family. */
const SELLS = new Set(['sell-cotton', 'sell-food']);

/** How long the closing card stands before the lesson is gone from the projection entirely, in minutes of 1835. */
export const LESSON_DONE_MINUTES = 180;

const staked = (world, household) => plotsOf(world, household).length > 1;
const broken = household => clearedPlots(household).length > 1;
/**
 * The crop is in.
 *
 * A bare field whose state has changed at least once is a field that was planted and brought in: a
 * family that has never farmed has `changedTick` 0 from its founding, so this cannot read a new
 * family's untouched ground as a harvest.
 */
const harvested = household => (household.field?.state ?? 'bare') === 'bare' && (household.field?.changedTick ?? 0) > 0;
const planted = household => sownPlots(household).length > 0 || harvested(household);
/** Sold, in the only way that leaves a mark the world keeps: coin in the house, which every family starts with none of. */
/**
 * The crop sold.
 *
 * **Coin, or the crop gone out of the house in trade.** Coin alone was the first rule, and it can strand a class: the
 * storekeeper's purse holds two reales (docs/MONEY_AND_GLORY.md, the owner's own choice), the store pays in food as
 * readily as in coin, and a forced lesson that cannot be finished is worse than one finished loosely. The owner's
 * sentence is "farmed and **sold** a crop of their choosing", and a student who carried cotton to the store and came
 * home with food has sold their crop. So either finishes it, and the step's words still ask for coin, which is what is
 * counted at the end.
 */
const sold = household => (household.resources?.money ?? 0) > 0 || household.lesson?.sold === true;
/** Somebody went out after game and came home, whatever the shot did; or there is a hide in the house to show for one. */
const hunted = household => household.lesson?.hunted === true || (household.resources?.hides ?? 0) > 0;
/** Water at the door: the well is dug, or the house stands close enough to running water that nobody would dig one. */
const watered = household => household.well === true || !household.site?.needsWell;

/**
 * The ten steps, in the owner's own order.
 *
 * `says` is one sentence in the game's voice telling the student what to do next. `first` is the
 * same thing folded into a refusal - "Not yet - first, put somebody to work." `did` is what has
 * just happened, shown on the step after, so a student sees the sentence that says the thing they
 * were asked for actually happened. `allow` is the whole permission: what the server will let
 * through while this step is running, beside `ALWAYS`.
 */
export const STEPS = Object.freeze([
  {
    id: 'arrive',
    title: 'Come in to your land',
    first: 'come in to your own land.',
    says: (world, household) => household.arriving
      ? 'Your wagon is on the track in to land of your own. Watch for it to stop.'
      : 'Choose a place on your own land for the house, and the wagon will be drawn over to it.',
    allow: () => ['choose-site', 'plan-house', 'place-piece', 'remove-piece'],
    done: (world, household) => !household.arriving && !choosing(household),
    did: () => 'The wagon is in. The family is standing on land of its own.',
  },
  {
    id: 'order',
    title: 'Put somebody to work',
    first: 'put somebody to work.',
    // **Any work at all.** Found when the two halves of the guided start first ran together (2026-09-21): with the
    // house's own work allowed and nothing else, the bar at this step was **empty**, because a house cannot be started
    // until its place and its plan are chosen and those are not bar work. A student was told "choose a work for them"
    // and could press nothing, which is the exact confusion this lesson exists to end. This step is about learning to
    // give an order; the next one is about the house, and it names it.
    says: () => 'Choose one of your family on the left, then choose any work for them at the bottom of the screen. That is how everyone in the family is told what to do.',
    allow: () => ANY_WORK,
    done: (world, household) => household.members.some(id => world.entities[id]?.chore),
    did: () => 'Somebody is at work. Every person in the family is given their orders that way.',
  },
  {
    id: 'house',
    title: 'Get the house up',
    first: 'get the house up.',
    // **What this step says depends on whether a house has been chosen** (owner, 2026-09-21: "When I have the mom start
    // to cut the road, and then I switch to the Dad, he can't start working on the house? That isn't right"). It said
    // "keep the family at the house until it stands" from the moment the step opened - and until a plan is chosen there
    // is no house to keep them at: every icon on every person is either shut by this step or refused by the server with
    // "Choose a house to build first". Reproduced in a browser: the father's whole bar came down to Travel, Rest and
    // Work about the place, none of which is this step, and the step's own sentence asked for the one thing nobody
    // could be set to. The reason was on the screen twice - inside the icon, and in the guide's second line - but never
    // in the sentence the student was reading.
    says: (world, household) => (houseOf(household)
      ? 'Keep the family at the house until it stands. Set more than one of them to it and it goes faster; until there is a roof they camp by the wagon.'
      : 'Choose a house first: the "Choose a house" button is on the left, above your family. Then set somebody to build it, and more than one of them makes it go faster.'),
    allow: () => HOUSE_WORK,
    done: (world, household) => houseSettled(household),
    did: () => 'The house stands. The family sleeps under its own roof tonight.',
  },
  {
    id: 'survey',
    title: 'Stake out a field',
    first: 'stake out ten acres.',
    says: () => 'Choose a place on your own land and send somebody to survey it. Ten acres, staked out, is where the field begins.',
    allow: () => ['survey-plot', 'chore:survey-plot'],
    done: staked,
    did: () => 'Ten acres are staked out.',
  },
  {
    id: 'clear',
    title: 'Clear the ground',
    first: 'clear the ground you staked.',
    says: () => 'Staked ground is not a field yet. Send the family to clear the plot: timber is three times the work of prairie, and fencing it keeps the loose stock out of the crop.',
    allow: () => ['clear-plot', 'chore:clear-plot', 'fence-plot', 'chore:fence-plot'],
    done: (world, household) => broken(household),
    did: () => 'The ground is broken and ready for seed.',
  },
  {
    id: 'plant',
    title: 'Put in a crop',
    first: 'put a crop in the ground.',
    says: () => 'Send somebody to plant the field. At the rows they will ask which crop goes in - corn, which the family eats, or cotton, which the store buys. It is your choice. If there is not seed enough, somebody can buy more at the store in town.',
    allow: () => ['chore:plant-field', 'chore:visit-shop'],
    done: (world, household) => planted(household),
    did: (world, household) => `The ${household.field?.crop === 'cotton' ? 'cotton' : 'corn'} is in the ground, and it will be some weeks ripening.`,
  },
  {
    id: 'harvest',
    title: 'Bring in the crop',
    first: 'bring the crop in.',
    // The crop is some weeks ripening (sim/chores.mjs `RIPEN_TICKS`) and a step with one control on
    // it would be a family standing about. Fencing is the thing worth doing while they wait, and it
    // is worth a third of the harvest: stock in this colony ran loose and ate what was not fenced.
    says: () => 'Send somebody to bring the crop in when it is ripe. While it stands, rails round the plot are worth having: loose stock take a third of an unfenced crop.',
    allow: () => ['chore:harvest-field', 'fence-plot', 'chore:fence-plot', 'chore:visit-shop'],
    done: (world, household) => harvested(household),
    did: () => 'The crop is in the house.',
  },
  {
    id: 'sell',
    title: 'Sell it in town',
    first: 'sell what you grew.',
    says: () => 'Send somebody to town, to the store, and sell some of your crop. Payment in food or coin both count. Choose the sale at the store counter when your family member arrives.',
    // The trip to town, and the two errands that are the sale itself where a class has them.
    allow: () => ['chore:visit-shop', 'chore:sell-cotton', 'chore:sell-food', 'shop-counter', 'cotton-counter'],
    done: (world, household) => sold(household),
    did: () => 'Your family sold its crop at the store.',
  },
  {
    id: 'hunt',
    title: 'Go out after game',
    first: 'go out after game.',
    says: () => 'Choose a place on your own land and send somebody hunting. Timber by the water is the best ground and open prairie the poorest; a shot costs powder, and the store sells more.',
    allow: () => ['hunt-land', 'chore:hunt-land', 'chore:hunt-timber', 'chore:visit-shop'],
    done: (world, household) => hunted(household),
    did: () => 'Somebody has been out after game and come home.',
  },
  {
    id: 'well',
    title: 'Dig a well',
    first: 'dig the well.',
    says: () => 'The house is a long way from running water, and every heavy work goes slower while somebody carries it. Send the family to dig a well.',
    allow: () => ['chore:dig-well'],
    done: (world, household) => watered(household),
    did: (world, household) => household.well
      ? 'There is water in the yard, and nobody carries it from the creek again.'
      : 'Running water is close enough to the house to carry: this family wants no well.',
  },
]);

/** Every action id the lesson knows about: what a family is told it may do once the lesson is over. */
export const ALL_ACTIONS = Object.freeze([...new Set([...ALWAYS, ...STEPS.flatMap(step => step.allow())])]);

const indexOf = id => STEPS.findIndex(step => step.id === id);

/** The id `allow` is written in: a chore is `chore:<id>`, and everything else is the action's own name. */
export const actionId = input => input?.action === 'chore' ? `chore:${input.chore}` : String(input?.action ?? '');

/**
 * Whether this family has a lesson running at all.
 *
 * A family nobody plays has none - the director gives it its orders and a gate would stop it dead.
 * Nor has anybody in the lobby: the wagon is not on the road yet, and what a student may do before
 * the teacher begins is already `LOBBY_ACTIONS`'s question. Nor has a family that has left for the
 * east (sim/scrape.mjs): its farm is behind it, every step here is impossible, and a gate would
 * leave it standing on the road. `flee` is on `ALWAYS`, so the lesson can never keep a family from
 * going.
 */
const teachable = (world, household) => Boolean(household?.played) && world.status !== 'lobby' && !household.flight;

/**
 * The step a family that has never been looked at is on.
 *
 * **This is the whole of the old-save rule.** A family still coming in - which is every family of
 * every class begun since arrivals existed - starts at the beginning. A family that is already
 * standing on its land when the lesson first sees it has nothing to be walked through and never
 * gets a lesson at all: a class saved before today opens exactly as it did, and a student who
 * joins a class already under way is not marched back to the wagon.
 */
const beginsAt = household => (household.arriving || choosing(household)) ? 'arrive' : null;

/** The family's stored step, or the one it would begin at; null where there is no lesson to run. */
function stepOf(world, household) {
  if (!teachable(world, household)) return null;
  const step = household.lesson ? household.lesson.step : beginsAt(household);
  // ceiling: `validateWorld` refuses a save holding a step that does not exist, so this can only be reached by a world
  // edited by hand. It opens the gate rather than throwing, because a lesson is not worth stopping a class for.
  return step === 'done' || indexOf(step) >= 0 ? step : null;
}

/**
 * The lesson as the family's own page sees it. Null for the Host, for a family nobody plays, for the
 * lobby, and for a family that has finished - the closing card stands for `LESSON_DONE_MINUTES` and
 * then `lesson` is absent entirely, which is how a student knows the game is theirs now.
 */
export function lessonProjection(world, household) {
  const step = stepOf(world, household);
  if (!step) return null;
  if (step === 'done') {
    const at = household.lesson?.at;
    if (!Number.isFinite(at) || world.minute - at > LESSON_DONE_MINUTES) return null;
    return {
      step: 'done', index: STEPS.length, of: STEPS.length,
      title: 'The land is yours',
      says: 'That is the whole of it. The farm is yours to run now - work it as you see fit.',
      did: STEPS.at(-1).did(world, household),
      allow: [...ALL_ACTIONS],
      done: true,
    };
  }
  const index = indexOf(step);
  const current = STEPS[index];
  return {
    step: current.id, index: index + 1, of: STEPS.length,
    title: current.title,
    says: current.says(world, household),
    did: index > 0 ? STEPS[index - 1].did(world, household) : null,
    allow: [...ALWAYS, ...current.allow(world, household)],
    done: false,
  };
}

/**
 * Why this order is refused right now, or null.
 *
 * Read before `applyAction` does anything at all, so nothing is ever half done. A family whose
 * student has gone is run by the director (sim/neighbours.mjs) and is never gated: the director
 * plays through this same function, and a gate would leave an absent family standing still.
 */
export function lessonRefusal(world, household, input) {
  if (!household || household.absent) return null;
  // Somebody who has joined the army, the garrison or the expedition is not at home to be taught and does only the camp's
  // own work (sim/winter.mjs, sim/camp.mjs), which has gates of its own. An order to them is never this lesson's business.
  if (world.entities[input?.entityId]?.service?.status === 'serving') return null;
  const step = stepOf(world, household);
  if (!step || step === 'done') return null;
  const current = STEPS[indexOf(step)];
  const allowed = new Set([...ALWAYS, ...current.allow(world, household)]);
  if (allowed.has(actionId(input))) return null;
  return `Not yet - first, ${current.first}`;
}

/**
 * One family's lesson moves on as far as the world lets it.
 *
 * Called on every tick and after every order a student sends, because a step can be finished by
 * either. Walks forward while the step it is on is done, so a family that satisfies three at once -
 * a house already standing when the ground is cleared - is never made to press through them.
 */
export function advanceLesson(world, household) {
  if (!teachable(world, household)) return;
  if (!household.lesson) {
    const start = beginsAt(household);
    if (!start) return;
    household.lesson = { step: start };
  }
  const state = household.lesson;
  if (state.step === 'done' || indexOf(state.step) < 0) return;
  // The hunt is the one step that is not a thing the family owns at the end of it: a shot can miss,
  // and a student who was sent out after a deer and came home empty has hunted. So it is watched
  // instead - somebody of the family is out on a hunt, and then nobody is.
  const out = household.members.some(id => HUNTS.has(world.entities[id]?.chore?.id));
  if (out) state.hunting = true;
  else if (state.hunting) { delete state.hunting; state.hunted = true; }
  // And the sale, watched the same way and for the same reason: coin alone can strand a class, because the
  // storekeeper's purse holds two reales and the store pays in food as readily as in coin. A crop that has left the
  // house in trade has been sold, whatever came back for it. Watched rather than counted, because what came back may
  // be food, which the family also eats.
  if (state.step === 'sell') {
    // **Each good on its own**, because cotton sold *for* food raises the larder while the crop leaves: a single total
    // would read that as nothing having happened, which is how the first draft of this missed it.
    const atTheStore = household.members.some(id => {
      const doing = world.entities[id]?.chore?.id;
      return doing === 'visit-shop' || SELLS.has(doing);
    });
    state.had ??= {};
    for (const good of ['cotton', 'food']) {
      const now = household.resources?.[good] ?? 0;
      if (state.had[good] === undefined) state.had[good] = now;
      else if (atTheStore && now < state.had[good] - 0.5) state.sold = true;
      else if (now > state.had[good]) state.had[good] = now;
    }
  }
  let index = indexOf(state.step);
  while (index < STEPS.length && STEPS[index].done(world, household)) index++;
  if (index >= STEPS.length) {
    household.lesson = { step: 'done', at: world.minute };
    record(world, 'lesson', {
      householdId: household.id, importance: 2, claimId: 'FIC-GONZ-210',
      text: 'The family has a roof over it, a field it cleared, a crop it sold in town, a hunt behind it and water at hand. The land is yours now.',
    });
    return;
  }
  state.step = STEPS[index].id;
}

/** Every family's lesson, once a tick. */
export function advanceLessons(world) {
  for (const household of Object.values(world.households)) advanceLesson(world, household);
}

/** A stored lesson names a step that exists, and its markers are `true` or absent. */
export function lessonInvalid(world, household) {
  const lesson = household.lesson;
  if (lesson === undefined) return null;
  if (typeof lesson !== 'object' || lesson === null || Array.isArray(lesson)) return 'Invalid lesson';
  if (lesson.step !== 'done' && indexOf(lesson.step) < 0) return 'Invalid lesson step';
  if (lesson.at !== undefined && (!Number.isFinite(lesson.at) || lesson.at < 0)) return 'Invalid lesson ending';
  for (const marker of ['hunting', 'hunted']) {
    if (lesson[marker] !== undefined && lesson[marker] !== true) return 'Invalid lesson marker';
  }
  return null;
}
