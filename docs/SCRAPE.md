# The Mexican advance, the burn zone, and the land dealt half inside it

**Status: owner-asked 2026-09-25, the land's rule chosen by the owner 2026-09-26, built 2026-09-26 (not released).** Amends
`docs/COLONIES.md` §6p and §7g (who burns a family's farm in the Runaway Scrape, and when), `docs/ROAD_EAST.md` §2 (the pursuit's
dated places, and "the game's burning of a family's farm stays the Texas army's"), `docs/COLONIES.md` §5.1 (how the land is
dealt) and `docs/STOCK.md` §5 (the herd left on the range). Research: [battle-research/mexican-advance.md](battle-research/mexican-advance.md);
claims `HIST-TEX-580` to `-599`, `FIC-GONZ-460` to `-469` (`HISTORY.md`).

Code: `sim/advance.mjs` (the columns, the burn zone, the foragers, the smoke), `sim/advance-word.mjs` (what a family learns and
how), `sim/scrape.mjs` (`burnByForagers`, `flee`, `advanceArmiesPassing`, `householdAsKnown`, the return), `sim/road.mjs` (the
pursuit reads the columns), `sim/armies.mjs` (the columns on the map, and who may see them), `sim/colonies-region.mjs` (the
land dealt half inside), `sim/military-pacing.mjs` (`columnWatched`), `sim/people.mjs` (the generals), `sim/stock.mjs`,
`sim/rumour-story.mjs`, `public/app.js` and `public/army-view.js` (the columns, the foragers and the smoke drawn).

---

## 1. What the owner asked for

> "we need to fully model the Mexican army as it pushes towards the Texian army during the runaway scrape. we'll need to ensure
> that 50% of player farms are in the zone that will see their farms burned."
>
> — the owner, 2026-09-25

Put by multiple choice on 2026-09-26, *how is the half guaranteed?* — the owner chose **"Place land at the start"**: when the
class is dealt its land, half the families are given grants inside the historical burn zone (the country the Mexican columns'
routes swept: Gonzales, the Colorado and Brazos settlements, San Felipe, Harrisburg and the like) and half outside it. The
burning follows history, so it is fair and a class can see why.

## 2. The land dealt half inside the zone (`FIC-GONZ-464`)

- **The zone** is the country a burning column's foragers reached while it advanced: within five miles of a main column's line
  of march and three of a detachment's (`FORAGE_MILES`, `DETACHMENT_MILES`, `FIC-GONZ-460`), from the column's first stop until
  early enough that its parties are at a farm by the victory (April 21, 4:30 p.m., `FORAGING_ENDS`). It is worked out from the
  columns' own legs on the map's roads (`burnSamples`, `reachOf`), so the zone the land is dealt by and the burning that follows
  are one rule. Every settlement but Liberty has land on both sides of its edge.
- **The rule:** family 1 inside, family 2 outside, family 3 inside, and so on. Students join families in that order
  (`server/app.mjs` `/api/join`: `hh-1`, `hh-2`, …), so however many join, **the played families are half and half**, and an
  **odd one over is inside**: at least half of every class's farms burn, which is the owner's "ensure that 50%". A solo game
  (always `hh-1`) is inside.
- **Every other land rule holds:** the ring of 2 to 12 miles round the family's own settlement, water within half a mile, level
  ground, league spacing (closing up only as the old deal did), a road reachable without crossing a big river, and **the
  settlements' counts by 1834 population** (`dealCounts`).
- **It moves as little as it can.** The land is dealt exactly as before; then a family whose land already lies on its side keeps
  it, a seat is exchanged with a later family's only where a settlement has no room on the side a family needs (a side has
  room for a family per twelve standable half-mile points, `POINTS_A_FAMILY`), and a family on the wrong side is given land again
  on the right one **from a stream of its own**, seeded by the land already dealt. The class's own random stream is untouched,
  so every crop, wagon load and timber band after it is the draw it always was. Measured on six seeds: 34 of 74 families keep
  their land exactly; the rest are the families that had to move.
