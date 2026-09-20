// What the country of 1836 changes in play: docs/BIOME_GAMEPLAY.md, 2026-09-19.
//
// Owner, 2026-09-19: "once the new biomes are added, have another sub agent research changes to the game that should occur
// based on the updated biomes and make those changes" - "balance and gameplay". Held here: a hunt brings the quarry its place
// holds, fixed by the ground and the season and said on the control before anybody goes; the kill gives what that quarry
// gives, and only a deer is drawn; ducks and geese on the coast in winter come quickly; a family with no timber of its own
// can fetch its logs from the nearest timber with the ox and wagon, at a cost said in hours and miles, and a family nobody
// plays does so when timber is near and builds a jacal when it is not; and a fence out on the open prairie takes longer,
// because its rails come from the timber. A class of the old rules keeps its deer and its fences.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, projectWorld, stepWorld, validateWorld } from '../sim/world.mjs';
import { CHORES, FETCH_LOGS, choresFor, logwoodGround } from '../sim/chores.mjs';
import { holdingOf } from '../sim/grants.mjs';
import { siteFactsFor, choosing } from '../sim/homesite.mjs';
import { GAME, THIN, WATERFOWL_MILES, huntFacts, huntingPlace, quarryAt, quarryGame, quarryWords, stillTicks, westOfTheLavaca } from '../sim/hunting.mjs';
import { FENCE_TICKS, FENCE_TICKS_A_MILE, fenceWork, fenceWords, plotsOf } from '../sim/fields.mjs';
import { FETCH_LOGS_MILES, fetchesLogs, soundLogsNear, thinkFor } from '../sim/neighbours.mjs';
import { CREEK_GALLERY_MILES, CREEK_STRIP_MILES, STANDS, WOODS_SOURCE_2016, gridStandAt, patchAt, patchCover, standAt } from '../sim/woods.mjs';
import { realTerrain } from '../sim/terrain-data.mjs';
import { landAround } from '../sim/ground.mjs';
import { coloniesMap } from '../sim/colonies-map.mjs';
import { dateOf } from '../sim/clock.mjs';

const WINTER = [10, 11, 0, 1, 2];
/** Every place on the holding worth trying, on a grid. */
const placesOn = (bounds, side = 12) => {
  const places = [];
  for (let i = 0; i < side; i++) for (let j = 0; j < side; j++) places.push({ x: +(bounds.minX + (bounds.maxX - bounds.minX) * (i + 0.5) / side).toFixed(3), y: +(bounds.minY + (bounds.maxY - bounds.minY) * (j + 0.5) / side).toFixed(3) });
  return places;
};
/** A colonies class with every family on its land and its house site chosen by the neighbours' own rule, then played by hand. */
function onTheLand(seed, families = 30) {
  const world = createGonzalesWorld(seed, families, { map: 'colonies', neighbours: true });
  world.status = 'running';
  for (let tick = 0; tick < 300 && Object.values(world.households).some(h => h.arriving || choosing(h)); tick++) stepWorld(world);
  for (const household of Object.values(world.households)) household.played = true;
  // Nobody is at work: every person home and free, so the one sent is the only thing happening in the family.
  for (const household of Object.values(world.households)) for (const id of household.members) { const person = world.entities[id]; if (person.chore) applyAction(world, household.id, { action: 'stop-chore', entityId: id }); }
  // And everybody, the ox and the wagon brought over to the house site and standing there.
  const moving = () => Object.values(world.entities).some(entity => entity.householdId && entity.travel);
  for (let tick = 0; tick < 100 && moving(); tick++) stepWorld(world);
  return world;
}
/** The places on every holding of a class, with what a hunt there would find. */
function huntingPlaces(world) {
  const found = [];
  for (const household of Object.values(world.households)) {
    for (const point of placesOn(holdingOf(world, household).bounds, 8)) {
      const facts = huntFacts(world, household, point);
      if (facts.can) found.push({ household, point, facts });
    }
  }
  return found;
}
/** Send the family's principal to hunt a place, answering the shot by waiting (a certain kill), and follow it to the end. */
function huntAt(world, household, point) {
  const hunter = world.entities[household.principalId];
  const before = { food: household.resources.food, hides: household.resources.hides ?? 0, events: world.events.length };
  household.resources.powder = Math.max(household.resources.powder ?? 0, 2);
  applyAction(world, household.id, { action: 'hunt-land', entityId: hunter.id, x: point.x, y: point.y });
  const frames = [];
  for (let tick = 0; tick < 200 && hunter.chore; tick++) {
    const ask = hunter.chore.ask?.text;
    if (ask) applyAction(world, household.id, { action: 'answer-chore', entityId: hunter.id, option: 'wait' });
    if (hunter.chore) frames.push({ quarry: hunter.chore.quarry, still: hunter.chore.doing === 'waiting downwind, and still', ask });
    stepWorld(world);
    validateWorld(world);
  }
  assert.equal(hunter.chore, null, 'the hunt finished');
  const events = world.events.slice(before.events).filter(event => event.householdId === household.id);
  return { hunter, frames, events, hides: (household.resources.hides ?? 0) - before.hides };
}

