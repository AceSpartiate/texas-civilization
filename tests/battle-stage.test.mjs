// The one battle engine (sim/battle-stage.mjs) and the fight at Gonzales on it (sim/battles/gonzales.mjs; docs/BATTLES.md).
//
// What it holds: an engagement is data checked when it loads (the talk rules, the steps, who may fall); where the fight is
// is read off the clock, so a class saved in the middle of it reopens in the middle and an old save with no record of it
// opens with none; the clock is held for the fighting to three to six real minutes at the Study pace and never runs faster;
// and a page is sent nothing that has not happened yet.
import test from 'node:test';
import assert from 'node:assert/strict';
import { stepWorld, validateWorld, applyAction } from '../sim/world.mjs';
import { calendarMinutes, CALENDAR_SCALE } from '../sim/clock.mjs';
import { ENGAGEMENTS, BATTLE_STEPS, battleState, checkEngagement, projectBattle, schedule } from '../sim/battle-stage.mjs';
import { GONZALES } from '../sim/battles/gonzales.mjs';
import { PACES } from '../server/app.mjs';
import { CALENDAR_STEPS } from '../public/motion.js';
import { gonzalesClass, principalOf, stepUntil, TIMELINE } from './support/battle.mjs';

const phaseOf = world => battleState(world, 'gonzales')?.phase?.id;
const copy = value => JSON.parse(JSON.stringify(value));

