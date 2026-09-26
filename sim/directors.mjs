import { record } from './events.mjs';
import { spotlight } from './host.mjs';
import { SHOT_COST, goToWar } from './chores.mjs';
import { establishTruth, learn } from './knowledge.mjs';
import { TIRING_MILES } from './routines.mjs';
import { awardGlory } from './glory.mjs';
import { canAnswerCalls, canFight, cannotAnswerWhy, cannotFightWhy, tooYoung, tooYoungWhy } from './family.mjs';
import { distantHouseholds, expressLeaves, startExpress } from './expresses.mjs';
import { callOptions, expireCalls, offerCalls, settleCalls } from './calls.mjs';
import { ALAMO_WORD, COURIER_DAYS, askCouriers, beginSiege, warnGarrison, fightSouth, gonzalesFamilies, otherFamilies, reliefEnters, reliefRides, sendCouriers, splitSouth, stormAlamo, survivorsLeave, tellFall, tellSouth, word } from './alamo.mjs';
import { SETTLEMENT_DAYS, advanceArmiesPassing, orderOut, turnHome } from './scrape.mjs';
import { HOUSTON_WORD, catchUpCamp, fightColeto, followCamp, goliadMassacre, takeInEnlisted, tellGoliad, tellSanJacinto } from './houston.mjs';
import { closeCampQuestion, openCampQuestion } from './camp.mjs';
import { calendarMinutes, dateOf } from './clock.mjs';
import { advanceArmy, closeDetachment, closeQuestion, countermandStorm, dieOfWounds, disbandArmy, fightConcepcion, fightGrass, fightStorming, formArmy, goForClothing, marchOut, moveCamp, openDetachment, openQuestion, questionOpen, recordPresent, returnFromClothing, tellGrassFight, tellStorming } from './army.mjs';
import { GONZALES, gonzalesGround } from './battles/gonzales.mjs';
import { SAN_JACINTO_BATTLE } from './battles/san-jacinto.mjs';
import { advanceSanJacinto, sanJacintoField, sanJacintoProjection, strikeSanJacinto, tellSanJacintoAccounts } from './san-jacinto.mjs';
import { BEXAR_STORMING } from './battles/bexar-storming.mjs';
import { advanceBexarFight, bexarProjection } from './bexar-fight.mjs';
import { armBattle, battleState, looseSlot, phaseOffset, placeFrom, projectBattle, sidePlace } from './battle-stage.mjs';
import { advanceAlamoBattle, alamoProjection } from './alamo-battle.mjs';
import { findWay } from './ways.mjs';
import { advanceSouth, grantRides, southProjection, tellSouthAccount } from './south.mjs';
import { MODES } from './travel.mjs';

/**
 * What the gathering, the organisation of the army and the march for Béxar rest on.
 *
 * One claim for the whole week because the dates are one body of record; `HISTORY.md` holds what
 * each is sourced to and what is not documented at all.
 */
const HIST_GATHERING = 'HIST-TEX-018';

/**
 * A family that lives near another settlement on the real map (docs/COLONIES.md §5.4). It hears by express, and the
 * Gonzales calls - a neighbour carrying food to the town, a rumor worth riding in to check - are not its calls.
 * ceiling: until build step 4's settlement calls it is asked nothing; it only hears.
 */
const distant = household => Boolean(household.settlementId && household.settlementId !== 'gonzales');
/**
 * How long past the Gonzales finish a real-map class runs, at most, so the furthest families hear how the fight ended.
 * Three days; tests/news.test.mjs measures the last family hearing well inside it. Those three days used to make a
 * real-map class longer than a lesson; since the two clocks (sim/clock.mjs, docs/COLONIES.md §5.7 and §6g) the news
 * phase spends them at an hour a tick, and the measured class ends at tick 236 rather than 464.
 */
export const EXPRESS_GRACE_MINUTES = 4320;

// Date is anchored; these within-day times, pacing, and formation positions are schematic.
// `crossing` is the night of October 1, when the force was over on the west bank at Mrs.
// DeWitt's (HIST-GONZ-003, `HIST-TEX-470`: the men crossed from about seven, and formed there
// until they marched about a quarter to one). The fight on the engine (sim/battles/gonzales.mjs)
// starts there, and its own phases date the rest: `approach` is the dawn skirmish at twenty to
// six on the 2nd, `exchange` the cannon and the advance after the parley at twenty to nine,
// `withdrawal` nine, and `resolved` twenty to ten, when the dragoons are gone
// (docs/battle-research/gonzales.md §13, `FIC-GONZ-415`).
//
// `upriver-call` is six in the evening of the 1st, when the men gathering at the ferry to cross
// ask who goes with them: the upriver call opens then, and each family's closes when a walk from
// Gonzales could no longer reach the line before the dawn skirmish (`FIC-GONZ-446`).
const GONZALES_START = 4200;
const gonzalesAt = phase => GONZALES_START + phaseOffset(GONZALES, phase);
// San Jacinto on the engine (sim/battles/san-jacinto.mjs, docs/BATTLES.md §8): the armies meet at noon on April 20 (266400 +
// 19 × 1440 + 12 × 60), and the engagement's own phases date the old moments - the battle at half past four on the 21st (the
// volley), Santa Anna brought in at noon on the 22nd - which stand where they always stood (tests/battle-san-jacinto.test.mjs).
const SAN_JACINTO_START = 294480;
const jacintoAt = phase => SAN_JACINTO_START + phaseOffset(SAN_JACINTO_BATTLE, phase);
// The storming of Béxar on the engine (sim/battles/bexar-storming.mjs) starts at Milam's call, six in the evening of December 4,
// and its own phases date the director's moments of it: the roll at two on the 5th, when the call shuts; Neill's gun at five
// (`assault`); Milam's death at half past three on the 7th; the companies from the camp at six on the 8th; Cos's army marching
// out at nine on the 14th (docs/battle-research/staging.md §3.2, `FIC-GONZ-425`).
const BEXAR_START = 96120;
const bexarAt = phase => BEXAR_START + phaseOffset(BEXAR_STORMING, phase);
const FROM_MIDNIGHT_SEPT_29 = Object.freeze({
  notice: 600, publicNotice: 1440, gathering: 3000, 'upriver-call': 3960, crossing: GONZALES_START, approach: gonzalesAt('dawn-skirmish'), exchange: gonzalesAt('fight'), withdrawal: gonzalesAt('withdrawal'), resolved: gonzalesAt('field'), publicOutcome: 5400, finish: 5680,
  // After the fight: the gathering and the march, build step 5 (docs/COLONIES.md §5.5). Only a
  // class on the real land of the colonies reaches these; the invented country stops at `finish`,
  // exactly as every class saved before this does. Days from midnight on the 29th: the 3rd is
  // 5760, the 10th 15840, the 11th 17280, the 13th 20160.
  //
  // Dated from `HIST-TEX-018`, which was read for this: Goliad fell in the night of the 9th-10th
  // (Collinsworth's own letters, against Austin's mistaken "8th"); Austin was elected at four in
  // the afternoon of the 11th; the army crossed the Guadalupe on the 12th; the column stepped off
  // on the **13th**, which is what Austin's manuscript order book and the Telegraph of October 17
  // both say, against the 11th the Austin Papers' newspaper copy implies. When the gathering
  // *began* is documented nowhere - the 3rd is this game's own (`FIC-GONZ-034`), and the first
  // dated presence is the letter of the 6th.
  // `march-on` is where this slice stops, and it is a choice rather than a date out of the
  // record: far enough past the march that a class watches the column go - seven ticks of the
  // campaign calendar - and well short of Béxar, which is build step 6.
  'gathering-opens': 6240, goliad: 15840, organised: 18240, march: 20640, 'march-on': 25920,
  // Build step 6, Concepción (docs/COLONIES.md §6i; `HIST-TEX-019` to `-021`, dated from Austin's order book). The army
  // leaves the Cibolo on the 19th (it camped on the Salado "early" on the 20th); Bowie and Fannin go ahead on the 22nd,
  // when a family is asked whether its volunteer goes with them; the army moves to Espada on the 26th; the fight is at
  // about eight on the 28th; the class stops on November 2, the day both councils of war voted not to storm the town.
  'leave-cibolo': 28800, detachment: 33600, 'to-espada': 39360, concepcion: 42240, siege: 49680,
  // The siege and the Grass Fight (docs/COLONIES.md §6k; `HIST-TEX-026` to `-035`, dated from Austin's order book and
  // letters). Nov 2 is 48960. The army goes above the town after the vote; men leave for winter clothing (reported the
  // 4th); headquarters goes back to Concepción about the 9th; the army is united at the mill on the 15th; Austin orders the
  // storm on the 21st for next dawn and countermands it; the parade and pledge on the 24th; Austin leaves on the 25th; Deaf
  // Smith rides in mid-morning on the 26th and the fight follows (its hour is not in the record: the afternoon here);
  // the first word reaches San Felipe December 1 as a rumour, and the fuller account follows; the class stops on the
  // evening of December 4, when Milam calls for volunteers to go into the town.
  clothing: 52560, 'to-concepcion': 59760, united: 68400, 'storm-order': 77040, countermand: 77760, pledge: 81360,
  'austin-leaves': 82440, 'grass-alarm': 84120, 'grass-fight': 84420, 'grass-rumour': 91440, 'grass-news': 94320, milam: BEXAR_START,
  // The storming of Béxar (docs/COLONIES.md §6l; `HIST-TEX-036` to `-045`). Dec 4 is 95040. The army is ordered into winter
  // quarters in the morning of the 4th and Milam calls for volunteers that afternoon; the divisions go in about five on the
  // 5th; Milam is killed about half past three on the 7th; men are sent in from the camp on the 8th and Ugartechea reaches
  // Cos that evening; the express with the first, wrong report reaches San Felipe late on the 8th; the white flag about
  // seven on the 9th; terms about two on the 10th; the capitulation dated the 11th; a dangerous wound may kill by the 12th;
  // Cos marches out on the 14th and the colonists start home; word of the victory reaches the government on the 15th, and
  // the class stops that evening.
  // The roll at two on the 5th, when Milam's call shuts, is the storming's own (2026-09-25).
  'winter-quarters': 95400, 'bexar-roll': bexarAt('roll'), assault: bexarAt('feint'), 'milam-killed': bexarAt('milam'), reinforce: bexarAt('row'), ugartechea: 101880, 'bexar-express': 102120,
  'white-flag': 102660, terms: 103800, capitulation: 105840, 'wound-deaths': 107280, 'cos-marches': bexarAt('marching-out'), 'bexar-victory': 111600, 'bexar-end': 112320,
  // The second class period (docs/COLONIES.md §7e, sim/periods.mjs), the winter of 1835-36. January 25, 1836 is day 118 from
  // midnight on September 29, 1835 (169920). It opens at dawn with the quiet farming scale; the winter's news begins at dawn
  // on the 26th on the campaign calendar; the period stops at dawn on February 23, the day Santa Anna reached Béxar
  // (`HIST-TEX-053` proposed; research in docs/battle-research/winter-1835-36.md). ceiling: until the Alamo is built the
  // second period ends there, with the final reckoning.
  // The polls are open on February 1 (`HIST-TEX-052`): from noon on January 31, so a man can ride in, to midnight on the 2nd,
  // on the hourly calendar so the day lasts long enough to go. Travis's arrival (February 3) and Crockett's (the 8th) are
  // heard about five days after; the rumour that Santa Anna is over the Rio Grande about the 18th (`HIST-TEX-053`).
  'winter-opens': 170280, 'winter-news': 171720, 'election-opens': 179280, 'election-close': 181440,
  'travis-news': 181440 + 5 * 1440 + 360, 'crockett-news': 181440 + 10 * 1440 + 360, 'santa-anna-rumour': 181440 + 15 * 1440 + 360,
  // The Alamo (docs/COLONIES.md §7f, sim/alamo.mjs; `HIST-TEX-054` to `-060`). February 23, 1836 is 211680 (1836 is a leap year,
  // so March 1 is 221760). The Mexican army at Béxar about half past two on the 23rd; Travis's letter at Gonzales the 25th and in
  // the other settlements the 26th; the days riders went out (asked from six in the morning, gone in the evening) the 24th, 25th,
  // March 3 and 5; San Patricio at three on the 27th and the Gonzales men away at two that afternoon; word Fannin turned back the
  // 29th; the relief inside before dawn March 1; Agua Dulce the morning of March 2 (half past ten since 2026-09-25, below); word of San
  // Patricio the 3rd and of the declaration the 4th; the storming about five on the 6th; the spared let go the 8th; word of Agua
  // Dulce the 7th; the rumour of the fall at Gonzales the evening of the 11th, confirmed the morning of the 13th and carried on that
  // evening; Gonzales burned and the period over that night.
  'alamo-siege': 212550, 'courier-1-opens': 213480, 'courier-1': 214080, 'courier-2-opens': 214920, 'travis-gonzales': 215280, 'courier-2': 215760,
  'travis-colonies': 216720, 'san-patricio': 217620, 'relief-leaves': 218280, 'fannin-back': 220800, 'relief-enters': 222000,
  // Since 2026-09-25 the southern fights are on the battle engine (sim/south.mjs, docs/BATTLES.md §6.14): Grant rides south of
  // the Nueces for horses about six in the morning of February 20 (`FIC-GONZ-436`; 169920 + 26 × 1440 + 360); San Patricio's
  // night begins at one on the 27th, two hours before `san-patricio`; Grant's party sets out north with the herd at half past
  // five on March 2 (221760 + 1440 + 330), and **Agua Dulce is fought at half past ten** (+ 630), where it was six until
  // then - "between 10 and 11 am" (Wikipedia; `HIST-TEX-511`, staging.md §4.2).
  'grant-rides': 207720, 'san-patricio-night': 217500, 'agua-dulce-drive': 223530,
  'agua-dulce': 223830, 'courier-3-opens': 225000, 'san-patricio-news': 225360, 'courier-3': 225840, 'declaration-news': 226800,
  'courier-4-opens': 228240, 'courier-4': 229080, 'alamo-assault': 229260, 'agua-dulce-news': 231120, 'survivors-leave': 232200,
  'fall-rumour': 237240, 'fall-confirmed': 239520, 'fall-colonies': 240240, 'alamo-end': 240420,
  // The third period (docs/COLONIES.md §7g, sim/scrape.mjs and sim/houston.mjs; `HIST-TEX-062` to `-067`). Dawn on March 14
  // is 240840. Houston over the Colorado the 17th; Fannin out of Goliad the 19th and caught at Coleto at noon (its hour is
  // not in the record); the surrender the 20th; word of it the evening of the 25th; the massacre at sunrise on the 27th, its
  // word about April 1; the army at San Felipe the 28th; Santa Anna over the Brazos the 11th; the army at Harrisburg the 18th
  // and Lynchburg the 20th; the battle at half past four on the 21st; Santa Anna taken the 22nd; the word on the 23rd; the
  // period ends at dawn on the 25th, the families on the road home.
  'scrape-opens': 240840, 'houston-colorado': 245160, coleto: 248400, 'goliad-surrender': 249840, 'goliad-word': 257400,
  'goliad-massacre': 259620, 'houston-san-felipe': 261360, 'houston-groces': 264240, 'massacre-word': 267120, 'santa-anna-brazos': 281520,
  // The army over the Brazos at Groce's on the steamboat Yellow Stone from dawn on April 12 (`HIST-TEX-089`): April 1 is
  // 266400, and 266400 + 11 × 1440 + 6 × 60 = 282600, the date of the Bernardo camp in sim/houston.mjs `HOUSTON_CAMPS`.
  'houston-brazos': 282600,
  // The march east (`HIST-TEX-088`, sim/houston.mjs `HOUSTON_CAMPS`), each the moment the army sets out: for Donoho's the
  // afternoon of April 14 (266400 + 13 × 1440 + 15 × 60), McCarley's dawn on the 15th (+ 14 × 1440 + 6 × 60), Roberts' dawn on
  // the 16th (+ 15 × 1440 + 6 × 60), Burnett's 2 p.m. on the 16th (+ 15 × 1440 + 14 × 60); for Harrisburg noon on the 17th
  // (`houston-harrisburg`, below) and Lynchburg noon on the 19th.
  'houston-donohos': 286020, 'houston-mccarleys': 286920, 'houston-roberts': 288360, 'houston-burnetts': 288840,
  // The army's questions to a man with Houston (sim/camp.mjs, docs/HOUSTON_CAMP.md): whether he leaves for his family with
  // the word of Goliad (open from `goliad-word` to dawn on the 28th, when the army marches for the Brazos), and which road at
  // the fork at Roberts', beyond Spring Creek (noon on April 16 to noon on the 17th, `HIST-TEX-082`).
  'goliad-leave-close': 261000, 'which-road': 288720, 'which-road-close': 290160,
  'houston-harrisburg': 290160, 'houston-lynchburg': 293040, 'san-jacinto-field': SAN_JACINTO_START, 'san-jacinto': jacintoAt('volley'), 'santa-anna-taken': jacintoAt('taken'),
  'victory-word': 298800, 'scrape-end': 301320,
});
/**
 * The families arrive at dawn on September 28, eighteen hours before midnight.
 *
 * docs/SETTLING_IN.md: the first real minutes of a class are peaceful - families arrive by
 * wagon and make their homes - and the first news of the cannon still comes on the morning of
 * the 29th (`HIST-GONZ-002`). So a class now starts at dawn on the 28th and every moment of the
 * timeline is eighteen hours later on its clock: about thirteen real minutes of peace at the
 * Study pace. The dates of history do not move; only where the class starts watching.
 */
