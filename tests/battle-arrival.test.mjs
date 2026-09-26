// Arriving in time, and taking part (docs/BATTLES.md §2.6).
//
// Owner, 2026-09-25: "if they sent a character, it needs to happen in such a way that their character arrives in time to
// participate and does participate." Before this, a family's man who set out upriver could be "still walking" when it
// happened, and the journal said "set out upriver and got there too late". Every path that led there is held here:
//   - answering the call late: it is only put, and only answered, while a walk still reaches the men before first light;
//   - reaching town too late to catch them: told so, never asked;
//   - the river over the ford: the men got over that night, and so does whoever went with them;
//   - being sent somewhere else from the line: refused, in words, by hand and by auto, until they come back with the men;
//   - a Host's time jump: it stops at the fight and never passes it.
// The date of the fight never moves for anybody (`HIST-GONZ-003`).
import test from 'node:test';
import assert from 'node:assert/strict';
import { applyAction, stepWorld, validateWorld } from '../sim/world.mjs';
import { CAMP_SITE, marchCloses } from '../sim/directors.mjs';
import { battleState } from '../sim/battle-stage.mjs';
import { resolveTimeJump } from '../sim/time.mjs';
import { weatherOn, dayOf, WATER_SHUT } from '../sim/weather.mjs';
import { gonzalesClass, gonzalesFamilies, principalOf, stepUntil, TIMELINE, momentOf } from './support/battle.mjs';

/** Answer the upriver call at `when` (a minute), on `mode`, and run to the dawn skirmish. */
function answerAt(seed, when, { map, mode = 'foot' } = {}) {
  const again = gonzalesClass(seed, { map, players: 5, fighters: 'first' });
  const id = gonzalesFamilies(again)[0];
  stepUntil(again, () => again.minute >= when(again) - 20 && again.marches[id]?.status === 'open');
  const person = principalOf(again, id);
  applyAction(again, id, { action: 'go-upriver', entityId: person.id, mode });
  const answeredAt = again.minute;
  stepUntil(again, () => again.minute >= TIMELINE.approach);
  return { world: again, id, person, answeredAt };
}

test('answered at any time the call is open - even the last minute, on foot or on the horse - the man is with the men before first light, and fights', () => {
  const runs = [];
  for (const map of [undefined, 'colonies']) {
    for (const mode of ['foot', 'horse']) {
      for (const share of [0, 0.5, 1]) {
        const label = `${map || 'invented'} ${mode} at ${share}`;
        const when = world => momentOf(world, 'upriver-call') + Math.round((marchCloses(world) - momentOf(world, 'upriver-call')) * share);
        let run;
        try { run = answerAt(`arrive-${map || 'inv'}-${mode}-${share}`, when, { map, mode }); } catch (error) {
          // A family with no horse is refused the horse on the control, and that is a valid refusal, not a late arrival.
          if (mode === 'horse' && /horse/i.test(error.message)) continue;
          throw error;
        }
        const { world, id, person, answeredAt } = run;
        assert.ok(answeredAt <= marchCloses(world), `${label}: answered at ${answeredAt}, after the call shut at ${marchCloses(world)}`);
        assert.equal(person.location.siteId, CAMP_SITE, `${label}: at first light the man was not with the men (${JSON.stringify(person.location)} ${person.travel ? 'still on the road' : ''})`);
        assert.equal(person.travel, null, `${label}: still walking at first light`);
        const entry = world.battles.gonzales.participants[person.id];
        assert.ok(entry && entry.joined < TIMELINE.approach, `${label}: not recorded with the men before first light`);
        // And he takes part: in the line while it fires.
        stepUntil(world, () => world.minute >= TIMELINE.approach + 10);
        assert.ok(Number.isFinite(world.battles.gonzales.participants[person.id].fought), `${label}: never in the line while it fired`);
        stepUntil(world, () => world.minute >= TIMELINE.resolved + 1);
        assert.equal(world.participation.gonzales[person.id].role, 'fought', label);
        const memories = world.households[id].memories.map(eventId => world.events.find(event => event.id === eventId).text);
        assert.ok(!memories.some(text => /too late/.test(text)), `${label}: ${memories.join(' | ')}`);
        validateWorld(world);
        runs.push(`${map || 'invented'} ${share} ${mode}`);
      }
    }
  }
  assert.equal(runs.filter(run => run.endsWith('foot')).length, 6, `only these ran: ${runs.join(', ')}`);
});

