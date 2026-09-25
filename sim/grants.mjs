// The land marked out for each family, and how much of it the family holds.
//
// docs/LAND_GRANTS.md §3, step 1. The 1825 colonization law gave a family that only farmed a
// labor of land, and one that also raised stock enough grazing to make a league, with the labor
// besides (`HIST-GONZ-036`). It did not give more land for more children, so neither does this.
// A family decides in the lobby whether it drives stock in behind the wagon, and that decides
// which of the two it holds.
//
// **Every grant is laid out when the world is made, at the size a stock-raising family would
// hold**, and never moves. A family without stock holds a labor round its house inside that.
// So the stock choice changes how much land a family holds and never where anybody's land is,
// which is what makes the grants pre-determined, lets them be drawn before Start, and needs no
// hook in the Start transition (`sim/headless.mjs` starts a class without `server/app.mjs`).
// The layout reads only the map, and takes no draw from the world's random stream, so every
// seed still makes the same land, crops and town.
//
// That these grants were marked out for families arriving in September 1835, with titles pending,
// is invented (`FIC-GONZ-025`): DeWitt's colony recorded no arrivals after April 1831 and its
// surveys were done in 1831-32 (`HIST-GONZ-037`). So is where each lies and its shape.
//
// A class saved before grants has none stored. Its layout is worked out from its own map the
// same way, which gives it exactly the land a new class on that map would have, so no save
// version moved; and nothing in such a class drove stock, so it holds a labor.
import { OPENING_HERD } from './stock.mjs';
import { STOCK_SPACE, spaceOf, wagonCount, wagonRoom } from './wagon.mjs';

export const LABOR_ACRES = 177.1;
export const LEAGUE_AND_LABOR_ACRES = 4605.5;
const ACRES_PER_SQUARE_MILE = 640;
const sideOf = acres => Math.sqrt(acres / ACRES_PER_SQUARE_MILE);
/** About 0.53 miles. */
export const LABOR_SIDE = sideOf(LABOR_ACRES);
/** About 2.68 miles. */
export const RESERVE_SIDE = sideOf(LEAGUE_AND_LABOR_ACRES);
/**
 * How far clear of anybody else's grant a family's house stands.
 *
 * More than half a labor's side, so whatever the neighbours were given, a labor centred on this
 * house always fits - which is what guarantees every family at least a labor. Invented.
 */
export const HOUSE_CLEARANCE = 0.35;

const round = value => { const fixed = +value.toFixed(4); return fixed === 0 ? 0 : fixed; };
const rectAround = (home, width, height, fx, fy) => ({ minX: home.x - width * fx, minY: home.y - height * fy, maxX: home.x + width * (1 - fx), maxY: home.y + height * (1 - fy) });
const overlaps = (a, b) => a.minX < b.maxX && b.minX < a.maxX && a.minY < b.maxY && b.minY < a.maxY;
const near = (rect, point, margin) => point.x > rect.minX - margin && point.x < rect.maxX + margin && point.y > rect.minY - margin && point.y < rect.maxY + margin;
const inside = (rect, point, margin) => point.x >= rect.minX + margin && point.x <= rect.maxX - margin && point.y >= rect.minY + margin && point.y <= rect.maxY - margin;
export const areaAcres = rect => (rect.maxX - rect.minX) * (rect.maxY - rect.minY) * ACRES_PER_SQUARE_MILE;
// Whole acres a grant holds. Its edges are stored to a few feet, which can shave a fraction of an acre off a full grant.
const grantAcres = grant => Math.round(areaAcres(grant) > LEAGUE_AND_LABOR_ACRES - 1 ? LEAGUE_AND_LABOR_ACRES : areaAcres(grant));

// Where a grant may lie round its house, nearest-centred first: the square, then long lots either
// way. A house on a long lot's end is how river frontage was taken, so off-centre is not a defect.
const SHAPES = [[1, 1], [Math.SQRT1_2, Math.SQRT2], [Math.SQRT2, Math.SQRT1_2]];
const FRACTIONS = [0.5, 0.35, 0.65, 0.2, 0.8, 0.1, 0.9];

/**
 * Every homestead's grant, laid out in household order, as `{ [homeSiteId]: bounds }`.
 *
 * Each takes the first place, nearest centred on its house, that overlaps no grant already laid
 * out and comes within `HOUSE_CLEARANCE` of no other house.
 * ceiling: first come, first served, in household order. A crowded class can leave a later family
 * squeezed where a fairer layout would share the ground; nothing is taken from anybody's labor.
 * A real metes-and-bounds survey along the rivers is the way out.
 */
export function layOutGrants(sites) {
  const homes = Object.values(sites).filter(site => site.kind === 'homestead')
    .sort((a, b) => Number(a.id.split('-')[1]) - Number(b.id.split('-')[1]));
  const placed = {}, rects = [];
  for (const home of homes) {
    const others = homes.filter(other => other !== home);
    const fits = rect => inside(rect, home, LABOR_SIDE / 2) && !rects.some(taken => overlaps(taken, rect)) && !others.some(other => near(rect, other, HOUSE_CLEARANCE));
    const candidates = [];
    for (const [w, h] of SHAPES) for (const fx of FRACTIONS) for (const fy of FRACTIONS) {
      const rect = rectAround(home, RESERVE_SIDE * w, RESERVE_SIDE * h, fx, fy);
      candidates.push({ rect, off: Math.hypot((rect.minX + rect.maxX) / 2 - home.x, (rect.minY + rect.maxY) / 2 - home.y) });
    }
    candidates.sort((a, b) => a.off - b.off);
    let chosen = candidates.find(candidate => fits(candidate.rect))?.rect;
    // ceiling: squeezed. The largest square centred on the house that fits, never less than a labor.
    if (!chosen) {
      let low = LABOR_SIDE, high = RESERVE_SIDE;
      for (let i = 0; i < 30; i++) {
        const mid = (low + high) / 2;
        if (fits(rectAround(home, mid, mid, 0.5, 0.5))) low = mid; else high = mid;
      }
      chosen = rectAround(home, low, low, 0.5, 0.5);
    }
    rects.push(chosen);
    placed[home.id] = Object.fromEntries(Object.entries(chosen).map(([key, value]) => [key, round(value)]));
  }
  return placed;
}

