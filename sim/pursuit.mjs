// Mexican troops and a fleeing family: who can see it, the order to halt, and the chase (docs/SCRAPE.md §11-§13).
//
// Owner, 2026-09-27: "if Mexican troops get too close, they'll begin ordering the player to stop. if the player keeps trying to
// run, the soldiers open fire. bullets should be modeled, and accuracy should be era appropriate. the player should be a little
// faster than the Mexican troops, but Mexican Cavalry should be faster. Cavalry should be uncommon." Put by multiple choice the
// same day: **rare, where columns were** (only near where a column really was, on its dates, mostly on the roads it used; mud,
// rivers and sickness stay the main dangers); **historical speeds** (an ox wagon slower than marching infantry, a family on
// foot or mounted a little faster, cavalry faster than everybody); **adults and animals only** (shots with period accuracy and
// mostly missing; a hit can wound or kill a grown-up, a horse or an ox, no gore; children never hit); **a short held scene**
// ("¡Alto!", the choice to halt or run, the chase with shots and smoke, then back to the road's own time, a minute or two).
//
// The record (docs/battle-research/scrape-pursuit.md, `HIST-TEX-660` to `-668`): no source read has Mexican troops firing on
// fleeing refugees. At New Washington Almonte ordered his men to hold their fire so as not to endanger Burnet's family
// (`HIST-TEX-665`); at Fort Bend the Kuykendall families "ran for the bottom" and hid in a cane-brake. That soldiers fire on a
// family that will not halt is the owner's rule and this game's (`FIC-GONZ-665`), and the page says so nowhere as history.
//
// **Who can see a family** (`sightMiles`, `FIC-GONZ-661`): only a column on its dated road (sim/advance.mjs) and, rarer, a
// cavalry patrol riding ahead of one on the record's days (`PATROLS`, `FIC-GONZ-662`). How far off depends on what is seen (a
// wagon's white top three miles over open prairie, a man on foot one), where (half as far off the roads, a few hundred yards
// in brush, fifty in timber), the day (rain and fog two hundred yards) and the hour (fifty yards at night). A column sends men
// after a family only within `INFANTRY_PURSUE_MILES`; a patrol rides after anything it sees.
//
// **The chase** is a line: each soldier his own distance behind the family, closing at his pace and losing ground while he
// stops to load. The family goes at its train's pace, measured from how far it actually went. Within `HAIL_YARDS` the soldiers
// order it to halt ("¡Alto!") and the family is asked; **halt** and they come up and take what they take (sim/road.mjs
// `overtake`, as a column always did); **run** and after a second order they fire, each shot a roll against the researched
// table (`HIT_TABLE`) by range, shooter and target. Within `CAUGHT_YARDS` they have the family (the same outcome). They give up
// at the timber's edge, after `GIVE_UP` miles or minutes, at dusk, or when the family is plainly faster.
//
// Stored on `household.flight.chase` while it lasts and `household.flight.pursued` after (a short list): absent on every class
// saved before, which correctly reads as nobody ever chased, so no save version moves.
import { COLUMNS, ORDER_GRACE_MINUTES, clockOf, headAt, legsOf, timelineOf, on } from './advance.mjs';
import { pointAlong } from './geography.mjs';
import { weatherAt } from './weather.mjs';
import { dateOf, calendarMinutes } from './clock.mjs';
import { landAround, onRealLand } from './ground.mjs';
import { woodsRule } from './woods.mjs';
import { stirredShare } from './shares.mjs';
import { record } from './events.mjs';
import { roadTicks, WAGON_SPEED, WALK_SPEED, HORSE_SPEED } from './travel.mjs';
import { canAnswerCalls, householdName, sexOf } from './family.mjs';
import { spotlight } from './host.mjs';
import { abandonWagon, answerRoad, breakCamp, familyPoint, milesWord, moveOn, nextRefuge, overtake, roadAutoAnswer, withFamily } from './road.mjs';
import { acrossCountry } from './flight-route.mjs';
import { heldToCow, loseCow, cowPace } from './flight-work.mjs';
import { drawnVehicles } from './company.mjs';
import { recordLapse } from './lapse.mjs';
// Who is with the family and answers for it (sim/acting.mjs, 2026-09-28).
import { actingId } from './acting.mjs';

const YARDS = 1760;
const round = (value, places = 2) => Math.round(value * 10 ** places) / 10 ** places;
const mphToYps = mph => mph * YARDS / 3600;

// ------------------------------------------------------------------------------------------------ the numbers

/**
 * Paces in the chase, miles an hour (`HIST-TEX-660`, `-661`, `FIC-GONZ-663`). Infantry at the march's two and a half (the
 * *paso redoblado*; Santa Anna's twelve leagues from Thompson's to Harrisburg in about thirty hours with a night march); cavalry
 * at the trot, eight (Cooke, Poinsett, Nolan), and at the gallop from `GALLOP_YARDS` in (Nolan: "at a trot to within one
 * hundred and fifty yards, then sound the gallop"), eleven. The family goes at its own train's pace (sim/company.mjs): the ox's
 * two, a walker's three, a smaller child's less; a family all mounted at `FAMILY_RUN_MPH` when it runs, its own farm horses
 * with children up behind, slower than a dragoon's.
 */
export const INFANTRY_MPH = 2.5, TROT_MPH = 8, GALLOP_MPH = 11, GALLOP_YARDS = 150, FAMILY_RUN_MPH = 7;
/** Horsemen who have called on a family to halt come up to it at a walk (Cooke: three and three-quarters) until it answers. */
export const WALK_MPH = 3.75;
/** How far off the family may run for the timber, in miles: a patch it can see from the road (`FIC-GONZ-663`). */
export const TIMBER_REACH_MILES = 0.75;
/**
 * What is seen, how far off, in miles, over open ground (`HIST-TEX-667`, `FIC-GONZ-661`, RECONSTRUCTED from the research's
 * sight table): a wagon's white top three miles, a party on horseback two, a man on foot one. In brush a quarter mile (a
 * wagon) or a tenth (people); in timber fifty yards whatever it is.
 */
export const SIGHT = Object.freeze({
  wagon: { open: 3, brush: 0.25, timber: 0.03 },
  mounted: { open: 2, brush: 0.15, timber: 0.03 },
  foot: { open: 1, brush: 0.1, timber: 0.03 },
});
/** Across country, off the roads the soldiers ride and watch, a family is seen at this share of the distance (the owner's rule, `FIC-GONZ-661`). */
export const COUNTRY_SIGHT = 0.5;
/** In rain, a storm or fog nothing is seen past two hundred yards (research §5), and at night past fifty (the sentry's challenge at forty to fifty paces, `HIST-TEX-666`). */
export const WEATHER_SIGHT_MILES = 200 / YARDS, NIGHT_SIGHT_MILES = 50 / YARDS;
/** Night, for the soldiers' eyes and for their giving up: from this hour of the evening to that of the morning (1836, spring). */
export const DUSK_HOUR = 19, DAWN_HOUR = 6;
/** A column sends men after a family only this near (`FIC-GONZ-663`): a file an officer can expect back within the half hour. */
export const INFANTRY_PURSUE_MILES = 1;
/** The men who come after a family: a file of a column's advance guard, or a patrol's own party (`FIC-GONZ-662`). */
export const INFANTRY_PARTY = 8;
/** Within this the soldiers call on the family to halt; within `CAUGHT_YARDS` they have it (`FIC-GONZ-663`). */
export const HAIL_YARDS = 200, CAUGHT_YARDS = 15;
/** Infantry open fire within this range (Hanger: at two hundred "you may just as well fire at the moon"); a horseman at the gallop within fifty. */
export const FIRE_YARDS = Object.freeze({ infantry: 150, cavalry: 50 });
/**
 * Seconds a man is out of the chase for each shot (`HIST-TEX-663`, `FIC-GONZ-664`): a trained musketeer twenty (three rounds a
 * minute), a recruit thirty-five (the research's thirty to forty), each with three seconds' halt to aim. A horseman at the
 * gallop fires his carbine once and does not load again in the chase (Nolan; research §3).
 */
