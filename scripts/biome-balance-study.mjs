// The biome balance study: docs/BIOME_GAMEPLAY.md §5, 2026-09-19.
//
// Plays whole classes of families nobody plays on the real land (every family run by sim/neighbours.mjs), and records for
// each family the country its house stands in and how it fared: when its house was lived in and what kind, how often it was
// short of food, its hunts (how many, how long the hunter was out, what came home), its field, and - over all three class
// periods - its coin, glory and final number. Then it reports by country, so the regions can be compared: they should
// differ in character, not in whether a family can do well.
//
// Run: node scripts/biome-balance-study.mjs [seeds] [families] [periods] [label]
//   → writes docs/evidence/biome-balance-<label>.json
import { writeFileSync, mkdirSync } from 'node:fs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, stepWorld } from '../sim/world.mjs';
import { autoChoice } from '../sim/chores.mjs';
import { huntingPlace } from '../sim/hunting.mjs';
import { huntPlaces } from '../sim/neighbours.mjs';
import { beginSecondPeriod, beginThirdPeriod } from '../sim/periods.mjs';
import { hostEnding } from '../sim/ending.mjs';
import { soundLogsNear } from '../sim/neighbours.mjs';
import { houseBuilt, houseSettled } from '../sim/houses.mjs';
import { choosing } from '../sim/homesite.mjs';
import { holdingOf } from '../sim/grants.mjs';
import { landAround } from '../sim/ground.mjs';
import { patchAt, patchCover, woodsRule } from '../sim/woods.mjs';
import * as fields from '../sim/fields.mjs';
const { clearedPlots, plotsOf } = fields;
const fenceWork = fields.fenceWork;

// `hunt` as the first argument runs the hunting bench instead (below): node scripts/biome-balance-study.mjs hunt [seeds] [families] [label]
const bench = process.argv[2] === 'hunt';
const args = bench ? process.argv.slice(3) : process.argv.slice(2);
const seeds = Number(args[0] || 3), families = Number(args[1] || 30), periods = bench ? 1 : Number(args[2] || 1);
const label = (bench ? args[2] : args[3]) || 'run';

/** The country a house stands in, in three kinds: the stand's cover and whether any timber is near. */
const OPEN = new Set(['tallgrass-prairie', 'coastal-prairie', 'salt-prairie', 'mixedgrass-prairie', 'dunes', 'fields', 'marsh', 'prairie']);
const BRUSH = new Set(['mesquite-savanna', 'chaparral', 'brush']);
const country = stand => OPEN.has(stand) ? 'prairie' : BRUSH.has(stand) ? 'brush' : ['post-oak', 'hill-savanna', 'cross-timbers', 'live-oak', 'creek-draw', 'longleaf'].includes(stand) ? 'savanna' : 'timber';

