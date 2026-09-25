# The guided beginning

**What is drawn over what:** [FAMILY_PANEL.md §12.11](FAMILY_PANEL.md) — the strip is top right and never on the family's
column; a panel that covers the column dims what it covers and says so; the names under the icons are clear of the map's
own buttons. Measured by `npm run study:overlap` at three screen sizes, gated by `npm run test:lesson`.

**The ring and the words are one instruction.** `pointedKey` ranks by the step's own work and, where nothing on the row
is that, points at something only when there is exactly one thing to point at. Guessing among several put the ring on the
survey stake at the `order` step while the strip said to choose a house plan.

**Usability update:** [TUTORIAL_USABILITY_HANDOFF.md](TUTORIAL_USABILITY_HANDOFF.md) supersedes earlier screen restrictions: a contextual navigation button now locates the relevant control, without completing a step or issuing work. Objective-specific recommendations replace first-permitted-action highlighting. Completion is visible without locking controls. Selling guidance accepts food or coin, matching the current server rule. Both bare placement commands and chore-prefixed variants are accepted for map work.

**Status: the world's half built 2026-09-21; the X added 2026-09-22.** `sim/lesson.mjs`, `tests/lesson.test.mjs`,
[injections](evidence/lesson-injections.json) (55 of 56 caught; the one that misses is a gap in the tests, named in the record). Claims `FIC-GONZ-210` to `-215`. The screen's half —
the card, the greying, the arrow onto the control being asked for — is `public/`'s and is built against the contract in
§3 below. **The guided start is no longer unavoidable:** since 2026-09-22 every student and every solo player can X it
off at any step, for their own family (§1, amendment), and for five real minutes after the first X can take it back up
on the same step with **Resume tutorial** (§1, second amendment).

---

## 1. What the owner asked for

A real class played this on Chromebooks on **2026-09-21**. It ran. The students could not work out what to do. The
owner's instruction, verbatim:

> "students couldn't figure out how to farm, or build a house, etc. we need to have the tutorial be an integrated forced
> part of the game. they shouldn't be able to have freedom until they've arrived at their farm, and been walked through
> each major function of the farming aspect. how to delegate tasks, building a house, etc. one task at a time, guided by
> the ui and unavoidable. when it's over, each student at their own pace should have built a house, farmed and sold a
> crop of their choosing, hunted, and have a well on their land."

Four things in that sentence decide the whole design, and each is held by a test:

- **Unavoidable — until the student stops it** (amended 2026-09-22, below). Not a hint, not a help page. While a step is
  running the **server** refuses every order that is not that step's, in words. The page greys the rest out from the same
  list, but the page is not what holds the gate — the same rule as fog of war and as every permission in this codebase
  (`VISION.md` §5). What changed on 2026-09-22 is that the student may end the whole lesson for their family with the X;
  while they keep it, it is exactly as strict as it was.
- **One task at a time**, in the owner's order: arrive, delegate, build, survey, clear, plant, harvest, sell, hunt, well.
- **Each student at their own pace.** The lesson belongs to one family, is stored on that family, and touches the Host's
  clock not at all. Fifteen families may be on fifteen different steps at once.
- **When it's over** the family really has those things, because every step completes when the world says so — a house
  that stands, ten acres that are cleared, coin that is in the house — and never because a page said it had.

### Amendment, 2026-09-22: the X

The owner, verbatim:

> "i should be able to X off the tutorial to stop it and just do what i want."

Asked by multiple choice who gets the X, the owner chose **"Everyone, always"**: every student and every solo player can
X it off at any step. Once off it stays off for that family, and nothing is refused any more.

As built:

- **The X** is top right of the strip (`#lesson-stop`, 36 px, accessible name "Stop the guided start"). It asks once,
  inline in the strip — since the second amendment *"Stop the guided start? You won’t be walked through the rest. For
  five minutes, a “Resume tutorial” button can bring it back."* **Yes, stop it** / **Keep going** — never
  `window.confirm`. Focus lands on *Keep going*.
- **The server does it.** The X sends `stop-lesson`, which is on `ALWAYS` (a lesson that could refuse the order to stop
  itself would be the unavoidable thing the owner took back). `stopLesson` stores `household.lesson = { step: 'done',
  at, stopped: true }`: the gate opens, and the projection's `lesson` key is **absent** at once — no closing card.
