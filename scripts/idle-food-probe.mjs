// Period 1 food of families whose student gives no orders at all (everybody on what they were founded to: grown people
// working about the place, children resting): "starving by default" (docs/BALANCE.md §16, the owner's D7 of 2026-09-29).
// Run: node scripts/idle-food-probe.mjs [seed] - or with a tree's file URL first, to measure another copy of sim/.
const W = process.argv[2]?.startsWith('file:') ? process.argv[2] : new URL('../', import.meta.url).href;
const seed = (process.argv[2]?.startsWith('file:') ? process.argv[3] : process.argv[2]) || 'idle-food';
const { createGonzalesWorld } = await import(W + 'sim/gonzales.mjs');
const { rollFamily, stepWorld } = await import(W + 'sim/world.mjs');
const world = createGonzalesWorld(seed, 15, { map: 'colonies' });
for (const household of Object.values(world.households)) { rollFamily(world, household); household.played = true; }
world.status = 'running';
const track = {};
for (let t = 0; t < 20000 && !world.director.complete && world.status === 'running'; t++) {
  const was = world.minute;
  stepWorld(world);
  for (const household of Object.values(world.households)) {
    const food = household.resources.food ?? 0, one = track[household.id] ??= { start: food, least: food, zeroDays: 0, firstZeroDay: null };
    one.least = Math.min(one.least, food); one.end = food;
    if (food <= 0.001 && !household.arriving) { one.zeroDays += (world.minute - was) / 1440; one.firstZeroDay ??= Math.round(world.minute / 1440); }
  }
}
const rows = Object.entries(track).map(([id, one]) => ({ id, people: world.households[id].members.length, start: Math.round(one.start * 10) / 10, least: Math.round(one.least * 10) / 10, end: Math.round(one.end * 10) / 10, zeroDays: Math.round(one.zeroDays), firstZeroDay: one.firstZeroDay }));
console.log(JSON.stringify({ seed, minute: world.minute, days: Math.round(world.minute / 1440), rows, starving: rows.filter(row => row.zeroDays > 0).length, meanEnd: Math.round(rows.reduce((s, r) => s + r.end, 0) / rows.length * 10) / 10 }));