test('once the call shuts it cannot be answered, and a family reaching town too late to catch the men is told so and never asked', () => {
  const world = gonzalesClass('arrive-shut', { fighters: ['hh-1'] });
  const person = principalOf(world, 'hh-1');
  stepUntil(world, () => world.marches['hh-1']?.status === 'open');
  const closes = world.marches['hh-1'].closes;
  assert.ok(closes < TIMELINE.approach && closes > TIMELINE.crossing, `the call shuts at ${closes}`);
  stepUntil(world, () => world.minute > closes);
  assert.throws(() => applyAction(world, 'hh-1', { action: 'go-upriver', entityId: person.id, mode: 'foot' }), /Nobody is asking|too far up the river/);
  assert.equal(world.marches['hh-1'].status, 'expired');
  assert.equal(person.location.siteId, 'gonzales', 'somebody who did not answer was moved anyway');
  // Reaching town after it shut: told, never asked.
  const late = gonzalesClass('arrive-late', { fighters: ['hh-1'] });
  const man = principalOf(late, 'hh-1');
  man.location = { ...late.map.sites[late.households['hh-1'].homeSiteId], siteId: late.households['hh-1'].homeSiteId };
  stepUntil(late, () => late.minute > marchCloses(late));
  man.location = { ...late.map.sites.gonzales, siteId: 'gonzales' };
  stepWorld(late);
  assert.equal(late.marches['hh-1']?.status, 'missed');
  assert.match(late.marches['hh-1'].text, /too far up the river/);
  assert.ok(!late.events.some(event => event.type === 'pressure' && event.claimId === 'FIC-GONZ-011' && event.householdId === 'hh-1'), 'the family was asked anyway');
});

test('the river over the ford does not hold somebody going with the men: they crossed that night, and so does he', () => {
  const world = gonzalesClass('arrive-flood', { fighters: ['hh-1'] });
  stepUntil(world, () => world.marches['hh-1']?.status === 'open');
  // Every country's river over its fords for the night and the day of the fight.
  for (let day = dayOf(world.minute); day <= dayOf(TIMELINE.finish); day++) for (const region of Object.values(weatherOn(world, day).regions)) region.water = Math.max(region.water, WATER_SHUT + 0.05);
  const person = principalOf(world, 'hh-1');
  applyAction(world, 'hh-1', { action: 'go-upriver', entityId: person.id, mode: 'foot' });
  assert.ok(person.travel.withForce, 'the journey up the river is not the men\'s crossing');
  stepUntil(world, () => world.minute >= TIMELINE.approach);
  assert.equal(person.location.siteId, CAMP_SITE, 'the man was held at the ford while the men went on');
  assert.ok(!world.events.some(event => event.actorId === person.id && /Nobody is fording it/.test(event.text)), 'the ford was shut in his face');
});

test('nobody with the men can be sent anywhere else until they come back with them', () => {
  const world = gonzalesClass('arrive-held', { fighters: ['hh-1'] });
  stepUntil(world, () => world.marches['hh-1']?.status === 'open');
  const person = principalOf(world, 'hh-1');
  applyAction(world, 'hh-1', { action: 'go-upriver', entityId: person.id, mode: 'foot' });
  stepUntil(world, () => person.location.siteId === CAMP_SITE && !person.travel && world.battles.gonzales.participants[person.id]);
  const home = world.households['hh-1'].homeSiteId;
  assert.throws(() => applyAction(world, 'hh-1', { action: 'travel', entityId: person.id, destination: home, mode: 'foot' }), /with the men facing the Mexican camp/);
  assert.throws(() => applyAction(world, 'hh-1', { action: 'travel', entityId: person.id, destination: 'gonzales', mode: 'foot' }), /with the men facing the Mexican camp/);
  // On auto the switch is still theirs, and nothing takes them out of the line: no work is offered off the family's land
  // (sim/chores.mjs), and sim/auto.mjs would pass over somebody held even if there were.
  applyAction(world, 'hh-1', { action: 'set-auto', entityId: person.id, auto: true });
  stepUntil(world, () => world.minute >= TIMELINE.exchange);
  assert.equal(person.location.siteId, CAMP_SITE, 'auto took the man out of the line');
  assert.equal(person.travel, null);
  // Once the men leave the field, they go back to Gonzales with them.
  stepUntil(world, () => battleState(world, 'gonzales').phase.id === 'home' && person.travel);
  assert.equal(person.travel?.to, 'gonzales');
});

test('a Host\'s time jump stops at the fight and never passes it', () => {
  const world = gonzalesClass('arrive-jump', { fighters: ['hh-1'] });
  stepUntil(world, () => world.minute >= TIMELINE.crossing - 60);
  const before = resolveTimeJump(world, 24 * 60);
  assert.ok(world.minute <= TIMELINE.crossing, `the jump ran to ${world.minute}, past the start of the fight at ${TIMELINE.crossing}`);
  assert.match(before.blockedBy || '', /gonzales|battle/);
  stepUntil(world, () => battleState(world, 'gonzales')?.live);
  const during = resolveTimeJump(world, 6 * 60);
  assert.equal(during.advancedMinutes, 0);
  assert.equal(during.blockedBy, 'battle:gonzales');
});
