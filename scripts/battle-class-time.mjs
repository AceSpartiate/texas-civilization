// How much class time the battles add, and whether a whole class still runs to the ending (docs/BATTLES.md §2.2).
//
// Plays a whole class of families nobody plays - every family run by sim/neighbours.mjs, as scripts/balance-study.mjs does -
// through all three periods to the ending, and at every tick asks what the clock would have carried with no fight holding it
// (the same class with every engagement's record blanked for that one question). A tick the fights held is counted to the fight
// that held it; the ticks it added are the held ticks less the ticks the same calendar minutes would have taken unheld. Real
// time is ticks at the Study pace (server/app.mjs `PACES`). Nobody plays, so a fight's `background` pace - held only while a
// played, present family has somebody in it (Béxar between its episodes, the Alamo's siege days) - is not in these numbers;
// the builders' own measurements of it are in docs/BATTLES.md §7.3 and §9.3.
//
// Run: node scripts/battle-class-time.mjs [families...]   (default 5 15) -> docs/evidence/battle-class-time.json
import { writeFileSync, mkdirSync } from 'node:fs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { stepWorld, validateWorld } from '../sim/world.mjs';
import { beginSecondPeriod, beginThirdPeriod } from '../sim/periods.mjs';
import { calendarMinutes } from '../sim/clock.mjs';
import { ENGAGEMENTS, liveBattles, battleState } from '../sim/battle-stage.mjs';
import { hostEnding } from '../sim/ending.mjs';
import { PACES } from '../server/app.mjs';

const sizes = process.argv.slice(2).map(Number).filter(Boolean);
const BLANK = Object.fromEntries(Object.keys(ENGAGEMENTS).map(id => [id, { id, start: NaN }]));
/** What the clock would carry this tick with no fight holding it. */
function unheld(world) {
  const battles = world.battles;
  world.battles = BLANK;
  try { return calendarMinutes(world); } finally { world.battles = battles; }
}
/** The fight holding this tick: one being fought, else the next to start. */
function holder(world) {
  const live = liveBattles(world);
  if (live.length) return live.map(state => state.battle.id).sort().join('+');
  const next = Object.keys(world.battles || {}).map(id => battleState(world, id)).filter(state => state?.before).sort((a, b) => a.battle.start - b.battle.start)[0];
  return next?.battle.id || 'none';
}

function runClass(families) {
  const started = Date.now();
  const world = createGonzalesWorld(`class-time-${families}`, families, { map: 'colonies', neighbours: true });
  world.status = 'running';
  const byFight = {}, periods = [];
  const run = period => {
    const from = world.tick;
    for (let t = 0; t < 20000 && !world.director.complete && world.status === 'running'; t++) {
      const step = calendarMinutes(world), free = unheld(world);
      if (step < free) {
        const id = holder(world), one = byFight[id] ||= { heldTicks: 0, minutes: 0, unheldTicks: 0 };
        one.heldTicks++; one.minutes += step; one.unheldTicks += step / free;
      }
      stepWorld(world);
      if (world.tick % 200 === 0) validateWorld(world);
    }
    periods.push({ period, ticks: world.tick - from, complete: Boolean(world.director.complete) });
  };
  run(1);
  beginSecondPeriod(world); world.status = 'running'; run(2);
  beginThirdPeriod(world); world.status = 'running'; run(3);
  validateWorld(world);
  const ending = hostEnding(world);
  const study = ticks => +(ticks * PACES.study / 60000).toFixed(1);
  const fights = Object.fromEntries(Object.entries(byFight).map(([id, one]) => [id, {
    heldTicks: one.heldTicks, calendarMinutes: one.minutes, addedTicks: +(one.heldTicks - one.unheldTicks).toFixed(1), addedStudyMinutes: study(one.heldTicks - one.unheldTicks),
  }]));
  const added = Object.values(fights).reduce((sum, one) => sum + one.addedTicks, 0);
  return {
    families, ticks: world.tick, studyMinutes: study(world.tick), periods, reachedEnding: Boolean(ending?.families?.length) && periods.every(p => p.complete),
    endingFamilies: ending?.families?.length ?? 0, fights, addedTicks: +added.toFixed(1), addedStudyMinutes: study(added),
    engagementsArmed: Object.keys(world.battles || {}), secondsToRun: Math.round((Date.now() - started) / 1000),
  };
}

const classes = [];
for (const families of sizes.length ? sizes : [5, 15]) {
  const one = runClass(families);
  classes.push(one);
  console.log(`${families} families: ${one.ticks} ticks (${one.studyMinutes} min at Study), periods ${one.periods.map(p => `${p.period}:${p.ticks}${p.complete ? '' : ' INCOMPLETE'}`).join(' ')}, ending ${one.reachedEnding ? 'reached' : 'NOT reached'}; battles added ${one.addedTicks} ticks = ${one.addedStudyMinutes} min at Study (${one.secondsToRun} s to run)`);
  for (const [id, fight] of Object.entries(one.fights)) console.log(`  ${id}: held ${fight.heldTicks} ticks, +${fight.addedTicks} ticks, +${fight.addedStudyMinutes} min`);
}
mkdirSync('docs/evidence', { recursive: true });
writeFileSync('docs/evidence/battle-class-time.json', `${JSON.stringify({ record: 'battle-class-time', date: new Date().toISOString().slice(0, 10), pace: { study: PACES.study }, classes }, null, 2)}\n`.replace(/\n/g, '\r\n'));
