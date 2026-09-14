# Art delivery — 14 September 2026

The accepted library contains **41 atlases, 599 named frames and 254 clips**. This adds 11 atlases, 156 frames and 85 clips to the previous library. Single-pose breathing clips are included; they are not authored frame cycles.

All 11 new accepted sheets passed the atlas build with **zero overlap pixels trimmed** and genuine RGBA transparency. Originals were copied unchanged. `npm test` passed **370 tests** after registration. This verifies assets and logic, not that every new asset is bound to gameplay.

## Accepted sheets

| Sheets | Contents and integration limits |
| --- | --- |
| people-children-idle, people-children-walk, people-children-care | Girl, boy, small child and infant basket; east walks and rest/injury poses. Preserve age scaling; north/south walks remain pending |
| people-cast2-idle, people-cast2-work | Four directions and four authored hoe phases for rust woman, indigo woman, ochre man and blue girl. Complete their remaining actions before changing identity globally |
| courier-dismount | Dismount, remount, on-foot encounter and waiting horse. Composite drawings already include horse; requires encounter presentation phases and consistent horse scale before gameplay binding |
| courier-encounters-vertical, people-dialogue | Mounted north/south listening/speaking and first-cast dialogue poses. Follow visible encounter state, never distant event state |
| houses-settling | Round log, hewn log, dog-run and jacal, four stages each. Shared row height preserves stage scale; draw known construction state only |
| home-interiors | Four unfurnished cutaways. Schematic art plates, not surveyed geometry or collision maps |
| home-furnishings | Sixteen furnishings/goods. Chest opening uses two states; cradle uses procedural rocking. Spinning wheel still needs moving components |

Claude has already bound some deliveries independently. Read the current `ART_REQUESTS.md` stand-in table and implementation for live status; preserve those changes.

## Remaining production

- Second-cast walks, carry, sow/repair, care, search/trade and dialogue. Work now joins accepted idle. Carry and tasks candidates in `output/art-delivery-progress` have painted checkerboard backgrounds and are not runtime assets. Walk candidates also need convincing alternating feet.
- Children's north/south walks with distinct opposite-foot poses and remaining requested tasks. Repeated poses were withheld.
- Longhorn/hog atlas: held by the registry because a horn crosses a cell. Correct spacing through image generation; do not relax the overlap threshold. Keep the herd stand-in meanwhile.
- Survey stake, corner marker, cleared-timber stumps and clearing-brush piles from newest requests.
- Layered or palette-mask appearance customization. Baked-color drawings are not clean semantic recoloring masks.
- Separate spinning-wheel/treadle parts and other functional furniture states. Art never determines simulation outcomes.

## Continue

The built-in image-generation tool returned `usage_limit_reached` during corrections. No paid API fallback was used. Accepted prompts and sources are in `art-prompts.json` and `art-provenance.json`. Delivery modules preserve their records; second-cast pending prompts are in `scripts/art-deliveries/cast2.mjs`, children's withheld attempts in `children.mjs`. Accepted work is self-contained in `cast2-work.mjs`, with no dependency on ignored output files.

After acceptance, run `node scripts/register-delivered-art.mjs`, `npm run build:art` and relevant checks. Generated `ART_MANIFEST.md`, `atlas.json` and `animation.json` define authoritative names, timing and rectangles. A PNG on disk is not proof of acceptance: the registry deliberately excludes held/pending sheets.
