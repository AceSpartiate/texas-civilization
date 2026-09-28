# Sound and music

Owner, 2026-09-28:

> "also: we need audio. we need sound effects, music, etc. everything has to be free, and shouldn't prevent me from selling
> the game in the future."

This is the design as built on 2026-09-28 (worktree branch, **not released**). The licences are in
[AUDIO_LICENSES.md](AUDIO_LICENSES.md). The questions still open for the owner are in §9.

## 1. The licensing answer: the page makes every sound itself

Every sound effect and every note of music is **made by the browser from code in this repository** (the Web Audio API):
noise, oscillators, filters and envelopes for the effects; written-out notes played by the page's own small instruments
(fiddle, fife, flute, a plucked guitar, a reed organ, a side drum) for the music. **No recording, sample, score scan or
published arrangement is used, downloaded or shipped.**

That is the whole of why the owner can sell the game: there is no third party's licence anywhere in the sound. The effects
and the four original pieces are the project's own work. The three older tunes are **public-domain compositions**
(La Folía, a 16th–17th-century dance ground; "New Britain", printed 1829; "Auld Lang Syne", printed 1799) played by the
game's own instruments from notes written here, so neither the composition nor the performance belongs to anybody else.

It also answers the bandwidth question: **no audio file at all** is added to the package or to a page's first load. The
sound is 82 KB of JavaScript (28 KB gzipped), fetched *after* the page's own script so it never delays the first picture.

The manifest `public/assets/audio/licenses.json` lists every effect, bed and piece anyway, and `tests/audio-licenses.test.mjs`
refuses a shipped audio file with no entry, a sound in the game with no entry, a licence that is not CC0, public domain,
CC-BY (with its attribution recorded) or the project's own, and any tune whose composition is not public domain or the
project's. `.gitattributes` marks every audio extension binary, so the first recording that ever does arrive cannot be
corrupted by this checkout's CRLF conversion.

