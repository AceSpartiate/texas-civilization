// Deaths by hunger in whole classes (owner, 2026-09-30: "player characters *can* die of starvation. players should have to ensure
// there's enough food"; docs/HUNGER.md §6). Measures only; nothing here changes a rule.
//
// Two kinds of student, every family of the class played by one of them and at its screen the whole time:
//
//   idle     gives no orders at all: grown people stay at what they were founded to (working about the place), children rest,
//            and the family never leaves in the spring unless the order's own lapse sends it (docs/BALANCE.md §16.2).
//   playing  farms, hunts, fishes and forages as the director does for a family nobody plays (sim/neighbours.mjs `thinkFor`):
//            the field first, the hunt or the four gathering works when the house is short, the herd at the last day or two,
//            powder bought before the last shot, and at once east when told to leave with all the food that fits.
//
// How a playing family is run (the harness, not a rule): its turn is taken between ticks, every `THINK_EVERY` ticks as the
// director's is, with the family marked `absent` for that turn only so that the director's town errands are offered to it
// (sim/chores.mjs `directed`), as scripts/balance-measure.mjs does. During the tick itself it is present, so its hunger counts and
// a starving person's real minute runs (a tick stepped in process counts as one at the Study pace). The war's questions to it wait
// their real time and lapse, since this student farms and does not fight; the settlement's call is answered as the director does.
//
// Run: node scripts/hunger-balance.mjs [--seeds a,b,c] [--families 15] [--modes idle,playing] [--out docs/evidence/hunger-balance.json]
import { writeFileSync, mkdirSync } from 'node:fs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, projectWorld, rollFamily, stepWorld } from '../sim/world.mjs';
import { beginSecondPeriod, beginThirdPeriod } from '../sim/periods.mjs';
import { THINK_EVERY, thinkFor } from '../sim/neighbours.mjs';
import { STUDY_TICK_MS } from '../sim/crops.mjs';

const arg = (name, fallback) => { const at = process.argv.indexOf(`--${name}`); return at > 0 ? process.argv[at + 1] : fallback; };
const seeds = arg('seeds', 'hunger-1,hunger-2,hunger-3').split(',');
const families = Number(arg('families', '15'));
const modes = arg('modes', 'idle,playing').split(',');
const out = arg('out', null);
const DAY = 1440;

