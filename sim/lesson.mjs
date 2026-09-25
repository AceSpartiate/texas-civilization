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
// **Amended 2026-09-22: the student can stop it.** The owner: "i should be able to X off the tutorial to stop it and
// just do what i want", and asked who gets the X, "Everyone, always". `stop-lesson` is on `ALWAYS`, is the family's own
// student's alone (`stopLesson`), and stores the family as finished with `stopped: true`, so the gate is open and the
// projection's `lesson` is absent from then on. The gate is still the server's for as long as a family keeps it.
//
// **Amended again 2026-09-22: five minutes to change their mind.** The owner: "After closing the tutorial, show a small
// 'Resume tutorial' button for five real minutes from the original dismissal, including across reloads. Resume existing
// progress; quietly show dismissal/resumption to the teacher." So the X keeps the step it was pressed on and the real
// time it was pressed (`stoppedAt`, server milliseconds), `resume-lesson` puts the family back on that step inside
// `LESSON_RESUME_MS` of the **first** press, and the Host's class panel says so in words (`lessonHostWords`).
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
  // And the children's own works (sim/children.mjs, docs/FAMILY_CREATION.md §3's amendment of 2026-09-21). The lesson
  // teaches the student one farm task at a time; not one of them is a task a child under ten can be set to, so a lesson
  // that refused a five-year-old's hour of play because the house was not raised yet would be refusing the one thing that
  // family member is for. Written out rather than built from the module, which would make this file import it.
  'chore:child-play', 'chore:child-kindling', 'chore:child-birds', 'chore:child-eggs', 'chore:child-water', 'chore:child-mind',
  'rename', 'set-main', 'set-auto', 'set-appearance', 'place-item', 'work', 'rest', 'travel',
  'stop-chore', 'answer-chore', 'ask-rider', 'leave-rider',
  'roll-family', 'load-wagon', 'bring-stock',
  'offer', 'accept-offer', 'decline-offer', 'withdraw-offer', 'chore:help-raise',
  'help', 'stay', 'go-see', 'stay-home', 'go-upriver', 'stay-in-town', 'turn-out', 'stay-put',
  'send-for', 'detachment-go', 'detachment-stay', 'army-answer', 'houston-answer', 'alamo-courier',
  'road-answer', 'flee', 'flight-stay', 'winter-recall',
  // And the X on the strip (owner, 2026-09-22: "i should be able to X off the tutorial to stop it and just do what i
  // want"). A lesson that could refuse the order to stop itself would be the unavoidable thing the owner has taken back.
  'stop-lesson',
  // And taking it back up (owner, later on 2026-09-22). Only a stopped family can, and a stopped family has no gate; it is
  // here so that anybody else who sends it is told the true reason, not "Not yet".
  'resume-lesson',
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

/**
 * How long after the X a student may still take the guided start back up, in **real** milliseconds (owner, 2026-09-22:
 * "five real minutes from the original dismissal, including across reloads").
 *
 * Real time and not the world's clock: the world's minutes run at the Host's pace and stop when the class is paused, and
 * the owner's window is five minutes of the student's afternoon. It is read off the server's clock, which the caller hands
 * in (`now`), so a test can hold it still or jump it; `server/app.mjs` takes both the clock and this window as options.
 * It is fixed at the moment of the first press (`resumeBy`), so changing it never moves a window already open.
 */
