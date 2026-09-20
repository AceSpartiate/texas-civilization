// Hunting on the family's own land: docs/WOODS_AND_BUILDING.md §5, build step 3.
//
// The owner asked that a family can hunt its own land. A student picks one of the family, *Hunt on our land*, taps a
// place inside the family's line, is told what the ground is and how good it is for game, and sends them. The hunter
// walks out over the family's own land, works in, waits for the deer, takes or holds the shot as always, and walks home.
// The old hunt - to the nearest cover, by road if need be (`hunt-timber`, `FIC-GONZ-030`) - is still there beside it.
//
// What the ground is decides how long the wait is, never whether a deer comes: this game has no dice in its work
// (sim/chores.mjs). Bottomland and creek timber are the best ground, open prairie the poorest, and the edge of timber is
// better than the middle of either, because deer feed out of the cover (`FIC-GONZ-032`, invented, like every number here).
import { onRealLand } from './ground.mjs';
import { landAround } from './ground.mjs';
import { groundAt } from './fields.mjs';
import { holdingOf } from './grants.mjs';
import { choosing } from './homesite.mjs';
import { whereFromHouse } from './survey.mjs';
import { QUARRY, countsTrees, patchAt, patchCover, standOf, woodsRule, PATCH_MILES } from './woods.mjs';
import { distanceToPolyline } from './terrain.mjs';
import { realTerrain } from './terrain-data.mjs';
import { dateOf } from './clock.mjs';

/** How much better the edge of timber is for game than the middle of a stand, added to its game, most 1. */
export const EDGE_GAME = 0.2;

/**
 * The game of 1836 (docs/BIOME_GAMEPLAY.md §3.1, `FIC-GONZ-065`), for a class whose woods are the biomes: what each quarry a
 * stand holds (`STANDS[...].quarry`, sim/woods.mjs) gives when it is brought down, where in the stand it is met, and when.
 *
 *   meat     food the kill makes, before the hunter's hand (`yieldFor`); what one person carries home on foot is five
 *            (sim/travel.mjs, the foot's carry), and the rest is left where it fell, said so in the family's record.
 *   hide     hides for the tanner (sim/shops.mjs): a deer's, a bear's skin, a buffalo's robe; none from a bird.
 *   covers   the ground a patch must be for it to come there: `timber`, `brush` or `open` (`patchCover`).
 *   months   the months it is there (0 January); absent, all year. Ducks and geese winter on the coast and the buffalo come
 *            down in the cold months (`HIST-TEX-104`, `HIST-TEX-109`).
 *   flocks   ducks and geese sit on the water in numbers: the wait is as short as on ground this good for game, whatever the
 *            ground (`stillTicks`).
 *   weight   how often it is what comes, against the others a patch could hold (`quarryAt`).
 *
 * Every number is invented; the pattern - bear in the timber and cane, buffalo on the western grass in winter, ducks and geese
 * on the coast in winter, javelina in the thickets, wild cattle and mustangs on the open prairie - is `HIST-TEX-103`, `-104`,
 * `-109`. ceiling: a kill bigger than one person carries leaves the rest where it fell; bringing the ox out to it is the way out.
 */
const WINTER = Object.freeze([10, 11, 0, 1, 2]);
/**
 * The buffalo's months: Berlandier, read whole 2026-09-20, has them going north "in April or May" and coming back "to the
 * southern regions **in September and October**" (`HIST-TEX-201`, `HIST-TEX-260`). September is theirs by his own sentence
 * and was left out when the months were first written; a herd already south in September is south in September.
 */
