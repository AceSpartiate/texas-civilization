# Wildlife geese and wild cattle delivery — 2026-09-21

`wildlife-geese-cattle.png` adds sixteen animated wildlife frames in a strict 4 × 4 atlas:

| Row | Frames | Use |
| --- | --- | --- |
| 1 | `geese-rest-1` … `geese-rest-4` | Resting, feeding, sentinel and regrouping flock beats |
| 2 | `geese-flight-1` … `geese-flight-4` | Eastward airborne wing cycle; mirror for west |
| 3 | `wild-cattle-graze-1` … `wild-cattle-graze-4` | Grazing through full-alert head lift |
| 4 | `wild-cattle-run-1` … `wild-cattle-run-4` | Alert brace, gather, extended stride and recovery |

The sheet follows `wildlife-deer` in projection, warm outlined rendering and readable game scale. The same longhorn identity and coat continue through both cattle rows. Goose cells deliberately depict small flocks because the hunt request calls for resting and flying flock states.

Four authored loops are registered: `geese-rest`, `geese-flight`, `wild-cattle-graze`, and `wild-cattle-run`. East/west travel uses mirroring; the resting flock is a state cycle without implied translation. Rendering remains presentational: the simulation owns quarry kind, position, visibility, motion and outcome.

The accepted PNG is the unmodified built-in ImageGen output. Read-only validation checks real RGBA transparency, all sixteen requested cells, measured frame retention and clip references.
