// A real fight's projection for `npm run test:audio` (scripts/audio-browser-proof.mjs): the Gonzales fight stepped in the
// simulation and projected exactly as a page watching it is sent (sim/battle-stage.mjs `projectBattle`), a tick at a time,
// from the first tick either side fires. Not a test file.
import { stepWorld } from '../../sim/world.mjs';
import { projectBattle } from '../../sim/battle-stage.mjs';
import { gonzalesClass, stepUntil, TIMELINE } from '../../tests/support/battle.mjs';

export function firingTicks(seed = 'audio-proof', count = 8) {
  const world = gonzalesClass(seed, { fighters: ['hh-1'] });
  stepUntil(world, () => world.minute >= TIMELINE.crossing);
  const views = [];
  for (let i = 0; i < 800 && world.status === 'running'; i++) {
    stepWorld(world);
    const view = projectBattle(world, 'gonzales', { members: [] });
    if (view && !view.over) views.push(view);
    // The window around the cannon's first shot, both sides firing: the fight's loudest minutes.
    const first = views.findIndex(one => (one.cannon?.shots || []).length);
    if (first >= 0 && views.length >= first + count) return views.slice(Math.max(0, first - 2), first - 2 + count);
  }
  return views.slice(-count);
}

/** The same fight moved so its middle is at `centre` (miles): every place in it shifted, no direction touched. */
export function movedTo(view, centre) {
  const sides = view.sides.filter(side => Number.isFinite(side.x));
  const mid = { x: sides.reduce((s, side) => s + side.x, 0) / sides.length, y: sides.reduce((s, side) => s + side.y, 0) / sides.length };
  const dx = centre.x - mid.x, dy = centre.y - mid.y;
  const DIRECTIONS = new Set(['facing', 'dir', 'wind', 'toward', 'heading']);
  const walk = (value, key) => {
    if (Array.isArray(value)) return value.map(one => walk(one, key));
    if (!value || typeof value !== 'object') return value;
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = DIRECTIONS.has(k) ? v : walk(v, k);
    if (!DIRECTIONS.has(key) && Number.isFinite(value.x) && Number.isFinite(value.y)) { out.x = value.x + dx; out.y = value.y + dy; }
    return out;
  };
  return walk(view, null);
}
