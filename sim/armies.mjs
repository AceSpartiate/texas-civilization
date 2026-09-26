// The armies on the map (owner, 2026-09-17, playtesting: "there was no army. they were just off in the middle of no where.
// no mexican army, no texas army. nothing."), and, by the owner's choice, the Mexican columns marching in the spring.
//
// Everything here is already in the world: the force that marched on Béxar in 1835 (`world.army`, sim/army.mjs), the men in
// each winter service (`service.kind`: the garrison at Béxar, Fannin at Goliad, Houston's army in the spring), and the
// columns of the Runaway Scrape (sim/advance.mjs, `HIST-TEX-580` to `-597`). This module says where each one stands now and
// who may see it; the page draws a camp and its men, a column on the march, or a marker when it is far off (public/army-view.js).
//
// **No invented numbers.** A Texian army's strength here is the count of men the simulation actually holds in it - this
// class's own volunteers - and never a figure for the whole force, which the game does not model. A Mexican column's, since
// 2026-09-26, is the record's for the stretch of its march it is on (docs/battle-research/mexican-advance.md §6), or none where
// the record gives none; the men drawn are a sample of it.
import { houstonCamp, campName, yellowStone } from './houston.mjs';
import { COLUMN_SIGHT_MILES, columnsNow, foragersOf } from './advance.mjs';
import { battleState } from './battle-stage.mjs';

/** How near an army has to be for a family to see it, in miles. Beyond that it is not on their map at all. */
export const ARMY_SIGHT_MILES = 25;

const GONE = ['dead', 'captured'];
const serving = (world, kind) => Object.values(world.entities).filter(person => person.householdId
  && person.service?.status === 'serving' && person.service.kind === kind && !GONE.includes(person.health?.condition));

/** Where a site is, or null when this map has no such place. */
const at = (world, siteId) => { const site = world.map?.sites?.[siteId]; return site ? { x: site.x, y: site.y, place: site.name } : null; };

/**
 * Every army standing in the country right now, whoever is looking: the 1835 force on its march, the men of each winter
 * service where they serve, and each Mexican column on its dated road. `ours` counts this family's own men in it.
 */
