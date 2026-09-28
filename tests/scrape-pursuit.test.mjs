// The family's own way east, and Mexican troops on it (owner, 2026-09-27; docs/SCRAPE.md §11-§14, sim/flight-route.mjs,
// sim/pursuit.mjs). Where the family goes and by which way, changed on the road; the road faster and seen from further off;
// only a column or a patrol on the record's days can see a family; the order to halt; halting; the chase at the record's
// paces; the shots by the researched table; never a child; a beast hit slows the train; the timber, the miles and the dark;
// automatic families halt; old saves open; the route drawn for the family's own page and nobody else's.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { applyAction, projectWorld, stepWorld, validateWorld } from '../sim/world.mjs';
import { calendarMinutes } from '../sim/clock.mjs';
import { on, clockOf } from '../sim/advance.mjs';
import { stirredShare } from '../sim/shares.mjs';
import { WAGON_SPEED, WALK_SPEED, HORSE_SPEED } from '../sim/travel.mjs';
import { COUNTRY_SIGHT, FAMILY_RUN_MPH, GALLOP_MPH, HIT_RANGES, HIT_TABLE, INFANTRY_MPH, MOVING_SHARE, NIGHT_SIGHT_MILES, PATROLS, SIGHT, TROT_MPH, WEATHER_SIGHT_MILES, CAUGHT_YARDS, HAIL_YARDS, GROWN_AGE, ALTO_PATIENCE_TICKS, altoOptions, hitChance, patrolsNow, runMph, sightMiles, watchersNow, hidesIn } from '../sim/pursuit.mjs';
import { chaseStep } from '../sim/military-pacing.mjs';
import { flightPlaces, planLeg, acrossCountry } from '../sim/flight-route.mjs';
import { ROAD_ASKS, withFamily, familyPoint } from '../sim/road.mjs';
import { activityOf, mendSickness, sicknessDay } from '../sim/disease.mjs';
import { choreAvailability } from '../sim/chores.mjs';
import { sexOf } from '../sim/family.mjs';
import { spring, until } from './support/scrape-spring.mjs';
import { placeFamily, sceneFor, stowAway } from './support/scrape-scene.mjs';

const view = (world, householdId, role = 'student') => projectWorld(world, householdId, role, { includeMap: false });
const grown = person => !Number.isFinite(person.age) || person.age >= GROWN_AGE;
/** Steps the chase through to its end, answering the order to halt with `answer` (or leaving it unanswered). */
function play(world, household, main, answer, { each = null } = {}) {
  const seen = { ticks: 0, steps: [], shots: [], lines: [], hailed: false, phases: [] };
  for (let t = 0; t < 300; t++) {
    const step = calendarMinutes(world);
    stepWorld(world);
    const chase = household.flight.chase;
    if (chase) {
      seen.ticks++; seen.steps.push(step); seen.phases.push(chase.phase);
      for (const shot of chase.shots) if (!seen.shots.some(one => one.n === shot.n)) seen.shots.push(shot);
      for (const line of chase.lines) if (!seen.lines.some(one => one.id === line.id)) seen.lines.push(line);
      if (chase.hailed) seen.hailed = true;
      each?.(chase);
    }
    if (household.flight.ask?.id === 'alto' && answer) applyAction(world, household.id, { action: 'road-answer', entityId: main.id, option: answer });
    if (!chase && household.flight.pursued?.length) break;
  }
  seen.outcome = household.flight.pursued?.at(-1);
  return seen;
}

test('the family chooses where it goes and by which way, with stops, and changes it on the road; the train goes as one', () => {
  const world = spring();
  const household = world.households['hh-1'];
  stowAway(world, household, 'san-felipe');
  const main = world.entities[household.mainId = household.members.find(id => world.entities[id].principal)];
  // Any place a family could make for, not the five refuges only.
  const places = flightPlaces(world.map);
  for (const id of ['harrisburg', 'staffords', 'new-washington', 'lynchburg', 'thompsons']) assert.ok(places.includes(id), `${id} is not a place a family can make for`);
  assert.ok(!places.some(id => id.startsWith('ford-') || world.map.sites[id].kind === 'woods'), 'a creek ford or a stand of timber offered as a place to make for');
  // Refused in words.
  assert.throws(() => applyAction(world, household.id, { action: 'flight-route', entityId: main.id, route: { stops: ['nowhere'], ways: ['road'] } }), /not a place/);
  assert.throws(() => applyAction(world, household.id, { action: 'flight-route', entityId: main.id, route: { stops: ['harrisburg'], ways: ['sideways'] } }), /road or goes across country/);
  applyAction(world, household.id, { action: 'flight-route', entityId: main.id, route: { stops: ['staffords', 'harrisburg'], ways: ['road', 'country'] } });
  assert.equal(household.flight.status, 'fled');
  assert.equal(household.flight.refuge, 'harrisburg', 'the destination is not where the family is making for');
  const { people, beasts } = withFamily(world, household);
  assert.ok(people.length && beasts.length, 'the family did not set out with its beasts');
  assert.equal(new Set([...people, ...beasts].map(one => one.travel.speed)).size, 1, 'the train does not go at one pace');
  assert.ok([...people, ...beasts].every(one => one.travel.to === 'staffords'), 'the train is not making for its first stop');
  assert.ok(world.events.some(event => event.householdId === household.id && event.decision === 'flight-route' && /Harrisburg, by way of Stafford/.test(event.text)));
  // The route on the family's own page: its stops and ways, the next stop, the pace, the path, and how far off it can be seen.
  const shown = view(world, household.id).flight;
  assert.deepEqual(shown.route.stops.map(stop => [stop.id, stop.way]), [['staffords', 'road'], ['harrisburg', 'country']]);
  assert.equal(shown.route.next.id, 'staffords');
  assert.ok(shown.route.line.length === 2 && shown.route.line.every(line => line.length >= 2), 'the path is not drawn from the train through every stop');
  assert.ok(Number.isFinite(shown.seen.miles), 'the card cannot say how far off the family is seen');
  // Changed mid-road: it turns at once, from where it stands.
  for (let t = 0; t < 6; t++) stepWorld(world);
  const leader = withFamily(world, household).people[0];
  const here = { ...leader.location };
  assert.ok(leader.travel.progress > 0, 'the family never moved');
  applyAction(world, household.id, { action: 'flight-route', entityId: main.id, route: { stops: ['thompsons'], ways: ['road'] } });
  assert.equal(leader.travel.to, 'thompsons');
  assert.ok(Math.hypot(leader.location.x - here.x, leader.location.y - here.y) < 1e-6 && leader.travel.progress > 0, 'the new way does not go on from where the family stood');
  assert.equal(household.flight.refuge, 'thompsons');
  validateWorld(world);
  // To the stop and on to the next by itself; camped at the last.
  applyAction(world, household.id, { action: 'flight-route', entityId: main.id, route: { stops: ['san-felipe', 'thompsons'], ways: ['road', 'road'] } });
  until(world, () => leader.travel?.to === 'thompsons' || household.flight.status === 'refuged', 400);
  assert.equal(leader.travel?.to, 'thompsons', 'the family did not go on from its stop');
  until(world, () => household.flight.status === 'refuged', 600);
  assert.equal(household.flight.refuge, 'thompsons');
  assert.equal(household.flight.route, undefined);
  validateWorld(world);
});

