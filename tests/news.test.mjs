// News by riders over real distance: docs/COLONIES.md §5.4, build step 4 (part 1).
//
// On the real map the word leaves Gonzales for the other settlements when the letters say it did, rides the real roads
// settlement to settlement, waits at each while it is read and copied, and goes out from each settlement to its own
// families by riders who say where it came from. The arrivals are checked against the dated letters (`HIST-TEX-006`). A
// family far from Gonzales is not asked the Gonzales calls, and the class runs on until the furthest family has heard how
// the fight ended. The invented Gonzales map is untouched.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { stepWorld, validateWorld } from '../sim/world.mjs';
import { momentOf } from '../sim/directors.mjs';
import { RELAY_MINUTES, distantHouseholds } from '../sim/expresses.mjs';

/** Minutes on a new class's clock, which starts at dawn (06:00) on September 28, 1835. */
const at = (day, hour, minute = 0) => (day - 28) * 1440 + (hour - 6) * 60 + minute;
const when = minute => new Date(Date.UTC(1835, 8, 28, 6) + minute * 60000).toISOString().slice(5, 16).replace('T', ' ');

/** A real-map class of fifteen families played to its end with nobody at the controls, watching the riders go. */
function playedOut(seed) {
  const world = createGonzalesWorld(seed, 15, { map: 'colonies' });
  world.status = 'running';
  const carried = [];
  for (let tick = 0; tick < 1500 && !world.director.complete; tick++) {
    stepWorld(world);
    for (const entity of Object.values(world.entities)) {
      const report = entity.report;
      if (report?.provenance?.length && !carried.some(seen => seen.id === entity.id)) carried.push({ id: entity.id, audience: report.audience, topicId: report.topicId, origin: report.originSiteId, provenance: report.provenance, from: entity.travel?.from ?? entity.location.siteId });
    }
  }
  return { world, carried };
}

let played = null;
const class15 = () => played ||= playedOut('news-colonies');

test('the word reaches the other settlements when the letters say it did', () => {
  const { world } = class15();
  const heard = topic => world.expresses[topic].heard;
  const call = heard('cannon-request'), fight = heard('gonzales-outcome');
  const within = (minute, from, to, what) => assert.ok(minute >= from && minute <= to, `${what} at ${when(minute)}, not between ${when(from)} and ${when(to)}`);
  // HIST-TEX-006: Moore's on the Colorado had it before September 29 - earlier than this game's own story begins at Gonzales
  // on the 29th (HIST-GONZ-002) - so the most it can do is have it there the day the letters went out.
  within(call['la-grange-crossing'], at(30, 8), at(30, 23, 59), 'the call for help reached the Colorado crossing');
  // By October 1, the letters "recd by Express by way of Coles' Settlement" had reached San Felipe.
  within(call['san-felipe'], at(30, 18), at(31, 23, 59), 'the call for help reached San Felipe');
  // October 2-3, Lightfoot and Perkins brought the attack on Gonzales to San Felipe.
  within(fight['san-felipe'], at(32, 12), at(33, 23, 59), 'the fight reached San Felipe');
  // And on from San Felipe, never ahead of it: the Trinity heard after.
  assert.ok(call.liberty > call['san-felipe'] && fight.liberty > fight['san-felipe'], 'Liberty heard before San Felipe');
  assert.ok(call.harrisburg > call['san-felipe'], 'the road east runs through San Felipe');
});

