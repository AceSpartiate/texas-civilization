// The Alamo on the battle engine (docs/BATTLES.md §7; docs/battle-research/staging.md §5): the thirteen days as a living
// siege and the dawn assault, the posts on the walls, the couriers and the relief riding and never set down, each fate at its
// moment, the family at home learning nothing before the word, and who is sent what. Every test here is proved by an
// injection that fails it and no other in this file (scripts/battle-injections.mjs).
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, projectWorld, rollFamily, stepWorld, validateWorld } from '../sim/world.mjs';
import { beginSecondPeriod } from '../sim/periods.mjs';
import { ARRIVAL_MINUTES, TIMELINE, momentOf } from '../sim/directors.mjs';
import { ENGAGEMENTS, battleState, checkEngagement, phaseOffset, projectBattle, schedule } from '../sim/battle-stage.mjs';
import { ALAMO, ALAMO_PLAN_ORIGIN } from '../sim/battles/alamo.mjs';
import { ALAMO_ORIGIN, GATE_IN, GATE_OUT_ROUTE, OUTSIDE_GATE, OUT_OF_THE_CHURCH, POSTS, SACRISTY, TO_SACRISTY, inFeet, onMap } from '../sim/alamo-posts.mjs';
import { FALL_PHASES, fallMinute } from '../sim/alamo-battle.mjs';
import { COURIER_CHOSEN, RELIEF_LEAVES_FROM_SEPT_29, share } from '../sim/alamo.mjs';
import { calendarMinutes } from '../sim/clock.mjs';
import { MODES } from '../sim/travel.mjs';
import { PACES } from '../server/app.mjs';
import { createDamageState, isWalkable } from '../public/alamo-layout.js';

const view = (world, householdId) => projectWorld(world, householdId, 'student', { includeMap: false });
const host = world => projectWorld(world, undefined, 'host', { includeMap: false });
const until = (world, done, limit = 9000) => { for (let t = 0; t < limit && !done() && world.status === 'running'; t++) stepWorld(world); };
const untilMoment = (world, key) => until(world, () => world.director.milestones[key]);
const untilMinute = (world, minute) => until(world, () => world.minute >= minute);
const feet = (a, b) => Math.hypot(a.x - b.x, a.y - b.y) * 5280;
/** How near, in feet, the straight line from a to b passes a point: what the page draws of one tick's walk. */
const passing = (a, b, point) => {
  const dx = b.x - a.x, dy = b.y - a.y, length = dx * dx + dy * dy;
  const t = length ? Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / length)) : 0;
  return Math.hypot(point.x - a.x - dx * t, point.y - a.y - dy * t) * 5280;
};
const phaseFrom = (world, id) => schedule(ALAMO, momentOf(world, ALAMO.startKey)).find(phase => phase.id === id).from;

let shared = null;
/** A real-land class with rolled families, through the first period and into the winter to the morning of its news. */
const winter = () => structuredClone(shared ??= (() => {
  const world = createGonzalesWorld('battle-alamo-class', 8, { map: 'colonies' });
  for (const household of Object.values(world.households)) rollFamily(world, household);
  world.status = 'running';
  until(world, () => world.director.complete);
  beginSecondPeriod(world);
  world.status = 'running';
  until(world, () => world.director.milestones['winter-news']);
  return world;
})());
const alive = person => !['dead', 'captured'].includes(person.health.condition);
const men = world => Object.values(world.entities).filter(person => person.householdId && person.kind === 'person' && person.sex === 'male' && (person.age ?? 30) >= 16 && alive(person));
const women = world => Object.values(world.entities).filter(person => person.householdId && person.kind === 'person' && person.sex === 'female' && person.kin?.role === 'mother' && alive(person));
/** One man from each of `count` different families. */
const menOfFamilies = (world, count, pick = () => true) => {
  const seen = new Set(), chosen = [];
  for (const person of men(world)) if (!seen.has(person.householdId) && pick(person)) { seen.add(person.householdId); chosen.push(person); }
  return chosen.slice(0, count);
};
/** Somebody in the garrison at Béxar, for a family somebody plays, and at a post if one is named. */
const garrison = (world, person, { played = true, post = null } = {}) => {
  const site = world.map.sites.bexar;
  Object.assign(person, { travel: null, chore: null, task: 'rest', location: { x: site.x, y: site.y, siteId: 'bexar' } });
  person.service = { kind: 'garrison', status: 'serving', since: world.minute, siteId: 'bexar', ...(post && { post }) };
  world.households[person.householdId].played = played;
};
/** Answer every runner as staying, so nobody rides out unless a test wants it. */
const stayPut = world => {
  for (const person of Object.values(world.entities)) if (person.service?.courier === 'open') applyAction(world, person.householdId, { action: 'alamo-courier', entityId: person.id, answer: 'stay' });
};
const untilStaying = (world, done, limit = 9000) => { for (let t = 0; t < limit && !done() && world.status === 'running'; t++) { stepWorld(world); stayPut(world); } };

