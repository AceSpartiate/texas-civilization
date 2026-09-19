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
export const GAME = Object.freeze({
  deer: Object.freeze({ a: 'a deer', meat: 10, hide: 1, covers: ['timber', 'brush', 'open'], weight: 3 }),
  turkey: Object.freeze({ a: 'a turkey', meat: 4, hide: 0, covers: ['timber', 'brush'], weight: 2 }),
  bear: Object.freeze({ a: 'a bear', meat: 12, hide: 1, covers: ['timber', 'brush'], weight: 1 }),
  bison: Object.freeze({ a: 'a buffalo', meat: 20, hide: 1, covers: ['open'], months: WINTER, weight: 1 }),
  pronghorn: Object.freeze({ a: 'an antelope', meat: 6, hide: 1, covers: ['open'], weight: 1 }),
  mustang: Object.freeze({ a: 'a mustang', meat: 10, hide: 1, covers: ['open', 'brush'], weight: 1 }),
  cattle: Object.freeze({ a: 'a wild cow', meat: 12, hide: 1, covers: ['open', 'brush'], weight: 1 }),
  javelina: Object.freeze({ a: 'a javelina', meat: 4, hide: 1, covers: ['brush'], weight: 2 }),
  waterfowl: Object.freeze({ a: 'ducks and geese', meat: 4, hide: 0, covers: ['open', 'timber'], months: WINTER, flocks: 1, weight: 3 }),
});
/** What a deer is worth on the open ground away from any timber's edge: it feeds out of the cover, and is seldom far out. */
const OPEN_DEER_WEIGHT = 1;

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
  const quarry = rule === 'biomes' ? stand.quarry || [] : null;
  return {
    ...here, name: stand.name, quarry, edge, game: Math.round(game * 100) / 100,
    // Which of them a hunter waiting here would see (`quarryAt`): the biomes only; every other class's hunt finds a deer.
    ...(quarry && { comes: quarryAt(quarry, here.cover, edge, monthOf(world), px, py) }),
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
 * ground away from the edge of any timber it is seldom (`OPEN_DEER_WEIGHT`).
 */
export function quarryAt(quarry, cover, edge, month, px, py) {
  if (!quarry?.length) return null;
  const could = quarry.filter(id => GAME[id] && GAME[id].covers.includes(cover) && (!GAME[id].months || GAME[id].months.includes(month)))
    .map(id => [id, id === 'deer' && cover === 'open' && !edge ? OPEN_DEER_WEIGHT : GAME[id].weight]);
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
export function killYield(quarryId, carry, skillYield) {
  const game = GAME[quarryId] || GAME.deer;
  const meat = skillYield(game.meat);
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