test('the road is quicker; across country is slower by its going, a wagon cannot cross timber, and a family off the road is seen from half as far', () => {
  const world = spring();
  const road = planLeg(world, { siteId: 'harrisburg' }, 'lynchburg', 'road', 'foot');
  const country = planLeg(world, { siteId: 'harrisburg' }, 'lynchburg', 'country', 'foot');
  const going = path => { const slow = new Map(path.pace || []); return path.points.slice(1).reduce((sum, b, i) => sum + Math.hypot(b.x - path.points[i].x, b.y - path.points[i].y) * (slow.get(i) || 1), 0); };
  assert.ok(!road.offRoad, 'the road went across country');
  assert.ok(country.offRoad?.reduce((sum, [a, b]) => sum + b - a, 0) > country.distance * 0.8, 'across country kept to the road');
  assert.ok(going(country) > going(road), `across country (${going(country).toFixed(1)}) was not slower than the road (${going(road).toFixed(1)})`);
  // Out of the Brazos bottom below Thompson's the wagon cannot go across country through the timber.
  const wagonCountry = planLeg(world, { siteId: 'thompsons' }, 'staffords', 'country', 'wagon');
  assert.ok(!wagonCountry || !(wagonCountry.offRoad || []).length, 'the wagon went across country through the Brazos timber');
  // Seen: a wagon on an open road three miles, half that off the road, a man on foot a mile; weather and night close it in.
  assert.deepEqual([SIGHT.wagon.open, SIGHT.foot.open, SIGHT.mounted.open, COUNTRY_SIGHT], [3, 1, 2, 0.5]);
  const household = world.households['hh-1'];
  stowAway(world, household, 'harrisburg');
  placeFamily(world, household, { from: 'harrisburg', to: 'lynchburg', atMiles: 1, how: 'wagon' });
  const onRoad = sightMiles(world, household);
  const closed = miles => (['rain', 'storm', 'fog'].includes(onRoad.weather) ? Math.min(miles, WEATHER_SIGHT_MILES) : miles);
  assert.equal(onRoad.way, 'road');
  assert.equal(onRoad.miles, Math.round((onRoad.night ? Math.min(closed(SIGHT.wagon[onRoad.cover]), NIGHT_SIGHT_MILES) : closed(SIGHT.wagon[onRoad.cover])) * 1000) / 1000);
  const main = world.entities[household.mainId];
  applyAction(world, household.id, { action: 'flight-route', entityId: main.id, route: { stops: ['lynchburg'], ways: ['country'] } });
  assert.ok(acrossCountry(withFamily(world, household).people[0].travel), 'the family is not across country');
  const off = sightMiles(world, household);
  assert.equal(off.way, 'country');
  const expected = SIGHT.wagon[off.cover] * COUNTRY_SIGHT;
  assert.equal(off.miles, Math.round((off.night ? Math.min(closed(expected), NIGHT_SIGHT_MILES) : closed(expected)) * 1000) / 1000, 'off the road the family is seen from as far as on it');
  validateWorld(world);
});

