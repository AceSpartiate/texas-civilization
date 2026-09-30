# Read aloud

**Owner-decided 2026-09-30 (triage D15), built on branch `read-aloud`, not released.** Help for readers below grade: a button on
the words a student is reading that plays them in a natural voice, made on the teacher's laptop and streamed to the Chromebooks.

Owner, 2026-09-29, verbatim: *"i want to do read aloud as the option. but i don't want to use the stock voice. it's awful and the
players will hate it. i want to find free voices that we can legally download and use. i want to use the voices (that can't
sound robotic. it'll ruin it) to do the read alouds. it'll be done and processed on the host computer, and streamed to the player
devices so they don't have to download anything (unless that'd work better?)."*

## 1. What the owner decided (2026-09-30)

- **Engine: Kokoro-82M v1.0, the full-precision build** (research §R1: the most natural of everything tried).
- **Narrators: "Man and woman".** A line a male character speaks is read in a man's voice, a female character's in a woman's;
  narration (tips, the record, news without a speaker) in one narrator's voice, recommended here (§2). A small set of voices is
  allowed if each stays natural and the same for a character; kept simple.
- **The research's hybrid architecture** (§R6): fixed text spoken at package time and shipped; sentences with names or numbers
  spoken on the Host as the server writes them, in a separate process, cached by content, the tick never waiting; the
  Chromebooks play Opus, never the stock voice; a game-owned pronunciation table; Kokoro and its voices recorded with their
  licences, espeak-ng's GPL handled.
- **"Unless that'd work better?"** It would not (§R6c): every Chromebook would download 330 MB of model over classroom Wi-Fi and
  run it on the slowest CPU in the room.

## 2. The voices

Four roles; a page asks for a role and the server decides the Kokoro voice (`server/voice/text.mjs` `VOICES`), so the cast can
change in one line and a build. **Chosen by one rule** from the two proxies there are, since nobody has listened: the voice's
author graded it C+ or better by ear, **and** UTMOS22 predicts 4.3 or better on the game's own lines; American, as most settlers
of 1835 were. Every plausible English voice was scored on four of the game's lines (the research's news and army lines, a
rider's line and a mother's): [`evidence/read-aloud/cast.json`](evidence/read-aloud/cast.json), script
[`cast.py`](evidence/read-aloud/scripts/cast.py).

| Role | Voice | Author's grade | UTMOS (mean of 4 lines) | Reads |
|---|---|---|---|---|
| narrator | **`af_heart`**, American woman | A (the only one) | **4.46** (the highest of all) | tips, calls, story cards, the journal, news nobody in particular says |
| woman | **`af_kore`**, American woman | C+ | 4.45 | a line a woman or a girl says (a daughter asking the rider) |
| man | **`am_puck`**, American man | C+ | 4.34 | a line a man or a boy says |
| rider | **`am_fenrir`**, American man | C+ | 4.37 | a rider or a runner at the family's side (the research's man) |

- **Why a woman narrator.** `af_heart` is the best voice by both measures, and most of the game's speaking characters are men
  (riders, soldiers, officers), so a woman's narrating voice is rarely mistaken for a character's.
- **Why a second woman.** A mother's or a daughter's words in the narrator's own voice would read as narration. `af_kore` is the
  next best woman on both proxies. `af_bella` is graded A- by the author but scored 3.98, the proxies disagreeing; the owner's ear
  decides (§9, question 1).
- **Why two men.** A conversation is a rider and one of the family; a man of the family and the rider in one voice would be one
  person talking to himself. `am_fenrir` is deeper; `am_puck` lighter. `am_eric` (UTMOS 4.35, the clearest to the recogniser) is
  graded D by the author and so fails the rule; `am_michael` (C+) scored 3.98.
- **Consistent per character**: a person's voice follows from who they are (`voiceOfPerson`: a woman or a girl, else a man), the
  same on the page and the server. Every rider and runner is the rider's voice. A boy is read in the man's voice: Kokoro has no
  child's voice.
- **Samples** (Opus): [`evidence/read-aloud/cast/`](evidence/read-aloud/cast/) - `af_heart`, `af_kore`, `af_bella`, `am_puck`,
  `am_fenrir` and `am_eric` each reading the rider's line and the mother's line. The research's own samples are still in
  [`evidence/read-aloud/`](evidence/read-aloud/).
- **Disclosed**: the button's label says "a computer voice", as the research advised (§R5.5).

## 3. Saying the names: the pronunciation table

`server/voice/pronunciation.mjs`, applied to what the voice is given and never to what is shown. espeak-ng, which turns English
words into sounds for Kokoro, reads every Spanish name as English: Seguín "SEG-win", Béxar "BAKE-sar", Jesús "JEZ-us", Inés
"in-EE-a-cutes" (the accent spelled out). The table respells them in English letters, each checked by printing the phonemes
espeak-ng gives the respelling, not by ear: [`evidence/read-aloud/pronunciation.json`](evidence/read-aloud/pronunciation.json)
(script [`pronounce_probe.py`](evidence/read-aloud/scripts/pronounce_probe.py), fed by `scripts/voice-table.mjs`).

