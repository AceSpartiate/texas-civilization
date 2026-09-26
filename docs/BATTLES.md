# Battles that happen where people can see them

**Owner direction, 2026-09-25** (after watching every conflict and finding "npc's just standing around … no one worried at
gonzales that the mexicans are coming … no group of women making the come and take it flag … the battle itself never
actually takes place … no smoke from the gunfire. this is true of every conflict i've looked at"):

> go ahead, build it for every conflict. wouldn't the mexican army be in rows, but the texians in unorganized chaos?
> shouldn't there be talking, orders given, taunting etc? it's okay to make battles last longer to show the full
> experience as long as it appears correct to the player. players that have a character there should get an alert to
> watch. if they sent a character, it needs to happen in such a way that their character arrives in time to participate
> and does participate. after each battle different things will happen for each battle. sometimes it might be
> appropriate for them to come home. other times, not. build it reasonably, and interactively for the player. players
> should walk away understanding what happened.

This is the go-ahead `docs/MILITARY_EXPERIENCE.md` step 2 was waiting for. It amends that plan's order (every conflict,
not the Alamo first) and `VISION.md` §16 is the binding frame: formations, marching, musket fire, artillery, advances,
retreat, surrender, soldiers falling and wounded carried; no gore; no general-purpose tactical war game; aggregate
forces that resolve visually into miniature people; player characters individually preserved.

## 1. What was there on 2026-09-25 (the finding)

- **Gonzales** was the only drawn battle: 12 sampled figures a side, `volunteer/regular-fire-reload` played **once** per
  phase (the clip does not loop, so the line froze in the ramrod pose), one puff of smoke for about two seconds, an
  exchange of 10–19 real seconds at Study pace. Formations jumped once a tick. The Host received no live battle; the
  spotlight framed the town, not the field.
- **Every later conflict** — Concepción, the Grass Fight, the storming of Béxar, San Patricio/Agua Dulce, the Alamo,
  Coleto, the Goliad massacre, San Jacinto — resolved in one `once(...)` call inside one campaign tick (~9.5 s), as
  words, a spotlight and `rollFates`. Nothing on the map.
- **Before a battle** nobody reacted: four invented Gonzales residents on a fixed round, no alarm, no flag, no muster.
- The art library already holds march / aim / fire / load / ramrod / injured / reclining / surrender for volunteers and
  regulars, dragoons, cannon with recoil, gun crews, `musket-smoke`, `cannon-smoke`, `muzzle-flash-e/w`, `dust-*`.

## 2. Decisions taken under "build it reasonably" (the owner may overturn any of them)

Put to the owner as multiple choice on 2026-09-25 and dismissed; the owner then said "build it reasonably". These are
the choices this build makes, each recorded so it can be reversed in one place.

1. **Who watches live.** The Host's screen shows every battle live and its spotlight frames the **field**. A student sees
   a battle live when one of their family is in it, or is at a place it can be seen or heard from (the town beside it).
   Nobody else sees it until word reaches them. Fog of war and server-filtered knowledge stand.
2. **How long.** While a battle's fighting phases run, the shared clock is held to small steps so the fighting plays
   for roughly **3–6 real minutes at Study pace** (scaled for Brisk/Quick), and the build-up is paced to be seen. The
   whole class shares one clock; no household gets a private timeline. The clock never runs *faster* during a battle.
3. **Falling.** In battles where people died, soldiers fall and lie still — no blood, no gore, no graphic bodies — and
   the wounded are carried off afterwards (`VISION.md` §16 names both). This reverses the earlier drawing choice in
   `public/motion.js` that no figure is ever drawn lying down, for battles only. Gonzales had no deaths: nobody falls.
