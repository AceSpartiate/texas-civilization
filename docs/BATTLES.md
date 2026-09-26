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

**Decided by the owner, 2026-09-26, by multiple choice** (put after the south, the Alamo, Concepción, Coleto and San Jacinto were
built):

7. **Agua Dulce Creek is placed twenty-six miles below San Patricio, per the Handbook of Texas (TSHA)** — not Wikipedia's
   point near Banquete, about ten miles out, which the south's build had used. The record gives no bearing, so the distance is
   the walked road's own: the ground is where the least-effort road south from San Patricio measures 26.0 miles (-97.81,
   27.639), a mile and a third short of the end of the walked road where Grant's men wait with the horses. So the drive north
   is short: Grant's party sets out at half past eight (it was half past five) and the charge stays at half past ten; Grant's
   ride south on February 20 is to the same road's end and did not change. The creek the map's NHD calls Agua Dulce is crossed
   by the road about sixteen miles out, not at the ground; the account and `HIST-TEX-512` name the Handbook's placement as the
   one chosen and the other as the dispute. A class saved with the ground near Banquete has it moved at the save's door while
   Grant's drive has not begun (`sim/south.mjs` `moveAguaDulce`); one that has fought there keeps it. No `saveVersion` bump.
8. **The prisoners taken at San Patricio and Agua Dulce are walked south out of sight.** They are seen marched away down the
   road south and at its end (`matamoros-road`) are gone from the map (`service.offMap`: not drawn, not seen by another family
   there, the camera let go) — not left standing at the road's end. Their fate is told later, with the word, and its dispute
   (`HIST-TEX-510`).
9. **Recorded, no change:** Béxar's between-episode pace (`background`) holds the class only while a played, present family has
   a man in the town (`watchedByAFamily`); with nobody there the storming's quiet hours go at the class's own pace.
10. **Recorded, no change:** a family whose man is killed at Béxar learns it from the victory news on December 15
    (`bexar-victory`, `tellStorming`), not at the moment he falls.

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

