// Deaths by hunger in whole classes (owner, 2026-09-30: "player characters *can* die of starvation. players should have to ensure
// there's enough food"; docs/HUNGER.md §6). Measures only; nothing here changes a rule.
//
// Two kinds of student, every family of the class played by one of them and at its screen the whole time:
//
//   idle     gives no orders at all: grown people stay at what they were founded to (working about the place), children rest,
//            and the family never leaves in the spring unless the order's own lapse sends it (docs/BALANCE.md §16.2).
//   gathering  does one thing about food: one grown person put on auto at the first of the gathering works the land offers (fishing,
//            oysters, a bee tree, small game), nobody else ever given an order (owner, 2026-10-02: food only from real sources).
//   playing  farms, hunts, fishes and forages as the director does for a family nobody plays (sim/neighbours.mjs `thinkFor`):
//            the field first, the hunt or the four gathering works when the house is short, the herd at the last day or two,
//            powder bought before the last shot, and at once east when told to leave with all the food that fits.
//   milking  plays as `playing` does, and also has the cow milked every day it can be (owner, 2026-10-02: milking a child's chore,
//            sim/milking.mjs): the youngest of seven or more who is free is sent to it, at home and on the road east.
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
import * as stock from '../sim/stock.mjs';
// Asked through the module so the harness runs against a tree from before the herder too (`herdingOf` since 2026-10-03).
const { hasStock, herdOf } = stock;
const herdingOf = one => stock.herdingOf?.(one) ?? 1;

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
  // A herd alone (`herdonly`): every family drove stock in, as a student's lobby choice does; the others are dealt it by the director's
  // own rule on their first turn (sim/neighbours.mjs `dealStock`, three in four).
  if (mode === 'herdonly') for (const household of Object.values(world.households)) { household.stock = true; delete household.herd; }
  world.status = 'running';
  const households = Object.values(world.households);
  const people = households.reduce((sum, household) => sum + household.members.length, 0);
  const starvingAt = new Map(), deaths = [];
  // The worst stage each family's people reached, and the days any of them spent hungry or worse.
  const worst = new Map(), hungryDays = new Map();
  const RANK = { hungry: 1, weak: 2, starving: 3 };
  // The kinds of family the owner asked after (2026-10-02): a lone parent, a big family (eight or more), and a family that sent a man
  // to the war (anybody of it in the army, a service or a company at any tick). A family may be more than one.
  const parents = household => household.members.filter(id => ['father', 'mother'].includes(world.entities[id]?.kin?.role)).length;
  const lone = new Set(households.filter(household => parents(household) < 2).map(household => household.id));
  const big = new Set(households.filter(household => household.members.length >= 8).map(household => household.id));
  const war = new Set();
  // Food in the house at each period's end, the median family's.
  const foodAtEnd = {};
  let ticks = 0, herdFood = 0;
  const stockAtStart = households.filter(household => hasStock(household)).length;
  // A student who does one thing about food (owner, 2026-10-02): one grown person, not the head of the family where there is another,
  // sent to the first of the gathering works the family's land offers and put on auto, and nothing else ever given.
  const FOOD_WORKS = ['fish-the-water', 'gather-oysters', 'cut-bee-tree', 'take-small-game'];
  const gatherer = household => {
    const view = projectWorld(world, household.id, 'student', { includeMap: false });
    const alive = household.members.map(id => world.entities[id]).filter(one => one && !['dead', 'captured'].includes(one.health?.condition) && !one.service && (one.age ?? 30) >= 16);
    if (alive.some(one => one.auto && one.order)) return;
    for (const one of [...alive.filter(person => person.id !== household.principalId), ...alive.filter(person => person.id === household.principalId)]) {
      const work = FOOD_WORKS.find(id => (view.work?.[one.id] || []).some(entry => entry.id === id && entry.can));
      if (!work) continue;
      household.mainId = one.id;
      try { applyAction(world, household.id, { action: 'chore', entityId: one.id, chore: work }); applyAction(world, household.id, { action: 'set-auto', entityId: one.id, auto: true }); return; } catch { /* the next */ }
    }
  };
  // The cow milked by the youngest free of seven or more, whichever of the two works the family's place offers (the harness, not a rule).
  const milker = household => {
    const view = projectWorld(world, household.id, 'student', { includeMap: false });
    const free = household.members.map(id => world.entities[id]).filter(one => one && !one.chore && !one.service && !['dead', 'captured'].includes(one.health?.condition)).sort((a, b) => (a.age ?? 30) - (b.age ?? 30));
    for (const one of free) {
      const work = ['milk-cow', 'milk-road'].find(id => (view.work?.[one.id] || []).some(entry => entry.id === id && entry.can));
      if (!work) continue;
      try { applyAction(world, household.id, { action: 'chore', entityId: one.id, chore: work }); return; } catch { /* the next */ }
    }
  };
  // A herder (owner, 2026-10-03; sim/stock.mjs): the best hand with stock of twelve or more who is not the head of the family, put on
  // auto at *Ride the range after the stock*, once; the harness, not a rule. `herdonly` gives that one order and, when the house is down
  // to two days, has the herd butchered - a hog, else a beef - and nothing else, to ask whether a herd alone feeds a family.
  const herded = new Set();
  const herder = household => {
    if (herded.has(household.id) || !hasStock(household)) return;
    const view = projectWorld(world, household.id, 'student', { includeMap: false });
    const free = household.members.map(id => world.entities[id]).filter(one => one && !['dead', 'captured'].includes(one.health?.condition) && !one.service && (one.age ?? 30) >= 12 && !one.chore)
      .sort((a, b) => (b.id !== household.principalId) - (a.id !== household.principalId) || herdingOf(b) - herdingOf(a));
    for (const one of free) {
      if (!(view.work?.[one.id] || []).some(entry => entry.id === 'look-to-stock' && entry.can)) continue;
      try { applyAction(world, household.id, { action: 'chore', entityId: one.id, chore: 'look-to-stock' }); applyAction(world, household.id, { action: 'set-auto', entityId: one.id, auto: true }); herded.add(household.id); return; } catch { /* the next */ }
    }
  };
  const butcherWhenShort = household => {
    const eaters = household.members.filter(id => !['dead', 'captured'].includes(world.entities[id]?.health?.condition)).length;
    if ((household.resources.food ?? 0) > eaters * 0.35 * 2) return;
    const herd = herdOf(household), work = herd.hogs > 0 ? 'butcher-hog' : herd.cattle > 0 ? 'butcher-beef' : null;
    if (!work) return;
    const view = projectWorld(world, household.id, 'student', { includeMap: false });
    const one = household.members.map(id => world.entities[id]).find(person => person && !person.chore && (view.work?.[person.id] || []).some(entry => entry.id === work && entry.can));
    if (one) try { applyAction(world, household.id, { action: 'chore', entityId: one.id, chore: work }); } catch { /* refused */ }
  };
  const turn = () => {
    if (mode === 'herdonly') {
      households.forEach((household, index) => { if (!household.arriving && (world.tick + index) % THINK_EVERY === 0) { herder(household); butcherWhenShort(household); } });
      return;
    }
    if (mode === 'ranching') households.forEach((household, index) => { if (!household.arriving && (world.tick + index) % THINK_EVERY === 0) herder(household); });
    if (mode === 'gathering') {
      households.forEach((household, index) => { if (!household.arriving && (world.tick + index) % THINK_EVERY === 0) gatherer(household); });
      return;
    }
    if (mode !== 'playing' && mode !== 'milking' && mode !== 'ranching') return;
    households.forEach((household, index) => {
      if (household.arriving || (world.tick + index) % THINK_EVERY !== 0) return;
      if (mode === 'milking') milker(household);
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
        if (person.service || world.army?.members?.includes(person.id)) war.add(person.householdId);
        if (person.hunger?.stage === 'starving' && !starvingAt.has(person.id)) starvingAt.set(person.id, ticks);
        const rank = RANK[person.hunger?.stage] || 0;
        if (rank > (worst.get(person.householdId) || 0)) worst.set(person.householdId, rank);
      }
      for (const event of world.events.slice(-40)) {
        if (seen.has(event.id)) continue;
        // The herd's food to the family that killed it (sim/stock.mjs: a hog's pork, the beef's kept share), counted once.
        if (event.claimId === 'FIC-GONZ-182' && event.actorId) { seen.add(event.id); const pork = /salted it down: ([0-9.]+) food/.exec(event.text || ''); herdFood += pork ? Number(pork[1]) : /killed a .*beef/.test(event.text || '') ? 15 : 0; continue; }
        if (event.hunger !== 'died') continue;
        seen.add(event.id);
        const person = world.entities[event.actorId];
        deaths.push({ period, day: Math.round(event.minute / DAY), age: person.age ?? null, road: /on the road/.test(event.text) || Boolean(world.households[person.householdId]?.flight && world.households[person.householdId].flight.status !== 'home'), householdId: person.householdId, realSecondsStarving: starvingAt.has(person.id) ? Math.round((ticks - starvingAt.get(person.id)) * STUDY_TICK_MS / 1000) : null });
      }
      turn();
    }
    const foods = households.map(household => household.resources?.food || 0).sort((a, b) => a - b);
    foodAtEnd[period] = Math.round(foods[Math.floor(foods.length / 2)] * 10) / 10;
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
    foodAtEnd,
    kinds: Object.fromEntries([['lone', lone], ['big', big], ['war', war]].map(([kind, set]) => [kind, { families: set.size, hit: [...hit].filter(id => set.has(id)).length, deaths: deaths.filter(d => set.has(d.householdId)).length }])),
    leastRealSecondsStarving: deaths.length ? Math.min(...deaths.map(d => d.realSecondsStarving ?? Infinity)) : null,
    // The herd (owner, 2026-10-03): families that started with stock, the food their herds gave them, and the herd at the end.
    stockFamilies: stockAtStart, herdFood: Math.round(herdFood),
    herdEnd: (() => { const kept = households.filter(household => hasStock(household)).map(household => herdOf(household)); const mid = list => { const sorted = list.sort((a, b) => a - b); return sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0; }; return { families: kept.length, cattle: mid(kept.map(h => h.cattle)), hogs: mid(kept.map(h => h.hogs)) }; })(),
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
  const kind = name => Object.fromEntries(['families', 'hit', 'deaths'].map(key => [key, mine.reduce((sum, row) => sum + row.kinds[name][key], 0)]));
  return [mode, { kinds: { lone: kind('lone'), big: kind('big'), war: kind('war') }, foodAtEnd: Object.fromEntries([1, 2, 3].map(period => [period, Math.round(mine.reduce((sum, row) => sum + (row.foodAtEnd[period] || 0), 0) / mine.length * 10) / 10])), classes: mine.length, herdFoodPerClass: mean('herdFood'), stockFamiliesPerClass: mean('stockFamilies'), deathsPerClass: mean('deaths'), period1: mean('period1'), period2: mean('period2'), period3: mean('period3'), onRoad: mean('onRoad'), familiesHitPerClass: mean('familiesHit'), familiesHungryPerClass: mean('familiesHungry'), familiesWeakPerClass: mean('familiesWeak'), familiesStarvingPerClass: mean('familiesStarving'), hungryDaysMedian: mean('hungryDaysMedian'), wipedPerClass: mean('wiped'), peoplePerClass: mean('people'), classesWithAnyDeath: mine.filter(row => row.deaths > 0).length }];
}));
console.log(JSON.stringify(summary, null, 1));
if (out) { mkdirSync('docs/evidence', { recursive: true }); writeFileSync(out, `${JSON.stringify({ measured: new Date().toISOString().slice(0, 10), families, seeds, summary, rows }, null, 1)}\n`); }