test('the Alamo is data the engine holds to its rules, dated on the director\'s calendar, and its assault is the longest held fight', () => {
  checkEngagement(ALAMO);
  assert.equal(ENGAGEMENTS.alamo, ALAMO);
  // The assault begins where the director's `alamo-assault` is (about five on March 6), and the siege on the 23rd.
  assert.equal(phaseOffset(ALAMO, 'advance'), TIMELINE['alamo-assault'] - TIMELINE['alamo-siege']);
  assert.equal(phaseOffset(ALAMO, 'relief'), TIMELINE['relief-enters'] - 60 - TIMELINE['alamo-siege'], 'the relief does not ride in the hour before it is inside');
  // Numbers this module and others copy, held equal.
  assert.deepEqual(ALAMO_PLAN_ORIGIN, ALAMO_ORIGIN);
  assert.equal(RELIEF_LEAVES_FROM_SEPT_29, TIMELINE['relief-leaves'] - ARRIVAL_MINUTES);
  // The longest held single fight (docs/BATTLES.md §2b.5): more ticks from the first volley to the end than Gonzales has.
  const heldTicks = def => def.phases.filter(phase => phase.step && (phase.contact || def.phases.indexOf(phase) > def.phases.findIndex(one => one.contact))).reduce((sum, phase) => sum + phase.minutes / phase.step, 0);
  const assault = ALAMO.phases.slice(ALAMO.phases.findIndex(phase => phase.id === 'advance'));
  const alamoTicks = assault.filter(phase => phase.step).reduce((sum, phase) => sum + phase.minutes / phase.step, 0);
  assert.ok(alamoTicks > heldTicks(ENGAGEMENTS.gonzales), `the assault holds ${alamoTicks} ticks, no longer than Gonzales's ${heldTicks(ENGAGEMENTS.gonzales)}`);
  assert.ok(alamoTicks * PACES.study / 60000 >= 6, `the assault plays ${alamoTicks * PACES.study / 60000} real minutes at Study`);
  // A named person speaks only a documented line, and Travis's and Joe's are Joe's own account (`HIST-TEX-502`).
  const named = ALAMO.phases.flatMap(phase => phase.lines || []).filter(line => line.name);
  assert.deepEqual(named.map(line => [line.name, line.kind, line.claimId]), [['Travis', 'documented', 'HIST-TEX-502'], ['Joe', 'documented', 'HIST-TEX-502']]);
  // The degüello and the line in the sand are never staged (owner questions A1, A2).
  assert.doesNotMatch(JSON.stringify(ALAMO.phases), /deg[üu]ello|line in the sand/i);
});

test('every post and every way in and out is walked over the plan a foot at a time without going through a wall', () => {
  const state = createDamageState();
  const walks = [];
  for (const [id, post] of Object.entries(POSTS)) for (const [index, { spot, route }] of post.spots.entries()) walks.push([`${id} ${index}`, [GATE_IN, ...route, spot]]);
  walks.push(['the gate', [GATE_IN, ...GATE_OUT_ROUTE.map(([x, y]) => ({ x, y })), OUTSIDE_GATE]]);
  POSTS.nave.spots.forEach(({ spot }, index) => walks.push([`to the sacristy ${index}`, [spot, ...TO_SACRISTY[index], SACRISTY]]));
  walks.push(['out of the church', [SACRISTY, ...OUT_OF_THE_CHURCH]]);
  for (const [name, points] of walks) {
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1], b = points[i], steps = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y));
      for (let k = 0; k <= steps; k++) {
        const p = { x: a.x + (b.x - a.x) * k / Math.max(1, steps), y: a.y + (b.y - a.y) * k / Math.max(1, steps) };
        // Outside the plan's own bounds is open ground (the way out past the gate).
        if (p.y > 560 || p.y < -30) continue;
        assert.ok(isWalkable(p, state, { radius: 0.3 }), `${name}: leg ${i} goes through a wall at ${p.x.toFixed(1)}, ${p.y.toFixed(1)}`);
      }
    }
  }
});

