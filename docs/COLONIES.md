# Families across the colonies

**Status: decided, researched and specified 2026-09-14 (§5); every owner question answered (§7); build step 1 (places and roads) built 2026-09-14** ([evidence](evidence/colonies-map.json)); **build step 2 (families dealt to the colonies) built 2026-09-14** ([evidence](evidence/colonies-deal.json)); **build step 3 (automatic neighbours: farming, building, trading, house-raisings) built 2026-09-14** ([evidence](evidence/neighbours.json)). New classes still use the Gonzales map by default until step 5 (owner, 2026-09-14); `MAP=colonies` uses this one. Read this before changing where
families start, the arrival, how news travels between settlements, or what a family far from Gonzales can do. It
amends `FIC-GONZ-024` (one party arriving together) and builds on the real terrain of `docs/LAND_GRANTS.md` §8.

---

## 1. What the owner asked for

> "we're going to need data like this for the whole game area. players are not all starting in the gonzales area."
>
> — 2026-09-14

| Question | Owner's answer, 2026-09-14 |
| --- | --- |
| The game area | **The settled colonies of 1835**, 94–99°W and 28–32°N, at fine detail everywhere (terrain built, `docs/evidence/terrain-data.json`). |
| How each family's starting place is decided | **Dealt near real settlements.** The seed spreads families across the settlements that existed in 1835, on land along real rivers near each, so every class gets a mix. |
| The one party arriving together (`FIC-GONZ-024`) | **Each family arrives at its own land**, separately, at dawn on September 28, 1835, in its own colony. The peaceful opening and building stay the same everywhere; only the shared party is dropped. |
| How word of the fight at Gonzales reaches a family far away | **Riders along the real roads.** The existing courier model over real distance: word passes settlement to settlement at a rider's pace, so distance decides when a family hears. |
| What a family far from Gonzales can do | **Join the army that gathered after.** Volunteers converged on Gonzales in the days after October 2 and marched on Bexar; a distant family can send somebody to join it. This stretches the class timeline past October 2. |
| How families are divided among settlements (2026-09-14, after research) | **In proportion to 1834 population** (`HIST-TEX-011`): more families near San Felipe and Columbia, fewer near Gonzales and Victoria; a small settlement often gets nobody. |
| Families near Béxar, Goliad and Nacogdoches, which were not empresario colonies (2026-09-14) | **Only the empresario colonies are starts.** Béxar, Goliad and Nacogdoches stay on the map as places, not where families begin, so the late-settler, title-pending premise holds for every family. |
| Liberty (2026-09-14) | **Used.** The owner is from Liberty. It is a start like the colony settlements (`HIST-TEX-013`): in the Galveston Bay and Texas Land Company grant, its settlers' titles contested in 1831 and promised in 1835, and its volunteers under Andrew Briscoe marched to Concepción and Béxar. |
| Gonzales (2026-09-14) | **Guaranteed a family in every class**, because the story opens there. Read with the Liberty decision, the specification seats one family at each of the two before dealing the rest (§5.1). |
| Liberty seated as well (2026-09-14) | **Yes: seat both** Gonzales and Liberty in every class. |
| Victoria (2026-09-14) | **Left to the numbers**: a start only in classes of 25 or more. |
| How long a class is, now the story runs to December (2026-09-14) | **About 50 minutes.** *"compress so the game fits a 50 minute class. 1st 10 minutes are straight farming, then the war begins. players shouldn't feel like it's compressed time, but it'll have to be."* (§5.7) |
| Playing alone (2026-09-14) | **Solo in a normal world**: a student who stays after a tutorial plays a normal class alone, its other families unplayed (§5.8). |
| Unplayed families (2026-09-14) | The owner asked: *"players should be able to trade and help npc neighbors correct? so solo play should feel normal correct?"* They could not: an unplayed family takes no orders, so it never answers a trade and never raises a house to help with. Decided: **every family without a student is an automatic neighbour, in every class**; it **farms and builds its house, trades fairly, holds and helps at house-raisings, and answers the war** as families historically did; and it is **never ranked** at the end (§5.9). |

## 2. What these commit the design to

- **Settlements are places on the real map**, each with a documented 1835 existence, position and river, and a claim.
- **Homesteads are dealt near them** by the seed, on the real watercourses, with grants laid out as `sim/grants.mjs`
  does now. Neighbours are the families dealt to the same settlement; a house-raising (`docs/SETTLING_IN.md` step 5)
  is between them.
- **Roads are the 1835 roads** where they are documented (the roads between San Felipe, Gonzales, Bexar, Goliad,
  Nacogdoches and the ferries), and invented tracks where they are not, marked so.
- **News moves by riders** along those roads, settlement to settlement, at the pace the courier model already uses.
  When word actually reached each place is researched, and the game's timing is checked against it.
- **The timeline runs past October 2** into the gathering of volunteers at Gonzales and the march toward Bexar, to
  whatever end the research supports. Glory already scales with distance from home (`docs/MONEY_AND_GLORY.md`).
- **Old saves keep the Gonzales party** on the invented map they were played on.

## 3. Research before the specification

1. Which settlements existed in September 1835 inside the area, where each stood, and on which river (Gonzales,
   San Felipe de Austin, Columbia, Brazoria, Velasco, Matagorda, Columbus/Beeson's, Mina/Bastrop, Washington,
   Victoria, Goliad, Refugio, Bexar, Nashville on the Brazos, Liberty, Anahuac, Harrisburg, Nacogdoches, San
   Augustine and others), and roughly how many families each had.
2. The roads and ferries of 1835 between them (the Camino Real / San Antonio road, the Atascosito road, the Gonzales
   to San Felipe road), and river crossings.
