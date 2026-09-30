# The Host's live page: the class in words, the Rumor Mill, the spotlight, and absent families

**Status: owner-decided and built 2026-09-16.** Amends `VISION.md` §18 (the Host) in what the teacher's page shows while the
class runs, and what happens to a family whose student has gone. `sim/host.mjs`, `sim/absence.mjs`, `public/live-page.js`,
`renderHostLive` in `public/app.js`, `markAbsences` in `server/app.mjs`.

## 1. What the owner asked for

Put to the owner by multiple choice (2026-09-16), with the whole-class map already the teacher's
([HANDOFF](../HANDOFF.md), *The teacher sees the whole class*):

| Question | Owner's answer |
| --- | --- |
| What should a live class panel list, family by family? | **Where everyone is, what waits on them, who is here.** No coin, no glory: the rule that glory is hidden from everyone, the Host included, until the ending stands (VISION §20). |
| How should the news show on the Host page? | *"The host screen should give teasers of information. Call it the Rumor Mill. as reports come in, a short, easy to read story should populate for this. It will adapt and change as new rumors flow in. Some are true, some aren't. When major events happen, such as the Fall of the Alamo, the Goliad Massacre, or the burning of a player's house, the host camera should zoom in on that and show it live. These would be events that many students would miss."* |
| What may the Host do live, beyond pause, pace, end and continue? | *"Absent families automatically become npc, but may be played again by the player if they return later."* |

## 2. As built

### 2.1 The class panel

Down the left of the Host's map, under the status lines, *The class*: a row per family in household order - its name, its
settlement, its student's presence, how many things wait unanswered on it, and each person in words. The words are the
world's (`whereWords` in `sim/host.mjs`): *at home: hunt in the timber*, *on the road to San Felipe de Austin*, *on the road
home*, *with the regular army at San Felipe de Austin*, *with the army at the camp above Béxar*, *shut in the Alamo*,
*riding for the Alamo*, *a prisoner at Goliad*, *on the road east to Lynchburg*, *at Liberty, fled from home*, *sick, …*,
*a prisoner*, *dead*. What waits (`waitingOn`) is what the family's own panel would mark with a "!": a rider stopped to
speak, an army question, the detachment, Travis's courier ask, a hunt stopped to ask, the order to leave, a call, an offer.

Presence is the server's (`presence.households`): **here** (a page open), **away a moment** (its page closed inside the
away grace, a locked phone), **playing itself** (absent, §2.4), **gone** (closed longer than the grace, not yet absent),
**nobody playing** (a family no student joined). No coin and no glory are on the panel or the wire
(`tests/host-live.test.mjs`).

### 2.2 The Rumor Mill - one running story (2026-09-18)

Under the class panel, *The Rumor Mill*: **one running story of what the families have heard**, a paragraph a month in the
order the news first reached the colonies, and under it **the latest word** as it was heard, with its day and how firm it
was - *"The latest, April 23 (confirmed): On the afternoon of April 21 General Houston attacked Santa Anna's camp..."*.
The owner chose, by multiple choice, that the story **replaces** the list of reports, that word which changed **keeps its
turn**, and that the story draws on **everything any family has heard**:

- **A line for every piece of news.** Each of the 26 pieces the war tells has a short past-tense line in
  `sim/rumour-story.mjs` (`STORY_LINES`), taken from the report's own words and nothing else - no new history. A piece
  with no line is told in its report's first sentence, and `tests/rumour-story.test.mjs` fails until it has one.
- **How firm the word was.** A rumour reads *"it was said that..."*, word not yet sure *"word not yet sure said that..."*;
  firm word is told plainly. Some of it is true and some is not: the story says what was heard, never which.
- **The turn.** Word that changed says so: *"First word had it that a Mexican pack train was coming in to Béxar with
  silver to pay the garrison, but it was not so: the pack train carried only grass for the horses."* or *"First word had
  it that two Mexican riders said the Alamo had fallen, though General Houston thought them spies. Fuller word said..."*.
  A rumour reaching a far family late does not undo firmer word nearer home, nor become the latest news.
- **How far it went.** News not every family has heard says so: *(heard by 3 of 8 families)*.
- **Everything any family heard.** Until now the mill read only the public reports, and everything the war told family
  by family - the Alamo, Goliad, San Jacinto, the Runaway Scrape - never reached it. It does now. This amends §2.2's
  "public knowledge as the public heard it": the Host reads what reached **any** family, as those families heard it. So
  the teacher learns how the fight at Gonzales went when the families who fought do, marked as heard by them alone; the
  truth itself is never on the Host's wire (`tests/gonzales.test.mjs` Gate D, `tests/host-live.test.mjs`).

