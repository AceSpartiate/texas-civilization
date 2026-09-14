# Families across the colonies

**Status: decided 2026-09-14; research under way (§3a); nothing built.** Read this before changing where
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
- **Settlement positions.** The USGS place-name service no longer answers queries; the gazetteer's downloadable
  national file would give every settlement's official coordinates. To be asked for.
- **Families per settlement** in 1835, for how many families the seed deals to each.
- **The premise outside DeWitt's colony** (research item 6): whether "late settlers with a grant marked out and title
  pending" holds in Austin's colony and the others, whose contracts and land offices differed (not yet researched).
- **Riders' pace** is already a game number; the dated chain above is what it should reproduce.

## 4. Build order (provisional)

1. Settlements, roads and crossings on the real map, with claims.
2. The real country in new classes: families dealt near settlements, grants, arrival at each family's own land
   (`docs/LAND_GRANTS.md` §8.3 step 2 becomes this).
3. Movement by ground and the house site (`docs/LAND_GRANTS.md` §8.3 steps 3–4).
4. News by riders over real distance.
5. The gathering after October 2.
