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
// **Amended by the owner, 2026-09-27**: "questions that are not answered fast enough disappear." A player by hand whose window
// runs out is no longer answered by auto: the question lapses and nothing is chosen (sim/lapse.mjs). The switch itself is
// unchanged - a person on auto still answers what they are asked, at once. The family told to leave is not a question of this
// kind and still goes when its time is out. **Since 2026-09-29 that time is three real minutes** (owner, "Real-time limits":
// sim/decision-budget.mjs `QUESTION_BUDGETS.flight`, the same at every pace); it was a day of the calendar (`FLIGHT_PATIENCE`,
// 1,440 minutes), which held the whole class at the farming scale for 72 ticks, 11.4 real minutes at Study.
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
//
// **Amended by the owner, 2026-09-28** (docs/FAMILY_PANEL.md §21): "I should be able to set one person on felling trees, and one
// person on building the house, set each to auto, and eventually get a house. ... Apply the logic described for felling trees and
// building houses to the other tasks too." So felling repeats - out to the nearest timber on the family's land each time, until the
// wood pile has enough for the house still to be built and a margin (sim/woodpile.mjs `pileFull`) - and so do clearing and fencing
// (the plot chosen, then the next nearest the house: `plotFor`), the carreta while the family has nothing to draw, furniture while
// a piece is wanted, and mending the hoe. A builder whose house wants logs the pile has not got says so - *"Waiting for logs."* -
// and works about the place until the feller brings them.
import { CHORES, beginChore, choreAvailability, choresFor, quickestForChore, workOf } from './chores.mjs';
import { plotsOf } from './fields.mjs';
import { houseWaitsForLogs } from './houses.mjs';
import { plotWorkRefusal } from './survey.mjs';
import { beastsOf, kept } from './beasts.mjs';
import { pileFull } from './woodpile.mjs';
import { campChoice } from './camp.mjs';
import { record } from './events.mjs';
// Who is with the family and answers its own decisions (sim/acting.mjs, 2026-09-28): the main person when they are with it.
import { actingId } from './acting.mjs';
import { flightLimitKey, flightOnLimit, limitLeft, limitOut } from './decision-budget.mjs';
import { ORDER_GRACE_MINUTES } from './advance.mjs';
import { calendarMinutes } from './clock.mjs';
import { STUDY_TICK_MS } from './crops.mjs';
import { lessonRefusal } from './lesson.mjs';
import { autoFlee } from './scrape.mjs';
import { answerRoad, roadAutoAnswer } from './road.mjs';
import { allWorn } from './tools.mjs';
import { heldByBattle } from './battle-stage.mjs';
import { calledAside } from './aside.mjs';

/**
 * The work a person on auto takes up again, over and over (owner, 2026-09-16 for the hunts; 2026-09-25 for the field, the house,
 * the lane and the well; 2026-09-28 for felling, clearing, fencing, the carreta, furniture and the hoe): work at home that gives
 * the family something each time, and that runs out by itself when there is nothing left to do - the field planted and the crop
 * in, the house raised, the lane cut, the well dug, the pile full, every staked plot cleared and every cleared plot fenced.
 * ceiling: not repeated, because each spends what the family has or is a decision a student makes each time (owner, 2026-09-28:
 * "less clicking, not less deciding") - the errands to town and buying furniture (coin), practice at the mark (powder on purpose),
 * killing a beef or a hog (the herd), surveying (where the family's next ten acres lie), enlisting, joining and voting (once), help
 * at a neighbour's raising (their land), the road east's work, and the children's own works (a child cannot be set to work about
 * the place). An order of any of those given to somebody on auto is done once and leaves the remembered task as it was, so they go
 * back to it when it is done. `haul-logs` was here until 2026-09-28; an old save's hauler on auto is remembered as a feller
 * (server/storage.mjs `readSave`).
 */
