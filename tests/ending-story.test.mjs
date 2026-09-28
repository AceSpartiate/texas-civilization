// The ending's words about the spring, the war's prisoners and the class's own debrief (sim/ending-story.mjs; the design audit
// of 2026-09-28, S24, S25 and S27; docs/FLASHBACK.md §8).
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { record } from '../sim/events.mjs';
import { establishTruth, learn } from '../sim/knowledge.mjs';
import { classHooks, flightLine, nobodyWentLine, warPrisoners } from '../sim/ending-story.mjs';
import { familyEnding, hostEnding } from '../sim/ending.mjs';
import { VIRTUE_WORDS } from '../sim/flashback.mjs';

const world = () => createGonzalesWorld('ending-story', 5);

test('the spring is said as it was: stayed or went, burned or standing, home or on the road (S25)', () => {
  const w = world(), household = w.households['hh-1'];
  const flight = extra => { household.flight = { orderedMinute: 100, ...extra }; return flightLine(w, household); };
  assert.equal(flightLine(w, { ...household, flight: undefined }), null);
  assert.match(flight({ status: 'home', refuge: 'gonzales', leftMinute: 200, homeMinute: 900 }), /never burned\. They came home to the house standing\./);
  assert.match(flight({ status: 'home', refuge: 'gonzales', leftMinute: 200, burned: 400, burnedBy: { hand: 'mexican', name: 'Urrea’s column' }, homeMinute: 900 }), /foragers of Urrea’s column burned the farm.*came home to the ashes/);
  assert.match(flight({ status: 'home', leftMinute: 200, burned: 400 }), /the Texas army burned the farm/);
  assert.match(flight({ status: 'returning', refuge: 'gonzales', leftMinute: 200 }), /on the road home/);
  assert.match(flight({ status: 'stayed', stayedMinute: 150 }), /stayed on the farm\. The Mexican army never came that way, and the house stands\./);
  assert.match(flight({ status: 'stayed', burned: 400, burnedBy: { hand: 'mexican', name: 'Sesma’s column' } }), /stayed on the farm\. On .* foragers of Sesma’s column burned it\./);
  // The old wrong line: a farm that never burned is never said to be burned.
  for (const status of ['home', 'returning', 'refuged', 'fled']) assert.doesNotMatch(flight({ status, leftMinute: 200 }), /burned farm|ashes|burned the farm/);
  // Nobody sent, and gone east: the family did not stay with the land.
  household.flight = { status: 'home', leftMinute: 200 };
  assert.doesNotMatch(nobodyWentLine(household), /stayed with the land/);
  household.flight = undefined;
  assert.match(nobodyWentLine(household), /stayed with the land/);
});

test('somebody taken prisoner in the war is named at the ending, with where and what the record says, and is not weighed (S27)', () => {
  const w = world(), household = w.households['hh-2'];
  const man = w.entities[household.principalId];
  Object.assign(man, { health: { condition: 'captured' }, service: { kind: 'matamoros', status: 'captured' } });
  record(w, 'consequence', { householdId: household.id, actorId: man.id, importance: 3, claimId: 'HIST-TEX-059', text: `${man.name} was taken prisoner at Agua Dulce Creek and marched to Matamoros.` });
  const [one] = warPrisoners(w, household);
  assert.equal(one.personId, man.id);
  assert.match(one.text, new RegExp(`^${man.name} was taken prisoner by the Mexican army at Agua Dulce Creek`));
  assert.match(one.text, /marched to Matamoros/);
  w.status = 'ended';
  const ending = familyEnding(w, household.id);
  assert.ok(ending.story.includes(one.text), 'the war\'s prisoner is not in the family\'s story');
  assert.deepEqual(ending.prisoners, [], 'the war\'s prisoner was weighed with the Scrape\'s');
});

test('the debrief begins with this class\'s own story, named, asking why (S24)', () => {
  const w = world();
  const [a, b] = [w.households['hh-1'], w.households['hh-2']];
  a.played = true; b.played = true;
  establishTruth(w, { id: 'alamo-fall', text: 'The Alamo has fallen.' });
  w.minute = 1000; learn(w, 'hh-1', 'alamo-fall', { source: 'test' });
  w.minute = 1000 + 6 * 1440; learn(w, 'hh-2', 'alamo-fall', { source: 'test' });
  a.flight = { status: 'home', orderedMinute: 900, leftMinute: 950, settlementId: a.settlementId };
  b.flight = { status: 'stayed', orderedMinute: 900, stayedMinute: 960 };
  w.glory = { 'hh-1': { total: 5, awards: { [`gathering:${a.principalId}`]: { event: 'gathering', role: 'present', points: 5 } } } };
  const hooks = classHooks(w);
  assert.equal(hooks.length, 3, JSON.stringify(hooks));
  assert.match(hooks[0], /heard that the Alamo had fallen on .*; .* not until .*\. Why/);
  assert.match(hooks[1], /fled east when told to leave; .* stayed\. What did each know/);
  assert.match(hooks[2], /sent somebody to the war; .* sent nobody\. How did that choice change/);
  for (const hook of hooks) for (const word of VIRTUE_WORDS) assert.doesNotMatch(hook, new RegExp(`\\b${word}\\b`, 'i'));
  w.status = 'ended';
  assert.deepEqual(hostEnding(w).discussion.slice(0, 3), hooks, 'the Host\'s debrief does not begin with the class\'s own hooks');
});
