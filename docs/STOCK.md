# The family's own stock

**Status: built 2026-09-20.** Owner, asked what stock should do: *"a herd that feeds you, **and the stock can be
lost**."* `sim/stock.mjs`, `tests/stock.test.mjs`, [injections](evidence/stock-injections.json) (26 of 26 caught).
Claims `FIC-GONZ-180` to `-185`, on the record of `HIST-TEX-112` and `HIST-TEX-263`.

---

## 1. What was there before, and why this is the largest thing the record had that the game did not

`household.stock` was a single boolean chosen in the lobby. It decided **the size of a family's land grant and nothing
else** — a labor (177 acres) without it, a league and a labor (about 4,600) with it — and
[LAND_GRANTS.md](LAND_GRANTS.md) said so plainly: *"Stock do nothing else yet."*

What the record has is a country made of stock. Almonte's survey of 1834, in Kennedy's summary (`HIST-TEX-263`):

| | Cattle | Swine |
|---|---|---|
| Department of the Brazos | about 25,000 | about 50,000 |
| Department of Nacogdoches | about 50,000 | above 60,000 |

**About 75,000 cattle and 110,000 hogs in the two American departments**, hogs outnumbering cattle two to one on the
Brazos, and Nacogdoches exporting 5,000 head of cattle and 90,000 skins in a year. A colony family's meat was mostly its
own stock; the deer was what it hunted between beeves. And the biome study of 2026-09-19 found that in this game **0 of
180 families had any stock at all**.

## 2. The four rules the record insists on

**They feed themselves.** Holley, 1836: *"Even in the winter season the pasturage is sufficiently good to dispense with
feeding live stock"*; the canebrakes fed cattle through the winter. Woodman, of hogs: raised *"on the native mast of the
country, **without trouble to the owner**"*. So there is **no fodder, no cost and no daily work** in this module. A herd
is not a burden; it is the thing that quietly feeds a family that has one. `tests/stock.test.mjs` holds it by running the
same class twice, with a herd and without, and asking what the family has to eat at the end.

**They increase where and when the country feeds them.** Calves in the spring (March, April, May), hogs on the autumn
mast (October, November, December). That is why the Brazos ran two hogs to every cow: a sow farrows twice a year on
acorns, pecans and hickory nuts that cost nobody anything.

**A beef cannot be kept.** Dilue Rose Harris: *"**When one man butchered a beef, he divided with his neighbors.**"* A
family in 1835 had no way to keep four hundred pounds of fresh meat, and the answer everybody used was the neighbours,
who would do the same next month. Pork is the opposite: less of it, and it salts down.

**And they can be lost.** They ran loose on an open range — that is what a league of grazing land *is* — and a family
that never rode out after them lost them. `HIST-TEX-263`: a "wild cow" on a colonist's prairie in 1835 is most likely
somebody's unbranded stock out of twenty-five thousand head running loose.

## 3. As built

| | What it is | Where |
|---|---|---|
| **The herd** | `household.herd = { cattle, hogs }`. A family that drove stock in opens with **6 cattle and 12 hogs**; one that did not has none. | `OPENING_HERD`, `herdOf` |
| **The save** | **No version moved.** A class saved before today has no `herd`, and the correct empty value is not empty: it is the herd that family's own lobby choice always implied. | `herdOf` |
| **Increase** | `CALF_SHARE` 0.12 of the cattle in each calving month; `PIG_SHARE` 0.25 of the hogs in each mast month. Reckoned on the first of the month, and the remainder decided by the class's own hash rather than by rounding. | `tickHerd`, `born` |
| **Straying** | A herd nobody has ridden after in `LOOKED_TO_DAYS` (30) loses `STRAY_SHARE` a month: **0.1 of the cattle, 0.05 of the hogs**. Cattle range further and are lost oftener. | `tickHerd` |
| **Riding the range** | *Ride the range after the stock*: a day's work. The stock is counted, the calves marked, and nothing strays for thirty days. | `look-to-stock`, `lookedToStock` |
| **Killing a beef** | *Kill a beef*: a day, **40 food**, of which the family keeps **15**. The rest goes to the nearest families within `BEEF_MILES`, at most four of them, and **both records say so**. With nobody near, it is lost. One cow fewer. | `butcher-beef`, `divideBeef` |
| **Killing a hog** | *Kill a hog*: half a day, **12 food, all of it kept**, because it is salted down. One hog fewer. | `butcher-hog`, `killHog` |
| **The road east** | Fleeing **leaves the whole herd on the range** — nobody drives cattle ahead of an army — and writes down what was left. **Amended 2026-09-27 (§8):** but one milk cow, driven by a child. | `leaveStock`, called from `sim/scrape.mjs`; `takeCow`, sim/flight-work.mjs |
| **Coming home** | Half the cattle and a quarter of the hogs are found again; the rest are gone, **and the hogs that are left have gone wild in the timber**. | `FOUND_AGAIN`, `findStockAgain` |
| **Families nobody plays** | The director deals stock to **three families in four** (`STOCK_SHARE`), by the class's own hash, taking a barrel of meal out of the wagon to make room where the load is full. It kills only when the house is down to a day or two of food, never below a breeding herd of `KEEP_CATTLE` 4 and `KEEP_HOGS` 6, and rides the range before the month is out. | `sim/neighbours.mjs` `dealStock` |

