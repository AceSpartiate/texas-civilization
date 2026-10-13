// How dark it is at Béxar by the hour of the storming's clock, 0 day to 1 night, eased through dawn (05:00-07:00) and dusk
// (17:00-19:00): Astra's illustrated winter twilight (2026-10-11), not an astronomical moon or sun. The server sends it with
// the storming (`bexarDarkness`, sim/battle-stage.mjs) and the page eases its moonlit grade toward it (public/bexar-battle-art.js).
// In the simulation, which takes nothing from public/ (tests/movement.test.mjs).
const clamp = n => Math.max(0, Math.min(1, n));
const smooth = n => { const t = clamp(n); return t * t * (3 - 2 * t); };
export function bexarDarknessAtHour(hour) {
  const h = ((hour % 24) + 24) % 24;
  return h < 7 ? 1 - smooth((h - 5) / 2) : smooth((h - 17) / 2);
}
