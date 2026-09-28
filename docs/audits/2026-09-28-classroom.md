# Audit: running it in a real classroom — 2026-09-28

**Scope.** The owner (2026-09-28): *"check for problems with the game. we're specifically looking for things that would
prevent the game from being played as intended."* This slice covers **running the game in a classroom**: joining,
reconnecting, the teacher's controls across several class days, what the Host shows, load at 30 students, the school
network, updates between days and accessibility. Nothing in the code was changed. This is a list of findings only.

**How it was checked.** Code and docs were read on `main` at `aa35088` (v2026.09.28.1). Where a finding says **proved here**,
it was run on this computer:

- a real `createClassroom` driven over HTTP: joining 17 students, Start, a late join, four tabs, the away list and claim,
  End Game, Resume, Continue, and a restart on the same save;
- headless Chrome (at most two contexts at once) at 1366×768: joining, reload, a 6-second offline blip, the server
  unreachable for 5 seconds, the Host lobby, and one click on End Game;
- the real `server/main.mjs` killed with `Stop-Process -Force` and then launched again;
- whole classes stepped in process to the ending with played families who never answer (the same method as
  `scripts/battle-class-time.mjs`);
- `scripts/perf-server-measure.mjs --only class --rolled` (30 families, 30 pages);
- a save made by v2026.09.26.1 (via `git archive` into scratch) opened by this build, and a save from this build opened
  by v2026.09.26.1.

The scratch scripts and the perf JSON were not committed. Everything ran on one computer, so nothing here is a claim
about a physical LAN, district Wi-Fi or a Chromebook.

Severity: **blocker** stops a normal class from playing as intended. **Serious** will visibly damage a class, or
reliably cost class time or fairness. **Minor** is friction.

---

## Blockers

### B1. A class cannot hold more than 15 students, and the teacher cannot change it

- **Where:** `server/main.mjs` (`playerCount: Number(process.env.PLAYERS || 15)`) and `server/app.mjs` `/api/join`
  (`if (count >= state.world.playerCount) … 'Class is full.'`). `launcher/LauncherForm.cs` says the class size is a
  developer setting, and **New Class** keeps the size (`s.world.playerCount`).
- **What happens:** the 16th student to join is told *"Class is full."* Proved here: joins 16 and 17 got `409 Class is
  full.` The teacher has no control for this. It needs an environment variable set before launch, and neither the
  launcher nor the Host page offers one.
- **Why it prevents play:** a middle-school class is usually 22 to 30 students. The docs, the perf work and this audit
  all talk about "30 students". Pairs sharing one Chromebook is the only workaround.
- **Direction:** let the teacher set the class size (5–30) before the first join, or default to 30. The unjoined
  households are already run by the director, so a larger default costs nothing in play.
- **Provable here:** yes (proved).

### B2. A student who is late or absent on the first day can never join the class