The page (`storyView` in `public/live-page.js`) rewrites the story only when it changes; with no news yet it says *"No word
has reached the colonies yet."* The class list and the story each scroll within their own share of the column, so both
stay in view.

### 2.3 The spotlight

When something happens that most of the class would miss, the Host's camera goes there, zoomed in as a family's land is
framed, and a banner over the map says the day and what happened; *Whole class* brings the camera back, and anything the
teacher does with the camera after wins. Lit (`spotlight` in `sim/host.mjs`, `world.spotlight`, kept `SPOTLIGHT_MINUTES` -
half a day - or until the next): the fight at Gonzales, Concepción, the Grass Fight, the storming of Béxar, **the bell at Béxar on
February 23** (the army nobody expected, weeks early; `docs/battle-research/surprise-at-bexar.md`), **the fall of the Alamo**, Coleto, **the Goliad massacre**, San Jacinto, Santa Anna taken, and for a played family **its house and field
burned** by the Texas army and **somebody of it taken prisoner at home** by the Mexican army. Each is written down as a
public `spotlight` event with its claim. A student is never sent it.

### 2.4 Absent families

A joined family whose student's page has been closed for **two minutes** while the class runs (`ABSENT_MS` in
`server/app.mjs`; longer than the away grace, so a locked phone or a backgrounded tab is never called absent) is marked
**absent** (`setAbsent`, `sim/absence.mjs`), and while absent is run exactly as a family nobody plays: the neighbours'
director gives its orders (`automatic` in `sim/neighbours.mjs`), every question is answered the tick it is asked at the
shares families nobody plays use (the hunt's shot, the army's questions and the detachment, Travis's courier ask), and
nothing of the family's holds the class's calendar (`deciding` in `sim/clock.mjs`, `questionOpen` in `sim/army.mjs`, a
rider's patience in `sim/encounters.mjs`). The tick after its page opens again the family is the student's: nothing is
recalled, and what the director began finishes as an order would. Both changes are written into the family's record, and
the family's own page is told (`household.absent`). `absent` is true or absent, so no saved class changes.

**At the end it is still the student's family** (owner, 2026-09-29, by multiple choice: *"Any played family"*): a family
the director was running when the class ended can finish first, and the Host's table marks it *(finished by the computer)*,
never *(nobody played them)*; it stays in the class's own debrief. See [MONEY_AND_GLORY.md](MONEY_AND_GLORY.md) §5, *Who can finish first*.

### 2.5 The guided start, stopped and resumed (2026-09-22)

The owner: *"After closing the tutorial, show a small 'Resume tutorial' button for five real minutes from the original
dismissal, including across reloads. Resume existing progress; quietly show dismissal/resumption to the teacher."*

A family's row carries **one line in words** under its name, and only once its student has pressed the X on the guided
start or taken it back up (`guided` in `familiesOverview`, `lessonHostWords` in `sim/lesson.mjs`; `.host-guided` on the
page): *stopped the guided start at step 3*, *resumed the guided start: on step 3 of 10*, *stopped the guided start at
step 4, after resuming it once*. A family working through its steps, or one that finished them, has no line. It is
quiet on purpose: small italic words, no banner, no sound, no alert, not a live region; the row is rewritten as any
other change to it is. Each stop and resume is also written to the world's events as `lesson-stopped` /
`lesson-resumed` with `visibility: 'host'` and `about` naming the family and no `householdId`, so neither the family's
own journal nor any public record carries it. See [LESSON.md](LESSON.md) §1, second amendment.

The line is to be read, not acted on: **the teacher cannot reopen a family's guided start** once its five minutes are gone
(owner, 2026-09-27, verbatim: *"no, the teacher can not reopen the tutorial."*). The Host page has no such control and is
not to be given one ([LESSON.md](LESSON.md) §6).

### 2.6 Sickness on the class panel (2026-09-27)

The owner's diseases (docs/DISEASE.md, sim/disease.mjs): a person's words name the sickness - *"sick with the measles, at Liberty,
fled from home"*, *"very sick with the flux, ..."* (`sickWords`); over the families, one line counts the class's sick in words -
*"Measles: 4 sick, 1 very sick. Flux: 2 sick."* - and how many have died of sickness (`classSickness`, `#host-sickness`), never
who. **A child who died of a sickness is never named on the projector** (the owner, 2026-09-27: "not drawn, not spotlighted, no
name on the Host's projector"): the child is left out of the family's people and the family's row says *"A child of this family
died of sickness."* (`lost`); the dead of a sickness are not on the Host's map (sim/overview.mjs) or anybody else's
(sim/town.mjs `observedBy`); the spotlight never goes to a death from sickness. The word of the sickness going round the Trinity
and Lynch's ferry reaches the Rumor Mill as the families hear it (`sickness-trinity`, `sickness-lynchburg`). Proof: `npm run
test:disease`.

### 2.7 The class's size, late students, several classes and several days (2026-09-28)

From the classroom audit (docs/audits/2026-09-28-classroom.md B1, B2, B3, B6) and the owner's answer on class length, by
multiple choice: **"Plan for several class days"** - keep the pacing, make stopping and resuming across class days smooth and
clear, and tell the teacher up front how many class days a game takes at each pace. All of it is drawn by
`public/class-panel.js` from what the server sends; nothing on the page decides.

- **How many families.** The connection line reads *"12 here · 1 away of 24 joined · 30 families"*. In the lobby,
  **Families in this class** (5-30) sets the size; a new class has 30. Changing it deals the world again with the same seed:
  a student who has joined keeps their place and rolls again, and the page says so before the second press.
- **Class days.** Before Start: *"A whole game takes about 6–11 class days at Study · 3–5 at Brisk · 1–2 at Quick, counting
  40 minutes of play a day."* Once begun: *"Now: the autumn of 1835 (period 1 of 3), about 42% of the way through. Left:
  about 5–9 class days at Study (now) · …"*. The ticks behind it are measured (`server/class-days.mjs` `PERIOD_TICKS`,
  from the playthrough audit's whole classes with students answering and not answering); the share is of the period's
  calendar. `ceiling:` the range is wide because readers differ; a class's own ticks so far would narrow it.
- **Late students.** After Start, a student joining with the class code is given a family: the one chosen here (**Late
  students: the next to join is given**, a family nobody plays or one whose student is not here, used once), or else the
  first family nobody plays. Taking over a family whose student is not here signs that student's old device out; the class
  is told on its record either way.
- **Classes.** **Classes** lists every class kept on this computer - name, code, joined of families, where in 1835-36 it was
  left - with **Open** beside each (two presses), and **Start a new class** with a name and a size (two presses). A running
  class is paused first; the class that was open is kept. See docs/RECOVERY.md *Several classes*.
- **Coming back.** A page that loses the server - student or Host - says *Reconnecting* over the game and keeps asking
  (public/reconnect.js); only a sign-out goes to the join screen, which has **I was already in this class** (the class
  code, then your own name) beside the family key.

**Getting in and staying in (2026-09-29, the triage's Tier 1 items 1.5, 1.8 and 1.9; classroom audit M1-M4).**

- **The pace is the class's own.** The pace pressed on the Host page (Study, Brisk, Quick) is kept with the class, beside its
  name (`state.pace` in the save, by name), so a class set to Brisk yesterday opens at Brisk today, and each class in
  **Classes** opens at its own. A new class goes on at the pace in use. A class that never chose one - every class saved before
  this - opens at the server's own pace, Study at the launcher. No save version moved.
- **The class code forgives look-alikes.** Codes are six hex symbols, so at the join, the away list and the claim an O is read
  as 0 and an I or an L as 1, with the case and spaces forgiven. A code dealt before this reads exactly as it did.
- **One name, one student.** Joining with a name already in the class - in any case or spacing - is refused: *"Sam is taken —
  add your last initial. If you were already in this class, choose “I was already in this class” and tap your name."* The name
  is how a student finds their family on the away list, so two Sams could take each other's. A student coming back is never
  refused: their own browser is recognised by its cookie; without it they come back through the away list or the family key,
  which never ask for a new name; and a latecomer given their own family back by the teacher (the student it takes over is
  themselves) keeps the name.
- **A fourth tab lets the oldest go.** A family (or the Host) may hold three pages at once. A fourth is never refused: the
  oldest is told so and closed, and says *"Your family is open in another tab or window, so this one has stopped updating."*
  with **Play here**, which takes a page back from the next oldest. It does not reconnect by itself, so the tabs never take
  turns. Until then the fourth was refused (429) and said *Reconnecting…* for ever.
- **A page asleep is let go within half a minute.** The server writes a `ping` every 10 seconds naming the page's stream; the
  page answers it (`POST /api/here`). A page that has answered and then misses 30 seconds of answers - a Chromebook with its
  lid shut, whose socket the server would otherwise hold for many minutes - is closed, so its family is *away*, on the away list
  and claimable at another device at once, and its absence counts from its last answer. A page that has never answered (an
  older page, a script) is never judged. Play Solo is never judged. `ceiling:` and the reasons are at `STREAMS` in
  `server/app.mjs`; a physical Chromebook asleep has not been tried.


### 2.8 The bell: Stop for today, and End Game asked twice (2026-09-28)

Found by the design audit of 2026-09-28 (B2, [audits/2026-09-28-design.md](audits/2026-09-28-design.md) §1.2) and fixed at
the owner's word, *"fix the blockers when they come in"*: **End Game** was one press, with no confirmation, and final - a class
ended part-way through a period can never be continued (`sim/periods.mjs` `canContinue` wants the period's own end) - and at
the bell it was the obvious button. The safe way (Pause, Stop Server, relaunch, Resume) was written down nowhere as "carry on
next class".

- **Stop for today** (host action `stop-for-today`, `server/app.mjs`), beside Pause while a class is running or paused. Asked
  twice; while it waits for the second press the notice line says *"This pauses the class and saves it where it stands, then
  closes the server. Next class, open the Host as usual: the class is there, paused, and Resume carries on."* It commits the
  class **paused** and writes it at once, never ended; then, on a server that can close itself (the launcher's), every page is
  told *"Your teacher stopped the class for today. It was saved and paused just as it stands, and it goes on from here next
  class."* (`STOPPED_FOR_TODAY`) and the server stops as Stop Server does. On a server that cannot (a developer's terminal) the
  class is saved paused all the same and the Host is told to close the server in its own window. The next launch opens the same
  save - the same class, day, families and keys - paused, with **Resume** offered.
- **End Game** is asked twice, like New Class and Stop Server. Pressed once it reads *Confirm: end the whole game* and the
  notice line says *"This ends the whole game for everyone and shows everybody the ending. If it was a mistake, Classes can take
  the class up again where it was, but the ending will have been seen. To stop at the bell and carry on next class, use Stop
  for today instead."*; left alone it disarms itself after six seconds and the words go. (Until the owner's answer below the
  words said *"It can't be undone."*)
- **Who is absent is kept across the stop** (classroom audit S2, playthrough audit #2, 2026-09-28). What a page was last seen
  lives only in memory, and a relaunch began it empty, so every joined family counted as present: one saved absent was handed
  back to a student who was not there, the director stopped running it and its questions held the class; one whose student did
  not come back was never marked absent. Now each launch counts every joined family as seen at the launch, and one saved absent
  as gone the whole grace already (`seedPresence`, `server/app.mjs`): it stays absent until its page opens, and a family whose
  student does not come back is absent the grace (§2.4) after the launch, as if the server had never stopped. New Class forgets
  the last class's with it. Proof: `tests/absence.test.mjs`, *a class stopped for today and opened again keeps who is absent*.
- **Stop Server** is offered only in the lobby and after the end; while a class is under way Stop for today is the stop, with
  the words. The server still takes `stop-server` in any state (`Stop.vbs` uses it).

**A class ended by mistake is continued (owner, 2026-09-28, asked whether a class ended part-way through a period may be
continued: *"Yes, allow Continue"*).** This replaces the `ceiling:` that stood here, *"a class ended part-way through a period
still cannot be continued"*. End Game keeps its two presses.

- **Which class.** One ended by End Game before its period reached its own end (`endedEarly` in `sim/periods.mjs`: ended, and
  the director not `complete`). A period that ended where it ends goes on by its own button (*Continue to the winter of 1836*,
  *… spring …*); the last period's end, the war's, is final. Those are refused in words (`continueRefusal`).
- **Where.** In **Classes**, beside the class that is open, **Continue this class** (two presses; the list says *ended
  part-way*). A class put away ended is opened first, then continued. Host action `continue-class`.
- **What it restores.** End Game changes nothing in the world but its status, and while a class is ended nothing ticks and no
  order is taken, so the class taken up again is the class the moment before End Game - its day, its people, its questions -
  **paused**, for the teacher's Resume (`continueEnded`); the Host's record (`visibility: 'host'`) says it was taken up again.
  Proved field by field: the world after is the world before but for the status and that one line
  (`tests/classes.test.mjs`).
- **What goes.** Everything End Game showed is read from the ended status and goes with it: the ending and the standings on
  every page, the Host's winner, the offer of the flashbacks. **The flashback videos made for that ending are thrown away**
  (`flashbacks.discard`, `server/flashback.mjs`: the class's folder under `flashbacks/`), and a Host page left open forgets what
  it made and played (`public/flashback.js`); when the class ends again they are made afresh from the class as it then stands.
- **What cannot be undone.** Everybody has seen the ending: students saw their numbers and the Host the winner. That is why End
  Game still asks twice, and says so.

### 2.9 Deleting a kept class (2026-09-28)

The owner, asked whether the Classes panel should let a teacher delete a kept class: **"Yes, with a confirm"**.

- **Delete** beside **Open** on every kept class in **Classes** (`public/class-panel.js`, host action `delete-class`). Asked twice
  (*Confirm: delete Period 4*, red while it waits). The class that is open - the one being played, paused or waiting to begin -
  has no Delete, and the server refuses it (*"That class is open. Open another class first, then delete this one."*).
- **Never destroyed**: its save is moved to `archive/classes-<session>-deleted-<time>.json` and its flashback videos to
  `archive/classes-<session>-deleted-<time>-flashbacks/`, beside the other backups in the class data folder (`deleteKept` in
  `server/app.mjs`, `moveTo` in `server/flashback.mjs`). The panel says where: *"Period 4 was taken off the list and kept: its
  save is now archive/classes-…-deleted-….json, in this computer's class data folder. To bring it back, see "A deleted class" in
  RECOVERY."* Getting it back is moving the two back by hand with the server stopped ([RECOVERY.md](RECOVERY.md), *A deleted
  class*).
- Proof: `tests/classes.test.mjs` (*a kept class is deleted from the list into the archive with its flashbacks, never the open
  one, and put back by hand*: refused for the open class, a student and a class not there; moved with its flashbacks; off the
  list; put back as RECOVERY says and opened again with its student); `npm run test:classes` (the open class has no Delete; two
  presses; off the list and into the archive; the panel's words); injections in `scripts/design-blockers-injections.mjs --only
  Delete`.

### 2.10 Nothing on the Host's page stands on anything else (2026-09-28)

Owner, 2026-09-28: *"Check for UI elements that block others. Move them somewhere else."* `npm run test:overlap`
(docs/FAMILY_PANEL.md §21) walks the Host's page at a projector's 1920x1080, 1280x720 and 1280x800, a 1024x768 one and a
1366x768 Chromebook: the lobby, Classes and Recover a student opened, a running class with the spotlight lit, the fight at
Gonzales at first light, the ending and "How it ended". Found and moved:

- **The spotlight's banner** stood in the top middle across *The class* on a 1024 screen, and across it during the fight at
  every projector size. The Host has no ability bar, so the banner now stands in the **bottom middle**, over the map's buttons.
- **The teacher's column** down the right, with Classes open, ran off the foot of the screen and over the map's buttons
  (1366x768, 1280x720, 1024x768). It stops 200px above the foot, as *The class* does on the left, and scrolls inside itself.
- **The fight's caption**, drawn at the top of the map, was 15-40% under *The class*. It keeps to the room between the class
  on the left and the teacher's controls on the right, narrower and taller where that room is narrow.
- **The small print** about the map sat under the Journal and map buttons at 1280 and 1024: it is at the bottom left.
- **"How it ended"** sat on Gonzales, + and -: it stands on top of the map's buttons.

### 2.11 A class left with nobody in it pauses itself (owner-decided 2026-09-29)

Found by the classroom audit of 2026-09-28 (S1) and the design audit (S1), ranked first in the triage
([audits/2026-09-29-triage.md](audits/2026-09-29-triage.md) 1.1): a teacher who left at the bell without Pause or *Stop for
today* left a class that played itself - every family went to the director (§2.4) and people could die with no student
watching, none of it undoable. Only Play Solo paused itself when its page closed. The owner, by multiple choice (C1):
**"Pause after 3 min"**.

- **When.** A **running** class in which no student's page has been open for **three real minutes** (`EMPTY_PAUSE_MS`,
  `pauseIfEmpty` in `server/app.mjs`, checked every tick) is paused and written at once. A page that opened and closed again
  between two ticks counts as a student there. The Host's own page does not count: it is a projector as often as a teacher.
- **Not the lobby.** A class waiting to begin is not running and never pauses itself. A running class nobody has opened yet
  pauses three minutes after it began to run, which is the class the teacher started and walked away from.
- **What the Host sees.** The status line reads *paused*, and under it, until the teacher's Resume, in words (`#host-paused`,
  `emptyPauseWords` in `public/live-page.js`): *"The class paused itself at 10:42 AM: no student had the game open for 3
  minutes, so nothing went on without them. Press Resume when the class is back."* The Host's record has the line *"The class
  paused itself: no student had the game open for 3 minutes."* (`visibility: 'host'`). No student is sent either.
- **Resuming** is the teacher's ordinary **Resume**, and it gives the class the whole three minutes again, as does any Pause
  and Resume of the teacher's own. The words go at Resume.
- **Where.** Only the real classroom server watches (`server/main.mjs` passes `emptyPauseMs`; `EMPTY_PAUSE_MS` shortens it for
  a proof), as only the real solo server watches its player: the classes the tests and browser proofs run in process are never
  paused from under them. Play Solo keeps its own watch (`SOLO_WATCH`).
- `ceiling:` presence is the page's stream alone (§4), so a room of Chromebooks left open with their students gone keeps a
  class running. A student's own activity (an order in the last few minutes) is the way out if a class meets that.

### 2.12 The lobby: each student's name, and who is ready (owner-decided 2026-09-29)

Found by the classroom audit (S6; triage 1.7): on the first day the Host's rows showed only the family's name (*Thomas's
family*), so the teacher could not see who was playing it or who was still making and packing their family, and Start ends
the packing (a family still packing goes with the default load and stock). The owner, by multiple choice (C5): **"Show name
+ ready"** - Start unchanged.

- **The student's name** on each played family's row, from the moment they join and for the whole class (`presence.students`,
  which only the Host is sent; `.host-student`). The Host already sees students' names in Recover a student and Late students.
- **Ready**, in the lobby only (`.host-ready`, titled *Rolled, named and packed*): the family is rolled, has its last name and
  its parents' looks (`familyMaking` done), and the student pressed **Done packing** (`readyInLobby` in `sim/host.mjs`).
  Done packing in a class used to put the load screen away and tell nobody; it now sends `done-packing`, which marks the
  family packed (`household.packed`, true or absent, `donePacking` in `sim/wagon.mjs`). A change to the load or the stock after
  it takes the mark away again: the family is packing again. After Start the mark goes and the name stays.
- **Start is unchanged**: it waits for nobody, and a family still packing goes with what it has, as before.
- No saved class carries `packed`, so a class saved before this opens with nobody marked packed, which is what its lobby
  would show; no `saveVersion` moved.

### 2.13 How students join, shown large; wrong tries counted per device (2026-09-29)

The triage's items 1.8 (what was left of it) and 2.15, from the classroom audit's M2 and M8.

- **The join address, large, with a QR code.** Down the teacher's column, *How students join*: the address to type (the first
  the server found, `joinUrls`, server/deployment.mjs) in 22 px on one line, the class code in 26 px, and a QR code of the
  address - 180 px, carrying the class code as `?code=` (since 2026-09-30 inside the address itself, §2.14) - made in the page by `public/qr.js` with no library and no network
  service. The next two addresses the server ranked are named under it (*If that does not open, try …*). It is open in the
  lobby; once the class runs it folds to one line that still says the address and the code (*How students join
  192.168.4.38:3000 · code 6744EF*), and the teacher opens it again for a latecomer. A student who scans it lands on the join
  form with the class code already in, and the code is taken out of the address bar. `renderJoinLinks` in public/app.js.
  `ceiling:` which of a laptop's networks the students can reach is still the teacher's to know: the first address is only the
  server's best guess (DEPLOYMENT.md, *Join-address discovery*), and no Chromebook camera has read the code here.
- **Wrong tries are counted per device, not per address.** Behind a district's shared address - every device in the room at
  once - five wrong codes from anybody locked the whole room out of the family key, the away list and the claim for 30 s. Each
  browser is now given a `tr_door` cookie with its first wrong try, and its five tries and 30 s wait are its own. A script that
  drops or invents the cookie meets a count per address that a right answer never clears: 100 wrong tries from one address in
  half a minute shut the three doors to it until the half minute ends (`rejoinCooldown` in server/app.mjs). A room of thirty
  mistyping never comes near it; a guesser gets about three tries a second - weeks for the class code, far longer for a key -
  and knowing the class code no longer resets a guesser's count for a key. `ceiling:` one student throwing 100 wrong tries in
  half a minute from behind the shared address still shuts the doors for the room for what is left of it.

### 2.14 The class code inside the address (owner-decided 2026-09-30)

The owner asked: *"why do players need to enter a join code? if multiple hosts are on the same network, why dont we have different
addresses for that?"* Told that each Host laptop already has its own address, and that the code keeps out anybody not in the room and
separates class periods (it changes with **New Class**), the owner chose, by multiple choice, **"Code inside the address"**.

- **One thing to type.** The join address is `http://<laptop>:3000/<code>`, e.g. `http://192.168.1.20:3000/6744EF`. The Host's
  *How students join* card shows it large (broken, when the column is too narrow, only before the code, never inside it), its QR
  code is that same address, the folded line reads *Join 192.168.1.20:3000/6744EF*, and the other addresses listed under it carry
  the code too. Under the address: *If a Chromebook asks for a class code: 6744EF*. The launcher's join address (and its copy
  button) is the same address once it has read the code (launcher/ServerControl.cs `PrimaryJoinUrl`); the server's console line at
  start says it. `renderJoinLinks` in public/app.js.
