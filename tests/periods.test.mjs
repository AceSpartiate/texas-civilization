// Two class periods: docs/COLONIES.md §7e and build step 8(a), decided by the owner by multiple choice (2026-09-16).
//
// The first period ends on the evening of December 15 with interim standings, not a winner. The Host continues the same
// class into the winter: the weeks between are skipped gently - everyone who went home is home, wounds heal by the time
// that passed, the family eats an ordinary winter and never starves - and the second period opens paused at dawn on
// January 25, 1836, with the same families, keys and glory. It plays its own moments, none of 1835's again, and ends with
// the final reckoning.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, projectWorld, stepWorld, validateWorld } from '../sim/world.mjs';
import { momentOf } from '../sim/directors.mjs';
import { WINTER_FLOOR_DAYS, beginSecondPeriod, canContinue } from '../sim/periods.mjs';
import { createClassroom } from '../server/app.mjs';

const view = (world, householdId, role = 'student') => projectWorld(world, householdId, role, { includeMap: false });
const until = (world, done, limit = 8000) => { for (let t = 0; t < limit && !done() && world.status === 'running'; t++) stepWorld(world); };

let shared = null;
/** A real-land class played to the end of its first period, with one family's volunteer sent to the army. */
const firstPeriod = () => structuredClone(shared ??= (() => {
  const world = createGonzalesWorld('periods-class', 5, { map: 'colonies' });
  world.status = 'running';
  const household = world.households['hh-1'];
  until(world, () => world.calls?.[household.id]);
  const found = Object.entries(view(world, household.id).request?.answerers || {}).find(([, options]) => options.find(o => o.id === 'turn-out')?.can);
  assert.ok(found, 'nobody in hh-1 could turn out');
  applyAction(world, household.id, { action: 'turn-out', entityId: found[0], mode: 'horse' });
  until(world, () => world.director.complete);
  assert.equal(world.status, 'ended', 'the first period did not end');
  return world;
})());

test('the first period ends with interim standings and the winter offered to the Host; the invented country has no winter', () => {
  const world = firstPeriod();
  assert.ok(world.director.milestones['bexar-end']);
  const family = view(world, 'hh-1').ending.family;
  const host = view(world, undefined, 'host').ending.host;
  assert.equal(family.interim, true, 'the family was told the story ended');
  assert.equal(host.interim, true, 'the Host was shown a finished class');
  assert.equal(host.canContinue, true, 'the Host was not offered the winter');
  assert.equal(canContinue(world), true);

  const invented = createGonzalesWorld('periods-invented', 5);
  invented.status = 'running';
  until(invented, () => invented.director.complete, 3000);
  assert.equal(invented.status, 'ended');
  assert.equal(canContinue(invented), false, 'the invented Gonzales country was offered a winter');
  assert.equal(view(invented, undefined, 'host').ending.host.interim, false);
  assert.throws(() => beginSecondPeriod(invented), /first period/);
});

