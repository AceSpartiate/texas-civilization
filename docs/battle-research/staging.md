# Staging every later conflict: Concepción to San Jacinto

**What this is.** The staging sheet `docs/BATTLES.md` §5 step 2 asks for, one per later engagement, written for the builders of
`sim/battle-stage.mjs`, `sim/battles/<id>.mjs` and `public/battle-view.js`. It says where each fight stands on the map, how it
unfolds in phases with times, how each side stood and moved, what was said, when people fell, how a family's person gets there
in time and takes part, who tells the family to watch, what happens after, what art is missing, and which claims to register.
**Research and design only: no code was changed.** Nothing here is registered in `HISTORY.md`; §10 of each engagement proposes
rows in the reserved blocks.

**Binding frame.** `docs/BATTLES.md` §2 (the eight decisions under "build it reasonably") and §3 (the contract), `VISION.md` §4,
§15, §16, §17, `docs/MILITARY_EXPERIENCE.md`, `docs/ALAMO_FATES.md`. Where this sheet recommends something that §2 already
decided, §2 wins; where it needs an owner's choice, it asks (§x.11 of each engagement).

**How it was researched (2026-09-25).** The six files in `docs/battle-research/` are the spine; their sources and trust levels
stand and are not repeated. New sources opened on 2026-09-25, each through a fetching tool that returns a summary of the page
with quoted sentences (so **check wording against the page before any of it is quoted to a class**), are listed in §12 at the
end. The code was traced line by line on commit `a9dbc36`; line numbers below are that commit's.

**Labels used throughout.** **DOCUMENTED**: written at the time by someone in a position to know. **STRONGLY SUPPORTED**: careful
secondary work, or several independent later accounts that agree. **TRADITION**: told for a long time, weak or late in its
sourcing, or admitted in part invented. **DISPUTED**: sources disagree. **RECONSTRUCTED**: this sheet's own reading, typical of
the force and period, not found in a source for this fight. **COMPUTED**: arithmetic done here.

**Time.** Times are local solar time as the sources give them. Where this sheet computed sunrise or sunset it says so. "Game
minute" means a minute of the 1835–36 calendar on the director's `TIMELINE` (`sim/directors.mjs` L44–130; every key is offset by
`ARRIVAL_MINUTES = 1080`, L140, through `momentOf`, L148). "Real time at Study" assumes the Study pace of 9.5 real seconds a tick
(`docs/MILITARY_EXPERIENCE.md`); `docs/BATTLES.md` §2.2 asks for the fighting phases to play **3–6 real minutes** at Study.

**Speech data.** Every line below is written in the shape `public/speech.js` draws (commit `a9dbc36`):
`{ text, gloss?, kind: 'documented' | 'reconstructed' | 'tradition', claimId?, speaker: { role, side?, name? } }`. A named
historical person is given only words a source gives him. `speech.js` has no `disputed` kind; a disputed line is `tradition`
with its dispute in the claim row, or it is not spoken at all (each case says which).

---

## The one-line answer

- **Concepción, 28 Oct 1835.** Ninety-two mounted volunteers, camped in a river bend below a five-to-six-foot bank, are ringed
  in fog by Ugartechea's cavalry at about half an hour after sunrise; when the fog lifts about 8 a.m. Mexican infantry forms a
  line two hundred yards off and charges three times behind a brass gun firing canister at eighty yards; the Texians fire from
  the lip of the bank and drop under it to load, shoot the gun crew down three times, take the gun and turn it; one Texian,
  Richard Andrews, is killed crossing open ground. The main army, six miles back at Espada, arrives half an hour to an hour
  after it is over. **Today the detachment never leaves Espada and the fight is one dice roll at 8 a.m.**; the fix is to march
  Bowie's men to the bend on the 27th and stage the morning.
- **The Grass Fight, 26 Nov 1835.** Bowie's forty horsemen catch a pack train a mile west of Béxar near the Alazán and both sides
  fight dismounted from dry creek beds; Jack's hundred infantry, trotting out in double file, are ambushed from a mesquite ditch
  at forty to sixty yards, charge it and clear it; a sortie from the town with one gun fires three rounds of canister and goes
  back in. Nobody is killed. The packs hold grass. **Today the fighters stay in the mill camp and the fight is rolled at about
  4 p.m., six hours after the alarm**; the fix is a ride-out at the alarm and a fight about midday.
- **The storming of Béxar, 5–9 Dec 1835.** About 210–300 volunteers go into the town before daylight in two divisions and fight
  for four days and nights through stone houses: loopholes, rooftops, trenches across streets, crowbars through walls; Milam is
  shot in a yard on the 7th; the Priest's House on the plaza falls the night of the 8th; a white flag comes out at dawn on the
  9th. The reserve at the mill is never hurt. **Today everyone stays at the mill and is rolled at the white flag**; the fix is to
  put the fighters in the town and stage four held episodes with the town fighting at a slower background pace between.
- **San Patricio (27 Feb) and Agua Dulce (2 Mar 1836).** Two small disasters in the south: Urrea's dragoons fall on Johnson's men
  asleep in the houses of San Patricio at 3 a.m. in the cold, and three days later ride down Grant's party, strung out behind a
  horse herd, from two groves by Agua Dulce Creek. Most are killed or taken; a few ride for Goliad. **Today the men never leave
  Refugio and San Patricio is off the walkable map**; the fix needs an owner's choice about the map.
- **The Alamo assault, 6 Mar 1836.** Four columns with ladders, crowbars and axes move on the walls in the dark about 5–5:30;
  shouts of "¡Viva Santa Anna!" and the bugles give them away; canister stops them and they re-form and drift into a mass at the
  north wall, which they climb; the defenders fall back into the long barrack and the church and are killed room by room, and
  men who run are cut down by lancers outside; it is over in an hour to ninety minutes, about sunrise. **Today the garrison
  stands on the plaza at hashed posts and `stormAlamo` sets a fate in one update**; the fix is posts on the walls and a staged
  hour, with the owner's question about watching a death before the word (§5.11).
- **Coleto, 19–20 Mar 1836.** Fannin's column, slowed by oxen and nine guns, is caught on open prairie short of the Coleto timber
  and forms a hollow square three ranks deep with guns at the corners; three Mexican assaults are beaten off until dark, then
  sharpshooters in the grass fire all night on men with no water; at dawn Mexican artillery opens and Fannin surrenders. **Here
  the Texians are the ones in rows, and the Mexicans end in loose order.** **Today Fannin's men never leave Goliad**; the fix is
  a Coleto place and a march out.
- **The Goliad massacre, 27 Mar 1836.** At sunrise on Palm Sunday the unwounded prisoners are marched out in three groups on
  three roads, halted half to three-quarters of a mile out and shot at close range; the wounded and Fannin are killed in the
  presidio; 28 escape by running for the river timber; about twenty are spared as doctors, orderlies, interpreters and
  mechanics, many at the pleading of Francita Alavez. **Recommended depiction: the march out is seen, the volleys are heard far
  off, no one is seen to fall; the escapes are seen as men running into the timber; the numbers and the burning are told
  afterwards in words** (§7.5).
- **San Jacinto, 21 Apr 1836.** At half past three Houston parades 910 men and they walk across the prairie, screened by a rise,
  against a camp resting after a long march; the two six-pounders open at two hundred yards on a five-foot breastwork of packs
  and saddles; the line fires, runs forward shouting "Remember the Alamo!" and "Remember Goliad!", and in eighteen minutes
  breaks into a mob chasing a routed army into the marsh and Peggy Lake, where the killing goes on long after resistance ends.
  **Here the Mexicans are the ones in disorder.** **Today presence is only a service record, a man mid-march or at an old camp
  still "fights", and a man at Lynchburg can be captured with his refugee family on the 20th**; the fixes are in §8.6.

---

## 0. Conventions every engagement below uses

**The phase record.** Each engagement's §x.2 table is the data a `sim/battles/<id>.mjs` file needs: phase id, start (game time),
length in game minutes, what happens, and whether the time is DOCUMENTED or RECONSTRUCTED. The **held** column is the
`militaryMinutes` cap the phase asks for (`sim/military-pacing.mjs` L41–56), so a phase plays for about the real time given
at Study. "Held" never runs the clock *faster* (`docs/BATTLES.md` §2.2).

**The style words** are `docs/BATTLES.md` §3's: `ranks`, `loose`, `wall`, `bank`, `street`, `column`, `mounted`, `rout`. Two more
are needed and are proposed in §9: `square` (Coleto) and `camp` (a force at rest and not formed, San Jacinto and San Patricio).

**Drawn counts.** A force of up to about 120 is drawn one figure to one man. Above that, a sample: one figure for every 3–10
men, chosen per engagement so the screen reads as the real proportion between the sides. Nothing in a sample is a person
(`FIC-GONZ-006`); a family's own people are drawn in the force at their own positions.

**Spanish orders.** The words of command in the Spanish infantry regulation of 1808 (*Reglamento para el exercicio y maniobras
de la infantería*, Madrid, Imprenta Real; OCR read 2026-09-25 at archive.org, item `A053320148`) include **PREPAREN LAS ARMAS**
("make ready"), **APUNTEN** ("aim"), **FUEGO** ("fire"), **ARMEN LA BAYONETA** ("fix bayonets"), **MARCHEN** ("march"), **ALTO**
("halt") and **ARMAS AL HOMBRO** ("shoulder arms"); it forms infantry **in three ranks** (tallest in the first) and speaks of
**fuegos graneados** (fire at will, each man in turn). That the regulation says these words is DOCUMENTED. That the Mexican army
of 1835–36 drilled by this regulation or a close descendant is **RECONSTRUCTED**: it inherited Spanish practice, but the
Alamo Studies Forum's specialists (read 2026-09-25) could not name the Mexican manual in use in 1836 and describe it as
French-influenced. Every Spanish order below is therefore `kind: 'reconstructed'` with its English `gloss`. Cavalry and camp
calls (`¡A caballo!`, `¡Pie a tierra!`, `¿Quién vive?`, `¡Centinela, alerta!`, `¡Ríndanse!`) are period-standard Spanish,
**not** checked in a manual, and RECONSTRUCTED. Company music is on record: each fusilier company "to have two drummers and a
fifer, while the cazadores and granaderos were assigned three trumpeters" (Sons of DeWitt Colony, *Soldados Mexicanos*, read
2026-09-25; medium trust). Calls are drawn as a bugle or drum sound with a caption ("the bugle sounds the charge"), not as
words, unless a source gives words.

**Texian talk.** No source gives the Texians' orders as words for any of these fights except where marked. Their reconstructed
calls are plain frontier English: short, practical, unmilitary (`"Keep under the bank!"`, `"Load, and wait for them!"`).
**Taunts** are reconstructed, generic, never attributed to a named person, never slurs, and fewer than the orders. Worried talk
is allowed and makes the scene human.

**Falling (`docs/BATTLES.md` §2.3).** A man hit stops, drops to a knee or sits (`*-injured-rest`), and a killed man lies still
(`*-reclining`, the reclining pose the library has); no blood, no wound shown, no body closer than the camera's battle framing.
The wounded are carried after the fighting, two men to one (a stretcher pair is on the manifest's "further production work"
list; stand-in: two `*-carry` figures walking beside a `*-injured-rest` figure). **A family's own person's fate resolves at the
staged moment named in each §x.5**, from the roll the code already makes; the moment, not the odds, is what changes.

**The alert (`docs/BATTLES.md` §2.7).** A card carried by a person, with **Watch**. When the family's person is at the front, the
card is **at that person's side** — the words of somebody beside him (a picket, a sergeant, a runner) — and does not claim that
a rider reached home (`docs/MILITARY_EXPERIENCE.md`: "A request inside the fort is explicitly at that person's side"). It never
steals the camera mid-drag or mid-command and never stacks on an open decision. Each §x.7 gives who carries it, when, and the
card's words.