- **Only the family's own student.** The order is applied to the household the sender's cookie names, so a student can
  stop nobody's lesson but their own whatever the order carries. The Host has no household and is refused (and the Host's
  own command branch never reaches `applyAction` at all). A family whose student has gone is refused too: the director
  runs it and never presses the X on anybody's behalf. A family with no lesson running is refused in words.
- ~~**For good.**~~ Replaced the same day by the second amendment below: the X can be taken back for five real minutes.
- **The old walk-through is not offered in its place.** The page remembers it as seen when the X is pressed, so a student
  who has just said "let me do what I want" is not handed the older "New to this?" card instead.

### Second amendment, 2026-09-22: "Resume tutorial"

The owner, verbatim:

> "After closing the tutorial, show a small 'Resume tutorial' button for five real minutes from the original dismissal,
> including across reloads. Resume existing progress; quietly show dismissal/resumption to the teacher. Phones are not
> officially supported—prioritize desktop and Chromebook."

Astra's handoff of the same day (`docs/HOUSE_SELECTION_HANDOFF.md`) adds: resume the same step, never reset progress or
extend the original window; persist expiry through reloads; show dismissed/resumed status quietly in Host progress. This
replaces yesterday's `ceiling:` that the X was for good.

As built:

- **The X keeps the step.** `stopLesson` stores `{ step: 'done', from: <the step>, at, stopped: true, stoppedAt,
  resumeBy }` and keeps every marker the steps had gathered (the hunt and the sale watched). `stoppedAt` is the **real**
  time of the press, in server milliseconds; `resumeBy` is `stoppedAt + LESSON_RESUME_MS`, fixed at that moment.
- **Real time, from the server.** `LESSON_RESUME_MS` (`sim/lesson.mjs`) is five minutes. The world's minutes run at the
  Host's pace and stop when the class is paused, so they are never used for this. The clock is handed in: `applyAction(…,
  { now, resumeWindowMs })` and `projectWorld(…, { now })`, and `createClassroom({ now, lessonResumeMs })` in
  `server/app.mjs` takes both as options so a test or a proof can hold or jump the clock. A real class passes neither.
- **`resume-lesson`**, applied by `resumeLesson`: the family's own student only (the same rule as the X — the Host, another
  family's student and the director for an absent family are refused), only while stopped by the X (a finished lesson is
  not), and only before `resumeBy`. It puts back `step: from` with every marker and `resumed: true`, and the gate applies
  from that order on. `applyAction` moves the lesson on straight after, so a family that did the step's work while it was
  off is walked forward as it would have been. It is on `ALWAYS` only so that anybody else who sends it hears the true
  reason rather than "Not yet".
- **The window is the first press's.** A second X after a resume keeps `stoppedAt` and `resumeBy`: pressing it again never
  buys more time. Inside the first window the student may stop and resume as often as they like.
- **The page** is sent `lessonResume: { until, ms }` while the window is open and nothing after. `#lesson-resume`, a small
  "Resume tutorial" button, stands where the strip was (top right, 36 px high). The page counts `ms` down on its own clock
  from the moment it heard it, so the button goes when the window does with no reload, even in a paused class where no
  snapshot comes, and a Chromebook whose clock is wrong makes no difference. It survives a reload because the server holds
  the window. The press only asks; the strip returns when the next snapshot carries the lesson.
- **The teacher is told quietly.** The Host's class panel carries a line under the family's name — *stopped the guided start
  at step 3*, *resumed the guided start: on step 3 of 10*, *stopped the guided start at step 4, after resuming it once* —
  and nothing for a family that did neither (`lessonHostWords`, `docs/HOST_PAGE.md` §2.5). No banner, sound, alert or
  live region. Each stop and resume is also written into the world's events as `lesson-stopped` / `lesson-resumed` with
  `visibility: 'host'` and `about: <household>` and **no** `householdId`, so no family's journal (its own included) and no
  public record carries it.
- **Old saves.** A stop saved before today has no `from`, `stoppedAt` or `resumeBy`: stopped, window long gone, no offer
  and `resume-lesson` refused. **No save version moved.**

## 2. The ten steps