test('only a column on its dated road or a patrol out ahead of one can see a family, on the record\'s days', () => {
  const world = spring();
  const clock = clockOf(world);
  assert.deepEqual(watchersNow(world, on(1836, 3, 10, 12)), [], 'Mexican troops out before any column entered the country');
  assert.ok(PATROLS.length <= 6, 'patrols are not uncommon');
  for (const patrol of PATROLS) {
    const out = patrol.path ? [patrol.path[0].minute + 60] : (patrol.windows || [[patrol.from, patrol.until]]).map(([from]) => from + 60);
    for (const minute of out) assert.ok(patrolsNow(world, minute).some(one => one.id === patrol.id), `${patrol.id} is not out on its own day`);
    const before = patrol.path ? patrol.path[0].minute - 60 : (patrol.windows?.[0]?.[0] ?? patrol.from) - 60;
    assert.ok(!patrolsNow(world, before).some(one => one.id === patrol.id), `${patrol.id} is out before its day`);
  }
  // Santa Anna's dragoons ride ahead of his column, on its road, no further than the few miles they rode.
  const t = on(1836, 4, 15, 12);
  const dragoons = patrolsNow(world, t).find(one => one.id === 'santa-anna-dragoons');
  const column = watchersNow(world, t).find(one => one.id === 'santa-anna');
  const miles = Math.hypot(dragoons.x - column.x, dragoons.y - column.y);
  assert.ok(miles > 3 && miles <= 5.01, `the dragoons are ${miles.toFixed(1)} miles from the column's head`);
  // A family far from every column and patrol is never seen, however long it stands.
  const household = world.households['hh-1'];
  stowAway(world, household, 'nacogdoches');
  until(world, () => world.minute >= on(1836, 4, 16, 12) + clock, 4000);
  assert.equal(household.flight.chase, undefined);
  assert.equal(household.flight.pursued, undefined, 'a family at Nacogdoches was seen by Mexican troops');
});

test('Mexican horsemen come on, order the family to halt in Spanish with the English under it, and a family that halts is taken without a shot', () => {
  const world = spring();
  const { household, main } = sceneFor(world, { kind: 'cavalry', how: 'wagon' });
  assert.ok(household.flight.chase, 'the dragoons did not see a wagon on the open road a mile and a half off');
  assert.equal(household.flight.chase.kind, 'cavalry');
  until(world, () => household.flight.ask?.id === 'alto', 20);
  const chase = household.flight.chase;
  assert.equal(chase.phase, 'hailed');
  assert.ok(chase.hailYards <= HAIL_YARDS && chase.hailYards > CAUGHT_YARDS, `called on to halt at ${chase.hailYards} yards`);
  assert.equal(calendarMinutes(world), 2, 'the clock is not held while the soldiers call on a played family to halt');
  const call = chase.lines.find(line => line.id === 'alto');
  assert.deepEqual([call.text, call.gloss, call.kind, call.side], ['¡Alto!', 'Halt!', 'reconstructed', 'mexican']);
  const shown = view(world, household.id).flight;
  assert.equal(shown.ask.id, 'alto');
  assert.deepEqual(shown.ask.options.map(option => option.id).slice(0, 2), ['halt', 'run']);
  assert.ok(shown.ask.options.find(option => option.id === 'run').note.includes(`${TROT_MPH}`), 'the run does not say how fast they come on');
  assert.ok(shown.chase && shown.chase.soldiers.length === chase.men, 'the family does not see the horsemen');
  const had = withFamily(world, household).beasts.map(beast => beast.id);
  applyAction(world, household.id, { action: 'road-answer', entityId: main.id, option: 'halt' });
  assert.equal(household.flight.chase.phase, 'caught');
  assert.equal(household.flight.chase.shotCount, 0, 'a family that halted was fired on');
  for (const id of had) assert.equal(world.entities[id].condition, 'taken', `${id} was not taken`);
  assert.ok(household.flight.overtaken, 'the family was not taken');
  assert.ok(world.events.some(event => event.decision === 'road-alto-halt' && event.householdId === household.id));
  validateWorld(world);
});

test('the chase goes at the record\'s paces: an ox wagon slower than infantry, a family on foot or on horseback faster, cavalry faster than all', () => {
  assert.ok(WAGON_SPEED * 3 < INFANTRY_MPH && INFANTRY_MPH < WALK_SPEED * 3 && WALK_SPEED * 3 < HORSE_SPEED * 3 && HORSE_SPEED * 3 < TROT_MPH && FAMILY_RUN_MPH < TROT_MPH && TROT_MPH < GALLOP_MPH, 'the paces are out of order');
  // Infantry after a wagon close on it, fire, and take it; after the same family on foot they fall behind and give it up.
  let world = spring();
  let scene = sceneFor(world, { kind: 'infantry', how: 'wagon' });
  assert.equal(runMph(world, scene.household), 2);
  let seen = play(world, scene.household, scene.main, 'run');
  assert.ok(seen.hailed, 'infantry never came up with a wagon a third of a mile ahead');
  assert.equal(seen.outcome.outcome, 'caught', `a running wagon got away from infantry (${seen.outcome.outcome})`);
  assert.ok(seen.shots.length > 0, 'infantry never fired on a family that ran');
  assert.deepEqual(seen.lines.map(line => line.text).slice(0, 3), ['¡Alto!', '¡Alto, o hacemos fuego!', '¡Fuego!'], 'the orders are not called before the firing');
  world = spring();
  scene = sceneFor(world, { kind: 'infantry', how: 'wagon' });
  seen = play(world, scene.household, scene.main, 'abandon-run');
  assert.equal(seen.outcome.outcome, 'escaped', 'a family on foot did not get away from infantry');
  // A family all on horseback goes at a horse's pace, and runs at its farm horses' best, still slower than a trot.
  world = spring();
  scene = sceneFor(world, { kind: 'cavalry', how: 'mounted', householdId: 'hh-4' });
  assert.ok(withFamily(world, scene.household).people.every(one => one.travel.speed === HORSE_SPEED), 'a family all on horseback goes at a walker\'s pace');
  assert.equal(runMph(world, scene.household), FAMILY_RUN_MPH);
  // Cavalry come up with a wagon however it runs, in the open.
  world = spring();
  scene = sceneFor(world, { kind: 'cavalry', how: 'wagon' });
  seen = play(world, scene.household, scene.main, 'run');
  assert.equal(seen.outcome.outcome, 'caught', 'a wagon outran cavalry on the open prairie');
});

