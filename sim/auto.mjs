// The auto switch: a person who decides for themself (owner, 2026-09-16, docs/FAMILY_PANEL.md §11.7).
//
// "For all combat, and hunting, the player should be able to let it automatically happen (autohunt, or autofight) but the
// player should have the ability to micromanage their character during hunting or battle. If they fail to make the
// character's choices in a timely manner then eventually the auto should take over." Answered by multiple choice the same
// day: one switch per person, and a person on auto repeats the last order they were given; auto-fight answers only what the
// army asks of somebody already in the ranks (who enlists, goes or comes home stays the player's); auto-hunt decides only
// the shot; a player by hand has the game's own windows (`ASK_PATIENCE`, a question's dated close) and then auto steps in
// for that one question; and in the Runaway Scrape the family moves as one behind its main person, whose switch decides,
// with a family by hand given a day.
//
// What auto decides lives where each question lives - the shot in sim/chores.mjs (`autoChoice`), the army's questions and
// the detachment in sim/army.mjs, Travis's couriers in sim/alamo.mjs, the wagon in sim/scrape.mjs (`autoFlee`) - at the
// shares families nobody plays use (`FIC-GONZ-040`, `FIC-GONZ-048`), so a family on auto is played as its neighbours are
// and nobody's odds change with the switch. This module is the switch itself and the repeating of an order.
//
// **Amended by the owner, 2026-09-25** (docs/FAMILY_PANEL.md §16): "if it's on, the character should perform that task on
// repeat, and if it can't, then it should work around the house until that task becomes available again. i'm thinking that
// i could put a character on planting autoplay, and another one on harvest. then they'd naturally keep going until i turned
// off autoplay for them." So a person on auto remembers **one task** - the last work at home the student gave them that can
// be repeated (`REPEATED`) - and each tick they are home and free:
//
//   - **it can be done**: they take it up again (the way of going chosen again by the one rule, sim/going.mjs `quickestWay`);
//   - **it cannot be done right now** - the field not ready, no seed, the rifle out with somebody else, the lesson's step
//     not come to it - they **work about the place** (`task: 'work'`, sim/routines.mjs: a little food a day), the reason is
//     written down once, and the next tick asks again. The one exception is the hoe: work that wants it, refused because
//     every hoe is worn out, sends them to mend it first, which is work about the house that makes the task possible again.
//
// Exits, each defined (`advanceAuto`): **off** - the work in hand finishes, nothing is taken up again, and whoever was working
// about the place goes on doing it; **called away** - a call, the march, an errand, the army, the family leaving for the east
// - the switch stays on and the task is taken up again the tick they are home and free; **dead or taken** - the switch goes
// off and the task is forgotten, since nobody can press it for them any more.
import { CHORES, beginChore, choreAvailability, choresFor, quickestForChore } from './chores.mjs';
import { campChoice } from './camp.mjs';
import { record } from './events.mjs';
import { mainPersonId } from './family.mjs';
import { lessonRefusal } from './lesson.mjs';
import { autoFlee } from './scrape.mjs';
import { answerRoad, roadAutoAnswer } from './road.mjs';
import { allWorn } from './tools.mjs';

/**
 * The work a person on auto takes up again, over and over (owner, 2026-09-16 for the hunts; 2026-09-25 for the rest): work at
 * home that gives the family something each time, and that runs out by itself when there is nothing left to do - the field
 * planted and the crop in, the house raised, the lane cut, the well dug, the logs hauled.
 * ceiling: not repeated, because each changes what the family has in a way a student should decide each time - the errand
 * to town and the furniture (coin), practice at the mark (powder on purpose), killing a beef or a hog (the herd), surveying,
 * clearing and fencing (a plot chosen on the map each time), felling and fetching logs (the family's timber), enlisting,
 * joining and voting (once), help at a neighbour's raising (their land), the road east's work, and the children's own
 * works (a child cannot be set to work about the place). An order of any of those given to somebody on auto is done once and
 * leaves the remembered task as it was, so they go back to it when it is done.
 */
export const REPEATED = Object.freeze([
  'plant-field', 'harvest-field',
  'hunt-timber', 'hunt-land', 'take-small-game', 'fish-the-water', 'gather-oysters', 'cut-bee-tree',
  'look-to-stock',
  'build-house', 'cut-lane', 'dig-well', 'haul-logs',
]);
/** The hunts that go out with nothing to fire and leave the deer standing: held for a shot in the house, as a neighbour hunts. */
const SHOOTS = Object.freeze(['hunt-timber', 'hunt-land']);
const GONE = Object.freeze(['dead', 'captured']);
/** How long a family by hand, told to leave, is waited for before auto packs the wagon: one day of the calendar. */
export const FLIGHT_PATIENCE = 1440;

const taskWords = choreId => CHORES[choreId]?.name.toLowerCase() || 'their work';