const BISON_MONTHS = Object.freeze([8, 9, 10, 11, 0, 1, 2, 3]);
export const GAME = Object.freeze({
  deer: Object.freeze({ a: 'a deer', meat: 10, hide: 1, covers: ['timber', 'brush', 'open'], weight: 3 }),
  turkey: Object.freeze({ a: 'a turkey', meat: 4, hide: 0, covers: ['timber', 'brush'], weight: 2 }),
  bear: Object.freeze({ a: 'a bear', meat: 12, hide: 1, covers: ['timber', 'brush'], weight: 1 }),
  // Rare, and deliberately so: Berlandier has the herds gone from the colonized districts "since 1828" and Kuykendall, who
  // found one on New Year's Creek in January 1822, "found no more during our residence there" (`HIST-TEX-262`). A buffalo
  // on the frontier grass is a thing that happens, not the other half of every prairie hunt.
  bison: Object.freeze({ a: 'a buffalo', meat: 20, hide: 1, covers: ['open'], months: BISON_MONTHS, range: 'west-of-the-lavaca', weight: 0.1 }),
  // No range of its own: the antelope's country **is** the stands that hold it (`chaparral` and `mixedgrass-prairie`,
  // sim/woods.mjs), and neither reaches a settled place. See `HIST-TEX-260` and the note below.
  pronghorn: Object.freeze({ a: 'an antelope', meat: 6, hide: 1, covers: ['open'], weight: 1 }),
  mustang: Object.freeze({ a: 'a mustang', meat: 10, hide: 1, covers: ['open', 'brush'], range: 'west-of-the-lavaca', weight: 1 }),
  cattle: Object.freeze({ a: 'a wild cow', meat: 12, hide: 1, covers: ['open', 'brush'], range: 'west-of-the-lavaca', weight: 1 }),
  javelina: Object.freeze({ a: 'a javelina', meat: 4, hide: 1, covers: ['brush'], range: 'west-of-the-lavaca', weight: 2 }),
  waterfowl: Object.freeze({ a: 'ducks and geese', meat: 4, hide: 0, covers: ['open', 'timber'], months: WINTER, range: 'by-water', flocks: 1, weight: 3 }),
});
/**
 * What a deer is worth on the open ground away from any timber's edge. It feeds out of the cover, and the sources put it
 * out there with the stock: Holley, 1836, of the deer, "even in the settlements, they are so plentiful and tame, that they
 * often come upon the plantations of farmers, and feed in company with the cattle" (p. 99), and Dilue Harris, on the open
 * prairie at Stafford's Point in 1834, "Wild horses and deer would feed near the house" (`HIST-TEX-261`). Two, not one, so
 * the open prairie is the deer's as well - the long wait there is `game`, not which animal comes.
 */
const OPEN_DEER_WEIGHT = 2;

