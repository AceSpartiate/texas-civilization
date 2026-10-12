# Family horseback group complete — 2026-10-12

The September 14 horseback extension now has all four younger identities in east, south and north views: 48 frames and twelve authored walk cycles. West mirrors east. Original eight adult/adolescent identities remain unchanged.

## Complete manifest

| Atlas | Rows (four frames each) | Clips |
| --- | --- | --- |
| people-mounted-children-e | girl, boy, smallchild-with-caregiver, infant-with-caregiver | {row}-ride-e |
| people-mounted-children-s | same four rows, facing camera | {row}-ride-s |
| people-mounted-children-n | same four rows, facing away | {row}-ride-n |

Each sprite is named `{row}-ride-{heading}-{1..4}`. Each clip lasts 920 ms (four 230 ms frames), loops, is authored and has motion `none`. Footfalls, reins, cloth and tails are painted per phase. Logical height is normalized within each row; render whole rigs at MOUNTED_HEIGHT with hoof anchors, never child figureScale. Caller owns clock, position and west mirroring. Do not run a walk clock while stationary; hold a phase. Do not change travel speed to fit the illustration.

The girl retains her braid, terracotta dress and apron; the boy retains blond hair, cream shirt, brown trousers and bare feet. Both are child-sized on a full-size chestnut. Toddler and infant do not ride independently: an indigo-clad caregiver supports the toddler or cradles the infant. These are practical stylized scene depictions, not a historical portrait or instruction establishing riding eligibility.

## Production bindings and Claude continuation

School-age girl/boy join RIDING_FIGURES in public/motion.js, so uncustomized children automatically use complete painted riders in drawSeated rather than cropped standing people. Existing lazy clip loading, west mirroring, north/south orientation, whole-rig sizing and horse deduplication are preserved. Customized appearance still uses its existing path; no painting is silently substituted for inherited traits.

The six `smallchild-with-caregiver-ride-*` and `infant-with-caregiver-ride-*` clips are library-ready paired scene composites. Do not add smallchild/infant to RIDING_FIGURES: doing so invents an indigo parent and may duplicate the actual carrier. Select these only when projected carrier/passenger IDs identify the matching baseline caregiver, one horse and actual child. Draw once at carrier hoof anchor, suppress only those paired passengers/mount, preserve visibility and route authority. Other caregiver appearances need their own matched layers or compositor under the separate appearance group. Server seating/capacity and eligibility are unchanged. This closes the requested artwork extension, not all paired-family runtime staging.

## Validation and provenance

16 targeted tests pass: complete inventory, 100% retained alpha and zero trimmed pixels in all 48 frames, stable row scale, correct direction selection, no duplicate horse and no invented unpaired caregiver. Browser proof renders all frames, twelve clips with four distinct pixel phases each, and west-mirrored production selections; zero page errors. See docs/evidence/mounted-children-art.png and .json. Reproduce with `node --test tests/mounted-children-art.test.mjs tests/riding.test.mjs tests/motion-binding.test.mjs` and `node scripts/mounted-children-art-proof.mjs` with the standard Playwright/Chrome environment.

Built-in imagegen used existing children and mounted cast as references. East sheet underwent tool-based spacing correction; selected PNGs copied unchanged. Full prompts, original/selected source paths and reference roles are in scripts/art-deliveries/mounted-children-complete-2026-10-12.mjs and docs/art-prompts.json / art-provenance.json. Public assets are under public/assets/frontier-v1/atlases/. No raster postprocessing or simulation changes. No deployment performed.

**7 dated parent artwork groups remain**, including the separate semantic appearance, military action and wagon/travel contracts.

