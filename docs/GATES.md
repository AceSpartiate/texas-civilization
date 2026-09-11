# Foundation acceptance record

Run order is A → B → C → D. This file records acceptance as it happens; a later rerun does not imply the later implementation existed during an earlier gate.

## A — accepted for development, 2026-09-08

`npm test` passed the network regression. `npm run test:browser` ran Chrome 152 on Windows, with five isolated browser contexts connected to **192.168.4.38**, the physical adapter address. Every client received ticks 1–100, with 111 observed unique ticks at the checkpoint. Refresh, temporary offline/reconnect, and Host pause/resume passed with no browser errors. Restart/identity persistence, idempotent commands, unauthorized control rejection and seeded initialization passed in automated server tests.

Evidence: [gate-a-browser.json](evidence/gate-a-browser.json). Run procedure and launch architecture: [DEPLOYMENT.md](DEPLOYMENT.md).

**Evidence boundary:** all five browsers ran on this development computer. Independent physical-device LAN reachability is **NOT YET TESTED**. Actual district network is **NOT YET TESTED**, mandatory before classroom deployment. Continuing to Gate B treats this as the strongest practical local transport proof available here; it is not a claim of full physical LAN acceptance.

## B — accepted, 2026-09-08

Three automated A/B tests passed. The browser extension followed one principal's ID from home, onto the regional route, into Gonzales, and through a destination refresh. Actual canvas output was inspected. Disk save/load preserves mid-journey location, subsequent arrival, wagon and ox. Evidence: [gate-b-browser.json](evidence/gate-b-browser.json). The placeholder asset contract is in [ASSETS.md](ASSETS.md).

## C — accepted, 2026-09-09

Household/public wire isolation, different report text/status, actual courier arrival, received/observed ages, browser mutation isolation and knowledge/identity persistence passed in five-browser testing. A live-browser server restart also passes after shutdown connection cleanup was hardened. Evidence: [gate-c-browser.json](evidence/gate-c-browser.json). Resolver tests preserve slow unresolved travel, service, away/borrowed damaged wagon, relationships, prior knowledge and existing deaths, while progressing food/minor health. Equal seed and inputs give equal results. Registered major events and significant arrivals interrupt compression; blocked retries are no-ops.

## D — accepted, 2026-09-09

The five-browser slice runs from a real lobby and Start command with no manual state edits. One household helps and travels, another refuses and prepares at home. Gathering and battle phases advance automatically, the October 2 macro-outcome stays anchored, the Host waits for public news and shows a labeled reconstruction, and both choices create persistent memory. Pause during exchange, offline/reconnect, disk checkpoint equality, live server restart, Host reload and a narrow viewport passed. Screenshots of travel, battle, Host reconstruction and preserved consequence were visually reviewed. Evidence: [gate-d-browser.json](evidence/gate-d-browser.json).

Headless tests additionally trace the full causal ancestry, preserve the outcome when all 30 households refuse or remain idle, prove deterministic runs, prevent repeated requests, require physical return journeys and preserve existing death/capture/injury through later consequences. The suite also covers storage faults, exclusive save ownership and cross-session cookie isolation.

## Deployment hardening and first independent device, 2026-09-09

Launcher and lifecycle work, verified on this workstation. `scripts/verify-launcher.ps1` passes eight checks in an isolated copy: startup in a path with spaces, log survival after the launcher exits, verified process reuse, graceful stop releasing the save lock and keeping the checkpoint, a safe no-op stop of an already-stopped class, preference for a checksum-matching bundled runtime, refusal of a runtime that does not match its recorded checksum, and safe rejection of an unrelated listener plus timeout cleanup. Twenty-two Node tests pass, including new coverage for class-data-folder resolution, host-only graceful stop with a checkpointed pause, and New Class archiving.

`runtime/node.exe` is now bundled from `node-v24.18.1-win-x64.zip`, verified against the published `SHASUMS256.txt` before acceptance, with the Node `LICENSE` included and the build record in [evidence/runtime-manifest.json](evidence/runtime-manifest.json). The binary matched the one already installed on this machine byte for byte.

**`Launch.vbs` and `Stop.vbs` were both run through `WScript.exe`**, the real double-click path, and both succeeded: the launcher exited 0, the server started, the default browser opened the Host page, and the stop helper closed the server and released the lease. This closes the previously recorded VBS/default-browser gap **on this unmanaged computer only**. District application-control policy remains untested.

**First independent physical device.** A phone at `192.168.4.114` joined over `http://192.168.4.38:1835/` and was assigned its own household; an established TCP connection between the two addresses was recorded. The class ran to tick 102 and the operator confirmed on the device that the family and the Gonzales request appeared. Full record, including what this does **not** establish, is in [evidence/lan-independent-device.json](evidence/lan-independent-device.json). Verdict: **PARTIAL PASS — one device, not five, not thirty, not a district network.** Four of the five households were joined from the teacher computer to satisfy the Start minimum.

Two findings came out of it: a backgrounded mobile tab drops the stream and recovers automatically on return, which classroom guidance must describe as normal; and the player could not tell which character they were directing.

## Gonzales content, identity recovery and trading, 2026-09-09