export const RELOAD_SECONDS = Object.freeze({ trained: 20, recruit: 35 }), AIM_SECONDS = 3;
/**
 * The share of a column's infantry who are raw recruits, firing from the hip (`HIST-TEX-664`: Hardin, *Texian Iliad* p. 103,
 * recruits "refused to fire from the shoulder because of the strong recoil"; the share is `FIC-GONZ-664`'s).
 */
export const RECRUIT_SHARE = 0.5;
/**
 * Of a file of infantry after a family, every second man stops to fire and load; the rest run on to take it (`FIC-GONZ-664`:
 * the game's, so that the file both fires and closes, as the owner's "the soldiers open fire" and the research's slow loading
 * would otherwise leave every man standing to load while the family walked away).
 */
export const FIRING_EVERY = 2;
/**
 * They give up (`FIC-GONZ-663`, research §5): infantry after two miles of it or half an hour, cavalry after three miles or half
 * an hour (Nolan's pursuits run "three miles"); at the timber's edge with the family into it and nobody within `TIMBER_YARDS`;
 * at dusk; and, when the family is plainly the faster and still out of hail, after `OUTRUN_MINUTES`.
 */
export const GIVE_UP = Object.freeze({ infantry: { miles: 2, minutes: 30 }, cavalry: { miles: 3, minutes: 30 } });
export const TIMBER_YARDS = 50, OUTRUN_MINUTES = 10, CLOSE_YARDS = 100;
/** A column or patrol that has chased a family does not come after it again for this long, in minutes (`FIC-GONZ-663`). */
export const PURSUED_AGAIN_MINUTES = 1440;

/**
 * The chance one aimed shot hits, by range in yards (`HIT_RANGES`), for each shooter and target (`HIST-TEX-663`,
 * `FIC-GONZ-664`, RECONSTRUCTED in docs/battle-research/scrape-pursuit.md §3 from the 1846 and 1841 British trials, Hanger and
 * Scharnhorst): the scatter normal and growing with range, calibrated to the 1846 trial's fifty in a hundred at 150 yards on a
 * target eleven and a half feet by six, with the unadjusted drop added. For a target on the move, times `MOVING_SHARE`.
 * `hip` is a recruit firing from the hip or a horseman halted; `mounted` a horseman at the gallop.
 */
export const HIT_RANGES = Object.freeze([25, 50, 100, 150, 200]);
export const HIT_TABLE = Object.freeze({
  trained: { man: [0.75, 0.45, 0.17, 0.08, 0.03], beast: [0.95, 0.75, 0.37, 0.18, 0.07], wagon: [1, 0.95, 0.67, 0.43, 0.21] },
  hip: { man: [0.44, 0.17, 0.05, 0.02, 0.01] },
  mounted: { man: [0.17, 0.05, 0.01, 0, 0] },
});
export const MOVING_SHARE = 0.6;
/** A hit on a grown person kills at this share, and on a horse or an ox at this (`FIC-GONZ-664`); the rest are wounded or lamed. */
export const KILLED_SHARE = Object.freeze({ person: 0.2, beast: 0.25 });
/** A wounded person mends in this many days (sim/army.mjs's severe wound). */
export const WOUND_DAYS = 21;
/** Old enough to be shot at: a grown person (children are never a target; owner, 2026-09-27, "Adults and animals only"). */
export const GROWN_AGE = 16;

/** The chance one aimed shot hits, at this range, by this shooter, at this target, moving or still. Linear between the table's ranges; nothing past 200 yards. */
export function hitChance(yards, { shooter = 'trained', target = 'man', moving = true } = {}) {
  if (!(yards >= 0) || yards > HIT_RANGES.at(-1)) return 0;
  const row = HIT_TABLE[shooter]?.[target] || scaled(shooter, target);
  let p = row[0];
  if (yards > HIT_RANGES[0]) {
    const i = HIT_RANGES.findIndex(r => r >= yards);
    const a = HIT_RANGES[i - 1], b = HIT_RANGES[i];
    p = yards === b ? row[i] : row[i - 1] + (row[i] - row[i - 1]) * (yards - a) / (b - a);
  }
  return Math.min(1, Math.max(0, p * (moving ? MOVING_SHARE : 1)));
}
/** A shooter's row the research gives only for a man: scaled by what the trained soldier's rows make of a bigger target. */
function scaled(shooter, target) {
  const man = HIT_TABLE[shooter].man, trained = HIT_TABLE.trained;
  return man.map((p, i) => Math.min(1, trained.man[i] ? p * trained[target][i] / trained.man[i] : 0));
}

// ------------------------------------------------------------------------------------------------ the patrols

const at = (siteId, minute) => ({ siteId, minute });
/**
 * The Mexican cavalry out ahead of a column, on the record's days (`HIST-TEX-662`, `FIC-GONZ-662`). About four hundred horsemen
 * in all of Texas (Filisola's return of April 24), sent out on a column's own line and at most a day's ride ahead; so these
 * are few. `ahead` rides that many miles in front of the column's head along its road for the window `from`–`until`
 * (timeline minutes); `path` is a detachment's own dated road. `men` is the party that rides after a family, not the whole.
 * `column` is the column the patrol is of: the one it rides ahead of, or, for a detachment on its own road, the one it was sent
 * out from. A family it strips is that column's (`armyOf`, owner 2026-09-28 "One army").
 */
export const PATROLS = Object.freeze([
  // Sesma's Dolores cavalry, scouting to the Navidad as he marched on the Colorado: they met Deaf Smith and Karnes on the 18th-19th.
  { id: 'sesma-scouts', column: 'sesma', name: 'Sesma’s scouts', ahead: 8, from: on(1836, 3, 15, 12), until: on(1836, 3, 20, 12), men: 6, claimId: 'HIST-TEX-662' },
  // Urrea's cavalry, sent to keep people from the woods as he came on Victoria, and out ahead of him to Texana and to Matagorda.
  { id: 'urrea-horse', column: 'urrea', name: 'Urrea’s cavalry', ahead: 6, windows: [[on(1836, 3, 20, 18), on(1836, 3, 21, 7, 30)], [on(1836, 3, 31, 8), on(1836, 4, 1, 18)], [on(1836, 4, 12, 6), on(1836, 4, 13, 10)]], men: 8, claimId: 'HIST-TEX-662' },
  // Santa Anna's escort dragoons, ahead of the dash from Thompson's to Harrisburg.
  { id: 'santa-anna-dragoons', column: 'santa-anna', name: 'Santa Anna’s dragoons', ahead: 5, from: on(1836, 4, 14, 15), until: on(1836, 4, 15, 22), men: 8, claimId: 'HIST-TEX-662' },
  // Almonte with the fifty dragoons of the escort to the crossings at New Washington and Lynchburg (Santa Anna's report, p. 75).
  { id: 'almonte', column: 'santa-anna', name: 'Almonte’s dragoons', path: [at('harrisburg', on(1836, 4, 16, 8)), at('new-washington', on(1836, 4, 16, 16)), at('new-washington', on(1836, 4, 17, 8)), at('lynchburg', on(1836, 4, 17, 14)), at('harrisburg', on(1836, 4, 18, 10))], men: 10, claimId: 'HIST-TEX-662' },
  // Captain Barragán's dragoons from New Washington to Lynchburg, "three leagues distant", on the 19th.
  { id: 'barragan', column: 'santa-anna', name: 'Barragán’s dragoons', path: [at('new-washington', on(1836, 4, 19, 8)), at('lynchburg', on(1836, 4, 19, 13)), at('new-washington', on(1836, 4, 19, 19))], men: 8, claimId: 'HIST-TEX-662' },
]);
/** The column entries of sim/advance.mjs that are horsemen only: Urrea's eight dragoons to Cox's Point. */
export const MOUNTED_COLUMNS = Object.freeze(['urrea-coxs']);

/**
 * Whose army a column or patrol is, for who has stripped a family (owner, 2026-09-28, by multiple choice, **"One army"**): a
 * patrol is its column's, a column its own. Once a column or one of its patrols has stripped a family, neither the column nor
 * any of its patrols warns it or comes after it again (sim/road.mjs's warning, `mayChase`). `flight.overtakenBy` keeps the id
 * that did it, as it always has, and is read through this, so a class saved before reads the same way.
 * `ceiling:` only `PATROLS` are tied to a column; the column entries of sim/advance.mjs are each their own (Sesma's two legs,
 * Urrea's detachment to the Juntas and his dragoons to Cox's Point), and would want an `army` of their own to be one with it.
 */
