import test from 'node:test';
import assert from 'node:assert/strict';
import { createSettledWorld } from './support/settled.mjs';
import { stepWorld, applyAction, beginTravel, projectWorld, EXERTION_CAP } from '../sim/world.mjs';
import { advanceRoutine, TIRING_MILES, RESTED_MILES, REST_MILES_PER_MINUTE } from '../sim/routines.mjs';
import { TIMELINE } from '../sim/directors.mjs';

// Fatigue's second source.
//
// Until this existed `tired` was set in exactly one place - `settleHelp`, at the very end
// of the slice - so nobody was ever tired while it still mattered. Three things followed
// from that and all three were dead: the hurt rung of the upriver march could not be
// reached, the injured pose could not be drawn in a played class, and the map's two-to
// -twenty-five mile spread of homesteads changed nothing but a travel timer.
//
// Walking is the second source, and the point of choosing walking is that it is the one
// tied to the ground. A family nineteen miles out now pays for that in the state of
// whoever it sends.

const principal = (world, id) => world.entities[world.households[id].principalId];
const milesToTown = (world, id) => {
  const home = world.map.sites[world.households[id].homeSiteId], town = world.map.sites.gonzales;
  return Math.hypot(home.x - town.x, home.y - town.y);
};

test('walking is what tires somebody, and it is counted in real miles', () => {
  const world = createSettledWorld('fatigue-walk', 5);
  world.status = 'running';
  const thomas = principal(world, 'hh-1');
  assert.equal(thomas.exertion || 0, 0, 'nobody starts the class already worn out');

  beginTravel(world, thomas, 'gonzales');
  const distance = thomas.travel.distance;
  let ticks = 0, onArrival = null;
  while (thomas.travel && ticks < 200) {
    stepWorld(world); ticks++;
    // Read it on the tick the journey ends. Arriving sets the task to rest, and the same
    // tick's routine already starts mending it, so a reading taken later is short.
    if (!thomas.travel) onArrival = thomas.exertion;
  }
  assert.equal(thomas.location.siteId, 'gonzales');
  // Every mile of the road, and no more: exertion is the journey, not a per-tick tax.
  const mended = REST_MILES_PER_MINUTE * 20;
  assert.ok(Math.abs(onArrival - distance) <= mended + 0.01,
    `walked ${distance.toFixed(2)} miles and accrued ${onArrival} of exertion`);
  assert.ok(onArrival > distance - mended - 0.01, 'some of the road was not counted at all');
});

test('a chore in the yard is not a journey and does not wear anybody out', () => {
  const world = createSettledWorld('fatigue-chore', 5);
  world.status = 'running';
  const elena = world.entities['hh-1-elena'];
  applyAction(world, 'hh-1', { action: 'chore', entityId: elena.id, chore: 'plant-field' });
  for (let tick = 0; tick < 40 && elena.chore; tick++) stepWorld(world);
  // Planting walks out to the field and back, but a `walk` step moves somebody about
  // their own land and never goes through beginTravel. Only real journeys count.
  assert.equal(elena.exertion || 0, 0, 'working the home field wore somebody out as if they had travelled');
  assert.equal(elena.health.condition, 'well');
});

test('twenty miles makes somebody tired, and the record says why', () => {
  const world = createSettledWorld('fatigue-threshold', 5);
  world.status = 'running';
  const thomas = principal(world, 'hh-1');

  thomas.exertion = TIRING_MILES - 0.5;
  advanceRoutine(world, 20);
  assert.equal(thomas.health.condition, 'well', 'tiring before the stated distance');

  thomas.exertion = TIRING_MILES;
  advanceRoutine(world, 20);
  assert.equal(thomas.health.condition, 'tired');
  const said = world.events.filter(e => e.type === 'condition' && e.actorId === thomas.id).at(-1);
  assert.ok(said, 'becoming tired happened silently, with nothing in the record to explain it');
  assert.match(said.text, /tired after \d+ miles on the road/);
  assert.equal(said.householdId, 'hh-1', 'the family is not told it is about one of theirs');
});

