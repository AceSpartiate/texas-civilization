# Children in conversation — 2026-10-09

Completed age-specific conversation art for girl, boy and smallchild: twelve painted frames preserve the existing braided girl's rust floral dress/apron, blond boy's cream shirt/suspenders/cropped trousers, and toddler's cream smock. Their bodies remain age-specific rather than using scaled adult conversation poses.

## Manifest and animation

Sheet: `public/assets/frontier-v1/atlases/children-dialogue.png`, selected generated PNG copied unchanged. For each identity girl/boy/smallchild: `<identity>-speak-1`, `-speak-2`, `-listen-s`, `-listen-n`.

`<identity>-speak` loops two authored mouth/hand poses at 500 ms each, facing east and mirrored by the existing caller for west. `<identity>-listen-s` and `-listen-n` use one held pose with the established breathing motion, authored false. No vertical speaking cycle is claimed; this follows the existing adult conversation contract. Exact prompt/refinement and source provenance are in `scripts/art-deliveries/children-dialogue-2026-10-09.mjs` and the generated art records. Atlas, animation and manifest include all twelve frames.

`CHILD_POSES` in `public/motion.js` now allows speak/listen-s/listen-n for these three identities. `entityClip` selects them only when the existing projected speaking/facing fields request a conversation. Original child scaling remains 0.7 for girl/boy and 0.55 for smallchild. Infant fallback stays unchanged; this does not make a baby speak or change encounter participation rules.

## Verification and evidence

Eleven tests pass across `tests/children-dialogue-art.test.mjs`, `tests/figures-match-people.test.mjs` and `tests/riding.test.mjs`. The delivery test checks real entityClip selection, preserved scales, infant fallback, speech/listening registrations, transparency and complete pixel retention. `scripts/children-dialogue-art-proof.mjs` renders every pose through the production chooser, art.js and atlas loader in Chrome. Evidence is `docs/evidence/children-dialogue-art.png` and `.json`. This is an isolated production-art fixture, not a full courier encounter playthrough.

## Claude continuation

The three non-infant child conversation identities are complete. Keep these character-specific clips when changing encounters. Youth/adolescent bodies use their own existing cast; this delivery is for the child and small age bands. Vertical speaking, task poses, passenger/driving art and infant-in-arms remain separate. Do not add simulation speech, knowledge or encounter eligibility from art state; the server's permitted projection remains authoritative.