test('the shots are the researched table: by range, shooter and target, a moving target at six in ten, nothing past two hundred yards', () => {
  for (const [shooter, rows] of Object.entries(HIT_TABLE)) for (const [target, row] of Object.entries(rows)) {
    HIT_RANGES.forEach((yards, i) => assert.equal(hitChance(yards, { shooter, target, moving: false }), row[i], `${shooter} at a ${target}, ${yards} yards`));
  }
  assert.deepEqual(HIT_TABLE.trained.man, [0.75, 0.45, 0.17, 0.08, 0.03]);
  assert.deepEqual(HIT_TABLE.hip.man, [0.44, 0.17, 0.05, 0.02, 0.01]);
  assert.deepEqual(HIT_TABLE.mounted.man, [0.17, 0.05, 0.01, 0, 0]);
  assert.equal(MOVING_SHARE, 0.6);
  assert.equal(hitChance(100, { shooter: 'trained', target: 'man', moving: true }), 0.17 * 0.6);
  assert.equal(hitChance(201, { shooter: 'trained', target: 'wagon', moving: false }), 0);
  const mid = hitChance(75, { shooter: 'trained', target: 'man', moving: false });
  assert.ok(mid < 0.45 && mid > 0.17, 'between two ranges is not between their chances');
  // Rolled as the chase rolls them, two thousand shots at a running man at a hundred yards hit about as often as the table says.
  let hits = 0;
  for (let n = 0; n < 2000; n++) if (stirredShare({ seed: 'shots' }, 'hh-1', `hh-1:1:shot:${n}`) < hitChance(100, { shooter: 'trained', target: 'man' })) hits++;
  assert.ok(Math.abs(hits / 2000 - 0.102) < 0.02, `the rolls hit ${hits} in 2000 at a chance of 0.102`);
});

test('only the men and the animals are fired at: never a woman or a child, nor a man or horse with one of them, nor the wagon; most shots miss', () => {
  let shots = 0, hits = 0, aimedAtPeople = 0;
  for (const [kind, householdId, how] of [['infantry', 'hh-1', 'wagon'], ['infantry', 'hh-2', 'wagon'], ['infantry', 'hh-6', 'wagon'], ['infantry', 'hh-8', 'wagon'], ['cavalry', 'hh-2', 'wagon'], ['cavalry', 'hh-8', 'wagon'], ['cavalry', 'hh-4', 'mounted']]) {
    const world = spring();
    const scene = sceneFor(world, { kind, how, householdId });
    // The living women and children going with the family (a baby the sickness took before the scene is not one of them).
    const spared = scene.household.members.map(id => world.entities[id]).filter(one => one.kind === 'person' && (!grown(one) || sexOf(one) !== 'male') && !['dead', 'captured'].includes(one.health?.condition));
    assert.ok(spared.some(one => !grown(one)) && spared.some(one => grown(one)), `${householdId} has no women and children to test by`);
    // Who is with them, as the shots are aimed (the seats as they were when the soldiers fired).
    const withThem = new Set();
    const seen = play(world, scene.household, scene.main, 'run', { each: () => { for (const one of spared) { if (one.travel?.rides) withThem.add(one.travel.rides); if (one.travel?.carried) withThem.add(one.travel.carried); } } });
    shots += seen.shots.length; hits += seen.shots.filter(shot => shot.hit).length;
    for (const shot of seen.shots) {
      assert.notEqual(shot.target.kind, 'wagon', 'a shot was fired at the wagon the women and children ride in');
      if (shot.target.kind === 'beast') { assert.ok(!withThem.has(shot.target.id), `a shot was fired at the ${shot.target.name} a woman or a child was on`); continue; }
      // Every shot at a person was at a grown man of the family (the record's own shot, which keeps whom it was aimed at).
      const person = world.entities[shot.target.id];
      assert.ok(person && scene.household.members.includes(person.id) && grown(person) && sexOf(person) === 'male', `a shot was aimed at ${shot.target.name} (${person?.age}, ${sexOf(person)}), who is no grown man of the family`);
      assert.ok(!withThem.has(person.id), `a shot was aimed at ${person.name}, who was carrying a baby`);
      aimedAtPeople++;
    }
    for (const one of spared) assert.ok(!['dead', 'wounded'].includes(one.health.condition), `${one.name} (${one.age}) was hurt in the chase`);
    validateWorld(world);
  }
  assert.ok(shots >= 20, `only ${shots} shots were fired in seven chases`);
  assert.ok(aimedAtPeople >= 5, `only ${aimedAtPeople} shots were aimed at anybody: the check would pass with nobody to check`);
  assert.ok(hits / shots < 0.3, `${hits} of ${shots} shots hit`);
});

