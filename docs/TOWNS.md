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

## 6. Stored, and old classes

`household.gear` (`shoes`, `saddle`, `wagon`, `blankets`), `household.rifle.shots` and `household.resources.hides`, each
absent on a class saved before this, which is a family with none. A class saved before has no keepers beyond Gonzales's
old three, and the icon says there are no shops rather than sending anybody to an empty street. No save version moved.

## 7. Ceilings and what is next

- `ceiling:` shops are not drawn as buildings of their own; the keepers stand near the town's existing buildings. The town
  layouts from the research (`docs/town-research/`) are where each shop's building belongs, with art requested there.
- `ceiling:` a keeper never runs out of goods, only of coin; nothing a family buys is taken from anybody else.
- `ceiling:` the tavern hears only what is already public; it does not yet start rumors of its own.
- `ceiling:` the weaver sells blankets but no cloth, and nobody wears what they buy on the map.
- The automatic neighbours do not use the shops yet.