/**
 * Where a quarry is found, over and above the stand that holds it (`GAME[...].range`, 2026-09-19; **a share and not a gate
 * since 2026-09-20**, `FIC-GONZ-170`). docs/BIOMES.md §7.1 wrote these limits into its own table - "wild cattle and mustangs
 * **west of the Lavaca**", "bison **north and west of the Colorado**, seasonal, rare", "waterfowl **in winter**" - and they
 * were lost when the table became a flat list of ids, so a wild cow or a mustang came to one prairie hunt in three at San
 * Felipe, Columbia and Liberty, and ducks sat on dry prairie forty miles from any water. The sources are plainest on two
 * lines:
 *
 *   `west-of-the-lavaca`     Woodman, 1835, of the wild horses: they "abound particularly on the river Nueces, and far in the
 *                            interior", but "Within the organized settlements they are not numerous, and are rapidly
 *                            diminishing" (p. 60); Holley puts the wild horses between the Guadalupe and the Nueces (p. 21).
 *                            Of the buffalo, Woodman: "Buffalo are seldom seen near the coast" (p. 60); Berlandier, through
 *                            Hornaday, has them gone from the colonized districts since 1828, while keeping bands that
 *                            "remain stationary throughout the whole year" on the Guadalupe and the Colorado - which is why
 *                            Gonzales, the frontier, keeps its buffalo and the Brazos does not (`HIST-TEX-200`,
 *                            `HIST-TEX-201`). **The Lavaca is the line** - §7.1's own, taken from the river the map draws,
 *                            and stricter for the buffalo than §7.1's Colorado (`FIC-GONZ-120`). It leaves the wild herds to
 *                            Béxar, Goliad, Refugio, Victoria, Gonzales and Mina, and thins them at San Felipe, Columbia,
 *                            Brazoria, Washington, Matagorda and Liberty.
 *
 *                            **Not a gate for the mustang (2026-09-20).** Woodman's own sentence says "not numerous", not
 *                            "none", and Dilue Harris, on the prairie at Stafford's Point between the Brazos and Buffalo
 *                            Bayou in 1834, wrote "Wild horses and deer would feed near the house", and of a lost horse that
 *                            "he must have gotten with the mustangs" (`HIST-TEX-261`). So east of the Lavaca a mustang is
 *                            `THIN` and not absent - about one patch in seven of what the same ground holds west of it. The
 *                            **wild cow** stays a gate: no account read puts unowned cattle inside the colonies in 1835, and
 *                            Almonte counted 25,000 head running loose in the Brazos department alone, so a cow on a
 *                            colonist's prairie is somebody's stock and shooting it is theft, not hunting (`HIST-TEX-263`).
 *                            The **javelina** stays a gate too: Holley puts the "Pecari or Mexican hog" on the frontiers
 *                            (p. 95) and Woodman has it "occasionally met with in small gangs" (p. 60) (`HIST-TEX-264`).
 *   `by-water`               Woodman, 1835: "In the winter season, the waters near the coast are literally covered with wild
 *                            fowl" (p. 59), and "Geese and ducks resort in great numbers to the interior waters" (p. 60);
 *                            Holley, 1836, has them "frequent the rivers and sea shore" (p. 100). The fowl are on the water,
 *                            coast or inland, and not on the dry prairie between (`HIST-TEX-202`, `HIST-TEX-265`).
 *                            A quarter of a mile is the game's reading of "on the water" (`FIC-GONZ-120`).
 *
 * **The antelope has no range here at all, and that is the correction of 2026-09-20** (`HIST-TEX-260`, `FIC-GONZ-171`). The
 * Lavaca was far too generous a line: it left the antelope at Goliad, where a hunt in eight brought one, and at Refugio and
 * Béxar. Neither of the two contemporary enumerations of Texas game names the animal at all - Woodman's own chapter (pp.
 * 59-60) and Holley's zoology (pp. 94-100) both list buffalo, deer, bear, peccary, wolf, panther, wildcat, wild horse,
 * turkey, duck, goose, brant, swan, raccoon, opossum, rabbit, squirrel and fox, and no antelope - and every dated sighting
 * is far west or south-west of the colonies. So the antelope is not held by a line but by its **stands**: `chaparral` and
 * `mixedgrass-prairie` only, neither of which reaches any settled place in the box (`quarryAt`, and the test that proves it).
 */
export const WATERFOWL_MILES = 0.25;
/** Marsh and swamp are water themselves, whatever the map's courses say runs near. */
const WET_STANDS = new Set(['marsh', 'salt-prairie', 'cypress-swamp']);

let lavaca = null;
/**
 * Whether a place lies west of the Lavaca, from the river the map draws: a ray due east crosses it an odd number of times
 * from the west bank. The river is run on due north from its head and due south from its mouth, so the country above it and
 * the coast below it fall on its own side. ceiling: the drawn bank is the line, so two neighbours on opposite banks are in
 * different countries for the wild herds - which is what a frontier on a river is.
 */
export function westOfTheLavaca(point) {
  if (!lavaca) {
    const segments = [];
    let north = null, south = null;
    for (const course of realTerrain().courses) {
      if (course.name !== 'Lavaca River') continue;
      for (let i = 1; i < course.points.length; i++) segments.push([course.points[i - 1], course.points[i]]);
      for (const p of course.points) { if (!north || p.y < north.y) north = p; if (!south || p.y > south.y) south = p; }
    }
    if (north) segments.push([{ x: north.x, y: -10000 }, north], [south, { x: south.x, y: 10000 }]);
    lavaca = { segments, at: new Map() };
  }
  const key = Math.round(point.y * 64);
  let crossings = lavaca.at.get(key);
  if (!crossings) {
    const y = key / 64;
    crossings = [];
    for (const [a, b] of lavaca.segments) {
      if ((a.y > y) === (b.y > y)) continue;
      crossings.push(a.x + (b.x - a.x) * ((y - a.y) / (b.y - a.y)));
    }
    lavaca.at.set(key, crossings);
  }
  let east = 0;
  for (const at of crossings) if (at > point.x) east++;
  return east % 2 === 1;
}

/**
 * What share of its own weight a quarry that wants a range keeps at this place: 1 in its own country, 0 outside it, and
 * `THIN` where the sources say a thing is there but "not numerous" (the mustang inside the settlements, above). `near` says
 * how far the nearest water is, in miles. A share of 0 takes the quarry off the place's list altogether.
 */
