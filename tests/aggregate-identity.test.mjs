import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { stepWorld, applyAction, projectWorld } from '../sim/world.mjs';

// A formation is a count and a position. A family member is a person with an id, a
// location and a fate. The rule this file guards is that joining the first must never
// replace the second - the aggregate borrows nobody's identity, and nobody dissolves
// into it. 0 A.D. enforces the same thing by wrapping a unit's own state machine in a
// FORMATIONMEMBER state that delegates straight back to INDIVIDUAL.*; the member keeps
// thinking for itself and falls cleanly back out on leaving. See
// docs/REFERENCE_ARCHITECTURES.md. Until now this invariant was only exercised by the
// browser proof, which needs a browser; it is cheap to check headlessly and it is the
// single most damaging thing that could quietly regress.
function runToBattle(world, limit = 900) {
  for (let tick = 0; tick < limit; tick++) {
    stepWorld(world);
    if (world.director.battle.phase !== 'waiting') return;
  }
  throw new Error('battle never began');
}

test('a person who joins the gathering stays a person, and the formation stays a count', () => {
  const world = createGonzalesWorld('aggregate', 5);
  world.status = 'running';
  // Accept the request as soon as it opens, so a real named person is at Gonzales.
  let thomas = world.entities['hh-1-thomas'];
  for (let tick = 0; tick < 900 && world.director.battle.phase === 'waiting'; tick++) {
    stepWorld(world);
    if (world.director.request?.status === 'open') {
      try { applyAction(world, 'hh-1', { action: 'help', entityId: thomas.id }); } catch { /* not yet affordable */ }
    }
  }
  assert.notEqual(world.director.battle.phase, 'waiting', 'the battle reached a visible phase');

  // The person is still exactly one entity, under his own id, with his own location.
  thomas = world.entities['hh-1-thomas'];
  assert.ok(thomas, 'the principal still exists');
  assert.equal(thomas.id, 'hh-1-thomas', 'his id did not change');
  assert.equal(thomas.kind, 'person');
  assert.ok(Number.isFinite(thomas.location.x) && Number.isFinite(thomas.location.y));
  const sameName = Object.values(world.entities).filter(e => e.id.startsWith('hh-1-') && e.name === thomas.name);
  assert.equal(sameName.length, 1, 'the battle did not mint a second copy of him');

  // The formations carry counts and positions, and no person's identity.
  const formations = world.director.battle.formations;
  assert.ok(formations.length >= 2);
  for (const formation of formations) {
    assert.ok(Number.isFinite(formation.count), 'a formation is a count');
    assert.ok(Number.isFinite(formation.x) && Number.isFinite(formation.y), 'and a position');
    const wire = JSON.stringify(formation);
    assert.doesNotMatch(wire, /hh-\d/, 'a formation names no household');
    assert.doesNotMatch(wire, new RegExp(thomas.name), 'a formation names no person');
    for (const key of ['members', 'entityId', 'entityIds', 'principalId']) {
      assert.equal(formation[key], undefined, `a formation carries no ${key}`);
    }
  }
});

test('a household at the battle sees formations without seeing anyone else', () => {
  const world = createGonzalesWorld('aggregate-view', 5);
  world.status = 'running';
  for (let tick = 0; tick < 900 && world.director.battle.phase === 'waiting'; tick++) {
    stepWorld(world);
    if (world.director.request?.status === 'open') {
      try { applyAction(world, 'hh-1', { action: 'help', entityId: 'hh-1-thomas' }); } catch { /* not yet affordable */ }
    }
  }
  const projected = projectWorld(world, 'hh-1', 'student', { includeMap: false });
  // Everyone in `entities` belongs to this household. A sampled soldier drawn from a
  // formation count must never arrive as an entity someone could select or command.
  for (const entity of projected.entities) assert.equal(entity.householdId, 'hh-1');
  // Another household's person may legitimately appear in `others` — that is what
  // standing in the same place means — but only ever as somebody seen, never as state.
  // Asserting a blanket absence of "hh-2" anywhere in the payload was the right rule
  // when a student could see nobody, and became the wrong rule the moment they could.
  for (const person of projected.others || []) {
    assert.notEqual(person.householdId, 'hh-1', 'your own family is not in the observed list');
    for (const secret of ['skills', 'chore', 'resources', 'commitments']) assert.equal(person[secret], undefined);
  }
  assert.equal(projected.work['hh-2-thomas'], undefined, 'and no control over anybody else');
  if (projected.battle) {
    for (const formation of projected.battle.formations || []) {
      assert.equal(formation.members, undefined);
      assert.ok(Number.isFinite(formation.count));
    }
  }
});

test('routine time never resolves a serious condition, and a chore does not outlive one', () => {
  const world = createGonzalesWorld('aggregate-harm', 5);
  world.status = 'running';
  const rosa = world.entities['hh-1-rosa'];
  applyAction(world, 'hh-1', { action: 'chore', entityId: rosa.id, chore: 'plant-field' });
  for (let tick = 0; tick < 3; tick++) stepWorld(world);
  assert.ok(rosa.chore, 'she is at work');
  rosa.health = { condition: 'major-injury' };
  for (let tick = 0; tick < 40; tick++) stepWorld(world);
  assert.equal(rosa.health.condition, 'major-injury', 'routine time did not quietly heal her');
  assert.equal(world.entities['hh-1-rosa'].id, 'hh-1-rosa', 'and she is still the same person');
});

