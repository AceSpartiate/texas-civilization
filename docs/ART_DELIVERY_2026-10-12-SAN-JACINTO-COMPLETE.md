# San Jacinto artwork group complete — 2026-10-12

This closes the remaining September 25 San Jacinto artwork refinements. The generic Twin Sisters/crew, baggage breastwork, camp chores, cardinal riding/firing, marsh-edge and wading deliveries remain in place. This batch adds **136 usable frames and 50 authored animations**, matching the established painted game style.

## Complete manifest

| Atlas | Row identities / order | Usable frames |
| --- | --- | --- |
| people-sj-camp-cast1 | rust, teal, elder, blue | 16 |
| people-sj-camp-cast2 | rust-woman, indigo, ochre, blue-girl | 16 |
| people-sj-camp-children | girl, boy, smallchild; final row intentionally unregistered | 12 |
| people-sj-camp-heads1 | mother-scarf, father-straw, father-beard, father-moustache | 16 |
| people-sj-camp-heads2 | mother-braid, mother-loose, mother-straw, youth-boy | 16 |
| people-sj-camp-heads3 | youth-girl, father-hat | 8 |
| people-sj-camp-infant | four consistent front-view basket poses | 4 |
| sj-mounted-reload-e | volunteer eight phases, dragoon eight phases | 16 |
| sj-mounted-reload-s | same, independently painted toward camera | 16 |
| sj-mounted-reload-n | same, independently painted away | 16 |

Family rows contain `{identity}-camp-rest-{1..2}` followed by `{identity}-camp-sleep-{1..2}`. Clips `{identity}-camp-rest` use two 1,100 ms poses; `{identity}-camp-sleep` use two 1,600 ms poses. All loop, are authored, and use motion none. They show relaxed healthy people and peaceful blanket sleep, distinct from injury/death. Twenty-two identities cover baseline adults/adolescents, all offered headwear/hair shapes, youths, children, toddlers and infants. The separate front-view infant sheet avoids a sideways basket flip in a breathing loop. Four basket-view slots in the children source PNG are intentionally NOT runtime sprites.

Mounted frames are `{volunteer/dragoon}-mounted-reload-{e/s/n}-{1..8}`; matching clips omit the frame suffix. Eight phases: cartridge handling, prime, close pan, charge muzzle, draw ramrod, ram, return rod, ready. Durations are 600/600/400/1,000/800/2,000/1,800/800 ms: **8 seconds**, non-looping, authored, motion none. East mirrors west; north/south are independent. Horses stand during reload. This does not replace the separate discharge/aim/lower clips.

## Production integration

Generic mounted stationary formations use the new reload during their existing between-shot interval, then hold ready. Moving riders keep their travel gait. San Jacinto's Texian mounted groups use the full sequence only when their existing interval can accommodate it; shorter intervals preserve existing art. No shot cadence, simulation speed, route, damage, counts, family fate or visibility changes.

A sleeping family member previously selected volunteer-reclining (the fallen-body sprite). It now selects the healthy sleep clip through familyCampBinding in public/avatar-identity.js, retaining baseline or chosen appearance identity. public/app.js passes that explicit camp clip into drawAvatar for customized people instead of silently drawing work poses. Fatal/wounded/captured states still take priority.

Seated family rest clips are library-ready for future projected rest/camp/night states; this delivery does not invent a night schedule. Use familyCampBinding(entity,{sleep:false,baseline,timeMs}) where the server already projects healthy rest, supplying the actual baseline figure and screen clock. Sleep uses scale .7, seated rest .8; frame logicalHeight remains stable across each identity's row. Do not resize a horizontal sleeping person to a standing-height bounding box. Infant uses basket scale and its existing age scaling. Palette masks and complete family-specific combat/transport remain separate open groups; this batch does not claim new semantic recoloring masks.

## Historical scope

The loading order is informed by the National Park Service's [Palo Alto musket drill](https://www.nps.gov/paal/planyourvisit/musket-drill.htm) and [Fort Scott weapons drill](https://www.nps.gov/fosc/learn/education/weaponsdrill.htm). These explain flintlock loading mechanics; they do **not** establish an exact 1836 Texian mounted drill, every soldier's weapon, or an eight-second historical rate. This is a stylized muzzleloader presentation using the project's existing volunteer/dragoon identities. Eight-second timing is a display choice within existing fire intervals, not a new historical claim. Named people retain their own art.

## Verification

**41 targeted tests pass**, including complete inventory, 100% retained alpha and zero trimmed pixels for all 136 frames, stable phase scale, full eight-step clip timing, every offered parent head/age, stationary reload selection, moving gait preservation and healthy sleep with fate precedence. One stale marsh assertion was updated to expect delivered marsh-edge art instead of its old reeds fallback.

The asset browser proof renders every frame, all **50 animations with distinct pixel phases**, and customized healthy camp selections with zero page errors. Evidence: docs/evidence/san-jacinto-family-camp.png, san-jacinto-mounted-reload.png and san-jacinto-art.json. Live San Jacinto proof passes **16 checks**, including alerts, Watch, smoke/guns, family participation, Host view and information asymmetry; render p95 6.8 ms. See docs/evidence/battle-san-jacinto-browser.json.

Reproduce:
- `node --test tests/san-jacinto-art.test.mjs tests/battle-view-south.test.mjs tests/battle-view-san-jacinto.test.mjs tests/avatar-identity.test.mjs`
- `node scripts/san-jacinto-art-proof.mjs`
- `npm run test:battle-san-jacinto`

Browser scripts use the standard Playwright/Chrome environment.

## Provenance and handoff

Ten selected built-in imagegen PNGs reside in public/assets/frontier-v1/atlases/. Source PNGs were copied unchanged; all spacing/identity corrections used imagegen, never programmatic raster editing. Full prompts, source references and selected paths are in scripts/art-deliveries/san-jacinto-complete-2026-10-12.mjs, docs/art-prompts.json and art-provenance.json. Atlas/animation/manifest JSON and ART_MANIFEST.md are rebuilt.

Continue family rest scene staging only from permitted projected states, preserve named identities, and retain the movement/fire interval guards when refining military actions. **5 broad dated art groups remain.** No deployment performed.