export const THIN = 0.15;
/** Which quarry the Lavaca thins rather than stops: the mustang alone (`HIST-TEX-261`). */
const THINNED_EAST = new Set(['mustang']);
function rangeShare(id, point, stand, near) {
  const range = GAME[id]?.range;
  if (!range) return 1;
  if (range === 'west-of-the-lavaca') return westOfTheLavaca(point) ? 1 : (THINNED_EAST.has(id) ? THIN : 0);
  return WET_STANDS.has(stand) || (near !== null && near <= WATERFOWL_MILES) ? 1 : 0;
}

/** A number in [0, 1) fixed for a patch: which of the quarry that could come there is the one that does. */
function patchShare(px, py) {
  let hash = 0x811c9dc5;
  for (const char of `${px}:${py}:quarry`) { hash ^= char.charCodeAt(0); hash = Math.imul(hash, 0x01000193) >>> 0; }
  return hash / 0x100000000;
}
/** How far a patch's neighbours are read for an edge: one patch each way. */
const EDGE_STEP = PATCH_MILES;

/** The stand and cover at a point, as the family's class reads its woods. */
function standAtPoint(world, point) {
  const rule = woodsRule(world);
  if (countsTrees(rule)) {
    const land = landAround();
    const patch = patchAt(point, { rule, nearCreek: land.nearCreek });
    return { stand: patch.stand, cover: patchCover(patch), px: patch.px, py: patch.py };
  }
  // A class that keeps timber by the water, or the invented country: timber is creek timber, brush is brush, open is prairie.
  const ground = groundAt(world, point);
  return { stand: ground === 'timber' ? 'creek' : ground === 'brush' ? 'brush' : 'prairie', cover: ground === 'prairie' ? 'open' : ground };
}

/**
 * What a place is for hunting: its stand and that stand's name, its cover, whether it is at the edge of timber, how good the
 * game is (0-1), and what a hunt there may find (`quarry`, docs/BIOMES.md §7.1: words only, but the deer).
 */
export function huntingPlace(world, point) {
  const rule = woodsRule(world);
  const { px, py, ...here } = standAtPoint(world, point);
  const around = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => standAtPoint(world, { x: point.x + dx * EDGE_STEP, y: point.y + dy * EDGE_STEP }).cover);
  const timberHere = here.cover === 'timber';
  const edge = around.some(cover => (cover === 'timber') !== timberHere);
  const stand = standOf(here.stand, countsTrees(rule) ? rule : 'landfire');
  const game = Math.min(1, (stand.game ?? 0) + (edge ? EDGE_GAME : 0));
  // What the stand holds, less what this particular place is out of the range of, and thinned where the sources thin it
  // (`rangeShare`): the wild herds west of the Lavaca, the mustang thin inside the settlements, the fowl on the water.
  const near = rule === 'biomes' ? landAround().nearestWater(point, () => true, WATERFOWL_MILES)?.distance ?? null : null;
  let quarry = null, shares = null;
  if (rule === 'biomes') {
    shares = new Map();
    for (const id of stand.quarry || []) {
      const share = rangeShare(id, point, here.stand, near);
      if (share > 0) shares.set(id, share);
    }
    quarry = [...shares.keys()];
  }
  return {
    ...here, name: stand.name, quarry, edge, game: Math.round(game * 100) / 100,
    // Which of them a hunter waiting here would see (`quarryAt`): the biomes only; every other class's hunt finds a deer.
    ...(quarry && { comes: quarryAt(quarry, here.cover, edge, monthOf(world), px, py, shares) }),
  };
}

/** The month the class's calendar stands in, 0 for January (sim/clock.mjs). */
const monthOf = world => dateOf(world, world.minute || 0).getUTCMonth();

/**
 * What a hunter waiting at a place would see: one of the quarry its stand holds, fixed for that patch of ground and the time of
 * year, or null where nothing is hunted. Of those the ground could hold - the right cover, and in their months - the patch's own
 * share picks one by weight (`GAME`), so the same place always brings the same quarry in the same season and a student who
 * looks about their land learns where the turkeys roost and where the ducks come in; nothing is left to chance on the day
 * (`FIC-GONZ-008`). A deer can be met anywhere game is - "found in every part of Texas" (`HIST-TEX-103`) - and out on open
 * ground away from the edge of any timber it is worth less than in cover (`OPEN_DEER_WEIGHT`). `shares` is what each quarry
 * keeps of its weight at this place (`rangeShare`); absent, each keeps all of it.
 */
