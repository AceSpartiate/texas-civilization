// The one-rifle study (owner, 2026-09-24; docs/TOWNS.md §4b, open item 3): families nobody plays through the three class
// periods on the colonies, fifteen a class, reporting food at each period's end, household-ticks with no food, and deaths.
// Run against any tree to compare: node scripts/rifle-food-study.mjs [root] [seeds]. Record: docs/evidence/rifle-food-study.json.
import { fileURLToPath } from 'node:url';
const root = (process.argv[2] || fileURLToPath(new URL('..', import.meta.url))).replace(/\\/g, '/').replace(/\/$/, '');
const seeds = (process.argv[3] || 'rifle-a,rifle-b,rifle-c,rifle-d').split(',');
const { createGonzalesWorld } = await import(`file:///${root}/sim/gonzales.mjs`);
const { stepWorld } = await import(`file:///${root}/sim/world.mjs`);
const { beginSecondPeriod, beginThirdPeriod } = await import(`file:///${root}/sim/periods.mjs`);
const out = [];
for (const seed of seeds) {
  const world = createGonzalesWorld(seed, 15, { map: 'colonies', neighbours: true });
  world.status = 'running';
  const periods = [];
  let hungry = 0, hungryHouses = new Set(), rifleAway = 0;
  const run = label => {
    let ticks = 0;
    for (let t = 0; t < 12000 && !world.director.complete && world.status === 'running'; t++) {
      stepWorld(world); ticks++;
      for (const h of Object.values(world.households)) {
        if ((h.resources?.food ?? 0) <= 0) { hungry++; hungryHouses.add(h.id); }
        if (h.members.some(id => world.entities[id]?.carries?.items?.includes('rifle'))) rifleAway++;
      }
    }
    const houses = Object.values(world.households);
    periods.push({ label, ticks, meanFood: Math.round(houses.reduce((s, h) => s + (h.resources?.food ?? 0), 0) / houses.length * 10) / 10 });
  };
  run('autumn');
  beginSecondPeriod(world); world.status = 'running'; run('winter');
  beginThirdPeriod(world); world.status = 'running'; run('spring');
  const people = Object.values(world.entities).filter(e => e.kind === 'person' && e.householdId);
  const dead = people.filter(e => e.health?.condition === 'dead');
  const deathTexts = world.events.filter(e => e.householdId && /died|was killed|killed in|did not live|buried/i.test(e.text || '')).map(e => e.text);
  const sickDeaths = world.events.filter(e => e.householdId && /died of|fever|sickness|sick/i.test(e.text || '') && /died/i.test(e.text || '')).length;
  out.push({ seed, periods, hungryHouseTicks: hungry, housesEverHungry: hungryHouses.size, dead: dead.length, deadIds: dead.map(e => e.id), sickDeaths, rifleAwayHouseTicks: rifleAway, deathLines: deathTexts.length });
  console.error(seed, 'done');
}
console.log(JSON.stringify(out));
