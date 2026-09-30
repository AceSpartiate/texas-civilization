// Suggested places (triage 2.13, classroom audit S8, 2026-09-29): a student who can use only the keyboard - or a touch screen, or
// who reads slowly - chooses the house site, ten acres to survey and the plot to clear or fence from a few buttons the server
// offers, where before only a tap on the map would do. Every suggestion is a place the server itself would accept when looked at
// and when sent; the list is empty when the choice is not open; asking changes nothing; and the route answers only the family.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, stepWorld } from '../sim/world.mjs';
import { holdingOf } from '../sim/grants.mjs';
import { siteFactsFor } from '../sim/homesite.mjs';
import { PLOT_SIDE, plotFacts } from '../sim/survey.mjs';
import { SUGGESTED, suggestPlaces } from '../sim/suggest.mjs';
import { createClassroom } from '../server/app.mjs';

const arrived = (seed, players = 5) => {
  const world = createGonzalesWorld(seed, players, { map: 'colonies' });
  world.status = 'running';
  for (let tick = 0; tick < 200 && Object.values(world.households).some(household => household.arriving); tick++) stepWorld(world);
  return world;
};
const settledOn = world => {
  for (const household of Object.values(world.households)) {
    if (!household.choosingSite) continue;
    const home = world.map.sites[household.homeSiteId];
    applyAction(world, household.id, { action: 'choose-site', x: home.x, y: home.y });
  }
  for (let tick = 0; tick < 100 && Object.values(world.households).some(household => household.arriving); tick++) stepWorld(world);
  return world;
};
const inside = (point, bounds) => point.x >= bounds.minX && point.x <= bounds.maxX && point.y >= bounds.minY && point.y <= bounds.maxY;

test('house sites: up to three on the family\'s own land, each one the server accepts when it is looked at and when it is chosen', () => {
  const world = arrived('suggest-site');
  for (const household of Object.values(world.households)) {
    const places = suggestPlaces(world, household, 'site');
    assert.ok(places.length >= 1 && places.length <= SUGGESTED, `${household.id} is offered one to three sites (${places.length})`);
    const bounds = holdingOf(world, household).bounds;
    for (const place of places) {
      assert.ok(inside(place, bounds), `${household.id}: ${place.label} is on its own land`);
      assert.match(place.label, /wagon: .+, (water close by|needs a well)$/, 'a short label a child can read');
      const facts = siteFactsFor(world, household, place);
      assert.equal(facts.can, true, `${household.id}: ${place.label} is accepted when looked at (${facts.why || ''})`);
      assert.equal(place.words, facts.words, 'the words are the ones a tap there shows');
    }
    const apart = new Set(places.map(place => `${place.x},${place.y}`));
    assert.equal(apart.size, places.length, 'three different places');
  }
  const household = world.households['hh-1'];
  const before = JSON.stringify(world);
  const [first] = suggestPlaces(world, household, 'site');
  assert.equal(JSON.stringify(world), before, 'asking changes nothing in the world');
  applyAction(world, 'hh-1', { action: 'choose-site', x: first.x, y: first.y });
  assert.equal(household.choosingSite, undefined, 'the first suggestion is set as the house site');
  assert.deepEqual(suggestPlaces(world, household, 'site'), [], 'and once chosen there are no sites to suggest');
});

test('nothing is suggested before the family can choose: the lobby, the road in, a survey before the house site', () => {
  const lobby = createGonzalesWorld('suggest-lobby', 5, { map: 'colonies' });
  for (const job of ['site', 'survey-plot', 'clear-plot', 'fence-plot']) assert.deepEqual(suggestPlaces(lobby, lobby.households['hh-1'], job), [], `${job} in the lobby`);
  const world = arrived('suggest-lobby');
  assert.deepEqual(suggestPlaces(world, world.households['hh-1'], 'survey-plot'), [], 'no survey while the house site is to choose');
  assert.deepEqual(suggestPlaces(world, world.households['hh-1'], 'hunt-land'), [], 'no suggestions for work that is not a place choice');
});

