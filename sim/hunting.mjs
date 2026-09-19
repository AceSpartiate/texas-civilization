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

/** How much better the edge of timber is for game than the middle of a stand, added to its game, most 1. */
export const EDGE_GAME = 0.2;
/** How far a patch's neighbours are read for an edge: one patch each way. */
const EDGE_STEP = PATCH_MILES;

/** The stand and cover at a point, as the family's class reads its woods. */
function standAtPoint(world, point) {
  const rule = woodsRule(world);
  if (countsTrees(rule)) {
    const land = landAround();
    const patch = patchAt(point, { rule, nearCreek: land.nearCreek });
    return { stand: patch.stand, cover: patchCover(patch) };
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
  const here = standAtPoint(world, point);
  const around = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => standAtPoint(world, { x: point.x + dx * EDGE_STEP, y: point.y + dy * EDGE_STEP }).cover);
  const timberHere = here.cover === 'timber';
  const edge = around.some(cover => (cover === 'timber') !== timberHere);
  const stand = standOf(here.stand, countsTrees(rule) ? rule : 'landfire');
  const game = Math.min(1, (stand.game ?? 0) + (edge ? EDGE_GAME : 0));
  return { ...here, name: stand.name, quarry: rule === 'biomes' ? stand.quarry || [] : null, edge, game: Math.round(game * 100) / 100 };
}

/**
 * The quarry in the family's words: "Deer, turkey and bear keep to it." Nothing for a class of the old rules.
 * stand-in: docs/ART_REQUESTS.md, request 2026-09-19 - the game of 1836. No picture: every quarry but the deer is words only,
 * and the hunt itself still finds a deer (the next session's balance work chooses the quarry).
 */
export function quarryWords(quarry) {
  if (!quarry) return '';
  if (!quarry.length) return 'Nothing is hunted here.';
  const names = quarry.map(id => QUARRY[id] || id);
  const list = names.length === 1 ? names[0] : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`;
  // Every quarry's name is a plural (QUARRY): "Deer keep to it", "Ducks and geese keep to it".
  return `${list.charAt(0).toUpperCase()}${list.slice(1)} keep to it.`;
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
  const words = [where, GAME_WORDS.find(([least]) => place.game >= least)[1], quarryWords(place.quarry)].filter(Boolean).join(' ');
  return { can: true, stand: place.stand, cover: place.cover, edge: place.edge, game: place.game, ...(place.quarry && { quarry: place.quarry }), words };
}

/** What the hunt says the hunter is in: "the bottomland timber", "the prairie". */
export const placeWord = place => `the ${place.name || standOf(place.stand, 'landfire').name || 'open ground'}`;