- `ceiling:` a class no order of seats can serve (none found at 5 to 30 families) takes, for the family that cannot be served,
  the settlement of nearest 1834 weight with room on its side, and the counts move by one; the class is never refused.
- **Old saves keep their land.** A saved class carries its map; nothing deals it again. Its farms burn or stand by where they
  lie, by the same zone. **No `saveVersion` moved**: every field the advance writes (`flight.left`, `flight.unseen`,
  `flight.burnedBy`, `flight.burnKnown`, `herdLeft.driven`) is absent on a class saved before and has a correct empty value.

## 3. The columns (`HIST-TEX-580` to `-597`)

Each column is a body of men with a commander (`sim/people.mjs`: Sesma, Tolsa, Santa Anna, Cos, Gaona, Urrea, Filisola), the
record's strength for the stretch it is on, and a path of dated stops (`COLUMNS` in `sim/advance.mjs`). Between stops it marches
the map's roads (across country where the map has none, or its road is over 1.6 times the straight line) at whatever even pace
brings it in on the record's date — never over forty miles a day, nor two and a half miles an hour (`MAX_MILES_A_DAY`,
`MAX_MARCH_MPH`, tested); two stops at one place are a camp; at a river's ferry or ford it is crossing. **Columns that marched as
one are one column** (`joins`): Tolsa into Sesma's, Sesma's division into Santa Anna's at the Atascosito crossing and out again at
San Felipe, Sesma's and Gaona's into Filisola's camp at Old Fort, Urrea's into Filisola's at Mrs. Powell's. Dates are the
record's timeline read against the class's clock (`clockOf`, the eighteen hours of `campClock`).