**What watching teaches.** Watching is the person's own viewpoint. It does not put knowledge into the household's reports or
the journal: those still wait for the word (`HIST-TEX-439`'s rule, `docs/ALAMO_FATES.md` "No fate before the word"). §5.11 asks
the owner the one case where this bites hardest.

---

## 1. Concepción, 28 October 1835

Research: [concepcion.md](concepcion.md) (§4 the battle; sources Bowie and Fannin's report, Austin, Bryan, Smithwick, Creed
Taylor, Barr). Registered: `HIST-TEX-019` to `-024`, `FIC-GONZ-039`.

### 1.1 Ground and positions

| Thing | Where, in the map's terms | Status |
| --- | --- | --- |
| Mission Concepción | `MISSIONS.concepcion` = `{ dx: 0.06, dy: 2.32 }` miles east and south of the `bexar` point (`sim/army.mjs` L330–333); Wikipedia's coordinate is `+0.15, +2.28` (bexar-storming.md §3.7), within 0.1 mile. **Not a map site**; an offset only. | DOCUMENTED place |
| The Texian camp: a bend of the San Antonio River, a bottom 50–100 yards deep under a bank 5–6 feet high, timber on two sides, the river behind | "within about five hundred yards of the old mission" (report); "a quarter of a mile above the old mission", "on the east side" (Smithwick); 500 yards west of the mission with its arms about 100 yards apart (Hardin via Wikipedia). **Place it at the nearest bend of the map's own San Antonio River within 0.25–0.3 mile north-west of the mission point**, the bank on the bend's outer (plain) side, the river at the men's backs. | Ground DOCUMENTED in kind; the spot RECONSTRUCTED (the site is not archaeologically fixed) |
| Mexican infantry line (from about 8 a.m.) | about **200 yards** off the Texians' right flank, on the "nearly level" plain | DOCUMENTED (report) |
| The brass gun | about **80 yards** from the bank, in front of the infantry | DOCUMENTED |
| Mexican cavalry | "five companies" across the front and both flanks, and at a distance all round in the fog | DOCUMENTED |
| The second, heavier gun | further back, "at a distance"; fires three times near the close and is taken off by six mules | DOCUMENTED |
| Seven lookouts | in the mission's cupola; the pickets cut off there fire from its roof | DOCUMENTED |
| The horses | tied in the bottom under the bank, "out of range" | DOCUMENTED |
| The main army | at Mission Espada, `MISSIONS.espada` = `{ dx: 1.24, dy: 7.35 }`, about 5.5 map miles south; "about six miles" (Barr) | DOCUMENTED |
| The Mexican retreat | west and north across the shallow river toward Béxar | DOCUMENTED (Smithwick) |

**Camera.** Host spotlight and Watch frame the field, never the town (`docs/BATTLES.md` §2.1): in the fog phase a frame about
0.6 × 0.45 mile holding the bend, the mission's towers and the cavalry ring; from 8 a.m. a tighter frame about 0.3 × 0.2 mile
from the bank to the gun, with the infantry line at its edge; at the aftermath widen south to show the main army coming up the
river road. The existing spotlight key `'concepcion'` (siteId `'bexar'`, `sim/directors.mjs` L745–755) frames Béxar and must
move to the bend.

### 1.2 Phases

Sunrise on 28 October at Béxar is about **6:10–6:25 local time** (COMPUTED here from the latitude and the equation of time;
concepcion.md §4.4 computed about 6:50, and the difference is in how solar and mean time were read). The report's anchors are
"about half an hour by sun" and "about eight o'clock".

| Phase | Starts | Game min | What happens | Status | Held (real time at Study) |
| --- | --- | --- | --- | --- | --- |
| `night` | Oct 27, sundown | — | Half a dozen cannon shots from Béxar at sundown, nobody hurt; men sleep on their arms, horses tied, seven in the cupola, pickets out. "The night passed quietly off." | DOCUMENTED | not held (camp) |
| `breakfast` | Oct 28, ~5:45 | 60 | Jerked beef and cornbread; horses saddled for a scout of the town; fog comes down thick. | Taylor (memoir) | not held |
| `alarm` | ~6:50 | 5 | Cavalry advance guard rides onto the line in fog, fires on the sentinel just relieved (Henry Karnes); his powder horn is shot away. Camp called to arms. | DOCUMENTED | 20 s |
| `ringed` | ~6:55 | 65 | Surrounded; fired on "at a distance, with no other effect than a waste of ammunition". Men cut away brush and cut steps in the bank with knives, climb, fire, drop back to load. A man falls with a sick stomach: a ball broke the knife in his waistband. | DOCUMENTED; the length RECONSTRUCTED between the report (~40–60 min) and Barr (~2 h) | ~75 s |
| `fog-lifts` | ~8:00 | 10 | Fog rises. Mexican infantry forms line about 200 yards from the right; cavalry across the front and flanks. "The engagement was immediately general." | DOCUMENTED | 30 s |
| `charges` | ~8:10 | 20 | The brass gun opens with grape and canister at about 80 yards; **the charge is sounded**. Three charges; the gun fires five times; its crew is shot down three times. The canister goes high: pecans rain down. Bowie moves Coleman's company from the north side to support Fannin's; some cut across the open. Andrews is hit. | DOCUMENTED in outline; order within RECONSTRUCTED | ~150 s |
| `retreat` | ~8:30 | 15 | **Retreat is sounded.** The Texians go up the bank, take the gun and turn it on the retreating troops; the second gun fires three times at long range and is got off by six mules; men ride off two or three to a caisson mule; the infantry wades the river toward Béxar; the cavalry takes almost no part. | DOCUMENTED | ~60 s |
| `aftermath` | ~8:45 | 60+ | Quiet; men give water to the Mexican wounded left on the field. | DOCUMENTED (Taylor, Smithwick) | not held after the main army is in |
| `main-army` | ~9:15–9:45 | 30 | The main army comes up from Espada, 30–60 minutes after the retreat; "the other boys" loud at having missed it. A padre comes out from the town with carts and takes the Mexican dead and wounded, after talking with Austin. | DOCUMENTED | not held |
| `burial` | afternoon–evening | — | Andrews dies after several hours, having "lived long enough to know that the fight was won"; buried under a pecan. | DOCUMENTED (memoirs) | not held |

**Total held fighting ≈ 5½ real minutes at Study**, inside §2.2's 3–6.

### 1.3 Formation style and counts

| Phase | Texian | Mexican |
| --- | --- | --- |
| `ringed` | **`bank`**: 90–92 men, drawn 1:1. **South side** Fannin's company (about 51, by subtraction); **north side** Bowie with Coleman's, Goheen's and Bennet's (41). Each man on his own cycle: climb the cut step, fire over the lip, drop, load under the bank. **No flag, no drum** ("we fought at Conception without a flag, and without the beat of even a drum", Taylor): draw none. | **`mounted`**: dragoons at 150–300 yards all round, in company knots, firing from the saddle at long range, largely unseen in the fog (a figure is drawn only inside the fog's visible radius). |
| `fog-lifts` to `charges` | **`bank`**, now firing at the line and the gun; Coleman's men **moving along under the bank**, a few cutting across the open (this is where Andrews falls). | Infantry **`ranks`** (a line; the regulation's three ranks is RECONSTRUCTED; draw two or three), firing by rank on the officer's word; for each charge the line goes forward as a **`column`** of attack behind the gun and falls back. Cavalry in **`mounted`** blocks across front and flanks, not charging home. Guns served by a crew of about six (draw six; three times shot down and replaced). |
| `retreat` | **`loose`**: up the bank, onto the gun, turning it; firing at will. | **`rout`**-lite: the infantry breaks back across the river in disorder; guns limbered and pulled off by mules; cavalry withdrawing in order. |

**Counts.** Texian **90–92** (DOCUMENTED). Mexican **275 with two guns (Barr)** to **"three hundred cavalry and one hundred
infantry... with two pieces of cannon" (Austin)** — DISPUTED; draw about **100 infantry figures (1:1)** and about **50 dragoon
figures (1:4 of 200)**, which keeps the documented "at least four to one" look without asserting a number.

**The owner's instinct, honestly.** Right for the Mexican infantry (a formed line and charges on a bugle). Wrong for the
Texians only in that their disorder had a shape: they were **under a riverbank**, rising to fire and dropping to load, in two
company groups on two sides of the bend.

### 1.4 Talk

| When | Speaker | Line | Kind, source |
| --- | --- | --- | --- |
| `alarm` | picket (Texian) | "Horsemen in the fog! They've fired on Karnes!" | reconstructed |
| `ringed` | Texian, any | "Keep under the bank!" / "Cut steps — here, with your knife." / "Don't waste powder on the fog." | reconstructed |
| `ringed` | Texian, worried | "How many are out there?" / "Can't see ten yards." | reconstructed |
| `ringed` | the man with the broken knife, unnamed | "I'm hit — no. The knife took it." | reconstructed (the event is Taylor's and Barr's; the name "Pen Jarvis" is Taylor's alone: do not name him) |
| `fog-lifts` | Mexican officer | "¡Preparen las armas!" — *Make ready!* / "¡Apunten!" — *Aim!* / "¡Fuego!" — *Fire!* | reconstructed (regulation of 1808) |
| `charges` | bugle (Mexican) | caption: *The bugle sounds the charge.* | **documented** ("a charge is sounded", Bowie and Fannin; `HIST-TEX-020`) |
| `charges` | Mexican officer | "¡Armen la bayoneta!" — *Fix bayonets!* / "¡Marchen!" — *March!* | reconstructed |
| `charges` | Texian, any | "The gunners! Pick off the gunners!" / "Load and wait for them!" | reconstructed |
| `charges` | Texian, worried/wry | "That's pecans, not grape!" | reconstructed from Smithwick's "raining a shower of ripe nuts down on us" |
| `charges` | Texian taunt | "Come on, then!" | reconstructed |
| `retreat` | bugle (Mexican) | caption: *The bugle sounds the retreat.* | **documented** ("Retreat is sounded", report) |
| `retreat` | Texian | "The gun! Take the gun!" / "Turn it on them!" | reconstructed |
| `aftermath` | Texian | "Give him water." | reconstructed from Taylor and Smithwick |

Bowie, Fannin, Karnes and Andrews speak nothing: no source gives them words for this morning.

### 1.5 Casualty moments

- **Rates in code:** `CONCEPCION_DEATH_RISK = 0.01`, `CONCEPCION_WOUND_RISK = 0.02` (`sim/army.mjs` L344–345), each fighter
  rolled on his own by `rollFates` (L407–417) with `frailty` (L390–395, weight 0.4–1.6). Only the detachment (`'go'`) is rolled;
  the main army is `present` (`HIST-TEX-021`).
- **When:** every roll resolves during **`charges`**, at the gun's discharges (five, spaced across the 20 game minutes). A
  killed or wounded family person is one who, in the drawing, is **crossing the open with Coleman's company** at that discharge:
  exposure, not frailty, is what the record shows (concepcion.md §6.1). A wounded one sits under the bank; a killed one lies
  still where he fell, **in the open between the two companies**, and is carried under the bank by two men in `retreat`.
- **The Mexican side:** about 15 drawn infantry figures fall across the three charges (the "15 or 16 dead on the field" that
  Austin and Bryan counted, scaled to the drawn sample), and the gun crew three times; the carts take them in `main-army`. No
  number is shown on screen (`HIST-TEX-020`: "Show Mexican losses as 'many'").
- **Horses:** "a few horses" were lost (Austin). A family horse tied in the bottom could be hit by the long-range fire; not rolled
  today; a question for a later pass, not this sheet.

### 1.6 A family's person: arrival and participation

**How a person gets to the army today** (`sim/army.mjs`, `sim/calls.mjs`, `sim/directors.mjs`):

1. A settlement's call (`sim/calls.mjs` `offerCalls` L87–101, `handleCall` L149–188) sends a volunteer to a gather point
   (`SETTLEMENT_CALLS` L31–72: San Felipe, Mina, Liberty and Victoria families gather at Gonzales; Matagorda and Columbia at
   Victoria), with the `volunteer` commitment.
2. At `organised` (Oct 11 16:00) `formArmy` (`sim/army.mjs` L75–85) and `fallIn` (L88–109) take every volunteer at Gonzales or
   within `FALL_IN_MILES = 1.5` (L37) of the army.
3. `march` (Oct 13 08:00) runs `marchOut` (L164–175), which sets `army.siteId = null`; from then only the 1.5-mile test admits
   anybody. The army walks `ARMY_MILES_PER_DAY = 14` (L34), held at the Cibolo, the Salado and Espada (`HOLDS`, L335).
4. `detachment` (Oct 22 08:00, `sim/directors.mjs` L730–736) opens the question "Does {name} go with them, or stay with the main
   army?" (`openDetachment` L423, `askDetachment` L430–448; unplayed families go at `0.23`, L420). `to-espada` (Oct 26 08:00,
   L737–743) closes it (`closeDetachment` L472).
5. `concepcion` (Oct 28 08:00, L745–755) calls `fightConcepcion` (`sim/army.mjs` L499–551): members who answered `'go'` fought,
   every other member was present.

**Every way a person is late, misses it, or is resolved without taking part today:**

| # | Case | Where | Effect |
| --- | --- | --- | --- |
| a | **The detachment never goes to Concepción.** Fighters stay in the ranks at Espada (`standInTheRanks` L129–148); the killed are laid at the Concepción offset only after the roll. | `fightConcepcion` L499–551 | The family's person does not arrive anywhere; the fight is a roll |
| b | A volunteer who reaches Gonzales after Oct 13 stays there "waiting to be made into an army"; **nothing moves a latecomer toward the army**. | `fallIn` L92–95; `marchOut` L169 | Never joins |
| c | Coast volunteers gather at Victoria; the army is never within 1.5 miles of Victoria. | `SETTLEMENT_CALLS` L31–72 | Never joins |
| d | A volunteer sent to Béxar by the `travel` action arrives at the town point; the Concepción camp is 2.32 miles off, outside `FALL_IN_MILES`. | `fallIn` L94–95 | Not a member at the fight |
| e | A member who joins after `to-espada` is never asked; counted present. | `closeDetachment` L472 | Present, not fought |
| f | With nobody attended, a campaign tick of 720 minutes can land the fight up to 12 hours late (the barrier still stops it, but the phase shape is lost). | `militaryMinutes` L41–56; `CALENDAR_SCALE.campaign` (`sim/clock.mjs` L48) | A late roll |
| g | A call stays open after the army marches, so a family can still "turn out" on Oct 25 with no warning that the man will miss everything. | `offerCalls`; `expireCalls` only at `bexar-end` (`sim/directors.mjs` L876) | Sent, and cannot arrive |

**What should change** (by offer, departure and pace, never the date):

1. **Split the army on October 27.** Add a timeline key **`detachment-out`** at **Oct 27 14:00** (Barr and the order book: the
   detachment passed San Juan and San José that afternoon). At it, the `'go'` members leave the army's ranks and **walk with a
   new formation, `world.battles.concepcion.detachment`**, from Espada to the bend (about 5.5 map miles; at 3 mph they are there
   by sundown). They camp in the bottom under the bank at posts by company (Fannin's south, Bowie's north), drawn in the
   `bank` style. The main army stays at Espada until `main-army`, then marches up (arriving 30–60 game minutes after `retreat`).
   The `concepcion` moment becomes the battle's `alarm` (~6:50), not 8:00, and `fightConcepcion`'s roll is replaced by the
   staged resolution in §1.5.
2. **Keep the detachment question open until `detachment-out`**, not `to-espada`. Bowie's order of Oct 27 took "the first
   division of Captain Fannin's company and others attached" (order book): a man who came up to Espada on the 26th or 27th
   could still be attached. `askDetachment` from `fallIn` then covers every late joiner at Espada.
3. **Latecomers follow the army** (owner question C1, §1.11). A volunteer at the rendezvous, or arriving there, after the army has
   marched is started along `campaignRoad` (L355–377) after it, at his own pace (foot 21, horse 35 miles a day on campaign
   ticks, `sim/travel.mjs` L37–59), with a line in the record that he is following; `fallIn`'s 1.5-mile test then takes him in
   (as `catchUpCamp` does for Houston's camp, `sim/houston.mjs` L171–178). The Oct 26 order that reinforcements "turn off at the
   Cibolo and follow a trail blazed to Espada" (concepcion.md §3) is the documented precedent.
4. **Victoria's gatherers march on to the army**, as Alley's company went from Goliad to the Salado by Oct 23 (concepcion.md
   §3.2), by the Goliad–Béxar road.
5. **Honest offers.** Every turn-out card after Oct 13 computes the arrival at the army's current or next hold with
   `awayProjection` (`sim/sight.mjs` L99–109) and says it in words ("A man on horseback would reach the army on the Salado about
   the 24th"). **If he cannot reach Espada by Oct 27 14:00, the card says he will not be in time for anything the army does
   before the end of the month** — the offer stays valid, and the refusal is honest (valid refusal, CLAUDE.md).
6. **Hold the clock** from `detachment-out` through `retreat` for any class with a played family's person in the detachment,
   using the phase caps in §1.2 (not the 720-minute campaign tick).

### 1.7 Alert

- **Evening of Oct 27, at the person's side, by the company's sergeant** (a reconstructed figure; not a named man): card *"Bowie's
  men are camped in the river bend by Mission Concepción, a mile and a half below the town. The Mexican guns fired from Béxar at
  sundown. The captains say sleep on your arms tonight."* No Watch yet (nothing to see).
- **At `alarm` (~6:50), at the person's side, by the picket:** *"Mexican horsemen have come out of the fog and fired on the
  picket. {Name} is under the riverbank with Bowie's men."* — **Watch** frames the bend.
- **For a family whose person is with the main army at Espada**, at `fog-lifts`: *"Firing up the river toward Concepción. The
  army is getting ready to march."* — **Watch** frames the field (they can hear it, §2.1), and at `main-army` follows their
  person up the road.
- **Nobody else** is alerted; the rest of the class learns by the word (`HIST-TEX-024`: San Felipe had it in three days, wrong in
  detail). Note that the code today tells every family the same day (`FIC-GONZ-039`, "the public word of the fight on the day");
  that choice stands until the owner changes it and is not reopened here.

### 1.8 Aftermath

**What happened to men of the force** (DOCUMENTED, concepcion.md §9): the army camped at Concepción that night; Austin wanted to
push on to the town and his officers would not; from Oct 31 the army moved above the town and began the siege; on Nov 2 both
councils voted not to storm; by Nov 4 "more than 150 men" had gone home for winter clothing. Andrews was buried under a pecan.
The detachment's men stayed with the army; **no one went home because of the fight itself.**

**Modelled today:** killed → `health.condition 'dead'`, laid at the Concepción offset, promise ended, "buried there under the pecans
by the river"; wounded → `minor-injury`, `MEND_MINUTES` 4320 (three days, L347), stays in the ranks; unhurt and present stay; glory
`fought` / `present` (`world.participation.concepcion`). The next choice is the clothing furlough (`clothing`, Nov 4; played
families are not asked today, only unplayed ones leave, L738–762) and, any time, *Send for them* (`callHome` L230–256).

**Choices that should exist:** none new at the battle. The person **does not come home** because of Concepción; the family can
send for him as before. Recommended: the family's plain account (below) ends by saying the army is closing on the town and that
many men are asking to go home for winter clothes, so the existing *Send for them* is visibly a real, period choice.

**Plain-words account** (delivered by the rider who brings the fuller word; `{…}` is filled by the server from the staged fate):

> On the morning of October 28 about ninety of our volunteers under Jim Bowie and James Fannin were camped in a bend of the San
> Antonio River near Mission Concepción, below Béxar. In the fog, Mexican cavalry and infantry with two cannon surrounded them.
> Our men kept down under the high riverbank, climbing up to fire and dropping back to load, so the Mexican bullets and cannon
> shot mostly went over their heads. When the fog lifted, the Mexican infantry charged three times behind a cannon, and three
> times the riflemen shot down the gunners and drove them back. Then the Mexicans retreated to Béxar and our men took the
> cannon. One volunteer, Richard Andrews, was killed; he had crossed open ground to join the other side of the bend. {Name}
> {was under the bank with Fannin's company and came through unhurt | was hurt by a ball and will be some days mending | was
> killed crossing the open ground, and was buried under the pecans by the river | was with the main army at Espada and came up
> an hour after the fight was over}. The army is now closing on Béxar, but many men are talking of going home for winter clothes.

### 1.9 Art

**Already in the library** (`public/assets/frontier-v1/animation.json`, `docs/ART_MANIFEST.md`): `volunteer-march[-n/-s]`,
`volunteer-idle-*`, `volunteer-fire-reload`, `volunteer-gun-fire`, `volunteer-gun-ram`, `volunteer-injured-rest`,
`volunteer-surrender`; the same for `regular-*`; `dragoon-march[-n/-s]`, `dragoon-idle-*`; `cannon-bronze-e/w-recoil`,
`cannon-iron-e/w-recoil`, `limber`, `roundshot`; `musket-smoke`, `cannon-smoke`, `smoke-rise`, `smoke-streaming`,
`muzzle-flash-e/w`, `road-dust`; `pecan`, `cottonwood`; `church-generic`; `horse-cart`, `horse-walk`, `horse-graze`,
`mustang-*`; `water-motion`, `water-ripple`, `water-splash`; the four `*-carry` figures and `*-care`.

**Missing — ready to become `docs/ART_REQUESTS.md` rows:**

| Need | Why | Stand-in (mark `stand-in:`) |
| --- | --- | --- |
| **A cut riverbank 5–6 ft high with steps cut in it**, a timbered bottom below | the whole fight turns on it (report; Smithwick; Taylor) | `earth-rampart` laid along the water's edge, `pecan`/`cottonwood` behind |
| **Climb-fire-drop cycle**: a volunteer stepping up a bank, firing over the lip, stepping down to load | the Texian fire pattern (report) | `volunteer-fire-reload` with the figure's y offset raised and lowered by the renderer |
| **Fog layer** that thins over ten game minutes | "heavy, dense fog" until about 8 a.m. | `smoke-dense`/`smoke-rise` scaled up at low opacity |
| **Mission Concepción**: twin towers and a dome, seen from 500 yards | the cupola lookouts | `church-generic` |
| **Mounted fire**: a dragoon firing from the saddle | the first shots at Karnes | `dragoon-idle-*` with `muzzle-flash-*` at the carbine (already on the manifest's wish list) |
| **A bugler** (Mexican), drum and fife (Mexican) | the charge and retreat sounded | an officer `regular-idle-*` with a caption; **no Texian drum or flag** |
| **Mules harnessed to a gun or caisson**, men riding them off | "two or three on a mule" (Smithwick); "six mules" (report) | `limber` + `horse-walk` |
| **Stretcher pair / two men carrying one** | wounded carried (VISION §16) | two `*-carry` figures beside a `volunteer-injured-rest` |
| **A reclining killed soldier, both sides** | falling (§2.3) | `*-injured-rest` held still, darkened slightly; a dedicated lying pose is requested |
| **A padre with carts** | Smithwick; Taylor | `horse-cart` + a `civilians` figure |
| **A grave under a pecan** (no body) | Andrews | `pecan` + disturbed ground from `land-clearing` |

### 1.10 Proposed `HISTORY.md` rows

```
| **HIST-TEX-480** | DOCUMENTED | **The shape of the morning at Concepción, October 28, 1835.** In fog, "about half an hour by sun", Mexican cavalry fired on the sentinel Henry Karnes and surrounded the camp in the river bend, firing at long range "with no other effect than a waste of ammunition"; the Texians cut away brush and cut steps in the bank to "ascend the bluff, discharge their rifles, and fall back to re-load". About 8 a.m. the fog lifted, the Mexican infantry formed a line about 200 yards from the right flank with cavalry across the front and flanks, and a brass gun opened with grape and canister at about 80 yards; "a charge is sounded". Three charges were beaten back, the gun firing five times and its crew shot down three times; retreat was sounded, and the Texians took the gun and turned it; a second, heavier gun fired three times at long range and was got off by six mules. The canister went high, "raining a shower of ripe nuts down on us" (Smithwick). The Texians had no flag and no drum (Creed Taylor). Sources: Bowie and Fannin's report (*Telegraph and Texas Register*, Nov 14, 1835, p. 6); Smithwick, *Evolution of a State* (1900); Creed Taylor (DeShields 1935); researched in `docs/battle-research/concepcion.md` §4.4. **The length of the fog skirmish is DISPUTED** (the report implies under an hour; Barr, via Wikipedia, about two hours). Sunrise about 6:10–6:25 local time is COMPUTED (`docs/battle-research/staging.md` §1.2). | The phases of `sim/battles/concepcion.mjs`: the bank, the fog, the gun, the bugle calls; no Texian flag or drum drawn. |
| **HIST-TEX-481** | STRONGLY SUPPORTED | **How Richard Andrews was hit, and what followed.** Two men who were there say Andrews was shot crossing open ground, when Bowie moved Coleman's company to support Fannin's, rather than going under the bank (Smithwick; Creed Taylor; TSHA *Andrews, Richard*); he lived "several hours" and "long enough to know that the fight was won", and was buried under a pecan. After the Mexican retreat men gave water to the Mexican wounded, and a padre came out from Béxar with carts and, after speaking with Austin, took the Mexican dead and wounded into the town. Sources: Smithwick pp. 114–116; Creed Taylor; researched in `docs/battle-research/concepcion.md` §4.4, §4.6. **The side of the wound is DISPUTED** (left per Smithwick, right to left per Taylor; grapeshot per Barr via Wikipedia) and is not shown. | A family's killed or wounded fighter at Concepción is the one crossing the open at a discharge (`staging.md` §1.5); the carts and the water in the aftermath. |
| **HIST-TEX-482** | DOCUMENTED (the regulation) / RECONSTRUCTED (its use in 1835–36) | **Spanish infantry words of command.** The Spanish *Reglamento para el exercicio y maniobras de la infantería* (Madrid, Imprenta Real, 1808) gives the words PREPAREN LAS ARMAS ("make ready"), APUNTEN ("aim"), FUEGO ("fire"), ARMEN LA BAYONETA ("fix bayonets"), MARCHEN ("march"), ALTO ("halt") and ARMAS AL HOMBRO ("shoulder arms"), forms infantry in three ranks, and treats *fuegos graneados* (fire by each man in turn). Mexican infantry companies had drummers and a fifer; cazador and grenadier companies had trumpeters (Sons of DeWitt Colony, *Soldados Mexicanos*). **That the Mexican army of 1835–36 gave these words is not verified in a Mexican manual**: specialists describe its drill as Spanish-derived and French-influenced without naming the book in use. Sources: the *Reglamento*, archive.org item A053320148 (OCR read 2026-09-25); Alamo Studies Forum thread "Mexican Infantry Tactics in 1836" (read 2026-09-25). | Every Spanish order spoken in a battle is `kind: 'reconstructed'`, with an English gloss; none is attributed to a named officer. |
| **FIC-GONZ-420** | **FICTIONAL FOR GAMEPLAY** | **Concepción as staged** (`docs/battle-research/staging.md` §1). Invented here: the detachment leaving Espada at 2 p.m. on October 27 and walking to the bend; the question kept open until then; latecomers following the army along its road and Victoria's gatherers marching on to it; the offer cards' arrival estimates; the bend's place on the map's own river within 0.3 mile north-west of the mission; the phase lengths (alarm 6:50, 65 minutes ringed in fog, the fog lifting at 8, twenty minutes of charges, fifteen of retreat) and the clock held to them; the drawn sample (about 100 Mexican infantry and 50 dragoons against the 92 drawn one to one); the moment each fighter's existing roll resolves (at a discharge of the gun, drawn crossing the open with Coleman's company); the sergeant's and the picket's words on the alert cards; and every reconstructed line in §1.4. | |
```

### 1.11 Questions for the owner

**C1. A volunteer who turns out after the army has marched from Gonzales (October 13).**
- (a) **He follows the army along its road at his own pace and falls in when he catches it; the offer card says when he would
  arrive.** *(Recommended: the order book sends reinforcements after the army; nothing today moves him, so he never arrives.)*
- (b) He stays at Gonzales, as now, and the card says so before he goes.
- (c) The call closes when the army marches.

---

## 2. The Grass Fight, 26 November 1835

Research: [grass-fight.md](grass-fight.md) (§4; sources Jack's report of Nov 27, the General Council journal, Yoakum, Barr,
Taylor). Registered: `HIST-TEX-026` to `-035`, `FIC-GONZ-040`.

### 2.1 Ground and positions

| Thing | Where | Status |
| --- | --- | --- |
| The mill camp | `SIEGE_CAMPS.mill` = `{ dx: 0, dy: -1 }` (a mile north of the plaza, `sim/army.mjs` L567–571); the sources give 600 yards to 1½ miles, and for December "within one-half a mile" (bexar-storming.md §3.7) | DOCUMENTED place, distance DISPUTED |
| The fight | the THC marker at **29.4226 N, 98.5138 W** = about **`dx: -1.22, dy: +0.10`** from `bexar` (grass-fight.md §4.2), "about a mile from the town", near the Alazán where the old Presidio road came in; dry creek beds and ravines in thick mesquite | Site DOCUMENTED within a mile; the battlefield not fixed |
| The creek Jack forded | "cold wide and deep", between the camp and the fight; not named. Use the map's San Pedro or Alazán crossing on the straight line from the mill to the marker | RECONSTRUCTED |
| The mesquite ditch | 40–60 yards across the line of Jack's march, on the train's side | DOCUMENTED distance |
| The town's west edge | where Cos's sortie came out with its gun; the gun fired three times from near the town | DOCUMENTED |

**Camera.** A frame about 0.8 × 0.5 mile centred on the marker, with the town's west edge at its east side, so the sortie and
its gun come on from the right. At the alarm the Host's spotlight shows the mill camp (men running for horses); it moves to the
field when Bowie's horsemen reach it.

### 2.2 Phases

**The hour is DISPUTED**: Deaf Smith reported the train mid-morning (Barr) or about 10 a.m. (via Wikipedia), or Smith reached
camp about 2 p.m. (Yoakum). **The game today opens the question at 10:00 (`grass-alarm`) and fights no earlier than 16:00**
(`grass-fight` 15:00, pushed to at least opened + 360 by `due`, `sim/directors.mjs` L771, L810–813) — a six-hour gap that fits
neither source, left over from the rule that a question stays open six hours. Recommended (owner question G1): Barr's
mid-morning, with the fight following within about two hours.

| Phase | Starts | Game min | What happens | Status | Held |
| --- | --- | --- | --- | --- | --- |
| `alarm` | 10:00 | 30 | Deaf Smith rides in: a train with cavalry five miles out on the Presidio road. The camp cries "Ugartechea!" and the silver rumour runs through it. Burleson sends Bowie with the horsemen, warning him not to attack unless he must, and Jack with about a hundred infantry drawn from many companies. Men run for horses and rifles. | DOCUMENTED (Jack; Yoakum; Barr); the warning via Hardin | 90 s (the family's question, §2.6) |
| `ride-out` | 10:30 | 30 | Bowie's riders go at a canter; Jack's infantry "at a brisk trot", fords the creek, then "double quick time for about half an hour" "in tolerably good order and in double file". | DOCUMENTED | 45 s |
| `bowie` | 11:00 | 20 | About a mile from town Bowie charges the train; the Mexicans take to a dry creek bed; both sides dismount and fight on foot from ravines. | DOCUMENTED (Yoakum; Barr) | 60 s |
| `ambush` | 11:20 | 10 | Jack's column is hit from the mesquite ditch at 40–60 yards: "a tremendous discharge of musketry along our whole line", then a second and third. The column splits into its two divisions, flanking right and left; Sublett orders the charge; the ditch "cleared... in a few moments". James Burleson, 60, "flew from one end of the field to the other". | DOCUMENTED | 75 s |
| `sortie` | 11:30 | 20 | Cos's sortie from the town (about 50 infantry and one gun; two guns per Yoakum) comes on the other flank; Bowie turns on it; Swisher's men and Rusk's fifteen come up; the gun fires "three discharges... with grape and canister"; the Mexicans withdraw "under the protection of their batteries in town". | DOCUMENTED; the sortie's size DISPUTED | 60 s |
| `follow` | 11:50 | 15 | The Texians follow until fired on from the town's guns and are ordered back. | DOCUMENTED (*Telegraph*, Dec 2) | 30 s |
| `grass` | 12:05 | 30 | The packs are cut open: **grass**, cut for the horses in Béxar. Forty (or about seventy) animals driven back to camp. | DOCUMENTED | 30 s, then released |

**Total held fighting ≈ 4½ real minutes.**

### 2.3 Formation style and counts

| Phase | Texian | Mexican |
| --- | --- | --- |
| `ride-out` | Bowie's riders **`mounted`**, a loose band; Jack's infantry a **`column` of twos** ("double file") — **ordered, not chaotic**. | The train: **pack animals in a string** with a cavalry escort (`mounted`). |
| `bowie` | Riders dismount, horses held behind, men firing from ravine edges: **`loose`** (`bank`-like cover). | Escort dismounted in the creek bed: **`bank`**, firing on foot from cover. **Not rows.** |
| `ambush`, `sortie` | Jack's column breaks into **two divisions** flanking right and left, then a rush on the ditch: **`loose`**. | The ditch party **`bank`**; the sortie's infantry a small **`ranks`** line with a gun on its flank, firing by rank. |
| `follow` | **`loose`** pursuit, then a walk back. | Withdrawal in order under the town's guns. |

**Counts.** Texian **about 140** (Bowie's 40 and Jack's 100) plus Swisher's reinforcements of unknown size; the *Telegraph*'s
300 is hearsay — DISPUTED; draw **~140 1:1** plus **~30** coming up late. Mexican **50–200** with the train (DISPUTED) and a
sortie of about 50 with one gun; draw **~60 escort** and **~50 sortie** 1:1.

**The owner's instinct, honestly.** Here neither side was "in rows" for most of it. The Mexican escort fought from a creek bed;
the only formed Mexican line was the small sortie from the town. The Texian infantry marched out in good order, in double file,
and was ambushed while formed.

### 2.4 Talk

| When | Speaker | Line | Kind, source |
| --- | --- | --- | --- |
| `alarm` | camp, many | "Ugartechea!" | **documented** as the camp's cry (Yoakum; STRONGLY SUPPORTED secondary; `HIST-TEX-031`) |
| `alarm` | Texian, any | "It's the silver — the soldiers' pay!" / "Get your horse!" | reconstructed from the rumour (`HIST-TEX-031`) |
| `ride-out` | Texian officer | "Double quick!" / "Keep your file!" | reconstructed from Jack |
| `bowie` | Mexican officer | "¡Pie a tierra!" — *Dismount!* / "¡Fuego!" — *Fire!* | reconstructed |
| `ambush` | Texian, any | "Down! They're in the ditch!" / "Right and left — flank them!" | reconstructed |
| `ambush` | Texian officer | "Charge!" | reconstructed (Sublett gave the order; his words are not given, so the line is spoken by an unnamed officer) |
| `sortie` | Mexican officer | "¡Preparen las armas! ¡Apunten! ¡Fuego!" — *Make ready! Aim! Fire!* | reconstructed |
| `grass` | Texian, wry | "Grass! All this for grass." | reconstructed; the joke is the event itself (`HIST-TEX-031`) |

### 2.5 Casualty moments

- **Rates in code:** no deaths; `GRASS_WOUND_RISK = 0.03`, `GRASS_RUN_RISK = 0.01` (`sim/army.mjs` L778–779), rolled in
  `fightGrass` (L787–825).
- **When:** the **wound** resolves at the first volley of `ambush` (Jack's three wounded were infantry: "three very slightly
  wounded"); a mounted family person is rolled at `bowie`'s first exchange instead. **Running** resolves at the same volley: the
  man is drawn breaking back the way the column came and keeps going east; he appears at home days later (`leaveArmy`, glory
  reversed, as today).
- **Showing it:** a slight wound sits down, is helped up, and walks back with the column at `follow`. Nobody lies still on the
  Texian side. On the Mexican side about 3–10 drawn figures fall across `bowie`, `ambush` and `sortie` (the range 3 to 60 killed
  is DISPUTED; draw few) and are helped away by their own side.

### 2.6 A family's person: arrival and participation

**Today:** the `grass` question (`ARMY_QUESTIONS`, `sim/army.mjs` L596–618; unplayed yes 0.33) opens at `grass-alarm` (Nov 26
10:00, `sim/directors.mjs` L805–809); `fightGrass` runs at `grass-fight`, not before opened + 360 minutes (L810–813). A person is
in it only if he is an army member at that tick and answered yes. **Ways he misses it:** (a) not a member (all of §1.6's cases,
plus a clothing furlough, L738–762, which applies only to unplayed families; the Concepción camp, Nov 9–15, is 2.32 miles off and
outside `FALL_IN_MILES`, so a man returning then does not rejoin until the army is at the mill on the 15th); (b) he said no to
the pledge on Nov 24 and went home (`settleAnswer` L684–686); (c) the decision budget answered for him (`decideQuestionFor`
L704). **And the one that matters: a man who said yes never leaves the mill** — the roll is made on the members in the camp.

**What should change:**

1. **A yes is a departure.** On a yes (or auto's yes), the person leaves the camp with the party he goes with: a man with a horse
   at the camp (`modeWith`) rides with Bowie at `ride-out`; a man on foot goes with Jack. The two parties are formations in
   `world.battles['grass-fight']`, walking from the mill to the field (about 1.5 miles; at Jack's trot and double-quick, half an
   hour — DOCUMENTED).
2. **Close the question at `ride-out`, not six hours later.** The 90-second decision budget (`sim/decision-budget.mjs`,
   `DECISION_BUDGET_MS`) already guarantees a played family time to answer; `deciding()` holds the calendar at 20 minutes a tick
   while it is open (`sim/clock.mjs` L102–122). Drop the `QUESTION_MINUTES = 360` rule (`sim/directors.mjs` L760) for this question and move
   `grass-fight` to the staged phases (§2.2). A man who answers in time is always in the ride-out; nobody is sent after it has
   gone.
3. **A man away from the camp at the alarm** (scouting parties were out every day, `HIST-TEX-030`) is not asked. The question's
   `who` should require that he is at the mill (not travelling), and the card for anyone else says he was away.

### 2.7 Alert

- **At `alarm`, at the person's side, by a man running through the camp** (reconstructed): *"Deaf Smith has ridden in. There's a
  Mexican pack train coming in from the west with cavalry — they say it's carrying the soldiers' silver. Bowie is taking the
  horsemen and Jack the foot. Does {name} go?"* This is the existing question's card, now carried by a person; its answers are
  the existing `grass` yes/no.
- **At `bowie`, to a family whose person went:** *"Firing west of the town, by the Alazán. {Name} is with {Bowie's horsemen | Jack's
  infantry}."* — **Watch**.
- **To a family whose person stayed in camp:** *"Firing to the west. The camp guard is standing to."* — **Watch** (they can hear
  it).

### 2.8 Aftermath

**Historically:** the men returned to the mill camp; nobody was killed; the grass was the joke of the army. Five days later the
General Council read Burleson's report; on Dec 2 the *Telegraph* printed a wrong rumour ("300 a side", "ten dead bodies", "no
loss"). The army went on toward winter quarters until Milam's call on Dec 4. **Modelled today:** outcomes held in `army.grass`
and told at `grass-news` (Dec 3 12:00) by `tellGrassFight` (L828–846); the rumour at `grass-rumour` (Dec 1 12:00). **Choices:**
none at the battle; the winter-quarters question on Dec 4 (`winter`) is next. **The person stays with the army** unless he ran
(then he is on the road home) or the family sends for him.

**Plain-words account:**

> On November 26 Deaf Smith rode into the camp north of Béxar with news of a Mexican pack train coming in from the west. The men
> believed it carried silver to pay the soldiers in Béxar. Jim Bowie went out with about forty horsemen and William Jack with
> about a hundred men on foot. A mile west of the town Bowie's men caught the train; its guard jumped into a dry creek bed and
> both sides fought on foot. Jack's men were fired on from a hidden ditch, charged it and cleared it, and soldiers who came out
> of the town with a cannon were driven back. When the packs were cut open they held grass, cut to feed the horses in Béxar. No
> one on our side was killed. {Name} {rode with Bowie | marched with Jack's men} {and came back unhurt | and was slightly hurt,
> and will be some days mending | and ran from the field when the firing began, and has started for home | stayed in the camp
> with the guard}.

### 2.9 Art

**Missing — for `docs/ART_REQUESTS.md`:**

| Need | Why | Stand-in |
| --- | --- | --- |
| **Pack mules and horses under bundles of cut grass**, and bundles cut open | the point of the fight | `horse-walk` with `packed-belongings` on the back (no mule exists) |
| **A dry creek bed or ditch in thick mesquite**, men firing from it | Jack; Yoakum | `earth-rampart` laid low, screened with `mesquite-large-wind` |
| **A wide creek forded on foot at a trot** | Jack | `water-ripple`/`water-splash` over the map's creek |
| **Mexican cavalry dismounted, firing on foot, horses held behind** | Barr | `regular-fire-reload` beside `dragoon-idle-*` horses |
| **Horse-holders**: one man holding three or four horses | Bowie's riders fought on foot | `courier-horse-wait` repeated |
| **A column of twos at the double** | Jack | `volunteer-march` at a faster frame rate (no new art; the renderer's own pace, never faster than a run) |

### 2.10 Proposed `HISTORY.md` rows

```
| **HIST-TEX-483** | DOCUMENTED | **How the two sides stood at the Grass Fight, November 26, 1835.** Jack's infantry went out "at a brisk trot", forded the creek and marched "double quick time for about half an hour... in tolerably good order and in double file" before a hidden enemy "concealed in a ditch and completely hidden by the thick muskeet bushes" fired on them at forty to sixty yards; they split into two divisions, flanked right and left, and on Sublett's order charged and cleared the ditch "in a few moments" (Jack to Burleson, Nov 27, 1835). Bowie's horsemen charged the train about a mile from town; its guard took to a dry creek bed and both sides fought on foot from ravines (Yoakum 1855; Barr, TSHA). A sortie from the town with a cannon fired "three discharges... with grape and canister" and withdrew "under the protection of their batteries in town"; the Texians followed until fired on from the fort and were ordered back (Jack; *Telegraph* Dec 2, 1835). The camp cried "Ugartechea!" at the alarm (Yoakum). Refines `HIST-TEX-031` for staging; **the hour of the alarm is DISPUTED** (mid-morning per Barr; about 2 p.m. per Yoakum). Researched in `docs/battle-research/grass-fight.md` §4. | The formations of `sim/battles/grass-fight.mjs`: a Texian column ambushed while formed, a Mexican escort fighting from a creek bed; the one Mexican line is the sortie's. |
| **FIC-GONZ-421** | **FICTIONAL FOR GAMEPLAY** | **The Grass Fight as staged** (`docs/battle-research/staging.md` §2). Invented here: the alarm at 10 a.m. and the fight between about 11 and 12:30 (the record's hour is disputed); a yes to the question as a departure with Bowie's riders (a man with a horse at the camp) or Jack's infantry (on foot); the question closing when the parties ride out, not six hours after it opened; that a man away from the camp at the alarm is not asked; the place of the creek Jack forded; the phase lengths and the drawn counts; the moment a wound or a run resolves (the first volley of the ambush, or Bowie's first exchange for a rider); and every reconstructed line in §2.4. | |
```

### 2.11 Questions for the owner

**G1. The hour of the Grass Fight** (Barr: Smith came in mid-morning; Yoakum: about 2 p.m.; the game today: alarm at 10, fight at
about 4 p.m.).
- (a) **Alarm about 10 a.m., the fight between about 11 and 12:30.** *(Recommended: Barr is the modern authority, and the fight
  follows the alarm as every account has it.)*
- (b) Alarm about 2 p.m., the fight between about 3 and 4:30 (Yoakum).
- (c) Keep today's alarm at 10 and fight at 4.

---

## 3. The storming of Béxar, 5–9 December 1835, and the capitulation

Research: [bexar-storming.md](bexar-storming.md) (Johnson's report of Dec 11 is the spine; Burleson's of Dec 14; Levy's wounded
list; Sánchez Navarro; Cooke, Dance, Field, Ehrenberg, Stiff). Registered: `HIST-TEX-036` to `-045`, `FIC-GONZ-041`.

### 3.1 Ground and positions

All offsets in miles east (`dx`) and south (`dy`) of the `bexar` point, which is effectively the Main Plaza (bexar-storming.md
§3.7, COMPUTED there).

| Place | Offset | Status |
| --- | --- | --- |
| Main Plaza (Plaza de las Islas), the church, the Priest's House, Zambrano Row | `+0.02, +0.02`; the Priest's House and Zambrano Row on or at the plaza (±0.05) | Plaza DOCUMENTED; the houses' sides not fixed |
| De la Garza house (Milam's division, the first morning) | `+0.02, -0.15`, a walled compound filling a block on the west side of Soledad Street | Marker; STRONGLY SUPPORTED |
| Veramendi house (Johnson's division; where Milam fell) | about `+0.03`, between `-0.02` and `-0.15`, east (river) side of Soledad Street | Estimate only |
| Navarro house of 1835 | "an advanced and important position, close to the square" | Gap: not the later Casa Navarro |
| The Alamo (Cos's fire from the left; his retreat on Dec 8–9) | the compound at `ALAMO_ORIGIN` = `{ x: 0.2867, y: -0.1601 }` (`sim/alamo-runner.mjs` L25), the map's illustrated placement; the real site is `+0.45, -0.12` | DOCUMENTED site; the map's placement is the illustrated assembly |
| The mill camp and the reserve | `SIEGE_CAMPS.mill` `{0, -1}` today; for December "within one-half a mile" (Field), "six hundred yards above the town" (W. T. Austin): **about `0, -0.35` to `-0.5`** is better supported | DISPUTED; recommended move to `-0.45` |
| The approach | from the mill across the cornfield, over a brush fence, down **Acequia** and **Soledad** streets | DOCUMENTED (marker; Chavez; Field) |
| The Mexican street defences | a ditch, an earth bank and a post palisade with a gun embrasure at each street entrance to the plaza except the one to the Alamo | STRONGLY SUPPORTED (Field; Dance; the 2007 archaeology under Main Plaza) |

**Caution** (`docs/BEXAR_ASSEMBLY.md`): the illustrated town is not a survey and has no named Veramendi, Garza or Navarro house.
**Do not label assembly houses with those names until the geometry step that document requires.** Until then, stage on the
assembly's houses nearest the offsets above and name them in the account only.

**Camera.** In the entry and the house fighting: the north side of the Main Plaza and Soledad Street, about 0.25 mile north–south
by 0.2 east–west, the Alamo's walls at the frame's east edge so its guns' smoke shows. In the camp scenes: the mill camp. For the
flag: the plaza.

### 3.2 Phases

Four days cannot be held at 3–6 real minutes, and must not be skipped (VISION §17). **Recommended (owner question B1): four held
episodes, and the town "fighting at a background pace" between them** — the clock at the ordinary military cap (120 game minutes
a tick, `MILITARY_TRAVEL_MINUTES`, `sim/military-pacing.mjs` L9) while a played family has someone in the town, the loopholes
flashing and smoking, a cannon shot now and then, men digging at night, so the fight is visibly still going on and nothing jumps.
Sunrise on 5 December is about **6:40 local time** (COMPUTED); "at day light or rather some twenty minutes before" is therefore
about 6:00.

| Phase | Starts | Game min | What happens | Status | Held |
| --- | --- | --- | --- | --- | --- |
| `winter-quarters` | Dec 4, morning | — | Orders to march for winter quarters; squads leave; "250 or 300 set off for home". (The existing `winter` question, 06:00.) | DOCUMENTED | question |
| `deserter` | Dec 4, afternoon | — | A Mexican officer comes over and says the town is weak (name DISPUTED). | DOCUMENTED | not held |
| `call` | Dec 4, 18:00 | — | Milam's call for volunteers; men step forward in ranks "to see if we are strong enough"; they elect Milam and form two divisions at the mill after dark. (The existing `milam` question.) | STRONGLY SUPPORTED | question |
| `roll` | Dec 5, 02:00 | 60 | Roll called (Ehrenberg: 230 signed, 210 answered). | memoir | 30 s |
| `feint` | 03:00 | 120 | Neill with one gun and Roberts's company crosses the river; at 05:00 he fires on the Alamo from the north. | DOCUMENTED (Burleson, Dec 14) | 30 s at 05:00 |
| **Episode 1 `entry`** | 05:30 | 150 | The divisions cross the cornfield, drop blankets and coats about 200 yards out, cross a brush fence; a sentinel challenges and is shot (Deaf Smith). They go down Acequia and Soledad and **break into the de la Garza and Veramendi houses**. The second division is "exposed for a short time to a very heavy fire of grape and musketry" until the first division's guns open. Greys on the Veramendi roof are driven down and cut back in with knives. **7:00: a heavy cannonade from the town, "seconded by a well directed fire from the Alamo".** The twelve-pounder is dismounted. | DOCUMENTED (Johnson; Milam–Burleson) | ~4 min |
| `pinned` | Dec 5, 08:00 → Dec 7, 11:00 | background | Pinned in the houses. Loophole fire; the long twelve-pounder loopholed into a wall (Dec 6); at night trenches across the street and sandbags; Lt. McDonald's men of Crane's company take the house ahead on the right (Dec 6); mesquite burning between the lines until 8 p.m. (Dec 6); a woman of the town shot fetching water (told, §3.8). | DOCUMENTED (Johnson) + memoirs | background (120 min/tick) |
| **Episode 2 `karnes-milam`** | Dec 7, 11:30 | 270 | **About noon** Henry Karnes forces a door with a crowbar and York's company follows him in. Heavy fire through the afternoon. **15:30: Milam is shot in the head passing into the Veramendi yard and dies instantly.** 19:00: the officers give Johnson the command. 22:00: four companies take the Navarro house. Cold and wet. | DOCUMENTED (Johnson) | ~2 min for the crowbar (11:30–12:10) and ~1½ min around 15:30; background between |
| `row` | Dec 8, 09:00 | 60 | The same four companies with Greys take **Zambrano Row**, "from room to room"; Mexican crowbars through the partitions, men talking through holes. 07:00 on: reinforcements come in from the mill (Cheshire's, Sutherland's, Lewis's companies — the existing `reinforce` question). 19:00: four more companies into the Row. Evening: **Ugartechea arrives with about 600, most of them raw conscripts**; about 50 sortie from the Alamo against the camp and are driven off by a six-pounder. | DOCUMENTED | ~1½ min for the Row; background |
| **Episode 3 `priests-house`** | Dec 8, 22:30 | 90 | Cooke's Greys and Patton's company, about 49 men, leave the Veramendi house, pass "within a few feet of a line of loop holes for seventy or seventy five yards" under a bright moon, climb a barricaded doorway into the **Priest's House** on the plaza, spike a gun "two or three yards" from the door (Belden loses an eye), barricade with blankets, shirts and the priest's library. **The heaviest cannonade of the siege follows, all night.** | DOCUMENTED (Johnson; Cooke 1844) | ~3 min |
| `collapse` | Dec 9, 01:00–05:00 | background | In the dark: Cos concentrates in the Alamo; about 1 a.m. the cavalry saddles; at 4 a.m. several presidial companies ride away south (about 175, DISPUTED); Condelle withdraws the plaza guns and will not surrender. Seen from the town only as fire slackening and movement toward the Alamo. | STRONGLY SUPPORTED (Sánchez Navarro; Cos) | background |
| **Episode 4 `flag`** | Dec 9, 06:30 | 60 | The cannonade stops; a **white flag** comes to the plaza (Sánchez Navarro used a white flag "because the Texians did not understand the bugle"); J. W. Smith and Padre Refugio de la Garza meet it. 09:00 Burleson rides in from the mill. | DOCUMENTED | ~1½ min |
| `terms` → `capitulation` | Dec 10 02:00 → Dec 11 | — | Terms agreed; the document dated Dec 11; the army paraded and votes, company by company, "a small majority for it"; a fandango. | DOCUMENTED / memoir | not held |
| `cos-marches` | Dec 14 | — | Cos to Mission San José and the Rio Grande; the colonists start home; the wounded stay in the town. | DOCUMENTED | not held |

**Held fighting ≈ 12 real minutes across four episodes**, plus background. This is longer than §2.2's 3–6, and deliberately: the
owner allowed "longer to show the full experience as long as it appears correct", and this is the one fight that lasted four
days. Owner question B1.

### 3.3 Formation style and counts

| Phase | Texian | Mexican |
| --- | --- | --- |
| `call`, `roll` | Men stepping forward into two ragged lines at the mill (the parade), then two columns by company. **`column`**, loose. | — |
| `entry` | Two **`column`s** in the dark down two streets, keeping to the house walls; then **`street`**: breaking in, onto roofs, driven off roofs. | **`wall`**: musketeers on the flat roofs behind parapets about four feet high, and behind the street barricades; guns at the barricades raking the streets' middles; the Alamo's guns firing from the east. |
| `pinned`, `karnes-milam`, `row` | **`street`**: small company groups (20–40) inside houses, **firing through loopholes**; men crossing in files along walls or in the trenches; a crowbar party at a wall. | **`wall`** and **`street`**: the Morelos battalion and presidials in the houses and on roofs round the plaza; the Mexicans also break walls (Zambrano Row). |
| `priests-house` | A **file** of about 49 hugging the wall under the loopholes, then a rush through a doorway. | **`wall`** at the loopholes; the plaza guns by the cemetery "30 varas" off. |
| `collapse` | — | **`rout`**-lite: cavalry riding off south in the dark; infantry and guns withdrawing east to the Alamo. |
| `flag` | Men coming out onto roofs and into the plaza. | A white-flag party with a bugler; officers parleying. |

**Counts.** Assault **about 210–300** at first (216 from the camp records per W. T. Austin; "about 300" per the army's Dec 6
report; do not assert one number); **about 100** more from the reserve on Dec 8; reserve **about 400–500** at the mill. Draw the
two divisions **1:2** (about 110–150 figures in the town), the reserve 1:5 at the mill. Mexican **about 570** before Dec 8 and
**about 600 more** after (most untrained); draw 1:5 (about 110, then 230), most of them inside houses and on roofs, so on screen
the fight reads as many small fires, not two lines.

**The owner's instinct, honestly.** Neither side is in rows once the fight starts. Both fight from inside stone houses, through
loopholes and from behind parapets; the fight moves by breaking walls. The only rows are the Texians' own muster at the mill on
the evening of December 4 and the Mexican guns at the barricades. The "organised" side in the streets is the one on the
defensive.

### 3.4 Talk

| When | Speaker | Line | Kind, source |
| --- | --- | --- | --- |
| `call` | Ben Milam | "Who will go with old Ben Milam into San Antonio?" | **tradition** — in TSHA (*Milam*), Johnson (1880s), Creed Taylor and the 1849 *Gazette*, not in a document of December 1835; who started the call is DISPUTED. Show only labelled as tradition (owner question B2). **Creed Taylor's line drawn on the ground is not to be used.** |
| `call` | volunteer, any | "I'll go." / "Put me down." | reconstructed |
| `call` | volunteer, worried | "Two hundred men against a walled town?" | reconstructed |
| `entry` | Mexican sentinel | "¿Quién vive?" — *Who goes there?* | reconstructed (period-standard challenge) |
| `entry` | Texian, any | "Keep to the wall!" / "The door — break it!" / "Off the roof!" | reconstructed |
| `pinned` | Texian, any | "Loophole here." / "Pass the bar." / "Sandbags — fill them tonight." / "Stay out of the middle of the street." | reconstructed from Johnson, Field and Taylor (the guns swept the middle of the streets) |
| `pinned` | Mexican officer | "¡Fuego!" — *Fire!* / "¡A las azoteas!" — *To the rooftops!* | reconstructed |
| `pinned` | shouted across a street, Mexican | "¡Vengan, tejanos!" — *Come on, Texians!* | reconstructed taunt |
| `pinned` | shouted back, Texian | "Come and get us!" | reconstructed taunt |
| `karnes-milam` | Texian | "Follow Karnes!" | reconstructed (the act is Johnson's; the words are not) |
| `karnes-milam`, 15:30 | — | *(no words; the yard falls quiet)* | Milam's death is shown by the men around him stopping, and told by `said('HIST-TEX-039', …)` (`sim/directors.mjs` L855), never spoken by Milam |
| `priests-house` | Texian, whispered | "Close to the wall. Not a sound." | reconstructed |
| `collapse` | Mexican, reported | "El Batallón Morelos no se ha rendido nunca." — *The Morelos battalion has never surrendered.* | **documented as reported speech**: Sánchez Navarro reports Condelle's refusal in these terms (STRONGLY SUPPORTED; `HIST-TEX-491` proposed). Speaker: `{ role: 'officer', side: 'mexican', name: 'Condelle' }`. |
| `flag` | bugle (Mexican) | caption: *A bugle sounds a parley; the Texians do not know the call. A white flag comes out.* | **documented** (Sánchez Navarro) |
| `flag` | Texian, any | "A white flag! Hold your fire!" | reconstructed |

**Not to be used:** F. W. Johnson's "Powder is as cheap as provisions, and we have the powder" (Creed Taylor alone, and Johnson's
own report says the powder was nearly gone) — DISPUTED; leave it out.

### 3.5 Casualty moments

- **Rates in code:** `STORMING_DEATH_RISK = 0.02`, `STORMING_WOUND_RISK = 0.08` (`sim/army.mjs` L863–864); `WOUND_GRADES`
  (L870–874) slight 0.125 (3 days, `minor-injury`), severe 0.5 (21 days, `wounded`), dangerous 0.375 (60 days, `wounded`,
  `mark: 0.4`, `laterDeath: 0.15`); `MARKS` (L875); `dieOfWounds` at `wound-deaths` (Dec 12). The reserve is unhurt.
- **When** — distribute each fighter's already-rolled fate across the days **in the proportion of Johnson's daily losses**
  (DOCUMENTED, bexar-storming.md §4): Dec 5 carried **1 killed and 15 of 26 wounded (about 58%)**; Dec 6, 5 wounded (19%);
  Dec 7, Milam and 2 wounded (12%); Dec 8, 3 wounded and Belden (12%). So a family person's hit falls: **in Episode 1** (on a roof
  or crossing to the house, most likely), in `pinned` (at a loophole), in **Episode 2** (the yard, the crowbar door) or in
  **Episode 3** (under the loopholes, spiking the gun), chosen by a seeded share with those weights. A man sent in on Dec 8 can
  only be hit on Dec 8 (Episode 3 or the Row).
- **Why they fell:** "exposure, not constitution" — roofs, open crossings, yards, the guns (bexar-storming.md §8.2). Draw the hit
  there.
- **Showing it:** a man hit on a roof sits down behind the parapet and is lowered through the roof hole (the Greys did this; a
  blanket lowering is told, not drawn); in a street he is dragged into a doorway; the killed lie still inside a house's door or
  in a yard, never in the open street for long. The wounded go to **a house used as a hospital** (Levy and Pollard; Ehrenberg's
  29 "put into the hospital") and stay there after the fight (they cannot travel: `beginTravel` throws for `'wounded'`,
  `sim/world.mjs` L357). A dangerous wound's "lasting mark" (a lost leg, an eye, the use of an arm) is told, never drawn.
- **Civilians** (§3.8) are never drawn hurt.

### 3.6 A family's person: arrival and participation

**Today** (`sim/directors.mjs` `advanceStorming` L838–883; `sim/army.mjs` L878–959): `winter` (Dec 4 06:00) — a no goes home at
once (`settleAnswer` L684–686; unplayed stay 0.6); `milam` (Dec 4 18:00, closes at `assault` Dec 5 05:00 or opened + 360; unplayed
yes 0.4); `reinforce` (Dec 8 06:00, closes at `ugartechea` 18:00 or opened + 360; asked only of those whose Milam answer was not
yes, `who` at L895; unplayed 0.2); `stormedIn` (L904) is Milam yes or reinforce yes; **`fightStorming` (L912–959) rolls every fate
at `white-flag`, Dec 9 07:00** — and only if the `ugartechea` milestone has fired (`sim/directors.mjs` L862).

**Ways a person misses it or is resolved without taking part:**

| # | Case | Where |
| --- | --- | --- |
| a | **Fighters never enter the town.** They stand in the ranks at the mill from Dec 5 to 9 and are rolled there at the flag. | `fightStorming` L912–959 |
| b | Not a member (every case in §1.6; and the camp is a mile from the plaza, so a volunteer arriving at the town point is not within `FALL_IN_MILES` until the camp moves nearer). | `fallIn` L88–109 |
| c | Joined after `reinforce` closed: present, not fought. | L895 |
| d | Said no to `winter`, or the decision budget answered no for him: on the road home before the call. | `settleAnswer`; `decideQuestionFor` L704 |
| e | If `ugartechea` never fires (its `due` waits on `reinforce` having opened), `fightStorming` never runs and nobody is resolved. | `sim/directors.mjs` L857–862 |
| f | A man told "fought through the four days" (`tellStorming` L1013–1035) was, on the map, at the mill. | — |

**What should change:**

1. **A Milam yes walks into the town.** At **Dec 5 03:00** (Ehrenberg: "at three O'clock we hurried noiselessly") every
   `stormedIn` person leaves the ranks and joins **a division formation** in `world.battles['bexar-storming']`, by a seeded share
   (Milam's first division to the Garza house, Johnson's second to the Veramendi house; companies are volunteers' own, so the
   share is even, not by settlement — bexar-storming.md §7). The divisions walk from the mill (0.35–1 mile; under 20 minutes) and
   are inside the houses by 06:00. **Nobody is teleported**: a man at the mill at 03:00 is there before contact.
2. **Close `milam` at the roll (02:00), not at 05:00**, so the walk is a real departure; the 90-second budget protects the
   answer. A family answering "yes" at 04:30 in a slow class would today be "in" without having walked.
3. **A reinforce yes walks in on Dec 8** with Cheshire's, Sutherland's and Lewis's companies. Their departure is **at
   `reinforce` + the question's time** (the existing 6-hour rule may stay here: they went in during the day and fought that
   night), and they are in the town before Episode 3 (22:30).
4. **Resolve each fate at its staged moment** (§3.5), not at the flag; `tellStorming` says what he actually did (the house, the
   day). The `ugartechea` guard on `white-flag` should become independent: the flag happens whether or not the reinforce
   question ran (e).
5. **Move the mill camp** to about 0.45 mile north (§3.1). This also brings a volunteer who reaches the town point within
   `FALL_IN_MILES`, which is what the record describes (men who had left "changed their minds on hearing of our intended attack"
   and came back, Cooke 1844).
6. **Wounded stay in the town** (as today), in the hospital house; the fix in (1) makes that the place they were hit, not a
   teleport from the mill to `'bexar'` (L940–946 today).

### 3.7 Alert

- **Dec 4, 18:00, at the person's side, by a volunteer going down the lines** (reconstructed): *"Milam is calling for men to go
  into the town at daybreak. The ones who go are falling in by the mill. Does {name} go?"* — the existing `milam` question, carried
  by a person.
- **Dec 5, 05:00, at the person's side, by a sergeant of his division:** *"Neill's gun is firing on the Alamo to draw them off.
  We go in now, down the two streets, keeping to the walls."* — **Watch**.
- **To a family whose person stayed in the reserve**, 05:00: *"Cannon fire from the Alamo and the town. The men who went in with
  Milam are in the streets."* — **Watch** (heard from the mill).
- **Episodes 2 and 3**, at the side of anyone in the town: *"Karnes has a crowbar and is going for the door ahead."* / *"The Greys
  are going for the priest's house on the plaza tonight."* — **Watch**; never over an open question.
- **Dec 9, 06:30**, to every family with someone in the town or the camp: *"The firing has stopped. A white flag is coming to the
  plaza."* — **Watch**.

### 3.8 Aftermath

**What happened next** (DOCUMENTED, bexar-storming.md §5, §10): the capitulation (parole, not prison; muskets and ten rounds; the
convicts beyond the Rio Grande; citizens protected; prisoners of both sides freed); the army's vote; Cos out on Dec 14; Burleson
wrote that "the rest of the army will retire to their homes"; most colonists went home in mid-December, some with trophies; the
wounded stayed in Béxar under Levy and Pollard; United States volunteers held the town. The people of Béxar had been shut in
their houses for days; some were found when Texians broke through walls and let go; a woman of the town carrying water for the
Texians was shot (whether she lived is DISPUTED); the parish priest's house was taken with him in it; townswomen fled into the
Alamo; families fled to the Texian camp (`HIST-TEX-043`). **All of this is told in words in the account and the Rumor
Mill, and nobody is drawn hurt, as the owner answered on 2026-09-16 ("Told in text; nothing shown wounded", `docs/COLONIES.md`
§7c); townspeople may be drawn unhurt, leaving a house through a breach.**

**Modelled today:** `dieOfWounds` (Dec 12); `disbandArmy` (Dec 14, L1002–1010) starts every member home, the wounded excepted;
`tellStorming` on Dec 15; `bexar-end` Dec 16 closes the period; the winter's `beginSecondPeriod` (`sim/periods.mjs` L63–128) ends
every `volunteer` promise and sets people down at home unless mending. **A dangerously wounded man is still at Béxar in February
and is shut in the Alamo on Feb 23** (`beginSiege`, `sim/alamo.mjs` L82–96) — which is what happened to George Main and James
McGee, both wounded in December and both in the Alamo in March (TSHA; bexar-storming.md §8.3). Keep it, and say it on his card at
the rumour of Santa Anna (`warnGarrison` L103–108): *"{Name} is still lying at Béxar from the December wound."*

**Choices:** the existing ones. **The person comes home** (Dec 14) unless wounded; a wounded man comes home when he mends. Glory
as today (`fought` for those who went in, `present` for the reserve).

**Plain-words account:**

> On December 4 most of the army was packing up for winter quarters, and many men had already started home. Then a Mexican
> officer came over and said the town was weak, and Ben Milam asked who would go in with him. About two or three hundred men
> said yes. Before daylight on the 5th they crept into Béxar in two parties and broke into two stone houses north of the plaza.
> For four days and nights they fought from house to house: cutting holes in the thick walls to shoot through, digging trenches
> across the streets, breaking through walls with crowbars, while cannon fired on them from the town and from the Alamo. Milam
> was shot and killed on the third day. On the fourth night they took the priest's house on the plaza itself. That night General
> Cos pulled his men back into the Alamo, some of his cavalry rode away, and in the morning a white flag came out. Cos agreed to
> leave Texas with his soldiers on his promise not to fight against the Constitution of 1824. Four to six of our men died and
> about thirty were wounded. {Name} {went in with Milam's division and fought in the Garza house; came through unhurt | …was
> wounded on the {first day | second day | third day | last night} and is lying in the town under the surgeon's care | …was
> killed on the {day} | …went in with the companies sent from the camp on the 8th | …held the camp at the mill with the reserve}.

### 3.9 Art

**In the library:** `stone-tile-house`, `adobe-flat`, `adobe-tile`, `courtyard-house`, `wall-breach`, `brick-breach`, `palisade`,
`earth-rampart`, `log-barricade`, `sacks` (sandbags), `tools`, `caregiver-aid`, `bandage-roll`, `alamo-cot-blanket`, the Béxar
assembly (`docs/BEXAR_ASSEMBLY.md`), `cannon-iron-*`, `volunteer-*`/`regular-*` fire, load, surrender, injured.

**Missing — for `docs/ART_REQUESTS.md`:**

| Need | Why | Stand-in |
| --- | --- | --- |
| **Flat-roofed stone house with a parapet and loopholes**, muzzle flashes at the holes | "a pigeon nursery" (Lopez); the whole fight | `stone-tile-house`/`adobe-flat` with `muzzle-flash-*` and `musket-smoke` placed at the wall |
| **Street barricade**: ditch, bank, post palisade, gun embrasure | Field; Dance; the 2007 archaeology | `earth-rampart` + `palisade` + `cannon-bronze-*` |
| **Crowbar and axe at a wall or door**, and the hole | Karnes (Johnson) | `*-repair`/`*-work` poses with `tools`; `wall-breach` |
| **A trench across a street**, men crouched in it | Johnson, Dec 5–6 | low `earth-rampart` + `*-work` digging |
| **Sandbag breastwork** | Johnson, Dec 6 | `sacks` stacked |
| **Firing through a loophole** (the barrel at the wall, the man half-hidden) | the Texian fire pattern | `volunteer-fire-reload` drawn behind the wall sprite, clipped to its top |
| **The twelve-pounder firing through a loophole** | Ehrenberg; Lopez | `cannon-iron-*` against `stone-tile-house` |
| **White-flag bearer, bugler, parleying officers** | Sánchez Navarro | `regular-surrender-*` with a white rectangle; `regular-idle-*` |
| **A red or black flag over a Mexican battery** | Ehrenberg; Dance; Sánchez Navarro (STRONGLY SUPPORTED) | none: told in text until requested |
| **Townspeople coming out of a breach** (women, children, an old man) | Ehrenberg; Field | `rust-woman-walk-*`, `child-*`, `elder-*` |
| **A house used as a hospital** | Levy; Ehrenberg | `alamo-cot-blanket`, `caregiver-aid`, `bandage-roll` in a `courtyard-house` interior |
| **Cavalry riding off south in the dark** | Sánchez Navarro | `dragoon-march-s` under a night layer |
| **Night and moonlight**, and **cold rain** (Dec 7–8) | Cooke's "bright moon"; Johnson's "cold and wet" | a darkening layer; no weather art exists (requested in grass-fight.md §13) |

### 3.10 Proposed `HISTORY.md` rows

```
| **HIST-TEX-490** | DOCUMENTED | **Where the losses of the storming fell, day by day** (Johnson to Burleson, December 11, 1835). December 5: one private killed; Col. Grant and a first lieutenant severely wounded, a colonel slightly, three privates dangerously, six severely and three slightly — more than half of all the wounded, on the first day, when the divisions were exposed on roofs and in the streets. December 6: three privates severely and two slightly wounded. December 7: Milam killed, two slightly wounded. December 8: a captain seriously and two privates severely wounded, and Belden dangerously in the night attack on the Priest's House. The reserve at the mill recorded no loss (Burleson to Smith, December 14). Researched in `docs/battle-research/bexar-storming.md` §4 and §6. | The moments a family's fighter's existing fate resolves in `sim/battles/bexar-storming.mjs` (`staging.md` §3.5), weighted by these days. |
| **HIST-TEX-491** | STRONGLY SUPPORTED | **Calls and flags at Béxar.** The Mexican side flew a red or black flag over its battery or the church during the storming (Ehrenberg; Dance; the Texian commissioner's words to Sánchez Navarro, "yesterday you flew a black flag on the battery"). On the morning of December 9 Sánchez Navarro used a white flag because the Texians did not understand the bugle's call for a parley. Colonel Condelle, holding the plaza guns, refused to surrender because the Morelos battalion had never surrendered (Sánchez Navarro, *La Guerra de Tejas*, as translated in Huson). Researched in `docs/battle-research/bexar-storming.md` §4.1, §4.3, §5.1. | The parley bugle and the white flag in Episode 4; Condelle's refusal as reported speech; the flag over the battery told in text until art exists. |
| **HIST-TEX-492** | TRADITION | **"Who will go with old Ben Milam into San Antonio?"** The call is given in these words by TSHA (*Milam, Benjamin Rush*), F. W. Johnson's *Texas and Texans* (1880s), Creed Taylor (c. 1900) and the *State Gazette* (1849); no document of December 1835 read gives Milam's words, and who first proposed the call is DISPUTED (Johnson; Cooke, who says he raised about 300 and proposed Milam; Burleson's authorisation per W. T. Austin). Creed Taylor's line drawn on the ground with a rifle stock is not supported and looks borrowed from the Alamo story. Researched in `docs/battle-research/bexar-storming.md` §3.2. | Milam's call may be shown only with `kind: 'tradition'` (owner question B2); the line on the ground is never shown. |
| **HIST-TEX-493** | DOCUMENTED | **Men wounded at Béxar in December were in the Alamo in March.** George W. Main and James McGee, both severely wounded in the storming, stayed at Béxar and were in the Alamo garrison in March 1836 (TSHA *Main, George Washington*; TSHA *McGee, James*). Researched in `docs/battle-research/bexar-storming.md` §8.3. | Supports shutting in a family's man still lying wounded at Béxar on February 23 (`beginSiege`), said on his card. |
| **FIC-GONZ-425** | **FICTIONAL FOR GAMEPLAY** | **The storming of Béxar as staged** (`docs/battle-research/staging.md` §3). Invented here: four held episodes (the entry, Karnes's door and Milam's death, the Priest's House, the flag) with the town fighting at the ordinary military cap between them; the Milam question closing at the 2 a.m. roll and the volunteers walking from the mill at 3 a.m. into two division formations by a seeded, even share; the reinforcement walking in during December 8 before the night attack; each fighter's existing fate resolving on a day weighted by Johnson's daily losses, at a roof, a crossing, a yard or a loophole; the hospital house; the mill camp moved to about 0.45 mile north; the flag independent of the reinforce question; the drawn counts (one figure to two men in the town, one to five in the reserve and on the Mexican side); the alert cards' words; and every reconstructed line in §3.4. | |
```

### 3.11 Questions for the owner

**B1. How the four days play.**
- (a) **Four held episodes (the entry; Karnes and Milam; the Priest's House; the flag), about 12 real minutes in all at Study,
  with the town fighting visibly at a slower background pace between them.** *(Recommended.)*
- (b) Hold the whole four days at the battle pace (about 30–40 real minutes at Study; long, and most of it men waiting behind
  walls).
- (c) Hold only the entry; the rest background and words.

**B2. Milam's call, which rests on later accounts.**
- (a) **Milam says it in a bubble drawn as tradition (dashed edge), with the claim row explaining.** *(Recommended: it is the
  best-known line of the fight and the class should learn it and learn how we know it.)*
- (b) Told in narration only, not spoken by Milam.

---

## 4. San Patricio (27 February 1836) and Agua Dulce Creek (2 March 1836)

Research: [alamo.md](alamo.md) §3 and §7 (TSHA entries); new on 2026-09-25: TSHA *San Patricio, Battle of* and *Agua Dulce
Creek, Battle of*, Wikipedia *Battle of San Patricio* and *Battle of Agua Dulce* (§12). Registered: `HIST-TEX-059`,
`FIC-GONZ-045`.

### 4.1 Ground and positions

| Place | Where | Status |
| --- | --- | --- |
| San Patricio de Hibernia, on the Nueces | map site `san-patricio` at `(-18.41, 104.26)` with **`outside: true`** — drawn on the province map, **never walked to** (`sim/texas.mjs` L63; colonies map) | DOCUMENTED place, **not walkable today** |
| Johnson's men in the town | Captain Pearson and eight men camped on the public square; the rest in three houses | DOCUMENTED (TSHA) |
| The horse guard | twelve men at the ranch of Julián de la Garza, about four miles outside the town | Wikipedia (medium) |
| Agua Dulce Creek | "twenty-six miles below San Patricio" (TSHA), on the road south; two groves of trees | DOCUMENTED distance; groves per Wikipedia |
| Refugio, where the game keeps the Matamoros men | map site `refugio` `(11.81, 82.27)`; `SERVICE.matamoros` stands there (`sim/winter.mjs` L29–43; "Johnson and Grant were at San Patricio, which is not on the map") | the game's stand-in |
| Goliad, where escapees go | `goliad` `(5.3, 58.09)`; Refugio–Goliad 26.9 miles | DOCUMENTED |

**Camera.** San Patricio: the square and the three houses, at night, lanterns in some windows. Agua Dulce: about 0.6 × 0.4 mile
of prairie with the two groves and the road, the horse herd coming north.

### 4.2 Phases

**Date and hour of San Patricio are DISPUTED**: 3:00 a.m. on 27 February (TSHA) or 3:30 a.m. on 26 February (Wikipedia). The
game uses 27 Feb 03:00 (`san-patricio`, `sim/directors.mjs` L924); keep it with the dispute registered. **Agua Dulce's hour** is
"between 10 and 11 am" (Wikipedia); the game uses 06:00 ("its hour is not in the record", L97 comment) — **move it to 10:30**.

| Phase | Starts | Game min | What happens | Status | Held |
| --- | --- | --- | --- | --- | --- |
| **SP** `night` | Feb 27, 01:00 | 120 | A "bitterly cold, wet night"; Urrea's column (about 400 by forced march; six of his men die of exposure) comes up. Officers in civilian dress went ahead; local centralists told which houses held Texians and left lanterns in their own windows. | TSHA; Wikipedia | not held |
| **SP** `ranch` | 03:00 | 10 | Thirty men under Capt. Rafael Pretalia fire on the sleeping horse guard at the ranch four miles out: four killed, eight taken. | TSHA; Wikipedia | 30 s |
| **SP** `houses` | 03:00 | 15 | In the town: one house surrenders at once, another fires back (a Mexican officer killed); "within fifteen minutes" it is over. Johnson and three or four men go out a back door and away. | Wikipedia; TSHA | 90 s |
| **SP** `after` | 03:15 | 60 | Prisoners gathered in the square; the escaped ride east for Goliad. | TSHA | not held |
| **AD** `herd` | Mar 2, 09:30 | 60 | Grant's 26 (23 Americans and three Mexicans, TSHA) driving several hundred horses north toward San Patricio; Plácido Benavides sent ahead to warn Fannin. | TSHA; Wikipedia | 30 s |
| **AD** `ambush` | 10:30 | 20 | Dragoons hidden in two groves charge as the party reaches the trees; men scatter; lanced as they flee; Grant surrounded and killed; Reuben Brown lassoed and taken. | Wikipedia (medium) | 2 min |
| **AD** `after` | 10:50 | — | Six captured; six escape (five later die at Goliad). | TSHA | not held |

### 4.3 Formation style and counts

| Fight | Texian | Mexican |
| --- | --- | --- |
| San Patricio | **`camp`**: asleep in three houses and on the square; then men firing from doorways and windows, a few running out the back. Not a line at all. | Dragoons and infantry in the dark, **`column`** into the town guided by local men, then **`street`**: at the doors. The ranch party **`mounted`**. |
| Agua Dulce | **`loose`**, strung out behind a loose herd of several hundred horses, mounted; then **`rout`**. | **`mounted`**: dragoons hidden in the groves, then a charge with lances and a chase. |

**Counts.** San Patricio **34** Texians (TSHA; "at least seven of them were Mexicans"); Urrea **about 400**, of whom perhaps 100
come into the town (RECONSTRUCTED). Agua Dulce **26** Texians; dragoons in the groves, number not in the sources read (draw
about 60). Draw 1:1.

**The owner's instinct, honestly.** Neither fight had rows on either side. Both were surprises by cavalry against men who were not
formed: asleep in houses, or driving horses.

### 4.4 Talk

| When | Speaker | Line | Kind |
| --- | --- | --- | --- |
| `houses` | Mexican officer | "¡Ríndanse!" — *Surrender!* | reconstructed |
| `houses` | Texian, any | "They're in the square!" / "Out the back!" | reconstructed |
| `ambush` | Mexican officer | "¡A la carga!" — *Charge!* | reconstructed |
| `ambush` | Texian, any | "Leave the horses — ride!" | reconstructed |

No documented words. Grant, Johnson, Brown and Benavides speak nothing.

### 4.5 Casualty moments

- **Rates in code:** `SOUTH_RATES` (`sim/alamo.mjs` L51–54): `'san-patricio': { killed: 8/27, captured: 13/27 }` and
  `'agua-dulce': { killed: 14/26, captured: 6/26 }`; `fightSouth` (L295–310) weights the death share by frailty (`dies =
  1-(1-killed)^frailty`) but not the capture share; `splitSouth` (L290–292) sends each man to Johnson's party at `34/60`.
- **When:** San Patricio at `houses` (or `ranch` if the man is drawn on the horse guard, 12 of 34); Agua Dulce at the first
  charge of `ambush`. **Showing it:** at San Patricio in the dark only the muzzle flashes and the lanterns show; a killed man is
  not drawn falling (the scene is dark and short), and a captured man is drawn with hands raised (`volunteer-surrender`) in the
  square at `after`. At Agua Dulce a rider falls from the saddle at distance and lies still in the grass; lances are shown held,
  not striking.
- **The captives' fate is DISPUTED:** TSHA sends them to Matamoros; Wikipedia says the San Patricio prisoners were all dead
  "within 72 hours", with reports of torture. The game uses Matamoros (`HIST-TEX-059`). Keep it and register the dispute (§4.10);
  owner question S2.

### 4.6 A family's person: arrival and participation

**Today:** `join-matamoros` (`sim/chores.mjs` L680–690) goes to **Refugio**; `stillOpen('matamoros') = !passed('san-patricio')`
(`sim/winter.mjs` L58); unplayed families 0.02; the man stands at Refugio as `service.kind 'matamoros'`. At `san-patricio`,
`splitSouth` and `fightSouth` roll him where he stands; the escaped become `kind: 'fannin'` and walk 26.9 miles to Goliad.

**Ways he misses it or is resolved without being there:**

| # | Case | Where |
| --- | --- | --- |
| a | **He is at Refugio, 30-odd miles from San Patricio, and the fight is a roll.** San Patricio is `outside: true`; there is no route (`findWay` Gonzales → San Patricio: none). | `fightSouth` L295–310 |
| b | Arriving at Refugio after Feb 27 03:00: shut out and sent home. | `joinService` (`sim/winter.mjs` L110–130) |
| c | An Agua Dulce man can be recalled between Feb 27 and Mar 2 06:00 (his party had not been hit). | `recallRefusal` L149–158 |
| d | **Edge case:** between the fight and its word (Mar 3 / Mar 7), a killed or captured man is still `'serving'` and can be sent for; `tellSouth` later sets him dead or captured wherever he then is. | `recallRefusal`; `tellSouth` L313–335 |

**What should change** (depends on owner question S1):

1. **Recommended (S1 a): make San Patricio and the Agua Dulce ground walkable places** — extend the region map south-west to the
   Nueces for these two points and a road Refugio → San Patricio → Agua Dulce. Then `join-matamoros` goes to **San Patricio**;
   `splitSouth` runs when Grant's party leaves south to gather horses (RECONSTRUCTED date about Feb 20; not found in the sources
   read), and the Agua Dulce men ride south with him and are coming back north with the herd on Mar 2.
2. **Close the join earlier:** a man must reach San Patricio before the raid; the card computes his arrival and refuses honestly if
   he cannot be there by Feb 26 evening ("He would not reach Johnson's men at San Patricio before the end of the month").
3. **The recall edge (d):** refuse a recall once his party's fight has happened, with the words "No word has come from {place}"
   — the family does not learn his fate by the refusal, only that nobody can reach him.
4. **Agua Dulce at 10:30**, not 06:00.

If the owner chooses S1 (b) or (c), the fights stay at Refugio in the data and the staging is shown on a battle ground at the
map's southern edge (b) or not drawn (c); in either case (d) and the hour still apply.

### 4.7 Alert

- **San Patricio, 03:00, at the person's side**, by the man on watch (reconstructed): *"Soldiers in the square! They're at the
  doors!"* — **Watch** (short, dark).
- **Agua Dulce, 10:30, at the person's side**, by a rider of the party: *"Horsemen in the trees ahead!"* — **Watch**.
- **No card to the family at home**: word of San Patricio reaches families on Mar 3 and of Agua Dulce on Mar 7 (existing
  `san-patricio-news`, `agua-dulce-news`).

### 4.8 Aftermath

**Historically:** the dead left where they fell; the captured taken to Matamoros (or, per Wikipedia, the San Patricio prisoners
killed — DISPUTED); the few who got away (Johnson and his companions; six from Agua Dulce) went to Goliad, where five of the Agua
Dulce six died on March 27. **Modelled:** `tellSouth` — killed → dead; captured → `health.condition 'captured'` ("…marched to
Matamoros"); escaped → `kind 'fannin'` at Goliad. **Choices:** none; an escaped man at Goliad can be sent for until Fannin marches
(`FANNIN_MARCHES`, §6.6). **He does not come home** unless the family sends for him from Goliad.

**Plain-words account:**

> In January a few hundred volunteers set out to attack the Mexican town of Matamoros; most turned back, but about sixty stayed
> with Frank Johnson and James Grant near the Nueces River. Early on the morning of February 27, in the cold and wet, General
> Urrea's cavalry came into San Patricio while Johnson's men were asleep in three houses. Local people who sided with the
> Mexican government had shown the soldiers which houses to surround. In a quarter of an hour it was over; a few men, Johnson
> among them, got out a back door. Three days later Urrea's horsemen hid in two groves by Agua Dulce Creek and caught Grant's
> party driving horses north; Grant was killed. Most of the men were killed or taken prisoner, and the few who escaped rode to
> Colonel Fannin at Goliad. {Name} {was killed at {place} | was taken prisoner and marched south toward Matamoros | got away in
> the dark and has gone to Fannin at Goliad}.

### 4.9 Art

| Need | Why | Stand-in |
| --- | --- | --- |
| **Night layer with lantern-lit windows** | the lanterns (Wikipedia) | darkened map; a small warm light at `adobe-flat` windows |
| **Lancers** (dragoon with a lance, charging) | Agua Dulce | `dragoon-march-*` (no lance, no charge gait) |
| **A loose herd of several hundred horses driven** | Grant's party | `mustang-gallop`/`mustang-graze` repeated |
| **A rider falling from the saddle / a riderless horse** | the chase | `volunteer-injured-rest` in the grass beside `horse-walk` |
| **Lasso** | Reuben Brown | none: told |

### 4.10 Proposed `HISTORY.md` rows

```
| **HIST-TEX-510** | DOCUMENTED, with disputes | **How San Patricio was taken.** On a "bitterly cold, wet night", Urrea's column, about 400 men on a forced march (six died of exposure), reached San Patricio in the small hours; thirty men under Capt. Rafael Pretalia fell on the horse guard at a ranch about four miles out; in the town Captain Pearson and eight men camped on the square and the rest were in three houses; local centralists had shown which houses held Texians and lit lanterns in their own windows; one house surrendered at once, another fought, and it was over "within fifteen minutes"; Johnson and a few men escaped by a back door to Goliad (TSHA *San Patricio, Battle of*; Wikipedia *Battle of San Patricio*, read 2026-09-25). **DISPUTED:** the date and hour (3 a.m. February 27 per TSHA; 3:30 a.m. February 26 per Wikipedia); the counts (TSHA's own entry gives 8 killed, 13 captured, 6 escaped, and elsewhere sixteen killed and twenty-four taken; Wikipedia 11 killed, 5 mortally wounded, 21 captured); **and the prisoners' fate** (to Matamoros per TSHA and `HIST-TEX-059`; "within 72 hours all of the prisoners were dead" per Wikipedia). | `sim/battles/san-patricio.mjs`: a night surprise at the houses; the game keeps Matamoros and the `SOUTH_RATES` shares until the dispute is settled. |
| **HIST-TEX-511** | STRONGLY SUPPORTED | **How Grant's party was caught at Agua Dulce Creek, March 2, 1836.** Twenty-six men (twenty-three Americans and three Mexicans, TSHA) driving several hundred horses north toward San Patricio were attacked between 10 and 11 a.m. by dragoons who had taken cover in two groves of trees; the men scattered and were ridden down with lances; Grant was killed; Reuben Brown was lassoed and taken; Plácido Benavides had been sent ahead to warn Fannin (TSHA *Agua Dulce Creek, Battle of*; Wikipedia *Battle of Agua Dulce*, read 2026-09-25). | The hour of `agua-dulce` moves from 6 a.m. to about 10:30; a mounted rout, not a line. |
| **FIC-GONZ-435** | **FICTIONAL FOR GAMEPLAY** | **San Patricio and Agua Dulce as staged** (`docs/battle-research/staging.md` §4). Invented here: San Patricio and the Agua Dulce ground as walkable places with a road from Refugio (if the owner chooses it); the date Grant's party rode south (about February 20); the join closing when a man could no longer reach San Patricio before the raid; a recall refused once his party's fight has happened, without revealing his fate; the phase lengths; how many of Urrea's men came into the town; the drawn dragoons at Agua Dulce; and every reconstructed line in §4.4. | |
```

### 4.11 Questions for the owner

**S1. San Patricio is off the walkable map.**
- (a) **Extend the map to the Nueces for San Patricio and the Agua Dulce ground, with a road from Refugio; the Matamoros men go to
  San Patricio and ride out from it.** *(Recommended: the owner's rule is that a person sent to a fight arrives there and takes
  part; today he waits at Refugio, thirty miles away, and is rolled.)*
- (b) Keep the men at Refugio in the data, and draw the two fights on a battle ground at the map's southern edge (a person is
  walked to the edge and on to it).
- (c) Keep Refugio and tell both fights in words only.

**S2. What became of the San Patricio prisoners** (TSHA: to Matamoros; Wikipedia: all dead within 72 hours).
- (a) **Keep Matamoros, and register the dispute.** *(Recommended: TSHA is the stronger authority and `HIST-TEX-059` rests on it;
  a family's captured man stays alive as a prisoner.)*
- (b) Follow Wikipedia: the San Patricio prisoners are killed.

---

## 5. The Alamo assault, 6 March 1836

Research: [alamo.md](alamo.md), [../ALAMO_FATES.md](../ALAMO_FATES.md), [../ALAMO_LAYOUT.md](../ALAMO_LAYOUT.md); new on 2026-09-25:
TSHA *Alamo, Battle of the* (the assault), Wikipedia *Battle of the Alamo* (the orders of March 5 and the assault, citing Hardin,
Todish, Edmondson), TSHA *Degüello*, the Alamo's *Joe's Account* (§12). Registered: `HIST-TEX-054` to `-058`, `-090` to `-092`,
`-430` to `-439`, `FIC-GONZ-045`, `-380` to `-386`. The siege's courier scenes already exist (`sim/alamo-runner.mjs`) and are not
restaged here.

### 5.1 Ground and positions

The compound is `public/alamo-layout.js` (feet, north-up, x east, y south), placed on the map at `ALAMO_ORIGIN` (`sim/alamo-runner.mjs`
L25) through `alamoOnMap` (L26; `public/bexar-layout.js` `ALAMO_FRONT`/`alamoOnMap` L111–114), at the historical dimensions
(`HIST-TEX-090` to `-092`).

| Place | In the layout | Who is there at 5 a.m. |
| --- | --- | --- |
| North wall, 243 ft 9 in, **twelve destructible sections** | `northWidth = 243.75` (L21, L25) | Travis at the north battery; riflemen along it. **The Mexican battery within musket shot of it since March 3** (`HIST-TEX-437`). |
| West wall and west range (Travis / Joe quarters, reconstructed) | L26–27, L37 | riflemen; guns on the wall |
| South: low barrack with the gate, the south-west corner battery (the 18-pounder in the record) | `low-west`, `south-entry`, `low-east` L50–54; `south-gate` L29 | gunners; Crockett's men traditionally at the palisade (TRADITION; not asserted) |
| The palisade, church to low barrack | `palisade-south` L32 | riflemen |
| East: the long barrack (two storeys), the pens, the hospital | `long-barrack-1..6` L43; `hospital` L48; pens L44–45 | Bowie ill in a room (DOCUMENTED: killed in his bed); the fallback |
| The church, 4-ft walls, roofless; sacristy | `churchX = 291, churchY = 355` L55–72 | the gun platform at the church's rear (Dickinson's guns, STRONGLY SUPPORTED); **the noncombatants in the sacristy** ("Most of the noncombatants gathered in the church sacristy", Wikipedia) |
| The main plaza | `plaza` polygon L75 | where the code puts everybody today (`postOf`, `sim/alamo-runner.mjs` L55: x 40–180, y 130–410 ft) |

**The four columns and the rest** (the orders of March 5 as tabulated by Wikipedia from Hardin and Todish; STRONGLY SUPPORTED):

| Column | Men | Carrying | Against | Forms up |
| --- | --- | --- | --- | --- |
| Cos | 350 | 10 ladders, 2 crowbars, 2 axes | the north-west corner and west wall | north-west, about 200–300 yds out |
| Duque (Castrillón after Duque is hit) | 400 | 10 ladders | the north wall | north, behind the battery |
| Romero | 400 | 6 ladders | the east side (pens, long barrack) | east |
| Morales | 125 (cazadores) | 2 ladders | the south: the palisade, the south-west corner and the gate | south |
| Reserve (grenadiers and zapadores), with Santa Anna | 400 | — | north, behind the battery | north |
| Ramírez y Sesma's cavalry | 500 | lances | around the compound, **to catch anyone who runs** | east and south, out on the prairie |

Soldiers were ordered not to wear overcoats. Draw the columns 1:5 (about 250 figures), the cavalry 1:10 (50), and the garrison
**1:1** (about 180–190), since every defender is a man inside and a family's man must be drawn among them.

**Camera.** Before contact: the whole compound from the north, the columns as dark masses on the cold ground. From the first
volley: the north wall at close compound scale. From the fall of the north wall: the plaza and the long barrack. At the end: the
church. The Host's spotlight (`alamo-fall`, `sim/directors.mjs` L931) frames the compound, not Béxar's plaza.

### 5.2 Phases

Sunrise on 6 March at Béxar is about **6:20 local time** (COMPUTED); the assault is fought in the dark and ends about sunrise.
The code fires `alamo-assault` at 05:00 (`sim/directors.mjs` L931).

| Phase | Starts | Game min | What happens | Status | Held |
| --- | --- | --- | --- | --- | --- |
| `quiet` | Mar 5, 22:00 | 360 | The Mexican guns stop at 10 p.m. The garrison sleeps; few sentries. After midnight the columns form and move to their places and lie on the cold ground. The last courier, James Allen, has gone out in the evening. | DOCUMENTED (`HIST-TEX-437`); the columns' night STRONGLY SUPPORTED | not held; **no card** (nobody inside knew; §5.7) |
| `advance` | Mar 6, 05:00–05:30 | 10 | The columns get up and move in silence; the sentries outside the walls are killed without a shot. | STRONGLY SUPPORTED | 45 s |
| `alarm` | ~05:30 | 5 | The silence is broken by shouts of "¡Viva Santa Anna!" and bugles; the defenders wake; Travis runs to the north battery calling to his men (Joe). | STRONGLY SUPPORTED; Travis's words DOCUMENTED (testimony) | 30 s |
| `repulse` | ~05:35 | 15 | Canister rips the columns; they halt, re-form and come on; Cos's column swings from the west to the north; Romero's is driven from the east toward the north too; **the columns merge into one mass at the foot of the north wall**. Travis is killed at the north battery, among the first. | DOCUMENTED (TSHA: "Staggered by the concentrated cannon and rifle fire, the Mexican soldiers halted, reformed, and drove forward"; Travis "among the first to die, fell on the north bastion") | ~90 s |
| `north-wall` | ~05:50 | 10 | Up the ladders and the wall's rough face; over at the north; in the south Morales's men take the south-west corner battery. The defenders leave the walls. | DOCUMENTED in outline | ~60 s |
| `fallback` | ~06:00 | 15 | Defenders fall back across the plaza into the long barrack and the church; the captured guns are turned on the barrack's doors; **men who go over the east and south walls are cut down by the lancers outside** (`HIST-TEX-436`). | DOCUMENTED (TSHA; Hardin) | ~60 s |
| `rooms` | ~06:15 | 15 | Room by room in the long barrack, "some of the bloodiest hand-to-hand fighting"; Bowie killed in his bed; the church last, its guns silenced. Joe hides in a room and fires from it. | DOCUMENTED (TSHA; Joe) | ~60 s |
| `end` | ~06:30 | 30 | Firing stops about sunrise. Five to seven men found alive are killed on Santa Anna's order (`HIST-TEX-435`). The women and children are brought out of the sacristy; Joe is found, is attacked and is saved by a captain. | DOCUMENTED | 30 s, then released |
| `after` | Mar 6, day | — | The Texian dead are burned on pyres; the Mexican dead buried in the Campo Santo. The spared are taken to Músquiz's house and questioned; on March 8 they are let go (`survivors-leave`). | DOCUMENTED | not held |

**Held ≈ 6½ real minutes** at Study. The assault "lasted no more than ninety minutes" (TSHA); the reconstructed shape above fits
it inside about an hour, which Wikipedia's "over by about 6:30" supports.

### 5.3 Formation style and counts

| Phase | Texian | Mexican |
| --- | --- | --- |
| `advance`–`repulse` | **`wall`**: gunners serving about twenty guns at the batteries (crews drawn; `volunteer-gun-*` poses), riflemen along the parapets firing at will. | Four **`column`s** with ladders at the front, in the dark; **they lose their order under canister** and drift into one mass at the north wall — here the Mexican "rows" become the disorder. |
| `north-wall` | **`wall`** breaking: men leaving the walls. | A **climbing mass** at the north wall; Morales's column at the south-west battery. |
| `fallback`, `rooms` | **`building`** (proposed style, §9): inside the long barrack's rooms and the church, firing from doorways and loopholes; a few running over the east and south walls (**`rout`**). | Infantry across the plaza in no order; guns turned on doors; the cavalry outside in **`mounted`** pickets, riding down runners. |

**Counts.** Defenders **182–257; 189 on the official list** (`HIST-TEX-058`); draw 1:1 at about 190. Assault columns **about
1,275 plus a reserve of 400** (the March 5 orders; TSHA "about 1,800") and 500 cavalry. **Mexican killed and wounded about 600**
(TSHA; 400–600 most historians); draw about a quarter of the drawn column figures falling in `repulse` and `north-wall`.

**The owner's instinct, honestly.** The Mexicans came in columns, not firing lines, and their columns fell into a mass under fire;
the Texians fought from walls and then from rooms. The picture of "Mexican rows against Texian chaos" is wrong here on both
counts.

### 5.4 Talk

| When | Speaker | Line | Kind, source |
| --- | --- | --- | --- |
| `alarm` | Mexican, many | "¡Viva Santa Anna!" | **documented**-grade as a shout of the columns (STRONGLY SUPPORTED: Wikipedia, citing Hardin/Todish; `HIST-TEX-501` proposed) |
| `alarm` | bugles (Mexican) | caption: *Bugles sound the attack.* | STRONGLY SUPPORTED |
| `alarm` | W. B. Travis | "Come on boys, the Mexicans are upon us, and we'll give them Hell." | **documented**: Joe's account as William F. Gray recorded it on March 20, 1836 (the Alamo, *Joe's Account*; `HIST-TEX-502` proposed). Speaker `{ role: 'officer', side: 'texian', name: 'Travis' }`. |
| `repulse` | Mexican officer | "¡Escalas al frente!" — *Ladders forward!* / "¡Adelante!" — *Forward!* / "¡Arriba!" — *Up!* | reconstructed |
| `repulse` | Texian gunner | "Canister! Load canister!" / "They're coming again!" | reconstructed |
| `north-wall` | Texian, any | "They're over the north wall!" / "Fall back to the barracks!" | reconstructed |
| `rooms` | Mexican officer | "¡A la bayoneta!" — *With the bayonet!* | reconstructed |
| `end` | Mexican officer | "¿Hay negros aquí?" — *Are there any Black men here?* | **reconstructed wording of a documented event**: Joe said officers "came around... calling out to know if there were any" (Gray's record). Drawn as the officers calling, captioned with the English of Gray's record rather than an invented Spanish line. |

**The *degüello*** (the "no quarter" call): TSHA's short entry says it was played as the signal for the attack; the earliest
account is R. M. Potter (1860), not an eyewitness; modern historians such as Hardin leave it out. **DISPUTED/TRADITION.**
Recommended (owner question A1): the bugles in `alarm` are captioned only as "the attack"; the *degüello* is named in the account
and the learning panel as something told later.

**The line in the sand** (March 3–5, not the assault): Zuber's story of 1873, from a man not there, who admitted in 1877 inventing
part of Travis's speech; Davis: "the event simply did not happen" (`HIST-TEX-437`). **TRADITION.** Recommended (A2): not shown as
an event; the account may say "a story told many years later says Travis drew a line in the sand; historians doubt it happened".

**The red flag of no quarter** flew from the start of the siege (`HIST-TEX-054`): draw it on San Fernando's tower through the
assault, where the siege already should.

### 5.5 Casualty moments

- **The code's rule** (`stormAlamo`, `sim/alamo.mjs` L253–260; `alamoRole` L56–63; `docs/ALAMO_FATES.md` §4): every fighter inside
  **falls**; every woman and child inside is **spared**; a courier already out lives. No roll. Health is not changed until the
  word (`tellFall` L272–287).
- **When:** a family's fighter falls **at his post's phase**: a north-wall post in `repulse` or `north-wall`; a west or south post
  in `north-wall`; anyone who reaches the long barrack or the church in `rooms`. Posts are assigned (§5.6) by a seeded share
  weighted to where the garrison stood, so most of a class's men are on the north and west walls and fall early — as Travis did.
- **Showing it:** the man is seen firing at his post; when the wall is carried he is **seen to go down** among others and **the
  camera stays on the wall, not on him** (§5.11 A3); no body closer than compound framing; nobody is drawn being killed after
  surrender (the executions are told in the account, `HIST-TEX-435`). Running men are seen going over the east wall and the
  lancers riding toward them at distance; they are not seen struck.
- **Noncombatants:** a family's woman or child is in the **sacristy** from `alarm` and is brought out at `end`. The record's
  noncombatant deaths (`HIST-TEX-433`) are not modelled, by the existing `ceiling:`.

### 5.6 A family's person: arrival and participation

**Paths in** (`sim/alamo.mjs`, `sim/winter.mjs`, `sim/chores.mjs`):

1. **The garrison from the winter:** `join-garrison` (`sim/chores.mjs` L657–667) to `bexar`, open until `alamo-siege`
   (`stillOpen`, `sim/winter.mjs` L57); `joinService` (L110–130) makes `{ kind: 'garrison', siteId: 'bexar' }`.
2. **Anyone standing at Béxar at 14:30 on Feb 23** (`beginSiege` L82–96), including a man still lying wounded from December
   (§3.8), is shut in and moved to a post by `takePost` (L93; `sim/alamo-runner.mjs` L57–60).
3. **The Gonzales relief:** `join-relief` (`sim/chores.mjs` L669–679) to Gonzales before `relief-leaves` (Feb 27 14:00);
   `reliefRides` (L224–232) starts them for Béxar; `reliefEnters` (L235–245) at Mar 1 04:00 puts them inside.
4. **Couriers out:** `askCouriers` (L137–157), the runner (`sim/alamo-runner.mjs`), `sendCouriers` (L204–221); a chosen man is
   released and leaves.

**Ways a person is late, misses it, or is resolved wrongly:**

| # | Case | Where | Effect |
| --- | --- | --- | --- |
| a | **`reliefEnters` teleports** every relief man with `riding` to the Béxar site at 04:00 on Mar 1, "whatever their travel progress" | L235–245 | breaks "no teleport" (VISION §4); `docs/MILITARY_EXPERIENCE.md` names it |
| b | A relief man away from Gonzales, or travelling, at 14:00 on Feb 27 is not set `riding`; he stays `'relief'` and is never taken in | `reliefRides` L224–232 | misses it silently |
| c | `join-relief` must start from home (`where: 'home'`, `sim/chores.mjs` L1303), with a `work: 1` step that must finish before 14:00 | L669–679 | a family that hears on Feb 26 12:00 (other settlements) cannot reach Gonzales in time from most places, and is not told so |
| d | **A courier is walked, not ridden**: `beginTravel(…, 'gonzales', eventId, 'home')` with no mode | `sendCouriers` L204–221 | he cannot reach Gonzales before the relief leaves; `docs/ALAMO_FATES.md` §4's "may be sent back in with the relief" is unreachable |
| e | A relief man is eligible to be sent out as a courier on Mar 3 and 5 and lives, while `docs/ALAMO_FATES.md` says "Killed, as all thirty-two were" | `courierEligible` L127–134 | code and doc disagree; the code has a real precedent (John W. Smith guided the relief in and rode out on Mar 3) |
| f | Unplayed families' fighters are never asked to ride (`!household.played` skipped) | `askCouriers` L142 | they always die; fine, but undocumented |
| g | Everybody inside stands on the main plaza at a hashed spot; no one is on a wall | `postOf`, `sim/alamo-runner.mjs` L55 | nothing to stage from |
| h | A man arriving at Béxar after Feb 23 by any other road is neither shut in nor touched | `beginSiege` one-shot; `joinService` shut-out (`sim/winter.mjs` L114–116) | correct (the lines were closed), and said |

**What should change:**

1. **Posts on the walls at the siege.** Replace `postOf`'s plaza spread with a post list by the layout: the north battery and
   north wall, the west wall, the south-west battery and low barrack, the palisade, the church platform, the long barrack; a
   fighter's post by a seeded share weighted to the garrison (north and west heavier); a woman or child to the church and, from
   `alarm`, the sacristy. His post is where the runner walks to him on courier nights, and where he stands when the walls are
   stormed.
2. **The relief rides and arrives on its own legs.** At `relief-leaves` the relief is a **formation** (about 25 at Gonzales, 32 by
   the time they reach the lines) that rides at `HORSE_SPEED` along the Béxar road (69.2 miles; about two days at 35 miles a day)
   and **waits in the dark short of the lines** until 03:00 on Mar 1, then goes in at the east side with John W. Smith guiding
   (one man wounded by the defenders' own fire — told). A relief man not at Gonzales at 14:00 is told the relief rode without
   him (b).
3. **Honest relief offers:** the `join-relief` card computes the arrival at Gonzales from where the family is and says it; if he
   cannot be there by 14:00 on Feb 27 the card says so before he goes (c).
4. **Couriers ride.** `sendCouriers` passes the family's horse (`modeWith`) if he has one there, or the rider's pace; a courier who
   reaches Gonzales before 14:00 Feb 27 may join the relief (only courier-1 and courier-2 can), as `docs/ALAMO_FATES.md` says.
   Settle (e) in the doc: a relief man may be chosen as a courier on Mar 3 or 5 (Smith's precedent) — **amend
   `docs/ALAMO_FATES.md`'s relief row**.
5. **Stage the fate** at the phase of his post (§5.5) instead of setting `fate` in one update. The fate itself does not change.

### 5.7 Alert

- **None before contact.** The garrison did not know the hour; the guns' stopping at 10 p.m. was not a warning anyone read as one.
  `docs/MILITARY_EXPERIENCE.md`: "Scene markers must... not disclose an exact future attack time". The card comes **at `alarm`**,
  at the person's side, by the man beside him on the wall (reconstructed): *"They're coming — they're at the walls!"* — **Watch**
  frames his post.
- **A family whose person is a courier already out, or in the relief still riding**, gets nothing on March 6. Word comes by the
  existing `fall-rumour` (Gonzales, Mar 11) and `fall-confirmed`/`fall-colonies` (Mar 13).
- **A family with a woman or child inside:** the same card at `alarm`: *"Shouting and firing at the walls. {Name} is with the women
  and children in the church."* — **Watch**.

### 5.8 Aftermath

**Historically** (`HIST-TEX-430` to `-439`): every fighting man killed, five to seven after surrendering; the bodies burned; the
noncombatants questioned at Músquiz's house, each woman given a blanket and two silver dollars; Susanna Dickinson sent east with
Joe and Ben and brought to Houston at Gonzales; the word disbelieved on the 11th and confirmed on the 13th; Gonzales burned that
night. **Modelled:** `stormAlamo`, `survivorsLeave` (Mar 8), `tellFall` at the word. **Choices:** none for the person; the family's
next choices are the flight (`sim/scrape.mjs`). **A fighter does not come home.** A spared woman or child walks home east from
March 8 and is the word, arriving in person.

**Plain-words account** (at the word; a different last sentence for each role):

> Before dawn on March 6 about fifteen hundred Mexican soldiers in four columns, carrying ladders, came at the Alamo from every
> side. The defenders' cannon drove them back at first, but they came on again and crowded against the north wall and climbed
> over it. The defenders fell back into the long barrack and the church and fought room by room, and those who ran out over the
> walls were caught by cavalry waiting outside. In about an hour it was over. Every man who fought was killed — the few taken
> alive were shot on Santa Anna's orders — and several hundred Mexican soldiers were killed or wounded. The women and children,
> and Travis's slave Joe, were spared. {Name} {was on the {north | west | south} wall with the garrison, and was killed there when
> the Alamo was stormed | was with the Gonzales men who had gone in on March 1, and was killed with them | was with the women
> and children in the church, and was spared, and is walking home east as Mrs. Dickinson did | had ridden out as a courier and
> was not inside when it fell}.

### 5.9 Art

**In the library:** the complete Alamo assembly (`ALAMO_LAYOUT.md`): twelve destructible north-wall sections with
`alamo-wall-intact/cracked/breach/rubble` and `alamo-wall-collapse`, doorways, cutaway, `alamo-palisade`, `alamo-earth-ramp`,
`alamo-cot-blanket`, interiors; Joe's sixteen-frame sheet (`joe-walk`, `joe-hide`, `joe-emerge`, `joe-speak`, `joe-idle`,
`joe-rest`); `volunteer-gun-fire`/`-ram`/`-shot-carry`, `regular-*`, `cannon-*-recoil`.

**Missing — for `docs/ART_REQUESTS.md`:**

| Need | Why | Stand-in |
| --- | --- | --- |
| **Scaling ladders**, carried by four men and set against a wall; a man climbing | the columns' ladders (orders of March 5) | none today: a ladder drawn as two strokes in canvas, marked `stand-in:` |
| **Climbing a wall face** | the north wall | `regular-march-n` translated up the wall sprite |
| **Crowbar and axe at a door or wall** | Cos's column | as Béxar (§3.9) |
| **A gun turned on a doorway** | the long barrack | `cannon-bronze-*` inside the plaza |
| **The red flag on San Fernando's tower** | `HIST-TEX-054` | none: told |
| **Night, then dawn light** | 5:00 to 6:20 | a darkening layer lifting |
| **Lancers riding down a running man at distance** | `HIST-TEX-436` | `dragoon-march-*` toward a `volunteer-march` figure; the moment of striking is not drawn |
| **Pyres' smoke at a distance** (no bodies) | the burning | `smoke-rise` scaled large, seen from the compound's edge the next day |

### 5.10 Proposed `HISTORY.md` rows

```
| **HIST-TEX-500** | STRONGLY SUPPORTED | **The assault orders of March 5, 1836.** Cos's column of about 350 with ten ladders, two crowbars and two axes against the north-west; Duque's of about 400 with ten ladders against the north (Castrillón commanding after Duque was hit); Romero's of about 400 with six ladders against the east; Morales's of about 125 with two ladders against the south; a reserve of about 400 with Santa Anna; about 500 cavalry under Ramírez y Sesma posted around the fort; soldiers not to wear overcoats (Wikipedia *Battle of the Alamo*, tabulating Hardin and Todish; read 2026-09-25). TSHA gives "about 1,800 assault troops" from four directions. | The columns of `sim/battles/alamo-assault.mjs`: ladders, crowbars and axes; the cavalry outside. |
| **HIST-TEX-501** | STRONGLY SUPPORTED | **How the assault began and went.** The columns moved about 5–5:30 a.m.; the silence was broken by shouts of "¡Viva Santa Anna!" and bugle music (Wikipedia, citing Hardin and Todish); canister "ripped through their ranks... the Mexican soldiers halted, reformed, and drove forward"; Travis "among the first to die, fell on the north bastion"; the defenders withdrew to "the dim rooms of the Long Barracks" where "some of the bloodiest hand-to-hand fighting occurred"; Bowie was killed in his bed; the assault "lasted no more than ninety minutes" (TSHA *Alamo, Battle of the*, read 2026-09-25). Most of the noncombatants had gathered in the church sacristy; the Texian dead were stacked and burned (Wikipedia, citing Edmondson). Sunrise about 6:20 local time is COMPUTED. | The phases (§5.2) and where a family's fighter falls (at his post's phase). |
| **HIST-TEX-502** | DOCUMENTED (testimony) | **Travis's words at the alarm, as Joe told them.** "Come on boys, the Mexicans are upon us, and we'll give them Hell." Travis fired, was shot down, and fell within the wall on the sloping ground; Joe sheltered in a house and fired from it; after the fight officers called out to know if there were any Black men present; two soldiers attacked Joe (buckshot in the side, a bayonet) and "Captain Baragan" saved him. Recorded by William F. Gray in his diary on March 20, 1836, from Joe's testimony to the cabinet (the Alamo, *Joe's Account*, read 2026-09-25). | The one documented Texian line of the assault, spoken by Travis at the north battery; Joe's own sequence is his and not a mechanic (`HIST-TEX-434`). |
| **HIST-TEX-503** | DISPUTED / TRADITION | **The *degüello*.** TSHA's entry *Degüello* says the call was played by the Mexican bands as the signal for the attack on March 6; the earliest account is Reuben M. Potter's (1860), not an eyewitness's; modern accounts such as Hardin's omit it; no eyewitness account read records the tune (TSHA *Degüello*; Wikipedia *El Degüello*; read 2026-09-25). | The attack's bugles are captioned only as "the attack"; the *degüello* is named in the account as a story told later (owner question A1). |
| **FIC-GONZ-430** | **FICTIONAL FOR GAMEPLAY** | **The Alamo assault as staged** (`docs/battle-research/staging.md` §5). Invented here: each fighter's post on a wall or battery by a seeded share weighted to the north and west, and a woman's or child's place in the church and the sacristy; the phase shape inside the ninety minutes (advance 5:00–5:30, alarm, fifteen minutes of repulse, ten at the north wall, fifteen of fallback, fifteen in the rooms, the end about 6:30); that a fighter falls at his post's phase; the relief riding as a formation and waiting short of the lines until 3 a.m. on March 1; couriers riding the family's horse; the relief card's arrival estimate; the drawn counts (the garrison one to one, the columns one to five, the cavalry one to ten); the alert at the alarm and none before; the camera held on the wall, not the man, when he falls; and every reconstructed line in §5.4. | |
```

### 5.11 Questions for the owner

**A1. The *degüello*.**
- (a) **The bugles are captioned "the attack"; the *degüello* is named in the account as a story told later.** *(Recommended.)*
- (b) Play a *degüello* call, captioned as tradition.
- (c) Leave it out entirely.

**A2. The line in the sand.**
- (a) **Not shown as an event; the account says a story told many years later has Travis draw a line, and historians doubt
  it.** *(Recommended.)*
- (b) Leave it out entirely.
- (c) Show it on the night of March 3–5, drawn as tradition.

**A3. Watching a family's man die before the word.** `docs/BATTLES.md` §2.1 lets a student watch a battle live when one of their
family is in it; `docs/ALAMO_FATES.md` says no family knows a fate before the word (March 11–13).
- (a) **The student may watch; the family's record, the other family members and the journal learn only with the word; when the
  wall is carried the camera holds on the wall and the man is not followed or shown lying.** *(Recommended: it keeps both rules;
  the student sees what the man's own viewpoint saw, the household learns by the word.)*
- (b) No Watch for the Alamo: the family learns everything with the word.
- (c) The watch ends quietly just before the wall is carried.

---

## 6. Coleto, 19–20 March 1836

Research: [goliad-scrape-san-jacinto.md](goliad-scrape-san-jacinto.md); new on 2026-09-25: TSHA *Goliad Campaign of 1836*,
Wikipedia *Battle of Coleto*, Wikipedia *Fannin Battleground State Historic Site* (§12). Registered: `HIST-TEX-062`, `-063`,
`FIC-GONZ-046`.

### 6.1 Ground and positions

| Place | Where | Status |
| --- | --- | --- |
| Presidio La Bahía, Goliad | map site `goliad` `(-97.3830, 28.6476)` (`scripts/build-colonies-map.mjs` L65); the town layout in `sim/town-layouts.mjs` L519–547 | DOCUMENTED |
| The Coleto ground | the Fannin Battleground marker, **28.6864 N, 97.2339 W** (Wikipedia), about **9.4 miles east-north-east of the presidio** (COMPUTED); **no `coleto` site exists in the code** (it uses `goliad`) | DOCUMENTED marker |
| The road | Goliad to Victoria, across Manahuilla Creek; the square formed about a mile past it, on open prairie in a slight depression, **400–500 yards short of the Coleto Creek timber** | DOCUMENTED (Wikipedia; TSHA) |
| Horton's mounted men | ahead, scouting; cut off in the timber | DOCUMENTED |

**Camera.** A frame about 0.5 × 0.4 mile: the square in the middle of the frame, the Coleto timber at the east edge, the Mexican
positions on three sides and the cavalry to the rear (west). At night, tighter on the square.

### 6.2 Phases

Sunset on 19 March is about **6:10 local time** (COMPUTED). The code fires `coleto` at noon (`sim/directors.mjs` L962) and
`goliad-surrender` at noon on the 20th (L963).

| Phase | Starts | Game min | What happens | Status | Held |
| --- | --- | --- | --- | --- | --- |
| `march-out` | Mar 19, 09:00 | 150 | Out of Goliad "at midmorning during a heavy fog" with nine brass guns and 500 spare muskets; a cart breaks down; the largest gun falls into the San Antonio River; hungry, overloaded oxen. | DOCUMENTED (TSHA; Wikipedia: 09:00) | 60 s at the start, then the march at 120 min/tick |
| `halt` | ~11:30 | 60 | About a mile past the Manahuilla, Fannin halts "to rest the men and graze the hungry oxen", losing "another precious hour". | DOCUMENTED | not held |
| `caught` | ~13:00 | 20 | Mexican cavalry come up from the rear (Urrea left at 11:00 with about 180 infantry, 100 cavalry and a gun); the column tries for the timber 400–500 yards on and is cut off; **the square forms**: three ranks deep, guns at the corners, the carts inside. | DOCUMENTED; the hour RECONSTRUCTED (between 11:00 and the first assault) | 60 s |
| `assault-1..3` | ~13:30 → 18:10 | 280 | **Three assaults**: rifle companies (cazadores) under Morales on the left, grenadiers and part of the San Luis battalion on the right, the Jiménez battalion on the front, **cavalry against the rear**; the Texian guns fire canister; men fall inside the square. At sunset Urrea stops the major attacks "due to a lack of Mexican ammunition". | DOCUMENTED (Wikipedia) | about 90 s per assault, 50 s between: ~6 min |
| `night` | 18:10 → Mar 20, 06:00 | 710 | Mexican sharpshooters in the tall grass around the square fire through the night. Little water; no fires; the wounded untreated. The Texians dig trenches and pile carts and dead animals into a barricade. Mexican reinforcements arrive in the night (Morales's battalions; more than 1,400 by morning, TSHA). | DOCUMENTED | background (120 min/tick), with a 30-s scene at dusk and one at 03:00 |
| `guns` | Mar 20, 06:15 | 30 | Mexican artillery opens on the square. Fannin's officers decide they "could not take another day's fighting". | DOCUMENTED (Wikipedia: 06:15) | 60 s |
| `surrender` | ~07:00 | 120 | A white flag; talks; the terms: Fannin's officers wrote terms asking that the wounded be treated and the men held as prisoners of war; **Urrea could not guarantee Santa Anna would honour them**; TSHA calls it "unconditional surrender" — DISPUTED as to what the men believed. Arms stacked. | DOCUMENTED; the terms DISPUTED | 60 s |
| `march-back` | Mar 20, ~10:00 | — | The unwounded marched back to Goliad and held in the presidio; the wounded brought in over the next days. | DOCUMENTED | not held |

**Held ≈ 10 real minutes** (the longest open fight after Béxar), because the square held all afternoon. If the owner wants it
under six, hold only the first assault and the dawn guns (owner question K3).

### 6.3 Formation style and counts

| Phase | Texian | Mexican |
| --- | --- | --- |
| `march-out` | A **`column`** on the road with carts and oxen; Horton's riders ahead. | — |
| `caught` → `assault` | **`square`** (proposed style, §9): **three ranks deep**, the San Antonio Greys and Red Rovers in the front line, Duval's Mustangs and Frazer's Refugio militia in the rear line (Wikipedia); guns at the corners; the carts inside; men firing by rank and at will. **This is the organised side.** | **`column`**s of attack from three sides and **`mounted`** charges on the rear; the Jiménez battalion in **`ranks`** on the front. |
| `night` | **`square`** dug in: trenches, carts, dead oxen and horses as a breastwork. | **`loose`**: sharpshooters lying in the tall grass, firing at flashes and movement. **Here the Mexicans are the loose ones.** |
| `guns`, `surrender` | the square, a white flag at one corner. | a battery; infantry formed around. |

**Counts.** Texian **about 300–330** in the square (`HIST-TEX-063`), plus **about 30** with Horton who got away; draw 1:1.
Mexican **about 280 with one gun at first**, **over 1,400** by the morning (TSHA); draw 1:4 (about 70 rising to 350).

### 6.4 Talk

| When | Speaker | Line | Kind |
| --- | --- | --- | --- |
| `caught` | Texian officer | "Form square! Guns to the corners!" | reconstructed |
| `caught` | Texian, worried | "The timber — we'll never make the timber." | reconstructed |
| `assault` | Mexican officer | "¡Preparen las armas! ¡Apunten! ¡Fuego!" — *Make ready! Aim! Fire!* | reconstructed |
| `assault` | Mexican cavalry officer | "¡A la carga!" — *Charge!* | reconstructed |
| `assault` | Texian officer | "Front rank — fire! Rear rank, make ready!" | reconstructed |
| `night` | Mexican sentries, all round | "¡Centinela, alerta!" — *Sentry, look sharp!* | reconstructed (period-standard sentry call) |
| `night` | Texian, worried | "Water. Is there any water?" | reconstructed (the thirst is DOCUMENTED) |
| `surrender` | Texian | "They'll send us to New Orleans — that's what the terms say." | reconstructed (the belief is attested by the story the prisoners were told; `HIST-TEX-514` proposed) |

Fannin and Urrea speak nothing: no source read gives words.

### 6.5 Casualty moments

- **Rates in code:** `COLETO = { death: 0.03, wound: 0.2 }` (`sim/houston.mjs` L134), `fightColeto` (L181–187) rolls every
  serving `'fannin'` man with `rollFates`; the wounded get `WOUND_GRADES.severe` (21 days, `wounded`); everyone becomes
  `status: 'prisoner'`; nobody dies until the word.
- **When:** the killed and most of the wounded at the three assaults (weighted to the first, when the square was forming); a few
  wounded at `night` from the sharpshooters (reconstructed share, say one in five of the wounded). Gunners at the corners were
  most exposed (RECONSTRUCTED from the corner guns); a family's man at a corner is more likely to be the one hit, by where he is
  drawn, not by new odds.
- **Showing it:** inside the square a hit man sits or lies in the middle among the carts; nobody can carry him anywhere; at night
  the wounded are drawn lying in the centre and men crouching over them. Dead oxen and horses are drawn **only as dark shapes in
  the barricade line** (no carcass detail). The Mexican dead lie outside the square at distance after each assault.

### 6.6 A family's person: arrival and participation

**Today:** the only way to be with Fannin is to escape San Patricio or Agua Dulce (`fightSouth`, §4); `SERVICE.fannin` exists
(`sim/winter.mjs` L40) but **no chore joins it**, and `sim/houston.mjs` L11 says "Nobody new joins Fannin". The man stands at the
Goliad site point. `fightColeto` rolls him **there**, at noon on the 19th. Recall is refused from `FANNIN_MARCHES` (`sim/winter.mjs`
L148–151).

| # | Case | Where |
| --- | --- | --- |
| a | **Nobody marches out of Goliad**; there is no Coleto place; the fight is a roll at the presidio. | `fightColeto` L181–187; spotlight `siteId 'goliad'` |
| b | **`FANNIN_MARCHES` is compared to the raw `world.minute`** without the 1080-minute arrival offset, so in a class that arrived on Sept 28 recall closes at noon on Mar 18 instead of 06:00 on Mar 19 | `sim/winter.mjs` L148 |
| c | A man escaped from Agua Dulce on Mar 2 walks 26.9 miles to Goliad: in time. A man still `wounded` cannot travel (`beginTravel` throws, `sim/world.mjs` L357) and nothing carries him. | — |
| d | Horton's thirty got away; nothing lets a mounted man be with Horton. | — |

**What should change:**

1. **A `coleto` place** at the marker (28.6864 N, 97.2339 W) and **a march out**: a new key `fannin-marches` at **Mar 19 09:00**;
   every serving Fannin man leaves Goliad **with the column** (a formation moving at ox pace: about 9.4 map miles by about
   13:00 with an hour's halt, so about 2½–3 miles an hour while moving, COMPUTED); a man `wounded` from earlier **rides in a cart** (a column-carried exception to `beginTravel`'s
   refusal, since the column took its carts); the fight starts when the column reaches the Coleto ground, not at a clock noon
   (the clock is held so the column arrives about 13:00).
2. **Fix (b)**: compare `FANNIN_MARCHES` through `momentOf(world, 'fannin-marches')` (or add `campClock`, as `sim/houston.mjs` L32
   does).
3. **Horton**: a Fannin man **with a horse at Goliad** (`modeWith`) is placed with Horton's scouts by a seeded share of
   **30 in about 360** (COMPUTED from the record's 30 of about 360 in the column); he is ahead of the column when it is caught and
   **escapes to Victoria**, released. (The code has no escape at Coleto today.) This is new and the owner's (K2).
4. **Resolve at the staged moments** (§6.5); the fate is the existing roll.

### 6.7 Alert

- **Mar 19, 09:00, at the person's side, by a sergeant of his company**: *"We're marching out for Victoria this morning, with the
  guns and the carts. Fog on the river."* (no Watch; a departure).
- **At `caught` (~13:00), at the person's side, by a man on the column's flank**: *"Mexican horsemen behind us! They're forming
  square!"* — **Watch** frames the square.
- **At `guns` (06:15, Mar 20)**: *"Their cannon have come up in the night and are firing on the square."* — **Watch**.
- **At home:** nothing until `goliad-word` (Mar 25), which today reports Fannin's defeat but **not the family's own man**; the
  account below should come with the massacre word (Apr 1) or the man himself (§7.8).

### 6.8 Aftermath

**Historically:** the prisoners marched back to Goliad and held in the presidio chapel; the wounded brought in; Ward's men
(captured near Dimitt's Landing Mar 22) and Miller's (taken at Copano) held with them; a week of waiting; Mar 27, the massacre
(§7). **Modelled:** `status: 'prisoner'` and `goliadMassacre` (§7). **Choices:** none (a prisoner has none). **He does not come
home** unless he escapes on the 27th, is spared, or was with Horton.

**Plain-words account** (given with the massacre's word, since the family hears of both together):

> On March 19 Colonel Fannin at last marched his men out of Goliad toward Victoria, with heavy cannon, carts and slow, hungry
> oxen. Mexican cavalry caught up with them on the open prairie near Coleto Creek, a few hundred yards short of the trees. The
> Texians formed a square three ranks deep with cannon at the corners and beat back three attacks until dark. That night they
> had little water and no fires, and Mexican marksmen fired on them from the tall grass. In the morning more Mexican soldiers and
> cannon had come up, and Fannin surrendered, believing his men would be treated as prisoners of war. They were marched back to
> Goliad. {Name} {fought in the square and came through unhurt | was wounded in the square and carried back to Goliad | was
> killed in the fight on the prairie | rode ahead with Horton's horsemen and got away to Victoria}.

### 6.9 Art

| Need | Why | Stand-in |
| --- | --- | --- |
| **A hollow square, three ranks, facing out**, with a gun at each corner | the Texian formation | `volunteer-fire-reload` placed by the renderer on four faces; `cannon-bronze-*` at corners |
| **Ox carts and a broken cart** | the column | `ox-cart`, `ox-walk` |
| **Men lying in tall grass firing** (sharpshooters) | the night | `regular-injured-rest` pose with `muzzle-flash-*` (no prone-firing pose exists; requested) |
| **A barricade of carts and dark shapes** | the night's work | `ox-cart` tipped; darkened shapes; no carcass detail |
| **Night layer, then fog at dawn** | Mar 19–20 | darkening layer; `smoke-dense` at low opacity |
| **A white flag at a square's corner** | the surrender | a white rectangle on a pole (canvas stand-in) |

### 6.10 Proposed `HISTORY.md` rows

```
| **HIST-TEX-512** | DOCUMENTED | **How Coleto was fought, March 19–20, 1836.** Fannin left Goliad about 9 a.m. in heavy fog with nine brass cannon and 500 spare muskets; a cart broke down, the largest gun fell into the San Antonio River, and the overloaded, hungry oxen slowed the column; he halted about a mile past Manahuilla Creek to graze them. Urrea set out at 11 a.m. with about 180 infantry, 100 cavalry and a gun; his cavalry caught the column on open prairie 400–500 yards short of the Coleto timber. The Texians formed a square three ranks deep with artillery at the corners, the San Antonio Greys and Red Rovers in front, Duval's Mustangs and Frazer's Refugio militia in the rear line. Three Mexican assaults — riflemen under Morales on the left, grenadiers and part of the San Luis battalion on the right, the Jiménez battalion in front, cavalry at the rear — were beaten off; at sunset Urrea stopped for want of ammunition. Through the night Mexican sharpshooters fired from the tall grass; the Texians, with little water and no fires, could not treat the wounded, and dug trenches and barricaded with carts and dead animals. At 6:15 a.m. on the 20th Mexican artillery opened, and Fannin surrendered. Mexican loss "perhaps some fifty killed and 140 wounded" (TSHA). Sources: TSHA *Goliad Campaign of 1836*; Wikipedia *Battle of Coleto* (read 2026-09-25). **DISPUTED:** the terms — the Texian officers' written terms asked that the wounded be treated and the men held as prisoners of war, Urrea could not guarantee Santa Anna would honour them, and TSHA calls it "unconditional surrender". Sunset about 6:10 p.m. is COMPUTED. | `sim/battles/coleto.mjs`: here the Texians are in a formed square and the Mexicans end in loose order in the grass. |
| **HIST-TEX-513** | DOCUMENTED | **Where Coleto was.** The Fannin Battleground State Historic Site stands at 28°41′11″N 97°14′02″W (28.6864 N, 97.2339 W), east of Goliad in Goliad County (Wikipedia *Fannin Battleground State Historic Site*, read 2026-09-25); about 9.4 miles east-north-east of the presidio (COMPUTED). | A `coleto` place on the map for the column to reach. |
| **FIC-GONZ-436** | **FICTIONAL FOR GAMEPLAY** | **Coleto as staged** (`docs/battle-research/staging.md` §6). Invented here: the column as a formation leaving Goliad at 9 a.m. and reaching the Coleto ground about 1 p.m.; a wounded man riding in a cart; a Fannin man with a horse placed with Horton's scouts by a share of 30 in 360 and escaping to Victoria (if the owner chooses it); the hours of the assaults between 1:30 and sunset; the share of wounds at night; the drawn counts; and every reconstructed line in §6.4. | |
```

### 6.11 Questions for the owner

**K1. Joining Fannin.** Today nobody new joins Fannin; only men escaped from the south are there (`FIC-GONZ-046`, the owner's
§7g answer).
- (a) **Keep it: only the escaped are with Fannin.** *(Recommended: it was the owner's decision and Fannin's command was mostly
  United States volunteers.)*
- (b) Add a winter choice to join Fannin at Goliad, open until about March 12.

**K2. Horton's riders.**
- (a) **A Fannin man with his horse at Goliad can be among Horton's scouts (about 30 in 360) and escapes to Victoria.**
  *(Recommended: it is the documented way some men of the column lived.)*
- (b) No escape at Coleto.

**K3. How long Coleto plays.**
- (a) **All three assaults and the dawn guns, about 10 real minutes.** *(Recommended: the afternoon was the fight.)*
- (b) The first assault and the dawn guns only, about 5 minutes; the others background.

---

## 7. The Goliad massacre, 27 March 1836

Research: [goliad-scrape-san-jacinto.md](goliad-scrape-san-jacinto.md); new on 2026-09-25: TSHA *Goliad Massacre*, Wikipedia
*Goliad massacre*, TSHA *Alavez, Francita* (§12). Registered: `HIST-TEX-064`, `FIC-GONZ-046`.

**This is not a battle.** It is the killing of about 342 prisoners who had surrendered, and of Fannin and about forty wounded in
the presidio. It is staged here because a family's person may be among them and the owner asked that players "walk away
understanding what happened". The depiction below is recommended for a middle-school class and is the owner's to confirm (G1).

### 7.1 Ground and positions

| Place | Where | Status |
| --- | --- | --- |
| Presidio La Bahía | `goliad` site; `sim/town-layouts.mjs` L519–547: walls, parade ground, bastions, the chapel `gol-chapel` "Our Lady of Loreto" (135, 32), barracks | DOCUMENTED |
| The three roads | the **Béxar road** by the upper ford; the **Victoria road** by the lower ford; the **San Patricio road** | DOCUMENTED (TSHA; Wikipedia) |
| Where the columns halted | "at selected spots on each of the three roads, from half to three-fourths of a mile from the presidio" | DOCUMENTED |
| The river timber | the San Antonio River below the presidio: where escapees ran | DOCUMENTED in the escape accounts (Wikipedia names Ehrenberg, Hunter) |

**Camera (recommended).** The presidio from outside, at a distance — the gate, the walls, the roads leaving it — at sunrise. The
columns are seen marching out and **passing out of the frame** before they halt. The camera does not follow a column to its
halting place.

### 7.2 Phases

Sunrise on 27 March is about **6:10 local time** (COMPUTED). The code fires `goliad-massacre` at 07:00 (`sim/directors.mjs` L967).

| Phase | Starts | What happens | Status | Shown? |
| --- | --- | --- | --- | --- |
| `eve` | Mar 26, evening | Portilla receives Santa Anna's order. The prisoners, told they will be sent to New Orleans, sing "Home Sweet Home". Francita Alavez goes into the fort and brings some men out and hides them. | DOCUMENTED (TSHA) | **heard**: the song, faint, over the walls at dusk; Alavez **seen** leading two or three men out of a side door into a house |
| `formed` | Mar 27, ~06:10 | At sunrise, Palm Sunday, the unwounded are formed into three groups. They are told different things: to gather wood, drive cattle, be marched to Matamoros, or go to Copano for ships. The doctors and the men chosen to be spared are kept back. | DOCUMENTED | **seen**: men forming in the parade ground, a few kept aside with the surgeons |
| `marched` | ~06:30 | The three groups march out on the three roads under guard. | DOCUMENTED | **seen** leaving the gate and passing out of frame |
| `volleys` | ~07:00 | At the halting places the guards fire at close range. Survivors of the first fire are killed. Some break for the river timber. | DOCUMENTED (TSHA; Wikipedia) | **heard only**: three volleys, far off, a thin smoke over the trees at the frame's edge. **No figure is seen falling.** |
| `escapes` | ~07:00–07:30 | Twenty-eight get away, running for the river, some feigning death. | DOCUMENTED | **seen at distance**: a few small figures running into the river timber, pursued a little way by riders who turn back |
| `inside` | ~07:30 | Fannin and about forty wounded who could not march are killed inside the presidio under Capt. Carolino Huerta. | DOCUMENTED | **not shown; told** |
| `after` | the day, and to June 3 | The bodies are burned and left in the open; on June 3 Rusk's men gather the remains and bury them with military honours. | DOCUMENTED | **told only** |

**Real time:** about 3 minutes from `formed` to `escapes`, at a quiet held pace; no battle smoke builds up; the scene ends on the
empty road and the presidio.

### 7.3 Formation style and counts

Prisoners in three **columns** under guard (`column`), the guards in files on either side; no weapons among the prisoners.
**About 342** executed, **28** escaped, **about 20** spared (TSHA; `HIST-TEX-064`); Wikipedia adds that "the 75 soldiers of Miller
and the Nashville Battalion" were given white armbands and spared — **how that relates to TSHA's twenty is not resolved**
(DISPUTED). Draw the prisoners 1:3 (about 115 figures), the guards 1:3.

### 7.4 Talk

**Almost none, by design.** No orders are spoken in Spanish or English at the halting places; nothing is said that a middle-school
class would hear as the moment of killing.

| When | Speaker | Line | Kind |
| --- | --- | --- | --- |
| `eve` | prisoners, many (heard over the wall) | *(the tune of "Home Sweet Home")* — caption: *The prisoners are singing "Home Sweet Home."* | **documented** (TSHA) |
| `formed` | a prisoner, to another | "They say we're going to Copano for the ships." / "Wood-cutting, they told us." | reconstructed from the documented stories told to the prisoners |
| `eve` | Francita Alavez | *(no words; she is seen)* | — (her actions are testified by Barnard and Shackelford; no words of hers are given) |

**Fannin's last requests** (to be shot in the heart, not the face; a Christian burial; his watch to his family; and that he was
shot in the face and burned) come from later accounts reported secondhand (Wikipedia; not in TSHA's entry as read): **TRADITION**.
Not shown; if told at all, told as "it was said afterward that…".

### 7.5 The depiction, and what a family whose person was there experiences

**Recommended (G1 a):**

1. **What is shown:** the evening before and the song; Alavez bringing men out; the morning muster; the men kept back with the
   surgeons; three columns leaving by three roads; a few men running into the river timber at a distance. **What is heard:** the
   song, and three distant volleys. **What is never shown:** anyone being shot, falling, lying dead, or the burning.
2. **What is told afterwards**, in the account and the learning panel: the numbers; that the prisoners had surrendered; that the
   order came from Santa Anna and was carried out by Portilla against Urrea's recommendation of clemency (Urrea's position as
   TSHA and the research have it; check wording before quoting); the wounded and Fannin killed inside; the escapes; those spared
   and the woman who saved several; the bodies burned and buried by Rusk on June 3; and that "Remember Goliad!" was shouted at San
   Jacinto three weeks later.
3. **A family whose person was there** is not shown his death. Their person is seen at the muster (Watch is offered, §7.7);
   then:
   - **executed**: he is seen marching out in his column and passing out of the frame; the camera stays on the gate; the volleys
     are heard; **the watch ends there**, and the family learns what happened with the word (April 1) in the account (§7.8);
   - **escaped**: he is seen in his column, then **seen running into the river timber** after the volleys; he is then a traveller
     making his way home, visible to his family as the existing `tellGoliad` "…got to the river, and is making their way home"
     (`sim/houston.mjs` L202–218);
   - **spared**: he is seen kept back with the surgeons at the muster, and stays at the presidio; then marched south a prisoner
     (`tellGoliad` "spared… one of the workmen… marched to Matamoros");
   - **killed at Coleto earlier**: nothing on this day; the account gives both.
4. **The Host's screen** shows the same distant view (the spotlight's existing words, `sim/directors.mjs` L967, stay: "…are marched
   out and shot. A few escape. No family knows yet.").

### 7.6 A family's person: arrival and participation

**Today** (`goliadMassacre`, `sim/houston.mjs` L190–199): every `'prisoner'` not dead or captured: killed at Coleto stays killed;
otherwise `share(world, id, 'goliad')` below `0.89` executed, below `0.96` escaped, else spared (`MASSACRE = { executed: 0.89,
escaped: 0.07 }`, L135). **The effective spared share is 4 in 100**, not the "5 in 100" in the file's header (L10); L133's
comment "342 shot of about 430" (about 80 in 100) does not match `0.89`. The roll is not weighted by frailty, and **does not
distinguish the wounded**: a man wounded at Coleto (21-day `wounded`) can "escape" by the share, though the record has the wounded
killed inside the presidio.

**What should change:**

1. **Settle the numbers** in one place and say which record they follow: executed about 342 + 40 of about 430 (**89 in 100**,
   which is what the constant already is); escaped 28 of about 430 (**6.5 in 100**); spared about 20 of about 430 (**4.7 in
   100**, round to 5). Fix the two comments.
2. **A wounded prisoner** (still `wounded` on Mar 27) **cannot run**: his outcomes are killed inside the presidio, or spared (the
   doctors' ward) at the spared share (owner question G2).
3. **Stage the three outcomes** as §7.5 says; the executed and inside-killed fates resolve at `volleys` / `inside`, invisibly;
   the escaped at `escapes`, visibly; the spared at `formed`.
4. **Keep `massacre-word`** (Apr 1) as when the family's household learns; the man's own escape is his own news and reaches them
   when he does.

### 7.7 Alert

- **No Watch for the volleys.** `docs/BATTLES.md` §2.7's "Watch" is for fights; offering one for an execution is wrong for a
  class. Recommended: at `formed`, a quiet card at the person's side, carried by the man next to him in the line: *"They have
  formed the prisoners in three companies. They say we are going out for wood, or to the ships at Copano."* — with **Follow**
  (not Watch), which frames the presidio's gate from outside as §7.1 says, and ends as §7.5 says.
- **Nobody else** is alerted; word at `massacre-word`.

### 7.8 Aftermath

**Historically:** the escaped reached the settlements or Houston's army over the following weeks; the spared were taken to
Matamoros and some later got away; the families of the killed heard in April; "Remember Goliad!" at San Jacinto. **Modelled:**
`tellGoliad` at `massacre-word` (Apr 1): executed → dead; spared → captured; escaped → released, a wound reset to well, walking
home. **Choices:** none. **The escaped man comes home on his own legs; the spared does not come home in the game; the executed
does not.**

**Plain-words account** (at the word; also carries Coleto, §6.8):

> After Fannin's men surrendered at Coleto, they were marched back to Goliad and held there as prisoners for a week, many of
> them believing they would be sent home to the United States. On the morning of March 27, Palm Sunday, the Mexican commander at
> Goliad carried out Santa Anna's order that they be killed. The men who could walk were marched out in three groups on three
> roads, told they were going to gather wood or to the ships, and were shot a short way from the fort. Colonel Fannin and the
> wounded were killed inside. About 340 men died. Twenty-eight escaped by running for the river, and about twenty — doctors,
> orderlies and men with useful trades — were spared, several of them saved by a Mexican woman, Francita Alavez, who became
> known as "the Angel of Goliad". The killing turned Texians' grief into anger, and three weeks later at San Jacinto they
> shouted "Remember Goliad!" {Name} {was among the prisoners who were killed | was among the wounded killed at the fort | was
> kept back with the doctors and spared, and has been taken south a prisoner | ran for the river when the firing began, got away,
> and is making his way home}.

### 7.9 Art

| Need | Why | Stand-in |
| --- | --- | --- |
| **Prisoners marching unarmed in a column between guards** | the morning | `volunteer-march-*` without the musket (a request: an unarmed volunteer walk), `regular-march-*` guards |
| **Men running into timber at distance** | the escapes | `volunteer-march` at run pace, small |
| **A woman leading men out of a side door at dusk** | Alavez | `rust-woman-walk-*` + two `volunteer-idle` figures |
| **The presidio chapel from outside at sunrise** | the frame | the Goliad town layout (`sim/town-layouts.mjs`) |

### 7.10 Proposed `HISTORY.md` rows

```
| **HIST-TEX-514** | DOCUMENTED | **How the Goliad prisoners were killed, March 27, 1836.** Colonel José Nicolás de la Portilla received Santa Anna's order on March 26. That evening the prisoners, expecting to be sent to New Orleans, sang "Home Sweet Home". At sunrise on Palm Sunday the unwounded were formed into three groups, told they were to gather wood, drive cattle, be marched to Matamoros or go to Copano for passage to New Orleans, and marched out on the Béxar road by the upper ford, the Victoria road by the lower ford and the San Patricio road; "at selected spots on each of the three roads, from half to three-fourths of a mile from the presidio", the guards "fired upon the prisoners at a range too close to miss". Fannin and some forty wounded (Peña: eighty or ninety) were killed inside the presidio under Capt. Carolino Huerta. The bodies were burned and left until Gen. Thomas J. Rusk had the remains gathered and "buried them with military honors" on June 3, 1836. Sources: TSHA *Goliad Massacre*; Wikipedia *Goliad massacre* (read 2026-09-25). Refines `HIST-TEX-064`. | `sim/battles/goliad-massacre.mjs`: what is seen, heard and told (`staging.md` §7.5); no killing shown. |
| **HIST-TEX-515** | DOCUMENTED, with a dispute | **Who lived.** Twenty-eight escaped, some by feigning death and running for the river (Wikipedia names Herman Ehrenberg and William L. Hunter, who "survived despite being bayoneted and clubbed"); about twenty were spared as "physicians, orderlies, interpreters, or mechanics" through the pleas of Francita Alavez and Col. Francisco Garay (TSHA). Alavez, who came with Capt. Telesforo Alavez, had persuaded soldiers at Copano to loosen prisoners' bonds and feed them, and on the evening before the massacre "entered the fort... and brought out several men and hid them"; Dr. Joseph Barnard and Dr. Jack Shackelford, both spared, testified to her conduct (TSHA *Alavez, Francita*). **DISPUTED:** Wikipedia says "the 75 soldiers of Miller and the Nashville Battalion" were given white armbands and spared, which does not square with TSHA's twenty. | The spared and escaped outcomes; Alavez seen, not spoken for. |
| **HIST-TEX-516** | TRADITION | **Fannin's last requests.** Later accounts say Fannin asked to be shot in the heart and not the face, to have a Christian burial, and to have his watch sent to his family, and that he was shot in the face and his body burned (Wikipedia *Goliad massacre*, read 2026-09-25; not in TSHA's entry as read). | Not shown; if told, told as "it was said afterward". |
| **FIC-GONZ-437** | **FICTIONAL FOR GAMEPLAY** | **The Goliad massacre as depicted** (`docs/battle-research/staging.md` §7). Invented here: the distant camera at the gate; the song heard at dusk; the columns passing out of the frame before they halt; three volleys heard far off and no one seen to fall; escapes seen at distance; a quiet "Follow" card at the muster instead of "Watch"; that a man still wounded on March 27 cannot run (if the owner chooses it); the shares (89 executed, 6.5 escaped, 4.7 spared in 100) rounded as the code keeps them; and the reconstructed prisoners' talk in §7.4. | |
```

### 7.11 Questions for the owner

**G1. How the massacre is shown.**
- (a) **As §7.5: the muster and the march seen from a distance, the volleys heard far off, nobody seen to fall, escapes seen
  running into the timber, everything else told afterwards.** *(Recommended.)*
- (b) Words only: a card and the account, nothing drawn.
- (c) (a), and the family's own person is not followed at all (no Follow card).

**G2. A prisoner still wounded from Coleto on March 27.**
- (a) **He cannot run: killed inside the presidio, or spared at the spared share.** *(Recommended: the record kills the wounded in
  the fort.)*
- (b) The same shares as everyone.

---

## 8. San Jacinto, 21 April 1836

Research: [goliad-scrape-san-jacinto.md](goliad-scrape-san-jacinto.md), [../HOUSTON_CAMP.md](../HOUSTON_CAMP.md); new on
2026-09-25: Houston's official report of April 25, 1836 (texasbob.com transcription; the Texas State Library holds Houston's copy),
TSHA *San Jacinto, Battle of*, Wikipedia *Battle of San Jacinto*, American Battlefield Trust *Battle of San Jacinto*, the San
Jacinto Museum's *Battle Beats* page, the Traditional Tune Archive (§12). Registered: `HIST-TEX-066`, `-067`, `-075` to `-089`,
`FIC-GONZ-046`, `-053` to `-056`, `-064`.

### 8.1 Ground and positions

| Place | Where | Status |
| --- | --- | --- |
| Lynchburg / Lynch's ferry | `lynchburg` `(-95.0740, 29.7690)` (`scripts/build-colonies-map.mjs` L60); `lynchs-ferry` `(-95.08000, 29.76361)` (L610) | DOCUMENTED |
| The Texian camp | in the oak timber along Buffalo Bayou, above its mouth, west of the Mexican camp | DOCUMENTED (Houston's report; TSHA) |
| The prairie | open, rising gently between the camps, the rise screening the advance | DOCUMENTED ("screened by trees and the rising ground", TSHA) |
| The Mexican camp | on the plain toward the San Jacinto River, **behind a breastwork "about five feet high, constructed of packs and baggage, leaving an opening in the centre... in which their artillery was placed"** (Houston); marsh and Peggy's Lake behind it to the south and east | DOCUMENTED |
| Distance between the lines | under a mile; the Twin Sisters "took station within two hundred yards of the enemy's breastwork" (Houston) | 200 yards DOCUMENTED; the whole distance RECONSTRUCTED (about 1,000 yards) |
| Vince's Bridge | `vinces-bridge` `(-95.22015, 29.71933)` (L612), about nine map miles west of Lynchburg (COMPUTED; the Battlefield Trust says "five miles away"); destroyed by Deaf Smith on Houston's order | DOCUMENTED |
| **No battlefield site exists**; everything uses `lynchburg` | — | the code |

**Camera.** A frame about 1.2 × 0.8 mile from the Texian timber (west) to Peggy's Lake (east), for the advance; then about 0.5 ×
0.35 mile on the breastwork; then wide to the marsh for the rout, where the view stays **at distance**.

### 8.2 Phases

Sunset on 21 April is about **6:30 local time** (COMPUTED). The code fires `san-jacinto` at 16:30 (`sim/directors.mjs` L988).

| Phase | Starts | Game min | What happens | Status | Held |
| --- | --- | --- | --- | --- | --- |
| `skirmish` | Apr 20, afternoon | 60 | Sherman with a small mounted party engages the Mexican infantry; one Texian mortally wounded (TSHA) or two severely (Houston); several horses killed. | DOCUMENTED, count DISPUTED | 60 s (for a mounted family man only) |
| `cos` | Apr 21, 09:00 | — | Cos arrives with about 540 men who had "marched steadily for more than 24 hours with no rest and no food"; Santa Anna lets them sleep. | STRONGLY SUPPORTED (Wikipedia) | not held |
| `bridge` | Apr 21, morning–midday | — | Deaf Smith sent to destroy Vince's Bridge. | DOCUMENTED | not held |
| `parade` | 15:30 | 30 | "At half-past three o'clock in the evening, I ordered the officers of the Texan army to parade their respective commands." The line forms in the timber. | DOCUMENTED (Houston) | 45 s |
| `advance` | 16:00 | 25 | The line walks out across the prairie, screened by the rise; the cavalry out on the right; the two six-pounders wheeled forward; music (DISPUTED, §8.4). The Mexican camp at rest: men asleep, eating, bathing, horses watered. | DOCUMENTED; the camp's state STRONGLY SUPPORTED | 90 s |
| `guns` | 16:25 | 5 | The Twin Sisters open at about 200 yards on the breastwork. | DOCUMENTED | 30 s |
| `charge` | 16:30 | 8 | The line fires a volley and runs in shouting "Remember the Alamo!" "Remember Goliad!"; over the breastwork; the Mexican gun fires; resistance collapses. | DOCUMENTED | 90 s |
| `rout` | 16:38 | 10 | The Mexican army breaks east and south toward the marsh and Peggy's Lake; the Texian line dissolves into a crowd chasing it. "The conflict lasted about eighteen minutes from the time of close action until we were in possession of the enemy's encampment" (Houston). | DOCUMENTED | 60 s |
| `killing` | 16:48 → dusk | 100 | The killing goes on in the marsh and at the lake, where riflemen on the banks "shot at anything that moved"; Houston and Rusk cannot stop it; Houston's ankle shattered and horses shot under him. Almonte surrenders a body of men at dusk. | STRONGLY SUPPORTED; the length DISPUTED (Battlefield Trust: "nearly three hours") | **seen at distance only**, 60 s, then released |
| `prisoners` | dusk | — | Prisoners gathered; the camp taken. | DOCUMENTED | not held |
| `santa-anna` | Apr 22 | — | Santa Anna found hiding in the grass "dirty and wet... dressed as a common soldier", recognised when prisoners called out. | DOCUMENTED (TSHA); the cries STRONGLY SUPPORTED | not held (existing `santa-anna-taken`) |

**Held ≈ 5½ real minutes.**

### 8.3 Formation style and counts

| Phase | Texian | Mexican |
| --- | --- | --- |
| `parade`, `advance` | **`ranks`**: a single long line of regiments abreast (Houston's report, left to right): **Sherman's 2nd Regiment on the left; Burleson's 1st in the centre; the artillery (two six-pounders) under Hockley on Burleson's right; four companies of infantry (regulars) under Millard on the right of the artillery; the cavalry, "sixty-one in number", under Lamar on the extreme right.** Walking, not firing. **This is the formed side.** | **`camp`** (proposed style, §9): not formed; tents and fires, arms stacked, men lying down, horses at water; behind the breastwork a few sentries. |
| `guns`, `charge` | **`ranks`** breaking into a run; one volley, then loading on the run or not at all. | A few units forming hastily behind the breastwork; the gun at the centre opening; **ragged `ranks`** that do not hold. |
| `rout`, `killing` | **`rout`** as pursuers: a crowd, no order, officers unheeded. | **`rout`**: running east and south into the marsh and the lake; many trying to surrender. |

**Counts.** Texian **910** (TSHA; Houston's report), plus **about 248** "mostly sick and ineffective" left with the baggage at
Harrisburg (TSHA); draw the line 1:3 (about 300 figures). Mexican **about 1,200–1,360** after Cos's 540 (`HIST-TEX-067`); draw 1:4
(about 330). **Mexican loss** 630 killed and 730 taken (TSHA; Houston's report gives 630 killed, 208 wounded, 730 prisoners).
**Texian loss** 9 killed or mortally wounded and 30 wounded (TSHA); **Houston's report says two killed and twenty-three
wounded**; Wikipedia 11 — DISPUTED; the game's rates stand.

**The owner's instinct, honestly — reversed.** At San Jacinto the Texians came on in a formed line and the Mexican army was caught
unformed, at rest. The Texian line then dissolved into a chase that no officer could stop.

### 8.4 Talk

| When | Speaker | Line | Kind, source |
| --- | --- | --- | --- |
| `parade` | Texian, worried | "Is he finally going to fight?" | reconstructed from the mood against Houston (`HIST-TEX-081`) |
| `advance` | Texian officer | "Hold your fire. Keep the line." | reconstructed |
| `advance` | music | caption: *A tune is played as the line goes forward: "Will You Come to the Bower?" — the story is told two ways, by a fifer and drummer, or by two fiddlers named Davis.* | **tradition** (San Jacinto Museum; Traditional Tune Archive; Elmo Schwab Jr., *Houston Post*, April 21, 1985; `HIST-TEX-519` proposed) — owner question J3 |
| `advance` | Mexican sentry | "¡Los tejanos! ¡A las armas!" — *The Texians! To arms!* | reconstructed |
| `charge` | Texian, many | "Remember the Alamo!" | **documented** (Houston's report: the troops "raised the war-cry, 'Remember the Alamo'") |
| `charge` | Texian, many | "Remember Goliad!" | **documented** (TSHA: "with the cry, 'Remember the Alamo!' 'Remember Goliad!'") |
| `charge` | Mexican officer | "¡Fuego!" — *Fire!* | reconstructed |
| `rout` | Mexican soldiers | "¡Me rindo!" — *I surrender!* | reconstructed |
| `rout` | Mexican soldiers | "Me no Alamo!" | **tradition** (in Texian memoirs; Wikipedia) — show labelled tradition or not at all (it is a Texian memory of Mexican words) |
| `killing` | Texian officer | "Stop! They've surrendered!" | reconstructed (officers tried to stop it: STRONGLY SUPPORTED) |

Houston speaks no line: the words often given him ("Hold your fire! God damn you, hold your fire!") come from later memoirs not read
here. **Deaf Smith's "Vince's Bridge is down!" is also later memoir: not shown** unless checked.

### 8.5 Casualty moments

- **Rates in code:** `SAN_JACINTO = { death: 0.01, wound: 0.03 }` (`sim/houston.mjs` L136); `fightSanJacinto` (L221–226) rolls
  every serving `'houston'` man with `weightOf: steadiness` (`frailty × DRILLED_STEADINESS 0.75` after three days' drill,
  L126–129); `tellSanJacinto` (L229–243) gives a wound as `WOUND_GRADES.slight`.
- **When:** at `charge`, in the few minutes at the breastwork when the Mexican gun and the hasty volleys fired; a man of the
  artillery at `guns`. **A drilled man is steadier in the drawing too**: he keeps his place in the line through `advance` while
  the undrilled drift.
- **Showing it:** a Texian hit at the breastwork sits down behind it; is carried back after. Mexican figures fall at the breastwork
  and in the first moments of the rout (about a quarter of the drawn sample); in `killing` the camera is at distance: figures
  running into the marsh, smoke over the lake's edge, firing heard; **no one is seen shot at close range**. Prisoners are drawn in
  groups with hands raised (`regular-surrender`) at `prisoners`.
- **Houston's wound** is told, not drawn.

### 8.6 A family's person: arrival and participation

**Paths in** (`sim/houston.mjs`, `sim/camp.mjs`, `sim/chores.mjs`): `join-houston` (`sim/chores.mjs` L692–702) — travel to
`houstonCamp(world)` **as it was when he set out**, `work: 1`, then `joinService` sets `siteId` to the camp **now**
(`sim/winter.mjs` L119); `takeInEnlisted` (L144–151) at `houston-san-felipe` turns period-2 enlisted men into Houston's; the army
moves by `followCamp` (L154–162, forced march) at each camp moment; `catchUpCamp` (L171–178) moves a man standing at his own
`siteId` that is no longer the camp.

**Every way today he is late, misses it, or "fights" without being there:**

| # | Case | Where | Effect |
| --- | --- | --- | --- |
| a | **No location check at the battle.** A man still marching (Harrisburg → Lynchburg is 14.5 miles) or stranded at an old camp is rolled as a fighter. | `fightSanJacinto` L221–226 | "fought" while absent |
| b | **A joiner stranded at an old camp**: `joinService` sets his `siteId` to the new camp, so `catchUpCamp` (which moves only a man at his own `siteId`) skips him until the next `followCamp`. | `sim/winter.mjs` L119; `catchUpCamp` L171–178 | left behind |
| c | Still on the road to join at 16:30: not serving; on arrival `joinService` shuts him out with "…found the volunteers gone from Gonzales" — **the wrong place name** (it uses `SERVICE.houston.siteId`). | `joinService` | misses it, told wrongly |
| d | **`join-houston` must start at home**; once the family has fled or reached a refuge, nobody can join. | `sim/chores.mjs` L1303; `sim/scrape.mjs` L215 | many men who did join from the road cannot |
| e | **The Lynchburg refuge bug**: `withFamily` counts any member standing at the family's refuge; Lynchburg and San Felipe are both refuges (`REFUGES`, `sim/scrape.mjs` L66) and Houston camps; so a Houston man at Lynchburg whose family is refuged there can be **captured by `overtake`** (`sim/road.mjs` L426–449, `PRISONER_SHARE = 0.5`) when Santa Anna's column reaches Lynchburg at noon on Apr 20, and shares the family's sickness and meals. | `sim/road.mjs` L214–217; `sim/scrape.mjs` L297–323 | a serving man captured the day before the battle |
| f | The `leave` question on Mar 25 (`sim/camp.mjs` L177–184; unplayed 0.5) sends a man home — correct (`HIST-TEX-076`), and said. Enlisted men waiting at San Felipe until Mar 28 are not asked. | — | fine; the enlisted gap is minor |
| g | **A `wounded` man cannot follow the camp** (`beginTravel` throws, swallowed). | `followCamp` L154–162 | left at an old camp, but still "fights" by (a) |
| h | **The camp guard at Harrisburg is not modelled** (`camp-guard` is a night's duty only, `sim/camp.mjs` L130–133; HOUSTON_CAMP.md §5 ceiling). | — | every serving man fights |

**What should change:**

1. **Presence by place.** `fightSanJacinto` takes the men **in the line**: serving, not travelling, at the Lynchburg camp. Before
   that, at `houston-lynchburg` + the march, **every serving man not wounded and not already there is force-marched to the camp**
   (Harrisburg → Lynchburg 14.5 miles, half a forced day), so he is there by the evening of Apr 20 — that is the arrival guarantee
   (a).
2. **`joinService` keeps the camp he reached** as his `siteId` (so `catchUpCamp` moves him on), and the shut-out line names the
   real place (b, c).
3. **Honest join offers**: the `join-houston` card estimates when he would catch the army, which is moving: from his place, at his
   pace, against the camps' dates (`HOUSTON_CAMPS`, L34–57). If he cannot reach it before Apr 21 15:30, the card says so.
4. **Joining from the road** (d): allow `join-houston` for a man with his family at a refuge or on the road (not only at home),
   since the army passed through the country the refugees were crossing; the family's company rules (`sim/company.mjs`) decide what
   leaving costs the rest. This is new and the owner's (J4).
5. **Fix (e)**: `withFamily` never counts a person with `service.status 'serving'`.
6. **The camp guard** (h): owner question J1 — recommended that only a man who is sick or hurt (`minor-injury` or `wounded`) when
   the army marches from Harrisburg is left with the baggage there, `present`, not `fought`; every well man goes.
7. **A wounded man is carried** with the baggage (g) and is at Harrisburg with the camp guard, which is what happened to the sick.

### 8.7 Alert

- **Apr 21, 15:30, at the person's side, by his company's captain** (reconstructed): *"Parade under arms. We're going at them this
  afternoon."* — **Watch** frames the prairie.
- **To a family whose person is with the camp guard at Harrisburg**, at 16:30: nothing (they could not hear it, eight or more miles
  off). Word on Apr 23.
- **Nobody else** is alerted; `victory-word` (Apr 23) carries the news.

### 8.8 Aftermath

**Historically:** Santa Anna captured on the 22nd; orders sent to the other Mexican divisions to withdraw; the refugees turning back
"many toward homes that no longer existed"; many men stayed in the army through the summer, others went home to their families;
land promised for service. **Modelled:** `tellSanJacinto` at `victory-word`: killed → dead; wounded → slight (3 days); unhurt;
everyone then **released and walking home**; `landPromised` counts acres; `turnHome` sends refuged families home; `scrape-end` Apr
25. **Choices:** none new. **He comes home**, as today, unless killed.

**Plain-words account:**

> For five weeks General Houston had led the army east, away from Santa Anna, while families fled ahead of both armies. On April 21,
> near where Buffalo Bayou meets the San Jacinto River, Santa Anna's army was camped behind a low wall of packs and saddles, and
> many of his soldiers were resting after a long march. At half past three Houston formed his 910 men in a long line, and they
> walked across the open prairie behind a low rise until they were close. Two cannon fired, the men fired, and then they ran at
> the Mexican camp shouting "Remember the Alamo! Remember Goliad!" In about eighteen minutes the Mexican army broke and ran toward
> the marsh and the lake behind it. Many Mexican soldiers were killed as they ran or tried to surrender, and the officers could
> not stop it: about 630 were killed and more than 700 taken prisoner, while fewer than ten Texians died. The next day Santa Anna
> was found hiding in the grass in a common soldier's clothes, and his capture ended the war. {Name} {was in the line {, steady
> from the drill at the camp,} and came through unhurt | was slightly hurt, and is on his feet | was killed in the charge | was
> left sick with the baggage at Harrisburg}.

### 8.9 Art

| Need | Why | Stand-in |
| --- | --- | --- |
| **A breastwork of packs, saddles and baggage** with an opening for a gun | Houston's report | `crate`, `barrel`, `sacks`, `packed-belongings` in a line |
| **A camp at rest**: men lying down, cooking, arms stacked, horses at water | the Mexican side | `regular-idle-*`, `regular-injured-rest` held as sleeping (a sleeping pose is requested), `campfire`, `horse-graze` |
| **Two six-pounders dragged by men** (the Twin Sisters had no horses on the field — **not verified**; draw them hauled by hand or by horse as the builder finds) | the guns | `cannon-iron-e` with `volunteer-march` figures |
| **Marsh and a lake edge with men wading** | the rout | `reeds-wind`, `water-motion`; figures clipped at the waterline |
| **A fifer and drummer, or two fiddlers** | the tune (tradition) | none: a caption only |
| **Prisoners in groups with hands raised** | the end | `regular-surrender` |

### 8.10 Proposed `HISTORY.md` rows

```
| **HIST-TEX-517** | DOCUMENTED | **The order of battle and the attack at San Jacinto, from Houston's report of April 25, 1836.** "At half-past three o'clock in the evening, I ordered the officers of the Texan army to parade their respective commands." The line, left to right: the Second Regiment under Sherman; the First under Burleson; the artillery, "two six-pounders", under Hockley; four companies of infantry under Millard; the cavalry, "sixty-one in number", under Lamar on the extreme right. The artillery "took station within two hundred yards of the enemy's breastwork", a "fortification about five feet high, constructed of packs and baggage, leaving an opening in the centre of the breastwork, in which their artillery was placed". The troops "raised the war-cry, 'Remember the Alamo'"; "the conflict lasted about eighteen minutes from the time of close action until we were in possession of the enemy's encampment". TSHA adds the cry "Remember Goliad!" and that the advance was "screened by trees and the rising ground", and that "some 248 men, mostly sick and ineffective, were left with the baggage" at Harrisburg. Sources: Houston's official report (texasbob.com transcription; Houston's copy at the Texas State Library); TSHA *San Jacinto, Battle of* (both read 2026-09-25). **DISPUTED:** the Texian loss (Houston: two killed, twenty-three wounded; TSHA: nine killed or mortally wounded, thirty wounded; Wikipedia: eleven) and the April 20 skirmish's loss (one mortally wounded, TSHA; two severely, Houston). Refines `HIST-TEX-067`. | `sim/battles/san-jacinto.mjs`: a formed Texian line against an unformed camp; the documented cries. |
| **HIST-TEX-518** | STRONGLY SUPPORTED | **The Mexican camp at rest, and the rout.** Cos arrived about 9 a.m. with about 540 men who had marched more than 24 hours without rest or food; Santa Anna let them sleep, and the troops rested, ate and bathed (Wikipedia *Battle of San Jacinto*, read 2026-09-25). After the eighteen minutes the Mexican army fled into the marsh toward Peggy's Lake, where riflemen on the banks "shot at anything that moved"; Houston and Rusk tried to stop the killing and "were unable to gain control of the men, incensed and vengeful" (Wikipedia); the Battlefield Trust says the slaughter "lasted nearly three hours" (length DISPUTED). Santa Anna was found on April 22 "hiding in the grass... dressed as a common soldier" (TSHA) and recognised when prisoners called out (Wikipedia). "Siesta" for the camp's state is popular framing: TRADITION. "Me no Alamo!" as the cry of surrendering Mexican soldiers is in Texian memory: TRADITION. | The Mexican `camp` style; the rout seen at distance; the killing told in words. |
| **HIST-TEX-519** | TRADITION / DISPUTED | **The music at San Jacinto.** The Texian advance is said to have gone forward to "Will You Come to the Bower?"; by one tradition a fifer and drummer played it, by the Davis family's, two fiddlers, Daniel and George Washington Davis, since the army had no fifers or drummers (San Jacinto Museum *Battle Beats*; the Traditional Tune Archive, citing Elmo Schwab Jr., *Houston Post*, April 21, 1985; read 2026-09-25). | Captioned as tradition, both versions named (owner question J3). |
| **FIC-GONZ-438** | **FICTIONAL FOR GAMEPLAY** | **San Jacinto as staged** (`docs/battle-research/staging.md` §8). Invented here: presence by place (serving men in the line at the Lynchburg camp), and every well serving man force-marched there by the evening of April 20; a joiner keeping the camp he reached; joining from a refuge or the road (if the owner chooses it); a serving man never counted in his family's refuge; that only a sick or hurt man is left with the baggage at Harrisburg (if the owner chooses it); the phase lengths; a drilled man keeping his place in the line in the drawing; the rout and the killing shown only at distance; the drawn counts; and every reconstructed line in §8.4. | |
```

### 8.11 Questions for the owner

**J1. The camp guard at Harrisburg** (about 248 of 1,158, "mostly sick and ineffective").
- (a) **Only a man sick or hurt when the army marches from Harrisburg stays with the baggage; every well man fights.**
  *(Recommended: a sent person takes part, and the record's guard was the sick.)*
- (b) About one in five by a seeded share, sick or not.
- (c) Nobody is left.

**J2. The killing after the rout.**
- (a) **Seen only at distance (men running into the marsh, firing heard, smoke at the lake's edge) and told plainly in the
  account: many Mexican soldiers were killed as they ran or tried to surrender, and the officers could not stop it.**
  *(Recommended: "walk away understanding what happened" needs it said; VISION §16 forbids showing it close.)*
- (b) Told in words only; the drawing ends at the camp taken.
- (c) Left out.

**J3. The tune.**
- (a) **A caption during the advance naming "Will You Come to the Bower?" as tradition, with both versions (fife and drum, or two
  fiddlers); no sound.** *(Recommended.)*
- (b) Play the tune softly, captioned as tradition.
- (c) No music.

**J4. Joining Houston from the road.**
- (a) **A man can set out to join the army from a refuge or the road, not only from home, with an honest arrival estimate.**
  *(Recommended: men did join the army from the Scrape; today they cannot.)*
- (b) Only from home, as now.

---

## 9. Cross-cutting engine needs

What the builders of `sim/battle-stage.mjs` and `public/battle-view.js` need beyond Gonzales, collected from the eight sheets.

**Styles** (`docs/BATTLES.md` §3 names eight; these fights need two more and a sharper meaning for some):

| Style | Used at | What the renderer does |
| --- | --- | --- |
| `bank` | Concepción (Texian), the Grass Fight (both sides in creek beds) | figures along a cover line; each on a **climb–fire–drop–load** cycle, visible only when up |
| `ranks` | Concepción, Béxar's sortie, Coleto's front, San Jacinto (Texian) | two or three ranks; **fire by rank on the officer's word** (a spoken or captioned order, then a volley and one smoke bank) |
| `column` | the Alamo's four, Concepción's charges, Béxar's entry, the Goliad prisoners | a dense block moving; loses shape under fire (the Alamo's columns merge) |
| `loose` | the Grass Fight, Coleto's night (Mexican sharpshooters), San Jacinto's pursuit | scattered, each on his own reload, using cover |
| `mounted` | Concepción, the Grass Fight, San Patricio, Agua Dulce, the Alamo's cavalry, Coleto's rear, San Jacinto's right | riders in company knots; **mounted fire** (no art yet); **a charge with lances** (no art yet) |
| `wall` | the Alamo, Béxar's roofs and barricades | men on a parapet or roof, firing over it; guns at embrasures |
| `street` | Béxar | small groups inside houses firing through **loopholes**; files crossing along walls; crowbar parties |
| `rout` | Concepción's retreat, Agua Dulce, the Alamo's runners, San Jacinto | running, no facing; for pursuers too |
| **`square`** (new) | Coleto | four faces of three ranks, guns at the corners, carts inside; faces fire outward independently |
| **`camp`** (new) | San Patricio, San Jacinto's Mexican camp, the Goliad prisoners at the muster | unformed: lying, sitting, cooking, arms stacked; the transition to `ranks` or `rout` is the event |
| **`building`** (new, or a mode of `street`) | the Alamo's long barrack and church | figures inside a room, at doorways; the room's cutaway (`ALAMO_LAYOUT.md`) |

**Fire patterns.** Volley by rank on a word (Mexican infantry, the Coleto square, San Jacinto's one volley); fire at will
(Texian riflemen everywhere); **loophole fire** (a flash and a puff at a wall, no figure); **canister** (a cone of dust and
smoke, figures in it checked); **long-range ineffective fire** in fog (flashes, no one falls); **sniping at night** (single flashes
in grass). Smoke accumulates by pattern: a volley makes one bank, loophole fire a line of small puffs along a wall, canister a
cone from the gun.

**Walls and buildings.** Houses you go into (Béxar, the Alamo's rooms, San Patricio's three houses): an interior state per house
(held by whom), a breach in a wall (`wall-breach`), a door broken; the Alamo's twelve north-wall sections (`createDamageState`,
`ALAMO_LAYOUT.md`) are the one existing destructible wall — **the assault must not be staged as the wall collapsing**: the record
is scaling, not a breach (`ALAMO_LAYOUT.md`: "A collapse of the entire north wall on the previous night has not been verified").

**Mounted fire, and charges.** Needed at five fights; the library has no pose for either. Stand-in: `dragoon-idle-*` with a
flash; a charge as `dragoon-march` at a faster gait (never faster than a gallop reads).

**Surrender and prisoners.** A white flag (Béxar, Coleto), hands raised (`*-surrender`: San Patricio, Coleto, San Jacinto),
**prisoners marched** in a column under guard (Coleto → Goliad, 9 miles; Goliad's three columns; San Patricio → south). A captured
family person stays the same entity (`health.condition 'captured'`), marched visibly, never teleported to "Matamoros"; where he
goes off the map, he is walked to the map's edge.

**Night, fog, weather, light.** Fog that thins (Concepción; Coleto's morning); night (San Patricio, Béxar's night work and the
Priest's House, the Alamo until 6:20, Coleto's night, the Goliad eve); cold rain (Béxar, Dec 7–8); moonlight (the Priest's House).
None exists as art; a darkening layer and the smoke sprites stand in. `docs/MILITARY_EXPERIENCE.md`'s seamless contract: light and
weather must not snap when pacing changes.

**Background pace inside a battle.** Béxar's four days and Coleto's night need a state between "held" and "released": the fight
continues visibly at the ordinary military cap (120 game minutes a tick), and the engine keeps drawing its fire patterns. The
held phases then enter it without a seam.

**Fates at staged moments.** Every engagement keeps its existing roll (`rollFates`, `fightSouth`, `stormAlamo`,
`goliadMassacre`); the engine needs **a resolution moment per person**, chosen by where he is drawn (exposure) and the phase, and
seeded so reloading does not re-roll it. A fate resolved but not yet "worded" (the Alamo, Goliad, the south) is drawn for the
participant's viewpoint only and kept out of the household's reports until the word.

**Presence by place.** Four engagements today resolve people by a service record wherever they stand (Concepción's detachment at
Espada, the Grass Fight and Béxar at the mill, the south at Refugio, Fannin at Goliad, San Jacinto anywhere). The engine's rule
should be: **a fighter is a person inside the battle's ground at contact**, and the director's job is to get every person who was
sent there in time (the §x.6 fixes). A person sent but not there is told plainly why.

**Honest offers.** Every card that sends a person toward a fight (a call, a join chore, a question whose yes is a departure)
computes his arrival from `awayProjection` (`sim/sight.mjs` L99–109) against the battle's contact moment and says it in words;
if he cannot arrive, it says so and the family may still send him.

**The Host.** Every spotlight in `sim/directors.mjs` for these fights frames `siteId: 'bexar'`, `'goliad'` or `'lynchburg'`; each
needs the battle ground (`world.battles[id]`'s camera frame) instead (§2.1 of BATTLES.md).

**No `saveVersion` bump** for any of this: an old save with no `world.battles` has no battle in progress, and the missing places
(`coleto`, the Concepción bend, San Patricio) have correct empty values until a class reaches them.

---

## 10. The arrival and participation fixes, in one table

| Engagement | Today | Fix (by offer, departure, pace — never the date) | Code |
| --- | --- | --- | --- |
| Concepción | the detachment never leaves Espada; latecomers never reach the army; Victoria's gatherers never join | `detachment-out` Oct 27 14:00, the detachment walks to the bend; the question open until then; latecomers follow the army's road; Victoria's march on; honest arrival on turn-out cards | `fightConcepcion` L499–551; `fallIn` L88–109; `closeDetachment` L472; `marchOut` L164–175; `sim/calls.mjs` L31–72, L87–101 |
| The Grass Fight | fighters stay in camp; the fight six hours after the alarm | a yes rides or marches out with Bowie or Jack at the alarm; the question closes when they go; the fight about midday | `fightGrass` L787–825; `QUESTION_MINUTES` (`sim/directors.mjs` L760, L771, L810–813) |
| Béxar | fighters stay at the mill; all fates at the flag; the flag waits on `ugartechea` | Milam's men walk in at 03:00 into two divisions; the reinforcement walks in on the 8th; fates by day; the flag unconditional; the mill nearer | `fightStorming` L912–959; `sim/directors.mjs` L838–883, L862 |
| San Patricio / Agua Dulce | men stand at Refugio; San Patricio unwalkable; a killed man can be recalled | the map to the Nueces (S1); men at San Patricio and riding with Grant; recall refused after the fight; Agua Dulce at 10:30 | `fightSouth` L295–310; `sim/winter.mjs` L29–43, L149–158; `sim/directors.mjs` L924–932 |
| The Alamo | posts on the plaza; the relief teleported; couriers walk | posts on walls; the relief rides as a formation and waits outside the lines; couriers ride; the relief card estimates arrival | `postOf` (`sim/alamo-runner.mjs` L55); `reliefRides`/`reliefEnters` L224–245; `sendCouriers` L204–221 |
| Coleto | nobody marches out; no Coleto place; `FANNIN_MARCHES` 18 hours early | `fannin-marches` Mar 19 09:00; the column to a `coleto` place; the wounded ride in carts; Horton's riders (K2); the clock offset fixed | `fightColeto` L181–187; `sim/winter.mjs` L148–151 |
| Goliad | wounded can "escape"; comments disagree with constants | wounded cannot run (G2); comments fixed; outcomes staged | `goliadMassacre` L190–199; `MASSACRE` L135; header L10, L133 |
| San Jacinto | no place check; joiners stranded; can't join from the road; serving men captured at the Lynchburg refuge; no camp guard | presence by place and a forced march to Lynchburg by Apr 20; `joinService` keeps the reached camp; join from the road (J4); `withFamily` excludes the serving; the sick left at Harrisburg (J1) | `fightSanJacinto` L221–226; `followCamp`/`catchUpCamp` L154–178; `sim/winter.mjs` L119; `sim/road.mjs` L214–217, L426–449; `sim/chores.mjs` L692–702, L1303 |

---

## 11. The owner's questions, all together

Each with the recommended option first and marked. Numbered by engagement.

| # | Question | Recommended |
| --- | --- | --- |
| C1 | A volunteer who turns out after the army marched | (a) follows the army and falls in; the card says when |
| G1 | The Grass Fight's hour | (a) alarm ~10 a.m., fight 11–12:30 |
| B1 | How Béxar's four days play | (a) four held episodes, ~12 real minutes, background between |
| B2 | Milam's call (later accounts) | (a) spoken by Milam, drawn as tradition |
| S1 | San Patricio off the walkable map | (a) extend the map to the Nueces |
| S2 | The San Patricio prisoners' fate | (a) keep Matamoros, register the dispute |
| A1 | The *degüello* | (a) bugles captioned "the attack"; the *degüello* named in the account as told later |
| A2 | The line in the sand | (a) not shown; mentioned in the account as a doubted story |
| A3 | Watching a man die at the Alamo before the word | (a) the student may watch; the household learns with the word; the camera holds on the wall |
| K1 | Joining Fannin | (a) keep: only the escaped |
| K2 | Horton's riders at Coleto | (a) a man with his horse can be among them and escape |
| K3 | How long Coleto plays | (a) all three assaults and the dawn guns, ~10 minutes |
| G1 (Goliad) | How the massacre is shown | (a) distant, heard not seen, told afterwards |
| G2 | A prisoner still wounded on March 27 | (a) cannot run |
| J1 | The camp guard at Harrisburg | (a) only the sick or hurt stay |
| J2 | The killing after the rout | (a) seen at distance, told plainly |
| J3 | The tune | (a) a caption naming both traditions, no sound |
| J4 | Joining Houston from the road | (a) allowed, with an honest estimate |

(The Grass Fight's G1 and Goliad's G1 are different questions; a builder should cite them as "Grass G1" and "Goliad G1".)

---

## 12. Sources opened for this sheet (2026-09-25)

Each read through a fetching tool that returns a summary of the page with quoted sentences. **Check wording against the page before
quoting any of it to a class.** The six research files' own sources are listed in those files and not repeated.

| Source | Used for | Trust |
| --- | --- | --- |
| TSHA *Handbook*, "San Jacinto, Battle of" | the line, the cries, the screen, 18 minutes, 910, 630/730, 248 left with the baggage, Santa Anna in the grass | High |
| Houston's official report of San Jacinto, April 25, 1836 ([texasbob.com transcription](https://texasbob.com/txdoc/texdoc15.html); Houston's copy at the [Texas State Library](https://www.tsl.texas.gov/treasures/republic/san-jacinto/report-01.html)) | 3:30 parade, the order of battle, the 61 cavalry, two six-pounders within 200 yards, the five-foot breastwork, "Remember the Alamo", eighteen minutes, 2 killed/23 wounded | Primary; the transcription not checked against the manuscript |
| Wikipedia, "Battle of San Jacinto" | Cos's march, the camp resting, Peggy's Lake, officers unable to stop the killing, "Me no Alamo", Santa Anna recognised | Medium (tertiary) |
| American Battlefield Trust, "Battle of San Jacinto" | the brush and pack-saddle barricade, "nearly three hours", Vince's Bridge "five miles away" | Medium |
| San Jacinto Museum, "Battle Beats"; Traditional Tune Archive, "Will You Come to the Bower" | the tune; fife and drum versus the Davis fiddlers (citing Schwab, *Houston Post*, 1985) | Low–medium; tradition |
| TSHA *Handbook*, "Goliad Campaign of 1836" | Coleto's march, Urrea's 180/100/1 gun, >1,400, losses, "unconditional surrender" | High |
| Wikipedia, "Battle of Coleto" | 09:00, the square three ranks deep, the units by face, three assaults, the night, 06:15 guns, the terms | Medium |
| Wikipedia, "Fannin Battleground State Historic Site" | Coleto's coordinates | Medium (location) |
| TSHA *Handbook*, "Goliad Massacre" | sunrise, three groups, the stories told, the roads, ½–¾ mile, Huerta, Portilla, 342/28/20, Alavez and Garay, Rusk's burial | High |
| Wikipedia, "Goliad massacre" | the prisoners made to turn, the wounded in the chapel, Ehrenberg and Hunter, Miller's 75 with white armbands, Fannin's requests | Medium; the requests are secondhand |
| TSHA *Handbook*, "Alavez, Francita" | Copano, bringing men out of the fort, Barnard and Shackelford's testimony | High |
| TSHA *Handbook*, "Alamo, Battle of the" | about 5 a.m., about 1,800, canister and re-forming, Travis on the north bastion, the long barrack, Bowie, ninety minutes, about 600 | High |
| Wikipedia, "Battle of the Alamo" | the March 5 order of battle (Hardin, Todish), no overcoats, "¡Viva Santa Anna!" and bugles, the sacristy, the pyres | Medium |
| TSHA *Handbook*, "Degüello"; Wikipedia, "El Degüello"; search results citing Potter (1860) and Hardin | the *degüello*'s standing | Low for the claim itself; the dispute is what is recorded |
| The Alamo, [*Joe's Account*](https://www.thealamo.org/remember/battle-and-revolution/joes-account) | Travis's words; Joe's sequence; recorded by W. F. Gray, March 20, 1836 | High (institutional; testimony) |
| TSHA *Handbook*, "San Patricio, Battle of"; Wikipedia, "Battle of San Patricio" | the night, the houses, the ranch, the lanterns, fifteen minutes, the prisoners' fate (disputed) | High / medium |
| TSHA *Handbook*, "Agua Dulce Creek, Battle of"; Wikipedia, "Battle of Agua Dulce" | 26 men, the herd, 10–11 a.m., the groves, Grant, Brown, Benavides | High / medium |
| *Reglamento para el exercicio y maniobras de la infantería* (Madrid, 1808), [archive.org A053320148](https://archive.org/details/A053320148) (OCR) | the Spanish words of command; three ranks; *fuegos graneados* | Primary for Spain; its use in Mexico 1835–36 not verified |
| Alamo Studies Forum, "[Mexican Infantry Tactics in 1836](https://alamostudies.proboards.com/thread/327/mexican-infantry-tactics-1836)" | that the Mexican manual in use is not identified; French influence | Low (forum), used only for the uncertainty |
| Sons of DeWitt Colony, "[Soldados Mexicanos](http://www.sonsofdewittcolony.org/adp/history/1836/the_battle/the_mexicans/ejercito.html)" | company types; drummers, fifer, trumpeters | Medium |

**Sunrise and sunset** in §§1–8 were computed here from latitude, the date's solar declination and the equation of time, to
about ±10 minutes; they are marked COMPUTED where used.