export const ARRIVAL_MINUTES = 1080;
export const TIMELINE = Object.freeze(Object.fromEntries(Object.entries(FROM_MIDNIGHT_SEPT_29).map(([key, minute]) => [key, minute + ARRIVAL_MINUTES])));
/**
 * When a moment falls on this class's own clock.
 *
 * A class saved before arrivals started at midnight on the 29th, has no `director.arrival`,
 * and keeps exactly the timeline it was playing - no save version moves.
 */
export const momentOf = (world, key) => TIMELINE[key] - (world.director?.arrival ? 0 : ARRIVAL_MINUTES);
/** The calendar moment a minute of this class's clock falls on: kept in sim/clock.mjs, where the hunt's season reads it too. */
export { dateOf };
export const HISTORICAL_OUTCOME = 'Mexican detachment withdraws; Texians retain the cannon.';
const captions = {
  gathering: 'People gather near Gonzales. Supplies and civilian work support them.',
  approach: 'Texian militia advances toward the Mexican camp on the morning of October 2.',
  exchange: 'A brief clash takes place. The Texians fire the cannon. Neither side is destroyed; both are deciding whether to go on.',
  withdrawal: 'The Mexican detachment breaks off and withdraws toward Béxar. They were not beaten down - they were ordered not to force a fight, and they stopped.',
  resolved: HISTORICAL_OUTCOME,
};
// Where the clash actually stood, read off the map rather than written down here.
// HIST-GONZ-008 puts it about seven miles upriver of the contested ford on Ezekiel
// Williams's land, and `buildGonzalesRegion` already places that site; HIST-GONZ-007
// has the Texians crossing to the west bank and marching upriver to reach it. So the
// Mexican camp is the site, the Texians arrive from the ford behind them, and
// Castañeda withdraws on up the river away from Gonzales, toward Béxar.
//
// These are derived every tick rather than stored, which is the whole point: a class
// saved by a build that hardcoded them - or by any later map - re-anchors on load
// instead of drawing the battle wherever the old coordinate space happened to put it.
// No save version moves, because nothing here is remembered, only recomputed.
//
// Since 2026-09-25 the ground is the engagement's own (sim/battles/gonzales.mjs `gonzalesGround`,
// docs/battle-research/gonzales.md): the timber the Texians waited in, the rise the dragoons took, the
// cornfield, the road to Béxar. The four old names stay for anything that still reads them.
export function battleGround(world) {
  const ground = gonzalesGround(world);
  return { ...ground, mexican: ground.camp, texianStart: ground.timber, texianClosed: ground.closed, mexicanGone: ground.gone };
}
export function initializeDirectors(world) {
  const ground = battleGround(world);
  world.director = { arrival: true, milestones: {}, dispatches: {}, complete: false, phase: 'home', battle: { phase: 'waiting', formations: [
    { id: 'formation-texian', side: 'texian', x: ground.texianStart.x, y: ground.texianStart.y, count: GONZALES.sides.texian.drawn },
    { id: 'formation-mexican', side: 'mexican', x: ground.mexican.x, y: ground.mexican.y, count: GONZALES.sides.mexican.drawn },
  ] }, frames: [] };
  world.battles = {};
  world.requests = {};
  world.marches = {};
  world.rumors = {};
  for (const [id, minute] of Object.entries(TIMELINE)) world.barriers.push({ id: `gonzales:${id}`, minute, kind: 'historical-scene', resolved: false });
}
function once(world, key, action) {
  if (world.director.milestones[key] || world.minute < momentOf(world, key)) return;
  action(); world.director.milestones[key] = true;
  // A class saved before this milestone existed has no barrier for it. There is nothing
  // to resolve in that case, which is the correct empty value, so no save version moves.
  const barrier = world.barriers.find(b => b.id === `gonzales:${key}`);
  if (barrier) barrier.resolved = true;
}
export const CAMP_SITE = 'williams-camp';
/**
 * The night crossing, as news. `HIST-GONZ-003`: the Texian force crossed to the west bank on
 * the night of October 1 and marched upriver. It is learned only by being in Gonzales or at
 * the camp - nobody rides out to farms with it, because nobody at home could act on it
 * before dawn - and it is what the upriver call is asked on the strength of.
 */
export const CROSSING = 'force-crossing';
const hoursAgo = minutes => { const whole = Math.round(minutes / 60); return whole <= 1 ? 'an hour' : `${whole} hours`; };
function presentAt(world, householdId, siteId) {
  return world.households[householdId].members.some(id => world.entities[id].location.siteId === siteId);
}
const atGonzales = (world, householdId) => presentAt(world, householdId, 'gonzales');
const atCamp = (world, householdId) => presentAt(world, householdId, CAMP_SITE);
// Seeing it happen means standing at the camp where it happens, or in the town it can be
// seen from. Both are real positions a person walked to, never a camera setting.
const witnessing = (world, householdId) => atCamp(world, householdId) || atGonzales(world, householdId);

// What going upriver costs, stated before the choice and resolved from the person's own
// state rather than from a die. Fresh, and they come back tired; already tired, and they
// come back hurt. That makes who a family sent - and how far that person had already
// walked - decide the outcome, which is the interaction VISION.md asks systems to have
// with each other.
//
// It stops at a minor, recoverable condition and never reaches a wound, a capture or a
// death. HISTORY.md excludes individual wounds and casualty counts at Gonzales as
// historical fact, and FIC-GONZ-005 permits only fatigue or a minor condition as
// fiction. The Battle of Gonzales is not the place to invent a casualty.
// ceiling: the second rung is unreachable inside one slice. Nothing makes anybody
// tired before `settleHelp`, which is the same moment this cost is applied, so every
// marcher is 'well' when it lands and 'minor-injury' never occurs in a played class.
// It is kept because state is preserved between arcs - somebody who ends this slice
// tired starts the next one tired - and because a fatigue system is already on the
// roadmap. Until one exists, the stated risk a student reads is always the first rung.
const MARCH_COST = Object.freeze({ well: 'tired', tired: 'minor-injury' });
const MEND_MINUTES = 4320;
export function marchCost(condition) { return MARCH_COST[condition] || condition; }
export function marchRisk(name, condition) {
  if (condition === 'well') return `${name} will come back tired.`;
  if (condition === 'tired') return `${name} is already tired. Going on will leave ${name} hurt, and mending takes days.`;
  return `Going on will not mend what ${name} is already carrying.`;
}
/**
 * Whether what a family has heard is firm enough for somebody to ask something of it.
 *
 * `FIC-GONZ-020`. A neighbour carrying food to Gonzales knocks on the door of a family that
 * heard it from somebody who saw it, or from somebody who had it straight from them. Nobody
 * knocks on a rumor. A family whose word came third-hand or worse is asked a different
 * question - its own, and not a neighbour's: does somebody go and see? That is the first
 * point at which how a family heard decides what it can do, rather than only what its
 * journal says.
 */
export const firmEnough = report => Boolean(report) && report.status !== 'rumor';
const handsSaid = hands => hands === 2 ? 'third-hand' : `through ${hands} pairs of hands`;

function offerRequests(world) {
  if (!world.rumors) world.rumors = {};
  for (const household of Object.values(world.households)) {
    const report = world.knowledge.households[household.id]['cannon-request'];
    if (!report || world.requests[household.id] || world.minute >= momentOf(world, 'approach')) continue;
    if (distant(household)) continue;
    if (!firmEnough(report)) {
      offerRumor(world, household, report);
      continue;
    }
    const rumor = world.rumors[household.id];
    // A family that heard the rumor and chose to stay home has answered. Firmer word
    // arriving later does not bring a neighbour to the door to ask again: VISION.md §11,
    // a refusal reduces repeated requests.
    if (rumor?.status === 'refused') continue;
    // Firmer word has arrived - a second rider, or the family's own eyes in Gonzales - and
    // the question of whether to go and find out has answered itself.
    if (rumor?.status === 'open') rumor.status = 'overtaken';
    // A neighbour speaking, not a rules panel. What each choice costs belongs on the
    // controls; a request that has to explain itself is a badly designed request. It names
    // nobody: the family decides who answers it (docs/FAMILY_CREATION.md step 4), and it
    // used to name the principal - and before that, somebody called Thomas.
    const inTown = household.members.some(id => world.entities[id].location.siteId === 'gonzales' && canAnswerCalls(world.entities[id]));
    const text = inTown
      ? "People in Gonzales are gathering food for the men here, and ask whether your family can give some of its own."
      : 'A neighbour is at the door. They are carrying food to the people gathering near Gonzales, and ask whether somebody from your family can help take it.';
    const id = record(world, 'pressure', { householdId: household.id, text, classification: 'FICTIONAL FOR GAMEPLAY', causes: [report.eventId], importance: 2 });
    world.requests[household.id] = { id, text, status: 'open', offeredMinute: world.minute, where: inTown ? 'town' : 'home' };
  }
}
/**
 * A rumor, put to the family as a question of its own.
 *
 * Asked once. It says only what the rumor itself said and how far it came, which is
 * everything the family has; the options are to go and see, or to stay home and prepare.
 * It never tells the family the rumor is true - finding that out is what going is for.
 */
function offerRumor(world, household, report) {
  if (world.rumors[household.id]) return;
  const text = `The word that reached your family came ${handsSaid(report.hands ?? 2)}, and nobody who passed it on saw any of it. Does somebody go to Gonzales to see?`;
  const id = record(world, 'pressure', { householdId: household.id, text, classification: 'FICTIONAL FOR GAMEPLAY', claimId: 'FIC-GONZ-020', causes: [report.eventId], importance: 2 });
  world.rumors[household.id] = { id, text, status: 'open', offeredMinute: world.minute };
}
// The second call, and the one that puts a family member where the fighting is. It is
// only ever put to a household whose person actually stood in Gonzales when the force
// moved out - carrying food to a gathering and marching upriver to a fight are two
// different acts, and the game asks separately about the second.
function offerMarch(world) {
  if (!world.marches) world.marches = {};
  // Open from the evening the men gathered at the ferry, or from the crossing for a class saved before that moment existed.
  const opens = world.director.milestones['upriver-call'] ? momentOf(world, 'upriver-call') : momentOf(world, 'crossing');
  // A call nobody answered in time shuts when the walk could no longer make it, not at dawn: silence is an answer too.
  for (const [householdId, march] of Object.entries(world.marches)) {
    if (march.status !== 'open' || !Number.isFinite(march.closes) || world.minute <= march.closes) continue;
    march.status = 'expired';
    const waiting = world.entities[march.actorId];
    record(world, 'consequence', { householdId, actorId: march.actorId, importance: 2, causes: [march.id], claimId: 'FIC-GONZ-446', text: `Nobody answered, and the men went up the river without ${waiting?.name || 'them'}.` });
  }
  if (world.minute < opens || world.minute >= momentOf(world, 'approach')) return;
  for (const household of Object.values(world.households)) {
    const request = world.requests[household.id];
    if (!request || request.status !== 'accepted' || world.marches[household.id]) continue;
    // Whoever the family sent with the food, which since the family chooses may be anybody
    // old enough - a mother included. A class saved before that has no actor, and it was
    // the principal.
    const entity = world.entities[request.actorId || household.principalId];
    if (entity.location.siteId !== 'gonzales') continue;
    if (['dead', 'captured'].includes(entity.health.condition)) continue;
    // Asked because the family was told, and told the way it was told. Somebody standing in
    // Gonzales when the men gathered at the ferry hears them asking; somebody who reaches town
    // after they have gone over is told by the people still there, and the offer says how long
    // ago. It used to open on the clock with "are crossing the river tonight" for anybody in
    // town until dawn, which was false for everybody who arrived after the crossing.
    const crossed = world.knowledge.households[household.id][CROSSING], called = world.knowledge.households[household.id][UPRIVER_CALL];
    const told = crossed || called;
    if (!told) continue;
    // The arrival guarantee (owner, 2026-09-25: "if they sent a character, it needs to happen in such a way that their
    // character arrives in time to participate"; `FIC-GONZ-446`). The call is only put while a walk from Gonzales still
    // reaches the men in the timber before first light, and it shuts for this family the moment it would not. Somebody who
    // reaches town too late is told so, in town, and never asked - the date of the fight does not move for anybody.
    const closes = marchCloses(world);
    if (world.minute > closes) {
      if (!world.marches[household.id]) {
        const text = `The men who took the cannon have gone too far up the river to be caught before first light. ${entity.name} stays in Gonzales.`;
        world.marches[household.id] = { id: record(world, 'consequence', { householdId: household.id, actorId: entity.id, text, classification: 'FICTIONAL FOR GAMEPLAY', claimId: 'FIC-GONZ-446', causes: [request.choiceId, told.eventId], importance: 2 }), text, status: 'missed', actorId: entity.id, offeredMinute: world.minute };
      }
      continue;
    }
    const late = crossed ? crossed.receivedMinute - crossed.observedMinute : 0;
    const text = !crossed
      ? `The men who took the cannon are going over the river tonight and up it after the Mexican camp. They ask whether ${entity.name} will go with them.`
      : late < 60
        ? `The men who took the cannon are over the river tonight and going upriver after the Mexican camp. They ask whether ${entity.name} will go with them.`
        : `The men who took the cannon crossed the river ${hoursAgo(late)} ago and are going upriver after the Mexican camp. People still in town ask whether ${entity.name} will follow them and catch them up before first light.`;
    const id = record(world, 'pressure', { householdId: household.id, actorId: entity.id, text, classification: 'FICTIONAL FOR GAMEPLAY', claimId: 'FIC-GONZ-011', causes: [request.choiceId, told.eventId], importance: 2 });
    // The cost is settled here, once, and carried on the offer. It is NOT recomputed when
    // the march is paid out, because the nine miles up the river are themselves enough to
    // tire somebody: read it again at the end and a family shown "will come back tired"
    // would be handed a hurt man instead. A control that states a price must charge it.
    const promised = marchCost(entity.health.condition);
    world.marches[household.id] = { id, text, status: 'open', actorId: entity.id, offeredMinute: world.minute, closes, promised, risk: marchRisk(entity.name, entity.health.condition) };
  }
}

