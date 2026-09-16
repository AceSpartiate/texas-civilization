# Art delivery — 15 September 2026

This batch adds seven accepted atlases to `frontier-v1`. All generated originals were copied unchanged. The atlas builder measured transparent bounds, anchors and cell separation; it registers **767 sprites across 52 sheets and 322 clips**.

## Delivered

- `house-modules`: 16 construction pieces for round/hewn pens, passage, porch, shed and chimneys. The live house plot selects them from authoritative server stages.
- `trees-colonies-1`: 16 pieces covering loblolly pine, cedar, mesquite, live oak and elm at three woods sizes, plus a pine stump. The real-land woods renderer uses the species and size the server provides.
- `wildlife-deer`: 16 frames for idle, alert, bounding and drinking. The live quarry uses idle and alert; the remaining clips are catalogued without inventing behavior.
- `people-cast2-walk`: 16 east-facing frames and four authored walk cycles, mirrored for west.
- `people-cast2-carry`: 12 accepted carrying frames and four `1-2-3-2` cycles. Four turn-away cells are excluded rather than mislabeled as east-facing.
- `people-children-vertical`: 12 north/south walking frames and six clips. The empty infant row remains transparent; infants do not walk.
- `artillery-service`: 16 volunteer and Mexican regular cannon-service poses and six staged clips for ramming, carrying roundshot and pulling the lanyard. These are library pieces for later battle assemblies and never advance battle state.

## Withheld

One generated second-cast vertical walking candidate failed the atlas cell/alpha validation at cell 6. It is retained under `output/art-rejected/cast2` and is not in the runtime library. The acceptance check was not weakened.

## Remaining priority gaps

Second-cast north/south walking, sow/repair and dialogue still block switching all procedurally assigned adult identities to the second cast. The modular house still needs jacal stages, a shed frame, a double chimney and separate floor/loft layers. Post oak and blackjack need their own three-size tree art. Family-specific mounted figures, N/S wagons and boats, and several later battle movements remain open in `ART_REQUESTS.md`.
