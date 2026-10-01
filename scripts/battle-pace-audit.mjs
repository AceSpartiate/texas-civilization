// How each fight reads in real time, at every pace: how long its fighting lasts on the screen, and how fast anybody in it is seen
// to move (owner, 2026-09-30: "i was playing on study earlier and it was too fast"; "i think you're correct about speed";
// docs/BATTLES.md §16.1).
//
// node scripts/battle-pace-audit.mjs [tree root] [label]
// Reads the tree's own engagements and clock (so the same script measures the live tag, exported with `git archive`, against this
// one): for every tick of each fight's fighting - the phases held at a step for every class and not quiet - the real seconds it
// is shown at Study, Brisk and Quick (the pace, or the tree's floor if it has one) and the furthest any side, part, group or named
// person walks in it, as body lengths a real second on the screen (a person is drawn 0.019 miles tall; the page walks a traveller
// at about 0.9). Writes docs/evidence/battle-pace-audit.json under the label given ("before"/"after"), keeping the other.
import { pathToFileURL } from 'node:url';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(process.argv[2] || '.'), label = process.argv[3] || 'after';
const imp = path => import(pathToFileURL(`${root}/${path}`).href);
const stage = await imp('sim/battle-stage.mjs');
const { createGonzalesWorld } = await imp('sim/gonzales.mjs');
const PACES = { study: 9500, brisk: 4000, quick: 1000 }, PERSON = 0.019;
const world = createGonzalesWorld('pace-audit', 5, { map: 'colonies' });
const fighting = phase => Boolean(phase.step) && !phase.quiet;
const out = {};
for (const def of Object.values(stage.ENGAGEMENTS)) {
  const ground = def.ground(world);
  if (!ground) { out[def.id] = { skipped: 'no ground on this map' }; continue; }
  const start = 100000, phases = stage.schedule(def, start);
  const row = { ticks: 0, seconds: { study: 0, brisk: 0, quick: 0 }, fastest: { study: 0, brisk: 0, quick: 0 }, fastestWhere: null };
  for (const phase of phases.filter(fighting)) {
    for (let into = 0; into < phase.minutes; into += phase.step) {
      const minute = start + phase.from - start + into;
      // The tree's own floor for this tick, read off a class standing at that minute (null where the tree has none).
      const probe = { ...world, minute, battles: { [def.id]: { id: def.id, start, participants: {}, alerted: {}, told: {}, heard: {} } } };
      const floor = stage.battleTickFloorMs ? stage.battleTickFloorMs(probe) || 0 : 0;
      // The furthest walk in the tick.
      let miles = 0;
      const specs = [...['texian', 'mexican'].map(side => phase[side]), ...['texian', 'mexican'].flatMap(side => phase[side].parts || []), ...(phase.groups || []), ...(phase.people || []).filter(entry => !entry.with)];
      for (const spec of specs) {
        let walked = 0, was = null;
        for (let i = 0; i <= 6; i++) {
          let at; try { at = stage.placeOf(ground, spec, phase.minutes, into + phase.step * i / 6); } catch { at = null; }
          if (at && was) walked += Math.hypot(at.x - was.x, at.y - was.y);
          was = at;
        }
        miles = Math.max(miles, walked);
      }
      row.ticks++;
      for (const [pace, ms] of Object.entries(PACES)) {
        const real = Math.max(ms, floor) / 1000;
        row.seconds[pace] += real;
        const speed = miles / PERSON / real;
        if (speed > row.fastest[pace]) { row.fastest[pace] = speed; if (pace === 'study') row.fastestWhere = `${phase.id} +${into}`; }
      }
    }
  }
  for (const pace of Object.keys(PACES)) { row.seconds[pace] = Math.round(row.seconds[pace]); row.fastest[pace] = +row.fastest[pace].toFixed(2); }
  out[def.id] = row;
}
for (const [id, row] of Object.entries(out)) console.log(id.padEnd(16), row.skipped || `${String(row.ticks).padStart(3)} ticks | seconds S ${row.seconds.study} B ${row.seconds.brisk} Q ${row.seconds.quick} | fastest (body lengths/s) S ${row.fastest.study} B ${row.fastest.brisk} Q ${row.fastest.quick} at ${row.fastestWhere}`);
mkdirSync('docs/evidence', { recursive: true });
const path = 'docs/evidence/battle-pace-audit.json';
let record = {};
try { record = JSON.parse(readFileSync(path, 'utf8')); } catch { /* the first run */ }
record.record = 'battle-pace-audit';
record.note = 'Each fight\'s fighting (phases held at a step for every class, not quiet), tick by tick: real seconds at each pace (the pace, or the tree\'s floor), and the fastest anybody is drawn to move in body lengths a real second (a walk reads at about 0.9). Arithmetic on the schedule, on the colonies map; no browser.';
record[label] = { tree: label === 'before' ? 'v2026.09.29.3 (the live build the owner played)' : 'this branch', date: new Date().toISOString().slice(0, 10), engagements: out };
writeFileSync(path, `${JSON.stringify(record, null, 2)}\n`);
console.log(`Wrote ${path} (${label})`);