export const REPEATED = Object.freeze([
  'plant-field', 'harvest-field',
  'hunt-timber', 'hunt-land', 'take-small-game', 'fish-the-water', 'gather-oysters', 'cut-bee-tree',
  'look-to-stock',
  'build-house', 'cut-lane', 'dig-well', 'fell-trees',
  'clear-plot', 'fence-plot', 'make-carreta', 'make-furniture', 'mend-hoe',
]);
/** Work sent to a place chosen on the map, which a student presses the map for and cannot give to wait for (`waitingWork`). */
const ON_MAP = Object.freeze(['hunt-land', 'clear-plot', 'fence-plot']);
/** Work on a plot: taken up again on the plot it was given, and then the next nearest the house (`plotFor`, `FIC-GONZ-905`). */
const PLOT_WORK = Object.freeze(['clear-plot', 'fence-plot']);
/** The hunts that go out with nothing to fire and leave the deer standing: held for a shot in the house, as a neighbour hunts. */
const SHOOTS = Object.freeze(['hunt-timber', 'hunt-land']);
const GONE = Object.freeze(['dead', 'captured']);

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
  entity.order = { chore: choreId, mode, ...(extra.ground && { ground: { x: extra.ground.x, y: extra.ground.y } }), ...(extra.plotId && { plotId: extra.plotId }) };
}

/**
 * The plot a clearer or fencer on auto takes up (owner, 2026-09-28; docs/FAMILY_PANEL.md §21.3): the plot they were given while
 * there is still that work on it, and then the nearest to the house of the family's staked plots (clearing) or cleared plots with
 * no sound fence (fencing). Nothing is surveyed for them: where the family's next ten acres lie is the student's to choose.
 */
export function plotFor(world, household, order) {
  const open = order.chore === 'clear-plot' ? plot => plot.state === 'staked' : plot => plot.state === 'cleared' && plot.fence !== 'sound';
  const plots = plotsOf(world, household).filter(open);
  const given = plots.find(plot => plot.id === order.plotId);
  if (given) return given;
  const home = world.map.sites[household.homeSiteId];
  if (!home) return null;
  return plots.sort((a, b) => Math.hypot(a.x - home.x, a.y - home.y) - Math.hypot(b.x - home.x, b.y - home.y))[0] || null;
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
  if (!entity.auto || !REPEATED.includes(choreId) || ON_MAP.includes(choreId) || household.absent) return false;
  const refused = error?.message || 'That work is not available.';
  const why = WANTS_LOGS[choreId]?.(world, household, refused) ? `Waiting for logs. ${refused}` : refused;
  entity.order = { chore: choreId, mode, held: why };
  if (homeAndFree(household, entity) && entity.task !== 'work') entity.task = 'work';
  record(world, 'assignment', { actorId: entity.id, householdId: household.id, importance: 1, text: `${entity.name} will ${taskWords(choreId)} when it can be done, and works about the place until then: ${why}` });
  return true;
}

/** What the page is told it may press for somebody on auto: refused work that repeats can still be given, to wait for (above). */
export const WAITS = 'On auto, this is remembered and done when it can be; until then they work about the place.';
export function waitingWork(person, entries = []) {
  if (!person?.auto || GONE.includes(person.health?.condition)) return entries;
  return entries.map(entry => (entry.can || !REPEATED.includes(entry.id) || ON_MAP.includes(entry.id)) ? entry : { ...entry, waits: WAITS });
}

/**
 * Work that stops when the family has enough of what it makes (owner, 2026-09-28), and the words that say so: felling when the
 * pile holds what the house still wants and a margin (sim/woodpile.mjs), a carreta when the family has a vehicle to draw.
 * ceiling: the carreta is made on auto only for a family with no cart or wagon at all; a second vehicle is a student's order.
 */
const ENOUGH = Object.freeze({
  'fell-trees': (world, household) => pileFull(world, household),
  'make-carreta': (world, household) => (beastsOf(world, household, 'wagon').some(kept) ? 'The family has a cart or wagon to draw; another carreta is not wanted.' : null),
});
/** Work that waits on the wood pile, whose refusal is said as waiting for logs: the house and the carreta. */
const WANTS_LOGS = Object.freeze({
  'build-house': (world, household) => houseWaitsForLogs(household, world),
  'make-carreta': (world, household, why) => /logs from the pile/.test(why),
});