export const armyOf = id => PATROLS.find(patrol => patrol.id === id)?.column || id;
/** Whether the army this column or patrol is of has already stripped the family. */
export const strippedBy = (flight, id) => (flight?.overtakenBy || []).some(one => armyOf(one) === armyOf(id));

const inWindow = (patrol, t) => (patrol.windows || [[patrol.from, patrol.until]]).some(([from, until]) => t >= from && t < until);
/** Where a point is `ahead` miles on along a column's road from its head at timeline minute `t`, or null. */
function aheadOf(map, column, t, ahead) {
  const path = column.path;
  for (let i = 1; i < path.length; i++) {
    if (t > path[i].minute) continue;
    const legs = legsOf(map, column);
    const a = path[i - 1], b = path[i];
    const f = b.minute === a.minute ? 1 : Math.max(0, (t - a.minute) / (b.minute - a.minute));
    let left = ahead, j = i - 1, from = (legs[j]?.length || 0) * f;
    while (legs[j]) {
      const room = legs[j].length - from;
      if (left <= room) return pointAlong(legs[j].points, from + left);
      left -= room; j++; from = 0;
    }
    const last = legs.filter(Boolean).at(-1);
    return last ? last.points.at(-1) : null;
  }
  return null;
}
/** Every cavalry patrol out at this minute of the class, with where it is (sim/advance.mjs `headAt` for a detachment's own road). */
export function patrolsNow(world, t = timelineOf(world)) {
  if (!world?.map?.sites) return [];
  const found = [];
  for (const patrol of PATROLS) {
    if (patrol.path) {
      if (!patrol.path.every(stop => world.map.sites[stop.siteId])) continue;
      const head = headAt(world.map, { id: `patrol:${patrol.id}`, path: patrol.path, until: patrol.path.at(-1).minute }, t);
      if (head) found.push({ id: patrol.id, name: patrol.name, kind: 'cavalry', men: patrol.men, x: head.x, y: head.y, toward: head.toward, towardName: head.towardName, claimId: patrol.claimId });
      continue;
    }
    if (!inWindow(patrol, t)) continue;
    const column = COLUMNS.find(one => one.id === patrol.column);
    const head = column && headAt(world.map, column, t);
    if (!head || head.retreat) continue;
    const point = aheadOf(world.map, column, t, patrol.ahead) || head;
    found.push({ id: patrol.id, name: patrol.name, kind: 'cavalry', men: patrol.men, x: point.x, y: point.y, toward: head.toward, towardName: head.towardName, columnId: column.id, claimId: patrol.claimId });
  }
  return found;
}
/** Everything that can see a family now: each column on its road (infantry, or horse for a mounted one) and each patrol out. */
export function watchersNow(world, t = timelineOf(world)) {
  if (!world?.map?.sites?.gonzales) return [];
  const found = [];
  for (const column of COLUMNS) {
    const head = headAt(world.map, column, t);
    // A column going back after San Jacinto hunts nobody; one fighting on a field the battle draws is at that.
    if (!head || head.retreat) continue;
    const mounted = MOUNTED_COLUMNS.includes(column.id);
    found.push({ id: column.id, name: column.name, kind: mounted ? 'cavalry' : 'infantry', men: mounted ? head.strength || 8 : INFANTRY_PARTY, x: head.x, y: head.y, toward: head.toward, towardName: head.towardName, column: true });
  }
  return [...found, ...patrolsNow(world, t)];
}
/**
 * How near two things came in a tick, each going straight from where it was to where it is: a column and a family that passed
 * each other inside one long tick still met (`FIC-GONZ-661`). Miles.
 */
export function closestApproach(a0, a1, b0, b1) {
  const rx = a0.x - b0.x, ry = a0.y - b0.y, vx = (a1.x - a0.x) - (b1.x - b0.x), vy = (a1.y - a0.y) - (b1.y - b0.y);
  const v2 = vx * vx + vy * vy;
  const tau = v2 ? Math.max(0, Math.min(1, -(rx * vx + ry * vy) / v2)) : 1;
  return Math.hypot(rx + vx * tau, ry + vy * tau);
}

// ------------------------------------------------------------------------------------------------ what they can see

const hourOf = world => dateOf(world, world.minute).getUTCHours();
export const isNight = world => { const hour = hourOf(world); return hour >= DUSK_HOUR || hour < DAWN_HOUR; };
/** The cover where a point stands: `timber`, `brush` or `open` (the real land's woods; the invented country is open). */
export function coverAt(world, point) {
  if (!point || !onRealLand(world)) return 'open';
  const cover = landAround().coverAt(point, woodsRule(world));
  return cover === 'timber' || cover === 'brush' ? cover : 'open';
}
/**
 * Timber enough to hide in: the point and most of the ground a hundred and forty yards round it in timber (`HIDE_MILES`), not a
 * creek's fringe the road runs through in a minute, where the soldiers would see the family come out the other side.
 */
export const HIDE_MILES = 0.08, HIDE_SHARE = 6 / 9;
export function hidesIn(world, point) {
  if (coverAt(world, point) !== 'timber') return false;
  let timber = 1;
  for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; if (coverAt(world, { x: point.x + Math.cos(a) * HIDE_MILES, y: point.y + Math.sin(a) * HIDE_MILES }) === 'timber') timber++; }
  return timber / 9 >= HIDE_SHARE;
}
/** What the soldiers would see of the family: its wagon, a party all on horseback, or people on foot. */
export function seenAs(world, household) {
  const { people, beasts } = withFamily(world, household);
  if (drawnVehicles(beasts).length) return 'wagon';
  const going = people.filter(one => one.travel);
  if (going.length && going.every(one => one.travel.saddle || one.travel.carried)) return 'mounted';
  return 'foot';
}
/**
 * How far off Mexican troops can see this family right now, in miles, and why (`FIC-GONZ-661`): what it is, the cover it is in,
 * on the road or across country, the weather where it is, and the hour. The flight card says the same in words.
 */
export function sightMiles(world, household, point = familyPoint(world, household)) {
  if (!point) return null;
  const what = seenAs(world, household);
  const cover = coverAt(world, point);
  const leader = withFamily(world, household).people.find(one => one.travel?.purpose === 'flee');
  const way = leader && acrossCountry(leader.travel) ? 'country' : 'road';
  let miles = SIGHT[what][cover] * (way === 'country' ? COUNTRY_SIGHT : 1);
  const weather = weatherAt(world, point).kind;
  if (['rain', 'storm', 'fog'].includes(weather)) miles = Math.min(miles, WEATHER_SIGHT_MILES);
  const night = isNight(world);
  if (night) miles = Math.min(miles, NIGHT_SIGHT_MILES);
  return { miles: round(miles, 3), what, cover, way, weather, night };
}

// ------------------------------------------------------------------------------------------------ the chase

/**
 * Whether a student is answering for this family now: played, at the screen, and whoever is with the family and answers for it
 * (sim/acting.mjs `actingFor`: the main person when they are with it, else the next grown person there, else the oldest child of
 * seven or more) not on auto. Until 2026-09-28 this read the raw main person - a father with Houston's army on auto made his family
 * halt at once, and a dead main person was read one way here and another on the road (interactions B1, design M32).
 */
function attended(world, household) {
  const actor = world.entities[actingId(world, household)];
  return Boolean(household.played && !household.absent && actor && !actor.auto);
}
const grown = person => !Number.isFinite(person.age) || person.age >= GROWN_AGE;
/** The family's train's pace this tick, in yards a second of going (0 while it is held). */
function familyYps(world, household, seconds) {
  const leader = withFamily(world, household).people.find(one => one.travel?.purpose === 'flee');
  if (!leader || leader.travel.halted || household.flight.crossing || household.flight.bog) return 0;
  const chase = household.flight.chase;
  const travel = leader.travel;
  // How far it really went this tick, where it is the same leg as last tick: the ground's own going counted in.
  if (chase?.leg && chase.leg.to === travel.to && chase.leg.from === travel.from && travel.progress >= chase.leg.progress) return (travel.progress - chase.leg.progress) * YARDS / seconds;
  const calendar = seconds / 60;
  return travel.speed * roadTicks(calendar) * YARDS / seconds;
}
/** Of the soldiers' going, the share a tick carries: the whole of a watched tick, seven hours in twenty-four of a longer one. */
const goingShare = calendar => (calendar <= 60 ? 1 : roadTicks(calendar) * 20 / calendar);

