# Military life, engineering and field defenses — 2026-10-03

Delivered nine transparent atlases, 84 distinct frames and 20 authored animation clips in the established warm, outlined frontier illustration style. Exact IDs, timings, anchors, source prompts and provenance are registered through `scripts/art-deliveries/military-life-2026-10-03.mjs`. Run `node scripts/register-delivered-art.mjs` and `node scripts/build-atlas-manifest.mjs` after changing that source; do not hand-edit generated manifests.

| Atlas | Frames | Clips | Contents |
| --- | ---: | ---: | --- |
| military-camp-life | 16 | 8 | Volunteer and regular seated rest, blanket sleep, drinking and musket cleaning |
| volunteer-engineer-actions | 16 | 4 | Digging, crowbar work, carrying and filling sandbags |
| volunteer-bearers | 4 | 1 | Two volunteers carrying a living wounded patient on a blanket |
| regular-bearers | 4 | 1 | Regular army blanket bearers and living patient |
| dragoon-wounded-led | 4 | 1 | A wounded mounted dragoon with his horse led by a soldier |
| volunteer-mounted | 16 | 4 | East/south/north riding and idle; east firing transition, mirrored west |
| field-cover-camp-props | 16 | 0 | Barricade sections, sandbag sections, baggage breastworks, musket stacks and cookpot |
| house-loopholed | 4 | 0 | Generic limestone house: closed, open door, breached door, roof removed |
| volunteer-loophole-actions | 4 | 1 | Crouched aim, discharge, load and ramrod sequence |

## Already connected to gameplay

`public/battle-view.js` now uses healthy seated rest in existing camp states and blanket sleep for explicitly sleeping sampled soldiers. Volunteer work uses digging. Generic Texian mounted forces use directional riding, stationary mounted poses and the firing transition. Named historical riders retain their own delivered art. Street barricades and sandbags use dedicated cover. San Jacinto's baggage breastwork uses the new pack/saddle sections, retaining the existing central gun opening.

Visible Texian loophole fighters use crouched loading/firing art. The existing one-in-four visible sampling and hidden muzzle flashes remain intact. Living wounded sampled troops use side-specific blanket bearers; mounted dragoons use the led horse. Existing retreat duration, position, casualty outcome, witness visibility and historical timing remain authoritative. Wounded in a square still move inward using the existing treatment presentation. Dead carried figures remain the old reclining figure/comrade composite: the new visibly living patients must never represent the dead.

## Ready for Claude's next integration

Camp drinking/cleaning, generic crowbar work, sandbag carrying/filling, musket stacks, cookpot and alternate defense states are registered assets awaiting corresponding scene actions. Karnes keeps his own crowbar art. A prop's existence does not authorize random historical damage or new simulation actions.

The generic house is available for future explicit staging; existing named Béxar houses and their surveyed/interpretive assemblies are preserved. The roof-removed version exposes the floor but retains its front wall. Supply depth sorting, wall occlusion masks, doors, collision and room navigation before placing actors inside it. It is not a replacement for the full Alamo assembly or a reconstruction of a named historical residence.

These are original costume/architecture interpretations, not claims of exact documented uniforms or dimensions. The structural states are fixed art, not animation clips. Figure loops use authored keyframes rather than skeletal rigs. More precise foot/hand/tool registration remains polish. Mounted firing has only east/west artwork and an idle/fire/idle transition, not a complete reload; add north/south firing poses before demanding directional continuity during discharge. Mexican digging and family-specific sleeping/fighting remain outstanding.

## Verification and evidence

`node --test tests/military-life-art.test.mjs tests/battle-view.test.mjs tests/battle-bexar-view.test.mjs tests/battle-view-san-jacinto.test.mjs tests/battle-view-south.test.mjs` passes all 53 tests: delivery integrity, living wounded transport and renderer regressions including hidden fighters, famous identities and casualty positions.

`node scripts/military-life-art-proof.mjs` uses Playwright (set `PLAYWRIGHT_MODULE` and `BROWSER_EXECUTABLE` for the local runtime). All 84 sprites render and all 20 clips change pixels without browser errors. Alpha audits retain 100% of every measured silhouette with zero overlap trimming. Contact sheet and machine-readable proof: `docs/evidence/military-life-art.png` and `docs/evidence/military-life-art.json`.
