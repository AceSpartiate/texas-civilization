// How much class time a chase on the Scrape adds (docs/SCRAPE.md §14): each scene of tests/support/scrape-scene.mjs played as a
// student at the screen would play it - ran, halted, left unanswered - counting the ticks the chase held the class's clock, at
// the Study pace (server/app.mjs `PACES.study`, 9.5 seconds a tick). Then the class: the chases a class of fifteen meets
// (docs/evidence/scrape-pursuit-study.json, families nobody plays) times the mean held time, as if every one were played.
//
// Run: node scripts/scrape-pursuit-class-time.mjs  -> docs/evidence/scrape-pursuit-class-time.json
import { readFileSync, writeFileSync } from 'node:fs';
import { applyAction, stepWorld } from '../sim/world.mjs';
import { calendarMinutes } from '../sim/clock.mjs';
import { PACES } from '../server/app.mjs';
import { spring } from '../tests/support/scrape-spring.mjs';
import { sceneFor } from '../tests/support/scrape-scene.mjs';

const rows = [];
for (const [kind, how, answer, householdId] of [
  ['cavalry', 'wagon', 'run', 'hh-1'], ['cavalry', 'wagon', 'halt', 'hh-1'], ['cavalry', 'wagon', null, 'hh-1'], ['cavalry', 'mounted', 'run', 'hh-4'],
  ['infantry', 'wagon', 'run', 'hh-1'], ['infantry', 'wagon', 'abandon-run', 'hh-1'], ['infantry', 'wagon', 'halt', 'hh-1'], ['infantry', 'wagon', null, 'hh-1'],
  ['timber', 'mounted', 'run', 'hh-4'],
]) {
  const world = spring();
  const { household, main } = sceneFor(world, { kind, how, householdId });
  let held = 0, minutes = 0;
  for (let t = 0; t < 300; t++) {
    const step = calendarMinutes(world);
    const chased = Boolean(household.flight.chase);
    stepWorld(world);
    if (chased) { held++; minutes += step; }
    if (household.flight.ask?.id === 'alto' && answer) applyAction(world, household.id, { action: 'road-answer', entityId: main.id, option: answer });
    if (!household.flight.chase && household.flight.pursued?.length) break;
  }
  const outcome = household.flight.pursued?.at(-1);
  rows.push({ kind, how, answer: answer || 'unanswered', outcome: outcome?.outcome, shots: outcome?.shots, hits: outcome?.hits, heldTicks: held, heldGameMinutes: minutes, studySeconds: Math.round(held * PACES.study / 1000) });
  console.log(JSON.stringify(rows.at(-1)));
}
const mean = rows.reduce((sum, row) => sum + row.studySeconds, 0) / rows.length;
const most = Math.max(...rows.map(row => row.studySeconds));
let study = null;
try { study = JSON.parse(readFileSync(new URL('../docs/evidence/scrape-pursuit-study.json', import.meta.url), 'utf8')); } catch { /* run the study first */ }
const chasesPerClass = study ? Math.round(study.rows.reduce((sum, row) => sum + row.chases, 0) / study.rows.length * 10) / 10 : null;
// Every chase counted at the mean of the scenes, though a chase that never comes within hail holds only its approach: an
// upper figure, as if every family of the class were played and at its screen.
const summary = { meanChaseSeconds: Math.round(mean), longestChaseSeconds: most, ...(study && { familiesPerClass: study.summary.families, chasesPerClass, addedMinutesPerClassIfEveryFamilyPlayed: Math.round(chasesPerClass * mean / 60 * 10) / 10 }) };
console.log(JSON.stringify(summary));
writeFileSync(new URL('../docs/evidence/scrape-pursuit-class-time.json', import.meta.url), `${JSON.stringify({ measured: new Date().toISOString().slice(0, 10), pace: 'Study, 9.5 s a tick', summary, rows }, null, 2)}\n`);
