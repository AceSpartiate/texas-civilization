# Playthrough audit — what stops or breaks play (2026-09-28)

Owner's question (2026-09-28): *"check for problems with the game. we're specifically looking for things that would prevent
the game from being played as intended. gaps in game design logic, things we may have forgot or not thought about."* This
slice: play whole classes and a solo game from the lobby through all three periods to the ending, and record what stops or
breaks play. **Nothing in the game was changed.** The harnesses were throwaway scripts in the worktree (not committed); the
recipe to rebuild them is under *How this was run*.

Tree: `aa35088` (main, "The handoff's release line for v2026.09.28.1"). Same computer only; nothing here is a LAN, Chromebook
or classroom measurement.

## Summary, ranked

| # | Severity | Problem | Where |
|---|---|---|---|
| 1 | **Blocker** | **End Game** in the middle of a period ends the class for good: one click, no confirmation, no way back | `public/index.html` 122, `public/app.js` 132/6331, `server/app.mjs` `'end'`, `sim/periods.mjs` `canContinue` |
| 2 | **Serious** | A server restart forgets which students are gone: every absent family becomes "present" and stays so until its student returns | `server/app.mjs` `lastSeen`, `markAbsences` |
| 3 | **Serious** | A period is two to three class meetings at Study, not one; with students playing, the whole game is 4 to 6½ hours | `sim/periods.mjs` header, `docs/COLONIES.md` §5.7 |
| 4 | **Serious** | A student at the screen who does not answer holds the whole class at 20 minutes a tick — 10 to 38 real minutes at a time | `sim/clock.mjs` `deciding`, `sim/encounters.mjs` `PATIENCE_MINUTES`, `sim/auto.mjs` `FLIGHT_PATIENCE` |
| 5 | **Serious** | The guided start refuses every way of getting food, nursing the sick, and every winter war choice; it never expires | `sim/lesson.mjs` `ALWAYS`, `STEPS` |
| 6 | **Serious** | A played family whose student is absent when the class ends cannot win, though it has the best score | `sim/ending.mjs` `hostEnding` (`!automatic`) vs `docs/MONEY_AND_GLORY.md` §247 |
| 7 | **Serious (design)** | A family wiped out has nothing to play for the rest of the class — and can still be named the winner | `sim/ending.mjs` `keptFor`/`finalNumber`; no handling in `public/` |
| 8 | Minor | Children-only families: "too young to be sent" to leave or answer the road; the "!" sits on a dead parent's row | `sim/world.mjs` 913, `public/family-panel.js` 432 |
| 9 | Minor | Small children stop a parent's work every ~8 ticks (about 76 s at Study) unless re-ordered; families roll up to 18 children | `sim/childhood.mjs` `IDLE_TICKS`, `sim/children.mjs` `CHILD_WORK_TICKS` |
| 10 | Minor | `test:solo-game` failed once under load: a panel icon was re-rendered out from under the click (passed on rerun) | `scripts/support/whole-game.mjs` 97 |