- **Where:** `server/app.mjs` `/api/join`: `if (state.world.status !== 'lobby') return 409 'This class has started.'`
  `/api/rejoin` and `/api/claim` only move households that already have a client (RECOVERY.md: *"it cannot get a
  latecomer into a class that has already started"*). `docs/LESSON.md` §6 ceiling: a late joiner gets no guided start.
- **What happens:** once Start is pressed, a student who walks in five minutes late is refused. So is a student who was
  absent on day 1 of a unit that runs 4–7 class periods (see S3). Proved here: after Start, a join returned *"This class
  has started. Existing players can reconnect."* This happens even though the class has spare families that nobody plays
  (for example 15 households with 12 joined).
- **Why it prevents play:** in a multi-day unit, a student missing on day 1 is locked out of the whole unit. Late
  arrivals happen in every class.
- **Direction:** let a latecomer take an unjoined family that the director runs, with the class code (a join into
  `playerCount` minus joined), and give them the guided start stored at join (the way out LESSON §6 already names).
- **Provable here:** yes (proved).

### B3. A short network or server outage throws a student to the join screen with a false message, and the page never comes back by itself. The fix for the real class's lost student was never wired into the page

- **Where:** `public/app.js` `connect()`. `events.onerror` waits 1.5 s and calls `api('/api/state')`. If that fetch fails
  for any reason, including no network, it calls `showJoin('You are no longer joined to this class. Use your family key
  to come back…')`. The Host page gets `'This Host session ended. Reopen the Host page from the launcher.'` The page
  never calls `/api/away` or `/api/claim`. The "pick your own name off a list" door (`FIC-GONZ-186`, built 2026-09-21
  after a real student could not get back in) exists only on the server. HANDOFF says *"The student's side of it is the
  screen agent's … has been sent the contract."* The endpoints `public/` calls are `chores`, `command`, `events`,
  `families`, `family`, `host`, `join`, `map`, `rejoin` and `state`.
- **What happens:** proved here. A joined student's page, with the server unreachable for 5 seconds and then back on the
  same port: the page showed the join form with the message above (printed twice). Twelve seconds after the server
  returned, it was still on the join form. The student's cookie was still valid, so a reload would have worked, but
  nothing on screen says so. The message sends the student to a family key they almost certainly do not have. (A
  6-second Playwright `setOffline` did **not** trigger it on loopback, so the proof uses a server outage, which takes the
  same code path as a failed fetch.)
- **Why it prevents play:** a Chromebook waking from sleep, a Wi-Fi roam, or the teacher restarting the server all
  cause more than 1.5 s without a server. This is very likely the 2026-09-21 *"a student was disconnected and could not
  get back in"*, and it is still open from end to end. The projected Host page fails the same way, which breaks "walk
  away".
- **Direction:** on a network failure, keep retrying `/api/state` with backoff and say "Reconnecting…". Show the join
  screen only on a real 401. Wire the away list and claim into the join screen.
- **Provable here:** the server-outage path, yes (proved). A real Chromebook sleeping and waking needs devices.

### B4. "End Game" is one click, cannot be undone, and names a winner. A teacher at the bell will press it

- **Where:** `public/index.html` `#host-controls` (*Start, Pause, Resume, End Game, Continue…, New Class, Stop Server*).
  `public/app.js` `confirmLabel` confirms `new-class` and `stop-server` but not `end`. `server/app.mjs`: `end` sets
  `ended` from running or paused, `resume` only works from `paused`, and `next-period` needs `canContinue`, which needs
  the period's closing milestone.
- **What happens:** proved here. Two seconds into a class, **one click** on End Game ended it. The Host showed *"THE END
  OF THE STORY … Elias's family finished first, with a final number of 10."* The only control left was **New Class**.
  Over HTTP, `resume` gave *"Host action unavailable"* and `next-period` gave *"Only a class that has finished its first
  period can go on to the winter."*
- **Why it prevents play:** the game spans several class days (S3). "End Game" sitting beside Pause reads like "end
  today's session". One mistaken click ends a multi-day class for good, short of hand-editing the save, and crowns a
  winner.
- **Direction:** confirm End Game in the page, as New Class is. Say in words that it ends the whole war and that Pause
  or Stop is for the end of the day. Consider allowing an ended class to be reopened as paused.
- **Provable here:** yes (proved).

### B5. A class server that did not stop cleanly (shutdown, Windows Update restart, crash, End Task) blocks the next day's class, and the teacher cannot clear it

- **Where:** `server/storage.mjs` `acquireSaveLock` never removes a lock, stale or not. `server/main.mjs` handles only
  `SIGINT` and `SIGTERM`: no `SIGHUP`, and Windows log-off and shutdown events are not handled (HANDOFF: *"Windows
  log-off not driven"*). Closing the launcher does not stop a class (`LauncherForm` `FormClosing` stops only solo). The
  launcher's `StaleLockMessage` says *"a developer can clear the leftover mark by following … docs/RECOVERY.md"*. But
  `scripts/package.ps1` refuses to ship `docs` and `VISION.md`, and the RECOVERY PowerShell script refuses to run unless
  `VISION.md` and `server\storage.mjs` sit in its folder and the save is the repository's `data\classroom.json`.
- **What happens:** proved here. `server/main.mjs` was started, force-killed and started again. It exited at once with
  `storage.mjs:32 throw new Error(detail)` (the stale-lock refusal). On an installed copy, the procedure the launcher
  points to is not on the machine, and would not run if it were.
- **Why it prevents play:** a teacher who closes the launcher and shuts the laptop down with the class still up, or whose
  laptop restarts for updates overnight, arrives to a class that will not start. Only a developer can recover it.
- **Direction:** handle Windows shutdown and log-off in the launcher by stopping the class gracefully first. Have the
  launcher offer "the last class did not close properly; open it anyway" when the recorded PID is definitely gone
  (backing up first, as RECOVERY's script does).
- **Provable here:** force-kill, yes (proved). A real Windows shutdown or restart needs driving on a real machine.

### B6. One installation holds one class, so a teacher with several sections cannot run the game for more than one of them across days

- **Where:** `server/main.mjs` uses one `classroom.json` (`resolveSavePath`). **New Class** archives the current class to
  `data/archive/` and starts over. RECOVERY: *"no UI for restoring an archive"*. DEPLOYMENT: *"Not yet built: … browsing
  or restoring archives from the UI"*. `SAVE_PATH` is a developer override.
- **What happens:** traced from code. Period 2's class and period 4's class cannot both be kept for the next day. Starting
  a second section archives the first, and the first cannot be reopened.
- **Why it prevents play:** a middle-school history teacher commonly teaches the same unit to 4–6 sections. With a game
  that takes several class days (S3), only one section can play it per install.
- **Direction:** named class slots, one per section, chosen in the launcher or on the Host page, each with its own save
  and code. The save lock and data folder already work per file.
- **Provable here:** yes (traced; demonstrable with New Class).

---

## Serious

### S1. A class left running plays itself: nobody connected does not pause it, and closing the Host or the launcher does not either

- **Where:** `server/app.mjs` `tick()` pauses on its own only for solo (`familyMaking`). There is no rule for a class with
  no pages. The README says *"Closing a browser window does not stop it."* `markAbsences` hands every family whose page
  closed to the director after 2 minutes.
- **What happens:** proved here. With every page closed, the class kept `running` (ticks 2 → 21 in 6 s at a 300 ms test
  pace). Families whose page had been open went absent and were run by the director. A teacher who forgets Pause at the
  bell, on a desktop PC or a laptop that does not sleep, comes back to a class the director has played. Period 1 is
  about 90 real minutes at Study (S3), so it can play to the interim end on its own.
- **Why it matters:** "launch, press Start, walk away" has no safety at the end of the day. Nothing that was played can
  be rewound.
- **Direction:** pause a class automatically when no student page has been connected for N minutes, and say so on the
  Host.
- **Provable here:** yes (proved).

### S2. After a restart, a student who does not come back is never marked absent, so their family neither plays nor is played, and it holds the class

- **Where:** `server/app.mjs` `markAbsences`: `gone = !here && at !== undefined && now - at >= absentMs`. `lastSeen` lives
  only in memory, so after a restart `at` is `undefined` for everybody until their page opens.
- **What happens:** proved here. On day 1 all five students played, the class was paused and closed. On day 2 four came
  back and one did not. After three times the absence grace, the missing family was `absent: false` and the Host read it
  **gone**. It was not handed to the director. A played, not-absent family holds the class's calendar while a rider waits
  on it (`sim/clock.mjs` `deciding`, up to `PATIENCE_MINUTES`, about 9.5 real minutes at Study). It also holds a fight's
  quiet phases (`familyThere`) and the flight and road questions. It never acts.
- **Why it matters:** students are absent every school day. HOST_PAGE §2.4's promise that *"nobody's absence holds the
  class"* fails from day 2 onwards. S3 shows what idle played families cost.
- **Direction:** after a restart, start every joined family's absence clock when the server starts (or treat "never seen
  since start" as seen at start).
- **Provable here:** yes (proved).

### S3. A whole game is 3.3 to 5.6 hours at Study, which is 4 to 7 class periods. The one figure a teacher is given says 54 minutes

- **Where:** `docs/evidence/battle-class-time.json` measures a class **in which nobody plays**. Played families hold the
  calendar (`sim/clock.mjs` `deciding`, `sim/military-pacing.mjs`, the lapse budgets). `README.md`, the one teacher-facing
  doc shipped, says *"a prototype of one afternoon … about 54 minutes … It stops after the fight."* COLONIES §7e (owner):
  *"Each day stays near fifty minutes."*
- **What happens:** measured here by stepping whole classes in process at 9.5 s a tick through all three periods to the
  ending, with played families who never answer. Real students sit between the first row and the rest.

  | 15 households | Period 1 (to Dec 15) | Period 2 | Period 3 | Whole game at Study |
  |---|---|---|---|---|
  | nobody played (the published figure) | 560 ticks, 89 min | 300, 48 min | 392, 62 min | 1,252 ticks, **3 h 18 min** |
  | 5 played, never answering | 719, 114 min | 300, 48 min | 743, 118 min | 1,762 ticks, **4 h 39 min** |
  | 15 played, never answering | 844, 134 min | 300, 48 min | 970, 154 min | 2,114 ticks, **5 h 35 min** |

  Not counted: the lobby (roll, surname, looks, packing), each day's start (launch, 25 students logging in and
  recovering), battle holds for families actually at the fights (+30 min in `battle-class-time`), and pauses. Period 1
  alone is two to three 45–50 minute periods, so the interim standings at Béxar never land on a bell. At Brisk (4 s) the
  nobody-played game is about 83 minutes, and 15 idle families about 141.
- **Why it matters:** a teacher plans the unit from the README and gets one period. The owner's "near fifty minutes a
  day" is not met by any period.
- **Direction:** measure a class with students playing (a scripted "slow reader" who answers late), publish the class-day
  count per pace in the README and on the Host, and decide whether period 1 should end sooner or whether to recommend
  Brisk.
- **Provable here:** yes (measured, in-process, one seed).

### S4. Server cost has grown sharply since 2026-09-22: 30 orders at once late in the game now take up to 15 seconds to answer on a fast desktop

- **Where:** `scripts/perf-server-measure.mjs --only class --rolled --ticks 8`, one run on the i9-12900KF, against
  `docs/evidence/perf-server-rolled-2026-09-22.json` (same options).
- **What happens (measured here):**

  | point | tick total ms, 09-22 → today | project ms | 30 orders at once: slowest / median, 09-22 → today |
  |---|---|---|---|
  | arriving | 178 → 206 | 48 → 73 | 0.21 / 0.12 s → 0.26 / 0.14 s |
  | late period 1 | 202 → 328 | 119 → 188 | 0.48 / 0.26 s → 0.76 / 0.48 s |
  | period 2 | 178 → 315 | 89 → 171 | 0.75 / 0.41 s → **4.43 / 3.54 s** |
  | period 3 | 332 → 495 | 233 → 314 | 1.36 / 0.87 s → **14.86 / 5.31 s** (commit 562 ms per order) |

  Save 9.6 → 11.8 MB. Student snapshot mean 49 → 53 KB (max 132 KB). Host 196 KB a tick.
- **Why it matters:** PERFORMANCE_SERVER says a teacher's laptop is "several times slower single-threaded". A burst of
  orders after a big moment (the call to leave, the war's questions) would take tens of seconds to answer. Students click
  again, and every page stalls behind the one thread.
- **Direction:** profile the order path in periods 2 and 3 (commit cost went from about 45 ms to 562 ms per `set-auto`).
  Re-run on a school laptop.
- **Provable here:** the desktop numbers, yes (one run: re-run before acting). A teacher's laptop needs the device.

### S5. The family key is the only way back on another Chromebook, and it is hidden in the journal. Cart or guest Chromebooks lose the cookie every day

- **Where:** `public/index.html` `#family-key` sits inside the closed Journal. `public/app.js` notes *"Write this down…"*
  but nothing prompts it. Cookies are `SameSite=Strict; Max-Age=604800` (7 days). The Host's **Recover a student** shows
  one family at a time for 30 s.
- **What happens:** proved here. Straight after joining, the key (`G86X JXMQ`) was in the DOM but not visible
  (`journalOpen: false`). A student on a different Chromebook the next day (carts, guest mode) has no cookie. The away
  list that needs no key is not on the page (B3). A unit that spans more than 7 days (A/B block schedule, a holiday)
  expires every cookie.
- **Why it matters:** day 2 of a cart-based class starts with 20+ one-at-a-time key lookups by the teacher.
- **Direction:** wire the away list (B3). Show the key once, prominently, after the family is made. Consider a longer
  cookie.
- **Provable here:** the page part, yes. Cart and guest behaviour needs devices.

### S6. At Start the teacher cannot see who has finished making their family, and Start closes the wagon and stock choices, which decide the land grant

- **Where:** `sim/wagon.mjs:208` (*"The class has begun. What the wagon brought is what the family has."*). Stock and
  wagon are `LOBBY_ACTIONS` only. `server/app.mjs` Start rolls only students who never rolled. The Host class panel
  (`renderHostLive`) names each row by the family (*"Thomas's family"*), not by the student, and shows no packing or
  looks progress.
- **What happens:** proved here (Host in the lobby with 3 joined). Rows read *"Thomas's family — SAN FELIPE DE AUSTIN —
  GONE"* with the people *"on the road home"*. There is no "done packing" mark and no student name. A student still on
  the looks or packing screens when Start is pressed keeps the default load and stock. Per the Play Solo note in
  `server/app.mjs`, that means a labor rather than a league and a labor. Land counts in the final number
  (`sim/ending.mjs` `finalNumber`).
- **Why it matters:** fairness between students, and the guided start for 30 at once, depends on the teacher knowing
  when the room is ready.
- **Direction:** a per-student "ready" mark on the Host in the lobby, and the student's name on each row.
- **Provable here:** yes.

### S7. Thirty Chromebooks opening the game ask the teacher's computer for about 470 MB at the same moment

- **Where:** `docs/PERFORMANCE_LOAD.md`: a cold load is 15.6 MB (15.2 MB of it PNG atlases). The WebP decision is still
  with the owner.
- **What happens:** calculated, not measured with devices: 30 × 15.6 MB ≈ 470 MB. That is 40–75 s of a good shared
  classroom access point at best, before contention. Art is cached immutably, but only on the same Chromebook and profile
  (guest mode and carts load cold every day).
- **Why it matters:** the first minutes of every class day, and the day-1 guided start, are spent loading.
- **Direction:** take the owner's WebP decision (−71% at q90). Measure a class of real Chromebooks starting at once.
- **Provable here:** no. Needs devices and the school access point.

### S8. A keyboard-only student cannot finish the guided start

- **Where:** `public/app.js`. `lookAtSite` and `lookAtPlot` are called only from the pointer handler (line ~1709). The
  map's `keydown` pans and zooms only. Choosing the house site, surveying, clearing, fencing, hunting and felling are all
  "tap a place on your land".
- **What happens:** traced from code. There is no keyboard or screen-reader route to step 1 (`arrive`: choose the site)
  or steps 4, 5 and 9, so such a student can only X the guided start away.
- **Why it matters:** students with motor accommodations (504 or IEP) cannot play the core farm loop.
- **Direction:** Enter on the focused map picks the point under the centre cross-hair. Alternatively, offer "suggested
  places" buttons from the server.
- **Provable here:** yes.

### S9. The school network is still unproven beyond one real class

- **Where:** `docs/GATES.md`: five devices, thirty devices and district Wi-Fi are **NOT YET TESTED**. The installer is per
  user and unsigned, and `runtime/node.exe` listens on `0.0.0.0:1835`. No firewall rule is created. On a domain-managed
  laptop the local "Allow" prompt may be suppressed by policy, or need an administrator.
- **What happens:** the 2026-09-21 class on the owner's school network ran (HANDOFF). That is real evidence for that
  network and teacher laptop, but it is one room with 15 or fewer households. Nothing is fetched from the internet at
  runtime (CSP `default-src 'self'`, no CDN or fonts; checked). The launcher's update check reaches `api.github.com`, and
  release downloads redirect to a `*.githubusercontent.com` host that some filters block (not proved either way).
- **Why it matters:** a second teacher, or a second school, may find the students cannot reach the server at all.
- **Direction:** run the DEPLOYMENT independent-device procedure at 30 devices. Add a "can students reach me?" self-test
  to the launcher (for example, a student page pinging back).
- **Provable here:** no. Needs devices and the district network.

---

## Minor

| # | Where | What happens | Direction | Here? |
|---|---|---|---|---|
| M1 | `server/app.mjs` `pace` (*"A class reopened tomorrow opens at the pace the build ships with"*) | Brisk chosen yesterday is Study today, silently (proved: restart showed pace 9500). | Keep the pace in the save, or say it on the Host after a restart. | yes |
| M2 | Class code: `randomBytes(3).toString('hex').toUpperCase()`, compared exactly | Hex codes mix 0/O, 8/B and D/0 in some fonts. The family key forgives O→0 but the class code does not (lowercase is accepted; proved). The join address is a raw `http://IP:1835/` in small type top-right on the projector, with no QR code. | Forgive O for 0 in the code; show the address large; add a local QR. | yes |
| M3 | `/api/join` | Duplicate display names are accepted (two "Sam" → hh-2 and hh-3, proved). Recover a student then lists two identical names. | Refuse or number duplicates. | yes |
| M4 | `server/app.mjs` `/api/events` (`>= 3` → 429) and `public/app.js` `connect` | A 4th tab gets 429 (proved). The page's error handler then reconnects every 1.5 s against the same 429. Half-open streams from a slept Chromebook count towards the 3, and a rejoin/claim is refused *"Someone is already playing that family"* until the server notices the dead socket. | Close the oldest stream instead of refusing the newest; say "open in another tab". | partly; timeout needs devices |
| M5 | Rollback | A save written by this build is refused by v2026.09.26.1 (*"Invalid hidden obedience"*, proved). Reinstalling an older release after a bad update leaves the class unopenable until the fix lands. The forward direction works (below). | Note it in the release notes; keep releases mid-unit to fixes. | yes |
| M6 | Page text at 1366×768 (proved) | The smallest visible text is 9.5 px (*Show names*), 10 px (the action name, *STEP 1 OF 10*, eyebrows) and 11 px (*Prototype · fictional families*, captions). | 12 px minimum on the student page. | yes |
| M7 | Reading level (estimated Flesch-Kincaid on the source strings) | Rumor Mill lines grade ≈7.0, rider/director news ≈7.2, settlement calls ≈7.3 (about 13 words a sentence). Lesson steps are shorter. At grade for 7th-grade Texas History, but hard for below-grade readers, with no read-aloud. | Optional plainer line or read-aloud for the news cards. | yes (estimate) |
| M8 | `server/app.mjs` `rejoinCooldown` (per remote address) | If a district NATs students behind one address, five wrong class codes on the away/claim doors lock everyone out for 30 s (already a named `ceiling:`). | Per-key or per-cookie counters. | needs network |
| M9 | Host at an interim ending | **New Class** sits beside **Continue to the winter** (New Class is confirmed with a second click). A New Class there archives the unit with no restore UI. | Hide New Class while a class can continue. | yes |
| M10 | Unmeasured | How long the guided start takes a real student at Study, and whether 30 students choosing house sites at once (`/api/site` lays a lane on the one thread; its own `ceiling:`) stalls the server. The Chromebook frame rate with the battle views drawn (PERFORMANCE_RENDER predates the battle engine). Server memory at 30 families. | Measure. | partly / devices |

---

## What worked (checked here)

- **A class save opens after an update.** A save made mid-period 1 and one made in period 2 by **v2026.09.26.1** both
  opened on this build (`validateWorld` ok) and played on through Continue into periods 2 and 3 to the ending, with every
  student and Host page projected along the way. No world, director or household key is new since then (only the
  transient `arriving`).
- **Stopping and resuming keeps everyone's family.** Close and reopen on the same save: the same session, 15 clients,
  and a student cookie returning to its own household. Pause is kept (Stop Server and the launcher's Stop pause first).
- **Refresh mid-class** returns the same family, with the game shown (browser).
- **Two tabs** for one student both stream. The rejoin and claim doors both refuse a family someone is playing.
- **A lowercase class code** is accepted (browser).
- **Starting with fewer than five** asks for a second press, and says so in words.
- **Nothing is fetched from the internet** by the class server or pages at runtime.
- **The delta updater** is proved from 127.0.0.1 in DEPLOYMENT's evidence. It refuses to run while a class runs, and
  never touches `data`. It has not been proved against real GitHub or a school filter (S9).

## How many class days a unit is, in one line

At Study, the war alone is **3 h 18 min** if nobody played and **4 h 39 min to 5 h 35 min** with played families who are
slow to answer. Add a lobby of about 10–15 minutes and 5–10 minutes of logging in each day, and that is **5 to 8** periods
of 45–50 minutes. At Brisk it is about **2 to 4**. Stopping and resuming works cleanly and keeps everyone's family,
provided the teacher presses **Pause/Stop** and not **End Game** (B4), the laptop is not shut down with the class up
(B5), and nothing is left running (S1). Students absent on a later day are not handed to the director (S2), and students
absent on day 1 can never join (B2).
