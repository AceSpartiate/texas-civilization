# The guided beginning

**What is drawn over what:** [FAMILY_PANEL.md §12.11](FAMILY_PANEL.md) — the strip is top right and never on the family's
column; a panel that covers the column dims what it covers and says so; the names under the icons are clear of the map's
own buttons. Measured by `npm run study:overlap` at three screen sizes, gated by `npm run test:lesson`.

**The ring and the words are one instruction.** `pointedKey` ranks by the step's own work and, where nothing on the row
is that, points at something only when there is exactly one thing to point at. Guessing among several put the ring on the
survey stake at the `order` step while the strip said to choose a house plan.

**Usability update:** [TUTORIAL_USABILITY_HANDOFF.md](TUTORIAL_USABILITY_HANDOFF.md) supersedes earlier screen restrictions: a contextual navigation button now locates the relevant control, without completing a step or issuing work. Objective-specific recommendations replace first-permitted-action highlighting. Completion is visible without locking controls. Selling guidance accepts food or coin, matching the current server rule. Both bare placement commands and chore-prefixed variants are accepted for map work.

**Status: the world's half built 2026-09-21; the X added 2026-09-22.** `sim/lesson.mjs`, `tests/lesson.test.mjs`,
[injections](evidence/lesson-injections.json) (45 of 46 caught; the one that misses is a gap in the tests, named in the record). Claims `FIC-GONZ-210` to `-215`. The screen's half —
the card, the greying, the arrow onto the control being asked for — is `public/`'s and is built against the contract in
§3 below. **The guided start is no longer unavoidable:** since 2026-09-22 every student and every solo player can X it
off at any step, for good, for their own family (§1, amendment).

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

- **The X** is top right of the strip (`#lesson-stop`, 36 px, accessible name "Stop the guided start"). Because it cannot
  be undone it asks once, inline in the strip — *"Stop the guided start? You won’t be walked through the rest, and it
  can’t be turned back on."* **Yes, stop it** / **Keep going** — never `window.confirm`. Focus lands on *Keep going*.
- **The server does it.** The X sends `stop-lesson`, which is on `ALWAYS` (a lesson that could refuse the order to stop
  itself would be the unavoidable thing the owner took back). `stopLesson` stores `household.lesson = { step: 'done',
  at, stopped: true }`: the gate opens, and the projection's `lesson` key is **absent** at once — no closing card.
- **Only the family's own student.** The order is applied to the household the sender's cookie names, so a student can
  stop nobody's lesson but their own whatever the order carries. The Host has no household and is refused (and the Host's
  own command branch never reaches `applyAction` at all). A family whose student has gone is refused too: the director
  runs it and never presses the X on anybody's behalf. A family with no lesson running is refused in words.
- **For good.** `ceiling:` in `stopLesson` names what a "restart the guided start" button would need.
- **The old walk-through is not offered in its place.** The page remembers it as seen when the X is pressed, so a student
  who has just said "let me do what I want" is not handed the older "New to this?" card instead.

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
| 8 | `sell` | Take it to the store in town and sell it for coin | there is coin in the house |
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
"never stopped", which is what every family in it was.

## 6. Ceilings, and the decisions the owner may want to change

- **`ceiling:` the X is for good** (2026-09-22). There is no way back into the guided start for a family that stopped it.
  A restart button would need the step reached kept beside `stopped` (or worked out again from the family's state, as
  every step's `done` already can), an action that clears it, and a decision on whether a family that did steps out of
  order is walked back through them. The owner's word was "stop it"; nothing has asked for a restart.
- **The Host is not told when a student presses the X.** Nothing is recorded in the journal or on the class panel. A
  teacher who wants to know which students left the guided start early would need an event and a line on the Host's page
  (`docs/HOST_PAGE.md`).

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

## 8. As built

| | |
|---|---|
| The world | `sim/lesson.mjs` (steps, gate, projection, validation); `sim/world.mjs` (`applyAction` reads the gate first, `stepWorld` moves the lesson on last, `projectWorld` sends it, `validateWorld` checks it) |
| The screen | `public/` — the other half, built against §3 |
| The X | `sim/lesson.mjs` `stopLesson` and `ALWAYS`; `sim/world.mjs` `applyOneAction`; `#lesson-stop` and `#lesson-stop-ask` in `public/index.html`, `public/style.css`, `public/app.js` |
| Tests | `tests/lesson.test.mjs`, 19 tests (5 for the X) |
| Evidence | [lesson-injections.json](evidence/lesson-injections.json) — 46 regressions injected, 45 caught (all 7 for the X caught; the miss is the older absent-family gap named in the record); [lesson-browser.json](evidence/lesson-browser.json) — `npm run test:lesson` presses the X, confirms, and sees the strip go, a refused order accepted, and the strip stay gone after a reload |
| Claims | `FIC-GONZ-210` to `-215` in [HISTORY.md](../HISTORY.md) |