/**
 * The words the men asked with, known in Gonzales from six on the evening of the 1st (`HIST-TEX-470`: the crossing began
 * about seven). Learned only by being in the town, as the crossing is.
 */
export const UPRIVER_CALL = 'upriver-call';
/** How much sooner than first light somebody sent up the river must be with the men: a margin for a slow road. */
const JOIN_MARGIN_MINUTES = 40;
/** A walk's minutes over hard ground come out a little longer than its pace says; this is the allowance. */
const ROAD_SLACK = 1.15;
/**
 * The minutes of 1835 it takes somebody going this way to get from Gonzales to `target` along the road the journey will
 * actually take (sim/ways.mjs `findWay`), with the road's own hard going (`pace`) counted: what the arrival guarantee is
 * measured in. Null where there is no road.
 */
export function minutesToJoin(world, target, modeId = 'foot') {
  const path = findWay(world, 'gonzales', CAMP_SITE, modeId);
  const mode = MODES[modeId] || MODES.foot;
  if (!path) return null;
  const cut = cutAt(path.points, target);
  const slow = new Map(path.pace || []);
  let miles = 0;
  for (let i = 1; i < cut.points.length; i++) miles += Math.hypot(cut.points[i].x - cut.points[i - 1].x, cut.points[i].y - cut.points[i - 1].y) * (i - 1 < cut.segment ? slow.get(i - 1) || 1 : 1);
  return Math.ceil(miles / mode.speed * 20 * ROAD_SLACK);
}
/** The last minute the upriver call may be answered and a walker still reach the men in the timber before first light. */
export function marchCloses(world) {
  const ground = gonzalesGround(world);
  const walk = minutesToJoin(world, ground.timber, 'foot') ?? 0;
  return momentOf(world, 'approach') - walk - JOIN_MARGIN_MINUTES;
}
/**
 * The road cut where it comes nearest `target`, and a last short step across to it: where the men are, rather than the
 * Mexican camp's own point at the end of the road (a family's person used to walk into the camp and then be moved back).
 */
function cutAt(points, target) {
  let best = Infinity, cut = null;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i], dx = b.x - a.x, dy = b.y - a.y, length = Math.hypot(dx, dy);
    const t = length ? Math.max(0, Math.min(1, ((target.x - a.x) * dx + (target.y - a.y) * dy) / (length * length))) : 0;
    const q = { x: a.x + dx * t, y: a.y + dy * t }, off = Math.hypot(q.x - target.x, q.y - target.y);
    if (off < best - 1e-9) { best = off; cut = { segment: i - 1, q }; }
  }
  const kept = points.slice(0, cut.segment + 1);
  return { points: [...kept, cut.q, { x: target.x, y: target.y }], segment: cut.segment + 1 };
}
/** End a journey with the men: the road cut short at `target`, the traveller set down there, and over the ford as they went. */
function endWithTheForce(travel, target) {
  const cut = cutAt(travel.points, target);
  const points = cut.points;
  let distance = 0, along = 0;
  for (let i = 1; i < points.length; i++) { const d = Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y); distance += d; if (i <= cut.segment) along += d; }
  travel.points = points; travel.distance = distance;
  if (travel.pace) { travel.pace = travel.pace.filter(([segment]) => segment < cut.segment); if (!travel.pace.length) delete travel.pace; }
  if (travel.fords) { travel.fords = travel.fords.filter(ford => ford.at <= along); if (!travel.fords.length) delete travel.fords; }
  travel.settle = { x: target.x, y: target.y, task: 'help' };
  travel.withForce = true;
}
/**
 * A road begun from the place's own point, started instead from where the person stands in the line: nobody is drawn
 * jumping to the camp's point to set off home (sim/world.mjs `beginTravel` does the same past a quarter of a mile).
 */
function startFrom(travel, here) {
  const first = travel.points[0], gap = Math.hypot(first.x - here.x, first.y - here.y);
  if (gap < 1e-6) return;
  travel.points = [{ x: here.x, y: here.y }, ...travel.points];
  travel.distance += gap;
  if (travel.pace) travel.pace = travel.pace.map(([segment, factor]) => [segment + 1, factor]);
  if (travel.fords) travel.fords = travel.fords.map(ford => ({ ...ford, at: ford.at + gap }));
}
/**
 * Where somebody answering the call now joins the men: at Mrs. DeWitt's if a walk gets them there before the column moves
 * off, otherwise straight up to the timber the men wait in. Null when neither is reached before first light.
 */
function joinPlan(world, entity, modeId) {
  const ground = gonzalesGround(world), marchesOff = momentOf(world, 'crossing') + phaseOffset(GONZALES, 'approach');
  const toRendezvous = minutesToJoin(world, ground.rendezvous, modeId), toTimber = minutesToJoin(world, ground.timber, modeId);
  const upriver = { x: -ground.toward.x, y: -ground.toward.y };
  const slot = target => placeFrom(target, upriver, looseSlot(entity.id, 0, { width: 0.2, depth: 0.12 }));
  if (toRendezvous !== null && world.minute + toRendezvous + JOIN_MARGIN_MINUTES <= marchesOff) return { target: slot(ground.rendezvous), where: 'rendezvous', eta: world.minute + toRendezvous };
  if (toTimber !== null && world.minute + toTimber + JOIN_MARGIN_MINUTES <= momentOf(world, 'approach')) return { target: slot(ground.timber), where: 'timber', eta: world.minute + toTimber };
  return null;
}
/**
 * Whether this family can answer a call this way, and if not, why - in the words the
 * student will read on the control.
 *
 * The same rule the work controls follow, arriving late to the one decision the lesson
 * turns on. Until now these two answers were offered whatever the family's state and
 * failed on the press: "Help - 2 food" sat there enabled for a household with one food.
 *
 * It is one function rather than two because the throw and the greyed-out button have to
 * agree. `choreAvailability` learned that the hard way; a control that says a thing is
 * possible and then refuses it is worse than a control that was never offered.
 */
export function callAvailability(world, householdId, entity, action) {
  const household = world.households[householdId];
  if (['dead', 'captured'].includes(entity.health.condition)) return { can: false, why: `${entity.name} cannot answer.` };
  if (tooYoung(entity)) return { can: false, why: tooYoungWhy(entity) };
  if (!canAnswerCalls(entity)) return { can: false, why: cannotAnswerWhy(entity) };
  if (action === 'help') {
    if (entity.travel) return { can: false, why: 'Wait until this person arrives.' };
    if (household.resources.food < 2) return { can: false, why: 'Helping needs two food. Staying home is also a valid choice.' };
    return { can: true, why: '' };
  }
  if (action === 'stay' || action === 'stay-home') {
    if (entity.location.siteId !== household.homeSiteId) return { can: false, why: 'Return home before choosing to stay and prepare.' };
    return { can: true, why: '' };
  }
  if (action === 'go-upriver' || action === 'go-see') {
    // Going upriver is going to the fight; going to see is not (sim/family.mjs `canFight`).
    if (action === 'go-upriver' && !canFight(entity)) return { can: false, why: cannotFightWhy(entity) };
    if (entity.travel) return { can: false, why: 'Wait until this person arrives.' };
    return { can: true, why: '' };
  }
  return { can: true, why: '' };
}

/**
 * What each answer to a call would cost, said before it is chosen.
 *
 * Shaped deliberately like a chore's question - a line of text and options that each carry
 * their own price in the person's own words - because it is the same kind of thing and a
 * student who has learned one should not have to learn the other. See
 * docs/evidence/one-decision-shape.json.
 */
export function requestOptions(world, householdId, request, kind, who = null) {
  const household = world.households[householdId];
  const entity = who || world.entities[request.actorId || household.principalId];
  const offer = (id, label, note) => ({ id, label, note, ...callAvailability(world, householdId, entity, id) });
  if (kind === 'march') {
    // What they take with them, said on the control. The volunteers at Gonzales were
    // settlers who brought their own arms (`HIST-GONZ-020`), so the powder that goes
    // upriver is the powder in this family's house - the same powder a hunt spends.
    // The rule, not a running count. A number read off the store the moment the control
    // is drawn would change under a student while they read it - which is the same defect
    // the stored `risk` exists to prevent. What actually went is recorded afterwards.
    const taking = ` ${entity.name} takes up to ${MARCH_POWDER} powder out of the house.`;
    return [
      offer('go-upriver', 'Go upriver to the camp', `${request.risk || `${entity.name} would go on with them.`}${taking}`),
      offer('stay-in-town', 'Stay in town with the supplies', `The supplies go on without ${entity.name}.`),
    ];
  }
  const tired = entity.health.condition === 'tired' ? ` ${entity.name} is already tired.` : '';
  const prepare = `One food set aside, and ${entity.name} stays where the family can use them.`;
  if (kind === 'rumor') {
    return [
      offer('go-see', 'Go to Gonzales and see', `Nothing spent and nothing promised. ${entity.name} walks to town and finds out.${tired}`),
      offer('stay-home', 'Stay home and prepare', prepare),
    ];
  }
  const inTown = entity.location.siteId === 'gonzales';
  return [
    offer('help', inTown ? 'Give food here in Gonzales' : 'Carry the food to Gonzales', inTown ? `Two food out of the family's store. ${entity.name} is already here.` : `Two food out of the store, and the road there and back.${tired}`),
    offer('stay', 'Stay home and prepare', prepare),
  ];
}

/**
 * What somebody going upriver carries out of the house.
 *
 * Two, or whatever is left. Invented like every other number here (`FIC-GONZ-016`), and
 * the point of it is not the fight - `HIST-GONZ-004` fixes that outcome and nothing a
 * family does may touch it. The point is afterwards: a household that sent its powder up
 * the river has none for the timber, and buying more costs food and an afternoon. The
 * consequence is the family's, which is the only scale at which this game lets anything
 * turn on what a student chose.
 */
export const MARCH_POWDER = 2;

export function handleMarch(world, householdId, entity, action, { beginTravel, travelRefusal }, mode) {
  const march = world.marches?.[householdId];
  if (!march || march.status !== 'open') throw new Error('Nobody is asking that.');
  if (world.minute >= momentOf(world, 'approach')) throw new Error('They have already gone upriver.');
  if (march.actorId !== entity.id) throw new Error(`${entity.name} was not the one asked.`);
  const allowed = callAvailability(world, householdId, entity, action);
  if (!allowed.can) throw new Error(allowed.why);
  // Refused before a single thing moves. This function records the choice and then sends
  // somebody walking, so a journey that turns out to be impossible after the decision is
  // written down would leave a household that had agreed to go and nobody on the road.
  // Where they will join the men, and whether they can in time at all (`FIC-GONZ-446`). A call answered too late for the
  // way chosen is refused before anything is written down, with the reason; the call itself shuts for good at `closes`.
  let plan = null;
  if (action === 'go-upriver') {
    const why = travelRefusal?.(world, entity, CAMP_SITE, mode);
    if (why) throw new Error(why);
    if (Number.isFinite(march.closes) && world.minute > march.closes) throw new Error('The men have gone too far up the river to be caught before first light.');
    plan = joinPlan(world, entity, mode || 'foot');
    if (!plan) throw new Error(`Going that way, ${entity.name} could not reach the men before first light.`);
  }
  march.status = action === 'go-upriver' ? 'accepted' : 'refused';
  march.choiceId = record(world, 'choice', {
    actorId: entity.id, householdId, decision: action, causes: [march.id], importance: 2,
    text: action === 'go-upriver'
      ? `${entity.name} will go up the river with the men.`
      : `${entity.name} will stay in Gonzales with what is left of the supplies.`,
  });
  if (action === 'go-upriver') {
    entity.commitments.push({ id: 'gonzales-march', type: 'service', status: 'active', choiceId: march.choiceId });
    const household = world.households[householdId];
    const carried = Math.min(MARCH_POWDER, household.resources.powder ?? 0);
    if (carried > 0) {
      household.resources.powder = Math.round((household.resources.powder - carried) * 10000) / 10000;
      record(world, 'property', {
        actorId: entity.id, householdId, importance: 2, causes: [march.choiceId],
        text: `${entity.name} took ${carried} powder up the river. There is ${household.resources.powder} left in the house.`,
      });
    }
    // A real journey over the ford and up the west bank. `findPath` routes it; nobody is
    // ever placed at the camp without having walked there. It ends with the men - at Mrs.
    // DeWitt's while they are formed there, in the timber once they have gone up - never on
    // the Mexican camp's own point, and it goes over the ford as they did.
    beginTravel(world, entity, CAMP_SITE, march.choiceId, 'help', mode);
    endWithTheForce(entity.travel, plan.target);
    march.carried = carried; march.mode = entity.travel.mode; march.joins = plan.where; march.due = plan.eta;
    // A horse ridden up the river goes the same road, and stops where its rider stops.
    for (const beast of Object.values(world.entities)) if (beast.borrowedBy === entity.id && beast.travel?.to === CAMP_SITE) { endWithTheForce(beast.travel, plan.target); beast.travel.settle.task = 'rest'; }
    // He takes the family's rifle upriver, for as long as he is away (owner, 2026-09-24; sim/keeping.mjs).
    goToWar(world, household, entity, 'gone upriver with the men at Gonzales');
  } else {
    entity.task = 'help';
    const consequence = record(world, 'consequence', { actorId: entity.id, householdId, importance: 2, causes: [march.choiceId], text: `${entity.name} stayed in Gonzales when the others crossed. The family's supplies went on without him.` });
    remember(world, world.households[householdId], entity, consequence, `${entity.name} went as far as Gonzales and no further.`);
  }
}
export function handleChoice(world, householdId, entity, action, { beginTravel, travelRefusal }, mode) {
  const request = world.requests?.[householdId];
  if (!request || request.status !== 'open' || !world.knowledge.households[householdId]['cannon-request']) throw new Error('There is no known open request.');
  if (world.minute >= momentOf(world, 'approach')) throw new Error('This gathering request has closed.');
  if (entity.travel) throw new Error('Wait until this person arrives.');
  const household = world.households[householdId];
  const allowed = callAvailability(world, householdId, entity, action);
  if (!allowed.can) throw new Error(allowed.why);
  // Same rule as the march: the food is spent and the promise is written down below, so
  // an impossible journey has to be refused before either happens.
  if (action === 'help' && entity.location.siteId !== 'gonzales') {
    const why = travelRefusal?.(world, entity, 'gonzales', mode);
    if (why) throw new Error(why);
  }
  request.status = action === 'help' ? 'accepted' : 'refused';
  request.actorId = entity.id;
  const inTown = entity.location.siteId === 'gonzales';
  request.choiceId = record(world, 'choice', { actorId: entity.id, householdId, text: action === 'help' ? (inTown ? `${entity.name} will give food here in Gonzales.` : `${entity.name} will carry food to Gonzales.`) : `${entity.name} will stay home and prepare the household.`, decision: action, causes: [request.id], importance: 2 });
  if (action === 'help') {
    household.resources.food = Math.round((household.resources.food - 2) * 10000) / 10000;
    entity.commitments.push({ id: 'gonzales-supplies', type: 'service', status: 'active', choiceId: request.choiceId });
    if (entity.location.siteId !== 'gonzales') beginTravel(world, entity, 'gonzales', request.choiceId, 'help', mode);
    else { entity.task = 'help'; record(world, 'arrival', { actorId: entity.id, householdId, destination: 'gonzales', purpose: 'help', text: `${entity.name} offers supplies where they already are.`, causes: [request.choiceId] }); }
  } else {
    entity.task = 'work'; household.prepared = true; household.resources.food += 1;
    const consequence = record(world, 'consequence', { actorId: entity.id, householdId, text: `${entity.name} stayed home and set aside one food. The family kept its labor and transportation nearby.`, causes: [request.choiceId], importance: 2 });
    remember(world, household, entity, consequence, `Your family kept ${entity.name} home and prepared supplies.`);
  }
}
/**
 * Answering a rumor: go and see, or stay home and prepare.
 *
 * Going promises nothing and spends nothing. It is an ordinary walk to town, and what makes
 * it matter is what is waiting there: somebody standing in Gonzales sees it for themselves
 * (`witnessing`), the family's word becomes firm, and the call a neighbour would have
 * brought to the door is put to them in town instead. Staying is the same preparation the
 * neighbour's call offers, and it is only ever paid once.
 */
