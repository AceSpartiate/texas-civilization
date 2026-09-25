// Powder and lead: the one thing a hunt and a fight both spend.
//
// The owner asked what Total War might give hunting and battles. Most of that game is the
// thing VISION.md §16 forbids outright - formations, flanking, a tactical war game - but
// two of its ideas are right, and this file holds the one with teeth: **a shot costs
// something finite**. Total War's missile troops run out and then have only their hands;
// here a family runs out and then has only its field.
//
// It is the material tie the owner was reaching for between hunting and taking part.
// `HIST-GONZ-020`: the volunteers at Gonzales were settlers who brought their own arms,
// and on the frontier a man could shoot as long as he had lead, powder and caps. So the
// same barrel feeds the timber and goes up the river, and spending it on one is not
// spending it on the other.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createSettledWorld } from './support/settled.mjs';
import { applyAction, createWorld, projectWorld, stepWorld, validateWorld, STARTING_POWDER } from '../sim/world.mjs';
import { CHORES, SHOT_COST, askAvailability, choreAvailability, dryHouse } from '../sim/chores.mjs';
import { MARCH_POWDER, TIMELINE } from '../sim/directors.mjs';
import { GOODS } from '../sim/trade.mjs';
import { readSave } from '../server/storage.mjs';

const running = (seed = 'powder', count = 5) => {
  const world = createSettledWorld(seed, count);
  world.status = 'running';
  return world;
};
const view = (world, householdId) => projectWorld(world, householdId, 'student', { includeMap: false });

/** Send somebody hunting and stop when the question is on the table. */
function untilAsk(world, householdId = 'hh-1', entityId = 'hh-1-mateo') {
  applyAction(world, householdId, { action: 'chore', entityId, chore: 'hunt-timber' });
  for (let tick = 0; tick < 200 && !world.entities[entityId].chore?.ask; tick++) stepWorld(world);
  return world.entities[entityId].chore?.ask;
}

test('a family keeps powder in the house, and a shot spends it', () => {
  const world = running('spend');
  const household = world.households['hh-1'];
  // What the load packed: the default's three shots, or fewer for a family that came on foot with its ox under packs
  // (sim/means.mjs, sim/wagon.mjs `PACK_SPACE`) - as this one of 'spend' did - which still brings one at the least.
  assert.equal(household.resources.powder, household.means?.afoot ? household.load.find(entry => entry.id === 'powder').amount : STARTING_POWDER);
  assert.ok(household.resources.powder >= 1, 'a family came with no shot to spend');
  assert.ok(STARTING_POWDER >= 2, 'a family that cannot afford a second thought has no decision to make');
  const before = household.resources.powder;
  const mateo = world.entities['hh-1-mateo'];
  assert.ok(untilAsk(world));
  applyAction(world, 'hh-1', { action: 'answer-chore', entityId: mateo.id, option: 'take' });
  for (let tick = 0; tick < 400 && mateo.chore; tick++) stepWorld(world);
  assert.equal(household.resources.powder, before - SHOT_COST, 'a shot went off and the house is no lighter for it');
  assert.ok(world.events.some(event => /fired in the timber/.test(event.text)));
});

test('coming away spends nothing, which is the point of being able to come away', () => {
  const world = running('spend');
  const mateo = world.entities['hh-1-mateo'];
  const before = world.households['hh-1'].resources.powder;
  assert.ok(untilAsk(world));
  applyAction(world, 'hh-1', { action: 'answer-chore', entityId: mateo.id, option: 'leave' });
  for (let tick = 0; tick < 400 && mateo.chore; tick++) stepWorld(world);
  assert.equal(world.households['hh-1'].resources.powder, before);
});

