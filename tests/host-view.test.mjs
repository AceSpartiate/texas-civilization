// The teacher's view of the whole class (owner, 2026-09-16): "On the Class View, the teacher should be able to see everything
// and everyone ... players are limited by fog of war, but the teacher shouldn't be."
//
// sim/overview.mjs sends the Host every person, animal and wagon where they truly are and every family's land as it truly
// stands. These tests hold three things at once: the Host has no fog; a student's payload gained nothing from it; and the Host
// is still sent none of what stays hidden from every screen (glory and hidden stats have their own tests too).
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { projectWorld, rollFamily, stepWorld, validateWorld } from '../sim/world.mjs';
import { observedBy } from '../sim/town.mjs';
import { landView, pieced } from '../sim/houses.mjs';
import { holdingOf } from '../sim/grants.mjs';
import { plotsOf } from '../sim/fields.mjs';
import { polylineLength } from '../sim/geography.mjs';
import { ROAD_WINDOW_MILES, roadWindow } from '../sim/overview.mjs';
import { createClassroom } from '../server/app.mjs';

const host = world => projectWorld(world, undefined, 'host', { includeMap: false });
const student = (world, householdId) => projectWorld(world, householdId, 'student', { includeMap: false });

/** A class on the real land, every family rolled and run by the neighbours, some way into the afternoon. */
const played = (() => {
  const made = new Map();
  return (players, ticks) => {
    const key = `${players}:${ticks}`;
    if (made.has(key)) return made.get(key);
    const world = createGonzalesWorld(`host-view-${players}`, players, { map: 'colonies', neighbours: true });
    for (const household of Object.values(world.households)) rollFamily(world, household);
    world.status = 'running';
    const arrival = host(world);
    for (let tick = 0; tick < ticks; tick++) stepWorld(world);
    validateWorld(world);
    made.set(key, { world, arrival });
    return made.get(key);
  };
})();

/** Where somebody is drawn a distance along a road. */
function along(points, distance) {
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i], length = Math.hypot(b.x - a.x, b.y - a.y);
    if (distance <= length) { const f = length ? distance / length : 0; return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f }; }
    distance -= length;
  }
  return points.at(-1);
}

test('the Host is sent everybody in the class where they truly are, and every family’s land as it stands, with no fog', () => {
  const { world } = played(10, 150);
  const view = host(world);
  const sent = new Map(view.others.map(entity => [entity.id, entity]));
  const placed = Object.values(world.entities).filter(entity => entity.location);
  // The premise: there is somebody a family cannot see, so this is a test of fog and not of a class all standing together.
  const seenByFirst = new Set([...student(world, 'hh-1').entities, ...observedBy(world, 'hh-1')].map(entity => entity.id));
  assert.ok(placed.some(entity => !seenByFirst.has(entity.id) && entity.householdId), 'every family was in sight of the first; nothing here tests fog');
  assert.ok(placed.some(entity => entity.travel), 'nobody was on the road');
  assert.ok(placed.some(entity => entity.resident), 'no town keeper stood anywhere');
  for (const entity of placed) {
    const seen = sent.get(entity.id);
    assert.ok(seen, `${entity.id} (${entity.kind} of ${entity.householdId || 'no family'}) is not on the Host's map`);
    assert.equal(seen.kind, entity.kind);
    assert.equal(seen.householdId, entity.householdId || undefined, `${entity.id} is drawn as somebody else's`);
    assert.ok(Math.abs(seen.location.x - entity.location.x) < 1e-3 && Math.abs(seen.location.y - entity.location.y) < 1e-3, `${entity.id} is drawn somewhere they are not`);
    assert.equal(seen.location.siteId, entity.location.siteId);
    assert.equal(seen.condition, entity.health?.condition || entity.condition || 'well');
    if (entity.chore) assert.equal(seen.chore?.doing, entity.chore.doing, `${entity.id}'s work is not what they are doing`);
    if (entity.travel) {
      // Only the stretch of road round them rides along, and it puts them exactly where the whole road does.
      const at = along(seen.travel.points, seen.travel.progress - seen.travel.base), truly = along(entity.travel.points, entity.travel.progress);
      assert.ok(Math.hypot(at.x - truly.x, at.y - truly.y) < 1e-2, `${entity.id} is drawn off their road`);
    }
  }
  assert.equal(sent.size, placed.length, 'the Host was sent somebody who is nowhere');
  // Every family's land, as it truly is: not remembered, not assumed to be a camp.
  assert.deepEqual(Object.keys(view.overview.lands).sort(), Object.keys(world.households).sort());
  let houses = 0, cleared = 0;
  for (const household of Object.values(world.households)) {
    const land = view.overview.lands[household.id];
    assert.equal(land.homeSiteId, household.homeSiteId);
    assert.deepEqual(land.view, landView(household), `${household.id}'s house is drawn as it is not`);
    assert.deepEqual(land.grant, holdingOf(world, household).bounds, `${household.id}'s land line is not its own`);
    assert.deepEqual(land.plots.map(plot => [plot.id, plot.state]), plotsOf(world, household).map(plot => [plot.id, plot.state]), `${household.id}'s plots are not its own`);
    if (pieced(household)) assert.equal(land.pieces.length, household.house.pieces.length);
    if (land.view.shelter !== 'camp') houses++;
    cleared += land.plots.filter(plot => plot.state === 'cleared').length;
  }
  assert.ok(houses > 0, 'no family had a house going up; nothing here tests that land is shown as it stands');
  assert.ok(cleared > 0, 'no family had cleared ground; nothing here tests the plots');
});