export const LESSON_RESUME_MS = 5 * 60 * 1000;

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
// **Since the owner's second amendment of 2026-09-25 a family starts with coin** (sim/means.mjs `MEANS_COIN`, 3 to 10 reales), so
// coin in the house no longer says anything was sold: for such a family the coin is counted over what was in the house when this
// step began (`had.money`, watched below as the cotton and the food are, and lowered when coin is spent), and the family that
// started with none is read exactly as before.
const startCoin = household => household.means?.coin ?? 0;
const sold = household => household.lesson?.sold === true
  || (household.resources?.money ?? 0) > (startCoin(household) ? (household.lesson?.had?.money ?? Infinity) : 0);
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
/** The family's vehicle as the arrival's words say it: its cart, for a family of the poorest means, and otherwise the wagon. */
const haul = household => (household?.means?.cart ? 'cart' : 'wagon');
/** A family that came with no vehicle (sim/means.mjs), walking in with its packs. */
const walked = household => household?.means?.afoot === true;
export const STEPS = Object.freeze([
  {
    id: 'arrive',
    title: 'Come in to your land',
    first: 'come in to your own land.',
    // A family of the poorest means comes in with a cart (sim/means.mjs), and the step says so.
    // A family with no vehicle walks in with its packs, and the step says that instead (owner, 2026-09-25).
    says: (world, household) => walked(household)
      ? (household.arriving ? 'Your family is walking the track in to land of your own, the ox under its packs. Watch for them to stop.' : 'Choose a place on your own land for the house, and the family will carry its packs over to it.')
      : household.arriving
        ? `Your ${haul(household)} is on the track in to land of your own. Watch for it to stop.`
        : `Choose a place on your own land for the house, and the ${haul(household)} will be drawn over to it.`,
    allow: () => ['choose-site', 'plan-house', 'place-piece', 'remove-piece'],
    done: (world, household) => !household.arriving && !choosing(household),
    did: (world, household) => (walked(household) ? 'The family is in, its packs down. It is standing on land of its own.' : `The ${haul(household)} is in. The family is standing on land of its own.`),
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
      ? `Keep the family at the house until it stands. Set more than one of them to it and it goes faster; until there is a roof they camp ${walked(household) ? 'by their packs' : 'by the wagon'}.`
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
    // Since 2026-09-24 what to sell is chosen before anybody leaves (docs/TOWNS.md §4b): there is no counter to answer on arrival.
    says: () => 'Send somebody to town to trade, and put some of your crop on the list for the store before they go. Payment in food or coin both count.',
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
    // A family that pressed the X has no closing card: it said it was done being taught, and the key goes at once.
    if (household.lesson?.stopped) return null;
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
    for (const good of ['cotton', 'food', ...(startCoin(household) ? ['money'] : [])]) {
      const now = household.resources?.[good] ?? 0;
      if (state.had[good] === undefined) state.had[good] = now;
      else if (good === 'money') { if (now < state.had.money) state.had.money = now; }
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

/**
 * The student stops the guided start for their own family (owner, 2026-09-22: "i should be able to X off the tutorial to
 * stop it and just do what i want"; asked who gets the X, "Everyone, always").
 *
 * Only a family's own student can send this. `applyAction` is handed the household the sender's cookie names, so a
 * student can only ever stop their own family's lesson, whatever the order carries; the Host has no household and is
 * refused here, as is a family whose student has gone - the director runs it and never presses the X on anybody's
 * behalf. Once stopped the family is stored as finished (`step: 'done'`) with `stopped: true`, so the gate opens, the
 * projection's `lesson` key is gone at once with no closing card, and a save carries it (`lessonInvalid`).
 *
 * **Nothing is thrown away** (owner, 2026-09-22: "Resume existing progress"). The step it was on is kept as `from`, and
 * every marker the steps have gathered - the hunt watched, the sale watched - stays beside it. `stoppedAt` is the real
 * time of the **first** press and `resumeBy` the end of its window; a second X after a resume keeps both, so pressing
 * the X again never buys another five minutes.
 */
export function stopLesson(world, household, { now = Date.now(), windowMs = LESSON_RESUME_MS } = {}) {
  if (!household || household.absent || !household.played) throw new Error('Only a family’s own student can stop its guided start.');
  const step = stepOf(world, household);
  if (!step || step === 'done') throw new Error('There is no guided start running to stop.');
  const { at, ...kept } = household.lesson || {};
  const first = Number.isFinite(kept.stoppedAt) && Number.isFinite(kept.resumeBy);
  household.lesson = {
    ...kept, step: 'done', from: step, at: world.minute, stopped: true,
    stoppedAt: first ? kept.stoppedAt : now, resumeBy: first ? kept.resumeBy : now + windowMs,
  };
  // For the Host alone: no household on it, so no family's journal carries it, and nothing public, so no student's does.
  record(world, 'lesson-stopped', {
    visibility: 'host', about: household.id, claimId: 'FIC-GONZ-210',
    text: `The family stopped the guided start at step ${indexOf(step) + 1} of ${STEPS.length}${kept.resumed ? ', having taken it up again once' : ''}.`,
  });
}

/**
 * Whether this family may take its stopped guided start back up right now: stopped by the X (never finished), on a step
 * that exists, and inside the window of the first press. An old save's stop carries no `resumeBy` and is not resumable:
 * "stopped, window long gone" is what it was.
 */
function resumable(world, household, now) {
  const lesson = household?.lesson;
  return teachable(world, household) && lesson?.stopped === true && lesson.step === 'done' && indexOf(lesson.from) >= 0
    && Number.isFinite(lesson.resumeBy) && now < lesson.resumeBy;
}

/**
 * The page's offer to take the guided start back up, while there is one: when the window closes by the server's clock
 * (`until`) and how long that is from now (`ms`), which the page counts down from the moment it hears it, so a
 * Chromebook whose own clock is wrong still takes the button away on time. Null for everybody else and after the window.
 */
export function lessonResumeOffer(world, household, now = Date.now()) {
  if (!resumable(world, household, now)) return null;
  return { until: household.lesson.resumeBy, ms: household.lesson.resumeBy - now };
}

/**
 * "Resume tutorial" (owner, 2026-09-22): the family is put back on the step it stopped on, with everything it had
 * gathered, and the gate applies again from this order on. The same rule as the X for who may send it - the family's
 * own student, never the Host, never the director for a family whose student has gone.
 *
 * `applyAction` moves the lesson on straight after, as after any order, so a family that did the step's work while the
 * lesson was off is walked forward exactly as it would have been: every step completes when the world says so.
 */
export function resumeLesson(world, household, { now = Date.now() } = {}) {
  if (!household || household.absent || !household.played) throw new Error('Only a family’s own student can take up its guided start again.');
  const lesson = household.lesson;
  if (lesson?.stopped !== true) throw new Error('There is no stopped guided start to take up again.');
  if (!resumable(world, household, now)) throw new Error('It is too late to take the guided start up again.');
  const { step, from, at, stopped, ...kept } = lesson;
  household.lesson = { ...kept, step: from, resumed: true };
  record(world, 'lesson-resumed', {
    visibility: 'host', about: household.id, claimId: 'FIC-GONZ-210',
    text: `The family took the guided start up again at step ${indexOf(from) + 1} of ${STEPS.length}.`,
  });
}

/**
 * The guided start as the Host's class panel says it, for one family: only once its student has pressed the X or taken
 * it back up, and never louder than a line of words (owner, 2026-09-22: "quietly show dismissal/resumption to the
 * teacher"). Null otherwise - a family working through its steps, or one that finished them, needs no line.
 */
export function lessonHostWords(household) {
  const lesson = household?.lesson;
  if (!household?.played || !lesson) return null;
  if (lesson.stopped) {
    const at = indexOf(lesson.from);
    return `stopped the guided start${at >= 0 ? ` at step ${at + 1}` : ''}${lesson.resumed ? ', after resuming it once' : ''}`;
  }
  if (lesson.resumed && indexOf(lesson.step) >= 0) return `resumed the guided start: on step ${indexOf(lesson.step) + 1} of ${STEPS.length}`;
  return null;
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
  for (const marker of ['hunting', 'hunted', 'stopped', 'resumed']) {
    if (lesson[marker] !== undefined && lesson[marker] !== true) return 'Invalid lesson marker';
  }
  // Stopped is a way of being finished, never a step still running with the gate half open.
  if (lesson.stopped && lesson.step !== 'done') return 'Invalid lesson step';
  // The step the X was pressed on, and the real time of the first press and the end of its window (2026-09-22). All three
  // are absent on a stop saved before then, which is a stop whose window is long gone.
  if (lesson.from !== undefined && (!lesson.stopped || indexOf(lesson.from) < 0)) return 'Invalid lesson step';
  if ((lesson.stoppedAt === undefined) !== (lesson.resumeBy === undefined)) return 'Invalid lesson window';
  if (lesson.stoppedAt !== undefined && (!Number.isFinite(lesson.stoppedAt) || !Number.isFinite(lesson.resumeBy) || lesson.resumeBy < lesson.stoppedAt)) return 'Invalid lesson window';
  return null;
}
