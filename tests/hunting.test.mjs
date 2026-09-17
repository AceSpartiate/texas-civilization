// A hunt you can watch.
//
// The owner: "when they're out hunting, maybe i should see them actually hunting?" It was
// one step - five ticks of standing on the spot the road left them, with a searching pose
// playing - and nothing about it looked like hunting. It is now the stages it always was
// underneath: in from the edge, up through the trees, still and downwind, and the shot.
//
// The constraint that shaped it was `HIST-GONZ-013`: buffalo is the only game documented at
// Gonzales, so for a while nothing named or drew the quarry. Then the owner asked to see an
// animal (2026-09-14), and the colonies' own record of settlers hunting deer (`HIST-TEX-015`)
// was found: the hunt names and draws a deer, and nothing else.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createSettledWorld } from './support/settled.mjs';
import { applyAction, stepWorld, validateWorld } from '../sim/world.mjs';
import { ASKS, CHORES, HUNT_STEP, huntingGround, steadyHand, unsteadyBecause } from '../sim/chores.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { groundAt } from '../sim/fields.mjs';
import { findWay } from '../sim/ways.mjs';

const running = (seed = 'hunt', count = 5) => {
  const world = createSettledWorld(seed, count);
  world.status = 'running';
  return world;
};

/**
 * Send somebody hunting and watch every tick of it: where they were, what they were
 * doing, and whether the world was still coherent.
 */
function hunt(seed, { entityId = 'hh-1-mateo', householdId = 'hh-1', mode, answer = 'wait' } = {}) {
  const world = running(seed);
  const entity = world.entities[entityId];
  applyAction(world, householdId, { action: 'chore', entityId, chore: 'hunt-timber', ...(mode && { mode }) });
  const frames = [];
  let asked = null;
  for (let tick = 0; tick < 400 && entity.chore; tick++) {
    frames.push({
      tick: world.tick, siteId: entity.location.siteId, x: entity.location.x, y: entity.location.y,
      doing: entity.chore?.doing, travelling: Boolean(entity.travel), asking: Boolean(entity.chore?.ask),
    });
    // A hunt stops and asks. `answer: null` leaves it unanswered, which is how the
    // person's own patience gets tested.
    if (entity.chore?.ask) {
      asked = asked || structuredClone(entity.chore.ask);
      if (answer) applyAction(world, householdId, { action: 'answer-chore', entityId, option: answer });
    }
    stepWorld(world);
    // Every single tick, not only at the end: a stage that put somebody nowhere, or at a
    // place and on a road at once, is exactly what validateWorld refuses.
    validateWorld(world);
  }
  assert.equal(entity.chore, null, 'the hunt never finished');
  return { world, entity, frames, asked };
}
const foodOf = world => world.households['hh-1'].resources.food;

test('a family hunts the cover nearest its own house, not a named stand miles off, and how near depends on its country', () => {
  // Found in play 2026-09-14: every family on the invented map was sent to one of two stands of timber up to fifteen miles
  // away, when most farms had timber on the place. Where the game was is where the cover is.
  for (const world of [running('ground-near', 15), createGonzalesWorld('ground-near-real', 15, { map: 'colonies' })]) {
    const miles = [];
    for (const household of Object.values(world.households)) {
      const ground = huntingGround(world, household), home = world.map.sites[household.homeSiteId];
      assert.ok(ground, `${household.id} has somewhere to hunt`);
      assert.equal(ground.ownerHouseholdId, household.id);
      // Every way of going gets there, the wagon too: a house in the timber has its own few hundred yards of it.
      for (const mode of ['foot', 'horse', 'wagon']) assert.ok(findWay(world, household.homeSiteId, ground.id, mode), `${household.id} cannot reach its ground ${mode}`);
      const d = Math.hypot(ground.x - home.x, ground.y - home.y);
      miles.push(d);
      // Just beyond the place, the way it faces, is timber or brush...
      const inside = { x: ground.x + ground.toward.x * HUNT_STEP, y: ground.y + ground.toward.y * HUNT_STEP };
      assert.notEqual(groundAt(world, inside), 'prairie', `${household.id}'s ground is not at any cover`);
      // ...nothing on a finer ring nearer the house is, short of the step it was looked for at...
      for (let r = 1 / 16; r < d - HUNT_STEP * 1.5; r += 1 / 16) {
        for (let k = 0; k < 64; k++) {
          const point = { x: home.x + Math.cos(k * Math.PI / 32) * r, y: home.y + Math.sin(k * Math.PI / 32) * r };
          assert.equal(groundAt(world, point), 'prairie', `${household.id} rode ${d.toFixed(2)} miles past cover ${r.toFixed(2)} off`);
        }
      }
      // ...and no named stand of timber is nearer than it.
      for (const stand of Object.values(world.map.sites).filter(site => site.kind === 'woods' && !site.hunting)) {
        assert.ok(d <= Math.hypot(stand.x - home.x, stand.y - home.y) + HUNT_STEP, `${household.id} hunts past ${stand.name}`);
      }
    }
    if (world.map.source !== 'texas-colonies-map') {
      // Bottomland families hunt near the door; prairie families a long way out.
      assert.ok(Math.min(...miles) < .5 && Math.max(...miles) > 2, `the invented country's families hunt from ${Math.min(...miles).toFixed(2)} to ${Math.max(...miles).toFixed(2)} miles out`);
    }
  }
});

