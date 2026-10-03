/**
 * What draws a vehicle, and how fast: the pull against the weight (owner, 2026-10-03, answering whether a mule should pull: "yes, but
 * speed should adjust if it's too heavy. mules would be perfect for the carreta right though?"; docs/TOWNS.md §4h,
 * docs/SETTLING_IN.md §4b, `FIC-GONZ-1111`, on `HIST-TEX-1111`).
 *
 * **The rule.** A vehicle weighs its empty weight and, laden, its load (`VEHICLES`, in the units a load is counted in: the wagon's
 * twenty loads are its full load). Each beast hitched brings its own **pull** - the weight it draws at its own walk - and its own
 * **pace**, that walk (`DRAUGHT`). A team goes at its slowest beast's pace while its pull together is at least the weight; past
 * that it slows in proportion, pull over weight (`drawPace`). So:
 *
 *   the ox (pace 0.65, pull 30)    draws every vehicle at its two miles an hour, laden or not - exactly the ox team the game has always
 *                                  had (`WAGON_SPEED`, `HIST-TEX-093`), since a loaded wagon (10 + 20) is just its pull;
 *   a mule (pace 0.83, pull 18)    draws the carreta, laden (5 + 12), at its two and a half miles an hour - quicker than the ox, the
 *                                  owner's "perfect for the carreta" - and an empty wagon or cart as fast; a laden cart (8 + 20) at
 *                                  1.6, a laden wagon (10 + 20) at 1.5: "too heavy", and slower than the ox;
 *   two mules (pull 36)            draw the laden wagon at two and a half: a pair is better than one, and better than the one ox;
 *   the horse (pace 0.9, pull 20)  is in the table so the three are measured alike, and is not hitched in play: it carries a rider
 *                                  (owner, 2026-09-25). ceiling: a horse in a cart's shafts would be one line in `DRAUGHT_ROLES`.
 *
 * The numbers are the game's own (`FIC-GONZ-1111`), set so the ox stays what it was and the owner's two cases come out as he said: a
 * mule "perfect for the carreta", and slowed when "it's too heavy". The record gives the kinds of team, not their pull (`HIST-TEX-1111`).
 * ceiling: a vehicle is empty or laden (`laden`, set when it carries something home); a part load weighs as nothing on the way out
 * and as a full one on the way home. Weighing the load carried would want it on the travel record.
 * ceiling: at most `TEAM_MOST` beasts to a vehicle - one, or a pair.
 *
 * Imports only the travel table and the beasts' parts, so sim/keeping.mjs, sim/company.mjs and sim/going.mjs can all ask it.
 */
import { CARRETA_CARRY, MODES, WAGON_SPEED } from './travel.mjs';
import { lame, roleOf } from './beasts.mjs';

/** Each beast's walk in harness (miles a farming tick) and the weight it draws at that walk. */
export const DRAUGHT = Object.freeze({
  ox: Object.freeze({ pace: WAGON_SPEED, pull: 30 }),
  mule: Object.freeze({ pace: 2.5 / 3, pull: 18 }),
  horse: Object.freeze({ pace: 0.9, pull: 20 }),
});
/** The beasts a family hitches: the ox and, since 2026-10-03, the mule. */
export const DRAUGHT_ROLES = Object.freeze(['ox', 'mule']);
/** Each vehicle's own weight empty, and the load it carries full (the same `carry` a trip with it brings home). */
export const VEHICLES = Object.freeze({
  wagon: Object.freeze({ weight: 10, carry: MODES.wagon.carry }),
  cart: Object.freeze({ weight: 8, carry: MODES.wagon.carry }),
  carreta: Object.freeze({ weight: 5, carry: CARRETA_CARRY }),
});
/** At most this many beasts to one vehicle: one, or a pair. */
export const TEAM_MOST = 2;

/** Which vehicle this is: a family's cart (a Tejano family's called a carreta, with a cart's rules), a carreta made at home, or the wagon. */
export const vehicleKind = vehicle => (vehicle?.cart ? 'cart' : vehicle?.carreta ? 'carreta' : 'wagon');
/** What the vehicle carries now: its full load laden, nothing empty. */
export const loadOf = (vehicle, laden = Boolean(vehicle?.laden)) => (laden ? VEHICLES[vehicleKind(vehicle)].carry : 0);
/** Its weight: its own and its load. */
export const weightOf = (vehicle, load = loadOf(vehicle)) => VEHICLES[vehicleKind(vehicle)].weight + load;
/** A beast that draws, by its part: 'ox' or 'mule'; null for anything else. */
export const draughtRole = beast => (DRAUGHT_ROLES.includes(roleOf(beast)) ? roleOf(beast) : null);