test('the quarry a place holds is fixed by its ground and the season, and deer are everywhere game is', () => {
  const bottom = STANDS.bottomland.quarry, coast = STANDS['coastal-prairie'].quarry, grass = STANDS['tallgrass-prairie'].quarry;
  const seen = { timber: {}, octoberOpen: {}, novemberOpen: {}, tallgrassWinter: {}, tallgrassSummer: {} };
  for (let px = 0; px < 60; px++) for (let py = 0; py < 60; py++) {
    const count = (bucket, id) => { seen[bucket][id] = (seen[bucket][id] || 0) + 1; };
    count('timber', quarryAt(bottom, 'timber', false, 9, px, py));
    count('octoberOpen', quarryAt(coast, 'open', false, 9, px, py));
    count('novemberOpen', quarryAt(coast, 'open', false, 10, px, py));
    count('tallgrassWinter', quarryAt(grass, 'open', false, 0, px, py));
    // July: out of the buffalo's months, which since 2026-09-20 run September to April (`HIST-TEX-260`).
    count('tallgrassSummer', quarryAt(grass, 'open', false, 6, px, py));
    // The same ground in the same month brings the same quarry, every time it is asked.
    assert.equal(quarryAt(bottom, 'timber', true, 3, px, py), quarryAt(bottom, 'timber', true, 3, px, py));
    // What keeps to cover is never met on the open grass, nor the open grass's game in the timber.
    assert.notEqual(quarryAt(bottom, 'open', false, 9, px, py), 'bear');
    assert.notEqual(quarryAt(grass, 'timber', false, 0, px, py), 'bison');
  }
  // In the bottoms: deer most, turkey, and bear least.
  assert.ok(seen.timber.deer > seen.timber.turkey && seen.timber.turkey > seen.timber.bear && seen.timber.bear > 0, JSON.stringify(seen.timber));
  // Ducks and geese and the buffalo only in the winter months.
  assert.equal(seen.octoberOpen.waterfowl, undefined, 'ducks and geese on the coast in October');
  assert.ok(seen.novemberOpen.waterfowl > 0, JSON.stringify(seen.novemberOpen));
  assert.ok(seen.octoberOpen.cattle > 0 && seen.octoberOpen.mustang > 0 && seen.octoberOpen.deer > 0, JSON.stringify(seen.octoberOpen));
  // And out on the open prairie the deer is still the commonest thing on it, by a good margin (2026-09-20,
  // `HIST-TEX-261`): Holley has them "so plentiful and tame, that they often come upon the plantations of farmers, and
  // feed in company with the cattle", and Dilue Harris had them feeding near the house at Stafford's Point in 1834.
  // Before this the open prairie gave a deer no more weight than a wild cow or a mustang.
  assert.ok(seen.octoberOpen.deer > seen.octoberOpen.mustang * 1.5, `a deer on ${seen.octoberOpen.deer} open coastal patches against ${seen.octoberOpen.mustang} mustangs`);
  // A buffalo is rare on the winter grass and never the half of it (2026-09-20, `HIST-TEX-262`): Berlandier has the herds
  // gone from the colonized districts "since 1828", and Kuykendall, who killed one on New Year's Creek in January 1822,
  // "found no more during our residence there". Before this it was one open tallgrass patch in two.
  assert.ok(seen.tallgrassWinter.bison > 0, JSON.stringify(seen.tallgrassWinter));
  assert.ok(seen.tallgrassWinter.bison < seen.tallgrassWinter.deer / 8, `a buffalo on ${seen.tallgrassWinter.bison} of ${seen.tallgrassWinter.bison + seen.tallgrassWinter.deer} open tallgrass patches`);
  assert.deepEqual(Object.keys(seen.tallgrassSummer), ['deer'], 'a deer is what the tallgrass holds out of the buffalo months');
  // Nothing on the dunes; a salt prairie out of the ducks' months still has the odd deer.
  assert.equal(quarryAt(STANDS.dunes.quarry, 'open', false, 0, 1, 1), null);
  assert.equal(quarryAt(STANDS['salt-prairie'].quarry, 'open', false, 9, 1, 1), 'deer');
  for (const id of Object.keys(GAME)) assert.ok(STANDS && GAME[id].a && GAME[id].meat > 0 && GAME[id].covers.length, id);
  assert.deepEqual([...GAME.waterfowl.months].sort((a, b) => a - b), [...WINTER].sort((a, b) => a - b), 'ducks and geese are winter game');
  // The buffalo's months are the sources' and not the ducks': north "in April or May", south again "in September and
  // October" (Berlandier through Hornaday, `HIST-TEX-201`, read whole 2026-09-20), so September to April and never the
  // summer. September was left out when these were first written and is his own word (`HIST-TEX-260`).
  assert.deepEqual([...GAME.bison.months].sort((a, b) => a - b), [0, 1, 2, 3, 8, 9, 10, 11]);
  for (const month of [4, 5, 6, 7]) assert.ok(!GAME.bison.months.includes(month), `a buffalo in month ${month}`);
  // Said as the season has it.
  assert.equal(quarryWords(STANDS['salt-prairie'].quarry, 9), 'Ducks and geese come in the winter.');
  assert.equal(quarryWords(STANDS['salt-prairie'].quarry, 11), 'Ducks and geese keep to it.');
});