test('women and children alone: the soldiers fire at the animals or hold their fire, and say so, as Almonte did at New Washington', () => {
  const alone = (how, kind = 'cavalry', householdId = 'hh-2', ahead = null) => {
    const world = spring();
    const household = world.households[householdId];
    const scene = sceneFor(world, { kind, how, householdId, ahead });
    // The grown men stayed behind at the house, with any horse they rode: the family on the road is its women and children.
    const home = world.map.sites[household.homeSiteId];
    for (const one of household.members.map(id => world.entities[id])) {
      if (one.kind !== 'person' || !grown(one) || sexOf(one) !== 'male') continue;
      const horse = one.travel?.saddle && world.entities[one.travel.rides];
      for (const left of [one, horse].filter(Boolean)) { left.travel = null; left.location = { x: home.x, y: home.y, siteId: home.id }; }
      one.task = 'rest';
    }
    if (scene.main.travel === null) scene.main = withFamily(world, household).people.find(grown);
    assert.ok(withFamily(world, household).people.length && withFamily(world, household).people.every(one => sexOf(one) !== 'male' || !grown(one)), 'a grown man is with the family');
    const ridden = new Set();
    const seen = play(world, household, scene.main, 'run', { each: () => { for (const one of withFamily(world, household).people) if (one.travel?.saddle) ridden.add(one.travel.rides); } });
    return { world, household, seen, ridden };
  };
  // On horseback (the dragoons a sixth of a mile behind, near enough to come up), no horse a woman or a child is on is fired at.
  const mounted = alone('mounted', 'cavalry', 'hh-4', 0.15);
  assert.ok(mounted.ridden.size, 'nobody of the family rode');
  assert.ok(mounted.seen.hailed, 'the dragoons never came up with the riders: the check would pass with nothing to check');
  for (const shot of mounted.seen.shots) assert.ok(!mounted.ridden.has(shot.target.id), `a shot was fired at the ${shot.target.name} a woman or a child was on`);
  validateWorld(mounted.world);
  // On foot there is nothing they may fire at: no shot, and the order to hold fire said, and written down.
  const afoot = alone('foot');
  assert.equal(afoot.seen.shots.length, 0, `${afoot.seen.shots.length} shots were fired at women and children`);
  const held = afoot.seen.lines.find(line => line.id === 'hold');
  assert.ok(held && held.text.startsWith('¡') && /women and children/.test(held.gloss), 'the soldiers did not say they held their fire');
  assert.ok(afoot.world.events.some(event => event.householdId === afoot.household.id && /held their fire/.test(event.text) && /Almonte/.test(event.text)), 'the family\'s record does not say the soldiers held their fire, nor why');
  // With the wagon, at the ox only.
  const wagon = alone('wagon');
  assert.ok(wagon.seen.shots.length > 0, 'nothing was fired at the oxen of a family of women and children');
  for (const shot of wagon.seen.shots) assert.equal(shot.target.kind, 'beast', `a shot was fired at the ${shot.target.name}`);
  validateWorld(afoot.world); validateWorld(wagon.world);
});

test('a beast hit slows the train: a lamed ox halves the wagon\'s pace, and an ox shot down leaves a running family on foot', () => {
  let world = spring();
  let scene = sceneFor(world, { kind: 'infantry', how: 'wagon' });
  until(world, () => scene.household.flight.ask?.id === 'alto', 30);
  applyAction(world, scene.household.id, { action: 'road-answer', entityId: scene.main.id, option: 'run' });
  const ox = withFamily(world, scene.household).beasts.find(beast => beast.kind === 'animal' && beast.species !== 'horse');
  ox.hurt = true;
  stepWorld(world);
  for (const one of [...withFamily(world, scene.household).people, ...withFamily(world, scene.household).beasts]) if (one.travel) assert.equal(one.travel.speed, WAGON_SPEED / 2, `${one.name} goes at full pace behind a lamed ox`);
  world = spring();
  scene = sceneFor(world, { kind: 'infantry', how: 'wagon' });
  until(world, () => scene.household.flight.ask?.id === 'alto', 30);
  applyAction(world, scene.household.id, { action: 'road-answer', entityId: scene.main.id, option: 'run' });
  const down = withFamily(world, scene.household).beasts.find(beast => beast.kind === 'animal' && beast.species !== 'horse');
  down.condition = 'dead'; down.travel = null; down.location = { ...down.location, siteId: 'harrisburg' };
  stepWorld(world);
  assert.equal(scene.household.flight.mode, 'foot', 'the family stayed with a wagon it had no ox for');
  assert.ok(withFamily(world, scene.household).people.every(one => one.travel?.mode === 'foot'));
  validateWorld(world);
});

