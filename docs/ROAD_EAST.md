# The road east: what a family does besides run, and what runs behind it

**Status: owner-asked 2026-09-16, built 2026-09-17 in the owner's absence.** Amends `docs/COLONIES.md` §6p (the Runaway Scrape)
in what happens between leaving and arriving. `sim/road.mjs` (the chores, the questions, the weather, the pursuit; registered
into the chore table by `registerRoadChores`), `sim/scrape.mjs` (the flight's state, which the road writes its fields onto),
`sim/neighbours.mjs`, `sim/auto.mjs`, `sim/clock.mjs`, `sim/host.mjs`, `public/family-panel.js`, `public/app.js`.
Research: `HISTORY.md` `HIST-TEX-068` to `-074`; what is invented, `FIC-GONZ-049` to `-052`.

## 1. What the owner asked for

> "Players that are running during the Runaway Scrape, they need things to do besides just running. Wasn't it wet? Wagon
> could get stuck and they'd need to free it. Hunt for food while at camp? Various things. The Mexican army should be close
> enough that if players spend too much time in one place that they could be caught. Historically accurate consequences."
>
> — the owner, 2026-09-16

## 2. The design choices made in the owner's absence

Each row is **chosen by default; the owner may change it.** The grounding is what the record read on 2026-09-17 says
(`HISTORY.md` rows); the number is this game's.

| Choice | As built | Grounding |
| --- | --- | --- |
| Which days it rains | About half the days of the spring, decided by a share hashed from the class's seed and the day, so the whole class shares one sky (`rainyDay`, `RAIN_SHARE`). | "The weather that spring was unusually cold and wet"; the rivers "swollen and impassable" (`HIST-TEX-068`). The record has no calendar of the rain. |
| When a wagon bogs | A family moving with its wagon on a rain day bogs at one in two, rolled once a day (`BOG_SHARE`); a family on foot never does. | Harris's wagon and four carts fast in the mud on the prairie (`HIST-TEX-069`). |
| Freeing it: dig | Eight hours, everybody grown worn by eight miles' worth, the ox spent - half pace for a day, and a second dig-out in that day takes sixteen hours (`DIG_HOURS`, `DIG_MILES`, `OX_SPENT_HOURS`, `SPENT_PACE`). The family's default and its neighbours'. | "They had to be unloaded and pulled out"; all the oxen together could not move it (`HIST-TEX-069`). |
| Freeing it: wait | Nothing spent; the wagon comes free on the first dry day after. The pursuit does not wait. | Harris's party "had to stay there until morning" (`HIST-TEX-069`). |
| Freeing it: leave the wagon | The wagon and the ox stay in the mud (drawn there, `condition: lost`); the family carries 1.25 of the wagon's room per grown person, food first, and goes on on foot - faster than the wagon. Asked twice on the page. At a crossing it fords at once. | "We had to leave the sleigh" (`HIST-TEX-069`); walking is the game's faster pace (`sim/travel.mjs`). |
| Who answers, and when | The family's question, on its main person's card with a "!" (`needsOf` kind `road`), each answer with its price; twelve ticks of patience (`ROAD_PATIENCE_TICKS`) with the calendar held at the farming scale for a played family deciding, then answered as auto answers - the question's own fallback. A main person on auto or a family nobody is at the screen for is answered the next tick; a family nobody plays by its director through `applyAction`. | The shape every question here takes (`docs/FAMILY_PANEL.md` §11, `FIC-GONZ-048`). |
| The hunt from the camp | One grown hand goes out from wherever the family has halted, or from its refuge; the family halts while they are out (`halts`); the shot is asked as at home, decided by the same steadiness (`autoChoice`); one powder; six food for a hit, more for a good hand (`CAMP_HUNT_FOOD`). | The owner's "Hunt for food while at camp?"; the record has cold corn bread and beef and no hunting (`HIST-TEX-071`), so the yield is modest. |
| Food among the families | At a crossing wait or the refuge, a real buys two food (`CAMP_FOOD_PER_REAL`), against five in town. No skill bears on it. | Those on horseback "supplied with provisions by other campers"; "a scarcity of bread" (`HIST-TEX-071`). |
| Nursing the sick | A day's nursing halts the family; nobody sick dies while it lasts; each sick person is a day nearer mending when it is done (`tend-sick`). | Harris's mother nursed the sick child until she had to rest; a family that stopped at Liberty (`HIST-TEX-072`). |
| The pursuit's shape | **Owner, 2026-09-17: "Game's roads, same dates."** Each column a head marching along the map's roads between dated places, at whatever pace on each stretch brings it in on the record's date; across country only where the map's road would be more than 1.6 times the straight line (`ROAD_DETOUR`: Gonzales to the Colorado, which the map has no road for), and from the Columbia road to Thompson's ferry, which is no place on the map (`via`). The dated places: Santa Anna's Gonzales (March 24) → the Colorado (April 1) → San Felipe (April 7) → the Brazos below Richmond (April 12) → Harrisburg (April 15) → Lynchburg (April 20), ending at San Jacinto the afternoon of the 21st; Urrea's Refugio → Goliad → Victoria (March 21) → Matagorda (April 17) → Columbia (April 20) → Brazoria; Gaona's Mina (March 26) → San Felipe (April 12) (`columns`). The settlements' days are `SETTLEMENT_DAYS`; the rest is `ceiling:`. | `HIST-TEX-065`, `-066`, `-073` (Thompson's ferry April 12), `-067`. |
| The warning | A column within twenty miles (`WARNING_MILES`): written into the family's record, shown on the card ("Santa Anna's column is about 14 miles off, making for Harrisburg"), and put to the family once per column with the choice to **press on** (break camp; from a refuge, go on east to the next), **stay**, or **leave the wagon**. | The owner: "close enough that ... they could be caught"; the families at Lynch's ferry who fled the approaching army (`HIST-TEX-070`). |
| Being overtaken | **Owner, 2026-09-17: kept as it is, "but with a minus glory consequence", "Like a desertion."** A family halted, camped or at its refuge within five miles of a head (`OVERTAKEN_MILES`; a moving family within a mile and a half) is overtaken: the wagon, the ox, the horse and everything in the wagon taken; grown men taken prisoner at one in two by hashed share (`PRISONER_SHARE`); everybody else let go, on foot with nothing; coin kept; never twice by the same column; and the family loses glory as a desertion costs - twice what enlisting is worth, by the miles from home, once for each column (sealed, told only at the end). A played family is spotlit on the Host's page. **Nobody overtaken dies.** | The ferryman, the printers, the workmen and residents at New Washington, the boy who would not give up his horse, the looted warehouses and torn-up houses (`HIST-TEX-073`); no source read has a family killed on the road. |
| Where the Mexican army's own burnings show | Harrisburg and New Washington are burned by Santa Anna, San Felipe and Gonzales by the Texans. The game's burning of a family's farm stays the Texas army's, as the owner decided. | `HIST-TEX-074`. |

## 3. As built

- **The weather** (`rainyDay`, `weatherOf`): the family's card says *It is raining.*; the projection carries `flight.weather`.
- **The bog** (`advanceRoad`): on a rain day a family moving with its wagon may bog; everybody travelling with it is halted
  (`travel.halted`, recomputed every tick in `advanceFlight` from the river, the mud and the camp together); the question
  `bog` opens on `household.flight.ask` with `dig`, `wait`, `abandon`; the Host's row reads *bogged in the mud on the road
  east to San Felipe de Austin*. Dug out: `flight.oxSpentUntil`, every traveller's `travel.speed` at half the wagon's, the
  diggers' `exertion` up by `DIG_MILES` (so a tired hand misses the next shot); rested a day later. Left: the wagon and ox
  keep a halted `travel` with `purpose: 'lost'` and `condition: 'lost'` where they stood, the people walk (`mode: 'foot'`).
- **The camp**: a road chore with `halts` (`hunt-road`, `tend-sick`) halts the family through its `begin` hook and the
  family goes on the tick it ends; `trade-crossing` needs no halt (the family is already waiting). A road chore runs while
  its person's travel is halted (`advanceChore`), is offered only on the road (`choresFor`), and refuses in words through
  its own `refuse` hook (`roadChoreRefusal`: not on the road; the wagon in the mud; nobody sick; no families camped here).
- **The pursuit** (`columns`, `columnHead`, `pursuit`): the nearest head to the family's point each tick; `flight.danger`
  while one is within `WARNING_MILES` (its name, miles, and the place it makes for), the `danger` question once per column;
  `overtake` when in reach. `flight.overtaken`, `flight.overtakenBy`. A family that pressed on from its refuge sets out again
  by `moveOn` (`status: 'fled'`, the refuge it left counted as crossed).
- **Who decides**: `answerRoad` (action `road-answer`, `option`), `roadAutoAnswer` (the fallback, first open) used by
  `advanceAuto` for an absent family or a main person on auto, by `advanceRoad` after `ROAD_PATIENCE_TICKS`, and by the
  neighbours' director from the projection's own `fallback` through `applyAction`. The director also sends one grown hand
  to hunt from the camp when food is short and there is a shot in the house, nurses whoever is sick, and buys food with a
  real at a crossing - none of it while a column is near or the wagon is in the mud.
- **The calendar** holds at the farming scale only while a played family has a road question open (`deciding`), never
  for the road itself.
- **The page**: the flight card on the road (`renderFlight`) says where the family is, the weather, the mud, the camp and
  the danger, and lays out the open question's answers with their prices, disabled where the world would refuse them;
  leaving the wagon is asked twice. Three icons on the panel, drawn as glyphs until Astra's frames come (`stand-in:`).
- **The Host**: `whereWords` - *bogged in the mud on the road east to …*, *waiting to get over at …*, *camped on the road
  east to …: hunt from the camp*, *overtaken by the Mexican army on the road east to …*, *at Liberty, fled from home: nurse
  the sick*; `waitingOn` counts the road's question; the spotlight goes to a played family overtaken.
- **Stored** on `household.flight`: `bog` (`minute`, `day`, `freeing`/`waiting`), `bogDay`, `oxSpentUntil`, `ask` (`id`,
  `openedMinute`, `openedTick`), `danger`, `overtaken`, `overtakenBy`; on a beast, `condition` `lost` or `taken`. Every one
  is absent until it happens, validated by `roadInvalid`; no save version moved.

## 4. Proof

- `tests/road.test.mjs` (8): the bog, the hold, digging out and the spent ox; waiting and leaving the wagon; the hunt from
  the camp; the warning and pressing on; the overtaking and the spotlight; the director, auto and absence; nursing and the
  trade; the Host's words and a saved road refused. Ten injections (`docs/evidence/road-injections.json`), each failing its
  own test and only it, except the calendar's hold, which three tests guard.
- `npm run test:road` (`scripts/road-browser-proof.mjs`, same computer): the bog's "!" opening the card with three priced
  answers and digging out pressed; the hunt from the camp pressed on the panel and the family halted; the Host's rows in
  the road's words; the warning's "!" and *Go on east to Lynchburg* pressed; nothing sideways at 400 px.
- `npm run test:whole-game` and `npm run test:solo-game` rerun, since both play through the spring.

## 5. Ceilings

- `ceiling:` the columns march the map's roads (owner, 2026-09-17) but the dates between the settlements' days are placed,
  and the pace within a stretch is even; the record's day-by-day marches are the way out. Gonzales to the Colorado is
  across country because the map has no Gonzales-Beeson's road (`ROAD_DETOUR`); adding that road is the way out.
- `ceiling:` a column's reach is a circle, so a family a few miles off its road is as much in danger as one on it; the
  record has the ferry crossings taken and the roads' towns looted, not the country between.
- `ceiling:` Washington's `enemy` day in `SETTLEMENT_DAYS` (April 10) has no column here, and Lynchburg's crowd was on the
  east bank of the San Jacinto, which Santa Anna never crossed; both are the settlements' days as decided before this.
- `ceiling:` the rain is one sky for the whole class, uniform over the spring; the record's rains grew heavier from late
  March.
- `ceiling:` the death skipped while somebody nurses is not proved by injection - it is a roll at 2 in 100 a day and no
  seed was searched for a patient whose share would die that day.
- `ceiling:` coin is not taken by the army; a purse taken is the way out if the owner wants it.