test('the control says what would come to a place and what it would bring home, before anybody is sent', () => {
  const world = onTheLand('biome-game-words');
  const places = huntingPlaces(world);
  const kinds = new Set(places.map(place => place.facts.comes));
  for (const kind of ['deer', 'turkey', 'bear']) assert.ok(kinds.has(kind), `no ${kind} anywhere in a class: ${[...kinds]}`);
  for (const { facts } of places) {
    if (!facts.comes) { assert.match(facts.words, /Nothing is hunted here\./); continue; }
    assert.match(facts.words, new RegExp(`Waiting here, ${GAME[facts.comes].a}: `));
    assert.match(facts.words, /food/);
  }
  const turkey = places.find(place => place.facts.comes === 'turkey'), deer = places.find(place => place.facts.comes === 'deer');
  assert.match(turkey.facts.words, /Waiting here, a turkey: four food\.$/);
  assert.match(deer.facts.words, /Waiting here, a deer: five food, all one can carry, and the hide\.$/);
});

test('a hunt brings the quarry its place holds: what it gives comes home, only a deer is drawn, and the family is told', () => {
  const world = onTheLand('biome-game-hunt');
  const places = huntingPlaces(world);
  for (const kind of ['turkey', 'deer', 'bear']) {
    const place = places.find(entry => entry.facts.comes === kind && !entry.household.played2);
    assert.ok(place, `no ${kind}`);
    place.household.played2 = true;
    const { household, point } = place;
    const hunter = world.entities[household.principalId];
    const skill = hunter.skills.hunting;
    const food = household.resources.food;
    const { frames, events, hides } = huntAt(world, household, point);
    delete household.played2;
    // The shot is asked about this quarry.
    assert.ok(frames.some(frame => frame.ask?.includes(`downwind of ${GAME[kind].a},`)), `${kind}: ${frames.map(f => f.ask).filter(Boolean)}`);
    // What came home: the meat by the hunter's hand, no more than one carries, and the hide if it has one.
    const meat = GAME[kind].meat * (skill === 3 ? 1.4 : skill === 2 ? 1.15 : 1);
    const kill = events.find(event => event.type === 'hunt-kill');
    assert.ok(kill, `${kind}: no kill recorded`);
    assert.equal(kill.quarry, kind);
    assert.equal(kill.food, Math.min(meat, 5));
    assert.match(kill.text, new RegExp(`brought down ${GAME[kind].a}: `));
    assert.equal(hides, GAME[kind].hide, `${kind}'s hide`);
    assert.ok(household.resources.food >= food + kill.food - 1, `${kind}: the food did not come home`);
    // Only a deer is drawn (stand-in: docs/ART_REQUESTS.md, 2026-09-19 - the game of 1836): nothing else is given a place.
    if (kind === 'deer') assert.ok(frames.some(frame => frame.quarry?.kind === 'deer'), 'the deer was not drawn');
    else assert.ok(frames.every(frame => frame.quarry === undefined), `a deer was drawn where the words say ${GAME[kind].a}`);
  }
});

test('in the winter the ducks and geese sit on the coast in numbers, and the wait for them is short', () => {
  assert.equal(stillTicks(quarryGame(0.15, 'waterfowl')), 1);
  assert.equal(stillTicks(quarryGame(0.15, 'deer')), 5);
  const world = onTheLand('biome-game-ducks');
  // Into December: the calendar only, with nothing else moved (a played class, and nobody at work).
  const target = Date.UTC(1835, 11, 1, 8);
  world.minute += Math.round((target - dateOf(world, world.minute).getTime()) / 60000);
  const places = huntingPlaces(world).filter(place => place.facts.comes === 'waterfowl');
  assert.ok(places.length > 0, 'no ducks and geese on the coast in December');
  const poor = places.find(place => place.facts.game <= 0.35);
  assert.ok(poor, 'no poor ground holding ducks');
  assert.match(poor.facts.words, /Ducks and geese sit on the water in numbers: the wait is short\./);
  const { frames, events } = huntAt(world, poor.household, poor.point);
  assert.equal(frames.filter(frame => frame.still).length, 1, 'waited longer than a tick for the ducks');
  assert.equal(events.find(event => event.type === 'hunt-kill')?.quarry, 'waterfowl');
});