test('a hunt goes to the family ground, in the words of its cover, and the ground moves with the house', () => {
  const { world, frames } = hunt('own-ground');
  assert.ok(frames.some(frame => frame.siteId === 'hunt-hh-1' && !frame.travelling), 'they hunted their own ground');
  assert.ok(!frames.some(frame => ['upper-timber', 'lower-timber'].includes(frame.siteId)), 'not a named stand');
  const ground = world.map.sites['hunt-hh-1'];
  assert.match(ground.name, /^The (timber|brush)/);
  // Brush country is said as brush.
  const brushy = running('own-ground-brush');
  huntingGround(brushy, brushy.households['hh-1']).cover = 'brush';
  applyAction(brushy, 'hh-1', { action: 'chore', entityId: 'hh-1-mateo', chore: 'hunt-timber' });
  const said = new Set();
  for (let tick = 0; tick < 60 && brushy.entities['hh-1-mateo'].chore; tick++) {
    said.add(brushy.entities['hh-1-mateo'].chore.doing);
    if (brushy.entities['hh-1-mateo'].chore.ask) applyAction(brushy, 'hh-1', { action: 'answer-chore', entityId: 'hh-1-mateo', option: 'wait' });
    stepWorld(brushy);
  }
  assert.ok([...said].some(text => /the brush/.test(text)) && ![...said].some(text => /the timber/.test(text)), [...said].join(' / '));
  assert.ok(brushy.events.some(event => /fired in the brush/.test(event.text)));
  // The house moves (the real land's family chooses where it stands): the ground is found again from there, and every
  // browser is told the map changed.
  const household = world.households['hh-1'], home = world.map.sites[household.homeSiteId], before = { ...ground };
  const revision = world.map.revision || 0;
  home.x += 6;
  const moved = huntingGround(world, household);
  assert.notDeepEqual({ x: moved.x, y: moved.y }, { x: before.x, y: before.y });
  assert.equal(moved.fromX, home.x);
  assert.ok(world.map.revision > revision);
  assert.equal(huntingGround(world, household), moved, 'and found once, not every time it is asked');
});

test('a hunt already in a named stand when the class was saved finishes there, and comes home', () => {
  const world = running('old-stand');
  const mateo = world.entities['hh-1-mateo'];
  // As a class saved before: the hunt had reached the lower timber and was reading the ground.
  mateo.location = { x: world.map.sites['lower-timber'].x, y: world.map.sites['lower-timber'].y, siteId: 'lower-timber' };
  mateo.chore = { id: 'hunt-timber', step: 0, wait: 0, doing: 'on the road to the timber' };
  for (let tick = 0; tick < 400 && mateo.chore; tick++) {
    if (mateo.chore.ask) applyAction(world, 'hh-1', { action: 'answer-chore', entityId: mateo.id, option: 'wait' });
    stepWorld(world);
    validateWorld(world);
  }
  assert.equal(mateo.chore, null);
  assert.equal(mateo.location.siteId, 'home-1');
});

