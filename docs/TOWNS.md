# The towns: shops, trades and keepers

**Status: decided and built 2026-09-16** ([tests](../tests/shops.test.mjs), [browser](evidence/shops-browser.json)). Owner-decided;
read this before changing what a town sells or buys, who keeps its shops, or what a purchase does.
Claim `FIC-GONZ-038`. Code: `sim/shops.mjs`, the `visit-shop` chore and the `which-shop` / `shop-counter` asks in
`sim/chores.mjs`, keepers placed from `sim/town.mjs`.

---

## 1. What the owner asked for

> "each town should have a variety of stores buying and selling things for the game. gunsmith, blacksmith, etc.
> don't be afraid to add more as necessary. towns should fee alive."
>
> — 2026-09-16

| Question (multiple choice) | Owner's answer, 2026-09-16 |
| --- | --- |
| Which trades, beyond the store, the smith and the carpenter? | **All offered:** gunsmith; doctor; tavern or boarding house; tanner, saddler and cobbler; wheelwright; gristmill; weaver; and the blacksmith selling tools. |
| How are trades spread across the towns? | **Core everywhere, documented extras in the larger towns.** Every settlement has a store, a smith and a carpenter; the larger towns have the trades their research documents. Small places stay small. |
| Who keeps the shops? | **Invented people**, mixed Anglo and Tejano, as the game already does for Marta Ibarra; no real person is given words or prices they never had. |

## 2. What the research says a town had

From `docs/town-research/`. The richest list is Brazoria's for 1831: *a blacksmith, a gunsmith, carpenters, masons, two
doctors, several lawyers, a shoe cobbler, a boot and saddle cobbler, a weaver, a tannery, two general stores, a hardware
store* — and in 1835 its paper names four stores, a hotel, four doctors, a portrait painter and a wagon shop three miles
out. San Felipe had taverns, a hotel and a blacksmith shop; Columbia a hotel and a tavern; Mina is remembered with a hotel,
a gunsmith shop and a general store; Liberty's taverns and mills are later than 1835 on the evidence found. Brazoria is
not a settlement families are dealt to, so its trades inform the larger towns rather than standing anywhere.

## 3. Which trades stand where

| Town | Trades beyond the store and the carpenter | Why |
| --- | --- | --- |
| **Gonzales** | blacksmith (Josiah Pike, who was always there), gunsmith, doctor, tavern, tanner, wheelwright, mill, weaver, stock pens (§4d) | Every class on the invented country has only Gonzales. **Invented**: no 1835 Gonzales trade list was found; a municipality of about 900 (`HIST-TEX-011`) is given the street Brazoria documents. |
| **San Felipe** | the same eight, and the stock pens (§4d) | The colony's capital; taverns, a hotel and a blacksmith documented. |
| **Columbia** | blacksmith, gunsmith, doctor, tavern, tanner, wheelwright, weaver, stock pens (§4d) | Hotel and tavern documented; the lower Brazos's trades. |
| **Mina** | blacksmith, gunsmith, tavern | Hotel and gunsmith remembered; its mill came in 1838. |
| **Liberty**, **Matagorda** | blacksmith, tavern | Small. |
| **Victoria** | blacksmith, stock pens | Small; the stock pens since 2026-09-24 (§4d), because De León's colony's wealth was cattle and horses. |

A settlement no family is dealt near has no keepers. `TOWN_TRADES` and `KEEPERS` in `sim/shops.mjs` hold the table.

**Each keeper is a man or a woman as authored with their name** (2026-09-24): `KEPT_BY_WOMEN` in `sim/shops.mjs` (the
taverns everywhere and the weavers where there is one), `sex` on `RESIDENTS` and `CARPENTERS` and the `pronoun` of
`STOREKEEPERS` in `sim/town.mjs`. Before, no keeper had a sex and the map drew each by a hash of the id, so Marta Ibarra
could be an old man and Josiah Pike a woman. A class saved before is answered from the same tables by id (`townsfolkSex`),
so no save version moved.

## 4. What each trade does

Every offer says what it does before it is chosen and is refused in words when it cannot be done. A shop that sells takes
coin **or** food; a shop that buys pays coin from its keeper's purse (a real for each family near the town) **or** food.
Coin in either direction is in the ending's account.