test('the wild herds keep west of the Lavaca, and the ducks and geese to the water (2026-09-19)', () => {
  // docs/BIOMES.md §7.1 wrote these limits into its table - wild cattle and mustangs "west of the Lavaca", bison "north and
  // west of the Colorado" - and they were lost when it became a flat list, so a wild cow or a mustang came to one prairie
  // hunt in three in the Austin colony. Woodman, 1835, of the wild horses: "Within the organized settlements they are not
  // numerous" (`HIST-TEX-200`); of the fowl, they are on "the waters near the coast" (`HIST-TEX-202`).
  const places = coloniesMap().places;
  // West: Béxar, Goliad, Refugio, Victoria, and the two frontier settlements, Gonzales and Mina. East: the settled Brazos.
  for (const [id, west] of [['bexar', true], ['goliad', true], ['refugio', true], ['victoria', true], ['gonzales', true], ['mina', true],
    ['san-felipe', false], ['columbia', false], ['brazoria', false], ['washington', false], ['liberty', false], ['matagorda', false], ['harrisburg', false], ['nacogdoches', false]]) {
    assert.equal(westOfTheLavaca(places[id]), west, `${id} west of the Lavaca`);
  }
  const world = onTheLand('biome-game-range');
  const winter = Date.UTC(1835, 11, 1, 8);
  world.minute += Math.round((winter - dateOf(world, world.minute).getTime()) / 60000);
  const wet = new Set(['marsh', 'salt-prairie', 'cypress-swamp']);
  // Amended 2026-09-20 (`HIST-TEX-260`, `-261`, `FIC-GONZ-170`, `-171`): the wild cow, the buffalo and the javelina are
  // still stopped at the Lavaca, but the **mustang** is only thinned east of it - Woodman's own sentence is "not
  // numerous", not "none", and Dilue Harris had wild horses feeding near the house at Stafford's Point in 1834 - and the
  // **antelope** is gone from every place a family can hunt, which no line was ever going to do.
  const STOPPED = ['cattle', 'bison', 'javelina'];
  let herds = 0, east = 0, fowlDry = 0, fowlWet = 0, seen = 0, mustangHeldEast = 0, mustangCameEast = 0, eastPlaces = 0;
  for (const { point, facts } of huntingPlaces(world)) {
    seen++;
    const west = westOfTheLavaca(point);
    if (!west) eastPlaces++;
    const anyHerd = STOPPED.some(id => facts.quarry?.includes(id));
    if (anyHerd) { herds++; assert.ok(west, `a wild herd east of the Lavaca: ${facts.quarry}`); } else if (!west) east++;
    assert.ok(!STOPPED.includes(facts.comes) || west, `${facts.comes} east of the Lavaca`);
    // The antelope belongs to the chaparral and the mixed-grass prairie, and no family in this box lives in either: not
    // one place a class can hunt holds one, on either bank, and none is ever what comes.
    assert.ok(!facts.quarry?.includes('pronghorn'), `an antelope on a family's land: ${facts.stand} at ${point.x},${point.y}`);
    assert.notEqual(facts.comes, 'pronghorn', `an antelope came to a hunt: ${facts.stand}`);
    if (!west && facts.quarry?.includes('mustang')) mustangHeldEast++;
    if (!west && facts.comes === 'mustang') mustangCameEast++;
    if (facts.quarry?.includes('waterfowl')) {
      const near = landAround().nearestWater(point, () => true, WATERFOWL_MILES);
      if (near || wet.has(facts.stand)) fowlWet++; else fowlDry++;
    }
  }
  assert.ok(seen > 200, `${seen} places`);
  assert.ok(herds > 0 && east > 0, `${herds} places with a wild herd, ${east} east of the Lavaca without one`);
  assert.ok(fowlWet > 0, 'no ducks and geese by the water in December');
  assert.equal(fowlDry, 0, 'ducks and geese on dry ground a quarter mile from any water');
  // The mustang is no longer stopped at the river - the coastal prairie east of it holds one again - but it is thin:
  // fewer than one place in twenty brings one, where its full weight brings one in seven or eight (`HIST-TEX-261`).
  assert.ok(mustangHeldEast > 0, 'no place east of the Lavaca holds a mustang at all');
  assert.ok(mustangCameEast > 0, 'the mustang is thin east of the Lavaca, not absent');
  assert.ok(mustangCameEast / eastPlaces < 0.05, `a mustang came to ${mustangCameEast} of ${eastPlaces} places east of the Lavaca`);
  // And thin against the very same ground at its full weight: only the mustang's own share is changed.
  const coast = STANDS['coastal-prairie'].quarry;
  const thinned = new Map([['mustang', THIN]]);
  let full = 0, thin = 0;
  for (let px = 0; px < 60; px++) for (let py = 0; py < 60; py++) {
    if (quarryAt(coast, 'open', false, 9, px, py) === 'mustang') full++;
    if (quarryAt(coast, 'open', false, 9, px, py, thinned) === 'mustang') thin++;
  }
  assert.ok(thin > 0 && thin * 4 < full, `a mustang on ${thin} of 3600 thinned patches against ${full} at full weight`);
});