test('the garrison walks in from the town through the south gate to posts on the walls, a leg at a time, and nobody is set down', () => {
  const world = winter();
  const [man] = menOfFamilies(world, 1);
  garrison(world, man, { post: { id: 'north', spot: 4 } });
  untilMoment(world, 'alamo-siege');
  assert.equal(man.service.besieged, true);
  assert.ok(man.service.walk, 'the man shut in was not sent walking to his post');
  const spot = POSTS.north.spots[4].spot, reach = () => Math.max(90, calendarMinutes(world) / 20 * 5280);
  let at = man.location, throughGate = false;
  for (let i = 0; i < 60 && man.service.walk; i++) {
    stepWorld(world); stayPut(world);
    assert.ok(feet(at, man.location) <= reach() + 1, `he went ${feet(at, man.location).toFixed(0)} feet in a tick`);
    if (passing(at, man.location, onMap(world, GATE_IN)) < 6) throughGate = true;
    at = man.location;
  }
  assert.ok(throughGate, 'he did not come in by the gate');
  assert.ok(feet(man.location, onMap(world, spot)) < 1, 'he did not reach his post on the north wall');
  assert.ok(inFeet(world, man.location).y < 40, 'his post is not on the north wall');
  validateWorld(world);
});

test('the siege is lived: the guns every day and the answer, the north battery and the lines closer, the huts, and the night quiet', () => {
  const world = winter();
  const [man] = menOfFamilies(world, 1);
  garrison(world, man);
  untilMoment(world, 'alamo-siege');
  const seen = {};
  untilStaying(world, () => {
    const battle = view(world, man.householdId).battle;
    if (battle?.id === 'alamo') {
      const day = seen[battle.phase] ||= { north: null, lines: null, shots: new Set(), falls: 0, light: battle.light || 0 };
      const gun = battle.guns?.find(one => one.id === 'battery-north');
      if (gun) day.north = feet(gun, onMap(world, { x: 122, y: 13 }));
      const lines = battle.sides.find(side => side.group === 'lines-north');
      if (lines) day.lines = feet(lines, onMap(world, { x: 122, y: 13 }));
      for (const one of battle.guns || []) for (const shot of one.shots) { assert.ok(shot <= world.minute, `a shot from ${shot} was sent at ${world.minute}`); day.shots.add(`${one.id}:${shot}`); }
      day.falls = Math.max(day.falls, battle.fallen.length);
    }
    return world.minute >= momentOf(world, 'alamo-assault');
  });
  for (const id of ['day-24', 'day-26', 'day-29', 'day-1', 'day-3', 'day-5']) {
    assert.ok(seen[id], `the siege's ${id} was never sent to the family inside`);
    assert.ok([...seen[id].shots].some(shot => shot.startsWith('battery-')), `no Mexican gun fired on ${id}`);
    assert.ok([...seen[id].shots].some(shot => shot.startsWith('eighteen') || shot.startsWith('north-gun')), `the defenders did not answer on ${id}`);
  }
  assert.ok(seen['day-24'].north > seen['day-29'].north && seen['day-29'].north > seen['day-3'].north, `the north battery did not come closer: ${seen['day-24'].north} ${seen['day-29'].north} ${seen['day-3'].north}`);
  assert.ok(seen['day-3'].lines < seen['day-24'].lines, 'the Mexican lines did not close in');
  assert.ok(seen.huts?.falls >= 1, 'nobody fell at the huts');
  assert.ok(seen['night-24'] && seen['night-24'].shots.size === 0 && seen['night-24'].light > 0.5, 'the night was not dark and quiet');
});

