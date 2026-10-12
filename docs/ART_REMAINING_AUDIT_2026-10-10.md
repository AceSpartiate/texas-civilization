# Remaining artwork audit — 2026-10-10

**8 dated parent request groups remain on the broad art backlog.** This counts explicit remaining artwork and explicitly recorded breadth/action refinements in `ART_REQUESTS.md`; it does not count sheets, delivery batches, renderer work, or gameplay integration. Several groups below are refinement/breadth rather than missing original core assets. This is therefore a broad backlog count, not a claim that all eight remaining contracts are undelivered.

The completed infant passenger delivery does not close the September 25 travel parent: adult seated layers and generic infant-carrying walks remain. Child passenger art is delivered (18 frames); adult passengers and carried infants must not be inferred from that delivery.

| # | Dated parent request | Missing artwork / explicit refinement | Evidence and limits |
| --- | --- | --- | --- |
| 1 | September 26 — famous people | Scene-specific named action refinements remain recorded. Milam's firing selection still uses cover/advance poses; remaining mounted action/faster-gait refinements are listed. | `ART_REQUESTS.md` famous-person request and named-roster stand-in row; `public/battle-view.js` Milam `fire` maps `milam-cover`, `milam-advance`, `milam-cover`. **Refinement-only:** roster identities and cardinal foot art delivered. Johnson north/south frames and clips exist in `scripts/art-deliveries/famous-johnson.mjs` and `atlas.json`; missing directional runtime bindings are not missing art. |
| 2 | September 25 — Alamo | Cardinal parapet fighting/loading; requested night/dawn grades; upright-lance march/idle; mounted trot refinement; specific north/church gun refinement. | Request items 3, 4, 6, 7 and guns stand-in row. `military-life-2026-10-03.mjs` provides mounted walking, not trot; `cavalry-actions-2026-10-03.mjs` charge does not supply upright-lance march/idle. Ladders, heavy guns, canister, red flag, smoke and pyres delivered. San Fernando exterior architecture is delivered in the October 11 civic group; battle flag alignment is implementation. |
| 3 | September 25 — San Jacinto | Full mounted reload and family-specific rest/sleep appearance refinement. North/south generic firing delivered October 12. | Mounted stand-in row and October 3 remaining-portions note. `military-life-2026-10-03.mjs` has cardinal riding plus east firing; generic healthy camp, stacks, breastwork, field guns, marsh edge and wading delivered. **Refinement-only** relative to original generic request. |
| 4 | September 25 — riders, walkers and cart | Adult seated passenger layers; wagon cover/tail drawn back; cardinal generic infant-carrying walking composites. | Request items 2–3. `child-passengers-2026-10-10.mjs` covers girl, boy, smallchild; infant passenger delivery adds six frames and three loops. `open-cart-complete-2026-10-07.mjs` completes cart vehicle portion. Susanna/Angelina composite does not satisfy generic family carrying. |
| 5 | September 16 — driving ox wagon | Age-specific child driver layers; the explicitly requested composite yoked wagon/ox directional rig. | Request and stand-in row. `wagon-drivers.mjs` and `cast2-wagon-drivers-2026-10-08.mjs` complete established eight driver identities. Existing separated rig drawing does not establish delivery of the requested composite artwork. |
| 6 | September 14 — family horseback | Child/infant mounted identities. | Child-riding stand-in row; `mounted-family.mjs` delivers 96 frames for eight established identities, not children/infant. **Extension:** original eight-identity contract delivered. |
| 7 | September 12 second — settling in | Semantic appearance masks/aligned layers, task/combat/seated refinements across offered head silhouettes. | Explicit layered-people contract. `family-appearance-2026-10-02.mjs` delivers painted complete figures with simple work/rest, not explicit skin/hair/clothes semantic layers or complete task/combat/seated sets. Houses/interiors/furnishings/tools completed. |
| 8 | September 25 — battle pieces | Family identity firing, wounded/fallen and identity-specific transport; generic mounted directional/full-reload refinement. | Request item 1 and transport stand-in row; `public/battle-view.js` `memberPose` uses volunteer combat art. `military-life-2026-10-03.mjs`, `fallen-transport-2026-10-04.mjs` complete generic living/dead transport, not identity-specific composites. Cannon/settler crew/flag completed. |