test('an empty house is told so on the control, and the answer is refused if it arrives anyway', () => {
  const world = running('dry');
  const household = world.households['hh-1'], mateo = world.entities['hh-1-mateo'];
  assert.ok(untilAsk(world));
  household.resources.powder = 0;
  assert.equal(dryHouse(household), true);
  // Live, not quoted: the question was asked while there was powder, and a sibling may
  // just as easily have brought some home. What is open is read now.
  const shown = view(world, 'hh-1').entities.find(entity => entity.id === mateo.id).chore.ask;
  const take = shown.options.find(option => option.id === 'take');
  const leave = shown.options.find(option => option.id === 'leave');
  assert.equal(take.can, false);
  assert.match(take.why, /no powder and lead/);
  assert.equal(shown.options.find(option => option.id === 'wait').can, false, 'waiting still ends in a shot');
  assert.equal(leave.can, true, 'coming away must never be shut, or the hunt is a trap');
  assert.throws(() => applyAction(world, 'hh-1', { action: 'answer-chore', entityId: mateo.id, option: 'take' }), /no powder and lead/);
  // And the price beside it has not moved, because a quoted price never does.
  assert.match(take.note, /One powder/);
});

test('nobody decides alone to fire a gun they cannot load', () => {
  const world = running('dry-patience');
  const mateo = world.entities['hh-1-mateo'];
  assert.ok(untilAsk(world));
  world.households['hh-1'].resources.powder = 0;
  for (let tick = 0; tick < 400 && mateo.chore; tick++) stepWorld(world);
  // The fallback is to take the shot. With nothing to fire, the person comes away instead.
  assert.ok(world.events.some(event => /Nobody answered/.test(event.text)));
  assert.ok(!world.events.some(event => /fired in the timber/.test(event.text)), 'somebody fired an empty rifle');
  assert.equal(world.households['hh-1'].resources.powder, 0);
});

test('there is somewhere to get more, and it costs an afternoon and food or coin', () => {
  const chore = CHORES['fetch-powder'];
  assert.ok(chore, 'a family can run out and never buy any');
  // Paid in food or in coin at the counter; nobody answering pays in food, as it always was.
  assert.ok(chore.needsAny.some(price => price.food >= 1), 'powder should cost something a family would rather eat');
  const world = running('buy');
  const household = world.households['hh-1'], rosa = world.entities['hh-1-rosa'];
  household.resources.powder = 0;
  const food = household.resources.food;
  applyAction(world, 'hh-1', { action: 'chore', entityId: rosa.id, chore: 'fetch-powder' });
  for (let tick = 0; tick < 600 && rosa.chore; tick++) stepWorld(world);
  assert.ok(household.resources.powder > 0, `they went to town for powder and came back with ${household.resources.powder}`);
  assert.ok(household.resources.food < food, 'and it was free');
  assert.ok(world.events.some(event => /powder and lead/.test(event.text)), 'the trade is not in the family record');
});

test('the powder that goes upriver is the powder that is not in the timber', () => {
  // The tie the whole thing exists for. Nothing here touches the battle - HIST-GONZ-004
  // fixes that outcome and nothing a family does may move it. What it touches is the
  // family afterwards.
  const world = running('upriver');
  let asked = null;
  for (let tick = 0; tick < 400 && !asked; tick++) {
    stepWorld(world);
    const request = view(world, 'hh-1').request;
    if (request?.status === 'open' && request.kind !== 'march') {
      try { applyAction(world, 'hh-1', { action: request.kind === 'rumor' ? 'go-see' : 'help', entityId: world.households['hh-1'].principalId }); } catch { /* not yet known */ }
    }
    if (request?.kind === 'march' && request.status === 'open') asked = request;
  }
  assert.ok(asked, 'no family was ever asked to go upriver');
  // The control says what will be taken, as a rule rather than a running count.
  const going = asked.options.find(option => option.id === 'go-upriver');
  assert.match(going.note, new RegExp(`up to ${MARCH_POWDER} powder`));
  const before = world.households['hh-1'].resources.powder;
  applyAction(world, 'hh-1', { action: 'go-upriver', entityId: asked.actorId });
  const taken = before - world.households['hh-1'].resources.powder;
  assert.equal(taken, Math.min(MARCH_POWDER, before), `they went up the river with ${taken} powder`);
  assert.ok(world.events.some(event => /took \d+ powder up the river/.test(event.text)),
    'the family record does not say what went with them');
});

