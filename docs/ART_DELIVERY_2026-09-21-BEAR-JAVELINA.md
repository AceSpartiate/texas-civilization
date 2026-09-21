# Bear and javelina wildlife delivery — 2026-09-21

`wildlife-bear-javelina.png` adds two Texas quarry species in one 4 × 4 production atlas while keeping each species at a readable world scale beside `wildlife-deer`.

## Atlas contract

| Row | Frames | Use |
| --- | --- | --- |
| 1 | `bear-forage-1` … `bear-forage-4` | Calm sniff, forage, chew and head-up loop |
| 2 | `bear-alert-bound-1` … `bear-alert-bound-4` | Alert, gather, short bound and landing loop |
| 3 | `javelina-forage-1` … `javelina-forage-4` | Calm sniff, root, chew and head-up loop |
| 4 | `javelina-alert-run-1` … `javelina-alert-run-4` | Alert, push-off, airborne run and landing loop |

All source poses face east. Render west by mirroring. Simulation state chooses the animal, position, visibility, travel and hunt result; these clips only present that state.

## Production record

- Built-in ImageGen, using `wildlife-deer.png` as the strict style, camera and scale reference.
- Generated original copied unchanged to `public/assets/frontier-v1/atlases/wildlife-bear-javelina.png`.
- Source prompt and provenance are self-contained in `scripts/art-deliveries/wildlife-bear-javelina.mjs`.
- No scenery, blood, hunters or weapons. The javelina has the pale shoulder collar and compact peccary build that distinguish it from a domestic pig.

## Integration

Register the delivery with the normal art pipeline. Bind `bear-*` when `quarry.kind === 'bear'` and `javelina-*` when `quarry.kind === 'javelina'`. The calm clip can play while the quarry waits; the alert/locomotion clip can play when it reacts or moves.
