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
| **The road east** | Fleeing **leaves the whole herd on the range** — nobody drives cattle ahead of an army — and writes down what was left. | `leaveStock`, called from `sim/scrape.mjs` |
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
  herd on the range is simply left. Nobody drives it off, and nobody comes back to find it taken.
- `ceiling:` **no milk, no butter, no hides off a family's own beef, no oxen bred from its own cattle.** Each is real and
  each is another kind of work.

## 6. What the record gave and what the game invented

**Given:** that stock fed itself on the range and the mast; that a beef was divided with the neighbours; that hogs
outnumbered cattle two to one; that stock ran loose and unbranded stock was there for the taking; that the Runaway Scrape
cost the colonies their stock; that a stock raiser held a league and a farmer a labor.

**Invented, and it is all numbers:** the opening six and twelve; the shares that calve and farrow; the month between
countings; the stray rates; forty food off a beef and fifteen kept; twelve off a hog; thirty days for a ride round the
range; half the cattle and a quarter of the hogs found on coming home; three families in four driving stock in.
