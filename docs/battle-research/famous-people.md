# The famous people of 1835–36: who they are in the game today, and who they should be

**Owner, 2026-09-26 (verbatim):** *"famous npc's: have we taken the time to ensure they do what they're supposed to? they
should be labelled, saying and doing the things that they likely would have, dying the way they should (Travis, Bowie,
Crocett come to mind as an example)."*

**Status: research and a plan. Nothing here is built.** Written 2026-09-26 on the worktree branch of `main` at `d9daea3`,
reading `main` and the three finished but unmerged battle branches (the Alamo `worktree-agent-a202a97daf53da315`,
Concepción and the Grass Fight `worktree-agent-adfe769d1fe9ef0ce`, Coleto and Goliad `worktree-agent-ab3929988a2ad1e82`).
Line numbers marked *(branch)* are on that branch; the rest are on `main`. Read with `docs/BATTLES.md` §2 (the talk rules),
`docs/MILITARY_EXPERIENCE.md` ("Survivors and Joe"), `docs/ALAMO_FATES.md`, `docs/battle-research/staging.md` and
`VISION.md` §16 ("Individually preserve player characters, important historical figures where needed"; "No gore").

Labels, as `HISTORY.md` uses them: **DOCUMENTED** (a contemporary document or the participant's own recorded testimony, as an
institutional history reports it), **STRONGLY SUPPORTED** (several later accounts agree), **TRADITION** (later, single-source
or legendary), **DISPUTED** (the sources conflict; both sides are given). As everywhere in `docs/battle-research/`, the
sources were read as institutional histories on the web, not as archival originals; quote nothing to a class that has not
been checked against the page.

---

## The one-line answer

**No famous person is a person in the game.** Not one historical figure is an entity in `world.entities` with a stable ID
and a position; none persists from one event to the next; none can be clicked. They exist as **words** — side and group
names ("Castañeda's dragoons", "Milam's division", "Lamar's horsemen"), captions, news, the Host's spotlight — and, inside
three engagements, as a **picture for one phase**: two commanders drawn and labelled at a parley (Moore and Castañeda at
Gonzales; J. W. Smith and Sánchez Navarro at Béxar; Houston and Santa Anna at San Jacinto), and Milam's named fall in the
Veramendi yard. The unmerged Alamo branch adds the first real mechanism for a named figure on the field (`phase.people`),
used for **Travis** (at the north battery, speaking Joe's documented words, falling at the right moment) and **Joe**
(hiding, then coming out). Everything else the owner named is missing: **Bowie's death is a caption, Crockett is never
drawn and never dies anywhere in the game, and on `main` no text even names Travis, Bowie or Crockett among the dead.** A named line said
outside a parley is drawn over a random sampled figure with no name on the bubble, so the class cannot tell who is
speaking. Two Alamo texts also break the repository's own rules about Joe ("every man in it was killed … Travis's servant
Joe").

**The recommended build** is one small, generic engine addition — a **historical-person roster** (`sim/people.mjs`): each
famous person a stable ID, a name, a short "who" line, and a dated **itinerary** of where they are and what they are doing
through every event they were at, with their documented words and their fate at its moment, each tied to a claim — which the
battle engine, the map and the director all read. About fifteen people get this (Travis, Bowie, Crockett, the Dickinsons,
Joe, Seguín, Milam, Austin, Burleson, Cos, Santa Anna, Houston, Fannin, Moore, Castañeda); the rest are named figures inside
one battle or mentioned only. A student can tap any named figure for a card of **who they were, what is known, and what is
disputed** — filtered by what the student's family can know, so a card never tells a death before the word arrives.
Crockett's death is shown **as a dispute**: he is last seen fighting at the palisade by the church, is not seen to die, and his card
gives both accounts, each labelled with who told it.

---

## 0. Sources opened for this document

§1 cites the code directly. The historical sources below were opened on **2026-09-26** unless another date is given; the
earlier research files this draws on give their own dates (`alamo.md` 2026-09-16, `ALAMO_FATES.md` 2026-09-22,
`staging.md` and `bexar-storming.md` 2026-09-25).

**How they were read.** Through a web-fetching tool that returns **a summary of each page with the sentences it quotes**, the
same method `alamo.md` and `winter-1835-36.md` record. Every quotation below is what that tool gave back as the page's words;
**check each against the page before it goes into the game or a claim row.** The Handbook of Texas Online (TSHA; "HOT") is at
`https://www.tshaonline.org/handbook/entries/<slug>`, so only the slug is given. Several first-guess slugs returned 404 and the
working one is given here. Texas Monthly returned 403; a UT News article of 2000 returned 404; only the first page of the Texas
State Library's facsimile of Houston's report opened.

| Key | Source (all checked 2026-09-26) | Trust |
| --- | --- | --- |
| S1 | HOT `alamo-battle-of-the` | High (institutional synthesis) |
| S2 | HOT `travis-william-barret` (Archie P. McDonald) | High |
| S3 | Texas State Library and Archives, the Travis letter of February 24, 1836: https://www.tsl.texas.gov/treasures/republic/alamo/travis-about.html | High: the original's holder |
| S4 | The Alamo, *Joe's Account* (William F. Gray's diary, March 20, 1836): https://www.thealamo.org/remember/battle-and-revolution/joes-account (also read by `MILITARY_EXPERIENCE.md` 2026-09-21 and `staging.md` 2026-09-25) | High for what Joe said; testimony |
| S5 | HOT `rose-louis-moses` | High for the story's provenance |
| S6 | Francisco Antonio Ruiz's statement (*Texas Almanac*, 1860), transcribed at Sons of DeWitt Colony: http://www.sonsofdewittcolony.org/adp/archives/newsarch/ruizart.html; HOT `ruiz-jose-francisco` names him | Medium: eyewitness, 24 years on |
| S7 | HOT `bowie-james`; HOT `alsbury-juana-gertrudis-navarro`; HOT `neill-james-clinton` (Bowie's words on Neill) | High |
| S8 | HOT `crockett-david` | High; it states the dispute without deciding it |
| S9 | HOT `dickinson-susanna-wilkerson`; HOT `alamo-noncombatants` | High for events; her statements are testimony |
| S10 | HOT `pena-jose-enrique-de-la`; Sons of DeWitt Colony, de la Peña archive: http://www.sonsofdewittcolony.org/adp/archives/delapena/delapena2.html and http://www.sonsofdewittcolony.org/adp/archives/newsarch/penapaper.html (paper tests, 1998); the UT conference of 2000 as reported by the *Austin Chronicle* (found by search); the Dolson letter and the Galveston letter of June 9, 1836 as summarised at thealamo.org and Sons of DeWitt Colony (search summaries) | Medium: the argument is documented, its answer is not |
| S11 | HOT `bonham-james-butler` | High |
| S12 | HOT `dickinson-almeron` | High |
| S13 | HOT `dickinson-angelina-elizabeth` | High |
| S14 | HOT `joe` | High |
| S15 | HOT `esparza-jose-maria`; HOT `esparza-enrique` | High; Enrique's interviews are late testimony |
| S16 | HOT `seguin-juan-nepomuceno`; Wikipedia *Juan Seguín* (for the courier date only) | High / medium |
| S17 | HOT `austin-stephen-fuller` | High |
| S18 | HOT `burleson-edward` | High |
| S19 | HOT `johnson-francis-white` | High |
| S20 | HOT `cos-martin-perfecto-de` | High |
| S21 | HOT `grant-james` | High |
| S22 | HOT `urrea-jose-de` (thin on 1836) | Medium |
| S23 | HOT `fannin-james-walker-jr`; HOT `coleto-battle-of`; HOT `goliad-massacre`; Joseph H. Spohn's account (*New York Evening Star*, 1836), transcribed at Sons of DeWitt Colony: http://www.sonsofdewittcolony.org/goliadspohn.htm; Wikipedia *James Fannin* (for Hardin's three requests) | High / testimony / secondary |
| S24 | HOT `alavez-francita` | High |
| S25 | HOT `houston-sam`; HOT `san-jacinto-battle-of`; Houston's report of April 25, 1836, transcribed at https://texasbob.com/txdoc/texdoc15.html (page 1 of the facsimile at https://www.tsl.texas.gov/treasures/republic/san-jacinto/report-01.html) | High; the transcription to be checked against the facsimile |
| S26 | HOT `santa-anna-antonio-lopez-de` (thin on 1836); William Carey Crane, *Life and Select Literary Remains of Sam Houston* (1884), ch. 10, at Wikisource | Low for words (48 years on) |
| S27 | HOT `fernandez-castrillon-manuel` | High |
| S28 | HOT `almonte-juan-nepomuceno` | High |
| S29 | HOT `lamar-mirabeau-buonaparte` | High |
| S30 | HOT `sherman-sidney` | High |
| S31 | HOT `neill-james-clinton` | High |
| S32 | HOT `milam-benjamin-rush`; HOT `bexar-siege-of` | High |
| S33 | HOT `karnes-henry-wax` | High |
| S34 | HOT `smith-erastus-deaf` | High |
| S35 | HOT `moore-john-henry` | High |
| S36 | HOT `castaneda-francisco-de` | High |
| S37 | HOT `ugartechea-domingo-de` | High |
| S38 | HOT `martin-albert`; HOT `kimbell-george-c` (via search); HOT `smith-john-william` | High |
| S39 | HOT `jameson-green-b` | High |
| S40 | HOT `filisola-vicente` | High |
| S41 | HOT `rusk-thomas-jefferson` | High |
| S42 | HOT `horton-albert-clinton` | High |
| S43 | HOT `zuber-william-physick` | High |

The printed books named in the Crockett dispute (Kilgore 1978 and its 2010 edition with Crisp; Groneman 1994; Hardin's *Texian
Iliad*) were **not opened**; they are cited through the pages above and `docs/ALAMO_FATES.md`.

---

## 1. How named historical people exist in the game today

### 1.1 Not as entities

- **Nothing in a formation is a person.** `sim/battle-stage.mjs:18-19`: "a side is a count and a style, drawn as a sample.
  A family's own people are real entities" (`FIC-GONZ-006`; `docs/BATTLES.md` §3). The sampled figures are nobody.
- **No historical person is in `world.entities`.** The only non-family people the server creates are invented: the Alamo
  runner (`sim/alamo-runner.mjs:44,69-73`, names such as "Asa Linthicum", commented "not names from the roll of the Alamo's
  defenders") and the riders and couriers (`sim/encounters.mjs:103` `RIDER_NAMES`; `sim/world.mjs:726`;
  `sim/expresses.mjs:94`).
- **Armies have a name and a place, not a commander.** `world.army` (`sim/army.mjs:80-83`) is "the Texian force"; the
  service armies in `sim/armies.mjs:45-53` are "the garrison at Béxar", "Fannin's command", "Houston's army" (renamed
  `Houston's army at <camp>`, `:65`, placed at `houstonCamp`, `sim/houston.mjs:36-57`); the Mexican columns are "Santa
  Anna's column", "Urrea's column", "Gaona's column" (`sim/road.mjs:112-114`), dropped when San Jacinto begins
  (`sim/armies.mjs:81`). None has a commander field. They are drawn as a camp or a flag with the name under it in 12px
  Georgia (`public/army-view.js:100-126`, called from `public/app.js:3070-3103`) and are **not clickable**: `entityAt`
  (`public/app.js:1102`) finds only drawn entities.

### 1.2 The eight ways a famous name reaches the screen

| # | How | Where in the code | Drawn? Labelled? |
| --- | --- | --- | --- |
| 1 | **A side, group or part named after a person** ("Castañeda's dragoons", "Milam's division", "Johnson's division", "York's company", "Sherman's horsemen", "Deaf Smith's party", "Lamar's horsemen", "Cos's men", "Urrea's men", "Grant's party") | `sim/battles/gonzales.mjs:73`; `bexar-storming.mjs:112-113,134,138,430,481,548`; `san-jacinto.mjs:98-100,164,194-195,221…`; `san-patricio.mjs:91-94`; `agua-dulce.mjs:71-73` | The side's name and count under its figures, only when the page asks for names (`public/battle-view.js:589`, `labelSides` `:1035-1044`); groups are labelled only on the Coleto branch (`named: true`, battle-view `:1016-1018` *(branch)*). A label on a crowd, not a person. |
| 2 | **A parley**: two named commanders drawn between the lines for one phase | `sim/battle-stage.mjs:539-541`; `public/battle-view.js:932-954` | Yes: each drawn as his side's ordinary figure (a dragoon if `mounted`, `pose: 'injured'` for Houston) with his **surname under him** (`:949-951`). Gone when the phase ends. Used three times: Moore and Castañeda (`gonzales.mjs:184`), J. W. Smith and Sánchez Navarro (`bexar-storming.mjs:517,527`), Houston (injured) and Santa Anna (`san-jacinto.mjs:368`). |
| 3 | **A named line** (`line.name`) | `sim/battle-stage.mjs:111-116`; `public/battle-view.js:983-1002`; `public/speech.js` | The bubble carries **no name** (`speech.js` draws text and gloss only). It is placed over the parley figure if there is one (`battle-view.js:984`), otherwise **over a sampled figure picked by hash or at the officer's spot** (`:993-1001`) — so W. P. Smith's sermon (`gonzales.mjs:102-103`) and Milam's call (`bexar-storming.mjs:173`) come out of an anonymous man. The name appears only in the text strip under the map (`public/app.js:5694`, `#battle-phase`: "Name: text (gloss)"). |
| 4 | **A named fall** (`fall.name`, `fall.point`) | `sim/battle-stage.mjs:386-397`; `public/battle-view.js:543-550,729-732` | Yes: a figure falls at the named point, lies still, has his name under him and is carried off. Used **once**: Milam in the Veramendi yard (`bexar-storming.mjs:395`, `HIST-TEX-039`). |
| 5 | **A named person on the field** (`phase.people`) — **Alamo branch only** | `sim/battle-stage.mjs:129-132, 483-486` *(branch)*; `public/battle-view.js:854-875` *(branch)* | Yes: at a ground point, with a pose (`fire`, `hide`, `emerge`), a claim, an optional fall minute; the name drawn under him; a named line goes over him (`:1007` *(branch)*). Travis (`sim/battles/alamo.mjs:416,437` *(branch)*) and Joe (`:523,546` *(branch)*). Re-declared phase by phase; not a persistent entity. |
| 6 | **Captions and phase titles** | every `sim/battles/*.mjs` | The caption strip (`#battle-caption`, `public/app.js:5691`). This is where Karnes's crowbar, Grant's death, Bowie's death *(branch)*, Fannin's execution *(branch)*, Deaf Smith and the bridge, Cos's surrender and Filisola live. |
| 7 | **Director text**: news (`word`/`sendWord`), the journal, the Host's spotlight, the Rumor Mill, cards and accounts | `sim/directors.mjs` (e.g. `:1156`, `:1212-1214`, `:1241`, `:1274-1303`), `sim/alamo.mjs:343-351`, `sim/houston.mjs:339-347`, `sim/rumour-story.mjs:25-46`, `sim/bexar-fight.mjs:240-280`, `sim/south.mjs:338-426`, `sim/san-jacinto.mjs:188-191,279-281`, `sim/town-scenes.mjs:320-503` | Words only. The spotlight moves the Host's camera to a site (`sim/host.mjs:35-49`). |
| 8 | **Places named after people** | `sim/town-layouts.mjs:67` "Austin's headquarters"; `public/alamo-layout.js:37` "Travis / Joe quarters · reconstructed" | Building labels only when zoomed close (`public/town-art.js:67-74`); the Alamo room label is drawn only on the study page (`public/alamo-workshop.js:113,121`), not in the game. |

