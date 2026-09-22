# Opening tutorial usability repair

The owner authorized changing earlier interface decisions to make the opening understandable. This pass changes the guided farm opening after family creation; it does not redesign the family-creation wizard or accelerate the shared historical clock.

## Findings and changes

1. **The highlighted action was chosen by list order.** The old rule selected the first permitted action, even travel or rest. The guide now ranks actions by the actual step, excludes already active work, and points to fencing while a harvest is unavailable. General permission and recommended action are separate.
2. **Instructions did not locate their controls.** The tutorial now has a named “Show…” button. It selects the appropriate available family member, focuses the existing action and opens its explanation. It can find another adult when the current person cannot do the job. It does not issue work, answer a choice, or complete a step.
3. **House planning was an unexplained prerequisite.** During delegation/building, when there is no plan, the guide opens the existing house-plan control before recommending work. The plan remains the player's choice.
4. **Map placement was a hidden second interaction.** While the site, survey or house panel is open, the guide explains the map click, review and confirmation sequence and offers to locate those controls.
5. **Work questions and waiting were hard to distinguish.** A worker's pending question gets an “Answer [name]” link. Paused classes, arrival and ongoing work receive explicit guidance. The action bar labels the recommended and active actions without requiring a hover.
6. **The closing card was discarded.** `lessonShowing` intentionally disables lesson restrictions on completion; previously this also hid the server's completion message. Rendering now shows that message while releasing the restrictions.
7. **The lesson gate accepted inconsistent action names.** Map chores now accept both their existing bare placement command and their `chore:` spelling in the relevant steps. Important correction to the earlier HANDOFF diagnosis: actual `#survey-send` clicks already submit the bare name, so the old map-confirmation route was not blocked by the claimed prefix bug. Both routes are now covered without removing the original route.
8. **Selling instructions contradicted the simulation.** Text now says food or coin payment counts, matching the existing server rule, and no longer falsely claims every successful sale brought home coins.

## Changed implementation

- `public/lesson.js`: objective-specific recommendation priorities.
- `public/app.js`: contextual guide target, navigation handler, work-question/waiting guidance, completion rendering.
- `public/index.html`, `public/style.css`: guide help, navigation button, action labels.
- `sim/lesson.mjs`: action aliases and truthful sale wording.
- `tests/lesson-usability.test.mjs`: regression cases for gate compatibility and incorrect highlights.
- `scripts/lesson-browser-proof.mjs`: checks the navigation control sends only selection, focuses the real action, preserves the step, displays completion without locks, and fits a phone.

## Evidence

The two new regression tests were run against the original implementation first: both failed (house/felling spelling refusal and travel highlighted instead of harvest). They pass after the repair. The existing complete simulation tutorial walkthrough and real-land site/well test pass as part of the 26 focused lesson tests. Full `npm test`: **868 passed, zero failed**; log: `test-results/tutorial-full-suite.log`.

Browser proof: **17 checks passed**, no page errors, at 1366×768 and 390×844. See `docs/evidence/lesson-browser.json` and `test-results/lesson-step.png`, `lesson-phone.png`. The browser proof uses the real opening/order path plus controlled snapshots for selected states. It does not claim ten steps completed entirely through browser clicks or a physical Chromebook classroom trial.

## Claude's next work

- Play all ten steps through the browser on the real province map, including a small family and a family without nearby timber. Automate the actual clicks, not only projected tutorial states.
- Add precise remaining-work/ripening estimates to the server projection. Current waiting guidance explains waiting but cannot give a reliable completion time the server does not supply.
- Audit the harvest gate against seasonal time jumps. The existing design can strand a family if the shared historical calendar outruns its crop; this pass did not change simulation pacing.
- Reduce the nineteen-icon opening bar further with progressive disclosure after classroom observation. This pass labels the current action and provides a direct locator; the full bar remains available.
- ~~Review the roll/name/appearance/wagon wizard separately. This repair concentrates on the farm tutorial, where the class's reported confusion occurred.~~ **Done 2026-09-21**, to this same rule: [FAMILY_CREATION.md](FAMILY_CREATION.md), amendment 2026-09-21. It found that this pass's own change had made the title card untrue (it still promised the country was yours to work), that the stock choice never said it brings a herd, that "anything left out is not coming" is contradicted by every blacksmith, and one more hidden second interaction (a **Loaded** button that unloads). `tests/creation-words.test.mjs`, 16 of 16 injections caught, `npm run test:creation` 9 checks.
- Keep the navigation button independent of progression. Only the server's actual completed work advances a lesson; always allow live historical conversations and family responses.


## Second usability pass — 2026-09-21

Unreleased working-tree changes following the owner's request to continue improving intuitive play:

1. **Portrait selection:** a single click now sends the existing `set-main` command for an eligible person, follows them, and opens their card. Previously the card could describe the mother while the bar still ordered the father; choosing the bar required a star or double-click. Removed the double-click handler. Accessible portrait names and pressed state describe selection.
2. **Readable actions:** every button now contains its action name, on desktop and phone, during and after the lesson. Current work is prefixed **Now:**. Stable 76px targets scroll horizontally rather than shrink. Unavailable pictures are muted while lettering remains readable; server refusal explanations remain available.
3. **Conversation clearance:** docked cards measure the actual bar and navigation bounds; the resize observer also watches action groups. Phone answers no longer sit behind the taller bar. Floating desktop cards retain their existing placement logic.
4. **Regression proof:** family-panel browser checks now verify single-click adult selection and phone selection, and visible names for all actions. The lesson proof measures real label boxes instead of obsolete pseudo-elements and checks phone conversation/bar clearance.

`public/app.js` and `public/style.css` contain the implementation. `scripts/family-panel-browser-proof.mjs` and `scripts/lesson-browser-proof.mjs` contain browser coverage. `docs/FAMILY_PANEL.md` records the intentional changes to previous UI guidance.

Validation: full `npm test` **920 passed, zero failed** (`test-results/usability-suite.log`). Browser evidence is in `docs/evidence/family-panel-browser.json` and `docs/evidence/lesson-browser.json`; screenshots include `test-results/lesson-step.png`, `lesson-phone.png`, and `family-panel-phone-open.png`. Regression injections served only to isolated test browsers: restoring the old no-selection behavior fails the adult single-click assertion; hiding action names fails the visible-label assertion. Restoring the old fixed phone dock also fails the new conversation-clearance check. None of these injections changes production files. These are local Chrome checks, not classroom acceptance.

Remaining work for Claude: action grouping/search remains worthwhile for long bars. Young children still use their existing cards rather than becoming the server's main person; a future separation between inspected person and main person would let their own chores occupy the same bar without changing age restrictions. The full real-map ten-step tutorial walkthrough and seasonal pacing concerns listed above remain open. Nothing was deployed or released in this pass.
