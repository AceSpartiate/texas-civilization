// How fast men are seen to move in a fight, at every pace (owner, 2026-09-30, having played at Study: "i was playing on study earlier
// and it was too fast"; told Study already gave Gonzales about five minutes, "i think you're correct about speed"; docs/BATTLES.md
// §16.1, sim/battle-stage.mjs `MOTION_CAP`, `motionFloorMs`).
//
// A tick's movement is drawn across the whole tick, so a short tick makes a run of a walk. On the colonies map, every tick of every
// fight's fighting, at Study, Brisk and Quick, with the tick as long as the server makes it (the pace, the fight's floor, and the
// movement's own): nobody on foot faster than a quick march, nobody on a horse faster than a canter.
import test from 'node:test';
import assert from 'node:assert/strict';
import { ENGAGEMENTS, MOTION_CAP, battleTickFloorMs, fightingPhase, motionFloorMs, placeOf, schedule } from '../sim/battle-stage.mjs';
import { PERSON_MILES } from '../sim/house-footprint.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { PACES } from '../server/app.mjs';

test('nobody in a fight is drawn moving faster than a quick march on foot or a canter on a horse, at any pace', () => {
  const world = createGonzalesWorld('motion-cap', 5, { map: 'colonies' });
  let ticks = 0;
  for (const def of Object.values(ENGAGEMENTS)) {
    const ground = def.ground(world);
    if (!ground) continue;
    const start = 100000;
    for (const phase of schedule(def, start).filter(fightingPhase)) {
      for (let into = 0; into < phase.minutes; into += phase.step) {
        const probe = { ...world, minute: phase.from + into, battles: { [def.id]: { id: def.id, start, participants: {}, alerted: {}, told: {}, heard: {} } } };
        const floor = battleTickFloorMs(probe) || 0;
        const sideMounted = side => Boolean(phase[side].mounted ?? def.sides[side].mounted) || phase[side].style === 'mounted';
        const walkers = [
          ...['texian', 'mexican'].map(side => [phase[side], sideMounted(side)]),
          ...['texian', 'mexican'].flatMap(side => (phase[side].parts || []).map(part => [part, sideMounted(side) || part.style === 'mounted'])),
          ...(phase.groups || []).map(group => [group, Boolean(group.mounted) || group.style === 'mounted' || group.figure === 'rider']),
          ...(phase.people || []).filter(entry => !entry.with).map(entry => [entry, ['ride', 'rideIdle'].includes(entry.pose)]),
        ];
        for (const [spec, mounted] of walkers) {
          let miles = 0, was = null;
          for (let i = 0; i <= 6; i++) {
            let at; try { at = placeOf(ground, spec, phase.minutes, Math.min(phase.minutes, into + phase.step * i / 6)); } catch { at = null; }
            if (at && was) miles += Math.hypot(at.x - was.x, at.y - was.y);
            was = at;
          }
          for (const [pace, ms] of Object.entries(PACES)) {
            const speed = miles / PERSON_MILES / (Math.max(ms, floor) / 1000), cap = mounted ? MOTION_CAP.mounted : MOTION_CAP.foot;
            assert.ok(speed <= cap * 1.02, `${def.id} ${phase.id} +${into}: ${spec.id || 'a side'} drawn at ${speed.toFixed(2)} body lengths a second at ${pace} (cap ${cap})`);
          }
        }
        ticks++;
      }
    }
  }
  assert.ok(ticks > 300, `only ${ticks} ticks of fighting were looked at`);
  const ground = ENGAGEMENTS.gonzales.ground(world), dawn = ENGAGEMENTS.gonzales.phases.find(phase => phase.id === 'dawn-skirmish');
  assert.ok(motionFloorMs(ENGAGEMENTS.gonzales, ground, dawn, 16, 5) > 0, 'the dragoons\' charge was not seen to move');
  // The figure's height the engine reckons with is the page's own.
  assert.equal(PERSON_MILES, 0.019);
});