| Column | Itinerary (1836) |
| --- | --- |
| Sesma (750, then 1,400 with Tolsa) | Béxar Mar 11 → Gonzales Mar 14 (a day at the burned town) → the west bank of the Colorado opposite Beeson's Mar 20–27 → the Atascosito crossing Mar 27 – Apr 5, where Santa Anna takes the division on |
| Tolsa (600) | Béxar Mar 17 (the game's) → the Navidad Mar 24 → with Sesma Mar 25 |
| Santa Anna (30, then the division of 1,400, then 550, then 750) | Béxar Mar 31 → Gonzales Apr 2 → Atascosito Apr 5–6 → San Felipe Apr 7–9 → Thompson's ferry Apr 12–14 → Stafford's Apr 15 → Harrisburg Apr 15–18 → New Washington Apr 19–20 → the prairie by Lynch's ferry Apr 20; the battle draws it from then |
| Sesma again (1,000) | San Felipe Apr 9–12 → Thompson's Apr 13 → Old Fort Apr 14–18, into Filisola's camp |
| Cos (500) | Old Fort Apr 18 → Stafford's → Harrisburg Apr 20 → Vince's bridge → San Jacinto 9 a.m. Apr 21 |
| Gaona (725) | Béxar Mar 24 → the San Marcos → Bastrop Apr 2–10 → Industry → Cat Spring → San Felipe Apr 18 → Old Fort Apr 20 (his undated days the game's, `FIC-GONZ-462`) |
| Urrea (280 → 440 → 1,300 → 1,000 → 400) | Refugio Mar 14–16 → Goliad Mar 17–19 → Coleto Mar 19–20 (the battle draws it) → Victoria 7:30 a.m. Mar 21 – Mar 31 → Texana Apr 1–3 → Tres Palacios → Cayce's crossing Apr 6–12 → Matagorda 10 a.m. Apr 13 → the San Bernard → Mrs. Powell's Apr 20 → Columbia Apr 21 → Brazoria Apr 22 → back to Powell's Apr 24–25; detachments to Las Juntas (Mar 22) and Cox's Point (Apr 1–4) |
| Filisola (1,800; 2,563 at Powell's) | Béxar Mar 29 → Gonzales Apr 2–7 → Atascosito Apr 10–14 → San Felipe Apr 15–16 → Old Fort Apr 18–24 → Mrs. Powell's Apr 25 → the sea of mud Apr 28 → Atascosito Apr 29 – May 8 → Victoria May 13 → Goliad May 17 |

No column comes within two miles of Washington, Groce's, Bernardo, Velasco, Liberty, Anahuac or Nacogdoches (tested). **The
retreat** (after the victory) burns nothing and hunts nobody.

**On the map.** Each column is drawn where it is: a camp with its tents close up, a column of men in files with a horseman at the
head when it marches, a flag and its name far off, labelled with the record's strength ("Urrea's column · about 1,300"), and its
foragers as small parties of horsemen - two riding either side of a marching column and one riding out to each farm it is
about to burn. The generals are drawn and named with their columns (`sim/famous.mjs`). **The Host sees every column; a family
sees one only where its own people are within twelve miles of it or of its foragers** (`COLUMN_SIGHT_MILES`), never from the
land it has left, and is never told which farm a party rides for.

## 4. What burns, and by whose hand (`HIST-TEX-594` to `-598`, `FIC-GONZ-465`, `-466`)

**The towns**, on their dates, by the record's hand, each a column of smoke over the place for eighteen hours, the Host's camera
going to it and the word going out (`BURNINGS`): Gonzales (Texians, the night of Mar 13), the houses at Refugio (Texians, Mar 14),
Goliad (Texians, before Mar 19), Beeson's house (Texian scouts, Mar 21), San Felipe (Moseley Baker's men, Mar 30; whose order is
disputed), Bastrop (Gaona's plunder, about Apr 10), Stafford's plantation (Santa Anna, Apr 15), Harrisburg (Santa Anna's army,
Apr 16, the day disputed), New Washington (Santa Anna, Apr 20), Mrs. Powell's (the retreat's rear guard, Apr 26). **No record
found has Victoria, Matagorda, Columbia or Brazoria burned, and none of them does.**

**A family's farm inside the zone** burns when a column's foragers reach it (`burnByForagers`): half a day after the column comes
within reach, the ride out, and never before a day after the family was told to leave (`ORDER_GRACE_MINUTES`). The house, the
field and the fences are burned (`ruin`); whatever the family left in the house when it went is lost with it (`flight.left`);
the furniture and the room are gone; the stock left on the range is driven off, so a quarter of the cattle is found again, not
half (`FOUND_AFTER_FORAGERS`); and whoever of the family is at home is taken prisoner at one in two, as the Mexican army's coming
always took them (`CAPTURED_AT_HOME`). **A farm outside the zone is never reached**: the family comes home to the house standing
and what it left in it.

**Leaving no longer burns the farm.** Until today the Texas army burned every family's house as it left (the owner's
2026-09-16 image, *"Families watch as they leave the Texas Army burns their farm and house"*, `FIC-GONZ-046`). The record's
Texian burnings are the towns', and the owner's new rule is that the zone's farms burn; so on the real land the farm is left
standing with what did not fit, until the foragers come or never do. The invented Gonzales country, which has no columns, keeps
the old rule. **Decision (a) below asks the owner which he wants.**

**Honestly, on farms** (`HIST-TEX-598`, `-599`): the record documents looting and stripping of farms along the routes - corn,
cattle and hogs taken, floors torn up, houses stripped for lumber - and the burning of towns, plantations and "houses along our
route" (Caro); it does not show the columns burning every farm as a policy. That the zone's farms burn is the owner's rule
(`FIC-GONZ-465`). **Decision (b)**.

## 5. What a family learns, and how (`FIC-GONZ-463`)

Never by a roll. By its own people: smoke seen within ten miles while it stands (`SMOKE_SIGHT_MILES`; eighteen hours over a town,
six over a farm), a column within twelve; or by the word, which goes out from the place at forty miles a day in every direction -
riders, refugees and the army's own people (`WORD_MILES_A_DAY`) - and reaches the family when its nearest person is that far off.

- **Its own farm** (`learnOwnBurning`): once, by whichever comes first - its people at home when it burned (`there`), the smoke
  over its land (`sight`), the word (`word`), or coming home to it (`home`) - as a plain-words account in its record ("Word came
  along the road from people fleeing east: on April 13 foragers of Urrea's column reached the family's farm and burned the house,
  the field and the fences. What was left in the house went with it: 360 food.") and a report. **Until then the family's page
  shows the farm as it left it** (`flight.unseen`, `householdAsKnown`): its land, its house, its household and its flight card;
  the burning event itself is sealed (revealed with the ending); the Host's spotlight does not write into the family's record
  (`spotlight`'s `tell: false`).
- **The towns burned** and **where the columns came** (fourteen stops marked `word`: Sesma at Gonzales, on the Colorado, over
  it; the army at San Felipe; Santa Anna at Gonzales, Harrisburg, New Washington; Gaona at Bastrop; Urrea at Victoria, Texana,
  Matagorda, Columbia, Brazoria; the army at Powell's) come as reports, unconfirmed by word and confirmed by sight, and the
  Rumor Mill tells each in its own written line. A family's own farm is its own and not the mill's.

## 6. Pacing (`FIC-GONZ-467`)

The columns are background. While a played family at its screen has somebody (not serving with an army) within six miles of a
column **on the march** or its foragers, the clock is held to two hours a tick, as a journey is watched (`columnWatched`); a
column in camp and a column far off hold nothing.

**Class time at Study pace** (`scripts/battle-class-time.mjs 5 15`, `docs/evidence/advance-class-time.json`; the same script on
the tree before this work for the baseline): a class of families nobody plays runs **1,251 ticks (198.1 minutes) before and
after**, the third period 392 ticks both; with a played family in every fight, **1,448 ticks (229.3 minutes) before and after**.
The columns add nothing to either, because they hold only for a played family at its screen. The most they can add, counted
as if **every** family were played, present and not on auto: **35 ticks, 5.5 minutes** in a class of five and **76 ticks,
12.0 minutes** in fifteen (before the watch was narrowed to marching columns and families' own people: 18.4 and 28.6).

## 7. What else changed with it

- **The pursuit reads the columns** (`sim/road.mjs`): the warning and the overtaking are by every column in the country, with
  their real dates. A family warned of one column stays warned of it while it is within reach, though another marching beside it
  is a few yards nearer this tick; a family already stripped where it sits is not taken again by the next column down the same
  road until it sets out again; and no family is overtaken in the day its order gives it (`ORDER_GRACE_MINUTES`) - the record's
  Gonzales families left with Houston the night before Sesma came in.
- **A family still deciding when its settlement's two days are out has stayed** (as it always did when the Texas army's passing
  was the moment): without it a Liberty family with no refuge east could hold the class's calendar at the farming scale all
  spring.
- `SETTLEMENT_DAYS.burn` and `.enemy` are read only on the invented Gonzales country; the orders to leave keep their days.

## 8. Ceilings

- `ceiling:` the word goes as the crow flies and over every river, not by the roads and ferries (`wordReached`).
- `ceiling:` knowledge is the household's, not each person's (docs/LIVING_INFORMATION.md's boundary).
- `ceiling:` a column's foragers burn every farm in the zone; the record's "stripped and looted" is not a separate outcome
  (decision (b)).
- `ceiling:` one family near a column slows the class, as every held clock does.
- `ceiling:` the other off-map stops (the San Marcos crossing, Industry, Cat Spring, Texana, Cayce's, the San Bernard houses,
  Las Juntas, Cox's Point, the mud, the San Jacinto field) are points on the columns' paths, not places families can go to.
  Stafford's, New Washington, the Old Fort, Thompson's and Mrs. Powell's became places on 2026-09-26 (decision (c), §10).

## 9. Evidence

Same computer only; no physical LAN or district claim. `tests/mexican-advance.test.mjs` (11: the columns on the record's dates
and nowhere no Mexican came; on the roads at a column's pace, never a jump; the towns' burnings and hands; half the land inside
for 5 to 30 families on three seeds each, the odd one inside; an old save's farms by their own land; the page shows the farm as
left until the word; the smoke only near and while it stands, the word at forty miles a day; the return; the columns seen only
where a family's people are; the watch; the stock), and `scrape`, `road`, `armies` rewritten for the rule.
`npm run test:mexican-advance` (`docs/evidence/mexican-advance-browser.json`), `npm run test:mexican-advance-injections`
(`docs/evidence/mexican-advance-injections.json`), the class time in `docs/evidence/advance-class-time.json`. Numbers in
`HANDOFF.md`.

## 10. Decisions for the owner — answered 2026-09-26

**The owner's answers, by multiple choice, 2026-09-26:** (a) **"Nobody"** (as built); (b) **"Burn it"** (as built); (c)
**"Real places to go"** - built the same day, below; (d) **"Five miles"** (as built). Recorded in `HISTORY.md` on
`FIC-GONZ-460`, `-465` and `-466`, and on `HIST-TEX-586` to `-588`, `-590` and `-596` for the places.

**(c) as built** ([MAP_ACCURACY.md](MAP_ACCURACY.md) §14, `sim/advance-places.mjs`): **Thompson's** (the west-bank landing at the
1936 marker) and **Thompson's ferry** over the Brazos, the **Old Fort** (Fort Bend), **Stafford's**, **New Washington** and
**Mrs. Powell's** are places of the map at their markers, with seven roads as the columns went: down the right bank from San
Felipe to Thompson's (32.7 miles) and on to the Old Fort (2.7); over Thompson's ferry to Stafford's (13.4) and on to Harrisburg
(21.2); Harrisburg to New Washington (17.8); the Old Fort to Mrs. Powell's (16.2) and on to Columbia (29.9). A family can be
sent to any of them, on foot or by wagon. The columns' paths go through them as places - Santa Anna over Thompson's ferry,
Sesma's division and Gaona to the Old Fort, Cos by Stafford's, Urrea and the army at Mrs. Powell's - and Stafford's, New
Washington and Mrs. Powell's burn there. Emily West stands at New Washington itself. A class saved before is given them at the
save's door (`openAdvancePlaces`), nothing it had moved, no save version. `ceiling:` Santa Anna's march from New Washington to
the field on April 20 is still across country (a road there would be the San Jacinto's open water's second road); the creeks
round the five are drawn only where they were already (so the new roads ford only water the map already drew); Mrs. Powell's is
within a mile of the house, not at it; the five have their names and no art of their own (a request in docs/ART_REQUESTS.md).

The questions as they were put:

(a) **Who burns a family's farm as it leaves?** 1. *As built:* nobody; it stands until the foragers come (inside the zone) or
never (outside). 2. The Texas army burns it as the family leaves, inside the zone only (the 2026-09-16 image kept where the
foragers would have come anyway). 3. The Texas army burns every family's farm as before, and the foragers burn only what is
still standing.

(b) **What do the foragers do to a farm in the zone?** 1. *As built:* burn it (the owner's word). 2. Burn it on the line of
Santa Anna's own march (Thompson's to New Washington, where "houses along our route" burned) and strip and loot it elsewhere -
house standing, goods and stock gone. 3. Strip and loot everywhere; only the documented towns and plantations burn.

(c) **Off-map stops** (Stafford's, New Washington, Old Fort, Thompson's, Mrs. Powell's): 1. *As built:* points on the paths,
drawn in the smoke and the word. 2. Places on the map a family can go to.

(d) **The forager range**: 1. *As built:* five miles (three for a detachment). 2. Eight. 3. Three. (Wider puts more of every
settlement inside; the land's dealing follows it.)