test('the clock lives the siege a quarter-day a tick only for a class with somebody there, holds the assault for everybody, and never runs faster', () => {
  const count = involved => {
    const world = winter();
    const [man] = menOfFamilies(world, 1);
    garrison(world, man, { played: involved });
    // On auto, so Travis's runner does not come to him and the courier days' own pace (sim/military-pacing.mjs) is not
    // counted: what is measured is the siege's own hold, and nothing else.
    man.auto = true;
    if (!involved) for (const household of Object.values(world.households)) household.played = false;
    untilMoment(world, 'alamo-siege');
    const start = phaseFrom(world, 'arrival'), assault = phaseFrom(world, 'advance'), end = phaseFrom(world, 'after');
    let siege = 0, fight = 0;
    const faster = [];
    untilStaying(world, () => {
      const step = calendarMinutes(world);
      if (step > 720) faster.push(step);
      if (world.minute >= start && world.minute < assault) siege++;
      if (world.minute >= assault && world.minute < end) fight++;
      return world.minute >= end;
    });
    assert.deepEqual(faster, []);
    return { siege, fight };
  };
  const watched = count(true), unwatched = count(false);
  const minutes = ticks => +(ticks * PACES.study / 60000).toFixed(1);
  // Recorded for the report (docs/BATTLES.md §7.3): what the living siege adds to a class with somebody inside.
  console.log(`siege ticks watched ${watched.siege} (${minutes(watched.siege)} min) against ${unwatched.siege} (${minutes(unwatched.siege)} min); assault ${watched.fight} and ${unwatched.fight}`);
  assert.ok(watched.siege >= unwatched.siege + 20, `the siege was not lived more slowly with somebody inside: ${watched.siege} against ${unwatched.siege}`);
  assert.ok(minutes(watched.siege - unwatched.siege) <= 8, `the living siege costs ${minutes(watched.siege - unwatched.siege)} real minutes, more than eight`);
  assert.equal(watched.fight, unwatched.fight, 'the assault was held differently for a class with nobody there');
  assert.ok(watched.fight >= 42, `the assault was held for only ${watched.fight} ticks`);
});

test('a courier rides out through the gate at a rider\'s pace, reaches Gonzales before the relief rides, and may go back in with it', () => {
  const world = winter();
  const [man] = menOfFamilies(world, 1, person => share(world, person.id, 'courier-1') < COURIER_CHOSEN);
  assert.ok(man, 'nobody in the class whom Travis would choose on the first night');
  garrison(world, man);
  untilMoment(world, 'alamo-siege');
  untilMoment(world, 'courier-1-opens');
  until(world, () => man.service.courier === 'open', 30);
  applyAction(world, man.householdId, { action: 'alamo-courier', entityId: man.id, answer: 'volunteer' });
  untilMoment(world, 'courier-1');
  assert.equal(man.service.courier, 'sent');
  assert.equal(man.travel?.to, 'gonzales');
  assert.ok(man.travel.speed >= MODES.horse.speed, `the courier walked: ${man.travel.speed}`);
  // Out through the gate: the road begins at his post and passes the gate inside and out before it goes anywhere.
  const road = man.travel.points.slice(0, 12).map(point => inFeet(world, point));
  assert.ok(road.some(point => Math.hypot(point.x - GATE_IN.x, point.y - GATE_IN.y) < 1) && road.some(point => Math.hypot(point.x - OUTSIDE_GATE.x, point.y - OUTSIDE_GATE.y) < 1), `the courier did not leave by the gate: ${JSON.stringify(road.slice(0, 6))}`);
  assert.ok(!road.slice(0, 8).some(point => Math.hypot(point.x + 1514, point.y - 846) < 200), 'the courier rode through the town\'s plaza');
  until(world, () => !man.travel);
  assert.equal(man.location.siteId, 'gonzales');
  assert.ok(world.minute < momentOf(world, 'relief-leaves'), 'the courier reached Gonzales after the relief rode');
  const order = (view(world, man.householdId).work[man.id] || []).find(entry => entry.id === 'join-relief');
  assert.ok(order?.can, `the courier in Gonzales could not be sent back in: ${JSON.stringify(order)}`);
  assert.match(order.estimate, /in time/, 'the order did not say he is in time');
  validateWorld(world);
});