| # | step | what the student is asked to do | it is finished when |
|---|---|---|---|
| 1 | `arrive` | Watch the wagon come in; on the real land, choose where the house will stand | the wagon is in and the site is chosen (`sim/settling.mjs`, `sim/homesite.mjs`) |
| 2 | `order` | Choose one of the family, then choose a work for them | anybody of the family has a chore |
| 3 | `house` | Keep them at the house until it stands | `houseSettled` — a roof over the family (`sim/houses.mjs`) |
| 4 | `survey` | Choose a place on your own land and stake ten acres | the family has a plot it staked itself |
| 5 | `clear` | Clear that plot; fence it if you like | the family has cleared ground it broke itself |
| 6 | `plant` | Plant the field, **and choose the crop at the rows** | the field is sown (`sim/improvements.mjs`) |
| 7 | `harvest` | Bring it in when it is ripe; fence while it stands | the field is bare again, having been sown |
| 8 | `sell` | Send somebody to town to trade, with some of the crop on the list for the store (chosen before they go, since 2026-09-24: [TOWNS.md §4b](TOWNS.md)) | there is coin in the house, or the crop left the house in trade |
| 9 | `hunt` | Choose a place on your own land and send somebody hunting | somebody went out after game and came home |
| 10 | `well` | Dig a well by the house | the well is dug, **or the house has running water within carrying distance** |

Steps 4 and 5 read *"ground the family broke itself"* rather than *"any cleared ground"* on purpose: every family is
founded with one patch of broken ground (`sim/fields.mjs`), and a step that counted it would be finished before it began.

Step 6 is where *"a crop of their choosing"* lives. The `crop-choice` question the planting already stops to ask
(`sim/chores.mjs` `ASKS`) is the student's own: corn, which the family eats, or cotton, which the store buys at a real a
bale. The lesson does not choose for them and does not care which they pick.

Step 10 stands down where the ground makes it meaningless. `sim/homesite.mjs` decides whether a house wants a well from
where the family put it; a family that set its house by running water carries no water and would be digging a hole for
a tutorial. The closing card says so in the family's own words instead. **This is the one place the built thing does not
literally satisfy the owner's sentence** — see §6.

## 3. The contract with the screen

The projection (`projectWorld`, `sim/world.mjs`) gains, for a student's own family only:

```js
view.lesson = {
  step: 'arrive' | 'order' | 'house' | 'survey' | 'clear' | 'plant' | 'harvest' | 'sell' | 'hunt' | 'well' | 'done',
  index: 3,            // 1-based, which step this is
  of: 10,              // how many there are
  title: 'Put somebody to work',        // three or four words
  says: 'One sentence in the game’s voice telling the student what to do next.',
  did: 'What has just happened, one sentence, or null',   // the step before this one, finished
  allow: ['chore:build-house', 'chore:plant-field'],      // every action id the student may take now
  done: false,         // true on the closing card; then the lesson goes away entirely
}
```

An **action id** is the action's own name (`survey-plot`, `choose-site`, `hunt-land`), or `chore:<id>` for the `chore`
action (`chore:build-house`). `actionId` in `sim/lesson.mjs` is the one place that is written down.

`lesson` is **absent** — not `done`, absent — for the Host, for a family nobody plays, in the lobby, for a family that
has left for the east, for every family that has finished, and — at once, with no closing card — for every family whose
student pressed the X (§1, amendment). The closing card (`step: 'done'`, `done: true`) stands
for `LESSON_DONE_MINUTES` — three hours of 1835 — and then the key is gone from the projection. That is how a student
knows the game is theirs.

## 4. What is never refused

`ALWAYS` in `sim/lesson.mjs`. Two kinds of thing, and the list is the most important twelve lines in the file:

- **Every answer the game itself puts to a family**: the neighbour's call, the march upriver, the rumor, a far
  settlement's call, the army's November questions, Houston's camp, the Alamo courier, the road east, `flee` and
  `flight-stay`, sending for a volunteer, recalling one from service. These arrive on the game's clock and not the
  student's. A lesson that could leave a rider standing at a door because it was somebody's turn to dig a well would be
  a worse bug than the one it fixes.
- **The family's own housekeeping and the things between families**: naming, the main person, the auto switch,
  appearance, setting something out in the house, calling off work, answering work, speaking to a rider, travelling,
  making and answering trade offers, and helping raise a neighbour's walls.
  **Auto and the gate** (2026-09-25, [FAMILY_PANEL.md](FAMILY_PANEL.md) §16): the switch stays on `ALWAYS` and the lesson
  never turns it off, but **auto does not walk round the gate**. Until that day a person on auto who was given a hunt on the
  step that allows any work went on hunting through every step after it, because the repeat called the work directly and
  never asked this file. Now the repeat asks `lessonRefusal` first: a task the current step does not allow is not taken up,
  the person works about the place, and their row says the step's own words (*"Auto: plant the field. Not yet - first, sell
  what you grew. Working about the place meanwhile."*). An order refused by the step is refused for a person on auto too,
  and is not remembered as a task to wait for.
