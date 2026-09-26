// How much class time the battles add, and whether a whole class still runs to the ending (docs/BATTLES.md §2.2, §2b.11).
//
// Plays a whole class of families nobody plays - every family run by sim/neighbours.mjs, as scripts/balance-study.mjs does -
// through all three periods to the ending, and at every tick asks what the clock would have carried with no fight holding it
// (the same class with every engagement's record blanked for that one question). A tick the fights held is counted to the fight
// that held it; the ticks it added are the held ticks less the ticks the same calendar minutes would have taken unheld. Real
// time is ticks at the Study pace (server/app.mjs `PACES`).
//
// Each class is run twice:
//   nobody - as it is: no family is played, so a fight's quiet phases (`quiet`: its lead-up and aftermath) and its `background`
//            pace go at the class's own pace, and only its fighting is held.
//   there  - the same class with a played, present family's man in every fight *for the fights' clock alone* (`battleStep` is
//            asked with one living person put in every engagement's record as a participant and his family counted played; the
//            directors, the neighbours and every other clock rule still see the class as it is). So every fight is held as a
//            watched fight is: its quiet phases at their steps and its background pace (Béxar between its episodes, the Alamo's
//            siege days). This is every lead-up held, as it was for every class before 2026-09-26. `familiesThere` counts the
//            people the neighbours really sent into each force.
//
// Run: node scripts/battle-class-time.mjs [families...]   (default 5 15) -> docs/evidence/battle-class-time.json
import { writeFileSync, mkdirSync } from 'node:fs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { stepWorld, validateWorld } from '../sim/world.mjs';
import { beginSecondPeriod, beginThirdPeriod } from '../sim/periods.mjs';
import { calendarMinutes, withCalendarStep } from '../sim/clock.mjs';
import { ENGAGEMENTS, liveBattles, battleState, battleStep } from '../sim/battle-stage.mjs';
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
/**
 * Ask `fn` as if a played, present family had a man in every fight's force: one living person of the class is put in each
 * engagement's record as a participant and his household counted played and present, and everything is put back exactly as it
 * was before the tick runs.
 */
function asIfThere(world, fn) {
  const person = Object.values(world.entities).find(one => one.kind === 'person' && world.households[one.householdId] && !['dead', 'captured'].includes(one.health?.condition));
  if (!person) return fn();
  const household = world.households[person.householdId];
  const kept = [Object.hasOwn(household, 'played'), household.played, Object.hasOwn(household, 'absent'), household.absent];
  household.played = true; household.absent = false;
  const added = Object.values(world.battles || {}).filter(battle => battle.participants && !battle.participants[person.id]);
  for (const battle of added) battle.participants[person.id] = { householdId: person.householdId };
  try { return fn(); } finally {
    for (const battle of added) delete battle.participants[person.id];
    const [hadPlayed, played, hadAbsent, absent] = kept;
    if (hadPlayed) household.played = played; else delete household.played;
    if (hadAbsent) household.absent = absent; else delete household.absent;
  }
}
/** The fight holding this tick: one being fought, else the next to start. */
function holder(world) {
  const live = liveBattles(world);
  if (live.length) return live.map(state => state.battle.id).sort().join('+');
  const next = Object.keys(world.battles || {}).map(id => battleState(world, id)).filter(state => state?.before).sort((a, b) => a.battle.start - b.battle.start)[0];
  return next?.battle.id || 'none';
}

function runClass(families, scenario) {
  const started = Date.now();
  const world = createGonzalesWorld(`class-time-${families}`, families, { map: 'colonies', neighbours: true });
  world.status = 'running';
  const byFight = {}, periods = [];
  // The clock is the smaller of what it would carry with no fight and what the fights hold it to (sim/military-pacing.mjs takes
  // the smaller of the two), so for `nobody` this is `calendarMinutes` itself, and for `there` the same with the fights asked as
  // if a played family had a man in each.
  const clock = world => {
    const free = unheld(world);
    if (scenario === 'nobody') return { step: calendarMinutes(world), free };
    const held = asIfThere(world, () => battleStep(world));
    return { step: held === null ? free : Math.min(free, held), free };
  };
  const run = period => {
    const from = world.tick;
    for (let t = 0; t < 20000 && !world.director.complete && world.status === 'running'; t++) {
      const { step, free } = clock(world);
      if (step < free) {
        const id = holder(world), one = byFight[id] ||= { heldTicks: 0, minutes: 0, unheldTicks: 0 };
        one.heldTicks++; one.minutes += step; one.unheldTicks += step / free;
      }
      withCalendarStep(world, step, () => stepWorld(world));
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
  // How many of the families' people each fight's force had at any time (its record's participants).
  const familiesThere = Object.fromEntries(Object.entries(world.battles || {}).map(([id, battle]) => [id, Object.keys(battle.participants || {}).length]));
  return {
    families, scenario, ticks: world.tick, studyMinutes: study(world.tick), periods, reachedEnding: Boolean(ending?.families?.length) && periods.every(p => p.complete),
    endingFamilies: ending?.families?.length ?? 0, fights, addedTicks: +added.toFixed(1), addedStudyMinutes: study(added), familiesThere,
    engagementsArmed: Object.keys(world.battles || {}), secondsToRun: Math.round((Date.now() - started) / 1000),
  };
}

const classes = [];
for (const families of sizes.length ? sizes : [5, 15]) {
  for (const scenario of ['nobody', 'there']) {
    const one = runClass(families, scenario);
    classes.push(one);
    console.log(`${families} families, ${scenario}: ${one.ticks} ticks (${one.studyMinutes} min at Study), periods ${one.periods.map(p => `${p.period}:${p.ticks}${p.complete ? '' : ' INCOMPLETE'}`).join(' ')}, ending ${one.reachedEnding ? 'reached' : 'NOT reached'}; battles added ${one.addedTicks} ticks = ${one.addedStudyMinutes} min at Study (${one.secondsToRun} s to run)`);
    for (const [id, fight] of Object.entries(one.fights)) console.log(`  ${id}: held ${fight.heldTicks} ticks, +${fight.addedTicks} ticks, +${fight.addedStudyMinutes} min`);
    console.log(`  families' people in each force: ${Object.entries(one.familiesThere).map(([id, n]) => `${id} ${n}`).join(', ')}`);
  }
}
mkdirSync('docs/evidence', { recursive: true });
writeFileSync('docs/evidence/battle-class-time.json', `${JSON.stringify({ record: 'battle-class-time', date: new Date().toISOString().slice(0, 10), pace: { study: PACES.study }, classes }, null, 2)}\n`.replace(/\n/g, '\r\n'));