3. When news of the fight at Gonzales reached each settlement, from dated letters and accounts.
4. The gathering at Gonzales after October 2 (the volunteers' arrival, the election of Austin, the march on Bexar)
   with dates, and what a volunteer from a distant colony brought and did.
5. Women and the fighting of 1835–36: whether any fought, how it was regarded, and the sources — for the glory
   penalty decided 2026-09-14 (`docs/MONEY_AND_GLORY.md` §4).
6. Whether the late-settler premise (`FIC-GONZ-024`) and the pending-title grants (`FIC-GONZ-025`) still hold for
   families in Austin's colony and elsewhere, whose land law and empresarios differed.

## 3a. What the research found (2026-09-14)

Registered in `HISTORY.md`: **`HIST-TEX-006`** (the news chain, from the letters), **`HIST-TEX-007`** (the fight, the
gathering and the march), **`HIST-TEX-008`** (the La Bahía and Atascosito roads), **`HIST-TEX-009`** (women as
noncombatants). The settlements and the water they stood on were already registered as `HIST-TEX-003`.

**The news, dated** (`HIST-TEX-006`, *The Austin Papers* III):

| Date, 1835 | Where | What |
| --- | --- | --- |
| Sept 28 | Captain Moore's, on the Colorado | "Mr Mitchell arrived yesterday" with the demand for the cannon (Saul, Sept 29) |
| Sept 29 | Captain Moore's | Saul writes to San Felipe and Washington: "The frontiers are attacked" |
| Sept 30 | Gonzales | Martin, Coleman and Moore to San Felipe and the Lavaca: 18 men yesterday, 150 today |
| by Oct 1 | San Felipe | letters "by Express by way of Coles' Settlement"; Washington "turning out" |
| Oct 2–3 | San Felipe | Lightfoot and Perkins bring the attack on Gonzales; expresses on to the Trinity, Nacogdoches, Columbia, Matagorda, the Lavaca; the circular "the war has commenced" |
| Oct 4 | San Felipe | about 300 volunteers at Gonzales; word sent to the Trinity and Bevil's Settlement |

So word ran from Gonzales to the Colorado in about a day, to San Felipe in two or three, and onward east from there —
**the relay the game's courier model already imitates, and the timing it should be checked against.**

**The gathering** (`HIST-TEX-007`): about 160 men from the Guadalupe, Colorado and Lavaca fought on October 2 with no
Texian killed; Goliad was taken by October 10; Austin was at Gonzales on October 10, elected by October 11, and the
army of not above 300 set out for Bexar on October 11 or 12, while about 110 men had gone toward Victoria. Then
Concepción (Oct 28), the Grass Fight (Nov 26) and the taking of Bexar (Dec 5–9). **That is the arc a distant family's
volunteer joins.** Goliad was taken in a small fight on the way (Kerr's letter reports one Mexican soldier killed and one
Texian wounded); Concepción is the first battle of the march itself. Either is where `fought`, and the owner's
women-in-battle rule, would first apply.

**Roads** (`HIST-TEX-008`): the La Bahía road (Louisiana – Washington – La Grange crossing – Goliad) and the Atascosito
road (Refugio/Goliad – Colorado – San Felipe – Trinity) are documented as routes, not courses. The Gonzales–San Felipe
and Gonzales–Bexar roads remain not found.

**Women** (`HIST-TEX-009`): noncombatants throughout; no woman is recorded fighting. How a family would have been
judged for sending one is not documented, so the penalty's size is a game rule.

**Still open:**
- ~~**Settlement positions.**~~ **Found 2026-09-14** (`HIST-TEX-010`), from the USGS Geographic Names file for Texas
  (`DomesticNames_TX_Text.zip`, 1.86 MB, downloaded with approval, kept in scratch):

| 1835 settlement | GNIS place (feature ID) | Latitude, longitude | Note |
| --- | --- | --- | --- |
| Gonzales | Gonzales (1336672) | 29.50163, -97.45249 |  |
| San Felipe de Austin | San Felipe (1346329) | 29.79301, -96.10079 | the present town beside the old townsite |
| Washington | Washington (1349512) | 30.32521, -96.15663 | the locality at Washington-on-the-Brazos |
| Mina | Bastrop (1330128) | 30.11049, -97.31527 | Mina was the 1835 name |
| Brazoria | Brazoria (1352845) | 29.04441, -95.56911 | GNIS also lists Old Brazoria (1364399), 29.0555255, -95.5652235 |
| Velasco | Velasco (1381075) | 28.96191, -95.36050 | **the 1891 town; the map uses old Velasco at Surfside Beach, 28.9419, -95.3001 (`HIST-TEX-025`)** |
| Columbia | East Columbia (1356596) | 29.14136, -95.61578 | Columbia of 1835 is nearer East Columbia on the Brazos; West Columbia (1371096) is 29.1438582, -95.6452249 — **checked: 1835 Columbia is West Columbia, 29.14190, -95.64884, which the map uses (`HIST-TEX-025`)** |
| Matagorda | Matagorda (1362277) | 28.69082, -95.96746 |  |
| Harrisburg | Harrisburg (1337404) | 29.71828, -95.27966 | now within Houston; **the map uses the bayou-front blocks, 29.7228, -95.2785 (`HIST-TEX-025`)** |
| Anahuac | Anahuac (1329510) | 29.77300, -94.68270 |  |
| Liberty | Liberty (1339866) | 30.05799, -94.79548 |  |
| Nacogdoches | Nacogdoches (1363573) | 31.60351, -94.65549 |  |
| Victoria | Victoria (1370631) | 28.80527, -97.00360 |  |
| Goliad | Goliad (1358133) | 28.66833, -97.38833 | the presidio La Bahía stands across the San Antonio River from the present town; **the map uses the 1835 settlement at the presidio, 28.6476, -97.3830 (`HIST-TEX-025`)** |
| Refugio | Refugio (1345013) | 28.30528, -97.27527 | **the map uses the 1834 plaza, 28.296482, -97.274887 (`HIST-TEX-025`)** |
| Bexar | San Antonio (1380951) | 29.42412, -98.49363 |  |
| Nashville on the Brazos | Nashville (historical) (2033973) | 30.82578, -96.65288 | Robertson's colony; not in HIST-TEX-003, so its 1835 existence needs its own claim before use |

  San Patricio (27.9544619, -97.7719419) and Copano lie south of 28°N, outside the game area; Copano Village today is not the 1835 landing.
- ~~**Families per settlement.**~~ **Found 2026-09-14** (`HIST-TEX-011`): Almonte's 1834 counts by municipality — Béxar
  2,400, Goliad 700, Victoria 300; San Felipe 2,500, Columbia 2,100, Matagorda 1,400, Mina 1,100, Gonzales 900; Nacogdoches
  3,500, San Augustine 2,500, Liberty 1,000 (Johnsburg, on the Red River, and San Patricio are outside the area). They
  are for whole jurisdictions and 1834, and include enslaved people. **Decided:** families are dealt in proportion to
  these, among the colony settlements only. Gaps for the specification: Washington was inside San Felipe's municipality in
  1834, Brazoria and Velasco inside Columbia's, and Refugio (Power and Hewetson) and Robertson's colony have no 1834 figure.
- ~~**The premise outside DeWitt's colony.**~~ **Found 2026-09-14** (`HIST-TEX-012`): titles were still being issued in
  1834–35 in Robertson's colony (from October 1834), De León's (over a hundred by July 1835) and the Burnet–Vehlein–Zavala
  grants, immigration continued through 1835, and every colonial land office was closed because of the Revolution
  (October 27 or November 13, 1835 — the sources differ). **So "a grant marked out, title pending" fits a newcomer in
  those colonies better than in DeWitt's**, whose contract ran out in 1831: the office that would have finished the title
  shut weeks after the family arrived. Béxar, Goliad and Nacogdoches were not empresario colonies, and a family placed
  near them needs its own premise.
- **Riders' pace** is already a game number; the dated chain above is what it should reproduce.

## 4. Build order (provisional)

*Superseded by §6.*

---

## 5. Specification

Every number in this section not tied to a claim is invented and registered as `FIC-GONZ-027` when built.

### 5.1 Where families start

**The starts** are the colony settlements with an 1834 count (`HIST-TEX-011`), placed at their official coordinates
(`HIST-TEX-010`, `HIST-TEX-013`):

| Start | Weight (1834) | Colony | Stands on |
| --- | --- | --- | --- |
| San Felipe de Austin | 2,500 | Austin's | the Brazos |
| Columbia | 2,100 | Austin's | the Brazos (Brazoria and Velasco were in its jurisdiction) |
| Matagorda | 1,400 | Austin's | the Colorado near its mouth |
| Mina | 1,100 | Austin's (the upper Colorado) | the Colorado |
| Liberty | 1,000 | Galveston Bay and Texas Land Co. | the Trinity |
| Gonzales | 900 | DeWitt's | the Guadalupe at the San Marcos |
| Victoria | 300 | De León's | the Guadalupe |

`ceiling:` Washington (then inside San Felipe's jurisdiction), Refugio and Robertson's colony have no 1834 figure and are
not starts; Washington and Refugio are still drawn as places. Add them when a count is found.

**Dealing.** Seat one family at Gonzales (the owner) and one at Liberty (the owner's wish that Liberty be used — a
class of five would otherwise leave it out once Gonzales is seated), then deal the rest in proportion to the weights by
largest remainder, ties to the larger settlement. Which family goes where is shuffled by the seed. Result:

| Families | San Felipe | Columbia | Matagorda | Mina | Liberty | Gonzales | Victoria |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 5 | 1 | 1 | 1 | 0 | 1 | 1 | 0 |
| 10 | 2 | 2 | 1 | 1 | 2 | 2 | 0 |
| 15 | 4 | 3 | 2 | 2 | 2 | 2 | 0 |
| 20 | 5 | 4 | 3 | 2 | 3 | 3 | 0 |
| 30 | 8 | 6 | 4 | 3 | 4 | 4 | 1 |

**The land.** Each family's homestead anchor is placed by the seed within 2 to 12 miles of its start, within half a mile of
a named or perennial watercourse (`HIST-GONZ-009`: colonists settled along the rivers and creeks), never in water, on
ground no steeper than a house could stand on, not inside a mile of the town, and outside `HOUSE_CLEARANCE` of every
other anchor. Grants are laid out round the anchors exactly as `sim/grants.mjs` does now. The house site itself is
chosen on arrival (`docs/LAND_GRANTS.md` §8.2).

### 5.2 Places and roads on the real map

- **Settlements** are sites at their coordinates, projected by `milesFrom` (`sim/terrain-data.mjs`): the seven starts and
  the places Béxar, Goliad, Victoria, Washington, Brazoria, Velasco, Harrisburg, Anahuac, Nacogdoches and Refugio. Where the
  1835 site stood apart from the present town (San Felipe's old townsite, La Bahía across the river from Goliad, which
  Columbia), it is placed at the present town until measured, and says so (`ceiling:`).
- **Gonzales's own places move onto the real river**: the ford opposite the town on the Guadalupe (`HIST-GONZ-007`),
  Castañeda's camp about seven miles upriver of it, measured along the real Guadalupe (`HIST-GONZ-008`), and the forks
  of the rivers at the real confluence (the origin). `HIST-GONZ-015`'s "two miles west of Gonzales" is re-checked against
  the measured distance, about 1.3 miles, and corrected in `HISTORY.md` if the data does not bear it out.
- **Roads** are a graph between the settlements along the documented routes (`HIST-TEX-008`): the La Bahía road
  (Washington – the Colorado crossing near La Grange – Goliad), the Atascosito road (Goliad and Victoria – the Colorado –
  San Felipe – Harrisburg – Liberty), and connecting roads where the letters show traffic (Gonzales – the Colorado at
  Moore's – San Felipe, `HIST-TEX-006`; Gonzales – Béxar; Gonzales – Victoria; San Felipe – Columbia – Brazoria –
  Velasco; Columbia – Matagorda; San Felipe – Mina). **Every course is laid by least-cost routing over the real
  terrain between its settlements** and marked `FIC-GONZ-027`: no surveyed 1835 course was found. Rivers are crossed
  only at crossings the roads name (fords and ferries), which is the rule the ford at Gonzales already follows.
- **Lanes** join each homestead to its nearest road along the easiest ground (`docs/LAND_GRANTS.md` §8.2).

### 5.3 The arrival

Every family arrives at dawn on September 28 at the point where its lane leaves the road, and drives up to its own
land; nothing else about the opening changes (`docs/SETTLING_IN.md`). The founding line names the family's
settlement: *"Dawn on September 28, 1835. Your family has turned off the road from San Felipe with the wagon, the ox
and the horse, towards land of its own."* **Neighbours are the families of the same start**; the "Go to" list offers
them first, and a house-raising happens between them. `FIC-GONZ-024` is amended: separate families, each arriving at
its own land on the same dawn, not one party.

### 5.4 News by riders

- **Word leaves Gonzales when the letters say it did.** Two dispatches carry the timeline's news outward: the demand for
  the cannon and the call for help (September 29–30, `HIST-TEX-006`), and the fight and its outcome (October 2–3,
  `HIST-TEX-007`).
- **It travels the road graph, settlement to settlement.** A dispatch is a rider (the existing courier entity) who rides
  to the next settlement at `RIDER_SPEED`; there, after a **relay delay** (the committee reading, copying and finding a
  fresh rider), a new rider sets out on each road onward. Within a settlement, riders go out to its families' homesteads
  up their lanes, as the Gonzales riders do now — so a house set far back hears later.
- **The relay delay is calibrated to the dated chain**, not guessed: the class's own riders must bring the call for help
  to the Colorado at Moore's by about September 28–29 and to San Felipe by October 1, and the fight to San Felipe by
  October 2–3 (`HIST-TEX-006`). A test runs the relay on the real roads and asserts those arrivals within a stated
  slack. `RIDER_SPEED` alone would bring San Felipe the news in about fourteen hours, which is too fast by days.
- **What a family is asked depends on where it is.** A family near Gonzales gets the existing calls (carry food in, go
  upriver). A family elsewhere gets the call its settlement actually made: to turn out and march for Gonzales
  (`HIST-TEX-006`: Washington "turning out", Harrisburg men "on by to-morrow", volunteers rendezvousing at Kerr's on the
  Lavaca).

### 5.4a What each settlement asked (research, 2026-09-14, `HIST-TEX-014`)

Read in the letters of *The Austin Papers* vol. III, September 25 to October 11, 1835. The calls were not one call:

| Settlement | What its people were asked | And what happened |
| --- | --- | --- |
| San Felipe, Washington (the Austin jurisdiction) | Turn out and march to Gonzales, "every citizen who is yet at home" (Oct 3, again Oct 8) | Companies marched from Sept 29; Washington "turning out" Oct 1 |
| The Colorado (Moore's, La Grange) | Muster at once | "mustering as fast as they can" Sept 29; its men were at Gonzales for the fight |
| Matagorda, Caney, Bay Prairie | Volunteers to gather at James Kerr's on the Lavaca | The town "too few, to enable us to spare many"; its powder held for Austin |
| Columbia, Brazoria, the lower Brazos | Gather at Kerr's | Turned back by news from Matagorda; by Oct 6 afraid of a landing and a slave rising, unarmed, asking whether any more should go |
| Harrisburg | Come on to San Felipe, then Gonzales; each man to judge for himself | Expected "on by to-morrow or next day" (Oct 3) |
| Nacogdoches, San Augustine | Join the army; money for guns | 2,100 dollars subscribed; about seventy to a hundred rode Oct 10 |
| Gonzales | Neighbours to come; bring powder and lead; provisions found there | Eighteen men Sept 29, a hundred and fifty Sept 30, about three hundred by Oct 4 |
| Liberty, the Trinity | An express sent Oct 3–4 | No answer in these letters (Briscoe's company, `HIST-TEX-013`, is the later record) |
| Mina (Bastrop), Victoria | No call from Victoria in these letters; Mina not mentioned | J. Antonio Padilla joined Collinsworth's company at Victoria, which took Goliad the night of Oct 9 (pp. 164, 169) |

What this means for the build (proposed, not decided): a distant family's call names its settlement's own place and ask —
march to Gonzales from the Austin and Colorado settlements; gather at Kerr's on the Lavaca from Matagorda and the Brazos
coast, where staying to guard the coast is an honourable answer the letters themselves give; ride with the eastern
companies from Nacogdoches; and everywhere the same shortage, "more men than guns", so powder and a rifle are part of
what a family sends. Liberty and Mina have no documented call in these letters and would get the general circular.

### 5.5 After October 2: the gathering and the march

- **Milestones** on the timeline, each from a claim (`HIST-TEX-007`): volunteers gathering at Gonzales (October 3–11);
  Goliad taken (October 9–10); the army organised and Austin elected (October 11); the march for Béxar (October 13, `HIST-TEX-018`);
  Concepción (October 28); the Grass Fight (November 26); the assault and Cos's surrender (December 5–9).
- **Sending a volunteer.** A family may send a parent or a child of 16 or over (`docs/FAMILY_CREATION.md` §5) to join.
  They travel the roads to Gonzales like anybody; one who arrives before the march joins the army there, one who arrives
  after follows it toward Béxar. Liberty's volunteers had their own company (Briscoe's, `HIST-TEX-013`), so a Liberty
  volunteer joins that company on the road rather than a rendezvous at Gonzales.
- **The army is aggregate.** It moves as one representative formation along the road to Béxar, like the Gonzales
  formations (`FIC-GONZ-006`); a family's volunteer is an individual inside it and can be called home.
- **Taking part and glory.** Being with the army at a milestone is `present`; being with it in a battle (Goliad,
  Concepción, the Grass Fight, the assault on Béxar) is `fought`, weighted by distance from home (`FIC-GONZ-023`), with
  the owner's rule for a woman sent to fight (`docs/MONEY_AND_GLORY.md` §4). Death is possible in those battles, decided
  by hidden strength and health (`docs/FAMILY_CREATION.md` §5), reported with dignity and never shown.
- **What those battles cost** is researched before the battle is built: HISTORY.md excludes casualty counts it has not
  sourced, and no battle kills more of a class's people than its documented losses make plausible.
- **Money.** Every day away is a day not farming, as `docs/MONEY_AND_GLORY.md` requires.

### 5.6 Old saves

A class saved before this keeps its invented map, its Gonzales party and its timeline ending on October 2. A world
records which kind it is (`map.terrain`, `director.colonies`); nothing in an old save is moved, and no save version
changes.

---

### 5.7 A fifty-minute class, and time that does not feel compressed

**The budget** (owner, 2026-09-14), at the classroom pace:

| Real minutes | 1835 | What happens |
| --- | --- | --- |
| 0–10 | dawn Sept 28 to the morning of Sept 29 | **Straight farming**: arrival, the house, the wagon unloaded, the field (`docs/SETTLING_IN.md`). No news. |
| 10–22 | Sept 29 to Oct 3 | The cannon, the call for help, the fight at Gonzales, the news spreading by riders. |
| 22–32 | Oct 3 to Oct 12 | The gathering, Goliad, the march for Béxar. |
| 32–50 | Oct 13 to Dec 9 | Concepción, the Grass Fight, the taking of Béxar; the ending. |

Proposed splits after the first ten minutes are `FIC-GONZ-027` and tuned by playing.

**Two clocks.** The simulation already steps in ticks, and everything a student *does* is measured in ticks: a spell of
work, a walk, a ride, a conversation. **That stays exactly as it is, in every phase** — a man takes as many real seconds to
split rails in November as in September, and a rider crosses the map at the same real speed. What changes between
phases is **the calendar**: how many minutes of 1835 one tick stands for. In the farming phase it is today's twenty; in
the long weeks before Béxar it is many hours. So nothing a student watches speeds up or skips; the date simply moves
further while they work. **That is how the time is compressed without feeling compressed.**

Consequences the build must handle:
- **History is dated on the calendar, play is timed in ticks.** Milestones, the relay delays of §5.4 and the arrival
  checks against `HIST-TEX-006` are set in calendar minutes and converted by the phase's scale.
- **Things that belong to days scale with the calendar**: food eaten per day, spoilage, crops ripening, a wound mending,
  a volunteer's absence from the farm (`docs/MONEY_AND_GLORY.md`). Things that belong to effort do not: work spells,
  walking, fatigue from miles.
- **No "time passed" message in normal play.** The date on the screen is how a student learns weeks went by; the old
  `time-compression` event (`sim/time.mjs`) stays for its existing uses and is not shown as a jump.
- **The scale never changes in the middle of something a student is watching**: it steps at phase boundaries, which
  are moments of news.
- The Host can still end at any milestone; the ending counts what happened by then.

### 5.8 Playing alone

A student who stays after a tutorial plays **a normal class by themselves**: the world is made for five or more families
as always, the student's family is dealt its seat (Gonzales first, then Liberty, then by population, so a lone student is
near Gonzales), and the other families exist unplayed, as they already do when fewer students join than the class holds.
Polish, not a new mode:
- **Start** with one student joined begins without the "built for five or more" warning when the Host has chosen
  *Play alone* (a Host option), instead of needing *Start anyway*.
- **The tutorial flows straight into play.**
- **Nothing expects a neighbour.** Help, trade and the house-raising are offered only when another *played* family is near;
  nobody is asked to wait for one.
- `VISION.md` says "There is no normal solo mode" and gives a range of 5–30. This amends it narrowly: the class is still a
  class of five or more; one student may play it alone. Recorded in `VISION.md` when built.

### 5.9 Automatic neighbours

Every family nobody is playing is run by **a neighbour director** (`sim/neighbours.mjs`), in every class, so a class of
thirty with twelve students and a student playing alone are the same game.

**How it acts — the rules that keep it honest:**
- **Through the same actions a student sends.** It calls `applyAction` for its own household and is refused exactly as a
  student would be. It has no powers a family lacks, and it never edits the world directly.
- **On what that family knows.** It reads only its own household and its own knowledge projection — the server-filtered
  view a student would get — never the truth, another family's stores, or any hidden stat of its own.
- **Never glory.** It does not read `world.glory` or anything derived from it (`VISION.md` §11, as for every director).
- **Deterministic.** Its choices come from the seed and the world, so a class replays the same; any chance it takes is
  one a student would see stated on the same control (`FIC-GONZ-008`).
- **It cannot change a documented outcome**, any more than a student can.
- **It yields to a student.** A family a student joins mid-lobby stops being automatic at once, and one whose student
  leaves does not take over until the Host says so (a teacher may be waiting for that student to rejoin).

**What it does** (every number `FIC-GONZ-028`):
- **Farms and builds.** Picks a house its load can build (preferring what the tools allow), sets its people to build it,
  plants, harvests, mends and hunts on a simple household routine, and keeps enough food.
- **Trades fairly.** Answers a face-to-face offer from what it has and needs: accepts when it gives no more than it gets
  by a stated rule of fair value, refuses otherwise, and says why in the family's own words (*"We can't spare seed before
  planting."*). Now and then it offers a trade of its own to somebody standing with it when it is short.
- **Helps and is helped.** Its house goes up like anybody's, so a student can help raise its walls; and when a nearby
  played family's walls are going up, it sometimes sends somebody unasked. Both are recorded in both stories, as now.
- **Answers the war.** Takes the calls its settlement gets (§5.4) in about the proportions families did: most stay home,
  some carry supplies, a few send a man to the army. The proportions are `FIC-GONZ-028` until a source gives them; the
  letters show hundreds turning out from colonies of thousands (`HIST-TEX-006`, `HIST-TEX-007`). It never sends a woman
  to fight.

**What it is not:**
- **Never ranked.** Its money and glory are counted like anybody's, but it is left out of the winner and every ranking
  (`docs/MONEY_AND_GLORY.md` §5 is amended when built). The ending names it only in the story of what happened.
- **Not a rival.** It does not compete for scarce things on purpose, race students to the store, or hoard.
- **Not a crowd.** It runs on the tick like everything else and must keep the per-tick payload and step time inside their
  existing budgets at thirty families.

**Playing alone** (§5.8) now means a world of fifteen families by default, so a lone student near Gonzales has neighbours
of the same settlement (fifteen seats two at Gonzales) to trade with and help.

## 6. Build order

Each step ends with tests that failed first, a browser proof where it touches what a student sees, docs and claims.

1. ~~**Places and roads on the real map.**~~ **Done 2026-09-14** (§6a). Settlement sites, Gonzales's ford and camp on the real Guadalupe, the road graph
   routed over terrain, crossings. Map drawing of the real rivers, relief and roads. No families yet.
2. ~~**Families dealt to the colonies.**~~ **Done 2026-09-14** (§6b). Dealing, anchors, grants, lanes, arrival at each family's own land, neighbours by
   settlement. New classes use it; old saves untouched.
2a. ~~**Automatic neighbours: farming, building, trading and house-raisings**~~ **Done 2026-09-14** (§6c) (§5.9), so every class after step 2 has living
   neighbours. Their answer to the war comes with steps 4 and 5.
3. ~~**Movement by ground and the house site**~~ **Done 2026-09-14** (§6d) (`docs/LAND_GRANTS.md` §8.3 steps 3–4).
4. **News by riders over real distance**, calibrated to `HIST-TEX-006`, and the settlement-specific calls. **Part 1, the expresses, done 2026-09-14** (§6e); **part 2, the settlement calls, done 2026-09-14** (§6f); **part 3, the two clocks, done 2026-09-15** (§6g).
5. ~~**The gathering and the march**~~ **Done 2026-09-15** (§6h). Volunteers, joining, the army as one formation, sending for somebody, and the departure - on the **13th**, which is what the order book and the Telegraph say (`HIST-TEX-018`).
6. **Beyond** (Concepción, the Grass Fight, Béxar), each battle researched first; the glory rule for women built with
   the first `fought`. **Concepción done 2026-09-16** (§6i); **the siege and the Grass Fight done 2026-09-16** (§6k); **the storming of Béxar done 2026-09-16** (§6l). Build step 6 is complete.
6a. ~~**The two clocks** (§5.7) come in with step 4~~ **Done 2026-09-15** (§6g). **Playing alone** (§5.8) can still be built
   at any point.
7. Then `docs/LAND_GRANTS.md` §4–5: Survey and clearing.

---

### 6a. As built: step 1

- **`scripts/build-colonies-map.mjs`** (about 8 seconds) writes `public/terrain/colonies-map.json.gz`: 23 places, 26 roads and 418
  watercourses joined from their reaches. Roads are A* over the eighth-of-a-mile grid, costed by slope, slowed by lesser
  water, and barred from the Guadalupe, Colorado, Brazos, Trinity and San Antonio except at their crossings. The build had to
  learn four things about the data, each now handled and commented: a river's line breaks at a modern dam (loose ends within a
  mile are joined), a river entering from beyond the map starts just inside its edge (carried to the edge), bays are in the
  elevation at sea level (under 30 cm is water for roads, under a metre for telling the banks apart, and cleared round a
  coastal town), and the Colorado at Matagorda is two channels (crossings open 0.6 miles).
- **Measured:** Gonzales to Béxar 68.7 road miles; Gonzales to the Colorado crossing 49.8, and on to San Felipe 50.5; the camp
  7.1 river miles above the ford, on Béxar's side; the confluence 1.3 miles from the town.
- **`sim/colonies-region.mjs`** makes a world's map from it with `createWorld(seed, n, { map: 'colonies' })` (server: `MAP=colonies`):
  the places and roads, the rivers and longer creeks of the home country with their timber, relief from the real grid, and —
  for now — families along the real Guadalupe and San Marcos near Gonzales, each on a straight track to the nearest road it can
  reach without crossing a big river. `map.source` marks such a world; worlds without the option are the invented map,
  unchanged, and remain the default until step 2.
- **Drawing:** on the real map rivers are drawn near their true width, since at the invented map's width the real meanders ran
  together like a flood.
- `ceiling:` the saved map is about 360 KB (the invented one is 58 KB); creeks under three miles are left off it. The
  province drawn when zoomed out is still the invented one. Families are not yet dealt across the colonies.

### 6b. As built: step 2

- **Owner decisions made while building it (2026-09-14):** a store at every settlement families live near; and new classes keep the
  Gonzales map by default until step 5, when the news and the war calls fit families wherever they live, so no class plays a
  half-built war.
- **Dealing** is `dealCounts` in `sim/colonies-map.mjs` and matches §5.1's table; which family goes where is shuffled by the seed.
- **Land** (`sim/colonies-region.mjs`): 2–12 miles from the settlement, within half a mile of a named watercourse, off the big
  rivers, level enough, clear of every town, league-sized elbow room first, and **within 30 road miles of its own settlement** —
  added after a Liberty family was given land across the Trinity whose nearest road took it 228 miles to Liberty. Over 60 worlds
  of 5–30 families the longest way to a family's own town is 26 road miles.
- **Its settlement** is `household.settlementId` (and `settlementId` on the homestead site). Town errands go there (`townOf` in
  `sim/chores.mjs`), and their names and words now say "in town"; the arrival says *"turned off the road near Liberty"*.
  Neighbours are the nearest homesteads in the "Go to" list, which puts a family's own settlement first.
- **Stores** (`sim/town.mjs` `STOREKEEPERS`): one invented storekeeper at every other settlement with families, purse two reales a
  family near it; Gonzales's store purse is likewise for its own families on this map.
- **Timber**: two stands six river miles up and down the settlement's own river from every start; a stand set down across a meander
  is moved to where the way to it ends (a track to Liberty's lower timber waded the Trinity until then), and simplifying a routed
  road never cuts across a river.
- `ceiling:` the saved map is 280–370 KB: creeks under five miles and creeks' timber are left off it. The relief of a class spread
  across the colonies is sampled coarsely. The Gonzales calls and the news still assume Gonzales (step 5).

### 6c. As built: step 3

- **`sim/neighbours.mjs`**, called at the end of every tick: each unplayed family thinks every third tick (staggered), from its own
  student projection, through `applyAction`. It chooses a house its tools allow (hewn log, round log, jacal), then builds, harvests,
  plants, mends, fences, fetches seed when there is none to plant and sells cotton; it hunts only when short of food and only
  with powder; one person at a time on each one-person errand. It answers hunts' questions, and weighs every offer made to it:
  fair ones taken, unfair ones and ones it cannot spare refused **with a reason in both families' stories** (`decline-offer` now
  carries one). About 1 ms a tick for a class of fifteen.
- **Whose family:** `household.played` is set when a student joins; the director never touches that family again.
  `world.neighbours` is set on every new class the server makes (the Gonzales map too), and absent on every class and save made
  before, which keep their unplayed families idle.
- **Found while building:** a family short of food sent all four people to the timber with no powder, came home with nothing,
  and never built; and a live class sent a whole family to town for seed. Both are capped and tested.
- `ceiling:` not yet built from §5.9 — a neighbour coming **unasked** to help a student's raising (it cannot know the walls are
  going up without somebody seeing them; that waits for the news of step 5), a neighbour **making** offers of its own, a Host
  control to hand a student's abandoned family to the director, and answering the war (steps 5–6). Automatic families are not
  yet excluded from the ending's rankings because the ending is not built; `played` is what will exclude them.