test('a student is sent exactly what it was before: its own people, who it can see, and nothing of the Host’s', () => {
  const { world } = played(10, 150);
  const everyone = new Set(Object.values(world.entities).filter(entity => entity.location).map(entity => entity.id));
  for (const householdId of Object.keys(world.households)) {
    const view = student(world, householdId);
    assert.equal(view.overview, undefined, `${householdId} was sent the class overview`);
    assert.deepEqual(view.others, structuredClone(observedBy(world, householdId)), `${householdId} was sent people it cannot see`);
    assert.ok(view.entities.every(entity => entity.householdId === householdId), `${householdId} was sent another family's people as its own`);
    // The fog is real: most of the class is not in this family's payload at all.
    const wire = JSON.stringify(view);
    // Except the keeper of a shop the family itself dealt at: since 2026-09-19 a town errand keeps `traderId` on the
    // family's own chore, beside the keeper's name in plain words, all the way home. It is the family's own record of its
    // own business, not another family's. (Found 2026-09-19: the test's wire scan had no allowance for it, and any change
    // of timing that let an errand finish inside the 150 ticks would have tripped it.)
    const dealtWith = new Set(view.entities.flatMap(own => own.chore?.traderId ? [own.chore.traderId] : []));
    const hidden = [...everyone].filter(id => !view.others.some(other => other.id === id) && !view.entities.some(own => own.id === id) && !dealtWith.has(id));
    assert.ok(hidden.length > everyone.size / 2, `${householdId} could see most of the class`);
    for (const id of hidden) assert.ok(!wire.includes(`"${id}"`), `${householdId} was sent ${id}, whom it cannot see`);
    // Whoever it is, they keep a shop: a keeper is known by their counter, not by the shape of their id. Marta Ibarra's is
    // `town-ibarra`, and the name pattern this once tested for let her through only by luck of which family dealt when.
    for (const id of dealtWith) {
      const keeper = world.entities[id];
      assert.ok(keeper?.shopSpot || keeper?.deals?.length, `${householdId} kept the id of ${id}, who keeps no shop`);
    }
  }
});

test('the Host is still sent nothing of what a family keeps: what a rider carries, a question and its prices, hidden stats, coin', () => {
  const { world: played10 } = played(10, 150);
  const world = structuredClone(played10);
  const marks = /REPORT-MARK|ASK-MARK|SKILL-MARK|TRAIT-MARK|91919|"traits"|"skills"|"report"|"ask"|"resources"|"purse"|"glory"/;
  let rider = 0, asked = 0;
  for (const entity of Object.values(world.entities)) {
    if (entity.courier) { entity.report = { text: 'REPORT-MARK' }; rider++; }
    if (entity.kind === 'person' && entity.householdId) {
      entity.skills = { hunting: 'SKILL-MARK' };
      entity.traits = { strength: 'TRAIT-MARK' };
      if (entity.chore) { entity.chore.ask = { text: 'ASK-MARK', options: [] }; asked++; }
    }
  }
  for (const household of Object.values(world.households)) household.resources = { ...household.resources, money: 91919 };
  assert.ok(rider && asked, 'the fixture planted nothing on a rider or a working person');
  assert.doesNotMatch(JSON.stringify(host(world)), marks);
});