test('a hunt is a sequence of places in the timber, not one spot for five ticks', () => {
  const { world, frames } = hunt('stages');
  const inTimber = frames.filter(frame => !frame.travelling && frame.siteId && frame.siteId !== 'home-1');
  assert.ok(inTimber.length >= 4, `only ${inTimber.length} ticks were spent in the timber`);
  // They are at the timber the whole time - the stages move them about the stand, they do
  // not move them between places. That is the same rule the yard walk follows.
  const where = new Set(inTimber.map(frame => frame.siteId));
  assert.equal(where.size, 1, `a hunter changed site mid-hunt: ${[...where].join(', ')}`);
  // And they genuinely move within it.
  const spots = new Set(inTimber.map(frame => `${frame.x},${frame.y}`));
  assert.ok(spots.size >= 3, `a hunter stood in ${spots.size} place(s) for the whole hunt`);
  // Within it, and not merely claiming to be. A stage that moved somebody relative to a
  // place they are not - their own yard, say - would leave the site id saying "timber"
  // while the figure was drawn half a county away, which is the exact teleport the yard
  // walk fell into once and which no site check can see.
  const stand = world.map.sites[inTimber[0].siteId];
  for (const frame of inTimber) {
    const strayed = Math.hypot(frame.x - stand.x, frame.y - stand.y);
    assert.ok(strayed < .8, `a hunter said they were at the timber from ${strayed.toFixed(2)} miles away`);
  }
});

test('every stage says what is being done, and none of them names an animal', () => {
  const { frames } = hunt('words');
  const said = [...new Set(frames.map(frame => frame.doing))];
  for (const stage of ['reading the ground at the edge of the timber', 'working up through the timber', 'waiting downwind, and still', 'the shot']) {
    assert.ok(said.includes(stage), `no stage said "${stage}": ${JSON.stringify(said)}`);
  }
  // HISTORY.md's exclusion, enforced rather than remembered. The deer the settlers of the colonies hunted is documented
  // (`HIST-TEX-015`, found 2026-09-14) and is the one animal a hunt names; nothing else is.
  const everything = [...said, CHORES['hunt-timber'].describe, CHORES['hunt-timber'].name, ASKS.shot.text({ name: 'Mateo' })].join(' ').toLowerCase();
  assert.match(everything, /\bdeer\b/, 'the hunter is after a deer, and says so');
  for (const creature of ['buck', 'doe', 'buffalo', 'bison', 'turkey', 'boar', 'hog', 'rabbit', 'bear', 'elk', 'antelope']) {
    assert.ok(!everything.includes(creature), `the hunt names a ${creature}`);
  }
});

test('the deer is there to be seen: ahead of the hunter while they wait, closer if they wait, and gone with the shot', () => {
  // Found in play 2026-09-14: "when hunting i don't see an animal". The server says where it stands, so the renderer never
  // invents one; it is ahead of the hunter into the cover, and nowhere once they are on the road.
  const watch = (seed, answer, entityId = 'hh-1-mateo') => {
    const world = running(seed);
    const entity = world.entities[entityId];
    applyAction(world, 'hh-1', { action: 'chore', entityId, chore: 'hunt-timber' });
    const seen = [];
    for (let tick = 0; tick < 400 && entity.chore; tick++) {
      if (entity.chore.ask) applyAction(world, 'hh-1', { action: 'answer-chore', entityId, option: answer });
      stepWorld(world);
      const quarry = entity.chore?.quarry;
      if (entity.travel) assert.equal(quarry, undefined, 'a deer follows somebody on the road');
      const toward = world.map.sites[entity.location.siteId]?.toward;
      if (quarry) seen.push({ ...quarry, miles: Math.hypot(quarry.x - entity.location.x, quarry.y - entity.location.y), ahead: toward && ((quarry.x - entity.location.x) * toward.x + (quarry.y - entity.location.y) * toward.y) });
      validateWorld(world);
    }
    return { world, seen };
  };
  const waited = watch('deer-wait', 'wait');
  assert.ok(waited.seen.length >= 2, 'the deer was never there to see');
  assert.ok(waited.seen.every(q => q.kind === 'deer'));
  const standing = waited.seen;
  assert.ok(standing[0].miles > 0.05, `it is not a close shot: ${standing[0].miles.toFixed(3)} miles`);
  assert.ok(standing.at(-1).miles < 0.05, 'waiting brought it closer');
  // Ahead of the hunter, the way into the family's own cover.
  const ground = waited.world.map.sites['hunt-hh-1'];
  assert.ok(ground.toward);
  assert.ok(waited.seen.every(q => q.ahead > 0), 'the deer stands ahead, into the cover, not behind the hunter in the open');
  // Leaving it: the deer is not left standing on the map once they turn for home.
  const left = watch('deer-leave', 'leave');
  assert.ok(left.seen.length >= 1, 'it was there before they left it');
});