/** Why this person cannot take their task up right now, or null: the lesson's step, the work's own refusal, the powder. */
function heldWhy(world, household, person, order) {
  const chore = CHORES[order.chore];
  // The guided start holds the gate for auto exactly as for a student's hand (sim/lesson.mjs, docs/LESSON.md): a task given
  // on one step is not taken up again on a step that does not allow it, and the step's own words say why.
  const notYet = lessonRefusal(world, household, { action: 'chore', chore: order.chore, entityId: person.id });
  if (notYet) return notYet;
  if (chore?.offered && !chore.offered(world, household, person)) return 'There is none of that work to be had here now.';
  const enough = ENOUGH[order.chore]?.(world, household);
  if (enough) return enough;
  const open = choreAvailability(world, household, person, order.chore);
  if (!open.can) return WANTS_LOGS[order.chore]?.(world, household, open.why) ? `Waiting for logs. ${open.why}` : open.why;
  // A hunt only with a shot in the house, as a family nobody plays hunts (sim/neighbours.mjs): a hunter sent out with
  // nothing to fire walks to the timber to leave the deer standing, and would do it every afternoon.
  if (SHOOTS.includes(order.chore) && (household.resources?.powder ?? 0) < 1) return 'There is no powder in the house to hunt with.';
  // A plot's work, on the plot it goes to next: refused for that plot in the plot's own words (sim/survey.mjs).
  if (PLOT_WORK.includes(order.chore)) {
    const plot = plotFor(world, household, order);
    const why = plotWorkRefusal(world, household, order.chore, plot, { entity: person });
    if (why) return why;
  }
  return null;
}

/**
 * Whether a played family by hand, told to leave, has been waited for long enough: its three real minutes (owner, 2026-09-29,
 * "Real-time limits"; sim/decision-budget.mjs `QUESTION_BUDGETS.flight`), or the day of grace the order gives before any farm
 * can be reached (sim/advance.mjs `ORDER_GRACE_MINUTES`), whichever is first.
 *
 * The day of grace only comes first at the Quick pace, where the calendar held at twenty minutes a tick runs a day in 72 real
 * seconds: there the family has 72 seconds. **Confirmed by the owner, 2026-09-29**: "72 s at quick, but if the student doesn't
 * respond, burn their house. They should have been paying attention." Packed off by silence, at any pace, the family's house
 * burns behind it (sim/scrape.mjs `burnForSilence`, `FIC-GONZ-907`), and the order says so before it runs out
 * (`FLIGHT_IF_UNANSWERED`).
 */
export function flightWaited(world, household) {
  const flight = household.flight;
  return limitOut(world, flightLimitKey(household)) || (Number.isFinite(flight?.orderedMinute) && world.minute - flight.orderedMinute >= ORDER_GRACE_MINUTES);
}
/** What the order to leave says will happen if its student lets it run out (owner, 2026-09-29; `FIC-GONZ-907`). */
export const FLIGHT_IF_UNANSWERED = 'No answer in time, and the family leaves in a rush — the house is lost, burned behind it.';
/**
 * The real milliseconds the order to leave has left for the "!" (docs/audits/2026-09-28-design.md S33), or null when nobody is
 * reading it: the three minutes' remainder, or less where the day of grace comes first (`flightWaited`), that day's ticks counted
 * at the pace of the last tick the clock measured.
 */
export function flightLeftMs(world, household) {
  if (!flightOnLimit(world, household)) return null;
  const key = flightLimitKey(household), left = limitLeft(world, key, 'flight');
  const orderedMinute = household.flight.orderedMinute;
  if (!Number.isFinite(orderedMinute)) return left;
  const ticks = Math.max(0, Math.ceil((orderedMinute + ORDER_GRACE_MINUTES - world.minute) / Math.max(1, calendarMinutes(world))));
  return Math.min(left, ticks * (world.decisionClock?.[key]?.tickMs || STUDY_TICK_MS));
}

