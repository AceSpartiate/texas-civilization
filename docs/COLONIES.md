# Families across the colonies

**Status: decided, researched and specified 2026-09-14 (§5); every owner question answered (§7); nothing built.** Read this before changing where
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
| Velasco | Velasco (1381075) | 28.96191, -95.36050 |  |
| Columbia | East Columbia (1356596) | 29.14136, -95.61578 | Columbia of 1835 is nearer East Columbia on the Brazos; West Columbia (1371096) is 29.1438582, -95.6452249 — which one stands for 1835 Columbia is to be checked |
| Matagorda | Matagorda (1362277) | 28.69082, -95.96746 |  |
| Harrisburg | Harrisburg (1337404) | 29.71828, -95.27966 | now within Houston |
| Anahuac | Anahuac (1329510) | 29.77300, -94.68270 |  |
| Liberty | Liberty (1339866) | 30.05799, -94.79548 |  |
| Nacogdoches | Nacogdoches (1363573) | 31.60351, -94.65549 |  |
| Victoria | Victoria (1370631) | 28.80527, -97.00360 |  |
| Goliad | Goliad (1358133) | 28.66833, -97.38833 | the presidio La Bahía stands across the San Antonio River from the present town |
| Refugio | Refugio (1345013) | 28.30528, -97.27527 |  |
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

### 5.5 After October 2: the gathering and the march

- **Milestones** on the timeline, each from a claim (`HIST-TEX-007`): volunteers gathering at Gonzales (October 3–11);
  Goliad taken (October 9–10); the army organised and Austin elected (October 11); the march for Béxar (October 11–12);
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

## 6. Build order

Each step ends with tests that failed first, a browser proof where it touches what a student sees, docs and claims.

1. **Places and roads on the real map.** Settlement sites, Gonzales's ford and camp on the real Guadalupe, the road graph
   routed over terrain, crossings. Map drawing of the real rivers, relief and roads. No families yet.
2. **Families dealt to the colonies.** Dealing, anchors, grants, lanes, arrival at each family's own land, neighbours by
   settlement. New classes use it; old saves untouched.
3. **Movement by ground and the house site** (`docs/LAND_GRANTS.md` §8.3 steps 3–4).
4. **News by riders over real distance**, calibrated to `HIST-TEX-006`, and the settlement-specific calls.
5. **The gathering and the march**, through the October 11–12 departure: volunteers, joining, the army formation.
6. **Beyond** (Concepción, the Grass Fight, Béxar), each battle researched first; the glory rule for women built with
   the first `fought`.
6a. **The two clocks** (§5.7) come in with step 4, the first phase whose calendar runs faster than farming, and **playing
   alone** (§5.8) can be built at any point.
7. Then `docs/LAND_GRANTS.md` §4–5: Survey and clearing.

---

## 7. Questions for the owner — all answered 2026-09-14

1. **How long is a class?** About fifty minutes: ten of farming, then the war, compressed without feeling compressed (§5.7).
2. **Seat Liberty as well as Gonzales?** Yes.
3. **Victoria?** Left to the numbers.
4. **Playing alone** (raised by the owner): a normal world played by one student (§5.8).
