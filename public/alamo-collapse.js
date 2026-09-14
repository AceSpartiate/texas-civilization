// Presentation timing only. The live server must own any eventual breach event.
export const COLLAPSE_DURATION_MS = 1200;
export function collapsePose(elapsedMs, reducedMotion = false) {
  if (reducedMotion || elapsedMs >= COLLAPSE_DURATION_MS) return {sprite:'alamo-wall-rubble',complete:true};
  return {sprite:elapsedMs < 300 ? 'alamo-wall-intact' : elapsedMs < 650 ? 'alamo-wall-cracked' : 'alamo-wall-breach',complete:false};
}