export function quarryAt(quarry, cover, edge, month, px, py, shares = null) {
  if (!quarry?.length) return null;
  const could = quarry.filter(id => GAME[id] && GAME[id].covers.includes(cover) && (!GAME[id].months || GAME[id].months.includes(month)))
    .map(id => [id, (id === 'deer' && cover === 'open' && !edge ? OPEN_DEER_WEIGHT : GAME[id].weight) * (shares?.get(id) ?? 1)])
    .filter(([, weight]) => weight > 0);
  // Deer keep to every country that holds any game at all.
  if (!could.length) return 'deer';
  const total = could.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = patchShare(px, py) * total;
  for (const [id, weight] of could) { if (roll < weight) return id; roll -= weight; }
  return could.at(-1)[0];
}

/**
 * What a kill of this quarry brings home for this hand: the meat they can carry, and the hide whatever the load. `carry` is
 * what one person carries; `skillYield` the hunter's hand on the meat (sim/chores.mjs `yieldFor`).
 */
/**
 * What the winter did to a kill, as a share of its ordinary meat (`FIC-GONZ-177`, docs/BIOMES.md §17.3).
 *
 * Kuykendall, near Independence in 1822, of the months either side of the new year: "The deer were **lean** but the
 * turkies were **fat** and fine and constituted, for several months, the most valuable part of our subsistence"
 * (`HIST-TEX-264`). So the turkey is worth half as much again in the winter and the deer a quarter less, and a family
 * that hunts through Christmas is better off looking for the birds - which is what the man who lived it wrote down.
 *
 * Nothing else in `GAME` moves: the bear is denned, the buffalo is not in the colonies at all, and no source read says
 * what the winter did to a javelina.
 */
export const WINTER_MONTHS = Object.freeze([11, 0, 1]);
export const WINTER_YIELD = Object.freeze({ turkey: 1.5, deer: 0.75 });
export const winterShare = (quarryId, month) => (WINTER_MONTHS.includes(month) && WINTER_YIELD[quarryId]) || 1;

export function killYield(quarryId, carry, skillYield, month = null) {
  const game = GAME[quarryId] || GAME.deer;
  // The winter is not the same animal (sim/gathering.mjs `winterShare`, `FIC-GONZ-177`). Kuykendall, near Independence:
  // "The deer were lean but the turkies were fat and fine and constituted, for several months, the most valuable part of
  // our subsistence." So a turkey taken in December, January or February is worth half as much again and a deer a
  // quarter less, and a family that hunts through Christmas does better to look for the birds.
  const meat = skillYield(game.meat * (month === null ? 1 : winterShare(quarryId, month)));
  const carried = Math.min(meat, carry);
  return { meat, carried, left: Math.round((meat - carried) * 10000) / 10000, hide: game.hide };
}

/** The wait at a place for this quarry: ducks and geese sit on the water in numbers, and the wait for them is short. */
export const quarryGame = (game, quarryId) => Math.max(game, GAME[quarryId]?.flocks || 0);