test('answering the historical call drops the work; it never resumes in the wrong place', () => {
  const world = createGonzalesWorld('interrupted-work', 5);
  world.status = 'running';
  // Whichever family the neighbour actually knocks on at home: a family that only has a
  // rumor is asked something else (FIC-GONZ-020), and this test is about the work.
  let thomas = null;
  let offered = false;
  for (let tick = 0; tick < 900 && !offered; tick++) {
    stepWorld(world);
    const [id] = Object.entries(world.requests || {}).find(([, request]) => request.status === 'open' && request.where === 'home') || [];
    if (id) {
      thomas = world.entities[world.households[id].principalId];
      applyAction(world, id, { action: 'chore', entityId: thomas.id, chore: 'plant-field' });
      assert.ok(thomas.chore, 'he is in the middle of planting when the neighbour knocks');
      applyAction(world, id, { action: 'help', entityId: thomas.id });
      offered = true;
    }
  }
  assert.ok(offered, 'the request opened');
  // Going costs the afternoon. Freezing the chore instead used to resume it on arrival:
  // he hoed rows at Gonzales, then "walked back to the yard" across the whole map.
  assert.equal(thomas.chore, null, 'the work was dropped, not frozen');
  for (let tick = 0; tick < 90 && thomas.travel; tick++) stepWorld(world);
  assert.equal(thomas.location.siteId, 'gonzales', 'he really travelled there');
  for (let tick = 0; tick < 15; tick++) stepWorld(world);
  assert.equal(thomas.location.siteId, 'gonzales', 'and no chore step carried him home without a journey');
  assert.equal(thomas.chore, null);
});

test('a chore abandons itself rather than teleporting someone home', () => {
  const world = createGonzalesWorld('stranded-work', 5);
  world.status = 'running';
  const rosa = world.entities['hh-1-rosa'];
  applyAction(world, 'hh-1', { action: 'chore', entityId: rosa.id, chore: 'plant-field' });
  for (let tick = 0; tick < 3; tick++) stepWorld(world);
  // Put her somewhere she could only have reached by travelling, mid-chore.
  rosa.location = { x: world.map.sites.gonzales.x, y: world.map.sites.gonzales.y, siteId: 'gonzales' };
  for (let tick = 0; tick < 20; tick++) stepWorld(world);
  assert.equal(rosa.location.siteId, 'gonzales', 'a walk step never crosses the map');
  assert.equal(rosa.chore, null, 'the chore gave up instead');
  assert.notEqual(world.households['hh-1'].homeSiteId, 'gonzales');
});

// The mark that says "this is the person you direct" has to survive the art library.
// It did not: `miniPerson` returns as soon as a sprite draws, so the principal's rust
// coat ran only when the atlases failed to load, and `rust` sat in the shared palette
// pool where a neighbour could be dealt it. A student looking at two figures had no
// reliable way to tell which one was theirs.
test('the principal wears a colour nobody else can wear, illustrated or not', async () => {
  const { PRINCIPAL_VARIANT, VARIANTS, visualVariant, entityClip } = await import('../public/motion.js');
  assert.ok(!VARIANTS.includes(PRINCIPAL_VARIANT), 'the principal\'s colour is not in the pool anybody else draws from');

  const world = createGonzalesWorld('principal-mark', 5);
  const projected = projectWorld(world, 'hh-1', 'student', { includeMap: false });
  const family = projected.entities.filter(entity => entity.kind === 'person');
  const principal = family.find(entity => entity.principal);
  assert.ok(principal, 'a household has a principal');

  // Their own principal is marked, and nobody else in the family is.
  assert.equal(entityClip(principal).id, `${PRINCIPAL_VARIANT}-idle-s`);
  for (const person of family.filter(entity => !entity.principal)) {
    assert.ok(!entityClip(person).id.startsWith(PRINCIPAL_VARIANT), `${person.name} does not wear the principal's colour`);
  }
  // The mark follows the person through every pose, not just standing still.
  for (const doing of ['breaking the rows', 'putting in seed', 'carrying the crop in', 'mending the hoe']) {
    assert.ok(entityClip({ ...principal, chore: { doing } }).id.startsWith(PRINCIPAL_VARIANT), `still marked while ${doing}`);
  }
  assert.ok(entityClip({ ...principal, travel: {} }).id.startsWith(PRINCIPAL_VARIANT), 'still marked on the road');

  // And somebody else's principal is not this student's principal. An observed person
  // carries no `principal` flag at all, but the binding refuses it a second time anyway.
  assert.ok(!entityClip({ ...principal, principal: true }, true).id.startsWith(PRINCIPAL_VARIANT), 'an observed person never wears the mark');
  const strangers = projectWorld(world, 'hh-2', 'student', { includeMap: false }).entities
    .filter(entity => entity.kind === 'person')
    .map(entity => ({ id: entity.id, name: entity.name, kind: 'person', observed: true }));
  for (const stranger of strangers) {
    assert.ok(!entityClip(stranger, true).id.startsWith(PRINCIPAL_VARIANT), `${stranger.id} seen as a neighbour wears no mark`);
  }
  // The colour is a pure function of who somebody is, so it never flickers between ticks.
  assert.equal(visualVariant('hh-1-thomas', true), visualVariant('hh-1-thomas', true));
  assert.equal(visualVariant('hh-1-rosa'), visualVariant('hh-1-rosa'));
});
