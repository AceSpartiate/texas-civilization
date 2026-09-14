# Families across the colonies

**Status: decided 2026-09-14; research and specification next; nothing built.** Read this before changing where
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
5. Whether the late-settler premise (`FIC-GONZ-024`) and the pending-title grants (`FIC-GONZ-025`) still hold for
   families in Austin's colony and elsewhere, whose land law and empresarios differed.

## 4. Build order (provisional)

1. Settlements, roads and crossings on the real map, with claims.
2. The real country in new classes: families dealt near settlements, grants, arrival at each family's own land
   (`docs/LAND_GRANTS.md` §8.3 step 2 becomes this).
3. Movement by ground and the house site (`docs/LAND_GRANTS.md` §8.3 steps 3–4).
4. News by riders over real distance.
5. The gathering after October 2.