- **The children's own works** (added 2026-09-21, `sim/children.mjs`, `docs/FAMILY_CREATION.md` §3's amendment): the six
  things a person under ten may be set to. **Not one of them is a step of this lesson and not one of them ever could
  be** — the lesson teaches building, clearing, planting, selling, hunting and the well, and a child under ten can do
  none of those. A lesson that refused a five-year-old their hour of play because the house was not raised yet would be
  refusing the one thing that family member is for.
- **The X itself** (added 2026-09-22): `stop-lesson`, the order that ends the lesson for the student's own family.

Two more exemptions are not in the list because they are conditions rather than actions. An order to somebody who has
**joined the army, the garrison or the expedition** is never the lesson's business — they are not at home to be taught,
and `sim/winter.mjs` and `sim/camp.mjs` gate them already. And a family whose **student has gone** (`absent`) is run by
the director through this same door and is never gated, though its lesson keeps pace with what the director does, so the
student comes back to the step the family has genuinely reached.

## 5. Old saves, and who never sees it

`CLAUDE.md`: *do not bump `saveVersion` reflexively; when the missing field has a correct empty value, default it.*
**No save version moved.** `household.lesson` is absent on every class saved before today, and the empty value is worked
out from what the family has: a family **still coming in** to its land starts at the beginning, and a family already
standing on its own land has nothing to be walked through and never gets a lesson at all.

That one rule covers every case that matters. A class saved before arrivals existed opens and plays exactly as it did. A
class saved mid-afternoon with its houses up is not marched back to the wagon. A student who joins a class already under
way is not either. And a class begun after today — every family of which is on the road in at dawn on September 28 —
gets the lesson from its first tick.

`validateWorld` refuses a stored lesson naming a step that does not exist, so a save cannot carry one. It accepts
`stopped: true` (2026-09-22) on a finished lesson only: `stopped` must be `true` or absent, and a stopped lesson standing
on a step is refused. **No save version moved for the X either** — an old save has no `stopped` field, and absent means
"never stopped", which is what every family in it was. Nor for **Resume tutorial** (second amendment): `from` is accepted
only on a stopped lesson and only naming a real step, `stoppedAt` and `resumeBy` only together, finite, and in order, and
`resumed` only as `true`. A stop saved without them is a stop whose window has long gone.

## 6. Ceilings, and the decisions the owner may want to change

- ~~**`ceiling:` the X is for good**~~ Replaced 2026-09-22 by the owner's second amendment (§1): five real minutes from
  the first X to press **Resume tutorial**. After that the X is for good again; there is no teacher's control to reopen
  a family's guided start. A Host command that clears `stopped` for one family is the way out if a teacher asks for it.
- ~~**The Host is not told when a student presses the X.**~~ Done 2026-09-22: a line on the class panel and a Host-only
  event (§1, second amendment).
- **The resume window is counted by the page once heard.** The server sends how many milliseconds are left; the page
  takes the button away when they run out. A page that loses its connection keeps the button up until its own count ends,
  and a press after the server's window is refused in words (*"It is too late to take the guided start up again."*).
- **The Host's line stays after the window.** *Stopped the guided start at step N* stands on the row for the rest of the
  class, and the line goes when a resumed family finishes the ten (the finished lesson keeps no trace of the stop).

- **`ceiling:` the well stands down where running water is close.** The owner's sentence says every student ends with a
  well. `sim/homesite.mjs` only offers one where the house is far enough from year-round water to be carrying it, and
  the invented Gonzales country has no house sites at all. Rather than dig a decorative hole or push students onto worse
  ground, the step is satisfied and the card says why. Undo it by making the well diggable anywhere — a change to
  `docs/LAND_GRANTS.md` §8.2, which is owner-decided.
- **`ceiling:` a student who joins after their family has arrived gets no lesson.** In an ordinary class every student
  joins in the lobby, where every family is still on the road, so this only reaches a late joiner or a rejoin into a
  family that arrived. Marching a family that is already farming back through ten steps would be worse. Undo it by
  storing the lesson at join rather than working it out from the family's state.