test('a family far from Gonzales hears by express, from a rider of its own settlement who says where the word came from', () => {
  const { world, carried } = class15();
  const distant = distantHouseholds(world);
  assert.ok(distant.length >= 10, `only ${distant.length} families live away from Gonzales`);
  for (const household of Object.values(world.households)) {
    for (const topic of ['cannon-request', 'gonzales-outcome']) {
      const report = world.knowledge.households[household.id][topic];
      assert.ok(report, `${household.id} of ${household.settlementId} never heard ${topic}`);
      if (household.settlementId === 'gonzales') continue;
      const reached = world.expresses[topic].heard[household.settlementId];
      assert.ok(report.receivedMinute >= reached + RELAY_MINUTES, `${household.id} heard ${topic} at ${when(report.receivedMinute)}, before ${household.settlementId} had read the express (${when(reached)})`);
      assert.notEqual(report.status, 'confirmed', 'nobody who saw it rode two hundred miles to say so');
    }
  }
  const nearest = Math.max(...Object.values(world.households).filter(h => h.settlementId === 'gonzales').map(h => world.knowledge.households[h.id]['cannon-request'].receivedMinute));
  const liberty = Math.min(...Object.values(world.households).filter(h => h.settlementId === 'liberty').map(h => world.knowledge.households[h.id]['cannon-request'].receivedMinute));
  assert.ok(liberty - nearest > 2 * 1440, `Liberty heard only ${Math.round((liberty - nearest) / 60)} hours after Gonzales`);
  // The rider at a distant family's gate carries the express riders in their ancestry, and set out from that family's town.
  const toDistant = carried.filter(errand => world.households[errand.audience].settlementId !== 'gonzales');
  assert.ok(toDistant.length >= distant.length, 'riders out to distant families were never seen on the road');
  for (const errand of toDistant) {
    const settlement = world.households[errand.audience].settlementId;
    assert.ok(errand.provenance.some(hop => hop.atSiteId === settlement), `the word for ${errand.audience} did not pass through ${settlement}`);
    assert.equal(errand.origin, 'gonzales', 'and started out of Gonzales, however many hands it passed through');
  }
  validateWorld(world);
});

test('a distant family is not asked the Gonzales calls, and the word still reaches every family before the army marches', () => {
  const { world } = class15();
  for (const household of distantHouseholds(world)) {
    assert.equal(world.requests[household.id], undefined, `${household.id} of ${household.settlementId} was asked to carry food to Gonzales`);
    assert.equal(world.rumors[household.id], undefined, `${household.id} was asked to ride to Gonzales to check a rumor`);
  }
  const last = Math.max(...Object.values(world.households).map(h => world.knowledge.households[h.id]['gonzales-outcome'].receivedMinute));
  assert.ok(world.minute > momentOf(world, 'finish'), 'the class ended before the far families could hear');
  // The class used to stop as soon as the last family had heard. Since build step 5 it goes on to
  // the gathering and the march (docs/COLONIES.md §5.5), so what is asserted now is that the word
  // still reached everybody while it ran, and that what ended it was the army leaving.
  assert.ok(world.minute > last, 'a family heard after the class had ended');
  assert.ok(world.director.milestones.march, 'the class ended before the army marched');
});

test('the invented Gonzales map is told as it always was', () => {
  const world = createGonzalesWorld('news-gonzales', 5);
  world.status = 'running';
  let ticks = 0;
  for (; ticks < 1500 && !world.director.complete; ticks++) stepWorld(world);
  assert.equal(world.expresses, undefined, 'an express rode on a map with no other settlements');
  assert.equal(world.minute, momentOf(world, 'finish'), 'and the class ended when it always did');
  assert.equal(distantHouseholds(world).length, 0);
});

test('a stored express has a road and a place for every hand, and a real-map class saved before expresses opens', () => {
  const world = createGonzalesWorld('news-validate', 5, { map: 'colonies' });
  world.status = 'running';
  for (let tick = 0; tick < 1500 && !world.expresses?.['cannon-request']?.heard?.['la-grange-crossing']; tick++) stepWorld(world);
  validateWorld(world);
  const state = world.expresses['cannon-request'];
  state.routes.nowhere = 'gonzales';
  assert.throws(() => validateWorld(world), /route to nowhere/);
  delete state.routes.nowhere;
  const rider = Object.values(world.entities).find(entity => entity.express);
  assert.ok(rider, 'an express rider on the road');
  rider.express.provenance = [{ name: '', atSiteId: 'gonzales', minute: 0 }];
  assert.throws(() => validateWorld(world), /hand-off must name/);
  // A real-map class saved before expresses existed: no `expresses`, no rider carrying one.
  const old = createGonzalesWorld('news-old', 5, { map: 'colonies' });
  assert.equal(old.expresses, undefined);
  validateWorld(old);
});