const layouts = new WeakMap();
/** The land marked out for this family: stored on a new class, worked out from the map for an old one. */
export function grantOf(world, household) {
  if (household.grant) return household.grant;
  if (!layouts.has(world.map)) layouts.set(world.map, layOutGrants(world.map.sites));
  return layouts.get(world.map)[household.homeSiteId];
}

/**
 * What this family holds: its kind, acres and bounds.
 *
 * With stock, the whole grant, whose acres are a league and a labor unless the class was so crowded
 * it was squeezed (and then it says its true acres). Without, a labor round the house, inside the grant - round the
 * surveyor's mark the house first stood at, where a family on the real land has chosen a site of its own.
 */
export function holdingOf(world, household) {
  const grant = grantOf(world, household);
  if (household.stock) return { kind: 'league-and-labor', acres: grantAcres(grant), bounds: grant };
  // Round the surveyor's mark once the family has set its house elsewhere on it (sim/homesite.mjs), so the labor stays put.
  const home = household.mark || world.map.sites[household.homeSiteId];
  const half = LABOR_SIDE / 2;
  const clamp = (value, min, max) => Math.min(Math.max(value, min + half), max - half);
  const x = clamp(home.x, grant.minX, grant.maxX), y = clamp(home.y, grant.minY, grant.maxY);
  return { kind: 'labor', acres: Math.round(LABOR_ACRES), bounds: { minX: round(x - half), minY: round(y - half), maxX: round(x + half), maxY: round(y + half) } };
}

/** The words for a holding, for the family's story and its book. */
export const holdingWords = holding => holding.kind === 'labor'
  ? `A labor of land, ${holding.acres} acres, is marked out for the family. No title has been issued.`
  : `A league and a labor of land, ${holding.acres.toLocaleString('en-US')} acres, is marked out for the family. No title has been issued.`;

/** Why this family cannot drive stock in (or leave it behind) now, or null when it can. */
export function stockRefusal(world, household, stock) {
  if (!household) return 'No family to decide for.';
  if (world.status !== 'lobby') return 'The class has begun. The family has the stock it drove in.';
  if (!household.load) return 'This family packed its wagon before there was any choosing, and it came without stock.';
  if (stock === undefined) return null;
  if (typeof stock !== 'boolean') return 'Say whether the family drives stock in, yes or no.';
  // The herd's keep comes out of the family's wagons together: two wagons have thirty-two spaces, and the stock takes two of them.
  if (stock && !household.stock && spaceOf(household.load) > wagonRoom(household) - STOCK_SPACE) {
    return `Driving stock leaves the ${wagonCount(household) > 1 ? 'wagons' : 'wagon'} ${wagonRoom(household) - STOCK_SPACE} spaces, and ${wagonCount(household) > 1 ? 'they are' : 'it is'} loaded with ${spaceOf(household.load)}. Take something out first.`;
  }
  return null;
}

/** Drive stock in, or not. Nothing is recorded: it is said once, when the family reaches its land. */
export function setStock(world, household, stock) {
  const why = stockRefusal(world, household, stock);
  if (why) throw new Error(why);
  if (stock) household.stock = true; else delete household.stock;
}

/**
 * For the family's own panel: what it holds, and in the lobby whether that can still change.
 *
 * `herd` is what the choice actually brings as well as the acres (`OPENING_HERD`, docs/STOCK.md §3). Until 2026-09-21 the
 * panel offered the land and the wagon cost and never said the family arrived with animals at all, which was the choice's
 * largest effect since the herd was built on 2026-09-20 - a screen relying on a consequence it had not said out loud.
 */
export function grantProjection(world, household) {
  const holding = holdingOf(world, household);
  if (world.status !== 'lobby' || !household.load) return { grant: holding };
  const why = stockRefusal(world, household);
  return { grant: holding, stockChoice: { can: !why, ...(why && { why }), laborAcres: Math.round(LABOR_ACRES), stockAcres: grantAcres(grantOf(world, household)), space: STOCK_SPACE, herd: { ...OPENING_HERD } } };
}

/** A stored grant is a real rectangle round the house, and a stock mark is `true` or absent. */
export function grantInvalid(world, household) {
  if (household.stock !== undefined && household.stock !== true) return 'Invalid stock';
  if (household.grant === undefined) return null;
  const home = world.map.sites[household.homeSiteId];
  const grant = household.grant;
  if (!['minX', 'minY', 'maxX', 'maxY'].every(key => Number.isFinite(grant[key])) || grant.minX >= grant.maxX || grant.minY >= grant.maxY) return 'Invalid land grant';
  if (!home || !inside(grant, home, 0)) return 'A land grant must hold its own house';
  return null;
}
