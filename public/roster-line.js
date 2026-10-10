// The journal's roster of the family in plain sentences (owner, 2026-10-09: the play-through found the family block reading like debug
// output - "Charity Hill: rest, Family 1 home, well" - the server's task word, its site id's name and the health word strung together).
// Each line is still the second, text way in to a person (docs/FAMILY_PANEL.md §8): pressing it chooses them, as before.
//
// It imports nothing, so the wording is tested headlessly (tests/roster-line.test.mjs).

/** The server's work words (`entity.task`) as a sentence says them. */
const DOING = Object.freeze({ rest: 'is resting', work: 'is working about the place', help: 'is helping where the call sent them', travel: 'is travelling' });
/** The health words (`entity.health.condition`) that are worth a sentence; `well` and `sound` say nothing. */
const HEALTH = Object.freeze({ tired: 'is tired', sick: 'is sick', wounded: 'is wounded', 'minor-injury': 'is hurt', dead: 'has died', captured: 'has been taken prisoner', lost: 'is lost' });

/**
 * One person's line: who they are, what they are doing and where, and how they are, in one or two short sentences.
 * `place(id)` names a site the way the map does; `home` is the family's own site, said as "at home"; `work(id)` the name of a
 * chore as its icon says it. The extras the roster always added (a question waiting, a rider) are passed in `also`.
 */
export function rosterLine(entity, { place = id => id || '', home = null, work = id => id, also = [] } = {}) {
  const name = entity?.name || 'Somebody';
  const condition = entity?.health?.condition || 'well';
  if (condition === 'dead' || condition === 'captured') return `${name} ${HEALTH[condition]}.`;
  const at = siteId => (siteId && siteId === home ? 'at home' : siteId ? `at ${place(siteId)}` : 'on the road');
  let doing;
  if (entity?.travel) doing = `is on the road to ${entity.travel.to === home ? 'home' : place(entity.travel.to) || 'town'}`;
  else if (entity?.chore?.id) doing = `is at work ${at(entity.location?.siteId)}: ${work(entity.chore.id)}`;
  else doing = `${DOING[entity?.task] || 'is resting'} ${at(entity?.location?.siteId)}`;
  const health = HEALTH[condition] ? ` ${firstName(entity)} ${HEALTH[condition]}.` : '';
  return `${name} ${doing}.${health}${also.filter(Boolean).map(one => ` ${one}`).join('')}`;
}
const firstName = entity => entity?.given || String(entity?.name || '').split(' ')[0] || 'They';