- **Opening it joins with a name.** The server answers a single path segment of a class code's shape - six of hex and the O, I and L
  `readCode` takes for 0 and 1, in any case - with the join page (server/app.mjs `CODE_PATH`); a trailing slash is redirected to the
  address without it. The page takes the code from the address (`addressCode`) and puts away the code box, so the join asks only
  for a name. Nothing else is served by it: a path of any other shape, a second segment or a POST is answered as any unknown path
  always was (`tests/code-address.test.mjs`), and the files served are still only the listed ones.
- **Checked as before.** The code is checked at the join, the away list and the claim exactly as a typed one is - `codeMatches`,
  the same leniency, the same wrong tries per device (§2.13). Told it came from the address (`via: 'address'`), the server answers
  a wrong one *"This is an old class address. Look at the Host screen for today's address, or type the class code shown there."*
  (`wrongCode`), and the page brings back the code box, empty, where the student can type today's code. A code that no longer
  matches is most often yesterday's address, from before a New Class.
- **The old ways still work.** The bare address asks for the code as it always did; an older QR code's `?code=` fills the box as
  it always did; the Host's page stays on `/host`. On the coded address **I was already in this class** shows the names at once,
  with nothing typed, and the claim uses the same code.
- `ceiling:` the code is still a class code, not a secret: anybody who can read the projector can join, as before. What keeps out
  a stranger on the network is the code in the address as it was the code on the screen; a class that needs more is a class
  password, which nobody has asked for.