- **The rule it follows** (the owner or HISTORY.md may overrule any row):
  - a **person's name in the language of the person**: every Tejano and Mexican person in `sim/people.mjs`, the Tejano name pools,
    the town keepers - Seh-gheen, Sahntah Ahnah, Kahss-tahn-yeh-dah, Heh-soos, Ee-ness;
  - a **place the way Texas says it**: Béxar is BAY-har (the Spanish and the old Texan way); Gonzales, Guadalupe, San Jacinto,
    Goliad and Nacogdoches are already said the Texan way and are listed as read right; Refugio is the town's own reh-FURY-oh
    (the research left it to HISTORY.md: §9, question 2); Anahuac, Coleto, Laredo, Lavaca, Nueces, Medina and others respelled;
  - a **historical English name as its bearer said it**: Bowie BOO-ee, "Deaf" Smith DEEF, Milam MY-lum, Mirabeau MEER-uh-bo;
    and the period abbreviations espeak-ng reads as "dot" (Col., Capt., Dr., Jr.) spelled out.
- **Complete by test** (`tests/read-aloud-text.test.mjs`): every person in `sim/people.mjs` (name and full name), every name the
  Tejano pools and the old mixed pools deal, is either respelled or listed in `AS_WRITTEN` as checked and read right; and **no
  accented name anywhere the game deals one** (keepers, residents, carpenters, every pool) reaches the voice unrespelled.
- **Plain ASCII to the voice.** The voice's program reads its command line in the Windows code page, where a curly quote, a dash
  or an é arrives broken ("Non UTF8 encoded string", found in the first build). So the words it is given are respelled, then
  made plain: quotes straight, a dash a pause, accents dropped - which is why every accented name must be respelled first.