test('the relief rides from Gonzales to wait short of the lines, rides in with the company to the gate, and walks to a post: never set down', () => {
  const world = winter();
  const [man] = menOfFamilies(world, 1, person => world.households[person.householdId].settlementId === 'gonzales');
  untilMoment(world, 'travis-gonzales');
  const order = (view(world, man.householdId).work[man.id] || []).find(entry => entry.id === 'join-relief');
  assert.ok(order?.can, 'the relief was not offered');
  assert.match(order.estimate, /To Gonzales .*(in time|too late).* February 27/, `the order did not say how long, and whether in time: ${order.estimate}`);
  applyAction(world, man.householdId, { action: 'chore', entityId: man.id, chore: 'join-relief', mode: 'foot' });
  // Played from here, so the ride in is watched as a student's would be (sim/battles/alamo.mjs `alamoInvolved`).
  world.households[man.householdId].played = true;
  until(world, () => man.service?.kind === 'relief');
  untilMoment(world, 'relief-leaves');
  assert.ok(man.travel, 'he did not ride');
  assert.ok(man.travel.speed >= MODES.horse.speed, 'he did not keep the company\'s pace');
  const wait = onMap(world, { x: 3200, y: 250 });
  assert.ok(feet(man.travel.points.at(-1), wait) < 1, 'the road does not end where the company waited');
  until(world, () => !man.travel);
  assert.ok(feet(man.location, wait) < 1, 'he is not waiting short of the lines');
  assert.ok(world.minute <= phaseFrom(world, 'relief'), 'he reached the lines after the company went in');
  // In with the company: every tick a little way, never a jump, and through the gate.
  let at = man.location, gate = false;
  untilStaying(world, () => {
    const moved = feet(at, man.location);
    assert.ok(moved < 2600, `he jumped ${moved.toFixed(0)} feet in a tick`);
    if (passing(at, man.location, onMap(world, GATE_IN)) < 6) gate = true;
    at = man.location;
    return man.service.kind === 'garrison' && !man.service.walk;
  }, 200);
  assert.ok(gate, 'he did not come in through the gate');
  assert.equal(man.service.besieged, true);
  assert.ok(feet(man.location, onMap(world, POSTS[man.service.post.id].spots[man.service.post.spot].spot)) < 1, 'he did not reach his post');
  validateWorld(world);
});

test('a relief man still on the road when the company goes in is left behind, told so, and turns home', () => {
  const world = winter();
  const [man] = menOfFamilies(world, 1, person => world.households[person.householdId].settlementId === 'gonzales');
  untilMoment(world, 'travis-gonzales');
  applyAction(world, man.householdId, { action: 'chore', entityId: man.id, chore: 'join-relief', mode: 'foot' });
  until(world, () => man.service?.kind === 'relief');
  untilMoment(world, 'relief-leaves');
  // Held at a ford for days: he is still on the road when the company goes in.
  man.travel.waitUntil = momentOf(world, 'relief-enters') + 1440;
  untilMoment(world, 'relief-enters');
  until(world, () => man.service.status === 'released' && man.travel, 400);
  assert.ok(!man.service.besieged, 'a man left on the road was taken inside');
  assert.ok(world.events.some(event => event.actorId === man.id && /did not reach the Gonzales men/.test(event.text)), 'the family was not told he was left behind');
  assert.equal(man.travel.to, world.households[man.householdId].homeSiteId, 'he did not turn home');
});