test('the antelope keeps to its own country, and that country is nowhere a family lives (2026-09-20)', () => {
  // The owner, 2026-09-20: "I've never heard of Antelope in Texas." The antelope was in Texas, but not here and not then.
  // Neither contemporary enumeration of Texas game names it - Woodman's chapter of 1835 (pp. 59-60) and Holley's zoology of
  // 1836 (pp. 94-100) both run through buffalo, deer, bear, peccary, wolf, panther, wildcat, wild horse, turkey, duck,
  // goose, brant, swan, raccoon, opossum, rabbit, squirrel and fox, with no antelope among them - and every dated sighting
  // is far west or south-west of the colonies: Olmsted's "one small herd" on the frontier road west of San Antonio and his
  // antelope "below the chaparral wilderness"; Bartlett's thousands between the Rio Grande and Corpus in December 1852;
  // Bailey's records of 1899-1902, none east of Alice (`HIST-TEX-260`). So the antelope belongs to `chaparral` and
  // `mixedgrass-prairie` and to nothing else, and those two stands stand west of 97.4°W in this grid.
  const holds = Object.entries(STANDS).filter(([, stand]) => stand.quarry?.includes('pronghorn')).map(([id]) => id);
  assert.deepEqual(holds.sort(), ['chaparral', 'mixedgrass-prairie']);
  // And it is out of every one of the stands the settled colonies are made of.
  for (const id of ['mesquite-savanna', 'hill-savanna', 'coastal-prairie', 'tallgrass-prairie', 'live-oak', 'post-oak', 'thorn-riparian', 'palm-grove', 'salt-prairie', 'dunes', 'marsh']) {
    assert.ok(!STANDS[id].quarry?.includes('pronghorn'), `an antelope on the ${STANDS[id].name}`);
  }
  // Read off the grid itself: every cell of either stand is west of the Lavaca and west of the 97.4th meridian, which is
  // west of every settled place in the box but Béxar - and Béxar's own country holds neither stand.
  const terrain = realTerrain();
  const { origin, projection } = terrain.header;
  const lonOf = x => origin.lon + x / projection.milesPerLon;
  let cells = 0, east = null;
  for (let x = -350; x <= 400; x += 2) for (let y = -320; y <= 210; y += 2) {
    if (!holds.includes(gridStandAt({ x, y }))) continue;
    cells++;
    const lon = lonOf(x);
    if (east === null || lon > east) east = lon;
    assert.ok(westOfTheLavaca({ x, y }), `antelope country east of the Lavaca at ${lon.toFixed(2)}`);
  }
  assert.ok(cells > 100, `${cells} cells of antelope country`);
  assert.ok(east < -97.4, `antelope country reaches ${east.toFixed(2)}, east of the 97.4th meridian`);
  // And no settled place stands in it.
  for (const place of Object.values(coloniesMap().places)) {
    if (place.kind !== 'town') continue;
    assert.ok(!holds.includes(gridStandAt(place)), `${place.name} stands in antelope country`);
  }
});