function runClass(seed, mode) {
  // As a served class makes it: the director runs any family nobody plays (every family here is played).
  const world = createGonzalesWorld(seed, families, { map: 'colonies', neighbours: true });
  for (const household of Object.values(world.households)) { rollFamily(world, household); household.played = true; }
  world.status = 'running';
  const households = Object.values(world.households);
  const people = households.reduce((sum, household) => sum + household.members.length, 0);
  const starvingAt = new Map(), deaths = [];
  // The worst stage each family's people reached, and the days any of them spent hungry or worse.
  const worst = new Map(), hungryDays = new Map();
  const RANK = { hungry: 1, weak: 2, starving: 3 };
  let ticks = 0;
  const turn = () => {
    if (mode !== 'playing') return;
    households.forEach((household, index) => {
      if (household.arriving || (world.tick + index) % THINK_EVERY !== 0) return;
      household.absent = true;
      try { thinkFor(world, household, { project: id => projectWorld(world, id, 'student', { includeMap: false }), act: input => applyAction(world, household.id, input) }); } catch { /* a refused order is the family's own business */ }
      delete household.absent;
    });
  };
  const seen = new Set();
  const runPeriod = period => {
    for (let i = 0; i < 12000 && !world.director.complete && world.status === 'running'; i++) {
      const was = world.minute;
      stepWorld(world); ticks++;
      for (const household of households) if (household.members.some(id => RANK[world.entities[id]?.hunger?.stage])) hungryDays.set(household.id, (hungryDays.get(household.id) || 0) + (world.minute - was) / DAY);
      for (const person of Object.values(world.entities)) {
        if (person.kind !== 'person' || !person.householdId) continue;
        if (person.hunger?.stage === 'starving' && !starvingAt.has(person.id)) starvingAt.set(person.id, ticks);
        const rank = RANK[person.hunger?.stage] || 0;
        if (rank > (worst.get(person.householdId) || 0)) worst.set(person.householdId, rank);
      }
      for (const event of world.events.slice(-40)) {
        if (event.hunger !== 'died' || seen.has(event.id)) continue;
        seen.add(event.id);
        const person = world.entities[event.actorId];
        deaths.push({ period, day: Math.round(event.minute / DAY), age: person.age ?? null, road: /on the road/.test(event.text) || Boolean(world.households[person.householdId]?.flight && world.households[person.householdId].flight.status !== 'home'), householdId: person.householdId, realSecondsStarving: starvingAt.has(person.id) ? Math.round((ticks - starvingAt.get(person.id)) * STUDY_TICK_MS / 1000) : null });
      }
      turn();
    }
  };
  runPeriod(1);
  const afterFirst = deaths.length;
  beginSecondPeriod(world); world.status = 'running';
  runPeriod(2);
  beginThirdPeriod(world); world.status = 'running';
  runPeriod(3);
  const hit = new Set(deaths.map(death => death.householdId));
  const wiped = households.filter(household => household.members.every(id => ['dead', 'captured'].includes(world.entities[id].health?.condition))).length;
  return {
    seed, mode, families, people, ticks, deaths: deaths.length, period1: afterFirst, period2: deaths.filter(d => d.period === 2).length, period3: deaths.filter(d => d.period === 3).length,
    onRoad: deaths.filter(d => d.road).length, familiesHit: hit.size, wiped, firstDay: deaths.length ? Math.min(...deaths.map(d => d.day)) : null,
    under6: deaths.filter(d => Number.isFinite(d.age) && d.age < 6).length, grown: deaths.filter(d => !Number.isFinite(d.age) || d.age >= 16).length,
    familiesHungry: [...worst.values()].filter(rank => rank >= 1).length, familiesWeak: [...worst.values()].filter(rank => rank >= 2).length, familiesStarving: [...worst.values()].filter(rank => rank >= 3).length,
    hungryDaysMedian: (() => { const days = households.map(household => hungryDays.get(household.id) || 0).sort((a, b) => a - b); return Math.round(days[Math.floor(days.length / 2)] * 10) / 10; })(),
    leastRealSecondsStarving: deaths.length ? Math.min(...deaths.map(d => d.realSecondsStarving ?? Infinity)) : null,
  };
}

const rows = [];
for (const mode of modes) for (const seed of seeds) {
  const started = Date.now();
  const row = runClass(seed, mode);
  row.seconds = Math.round((Date.now() - started) / 1000);
  rows.push(row);
  console.log(JSON.stringify(row));
}
const summary = Object.fromEntries(modes.map(mode => {
  const mine = rows.filter(row => row.mode === mode);
  const mean = key => Math.round((mine.reduce((sum, row) => sum + row[key], 0) / mine.length) * 10) / 10;
  return [mode, { classes: mine.length, deathsPerClass: mean('deaths'), period1: mean('period1'), period2: mean('period2'), period3: mean('period3'), onRoad: mean('onRoad'), familiesHitPerClass: mean('familiesHit'), familiesHungryPerClass: mean('familiesHungry'), familiesWeakPerClass: mean('familiesWeak'), familiesStarvingPerClass: mean('familiesStarving'), hungryDaysMedian: mean('hungryDaysMedian'), wipedPerClass: mean('wiped'), peoplePerClass: mean('people'), classesWithAnyDeath: mine.filter(row => row.deaths > 0).length }];
}));
console.log(JSON.stringify(summary, null, 1));
if (out) { mkdirSync('docs/evidence', { recursive: true }); writeFileSync(out, `${JSON.stringify({ measured: new Date().toISOString().slice(0, 10), families, seeds, summary, rows }, null, 1)}\n`); }