test('rest mends it and work does not, which is what the Rest verb is for', () => {
  const world = createSettledWorld('fatigue-rest', 5);
  world.status = 'running';
  const thomas = principal(world, 'hh-1');
  thomas.exertion = TIRING_MILES + 4;
  advanceRoutine(world, 20);
  assert.equal(thomas.health.condition, 'tired');

  // Working through it changes nothing.
  thomas.task = 'work';
  const before = thomas.exertion;
  for (let i = 0; i < 10; i++) advanceRoutine(world, 20);
  assert.equal(thomas.exertion, before, 'working somehow rested him');
  assert.equal(thomas.health.condition, 'tired');

  // Sitting down does.
  thomas.task = 'rest';
  let ticks = 0;
  while (thomas.health.condition === 'tired' && ticks < 100) { advanceRoutine(world, 20); ticks++; }
  assert.equal(thomas.health.condition, 'well');
  assert.ok(thomas.exertion <= RESTED_MILES);
  // Roughly the stated rate, so the number in the source is the number in the world.
  const expected = (TIRING_MILES + 4 - RESTED_MILES) / (REST_MILES_PER_MINUTE * 20);
  assert.ok(Math.abs(ticks - expected) <= 2, `took ${ticks} ticks of rest, expected about ${expected.toFixed(1)}`);
  // And it does not flicker back the moment it recovers.
  advanceRoutine(world, 20);
  assert.equal(thomas.health.condition, 'well');
});

test('nobody outside a family ever tires: not a courier on a horse, not the town', () => {
  const world = createSettledWorld('fatigue-others', 5);
  world.status = 'running';
  for (let tick = 0; tick < 300 && !world.director.complete; tick++) stepWorld(world);
  const outsiders = Object.values(world.entities).filter(e => e.kind === 'person' && !e.householdId);
  assert.ok(outsiders.length >= 3, 'expected couriers and townspeople to exist by now');
  for (const person of outsiders) {
    assert.equal(person.exertion, undefined, `${person.id} accrued exertion; only a family's own people walk themselves tired`);
    assert.notEqual(person.health?.condition, 'tired', `${person.id} was made tired`);
  }
  // And an ox pulling a wagon is not a person with a condition to lose.
  for (const beast of Object.values(world.entities).filter(e => e.kind !== 'person')) {
    assert.equal(beast.exertion, undefined, `${beast.id} accrued exertion`);
  }
});

test('how far a family lives from town now decides the state of who it sends', () => {
  // The whole reason for choosing walking as the source. Before this, the map's spread of
  // homesteads changed a travel timer and nothing else.
  //
  // The rule is stated against the ROAD, not the crow. A homestead twelve miles from town
  // as the crow flies can be a twenty-mile walk, and the road is what a person actually
  // covers - so asserting "the farthest family always arrives tired" would be asserting
  // the wrong distance and would fail on a seed where the farthest home is simply close.
  const outcomes = [];
  for (const seed of ['geo-a', 'geo-b', 'geo-c', 'geo-d']) {
    const world = createSettledWorld(seed, 5);
    world.status = 'running';
    const roads = new Map();
    for (const id of Object.keys(world.households)) {
      const walker = principal(world, id);
      beginTravel(world, walker, 'gonzales');
      roads.set(id, walker.travel.distance);
    }
    for (let tick = 0; tick < 300 && Object.keys(world.households).some(id => principal(world, id).travel); tick++) stepWorld(world);
    for (const [id, road] of roads) {
      const walker = principal(world, id);
      const tired = walker.health.condition === 'tired';
      assert.equal(tired, road >= TIRING_MILES,
        `${seed}/${id} walked ${road.toFixed(1)} road miles to town and arrived ${walker.health.condition}; the stated threshold is ${TIRING_MILES}`);
      outcomes.push(tired);
    }
  }
  // And the split is real rather than theoretical: on the map this game actually builds,
  // some families arrive fit and others arrive worn out.
  assert.ok(outcomes.some(Boolean), 'no household anywhere was far enough from town for the walk to matter');
  assert.ok(outcomes.some(tired => !tired), 'every household was tired by the walk to town; the threshold is too low to distinguish anybody');
});