6. **Emily West is included** (owner, 2026-09-26: "include Emily West"). A free woman of color from New York who came to
   Texas in 1835 under a contract to work for James Morgan at New Washington; taken by the Mexican army when Santa Anna
   burned New Washington on April 16, 1836, and in the Mexican camp at San Jacinto; she applied for a passport to go home
   to New York in 1837 (to be checked against sources before shown). Named on the map and followed along that itinerary
   like the others. The "Yellow Rose of Texas" story — that she kept Santa Anna occupied in his tent when the Texians
   attacked — rests on one hearsay note written years later (Bollaert, 1842) and is widely doubted: it is shown only as
   `tradition`, in plain words fit for a middle-school class, never as the record and never sexualized. Her dignity and
   her constrained choices are kept as `VISION.md` §15 asks; she is a person with her own story, not a device of the
   battle. **How the tradition is staged** (owner, 2026-09-26, by multiple choice, after being told the concern that she
   was a captive and flirting can read as her choosing her captor): on the afternoon of April 21, a picnic laid out in
   Santa Anna's tent area, and she flirts with him — kept light and non-physical: talk, laughter, a meal served — so he is
   there when the attack comes. Captioned as a story told later, with the dashed `tradition` edge; the caption also says
   she had been taken by his army at New Washington five days before. Her flirting lines carry a stage direction in the
   bubble — *sarcastically*, or the like (owner: "maybe in the chat bubbles where emily is flirting with santa anna it says
   *sarcasticly* or something like that?") — so a class reads that she is playing a part with her captor, not sincere.

   **Implemented art and staging, 2026-09-26:** Emily has a yellow-dress, uncovered-hair directional sheet and a four-pose seated picnic conversation; Santa Anna has paired conversation and alarm poses, and the camp has separate tent and meal props (`scripts/art-deliveries/famous-people.mjs`, `famous-picnic.mjs`). `legendScene` begins at 13:00 on April 21 near the Mexican camp and ends after the first guns. Its battle caption and dashed on-map label say this is a later story. The real outcome does not depend on the scene, and no invented words are attributed to either named person (`HIST-TEX-560`, `FIC-GONZ-560`).

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
inside the fighting (§2.6) - built for the Alamo (§7.2), where it is.

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
- The staged fate of a family's person inside a deadly battle is not built (none is at stake at Gonzales). Built for Béxar: §7.2; San Jacinto (§8), the Alamo (§9), Concepción and the Grass Fight (§10) and Coleto and Palm Sunday (§11) use the same
  path.
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
| The engagements | `sim/battles/san-patricio.mjs` (night 01:00 → the square 03:00 → the houses → the last house → prisoners gathered 03:35 → 04:15), `sim/battles/agua-dulce.mjs` (the drive north 08:30, 05:30 until §2b.7 → the last hour 09:30 → the charge **10:30** → six prisoners 10:50 → 11:50) |
| The director's part | `sim/south.mjs`, called from `advanceAlamo` in `sim/directors.mjs` and from `directorProjection` (one line each) |
| The map at the save's door | `openSouth`, called from `server/storage.mjs` `readSave` |
| The join and the recall | `sim/winter.mjs` (`SERVICE.matamoros` at San Patricio, `southClosing`, `recallRefusal`) and the chore's `travel: 'south'` in `sim/chores.mjs` |

- **Arrival.** A man sent south joins at San Patricio (at Refugio on a map without the south). A man still at Refugio walks on
  (`walkOnSouth`). The join is refused, in words, once the family's quickest way would not reach San Patricio half a day before
  the raid. About six in the morning of February 20 Grant rides south with the men put in his party at the record's shares
  (`grantRides`, `JOHNSON_SHARE`) to the end of the walked road, and at 8:30 on March 2 (5:30 before §2b.7 moved the ground to the
  Handbook's twenty-six miles, a mile and a third from the road's end) they drive the herd north to the creek.
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
  were taken until Agua Dulce is fought, then walked out of the walked country toward Matamoros, and at the end of its road
  (`matamoros-road`) pass out of sight, gone from the map (§2b.8; `service.offMap`). When the
  word comes (March 3, March 7) each family that had a man there is told, through somebody at home, *What happened*, *What yours
  did*, *Why it ended so*, and where the accounts disagree; the card stays a day and the journal keeps it.
- **Pace.** San Patricio's fighting (03:00-03:35) is 25 ticks, about 4 minutes at Study; Agua Dulce's charge and the minutes after
  it about 3 1/2; San Patricio's night before is watched at twenty minutes a tick, and so is Agua Dulce's hour-long drive (four
  hours until §2b.7, nine ticks fewer now).

Evidence: `tests/battle-south.test.mjs` (11), `tests/battle-view-south.test.mjs` (5), `tests/south-map.test.mjs` (8),
`npm run test:battle-south` (16 checks, `docs/evidence/battle-south-browser.json`, screenshots in `docs/evidence/battle-south/`),
`scripts/battle-south-injections.mjs` (`docs/evidence/battle-south-injections.json`).

### 6.15 Limits of wave 2

- ceiling: the horse guard at the ranch four miles out is told, never drawn; no family's man is put in it.
- ceiling: the houses, the lit windows, the groves and the herd stand where this build set them (`FIC-GONZ-435`).
- ceiling: the drive north is drawn in a straight line from the end of the walked road to the ground, within a mile of the road.
- ceiling: the Agua Dulce ground is the Handbook's distance along the road (§2b.7), not a point on the creek the map's NHD draws.
- ceiling: a prisoner out of sight keeps his last place on the server (the end of the road south); nobody is shown it, and a
  march to Matamoros beyond the walked country is the way out.
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

## 9. The Alamo on the engine (2026-09-25, not released)

The siege and the assault, staged from `docs/battle-research/staging.md` §5 with the owner's §2b.1 and §2b.5 and the recommended
answers to A1 and A2. Claims `HIST-TEX-500`–`-506` and `FIC-GONZ-430`–`-434` (the siege's own stay in `-054`–`-058`, `-430`–`-439`,
`FIC-GONZ-380`–`-386`). Built on the engine as Béxar left it (§7): its groups, fixed guns, frames, background pace and **its one
path for a person's fate at its moment** (`stageFate`, `fatesDue`, `projectBattle`'s `fates` and `units`) - the Alamo keeps no
second one.

### 9.1 Where it is