**Nothing here is drawn from a random stream.** Every calf, every pig and every stray is hashed from the class, the
family and the day, so a class replays the same herds and a student who saves and reloads gets the stock they had
(`FIC-GONZ-008`).

## 4. What it changed, measured

Six classes of thirty families, three periods (`scripts/biome-balance-study.mjs`,
[before](evidence/biome-balance-hunt-weather-after.json), [after](evidence/biome-balance-stock-final.json)):

| | Before | After |
|---|---|---|
| Ticks short of food, median family | 5 | **4** |
| Food in hand, median | 39.9 | **40.9** |
| Final number, median / mean | 60.5 / 66.43 | 61.5 / 65.16 |
| Houses lived in | 180/180 | 180/180 |
| **Sound logs within reach of the house, median** | **2,127** | **13,690** |
| Families that had to fetch logs from off their land | 16 | **2** |
| Jacales built for want of timber | 2 | 1 |

**The food and the score barely move. The land does.** Three families in four now hold a league and a labor instead of a
labor, which is four times the ground, so nearly every family has its own timber — and the two features built for the
family that has none (fetching logs in the wagon, and the jacal) are now rare among families nobody plays. **That is the
rule working, not a fault**: the 1825 law gave grazing land to a stock raiser (`HIST-GONZ-036`), and the great majority
of Austin's colonists took it. Before today the game had the rule and never exercised it. Two tests that are about a
family short of timber now say *"no stock in this class"* out loud, for exactly this reason.

Over a whole class, a family that keeps its herd ends with about the herd it started with, a little larger through the
mast: measured over twenty families, those that stayed home ended with 4 to 6 cattle and 6 to 21 hogs. **The families
that fled ended with nothing**, and that is the loudest thing this module does: fifteen of twenty left 6 or 7 cattle and
22 hogs each standing on the range when they went.

## 5. Ceilings

- `ceiling:` the herd is **two numbers on the household**, not a drove of animals on the map. Where they graze, which cow
  is whose, the brand and the mark are all outside it.
- `ceiling:` **the drive to Natchitoches is not modelled**, and it was the real cattle money (`HIST-TEX-263`: the cattle
  "are usually driven for sale to Natchitoches"). Nothing here sells stock for coin at all. The store's purse holds two
  reales; a cattle drive is a different kind of journey and belongs with the trade the game does not yet have.
- `ceiling:` **a share of a beef reaches ten miles**, because this game's families stand further apart than the record's
  neighbours did. A league is two and a half miles square, so a real colonist's nearest house was under three miles off;
  here a class is dealt across whole settlements and at four miles most families had nobody at all to divide with. The
  way out is to deal families nearer each other, not to send meat further.
- `ceiling:` the stock a family loses to the Mexican army is the wagon and the animals with it (`sim/road.mjs`), and the
  herd on the range is simply left. **Amended 2026-09-26 ([SCRAPE.md](SCRAPE.md) §4, `FIC-GONZ-465`):** where a column's foragers
  reach the farm, inside the burn zone, they drive off what they find, and a quarter of the cattle is found again on coming
  home, not half (`FOUND_AFTER_FORAGERS`); the hogs keep their quarter. Outside the zone the herd is simply left, as before.
- `ceiling:` **no milk, no butter, no hides off a family's own beef, no oxen bred from its own cattle.** Each is real and
  each is another kind of work. **Amended 2026-09-27 (§8):** one milk cow driven along on the Runaway Scrape gives a little
  milk; at home a herd still gives none. **Amended 2026-10-02 (§9):** milking is a work, at home (0.35 a day) and on the road (0.2), by a child of
  seven or a grown person, once a day.

## 6. What the record gave and what the game invented

**Given:** that stock fed itself on the range and the mast; that a beef was divided with the neighbours; that hogs
outnumbered cattle two to one; that stock ran loose and unbranded stock was there for the taking; that the Runaway Scrape
cost the colonies their stock; that a stock raiser held a league and a farmer a labor.