## 3. Proof

- `tests/absence.test.mjs` (4): the marker; the director's, questions answered at once, nothing held; back again; the
  server marking from presence and unmarking the tick after the page opens, on a held clock so the grace is exact (149 ms
  present, 150 ms absent) however loaded the computer is.
- `tests/host-live.test.mjs` (6): the panel in words and no coin or glory, nothing to a student; every word; what waits;
  the Rumor Mill; the spotlight lit, passing, and a family's own; the war's spotlights across all three periods.
- `tests/host-page.test.mjs` (4): the page's words.
- `tests/lesson.test.mjs`, *the Host's class panel says quietly that a family stopped and resumed the guided start; no
  student is told* (§2.5), proven by two injections in `scripts/lesson-injections.mjs`.
- `tests/lifecycle.test.mjs`, *Stop for today saves the class paused and stops the server; the next launch opens the same class
  paused, and Resume goes on* and *… on a server that cannot close itself …* (§2.7); `npm run test:host-bell`
  (`scripts/host-bell-browser-proof.mjs`, same computer): End Game pressed once ends nothing and says what it does, then disarms;
  Stop for today pressed twice saves the class paused, tells the page and stops the server; a second server on the same save
  opens the class paused where it stopped, and Resume carries it on. Each is proved by injection in
  `scripts/design-blockers-injections.mjs` (`docs/evidence/design-blockers-injections*.json`).