export function handleRumor(world, householdId, entity, action, { beginTravel, travelRefusal }, mode) {
  const rumor = world.rumors?.[householdId];
  if (!rumor || rumor.status !== 'open') throw new Error('Nobody is asking that.');
  if (world.minute >= momentOf(world, 'approach')) throw new Error('It is too late to go and see.');
  const allowed = callAvailability(world, householdId, entity, action);
  if (!allowed.can) throw new Error(allowed.why);
  if (action === 'go-see' && entity.location.siteId !== 'gonzales') {
    const why = travelRefusal?.(world, entity, 'gonzales', mode);
    if (why) throw new Error(why);
  }
  const household = world.households[householdId];
  rumor.status = action === 'go-see' ? 'accepted' : 'refused';
  rumor.actorId = entity.id;
  rumor.choiceId = record(world, 'choice', {
    actorId: entity.id, householdId, decision: action, causes: [rumor.id], importance: 2, claimId: 'FIC-GONZ-020',
    text: action === 'go-see' ? `${entity.name} will go to Gonzales to see whether it is true.` : `${entity.name} will stay home on a rumor and prepare the household.`,
  });
  if (action === 'go-see') {
    if (entity.location.siteId !== 'gonzales') beginTravel(world, entity, 'gonzales', rumor.choiceId, 'visit', mode);
    return;
  }
  // The same preparation the neighbour's call offers, and paid only once: a family that
  // stayed home on the rumor is never asked the neighbour's call afterwards.
  entity.task = 'work'; household.prepared = true; household.resources.food += 1;
  const consequence = record(world, 'consequence', { actorId: entity.id, householdId, importance: 2, causes: [rumor.choiceId], text: `${entity.name} stayed home and set aside one food rather than go after a rumor.` });
  remember(world, household, entity, consequence, `Your family heard a rumor and kept ${entity.name} home.`);
}
function remember(world, household, entity, cause, text) {
  const id = record(world, 'memory', { actorId: entity.id, householdId: household.id, text, causes: [cause], importance: 3 });
  household.memories.push(id);
}
function settleHelp(world) {
  for (const [householdId, request] of Object.entries(world.requests)) {
    if (request.status !== 'accepted' || request.consequenceId) continue;
    const household = world.households[householdId], entity = world.entities[request.actorId || household.principalId];
    const arrival = world.events.find(e => e.type === 'arrival' && e.actorId === entity.id && e.purpose === 'help' && e.minute >= request.offeredMinute);
    if (!arrival || world.minute < momentOf(world, 'resolved')) continue;
    const outcome = world.truth['gonzales-outcome'];
    const march = world.marches?.[householdId];
    // Three different people end up here: one who carried food to town, one who went on
    // upriver and stood at the camp, and one who set out upriver and was still on the
    // road when it happened. They must not collapse into the same sentence.
    const wentOn = march?.status === 'accepted';
    // Since 2026-09-25 `stillWalking` cannot happen: the call is only put, and only answered,
    // while the walk reaches the men before first light (`marchCloses`, `joinPlan`,
    // `FIC-GONZ-446`), the road ends with them, the ford is crossed with them, and nobody
    // with them can be sent anywhere else until the fight is over (sim/battle-stage.mjs
    // `heldByBattle`). tests/battle-arrival.test.mjs holds every path. It is kept as the honest
    // sentence should any of those ever stop holding.
    const reachedCamp = wentOn && Number.isFinite(march.witnessed);
    const stillWalking = wentOn && !reachedCamp;

    // Standing there is worth more to a neighbour than handing over a sack in town, and
    // it is the relationship that later arcs inherit.
    household.relationships.neighbor += reachedCamp ? 2 : 1;

    const before = entity.health.condition;
    // Never replace a death, capture or an existing injury with a lighter state. A person
    // who went upriver gets exactly the cost their control named; everybody else is tired
    // from the errand.
    const promised = reachedCamp ? (march.promised || marchCost(before)) : null;
    const after = promised
      ? (['dead', 'captured', 'minor-injury'].includes(before) ? before : promised)
      : (['well', 'tired'].includes(before) ? 'tired' : before);
    if (after !== before) entity.health = after === 'minor-injury' ? { condition: after, recoversAt: world.minute + MEND_MINUTES } : { condition: after };
    // A condition imposed here needs the exertion that justifies it, or the two systems
    // contradict each other: `advanceRoutine` would see somebody freshly called tired
    // with hardly any miles on them and announce them fit again on the very next tick.
    // Whoever did this errand has a day's walking in them, and has to rest it off.
    if (['tired', 'minor-injury'].includes(after)) entity.exertion = Math.max(entity.exertion || 0, TIRING_MILES);

    // Who took part in what happened, and how. Never projected - it is the record glory will
    // be counted from (docs/MONEY_AND_GLORY.md §4), and it is written here, once, from what
    // the world actually did: carrying food that reached town is `supplied`, standing at
    // the camp while it happened is `present`, and since 2026-09-25 standing in the line
    // while it fired is `fought` (owner: "if they sent a character ... their character
    // arrives in time to participate and does participate"; the engine's record of who was
    // in the force while it fired, sim/battle-stage.mjs `participants`).
    if (!world.participation) world.participation = {};
    if (!world.participation.gonzales) world.participation.gonzales = {};
    const inLine = world.battles?.gonzales?.participants?.[entity.id];
    const role = reachedCamp ? (Number.isFinite(inLine?.fought) ? 'fought' : 'present') : 'supplied';
    world.participation.gonzales[entity.id] = { householdId, role, minute: role === 'fought' ? inLine.fought : reachedCamp ? march.witnessed : arrival.minute };
    // And what that part is worth, sealed until the end of the game (sim/glory.mjs). Written
    // here, from the record just made, and read by nothing in this file or any other director.
    awardGlory(world, { event: 'gonzales', claimId: 'HIST-GONZ-004', personId: entity.id, householdId, role: world.participation.gonzales[entity.id].role, fromSiteId: 'gonzales', causes: [arrival.id, ...(march?.choiceId ? [march.choiceId] : [])] });
    for (const commitment of entity.commitments) if (['gonzales-supplies', 'gonzales-march'].includes(commitment.id)) commitment.status = reachedCamp || commitment.id === 'gonzales-supplies' ? 'fulfilled' : 'unresolved';
    if (!entity.travel && entity.task === 'help') entity.task = 'rest';

    const state = after === before ? `${entity.name}'s existing condition is unchanged.`
      : after === 'minor-injury' ? `${entity.name} is hurt, and will be days mending.`
      : `${entity.name} is tired.`;
    const where = reachedCamp
      ? (role === 'fought' ? `${entity.name} stood at the camp on Williams's land when it happened, in the line with the men, and saw it.` : `${entity.name} stood at the camp on Williams's land when it happened, and saw it.`)
      : stillWalking
        ? `${entity.name} set out upriver but was not there when it happened, and saw none of it.`
        : `${entity.name}'s food reached Gonzales.`;
    // Somebody with the men comes back to Gonzales with them once the field is cleared (`HIST-TEX-478`); everybody else is
    // where they were.
    const after2 = reachedCamp ? `${entity.name} comes back to Gonzales with the men and the cannon.` : 'Current location and any return journey remain unchanged.';
    request.consequenceId = record(world, 'consequence', { householdId, actorId: entity.id, importance: 3, causes: [arrival.id, outcome.eventId, ...(march?.choiceId ? [march.choiceId] : [])], text: `${where} The neighbor remembers the assistance. ${state} ${after2}` });
    remember(world, household, entity, request.consequenceId, reachedCamp
      ? `${entity.name} went upriver to the camp and was there for it; the family remembers what it cost.`
      : stillWalking
        ? `${entity.name} set out upriver and got there too late; the family remembers the walk and not the fight.`
        : `${entity.name} carried food to Gonzales; the family remembers his absence and its assistance.`);
  }
}
function setBattlePhase(world, phase) {
  world.director.battle.phase = phase;
  world.director.lastBattleEventId = record(world, 'battle-phase', { text: captions[phase], phase, siteId: 'gonzales', classification: phase === 'gathering' ? 'FICTIONAL FOR GAMEPLAY' : 'DOCUMENTED', claimId: phase === 'gathering' ? 'FIC-GONZ-006' : phase === 'approach' || phase === 'exchange' ? 'HIST-GONZ-003' : 'HIST-GONZ-004', causes: [world.director.lastBattleEventId || world.truth['cannon-request'].eventId] });
}
/**
 * The old two formations, kept for every save and reader that has them (`director.battle`, `director.frames`): now read off
 * the engine's own places for the phase the fight is in, so they are where the fighting is drawn (sim/battle-stage.mjs).
 * Re-anchored every tick, so a save written against a different map opens with them where the fighting is.
 */
function moveFormations(world) {
  const battle = world.director.battle;
  const [texian, mexican] = battle.formations;
  const ground = battleGround(world);
  const place = (formation, point) => { formation.x = point.x; formation.y = point.y; };
  place(texian, ground.texianStart); place(mexican, ground.mexican);
  const state = battleState(world, 'gonzales');
  if (state && !state.before) {
    // The march home is the men leaving the field: the old formations stay on the ground the fight was fought over.
    const phase = state.phase.id === 'home' ? state.phases.find(one => one.id === 'field') : state.phase;
    const into = state.phase.id === 'home' ? phase.minutes : state.into;
    place(texian, sidePlace(ground, phase, 'texian', into)); place(mexican, sidePlace(ground, phase, 'mexican', into));
  }
  if (['approach', 'exchange', 'withdrawal', 'resolved'].includes(battle.phase)) {
    const last = world.director.frames.at(-1);
    if (!last || last.phase !== battle.phase) world.director.frames.push(structuredClone({ ...battle, minute: world.minute, caption: captions[battle.phase] }));
  }
}
/**
 * Somebody who went upriver stands with the Texian force, not in the Mexican camp.
 *
 * Found by reading the map: `williams-camp` is the point `battleGround` puts the Mexican
 * detachment on, so a family member who arrived at the camp was drawn standing among the
 * soldiers they had come to face. 0 A.D.'s rule is the fix (docs/REFERENCE_ARCHITECTURES.md
 * §4): a member of a formation keeps its own identity and state, and the formation takes
 * over only where it stands. So a person here is still one entity, under their own id, at
 * the camp - only their position follows the Texian formation, a few yards behind its front,
 * in a slot decided by their id so the same class always stands the same way. The formation
 * still carries a count and a position and names nobody.
 *
 * What is deliberately not borrowed: 0 A.D. moves a formation at its slowest member's pace.
 * Here the timing of the clash is `HIST-GONZ-003` and must never depend on who turned up,
 * so the people who joined move with the force rather than the force with them.
 */
export function formationMembers(world) {
  return Object.values(world.marches || {})
    .filter(march => march.status === 'accepted')
    .map(march => world.entities[march.actorId])
    .filter(person => person && !person.travel && person.location.siteId === CAMP_SITE && !['dead', 'captured'].includes(person.health.condition))
    .sort((a, b) => (a.id < b.id ? -1 : 1));
}
/**
 * Each of the families' people with the men walks to their own place in the force and keeps it as the force moves: a
 * scattered place in the loose line, in the file on the march (sim/battle-stage.mjs `looseSlot`). They walk there at a
 * walker's pace - a mile in twenty minutes of the calendar - rather than being set down on it, so nobody is drawn jumping.
 * Outside the fight (a class saved before the engine, or before it starts) they stand where the old rule stood them.
 */