| Trade | Offers | Does |
| --- | --- | --- |
| **Store** | seed 1 real / 3 food | Two sacks: enough to plant a cleared plot. |
| | powder and lead 1 / 2 | Three powder. The gunsmith gives five for its two. |
| | a sound hoe 2 reales, coin only | Iron comes a long way. Beside a worn hoe the new one goes into use (§4c). |
| | sell food, a real for every 5, coin only | Whole reales only: what will not make five stays in the house. |
| | sell cotton, 1 real or 2 food a whole bale | The weaver, where there is one, gives three food. |
| **Blacksmith** | felling axe 3 reales / 6 food; auger 2 / 4; broadaxe 3 / 6; froe 1 / 2 | The tool; another beside one the family has (§4c). The auger is what most furniture wants. |
| **Gunsmith** | powder and lead 2 / 4 | Five powder. |
| | a rifle 8 / 16 (§4c) | Another hunter out at once, or a rifle at home while a man is at the war. |
| | the rifle put in order 2 / 4 | For the next ten shots, a hand without the knack makes the long shot; a tired hand still misses. Said on the shot. |
| **Doctor** | see the doctor 2 / 3 | Tired: well at once. Hurt: mends in half the time left. Refused for somebody well. |
| **Tavern** | a meal and the talk 1 / 1 | Eight miles off the legs, and the family learns every public report it has not had, as *Talk at the tavern*. |
| **Tanner, saddler, cobbler** | sell hides, 1 real or 2 food each | A deer taken brings a hide home. |
| | shoes 2 / 4 | A mile on foot tires the family 15% less. |
| | a saddle 3 / 6 | A mile on the horse tires the rider a quarter less. Refused with no horse. |
| **Wheelwright** | the wagon put in good order 2 / 4 | The ox and wagon go 15% faster. Refused with no wagon. |
| | a new wagon 100 reales, coin only (§4f) | Driven home behind an ox bought with it at the stock pens; two wagons are two loads out at once. |
| **Mill** | have corn ground (the miller's toll is taken in meal) | The food carried goes a fifth further. |
| **Weaver** | sell cotton, 1 real or 3 food a whole bale | More food a bale than the store's two. |
| | blankets 1 / 2 | Sleeping by the wagon mends a quarter better. |
| **Stock pens** (§4d) | a horse 25 reales, coin only | Led home on a halter; another rider out at once. |
| | an ox 15, coin only | Led home at an ox's pace; drags logs, or pulls the wagon while the other ox is out. |
| | a cow and calf 10, coin only | Driven home to the herd (docs/STOCK.md). |
| | a hog 4 / 14 | Driven home to the herd. |

Until 2026-09-17 the five things the store does were also five errands of their own on the family panel - fetch seed,
buy powder, sell food, take the cotton to the store, buy a hoe - so a student had two ways to the same counter, with the
prices written in two places and no way to compare them with anything else the street sells. They are the store's own
trades now, at exactly the prices those errands paid. The errands themselves still exist for the families nobody plays:
their director sends them on one (`directorOnly` in `sim/chores.mjs`), which is why a neighbour is still seen walking to
town for seed.
## 4b. The errand chosen before anybody leaves, and one person at a time with a thing (owner, 2026-09-24)

> "When sending someone to town to stores, there should be a popup first asking what they should buy or sell. (Currently I
> can't buy more seed.) They'll take priority on the wagon and take it so they can carry whatever it is they need to. If
> someone is using the wagon (or horse, or any item really), then no one else can use it."
>
> — the owner, 2026-09-24

**Status: built 2026-09-24** (`sim/errands.mjs`, `sim/keeping.mjs`, `public/errand.js`; [tests](../tests/errands.test.mjs),
[browser](evidence/errand-browser.json)). Claim `FIC-GONZ-387`. It amends §5 below: nothing is asked in town any more.

### Why the seed could not be bought

`visit-shop` walked a person to town and only then asked two questions - which shop, then what at its counter. Each waited
two hours of 1835 (`ASK_PATIENCE`) and was then answered alone, and alone the answers were *Come home again* and *Nothing
today*. Two hours is six ticks: under a minute at the study pace, six seconds at the quick one, and **no time at all for a
person on auto**, whose questions are answered the tick they are asked. A student who had turned auto on (as the owner's
solo game of 2026-09-21 shows, auto switched on the tick before the trip) or was looking at anybody else when the walker got
to town, got the walk and never the seed. The seed itself was never refused: the store sells it for a real or three food,
and a node run and a browser both bought it for anybody who answered in time.

Found on the way, and mended: the store's hoe has no food price, but the counter offered *"Buy a sound hoe: null food"* and
took nothing for it (`counterOptions`, `counterRefusal`).

### The popup

**Go to town to trade** on a person's row opens a list instead of sending anybody: every offer of every shop standing in the
family's own town today, grouped by shop and keeper, each with its price in coin or food (the shop's own), what one of it is,
why it cannot be had when it cannot (*The family already has a felling axe.*), a count and a Coin/Food choice. Beside it the
family's stock, and once there is something on the list the stock after it and **how the person will go, in the server's
own sentence**: *"Takes the wagon: 14 of 20 loads, more than the horse carries (7)."* A refusal is the server's sentence too,
shown in the popup, and Send stays shut. Enter sends; Escape closes and sends nobody. While it is open the ability bar steps
aside, as it does for a rider (owner, 2026-09-22, FAMILY_PANEL.md §12.13), and is back the instant it closes. Everything in
it comes from `GET /api/errand` (the family's own person and town only; fetched when it opens and whenever the list, the
family's stock or that person's ways of going change - never on the tick). The one order is `{ action: 'chore', chore:
'visit-shop', entityId, errand: [{ id: 'trade:offer', n, pay }] }`, its id made as every command's is, after the spread.

### The rules (sim/errands.mjs)

- **What a line counts**: purchases of what a shop sells (two seed a purchase), lots of what it buys (five food a real, a
  bale, a hide), food for the mill. Things bought once - a tool, shoes, the rifle put in order, the doctor - one at most.
- **In what order**: what the family sells first, then the mill, then what it buys, each in the list's order - so the coin or
  food a sale brings can pay for a purchase, whichever the student put first.
