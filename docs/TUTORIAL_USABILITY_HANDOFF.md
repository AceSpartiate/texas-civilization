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
- Review the roll/name/appearance/wagon wizard separately. This repair concentrates on the farm tutorial, where the class's reported confusion occurred.
- Keep the navigation button independent of progression. Only the server's actual completed work advances a lesson; always allow live historical conversations and family responses.
