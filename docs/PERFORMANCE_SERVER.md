# What the classroom server costs, and what it sends

Measured 2026-09-17, after the owner's playtest: *"I was playtesting a little and it's exceptionally laggy. Very slow to load and a lot of problems with being able to navigate. This was on my school laptop. There's no way it'll work on the student chromebooks right? Or is the server doing some of the heavy work for that?"*

This document is the server's half: time per tick and per order, what is written to disk, and what goes over the wire. How long the page takes to load, how fast it draws, and panning and zooming are measured separately. **Everything here was measured on one desktop computer. No classroom, no Wi-Fi, no school laptop and no Chromebook was measured, and no acceptance on any of them is claimed.**

## The answer to the owner's question, in plain words

**Yes, the server does the heavy work of the game.** It runs the whole world: every family's people walking, working, hearing news, the automatic neighbours deciding what to do, the army, the calendar. It also decides what each student is allowed to see and do. On every tick it packs up each student's view and sends it. **A Chromebook runs none of the simulation.** It receives its own family's view — about 17 KB at the start of the game, growing to about 33 KB by the spring — once per tick (every 9.5 seconds at the normal pace). Then it draws that view. Whether a Chromebook can *draw* the game smoothly is the browser's question, measured separately. But it is not being asked to run the world.

**In Play Solo, the server and the page share one laptop.** Before this work the server took about 30–66 ms of one processor core per tick on this desktop, growing as the game went on. On a laptop several times slower, that is a fraction of a second of stolen time every 9.5 seconds. That is noticeable but small beside drawing the map. After this work it takes 21–35 ms on the same desktop. The server was not the main cause of a laggy solo game and is smaller now. If Play Solo is still slow, the page is where to look.

**In a class of 30, the server was the bottleneck.** When thirty students pressed an order at about the same moment late in the game, the last one waited **6.2 seconds** for an answer on this fast desktop. That would be several times longer on a teacher's laptop. After this work the same burst is answered within **0.94 seconds**. The server now sends 28 snapshots for that burst instead of 899.

## Method

`node scripts/perf-server-measure.mjs [--label L] [--ticks N] [--only solo|class] [--busy N]` writes `docs/evidence/perf-server-<label>.json`.