test('the shot happens once, is written down, and is gone the tick after', () => {
  const { world, frames } = hunt('shot');
  const firing = frames.filter(frame => frame.doing === 'the shot');
  assert.equal(firing.length, 1, `the shot was showing for ${firing.length} ticks`);
  const shots = world.events.filter(event => event.type === 'hunt');
  assert.equal(shots.length, 1, 'a hunt fired a different number of shots than one');
  assert.match(shots[0].text, /fired in the timber/);
  assert.equal(shots[0].householdId, 'hh-1', 'the family’s own record should hold it');
  // Recorded in a place, at a time, by somebody. That is what a shot being audible would
  // one day be built on, and a record with no actor could never carry it.
  assert.equal(shots[0].actorId, 'hh-1-mateo');
  assert.ok(Number.isFinite(shots[0].minute));
});

test('they come home carrying it, and the walk out is not the walk back', () => {
  const { frames } = hunt('carry');
  const out = frames.find(frame => frame.doing === 'on the road to the timber');
  const back = frames.find(frame => frame.doing === 'carrying it home from the timber');
  assert.ok(out, 'nobody ever set out');
  assert.ok(back, 'they walked home exactly as they walked out, with nothing to show for it');
  assert.ok(frames.indexOf(back) > frames.indexOf(out));
  // The carry cycle is what the renderer keys on, and it only reads the words the server
  // sent. If this text changes, public/motion.js has to change with it.
  assert.match(back.doing, /carrying it home/);
});

test('two families hunting one stand of timber do not stand inside each other', () => {
  const world = running('crowded');
  // Put the second family's hunter at the same stand by sending both from the same house.
  const first = world.entities['hh-1-mateo'], second = world.entities['hh-1-rosa'];
  applyAction(world, 'hh-1', { action: 'chore', entityId: first.id, chore: 'hunt-timber' });
  applyAction(world, 'hh-1', { action: 'chore', entityId: second.id, chore: 'hunt-timber' });
  let apart = 0;
  for (let tick = 0; tick < 400 && (first.chore || second.chore); tick++) {
    stepWorld(world);
    if (first.location.siteId && first.location.siteId === second.location.siteId) {
      apart = Math.max(apart, Math.hypot(first.location.x - second.location.x, first.location.y - second.location.y));
    }
  }
  assert.ok(apart > .02, `two hunters in one stand were never more than ${apart.toFixed(3)} miles apart`);
});

test('the hunt still costs about what it cost, and yields exactly what it yielded', () => {
  // Showing the work must not quietly reprice it. On foot a hunt brought home five food
  // before the stages existed and brings home five now; what changed is that a student can
  // watch it happen.
  const { world, frames } = hunt('cost');
  const timberTicks = frames.filter(frame => !frame.travelling && frame.siteId !== 'home-1').length;
  assert.ok(timberTicks >= 5 && timberTicks <= 10, `a hunt spent ${timberTicks} ticks in the timber`);
  assert.ok(world.events.some(event => /could carry 5 food home/.test(event.text)),
    'a hunt on foot no longer brings home the five food it always did');

  // On foot the carry cap hides the kill entirely, so a hunt that quietly doubled its
  // yield would look identical from here. The wagon is where the number shows.
  const hauled = running('cost-wagon');
  const before = hauled.households['hh-1'].resources.food;
  applyAction(hauled, 'hh-1', { action: 'chore', entityId: 'hh-1-mateo', chore: 'hunt-timber', mode: 'wagon' });
  for (let tick = 0; tick < 400 && hauled.entities['hh-1-mateo'].chore; tick++) {
    // Answered "wait", so the shot is a certainty and the number being measured is the
    // yield rather than whether this particular person could make the shot.
    if (hauled.entities['hh-1-mateo'].chore?.ask) applyAction(hauled, 'hh-1', { action: 'answer-chore', entityId: 'hh-1-mateo', option: 'wait' });
    stepWorld(hauled);
  }
  const gained = hauled.households['hh-1'].resources.food - before;
  assert.ok(gained > 9 && gained < 15.5, `a hunt with the wagon brought home ${gained.toFixed(1)} food`);
});