export function armiesNow(world, householdId = null) {
  const found = [];
  const mine = person => person.householdId === householdId;
  // The force that gathered at Gonzales and marched on Béxar (sim/army.mjs): it carries its own place as it moves.
  if (world.army && world.army.members?.length) {
    const army = world.army;
    found.push({
      id: 'force', name: 'the Texian force', side: 'texian', x: army.x, y: army.y,
      place: army.camp || world.map?.sites?.[army.siteId]?.name || 'on the road',
      strength: army.members.length,
      ours: army.members.filter(id => mine(world.entities[id] || {})).length,
    });
  }
  // The winter's services, and Houston's army in the spring: the men are where the simulation puts them.
  const services = [
    { kind: 'garrison', id: 'garrison', name: 'the garrison at Béxar', side: 'texian' },
    { kind: 'fannin', id: 'fannin', name: "Fannin's command", side: 'texian' },
    { kind: 'regular', id: 'regulars', name: 'the regular army', side: 'texian' },
    { kind: 'auxiliary-year', id: 'auxiliary', name: 'the auxiliary volunteers', side: 'texian' },
    { kind: 'auxiliary-war', id: 'auxiliary-war', name: 'the auxiliary volunteers', side: 'texian' },
    { kind: 'matamoros', id: 'matamoros', name: 'the Matamoros men', side: 'texian' },
    { kind: 'houston', id: 'houston', name: "Houston's army", side: 'texian' },
  ];
  // While San Jacinto is fought the battle draws both armies where they stand on the field (sim/battles/san-jacinto.mjs).
  const jacinto = world.battles?.['san-jacinto'] ? battleState(world, 'san-jacinto') : null;
  const fieldHasThem = Boolean(jacinto && !jacinto.before && !jacinto.over);
  for (const service of services) {
    const men = serving(world, service.kind);
    if (!men.length || (service.kind === 'houston' && fieldHasThem)) continue;
    // Houston's army is wherever its camp is today (sim/houston.mjs); the rest stand where their men stand.
    const camp = service.kind === 'houston' ? at(world, houstonCamp(world)) : null;
    const where = camp || at(world, men[0].service.siteId) || (men[0].location && { x: men[0].location.x, y: men[0].location.y, place: world.map?.sites?.[men[0].location.siteId]?.name || 'the field' });
    if (!where) continue;
    const existing = found.find(army => army.id === service.id);
    const entry = existing || { id: service.id, name: service.kind === 'houston' ? `Houston's army at ${campName(world)}` : service.name, side: 'texian', ...where, strength: 0, ours: 0 };
    // The steamboat Yellow Stone at the Brazos crossing while the army is at Groce's (sim/houston.mjs `yellowStone`,
    // `HIST-TEX-089`). She travels with the army because she is only ever drawn where the army is: a page that may not see
    // this army is told nothing about her either.
    if (!existing && service.kind === 'houston') { const boat = yellowStone(world); if (boat) entry.boat = boat; }
    entry.strength += men.length;
    entry.ours += men.filter(mine).length;
    if (!existing) found.push(entry);
  }
  // The Mexican columns of the spring, each a body of men on its dated road with its commander, in camp or marching, and its
  // foragers ranging out (sim/advance.mjs, docs/battle-research/mexican-advance.md). The strength is the record's for that
  // stretch of the march (`HIST-TEX-580` to `-589`), where it has one: the men drawn are a sample of it, as a battle's are.
  for (const { column, head } of columnsNow(world)) {
    // From the moment the armies meet at San Jacinto the battle draws Santa Anna's army itself, camp, rout and prisoners
    // (sim/battles/san-jacinto.mjs), and Cos's men coming in over Vince's bridge: a column's marker would be a second army.
    // Urrea's column at Coleto likewise, while that fight is drawn.
    if (column.battle && world.battles?.[column.battle]) {
      const fight = battleState(world, column.battle);
      if (fight && !fight.before && (column.battle === 'san-jacinto' || !fight.over)) continue;
    }
    const place = head.camp ? `in camp at ${head.place}` : head.retreat ? `falling back toward ${head.towardName}` : head.towardName ? `making for ${head.towardName}` : 'on the march';
    found.push({
      id: column.id, name: column.name, side: 'mexican', x: head.x, y: head.y, place, strength: head.strength ?? null, ours: 0,
      ...(column.commander && { commander: column.commander }), camp: head.camp, moving: head.moving, right: head.right,
      ...(head.retreat && { retreat: true }), foragers: foragersOf(world, column, head),
    });
  }
  return found;
}

/**
 * The armies a page may be shown: the Host sees the country and so sees them all; a family sees an army it has men in, and
 * any army within `ARMY_SIGHT_MILES` of its own people or its land. Nothing else is sent, so a student's page cannot be read
 * for where an army is that the family could not know about.
 */
export function armiesSeen(world, householdId, role) {
  const armies = armiesNow(world, householdId);
  if (role === 'host') return armies;
  const household = householdId && world.households?.[householdId];
  if (!household) return [];
  const eyes = household.members.map(id => world.entities[id]).filter(person => person?.location && !GONE.includes(person.health?.condition)).map(person => person.location);
  const points = [...eyes];
  const home = world.map?.sites?.[household.homeSiteId];
  if (home) points.push(home);
  // A Mexican column is seen only where the family's own people are (2026-09-26, docs/SCRAPE.md §4): within
  // `COLUMN_SIGHT_MILES` of it or of its foragers. Not from the land the family has left, which nobody of it is standing on;
  // where the column went while they were away comes to them by word (sim/advance-word.mjs).
  const near = (army, reach) => [army, ...(army.foragers || [])].some(one => eyes.some(point => Math.hypot(point.x - one.x, point.y - one.y) <= reach));
  return armies.filter(army => army.side === 'mexican' ? near(army, COLUMN_SIGHT_MILES)
    : army.ours > 0 || points.some(point => Math.hypot(point.x - army.x, point.y - army.y) <= ARMY_SIGHT_MILES)).map(army => {
    if (army.side !== 'mexican') return army;
    // Only the foragers the family could see, and never which farm a party is riding for.
    const foragers = (army.foragers || []).filter(one => eyes.some(point => Math.hypot(point.x - one.x, point.y - one.y) <= COLUMN_SIGHT_MILES)).map(({ to, ...party }) => party);
    return { ...army, foragers };
  });
}
