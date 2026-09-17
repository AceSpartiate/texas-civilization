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
import { CHORES, beginChore, choresFor } from './chores.mjs';
import { campChoice } from './camp.mjs';
import { record } from './events.mjs';
import { mainPersonId } from './family.mjs';
import { autoFlee } from './scrape.mjs';

/**
 * The orders a person on auto takes up again when they come home: hunting, which is what the owner asked for.
 * ceiling: only the hunts repeat. Felling, hauling, the field and the errands each change what the family has in a way a
 * student should see before the next is given; repeating them is a design decision to take, not a line to add here.
 */
export const REPEATED = Object.freeze(['hunt-timber', 'hunt-land']);
/** How long a family by hand, told to leave, is waited for before auto packs the wagon: one day of the calendar. */
export const FLIGHT_PATIENCE = 1440;

/** The switch, kept on the person as the world's (`entity.auto`, absent when off, so no saved class changes). */
export function setAuto(world, household, entity, on) {
  const wanted = Boolean(on);
  if (Boolean(entity.auto) === wanted) return;
  if (wanted) entity.auto = true; else delete entity.auto;
  record(world, 'choice', {
    actorId: entity.id, householdId: household.id, importance: 1, decision: wanted ? 'auto-on' : 'auto-off',
    text: wanted
      ? `${entity.name} will decide for themself from here: the last order given them is repeated, and what they are asked is answered as their neighbours answer.`
      : `${entity.name}'s choices are the family's again.`,
  });
}

/** Remember an order auto can repeat, where the order is given (sim/world.mjs). Others are not remembered. */
export function noteOrder(entity, choreId, mode, extra = {}) {
  if (!REPEATED.includes(choreId)) return;
  entity.order = { chore: choreId, mode, ...(extra.ground && { ground: { x: extra.ground.x, y: extra.ground.y } }) };
}

/**
 * Every tick, after the chores: somebody on auto who is home and free takes up their last order again; a family told to
 * leave goes at once if its main person is on auto, and after `FLIGHT_PATIENCE` if nobody has answered by hand. A refusal
 * (no powder, too tired) is written down once and tried again each tick, so the hunter goes out the moment they can. A
 * family nobody plays is never on auto - the switch is a student's order - so no gate on `played` is needed here.
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
    for (const id of household.members) {
      const person = world.entities[id];
      // A man on auto with Houston's army takes up the camp's work as his neighbours do (sim/camp.mjs `campChoice`): the
      // director's day, read from the same offered list a student sees. A refusal is simply a day with nothing to do.
      if (person?.auto && person.service?.kind === 'houston' && person.service.status === 'serving' && !person.chore && !person.travel) {
        const chore = campChoice(world, person, choresFor(world, household, person));
        if (chore) { try { beginChore(world, household, person, chore, { beginTravel, modeAvailability }); } catch { /* refused: nothing to do today */ } }
        continue;
      }
      if (!person?.auto || !person.order || person.chore || person.travel || person.service || person.task === 'help') continue;
      if (person.location?.siteId !== household.homeSiteId || (household.flight && household.flight.status !== 'home')) continue;
      const order = person.order;
      const held = why => {
        if (order.held === why) return;
        order.held = why;
        record(world, 'consequence', { actorId: id, householdId: household.id, importance: 1, text: `${person.name} has not gone out again (${CHORES[order.chore].name.toLowerCase()}): ${why}` });
      };
      // A hunt only with a shot in the house, as a family nobody plays hunts (sim/neighbours.mjs): a hunter sent out with
      // nothing to fire walks to the timber to leave the deer standing, and would do it every afternoon.
      if ((household.resources?.powder ?? 0) < 1) { held('there is no powder in the house to hunt with.'); continue; }
      try {
        beginChore(world, household, person, order.chore, { beginTravel, modeAvailability }, order.mode, order.ground ? { ground: { ...order.ground } } : {});
        delete order.held;
      } catch (error) { held(error.message); }
    }
  }
}