test('a stalk only ever moves somebody about the place they are standing', () => {
  // The trap `walk` fell into once: a step that moves a person relative to somewhere they
  // are not carries them across the map for nothing. Every stage of every hunt here is
  // checked against the world's own invariants on the tick it happens, and a hunter is
  // never both on a road and at a place.
  for (const seed of ['invariant-a', 'invariant-b', 'invariant-c']) {
    const { frames } = hunt(seed);
    for (const frame of frames) {
      assert.ok(frame.travelling ? frame.siteId === null : Boolean(frame.siteId),
        `at tick ${frame.tick} a hunter was ${frame.travelling ? 'on the road and at a site' : 'nowhere'}`);
    }
  }
});

// ---------------------------------------------------------------------------------------
// The decision inside the hunt.
//
// The owner: "it needs to be more than just [tell character to hunt and boom they do]."
// So the work stops with somebody downwind and asks, and the three answers are genuinely
// different. What none of them is, is a die: `FIC-GONZ-008` requires outcomes to resolve
// inside a visible risk, so whether a shot connects comes from the person - are they
// tired, do they have the knack - and both are on the control before it is pressed.

/** Somebody in this world whose hunting hand is worth what the test needs. */
function hunterWith(world, wanted) {
  for (const household of Object.values(world.households)) {
    for (const id of household.members) {
      const person_ = world.entities[id];
      if (wanted(person_)) return { person: person_, householdId: household.id };
    }
  }
  return null;
}

test('the work stops and asks, and nothing moves until the family answers', () => {
  const world = running('asks');
  const mateo = world.entities['hh-1-mateo'];
  applyAction(world, 'hh-1', { action: 'chore', entityId: mateo.id, chore: 'hunt-timber' });
  for (let tick = 0; tick < 200 && !mateo.chore?.ask; tick++) stepWorld(world);
  const ask = mateo.chore?.ask;
  assert.ok(ask, 'a hunt ran to the end without ever asking anything');
  assert.equal(ask.id, 'shot');
  assert.equal(ask.options.length, 3, 'a question with fewer than three answers is barely a question');
  assert.deepEqual(ask.options.map(option => option.id), ['take', 'wait', 'leave']);
  for (const option of ask.options) {
    assert.ok(option.label && option.note, `"${option.id}" says nothing about what it would do`);
  }
  // Standing still and spending nothing, while the world goes on around them.
  const held = { step: mateo.chore.step, x: mateo.location.x, doing: mateo.chore.doing };
  for (let tick = 0; tick < 3; tick++) stepWorld(world);
  assert.equal(mateo.chore.step, held.step, 'the work went on past a question nobody had answered');
  assert.equal(mateo.location.x, held.x);
  assert.equal(mateo.chore.doing, held.doing);
  assert.ok(mateo.chore.ask, 'the question closed itself');
  assert.ok(world.events.some(event => /waiting on the family/.test(event.text)));
});