/** A new chase: the soldiers have seen the family and come after it. */
function beginChase(world, household, watcher, miles, point) {
  const flight = household.flight;
  const n = (flight.pursued || []).length + 1;
  const dx = watcher.x - point.x, dy = watcher.y - point.y, d = Math.hypot(dx, dy) || 1;
  const lead = Math.round(Math.max(CAUGHT_YARDS + 1, miles * YARDS));
  const soldiers = Array.from({ length: watcher.men }, (_, i) => ({ g: lead + Math.round(stirredShare(world, household.id, `chase:${n}:spread:${i}`) * 30), busy: 0, shots: 0, ...(watcher.kind === 'infantry' && stirredShare(world, household.id, `chase:${n}:recruit:${i}`) < RECRUIT_SHARE && { recruit: true }) }));
  const leader = withFamily(world, household).people.find(one => one.travel?.purpose === 'flee');
  flight.chase = {
    id: `${household.id}:${n}`, by: watcher.id, name: watcher.name, kind: watcher.kind, men: watcher.men, toward: watcher.toward || null, towardName: watcher.towardName || null,
    ...(watcher.columnId && { columnId: watcher.columnId }), began: world.minute, t: 0, chased: 0, phase: 'seen',
    dir: { x: round(dx / d, 4), y: round(dy / d, 4) }, soldiers, shots: [], shotCount: 0, hits: 0, lines: [],
    ...(leader?.travel && { leg: { from: leader.travel.from, to: leader.travel.to, progress: leader.travel.progress } }),
  };
  const words = watcher.kind === 'cavalry' ? `${watcher.men} Mexican horsemen` : 'Mexican soldiers';
  record(world, 'consequence', { householdId: household.id, importance: 3, claimId: 'FIC-GONZ-663', text: `${words} of ${watcher.name} saw the family ${Math.round(miles * 10) / 10 < 1 ? `about ${Math.round(miles * YARDS / 10) * 10} yards` : `about ${milesWord(Math.round(miles * 10) / 10)}`} off, and are coming after it.` });
  return flight.chase;
}
/** A line said in the chase, dated to its minute, in Spanish with the English under it (docs/BATTLES.md §2.5: reconstructed, never a named person's). */
function say(world, chase, id, text, gloss, minute = world.minute) {
  if (chase.lines.some(line => line.id === id)) return;
  chase.lines.push({ id, text, gloss, kind: 'reconstructed', side: 'mexican', minute: round(minute, 3), claimId: 'HIST-TEX-666' });
  if (chase.lines.length > 8) chase.lines.splice(0, chase.lines.length - 8);
}

/** Nobody fires at a woman or a child (`FIC-GONZ-665`): whoever is not a grown man is spared. */
const spared = one => !grown(one) || sexOf(one) !== 'male';
/**
 * What a soldier aims at (owner, 2026-09-27, by multiple choice: "Only at men and animals"): a grown man of the family, an ox
 * or a horse, as they come - never a woman or a child, and never a man or a horse with one of them: a man carrying a baby, a
 * man riding in the wagon or cart the women and children ride in, a horse a woman or a child is on; and never the wagon, which
 * carries them. Almonte held his men's fire at New Washington so as not to endanger Burnet's family (`HIST-TEX-665`).
 * ceiling: "in the way" is read from who rides with whom, not from where each walks - the chase is a line, so a man walking
 * beside the women is fired at, and so is the ox at the head of their wagon. Places within the train would justify reading
 * it from them.
 */
function targetsOf(world, household) {
  const { people, beasts } = withFamily(world, household);
  const living = people.filter(one => one.health?.condition !== 'dead');
  // Where the women and children are: the vehicles and horses they ride, and whoever carries a baby.
  const withThem = new Set();
  for (const one of living.filter(spared)) { if (one.travel?.rides) withThem.add(one.travel.rides); if (one.travel?.carried) withThem.add(one.travel.carried); }
  const targets = living.filter(one => !spared(one) && !withThem.has(one.id) && !(one.travel?.rides && withThem.has(one.travel.rides)))
    .map(one => ({ kind: 'person', id: one.id, name: one.given || one.name, size: 'man' }));
  for (const beast of beasts) if (beast.kind === 'animal' && ['ox', 'horse'].includes(beast.species || 'ox') && !withThem.has(beast.id)) targets.push({ kind: 'beast', id: beast.id, name: beast.species === 'horse' ? 'horse' : 'ox', size: 'beast' });
  return targets;
}
/**
 * Nothing to fire at but women and children: the soldiers hold their fire, once said and once written down, as Almonte ordered
 * at New Washington (`HIST-TEX-665`, `FIC-GONZ-665`). They still come on, and a family they come up with is taken.
 */
function holdFire(world, household, chase) {
  if (chase.held) return;
  chase.held = world.minute;
  say(world, chase, 'hold', '¡Alto el fuego! Hay mujeres y niños.', 'Hold your fire! There are women and children.');
  record(world, 'consequence', { householdId: household.id, importance: 3, claimId: 'FIC-GONZ-665', text: `The soldiers of ${chase.name} held their fire: there were only women and children to hit, as Almonte held his men's fire at New Washington so as not to endanger Burnet's family. They came on all the same.` });
}

/** One shot, fired by soldier `i` at this range: a real event, rolled once against the table, and what it did. */
function fire(world, household, chase, i, yards, second, tickStart) {
  const targets = targetsOf(world, household);
  if (!targets.length) { if (withFamily(world, household).people.some(one => one.health?.condition !== 'dead')) holdFire(world, household, chase); return null; }
  const n = chase.shotCount++;
  const soldier = chase.soldiers[i];
  const shooter = chase.kind === 'cavalry' ? 'mounted' : soldier.recruit ? 'hip' : 'trained';
  const target = targets[Math.floor(stirredShare(world, household.id, `${chase.id}:aim:${n}`) * targets.length)];
  const p = hitChance(yards, { shooter, target: target.size, moving: true });
  const hit = stirredShare(world, household.id, `${chase.id}:shot:${n}`) < p;
  // The target's id is kept with the shot for the record's own checks; a page is sent its kind and name only (`chaseProjection`).
  const shot = { n, man: i, yards: Math.round(yards), shooter, target: { kind: target.kind, name: target.name, id: target.id }, p: round(p, 3), hit, minute: round(tickStart + second / 60, 3) };
  if (hit) {
    chase.hits++;
    shot.fate = strike(world, household, chase, target, n);
  }
  chase.shots.push(shot);
  if (chase.shots.length > 24) chase.shots.splice(0, chase.shots.length - 24);
  return shot;
}
/** What a ball that hit did: a grown person wounded or killed, a beast lamed or killed, or the wagon's cover holed. No gore. */
function strike(world, household, chase, target, n) {
  const entity = world.entities[target.id];
  const siteId = nearestSite(world, entity?.location);
  if (target.kind === 'wagon') return 'harmless';
  if (target.kind === 'person') {
    const killed = stirredShare(world, household.id, `${chase.id}:fate:${n}`) < KILLED_SHARE.person;
    if (killed) {
      entity.health = { condition: 'dead' }; entity.travel = null; entity.task = 'rest'; entity.chore = null;
      entity.location = { x: entity.location.x, y: entity.location.y, siteId };
      record(world, 'consequence', { householdId: household.id, actorId: entity.id, importance: 3, claimId: 'FIC-GONZ-664', text: `${entity.name} was struck by a musket ball as the family ran from the soldiers of ${chase.name}, and was killed. They were buried where they fell.` });
      return 'killed';
    }
    entity.health = { condition: 'wounded', recoversAt: world.minute + WOUND_DAYS * 1440 };
    record(world, 'consequence', { householdId: household.id, actorId: entity.id, importance: 3, claimId: 'FIC-GONZ-664', text: `${entity.name} was hit by a musket ball as the family ran from the soldiers of ${chase.name}, and is wounded. It will be weeks mending.` });
    return 'wounded';
  }
  const killed = stirredShare(world, household.id, `${chase.id}:fate:${n}`) < KILLED_SHARE.beast;
  if (killed) {
    entity.condition = 'dead'; entity.travel = null; entity.laden = false; entity.borrowedBy = null; delete entity.hurt;
    entity.location = { x: entity.location.x, y: entity.location.y, siteId };
    record(world, 'consequence', { householdId: household.id, importance: 2, claimId: 'FIC-GONZ-664', text: `The ${target.name} was shot down as the family ran.` });
    return 'killed';
  }
  entity.hurt = true;
  record(world, 'consequence', { householdId: household.id, importance: 2, claimId: 'FIC-GONZ-664', text: `The ${target.name} was hit by a ball and is lamed${target.name === 'ox' ? ': the wagon goes at half its pace' : ': nobody can ride it'}.` });
  return 'lamed';
}
const nearestSite = (world, point) => point && Object.values(world.map.sites).reduce((best, site) => !best || Math.hypot(site.x - point.x, site.y - point.y) < Math.hypot(best.x - point.x, best.y - point.y) ? site : best, null)?.id;

