// A share of a thing that must be the same every time it is asked.
//
// The game draws nothing from a random stream once a class is running: who falls sick on the road, which day it rains, which
// man enlists, whether a wade goes wrong. Each is a number in [0, 1) hashed from the class's seed, the person (or the thing
// standing in for one) and the question asked. That is what makes a class replay the same, a save reload into the world it
// left, and a bug reproducible from its seed alone.
//
// It lived in sim/scrape.mjs until 2026-09-20, where the flight first needed it; sim/weather.mjs needs it too, and the
// weather is read by sim/ways.mjs, which the flight itself imports. One small module everything can depend on is the way out
// of that circle. `scrape.mjs` still exports `share`, so every caller that has always asked it for one still may.

/** A share in [0, 1) that is always the same for this class, this person and this question: FNV-1a over the three. */
export function share(world, personId, question) {
  let hash = 0x811c9dc5;
  for (const char of `${world.seed}:${personId}:${question}`) { hash ^= char.charCodeAt(0); hash = Math.imul(hash, 0x01000193) >>> 0; }
  return hash / 0x100000000;
}

/**
 * The same share, stirred: FNV-1a over the three, then an avalanche, so two questions that differ by one digit - `wander:118`
 * and `wander:119` - are as unlike as two that differ in every letter. The plain share runs in streaks over keys like that
 * (sim/road.mjs found it in the rain, 2026-09-19), and a child's disobedience and a baby's crying are asked every tick
 * (sim/childhood.mjs, sim/babies.mjs), where a streak would be a child good all morning and bad all afternoon for no reason.
 */
export function stirredShare(world, personId, question) {
  let hash = 0x811c9dc5;
  for (const char of `${world.seed}:${personId}:${question}`) hash = Math.imul(hash ^ char.charCodeAt(0), 0x01000193);
  hash ^= hash >>> 15; hash = Math.imul(hash, 0x85ebca6b); hash ^= hash >>> 13; hash = Math.imul(hash, 0xc2b2ae35); hash ^= hash >>> 16;
  return (hash >>> 0) / 0x100000000;
}