test('an engagement is checked when it loads: documented words carry a claim, a named man speaks nothing reconstructed, nobody falls who may not', () => {
  assert.ok(ENGAGEMENTS.gonzales, 'Gonzales is not on the engine');
  checkEngagement(GONZALES);
  const bad = change => { const def = copy(GONZALES); def.ground = GONZALES.ground; change(def); return () => checkEngagement(def); };
  const parley = def => def.phases.find(phase => phase.id === 'parley');
  assert.throws(bad(def => { delete parley(def).lines.find(line => line.kind === 'documented').claimId; }), /carries no claim/);
  assert.throws(bad(def => { const line = parley(def).lines.find(one => one.kind === 'reconstructed'); line.name = 'Castañeda'; }), /named person/);
  assert.throws(bad(def => { def.phases[0].step = 7; }), /step must divide/);
  assert.throws(bad(def => { def.phases.find(phase => phase.id === 'dawn-skirmish').falls.push({ side: 'texian', count: 1, at: 5, claimId: 'HIST-TEX-477' }); }), /may not be drawn falling/);
  assert.throws(bad(def => { def.sides.texian.drawn = 200; }), /at most 60/);
  // Every named speaker at Gonzales speaks only documented words, each with its claim.
  for (const line of GONZALES.phases.flatMap(phase => phase.lines || [])) {
    if (line.name) { assert.equal(line.kind, 'documented', `${line.name} speaks a ${line.kind} line`); assert.match(line.claimId, /^HIST-/); }
    assert.doesNotMatch(line.text, /come and take it|give 'em hell/i, 'a disputed slogan is spoken');
  }
  // No Texian is ever put down at Gonzales (`FIC-GONZ-005`, `HIST-TEX-477`).
  assert.deepEqual(GONZALES.noFalling, ['texian']);
});

test('the fight stands on the director\'s clock: its phases date the old moments, and nothing moves the day', () => {
  const phases = schedule(GONZALES, TIMELINE.crossing);
  const at = id => phases.find(phase => phase.id === id).from;
  assert.equal(TIMELINE.approach, at('dawn-skirmish'));
  assert.equal(TIMELINE.exchange, at('fight'));
  assert.equal(TIMELINE.withdrawal, at('withdrawal'));
  assert.equal(TIMELINE.resolved, at('field'));
  // All on October 2, 1835, from the night of the 1st: the crossing about ten, contact about three, the fight about nine.
  const world = gonzalesClass('battle-clock');
  const hour = minute => { const date = new Date(Date.UTC(1835, 8, 28, 6) + minute * 60000); return `${date.getUTCMonth() + 1}/${date.getUTCDate()} ${date.getUTCHours()}:${String(date.getUTCMinutes()).padStart(2, '0')}`; };
  assert.equal(world.director.arrival, true);
  assert.equal(hour(at('rendezvous')), '10/1 22:00');
  assert.equal(hour(at('contact')), '10/2 3:00');
  assert.equal(hour(at('dawn-skirmish')), '10/2 5:40');
  assert.equal(hour(at('parley')), '10/2 8:00');
  assert.equal(hour(at('fight')), '10/2 8:40');
  assert.equal(hour(phases.at(-1).to), '10/2 14:00');
});

test('a class saved in the middle of the fight reopens in the middle of it, and an old save with no record of it gains one from the clock', () => {
  const world = gonzalesClass('battle-save', { fighters: ['hh-1'] });
  stepUntil(world, () => world.marches['hh-1']?.status === 'open');
  applyAction(world, 'hh-1', { action: 'go-upriver', entityId: principalOf(world, 'hh-1').id, mode: 'foot' });
  stepUntil(world, () => phaseOf(world) === 'parley');
  // Saved as the server saves it (JSON), and reloaded: the same phase, the same place, the same view.
  const saved = copy(world);
  validateWorld(saved);
  assert.deepEqual(projectBattle(saved, 'gonzales', { members: [] }), projectBattle(world, 'gonzales', { members: [] }));
  stepWorld(world); stepWorld(saved);
  assert.equal(phaseOf(saved), phaseOf(world));
  assert.deepEqual(saved.battles, world.battles);
  // A class saved before the engine: no `world.battles` at all. It opens, and the next tick gives it the fight where the
  // clock says it is, with nobody recorded in it who was not - the correct empty value, and no save version moves.
  const old = copy(world);
  delete old.battles;
  validateWorld(old);
  stepWorld(old);
  // Its first tick is the class's ordinary one (the record is made during it), so it is compared at its own minute.
  assert.equal(phaseOf(old), battleState(world, 'gonzales', old.minute).phase.id);
  assert.ok(old.battles.gonzales.participants, 'the old save gained no record to keep');
  assert.equal(copy(old).saveVersion, copy(world).saveVersion);
});

test('the fighting plays three to six real minutes at the Study pace on both maps, and the clock never runs faster for it', () => {
  for (const map of [undefined, 'colonies']) {
    const world = gonzalesClass(`battle-pace-${map || 'invented'}`, { map });
    stepUntil(world, () => world.minute >= TIMELINE.approach);
    let ticks = 0, faster = [];
    while (world.minute < TIMELINE.resolved) {
      const proposed = world.map.source ? (world.director.phase === 'news' ? CALENDAR_SCALE.news : CALENDAR_SCALE[world.director.phase] || 20) : 20;
      const step = calendarMinutes(world);
      if (step > proposed) faster.push({ minute: world.minute, step, proposed });
      stepWorld(world); ticks++;
    }
    assert.deepEqual(faster, [], `${map || 'invented'}: the fight ran the clock faster than it was going`);
    const real = pace => ticks * PACES[pace] / 1000;
    assert.ok(real('study') >= 180 && real('study') <= 360, `${map || 'invented'}: the fighting took ${ticks} ticks, ${real('study')} real seconds at the Study pace`);
    // Brisk and Quick shorten it in proportion, since it is counted in ticks.
    assert.ok(real('brisk') < real('study') && real('quick') < real('brisk'));
    // Every step it takes is one the page draws as a walk, not a jump: a divisor of twenty minutes or one of the other clocks'
    // whole hours (Coleto's night and march, 2026-09-25), each in public/motion.js `CALENDAR_STEPS`.
    assert.ok(BATTLE_STEPS.every(step => CALENDAR_STEPS.includes(step) && (20 % step === 0 || [60, 240].includes(step))), `${BATTLE_STEPS}`);
  }
});

test('a page is sent nothing that has not happened yet: no later line, shot, fall or phase', () => {
  const world = gonzalesClass('battle-future', { fighters: ['hh-1'] });
  stepUntil(world, () => world.minute >= TIMELINE.crossing);
  const seen = new Set();
  while (world.minute < TIMELINE.resolved) {
    stepWorld(world);
    const view = projectBattle(world, 'gonzales', { members: [] });
    if (!view) continue;
    seen.add(view.phase);
    for (const line of view.lines) assert.ok(line.minute <= world.minute, `a line from ${line.minute} was sent at ${world.minute}`);
    for (const shot of view.cannon?.shots || []) assert.ok(shot <= world.minute, `a shot from ${shot} was sent at ${world.minute}`);
    for (const fall of view.fallen) assert.ok(fall.minute <= world.minute, `a fall at ${fall.minute} was sent at ${world.minute}`);
    const text = JSON.stringify(view);
    assert.doesNotMatch(text, /"phases"|"participants"|"outcome"/, 'the schedule, the record or the outcome went on the wire');
    for (const phase of GONZALES.phases.filter(one => one.id !== view.phase)) assert.ok(!text.includes(phase.caption), `the caption of ${phase.id} was sent during ${view.phase}`);
  }
  assert.ok(['rendezvous', 'approach', 'contact', 'wait', 'dawn-skirmish', 'lull', 'parley', 'fight', 'withdrawal'].every(id => seen.has(id)), [...seen].join(' '));
  // The Mexican loss is the record's disputed one: one man hit at dawn, led off wounded, and no Texian down at any moment.
  const fallen = projectBattle(world, 'gonzales', { members: [] }).fallen;
  assert.deepEqual(fallen.map(fall => [fall.side, fall.count, fall.wounded]), [['mexican', 1, true]]);
});