/**
 * The train's pace after what the chase did to it: a lamed ox halves the wagon's pace; an ox killed stops the wagon, and a
 * family running leaves it and goes on on foot; a horse lamed or killed puts its rider down. The family all mounted and
 * running goes at `FAMILY_RUN_MPH`.
 */
function repace(world, household) {
  const flight = household.flight, chase = flight.chase;
  const { people, beasts } = withFamily(world, household);
  const movers = [...people, ...beasts].filter(one => one.travel?.purpose === 'flee');
  if (!movers.length) return;
  const running = chase?.answer === 'run';
  if (flight.mode === 'wagon' && !drawnVehicles(beasts).length) {
    // The ox is down in the traces: the wagon cannot go on.
    if (running) { abandonWagon(world, household); record(world, 'consequence', { householdId: household.id, importance: 3, claimId: 'FIC-GONZ-664', text: 'With the ox down the wagon could go no further; the family left it and ran on on foot.' }); }
    else for (const one of movers) one.travel.halted = true;
    return;
  }
  const hurtOx = flight.mode === 'wagon' && beasts.some(beast => beast.hurt && beast.species !== 'horse' && beast.kind === 'animal');
  const mounted = people.filter(one => one.travel).every(one => one.travel.saddle || one.travel.carried);
  for (const one of people) if (one.travel?.saddle) { const horse = beasts.find(beast => beast.id === one.travel.rides); if (!horse || horse.hurt) { delete one.travel.saddle; one.travel.afoot = true; } }
  const stillMounted = mounted && people.filter(one => one.travel).every(one => one.travel.saddle || one.travel.carried);
  for (const one of movers) {
    if (hurtOx) one.travel.speed = Math.min(one.travel.speed, WAGON_SPEED / 2);
    else if (flight.mode !== 'wagon' && mounted && !stillMounted) one.travel.speed = Math.min(one.travel.speed, WALK_SPEED);
    else if (running && stillMounted && flight.mode !== 'wagon') one.travel.speed = FAMILY_RUN_MPH / 3;
  }
}

/**
 * The chase for `seconds` of the calendar: every soldier closing or loading, every shot fired, the order to halt at
 * `HAIL_YARDS`, and caught at `CAUGHT_YARDS`. Returns what ended it, or null.
 */
function runChase(world, household, chase, seconds, calendar, vF) {
  const share_ = goingShare(calendar);
  const tickStart = world.minute - calendar;
  const firing = chase.answer === 'run' && Number.isFinite(chase.fireFrom);
  const attendedNow = attended(world, household);
  let hailAt = 0;
  for (let s = 0; s < seconds; s++) {
    chase.t++;
    let lead = Infinity;
    chase.soldiers.forEach((soldier, i) => {
      const loading = soldier.busy > chase.t;
      const mph = soldierMph(chase, soldier);
      // Having called on the family to halt this tick, they stand and wait for its answer until the tick is out.
      const go = loading || (hailAt && attendedNow) ? 0 : mphToYps(mph) * share_;
      soldier.g = Math.max(0, soldier.g + vF - go);
      soldier.run = (soldier.run || 0) + go;
      chase.chased = Math.max(chase.chased, soldier.run);
      if (firing && chase.t >= chase.fireFrom && soldier.g <= FIRE_YARDS[chase.kind] && soldier.g > CAUGHT_YARDS && !loading && (chase.kind === 'infantry' ? i % FIRING_EVERY === 0 : soldier.shots < 1)) {
        const shot = fire(world, household, chase, i, soldier.g, s, tickStart);
        if (shot) {
          soldier.shots++;
          if (chase.kind === 'infantry') soldier.busy = chase.t + AIM_SECONDS + (soldier.recruit ? RELOAD_SECONDS.recruit : RELOAD_SECONDS.trained);
          if (!chase.firstShot) { chase.firstShot = shot.minute; say(world, chase, 'fire', chase.kind === 'cavalry' ? '¡A ellos!' : '¡Fuego!', chase.kind === 'cavalry' ? 'At them!' : 'Fire!', shot.minute); }
        }
      }
      lead = Math.min(lead, soldier.g);
    });
    chase.lead = Math.round(lead);
    if (lead <= CAUGHT_YARDS) return 'caught';
    // Within hail: the order comes, and the rest of the tick goes on (the family does not stop going for it).
    if (chase.phase === 'seen' && lead <= HAIL_YARDS && !hailAt) {
      hailAt = s + 1; chase.phase = 'hailed'; chase.hailYards = Math.round(lead);
      // A family nobody is answering for halts when it is called on to: there is nothing more of the tick to run.
      if (!attendedNow) return 'hail';
    }
  }
  return hailAt ? 'hail' : null;
}
/**
 * A soldier's pace now: infantry at the march; horsemen at the trot coming on, at a walk once they have called on the family
 * to halt and wait its answer, and at the trot and then the gallop within `GALLOP_YARDS` when it runs.
 */
function soldierMph(chase, soldier) {
  if (chase.kind !== 'cavalry') return INFANTRY_MPH;
  if (chase.phase === 'hailed' && !chase.answer) return WALK_MPH;
  return chase.answer === 'run' && soldier.g <= GALLOP_YARDS ? GALLOP_MPH : TROT_MPH;
}

/** Why the soldiers give up now, or null. */
function givesUp(world, household, chase, vF) {
  // Ordered to halt and not yet answered: they are waiting on the family's answer, and come on meanwhile.
  if (chase.phase === 'hailed' && !chase.answer) return null;
  const limit = GIVE_UP[chase.kind];
  // Tired of it and far enough - but not with a hand almost on the family (`CLOSE_YARDS`): then they go on and take it.
  if (chase.lead > CLOSE_YARDS && chase.chased >= limit.miles * YARDS) return 'far';
  if (chase.lead > CLOSE_YARDS && chase.t >= limit.minutes * 60) return 'long';
  if (isNight(world)) return 'dusk';
  const point = familyPoint(world, household);
  if (point && chase.lead > TIMBER_YARDS && hidesIn(world, point)) return 'timber';
  // Plainly the faster, and still out of hail: they see they will not come up with it.
  const vS = mphToYps(chase.kind === 'cavalry' ? TROT_MPH : INFANTRY_MPH);
  if (chase.phase === 'seen' && vF > vS && chase.t >= OUTRUN_MINUTES * 60) return 'outrun';
  return null;
}
const GAVE_UP_WORDS = {
  far: 'they had come far enough from their column, and turned back',
  long: 'after half an hour of it they gave it up and turned back',
  dusk: 'night came on, and they gave it up',
  timber: 'the family got into the timber, and the horsemen would not follow it in',
  outrun: 'they could not come up with it, and turned back',
};