### 6f. As built: step 4 part 2, each settlement's call (2026-09-14)

- **`sim/calls.mjs`.** When the express has brought the call for help to a family far from Gonzales, its settlement's own
  call is put to it once (`SETTLEMENT_CALLS`, the research in §5.4a, `HIST-TEX-014`): San Felipe's committee asks the men
  to turn out, "the District of Washington is already turning out"; up the Colorado the settlements are mustering (Mina);
  Matagorda and Columbia are to gather at James Kerr's on the Lavaca; the Trinity (Liberty) and Victoria have the general
  word. The wording is `FIC-GONZ-031`.
- **Two answers, each with its price on the control**, put to any parent or child of sixteen or over: *Go* - the family's
  rifle and up to two powder go with them, and they are away until called home - or *Stay home*, which on the coast is
  *Stay and keep the coast*, the answer the letters from Columbia themselves raise. Going rides (or walks, or drives) the
  quickest way to the gathering place (`sim/ways.mjs`), and on arriving the family's story says where they are, in words:
  *"Jethro reached Victoria, on the road the volunteers from Matagorda and the Lavaca are gathering on."* They wait there
  (task `help`, commitment `volunteer`) for step 5's gathering and march. A call nobody answered closes when the class
  ends, and says so.
- **Neighbours answer as the settlements did** (`FIC-GONZ-028`): on the coast they stay; inland, a family with a second
  person who can answer sends one of its men and keeps the rest home; no die. A volunteer they send is not called home by
  their own routine.