**Invented, and it is all numbers:** the opening six and twelve; the shares that calve and farrow; the month between
countings; the stray rates; forty food off a beef and fifteen kept; twelve off a hog; thirty days for a ride round the
range; half the cattle and a quarter of the hogs found on coming home; three families in four driving stock in.

## 7. Stock bought at the stock pens (owner, 2026-09-24)

> "players should also be able to buy more horses and other animals. they should be relatively expensive though."

Amends §5 and §6 ([TOWNS.md](TOWNS.md) §4d, `FIC-GONZ-389`, the prices `HIST-TEX-440`). Nothing here contradicted buying stock: §5's
*"Nothing here sells stock for coin"* is about a family selling its own, and stays true. So the stock pens of Gonzales, San
Felipe, Columbia and Victoria sell **a cow and calf for 10 reales** (two head; the ten dollars Parker, Almonte and a colonist's
letter all give) and **a hog for 4 reales or 14 food** (no hog price was found; see `HIST-TEX-440`).

- **The rules of §2 hold for bought head exactly as for the herd a family drove in.** They join `household.herd` at the counter
  (`addToHerd`), so they feed themselves, calve and farrow, stray if nobody rides the range, are divided when a beef is killed,
  and are **left on the range when the family flees** and half the cattle and a quarter of the hogs found again on coming home.
  No fodder, no daily work, no new rule.
- **Driven home**, not carried: at the ox team's pace (`LEAD_PACE`), which the buyer walks or rides at, and never a load. At most
  two cows and calves and six hogs on one trip (`ceiling:` a cap, not a rule).
- **A family that drove none in** starts a herd with what it buys. Its land grant is not made again - the league was given to a
  stock raiser at the arrival (docs/LAND_GRANTS.md) - and `ceiling:` its bought cattle run on the open range round a labor, as
  the record's loose stock ran, and nothing asks where they graze.
- **Priced so food never makes more food**: the hog's fourteen food is more than the twelve it gives butchered, and the cow and
  calf is coin only (the thirty food the two would feed the family is more than the wagon carries to pay with anyway).
- `ceiling:` **the families nobody plays buy no stock**; their director deals the opening herd (§3) and buys only a rifle again
  (TOWNS.md §4e).
- Horses and oxen bought are not stock in this sense: they are animals of their own on the map, led home on a halter, and are
  taken by the Mexican army with the wagon when a family is overtaken (sim/road.mjs), not left on the range. **Nor is a mule**
  (owner, 2026-10-03, *"buy a mule in town"*; [TOWNS.md](TOWNS.md) §4h): ten reales at the same pens, a mount and a pack animal of
  its own like the horse, never part of the herd, never butchered, and no part of what the herd feeds or is worth.

## 8. One milk cow on the run (owner, 2026-09-27)

Put to the owner in [CHILDREN.md](CHILDREN.md) §9, by multiple choice: *"A milk cow driven along on the Scrape (docs/STOCK.md keeps
the herd on the range and has no milk): (A) not built, as now; (B) one cow driven by a child, a little milk a day, lost if
overtaken - an amendment to STOCK.md."* The owner's choice: **"Yes, one cow"** (B). `FIC-GONZ-631`, FICTIONAL FOR GAMEPLAY.

This amends §3's road east and §5's *no milk*, and `FIC-GONZ-184`: the herd is still left on the range, **all but one cow**.

- **Only a family that had cattle.** Told to leave, a family with cattle in its herd (the lobby's or bought) is offered, on a child
  of seven to fifteen, *Drive the milk cow along* (`flee-cow`, sim/flight-work.mjs); a family with none is not offered it, and is
  refused it in words if it asks.
- **Driven by a child.** It is a child's job, so the child may dawdle over catching her up (docs/CHILDREN.md §4). When the family
  leaves with that child, one cow comes out of the herd and goes; the herd left on the range (`herdLeft`) is one cow fewer. The
  child's row says *"Driving the milk cow along behind the family."*, and the page draws her a step behind them.
- **A little milk a day**: `MILK_A_DAY`, 0.2 food, about half a grown person's day, on the road, at the refuge and on the way home.
- **The child's obedience applies**: on a day a child of a low roll lets her stray (`cowStrayChance`: three days in ten at a 1, one
  in a hundred at a 20) the day goes in finding her and there is no milk - *"The milk cow got away from Tom into the brush, and it
  was dark before he found her."* **She is never lost by straying.** If the child is gone, the eldest child with the family takes the
  rope, or a grown one.
- **Lost if overtaken**: the Mexican army takes her with the wagon and the animals (`overtake`, sim/road.mjs).
- **Home again** she goes back into the herd, before what is found of the rest is counted.

