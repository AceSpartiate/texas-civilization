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
  const tripTo = new Map();
  const run = label => {
    let ticks = 0;
    for (let t = 0; t < 12000 && !world.director.complete && world.status === 'running'; t++) {
      stepWorld(world); ticks++;
      for (const h of Object.values(world.households)) {
        if ((h.resources?.food ?? 0) <= 0) { hungry++; hungryHouses.add(h.id); }
        if (h.members.some(id => world.entities[id]?.carries?.items?.includes('rifle'))) rifleAway++;
        for (const id of h.members) { const c = world.entities[id]?.chore; if (c?.id === 'visit-shop') tripTo.set(id, c.town || h.settlementId || 'gonzales'); }
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
  // The rifles lost with the dead and the taken, and the ones families nobody plays bought again (owner, 2026-09-24: "have automatic
  // families buy a replacement rifle"; docs/TOWNS.md §4e). Read from the families' own stories, dated.
  const day = minute => new Date(Date.UTC(1835, 8, 29) + minute * 60000).toISOString().slice(0, 10);
  const lost = world.events.filter(e => e.householdId && /The family's rifle was lost with/.test(e.text || '')).map(e => ({ householdId: e.householdId, date: day(e.minute) }));
  const rebought = world.events.filter(e => e.householdId && /bought a rifle from the gunsmith/.test(e.text || '')).map(e => ({ householdId: e.householdId, date: day(e.minute), by: e.actorId, home: world.households[e.householdId].settlementId || 'gonzales', town: tripTo.get(e.actorId) || null, paid: world.events.find(p => p.actorId === e.actorId && p.minute === e.minute && /paid .* at the gunsmith's/.test(p.text || ''))?.text.match(/paid (.*) at/)[1] || null }));
  const sent = world.events.filter(e => e.householdId && /set out: go to town to trade/.test(e.text || '')).length;
  const noRifle = Object.values(world.households).filter(h => Number.isInteger(h.rifles) && h.rifles === 0).map(h => h.id);
  out.push({ seed, periods, hungryHouseTicks: hungry, housesEverHungry: hungryHouses.size, dead: dead.length, deadIds: dead.map(e => e.id), sickDeaths, rifleAwayHouseTicks: rifleAway, deathLines: deathTexts.length, riflesLost: lost, riflesRebought: rebought, sentToTown: sent, endedWithoutRifle: noRifle });
  console.error(seed, 'done');
}
console.log(JSON.stringify(out));