test('each fighter falls when the storming reaches his post - the north wall first, the rooms last - and a woman is spared when it stops', () => {
  const world = winter();
  const [north, barrack] = menOfFamilies(world, 2);
  const woman = women(world).find(person => ![north.householdId, barrack.householdId].includes(person.householdId));
  garrison(world, north, { post: { id: 'north', spot: 2 } });
  garrison(world, barrack, { post: { id: 'long-barrack', spot: 3 } });
  const site = world.map.sites.bexar;
  Object.assign(woman, { travel: null, chore: null, location: { x: site.x, y: site.y, siteId: 'bexar' } });
  world.households[woman.householdId].played = true;
  untilMoment(world, 'alamo-siege');
  untilStaying(world, () => world.minute >= momentOf(world, 'alamo-assault'));
  assert.ok(!north.service.fate && !barrack.service.fate, 'a fate was set before the assault');
  const at = {};
  untilStaying(world, () => {
    for (const person of [north, barrack, woman]) if (person.service.fate && !at[person.id]) at[person.id] = { minute: world.minute, phase: battleState(world, 'alamo').phase.id };
    return world.minute >= phaseFrom(world, 'after');
  });
  assert.ok(FALL_PHASES.north.includes(at[north.id]?.phase), `the man on the north wall fell in ${at[north.id]?.phase}`);
  assert.equal(at[barrack.id]?.phase, 'rooms', 'the man in the long barrack did not fall in the rooms');
  assert.ok(at[north.id].minute < at[barrack.id].minute, 'the rooms fell before the north wall');
  assert.equal(north.service.fellAt, fallMinute(world, north), 'the moment is not the one the share gives');
  assert.equal(woman.service.fate, 'spared');
  assert.equal(at[woman.id].phase, 'end', 'the woman was spared before the firing stopped');
  assert.ok(feet(woman.location, onMap(world, SACRISTY)) < 30 || woman.service.ledOut, 'the woman was not in the sacristy');
  validateWorld(world);
});

test('the student may watch their own man fall; the family\'s journal and its people learn nothing until the word comes', () => {
  const world = winter();
  const [man] = menOfFamilies(world, 1, person => world.households[person.householdId].settlementId === 'gonzales');
  garrison(world, man, { post: { id: 'north', spot: 5 } });
  untilMoment(world, 'alamo-siege');
  untilStaying(world, () => world.minute >= momentOf(world, 'alamo-assault'));
  const eventsBefore = world.events.filter(event => event.householdId === man.householdId).length;
  let sentBefore = false;
  untilStaying(world, () => {
    const page = view(world, man.householdId);
    const falls = page.battle?.memberFalls || {};
    if (falls[man.id] !== undefined) assert.ok(falls[man.id] <= world.minute, 'the fall was sent before it happened');
    if (!Number.isFinite(man.service.fellAt)) { assert.equal(falls[man.id], undefined); assert.ok(!page.entities.find(e => e.id === man.id).service.seenFall); }
    else sentBefore ||= falls[man.id] === man.service.fellAt;
    return world.minute >= phaseFrom(world, 'after');
  });
  assert.ok(sentBefore, 'the family watching was never shown their man fall');
  const page = view(world, man.householdId), own = page.entities.find(e => e.id === man.id);
  assert.equal(own.service.seenFall, true, 'the page was not told he is not to be drawn standing');
  assert.notEqual(own.health.condition, 'dead', 'the family\'s record made the death true before the word');
  assert.doesNotMatch(JSON.stringify(page), /"fate"|"fellAt"/, 'the fate rode the wire');
  // Nothing in the journal between the assault and the word says what became of him.
  const between = world.events.filter(event => event.householdId === man.householdId).slice(eventsBefore);
  assert.ok(!between.some(event => /killed|fell|dead|was stormed/i.test(event.text)), `the journal knew before the word: ${between.map(event => event.text).join(' | ')}`);
  // The debrief is the card, for the one who watched, and says that home does not know.
  assert.match(page.battleAccount?.text || '', /Nobody at home knows/, 'no debrief for the student who watched');
  untilMoment(world, 'fall-confirmed');
  assert.equal(man.health.condition, 'dead');
  const told = world.events.find(event => event.actorId === man.id && /killed when the Alamo was stormed/.test(event.text));
  assert.ok(told && /the north wall/.test(told.text) && /What happened/.test(told.text), 'the word did not bring the account in plain words');
  assert.match(view(world, man.householdId).battleAccount?.title || '', /word from the Alamo/, 'the account was not on the card');
});

