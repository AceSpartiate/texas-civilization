# Wildlife art delivery — 2026-09-15

`wildlife-deer.png` supplies sixteen transparent, measured frames of one white-tailed deer in the shared warm outlined style:

- `deer-idle`: grazing through calm head-up poses.
- `deer-alert`: head up, ears forward and a cautious forehoof lift.
- `deer-bound`: gather, launch, airborne extension and landing.
- `deer-drink`: lower, drink, swallow and lift.

The live hunting quarry uses `deer-idle`, and uses `deer-alert` only while the hunter's projected chore carries an unanswered `ask`. The renderer does not invent an animal, a position, escape or drinking state. `deer-bound` and `deer-drink` are reusable registered clips awaiting explicit projected states.

The generated original was copied unchanged. The atlas build measures alpha bounds and ground anchors, rejects opaque corners and painted backgrounds, and keeps one logical height across each authored cycle.