const median = list => { if (!list.length) return null; const s = [...list].sort((a, b) => a - b); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const mean = list => list.length ? Math.round(list.reduce((a, b) => a + b, 0) / list.length * 100) / 100 : null;
const r2 = v => Math.round(v * 100) / 100;

const rows = [];
const started = Date.now();

/**
 * The hunting bench: in every family of a class, one grown hand hunts the best ground within a mile of the house, as the
 * neighbours' director chooses it (`huntPlaces`), six times over, with powder enough; the shot is taken when the hand is
 * steady and waited for when not (`autoChoice`). Run once as the class opens (late September) and once when the second
 * period opens (late January), so a season's quarry shows. Records the ticks it took, what was brought down and what came
 * home. The history runs on around it; nobody is sent anywhere else.
 */
function huntBench(world, when) {
  const land = landAround(), rule = woodsRule(world);
  const out = {};
  const HUNTS = 6;
  for (const household of Object.values(world.households)) {
    household.played = true;
    household.resources.powder = 50;
    const home = world.map.sites[household.homeSiteId];
    const hunter = household.members.map(id => world.entities[id]).find(p => p && !['dead', 'captured'].includes(p.health?.condition) && !p.service && (p.age ?? 30) >= 16 && p.location?.siteId === household.homeSiteId);
    const place = home && huntPlaces(world, home, holdingOf(world, household).bounds)[0];
    const patch = home && patchAt(home, { rule, nearCreek: land.nearCreek });
    out[household.id] = { id: household.id, seed: world.seed, when, settlement: household.settlementId, stand: patch?.stand, country: patch && country(patch.stand), hunter: hunter?.id, place, sent: 0, done: 0, ticks: 0, placeGame: place ? huntingPlace(world, place).game : null, hides0: household.resources.hides ?? 0, events0: world.events.length };
  }
  for (let t = 0; t < 600; t++) {
    let busy = false;
    for (const household of Object.values(world.households)) {
      const row = out[household.id];
      const hunter = world.entities[row.hunter];
      if (!hunter || !row.place || row.done >= HUNTS) continue;
      if (hunter.chore?.ask) {
        try { applyAction(world, household.id, { action: 'answer-chore', entityId: hunter.id, option: autoChoice(world, household, hunter) }); } catch { /* the next tick */ }
      }
      if (!hunter.chore) {
        if (row.sent > row.done) row.done++;
        if (row.done < HUNTS) { try { applyAction(world, household.id, { action: 'hunt-land', entityId: hunter.id, x: row.place.x, y: row.place.y }); row.sent++; } catch (error) { row.refused = error.message; row.done = HUNTS; } }
      }
      if (hunter.chore) { row.ticks++; busy = true; }
    }
    if (!busy) break;
    stepWorld(world);
  }
  for (const household of Object.values(world.households)) {
    const row = out[household.id];
    const mine = world.events.slice(row.events0).filter(e => e.householdId === household.id);
    row.shots = mine.filter(e => e.type === 'hunt').length;
    // A shot that did not go home, however it failed. Since 2026-09-20 a damp charge in the rain says so in its own
    // words (`FIC-GONZ-135`, sim/chores.mjs) and was silently dropping out of this count, which made the hunt look as
    // though it had got easier on the day it got harder.
    row.missed = mine.filter(e => / fired and missed | would not fire/.test(e.text || '')).length;
    row.misfired = mine.filter(e => / would not fire/.test(e.text || '')).length;
    // What came home: said by the kill's own record where the rules say it, or a deer's five before they did.
    const kills = mine.filter(e => e.type === 'hunt-kill');
    row.kills = kills.length || row.shots - row.missed;
    row.food = kills.length ? kills.reduce((sum, e) => sum + (e.food || 0), 0) : 5 * (row.shots - row.missed);
    row.quarry = {};
    for (const e of kills) row.quarry[e.quarry] = (row.quarry[e.quarry] || 0) + 1;
    row.hides = (household.resources.hides ?? 0) - row.hides0;
    row.foodPerHour = row.ticks ? r2(row.food / (row.ticks / 3)) : 0;
    delete row.events0; delete row.hides0;
    rows.push(row);
  }
}
if (bench) {
  for (let s = 0; s < seeds; s++) {
    const seed = `biomes-${s}`;
    // As the class opens: every family on its land and its house site chosen, as the neighbours choose it.
    let world = createGonzalesWorld(seed, families, { map: 'colonies', neighbours: true });
    world.status = 'running';
    for (let t = 0; t < 300 && Object.values(world.households).some(h => h.arriving || choosing(h)); t++) stepWorld(world);
    huntBench(world, 'autumn');
    // And the winter: the first period played through by the neighbours, then the second opened.
    world = createGonzalesWorld(seed, families, { map: 'colonies', neighbours: true });
    world.status = 'running';
    for (let t = 0; t < 12000 && !world.director.complete && world.status === 'running'; t++) stepWorld(world);
    beginSecondPeriod(world); world.status = 'running';
    huntBench(world, 'winter');
    console.log(`${seed}: ${Math.round((Date.now() - started) / 1000)} s`);
  }
  const summarise = list => {
    const quarry = {};
    for (const r of list) for (const [k, v] of Object.entries(r.quarry)) quarry[k] = (quarry[k] || 0) + v;
    return {
      families: list.length, placeGameMedian: median(list.map(r => r.placeGame ?? 0)), hunts: list.reduce((a, r) => a + r.done, 0),
      ticksPerHunt: r2(list.reduce((a, r) => a + r.ticks, 0) / Math.max(1, list.reduce((a, r) => a + r.done, 0))),
      killsPerHunt: r2(list.reduce((a, r) => a + r.kills, 0) / Math.max(1, list.reduce((a, r) => a + r.done, 0))),
      foodPerHunt: r2(list.reduce((a, r) => a + r.food, 0) / Math.max(1, list.reduce((a, r) => a + r.done, 0))),
      foodPerHourMedian: median(list.map(r => r.foodPerHour)), foodPerHourMean: mean(list.map(r => r.foodPerHour)),
      hidesPerHunt: r2(list.reduce((a, r) => a + r.hides, 0) / Math.max(1, list.reduce((a, r) => a + r.done, 0))),
      quarry,
    };
  };
  const group = (list, key) => Object.fromEntries([...new Set(list.map(r => r[key]))].sort().map(k => [k, summarise(list.filter(r => r[key] === k))]));
  const result = { record: 'The hunting bench: docs/BIOME_GAMEPLAY.md §5', label, date: new Date().toISOString().slice(0, 10), seeds, families };
  for (const when of ['autumn', 'winter']) {
    const list = rows.filter(r => r.when === when && r.place);
    result[when] = { all: summarise(list), byCountry: group(list, 'country'), bySettlement: group(list, 'settlement') };
  }
  result.rows = rows;
  console.log(JSON.stringify({ autumn: { all: result.autumn.all, byCountry: result.autumn.byCountry }, winter: { all: result.winter.all, byCountry: result.winter.byCountry } }, null, 1));
  mkdirSync('docs/evidence', { recursive: true });
  writeFileSync(`docs/evidence/biome-hunt-${label}.json`, `${JSON.stringify(result, null, 1)}\n`);
  process.exit(0);
}
for (let s = 0; s < seeds; s++) {
  const seed = `biomes-${s}`;
  const world = createGonzalesWorld(seed, families, { map: 'colonies', neighbours: true });
  world.status = 'running';
  const land = landAround();
  const rule = woodsRule(world);
  const per = {};
  for (const household of Object.values(world.households)) {
    per[household.id] = { id: household.id, seed, settlement: household.settlementId, stock: Boolean(household.stock), hungryTicks: 0, minFood: Infinity, huntTicks: 0, foodTicks: 0, foodSum: 0 };
  }
  const watch = () => {
    for (const household of Object.values(world.households)) {
      const row = per[household.id];
      if (!row.stand && !choosing(household) && household.homeSiteId && world.map.sites[household.homeSiteId]) {
        const home = world.map.sites[household.homeSiteId];
        const patch = patchAt(home, { rule, nearCreek: land.nearCreek });
        row.stand = patch.stand; row.cover = patchCover(patch); row.country = country(patch.stand);
        row.logsNear = soundLogsNear(world, home, holdingOf(world, household).bounds);
      }
      if (row.lived === undefined && houseBuilt(household) && household.house) { row.lived = world.tick; row.livedMinute = world.minute; }
      const food = household.resources.food ?? 0;
      if (row.stand) { row.foodTicks++; row.foodSum += food; if (food < 0.5) row.hungryTicks++; row.minFood = Math.min(row.minFood, food); }
      for (const id of household.members) if (world.entities[id]?.chore?.id === 'hunt-land') row.huntTicks++;
    }
  };
  const run = () => { for (let t = 0; t < 12000 && !world.director.complete && world.status === 'running'; t++) { stepWorld(world); watch(); } };
  run();
  const endOfFirst = world.tick;
  for (const household of Object.values(world.households)) {
    const row = per[household.id];
    Object.assign(row, {
      p1: {
        food: r2(household.resources.food ?? 0), money: household.resources.money ?? 0, hides: household.resources.hides ?? 0,
        cleared: clearedPlots(household).length, fenced: clearedPlots(household).filter(p => p.fence === 'sound').length,
        house: household.house?.plan || household.house?.layout || null, built: houseBuilt(household), settled: houseSettled(household),
        logs: household.logs ? (household.logs.wall || 0) + (household.logs.sill || 0) : 0,
        // What fencing its plots costs, in ticks (sim/fields.mjs `fenceWork`; eight everywhere before it existed).
        fenceTicks: plotsOf(world, household).filter(p => p.x !== undefined).map(p => fenceWork ? fenceWork(world, household, p).ticks : 8),
        fetched: world.events.filter(e => e.householdId === household.id && e.claimId === 'FIC-GONZ-066').length,
      },
    });
  }
  if (periods >= 2) { beginSecondPeriod(world); world.status = 'running'; run(); }
  if (periods >= 3) { beginThirdPeriod(world); world.status = 'running'; run(); }
  const ending = hostEnding(world);
  const events = world.events;
  for (const f of ending.families) {
    const row = per[f.householdId];
    const mine = events.filter(e => e.householdId === f.householdId);
    const shots = mine.filter(e => e.type === 'hunt');
    const missed = mine.filter(e => e.type === 'consequence' && / fired and missed | would not fire/.test(e.text));
    const quarry = {};
    for (const e of mine) { const m = /brought down (?:a |an )?([a-z ]+?)(?: and| on|,|\.)/.exec(e.text || ''); if (m && e.type === 'hunt-kill') quarry[m[1]] = (quarry[m[1]] || 0) + 1; }
    // Told apart because they are different faults: a long shot from an unsteady hand, and a charge that had taken the
    // wet in the rain (`FIC-GONZ-135`, 2026-09-20).
    const misfired = mine.filter(e => / would not fire/.test(e.text || ''));
    Object.assign(row, {
      shots: shots.length, missed: missed.length, misfired: misfired.length, quarry,
      end: { money: f.money, glory: f.glory, land: f.land, final: f.final, food: r2(world.households[f.householdId].resources.food ?? 0) },
      meanFood: row.foodTicks ? r2(row.foodSum / row.foodTicks) : null,
    });
    if (row.minFood === Infinity) row.minFood = null; else row.minFood = r2(row.minFood);
    delete row.foodSum;
    rows.push(row);
  }
  console.log(`${seed}: ${Object.keys(per).length} families, first period ${endOfFirst} ticks, all ${world.tick}; ${Math.round((Date.now() - started) / 1000)} s`);
}

/** The families of one kind, summarised. */
function summary(list) {
  const lived = list.filter(r => r.lived !== undefined);
  const houses = {};
  for (const r of list) houses[r.p1.house || 'none'] = (houses[r.p1.house || 'none'] || 0) + 1;
  const quarry = {};
  for (const r of list) for (const [k, v] of Object.entries(r.quarry || {})) quarry[k] = (quarry[k] || 0) + v;
  return {
    families: list.length,
    logsNear: median(list.map(r => r.logsNear ?? 0)),
    underCabin: list.filter(r => (r.logsNear ?? 0) < 50).length,
    houses, livedIn: `${lived.length}/${list.length}`, livedTickMedian: median(lived.map(r => r.lived)),
    hungryTicksMedian: median(list.map(r => r.hungryTicks)), hungryAny: list.filter(r => r.hungryTicks > 0).length,
    minFoodMedian: median(list.map(r => r.minFood ?? 0)), meanFoodMedian: median(list.map(r => r.meanFood ?? 0)),
    p1FoodMedian: median(list.map(r => r.p1.food)), p1ClearedMedian: median(list.map(r => r.p1.cleared)), p1FencedMedian: median(list.map(r => r.p1.fenced)),
    fenceTicksMedian: median(list.flatMap(r => r.p1.fenceTicks || [])), fetchedFamilies: list.filter(r => r.p1.fetched > 0).length,
    shotsMean: mean(list.map(r => r.shots)), missedMean: mean(list.map(r => r.missed)), misfiredMean: mean(list.map(r => r.misfired || 0)), huntTicksMean: mean(list.map(r => r.huntTicks)),
    huntTicksPerShot: r2(list.reduce((a, r) => a + r.huntTicks, 0) / Math.max(1, list.reduce((a, r) => a + r.shots, 0))),
    quarry,
    moneyMedian: median(list.map(r => r.end.money)), gloryMedian: median(list.map(r => r.end.glory)), finalMedian: median(list.map(r => r.end.final)),
    finalMean: mean(list.map(r => r.end.final)),
  };
}
const by = key => Object.fromEntries([...new Set(rows.map(r => r[key]))].sort().map(k => [k, summary(rows.filter(r => r[key] === k))]));
const result = { record: 'The biome balance study: docs/BIOME_GAMEPLAY.md §5', label, date: new Date().toISOString().slice(0, 10), seeds, families, periods, all: summary(rows), byCountry: by('country'), bySettlement: by('settlement'), byStand: by('stand'), rows };
console.log(JSON.stringify({ all: result.all, byCountry: result.byCountry, bySettlement: result.bySettlement }, null, 1));
mkdirSync('docs/evidence', { recursive: true });
writeFileSync(`docs/evidence/biome-balance-${label}.json`, `${JSON.stringify(result, null, 1)}\n`);