| Piece | File | What it does |
| --- | --- | --- |
| The engagement | `sim/battles/alamo.mjs` | 38 phases from the army's coming at 2:30 on February 23 to the evening of March 6: the arrival, the red flag and the 18-pounder's answer, a day and a night for each day of the guns, the huts on the 25th, the relief before dawn on March 1, Bonham and the north battery on the 3rd, the guns stopping at ten on the 5th, the columns forming in the dark, then `advance`, `alarm`, `repulse`, `north-wall`, `fallback`, `rooms`, `end`, `after`. Written side by side and handed to the engine as groups (`toEngine`). Ground in the compound's plan feet (`ALAMO_FEET`). Imports nothing. |
| Posts and walking | `sim/alamo-posts.mjs` | Each fighter's post on a wall by a seeded share (`choosePost`, `POST_WEIGHTS`), a woman's or child's in the church; the routes from the south gate to every spot, found by the plan's own path-finder and held to it by a test; the walk (`advanceWalks`), one straight line a tick; `leaveBy` and `endShortOf` for the couriers' and the relief's roads. Replaced the hashed plaza spot (`postOf`, `takePost` in `sim/alamo-runner.mjs` use it). |
| The director's part | `sim/alamo-battle.mjs` | Every tick of the second period: arms the engagement and enlists the garrison and the relief as its `participants`, walks the garrison, rides the relief in with its company (`followTheRelief`, `leftBehind`), stages each fighter's fate through `stageFate` at the minute the storming reaches his post (`fallMinute`) and applies it through `fatesDue`, the cards (`sendCards`), the Host's spotlight (`lightTheHost`), and what each page is sent (`alamoProjection`, `watchersOf`). Three lines in `advanceAlamo` and `directorProjection`. |
| The rules it keeps | `sim/alamo.mjs` | Couriers ride out through the gate (`rideOut`); the relief rides to wait short of the lines and goes in with its company (`reliefRides`, `reliefEnters`); the honest estimate on the order (`reliefEstimate`); `stormAlamo` only the backstop; `tellFall` brings the account in plain words (`FALL_ACCOUNT`) and tells a courier's family too. |

### 9.2 What the engine gained (generic, additive, on §7's)

- On a group: `ladders`, `climbing` (drawn ladders carried, and set against a wall with a man going up), `figure: 'rider'`.
- On a gun: `canister` (a cone of smoke and dust thrown out in front), `name`.
- On a phase: `people` (a named person where the record puts them, with a claim, falling at a minute if they did; a named line
  is drawn over them), `light` (0 day to 1 night, or `[from, to]`), `plumes` (smoke going up far off).
- On an engagement: `smokeScale` (its smoke against its figures: a small place seen close), `frameTight` (its frames already
  hold the room round them), `holdsParticipants: false` (its force is held by its own rules, so the Alamo's garrison can still
  answer Travis's runner), `landOnEnd` (a tick lands on its last minute, so the class leaves on its calendar's grid), and
  `flag.at` with `kind: 'red'` (a flag on a fixed place, never drawn with the Come and Take It cloth).
- `battleStep` lands on an engagement's first minute when its first phase is held only at a background pace and a played family
  is already in the force. `layoutSide`: a wall of a given length (`spread.width`) is laid evenly along it, and a small party's gap
  shrinks with its ground. The page never draws a family's fallen man standing again, never keeps the camera on him
  (`isMember`, `seenFall`), and the storming's card goes up over the quiet "inside the Alamo" reminder (never over a question).

Gonzales and Béxar project and draw as before.

### 9.3 The living siege, and what it costs

A day of the siege (6:00–18:00) is held at four hours a tick and a night goes at the class's pace, the army's coming, the huts and
the relief closer - all as Béxar's `background` pace, so **only while a played, present family has somebody in the garrison,
inside, or riding with the relief** (`watchedByAFamily`, `FIC-GONZ-431`). The assault is held for everybody (`step`), the longest
held fight. Measured by `tests/battle-alamo.test.mjs` (a man on auto so the courier days' own pace is not counted): **145 ticks from February 23 to the assault with somebody inside against 110 with nobody (the south's two fights, held for everybody, fall inside the siege and are in both): 35 more, 5.5 real minutes at Study** (2.3 at Brisk, 0.6 at Quick); the assault **42 ticks, 6.6 real minutes at Study** for every class, against Gonzales's 36.