`ceiling:` synthesis, not recordings. The guns, weather, bell, bugle, axe, hammer, hoofs and interface sounds come out
well; the **animals and the baby are formant sketches**, recognisable rather than real. The way out is owner question AU3:
CC0 recordings (Kenney.nl's packs are CC0; Freesound filtered to CC0), each entered in the manifest.

## 2. The sound effects

| Sound | When it plays | Read from |
|---|---|---|
| **Musket** | Every shot a battle or a chase draws, where its flash is drawn; a family's hunter's shot | `public/battle-view.js` and `public/chase-view.js` return `heard` (each flash once, on the screen); `chore.doing === 'the shot'` |
| **Volley** | Five or more shots in one frame: a rank on its officer's word is one crash, not twenty clicks | `hearShots` (public/audio-mix.js) |
| **Cannon** | Every gun's shot drawn (a flash of size 2 or more), with its echo | the battle view's `heard` |
| **Bugle** | A bugler's line in a battle, or a phase whose caption says the bugles sound: *parley* at Béxar (HIST-TEX-491), the *charge* and *retreat* at Concepción (HIST-TEX-480), *the attack* at the Alamo's assault (HIST-TEX-501) | `battle.lines[].role === 'bugler'`, `battle.caption` |
| **Drum** | Only where a battle line names a drum. **None does yet**: the record's drum is held for a documented cue (docs/ART_REQUESTS.md "a bugler and a drummer"), so the game plays none | `battle.lines[].text` |
| **Hoofs** | A horse travelling, or a person riding, near the camera (trot, or gallop when fast) | `entity.kind === 'animal'`, `species: 'horse'`, `travel` |
| **Wagon** | A wagon travelling: the wheels and the axle | `entity.kind === 'wagon'`, `travel` |
| **Ox** | An ox travelling, now and then | `species: 'ox'`, `travel` |
| **Cattle** | The family's herd by the house, now and then, when the house is on the screen | `household.stock` |
| **Hens** | A child feeding the hens or gathering eggs | `chore.id` `child-hens`, `child-eggs` |
| **Footsteps** | A family person walking, lightly, only when the camera is close | `travel.mode === 'foot'` |
| **Axe** | Felling, fetching logs, clearing, splitting rails: a steady chop | `chore.id` `fell-trees`, `fetch-logs`, `clear-plot`, `fence-plot` |
| **Tree falling** | The felling moves on to the next tree | `chore.doing` changing under `fell-trees` |
| **Hammer** | Raising a house, or helping a neighbour raise one | `chore.id` `build-house`, `help-raise` |
| **Rain** (lasting) | Rain or a storm at the middle of the view, or on the road | `weatherMix(world.weather, …)`, `flight.weather` |
| **Thunder** | A storm: every twelve to twenty-eight seconds | `mix.storm` |
| **Wind** (lasting) | A norther, a storm's wind | `galeForce(mix)`, the wind's force |
| **River** (lasting) | A river or creek line, or a ford, ferry or bridge, near the middle of the view | `map.terrain`, `map.sites` crossings |
| **Fire** (lasting, crackling) | A burning town or farm (the Scrape), the family's camp before the house, the road camp | `world.fires`, `land.shelter === 'camp'`, `flight.camp` |
| **Baby** | The family's baby crying; heard again at most every fourteen seconds while it cries | `entity.baby.state === 'cry'` (student page only; the Host is sent no babies) |
| **Church bell** | The alarm at Béxar, February 23, 1836 - **only for a family whose own person heard it there** (the report's source is that person "at Béxar", FIC-GONZ-622), or for a page watching the Alamo's first phase. A family a rider told later hears news, not the bell | `reports[]` `bexar-arrival`, `battleAlert`, `battle.lines` `a-bell` |
| **¡Alto!** | Soldiers hail the family on the road: hoofs pulled up, a low sting, a horse blowing | `flight.ask.id === 'alto'`, the chase's `alto` line shown |
| **Click** | Any button pressed (the page's own) | a click on a button |
| **Card** | The Journal, a town scene, a message, the house plan, the wagon or the ending opening | the panel's `hidden` / `data-open` |
| **Question** | A rider's meeting, a call, a road question, a chore's question | `encounter`, `request`, `flight.ask`, `chore.ask` |
| **Lapse** | A question turning pressing (two thirds of its time gone), once | `request.pressing`, `encounter.pressing`, `entity.pressing` |
| **News** | A new report or military notice | `reports[]`, `battleAlert` |

A sound is only ever made of something the page was already sent (`public/audio-cues.js`); nothing asks the server for
anything, so no sound can carry knowledge the page did not have. A page opened in the middle of a class hears nothing of
what was already there - only what comes next.

**Not played, on purpose.** The *degüello* (HIST-TEX-503, disputed: the earliest account is Potter's, 1860) is never
played; the Alamo's assault bugles are a call written for the game, as the caption says only "the attack". "Will You Come
to the Bower?" at San Jacinto (HIST-TEX-525, tradition; the owner's J3: "nothing is played") is not played. The bugle calls
are on a natural bugle's notes and are **not** any army's documented call (owner question AU7; `FIC-GONZ-711`).

## 3. The music

| Piece | Plays for | Composition | Status |
|---|---|---|---|
| **La Folía** | the title, the lobby, making the family | the Spanish dance ground, 16th–17th c.; the melody over it written for the game | public domain / project's own |
| **Brazos Morning** | farming days | written for the game | project's own |
| **Muster** (fife and drum) | the war reaching the family: a call to arms, a man with the army, the alarm | written for the game | project's own |
| **Before the Guns** (drone and drum, no tune) | a battle in front of the page | written for the game | project's own |
| **The Long Road East** | the Runaway Scrape, while the family is on the road | written for the game | project's own |
| **New Britain** ("Amazing Grace") | the ending, in turn with the next | anonymous American hymn tune, printed 1829 | public domain |
| **Auld Lang Syne** | the ending, in turn with the one before | Scottish air, printed 1799 | public domain |

The Host's page follows the class's war by date (farm before October 1, 1835; war; the Scrape March 11 to April 22, 1836),
not any one family's. Every piece fills its bars exactly, so it loops without a stumble (tested), and is played a second
and a half ahead of the clock so a slow frame on a Chromebook does not stutter it; a page that slept does not play what it
missed. A change of moment crossfades over two and a half seconds.

**Music is never louder than the effects:** its bus is held at 45% of its slider (`MUSIC_CEILING`), and it ducks to 40%
of itself while a cannon, a volley, thunder, the bell or ¡Alto! sounds.

## 4. How it is wired

- `public/audio-mix.js` - pure: the catalogue of sounds (bus, priority, own limit, least gap, level), the starting levels
  by kind of page, settings in `localStorage` (`tr-audio:student`, `tr-audio:host`, `tr-audio:solo`; a blocked store falls
  back), `placeSound` (distance from the middle of the screen → level, pan, and how much the air dulls it; silent past a
  screen and a half; a fight seen across the whole country is a murmur), `hearShots` (a frame's shots → single shots, a
  volley, a gun) and the `Mixer` (at most 12 voices, each sound's own limit and least gap, the important let in over the
  trivial, a loudness budget that turns a new sound down rather than letting the page get louder).
- `public/audio-cues.js` - pure: `snapshotCues` (the once-only sounds a snapshot brings), `frameCues` (the frame's shots
  and ¡Alto!, the rhythm of work and travel near the camera, the level of rain, wind, river and fire), `moodFor` (which
  music).
- `public/audio-synth.js` - the effects' recipes and the lasting beds; `public/audio-music.js` - the pieces, their
  arrangement and `MusicPlayer`.
- `public/audio.js` - `createSoundscape`: the AudioContext, the buses and a limiter, the control, the gesture unlock.
- **Hooks in the rest of the page, all small:** `public/app.js` imports `/audio.js` *after* itself (`import()`), calls
  `soundscape?.observe(snapshot)` at the end of `render` and `soundscape?.frame(...)` once a frame in `drawWorld`, with what
  the battle and chase views returned; `public/battle-view.js` and `public/chase-view.js` add `heard` (and the chase
  `spoken`) to what `draw` returns; `server/app.mjs` serves the five modules; `public/style.css` styles the control.

## 5. Classroom sense

- **A student's page in a class starts muted** (owner question AU1). Thirty Chromebooks in one room each playing the war
  would be a wall of noise; the teacher's projector carries the class's music and big moments. A muted page makes **no
  AudioContext at all** and spends nothing a frame on sound.
- **The Host's page and a solo player start with everything on** (AU2, AU6).
- **The control** is a button beside the Journal: *Sound off* / *Sound*, and a small panel with *Sound on*, Volume, Music,
  Effects and Buttons. What a person sets is remembered on that device, for that kind of page. A student page's panel
  says "Sound starts off in class. Use headphones if you turn it on."
- **Browsers allow sound only after a gesture.** Nothing is made before the first press, key or touch; turning sound on
  with the control is itself that gesture. A hidden tab suspends its sound and resumes when shown.
- **Reduced motion.** A battle or chase held still (reduced motion, or a paused class) fires nothing new, so it makes no
  new gunfire either: the sound follows the picture (AU5). Music, the bell and the interface are unaffected.

## 6. Size and cost

- **Package:** +82 KB of page modules, +20 KB manifest; scripts, tests and docs besides. **No audio file.**
- **First load of a page:** +28 KB gzipped, in five small requests fetched after `app.js` has run (so they do not delay the
  first drawn map); a reload is five 304s. Thirty cold Chromebooks: about 0.8 MB more, against ~470 MB.
- **Frame time** (`npm run test:audio`, same computer, headless): the page's sound took 0.1 ms a frame (median) and
  0.4-0.6 ms at p95 through the Gonzales fight with shots every frame. Not measured on a Chromebook.

## 7. Evidence (same computer only)

- `tests/audio-licenses.test.mjs` (5), `tests/audio-mix.test.mjs` (7), `tests/audio-music.test.mjs` (5),
  `tests/audio-cues.test.mjs` (11): 28 tests. **Each seen failing**: `node scripts/audio-injections.mjs` injects 28
  regressions one at a time (an unlisted .ogg; a sound entered as NC; CC-BY with no attribution; a new sound not in the
  manifest; a tune marked copyrighted; `.gitattributes` losing `*.ogg`; students starting unmuted; music above effects; a
  store that throws; no distance falloff; no volley folding; a sound's own limit ignored; the loudness budget ignored; a
  piece a note short; the war with no music; the degüello played; a slept page playing all it missed; a mid-class page
  playing everything already there; the bell for a family a rider told; every bugle the attack; the lapse repeating; the
  baby unheard; the chase's ¡Alto! unheard; rhythms every frame; thunder in any rain; the river never heard; the Scrape
  playing the farm's music; a recipe starting nothing) and **each failed exactly its own test**
  (`docs/evidence/audio-injections.json`).
- `npm run test:audio` (`scripts/audio-browser-proof.mjs`): a real class through the join flow, the Host and two students,
  the Web Audio API replaced by a counting stand-in (`tests/support/mock-audio.mjs`). Holds: no AudioContext before a
  gesture; students start muted and make none through the join flow; the Host's Start unlocks and plays music; a student's
  choice survives a reload and waits for the next press; the **Gonzales fight's own projection** (sim/battle-stage.mjs,
  moved under the camera) is heard as muskets and the cannon, the music going to the battle's; a chase's shot and ¡Alto!;
  a storm's rain and thunder; the bell for a family whose man was at Béxar; the baby; and the **muted page given all of the
  same plays nothing and makes no AudioContext**, while its cues show it saw each. Then every effect and a stretch of
  every piece is rendered in Chrome's own Web Audio engine (an OfflineAudioContext) and measured: all make sound, none out
  of proportion (`docs/evidence/audio-browser-proof.json` has each one's peak and RMS). 11 checks. **Seen failing** twice,
  each injection put in by hand and taken out: the battle view no longer reporting its shots (`heard`) → *"the fight was
  heard as []"*; a muted page starting its sound engine at the first press (both mute guards in `public/audio.js` taken
  out) → *"a muted student page made an AudioContext after the join flow's presses"*. Removing only one of the two guards
  did not fail it: the page is guarded twice, on purpose.
- Rerun on the change, same computer, at most two at once: `test:battle-gonzales` 12 of 12, `test:scrape-pursuit` 14 of
  14 (its first run, alongside `test:battle-gonzales`, timed out waiting; rerun alone it passed), `test:solo` 15 of 15,
  `test:lesson` 33 of 33. `npm test` in HANDOFF.
- Not claimed: how it sounds on a Chromebook's speaker, in a real classroom, or with thirty pages at once.

## 8. Ceilings

- `ceiling:` synthesis, not recordings (§1; AU3).
- `ceiling:` one page's own limits (`MAX_VOICES`); thirty pages are kept quiet by starting muted, not by talking to each
  other.
- `ceiling:` the river is the map's own water lines and crossings; the fine land's rivers drawn from its levels are not read.
- `ceiling:` one bell's voice for any bell the game rings.

## 9. Owner questions

- **AU1. A student's page in a class starts:** (a) **muted, with a Sound button to turn on (built, recommended)**; (b) effects
  on quietly, music off; (c) everything on quietly.
- **AU2. The Host's projector plays:** (a) **music and every effect near its camera (built)**; (b) music and only the big
  moments - the bell, cannon, bugles, ¡Alto!; (c) effects only, no music.
- **AU3. Animals and the baby:** (a) **keep the page's own synthesised sounds (built)**; (b) add CC0 recordings (Kenney.nl
  packs, Freesound filtered to CC0) for the animals, the baby and footsteps, each listed in the manifest (about 0.3-1 MB of
  Ogg Opus); (c) record our own.
- **AU4. The music:** (a) **three public-domain tunes and four pieces written for the game (built)**; (b) replace the
  written pieces with more period tunes (for example "Soldier's Joy", "The Girl I Left Behind Me"); (c) fewer pieces.
- **AU5. With reduced motion on:** (a) **the sound follows the picture - a held-still battle fires no new shots, so makes no
  gunfire (built)**; (b) gunfire is heard even when the picture holds still; (c) also soften sudden loud sounds (cannon,
  thunder) for reduced motion.
- **AU6. A solo player starts with:** (a) **everything on (built)**; (b) everything on, quieter; (c) muted.
- **AU7. The battles' bugles:** (a) **calls written for the game on a bugle's natural notes, never the degüello (built)**; (b)
  research the Mexican army's documented calls of 1835-36 and play those where the record has them.