test('continuing skips the winter gently: everyone home, wounds healed by the time passed, a winter eaten but never starved', () => {
  const world = firstPeriod();
  const [a, b, c] = Object.values(world.households);
  const glory = structuredClone(world.glory);
  const ids = Object.keys(world.entities).sort();
  // Somebody still out on the road, somebody still lying dangerously wounded at Béxar into February, somebody whose
  // severe wound mends in January, and one who died.
  const [walker, lying, mending, dead] = [a.members[0], b.members[0], b.members[1], c.members[0]].map(id => world.entities[id]);
  const bexar = world.map.sites.bexar ? 'bexar' : Object.keys(world.map.sites).find(id => /bexar/.test(id));
  walker.location = { ...world.map.sites[bexar], siteId: bexar };
  lying.health = { condition: 'wounded', grade: 'dangerous', recoversAt: momentOf(world, 'winter-opens') + 12 * 1440 };
  lying.location = { x: world.map.sites[bexar].x, y: world.map.sites[bexar].y, siteId: bexar };
  mending.health = { condition: 'wounded', grade: 'severe', recoversAt: momentOf(world, 'winter-opens') - 20 * 1440 };
  mending.location = { x: world.map.sites[bexar].x, y: world.map.sites[bexar].y, siteId: bexar };
  dead.health = { condition: 'dead' };
  a.resources.food = 500; b.resources.food = 1;
  const gapDays = (momentOf(world, 'winter-opens') - world.minute) / 1440;

  beginSecondPeriod(world);
  validateWorld(world);
  assert.equal(world.period, 2);
  assert.equal(world.minute, momentOf(world, 'winter-opens'), 'the second period did not open at dawn on January 25');
  assert.equal(world.status, 'paused', 'the second period started without the teacher');
  assert.deepEqual(Object.keys(world.entities).sort(), ids, 'somebody appeared or vanished over the winter');
  assert.deepEqual(world.glory, glory, 'glory changed over the winter');
  assert.equal(walker.location.siteId, a.homeSiteId, 'somebody away at the end of the first period is not home');
  assert.equal(walker.travel, null);
  assert.equal(lying.location.siteId, bexar, 'a wound still mending in February was carried home');
  assert.equal(lying.health.condition, 'wounded');
  assert.equal(mending.health.condition, 'well', 'a wound mended in January was still open');
  assert.equal(mending.location.siteId, b.homeSiteId);
  assert.equal(dead.health.condition, 'dead', 'the winter raised the dead');
  for (const household of Object.values(world.households)) {
    for (const id of household.members) {
      const person = world.entities[id];
      if (person === lying || person.health.condition === 'dead') continue;
      assert.equal(person.location.siteId, household.homeSiteId, `${person.name} is not home`);
    }
  }
  const eaters = household => household.members.filter(id => world.entities[id].health.condition !== 'dead').length;
  assert.ok(Math.abs(a.resources.food - (500 - eaters(a) * 0.35 * gapDays)) < 0.01, `a family with plenty did not eat the winter: ${a.resources.food}`);
  assert.equal(b.resources.food, 1, 'a family with little starved over time nobody played');
  assert.ok(WINTER_FLOOR_DAYS > 0);
  assert.equal(view(world, 'hh-1').ending, undefined, 'the standings stayed on screen into the second period');
  assert.throws(() => beginSecondPeriod(world), /first period/, 'a class went into the winter twice');
});

test('the second period plays its own moments, none of 1835 again, and ends with the final reckoning', () => {
  const world = firstPeriod();
  beginSecondPeriod(world);
  const preserved = () => world.events.filter(event => event.type === 'slice-preserved').length;
  const before = preserved();
  world.status = 'running';
  assert.equal(world.director.phase, 'home', 'the second period did not open on the quiet farming scale');
  stepWorld(world);
  assert.equal(world.minute - momentOf(world, 'winter-opens'), 20, 'a tick of the opening was not twenty minutes');
  until(world, () => world.director.milestones['winter-news']);
  assert.equal(world.director.phase, 'campaign', 'the winter news did not move the calendar on');
  until(world, () => world.director.complete);
  assert.equal(world.status, 'ended');
  assert.ok(world.minute >= momentOf(world, 'alamo-end'));
  assert.equal(preserved(), before + 1, 'the end of 1835 fired again in the winter');
  const host = view(world, undefined, 'host').ending.host;
  assert.equal(host.interim, false, 'the end of the second period was only interim');
  assert.equal(host.canContinue, false, 'the Host was offered a third period');
});

test('a saved class period that is neither the first nor the second is refused', () => {
  const world = createGonzalesWorld('periods-invalid', 5, { map: 'colonies' });
  world.period = 3;
  assert.throws(() => validateWorld(world), /class period/);
});

test('the Host continues the same class: same session and the same families, once', async () => {
  const app = createClassroom({ seed: 'periods-server', playerCount: 5, tickMs: 10000, worldFactory: () => firstPeriod() });
  const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
  try {
    const post = async (path, body, cookie) => {
      const response = await fetch(url + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(cookie && { Cookie: cookie }) }, body: JSON.stringify(body) });
      return { status: response.status, body: await response.json(), cookie: response.headers.get('set-cookie') };
    };
    const session = app.state.sessionId, clients = structuredClone(app.state.clients);
    const hostCookie = `tr_host_${app.state.sessionId}=${app.state.hostKey}`;
    const refused = await post('/api/command', { id: 'cmd-student-early', action: 'next-period' }, hostCookie.replace(app.state.hostKey, 'wrong'));
    assert.notEqual(refused.status, 200, 'a stranger continued the class');
    const continued = await post('/api/command', { id: 'cmd-next-period-1', action: 'next-period' }, hostCookie);
    assert.equal(continued.status, 200, JSON.stringify(continued.body));
    assert.equal(app.state.sessionId, session, 'continuing started a new session');
    assert.deepEqual(app.state.clients, clients, 'continuing forgot who plays which family');
    assert.equal(app.state.world.period, 2);
    const again = await post('/api/command', { id: 'cmd-next-period-2', action: 'next-period' }, hostCookie);
    assert.equal(again.status, 400, 'the class went into the winter twice');
  } finally {
    await app.close();
  }
});