/** The switch, kept on the person as the world's (`entity.auto`, absent when off, so no saved class changes). */
export function setAuto(world, household, entity, on) {
  const wanted = Boolean(on);
  if (Boolean(entity.auto) === wanted) return;
  if (wanted) entity.auto = true; else delete entity.auto;
  // A reason for waiting belongs to the switch that was waiting: off, it is forgotten, and on again it is asked afresh.
  if (entity.order) delete entity.order.held;
  const task = entity.order ? `${taskWords(entity.order.chore)}, over and over, working about the place whenever it cannot be done` : 'the next work at home given them is repeated';
  record(world, 'choice', {
    actorId: entity.id, householdId: household.id, importance: 1, decision: wanted ? 'auto-on' : 'auto-off',
    text: wanted
      ? `${entity.name} will decide for themself from here: ${task}, and what they are asked is answered as their neighbours answer.`
      : `${entity.name}'s choices are the family's again.`,
  });
}

/**
 * Remember an order auto can repeat, where the order is given (sim/world.mjs): the one task, replaced by the next repeatable
 * order and by nothing else. Not the director's orders to a family whose student has gone (sim/absence.mjs), which would
 * otherwise change the task the student left somebody on; a family nobody plays is never on auto, so what it is told matters not.
 */
export function noteOrder(entity, choreId, mode, extra = {}, household = null) {
  if (!REPEATED.includes(choreId)) return;
  if (household?.absent) return;
  entity.order = { chore: choreId, mode, ...(extra.ground && { ground: { x: extra.ground.x, y: extra.ground.y } }) };
}

/**
 * The owner's picture (2026-09-25): "put a character on planting autoplay, and another one on harvest." At the start of a season
 * the harvest cannot be done - the field is not ready - and an order that cannot be done was always refused. For somebody on
 * auto it is taken as their task instead: remembered, waited for about the place, and done when it can be. True when it was
 * taken, and the refusal is then not thrown. Only work that repeats, and not the hunt on the family's land, whose place is
 * chosen on the map and is refused for the place itself. The guided start has already refused anything its step does not
 * allow before this is asked (sim/world.mjs `applyAction`), so the lesson is never walked round.
 */
export function waitForTask(world, household, entity, choreId, mode, error) {
  if (!entity.auto || !REPEATED.includes(choreId) || choreId === 'hunt-land' || household.absent) return false;
  const why = error?.message || 'That work is not available.';
  entity.order = { chore: choreId, mode, held: why };
  if (homeAndFree(household, entity) && entity.task !== 'work') entity.task = 'work';
  record(world, 'assignment', { actorId: entity.id, householdId: household.id, importance: 1, text: `${entity.name} will ${taskWords(choreId)} when it can be done, and works about the place until then: ${why}` });
  return true;
}

/** What the page is told it may press for somebody on auto: refused work that repeats can still be given, to wait for (above). */
export const WAITS = 'On auto, this is remembered and done when it can be; until then they work about the place.';
export function waitingWork(person, entries = []) {
  if (!person?.auto || GONE.includes(person.health?.condition)) return entries;
  return entries.map(entry => (entry.can || !REPEATED.includes(entry.id) || entry.id === 'hunt-land') ? entry : { ...entry, waits: WAITS });
}

/** Why this person cannot take their task up right now, or null: the lesson's step, the work's own refusal, the powder. */
function heldWhy(world, household, person, order) {
  const chore = CHORES[order.chore];
  // The guided start holds the gate for auto exactly as for a student's hand (sim/lesson.mjs, docs/LESSON.md): a task given
  // on one step is not taken up again on a step that does not allow it, and the step's own words say why.
  const notYet = lessonRefusal(world, household, { action: 'chore', chore: order.chore, entityId: person.id });
  if (notYet) return notYet;
  if (chore?.offered && !chore.offered(world, household, person)) return 'There is none of that work to be had here now.';
  const open = choreAvailability(world, household, person, order.chore);
  if (!open.can) return open.why;
  // A hunt only with a shot in the house, as a family nobody plays hunts (sim/neighbours.mjs): a hunter sent out with
  // nothing to fire walks to the timber to leave the deer standing, and would do it every afternoon.
  if (SHOOTS.includes(order.chore) && (household.resources?.powder ?? 0) < 1) return 'There is no powder in the house to hunt with.';
  return null;
}

/** Whether this person is where auto can give them anything: at home, free, not called away. */
const homeAndFree = (household, person) => !person.chore && !person.travel && !person.service && person.task !== 'help'
  && person.location?.siteId === household.homeSiteId && !(household.flight && household.flight.status !== 'home');

/**
 * Every tick, after the chores: somebody on auto who is home and free takes up their task again, or works about the place
 * while it cannot be done and says why once; a family told to leave goes at once if its main person is on auto, and after
 * `FLIGHT_PATIENCE` if nobody has answered by hand. Asked every tick, so a task comes back the tick it can be done. A family
 * nobody plays is never on auto - the switch is a student's order - so no gate on `played` is needed here.
 */