test('the Host’s whole class stays a bounded payload, and a long road rides along only round the traveller', () => {
  // Thirty families on the real land, the largest class: at the arrival, when every family is on the road in (the heaviest
  // snapshot measured), and well into the afternoon.
  const { world, arrival } = played(30, 150);
  const later = host(world);
  for (const [when, view] of [['at the arrival', arrival], ['150 ticks in', later]]) {
    const bytes = JSON.stringify(view).length;
    // Measured 2026-09-16: 108,999 bytes at this class's arrival and 86,473 at tick 161; 117,523 at the worst tick of
    // another thirty-family class (docs/evidence/host-view.json). Before the Host had no fog it was about 2 KB.
    // Moved 2026-09-22 from 140,000: the owner's roll made the number on the die the family's size, one to twenty, and this
    // class went from 159 people to 331. Measured then: 210,231 bytes at the arrival (132,587 on the old table) and 157,844
    // at tick 150 (110,400). The bytes a figure did not move (450 at the arrival either way), so the growth is the people
    // and not waste; the per-figure bound on the next line is the one that catches waste, and it stands.
    assert.ok(bytes < 240000, `the Host's snapshot ${when} is ${bytes} bytes`);
    assert.ok(bytes / view.others.length < 520, `the Host's snapshot ${when} is ${Math.round(bytes / view.others.length)} bytes a figure`);
  }
  // Riders cross the colonies on roads far longer than the window.
  const long = Object.values(world.entities).filter(entity => entity.travel && polylineLength(entity.travel.points) > 4 * ROAD_WINDOW_MILES);
  assert.ok(long.length, 'nobody was on a long road; nothing here tests the window');
  for (const entity of long) {
    const sent = later.others.find(other => other.id === entity.id).travel;
    const segments = entity.travel.points.slice(1).map((p, i) => Math.hypot(p.x - entity.travel.points[i].x, p.y - entity.travel.points[i].y));
    assert.ok(polylineLength(sent.points) <= 2 * ROAD_WINDOW_MILES + 2 * Math.max(...segments) + 1e-6, `${entity.id} was sent ${polylineLength(sent.points).toFixed(1)} miles of road`);
  }
  // At either end of a road, and past it, the window still holds the traveller.
  const road = [{ x: 0, y: 0 }, { x: 5, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 5 }];
  for (const progress of [0, 4.9, 10, 15]) {
    const { points, base } = roadWindow(road, progress);
    const at = along(points, progress - base), truly = along(road, progress);
    assert.ok(Math.hypot(at.x - truly.x, at.y - truly.y) < 1e-9, `the window at ${progress} puts the traveller at ${JSON.stringify(at)}`);
  }
});

test('a traveller sent with only the stretch of road round them walks it on the Host’s page as they would on the whole road', async () => {
  const { ProjectionMotion, travelDirection } = await import('../public/motion.js');
  // Twenty miles east, then twenty south: a rider eighteen miles along is still heading east, a tick later past the corner.
  const road = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 20, y: 0 }, { x: 20, y: 10 }, { x: 20, y: 20 }];
  const sent = progress => { const { points, base } = roadWindow(road, progress); return { from: 'a', to: 'b', points, base, progress, distance: 40 }; };
  const rider = progress => ({ id: 'rider', kind: 'person', carrier: true, location: { ...along(road, progress), siteId: null }, travel: sent(progress) });
  assert.equal(travelDirection(rider(18)), 'e', 'heading read off the wrong stretch of the road');
  assert.equal(travelDirection(rider(21)), 's', 'heading read off the wrong stretch of the road');
  const motion = new ProjectionMotion(), tickMs = 1000;
  motion.accept({ sessionId: 's', revision: 1, tickMs, world: { tick: 1, minute: 20, status: 'running', entities: [], others: [rider(18)] } }, 0);
  motion.accept({ sessionId: 's', revision: 2, tickMs, world: { tick: 2, minute: 40, status: 'running', entities: [], others: [rider(20.6)] } }, tickMs);
  for (const fraction of [0, 0.5, 1]) {
    const at = motion.position(rider(20.6), tickMs + tickMs * fraction), truly = along(road, 18 + 2.6 * fraction);
    assert.ok(Math.hypot(at.x - truly.x, at.y - truly.y) < 1e-9, `halfway through a tick the rider is drawn at ${JSON.stringify(at)}, not ${JSON.stringify(truly)}`);
  }
});

test('over the wire the Host watches the whole class and still cannot give a family an order', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'texas-host-view-'));
  const app = createClassroom({ seed: 'host-view-wire', playerCount: 5, savePath: join(dir, 'save.json'), tickMs: 10000 });
  const port = await app.listen(0, '127.0.0.1');
  const call = async (path, data, cookie) => {
    const response = await fetch(`http://127.0.0.1:${port}${path}`, { method: data ? 'POST' : 'GET', headers: { ...(data && { 'Content-Type': 'application/json' }), ...(cookie && { Cookie: cookie }) }, ...(data && { body: JSON.stringify(data) }) });
    return { status: response.status, body: await response.json(), cookie: response.headers.get('set-cookie')?.split(';')[0] };
  };
  try {
    const joined = [];
    for (let i = 0; i < 5; i++) joined.push(await call('/api/join', { name: `Family ${i}`, code: app.state.sessionCode }));
    const teacher = (await call('/api/host', { key: app.state.hostKey })).cookie;
    const watching = (await call('/api/state', null, teacher)).body.world;
    assert.equal(Object.keys(watching.overview.lands).length, 5, 'the Host was not sent every family’s land');
    const theirs = joined[3].body.world.entities.find(entity => entity.kind === 'person');
    assert.ok(watching.others.some(entity => entity.id === theirs.id), 'the Host cannot see a family’s person');
    for (const family of joined) {
      const own = (await call('/api/state', null, family.cookie)).body.world;
      assert.equal(own.overview, undefined, 'a student was sent the class overview');
    }
    const before = structuredClone(app.state.world.entities[theirs.id]);
    const order = await call('/api/command', { id: 'host-orders-a-family', action: 'travel', entityId: theirs.id, destination: 'gonzales' }, teacher);
    assert.equal(order.status, 400);
    assert.match(order.body.error, /Host action unavailable/);
    assert.deepEqual(app.state.world.entities[theirs.id], before, 'the Host moved somebody');
  } finally {
    await app.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