test('the three answers are three different afternoons', () => {
  // One seed for all three, or they are three different maps with three different roads
  // and the tick counts are not comparable. This is the second time that has bitten here:
  // the travel-mode cost test made exactly the same mistake and passed by luck.
  const play = answer => {
    const { world, frames } = hunt('answers', { answer });
    return { ticks: frames.length, world };
  };
  const took = play('take'), waited = play('wait'), left = play('leave');
  // Waiting costs real time: three more hours in the timber, and everything that happens
  // at home in them happens without the person standing in a wood.
  assert.ok(waited.ticks > took.ticks, `waiting took ${waited.ticks} ticks against ${took.ticks} for taking the shot`);
  assert.ok(left.ticks < waited.ticks, 'coming away should be the short afternoon');
  assert.ok(left.world.events.some(event => /leave it and come home/i.test(event.text)));
  assert.ok(!left.world.events.some(event => /fired in the timber/.test(event.text)), 'they came away and fired anyway');
  assert.ok(waited.world.events.some(event => /fired in the timber/.test(event.text)));
});

test('whether the shot connects comes from the person, and is said before it is taken', () => {
  const world = running('steady');
  const steady = hunterWith(world, person_ => (person_.skills?.hunting ?? 1) >= 2);
  const poor = hunterWith(world, person_ => (person_.skills?.hunting ?? 1) < 2);
  assert.ok(steady && poor, 'this world has nobody to tell apart');
  assert.equal(steadyHand(steady.person), true);
  assert.equal(steadyHand(poor.person), false);
  assert.equal(unsteadyBecause(steady.person), null);
  assert.match(unsteadyBecause(poor.person), /never had the knack/);
  // Tired beats a good hand: the road decides this too, not only who was born to it.
  steady.person.health = { condition: 'tired' };
  assert.equal(steadyHand(steady.person), false);
  assert.match(unsteadyBecause(steady.person), /tired, and a tired hand misses/);
  steady.person.health = { condition: 'well' };

  // Played out: the same answer, two different people, two different afternoons.
  //
  // On horseback, deliberately. Walking to a far stand arrives somebody tired, and a tired
  // good hand misses exactly like a poor fresh one - which is the chain working, and the
  // wrong variable for a test about the knack. Riding holds fatigue still so the only
  // thing left changing between these two people is whether they can shoot.
  const shoot = who => {
    const played = running('steady');
    const person_ = played.entities[who.person.id];
    const before = played.households[who.householdId].resources.food;
    applyAction(played, who.householdId, { action: 'chore', entityId: person_.id, chore: 'hunt-timber', mode: 'horse' });
    let steadyAtShot = null;
    for (let tick = 0; tick < 400 && person_.chore; tick++) {
      if (person_.chore?.ask) {
        steadyAtShot = steadyHand(person_);
        applyAction(played, who.householdId, { action: 'answer-chore', entityId: person_.id, option: 'take' });
      }
      stepWorld(played);
    }
    return { gained: played.households[who.householdId].resources.food - before, world: played, steadyAtShot };
  };
  const hit = shoot(steady), missed = shoot(poor);
  assert.equal(hit.steadyAtShot, true, 'the good hand did not arrive steady, so this proves nothing about the knack');
  assert.equal(missed.steadyAtShot, false);
  assert.ok(hit.gained > missed.gained, `the steady hand brought home ${hit.gained.toFixed(1)} and the poor one ${missed.gained.toFixed(1)}`);
  assert.ok(missed.world.events.some(event => /fired and missed/.test(event.text)),
    'a family lost the afternoon to a missed shot and was never told');
  assert.ok(!hit.world.events.some(event => /fired and missed/.test(event.text)));
});

test('waiting closes the range, so even a poor hand comes home with something', () => {
  const world = running('steady');
  const poor = hunterWith(world, person_ => (person_.skills?.hunting ?? 1) < 2);
  const person_ = world.entities[poor.person.id];
  const before = world.households[poor.householdId].resources.food;
  applyAction(world, poor.householdId, { action: 'chore', entityId: person_.id, chore: 'hunt-timber' });
  for (let tick = 0; tick < 400 && person_.chore; tick++) {
    if (person_.chore?.ask) applyAction(world, poor.householdId, { action: 'answer-chore', entityId: person_.id, option: 'wait' });
    stepWorld(world);
  }
  assert.ok(world.households[poor.householdId].resources.food > before,
    'waiting for a close shot still came home with nothing');
  assert.ok(!world.events.some(event => /fired and missed/.test(event.text)));
});

