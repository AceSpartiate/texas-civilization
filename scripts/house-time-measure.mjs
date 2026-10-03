// How long the first house takes to raise, in ticks and real minutes at each pace (owner, 2026-10-02: "it takes too long to
// build the house at the start of the game"; docs/WOODS_AND_BUILDING.md §6.11).
//
// A colonies class of fifteen families, each on its land with its house site chosen, the round-log cabin planned (the plan the
// chooser offers first and every guide names), and its grown people set to it on auto the way the owner's acceptance test does
// (tests/auto-house.test.mjs): the first fells, the second builds, and in the *whole family* mode every grown person after them
// alternates, felling then building. Counted from the first order to the tick the first pen is finished - the family under its
// own roof (`houseSettled`) - and to the tick the whole plan (the chimney) stands. Families whose land has no timber fetch their
// logs with the wagon, as *Fell trees* sends them. Families with one grown person are counted alone.
//
//   node scripts/house-time-measure.mjs [--seeds a,b,c] [--count 15] [--json out.json]
import { writeFileSync } from 'node:fs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, rollFamily, stepWorld } from '../sim/world.mjs';
import { tooYoung } from '../sim/family.mjs';
import { holdingOf } from '../sim/grants.mjs';
import { siteFactsFor } from '../sim/homesite.mjs';
import { houseBuilt, houseSettled } from '../sim/houses.mjs';
import { PACES } from '../server/app.mjs';
import { houseStillWants, logsOnPile, pileFull } from '../sim/woodpile.mjs';

const arg = (name, fallback) => { const at = process.argv.indexOf(`--${name}`); return at > 0 ? process.argv[at + 1] : fallback; };
const seeds = arg('seeds', 'house-a,house-b,house-c').split(',');
const count = Number(arg('count', 15));
const out = arg('json', null);
const LIMIT = 900;

const grid = (bounds, side = 7) => {
  const places = [];
  for (let i = 0; i < side; i++) for (let j = 0; j < side; j++) places.push({ x: +(bounds.minX + (bounds.maxX - bounds.minX) * (i + 0.5) / side).toFixed(3), y: +(bounds.minY + (bounds.maxY - bounds.minY) * (j + 0.5) / side).toFixed(3) });
  return places;
};