/** Whether this person is where auto can give them anything: at home, free, not called away. */
const homeAndFree = (household, person) => !person.chore && !person.travel && !person.service && person.task !== 'help'
  && person.location?.siteId === household.homeSiteId && !(household.flight && household.flight.status !== 'home');

/**
 * Every tick, after the chores: somebody on auto who is home and free takes up their task again, or works about the place
 * while it cannot be done and says why once; a family told to leave goes at once if its main person is on auto, and after
 * its three real minutes (sim/decision-budget.mjs `QUESTION_BUDGETS.flight`) if nobody has answered by hand. Asked every tick, so a task comes back the tick it can be done. A family
 * nobody plays is never on auto - the switch is a student's order - so no gate on `played` is needed here.
 */
export function advanceAuto(world, { beginTravel, modeAvailability }) {
  for (const household of Object.values(world.households)) {
    const flight = household.flight;
    // The wait is a played family's: a family nobody plays is fled by its director (sim/neighbours.mjs) or, in a class
    // without one, left as it was. Three real minutes (owner, 2026-09-29), on the real-time clock (`flightLimitKey`).
    if (household.played && !household.absent && flight?.status === 'ordered' && !flight.burned && !household.takenIn) {
      const main = world.entities[actingId(world, household)];
      if (main?.auto || flightWaited(world, household)) autoFlee(world, household, { why: main?.auto ? 'auto' : 'waited' });
    }
    // The road's questions (sim/road.mjs) - the bogged wagon, the army close behind - are the family's, answered the tick after
    // they are put when its main person is on auto or nobody is at its screen (sim/absence.mjs), as its neighbours answer.
    if (flight?.ask && (household.absent || world.entities[actingId(world, household)]?.auto)) {
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
      // With the men in a fight (sim/battle-stage.mjs `heldByBattle`): auto takes up nothing until they are back with them. No work
      // is offered off the family's land today, so this is a guard for the day some is, not a rule any test can yet catch.
      if (heldByBattle(world, person)) continue;
      // Called aside by the family's little ones (sim/aside.mjs): nothing is taken up until they are back, and then it is.
      if (calledAside(person)) continue;
      // Sick: nothing is taken up, and nobody works about the place; resting mends twice as fast (sim/disease.mjs, the owner
      // 2026-09-27). The task is taken up again the tick they are well.
      if (person.health?.condition === 'sick') { if (!person.chore && !person.travel && person.task === 'work') person.task = 'rest'; continue; }
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
        // A plot's work goes to the plot it was given, then the next nearest the house, which is remembered as theirs (`plotFor`).
        // Felling is never sent back to the place it was given: each time it is the nearest timber left (sim/felling.mjs).
        const plot = PLOT_WORK.includes(order.chore) ? plotFor(world, household, order) : null;
        if (plot) order.plotId = plot.id;
        const extra = plot ? { plotId: plot.id } : order.ground && order.chore !== 'fell-trees' ? { ground: { ...order.ground } } : {};
        beginChore(world, household, person, order.chore, { beginTravel, modeAvailability }, quickestForChore(world, household, person, order.chore, modeAvailability), extra);
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
  // Fetching logs from off the land is felling, for a family whose land has none (sim/chores.mjs `workOf`).
  if (person.chore && workOf(person.chore.id) === order.chore) return shown(`Auto: ${task}, over and over.`);
  if (person.chore?.id === 'mend-hoe' && order.held) return shown(`Auto: ${task}. ${order.held} Mending it first.`, true);
  if (person.chore) return shown(`Auto: ${task}, once the work in hand is done.`);
  if (!household || !homeAndFree(household, person)) return shown(`Auto: ${task}, taken up again when they are home.`);
  if (order.held) return shown(`Auto: ${task}. ${order.held} Working about the place meanwhile.`, true);
  return shown(`Auto: ${task}.`);
}