- **Measured** (15 and 30 families, real map): San Felipe and Columbia families are asked about 1 am on October 2; a
  Columbia man who went rode the eighty-odd miles to Victoria in about sixteen hours. In a class of thirty neighbours every
  coast family stayed and eleven inland families sent a man, all of whom arrived.
- `ceiling:` James Kerr's on the Lavaca is not a place on the real map, so the coast's volunteers ride for Victoria, where
  the Matagorda and Lavaca companies went (pp. 164, 169, 174); a documented Kerr's is the way out. `ceiling:` a volunteer
  from a near settlement can reach Gonzales before the fight and is not offered the upriver march, which remains the
  Gonzales families' own; step 5 decides what a volunteer at Gonzales does. `ceiling:` one call a family, at the first
  word; the circulars of October 3 and 8 do not ask again.
- **Speed, found on the way.** A real-map class of thirty neighbours took some 290 ms a tick, nearly all of it rebuilding the
  land's water index (`sim/ground.mjs` `landAround`) for a fresh box on every line across country and every point. The
  index is now built once per sixteen-mile block and shared: the same class takes about 24 ms a tick.
- **Old saves:** no `calls`, and nothing changes until a far family's word arrives. No save version moved. Tests:
  `tests/calls.test.mjs` (6); fifteen injected regressions, all caught.

