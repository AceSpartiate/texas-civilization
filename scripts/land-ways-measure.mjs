// The cost of walking about the homestead on many farms (docs/LAND_GRANTS.md §10.5, owner 2026-10-05: "Paths don't seem natural around
// the house."): treading the family's ways, 600 walks from the door to places on the land, and 600 steps about the yard, on two
// classes of ten families. Run: node scripts/land-ways-measure.mjs [root], root a file: URL of another checkout to measure the code
// before (git archive of the commit into a folder).
const root = process.argv[2] || new URL('..', import.meta.url).href.replace(/\/$/, '');
const { createGonzalesWorld } = await import(`${root}/sim/gonzales.mjs`);
const { applyAction, stepWorld } = await import(`${root}/sim/world.mjs`);
const { advanceLandPaths, landRoute, doorOf } = await import(`${root}/sim/land-paths.mjs`);
const { houseSettled, planHouse } = await import(`${root}/sim/houses.mjs`);
const { PIECES } = await import(`${root}/sim/houseplot.mjs`);
const { holdingOf } = await import(`${root}/sim/grants.mjs`);
const { siteFactsFor } = await import(`${root}/sim/homesite.mjs`);
let seed = 7; const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const lay = [], walks = [], hops = [];
for (const s of ['bench-a', 'bench-b']) {
  const world = createGonzalesWorld(s, 10, { map: 'colonies' });
  world.status = 'running';
  for (let t = 0; t < 200 && Object.values(world.households).some(h => h.arriving); t++) stepWorld(world);
  const homes = [];
  for (const h of Object.values(world.households)) {
    const b = holdingOf(world, h).bounds;
    let site = null;
    for (let i = 0; i < 25 && !site; i++) { const p = { x: +(b.minX + (b.maxX - b.minX) * rand()).toFixed(2), y: +(b.minY + (b.maxY - b.minY) * rand()).toFixed(2) }; if (siteFactsFor(world, h, p).can) site = p; }
    if (!site) continue;
    applyAction(world, h.id, { action: 'choose-site', ...site });
    for (const id of [...h.members, ...h.property]) { const e = world.entities[id]; if (e.travel?.purpose === 'arrive') { e.location = { x: e.travel.settle.x, y: e.travel.settle.y, siteId: e.travel.to }; e.travel = null; } }
    delete h.arriving;
    h.improvements.cabin = 'none'; try { planHouse(world, h, 'round-log'); } catch { continue; }
    for (const piece of h.house.pieces) piece.stage = PIECES[piece.type].stages.length;
    h.herd = { cattle: 3, hogs: 2 };
    homes.push(h);
  }
  for (let i = 0; i < 40; i++) { const t0 = performance.now(); advanceLandPaths(world, houseSettled); lay.push(performance.now() - t0); }
  for (const h of homes) {
    const b = holdingOf(world, h).bounds, door = doorOf(world, h);
    for (let i = 0; i < 30; i++) {
      const to = { x: b.minX + (b.maxX - b.minX) * rand(), y: b.minY + (b.maxY - b.minY) * rand() };
      let t0 = performance.now(); landRoute(world, h, door, to); walks.push(performance.now() - t0);
      const near = { x: door.x + (rand() - 0.5) * 0.08, y: door.y + (rand() - 0.2) * 0.08 };
      t0 = performance.now(); landRoute(world, h, near, door); hops.push(performance.now() - t0);
    }
  }
}
const stat = (name, a) => { a.sort((x, y) => x - y); console.log(name, a.length, 'mean', (a.reduce((s, x) => s + x, 0) / a.length).toFixed(2), 'p50', a[a.length >> 1].toFixed(2), 'p95', a[Math.floor(a.length * .95)].toFixed(2), 'max', a.at(-1).toFixed(2)); };
stat('advanceLandPaths tick', lay.filter(x => x > 0.05)); stat('walk', walks); stat('yard step', hops);
