// Astra's art always wins (owner, 2026-09-29). When she delivers a subject Claude drew a stand-in for, the stand-in is deleted:
// its frames leave the module's sheets (a sheet left with none goes too), and so does every clip that drew one of them, so
// `npm run build:standins -- --only <module>` no longer draws, packs or lists them (tests/claude-standins.test.mjs).
//
// `retire(SHEETS, CLIPS, names)`: `names` are frame names, or a prefix ending in `*`. Returns `{ SHEETS, CLIPS }` without them.
// The drawing code a module keeps for a retired frame is no longer called; it is left for the record of what stood in.
export function retire(SHEETS, CLIPS = {}, names = []) {
  const gone = name => names.some(rule => (rule.endsWith('*') ? name.startsWith(rule.slice(0, -1)) : name === rule));
  const sheets = {};
  for (const [id, spec] of Object.entries(SHEETS)) {
    const frames = spec.frames.filter(frame => !gone(frame.name));
    if (frames.length) sheets[id] = frames.length === spec.frames.length ? spec : { ...spec, frames };
  }
  const kept = new Set(Object.values(sheets).flatMap(spec => spec.frames.map(frame => frame.name)));
  const clips = Object.fromEntries(Object.entries(CLIPS).filter(([name, clip]) => !gone(name) && (clip.frames || []).every(frame => kept.has(frame.sprite))));
  return { SHEETS: sheets, CLIPS: clips };
}