**Not found** (looked for, across 27 whole classes and 2 browser games): no exception from `stepWorld`, no `validateWorld`
failure, no period that failed to end, no ending not reached, no family stuck on a journey or halted more than four days
(the only long holds were volunteers in the siege camp before Béxar, which is the army's march halted, as built), no chase
without an end (`GIVE_UP`, 30 minutes of chase), no unbounded hold of the clock — every hold found is bounded. Saving and
reloading the class every 7 ticks through all three periods (mid-battle, mid-chase, mid-conversation, mid-sickness, on the
Scrape's routes) gave the **identical** class: same ticks, events and final numbers as the run never reloaded.

## How this was run

- **Whole classes in process** (`.scratch/playthrough.mjs`, throwaway): `createGonzalesWorld(seed, n, { map: 'colonies',
  neighbours: true })` as `server/main.mjs` makes it, the teacher's Start (`markPlayed`, `rollFamily`), `stepWorld(world,
  { realMs: 9500 })` every tick — the Study pace's real seconds, so every decision budget and call budget lapses as it would
  in a class — and `beginSecondPeriod`/`beginThirdPeriod` at each period's end, as the Host's Continue does. Each family was
  one of: **s** a scripted student at the screen (stops the guided start with the X, then the neighbours' director's own
  judgement through `applyAction` every third tick, and answers every rider, call, army, Alamo, Houston and road question it
  can); **x** the same without pressing the X; **i** a student at the screen who does nothing; **a** a student who has gone
  (`setAbsent`); **n** nobody joined (the neighbours' director). Every tick records what holds the calendar at 20 minutes or
  less and why (the conditions of `sim/clock.mjs` `deciding` and `sim/military-pacing.mjs`); `validateWorld` every 50 ticks;
  anybody unchanged on a journey or at a question 4+ days; per family, ticks with no grown person free to take an order.
- Sizes 5, 15 and 30; seeds `audit-1`, `rt-1`, `lesson-1`, `a15i`, `a15m`, `a15n`, `a15s`, `a30i`, `a30m`, `b5m`, `c5s`,
  `c15m`, `d30n`, `e5`, `f5`, `g15`, `h15`, `i30`, `j30`, `k15`, `l5`, `m30`, `n15`; mixes `snnnn`, `sisan`, `sn`, `n`, `i`,
  `si`, `sisnnan`, `ssian`, `s`, `xxxnn`, `ssssa`, `ssa`, `sssssi`, `ssan`, `sssssssssa`, `saaan`, `sissn`.
- **Save and reload**: `rt-1`, 5 families `sisan`, once straight and once replacing the world by `JSON.parse(JSON.stringify(world))`
  (what `server/storage.mjs` writes and `readSave` reads) every 7 ticks: 1,558 ticks and 3,653 events both ways, final numbers
  `[483, 5, 5, 871, 368]` both ways.
- **Server in process** (`createClassroom`, as `tests/absence.test.mjs` does): a restart between days (#2) and End Game (#1).
- **Browser**: `npm run test:whole-game` 13 of 13; `npm run test:solo-game` failed once (#10), then 14 of 14. Both at 100 ms
  a tick, so neither measures the Study pace. (Their evidence files were restored, not committed.)

## Real time at the Study pace (9.5 s a tick)

Every class reached the ending. Minutes of real time, from these runs:

| Class | P1 (to Dec 15) | P2 (to Mar 13) | P3 (to Apr 25) | Whole |
|---|---|---|---|---|
| 15, nobody plays (`a15n`) | 88.7 | 47.5 | 62.1 | **198** (the 3 h 18 in `docs/BATTLES.md`) |
| 5, solo: 1 scripted, 4 neighbours (`audit-1`) | 107.7 | 47.5 | 75.0 | 230 |
| 5, all scripted (`c5s`) | 114.2 | 52.4 | 76.2 | 243 |
| 15, all scripted (`k15`) | 113.8 | 63.8 | 97.2 | 275 |
| 30, half scripted, a quarter absent (`i30`) | 113.8 | 71.3 | 126.2 | 311 |
| 15: 6 scripted, 3 idle, 3 absent, 3 nobody (`a15m`) | 144.9 | 51.0 | 130.5 | 326 |
| 30: 9 scripted, 5 idle, 4 absent, 12 nobody (`a30m`) | 149.0 | 63.0 | 151.5 | 364 |
| 30: 15 scripted, 15 idle (`a30i`) | 158.2 | 67.1 | 163.9 | 389 |

---

## 1. End Game in the middle of a period ends the class for good — **Blocker**

**Repro** (`.scratch/end-trap.mjs`): a 5-family class started, 48 ticks in (September 28), the Host sends `end`. Status is
`ended`; `resume` → *"Host action unavailable"*; `next-period` → *"Only a class that has finished its first period can go on
to the winter."* The Host's view shows **final** standings with **winners named** (`interim: false`, `canContinue: false`).

**What happens.** *End Game* is shown whenever the class is running or paused (`whenAvailable.end`), sits beside Pause, has no
confirmation (it is not in `confirmLabel` and not `.careful`), and sets `world.status = 'ended'` whatever the date.
`canContinue` needs the period's own end milestone (`bexar-end`, `alamo-end`), so a class ended by hand can never be
continued, and `resume` only works from `paused`. `docs/RECOVERY.md` says so: an ended class stays ended.

**Why it prevents play.** A period takes two to three class meetings (§3), so every class has to be stopped for the day in
the middle of one. The button a teacher reaches for at the bell is labelled *End Game*; one click throws away the class,
with a winner named on the first day. The right control, *Stop Server*, is labelled as a machine operation.

**Direction.** Confirm End Game with words that say the class cannot be continued, or offer it only after the last period;
give the teacher an explicit "Stop for today (saves, pauses)" in its place.

## 2. A server restart forgets who is absent — **Serious**

**Repro** (`.scratch/restart-absence.mjs`, `absentMs` 300 ms): 5 families join, all open their pages, hh-1 and hh-2 close
theirs; after the grace both are `absent: true`. Pause, close the server (as Stop Server does), start it on the same save,
three families reopen their pages, Resume. **Two seconds later hh-1 and hh-2 are `absent: undefined`** — present — and the
Host's presence line says `"hh-1":"gone","hh-2":"gone"`. They stay present for the rest of the class.

**What happens.** `lastSeen` (when each household's page last closed) is kept only in memory. After a restart it is empty,
so `markAbsences` computes `at === undefined` → `gone = false` and **clears** the absent flag the save carried
(`setAbsent(world, household, false)`). A family whose student never reopens a page after the restart is never marked
absent again. (The same holds for a student who joined but whose page never opened a stream.)

**Why it prevents play.** Such a family is `played` and not `absent`, so (a) the neighbours' director never runs it
(`automatic` is false): it does not farm, buy food or look after its children; (b) its every question holds the whole class
as a student reading at the screen would (§4) — each rider 60 ticks, the order to leave 72 ticks, each road question 12;
(c) its small children come to talk and stop its grown-ups for good (§9); (d) it is a contender at the ending. With periods
2–3 meetings long (§3), a restart mid-period is the normal way to play, so every class with an absent student meets this.
The Host sees "gone" and has no control to hand the family to the director.

**Direction.** Seed `lastSeen` for every joined household at server start (so the grace starts then), and keep a saved
`absent` until the student's page actually opens; consider a Host control to set a family automatic.

## 3. A period is two to three class meetings, not one — **Serious (design)**

**Repro:** the table above. `sim/periods.mjs` opens with the owner's rule *"Day 1 ends after Béxar and saves; day 2 opens
the same families in January 1836"*, and `docs/COLONIES.md` §5.7's budget is a 50-minute class. At Study, with students
playing, **P1 is 108–158 minutes, P2 47–71, P3 62–164**, and the whole game **4 to 6½ hours**. The 3 h 18 min in
`docs/BATTLES.md` §11 and `docs/evidence/battle-class-time.json` is a class **nobody plays**; students add 25–70 minutes to P1
alone (their men at the fights hold the "quiet" lead-ups; their questions hold the calendar).

**Why it prevents play.** Each period has to be stopped mid-way at least once, which is exactly where #1 and #2 bite, and
nothing on the Host's page tells the teacher where the class will be at the bell or how to stop for the day. A period that
ends on its own at 10 minutes to the bell starts the next one's "ten quiet minutes" for nobody.

**Direction.** Decide whether a period should fit a meeting (Brisk by default, or shorter holds), or say plainly on the
Host's page that a period spans meetings and give it the "stop for today" of #1; re-measure with played families, not only
`battle-class-time.mjs`'s nobody-plays class.

## 4. A student at the screen who does not answer holds the whole class — **Serious**

**Repro:** `a15i` (15 families, all at the screen doing nothing): P1 133.5 min against 88.7 for the same class nobody plays,
P3 150.6 against 62.1. Longest single run of 20-minute ticks: **239 ticks (37.8 min) from 1835-10-05 20:20**, riders queued at
idle families' gates. `a15m` (3 idle and 3 absent of 15): P1 +20 min and P3 +36 min over `a15s` (8 scripted, 7 nobody). `b5m` (1 idle of 5): each rider to it
holds 60 ticks (9.5 min). `a30m`: 144 ticks (22.8 min) from 1836-04-02 11:40, held by `flight-ordered:hh-8` (see #7).

**What happens.** Every hold is bounded, but each is long and they chain: a rider waits `PATIENCE_MINUTES` 1,200 = 60 ticks
for a family "somebody is actually reading" (`sim/clock.mjs` `deciding`) and the next rider waits behind him; a played
family told to leave holds the calendar until `FLIGHT_PATIENCE` (one day, 72 ticks, 11.4 min) when auto packs for it, once
per settlement's order date (seven dates, March 14 to April 14); each road question holds 12 ticks and they come back to
back (84-tick runs seen). Presence cannot tell a student reading from one who has walked away with the tab open.

**Why it prevents play.** One inattentive student costs the whole room 10–20 minutes a period; with #2, every absent
student does. **Direction.** A real-time budget for riders and the flight order like `DECISION_BUDGET_MS`, or hold the class
only for a family whose page has sent anything recently.

## 5. The guided start refuses food, nursing and the war, and never ends — **Serious (design)**

**Repro** (`.scratch/lesson-war.mjs`, `lessonRefusal` on each step): on `house`, `survey`, `plant`, `harvest` and `well`,
every one of `take-small-game`, `fish-the-water`, `butcher-hog`, `hunt-land`, `sell-food`, `tend-sick`, `enlist-regular`,
`enlist-auxiliary`, `join-garrison`, `join-matamoros`, `join-relief`, `go-vote`, `join-houston` is refused *"Not yet -
first, …"*; on `hunt` only `hunt-land`. In play (`lesson-1`, 5 families, 3 following the start without the X, `xxxnn`): the
three were on the `house` step all game; two had **0 food at the end of P1**, all three at the end of P2.

**What happens.** `ALWAYS` lets through every *question* the game puts, but the winter's choices, nursing and every food work
are *chores*, allowed only on the `order` step (`ANY_WORK`) or not at all. `teachable` ends only with the X or the Scrape's
order; nothing ends the lesson at a period's end, so a family on step 3 in October is still gated in February.

**Why it prevents play.** The students the lesson was built for — the ones who could not work out how to farm — are the ones
who will follow it rather than press the X: they cannot feed a large rolled family (10–18 people) while the house goes up,
cannot nurse the sick in an outbreak, and cannot enlist, go to the Alamo, vote or join Houston — the glory that wins.
`docs/LESSON.md`'s own rule is "nothing the game itself asks a family is ever refused". **Direction.** Add the winter
chores, `tend-sick` and the food works to `ALWAYS` (or allow them when food is short), and close the lesson at the end of P1.

## 6. An absent family cannot win — **Serious (fairness)**

**Repro:** `l5` (5 families `saaan`): finals `[171, 96, 630, 192, 25134]`; hh-3 (played, student absent at the end) has 630,
the winner is hh-1 with 171.

**What happens.** `hostEnding` ranks `!automatic`, and `automatic` is true for a played family whose student is absent at
that moment. `docs/MONEY_AND_GLORY.md` §247 says the ending ranks families with `household.played`. The absent flag is frozen
when the class ends, so a student whose Chromebook dropped in the last two minutes, or who was off sick on the last day after
playing two, is not a contender; with #2, a student absent before a restart *is*. The Host's closing table
(`public/ending.js` 100) then labels that student's family *"(nobody played them)"*. **Direction.** Rank `played` as the
document says (optionally marking families that finished on the director), and label by `played`, not `automatic`.

## 7. A family wiped out has nothing to play — and can win — **Serious (design)**

**Repro:** `a30m` (30 families `sisnnan`): hh-8 is a roll-1 family (a lone father, Ignacio). He was in the army from October
(356 ticks, 56 min, with nobody of the family at home), went into the Alamo in the winter, answered Travis's runner that he would stay at his post, and was
killed when it was stormed on March 6 (`[WIPED]` at 1836-03-13 20:00). The family's student then had nobody for the whole of P3
(957 ticks, 151 min). **hh-8 was named the class's winner** with 627 (the Alamo's glory × its coin; `keptFor` counts no share
for the dead). In P3 the dead family still received the order to leave and, being played and present, **held the class at 20
minutes a tick for 144 ticks (22.8 min)** — auto could not pack for it (nobody at home) until its settlement's burn day.
`.scratch/dead-family.mjs dead`: the same, 72 ticks, and the ending names the dead family (the only played one) winner.

**Why it prevents play.** Rolls 1–3 are a lone parent (15%, half of them fathers), and a roll of 1 is that parent alone, whose one death ends the family;
nothing on the page tells that student what happened to their game or gives them anything to do (no role, no spectator
view), and "the family where everybody died wins" is the lesson the ending then teaches. **Direction.** Owner's call on
whether a wiped family can win; give its student something (follow a neighbour, a kinsman arriving, the Host's view); skip
the flight order and every clock hold for a family with nobody living.

## 8. Children-only families cannot act for themselves — Minor

**Repro:** `.scratch/dead-family.mjs orphans` (both parents dead, a girl of 3 and a baby, P3 at Gonzales): the student's
*Leave* from the child is refused *"Soledad is too young to be sent."*; the family goes a day later when auto packs for it,
holding the class 72 ticks meanwhile. `mainPersonId` is `null`, so `projectHousehold` sends `mainId: null` and the page's "!" for the
flight and the road (`family-panel.js` 432/434, `mainId || principalId`) sits on the dead father's row, where an order is
refused *"This person cannot act."* Road questions cannot be answered by a child (`sim/world.mjs` 913) and lapse. Rare in these runs (a few families), but it is the state a student is left in.
**Direction.** Let the eldest child give the family's own decisions (leave, road answers) when no grown person is left, and
put the "!" on a living row.

## 9. Small children stop a parent every ~76 seconds — Minor (load)

From the code, not a measured class: a child of 2–9 with nothing to do goes to a parent after `IDLE_TICKS` 2 and stops their
work until given something; play lasts `CHILD_WORK_TICKS['child-play']` 6 ticks; a child's own auto lasts 18–56 ticks. So at
the farming scale each small child needs an order about every 8 ticks (76 s at Study), and a rolled family can have up to
18 children. The scripted families here, which never ordered children, had parents stopped whenever the calendar held at
20 minutes. Owner-decided (docs/CHILDREN.md); recorded because in a big family it is most of what a student does.
**Direction.** Longer play, or a child's auto that lasts until the day ends.

## 10. `test:solo-game` flake — Minor (proof)

First run: `locator.click: Timeout 30000ms exceeded … element is not stable … element was detached from the DOM` on
`.panel-row[data-entity-id="hh-1-child-6"] .panel-icon[data-key="cut-lane"]` (a 17-person family, 100 ms a tick, machine
loaded by other runs). Rerun: 14 of 14. The same kind of re-render-under-the-click was noted for the flight card in
`HANDOFF.md` (Houston's camp section). **Direction.** Keep panel rows standing when only their numbers change.

## Also noted, no change proposed

- Every whole class ended with the ending reached; in a class nobody plays `winners` is empty, by design.
- The neighbours' families finish with final numbers far above any student's (e.g. `a30m`: 40,768 and 26,202 against the
  winner's 627). They are never ranked and the Host's closing table marks them *"(nobody played them)"*, but they sit in the
  same column as the winner's number; worth a look at whether the table reads as a leaderboard.
- The scripted students here sent road answers through the stored principal; when he was dead or taken these were refused.
  That is the harness, not the page (the projection resolves `mainId` to a living grown person), except for #8.
- The Gonzales fight with students' men in it held the class 84–138 ticks in a row (13–22 min); owner-decided (BATTLES.md §11).