test('only the Host and a family with somebody there are sent the Alamo: nobody else, not a count, not a card, and nothing from the future', () => {
  const world = winter();
  const [man, other] = menOfFamilies(world, 2);
  garrison(world, man, { post: { id: 'west', spot: 1 } });
  world.households[other.householdId].played = true;
  untilMoment(world, 'alamo-siege');
  let sawHost = false, sawAlert = new Set();
  const phases = new Set();
  untilStaying(world, () => {
    const theirs = view(world, man.householdId), outsider = view(world, other.householdId);
    const raw = JSON.stringify(outsider);
    assert.equal(outsider.battle, null, `${other.householdId} with nobody there was sent the Alamo at ${world.minute}`);
    assert.ok(!outsider.battleAlert && !outsider.battleAccount, 'a family with nobody there was sent a card');
    assert.ok(!raw.includes(man.id), 'the family with nobody there was sent the man\'s id');
    assert.doesNotMatch(raw, /"memberFalls"|"guns"|"inside"|"debrief"|"alerted"|The garrison/);
    if (theirs.battle) {
      phases.add(theirs.battle.phase);
      const text = JSON.stringify(theirs.battle);
      for (const line of theirs.battle.lines) assert.ok(line.minute <= world.minute);
      for (const phase of ALAMO.phases.filter(one => one.id !== theirs.battle.phase && one.caption !== theirs.battle.caption)) assert.ok(!text.includes(phase.caption), `the caption of ${phase.id} was sent during ${theirs.battle.phase}`);
      assert.doesNotMatch(text, /"phases"|"inside"|"fate"|"outcome"/);
    }
    if (theirs.battleAlert) sawAlert.add(theirs.battleAlert.id.split(':')[2]);
    if (host(world).battle?.id === 'alamo') sawHost = true;
    return world.minute >= phaseFrom(world, 'after');
  });
  assert.ok(sawHost, 'the Host was not sent the Alamo live');
  assert.ok(['arrival', 'red-flag', 'day-24', 'huts', 'relief', 'alarm', 'repulse', 'north-wall', 'fallback', 'rooms', 'end'].every(id => phases.has(id)), [...phases].join(' '));
  assert.deepEqual([...sawAlert].sort(), ['assault', 'siege'], 'the family inside was not alerted at the army\'s coming and at the storming');
});

test('the cards come through the person: none before the alarm on March 6, the alarm\'s at the man\'s side with Watch', () => {
  const world = winter();
  const [man] = menOfFamilies(world, 1);
  garrison(world, man, { post: { id: 'south', spot: 0 } });
  untilMoment(world, 'alamo-siege');
  untilStaying(world, () => world.minute >= phaseFrom(world, 'quiet'));
  untilStaying(world, () => {
    const alert = view(world, man.householdId).battleAlert;
    if (world.minute < phaseFrom(world, 'alarm')) assert.ok(!alert || !/walls/.test(alert.text), `a card foretold the assault at ${world.minute}`);
    return world.minute >= phaseFrom(world, 'alarm');
  });
  const alert = view(world, man.householdId).battleAlert;
  assert.ok(alert, 'no card at the alarm');
  assert.match(alert.text, new RegExp(`^At ${man.name}'s side`), 'the card did not come through the person');
  assert.match(alert.text, /low barrack/, 'the card did not say where he is');
  assert.ok(alert.field && Number.isFinite(alert.field.x), 'the card has no field to Watch');
});

test('a class saved in the middle of the assault opens in the middle of it; one saved before posts or battles opens without a new saveVersion', () => {
  const world = winter();
  const [man] = menOfFamilies(world, 1);
  garrison(world, man);
  untilMoment(world, 'alamo-siege');
  untilStaying(world, () => world.minute >= phaseFrom(world, 'repulse') + 4);
  const saved = structuredClone(world);
  assert.deepEqual(projectBattle(saved, 'alamo', { members: [man.id] }), projectBattle(world, 'alamo', { members: [man.id] }));
  // A class saved in the siege by the build before: no record of the engagement, and everybody at a plaza spot with no post.
  const old = winter();
  const [oldMan] = menOfFamilies(old, 1);
  garrison(old, oldMan);
  untilMoment(old, 'alamo-siege');
  delete old.battles.alamo; delete oldMan.service.post; delete oldMan.service.walk;
  oldMan.location = onMap(old, { x: 120, y: 300 });
  const version = old.saveVersion;
  stepWorld(old);
  assert.ok(old.battles.alamo, 'the old class gained no record of the siege');
  assert.ok(oldMan.service.post, 'the man in the old class was given no post');
  untilStaying(old, () => !oldMan.service.walk, 60);
  assert.ok(feet(oldMan.location, onMap(old, POSTS[oldMan.service.post.id].spots[oldMan.service.post.spot].spot)) < 1, 'he did not walk to it');
  assert.equal(old.saveVersion, version);
  validateWorld(old);
});