/** The chase is over: the family got away, or was taken. Kept a little for the page to show, then put in `flight.pursued`. */
function endChase(world, household, chase, outcome, reason = null) {
  const flight = household.flight;
  chase.phase = outcome; chase.ended = world.minute; chase.linger = 0;
  if (reason) chase.reason = reason;
  if (outcome === 'escaped') {
    if (chase.answer === 'run') say(world, chase, 'leave', '¡Déjenlos!', 'Let them go!');
    const text = chase.hailed
      ? `The family ran from the soldiers of ${chase.name}${chase.shotCount ? `, who fired ${chase.shotCount} ${chase.shotCount === 1 ? 'shot' : 'shots'} after it` : ''}; ${GAVE_UP_WORDS[reason] || 'they gave it up'}.`
      : `The soldiers of ${chase.name} came after the family, but ${GAVE_UP_WORDS[reason] || 'they gave it up'}.`;
    record(world, 'consequence', { householdId: household.id, importance: 3, claimId: 'FIC-GONZ-663', text });
  }
  // Word goes along the road: a public line, as the burnings' are (sim/scrape.mjs `burnByForagers`).
  if (chase.hailed) record(world, 'world-event', { visibility: 'public', importance: 2, classification: 'FICTIONAL FOR GAMEPLAY', claimId: 'FIC-GONZ-663', text: `${chase.kind === 'cavalry' ? 'Mexican horsemen' : 'Mexican soldiers'} of ${chase.name} ${outcome === 'escaped' ? `chased ${householdName(world, household)} on the road${chase.shotCount ? ' and fired on them' : ''}; the family got away` : `came up with ${householdName(world, household)} on the road${chase.shotCount ? ' after firing on them' : ''}`}.` });
  // Back to its own pace: the running family's horses to their walk and trot.
  if (outcome === 'escaped' && chase.answer === 'run') {
    const { people, beasts } = withFamily(world, household);
    for (const one of [...people, ...beasts]) if (one.travel?.purpose === 'flee' && one.travel.speed === FAMILY_RUN_MPH / 3) one.travel.speed = HORSE_SPEED;
  }
}
/** The chase put away: into the family's short list of those it has met, and the question it held put back. */
function closeChase(household) {
  const flight = household.flight, chase = flight.chase;
  if (!chase) return;
  flight.pursued = [...(flight.pursued || []), { id: chase.id, by: chase.by, kind: chase.kind, outcome: chase.phase, minute: chase.ended ?? chase.began, shots: chase.shotCount, hits: chase.hits }].slice(-6);
  if (chase.deferredAsk && !flight.ask && flight.bog && chase.deferredAsk.id === 'bog') flight.ask = chase.deferredAsk;
  delete flight.chase;
}

/** The order to halt, and the family asked (sim/road.mjs `ROAD_ASKS.alto`). */
function hail(world, household, chase) {
  const flight = household.flight;
  chase.phase = 'hailed'; chase.hailed = world.minute; chase.hailYards = chase.hailYards ?? chase.lead;
  // By night the sentry's challenge (`HIST-TEX-666`: "Quién vive" from retreat until dawn), by day the order.
  if (isNight(world)) say(world, chase, 'alto', '¿Quién vive?', 'Who goes there?'); else say(world, chase, 'alto', '¡Alto!', 'Halt!');
  if (flight.ask && flight.ask.id !== 'alto') { chase.deferredAsk = flight.ask; delete flight.ask; }
  flight.ask = { id: 'alto', openedMinute: world.minute, openedTick: world.tick };
  record(world, 'pressure', { householdId: household.id, importance: 3, claimId: 'FIC-GONZ-663', text: `${chase.kind === 'cavalry' ? 'Mexican horsemen' : 'Mexican soldiers'} of ${chase.name} are about ${chase.lead} yards behind, calling on the family to halt. The family is asked what it will do.` });
  if (household.played) spotlight(world, { key: `chase:${chase.id}`, text: `${chase.kind === 'cavalry' ? 'Mexican horsemen' : 'Mexican soldiers'} of ${chase.name} call on ${householdName(world, household)} to halt on the road.`, ...familyPoint(world, household), claimId: 'FIC-GONZ-663', householdId: household.id, tell: false });
}

/** The unanswered order to halt is answered for the family after this many ticks: it halts, and it is written down (`FIC-GONZ-666`). */
export const ALTO_PATIENCE_TICKS = 3;
/** Seconds between the second order and the first shot at a family that runs (`FIC-GONZ-663`). */
export const WARNED_SECONDS = 10;
/** The calendar's step while a watched chase is close (`FIC-GONZ-666`): two minutes a tick, about ten seconds each at Study. */
export const CHASE_STEP = 2;
/** Ticks the end of a chase stays on the page before the road's own time comes back. */
export const LINGER_TICKS = 1;
const STEPS = [1, 2, 5, 10, 20];

/**
 * The family answers the order to halt (sim/road.mjs `answerRoad`): halt and be taken, or run - as it is, leaving the wagon,
 * or letting the cow go.
 */
export function answerAlto(world, household, option) {
  const flight = household.flight, chase = flight.chase;
  if (!chase) return;
  if (option === 'halt') {
    chase.answer = 'halt';
    say(world, chase, 'surrender', '¡Ríndanse!', 'Give yourselves up!');
    caught(world, household, chase, 'halted');
    return;
  }
  chase.answer = 'run';
  // A second order as the family whips up, and they fire from `WARNED_SECONDS` after it.
  chase.warned = world.minute; chase.fireFrom = chase.t + WARNED_SECONDS;
  say(world, chase, 'warn', '¡Alto, o hacemos fuego!', 'Halt, or we fire!');
  // Whoever held a camp by the road leaves it off: nothing halts a family running (sim/road.mjs `breakCamp`).
  breakCamp(world, household);
  if (option === 'abandon-run') abandonWagon(world, household);
  if (option === 'timber-run') runForTimber(world, household);
  if (option === 'cow-run') { loseCow(household); cowPace(world, household); record(world, 'consequence', { householdId: household.id, importance: 2, claimId: 'FIC-GONZ-663', text: 'The family let the milk cow go and ran.' }); }
  // Camped at a refuge, the family runs on for the next one east.
  if (flight.status === 'refuged') { const next = nextRefuge(world, household); if (next) moveOn(world, household, next.id); }
  if (flight.crossing && flight.mode !== 'wagon') { flight.crossed = [...(flight.crossed || []), flight.crossing.siteId]; delete flight.crossing; }
  delete flight.bog;
  const { people, beasts } = withFamily(world, household);
  for (const one of [...people, ...beasts]) if (one.travel) delete one.travel.halted;
  const leader = people.find(one => one.travel?.purpose === 'flee');
  if (leader) chase.leg = { from: leader.travel.from, to: leader.travel.to, progress: leader.travel.progress };
  repace(world, household);
}
/** The soldiers have the family: taken as a column always took one it came up with (sim/road.mjs `overtake`). */
function caught(world, household, chase, how) {
  endChase(world, household, chase, 'caught', how);
  overtake(world, household, { id: chase.by, name: chase.name, toward: chase.toward, towardName: chase.towardName });
  // Everybody's travel is on foot now, and the soldiers are among them: the chase's figures stand with the family.
  for (const soldier of chase.soldiers) soldier.g = Math.min(soldier.g, CAUGHT_YARDS);
}

/** Whether this watcher may begin a chase of this family now. */
function mayChase(flight, watcher, world) {
  // Stripped by this column or any of its patrols, never again by any of them ("One army").
  if (strippedBy(flight, watcher.id)) return false;
  return !(flight.pursued || []).some(one => one.by === watcher.id && world.minute - one.minute < PURSUED_AGAIN_MINUTES);
}

/**
 * One tick of the soldiers for a family on the road east or camped at its refuge (sim/road.mjs `advanceRoad`): seen, chased,
 * hailed, fired on, taken or got away. Returns whether the family is held where it is by it.
 */