4. **Order and disorder.** Each side is drawn as it fought, per engagement, from the research — not one rule for all.
   Mexican regulars generally in drilled ranks, firing by rank on command, officers and drums/bugles; Texian volunteers
   generally loose — scattered, at their own pace, each on his own reload, using cover. Where an engagement differs
   (the Alamo's defenders on the walls, Concepción's men under a riverbank, the Béxar street fighting through houses,
   San Jacinto's line that dissolved into a rout) the engagement's own staging wins.
5. **Talk.** Speech is drawn over the speaker. Three kinds, each labelled in data: **documented** words (with a claim
   ID, only where a source records them), **reconstructed** orders and calls typical of the force (Spanish commands on
   the Mexican side with an English gloss under them; drill words; generic shouts), and **reconstructed** taunts and
   worried talk, **never attributed to a named historical person** (`HISTORY.md` on the cannon's slogan: it is "not
   authorization to invent a spoken taunt or attribute one to a specific person"). A named person speaks only words a
   source gives them. Disputed words (Travis's line, the *degüello*) are labelled as tradition or dispute where shown.
6. **Arriving in time, and taking part.** A person a family sent to a fight is there before contact and is drawn in the
   force, doing what it does (firing, loading, advancing, falling back). If a route or an offer's timing would make
   them late, the offer, the departure or the pace changes — never the historical date. Their fate (where the battle
   had casualties) resolves at a staged moment inside the fighting, visible to those watching, not all at once in a
   tick. The fixed macro-outcome of each battle never depends on who came.
7. **The alert.** A family with somebody in or at a coming fight gets a card through a person before contact — "the
   Mexicans are coming / the army moves at dawn" — with **Watch**, which frames the camera on the field. It never steals
   the camera mid-drag or mid-command, never queues on top of an open decision, and is not sent to a family with nobody
   there.
8. **Afterwards, per battle.** Each battle ends in its own aftermath scene and its own consequences — some people come
   home, some cannot. The families who had somebody there get, through a person, an account in plain words of what
   happened, what their own person did, and why the battle ended as it did, and a choice where the history offered
   one. This is what "walk away understanding what happened" is held to.

## 2b. Decided by the owner, 2026-09-25, by multiple choice over docs/battle-research/staging.md

1. **The Alamo — a student may watch their own man fall.** It is drawn without gore and the camera stays on the wall.
   The rest of the family's story (news, the journal, what the others at home know) learns only when the word reaches
   them.
2. **The worst killing is shown like the battles.** The Goliad massacre and the slaughter after San Jacinto are drawn as
   the battles are: figures fall and lie still, no gore, no graphic bodies (§2.3). The research's gentler recommendation
   (far off, heard, then told) was declined. The escapes, those spared and the facts are still told plainly afterwards.
3. **Béxar as four held episodes**: the entry at 3 a.m. on December 5, the fighting where Milam died, the Priest's House,
   and the white flag, about 12 real minutes in all, with the town fighting at a slower pace between them; a family's
   man's fate lands on a day weighted by the real daily losses.
4. **The map extends south to the Nueces**, so a man who went south is really at San Patricio and the fights at San
   Patricio and Agua Dulce are drawn where they happened.
5. **The Alamo is the longest.** The owner: "I'm assuming that the alamo is the longest since it's a long siege?" The
   thirteen days of siege (February 23 – March 6) are played as a living siege — the daily bombardment and the
   defenders' answer, the Mexican batteries and lines creeping closer, couriers going out, the Gonzales relief riding in
   on March 1 — and the assault itself is the longest held single fight.

6. **The Come and Take It flag is drawn on the field, and the men shout its words** (owner, 2026-09-25, after v2026.09.25.6
   shipped without either: "have the flag be drawn, and have the men say it as a taunt of sorts"). The flag stands over
   the gun with the Texians from the rendezvous to the march home. Unnamed volunteers shout "Come and take it!" at the
   dragoons after the dawn skirmish and as they wheel away, and one of the eighteen calls it across the river after the
   refusal on September 30. Every shout is `tradition`, glossed as remembered later, never in a named mouth — no 1835
   document has anybody say it (`HIST-TEX-469`, `FIC-GONZ-419`).

Every other question in `docs/battle-research/staging.md` takes its recommended answer.

## 2c. Famous people — decided by the owner, 2026-09-26

Asked after `docs/battle-research/famous-people.md` found that no famous person is a person in the game. Owner: "famous
npc's: have we taken the time to ensure they do what they're supposed to? they should be labelled, saying and doing the
things that they likely would have, dying the way they should (Travis, Bowie, Crocett come to mind as an example)."
Then, by multiple choice:

1. **Crockett, as de la Peña tells it.** He fights through the dawn assault; after it ends, about 6:30, he is among the
   handful of men found alive and brought before Santa Anna in front of the Alamo, who orders them killed; officers kill
   them with swords, drawn without gore. Labelled as one account and disputed, with the killed-fighting account (Joe,
   Susanna Dickinson, Ruiz) named on screen too, and the dispute over the de la Peña narrative's authenticity stated. (The
   owner first described him fighting all night, captured the next morning and shot by a firing squad while Santa Anna
   ate breakfast; told that no source supports the night, the firing squad or the breakfast, the owner chose de la Peña.)
2. **Names on the map, no cards.** Famous people are drawn with their names; nothing is tapped for a "who was this" card.
   What a student learns of them comes from what they do and say, the captions and the accounts afterwards.
3. **Joe is named, and his actions are carefully recreated** from his own testimony (reviewed sources only; his humanity
   and constrained choices intact — `docs/MILITARY_EXPERIENCE.md`): with Travis at the north wall, back to the quarters
   after Travis fell, firing from there, found and spared, brought before Santa Anna, and sent to Gonzales with Susanna
   Dickinson. No text may say "every man was killed" without Joe.
4. **Famous words nobody wrote down at the time are spoken, labelled tradition** — Travis's line in the sand, Houston's
   "Hold your fire", Santa Anna as "the Napoleon of the West" and the like are said on the field in a dashed bubble with a
   gloss saying they were told later, as "Come and take it!" is at Gonzales (§2b.6). They are never shown as documented.

5. **The Twin Sisters are treated the same way** (owner, 2026-09-26: "Treat the Twin Sisters in a similar fashion."). The
   two cannon sent by the people of Cincinnati are named on the map and followed as famous things across their dated
   itinerary, from their arrival with Houston's army in April 1836 to the skirmish of April 20 and the battle of April 21,
   served by their documented crews and commanders (Neill until he was wounded on the 20th; Hockley and McCulloch on the
   21st — to be checked), firing when and from where the record puts them. What is documented is shown as documented;
   the stories told later (their naming for the Rice twins, the load of broken horseshoes, where they went and where they
   are buried) are spoken or captioned as `tradition`, never as the record.

Every other question in `docs/battle-research/famous-people.md` takes its recommended answer (about fifteen people carried
across events on a dated itinerary; named deaths drawn without gore; killings after surrender other than Crockett's told,
not drawn; Bowie in his south-side room, lying still when that barrack falls, the manner marked disputed; famous people
on the campaign map under the normal sight rules).

## 3. The shared contract (what every engagement is built on)

- **`sim/battle-stage.mjs`** — the one engine. An engagement is data (`sim/battles/<id>.mjs`): its site, its start
  moment on the director's `TIMELINE`, its **phases** (`alarm → approach → contact … → fallback → aftermath`, the actual
  phases and their game-minute lengths from research), each side's **style** (`ranks`, `loose`, `wall`, `bank`,
  `street`, `column`, `mounted`, `rout`), each side's count (as documented; a drawn sample when it is large), the fire
  each phase carries, the lines spoken in each phase, the moments casualties fall, and the aftermath. State lives in
  `world.battles[id]` and is **recomputed from the clock where it can be** (as `moveFormations` re-anchors), so a save
  opens where the fight is; an old save with no `world.battles` defaults it empty — **no `saveVersion` bump**.