### 9.4 Arrival and participation (staging.md §5.6 (a)–(h))

(a) The relief is never set down: it rides at a horse's pace (a man with no horse is lent one, `ceiling:`) to a place on the
Gonzales road half a mile short of the lines, waits, rides with its company to the gate between three and four on March 1 and walks
to posts. (b) A man sent who is not in Gonzales at two is told the company rode without him; one still on the road at four is told
he was left behind and turns home. (c) The order says, before anybody goes, how long the road to Gonzales is on foot and on the
horse and whether that is in time. (d) Couriers ride out through the gate onto the Gonzales road, and one in Gonzales before the
relief rides may be sent back in with it from there (`alsoFrom`). (e) A relief man may still be chosen a courier on March 3 or 5
(Smith's precedent) - `docs/ALAMO_FATES.md` is amended. (f) Families nobody plays answer the runner at once, as before. (g) Posts on
the walls. (h) Nobody reaches Béxar after February 23 by any other road, as before.

### 9.5 What is shown and to whom

The Host always, live, its camera on the compound while a held phase runs, its spotlight at the army's coming, the huts, the relief
and the storming. A family while one of its own is inside or with the relief near the walls. Nobody else. Cards at the person's
side, with Watch, at the army's coming, the relief and the storming - none before the alarm. The student whose man is inside sees
him at his post, firing with his wall, and going down when the storming reaches it (§2b.1); the journal and the family's record
learn nothing until the word (March 11 rumour, 13th confirmed at Gonzales, that evening elsewhere); the student who watched is
given what they saw on the card; the word brings the account in plain words (what happened, where he was, why it ended so, the
doubted stories named as doubted). Talk: "¡Viva Santa Anna!" (documented grade, no name), Travis's words from Joe's account at the
north battery, Joe's own "Yes, here is one." - every other line reconstructed, no named person. The degüello and the line in the
sand are never staged.

### 9.6 Evidence

`tests/battle-alamo.test.mjs` (13), `tests/battle-alamo-view.test.mjs` (7), the Alamo tests updated where the rules moved
(`tests/alamo.test.mjs`, `tests/alamo-runner.test.mjs`: fates now fall by seven, and the man walks in before the runner walks to
him); `npm run test:battle-alamo` (`docs/evidence/battle-alamo-browser.json`); `npm run test:battle-alamo-injections`
(`docs/evidence/battle-alamo-injections.json`). Same computer only.

### 9.7 Limits

- ceiling: the garrison drawn about one to five, the columns one to thirty; the family's own are always drawn one to one.
- ceiling: routes found once from the plan and kept as numbers; the church and the palisade are reached round the palisade's end,
  where the plan leaves an opening.
- ceiling: a relief man without a horse keeps the company's pace on one it lends him, which is not an entity.
- The map's closest zoom holds the compound at about 120–160 pixels across; figures are symbols larger than life, so a wall of men is
  a crowded line. A closer camera for the compound is the way out.
- Night is a wash (stand-in); ladders are strokes (stand-in); the lancers carry no lances (stand-in). `docs/ART_REQUESTS.md`,
  request 2026-09-25 — the Alamo.
- Not built: the noncombatants killed in the storming (`HIST-TEX-433`, the existing `ceiling:`); the executions shown (told only);
  Dickinson, Joe and Ben as travellers to Gonzales (the word at Gonzales on the 13th stands for them); Bowie drawn.

## 10. Concepción and the Grass Fight on the engine (2026-09-25, wave 2; not released)

Staged from `docs/battle-research/staging.md` §1 and §2, every question at its recommended answer (C1 (a), Grass G1 (a)).
Claims `HIST-TEX-480`–`-484`, `FIC-GONZ-420`–`-424`.

### 10.1 Where it is

| Piece | File | What it does |
| --- | --- | --- |
| Concepción | `sim/battles/concepcion.mjs` | Eleven phases from the division leaving Espada at 14:00 Oct 27 (the director's new `detachment-out`) to the burial at 14:00 Oct 28; the fog lifts at 8:00 (the director's `concepcion`). Fannin's company the main body under the bank; Bowie's companies, Coleman's men crossing the open, the cavalry and the main army as groups; the gun taken and turned. |
| The Grass Fight | `sim/battles/grass-fight.mjs` | Eight phases from Deaf Smith at 10:00 Nov 26 (`grass-alarm`) to the men back at the mill at 13:35; Bowie's charge at 11:00 (`grass-fight`). Bowie's horsemen the main body; Jack's infantry, the ditch, the sortie with its gun, Swisher's men and the pack train as groups. |
| The director's part | `sim/concepcion-grass.mjs` | The departures, the families' people stood in their part of the force, each fate at its moment, the alerts, the main army coming up, the rejoining, the accounts, and `campaignBattleProjection` (called from `directorProjection`). |
| The army | `sim/army.mjs` | `concepcionFate` / `grassFate` (the old rolls, per person), `resolveConcepcionFighter`, `resolveGrassFighter`, `rejoinRanks`, `followTheArmy`, `armyArrivalWords`; the ranks leave anybody `withAForce`. |

### 10.2 On the one engine (Béxar's pieces used; what these two add, additive)

Concepción and the Grass Fight use the pieces the storming of Béxar built (§7.2) and nothing parallel to them: `groups`
(Bowie's companies, Coleman's men, the cavalry and the main army; Jack's infantry, the ditch, the sortie, Swisher's men and
the pack train), falls and lines by `unit`, `guns` standing where the record puts them (Concepción's brass gun at eighty
yards, and the same gun turned by its takers; the sortie's gun), and **one per-person fate path**: the fate is decided from
the army's existing roll when the man joins the force and staged with `stageFate`, applied when `fatesDue` says its minute
has come, and sent to a page by `projectBattle`'s `fates` only from that minute; `units` names the body each man stands in.
What they add:

- **`fog: [from, to]`** in a phase. The south's `scenery(ground)` (§6.13) is used, and draws besides a ribbon of water, a clip and a
  sprite at its own size (the river and the creek, the pecans and mesquite, the cut bank and the mission the map lacks).
- A side may face a named point (`face: '<point>'`, as a group does).
- **`withAForce`**: anybody in any engagement's `participants` not yet released; the army's ranks leave them to the fight.
- The renderer: a `packhorse` figure; a `bank` figure loading drawn a third of a figure lower than one firing; the south's
  `fallenSpots` for every body, not only parts, and kept after a body has left the field; a man who runs drawn going the other
  way; the fog veil. `window.__battleView` adds `regularityBy`, `fog`, `scenery`.
- `public/app.js`: a side or group that has gone is not framed.

### 10.3 Arrival, participation, aftermath

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

### 10.4 Pace

Fighting (first contact to the last contact phase): Concepción 27 ticks, the Grass Fight 22 ticks - **4:16 and 3:29 at
Study**. Whole engagements: Concepción 48 ticks (was about 2), the Grass Fight 49 (was about 6 to 18): together about
**+12 to +14 real minutes** on a class at Study.

### 10.5 Limits of wave 2

- ceiling: the bend and the creek beds are placed by their distance from Béxar and the mission, not on the map's own water.
- ceiling: the second, heavier gun at Concepción and the padre's carts are told in the caption, not drawn.
- ceiling: a follower is aimed at where the army stands when he sets out.
- ceiling: a family's man killed at Concepción lies where he fell; he is not drawn carried under the bank as Andrews was (a
  carrying pose is the way out).
- Bowie's riders are drawn on foot riding out, their horses brought along behind (stand-ins listed in docs/ART_REQUESTS.md).
- A fate's health shows on the family's panel the moment it falls, before the Grass Fight's word rides home (the old roll
  did the same at the fight).