/**
 * How fast these beasts (by part: 'ox', 'mule', 'horse') draw this vehicle with this load: the slowest one's walk, slowed by the
 * pull falling short of the weight. 0 with nothing hitched.
 */
export function drawPace(roles, vehicle, load = loadOf(vehicle)) {
  if (!roles?.length) return 0;
  const pace = Math.min(...roles.map(role => DRAUGHT[role].pace));
  const pull = roles.reduce((sum, role) => sum + DRAUGHT[role].pull, 0);
  return pace * Math.min(1, pull / weightOf(vehicle, load));
}
const rolesOf = beasts => beasts.map(roleOf);

/**
 * The best team for this vehicle from these beasts: the quickest, and of two as quick the fewer beasts, and of those the ox before
 * the mule (so a family that had only oxen goes exactly as it always did). At most `TEAM_MOST`. Empty when there is none.
 */
export function bestTeam(beasts, vehicle, load = loadOf(vehicle)) {
  const pool = beasts.filter(draughtRole);
  let best = [], bestPace = 0;
  const consider = team => {
    const pace = drawPace(rolesOf(team), vehicle, load);
    if (pace > bestPace + 1e-9 || (Math.abs(pace - bestPace) <= 1e-9 && best.length && team.length < best.length)) { best = team; bestPace = pace; }
  };
  for (let i = 0; i < pool.length; i++) {
    consider([pool[i]]);
    if (TEAM_MOST > 1) for (let j = i + 1; j < pool.length; j++) consider([pool[i], pool[j]]);
  }
  return best;
}

/** Fit to draw: sound, and not a mule lamed in a chase (a lamed ox still draws, at the chase's half pace, sim/pursuit.mjs). */
const fit = (world, beast) => (!beast.condition || beast.condition === 'sound') && !(roleOf(beast) === 'mule' && lame(world, beast));

/**
 * The family's vehicles among these movers and what draws each, on a journey together (sim/company.mjs): each vehicle in turn takes
 * the quickest single beast left - so a wagon and a carreta with an ox and a mule put the ox to the wagon and the mule to the carreta,
 * and a carreta alone with both takes the mule - and then any beast left over joins the slowest vehicle it makes quicker. A vehicle
 * nothing draws is left out. Returns `[{ vehicle, team, pace }]` in the movers' order. With only oxen, exactly as before: one ox to a
 * vehicle in order, and the rest walk along. `laden`: every vehicle counted full (a family's journey together carries its goods) or
 * empty; left out, each as it is.
 */
export function vehicleTeams(world, movers = [], { laden } = {}) {
  const loadFor = vehicle => loadOf(vehicle, laden ?? Boolean(vehicle.laden));
  const vehicles = movers.filter(entity => entity.kind === 'wagon' && (!entity.condition || entity.condition === 'sound'));
  // Oxen first, so a tie goes to the ox.
  const pool = [...movers.filter(entity => roleOf(entity) === 'ox'), ...movers.filter(entity => roleOf(entity) === 'mule')].filter(entity => entity.kind === 'animal' && fit(world, entity));
  const teams = [];
  for (const vehicle of vehicles) {
    const [one] = bestTeam(pool.filter(beast => !teams.some(team => team.team.includes(beast))), vehicle, loadFor(vehicle));
    if (one) teams.push({ vehicle, team: [one] });
  }
  for (const beast of pool.filter(one => !teams.some(team => team.team.includes(one)))) {
    const gains = teams.filter(team => team.team.length < TEAM_MOST).map(team => ({ team, now: drawPace(rolesOf(team.team), team.vehicle, loadFor(team.vehicle)), then: drawPace(rolesOf([...team.team, beast]), team.vehicle, loadFor(team.vehicle)) }))
      .filter(one => one.then > one.now + 1e-9).sort((a, b) => a.now - b.now);
    if (gains.length) gains[0].team.team.push(beast);
  }
  return teams.map(team => ({ ...team, pace: drawPace(rolesOf(team.team), team.vehicle, loadFor(team.vehicle)) }));
}

/** "the ox", "the mule", "two mules", "the ox and the mule": a team in words. */
export function teamWords(team = []) {
  const roles = rolesOf(team);
  if (roles.length === 2 && roles[0] === roles[1]) return `two ${roles[0] === 'ox' ? 'oxen' : `${roles[0]}s`}`;
  return roles.map(role => `the ${role}`).join(' and ') || 'nothing';
}
/** Miles an hour, rounded to the half: what a way's card says. */
export const mph = speed => Math.round(speed * 3 * 2) / 2;