test('which risk the upriver control states is decided by the walk, and it is kept', () => {
  // The two systems meeting. A family close to town is offered the light cost; a family
  // far out is offered the heavy one, because their man is already worn out when he gets
  // there. Whichever is stated is what settles - the nine miles up the river must not
  // quietly turn a promised 'tired' into a delivered injury.
  const outcomes = [];
  for (const seed of ['promise-a', 'promise-b', 'promise-c']) {
    const world = createSettledWorld(seed, 5);
    world.status = 'running';
    const helped = new Set(); let stated = null, settled = null;
    for (let tick = 0; tick < 400 && !world.director.complete; tick++) {
      stepWorld(world);
      if (world.minute >= TIMELINE.resolved && settled === null) settled = principal(world, 'hh-1').health.condition;
      const request = projectWorld(world, 'hh-1', 'student', { includeMap: false }).request;
      if (request?.status === 'open' && request.kind !== 'march' && !helped.has('hh-1')) {
        try { applyAction(world, 'hh-1', { action: request.kind === 'rumor' ? 'go-see' : 'help', entityId: principal(world, 'hh-1').id }); if (request.kind !== 'rumor') helped.add('hh-1'); } catch { /* not yet known */ }
      }
      if (request?.kind === 'march' && request.status === 'open' && stated === null) {
        stated = request.risk;
        applyAction(world, 'hh-1', { action: 'go-upriver', entityId: request.actorId });
      }
    }
    assert.ok(stated, `${seed}: hh-1 was never offered the march`);
    const promised = /hurt/.test(stated) ? 'minor-injury' : 'tired';
    assert.equal(settled, promised, `${seed}: the control said "${stated}" and the world delivered ${settled}`);
    outcomes.push(promised);
  }
  assert.ok(outcomes.length === 3, 'three classes were measured');
});

test('routine time may tire somebody and may never do worse', () => {
  // Invariant 3: routine resolution cannot quietly kill, capture, revive or erase a major
  // injury. Fatigue runs inside advanceRoutine, so it is the thing most able to break it.
  const world = createSettledWorld('fatigue-invariant', 5);
  world.status = 'running';
  const [a, b, c] = world.households['hh-1'].members.map(id => world.entities[id]);
  a.health = { condition: 'dead' }; b.health = { condition: 'captured' };
  c.health = { condition: 'minor-injury', recoversAt: world.minute + 99999 };
  for (const person of [a, b, c]) { person.exertion = EXERTION_CAP; person.task = 'rest'; }
  for (let i = 0; i < 50; i++) advanceRoutine(world, 20);
  assert.equal(a.health.condition, 'dead', 'routine time revived somebody');
  assert.equal(b.health.condition, 'captured', 'routine time released somebody');
  assert.equal(c.health.condition, 'minor-injury', 'routine time erased an injury that had not run its course');
  // And resting is never able to invent a worse state than tired.
  const fresh = world.entities['hh-2-thomas'];
  fresh.exertion = EXERTION_CAP;
  for (let i = 0; i < 50; i++) advanceRoutine(world, 20);
  assert.ok(['well', 'tired'].includes(fresh.health.condition), `routine time produced ${fresh.health.condition}`);
});

test('a very long journey cannot become a rest debt nobody can pay off', () => {
  const world = createSettledWorld('fatigue-cap', 5);
  world.status = 'running';
  const thomas = principal(world, 'hh-1');
  thomas.exertion = EXERTION_CAP - 1;
  const far = Object.values(world.map.sites).find(site => site.kind === 'homestead' && site.id !== world.households['hh-1'].homeSiteId);
  beginTravel(world, thomas, far.id);
  for (let tick = 0; tick < 300 && thomas.travel; tick++) stepWorld(world);
  assert.ok(thomas.exertion <= EXERTION_CAP, `exertion reached ${thomas.exertion}, past the cap of ${EXERTION_CAP}`);
  thomas.task = 'rest';
  let ticks = 0;
  while (thomas.health.condition === 'tired' && ticks < 200) { advanceRoutine(world, 20); ticks++; }
  assert.equal(thomas.health.condition, 'well', 'somebody could not rest off a long walk');
});

test('a class saved before walking tired anybody still runs', () => {
  // No save version moved, so the missing field has to default rather than refuse.
  const world = createSettledWorld('fatigue-oldsave', 5);
  world.status = 'running';
  for (const entity of Object.values(world.entities)) delete entity.exertion;
  const thomas = principal(world, 'hh-1');
  beginTravel(world, thomas, 'gonzales');
  // A class now starts at dawn on the 28th (docs/SETTLING_IN.md), so the slice runs longer.
  for (let tick = 0; tick < 400 && !world.director.complete; tick++) stepWorld(world);
  assert.ok(Number.isFinite(thomas.exertion), 'the missing field was not defaulted on use');
  assert.equal(world.director.complete, true, 'the class failed to finish');
});
