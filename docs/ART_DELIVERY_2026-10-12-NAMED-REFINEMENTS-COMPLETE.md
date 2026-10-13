# Famous-person refinements — complete September 26 artwork group

100 usable frames, 32 authored loops and ten transparent atlases finish the recorded named-roster refinements. The original named identities, foot directions, leadership/story actions and cardinal mounted walking were already delivered. This closes Milam's firing stand-in, the four remaining relief/courier riders' faster gait and mounted dispatch actions, and warranted Kimbell/Martin fallen art. This is completion of the existing roster contract, not every possible character or future historical scene.

## Manifest

| Sheets | Frames | Layout and naming |
| --- | ---: | --- |
| `named-<id>-trot`, ids `jw-smith`, `horton`, `kimbell`, `martin` | 12 each; 48 total | Four columns of trot phases; rows east, south, north. `<id>-mounted-trot-<e/s/n>-<1..4>`; matching clips omit suffix. |
| `named-<id>-mounted-dispatch`, same ids | 8 each; 32 total | Row 1: east offering/retracting dispatch, then south offering/retracting. Row 2: north offering/retracting, then east healthy halted rest poses. `<id>-mounted-dispatch-<e/s/n>-<1/2>` and `<id>-mounted-rest-e-<1/2>`; matching clips omit suffix. |
| `named-milam-fire-service` | 16 | Rows east, west, south, north; columns aim, fire, load, ramrod. `milam-service-<e/w/s/n>-<phase>`; four `milam-fire-service-<heading>` clips. No baked barricade. |
| `named-relief-fates` | 4 | Two columns, two rows: Kimbell fall/still, then Martin fall/still. `<id>-fall-relief`, `<id>-still-relief`. Static fate key poses, never idle loops. |

All required PNGs are under `public/assets/frontier-v1/atlases/`. Exact source paths, prompts, style references and correction history are in `scripts/art-deliveries/named-refinements-complete-2026-10-12.mjs`, `docs/art-prompts.json` and `docs/art-provenance.json`. Generated using built-in image generation; PNGs copied unchanged. `atlas.json` records measured bounds and alpha audit; `animation.json` supplies durations and clip IDs; the generated `ART_MANIFEST.md` lists every asset.

Trot is four painted phases at 180 ms each; dispatch two poses at 900 ms each; healthy rest two poses at 1100 ms each. Milam uses existing visual timing: 1500 ms aim, 300 ms fire, 900 ms load, 900 ms ramrod. These timings are animation choices, not claims about a historical firing rate or exact mounted drill. All loops use `motion:none` with actual painted changes rather than stretching figures. Logical heights are normalized across each cycle; Milam's standing aim height determines his scale so the raised ramrod does not shrink his body. West mounted views mirror east; Milam has independently painted west service.

## Production bindings and Claude continuation

Milam's battlefield `fire` pose now selects cardinal service from projected `aimHeading`; he no longer advances as the firing animation when the new sheet is available. The old cover/advance array is retained solely as a loading fallback. Death, movement, captions, lines, smoke/flash and information authority keep their existing staging.

`namedMountedRefinement` is shared by battle and campaign renderers. Normal moving riders keep their already delivered walking gait. An explicit projected `gait:'trot'` or `trot:true` can select the new trot; a halted rider with `mountedAction:'dispatch'` selects the appropriate dispatch heading. Neither flag is invented from historical date, destination, distance or asset availability. Halted east/west riders select healthy rest on their actual horse. North/south campaign travel uses the already delivered cardinal walking clips when a heading is projected; halted cardinal campaign horses hold a walking key pose rather than walking in place.

**Library-ready scene work:** the existing projection does not add new urgent-gait or mounted-dispatch flags in this delivery. Claude can add those to explicit researched itinerary beats, keeping horse pace, route distance and animation clock aligned. A dispatch sprite must not imply a message was delivered before the server encounter does so. Do not play a stationary dispatch horse while its rider continues moving. Do not use faster leg animation to disguise a fast-moving world position.

Kimbell and Martin have separate `PERSON_ART.fall` and `.still` assets. Their availability does not add a death beat or place a body: their currently staged mounted relief arrival is preserved, and aftermath placement must be explicitly projected at an appropriate historical time. No new wounded status is inferred from the fall transition. John W. Smith and Horton receive no invented death art. The other roster figures' missing gait *bindings* and already delivered story poses are renderer work, not missing art. Broader cast outside the defined roster or a newly requested scene is future scope.

## Historical limits

Faces, clothes, horse colors, tack and dispatch appearance are established game interpretations, not portrait or equipment evidence. [Kimbell's Handbook entry](https://www.tshaonline.org/handbook/entries/kimbell-george-c) and [Martin's entry](https://www.tshaonline.org/handbook/entries/martin-albert) record their deaths at the Alamo on March 6, 1836; they do not establish the exact posture, location or manner depicted by these key poses. Use non-graphic treatment and preserve existing date/fog-of-war/fate rules. Do not add fallen poses for officers who survive or invent on-screen executions for figures whose deaths are currently told off-screen.

## Verification

41 targeted tests cover complete alpha retention, animation scale, explicit gait/action selection, actual battlefield bindings, named roster itinerary/visibility and Béxar views. Browser proof draws all 100 frames and checks distinct rendered phases for every one of the 32 loops, with zero page errors. Every new silhouette retains all audited visible pixels with zero trimming; rejected crowded versions were corrected through image generation rather than relaxed thresholds. Existing atlas frames and animation clips are checked against HEAD for unintended changes.

Run `node --test tests/named-refinement-art.test.mjs tests/famous-people-view.test.mjs tests/famous-people.test.mjs tests/famous-field-art.test.mjs tests/battle-bexar-view.test.mjs`; browser art proof is `scripts/named-refinements-art-proof.mjs`, evidence `docs/evidence/named-refinements-art.json` plus ten sheet previews. Live Béxar proof is `npm run test:battle-bexar`, using the project's local Chrome/Playwright environment. No deployment performed.

**Two broad dated art groups remain:** semantic family appearance/task breadth and identity-specific family battle/transport artwork.
