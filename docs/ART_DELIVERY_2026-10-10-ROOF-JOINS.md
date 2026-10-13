# Completed two-pen roof request

Selected the September 24 request as the smallest bounded production scope: three variants of one existing roof geometry plus ridge registration. This measures the work needed, rather than just sprite count; the two civic façades need separate historical research and building designs. Finished, partial and chimney-aperture joins are delivered, registered and used by the production house renderer. The optional alternate long-side pen view is outside this required three-piece group and remains part of the broader house-view work.

## Assets and provenance

`public/assets/frontier-v1/atlases/house-roof-joins.png` supplies `house-roof-join`, `house-roof-join-partial`, `house-roof-join-chimney`. They match the pitched clapboard roofs, warm wood textures and brown outlines of `house-modules`. Each is a complete isolated roof, without walls or posts. Construction states are rigid held clips (`motion: none`, non-looping, not authored animation); the server selects the stage. Roofs must not bob or breathe.

Generated with built-in imagegen; the selected PNG was copied unchanged. Exact prompts, original and selected source paths, and the geometry correction are recorded in `scripts/art-deliveries/roof-joins-2026-10-10.mjs`, the prompt/provenance JSON and `docs/evidence/roof-join-correction-prompt.json`. The first flat-plane version was rejected during assembled-house review. All three final frames retain every visible pixel and genuine transparent alpha.

`public/house-roof-art.js` supplies artist-reviewed ridge endpoints in padded atlas-frame pixels for both existing pen roofs and all three join states. The atlas builder embeds them as `frame.ridge`; do not reintroduce separate guessed ridge axes in the house renderer.

## Rendering

`fitRoofJoin` aligns both join ridge endpoints with the reference pen roof's ridge at a virtual pen seat. It uses positive horizontal/vertical size adjustments, with no rotation or shear. `drawSprite` accepts an optional `widthScale` for this registration; its default remains one, and house hit boxes account for the actual width.

Dog-run passages select the finished or partial join from the pens' current stage, retaining their existing floor, gap width, depth order and quarter-turn mirroring. Missing join artwork retains the prior pen-roof fallback. Saddlebag houses draw the chimney join before the chimney and near pen once roof stages are reached. The roof uses the row's original virtual seat, preserved before gable placement moves the chimney foot; moving the roof to the chimney's ground foot produces a protruding roof and misplaced opening.

Join-end framing is clipped within the overlap between roofs: 90% of the fitted ridge span for a twelve-foot passage, 65% for the narrower chimney gap. Full eaves remain across the ridge. This removes exposed middle-section ends without trimming the source atlas. Existing pen roofs still retain their own framing and texture transitions; this is modular painted art, not a single remade whole-house illustration.

House sites, footprints, rotations, construction progress and simulation are unchanged. Back-gable/end-view artwork and the dedicated two-sided double chimney are separate outstanding requests; the existing chimney depiction remains. No live deployment is claimed.

## Proof

53 tests pass across roof-join art, connected house, roof seating, chimney and rotation suites. Coverage includes exact ridge endpoint alignment, mirrored registration, clipped overlap geometry, source alpha/full pixel retention, partial/finished selection, chimney ordering and missing-art fallback. Chimney tests now distinguish a roof with a chimney opening from an actual chimney sprite.

`scripts/roof-join-art-proof.mjs` uses the production loader, real catalogue and `drawHousePlot` to render the three standalone states and twelve assembled houses: partial and finished dog-runs and finished saddlebags at all four turns. The final montage was visually reviewed. Evidence: `docs/evidence/roof-join-art.png` and `.json`. This is a rendering fixture, not a gameplay playthrough.

The broad backlog moves from 20 to 19 unfinished dated request groups. Regular loophole art was generated before the owner's instruction to switch to the smallest entire group; that draft is not registered or shipped by this delivery.

Broader library/HTTP audit: six of seven checks pass, including rebuilt-manifest equality, every frame's usable bounds, optional rendering and module/asset serving. The remaining check reports 43 existing gale-pose bindings absent from its scattered-sprite enumeration. Gale atlas entries are byte-for-byte unchanged from HEAD, and weather, woods, ground classes and this audit test are untouched. This unrelated audit discrepancy is left for Claude; the roof checks are passing.