## 11. Coleto and Palm Sunday on the engine (2026-09-25, wave 3; not released)

Built from `docs/battle-research/staging.md` §6–§7 with the owner's answers K1 (nobody new joins Fannin), K2 (a man with his
horse may ride with Horton and get away), K3 (all three assaults, about ten real minutes), G2 (a man still wounded cannot
run) and §2b.2 (the massacre drawn as the battles are, no gore). Claims `HIST-TEX-515`–`-521`, `FIC-GONZ-437`–`-440`. Built on
§7's engine: its `groups`, `guns`, `flags` and staged fates, reconciled on merge rather than kept twice.

### 11.1 Where it is

| Piece | File | What it does |
| --- | --- | --- |
| Coleto | `sim/battles/coleto.mjs` | Sixteen phases, 09:00 March 19 to 14:00 March 20: the march out in fog, the halt, caught, the square, three assaults with the pauses between, dusk, the night (four hours a tick), the small hours, first light, the guns at 6:15, the surrender, the march back. The Texians in a `square`; the Jiménez battalion as the Mexican side's own body with the riflemen, grenadiers and cavalry as `groups` round it, loose in the grass at night; four corner guns and a two-gun battery (`guns`); the white flag (`flags`). `coletoSlot` places a family's man in the column, with Horton, or in a face of the square. |
| Palm Sunday | `sim/battles/goliad-massacre.mjs` | Nine phases, 18:00 March 26 to 10:00 March 27: the evening (the song; Francita Alavez bringing men out, a named townswoman with no words), the night, the muster, three columns on three roads (the Victoria road's the side's own body, the others `groups`), the volleys (nothing said, no volley words), the escapes to the river timber, the wounded killed inside, the burning told. `massacrePlace` places a man by his fate. |
| The director's part | `sim/fannin.mjs` | Every tick of the spring (`advanceColeto`, `advanceMassacre`, from `sim/directors.mjs` `advanceScrape`): the men with Fannin enlisted and walked with the column; Horton's scouts; each fate staged (`stageFate`) from the old rolls and applied when due (`fatesDue`); surrender, prisoners, the march back; the cards, what each page is sent and the accounts (`fanninProjection`, called beside `bexarProjection` in `directorProjection`; `tellFannin` at `massacre-word`). |
| Timeline | `sim/directors.mjs` | New `fannin-marches` (09:00 Mar 19) and `goliad-eve` (18:00 Mar 26); `coleto`, `goliad-surrender` and `goliad-massacre` dated from the phases. `fightColeto`/`goliadMassacre` (sim/houston.mjs) now take only anybody the engine did not. |
| Recall | `sim/winter.mjs` `FANNIN_MARCHES` | 09:00 on the director's clock (it was 06:00 read off the raw minute: shut at noon on the 18th). |
| The map | `scripts/build-colonies-map.mjs` | A `coleto` field at the marker; the Goliad–Victoria road laid in two legs through it (only that road changed; checked by decoding). A class saved before keeps its map and the ground falls back to the marker's offset from Goliad. |