function standWithTheForce(world) {
  if (world.director.battle.phase === 'waiting' && !world.battles?.gonzales) return;
  const state = battleState(world, 'gonzales');
  const members = formationMembers(world);
  if (!state || state.before || state.over || state.phase.id === 'home') {
    if (!state || state.before) placeByOldRule(world, members);
    return;
  }
  const ground = gonzalesGround(world), phase = state.phase;
  const centre = sidePlace(ground, phase, 'texian', state.into), enemy = sidePlace(ground, phase, 'mexican', state.into);
  const dx = enemy.x - centre.x, dy = enemy.y - centre.y, span = Math.hypot(dx, dy);
  const facing = span > 1e-6 ? { x: dx / span, y: dy / span } : { x: -ground.toward.x, y: -ground.toward.y };
  const spread = phase.texian.style === 'column' ? { width: 0.05, depth: 0.28 } : phase.texian.spread || GONZALES.sides.texian.spread;
  const reach = Math.max(0.05, calendarMinutes(world) / 20);
  const inLine = world.battles.gonzales.participants;
  members.forEach((person, index) => {
    const target = placeFrom(centre, facing, looseSlot(person.id, index, spread));
    const gap = Math.hypot(target.x - person.location.x, target.y - person.location.y);
    const part = gap <= reach ? 1 : reach / gap;
    person.location = { x: person.location.x + (target.x - person.location.x) * part, y: person.location.y + (target.y - person.location.y) * part, siteId: CAMP_SITE };
    // Who was with the men, from when, and from when they were in the line while it fired: what the account and the
    // participation record are written from. Never projected to anybody.
    const entry = inLine[person.id] ||= { householdId: person.householdId, joined: world.minute };
    if ((phase.texian.fire || 'none') !== 'none' && !Number.isFinite(entry.fought)) entry.fought = world.minute;
  });
}
function placeByOldRule(world, members) {
  const [texian] = world.director.battle.formations;
  const ground = battleGround(world);
  const dx = ground.texianStart.x - ground.mexican.x, dy = ground.texianStart.y - ground.mexican.y, span = Math.hypot(dx, dy) || 1;
  const back = { x: dx / span, y: dy / span }, side = { x: -back.y, y: back.x };
  members.forEach((person, slot) => {
    const row = Math.floor(slot / 4), column = (slot % 4) - 1.5;
    person.location = { x: texian.x + back.x * (0.06 + row * 0.035) + side.x * column * 0.035, y: texian.y + back.y * (0.06 + row * 0.035) + side.y * column * 0.035, siteId: CAMP_SITE };
  });
}

/** Everybody of this family standing with the men. */
const ownAtField = (world, householdId) => formationMembers(world).filter(person => person.householdId === householdId);
/** Whether this household has somebody going up the river with the men, or with them already. */
function goingOrThere(world, householdId) {
  const march = world.marches?.[householdId];
  if (march?.status !== 'accepted') return null;
  const person = world.entities[march.actorId];
  if (!person || ['dead', 'captured'].includes(person.health.condition)) return null;
  if (person.location.siteId === CAMP_SITE || person.travel?.to === CAMP_SITE) return person;
  return null;
}
/** The middle of the field, where the Host's camera and a student's Watch go: between the timber and the rise. */
export function fieldCentre(world) {
  const ground = gonzalesGround(world);
  return { x: (ground.timber.x + ground.rise.x) / 2, y: (ground.timber.y + ground.rise.y) / 2 };
}

/**
 * The fight on the engine, every tick of the Gonzales slice: the record kept, the families told, the Host's camera sent.
 * Everything it writes is dated by the engagement's own clock (sim/battles/gonzales.mjs), so nothing here moves a date.
 */
function advanceGonzalesFight(world, movement) {
  armBattle(world, 'gonzales', momentOf(world, GONZALES.startKey));
  const state = battleState(world, 'gonzales');
  if (!state) return;
  const battle = state.battle;
  const phaseId = state.phase?.id;
  // The alert, through the person, before the fighting (docs/BATTLES.md §2.7): once, to a family with somebody going up
  // the river or already with the men, in words that say where the men are now.
  if (!state.over && phaseId !== 'home' && world.minute < momentOf(world, 'approach')) {
    for (const household of Object.values(world.households)) {
      const person = goingOrThere(world, household.id);
      if (!person || battle.alerted[household.id]) continue;
      const text = !phaseId || phaseId === 'rendezvous'
        ? `At ${person.name}'s side: the men are going up the river tonight after the Mexican camp on Williams's land, and ${person.name} is going with them. They mean to be there before first light.`
        : `At ${person.name}'s side: the Mexican dragoons are on Williams's land ahead, and the men are going up to them in the dark. At first light they will go in.`;
      battle.alerted[household.id] = { eventId: record(world, 'notice', { householdId: household.id, actorId: person.id, importance: 3, classification: 'FICTIONAL FOR GAMEPLAY', claimId: 'FIC-GONZ-448', text }), minute: world.minute, entityId: person.id, text };
    }
  }
  // The cannon heard in Gonzales, seven miles down the river (`FIC-GONZ-417`): a family with somebody in the town and
  // nobody at the field hears the gun as a distant report, once at dawn and once after the parley. Never the rifles.
  const step = calendarMinutes(world), from = world.minute - step;
  for (const phase of state.phases) {
    const shot = (phase.cannon || []).map(at => phase.from + at).find(minute => minute > from && minute <= world.minute);
    if (shot === undefined) continue;
    for (const household of Object.values(world.households)) {
      const inTown = household.members.map(id => world.entities[id]).find(one => one?.kind === 'person' && !one.travel && one.location.siteId === 'gonzales' && !['dead', 'captured'].includes(one.health.condition));
      if (!inTown || ownAtField(world, household.id).length) continue;
      const heard = battle.heard[household.id] ||= {};
      if (heard[phase.id]) continue;
      heard[phase.id] = record(world, 'consequence', {
        householdId: household.id, actorId: inTown.id, importance: 2, classification: 'FICTIONAL FOR GAMEPLAY', claimId: 'FIC-GONZ-417',
        text: phase.id === 'fight'
          ? `In Gonzales, ${inTown.name} hears the gun again, far up the river: a dull report, and after a while another.`
          : `In Gonzales, ${inTown.name} hears a heavy gun fired somewhere far up the river, a dull report in the fog. Nobody in town can say what it means yet.`,
      });
    }
  }
  // The Host's camera goes to the field for the fighting (docs/BATTLES.md §2.1): at first light, and again for the cannon
  // and the advance after the parley.
  const field = fieldCentre(world);
  if (phaseId === 'dawn-skirmish' && !battle.spotlit?.dawn) {
    spotlight(world, { key: 'gonzales-dawn', text: 'Gonzales, first light on October 2: the Texian volunteers go out of the timber on Williams’s land against Castañeda’s dragoons.', ...field, claimId: 'HIST-TEX-473' });
    battle.spotlit = { ...(battle.spotlit || {}), dawn: world.minute };
  }
  // The march home (`HIST-TEX-478`): whoever was with the men walks back to Gonzales with them, and the family is told,
  // through that person, what happened, what they did and why it ended as it did (docs/BATTLES.md §2.8).
  if (phaseId === 'home' || state.over) {
    for (const person of formationMembers(world)) {
      const entry = battle.participants[person.id];
      if (!entry || entry.released) continue;
      entry.released = world.minute;
      const march = world.marches[person.householdId];
      const text = gonzalesAccount(world, person, entry, march);
      const eventId = record(world, 'consequence', { householdId: person.householdId, actorId: person.id, importance: 3, classification: 'DOCUMENTED', claimId: 'HIST-GONZ-004', causes: [march?.choiceId, world.truth['gonzales-outcome']?.eventId].filter(Boolean), text });
      remember(world, world.households[person.householdId], person, eventId, `${person.name} was in the line at Williams's place when the dragoons rode away, and came home with the cannon.`);
      battle.told[person.householdId] = { eventId, minute: world.minute, entityId: person.id, text };
      if (movement?.beginTravel) {
        try {
          const here = { x: person.location.x, y: person.location.y };
          movement.beginTravel(world, person, 'gonzales', eventId, 'visit', march?.mode || 'foot');
          if (person.travel) { startFrom(person.travel, here); person.location = { ...here, siteId: null }; person.travel.withForce = true; }
          for (const beast of Object.values(world.entities)) if (beast.borrowedBy === person.id && beast.travel) beast.travel.withForce = true;
        } catch { /* a person who cannot travel stays at the field, and says so in the account */ }
      }
    }
  }
}

/**
 * What a family is told of the fight through its own person, in plain words: what happened, what they did, and why it
 * ended as it did (docs/BATTLES.md §2.8; owner: "players should walk away understanding what happened"). Only what the
 * record gives (`HIST-TEX-470`-`-478`); the Mexican loss is said as the reports have it, disputed.
 */
export function gonzalesAccount(world, person, entry, march) {
  const name = person.name;
  const joined = entry.joined < momentOf(world, 'crossing') + phaseOffset(GONZALES, 'approach') ? 'marched up the river with the men in the dark' : 'caught the men up in the timber before first light';
  const fired = Number.isFinite(entry.fought) ? ', was in the line when they went out firing at first light, and loaded and fired with them' : ', and was with them through the morning';
  const powder = march?.carried ? ` ${name} had taken ${march.carried} powder from the house for it.` : '';
  const next = world.map.source
    ? `${name} is going back to Gonzales with the men and the cannon. Volunteers are coming in from the settlements, and whether ${name} stays for the gathering or comes home is the family's to say when the town asks.`
    : `${name} is going back to Gonzales with the men and the cannon, and can come home from there.`;
  return [
    `What happened: the Texians crossed the river in the night and went up it in the fog to Castañeda's camp on Williams's land. About three in the morning the Mexican outpost fired, and the dragoons mounted and took a rise. At first light the men went out of the timber firing; forty dragoons charged them, they fell back into the trees and fired the cannon, and the dragoons went back up the rise. When the fog lifted, the two commanders met between the lines. Castañeda said he was a republican and had orders to obey; Colonel Moore told him to join them or fight. Then the cannon was fired again, the men went forward at the double, and the dragoons wheeled and rode away toward Béxar.`,
    `What ${name} did: ${name} ${joined}${fired}. ${name} was not hit.${powder}`,
    `Why it ended so: Castañeda had orders to bring the cannon back without starting a war, and he was outnumbered. When the Texians would not give it up and came on, he withdrew rather than fight for it. No Texian was killed. Castañeda reported one of his soldiers hit by a carbine ball; others said one or two of the dragoons were killed. The reports do not agree.`,
    next,
  ].join('\n\n');
}
/**
 * Word from the army, told to every family and to the public reports on the same day.
 *
 * A milestone recorded `public` reaches only the Host's page (`projectWorld`); a family learns a thing only through its own
 * reports (sim/knowledge.mjs). Until 2026-09-16 the news of Goliad and Concepción was written as milestones alone, so no
 * student ever read it. `truth` is what happened; `text` is what this telling says, which for a rumour is not the same.
 * ceiling: every family hears it on one day, however far it lives; carrying battle news by rider settlement to settlement,
 * as the express carries the Gonzales word (sim/expresses.mjs), is what this still wants.
 */
function sendWord(world, topicId, { truth, text = truth, status = 'confirmed', claimId, source = 'Word from the army' }) {
  if (!world.truth[topicId]) establishTruth(world, { id: topicId, text: truth, siteId: 'bexar', classification: 'DOCUMENTED', claimId });
  for (const household of Object.values(world.households)) learn(world, household.id, topicId, { status, source, text });
  learn(world, 'public', topicId, { status, source, text });
}

/**
 * After October 2: the gathering, the army and the march (docs/COLONIES.md §5.5, build step 5).
 *
 * Only a class on the real land of the colonies comes here. The volunteers who answered their
 * settlements keep coming in, Gonzales's own families are asked the same question for the first
 * time, the army is made on the eleventh and marches on the twelfth, and what a family's person
 * was there for is written down as they go. Where the march ends - Concepción, the Grass Fight,
 * Béxar - is build step 6, and each of those battles is researched before it is built.
 */
function advanceGathering(world, movement) {
  once(world, 'gathering-opens', () => {
    world.director.phase = 'gathering';
    // When the gathering began is dated by nothing that was read for `HIST-TEX-018`: the first
    // named, dated presence is the letter of October 6. The third is this game's own.
    record(world, 'milestone', {
      visibility: 'public', importance: 2, classification: 'FICTIONAL FOR GAMEPLAY', claimId: 'FIC-GONZ-034',
      text: 'Volunteers are coming into Gonzales from every settlement, and there is talk of marching on Béxar.',
    });
  });
  // ceiling: told to the whole country on the day, because no express rides to Goliad on this map.
  // Carrying it by rider the way the Gonzales word is carried belongs with build step 6. What the
  // taking cost is left out on purpose: the two sources that give numbers disagree (`HIST-TEX-018`).
  once(world, 'goliad', () => {
    const text = `Word has come that the volunteers took the presidio at ${world.map.sites.goliad?.name || 'Goliad'} in the night, and its stores and arms with it.`;
    record(world, 'milestone', { visibility: 'public', importance: 2, classification: 'DOCUMENTED', claimId: HIST_GATHERING, text });
    sendWord(world, 'goliad-taken', { truth: text, claimId: HIST_GATHERING });
  });
  once(world, 'organised', () => {
    const eventId = record(world, 'milestone', {
      visibility: 'public', importance: 3, classification: 'DOCUMENTED', claimId: HIST_GATHERING,
      text: 'At four in the afternoon the volunteers at Gonzales were made into an army, and chose Stephen F. Austin to command it.',
    });
    formArmy(world, eventId);
    // Standing in the ranks the day it was made an army is a part a family took, and it is
    // written down now rather than at the end, because somebody sent for tomorrow was still there today.
    recordPresent(world, 'gathering', { claimId: HIST_GATHERING, causes: [eventId] });
  });
  once(world, 'march', () => {
    marchOut(world);
    // The weeks to Béxar: the calendar's longest stride, and the phase the two clocks were built for.
    world.director.phase = 'campaign';
  });
  // Where the army is held, by the date: the Cibolo until the 19th, the Salado until the 26th, Espada until the fight.
  const reached = key => world.minute >= momentOf(world, key);
  const hold = !reached('leave-cibolo') ? 'cibolo' : !reached('to-espada') ? 'salado' : !world.director.milestones.concepcion ? 'espada' : null;
  once(world, 'leave-cibolo', () => record(world, 'milestone', {
    visibility: 'public', importance: 2, classification: 'DOCUMENTED', claimId: 'HIST-TEX-019',
    text: 'The army has left its camp on the Cibolo, where it waited four days for reinforcements, and is moving on toward Béxar.',
  }));
  once(world, 'detachment', () => {
    const eventId = record(world, 'milestone', {
      visibility: 'public', importance: 2, classification: 'DOCUMENTED', claimId: 'HIST-TEX-019',
      text: 'From the camp on the Salado, five miles from Béxar, Bowie and Fannin have been ordered ahead with a division to the missions below the town.',
    });
    openDetachment(world, eventId);
  });
  once(world, 'to-espada', () => {
    closeDetachment(world);
    record(world, 'milestone', {
      visibility: 'public', importance: 2, classification: 'DOCUMENTED', claimId: 'HIST-TEX-019',
      text: 'The army has left the Salado and gone south down the river to Mission Espada.',
    });
  });
  advanceArmy(world, { hold, beginTravel: movement?.beginTravel });
  once(world, 'concepcion', () => {
    // Told to the whole country on the day, like Goliad. ceiling: word of it rode to San Felipe in three days and arrived
    // wrong about who was hurt (`HIST-TEX-024`); carrying battle news by rider is the next thing this wants.
    const eventId = record(world, 'milestone', {
      visibility: 'public', importance: 3, classification: 'DOCUMENTED', claimId: 'HIST-TEX-020',
      text: 'Word has come of a fight at Mission Concepción on the morning of the 28th. About ninety men under Bowie and Fannin, surrounded in the fog, beat back the Mexican cavalry and infantry and took a cannon. Richard Andrews of Mina was killed. How many of the Mexican soldiers fell, the reports do not agree: sixteen dead were counted on the field, and others say fifty, sixty-seven, or more.',
    });
    sendWord(world, 'concepcion-fight', { truth: world.events.find(e => e.id === eventId).text, claimId: 'HIST-TEX-020' });
    fightConcepcion(world, eventId);
    spotlight(world, { key: 'concepcion', text: 'The fight at Mission Concepción. Ninety men under Bowie and Fannin, surrounded in the fog, beat back the Mexican attack and take a cannon.', siteId: 'bexar', claimId: 'HIST-TEX-020' });
  });
  advanceSiege(world, movement);
}