- **Pacing** goes through `sim/military-pacing.mjs` (`militaryMinutes`), not a new clock.
- **Projection** follows §2.1 and the existing knowledge rules; a household's view carries only what its people there
  could see; the Host gets it live. No future phases, no hidden fates before they fall.
- **`public/battle-view.js`** — the one renderer: figures placed by style with a stable per-figure seed; each figure on
  its own looping cycle (aim, fire, load, ramrod; ranks fire together on the officer's word); muzzle flashes; smoke that
  **accumulates, lingers and drifts with the day's wind** and thins when fire stops; cannon served by a crew; figures
  moving smoothly between server positions, never jumping; speech bubbles; falling and carrying; flags where documented.
  It replaces `drawFormations` in `public/app.js`.
- **Nothing in a formation is a person.** Sampled figures are pictures of a count (`FIC-GONZ-006`); a family's own
  people are the real entities, drawn in the force at their own positions.
- Missing art is requested in `docs/ART_REQUESTS.md` and stood in with `stand-in:` per `CLAUDE.md`; deliberate
  simplifications carry `ceiling:`. New claims get IDs in `HISTORY.md` (blocks reserved below).

## 4. Claim blocks reserved for this work

| Block | For |
| --- | --- |
| `HIST-TEX-460`–`-479`, `FIC-GONZ-410`–`-419` | Gonzales: the town before the fight, the flag, the muster, the parley, the fight |
| `HIST-TEX-480`–`-489`, `FIC-GONZ-420`–`-424` | Concepción and the Grass Fight |
| `HIST-TEX-490`–`-499`, `FIC-GONZ-425`–`-429` | The storming of Béxar |
| `HIST-TEX-500`–`-509`, `FIC-GONZ-430`–`-434` | The Alamo assault (the siege's own claims stay in the `-430`–`-449` block) |
| `HIST-TEX-510`–`-529`, `FIC-GONZ-435`–`-444` | San Patricio / Agua Dulce, Coleto, Goliad, San Jacinto |
| `FIC-GONZ-445`–`-449` | The engine itself: pacing, viewers, falling, talk rules |

## 5. Build order

1. The engine and renderer, rebuilt first on Gonzales's fight (with the arrival guarantee for the upriver march). **Built 2026-09-25, not released: §6.**
2. In parallel: Gonzales's town before the fight (alarm, the flag, the muster at the ford, the cannon), and a staging
   sheet per later engagement from the research already in `docs/battle-research/`.
   **Gonzales's town: built 2026-09-25, not released** - `sim/town-scenes.mjs` and `public/town-scenes.js`, researched in
   `docs/battle-research/gonzales-town.md` (`HIST-TEX-460` to `-469`, `FIC-GONZ-410` to `-413`), described in
   docs/GONZALES_ART.md. It draws Castañeda's camp on the far bank from noon on September 29 to his move upriver on the
   morning of October 1 (`camp-mound`, `camp-leaves`); the fight's engine takes the field from there, and if it draws that
   camp itself the town's two beats come out in one place.
3. The later engagements on the engine, each with its aftermath. **The storming of Béxar: built 2026-09-25, not released: §7.** **San Patricio and Agua Dulce: built 2026-09-25, not released: §6.13-6.15.**
4. Released to live after each wave.

## 6. The engine as built (2026-09-25, wave 1: Gonzales)

Built as §3 described and rebuilt Gonzales's fight on it completely; the later engagements are copies of what follows.
Claims: `HIST-TEX-470`–`-479` (the fight, from docs/battle-research/gonzales.md), `FIC-GONZ-415`–`-419` (its staging) and
`FIC-GONZ-445`–`-449` (the engine's rules). The build order of §5 step 1 is done; not released.

### 6.1 Where it is

| Piece | File | What it does |
| --- | --- | --- |
| The engine | `sim/battle-stage.mjs` | Checks an engagement's data when it loads (`checkEngagement`), dates its phases (`schedule`, `phaseOffset`), reads where it stands off the clock (`battleState`), holds the clock for it (`battleStep`), and builds what a page may see (`projectBattle`). Keeps who of the families was in the force (`armBattle`, `world.battles[id]`) and holds them there (`heldByBattle`). |
| An engagement | `sim/battles/gonzales.mjs` | Data only, and its ground (`gonzalesGround`) read off the map. Imports nothing from the director, so the clock can read it without a cycle. |
| The director's part | `sim/directors.mjs` | Dates the old moments from the engagement (`approach`, `exchange`, `withdrawal`, `resolved`), opens and shuts the call to join (`upriver-call`, `marchCloses`, `joinPlan`), walks people to the men and places them in the line (`endWithTheForce`, `standWithTheForce`), sends the alert, the gun heard in town, the Host's spotlight and the account (`advanceGonzalesFight`, `gonzalesAccount`), and decides who is sent the fight (`directorProjection`). |
| Pacing | `sim/military-pacing.mjs` `battleMinutes`, called from `militaryMinutes` and from `calendarMinutes` on the invented map | The clock held to the phase's step. |
| The renderer | `public/battle-view.js` | Replaced `drawFormations`. Lays sides out by style, runs every figure's own cycle, the volleys' words, flashes, smoke on the wind, the gun, falls, the parley, speech, and poses a family's person (`memberPose`) for `drawFigure`. |
| Talk | `public/speech.js` | One bubble for every scene that talks. |
| The card | `public/military-attention.js` | `battle` (Watch) and `account` notices; `watchField` and `fieldWatch` in `public/app.js` frame the fight. |

### 6.2 Adding an engagement

1. Research it into `docs/battle-research/<id>.md` with a staging sheet (phases with clock times, each side's style,
   counts, fire, lines split documented/reconstructed, casualty moments, aftermath) and claim rows in its reserved block
   (§4).
2. Write `sim/battles/<id>.mjs` exporting one frozen object shaped as §6.3, and add it to `ENGAGEMENTS` in
   `sim/battle-stage.mjs`. It is checked when the module loads; a malformed one stops the server rather than a class.
3. In the director that owns the date, call `armBattle(world, id, momentOf(world, def.startKey))` every tick, date any old
   milestones from `phaseOffset`, and send the projection: `projectBattle(world, id, { members })` to the Host always and
   to a household only while one of its people is with the force (copy `directorProjection`'s Gonzales branch).
4. Put the families' people in the force: at the site, placed by `looseSlot`/`placeFrom` round the side's
   `sidePlace` as `standWithTheForce` does, recorded in `world.battles[id].participants` (`joined`, `fought`). Anybody
   recorded is held (`heldByBattle`) until `released`.
5. Write the aftermath: who goes where, the account through the person, and `participation` for glory (copy
   `advanceGonzalesFight`'s `home` branch and `gonzalesAccount`).
6. Copy the tests of §6.10 and the browser proof; inject each regression (§6.11).

### 6.3 The data

```js
{
  id, name, startKey,            // a key of the director's TIMELINE; phase 0 starts there
  claimId, outcome,              // the fixed macro-outcome, never dependent on who came
  held: name => '…',             // why somebody in the force can be given no other order
  sides: {
    texian:  { name, count, drawn /* ≤ 60 */, claimId, spread: { width, depth } /* miles */, mounted? },
    mexican: { … },
  },
  noFalling: ['texian'],         // sides the record forbids drawing down (checked against every fall)
  cannon: { side, offset: { along, across }, metal: 'iron' | 'bronze', crew, claimId } | null,
  flag:   { side, kind, offset, words, claimId } | null,
  commands: { volley: [{ text, gloss, kind, claimId? }, …] },   // the officer's words each volley
  phases: [{
    id, title, caption, claimId,
    minutes,                     // game minutes, whole
    step?,                       // calendar minutes a tick while it runs; divides `minutes` and 20; absent: not watched
    contact?,                    // true for the fighting a family's person must be in the line for
    texian:  { style, fire, action, at | from/to | keys: [[minute, point], …], face?: 'away', spread? },
    mexican: { … },
    cannon: [minuteIntoPhase, …],            // each shot, dated
    falls: [{ side, count, at, claimId, wounded?, carried? }],
    parley: { part, people: [{ side, name, mounted? }] },
    lines: [{ id, at, side, role, kind, text, gloss?, name?, claimId? }],
  }, …],
  ground: world => ({ pointName: { x, y }, …, toward }),    // every point a phase names
}
```

`action` is `stand`, `hold`, `advance`, `withdraw` or `gone`. A side on the move between keys is drawn marching
(`sideMoving`); `face: 'away'` turns it its back to the enemy.

### 6.4 Styles and fire

| Style | Laid out as | Used for |
| --- | --- | --- |
| `ranks` | two or three even ranks, 0.021 mi apart | drilled infantry |
| `mounted` | the same with horsemen, 0.03 mi apart, rank gap 0.048 | dragoons, lancers |
| `column` | files of four along the line of march | a column marching or withdrawing |
| `wall` | one rank, close | defenders along a wall |
| `loose` | scattered over `spread`, a 0.02 mi minimum gap, thicker at the front, a third kneeling | volunteers |
| `bank` | loose but shallow and wide, most kneeling | men under a riverbank |
| `street` | loose in a square | house-to-house fighting |
| `rout` | loose, wide and deep | a line that has broken |

Fire: `volley` (a rank fires together on the officer's three words, ranks in turn), `scattered` (every man on his own
3.5–12.5 s wait between loads), `picket` (a few at the front), `none`. A mounted side firing is drawn as the shot at the
rider's hands (a stand-in until a mounted firing pose exists). Every shot is a flash and a puff.

### 6.5 Talk

`kind` is `documented` (a claim ID, solid edge), `reconstructed` (dashed) or `tradition` (dashed, for disputed words
shown as disputed). A named person (`name`) may speak only a `documented` line; `checkEngagement` refuses anything else.
`gloss` is the English under a Spanish order, or a note of where a documented line comes from ("Macomb's account, in
paraphrase"). Lines are sent as the clock reaches them, and drawn at the real moment of the tick they are dated in.

### 6.6 Casualty moments

`falls` are drawn at their minute: a man going down and lying still (`*-reclining`) and, with `carried`, borne off by two
comrades; with `wounded`, sitting hurt and helped back from the line. No blood, no gore (`VISION.md` §16). A side in
`noFalling` never falls. A family's person's fate, in a battle where people died, is to be resolved at a staged moment
inside the fighting (§2.6) - not built yet, since nobody's fate is at stake at Gonzales.

### 6.7 Viewers, pacing, arrival

- **Viewers** (`FIC-GONZ-447`): the Host, live, focus `battle` while it is fought, spotlight on the field; a household
  while one of its people is at the site (with `members` naming the families' people in the force it is standing beside);
  nobody else, and a reconnect the same. The town seven miles off is told the gun in words (`FIC-GONZ-417`).
- **Pacing** (`FIC-GONZ-445`): only ever slower; lands on every phase's start; a Host's jump refuses while it is fought.
  At Gonzales the fighting (first light to the field cleared) is 36 ticks: 5:42 at Study, 2:24 at Brisk, 0:36 at Quick.
  Every step a battle uses is in `public/motion.js` `CALENDAR_STEPS`, so a tick of it is drawn as a walk, not a jump.
- **Arrival** (`FIC-GONZ-446`): the call is put only while a walk reaches the line before the first `contact` phase with
  forty minutes to spare, and is answered only then; the road ends with the men; the ford is crossed with them; nobody in
  the force is sent anywhere else by hand or by auto until `released`.

### 6.8 Aftermath

Gonzales: at the `home` phase every family's person with the men walks back to Gonzales with them (`withForce`, from
where they stood), and the family is given the account through that person - *What happened*, *What X did*, *Why it
ended so*, and what comes next (the gathering on the real map) - on the card for a day and in the journal. Participation
is `fought` for anybody in the line while it fired. Each later engagement writes its own: who comes home, who cannot.

### 6.9 Presentation evidence

`window.__battleView` (read by proofs only): figures drawn per side, their `regularity` (spread of nearest-neighbour
distance over the mean: about 0.32 loose, 0.026 in ranks), `shotsTotal`, `smoke`, `smokeInView`, `bubbles`,
`linesShown`, `members`, `memberClips`, `cannonShots`, `fallen`, `frameMs` (median and 95th percentile of the battle's own
drawing). `window.__battleCaption`, `window.__watchedField`, and `window.__camera.kind === 'battle'` while Watch holds.

### 6.10 The tests to copy

`tests/battle-stage.test.mjs` (the data rules, the clock, save and old save, the pace, nothing from the future),
`tests/battle-arrival.test.mjs` (every path to arriving late, on both maps, on foot and horse, flood, hold, auto, jump),
`tests/battle-viewers.test.mjs` (who is sent what, the alert, the gun heard, the account), `tests/battle-view.test.mjs`
(the renderer on a recording canvas: layouts, cycles, smoke on the wind, volleys' words, falls, the card), and
`scripts/battle-gonzales-browser-proof.mjs` (`npm run test:battle-gonzales`, a real class through the join flow at
1366x768 and 1024x768).

### 6.11 Proving the checks

`scripts/battle-injections.mjs` injects each regression one at a time - exact-once, CRLF-safe, restored byte for byte -
and requires the check written for it, and only it, to fail: the unit tests by name, the browser proof by its message.
Its record is `docs/evidence/battle-injections.json`.

### 6.12 Limits of wave 1

- ceiling: the dawn charge moves the whole Mexican sample, where forty of a hundred charged; the fifty Texian horsemen are
  drawn on foot. A detachment drawn apart from its side is the way out.
- ceiling: figures stand on open ground whatever is under them; the volley's rhythm is each page's own.
- A family's person is drawn in the militia's firing poses (stand-in, `docs/ART_REQUESTS.md` request 2026-09-25).
- The staged fate of a family's person inside a deadly battle is not built (none is at stake at Gonzales). Built for Béxar: §7.2.
- The town before the fight (alarm, flag, muster) is a separate build (`sim/town-scenes.mjs`).

## 6.13 The engine's additions for the south (2026-09-25, wave 2: San Patricio and Agua Dulce)

Generic and additive; nothing Gonzales uses changed its meaning. Claims: `FIC-GONZ-435`, `FIC-GONZ-436`.

| Addition | Where | What it does |
| --- | --- | --- |
| Style `camp` | `STYLES` | Men unformed: drawn lying (`*-reclining`). The staging sheet's §9 proposal. |
| A side in **parts** | `phase[side].parts: [{ id, drawn, at \| from/to \| keys, style?, fire?, action?, pose?, spread?, face? }]`; `partView`; `placeOf` | A side drawn in groups at their own places - Johnson's men on the square and in three houses, the dragoons in two groves. Each part keeps the same figures in every phase (a scattered layout per part, whatever its style), and the parts together never draw more than the side's sample (`checkEngagement`). A side with parts and no place of its own stands where its parts stand. The way out of Gonzales's detachment `ceiling:`. |
| **Poses** | `POSES`: `stand`, `asleep`, `hidden`, `surrender` | `hidden` is men shut in a house: nobody drawn, their shots a flash and a puff at its door and windows. `surrender` is hands up (`*-surrender`). |
| A fall in a part | `falls: [{ …, unit }]` (a part is a unit, as Béxar's groups are) | The part's own men go down; a fallen man **lies where he fell** while his part is marched off (`fallenSpots`). |
| Light | `phase.light` / `def.light`: `'night'`, `'dawn'` | A dark wash over the view; lit scenery and flashes glow through it (`drawNight`, `glow`). |
| Scenery | `def.scenery(ground) → [{ id, kind: 'house' \| 'campfire' \| 'grove', sprite?, x, y, lit: bool \| [phaseIds], trees?, spread? }]` | Houses, a fire, groves, drawn behind the fighting. |
| A herd | `phase.herd: { at \| keys, count, scatter? }` | A drove of horses moving with the drive and scattering in a charge (`drawHerd`). |
| Riders on the Texian side | `sides.texian.mounted` | Drawn riding (`mounted-courier-e`, a stand-in); a family's man with them too. |
| A person's part and fate | Béxar's staged fates (§7.2): `stageFate(world, id, person, { fate, unit, minute })` and `projectBattle`'s `units` and `fates` | The page is told which part each of its own people is in (`memberUnits`) and each one's fate **only from its minute** (`memberFates`); `memberPose` draws him asleep, in the house, firing, hands up (`captured`), or hit and lying still. Reconciled onto Béxar's mechanism at the merge of 2026-09-26: one staged-fate mechanism. In the renderer a side's parts are bodies keyed as groups are (`bodiesOf`). |
| Step 1 | `BATTLE_STEPS`, `public/motion.js` `CALENDAR_STEPS` | A minute a tick for San Patricio's quarter hour and Agua Dulce's charge. |

## 6.14 San Patricio and Agua Dulce Creek (built 2026-09-25, not released)

Staged from `docs/battle-research/staging.md` §4 with the owner's S1 (the map to the Nueces) and S2 (Matamoros kept, the dispute
recorded). Claims `HIST-TEX-510`–`-514`, `FIC-GONZ-435`–`-436`. The map is `docs/MAP_ACCURACY.md` §13.

| Piece | File |
| --- | --- |
| The engagements | `sim/battles/san-patricio.mjs` (night 01:00 → the square 03:00 → the houses → the last house → prisoners gathered 03:35 → 04:15), `sim/battles/agua-dulce.mjs` (the drive north 05:30 → the last hour 09:30 → the charge **10:30** → six prisoners 10:50 → 11:50) |
| The director's part | `sim/south.mjs`, called from `advanceAlamo` in `sim/directors.mjs` and from `directorProjection` (one line each) |
| The map at the save's door | `openSouth`, called from `server/storage.mjs` `readSave` |
| The join and the recall | `sim/winter.mjs` (`SERVICE.matamoros` at San Patricio, `southClosing`, `recallRefusal`) and the chore's `travel: 'south'` in `sim/chores.mjs` |

- **Arrival.** A man sent south joins at San Patricio (at Refugio on a map without the south). A man still at Refugio walks on
  (`walkOnSouth`). The join is refused, in words, once the family's quickest way would not reach San Patricio half a day before
  the raid. About six in the morning of February 20 Grant rides south with the men put in his party at the record's shares
  (`grantRides`, `JOHNSON_SHARE`) to the end of the walked road, and at 5:30 on March 2 they drive the herd north to the creek.
- **In the force.** Every man of the party at its muster when the fight is armed is put in it before the first shot, in a part:
  the square, a house, the back door; the lead, the middle or the drag of the drive. He is walked to his place at a runner's pace.
- **Fates at staged moments.** His fate is `fightSouth`'s own roll (`southFate`: `SOUTH_RATES`, frailty-weighted), so no class's
  outcome moved; the engine only chooses the moment and the part (`STAGED`, seeded). At that minute `service.fate` is set and the
  glory awarded; the page of his family draws it from then; `health` changes only with the word (`tellSouth`, unchanged). A killed
  man lies where he fell on his family's map (`service.down`).
- **Nobody can be sent for** once his fight is armed: "... is with Johnson's men at San Patricio, and nobody can reach them now";
  once it has begun or he has been resolved: "No word has come from San Patricio. Nobody can reach him now." - which says nothing
  of his fate. The card offers no recall button (`service.unreachable`).
- **Viewers.** The Host every fight live, `focus: 'battle'` from the first shot, the spotlight on the field; a family only while
  one of its people is in the force; nobody else anything.
- **The alert** at the first shot, at the man's side: "Soldiers in the square! They're at the doors!"; "Horsemen in the trees
  ahead!" (staging §4.7). With Watch.
- **Afterwards.** The escaped ride for Fannin at Goliad at once; the dead lie where they fell; the prisoners are held where they
  were taken until Agua Dulce is fought, then walked out of the walked country toward Matamoros (to `matamoros-road`). When the
  word comes (March 3, March 7) each family that had a man there is told, through somebody at home, *What happened*, *What yours
  did*, *Why it ended so*, and where the accounts disagree; the card stays a day and the journal keeps it.
- **Pace.** San Patricio's fighting (03:00-03:35) is 25 ticks, about 4 minutes at Study; Agua Dulce's charge and the minutes after
  it about 3 1/2; both nights before are watched at twenty minutes a tick.

Evidence: `tests/battle-south.test.mjs` (10), `tests/battle-view-south.test.mjs` (5), `tests/south-map.test.mjs` (6),
`npm run test:battle-south` (15 checks, `docs/evidence/battle-south-browser.json`, screenshots in `docs/evidence/battle-south/`),
`scripts/battle-south-injections.mjs` (`docs/evidence/battle-south-injections.json`).

### 6.15 Limits of wave 2

- ceiling: the horse guard at the ranch four miles out is told, never drawn; no family's man is put in it.
- ceiling: the houses, the lit windows, the groves and the herd stand where this build set them (`FIC-GONZ-435`).
- ceiling: the drive north is drawn in a straight line from the end of the walked road to the creek, within a mile of the road.
- ceiling: the prisoners' guard is not drawn marching with them; a prisoner column on the engine is the way out.
- The night, the riders, the herd and the groves are stand-ins (`docs/ART_REQUESTS.md`, request 2026-09-25 "the south's fights").

## 7. The storming of Béxar on the engine (2026-09-25, wave 2; not released)

Built from `docs/battle-research/staging.md` §3 as the owner decided in §2b.3. Claims `HIST-TEX-490`–`-496` and
`FIC-GONZ-425`–`-429`.

### 7.1 Where it is

| Piece | File | What it does |
| --- | --- | --- |
| The engagement | `sim/battles/bexar-storming.mjs` | Twenty-two phases from Milam's call (18:00 Dec 4) to Cos's army out of the town (11:00 Dec 14); the ground (`BEXAR_OFFSETS`, staged on the illustrated town's houses) and the mill (`MILL_OFFSET`, 0.45 mile north, read by `sim/army.mjs` `SIEGE_CAMPS.mill`). |
| The director's part | `sim/bexar-fight.mjs` | The walk in from the mill at three (`goIn`), each man in his unit (`placeInTheTown`, `unitFor`), his fate at its moment (`FATE_DAYS`, `fateMoment`), the alerts (`EPISODES`), the Host's spotlight (`SPOTS`), who is sent what (`bexarProjection`) and the account (`bexarAccount`). Called from `advanceStorming` in `sim/directors.mjs`, which dates `bexar-roll`, `assault`, `milam-killed`, `reinforce` and `cos-marches` from the phases, shuts Milam's call at the roll and no longer makes the white flag wait on `ugartechea`. |
| The storming's fates | `sim/army.mjs` `stormingFate`, `resolveStormer` | The one roll `fightStorming` always made, read when a man goes in and applied at his moment; `fightStorming` resolves whoever is left at the flag. |
| Tests | `tests/battle-bexar.test.mjs`, `tests/battle-bexar-view.test.mjs`, `tests/support/bexar.mjs` | A class at the eve of December 4 in seconds; the rules, the clock, arrival, fates, viewers, the account, saves. |
| Proof | `scripts/battle-bexar-browser-proof.mjs` (`npm run test:battle-bexar`) | A real class through the page, 1366x768 and 1024x768; `docs/evidence/battle-bexar-browser.json`. |
| Injections | `scripts/battle-bexar-injections.mjs`, `-list.mjs` | `docs/evidence/battle-bexar-injections.json`. |

### 7.2 What the engine gained (generic, additive; every field optional)

- `phase.groups`: bodies drawn apart from their side (`{ id, side, name, count, drawn ≤ 40, style, at | from/to | keys, fire,
  action, cover?, face?, away?, civilians?, mounted? }`), projected as `view.groups`; a phase may draw at most 170 figures.
  `civilians` never fire and are never drawn falling. A line or a fall may name its `unit`.
- `cover` on a side or group: `loophole` (inside a house: only one man in four is drawn, the rest are flashes and smoke at the
  wall), `roof` (stood up on the house), `barricade`, `sandbags` (the cover drawn in front).
- `def.guns` and `phase.guns`: guns standing on named ground, each shot dated (`[minutes]`) or at an interval through a
  background phase (`{ every, from?, to? }`), projected with their shots so far and fired once each by the page.
- `phase.breaches`: a door or wall worked at from `from` and broken at `at`; `phase.flags` (`kind: 'white'`); `fall.point` and
  `fall.name` for a fall the record puts on a named man at a place (Milam); `def.fallsLinger` (days-long fights carry their
  fallen off); `phase.frame`/`def.frame` (the ground a page is framed on; `battlePoints` in `public/app.js` reads it).
- `phase.background`: calendar minutes a tick at most (whole twenties) while a played family has somebody in the force
  (`watchedByAFamily`); with nobody, and between any two phases, `battleStep` still lands a tick on the next watched phase.
  `BATTLE_PACES` joins `BATTLE_STEPS` in `public/motion.js` `CALENDAR_STEPS` (120 added).
- **Staged fates** (§6.6's gap): `stageFate`, `fatesDue` and `world.battles[id].fates`; `projectBattle`'s `units` and `fates`
  options send `memberUnits` and, only once each minute has come, `memberFates`; `memberPose` draws the member hurt or lying
  still at that moment. Built for Béxar; a Concepción builder adding the same should reconcile on merge.
- `directorProjection` takes `{ seen }` (who this page already sees; `sim/world.mjs` passes its `others`).

### 7.3 Numbers

Held episodes, at Study (9.5 s a tick): the entry 27 ticks (4.3 min, with the roll), Karnes, the yard and Milam 19 (3.0 min), the Priest's
House 16 (2.5 min), the flag 12 (1.9 min) - about 12 real minutes, measured by `tests/battle-bexar.test.mjs`. Between them,
with a played family's man in the town, about 47 background ticks (7.4 min); Milam's call and Cos's march out add about 12
(1.9 min). Before this the storming cost about nine campaign ticks. The page draws the storming in at most 6.4 ms at its
slowest 95th percentile in headless Chrome (median 2.1 ms).

### 7.4 Limits

- ceiling: one fight projected at a time (`directorProjection` takes Béxar's while it is fought); December is not October.
- ceiling: night is not drawn; the entry and the Priest's House are fought in the day's own light (art request).
- ceiling: a class saved at the mill before 2026-09-25 keeps its camp a mile out; its men walk the extra half mile.
- ceiling: the reserve's man at the mill watches the storming as the town does; he is never sent in unless he says yes to the
  companies of the 8th.
- The card line for a man still lying wounded at Béxar on February 23 (`HIST-TEX-493`) is not built.
- The illustrated town is not a survey: the houses are staged on its nearest houses and never labelled.
## 8. San Jacinto on the engine (2026-09-25/26, not released)

Staged from `docs/battle-research/staging.md` §8 with the owner's §2b and the recommended J1, J3, J4. Claims `HIST-TEX-522`–`-527`
and `FIC-GONZ-441`–`-444` (the staging sheet's proposed `-517`–`-519`/`-438` belong to the south's and Coleto's blocks).

### 8.1 Where it is

| Piece | File | What it does |
| --- | --- | --- |
| The engagement | `sim/battles/san-jacinto.mjs` | Seventeen phases from noon April 20 (`san-jacinto-field`) to the word at noon April 23; the ground placed from Lynchburg's point by longitude and latitude (`sanJacintoGround`, null on a map without Lynchburg). |
| Its director | `sim/san-jacinto.mjs` | Who is in camp and in the line (`advanceSanJacinto`), each fate staged at its minute (`strikeSanJacinto`, on §7.2's `stageFate`), the two alerts, the guns heard at Lynchburg, the Host's spotlights, the projection (`sanJacintoProjection`) and the account (`tellSanJacintoAccounts`, `sanJacintoAccount`). `sim/directors.mjs` only calls it. |
| Arrival | `sim/houston.mjs` `inTheLine`, `leftWithBaggage`, `fightSanJacinto`, `joinEstimate`; `sim/winter.mjs` `joinService`; `sim/chores.mjs` `join-houston` (`fromFlight`, `estimate`, `begin`); `sim/road.mjs` `withFamily`; `sim/scrape.mjs`; `sim/town.mjs` `observedBy` | staging.md §8.6 fixes a–h. |
| Tests | `tests/battle-san-jacinto.test.mjs`, `tests/battle-view-san-jacinto.test.mjs`, `tests/support/san-jacinto.mjs` | |
| Proof | `scripts/battle-san-jacinto-browser-proof.mjs` (`npm run test:battle-san-jacinto`) | A real spring class, the father pressed to join from the refuge on the panel, 1366x768 and 1024x768. |
| Harness | `scripts/san-jacinto-injections.mjs` → `docs/evidence/san-jacinto-injections.json` | |

`momentOf(world, 'san-jacinto')` is now the `volley` phase (16:30, unchanged) and `santa-anna-taken` the `taken` phase (12:00
April 22, unchanged).

### 8.2 The phases

`arrive` 12:00 Apr 20 (60 min, step 20) · `camped` (180) · `skirmish` 16:00 (60, step 10: Sherman's horsemen as a group, one
hurt) · `night` (960: the breastwork) · `morning` 09:00 Apr 21 (120, step 20: Cos's column in, Deaf Smith's party out for
Vince's bridge, the Host's spotlight on the bridge) · `waiting` (270: "siesta" said as the Handbook's word) · `parade` 15:30
(30, step 5) · `advance` 16:00 (24, step 2: the tune named as tradition, both versions, no sound) · `guns` 16:24 (6, step 2,
contact) · `volley` 16:30 (2, step 1) · `charge` 16:32 (6, step 1: "Remember the Alamo!" / "Remember Goliad!", documented) ·
`rout` 16:38 (10, step 1: both sides `rout`, a share with hands up, "Me no Alamo!" as tradition) · `killing` 16:48 (100, step
20: figures fall in the marsh and lie still, §2b.2) · `prisoners` dusk (60, step 20) · `search` (992) · `taken` 12:00 Apr 22
(60, step 20: Santa Anna before the wounded Houston, the prisoners' documented "¡El Presidente!", neither named man given
words) · `held` (1380, to the word). From the volley to the killing is Houston's eighteen minutes.

### 8.3 What the engine gained (generic, additive)

Built on §7.2 (Sherman's, Cos's, Deaf Smith's and Lamar's men are `groups`; the Twin Sisters and the Mexican gun are
`def.guns` on named ground; a man's fall is `stageFate`/`memberFates`), plus:

- style **`camp`** (a force at rest: scattered, a third sitting, fires nothing);
- **`works`** (`breastwork` with its opening for the gun, `fires`, `marsh`, `water`), each `from`/`until` a phase, laid across
  the line between the camps;
- per-phase side `count`, `ragged` ranks, a `surrendering` share drawn with hands raised; `parley.at` (a named point) and a
  person's `pose: 'injured'`; `commands.bySide` (the Texian officers' own words for a volley);
- `rankSlot` (a family's man in a formed line; an undrilled man lags his rank while it walks);
- `startsAt(id, resolve)`: the clock holds to a fight's step before its record exists (an old save opened mid-charge);
  `resolveTimeJump` (`sim/time.mjs`) crosses an engagement's unwatched hours but not a watched phase;
- step 1 (`CALENDAR_STEPS` gains 1);
- renderer: the fallen and the surrendering pinned where they fell while their side runs on, a later fall never landing on a
  man already down, a Texian horseman drawn riding, `drawWorks`.

### 8.4 Arrival (FIC-GONZ-442)

In the line = serving with Houston, at the Lynchburg camp, not travelling, not sick or wounded, not left with the baggage.
At `houston-lynchburg` every well man is force-marched there (by noon on the 20th); a sick or hurt man stays with the baggage
at Harrisburg (J1), `present`. A joiner keeps the camp he reached and follows at the forced march; one too late is told the
place he reached. `join-houston` may be started from the refuge or the family's road (J4) and says when he would be with the
army. A serving man is never counted with his refugee family (not taken by the column, not fed or sickened with it). A
serving man not in the line is said as what he was (`service.absent`: `baggage`, `camp`, `road`) and released at the word.

### 8.5 Viewers, alerts, aftermath (FIC-GONZ-443, -444)

A family with a man in the camp is sent the battle from noon on the 20th; its man is alerted through twice (the armies meet;
the parade, "Parade under arms. We're going at them this afternoon."), each with Watch, before contact. From the parade he is
held (`heldByBattle`) and in the ranks; his fate is rolled at the volley and, if killed or hurt, staged at his own minute of the
charge, sent to his family and the Host only; the panel and journal wait for the word. Another family standing at Lynchburg
does not see the men on the field (`observedBy`) and hears the guns in words. The Host is sent it live, focus `battle` in
watched phases, spotlights on the field, the bridge and the capture. At the word each family with a man with the army gets
the plain-words account (through him, or if he fell through the family's next person), `tellSanJacinto` releases the men home,
`turnHome` sends the refugees back, and the class's last words (`scrape-end`) say how the war ended. The ending's rules are
unchanged.

### 8.6 Numbers

Noon April 20 to the word: 18–19 ticks before, 83 after (measured on `houston-class`, with and without a played family) -
**about +10 real minutes at Study**, +4:20 at Brisk, +1:05 at Quick. Of the 65 held ticks the fighting (guns → killing) is 26,
4:07 at Study.

### 8.7 Limits

- ceiling: the field's points are read from the record's words, not surveyed; figures stand on whatever the map has there.
- ceiling: the regiments walk as one block with Lamar's horse as a group; the Twin Sisters are drawn only once they take their
  station.
- ceiling: a man still on the road to the army when the word comes walks on to it and stands released there.
- ceiling: a man sick or hurt at an older camp when the army marches is left there, not carried to Harrisburg.
- Stand-ins: the Twin Sisters, the camp at rest, the breastwork, the Texian horsemen, the marsh (`docs/ART_REQUESTS.md`,
  request 2026-09-25 "San Jacinto").