test('a running creek as big as a bayou carries a belt of timber, not a fringe (2026-09-19)', () => {
  // docs/BIOMES.md §4.6 measured Harrisburg - "with no strip at all its timber within three miles falls from 14 in 100 to
  // none, so the strip must not simply be removed" - and the width it chose took it to 5. Buffalo, Brays, Sims, Berry and
  // Hunting bayous all run there all year, and the town sawed lumber by steam. Almonte, 1834, of the Brazos plains: "strips
  // of thick forest containing good wood for the construction of houses" (p. 202, `HIST-TEX-094`).
  const land = landAround();
  const biomes = { rule: 'biomes', nearCreek: land.nearCreek };
  // A named running creek through the coastal prairie carries timber a belt's width out; the fringe alone would not reach.
  const fringeOnly = { rule: 'biomes', nearCreek: (point, miles, flow) => (flow === 'gallery' ? false : land.nearCreek(point, miles, flow)) };
  const harrisburg = coloniesMap().places.harrisburg;
  const share = options => {
    let timber = 0, n = 0;
    for (let dx = -3; dx <= 3; dx += 1 / 8) for (let dy = -3; dy <= 3; dy += 1 / 8) {
      if (dx * dx + dy * dy > 9) continue;
      const patch = patchAt({ x: harrisburg.x + dx, y: harrisburg.y + dy }, options);
      if (patch.stand === 'water' || patch.stand === 'none') continue;
      n++; if (patchCover(patch) === 'timber') timber++;
    }
    return timber / n;
  };
  const now = share(biomes), fringe = share(fringeOnly);
  assert.ok(fringe < 0.07, `the fringe alone leaves Harrisburg ${(100 * fringe).toFixed(0)} in 100 timber`);
  assert.ok(now >= 0.09 && now <= 0.2, `Harrisburg is ${(100 * now).toFixed(0)} in 100 timber within three miles`);
  // The belt is the named creek's: a place a belt's width from Buffalo Bayou and no nearer any other water is creek timber.
  let found = null;
  for (let dx = -3; dx <= 3 && !found; dx += 1 / 16) for (let dy = -3; dy <= 3; dy += 1 / 16) {
    const point = { x: harrisburg.x + dx, y: harrisburg.y + dy };
    if (gridStandAt(point) !== 'coastal-prairie') continue;
    if (!land.nearCreek(point, CREEK_GALLERY_MILES, 'gallery') || land.nearCreek(point, CREEK_STRIP_MILES, 'perennial')) continue;
    found = point; break;
  }
  assert.ok(found, 'no coastal prairie in a named creek\'s belt but outside the fringe');
  assert.equal(standAt(found, biomes), 'creek', 'the belt of a named running creek is creek timber');
  assert.equal(standAt(found, fringeOnly), 'coastal-prairie', 'and without it the ground is bare prairie');
  // The hills keep their thin fringe: a creek there runs in a limestone channel (Olmsted p. 445, `HIST-TEX-102`), so a
  // hill-savanna place in a named creek's belt but outside the fringe is still savanna, not creek timber.
  let hills = null;
  for (let i = -260; i <= -40 && !hills; i++) for (let j = -60; j <= 60; j++) {
    const point = { x: i * 0.25, y: j * 0.25 };
    if (gridStandAt(point) !== 'hill-savanna') continue;
    if (!land.nearCreek(point, CREEK_GALLERY_MILES, 'gallery') || land.nearCreek(point, CREEK_STRIP_MILES, 'perennial')) continue;
    hills = point; break;
  }
  assert.ok(hills, 'no hill savanna in a named creek\'s belt but outside the fringe');
  assert.notEqual(standAt(hills, biomes), 'creek', 'the Hill Country keeps a fringe on its creeks, not a belt');
});

test('a class of the old rules keeps its deer: no quarry, the old yield, and a hunting place stored before is still read', () => {
  const world = onTheLand('biome-game-old', 5);
  world.map.woods = WOODS_SOURCE_2016;
  const household = world.households['hh-1'];
  const point = placesOn(holdingOf(world, household).bounds).find(each => huntFacts(world, household, each).can);
  assert.equal(huntingPlace(world, point).comes, undefined);
  const { frames, events, hides } = huntAt(world, household, point);
  assert.ok(frames.some(frame => frame.quarry?.kind === 'deer'));
  assert.equal(events.filter(event => event.type === 'hunt-kill').length, 0, 'the old rules record no kill of their own');
  assert.equal(hides, 1);
  // A hunt stored before quarry existed is valid; one naming a quarry the game does not know is not.
  const biomes = onTheLand('biome-game-old', 5);
  const again = biomes.households['hh-1'];
  applyAction(biomes, 'hh-1', { action: 'hunt-land', entityId: again.principalId, x: point.x, y: point.y });
  const chore = biomes.entities[again.principalId].chore;
  delete chore.ground.quarry;
  validateWorld(biomes);
  chore.ground.quarry = 'unicorn';
  assert.throws(() => validateWorld(biomes), /Invalid hunting place/);
});

