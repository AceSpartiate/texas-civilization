# The Mexican advance, the burn zone, and the land dealt half inside it

**Status: owner-asked 2026-09-25, the land's rule chosen by the owner 2026-09-26, built 2026-09-26. Amended 2026-09-27 (§11-§16, not released): the family's own way east, and Mexican troops who can see it, order it to halt and fire on it if it runs. Amended by the owner 2026-09-29 (§18-§20, built 2026-09-30, not released):
household goods in the load, leaving before the order on real news, and foragers who take a stayer's goods.** Amends
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
- **The rule** (as amended 2026-09-29, below): two by two down the join order - families 1 and 2, 3 and 4, and so on - one of
  each two inside and one outside, **which one the class's seed says** (`burnSides`). Students join families in that order
  (`server/app.mjs` `/api/join`: `hh-1`, `hh-2`, …), so however many join, **the played families are half and half** (an even
  number exactly; an odd number within half a family), and an **odd one over at the end of the class is inside**: at least half
  of every class's farms burn, which is the owner's "ensure that 50%".
- **Shuffled by the seed — owner-decided 2026-09-29** (triage D12, the design audit's M16, by multiple choice: *"Shuffle by
  seed"*; `FIC-GONZ-963`). Until then family 1 was always inside, family 2 outside and so on, so a class that played twice could
  learn which place to join in (and a solo game, always `hh-1`, always burned). Which of each two is inside is hashed from the land
  the seed already dealt, so it is the same every time the class is made from its seed and draws nothing from the class's own
  stream. `ceiling:` an odd number of *played* families in a larger class is within half a family of half; family 1 always inside
  would make every prefix at least half, and would hand back exactly the place this hides. Old saves keep their land.
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

**The prisoners are weighed at the ending** (owner, 2026-09-27, by multiple choice over [BALANCE.md](BALANCE.md) §6: *"Weigh the
prisoners"*). Everybody of a family taken prisoner at home or on the road east is named in its reckoning, and takes their part of
the family's coin out of the count (`PRISONER_WEIGHT` in `sim/ending.mjs`, `FIC-GONZ-710`), so staying in the burn zone is the
gamble it was and no longer, on average, beats going. Nothing here changed: the Scrape takes the same people it always took; the
ending reads them (`scrapePrisoners`). The war's prisoners - San Patricio, Agua Dulce, Goliad - are not the Scrape's and are not
weighed. Measured in BALANCE.md §9.

**One milk cow goes with the family** (owner, 2026-09-27, "Yes, one cow"; [STOCK.md](STOCK.md) §8, [CHILDREN.md](CHILDREN.md) §7):
a family with cattle may leave with one cow driven by a child, out of the herd left on the range. She gives a little milk a day on
the road and at the refuge, and is **taken with the wagon and the animals when a column overtakes the family** (`overtake`,
`loseCow`); home again she goes back into the herd before what is found of the rest is counted.

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

---

## 11. The family's own way, and Mexican troops on it — owner-asked and decided 2026-09-27 (built 2026-09-27, not released)

> "during the runaway scrape, does the player have control over where the family goes? they should. the wagon(s), horse(s), etc
> should all move as a train with the player choosing destination spots. staying on a road is faster, but more visible to
> Mexican troops. vice versa is also true. if Mexican troops get too close, they'll begin ordering the player to stop. if the
> player keeps trying to run, the soldiers open fire. bullets should be modeled, and accuracy should be era appropriate. the
> player should be a little faster than the Mexican troops, but Mexican Cavalry should be faster. Cavalry should be uncommon."
>
> "i still like the choose a destination idea. then maybe there's a thin, subtle line as a path for directions that only the
> player can see?"
>
> — the owner, 2026-09-27

Put by multiple choice after a breakdown the same day, the owner chose:

- **How often: "Rare, where columns were"** — only near where a column really was, on its dates, mostly on the roads it used; most
  families never meet one; mud, rivers and sickness stay the main dangers. The Mexican army was chasing Houston, not families.
- **Speeds: "Historical"** — an ox wagon (about 2 mph) slower than marching infantry (about 2.5); a family on foot (3) or on horses a
  little faster; cavalry (6-8, faster in a short dash) outruns everyone. Keeping the wagon is a real risk. Cavalry uncommon.
- **Who can be hit: "Adults and animals only"** — shots with period accuracy, mostly missing; a hit can wound or kill a grown-up, a
  horse or an ox, no gore; children are never hit. **Narrowed the same day (§16 a): "Only at men and animals"** - never a woman
  or a child, and the fire held where one is in the way.
- **The chase: "A short held scene"** — the clock slows as in a battle: "¡Alto!", the choice to halt or run, the chase with shots
  and smoke, then back to the road's own time; about one to two real minutes.

Research: [battle-research/scrape-pursuit.md](battle-research/scrape-pursuit.md), claims `HIST-TEX-660` to `-668`; the game's
own `FIC-GONZ-660` to `-667`. Code: `sim/flight-route.mjs` (the route), `sim/pursuit.mjs` (who can see a family, the patrols,
the chase, the shots), `sim/road.mjs` (the order to halt as a road question, `ROAD_ASKS.alto`; the chase in the road's tick),
`sim/ways.mjs` (`findWay`'s options for a route from a point and across country), `sim/scrape.mjs` (leaving by a route, a stop and
on), `sim/military-pacing.mjs` (`chaseStep`), `public/chase-view.js` (the chase drawn), `public/app.js` (the route editor, the path,
the flight card).

**Said plainly, as the game never says otherwise:** no source read has Mexican troops firing on fleeing refugees. At New
Washington Almonte held his men's fire so as not to endanger Burnet's family; at Fort Bend the Kuykendall families ran for the
river bottom and hid in a cane-brake. That soldiers fire on a family that runs is the owner's rule (`FIC-GONZ-665`,
`HIST-TEX-665`); decision (a) in §16 asked whether to keep it, and the owner narrowed it the same day: **only at the men and the
animals, holding their fire where women and children are in the way, as Almonte did.**

## 12. The route (`FIC-GONZ-660`, `-667`)

- **Where.** Any place a family could make for (`flightPlaces`, 46 on the colonies map): the towns, villages and landings, the
  plantations the columns passed (Stafford's, Mrs. Powell's), the named ferries - not a creek's ford or a stand of timber. A
  destination and up to five stops before it (`MAX_STOPS` six).
- **By which way, each stretch.** **By the road**: the quickest way, as every journey goes (`findWay`). **Across country**: through
  waypoints three lanes wide between the two places, slower by the ground's going and the off-road share (foot 1.15, horse 1.2,
  wagon 1.6; `OFF_ROAD`), a road costing four times its going (`COUNTRY_ROAD_COST`) so it is taken only to cross a big river at its
  crossing (`BANK_MILES`) or where nothing else goes; **a wagon never through timber or brush**. Where the country has no way the
  route is refused in words. Measured on the map: Harrisburg to Lynchburg on foot 14.5 miles by the road, or 13.0 across country
  that take 16.3 miles' going; San Felipe to Lynchburg 68.1 by the road, 65.2 across country (64.0 of it off the road) taking 78.8.
- **Chosen and changed.** Leaving (the order's card: "Make for" any place, "How": by the road or across country) and on the road
  ("Change where we go": the stops in order, a way for each, a place added from the list or by tapping the map, "Set out this way").
  On the road the train turns where it stands, the way already come kept in front of the new one so it can be turned back along
  again. Each later stop is planned again when it is reached, for the train as it is then.
- **As a train.** Everybody and everything goes together (sim/company.mjs `setOut`): the wagons and oxen, the horses and riders,
  the walkers, the cow; at the slowest, and at a horse's pace only when every one rides (`mountedPace`).
- **The card** says where the family is making for, the next stop, the miles and the pace, and **how far off Mexican troops could
  see it** ("from about 3 miles: the wagon on the road, in the open").
- **The path** (owner: "a thin, subtle line... that only the player can see"): from the train through every stop to the
  destination, road legs along the road and country legs as the family goes, dashed, pale and a little wider only as the map is
  zoomed in, under every figure (`drawRouteLine`). Sent only in the family's own projection. **The Host is sent none**: a class's
  map of thirty lines helps a teacher nobody, and "only the player" is the owner's word; the Host still sees where every family is.
- **Automatic families** keep the automatic route: the nearest refuge east, by the road (sim/scrape.mjs `packFlight`, unchanged).

## 13. Who can see a family, and the chase (`FIC-GONZ-661` to `-664`, `-666`)

- **Only a column on its dated road** (sim/advance.mjs) **or a patrol** can see a family. **The patrols** (`PATROLS`), the record's
  own episodes on their days: Sesma's scouts eight miles ahead of his column March 15-20; Urrea's cavalry six ahead into Victoria, to
  Texana and to Matagorda; Santa Anna's dragoons five ahead from Thompson's to Harrisburg, April 14-15; Almonte to New Washington and
  Lynchburg, April 16-18; Barragán to Lynchburg, April 19. About four hundred horsemen in all of Texas (Filisola's return).
- **How far off** (`sightMiles`): a wagon three miles over open ground, riders two, people on foot one; a quarter or a tenth in
  brush, fifty yards in timber; **half as far off the roads**; no further than 200 yards in rain or fog, 50 at night. A column sends
  a file of eight after a family within a mile; a patrol rides after anything it sees. Two things that passed inside one long tick
  still met (`closestApproach`). **Nothing is rolled to be seen.**
- **The chase.** Each soldier his own distance behind the family; infantry at 2.5 mph; horsemen at the trot, 8, and the gallop, 11,
  within 150 yards. **"¡Alto!"** within 200 yards (by night **"¿Quién vive?"**), in Spanish with the English under it, over the
  lead man; the soldiers stand for the answer (horsemen come up at a walk). The family's answers, each with its price in miles an
  hour: **halt** (taken as a column always took a family: wagon, beasts and goods, grown men prisoner at one in two, glory as a
  desertion; nobody shot); **run as we are**; **leave the wagon and run on foot**; **let the milk cow go and run**; **run for the
  timber** when there is timber within three quarters of a mile to hide in. While the soldiers are still coming on, the card offers
  **"Make for the timber"** too. Running, after a second order ("¡Alto, o hacemos fuego!") they fire.
- **The shots** (`HIT_TABLE`, research §4): every shot a real event, rolled once, at one of the grown men, the oxen or the horses
  - **never a woman or a child, nor a man or a horse with one of them** (a man carrying a baby or riding in the wagon among them, a
  horse a woman or a child is on), **nor the wagon** (§16 a, owner 2026-09-27: "Only at men and animals"). With nothing else to
  fire at - a family of women and children on foot - they **hold their fire**, say so over the lead man ("¡Alto el fuego! Hay
  mujeres y niños.", "Hold your fire! There are women and children."), and the family's record says why (Almonte at New
  Washington); they still come on, and a family they come up with is taken. `ceiling:` "in the way" is read from who rides with
  whom, not where each walks (the chase is a line); by range (nothing past 200 yards), shooter (half the infantry recruits firing from the hip;
  horsemen at the gallop, one carbine shot each) and target, times 0.6 on the move. Every second man of a file stops to fire and
  load (20 seconds trained, 35 a recruit), the rest run on. A grown person hit is killed one time in five and otherwise wounded for
  three weeks; a beast killed one in four, else lamed - a lamed ox halves the wagon's pace, an ox down stops it and a running family
  leaves it, a lamed horse puts its rider down. No blood; nobody is drawn falling.
- **The end.** Taken within 15 yards. Got away when the soldiers give up: after two miles or half an hour on foot, three or half an
  hour mounted (not with a hand almost on the family, within 100 yards), at dusk, at the timber's edge when the family is in timber
  enough to hide in and nobody within fifty yards, or when plainly outrun. Written in the family's record; a public line goes along
  the road ("Mexican horsemen of ... chased the ... family on the road and fired on them; the family got away").
- **Kept from before:** the warning at twenty miles and its question (press on, stay, leave the wagon); the lookout, who sees the
  riders further off; not chased twice by the same column or patrol in a day, never in the day the order gives, never again where
  the family was stripped until it sets out. **One army** (§16 e, owner 2026-09-28): once a column or one of its patrols has
  stripped a family, neither the column nor any of its patrols warns it, chases it or strips it again; another column still can. A bogged wagon, or one waiting its turn at a crossing, cannot run (on foot, a family fords at
  once). Whatever question was open when the soldiers call is put back after, if it still stands.
- **Seen by** the family's own student and the Host (the chase drawn on the Host's map, the camera's spotlight on a played family,
  the row "running from Mexican horsemen on the road to ..."). Other families learn by the word. **Never where the column is**: the
  chase is sent as the soldiers' distances behind the family.
- **Drawn** (`public/chase-view.js`): the soldiers behind the family on the map, each shot a flash at the muzzle and smoke that
  drifts and thins at the real moment of the tick it was fired in, dust where a ball fell short, the orders over the lead man.
  `stand-in:` docs/ART_REQUESTS.md, request 2026-09-27 - a dragoon firing from the saddle and an infantryman running and kneeling.

## 14. Pacing, rarity and class time (`FIC-GONZ-666`)

- **Held** for a played family at its screen only (`chaseStep`): two minutes a tick once the soldiers are within hail, and in ticks
  that bring them to hail in two or three while they come on. The order waits three ticks (`ALTO_PATIENCE_TICKS`, about 28 seconds
  at Study); then **the family halts, and it is written down** (it **lapses**, as every unanswered question now does - sim/lapse.mjs, `FIC-GONZ-633`: nothing new is chosen, the family stands as it was ordered to, and the soldiers come up; "Nobody answered for the family in time, and the question lapsed..."). A family nobody plays, one whose student has gone, or whose main person is on auto **halts when it is ordered
  to**, at once, and holds nothing ("The family, deciding for itself, chose: halt, as they order."). This is "an unanswered question
  lapses" applied to the road's newest question.
- **Real-time limits (owner, 2026-09-29, `FIC-GONZ-906`).** The order waits **about thirty real seconds** (`QUESTION_BUDGETS.alto`
  in `sim/decision-budget.mjs`), the same at every pace - three ticks were 28 seconds at Study and 3 at Quick - and **the chase
  is held while it waits**: the soldiers stand where they called from and the family where it was, nobody moving, until it is
  answered or its seconds are out (`waiting` in `advancePursuit`). Out of time it lapses exactly as above. The order to leave
  waits **three real minutes** (`QUESTION_BUDGETS.flight`), where it waited a day of the calendar (72 ticks, 11.4 real minutes
  at Study, the class's calendar held all the while); at Quick the order's day of grace (`ORDER_GRACE_MINUTES`, 72 real
  seconds there) comes first and the family goes then (`flightWaited`). The road's questions (the bog, the army close behind)
  wait **ninety real seconds**. The "!" counts each down in real seconds.
- **An order to leave that runs out burns the house** (owner, 2026-09-29: *"72 s at quick, but if the student doesn't respond,
  burn their house. They should have been paying attention."*; `FIC-GONZ-907`, `sim/scrape.mjs` `burnForSilence`). The
  timing stays three real minutes at Study and Brisk and 72 real seconds at Quick. When a played family at its screen lets it
  run out, at any pace, the family is still packed off as before (`autoFlee`), and **men of the Texas army burn the farm behind
  it** - the house, the field and the fences, and whatever was left in the house - as every farm in the game burns. It is
  counted as every burning is (`flight.burned`, `burnedBy` `{ hand: 'texian', lapsed: true }`, the world's record, the family's
  own knowledge): the land shows the house ruined at once (the family watched it go, so nothing is `unseen`), the journal says
  *"Nobody answered the order to leave in time, and the family left in a rush. ... The house is lost."*, the Host's camera goes
  to it, and the homecoming, the flashback and the ending tell it (*"Nobody answered the order in time, and they left in a
  rush: the Texas army burned the farm behind them"*). The stock is not touched: driving it off is the foragers'. **Warned
  first**: while the order stands, its card and its "!" say *"No answer in time, and the family leaves in a rush — the house is
  lost, burned behind it."* (`FLIGHT_IF_UNANSWERED`), and the flight tip says so too. **Why the Texas army:** it is the game's
  own burner of farms as families leave (the invented country, `FIC-GONZ-046`) and burned Gonzales and San Felipe on its
  retreat (`HIST-TEX-594`); the record read here says nothing of any farm burned because its family left late, so this is the
  game's. A family nobody plays, one whose student has gone, and one whose answerer is on auto keep the old answer: the farm
  is left standing for the foragers, or not. On the invented country every farm already burns as its family leaves.
- **Rarity** (`npm run study:scrape-pursuit`, [evidence](evidence/scrape-pursuit-study.json)): ten classes of fifteen families
  nobody plays, through the spring: of **123 families that fled, 17 (13.8%) were seen and followed, 15 (12.2%) were called on to
  halt, 9 (7.3%) met horsemen**; 106 never met Mexican troops at all. The rule before this, asked in the same classes and not
  applied, would have overtaken 21 (17.1%). About 2.3 chases a class.
- **Class time at Study** (`scripts/scrape-pursuit-class-time.mjs`, [evidence](evidence/scrape-pursuit-class-time.json)): a chase
  holds the class **38 to 133 real seconds, 83 on average** (dragoons after a wagon that runs, 67; that halts, 57; left unanswered,
  86; infantry after a wagon that runs, 133 with 17 shots, none hitting). As if every family of a class of fifteen were played and at
  its screen, **about 3.2 minutes a class**; a class with nobody at a chase, nothing.

## 15. Ceilings

- `ceiling:` the chase is a line: the soldiers come on from the way they saw the family, and a family turning toward them is not
  nearer for it. A two-dimensional chase would want the soldiers' own ground.
- `ceiling:` across country goes through waypoints three lanes wide between two places (`LANE_MILES`), so a way round a river's
  bend wider than that is not found and the road is taken there at its cost.
- `ceiling:` the timber a family can run for is looked for on rings a tenth of a mile apart to three quarters of a mile; a nearer
  patch between the rings is missed.
- `ceiling:` the party that comes after a family is a sample (eight of a column's advance guard, six to ten of a patrol), the same
  for a column of 300 or 1,400.
- `ceiling:` a patrol rides a fixed distance ahead of its column's head; it does not search side roads.
- `ceiling:` a wounded person keeps the seat they had when the family set out (sim/company.mjs plans seats once a journey).

## 16. Decisions for the owner

(a) **Do soldiers fire on a family that runs?** 1. *As built:* yes, after a second order (the owner's rule). 2. They fire only at
the men and the animals, and hold their fire where women and children are in the way (Almonte at New Washington). 3. They never
fire on refugees (the record); running only risks being ridden down and taken. **Answered 2026-09-27, by multiple choice: 2, "Only
at men and animals"** - built the same day (§13 *The shots*; `targetsOf`, `holdFire` in sim/pursuit.mjs; `FIC-GONZ-664`, `-665`),
not released.

(b) **How rare?** *As built:* 13.8% of fleeing families met Mexican troops, 7.3% horsemen. 1. Keep. 2. Rarer: patrols only on
Santa Anna's dash (Thompson's to New Washington, April 14-19). 3. Commoner: every column's cavalry out ahead on every march.
**Answered 2026-09-27: 1, "Keep as built."**

(c) **What does a hit do?** *As built:* a grown person killed one time in five, else wounded three weeks; a beast one in four, else
lamed. 1. Keep. 2. Wounds only, nobody killed. 3. As in battle (sim/army.mjs's severe and dangerous wounds).

(d) **Running for the timber.** *As built:* offered while there is timber within three quarters of a mile, and horsemen give up at
the timber's edge. 1. Keep. 2. Infantry follow into the timber and cavalry do not. 3. No timber rule.

(e) **A column and its patrols: one army, or each its own?** Found by the proof fixer (2026-09-28): a family Santa Anna's dragoons
had stripped was warned of Santa Anna's column a tick later, a mile off, because "never twice" counted a patrol apart from its
column. 1. One army: once a column or any of its patrols has stripped a family, none of them troubles it again. 2. Each its own,
as built. **Answered 2026-09-28, by multiple choice: 1, "One army"** - built the same day, not released. Each patrol is tied to its
column (`PATROLS[].column`; Almonte's and Barragán's dragoons, detached from Santa Anna's escort on their own roads, are his), and
who has stripped the family is read by army (sim/pursuit.mjs `armyOf`, `strippedBy`): the road's warning (sim/road.mjs
`advanceRoad`) and who may come after the family (`mayChase`). `flight.overtakenBy` keeps the id that did it, as before, so a class
saved before reads the same way and no save version moved. Tested in tests/scrape-pursuit.test.mjs (*one army ...*): stripped by
the dragoons, the family is not warned of the column coming on within twenty miles, nor chased by the column, nor by Almonte;
stripped by the column, not by the dragoons; stripped by Urrea's cavalry or Sesma's column, Santa Anna's still come after it.
Not changed: a chase the family got away from still counts per column or patrol for its day; and the column entries of
sim/advance.mjs are each their own (`ceiling:` at `armyOf` - Sesma's two legs, Urrea's detachment and his dragoons to Cox's Point).

(f) **Families nobody plays camped at Lynchburg as Santa Anna nears.** *As built:* such a family answers the warning at once by
pressing on, and nearly all go on to Liberty (noticed 2026-09-26; every seed of `sj-proof-91` to `-120` searched on 2026-09-28).
**Answered 2026-09-28: "Yes, most move on"** - kept as built, no change.

## 17. Who answers for the family on the road, and who is left behind — 2026-09-28 (owner: "fix the blockers"; not released)

docs/audits/2026-09-28-interactions.md B1 (the blocker), S1 and M4; docs/audits/2026-09-28-design.md S19 and S22. Built in
sim/acting.mjs; the rule is docs/FAMILY_PANEL.md §20.

- **The family's decisions are made by whoever is with it** (`actingFor`, `FIC-GONZ-730`): the order to leave, the route, making for
  the timber, staying, the bog, the army close behind and "¡Alto!". A father serving with Houston, a prisoner or a man gone to a
  call answers none of them - the mother at home does, or the next grown person with the family, or the oldest child of seven or
  more (owner, 2026-09-28: "The oldest child steps up"). The page's card and "!" are on that person. `attended` (sim/pursuit.mjs)
  reads the same person's auto switch, so a man on auto in Houston's camp no longer makes his family halt at the soldiers' first
  word; the road's patience and auto's day read the same person; the overtaken glory is charged to whoever was answering.
- **The clock** is held for the order and the road's questions only while somebody is with the family to answer.
- **Everybody at home goes** when the family leaves, **the wounded too** - in the wagon with the sick, or on foot at a small child's
  pace - and they go home with it after San Jacinto (`FIC-GONZ-732`; until 2026-09-28 a wounded man was left at home, and one
  wounded in a chase was left at the refuge).
- **Left behind** (`advanceStragglers`, `FIC-GONZ-732`): anybody of the family away when it left - in town, on an errand, sent home
  from the army - and idle away from it is told where it went, once, and follows to its refuge on foot or on the horse they have
  with them; never a beast on the family's own road.
- **A family taken in** by its neighbours (`FIC-GONZ-731`) has no road of its own: its little ones go with their neighbours', and its
  flight card says so.

## 18. The household goods in the load — owner-decided 2026-09-29 (built 2026-09-30, not released)

The triage's D9 (a) (docs/audits/2026-09-29-triage.md; the design audit's S16: *"'Choosing what to abandon' is not a choice: the
load is four goods and only food matters"*). Put by multiple choice, the owner chose the recommended option: **"Add household
goods"** - add tools, the spinning wheel and the chest, and let the homecoming restore what was carried. `FIC-GONZ-990`.
Code: `sim/flight-goods.mjs`, `sim/scrape.mjs` (`LOAD_SPACE`, `flee`, `packFlight`, `loadCard`, `advanceFlight`), `sim/road.mjs`
(`abandonWagon`, `overtake`), `sim/flight-work.mjs` (`HIDDEN_GOODS`, `digUpCache`), `public/app.js` (`renderFlight`).

- **What is in the load now.** Beside the four stores: the tools the family owns (sim/tools.mjs counts them - a family that bought
  two hoes has two to take) and the chest and the spinning wheel if it brought them in its wagon. The card shows only what the
  family has, each with its room, and says that what is not loaded is left in the house.

  | Thing | Room | In food |
  | --- | --- | --- |
  | Food | 0.25 | 1 |
  | Seed / cotton / powder | 1 / 0.5 / 0.1 | 4 / 2 / 0.4 |
  | Hoe | 0.5 | 2 |
  | Felling axe | 1 | 4 |
  | Broadaxe | 0.5 | 2 |
  | Froe, auger | 0.25 each | 1 each |
  | Chest | 4 | 16 |
  | Spinning wheel | 3 | 12 |

  A wagon holds 20 (a cart 15, a carreta 12.5); a grown person on foot carries 1.25 and a child's bundle 0.5. So a wagon can take
  every tool and still be mostly food, but the chest and the wheel together are twenty-eight food left behind, and **on foot
  neither can be carried at all** by a family of fewer than three grown people. Invented numbers.
- **The default is still food first** (`packFlight`, design audit B7): all the food that fits, then seed, cotton, powder, then the
  tools, then the chest and the wheel as room allows. A family with more food than room leaves its household goods behind unless
  the student chooses them; a family nobody plays packs the same way.
- **Carried** goods stay the family's all the way and come home with it (the journal: *"They brought home what they had carried all
  the way: a hoe and the chest."*; the flashback's homecoming says it). They are lost only as the road loses things: **left with the
  wagon in the mud** when they do not fit on the family's backs (food first, then the tools, then the chest and the wheel), or
  **taken with the wagon** when a column comes up with the family.
- **Left** goods are out of the family's hands when it goes and lie in the house (`flight.left`, as the stores always did): **found
  again** at a house that stands, **burned with it** when foragers or the Texas army burn it - named in the journal, the flashback
  and the ending (*"A felling axe, a broadaxe, the spinning wheel were left in the house, and burned with it."*). The hiding
  (`flee-hide`) takes, after the powder and the seed, the tools, the chest and the wheel, then the cotton: the Roses hid a big chest
  in the river bottom (`HIST-TEX-640`).
- **The rifle is not in the load**: it goes in a man's hand, as the coin in a pocket, or with him to the war (sim/keeping.mjs).
- **Home with no felling axe** to a burned farm, the flashback's first logs go up *"with one lent by a neighbour"*.
- **Not counted in the final number** (the owner chose A, not C): what is saved is told, not scored.
- `ceiling:` the other goods the wagon brought in - bedding, the iron pot, tinware, books, chairs, mosquito bars - still go with the
  family unasked and are never lost; the owner named the tools, the wheel and the chest.
- `ceiling:` a tool found again or dug up comes back sound (sim/tools.mjs `addTool` knows no wear); only the hoe wears.
- `ceiling:` the felling axe carried off the land by somebody at work when the family goes is counted as at home.
- `ceiling:` the interior view lists what the lobby load brought (sim/interior.mjs), so a chest lost may still be set out there.
- **Old saves**: a family that left before this kept its tools and goods in hand, and they count as carried from then on; `left`
  may now hold goods, which every class saved before simply has none of. No save version moved.

## 19. Leaving before the order, on real news — owner-decided 2026-09-29 (built 2026-09-30, not released)

The triage's D9 (b) (the design audit's S17: *"Preparation cannot change anything: nobody may leave before the dated order"*). The
owner chose the recommended option: **"Yes, on real news"** - leaving allowed on news the family has actually heard, at a cost (the
crop left, the house left empty); and the preparation works on the same news. `FIC-GONZ-991`. Code: `sim/early-word.mjs`,
`sim/scrape.mjs` (`fleeRefusal`, `flee`, `loseCrop`, `earlyProjection`), `sim/flight-work.mjs`, `sim/advance.mjs` (`burnMinute`),
`sim/directors.mjs` (`advanceEarlyWord`), `public/app.js`.

- **The news that counts**, in the family's own knowledge (docs/COLONIES.md §5.4c/d - by rider, by express, by the smoke or with its
  own eyes), as firm as a rider's word (`unconfirmed` or `confirmed`; never a rumour, never contradicted): **the Alamo's fall**
  (`alamo-fall`), **Fannin's defeat** by Urrea (`goliad-defeat`), **Santa Anna over the Brazos** (`santa-anna-brazos`), **a column come
  to a place** (`column:…`) and **a town burned** as the columns came on (`burned:…`). Word of the Texas army's own movements does not
  count. **Never the world's truth**: a family that has not heard is refused however near the columns are, and another family's
  hearing is not its own.
- **Before the news**, the refusal says why, in plain words: *"Nobody has told the family to leave, and it has heard nothing yet to
  make it go: no word of the Alamo's fall, or of the Mexican army coming on. It waits for the order, or for the news."* The same
  sentence refuses the preparation works.
- **On the news** the family is told once in its journal that it may make ready and go now, and what that costs. Its main person's
  card (the order's card, sent as `early` beside the flight it has not got) opens with what it heard, the cost, and the load packed
  food first; its button is *"Leave now, before the order"*, asked twice (*"Confirm: leave now, and lose the crop"*). No "!": it is
  not a question the family must answer, and nothing lapses.
- **Making ready**: the hiding, the children's bundles and the milk cow are offered on the same news. Their marks wait on
  `household.readying` until the family has a flight, and go onto it at its order or when it leaves.
- **What going early costs**: **the crop in the field** - corn or cotton, growing or ripe - is left with nobody to tend it or bring it
  in, and **is lost** (the field bare, its plots unsown; the ground stays cleared and fenced). **The house is left empty**, with
  whatever was not loaded in it, open to the foragers and the fire as the rules already say; and **no day of grace** - the foragers
  reach an early leaver's house when they come, not a day after an order it never had (`burnMinute`). A family with nothing growing
  loses no crop, and is told so.
- **Its order never comes**: the settlement's day passes a family already gone. The flashback shows *"The family did not wait for an
  order to leave..."*, and the ending *"They went before any order came, on the word they had heard, and lost the corn in the
  field."*
- `ceiling:` only a family whose student chooses it leaves early. A family nobody plays, absent or on auto still waits for its
  order; an automatic early leave would want a rule for when a family deciding alone has heard enough.
- **The record**: families did go on the news (Covington, TSHA *Runaway Scrape*: *"when they received that news, people all over
  Texas began to leave everything"*; by February 20 *"every family in our neighborhood was preparing to go"*, Harris). **That leaving
  early cost the crop is not the record's**: Dr. Rose planted corn on March 1, left, and found it standing and wanting the plough
  when he came home (`HIST-TEX-640`). The cost is the owner's price for going early.
- **Old saves**: `readying` and `flight.early` are absent on every class saved before, which is a family that neither made ready
  nor left early; no save version moved.

## 20. Foragers take a stayer's goods — owner-decided 2026-09-29 (built 2026-09-30, not released)

The triage's D9 (c) (the design audit's S18: *"Staying home is gentler than fleeing"*). The owner chose the recommended option:
**"Foragers take goods"** - foragers take a stayer's goods in the zone too - and kept who is taken at home as it is (D1, *"As now"*:
one in two). `FIC-GONZ-992`. Code: `sim/scrape.mjs` `burnByForagers`, `takeStayersGoods`, `householdAsKnown`;
`sim/advance-word.mjs` `learnOwnBurning`; `sim/ending-story.mjs` `flightLine`.

- **What they take**: from a farm in the burn zone where the family stayed (or was still deciding), before they burn it, **every
  store** - food, seed, cotton, powder - and **every household good** of §18: the tools, the chest and the spinning wheel. **Not the
  coin** (a column that comes up with a family on the road takes none either) and **not the herd** (docs/STOCK.md; an open
  question). Whoever is at home is taken at one in two, as before.
- **Told plainly**: in the journal when the family learns its farm burned - by its own eyes, the smoke, the word or coming home -
  *"Before they burned it they took everything in the house: 30 food, 2 seed, a hoe, the chest..."*; and in the ending: *"They were
  told to leave in the spring and stayed on the farm. On April 13 foragers of Urrea's column burned it. They took everything in the
  house first: ..."*. The stay's own line warns of it when the family decides to stay.
- **Until the family knows**, its page shows the goods where they were (`unseen.taken`, read by `householdAsKnown`): the world has
  them gone, the family's own view does not.
- A family that went is not stripped as a stayer: what it left burns with the house (§18).