- **Selling is finished by coin, not by the crop leaving the house.** The store will take cotton for food as well as for
  coin, and a student who takes food has sold their crop but not finished the step. Coin is what the world keeps a
  durable mark of, and `docs/MONEY_AND_GLORY.md` makes coin the thing that is counted at the end, so the step asks for
  it and the sentence says so plainly. Change it by giving the sale its own mark in the family's state.
- **`travel` is always allowed.** It lets a student wander mid-lesson. It is allowed because somebody who answered a
  call and is standing in town has to be able to walk home, and no step's own list would let them.
- **The `allow` list is complete rather than minimal** — about four hundred bytes on the tick channel for a family in
  the lesson. A shorter list naming only the work would be cheaper and would risk the page greying out a control that
  must never be greyed. Correctness was chosen; `tests/chores.test.mjs` holds the whole payload's budget.
- **The lesson does not end when the class moves to the second period.** A family still mid-lesson in January is still
  mid-lesson. Nothing in the steps is seasonal except the crop, which will not ripen in the winter; if a class ever ends
  its first period with families still on step 6, that is the thing to look at.

## 7. What is invented, and what is not

**All of it is invented** (`FIC-GONZ-210` to `-215`). Every step is a thing the game already does — the arrival, the
house, Survey, clearing, planting, the harvest, the store's counter, the hunt, the well — and **no chore was invented for
this**. What is new is the order they are put in, the gate, and the sentences.

Nothing here asserts anything about 1835. The block of `HIST-TEX` numbers set aside for this work is deliberately
unused: a tutorial makes no historical claim, and registering one would be registering nothing.

### Amended 2026-09-25 (evening): starting coin, and a family on foot

A family of a class made since starts with **3 to 10 reales** (docs/FAMILY_CREATION.md, the second amendment of 2026-09-25), so "coin
in the house" no longer shows a crop was sold: for such a family the *Sell it in town* step counts coin **over what was in the house
when the step began** (`lesson.had.money`, watched like the cotton and the food and lowered when coin is spent), and a family that
started with none is read exactly as before (sim/lesson.mjs `sold`). A family that is hard up walks in, and the first step says so -
*"Your family is walking the track in to land of your own, the ox under its packs."* - and the house step's camp is *"by their
packs"*. Such a family can do every step (tests/afoot.test.mjs: it buys the seed it lacks on foot, sells on foot, and a crop that would
want the wagon is carried in by hand).

## 8. As built

| | |
|---|---|
| The world | `sim/lesson.mjs` (steps, gate, projection, validation); `sim/world.mjs` (`applyAction` reads the gate first, `stepWorld` moves the lesson on last, `projectWorld` sends it, `validateWorld` checks it) |
| The screen | `public/` — the other half, built against §3 |
| The X | `sim/lesson.mjs` `stopLesson` and `ALWAYS`; `sim/world.mjs` `applyOneAction`; `#lesson-stop` and `#lesson-stop-ask` in `public/index.html`, `public/style.css`, `public/app.js` |
| Resume tutorial | `sim/lesson.mjs` `LESSON_RESUME_MS`, `resumeLesson`, `lessonResumeOffer`, `lessonHostWords`; `sim/world.mjs` (`applyAction`'s `realTime`, `projectWorld`'s `now` and `lessonResume`); `sim/host.mjs` `familiesOverview` (`guided`); `server/app.mjs` `createClassroom({ now, lessonResumeMs })`; `#lesson-resume` and `renderLessonResume` in `public/index.html`, `public/style.css`, `public/app.js`; `.host-guided` in `public/live-page.js` and `renderHostLive` |
| Tests | `tests/lesson.test.mjs`, 28 tests (5 for the X, 9 for Resume tutorial) |
| Evidence | [lesson-injections.json](evidence/lesson-injections.json) — 56 regressions injected, 55 caught (all 7 for the X and all 10 for Resume tutorial caught; the miss is the older absent-family gap named in the record); [lesson-browser.json](evidence/lesson-browser.json) — `npm run test:lesson` presses the X, confirms, sees the strip go and "Resume tutorial" in its place, a refused order accepted, the button still there after a reload, the strip back on the same step when it is pressed, a second X inside the first window, and the button gone without a reload when the test server's clock passes the window |
| Claims | `FIC-GONZ-210` to `-215` in [HISTORY.md](../HISTORY.md) |