function run(seed, mode) {
  const world = createGonzalesWorld(seed, count, { map: 'colonies' });
  // Every family rolled, as a class's are in the lobby: its children too, who shelter from the weather and want somebody with them.
  for (const household of Object.values(world.households)) rollFamily(world, household);
  world.status = 'running';
  for (let tick = 0; tick < 200 && Object.values(world.households).some(household => household.arriving); tick++) stepWorld(world);
  const families = Object.values(world.households);
  for (const household of families) {
    household.played = true;
    const site = grid(holdingOf(world, household).bounds).find(point => siteFactsFor(world, household, point).can);
    if (site) applyAction(world, household.id, { action: 'choose-site', ...site });
  }
  for (let tick = 0; tick < 60 && families.some(household => household.members.some(id => world.entities[id].travel)); tick++) stepWorld(world);
  const begun = world.tick, rows = {};
  if (process.env.SHOW_BEGUN) console.log("begun at tick", begun, "minute", world.minute);
  for (const household of families) {
    // A family whose land offered no site on the measure's grid is left out: it never began.
    if (houseSettled(household) || household.choosingSite) continue;
    try { applyAction(world, household.id, { action: 'plan-house', layout: 'round-log' }); } catch { continue; }
    const grown = household.members.map(id => world.entities[id]).filter(person => person.kind === 'person' && !tooYoung(person) && person.location?.siteId === household.homeSiteId);
    const crew = mode === 'family' ? grown : mode === 'stocked' ? grown.slice(0, 1) : grown.slice(0, 2);
    // `stocked`: the logs already on the pile, one person building - the work on the house alone, no felling.
    if (mode === 'stocked') household.logs = { wall: 60, sill: 0, poor: 0 };
    crew.forEach((person, i) => {
      applyAction(world, household.id, { action: 'set-auto', entityId: person.id, auto: true });
      const chore = mode === 'stocked' ? 'build-house' : i % 2 === 0 ? 'fell-trees' : 'build-house';
      try { applyAction(world, household.id, { action: 'chore', entityId: person.id, chore }); } catch { /* waits for logs, remembered */ }
    });
    // A lone grown person fells first, then builds: auto remembers one task, so they are sent to the felling and the house in turn.
    rows[household.id] = { hands: crew.length, grown: grown.length, people: household.members.length, roof: null, whole: null, pen: null, logs: null };
  }
  // The children are given something to do, as a student does: their own automation, put on again each time it goes off. Without
  // it every child of two to nine goes to a parent and stops their work all day (sim/childhood.mjs), which no student playing leaves.
  const keepChildrenBusy = () => {
    for (const id of Object.keys(rows)) for (const member of world.households[id].members) {
      const child = world.entities[member];
      if (child?.kind === 'person' && child.age >= 2 && child.age < 10 && !child.auto && !child.health?.grave) {
        try { applyAction(world, id, { action: 'set-auto', entityId: child.id, auto: true }); } catch { /* not now */ }
      }
    }
  };
  for (let tick = 0; tick < LIMIT && Object.values(rows).some(row => row.whole === null); tick++) {
    keepChildrenBusy();
    stepWorld(world);
    for (const [id, row] of Object.entries(rows)) {
      const household = world.households[id];
      if (row.roof === null && houseSettled(household)) row.roof = world.tick - begun;
      if (row.pen === null && household.improvements?.cabin === 'sound') row.pen = world.tick - begun;
      if (row.logs === null && houseStillWants(world, household) <= logsOnPile(household)) row.logs = world.tick - begun;
      if (row.whole === null && houseBuilt(household)) row.whole = world.tick - begun;
      // A lone hand: felling on auto until the pile has enough (auto stops by itself), then the house.
      if (row.hands === 1 && row.roof === null) {
        const person = household.members.map(m => world.entities[m]).find(p => p.kind === 'person' && !tooYoung(p) && p.location?.siteId === household.homeSiteId);
        if (person && !person.chore && person.order?.chore === 'fell-trees' && pileFull(world, household)) {
          try { applyAction(world, id, { action: 'chore', entityId: person.id, chore: 'build-house' }); } catch { /* next tick */ }
        }
      }
    }
  }
  if (process.env.SHOW_UNFINISHED) for (const [id, row] of Object.entries(rows)) if (row.pen === null) { const hh = world.households[id]; console.log(seed, mode, id, JSON.stringify(row), hh.logs, JSON.stringify(hh.tools), hh.members.map(m => world.entities[m]).filter(p => !tooYoung(p)).map(p => p.chore?.id + ":" + (p.chore?.doing || p.task)).join(", ")); }
  return rows;
}

const median = list => { const s = [...list].sort((a, b) => a - b); return s.length ? (s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2) : null; };
const pct = (list, p) => { const s = [...list].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : null; };
const minutes = (ticks, pace) => ticks === null ? null : Math.round(ticks * PACES[pace] / 600) / 100;

const result = { seeds, count, modes: {} };
for (const mode of ['stocked', 'pair', 'family']) {
  const all = seeds.flatMap(seed => Object.entries(run(seed, mode)).map(([id, row]) => ({ ...row, id: `${seed}:${id}` })).filter(row => row.hands >= (mode === "pair" ? 2 : 1)));
  if (process.env.SHOW_ROWS === mode) for (const row of [...all].sort((a, b) => (b.pen ?? 999) - (a.pen ?? 999)).slice(0, 8)) console.log(JSON.stringify(row));
  const roofs = all.map(row => row.pen).filter(n => n !== null), wholes = all.map(row => row.whole).filter(n => n !== null);
  const logsIn = all.map(row => row.logs).filter(n => n !== null);
  const summary = {
    families: all.length, unfinished: all.filter(row => row.pen === null).length,
    hands: median(all.map(row => row.hands)),
    logsTicks: { median: median(logsIn), p90: pct(logsIn, 0.9) },
    roofTicks: { median: median(roofs), p90: pct(roofs, 0.9), max: Math.max(...roofs) },
    wholeTicks: { median: median(wholes), p90: pct(wholes, 0.9) },
    roofMinutes: Object.fromEntries(Object.keys(PACES).map(pace => [pace, { median: minutes(median(roofs), pace), p90: minutes(pct(roofs, 0.9), pace) }])),
  };
  result.modes[mode] = summary;
  console.log(mode, JSON.stringify(summary));
}
if (out) writeFileSync(out, `${JSON.stringify(result, null, 2)}\n`);