- `npm run test:host-live` (`scripts/host-live-browser-proof.mjs`, same computer): the panel; a student's page closed and
  the row reading *playing itself* after the grace while the family goes on; the page opened again and *here*; the
  spotlight at the fight at Gonzales taking the camera there and *Whole class* bringing it back; the Rumor Mill filling;
  nothing sideways at 400 px; the student's page carrying none of it.
- §2.7: `tests/late-join.test.mjs`, `tests/classes.test.mjs`, `tests/class-days.test.mjs`, `tests/reconnect.test.mjs`,
  `tests/stale-lock.test.mjs`; `npm run test:classes` (class days before and after Start, 30 families from the Host, late
  students free and chosen, the thirty-first refused, a new class and the first opened again, a signed-out page carrying on)
  and `npm run test:reconnect` (the real server killed for 5 s and for 30 s, both pages back by themselves, the away list on
  a page with no cookie). Each was seen failing against the code it guards (HANDOFF).
- §2.7 *Getting in and staying in* (2026-09-29): `tests/pace.test.mjs` (the pace back the next day and a save without it at
  Study; each kept class at its own pace), `tests/classroom-doors.test.mjs` (O/I/L in the code at all three doors; a second Sam
  refused and every way back for the first; a fourth tab; a page that stops answering let go and its family claimed; the page's
  wiring); `npm run test:host-bell` (Quick chosen, Stop for today, the next launch at Quick with its button lit) and `npm run
  test:reconnect` (a second "reader" refused in words; a fourth tab and **Play here**; a page's script paused, its family on the
  away list 30 s after and claimed with the code typed `aoblco`). Every test and both proofs' new steps were seen failing
  against an injection of the regression they guard (HANDOFF).
