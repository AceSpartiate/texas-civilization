# Families across the colonies

**Status: decided and researched 2026-09-14 (§3a); the detailed specification is next; nothing built.** Read this before changing where
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

1. Settlements, roads and crossings on the real map, with claims.
2. The real country in new classes: families dealt near settlements, grants, arrival at each family's own land
   (`docs/LAND_GRANTS.md` §8.3 step 2 becomes this).
3. Movement by ground and the house site (`docs/LAND_GRANTS.md` §8.3 steps 3–4).
4. News by riders over real distance.
5. The gathering after October 2.
