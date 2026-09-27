// A played family on the road in front of Mexican troops, for looking at a chase tick by tick (docs/SCRAPE.md §13): the
// tests' scene and the browser proof's, printed. Not a proof; `tests/scrape-pursuit.test.mjs` is.
//
// Run: node scripts/scrape-pursuit-scene.mjs [cavalry|infantry] [run|halt|abandon-run|silence] [wagon|foot|mounted]
import { applyAction, stepWorld, validateWorld } from '../sim/world.mjs';
import { calendarMinutes } from '../sim/clock.mjs';
import { spring } from '../tests/support/scrape-spring.mjs';
import { placeFamily, sceneFor } from '../tests/support/scrape-scene.mjs';

const [kind = 'cavalry', answer = 'run', how = 'wagon', householdId = 'hh-1'] = process.argv.slice(2);
const world = spring();
const { household, main } = sceneFor(world, { kind, how, householdId });
let ticks = 0, heldTicks = 0;
for (let t = 0; t < 400; t++) {
  const step = calendarMinutes(world);
  stepWorld(world);
  ticks++;
  const chase = household.flight.chase;
  if (chase) heldTicks++;
  if (chase) console.log(`tick ${t} step ${step} phase ${chase.phase} ${chase.reason || ""} lead ${chase.lead} men ${chase.soldiers.map(one => Math.round(one.g)).join(',')} shots ${chase.shotCount} hits ${chase.hits} ask ${household.flight.ask?.id || "-"} timber ${JSON.stringify(chase.timber || null)} at ${JSON.stringify(household.flight.lastPoint)} ${chase.lines.map(line => line.text).join(' ')}`);
  if (household.flight.ask?.id === 'alto' && answer !== 'silence') applyAction(world, household.id, { action: 'road-answer', entityId: main.id, option: answer });
  if (!chase && household.flight.pursued?.length) break;
}
console.log(household.flight.chase?.reason, JSON.stringify(household.flight.pursued), 'held ticks', heldTicks, 'real seconds at Study', Math.round(heldTicks * 9.5));
validateWorld(world);
export { placeFamily };