/** How long, at least, a question the army asks stays open once asked, whatever hour the tick that asked it fell on. */
const QUESTION_MINUTES = 360;
/**
 * The siege and the Grass Fight, November 2 to December 4 (docs/COLONIES.md §6k, decided by the owner in §7b).
 *
 * A question's close is dated, but never sooner than six hours after it was asked: at half a day a tick the ask could land
 * on the tick the close is due. And while a family somebody plays has a question in front of it, the calendar slows to the
 * hour (sim/clock.mjs's `news` scale) so a student has real minutes to answer it.
 */
function advanceSiege(world, movement) {
  if (!world.director.milestones.concepcion) return;
  const { beginTravel } = movement || {};
  const due = (key, opened) => world.minute >= Math.max(momentOf(world, key), (opened ?? -Infinity) + QUESTION_MINUTES);
  const said = (claimId, text) => record(world, 'milestone', { visibility: 'public', importance: 3, classification: 'DOCUMENTED', claimId, text });
  once(world, 'siege', () => {
    said('HIST-TEX-026', 'Both councils of war before Béxar have voted not to storm the town. Bowie\'s division has come up from the missions, and the army is camped about a mile above Béxar.');
    moveCamp(world, 'above');
  });
  if (!world.director.milestones.siege) return;
  once(world, 'clothing', () => {
    said('HIST-TEX-027', 'More than a hundred and fifty men have gone home from the camp before Béxar for winter clothing, all promising to return. There is no medicine in the camp.');
    goForClothing(world, { beginTravel });
  });
  if (beginTravel) returnFromClothing(world, { beginTravel });
  // ceiling: the army is one body. From about the 8th to the 15th Burleson's division held the mill while Austin's
  // headquarters was at Concepción; here the whole army goes down to Concepción and comes back up.
  once(world, 'to-concepcion', () => {
    said('HIST-TEX-026', 'Austin has moved his headquarters back down the river to Mission Concepción, while Burleson holds the mill above the town.');
    moveCamp(world, 'concepcion');
  });
  once(world, 'united', () => {
    said('HIST-TEX-026', 'The army has been united at the old mill above Béxar, after the upper division said whole companies would go home otherwise.');
    moveCamp(world, 'mill');
  });
  once(world, 'storm-order', () => openQuestion(world, 'storm', said('HIST-TEX-028', 'Austin has ordered the army to storm Béxar at dawn tomorrow.'), { beginTravel }));
  if (due('countermand', world.army?.questions?.storm?.openedMinute)) {
    once(world, 'countermand', () => countermandStorm(world, said('HIST-TEX-028', 'Not more than a hundred men could be found to storm Béxar, and Austin has countermanded the order. A battery is being built within three hundred yards of the walls, and the army is out of flour.')));
  }
  once(world, 'pledge', () => openQuestion(world, 'pledge', said('HIST-TEX-028', 'The army before Béxar is paraded, to see who will stay as a permanent force under a commander they elect themselves.'), { beginTravel }));
  if (due('austin-leaves', world.army?.questions?.pledge?.openedMinute)) {
    once(world, 'austin-leaves', () => {
      closeQuestion(world, 'pledge', { beginTravel });
      said('HIST-TEX-028', 'Four hundred and five men pledged to stay before Béxar, and elected Edward Burleson to command them. Stephen F. Austin has left the army for San Felipe.');
    });
  }
  // The rumour first (owner, §7b): the camp took the pack train for the garrison's silver.
  once(world, 'grass-alarm', () => {
    const text = 'In the camp before Béxar the word is that a Mexican pack train is coming in from the west, carrying silver to pay the garrison.';
    sendWord(world, 'silver-train', { truth: 'A Mexican pack train was coming in to Béxar from the west, carrying grass cut for the garrison\'s horses.', text, status: 'rumor', claimId: 'HIST-TEX-031', source: 'Talk from the camp' });
    openQuestion(world, 'grass', said('HIST-TEX-031', text), { beginTravel });
  });
  if (due('grass-fight', world.army?.questions?.grass?.openedMinute)) {
    // Nothing public on the day: the first word of it is a rider's, five days later (`HIST-TEX-034`).
    once(world, 'grass-fight', () => { fightGrass(world, null, { beginTravel }); spotlight(world, { key: 'grass-fight', text: 'The Grass Fight. Riders go out after a Mexican pack train and find it carries grass for the horses, not silver.', siteId: 'bexar', claimId: 'HIST-TEX-032' }); });
  }
  const GRASS_FIGHT = 'Fuller word of the fight near Béxar on November 26: Bowie\'s horsemen and Jack\'s infantry caught a Mexican pack train west of the town, near the Alazán, and drove back into Béxar the troops sent out to meet them. The packs held grass cut for the horses, not silver. No man of ours was killed, and a few were slightly hurt. How many Mexican soldiers fell, the reports do not agree: three, fifteen, about fifty, or sixty.';
  once(world, 'grass-rumour', () => {
    const text = 'Men just back from the army say there has been a fight near Béxar: three hundred of ours against as many of theirs, ten of the enemy dead on the ground, and no loss on our side.';
    said('HIST-TEX-034', text);
    sendWord(world, 'grass-fight', { truth: GRASS_FIGHT, text, status: 'rumor', claimId: 'HIST-TEX-034', source: 'Men back from the army' });
  });
  // ceiling: word rides into the whole country on one day, five days after the fight, as it reached San Felipe; a
  // settlement nearer or farther hears it on the same day.
  once(world, 'grass-news', () => {
    const eventId = said('HIST-TEX-031', GRASS_FIGHT);
    sendWord(world, 'grass-fight', { truth: GRASS_FIGHT, claimId: 'HIST-TEX-031' });
    // The silver was a rumour, and now the country knows it.
    sendWord(world, 'silver-train', { truth: GRASS_FIGHT, text: 'The pack train carried grass for the horses in Béxar, not silver.', status: 'contradicted', claimId: 'HIST-TEX-031' });
    tellGrassFight(world, eventId);
  });
  advanceStorming(world, movement, { due, said });
  if (!world.director.complete) world.director.phase = questionOpen(world) ? 'news' : 'campaign';
}

/**
 * The storming of Béxar, December 4 to 15 (docs/COLONIES.md §6l, decided by the owner in §7c). The same shape as the siege:
 * dated milestones for the Host's page, questions on the volunteer's own card with a six-hour floor, and the word by rider -
 * wrong first, then the victory with each family's own person's part.
 */
function advanceStorming(world, movement, { due, said }) {
  const { beginTravel } = movement || {};
  once(world, 'winter-quarters', () => openQuestion(world, 'winter', said('HIST-TEX-036', 'The army before Béxar has been ordered into winter quarters, and men are setting off for home in squads.'), { beginTravel }));
  if (due('milam', world.army?.questions?.winter?.openedMinute)) {
    once(world, 'milam', () => {
      closeQuestion(world, 'winter', { beginTravel });
      const eventId = said('HIST-TEX-036', 'A Mexican officer has deserted into the camp and says the garrison is weak. Ben Milam is calling for men to go into San Antonio with him before dawn.');
      openQuestion(world, 'milam', eventId, { beginTravel });
    });
  }
  // Milam's call shuts at the roll, two in the morning, so a yes is a man at the mill when the divisions walk out at three
  // (docs/battle-research/staging.md §3.6 fix 2, `FIC-GONZ-428`); it used to stay open until five, when they were in the streets.
  if (due('bexar-roll', world.army?.questions?.milam?.openedMinute)) once(world, 'bexar-roll', () => closeQuestion(world, 'milam', { beginTravel }));
  if (due('assault', world.army?.questions?.milam?.openedMinute)) {
    once(world, 'assault', () => {
      closeQuestion(world, 'milam');
      said('HIST-TEX-037', 'Before dawn Neill\'s gun fired on the Alamo, and two divisions under Milam and Johnson went into San Antonio and took the de la Garza and Veramendi houses on Soledad Street. Burleson holds the camp.');
    });
  }
  once(world, 'milam-killed', () => said('HIST-TEX-039', 'Ben Milam has been shot dead in the yard of the Veramendi house. Johnson commands in the town. The fighting goes on house by house.'));
  once(world, 'reinforce', () => openQuestion(world, 'reinforce', said('HIST-TEX-037', 'Burleson is sending companies from the camp into the town.'), { beginTravel }));
  if (due('ugartechea', world.army?.questions?.reinforce?.openedMinute)) {
    once(world, 'ugartechea', () => { closeQuestion(world, 'reinforce'); said('HIST-TEX-040', 'Ugartechea has reached Cos in Béxar with about six hundred men, most of them raw conscripts.'); });
  }
  // The express of December 6 reached San Felipe late on the 8th, and it was wrong: the attack "on the 6th", the town taken.
  once(world, 'bexar-express', () => sendWord(world, 'bexar-storming', { truth: BEXAR_VICTORY, text: 'An express from the army says the volunteers went into Béxar about daylight on the 6th and have possessed themselves of the town, silencing the big guns, with two killed and a few wounded. Ugartechea is expected with six hundred men.', status: 'rumor', claimId: 'HIST-TEX-044', source: 'An express from the army' }));
  // The flag comes whether or not the camp's companies were ever asked for (staging.md §3.6 fix 4): it used to wait on the
  // `ugartechea` moment, whose own close waited on the reinforce question having opened.
  once(world, 'white-flag', () => fightStorming(world, said('HIST-TEX-040', 'At dawn a white flag came out to the Main Plaza. Cos has drawn his men into the Alamo, and some of his cavalry have ridden away.')));
  // The storming on the engine (sim/bexar-fight.mjs): the men walking into the town, their fates at their moments, the
  // alerts, the Host's spotlight and the account at the capitulation.
  advanceBexarFight(world, momentOf(world, BEXAR_STORMING.startKey), { moments: { capitulation: momentOf(world, 'capitulation') }, remember });
  once(world, 'terms', () => said('HIST-TEX-041', 'In the small hours the commissioners agreed the terms of Cos\'s surrender.'));
  once(world, 'capitulation', () => said('HIST-TEX-041', 'The capitulation is signed. Cos and his officers are to go into the interior on their word not to oppose the Constitution of 1824; his men keep their muskets and ten rounds; the convicts are to be taken beyond the Rio Grande; any soldier may stay; the people of Béxar and their property are protected.'));
  once(world, 'wound-deaths', () => dieOfWounds(world));
  once(world, 'cos-marches', () => {
    said('HIST-TEX-045', 'Cos has marched out of Béxar for Mission San José and the Rio Grande. Burleson has written that the rest of the army will retire to their homes; the wounded stay in the town under the surgeons.');
    if (beginTravel) disbandArmy(world, { beginTravel });
  });
  once(world, 'bexar-victory', () => {
    const eventId = said('HIST-TEX-044', BEXAR_VICTORY);
    sendWord(world, 'bexar-storming', { truth: BEXAR_VICTORY, claimId: 'HIST-TEX-044' });
    tellStorming(world, eventId);
  });
  once(world, 'bexar-end', () => {
    expireCalls(world);
    world.director.complete = true; world.director.phase = 'preserved'; world.status = 'ended';
    record(world, 'slice-preserved', {
      visibility: 'public', classification: 'DOCUMENTED', claimId: 'HIST-TEX-045',
      text: 'Béxar has fallen to the volunteers, Cos is on the road to the Rio Grande, and the men are riding home. This slice stops here: families, absences, wounds, property, promises and memories are saved for the next arc.',
    });
  });
}

/**
 * The second period (sim/periods.mjs): the winter of 1835-36. It is played only once the Host has continued the class, and
 * everything before it was settled in the first period, so none of the 1835 milestones fire again.
 */
function advanceWinter(world, movement = {}) {
  const said = (claimId, text) => record(world, 'milestone', { visibility: 'public', importance: 3, classification: 'DOCUMENTED', claimId, text });
  once(world, 'winter-news', () => {
    world.director.phase = 'campaign';
    said('HIST-TEX-047', 'Most of the men who took Béxar are home. Burleson has gone home too, and the volunteers left in Béxar are mostly newcomers from the United States.');
    sendWord(world, 'winter-terms', { truth: WINTER_TERMS, claimId: 'HIST-TEX-048', source: 'A printed call from General Houston' });
    sendWord(world, 'winter-bexar', { truth: WINTER_BEXAR, claimId: 'HIST-TEX-049', source: 'Word from the west' });
    sendWord(world, 'winter-council', { truth: WINTER_COUNCIL, claimId: 'HIST-TEX-050', source: 'Word from San Felipe' });
  });
  once(world, 'election-opens', () => {
    world.director.phase = 'news';
    said('HIST-TEX-052', 'Tomorrow, February 1, each settlement elects its delegates to the convention called for March 1 at Washington-on-the-Brazos. The polls are in town.');
  });
  once(world, 'election-close', () => {
    world.director.phase = 'campaign';
    said('HIST-TEX-052', 'The polls have closed. The delegates are chosen, and the convention meets at Washington on March 1. Gonzales has sent Mathew Caldwell and John Fisher.');
  });
  once(world, 'travis-news', () => sendWord(world, 'winter-travis', { truth: 'William Barret Travis has come to Béxar with about thirty horsemen, and Bowie means to hold the place.', claimId: 'HIST-TEX-051', source: 'Word from Béxar' }));
  once(world, 'crockett-news', () => sendWord(world, 'winter-crockett', { truth: 'David Crockett of Tennessee has reached Béxar with a few volunteers. Colonel Neill has gone home to his sick family, and Travis and Bowie command together.', claimId: 'HIST-TEX-051', source: 'Word from Béxar' }));
  once(world, 'santa-anna-rumour', () => { sendWord(world, 'winter-santa-anna', { truth: 'It is said Santa Anna himself has crossed the Rio Grande with a great army, through snow, and is marching on Béxar.', status: 'rumor', claimId: 'HIST-TEX-053', source: 'A rumour from the west' }); warnGarrison(world); });
  advanceAlamo(world, said, movement);
}