### 11.2 What the engine gained (generic, additive), and what it took from §6.13 and §7

Coleto and Palm Sunday use §7's `groups`, `guns`, `flags` and staged fates (`stageFate`, `fatesDue`, `memberFates`) and
§6.13's `light` (the night wash) and side `pose: 'surrender'`; neither keeps a mechanism of its own for those. Added:

- **`square`** style: four faces of three ranks facing out, carts inside, fire by faces in turn and each face by its ranks; a
  member in it faces out of his own face; a hurt man is drawn brought in among the carts.
- **`dusk` and `fog`** as lights: a lighter wash than §6.13's night. `ceiling:` only while a fight is shown.
- **Per-phase `count`, `drawn`, `name`** on a side; `uncounted` sides (no number sent or labelled); `face` naming a ground point;
  `commands[side].volley` (a side's own volley words); `named` groups labelled.
- **Held steps of 60 and 240** as well as divisors of twenty: a march or a night held alike for every class (a `background`
  pace holds only while a played family is in the force, and the ticks after would fall on other minutes).
- **`lyingOnField`**: a staged fate with `lies: true` puts `fallen: true` on the man's own family's entity until the word, so
  he is drawn lying where he fell; `hollowness` in the page's evidence; §6.13's rule that a fallen man lies where he fell now holds
  for every body of men, not only parts; facing two places on one spot is east, not nowhere.

### 11.3 Pace (Study, 9.5 s a tick)

Coleto 85 ticks (about 13 real minutes; the fighting, caught to the third assault and the guns, 58 ticks, about 9); Palm
Sunday 44 ticks (about 7). Before, the spring spent about 12 ticks on those hours. Both end on the spring's four-hour clock so
the army's April marches land as they did (`tests/battle-coleto.test.mjs`).

### 11.4 Limits

- ceiling: four of Fannin's nine guns are drawn; Horton's riders are drawn on foot; the night is drawn only while a fight is.
- ceiling: the three roads leave Goliad in the direction of the places they go to; their first half-mile is not surveyed.
- ceiling: a man killed at Coleto lies (on his family's map only) where he fell until the word of April 1.
- ceiling: one fight projected at a time (Béxar's, then Fannin's; they never overlap).
- stand-ins: the marksmen prone, unarmed prisoners, Alavez's figure, the carts (`docs/ART_REQUESTS.md`, request 2026-09-25
  "Coleto and Goliad"); the white flag is §7's.

## 12. Every engagement on one engine (2026-09-26, the integration; not released)

The Alamo (§9), Concepción and the Grass Fight (§10) and Coleto and Palm Sunday (§11) were built on branches beside San Jacinto
(§8) and merged into one tree, in that order. Ten engagements, one engine, one renderer:

- **One staged-fate path.** Every director stages a person's fate with `stageFate` and applies it when `fatesDue` says so; the
  page is told it only from its minute (`projectBattle`'s `fates`). No engagement keeps a second mechanism.
- **One projection path, one fight at a time.** `directorProjection` asks, in order: Gonzales; Concepción and the Grass Fight
  (only when nothing else is sent); Béxar; the south (before the Alamo, so San Patricio and Agua Dulce are what is shown while
  they are fought inside the siege); Fannin's fights (Coleto, Palm Sunday); the Alamo (only when nothing else is sent); San
  Jacinto. Alerts and accounts are taken from whichever has one.
- **Light** is a word or a number. A named light (`'night'`, `'dawn'` - §6.13's dark with lit windows; `'dusk'`, `'fog'` - §11's
  lighter wash) is sent as the word; the Alamo's light (0 to 1, or eased `[from, to]` across a phase) is sent as a number, never
  an array. The page's evidence reports either.
- **The fallen.** One rule for every body: a fallen man's spot and side are kept where he went down (`fallenSpots`,
  `fallenSide`), so he lies there while his side runs on (§8) and after his body has left the field (§10); the pin (`pinnedAt`)
  keeps only men giving up where they gave up. (Merged, the two branches' rules both held the dead and each hid the other's
  regression from the harnesses.) Each fall takes men still up, chosen once and kept on the fall (`fallenBySide`), so many
  falls add up and a body gone from the field still has its dead. `tests/battle-view-groups.test.mjs` holds it.
- **Framing** (`battlePoints` in `public/app.js`): an engagement's own frame (tight where it says so, the Alamo); else its sides,
  its groups (not a body gone from the field, unless nothing else is left; not a party more than a mile off, San Jacinto's
  Deaf Smith riding for Vince's bridge) and its guns.
- **Layouts:** the Alamo's `wall` of a given length and Coleto's `square` both; a member stands in for the nearest sampled man
  (on a wall only the one he stands in); a square's man faces out of his own face. Volley words come from `commands.bySide`
  (San Jacinto) or `commands[side]` (Coleto) or `commands.volley`.
- **The clock** (`battleStep`): lands on the next held phase however many unheld ones lie between (§9), on an engagement's last
  minute where it says `landOnEnd`, on a first phase held only at a background pace while a played family is in the force, and
  holds a fight not yet recorded that its director says has started (`startsAt`, §8). Held steps of 60 and 240 (§11).

**What the battles cost a class** (`scripts/battle-class-time.mjs`, `docs/evidence/battle-class-time.json`): a whole class of 5 or of
15 families nobody plays runs from the arrival through all three periods to the ending in 1,370 ticks - about 3 hours 37
minutes at Study (9.5 s a tick). The ticks the fights hold add 532 of them, **about 84 real minutes at Study**: Gonzales 6.9,
Concepción 7.3, the Grass Fight 7.7, Béxar 14.3, the Alamo 7.9 (and the south's two fights inside its siege 5.2 and 6.0),
Coleto 12.3, Palm Sunday 6.3, San Jacinto 10.3. Main before this merge ran 1,117 ticks (2 h 57 min), so the three merged
branches add about 40 minutes. A played family's man in Béxar's town or the Alamo's garrison adds its `background` pace on top
(§7.3: about 7.4 minutes; §9.3: about 5.5).