test('they give up at the timber, after their miles, and at dark; they take a family they come up with', () => {
  // Into the timber: a family on horseback makes for it while Almonte's dragoons are still a mile off.
  let world = spring();
  let scene = sceneFor(world, { kind: 'timber', how: 'mounted', householdId: 'hh-4' });
  assert.ok(scene.household.flight.chase, 'the dragoons did not see the family');
  applyAction(world, scene.household.id, { action: 'flight-timber', entityId: scene.main.id });
  let seen = play(world, scene.household, scene.main, 'run');
  assert.equal(seen.outcome.outcome, 'escaped');
  assert.equal(scene.household.flight.pursued.at(-1).outcome, 'escaped');
  assert.ok(world.events.some(event => event.householdId === scene.household.id && /into the timber/.test(event.text)), 'the family did not get away into the timber');
  assert.ok(hidesIn(world, familyPoint(world, scene.household)) || withFamily(world, scene.household).people[0].travel, 'the family is not where it hid');
  // After their miles: a family on horseback seen a mile off is too far ahead for them.
  world = spring();
  scene = sceneFor(world, { kind: 'cavalry', how: 'mounted', householdId: 'hh-4' });
  seen = play(world, scene.household, scene.main, 'run');
  assert.equal(seen.outcome.outcome, 'escaped');
  assert.ok(world.events.some(event => event.householdId === scene.household.id && /far enough from their column|half an hour/.test(event.text)));
  // At dark: the same dragoons still coming on when the light goes (the clock put on to seven in the evening).
  world = spring();
  scene = sceneFor(world, { kind: 'cavalry', how: 'wagon' });
  assert.equal(scene.household.flight.chase?.phase, 'seen');
  world.minute = on(1836, 4, 15, 19, 0) + clockOf(world);
  seen = play(world, scene.household, scene.main, 'run');
  assert.equal(seen.outcome?.outcome, 'escaped', 'the dragoons rode on into the dark');
  assert.ok(world.events.some(event => event.householdId === scene.household.id && /night came on/.test(event.text)));
  // Caught within fifteen yards.
  world = spring();
  scene = sceneFor(world, { kind: 'infantry', how: 'wagon' });
  let closest = Infinity;
  seen = play(world, scene.household, scene.main, 'run', { each: chase => { closest = Math.min(closest, chase.lead ?? Infinity); } });
  assert.equal(seen.outcome.outcome, 'caught');
  assert.ok(closest <= CAUGHT_YARDS, `taken with the nearest man ${closest} yards off`);
});

test('an automatic family halts when it is ordered to, and an order nobody answers halts the family; both written down', () => {
  // Absent: answered at once, by the family's own fallback.
  let world = spring();
  let scene = sceneFor(world, { kind: 'cavalry', how: 'wagon' });
  scene.household.absent = true;
  let seen = play(world, scene.household, scene.main, null);
  assert.equal(seen.outcome.outcome, 'caught');
  assert.equal(seen.shots.length, 0, 'an automatic family was fired on');
  const auto = world.events.find(event => event.householdId === scene.household.id && event.decision === 'road-alto-halt');
  assert.match(auto?.text || '', /deciding for itself/);
  assert.ok(seen.steps.every(step => step >= 20) || seen.ticks <= 3, 'an absent family held the class\'s clock');
  // A student who does not answer: the family halts after its patience, and the record says nobody answered.
  world = spring();
  scene = sceneFor(world, { kind: 'infantry', how: 'wagon' });
  let asked = null;
  seen = play(world, scene.household, scene.main, null, { each: () => { if (scene.household.flight.ask?.id === 'alto' && asked === null) asked = world.tick; } });
  assert.equal(seen.outcome.outcome, 'caught');
  assert.equal(seen.shots.length, 0);
  // It lapses (sim/lapse.mjs, `FIC-GONZ-633`): nothing new is chosen, and the family stands as it was ordered to.
  const silence = world.events.find(event => event.householdId === scene.household.id && event.lapsed && /soldiers ordered/.test(event.text));
  assert.match(silence?.text || '', /Nobody answered for the family in time, and the question lapsed/);
  assert.ok(ALTO_PATIENCE_TICKS <= 4, 'the order waits too long for an answer');
  // A family nobody plays is not held for either.
  world = spring();
  scene = sceneFor(world, { kind: 'cavalry', how: 'wagon' });
  scene.household.played = false;
  seen = play(world, scene.household, scene.main, null);
  assert.equal(seen.outcome.outcome, 'caught');
  assert.equal(chaseStep(world), null);
});

test('the class\'s clock is held to the chase only for a family at its screen, and the chase is its own and the Host\'s to see, with its route its own alone', () => {
  const world = spring();
  const scene = sceneFor(world, { kind: 'cavalry', how: 'wagon' });
  stepWorld(world);
  assert.ok(Number.isFinite(chaseStep(world)) && chaseStep(world) <= 20, 'the chase does not hold the clock for its student');
  assert.equal(calendarMinutes(world), Math.min(chaseStep(world), calendarMinutes(world)));
  scene.household.absent = true;
  assert.equal(chaseStep(world), null, 'an absent family\'s chase holds the class');
  delete scene.household.absent;
  // The family's own page: the soldiers, the route and its line, through a stop to Lynchburg.
  applyAction(world, scene.household.id, { action: 'flight-route', entityId: scene.main.id, route: { stops: ['harrisburg', 'lynchburg'], ways: ['road', 'road'] } });
  const own = view(world, scene.household.id);
  assert.ok(own.flight.chase && own.flight.route?.line?.length === 2, 'the family does not see its chase and its path through its stop');
  // Another family: nothing of it.
  const other = view(world, 'hh-2');
  assert.equal(other.flight?.chase?.id === scene.household.flight.chase.id, false);
  assert.ok(!JSON.stringify(other).includes(scene.household.flight.chase.id), 'another family was sent this family\'s chase');
  assert.ok(!(other.chases), 'a student was sent the class\'s chases');
  // A point of the path beyond the stop: the way it means to go, which nobody else is sent.
  const later = own.flight.route.line[1], line = JSON.stringify(later[Math.floor(later.length / 2)]);
  assert.ok(!JSON.stringify(other).includes(line), 'another family was sent this family\'s route');
  // The Host: every chase, and nobody's route.
  const host = view(world, null, 'host');
  assert.ok(host.chases?.some(chase => chase.householdId === scene.household.id), 'the Host is not shown the chase');
  assert.ok(!JSON.stringify(host).includes(line), 'the Host was sent a family\'s route');
  // Never where the column is: the chase carries the soldiers as distances behind the family, not the column's head.
  assert.ok(!('x' in (own.flight.chase.soldiers[0] || {})), 'the soldiers\' own places were sent');
  assert.equal(own.armies?.some(army => army.id === 'santa-anna') ?? false, own.armies?.some(army => army.id === 'santa-anna') ?? false);
});