/**
 * The Alamo, San Patricio and Agua Dulce (sim/alamo.mjs, docs/COLONIES.md §7f): the second period's last three weeks.
 */
function advanceAlamo(world, said, { beginTravel } = {}) {
  const alamo = { beginTravel: beginTravel || (() => {}) };
  once(world, 'alamo-siege', () => beginSiege(world, said('HIST-TEX-054', 'The Mexican army has come into Béxar. The garrison has gone into the Alamo, and a red flag flies from the church of San Fernando.')));
  COURIER_DAYS.forEach(day => {
    once(world, `${day}-opens`, () => { if (askCouriers(world, day)) world.director.phase = 'news'; });
    once(world, day, () => { sendCouriers(world, day, alamo); world.director.phase = 'campaign'; });
  });
  once(world, 'travis-gonzales', () => word(world, 'alamo-siege', gonzalesFamilies(world), { truth: ALAMO_WORD.siege, claimId: 'HIST-TEX-055', source: 'Travis\'s letter, brought to Gonzales by Albert Martin' }));
  once(world, 'travis-colonies', () => word(world, 'alamo-siege', otherFamilies(world), { truth: ALAMO_WORD.siege, claimId: 'HIST-TEX-055', source: 'Travis\'s letter, carried on from Gonzales' }));
  // The south (sim/south.mjs): the men walk on to San Patricio, Grant rides for horses, and each fight is fought on the engine
  // by whoever of the families is there. `fightSouth` still settles anybody the engine did not (a class whose map has no south).
  advanceSouth(world, alamo);
  once(world, 'grant-rides', () => grantRides(world, alamo));
  once(world, 'san-patricio', () => { splitSouth(world); fightSouth(world, 'san-patricio', alamo); });
  once(world, 'relief-leaves', () => reliefRides(world, alamo));
  once(world, 'fannin-back', () => word(world, 'fannin-back', Object.values(world.households), { truth: ALAMO_WORD.fannin, claimId: 'HIST-TEX-056', source: 'Word from Goliad' }));
  once(world, 'relief-enters', () => reliefEnters(world));
  once(world, 'agua-dulce', () => fightSouth(world, 'agua-dulce', alamo));
  once(world, 'san-patricio-news', () => { word(world, 'san-patricio', Object.values(world.households), { truth: ALAMO_WORD.sanPatricio, status: 'rumor', claimId: 'HIST-TEX-059', source: 'A rumour from the south' }); tellSouth(world, 'san-patricio'); tellSouthAccount(world, 'san-patricio'); });
  once(world, 'declaration-news', () => word(world, 'declaration', Object.values(world.households), { truth: ALAMO_WORD.declaration, claimId: 'HIST-TEX-061', source: 'Word from Washington' }));
  // The storming is fought on the engine now (sim/alamo-battle.mjs, docs/BATTLES.md §9): each fate at its own moment inside
  // it, and the Host's camera on the compound at the alarm. Only the record of the morning is kept here.
  once(world, 'alamo-assault', () => record(world, 'milestone', { visibility: 'sealed', importance: 3, classification: 'DOCUMENTED', claimId: 'HIST-TEX-058', text: 'The Alamo was stormed at dawn.' }));
  once(world, 'agua-dulce-news', () => { word(world, 'agua-dulce', Object.values(world.households), { truth: ALAMO_WORD.aguaDulce, status: 'rumor', claimId: 'HIST-TEX-059', source: 'A rumour from the south' }); tellSouth(world, 'agua-dulce'); tellSouthAccount(world, 'agua-dulce'); });
  once(world, 'survivors-leave', () => survivorsLeave(world, alamo));
  once(world, 'fall-rumour', () => word(world, 'alamo-fall', gonzalesFamilies(world), { truth: ALAMO_WORD.fall, text: ALAMO_WORD.fallRumour, status: 'rumor', claimId: 'HIST-TEX-060', source: 'Two riders from Béxar, at Gonzales' }));
  once(world, 'fall-confirmed', () => { word(world, 'alamo-fall', gonzalesFamilies(world), { truth: ALAMO_WORD.fall, claimId: 'HIST-TEX-060', source: 'Mrs. Dickinson, come in to Gonzales' }); tellFall(world, gonzalesFamilies(world)); });
  once(world, 'fall-colonies', () => { word(world, 'alamo-fall', otherFamilies(world), { truth: ALAMO_WORD.fall, status: 'unconfirmed', claimId: 'HIST-TEX-060', source: 'A rider from Gonzales' }); tellFall(world, otherFamilies(world)); });
  // The siege and the assault on the engine, every tick: posts, the relief riding in, the fates, the cards, the Host.
  advanceAlamoBattle(world, { momentOf, beginTravel: alamo.beginTravel });
  once(world, 'alamo-end', () => {
    world.director.complete = true; world.director.phase = 'preserved'; world.status = 'ended';
    record(world, 'slice-preserved', {
      visibility: 'public', classification: 'DOCUMENTED', claimId: 'HIST-TEX-060',
      text: 'It is the night of March 13, 1836. General Houston has burned Gonzales and is falling back to the Colorado, and the families are leaving with him. This class stops here; Goliad, the flight and San Jacinto are still to come.',
    });
  });
}

/**
 * The third period (sim/scrape.mjs, sim/houston.mjs): the families told to leave settlement by settlement, the armies
 * passing, Houston's camps, Goliad, San Jacinto and the word of each.
 */
function advanceScrape(world, { beginTravel } = {}) {
  const said = (claimId, text) => record(world, 'milestone', { visibility: 'public', importance: 3, classification: 'DOCUMENTED', claimId, text });
  const go = { beginTravel: beginTravel || (() => {}) };
  const everyone = Object.values(world.households);
  // Each settlement's families, on its day.
  for (const household of everyone) {
    const days = SETTLEMENT_DAYS[household.settlementId || 'gonzales'];
    if (days && world.minute >= days.order && !household.flight) orderOut(world, household, null);
  }
  advanceArmiesPassing(world);
  if (!world.director.milestones['san-jacinto']) catchUpCamp(world, go);
  // San Jacinto on the engine: who is in the camp and the line, the alert, the guns heard, the Host's camera (sim/san-jacinto.mjs).
  advanceSanJacinto(world);
  once(world, 'houston-colorado', () => { word(world, 'houston-colorado', everyone, { truth: HOUSTON_WORD.colorado, claimId: 'HIST-TEX-066', source: 'Word from the army' }); followCamp(world, go); });
  once(world, 'coleto', () => { fightColeto(world, said('HIST-TEX-063', 'Fannin marched out of Goliad this morning and was caught on the open prairie by Urrea\'s cavalry near Coleto Creek.')); spotlight(world, { key: 'coleto', text: 'Fannin\'s command, caught on the open prairie near Coleto Creek, fights through the day and surrenders the next morning.', siteId: 'goliad', claimId: 'HIST-TEX-063' }); });
  once(world, 'goliad-surrender', () => said('HIST-TEX-063', 'Fannin has surrendered his whole command to Urrea.'));
  // With the word of Fannin's defeat the army asks every man with Houston whether he leaves for his family (sim/camp.mjs).
  once(world, 'goliad-word', () => { word(world, 'goliad-defeat', everyone, { truth: HOUSTON_WORD.goliadDefeat, claimId: 'HIST-TEX-063', source: 'Word from the army' }); openCampQuestion(world, 'leave', null, go); });
  once(world, 'goliad-leave-close', () => closeCampQuestion(world, 'leave', go));
  once(world, 'goliad-massacre', () => { goliadMassacre(world); spotlight(world, { key: 'goliad-massacre', text: 'Fannin\'s men, prisoners at Goliad, are marched out and shot. A few escape. No family knows yet.', siteId: 'goliad', claimId: 'HIST-TEX-064' }); });
  once(world, 'houston-san-felipe', () => { takeInEnlisted(world); followCamp(world, go); word(world, 'houston-san-felipe', everyone, { truth: HOUSTON_WORD.sanFelipe, claimId: 'HIST-TEX-066', source: 'Word from the army' }); });
  // Up the west bank to Groce's, the evening of the 30th (`HIST-TEX-086`): the men with the army march with it.
  once(world, 'houston-groces', () => followCamp(world, go));
  once(world, 'massacre-word', () => { word(world, 'goliad-massacre', everyone, { truth: HOUSTON_WORD.massacre, status: 'unconfirmed', claimId: 'HIST-TEX-064', source: 'Word from the west' }); tellGoliad(world, go); });
  once(world, 'santa-anna-brazos', () => word(world, 'santa-anna-brazos', everyone, { truth: HOUSTON_WORD.santaAnnaBrazos, claimId: 'HIST-TEX-067', source: 'Word from the Brazos' }));
  // Over the Brazos on the Yellow Stone, April 12-13 (`HIST-TEX-089`): said in the story, and the men with the army cross to
  // Bernardo by Groce's ferry. A class whose map has no Bernardo keeps the army at Groce's (sim/houston.mjs `houstonCamp`).
  once(world, 'houston-brazos', () => { said('HIST-TEX-089', HOUSTON_WORD.brazos); followCamp(world, go); });
  // East from Groce's, a night at each house on the road to Harrisburg (`HIST-TEX-088`). A class whose map has not got them
  // keeps the army at Bernardo (sim/houston.mjs `houstonCamp`), and nothing moves.
  once(world, 'houston-donohos', () => { said('HIST-TEX-088', HOUSTON_WORD.marchEast); followCamp(world, go); });
  once(world, 'houston-mccarleys', () => followCamp(world, go));
  once(world, 'houston-roberts', () => followCamp(world, go));
  once(world, 'houston-burnetts', () => followCamp(world, go));
  // The fork of the road at Roberts', beyond Spring Creek, April 16 (`HIST-TEX-082`, `HIST-TEX-088`): the men shout which road;
  // the army goes right whatever is said.
  once(world, 'which-road', () => { openCampQuestion(world, 'road', said('HIST-TEX-082', 'The army has come to a fork of the road at Roberts\', beyond Spring Creek: the left-hand road goes to the Trinity and Nacogdoches, the right to Harrisburg and the enemy. The men are shouting for the right.'), go); });
  once(world, 'which-road-close', () => closeCampQuestion(world, 'road', go));
  once(world, 'houston-harrisburg', () => followCamp(world, go));
  once(world, 'houston-lynchburg', () => followCamp(world, go));
  // The men in the line are rolled at the first volley, and each one hit goes down at his own minute of the charge
  // (sim/san-jacinto.mjs `strikeSanJacinto`); the Host's camera on the field itself, not the town (docs/BATTLES.md §2.1).
  once(world, 'san-jacinto', () => { strikeSanJacinto(world, record(world, 'milestone', { visibility: 'sealed', importance: 3, classification: 'DOCUMENTED', claimId: 'HIST-TEX-067', text: 'The battle of San Jacinto.' })); spotlight(world, { key: 'san-jacinto', text: 'Houston\'s army crosses the prairie at San Jacinto and breaks Santa Anna\'s camp in eighteen minutes.', ...(sanJacintoField(world) || { siteId: 'lynchburg' }), claimId: 'HIST-TEX-067' }); });
  once(world, 'santa-anna-taken', () => { said('HIST-TEX-067', 'Santa Anna has been found hiding in the grass and brought in a prisoner.'); spotlight(world, { key: 'santa-anna-taken', text: 'Santa Anna is found hiding in the grass and brought in a prisoner to Houston\'s camp.', ...(sanJacintoField(world) || { siteId: 'lynchburg' }), claimId: 'HIST-TEX-067' }); });
  once(world, 'victory-word', () => { const cause = said('HIST-TEX-067', HOUSTON_WORD.victory); word(world, 'san-jacinto', everyone, { truth: HOUSTON_WORD.victory, claimId: 'HIST-TEX-067', source: 'A rider from the army' }); tellSanJacintoAccounts(world, cause); tellSanJacinto(world, go); turnHome(world, cause); });
  if (world.minute >= momentOf(world, 'san-jacinto') && !world.director.milestones['san-jacinto']) return;
  once(world, 'scrape-end', () => {
    world.director.complete = true; world.director.phase = 'preserved'; world.status = 'ended';
    record(world, 'slice-preserved', {
      visibility: 'public', classification: 'DOCUMENTED', claimId: 'HIST-TEX-067',
      // How the class's war ended, said once more as it closes (docs/BATTLES.md §8.5): the battle, the capture and the order to
      // fall back (`HIST-TEX-067`, `-526`). The ending's own reckoning follows it, unchanged (sim/ending.mjs).
      text: 'April 25, 1836. The war is won: at San Jacinto on April 21 Houston\'s army destroyed Santa Anna\'s in eighteen minutes, Santa Anna was taken the next day, and as a prisoner he ordered his troops to fall back. The families are on the road home to what is left. Here the story ends.',
    });
  });
}

/** The winter's first news (sim/winter.mjs): what a man could sign up for, the garrison and the expedition, and the government. */
const WINTER_TERMS = 'General Houston calls for volunteers. A man who enlists in the regular army for two years or the war is promised $24 and 800 acres of land; an auxiliary volunteer, 640 acres for the war or 320 for a year. Men enlist at San Felipe.';
const WINTER_BEXAR = 'Colonel Neill holds Béxar with fewer than a hundred men, without money, horses or clothing, since Johnson and Grant took most of the men and supplies south for an attack on Matamoros. Bowie has come to Béxar with thirty men. General Houston met the Matamoros volunteers at Refugio and talked most of them out of it; Johnson and Grant have gone on with the rest to San Patricio, on the Nueces.';
const WINTER_COUNCIL = 'The government at San Felipe has fallen out with itself: the council has put out Governor Smith over the Matamoros business, and Smith will not go.';

