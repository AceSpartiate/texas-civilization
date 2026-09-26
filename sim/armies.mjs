// The armies on the map (owner, 2026-09-17, playtesting: "there was no army. they were just off in the middle of no where.
// no mexican army, no texas army. nothing."), and, by the owner's choice, the Mexican columns marching in the spring.
//
// Everything here is already in the world: the force that marched on Béxar in 1835 (`world.army`, sim/army.mjs), the men in
// each winter service (`service.kind`: the garrison at Béxar, Fannin at Goliad, Houston's army in the spring), and the
// columns of the Runaway Scrape (`columns`, `columnHead` in sim/road.mjs, `HIST-TEX-065` to `-067`). This module says where
// each one stands now and who may see it; the page draws a camp and its men, or a marker when it is far off
// (public/army-view.js).
//
// **No new history and no invented numbers.** An army's strength here is the count of men the simulation actually holds in
// it - this class's own volunteers - and never a figure for the whole force, which the record gives and the game does not
// model. A Mexican column has no strength at all: what is known of it is where its head is on its dated march.
import { houstonCamp, campName, yellowStone } from './houston.mjs';
import { columnHead, columns } from './road.mjs';
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
  // The Mexican columns of the spring, each a head on its dated road (sim/road.mjs). No strength: what the refugees knew was
  // that a column was coming, and how far off.
  for (const column of columns()) {
    const head = columnHead(world, column, world.minute);
    if (!head) continue;
    // From the moment the armies meet at San Jacinto the battle draws Santa Anna's army itself, camp, rout and prisoners
    // (sim/battles/san-jacinto.mjs): the column's marker would be a second Mexican army beside it.
    if (column.id === 'santa-anna' && jacinto && !jacinto.before) continue;
    found.push({ id: column.id, name: column.name, side: 'mexican', x: head.x, y: head.y, place: head.towardName ? `making for ${head.towardName}` : 'on the march', strength: null, ours: 0 });
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
  const points = household.members.map(id => world.entities[id]).filter(person => person?.location && !GONE.includes(person.health?.condition)).map(person => person.location);
  const home = world.map?.sites?.[household.homeSiteId];
  if (home) points.push(home);
  return armies.filter(army => army.ours > 0 || points.some(point => Math.hypot(point.x - army.x, point.y - army.y) <= ARMY_SIGHT_MILES));
}
