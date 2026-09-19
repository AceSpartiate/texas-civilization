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
half a day - or until the next): the fight at Gonzales, Concepción, the Grass Fight, the storming of Béxar, **the fall of
the Alamo**, Coleto, **the Goliad massacre**, San Jacinto, Santa Anna taken, and for a played family **its house and field
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

## 3. Proof

- `tests/absence.test.mjs` (4): the marker; the director's, questions answered at once, nothing held; back again; the
  server marking from presence and unmarking the tick after the page opens, on a held clock so the grace is exact (149 ms
  present, 150 ms absent) however loaded the computer is.
- `tests/host-live.test.mjs` (6): the panel in words and no coin or glory, nothing to a student; every word; what waits;
  the Rumor Mill; the spotlight lit, passing, and a family's own; the war's spotlights across all three periods.
- `tests/host-page.test.mjs` (4): the page's words.
- `npm run test:host-live` (`scripts/host-live-browser-proof.mjs`, same computer): the panel; a student's page closed and
  the row reading *playing itself* after the grace while the family goes on; the page opened again and *here*; the
  spotlight at the fight at Gonzales taking the camera there and *Whole class* bringing it back; the Rumor Mill filling;
  nothing sideways at 400 px; the student's page carrying none of it.

## 4. Ceilings

- `ceiling:` the spotlight moves the camera and shows a banner; there is no drawn scene of the Alamo's fall or the
  massacre. A reconstruction drawn on the map at the place is the way out if the owner wants one (the Gonzales fight has
  its formations).
- ~~The Rumor Mill lists the public's pieces.~~ Done 2026-09-18: one running story (§2.2). `ceiling:` the story grows through
  the whole war - eight paragraphs by San Jacinto - and nothing folds the earlier months away; the lines are written for
  the 26 pieces the war tells, and a new piece reads in its report's words until it has one.
- `ceiling:` absence is decided by the page's stream alone; a student whose page is open but who has walked away is
  present. The "!" count on the row is what tells a teacher that.