/** The fuller word of the storming, as the government heard it on December 15 (`HIST-TEX-038` to `-044`), in the owner's wording (§7c). */
const BEXAR_VICTORY = 'Word has come that Béxar has fallen. For four days the volunteers fought through the town house by house, cutting through walls and digging trenches across the streets, while the families of Béxar lay shut in their houses; a woman of the town was shot carrying water to them. Ben Milam was killed on the 7th and Johnson took command. On the 9th Cos sent out a white flag from the Alamo, and by the capitulation dated the 11th he and his officers go into the interior on their word not to oppose the Constitution of 1824, his men keeping their muskets. Between four and six of ours were killed and about two dozen wounded. How many Mexican soldiers were killed and wounded the reports do not agree: about a hundred and fifty, or about three hundred.';
export function advanceDirectors(world, movement) {
  if (!world.director || world.director.complete) return;
  // The second period has its own moments; the first period's were all settled before the winter (sim/periods.mjs).
  if (world.period === 2) { advanceWinter(world, movement); return; }
  if (world.period === 3) { advanceScrape(world, movement); return; }
  once(world, 'notice', () => {
    establishTruth(world, { id: 'cannon-request', text: 'A Mexican detachment has reached the Guadalupe opposite Gonzales to reclaim the cannon. Local settlers have refused to return it.', siteId: 'gonzales', classification: 'DOCUMENTED', claimId: 'HIST-GONZ-002' });
    world.director.phase = 'news';
  });
  if (world.truth['cannon-request']) {
    for (const household of Object.values(world.households)) {
      if (witnessing(world, household.id)) learn(world, household.id, 'cannon-request', { source: 'Local observation' });
      // Word leaves Gonzales for every family at once, so the road is the only thing that
      // decides when each one hears. It used to leave forty minutes apart in household
      // order, and the first household was simply told on the spot by a neighbour who did
      // not exist - which put a family twenty-seven miles out ahead of one five miles out,
      // and a family four miles out seven hours behind one five miles out, for no reason
      // anybody could see on the map.
      if (!world.director.dispatches[household.id] && !distant(household)) {
        movement.dispatchReport(world, 'cannon-request', household.id);
        world.director.dispatches[household.id] = true;
      }
    }
  }
  // The letters for the other settlements, when they were written (sim/expresses.mjs).
  for (const topicId of ['cannon-request', 'gonzales-outcome']) {
    if (world.truth[topicId] && world.minute >= expressLeaves(world, topicId, ARRIVAL_MINUTES)) startExpress(world, topicId, movement);
  }
  once(world, 'publicNotice', () => learn(world, 'public', 'cannon-request', { source: 'Public report (reconstructed timing)' }));
  // The men gathering at the ferry at dusk on the 1st, asking who goes with them (`HIST-TEX-470`; the call is `FIC-GONZ-011`).
  once(world, 'upriver-call', () => establishTruth(world, { id: UPRIVER_CALL, text: 'The men at Gonzales are gathering at the ferry to cross the Guadalupe tonight, with the cannon, and go up the river after the Mexican camp.', siteId: 'gonzales', classification: 'DOCUMENTED', claimId: 'HIST-TEX-470' }));
  once(world, 'crossing', () => establishTruth(world, { id: CROSSING, text: 'The Texian force crossed the Guadalupe in the night and went upriver after the Mexican camp.', siteId: 'gonzales', classification: 'DOCUMENTED', claimId: 'HIST-GONZ-003' }));
  for (const topic of [UPRIVER_CALL, CROSSING]) {
    if (!world.truth[topic] || world.minute >= momentOf(world, 'approach')) continue;
    for (const household of Object.values(world.households)) {
      if (witnessing(world, household.id)) learn(world, household.id, topic, { source: 'Told in Gonzales' });
    }
  }
  offerRequests(world); offerMarch(world);
  // A family far from Gonzales is asked its own settlement's call instead (sim/calls.mjs).
  offerCalls(world);
  once(world, 'gathering', () => setBattlePhase(world, 'gathering'));
  once(world, 'approach', () => {
    // Silence is an answer, and it used to be the only one this game did not write down.
    // A family that let the neighbour go unanswered has a story, and VISION.md §20 builds
    // the epilogue out of exactly these. The hunt already says "Nobody answered"; this is
    // the same rule arriving at the decision that matters more.
    for (const [householdId, request] of Object.entries(world.requests)) {
      if (request.status !== 'open') continue;
      request.status = 'expired';
      record(world, 'consequence', {
        householdId, importance: 2, causes: [request.id],
        text: request.where === 'town'
          ? 'Nobody answered the people gathering food in Gonzales. It went on without this family.'
          : 'Nobody answered the neighbour at the door. The food went on to Gonzales without this family.',
      });
    }
    // A rumor nobody went after. The family never learned more than it was told, and its
    // record says so rather than saying nothing.
    for (const [householdId, rumor] of Object.entries(world.rumors || {})) {
      if (rumor.status !== 'open') continue;
      rumor.status = 'expired';
      record(world, 'consequence', {
        householdId, actorId: rumor.actorId, importance: 2, causes: [rumor.id], claimId: 'FIC-GONZ-020',
        // Says nothing about what happened at Gonzales: a family that never went does not
        // know, and a consequence line is still a thing the family reads.
        text: 'Nobody from this family went to Gonzales to find out whether the rumor was true.',
      });
    }
    // An unanswered call is not a refusal. It closed because the force left without them.
    for (const [householdId, march] of Object.entries(world.marches || {})) {
      if (march.status !== 'open') continue;
      march.status = 'expired';
      const waiting = world.entities[march.actorId];
      record(world, 'consequence', {
        householdId, actorId: march.actorId, importance: 2, causes: [march.id],
        text: `Nobody answered, and the men crossed the river without ${waiting?.name || 'them'}.`,
      });
    }
    setBattlePhase(world, 'approach');
  });
  // The Host's camera on the field itself, not the town seven miles off (docs/BATTLES.md §2.1).
  once(world, 'exchange', () => { setBattlePhase(world, 'exchange'); spotlight(world, { key: 'gonzales', text: 'On Williams’s land above Gonzales, the Texians fire the cannon and advance, and the Mexican dragoons wheel and ride away toward Béxar. The war has begun.', ...fieldCentre(world), claimId: 'HIST-GONZ-004' }); });
  // Whether somebody was actually standing there when it happened is decided here, while
  // it is happening - not afterwards from where they finally ended up. Answering the call
  // late and arriving after the shooting is a different story from being there for it.
  if (['approach', 'exchange', 'withdrawal'].includes(world.director.battle.phase)) {
    for (const [householdId, march] of Object.entries(world.marches || {})) {
      if (march.status === 'accepted' && !march.witnessed && atCamp(world, householdId)) march.witnessed = world.minute;
    }
  }
  once(world, 'withdrawal', () => setBattlePhase(world, 'withdrawal'));
  once(world, 'resolved', () => {
    setBattlePhase(world, 'resolved');
    const truth = establishTruth(world, { id: 'gonzales-outcome', text: HISTORICAL_OUTCOME, siteId: CAMP_SITE, classification: 'DOCUMENTED', claimId: 'HIST-GONZ-004', causes: [world.director.lastBattleEventId] });
    for (const household of Object.values(world.households)) {
      if (witnessing(world, household.id)) learn(world, household.id, truth.id, { source: 'Local observation' });
      else if (!distant(household)) movement.dispatchReport(world, truth.id, household.id);
    }
  });
  settleHelp(world); settleCalls(world); moveFormations(world); standWithTheForce(world);
  // The fight on the engine (sim/battle-stage.mjs, sim/battles/gonzales.mjs): the alert, the gun heard in town, the Host's
  // camera, and the walk home with the account.
  advanceGonzalesFight(world, movement);
  once(world, 'publicOutcome', () => learn(world, 'public', 'gonzales-outcome', { source: 'Public report (reconstructed timing)' }));
  // Build step 5: on the real land the class does not stop when the fight is over. The volunteers
  // keep coming in, the army is made and it marches, and that is what ends it instead.
  if (world.map.source) return advanceGathering(world, movement);
  // On the real map the class waits, a few days at most, until the furthest family has heard how it ended.
  const waiting = distantHouseholds(world).some(household => !world.knowledge.households[household.id]?.['gonzales-outcome']);
  if (waiting && world.minute < momentOf(world, 'finish') + EXPRESS_GRACE_MINUTES) return;
  once(world, 'finish', () => {
    expireCalls(world);
    world.director.complete = true; world.director.phase = 'preserved'; world.status = 'ended';
    record(world, 'slice-preserved', { visibility: 'public', text: 'The Gonzales prototype stops here. Families, absences, property, and memories are saved for the next arc. The Revolution continues beyond this slice.' });
  });
}
export function directorProjection(world, householdId, role, { seen = [] } = {}) {
  if (!world.director) return {};
  let battle = null;
  let host = { focus: 'regional', caption: 'The Host shows public reports; households may know different things.' };
  // Who watches the fight live (docs/BATTLES.md §2.1, `FIC-GONZ-447`): the Host always, framed on the field; a family only
  // while one of its own people is with the men there. Being in Gonzales seven miles off shows nothing - the gun may be
  // heard (`FIC-GONZ-417`), and that is a line in the journal, not the fight. Nobody else is sent any of it: not the
  // phase, not a count, not whose people are there. A family's own people are named in `members` for that family alone.
  const state = world.battles?.gonzales ? battleState(world, 'gonzales') : null;
  if (state?.live) {
    const legacyPhase = world.director.battle.phase;
    if (role === 'host') {
      battle = { ...projectBattle(world, 'gonzales', { members: formationMembers(world).map(person => person.id), legacyPhase }), reconstruction: false };
      // The Host's camera follows the fighting itself, from first light until the dragoons are gone; before and after it
      // the fight is still drawn where it is, and the teacher's frame is their own.
      const fightingNow = world.minute >= momentOf(world, 'approach') && world.minute < momentOf(world, 'resolved');
      host = { focus: fightingNow ? 'battle' : 'regional', caption: 'The fight at Gonzales, live. Families with somebody there see it too; the rest have not heard yet.', ...fieldCentre(world) };
    } else if (role === 'student' && householdId) {
      // Everybody of the families in the force, since standing there this family already sees them (sim/world.mjs
      // `observedBy`): drawn doing what the force does, rather than idling among men who are firing.
      if (ownAtField(world, householdId).length) battle = { ...projectBattle(world, 'gonzales', { members: formationMembers(world).map(person => person.id), legacyPhase }), reconstruction: false };
    }
  }
  // The card through the family's person (docs/BATTLES.md §2.7, §2.8): the alert before the fighting with a Watch, and the
  // account afterwards. Only ever this family's own.
  const battleAlert = role === 'student' && householdId ? alertFor(world, householdId, state, Boolean(battle)) : null;
  const battleAccount = role === 'student' && householdId ? accountFor(world, householdId) : null;
  // The storming of Béxar (sim/bexar-fight.mjs): its own viewers, the alert before each episode and the account after, while
  // it is fought. Only ever one fight at a time: December is not October.
  const bexar = bexarProjection(world, householdId, role, { seen });
  if (bexar) { battle = bexar.battle; if (bexar.host) host = bexar.host; }
  // The south's fights (sim/south.mjs): the same contract, for San Patricio and Agua Dulce Creek (February 27, March 2).
  const south = southProjection(world, householdId, role);
  if (south?.battle && !battle) battle = south.battle;
  if (south?.host && role === 'host') host = south.host;
  // The Alamo (sim/alamo-battle.mjs): the Host always while it is fought, a family while one of its own is there. Its siege
  // runs for weeks round the south's two fights; while one of those is being fought, that fight is what is shown.
  const alamo = alamoProjection(world, householdId, role);
  if (alamo?.battle && !battle) { battle = alamo.battle; if (role === 'host' && alamo.host) host = alamo.host; }
  const shownAlert = alamo?.battleAlert || bexar?.battleAlert || battleAlert || south?.alert || null, shownAccount = alamo?.battleAccount || bexar?.battleAccount || battleAccount || south?.account || null;
  // The upriver call takes the panel while it is open, because it is the one in front
  // of the family right now. The food call stays in the event log either way.
  const march = householdId && world.marches?.[householdId];
  // A rumor's question shows until firmer word turns it into the ordinary call.
  const rumor = householdId && world.rumors?.[householdId];
  // A family far from Gonzales is only ever asked its settlement's call (sim/calls.mjs).
  const call = householdId && world.calls?.[householdId];
  const request = (march && march.status === 'open' ? march : null) || call || (householdId && world.requests[householdId]) || (rumor && rumor.status !== 'overtaken' ? rumor : null);
  const shown = request ? { id: request.id, text: request.text, status: request.status, kind: request === march ? 'march' : request === call ? 'call' : request === rumor ? 'rumor' : 'supplies' } : null;
  if (shown && shown.kind === 'march' && march.status === 'open') {
    // The stored text, not a fresh reading: the button must not quietly change its price
    // while a student is looking at it.
    shown.actorId = march.actorId;
    shown.risk = march.risk;
  }
  // Each answer with its own price, computed here and never guessed at by the client -
  // the same shape a chore's question takes, so the two read as one kind of decision.
  if (shown && shown.status === 'open') {
    // Everybody who could answer, each with their own prices - a food call is the family's to
    // give to whichever parent or grown child it chooses, and the march is put to the one
    // who carried the food. `options` stays as the principal's, or the march's person's.
    const household = world.households[householdId];
    const people = shown.kind === 'march' ? [march.actorId] : household.members.filter(id => canAnswerCalls(world.entities[id]));
    shown.answerers = Object.fromEntries(people.map(id => [id, shown.kind === 'call' ? callOptions(world, householdId, call, world.entities[id]) : requestOptions(world, householdId, shown, shown.kind, world.entities[id])]));
    shown.options = shown.answerers[shown.actorId || household.principalId] || Object.values(shown.answerers)[0] || [];
  }
  // San Jacinto (sim/san-jacinto.mjs): the same four things, for the spring's battle, from its own director.
  const jacinto = sanJacintoProjection(world, householdId, role);
  if (jacinto?.battle) battle = jacinto.battle;
  if (jacinto?.host) host = jacinto.host;
  const alertShown = jacinto?.battleAlert || shownAlert, accountShown = jacinto?.battleAccount || shownAccount;
  return structuredClone({ request: shown, battle, ...(alertShown && { battleAlert: alertShown }), ...(accountShown && { battleAccount: accountShown }), host: role === 'host' ? host : null, slice: { title: 'Gonzales', complete: world.director.complete }, historicalDate: dateOf(world, world.minute).toISOString().slice(0, 10) });
}
/** The alert card, while the fight is coming or being fought and this family's person is going or there. */
function alertFor(world, householdId, state, watching) {
  const alerted = world.battles?.gonzales?.alerted?.[householdId];
  if (!alerted || !state || state.over || ['field', 'home'].includes(state.phase?.id)) return null;
  const person = world.entities[alerted.entityId];
  if (!person || ['dead', 'captured'].includes(person.health.condition)) return null;
  return { id: `battle:gonzales:${householdId}`, entityId: person.id, title: state.live && world.minute >= momentOf(world, 'approach') ? 'The fight at Williams’s place' : 'The fight is coming', text: alerted.text, field: fieldCentre(world), watching };
}
/** The account card, for a day after the men leave the field. */
function accountFor(world, householdId) {
  const told = world.battles?.gonzales?.told?.[householdId];
  if (!told || world.minute - told.minute > 1440) return null;
  const person = world.entities[told.entityId];
  if (!person) return null;
  return { id: `account:gonzales:${householdId}`, entityId: person.id, title: `What ${person.name} saw at Williams’s place`, text: told.text };
}
