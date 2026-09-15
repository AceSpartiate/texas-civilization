# Continue the foundation

Read these before substantial changes:

1. `VISION.md` — permanent product identity.
2. `HANDOFF.md` — actual state, evidence, commands, limitations, next tasks.
3. `TECH.md` and `GAME.md` — implemented architecture and gameplay.
4. `HISTORY.md` before any historical content change.
5. `docs/SETTLING_IN.md` before changing the class start, the lobby, the director's timeline, or anything about houses, furniture, the wagon load or appearance — owner-decided (2026-09-12) and next to build.
6. `docs/FAMILY_CREATION.md` before touching `sim/family.mjs`, the join flow, or who can be sent to fight — the rolled family and its hidden stats are owner-decided (2026-09-12) and amend `VISION.md` §7 and §16.
7. `docs/MONEY_AND_GLORY.md` before any economy, director or ending work — money, hidden glory and the winner are owner-decided (2026-09-12) and amend `VISION.md` §20.
8. `docs/LAND_GRANTS.md` before touching a family's land, the field, clearing, fencing or the stock a family brings — land grants and Survey are owner-decided (2026-09-13) and replace the four-clearings rule.
9. `docs/COLONIES.md` before changing where families start, the arrival, news between settlements, or the timeline past October 2 — families spread across the settled colonies are owner-decided (2026-09-14) and amend `FIC-GONZ-024`.
10. `docs/WOODS_AND_BUILDING.md` before changing where timber stands, hunting, felling, logs, or how a house is planned and raised — the woods from LANDFIRE, hunting on the family's own land, felling its own trees and building from plans or pieces are owner-decided (2026-09-15) and amend `docs/SETTLING_IN.md` §5–6.

The active next phase is Gonzales/core usability and deployment hardening, described in `HANDOFF.md`. `CLAUDE_DEVELOPMENT_ROADMAP.md` is reference for later work, not an instruction to build every arc now.

Protect one authoritative world, stable person IDs, server-filtered knowledge, valid refusal, automatic Host progression and preserved consequences. Run `npm test`. Use the appropriate browser proof when changing transport/projection/interaction. Do not claim physical LAN or district acceptance from same-computer tests. Keep documentation and historical claim IDs current.

Four habits this codebase has had to learn the hard way:

- **A new test is not evidence until it has failed.** Inject the exact regression it guards, watch that test and only that test fail, then remove the injection. Several tests here were written passing against code that did not work.
- **Do not bump `saveVersion` reflexively.** Bump it when an old save would open a world that is *wrong*. When the missing field has a correct empty value — no offers, no presence — default it and leave every existing class openable. `sim/trade.mjs` is the worked example.
- **Missing art never blocks work and is never left silently wrong.** Owner's standing practice (2026-09-12): (1) write the request into `docs/ART_REQUESTS.md` in its contract format; (2) ship a **stand-in** drawn from art the library already has — the nearest figure, scaled or reused — marked in code with `stand-in:` naming the request; (3) list it under *Stand-ins in use* in that file with what replaces it. Grep `stand-in:` to find every one. When the art lands, replace the stand-in, delete its row, and keep any rule it proved (like drawing children smaller).
- **Mark a deliberate simplification with `ceiling:`**, naming the corner it cuts and what would justify undoing it. Grep `ceiling:` to find every one.

`docs/REFERENCE_ARCHITECTURES.md` records which outside projects were studied, what was taken and what was refused. Read the relevant verdict before adopting an idea from one of them, and add a new verdict rather than a survey when a new project is studied.
