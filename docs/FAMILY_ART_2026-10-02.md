# Family creation and age-aware art — 2026-10-02

The parent studio now keeps a large world figure beside compact skin, hair and clothing swatches and six painted headwear cards. Turn previews front, east, back and west; See walking uses the same registered directional clips as the map. Save advances to the next parent or completes the family. The supported desktop layout keeps the Save button visible at 1366×768.

## Delivered art

Ten transparent PNG atlases in `public/assets/frontier-v1/atlases/people-family-*.png` add 160 frames and 120 clips. Eight figures cover felt hat, beard without hat, moustache, straw hat, braid, loose hair, headscarf and a woman's straw hat. Two figures cover adolescent boys and girls. Existing painted bareheaded men, hat-and-beard men, bonnet women and pinned-hair women supply the other four parent choices. Every offered head choice now selects a distinct identity.

The two delivery modules are `scripts/art-deliveries/family-appearance-2026-10-02.mjs` and `family-felt-hat.mjs`. Original and refinement prompts and source paths are recorded there and in `docs/art-prompts.json` / `docs/art-provenance.json`; the built-in imagegen tool produced the PNGs. Sources are copied unchanged. All sheets pass real-alpha, component, retention and overlap checks without relaxed thresholds. The generated `docs/ART_MANIFEST.md` lists every frame and clip.

Each new identity has east, south and north walking, standing front/east/back, a two-pose work cycle, seated rest, non-graphic injured rest and a spare quiet pose. West uses a mirrored east view. Standing/listening/speaking aliases use breathing motion; they are not newly painted lip-sync frames. Some gait changes are modest. Task-specific tools and separate mounted or wagon-seat rigs can be refined later; the new identities currently use the established composite seat path.

## The child fix

`public/avatar-identity.js` is the shared age-aware selector. `public/avatar-art.js` uses it for creation, world figures and family portraits; `public/app.js` remaps presentation poses through `avatarBinding`. Numeric age follows the simulation's boundaries: infant under two, toddler two–four, child five–nine, youth ten–seventeen and adult from eighteen. Projected `band` takes priority. Existing infant, toddler, boy and girl art remains in use, with the new adolescent figures between children and adults.

Previously the family portrait ignored age, and appearance rendering selected adult variants; some unsupported child conversation and work poses also fell back to an adult. Both paths now retain the young silhouette. `public/motion.js` uses a child idle/rest pose if a child action has no dedicated art. The palette pass now applies inherited skin, hair and clothing pigments to child sheets as well as parent sheets. The infant's basket and neutral wrapping retain their authored material colors. Beard pigment is kept separate from skin.

The simulation's deterministic inheritance remains authoritative: a child's skin falls within the parents' range, hair comes from a parent other than grey hair, and clothing comes from the family colors. No saved appearance keys, wire indices, age rules or gameplay stats changed. Existing saves pick up the new presentation automatically.

## Continue development

- Keep `avatarBinding` as the single appearance pose remapper. Do not replace it with a regex that picks an adult for every family member.
- Pass the entity, including `band` or numeric `age`, to `drawAvatarPortrait` and `drawAvatar`; a look by itself has no age.
- Keep head-choice silhouettes consistent through new work, combat, dialogue and transport art. The simple work and breathing aliases are documented above.
- Do not add an adult fallback for unavailable child actions. Add age-appropriate frames or retain their existing young idle/rest silhouette.
- Run `node scripts/register-delivered-art.mjs`, `npm run build:art`, the appearance/palette/motion/art tests, `scripts/looks-browser-proof.mjs` and `scripts/family-age-art-proof.mjs` after extending this family.

Browser evidence is in `docs/evidence/looks-popup.png`, `looks-popup-mother.png`, `looks-browser.json`, `family-age-art.png` and `family-age-art.json`.