test('a family with nothing to send is not stopped from going', () => {
  // Refusing the march for want of powder would make a documented historical moment turn
  // on a resource, which VISION.md §13 keeps in flex space only for *who* takes part. A
  // person can go and carry supplies, which is what the request actually asks.
  const world = running('empty-upriver');
  let asked = null;
  for (let tick = 0; tick < 400 && !asked; tick++) {
    stepWorld(world);
    const request = view(world, 'hh-1').request;
    if (request?.status === 'open' && request.kind !== 'march') {
      try { applyAction(world, 'hh-1', { action: request.kind === 'rumor' ? 'go-see' : 'help', entityId: world.households['hh-1'].principalId }); } catch { /* not yet known */ }
    }
    if (request?.kind === 'march' && request.status === 'open') asked = request;
  }
  assert.ok(asked);
  world.households['hh-1'].resources.powder = 0;
  const going = view(world, 'hh-1').request.options.find(option => option.id === 'go-upriver');
  assert.equal(going.can, true, 'a family with no powder was shut out of a documented moment');
  applyAction(world, 'hh-1', { action: 'go-upriver', entityId: asked.actorId });
  assert.equal(world.marches['hh-1'].status, 'accepted');
});

test('powder can be traded, because a family may have one thing and want another', () => {
  assert.ok(GOODS.includes('powder'), 'powder is spendable and not tradeable, which makes neighbours useless for it');
  const world = running('trade');
  world.households['hh-2'].members.forEach(id => {
    world.entities[id].location = { ...world.entities[world.households['hh-1'].principalId].location };
  });
  const from = world.entities[world.households['hh-1'].principalId];
  const to = world.entities[world.households['hh-2'].principalId];
  applyAction(world, 'hh-1', {
    action: 'offer', entityId: from.id, toEntityId: to.id,
    give: { powder: 1 }, ask: { food: 2 },
  });
  const offered = view(world, 'hh-2').offers;
  assert.ok(offered.length, 'an offer of powder never reached the neighbour');
  assert.match(JSON.stringify(offered), /powder/);
});

test('the hunt says whether the house is dry before anybody sets out', () => {
  const world = running('before');
  const household = world.households['hh-1'], mateo = world.entities['hh-1-mateo'];
  assert.equal(choreAvailability(world, household, mateo, 'hunt-timber').can, true);
  assert.equal(askAvailability(world, household, mateo, 'take').can, true);
  household.resources.powder = 0;
  assert.equal(askAvailability(world, household, mateo, 'take').can, false);
  assert.equal(askAvailability(world, household, mateo, 'leave').can, true);
});

test('a class saved before a shot cost anything opens with its powder, not without it', () => {
  // The judgement CLAUDE.md asks for rather than the reflex. Those families could hunt,
  // so the empty value that keeps what was true of them is the full house - and it is
  // filled at the one door every save comes through, so one absent number cannot mean
  // three to a chore and nothing to a trade.
  const folder = mkdtempSync(join(tmpdir(), 'texas-powder-'));
  try {
    const world = createWorld('old-save', 5);
    for (const household of Object.values(world.households)) delete household.resources.powder;
    const path = join(folder, 'class.json');
    writeFileSync(path, JSON.stringify({ saveVersion: 3, world }));
    const restored = readSave(path);
    for (const household of Object.values(restored.world.households)) {
      assert.equal(household.resources.powder, STARTING_POWDER, 'a class in progress lost the ability to hunt');
    }
    restored.world.status = 'running';
    validateWorld(restored.world);
    assert.equal(dryHouse(restored.world.households['hh-1']), false);
  } finally {
    rmSync(folder, { recursive: true, force: true });
  }
});
