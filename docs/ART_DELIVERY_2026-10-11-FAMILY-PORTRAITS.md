# Family portraits — complete September 15 group

All twelve standard cast portraits are delivered: `portrait-rust`, `portrait-teal`, `portrait-elder`, `portrait-blue`, `portrait-rust-woman`, `portrait-indigo`, `portrait-ochre`, `portrait-blue-girl`, `portrait-girl`, `portrait-boy`, `portrait-smallchild`, `portrait-infant`.

The transparent painted busts match the established cast clothing, hair, hats/bonnet and ages. Expressions are neutral; portraits convey identity, not personality or ability. The toddler and infant remain visibly young. These are intentionally held UI portraits, not world animation frames.

## Manifest and integration

- Image: `public/assets/frontier-v1/atlases/family-portraits.png`, copied unchanged from built-in imagegen output.
- Delivery specification and full prompt/refinement/source records: `scripts/art-deliveries/family-portraits-2026-10-11.mjs`; synchronized `docs/art-prompts.json`, `docs/art-provenance.json`, atlas and library manifests.
- Twelve measured alpha crops, each above the requested 192-pixel resolution. Runtime scales to 192, 56 or 44 pixels; no destructive image resampling.
- `public/family-panel.js` already selects `portrait-<figure>`; no alternate character selector added. Its stale stand-in comment is corrected.
- **Customized appearances still use `drawAvatarPortrait`**, which crops the same painted figure and inherited colors used in the world. Do not replace that path with these fixed standard busts: additional appearance-specific portraits belong to the layered-appearance group.
- Retired all twelve old portrait SVGs, sheet and registry entries. The legacy generator cannot recreate them while the registry entry is retired. Also removed eleven stale mark/tool duplicates whose painted replacements were already delivered; the empty stand-in manifest remains valid for the loader.

## Verification

`node --test tests/family-portrait-art.test.mjs tests/claude-standins.test.mjs tests/family-panel.test.mjs`: **18 passing**. Complete inventory, alpha corners, zero trimmed pixels, 100% retained silhouettes, source retirement, correct square fitting and identity-preserving missing-art fallback.

`scripts/family-portrait-art-proof.mjs`: **48 successful production draws**, all twelve world identities beside their portraits at 192/56/44 pixels, 24 distinct small renders, no page errors. Visually reviewed `docs/evidence/family-portrait-art.png`; machine evidence in the adjacent JSON. This is a production-renderer fixture served by the real classroom server, not a claim of a complete multiplayer playthrough.

The broad backlog falls from 19 to **18 dated parent groups**. No deployment is included. The pre-existing broader gale/scattered-sprite audit issue documented in the roof delivery is outside this change.
