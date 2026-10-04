# Gonzales smith actions and forge props

Twenty transparent frames in two sheets supply four authored four-pose action clips: `elder-smith-hammer`, `elder-smith-chain`, `ochre-smith-hammer`, and `ochre-smith-chain`. Workers stand at waist-height anvils. Hammering includes tongs holding hot iron; chain-cutting includes a cold chisel and hammer. Each actor composite includes its own anvil/stump, so do not draw the standalone anvil on top of it. Clothing and tools are interpretive game art, preserving the existing elder/ochre identities.

Four separate reusable props are `gonzales-forge-cold`, `gonzales-forge-lit`, `gonzales-anvil-stump`, and `gonzales-chain-tools`. Cold/lit are assembly states, not an authored fire animation. The active shop beat displays the lit forge with a centered ground anchor. The other props are ready for later shop assembly.

Gonzales now projects semantic `forge` during its existing shop-work beat and helper action. `gz-smith-1` and `gz-smith-4` use ochre's hammer clip; `gz-smith-2` uses elder's chain-cutting clip. Other elder/ochre helpers hammer. Moving actors retain their walking cycle. Other adult identities retain repair fallback; child figures remain age-appropriate idle. No story timing, travel speed, dialogue, outcomes, economy or visibility rules change.

Each identity shares one logical height across its hammer/chain rows to avoid resizing when tools change. Clips face east and mirror west; no north/south action views are claimed. Fine hand/foot registration and smith sounds/sparks remain polish, not new simulated work.

Exact prompts, reference paths, refinements and selected untouched generated PNGs are recorded in `scripts/art-deliveries/gonzales-smiths-2026-10-04.mjs`. `ART_MANIFEST.md` and the machine-readable catalog list every frame, duration, anchor and checksum. `tests/gonzales-smiths-art.test.mjs` checks zero trimmed silhouette pixels, transparency and live projection/clip selection. `scripts/gonzales-smiths-art-proof.mjs` draws all twenty frames through the browser renderer and verifies changing pixels in all four clips. Evidence is `docs/evidence/gonzales-smiths-art.png/.json`.

Remaining Gonzales work: seated flag painting, identity-specific spade digging, letter-in-hand reading, other cast/directional river gestures and flag variants. Other smith identities need their own authored actions before their repair fallback is removed.
