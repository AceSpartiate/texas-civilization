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
3. The later engagements on the engine, each with its aftermath.
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
- The staged fate of a family's person inside a deadly battle is not built (none is at stake at Gonzales). Built for
  Concepción and the Grass Fight in wave 2: §7.
- The town before the fight (alarm, flag, muster) is a separate build (`sim/town-scenes.mjs`).

## 7. Wave 2: Concepción and the Grass Fight (2026-09-25, not released)

Staged from `docs/battle-research/staging.md` §1 and §2, every question at its recommended answer (C1 (a), Grass G1 (a)).
Claims `HIST-TEX-480`–`-484`, `FIC-GONZ-420`–`-424`.

### 7.1 Where it is

| Piece | File | What it does |
| --- | --- | --- |
| Concepción | `sim/battles/concepcion.mjs` | Eleven phases from the division leaving Espada at 14:00 Oct 27 (the director's new `detachment-out`) to the burial at 14:00 Oct 28; the fog lifts at 8:00 (the director's `concepcion`). Fannin's company the main body under the bank; Bowie's companies, Coleman's men crossing the open, the cavalry and the main army as groups; the gun taken and turned. |
| The Grass Fight | `sim/battles/grass-fight.mjs` | Eight phases from Deaf Smith at 10:00 Nov 26 (`grass-alarm`) to the men back at the mill at 13:35; Bowie's charge at 11:00 (`grass-fight`). Bowie's horsemen the main body; Jack's infantry, the ditch, the sortie with its gun, Swisher's men and the pack train as groups. |
| The director's part | `sim/concepcion-grass.mjs` | The departures, the families' people stood in their part of the force, each fate at its moment, the alerts, the main army coming up, the rejoining, the accounts, and `campaignBattleProjection` (called from `directorProjection`). |
| The army | `sim/army.mjs` | `concepcionFate` / `grassFate` (the old rolls, per person), `resolveConcepcionFighter`, `resolveGrassFighter`, `rejoinRanks`, `followTheArmy`, `armyArrivalWords`; the ranks leave anybody `withAForce`. |

### 7.2 What the engine gained (additive; Gonzales is drawn exactly as before)

- **`groups`** in a phase: a body of a side drawn apart (its own key, count, sample, style, fire, place by `at`/`from`/`to`/`keys`,
  `faceTo` a point). Projected as extra entries in `sides` carrying `group`; a fall or a line may name a `group`.
- **`gun`** in a phase: `false` (not on the field), or `{ side, group, at }` (with a group, or standing where it was taken).
- **`fog: [from, to]`** in a phase, and **`scenery(ground)`** on an engagement (sprites, clips and a water ribbon the map lacks).
- **`battleStep`** lands an unwatched phase (a night in camp) exactly on the next watched phase's start.
- **`projectBattle(…, { fates, memberGroups })`**: a family's person's fate is sent only once it has fallen; which body they stand in.
- **`withAForce`**: anybody in any engagement's `participants` not yet released.
- The renderer: bodies keyed by `group || side`; a `bank` figure loading drawn a third of a figure lower; the fallen pinned
  where they fell; the member's own fate pose and carriers; the fog veil; the scenery; a `packhorse` figure; the gun's crew by
  side; a fixed gun. `window.__battleView` adds `groups`, `regularityBy`, `fog`, `scenery`, `memberFates`.
- `public/app.js`: a side that has gone is not framed.

### 7.3 Arrival, participation, aftermath

- **Concepción**: the question stays open until the division leaves Espada; the division's people leave the ranks and walk
  with it; they are under the bank before the alarm and in the line while it fires; nobody in it can be ordered away until it
  rejoins the army at Concepción at 10:00 (the main army comes up from 8:00). Late volunteers follow the army from the
  rendezvous or Victoria; the turn-out card says when they would catch it, and whether too late. The account comes through the
  person when the division rejoins; the main army's families are told their man came up after it.
- **The Grass Fight**: a yes goes to Bowie (horse with him) or Jack (on foot) and out with them; the question shuts at the
  ride-out; the men come back to camp; one who runs is on the road home at once. The account comes when the fuller word
  rides home (December 3), as the owner's §7b rule has it.
- **Fates** (`FIC-GONZ-422`): at Concepción a hit falls at a gun discharge while crossing the open; at the Grass Fight at
  Bowie's first exchange (a rider) or the ditch's first volley (Jack's).
- **Viewers** (`FIC-GONZ-424`): the Host; a family in the force; a family in the army nearby from when the firing is heard.

### 7.4 Pace

Fighting (first contact to the last contact phase): Concepción 27 ticks, the Grass Fight 22 ticks - **4:16 and 3:29 at
Study**. Whole engagements: Concepción 48 ticks (was about 2), the Grass Fight 49 (was about 6 to 18): together about
**+12 to +14 real minutes** on a class at Study.

### 7.5 Limits of wave 2

- ceiling: the bend and the creek beds are placed by their distance from Béxar and the mission, not on the map's own water.
- ceiling: the second, heavier gun at Concepción and the padre's carts are told in the caption, not drawn.
- ceiling: a follower is aimed at where the army stands when he sets out.
- Bowie's riders are drawn on foot riding out, their horses brought along behind (stand-ins listed in docs/ART_REQUESTS.md).
- A fate's health shows on the family's panel the moment it falls, before the Grass Fight's word rides home (the old roll
  did the same at the fight).