- **Worlds.** The real land of the colonies. Each is played forward by the simulation alone, with every family run by the neighbours' director, and captured at four points: arriving (tick 20), late period 1 (tick 250), period 2 (the winter, 120 ticks in) and period 3 (the spring, 80 ticks in). A family run by the director thinks on the server; a family a student plays does not. The *step* numbers below are therefore an upper bound for a real class.
- **Solo:** 15 families (the launcher's default), one student page and the Host page. **Class:** 30 families, 30 student pages and the Host page.
- **Real server.** At each point the world is written as a save with its students already joined. A real `createClassroom` opens it on a real port. Real event streams connect from a worker thread, so parsing the snapshots is not counted as server time. The server's `timings` hook (null on every real server) splits each tick into step, clone, validate, serialise, save, project and stringify. Event-loop delay and utilisation are the main thread's own.
- **Orders.** For the class, straight after a tick, all 30 students send one `set-auto` order at the same moment over HTTP. Recorded: slowest and median answer, server busy time, snapshots sent.
- **Contended.** For Play Solo on a weak laptop, the whole process was held to **two logical processors** (`ProcessorAffinity 0x3`), with **one extra thread spinning** beside the server as a stand-in for the browser. This is noisy: Windows gives a thread its whole time slice. Each side was run twice, and the range is reported.
- **Machine:** Intel Core i9-12900KF (24 logical processors), Node 24.18.1, Windows 11, NVMe disk. A school laptop or a Chromebook-class processor is several times slower single-threaded. That factor was not measured.

The *before* runs used the code at `60e683c` plus only the measurement hook. The *after* runs used this change.

## Before and after

Milliseconds of the server's one thread per tick, mean of 12 ticks. *ELD max* is the longest the server could not answer anybody: the worst event-loop delay while measuring.

| | point | tick before | tick after | before: step / clone / validate / save / project | after: step / validate / serialise / save / project | ELD max before → after | save file | student snapshot | Host snapshot |
|---|---|---|---|---|---|---|---|---|---|
| solo | arriving | 30 | 21 | 13 / 6 / 1 / 9 / 2 | 14 / 1 / 3 / 2 / 1 | 57 → 55 | 0.6 MB | 17.2 KB | 45 KB |
| solo | late period 1 | 41 | 23 | 12 / 11 / 1 / 13 / 3 | 11 / 1 / 6 / 2 / 2 | 66 → 48 | 1.9 MB | 18.9 KB | 64 KB |
| solo | period 2 | 58 | 30 | 15 / 18 / 2 / 19 / 4 | 12 / 2 / 10 / 3 / 2 | 89 → 57 | 3.3 MB | 25.7 KB | 72 KB |
| solo | period 3 | 66 | 35 | 13 / 22 / 2 / 24 / 4 | 11 / 3 / 14 / 4 / 2 | 93 → 63 | 4.2 MB | 31.9 KB | 82 KB |
| class | arriving | 249* | 54 | 95 / 16 / 3 / 35 / 95 | 29 / 1 / 4 / 2 / 15 | 508 → 155 | 0.9 MB | 17.1 KB | 81 KB |
| class | late period 1 | 147 | 75 | 42 / 19 / 2 / 19 / 62 | 31 / 3 / 10 / 3 / 24 | 186 → 102 | 3.6 MB | 22.2 KB | 113 KB |
| class | period 2 | 192 | 83 | 45 / 34 / 3 / 31 / 77 | 27 / 5 / 18 / 5 / 24 | 226 → 118 | 7.1 MB | 24.4 KB | 115 KB |
| class | period 3 | 242 | 87 | 45 / 48 / 4 / 47 / 96 | 22 / 5 / 25 / 6 / 24 | 315 → 116 | 9.1 MB | 33.4 KB | 117 KB |

\* The first class measurement includes the program warming up. An earlier run of the same code gave 70 ms at that point.

*save*, after, is the write averaged over all ticks. It happens on every third tick, or within five seconds. *project* is building every page's view: 31 pages in a class. Snapshot sizes are the same before and after, because nothing in the format changed.

**Thirty orders at once** (class, 31 pages open):

| point | slowest answer before → after | median answer before → after | server busy before → after | snapshots sent before → after |
|---|---|---|---|---|
| arriving | 1.67 s → 0.16 s | 0.87 s → 0.09 s | 1.74 s → 0.18 s | 961 → 30 |
| late period 1 | 3.39 s → 0.41 s | 1.80 s → 0.22 s | 3.53 s → 0.49 s | 961 → 30 |
| period 2 | 4.75 s → 0.69 s | 2.51 s → 0.36 s | 4.95 s → 0.72 s | 961 → 30 |
| period 3 | 6.20 s → 0.94 s | 2.89 s → 0.51 s | 6.49 s → 0.97 s | 899 → 28 |

(*Before*, one tick also landed inside each burst, so those counts include one tick's 31 snapshots.)

**Play Solo, contended** (two logical processors and a spinning thread; mean ms per tick, two runs each; the maximum single tick in brackets):

| point | before | after |
|---|---|---|
| arriving | 44 (101) and 164 (708) | 44 (185) and 36 (97) |
| late period 1 | 494 (1617) and 167 (378) | 51 (128) and 52 (110) |
| period 2 | 175 (807) and 208 (484) | 56 (147) and 62 (184) |
| period 3 | 125 (186) and 264 (983) | 60 (150) and 64 (110) |

Under contention the old server sometimes held its thread for over a second at a time. After the change, no measured tick took more than 185 ms.

Raw records: `docs/evidence/perf-server-before.json`, `-after.json`, `-before-contended.json`, `-after-contended.json`. The last two are both scenarios under contention, one run each, and too noisy to compare tick by tick. Also `-before-contended-solo-1/2.json` and `-after-contended-solo-1/2.json`.

## What was found, and what changed

Every claim below was checked against a profile or a measurement, not assumed.

1. **Filtering every event ever recorded, for every page, on every commit.** `projectWorld` filtered the whole history (13,000 events by the end of period 1 and 30,000 by the spring) to keep the newest 24. It did this for every page and for every automatic family that thinks. Profiled at about 44% of a projection. It now reads back from the newest event until it has 24. The events and their order are unchanged, which `tests/save-text.test.mjs` checks against the old filter for every family and the Host on a whole played game.
2. **Placing and sorting every felled tree to ask "are any logs lying out?"** `logsLying` looked up each felled tree's spot again from its id and sorted them by distance. It did this for every person's work list, on every projection: about 22% of a projection. `logsLeftOut` counts them without placing them, once per family per projection. `takeUpLogs`, which needs the nearest tree, still uses `logsLying`.
3. **A copy of each view before serialising it.** `projectWorld` ends in a `structuredClone`, so nothing holding a view can change the world. The server serialises each view at once and never keeps it, so its sends use `copy: false`. The text is byte-for-byte the same (tested). `app.snapshot`, `/api/state` and everything else still get a copy.
4. **A `structuredClone` of the whole class before every commit, only in case of a rollback.** At 9 MB this was the largest single cost of a late tick (48 ms). The class is now serialised once per commit, and that text serves both purposes. A refused or failed change is rolled back by parsing it, and a checkpoint writes the same text. Parsing is exact only while a class is plain JSON. `tests/save-text.test.mjs` holds a whole played game to that every 15 ticks, and fails if a field is stored as `undefined` (injected). A reopened save already depended on the same property.
5. **Writing and fsyncing the whole save on every commit.** Joining, recovering a family key, every Host command and Play Solo are still written before they are answered. A tick or a student's order is written within `SAVE_WITHIN_MS` (**five seconds**), or with the third unsaved tick at a quicker pace. A graceful stop writes everything first (`close()`), and so does New Class before it copies the save into the archive. A failed write puts the class back to its last save, paused, with `SAVE_FAILED`, exactly as before. `ceiling:` in `server/app.mjs` `commit`: a crash or a forced kill loses at most five seconds of ticks and orders. Writing every commit is the way back, at a write and fsync per order. The existing reliability tests (a failed tick rolls back to the save; a failed Resume is a 503 and retryable; a failed lobby join cannot skip the five-family rule) pass unchanged.
6. **Every commit sent every page a snapshot, even when nothing it showed had changed.** Pages that see the same thing now share one projection per broadcast. A page is not sent a snapshot identical, revision aside, to the one it was last sent, unless it made the change. Students' orders, and pages connecting or disconnecting, are broadcast at most every 200 ms. Ticks, Host commands and faults are never held. `ceiling:` in `broadcastSoon`: an order can be shown up to 200 ms after another page's order was. The way out is a per-family record of what changed. A page that is sent nothing is exactly as current as one sent the same view again, and it is spared parsing and drawing it. **The wire format did not change.** The page receives the same JSON. It may skip a revision, and it never relied on receiving every one.

Checked and left alone:

- **`validateWorld` every commit:** 1–5 ms at the largest class, about 5% of a tick. It is what stops a broken world from being saved, so it stays.
- **Static data per tick:** already fetched once. The map (`/api/map`), catalogues (`/api/chores`) and the family (`/api/family`) are not in the snapshot.
- **JSON.stringify of snapshots:** 2–3 ms for all 31 pages. Not worth touching.
- **Stream backpressure:** a page more than 1 MiB behind is still disconnected rather than queued.

Tests: `tests/save-cadence.test.mjs` (5) and `tests/save-text.test.mjs` (2). Each assertion was proven by injecting the regression it guards and watching the test fail. The injections: every order written at once; no timed write; `close` not writing; a failed write not put back; the fault pause lost on a refused order; unchanged pages resent; the sender not answered; ticks held with orders; New Class archiving the save as last written rather than as last shown; newest events out of order; sealed events shown; logs miscounted; the uncopied view differing; an event storing an `undefined` field. The first two also fail the tests that depend on a timed write, as expected.

**Browser proofs on this build (same computer, headless Chrome).** `npm run test:browser` passed: five pages each received every tick from 1 to 100, and pause, resume, reload and offline all held. `test:solo`, `test:host-live` and `scripts/verify-launcher.ps1` passed (8 PASS, 1 SKIP for the bundled runtime). `test:whole-game` and `test:solo-game` **fail at `60e683c` without this change**: the family last-name box (`#surname`) added in that commit covers the page, and the whole-game proof still waits for `#family-book`. The proofs had not been updated. With a local, uncommitted patch to the proofs that answers the last-name and looks boxes, both passed on this build: 14 and 15 checks, through all three periods. The proofs themselves still need that fix.

## What remains, largest first

At the end of a 30-family game, on this desktop:

1. **Building 31 pages' views: 24 ms per tick.** About 0.8 ms per page, now led by counting each family's logs lying out (a walk over every felled tree, about a thousand by the spring), `observedBy` (who else stands where your people stand) and the work lists (`choresFor`). The way out is to project only the pages a change touched. That needs a record of which families each change affects.
2. **Serialising the class: 25 ms per commit, and every order is a commit.** The save is 9 MB by the spring, and **88% of it is the event history** (30,000 events). Two ways out: cloning everything except the append-only event list, if events are made provably immutable (one place, the founding line, is corrected in place today); or keeping less history in the live class. The second is a game-design question.
3. **The step: 22–31 ms, about 60% of it the automatic neighbours thinking.** Each thinking family builds a full projection of its own view, and pathfinding (`findWay`) takes about 30% of a step. In a class where students play their own families, this is much smaller.
4. **Snapshot size.** 17–33 KB per student and 45–117 KB for the Host, per tick, all game. At the study pace that is about 3.5 KB a second per student, and roughly 100 KB a second for a class of 30 on the Wi-Fi. At the quick pace (1 s) it is ten times that. Changing the format belongs with the page's work.
5. **The save file grows without limit** (0.6 MB → 9 MB). Serialising and writing it grows with it.

None of this has been measured on a school laptop, a Chromebook, or a classroom network. The contended runs are a same-computer stand-in and nothing more.


## Thirty orders at once, late in a class of 30 — 2026-09-29 (triage 1.6)

The triage of the 2026-09-28 audits (item 1.6, classroom audit C-S4 and C-M10) found the class above never measured again at the
size a class now is: 30 families by default, each rolled (about ten people a family, not the founding four), with 78 commits in
`sim/` since. The audit had seen 30 orders at once in period 3 take up to 15 s. Measured again, then changed. **Same computer,
the desktop above; no school laptop, Chromebook or classroom network.**

**Method.** `node scripts/perf-server-measure.mjs --only class --rolled` as above: 30 rolled families on the real land, every one
run by the director (an upper bound on the step), 30 student pages and the Host's open, 12 ticks at 1.5 s, then all 30 students
send `set-auto` at the same moment straight after a tick. Added to the script: each order's commit split (the order, the check,
the serialisation), how many orders a commit made, the broadcasts that showed them, and the process's memory. `PERF_SERVER`
points it at another copy of the server, so **the before (origin/main at 80842f72) and the after were run alternately in one
sitting, twice each**, with the machine otherwise quiet (the four points played forward in 81-86 s each run). Raw:
`docs/evidence/perf-server-tier2-before.json`, `-tier2-before-2.json`, `-tier2-after.json`, `-tier2-after-2.json`.

**What was found.** The answer was not the order's own cost. Every order's commit checked the class (`validateWorld`, 10-12 ms
in the spring) and serialised it (33-35 ms, a 12 MB class, 34,000 events), and that is 1.3 s for thirty. But each order's
broadcast, which projects all 31 pages (0.3 s in the spring), ran **inside the order's commit**: the gap between broadcasts
(`BROADCAST_GAP_MS`) was counted from the *start* of the last one, so by the time a 0.3 s broadcast ended the gap had passed and
the next order broadcast again at once. Thirty orders were thirty broadcasts end to end.

**Thirty orders pressed at once** (slowest and median answer, server busy, two runs each):

| point | slowest before | slowest after | median before → after | busy before → after | commits for 30 orders |
|---|---|---|---|---|---|
| arriving (period 1) | 0.29 s, 0.45 s | 0.06 s, 0.04 s | 0.15-0.32 s → 0.04-0.06 s | 0.40-0.70 s → 0.17-0.34 s | 30 → 2 |
| late period 1 | 0.91 s, 0.75 s | 0.07 s, 0.07 s | 0.50-0.65 s → 0.07 s | 1.2-1.4 s → 0.31-0.33 s | 30 → 2 |
| period 2 (winter) | **7.3 s, 7.4 s** | **0.11 s, 0.08 s** | 3.9-4.0 s → 0.08-0.11 s | 7.7 s → 0.29-0.40 s | 30 → 2 |
| period 3 (spring) | **12.8 s, 12.3 s** | **0.62 s, 0.71 s** | 6.7-7.0 s → 0.62-0.71 s | 13.0-13.7 s → 1.5 s | 26 → 6 |

(In the spring a tick, 0.47 s, lands inside the burst in both; its time is in *busy*, and the before made 26 of the orders' commits
before the burst's window closed.)

**The rest, per tick, at the spring, both runs** (ms of the server's one thread): the whole tick 457-564 (step 86-108, check
10-15, serialise 33-42, projecting 31 pages 308-376); every commit's check 10-16 ms and serialisation 33-40 ms, before and after -
the after's are per *batch* of orders. The longest the server could not answer anybody while ticking: 0.53-0.77 s. The save file
at the spring: 11.8 MB. Memory of the measuring process at the spring point: 1.2-1.7 GB resident, 0.6-1.4 GB of heap - **an
upper bound on a real server's**, because this process also holds the four played-forward worlds and the page-reading worker.

**What changed** (server/app.mjs; nothing in `sim/`, no save version):

1. **An order is never shown from inside its own commit, and the gap is counted from the end of the last broadcast, never
   shorter than it took** (`broadcastWait`). While orders keep coming, showing them takes at most half the server's time.
   `ceiling:` an order can now be shown as long after the last broadcast as that broadcast took (0.3-0.4 s in the spring), where
   before it was 0.2 s - but before, the thirtieth order waited twelve seconds to be answered at all.
2. **Orders that arrive in the same moment are made in one commit** (`queueOrder`, `makeOrders`): checked once and serialised
   once, 30 orders in 2 commits. **Valid refusal is kept exactly**: nothing of a batch is answered or shown until its commit has
   gone through; an order that is refused puts the whole batch back, and it is made again with the orders before it together, the
   refused one alone - refused in its own commit with its own words - and the orders after it together. Every answer is the
   one the orders made one at a time in that order would have given (`tests/order-batch.test.mjs` holds thirty orders, two
   refused and one sent twice, pressed at once in one class and one at a time in another dealt from the same seed: every answer
   word for word and the world after the same).
3. The triage's two suggestions were weighed and not built: *checking only what an order touched* needs every action to say
   what it touches; *serialising on the save timer only* leaves a refused order nothing exact to be put back to. Gathering gives
   the saving of both without either.

**What remains.** A tick of a 30-family class in the spring is 0.46-0.56 s of the server's thread here, of which projecting the
31 pages is 0.31-0.38 s; at Quick (a tick a second) that is half the thread, and a school laptop is slower. The next step is still
the one above: project only the pages a change touched. 30 house-site checks at once (`/api/site`) and the battle views on a
Chromebook were not measured.
