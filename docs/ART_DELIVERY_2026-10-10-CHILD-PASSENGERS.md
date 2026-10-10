# Animated child wagon passengers

Completed group: girl, boy and smallchild/toddler seated passengers, matching the existing painted child art. Eighteen transparent frames across three atlases supply nine authored two-pose loops. East is mirrored for west; north and south have dedicated views. Each frame lasts 750 ms. Subtle torso and lap-hand movement keeps the figures seated rather than walking inside the cart.

Atlases: `child-passenger-girl.png`, `child-passenger-boy.png`, `child-passenger-smallchild.png` under `public/assets/frontier-v1/atlases/`. Clip IDs are `<girl|boy|smallchild>-wagon-passenger-<e|s|n>`; frame IDs append `-1` or `-2`. All are registered in the atlas, animation and art manifests. Exact generation/edit prompts, the existing child reference and selected source paths are recorded in `scripts/art-deliveries/child-passengers-2026-10-10.mjs` and generated prompt/provenance records. Selected PNGs were copied unchanged.

`public/motion.js` selects passenger clips separately from drivers and horseback riders. `bedLayout` accepts an optional seated flag, preserves passenger ordering and offsets, and uses 0.65 of the existing age-scaled figure height with the hip positioned at the visible wagon rim (0.86 wagon height). Existing child age scales remain 0.7 and 0.55. `public/app.js` renders the complete seated silhouette with inherited skin, hair and clothing colors. Pause and reduced motion hold animation. If a clip is unavailable, the old passenger drawing remains available.

Infant and adult seated passenger artwork is still outstanding. This delivery does not supply child driving or horseback animation, alter family traits, or change transport simulation. Reuse these clips only as seated passengers.

Validation: `node --test tests/child-passenger-art.test.mjs tests/riding.test.mjs tests/children-dialogue-art.test.mjs` passes all 11 tests. They cover directional selection, age scale, unchanged driver/infant behavior, passenger ordering, complete pixel retention, transparency and authored loops. Atlas generation succeeds.

`scripts/child-passenger-art-proof.mjs` uses the production loader and seat geometry to render all 18 distinct poses, an inherited palette variant and a toddler in the existing open cart. Evidence: `docs/evidence/child-passenger-art.png` and `.json`. The reviewed browser fixture confirms the visible rim position and palette changes; it is not a full gameplay playthrough.