- `ceiling:` a name a student types when renaming somebody goes to espeak-ng's own guess; the game cannot know it in advance.
- Spanish **sentences** (a soldier's "¡Alto!" in a speech bubble) are read in the English voice; Kokoro's Spanish voices scored
  3.4-3.7 (§R1). "¡Alto!" itself is respelled.

## 4. Fixed text, spoken at package time

`npm run build:voice` (`scripts/build-voice.mjs`), run by `scripts/package.ps1` on the developer's machine.

- **What is fixed is read out of the game's source** (`server/voice/inventory.mjs`), not listed by hand: every string in `sim/`,
  and in the page's tips, story cards, ending, family panel, errand and going modules, split into sentences; a template's
  `${...}` is a hole, and a sentence with a hole in it holds a name or a number and is left for the Host. So a tip added tomorrow
  is spoken at the next package. Claim IDs, code and short fragments are left out.
- **Sentences, never splices.** A template's fixed sentences are the same in every family's copy and come from the package; only
  the sentence with the name in it is spoken on the Host. Nothing is cut inside a sentence. The split is one function for the
  build and the Host (`splitSentences`), tested to give the same sentences for a template and for the line it makes.
- **The riders' own words** (sim/encounters.mjs `CONVERSATIONS`) are read out with every name a hole and spoken in the rider's
  voice; what a family's person can ask him is spoken in both the man's and the woman's voice.
- **Kept by content**: each sentence is `public/voice/<key>.opus`, the key a SHA-256 of the model, the voice and the words as
  spoken, so a changed tip is spoken again and nothing else. A cache shared by every checkout on the machine
  (`%LOCALAPPDATA%\TexasRevolution\voice-build`) means a second worktree or the next release speaks only what changed.
- **Opus** at 24 kbit/s mono, 24 kHz, by Xiph's `opusenc`.
- **Made, not kept in git**, like the WebP art (`.gitignore`); `scripts/package.ps1` builds it and refuses a package with any
  fixed sentence unspoken (`--check`).

**Size and time, measured 2026-09-30:**

- **3,224 fixed sentences** (3,170 narrator, 36 rider, 9 man, 9 woman), 181,600 characters: about **3.2 hours** of speech.
- **33.4 MB** of Opus in `public/voice/` (and a 0.5 MB manifest; about 10.9 KB a sentence, 3 KB a second of speech), inside the research's estimate
  of 25-35 MB a voice. It adds that to the installed game; Opus does not compress further in the zip.
- **68 minutes** to speak all of it from nothing, six sentences at once, on the owner's desktop while other builders' suites
  held it at 40-100% load. After that only what changed: a later build found 3,206 of 3,224 already made and spoke 18.
- **The voice itself** (`runtime/voice/`, for the Host's sentences): **396 MB** unpacked - Kokoro's model 310.5 MB, its 54 voices
  26.9 MB, espeak-ng's English data 0.9 MB (every other language left out: 17 MB → 0.9 MB), the programs 20.3 MB, and the
  licences with the GPL source archives 37.7 MB.
- **The package, measured** (`scripts/package.ps1 -SkipLauncher` to a scratch folder, not published, 2026-09-30): the update zip
  is **542.8 MB** (the last release's was 153 MB) and the NeedsNode zip **509.6 MB** (120 MB). Inside the update zip:
  `runtime/voice` **357.3 MB** compressed (the full-precision model barely compresses), `public/voice` **31.5 MB**, Node 33.0 MB,
  the rest of the game 120.3 MB. So read-aloud adds **about 390 MB to every download**, 89% of it the model the owner chose;
  the setup program (not built here: `-SkipLauncher`) grows the same. That is the price of full precision on the Host: the
  fixed text alone is 31.5 MB (§9, question 4).

## 5. The Host's voice

`server/voice/service.mjs`, created by `server/main.mjs` and handed to the classroom.

- **Kokoro through k2-fsa's standalone Windows program**, `sherpa-onnx-offline-tts.exe` 1.13.8 with ONNX Runtime: no Python, no
  npm package, `package.json` still has no dependencies. Then `opusenc.exe` to Opus. Both in `runtime/voice/`, fetched like
  `runtime/node.exe` (`scripts/bundle-voice.mjs`: every download checked against a pinned SHA-256; `--check` verifies the folder
  against its record; `docs/evidence/voice-runtime-manifest.json` is the tracked record).
- **A separate process for every sentence**, one at a time, on two threads (one on a machine with four cores or fewer). The
  server never waits on it: it answers every request at once and hears the program finish through an event.
- **Begun when the server writes the line** (`voiceNotice` in `server/app.mjs`, after every commit): what a rider or a runner
  and a family's person say to each other, as it is said, and each played family's newest line in its record (importance 2 or
  more). Only families a student is playing; only sentences the package does not hold.
- **The line pressed first.** Two queues: lines a student pressed (oldest press first), then lines the server began (`soon`,
  capped at 90, oldest dropped first). A pressed sentence already waiting in `soon` moves up.
- **Cached by content** in the class data folder (`voice-cache/`), 256 MB at most, least recently used pruned first, so the same
  news said to twenty families is spoken once, and a class opened tomorrow still has it.
- **Only the game's words.** The server speaks a sentence only if every word is a word the game's source writes (the package's
  vocabulary) or a name in the class (its people, families and places), so a page cannot make the teacher's laptop say anything
  else. Refused sentences say "Can't read this" on the button.
- **Presentation only**: nothing here reads or writes the class but to find the lines; a voice that fails is logged and never
  stops a commit. A class with no voice installed says so (`GET /api/voice`), and its buttons stay hidden.
- **The routes**: `GET /api/voice` (can this class read aloud), `POST /api/voice` (a page's lines, each sentence ready, being
  made, or refused), `GET /voice/<key>.opus` (a sentence, `Cache-Control: immutable`: its key names bytes that never change).
  All three only for a joined page or the Host.
- **Below-normal priority was measured and dropped.** On this machine (a hybrid Intel CPU, Windows 11) a below-normal voice took
  11.2 s for a sentence that takes 2.1 s at normal priority, and three at once made almost no progress in seven minutes: Windows
  runs it as background work on the efficiency cores. What keeps the tick safe is the separate process, few threads and one
  sentence at a time (§6). `lowPriority` in `kokoroSynthesiser` puts it back for a machine where it is measured to help.
- `ceiling:` the model is loaded afresh for every sentence (about a second here). A program that stays loaded and reads
  sentences one after another is the way out if the queue is measured to matter in class.

## 6. Host CPU: thirty families at once

`npm run measure:voice-burst` (`scripts/voice-burst.mjs`): thirty families each given the line the game writes when their
volunteer reaches Gonzales, with their own person's name in it - thirty sentences no package can hold - queued together as the
server writes them; three seconds later one student presses the 25th. Meanwhile a class of thirty families on the real land is
stepped once a second in the same process, as the server's tick is, and timed.

Measured 2026-09-30 on the owner's desktop (Intel i9-12900KF, 24 logical cores), which other builders' test suites were also
using (CPU 39-55% before and during). Records:
[`voice-burst-2t.json`](evidence/read-aloud/voice-burst-2t.json), [`voice-burst-1t.json`](evidence/read-aloud/voice-burst-1t.json).

| | Two threads (the Host's default) | One thread (four cores or fewer) |
|---|---|---|
| One sentence (about 8 s of speech), load, speak and encode | 3.9 s mean (3.7 median, 5.3 max) | 5.3 s mean (6.0 max) |
| First of the thirty ready | 4.1 s | 5.6 s |
| Half ready | 62 s | 86 s |
| **All thirty ready** | **118 s** | **159 s** |
| **The 25th, pressed by a student 3 s in** | **ready 5.2 s after the press** (spoken 2nd) | **8.5 s** (spoken 2nd) |
| The class's own tick (30 families, real land), median / 95th percentile, before → during → after | 87 / 172 → 93 / 153 → 86 / 104 ms | 82 / 151 → 82 / 109 → 82 / 95 ms |
| The server's event-loop delay, 99th percentile, before → during → after | 92 → 102 → 96 ms | 89 → 90 → 89 ms |
| Opus a sentence | 22.5 KB | 22.5 KB |

- **The tick did not wait.** Its time is the same before, during and after, within the noise of a shared machine. The one
  exception in the record - an event-loop maximum of 1.4-1.5 s during the burst - is the measuring script's own synchronous
  sampling of the CPU load (a PowerShell call, three times), not the voice; the 99th percentile shows nothing.
- **The pressed line goes first.** With 26 sentences queued ahead of it, a student's press on the 25th had it spoken second
  (after the one already being spoken), 5-9 s after the press.
- **On a school laptop, estimated, not measured.** A school laptop's core is 1.5-3 times slower than this desktop's (research
  §R6), and one with four cores or fewer is given one thread. So a sentence takes about **8-16 s**, the thirty take about
  **4-8 minutes** to all be ready, and **a student who presses a line not yet made waits about 10-30 s** ("Getting ready…"):
  one sentence being spoken, then theirs. Fixed text (tips, calls, story cards, questions) is never waited for. `ceiling:` if
  that wait matters in class, a program that keeps the model loaded between sentences saves about a second each, and a
  second process on a machine with cores to spare halves the queue; both are measured here first.
- **Must be measured on the real teacher laptop before it is promised** (`npm run measure:voice-burst`).

## 7. On the Chromebook

`public/read-aloud.js`, made once by `public/app.js` (above its first `connect`, for the TDZ rule) and never on the Host's page.

- **Where the button is**: the tip over the map and the store's tip; each tip in the Tips list; the call's menu; the messages
  card (its title and its words); each line of a rider's or a runner's conversation, in the speaker's voice; the questions on a
  person's card (the army's, the road's, the sick); the journal's newest line. **Not the end-of-game breakdown**: it is being
  changed by another builder (`public/ending.js`), and it is numbers and names more than reading (§9, question 3).
- **States**: *Read aloud*; *Getting ready…* while the Host speaks a sentence the package lacks (the page asks again every 0.7 s,
  and plays each sentence as soon as it is ready, in order); *Stop* while it plays; *Sound is off*; *Can't read this*. A line in
  a list shows the speaker alone until it is busy, so the line reads as before.
- **Never the stock voice**: `speechSynthesis` is never touched; the proof watches it.
- **One line at a time**: one `<audio>` for the page; another button stops the one playing, and the same button again stops it.
- **Volume follows the Sound setting**: silent when sound is off (the button says so and nothing is fetched); otherwise the square
  root of the master volume, so a student's quiet 30% reads at a speaking level (0.55) and 100% is full.
- **Keyboard and touch**: a real `<button>`, reached with Tab, pressed with Enter or Space (which never reach the card behind);
  36-40 px tall; a tip's words still let a click through to the map.
- **The network**: about 3 KB a second of speech; a 5-second line is 15-20 KB, against the class's 112 KB a tick.

## 8. Tests, proofs and evidence

- **New tests, each failed under an injection first: 22 of 22** (`npm run test:read-aloud-injections`,
  [`evidence/read-aloud-injections.json`](evidence/read-aloud-injections.json)):
  - `tests/read-aloud-text.test.mjs` (9): the pronunciation table complete for every famous person and every name the pools deal,
    no accented name unrespelled, respelling as whole words, plain ASCII to the voice, sentence splitting (abbreviations,
    initials, quotes), a template's fixed sentences the same as the line it makes, one key per voice and saying, the same voices
    and the same `voiceOfPerson` on page and server, the volume following Sound;
  - `tests/read-aloud-service.test.mjs` (8, a fake synthesiser): the pressed line first, a waiting line moved up by a press, only
    the game's words and the class's names, the package's sentences never spoken again, a page's asking limited, the server's
    own queue capped and the cache pruned, a request answered at once, a sentence served as immutable Ogg Opus and nothing else;
  - `tests/read-aloud-server.test.mjs` (3, the classroom): only a joined page may ask, a class with no voice says so, a line made
    and served by its key, a rider's and the family's words begun as the server writes them in the speaker's voice;
  - `tests/audio-licenses.test.mjs` (+2): the voices are the manifest's and the model Apache-2.0; every program of the voice
    recorded with its licence file; the GPL one a separate process with its source shipped, no addon, no npm dependency.
- **Browser proof** `npm run test:read-aloud` (`scripts/read-aloud-browser-proof.mjs`, real Kokoro, headless Chrome, a Play Solo
  game on the real land, seed q6): 6 checks - [`evidence/read-aloud-browser-proof.json`](evidence/read-aloud-browser-proof.json),
  screenshots `evidence/read-aloud-tip.png`, `evidence/read-aloud-rider.png`.
  1. a tip (the sick's, three sentences) from the keyboard: every sentence the package's, fetched as Ogg Opus and played to its
     end; nothing spoken on the Host; "Got it" and the click-through untouched;
  2. the rider's opening in `am_fenrir`: four sentences, two made on the Host on the press (3.6 s and 4.6 s) while the button said
     "Getting ready…", then "Stop"; each fetched and played to its end;
  3. the daughter's question ("How many of them are there?") in `af_kore`, from the package;
  4. one line at a time; 5. Sound off: "Sound is off", nothing fetched; 6. `speechSynthesis` never spoken to.
- **Measurements**: `scripts/voice-burst.mjs` (§6), `docs/evidence/read-aloud/cast.json` (§2),
  `docs/evidence/read-aloud/pronunciation.json` (§3), `docs/evidence/voice-runtime-manifest.json` (§5).

## 9. Limits, and questions for the owner

- **Nobody has listened.** The cast was chosen by the author's grades and a predicted MOS; the pronunciation by printed
  phonemes. The samples in `evidence/read-aloud/cast/` are for the owner's ear.
- **Same computer only.** No Chromebook, no school laptop, no classroom Wi-Fi was used. The school-laptop queue in §6 is an
  estimate.
- **The model loads per sentence** (§5); **a boy reads in a man's voice**; **Spanish sentences in an English voice** (§3).
- **Size**: the full-precision model is most of what the package grows by (§4).

Questions (recommended first):

1. **The woman's voice**: keep `af_kore` (both proxies good), or `af_bella` (the author's A-, the proxies disagree)? Listen to
   `cast/af_kore-mother.opus` and `cast/af_bella-mother.opus`.
2. **Place names**: keep the Texan way (Refugio reh-FURY-oh, Gonzales gun-ZAH-les, San Jacinto juh-SIN-toh), or Spanish
   throughout (reh-FOO-hyo, gohn-SAH-les, hah-SEEN-toh)?
3. **The end-of-game breakdown**: add read-aloud to it once `public/ending.js` settles, or leave it to the teacher's debrief?
4. **The package's size** (§4): keep full precision as decided, or measure Kokoro's official fp16 build (about half the size)
   by ear against it?

## Research: how the voice was chosen (2026-09-30)

Kept as it was written, before the owner chose; its sections are numbered R1-R9 here.

Research only, 2026-09-30. **Nothing is built and nothing is integrated.** The owner picks a voice from the samples
below before any of it is built. `package.json` is unchanged.

Owner, 2026-09-29, verbatim: *"i want to do read aloud as the option. but i don't want to use the stock voice. it's awful
and the players will hate it. i want to find free voices that we can legally download and use. i want to use the voices
(that can't sound robotic. it'll ruin it) to do the read alouds. it'll be done and processed on the host computer, and
streamed to the player devices so they don't have to download anything (unless that'd work better?)."*

This answers triage item D15, help for readers below grade (`docs/audits/2026-09-29-triage.md`). There, option B was
"a local read-aloud button".

### R1. The shortlist

Every sample below reads the same three lines: the rider's news (*"A rider has come in from Gonzales. The Mexican
soldiers came for the cannon, and the settlers told them to come and take it."*), the army question (*"The volunteers
are gathering on the Guadalupe. Will you send someone to join them, or keep everyone home to bring in the corn?"*) and
the names line (*"Juan Seguín's company rode out from Béxar."*). Voices that speak Spanish also read *"La compañía de
Juan Seguín salió de Béxar al amanecer."*

| # | Engine and voice | Licence (model / voice data) | Quality: honest read | CPU speed, one thread | Size to run it | Spanish |
|---|---|---|---|---|---|---|
| **1** | **Kokoro-82M v1.0**, full precision. `af_heart` (American woman), `am_fenrir` (American man), `bf_emma` (English woman) | Apache-2.0 weights. The data is described as "permissive/non-copyrighted" plus synthetic audio from commercial TTS (§R5). | **The most natural of everything tried.** Top predicted naturalness (UTMOS 4.45 for `af_heart`). The author grades `af_heart` A, `bf_emma` B-, `am_fenrir` C+. Secondary sites report it as the highest-ranked open-weight model in public listening arenas; this was not verified here. | RTF 0.70 (a 6 s line takes 4.4 s). 1.3 s to load. | 310 MB model, 0.5 MB per voice, 17 MB espeak-ng data (can be trimmed to English and Spanish), 20 MB runtime | `ef_dora` and `em_alex` exist but are weak: UTMOS 3.4-3.7, and the author gives them no grade |
| **2** | **Supertonic 3** (int8, 10 preset voices). `sid0` (female by pitch), `sid5` (male by pitch) | **OpenRAIL-M** weights (use restrictions, §R5). MIT code. | **Close to Kokoro by the numbers** (UTMOS 4.39-4.48 on all four voices tried), and it handles the names best of any engine. Newer, with less public listening evidence. | RTF 0.36, the fastest of the natural-sounding engines | 138 MB model, 20 MB runtime, **no espeak-ng** | **Native**, 31 languages. The Spanish line scored UTMOS 4.28. |
| **3** | **Piper**, Bryce Beattie's voices: `kristin` (woman) and `john` (man), medium quality | MIT model code. **The voices are public domain**, trained only on LibriVox, and the author says "use for any legal and ethical purpose". | Clean and quick. UTMOS 4.34 and 4.19, but it is VITS: I expect flatter phrasing than Kokoro, **the "robotic" risk the owner named**. This is the licence-safest fallback, not the first pick. | RTF 0.08: instant on any laptop | 61 MB per voice, 17 MB espeak-ng, 20 MB runtime | None of good quality. The only public-domain Spanish Piper voice (`carlfm`) is `x_low` quality. |

"RTF" is the real-time factor: seconds of computing per second of speech, so below 1 is faster than real time. It was
measured on this machine, which a school laptop is slower than (§R6).

**Recommendation, subject to the owner's ear:** Kokoro `af_heart` or `am_fenrir` as the narrator. Supertonic 3 is the
alternative if the owner prefers its sound, wants real Spanish lines, or wants runtime generation to be cheap, **and**
accepts OpenRAIL-M's conditions. Piper `kristin` is the fallback if both are refused on licence.

#### Listen

Committed (Opus, about 32 kbit/s, 26 files, 0.55 MB), all in [`docs/evidence/read-aloud/`](evidence/read-aloud/):

- Kokoro: `kokoro-af_heart-{news,army,names}.opus`, `kokoro-am_fenrir-{news,army,names}.opus`,
  `kokoro-bf_emma-{news,army,names}.opus`, and the Spanish line in Kokoro's Spanish voice, `kokoro-ef_dora-es.opus`.
- Kokoro with the names respelled for it (§R4): `kokoro-af_heart-names-respelled.opus`, `kokoro-am_fenrir-names-respelled.opus`.
- Supertonic 3: `supertonic3-sid0-{news,army,names,es}.opus`, `supertonic3-sid5-{news,army,names,es}.opus`.
- Piper: `piper-kristin-{news,army,names}.opus`, `piper-john-{news,army,names}.opus`.

Every engine and voice tried, including the ones not shortlisted, is in this session's scratchpad as WAV and Opus. That
folder is temporary and is not in the repository:
`C:\Users\zachw\AppData\Local\Temp\claude\C--Users-zachw-Texas-Civilization\2f375bfe-91ab-4fc8-aa68-1531e617149c\scratchpad\read-aloud\samples\<engine>\<voice>-<line>.wav`.
The name variants are in `...\read-aloud\samples-names\`.

The measurements are in [`evidence/read-aloud/measurements.json`](evidence/read-aloud/measurements.json).

### R2. How the voices were judged, and what that cannot tell you

**Nobody listened.** The samples were judged by two machine proxies, and neither is an ear:

- **Did it say the words?** NVIDIA's Parakeet TDT 0.6B v2 speech recogniser transcribed every English clip, and its
  word error rate was measured against the text.
  - Every shortlisted voice was understood almost perfectly on the two plain lines (0-11%).
  - Most of the errors are the recogniser's, not the voice's: "rider" is heard as "writer", and "someone" as "some one".
- **Does it sound like clean, natural speech?** UTMOS22 predicts the mean opinion score a panel would give (1-5).
  - It was calibrated here against real people. Studio recordings (Kyutai's `alba-mackenna` clips) scored **3.9**. Home
    recordings of donated voices scored **2.4-3.5**.
  - So a synthetic voice at 4.4 is not "better than a person". **UTMOS rewards clean, steady audio and cannot hear
    whether a line is read with sense.** It separates good from bad (Kokoro int8 fell 0.4-0.8 below full precision). It
    cannot choose between the top three. That choice is the owner's to make by ear.

The CPU timings were taken while other builders' test suites held the machine at 30-100% load, and each run's load is
recorded. The one-thread figures are best of three and are the ones to trust. The two-thread runs were noisier: Piper
measured 0.05 at 50% load and 0.21 at 100%.

### R3. Considered and not shortlisted

| Engine | Licence | What was found | Verdict |
|---|---|---|---|
| Kokoro **int8** (sherpa-onnx's quantised build) | Apache-2.0 | UTMOS 0.4-0.8 below full precision, and **slower** on this CPU (RTF 1.08 against 0.70), because dynamic int8 kernels are slow here. It is smaller (109 MB). | **Refused.** A smaller model has to be listened to first (§R7). |
| **Kitten TTS** mini 0.8 | Apache-2.0 | UTMOS 4.2-4.4 and 80 MB, but the **training data is not disclosed anywhere**. RTF 0.68. English only. | **Refused on provenance.** AUDIO_LICENSES.md refuses "unclear" sources. |
| **MeloTTS** English | MIT | Only the Australian voice scored well (4.46). The American voice scored 3.65, and the names came out spelt ("BXUR"), because the sherpa build uses a fixed lexicon. Data provenance is undisclosed. | **Refused.** |
| **Pocket TTS** (Kyutai, 100M, int8 ONNX) | CC-BY 4.0 weights. The voices are CC0 (`voice-donations`), CC-BY (`alba-mackenna`, `vctk`) or **CC-BY-NC** (`expresso`, `ears`). | Unstable in this build. Each run samples its speech afresh, so the same text comes out differently every time. The first run dropped the second sentence of one clip. The second run made a names clip the recogniser heard nothing in, and read "Will you send" as "Please send". UTMOS 2.6-4.4. It clones any reference voice, which is interesting later (§R8). Its repository is gated behind a use policy. sherpa-onnx's README calls the ONNX export "non-commercial", but the export's own LICENSE file is CC-BY 4.0. | **Held.** Worth a second look in its official PyTorch form if the owner ever wants a custom narrator voice. |
| **Piper** `lessac` and every voice fine-tuned from it (`amy`, `joe`, `mike`, `sam`, `kusal`, Spanish `davefx`, `sharvard`, `ald`) | Lessac data is a **research licence** (Blizzard 2013) | A fine-tuned voice inherits weights trained on research-only recordings. | **Refused.** |
| Piper `ryan`, `hfc_male`, `hfc_female`, `l2arctic` | CC-BY-NC(-SA) data | Non-commercial. | **Refused.** |
| Piper `ljspeech` (high) | Public domain | Clean licence. UTMOS 4.14. Slower than the medium voices (RTF 0.53). | Acceptable, but not better than `kristin` |
| **XTTS v2** (Coqui) | CPML, **non-commercial** | Not sampled. | **Refused.** |
| **F5-TTS** | CC-BY-NC 4.0 weights (Emilia data) | Not sampled. | **Refused.** |
| **Parler-TTS** mini v1 | Apache-2.0. Data is CC-BY 4.0 (LibriTTS-R, MLS). | 0.9B parameters, and needs PyTorch at run time. Too heavy for a laptop's CPU in class. Not sampled. | **Refused on weight**, not licence |
| **StyleTTS 2** (its own checkpoints) | MIT code | The pretrained models require telling listeners the speech is synthesised. Kokoro is the productised StyleTTS-2 descendant. | **Superseded by Kokoro** |
| **Chatterbox** (Resemble) and **NeuTTS Air** | MIT / Apache-2.0 | Voice-cloning only, with no built-in voice. 0.35-0.7B parameters, GPU-first. Every output is watermarked. | **Refused on weight** |
| The browser's own `speechSynthesis` | n/a | The owner refused it outright ("it's awful"). | **Refused.** Not even as a fallback (§R6). |

### R4. Spanish names: every engine needs a pronunciation table

The names line exposed the same fault in every engine. Kokoro, Piper and Kitten turn text into sounds through
espeak-ng. That step can be printed, so it was checked directly rather than by ear. `probe.py` printed these, in
`measurements.json`:

| Written | espeak-ng (en-us) says | Should be | Respelling that works |
|---|---|---|---|
| Juan | /hwˈɑːn/ | *hwahn* | (correct as written) |
| Seguín | /sˈɛɡwɪn/, "SEG-win" | *seh-GEEN* | `Seh-gheen`, which gives /sˈeɪɡˈiːn/ |
| Béxar | /bˈeɪksɑːɹ/, "BAKE-sar" | *BAY-har* | `Bayhar`, which gives /bˈeɪhɑːɹ/ |
| Refugio | /ɹɛfjˈuːdʒɪˌoʊ/, "ref-YOO-jee-oh" | a choice for HISTORY.md: Spanish *reh-FOO-hyo*, or the town's own *reh-FYOOR-ee-oh* | to be written |
| Músquiz | /mˈʌskwɪz/ | *MOOS-kees* | to be written |

- **Supertonic reads characters, not phonemes.** Its names came out closest: the recogniser heard "Seguin" and "Bexar".
  It cannot be checked the same way, though, so the owner has to listen.
- **The fix is the same for any engine:** a small, project-owned pronunciation table of every Tejano, Mexican and
  Spanish name the game says, applied before synthesis.
  - Compare `kokoro-af_heart-names.opus` with `kokoro-af_heart-names-respelled.opus`.
  - The game's vocabulary is known at build time, so the table can be complete. The names students type when renaming
    people are the exception, and go to the engine's own guess.
- **Kokoro's stock lexicon is not a way in.** In the sherpa-onnx build, English skips the lexicon file and goes straight
  to espeak-ng. This was tried and it changed nothing, so respelling (or feeding phonemes directly, §R7) is the lever.

### R5. Licence findings that decide the build

1. **Owner's rule (AUDIO_LICENSES.md):** the game must stay sellable. Allowed: CC0, public domain, the project's own
   work, and CC-BY with attribution. Refused: NC, ND, share-alike, and anything unclear. The **generated audio** of all
   three shortlisted engines is ours to ship: no licence claims the output. What the rule has to be applied to is the
   **model and runtime shipped to run it**, and that only matters if generation happens on the teacher's laptop (§R6).
2. **espeak-ng is GPL-3.0, and sherpa-onnx builds it in.**
   - Kokoro, Piper and Kitten all need it, and `cmake/espeak-ng-for-piper.cmake` builds it statically into the
     sherpa-onnx libraries.
   - Pre-generating at package time ships none of it, which is a strong reason to do so.
   - Shipping it for runtime generation means shipping a GPL program. Selling the game is still allowed; the obligation
     is the source offer for that component. It should run as a **separate process**, not loaded into `node.exe`, so
     the game stays a separate work.
   - **Supertonic and Pocket TTS do not use espeak-ng at all.**
3. **OpenRAIL-M (Supertonic 3) is not on the owner's allowed list**, and it is the owner's decision whether to add it.
   - Commercial use and redistribution are allowed. In return the licence requires:
     - including the licence;
     - passing its use restrictions on to end users "as an enforceable provision" (in practice, a clause in the game's
       licence or terms);
     - clearly disclosing that machine-generated content is machine-generated.
   - Nothing in a history game comes near the restricted uses (medical advice, law enforcement, deepfakes). The cost is
     paperwork, not design.
4. **Kokoro's training data** is stated as public-domain and permissively licensed audio, plus "synthetic audio
   generated by closed TTS models from large providers".
   - Those providers' terms bind whoever generated that audio, not users of Kokoro. Apache-2.0 on the weights is clear.
   - The residual risk is the kind nobody can remove: that the stated provenance is inaccurate. It is recorded here,
     not dismissed.
5. **Say so on screen either way:** "read by a computer voice" in the credits and beside the read-aloud control.
   - OpenRAIL-M requires it, and Kyutai's policy asks for it.
   - It is also honest with students, some of whose lines are spoken as named historical people (Seguín, Travis). It
     costs one sentence.

### R6. Architecture: a hybrid, and what it costs

**What the text is.** A rough count of the source (`sim/**/*.mjs` and `public/tips.js`; sentence-like literals of 30+
characters) gives:

- about **1,300 fixed lines** (138,000 characters): tips, calls, army questions, the timeline's news and people's words;
- about **920 templates** that fill in names and numbers (89,000 characters).

At the pace these voices read (about 20 characters a second), the fixed text is **about 2 hours of speech**.

**(a) Fixed text: made at package time, never on the teacher's laptop.**
- A build script on the developer's machine speaks every fixed line and stores it as Ogg Opus at 24-32 kbit/s, named by
  a hash of voice, model and text, with a manifest from text to file. Only changed lines are spoken again.
- **Size:** about 25-35 MB per voice. The setup program is 247-259 MB (DEPLOYMENT.md), so one narrator voice adds about
  12%.
- **Time:** at Kokoro's one-thread RTF of 0.7, two hours of speech takes about 85 minutes, or about 20 minutes across
  four processes. It is done once per release, and incrementally after that.
- This ships **no model, no Python and no espeak-ng**: only audio files, which go into `public/assets/audio/licenses.json`
  like any other sound.

**(b) Dynamic text: made on the Host, cached, only where a line has names or numbers in it.**
- **Split templates into sentences.** Sentences with nothing variable come from the package. Only the sentence holding
  the name is spoken on the Host. Never splice inside a sentence: the phrasing breaks audibly.
- **Speak when the server writes the line, not when the student taps.** News is created on the server before a student
  reads it, so the audio is usually ready first. Cache it in the class data folder by content hash with a size cap. The
  same news to twenty families is spoken once.
- **Run it in its own process**, at below-normal priority with one or two threads, so the tick never waits on a voice.
  The sherpa-onnx Windows command-line build was run here. It is `sherpa-onnx-offline-tts.exe` plus `onnxruntime.dll`,
  **20 MB with no Python and no npm package**, and it spoke Kokoro at RTF 0.41 on two threads, 2.4 s end to end
  including loading. That shape is the same as `runtime/node.exe`, and it keeps `package.json` at zero dependencies.
- **Host load, as an estimate: not measured on a school laptop.**
  - A typical school laptop core is 1.5-3 times slower than this desktop's, so Kokoro runs at about RTF 1-2 there: a
    5-second sentence takes 5-10 s of one core.
  - A moment that gives all 30 families a line with their own names in it therefore queues **2-5 minutes** of Kokoro, or
    about half that with Supertonic. Piper would take about 20 s.
  - `ceiling:` if that backlog matters in practice, speak the dynamic sentences with a faster voice, or read the name
    sentence as text only. **It has to be measured on the real teacher laptop before it is promised.**

**(c) Chromebooks: an `<audio>` element and nothing else.**
- The page asks for `/voice/<hash>.opus`, served with an immutable cache header, and Chrome plays Ogg Opus natively.
- Nothing is installed on the Chromebook. If a line's audio is not ready yet, the button says so. **It never falls back
  to the stock voice**, which the owner refused.
- "Unless that'd work better": it would not. Synthesising on the Chromebook means every device downloads the model: 110-330 MB
  times 30 is 3-10 GB over classroom Wi-Fi. The devices have the slowest CPUs in the room, and WASM runs slower than
  native code.

**LAN load for 30 students.**
- A 6-second line is about 25 KB.
- If all 30 students press play on the same news at once, that is 750 KB, well under a second of a classroom access
  point's capacity.
- If every student listened non-stop, it would be 30 × 32 kbit/s, about **1 Mbit/s** in total.
- For comparison, the game already sends about 112 KB per tick across 30 devices (REFERENCE_ARCHITECTURES.md). Read-aloud
  is a rounding error on the network. The Host's CPU (b) is the real budget.

**Suggested order, when the owner chooses to build it:**
1. Package-time voice for fixed text only: zero new runtime dependencies and zero GPL. This alone covers the tips, the
   calls and the army questions, which are the reading the classroom audit (M7) and the triage (D15) named.
2. Then Host-side generation for the sentences with names in them.
3. The pronunciation table (§R4) is needed from step 1.

### R7. Not tried, and worth a look once a voice is chosen

- **Smaller Kokoro builds.** Official `onnx-community/Kokoro-82M-v1.0-ONNX` has fp16 and q8f16 files (about 86-170 MB).
  The int8 build tried here sounded measurably worse, so any smaller build must be listened to before it is used. It
  only matters for Host-side generation (b), because package-time generation (a) ships no model.
- **Feeding phonemes directly.** `kokoro-onnx` (MIT) accepts a phoneme string. With a complete name table, a runtime
  path could avoid espeak-ng entirely except for names students type themselves.
- **A second voice per role** (a rider, a woman at the door, Seguín himself). Kokoro and Supertonic both have enough
  voices. It is a design question, not a technical one.

### R8. Questions for the owner

1. **Which voice?** Listen to the `news` and `army` files of Kokoro `af_heart` and `am_fenrir`, Supertonic `sid0` and
   `sid5`, and Piper `kristin`.
2. **Is OpenRAIL-M acceptable** (Supertonic's use policy passed on to buyers, and a "computer voice" notice)? If not,
   Supertonic is out.
3. **One narrator, or different voices for different speakers?**
4. **Should Spanish lines be read in Spanish?** If yes, that argues for Supertonic, whose Spanish is native, over
   Kokoro, whose Spanish voices are weak.
5. **Is Pocket TTS worth a second look?** It could clone a narrator voice from a CC0 recording, or from the owner's own
   voice.

### R9. Reproducing

The scripts that made every number here are in [`evidence/read-aloud/scripts/`](evidence/read-aloud/scripts/):

- `gen.py` speaks the lines and times them;
- `score.py` runs the recogniser and UTMOS;
- `probe.py` prints espeak-ng's phonemes.

They need Python 3.11 with `sherpa-onnx soundfile numpy scipy onnxruntime`, and `torch torchaudio` (CPU) for scoring,
in a virtual environment **outside** this repository. Their `models/` folder is filled from sherpa-onnx's `tts-models`
and `asr-models` GitHub releases: the file names are in `gen.py`. The reference voices come from `kyutai/tts-voices` on
Hugging Face.

The licences were read at their sources on 2026-09-30:

- Kokoro: `hexgrad/Kokoro-82M`, the model card and VOICES.md.
- Piper: each voice's MODEL_CARD in `rhasspy/piper-voices`, Bryce Beattie's page (brycebeattie.com/files/tts), and the
  Lessac/Blizzard 2013 licence page at cstr.ed.ac.uk.
- Supertonic: `Supertone/supertonic-3` and its LICENSE.
- Kitten TTS: `KittenML/kitten-tts-mini-0.8`.
- MeloTTS: `myshell-ai/MeloTTS-English`.
- Pocket TTS: `kyutai/pocket-tts`, `kyutai/tts-voices`, and `KevinAHM/pocket-tts-onnx` `onnx/LICENSE`.
- XTTS: `coqui/XTTS-v2`.
- F5-TTS: `SWivid/F5-TTS`.
- Parler-TTS: `parler-tts/parler-tts-mini-v1`.
- StyleTTS 2: `yl4579/StyleTTS2`.
- Chatterbox: `ResembleAI/chatterbox-turbo`.
- NeuTTS Air: `neuphonic/neutts-air`.
- The espeak-ng build: `k2-fsa/sherpa-onnx` `cmake/espeak-ng-for-piper.cmake`.