Work accepted after the four gates, recorded here in the order it was built. None of it changes what Gates A–D established; each item names its own evidence and its own boundary.

**Farm work.** A chore became an ordered list of data steps run by one interpreter, so adding work means adding a table entry. A family plants and harvests corn or cotton, hunts in the timber, fetches seed from Gonzales, and mends or replaces a worn hoe. Every family member can be sent and each has a fixed aptitude. **The whole path contains no randomness**, because `FIC-GONZ-008` requires an outcome to resolve inside a visible risk. `schemaVersion` and `saveVersion` moved to **3**. A failure found and fixed during this work is recorded in `HANDOFF.md`: a chore was merely frozen during travel, so a principal who accepted the Gonzales request mid-planting resumed hoeing at Gonzales and was then carried home by the chore's own `walk` step without a journey.

**The town, and the first shared visibility.** Three invented residents (`FIC-GONZ-009`) live in Gonzales, move about it, and are who a student actually trades with; a trip to buy from nobody fails and says so. With them came `observedBy()`: a household sees anyone standing where one of its own people is standing, filtered on the server to who they are, where they are and what they appear to be doing. Another family's stores, skills and errands, and a courier's message, never reach the wire. The privacy assertions were checked by injecting a careless spread into the observation mapper and watching them fail.

**Art.** 22 atlases, 327 frames and 138 animation clips, measured from the shipped files rather than the delivery note. People are drawn from art rather than procedurally, and people, animals, wagons and trees are animated. **The renderer reaches 96 frames and 27 clips**; the measured table and the two gaps that are missing wiring rather than missing art are in [ASSETS.md](ASSETS.md), reviewed clip by clip against the specification in [ANIMATION_REQUIREMENTS.md](ANIMATION_REQUIREMENTS.md).

**Identity recovery and presence.** Every household has a derived **family key** that returns it to any device, working after Start, refused while somebody is actively playing that family, and throttled against guessing. A teacher can look one key up from the Host, one family at a time. The Host now reads `here` and `away` rather than a single connection count, so a locked phone is no longer indistinguishable from a student who left. Live browser proof: [evidence/family-key-recovery.json](evidence/family-key-recovery.json). **No save version moved**, because the key is derived and presence is never saved.

**Trading between households.** An offer made face to face, accepted, declined, withdrawn, or lapsing when the two part; any family member may strike it; neither family learns the other's stores. Registered as `FIC-GONZ-010`. Proved in both directions through the real interface: [evidence/household-trading.json](evidence/household-trading.json). **No save version moved**, because a class saved before trading simply had no offers — verified by loading the live `saveVersion: 3` class under the new code, stepping it and projecting it.

**80 automated tests pass**; 105 local documentation links resolve. Every test added in this period was checked by injecting the exact regression it guards and confirming that it, and only it, failed.

**Reach, and two bindings.** The journal roster gained an *Also here* list, so a neighbour can be selected without the canvas; a complete trade was then carried out through DOM activation alone, which is the path a keyboard or a screen reader takes. `travelHeading()` bound the delivered north and south walk cycles, and the delivered injured pose replaced a hurt person drawn standing about. Reachable art went from 96 frames and 27 clips to **120 and 41**, and every sheet still unreachable now belongs to something the simulation does not model.

**Boundary.** All of this was exercised on one development computer, with one real browser and HTTP clients standing in for the other households. It says nothing new about physical devices. Five independent devices, thirty devices and district Wi-Fi remain **NOT YET TESTED**, and district validation is still mandatory before classroom deployment.

**Open findings from the Gate A device test.**

*"The player could not tell which character they were directing"* is **addressed, after a regression the art delivery introduced.** The principal is always named at any zoom while other labels drop away, and the selection card names whoever is chosen. The distinguishing rust coat, however, had quietly stopped applying: `miniPerson` returns as soon as a sprite draws, so the coat code ran only when the atlases failed to load — and `rust` sat in the shared palette pool, where a **neighbour** could be dealt the colour that means "this is you". `public/motion.js` now reserves `rust` for the principal and draws everybody else from a pool that excludes it, so the mark means the same thing illustrated or not, and an observed person is refused it a second time even though the projection never sends them a `principal` flag. Verified live on 2026-09-09: all four family clips drawn, art present for each, the principal on `rust-idle-s` and no sibling on it. Guarded by *"the principal wears a colour nobody else can wear, illustrated or not"* in `tests/aggregate-identity.test.mjs`, checked by restoring the old code and watching only that test fail.

*"A backgrounded mobile tab drops the stream"* is now surfaced honestly as **away** rather than silently subtracted, but it has still not been tested across a full 45-minute lesson with screen locks.

## Readiness boundary

All four foundation gates have practical development evidence. This is **PROTOTYPE**, not CLASSROOM READY.

Gate A's physical-device test has moved from NOT YET TESTED to **PARTIAL PASS**: one independent device, on an ordinary home LAN, on an unmanaged computer. Five devices, thirty devices and district Wi-Fi all remain **NOT YET TESTED**, and district validation is mandatory before classroom deployment. The bundled runtime and double-click launch are now done and verified here; a signed package and district application-control approval are not. No later historical arc was built.