test('a family can fetch logs from the nearest timber with the ox and wagon, told the cost in hours and miles', () => {
  const world = onTheLand('biome-game-logs');
  // The family with the fewest trees of its own, of those with the axe and the ox and wagon at home.
  const home = h => world.entities[`${h.id}-wagon`]?.location?.siteId === h.homeSiteId && world.entities[`${h.id}-animal`]?.location?.siteId === h.homeSiteId;
  const household = Object.values(world.households).filter(home).map(h => ({ h, logs: soundLogsNear(world, world.map.sites[h.homeSiteId], holdingOf(world, h).bounds) }))
    .filter(entry => entry.h.tools?.axe !== undefined).sort((a, b) => a.logs - b.logs)[0].h;
  const person = world.entities[household.principalId];
  const entry = choresFor(world, household, person).find(chore => chore.id === 'fetch-logs');
  assert.ok(entry?.can, JSON.stringify(entry));
  assert.match(entry.cost, /^the ox and wagon for about \d+ hours?, to the timber( on (the )?[A-Z][\w ]+)?, (beside the house|[\d.]+ miles off)$/);
  const pile = (household.logs?.wall || 0) + (household.logs?.sill || 0);
  // Whatever way it was asked for, it goes with the ox and wagon.
  applyAction(world, household.id, { action: 'chore', entityId: person.id, chore: 'fetch-logs', mode: 'horse' });
  const seen = new Set();
  for (let tick = 0; tick < 300 && person.chore; tick++) { if (person.travel) seen.add(person.travel.mode); stepWorld(world); validateWorld(world); }
  assert.equal(person.chore, null);
  assert.deepEqual([...seen], ['wagon']);
  assert.equal((household.logs?.wall || 0) + (household.logs?.sill || 0), pile + FETCH_LOGS, 'six logs on the pile');
  assert.ok(world.events.some(event => event.householdId === household.id && event.claimId === 'FIC-GONZ-066' && /brought 6 logs home in the wagon/.test(event.text)));
  // Refused, and said why: no axe; no ox and wagon at home; the lobby; a class where the trees are not counted.
  const axe = household.tools.axe;
  delete household.tools.axe;
  assert.match(choresFor(world, household, person).find(chore => chore.id === 'fetch-logs').why, /axe/);
  household.tools.axe = axe;
  world.entities[`${household.id}-wagon`].location = { ...world.entities[`${household.id}-wagon`].location, siteId: 'gonzales' };
  assert.match(choresFor(world, household, person).find(chore => chore.id === 'fetch-logs').why, /ox and wagon at home/);
  const invented = createGonzalesWorld('biome-game-invented', 5);
  assert.equal(choresFor(invented, invented.households['hh-1'], invented.entities[invented.households['hh-1'].principalId]).find(chore => chore.id === 'fetch-logs'), undefined);
  assert.equal(CHORES['fetch-logs'].forceMode(world, household), 'wagon', 'with no team left at the timber it goes in the wagon');
});

test('a team left at the timber by somebody called away is walked out to and driven home with a load, by a student or the director', () => {
  // Found 2026-09-19: a man fetching logs answered the call from the timber and rode for Gonzales, and his family's ox and
  // wagon stood there the rest of the class while its house wanted logs.
  const world = onTheLand('biome-game-logs');
  const home = h => world.entities[`${h.id}-wagon`]?.location?.siteId === h.homeSiteId && world.entities[`${h.id}-animal`]?.location?.siteId === h.homeSiteId;
  const household = Object.values(world.households).filter(h => home(h) && h.tools?.axe !== undefined && logwoodGround(world, h, false))[0];
  const person = world.entities[household.principalId];
  const wood = logwoodGround(world, household);
  const leave = () => { for (const id of [`${household.id}-wagon`, `${household.id}-animal`]) world.entities[id].location = { x: wood.x, y: wood.y, siteId: wood.id }; };
  leave();
  const entry = choresFor(world, household, person).find(chore => chore.id === 'fetch-logs');
  assert.ok(entry?.can, JSON.stringify(entry));
  assert.match(entry.cost, /^about \d+ hours?, on foot to the ox and wagon left at the timber.*, and home with them$/);
  const pile = (household.logs?.wall || 0) + (household.logs?.sill || 0);
  applyAction(world, household.id, { action: 'chore', entityId: person.id, chore: 'fetch-logs' });
  const seen = [];
  for (let tick = 0; tick < 300 && person.chore; tick++) { if (person.travel && seen.at(-1) !== person.travel.mode) seen.push(person.travel.mode); stepWorld(world); validateWorld(world); }
  assert.equal(person.chore, null);
  assert.deepEqual(seen, ['foot', 'wagon'], 'out on foot, home in the wagon');
  for (const id of [`${household.id}-wagon`, `${household.id}-animal`]) assert.equal(world.entities[id].location.siteId, household.homeSiteId, `${id} is home`);
  assert.equal((household.logs?.wall || 0) + (household.logs?.sill || 0), pile + FETCH_LOGS, 'and six logs on the pile');
  // The director sends somebody for it, logs wanted or not.
  leave();
  household.resources = { ...household.resources, food: 60, powder: 6 };
  thinkFor(world, household, { project: id => projectWorld(world, id, 'student', { includeMap: false }), act: input => applyAction(world, household.id, input) });
  assert.equal(household.members.filter(id => world.entities[id].chore?.id === 'fetch-logs').length, 1, 'one of the family goes for the team');
});