test('nobody stands in a wood for ever waiting on a student who has gone elsewhere', () => {
  const { world, frames, asked } = hunt('patience', { answer: null });
  assert.ok(asked, 'the hunt never asked');
  const waiting = frames.filter(frame => frame.asking).length;
  assert.ok(waiting >= 5, `the question stood for ${waiting} ticks before it settled itself`);
  assert.ok(waiting <= 9, `the question stood for ${waiting} ticks, which is nobody's patience`);
  assert.ok(world.events.some(event => /Nobody answered/.test(event.text)),
    'somebody decided alone and the family record does not say so');
  // "We chose this" and "nobody was listening" are two different stories about the same
  // family, and the epilogue is built out of exactly these.
  const decided = world.events.find(event => /Nobody answered/.test(event.text));
  assert.equal(decided.type, 'choice');
  // Decided as auto decides (sim/chores.mjs `autoChoice`): Mateo has no knack for it, so the long shot is waited for.
  assert.equal(decided.decision, 'wait');
});

test('an answer nobody was offered is refused, and so is answering for another family', () => {
  const world = running('refusals');
  const mateo = world.entities['hh-1-mateo'];
  applyAction(world, 'hh-1', { action: 'chore', entityId: mateo.id, chore: 'hunt-timber' });
  for (let tick = 0; tick < 200 && !mateo.chore?.ask; tick++) stepWorld(world);
  assert.ok(mateo.chore?.ask);
  assert.throws(() => applyAction(world, 'hh-1', { action: 'answer-chore', entityId: mateo.id, option: 'shoot-it-twice' }),
    /not one of the answers/);
  assert.ok(mateo.chore.ask, 'a refused answer closed the question anyway');
  assert.throws(() => applyAction(world, 'hh-2', { action: 'answer-chore', entityId: mateo.id, option: 'take' }),
    /Choose one of your family/);
  assert.throws(() => applyAction(world, 'hh-1', { action: 'answer-chore', entityId: 'hh-1-rosa', option: 'take' }),
    /Nobody is waiting on an answer/);
});

test('how a family travelled decides whether it can shoot straight', () => {
  // The chain this was built for, end to end: a long walk tires somebody, riding barely
  // does, and a tired hand misses a long shot. Nothing in it is new - the exertion, the
  // modes and the tiring threshold all already existed - which is the whole point.
  // A family whose timber is a long way off: a family on a timbered creek hunts at its door and nobody tires getting there.
  const far = world => household => { const ground = huntingGround(world, household), home = world.map.sites[household.homeSiteId]; return Math.hypot(ground.x - home.x, ground.y - home.y) > 2; };
  const probe = running('chain', 15);
  const chosen = hunterWith(probe, person_ => (person_.skills?.hunting ?? 1) >= 2 && far(probe)(probe.households[person_.householdId]));
  assert.ok(chosen, 'a hunter with timber more than two miles off');
  const ride = mode => {
    const world = running('chain', 15);
    const person_ = world.entities[chosen.person.id];
    applyAction(world, chosen.householdId, { action: 'chore', entityId: person_.id, chore: 'hunt-timber', mode });
    let condition = 'well';
    for (let tick = 0; tick < 400 && person_.chore; tick++) {
      if (person_.chore?.ask) {
        condition = person_.health.condition;
        applyAction(world, chosen.householdId, { action: 'answer-chore', entityId: person_.id, option: 'take' });
      }
      stepWorld(world);
    }
    return { condition, exertion: person_.exertion ?? 0 };
  };
  const walked = ride('foot'), rode = ride('horse');
  assert.ok(rode.exertion < walked.exertion, `riding cost ${rode.exertion} against ${walked.exertion} walking`);
  assert.ok(rode.exertion < walked.exertion * .5, 'riding should cost a fraction of walking, not a shade less');
  // The whole chain in one assertion: the road decides the state, and the state decides
  // the shot. Only worth asserting where the walk is long enough to actually tire anybody.
  if (walked.condition === 'tired') {
    assert.notEqual(rode.condition, 'tired', 'riding to the same stand tired them just as much');
    assert.equal(steadyHand({ health: { condition: walked.condition }, skills: { hunting: 3 } }), false);
    assert.equal(steadyHand({ health: { condition: rode.condition }, skills: { hunting: 3 } }), true);
  }
});