- **Checked when it is sent**, against what the family has now: the shop is standing there; the shop's own refusal; the
  family has what it sells and can pay what it buys; the load fits a way of going it has free. **Not** checked: a keeper's
  purse, which a family finds out at the counter (owner, 2026-09-12, MONEY_AND_GLORY.md §3). The store buys cotton and food
  for coin outside its purse (owner, 2026-09-16, §8.1); the tanner and the weaver pay from theirs.
- **If things differ on arrival** (the honest rule, deterministic, no chance in it): prices never move, so a price cannot
  differ. What can is what the house holds, whether a keeper is at the shop, and a keeper's purse. At each line as many are
  done as can still be paid for, **nothing is paid for anything not received**, and what was not done is said in the family's
  story with the reason (*"could do only 1 of 3: buy seed - It costs 1 real, and there is not that much coin in the house."*).
- **The load**: every good a load a unit, in the house's own units (`sim/travel.mjs` `carry`: foot 5, horse 7, wagon 20); coin
  weighs nothing; a tool, shoes, a saddle or blankets a load; the rifle a load each way. The larger of what is carried to town
  (what is sold, food to pay with that no sale in town already paid, corn for the mill) and what is carried home.
- **The way of going**: the server chooses **the quickest way that carries the load that the family has free** - the horse,
  then on foot, then the ox and wagon - and takes it at the moment the errand starts; the popup shows it and why. Taken, it is
  the person's until it is home (below). The wheelwright works on the wagon itself, so a list with him takes the wagon. A load
  that wants the wagon while somebody else has it is refused with who has it and what to do: *"This wants the wagon: 10 loads,
  and the horse carries 7. Rosa has the ox and wagon, on the road to Gonzales. Send a smaller load, or wait until the wagon is
  free."*
- `ceiling:` what is bought is the family's at the counter, as every errand has always paid out; the goods are not a load held
  on the road that could be lost on the way home.

### One person at a time with a thing (sim/keeping.mjs `userOf`)