## Delivered artwork excluded from the count

Updated October 11: both researched Béxar civic façades are integrated, with historical limits documented. See `ART_DELIVERY_2026-10-11-BEXAR-CIVIC.md`.

Updated October 11: cottonwood/sapling gust pairs close the generic norther refinement; all recorded gale artwork is delivered. See `ART_DELIVERY_2026-10-11-NATURE-GALES.md`.

Updated October 11: all eight standard family portraits delivered, alpha-reviewed and stand-ins retired. See `ART_DELIVERY_2026-10-11-FAMILY-PORTRAITS.md`. Customized appearance layers remain under their separate parent request.

The September 24 two-pen roof request is complete as of this delivery: three join states, ridge registration and production composition. See `ART_DELIVERY_2026-10-10-ROOF-JOINS.md`.

Gonzales before the fight is complete at the requested art level: seated painting, spades, smith actions/props, cardinal river gestures, letter reading, bundle walking, flag variants and approach props have delivery modules. Unstaged seated painting or watch clips are gameplay work.

Coleto/Goliad has prone marksmen, prisoner art plus second identity, Alavez, baggage carts and white flags. Generic marsh, crowbar directions, children dialogue, army camps, household tools, guided marks, panel marks, open cart vehicles and general felled timber are delivered.

Seguín ashes storyboard, courier dismount, ferry loaded state, wildlife, acequia/fence pieces and catalog-only camp chores may await triggers, placement or scene semantics. Their artwork exists and they are not additional missing-art groups. The retired traveller marker is withdrawn.

## Evidence method

Read `docs/ART_REQUESTS.md` together with actual `scripts/art-deliveries/` inventories, `public/assets/frontier-v1/atlas.json`, `public/weather-art.js`, `sim/woods.mjs` and `public/battle-view.js`. Status paragraphs and stand-in comments are often stale. Missing renderer bindings were not treated as missing artwork. Counted broad refinements are labelled above to avoid presenting the number as sixteen wholly undelivered core contracts. No artwork or runtime files were changed in this audit.

Updated October 11: Fort Velasco, Harrisburg Steam Mills and the Nacogdoches Stone House close the complete September 16 researched-building group. See ART_DELIVERY_2026-10-11-TOWN-LANDMARKS.md.

Updated October 11: five regional tree silhouettes and matching authored wind pairs close the September 19 country artwork group. See ART_DELIVERY_2026-10-11-BIOME-SPECIES.md.

Updated October 11: the remaining colony hardwood identities and pecan stump close the September 15 colony-tree parent. See ART_DELIVERY_2026-10-11-COLONY-HARDWOODS.md. Mature breadth sprites scale at existing sizes.

Updated October 11: all eight other-side house drawings delivered and measured. Full-house selection/chimney migration remains compositor work, not missing art. See ART_DELIVERY_2026-10-11-HOUSE-OTHER-SIDES.md.

Updated October 11: all remaining house plot artwork is delivered. Jacal stages and shed frame are integrated; double chimney/floor/loft remain library-ready for compositor adoption. See ART_DELIVERY_2026-10-11-HOUSE-CONSTRUCTION-COMPLETE.md.

Updated October 11: regular loophole service, four townsfolk walk cycles and eased calendar-driven moonlit grade close the remaining Béxar battle artwork. See ART_DELIVERY_2026-10-11-BEXAR-BATTLE-COMPLETE.md.

Updated October 12: remaining Concepcion/Grass Fight artwork delivered: 31 frames, seven authored loops. Mission and cut-bank bindings are live; bend and transport kit are library-ready pending geographic/scene registration. See ART_DELIVERY_2026-10-12-CONCEPCION-COMPLETE.md.

Updated October 12: southern-fight moonless field grade and directional mounted service/charge artwork are delivered. See ART_DELIVERY_2026-10-12-SOUTHERN-FIGHTS-COMPLETE.md. Full reload and named/family appearance contracts remain separate.
