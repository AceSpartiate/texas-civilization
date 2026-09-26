// The famous people on the campaign map, between their battles (docs/BATTLES.md §2c: "names on the map, no cards"; the
// audit's recommended P5; `FIC-GONZ-455`).
//
// Where each is comes from the roster's dated itinerary (sim/people.mjs `map`), read from the clock: Travis, Bowie and
// Crockett at Béxar before the siege; Mrs. Dickinson with Angelina, Joe and Ben walking from Béxar to Gonzales after the fall;
// Austin and then Burleson with the army of 1835; Houston with his army in the spring and the Twin Sisters with it from April
// 11; Santa Anna with his column; Emily West at New Washington and then made to go with Santa Anna's army. Nothing is stored:
// an old save opens with each of them where its minute puts them (no `saveVersion` moves).
//
// **Seen under the ordinary sight rules.** The Host sees the country and so sees every one of them; a family sees a famous
// person only when one of its own people is within `FAMOUS_SIGHT_MILES` of them - the same "standing where you could see"
// the town's other people are sent by (sim/town.mjs `observedBy`). A famous person drawn on a battlefield at this minute is
// the battle's to draw (sim/battle-stage.mjs `peopleOnFields`), never the map's too. Nothing about a fate is sent here.
import { PEOPLE } from './people.mjs';
import { momentOf } from './directors.mjs';
import { houstonCamp, campClock } from './houston.mjs';
import { columnHead, columns } from './road.mjs';
import { peopleOnFields } from './battle-stage.mjs';

/** How near one of a family's own people must be to see a famous person on the map, in miles: a town and its edges. */
export const FAMOUS_SIGHT_MILES = 3;
const GONE = ['dead', 'captured'];
/** Points of the map given by longitude and latitude from a site whose own is known (sim/battles/san-jacinto.mjs's scale). */
const REFERENCE = Object.freeze({ lynchburg: { lon: -95.0740, lat: 29.7690, east: 60.26, north: 68.88 } });

/** A moment of the itinerary on this class's clock: a key of the director's timeline, or a timeline minute (sim/people.mjs `on`). */
export const whenOf = (world, when) => typeof when === 'string' ? momentOf(world, when)
  : typeof when === 'object' ? momentOf(world, when.key) + (when.plus || 0) : when + campClock(world);

/** A small, fixed step aside for each person, so three at one town do not stand on one spot. Miles. */
function aside(id) {
  let hash = 2166136261;
  for (const character of id) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  const a = ((hash >>> 0) % 360) * Math.PI / 180;
  return { x: Math.cos(a) * 0.06, y: Math.sin(a) * 0.04 };
}

/** Where a leg of an itinerary puts its person at this minute, or null (a map without the place; a column not in the country). */
function placeOnLeg(world, leg, from, until) {
  const sites = world.map?.sites || {};
  if (leg.site) { const s = sites[leg.site]; return s ? { x: s.x, y: s.y, place: s.name } : null; }
  if (leg.road) {
    const [a, b] = leg.road.map(id => sites[id]);
    if (!a || !b) return null;
    const t = Math.max(0, Math.min(1, (world.minute - from) / Math.max(1, until - from)));
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, moving: t > 0 && t < 1, right: b.x >= a.x, place: `on the road to ${b.name}` };
  }
  if (leg.point) {
    const ref = REFERENCE[leg.point.near], s = sites[leg.point.near];
    if (!ref || !s) return null;
    return { x: s.x + (leg.point.lon - ref.lon) * ref.east, y: s.y - (leg.point.lat - ref.lat) * ref.north, place: leg.place };
  }
  if (leg.with === 'houston') { const s = sites[houstonCamp(world)]; return s ? { x: s.x, y: s.y, place: s.name } : null; }
  if (leg.with?.startsWith('column:')) {
    const column = columns().find(one => one.id === leg.with.slice(7));
    const head = column && columnHead(world, column, world.minute);
    return head ? { x: head.x, y: head.y, place: head.towardName ? `making for ${head.towardName}` : 'on the march', moving: true } : null;
  }
  if (leg.with === 'army:force') {
    const army = world.army;
    return army?.members?.length && Number.isFinite(army.x) ? { x: army.x, y: army.y, place: army.camp || 'with the army' } : null;
  }
  return null;
}

/** Every famous person on the campaign map now, wherever anybody could see them (the Host's view). */
export function famousNow(world) {
  if (!world.map?.sites) return [];
  const onField = peopleOnFields(world);
  const out = [];
  for (const who of Object.values(PEOPLE)) {
    if (!who.map || onField.has(who.id)) continue;
    for (const leg of who.map) {
      const from = whenOf(world, leg.from), until = whenOf(world, leg.until);
      if (!(world.minute >= from && world.minute < until)) continue;
      const at = placeOnLeg(world, leg, from, until);
      if (!at) break;
      const step = aside(who.id);
      out.push({
        id: who.id, name: who.name, side: who.side, art: who.art, x: at.x + step.x, y: at.y + step.y, doing: leg.doing || 'stand',
        moving: Boolean(at.moving), right: at.right ?? true, claimId: leg.claimId || who.claimId, ...(at.place && { place: at.place }),
        ...(who.thing && { thing: true }), ...(who.child && { child: true }),
      });
      break;
    }
  }
  return out;
}

/**
 * The famous people this page may be shown on the map (`FIC-GONZ-455`): the Host every one; a family only those within
 * `FAMOUS_SIGHT_MILES` of one of its own living people. The page is sent nothing about anybody else.
 */
export function famousSeen(world, householdId, role) {
  const all = famousNow(world);
  if (role === 'host') return all;
  const household = householdId && world.households?.[householdId];
  if (!household) return [];
  const eyes = household.members.map(id => world.entities[id]).filter(person => person?.location && !GONE.includes(person.health?.condition)).map(person => person.location);
  return all.filter(one => eyes.some(at => Math.hypot(at.x - one.x, at.y - one.y) <= FAMOUS_SIGHT_MILES));
}