/** What a quarry brings home, in the words on the control: "a bear: five food, all one can carry, and the skin". */
export function quarryYieldWords(quarryId, carry = 5) {
  const game = GAME[quarryId];
  if (!game) return '';
  const number = n => ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'][n] ?? String(n);
  const parts = [game.meat > carry ? `${number(carry)} food, all one can carry` : `${number(game.meat)} food`];
  if (game.hide) parts.push(quarryId === 'bear' ? 'the skin' : quarryId === 'bison' ? 'the robe' : 'the hide');
  if (game.flocks) parts.push('they come in quickly');
  const list = parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(', ')}, and ${parts.at(-1)}`;
  return `${game.a}: ${list}`;
}

/**
 * The quarry in the family's words: "Deer, turkey and bear keep to it." Nothing for a class of the old rules. What comes only
 * in some months is said so out of them: "Ducks and geese come in the winter." `month` is the class's (0 January).
 * stand-in: docs/ART_REQUESTS.md, request 2026-09-19 - the game of 1836. No picture: every quarry but the deer is words only,
 * and the hunt brings the place's own quarry (`quarryAt`), drawn only when it is a deer.
 */
export function quarryWords(quarry, month = null) {
  if (!quarry) return '';
  if (!quarry.length) return 'Nothing is hunted here.';
  const list = ids => {
    const names = ids.map(id => QUARRY[id] || id);
    const said = names.length === 1 ? names[0] : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`;
    return `${said.charAt(0).toUpperCase()}${said.slice(1)}`;
  };
  const away = month === null ? [] : quarry.filter(id => GAME[id]?.months && !GAME[id].months.includes(month));
  const here = quarry.filter(id => !away.includes(id));
  // Every quarry's name is a plural (QUARRY): "Deer keep to it", "Ducks and geese keep to it".
  return [here.length && `${list(here)} keep to it.`, away.length && `${list(away)} come in the winter.`].filter(Boolean).join(' ');
}

/** How many ticks the hunter waits still for the deer to come, where the ground is this good: one on the best, five on the poorest. */
export const stillTicks = (game, base = 1) => Math.min(5 * base, Math.ceil(base / Math.max(0.2, game)));

const inWater = (world, point) => {
  if (onRealLand(world)) {
    const height = landAround().heightAt(point.x, point.y);
    return !Number.isFinite(height) || height < 0.3;
  }
  return (world.map.terrain || []).some(feature => (feature.kind === 'river' || feature.kind === 'creek') && distanceToPolyline(point, feature.points) < (feature.kind === 'river' ? 0.14 : 0.06));
};

/** Why nobody can hunt at this place for this family, or null. Checked when the student looks and when the hunter is sent. */
export function huntRefusal(world, household, point) {
  if (!household) return 'No family to hunt for.';
  if (world.status === 'lobby') return 'The family hunts its land once the class has begun.';
  if (choosing(household)) return 'Choose where the house will stand first.';
  if (!Number.isFinite(point?.x) || !Number.isFinite(point?.y)) return 'Choose a place on your land to hunt.';
  const bounds = holdingOf(world, household).bounds;
  if (point.x < bounds.minX || point.x > bounds.maxX || point.y < bounds.minY || point.y > bounds.maxY) return 'That is not your land.';
  if (inWater(world, point)) return 'That is in the water.';
  return null;
}

const GAME_WORDS = [
  [0.9, 'Good ground for deer: the wait should not be long.'],
  [0.6, 'Fair ground for game.'],
  [0.35, 'Poor ground: a long wait for anything to come.'],
  [0, 'Open ground that game seldom crosses: the longest wait.'],
];

/** What the family would find hunting here, in its own words, or why it cannot. */
export function huntFacts(world, household, point) {
  const why = huntRefusal(world, household, point);
  if (why) return { can: false, why };
  const place = huntingPlace(world, point);
  const stand = place.name || 'open ground';
  const where = `${stand.charAt(0).toUpperCase()}${stand.slice(1)}${place.edge && place.cover === 'timber' ? ', at the edge of the timber,' : place.edge ? ', beside timber,' : ''} ${whereFromHouse(world, household, point)}.`;
  // What would come here, and what it would bring home: the control says it before anybody is sent (docs/BIOME_GAMEPLAY.md §3).
  const comes = place.comes ? `Waiting here, ${quarryYieldWords(place.comes)}.` : '';
  const flocking = place.comes && GAME[place.comes].flocks && quarryGame(place.game, place.comes) > place.game;
  const words = [where, flocking ? 'Ducks and geese sit on the water in numbers: the wait is short.' : GAME_WORDS.find(([least]) => place.game >= least)[1], quarryWords(place.quarry, monthOf(world)), comes].filter(Boolean).join(' ');
  return { can: true, stand: place.stand, cover: place.cover, edge: place.edge, game: place.game, ...(place.quarry && { quarry: place.quarry }), ...(place.comes && { comes: place.comes }), words };
}

/** What the hunt says the hunter is in: "the bottomland timber", "the prairie". */
export const placeWord = place => `the ${place.name || standOf(place.stand, 'landfire').name || 'open ground'}`;
