# The flashback: a family's story as a minute of video, made on the Host's computer

**Status: owner-asked 2026-09-28, built 2026-09-28 on a worktree branch (not released).** Fixes the design audit's **B3** (no
epilogue, no revelation, no dead) and **B6** (the homecoming almost never happens in class time), and with them **S24**, **S25**
and **S27** (docs/audits/2026-09-28-design.md). The owner decisions it leaves open are §10.

Code: `sim/flashback.mjs` (the story), `sim/homecoming.mjs` (the trip home), `sim/ending-story.mjs` (the ending's words),
`server/flashback.mjs` and `server/webm.mjs` (keeping and checking the videos), `public/flashback.js` (drawing, recording and
playing), `public/webm-writer.js` (the WebM file). Hooks: `server/app.mjs` (routes and the snapshot's `flashback`), `public/app.js`
(`bindFlashback`, `renderFlashback`, `flashbackCamera`, `flashbackGround`, the video's clock), `public/art.js` (`sheetsInFlight`),
`sim/ending.mjs` (three calls into `sim/ending-story.mjs`), `public/ending.js` (the family's questions), `public/index.html`
(`#flashback` in the ending panel).

---

## 1. What the owner asked for

> "a full family recap and flashback story. it should be a 1 minute video generated from key points and decisions they made,
> recorded and saved on the host computer and played back for the student at the 3nd of the game."
>
> "add their trip home as part of the end of game video flashback"
>
> — the owner, 2026-09-28 (the audit had found the ending "at most five fixed lines", with nothing lifting the fog of war, and
> that most families never get home before the class ends)

## 2. The story: key moments and decisions (`sim/flashback.mjs`)

When the class has ended **for good** (`flashbackReady`: `status` 'ended' and not the interim standings of periods 1 and 2), each
family's story is chosen from the class's own record - the event log, the participation and glory ledgers (for *who went*, never
for points), the battles' staged fates, the flight, the knowledge each family had and when it came - into **ten to fifteen beats**
that share out exactly **60 seconds**: a title card, then, in the order it happened, the most important of

| Beat | From | Picture |
| --- | --- | --- |
| The arrival and the roll: who came, with how much coin | `household-founded`, the family, `means` | the land, the camp, the wagon |
| The house raised; the fields cleared and what was planted | "The house is built", "The field is N acres now", the crop choices | the house as it stood then |
| The first call, answered or not, and by whom | the `FIC-GONZ-031` call and the answers | a rider at the house |
| Who went to which fight, and what came of it | participation and awards (who), the battle's staged fates (what) | the **battle engine's own projection** at seven moments through the fight |
| A death, a capture | the person's own record | plain words; nobody is drawn falling |
| The order to leave; the flight and its load; soldiers behind; a flooded river; sickness; help given and taken; the refuge | the flight, its record (`FIC-GONZ-046`, `-049`, `-051`, `-489`, `-663`) | the road, the family and the wagon going along it, dragoons behind in a chase |
| The farm burned, and when the family learned it | `flight.burned`, `burnedBy`, `burnKnown` | the ruin, smoke |
| The news as it reached them, and how late | `world.knowledge` against the true date | a rider at the house |
| **The trip home** and what they found | `sim/homecoming.mjs` (§3) | the road home; the house standing or in ashes |

and a closing card: who was home, who was still a prisoner or with the army, and who did not come home.

**The fog lifted.** A beat may carry a **"meanwhile"**: something true and important happening at that moment that the family
did not know yet - the Alamo's fall on the day of it, Fannin's surrender, Santa Anna over the Brazos, a town burned, a column's
march - with when the family heard, or that it never did. They come from `world.truth` and the record's dates only (`happenings`),
never from what the family believed, and a topic the family already had at that moment is never shown as news. On the map the
Mexican columns are drawn **where they truly were** at the beat's moment (`columnsNow` at that minute), not where the family
knew them to be.

**The words** are the ending's rules and the game's: plain, middle-school, first names (the family's name is on the title card),
a big family counted rather than listed.
- **No gore** (VISION.md §16): a death is one plain sentence - who, where - and the list `GORE_WORDS` is refused.
- **No virtue labels** (VISION.md §20): `VIRTUE_WORDS`, the ending's own list.
- **Glory is not in the flashback at all.** The numbers are the ending's (MONEY_AND_GLORY.md: the numbers must never replace the
  epilogue), so nothing in the video can read as a death rewarded.
- **A death of sickness is never named in the video** (DISEASE.md §4: "never on the projector as a name"), because the Host may
  play any family's video to the class: wherever the story would say the name, it says who they were ("a child of the family,
  three years old"), and the title card leaves the name off. Found by its own test: the arrival listed every child.

## 3. The trip home (`sim/homecoming.mjs`)

A class ends at dawn on April 25, four days after San Jacinto; in a fifteen-family class played to the end, fourteen families were
still on the road. The game already has every rule of the road home - `turnHome` sets a family out from its refuge by `findWay`,
`advanceFlight` brings it in and shows it what is left (the house standing or burned, what it left in it, the cache dug up, the milk
cow home, what is found of the stock on the range) - and the class simply stops first. So the flashback runs **those same rules on
a copy of the ended class** (`structuredClone`), four hours a step for up to sixty days, until every family that can get home is
home. The saved class is never touched, and the same save always gives the same homecoming (tested).

What it adds is only what the class never had to decide:
- a family still going **east** when the class ended turns for home where it stands (`FIC-GONZ-760`: the victory reached every
  family; the game turned only those already at a refuge);
- somebody of the family apart from it and free - a man let go from the army - walks home on his own;
- `ceiling:` **the road home rolls no sickness.** A death on a road the class never played would be one the reckoning never
  counted and the student never saw coming. The road's own sickness is the way out, if the owner wants it (§10 (c)).

Everybody still serving, and every prisoner, stays where the class left them, and the closing card says so.

## 4. The video, and why it is made in the Host's browser

**The choice: the Host's own page draws the flashback on a canvas with the game's own drawing code and art, gives each frame to the
browser's VP8 encoder (WebCodecs `VideoEncoder`) at the video's own timestamp, and writes the frames into a WebM file itself
(`public/webm-writer.js`); the file is sent to the server, which keeps it.** Why:

- **The art is the page's.** The map's ground (relief, land classes, water, scatter, fields), the houses, the figures with their
  chosen looks, the armies and the one battle renderer all live in `public/`. Drawing there needs no second renderer; the page
  lends the flashback its own functions through `bindFlashback` (a camera of its own, the ground, `miniPerson`, `homesteadHouse`,
  `animated`) and a clock the figures' cycles are timed by.
- **It is reliable on a teacher's Windows PC.** The Host page is already open on it (the launcher's own window, WebView2, which is
  Chromium, or Chrome/Edge). Server-side rendering would need a headless browser the installed game does not ship (Playwright and a
  Chrome build are not in the package, and downloading one on a school PC is the wrong kind of surprise), or ffmpeg, likewise.
- **Faster than real time.** Frames carry their own timestamps, so a minute of video takes as long as drawing and encoding its
  1,200 frames, not a minute of the wall clock, and the file's length is exact. MediaRecorder on `canvas.captureStream()` records
  at wall-clock speed; it is kept only as the fallback for a browser without WebCodecs (the Host page opened on a LAN address,
  which is not a secure context - `http://localhost` and `127.0.0.1`, as the launcher opens it, are).
- **No library.** The WebM writer is ~120 lines of the published Matroska/WebM element table (EBML header, Segment with SeekHead,
  Info with Duration, one VP8 track, a Cluster per keyframe, Cues), and `server/webm.mjs` reads the same structure back, including
  a live recorder's unknown sizes.

**The file:** 854 × 480, 20 frames a second, VP8 at about 600 kbit/s, a keyframe every 2 s (so Replay and seeking start clean) -
**about 4.4-4.6 MB a minute**. ChromeOS plays WebM/VP8 natively.

**On the page:** the ground of each beat is drawn once, a little larger than the frame, and the camera pushes in slowly across it
while the figures move; a battle is its seven projections played one after another through the battle renderer (smoke, volleys,
the lines said); the date is top left, the caption in a band at the foot, the "meanwhile" in its own box top right; each beat fades
up from black. Before the first frame the recorder draws every beat at three moments and waits until every art sheet and every
picture of the land has arrived (`sheetsInFlight`, `landSettled`), so no frame is drawn with the ground missing.

## 5. Kept on the Host's computer (`server/flashback.mjs`)

`POST /api/flashback/video?household=hh-N` (body `video/webm`) from the Host's page - and on Play Solo from the player's own page,
the player's computer being the Host's. Refused: before the class has ended for good (409), not WebM with a video track (415), not
about a minute (20-120 s, 422), over 40 MB (413), a family the class does not have (404), a student's page in a class (403). Kept
at **`<data folder>/flashbacks/<class session>/hh-N.webm`**, with `hh-N.json` beside it (bytes, duration, frames, how long it took);
written whole and renamed into place. A new class, or another class opened, has its own folder; nothing is deleted.

`GET /api/flashback/video` serves it (with ranges, for seeking), to the Host any family's and to a student their own only.
`GET /api/flashback/script` gives the script to the page that makes the video, and `?part=transcript` the words alone. Each
snapshot carries `flashback`: for the Host every family's (made or not, played or not), for a student their own. The scripts are
made once per revision of the class (`scriptCache`); the world and the save never hold a video, so **no `saveVersion` moves**.

## 6. Playback

- **A student's page**, in the ending panel: *"Our story, looking back"* - the video plays by itself (muted, so the browser allows
  it; captions are in the picture), with **Replay**, and **the story in words** below it (every caption and "meanwhile", for
  accessibility and for reading). Until it is made: *"Your family's flashback is being made on the teacher's computer."*
- **The Host's page**: every family, made or waiting, with its length and size and a **Play** button; **Play the whole class in
  turn** (the families students played first) goes on to the next when one ends. The Host's page makes the videos by itself as soon
  as the class has ended - students' families first - with its progress in words.

## 7. Measured (this computer, 2026-09-28)

See `docs/evidence/flashback-browser.json`. **Measure again on a quiet machine**: every number here was taken while other builders'
test suites and an 18-worker balance study held all 24 logical processors at 100%.

- Five families: all five made and saved, each 60.0 s, 4.38-4.56 MB; the student's page played its own at once.
- Where a video's time goes: drawing all 1,200 frames is 1.5-12 s (a chase or a battle costs the most); the rest is the VP8
  encoder. With the machine idle the first run made five videos in 51 s (about 10 s each).
- 15 and 30 families: §7.1, filled by `npm run test:flashback -- --measure 15,30`.

## 8. The ending's words (S24, S25, S27; `sim/ending-story.mjs`)

- **S25:** the spring said as it was - stayed or went, the farm burned (by whose hand, on what day) or standing, home to the ashes,
  home to the house standing, or still on the road home. "Came home to a burned farm" is no longer said of a farm that stands.
- **S27:** somebody taken prisoner in the war is named in the family's story - where, when, and what the record says of the men
  taken with them (`HIST-TEX-059`: marched to Matamoros) - and still not weighed with the Scrape's prisoners.
- **S24:** the Host's debrief begins with this class's own hooks - the widest gap between two played families in hearing the same
  news, a family that fled beside one that stayed, a family that sent somebody beside one that sent nobody - named, asking why; and
  each family's ending asks it two questions about its own story.

## 9. Evidence

- `tests/flashback.test.mjs` (8): beats for every family, a minute exactly, in order; no virtue, gore or glory; a death in battle in
  one plain sentence and no reward beside it; a death of sickness never named; every "meanwhile" true, truly dated and not yet known;
  nothing before the end; the trip home deterministic, the class untouched, home to the house as it truly stands.
- `tests/flashback-video.test.mjs` (5): the WebM written is the WebM read; a live recorder's file; not-a-video refused; the routes
  before the end; kept in the class's folder, served to the Host and that family alone, ranges, a new class keeps the old videos.
- `tests/ending-story.test.mjs` (3): S25, S27, S24.
- `scripts/flashback-injections.mjs`: **16 of 16** injected regressions caught by their own test
  (`docs/evidence/flashback-injections.json`).
- `npm run test:flashback`: a class played headless to its end, the Host's page makes every video, the files are on disk with
  sane lengths and sizes, the student's page plays its own with Replay and the words below, the Host plays one and all in turn;
  frames in `docs/evidence/flashback-frame-*.png`.

## 10. Open decisions for the owner

(a) **The Host plays a family's video to the class.** A death of sickness is never named in it; a death in battle is, as the
ending always named who went. (A) keep; (B) the Host's *Play the whole class* skips families with a death; (C) name nobody who died.

(b) **When the videos are made.** (A) at once when the class ends, on the Host's page (built); (B) only when the teacher presses
Make the flashbacks; (C) overnight, a teacher leaving the Host page open.

(c) **The road home in the flashback.** (A) no sickness on it (built); (B) the road's own sickness, deaths included; (C) end the class
itself on the homecoming (the audit's B6 direction), so the trip is played rather than shown.

(d) **Length.** (A) one minute for every family (built); (B) longer for a family with more to tell, up to two minutes.

(e) **What the Matamoros prisoners' families are told.** The record found says they were marched to Matamoros (`HIST-TEX-059`) and
nothing of their release. (A) leave it there (built); (B) research and add what became of them.