export function advancePursuit(world, household) {
  const flight = household.flight;
  if (!flight || !['fled', 'refuged'].includes(flight.status)) return false;
  const calendar = calendarMinutes(world), seconds = Math.max(1, Math.round(calendar * 60));
  let chase = flight.chase;
  if (chase && ['caught', 'escaped'].includes(chase.phase)) {
    chase.linger = (chase.linger || 0) + 1;
    if (chase.linger > LINGER_TICKS || !attended(world, household)) closeChase(household);
    chase = flight.chase;
    if (chase) { chase.step = CHASE_STEP; return chase.phase === 'caught'; }
    return false;
  }
  const point = familyPoint(world, household);
  if (!point) return false;
  // Where the family stood at the end of the last tick, for what passed it inside this one (`closestApproach`).
  const was = flight.lastPoint?.minute === world.minute - calendar ? flight.lastPoint : null;
  flight.lastPoint = { minute: world.minute, x: round(point.x, 4), y: round(point.y, 4) };
  const fresh = !chase;
  if (!chase) {
    // Never in the day its order gives it, nor again where the army has already stripped it (as sim/road.mjs always kept).
    if (Number.isFinite(flight.orderedMinute) && world.minute < flight.orderedMinute + ORDER_GRACE_MINUTES) return false;
    if (flight.overtaken && !(flight.leftMinute > flight.overtaken.minute)) return false;
    const sight = sightMiles(world, household, point);
    if (!sight) return false;
    let best = null;
    const before = was ? watchersNow(world, timelineOf(world) - calendar) : [];
    for (const watcher of watchersNow(world)) {
      const miles = Math.hypot(watcher.x - point.x, watcher.y - point.y);
      const prev = before.find(one => one.id === watcher.id);
      const nearest = prev ? Math.min(miles, closestApproach(was, point, prev, watcher)) : miles;
      const reach = Math.min(sight.miles, watcher.kind === 'infantry' ? INFANTRY_PURSUE_MILES : Infinity);
      if (nearest > reach || !mayChase(flight, watcher, world)) continue;
      // Seen as they passed inside the tick: they turn after it from where they are now, no further off than they could see.
      if (!best || nearest < best.nearest) best = { watcher, nearest, miles: Math.min(miles, reach) };
    }
    if (!best) return false;
    chase = beginChase(world, household, best.watcher, best.miles, point);
  }
  const vF = familyYps(world, household, seconds);
  // Seen at the end of this tick: the chase begins now, not a tick ago. A family nobody is answering for is not chased: when
  // the soldiers call on it to halt, it halts (`FIC-GONZ-666`).
  const ended = fresh ? null : runChase(world, household, chase, seconds, calendar, vF);
  const leader = withFamily(world, household).people.find(one => one.travel?.purpose === 'flee');
  if (leader) chase.leg = { from: leader.travel.from, to: leader.travel.to, progress: leader.travel.progress };
  if (ended === 'caught') { caught(world, household, chase, chase.answer === 'run' ? 'ran' : 'came-up'); return true; }
  if (ended === 'hail' || (chase.phase === 'seen' && chase.soldiers.some(one => one.g <= HAIL_YARDS))) {
    chase.phase = 'seen';
    chase.lead = Math.round(Math.min(...chase.soldiers.map(one => one.g)));
    hail(world, household, chase);
    if (!attended(world, household)) { answerAltoFor(world, household, 'auto'); return true; }
  }

  // Where the nearest timber is, for the family's answers (and never where the column is).
  if (flight.chase && !['caught', 'escaped'].includes(flight.chase.phase)) { const timber = nearestTimber(world, familyPoint(world, household)); if (timber) flight.chase.timber = timber; else delete flight.chase.timber; }
  // The order unanswered: the family halts, as it was ordered, and that is written down.
  if (flight.ask?.id === 'alto' && world.tick - flight.ask.openedTick >= ALTO_PATIENCE_TICKS) answerAltoFor(world, household, 'silence');
  chase = flight.chase;
  if (!chase || ['caught', 'escaped'].includes(chase.phase)) { if (chase) chase.step = CHASE_STEP; return Boolean(chase && chase.phase === 'caught'); }
  repace(world, household);
  const reason = givesUp(world, household, chase, vF);
  if (reason) { endChase(world, household, chase, 'escaped', reason); chase.step = CHASE_STEP; return false; }
  chase.step = stepFor(chase, vF);
  return false;
}
/**
 * The order answered for the family. A family nobody is answering for halts by its fallback, through the road's own answer so it
 * is written down as every road answer is. Unanswered by its student in its time, the question **lapses** (owner, 2026-09-27,
 * sim/lapse.mjs, `FIC-GONZ-633`): nothing new is chosen, the family stands as it was ordered to, and the soldiers come up - the
 * halt, written down as a lapse.
 */
function answerAltoFor(world, household, how) {
  if (how !== 'silence') { answerRoad(world, household, roadAutoAnswer(world, household) || 'halt', how); return; }
  delete household.flight.ask;
  recordLapse(world, { householdId: household.id, text: 'Nobody answered for the family in time, and the question lapsed. The family stood where it was, as the soldiers ordered, and they came up with it.' });
  answerAlto(world, household, 'halt');
}

/** The calendar's step for a chase a student is watching: small once the soldiers are close, larger while they come on. */
function stepFor(chase, vF) {
  if (chase.phase !== 'seen') return CHASE_STEP;
  const vS = mphToYps(chase.kind === 'cavalry' ? TROT_MPH : INFANTRY_MPH);
  const lead = Math.min(...chase.soldiers.map(one => one.g));
  if (vS <= vF) return 5;
  // Coming on: in ticks that bring them to hail in two or three, never past it by more than a tick's closing.
  const minutes = (lead - HAIL_YARDS) / (vS - vF) / 60;
  return [...STEPS].reverse().find(step => step <= Math.max(CHASE_STEP, minutes)) || CHASE_STEP;
}

/** The class's clock while a chase a student is watching runs: sim/military-pacing.mjs `chaseStep` reads `chase.step`. */
export { chaseStep } from './military-pacing.mjs';

/**
 * The chase as a page is shown it: the family's own, and every one to the Host. The soldiers as distances behind the family
 * along the way they came, what was said, the shots and what each did. Never where the column is.
 */
export function chaseProjection(world, household) {
  const chase = household?.flight?.chase;
  if (!chase) return null;
  const point = familyPoint(world, household);
  return {
    id: chase.id, name: chase.name, kind: chase.kind, men: chase.men, phase: chase.phase, lead: chase.lead ?? Math.round(Math.min(...chase.soldiers.map(one => one.g))),
    ...(point && { x: round(point.x, 4), y: round(point.y, 4) }), dir: chase.dir, minute: world.minute,
    soldiers: chase.soldiers.map(one => ({ g: Math.round(one.g), ...(one.busy > chase.t && { loading: true }) })),
    lines: chase.lines, shots: chase.shots.map(({ n, man, yards, target, hit, fate, minute, p }) => ({ n, man, yards, target: target.kind, name: target.name, hit, ...(fate && { fate }), minute, p })),
    shotCount: chase.shotCount, hits: chase.hits, ...(chase.answer && { answer: chase.answer }), ...(chase.reason && { reason: chase.reason }),
    ...(chase.timber && { timber: chase.timber }),
  };
}
/** Every chase in the class, for the Host's page: whose, and the scene. */
export function chasesForHost(world) {
  return Object.values(world.households || {}).filter(household => household.flight?.chase).map(household => ({ householdId: household.id, family: householdName(world, household), ...chaseProjection(world, household) }));
}

/** A saved chase that cannot be, or null. */
export function pursuitInvalid(world) {
  for (const household of Object.values(world.households || {})) {
    const chase = household.flight?.chase;
    if (chase !== undefined && (!chase || !chase.id || !['infantry', 'cavalry'].includes(chase.kind) || !Array.isArray(chase.soldiers) || chase.soldiers.some(one => !Number.isFinite(one?.g)) || !['seen', 'hailed', 'caught', 'escaped'].includes(chase.phase))) return 'Invalid chase';
    const pursued = household.flight?.pursued;
    if (pursued !== undefined && (!Array.isArray(pursued) || pursued.some(one => !one?.by || !Number.isFinite(one.minute)))) return 'Invalid pursuit';
  }
  return null;
}

export { heldToCow };

// ------------------------------------------------------------------------------------------------ the order to halt, asked

/**
 * The nearest timber to a point within `TIMBER_REACH_MILES`, or null: looked for on rings a tenth of a mile apart, sixteen
 * ways round. What the family can run for; in it the horsemen will not follow (`HIST-TEX-667`: Coleto, Victoria, the
 * Kuykendalls' cane-brake).
 */
