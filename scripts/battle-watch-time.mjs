// How long each fight is watched, in real seconds, at each pace - before and after the owner's floor of 2026-09-30 ("i was able
// to see the battle of Gonzales today. it happened too fast"; docs/BATTLES.md §15.1, sim/battle-stage.mjs `WATCH_SECONDS`).
//
// Read off each engagement's own data, the way the clock runs it (sim/battle-stage.mjs `battleStep`): the fighting is every phase
// held at a `step` for every class and not `quiet` (docs/BATTLES.md §13.2), one tick for each `step` of its minutes. A tick lasts
// the class's pace (server/app.mjs `PACES`) - and since the floor, at least `tickFloorOf(def)`. The lead-ups and aftermaths
// (`quiet`, held only while a played family is there) are counted apart; the floor does not touch them.
//
// This is arithmetic on the schedule, not a run: the server's own interval is proved by tests/battle-floor.test.mjs, and a fight
// watched through on the page by `npm run test:battle-cinema`. Run: node scripts/battle-watch-time.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { ENGAGEMENTS, WATCH_SECONDS, fightTicks, fightingPhase, tickFloorOf } from '../sim/battle-stage.mjs';
import { PACES } from '../server/app.mjs';

const round = n => Math.round(n * 10) / 10;
const rows = Object.values(ENGAGEMENTS).map(def => {
  const ticks = fightTicks(def), quietTicks = def.phases.filter(phase => phase.step && phase.quiet).reduce((sum, phase) => sum + phase.minutes / phase.step, 0);
  const floorMs = tickFloorOf(def);
  const at = Object.fromEntries(Object.entries(PACES).map(([name, ms]) => [name, {
    before: round(ticks * ms / 1000), after: round(ticks * Math.max(ms, floorMs) / 1000),
    quietWithAFamily: round(quietTicks * ms / 1000),
  }]));
  return { id: def.id, name: def.name, fightTicks: ticks, phases: def.phases.filter(fightingPhase).map(phase => `${phase.id} ${phase.minutes / phase.step}`), floorSeconds: WATCH_SECONDS[def.id], tickFloorMs: floorMs, quietTicks, seconds: at };
});
const total = Object.fromEntries(Object.keys(PACES).map(name => [name, { before: round(rows.reduce((s, row) => s + row.seconds[name].before, 0)), after: round(rows.reduce((s, row) => s + row.seconds[name].after, 0)) }]));
const line = (row, name) => `${row.seconds[name].before}s -> ${row.seconds[name].after}s`;
for (const row of rows) console.log(`${row.id.padEnd(16)} ${String(row.fightTicks).padStart(3)} ticks, floor ${row.floorSeconds}s (${row.tickFloorMs} ms a tick) | Study ${line(row, 'study')} | Brisk ${line(row, 'brisk')} | Quick ${line(row, 'quick')}`);
console.log(`all fights: Study ${total.study.before}s -> ${total.study.after}s, Brisk ${total.brisk.before}s -> ${total.brisk.after}s, Quick ${total.quick.before}s -> ${total.quick.after}s`);
mkdirSync('docs/evidence', { recursive: true });
writeFileSync('docs/evidence/battle-watch-time.json', `${JSON.stringify({
  record: 'battle-watch-time', date: new Date().toISOString().slice(0, 10),
  note: 'Arithmetic on each engagement\'s schedule (sim/battle-stage.mjs): the fighting phases held for every class, a tick each `step`, at each pace (server/app.mjs PACES) before and after the floor (WATCH_SECONDS, owner 2026-09-30). Quiet lead-ups and aftermaths are held only while a played family is there, are not floored, and are given at the pace.',
  paces: PACES, engagements: rows, total,
}, null, 2)}\n`);
console.log('Wrote docs/evidence/battle-watch-time.json');