### 6e. As built: step 4 part 1, the expresses (2026-09-14)

- **`sim/expresses.mjs`.** On the real map, when the letters say word left Gonzales — the call for help at 8 am on September 30,
  the fight at 2 pm on October 2 (`EXPRESS_LEAVES`; the dates from the letters, the hours invented) — an express rider sets out
  on each road towards the settlements the class's families live near, stopping at every settlement and crossing on the way
  (`expressRoutes`, laid once). At each stop the word waits **six hours** (`RELAY_MINUTES`: read, copied, a fresh rider found),
  then goes on by a fresh rider on each road onward and out to the families of that settlement by the ordinary in-person
  riders, who carry the express riders in their ancestry: *"I've come from San Felipe de Austin, and I did not see any of this
  myself. Silas Roe put it in my hands there, and had it from another rider before that, out of Gonzales."* A family of
  Gonzales is told as before, by riders straight out of the town. The invented Gonzales map has no other settlements and is
  untouched.
- **Calibrated, and tested against the letters** (`tests/news.test.mjs`, `HIST-TEX-006`): the call for help reaches the
  Colorado crossing at La Grange (Moore's) at 2:40 pm on September 30 and San Felipe at 3:20 am on October 1 (the letters: by
  October 1); the fight reaches San Felipe at 9:20 am on October 3 (the letters: October 2–3); Liberty hears after San Felipe,
  the call early on October 2 and the fight on October 4. A family hears a few hours after its settlement reads the express.
  Moore's had the news on September 28, before this game's own story at Gonzales begins on the 29th (`HIST-GONZ-002`), so the
  Colorado is a day and a half late; nothing earlier than the story can be sent.
- **A distant family is asked none of the Gonzales calls** — no neighbour carrying food to Gonzales, no rumor to ride in and
  check — until part 2 gives it its own settlement's call. `ceiling:` it only hears.
- **The class runs on** past the Gonzales finish until the furthest family has heard how the fight ended, three days at most
  (`EXPRESS_GRACE_MINUTES`): a class of fifteen or thirty on the real map now ends about 6 pm on October 4, some 470 ticks.
  `ceiling:` until the two clocks compress the days after the fight (§5.7), that is longer than a lesson.
- **Browser-checked on the same computer** (MAP=colonies, SEED=news-proof-2, 250 ms ticks): a San Felipe family's child met
  Willa Hines on October 1 with the call, told second-hand out of Gonzales by way of San Felipe, and on October 3 Tobias Crow
  with the fight, "had it from Concepción Mora at San Felipe de Austin".
- **Old saves:** no `expresses` and no rider carrying one; a real-map class saved before opens and plays as it did until its
  letters leave. No save version moved. Thirteen injected regressions, all caught (one drill first written as a no-op, replaced).

### 6d. As built: the going and the house site