test('an old save opens: a flight with no route, no chase, no path fields validates and runs, and no save version moved', () => {
  const world = spring();
  const household = world.households['hh-1'];
  stowAway(world, household, 'san-felipe');
  const main = world.entities[household.mainId = household.members.find(id => world.entities[id].principal)];
  applyAction(world, household.id, { action: 'flight-route', entityId: main.id, route: { stops: ['lynchburg'], ways: ['road'] } });
  // As a class saved before 2026-09-27 would have it.
  delete household.flight.route; delete household.flight.lastPoint; delete household.flight.pursued; delete household.flight.chase;
  for (const one of Object.values(world.entities)) if (one.travel) { delete one.travel.offRoad; delete one.travel.way; }
  for (const one of Object.values(world.entities)) delete one.hurt;
  validateWorld(world);
  for (let t = 0; t < 12; t++) stepWorld(world);
  validateWorld(world);
  assert.equal(household.flight.refuge, 'lynchburg');
  assert.match(readFileSync(new URL('../server/app.mjs', import.meta.url), 'utf8'), /saveVersion: 3,/, 'the save version moved');
});

test('rest and the chase (docs/DISEASE.md §3.7): a chase is never rest, no camp is made with soldiers after the family, a camp that runs goes, and a wound is the wound\'s', () => {
  const world = spring();
  const { household, main } = sceneFor(world, { kind: 'infantry', how: 'wagon' });
  const chase = household.flight.chase;
  assert.ok(chase, 'the column did not see the wagon');
  const { people, beasts } = withFamily(world, household);
  const patient = people.find(one => one.id !== main.id && grown(one));
  patient.health = { condition: 'sick', recoversAt: world.minute + 5 * 1440, disease: 'lung-fever' };
  // Stood still in the chase - the ox down in the traces, or a camp the soldiers came up on - the sick are not resting.
  for (const one of [...people, ...beasts]) if (one.travel) one.travel.halted = true;
  assert.notEqual(activityOf(world, patient), 'rest', 'a sick person was resting with soldiers coming after the family');
  for (const one of [...people, ...beasts]) if (one.travel) delete one.travel.halted;
  // Nobody stops the family to rest or to nurse while they come on.
  for (const id of ['rest-road', 'tend-sick']) {
    const offered = choreAvailability(world, household, main, id);
    assert.equal(offered.can, false, `${id} was offered with soldiers after the family`);
    assert.match(offered.why, /soldiers/i, `${id}: ${offered.why}`);
  }
  // A family camped by the road nursing its sick when the soldiers see it, that runs: the camp breaks, and the train goes. (A day's
  // rest is two ticks, which a chase's two-minute ticks end at once; the nursing is six.)
  delete household.flight.chase;
  applyAction(world, household.id, { action: 'chore', entityId: main.id, chore: 'tend-sick' });
  assert.equal(main.chore?.id, 'tend-sick', 'the nursing was not given before the soldiers came');
  household.flight.chase = chase;
  until(world, () => household.flight.ask?.id === 'alto', 30);
  assert.equal(household.flight.ask?.id, 'alto', 'the soldiers never called on the camped family to halt');
  applyAction(world, household.id, { action: 'road-answer', entityId: main.id, option: 'run' });
  const leader = withFamily(world, household).people.find(one => one.travel?.purpose === 'flee');
  const from = leader.travel.progress;
  stepWorld(world);
  assert.notEqual(main.chore?.id, 'tend-sick', 'the family ran and went on nursing where it stood');
  assert.ok(!leader.travel?.halted && leader.travel.progress > from, 'the family ran, and the camp held it where it was');
  // A person wounded in a chase is on the wound's own clock: the sickness neither mends it nor makes it sick.
  const hit = withFamily(world, household).people.find(one => one.id !== patient.id && grown(one) && one.health.condition !== 'dead');
  hit.health = { condition: 'wounded', recoversAt: world.minute + 21 * 1440 };
  const wound = structuredClone(hit.health);
  mendSickness(world, 24 * 60);
  sicknessDay(world, household, hit, { day: Math.floor(world.minute / 1440) + 1, causes: [{ disease: 'lung-fever', key: 'wounded-test', chance: 1, text: 'x' }], where: 'road' });
  assert.deepEqual(hit.health, wound, 'the sickness touched a wound');
  validateWorld(world);
});