The one Gonzales scene cast member with a real name is the regidor **Joseph D. Clements** (`sim/town-scenes.mjs:80`), who
reads the documented refusal (`:245`, `HIST-TEX-462`); the scene cards (`public/town-scenes.js:288-333`) are the closest
thing the game has to a "who was" card, and they are told by invented townspeople.

### 1.3 The talk rule as the code keeps it

`checkEngagement` refuses a `name` on a **reconstructed** line (`sim/battle-stage.mjs:114`) and requires a claim on every
documented and tradition line (`:113,115`). It does **not** refuse a name on a `tradition` line, and one exists: Milam's
"Who will go with old Ben Milam into San Antonio?" (`bexar-storming.mjs:173`, `HIST-TEX-492`, owner's B2). That matches
the brief for this document ("documented or `tradition` only") but **not** `docs/BATTLES.md` §6.5 ("A named person may
speak only a `documented` line; `checkEngagement` refuses anything else") nor the comments at `gonzales.mjs:52` and
`san-jacinto.mjs:80` ("`name` only ever on a documented line"). `bexar-storming.mjs:101` has it right. **§6.5 and the two
comments should be corrected to "documented or tradition, never reconstructed"** — a docs fix, recommended with the build.

### 1.4 What every current use lacks

1. **Identity across time.** Moore at the parley, Castañeda's dragoons and the Castañeda in the town's cards are three
   unrelated strings. Santa Anna is a column marker until San Jacinto begins, then a parley figure for one phase, and was never
   at Béxar or the Alamo in any drawn form. Nothing lets a later phase, the map or a card know that it is the same man.
2. **A place of his own.** Outside a parley or `phase.people`, a named speaker has no position: his words come out of an
   anonymous figure.
3. **A label on speech.** The bubble does not say who is speaking.
4. **A fate at its moment.** Milam (main) and Travis (Alamo branch) are the only deaths staged on the field. Bowie's death is a
   caption *(branch)*; Crockett's, Bonham's, Almeron Dickinson's, Gregorio Esparza's, Grant's, Castrillón's and Fannin's are
   not staged at all (Fannin's is a caption *(branch)*); Santa Anna's capture and Houston's wound are a parley and a pose.
5. **Anything to click.** No famous person — not the parley figures, not Milam, not Travis — can be tapped to learn who he was.

---

## 2. The roster

### 2.1 At a glance

"Present" = drawn on the field as himself in at least one phase; "Labelled" = his name drawn at his figure; "Words" = he is
given documented or tradition words; "Death" = his death is drawn at its moment and place (— if he did not die in the window).
**B** = only on an unmerged branch.

| Person | Present | Labelled | Words | Death staged right | Biggest gap |
| --- | --- | --- | --- | --- | --- |
| William B. Travis | **B** (Alamo alarm → repulse) | **B** | **B** documented (Joe) | **B** yes, north battery | absent before the assault and on main |
| James Bowie | no | no | no | no (caption, and in the wrong building, **B**) | never drawn, in three engagements |
| David Crockett | no | no | no | no | nowhere but a news line |
| James Bonham | no | no | no | no | caption only **B** |
| Almeron Dickinson | no | no | no | no | named only in the Gonzales Eighteen card |
| Susanna and Angelina Dickinson | no | no | no | — (survived) | not drawn in the sacristy or walking to Gonzales |
| Joe | **B** (hide, emerge) | **B** | **B** documented | — (survived) | two texts break the rules (§5) |
| Gregorio Esparza and family | no | no | no | no | a code comment only |
| Juan N. Seguín | no | no | no | — | a runner's sentence and a caption **B** |
| Kimbell, Martin, J. W. Smith | J. W. Smith at Béxar's parley | Smith | no | no (relief) | the relief is a nameless group **B** |
| Ben Milam | fall only | at his fall | tradition (over an anonymous figure) | **yes** | not drawn alive; the call comes from nobody |
| Stephen F. Austin | no | no | no | — | text only |
| Edward Burleson | no | no | no | — | named groups only |
| F. W. Johnson | no | no | no | — | escape drawn as a nameless part |
| Henry Karnes | no | no | no | — | caption and a breach point |
| James Grant | no | no | no | caption only (correctly not drawn: killed after he surrendered) | never seen in the chase |
| Deaf Smith | a party of three at San Jacinto | the group | no | — | the sentinel at Béxar and the bridge are captions |
| John H. Moore | parley | yes | documented | — | only for the parley phase |
| Francisco de Castañeda | parley | yes | documented | — | only for the parley phase |
| Martín Perfecto de Cos | no | no | no | — | Béxar, the Alamo and San Jacinto as a name on groups |
| Domingo de Ugartechea | no | no | no | — | a named group |
| Antonio López de Santa Anna | parley at the capture; a column marker | yes / marker | no (correctly) | — (captured) | not at Béxar, the Alamo or the rout |
| José Urrea | no | no | no | — | named sides |
| Manuel Fernández Castrillón | no | no | no | no | absent everywhere |
| Juan N. Almonte | no | no | no | — | his surrender absent |
| Vicente Filisola | no | no | no | — | caption only (correct for Tier 3) |
| James W. Fannin | no | no | no | no (caption **B**) | never drawn at Concepción, Coleto or Goliad |
| Albert C. Horton | no | group name **B** | no | — | not at the head of his men |
| Francita Alavez | **B** | **B** | none (correctly) | — | right as built on the branch |
| Sam Houston | parley (injured) | yes | no (correctly) | — (wounded: a pose) | not drawn in the attack; wound not staged |
| Mirabeau B. Lamar | no | group name | no | — | the April 20 rescue absent |
| Sidney Sherman | no | group name | no | — | the flag and the cry tradition absent |

### 2.2 Person by person

Each entry: **Events** (the game's engagements and dates) · **Where and what** · **Words** (documented first; tradition after) ·
**Death** (if in the window) · **Game now** · **Gap**. Sources are keyed to §0 as [S*n*].

#### The Alamo and the siege of Béxar in 1836

**William Barret Travis** (lieutenant colonel, regular cavalry). *Tier 1.*
- **Events:** Béxar from February 3, 1836 with about thirty horsemen; joint command with Bowie after Neill's furlough (about
  February 11); sole command from February 24, when Bowie fell ill; the siege (February 23 – March 6); the assault. DOCUMENTED
  (`HIST-TEX-051`, `-054`) [S1][S2].
- **Where and what:** during the siege, his quarters on the west side (the plan's reconstructed "Travis / Joe quarters",
  `public/alamo-layout.js:37`; the room's identity is a staging choice, `docs/ALAMO_LAYOUT.md:82`); sends the couriers
  (`HIST-TEX-431`); answers the red flag with a cannon shot (DOCUMENTED, his own letter [S3]). At the alarm he "ran across the
  Alamo and mounted the wall" at the **north battery**, fired, and "in an instant … was shot down", among the first to fall
  (DOCUMENTED as Joe's testimony, recorded by William F. Gray on March 20, 1836 [S4]; the Handbook [S1][S2]).
- **Words — DOCUMENTED (written):** the letter of February 24, "To the People of Texas & All Americans in the World": "I shall
  never surrender or retreat"; "Victory or Death" [S3]. Letters of February 25 and March 3 (to the Convention and to Jesse
  Grimes, and one to David Ayres about his son Charles) [S1][S3]; February 23, "The enemy in large force is in sight. We want
  men and provisions" [S1]. Two March 3 phrasings ("my bones shall reproach my country for her neglect"; "Take care of my little
  boy") came to this research only through search snippets — **to be checked against the letters before use**.
  **DOCUMENTED (spoken, as Joe reported it):** "Come on boys, the Mexicans are upon us, and we'll give them Hell" [S4]
  (`HIST-TEX-502`, Alamo branch). **TRADITION:** the line in the sand and its speech — from Louis "Moses" Rose through the
  Zuber family, printed by W. P. Zuber in the *Texas Almanac* for 1873; the Handbook's Rose entry notes Enrique Esparza's 1907
  support; historians doubt it (`HIST-TEX-437`) [S5][S43]. **DISPUTED:** Gray's own record of Joe has a "General Mora" attack the
  fallen Travis, who ran him through before both died; no General Mora is known to have been killed, and an army officer's letter
  of May 1836 tells it differently [S4].
- **Death:** March 6, about 5:30–6 a.m., on the north battery, shot in the head, "early in the battle" (DOCUMENTED: Joe via Gray;
  the Handbook, "a single bullet in the head" [S2]). Francisco Ruiz, the alcalde who identified the bodies, wrote that "on the
  north battery … lay the lifeless body of Colonel Travis on the gun carriage shot only in the forehead" (eyewitness, published
  1860; STRONGLY SUPPORTED) [S6]. Place and manner agree across the sources: **the one famous Alamo death that is not disputed in
  substance.**
- **Game now:** main — a name in news (`sim/directors.mjs:1212-1213`), the siege letter paraphrased (`sim/alamo.mjs:344`), the
  runner's "Colonel Travis is sending a letter" (`sim/alamo-runner.mjs:103-106`), the family-panel prompt
  (`public/family-panel.js:402`); never drawn; his death never told. Alamo branch — a labelled figure at the north battery in
  `alarm` and `repulse`, firing, speaking Joe's line, falling four minutes into `repulse` (`sim/battles/alamo.mjs:416-437`
  *(branch)*), drawn with the volunteer figure as a stand-in; the red-flag caption quotes his letter (`:237` *(branch)*).
- **Gap:** not present for the thirteen days of the siege (he writes the letters, chooses the riders, walks the walls); the word
  of the fall never names him among the dead; no card.

**James Bowie** (colonel of volunteers). *Tier 1.*
- **Events:** Concepción, October 28, 1835, commanding with Fannin; the Grass Fight, November 26, leading the horsemen; Béxar
  from January 19, 1836 (about thirty men, chose to hold it with Neill); joint command; the siege; the assault. DOCUMENTED
  (`HIST-TEX-019`–`-021`, `-031`, `-051`) [S1][S7].
- **Where and what:** elected commander of the volunteers February 12, sharing command with Travis from the 13th (STRONGLY
  SUPPORTED [S7]); struck by "a disease of a peculiar nature" (diagnosed variously as pneumonia, typhoid pneumonia or, the
  Handbook thinks likelier, advanced tuberculosis — DISPUTED) and in bed from February 24, leaving Travis in sole command
  (DOCUMENTED [S1][S7]); nursed by Juana Navarro Alsbury [S7]; killed in his room in the assault.
- **Words — DOCUMENTED (written):** the report of Concepción signed with Fannin (October 28; "a charge is sounded", used in the
  branch's bugle gloss, `HIST-TEX-020`); his letter of February 2, 1836 to Governor Smith: "we will rather die in these ditches
  than give it up to the enemy", and "The Salvation of Texas depends in great measure in keeping Bejar out of the hands of the
  enemy" [S7]. **No spoken words at any fight are documented.**
- **Death:** March 6, **killed on his cot in a room on the south side** (STRONGLY SUPPORTED: the Handbook — "Bowie lay on his cot
  in a room on the south side"; Ruiz — "found dead in his bed in one of the rooms of the south side" [S6][S7]); that is, the low
  barrack by the gate, not the long barrack on the east. **DISPUTED:** how — the Handbook says he had been shot several times in
  the head; Joe (Gray) that he fired through the door from his sick bed; other versions have him bayoneted or propped against the
  wall fighting with pistols and knife (TRADITION) [S4][S7]. Joe's word that the body was mutilated is not for the class.
- **Game now:** main — words: Concepción's spotlight "Ninety men under Bowie and Fannin" (`sim/directors.mjs:1053`), the army
  question for "Bowie and Fannin's division" (`sim/army.mjs:424,449,542`), the winter news (`:1212`), the Rumor Mill. Branches —
  named ground points and groups at Concepción (`concepcion.mjs:50-51,101` *(branch)*), "Bowie's horsemen" at the Grass Fight
  (`grass-fight.mjs:107` *(branch)*); at the Alamo two captions: "Bowie falls ill" (`alamo.mjs:251` *(branch)*) and "The long
  barrack is fought for room by room. Bowie is killed in his bed." (`:511` *(branch)*); "Bowie drawn" is listed not built
  (`docs/BATTLES.md` §8.7 *(branch)*).
- **Gap:** never drawn in any of his three engagements; the branch caption puts his death in the long barrack's fighting, where the
  sources put his room on the south side (question P7); no card, no name among the dead.

**David Crockett** (former congressman from Tennessee; a private in the Tennessee Mounted Volunteers). *Tier 1.*
- **Events:** left Tennessee November 1, 1835; at Nacogdoches by January 5 and San Augustine, where he took the oath of
  allegiance only once "republican" was written into it (DOCUMENTED [S8]); reached Béxar about February 8, 1836 with a small party
  (DOCUMENTED, `HIST-TEX-051`) [S1][S8]; the siege; the assault.
- **Where and what:** posted by Travis at "the low stockade in front of the church", "the most vulnerable point in the defensive
  line" (the Handbook [S8]; STRONGLY SUPPORTED) — the **palisade** between the church and the low barrack; reported during the
  siege "animating the men to do their duty" (a contemporary, quoted by the Handbook) [S8].
- **Words — DOCUMENTED (written):** his letter of January 9, 1836 from San Augustine to his daughter Margaret: "I am rejoiced at
  my fate. I had rather be in my present situation than to be elected to a seat in Congress for life" [S8]. **No words at the
  Alamo are documented**; everything he is made to say there is TRADITION or invention.
- **Death: DISPUTED** — the Handbook calls the question "a monstrous and unwieldy subcategory of Texana and Alamo writing" and
  its answer "almost impossible to determine" [S8].
  - **Killed fighting.** Joe (Gray's diary, March 20, 1836 — the earliest account): "Crockett and a few of his friends were found
    together, with twenty-four of the enemy dead around them" [S4][S8]. Susanna Dickinson (later statements, dated variously
    1874–1876): he was "one of the earliest to fall", and she saw him "lying dead … between the church and the two story barrack
    building", "his peculiar cap lying by his side" [S8][S9]. Ruiz (1860): "Toward the west in a small fort opposite the city we
    found the body of Colonel Crockett" — which fits neither of the others [S6].
  - **Captured and executed.** A letter from Galveston dated June 9, 1836 has Castrillón find six men alive, Crockett among them,
    and Santa Anna order them killed; George M. Dolson's letter of July 19, 1836 (printed in Detroit that September) translates a
    Mexican officer saying the same; Ramón Martínez Caro, Santa Anna's secretary, published in 1837 that prisoners were executed;
    José Enrique de la Peña's narrative names "the naturalist David Croket" among "some seven men" who survived and were killed on
    Santa Anna's order [S10]. The executions of several prisoners are well supported (`HIST-TEX-435`); whether Crockett was one is
    not.
  - **Why the de la Peña account is argued over.** It surfaced in print in 1955 (English, 1975); the Handbook says it mixes notes
    made at the time, later recollection, others' accounts and the Mexican press, and that de la Peña "did not claim that he
    actually witnessed Crockett's death" [S8][S10]. Dan Kilgore's *How Did Davy Die?* (1978) accepted the execution; Bill Groneman's
    *Defense of a Legend* (1994) argued the manuscript a twentieth-century forgery; James E. Crisp found an 1839 pamphlet in which de la
    Peña said he was preparing his diary for publication; paper tests in 1998 found period paper, and the manuscript is now at the
    Briscoe Center, University of Texas [S10]. Hardin (`docs/ALAMO_FATES.md` §2): "an overwhelming body of evidence" for execution.
  - **Not for the class:** the de la Peña narrative's description of torture, and "mutilated" in Dickinson's statement.
- **Game now:** one news line on main, "David Crockett of Tennessee has reached Béxar with a few volunteers"
  (`sim/directors.mjs:1213`), repeated by the Rumor Mill (`sim/rumour-story.mjs:33`), and street names in Liberty
  (`sim/town-layouts.mjs:242`). Not drawn, not labelled, **no death** on any branch.
- **Gap:** everything. §3.3 is the recommendation.

**James Butler Bonham** (lieutenant, Travis's courier). *Tier 2.*
- **Events:** came to Béxar with Bowie on January 19; sent out for aid about February 16; **rode back in on March 3** (about 11
  a.m.) (DOCUMENTED, `HIST-TEX-431`, `docs/ALAMO_FATES.md` §1) [S1][S11]; killed March 6.
- **What he brought:** a letter from R. M. Williamson "assuring Travis that help was on its way" (the Handbook, STRONGLY
  SUPPORTED); the Handbook says he is "wrongly remembered as bringing the news that Colonel Fannin was not coming" [S11].
- **Words:** none — the Handbook quotes nothing of his; any line given him is unsourced tradition.
- **Death:** March 6; "believed to have died manning one of the cannons in the interior of the Alamo chapel" (TRADITION) [S11].
- **Game now:** a caption on the Alamo branch, "About eleven in the morning James Bonham rides in through the gate: Fannin is not
  coming…" (`alamo.mjs:345-346` *(branch)*) — **the version the Handbook calls wrong**, stated as fact.
- **Gap:** the caption should say he brought Williamson's letter promising help; a labelled rider through the gate on March 3;
  among the church guns in the assault.

**Almeron (also spelled Almaron) Dickinson** (captain of artillery). *Tier 1 (a Gonzales man).*
- **Events:** one of the Gonzales Eighteen who refused the cannon (September 1835) (DOCUMENTED, `sim/town-scenes.mjs:383`,
  `HIST-TEX-460`–`-466` block); at Gonzales on October 2; at Béxar "distinguished himself as a lieutenant of artillery"; at the
  Alamo "captain in charge of artillery" (the Handbook [S12]); a partner of George Kimbell in a Gonzales hat shop [S38].
  Where his gun stood is not in the Handbook; the church's rear battery is the usual placing (`staging.md` §5.1; TRADITION).
- **Words:** **TRADITION** — Susanna's later statements have him come to her on the last morning, tell her "that all was lost",
  and hope she could save herself and the child [S12][S9].
- **Death:** March 6 (DOCUMENTED); at the guns, place as above.
- **Game now:** a name in the Eighteen card at Gonzales; nothing at the Alamo.
- **Gap:** not with the cannon at Gonzales; not at the church guns; not named among the dead.

**Susanna Wilkerson Dickinson and Angelina Dickinson** (his wife, about 22; their daughter, about 15 months). *Tier 1.*
- **Events:** Gonzales; into the Alamo on February 23 with Angelina (born December 14, 1834 [S13]); during the assault in the church
  — "some accounts say in the powder magazine, others in the church" (DISPUTED [S9]); saw Anthony Wolf and his two sons killed
  (`HIST-TEX-433`; not for the screen); taken to Ramón Músquiz's house and questioned by Santa Anna, given "a blanket and two dollars
  in silver", and sent east with Angelina, **Joe** and Ben (Almonte's servant) carrying Santa Anna's letter of warning dated March
  7; reached Houston at Gonzales "after dark about March 12" (the Handbook; the Deaf Smith entry has Smith sent out on the 13th to
  bring the party in — a small DISPUTE) (`HIST-TEX-060`, `-432`) [S9][S34].
- **Words:** her statements are **later testimony** (1870s interviews and an affidavit, dated differently by different sources),
  inconsistent in details — valuable, and to be labelled as such. **TRADITION:** the "Masonic apron" plea; Santa Anna offering to
  adopt Angelina; Travis tying his cat's-eye ring round Angelina's neck [S9][S13].
- **Game now:** "Mrs. Dickinson" as the source of the confirmed word (`sim/directors.mjs:1245`) and in the word of the fall
  (`sim/alamo.mjs:350`); a family's spared woman walks "as Mrs. Dickinson did" (`sim/alamo.mjs:284`). Not drawn anywhere; on the
  branch the sacristy caption is unnamed (`alamo.mjs:540` *(branch)*), and "Dickinson, Joe and Ben as travellers" is not built.
- **Gap:** the one survivor whose arrival *is* the news is never seen arriving. As a Tier 1 traveller she (with Angelina, Joe and
  Ben) walks the road to Gonzales and arrives at `fall-confirmed`.

**Joe** (a young man enslaved by Travis). *Tier 1; see §3.4.*
- **Events:** the siege at Travis's side; the assault — he "armed himself and followed Travis", fired, and after Travis fell
  "retreated into a building" and fired from it several times; after the fight officers called for any Black men, he came out,
  was shot ("only one buckshot took effect in his side") and scratched by a bayonet, and was "saved by Capt. Baragan"; was shown a
  review of the army; went east with Mrs. Dickinson; questioned by the cabinet at Groce's on March 20, 1836, where Gray noted "the
  modesty, candor, and clarity of his account"; returned to slavery; escaped April 21, 1837 with an unidentified Mexican man and two
  horses, a reward notice running in the *Telegraph and Texas Register* that summer; last reported in Austin in 1875 (DOCUMENTED,
  `HIST-TEX-434`, `-502` *(branch)*) [S4][S14].
- **Words — DOCUMENTED (his testimony, in Gray's record):** his account of Travis's words and death, of Crockett's and Bowie's
  bodies, and his own answer when the officers called, rendered on the branch as "Yes, here is one." (`alamo.mjs:549` *(branch)*;
  the wording to be checked against Gray) [S4]. Other 1836 versions differ in details (DISPUTED).
- **Game now:** main — two strings (§5). Alamo branch — a labelled figure hiding in the west range and coming out, using his own
  sprite sheet (`joe-hide`, `joe-emerge`), with the officers' call reconstructed in English and glossed (`alamo.mjs:523-549`
  *(branch)*). That is correct as far as it goes.
- **Gap:** the two texts; his walk to Gonzales; his card.

**José María "Gregorio" Esparza and his family** (a Tejano who served in Seguín's company; his wife Ana Salazar de Esparza;
Enrique, born 1828 and so about seven; Manuel, Francisco and a daughter). *Tier 2.*
- **Events:** fought at Béxar, December 5–9, 1835, in Seguín's company (STRONGLY SUPPORTED); on John W. Smith's advice took his
  family into the Alamo on February 23, "through a small window in the church"; "tended a cannon during the siege" — where is not
  known (the chapel gun is Enrique's TRADITION); killed March 6; the family spared (DOCUMENTED that they were spared,
  `HIST-TEX-432`) [S15].
- **After:** his brother Francisco, formerly of the presidial company, obtained leave to take the body and buried it in the Campo
  Santo west of San Pedro Creek — the only defender given Christian burial (STRONGLY SUPPORTED) [S15]. Enrique's own accounts are
  newspaper interviews of 1902, 1904 and 1907 — late testimony from a man who was seven, with confusions the Handbook notes; to be
  labelled so. Enrique's 1902 memory of his mother saying "Gregorio, the soldiers have jumped the wall" is TRADITION.
- **Game now:** a comment only (`sim/alamo.mjs:61,64`).
- **Gap:** the Tejano defenders are absent from the drawn Alamo; Esparza is the documented case to draw.

**Juan Nepomuceno Seguín** (captain; later lieutenant colonel). *Tier 1.*
- **Events:** the siege of Béxar (October–December 1835) with his militia company, fighting on December 5; in the Alamo from
  February 23; sent out as a courier with Antonio Cruz y Arocha (`HIST-TEX-431` gives about 9 p.m. February 25; some accounts
  say the 23rd — DISPUTED; riding Bowie's horse is family TRADITION); led the rear guard in the retreat; his company was "the only
  Tejano unit" at San Jacinto, fighting alongside Sherman's regiment (STRONGLY SUPPORTED) [S16].
- **Words:** his *Personal Memoirs* (1858) — memoir, not 1836. After the window: the burial of the defenders' ashes, February 25,
  1837, his own account printed in the *Telegraph and Texas Register* on March 28, 1837 (DOCUMENTED; the speech's wording not
  checked here) [S16].
- **Game now:** the runner's line "Captain Seguín is going out tonight to bring help" (`sim/alamo-runner.mjs:104`) and a caption
  (`alamo.mjs:286` *(branch)*).
- **Gap:** a labelled rider out of the gate on February 25; his company at Béxar and at San Jacinto.

**The Gonzales relief: George C. Kimbell, Albert Martin, John W. Smith.** *Tier 2.*
- **Events:** about twenty-five men left Gonzales at 2 p.m. February 27 under Martin and Kimbell (guided by Smith, per `docs/ALAMO_FATES.md`); thirty-two got in
  about 3 a.m. March 1; all were killed March 6 (DOCUMENTED, `HIST-TEX-057`, `-438`). Martin had carried Travis's letter of the
  24th out and added in his own hand "Hurry on all the men you can in haste" (DOCUMENTED [S3][S38]). Kimbell was lieutenant commanding
  the Gonzales Ranging Company [S38]. Smith drew the plat of Béxar that made the house-to-house attack possible, met the truce in
  December (`bexar-storming.mjs:512`), and was "the final messenger to the Convention" on March 3, and lived (DOCUMENTED,
  `HIST-TEX-431`) [S38]; that he guided the relief in is in `docs/ALAMO_FATES.md` but **not confirmed by his Handbook entry**
  (to check).
- **Game now:** "with Kimbell and Martin's company" (`sim/alamo.mjs:228`); a nameless group "The Gonzales men" (`alamo.mjs:322`
  *(branch)*); J. W. Smith at Béxar's parley (main).
- **Gap:** Kimbell and Martin labelled at the head of the relief, and Smith as its guide and the last courier out.

#### Béxar, October–December 1835

**Benjamin Rush Milam.** *Tier 1 (one engagement, but its turning point).*
- **Events:** the siege; the call of December 4; led the first division in on December 5; killed December 7 (DOCUMENTED,
  `HIST-TEX-037`, `-039`).
- **Words: TRADITION** — "Who will go with old Ben Milam into San Antonio?" (`HIST-TEX-492`; the Handbook's Milam entry states it
  as fact, its siege entry gives no words — the call is STRONGLY SUPPORTED, the wording TRADITION) [S32].
- **Death:** about 3:30 p.m. December 7, "shot in the head by a sniper and died instantly" (the Handbook [S32]); passing into the
  yard of the Veramendi house, which Johnson's division held (DOCUMENTED from Johnson's report of December 11, `HIST-TEX-039`; the
  hour and which yard DISPUTED; **neither Handbook entry names the Veramendi house**, so the place rests on Johnson and the other
  primary accounts read in `bexar-storming.md` §4.2).
- **Game now:** the call as a tradition line on an anonymous figure (`bexar-storming.mjs:173`); the named fall at the yard
  (`:395`); spotlight, journal and account (`sim/bexar-fight.mjs:242,266`; `sim/directors.mjs:1156`). **The one famous death the
  game gets right.**
- **Gap:** he should be a labelled figure from the call (so the call is his) through the two days in the Veramendi house to the
  yard.

**Stephen F. Austin.** *Tier 1.*
- **Events:** home from prison in Mexico at the end of August 1835; spoke at Brazoria on September 8; elected commander of the
  volunteer army at Gonzales, October 11, 1835; led it to Béxar; named commissioner to the United States in November and left the
  army November 24–25 (DOCUMENTED, `HIST-TEX-014`–`-034` block) [S17].
- **Words — DOCUMENTED (written):** his Brazoria speech of September 8 and his orders and letters from the camp. The often-quoted
  "War is our only recourse" (September 1835) was **not verified** in this research [S17] — check before use.
- **Death:** December 27, 1836 — outside the window.
- **Game now:** journal lines and army questions (`sim/directors.mjs:1010,1085-1100`; `sim/army.mjs:608`), "Austin's
  headquarters" at San Felipe (`sim/town-layouts.mjs:67`). Never drawn.
- **Gap:** the army a family's man joins in October has no commander in it.

**Edward Burleson.** *Tier 1.*
- **Events:** the siege; the Grass Fight; commander of the army from November 24 (after Austin); held the reserve at the mill
  during the storming; accepted Cos's surrender, letting "Cos and his men … retire southward"; at San Jacinto commanded the First
  Regiment in the centre, and **accepted Almonte's surrender and his sword** (DOCUMENTED / STRONGLY SUPPORTED, `HIST-TEX-035`–`-044`,
  `-522`) [S18].
- **Words:** his report of December 14 to Governor Smith (DOCUMENTED, written).
- **Game now:** "Burleson's reserve at the mill" (`bexar-storming.mjs:113`); the parley caption says he rides in (`:522`) but he
  is not in the parley's people; San Jacinto's regiments walk as one block (`san-jacinto.mjs:96-97`).
- **Gap:** at the parley as a figure; at the head of his regiment.

**Francis White (Frank) Johnson.** *Tier 2.*
- **Events:** second division at Béxar; command after Milam's death (7 p.m. December 7); the Matamoros expedition; surprised at San
  Patricio February 27, 1836, escaped with four men (DOCUMENTED, `HIST-TEX-039`, `-059`, `-510`–`-514`) [S19].
- **Words:** his report of December 11, 1835 (DOCUMENTED, written); his 1880s *Texas and Texans* (memoir). **Not to be used:**
  "Powder is as cheap as provisions…" (`staging.md` §3.4).
- **Game now:** named divisions, parts, captions; his escape drawn as a nameless part routing (`san-patricio.mjs:150`).
- **Gap:** a labelled figure taking command, and the back door.

**Henry Wax Karnes.** *Tier 2.* Distinguished at Concepción, where he was the first fired on in the fog (the branch's research), and
at Béxar, where he forced a door with a crowbar and York's company followed (DOCUMENTED from the primary accounts in
`bexar-storming.md`, `HIST-TEX-038`; **the crowbar is not in his Handbook entry** [S33]); sent out from Gonzales in March with Deaf
Smith and R. E. Handy, and "the first to return" with word that the Alamo had fallen; at San Jacinto second in command of Lamar's
cavalry, leading the pursuit [S33]. **Words:** none — "Follow Karnes!" is rightly reconstructed and said by others
(`bexar-storming.mjs:358`). **Game now:** caption, breach point, group name. **Gap:** a labelled man with a crowbar at the breach.

**Erastus "Deaf" Smith.** *Tier 2.* Found the pack train before the Grass Fight; guided Johnson's men into Béxar and was wounded
there December 8 (the Handbook [S34]; the sentinel of December 5 is in a comment only, `bexar-storming.mjs:221`); brought in the
Dickinsons in March; captured the courier whose dispatches placed Santa Anna; destroyed Vince's bridge on April 21 on Houston's
order (DOCUMENTED, `HIST-TEX-153`, `-523`; whose idea it was is DISPUTED — Houston later claimed it, others credited Smith) [S34].
Travis called him "the Bravest of the Brave" (written, quoted by the Handbook). **Words: TRADITION** — "Vince's bridge is down!"
(later memoir; `staging.md` §8.4). **Game now:** "Deaf Smith's party" riding out of frame; spotlight on the bridge. **Gap:** labelled
at the head of the party; bringing Mrs. Dickinson in.

**Martín Perfecto de Cos** (general, commanding in Béxar). *Tier 1.*
- **Events:** held Béxar October–December 1835; asked terms December 9 and capitulated December 11, marching out December
  14 on parole not to oppose the Constitution of 1824 (DOCUMENTED, `HIST-TEX-040`–`-044`, `-491`, `-496`); led a column at the
  Alamo, March 6, which Texans held broke his parole (STRONGLY SUPPORTED, `HIST-TEX-500` *(branch)*); reinforced Santa Anna at San
  Jacinto with about 540 men on the morning of April 21, "just before the Texans destroyed" Vince's bridge (DOCUMENTED,
  `HIST-TEX-523`); taken prisoner April 24 (Houston's report of the 25th: "Gen. Cos yesterday") [S20][S25].
- **Words:** none documented for any scene here. His December 1835 capitulation is a signed document.
- **Game now:** a name on groups and captions in three engagements ("Cos's garrison", "Cos's column" *(branch)*, "Cos's men").
- **Gap:** the same man three times, never drawn. The parole broken is a teaching point the card can make (the Handbook frames it
  so).

**Domingo de Ugartechea.** *Tier 2.* Military commandant at Béxar who sent Castañeda for the cannon (DOCUMENTED,
`HIST-TEX-462`–`-463`); led about 275 infantry at Concepción; broke out of Béxar on November 12 for reinforcements and came back
December 8 with 627 (DOCUMENTED) [S37]. His own written complaint of the colonists, "Nothing is heard but God damn St. Anna. God damn
Ugartechea" (quoted by the Handbook), is for his card, not a bubble. **Game now:** "Ugartechea's reinforcement" group; the camp's
cry at the Grass Fight *(branch)*. **Gap:** a labelled officer at Concepción and at the head of the reinforcement.

**Condelle and Sánchez Navarro** (Béxar). Already right: Condelle's reported words (`bexar-storming.mjs:489`, documented) and
Sánchez Navarro at the parley (`:517,527`). Tier 2 as built.

#### Gonzales, September 29 – October 2, 1835

**John Henry Moore** (elected colonel October 1). *Tier 1 for Gonzales.* Commanded the Texians on October 2 (DOCUMENTED [S35]);
"is said to have designed the 'Come and Take It' banner" (TRADITION [S35]). Documented words at the parley in paraphrase
(`HIST-TEX-474`; `gonzales.mjs:192`, and two unnamed `commander` lines at `:189-190` that the sources give to the Texian side,
correctly left unnamed where the source does not say it was Moore). **Game now:** a labelled figure for the 40-minute parley only;
"Moore's men" in the town's talk (`town-scenes.mjs:282,294`). **Gap:** he should lead the column from the rendezvous.

**Francisco de Castañeda** (lieutenant, dragoons). *Tier 1 for Gonzales.* Sent for the cannon "under orders not to precipitate a
major conflict"; withdrew after losing two men (the Handbook [S36]; his own report says one hit — `HIST-TEX-477`, DISPUTED). Documented
words in his own report (`gonzales.mjs:188`) and in paraphrase (`:191`). **Game now:** the side's name and the parley figure
(mounted). **Gap:** he is at his camp on the west bank from September 29 (`sim/town-scenes.mjs` draws the camp) and should be a
figure there and at the rise.

**W. P. Smith, Launcelot Smither, Joseph D. Clements.** Named with documented words (`gonzales.mjs:102-103,186`;
`town-scenes.mjs:80,245`). **Gap:** Smith's sermon and Smither's cry come from anonymous figures (§1.2 row 3).

#### The south, and Goliad

**James Grant.** *Tier 2.* One of the colonels at Béxar, badly wounded on the first day; with Johnson the maker of the Matamoros
expedition; led the party ridden down at Agua Dulce Creek on March 2, 1836 (DOCUMENTED, `HIST-TEX-059`, `-511`) [S21]. The Handbook:
"Accounts of Grant's death vary in detail but agree that after being pursued for some miles he surrendered and had dismounted only
to be immediately stabbed in the back by a Mexican lancer" (core STRONGLY SUPPORTED, details DISPUTED) [S21] — a man killed after
giving up, so under §3.2 rule 3 **not drawn**. **Game now:** caption "Grant is dead, cut down after he was surrounded"
(`agua-dulce.mjs:140`). **Gap:** a labelled figure in the chase, lost from sight at its end; the caption should say he was killed
after he surrendered.

**José de Urrea** (general). *Tier 2.* Took San Patricio (February 27), Agua Dulce (March 2), Refugio, and caught Fannin at Coleto
(March 19–20) (DOCUMENTED, `HIST-TEX-059`, `-062`, `-063`); told Portilla to "treat the prisoners with consideration" before Santa
Anna's order to kill them was carried out (the Goliad Massacre entry, STRONGLY SUPPORTED) [S22][S23]. His *Diario* (1838) is his own
later account (not opened). **Game now:** side names. **Gap:** a labelled commander at Coleto.

**James Walker Fannin Jr.** (colonel). *Tier 1.*
- **Events:** Concepción with Bowie (October 28, 1835); acting commander-in-chief February 12 – March 12, 1836; commander at Goliad;
  set out to relieve the Alamo February 26 and turned back (`HIST-TEX-056`); Coleto, March 19–20, wounded, surrendered on written
  terms that left the men "subject to the disposition of the supreme government" while they believed themselves prisoners of war
  (DISPUTED; the Handbook: he accepted Urrea's terms "without fully informing his men") (DOCUMENTED, `HIST-TEX-063`); executed at
  Goliad March 27, after his men, "shot separately" inside the presidio (DOCUMENTED, `HIST-TEX-064`) [S23].
- **Words — DOCUMENTED (written):** his letters from Goliad (February–March 1836; not opened here). **Last requests:** Joseph H.
  Spohn, spared as an interpreter, told in a newspaper account of summer 1836 that Fannin gave his gold watch to have himself buried
  and asked that the muskets not be held so near as to scorch his face, and that the bodies were partly burned (DOCUMENTED as
  Spohn's testimony) [S23]; the familiar three requests — his things to his family, shot in the heart not the face, Christian
  burial, all refused — are a later synthesis (Hardin, *Texian Iliad*, 1994, via Wikipedia) and TRADITION in that form. No evidence
  was found that Herman Ehrenberg reported them. `sim/fannin.mjs:464` *(branch)* already says "It was said afterward that…" —
  correct in kind; it should name Spohn.
- **Game now:** main — names in text; branch — named side "Fannin's command"; the Goliad caption "Colonel Fannin, wounded at Coleto,
  is shot in the courtyard" over an unnamed fall of four (`goliad-massacre.mjs:200-202` *(branch)*).
- **Gap:** never drawn at Concepción or Coleto; his execution should stay told, not drawn (§3.2 rule 3), but he should be seen
  wounded in the square and among the wounded kept in the presidio.

**Albert Clinton Horton.** *Tier 2.* His Matagorda horsemen scouted ahead on March 19, were cut off, "and fled, an action that saved
his life but haunted his later political career" (DOCUMENTED, `HIST-TEX-063`) [S42]. **Game now:** "Horton's horsemen" *(branch)*.
**Gap:** the group labelled with him at its head.

**Francita Alavez** ("the Angel of Goliad"; also Francisca, Panchita). *Tier 2.* Came with Captain Telesforo Alavez; at Copano had
the prisoners' bonds loosened and food given them; at Goliad "brought out several men and hid them" (STRONGLY SUPPORTED by the
spared doctors Barnard and Shackelford, `HIST-TEX-064`) [S24]. **Game now:** a named, wordless figure on the Coleto branch (`goliad-massacre.mjs:141`
*(branch)*). **Right as built**; add her card.

#### San Jacinto, April 20–22, 1836

**Sam Houston** (commander-in-chief). *Tier 1.*
- **Events:** at Gonzales March 11 (held the two riders as spies; learned the truth from Mrs. Dickinson; burned the town March 13);
  the retreat; Groce's; the Yellow Stone; San Jacinto: paraded the army at 3:30, rode with the line; **his horse Saracen was shot
  under him and he was wounded "just above his ankle", the ankle shattered by a musket ball** (STRONGLY SUPPORTED); tried with Rusk
  to stop the killing; received Santa Anna April 22 lying wounded (DOCUMENTED, `HIST-TEX-060`, `-066`, `-089`, `-522`, `-523`,
  `-526`) [S25].
- **Words — DOCUMENTED (written):** his report of April 25, 1836 to President Burnet (`HIST-TEX-522`): "Remember the Alamo" as the
  line's war cry, "about eighteen minutes from the time of close action", "Gen. Santa Anna was not taken until the 22d, and Gen.
  Cos yesterday" [S25]. **TRADITION:** "Hold your fire! God damn you, hold your fire!" and other shouts from later memoirs
  (`staging.md` §8.4); his reply to Santa Anna, "You should have remembered that at the Alamo" (Crane, 1884) [S26]. He is rightly
  given no spoken line.
- **Game now:** "Houston's army" markers and names in text everywhere; a labelled parley figure, injured, at the capture
  (`san-jacinto.mjs:368`); his wound only in the `killing` caption.
- **Gap:** absent from the attack he led; his wound is a pose the next day, not a moment.

**Antonio López de Santa Anna** (president-general). *Tier 1.*
- **Events:** crossed the Rio Grande about February 16; reached Béxar February 23 and raised the red flag (`HIST-TEX-053`, `-054`);
  ordered the assault and watched it with the reserve north of the fort; ordered the prisoners executed (`HIST-TEX-435`); ordered
  the Goliad executions of "perfidious foreigners" [S23]; Harrisburg; San Jacinto, fled in the rout; **found in the grass on April
  22 by Lt. J. A. Sylvester's party, "dressed as a common soldier", and not recognised "until he was addressed as 'el presidente' by
  other Mexican prisoners"** (the Handbook; STRONGLY SUPPORTED); brought before Houston, Almonte interpreting; ordered Filisola to
  fall back (DOCUMENTED / STRONGLY SUPPORTED, `HIST-TEX-067`, `-523`, `-526`) [S25][S26].
- **Words — DOCUMENTED (written):** his orders of March 5 for the assault; his report of March 6 (70 killed and 300 wounded of his
  own; 600 Texans claimed — both figures far from other estimates [S1]); his letter to Filisola of April 22 (`HIST-TEX-526`). **TRADITION:** his words to
  Houston — "I am General Antonio Lopez de Santa Anna, President of the Mexican Republic, and I claim to be your prisoner of war" and
  "That man may consider himself born to no common destiny who has conquered the Napoleon of the West" — as W. C. Crane printed them
  in 1884 [S26]. The game rightly gives him no spoken words.
- **Game now:** "Santa Anna's column" marker (`sim/road.mjs:112`); named sides and "The reserve, with Santa Anna" *(branch)*; the
  parley figure at the capture.
- **Gap:** not at Béxar in February, not seen at the Alamo, not seen in the rout; one man across two months, drawn once.

**Manuel Fernández Castrillón** (general). *Tier 2.* Opposed an immediate assault on the Alamo, then took command of Duque's column
when Duque was hit, a column "credited as the first to reach the fortress walls" (STRONGLY SUPPORTED, `HIST-TEX-500` *(branch)*);
interceded for captives who "may have included David Crockett" (DISPUTED); protested the Goliad executions [S27]. **Killed at San
Jacinto:** by Rusk's report as the Handbook gives it, he tried to rally his men "standing fully exposed to enemy fire on an ammunition
crate", then "slowly turned and walked away from the oncoming Texans. He was shot" (STRONGLY SUPPORTED); Lorenzo de Zavala buried
him. Words later put in his mouth about refusing to run, and Rusk knocking up the rifles aimed at him, are TRADITION and were not
verified [S27]. **Game now:** absent. **Gap:** a labelled officer on the crate at the breastwork, then walking away and falling; no
words.

**Juan Nepomuceno Almonte** (colonel, Santa Anna's aide). *Tier 2.* Author of the 1834 inspection of Texas and of a journal kept
February 1 – April 16, 1836 (DOCUMENTED, published) [S28]; at San Jacinto surrendered to Burleson with the organised remnant on
the evening of April 21, and interpreted when Santa Anna was brought to Houston (STRONGLY SUPPORTED) [S18][S26]. **Game now:**
absent (his journal is cited in `HISTORY.md`). **Gap:** the surrender at dusk in the `prisoners` phase.

**Vicente Filisola** (general, second in command). *Tier 3.* Not at San Jacinto; received Santa Anna's order and led the retreat;
later called "a coward and a traitor", court-martialled and cleared in 1841 (DOCUMENTED, `HIST-TEX-526`) [S40]. **Game now:**
caption (`san-jacinto.mjs:379`). **Right.**

**Mirabeau B. Lamar.** *Tier 2.* Joined as a private; on April 20, when Rusk and Walter P. Lane "were surrounded by the enemy. Lamar's
quick action … saved their lives and brought him a salute from the Mexican lines"; on the 21st "verbally commissioned a colonel and
assigned to command the cavalry", the sixty-one on the right (STRONGLY SUPPORTED, `HIST-TEX-522`) [S29]. **Game now:** "Lamar's
horsemen". **Gap:** labelled at their head; the rescue in the skirmish (no words).

**Sidney Sherman.** *Tier 2.* His Kentucky volunteers brought "the only flag" the Texans had at San Jacinto; led the cavalry
skirmish of April 20 and the Second Regiment on the left, which "opened the attack" (DOCUMENTED / STRONGLY SUPPORTED,
`HIST-TEX-522`, `-523`); "has been credited with" first raising "Remember the Alamo!" (TRADITION/DISPUTED) [S30]. **Game now:**
"Sherman's horsemen". **Gap:** labelled; the cry stays with the many (as built), with the Sherman tradition on his card; the flag.

**Thomas J. Rusk** (secretary of war). *Tier 2.* At Gonzales in 1835 (a source for the parley); signed the Declaration; carried
Burnet's orders to Houston to make a stand; fought at San Jacinto; tried with Houston to stop the killing (STRONGLY SUPPORTED,
`HIST-TEX-524`); commander-in-chief from May 4, and buried the Goliad dead with honours on June 3 [S41]. **Gap:** a figure beside
Houston in `killing`, no words.

**James C. Neill.** *Tier 2.* Reportedly "fired the first gun" at Gonzales (TRADITION); his artillery at Béxar; took the gun across
the river on December 5 (`bexar-storming.mjs:204-235`); commandant at Béxar until mid-February, when he left for his family's
illness, promising to return in twenty days; at San Jacinto commanded the Twin Sisters in the April 20 skirmish, where "a fragment
of grapeshot caught him in the hip" (STRONGLY SUPPORTED) [S31] — see §5 item 5.

**Green B. Jameson.** *Tier 3.* Neill's chief engineer at the Alamo, whose letters to Houston described the defences; Bowie's
messenger to the Mexicans on February 23; killed March 6 (STRONGLY SUPPORTED) [S39].

**Francisco Antonio Ruiz** (alcalde of Béxar). *Tier 3, as a source.* Identified the bodies of Travis, Bowie and Crockett for Santa
Anna and saw the dead burned; his statement was printed in the *Texas Almanac* for 1860 — an eyewitness, 24 years later
(STRONGLY SUPPORTED for the burning; his body places conflict with others) [S6].

**José Enrique de la Peña.** *Tier 3, as a source.* Aide to Col. Francisco Duque in the assault; his narrative is the principal
execution account of Crockett and is itself disputed (see Crockett) [S10].

---

## 3. Recommendations

### 3.1 Three tiers

**Tier 1 — persistent, labelled historical figures** (a roster entry with an itinerary, §4.1): present, named and in the right
place through every event of the window they were at, speaking only documented or tradition words, dying (or being captured,
or leaving) at the recorded moment and place, clickable everywhere they are drawn.

| Person | Through | Why persistent |
| --- | --- | --- |
| William B. Travis | Béxar from Feb 3 → the siege → the north battery, Mar 6 | the owner named him; commands the siege a family's man lives through |
| James Bowie | Concepción → the Grass Fight → Béxar from Jan 19 → his sickroom, Mar 6 | the owner named him; three engagements |
| David Crockett | Béxar from about Feb 8 → the palisade → Mar 6 (disputed death, §3.3) | the owner named him |
| Susanna and Angelina Dickinson | Gonzales → the Alamo → Músquiz's house → Gonzales, about Mar 12–13 | she is the word of the fall, arriving in person (`HIST-TEX-060`) |
| Almeron Dickinson | Gonzales (the Eighteen, the cannon) → Béxar → the church guns, Mar 6 | a Gonzales man the class meets on the first day |
| Joe | the Alamo → Músquiz's house → Gonzales with Mrs. Dickinson | survivor and witness; §3.4 governs how |
| Juan N. Seguín | Béxar siege (Oct–Dec) → the Alamo, out as courier Feb 25 → San Jacinto | the Tejano side of the revolution, in three places |
| Ben Milam | Béxar camp → the call, Dec 4 → the Veramendi yard, Dec 7 | already the one named death on main |
| Stephen F. Austin | commander of the volunteer army, Oct 11 – Nov 24, 1835 | the army a family's man joins in October |
| Edward Burleson | Austin's successor → Béxar's capitulation → San Jacinto's First Regiment | commands through two campaigns |
| Martín Perfecto de Cos | Béxar, Oct–Dec (capitulates) → the Alamo's north-west column → San Jacinto (captured) | the same general three times, on parole and back |
| Antonio López de Santa Anna | the Rio Grande → Béxar, Feb 23 → the Alamo → Harrisburg → San Jacinto → taken Apr 22 | the enemy commander the class hears of for two months |
| Sam Houston | Gonzales, Mar 11 → the retreat → Groce's → San Jacinto (wounded) | commands the army a family's man serves in all spring |
| James W. Fannin | Concepción → Goliad → Coleto → executed at Goliad, Mar 27 | two engagements and the massacre |
| John H. Moore and Francisco de Castañeda | Gonzales, Sept 29 – Oct 2 | the first fight; the parley is already drawn |

**Tier 2 — named figures inside one engagement** (a `people` entry for that battle, drawn and labelled for the phases the
record puts them in, no persistence beyond it): James Bonham (the Alamo, Mar 3–6), Gregorio Esparza and his family (the
Alamo), George Kimbell, Albert Martin and John W. Smith (the relief of Mar 1; Smith also Béxar's truce), Henry Karnes (Béxar's
crowbar; first fired on at Concepción), F. W. Johnson (Béxar after Dec 7; San Patricio's back door), James Grant (Agua Dulce), Deaf
Smith (Béxar, wounded Dec 8; Vince's bridge), Domingo de Ugartechea (Béxar, Dec 8), José Urrea (San Patricio, Agua Dulce, Coleto),
Manuel Fernández Castrillón (the Alamo; San Jacinto), Juan N. Almonte (the Alamo; his surrender at San Jacinto), Albert C.
Horton (Coleto), Francita Alavez (Goliad; already a named figure on the branch), Mirabeau B. Lamar and Sidney Sherman (San
Jacinto), Thomas J. Rusk (San Jacinto), James C. Neill (Béxar's gun), Condelle and Sánchez Navarro (Béxar; already named),
W. P. Smith, Launcelot Smither and Joseph D. Clements (Gonzales; already named).

**Tier 3 — named in words only** (captions, cards, accounts): Vicente Filisola (never on a field in the window), José Enrique de
la Peña and Francisco Ruiz (sources, not actors — named on the cards that quote them), Louis "Moses" Rose and W. P. Zuber (named
only where the line in the sand is called a doubted story), Green B. Jameson, Reuben Brown, Richard Andrews, Padre de la
Garza, Carolino Huerta, José Nicolás de la Portilla.

### 3.2 The rules for a famous figure (each is a check the engine can make)

1. **Documented or tradition words only, never reconstructed** (`FIC-GONZ-447`; §1.3). A tradition line carries a gloss saying
   so ("as told years later") and the dashed edge. No invented taunt, prayer, oath or last word, ever. Words from a letter are
   shown as **what he wrote**, in the caption or the card, not in a bubble — a bubble is for speech.
2. **His place is the record's place**, with a claim; where the place is disputed (Bowie's room, Crockett's post) the figure
   stands at the place the stronger sources give, labelled on his card as disputed.
3. **His death is drawn at its minute and place with no gore** (`VISION.md` §16): the figure goes down and lies still, as
   Milam's does. **No named man killed after he was taken is drawn dying** (the Alamo's prisoners, Grant, Fannin): as on the Alamo branch
   (`alamo.mjs:537-538` *(branch)*) the executions are told, and the owner's §2b.2 (the massacre drawn like a battle) applies to
   the prisoners as a body, not to a named man's execution. Where the manner is disputed only the undisputed part is drawn — Bowie lies still on his cot; Crockett is not drawn
   dying at all (§3.3).
4. **His fate is never projected before its minute**, and **what a family is told of it waits for the word** (`HIST-TEX-439`).
   Watching is the viewer's own sight; the card's "what happened to him" section opens for a household only when that
   household has the knowledge topic that tells it.
5. **A family's person never takes his place** (`docs/ALAMO_FATES.md` §4), and no historical person's fate depends on a family.
6. **The label is his name as the record gives it** ("Travis", "Bowie", "Crockett", "Mrs. Dickinson", "Joe", "Seguín",
   "Santa Anna", "Houston"), with rank on the card, not the map.

### 3.3 Crockett's death, and every disputed death, in a classroom

The owner asked for the famous to die "the way they should". For Crockett the honest answer is that nobody knows which way that
was, and a middle-school class can learn exactly that. Recommended (question P1 a):

- **Before and during the assault** Crockett is a labelled figure at the **palisade between the church and the low barrack**,
  firing, with his Tennesseans as a group (the post is STRONGLY SUPPORTED: the Handbook, "the low stockade in front of the church";
  §2.2). He speaks no line: no documented words of his at the Alamo are known.
- **When the palisade is carried** (the `north-wall`/`fallback` phases) he is **lost from sight in the smoke**, as the family's
  own man is when a wall is carried (`staging.md` §5.5, A3): he is not drawn falling, not drawn captured, not drawn executed.
- **In the `end` phase a caption says**: *"How David Crockett died is not known for certain. Tap his name to read the two
  accounts."* His card then shows **both**, side by side, each labelled with who told it and when:
  - **Killed fighting.** Joe, two weeks later, said Crockett and a few friends were found together with many dead Mexican soldiers
    around them. Susanna Dickinson, years later, said he was one of the first to fall and that she saw his body between the church
    and the barracks. The town's alcalde, Francisco Ruiz, wrote in 1860 that the body lay on the west side. (Testimony; the three
    do not agree on the place.)
  - **Taken alive and killed on Santa Anna's order.** Letters written in 1836 from what Mexican officers said, and the account of
    a Mexican officer, José Enrique de la Peña, say that a few defenders, Crockett among them, were found alive after the fighting
    and were killed on Santa Anna's order although General Castrillón asked for their lives. (That some prisoners were killed is
    well supported, `HIST-TEX-435`; whether Crockett was one is disputed.)
  - **Why historians disagree:** de la Peña's account was not printed until 1955; some historians have called it a forgery,
    others have shown it was written in his time; the Handbook of Texas calls Crockett's death "almost impossible to determine".
- **In the account** a family receives at the word, the same sentence: the manner of Crockett's death is disputed.

Bowie is handled the same way in miniature: he is drawn **lying ill on his cot** in his room on the south side from February 24
(STRONGLY SUPPORTED, §2.2), and when the low barrack is carried soldiers are seen at its door and **the figure lies still**, with no
struggle drawn; the versions of how he died (shot, bayoneted, firing from his bed) are on his card as disputed.

Grant (killed at Agua Dulce after he surrendered) and Fannin (executed at Goliad) are **never drawn dying**, because both were
killed as prisoners (§3.2 rule 3): each is last seen alive — Grant riding away with the lancers after him, Fannin wounded among the
men kept in the presidio — and the caption and card tell the rest.

### 3.4 Joe

`docs/MILITARY_EXPERIENCE.md` "Survivors and Joe" and `HIST-TEX-434` govern. Recommended (P3 a): **Joe is named on the map, as he
is on the Alamo branch**, because hiding his name would erase the one man whose testimony gives the class Travis's death; he is
named with his humanity intact and his situation stated plainly on his card: *"Joe, a man enslaved by William B. Travis. He fought
in the defense, survived, and told what he saw to the Texas cabinet on March 20, 1836. He was returned to slavery, and escaped
in April 1837."* He is never a mechanic, never a disguise, never a survival bonus, and a family's person never stands in his
place. After the fall he is a Tier 1 traveller with Mrs. Dickinson to Gonzales (`BATTLES.md` §8.7 *(branch)* lists "Dickinson,
Joe and Ben as travellers" as not built). **Two texts must be fixed** (§5): the word of the fall and the rumour mill say "every
man in it was killed" and "Travis's servant Joe" (`sim/alamo.mjs:350`, `sim/rumour-story.mjs:40`), and the branch account says
"Every man who fought was killed … and Joe … were spared" (`sim/alamo.mjs:360` *(branch)*) — Joe fought and lived.

### 3.5 Clicking a famous person: the "who was" card

Recommended (P2 a): **every drawn famous figure can be tapped**, on the map and in a battle, by the student and the Host. The card
has four parts, each a short paragraph a middle-schooler can read:

1. **Who** — name, what he or she was in 1835–36 (one sentence), portrait (stand-in until art lands, §4.4).
2. **Here** — what this person is doing at this place and moment (from the itinerary entry now in force).
3. **What is known** — DOCUMENTED and STRONGLY SUPPORTED facts, with the source named in plain words ("in his letter of
   February 24"; "Joe told the cabinet").
4. **What is disputed or told later** — each TRADITION and DISPUTED item, saying who told it and when ("a story first printed
   in 1873 says…; historians doubt it").

A fifth part, **What became of him**, is shown only once the viewer's household knows it (the knowledge topic the word
delivers); the Host sees it at once. The card is the same component as the family panel's person card, fed by a new
projection (`peopleProjection(world, viewer)`), so it inherits the server's knowledge filter rather than trusting the page.

### 3.6 Per engagement: what should change

| Engagement | Add or change | Keep |
| --- | --- | --- |
| **Gonzales** (main) | Moore and Castañeda as Tier 1 figures from their arrival (Castañeda on the west bank from Sep 29; Moore elected Oct 1) to the parley and the withdrawal; W. P. Smith drawn at the rendezvous as a Tier 2 figure so his documented lines come from him; Smither named on his ride in; Almeron Dickinson near the cannon (who served it is DISPUTED — Neill per Highsmith, Dickinson per Taylor, `HIST-TEX-475` — so he is drawn with the men, not labelled as its gunner) | the parley, its documented lines, the taunts in no named mouth |
| **Concepción** *(branch)* | Bowie and Fannin as figures with their companies (`bowie`, `fannin` points exist, `concepcion.mjs:50-51` *(branch)*); Karnes named where he is first fired on; Andrews's fall named (he is named in the caption already) | no words for any of them |
| **Grass Fight** *(branch)* | Bowie at the head of the horsemen; Burleson, the army's commander, coming up; Deaf Smith riding in with word of the pack train | "Ugartechea!" as the camp's cry |
| **Béxar** (main) | Milam drawn from the call to his fall; Johnson taking command at 7 p.m. Dec 7; Karnes at the door with the crowbar (no words); Cos at the Alamo end and marching out; Burleson riding in to the parley; Deaf Smith guiding Johnson's men in (wounded December 8); Seguín's company | Milam's call as tradition; the named fall; Condelle's reported words |
| **San Patricio / Agua Dulce** (main) | Johnson seen going out the back door (the `back-door` part already routs to `escape`); Grant as a labelled rider in the chase, lost from sight at its end (he was killed after he surrendered: told, not drawn); Urrea at the head of his dragoons | no words |
| **The Alamo** *(branch)* | Bowie drawn ill on his cot in a south-side room of the low barrack from Feb 24, lying still when that barrack is carried (the caption moved there from the long barrack); Crockett at the palisade, lost in the smoke (§3.3); Bonham riding in on Mar 3 with Williamson's letter (caption corrected) and at the church guns; Almeron Dickinson at the church guns; Gregorio Esparza at a gun, his family in the sacristy; Susanna and Angelina in the sacristy; Seguín riding out Feb 25; Kimbell, Martin and J. W. Smith with the relief; Santa Anna with the reserve at the north battery; Cos at the head of his column; Castrillón at the north | Travis and Joe as built; no executions drawn |
| **Coleto / Goliad** *(branch)* | Fannin in the square (wounded, sitting), named; Urrea at the Mexican centre; Horton's horsemen named with Horton; at Goliad Fannin is **not drawn at his execution** — the `inside` caption tells it, and his card gives his last requests from Spohn's 1836 account, and the later three-request version as tradition | Alavez named and wordless |
| **San Jacinto** (main) | Houston drawn on his horse with the line from the parade, his horse Saracen shot under him and his ankle hit near the breastwork, riding on (the wound a staged moment, not only the next day's pose); Santa Anna seen fleeing in the rout (not identified to the viewer until the `taken` phase); Sherman, Burleson, Lamar at the heads of their groups; Deaf Smith's party; Castrillón standing on an ammunition crate at the breastwork, then walking away and falling (no words); Almonte surrendering his men to Burleson at dusk; Rusk with Houston trying to stop the killing (no words) | the parley and "¡El Presidente!" as documented; nobody named speaks |

---

## 4. What the engine needs

### 4.1 A roster of historical people (`sim/people.mjs`, data only)

One module of data, like `sim/battles/*.mjs`, imported by the engine, the director and the projection, and checked when it
loads (as `checkEngagement` is):

```js
export const PEOPLE = Object.freeze({
  travis: {
    id: 'travis', name: 'Travis', fullName: 'William Barret Travis', side: 'texian', figure: 'officer', tier: 1,
    who: 'A lawyer from Alabama and lieutenant colonel of the Texian cavalry, who commanded at the Alamo.', claimId: 'HIST-TEX-540',
    // Where he is and what he does, dated; the latest entry at or before the minute is in force.
    itinerary: [
      { from: 'travis-news', place: 'bexar', doing: 'garrison', claimId: 'HIST-TEX-051' },
      { from: 'alamo-siege', place: { alamo: 'travis-quarters' }, doing: 'command', claimId: 'HIST-TEX-054' },
      { battle: 'alamo', phase: 'alarm', place: 'north-battery', pose: 'fire', claimId: 'HIST-TEX-502' },
    ],
    fate: { kind: 'killed', battle: 'alamo', phase: 'repulse', at: 4, place: 'north-battery', claimId: 'HIST-TEX-541', told: 'alamo-fall' },
    known: [ /* card lines, each { text, label, claimId } */ ],
    disputed: [ /* each { text, label: 'TRADITION' | 'DISPUTED', claimId } */ ],
  },
});
```

- **Checks at load:** every entry has a claim; every place is a ground point of its battle or a map site; a fate carries a
  claim and a `told` knowledge topic; `fate.drawn: false` (Crockett) forbids a fall; a person's lines (still written in the
  engagement) must name a roster ID, and a line naming a roster ID is documented or tradition.
- **Persistence without a save bump.** The roster is data and the itinerary is read from the clock, as the battle engine's
  phases are (`sim/battle-stage.mjs:8-16`): nothing new is stored in `world`, so an old save opens with every famous person
  where the minute puts them (the correct empty value; no `saveVersion` move, per `CLAUDE.md`).
- **The engine reads the roster.** `phase.people` (the Alamo branch's mechanism) becomes a list of roster IDs with a
  per-phase place and pose; the name, label, claim and fall come from the roster. Parley `people` do the same. A named line
  is drawn over its person's figure (as the branch's `peopleSpots` already does) and **the bubble shows the name** as its
  first word or a small caption under it (`public/speech.js` gains `speaker.name`). `fallenBy` keeps named falls at their
  point (Milam), fed from the roster.
- **Off the battlefield** the director places Tier 1 people on the map from their itinerary (a figure at the site, or riding
  a road between two sites for a courier, Mrs. Dickinson's walk to Gonzales and Santa Anna's march) and the army markers gain
  `commander: <roster id>` so "Houston's army" can be tapped to Houston. `sim/armies.mjs` already has the positions.
- **Knowledge.** `peopleProjection(world, viewer)`: the Host every person; a household only the people its own knowledge and
  sight allow (`sim/sight.mjs`, `sim/knowledge.mjs`), and a person's `fate` only when the household holds the `told` topic.
  This is the same rule as `memberFates` (`sim/battle-stage.mjs:527-530`).
- **Not entities.** Famous people should **not** be put in `world.entities`: they do no work, eat nothing, cannot be ordered
  and must not be touched by the family systems. A roster read from the clock gives stable IDs and positions without any of
  that. `ceiling:` if a later arc makes a famous person interactive (a family's man sent to Houston's tent), promote that one
  person to an entity then.

### 4.2 Persistence across engagements

The itinerary, not the battle files, is what makes Travis the same man from February 3 to March 6, Santa Anna the same man from
the Rio Grande to the grass at San Jacinto, and Houston the same man from Gonzales to his wound. Each engagement's file names
roster IDs; the director's `TIMELINE` keys (`travis-news`, `alamo-siege`, `alamo-assault`, `fall-confirmed`, `houston-lynchburg`,
`san-jacinto`, `santa-anna-taken` …) are the itinerary's `from` points, so the dates are the director's and cannot drift.

### 4.3 The card

`public/person-card.js`, shared with the family panel's card; opened by tapping a roster figure, a parley figure, a named fall, an
army marker with a commander, or a name in the caption strip. It reads `peopleProjection` only.

### 4.4 Art

Nothing blocks on art (`CLAUDE.md`). Requests for `docs/ART_REQUESTS.md` in its contract format, each with a stand-in:

| Need | Stand-in until it lands |
| --- | --- |
| **A Texian officer figure** (coat, sash, sword; for Travis, Milam, Fannin, Houston, Burleson, Moore) with idle, walk, aim/fire, point/command, injured, reclining | `volunteer-*` (as the Alamo branch already does for Travis, `battle-view.js:852` *(branch)*) |
| **Frontiersman variant** (Crockett, Bowie: hunting shirt, cap) | `volunteer-*` |
| **A man ill in bed** (Bowie, `*-sick-bed`), and the same figure lying still | `alamo-cot-blanket` with `volunteer-reclining` on it |
| **Mexican general officer**, mounted and on foot (Santa Anna, Cos, Urrea, Castrillón, Almonte) | `dragoon-*` / `regular-*` |
| **Santa Anna in a private's clothes**, seated, for the capture | `regular-rest-sit` |
| **Houston mounted**, and seated wounded under the oak | `volunteer-*` and `volunteer-injured-rest` (as now) |
| **Susanna Dickinson with Angelina** (walk carrying a child, sit) | `portrait`/walk of `rust-woman` with a child figure drawn smaller |
| **Tejano officer** (Seguín), **Tejana woman and children** (the Esparzas) | `volunteer-*`; the family figures |
| **A name label style** distinct from side labels (small caps, a thin underline), and a **portrait for each Tier 1 person** for the card, marked "an artist's interpretation; no likeness is claimed" where no period likeness exists | text label as now; the figure's idle frame cropped |

Joe already has his own sixteen-frame sheet (`joe-poses`, `docs/ART_MANIFEST.md:74,882-897`).

### 4.5 Evidence the build would need

Per `CLAUDE.md`: a test per rule in §3.2 (a reconstructed line on a roster ID refused; a fate not projected before its minute; a
card's fate hidden from a household without the topic; Crockett never drawn falling), each seen to fail under an injected
regression; a browser proof that tapping Travis at the north battery opens his card and that the card has no fate until the word.

---

## 5. Gaps that are errors today (fix whatever else is decided)

1. **`sim/alamo.mjs:350`** (and `sim/rumour-story.mjs:40`): "every man in it was killed; Mrs. Dickinson, her child and
   Travis's servant Joe were spared". Joe was a man inside who lived, and "servant" softens slavery; both break
   `docs/MILITARY_EXPERIENCE.md` ("Avoid 'all men died'"; "Joe, enslaved by William Barret Travis") and the note on
   `HIST-TEX-058` that it "must not be paraphrased as 'no man inside the walls lived'". Suggested: *"The Alamo has fallen. It was
   stormed at dawn on March 6, and nearly every defender was killed. Joe, a man Travis held as a slave, who fought beside him,
   was spared with Mrs. Dickinson and her child, and they have come in to Gonzales."* ("Nearly", not "all but Joe": Brigido
   Guerrero also lived, `HIST-TEX-435`.) `sim/alamo.mjs:349` (the rumour) is framed as what two
   riders said and may keep "every man", but they were Tejano riders from Béxar (`alamo.md` §4), better said so.
2. **`sim/alamo.mjs:360` *(branch)***: "Every man who fought was killed … The women and children, and Joe, whom Travis held as a
   slave, were spared." Joe fought (his own account). Suggested: "Nearly every defender was killed … Joe, whom Travis held as a slave and who had fought beside him, was spared
   with the women and children."
3. **On `main` no text names Travis, Bowie or Crockett among the dead**, and Fannin's own death is not told on main
   (`sim/directors.mjs:1279`). The account at the word should name them, with Crockett's dispute (§3.3).
4. **`docs/BATTLES.md` §6.5 and the comments at `gonzales.mjs:52`, `san-jacinto.mjs:80`** misstate the talk rule (§1.3).
5. **The April 20 skirmish at San Jacinto.** The code's one wounded man is an unnamed man of Sherman's horsemen
   (`san-jacinto.mjs:166`, `HIST-TEX-083`, `-067`: the skirmish "wounded one Texan"). The Handbook's Neill entry says Neill,
   commanding the Twin Sisters in the April 20 skirmish, was hit in the hip by grapeshot [S31]. Either the one wounded Texan was
   Neill at the guns (then the fall belongs at the guns, named), or there were more; check Houston's report and the San Jacinto
   entry before naming anybody.
6. **Bonham's caption** (`alamo.mjs:345-346` *(branch)*) says he brought word that "Fannin is not coming" — the version the
   Handbook calls a wrong memory; he brought Williamson's letter promising help [S11]. `docs/ALAMO_FATES.md` §2 already records
   the dispute.
7. **Bowie's death caption** (`alamo.mjs:511` *(branch)*) sets it in the long barrack's fighting; the sources put his room on the
   south side (P7).
8. **Grant's caption** (`agua-dulce.mjs:140`) says "cut down after he was surrounded"; the Handbook's agreed core is that he had
   surrendered and dismounted when he was killed [S21] — a plainer and truer sentence, without the Handbook's detail.
9. **Milam's place.** The game puts his death in the Veramendi yard from Johnson's report (`HIST-TEX-039`); the Handbook's entries
   do not name the house [S32]. Nothing to change — but the card should cite Johnson, not the Handbook, for the place.

---

## 6. Proposed `HISTORY.md` rows

Written here, not in `HISTORY.md`. `HIST-TEX-540`–`-579` and `FIC-GONZ-450`–`-459` were checked free on 2026-09-26 on `main` and on
every one of the repository's 73 local branches (a scan of each branch's `HISTORY.md` and a `git grep` of its `*.md`, `*.mjs` and
`*.js`). 
Rows are in the registry's newer column order (ID, classification, claim with its source, implementation note), as
`HIST-TEX-492` and `-526` are. Quotations are as the fetching tool returned them and are **to be checked against the page before
registration** (the standing caveat of this research). Where an existing row already holds a fact, the new row extends it and
says so.

| Stable ID | Classification | Exact claim | Implementation note |
| --- | --- | --- | --- |
| **HIST-TEX-540** | DOCUMENTED | **Travis at Béxar and his letters.** Arrived February 3, 1836; joint command with Bowie from about February 13; sole command from February 24 when Bowie fell ill. February 23: "The enemy in large force is in sight. We want men and provisions." February 24, "To the People of Texas & All Americans in the World": "I shall never surrender or retreat", signed "Victory or Death"; carried out by Albert Martin, who added "Hurry on all the men you can in haste". Letters of March 3 to the Convention, to Jesse Grimes and to David Ayres went out with John W. Smith (HOT *Travis, William Barret*; HOT *Alamo, Battle of the*; TSLAC, the letter; read 2026-09-26). Extends `HIST-TEX-051`, `-055`. | His card's "known"; his letters shown as writing in captions, never as speech. |
| **HIST-TEX-541** | DOCUMENTED (testimony) | **Travis's death.** At the alarm he ran to the north wall battery and was shot down there among the first (Joe, in Gray's diary, March 20, 1836); "a single bullet in the head" (HOT *Travis*); Ruiz (1860) found him "on the gun carriage shot only in the forehead" on the north battery. **DISPUTED:** Joe's story, as Gray recorded it, of Travis running a "General Mora" through before both died — no such general is known killed. Extends `HIST-TEX-501`, `-502` (Alamo branch). | The roster's fate for `travis`: `repulse`, the north battery. The Mora story on the card as disputed; never drawn. |
| **HIST-TEX-542** | DOCUMENTED | **Bowie at Béxar.** Reached Béxar January 19, 1836; wrote to Governor Smith on February 2 that "we will rather die in these ditches than give it up to the enemy"; elected to command the volunteers February 12; ill with "a disease of a peculiar nature" (diagnosis DISPUTED: pneumonia, typhoid pneumonia or tuberculosis) and bedridden from February 24; nursed by Juana Navarro Alsbury (HOT *Bowie, James*; HOT *Alsbury*; read 2026-09-26). Extends `HIST-TEX-051`. | Bowie drawn ill on his cot from February 24. |
| **HIST-TEX-543** | STRONGLY SUPPORTED, with a dispute | **Bowie's death.** Killed March 6 on his cot "in a room on the south side" (HOT *Bowie*; Ruiz 1860: "in one of the rooms of the south side"). **DISPUTED:** the manner — shot several times in the head (HOT), firing through his door from his bed (Joe, Gray), bayoneted or fighting with pistols and knife (later tradition). | His fate: the south-side room of the low barrack, lying still when it is carried; the manner only on his card. |
| **HIST-TEX-544** | DOCUMENTED | **Crockett's coming and his post.** Left Tennessee November 1, 1835; at San Augustine took the oath only with "republican" written in; wrote to his daughter January 9, 1836: "I am rejoiced at my fate. I had rather be in my present situation than to be elected to a seat in Congress for life"; reached Béxar about February 8; posted by Travis at "the low stockade in front of the church", "the most vulnerable point" (STRONGLY SUPPORTED) (HOT *Crockett, David*; read 2026-09-26). Extends `HIST-TEX-051`. | Crockett at the palisade; his letter on his card; no spoken line anywhere. |
| **HIST-TEX-545** | DISPUTED | **How Crockett died.** Killed fighting: Joe (Gray, March 20, 1836) — found with a few friends and "twenty-four of the enemy dead around them"; Susanna Dickinson (1870s) — among the first to fall, his body between the church and the two-storey barrack; Ruiz (1860) — "toward the west in a small fort". Captured and executed: a Galveston letter of June 9, 1836; George M. Dolson's letter of July 19, 1836; Martínez Caro (1837, prisoners executed, unnamed); de la Peña's narrative (published 1955) naming him among about seven killed on Santa Anna's order despite Castrillón. The de la Peña papers' authenticity is argued (Kilgore 1978; Groneman 1994; Crisp; paper tests 1998; held at the Briscoe Center); HOT: "almost impossible to determine" (HOT *Crockett*; HOT *Peña*; Sons of DeWitt Colony; read 2026-09-26). Extends `HIST-TEX-435`. | `FIC-GONZ-451`: never drawn dying; both accounts on his card and in the account, attributed. The torture and mutilation details are not for the class. |
| **HIST-TEX-546** | STRONGLY SUPPORTED | **Bonham.** Came with Bowie January 19; sent for aid about February 16; rode back in March 3 with R. M. Williamson's letter "assuring Travis that help was on its way"; "wrongly remembered as bringing the news that Colonel Fannin was not coming"; "believed to have died manning one of the cannons in the interior of the Alamo chapel" (TRADITION for the place) (HOT *Bonham, James Butler*; read 2026-09-26). Refines `HIST-TEX-431` and `docs/ALAMO_FATES.md` §2. | Corrects the branch caption (`alamo.mjs:345`); Bonham at the church guns. |
| **HIST-TEX-547** | DOCUMENTED | **Almeron Dickinson.** One of the Gonzales Eighteen; at Gonzales October 2; "distinguished himself as a lieutenant of artillery" at Béxar; "captain in charge of artillery" at the Alamo; killed March 6. **TRADITION:** his last words to Susanna, from her later statements (HOT *Dickinson, Almeron*; read 2026-09-26). His gun's place is not in the Handbook (church battery: TRADITION). | Tier 1 from Gonzales; at the guns (`FIC-GONZ-452`). |
| **HIST-TEX-548** | DOCUMENTED, with disputes | **Susanna and Angelina Dickinson after the fall.** In the church (or the powder magazine — DISPUTED) during the assault; given "a blanket and two dollars in silver" by Santa Anna and sent east with Angelina (born December 14, 1834), Joe and Ben (Almonte's servant) with a letter of warning dated March 7; reached Houston at Gonzales "after dark about March 12" (HOT *Dickinson, Susanna*; HOT *Dickinson, Angelina*); the Deaf Smith entry has Smith sent on March 13 to bring the party in (DISPUTED date). **TRADITION:** the Masonic apron; Santa Anna offering to adopt Angelina; Travis's cat's-eye ring. Extends `HIST-TEX-060`, `-432`. | The travellers' itinerary from Músquiz's house to Gonzales, arriving at `fall-confirmed`. |
| **HIST-TEX-549** | DOCUMENTED | **Joe after the fall.** Shot once in the side with buckshot and scratched by a bayonet, "saved by Capt. Baragan"; questioned by the cabinet at Groce's on March 20, 1836, where Gray noted "the modesty, candor, and clarity of his account"; escaped April 21, 1837 with an unidentified Mexican man and two horses (reward notice, *Telegraph and Texas Register*, May–August 1837); last reported in Austin in 1875 (HOT *Joe*; the Alamo, *Joe's Account*; read 2026-09-26). Extends `HIST-TEX-434`. | His card; he walks to Gonzales with Mrs. Dickinson; never a mechanic. |
| **HIST-TEX-550** | STRONGLY SUPPORTED | **Gregorio Esparza.** José María "Gregorio" Esparza fought at Béxar in December 1835 in Seguín's company; took his family into the Alamo on February 23 "through a small window in the church"; "tended a cannon during the siege" (place not known); killed March 6; buried by his brother Francisco in the Campo Santo, the only defender given Christian burial. Enrique, born 1828, gave his accounts in interviews of 1902–1907 (late testimony) (HOT *Esparza, José María*; HOT *Esparza, Enrique*; read 2026-09-26). | A Tier 2 figure at a gun; the family in the sacristy; the burial on his card. |
| **HIST-TEX-551** | STRONGLY SUPPORTED | **Seguín.** His company fought at Béxar December 5, 1835; he rode out of the Alamo as a courier (February 25 per `HIST-TEX-431`; some accounts February 23 — DISPUTED); led the rear guard in the retreat; his was "the only Tejano unit" at San Jacinto, alongside Sherman's regiment; he buried the defenders' ashes February 25, 1837 (his account printed March 28, 1837) (HOT *Seguín, Juan Nepomuceno*; read 2026-09-26). | Tier 1 itinerary: Béxar, the Alamo, San Jacinto. |
| **HIST-TEX-552** | DOCUMENTED | **John W. Smith.** Drew the plat of Béxar that made the house-to-house attack possible (December 1835); met the flag of truce; "the final messenger to the Convention of 1836" from the Alamo on March 3; fought at San Jacinto (HOT *Smith, John William*; read 2026-09-26). That he guided the Gonzales relief in (`docs/ALAMO_FATES.md`) is not in his entry — to check. | Tier 2 at Béxar's truce (as built) and out of the gate March 3. |
| **HIST-TEX-553** | DOCUMENTED | **Austin and the army of 1835.** Home from prison at the end of August 1835; spoke at Brazoria September 8; elected commander of the volunteers at Gonzales; led them to Béxar; named commissioner to the United States in November and left the army (HOT *Austin, Stephen Fuller*; read 2026-09-26). "War is our only recourse" not verified. | Tier 1 itinerary October 11 – November 24. |
| **HIST-TEX-554** | DOCUMENTED | **Burleson.** General of the volunteer army from November 24, 1835; in the Grass Fight; accepted Cos's surrender; at San Jacinto commanded the First Regiment in the centre and accepted Almonte's surrender and his sword (HOT *Burleson, Edward*; read 2026-09-26). | Burleson at Béxar's parley and at the head of his regiment; Almonte's surrender to him. |
| **HIST-TEX-555** | DOCUMENTED | **Karnes and Deaf Smith in March and April.** Sent from Gonzales with Deaf Smith and R. E. Handy, Karnes was "the first to return" with word that the Alamo had fallen; Smith brought in the Dickinsons, captured the courier whose dispatches placed Santa Anna, and destroyed Vince's bridge on April 21 on Houston's order (whose idea: DISPUTED); Karnes was second in command of Lamar's cavalry at San Jacinto; Travis had called Smith "the Bravest of the Brave" (HOT *Karnes, Henry Wax*; HOT *Smith, Erastus (Deaf)*; read 2026-09-26). Extends `HIST-TEX-153`. | The scouts meeting the Dickinson party; labels on Deaf Smith's party. |
| **HIST-TEX-556** | STRONGLY SUPPORTED | **Grant's death.** "Accounts of Grant's death vary in detail but agree that after being pursued for some miles he surrendered and had dismounted only to be immediately stabbed in the back by a Mexican lancer" (HOT *Grant, James*; read 2026-09-26). Extends `HIST-TEX-059`, `-511`. | Not drawn (killed after surrender); the caption says he was killed after he gave up. |
| **HIST-TEX-557** | DOCUMENTED | **Cos in 1836.** Paroled after Béxar not to oppose the Constitution of 1824; led an Alamo column, which Texans held broke the parole; brought about 540 men across Vince's bridge on April 21 "just before the Texans destroyed it"; taken prisoner April 24 (HOT *Cos, Martín Perfecto de*; Houston's report of April 25; read 2026-09-26). | Tier 1 itinerary: Béxar, the Alamo, San Jacinto. |
| **HIST-TEX-558** | DOCUMENTED | **Ugartechea.** Military commandant at Béxar who sent Castañeda; led about 275 infantry at Concepción; left Béxar November 12 for reinforcements and returned December 8 with 627; wrote of the colonists, "Nothing is heard but God damn St. Anna. God damn Ugartechea" (HOT *Ugartechea, Domingo de*; read 2026-09-26). | A Tier 2 figure at Concepción and with the reinforcement; the quotation only on his card. |
| **HIST-TEX-559** | STRONGLY SUPPORTED, with a dispute | **Santa Anna's capture and his words.** Found April 22 by Lt. J. A. Sylvester's party "dressed as a common soldier", not recognised "until he was addressed as 'el presidente' by other Mexican prisoners" (HOT *San Jacinto, Battle of*); brought to Houston with Almonte interpreting. **TRADITION:** his words to Houston ("…who has conquered the Napoleon of the West…") and Houston's reply ("You should have remembered that at the Alamo"), printed by W. C. Crane in 1884. His report of March 6 claimed 70 killed and 300 wounded of his own and 600 Texans. Extends `HIST-TEX-523`, `-526`. | Neither man speaks (as built); the Crane words only on the cards, as told later. |
| **HIST-TEX-560** | STRONGLY SUPPORTED | **Castrillón.** Opposed an immediate assault on the Alamo; took Duque's column when Duque was hit, "credited as the first to reach the fortress walls"; interceded for captives who "may have included David Crockett" (DISPUTED); protested the Goliad executions; at San Jacinto, by Rusk's report as the Handbook gives it, stood "fully exposed to enemy fire on an ammunition crate", then "slowly turned and walked away from the oncoming Texans. He was shot"; buried by Lorenzo de Zavala (HOT *Fernández Castrillón, Manuel*; read 2026-09-26). Words of his about not running are TRADITION, not verified. | Tier 2 at the Alamo and at San Jacinto's breastwork, falling; no words. |
| **HIST-TEX-561** | DOCUMENTED | **Almonte.** Kept a journal February 1 – April 16, 1836 (published); on Santa Anna's staff; surrendered to Burleson at San Jacinto; interpreted at Santa Anna's meeting with Houston (HOT *Almonte, Juan Nepomuceno*; HOT *Burleson*; read 2026-09-26). | His surrender at dusk in `prisoners`. |
| **HIST-TEX-562** | DOCUMENTED, with a tradition | **Fannin's surrender and death.** Acting commander-in-chief February 12 – March 12, 1836; surrendered at Coleto on terms placing the men "subject to the disposition of the supreme government", which he accepted "without fully informing his men" (the men believed they were prisoners of war — DISPUTED); "shot separately" in the presidio March 27 (HOT *Fannin*; HOT *Goliad Massacre*). Joseph H. Spohn (1836) said Fannin gave his gold watch to be buried and asked that the muskets not be held so near as to scorch his face, and that the bodies were partly burned (DOCUMENTED as testimony); the three requests in their familiar form (things to his family, the heart not the face, Christian burial, all refused) are a later synthesis (TRADITION) (Sons of DeWitt Colony, Spohn; Wikipedia *James Fannin*, citing Hardin; read 2026-09-26). Extends `HIST-TEX-063`, `-064`, `-519` (Coleto branch). | Fannin never drawn at his execution; `sim/fannin.mjs:464` *(branch)* to name Spohn. |
| **HIST-TEX-563** | STRONGLY SUPPORTED | **Horton and Alavez.** Horton's Matagorda horsemen, scouting ahead at Coleto, were cut off "and fled, an action that saved his life but haunted his later political career" (HOT *Horton, Albert Clinton*). Francita Alavez got the prisoners' bonds loosened and food given at Copano and at Goliad "brought out several men and hid them", attested by the spared doctors Barnard and Shackelford (HOT *Alavez, Francita*; read 2026-09-26). Extends `HIST-TEX-063`, `-064`. | Horton labelled with his horsemen; Alavez as built on the Coleto branch, wordless. |
| **HIST-TEX-564** | STRONGLY SUPPORTED | **Houston's wound.** At San Jacinto his horse Saracen was shot under him and he was wounded "just above his ankle", the ankle shattered by a musket ball; his report of April 25 gives "about eighteen minutes from the time of close action" and "Gen. Santa Anna was not taken until the 22d, and Gen. Cos yesterday" (HOT *Houston, Sam*; the report as transcribed; read 2026-09-26). Extends `HIST-TEX-522`, `-526`. | His wound staged at its moment in the charge. |
| **HIST-TEX-565** | STRONGLY SUPPORTED | **Lamar, Sherman and Neill at San Jacinto.** April 20: Lamar, a private, saved Rusk and Walter P. Lane when they were surrounded, "and brought him a salute from the Mexican lines"; on the 21st he was "verbally commissioned a colonel" to command the cavalry (HOT *Lamar*). Sherman's Kentuckians brought "the only flag" the Texans had; his regiment "opened the attack"; he "has been credited with" the cry "Remember the Alamo!" (TRADITION) (HOT *Sherman*). Neill, commanding the Twin Sisters in the April 20 skirmish, was hit in the hip by grapeshot (HOT *Neill*; read 2026-09-26). Qualifies `HIST-TEX-067`, `-083`. | Labels on Lamar's and Sherman's men; the April 20 wound checked (§5 item 5). |
| **HIST-TEX-566** | DOCUMENTED (testimony, 1860) | **Ruiz and the dead.** The alcalde Francisco Antonio Ruiz identified the bodies of Travis, Bowie and Crockett for Santa Anna; the defenders' bodies were burned in layers of wood, lit that evening by his account, "182" of them; the Mexican dead were buried or, when the graveyard was full, put in the river; his figure of Mexican losses is inflated (*Texas Almanac*, 1860, via Sons of DeWitt Colony; read 2026-09-26). | Cited on the cards for body places; the burning told, never drawn close (`staging.md` §5.9). |
| **HIST-TEX-567** | TRADITION | **The line in the sand's provenance.** The Handbook traces it from Louis "Moses" Rose through the Zuber family to W. P. Zuber's article in the *Texas Almanac* for 1873; the Rose entry cites Enrique Esparza (1907) in support (HOT *Rose, Louis (Moses)*; HOT *Zuber, William Physick*; read 2026-09-26). Extends `HIST-TEX-437`. | Only on Travis's card, in "Told later". |
| **HIST-TEX-568**–**579** | — | Reserved for this work (a famous person added later, and the checked wording of any quotation above). | |

**What the game would invent** (the `FIC-GONZ-450` block):

| Stable ID | Classification | Exact claim | Implementation note |
| --- | --- | --- | --- |
| **FIC-GONZ-450** | **FICTIONAL FOR GAMEPLAY** | **The historical-person roster as staged** (`docs/battle-research/famous-people.md` §4.1). Invented: which people are persistent (Tier 1), named in one battle (Tier 2) or mentioned only (Tier 3); where a person stands between two documented points of their itinerary (a road between two sites, a spot inside a town); the minute inside a phase at which a documented act is drawn when the record gives only the phase; that famous people are read from the clock and not stored, and are not entities. | `sim/people.mjs`; every itinerary entry and fate still carries its own `HIST-` claim for the fact it draws. |
| **FIC-GONZ-451** | **FICTIONAL FOR GAMEPLAY** | **Crockett's death shown as a dispute** (§3.3, owner P1). He is drawn at the palisade through the assault, lost from sight in the smoke when the south is carried, and never drawn dying; the `end` caption, his card and the account give both accounts, each attributed. That he is lost from sight at that moment is invented; the dispute is `HIST-TEX-545`. | `fate.drawn: false`; a test that no fall or execution is ever projected for him. |
| **FIC-GONZ-452** | **FICTIONAL FOR GAMEPLAY** | **Where a famous person stands inside a battle when the record gives only an area** (Bowie's bed in the low-barrack room by the gate; Bonham, Almaron Dickinson and Gregorio Esparza at the church guns; Crockett's Tennesseans along the palisade; Santa Anna with the reserve behind the north battery; Houston riding at the line's centre; Castrillón at the Mexican gun). Each point is chosen from the area the cited sources give; the exact spot is invented. | Ground points in each `sim/battles/*.mjs`; the card says "about here". |
| **FIC-GONZ-453** | **FICTIONAL FOR GAMEPLAY** | **The "who was" card** (§3.5): its four parts, its wording for a middle-school reader, and the rule that "What became of him" is withheld from a household until it holds the knowledge topic that tells it. | `peopleProjection`; the same filter as `memberFates`. |
| **FIC-GONZ-454** | **FICTIONAL FOR GAMEPLAY** | **How named deaths are drawn** (§3.2 rule 3, owner P6): the figure goes down and lies still at the record's moment and place, with no gore, his name under him, carried off where the record says so; a man killed in his bed simply lies still; no named man killed after he was taken (the Alamo's prisoners, Grant, Fannin) is ever drawn dying; those are told. | Extends `VISION.md` §16 and `docs/BATTLES.md` §2.3 and §2b.2 to named people. |
| **FIC-GONZ-455** | **FICTIONAL FOR GAMEPLAY** | **Famous people on the campaign map** (owner P5): a Tier 1 person between battles is drawn at the site or on the road the itinerary gives, seen by a family only within the ordinary sight rules; an army marker with a commander opens his card. | `sim/armies.mjs` gains `commander`; `public/army-view.js` hit-testing. |
| **FIC-GONZ-456** | **FICTIONAL FOR GAMEPLAY** | **Portraits and figures of famous people are interpretations.** No drawn face claims a likeness; where a period portrait exists the drawing may follow its dress, not claim to be the man. | Said on the card under the portrait. |
| **FIC-GONZ-457** | **FICTIONAL FOR GAMEPLAY** | **A named speaker's bubble names him** (the name drawn as the bubble's first line), and a line on a roster person is drawn over that person's figure, never over a sampled figure. | `public/speech.js` `speaker.name`; `public/battle-view.js` `speakerAt`. |
| **FIC-GONZ-458**–**459** | — | Reserved for this work. | |

---

## 7. Questions for the owner

Each has a recommended answer; any not answered takes it, as `docs/BATTLES.md` §2b did.

**P1. How is Crockett's death shown?**
- (a) **He is drawn at the palisade through the fight, is lost from sight in the smoke when the south is carried, and is never
  drawn dying; a caption in the `end` phase and his card give both accounts, each labelled with who told it, and say
  historians disagree.** *(Recommended: it is true, it is teachable, and it shows no execution.)*
- (b) Draw him falling at the palisade, labelled "tradition", and give the execution account on the card.
- (c) Draw both, one after the other, as "Account 1" and "Account 2" with the execution shown as the prisoners being led
  away (never the killing).
- (d) Leave him out of the drawn assault; tell only.

**P2. Are famous figures clickable?**
- (a) **Yes, every drawn famous figure, for students and the Host, opening the "who was" card (§3.5); what became of him is
  hidden until the family has the word.** *(Recommended.)*
- (b) Only for the Host.
- (c) No cards; names only.

**P3. Is Joe named on the map?**
- (a) **Yes, "Joe", as on the Alamo branch, with his card saying plainly that Travis held him in slavery, that he fought and
  survived, testified, was returned to slavery and escaped in 1837.** *(Recommended: naming him keeps his testimony his own,
  as `docs/MILITARY_EXPERIENCE.md` asks.)*
- (b) Drawn, but unlabelled, with his story told only in the account.
- (c) Not drawn; told only.

**P4. Which people become persistent figures across events?**
- (a) **The fifteen of Tier 1 (§3.1); the rest named inside one battle or mentioned only.** *(Recommended.)*
- (b) Only the owner's three and the two commanders-in-chief (Travis, Bowie, Crockett, Santa Anna, Houston).
- (c) Everyone on the roster.

**P5. Are famous people shown on the campaign map between battles?** (Travis at Béxar in February, Mrs. Dickinson and Joe
walking to Gonzales, Santa Anna with his column, Houston with the army.)
- (a) **Yes, where a family could see them (the same sight rules as any figure), with the army markers tappable to their
  commander.** *(Recommended.)*
- (b) Only inside battles.

**P6. Are named deaths shown at all?**
- (a) **Yes, as Milam's is: the figure goes down and lies still, no gore, the name under him — for Travis, Bowie (in his bed,
  no struggle), Milam, Bonham, Almeron Dickinson, Gregorio Esparza, Castrillón; no named man killed after he was taken is ever drawn
  (Crockett, unless P1 b or c is chosen; Grant; Fannin); those are told.** *(Recommended.)*
- (b) No named man is drawn dying; every named death is told in the caption and on the card.

**P7. Bowie's room and death.** The Handbook and Ruiz put him on his cot "in a room on the south side" (the low barrack by the
gate); the Alamo branch's caption kills him during the long barrack's room-by-room fight; how he died is disputed.
- (a) **Drawn ill on his cot in a south-side room from February 24; when the low barrack is carried soldiers reach its door and
  the figure lies still; the room is labelled "about here"; the manner is on his card as disputed.** *(Recommended.)*
- (b) The same, but the room is not drawn: he is simply not seen after the low barrack is carried; the caption tells it.
- (c) Keep the branch as built (a caption in the long barrack's phase).

**P8. The famous words everybody knows but nobody documented** — the line in the sand, "Victory or Death" as a spoken
cry, Crockett swinging his rifle as a club and Bowie firing from his cot (pictures from later paintings and films), Santa Anna's "Napoleon of the West" speech to Houston, Houston's "Hold
your fire, God damn you".
- (a) **Never spoken on the field. On the person's card in a "Told later" section, saying who first told it and when, and
  that historians doubt it; the words he actually wrote ("Victory or Death" in the letter of February 24) shown as writing.**
  *(Recommended.)*
- (b) Spoken on the field as `tradition` lines with the dashed edge (as Milam's call is).
- (c) Left out.