test('ten acres to survey: open ground first, on the family\'s land, apart from each other, each accepted and each sendable', () => {
  const world = settledOn(arrived('suggest-survey'));
  const household = world.households['hh-1'];
  const places = suggestPlaces(world, household, 'survey-plot');
  assert.equal(places.length, SUGGESTED, 'three places to survey');
  const spells = places.map(place => plotFacts(world, household, place).spells);
  assert.deepEqual([...spells].sort((a, b) => a - b), spells, 'the least clearing first');
  for (const place of places) {
    const facts = plotFacts(world, household, place);
    assert.equal(facts.can, true, `${place.label} is accepted (${facts.why || ''})`);
    assert.equal(place.words, facts.words);
    assert.match(place.label, /^(Prairie|Brush|Timber), /);
  }
  for (const a of places) for (const b of places) if (a !== b) assert.ok(Math.hypot(a.x - b.x, a.y - b.y) >= PLOT_SIDE, 'no two overlap');
  const surveyor = world.entities[household.principalId];
  applyAction(world, 'hh-1', { action: 'survey-plot', entityId: surveyor.id, x: places[0].x, y: places[0].y });
  assert.equal(surveyor.chore?.id, 'survey-plot', 'the first suggestion is sent');
});

test('plots to clear and to fence: the family\'s own, the ones that work can go to now, nearest the house first', () => {
  const world = settledOn(arrived('suggest-plots'));
  const household = world.households['hh-1'];
  const [one, two] = suggestPlaces(world, household, 'survey-plot');
  household.plots = [
    { id: 'plot-a', x: one.x, y: one.y, ground: 'prairie', state: 'staked', work: 0 },
    { id: 'plot-b', x: two.x, y: two.y, ground: 'prairie', state: 'cleared', fence: 'none' },
  ];
  const clear = suggestPlaces(world, household, 'clear-plot'), fence = suggestPlaces(world, household, 'fence-plot');
  assert.deepEqual(clear.map(place => place.plotId), ['plot-a'], 'the staked plot to clear, not the cleared one');
  assert.deepEqual(fence.map(place => place.plotId), ['plot-b'], 'the cleared plot to fence, not the staked one');
  for (const [job, place] of [['clear-plot', clear[0]], ['fence-plot', fence[0]]]) {
    const facts = plotFacts(world, household, place, job);
    assert.equal(facts.can, true, `${job}: ${facts.why || ''}`);
    assert.equal(facts.plotId, place.plotId, 'the point is on the plot');
  }
  household.plots[1].fence = 'sound';
  assert.deepEqual(suggestPlaces(world, household, 'fence-plot'), [], 'a plot already fenced is not offered');
});

test('the server offers them to the family on /api/suggest, to its own land only, and refuses the Host and an unknown job', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'texas-suggest-'));
  const app = createClassroom({ savePath: join(dir, 'classroom.json'), playerCount: 5, tickMs: 10000, worldFactory: (seed, count) => createGonzalesWorld(seed, count, { map: 'colonies' }) });
  const port = await app.listen(0, '127.0.0.1');
  try {
    const base = `http://127.0.0.1:${port}`;
    const joined = await fetch(`${base}/api/join`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: app.snapshot({ role: 'host' }).sessionCode, name: 'Ada' }) });
    const cookie = joined.headers.get('set-cookie').split(';')[0];
    const inLobby = await (await fetch(`${base}/api/suggest?job=site`, { headers: { Cookie: cookie } })).json();
    assert.deepEqual(inLobby.places, [], 'nothing in the lobby');
    const unknown = await fetch(`${base}/api/suggest?job=anything`, { headers: { Cookie: cookie } });
    assert.equal(unknown.status, 400, 'an unknown job is refused');
    const host = await fetch(`${base}/api/suggest?job=site`, { headers: { Cookie: `tr_host_${app.snapshot({ role: 'host' }).sessionId}=${app.state.hostKey}` } });
    assert.equal(host.status, 403, 'the Host has no land to choose on');
    const stranger = await fetch(`${base}/api/suggest?job=site`);
    assert.equal(stranger.status, 401, 'nobody who has not joined');
  } finally { await app.close(); rmSync(dir, { recursive: true, force: true }); }
});