test('one mile is a mile: a column about a mile off, and a family running behind a lamed ox, are never "1 miles"', () => {
  // The warning's words, in the family's record and in its question (sim/road.mjs), with Santa Anna's column about a mile
  // behind the family when the tick is over, and then closer than half a mile ("about 0 miles off" was said before).
  let world, scene;
  for (const [ahead, miles, said] of [[2, 1, /is about 1 mile off/], [0.3, 0, /is less than a mile off/]]) {
    world = spring();
    scene = sceneFor(world, { kind: 'infantry', how: 'wagon', ahead });
    stepWorld(world);
    const word = world.events.find(event => event.householdId === scene.household.id && /^Word along the road/.test(event.text));
    assert.ok(word && scene.household.flight.danger, `no warning came with the column ${ahead} miles behind`);
    assert.equal(Math.round(scene.household.flight.danger.miles), miles, `the column is not where the check wants it: ${scene.household.flight.danger.miles}`);
    const asked = ROAD_ASKS.danger.text(world, scene.household);
    assert.match(word.text, said);
    assert.match(asked, said);
    for (const text of [word.text, asked]) assert.doesNotMatch(text, /\b[01] miles\b/);
  }
  // The order to halt's answers, priced in miles an hour: a lamed ox draws the wagon at one (sim/pursuit.mjs `runMph`).
  world = spring();
  scene = sceneFor(world, { kind: 'infantry', how: 'wagon' });
  until(world, () => scene.household.flight.ask?.id === 'alto', 30);
  withFamily(world, scene.household).beasts.find(beast => beast.kind === 'animal' && beast.species !== 'horse').hurt = true;
  assert.equal(runMph(world, scene.household), 1);
  const options = altoOptions(world, scene.household), run = options.find(option => option.id === 'run');
  assert.match(run.label, /\(1 mile an hour\)/);
  assert.match(run.note, /at about 1 mile an hour;/);
  for (const option of options) assert.doesNotMatch(`${option.label} ${option.note}`, /\b1 miles\b/);
});

test('one army: a family Santa Anna\'s dragoons stripped is not warned or taken again by his column or his other patrols; another army still can', () => {
  // Owner, 2026-09-28, by multiple choice, "One army": once a column or one of its patrols has stripped a family, neither the
  // column nor any of its patrols troubles it again. Found by the proof fixer: taken by the dragoons, warned of the column a tick later.
  const world = spring();
  const { household, main } = sceneFor(world, { kind: 'cavalry', how: 'wagon' });
  until(world, () => household.flight.ask?.id === 'alto', 20);
  applyAction(world, household.id, { action: 'road-answer', entityId: main.id, option: 'halt' });
  assert.deepEqual(household.flight.overtakenBy, ['santa-anna-dragoons'], 'the dragoons did not strip the family');
  const stripped = world.events.length;
  let nearest = Infinity;
  for (let t = 0; t < 12; t++) {
    stepWorld(world);
    const at = familyPoint(world, household), head = watchersNow(world).find(one => one.id === 'santa-anna');
    if (at && head) nearest = Math.min(nearest, Math.hypot(head.x - at.x, head.y - at.y));
    assert.notEqual(household.flight.danger?.id, 'santa-anna', `warned of Santa Anna's column ${t + 1} ticks after his dragoons stripped the family`);
  }
  assert.ok(nearest < 20, `the column never came within the warning's twenty miles (${nearest.toFixed(1)}), so this proves nothing`);
  assert.ok(!world.events.slice(stripped).some(event => event.householdId === household.id && /^Word along the road: Santa Anna/.test(event.text)), 'the family was told Santa Anna\'s column was coming');
  assert.deepEqual(household.flight.overtakenBy, ['santa-anna-dragoons'], 'the family was stripped again');

  // Put in front of them again, having set out since it was stripped (so "not again until it sets out" is not what holds them).
  const strippedBy = id => one => {
    one.flight.overtakenBy = [id];
    one.flight.overtaken = { minute: one.flight.leftMinute - 1440, column: id };
  };
  const met = (kind, by, how = 'wagon', householdId = 'hh-1') => {
    const world = spring();
    const scene = sceneFor(world, { kind, how, householdId, prepare: strippedBy(by) });
    const flight = scene.household.flight;
    let chased = Boolean(flight.chase), warned = null;
    for (let t = 0; t < 3; t++) {
      stepWorld(world);
      chased ||= Boolean(flight.chase || flight.pursued?.length || flight.overtakenBy.length > 1);
      warned ||= flight.danger?.id || null;
    }
    return { chased, warned };
  };
  // His column, a few hundred yards behind a family his dragoons stripped: nobody sent after it, and no warning of it.
  assert.deepEqual(met('infantry', 'santa-anna-dragoons'), { chased: false, warned: null }, 'Santa Anna\'s column troubled a family his dragoons had stripped');
  // His dragoons, after a family his column stripped: not chased, and the column behind them not warned of.
  assert.deepEqual(met('cavalry', 'santa-anna'), { chased: false, warned: null }, 'Santa Anna\'s dragoons troubled a family his column had stripped');
  // Another of his patrols (Almonte with the dragoons of his escort), after a family the dragoons stripped.
  assert.equal(met('timber', 'santa-anna-dragoons', 'mounted', 'hh-4').chased, false, 'Almonte\'s dragoons chased a family Santa Anna\'s dragoons had stripped');
  // Another army still can: a family Urrea's cavalry or Sesma's column stripped is chased by Santa Anna's, and warned of his column.
  assert.deepEqual(met('infantry', 'urrea-horse'), { chased: true, warned: 'santa-anna' }, 'a family Urrea\'s cavalry stripped was spared by Santa Anna\'s column');
  assert.equal(met('cavalry', 'sesma').chased, true, 'a family Sesma\'s column stripped was spared by Santa Anna\'s dragoons');
});