The one rule every order that needs a thing asks, in one place. A thing is held in one of two ways: **on the road or standing
with somebody away from home** (`borrowedBy`, read against where the beast is - 2026-09-16), or **by the work somebody was
given** (`chore.with` on the person, written when the work begins): the rifle for a hunt (in the timber, on the family's land,
small game, at the mark, from the camp on the road east); the ox for hauling logs behind it; the ox and wagon for a harvest
that wants them (shared by everybody bringing in the same crop, and nobody else's to drive off); and the beasts of a journey
the work will make, from the moment it is given until the road begins. The refusal names the holder and what they are doing:
*"Mateo has the rifle, on the road to the timber on the Guadalupe River."*, *"Rosa has the ox, dragging 6 logs behind the ox."*

**Every way a use ends lets go of it, because the use is part of the work or the journey**: home again; the work finished,
called off, dropped for a call or the march, or dropped when the family flees east; the person dead or taken (never counted
as holding anything). A refused order holds nothing. The flight east takes whatever beasts stand at home, as it always did
(sim/scrape.mjs); a beast away with somebody is not at home to take. A family nobody plays is run through the same
`choresFor` and `modeAvailability`, so the director obeys the rule; auto too.

**Old saves** (the one door, `server/storage.mjs` `readSave`): work in hand is given what it holds from the work itself -
`sim/chores.mjs` `deriveUses` - so a hunt opens holding the rifle, a load behind the ox the ox, a harvest that wants the wagon
the ox and wagon, a journey still to come its beasts. Somebody in the middle of the old walk to the shops goes on with it
under the name `visit-shop-street`, offered to nobody. No save version moved.

### Decided by the owner, 2026-09-24 (the four questions left open that morning)

Built the same day on v2026.09.24.4 ([tests](../tests/war-rifle.test.mjs), [injections](evidence/war-rifle-injections.json),
13 of 13 caught; [study](evidence/rifle-food-study.json)).

1. **"Tools: hold the felling axe off the land."** The felling axe is one person's while they carry it away from the
   family's own land - fetching logs, a bee tree, a small tree for furniture from timber past the family's line (a place
   outside `holdingOf`'s bounds) - from the moment the work is given until they are home (`axeHome` on arriving). Nobody fells,
   builds, cuts a lane through timber or clears a timber plot with it meanwhile, and the refusal names who has it: *"Rosa has the
   felling axe, on the road to the timber on the Guadalupe River."* **At home all tools stay shared as before**: work that uses
   the axe on the family's own land holds it *shared* (`chore.shares`) - felling, the house when its pieces want the axe, a lane
   or a clearing through timber - so any number of the family work it together, and nobody carries it off while they are at
   it (*"Mateo has the felling axe, felling a post oak."*). House work stops by itself when the log pile runs short
   (sim/houseplot.mjs), so fetching logs is never locked out for good. The hoe, broadaxe, froe and auger never leave the land
   and are not held. Every way the trip ends lets it go: home, called off, dropped, the person dead or taken.
2. **"The rifle and the war: he takes the rifle."** A man who turns out for his settlement's call (sim/calls.mjs), goes
   upriver with the march (sim/directors.mjs `handleMarch`), or leaves to enlist or to join the garrison, the relief, the
   Matamoros men or Houston (the winter's chores, `war`) carries the family's rifle for as long as he is away
   (`person.carries`, sim/keeping.mjs `takeToWar`). Nobody at home can hunt or practise; the refusal names him in the words he
   went with: *"Alvin has the rifle, gone with the volunteers to Gonzales."* He has it on the march and in the ranks, and until he
   is in the yard again (sent for, released, shut out and turned back, the period's end setting him down at home). **The dead,
   the captured and the prisoners hold nothing** (`homeAgain`); **amended the same day (§4c): the rifle is lost with them.** Until then: `ceiling:` the rifle is not lost with them, because nothing in
   the game sells a rifle and a family left without one could never hunt again. If somebody of the family has the rifle out
   hunting when he goes, he goes without it, and the story says so. Carrying food to Gonzales ("help") is not turning out and
   takes no rifle. The family owns one gun: no second gun exists anywhere in the game (the wagon's load, the house, the shops),
   and none was invented. Old saves: a man away at the war opens with the rifle (`deriveUses`, from his active commitment or
   service).
3. **"One rifle per family: keep it, and measure."** Kept. Measured over all three periods - autumn, winter, spring - on four
   classes of fifteen families nobody plays on the colonies, before (two hunters at once, the rifle at home: 45023e7) and
   after (one rifle, gone to the war with whoever turns out): mean food a house at each period's end 37.9 / 65.1 / 12.1 before
   and 34.9 / 64.3 / 12.4 after; household-ticks with no food in the house **914 before, 743 after**; houses that ever ran out
   34 and 34; **deaths 14 and 14, the same fourteen people** in both. Nobody starved who would not have before. Nothing was
   retuned. (`scripts/rifle-food-study.mjs`, [record](evidence/rifle-food-study.json).)
4. **"The way of travelling: let the student choose."** The popup still suggests the quickest way that carries the load, from
   the server, marked *(quickest)* and chosen. Among the ways the student may choose any slower way that still carries it and
   is free - walk, so the horse stays home. A way that cannot go is shut, with the server's reason under the row (*"With the ox
   and wagon: Alvin has the ox and wagon, on the road home."*, *"On foot a person carries 5, and this is 6 loads."*). The order
   carries the chosen `mode`; the server checks it against the same reckoning and refuses it in that way's words, and an order
   with none goes the quickest way, as before. A choice is said: *"Goes on foot: 3 of 5 loads, as you chose. The horse would be
   quicker."*
   **Widened the same day to every journey** (owner, 2026-09-24: *"when sending someone to travel, the game should ask how
   they'll travel"*; [FAMILY_PANEL.md §15](FAMILY_PANEL.md)): the errand's ways are now reckoned by the one function every
   journey asks (`sim/going.mjs` `waysFor`) and drawn by the one component (`public/going.js` `drawWays`), a card a way with
   its pace, time there and load, the reason for a shut way on the card itself. The sentences above are unchanged.

### 4c. More than one of a tool, and tools bought in town (owner, 2026-09-24, after v2026.09.24.4's four answers)

> "players should be able to send someone to buy more rifles, hoes, tools in general."
>
> — the owner, 2026-09-24

**Status: built the same day** (`sim/tools.mjs`; [tests](../tests/tools.test.mjs), [injections](evidence/tools-injections.json),
13 of 13 caught). Claim `FIC-GONZ-388`. It amends §4 (the tool rows) and §4b's decision 2 (the rifle's `ceiling:`).

- **Counted, not flagged.** A family owns a count of each tool - rifle, hoe, felling axe, broadaxe, froe, auger - and each copy
  keeps its own wear (only the hoe wears). Stored so every class saved before opens as it was: `household.tools` unchanged (the
  family has one; its number is the wear of the one in hand), `household.spares` the wear of each copy beyond the first, and
  `household.rifles` the rifles, absent meaning the one rifle every family has always had. No save version moved.
- **The hoe in hand is the soundest.** A new hoe bought beside a worn one goes into use and the worn one waits to be mended
  (*Mend the hoe* mends the most worn copy); a sound spare is taken up the moment the one in use wears out. Planting waits only
  when every hoe is worn. The store's hoe is still two reales, coin only - there is still no food price, so the "null food"
  hoe of 2026-09-24 stays mended.
- **Sold where the docs put them.** The store sells the hoe; the blacksmith the felling axe, auger, broadaxe and froe, at the
  prices of §4; none is refused any longer for the family already having one. **The rifle is new to the shops: the gunsmith
  sells it**, since a rifle is his work - Gonzales, San Felipe, Columbia and Mina have one (§3), and Liberty, Matagorda and
  Victoria, with none, sell no rifle. **Eight reales or sixteen food** (`FIC-GONZ-388`, invented: `ceiling:` no 1835 Texas price
  for a rifle was found; it is the dearest thing on the street, as `HIST-GONZ-027` has settlers told to bring their outfit
  because the country could not supply it; a price from the record replaces it). At most four of a tool and two rifles on one
  trip (`ceiling:` a cap for the popup, not a rule). A tool is a load (the rifle one each way to the gunsmith for putting in
  order, one home when bought), and the way of going chosen still has to carry it. **No credit**: the list is paid from the coin
  or food the family has, reckoned before anybody leaves and again at the counter (§4b).
- **One copy held, not the kind** (sim/keeping.mjs `userOf`). Each person holds one copy: two rifles are two hunters at once, or
  a man at the war and a hunter at home; a second felling axe goes off the land while the first fells at home (the work at home
  shares one copy among all of it). A refusal comes only when every copy is out, and names everybody who has them: *"Alvin and
  Mateo have both rifles."* A family with no rifle left is told *"There is no rifle in the house. The gunsmith sells them."*, and
  a man who goes to the war then goes without one, and the story says so.
- **The rifle is lost with the man who carried it** (the honest rule now that rifles are sold; it replaces §4b's `ceiling:`).
  A man killed, captured or taken prisoner at the war does not bring the family's rifle home: it is gone (`homeAgain`), the
  story says so (*"The family's rifle was lost with Alvin. There is no rifle in the house now; the gunsmith sells them."*), and
  the family may buy another. A man who comes home brings his home. **Open for the owner:** whether a rifle lost this way should
  instead come back with the survivors of a surrender (Goliad's men were disarmed; nothing here models that either way).
- **Measured** ([record](evidence/rifle-food-study.json), `afterTools`): the same four classes of fifteen families nobody plays,
  three periods. **None of them bought a rifle**: the director of a family nobody plays never sends anybody to the shops
  (sim/neighbours.mjs has no errand to town), so buying is a student's. Fourteen rifles were lost with the fourteen dead, and
  those fourteen families ended the class without one. Food and hunger moved by less than a food a house: mean food at the three
  period ends 34.9 / 64.3 / 12.4 (before this change) and 34.9 / 64.3 / 12.5; household-ticks with no food 743 and 743; houses
  ever out of food 34 and 34; deaths 14 and 14, the same people - the deaths come late, in the spring's fighting, so a lost rifle
  costs little hunting in what is left of the class. Nothing was retuned.

### 4d. Horses, oxen and stock bought at the stock pens (owner, 2026-09-24)

> "players should also be able to buy more horses and other animals. they should be relatively expensive though."
>
> — the owner, 2026-09-24

**Status: built the same day** (`sim/beasts.mjs`, `sim/shops.mjs` `stockman`; [tests](../tests/beasts.test.mjs),
[injections](evidence/beasts-injections.json), [browser](evidence/errand-browser.json)). Claim `FIC-GONZ-389`, on the prices of
`HIST-TEX-440`. It amends §3 and §4 (a new trade), §4b (a beast is one of several; what is led home is not a load) and
[STOCK.md](STOCK.md) §7.

- **Who sells them.** No town's research lists a livery or a stock dealer, so the trade is added the documented way: **the stock
  pens**, kept by an invented stock trader, in the larger towns - Gonzales (Anselmo Treviño), San Felipe (Amos Birdwell),
  Columbia (Gideon Marsh) - and in **Victoria** (Tomás Villarreal), whose colony's wealth was cattle and horses
  (docs/town-research/victoria.md §7.7). Mina, Liberty and Matagorda stay small. The emigrant was told to buy his stock in Texas:
  *"The emigrant had better buy his cattle and horses here; for those brought from a more northern climate do not thrive well"*
  (Parker, `HIST-TEX-440`). In Gonzales the pens are the open shed drawn at the west edge of town; elsewhere the next of the
  town's ordinary houses (a stand-in, docs/ART_REQUESTS.md). The trade is last in each town's list, so every other keeper of a new
  class keeps the building they had.
- **What, and for how much.** One real to the dollar of the record. Parker, in Texas the winter of 1834-35: *"a good serviceable
  horse may be bought for, from twenty to thirty dollars; a cow with a calf by her side, for ten dollars; and a yoke of oxen for
  about thirty dollars"*; Almonte (1834) and a colonist's letter printed by Woodman (1835) give the same ten dollars for a cow
  and calf. So **a horse 25 reales, an ox 15** (half the yoke), **a cow and calf 10** (two head), and **a hog 4 reales or 14
  food** (no price for a hog was found; pork was $4.50 the hundredweight at Nacogdoches in 1834, Woodman). Against the rifle's
  8 reales (`FIC-GONZ-388`): **a horse is 3.1 rifles, an ox 1.9, a cow and calf 1.25, a hog half of one.** `ceiling:` the scale -
  a real to the dollar - is the game's own; the rifle was never priced from the record, and a rifle price from it would set the
  scale instead. The hog is cheaper than a rifle because the record's hog is a fraction of a cow and calf; the owner's
  "relatively expensive" is met by the horse, the ox and the cattle.
- **Coin only, but the hog.** At the two food a real a dear thing takes at a counter (the rifle, the tools) a horse would be fifty
  food, and food paid is carried to town (§4b): more than two wagons carry. So the horse, the ox and the cow and calf take coin,
  as the store's hoe does. The hog takes fourteen food, which the wagon carries and which is more than the twelve a hog gives
  butchered, so food is never turned into more food by buying a hog and killing it. `ceiling:` payment in kind - cattle for a
  horse; the record has *"a cow and calf being rated at ten dollars"* as money - is the way out. **No credit**, as in §4c.
- **Each animal its own.** A horse or an ox bought is a new animal beside Bess the mare and Juniper the ox, with an id that never
  changes (`hh-1-horse-2`, `hh-1-animal-2`) and a name in the order it was bought (*Dandy the gelding*, *Kit the mare*, ...;
  *Buck the ox*, *Berry the ox*, ...), drawn with the family's own horse and ox figures. At most four horses and four oxen a
  family (`BEASTS_MOST`, `ceiling:` a cap for the family's own projection, counting any the army took). **Two horses are two
  riders**: `userOf` holds one animal a person, the chooser of every journey offers the second horse while the first is out, and
  the refusal comes only when every one is out: *"Alvin and Mateo have both horses."* A second ox drags logs while the first pulls
  the wagon. ~~**Not sold: a second wagon.** The record's wagon shop stood three miles out of Brazoria, where no family is dealt
  (§2), a cart was a hundred dollars at San Patricio (Woodman), and the family's wagon is also its load in (docs/SETTLING_IN.md).
  `ceiling:` one wagon a family; a wheelwright who builds wagons would lift it.~~ **Lifted by the owner, 2026-09-25 (§4f):** the
  wheelwright sells a wagon, and a large family comes with more than one.
- **How it comes home: on a halter.** A horse or an ox bought is not ridden or yoked home. It walks home led by its buyer, beside
  them on the same road, whichever way they go - on foot, on the family's horse (the buyer rides the horse they came on), or tied
  behind the wagon - and is theirs until it is in the yard (`person.leads`), where it is set down a few rods west of the house beside the family's
  first animals (`yardSpot`). On the road it is drawn a length behind whoever leads it. **One person leads one animal** (*"One person can
  lead one animal home: a horse or an ox, not both. Send somebody else for the other."*). A led horse keeps up with anybody; **a
  led ox, and cattle and hogs driven, hold whoever brings them to an ox's pace** (`LEAD_PACE`, two miles an hour, `HIST-TEX-093`),
  so a rider leading an ox comes home at the ox's pace. Nothing led or driven is a load. The popup says so with the way of going
  (*"Rides the horse: 0 of 7 loads. Leads the new ox home, at an ox's pace."*) and each way's card gives the time home (*"Home in
  about 7 hours."*). Somebody who drops the errand in town still leads the animal home on their next road; somebody killed or
  taken leads nothing, and the animal stands where they were, free to whoever of the family comes to it.
- **Cattle and hogs** join the herd at the counter ([STOCK.md](STOCK.md) §7): they feed themselves, increase, stray if nobody
  rides the range, are divided when butchered, and are left on the range in the Scrape, as the herd is. A family that drove no
  stock in starts a herd; its land grant is not made again.
- **The flight east** takes every animal standing at home, the bought ones with the first, and soldiers who overtake a family take
  them all, said by the number (*"took 4 horses, the ox, the wagon"*).
- **Fog of war.** Another family's animals never reach a student: only a family's own entities are in its projection, and people
  are all that is seen of anybody else. The popup's animal line is the family's own.
- **Old saves.** Nothing old is read another way: the first horse, ox and wagon are found by the ids they always had, an animal
  with no `species` (a class saved before there were horses) is an ox, and a class saved before this has no stock pens - like
  every trade added after a class began, it is not added to a class in progress (§6). No save version moved.

### 4e. The families nobody plays buy a rifle again (owner, 2026-09-24)

> "have automatic families buy a replacement rifle."
>
> — the owner, 2026-09-24

**Status: built the same day** (`sim/neighbours.mjs` `rifleErrand`; [tests](../tests/rebuy.test.mjs),
[injections](evidence/beasts-injections.json), [study](evidence/rifle-food-study.json) `afterRebuy`). Claim `FIC-GONZ-390`. It
amends §4c's measurement and §7's last line: the automatic neighbours use the shops, for this one thing.

- **When** (the director's own rules, deterministic, nothing drawn): the family owns **no rifle** - none in the house and none
  away with a man at the war, who brings his home; **somebody free** at home to go (the director's idle hands; one at a time,
  never a second while the first is on the way); and it can pay **without credit**, in **food** while what is left keeps **the
  floor** (`rifleFloor`: three food for every grown person's share it eats, `FOOD_KEPT_PER_PERSON`, the larder it keeps before any
  trade, about eight days' eating), else in **coin**. Food first, as the director values a real at three food. `ceiling:` the
  floor is that larder, not a reckoning of the weeks to the harvest or of the game the rifle will bring.
- **Where**: the nearest town with a gunsmith keeping shop - Gonzales, San Felipe, Columbia, Mina - by the road on foot; its own
  town when it has one. A family of Liberty goes to San Felipe, one of Matagorda to Columbia.
- **How**: the student's own errand (`visit-shop` with `[{ id: 'gunsmith:buy-rifle', n: 1, pay }]`, and the town when it is not
  the family's own), the same server checks, and the quickest way that works (sim/going.mjs), as every order sent with no way.
  An absent student's family, the director's since docs/HOST_PAGE.md, does the same.
- **Measured** (`scripts/rifle-food-study.mjs`, the same four classes of fifteen families nobody plays, three periods, on the tree
  before this and after): **all 14 rifles lost with the dead were bought again** (none before), 1 to 10 days after the loss (median 3), between
  March 6 and 24, every one paid in 16 food; three families went to another town's gunsmith (Liberty to San Felipe, Matagorda to
  Columbia twice); no family ended the class without a rifle (14 before). Mean food at the three period ends 34.3 / 65.4 / 12.6
  before and 34.3 / 64.0 / 12.5 after (the rifles are paid for in food in March, which the winter period's end counts);
  household-ticks with no food 755 and 749; houses ever out of food 34 and 35; **deaths 14 and 14, the same fourteen people** -
  the rifles are lost late, in the spring's fighting, so a rifle bought again hunts little of what is left. Nothing was retuned.

### 4f. A new wagon at the wheelwright's (owner, 2026-09-25)

> "families should arrive with an appropriate number of wagons. larger families get more than one wagon based on their
> population. research first. wheelwright sells one, very expensive."
>
> — the owner, 2026-09-25

**Status: built the same day** (`sim/shops.mjs` `buy-wagon`, `boughtWagon`; `sim/errands.mjs`; `sim/going.mjs`;
[tests](../tests/wagons.test.mjs), [injections](evidence/wagons-injections.json), [browser](evidence/errand-browser.json)). Claim
`FIC-GONZ-392`, on `HIST-TEX-441`. It lifts §4d's "Not sold: a second wagon"; wagons by the family's size are
[SETTLING_IN.md §4a](SETTLING_IN.md).

- **Who sells it.** The wheelwright, where a town has one: Gonzales (Rafael Cantú), San Felipe (Obadiah Fenn), Columbia (Levi
  Stroud) - each of which also has stock pens. The record has no wagon made in Texas (*"There was no one that made wagons or
  carts. There was a wheelwright ... but could not do heavy work"*, Harris); the wheelwright who builds one is the game's own.
- **How dear.** **A hundred reales, coin only** - the dearest thing in the game: four horses, twelve and a half rifles. No price for
  a wagon in Texas before 1836 was found; the one number is a cart's, *"Carts rate at $100, here"* (a colonist's letter in Woodman,
  1835), and a wagon was the bigger thing, so the cart's price at a real to the dollar is a floor under it. `ceiling:` a wagon's
  own price from the record replaces it. Coin only: two hundred food at the counter's two food a real is ten wagon loads to town.
  **No credit**, as in §4c.
- **How it comes home: driven, behind an ox bought with it.** A new wagon has to be drawn home, so **an ox from the stock pens goes
  on the same list** (the popup refuses the wagon alone: *"A new wagon has to be drawn home, and an ox draws it. Put an ox from
  the stock pens on the list too."*). At the counter the ox is bought first whichever way the list reads, and is **yoked** to the
  new wagon instead of led; the buyer drives it home at the wagon's pace (*"Drives the new wagon home behind the new ox, at an ox's
  pace."*). If the ox could not be bought - nobody at the pens that day, the coin short - the wagon is refused at the counter in
  words (*"There is no ox with Soledad to draw a new wagon home. The wheelwright keeps it until one comes."*) and nothing is paid
  for it.
- **One person drives one wagon.** Whoever fetches it goes **on foot or on the horse**, never by the ox and wagon (that way is shut
  on the popup: *"One person drives one wagon home. Whoever fetches the new wagon goes on foot or on the horse."*). A horse ridden
  in walks home tied on behind the new wagon (`leads`), so a rider cannot also lead home a horse bought the same trip. The
  wheelwright cannot both put in order the wagon brought to him and send the buyer home in a new one: separate trips.
- **Its own wagon.** `hh-1-wagon-2`, *Second wagon*, with its own place in the yard beside the family wagon (every beast and
  wagon home from the road now stands on its own spot along the rail, sim/beasts.mjs `yardSpot`), counted by `userOf`: two wagons
  are two loads out at once. At most four a family (`BEASTS_MOST`). Putting the wagon in good order is still once for the family
  (`ceiling:`).
- **Fog of war.** Another family's wagons never reach a student: only a family's own entities are in its projection.
- **The families nobody plays** buy no wagon (owner: rifles only).
- **Old saves.** A class saved before has the wheelwright it had, whose counter now also offers the wagon; nothing old is read
  another way, and no save version moved.

## 5. How a student uses it

**Since 2026-09-24 (§4b):** the **Go to town to trade** icon opens the popup; what to buy and sell is chosen before anybody
leaves, and nothing is asked in town. Until then: the icon sent them to the family's own town; on the street they were asked
which shop, and at the counter what to buy or sell, and nobody answering came home having spent nothing. The keepers stand at
their doors in the town and are seen, like anybody, only when one of the family is there.

## 5a. Where each keeper keeps shop (owner, 2026-09-16)

> "Use one of the pre-existing buildings per shopkeeper for places already built. for new locations give each shopkeeper
> their own place."

- **Gonzales is already built.** Each keeper takes one of the buildings `public/gonzales-art.js` draws, and that building
  is labelled with the shop: Marta Ibarra the general store and Josiah Pike the ironworker's yard, as always; the tavern,
  wheelwright, gunsmith, tanner, doctor, weaver, carpenter and mill each one of the town's houses (`GONZALES_PLACES` in
  `sim/shops.mjs`). A test reads the drawing and holds every place to its building, and no two keepers share one.
- **Every other settlement is new.** Each keeper, the store and the carpenter included, has a building of their own round
  the town's centre, drawn with the nearest building the library has for the trade (a stand-in, see `docs/ART_REQUESTS.md`)
  and labelled close up.
- **Shops are in the map** (`world.map.shops`), so a town's buildings are drawn for anybody; the keepers themselves are still
  seen only by somebody of the family standing in the town. A keeper stands at their door and steps out to the street and back.

## 5b. The towns drawn (2026-09-16)

Owner: "start drawing the town layouts." The six settlements families are dealt to — San Felipe, Victoria, Mina, Matagorda,
Columbia and Liberty — are drawn from the layout sketches in `docs/town-research/<town>.md` §7 (`FIC-GONZ-042`).

- **One source for the page and the server.** `sim/town-layouts.mjs` is pure data with no imports; the server serves it as
  `/town-layouts.js` and `public/town-art.js` draws from it, and `sim/shops.mjs` reads the same file to put the keepers in.
- **Each town in its research's own frame**: feet, turned to the measured bearing of its surviving grid (Victoria N 20.7° E
  on its cross-axis, Matagorda N 60.5° E, Columbia 104.8°, Liberty 88.78°, Mina cardinal) and set on the map's site point by
  an `anchor`. San Felipe's frame is invented in the research, so its sheet is turned to put its river side toward the Brazos.
- **What is drawn**: the platted streets (those not yet built along drawn faint), the public squares, every building the
  research names in its sketch with the sprite it suggests, and the ordinary houses placed on lot centres nearest the
  documented centre, the number the research reasons to (`dwellings`, repeatable arithmetic). **Rivers, bays and creeks
  are not drawn from the sketches**: the map's own watercourses are real, and a test holds every building clear of them
  (300 ft of a river, 40 ft of a creek).
- **Keepers in drawn buildings** (owner, 2026-09-16, §5a: "use one of the pre-existing buildings per shopkeeper for places
  already built"): a trade the research ties to a documented building keeps it — San Felipe's smithy, Peyton's tavern and
  Stewart's drug store, White's, Linn's, Gazley's and Kelsey's stores, Fitchett & Gill's tavern — and every other trade
  takes the next of the town's ordinary houses. The building is labelled with the trade.
- **Names**: a keeper's trade shows as soon as the town is drawn; a building's own documented name only when close.
- `ceiling:` each anchor but Liberty's puts the town's central documented feature on the official point; Liberty's frame is
  tied to the ground by its 1968 Plaza Constitucional marker (tested to 120 ft). Measuring each frame against its markers
  would place the others as well.
- `ceiling:` buildings are drawn four times the height the research gives them (`DRAWN_HEIGHT`), so a town reads at a
  student's walking zoom.
- `ceiling:` a class made before this keeps its shops' own sprites in its saved map, and draws them on top of the new town.
- **The other eight, drawn the same day**: Washington (one street, a staked grid, the ferry on its bench), Brazoria (a
  frontage on Main along the bank; its map point moved to Old Town, `HIST-TEX-046`), Velasco (six buildings in two
  fenced enclosures and the derelict round fort), Harrisburg (survey lines, about twenty houses and the steam mills),
  Anahuac (the brick fort a ruin on the bluff, the town a scatter half a mile north of it), Nacogdoches (the Camino Real,
  the turned plaza, the Stone House, old houses of logs and mud), Refugio (the plat's lines round an empty plaza, the
  mission a ruin in its walled churchyard) and Goliad (the presidio's breached limestone walls, the chapel, the town a
  scatter against the walls, Espíritu Santo a ruin across the river). Each of these has a measured origin. A layout may
  carry `walls` (pieces along a line, with breaches) and squares with measured corner `points`. These places have no
  keepers. Go to… frames a drawn town on the middle of its buildings.
- Tests `tests/towns.test.mjs` (5, each proven by injection); browser `npm run test:towns`
  ([evidence](evidence/towns-browser.json), a wide and a close screenshot of each town).

## 6. Stored, and old classes

`household.gear` (`shoes`, `saddle`, `wagon`, `blankets`), `household.rifle.shots` and `household.resources.hides`, each
absent on a class saved before this, which is a family with none. A class saved before has no keepers beyond Gonzales's
old three, and the icon says there are no shops rather than sending anybody to an empty street. No save version moved.

## 7. Ceilings and what is next

- ~~`ceiling:` a new town's shop places are invented and evenly spread round its centre~~ **Done 2026-09-16 for the six
  towns families live near** (§5b); the other eight places on the map still draw as a single building.
- `ceiling:` a keeper never runs out of goods, only of coin; nothing a family buys is taken from anybody else.
- `ceiling:` the tavern hears only what is already public; it does not yet start rumors of its own.
- `ceiling:` the weaver sells blankets but no cloth, and nobody wears what they buy on the map.
- ~~The automatic neighbours do not use the shops yet.~~ Since 2026-09-24 they buy a rifle again when theirs is lost (§4e), and
  nothing else there: seed, powder and cotton still go by the old errands (`directorOnly`). `ceiling:` they buy no animals.