- **The going** (`sim/ground.mjs`): every lane, timber track and the bank upriver carries what lies along each stretch — rise,
  share in timber, share in brush, creeks and lesser rivers crossed — read from the real heights and the USGS streams. A journey
  over it takes longer by Tobler's hiking function for the slope (a wagon never quicker downhill and feeling a climb twice over),
  by timber and brush, and by each crossing, differently on foot, on the horse and with the wagon. **The roads carry none** and
  are the easy going. Lanes are laid by a wagon's-going search over an eighth-of-a-mile grid and never cross a big river.
- **The house site** (`sim/homesite.mjs`): the wagon comes in to the surveyor's mark and the family chooses where the house
  stands anywhere on its holding, told the ground, the height above the nearest water, how far to water that runs all year,
  how far to timber, whether it is river bottom that floods, and how long the lane will be. The house, the field, fencing and
  clearing wait for it. Choosing lays the lane from the road, moves the home and field, and brings the wagon over; anybody on
  the way home walks on to the new site. **Riders and neighbours come up that lane like any other route**, so a house set back
  hears later with no rule about news at all.
- **Water:** further than a quarter mile from water that runs all year, the heavy work at home goes slower — up to half as long
  again — until the family digs a well, whose length grows with the height above the water.
- **Measured** at the surveyor's marks of 120 families in four classes of thirty: 27 in 100 already within carrying distance of
  running water, half within 0.4 miles, one in ten with none within three miles (Liberty's families most often), and 28 in 100 on
  river bottom — so the choice has two sides. A class of thirty is made in about a second and a half; a class of fifteen nobody
  plays chose every site and built every house within 360 ticks, the slowest tick 142 ms, when the sites were chosen.
- **Owner raised while this was built (2026-09-14):** children had real work on a farm, and this game gives them almost none.
  Not built; to be researched and brought back as questions (`docs/FAMILY_CREATION.md` §3 holds the current rule).
- **Owner decisions the same day** (`docs/LAND_GRANTS.md` §8.5): figures drawn at a sixth of their old size so the land reads at its
  size, the stock rule kept, and **the lane cut by the family as work** — built: the yard drawn a few rods across, the field
  forty acres, `cut-lane` from the house outward.
- `ceiling:` the roads carry no going; a site's facts are asked of the server one place at a time, and laying a long lane takes
  a tenth of a second or so on the server's thread; creeks are counted as crossed by name, so one creek wandering across a
  stretch twice is one crossing; USGS's perennial streams describe the present, not 1835; no flood happens yet.

### 6g. As built: step 4 part 3, the two clocks (2026-09-15)

`sim/clock.mjs`. A tick still holds twenty minutes of anybody's effort. What changes with the phase is the date it
carries: **twenty minutes while the class farms, an hour through the news, four hours for the gathering, half a day for
the campaign** — 72, 24, 6 and 2 ticks to the day, so a day never ends inside a tick. The last two are declared and come
into use with build steps 5 and 6. Only a class on the real land reads them (`world.map.source`); the invented Gonzales
country, and so every class saved before this, keeps the single twenty-minute clock, and **no save version moved**
because nothing is stored — the scale is computed at the top of each tick.

**What it cost, measured** ([record](evidence/two-clocks.json)): the same thirty-family class reaches the fight at tick
288 and ends at tick 464 without the two clocks — 73 minutes at the Study pace, so the Gonzales slice alone outruns the
lesson. With them it reaches the fight at tick 168 and ends at 236, and the rest of the fifty minutes is left for steps
5 and 6.

**Three kinds of time, not two.** §5.7 names effort and days. Building it found a third:

- **Days follow the calendar**: what a family eats, what spoils, what a wound needs, what sitting still mends — and
  **how far the ground goes past**, which is the owner decision of 2026-09-15. Miles an hour of 1835 is a fact about the
  land and the horse, not about the lesson, so a tick carrying an hour carries three miles of road with it. That is what
  keeps the letters inside the dates `HIST-TEX-006` gives them, keeps a volunteer able to reach a gathering history has
  dated, and keeps the march to Béxar a fortnight rather than something the game has to fake. The alternative was
  measured and rejected: a nineteen-mile walk would have taken nine and a half days of 1835 in the campaign phase.
- **Effort stays in ticks**: a spell of work, a chore step, a felled tree. Work per calendar day therefore falls in a
  compressed phase, which is the point — a student is farming while weeks go by.
- **Attention stays in ticks too, and this was the defect.** `PATIENCE_MINUTES`, `PASSING_MINUTES`, `SPEAKING_MINUTES`
  and `SIGHT_MILES` are numbers about a student noticing a prompt, reading five lines, and watching somebody come up the
  road. They were held in minutes of 1835, so a faster calendar quietly cut each to a third. They now stretch with it
  (`stretch` and `attention` in `sim/encounters.mjs`), and a rider still waits about sixty ticks and is still seen about
  two ticks off in every phase.

**The calendar holds for a dated question.** History fixes both ends of the night of October 1 — the force crosses in
the dark and marches at dawn — and everything between is a family deciding whether its man goes upriver. Eight hours is
twenty-four ticks while farming and eight at an hour a tick, and eight is not long enough to read the prompt. So the
calendar steps back into that window and picks the faster scale up again at the approach, which is §5.7's own rule kept
rather than broken: the scale steps at moments of news, never in the middle of something a student is watching.

**No browser proof, deliberately**: nothing a student sees is new. The date on the screen, the riders and every control
are the ones already shipped and proved; the payload and the projection are untouched.

`ceiling:` the scale is read once at the top of a tick, so a boundary inside a tick takes effect on the next one. One
decision window is named in the clock; when steps 5 and 6 bring their own, this wants to be a question the director
answers rather than a list of milestones. The four scales are `FIC-GONZ-027`, tuned by measurement and not yet by a
taught lesson. A courier's first tick never carries him past halfway in a stretched phase, so a leg shorter than a tick
still has a tick of road to be watched on — one tick of approach where an ordinary ride gives two.

### 6h. As built: step 5, the gathering and the march (2026-09-15)

`sim/army.mjs`, with the milestones in `sim/directors.mjs` and the town's own call in `sim/calls.mjs`.
[Evidence](evidence/gathering-and-march.json); [what a student sees](evidence/army-browser.json).

**A class on the real land no longer stops when the fight is over.** After the outcome it goes on: the gathering
opens on October 3, Goliad falls in the night of the 9th–10th, the army is made on the afternoon of the **11th** and
marches for Béxar on the **13th**, and the slice preserves on the 17th with the column on the road. A measured
thirty-family class mustered **19 volunteers** and had them 40 of the 69 road miles out when it ended, at 262 ticks —
about 41 minutes at the Study pace. The invented Gonzales country still ends at the old finish, and no save version moved.

- **Who is asked.** Far families keep the settlement calls of §6f. Gonzales's own families are asked for the first
  time, in the town's own words, once the gathering has opened — not on an express, because the gathering is
  happening around them. One call each, as before.
- **The army is one body.** It forms out of everybody standing at the rendezvous under an active promise to serve.
  Being *near* it is not joining it and being still on the road is not either; both are guarded and both are tested.
  Somebody who arrives late, or catches the column, falls in where they are. The people in it are carried along
  rather than each walking their own road, which is what keeps a thirty-family class inside its tick budget.
- **A volunteer is still a person.** Marching is a journey of the army's own — the world knows a person as at a place
  or between two — so the ranks hold real people on a real road, and a family can **send for** its own at any time.
  They leave the column, start home from the last place it passed, and the promise ends. It is asked twice on the page.
- **What it counts for.** Standing in the ranks the day the army was made is `present` in `world.participation`,
  awarded sealed through `sim/glory.mjs` and never projected while the class runs.
- **The dates are `HIST-TEX-018`**, researched for this and stating its disagreements rather than resolving them —
  including that the march date in the older `HIST-TEX-007` rests on the weakest of three sources. The march pace,
  the October 3 opening and the shape of the muster are `FIC-GONZ-034`.

`ceiling:` what happens at Béxar is step 6. A man who leaves the column starts from the last place it passed rather
than the spot on the road. Goliad is told to the whole country on the day, because no express rides there on this map.
Liberty's volunteers gather at Gonzales like everybody else's — their own company is not built, and is not documented
for October either. No strength or casualty figure is asserted: the army is as many as the class actually sent.

### 6i. As built: step 6, Concepción (2026-09-16)

`sim/army.mjs` (the campaign road, `openDetachment`/`answerDetachment`/`closeDetachment`, `fightConcepcion`, `frailty`), the
milestones in `sim/directors.mjs`; decided in §7a, researched in [battle-research/concepcion.md](battle-research/concepcion.md).
Claims `HIST-TEX-019` to `-024`, `FIC-GONZ-039`. Tests `tests/concepcion.test.mjs` (seven; eighteen injected regressions each
caught when built, and the casualty tests re-proven for the correction of §7d); browser proof `npm run test:concepcion` ([record](evidence/concepcion-browser.json)).

- **The halts.** The army marches at fourteen miles a marching day and is held: at the Cibolo (40 road miles) until the
  19th, at the Salado five miles short of Béxar until the 26th, at Mission Espada until the fight. Its road leaves the
  Béxar road at the Salado and runs south to Espada and back north to Concepción; it never enters the town. A family is
  told the camp by name. An army formed before this is given the campaign road the first time it moves, keeping its miles.
- **The question, October 22.** Every family with somebody in the ranks is asked, on that person's card, whether they
  go ahead with Bowie and Fannin's division or stay with the main army; nothing on it says what either risks. A volunteer
  who falls in while it is open is asked too; one sent for is no longer asked; nobody answering by the 26th stays with the
  main army. A family nobody plays sends its volunteer about 23 times in 100.
- **The fight, October 28.** Whoever went fought; everybody else was present, and is told they came up an hour after.
  Each fighter is rolled once from the seed (`rollFates`): killed at 1 in 100 and wounded at 2 in 100 (the record's 1.1%
  and 0–2.2%, rounded), each weighted from about 0.4 (strong and hale) to 1.6 (weak and frail) times, and **with no limit
  on how many a class loses** (owner's correction, §7d; this replaced "never more than one killed in a class").
  The killed are told to their family with dignity and buried at Concepción; the wounded mend in three days. The country
  hears the outcome, Richard Andrews's death, and that the reports of Mexican losses do not agree.
- **Glory.** Fought is weight 3, present 2, times the road miles as always. A woman killed in the fight has her award
  taken away twice over, with the sentence *"In 1835, sending a woman to fight was held against a family"* marked as the
  game's own reading; a woman who comes through keeps hers. A family's glory below nothing counts as nothing at the end, so its final number is its coin (owner, 2026-09-16).
- **The end.** The class now stops on November 2, the day both councils of war voted not to storm Béxar. Measured on a
  thirty-family class with five played families: the campaign past October 17 adds about 41 ticks, some six and a half
  minutes at the Study pace.

`ceiling:` the detachment is not drawn apart from the main body; both are one formation until the fight.
`ceiling:` battle news is told to the country on the day rather than carried by rider, though it reached San Felipe in
three days and wrong about who was hurt (`HIST-TEX-024`). `ceiling:` the family of somebody killed is told at once.
`ceiling:` no horse is lost, though "a few horses" were. `ceiling:` a volunteer's card still shows the road and the
neighbour-visit controls while they are in the ranks, which predates this step.

### 6j. As built: the map corrected from the town research (2026-09-16)

The town research (`docs/town-research/`, fourteen towns) found five places standing on a later town and Liberty's roads
wrong; the owner approved one rebuild with every correction (`HIST-TEX-025`). Columbia moves to West Columbia (1.95 miles),
Goliad to the presidio (1.46), Velasco to the old river mouth (3.91), Harrisburg to its bayou front (about 2,400 ft) and
Refugio to its 1834 plaza (0.61). The Trinity is no longer crossed at Liberty but at **the Atascosito crossing** three
miles north, which the Atascosito road from Harrisburg now uses; **the Liberty-Nacogdoches road** runs north from the town;
and **Lynchburg** stands on a mail road Harrisburg - Lynchburg - Liberty. Brazoria already had its road (mail route
No. 4). 37 places and 42 roads. `ceiling:` Hunter's, the mail route's stop between San Felipe and Harrisburg, has no
position in anything read and is not placed; the mail road crosses the Trinity at the Atascosito crossing because its own
crossing is not known. Only a class made after the rebuild uses the new map; a saved class keeps the map it was dealt on.
One seeded test (`tests/felling.test.mjs`) needed a new seed because a family's land fell differently. **Also moved, the same
day, when the town was drawn:** Brazoria to Old Town, Market × Main on the bank, from the modern town a mile inland
(`HIST-TEX-046`).

### 6k. As built: step 6, the siege and the Grass Fight (2026-09-16)

Researched in [battle-research/grass-fight.md](battle-research/grass-fight.md) and decided by the owner by multiple choice
(§7b). The class no longer stops on November 2: it runs to the evening of December 4 (`HIST-TEX-026` to `-035`,
`FIC-GONZ-040`), about 78 more ticks when the questions are answered promptly.

- **The camps** (`moveCamp`, `SIEGE_CAMPS`): after the councils vote not to storm (Nov 2) the army goes to the camp above
  the town; back down to Mission Concepción on Nov 9; united at the old mill above Béxar on Nov 15, where it stays. Each move
  is a short road of the army's own, so a family's card names the camp. The army is never in the town.
- **Winter clothing** (`goForClothing`, `returnFromClothing`): on Nov 4 about a quarter of the volunteers of families nobody
  plays go home, promising to return; about half of them set out again ten to sixteen days later and fall in at the mill. A
  played family's volunteer is never sent.
- **Three questions, each on the volunteer's own card** (`ARMY_QUESTIONS`, action `army-answer`): Austin's storm order
  (Nov 21, closed on the 22nd when it is countermanded; a yes earns the family a `willing` award); the pledge (Nov 24,
  closed when Austin leaves on the 25th; a no sends the volunteer home, silence keeps them in camp without pledging); and,
  with the rumour of silver, whether they go out after the pack train (Nov 26). None says what an answer risks. Families
  nobody plays answer as the army did. While a played family has one open the calendar runs at an hour a tick, and a
  question stays open at least six hours of 1835.
- **The Grass Fight** (`fightGrass`): those who went out fought, the rest of the camp was present. Nobody is killed; about
  3 in 100 are slightly wounded (weighted by hidden strength and health); about 1 in 100 runs home, taken from the ranks,
  and the family's award for the fight goes the other way with a note labelled as the game's own reading.
- **The word** (`sendWord` in `sim/directors.mjs`, `tellGrassFight`): the silver rumour reaches every family's reports with
  the question; nothing is told on the day of the fight; on Dec 1 the wrong rumour ("three hundred a side, ten dead, no
  loss"); on Dec 3 the fuller word, with the Mexican losses as the range 3, 15, about 50 or 60, the silver set right, and
  each family's own person's part. `ceiling:` every family hears it on the same day, however far away.
- **Found and fixed on the way:** the news of Goliad and Concepción was recorded only as a public milestone, which reaches the
  Host's page and no student; it now goes to every family's reports too (`sendWord`).
- `ceiling:` the army is one body, so the week it was split (Burleson at the mill, Austin at Concepción) is the whole army at
  Concepción; the camp guard, Bowie's riders and Jack's infantry are not drawn apart; the mill's place is estimated.
- Tests: `tests/siege.test.mjs` (8, each proven by injection, 24 drills); browser: `npm run test:siege`
  ([evidence](evidence/siege-browser.json)).

### 6l. As built: step 6, the storming of Béxar (2026-09-16)

Researched in [battle-research/bexar-storming.md](battle-research/bexar-storming.md) and decided by the owner by multiple
choice (§7c). The class runs on past Milam's call to the evening of December 15 (`HIST-TEX-036` to `-045`, `FIC-GONZ-041`),
about 27 more ticks when the questions are answered promptly.

- **December 4, winter quarters** (question `winter`): families nobody plays send men home; a played family is asked on its
  volunteer's card whether they stay in camp or go home, and a no starts home on the horse they came with.
- **Milam's call** (`milam`), that afternoon: every volunteer still in camp is asked whether they go into San Antonio. On
  **December 8** (`reinforce`) everybody still at the camp is asked whether they go in with the companies Burleson sends.
  None of the questions says what an answer risks.
- **The fight** (`fightStorming`, at the white flag on December 9): those who went in fought, the camp was present (glory
  3 and 2, as before; going home earns nothing). Each who went in is rolled on their own (`rollFates`): 2 in 100 killed and 8 in
  100 wounded (the record's 1.7% and 7–9%, rounded), weighted by hidden strength and health; nobody at the camp is hurt;
  no limit on how many a class loses (owner's correction, §7d; this replaced "never more than one death").
- **Wounds in three grades** (`WOUND_GRADES`): slight mends in three days in the ranks; severe (three weeks) and dangerous
  (two months) take the person out of the ranks to lie at Béxar, unable to travel until they mend (condition `wounded`,
  `health.grade`). A dangerous wound can leave a lasting mark shown on the person's card (`marks`), and can kill on
  December 12 (`dieOfWounds`): about 15 in 100 dangerous wounds, each rolled on its own, whatever the fight already cost
  the class (§7d; it was once allowed only if the fight had killed nobody).
- **Dated milestones** on the Host's page: the assault, Milam killed on the 7th, Ugartechea on the 8th, the white flag, the
  terms at 2 a.m. on the 10th, the capitulation dated the 11th in its signed terms, Cos marching out on the 14th, when
  everybody still in the army starts home (`disbandArmy`).
- **The word** (`sendWord`, `tellStorming`): the wrong express reaches every family late on December 8 ("about daylight on
  the 6th", the town already taken); the victory on December 15, with the siege told as it was (the people of Béxar shut in
  their houses, a woman shot carrying water), Milam's death, the terms as signed, and the Mexican losses as "about a
  hundred and fifty, or about three hundred"; each family's own person's part with it.
- `ceiling:` the four days are resolved at once at the white flag; the divisions, houses and streets are not drawn apart.
  `ceiling:` every family hears on the same day; the coast's garbled "Cos has fled with 100 men" (December 17) is after the
  class ends and is not told. `ceiling:` the badly wounded lie at Béxar when the class ends and nobody carries them home.
- Tests: `tests/storming.test.mjs` (6, proven by 16 injections when built; the casualty tests re-proven for §7d); browser: `npm run test:storming`
  ([evidence](evidence/storming-browser.json)).

## 7. Questions for the owner — all answered 2026-09-14

1. **How long is a class?** About fifty minutes: ten of farming, then the war, compressed without feeling compressed (§5.7).
2. **Seat Liberty as well as Gonzales?** Yes.
3. **Victoria?** Left to the numbers.
4. **Playing alone** (raised by the owner): a normal world played by one student (§5.8).

### 7a. Concepción — answered 2026-09-16, before build step 6

Put to the owner as multiple choice after the research in [battle-research/concepcion.md](battle-research/concepcion.md).

| Question | Owner's answer |
| --- | --- |
| How deadly for a family's volunteer in the fight? (1 Texian killed of ~92) | **About 1% per fighter, weighted by hidden strength and health**, ~~and never more than one death in a class~~ — the cap was withdrawn by the owner the same day (§7d): each fighter is rolled on their own at the record's rate, with no limit. Amends `docs/FAMILY_CREATION.md` §5's "very likely fatal for somebody weak or frail" for this battle. |
| How does a volunteer come to be in Bowie and Fannin's detachment? | **The family is asked**, on October 22, whether their person goes with the detachment; the risk stays hidden. |
| Show the real halts (Cibolo Oct 16–19, Salado Oct 20–26, Espada Oct 27)? | **Yes**, dated from Austin's order book. |
| Can a Liberty volunteer be in the fight, when sources disagree on Briscoe's company? | **Yes, like anyone**; the disagreement is recorded, not enforced. |
| The glory penalty for sending a woman to fight, which no source read documents? | **Kept, and labelled as the game's own reading of the period**; the ending words it as the period's judgement. |
| Mexican losses (14, 16, 67 or 76 by source)? | **The range, with its sources**: families hear that the reports disagree. |
| Goliad as a battle a family member fought in? | **No — news only.** Nobody who went to Gonzales was there. |

### 7b. The siege and the Grass Fight — answered 2026-09-16, before building them

Put to the owner as multiple choice after the research in [battle-research/grass-fight.md](battle-research/grass-fight.md).

| Question | Owner's answer |
| --- | --- |
| How far should the class run? | **To December 4**, the eve of the storming, with Milam's call as the last event. |
| How deadly is the Grass Fight? (nobody killed of ~140–300; 2–4 slightly wounded; one ran home) | **Nobody killed**; about 3 in 100 slightly wounded, weighted by hidden strength and health. |
| Who fights on November 26? | **The family is asked** when Deaf Smith rides in, as on October 22. |
| Can a volunteer run home from the fight? | **Yes, rarely**, about 1 in 100 — **and their family should suffer negative glory for it.** |
| Where does the army camp after November 2? | **The real sequence**: above the town, headquarters at Concepción Nov 8–15, united at the mill from Nov 15. |
| Leaving and staying in November? | **Automatic neighbours' volunteers go home for winter clothing** at about the documented rate and some come back; **on November 24 every family with somebody in camp is asked whether they pledge to stay.** |
| How does a family hear of the Grass Fight? | **By rider, days later, and first as the wrong rumour**, then the fuller account. |
| Mexican losses (3, 15, 50 or 60 killed by source)? | **The range, with its sources**, as at Concepción. |
| The silver? | **Families hear the rumour of a silver train before the fight**, and the grass is the reveal. |
| Austin's storm order of November 21? | **The family's person is asked** — "since it'd be a family member off serving, only that family member is asked. If they say yes, their family receives extra glory." How much is this game's own: the weight of being present (`willing`: 2). |

### 7c. The storming of Béxar — answered 2026-09-16, before building it

Put to the owner as multiple choice after the research in [battle-research/bexar-storming.md](battle-research/bexar-storming.md).
Every answer was the research's leaning.

| Question | Owner's answer |
| --- | --- |
| How far should the class run? | **To December 14–15**: Cos marches out, the army goes home, the news reaches San Felipe on the 15th. |
| Who goes in with Milam? | **Each volunteer still in camp is asked on their own card**; families nobody plays say yes about a third to a half of the time. |
| December 4: can a volunteer go home? | **Families nobody plays send some home at about the documented rate; a played family is asked** before Milam's call. |
| How deadly? | **About 1.7 in 100 killed and 8 in 100 wounded for those who go in**, weighted by hidden strength and health, ~~never more than one killed in a class~~ (withdrawn, §7d: built as 2 and 8 in 100, each rolled on their own, no limit); **nobody in the reserve hurt**. |
| What does a serious wound do? | **Three grades**: slight three days; severe about three weeks at Béxar; dangerous about two months, with some chance of a lasting mark shown on the card. |
| Can a wounded person die afterwards? | **Yes, rarely**, ~~and it counts against the one-death cap~~ (withdrawn, §7d: each dangerous wound's later death is rolled on its own, no limit). |
| The reinforcement of December 8? | **Families with a volunteer in the reserve are asked**; a yes makes them fighters. |
| How does a family hear? | **By rider, as the record has it**: the wrong first report, then the victory with Milam's death about December 15, each family's own person's part with it. |
| Mexican losses? | **"About 150 to 300 killed and wounded"**, Ehrenberg's figure left out. |
| The surrender date? | **White flag December 9, terms at 2 a.m. December 10, the capitulation dated December 11.** |
| Civilians in Béxar? | **Told in text**; nothing shown wounded. |
| The capitulation's terms? | **As signed**: parole not to oppose the Constitution of 1824, muskets kept, convicts beyond the Rio Grande, soldiers free to stay. |
| Glory? | **Fought (3) for those who went in, present (2) for the reserve, nothing for going home on December 4.** |

### 7d. Casualties at the record's rates — the owner's correction, 2026-09-16

The owner, after §7a and §7c were built: *"I disagree with the never more than one killed per battle per class. There are
several battles where that would not make sense. Fall of the Alamo? What if classmates answered the call and they're there
for the Goliad Massacre? Keep it inline with % of casualties from the actual battle (within reason, you're allowed to
round)."*

**As built:** every battle rolls each fighter's fate on its own at the battle's documented share of killed and wounded,
weighted by hidden strength and health, through one rule (`rollFates` in `sim/army.mjs`), with no limit per fight or per
class. A crowd of classmates in a deadly fight can lose several; a battle nobody survived kills everybody in it.

| Battle | The record | Rates used |
| --- | --- | --- |
| Concepción | 1 killed of ~92 (1.1%); 0–2 wounded (0–2.2%) — [concepcion.md §6](battle-research/concepcion.md) | **1 in 100 killed, 2 in 100 wounded** |
| The Grass Fight | nobody killed; 2–4 slightly wounded — [grass-fight.md](battle-research/grass-fight.md) | nobody killed, 3 in 100 wounded (unchanged, §7b) |
| The storming of Béxar | ~5 killed and ~21 wounded of ~300 who went in (1.7%, 7–9%); the reserve unhurt — [bexar-storming.md §8](battle-research/bexar-storming.md) | **2 in 100 killed, 8 in 100 wounded**, the reserve unhurt |
| A dangerous wound at Béxar, later | about 3 of 23 wounds proved fatal (13%) | **about 15 in 100 dangerous wounds**, each rolled on its own |

This supersedes the cap in §6i, §6l, §7a and §7c, `FIC-GONZ-039` and `FIC-GONZ-041`, and the "at most one death" readings
in the battle research, which were proposals written before the owner decided. The Alamo and Goliad are not built; when
they are, their rates come from their own research the same way.
