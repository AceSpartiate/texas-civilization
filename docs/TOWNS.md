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
| **Gonzales** | blacksmith (Josiah Pike, who was always there), gunsmith, doctor, tavern, tanner, wheelwright, mill, weaver | Every class on the invented country has only Gonzales. **Invented**: no 1835 Gonzales trade list was found; a municipality of about 900 (`HIST-TEX-011`) is given the street Brazoria documents. |
| **San Felipe** | the same eight | The colony's capital; taverns, a hotel and a blacksmith documented. |
| **Columbia** | blacksmith, gunsmith, doctor, tavern, tanner, wheelwright, weaver | Hotel and tavern documented; the lower Brazos's trades. |
| **Mina** | blacksmith, gunsmith, tavern | Hotel and gunsmith remembered; its mill came in 1838. |
| **Liberty**, **Matagorda** | blacksmith, tavern | Small. |
| **Victoria** | blacksmith | Small. |

A settlement no family is dealt near has no keepers. `TOWN_TRADES` and `KEEPERS` in `sim/shops.mjs` hold the table.

## 4. What each trade does

Every offer says what it does before it is chosen and is refused in words when it cannot be done. A shop that sells takes
coin **or** food; a shop that buys pays coin from its keeper's purse (a real for each family near the town) **or** food.
Coin in either direction is in the ending's account.

| Trade | Offers | Does |
| --- | --- | --- |
| **Blacksmith** | felling axe 3 reales / 6 food; auger 2 / 4; broadaxe 3 / 6; froe 1 / 2 | The tool, once. The auger is what most furniture wants. |
| **Gunsmith** | powder and lead 2 / 4 | Five powder. |
| | the rifle put in order 2 / 4 | For the next ten shots, a hand without the knack makes the long shot; a tired hand still misses. Said on the shot. |
| **Doctor** | see the doctor 2 / 3 | Tired: well at once. Hurt: mends in half the time left. Refused for somebody well. |
| **Tavern** | a meal and the talk 1 / 1 | Eight miles off the legs, and the family learns every public report it has not had, as *Talk at the tavern*. |
| **Tanner, saddler, cobbler** | sell hides, 1 real or 2 food each | A deer taken brings a hide home. |
| | shoes 2 / 4 | A mile on foot tires the family 15% less. |
| | a saddle 3 / 6 | A mile on the horse tires the rider a quarter less. Refused with no horse. |
| **Wheelwright** | the wagon put in good order 2 / 4 | The ox and wagon go 15% faster. Refused with no wagon. |
| **Mill** | have corn ground (the miller's toll is taken in meal) | The food carried goes a fifth further. |
| **Weaver** | sell cotton, 1 real or 3 food a whole bale | More food a bale than the store's two. |
| | blankets 1 / 2 | Sleeping by the wagon mends a quarter better. |

## 5. How a student uses it

The **Go to a shop** icon on a person's row sends them to the family's own town. On the street they are asked which
shop, from the shops standing there; at the counter, what to buy or sell. Nobody answering comes home having spent
nothing. The keepers stand at their doors in the town and are seen, like anybody, only when one of the family is there.

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
- Not yet drawn: Washington, Brazoria, Velasco, Harrisburg, Anahuac, Nacogdoches, Refugio and Goliad, each with its sketch
  ready in `docs/town-research/`.
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
- The automatic neighbours do not use the shops yet.