export function nearestTimber(world, point) {
  if (!point || !onRealLand(world)) return null;
  for (let r = 0.05; r <= TIMBER_REACH_MILES + 1e-9; r += 0.1) {
    let best = null;
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * Math.PI * 2, at = { x: point.x + Math.cos(a) * r, y: point.y + Math.sin(a) * r };
      if (hidesIn(world, at)) { best = at; break; }
    }
    if (best) return { x: round(best.x, 4), y: round(best.y, 4), yards: Math.round(r * YARDS) };
  }
  return null;
}
/**
 * The family runs for the timber (`FIC-GONZ-663`): off the road to it, and back to the road after, the rest of its way as it
 * was. Every one of the train's journeys is given the same detour, across country and at its going. Whether the horsemen give up
 * is theirs (`givesUp`, 'timber'). Returns the timber, or null when there is none near.
 */
export function runForTimber(world, household) {
  const point = familyPoint(world, household), timber = nearestTimber(world, point);
  if (!timber || household.flight.status !== 'fled') return null;
  const { people, beasts } = withFamily(world, household);
  for (const one of [...people, ...beasts]) {
    const travel = one.travel;
    if (travel?.purpose !== 'flee') continue;
    let walked = 0, k = 0;
    for (let i = 1; i < travel.points.length; i++) {
      const length = Math.hypot(travel.points[i].x - travel.points[i - 1].x, travel.points[i].y - travel.points[i - 1].y);
      k = i - 1;
      if (walked + length >= travel.progress) break;
      walked += length;
    }
    const here = { x: one.location.x, y: one.location.y };
    const out = Math.hypot(timber.x - here.x, timber.y - here.y);
    const points = [here, { x: timber.x, y: timber.y }, here, ...travel.points.slice(k + 1)];
    const factor = travel.mode === 'wagon' ? 1.6 : 1.15;
    const pace = [[0, factor], [1, factor], ...(travel.pace || []).filter(([i]) => i >= k).map(([i, f]) => [i - k + 2, f])];
    const distance = points.slice(1).reduce((sum, b, i) => sum + Math.hypot(b.x - points[i].x, b.y - points[i].y), 0);
    const offRoad = [[0, round(out * 2, 3)], ...(travel.offRoad || []).filter(([, b]) => b > travel.progress).map(([a, b]) => [round(Math.max(a, travel.progress) - travel.progress + out * 2, 3), round(b - travel.progress + out * 2, 3)])];
    Object.assign(travel, { points, progress: 0, distance, pace, offRoad });
    delete travel.halted;
  }
  if (household.flight.chase) { household.flight.chase.timber = timber; delete household.flight.chase.leg; }
  record(world, 'consequence', { householdId: household.id, importance: 2, claimId: 'FIC-GONZ-663', text: `The family left the road and made for the timber, about ${timber.yards} yards off.` });
  return timber;
}

/** Why the family cannot make for the timber now, or null (the flight card's button while soldiers are coming, `flight-timber`). */
export function timberRefusal(world, household) {
  const flight = household.flight, chase = flight?.chase;
  if (!chase || ['caught', 'escaped'].includes(chase.phase)) return 'Nobody is after the family.';
  if (flight.status !== 'fled') return 'The family is camped; answer the soldiers.';
  if (flight.bog) return 'The wagon is fast in the mud.';
  if (flight.crossing && flight.mode === 'wagon') return 'The wagon is waiting its turn at the crossing.';
  if (!nearestTimber(world, familyPoint(world, household))) return `There is no timber within ${TIMBER_REACH_MILES} of a mile to hide in.`;
  return null;
}
/** The family makes for the timber while the soldiers are still coming on: its own choice, on the card. */
export function makeForTimber(world, household) {
  const why = timberRefusal(world, household);
  if (why) throw new Error(why);
  return runForTimber(world, household);
}

/** The soldiers' pace in words: infantry's, or the trot a horseman keeps and the gallop he closes at. */
export const pursuerMph = chase => (chase?.kind === 'cavalry' ? TROT_MPH : INFANTRY_MPH);
/** How fast the family would go, in miles an hour, answering this way: as it is, on foot without the wagon, or without the cow. */
export function runMph(world, household, option = 'run') {
  const flight = household.flight;
  const { people, beasts } = withFamily(world, household);
  const leader = people.find(one => one.travel?.purpose === 'flee');
  if (option === 'abandon-run') return flight.cow ? 2 : 3;
  if (option === 'cow-run') return 3;
  if (seenAs(world, household) === 'mounted') return FAMILY_RUN_MPH;
  if (drawnVehicles(beasts).length) return beasts.some(beast => beast.hurt && beast.species !== 'horse' && beast.kind === 'animal') ? 1 : 2;
  if (leader?.travel) return round(leader.travel.speed * 3, 1);
  return 3;
}
const they = chase => (chase.kind === 'cavalry' ? `${chase.men} Mexican horsemen` : 'Mexican soldiers');
/** The question's words (sim/road.mjs `ROAD_ASKS.alto`). */
export function altoText(world, household) {
  const chase = household.flight?.chase;
  if (!chase) return 'Mexican soldiers are calling on the family to halt.';
  const call = chase.lines.find(line => line.id === 'alto');
  return `${they(chase)} of ${chase.name} are about ${chase.lead} yards off, calling on the family to halt: “${call?.text || '¡Alto!'}” (${call?.gloss || 'Halt!'}).`;
}
/** The answers, each with its price in the numbers the chase is run by (sim/road.mjs `ROAD_ASKS.alto`). */
export function altoOptions(world, household) {
  const flight = household.flight, chase = flight.chase;
  const vS = pursuerMph(chase);
  const pace = option => { const mph = runMph(world, household, option); return { mph, words: `about ${milesWord(mph)} an hour; they come on at about ${vS}${chase?.kind === 'cavalry' ? `, and gallop at ${GALLOP_MPH} for the last ${GALLOP_YARDS} yards` : ''}${mph > vS ? ', slower than the family' : mph < vS ? ', faster than the family' : ''}` }; };
  const fireWords = chase?.kind === 'cavalry'
    ? 'After a second order each horseman fires his carbine once, from the saddle; from a galloping horse few balls hit.'
    : `After a second order they fire, each man stopping to load after every shot. A musket ball at ${FIRE_YARDS.infantry} yards seldom hits a running man; at fifty, more often.`;
  const options = [{ id: 'halt', label: 'Halt, as they order', note: 'The soldiers come up and take the wagon, the animals and what is carried, and may take the grown men prisoner. Nobody is shot.' }];
  const run = pace('run');
  options.push({ id: 'run', label: `Run as we are (${milesWord(run.mph)} an hour)`, note: `The family goes at ${run.words}. ${fireWords} They aim at the men and the animals, never at a woman or a child, and hold their fire where one is in the way. They give up after a few miles, or at dark.` });
  const timber = chase?.timber || nearestTimber(world, familyPoint(world, household));
  if (timber && flight.status === 'fled') options.push({ id: 'timber-run', label: `Run for the timber (${timber.yards} yards off the road)`, note: `Off the road and into the trees, at ${run.words}, slower across the rough ground. Horsemen will not follow a family into the timber, and soldiers there cannot see far. ${fireWords}` });
  const { beasts } = withFamily(world, household);
  if (drawnVehicles(beasts).length) { const foot = pace('abandon-run'); options.push({ id: 'abandon-run', label: `Leave the wagon and run on foot (${milesWord(foot.mph)} an hour)`, note: `The wagon, the oxen and what does not fit on the grown people's backs stay behind. On foot the family goes at ${foot.words}. ${fireWords}` }); }
  if (heldToCow(world, household)) { const free = pace('cow-run'); options.push({ id: 'cow-run', label: `Let the milk cow go and run (${milesWord(free.mph)} an hour)`, note: `The cow is left to the soldiers. The family goes at ${free.words}. ${fireWords}` }); }
  return options;
}
/** Why the family cannot run as it is, or null: the wagon in the mud, or waiting at a crossing, or no refuge further to run for. */
export function runRefusal(world, household) {
  const flight = household.flight;
  if (flight.bog) return 'The wagon is fast in the mud; it cannot run.';
  if (flight.crossing && flight.mode === 'wagon') return 'The wagon cannot get over the river until its turn comes.';
  if (flight.status === 'refuged' && !nextRefuge(world, household)) return 'There is no refuge further east to run for.';
  return null;
}