**The record**: none. No source read has a child driving a milk cow on the Runaway Scrape; boys drove range cattle by another road
(`HIST-TEX-641`). It is RECONSTRUCTED, and every number is the game's.

**Her pace** (owner, 2026-09-27, by multiple choice: **"Slow a family on foot"**; docs/CHILDREN.md §9 decision 6; `FIC-GONZ-631`
amended). This replaces the `ceiling:` that stood here ("she goes at the family's pace, whatever it is").

- **A family on foot goes at her pace**: with the cow along and no wagon, cart or carreta, nobody of the family goes faster than
  `COW_PACE` (sim/flight-work.mjs `cowPace`) - east, on to a further refuge, on foot after leaving the wagon, and home again.
- **Her pace is the game's pace for cattle driven on the road**, not a new number: sim/beasts.mjs `LEAD_PACE.cattle` (`FIC-GONZ-389`,
  cattle and hogs driven home at the ox's pace), which is sim/travel.mjs `WAGON_SPEED`, the ox team's "slow pace of the oxen", about
  two miles an hour (`HIST-TEX-093`). A cow driven on foot goes about as an ox does: **0.65 miles a tick, 1.95 miles an hour, 13.65
  miles in the road's seven-hour day**, against a walker's three miles an hour and twenty-one miles.
- **A family with a wagon, cart or carreta is not slowed by her**: it goes at the ox's pace already.
- A family already slower than she is - a child of five or under walking - is slowed no further; kept walking by the hand
  (`road-little-ones`), it goes at her pace and no faster. Taken by the army, she holds nobody back.
- **Why they are slower is said**: the driver's row, *"Driving the milk cow along behind the family: on foot, they all go at her
  slower pace."*, and the family's flight card, *"On foot with the milk cow, the family goes no faster than she walks, about two miles
  an hour."* The journey is marked `travel.cow`, absent on every journey before it: **no save version moved**.

Evidence: `tests/flight-work.test.mjs` (four tests: only a family with cattle and only a child, out of the herd; milk a day and the
roll; taken if overtaken and home to the herd; on foot at her pace and with a wagon not slowed), each regression seen failing alone
([childhood-injections.json](evidence/childhood-injections.json), the `cow:` and `cow pace:` rows).

## 9. Milking the cow (owner, 2026-10-02)

Asked by the food builder (docs/HUNGER.md §10: "no passive milk at home"), the owner answered: *"yes, but make it a chore that kids can do. on the road it can be done by adults and set to auto."* `FIC-GONZ-1073`,
FICTIONAL FOR GAMEPLAY. This amends §5's *no milk* and §8's *a little milk a day*.

- **At home**: a family with cattle in its herd (the lobby's or bought) has **Milk the cow** (`milk-cow`, sim/milking.mjs) on the bar
  of everybody of **seven** or more - a child's job (it may be dawdled over, docs/CHILDREN.md §4) or a grown person's. One cow gives
  **0.35 food** (`MILK_AT_HOME`, a grown person's day), milked **once a day**: a second milking is refused in words, *"The cow has
  been milked today; she gives once a day."* The herd is still two numbers on the household; nothing is drawn.
- **On the road east**, at a refuge and on the road home: the milk cow of §8 gives nothing by herself any longer. **Milk the cow**
  (`milk-road`) is on the bar of everybody with the family and the cow - grown people, as the owner named them, and a child of seven
  or more, since the child who drives her is beside her. **0.2 food** (`MILK_A_DAY`), once a day; nothing on a day she strayed
  (*"The milk cow got away into the brush today, and was found too late to milk."*). Her rope, her pace and her loss to the army are as
  §8 has them.
- **On auto**: anybody of ten or more set to it milks every day; set to it at home, they go on milking on the road east with the cow
  along, and at home again. A child on auto takes it up among its jobs, after the eggs (sim/childhood.mjs `JOBS_FIRST`).
- **No cow, no milking.** A family at home with no cattle is offered it **greyed, with its want - a cow** - only where its own town
  has the stock pens (§7, *"Buy a cow and calf"*), and the want's next step is that purchase; where the town has none it is not
  offered at all. A child is offered it only where there is a cow. Away from home it is refused, *"... is not at home."*,
  with no want, and so not kept on the bar (2026-10-02, the overlap proof in Gonzales). On the road it is never offered without the cow along.
- `ceiling:` **one milk cow** however big the herd. Worth counting cows only if a dairy ever comes into the game.
- The families the director runs are not milked: §8's 0.2 a day on the road is gone for them.

Evidence: `tests/milking.test.mjs` (seven tests), each regression seen failing under
[milking-injections.json](evidence/milking-injections.json) (16 of 16 caught); `tests/flight-work.test.mjs`'s milk test now proves
she gives nothing by herself.