test('a family nobody plays with no timber of its own fetches logs when timber is near, and builds a jacal when none is', () => {
  const world = createGonzalesWorld('biomes-0', 30, { map: 'colonies', neighbours: true });
  world.status = 'running';
  for (let tick = 0; tick < 150; tick++) stepWorld(world);
  let jacal = 0, fetchers = 0;
  for (const household of Object.values(world.households)) {
    if (!household.house?.plan) continue;
    const home = world.map.sites[household.homeSiteId];
    if (soundLogsNear(world, home, holdingOf(world, household).bounds) >= 50) continue;
    if (fetchesLogs(world, household, home)) { fetchers++; assert.notEqual(household.house.plan, 'jacal', `${household.id} could fetch logs and built a jacal`); }
    else { jacal++; assert.equal(household.house.plan, 'jacal', `${household.id} has no timber near and planned ${household.house.plan}`); }
    const wood = logwoodGround(world, household, false);
    if (wood && household.tools?.axe !== undefined) assert.equal(fetchesLogs(world, household, home), Math.hypot(wood.x - home.x, wood.y - home.y) <= FETCH_LOGS_MILES);
  }
  assert.ok(jacal > 0 && fetchers > 0, `jacal ${jacal}, fetching ${fetchers}`);
});

test('a fence takes as long as its rails are far: at hand in the timber, carried across the prairie, mesquite in the brush', () => {
  const world = onTheLand('biome-game-fence');
  const seen = { rails: [], hauled: [], mesquite: [] };
  for (const household of Object.values(world.households)) {
    for (const point of placesOn(holdingOf(world, household).bounds, 8)) {
      const work = fenceWork(world, household, point);
      seen[work.how].push({ household, point, work });
      if (work.how === 'hauled') assert.equal(work.ticks, FENCE_TICKS + Math.round(FENCE_TICKS_A_MILE * (work.miles ?? 3)));
      else assert.equal(work.ticks, FENCE_TICKS);
      assert.match(fenceWords(work), /about \d+ hours\.$/);
    }
  }
  for (const how of ['rails', 'hauled']) assert.ok(seen[how].length > 0, `no ${how} fence anywhere`);
  // The further the timber, the longer.
  const far = seen.hauled.reduce((a, b) => (b.work.miles ?? 9) > (a.work.miles ?? 9) ? b : a);
  assert.ok(far.work.ticks > FENCE_TICKS + FENCE_TICKS_A_MILE / 2, JSON.stringify(far.work));
  assert.match(fenceWords(far.work), /^(Rails carried from the timber [\d.]+ miles off|No timber within 3 miles)/);
  // And the fence really takes that long: one person fences a plot with timber at hand and then one out on the open prairie,
  // on the same family's land, and the second takes longer by what the country asks.
  const both = Object.values(world.households).map(household => ({
    household,
    near: seen.rails.find(entry => entry.household === household),
    out: seen.hauled.filter(entry => entry.household === household).sort((a, b) => b.work.ticks - a.work.ticks)[0],
  })).find(entry => entry.near && entry.out && entry.out.work.ticks >= FENCE_TICKS + 2);
  assert.ok(both, 'no family with both kinds of ground to fence');
  const { household } = both;
  const person = world.entities[household.principalId];
  const fence = place => {
    household.plots = [{ id: 'plot-9', x: place.point.x, y: place.point.y, ground: 'prairie', state: 'cleared' }];
    applyAction(world, household.id, { action: 'fence-plot', entityId: person.id, x: place.point.x, y: place.point.y });
    let working = 0;
    for (let tick = 0; tick < 400 && person.chore; tick++) { if (/rails|mesquite/.test(person.chore.doing) && !/walking|coming/.test(person.chore.doing)) working++; stepWorld(world); }
    assert.equal(plotsOf(world, household)[0].fence, 'sound');
    person.exertion = 0; person.health = { condition: 'well' };
    return working;
  };
  const near = fence(both.near), out = fence(both.out);
  assert.ok(out > near && out >= near * both.out.work.ticks / FENCE_TICKS * 0.8, `rails at hand ${near} ticks, carried ${both.out.work.miles ?? 'over 3'} miles ${out} ticks; the country asks ${both.out.work.ticks} against ${FENCE_TICKS}`);
  // A class of the old rules fences as it always did.
  world.map.woods = WOODS_SOURCE_2016;
  assert.equal(fenceWork(world, household, both.out.point).ticks, FENCE_TICKS);
});

test('asking where the timber is, is not a change to the map', () => {
  const world = onTheLand('biome-game-logs', 5);
  const household = world.households['hh-1'];
  const revision = world.map.revision;
  const view = projectWorld(world, household.id, 'student', { includeMap: false });
  assert.ok(view.work[household.principalId].some(entry => entry.id === 'fetch-logs'));
  stepWorld(world);
  // Asking what it costs writes nothing into the map, so no browser is told a homestead changed; going there does.
  assert.equal(world.map.revision, revision, 'the map changed because a control said what it would cost');
  assert.equal(world.map.sites[`logwood-${household.id}`], undefined);
  assert.ok(logwoodGround(world, household, false), 'no timber within reach, so this proves nothing');
});