- §2.11 and §2.12: `tests/empty-pause.test.mjs` (the span to the millisecond on a held clock, the lobby never, a page open
  keeps it running, the Host's stream and record told and no student, Resume and the teacher's own Pause giving the whole
  span again, in-process classes never watched, the real server given it), `tests/lobby-ready.test.mjs` (named from the join;
  ready only once rolled, named, looks chosen and packed; a new load or stock takes it away; Start unchanged; the mark gone
  after Start; Done packing refused after it; nothing to a student), `tests/host-page.test.mjs` (the rows and the words);
  `npm run test:host-lobby` (`scripts/host-lobby-pause-browser-proof.mjs`, same computer: a student's page pressing Done
  packing marks the Host's row ready, the last page closed and the Host's words, Resume). Each regression injected in
  `scripts/owner-pause-win-lobby-injections.mjs` ([evidence](evidence/owner-pause-win-lobby-injections.json)).
- §2.13: `tests/qr.test.mjs` (the encoder bit for bit against an independent one, versions 1-13; the SVG), `npm run
  test:join-card` (the card at 1920x1080, 1366x768 and 1024x768, the QR code on the page the one `public/qr.js` makes for the
  address with the code, folded once the class runs and opened again by the keyboard, a scanned address filling in the code, no
  request leaving the class server), `tests/shared-address.test.mjs` (a mistyping student waits and a classmate at the same
  address does not; a right answer clears only its own device; a script that drops its cookie meets the address's count, which
  the class code does not reset) and `tests/rejoin.test.mjs` (its throttling tests now keep the cookie, as a browser does). Each
  seen failing under an injected regression: `npm run test:tier2-classroom-injections`
  ([evidence](evidence/tier2-classroom-injections.json)).
- §2.10: `npm run test:overlap` (the Host's page at five sizes in five states, nothing sharing pixels that is not meant to)
  and `npm run test:overlap-injections`.

## 4. Ceilings

- `ceiling:` the spotlight moves the camera and shows a banner; there is no drawn scene of the Alamo's fall or the
  massacre. A reconstruction drawn on the map at the place is the way out if the owner wants one (the Gonzales fight has
  its formations).
- ~~The Rumor Mill lists the public's pieces.~~ Done 2026-09-18: one running story (§2.2). `ceiling:` the story grows through
  the whole war - eight paragraphs by San Jacinto - and nothing folds the earlier months away; the lines are written for
  the 26 pieces the war tells, and a new piece reads in its report's words until it has one.
- `ceiling:` absence is decided by the page's stream alone; a student whose page is open but who has walked away is
  present. The "!" count on the row is what tells a teacher that.