export function advanceAuto(world, { beginTravel, modeAvailability }) {
  for (const household of Object.values(world.households)) {
    const flight = household.flight;
    // The day's patience is a played family's: a family nobody plays is fled by its director (sim/neighbours.mjs) or,
    // in a class without one, left as it was.
    if (household.played && !household.absent && flight?.status === 'ordered' && !flight.burned) {
      const main = world.entities[mainPersonId(world, household)];
      if (main?.auto || world.minute - flight.orderedMinute >= FLIGHT_PATIENCE) autoFlee(world, household, { why: main?.auto ? 'auto' : 'waited' });
    }
    // The road's questions (sim/road.mjs) - the bogged wagon, the army close behind - are the family's, answered the tick after
    // they are put when its main person is on auto or nobody is at its screen (sim/absence.mjs), as its neighbours answer.
    if (flight?.ask && (household.absent || world.entities[mainPersonId(world, household)]?.auto)) {
      const option = roadAutoAnswer(world, household);
      if (option) answerRoad(world, household, option, 'auto');
    }
    // Whoever has been waiting is asked first, so two people on auto after one thing take turns with it: the hunter home from
    // the timber does not take the rifle straight back from the one who has been waiting for it all afternoon.
    const waiting = id => (world.entities[id]?.order?.held ? 0 : 1);
    for (const id of [...household.members].sort((a, b) => waiting(a) - waiting(b))) {
      const person = world.entities[id];
      if (!person?.auto) continue;
      // Dead or taken: nobody can press the switch for them any more, so it is off and the task forgotten.
      if (GONE.includes(person.health?.condition)) { delete person.auto; delete person.order; continue; }
      // A man on auto with Houston's army takes up the camp's work as his neighbours do (sim/camp.mjs `campChoice`): the
      // director's day, read from the same offered list a student sees. A refusal is simply a day with nothing to do.
      if (person.service?.kind === 'houston' && person.service.status === 'serving' && !person.chore && !person.travel) {
        const chore = campChoice(world, person, choresFor(world, household, person));
        if (chore) { try { beginChore(world, household, person, chore, { beginTravel, modeAvailability }); } catch { /* refused: nothing to do today */ } }
        continue;
      }
      // Called away - a call, the march, an errand, the army, the family on the road east - or at other work: paused, and
      // taken up again the tick they are home and free.
      if (!person.order || !homeAndFree(household, person)) continue;
      const order = person.order;
      const hold = why => {
        // Working about the place meanwhile (sim/routines.mjs): the everyday work of the homestead, a little food a day.
        if (person.task !== 'work') person.task = 'work';
        if (order.held === why) return;
        order.held = why;
        record(world, 'consequence', { actorId: id, householdId: household.id, importance: 1, text: `${person.name} is working about the place until they can ${taskWords(order.chore)} again: ${why}` });
      };
      const why = heldWhy(world, household, person, order);
      if (why) {
        // Every hoe worn out: mending one is the work about the house that makes the task possible again, and one person mends.
        const hoe = CHORES[order.chore]?.tool === 'hoe' && allWorn(household, 'hoe');
        const mending = household.members.some(other => world.entities[other]?.chore?.id === 'mend-hoe');
        if (hoe && !mending && choreAvailability(world, household, person, 'mend-hoe').can && !lessonRefusal(world, household, { action: 'chore', chore: 'mend-hoe', entityId: id })) {
          try { beginChore(world, household, person, 'mend-hoe', { beginTravel, modeAvailability }); order.held = why; continue; } catch { /* refused: about the place instead */ }
        }
        hold(why);
        continue;
      }
      try {
        // The way is chosen again each time by the one rule (sim/going.mjs, owner 2026-09-24): the quickest that can go now, so a
        // hunter on auto whose horse is out walks rather than waiting for it, and rides when it is home. Not the way the
        // student last chose (`order.mode`, kept for an old save): an open question for the owner (docs/FAMILY_PANEL.md §15).
        beginChore(world, household, person, order.chore, { beginTravel, modeAvailability }, quickestForChore(world, household, person, order.chore, modeAvailability), order.ground ? { ground: { ...order.ground } } : {});
        delete order.held;
      } catch (error) { hold(error.message); }
    }
  }
}

/**
 * What the row says about somebody on auto, in the server's words (owner, 2026-09-25: the panel shows what they are
 * auto-doing and, while they wait, why). `waiting` is true while the task cannot be done and they are about the place instead.
 */
export function autoShown(world, household, person) {
  const order = person.order;
  if (!order) return { chore: null, says: `Auto: nothing to repeat yet. Give ${person.name} work at home - the field, a hunt, the house - and they will keep at it.` };
  const task = taskWords(order.chore);
  const shown = (says, waiting = false) => ({ chore: order.chore, says, ...(waiting && { waiting: true }) });
  if (person.chore?.id === order.chore) return shown(`Auto: ${task}, over and over.`);
  if (person.chore?.id === 'mend-hoe' && order.held) return shown(`Auto: ${task}. ${order.held} Mending it first.`, true);
  if (person.chore) return shown(`Auto: ${task}, once the work in hand is done.`);
  if (!household || !homeAndFree(household, person)) return shown(`Auto: ${task}, taken up again when they are home.`);
  if (order.held) return shown(`Auto: ${task}. ${order.held} Working about the place meanwhile.`, true);
  return shown(`Auto: ${task}.`);
}
